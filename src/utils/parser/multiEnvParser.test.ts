import { describe, it, expect } from 'vitest'
import { parseMultiEnvFile, mergeMultiEnvResults } from './multiEnvParser'

describe('multiEnvParser 多环境解析', () => {
  describe('parseMultiEnvFile 单文件分段', () => {
    it('无 @env 标记 → hasSegments=false', () => {
      const result = parseMultiEnvFile('API_KEY=abc\nPORT=3000', '.env')
      expect(result.hasSegments).toBe(false)
      expect(result.envOrder).toEqual([])
      expect(result.envs).toEqual({})
    })

    it('空内容 → hasSegments=false + 错误提示', () => {
      const result = parseMultiEnvFile('', '.env')
      expect(result.hasSegments).toBe(false)
      expect(result.errors.length).toBeGreaterThan(0)
    })

    it('含 @env 分段 → 正确切分变量归属', () => {
      const content = [
        '# @env development',
        'API_KEY=dev-key',
        'PORT=3000',
        '# @env production',
        'API_KEY=prod-key',
        'PORT=8080',
      ].join('\n')
      const result = parseMultiEnvFile(content, '.env')
      expect(result.hasSegments).toBe(true)
      expect(result.envOrder).toEqual(['development', 'production'])
      expect(result.envs.development.map((v) => v.key)).toEqual(['API_KEY', 'PORT'])
      expect(result.envs.development[0].value).toBe('dev-key')
      expect(result.envs.production[0].value).toBe('prod-key')
    })

    it('分段标记大小写不敏感', () => {
      const result = parseMultiEnvFile('# @ENV Development\nKEY=val', '.env')
      expect(result.hasSegments).toBe(true)
      expect(result.envOrder).toContain('development')
    })

    it('BOM 头不影响解析', () => {
      const content = '\uFEFF# @env development\nKEY=val'
      const result = parseMultiEnvFile(content, '.env')
      expect(result.hasSegments).toBe(true)
      expect(result.envs.development).toHaveLength(1)
    })

    it('分段标记前的非注释内容被忽略并报错', () => {
      const content = 'LEADING=value\n# @env development\nKEY=val'
      const result = parseMultiEnvFile(content, '.env')
      expect(result.hasSegments).toBe(true)
      expect(result.errors.some((e) => e.includes('LEADING'))).toBe(true)
    })

    it('分段标记前的注释和空行被静默忽略', () => {
      const content = '# header comment\n\n# @env development\nKEY=val'
      const result = parseMultiEnvFile(content, '.env')
      expect(result.hasSegments).toBe(true)
      expect(result.errors).toHaveLength(0)
    })

    it('环境排序：预设环境在前、自定义在后', () => {
      const content = [
        '# @env custom-env',
        'A=1',
        '# @env development',
        'B=2',
        '# @env production',
        'C=3',
      ].join('\n')
      const result = parseMultiEnvFile(content, '.env')
      const devIdx = result.envOrder.indexOf('development')
      const prodIdx = result.envOrder.indexOf('production')
      const customIdx = result.envOrder.indexOf('custom-env')
      expect(devIdx).toBeLessThan(prodIdx)
      expect(prodIdx).toBeLessThan(customIdx)
    })

    it('重复的同名分段合并到同一环境', () => {
      const content = [
        '# @env development',
        'A=1',
        '# @env production',
        'B=2',
        '# @env development',
        'C=3',
      ].join('\n')
      const result = parseMultiEnvFile(content, '.env')
      expect(result.envOrder).toEqual(['development', 'production'])
      expect(result.envs.development.map((v) => v.key)).toEqual(['A', 'C'])
    })

    it('子解析错误带 [envName] 前缀', () => {
      const content = '# @env development\nINVALID LINE WITHOUT EQUALS'
      const result = parseMultiEnvFile(content, '.env')
      expect(result.errors.some((e) => e.startsWith('[development]'))).toBe(true)
    })
  })

  describe('mergeMultiEnvResults 多文件合并', () => {
    it('按文件名识别环境并合并', () => {
      const results = [
        { content: 'API_KEY=dev\nPORT=3000', filename: '.env.development' },
        { content: 'API_KEY=prod\nPORT=8080', filename: '.env.production' },
      ]
      const merged = mergeMultiEnvResults(results)
      expect(merged.envOrder).toContain('development')
      expect(merged.envOrder).toContain('production')
      expect(merged.envs.development).toHaveLength(2)
      expect(merged.envs.production).toHaveLength(2)
    })

    it('文件名无法识别环境时归入 default', () => {
      const results = [{ content: 'KEY=val', filename: 'config.txt' }]
      const merged = mergeMultiEnvResults(results)
      expect(merged.envOrder).toContain('default')
      expect(merged.envs.default).toHaveLength(1)
      expect(merged.errors.some((e) => e.includes('config.txt'))).toBe(true)
    })

    it('单文件含分段时按分段切分', () => {
      const results = [
        {
          content: '# @env development\nA=1\n# @env production\nB=2',
          filename: '.env',
        },
      ]
      const merged = mergeMultiEnvResults(results)
      expect(merged.envOrder).toEqual(['development', 'production'])
    })

    it('hasSegments 由环境数量决定', () => {
      const single = mergeMultiEnvResults([{ content: 'A=1', filename: '.env.development' }])
      expect(single.hasSegments).toBe(false)
      const multi = mergeMultiEnvResults([
        { content: 'A=1', filename: '.env.development' },
        { content: 'B=2', filename: '.env.production' },
      ])
      expect(multi.hasSegments).toBe(true)
    })
  })
})
