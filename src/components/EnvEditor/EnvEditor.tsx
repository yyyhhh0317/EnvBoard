// 变量编辑弹窗
import { useEffect, useState } from 'react'
import type { EnvVariable } from '../../types'
import { isSensitiveKey } from '../../utils/sensitive'
import { useI18n } from '../../i18n/index.tsx'
import { useModalFocus } from '../../hooks/useModal'

interface EnvEditorProps {
  variable: EnvVariable | null
  onSave: (variable: EnvVariable) => void
  onClose: () => void
}

export function EnvEditor({ variable, onSave, onClose }: EnvEditorProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<EnvVariable | null>(variable)
  const dialogRef = useModalFocus(variable !== null, onClose)

  // 仅在 variable.id 变化时同步 draft（切换编辑不同变量），避免父组件重渲染传入新引用导致输入丢失
  useEffect(() => {
    setDraft(variable)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [variable?.id])

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
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="env-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm"
        onClick={onClose}
      />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 id="env-editor-title" className="mb-4 text-lg font-bold text-slate-900 dark:text-white">
          {draft.isNew ? t('envEditor.addTitle') : t('envEditor.editTitle')}
        </h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="env-editor-key" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('envEditor.keyLabel')}
            </label>
            <input
              id="env-editor-key"
              type="text"
              value={draft.key}
              onChange={(e) => handleKeyChange(e.target.value)}
              placeholder={t('envEditor.keyPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              autoFocus
            />
          </div>

          <div>
            <label htmlFor="env-editor-value" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('envEditor.valueLabel')}
            </label>
            <input
              id="env-editor-value"
              type="text"
              value={draft.value}
              onChange={(e) => update({ value: e.target.value })}
              placeholder={t('envEditor.valuePlaceholder')}
              className={`w-full rounded-lg border bg-white px-3 py-2 font-mono text-sm outline-none transition focus:ring-2 dark:bg-slate-900 ${
                draft.isSensitive
                  ? 'border-amber-400 text-amber-700 focus:border-amber-500 focus:ring-amber-500/20 dark:text-amber-300'
                  : 'border-slate-300 text-slate-800 focus:border-emerald-500 focus:ring-emerald-500/20 dark:text-slate-200 dark:border-slate-600'
              }`}
            />
          </div>

          <div>
            <label htmlFor="env-editor-comment" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('envEditor.commentLabel')}
            </label>
            <input
              id="env-editor-comment"
              type="text"
              value={draft.comment}
              onChange={(e) => update({ comment: e.target.value })}
              placeholder={t('envEditor.commentPlaceholder')}
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
            {t('envEditor.sensitiveLabel')}
          </label>
        </div>

        <div className="mt-6 flex justify-end gap-2">
          <button
            onClick={onClose}
            className="rounded-lg px-4 py-2 text-sm font-medium text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
          >
            {t('common.cancel')}
          </button>
          <button
            onClick={handleSave}
            disabled={!draft.key.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
