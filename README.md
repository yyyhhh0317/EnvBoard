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
- 🔐 **漏洞检查**（v1.4.0，可选）— 联网查询 npm audit / Google OSV 已知漏洞，按严重级别（严重 / 高危 / 中危 / 低危）展示公告、影响版本与详情链接
- 🌳 **依赖关系图**（v1.4.0）— `package-lock.json` v3 可视化为可折叠依赖树，循环 / 重复引用自动标记
- 📦 **Monorepo 扫描**（v1.4.0）— 一次多选多个依赖清单（`package.json` / `requirements.txt` / `pyproject.toml`，可混合格式），聚合展示各包依赖；自动识别 `workspaces` 模式、共享依赖与**版本冲突**，冲突项红色高亮
- 📤 **格式化导出** — 按原始格式导出修改后的配置文件

### 配置模板与校验（v0.2.1 新增）
- 📋 **模板管理** — 预设 Web/数据库/微服务等场景模板，一键应用所需变量集
- ✅ **变量校验** — 检查必填项为空、占位符值、命名规范、重复 key、类型不匹配等
- ⚠️ **问题提示** — 区分 error / warning 级别，可一键过滤只看有问题的变量

### 多环境管理（v0.3.0 新增）
- 🌗 **环境切换** — 支持 development / staging / production 等预设环境，可自定义环境名
- 📑 **单文件多环境** — 支持 `# @env <name>` 分段标记，在单个文件中切分多环境变量
- 📂 **多文件导入** — 一次导入多个 `.env.xxx` 文件，按文件名自动识别环境并合并
- 🔀 **差异对比** — 可视化各环境间的变量差异，快速发现缺失 / 多余 / 值不同的变量
- 📤 **多环境导出** — 按环境分别导出，或合并为单文件分段格式

### 编辑体验与无障碍（v1.1.0 新增）
- ↩️ **撤销 / 重做** — 工具栏一键撤销 / 重做，快捷键 `Ctrl/Cmd+Z` 撤销、`Ctrl/Cmd+Shift+Z` 或 `Ctrl+Y` 重做（单环境 `.env` 模式）
  - 覆盖编辑、新增、删除、敏感标记、对比同步、搜索替换等操作
- 💾 **会话持久化** — 编辑会话自动保存到浏览器本地，刷新 / 重新打开页面自动恢复
  - 敏感值用 AES-GCM 加密后落盘，本地存储不出现明文密钥
  - 「清空并重新开始」会同时清除已保存的会话
- ♿ **无障碍** — 弹窗语义化（`role=dialog` + 焦点圈定 + Escape 关闭 + 关闭后焦点还原）、表单 label 关联、图标按钮可访问名称、键盘可达的删除操作、全局 `focus-visible` 焦点样式、`prefers-reduced-motion` 减少动效适配、顶部「跳到主内容」链接

### 密钥泄露检测与导出脱敏（v1.2.0 新增）
- 🔎 **密钥格式扫描** — 自动识别变量值中的真实凭证格式：AWS Access Key / GitHub Token / Slack / Stripe / Google API Key / OpenAI / 私钥（PEM）/ JWT / npm / PyPI / SendGrid / Twilio / Telegram / Mailgun 等
- ⚠️ **泄露报告** — 命中变量以脱敏值 + 类型徽章 + 严重级别展示，检测到泄露时自动展开，便于提交 / 导出前检查
- 🧹 **一键清除** — 单条清除或一键清除全部命中值（单环境模式清除可撤销）
- 🛡️ **导出脱敏** — 导出 / 复制时若内容含疑似泄露密钥，会先弹窗确认：「导出并脱敏」（命中片段替换为 `[REDACTED]`）或「仍然导出」，从源头避免密钥经导出流出

### 配置格式与校验扩展（v1.3.0 新增）
- 📄 **更多配置格式** — 新增 `.ini`（section 展平为 `SECTION.KEY`，支持 `;`/`#` 注释）与 `application.properties`（`=`/`:` 分隔、`!` 注释、反斜杠续行、转义）解析；粘贴文本时按内容自动识别
- 🔀 **任意两文件对比** — 对比区域可上传任意 env 类文件（`.env` / `.ini` / `.properties`），检查缺失 / 多余 / 空值并一键同步
- 🧩 **Schema 校验增强** — 模板变量可携带 `pattern`（正则）与 `enum`（允许取值）约束，违规值以 warning 提示（如 `NODE_ENV` 限定枚举、`APP_PORT` 限定数字格式）

