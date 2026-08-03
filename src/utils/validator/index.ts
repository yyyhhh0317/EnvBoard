// 变量校验器：类型 / 敏感值 / 命名规范 / 重复 key
import type {
  EnvVariable,
  TemplateVariable,
  ValidationIssue,
  ValidationRule,
  VariableType,
} from '../../types'

/** 常见占位符模式：your-xxx、change-me、xxx-placeholder、示例值 */
const PLACEHOLDER_PATTERNS = [
  /^your[-_]?/i,
  /[-_]change[-_]?me$/i,
  /[-_]placeholder$/i,
  /^example[-_]?/i,
  /^changeme$/i,
  /^replace[-_]?me$/i,
  /^todo$/i,
  /^xxx+$/i,
  /^<.+>$/,
]

/** 布尔值的合法字面量 */
const BOOLEAN_LITERALS = new Set(['true', 'false', '0', '1', 'yes', 'no', 'on', 'off'])

/** 占位符值识别 */
export function isPlaceholderValue(value: string): boolean {
  const v = value.trim()
  if (!v) return false
  return PLACEHOLDER_PATTERNS.some((re) => re.test(v))
}

/** 类型校验 */
export function validateType(value: string, expectedType?: VariableType): boolean {
  if (!expectedType) return true
  const v = value.trim()
  if (!v) return true // 空值由 empty-value 规则处理
  switch (expectedType) {
    case 'string':
      return true
    case 'number':
      return Number.isFinite(Number(v)) && v !== ''
    case 'boolean':
      return BOOLEAN_LITERALS.has(v.toLowerCase())
    case 'url':
      try {
        // 仅校验协议为 http/https，避免误判
        const u = new URL(v)
        return u.protocol === 'http:' || u.protocol === 'https:'
      } catch {
        return false
      }
    case 'email':
      return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)
    default:
      return true
  }
}

/** 命名规范校验：环境变量约定全大写 + 下划线 */
export function validateNaming(key: string): ValidationRule[] {
  const issues: ValidationRule[] = []
  if (!key) return issues
  // 含小写字母
  if (/[a-z]/.test(key)) issues.push('naming-lowercase')
  // 含空格
  if (/\s/.test(key)) issues.push('naming-space')
  return issues
}

/** 单个变量校验 */
function validateVariable(
  v: EnvVariable,
  templateMap: Map<string, TemplateVariable>,
  keyCount: Map<string, number>,
): ValidationIssue[] {
  const issues: ValidationIssue[] = []
  // 被禁用的变量不参与校验
  if (v.isDisabled) return issues
  // 解析错误的变量不重复校验
  if (v.error) return issues

  const tpl = templateMap.get(v.key)

  // 1. 命名规范（无论是否匹配模板都校验）
  for (const rule of validateNaming(v.key)) {
    issues.push({
      variableId: v.id,
      key: v.key,
      severity: 'warning',
      rule,
      message:
        rule === 'naming-lowercase'
          ? '变量名建议全大写 + 下划线（如 DATABASE_URL）'
          : '变量名不应包含空格',
    })
  }

  // 2. 重复 key
  if ((keyCount.get(v.key) ?? 0) > 1) {
    issues.push({
      variableId: v.id,
      key: v.key,
      severity: 'warning',
      rule: 'duplicate-key',
      message: '存在重复的变量名',
    })
  }

  // 3. 敏感值为空
  if (v.isSensitive && !v.value.trim()) {
    issues.push({
      variableId: v.id,
      key: v.key,
      severity: 'error',
      rule: 'sensitive-empty',
      message: '敏感变量不能为空',
    })
  }

  // 4. 必填为空
  if (tpl?.required && !v.value.trim()) {
    issues.push({
      variableId: v.id,
      key: v.key,
      severity: 'error',
      rule: 'empty-value',
      message: '该变量为必填项',
    })
  }

  // 5. 占位符值
  if (v.value.trim() && isPlaceholderValue(v.value)) {
    issues.push({
      variableId: v.id,
      key: v.key,
      severity: 'warning',
      rule: 'placeholder-value',
      message: '值看起来是占位符，请替换为真实值',
    })
  }

  // 6. 类型校验（基于模板期望类型）
  if (tpl?.expectedType && v.value.trim() && !validateType(v.value, tpl.expectedType)) {
    const typeLabel: Record<VariableType, string> = {
      string: '字符串',
      number: '数字',
      boolean: '布尔值（true/false）',
      url: '合法 URL（http(s)://）',
      email: '邮箱地址',
    }
    issues.push({
      variableId: v.id,
      key: v.key,
      severity: 'warning',
      rule: `invalid-${tpl.expectedType === 'number' ? 'number' : tpl.expectedType === 'url' ? 'url' : tpl.expectedType === 'boolean' ? 'boolean' : 'url'}` as ValidationRule,
      message: `期望${typeLabel[tpl.expectedType]}，当前值不匹配`,
    })
  }

  return issues
}

/**
 * 批量校验变量
 * @param variables 当前所有变量
 * @param templateVariables 当前应用的模板变量列表（可选）
 */
export function validateVariables(
  variables: EnvVariable[],
  templateVariables: TemplateVariable[] = [],
): ValidationIssue[] {
  const templateMap = new Map(templateVariables.map((t) => [t.key, t]))
  // 统计 key 出现次数（忽略被禁用变量）
  const keyCount = new Map<string, number>()
  for (const v of variables) {
    if (v.isDisabled) continue
    keyCount.set(v.key, (keyCount.get(v.key) ?? 0) + 1)
  }

  const all: ValidationIssue[] = []
  for (const v of variables) {
    all.push(...validateVariable(v, templateMap, keyCount))
  }
  return all
}

/** 按变量 id 聚合校验结果 */
export function groupIssuesByVariable(issues: ValidationIssue[]): Map<string, ValidationIssue[]> {
  const map = new Map<string, ValidationIssue[]>()
  for (const issue of issues) {
    const arr = map.get(issue.variableId) ?? []
    arr.push(issue)
    map.set(issue.variableId, arr)
  }
  return map
}

/** 统计错误与警告数量 */
export function countIssues(issues: ValidationIssue[]): { errors: number; warnings: number } {
  let errors = 0
  let warnings = 0
  for (const i of issues) {
    if (i.severity === 'error') errors++
    else warnings++
  }
  return { errors, warnings }
}
