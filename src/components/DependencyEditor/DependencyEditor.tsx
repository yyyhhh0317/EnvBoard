// 依赖编辑弹窗
import { useEffect, useState } from 'react'
import type { Dependency, DependencyCategory } from '../../types'
import { useModalFocus } from '../../hooks/useModal'
import { useI18n } from '../../i18n/index.tsx'

interface DependencyEditorProps {
  dependency: Dependency | null
  onSave: (dep: Dependency) => void
  onClose: () => void
}

const CATEGORIES: DependencyCategory[] = [
  'dependencies',
  'devDependencies',
  'peerDependencies',
  'optionalDependencies',
  'optional',
  'scripts',
  'engines',
]

const CATEGORY_KEY: Record<string, string> = {
  dependencies: 'depEditor.categoryDeps',
  devDependencies: 'depEditor.categoryDev',
  peerDependencies: 'depEditor.categoryPeer',
  optionalDependencies: 'depEditor.categoryOptional',
  optional: 'depEditor.categoryOptionalExt',
  scripts: 'depEditor.categoryScripts',
  engines: 'depEditor.categoryEngines',
}

export function DependencyEditor({ dependency, onSave, onClose }: DependencyEditorProps) {
  const { t } = useI18n()
  const [draft, setDraft] = useState<Dependency | null>(dependency)
  // a11y：焦点圈定 / Escape 关闭 / 恢复焦点
  const dialogRef = useModalFocus(dependency !== null, onClose)

  useEffect(() => setDraft(dependency), [dependency])

  if (!dependency || !draft) return null

  const update = (patch: Partial<Dependency>) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))

  const handleSave = () => onSave(draft)

  return (
    <div
      ref={dialogRef}
      role="dialog"
      aria-modal="true"
      aria-labelledby="dep-editor-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
    >
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} aria-hidden="true" />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 id="dep-editor-title" className="mb-4 text-lg font-bold text-slate-900 dark:text-white">{t('depEditor.title')}</h2>

        <div className="space-y-4">
          <div>
            <label htmlFor="dep-editor-name" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('depEditor.name')}
            </label>
            <input
              id="dep-editor-name"
              type="text"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder={t('depEditor.namePlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <div>
            <label htmlFor="dep-editor-version" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {t('depEditor.versionOrCmd')}
            </label>
            <input
              id="dep-editor-version"
              type="text"
              value={draft.versionSpec}
              onChange={(e) => update({ versionSpec: e.target.value })}
              placeholder={draft.isScript ? t('depEditor.cmdPlaceholder') : t('depEditor.versionPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <div>
            <label htmlFor="dep-editor-category" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('depEditor.category')}</label>
            <select
              id="dep-editor-category"
              value={draft.category}
              onChange={(e) => update({ category: e.target.value as DependencyCategory, isScript: e.target.value === 'scripts' })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{t(CATEGORY_KEY[c] ?? c)}</option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="dep-editor-comment" className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">{t('depEditor.comment')}</label>
            <input
              id="dep-editor-comment"
              type="text"
              value={draft.comment ?? ''}
              onChange={(e) => update({ comment: e.target.value })}
              placeholder={t('depEditor.commentPlaceholder')}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
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
            disabled={!draft.name.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {t('common.save')}
          </button>
        </div>
      </div>
    </div>
  )
}
