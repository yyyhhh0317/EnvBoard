// EnvBoard CLI 入口
// 命令路由：scan / status / install / uninstall / edit
import { Command } from 'commander'
import chalk from 'chalk'
import { scanCommand } from './commands/scan.js'
import { statusCommand } from './commands/status.js'
import { installCommand } from './commands/install.js'
import { uninstallCommand } from './commands/uninstall.js'
import { editCommand } from './commands/edit.js'

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

program.parse()
