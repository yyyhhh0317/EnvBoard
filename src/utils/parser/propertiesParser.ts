// Java properties 配置解析器（v1.3.0）：解析为 EnvVariable[]
// 支持：
//  - key=value 与 key: value 两种分隔符
//  - # 与 ! 整行注释
//  - 反斜杠续行（\ 结尾的物理行与下一行合并）
//  - 常见转义：\: \= \\ \n \t \uXXXX（值内）
import type { EnvVariable, ParseResult } from '../../types'
import { isSensitiveKey } from '../sensitive'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

const KEY_RE = /^([^=:\s][^=:]*?)\s*[:=]\s*(.*)$/

/** 统计行尾连续反斜杠数量 */
function trailingBackslashes(line: string): number {
  let n = 0
  for (let i = line.length - 1; i >= 0 && line[i] === '\\'; i--) n++
  return n
}

/** 处理续行：反斜杠结尾（奇数个）的物理行与后续行拼接 */
function joinContinuations(lines: string[]): string[] {
  const out: string[] = []
  for (const raw of lines) {
    if (out.length > 0 && trailingBackslashes(out[out.length - 1]) % 2 === 1) {
      out[out.length - 1] = out[out.length - 1].replace(/\\+$/, '') + raw.trim()
    } else {
      out.push(raw)
    }
  }
  return out
}

/** 解析值中的转义序列 */
function unescapeValue(value: string): string {
  return value
    .replace(/\\u([0-9a-fA-F]{4})/g, (_, hex) => String.fromCharCode(parseInt(hex, 16)))
    .replace(/\\t/g, '\t')
    .replace(/\\n/g, '\n')
    .replace(/\\:/g, ':')
    .replace(/\\=/g, '=')
    .replace(/\\\\/g, '\\')
}

export function parseProperties(content: string, filename = 'application.properties'): ParseResult {
  const variables: EnvVariable[] = []
  const errors: string[] = []

  if (!content || !content.trim()) {
    errors.push('文件内容为空，请上传包含配置项的文件')
    return { variables, errors, filename }
  }

  const text = content.replace(/^\uFEFF/, '')
  const physicalLines = joinContinuations(text.split(/\r?\n/))
  let pendingComment = ''

  physicalLines.forEach((raw, index) => {
    const lineNum = index + 1
    const stripped = raw.trim()

    if (stripped === '') {
      pendingComment = ''
      return
    }

    // 注释行（# 或 !）
    if (stripped.startsWith('#') || stripped.startsWith('!')) {
      const inner = stripped.slice(1).trim()
      pendingComment = pendingComment ? `${pendingComment} ${inner}` : inner
      return
    }

    const m = stripped.match(KEY_RE)
    if (m) {
      const key = m[1].trim()
      const rawValue = m[2].trim()
      // 剥离整行注释（properties 中 # 后若前面无空白则视为值的一部分，此处仅处理行首空白的 #）
      const value = unescapeValue(rawValue)
      variables.push({
        id: genId(),
        key,
        value,
        comment: pendingComment,
        isSensitive: isSensitiveKey(key),
        isDisabled: false,
        isModified: false,
        isNew: false,
        error: null,
        line: lineNum,
      })
      pendingComment = ''
      return
    }

    errors.push(`第 ${lineNum} 行：格式无效，应为 key=value 或 key: value`)
    pendingComment = ''
  })

  return { variables, errors, filename }
}
