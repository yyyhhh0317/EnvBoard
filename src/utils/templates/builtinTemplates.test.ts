import { describe, it, expect } from 'vitest'
import { BUILTIN_TEMPLATES, CATEGORY_LABELS } from './builtinTemplates'
import type { TemplateCategory } from '../../types'

describe('builtinTemplates 完整性', () => {
  it('模板 id 唯一，分类合法', () => {
    const ids = new Set(BUILTIN_TEMPLATES.map((t) => t.id))
    expect(ids.size).toBe(BUILTIN_TEMPLATES.length)
    for (const t of BUILTIN_TEMPLATES) {
      expect(t.name).toBeTruthy()
      expect(Object.keys(CATEGORY_LABELS)).toContain(t.category)
      expect(Array.isArray(t.variables)).toBe(true)
    }
  })

  it('变量定义合法：key 非空、占位符存在', () => {
    for (const t of BUILTIN_TEMPLATES) {
      for (const v of t.variables) {
        expect(v.key, `${t.id}.${v.key}`).toMatch(/^[A-Za-z_][A-Za-z0-9_]*$/)
        expect(typeof v.placeholder).toBe('string')
        expect(typeof v.comment).toBe('string')
        expect(typeof v.isSensitive).toBe('boolean')
      }
    }
  })

  it('schema 约束可编译：pattern 为正则、enum 非空数组', () => {
    for (const t of BUILTIN_TEMPLATES) {
      for (const v of t.variables) {
        const pattern = v.pattern
        if (pattern) {
          expect(() => new RegExp(pattern), `${t.id}.${v.key} pattern`).not.toThrow()
        }
        if (v.enum) {
          expect(v.enum.length, `${t.id}.${v.key} enum`).toBeGreaterThan(0)
          expect(new Set(v.enum).size).toBe(v.enum.length)
        }
      }
    }
  })

  it('模板数量与分类覆盖符合预期', () => {
    const categories = new Set(BUILTIN_TEMPLATES.map((t) => t.category as TemplateCategory))
    expect(categories.has('general')).toBe(true)
    expect(categories.has('frontend')).toBe(true)
    expect(categories.has('python')).toBe(true)
  })
})
