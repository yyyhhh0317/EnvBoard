// 多环境导出：单文件（带 @env 分段）或多文件打包
import type { EnvName, EnvVariable } from '../../types'

/** 将单个环境变量列表序列化为 .env 文本 */
function serializeEnv(vars: EnvVariable[]): string {
  const lines: string[] = []
  for (const v of vars) {
    if (v.error) continue
    // 仅当值含空格或「空格+#」（会被解析为内联注释）时才加引号
    const needQuote = v.value.includes(' ') || /\s+#/.test(v.value)
    const value = needQuote ? `"${v.value}"` : v.value
    const line = v.isDisabled ? `# ${v.key}=${value}` : `${v.key}=${value}`
    if (v.comment && !v.isDisabled) {
      lines.push(`# ${v.comment}`)
    }
    lines.push(line)
  }
  return lines.join('\n')
}

/** 导出为单文件（带 @env 分段标记） */
export function exportMultiEnvAsSingle(
  envs: Record<EnvName, EnvVariable[]>,
  envOrder: EnvName[],
): string {
  const blocks: string[] = []
  for (const envName of envOrder) {
    const vars = envs[envName] ?? []
    blocks.push(`# @env ${envName}`)
    blocks.push(serializeEnv(vars))
    blocks.push('')
  }
  return blocks.join('\n').trimEnd() + '\n'
}

/** 导出为多文件映射（环境名 -> 文件内容） */
export function exportMultiEnvAsFiles(
  envs: Record<EnvName, EnvVariable[]>,
  envOrder: EnvName[],
): { filename: string; content: string; envName: EnvName }[] {
  return envOrder.map((envName) => ({
    filename: `.env.${envName}`,
    content: serializeEnv(envs[envName] ?? []) + '\n',
    envName,
  }))
}

/** 触发浏览器下载 */
export function downloadFile(filename: string, content: string): void {
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
