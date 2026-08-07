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

// ===== 撤销/重做（v1.1.0）=====

/** 历史操作类型 */
export type HistoryAction =
  | 'add' // 新增变量
  | 'edit' // 编辑变量
  | 'delete' // 删除变量
  | 'toggle-sensitive' // 切换敏感标记
  | 'sync' // 从 .env.example 同步缺失项
  | 'replace' // 搜索替换

/** 单条历史记录（保存操作前后的变量快照） */
export interface HistoryEntry {
  /** 唯一标识 */
  id: string
  /** 操作类型 */
  action: HistoryAction
  /** 人类可读描述 */
  description: string
  /** 时间戳 */
  timestamp: number
  /** 关联变量名（便于展示） */
  variableKey?: string
  /** 操作前的变量快照 */
  before: EnvVariable[]
  /** 操作后的变量快照 */
  after: EnvVariable[]
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
  /** 子分组名（如 "Web 框架"、"数据库"），来自注释标题 */
  subgroup?: string
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
  /** 依赖树（package-lock.json v3 可构建，v1.4.0） */
  graph?: DepGraphNode | null
}

// ===== 漏洞检查与依赖图（v1.4.0）=====

/** 安全公告严重级别 */
export type AdvisorySeverity = 'critical' | 'high' | 'moderate' | 'low'

/** 单条安全公告 */
export interface DependencyAdvisory {
  /** 公告 id（如 GHSA-xxxx / CVE-xxxx） */
  id: string
  /** 标题/摘要 */
  title: string
  /** 严重级别 */
  severity: AdvisorySeverity
  /** 受影响版本范围描述 */
  range: string
  /** 详情链接 */
  url?: string
}

/** 存在漏洞的依赖 */
export interface VulnerabilityInfo {
  name: string
  /** 当前版本（锁定的或声明的） */
  version: string
  /** 命中的公告列表 */
  advisories: DependencyAdvisory[]
}

/** 依赖树节点（package-lock.json v3） */
export interface DepGraphNode {
  name: string
  /** 锁定的版本（解析不到为空串） */
  version: string
  /** 父级声明的版本范围（根节点有值） */
  spec?: string
  /** 子依赖 */
  children: DepGraphNode[]
  /** 已在祖先链中出现（循环/重复引用），不展开 */
  duplicated?: boolean
}

/** registry 来源类型 */
export type RegistryType = 'npm' | 'pypi'

// ===== Monorepo 扫描（v1.4.0）=====

/** 单个包/项目的扫描结果 */
export interface MonorepoPackage {
  /** 包标识（优先 package.json name，兜底文件名去扩展名） */
  name: string
  /** 源文件名 */
  filename: string
  /** 项目类型（npm / pip / poetry） */
  type: ProjectType
  /** 项目元数据（name/version/description 等） */
  meta: Record<string, string>
  /** 依赖列表（含 scripts/engines，共享分析时过滤） */
  dependencies: Dependency[]
  /** 该文件解析错误 */
  errors: string[]
}

/** 共享依赖项（多个包声明同一依赖） */
export interface MonorepoSharedDep {
  /** 依赖名 */
  name: string
  /** 声明该依赖的包与版本约束 */
  declaredBy: { package: string; versionSpec: string }[]
  /** 是否存在版本冲突（声明约束不一致） */
  hasConflict: boolean
}

/** 版本冲突项 */
export interface MonorepoConflict {
  /** 依赖名 */
  name: string
  /** 各包声明（可能重复版本约束） */
  versions: { package: string; versionSpec: string }[]
}

/** Monorepo 扫描结果 */
export interface MonorepoScanResult {
  /** 各包 */
  packages: MonorepoPackage[]
  /** 共享依赖（≥2 包声明，不含 scripts/engines） */
  sharedDeps: MonorepoSharedDep[]
  /** 版本冲突列表 */
  conflicts: MonorepoConflict[]
  /** 根 package.json 的 workspaces 模式（若有） */
  workspaces: string[]
  /** 是否为 monorepo：≥2 个包，或声明了 workspaces */
  isMonorepo: boolean
  /** 汇总错误（含被跳过的文件） */
  errors: string[]
}

