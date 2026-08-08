// init 命令：根据当前目录现状生成 .env / .env.example 模板
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import { generateEnvTemplate } from '../core/writer.ts'

interface InitOptions {
  force?: boolean
}

export function initCommand(options: InitOptions): void {
  try {
    const cwd = process.cwd()
    const envPath = path.join(cwd, '.env')
    const examplePath = path.join(cwd, '.env.example')
    const envExists = fs.existsSync(envPath)
    const exampleExists = fs.existsSync(examplePath)

    // 安全：避免覆盖已存在的文件
    const overwrite = (target: string) => {
      if (options.force) return true
      console.log(chalk.yellow(`⚠ ${target} 已存在，使用 --force 覆盖`))
      return false
    }

    if (!envExists && exampleExists) {
      // .env.example → .env
      fs.copyFileSync(examplePath, envPath)
      console.log(chalk.green(`✓ 已从 .env.example 生成 .env`))
      console.log(chalk.gray(`  ${envPath}`))
    } else if (envExists && !exampleExists) {
      // .env → .env.example（值清空，保留注释）
      const { count } = generateEnvTemplate(envPath, examplePath)
      console.log(chalk.green(`✓ 已从 .env 生成 .env.example 模板（${count} 个变量）`))
      console.log(chalk.gray(`  ${examplePath}`))
      console.log(chalk.gray(`  提示：示例文件中的值已清空，提交前请检查是否含敏感信息`))
    } else if (!envExists && !exampleExists) {
      console.log(chalk.yellow('未找到 .env 或 .env.example，无法初始化'))
      console.log(chalk.gray('提示：可手动创建 .env.example 定义变量骨架，或运行 `envboard scan` 查看现有配置'))
    } else {
      console.log(chalk.green('✓ .env 与 .env.example 均已存在，无需初始化'))
      if (options.force) {
        console.log(chalk.gray('  使用 --force 可强制覆盖（谨慎）'))
      }
    }
  } catch (err) {
    console.error(chalk.red(`错误: ${(err as Error).message}`))
    process.exit(1)
  }
}