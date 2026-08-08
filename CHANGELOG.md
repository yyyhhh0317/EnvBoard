# Changelog

本项目版本变更记录。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)。

## [2.0.0] - 2026-08-08

### 新增
- **PWA 离线可安装**：
  - 手写 Service Worker（`public/sw.js`）：应用壳预缓存 + 运行时缓存（HTML 网络优先、资源缓存优先、离线回退 index.html），版本化缓存键自动清理旧版
  - Web App Manifest（standalone、主题色、192/512 图标 any+maskable），`scripts/gen_pwa_icons.py` 生成图标
  - 仅生产环境注册 SW，不影响开发热更新
- **中英双语（i18n）**：
  - 零依赖自研：`src/i18n/`（Context + 扁平字典 + `t(key, params)` 插值），语言持久化并同步 `<html lang>`
  - Header 一键切换 中文 / English；全站 19 个组件 + App 文案抽取（约 300 key），含撤销历史描述与环境预设标签
- **CLI 增补**（`cli/`）：
  - `envboard diff`：对比 .env 与 .env.example（可自定义路径），输出一致 / 缺失 / 多余 / 空值统计与明细
  - `envboard sync`：把 example 缺失的 key 追加到 .env（不覆盖已有值），`-n` 预演，目标不存在自动创建
  - `envboard init`：从 example 生成 .env，或从 .env 反推模板（值清空保留注释），无 `--force` 不覆盖
- **组件层测试**：testing-library 覆盖 Header / EnvImport / EnvTable / EnvEditor / SecretScanPanel 核心交互（22 例）
- **E2E 冒烟**：Playwright（`playwright.config.ts` + `e2e/smoke.spec.ts`）覆盖 导入 → 编辑 → 语言切换 主流程

### 测试
- 套件 298 → **320 例全部通过**（32 个测试文件）
- Vitest include 扩展支持 `.tsx` 组件测试

### 修复
- TemplatePicker map 参数与 i18n `t` 命名冲突
- EnvEditor 弹窗 hook 用名错误（`useModal` → `useModalFocus`）

## [1.4.0] - 2026-08-07

### 新增
- **依赖漏洞检查**（可选联网，默认关闭）：
  - npm 走 npm audit bulk 接口（单次批量请求）、PyPI 走 Google OSV API
  - 按严重级别（严重 / 高危 / 中危 / 低危）展示公告 id、标题、影响版本与详情链接
  - 与版本查询一致的隐私提示（发送包名与版本，不发送其他数据）
- **依赖关系图**：`package-lock.json` v3 解析为可折叠依赖树
  - 依赖解析优先顶层 `node_modules/<name>`，兜底任意同名条目（近似可视化）
  - 循环 / 重复引用标记为「循环/重复」并停止展开，深度上限 30
- **Monorepo 多包扫描**：一次多选多个依赖清单（`package.json` / `requirements.txt` / `pyproject.toml`，可混合格式）
  - 按包聚合展示依赖（可折叠）；自动识别根 `package.json` 的 `workspaces` 模式
  - 共享依赖检测（≥2 包声明，排除 scripts / engines）与**版本冲突**列表（红色高亮各包声明）
  - 非依赖清单文件（env / lockfile）跳过并报告
- **工具导出**：`extractVersion` / `normalizeVersion` 从 versionCheck 导出（漏洞检查复用）

### 测试
- 新增 vulnerabilityCheck 8 例、lockGraph 5 例、monorepoScan 8 例，lockfileParser 补依赖树断言
- 套件共 298 例全部通过（27 个测试文件）

## [1.3.0] - 2026-08-07

### 新增
- **配置格式扩展**：
  - `.ini` 解析：`[section]` 分段（key 展平为 `SECTION.KEY`）、`;` / `#` 注释、行内注释、引号值
  - `application.properties` 解析：`=` / `:` 分隔、`#` / `!` 注释、反斜杠续行、`\:` `\=` `\\` `\n` `\t` `\uXXXX` 转义
  - 粘贴文本时按内容信号自动识别格式（`[section]` → ini；点分小写 key → properties）
