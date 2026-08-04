import { describe, it, expect } from 'vitest'
import { formatVariables, getExportFilename } from './exporter'
import type { EnvVariable } from '../../types'

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

describe('exporter 导出格式化', () => {
  describe('formatVariables env 格式', () => {
    it('基本 KEY=VALUE', () => {
      const result = formatVariables([makeVar({ key: 'PORT', value: '3000' })], 'env')
      expect(result).toBe('PORT=3000')
    })

    it('注释作为行前缀输出', () => {
      const result = formatVariables(
        [makeVar({ key: 'PORT', value: '3000', comment: '服务端口' })],
        'env',
      )
      expect(result).toContain('# 服务端口')
      expect(result).toContain('PORT=3000')
    })

    it('含空格的值用双引号包裹', () => {
      const result = formatVariables(
        [makeVar({ key: 'NAME', value: 'hello world' })],
        'env',
      )
      expect(result).toBe('NAME="hello world"')
    })

    it('含 # 的值用双引号包裹', () => {
      const result = formatVariables([makeVar({ key: 'TOKEN', value: 'abc#def' })], 'env')
      expect(result).toBe('TOKEN="abc#def"')
    })

    it('含双引号的值转义', () => {
      const result = formatVariables(
        [makeVar({ key: 'MSG', value: 'say "hi"' })],
        'env',
      )
      expect(result).toBe('MSG="say \\"hi\\""')
    })

    it('多变量用空行分隔', () => {
      const result = formatVariables(
        [makeVar({ key: 'A', value: '1' }), makeVar({ key: 'B', value: '2' })],
        'env',
      )
      expect(result).toBe('A=1\n\nB=2')
    })

    it('被禁用的变量被过滤', () => {
      const result = formatVariables(
        [makeVar({ key: 'A', value: '1' }), makeVar({ key: 'B', value: '2', isDisabled: true })],
        'env',
      )
      expect(result).toBe('A=1')
    })

    it('空 key 的变量被过滤', () => {
      const result = formatVariables(
        [makeVar({ key: '', value: '1' }), makeVar({ key: 'A', value: '2' })],
        'env',
      )
      expect(result).toBe('A=2')
    })
  })

  describe('formatVariables env-example 格式', () => {
    it('只保留 key，不含真实值', () => {
      const result = formatVariables(
        [makeVar({ key: 'API_KEY', value: 'secret123', isSensitive: true })],
        'env-example',
      )
      expect(result).toBe('API_KEY=')
    })

    it('注释保留', () => {
      const result = formatVariables(
        [makeVar({ key: 'PORT', value: '3000', comment: '端口' })],
        'env-example',
      )
      expect(result).toContain('# 端口')
      expect(result).toContain('PORT=')
    })
  })

  describe('formatVariables json 格式', () => {
    it('输出合法 JSON 对象', () => {
      const result = formatVariables(
        [makeVar({ key: 'PORT', value: '3000' }), makeVar({ key: 'HOST', value: 'localhost' })],
        'json',
      )
      const parsed = JSON.parse(result)
      expect(parsed.PORT).toBe('3000')
      expect(parsed.HOST).toBe('localhost')
    })
  })

  describe('formatVariables yaml 格式', () => {
    it('基本 key: value（数字值加引号防止类型漂移）', () => {
      const result = formatVariables([makeVar({ key: 'PORT', value: '3000' })], 'yaml')
      expect(result).toBe('PORT: "3000"')
    })

    it('普通字符串值不加引号', () => {
      const result = formatVariables([makeVar({ key: 'NAME', value: 'myapp' })], 'yaml')
      expect(result).toBe('NAME: myapp')
    })

    it('含特殊字符的值用双引号包裹', () => {
      const result = formatVariables(
        [makeVar({ key: 'URL', value: 'http://example.com:8080' })],
        'yaml',
      )
      expect(result).toContain('"')
    })

    it('空值用双引号包裹', () => {
      const result = formatVariables([makeVar({ key: 'EMPTY', value: '' })], 'yaml')
      expect(result).toBe('EMPTY: ""')
    })
  })

  describe('includeSensitive 敏感值控制', () => {
    it('includeSensitive=false 时敏感值输出为 ****', () => {
      const result = formatVariables(
        [makeVar({ key: 'API_KEY', value: 'secret', isSensitive: true })],
        'env',
        false,
      )
      expect(result).toBe('API_KEY=****')
    })

    it('includeSensitive=true 时输出真实值', () => {
      const result = formatVariables(
        [makeVar({ key: 'API_KEY', value: 'secret', isSensitive: true })],
        'env',
        true,
      )
      expect(result).toBe('API_KEY=secret')
    })

    it('env-example 格式不受 includeSensitive 影响', () => {
      const result = formatVariables(
        [makeVar({ key: 'API_KEY', value: 'secret', isSensitive: true })],
        'env-example',
        true,
      )
      expect(result).toBe('API_KEY=')
    })
  })

  describe('getExportFilename 文件名映射', () => {
    it('env → .env', () => {
      expect(getExportFilename('env')).toBe('.env')
    })

    it('env-example → .env.example', () => {
      expect(getExportFilename('env-example')).toBe('.env.example')
    })

    it('json → env.json', () => {
      expect(getExportFilename('json')).toBe('env.json')
    })

    it('yaml → env.yaml', () => {
      expect(getExportFilename('yaml')).toBe('env.yaml')
    })
  })
})
