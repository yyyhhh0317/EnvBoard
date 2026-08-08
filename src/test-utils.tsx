// 测试共享工具：渲染时包裹 I18nProvider（组件默认语言 zh）
import { render } from '@testing-library/react'
import { beforeEach } from 'vitest'
import type { ReactElement } from 'react'
import { I18nProvider } from './i18n/index.tsx'

// jsdom 的 localStorage 在测试间共享；语言切换测试会写入 lang，
// 这里统一重置，保证每个用例从中文初始状态开始
beforeEach(() => {
  localStorage.clear()
  // jsdom 默认 navigator.language = 'en-US'，会令 detectLang() 返回英文
  Object.defineProperty(navigator, 'language', { value: 'zh-CN', configurable: true })
})

export function renderWithI18n(ui: ReactElement) {
  return render(<I18nProvider>{ui}</I18nProvider>)
}
