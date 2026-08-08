// diff 命令：对比两个 .env 类配置文件（默认 .env vs .env.example）
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { parseEnvFile } from '../../../src/utils/parser/envParser.ts'
import { compareVariables } from '../../../src/utils/parser/compare.ts'
import type { CompareItem } from '../../../src/types/index.ts'

interface DiffOptions {
  target?: string
  example?: string
  json?: boolean
}

export function diffCommand(options: DiffOptions): void {
  try {
    const targetPath = options.target ?? '.env'
    const examplePath = options.example ?? '.env.example'

    if (!fs.existsSync(targetPath)) throw new Error(`文件不存在: ${targetPath}`)
    if (!fs.existsSync(examplePath)) throw new Error(`文件不存在: ${examplePath}`)

    const target = parseEnvFile(fs.readFileSync(targetPath, 'utf-8'), path.basename(targetPath))
    const example = parseEnvFile(fs.readFileSync(examplePath, 'utf-8'), path.basename(examplePath))
    const items = compareVariables(target.variables, example.variables)

    const missing = items.filter((i) => i.status === 'missing')
    const extra = items.filter((i) => i.status === 'extra')
    const empty = items.filter((i) => i.status === 'empty')
    const match = items.filter((i) => i.status === 'match')

    if (options.json) {
      console.log(
        JSON.stringify(
          {
            target: targetPath,
            example: examplePath,
            counts: {
              match: match.length,
              missing: missing.length,
              extra: extra.length,
              empty: empty.length,
            },
            items,
          },
          null,
          2,
        ),
      )
      return
    }

    console.log(chalk.bold.cyan(`\n📊 ${targetPath} vs ${examplePath}\n`))
    console.log(
      chalk.green(`✓ ${match.length} 一致`) +
        chalk.gray(' · ') +
        chalk.yellow(`⚠ ${missing.length} 缺失`) +
        chalk.gray(' · ') +
        chalk.blue(`+ ${extra.length} 多余`) +
        chalk.gray(' · ') +
        chalk.red(`○ ${empty.length} 空值`),
    )

    printSection('缺失（example 有，当前没有）', missing, chalk.yellow)
    printSection('空值（两边都有但当前值为空）', empty, chalk.red)
    printSection('多余（当前有，example 没有）', extra, chalk.blue)

    if (missing.length === 0 && empty.length === 0) {
      console.log(chalk.green('\n✓ 配置完整'))
    } else {
      console.log(chalk.gray('\n提示：使用 `envboard sync` 可将缺失项同步到 ' + targetPath))
    }
  } catch (err) {
    console.error(chalk.red(`错误: ${(err as Error).message}`))
    process.exit(1)
  }
}

function printSection(title: string, items: CompareItem[], color: (s: string) => string): void {
  if (items.length === 0) return
  console.log(chalk.gray(`\n  ${title} (${items.length})`))
  for (const item of items) {
    const exVal = item.exampleValue ? `  ← ${item.exampleValue}` : ''
    const curVal = item.currentValue !== undefined ? `  [当前: ${item.currentValue || '<空>'}]` : ''
    console.log(`    ${color('•')} ${item.key}${exVal}${curVal}`)
  }
}