# EnvBoard CLI

EnvBoard 的本地命令行工具，复用 Web 端解析器，支持扫描、检测、安装、卸载和编辑配置文件。

## 前置要求

- Node.js 18+
- 需要检测/安装/卸载的包管理器（npm / pip / poetry），按项目类型自动识别

## 安装

```bash
cd cli
npm install
```

## 快速开始

```bash
# 查看帮助
npx tsx src/index.ts --help

# 扫描当前目录的配置文件
npx tsx src/index.ts scan

# 以 JSON 格式输出（便于脚本处理）
npx tsx src/index.ts scan -j
```

## 命令参考

### scan — 扫描配置文件

扫描当前目录下的 `.env`、`package.json`、`requirements.txt`、`pyproject.toml`、lockfile 等配置文件并解析展示。

```bash
# 自动扫描当前目录
envboard scan

# 指定文件
envboard scan -f path/to/.env

# JSON 格式输出
envboard scan -j
```

**选项：**
- `-f, --file <path>` — 指定文件路径（默认自动扫描）
- `-j, --json` — 以 JSON 格式输出

### status — 检测依赖过期

检测项目依赖是否有新版本可用。

```bash
# 自动检测包管理器
envboard status

# 指定包管理器
envboard status -t npm
envboard status -t pip
envboard status -t poetry
```

**选项：**
- `-t, --type <type>` — 指定包管理器（npm / pip / poetry），默认自动检测

### install — 安装依赖

安装单个依赖包或按配置文件整体安装。

```bash
# 整体安装（npm install / pip install -r requirements.txt / poetry install）
envboard install

# 安装单个包
envboard install lodash

# 作为开发依赖安装（npm --save-dev）
envboard install typescript --dev

# 指定包管理器
envboard install flask -t pip
```

**选项：**
- `-d, --dev` — 作为开发依赖安装
- `-t, --type <type>` — 指定包管理器（npm / pip / poetry）

**行为：**
- npm：执行 `npm install [pkg] [--save-dev]`
- pip：执行 `pip install [pkg]` 或 `pip install -r requirements.txt`，安装后自动写入 `requirements.txt`
- poetry：执行 `poetry add [pkg] [--group dev]` 或 `poetry install`

### uninstall — 卸载依赖

卸载依赖包并同步更新配置文件。

```bash
# 自动检测包管理器
envboard uninstall lodash

# 指定包管理器
envboard uninstall flask -t pip
```

**选项：**
- `-t, --type <type>` — 指定包管理器（npm / pip / poetry）

**行为：**
- npm：执行 `npm uninstall <pkg>`
- pip：执行 `pip uninstall -y <pkg>`，并从 `requirements.txt` 移除
- poetry：执行 `poetry remove <pkg>`

### edit — 交互式编辑

通过交互式菜单编辑配置文件（升级版本号 / 删除依赖 / 修改 .env 变量）。

```bash
# 交互选择文件
envboard edit

# 指定文件
envboard edit -f .env
envboard edit -f package.json
```

**选项：**
- `-f, --file <path>` — 指定文件路径

**支持的编辑操作：**

| 文件类型 | 操作 |
|---------|------|
| `.env` | 修改变量值 / 删除变量 / 添加变量 |
| `package.json` | 升级版本号 / 删除依赖 |
| `requirements.txt` | 升级版本约束 / 删除依赖 |

## 与 Web 版的关系

CLI 复用 Web 端的解析器（`src/utils/parser/`），确保解析逻辑一致。

| 特性 | Web 版 | CLI |
|------|--------|-----|
| 配置文件解析 | 浏览器内 | 本地文件系统 |
| 依赖安装/卸载 | 不支持 | 支持 |
| 过期检测 | 不支持 | 支持 |
| 文件编辑 | 浏览器内编辑 | 直接写入磁盘 |
| 数据上传 | 不离开浏览器 | 仅本地操作 |

## 开发

```bash
# 类型检查
npm run typecheck

# 直接运行（无需编译）
npx tsx src/index.ts <command>
```
