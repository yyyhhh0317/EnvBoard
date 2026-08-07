import { describe, it, expect } from 'vitest'
import type { EnvVariable } from '../../types'
import { diffEnvs, summarizeDiff } from './envDiff'

function makeVar(key: string, value: string, disabled = false): EnvVariable {
  return {
    id: key,
    key,
    value,
    comment: '',
    isSensitive: false,
    isDisabled: disabled,
    isModified: false,
    isNew: false,
    error: null,
    line: 0,
  }
}

describe('diffEnvs', () => {
  it('marks same / different / partial-missing', () => {
    const envs = {
      development: [makeVar('A', '1'), makeVar('B', '2')],
      production: [makeVar('A', '1'), makeVar('B', '3')],
      staging: [makeVar('A', '1')],
    }
    const items = diffEnvs(envs, ['development', 'production', 'staging'])
    const byKey = Object.fromEntries(items.map((i) => [i.key, i.status]))
    expect(byKey).toEqual({ A: 'same', B: 'partial-missing' })
  })

  it('empty value vs non-empty is different, not same', () => {
    const envs = {
      dev: [makeVar('K', '')],
      prod: [makeVar('K', 'v')],
    }
    const items = diffEnvs(envs, ['dev', 'prod'])
    expect(items[0].status).toBe('different')
  })

  it('ignores disabled variables', () => {
    const envs = {
      dev: [makeVar('K', '1'), makeVar('X', '2', true)],
      prod: [makeVar('K', '1')],
    }
    const items = diffEnvs(envs, ['dev', 'prod'])
    expect(items.map((i) => i.key)).toEqual(['K'])
  })

  it('reports presentIn / missingIn', () => {
    const envs = { dev: [makeVar('K', '1')], prod: [] }
    const items = diffEnvs(envs, ['dev', 'prod'])
    expect(items[0].presentIn).toEqual(['dev'])
    expect(items[0].missingIn).toEqual(['prod'])
  })

  it('summarizeDiff counts statuses', () => {
    const envs = {
      dev: [makeVar('A', '1'), makeVar('B', '1')],
      prod: [makeVar('A', '2')],
    }
    const summary = summarizeDiff(diffEnvs(envs, ['dev', 'prod']))
    expect(summary.total).toBe(2)
    expect(summary.different).toBe(1)
    expect(summary.partialMissing).toBe(1)
    expect(summary.same).toBe(0)
  })
})
