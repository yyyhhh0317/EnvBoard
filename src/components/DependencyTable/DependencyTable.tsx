// 依赖列表表格：搜索、分类过滤、版本查询、漏洞检查、依赖图、编辑、删除
import { useMemo, useState } from 'react'
import type { Dependency, DepGraphNode, ProjectType, RegistryType, VulnerabilityInfo } from '../../types'
import { fetchLatestVersions } from '../../utils/registry/versionCheck'
import { checkVulnerabilities } from '../../utils/registry/vulnerabilityCheck'
import { copyToClipboard } from '../../utils/formatter/exporter'
import { DependencyGraph } from '../DependencyGraph/DependencyGraph'
import { DependencyVulnReport } from '../DependencyVulnReport/DependencyVulnReport'
import { useI18n } from '../../i18n/index.tsx'

interface DependencyTableProps {
  dependencies: Dependency[]
  projectType: ProjectType
  meta: Record<string, string>
  /** 依赖树（package-lock.json v3 解析可得，v1.4.0） */
  graph?: DepGraphNode | null
  onEdit: (dep: Dependency) => void
  onAdd: () => void
  onDelete: (id: string) => void
}

const CATEGORY_KEY: Record<string, string> = {
  dependencies: 'depEditor.categoryDeps',
  devDependencies: 'depEditor.categoryDev',
  peerDependencies: 'depEditor.categoryPeer',
  optionalDependencies: 'depEditor.categoryOptional',
  optional: 'depEditor.categoryOptionalExt',
  scripts: 'depEditor.categoryScripts',
  engines: 'depEditor.categoryEngines',
  metadata: 'depTable.categoryMetadata',
}

