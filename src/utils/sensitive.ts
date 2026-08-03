// 敏感值识别工具

/** 敏感关键词列表（大写匹配） */
export const SENSITIVE_KEYWORDS = [
  'PASSWORD',
  'SECRET',
  'TOKEN',
  'KEY',
  'API_KEY',
  'PRIVATE',
  'CREDENTIAL',
  'AUTH',
  'ACCESS_KEY',
  'SECRET_KEY',
  'DATABASE_URL',
] as const

/**
 * 判断变量名是否为敏感变量。
 * 匹配规则：变量名（大写后）包含任一敏感关键词即视为敏感。
 */
export function isSensitiveKey(key: string): boolean {
  if (!key) return false
  const upper = key.toUpperCase()
  return SENSITIVE_KEYWORDS.some((kw) => upper.includes(kw))
}

/** 对敏感值进行脱敏，返回固定占位符 */
export function maskValue(): string {
  return '****'
}