### 通用
- 🌓 **暗色模式** — 跟随系统偏好，可手动切换并记忆
- ⚠️ **错误处理** — 空文件、无效格式、重复声明等友好提示
- 🛡️ **本地运行** — 纯前端实现，数据不出浏览器（版本查询为可选联网功能）

### 生态与平台化（v2.0.0 新增）
- 📲 **PWA 离线可安装** — 手写 Service Worker + manifest：首次访问后离线可用，可安装到桌面 / 主屏；应用壳与静态资源缓存优先，HTML 网络优先并回退离线
- 🌐 **中英双语** — 右上角一键切换 中文 / English，语言偏好本地记忆；零依赖自研 i18n（Context + 字典）
- ⌨️ **CLI 增补** — 新增 `envboard diff`（对比 .env 与 .env.example）、`envboard sync`（同步缺失变量，`--dry-run` 预演）、`envboard init`（生成 .env / .env.example 模板）
- 🧪 **组件层测试 + E2E 冒烟** — testing-library 覆盖核心组件交互（320 例全过）；Playwright 冒烟主流程（导入 → 编辑 → 语言切换）

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

### 运行测试

```bash
npm run test            # 单元 + 组件测试（Vitest，jsdom）
npm run test:coverage   # 覆盖率报告

# E2E 冒烟（Playwright，首次需安装浏览器）
npm i -D @playwright/test
npx playwright install chromium
npx playwright test      # 启动 dev server 并跑 e2e/smoke.spec.ts
```

### CLI 使用（cli/ 子项目）

```bash
cd cli && npm install
npm run dev -- scan          # 扫描当前目录配置
npm run dev -- diff          # 对比 .env 与 .env.example
npm run dev -- sync          # 同步缺失变量到 .env（-n 预演）
npm run dev -- init          # 从 example 生成 .env / 从 .env 生成模板
```

## 使用说明

1. **导入配置** — 打开页面后，点击上传区域选择 `.env` 文件，或拖拽文件到上传区，也可点击「粘贴文本」直接粘贴内容。首次使用可点「加载示例 .env」快速体验。
2. **查看与搜索** — 变量以表格展示，在搜索框输入关键词即可按变量名或值过滤。
3. **编辑变量** — 点击行尾的编辑图标修改变量，或点「+ 添加变量」新增。点击锁图标可手动标记 / 取消敏感。
4. **敏感值显隐** — 敏感值默认显示为 `****`。点击行内的眼睛图标可单条显隐，点击工具栏「显示敏感值」可全部显示。
5. **对比同步** — 在「对比另一个文件」区域上传 `.env` / `.ini` / `.properties` 文件，查看缺失 / 多余 / 空值统计，点「一键同步缺失」补齐变量。
6. **导出** — 在「导出」区域选择格式（`.env` / `.env.example` / `JSON` / `YAML`），勾选是否包含敏感值，复制到剪贴板或下载文件。若内容含疑似泄露密钥，会先弹窗确认：可选择「导出并脱敏」（命中片段替换为 `[REDACTED]`）或「仍然导出」。
7. **搜索替换** — 点击工具栏「搜索替换」按钮，输入查找/替换文本，勾选要替换的字段（变量名/值/注释）与是否区分大小写，预览匹配项后点「替换全部」。
8. **多环境** — 上传含 `# @env <name>` 分段的 .env 文件，或一次导入多个 `.env.xxx` 文件，使用环境切换器查看各环境变量，差异对比查看不同环境间的差异。
9. **撤销 / 重做** — 按 `Ctrl/Cmd+Z` 撤销上一步修改，`Ctrl/Cmd+Shift+Z`（或 `Ctrl+Y`）重做；也可点击表格工具栏的撤销 / 重做按钮。
10. **自动保存** — 会话自动保存在浏览器本地，刷新或重新打开页面后自动恢复（敏感值加密存储）。「清空并重新开始」会清除已保存的会话。
11. **密钥泄露检测** — 表格下方「密钥泄露检测」面板会按常见凭证格式扫描变量值；命中时自动展开，展示脱敏值与类型，可单条清除或一键清除全部。
12. **导出脱敏** — 复制 / 下载含疑似泄露密钥的内容时，会先弹窗确认「导出并脱敏」或「仍然导出」，避免密钥经导出流出。
13. **Monorepo 扫描** — 在导入区下方点「Monorepo 扫描 → 开始扫描」，多选多个依赖清单文件（可混合 `package.json` / `requirements.txt` / `pyproject.toml`）。结果按包聚合展示：各包依赖（可展开）、共享依赖表（标注「一致 / 冲突」）、版本冲突面板（红色高亮各包声明），并自动识别根 `package.json` 的 `workspaces` 模式。

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

