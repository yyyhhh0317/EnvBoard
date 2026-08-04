// 搜索替换工具：在变量列表中查找并替换文本
import type { EnvVariable } from '../types'

/** 可替换的字段 */
export type ReplaceableField = 'key' | 'value' | 'comment'

/** 搜索替换选项 */
export interface SearchReplaceOptions {
  /** 查找文本 */
  search: string
  /** 替换文本 */
  replacement: string
  /** 是否区分大小写 */
  caseSensitive: boolean
  /** 要替换的字段 */
  fields: ReplaceableField[]
}

/** 单个匹配项 */
export interface SearchMatch {
  /** 变量 id */
  variableId: string
  /** 变量 key（用于展示） */
  key: string
  /** 匹配的字段 */
  field: ReplaceableField
  /** 匹配前的原值 */
  before: string
  /** 替换后的值 */
  after: string
}

/**
 * 在单个字段中查找所有匹配并生成替换结果。
 * 返回 null 表示无匹配。
 */
function replaceInField(
  value: string,
  search: string,
  replacement: string,
  caseSensitive: boolean,
): string | null {
  if (!search) return null
  if (value === null || value === undefined) return null
  const flags = caseSensitive ? 'g' : 'gi'
  // 转义正则特殊字符，按字面量匹配
  const escaped = search.replace(/[.*+?^${}()|[\]\\]/g, '\\$&')
  const re = new RegExp(escaped, flags)
  const result = value.replace(re, replacement)
  return result !== value ? result : null
}

/**
 * 预览搜索替换的匹配项（不修改原变量）。
 * @param variables 变量列表
 * @param options 搜索替换选项
 * @returns 匹配项列表
 */
export function previewReplace(
  variables: EnvVariable[],
  options: SearchReplaceOptions,
): SearchMatch[] {
  if (!options.search || options.fields.length === 0) return []
  const matches: SearchMatch[] = []

  for (const v of variables) {
    if (v.isDisabled) continue
    for (const field of options.fields) {
      const original = v[field] ?? ''
      const replaced = replaceInField(
        original,
        options.search,
        options.replacement,
        options.caseSensitive,
      )
      if (replaced !== null) {
        matches.push({
          variableId: v.id,
          key: v.key || '(空)',
          field,
          before: original,
          after: replaced,
        })
      }
    }
  }

  return matches
}

/**
 * 执行搜索替换，返回新变量列表（不修改原数组）。
 * @param variables 变量列表
 * @param options 搜索替换选项
 * @returns 替换后的新变量列表
 */
export function applyReplace(
  variables: EnvVariable[],
  options: SearchReplaceOptions,
): EnvVariable[] {
  if (!options.search || options.fields.length === 0) return variables
  return variables.map((v) => {
    if (v.isDisabled) return v
    let changed = false
    const next: EnvVariable = { ...v }
    for (const field of options.fields) {
      const original = v[field] ?? ''
      const replaced = replaceInField(
        original,
        options.search,
        options.replacement,
        options.caseSensitive,
      )
      if (replaced !== null) {
        next[field] = replaced
        changed = true
      }
    }
    return changed ? { ...next, isModified: true } : v
  })
}

/** 统计匹配项涉及的变量数 */
export function countAffectedVariables(matches: SearchMatch[]): number {
  const ids = new Set(matches.map((m) => m.variableId))
  return ids.size
}