- **任意两文件对比**：对比区域可上传 `.env` / `.ini` / `.properties` 任意 env 类文件，检查缺失 / 多余 / 空值并一键同步
- **Schema 校验增强**：模板变量新增 `pattern`（正则）与 `enum`（允许取值）约束，违规值以 warning 提示；内置模板为 `NODE_ENV` / `LOG_LEVEL` 补充枚举、`APP_PORT` 补充数字格式
- **TOML 内联表支持**：`{ version = "...", extras = [...] }` 写法可解析，覆盖 Poetry 常见依赖声明

### 修复
- **敏感值识别漏判**：`API_KEY` / `SECRET_KEY` / `ACCESS_KEY` / `DATABASE_URL` 等带分隔符的复合关键词此前无法命中（分段匹配把 `API_KEY` 拆成 `API` / `KEY`，而 `KEY` 为防误判已移出关键词表）。现改为「归一化后复合词匹配 + 分段单词匹配」双策略，仍不会误判 `MONKEY` / `AUTHOR`

### 测试
- 新增 10 个测试文件（ini / properties / envLike、sensitive、compare、envDiff、envPresets、lockfile、package.json、pyproject、multiEnvExporter、dependencyExporter），并扩展 validator 测试覆盖 pattern / enum
- 套件共 260 例全部通过（21 个测试文件）

## [1.2.0] - 2026-08-07

### 新增
- **密钥泄露检测**：
  - 基于格式特征的密钥扫描：AWS Access Key / AWS Secret / GitHub Token / Slack / Stripe / Google API Key / OpenAI / 私钥（PEM）/ JWT / npm / PyPI / SendGrid / Twilio / Telegram / Mailgun
  - 泄露报告面板：命中变量列表（脱敏值 + 类型徽章 + 严重级别），检测到泄露自动展开
  - 单条清除 / 一键清除全部命中值；单环境模式清除操作支持撤销
  - 全程浏览器本地执行，不发送任何数据
- **导出脱敏策略**：
  - `.env` / 多环境导出时若内容含疑似泄露密钥，先弹窗确认：「导出并脱敏」（命中片段替换为 `[REDACTED]`）或「仍然导出」
  - `.env.example` 模板格式只导出 key 不含值，不触发确认
  - 泄露清除后自动退出脱敏态
- **测试**：新增 secretScan 15 例（含 redactSecrets），套件共 201 例全部通过

## [1.1.0] - 2026-08-07

### 新增
- **撤销 / 重做**：`.env` 编辑支持撤销 / 重做（单环境模式）
  - 工具栏撤销 / 重做按钮 + 快捷键 `Ctrl/Cmd+Z` / `Ctrl/Cmd+Shift+Z` / `Ctrl+Y`（输入框聚焦时不拦截）
  - 覆盖编辑、新增、删除、敏感标记、对比同步、搜索替换等操作；加载新文件 / 清空会话时重置历史
  - 历史上限 50 步，重做分支在新增操作后被截断
- **会话持久化**：编辑会话自动保存到浏览器本地，刷新 / 重新打开页面自动恢复
  - 覆盖单环境变量、多环境（含各环境）、依赖模式、模板、环境名等完整状态
  - 敏感值（`isSensitive`）用 Web Crypto AES-GCM 加密后落盘，本地存储不出现明文密钥
  - 解密失败或版本不匹配时安全降级为空会话并清理脏数据，避免静默导出空密钥
- **无障碍（a11y）**：
  - 三个弹窗（变量编辑 / 依赖编辑 / 模板选择）语义化：`role=dialog` + `aria-modal` + 标题关联
  - 弹窗焦点管理：打开聚焦首元素、Tab 焦点圈定、Escape 关闭、关闭后焦点还原、锁定背景滚动
  - 表单 label 与输入框显式关联；图标按钮补充 `aria-label`
  - TemplatePicker 修复「按钮内嵌交互元素」非法嵌套；EnvSwitcher 删除环境按钮改为键盘可聚焦
  - 全局 `focus-visible` 焦点样式与 `prefers-reduced-motion` 减少动效适配
  - 顶部「跳到主内容」链接
- **测试**：新增 crypto（7 例）与 sessionStore（9 例）测试，套件共 186 例全部通过

