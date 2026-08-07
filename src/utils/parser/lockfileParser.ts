// lockfile 解析器：yarn.lock / pnpm-lock.yaml / package-lock.json
import type { Dependency, DependencyParseResult, DepGraphNode } from '../../types'
import { buildLockGraph } from '../graph/lockGraph'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** 解析 yarn.lock（v1 格式） */
function parseYarnLock(content: string): Dependency[] {
  const deps: Dependency[] = []
  const lines = content.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // 依赖键行：不以空格开头，且后续有 version 行
    if (line && !line.startsWith(' ') && !line.startsWith('#') && !line.startsWith('//')) {
      // 收集键（可能跨行）
      const keyLine = line.trim().replace(/:$/, '')
      // 找到 version 行
      let version = ''
        for (let j = i + 1; j < lines.length && j < i + 20; j++) {
          const l = lines[j].trim()
          if (l.startsWith('version ')) version = l.replace(/^version\s+/, '').replace(/["']/g, '')
          if (l === '' || (!lines[j].startsWith(' ') && lines[j] !== '')) break
        }
      if (version) {
        // yarn.lock 键可能含多个范围，取第一个包名
        // 形如 "@babel/code-frame@^7.0.0" 或 "lodash@^4.0.0, lodash@^4.17.15"
        const firstKey = keyLine.split(',').map((s) => s.trim())[0]
        const nameMatch = firstKey.match(/^(.+?)@([^@]+)$/)
        const name = nameMatch ? nameMatch[1].replace(/^["']|["']$/g, '') : firstKey
        const spec = nameMatch ? nameMatch[2].replace(/["']/g, '') : ''
        deps.push({
          id: genId(),
          name,
          versionSpec: spec,
          lockedVersion: version,
          category: 'dependencies',
          line: i + 1,
        })
      }
    }
    i++
  }
  return deps
}

/** 解析 pnpm-lock.yaml（v6+ 简化格式）
 * 结构：
 * dependencies:
 *   package-name:
 *     specifier: ^1.0.0
 *     version: 1.0.1
 */
function parsePnpmLock(content: string): Dependency[] {
  const deps: Dependency[] = []
  const lines = content.split(/\r?\n/)
  let i = 0
  while (i < lines.length) {
    const line = lines[i]
    // dependencies: 或 devDependencies: 表头下，2 空格缩进的包名行
    if (/^\s{2,4}[A-Za-z@]/.test(line) && line.endsWith(':')) {
      const name = line.trim().replace(/:$/, '')
      let specifier = ''
      let version = ''
      for (let j = i + 1; j < lines.length && j < i + 10; j++) {
        const l = lines[j]
        if (!l.startsWith('      ') && !l.startsWith('    ')) break
        const trimmed = l.trim()
        if (trimmed.startsWith('specifier:')) specifier = trimmed.replace(/^specifier:\s*/, '').replace(/["']/g, '')
        if (trimmed.startsWith('version:')) version = trimmed.replace(/^version:\s*/, '').replace(/["']/g, '')
      }
      if (version || specifier) {
        deps.push({
          id: genId(),
          name,
          versionSpec: specifier,
          lockedVersion: version,
          category: 'dependencies',
          line: i + 1,
        })
      }
    }
    i++
  }
  return deps
}

/** 解析 package-lock.json（v3 格式） */
function parsePackageLock(content: string): Dependency[] {
  const deps: Dependency[] = []
  try {
    const lock = JSON.parse(content)
    const packages = lock.packages ?? lock.dependencies ?? {}
    if (packages && typeof packages === 'object') {
      Object.entries(packages).forEach(([key, value]) => {
        if (!key) return
        // 键形如 "node_modules/lodash" 或 "@scope/pkg"
        const parts = key.split('node_modules/')
        const name = parts[parts.length - 1] || key
        const v = value as { version?: string }
        if (v && v.version) {
          deps.push({
            id: genId(),
            name,
            versionSpec: '',
            lockedVersion: v.version,
            category: 'dependencies',
            line: 0,
          })
        }
      })
    }
  } catch {
    // 解析失败由上层捕获
  }
  return deps
}

export function parseLockfile(
  content: string,
  filename: string,
): DependencyParseResult {
  const meta: Record<string, string> = {}
  const errors: string[] = []
  const name = filename.toLowerCase()
  let dependencies: Dependency[] = []
  let graph: DepGraphNode | null = null

  // package-lock.json：解析依赖 + 构建依赖树（v3 含 packages 字段）
  const tryParsePackageLock = (text: string) => {
    try {
      const lock = JSON.parse(text) as { packages?: Record<string, { version?: string; dependencies?: Record<string, string> }> }
      if (lock.packages && typeof lock.packages === 'object') {
        graph = buildLockGraph(lock)
      }
    } catch {
      graph = null
    }
    return parsePackageLock(text)
  }

  if (name === 'yarn.lock') {
    dependencies = parseYarnLock(content)
    meta['format'] = 'yarn.lock v1'
  } else if (name === 'pnpm-lock.yaml') {
    dependencies = parsePnpmLock(content)
    meta['format'] = 'pnpm-lock.yaml'
  } else if (name === 'package-lock.json') {
    dependencies = tryParsePackageLock(content)
    meta['format'] = 'package-lock.json'
  } else {
    // 按内容推断
    if (content.includes('lockfileVersion')) {
      dependencies = tryParsePackageLock(content)
      meta['format'] = 'package-lock.json'
    } else if (content.startsWith('#') && content.includes('yarn')) {
      dependencies = parseYarnLock(content)
      meta['format'] = 'yarn.lock'
    } else {
      dependencies = parsePnpmLock(content)
      meta['format'] = 'pnpm-lock.yaml'
    }
  }

  if (dependencies.length === 0) {
    errors.push('lockfile 中未解析到任何依赖项，可能格式不匹配')
  }

  meta['count'] = String(dependencies.length)
  return { type: 'lockfile', dependencies, meta, errors, filename, graph }
}
