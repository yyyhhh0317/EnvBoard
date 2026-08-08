import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import { EnvImport } from './EnvImport'
import { renderWithI18n } from '../../test-utils'

describe('EnvImport', () => {
  it('默认展示上传模式与提示', () => {
    const { getByText } = renderWithI18n(<EnvImport onImport={() => {}} />)
    expect(getByText('上传文件')).toBeTruthy()
    expect(getByText('点击选择文件，或拖拽到此处')).toBeTruthy()
  })

  it('切换到粘贴模式后输入并解析，触发 onImport（推断 .env 文件名）', () => {
    const onImport = vi.fn()
    const { getByText, getByPlaceholderText } = renderWithI18n(<EnvImport onImport={onImport} />)
    fireEvent.click(getByText('粘贴文本'))

    const textarea = getByPlaceholderText(/# 粘贴配置文件内容/)
    fireEvent.change(textarea, { target: { value: 'FOO=bar\nBAZ=qux' } })

    fireEvent.click(getByText('解析'))
    expect(onImport).toHaveBeenCalledTimes(1)
    expect(onImport).toHaveBeenCalledWith('FOO=bar\nBAZ=qux', 'pasted.env')
  })

  it('空内容点击解析不触发 onImport', () => {
    const onImport = vi.fn()
    const { getByText } = renderWithI18n(<EnvImport onImport={onImport} />)
    fireEvent.click(getByText('粘贴文本'))
    // 解析按钮禁用（内容为空）
    const parseBtn = getByText('解析').closest('button')
    expect(parseBtn?.hasAttribute('disabled')).toBe(true)
    fireEvent.click(parseBtn!)
    expect(onImport).not.toHaveBeenCalled()
  })
})
