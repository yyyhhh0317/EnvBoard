// install 命令：安装依赖
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { runCommand, commandExists } from '../core/runner.js'
import { scanDirectory } from '../core/scanner.js'
import { writeRequirements } from '../core/writer.js'
import type { ProjectType } from '../../../src/types/index.ts'

interface InstallOptions {
  dev?: boolean
  type?: string
}

export async function installCommand(pkg: string | undefined, options: InstallOptions): Promise<void> {
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
    await npmInstall(pkg, options.dev ?? false)
  } else if (type === 'pip') {
    await pipInstall(pkg)
  } else if (type === 'poetry') {
    await poetryAdd(pkg, options.dev ?? false)
  }
}

/** 自动检测包管理器类型 */
function autoDetectType(): 'npm' | 'pip' | 'poetry' | null {
  const results = scanDirectory()
  if (results.some((r) => r.filename === 'package.json')) return 'npm'
  if (results.some((r) => r.filename === 'pyproject.toml')) return 'poetry'
  if (results.some((r) => r.filename === 'requirements.txt')) return 'pip'
  return null
}

/** npm install */
async function npmInstall(pkg: string | undefined, dev: boolean): Promise<void> {
  if (!(await commandExists('npm'))) {
    console.error(chalk.red('npm 命令不可用'))
    process.exit(1)
  }

  const args: string[] = ['install']
  if (pkg) args.push(pkg)
  if (dev) args.push('--save-dev')

  console.log(chalk.cyan(`执行: npm ${args.join(' ')}\n`))
  const result = await runCommand('npm', args)

  if (result.success) {
    console.log(chalk.green('\n✓ 安装成功'))
  } else {
    console.error(chalk.red('\n✗ 安装失败'))
    process.exit(1)
  }
}

/** pip install */
async function pipInstall(pkg: string | undefined): Promise<void> {
  if (!(await commandExists('pip'))) {
    console.error(chalk.red('pip 命令不可用'))
    process.exit(1)
  }

  if (!pkg) {
    // 无包名：按 requirements.txt 安装
    const reqPath = path.join(process.cwd(), 'requirements.txt')
    if (!fs.existsSync(reqPath)) {
      console.error(chalk.red('未找到 requirements.txt'))
      process.exit(1)
    }
    console.log(chalk.cyan('执行: pip install -r requirements.txt\n'))
    const result = await runCommand('pip', ['install', '-r', 'requirements.txt'])
    if (result.success) {
      console.log(chalk.green('\n✓ 安装成功'))
    } else {
      console.error(chalk.red('\n✗ 安装失败'))
      process.exit(1)
    }
    return
  }

  // 有包名：安装并写入 requirements.txt
  console.log(chalk.cyan(`执行: pip install ${pkg}\n`))
  const result = await runCommand('pip', ['install', pkg])
  if (!result.success) {
    console.error(chalk.red('\n✗ 安装失败'))
    process.exit(1)
  }

  // 写入 requirements.txt
  const reqPath = path.join(process.cwd(), 'requirements.txt')
  if (fs.existsSync(reqPath)) {
    // 获取已安装版本
    const showResult = await runCommand('pip', ['show', pkg], { silent: true })
    const versionMatch = showResult.stdout.match(/Version:\s*(.+)/)
    const version = versionMatch ? versionMatch[1].trim() : ''
    if (version) {
      writeRequirements(reqPath, [{ name: pkg, versionSpec: `==${version}`, action: 'update' }])
      console.log(chalk.green(`\n✓ 已写入 requirements.txt: ${pkg}==${version}`))
    }
  } else {
    console.log(chalk.green('\n✓ 安装成功（未找到 requirements.txt，未写入）'))
  }
}

/** poetry add */
async function poetryAdd(pkg: string | undefined, dev: boolean): Promise<void> {
  if (!(await commandExists('poetry'))) {
    console.error(chalk.red('poetry 命令不可用'))
    process.exit(1)
  }

  if (!pkg) {
    // 无包名：执行 poetry install
    console.log(chalk.cyan('执行: poetry install\n'))
    const result = await runCommand('poetry', ['install'])
    if (result.success) {
      console.log(chalk.green('\n✓ 安装成功'))
    } else {
      console.error(chalk.red('\n✗ 安装失败'))
      process.exit(1)
    }
    return
  }

  const args: string[] = ['add', pkg]
  if (dev) args.push('--group', 'dev')

  console.log(chalk.cyan(`执行: poetry ${args.join(' ')}\n`))
  const result = await runCommand('poetry', args)
  if (result.success) {
    console.log(chalk.green('\n✓ 安装成功'))
  } else {
    console.error(chalk.red('\n✗ 安装失败'))
    process.exit(1)
  }
}
