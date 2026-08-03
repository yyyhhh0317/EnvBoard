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
