import { describe, it, expect } from 'vitest'
import type { EnvVariable } from '../../types'
import { exportMultiEnvAsFiles, exportMultiEnvAsSingle } from './multiEnvExporter'

function makeVar(key: string, value: string, opts: Partial<EnvVariable> = {}): EnvVariable {
  return {
    id: key,
    key,
    value,
    comment: '',
    isSensitive: false,
    isDisabled: false,
    isModified: false,
    isNew: false,
    error: null,
    line: 0,
    ...opts,
  }
}

describe('exportMultiEnvAsSingle', () => {
  it('emits @env segments in order', () => {
    const envs = {
      development: [makeVar('PORT', '3000')],
      production: [makeVar('PORT', '8080', { comment: '生产端口' })],
    }
    const out = exportMultiEnvAsSingle(envs, ['development', 'production'])
    expect(out).toContain('# @env development')
    expect(out).toContain('PORT=3000')
    expect(out).toContain('# @env production')
    expect(out).toContain('# 生产端口')
    expect(out).toContain('PORT=8080')
    // development 段在 production 段之前
    expect(out.indexOf('# @env development')).toBeLessThan(out.indexOf('# @env production'))
  })

  it('quotes values with spaces or space+#', () => {
    const envs = { dev: [makeVar('A', 'hello world'), makeVar('B', 'x #y')] }
    const out = exportMultiEnvAsSingle(envs, ['dev'])
    expect(out).toContain('A="hello world"')
    expect(out).toContain('B="x #y"')
  })

  it('marks disabled vars with # prefix', () => {
    const envs = { dev: [makeVar('K', 'v', { isDisabled: true })] }
    const out = exportMultiEnvAsSingle(envs, ['dev'])
    expect(out).toContain('# K=v')
  })
})

describe('exportMultiEnvAsFiles', () => {
  it('produces one file per env with proper names', () => {
    const envs = { dev: [makeVar('A', '1')], prod: [makeVar('A', '2')] }
    const files = exportMultiEnvAsFiles(envs, ['dev', 'prod'])
    expect(files.map((f) => f.filename)).toEqual(['.env.dev', '.env.prod'])
    expect(files[0].content).toContain('A=1')
    expect(files[1].content).toContain('A=2')
  })
})
