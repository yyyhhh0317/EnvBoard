import { describe, expect, it, vi } from 'vitest'
import { fireEvent } from '@testing-library/react'
import type { EnvVariable } from '../../types'
import { EnvTable } from './EnvTable'
import { renderWithI18n } from '../../test-utils'

function makeVar(key: string, value: string, id: string, isSensitive = false): EnvVariable {
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

const baseProps = {
  issues: [],
  hasTemplate: false,
  onEdit: vi.fn(),
  onAdd: vi.fn(),
  onDelete: vi.fn(),
  onToggleSensitive: vi.fn(),
  onOpenTemplate: vi.fn(),
  canUndo: false,
  canRedo: false,
  onUndo: vi.fn(),
  onRedo: vi.fn(),
}

describe('EnvTable', () => {
  it('渲染变量行并显示 key/value', () => {
    const { getByText } = renderWithI18n(
      <EnvTable
        variables={[makeVar('DATABASE_URL', 'postgres://db', 'v1'), makeVar('PORT', '3000', 'v2')]}
        {...baseProps}
      />,
    )
    expect(getByText('DATABASE_URL')).toBeTruthy()
    expect(getByText('postgres://db')).toBeTruthy()
    expect(getByText('PORT')).toBeTruthy()
  })

  it('空列表显示空态提示', () => {
    const { getByText } = renderWithI18n(<EnvTable variables={[]} {...baseProps} />)
    expect(getByText('暂无变量，请先导入或添加')).toBeTruthy()
  })

  it('搜索框过滤变量', () => {
    const { getByText, getByPlaceholderText, queryByText } = renderWithI18n(
      <EnvTable
        variables={[makeVar('DATABASE_URL', 'db', 'v1'), makeVar('API_KEY', 'k', 'v2')]}
        {...baseProps}
      />,
    )
    fireEvent.change(getByPlaceholderText('搜索变量名或值…'), { target: { value: 'API' } })
    expect(getByText('API_KEY')).toBeTruthy()
    expect(queryByText('DATABASE_URL')).toBeNull()
  })

  it('点击添加按钮触发 onAdd', () => {
    const onAdd = vi.fn()
    const { getByText } = renderWithI18n(
      <EnvTable variables={[]} {...baseProps} onAdd={onAdd} />,
    )
    fireEvent.click(getByText('+ 添加变量'))
    expect(onAdd).toHaveBeenCalledTimes(1)
  })

  it('点击行内删除按钮触发 onDelete（带变量 id）', () => {
    const onDelete = vi.fn()
    const { getAllByLabelText } = renderWithI18n(
      <EnvTable variables={[makeVar('A', '1', 'va')]} {...baseProps} onDelete={onDelete} />,
    )
    fireEvent.click(getAllByLabelText('删除')[0])
    expect(onDelete).toHaveBeenCalledWith('va')
  })

  it('敏感值默认脱敏显示为 *，行内显隐按钮可切换', () => {
    const { getByText, getByLabelText } = renderWithI18n(
      <EnvTable variables={[makeVar('SECRET', 's3cr3t', 'vs', true)]} {...baseProps} />,
    )
    expect(getByText('****')).toBeTruthy()
    fireEvent.click(getByLabelText('显示敏感值'))
    expect(getByText('s3cr3t')).toBeTruthy()
  })
})
