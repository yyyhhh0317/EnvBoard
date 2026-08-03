// 依赖导出格式化工具
import type { Dependency, ProjectType } from '../../types'

/** 按分类分组 */
function groupByCategory(deps: Dependency[]): Record<string, Dependency[]> {
  const groups: Record<string, Dependency[]> = {}
  deps.forEach((d) => {
    if (!groups[d.category]) groups[d.category] = []
    groups[d.category].push(d)
  })
  return groups
}

/** 将依赖列表格式化为原始格式字符串 */
export function formatDependencies(
  deps: Dependency[],
  type: ProjectType,
  meta: Record<string, string>,
): string {
  const real = deps.filter((d) => !d.isScript && !d.isMeta && d.name)

  switch (type) {
    case 'npm': {
      const groups = groupByCategory(real.filter((d) => d.category !== 'engines' && d.category !== 'optional'))
      const scripts = deps.filter((d) => d.isScript)
      const engines = deps.filter((d) => d.category === 'engines')
      const obj: Record<string, unknown> = { ...meta }
      if (groups.dependencies) obj.dependencies = toObject(groups.dependencies)
      if (groups.devDependencies) obj.devDependencies = toObject(groups.devDependencies)
      if (groups.peerDependencies) obj.peerDependencies = toObject(groups.peerDependencies)
      if (groups.optionalDependencies) obj.optionalDependencies = toObject(groups.optionalDependencies)
      if (scripts.length) obj.scripts = toObject(scripts)
      if (engines.length) obj.engines = toObject(engines)
      return JSON.stringify(obj, null, 2)
    }

    case 'pip':
      return real
        .map((d) => {
          const line = d.versionSpec ? `${d.name}${d.versionSpec}` : d.name
          return d.comment ? `${line}  # ${d.comment}` : line
        })
        .join('\n')

    case 'poetry': {
      // 导出为 PEP 621 格式
      const lines: string[] = []
      if (meta.name) lines.push(`[project]`, `name = "${meta.name}"`)
      if (meta.version) lines.push(`version = "${meta.version}"`)
      if (meta.description) lines.push(`description = "${meta.description}"`)
      const main = real.filter((d) => d.category === 'dependencies')
      const optional = real.filter((d) => d.category === 'optional')
      if (main.length) {
        lines.push('dependencies = [')
        main.forEach((d) => {
          const decl = d.versionSpec ? `${d.name}${d.versionSpec}` : d.name
          lines.push(`    "${decl}",`)
        })
        lines.push(']')
      }
      if (optional.length) {
        lines.push('[project.optional-dependencies]')
        lines.push('extra = [')
        optional.forEach((d) => {
          const decl = d.versionSpec ? `${d.name}${d.versionSpec}` : d.name
          lines.push(`    "${decl}",`)
        })
        lines.push(']')
      }
      return lines.join('\n')
    }

    case 'lockfile':
      // lockfile 不支持回写，导出为可读列表
      return real
        .map((d) => `${d.name}@${d.lockedVersion ?? d.versionSpec}`)
        .join('\n')

    default:
      return ''
  }
}

function toObject(deps: Dependency[]): Record<string, string> {
  const obj: Record<string, string> = {}
  deps.forEach((d) => {
    obj[d.name] = d.isScript ? d.versionSpec : d.versionSpec
  })
  return obj
}
