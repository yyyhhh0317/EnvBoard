import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import type { EnvVariable } from '../../types'
import { SecretScanPanel } from './SecretScanPanel'
import { renderWithI18n } from '../../test-utils'

function makeVar(key: string, value: string, id: string, isSensitive = true): EnvVariable {
  return {
    id,
    key,
    value,
    comment: '',
    isSensitive,
    isDisabled: false,
    isModified: false,
    isNew: false,
    error: null,
    line: 1,
  }
}

describe('SecretScanPanel', () => {
  it('无泄露时显示「未发现」', () => {
    const { getByText } = renderWithI18n(
      <SecretScanPanel variables={[makeVar('PORT', '3000', 'v1', false)]} onClear={() => {}} onClearAll={() => {}} />,
    )
    expect(getByText('未发现')).toBeTruthy()
  })

  it('检测到泄露时显示数量并自动展开', () => {
    const { getByText } = renderWithI18n(
      <SecretScanPanel
        variables={[makeVar('AWS_KEY', 'AKIA' + 'A'.repeat(16), 'v1')]}
        onClear={() => {}}
        onClearAll={() => {}}
      />,
    )
    expect(getByText(/1 处疑似泄露/)).toBeTruthy()
    expect(getByText('清除值')).toBeTruthy()
  })

  it('点击清除按钮触发 onClear（带变量 id）', () => {
    const onClear = vi.fn()
    const { getByText } = renderWithI18n(
      <SecretScanPanel
        variables={[makeVar('GITHUB_TOKEN', 'ghp_' + 'a'.repeat(36), 'v1')]}
        onClear={onClear}
        onClearAll={() => {}}
      />,
    )
    fireEvent.click(getByText('清除值'))
    expect(onClear).toHaveBeenCalledWith('v1')
  })

  it('一键清除全部触发 onClearAll', () => {
    const onClearAll = vi.fn()
    const { getByText } = renderWithI18n(
      <SecretScanPanel
        variables={[makeVar('TOKEN', 'npm_' + 'a'.repeat(36), 'v1'), makeVar('SECRET', 'sk_' + 'a'.repeat(30), 'v2')]}
        onClear={() => {}}
        onClearAll={onClearAll}
      />,
    )
    fireEvent.click(getByText(/一键清除全部/))
    expect(onClearAll).toHaveBeenCalledTimes(1)
  })
})
