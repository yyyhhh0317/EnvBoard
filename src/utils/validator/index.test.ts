import { describe, it, expect } from 'vitest'
import {
  isPlaceholderValue,
  validateType,
  validateNaming,
  validateVariables,
  groupIssuesByVariable,
  countIssues,
} from './index'
import type { EnvVariable, TemplateVariable } from '../../types'

function makeVar(overrides: Partial<EnvVariable> = {}): EnvVariable {
  return {
    id: 'test-id',
    key: 'TEST_VAR',
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

function makeTpl(overrides: Partial<TemplateVariable> = {}): TemplateVariable {
  return {
    key: 'TEST_VAR',
    placeholder: '',
    comment: '',
    isSensitive: false,
    ...overrides,
  }
}

describe('validator 校验器', () => {
  describe('isPlaceholderValue 占位符识别', () => {
    it('识别 your- 前缀', () => {
      expect(isPlaceholderValue('your-api-key')).toBe(true)
      expect(isPlaceholderValue('your_key')).toBe(true)
    })

    it('识别 change-me / changeme', () => {
      // change-me 需带前缀（-/_），changeme 单独匹配
      expect(isPlaceholderValue('please-change-me')).toBe(true)
      expect(isPlaceholderValue('key_change-me')).toBe(true)
      expect(isPlaceholderValue('changeme')).toBe(true)
    })

    it('识别 placeholder / example / replaceme / todo / xxx', () => {
      expect(isPlaceholderValue('my-placeholder')).toBe(true)
      expect(isPlaceholderValue('example-key')).toBe(true)
      expect(isPlaceholderValue('replaceme')).toBe(true)
      expect(isPlaceholderValue('todo')).toBe(true)
      expect(isPlaceholderValue('xxx')).toBe(true)
    })

    it('识别 <xxx> 占位符', () => {
      expect(isPlaceholderValue('<value>')).toBe(true)
      expect(isPlaceholderValue('<your-token>')).toBe(true)
    })

    it('正常值不误判', () => {
      expect(isPlaceholderValue('sk-abc123')).toBe(false)
      expect(isPlaceholderValue('3000')).toBe(false)
      expect(isPlaceholderValue('https://api.example.com')).toBe(false)
    })

    it('空值返回 false', () => {
      expect(isPlaceholderValue('')).toBe(false)
      expect(isPlaceholderValue('   ')).toBe(false)
    })
  })

  describe('validateType 类型校验', () => {
    it('无期望类型时恒为 true', () => {
      expect(validateType('anything', undefined)).toBe(true)
    })

    it('空值不校验类型（由 empty-value 规则处理）', () => {
      expect(validateType('', 'number')).toBe(true)
      expect(validateType('   ', 'boolean')).toBe(true)
    })

    it('number 类型', () => {
      expect(validateType('1', 'number')).toBe(true)
      expect(validateType('1.5', 'number')).toBe(true)
      expect(validateType('-100', 'number')).toBe(true)
      expect(validateType('abc', 'number')).toBe(false)
    })

    it('boolean 类型（接受 true/false/0/1/yes/no/on/off）', () => {
      expect(validateType('true', 'boolean')).toBe(true)
      expect(validateType('FALSE', 'boolean')).toBe(true)
      expect(validateType('0', 'boolean')).toBe(true)
      expect(validateType('on', 'boolean')).toBe(true)
      expect(validateType('maybe', 'boolean')).toBe(false)
    })

    it('url 类型（仅 http/https）', () => {
      expect(validateType('https://api.example.com', 'url')).toBe(true)
      expect(validateType('http://localhost:3000', 'url')).toBe(true)
      expect(validateType('localhost:3000', 'url')).toBe(false)
      expect(validateType('ftp://files.example.com', 'url')).toBe(false)
    })

    it('email 类型', () => {
      expect(validateType('user@example.com', 'email')).toBe(true)
      expect(validateType('invalid', 'email')).toBe(false)
      expect(validateType('a@b', 'email')).toBe(false)
    })

    it('string 类型恒为 true', () => {
      expect(validateType('anything', 'string')).toBe(true)
    })
  })

  describe('validateNaming 命名规范', () => {
    it('全大写 + 下划线 → 无问题', () => {
      expect(validateNaming('DATABASE_URL')).toEqual([])
      expect(validateNaming('API_KEY')).toEqual([])
    })

    it('含小写字母 → naming-lowercase', () => {
      expect(validateNaming('database_url')).toContain('naming-lowercase')
      expect(validateNaming('DatabaseURL')).toContain('naming-lowercase')
    })

    it('含空格 → naming-space', () => {
      expect(validateNaming('API KEY')).toContain('naming-space')
    })

    it('空 key → 无问题', () => {
      expect(validateNaming('')).toEqual([])
    })
  })

  describe('validateVariables 批量校验', () => {
    it('被禁用的变量跳过校验', () => {
      const vars = [makeVar({ key: 'DISABLED', value: '', isDisabled: true })]
      const issues = validateVariables(vars)
      expect(issues).toHaveLength(0)
    })

    it('有解析错误的变量跳过校验', () => {
      const vars = [makeVar({ key: 'BAD', value: '', error: '格式无效' })]
      const issues = validateVariables(vars)
      expect(issues).toHaveLength(0)
    })

    it('敏感变量为空 → error: sensitive-empty', () => {
      const vars = [makeVar({ key: 'API_KEY', value: '', isSensitive: true })]
      const issues = validateVariables(vars)
      expect(issues).toHaveLength(1)
      expect(issues[0].rule).toBe('sensitive-empty')
      expect(issues[0].severity).toBe('error')
    })

    it('模板必填变量为空 → error: empty-value', () => {
      const vars = [makeVar({ key: 'PORT', value: '' })]
      const tpls = [makeTpl({ key: 'PORT', required: true })]
      const issues = validateVariables(vars, tpls)
      const emptyIssue = issues.find((i) => i.rule === 'empty-value')
      expect(emptyIssue).toBeDefined()
      expect(emptyIssue?.severity).toBe('error')
    })

    it('占位符值 → warning: placeholder-value', () => {
      const vars = [makeVar({ key: 'API_KEY', value: 'your-api-key' })]
      const issues = validateVariables(vars)
      expect(issues.some((i) => i.rule === 'placeholder-value')).toBe(true)
    })

    it('重复 key → warning: duplicate-key', () => {
      const vars = [
        makeVar({ id: '1', key: 'PORT', value: '3000' }),
        makeVar({ id: '2', key: 'PORT', value: '4000' }),
      ]
      const issues = validateVariables(vars)
      expect(issues.filter((i) => i.rule === 'duplicate-key')).toHaveLength(2)
    })

    it('类型不匹配 → warning: invalid-number', () => {
      const vars = [makeVar({ key: 'PORT', value: 'abc' })]
      const tpls = [makeTpl({ key: 'PORT', expectedType: 'number' })]
      const issues = validateVariables(vars, tpls)
      expect(issues.some((i) => i.rule === 'invalid-number')).toBe(true)
    })

    it('命名含小写 → warning: naming-lowercase', () => {
      const vars = [makeVar({ key: 'api_key', value: '123' })]
      const issues = validateVariables(vars)
      expect(issues.some((i) => i.rule === 'naming-lowercase')).toBe(true)
    })

    it('命名含空格 → warning: naming-space', () => {
      const vars = [makeVar({ key: 'API KEY', value: '123' })]
      const issues = validateVariables(vars)
      expect(issues.some((i) => i.rule === 'naming-space')).toBe(true)
    })

    it('正常变量无问题', () => {
      const vars = [makeVar({ key: 'DATABASE_URL', value: 'postgres://localhost' })]
      const issues = validateVariables(vars)
      expect(issues).toHaveLength(0)
    })
  })

  describe('groupIssuesByVariable 按变量聚合', () => {
    it('相同 variableId 聚合到一起', () => {
      const issues = [
        { variableId: '1', key: 'A', severity: 'error' as const, rule: 'empty-value' as const, message: '' },
        { variableId: '1', key: 'A', severity: 'warning' as const, rule: 'naming-lowercase' as const, message: '' },
        { variableId: '2', key: 'B', severity: 'warning' as const, rule: 'placeholder-value' as const, message: '' },
      ]
      const map = groupIssuesByVariable(issues)
      expect(map.get('1')).toHaveLength(2)
      expect(map.get('2')).toHaveLength(1)
    })

    it('无问题时返回空 Map', () => {
      expect(groupIssuesByVariable([]).size).toBe(0)
    })
  })

  describe('countIssues 统计', () => {
    it('正确统计 errors 和 warnings', () => {
      const issues = [
        { severity: 'error' as const },
        { severity: 'error' as const },
        { severity: 'warning' as const },
      ] as any
      const result = countIssues(issues)
      expect(result.errors).toBe(2)
      expect(result.warnings).toBe(1)
    })

    it('空数组返回 0/0', () => {
      const result = countIssues([])
      expect(result).toEqual({ errors: 0, warnings: 0 })
    })
  })

  describe('schema 规则（v1.3.0）', () => {
    it('pattern 不匹配时产生 pattern-mismatch', () => {
      const issues = validateVariables(
        [makeVar({ key: 'APP_PORT', value: 'not-a-number' })],
        [makeTpl({ key: 'APP_PORT', pattern: '^\\d{1,5}$' })],
      )
      const rules = issues.map((i) => i.rule)
      expect(rules).toContain('pattern-mismatch')
    })

    it('pattern 匹配时不产生问题', () => {
      const issues = validateVariables(
        [makeVar({ key: 'APP_PORT', value: '8080' })],
        [makeTpl({ key: 'APP_PORT', pattern: '^\\d{1,5}$' })],
      )
      expect(issues.some((i) => i.rule === 'pattern-mismatch')).toBe(false)
    })

    it('非法正则不误报', () => {
      const issues = validateVariables(
        [makeVar({ key: 'K', value: 'v' })],
        [makeTpl({ key: 'K', pattern: '[' })],
      )
      expect(issues.some((i) => i.rule === 'pattern-mismatch')).toBe(false)
    })

    it('enum 不在允许集合时产生 enum-mismatch', () => {
      const issues = validateVariables(
        [makeVar({ key: 'NODE_ENV', value: 'beta' })],
        [makeTpl({ key: 'NODE_ENV', enum: ['development', 'production'] })],
      )
      expect(issues.some((i) => i.rule === 'enum-mismatch')).toBe(true)
    })

    it('enum 命中允许集合时不产生问题', () => {
      const issues = validateVariables(
        [makeVar({ key: 'NODE_ENV', value: 'production' })],
        [makeTpl({ key: 'NODE_ENV', enum: ['development', 'production'] })],
      )
      expect(issues.some((i) => i.rule === 'enum-mismatch')).toBe(false)
    })
  })
})
