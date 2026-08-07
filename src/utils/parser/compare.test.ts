import { describe, it, expect } from 'vitest'
import type { EnvVariable } from '../../types'
import { compareVariables } from './compare'

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

describe('compareVariables', () => {
  it('classifies missing / extra / empty / match', () => {
    const current = [makeVar('A', '1'), makeVar('B', ''), makeVar('C', '3')]
    const example = [makeVar('A', '1'), makeVar('B', '2'), makeVar('D', '4')]
    const result = compareVariables(current, example)
    const byKey = Object.fromEntries(result.map((r) => [r.key, r.status]))
    expect(byKey).toEqual({ A: 'match', B: 'empty', C: 'extra', D: 'missing' })
  })

  it('ignores disabled variables in both sides', () => {
    const current = [makeVar('A', '1'), makeVar('HIDDEN', 'x', true)]
    const example = [makeVar('A', '1'), makeVar('ONLY_EXAMPLE', 'y', true)]
    const result = compareVariables(current, example)
    expect(result).toHaveLength(1)
    expect(result[0].key).toBe('A')
  })

  it('sorts by severity then key', () => {
    const current = [makeVar('Z', '1')]
    const example = [makeVar('A', '2'), makeVar('Z', '1')]
    const result = compareVariables(current, example)
    expect(result[0].key).toBe('A') // missing 排最前
    expect(result[1].key).toBe('Z')
  })

  it('empty current value vs example value marks empty', () => {
    const result = compareVariables([makeVar('K', '  ')], [makeVar('K', 'v')])
    expect(result[0].status).toBe('empty')
    expect(result[0].exampleValue).toBe('v')
  })
})
