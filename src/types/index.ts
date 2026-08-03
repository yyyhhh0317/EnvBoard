// 环境变量数据模型

/** 单个环境变量 */
export interface EnvVariable {
  /** 唯一标识 */
  id: string
  /** 变量名 */
  key: string
  /** 变量值 */
  value: string
  /** 行注释（不含 # 前缀） */
  comment: string
  /** 是否为敏感变量 */
  isSensitive: boolean
  /** 是否被注释掉（行首以 # 开头且包含 = 的变量） */
  isDisabled: boolean
  /** 是否被修改过 */
  isModified: boolean
  /** 是否为新增变量 */
  isNew: boolean
  /** 解析错误信息（无错误为 null） */
  error: string | null
  /** 原始行号 */
  line: number
}

/** 解析结果 */
export interface ParseResult {
  /** 解析出的变量列表 */
  variables: EnvVariable[]
  /** 解析过程中的警告/错误信息 */
  errors: string[]
  /** 源文件名 */
  filename: string
}

/** 对比状态 */
export type CompareStatus = 'match' | 'missing' | 'extra' | 'empty'

/** 对比结果项 */
export interface CompareItem {
  key: string
  status: CompareStatus
  /** 当前 .env 中的值（缺失时为 undefined） */
  currentValue?: string
  /** example 中的值 */
  exampleValue?: string
}

/** 导出格式 */
export type ExportFormat = 'env' | 'env-example' | 'json' | 'yaml'

/** 主题类型 */
export type Theme = 'light' | 'dark'

// ===== 依赖管理数据模型（v0.2.0）=====

/** 项目/配置类型 */
export type ProjectType = 'env' | 'npm' | 'pip' | 'poetry' | 'lockfile'

/** 依赖分类 */
export type DependencyCategory =
  | 'dependencies'
  | 'devDependencies'
  | 'peerDependencies'
  | 'optionalDependencies'
  | 'optional'
  | 'scripts'
  | 'engines'
  | 'metadata'

/** 单个依赖项 */
export interface Dependency {
  /** 唯一标识 */
  id: string
  /** 包名 / 脚本名 / 元数据键 */
  name: string
  /** 版本约束或范围，如 ^4.3.3、>=1.0,<2.0、* */
  versionSpec: string
  /** lockfile 中锁定的精确版本（仅 lockfile 类型有） */
  lockedVersion?: string
  /** registry 查询到的最新版本（需联网 opt-in） */
  latestVersion?: string
  /** 分类 */
  category: DependencyCategory
  /** 是否过期（当前版本与最新版本不一致） */
  isOutdated?: boolean
  /** 是否为脚本（package.json scripts） */
  isScript?: boolean
  /** 是否为元数据（name/version/description 等） */
  isMeta?: boolean
  /** 备注/注释 */
  comment?: string
  /** 来源行号 */
  line: number
}

/** 依赖解析结果 */
export interface DependencyParseResult {
  /** 项目类型 */
  type: ProjectType
  /** 依赖列表 */
  dependencies: Dependency[]
  /** 项目元数据（name/version/description 等） */
  meta: Record<string, string>
  /** 解析过程中的警告/错误信息 */
  errors: string[]
  /** 源文件名 */
  filename: string
}

/** registry 来源类型 */
export type RegistryType = 'npm' | 'pypi'
