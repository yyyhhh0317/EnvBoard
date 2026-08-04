# 测试示例文件

每个版本配套的示例文件，用于手动验证 EnvBoard 各项功能。

## 版本对照

| 版本 | 示例文件 | 验证功能 |
|------|---------|---------|
| v0.1.0 | `v0.1.0.env` | .env 解析：注释、空行、引号、敏感值、被注释变量、重复 key 错误 |
| v0.1.0 | `v0.1.0.env.example` | 对比功能：extra / missing / 修改值高亮 |
| v0.2.0 | `package.json` | npm 依赖解析：dependencies / devDependencies / scripts / engines |
| v0.2.0 | `requirements.txt` | pip 依赖解析：注释分组、版本约束、子分组识别 |
| v0.2.0 | `v0.2.0.pyproject.toml` | Poetry 解析：PEP 621 + group 依赖 |
| v0.2.0 | `v0.2.0.package-lock.json` | lockfile 解析：锁定版本提取 |
| v0.2.1 | `v0.2.1.env` | 变量校验：命名规范、重复 key、敏感值为空、占位符 |
| v0.3.0 | `v0.3.0.env.all` | 单文件多环境：`# @env` 分段解析、环境切换、对比 |
| v0.3.0 | `v0.3.0.env.development` | 多文件导入：文件名识别环境 |
| v0.3.0 | `v0.3.0.env.production` | 多文件导入：配合 development 测试对比 |
| v0.4.0 | `v0.4.0.env` | CLI scan 解析：注释分组、引号、敏感值、disabled 变量、空值；CLI edit 编辑验证 |

## 使用方法

### 基础验证
1. 打开 [在线 Demo](https://yyyhhh0317.github.io/EnvBoard/) 或本地 `npm run dev`
2. 在「上传文件」模式下选择对应示例文件
3. 对照上表「验证功能」列检查结果

### 对比功能（v0.1.0）
1. 先上传 `v0.1.0.env`
2. 在「对比」区域上传 `v0.1.0.env.example`
3. 应显示：`DB_PASSWORD` 为 missing、`NEW_FEATURE_FLAG` 为 extra

### 模板与校验（v0.2.1）
1. 上传 `v0.2.1.env`
2. 校验列应显示问题数（红色为错误，黄色为警告）
3. 点击「模板」按钮，应用「通用 Web 应用」模板
4. 应用后 `APP_PORT` 等变量会触发类型校验

### 多环境切换（v0.3.0）

**方式一：单文件多环境**
1. 上传 `v0.3.0.env.all`
2. 顶部自动出现环境切换器（development / staging / production）
3. 点击「环境对比」查看差异

**方式二：多文件导入**
1. 上传 `v0.3.0.env.development`
2. 点击「+ 追加环境文件」按钮，选择 `v0.3.0.env.production`
3. 两个环境自动合并，可切换查看或对比

### CLI 命令验证（v0.4.0）

**前置：** 在 `cli/` 目录执行 `npm install`

**scan 解析验证：**
```bash
cd cli
npx tsx src/index.ts scan -f ../test-fixtures/v0.4.0.env
```
预期：识别 13 个变量，`DATABASE_URL` / `DB_PASSWORD` / `API_KEY` / `JWT_SECRET` 标记为敏感值（显示 ******），`OLD_FEATURE_FLAG` 显示为 disabled（灰色删除线）

**JSON 输出验证：**
```bash
npx tsx src/index.ts scan -f ../test-fixtures/v0.4.0.env -j
```
预期：输出合法 JSON，包含 `files` 数组，每个文件含 `filename` / `type` / `data`

**edit 编辑验证：**
```bash
cp ../test-fixtures/v0.4.0.env /tmp/test.env
npx tsx src/index.ts edit -f /tmp/test.env
```
预期：可选择「修改变量值」「删除变量」「添加变量」，操作后文件正确更新且注释保留

## 约定

- 文件名以 `v0.x.x.` 前缀开头，避免被 `.gitignore` 的 `.env` 规则误伤
- 每个文件顶部注释说明预期结果，方便对照验证
- 新增版本功能时，同步在此目录补充对应示例文件
