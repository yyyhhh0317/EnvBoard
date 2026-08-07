// registry 版本查询（npm / PyPI）
// 重要：此模块会向外部 API 发送包名，仅在用户显式开启时调用
import type { Dependency, RegistryType } from '../../types'

/** 查询单个包的最新版本 */
async function fetchLatestVersion(
  type: RegistryType,
  name: string,
): Promise<string | null> {
  try {
    if (type === 'npm') {
      // scoped 包名需 URL 编码（@scope/name -> @scope%2Fname）
      const encoded = name.startsWith('@') ? name.replace('/', '%2F') : name
      const res = await fetch(`https://registry.npmjs.org/${encoded}/latest`)
      if (!res.ok) return null
      const data = await res.json()
      return data?.version ?? null
    } else {
      // PyPI JSON API
      const res = await fetch(`https://pypi.org/pypi/${name}/json`)
      if (!res.ok) return null
      const data = await res.json()
      return data?.info?.version ?? null
    }
  } catch {
    return null
  }
}

/** 并发限制：避免一次性发太多请求被限流 */
async function mapWithConcurrency<T, R>(
  items: T[],
  limit: number,
  fn: (item: T) => Promise<R>,
): Promise<R[]> {
  const results: R[] = new Array(items.length)
  let index = 0
  const workers = Array.from({ length: Math.min(limit, items.length) }, async () => {
    while (index < items.length) {
      const cur = index++
      results[cur] = await fn(items[cur])
    }
  })
  await Promise.all(workers)
  return results
}

/**
 * 批量查询依赖的最新版本。
 * @param deps 依赖列表（仅查询 dependencies 分类，跳过脚本/元数据）
 * @param type registry 类型
 * @param onProgress 进度回调（已完成数 / 总数）
 * @returns 更新了 latestVersion 和 isOutdated 的依赖列表（新数组）
 */
export async function fetchLatestVersions(
  deps: Dependency[],
  type: RegistryType,
  onProgress?: (done: number, total: number) => void,
): Promise<Dependency[]> {
  // 仅查询真实依赖包（跳过脚本、元数据、engines、可选安装选项）
  const targets = deps.filter(
    (d) =>
      !d.isScript &&
      !d.isMeta &&
      d.category !== 'scripts' &&
      d.category !== 'engines' &&
      d.category !== 'optional' &&
      !d.name.startsWith('-'),
  )

  const total = targets.length
  let done = 0

  const versions = await mapWithConcurrency(targets, 6, async (dep) => {
    const latest = await fetchLatestVersion(type, dep.name)
    done++
    onProgress?.(done, total)
    return latest
  })

  const versionMap = new Map<string, string | null>()
  targets.forEach((dep, i) => versionMap.set(dep.id, versions[i]))

  return deps.map((dep) => {
    const latest = versionMap.get(dep.id)
    if (latest === undefined) return dep
    // 判断是否过期：对比锁定版本或版本约束中的数字版本
    const current = dep.lockedVersion ?? extractVersion(dep.versionSpec)
    const isOutdated = latest !== null && current !== '' && normalizeVersion(current) !== normalizeVersion(latest)
    return { ...dep, latestVersion: latest ?? undefined, isOutdated }
  })
}

/** 从版本约束中提取纯版本号，如 ^4.3.3 -> 4.3.3，>=1.0,<2.0 -> 1.0 */
function extractVersion(spec: string): string {
  if (!spec) return ''
  const match = spec.match(/(\d+\.\d+(?:\.\d+)?(?:[.-][A-Za-z0-9]+)?)/)
  return match ? match[1] : ''
}

/** 归一化版本号便于比较（去前缀 v，补全补丁号） */
function normalizeVersion(v: string): string {
  const s = v.trim().replace(/^v/, '')
  const parts = s.split('.')
  while (parts.length < 3) parts.push('0')
  return parts.slice(0, 3).join('.')
}
