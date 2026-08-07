// 依赖关系图构建（v1.4.0）：从 package-lock.json v3 构建依赖树
// 结构：packages[""] 是根包（含顶层 dependencies），packages["node_modules/<name>"] 是各依赖包
// 规则：
//  - 依赖解析优先取顶层 node_modules/<name>，兜底取任意同名条目（近似，用于可视化）
//  - 环/重复引用：同一包在祖先链中再次出现时标记 duplicated 并停止展开
//  - 深度上限 30，避免病态 lockfile 撑爆
import type { DepGraphNode } from '../../types'

interface LockEntry {
  version?: string
  dependencies?: Record<string, string>
}

interface PackageLockLike {
  name?: string
  version?: string
  packages?: Record<string, LockEntry>
}

const MAX_DEPTH = 30

export function buildLockGraph(lock: PackageLockLike): DepGraphNode | null {
  const pkgs: Record<string, LockEntry> = lock.packages ?? {}
  if (Object.keys(pkgs).length === 0) return null

  const rootEntry = pkgs[''] ?? {}

  /** 按包名解析条目：优先顶层 node_modules/<name>，兜底任意同名条目 */
  function resolve(name: string): LockEntry | null {
    const top = pkgs[`node_modules/${name}`]
    if (top) return top
    for (const [path, p] of Object.entries(pkgs)) {
      const parts = path.split('node_modules/')
      if (parts[parts.length - 1] === name) return p
    }
    return null
  }

  function build(name: string, spec: string | undefined, depth: number, seen: Set<string>): DepGraphNode {
    const entry = resolve(name)
    const node: DepGraphNode = {
      name,
      version: entry?.version ?? '',
      spec,
      children: [],
      duplicated: seen.has(name),
    }
    if (node.duplicated || depth >= MAX_DEPTH) return node

    seen.add(name)
    const deps = entry?.dependencies ?? {}
    for (const [childName, childSpec] of Object.entries(deps)) {
      node.children.push(build(childName, childSpec, depth + 1, seen))
    }
    return node
  }

  const root: DepGraphNode = {
    name: lock.name ?? 'root',
    version: lock.version ?? '',
    children: [],
  }
  const rootDeps = rootEntry.dependencies ?? {}
  const seen = new Set<string>()
  seen.add(root.name)
  for (const [name, spec] of Object.entries(rootDeps)) {
    root.children.push(build(name, spec, 1, seen))
  }
  return root
}
