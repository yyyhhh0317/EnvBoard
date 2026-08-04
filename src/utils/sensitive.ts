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
 * 匹配规则：按非字母数字字符分段后，任一段命中关键词即视为敏感。
 * 避免子串匹配导致的误判（如 MONKEY 含 KEY、AUTHOR 含 AUTH）。
 */
export function isSensitiveKey(key: string): boolean {
  if (!key) return false
  const upper = key.toUpperCase()
  // 按非字母数字字符切分，每段独立匹配
  const segments = upper.split(/[^A-Z0-9]+/).filter(Boolean)
  return SENSITIVE_KEYWORDS.some((kw) => segments.includes(kw))
}

/** 对敏感值进行脱敏，返回固定占位符 */
export function maskValue(): string {
  return '****'
}