**.ini（v1.3.0）** — 支持 `[section]` 分段（key 展平为 `SECTION.KEY`）、`;` / `#` 注释、行内注释、引号值

**application.properties（v1.3.0）** — 支持 `key=value` 与 `key: value`、`#` / `!` 注释、反斜杠续行、`\:` `\=` `\\` `\n` `\t` `\uXXXX` 转义

## 项目结构

```
src/
├── components/
│   ├── Header/          # 顶部导航栏
│   ├── EnvImport/       # 导入区域（支持多种格式）
│   ├── EnvTable/        # .env 变量表格（含搜索替换面板）
│   ├── EnvEditor/       # .env 变量编辑弹窗
│   ├── EnvCompare/      # .env 对比区域（任意 env 类文件，v1.3.0）
│   ├── EnvExport/       # .env 导出区域
│   ├── EnvSwitcher/     # 多环境切换器
│   ├── EnvDiffView/     # 多环境差异对比
│   ├── MultiEnvExport/  # 多环境导出（含导出脱敏确认）
│   ├── TemplatePicker/  # 配置模板选择
│   ├── SecretScanPanel/ # 密钥泄露检测面板（v1.2.0）
│   ├── ExportSecretWarning/ # 导出脱敏确认（v1.2.0）
│   ├── DependencyTable/ # 依赖列表表格（含漏洞检查 / 依赖图，v1.4.0）
│   ├── DependencyGraph/ # 依赖关系图（v1.4.0）
│   ├── DependencyVulnReport/ # 漏洞报告（v1.4.0）
│   ├── MonorepoScan/    # Monorepo 多包扫描（v1.4.0）
│   ├── DependencyEditor/# 依赖编辑弹窗
│   └── DependencyExport/# 依赖导出区域
├── hooks/
│   ├── useTheme.ts            # 暗色模式
│   ├── useHistory.ts          # 撤销/重做（v1.1.0）
│   ├── useModal.ts            # 弹窗焦点管理：焦点圈定/Escape/焦点还原（v1.1.0）
│   └── useSessionPersistence.ts # 会话持久化（v1.1.0）
├── utils/
│   ├── parser/          # 解析器：.env / .ini / properties / package.json / requirements / pyproject / lockfile / TOML / 文件检测 / 多环境
│   ├── formatter/       # 导出格式化：.env / JSON / YAML / 依赖
│   ├── registry/        # npm / PyPI 版本查询、漏洞检查（opt-in）
│   ├── graph/           # 依赖关系图构建（lockGraph，v1.4.0）
│   ├── monorepo/        # Monorepo 多包扫描聚合（v1.4.0）
│   ├── validator/       # 变量校验：类型 / 占位符 / 命名 / 重复
│   ├── templates/       # 配置模板：内置模板库 / 自定义模板存取
│   ├── persistence/     # 会话持久化：AES-GCM 加密 / localStorage 存储（v1.1.0）
│   ├── secretScan.ts    # 密钥泄露检测与导出脱敏（v1.2.0）
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
     ├──→ EnvTable ── 表格展示 + 搜索 + 搜索替换 + 编辑（useHistory 撤销/重做）
     │         │
     │         └──→ EnvEditor ── 单变量编辑（useModal 焦点管理）
     │
     ├──→ EnvCompare ── 对比 .env.example
     ├──→ EnvDiffView ── 多环境差异对比
     ├──→ secretScan ── 密钥泄露检测面板 + 导出脱敏（v1.2.0）
     ├──→ validator ── 校验问题反馈到表格
     ├──→ useSessionPersistence ── 本地会话自动保存/恢复（v1.1.0）
     └──→ exporter ── 导出为 .env / JSON / YAML（含脱敏确认）
```

### 解析器设计

