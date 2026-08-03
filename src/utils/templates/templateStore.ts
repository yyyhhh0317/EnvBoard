// 自定义模板存储（localStorage）+ 应用模板工具
import type { ConfigTemplate, EnvVariable, TemplateVariable } from '../../types'

const STORAGE_KEY = 'envboard:custom-templates'

/** 读取自定义模板列表 */
export function loadCustomTemplates(): ConfigTemplate[] {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return []
    const parsed = JSON.parse(raw)
    if (!Array.isArray(parsed)) return []
    return parsed as ConfigTemplate[]
  } catch {
    return []
  }
}

/** 保存自定义模板列表（全量覆盖） */
export function saveCustomTemplates(templates: ConfigTemplate[]): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(templates))
  } catch {
    // 容量超限或隐私模式下静默失败
  }
}

/** 新增一个自定义模板（同 id 覆盖） */
export function addCustomTemplate(template: ConfigTemplate): ConfigTemplate[] {
  const list = loadCustomTemplates()
  const idx = list.findIndex((t) => t.id === template.id)
  if (idx >= 0) list[idx] = template
  else list.push(template)
  saveCustomTemplates(list)
  return list
}

/** 删除自定义模板 */
export function deleteCustomTemplate(id: string): ConfigTemplate[] {
  const list = loadCustomTemplates().filter((t) => t.id !== id)
  saveCustomTemplates(list)
  return list
}

/** 生成唯一 id */
export function genTemplateId(): string {
  return `custom-${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 6)}`
}

/**
 * 将模板变量转换为 EnvVariable（带占位值，标记 isNew）
 * 已存在的同 key 变量会被跳过（由调用方处理）
 */
export function templateToVariables(template: ConfigTemplate, genId: () => string): EnvVariable[] {
  return template.variables.map((tv: TemplateVariable) => ({
    id: genId(),
    key: tv.key,
    value: tv.placeholder,
    comment: tv.comment,
    isSensitive: tv.isSensitive,
    isDisabled: false,
    isModified: false,
    isNew: true,
    error: null,
    line: 0,
  }))
}

/** 将当前变量列表导出为模板定义 */
export function variablesToTemplate(
  id: string,
  name: string,
  description: string,
  variables: EnvVariable[],
): ConfigTemplate {
  return {
    id,
    name,
    description,
    category: 'custom',
    variables: variables
      .filter((v) => v.key && !v.isDisabled)
      .map((v) => ({
        key: v.key,
        placeholder: v.value,
        comment: v.comment,
        isSensitive: v.isSensitive,
      })),
  }
}
