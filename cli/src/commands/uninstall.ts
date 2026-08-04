// uninstall 命令：卸载依赖
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { runCommand, commandExists } from '../core/runner.js'
import { scanDirectory } from '../core/scanner.js'
import { writeRequirements } from '../core/writer.js'
import type { Dependency } from '../../../src/types/index.ts'

interface UninstallOptions {
  type?: string
}

export async function uninstallCommand(pkg: string, options: UninstallOptions): Promise<void> {
  // 确定包管理器
  let type: 'npm' | 'pip' | 'poetry' | null = null
  if (options.type) {
    type = options.type as 'npm' | 'pip' | 'poetry'
  } else {
    type = autoDetectType()
  }

  if (!type) {
    console.error(chalk.red('未找到可识别的配置文件，请用 --type 指定包管理器'))
    process.exit(1)
  }

  if (type === 'npm') {
    await npmUninstall(pkg)
  } else if (type === 'pip') {
    await pipUninstall(pkg)
  } else if (type === 'poetry') {
    await poetryRemove(pkg)
  }
}

function autoDetectType(): 'npm' | 'pip' | 'poetry' | null {
  const results = scanDirectory()
  if (results.some((r) => r.filename === 'package.json')) return 'npm'
  if (results.some((r) => r.filename === 'pyproject.toml')) return 'poetry'
  if (results.some((r) => r.filename === 'requirements.txt')) return 'pip'
  return null
}

/** npm uninstall */
async function npmUninstall(pkg: string): Promise<void> {
  if (!(await commandExists('npm'))) {
    console.error(chalk.red('npm 命令不可用'))
    process.exit(1)
  }

  console.log(chalk.cyan(`执行: npm uninstall ${pkg}\n`))
  const result = await runCommand('npm', ['uninstall', pkg])

  if (result.success) {
    console.log(chalk.green('\n✓ 卸载成功'))
  } else {
    console.error(chalk.red('\n✗ 卸载失败'))
    process.exit(1)
  }
}

/** pip uninstall */
async function pipUninstall(pkg: string): Promise<void> {
  if (!(await commandExists('pip'))) {
    console.error(chalk.red('pip 命令不可用'))
    process.exit(1)
  }

  console.log(chalk.cyan(`执行: pip uninstall -y ${pkg}\n`))
  const result = await runCommand('pip', ['uninstall', '-y', pkg])

  if (!result.success) {
    console.error(chalk.red('\n✗ 卸载失败'))
    process.exit(1)
  }

  // 从 requirements.txt 移除
  const reqPath = path.join(process.cwd(), 'requirements.txt')
  if (fs.existsSync(reqPath)) {
    writeRequirements(reqPath, [{ name: pkg, action: 'remove' }])
    console.log(chalk.green(`\n✓ 卸载成功，已从 requirements.txt 移除 ${pkg}`))
  } else {
    console.log(chalk.green('\n✓ 卸载成功'))
  }
}

/** poetry remove */
async function poetryRemove(pkg: string): Promise<void> {
  if (!(await commandExists('poetry'))) {
    console.error(chalk.red('poetry 命令不可用'))
    process.exit(1)
  }

  console.log(chalk.cyan(`执行: poetry remove ${pkg}\n`))
  const result = await runCommand('poetry', ['remove', pkg])

  if (result.success) {
    console.log(chalk.green('\n✓ 卸载成功'))
  } else {
    console.error(chalk.red('\n✗ 卸载失败'))
    process.exit(1)
  }
}
