import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import type { EnvVariable } from '../../types'
import { EnvEditor } from './EnvEditor'
import { renderWithI18n } from '../../test-utils'

function makeVar(key = 'FOO', value = 'bar', isNew = false): EnvVariable {
  return {
    id: 'e1',
    key,
    value,
    comment: '',
    isSensitive: false,
    isDisabled: false,
    isModified: false,
    isNew,
    error: null,
    line: 1,
  }
}

describe('EnvEditor', () => {
  it('新增模式显示「添加变量」标题', () => {
    const { getByText } = renderWithI18n(
      <EnvEditor variable={makeVar('', '', true)} onSave={() => {}} onClose={() => {}} />,
    )
    expect(getByText('添加变量')).toBeTruthy()
  })

  it('编辑模式显示「编辑变量」标题与当前值', () => {
    const { getByText, getByDisplayValue } = renderWithI18n(
      <EnvEditor variable={makeVar('API_KEY', 'secret')} onSave={() => {}} onClose={() => {}} />,
    )
    expect(getByText('编辑变量')).toBeTruthy()
    expect(getByDisplayValue('API_KEY')).toBeTruthy()
    expect(getByDisplayValue('secret')).toBeTruthy()
  })

  it('修改值后点保存触发 onSave 并携带更新后的变量', () => {
    const onSave = vi.fn()
    const { getByText, getByDisplayValue } = renderWithI18n(
      <EnvEditor variable={makeVar('FOO', 'bar')} onSave={onSave} onClose={() => {}} />,
    )
    fireEvent.change(getByDisplayValue('bar'), { target: { value: 'new-value' } })
    fireEvent.click(getByText('保存'))
    expect(onSave).toHaveBeenCalledTimes(1)
    const saved = onSave.mock.calls[0][0] as EnvVariable
    expect(saved.value).toBe('new-value')
    expect(saved.isModified).toBe(true)
  })

  it('key 为空时保存按钮禁用', () => {
    const onSave = vi.fn()
    const { getByText } = renderWithI18n(
      <EnvEditor variable={makeVar('', 'x', true)} onSave={onSave} onClose={() => {}} />,
    )
    const saveBtn = getByText('保存').closest('button')
    expect(saveBtn?.hasAttribute('disabled')).toBe(true)
    fireEvent.click(saveBtn!)
    expect(onSave).not.toHaveBeenCalled()
  })

  it('点取消触发 onClose', () => {
    const onClose = vi.fn()
    const { getByText } = renderWithI18n(
      <EnvEditor variable={makeVar()} onSave={() => {}} onClose={onClose} />,
    )
    fireEvent.click(getByText('取消'))
    expect(onClose).toHaveBeenCalledTimes(1)
  })
})
