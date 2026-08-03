// .env 文件解析器
import type { EnvVariable, ParseResult } from '../../types'
import { isSensitiveKey } from '../sensitive'

/** 生成唯一 id */
function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** 合法的变量名：字母/下划线开头，可含字母数字下划线与点 */
const KEY_PATTERN = /^([A-Za-z_][A-Za-z0-9_.]*)\s*=\s*(.*)$/

/**
 * 从值的剩余部分中分离出内联注释。
 * 仅当 # 前存在空白时才视为注释，避免值中含 # 被误判。
 */
function splitInlineComment(remaining: string): { value: string; comment: string } {
  const match = remaining.match(/(^.*?)\s+#(.*)$/)
  if (match) {
    return { value: match[1], comment: match[2].trim() }
  }
  return { value: remaining, comment: '' }
}

/** 解析单行的值部分，处理引号包裹 */
function parseValue(raw: string): { value: string; comment: string } {
  const trimmed = raw.trimStart()

  // 双引号包裹
  if (trimmed.startsWith('"')) {
    const end = trimmed.indexOf('"', 1)
    if (end !== -1) {
      const value = trimmed.slice(1, end)
      const rest = trimmed.slice(end + 1)
      const { comment } = splitInlineComment(rest)
      return { value, comment }
    }
  }

  // 单引号包裹
  if (trimmed.startsWith("'")) {
    const end = trimmed.indexOf("'", 1)
    if (end !== -1) {
      const value = trimmed.slice(1, end)
      const rest = trimmed.slice(end + 1)
      const { comment } = splitInlineComment(rest)
      return { value, comment }
    }
  }

  // 无引号：分离内联注释
  return splitInlineComment(trimmed)
}

/**
 * 解析 .env 文件内容。
 * @param content 文件文本内容
 * @param filename 源文件名
 */
export function parseEnvFile(content: string, filename = '.env'): ParseResult {
  const variables: EnvVariable[] = []
  const errors: string[] = []

  if (!content || !content.trim()) {
    errors.push('文件内容为空，请上传包含环境变量的文件')
    return { variables, errors, filename }
  }

  // 移除 BOM
  const text = content.replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/)

  // 暂存的块注释（连续的注释行会挂到下一个变量上）
  let pendingComment = ''
  const seenKeys = new Map<string, number>()

  lines.forEach((raw, index) => {
    const lineNum = index + 1
    const stripped = raw.trim()

    // 空行：清空暂存注释
    if (stripped === '') {
      pendingComment = ''
      return
    }

    // 注释行
    if (stripped.startsWith('#')) {
      const inner = stripped.slice(1).trim()
      const keyMatch = inner.match(KEY_PATTERN)
      // 形如 # KEY=VALUE，视为被注释掉的变量
      if (keyMatch) {
        const key = keyMatch[1]
        const { value, comment } = parseValue(keyMatch[2])
        variables.push({
          id: genId(),
          key,
          value,
          comment: pendingComment ? `${pendingComment}${comment ? ' ' + comment : ''}` : comment,
          isSensitive: isSensitiveKey(key),
          isDisabled: true,
          isModified: false,
          isNew: false,
          error: null,
          line: lineNum,
        })
        pendingComment = ''
        return
      }
      // 普通注释：累加为块注释
      pendingComment = pendingComment ? `${pendingComment} ${inner}` : inner
      return
    }

    // 变量行
    const match = stripped.match(KEY_PATTERN)
    if (!match) {
      errors.push(`第 ${lineNum} 行：格式无效，应为 KEY=VALUE`)
      pendingComment = ''
      return
    }

    const key = match[1]
    const { value, comment } = parseValue(match[2])

    let error: string | null = null
    if (seenKeys.has(key)) {
      error = `检测到重复的变量名 ${key}（首次出现在第 ${seenKeys.get(key)} 行）`
      errors.push(`第 ${lineNum} 行：${error}`)
    } else {
      seenKeys.set(key, lineNum)
    }

    variables.push({
      id: genId(),
      key,
      value,
      comment: pendingComment ? `${pendingComment}${comment ? ' ' + comment : ''}` : comment,
      isSensitive: isSensitiveKey(key),
      isDisabled: false,
      isModified: false,
      isNew: false,
      error,
      line: lineNum,
    })
    pendingComment = ''
  })

  return { variables, errors, filename }
}

/** 创建一个空白变量（用于新增） */
export function createEmptyVariable(): EnvVariable {
  return {
    id: genId(),
    key: '',
    value: '',
    comment: '',
    isSensitive: false,
    isDisabled: false,
    isModified: false,
    isNew: true,
    error: null,
    line: 0,
  }
}
