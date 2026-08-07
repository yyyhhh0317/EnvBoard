// 敏感值识别工具

/**
 * 敏感关键词列表（大写匹配）。
 * 注意：移除了过宽的 'KEY' 和 'AUTH'，改为精确的复合词，避免 MONKEY/KEYBOARD/AUTHOR 等误判。
 */
export const SENSITIVE_KEYWORDS = [
  'PASSWORD',
  'SECRET',
  'TOKEN',
  'API_KEY',
  'PRIVATE',
  'CREDENTIAL',
  'AUTH_TOKEN',
  'AUTH_SECRET',
  'ACCESS_KEY',
  'SECRET_KEY',
  'DATABASE_URL',
] as const

/**
 * 判断变量名是否为敏感变量。
 * 匹配规则（两种互补，避免误判也不漏判）：
 *  1. 复合关键词：变量名归一化（非字母数字 → _）后包含 API_KEY / SECRET_KEY / DATABASE_URL 等带分隔符的复合词
 *  2. 单段关键词：按非字母数字字符分段后，任一段等于 PASSWORD / SECRET / TOKEN 等单词
 * 不采用纯子串匹配，避免 MONKEY 含 KEY、AUTHOR 含 AUTH 的误判。
 */
export function isSensitiveKey(key: string): boolean {
  if (!key) return false
  const normalized = key.toUpperCase().replace(/[^A-Z0-9]+/g, '_').replace(/^_+|_+$/g, '')
  if (!normalized) return false

  // 1. 复合关键词（含下划线）：归一化后作为整体出现即命中，覆盖 API_KEY / SECRET_KEY / ACCESS_KEY / DATABASE_URL 等
  for (const kw of SENSITIVE_KEYWORDS) {
    if (kw.includes('_') && normalized.includes(kw)) return true
  }

  // 2. 单段关键词：分段后精确匹配
  const segments = normalized.split('_').filter(Boolean)
  return SENSITIVE_KEYWORDS.some((kw) => !kw.includes('_') && segments.includes(kw))
}

/** 对敏感值进行脱敏，返回固定占位符 */
export function maskValue(): string {
  return '****'
}
