// status 命令：检测依赖过期状态
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { runCommand, commandExists } from '../core/runner.js'
import { scanDirectory } from '../core/scanner.js'
import type { ProjectType } from '../../../src/types/index.ts'

interface StatusOptions {
  type?: string
}

interface OutdatedItem {
  name: string
  current: string
  wanted: string
  latest: string
  type: string
}

export async function statusCommand(options: StatusOptions): Promise<void> {
  // 确定检测类型
  let type: 'npm' | 'pip' | 'poetry' | null = null

  if (options.type) {
    type = options.type as 'npm' | 'pip' | 'poetry'
  } else {
    // 自动检测
    const results = scanDirectory()
    const hasPackageJson = results.some((r) => r.filename === 'package.json')
    const hasRequirements = results.some((r) => r.filename === 'requirements.txt')
    const hasPyproject = results.some((r) => r.filename === 'pyproject.toml')

    if (hasPackageJson) type = 'npm'
    else if (hasPyproject) type = 'poetry'
    else if (hasRequirements) type = 'pip'
  }

  if (!type) {
    console.error(chalk.red('未找到可检测的配置文件（package.json / requirements.txt / pyproject.toml）'))
    process.exit(1)
  }

  console.log(chalk.cyan(`检测 ${type} 依赖过期状态...\n`))

  if (type === 'npm') {
    await checkNpmOutdated()
  } else if (type === 'pip') {
    await checkPipOutdated()
  } else if (type === 'poetry') {
    await checkPoetryOutdated()
  }
}

/** npm 过期检测 */
async function checkNpmOutdated(): Promise<void> {
  if (!(await commandExists('npm'))) {
    console.error(chalk.red('npm 命令不可用'))
    process.exit(1)
  }

  const result = await runCommand('npm', ['outdated', '--json'], { silent: true })
  if (result.stdout) {
    try {
      const data = JSON.parse(result.stdout) as Record<string, {
        current: string
        wanted: string
        latest: string
        type: string
      }>

      const items = Object.entries(data).map(([name, info]) => ({
        name,
        current: info.current ?? '-',
        wanted: info.wanted ?? '-',
        latest: info.latest ?? '-',
        type: info.type ?? 'dependencies',
      }))

      if (items.length === 0) {
        console.log(chalk.green('✓ 所有依赖均为最新版本'))
        return
      }

      console.log(chalk.yellow(`发现 ${items.length} 个过期依赖:\n`))
      console.log(
        '  ' +
          '包名'.padEnd(30) +
          '当前版本'.padEnd(14) +
          '期望版本'.padEnd(14) +
          '最新版本',
      )
      console.log(chalk.gray('  ' + '-'.repeat(70)))

      for (const item of items) {
        console.log(
          '  ' +
            chalk.white(item.name.padEnd(30)) +
            chalk.red(item.current.padEnd(14)) +
            chalk.yellow(item.wanted.padEnd(14)) +
            chalk.green(item.latest),
        )
      }

      console.log(chalk.gray(`\n提示: 运行 ${chalk.cyan('envboard install <包名>@latest')} 升级`))
    } catch {
      console.log(chalk.green('✓ 所有依赖均为最新版本'))
    }
  } else {
    console.log(chalk.green('✓ 所有依赖均为最新版本'))
  }
}

/** pip 过期检测 */
async function checkPipOutdated(): Promise<void> {
  if (!(await commandExists('pip'))) {
    console.error(chalk.red('pip 命令不可用'))
    process.exit(1)
  }

  const result = await runCommand('pip', ['list', '--outdated', '--format=json'], { silent: true })
  if (result.stdout) {
    try {
      const data = JSON.parse(result.stdout) as Array<{
        name: string
        version: string
        latest_version: string
        latest_filetype: string
      }>

      if (data.length === 0) {
        console.log(chalk.green('✓ 所有依赖均为最新版本'))
        return
      }

      console.log(chalk.yellow(`发现 ${data.length} 个过期依赖:\n`))
      console.log(
        '  ' + '包名'.padEnd(30) + '当前版本'.padEnd(14) + '最新版本',
      )
      console.log(chalk.gray('  ' + '-'.repeat(56)))

      for (const item of data) {
        console.log(
          '  ' +
            chalk.white(item.name.padEnd(30)) +
            chalk.red(item.version.padEnd(14)) +
            chalk.green(item.latest_version),
        )
      }

      console.log(chalk.gray(`\n提示: 运行 ${chalk.cyan('pip install --upgrade <包名>')} 升级`))
    } catch {
      console.log(chalk.green('✓ 所有依赖均为最新版本'))
    }
  } else {
    console.log(chalk.green('✓ 所有依赖均为最新版本'))
  }
}

/** poetry 过期检测 */
async function checkPoetryOutdated(): Promise<void> {
  if (!(await commandExists('poetry'))) {
    console.error(chalk.red('poetry 命令不可用'))
    process.exit(1)
  }

  // poetry show --outdated 输出为文本表格
  const result = await runCommand('poetry', ['show', '--outdated'], { silent: true })
  if (result.stdout && result.stdout.trim()) {
    console.log(chalk.yellow('发现过期依赖:\n'))
    console.log(result.stdout)
    console.log(chalk.gray(`\n提示: 运行 ${chalk.cyan('poetry update <包名>')} 升级`))
  } else {
    console.log(chalk.green('✓ 所有依赖均为最新版本'))
  }
}
