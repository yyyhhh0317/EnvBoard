# EnvBoard：一个能管理 .env + npm + pip + Poetry 的可视化配置工具

> 不再在终端里 `cat .env | grep KEY`、`grep "package" package.json`、对着 requirements.txt 数数哪个包更新了——上传文件，一切一目了然。

---

## 🚀 项目简介

**EnvBoard** 是一个纯前端的环境配置可视化管理工具。你只需要把配置文件上传（或粘贴），它就能帮你：

- **.env 文件**：表格化查看、搜索、编辑、敏感值自动脱敏、对比 `.env.example`、多格式导出
- **npm 依赖**：自动分类生产依赖 / 开发依赖 / 同级 / 脚本 / engines，一键查最新版
- **pip 依赖**：按你的注释分组（Web 框架、数据库、测试…），精细到子分组
- **Poetry / pyproject.toml**：同时支持 PEP 621 标准格式和 Poetry 格式
- **lockfile**：支持 `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json`，锁定版本一目了然

**核心承诺：所有解析与编辑在浏览器本地完成，数据不会上传到任何服务器**（版本查询为可选联网功能，需手动开启，并会明确提示会将包名发送到 npm / PyPI）。

---

## ✨ 在线体验

**Demo**：https://yyyhhh0317.github.io/EnvBoard/

**仓库**：https://github.com/yyyhhh0317/EnvBoard

> 如果觉得好用，欢迎点个 Star ⭐，你的 Star 是我更新的动力～

---

## 🎬 功能速览

![EnvBoard Demo](docs/demo.gif)

---

## 🛠️ 功能详解

### 1. 双模式导入：上传文件 / 粘贴文本

两种方式任选，自动识别格式：

| 上传文件 | 粘贴文本 |
|---|---|
| 拖拽或选择文件，文件名后缀自动判断类型 | 直接复制粘贴配置文件内容，按内容特征自动判断 |

自动识别的格式：`.env`、`package.json`、`requirements.txt`、`pyproject.toml`、`yarn.lock`、`pnpm-lock.yaml`、`package-lock.json`

### 2. .env 管理 —— 敏感变量不再裸奔

- **自动识别敏感变量**：匹配 `PASSWORD`、`SECRET`、`TOKEN`、`KEY` 等关键词，默认隐藏为 `****`
- **单条 / 全部显隐切换**：查看某条时单独点开，不用全部展开
- **一键复制**：复制 Key / Value 再也不用手工选中文本
- **对比同步**：上传 `.env.example`，标红「缺失」「多余」「空值」，一键同步缺失项
- **多格式导出**：`.env` / `.env.example` 模板 / `JSON` / `YAML`，可选是否包含敏感值

### 3. npm 依赖管理 —— scripts / deps / engines 一网打尽

- **自动分类**：生产依赖 / 开发依赖 / 同级依赖 / 可选依赖 / 脚本 / 运行环境
- **脚本以 `$` 高亮显示**，一眼区分包与命令
- **分类过滤**：点标签只看某一类，管理更清晰
- **版本查询**：勾选「联网查最新版」→ 点「检查更新」，过期依赖高亮标记

### 4. pip 依赖管理 —— 尊重你的分组习惯

**这是我最喜欢的功能**：requirements.txt 里形如 `# ===== 生产依赖 - Web 框架 =====` 的分组注释，EnvBoard 会自动拆成：

- **分类**：生产依赖 / 开发依赖 / 可选依赖
- **子分组**：Web 框架 / 数据库 / 数据处理 / 工具库 / 测试 / 代码质量 …

两级筛选，管理几十上百个依赖也不眼花。

```
# ===== 生产依赖 - Web 框架 =====   ← 自动识别为"生产依赖"分类 + "Web 框架"子分组
Flask==3.0.3
Django>=4.2,<5.1

# ===== 开发依赖 - 代码质量 =====   ← 自动识别为"开发依赖"分类 + "代码质量"子分组
black==24.8.0
mypy~=1.11
```

### 5. Poetry / pyproject.toml 双格式支持

- PEP 621 标准格式：`[project]` 依赖、`[project.optional-dependencies]`
- Poetry 格式：`[tool.poetry]` / `[tool.poetry.dependencies]` / `[tool.poetry.dev-dependencies]`
- `[build-system]` 依赖单独列出

### 6. 暗色模式 + 响应式

- 浅色 / 深色跟随系统，可手动切换，localStorage 记忆偏好
- 移动端 / 平板 / 桌面自适应

---

## 🧱 技术栈

| 类别 | 选型 |
|---|---|
| 框架 | React 18 |
| 构建 | Vite 5 |
| 类型 | TypeScript 5 |
| 样式 | Tailwind CSS 3 |
| 部署 | GitHub Pages（Actions 自动部署） |

**零运行时额外依赖**——连 TOML 解析器都是自己实现的最小化版本，保证工具体积紧凑（打包后 JS 约 62 KB gzip）。

---

## 📦 本地运行

```bash
git clone https://github.com/yyyhhh0317/EnvBoard.git
cd EnvBoard
npm install
npm run dev   # http://localhost:5173
```

---

## 🗺️ 开发计划

- [x] v0.1.0 — `.env` 解析 + 展示 + 编辑 + 对比 + 多格式导出
- [x] v0.2.0 — 多格式支持：`package.json` / `requirements.txt` / `pyproject.toml` / lockfile + 版本查询
- [ ] v0.3.0 — 多环境切换（dev / test / staging / prod）
- [ ] v0.3.0 — 本地 CLI 执行安装 / 卸载命令（Phase 2）
- [ ] v0.4.0 — 配置模板与变量校验
- [ ] v1.0.0 — 完善文档与稳定发布

---

## 🤝 参与贡献

欢迎 Issue / PR！详细贡献指南见 [CONTRIBUTING.md](CONTRIBUTING.md)（仓库 README 「参与贡献」章节）。

提交前请确认：
- `npm run build` 通过
- 代码格式通过 Prettier / ESLint
- 遵循 Conventional Commits 规范

---

## 📄 许可

MIT License © 2026 [yyyhhh0317](https://github.com/yyyhhh0317)

---

**如果这个工具帮你节省了在终端里 grep / cat 的时间，欢迎转发分享～ 🙏**