所有解析器遵循统一契约：输入 `(content: string, filename: string)`，输出带 `errors` 字段的结构。文件类型检测采用**强信号文件名直接采信 + 中性文件名优先看内容**策略，避免 `pasted.env` 这类命名导致 JSON 内容被误判为 .env。

### 敏感值识别

按非字母数字字符分段后精确匹配关键词（`PASSWORD` / `SECRET` / `TOKEN` / `API_KEY` 等），避免 `MONKEY` 含 `KEY`、`AUTHOR` 含 `AUTH` 的子串误判。

### 数据隐私

所有解析、编辑、导出、密钥泄露检测均在浏览器本地完成。版本查询为唯一联网功能，默认关闭，开启时仅发送包名到对应 registry（npm / PyPI），不发送任何 .env 内容。

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
- [x] v1.1.0 — 撤销 / 重做、本地会话持久化（敏感值 AES-GCM 加密）、键盘快捷键与无障碍（a11y）
- [x] v1.2.0 — 密钥泄露检测（17 类凭证格式）、导出脱敏策略、一键清除泄露值
- [x] v1.3.0 — `.ini` / `properties` 解析、任意两文件对比、Schema 校验（pattern / enum）、测试覆盖扩展（260 用例）
- [x] v1.4.0 — 依赖漏洞检查（npm audit / OSV）、依赖关系图（package-lock.json v3 树形）、Monorepo 多包扫描（workspaces / 共享依赖 / 版本冲突）
- [x] v2.0.0 — PWA 离线可安装、中英双语（i18n）、CLI 增补（diff / sync / init）、组件层测试与 E2E 冒烟

> 项目截图将在后续大版本发布时补充到 [docs/](./docs/) 目录。

欢迎在 [Issues](https://github.com/yyyhhh0317/EnvBoard/issues) 提交需求或反馈。

## FAQ

### 数据安全

**Q：上传的配置文件会被发送到服务器吗？**

不会。所有解析、编辑、导出都在浏览器本地完成。文件内容不会上传到任何服务器。

**Q：版本查询功能会发送什么数据？**

版本查询是可选功能，默认关闭。开启后仅会将**包名**发送到对应 registry（npm 或 PyPI），不会发送 .env 内容或任何配置值。

**Q：漏洞检查会发送什么数据？**

漏洞检查同样是可选联网功能（v1.4.0），默认关闭。开启后会将**包名与版本**发送到 npm audit（npm）或 Google OSV（PyPI）以查询已知漏洞，不发送其他数据；结果仅在本地展示。

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

**Q：密钥泄露检测的原理是什么？会误报吗？**
按常见凭证的格式特征（固定前缀 + 定长）在变量值中做正则匹配，例如 `AKIA`+16 位（AWS）、`ghp_`+36 位（GitHub）、`-----BEGIN ... PRIVATE KEY-----`（私钥）等。只收录强格式特征，普通字符串、URL 不会触发；检测与导出脱敏均在本地完成，不发送任何数据。

**Q：支持 .ini / .properties 配置吗？**
支持（v1.3.0）。上传 `config.ini` 或 `application.properties` 会自动识别并解析为变量表格：ini 的 section 展平为 `SECTION.KEY`，properties 支持 `=` / `:` 分隔与转义；粘贴文本时会按内容信号自动判断格式。这类文件也可作为「对比」对象。

**Q：为什么 `MONKEY` / `AUTHOR` 不再被识别为敏感变量？**

v1.0.0 修复了敏感值识别的误判：改为分段精确匹配，避免 `MONKEY` 含 `KEY`、`AUTHOR` 含 `AUTH` 的子串误判。如需标记，可手动点击锁图标。

### 兼容性

**Q：会话会自动保存吗？存在哪里？**
会自动保存。编辑会话保存在浏览器本地（localStorage），刷新或重新打开页面后自动恢复；敏感值会用 AES-GCM 加密后存储，密钥只留在本地，存储内容中不出现明文密钥。点击「清空并重新开始」会清除已保存的会话。

**Q：支持哪些键盘快捷键？**
`Ctrl/Cmd+Z` 撤销、`Ctrl/Cmd+Shift+Z` 或 `Ctrl+Y` 重做（单环境 `.env` 模式）。弹窗中 `Escape` 关闭，`Tab` 焦点在弹窗内循环。

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
