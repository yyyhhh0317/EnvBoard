// package.json 解析器
import type { Dependency, DependencyCategory, DependencyParseResult } from '../../types'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

const DEP_CATEGORIES: DependencyCategory[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
]

interface PkgJson {
  name?: string
  version?: string
  description?: string
  dependencies?: Record<string, string>
  devDependencies?: Record<string, string>
  peerDependencies?: Record<string, string>
  optionalDependencies?: Record<string, string>
  scripts?: Record<string, string>
  engines?: Record<string, string>
  [key: string]: unknown
}

export function parsePackageJson(content: string, filename = 'package.json'): DependencyParseResult {
  const dependencies: Dependency[] = []
  const meta: Record<string, string> = {}
  const errors: string[] = []

  let pkg: PkgJson
  try {
    pkg = JSON.parse(content)
  } catch (e) {
    errors.push(`JSON 解析失败：${e instanceof Error ? e.message : String(e)}`)
    return { type: 'npm', dependencies, meta, errors, filename }
  }

  // 提取元数据
  if (pkg.name) meta['name'] = pkg.name
  if (pkg.version) meta['version'] = pkg.version
  if (pkg.description) meta['description'] = pkg.description

  let line = 1

  // 依赖分类
  DEP_CATEGORIES.forEach((cat) => {
    const deps = pkg[cat] as Record<string, string> | undefined
    if (deps && typeof deps === 'object') {
      Object.entries(deps).forEach(([name, version]) => {
        dependencies.push({
          id: genId(),
          name,
          versionSpec: String(version),
          category: cat,
          line: line++,
        })
      })
    }
  })

  // engines（node 版本约束等）
  if (pkg.engines && typeof pkg.engines === 'object') {
    Object.entries(pkg.engines).forEach(([name, version]) => {
      dependencies.push({
        id: genId(),
        name,
        versionSpec: String(version),
        category: 'engines',
        isMeta: true,
        line: line++,
      })
    })
  }

  // scripts
  if (pkg.scripts && typeof pkg.scripts === 'object') {
    Object.entries(pkg.scripts).forEach(([name, cmd]) => {
      dependencies.push({
        id: genId(),
        name,
        versionSpec: String(cmd),
        category: 'scripts',
        isScript: true,
        line: line++,
      })
    })
  }

  if (dependencies.length === 0 && Object.keys(meta).length === 0) {
    errors.push('未在 package.json 中找到 dependencies / devDependencies / scripts 等字段')
  }

  return { type: 'npm', dependencies, meta, errors, filename }
}
