import { describe, it, expect } from 'vitest'
import { parseEnvFile, createEmptyVariable } from './envParser'

describe('envParser', () => {
  describe('基本解析', () => {
    it('解析简单的 KEY=VALUE', () => {
      const result = parseEnvFile('API_KEY=abc123')
      expect(result.variables).toHaveLength(1)
      expect(result.variables[0].key).toBe('API_KEY')
      expect(result.variables[0].value).toBe('abc123')
      expect(result.variables[0].isDisabled).toBe(false)
      expect(result.errors).toHaveLength(0)
    })

    it('解析多行变量', () => {
      const content = 'A=1\nB=2\nC=3'
      const result = parseEnvFile(content)
      expect(result.variables).toHaveLength(3)
      expect(result.variables.map((v) => v.key)).toEqual(['A', 'B', 'C'])
      expect(result.variables.map((v) => v.value)).toEqual(['1', '2', '3'])
    })

    it('处理 = 两端空格', () => {
      const result = parseEnvFile('KEY = value')
      expect(result.variables[0].key).toBe('KEY')
      expect(result.variables[0].value).toBe('value')
    })

    it('变量名含点和下划线', () => {
      const result = parseEnvFile('API.SECRET_KEY=secret')
      expect(result.variables[0].key).toBe('API.SECRET_KEY')
    })
  })

  describe('引号处理', () => {
    it('双引号包裹的值', () => {
      const result = parseEnvFile('KEY="hello world"')
      expect(result.variables[0].value).toBe('hello world')
    })

    it('单引号包裹的值', () => {
      const result = parseEnvFile("KEY='hello world'")
      expect(result.variables[0].value).toBe('hello world')
    })

    it('引号内含 = 号', () => {
      const result = parseEnvFile('KEY="a=b"')
      expect(result.variables[0].value).toBe('a=b')
    })

    it('引号后带内联注释', () => {
      const result = parseEnvFile('KEY="value" # comment')
      expect(result.variables[0].value).toBe('value')
      expect(result.variables[0].comment).toBe('comment')
    })
  })

  describe('注释处理', () => {
    it('行内注释（# 前有空格）', () => {
      const result = parseEnvFile('KEY=value # this is a comment')
      expect(result.variables[0].value).toBe('value')
      expect(result.variables[0].comment).toBe('this is a comment')
    })

    it('值中的 # 不被误判为注释（无前置空格）', () => {
      const result = parseEnvFile('KEY=val#ue')
      expect(result.variables[0].value).toBe('val#ue')
    })

    it('块注释挂到下一个变量', () => {
      const content = '# Database config\nDB_HOST=localhost'
      const result = parseEnvFile(content)
      expect(result.variables[0].key).toBe('DB_HOST')
      expect(result.variables[0].comment).toBe('Database config')
    })

    it('空行清空暂存注释', () => {
      const content = '# comment1\n\nKEY=value'
      const result = parseEnvFile(content)
      expect(result.variables[0].comment).toBe('')
    })

    it('注释掉的变量（# KEY=VALUE）', () => {
      const result = parseEnvFile('# OLD_KEY=old_value')
      expect(result.variables[0].key).toBe('OLD_KEY')
      expect(result.variables[0].value).toBe('old_value')
      expect(result.variables[0].isDisabled).toBe(true)
    })
  })

  describe('空文件与无效格式', () => {
    it('空内容返回错误', () => {
      const result = parseEnvFile('')
      expect(result.variables).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('为空')
    })

    it('只有空格的内容返回错误', () => {
      const result = parseEnvFile('   \n  \n')
      expect(result.variables).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
    })

    it('无效格式行产生错误', () => {
      const result = parseEnvFile('123invalid=value')
      expect(result.variables).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('格式无效')
    })

    it('BOM 头被正确移除', () => {
      const result = parseEnvFile('\uFEFFKEY=value')
      expect(result.variables).toHaveLength(1)
      expect(result.variables[0].key).toBe('KEY')
    })
  })

  describe('重复键检测', () => {
    it('重复变量名产生错误', () => {
      const result = parseEnvFile('KEY=1\nKEY=2')
      expect(result.variables).toHaveLength(2)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('重复')
    })
  })

  describe('敏感字段检测', () => {
    it('SECRET 关键词标记为敏感', () => {
      const result = parseEnvFile('API_SECRET=xxx')
      expect(result.variables[0].isSensitive).toBe(true)
    })

    it('PASSWORD 关键词标记为敏感', () => {
      const result = parseEnvFile('DB_PASSWORD=xxx')
      expect(result.variables[0].isSensitive).toBe(true)
    })

    it('普通变量不标记为敏感', () => {
      const result = parseEnvFile('APP_NAME=myapp')
      expect(result.variables[0].isSensitive).toBe(false)
    })
  })

  describe('行号记录', () => {
    it('正确记录变量所在行号', () => {
      const content = '# comment\n\nKEY=value'
      const result = parseEnvFile(content)
      expect(result.variables[0].line).toBe(3)
    })
  })

  describe('createEmptyVariable', () => {
    it('创建空白变量', () => {
      const v = createEmptyVariable()
      expect(v.key).toBe('')
      expect(v.value).toBe('')
      expect(v.isNew).toBe(true)
      expect(v.isDisabled).toBe(false)
      expect(v.id).toBeTruthy()
    })
  })
})
