// 配置模板选择弹窗：浏览内置/自定义模板，应用或保存为自定义
import { useEffect, useMemo, useState } from 'react'
import type { ConfigTemplate, EnvVariable, TemplateCategory } from '../../types'
import { BUILTIN_TEMPLATES, CATEGORY_LABELS } from '../../utils/templates/builtinTemplates'
import {
  addCustomTemplate,
  deleteCustomTemplate,
  genTemplateId,
  loadCustomTemplates,
  templateToVariables,
  variablesToTemplate,
} from '../../utils/templates/templateStore'
import { useModalFocus } from '../../hooks/useModal'

interface TemplatePickerProps {
  open: boolean
  variables: EnvVariable[]
  genId: () => string
  onApply: (newVars: EnvVariable[], templateVars: ConfigTemplate['variables']) => void
  onClose: () => void
}

export function TemplatePicker({ open, variables, genId, onApply, onClose }: TemplatePickerProps) {
  const [customList, setCustomList] = useState<ConfigTemplate[]>([])
  const [activeCategory, setActiveCategory] = useState<TemplateCategory | 'all'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)
  // 保存为自定义模板
  const [saveMode, setSaveMode] = useState(false)
  const [saveName, setSaveName] = useState('')
  const [saveDesc, setSaveDesc] = useState('')
  // a11y：焦点圈定 / Escape 关闭 / 恢复焦点
  const dialogRef = useModalFocus(open, onClose)

  useEffect(() => {
    if (open) {
      setCustomList(loadCustomTemplates())
      setSelectedId(null)
      setSaveMode(false)
      setSaveName('')
      setSaveDesc('')
    }
  }, [open])

  const allTemplates = useMemo(() => [...BUILTIN_TEMPLATES, ...customList], [customList])

  const filtered = useMemo(() => {
    if (activeCategory === 'all') return allTemplates
    return allTemplates.filter((t) => t.category === activeCategory)
  }, [allTemplates, activeCategory])

  const selected = useMemo(
    () => allTemplates.find((t) => t.id === selectedId) ?? null,
    [allTemplates, selectedId],
  )

  if (!open) return null

  const handleApply = () => {
    if (!selected) return
    // 仅添加当前变量列表中不存在的 key
    const existingKeys = new Set(variables.map((v) => v.key))
    const toAdd = templateToVariables(selected, genId).filter((v) => !existingKeys.has(v.key))
    onApply([...variables, ...toAdd], selected.variables)
    onClose()
  }

  const handleSaveCustom = () => {
    if (!saveName.trim()) return
    const tpl = variablesToTemplate(
      genTemplateId(),
      saveName.trim(),
      saveDesc.trim(),
      variables,
    )
    const list = addCustomTemplate(tpl)
    setCustomList(list)
    setSaveMode(false)
    setSaveName('')
    setSaveDesc('')
    setSelectedId(tpl.id)
    setActiveCategory('custom')
  }

  const handleDeleteCustom = (id: string) => {
    const list = deleteCustomTemplate(id)
    setCustomList(list)
    if (selectedId === id) setSelectedId(null)
  }

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-picker-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative flex max-h-[85vh] w-full max-w-3xl flex-col rounded-2xl bg-white shadow-xl dark:bg-slate-800">
        {/* 头部 */}
        <div className="flex items-center justify-between border-b border-slate-200 p-5 dark:border-slate-700">
          <div>
            <h2 id="template-picker-title" className="text-lg font-bold text-slate-900 dark:text-white">配置模板</h2>
            <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
              选择模板快速生成变量骨架，或把当前变量保存为自定义模板
            </p>
          </div>
          <button
            onClick={onClose}
            aria-label="关闭"
            className="rounded-lg p-2 text-slate-400 transition hover:bg-slate-100 hover:text-slate-600 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* 分类切换 */}
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 px-5 py-3 dark:border-slate-700/80">
          {(['all', 'general', 'frontend', 'python', 'custom'] as const).map((cat) => {
            const count = cat === 'all' ? allTemplates.length : allTemplates.filter((t) => t.category === cat).length
            if (cat === 'custom' && count === 0) return null
            return (
              <button
                key={cat}
                onClick={() => setActiveCategory(cat)}
                aria-pressed={activeCategory === cat}
                className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                  activeCategory === cat
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {cat === 'all' ? '全部' : CATEGORY_LABELS[cat]}（{count}）
              </button>
            )
          })}
        </div>

        {/* 内容区 */}
        <div className="flex flex-1 overflow-hidden">
          {/* 左侧列表 */}
          <div className="w-1/2 overflow-y-auto border-r border-slate-200/80 p-3 dark:border-slate-700/80">
            {filtered.length === 0 ? (
              <div className="px-3 py-10 text-center text-sm text-slate-400">
                暂无模板
              </div>
            ) : (
              <ul className="space-y-1.5">
                {filtered.map((t) => (
                  <li key={t.id} className="group relative">
                    <button
                      onClick={() => setSelectedId(t.id)}
                      className={`w-full rounded-lg border px-3 py-2.5 text-left transition ${
                        selectedId === t.id
                          ? 'border-emerald-500 bg-emerald-50 dark:border-emerald-500 dark:bg-emerald-900/20'
                          : 'border-transparent hover:bg-slate-50 dark:hover:bg-slate-700/50'
                      }`}
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="text-sm font-medium text-slate-800 dark:text-slate-100">
                          {t.name}
                        </span>
                      </div>
                      <div className="mt-0.5 line-clamp-1 text-xs text-slate-500 dark:text-slate-400">
                        {t.description}
                      </div>
                      <div className="mt-1 text-[10px] text-slate-400">
                        {CATEGORY_LABELS[t.category]} · {t.variables.length} 个变量
                      </div>
                    </button>
                    {t.category === 'custom' && (
                      <button
                        onClick={() => handleDeleteCustom(t.id)}
                        aria-label={`删除自定义模板 ${t.name}`}
                        className="absolute right-1 top-1 rounded p-1 text-slate-400 opacity-0 transition hover:bg-red-50 hover:text-red-500 focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 dark:hover:bg-red-900/30"
                      >
                        <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </div>

          {/* 右侧详情 */}
          <div className="w-1/2 overflow-y-auto p-4">
            {!saveMode && !selected && (
              <div className="flex h-full flex-col items-center justify-center text-center text-sm text-slate-400">
                <svg className="mb-2 h-10 w-10 opacity-40" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                选择左侧模板查看详情
              </div>
            )}

            {saveMode && (
              <div className="space-y-3">
                <h3 className="text-sm font-semibold text-slate-800 dark:text-slate-100">
                  保存当前变量为自定义模板
                </h3>
                <p className="text-xs text-slate-500 dark:text-slate-400">
                  将从当前 {variables.filter((v) => v.key && !v.isDisabled).length} 个变量生成模板，存储在浏览器本地。
                </p>
                <div>
                  <label htmlFor="tpl-save-name" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    模板名称
                  </label>
                  <input
                    id="tpl-save-name"
                    type="text"
                    value={saveName}
                    onChange={(e) => setSaveName(e.target.value)}
                    placeholder="例如：我的项目模板"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
                <div>
                  <label htmlFor="tpl-save-desc" className="mb-1 block text-xs font-medium text-slate-600 dark:text-slate-300">
                    描述（可选）
                  </label>
                  <input
                    id="tpl-save-desc"
                    type="text"
                    value={saveDesc}
                    onChange={(e) => setSaveDesc(e.target.value)}
                    placeholder="简短描述模板用途"
                    className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                  />
                </div>
                <div className="flex justify-end gap-2 pt-2">
                  <button
                    onClick={() => setSaveMode(false)}
                    className="rounded-lg px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
                  >
                    取消
                  </button>
                  <button
                    onClick={handleSaveCustom}
                    disabled={!saveName.trim()}
                    className="rounded-lg bg-emerald-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-emerald-700 disabled:opacity-50"
                  >
                    保存
                  </button>
                </div>
              </div>
            )}

            {!saveMode && selected && (
              <div>
                <div className="mb-3">
                  <h3 className="text-base font-semibold text-slate-900 dark:text-white">
                    {selected.name}
                  </h3>
                  <p className="mt-0.5 text-xs text-slate-500 dark:text-slate-400">
                    {selected.description}
                  </p>
                </div>
                <div className="mb-3 text-xs text-slate-400">
                  {CATEGORY_LABELS[selected.category]} · {selected.variables.length} 个变量
                </div>
                <div className="space-y-1.5">
                  {selected.variables.map((v) => (
                    <div
                      key={v.key}
                      className="rounded-lg border border-slate-200 bg-slate-50/50 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-100">
                          {v.key}
                        </span>
                        <div className="flex items-center gap-1">
                          {v.required && (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 text-[10px] font-medium text-red-600 dark:bg-red-900/40 dark:text-red-300">
                              必填
                            </span>
                          )}
                          {v.isSensitive && (
                            <span className="rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-medium text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                              敏感
                            </span>
                          )}
                          {v.expectedType && (
                            <span className="rounded bg-slate-200 px-1.5 py-0.5 text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                              {v.expectedType}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="mt-1 font-mono text-[11px] text-slate-500 dark:text-slate-400">
                        {v.placeholder}
                      </div>
                      {v.comment && (
                        <div className="mt-0.5 text-[11px] text-slate-400">{v.comment}</div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* 底部操作 */}
        <div className="flex items-center justify-between gap-2 border-t border-slate-200 p-4 dark:border-slate-700">
          <button
            onClick={() => setSaveMode(true)}
            disabled={variables.filter((v) => v.key && !v.isDisabled).length === 0}
            className="rounded-lg border border-slate-200 px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 disabled:cursor-not-allowed disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-700"
          >
            另存为自定义模板
          </button>
          <div className="flex gap-2">
            <button
              onClick={onClose}
              className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
            >
              取消
            </button>
            <button
              onClick={handleApply}
              disabled={!selected}
              className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              应用模板
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}
