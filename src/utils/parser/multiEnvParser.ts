// 多环境解析器：支持单文件分段（# @env <name>）与多文件导入
import type { EnvVariable, MultiEnvParseResult, EnvName } from '../../types'
import { parseEnvFile } from './envParser'
import { detectEnvFromFilename, PRESET_ENV_NAMES } from './envPresets'

/** 环境分段标记正则：# @env development 或 # @env dev */
const ENV_SEGMENT_RE = /^#\s*@env\s+([a-z0-9_-]+)\s*$/i

/**
 * 解析单文件多环境分段。
 * 约定：用 `# @env <name>` 标记分段头，其后变量归属该环境，
 * 直到遇到下一个 @env 标记或文件结束。
 * 若没有任何 @env 标记，返回 hasSegments=false，调用方可按普通 .env 处理。
 */
export function parseMultiEnvFile(content: string, filename: string): MultiEnvParseResult {
  const errors: string[] = []
  const envOrder: EnvName[] = []
  const envs: Record<EnvName, EnvVariable[]> = {}

  if (!content || !content.trim()) {
    errors.push('文件内容为空')
    return { envOrder, envs, errors, filename, hasSegments: false }
  }

  // 移除 BOM
  const text = content.replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/)

  // 先检测是否包含 @env 标记
  const hasSegments = lines.some((l) => ENV_SEGMENT_RE.test(l.trim()))

  // 无分段标记：整体作为单个「默认」环境
  if (!hasSegments) {
    const result = parseEnvFile(content, filename)
    return {
      envOrder: [],
      envs: {},
      errors: result.errors,
      filename,
      hasSegments: false,
    }
  }

  // 有分段标记：按 @env 切分
  let currentEnv: EnvName | null = null
  let currentBuffer: string[] = []

  const flush = () => {
    if (currentEnv === null) return
    if (!envOrder.includes(currentEnv)) {
      envOrder.push(currentEnv)
      envs[currentEnv] = []
    }
    if (currentBuffer.length === 0) return
    const subResult = parseEnvFile(currentBuffer.join('\n'), `${filename}#${currentEnv}`)
    envs[currentEnv].push(...subResult.variables)
    if (subResult.errors.length > 0) {
      errors.push(...subResult.errors.map((e) => `[${currentEnv}] ${e}`))
    }
    currentBuffer = []
  }

  for (const raw of lines) {
    const stripped = raw.trim()
    const m = stripped.match(ENV_SEGMENT_RE)
    if (m) {
      flush()
      currentEnv = m[1].toLowerCase()
      continue
    }
    if (currentEnv === null) {
      // 分段前的内容：忽略空行与注释，其他视为无效
      if (stripped === '' || stripped.startsWith('#')) continue
      errors.push(`分段标记前的内容被忽略：${stripped}`)
      continue
    }
    currentBuffer.push(raw)
  }
  flush()

  // 重排顺序：预设环境在前（按 PRESET_ENVS 顺序），自定义在后
  envOrder.sort((a, b) => {
    const ai = Array.from(PRESET_ENV_NAMES).indexOf(a)
    const bi = Array.from(PRESET_ENV_NAMES).indexOf(b)
    if (ai !== -1 && bi !== -1) return ai - bi
    if (ai !== -1) return -1
    if (bi !== -1) return 1
    return a.localeCompare(b)
  })

  return { envOrder, envs, errors, filename, hasSegments: true }
}

/**
 * 合并多次解析结果（多文件导入场景）。
 * 每个文件根据文件名识别环境，合并到同一 envs 结构。
 */
export function mergeMultiEnvResults(
  results: { content: string; filename: string }[],
): MultiEnvParseResult {
  const envOrder: EnvName[] = []
  const envs: Record<EnvName, EnvVariable[]> = {}
  const errors: string[] = []
  let primaryFilename = ''

  for (const { content, filename } of results) {
    if (!primaryFilename) primaryFilename = filename
    // 先尝试单文件多环境解析
    const multi = parseMultiEnvFile(content, filename)
    if (multi.hasSegments) {
      for (const envName of multi.envOrder) {
        if (!envOrder.includes(envName)) {
          envOrder.push(envName)
          envs[envName] = []
        }
        envs[envName].push(...multi.envs[envName])
      }
      errors.push(...multi.errors)
    } else {
      // 单文件无分段：按文件名识别环境
      const envName = detectEnvFromFilename(filename)
      if (envName) {
        if (!envOrder.includes(envName)) {
          envOrder.push(envName)
          envs[envName] = []
        }
        const single = parseEnvFile(content, filename)
        envs[envName].push(...single.variables)
        errors.push(...single.errors)
      } else {
        // 无法识别环境：作为默认环境
        const fallback = 'default'
        if (!envOrder.includes(fallback)) {
          envOrder.push(fallback)
          envs[fallback] = []
        }
        const single = parseEnvFile(content, filename)
        envs[fallback].push(...single.variables)
        errors.push(...single.errors)
        errors.push(`无法从文件名 "${filename}" 识别环境，归入 default`)
      }
    }
  }

  return {
    envOrder,
    envs,
    errors,
    filename: primaryFilename,
    hasSegments: envOrder.length > 1,
  }
}
