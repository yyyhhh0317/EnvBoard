// 环境对比视图：多环境间 key 差异表格
import { useMemo, useState } from 'react'
import type { EnvName } from '../../types'
import { diffEnvs, summarizeDiff } from '../../utils/parser/envDiff'
import { getEnvMeta } from '../../utils/parser/envPresets'
import { maskValue } from '../../utils/sensitive'
import { useI18n } from '../../i18n/index.tsx'

interface EnvDiffViewProps {
  envs: Record<EnvName, import('../../types').EnvVariable[]>
  envOrder: EnvName[]
}

type FilterStatus = 'all' | 'different' | 'partial-missing' | 'same'

/** 颜色 -> 圆点类名（静态映射，避免 tailwind purge） */
const DOT_COLOR: Record<string, string> = {
  emerald: 'bg-emerald-500',
  amber: 'bg-amber-500',
  purple: 'bg-purple-500',
  rose: 'bg-rose-500',
  cyan: 'bg-cyan-500',
  blue: 'bg-blue-500',
  teal: 'bg-teal-500',
  indigo: 'bg-indigo-500',
  pink: 'bg-pink-500',
  orange: 'bg-orange-500',
}

/** 环境预设名 -> 字典 key（自定义环境 label 用环境名本身） */
function presetLabelKey(name: string): string | null {
  const map: Record<string, string> = {
    development: 'envPreset.development',
    test: 'envPreset.test',
    staging: 'envPreset.staging',
    production: 'envPreset.production',
  }
  return map[name] ?? null
}

