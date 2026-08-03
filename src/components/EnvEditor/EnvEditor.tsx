// 变量编辑弹窗
import { useEffect, useState } from 'react'
import type { EnvVariable } from '../../types'
import { isSensitiveKey } from '../../utils/sensitive'

interface EnvEditorProps {
  variable: EnvVariable | null
  onSave: (variable: EnvVariable) => void
  onClose: () => void
}

export function EnvEditor({ variable, onSave, onClose }: EnvEditorProps) {
  const [draft, setDraft] = useState<EnvVariable | null>(variable)

  useEffect(() => {
    setDraft(variable)
  }, [variable])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (variable) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [variable, onClose])

  if (!variable || !draft) return null

  const update = (patch: Partial<EnvVariable>) => {
    setDraft((prev) => (prev ? { ...prev, ...patch } : prev))
  }

  const handleKeyChange = (key: string) => {
    update({ key, isSensitive: isSensitiveKey(key) })
  }

  const handleSave = () => {
    onSave({ ...draft, isModified: true })
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          {draft.isNew ? '添加变量' : '编辑变量'}
        </h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              变量名 (Key)
            </label>
            <input
              type="text"
              value={draft.key}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder="例如：DATABASE_URL"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              变量值 (Value)
            </label>
            <input
              type="text"
              value={draft.value}
              onChange={(e) => update({ value: e.target.value })}
              placeholder="变量值"
              className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm outline-none transition focus:ring-2 dark:bg-slate-900 ${
                draft.isSensitive
                  ? 'border-amber-400 text-amber-700 focus:border-amber-500 focus:ring-amber-500/20 dark:text-amber-300'
                  : 'border-slate-300 text-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 dark:text-slate-200 dark:border-slate-600'
              }`}
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              注释
            </label>
            <input
              type="text"
              value={draft.comment}
              onChange={(e) => update({ comment: e.target.value })}
              placeholder="可选的说明注释"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <label className="flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
            <input
              type="checkbox"
              checked={draft.isSensitive}
              onChange={(e) => update({ isSensitive: e.target.checked })}
              className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            标记为敏感变量（默认隐藏值）
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            取消
          </button>
          <button
            onClick={handleSave}
            disabled={!draft.key.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