// ===== 配置模板与变量校验（v0.3.0）=====

/** 模板分类 */
export type TemplateCategory = 'general' | 'frontend' | 'python' | 'custom'

/** 配置模板 */
export interface ConfigTemplate {
  /** 唯一标识 */
  id: string
  /** 模板名称 */
  name: string
  /** 描述 */
  description: string
  /** 分类 */
  category: TemplateCategory
  /** 模板变量列表 */
  variables: TemplateVariable[]
}

/** 模板中的单个变量定义 */
export interface TemplateVariable {
  /** 变量名 */
  key: string
  /** 占位值 */
  placeholder: string
  /** 说明 */
  comment: string
  /** 是否敏感 */
  isSensitive: boolean
  /** 期望类型 */
  expectedType?: VariableType
  /** 是否必填 */
  required?: boolean
  /** 值必须匹配的正则（字符串形式，v1.3.0） */
  pattern?: string
  /** 允许的取值集合（v1.3.0） */
  enum?: string[]
}

/** 变量期望类型 */
export type VariableType = 'string' | 'number' | 'boolean' | 'url' | 'email'

/** 校验严重级别 */
export type ValidationSeverity = 'error' | 'warning'

/** 校验结果项 */
export interface ValidationIssue {
  /** 关联的变量 id */
  variableId: string
  /** 变量名 */
  key: string
  /** 严重级别 */
  severity: ValidationSeverity
  /** 规则类型 */
  rule: ValidationRule
  /** 描述信息 */
  message: string
}

/** 校验规则类型 */
export type ValidationRule =
  | 'empty-value'        // 值为空
  | 'placeholder-value'  // 值是占位符
  | 'invalid-number'     // 非数字
  | 'invalid-url'        // 非合法 URL
  | 'invalid-boolean'    // 非布尔值
  | 'naming-lowercase'   // 命名含小写
  | 'naming-space'       // 命名含空格
  | 'duplicate-key'      // 重复 key
  | 'sensitive-empty'    // 敏感值为空
  | 'pattern-mismatch'   // 不匹配 schema 正则（v1.3.0）
  | 'enum-mismatch'      // 不在 schema 允许取值内（v1.3.0）

// ===== 多环境管理（v0.3.0）=====

/** 预设环境名 */
export type PresetEnv = 'development' | 'test' | 'staging' | 'production'

/** 环境标识（预设或自定义） */
export type EnvName = string

/** 环境元信息 */
export interface EnvMeta {
  /** 环境名（如 development / production / custom） */
  name: EnvName
  /** 显示标签（如「开发」「生产」） */
  label: string
  /** 主题色（tailwind 颜色名片段，如 emerald / amber） */
  color: string
  /** 来源文件名（多文件模式有值） */
  filename?: string
  /** 是否为预设环境 */
  isPreset: boolean
}

/** 单文件多环境解析结果 */
export interface MultiEnvParseResult {
  /** 按出现顺序的环境名列表 */
  envOrder: EnvName[]
  /** 每个环境的变量列表 */
  envs: Record<EnvName, EnvVariable[]>
  /** 解析错误/警告 */
  errors: string[]
  /** 源文件名 */
  filename: string
  /** 是否检测到环境分段标记 */
  hasSegments: boolean
}

/** 环境对比项 */
export interface EnvDiffItem {
  /** 变量名 */
  key: string
  /** 各环境的值（环境名 -> 值，缺失则无该字段） */
  values: Record<EnvName, string | undefined>
  /** 对比状态 */
  status: 'same' | 'different' | 'partial-missing'
  /** 该 key 存在于哪些环境 */
  presentIn: EnvName[]
  /** 缺失于哪些环境 */
  missingIn: EnvName[]
}
