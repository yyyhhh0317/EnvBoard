// 变更历史管理 hook：记录编辑操作，支持撤销/重做
import { useCallback, useReducer, useRef } from 'react'
import type { EnvVariable, HistoryEntry, HistoryAction } from '../types'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

const MAX_HISTORY = 50

interface HistoryState {
  history: HistoryEntry[]
  cursor: number
}

export function useHistory() {
  // 用 ref 作为唯一数据源，避免 React state 批处理导致的 cursor/history 不一致
  const stateRef = useRef<HistoryState>({ history: [], cursor: -1 })
  // 强制重新渲染
  const [, forceUpdate] = useReducer((x: number) => x + 1, 0)

  // 深拷贝变量快照（防止后续修改污染历史）
  function snapshot(vars: EnvVariable[]): EnvVariable[] {
    return vars.map((v) => ({ ...v }))
  }

  /** 记录一次操作 */
  const record = useCallback(
    (
      action: HistoryAction,
      description: string,
      before: EnvVariable[],
      after: EnvVariable[],
      variableKey?: string,
    ) => {
      const entry: HistoryEntry = {
        id: genId(),
        action,
        description,
        timestamp: Date.now(),
        variableKey,
        before: snapshot(before),
        after: snapshot(after),
      }
      const prev = stateRef.current
      const lastIdx = prev.history.length - 1
      const truncated = prev.cursor < lastIdx
        ? prev.history.slice(0, prev.cursor + 1)
        : prev.history
      const next = [...truncated, entry].slice(-MAX_HISTORY)
      stateRef.current = { history: next, cursor: next.length - 1 }
      forceUpdate()
    },
    [],
  )

  /** 撤销，返回应恢复的变量快照（null 表示不可撤销） */
  const undo = useCallback((): EnvVariable[] | null => {
    const s = stateRef.current
    if (s.cursor < 0) return null
    const entry = s.history[s.cursor]
    if (!entry || !entry.before) return null
    stateRef.current = { ...s, cursor: s.cursor - 1 }
    forceUpdate()
    return entry.before
  }, [])

  /** 重做，返回应恢复的变量快照（null 表示不可重做） */
  const redo = useCallback((): EnvVariable[] | null => {
    const s = stateRef.current
    if (s.cursor >= s.history.length - 1) return null
    const entry = s.history[s.cursor + 1]
    if (!entry) return null
    stateRef.current = { ...s, cursor: s.cursor + 1 }
    forceUpdate()
    return entry.after
  }, [])

  const canUndo = stateRef.current.cursor >= 0
  const canRedo = stateRef.current.cursor < stateRef.current.history.length - 1

  /** 清空历史 */
  const clearHistory = useCallback(() => {
    stateRef.current = { history: [], cursor: -1 }
    forceUpdate()
  }, [])

  return {
    history: stateRef.current.history,
    cursor: stateRef.current.cursor,
    canUndo,
    canRedo,
    record,
    undo,
    redo,
    clearHistory,
    __stateRef: stateRef,
  }
}
