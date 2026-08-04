// edit 命令：交互式编辑配置文件
import chalk from 'chalk'
import fs from 'node:fs'
import path from 'node:path'
import inquirer from 'inquirer'
import { scanDirectory, readSpecifiedFile } from '../core/scanner.js'
import { writePackageJson, writeRequirements, writeEnvFile } from '../core/writer.js'
import { parseEnvFile } from '../../../src/utils/parser/envParser.ts'
import type { EnvVariable, Dependency, DependencyParseResult } from '../../../src/types/index.ts'

interface EditOptions {
  file?: string
}

export async function editCommand(options: EditOptions): Promise<void> {
  let result

  if (options.file) {
    result = readSpecifiedFile(options.file)
  } else {
    // 扫描并列出可用文件让用户选择
    const results = scanDirectory()
    if (results.length === 0) {
      console.error(chalk.red('未找到可编辑的配置文件'))
      process.exit(1)
    }

    const { selected } = await inquirer.prompt([
      {
        type: 'list',
        name: 'selected',
        message: '选择要编辑的文件:',
        choices: results.map((r) => ({
          name: `${r.filename} (${r.type})`,
          value: r,
        })),
      },
    ])
    result = selected
  }

  if (result.type === 'env') {
    await editEnv(result.filename)
  } else if (result.type === 'npm') {
    await editPackageJson(result.filename, result.parsed as DependencyParseResult)
  } else if (result.type === 'pip' || result.type === 'poetry') {
    await editRequirements(result.filename, result.parsed as DependencyParseResult)
  } else {
    console.error(chalk.red('不支持的文件类型'))
    process.exit(1)
  }
}

/** 编辑 .env 文件 */
async function editEnv(filename: string): Promise<void> {
  const filepath = path.join(process.cwd(), filename)
  const parsed = parseEnvForEdit(filepath)
  if (!parsed) return

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '选择操作:',
      choices: [
        { name: '修改变量值', value: 'update' },
        { name: '删除变量', value: 'remove' },
        { name: '添加变量', value: 'add' },
      ],
    },
  ])

  if (action === 'update') {
    const { key } = await inquirer.prompt([
      {
        type: 'list',
        name: 'key',
        message: '选择要修改的变量:',
        choices: parsed.variables
          .filter((v) => !v.isDisabled)
          .map((v) => ({
            name: `${v.key} = ${v.isSensitive ? '******' : v.value}`,
            value: v.key,
          })),
      },
    ])

    const target = parsed.variables.find((v) => v.key === key)!
    const { value } = await inquirer.prompt([
      {
        type: 'input',
        name: 'value',
        message: `输入新值 (当前: ${target.isSensitive ? '******' : target.value}):`,
        default: target.value,
      },
    ])

    writeEnvFile(filepath, [{ key, value, action: 'update' }])
    console.log(chalk.green(`✓ 已更新 ${key}`))
  } else if (action === 'remove') {
    const { key } = await inquirer.prompt([
      {
        type: 'list',
        name: 'key',
        message: '选择要删除的变量:',
        choices: parsed.variables
          .filter((v) => !v.isDisabled)
          .map((v) => ({ name: v.key, value: v.key })),
      },
    ])

    const { confirm } = await inquirer.prompt([
      {
        type: 'confirm',
        name: 'confirm',
        message: `确认删除 ${key}?`,
        default: false,
      },
    ])

    if (confirm) {
      writeEnvFile(filepath, [{ key, action: 'remove' }])
      console.log(chalk.green(`✓ 已删除 ${key}`))
    }
  } else if (action === 'add') {
    const { key, value } = await inquirer.prompt([
      { type: 'input', name: 'key', message: '变量名:' },
      { type: 'input', name: 'value', message: '变量值:' },
    ])

    if (key.trim()) {
      // 追加到文件末尾
      fs.appendFileSync(filepath, `\n${key}=${value}\n`, 'utf-8')
      console.log(chalk.green(`✓ 已添加 ${key}`))
    }
  }
}

