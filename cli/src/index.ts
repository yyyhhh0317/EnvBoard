// EnvBoard CLI 入口
// 命令路由：scan / status / install / uninstall / edit / diff / sync / init
import { Command } from 'commander'
import chalk from 'chalk'
import { scanCommand } from './commands/scan.js'
import { statusCommand } from './commands/status.js'
import { installCommand } from './commands/install.js'
import { uninstallCommand } from './commands/uninstall.js'
import { editCommand } from './commands/edit.js'
import { diffCommand } from './commands/diff.js'
import { syncCommand } from './commands/sync.js'
import { initCommand } from './commands/init.js'

const program = new Command()

program
  .name('envboard')
  .description('环境配置可视化管理工具 - 本地 CLI 版')
  .version('0.4.0')

// scan：扫描并解析本地配置文件
program
  .command('scan')
  .description('扫描当前目录的配置文件（.env / package.json / requirements.txt / pyproject.toml）')
  .option('-f, --file <path>', '指定文件路径（默认自动扫描）')
  .option('-j, --json', '以 JSON 格式输出（便于脚本处理）')
  .action(scanCommand)

// status：检测依赖过期状态
program
  .command('status')
  .description('检测依赖过期状态（npm outdated / pip list --outdated）')
  .option('-t, --type <type>', '指定包管理器（npm / pip / poetry），默认自动检测')
  .action(statusCommand)

// install：安装依赖
program
  .command('install [pkg]')
  .description('安装依赖包（不指定 pkg 则执行整体安装，如 npm install / pip install -r requirements.txt）')
  .option('-d, --dev', '作为开发依赖安装（npm: --save-dev / pip: 仅记录到 requirements.txt）')
  .option('-t, --type <type>', '指定包管理器（npm / pip / poetry）')
  .action(installCommand)

// uninstall：卸载依赖
program
  .command('uninstall <pkg>')
  .description('卸载依赖包')
  .option('-t, --type <type>', '指定包管理器（npm / pip / poetry）')
  .action(uninstallCommand)

// edit：编辑配置文件（升级版本 / 删除依赖 / 修改变量）
program
  .command('edit')
  .description('交互式编辑配置文件（升级版本号 / 删除依赖 / 修改 .env 变量）')
  .option('-f, --file <path>', '指定文件路径')
  .action(editCommand)

// diff：对比两个配置文件（默认 .env vs .env.example）
program
  .command('diff')
  .description('对比两个配置文件（默认 .env vs .env.example），输出缺失 / 多余 / 空值')
  .option('-t, --target <path>', '目标文件路径（默认 .env）')
  .option('-e, --example <path>', '模板文件路径（默认 .env.example）')
  .option('-j, --json', '以 JSON 格式输出（便于脚本处理）')
  .action(diffCommand)

// sync：把 .env.example 中缺失的 key 追加到 .env
program
  .command('sync')
  .description('从 .env.example 同步缺失的变量到 .env（不覆盖已有值）')
  .option('-t, --target <path>', '目标文件路径（默认 .env）')
  .option('-e, --example <path>', '模板文件路径（默认 .env.example）')
  .option('-n, --dry-run', '仅预览要同步的变量，不实际写入')
  .option('-j, --json', '以 JSON 格式输出（便于脚本处理）')
  .action(syncCommand)

// init：根据当前目录生成 .env / .env.example 模板
program
  .command('init')
  .description('根据当前目录生成 .env（从 .env.example 复制）或 .env.example 模板（从 .env 反推）')
  .option('-f, --force', '强制覆盖已存在的文件')
  .action(initCommand)

program.parse()
