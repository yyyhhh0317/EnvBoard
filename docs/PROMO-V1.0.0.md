---
title: EnvBoard v1.0.0 正式发布：从单人脚本到测试覆盖163用例的开源工具
tag:
  - 前端
  - 开源项目
  - 开发工具
  - TypeScript
  - 效率工具
  - 单元测试
---

# EnvBoard v1.0.0 正式发布：从单人脚本到测试覆盖 163 用例的开源工具

> 历经 5 个小版本迭代，EnvBoard 终于迎来 1.0 正式版。这一版没有花哨的新解析格式，而是把精力放在了三件事：**搜索替换**、**测试基线**、**关键 Bug 修复**。
>
> 本文记录从 v0.1.0 到 v1.0.0 的完整演进，以及 1.0 这一版做对了什么、踩了什么坑。

---

## ⭐ 项目信息

- **GitHub 仓库**：[yyyhhh0317/EnvBoard](https://github.com/yyyhhh0317/EnvBoard)
- **在线 Demo**：https://yyyhhh0317.github.io/EnvBoard/
- **v1.0.0 Release**：[Release Notes](https://github.com/yyyhhh0317/EnvBoard/releases/tag/v1.0.0)
- **Star ⭐**：觉得有用请点一下，你的 Star 是持续更新的动力

---

## 🗺️ 版本演进回顾

从 v0.1.0 到 v1.0.0，EnvBoard 一共经历了 5 个大版本：

| 版本 | 核心交付 | 时间跨度 |
|---|---|---|
| **v0.1.0** | `.env` 解析 + 展示 + 编辑 + 对比 + 敏感值脱敏 + 多格式导出 | 奠基 |
| **v0.2.0** | `package.json` / `requirements.txt` / `pyproject.toml` / lockfile 多格式支持 + 版本查询 | 扩展格式 |
| **v0.2.1** | 配置模板 + 变量校验（命名/占位符/类型/重复 key） | 规范化 |
| **v0.3.0** | 多环境切换（dev/staging/prod）、单文件分段、差异对比、多环境导出 | 多环境 |
| **v0.4.0** | 本地 CLI（scan / status / install / uninstall / edit） | 命令行 |
| **v1.0.0** | **搜索替换 + 测试覆盖 163 用例 + 关键 Bug 修复 + 文档完善** | 稳定发布 |

1.0 版本的定位很明确：**不再加新格式，而是把已有功能打磨到能放心交付的状态**。

---

## ✨ v1.0.0 核心新功能：搜索替换

### 痛点

`.env` 一长，批量改值就成体力活：

- 项目从 `localhost` 切到 `127.0.0.1`，要在 3 个变量里手动改
- 环境从 `DEV` 切到 `PROD`，变量名和值都要动
- 重命名某前缀（`OLD_API_*` → `NEW_API_*`），一个个改容易漏

以前只能在编辑弹窗里一条条改，v1.0.0 加了批量搜索替换面板。

### 怎么做的

工具栏新增「搜索替换」按钮，点开后是一个完整面板：

```
┌─────────────────────────────────────────────────┐
│  查找：[localhost        ]   替换为：[127.0.0.1] │
│                                                 │
│  替换字段：☑ 变量名  ☑ 变量值  ☐ 注释           │
│  ☐ 区分大小写          3 处匹配 · 3 个变量       │
│                              [替换全部 (3)]     │
│                                                 │
│  ┌变量──────┬字段───┬原值──────────┬替换后─────┐ │
│  │DATABASE_URL│变量值│localhost:5432│127.0.0.1..│ │
│  │REDIS_URL │变量值│localhost:6379│127.0.0.1..│ │
│  │API_BASE  │变量值│localhost:8080│127.0.0.1..│ │
│  └──────────┴───────┴──────────────┴──────────┘ │
└─────────────────────────────────────────────────┘
```

**几个刻意的设计取舍**：

| 设计点 | 选择 | 原因 |
|---|---|---|
| 匹配方式 | **纯文本**，非正则 | 避免正则注入风险，`$` / `.` / `*` 按字面量匹配 |
| 替换文本里的 `$&` | **不解释为特殊模式** | 修复了一个 `$` 注入 Bug（见下文） |
| 字段选择 | 变量名 / 值 / 注释 三选可多选 | 一次替换多个字段 |
| 预览 | 必须先看匹配再执行 | 防止误伤 |
| `isDisabled` 变量 | 跳过 | 被注释掉的变量不参与替换 |

### 实现核心

工具函数在 [src/utils/searchReplace.ts](https://github.com/yyyhhh0317/EnvBoard/blob/main/src/utils/searchReplace.ts)，拆成两个纯函数：

```typescript
// 预览：不修改原数据，返回匹配列表
previewReplace(variables, options): SearchMatch[]

// 应用：返回新数组，标记 isModified
applyReplace(variables, options): EnvVariable[]
```

UI 层用 `useMemo` 实时计算预览，输入框一变，匹配统计和预览表立即更新。

---

## 🧪 v1.0.0 第二件大事：测试覆盖 163 用例

### 为什么 1.0 才补测试

前几个版本都是「先跑起来再说」，功能迭代快，但每次发版都靠手动验证。到 v0.4.0 时已经积累了 7 个解析器 + 校验器 + 导出器，手动回归一次要半小时，而且容易漏。

1.0 决定补上测试基线。

### 测试栈选型

| 工具 | 用途 |
|---|---|
| **Vitest** | 测试框架，与 Vite 同构，零额外配置 |
| **@testing-library/react** | React 组件测试（虽然这版主要测纯函数） |
| **jsdom** | DOM 环境 |
| **@vitest/coverage-v8** | 覆盖率 |

### 覆盖范围

7 个核心模块，共 **163 个用例**：

| 模块 | 用例数 | 覆盖点 |
|---|---|---|
| envParser | 23 | 引号、注释、空值、重复 key、敏感字段 |
| requirementsParser | 19 | 版本约束、注释分组、`-r` 引用、VCS |
| detector | 36 | 强信号文件名、中性文件名看内容 |
| validator | 31 | 占位符、类型校验、命名规范、重复 key |
| multiEnvParser | 14 | `@env` 分段、多文件合并 |
| exporter | 21 | .env / JSON / YAML 导出、特殊字符 |
| searchReplace | 18 | 预览、应用、多字段、区分大小写 |

### CI 自动化

配套配了 GitHub Actions：

```yaml
name: CI
on:
  push:
    branches: [main]
  pull_request:
    branches: [main]
jobs:
  test:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v5
      - uses: actions/setup-node@v5
        with:
          node-version: 22
          cache: npm
      - run: npm ci --legacy-peer-deps
      - run: npm run test
```

之后每次 push / PR 都会自动跑测试，fail 了不能合 main。这一条对单人项目也很有用——再也不用担心「改了 A 坏了 B」。

---

## 🐛 v1.0.0 修复的关键 Bug

### Bug 1：`MONKEY_NAME` 被误判为敏感变量

**现象**：用户反馈 `MONKEY_NAME`、`AUTHOR_NAME` 这种正常变量被标记为敏感值，显示为 `****`。

**根因**：旧版用 `includes` 做子串匹配，`MONKEY` 包含 `KEY`、`AUTHOR` 包含 `AUTH`，于是被误判。

**修复**：改为按非字母数字字符分段后**精确匹配**：

```typescript
// 旧：子串匹配（误判）
'SECRET_KEY'.includes('KEY')  // true
'MONKEY'.includes('KEY')      // true ← 误判

// 新：分段精确匹配
'MONKEY'.split(/[^A-Z0-9]+/)  // ['MONKEY']
['MONKEY'].includes('KEY')    // false ← 正确
```

关键词表也收紧了：移除过宽的 `KEY` / `AUTH`，改为 `API_KEY` / `AUTH_TOKEN` / `AUTH_SECRET` 这类复合词。

### Bug 2：YAML 导出的类型漂移

**现象**：导出 YAML 后，`DEBUG: true` 被 YAML 解析器读回时变成布尔值 `true`，而不是字符串 `"true"`。

**根因**：YAML 规范里 `true` / `false` / `null` / 数字是原生类型，不加引号会被自动转换。

**修复**：导出时对这些值强制加引号：

```typescript
const needsQuote =
  val === '' ||
  /[:#{}\[\],&*!|>'"%@`]/.test(val) ||
  /^(true|false|yes|no|on|off|null|~|\d+(\.\d+)?)$/i.test(val)
```

### Bug 3：搜索替换的 `$` 注入

**现象**：替换文本里写 `$&` 或 `$1`，JavaScript 的 `String.prototype.replace` 会把它们解释为特殊模式。

**根因**：`value.replace(re, replacement)` 中，`replacement` 是字符串时，`$&` 表示「整个匹配」、`$1` 表示「捕获组」。

**修复**：把 replacement 包成函数，绕过特殊模式解释：

```typescript
// 旧：$& 会被解释为整个匹配
value.replace(re, replacement)

// 新：函数形式，原样返回
value.replace(re, () => replacement)
```

### Bug 4：EnvEditor 输入丢失

**现象**：在编辑弹窗里输入到一半，父组件重渲染，输入框内容被重置。

**根因**：`useEffect` 依赖写了整个 `variable` 对象，父组件任何重渲染都会触发 `setDraft(variable)` 重置 draft。

**修复**：依赖改为 `variable?.id`，只有切换编辑的变量时才重置：

```typescript
useEffect(() => {
  setDraft(variable)
}, [variable?.id])  // 只依赖 id
```

### Bug 5：pyproject optional-dependencies 组名丢失

**现象**：解析 `[project.optional-dependencies]` 时，组名（如 `dev` / `test`）没保留，导出后丢失分组信息。

**修复**：解析时把组名存到 `subgroup` 字段。

### Bug 6：多环境编辑新增变量未追加

**现象**：多环境模式下，点「添加变量」编辑后保存，变量没出现在列表里。

**根因**：`handleSaveMultiEnvVar` 只做更新不做 upsert，新增变量被过滤掉。

**修复**：改为 upsert 逻辑——存在则更新，不存在则追加。

---

## 🧹 代码审查清理

1.0 发版前做了一轮代码审查，清理了几个问题：

| 问题 | 处理 |
|---|---|
| `genDepId` / `genEnvId` 两个完全相同的函数 | 合并为 `genId` |
| React 列表用数组索引 `key={i}` | 改为复合 key `${variableId}-${field}` |
| `EnvSwitcher` 里有未使用的 `PRESET_ENV_COUNT` / `nextCustomEnvName` 导出 | 删除 |
| `getEnvMeta(name, customEnvs.includes(name) ? undefined : undefined)` 三元两边相同 | 简化为 `getEnvMeta(name)` |
| `sample.ts` 整个文件无引用 | 删除 |

---

## 🛠️ 踩过的坑：CI 安装失败

发版时遇到一个典型的 peer dep 冲突：

**现象**：本地 `npm ci` 正常，GitHub Actions 上 `npm ci` 报错：

```
npm error Missing: esbuild@0.28.1 from lock file
```

**排查过程**：

1. `package.json` 里只有 `vitest: ^4.1.10`
2. `vitest@4` 依赖 `vite@8`
3. `vite@8` 声明 `esbuild: ^0.27.0 || ^0.28.0` 为 **peer dependency**
4. 本地 npm 11 把 peer dep 当可选，没写进 lock
5. CI 的 npm 10（node 22）严格校验 peer dep，发现 lock 里缺 `esbuild@0.28.1` 就报错

**解决方案**：CI workflow 里 `npm ci` 改为 `npm ci --legacy-peer-deps`，跳过 peer dep 严格校验。这样既不污染 `package.json`（不强行加 `esbuild` 作为 optionalDependencies），也不需要 lock 包含多余版本。

**教训**：本地 npm 版本和 CI 不一致时，peer dep 处理策略差异会导致「本地过 CI 不过」。建议：

- 本地和 CI 用相同 node 版本
- 或者在 CI 里统一用 `--legacy-peer-deps`（对工具类项目足够）

---

## 📊 最终交付数据

| 指标 | 数值 |
|---|---|
| 测试用例数 | 163 |
| 测试通过率 | 100% |
| 构建产物（gzip） | ~62 KB |
| 运行时依赖 | 0（除 React / Vite / Tailwind 框架本身） |
| 支持格式 | 7 种（.env / package.json / requirements.txt / pyproject.toml / yarn.lock / pnpm-lock.yaml / package-lock.json） |
| CLI 命令 | 5 个（scan / status / install / uninstall / edit） |

---

## 🚀 本地体验

```bash
git clone https://github.com/yyyhhh0317/EnvBoard.git
cd EnvBoard
npm install
npm run dev      # http://localhost:5173
npm run test     # 跑 163 个测试
npm run build    # 构建生产版本
```

### 搜索替换验证

1. 上传 `test-fixtures/v1.0.0.env`
2. 点工具栏「搜索替换」
3. 查找 `localhost` → 替换为 `127.0.0.1`，勾选「变量值」
4. 预览 3 处匹配，点「替换全部」

### CLI 验证

```bash
cd cli && npm install
npx tsx src/index.ts scan -f ../test-fixtures/v1.0.0.env
```

---

## 🛣️ 下一步

1.0 之后的方向，初步考虑：

- **截图与文档完善**：补全 README 中的截图占位
- **性能优化**：大文件（1000+ 变量）的虚拟滚动
- **更多导出格式**：Docker env file、Kubernetes ConfigMap
- **国际化**：英文界面支持

具体优先级看 Issue 反馈。

---

## 写在最后

从 v0.1.0 的「先跑起来」到 v1.0.0 的「敢交付」，EnvBoard 走了 5 个版本。1.0 这一版最大的变化不是新功能，而是**心态变化**：

- 以前是「能用就行」，现在每个解析器都有测试兜底
- 以前是「手动验证」，现在 CI 自动跑
- 以前是「加功能优先」，现在「修 Bug 和稳定性优先」

如果你也在做一个从 0 到 1 的开源工具，希望这篇记录能给你一些参考。**测试基线越早建立越好**——我拖到 1.0 才补，中间踩了不少回归 Bug 的坑。

欢迎 **Star ⭐** + **Issue** + **PR** 三件套。如果你有想要的功能或遇到的 Bug，直接发 Issue 就行，每一条我都会回复。

---

> **本文同步发布于**：
> - GitHub 仓库：[yyyhhh0317/EnvBoard](https://github.com/yyyhhh0317/EnvBoard)
> - 在线 Demo：https://yyyhhh0317.github.io/EnvBoard/
> - v1.0.0 Release：[Release Notes](https://github.com/yyyhhh0317/EnvBoard/releases/tag/v1.0.0)
> - CSDN 专栏：（后续补上）

---

**EnvBoard 版本推送文系列**：

- [v0.1.0 ~ v0.2.0：从 .env 到多格式配置管理](#)（本文之前）
- **v1.0.0：搜索替换 + 测试覆盖 + 稳定发布**（本文）
