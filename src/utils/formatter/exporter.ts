// 环境变量导出格式化工具
import type { EnvVariable, ExportFormat } from '../../types'

/** 将值用引号包裹（包含空格或特殊字符时） */
function quoteValue(value: string): string {
  if (value === '') return ''
  // 含空格、#、引号时用双引号包裹，内部双引号转义
  if (/[\s#"']/.test(value)) {
    return `"${value.replace(/"/g, '\\"')}"`
  }
  return value
}

/**
 * 将变量列表格式化为指定格式的字符串。
 * @param variables 变量列表
 * @param format 导出格式
 * @param includeSensitive 是否包含敏感值（false 时敏感值输出为 ****）
 */
export function formatVariables(
  variables: EnvVariable[],
  format: ExportFormat,
  includeSensitive = true,
): string {
  // 仅导出未禁用且有 key 的变量
  const items = variables.filter((v) => !v.isDisabled && v.key.trim())

  const resolveValue = (v: EnvVariable): string => {
    if (!includeSensitive && v.isSensitive) return '****'
    return v.value
  }

  switch (format) {
    case 'env':
      return items
        .map((v) => {
          const lines: string[] = []
          if (v.comment) lines.push(`# ${v.comment}`)
          lines.push(`${v.key}=${quoteValue(resolveValue(v))}`)
          return lines.join('\n')
        })
        .join('\n\n')

    case 'env-example':
      // 模板格式：只保留 key，不含真实值
      return items
        .map((v) => {
          const lines: string[] = []
          if (v.comment) lines.push(`# ${v.comment}`)
          lines.push(`${v.key}=`)
          return lines.join('\n')
        })
        .join('\n\n')

    case 'json': {
      const obj: Record<string, string> = {}
      items.forEach((v) => {
        obj[v.key] = resolveValue(v)
      })
      return JSON.stringify(obj, null, 2)
    }

    case 'yaml':
      return items
        .map((v) => {
          const val = resolveValue(v)
          // YAML 中含特殊字符的值用双引号包裹
          const formatted = /[:#{}\[\],&*!|>'"%@`]/.test(val) || val === ''
            ? `"${val.replace(/"/g, '\\"')}"`
            : val
          return `${v.key}: ${formatted}`
        })
        .join('\n')

    default:
      return ''
  }
}

/** 触发文件下载 */
export function downloadFile(content: string, filename: string): void {
  const blob = new Blob([content], { type: 'text/plain;charset=utf-8' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

/** 复制文本到剪贴板 */
export async function copyToClipboard(text: string): Promise<boolean> {
  try {
    await navigator.clipboard.writeText(text)
    return true
  } catch {
    return false
  }
}

/** 根据导出格式获取默认文件名 */
export function getExportFilename(format: ExportFormat): string {
  switch (format) {
    case 'env':
      return '.env'
    case 'env-example':
      return '.env.example'
    case 'json':
      return 'env.json'
    case 'yaml':
      return 'env.yaml'
  }
}
