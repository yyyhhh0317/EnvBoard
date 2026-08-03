---
title: 我写了一个配置管理神器，一口气支持.env/npm/pip/Poetry/lockfile五种格式
tag:
  - 前端
  - 开源项目
  - 开发工具
  - TypeScript
  - 效率工具
---

# 我写了一个配置管理神器，一口气支持 .env / npm / pip / Poetry / lockfile 五种格式

> 故事从一个周五下午说起——我同时调试三个项目（前端 + Python 后端 + 移动端 Node 服务），终端里来回 `cat .env | grep KEY`、`grep axios package.json`、`head requirements.txt`，切着切着就把 staging 的数据库 URL 粘到了生产终端上……
>
> —— 于是就有了 EnvBoard。

---

## 🤔 背景：有没有一个工具能一次性搞定所有配置？

做开发的你有没有过这些场景：

| 场景 | 你的操作 | 痛点 |
|---|---|---|
| 启动前端报错 `API_KEY undefined` | `cat .env \| grep KEY`，全终端乱搜 | 敏感值直接打印在屏幕上，旁边有人看着尴尬 |
| 领导问「axios 有没有升级啊？」 | `cat package.json \| grep axios` → 去 npm 查最新版 | 来回切窗口、复制粘贴 |
| Python 项目 200 行 requirements.txt | 拉分支先看有哪些新增包，翻屏头晕 | 分组看不到，想知道「测试相关」有哪几个包搜半天 |
| Poetry 和标准 pyproject 混用 | 一会看 `[tool.poetry]` 一会看 `[project]` | 两种格式记不清字段 |
| lockfile 想查某个包锁了哪个版本 | 搜 `yarn.lock` 第 N 百行 | 全是字符串，看瞎眼 |

**查了一圈没找到能一站式解决的工具**，就自己写了一个，纯前端零部署，丢 GitHub Pages 上就能用。

---

## ⭐ 项目信息

