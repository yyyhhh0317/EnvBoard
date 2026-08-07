// 会话持久化 hook：提供 restore（挂载时恢复）/ persist（自动保存）/ clear（清空）
import { useCallback, useState } from 'react'
import { clearSession, loadSession, persistSession, type SessionState } from '../utils/persistence/sessionStore'

export function useSessionPersistence() {
  // hydrated：是否已完成挂载恢复。恢复完成前禁止自动保存，避免空状态覆盖已存会话
  const [hydrated, setHydrated] = useState(false)

  /** 读取并恢复会话（无会话返回 null） */
  const restore = useCallback(async (): Promise<SessionState | null> => {
    return loadSession()
  }, [])

  /** 保存会话；失败静默（存储层已吞掉异常） */
  const persist = useCallback(async (state: SessionState) => {
    await persistSession(state)
  }, [])

  /** 清除已保存会话 */
  const clear = useCallback(() => {
    clearSession()
  }, [])

  return { hydrated, setHydrated, restore, persist, clear }
}
