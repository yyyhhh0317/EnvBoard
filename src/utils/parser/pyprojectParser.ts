// pyproject.toml 解析器（PEP 621 + Poetry 格式）
import type { Dependency, DependencyCategory, DependencyParseResult } from '../../types'
import { parseToml, type TomlTable } from './tomlParser'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** 从依赖声明字符串中分离包名与版本约束
 * 例如 "requests>=2.0,<3.0" -> { name: "requests", spec: ">=2.0,<3.0" }
 *      "flask[async]==2.0.1" -> { name: "flask", spec: "[async]==2.0.1" }
 *      "django" -> { name: "django", spec: "" }
 */
function splitNameVersion(decl: string): { name: string; spec: string } {
  const match = decl.match(/^([A-Za-z0-9_][A-Za-z0-9_.-]*)(.*)$/)
  if (!match) return { name: decl, spec: '' }
  return { name: match[1], spec: match[2].trim() }
}

/** 递归收集表中的依赖项 */
function collectFromTable(
  table: TomlTable,
  category: DependencyCategory,
  line: number,
): Dependency[] {
  const deps: Dependency[] = []
  Object.entries(table).forEach(([key, value]) => {
    if (typeof value === 'string') {
      // poetry 格式：key 是包名，value 是版本字符串（可能是 ">=1.0" 或 "*"）
      const { name } = splitNameVersion(key)
      deps.push({
        id: genId(),
        name,
        versionSpec: value,
        category,
        line,
      })
    } else if (typeof value === 'object' && !Array.isArray(value)) {
      // poetry 格式带 extras/约束：{ version = "1.0", extras = ["async"] }
      const sub = value as TomlTable
      const ver = sub['version']
      if (typeof ver === 'string') {
        deps.push({
          id: genId(),
          name: key,
          versionSpec: ver,
          category,
          line,
        })
      }
    }
  })
  return deps
}

export function parsePyproject(
  content: string,
  filename = 'pyproject.toml',
): DependencyParseResult {
  const dependencies: Dependency[] = []
  const meta: Record<string, string> = {}
  const errors: string[] = []

  let root: TomlTable
  try {
    root = parseToml(content)
  } catch (e) {
    errors.push(`TOML 解析失败：${e instanceof Error ? e.message : String(e)}`)
    return { type: 'poetry', dependencies, meta, errors, filename }
  }

  let line = 1

  // === PEP 621 标准格式 [project] ===
  const project = root['project'] as TomlTable | undefined
  if (project && typeof project === 'object') {
    if (typeof project['name'] === 'string') meta['name'] = project['name']
    if (typeof project['version'] === 'string') meta['version'] = project['version']
    if (typeof project['description'] === 'string') meta['description'] = project['description']
    if (typeof project['requires-python'] === 'string') {
      dependencies.push({
        id: genId(),
        name: 'python',
        versionSpec: project['requires-python'],
        category: 'engines',
        isMeta: true,
        line: line++,
      })
    }

    // [project.dependencies] -> 字符串数组
    const deps = project['dependencies']
    if (Array.isArray(deps)) {
      deps.forEach((d) => {
        if (typeof d === 'string') {
          const { name, spec } = splitNameVersion(d)
          dependencies.push({
            id: genId(),
            name,
            versionSpec: spec,
            category: 'dependencies',
            line: line++,
          })
        }
      })
    }

    // [project.optional-dependencies] -> 每个键是可选组名，值为字符串数组
    const optional = project['optional-dependencies'] as TomlTable | undefined
    if (optional && typeof optional === 'object') {
      Object.entries(optional).forEach(([groupName, value]) => {
        if (Array.isArray(value)) {
          value.forEach((d) => {
            if (typeof d === 'string') {
              const { name, spec } = splitNameVersion(d)
              dependencies.push({
                id: genId(),
                name,
                versionSpec: spec,
                category: 'optional',
                subgroup: groupName, // 保留组名（如 dev/test/docs）
                line: line++,
              })
            }
          })
        }
      })
    }
  }

  // === Poetry 格式 [tool.poetry] ===
  const tool = root['tool'] as TomlTable | undefined
  const poetry = tool?.['poetry'] as TomlTable | undefined
  if (poetry && typeof poetry === 'object') {
    if (typeof poetry['name'] === 'string') meta['name'] = poetry['name']
    if (typeof poetry['version'] === 'string') meta['version'] = poetry['version']
    if (typeof poetry['description'] === 'string') meta['description'] = poetry['description']

    const poetryDeps = poetry['dependencies'] as TomlTable | undefined
    if (poetryDeps && typeof poetryDeps === 'object') {
      collectFromTable(poetryDeps, 'dependencies', line++).forEach((d) => dependencies.push(d))
    }
    const poetryDev = poetry['dev-dependencies'] as TomlTable | undefined
    if (poetryDev && typeof poetryDev === 'object') {
      collectFromTable(poetryDev, 'devDependencies', line++).forEach((d) => dependencies.push(d))
    }
  }

  // === [build-system] ===
  const buildSystem = root['build-system'] as TomlTable | undefined
  if (buildSystem && typeof buildSystem === 'object') {
    const requires = buildSystem['requires']
    if (Array.isArray(requires)) {
      requires.forEach((r) => {
        if (typeof r === 'string') {
          const { name, spec } = splitNameVersion(r)
          dependencies.push({
            id: genId(),
            name,
            versionSpec: spec,
            category: 'optional',
            comment: 'build-system',
            line: line++,
          })
        }
      })
    }
  }

  if (dependencies.length === 0 && Object.keys(meta).length === 0) {
    errors.push('未在 pyproject.toml 中找到 [project] 或 [tool.poetry] 依赖配置')
  }

  return { type: 'poetry', dependencies, meta, errors, filename }
}
