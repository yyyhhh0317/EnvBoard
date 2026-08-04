import { describe, it, expect } from 'vitest'
import { previewReplace, applyReplace, countAffectedVariables } from './searchReplace'
import type { EnvVariable } from '../types'


function makeVar(overrides: Partial<EnvVariable> = {}): EnvVariable {
  return {
    id: 'test-id',
    key: 'TEST',
    value: 'value',
    comment: '',
    isSensitive: false,
    isDisabled: false,
    isModified: false,
    isNew: false,
    error: null,
    line: 0,
    ...overrides,
  }
}

describe('searchReplace 搜索替换', () => {
  describe('previewReplace 预览匹配', () => {
    it('查找 value 中的文本', () => {
      const vars = [makeVar({ id: '1', key: 'HOST', value: 'localhost:3000' })]
      const matches = previewReplace(vars, {
        search: 'localhost',
        replacement: '127.0.0.1',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].before).toBe('localhost:3000')
      expect(matches[0].after).toBe('127.0.0.1:3000')
    })

    it('替换 key 中的文本', () => {
      const vars = [makeVar({ id: '1', key: 'DB_PASSWORD', value: '123' })]
      const matches = previewReplace(vars, {
        search: 'DB_',
        replacement: 'DATABASE_',
        caseSensitive: false,
        fields: ['key'],
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].after).toBe('DATABASE_PASSWORD')
    })

    it('替换 comment 中的文本', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: '1', comment: '开发环境端口' })]
      const matches = previewReplace(vars, {
        search: '开发',
        replacement: '测试',
        caseSensitive: false,
        fields: ['comment'],
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].after).toBe('测试环境端口')
    })

    it('多字段同时替换', () => {
      const vars = [makeVar({ id: '1', key: 'DEV_PORT', value: 'dev:3000', comment: 'dev port' })]
      const matches = previewReplace(vars, {
        search: 'dev',
        replacement: 'test',
        caseSensitive: false,
        fields: ['key', 'value', 'comment'],
      })
      expect(matches).toHaveLength(3)
    })

    it('区分大小写', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'Hello hello HELLO' })]
      const caseSensitiveMatches = previewReplace(vars, {
        search: 'Hello',
        replacement: 'Hi',
        caseSensitive: true,
        fields: ['value'],
      })
      expect(caseSensitiveMatches[0].after).toBe('Hi hello HELLO')
    })

    it('不区分大小写（默认）', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'Hello hello HELLO' })]
      const matches = previewReplace(vars, {
        search: 'hello',
        replacement: 'hi',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(matches[0].after).toBe('hi hi hi')
    })

    it('全局替换（多个匹配）', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'a-b-a-b' })]
      const matches = previewReplace(vars, {
        search: 'a',
        replacement: 'x',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(matches[0].after).toBe('x-b-x-b')
    })

    it('被禁用的变量跳过', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'localhost', isDisabled: true })]
      const matches = previewReplace(vars, {
        search: 'localhost',
        replacement: '127.0.0.1',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(matches).toHaveLength(0)
    })

    it('空搜索词返回空', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'localhost' })]
      const matches = previewReplace(vars, {
        search: '',
        replacement: 'x',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(matches).toHaveLength(0)
    })

    it('无字段选择返回空', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'localhost' })]
      const matches = previewReplace(vars, {
        search: 'localhost',
        replacement: 'x',
        caseSensitive: false,
        fields: [],
      })
      expect(matches).toHaveLength(0)
    })

    it('无匹配返回空', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'hello' })]
      const matches = previewReplace(vars, {
        search: 'world',
        replacement: 'x',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(matches).toHaveLength(0)
    })

    it('正则特殊字符按字面量匹配', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'price: $100.00' })]
      const matches = previewReplace(vars, {
        search: '$100.00',
        replacement: '$200.00',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(matches).toHaveLength(1)
      expect(matches[0].after).toBe('price: $200.00')
    })
  })

  describe('applyReplace 执行替换', () => {
    it('返回新数组，不修改原数组', () => {
      const vars = [makeVar({ id: '1', key: 'HOST', value: 'localhost' })]
      const result = applyReplace(vars, {
        search: 'localhost',
        replacement: '127.0.0.1',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(vars[0].value).toBe('localhost') // 原数组不变
      expect(result[0].value).toBe('127.0.0.1')
    })

    it('替换后标记 isModified=true', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'localhost', isModified: false })]
      const result = applyReplace(vars, {
        search: 'localhost',
        replacement: '127.0.0.1',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(result[0].isModified).toBe(true)
    })

    it('未匹配的变量不修改且不标记', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'hello', isModified: false })]
      const result = applyReplace(vars, {
        search: 'world',
        replacement: 'x',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(result[0].value).toBe('hello')
      expect(result[0].isModified).toBe(false)
    })

    it('被禁用变量保持原样', () => {
      const vars = [makeVar({ id: '1', key: 'A', value: 'localhost', isDisabled: true })]
      const result = applyReplace(vars, {
        search: 'localhost',
        replacement: '127.0.0.1',
        caseSensitive: false,
        fields: ['value'],
      })
      expect(result[0].value).toBe('localhost')
      expect(result[0].isModified).toBe(false)
    })
  })

  describe('countAffectedVariables 统计', () => {
    it('同一变量多字段只算一次', () => {
      const matches = [
        { variableId: '1', key: 'A', field: 'key' as const, before: '', after: '' },
        { variableId: '1', key: 'A', field: 'value' as const, before: '', after: '' },
        { variableId: '2', key: 'B', field: 'value' as const, before: '', after: '' },
      ]
      expect(countAffectedVariables(matches)).toBe(2)
    })

    it('空匹配返回 0', () => {
      expect(countAffectedVariables([])).toBe(0)
    })
  })
})
