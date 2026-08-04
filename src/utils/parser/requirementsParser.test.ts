import { describe, it, expect } from 'vitest'
import { parseRequirements } from './requirementsParser'

describe('requirementsParser', () => {
  describe('基本解析', () => {
    it('解析 package==version', () => {
      const result = parseRequirements('flask==2.3.1')
      expect(result.dependencies).toHaveLength(1)
      expect(result.dependencies[0].name).toBe('flask')
      expect(result.dependencies[0].versionSpec).toBe('==2.3.1')
      expect(result.dependencies[0].category).toBe('dependencies')
    })

    it('解析无版本约束的包', () => {
      const result = parseRequirements('requests')
      expect(result.dependencies[0].name).toBe('requests')
      expect(result.dependencies[0].versionSpec).toBe('')
    })

    it('解析多行包声明', () => {
      const content = 'flask==2.3.1\nrequests>=2.0\npytest~=7.0'
      const result = parseRequirements(content)
      expect(result.dependencies).toHaveLength(3)
    })
  })

  describe('版本约束', () => {
    it('>= 约束', () => {
      const result = parseRequirements('django>=4.0')
      expect(result.dependencies[0].versionSpec).toBe('>=4.0')
    })

    it('复合约束', () => {
      const result = parseRequirements('django>=4.0,<5.0')
      expect(result.dependencies[0].versionSpec).toBe('>=4.0,<5.0')
    })

    it('~= 约束', () => {
      const result = parseRequirements('numpy~=1.20')
      expect(result.dependencies[0].versionSpec).toBe('~=1.20')
    })
  })

  describe('注释分组', () => {
    it('根据注释切换分类', () => {
      const content = [
        '# 生产依赖',
        'flask==2.3.1',
        '# 开发依赖 - 测试',
        'pytest~=7.0',
      ].join('\n')
      const result = parseRequirements(content)
      expect(result.dependencies[0].name).toBe('flask')
      expect(result.dependencies[0].category).toBe('dependencies')
      expect(result.dependencies[1].name).toBe('pytest')
      expect(result.dependencies[1].category).toBe('devDependencies')
      expect(result.dependencies[1].subgroup).toBe('测试')
    })

    it('注释标题中的装饰符被清理', () => {
      const content = '# ===== 生产依赖 =====\nflask==2.3.1'
      const result = parseRequirements(content)
      expect(result.dependencies[0].category).toBe('dependencies')
    })
  })

  describe('选项行', () => {
    it('-r 引用其他文件', () => {
      const result = parseRequirements('-r requirements-dev.txt')
      expect(result.dependencies[0].name).toBe('-r requirements-dev.txt')
      expect(result.dependencies[0].category).toBe('optional')
    })

    it('-e 可编辑安装', () => {
      const result = parseRequirements('-e ./local-pkg')
      expect(result.dependencies[0].name).toBe('-e ./local-pkg')
    })
  })

  describe('VCS/URL', () => {
    it('git+ URL', () => {
      const result = parseRequirements('git+https://github.com/user/repo.git')
      expect(result.dependencies[0].name).toBe('git+https://github.com/user/repo.git')
      expect(result.dependencies[0].comment).toBe('VCS/URL 来源')
    })

    it('https URL', () => {
      const result = parseRequirements('https://example.com/pkg.tar.gz')
      expect(result.dependencies[0].name).toBe('https://example.com/pkg.tar.gz')
    })
  })

  describe('行内注释', () => {
    it('包声明后的行内注释', () => {
      const result = parseRequirements('flask==2.3.1 # web framework')
      expect(result.dependencies[0].name).toBe('flask')
      expect(result.dependencies[0].comment).toBe('web framework')
    })
  })

  describe('重复检测', () => {
    it('重复包名产生错误', () => {
      const result = parseRequirements('flask==2.3.1\nflask==2.0.0')
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('重复')
    })

    it('大小写不敏感的重复检测', () => {
      const result = parseRequirements('Flask==2.3.1\nflask==2.0.0')
      expect(result.errors).toHaveLength(1)
    })
  })

  describe('空文件', () => {
    it('无包声明返回错误', () => {
      const result = parseRequirements('# only comments\n\n')
      expect(result.dependencies).toHaveLength(0)
      expect(result.errors).toHaveLength(1)
      expect(result.errors[0]).toContain('未找到')
    })
  })

  describe('元数据', () => {
    it('source 字段记录文件名', () => {
      const result = parseRequirements('flask==2.3.1', 'requirements-dev.txt')
      expect(result.meta['source']).toBe('requirements-dev.txt')
    })

    it('groups 字段记录分类数', () => {
      const content = '# 生产依赖\nflask==2.3.1\n# 开发依赖\npytest~=7.0'
      const result = parseRequirements(content)
      expect(result.meta['groups']).toBe('2')
    })
  })

  describe('BOM 处理', () => {
    it('BOM 头被正确移除', () => {
      const result = parseRequirements('\uFEFFflask==2.3.1')
      expect(result.dependencies).toHaveLength(1)
      expect(result.dependencies[0].name).toBe('flask')
    })
  })
})
