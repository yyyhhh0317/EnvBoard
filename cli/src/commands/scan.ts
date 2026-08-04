// scan 命令：扫描并解析本地配置文件
import chalk from 'chalk'
import { scanDirectory, readSpecifiedFile } from '../core/scanner.js'
import type { ScanResult } from '../core/scanner.js'
import type { EnvVariable, Dependency, DependencyParseResult } from '../../../src/types/index.ts'

interface ScanOptions {
  file?: string
  json?: boolean
}

export function scanCommand(options: ScanOptions): void {
  try {
    const results = options.file ? [readSpecifiedFile(options.file)] : scanDirectory()

    if (results.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ files: [] }))
      } else {
        console.log(chalk.yellow('未在当前目录找到配置文件'))
        console.log(chalk.gray('支持: .env / package.json / requirements.txt / pyproject.toml / lockfile'))
      }
      return
    }

    if (options.json) {
      outputJson(results)
    } else {
      outputPretty(results)
    }
  } catch (err) {
    console.error(chalk.red(`错误: ${(err as Error).message}`))
    process.exit(1)
  }
}

/** 美化输出 */
function outputPretty(results: ScanResult[]): void {
  for (const r of results) {
    console.log(chalk.bold.cyan(`\n📄 ${r.filename}`) + chalk.gray(` (${r.type})`))

    if (r.errors.length > 0) {
      for (const e of r.errors) {
        console.log(chalk.yellow(`  ⚠ ${e}`))
      }
    }

    if (r.type === 'env') {
      const vars = (r.parsed as { variables: EnvVariable[] }).variables
      console.log(chalk.gray(`  共 ${vars.length} 个变量`))
      for (const v of vars) {
        if (v.isDisabled) {
          console.log(`  ${chalk.gray.strikethrough(v.key)} = ${chalk.gray(v.value)}`)
          continue
        }
        const key = v.isSensitive ? chalk.red(v.key) : chalk.green(v.key)
        const val = v.isSensitive ? chalk.gray('******') : v.value
        console.log(`  ${key} = ${val}`)
        if (v.comment) {
          console.log(chalk.gray(`    # ${v.comment}`))
        }
      }
    } else if (r.type === 'npm' || r.type === 'pip' || r.type === 'poetry') {
      const depResult = r.parsed as DependencyParseResult
      const deps = depResult.dependencies
      console.log(chalk.gray(`  共 ${deps.length} 项`))

      // 按分类分组输出
      const groups = new Map<string, Dependency[]>()
      for (const d of deps) {
        const g = groups.get(d.category) ?? []
        g.push(d)
        groups.set(d.category, g)
      }

      const categoryLabel: Record<string, string> = {
        dependencies: '生产依赖',
        devDependencies: '开发依赖',
        peerDependencies: '同级依赖',
        optionalDependencies: '可选依赖',
        optional: '可选/扩展',
        scripts: '脚本',
        engines: '运行环境',
        metadata: '元数据',
      }

      for (const [cat, items] of groups) {
        console.log(chalk.blue(`\n  [${categoryLabel[cat] ?? cat}]`))
        for (const d of items) {
          const name = d.isScript ? chalk.magenta(`$ ${d.name}`) : chalk.white(d.name)
          const ver = d.versionSpec ? chalk.gray(d.versionSpec) : ''
          const sub = d.subgroup ? chalk.gray(` (${d.subgroup})`) : ''
          console.log(`    ${name} ${ver}${sub}`)
        }
      }
    } else if (r.type === 'lockfile') {
      console.log(chalk.gray('  (lockfile，详情请用 Web 版查看)'))
    }
  }
}

/** JSON 输出 */
function outputJson(results: ScanResult[]): void {
  const output = results.map((r) => ({
    filename: r.filename,
    type: r.type,
    errors: r.errors,
    data: r.parsed,
  }))
  console.log(JSON.stringify({ files: output }, null, 2))
}
