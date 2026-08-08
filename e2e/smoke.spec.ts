// E2E 冒烟（v2.0.0）：导入 → 编辑 → 语言切换 主流程
// 注意：
//  - 文本断言用 exact 匹配，避免表格行与导出预览 pre（KEY=VALUE）重复匹配
//  - 避免使用 DATABASE_URL / API_KEY / *_KEY 等会被敏感检测自动脱敏的 key（表格显示 ****）
//  - 语言切换后按钮 aria-label 变为英文，用中英正则定位
import { expect, test } from '@playwright/test'

test('首页加载：展示 hero 与导入区（默认中文）', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '环境配置可视化管理' })).toBeVisible()
  await expect(page.getByText('点击选择文件，或拖拽到此处')).toBeVisible()
})

test('粘贴解析 .env：表格出现变量', async ({ page }) => {
  await page.goto('/')
  await page.getByText('粘贴文本').click()
  await page.getByPlaceholder(/# 粘贴配置文件内容/).fill('HOST=localhost\nPORT=3000')
  await page.getByRole('button', { name: '解析' }).click()
  // 表格行内的 key/value（exact 精确匹配，避开导出预览的 KEY=VALUE 文本）
  await expect(page.getByText('HOST', { exact: true })).toBeVisible()
  await expect(page.getByText('localhost', { exact: true })).toBeVisible()
  await expect(page.getByText('PORT', { exact: true })).toBeVisible()
  await expect(page.getByText('3000', { exact: true })).toBeVisible()
})

test('新增变量：弹窗保存后出现在表格', async ({ page }) => {
  await page.goto('/')
  // 先导入一个文件进入编辑态
  await page.getByText('粘贴文本').click()
  await page.getByPlaceholder(/# 粘贴配置文件内容/).fill('FOO=bar')
  await page.getByRole('button', { name: '解析' }).click()
  await expect(page.getByText('FOO', { exact: true })).toBeVisible()

  await page.getByRole('button', { name: '+ 添加变量' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('变量名 (Key)').fill('MY_VAR')
  await page.getByLabel('变量值 (Value)').fill('hello')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('MY_VAR', { exact: true })).toBeVisible()
  await expect(page.getByText('hello', { exact: true })).toBeVisible()
})

test('语言切换：切到英文后界面文案变为英文', async ({ page }) => {
  await page.goto('/')
  // 初始中文（hero 标题唯一，避开 Header 副标题与 Footer 的同名文本）
  await expect(page.getByRole('heading', { name: '环境配置可视化管理' })).toBeVisible()
  // 语言切换按钮：切换后 aria-label 变为英文，用中英正则定位
  const langBtn = page.getByRole('button', { name: /切换语言|Switch language/ })
  await expect(langBtn).toHaveText('EN')
  await langBtn.click()
  await expect(langBtn).toHaveText('中')
  await expect(page.getByRole('heading', { name: 'Env Config Visualizer' })).toBeVisible()
})
