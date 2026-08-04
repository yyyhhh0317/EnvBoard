<div align="center">

<img src="public/env.svg" alt="EnvBoard" width="80" height="80" />

# EnvBoard

一个轻量级环境配置可视化管理工具，支持 `.env`、`package.json`、`requirements.txt`、`pyproject.toml`、lockfile 等多种格式，帮助开发者安全管理项目配置。

[在线 Demo](#在线-demo) · [功能特性](#功能特性) · [快速开始](#快速开始) · [贡献指南](#贡献指南)

</div>

---

## 项目简介

`EnvBoard` 是一个纯前端的环境配置可视化管理工具。上传 `.env` / `package.json` / `requirements.txt` / `pyproject.toml` / lockfile 等配置文件，即可查看、编辑、对比和导出。`.env` 的敏感变量自动识别并脱敏，依赖列表可一键查询最新版本。所有解析与编辑在浏览器本地完成，**数据不会上传到任何服务器**（版本查询为可选联网功能，需手动开启），适合处理包含密钥、令牌等敏感信息的项目配置。

### 为什么需要它

- `.env` 文件一长，查找和修改变量就很麻烦
- 容易不小心把 `SECRET_KEY` 提交到 Git 仓库
- 新成员拉取项目后，不知道该配哪些环境变量
- 多环境（dev / test / prod）配置容易遗漏或混淆

EnvBoard 用一个可视化界面解决这些问题。

## 在线 Demo

🔗 https://yyyhhh0317.github.io/EnvBoard/

部署方式见 [部署](#部署) 章节。

## 功能特性

### .env 管理
- 📂 **文件导入** — 支持上传 `.env` / `package.json` / `requirements.txt` / `pyproject.toml` / lockfile 等格式，支持拖拽上传与粘贴文本
- 📊 **表格化展示** — Key、Value、注释分列显示，状态标记一目了然
- 🔍 **搜索过滤** — 按变量名或值实时搜索
- 🔄 **搜索替换** — 批量查找并替换变量名、值或注释，支持区分大小写与预览确认
- ✏️ **编辑管理** — 修改变量、添加 / 删除变量、复制单条
- 🔒 **敏感值脱敏** — 自动识别 `PASSWORD` / `SECRET` / `TOKEN` / `API_KEY` 等敏感变量，默认隐藏为 `****`，支持单条或全部显隐
- 🔄 **对比同步** — 上传 `.env.example` 对比缺失 / 多余 / 空值变量，一键同步缺失项
- 📤 **多格式导出** — 支持 `.env` / `.env.example`（模板）/ `JSON` / `YAML`，可选是否包含敏感值

### 依赖管理（v0.2.0 新增）
- 📦 **多格式解析** — 支持 `package.json` / `requirements.txt` / `pyproject.toml`（PEP 621 + Poetry）/ `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json`
- 🗂 **分类展示** — 按生产依赖 / 开发依赖 / 同级依赖 / 脚本 / 运行环境等分类，支持分类过滤
- 🔍 **搜索过滤** — 按包名或版本实时搜索
- ✏️ **编辑管理** — 修改依赖版本、添加 / 删除依赖、复制包名@版本
- 🔄 **版本查询**（可选）— 联网查询 npm / PyPI 最新版本，标记过期依赖。默认关闭，开启时明确提示会将包名发送到对应 registry
- 📤 **格式化导出** — 按原始格式导出修改后的配置文件

### 多环境管理（v0.3.0 新增）
- 🌗 **环境切换** — 支持 development / staging / production 等预设环境，可自定义环境名
- 📑 **单文件多环境** — 支持 `# @env <name>` 分段标记，在单个文件中切分多环境变量
- 📂 **多文件导入** — 一次导入多个 `.env.xxx` 文件，按文件名自动识别环境并合并
- 🔀 **差异对比** — 可视化各环境间的变量差异，快速发现缺失 / 多余 / 值不同的变量
- 📤 **多环境导出** — 按环境分别导出，或合并为单文件分段格式

### 配置模板与校验（v0.2.1 新增）
- 📋 **模板管理** — 预设 Web/数据库/微服务等场景模板，一键应用所需变量集
- ✅ **变量校验** — 检查必填项为空、占位符值、命名规范、重复 key、类型不匹配等
- ⚠️ **问题提示** — 区分 error / warning 级别，可一键过滤只看有问题的变量

### 通用
- 🌓 **暗色模式** — 跟随系统偏好，可手动切换并记忆
- ⚠️ **错误处理** — 空文件、无效格式、重复声明等友好提示
- 🛡️ **本地运行** — 纯前端实现，数据不出浏览器（版本查询为可选联网功能）

## 项目截图

<!-- 建议部署后补充以下截图到 docs/ 目录，并替换下方占位图： -->

| 首页 / 导入 | 变量列表 | 对比与导出 |
|---|---|---|
| _待补充_ | _待补充_ | _待补充_ |

## 技术栈

| 技术 | 用途 |
|---|---|
| [React 18](https://react.dev/) | UI 框架 |
| [Vite 5](https://vitejs.dev/) | 构建工具与开发服务器 |
| [TypeScript 5](https://www.typescriptlang.org/) | 类型安全 |
| [Tailwind CSS 3](https://tailwindcss.com/) | 原子化 CSS 样式 |

无需后端、无需数据库，构建产物是纯静态文件，可托管在任意静态站点平台。

## 快速开始

### 环境要求

- Node.js ≥ 18
- npm ≥ 9（或 pnpm / yarn 均可）

### 本地开发

```bash
# 1. 克隆仓库
git clone https://github.com/yyyhhh0317/EnvBoard.git
cd EnvBoard

# 2. 安装依赖
npm install

# 3. 启动开发服务器
npm run dev
```

开发服务器默认运行在 http://localhost:5173/ 。

### 构建生产版本

```bash
npm run build      # 输出到 dist/
npm run preview    # 本地预览构建产物
```

## 使用说明

1. **导入配置** — 打开页面后，点击上传区域选择 `.env` 文件，或拖拽文件到上传区，也可点击「粘贴文本」直接粘贴内容。首次使用可点「加载示例 .env」快速体验。
2. **查看与搜索** — 变量以表格展示，在搜索框输入关键词即可按变量名或值过滤。
3. **编辑变量** — 点击行尾的编辑图标修改变量，或点「+ 添加变量」新增。点击锁图标可手动标记 / 取消敏感。
4. **敏感值显隐** — 敏感值默认显示为 `****`。点击行内的眼睛图标可单条显隐，点击工具栏「显示敏感值」可全部显示。
5. **对比同步** — 在「对比 .env.example」区域上传模板文件，查看缺失 / 多余 / 空值统计，点「一键同步缺失」补齐变量。
6. **导出** — 在「导出」区域选择格式（`.env` / `.env.example` / `JSON` / `YAML`），勾选是否包含敏感值，复制到剪贴板或下载文件。
7. **搜索替换** — 点击工具栏「搜索替换」按钮，输入查找/替换文本，勾选要替换的字段（变量名/值/注释）与是否区分大小写，预览匹配项后点「替换全部」。
8. **多环境** — 上传含 `# @env <name>` 分段的 .env 文件，或一次导入多个 `.env.xxx` 文件，使用环境切换器查看各环境变量，差异对比查看不同环境间的差异。

### 支持的解析格式

**.env**

```bash
# 注释行
KEY=VALUE
KEY="VALUE WITH SPACES"
KEY='VALUE WITH SPACES'
KEY=  # 值为空
KEY=value  # 行内注释
# DISABLED_KEY=value   # 被注释掉的变量
```

**package.json** — 解析 `dependencies` / `devDependencies` / `peerDependencies` / `optionalDependencies` / `scripts` / `engines`

**requirements.txt** — 支持 `==` / `>=` / `<=` / `~=` / `>` / `<` 版本约束、注释、`-r` / `-e` 选项、VCS/URL 来源

**pyproject.toml** — 支持 PEP 621 `[project]` 标准格式与 Poetry `[tool.poetry]` 格式，包含 `[build-system]`

**lockfile** — 支持 `yarn.lock`（v1）/ `pnpm-lock.yaml`（v6+）/ `package-lock.json`（v3），提取锁定版本

## 项目结构

```
src/
├── components/
│   ├── Header/          # 顶部导航栏
│   ├── EnvImport/       # 导入区域（支持多种格式）
│   ├── EnvTable/        # .env 变量表格（含搜索替换面板）
│   ├── EnvEditor/       # .env 变量编辑弹窗
│   ├── EnvCompare/      # .env 对比区域
│   ├── EnvExport/       # .env 导出区域
│   ├── EnvSwitcher/     # 多环境切换器
│   ├── EnvDiffView/     # 多环境差异对比
│   ├── MultiEnvExport/  # 多环境导出
│   ├── TemplatePicker/  # 配置模板选择
│   ├── DependencyTable/ # 依赖列表表格
│   ├── DependencyEditor/# 依赖编辑弹窗
│   └── DependencyExport/# 依赖导出区域
├── hooks/
│   └── useTheme.ts      # 暗色模式
├── utils/
│   ├── parser/          # 解析器：.env / package.json / requirements / pyproject / lockfile / TOML / 文件检测 / 多环境
│   ├── formatter/       # 导出格式化：.env / JSON / YAML / 依赖
│   ├── registry/        # npm / PyPI 版本查询（opt-in）
│   ├── validator/       # 变量校验：类型 / 占位符 / 命名 / 重复
│   ├── sensitive.ts     # 敏感值识别
│   ├── searchReplace.ts # 搜索替换工具
│   └── sample.ts        # 示例数据
├── types/               # TypeScript 类型定义
├── App.tsx              # 根据文件类型路由到 .env / 依赖视图
└── main.tsx
```

## 架构说明

### 数据流

```
文件 / 粘贴文本
     │
     ▼
 detectProjectType() ── 识别类型（env / npm / pip / poetry / lockfile）
     │
     ▼
 对应 Parser ── 解析为统一结构（EnvVariable[] 或 DependencyParseResult）
     │
     ▼
 App.tsx 状态管理 ── variables[] / multiEnv / depResult
     │
     ├──→ EnvTable ── 表格展示 + 搜索 + 搜索替换 + 编辑
     │         │
     │         └──→ EnvEditor ── 单变量编辑
     │
     ├──→ EnvCompare ── 对比 .env.example
     ├──→ EnvDiffView ── 多环境差异对比
     ├──→ validator ── 校验问题反馈到表格
     └──→ exporter ── 导出为 .env / JSON / YAML
```

### 解析器设计

所有解析器遵循统一契约：输入 `(content: string, filename: string)`，输出带 `errors` 字段的结构。文件类型检测采用**强信号文件名直接采信 + 中性文件名优先看内容**策略，避免 `pasted.env` 这类命名导致 JSON 内容被误判为 .env。

### 敏感值识别

按非字母数字字符分段后精确匹配关键词（`PASSWORD` / `SECRET` / `TOKEN` / `API_KEY` 等），避免 `MONKEY` 含 `KEY`、`AUTHOR` 含 `AUTH` 的子串误判。

### 数据隐私

所有解析、编辑、导出均在浏览器本地完成。版本查询为唯一联网功能，默认关闭，开启时仅发送包名到对应 registry（npm / PyPI），不发送任何 .env 内容。

## 部署

本项目通过 GitHub Actions 自动部署到 GitHub Pages，推送 `main` 分支即自动构建上线。

### 自动部署（已配置）

仓库已包含 [.github/workflows/deploy.yml](./.github/workflows/deploy.yml)，推送到 `main` 后会自动触发构建并部署。首次使用需在仓库开启 Pages：

1. 进入仓库 **Settings → Pages**
2. **Build and deployment → Source** 选择 **GitHub Actions**
3. 之后每次推送 `main` 都会自动部署

部署地址：https://yyyhhh0317.github.io/EnvBoard/

> 注意：`vite.config.ts` 中已设置 `base: '/EnvBoard/'`，以适配 GitHub Pages 的子路径。若部署到自定义域名或根路径，请相应修改 `base`。

### 其他平台

也可部署到 Vercel、Netlify 等静态托管平台，构建命令为 `npm run build`，输出目录为 `dist`（部署到非子路径时需移除 `vite.config.ts` 中的 `base` 配置）。

## 开发计划

- [x] v0.1.0 — `.env` 解析 + 展示 + 编辑 + 对比 + 敏感值识别 + 多格式导出 + 暗色模式
- [x] v0.2.0 — `package.json` / `requirements.txt` / `pyproject.toml` / lockfile 解析展示、分类过滤、编辑、导出、版本查询
- [x] v0.2.1 — 配置模板与变量校验
- [x] v0.3.0 — 多环境切换（dev / test / staging / prod）、单文件分段、差异对比、多环境导出
- [x] v0.4.0 — 本地 CLI（scan / status / install / uninstall / edit）
- [x] v1.0.0 — 搜索替换、测试覆盖（163 用例）、bug 修复、文档完善

欢迎在 [Issues](https://github.com/yyyhhh0317/EnvBoard/issues) 提交需求或反馈。

## FAQ

### 数据安全

**Q：上传的配置文件会被发送到服务器吗？**

不会。所有解析、编辑、导出都在浏览器本地完成。文件内容不会上传到任何服务器。

**Q：版本查询功能会发送什么数据？**

版本查询是可选功能，默认关闭。开启后仅会将**包名**发送到对应 registry（npm 或 PyPI），不会发送 .env 内容或任何配置值。

**Q：敏感值是如何识别的？**

按非字母数字字符分段后精确匹配关键词（`PASSWORD` / `SECRET` / `TOKEN` / `API_KEY` / `PRIVATE` / `CREDENTIAL` 等）。也可手动点击锁图标标记/取消敏感。

### 功能使用

**Q：搜索替换支持正则表达式吗？**

不支持。搜索替换为纯文本匹配，避免正则注入风险。支持区分大小写选项。正则特殊字符（如 `$`、`.`、`*`）按字面量匹配。

**Q：多环境模式如何使用？**

两种方式：
1. **单文件分段**：在 .env 文件中用 `# @env development` 标记分段头，后续变量归属该环境
2. **多文件导入**：一次选择多个 `.env.development` / `.env.production` 文件，按文件名自动识别环境

**Q：导出为 YAML 时为什么数字和布尔值被加了引号？**

为防止 YAML 解析器将 `true` / `false` / `null` / 数字自动类型转换，这些值会用双引号包裹，确保导出后值类型保持为字符串。

**Q：为什么 `MONKEY` / `AUTHOR` 不再被识别为敏感变量？**

v1.0.0 修复了敏感值识别的误判：改为分段精确匹配，避免 `MONKEY` 含 `KEY`、`AUTHOR` 含 `AUTH` 的子串误判。如需标记，可手动点击锁图标。

### 兼容性

**Q：支持哪些浏览器？**

支持所有现代浏览器（Chrome / Firefox / Safari / Edge 最新版）。使用了 Web Crypto API、Clipboard API 等现代特性。

**Q：可以在离线环境使用吗？**

可以。除版本查询外，所有功能均可离线使用。

## 贡献指南

欢迎贡献代码！请遵循以下流程：

1. Fork 本仓库
2. 创建特性分支：`git checkout -b feat/your-feature`
3. 提交更改：`git commit -m 'feat: add your feature'`
   - 建议遵循 [Conventional Commits](https://www.conventionalcommits.org/) 规范
   - `feat` 新功能 / `fix` 修复 / `docs` 文档 / `refactor` 重构 / `style` 样式
4. 推送到远程：`git push origin feat/your-feature`
5. 提交 Pull Request 并描述改动内容

### 贡献前检查

- [ ] `npm run build` 构建通过，无 TypeScript 报错
- [ ] 新功能在浅色与暗色模式下均显示正常
- [ ] 不引入新的运行时依赖（如非必要）

## 许可证

本项目基于 [MIT License](./LICENSE) 开源，可自由使用、修改和分发。

## 致谢

感谢以下开源项目为本项目提供基础：

- [React](https://react.dev/)
- [Vite](https://vitejs.dev/)
- [Tailwind CSS](https://tailwindcss.com/)
- [TypeScript](https://www.typescriptlang.org/)
