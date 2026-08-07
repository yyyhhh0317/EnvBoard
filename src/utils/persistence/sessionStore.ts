// 会话持久化：把当前编辑会话保存到 localStorage（本地），刷新/重开浏览器后自动恢复
// 隐私策略：
//  - 数据只写浏览器本地，不产生任何网络请求
//  - isSensitive 变量的值在落盘前用 AES-GCM 加密（见 crypto.ts），本地存储不出现明文密钥
//  - 解密失败（密钥丢失/数据被篡改）时安全降级：丢弃会话，回到空状态
//  - 会话带 schema 版本号，未来结构变化时自动废弃旧数据

import type {
  DependencyParseResult,
  EnvName,
  EnvVariable,
  MultiEnvParseResult,
  ProjectType,
  TemplateVariable,
} from '../../types'
import {
  decryptValue,
  encryptValue,
  exportKey,
  generateKey,
  importKey,
  type EncryptedValue,
} from './crypto'

const SESSION_KEY = 'envboard.session.v1'
const KEY_STORE_KEY = 'envboard.session-key.v1'
const SESSION_VERSION = 1

/** 需要持久化的完整会话状态 */
export interface SessionState {
  projectType: ProjectType | null
  filename: string | null
  variables: EnvVariable[]
  depResult: DependencyParseResult | null
  multiEnv: MultiEnvParseResult | null
  activeEnv: EnvName | null
  customEnvs: EnvName[]
  templateVars: TemplateVariable[]
}

/** 落盘结构：敏感值已置空，密文按变量 id 存放在 encrypted 映射中 */
interface PersistedSession {
  version: number
  savedAt: number
  projectType: ProjectType | null
  filename: string | null
  variables: EnvVariable[]
  encrypted: Record<string, EncryptedValue>
  depResult: DependencyParseResult | null
  multiEnv: MultiEnvParseResult | null
  activeEnv: EnvName | null
  customEnvs: EnvName[]
  templateVars: TemplateVariable[]
}

// ===== 密钥管理 =====
// 首次使用时生成 AES-GCM 密钥并以 base64 存于 localStorage；之后复用。
async function getKey(): Promise<CryptoKey> {
  const existing = localStorage.getItem(KEY_STORE_KEY)
  if (existing) return importKey(existing)
  const key = await generateKey()
  localStorage.setItem(KEY_STORE_KEY, await exportKey(key))
  return key
}

// ===== 加密辅助 =====
// 将一列变量的敏感值加密后置空，密文收集进 map（按变量 id）
async function blankSensitiveValues(
  vars: EnvVariable[],
  map: Record<string, EncryptedValue>,
  key: CryptoKey,
): Promise<EnvVariable[]> {
  const out: EnvVariable[] = []
  for (const v of vars) {
    if (v.isSensitive && v.value) {
      map[v.id] = await encryptValue(v.value, key)
      out.push({ ...v, value: '' })
    } else {
      out.push(v)
    }
  }
  return out
}

// 将密文按变量 id 解密回填。
// 任何一条解密失败（密钥变更/数据损坏）都向上抛出，由 loadSession 整体降级为 null，
// 避免「敏感值静默变为空值」导致用户无感知地导出残缺配置。
async function restoreSensitiveValues(
  vars: EnvVariable[],
  map: Record<string, EncryptedValue>,
  key: CryptoKey,
): Promise<EnvVariable[]> {
  const out: EnvVariable[] = []
  for (const v of vars) {
    const enc = map[v.id]
    out.push(enc ? { ...v, value: await decryptValue(enc, key) } : v)
  }
  return out
}

// 多环境数据同样需要处理每个环境的变量列表
async function blankMultiEnv(
  multiEnv: MultiEnvParseResult,
  map: Record<string, EncryptedValue>,
  key: CryptoKey,
): Promise<MultiEnvParseResult> {
  const envs: Record<string, EnvVariable[]> = {}
  for (const name of multiEnv.envOrder) {
    envs[name] = await blankSensitiveValues(multiEnv.envs[name] ?? [], map, key)
  }
  return { ...multiEnv, envs }
}

async function restoreMultiEnv(
  multiEnv: MultiEnvParseResult,
  map: Record<string, EncryptedValue>,
  key: CryptoKey,
): Promise<MultiEnvParseResult> {
  const envs: Record<string, EnvVariable[]> = {}
  for (const name of multiEnv.envOrder) {
    envs[name] = await restoreSensitiveValues(multiEnv.envs[name] ?? [], map, key)
  }
  return { ...multiEnv, envs }
}

// ===== 对外 API =====
/** 持久化当前会话（敏感值加密落盘）。存储失败时不抛异常，静默忽略。 */
export async function persistSession(state: SessionState): Promise<void> {
  try {
    const key = await getKey()
    const encrypted: Record<string, EncryptedValue> = {}
    const variables = await blankSensitiveValues(state.variables, encrypted, key)
    const multiEnv = state.multiEnv ? await blankMultiEnv(state.multiEnv, encrypted, key) : null
    const data: PersistedSession = {
      version: SESSION_VERSION,
      savedAt: Date.now(),
      projectType: state.projectType,
      filename: state.filename,
      variables,
      encrypted,
      depResult: state.depResult,
      multiEnv,
      activeEnv: state.activeEnv,
      customEnvs: state.customEnvs,
      templateVars: state.templateVars,
    }
    localStorage.setItem(SESSION_KEY, JSON.stringify(data))
  } catch {
    // 加密或存储失败不阻断应用（如存储配额已满、Web Crypto 不可用）
  }
}

/** 读取并解密会话；无会话 / 版本不匹配 / 解密失败时返回 null（并清理损坏数据） */
export async function loadSession(): Promise<SessionState | null> {
  const raw = localStorage.getItem(SESSION_KEY)
  if (!raw) return null
  try {
    const data = JSON.parse(raw) as PersistedSession
    if (data.version !== SESSION_VERSION) {
      clearSession()
      return null
    }
    const key = await getKey()
    const variables = await restoreSensitiveValues(data.variables, data.encrypted, key)
    const multiEnv = data.multiEnv ? await restoreMultiEnv(data.multiEnv, data.encrypted, key) : null
    return {
      projectType: data.projectType,
      filename: data.filename,
      variables,
      depResult: data.depResult,
      multiEnv,
      activeEnv: data.activeEnv,
      customEnvs: data.customEnvs,
      templateVars: data.templateVars,
    }
  } catch {
    clearSession()
    return null
  }
}

/** 清除已保存的会话（保留密钥，可复用） */
export function clearSession(): void {
  localStorage.removeItem(SESSION_KEY)
}
