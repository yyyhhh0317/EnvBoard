// requirements.txt 解析器
import type { Dependency, DependencyParseResult } from '../../types'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

/** requirements.txt 一行可能的形态：
 * package==1.0.0
 * package>=1.0,<2.0
 * package~=1.0
 * package          # 无版本约束
 * # 注释
 * -r other.txt     # 引入其他文件
 * -e ./local-pkg   # 可编辑安装
 * git+https://...  # VCS 地址
 */
const REQ_PATTERN =
  /^([A-Za-z0-9_][A-Za-z0-9_.-]*)\s*([~<>=!]=?[^;\s#]+)?/

export function parseRequirements(
  content: string,
  filename = 'requirements.txt',
): DependencyParseResult {
  const dependencies: Dependency[] = []
  const meta: Record<string, string> = {}
  const errors: string[] = []
  const seen = new Set<string>()

  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/)

  lines.forEach((raw, i) => {
    const lineNum = i + 1
    const stripped = raw.trim()
    if (!stripped) return

    // 注释行
    if (stripped.startsWith('#')) {
      // 环境标记注释（如 # via package）暂不特殊处理
      return
    }

    // 选项行：-r / -e / -f / --index-url 等
    if (stripped.startsWith('-')) {
      dependencies.push({
        id: genId(),
        name: stripped,
        versionSpec: '',
        category: 'optional',
        comment: '安装选项/引用',
        line: lineNum,
      })
      return
    }

    // VCS/URL 安装（git+、http、文件路径）
    if (/^(git\+|https?:|\.\/|\/)/.test(stripped)) {
      dependencies.push({
        id: genId(),
        name: stripped.split('#')[0].trim(),
        versionSpec: '',
        category: 'dependencies',
        comment: 'VCS/URL 来源',
        line: lineNum,
      })
      return
    }

    // 标准包声明
    const match = stripped.match(REQ_PATTERN)
    if (!match) {
      errors.push(`第 ${lineNum} 行：无法识别的格式「${stripped}」`)
      return
    }

    const name = match[1]
    const versionSpec = (match[2] ?? '').trim()
    // 分离行内注释
    const inlineComment = stripped.includes('#')
      ? stripped.slice(stripped.indexOf('#') + 1).trim()
      : ''

    if (seen.has(name.toLowerCase())) {
      errors.push(`第 ${lineNum} 行：重复的包 ${name}`)
    } else {
      seen.add(name.toLowerCase())
    }

    dependencies.push({
      id: genId(),
      name,
      versionSpec,
      category: 'dependencies',
      comment: inlineComment || undefined,
      line: lineNum,
    })
  })

  if (dependencies.length === 0) {
    errors.push('requirements.txt 中未找到任何包声明')
  }

  meta['source'] = filename
  return { type: 'pip', dependencies, meta, errors, filename }
}
