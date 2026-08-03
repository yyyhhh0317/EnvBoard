<div align="center">

<img src="public/env.svg" alt="EnvBoard" width="80" height="80" />

# EnvBoard

一个轻量级环境变量可视化管理工具，支持多种环境配置格式，帮助开发者安全管理项目配置。

[在线 Demo](#在线-demo) · [功能特性](#功能特性) · [快速开始](#快速开始) · [贡献指南](#贡献指南)

</div>

---

## 项目简介

`EnvBoard` 是一个纯前端的环境变量可视化管理工具。上传 `.env` 文件即可查看、编辑、对比和导出环境变量，敏感变量自动识别并脱敏。所有操作在浏览器本地完成，**数据不会上传到任何服务器**，适合处理包含密钥、令牌等敏感信息的项目配置。

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

- 📂 **文件导入** — 支持上传 `.env` / `.env.local` / `.env.production` 等格式，支持拖拽上传与粘贴文本
- 📊 **表格化展示** — Key、Value、注释分列显示，状态标记一目了然
- 🔍 **搜索过滤** — 按变量名或值实时搜索
- ✏️ **编辑管理** — 修改变量、添加 / 删除变量、复制单条
- 🔒 **敏感值脱敏** — 自动识别 `PASSWORD` / `SECRET` / `TOKEN` / `KEY` 等敏感变量，默认隐藏为 `****`，支持单条或全部显隐
- 🔄 **对比同步** — 上传 `.env.example` 对比缺失 / 多余 / 空值变量，一键同步缺失项
- 📤 **多格式导出** — 支持 `.env` / `.env.example`（模板）/ `JSON` / `YAML`，可选是否包含敏感值
- 🌓 **暗色模式** — 跟随系统偏好，可手动切换并记忆
- ⚠️ **错误处理** — 空文件、无效格式、重复 Key 等友好提示
- 🛡️ **本地运行** — 纯前端实现，数据不出浏览器

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

### 支持的解析格式

```bash
# 注释行
KEY=VALUE
KEY="VALUE WITH SPACES"
KEY='VALUE WITH SPACES'
KEY=  # 值为空
KEY=value  # 行内注释
# DISABLED_KEY=value   # 被注释掉的变量
```

## 项目结构

```
src/
├── components/
│   ├── Header/        # 顶部导航栏
│   ├── EnvImport/     # 导入区域
│   ├── EnvTable/      # 变量表格
│   ├── EnvEditor/     # 编辑弹窗
│   ├── EnvCompare/    # 对比区域
│   └── EnvExport/     # 导出区域
├── hooks/
│   └── useTheme.ts    # 暗色模式
├── utils/
│   ├── parser/        # .env 解析与对比
│   ├── formatter/     # 多格式导出
│   ├── sensitive.ts   # 敏感值识别
│   └── sample.ts      # 示例数据
├── types/             # TypeScript 类型定义
├── App.tsx
└── main.tsx
```

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

- [x] v0.1.0 — `.env` 解析 + 展示 + 编辑
- [x] v0.1.0 — 对比功能 + 敏感值识别
- [x] v0.1.0 — 多格式导出（JSON、YAML）
- [x] v0.1.0 — 暗色模式 + 错误处理
- [ ] v0.2.0 — 多环境管理（dev / test / staging / prod）
- [ ] v0.2.0 — JSON / YAML / TOML 文件解析
- [ ] v0.2.0 — 配置模板与变量校验
- [ ] v0.3.0 — 本地加密存储敏感变量
- [ ] v0.3.0 — 环境变量变更历史
- [ ] v1.0.0 — 完善文档与稳定发布

欢迎在 [Issues](https://github.com/yyyhhh0317/EnvBoard/issues) 提交需求或反馈。

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