export function DependencyTable({
  dependencies,
  projectType,
  meta,
  graph,
  onEdit,
  onAdd,
  onDelete,
}: DependencyTableProps) {
  const { t } = useI18n()
  const [search, setSearch] = useState('')
  const [activeCategory, setActiveCategory] = useState<string>('all')
  const [activeSubgroup, setActiveSubgroup] = useState<string>('all')
  const [checking, setChecking] = useState(false)
  const [progress, setProgress] = useState({ done: 0, total: 0 })
  const [versionEnabled, setVersionEnabled] = useState(false)
  // 漏洞检查（v1.4.0）
  const [vulnEnabled, setVulnEnabled] = useState(false)
  const [checkingVuln, setCheckingVuln] = useState(false)
  const [vulnResults, setVulnResults] = useState<VulnerabilityInfo[]>([])
  // 依赖图（v1.4.0）
  const [graphOpen, setGraphOpen] = useState(false)
  const [deps, setDeps] = useState<Dependency[]>(dependencies)
  const [copiedId, setCopiedId] = useState<string | null>(null)

  // 当外部 dependencies 变化时同步
  useMemo(() => setDeps(dependencies), [dependencies])

  const registryType: RegistryType | null =
    projectType === 'npm' || projectType === 'lockfile' ? 'npm' : projectType === 'pip' || projectType === 'poetry' ? 'pypi' : null

  const categories = useMemo(() => {
    const set = new Set(deps.map((d) => d.category))
    return ['all', ...Array.from(set)]
  }, [deps])

  // 当前分类下的子分组列表
  const subgroups = useMemo(() => {
    const scoped = activeCategory === 'all' ? deps : deps.filter((d) => d.category === activeCategory)
    const set = new Set(scoped.map((d) => d.subgroup).filter(Boolean) as string[])
    return Array.from(set)
  }, [deps, activeCategory])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return deps.filter((d) => {
      if (activeCategory !== 'all' && d.category !== activeCategory) return false
      if (activeSubgroup !== 'all' && d.subgroup !== activeSubgroup) return false
      if (!q) return true
      return d.name.toLowerCase().includes(q) || d.versionSpec.toLowerCase().includes(q)
    })
  }, [deps, search, activeCategory, activeSubgroup])

  // 切换分类时重置子分组选择
  const handleCategoryChange = (cat: string) => {
    setActiveCategory(cat)
    setActiveSubgroup('all')
  }

  const outdatedCount = deps.filter((d) => d.isOutdated).length

  const handleCheckVersions = async () => {
    if (!registryType || checking) return
    setChecking(true)
    setProgress({ done: 0, total: 0 })
    try {
      const updated = await fetchLatestVersions(deps, registryType, (done, total) =>
        setProgress({ done, total }),
      )
      setDeps(updated)
    } finally {
      setChecking(false)
    }
  }

  // 漏洞检查（v1.4.0）：opt-in，发送包名+版本到 npm audit / OSV
  const handleCheckVulnerabilities = async () => {
    if (!registryType || checkingVuln) return
    setCheckingVuln(true)
    setProgress({ done: 0, total: 0 })
    try {
      const { vulnerable } = await checkVulnerabilities(deps, registryType, (done, total) =>
        setProgress({ done, total }),
      )
      setVulnResults(vulnerable)
    } finally {
      setCheckingVuln(false)
    }
  }

  const vulnCount = vulnResults.reduce((n, r) => n + r.advisories.length, 0)

  const handleCopy = async (d: Dependency) => {
    const text = d.isScript ? d.versionSpec : `${d.name}@${d.lockedVersion ?? d.versionSpec}`
    const ok = await copyToClipboard(text)
    if (ok) {
      setCopiedId(d.id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }

  return (
    <div className="overflow-hidden rounded-2xl border border-slate-200 bg-white/80 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 p-4 dark:border-slate-700/80">
        <div className="relative flex-1 min-w-[180px]">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder={t('depTable.searchPlaceholder')}
            aria-label={t('depTable.searchPlaceholder')}
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        {registryType && (
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400" title={t('depTable.optVersionTitle')}>
            <input
              type="checkbox"
              checked={versionEnabled}
              onChange={(e) => setVersionEnabled(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
            />
            {t('depTable.optVersion')}
          </label>
        )}

        {versionEnabled && registryType && (
          <button
            onClick={handleCheckVersions}
            disabled={checking}
            className="rounded-lg border border-blue-200 bg-blue-50 px-3 py-2 text-sm font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50 dark:border-blue-800 dark:bg-blue-900/30 dark:text-blue-300"
          >
            {checking
              ? t('depTable.checking', { done: progress.done, total: progress.total })
              : outdatedCount > 0
                ? t('depTable.outdatedCount', { n: outdatedCount })
                : t('depTable.checkUpdate')}
          </button>
        )}

        {/* 漏洞检查（v1.4.0） */}
        {registryType && (
          <label className="flex items-center gap-1.5 text-xs text-slate-600 dark:text-slate-400" title={t('depTable.optVulnTitle')}>
            <input
              type="checkbox"
              checked={vulnEnabled}
              onChange={(e) => setVulnEnabled(e.target.checked)}
              className="h-3.5 w-3.5 rounded border-slate-300 text-red-600 focus:ring-red-500"
            />
            {t('depTable.optVuln')}
          </label>
        )}

        {vulnEnabled && registryType && (
          <button
            onClick={handleCheckVulnerabilities}
            disabled={checkingVuln}
            className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm font-medium text-red-700 transition hover:bg-red-100 disabled:opacity-50 dark:border-red-800 dark:bg-red-900/30 dark:text-red-300"
          >
            {checkingVuln
              ? t('depTable.checking', { done: progress.done, total: progress.total })
              : vulnCount > 0
                ? t('depTable.checkVulnCount', { n: vulnCount })
                : t('depTable.checkVuln')}
          </button>
        )}

        {/* 依赖图（v1.4.0）：package-lock.json 可构建 */}
        {graph && (
          <button
            onClick={() => setGraphOpen((v) => !v)}
            aria-expanded={graphOpen}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              graphOpen
                ? 'border-teal-400 bg-teal-50 text-teal-700 dark:border-teal-600 dark:bg-teal-900/30 dark:text-teal-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
          >
            {t('depTable.graph')}
          </button>
        )}

        <button
          onClick={onAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t('depTable.add')}
        </button>
      </div>

      {(versionEnabled || vulnEnabled) && (
        <div className="flex items-center gap-2 border-b border-amber-200/80 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-700 dark:border-amber-800/60 dark:bg-amber-950/30 dark:text-amber-300">
          <svg className="h-4 w-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {t('depTable.privacyBanner', {
            registry: registryType === 'npm' ? 'npm registry / npm audit' : 'PyPI / Google OSV',
          })}
        </div>
      )}

      {/* 分类标签 */}
      {categories.length > 2 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/80 px-4 py-2.5 dark:border-slate-700/80">
          {categories.map((cat) => (
            <button
              key={cat}
              onClick={() => handleCategoryChange(cat)}
              className={`rounded-full px-3 py-1 text-xs font-medium transition ${
                activeCategory === cat
                  ? 'bg-emerald-600 text-white'
                  : 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-300 dark:hover:bg-slate-600'
              }`}
            >
              {cat === 'all' ? t('depTable.catAll') : t(CATEGORY_KEY[cat] ?? cat)}
            </button>
          ))}
        </div>
      )}

      {/* 子分组标签 */}
      {subgroups.length > 0 && (
        <div className="flex flex-wrap items-center gap-2 border-b border-slate-200/60 px-4 py-2 dark:border-slate-700/60">
          <span className="text-xs text-slate-400">{t('depTable.groups')}：</span>
          <button
            onClick={() => setActiveSubgroup('all')}
            className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
              activeSubgroup === 'all'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
            }`}
          >
            {t('common.all')}
          </button>
          {subgroups.map((sg) => (
            <button
              key={sg}
              onClick={() => setActiveSubgroup(sg)}
              className={`rounded-full px-2.5 py-0.5 text-xs font-medium transition ${
                activeSubgroup === sg
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-100 text-slate-500 hover:bg-slate-200 dark:bg-slate-700 dark:text-slate-400 dark:hover:bg-slate-600'
              }`}
            >
              {sg}
            </button>
          ))}
        </div>
      )}

      {/* 元数据 */}
      {Object.keys(meta).length > 0 && (
        <div className="flex flex-wrap gap-2 border-b border-slate-200 px-4 py-2 text-xs dark:border-slate-700">
          {Object.entries(meta).map(([k, v]) => (
            <span key={k} className="rounded bg-slate-100 px-2 py-0.5 text-slate-600 dark:bg-slate-700 dark:text-slate-300">
              <span className="text-slate-400">{k}:</span> {v}
            </span>
          ))}
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50/80 text-xs font-semibold uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
            <tr>
              <th className="min-w-[160px] px-4 py-3">{t('depTable.colName')}</th>
              <th className="px-4 py-3">{t('depTable.colVersion')}</th>
              {deps.some((d) => d.lockedVersion) && <th className="px-4 py-3">{t('depTable.colLocked')}</th>}
              {versionEnabled && <th className="px-4 py-3">{t('depTable.colLatest')}</th>}
              <th className="hidden px-4 py-3 md:table-cell">{t('depTable.colCategory')}</th>
              {subgroups.length > 0 && <th className="hidden px-4 py-3 lg:table-cell">{t('depTable.colGroup')}</th>}
              <th className="w-32 px-4 py-3 text-right">{t('depTable.colActions')}</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {deps.length === 0 ? t('depTable.noDeps') : t('depTable.noMatch')}
                </td>
              </tr>
            )}
            {filtered.map((d) => (
              <tr key={d.id} className={`transition hover:bg-slate-50 dark:hover:bg-slate-700/30 ${d.isOutdated ? 'bg-amber-50/50 dark:bg-amber-900/10' : ''}`}>
                <td className="px-4 py-3">
                  <span className="font-mono font-medium text-slate-800 dark:text-slate-100">
                    {d.isScript ? (
                      <span className="text-purple-600 dark:text-purple-400">$ {d.name}</span>
                    ) : (
                      d.name
                    )}
                  </span>
                  {d.comment && (
                    <div className="mt-0.5 text-xs text-slate-400">{d.comment}</div>
                  )}
                </td>
                <td className="px-4 py-3">
                  <span className={`font-mono ${d.isScript ? 'text-purple-600 dark:text-purple-400' : 'text-slate-600 dark:text-slate-300'}`}>
                    {d.isScript ? d.versionSpec : (d.versionSpec || <span className="text-slate-300 dark:text-slate-600">—</span>)}
                  </span>
                </td>
                {deps.some((x) => x.lockedVersion) && (
                  <td className="px-4 py-3 font-mono text-slate-600 dark:text-slate-300">
                    {d.lockedVersion ?? <span className="text-slate-300 dark:text-slate-600">—</span>}
                  </td>
                )}
                {versionEnabled && (
                  <td className="px-4 py-3 font-mono">
                    {d.latestVersion ? (
                      <span className={d.isOutdated ? 'font-medium text-amber-600 dark:text-amber-400' : 'text-emerald-600 dark:text-emerald-400'}>
                        {d.latestVersion}
                        {d.isOutdated && ' ↑'}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                )}
                <td className="hidden px-4 py-3 md:table-cell">
                  <span className="rounded-full bg-slate-100 px-2 py-0.5 text-xs text-slate-600 dark:bg-slate-700 dark:text-slate-300">
                    {t(CATEGORY_KEY[d.category] ?? d.category)}
                  </span>
                </td>
                {subgroups.length > 0 && (
                  <td className="hidden px-4 py-3 lg:table-cell">
                    {d.subgroup ? (
                      <span className="rounded-full bg-teal-50 px-2 py-0.5 text-xs text-teal-600 dark:bg-teal-900/30 dark:text-teal-300">
                        {d.subgroup}
                      </span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>
                )}
                <td className="px-4 py-3">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() => handleCopy(d)}
                      title={t('depTable.copySpec')}
                      aria-label={t('depTable.copySpec')}
                      className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                    >
                      {copiedId === d.id ? (
                        <svg className="h-4 w-4 text-emerald-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      ) : (
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                        </svg>
                      )}
                    </button>
                    <button
                      onClick={() => onEdit(d)}
                      title={t('depTable.edit')}
                      aria-label={t('depTable.edit')}
                      className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                      </svg>
                    </button>
                    <button
                      onClick={() => onDelete(d.id)}
                      title={t('depTable.delete')}
                      aria-label={t('depTable.delete')}
                      className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                    >
                      <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* 依赖图（v1.4.0） */}
      {graphOpen && graph && (
        <div className="border-t border-slate-200/80 p-4 dark:border-slate-700/80">
          <DependencyGraph graph={graph} />
        </div>
      )}

      {/* 漏洞报告（v1.4.0） */}
      {vulnResults.length > 0 && (
        <div className="border-t border-slate-200/80 p-4 dark:border-slate-700/80">
          <DependencyVulnReport results={vulnResults} />
        </div>
      )}

      <div className="border-t border-slate-200/80 px-4 py-3 text-xs text-slate-500 dark:border-slate-700/80 dark:text-slate-400">
        {t('depTable.footer', { total: deps.length, shown: filtered.length })}
        {outdatedCount > 0 && <span className="text-amber-600 dark:text-amber-400"> · {t('depTable.outdatedCount', { n: outdatedCount })}</span>}
        {vulnCount > 0 && <span className="text-red-600 dark:text-red-400"> · {t('depTable.vulnTotal', { n: vulnCount })}</span>}
      </div>
    </div>
  )
}
