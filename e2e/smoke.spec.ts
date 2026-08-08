// E2E 冒烟（v2.0.0）：导入 → 编辑 → 语言切换 主流程
import { expect, test } from '@playwright/test'

test('首页加载：展示 hero 与导入区（默认中文）', async ({ page }) => {
  await page.goto('/')
  await expect(page.getByRole('heading', { name: '环境配置可视化管理' })).toBeVisible()
  await expect(page.getByText('点击选择文件，或拖拽到此处')).toBeVisible()
})

test('粘贴解析 .env：表格出现变量', async ({ page }) => {
  await page.goto('/')
  await page.getByText('粘贴文本').click()
  await page
    .getByPlaceholder(/# 粘贴配置文件内容/)
    .fill('DATABASE_URL=postgres://localhost:5432/mydb\nAPI_KEY=your-secret-key')
  await page.getByRole('button', { name: '解析' }).click()
  await expect(page.getByText('DATABASE_URL')).toBeVisible()
  await expect(page.getByText('postgres://localhost:5432/mydb')).toBeVisible()
})

test('新增变量：弹窗保存后出现在表格', async ({ page }) => {
  await page.goto('/')
  // 先导入一个文件进入编辑态
  await page.getByText('粘贴文本').click()
  await page.getByPlaceholder(/# 粘贴配置文件内容/).fill('FOO=bar')
  await page.getByRole('button', { name: '解析' }).click()
  await expect(page.getByText('FOO')).toBeVisible()

  await page.getByRole('button', { name: '+ 添加变量' }).click()
  await expect(page.getByRole('dialog')).toBeVisible()
  await page.getByLabel('变量名 (Key)').fill('NEW_KEY')
  await page.getByLabel('变量值 (Value)').fill('hello')
  await page.getByRole('button', { name: '保存' }).click()
  await expect(page.getByText('NEW_KEY')).toBeVisible()
  await expect(page.getByText('hello')).toBeVisible()
})

test('语言切换：切到英文后界面文案变为英文', async ({ page }) => {
  await page.goto('/')
  // 初始中文
  await expect(page.getByText('环境配置可视化管理')).toBeVisible()
  // 点击语言切换按钮（初始显示 EN）
  await page.getByRole('button', { name: '切换语言（中文 / English）' }).click()
  // 断言英文 hero（按钮文本变为 中，说明已切到 en）
  await expect(page.getByRole('button', { name: '切换语言（中文 / English）' })).toHaveText('中')
  await expect(page.getByRole('heading', { name: 'Env Config Visualizer' })).toBeVisible()
})
