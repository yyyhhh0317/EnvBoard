// sync 命令：把 .env.example 中缺失的 key 追加到 .env（不覆盖已有值）
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { parseEnvFile } from '../../../src/utils/parser/envParser.ts'
import { appendEnvFile } from '../core/writer.ts'

interface SyncOptions {
  target?: string
  example?: string
  dryRun?: boolean
  json?: boolean
}

export function syncCommand(options: SyncOptions): void {
  try {
    const targetPath = options.target ?? '.env'
    const examplePath = options.example ?? '.env.example'

    if (!fs.existsSync(examplePath)) {
      throw new Error(`找不到模板文件 ${examplePath}，请先创建或运行 \`envboard init\``)
    }
    // target 不存在是允许的：appendEnvFile 会创建
    if (!fs.existsSync(targetPath)) {
      console.log(chalk.gray(`目标文件 ${targetPath} 不存在，将自动创建\n`))
    }

    const example = parseEnvFile(fs.readFileSync(examplePath, 'utf-8'), path.basename(examplePath))
    const existing = new Set<string>()
    if (fs.existsSync(targetPath)) {
      const target = parseEnvFile(fs.readFileSync(targetPath, 'utf-8'), path.basename(targetPath))
      target.variables
        .filter((v) => !v.isDisabled && v.key)
        .forEach((v) => existing.add(v.key))
    }

    const missing = example.variables
      .filter((v) => !v.isDisabled && v.key && !existing.has(v.key))
      .map((v) => ({ key: v.key, value: v.value, comment: v.comment }))

    if (missing.length === 0) {
      if (options.json) {
        console.log(JSON.stringify({ appended: [], skipped: [], message: 'no missing keys' }))
      } else {
        console.log(chalk.green('✓ 没有缺失变量，无需同步'))
      }
      return
    }

    if (options.dryRun) {
      if (options.json) {
        console.log(JSON.stringify({ dryRun: true, wouldAppend: missing.map((m) => m.key) }, null, 2))
      } else {
        console.log(chalk.cyan(`预览：将向 ${targetPath} 追加 ${missing.length} 个变量（--dryRun 未实际写入）\n`))
        for (const m of missing) {
          console.log(`  ${chalk.cyan('+')} ${m.key}=${m.value || ''}${m.comment ? `  # ${m.comment}` : ''}`)
        }
      }
      return
    }

    const { appended, skipped } = appendEnvFile(targetPath, missing)

    if (options.json) {
      console.log(JSON.stringify({ appended, skipped }))
    } else {
      console.log(chalk.green(`✓ 已向 ${targetPath} 同步 ${appended.length} 个变量\n`))
      for (const k of appended) console.log(`  ${chalk.green('+')} ${k}`)
      if (skipped.length > 0) {
        console.log(chalk.gray(`\n  跳过 ${skipped.length} 个已存在变量（未覆盖）`))
      }
    }
  } catch (err) {
    console.error(chalk.red(`错误: ${(err as Error).message}`))
    process.exit(1)
  }
}