/** 编辑 package.json */
async function editPackageJson(filename: string, parsed: DependencyParseResult): Promise<void> {
  const filepath = path.join(process.cwd(), filename)
  const deps = parsed.dependencies.filter((d) => !d.isScript && !d.isMeta)

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '选择操作:',
      choices: [
        { name: '升级版本号', value: 'update' },
        { name: '删除依赖', value: 'remove' },
      ],
    },
  ])

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: action === 'update' ? '选择要升级的依赖:' : '选择要删除的依赖:',
      choices: deps.map((d) => ({
        name: `${d.name} (当前: ${d.versionSpec})`,
        value: d,
      })),
    },
  ])

  if (selected.length === 0) {
    console.log(chalk.gray('未选择任何依赖'))
    return
  }

  if (action === 'update') {
    const updates = []
    for (const dep of selected as Dependency[]) {
      const { version } = await inquirer.prompt([
        {
          type: 'input',
          name: 'version',
          message: `${dep.name} 新版本号 (当前: ${dep.versionSpec}):`,
          default: dep.versionSpec,
        },
      ])
      updates.push({
        name: dep.name,
        version,
        category: dep.category,
        action: 'update' as const,
      })
    }
    writePackageJson(filepath, updates)
    console.log(chalk.green(`✓ 已更新 ${updates.length} 个依赖`))
  } else {
    const updates = (selected as Dependency[]).map((d) => ({
      name: d.name,
      category: d.category,
      action: 'remove' as const,
    }))
    writePackageJson(filepath, updates)
    console.log(chalk.green(`✓ 已删除 ${updates.length} 个依赖`))
  }
}

/** 编辑 requirements.txt */
async function editRequirements(filename: string, parsed: DependencyParseResult): Promise<void> {
  const filepath = path.join(process.cwd(), filename)
  const deps = parsed.dependencies.filter((d) => !d.isMeta)

  const { action } = await inquirer.prompt([
    {
      type: 'list',
      name: 'action',
      message: '选择操作:',
      choices: [
        { name: '升级版本号', value: 'update' },
        { name: '删除依赖', value: 'remove' },
      ],
    },
  ])

  const { selected } = await inquirer.prompt([
    {
      type: 'checkbox',
      name: 'selected',
      message: action === 'update' ? '选择要升级的依赖:' : '选择要删除的依赖:',
      choices: deps.map((d) => ({
        name: `${d.name} (当前: ${d.versionSpec})`,
        value: d,
      })),
    },
  ])

  if (selected.length === 0) {
    console.log(chalk.gray('未选择任何依赖'))
    return
  }

  if (action === 'update') {
    const updates = []
    for (const dep of selected as Dependency[]) {
      const { versionSpec } = await inquirer.prompt([
        {
          type: 'input',
          name: 'versionSpec',
          message: `${dep.name} 新版本约束 (当前: ${dep.versionSpec}，例如 ==1.2.3 或 >=1.2,<2.0):`,
          default: dep.versionSpec,
        },
      ])
      updates.push({ name: dep.name, versionSpec, action: 'update' as const })
    }
    writeRequirements(filepath, updates)
    console.log(chalk.green(`✓ 已更新 ${updates.length} 个依赖`))
  } else {
    const updates = (selected as Dependency[]).map((d) => ({
      name: d.name,
      action: 'remove' as const,
    }))
    writeRequirements(filepath, updates)
    console.log(chalk.green(`✓ 已删除 ${updates.length} 个依赖`))
  }
}

/** 读取 .env 文件用于编辑 */
function parseEnvForEdit(filepath: string): { variables: EnvVariable[] } | null {
  if (!fs.existsSync(filepath)) {
    console.error(chalk.red(`文件不存在: ${filepath}`))
    return null
  }
  const content = fs.readFileSync(filepath, 'utf-8')
  return parseEnvFile(content, path.basename(filepath))
}