### 文档
- README：新增 v1.1.0 功能特性、使用说明第 9/10 步、FAQ（会话保存 / 快捷键）、项目结构补充 hooks 与 persistence
- 项目截图占位保留，待后续大版本统一补充

## [1.0.0] - 2026-08-04

### 新增
- **搜索替换**：工具栏新增「搜索替换」面板，支持批量查找并替换变量名、值或注释
  - 纯文本匹配（转义正则特殊字符，避免注入风险）
  - 支持区分大小写
  - 实时匹配预览（原值删除线 + 替换后高亮）
  - 匹配统计与「替换全部」一键执行
- **测试覆盖**：引入 Vitest 测试框架，覆盖核心解析器与工具函数
  - envParser / requirementsParser / detector / validator / multiEnvParser / exporter / searchReplace
  - 配置 GitHub Actions CI 自动运行测试
- **本地 CLI（v0.4.0 遗留）**：`scan` / `status` / `install` / `uninstall` / `edit` 命令

### 修复
- **敏感值误判**：`MONKEY_NAME` / `AUTHOR_NAME` 等含 `KEY` / `AUTH` 子串的变量不再被误标为敏感
  - 改为按非字母数字字符分段后精确匹配关键词
- **YAML 导出类型漂移**：`true` / `false` / `null` / 数字在 YAML 导出时强制加引号，防止解析器自动类型转换
- **pyproject 解析**：修复 optional-dependencies 组名丢失问题
- **EnvEditor 输入丢失**：修复受控/非受控混用导致的输入重置问题
- **多环境 upsert**：修复编辑新增变量时未正确追加的问题
- **搜索替换 $ 注入**：修复替换文本中的 `$&` / `$1` 等被当作特殊模式解释的问题
- **CI 安装失败**：vitest@4 传递依赖的 vite@8 要求 esbuild@^0.27||^0.28 作为 peer dep，导致 `npm ci` 在 CI 上失败，改用 `--legacy-peer-deps`

### 文档
- 重写 README：补充功能特性、架构说明、开发计划、FAQ
- 新增 v1.0.0 测试示例文件 `test-fixtures/v1.0.0.env`

## [0.4.0] - 2026-08-04

### 新增
- **本地 CLI**：`scan` / `status` / `install` / `uninstall` / `edit` 五个子命令
  - `scan`：解析 .env / package.json / requirements.txt / pyproject.toml 等文件
  - `status`：查看依赖状态
  - `install` / `uninstall`：添加 / 移除依赖
  - `edit`：交互式编辑 .env 文件

## [0.3.0] - 2026-08-04

### 新增
- **多环境管理**：支持 development / staging / production 等预设环境，可自定义环境名
- **单文件多环境**：支持 `# @env <name>` 分段标记
- **多文件导入**：一次导入多个 `.env.xxx` 文件，按文件名自动识别环境并合并
- **差异对比**：可视化各环境间的变量差异
- **多环境导出**：按环境分别导出，或合并为单文件分段格式
- **配置模板与校验**：预设 Web/数据库/微服务等场景模板，变量校验（类型 / 占位符 / 命名 / 重复 key）

## [0.2.0] - 2026-08-04

### 新增
- **依赖管理**：支持 `package.json` / `requirements.txt` / `pyproject.toml`（PEP 621 + Poetry）/ lockfile 解析
- **分类展示**：按生产依赖 / 开发依赖 / 同级依赖 / 脚本 / 运行环境等分类
- **版本查询**（可选）：联网查询 npm / PyPI 最新版本，默认关闭
- **格式化导出**：按原始格式导出修改后的配置文件

## [0.1.0] - 2026-08-04

### 新增
- **.env 解析与展示**：表格化展示 Key / Value / 注释
- **编辑管理**：修改 / 添加 / 删除 / 复制变量
- **敏感值脱敏**：自动识别 PASSWORD / SECRET / TOKEN / API_KEY 等敏感变量
- **对比同步**：上传 .env.example 对比缺失 / 多余 / 空值变量
- **多格式导出**：.env / .env.example / JSON / YAML
- **暗色模式**：跟随系统偏好，可手动切换
