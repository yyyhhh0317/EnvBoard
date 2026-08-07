// @vitest-environment node
// node 环境自带 crypto.subtle；localStorage 需显式 mock
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  },
  configurable: true,
})

import { beforeEach, describe, expect, it } from 'vitest'
import type { EnvVariable, MultiEnvParseResult } from '../../types'
import { clearSession, loadSession, persistSession, type SessionState } from './sessionStore'

function makeVar(key: string, value: string, id = key, isSensitive = false): EnvVariable {
  return {
    id,
    key,
    value,
    comment: '',
    isSensitive,
    isDisabled: false,
    isModified: false,
    isNew: false,
    error: null,
    line: 0,
  }
}

const SESSION_KEY = 'envboard.session.v1'

function baseState(): SessionState {
  return {
    projectType: 'env',
    filename: '.env',
    variables: [],
    depResult: null,
    multiEnv: null,
    activeEnv: null,
    customEnvs: [],
    templateVars: [],
  }
}

beforeEach(() => store.clear())

describe('sessionStore', () => {
  it('roundtrips a simple session', async () => {
    const state = baseState()
    state.variables = [
      makeVar('PORT', '8080'),
      makeVar('DB_URL', 'postgres://localhost:5432'),
      makeVar('DB_PASSWORD', 's3cret-value', 'pw1', true),
    ]
    await persistSession(state)
    const loaded = await loadSession()
    expect(loaded).toEqual(state)
  })

  it('does not store sensitive values in plaintext', async () => {
    const state = baseState()
    state.variables = [makeVar('API_TOKEN', 'tok-1234567890', 't1', true)]
    await persistSession(state)
    const raw = store.get(SESSION_KEY) ?? ''
    expect(raw).not.toContain('tok-1234567890')
    // 非敏感值仍以明文保留（便于排查），敏感值 id 可见、值已加密
    expect(raw).toContain('t1')
  })

  it('roundtrips multi-env session with sensitive values in every env', async () => {
    const state = baseState()
    state.multiEnv = {
      envOrder: ['development', 'production'],
      envs: {
        development: [makeVar('API_TOKEN', 'dev-token', 'd1', true), makeVar('PORT', '3000', 'd2')],
        production: [makeVar('API_TOKEN', 'prod-token', 'p1', true)],
      },
      errors: [],
      filename: '.env',
      hasSegments: true,
    } as MultiEnvParseResult
    state.activeEnv = 'development'
    await persistSession(state)
    const loaded = await loadSession()
    expect(loaded).not.toBeNull()
    expect(loaded!.multiEnv?.envs.development).toEqual(state.multiEnv.envs.development)
    expect(loaded!.multiEnv?.envs.production).toEqual(state.multiEnv.envs.production)
    const raw = store.get(SESSION_KEY) ?? ''
    expect(raw).not.toContain('dev-token')
    expect(raw).not.toContain('prod-token')
  })

  it('roundtrips dependency mode session', async () => {
    const state = baseState()
    state.projectType = 'npm'
    state.filename = 'package.json'
    state.depResult = {
      type: 'npm',
      dependencies: [
        { id: 'r1', name: 'react', versionSpec: '^18.3.1', category: 'dependencies', line: 1 },
      ],
      meta: { name: 'demo', version: '1.0.0' },
      errors: [],
      filename: 'package.json',
    }
    await persistSession(state)
    const loaded = await loadSession()
    expect(loaded).toEqual(state)
  })

  it('returns null when no session exists', async () => {
    expect(await loadSession()).toBeNull()
  })

  it('returns null and cleans up on version mismatch', async () => {
    store.set(SESSION_KEY, JSON.stringify({ version: 999, projectType: null, filename: null }))
    expect(await loadSession()).toBeNull()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('returns null and cleans up when data cannot be decrypted', async () => {
    // 先正常保存一个含敏感值的会话
    const state = baseState()
    state.variables = [makeVar('SECRET', 'value', 's1', true)]
    await persistSession(state)
    // 篡改密文（改掉 data base64 的最后一个字符），GCM 校验失败 → 整体降级为 null
    const raw = store.get(SESSION_KEY) ?? ''
    const parsed = JSON.parse(raw)
    const data = parsed.encrypted.s1.data as string
    parsed.encrypted.s1.data = data.slice(0, -1) + (data.endsWith('A') ? 'B' : 'A')
    store.set(SESSION_KEY, JSON.stringify(parsed))
    expect(await loadSession()).toBeNull()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
  })

  it('clearSession removes the stored session but keeps the key', async () => {
    const state = baseState()
    state.variables = [makeVar('A', '1')]
    await persistSession(state)
    expect(localStorage.getItem(SESSION_KEY)).toBeTruthy()
    clearSession()
    expect(localStorage.getItem(SESSION_KEY)).toBeNull()
    expect(localStorage.getItem('envboard.session-key.v1')).toBeTruthy()
  })

  it('sensitive value with empty string is left untouched', async () => {
    const state = baseState()
    state.variables = [makeVar('EMPTY_SECRET', '', 'e1', true)]
    await persistSession(state)
    const loaded = await loadSession()
    expect(loaded).toEqual(state)
  })
})
