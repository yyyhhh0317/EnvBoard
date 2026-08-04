// 变量列表表格：搜索、脱敏、增删改、复制、校验提示
import { useMemo, useState } from 'react'
import type { EnvVariable, ValidationIssue } from '../../types'
import { maskValue } from '../../utils/sensitive'
import { copyToClipboard } from '../../utils/formatter/exporter'
import { countIssues, groupIssuesByVariable } from '../../utils/validator'
import {
  previewReplace,
  applyReplace,
  countAffectedVariables,
  type ReplaceableField,
} from '../../utils/searchReplace'

interface EnvTableProps {
  variables: EnvVariable[]
  issues: ValidationIssue[]
  hasTemplate: boolean
  onEdit: (variable: EnvVariable) => void
  onAdd: () => void
  onDelete: (id: string) => void
  onToggleSensitive: (id: string) => void
  onOpenTemplate: () => void
  /** 搜索替换回调：传入替换后的新变量列表 */
  onReplace?: (next: EnvVariable[]) => void
}

export function EnvTable({
  variables,
  issues,
  hasTemplate,
  onEdit,
  onAdd,
  onDelete,
  onToggleSensitive,
  onOpenTemplate,
  onReplace,
}: EnvTableProps) {
  const [search, setSearch] = useState('')
  const [revealAll, setRevealAll] = useState(false)
  const [revealedIds, setRevealedIds] = useState<Set<string>>(new Set())
  const [copiedId, setCopiedId] = useState<string | null>(null)
  const [showOnlyIssues, setShowOnlyIssues] = useState(false)

  // 搜索替换面板状态
  const [replaceOpen, setReplaceOpen] = useState(false)
  const [replaceSearch, setReplaceSearch] = useState('')
  const [replaceReplacement, setReplaceReplacement] = useState('')
  const [caseSensitive, setCaseSensitive] = useState(false)
  const [replaceFields, setReplaceFields] = useState<ReplaceableField[]>(['value'])

  const replaceMatches = useMemo(() => {
    if (!replaceOpen) return []
    return previewReplace(variables, {
      search: replaceSearch,
      replacement: replaceReplacement,
      caseSensitive,
      fields: replaceFields,
    })
  }, [replaceOpen, variables, replaceSearch, replaceReplacement, caseSensitive, replaceFields])

  const issuesByVar = useMemo(() => groupIssuesByVariable(issues), [issues])
  const { errors: errorCount, warnings: warningCount } = useMemo(() => countIssues(issues), [issues])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    return variables.filter((v) => {
      if (showOnlyIssues && !issuesByVar.has(v.id)) return false
      if (!q) return true
      return v.key.toLowerCase().includes(q) || v.value.toLowerCase().includes(q)
    })
  }, [variables, search, showOnlyIssues, issuesByVar])

  const toggleReveal = (id: string) => {
    setRevealedIds((prev) => {
      const next = new Set(prev)
      if (next.has(id)) next.delete(id)
      else next.add(id)
      return next
    })
  }

  const handleCopy = async (v: EnvVariable) => {
    const ok = await copyToClipboard(`${v.key}=${v.value}`)
    if (ok) {
      setCopiedId(v.id)
      setTimeout(() => setCopiedId(null), 1500)
    }
  }

  const displayValue = (v: EnvVariable): string => {
    if (v.isSensitive && !revealAll && !revealedIds.has(v.id)) {
      return maskValue()
    }
    return v.value
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white shadow-sm dark:border-slate-700 dark:bg-slate-800">
      {/* 工具栏 */}
      <div className="flex flex-wrap items-center gap-3 border-b border-slate-200 p-4 dark:border-slate-700">
        <div className="relative flex-1 min-w-[200px]">
          <svg className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <input
            type="text"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="搜索变量名或值…"
            className="w-full rounded-lg border border-slate-300 bg-white py-2 pl-9 pr-3 text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
          />
        </div>

        {issues.length > 0 && (
          <button
            onClick={() => setShowOnlyIssues((v) => !v)}
            className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
              showOnlyIssues
                ? 'border-amber-400 bg-amber-50 text-amber-700 dark:border-amber-600 dark:bg-amber-900/30 dark:text-amber-300'
                : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
            }`}
            title="只看有校验问题的变量"
          >
            仅看问题（{issues.length}）
          </button>
        )}

        <button
          onClick={() => setRevealAll((v) => !v)}
          className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          title="显示/隐藏所有敏感值"
        >
          {revealAll ? '隐藏敏感值' : '显示敏感值'}
        </button>

        <button
          onClick={onOpenTemplate}
          className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-2 text-sm font-medium text-purple-700 transition hover:bg-purple-100 dark:border-purple-800 dark:bg-purple-900/30 dark:text-purple-300"
          title="配置模板"
        >
          <span className="flex items-center gap-1.5">
            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            模板
            {hasTemplate && <span className="h-1.5 w-1.5 rounded-full bg-purple-500" />}
          </span>
        </button>

        <button
          onClick={() => setReplaceOpen((v) => !v)}
          className={`rounded-lg border px-3 py-2 text-sm font-medium transition ${
            replaceOpen
              ? 'border-blue-400 bg-blue-50 text-blue-700 dark:border-blue-600 dark:bg-blue-900/30 dark:text-blue-300'
              : 'border-slate-200 bg-white text-slate-700 hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600'
          }`}
          title="搜索并替换变量名、值或注释"
        >
          搜索替换
        </button>

        <button
          onClick={onAdd}
          className="rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          + 添加变量
        </button>

        {/* 搜索替换面板 */}
        {replaceOpen && (
          <div className="w-full rounded-lg border border-blue-200 bg-blue-50/50 p-4 dark:border-blue-800 dark:bg-blue-900/20">
            <div className="grid gap-3 md:grid-cols-2">
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">查找</label>
                <input
                  type="text"
                  value={replaceSearch}
                  onChange={(e) => setReplaceSearch(e.target.value)}
                  placeholder="输入要查找的文本…"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
              <div>
                <label className="block text-xs font-medium text-slate-600 dark:text-slate-300">替换为</label>
                <input
                  type="text"
                  value={replaceReplacement}
                  onChange={(e) => setReplaceReplacement(e.target.value)}
                  placeholder="输入替换文本…"
                  className="mt-1 w-full rounded-lg border border-slate-300 bg-white px-3 py-2 text-sm text-slate-800 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200"
                />
              </div>
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-4">
              {/* 字段选择 */}
              <div className="flex items-center gap-3 text-xs">
                <span className="text-slate-500 dark:text-slate-400">替换字段：</span>
                {(['key', 'value', 'comment'] as ReplaceableField[]).map((f) => {
                  const checked = replaceFields.includes(f)
                  const label = f === 'key' ? '变量名' : f === 'value' ? '变量值' : '注释'
                  return (
                    <label key={f} className="flex items-center gap-1 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={checked}
                        onChange={(e) => {
                          setReplaceFields((prev) =>
                            e.target.checked ? [...prev, f] : prev.filter((x) => x !== f),
                          )
                        }}
                        className="rounded"
                      />
                      <span className="text-slate-600 dark:text-slate-300">{label}</span>
                    </label>
                  )
                })}
              </div>

              {/* 区分大小写 */}
              <label className="flex items-center gap-1 cursor-pointer text-xs">
                <input
                  type="checkbox"
                  checked={caseSensitive}
                  onChange={(e) => setCaseSensitive(e.target.checked)}
                  className="rounded"
                />
                <span className="text-slate-600 dark:text-slate-300">区分大小写</span>
              </label>

              {/* 匹配统计 */}
              {replaceSearch && (
                <span className="text-xs text-blue-700 dark:text-blue-300">
                  {replaceMatches.length} 处匹配 · {countAffectedVariables(replaceMatches)} 个变量
                </span>
              )}

              {/* 执行替换 */}
              <button
                onClick={() => {
                  if (!replaceSearch || replaceFields.length === 0 || !onReplace) return
                  const next = applyReplace(variables, {
                    search: replaceSearch,
                    replacement: replaceReplacement,
                    caseSensitive,
                    fields: replaceFields,
                  })
                  onReplace(next)
                }}
                disabled={!replaceSearch || replaceFields.length === 0 || replaceMatches.length === 0 || !onReplace}
                className="ml-auto rounded-lg bg-blue-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-blue-700 disabled:cursor-not-allowed disabled:opacity-50"
              >
                替换全部（{replaceMatches.length}）
              </button>
            </div>

            {/* 匹配预览 */}
            {replaceMatches.length > 0 && (
              <div className="mt-3 max-h-48 overflow-y-auto rounded-lg border border-slate-200 bg-white dark:border-slate-700 dark:bg-slate-900">
                <table className="w-full text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-3 py-1.5 text-left font-medium">变量</th>
                      <th className="px-3 py-1.5 text-left font-medium">字段</th>
                      <th className="px-3 py-1.5 text-left font-medium">原值</th>
                      <th className="px-3 py-1.5 text-left font-medium">替换后</th>
                    </tr>
                  </thead>
                  <tbody>
                    {replaceMatches.slice(0, 50).map((m) => (
                      <tr key={`${m.variableId}-${m.field}`} className="border-t border-slate-100 dark:border-slate-800">
                        <td className="px-3 py-1.5 font-mono text-slate-700 dark:text-slate-300">{m.key}</td>
                        <td className="px-3 py-1.5 text-slate-500 dark:text-slate-400">
                          {m.field === 'key' ? '变量名' : m.field === 'value' ? '变量值' : '注释'}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-rose-600 dark:text-rose-400 line-through opacity-70">
                          {m.before || '(空)'}
                        </td>
                        <td className="px-3 py-1.5 font-mono text-emerald-600 dark:text-emerald-400">
                          {m.after || '(空)'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
                {replaceMatches.length > 50 && (
                  <div className="border-t border-slate-100 px-3 py-1.5 text-center text-xs text-slate-400 dark:border-slate-800">
                    还有 {replaceMatches.length - 50} 处匹配未显示
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>

      {/* 校验汇总条 */}
      {issues.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 border-b border-slate-200/80 px-4 py-2.5 text-xs dark:border-slate-700/80">
          {errorCount > 0 && (
            <span className="flex items-center gap-1 text-red-600 dark:text-red-400">
              <span className="h-1.5 w-1.5 rounded-full bg-red-500" />
              {errorCount} 个错误
            </span>
          )}
          {warningCount > 0 && (
            <span className="flex items-center gap-1 text-amber-600 dark:text-amber-400">
              <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />
              {warningCount} 个警告
            </span>
          )}
          <span className="text-slate-400">校验基于模板期望类型、命名规范与重复 key</span>
        </div>
      )}

      {/* 表格 */}
      <div className="overflow-x-auto">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-xs uppercase tracking-wide text-slate-500 dark:bg-slate-900/50 dark:text-slate-400">
            <tr>
              <th className="w-16 px-4 py-3">状态</th>
              <th className="min-w-[160px] px-4 py-3">Key</th>
              <th className="px-4 py-3">Value</th>
              <th className="hidden w-48 px-4 py-3 md:table-cell">注释</th>
              <th className="w-24 px-4 py-3 text-center">校验</th>
              <th className="w-40 px-4 py-3 text-right">操作</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
            {filtered.length === 0 && (
              <tr>
                <td colSpan={6} className="px-4 py-10 text-center text-slate-400">
                  {variables.length === 0 ? '暂无变量，请先导入或添加' : '没有匹配的变量'}
                </td>
              </tr>
            )}

            {filtered.map((v) => {
              const revealed = revealAll || revealedIds.has(v.id)
              const varIssues = issuesByVar.get(v.id) ?? []
              const hasError = varIssues.some((i) => i.severity === 'error')
              return (
                <tr
                  key={v.id}
                  className={`transition hover:bg-slate-50 dark:hover:bg-slate-700/30 ${
                    v.isDisabled ? 'opacity-60' : ''
                  } ${v.error || hasError ? 'bg-red-50/50 dark:bg-red-900/10' : ''}`}
                >
                  {/* 状态 */}
                  <td className="px-4 py-3">
                    <div className="flex flex-col gap-1">
                      {v.isSensitive && (
                        <span title="敏感变量" className="inline-flex h-5 w-5 items-center justify-center rounded bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300">
                          <svg className="h-3 w-3" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                      {v.isDisabled && (
                        <span title="已注释/禁用" className="inline-flex h-5 w-5 items-center justify-center rounded bg-slate-200 text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                          <svg className="h-3 w-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                            <path strokeLinecap="round" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728L5.636 5.636m12.728 12.728A9 9 0 015.636 5.636" />
                          </svg>
                        </span>
                      )}
                      {v.isNew && !v.isModified && (
                        <span title="新增" className="rounded bg-emerald-100 px-1 text-[10px] font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">新</span>
                      )}
                    </div>
                  </td>

                  {/* Key */}
                  <td className="px-4 py-3">
                    <span className="font-mono font-medium text-slate-800 dark:text-slate-100">
                      {v.key || <span className="text-slate-400">（空）</span>}
                    </span>
                    {v.error && (
                      <div className="mt-0.5 text-xs text-red-500">{v.error}</div>
                    )}
                  </td>

                  {/* Value */}
                  <td className="px-4 py-3">
                    <span
                      className={`font-mono ${
                        v.isSensitive
                          ? revealed
                            ? 'text-amber-600 dark:text-amber-300'
                            : 'text-slate-400'
                          : 'text-slate-700 dark:text-slate-300'
                      }`}
                    >
                      {displayValue(v) || <span className="text-slate-400 italic">（空值）</span>}
                    </span>
                  </td>

                  {/* 注释 */}
                  <td className="hidden px-4 py-3 text-slate-500 dark:text-slate-400 md:table-cell">
                    {v.comment ? (
                      <span className="line-clamp-1">{v.comment}</span>
                    ) : (
                      <span className="text-slate-300 dark:text-slate-600">—</span>
                    )}
                  </td>

                  {/* 校验 */}
                  <td className="px-4 py-3 text-center">
                    {varIssues.length > 0 ? (
                      <div className="group relative inline-flex">
                        <span
                          className={`inline-flex h-5 min-w-[20px] items-center justify-center rounded-full px-1.5 text-[10px] font-bold ${
                            hasError
                              ? 'bg-red-100 text-red-600 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-600 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {varIssues.length}
                        </span>
                        {/* 悬浮提示 */}
                        <div className="invisible absolute right-0 top-6 z-10 w-56 rounded-lg border border-slate-200 bg-white p-2 text-left text-xs shadow-lg group-hover:visible dark:border-slate-700 dark:bg-slate-800">
                          {varIssues.map((issue, idx) => (
                            <div
                              key={idx}
                              className={`flex items-start gap-1.5 py-0.5 ${
                                issue.severity === 'error' ? 'text-red-600 dark:text-red-400' : 'text-amber-600 dark:text-amber-400'
                              }`}
                            >
                              <span className="mt-0.5">
                                {issue.severity === 'error' ? '✕' : '⚠'}
                              </span>
                              <span>{issue.message}</span>
                            </div>
                          ))}
                        </div>
                      </div>
                    ) : (
                      <span className="text-emerald-500" title="通过校验">
                        <svg className="mx-auto h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                        </svg>
                      </span>
                    )}
                  </td>

                  {/* 操作 */}
                  <td className="px-4 py-3">
                    <div className="flex items-center justify-end gap-1">
                      {v.isSensitive && (
                        <button
                          onClick={() => toggleReveal(v.id)}
                          title={revealed ? '隐藏' : '显示'}
                          className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                        >
                          {revealed ? (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M13.875 18.825A10.05 10.05 0 0112 19c-4.478 0-8.268-2.943-9.543-7a9.97 9.97 0 011.563-3.029m5.858.908a3 3 0 114.243 4.243M9.878 9.878l4.242 4.242M9.88 9.88l-3.29-3.29m7.532 7.532l3.29 3.29M3 3l3.59 3.59m0 0A9.953 9.953 0 0112 5c4.478 0 8.268 2.943 9.543 7a10.025 10.025 0 01-4.132 5.411m0 0L21 21" />
                            </svg>
                          ) : (
                            <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                              <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                              <path strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
                            </svg>
                          )}
                        </button>
                      )}

                      <button
                        onClick={() => handleCopy(v)}
                        title="复制"
                        className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-slate-200"
                      >
                        {copiedId === v.id ? (
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
                        onClick={() => onToggleSensitive(v.id)}
                        title={v.isSensitive ? '取消敏感标记' : '标记为敏感'}
                        className={`rounded p-1.5 transition hover:bg-slate-100 dark:hover:bg-slate-700 ${
                          v.isSensitive ? 'text-amber-500' : 'text-slate-500 dark:text-slate-400'
                        }`}
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => onEdit(v)}
                        title="编辑"
                        className="rounded p-1.5 text-slate-500 transition hover:bg-slate-100 hover:text-emerald-600 dark:text-slate-400 dark:hover:bg-slate-700 dark:hover:text-emerald-400"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>

                      <button
                        onClick={() => onDelete(v.id)}
                        title="删除"
                        className="rounded p-1.5 text-slate-500 transition hover:bg-red-50 hover:text-red-600 dark:text-slate-400 dark:hover:bg-red-900/30 dark:hover:text-red-400"
                      >
                        <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                          <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              )
            })}
          </tbody>
        </table>
      </div>

      {/* 统计 */}
      <div className="border-t border-slate-200 px-4 py-3 text-xs text-slate-500 dark:border-slate-700 dark:text-slate-400">
        共 {variables.length} 个变量 · 显示 {filtered.length} 个
        {variables.some((v) => v.isSensitive) && (
          <span> · {variables.filter((v) => v.isSensitive).length} 个敏感</span>
        )}
        {issues.length > 0 && (
          <span>
            {' '}· <span className="text-red-500">{errorCount} 错误</span> / <span className="text-amber-500">{warningCount} 警告</span>
          </span>
        )}
        {hasTemplate && <span> · 已应用模板</span>}
      </div>
    </div>
  )
}
