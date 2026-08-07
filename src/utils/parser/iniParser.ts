// .ini 配置解析器（v1.3.0）：解析为 EnvVariable[]，section 展平为 `SECTION.KEY`
// 支持：
//  - [section] 分段
//  - ; 与 # 注释（含行内注释，要求注释符前有空白）
//  - key = value（值可带引号）
import type { EnvVariable, ParseResult } from '../../types'
import { isSensitiveKey } from '../sensitive'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

const INI_KEY = /^([A-Za-z0-9_.-]+)\s*=\s*(.*)$/
const SECTION_RE = /^\[([^\]]+)\]$/

/** 解析单行的值部分：去引号、剥离行内注释 */
function parseIniValue(raw: string): { value: string; comment: string } {
  const trimmed = raw.trim()
  // 双引号/单引号包裹
  const quoted = trimmed.match(/^["'](.*)["']$/)
  if (quoted) {
    return { value: quoted[1], comment: '' }
  }
  // 行内注释：` ;` 或 ` #`（注释符前有空白才视为注释）
  const m = trimmed.match(/(^.*?)\s+[;#](.*)$/)
  if (m) {
    return { value: m[1].trim(), comment: m[2].trim() }
  }
  return { value: trimmed, comment: '' }
}

export function parseIni(content: string, filename = 'config.ini'): ParseResult {
  const variables: EnvVariable[] = []
  const errors: string[] = []

  if (!content || !content.trim()) {
    errors.push('文件内容为空，请上传包含配置项的文件')
    return { variables, errors, filename }
  }

  const text = content.replace(/^\uFEFF/, '')
  const lines = text.split(/\r?\n/)
  let section = ''
  let pendingComment = ''

  lines.forEach((raw, index) => {
    const lineNum = index + 1
    const stripped = raw.trim()

    if (stripped === '') {
      pendingComment = ''
      return
    }

    // 注释行
    if (stripped.startsWith(';') || stripped.startsWith('#')) {
      const inner = stripped.slice(1).trim()
      pendingComment = pendingComment ? `${pendingComment} ${inner}` : inner
      return
    }

    // section 行（暂存注释保留给该 section 的第一个 key）
    const sm = stripped.match(SECTION_RE)
    if (sm) {
      section = sm[1].trim()
      return
    }

    // key = value
    const m = stripped.match(INI_KEY)
    if (m) {
      const rawKey = m[1].trim()
      const key = section ? `${section}.${rawKey}` : rawKey
      const { value, comment } = parseIniValue(m[2])
      variables.push({
        id: genId(),
        key,
        value,
        comment: pendingComment ? `${pendingComment}${comment ? ' ' + comment : ''}` : comment,
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

    errors.push(`第 ${lineNum} 行：格式无效，应为 [section] 或 key=value`)
    pendingComment = ''
  })

  return { variables, errors, filename }
}
