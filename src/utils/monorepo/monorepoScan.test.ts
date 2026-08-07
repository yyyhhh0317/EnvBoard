import { describe, expect, it } from 'vitest'
import { scanMonorepo } from './monorepoScan'

const pkg = (name: string, deps: Record<string, string>, extra: Record<string, unknown> = {}) =>
  JSON.stringify({ name, version: '1.0.0', dependencies: deps, ...extra })

describe('scanMonorepo', () => {
  it('单文件（无 workspaces）不算 monorepo，但仍输出包', () => {
    const result = scanMonorepo([{ filename: 'package.json', content: pkg('app', { react: '^18.0.0' }) }])
    expect(result.isMonorepo).toBe(false)
    expect(result.packages).toHaveLength(1)
    expect(result.packages[0].name).toBe('app')
    expect(result.packages[0].dependencies[0].name).toBe('react')
  })

  it('识别 workspaces 并判定为 monorepo', () => {
    const root = pkg('root', {}, { workspaces: ['packages/*'] })
    const result = scanMonorepo([{ filename: 'package.json', content: root }])
    expect(result.workspaces).toEqual(['packages/*'])
    expect(result.isMonorepo).toBe(true)
  })

  it('两个及以上包判定为 monorepo 并识别共享依赖', () => {
    const a = { filename: 'apps/a/package.json', content: pkg('a', { react: '^18.0.0', axios: '^1.0.0' }) }
    const b = { filename: 'apps/b/package.json', content: pkg('b', { react: '^18.2.0', lodash: '^4.17.0' }) }
    const result = scanMonorepo([a, b])
    expect(result.isMonorepo).toBe(true)
    expect(result.packages).toHaveLength(2)
    // react 被两个包声明 → 共享
    expect(result.sharedDeps.map((d) => d.name)).toContain('react')
    // 版本约束不一致 → 冲突
    const reactDep = result.sharedDeps.find((d) => d.name === 'react')
    expect(reactDep?.hasConflict).toBe(true)
    expect(result.conflicts.map((c) => c.name)).toContain('react')
    // 单一包声明的依赖不共享
    expect(result.sharedDeps.map((d) => d.name)).not.toContain('axios')
    expect(result.sharedDeps.map((d) => d.name)).not.toContain('lodash')
  })

  it('相同版本约束不视为冲突', () => {
    const a = { filename: 'apps/a/package.json', content: pkg('a', { react: '^18.0.0' }) }
    const b = { filename: 'apps/b/package.json', content: pkg('b', { react: '^18.0.0' }) }
    const result = scanMonorepo([a, b])
    const reactDep = result.sharedDeps.find((d) => d.name === 'react')
    expect(reactDep?.hasConflict).toBe(false)
    expect(result.conflicts).toHaveLength(0)
  })

  it('混合格式：package.json + requirements.txt + pyproject.toml', () => {
    const items = [
      { filename: 'services/api/package.json', content: pkg('api', { express: '^4.18.0' }) },
      { filename: 'services/worker/requirements.txt', content: 'requests==2.31.0\nflask>=2.0' },
      {
        filename: 'libs/utils/pyproject.toml',
        content: '[project]\nname = "utils"\nversion = "0.1.0"\ndependencies = ["requests>=2.28"]',
      },
    ]
    const result = scanMonorepo(items)
    expect(result.packages).toHaveLength(3)
    expect(result.packages.map((p) => p.type)).toEqual(['npm', 'pip', 'poetry'])
    // requests 出现在 worker 与 utils → 共享
    const requests = result.sharedDeps.find((d) => d.name === 'requests')
    expect(requests).toBeDefined()
    expect(requests?.declaredBy).toHaveLength(2)
  })

  it('跳过 env / lockfile 文件并报告', () => {
    const result = scanMonorepo([
      { filename: 'apps/a/package.json', content: pkg('a', { react: '^18.0.0' }) },
      { filename: '.env', content: 'FOO=bar' },
      { filename: 'package-lock.json', content: '{"lockfileVersion":3,"packages":{}}' },
    ])
    expect(result.packages).toHaveLength(1)
    expect(result.errors).toHaveLength(2)
    expect(result.errors[0]).toContain('.env')
    expect(result.errors[1]).toContain('package-lock.json')
  })

  it('scripts / engines 不参与共享分析', () => {
    const content = JSON.stringify({
      name: 'a',
      version: '1.0.0',
      dependencies: { react: '^18.0.0' },
      scripts: { build: 'vite build' },
      engines: { node: '>=18' },
    })
    const result = scanMonorepo([
      { filename: 'apps/a/package.json', content },
      { filename: 'apps/b/package.json', content: pkg('b', { react: '^18.0.0', build: 'vite build' }) },
    ])
    // build 是 scripts（isScript）→ 不共享
    expect(result.sharedDeps.map((d) => d.name)).toEqual(['react'])
  })

  it('包名兜底：无 name 字段时用文件名', () => {
    const result = scanMonorepo([
      { filename: 'apps/tool/package.json', content: JSON.stringify({ version: '1.0.0', dependencies: {} }) },
    ])
    expect(result.packages[0].name).toBe('apps/tool/package')
  })
})
