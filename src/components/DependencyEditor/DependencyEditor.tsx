// 依赖编辑弹窗
import { useEffect, useState } from 'react'
import type { Dependency, DependencyCategory } from '../../types'

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

const CATEGORY_LABEL: Record<string, string> = {
  dependencies: '生产依赖',
  devDependencies: '开发依赖',
  peerDependencies: '同级依赖',
  optionalDependencies: '可选依赖',
  optional: '可选/扩展',
  scripts: '脚本',
  engines: '运行环境',
}

export function DependencyEditor({ dependency, onSave, onClose }: DependencyEditorProps) {
  const [draft, setDraft] = useState<Dependency | null>(dependency)

  useEffect(() => setDraft(dependency), [dependency])

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    }
    if (dependency) {
      window.addEventListener('keydown', onKey)
      return () => window.removeEventListener('keydown', onKey)
    }
  }, [dependency, onClose])

  if (!dependency || !draft) return null

  const update = (patch: Partial<Dependency>) => setDraft((prev) => (prev ? { ...prev, ...patch } : prev))

  const handleSave = () => onSave(draft)

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm" onClick={onClose} />
      <div className="relative w-full max-w-lg rounded-2xl bg-white p-6 shadow-xl dark:bg-slate-800">
        <h2 className="mb-4 text-lg font-bold text-slate-900 dark:text-white">编辑依赖</h2>

        <div className="space-y-4">
          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              名称
            </label>
            <input
              type="text"
              value={draft.name}
              onChange={(e) => update({ name: e.target.value })}
              placeholder="包名 / 脚本名"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
              autoFocus
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">
              {draft.isScript ? '命令' : '版本约束'}
            </label>
            <input
              type="text"
              value={draft.versionSpec}
              onChange={(e) => update({ versionSpec: e.target.value })}
              placeholder={draft.isScript ? 'npm run ...' : '^1.0.0, >=2.0,<3.0'}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">分类</label>
            <select
              value={draft.category}
              onChange={(e) => update({ category: e.target.value as DependencyCategory, isScript: e.target.value === 'scripts' })}
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            >
              {CATEGORIES.map((c) => (
                <option key={c} value={c}>{CATEGORY_LABEL[c] ?? c}</option>
              ))}
            </select>
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium text-slate-700 dark:text-slate-300">备注</label>
            <input
              type="text"
              value={draft.comment ?? ''}
              onChange={(e) => update({ comment: e.target.value })}
              placeholder="可选说明"
              className="w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
          </div>
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
            disabled={!draft.name.trim()}
            className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
          >
            保存
          </button>
        </div>
      </div>
    </div>
  )
}
