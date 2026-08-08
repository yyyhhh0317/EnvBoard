import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { Header } from './Header'
import { renderWithI18n } from '../../test-utils'

describe('Header', () => {
  it('渲染品牌与副标题（默认中文）', () => {
    const { getByText } = renderWithI18n(
      <Header theme="light" onToggleTheme={() => {}} filename={null} variableCount={0} />,
    )
    expect(getByText('EnvBoard')).toBeTruthy()
    expect(getByText('环境配置可视化管理')).toBeTruthy()
  })

  it('点击主题按钮触发 onToggleTheme', () => {
    const onToggleTheme = vi.fn()
    const { getByLabelText } = renderWithI18n(
      <Header theme="light" onToggleTheme={onToggleTheme} filename={null} variableCount={0} />,
    )
    fireEvent.click(getByLabelText('切换暗色模式'))
    expect(onToggleTheme).toHaveBeenCalledTimes(1)
  })

  it('语言切换按钮初始显示 EN（当前 zh），点击后显示中', () => {
    const { getByRole } = renderWithI18n(
      <Header theme="light" onToggleTheme={() => {}} filename={null} variableCount={0} />,
    )
    const btn = getByRole('button', { name: '切换语言（中文 / English）' })
    expect(btn.textContent).toBe('EN')
    fireEvent.click(btn)
    expect(btn.textContent).toBe('中')
  })

  it('传入 filename 时显示文件名与变量数', () => {
    const { getByText } = renderWithI18n(
      <Header theme="dark" onToggleTheme={() => {}} filename=".env" variableCount={3} />,
    )
    expect(getByText(/.env/)).toBeTruthy()
    expect(getByText(/3 项/)).toBeTruthy()
  })
})
