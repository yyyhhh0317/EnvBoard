// Monorepo 多包扫描：识别多个配置文件并聚合为包视角
import type {
  DependencyParseResult,
  MonorepoPackage,
  MonorepoScanResult,
  ProjectType,
} from '../../types'
import { detectProjectType } from '../parser/detector'
import { parsePackageJson } from '../parser/packageJsonParser'
import { parsePyproject } from '../parser/pyprojectParser'
import { parseRequirements } from '../parser/requirementsParser'

/** 扫描输入：一个文件 */
export interface MonorepoInput {
  filename: string
  content: string
}

/** 依赖清单类项目类型（env / lockfile 不参与聚合） */
const DEP_TYPES: ProjectType[] = ['npm', 'pip', 'poetry']

/** 解析单个文件为包 */
function parseItem(item: MonorepoInput): MonorepoPackage | null {
  const type = detectProjectType(item.filename, item.content)
  if (!DEP_TYPES.includes(type)) return null

  let result: DependencyParseResult
  if (type === 'npm') result = parsePackageJson(item.content, item.filename)
  else if (type === 'pip') result = parseRequirements(item.content, item.filename)
  else result = parsePyproject(item.content, item.filename)

  // 包名：优先 package.json name，兜底文件名去扩展名
  const name =
    result.meta['name'] ||
    item.filename.replace(/\.(json|toml|txt)$/i, '') ||
    item.filename

  return {
    name,
    filename: item.filename,
    type,
    meta: result.meta,
    dependencies: result.dependencies,
    errors: result.errors,
  }
}

/** 提取 package.json 的 workspaces 模式（非字符串项忽略） */
function extractWorkspaces(content: string): string[] {
  try {
    const pkg = JSON.parse(content) as { workspaces?: unknown }
    if (Array.isArray(pkg.workspaces)) {
      return pkg.workspaces.filter((w): w is string => typeof w === 'string')
    }
  } catch {
    // 非法 JSON 交给解析器报错
  }
  return []
}

/** 扫描多个依赖清单，聚合为 Monorepo 视角 */
export function scanMonorepo(items: MonorepoInput[]): MonorepoScanResult {
  const packages: MonorepoPackage[] = []
  const errors: string[] = []
  let workspaces: string[] = []

  for (const item of items) {
    const type = detectProjectType(item.filename, item.content)
    if (!DEP_TYPES.includes(type)) {
      errors.push(
        `${item.filename}：不是依赖清单（支持 package.json / requirements.txt / pyproject.toml），已跳过`,
      )
      continue
    }
    // workspaces 只认根 package.json（文件名精确匹配）
    if (type === 'npm' && item.filename === 'package.json') {
      workspaces = extractWorkspaces(item.content)
    }
    const pkg = parseItem(item)
    if (pkg) packages.push(pkg)
  }

  // 共享依赖分析：排除 scripts / engines / 元数据项
  const depMap = new Map<string, { package: string; versionSpec: string }[]>()
  for (const pkg of packages) {
    for (const dep of pkg.dependencies) {
      if (dep.isScript || dep.isMeta) continue
      const list = depMap.get(dep.name) ?? []
      list.push({ package: pkg.name, versionSpec: dep.versionSpec })
      depMap.set(dep.name, list)
    }
  }

  const sharedDeps = [...depMap.entries()]
    .filter(([, v]) => v.length >= 2)
    .map(([name, declaredBy]) => ({
      name,
      declaredBy,
      hasConflict: new Set(declaredBy.map((d) => d.versionSpec)).size > 1,
    }))

  const conflicts: MonorepoScanResult['conflicts'] = sharedDeps
    .filter((d) => d.hasConflict)
    .map((d) => ({ name: d.name, versions: d.declaredBy }))

  const isMonorepo = packages.length >= 2 || workspaces.length > 0

  return { packages, sharedDeps, conflicts, workspaces, isMonorepo, errors }
}
