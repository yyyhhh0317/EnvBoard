// 环境切换器：顶部 Tab 切换当前查看的环境，支持新增自定义环境
import { useState } from 'react'
import type { EnvMeta, EnvName } from '../../types'
import { getEnvMeta } from '../../utils/parser/envPresets'

interface EnvSwitcherProps {
  envOrder: EnvName[]
  activeEnv: EnvName | null
  envCounts: Record<EnvName, number>
  customEnvs: EnvName[]
  onSelect: (env: EnvName) => void
  onAddCustom: (env: EnvName) => void
  onRemoveCustom: (env: EnvName) => void
}

/** 颜色 -> tailwind 类名映射 */
const COLOR_CLASSES: Record<string, { active: string; idle: string; dot: string }> = {
  emerald: {
    active: 'bg-emerald-600 text-white',
    idle: 'bg-emerald-50 text-emerald-700 hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  amber: {
    active: 'bg-amber-500 text-white',
    idle: 'bg-amber-50 text-amber-700 hover:bg-amber-100 dark:bg-amber-900/30 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
  purple: {
    active: 'bg-purple-600 text-white',
    idle: 'bg-purple-50 text-purple-700 hover:bg-purple-100 dark:bg-purple-900/30 dark:text-purple-300',
    dot: 'bg-purple-500',
  },
  rose: {
    active: 'bg-rose-600 text-white',
    idle: 'bg-rose-50 text-rose-700 hover:bg-rose-100 dark:bg-rose-900/30 dark:text-rose-300',
    dot: 'bg-rose-500',
  },
  cyan: {
    active: 'bg-cyan-600 text-white',
    idle: 'bg-cyan-50 text-cyan-700 hover:bg-cyan-100 dark:bg-cyan-900/30 dark:text-cyan-300',
    dot: 'bg-cyan-500',
  },
  blue: {
    active: 'bg-blue-600 text-white',
    idle: 'bg-blue-50 text-blue-700 hover:bg-blue-100 dark:bg-blue-900/30 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  teal: {
    active: 'bg-teal-600 text-white',
    idle: 'bg-teal-50 text-teal-700 hover:bg-teal-100 dark:bg-teal-900/30 dark:text-teal-300',
    dot: 'bg-teal-500',
  },
  indigo: {
    active: 'bg-indigo-600 text-white',
    idle: 'bg-indigo-50 text-indigo-700 hover:bg-indigo-100 dark:bg-indigo-900/30 dark:text-indigo-300',
    dot: 'bg-indigo-500',
  },
  pink: {
    active: 'bg-pink-600 text-white',
    idle: 'bg-pink-50 text-pink-700 hover:bg-pink-100 dark:bg-pink-900/30 dark:text-pink-300',
    dot: 'bg-pink-500',
  },
  orange: {
    active: 'bg-orange-600 text-white',
    idle: 'bg-orange-50 text-orange-700 hover:bg-orange-100 dark:bg-orange-900/30 dark:text-orange-300',
    dot: 'bg-orange-500',
  },
}

function getColorClasses(color: string) {
  return COLOR_CLASSES[color] ?? COLOR_CLASSES.emerald
}

export function EnvSwitcher({
  envOrder,
  activeEnv,
  envCounts,
  customEnvs,
  onSelect,
  onAddCustom,
  onRemoveCustom,
}: EnvSwitcherProps) {
  const [adding, setAdding] = useState(false)
  const [newName, setNewName] = useState('')

  const handleAdd = () => {
    const name = newName.trim().toLowerCase().replace(/\s+/g, '-')
    if (!name || envOrder.includes(name)) {
      setAdding(false)
      setNewName('')
      return
    }
    onAddCustom(name)
    setAdding(false)
    setNewName('')
  }

  // 计算每个环境的元信息
  const metas: EnvMeta[] = envOrder.map((name) => getEnvMeta(name))

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-3 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
      <div className="flex flex-wrap items-center gap-2">
        <span className="mr-1 text-xs font-medium text-slate-500 dark:text-slate-400">
          环境：
        </span>
        {metas.map((meta) => {
          const classes = getColorClasses(meta.color)
          const isActive = activeEnv === meta.name
          const count = envCounts[meta.name] ?? 0
          const isCustom = customEnvs.includes(meta.name)
          return (
            <div key={meta.name} className="group relative inline-flex">
              <button
                onClick={() => onSelect(meta.name)}
                aria-pressed={isActive}
                className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 text-sm font-medium transition ${
                  isActive ? classes.active : classes.idle
                }`}
                title={meta.filename ?? meta.name}
              >
                <span className={`h-1.5 w-1.5 rounded-full ${classes.dot}`} />
                {meta.label}
                <span className={`rounded-full px-1.5 text-[10px] ${
                  isActive ? 'bg-white/20' : 'bg-slate-200/70 dark:bg-slate-700/70'
                }`}>
                  {count}
                </span>
              </button>
              {isCustom && (
                <button
                  onClick={(e) => {
                    e.stopPropagation()
                    onRemoveCustom(meta.name)
                  }}
                  aria-label={`删除自定义环境 ${meta.label}`}
                  className="absolute -right-1 -top-1 flex h-4 w-4 items-center justify-center rounded-full bg-slate-300 text-slate-600 opacity-0 transition hover:bg-red-500 hover:text-white focus:opacity-100 group-hover:opacity-100 group-focus-within:opacity-100 dark:bg-slate-600 dark:text-slate-200"
                >
                  <svg className="h-2.5 w-2.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                    <path strokeLinecap="round" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              )}
            </div>
          )
        })}

        {/* 新增自定义环境 */}
        {adding ? (
          <div className="flex items-center gap-1">
            <input
              type="text"
              value={newName}
              onChange={(e) => setNewName(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') handleAdd()
                if (e.key === 'Escape') {
                  setAdding(false)
                  setNewName('')
                }
              }}
              placeholder="环境名（如 preview）"
              aria-label="新环境名称"
              autoFocus
              className="w-32 rounded-full border border-slate-300 bg-white px-3 py-1 text-sm outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
            />
            <button
              onClick={handleAdd}
              className="rounded-full bg-emerald-600 px-2 py-1 text-xs text-white hover:bg-emerald-700"
            >
              确定
            </button>
          </div>
        ) : (
          <button
            onClick={() => setAdding(true)}
            className="inline-flex items-center gap-1 rounded-full border border-dashed border-slate-300 px-3 py-1.5 text-sm text-slate-500 transition hover:border-emerald-400 hover:text-emerald-600 dark:border-slate-600 dark:text-slate-400 dark:hover:border-emerald-500"
            title="新增自定义环境"
          >
            <svg className="h-3.5 w-3.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 4v16m8-8H4" />
            </svg>
            新增
          </button>
        )}
      </div>
    </div>
  )
}
