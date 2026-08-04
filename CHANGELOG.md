# Changelog

本项目版本变更记录。格式参考 [Keep a Changelog](https://keepachangelog.com/zh-CN/)。

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