- **GitHub 仓库**：[yyyhhh0317/EnvBoard](https://github.com/yyyhhh0317/EnvBoard)
- **在线 Demo**：https://yyyhhh0317.github.io/EnvBoard/
- **Star ⭐**：觉得有用请点一下，你的 Star 是我的持续更新动力 😭

---

## 🎬 先放个 30s 速览

![EnvBoard 功能演示](docs/demo.gif)

> ⏳ Demo GIF 制作中：流程（导入 .env → 敏感脱敏 → 切 npm 依赖 → 查新版本 → 切 requirements 子分组筛选）

<!-- TODO：你录完 GIF 放到 docs/demo.gif 即可，上面的路径和下面的截图都是相对路径 -->

---

## ✨ 功能一：.env 敏感值自动脱敏，看屏幕再也不尴尬

### 痛点
终端里 `cat .env` 输出整屏内容，`DB_PASSWORD=yourrealpassword123` 明晃晃地显示在屏幕上——开会投屏、同事路过、面试演示全都踩过这个雷。

### EnvBoard 怎么做的
上传 `.env` 之后，**敏感 Key 自动识别并默认隐藏为 `****`**：

![敏感值脱敏示意图](docs/screenshot-sensitivity.png)

识别规则覆盖常见关键词：
```
PASSWORD, SECRET, TOKEN, KEY, PRIVATE, ACCESS, CREDENTIAL,
AUTH, DB_PASS, DB_PASSWORD, DATABASE_URL, AWS_SECRET, ...
```

- **单条显隐**：点眼睛图标只展开你想看的那一条
- **一键全显 / 全隐**：工具栏切换
- **复制单个变量**：再也不用在终端里用鼠标框选文本

![编辑变量示意图](docs/screenshot-env-edit.png)

另外还支持 `.env.example` 对比同步——`missing` / `extra` / `empty` 三种状态一目了然，缺失项一键同步进来，再也不用对着两份文件逐行核对。

---

## ✨ 功能二：npm 依赖分类展示 + 一键查最新版

### 痛点
`package.json` 打开后 `dependencies` 一大坨，想只看 `devDependencies` 还要往下滚半屏；`scripts` 有哪些得用 `npm run` 才能列出来；某个包是不是最新版得去 npm 搜。

### EnvBoard 怎么做的
自动把依赖分了 6 类，顶部标签一键切换：

```
📦 生产依赖 (5)   🔧 开发依赖 (8)   👥 同级依赖 (1)   🛠️ 可选依赖 (1)   ⚡ 脚本 (4)   📌 运行环境 (2)
```

脚本（scripts）还会加紫色的 `$` 前缀高亮：

![npm 依赖表格示意图](docs/screenshot-npm-table.png)

**重点功能：版本查询（需手动开启）**

> 🔔 隐私提醒：版本查询会把包名发送到 npm registry，默认关闭。EnvBoard 绝大多数操作都在本地完成，唯一需要联网的就是这一个功能，且**必须你手动勾选**才会执行。

开启后点「检查更新」，过期包会用琥珀色高亮 + `↑` 图标标记：

![版本检查示意图](docs/screenshot-npm-version.png)

过期的包直接点「编辑」改版本号 → 导出 → 覆盖 `package.json` → `npm install`，一气呵成。

---

## ✨ 功能三：requirements.txt 自动分组，100 行也不眼花

### 痛点
真实项目的 `requirements.txt` 动辄上百行，大多数人都会写分组注释：

```txt
# ===== Web 框架 =====
Flask==3.0.3
Django>=4.2,<5.1

# ===== 数据库 =====
SQLAlchemy==2.0.34
...
```

但你看文件的时候，这些分组信息只是「注释」，不能点击只看某一组。想知道「测试工具类」有哪几个，还得全文搜索 `pytest`、`mypy` 这种关键词。

### EnvBoard 怎么做的

**自动识别分组注释，并拆成两级筛选器：**

一级（分类）：
```
全部  ·  生产依赖 (17)  ·  开发依赖 (5)  ·  可选依赖 (1)
```

二级（分组，青色标签）：
```
分组：全部  ·  Web 框架  ·  数据库  ·  数据处理  ·  工具库  ·  测试  ·  代码质量
```

你看到的效果就是这样的：

![requirements 子分组示意图](docs/screenshot-pip-subgroup.png)

**支持的分组格式**：只要是形如 `# ===== XXX - YYY =====` 的结构，`-` 前面的自动归为分类，后面的是子分组。没有分隔符也能识别，命中关键词就归类：

```
dev / develop / 开发       → 开发依赖
prod / production / 生产   → 生产依赖
optional / extra / 可选    → 可选依赖
test / 测试                 → 可选依赖（分类测试）
build / doc / 构建 / 文档   → 可选依赖
```

---

## ✨ 功能四：pyproject.toml 双格式支持 + lockfile 可视化

### Poetry 格式 + PEP 621 标准格式，一个都不放过

现在 pyproject 有两套主流格式：

```toml
# 老派 Poetry 党
[tool.poetry]
name = "my-package"

[tool.poetry.dependencies]
python = "^3.10"
flask = "^3.0"

# 新派标准库党（PEP 621）
[project]
name = "my-package"
requires-python = ">=3.10"
dependencies = [
  "flask>=3.0",
]
```

EnvBoard 两种都能解，`[build-system]` 里的依赖也会单独列出来。

### lockfile 也能看懂
`yarn.lock`、`pnpm-lock.yaml`、`package-lock.json` 三种 lockfile 全部支持，锁定版本和版本约束分开展示：

```
📦 包名              版本约束         锁定版本
─────────────────────────────────────────────
  react              ^18.3.1          18.3.1
  axios              ^1.7.5           1.7.5
```

再也不用在 lockfile 里搜 `version: "xxx"` 了。

---

## 🚀 两种导入方式：上传 / 粘贴

顶部有个优雅的双 Tab 切换：

| 📁 上传文件 | 📋 粘贴文本 |
|---|---|
| 拖拽或点击选择文件，按文件名自动识别类型 | 把配置内容粘进来，按内容特征自动识别类型 |

**自动识别规则**（文件名优先、内容兜底）：
- `package.json` → npm
- `requirements.txt` → pip
- `pyproject.toml` → Poetry / PEP 621
- `yarn.lock` / `pnpm-lock.yaml` / `package-lock.json` → lockfile
- 其他按内容正则判断：JSON 且含 dependencies 字段 → npm / 存在 `包名==版本` → pip / 存在 `[project]` `[tool.poetry]` → toml / 其他默认 .env

---

## 🏗️ 技术选型 & 零额外依赖

| 层 | 选型 |
|---|---|
| 框架 | React 18 |
| 构建 | Vite 5 |
| 类型 | TypeScript 5 |
| 样式 | Tailwind CSS 3 |
| 部署 | GitHub Pages + Actions 自动部署 |

**没有引入任何运行时依赖**——TOML 解析器自己实现的精简版（仅覆盖 pyproject 会用到的子集），这样最终打包 JS 的 gzip 只有 **62 KB**，打开 Demo 页面几乎秒开。

```
dist/index.html         0.63 kB  (gzip 0.47 kB)
dist/assets/index.css  27.68 kB  (gzip 5.53 kB)
dist/assets/index.js  205.74 kB  (gzip 62.31 kB)
```

## 🛡️ 隐私承诺

这个项目的**核心设计原则**是「数据不出浏览器」：

- ✅ 解析、编辑、对比、导出：**全部本地完成**
- ⚠️ 唯一可选联网功能：npm / PyPI 最新版本查询 → **默认关闭**，开启前明确弹窗提示「会将包名发送到 npm / PyPI registry」
- ❌ 没有埋点、没有统计、没有任何遥测代码

如果你管理的是包含真实密钥、内部服务地址的 `.env` 文件，大可放心使用——你可以直接 clone 项目本地 `npm run dev` 启动，完全离线也能 100% 用。

---

## 🛣️ Roadmap & 开发计划

- [x] v0.1.0 `.env` 解析 + 展示 + 编辑 + 对比 + 多格式导出
- [x] v0.2.0 多格式支持：`package.json` / `requirements.txt` / `pyproject.toml` / lockfile + 版本查询
- [ ] v0.3.0 多环境切换（dev/test/staging/prod 四套配置一套管理）
- [ ] v0.3.0 本地 CLI 扩展（Phase 2）：真正执行 `npm install` / `pip install` 命令
- [ ] v0.4.0 配置模板库 + 变量校验（比如 `PORT` 必须是数字、`API_KEY` 不能为空）
- [ ] v1.0.0 文档完善 & 稳定发布

**如果你有想要的功能，直接发 Issue 就行！** 仓库 README 有贡献指南，遵循 Conventional Commits 规范。

---

## 🚀 本地运行

```bash
git clone https://github.com/yyyhhh0317/EnvBoard.git
cd EnvBoard
npm install
npm run dev   # 访问 http://localhost:5173
```

---

## 写在最后

做这个工具的初衷其实挺简单——**我自己每天都要用**，既然市面上没找到我想要的，不如自己写一个，顺手开源出去。

目前项目还在 v0.2.0 早期阶段，肯定有不少地方可以打磨：
- 比如导出时保留原始分组注释（当前导出会丢失详细分组标题，后续想做）
- 比如 npm 版本查询显示 changelog 链接
- 比如多文件批量管理

欢迎 **Star ⭐** + **Issue** + **PR** 三件套，也欢迎在评论区提建议——每一条我都会认真回复！

如果你觉得这个工具帮你省了点「终端来回 grep 的时间」，麻烦点个赞、转个发，感激不尽 🙏

---

> **本文同步发布于**：
> - GitHub README：https://github.com/yyyhhh0317/EnvBoard
> - 在线 Demo：https://yyyhhh0317.github.io/EnvBoard/
> - 掘金原文链接：（后续补上）

**截图占位清单**（等你做好图片放 `docs/` 下即可自动显示）：

| 占位链接 | 建议录什么 |
|---|---|
| `docs/demo.gif` | 主 GIF，30s 总览 |
| `docs/screenshot-sensitivity.png` | .env 敏感值脱敏效果 |
| `docs/screenshot-env-edit.png` | 编辑 .env 变量弹窗 |
| `docs/screenshot-npm-table.png` | npm 依赖表格 + 分类标签 |
| `docs/screenshot-npm-version.png` | 版本查询标红过期包 |
| `docs/screenshot-pip-subgroup.png` | requirements 两级筛选器效果 |

