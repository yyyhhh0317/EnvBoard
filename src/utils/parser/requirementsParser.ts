// requirements.txt 解析器
import type { Dependency, DependencyCategory, DependencyParseResult } from '../../types'

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

/** 分组关键词映射：注释中包含这些关键词时切换分类 */
const GROUP_KEYWORDS: { pattern: RegExp; category: DependencyCategory }[] = [
  { pattern: /dev|develop|开发/i, category: 'devDependencies' },
  { pattern: /test|测试/i, category: 'optional' },
  { pattern: /optional|可选|extra/i, category: 'optionalDependencies' },
  { pattern: /build|构建|编译/i, category: 'optional' },
  { pattern: /doc|文档/i, category: 'optional' },
  { pattern: /prod|production|生产|核心|主要/i, category: 'dependencies' },
]

/** 根据注释内容判断分组分类，未匹配返回 null */
function detectGroupFromComment(comment: string): DependencyCategory | null {
  for (const { pattern, category } of GROUP_KEYWORDS) {
    if (pattern.test(comment)) return category
  }
  return null
}

export function parseRequirements(
  content: string,
  filename = 'requirements.txt',
): DependencyParseResult {
  const dependencies: Dependency[] = []
  const meta: Record<string, string> = {}
  const errors: string[] = []
  const seen = new Set<string>()

  // 当前分组分类，默认为生产依赖
  let currentCategory: DependencyCategory = 'dependencies'
  let currentGroupName = '生产依赖'

  const lines = content.replace(/^\uFEFF/, '').split(/\r?\n/)

  lines.forEach((raw, i) => {
    const lineNum = i + 1
    const stripped = raw.trim()
    if (!stripped) return

    // 注释行：检测分组切换
    if (stripped.startsWith('#')) {
      const inner = stripped.slice(1).trim()
      // 形如 # ===== 开发依赖 ===== 的分组标题
      const detected = detectGroupFromComment(inner)
      if (detected) {
        currentCategory = detected
        // 提取分组名（去掉 ===== 等装饰符）
        currentGroupName = inner.replace(/^[=\-*/\s]+|[=\-*/\s]+$/g, '').trim() || inner
      }
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
        category: currentCategory,
        comment: `VCS/URL 来源 · ${currentGroupName}`,
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
      category: currentCategory,
      comment: inlineComment || currentGroupName,
      line: lineNum,
    })
  })

  if (dependencies.length === 0) {
    errors.push('requirements.txt 中未找到任何包声明')
  }

  // 统计各分类数量，写入元数据
  const categoryCounts: Record<string, number> = {}
  dependencies.forEach((d) => {
    categoryCounts[d.category] = (categoryCounts[d.category] ?? 0) + 1
  })
  meta['source'] = filename
  meta['groups'] = Object.keys(categoryCounts).length.toString()

  return { type: 'pip', dependencies, meta, errors, filename }
}
