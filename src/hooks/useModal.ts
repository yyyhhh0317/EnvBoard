// 弹窗焦点管理 hook（a11y v1.1.0）
// 职责：
//  - 打开时记录打开前的焦点元素，聚焦弹窗内第一个可聚焦元素
//  - Tab / Shift+Tab 在弹窗内循环（焦点圈定）
//  - Escape 关闭弹窗
//  - 关闭（卸载）时恢复焦点到打开前的元素
//  - 打开期间锁定 body 滚动
import { useEffect, useRef } from 'react'

export function useModalFocus(open: boolean, close: () => void) {
  const containerRef = useRef<HTMLDivElement>(null)
  const closeRef = useRef(close)
  const restoreRef = useRef<HTMLElement | null>(null)

  // close 可能是内联箭头函数（每次渲染新引用），用 ref 持有避免 effect 反复执行
  closeRef.current = close

  useEffect(() => {
    if (!open) return
    restoreRef.current = document.activeElement as HTMLElement | null
    document.body.style.overflow = 'hidden'

    const container = containerRef.current
    const focusable = (el: HTMLElement | null): HTMLElement[] => {
      if (!el) return []
      return Array.from(
        el.querySelectorAll<HTMLElement>(
          'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])',
        ),
      )
    }

    // 聚焦弹窗内第一个可聚焦元素（延迟到渲染完成）
    const timer = window.setTimeout(() => focusable(container)[0]?.focus(), 0)

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault()
        closeRef.current()
        return
      }
      if (e.key === 'Tab') {
        const items = focusable(container)
        if (items.length === 0) return
        const first = items[0]
        const last = items[items.length - 1]
        const active = document.activeElement as HTMLElement | null
        if (e.shiftKey && active === first) {
          e.preventDefault()
          last.focus()
        } else if (!e.shiftKey && active === last) {
          e.preventDefault()
          first.focus()
        }
      }
    }
    window.addEventListener('keydown', onKey)

    return () => {
      window.clearTimeout(timer)
      window.removeEventListener('keydown', onKey)
      document.body.style.overflow = ''
      // 恢复焦点到打开前的元素（延迟到 DOM 更新后，避免目标已卸载）
      window.setTimeout(() => restoreRef.current?.focus(), 0)
    }
  }, [open])

  return containerRef
}
