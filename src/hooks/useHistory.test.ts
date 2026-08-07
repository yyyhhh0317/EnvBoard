import { describe, it, expect } from 'vitest'
import { renderHook, act } from '@testing-library/react'
import { useHistory } from './useHistory'
import type { EnvVariable } from '../types'

function makeVar(key: string, value: string, id = key): EnvVariable {
  return {
    id,
    key,
    value,
    comment: '',
    isSensitive: false,
    isDisabled: false,
    isModified: false,
    isNew: false,
    error: null,
    line: 0,
  }
}

describe('useHistory', () => {
  it('starts empty with no undo/redo', () => {
    const { result } = renderHook(() => useHistory())
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
    expect(result.current.undo()).toBeNull()
    expect(result.current.redo()).toBeNull()
  })

  it('records an action and enables undo', () => {
    const { result } = renderHook(() => useHistory())
    const before = [makeVar('A', '1')]
    const after = [makeVar('A', '2')]
    act(() => result.current.record('edit', '编辑 A', before, after, 'A'))
    expect(result.current.canUndo).toBe(true)
    expect(result.current.canRedo).toBe(false)
    expect(result.current.history).toHaveLength(1)
  })

  it('undo restores the before snapshot', () => {
    const { result } = renderHook(() => useHistory())
    const before = [makeVar('A', '1')]
    const after = [makeVar('A', '2')]
    act(() => result.current.record('edit', '编辑 A', before, after, 'A'))
    let snap: EnvVariable[] | null = null
    act(() => {
      snap = result.current.undo()
    })
    expect(snap).toEqual(before)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(true)
  })

  it('redo restores the after snapshot', () => {
    const { result } = renderHook(() => useHistory())
    const before = [makeVar('A', '1')]
    const after = [makeVar('A', '2')]
    act(() => result.current.record('edit', '编辑 A', before, after, 'A'))
    act(() => result.current.undo())
    let snap: EnvVariable[] | null = null
    act(() => {
      snap = result.current.redo()
    })
    expect(snap).toEqual(after)
    expect(result.current.canRedo).toBe(false)
    expect(result.current.canUndo).toBe(true)
  })

  it('recording after undo truncates the redo branch', () => {
    const { result } = renderHook(() => useHistory())
    act(() => result.current.record('edit', 'a', [makeVar('A', '1')], [makeVar('A', '2')]))
    act(() => result.current.record('edit', 'b', [makeVar('A', '2')], [makeVar('A', '3')]))
    act(() => result.current.undo()) // back to state "2"
    // new record at state "2" should drop the "3" branch
    act(() => result.current.record('edit', 'c', [makeVar('A', '2')], [makeVar('A', '9')]))
    expect(result.current.history).toHaveLength(2)
    expect(result.current.canRedo).toBe(false)
    // undo twice to reach the very first state
    act(() => result.current.undo())
    act(() => result.current.undo())
    expect(result.current.canUndo).toBe(false)
  })

  it('clearHistory empties the stack', () => {
    const { result } = renderHook(() => useHistory())
    act(() => result.current.record('add', 'add', [], [makeVar('A', '1')]))
    act(() => result.current.clearHistory())
    expect(result.current.history).toHaveLength(0)
    expect(result.current.canUndo).toBe(false)
    expect(result.current.canRedo).toBe(false)
  })

  it('caps history at MAX_HISTORY (50) entries', () => {
    const { result } = renderHook(() => useHistory())
    act(() => {
      for (let i = 0; i < 60; i++) {
        result.current.record('edit', `step ${i}`, [makeVar('A', String(i))], [makeVar('A', String(i + 1))])
      }
    })
    expect(result.current.history.length).toBeLessThanOrEqual(50)
  })
})