export function EnvDiffView({ envs, envOrder }: EnvDiffViewProps) {
  const { t } = useI18n()
  const [filter, setFilter] = useState<FilterStatus>('all')
  const [search, setSearch] = useState('')
  const [revealAll, setRevealAll] = useState(false)

  const allItems = useMemo(() => diffEnvs(envs, envOrder), [envs, envOrder])
  const summary = useMemo(() => summarizeDiff(allItems), [allItems])

  // 预计算各环境的 key->变量定义索引，避免渲染时嵌套 find（O(rows×envs×vars) → O(1) 查找）
  const envVarMaps = useMemo(() => {
    const maps: Partial<Record<EnvName, Map<string, import('../../types').EnvVariable>>> = {}
    for (const envName of envOrder) {
      const map = new Map<string, import('../../types').EnvVariable>()
      for (const v of envs[envName] ?? []) {
        if (!v.isDisabled) map.set(v.key, v)
      }
      maps[envName] = map
    }
    return maps
  }, [envs, envOrder])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return allItems.filter((item) => {
      if (filter !== 'all' && item.status !== filter) return false
      if (!q) return true
      return item.key.toLowerCase().includes(q)
    })
  }, [allItems, filter, search])

  if (envOrder.length < 2) {
    return (
      <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 text-center text-sm text-slate-400 shadow-sm dark:border-slate-800 dark:bg-slate-900/50">
        {t('envDiff.needTwo')}
      </div>
    )
  }

  const FILTERS: { value: FilterStatus; labelKey: string }[] = [
    { value: 'all', labelKey: 'envDiff.filterAll' },
    { value: 'different', labelKey: 'envDiff.filterDifferent' },
    { value: 'partial-missing', labelKey: 'envDiff.filterPartial' },
    { value: 'same', labelKey: 'envDiff.filterSame' },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* 头部 */}
      <div className="border-b border-slate-200 p-4 dark:border-slate-700">
        <div className="flex items-center justify-between">
          <h3 className="text-sm font-bold text-slate-800 dark:text-slate-100">
            {t('envDiff.title')}
          </h3>
          <div className="flex items-center gap-3 text-xs">
            {summary.different > 0 && (
              <span className="text-amber-600 dark:text-amber-400">
                {t('envDiff.differentCount', { n: summary.different })}
              </span>
            )}
            {summary.partialMissing > 0 && (
              <span className="text-red-600 dark:text-red-400">
                {t('envDiff.missingCount', { n: summary.partialMissing })}
              </span>
            )}
            <span className="text-emerald-600 dark:text-emerald-400">
              {t('envDiff.sameCount', { n: summary.same })}
            </span>
          </div>
        </div>

        {/* 过滤器 */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('envDiff.searchPlaceholder')}
            className="flex-1 min-w-[120px] rounded-lg border border-slate-300 bg-white px-3 py-1.5 text-xs text-slate-800 outline-none focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          />
          {FILTERS.map((f) => {
            const count = { all: summary.total, different: summary.different, 'partial-missing': summary.partialMissing, same: summary.same }[f.value]
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full px-2.5 py-1 text-xs font-medium transition ${
                  filter === f.value
                    ? 'bg-emerald-600 text-white'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
                }`}
              >
                {t(f.labelKey)}（{count}）
              </button>
            )
          })}
          <button
            onClick={() => setRevealAll((v) => !v)}
            className="rounded-lg border border-slate-200 bg-white px-2.5 py-1 text-xs text-slate-600 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-300"
          >
            {revealAll ? t('envDiff.hideSensitive') : t('envDiff.revealSensitive')}
          </button>
        </div>
      </div>

      {/* 对比表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
            <tr>
              <th className="min-w-[140px] px-4 py-3">Key</th>
              {envOrder.map((envName) => {
                const meta = getEnvMeta(envName)
                const label = presetLabelKey(envName) ? t(presetLabelKey(envName)!) : meta.label
                return (
                  <th key={envName} className="min-w-[120px] px-4 py-3">
                    <span className="inline-flex items-center gap-1.5">
                      <span className={`h-1.5 w-1.5 rounded-full ${DOT_COLOR[meta.color] ?? 'bg-slate-500'}`} />
                      {label}
                    </span>
                  </th>
                )
              })}
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={envOrder.length + 1} className="px-4 py-10 text-center text-slate-400">
                  {t('envDiff.noMatch')}
                </td>
              </tr>
            )}
            {filtered.map((item) => {
              const statusColor =
                item.status === 'different'
                  ? 'bg-amber-50/50 dark:bg-amber-900/10'
                  : item.status === 'partial-missing'
                    ? 'bg-red-50/50 dark:bg-red-900/10'
                    : ''
              return (
                <tr key={item.key} className={`transition hover:bg-slate-50 dark:hover:bg-slate-700/30 ${statusColor}`}>
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-100">
                      {item.key}
                    </span>
                    <div className="mt-0.5">
                      {item.status === 'different' && (
                        <span className="text-[10px] text-amber-600 dark:text-amber-400">{t('envDiff.statusDifferent')}</span>
                      )}
                      {item.status === 'partial-missing' && (
                        <span className="text-[10px] text-red-600 dark:text-red-400">
                          {t('envDiff.statusMissing', {
                            list: item.missingIn.map((m) => {
                              const k = presetLabelKey(m)
                              return k ? t(k) : getEnvMeta(m).label
                            }).join('、'),
                          })}
                        </span>
                      )}
                      {item.status === 'same' && (
                        <span className="text-[10px] text-emerald-600 dark:text-emerald-400">{t('envDiff.statusSame')}</span>
                      )}
                    </div>
                  </td>
                  {envOrder.map((envName) => {
                    const val = item.values[envName]
                    const isMissing = val === undefined
                    // 从预计算索引中 O(1) 查找变量定义
                    const varDef = envVarMaps[envName]?.get(item.key)
                    const isSensitive = varDef?.isSensitive ?? false
                    const display = isMissing
                      ? '—'
                      : isSensitive && !revealAll
                        ? maskValue()
                        : val || t('envDiff.emptyValue')
                    return (
                      <td key={envName} className="px-4 py-3">
                        <span
                          className={`font-mono text-xs ${
                            isMissing
                              ? 'text-slate-300 dark:text-slate-600'
                              : isSensitive
                                ? 'text-amber-600 dark:text-amber-300'
                                : 'text-slate-700 dark:text-slate-300'
                          }`}
                        >
                          {display}
                        </span>
                      </td>
                    )
                  })}
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 统计 */}
      <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
        {t('envDiff.footer', { total: summary.total, envs: envOrder.length })}
      </div>
    </div>
  )
}
