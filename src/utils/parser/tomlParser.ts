// pyproject.toml 最小化 TOML 解析器
// 仅覆盖 pyproject.toml 常用语法：表头、键值、字符串、数组、布尔、数字
// 不实现完整 TOML 规范（如多行字符串、日期、内联表的高级用法），聚焦依赖提取需求

export type TomlValue = string | boolean | number | string[] | TomlTable
export interface TomlTable {
  [key: string]: TomlValue
}

/** 解析 TOML 文本为嵌套表结构 */
export function parseToml(text: string): TomlTable {
  const root: TomlTable = {}
  // 当前所在的表，用路径数组表示
  let current: TomlTable = root
  const lines = text.replace(/^\uFEFF/, '').split(/\r?\n/)
  // 处理数组跨行（dependencies = [ ... ]）
  let pendingArray: { key: string; parts: string[] } | null = null

  for (let i = 0; i < lines.length; i++) {
    let line = lines[i].trim()
    if (!line || line.startsWith('#')) continue

    // 正在收集多行数组
    if (pendingArray) {
      pendingArray.parts.push(line)
      if (line.includes(']')) {
        const full = pendingArray.parts.join(' ')
        const arrStr = full.slice(full.indexOf('['), full.lastIndexOf(']') + 1)
        current[pendingArray.key] = parseStringArray(arrStr)
        pendingArray = null
      }
      continue
    }

    // 表头 [section] 或 [section.sub]
    if (line.startsWith('[') && line.endsWith(']')) {
      const path = line.slice(1, -1).trim().split('.').map((s) => s.trim())
      current = path.reduce((acc: TomlTable, key: string) => {
        if (acc[key] === undefined || typeof acc[key] !== 'object' || Array.isArray(acc[key])) {
          acc[key] = {} as TomlTable
        }
        return acc[key] as TomlTable
      }, root)
      continue
    }

    // 键值对
    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) continue

    const key = line.slice(0, eqIdx).trim().replace(/^["']|["']$/g, '')
    const valuePart = line.slice(eqIdx + 1).trim()

    // 去掉行内注释（# 前需有空白，且不在引号内）
    const cleanedValue = stripInlineComment(valuePart)

    // 数组开始
    if (cleanedValue.startsWith('[')) {
      if (cleanedValue.includes(']')) {
        // 单行数组
        current[key] = parseStringArray(cleanedValue)
      } else {
        // 多行数组
        pendingArray = { key, parts: [cleanedValue] }
      }
      continue
    }

    // 标量值
    current[key] = parseScalar(cleanedValue)
  }

  return root
}

/** 解析标量值：字符串 / 布尔 / 数字 */
function parseScalar(raw: string): TomlValue {
  const v = raw.trim()
  // 双引号字符串
  if (v.startsWith('"') && v.endsWith('"')) {
    return v.slice(1, -1).replace(/\\"/g, '"')
  }
  // 单引号字符串（TOML literal string）
  if (v.startsWith("'") && v.endsWith("'")) {
    return v.slice(1, -1)
  }
  // 布尔
  if (v === 'true') return true
  if (v === 'false') return false
  // 数字
  if (/^-?\d+$/.test(v)) return parseInt(v, 10)
  if (/^-?\d+\.\d+$/.test(v)) return parseFloat(v)
  // 其他原样返回为字符串
  return v
}

/** 解析字符串数组 ["a", "b", "c"] */
function parseStringArray(raw: string): string[] {
  const inner = raw.slice(raw.indexOf('[') + 1, raw.lastIndexOf(']'))
  if (!inner.trim()) return []
  // 按逗号分割，但要处理引号内的逗号
  const items: string[] = []
  let buf = ''
  let inStr = false
  let quote = ''
  for (let i = 0; i < inner.length; i++) {
    const ch = inner[i]
    if (!inStr && (ch === '"' || ch === "'")) {
      inStr = true
      quote = ch
      continue
    }
    if (inStr && ch === quote) {
      inStr = false
      continue
    }
    if (!inStr && ch === ',') {
      if (buf.trim()) items.push(buf.trim())
      buf = ''
      continue
    }
    if (inStr) buf += ch
  }
  if (buf.trim()) items.push(buf.trim())
  return items
}

/** 去除行内注释：# 前有空白且不在引号内 */
function stripInlineComment(raw: string): string {
  let inStr = false
  let quote = ''
  for (let i = 0; i < raw.length; i++) {
    const ch = raw[i]
    if (!inStr && (ch === '"' || ch === "'")) {
      inStr = true
      quote = ch
      continue
    }
    if (inStr && ch === quote) {
      inStr = false
      continue
    }
    if (!inStr && ch === '#' && i > 0 && /\s/.test(raw[i - 1])) {
      return raw.slice(0, i).trim()
    }
  }
  return raw.trim()
}
