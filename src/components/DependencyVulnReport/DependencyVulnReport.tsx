// 漏洞检查报告（v1.4.0）：列出命中已知漏洞的依赖与公告详情
import type { AdvisorySeverity, VulnerabilityInfo } from '../../types'

interface DependencyVulnReportProps {
  results: VulnerabilityInfo[]
}

const SEVERITY_META: Record<AdvisorySeverity, { label: string; cls: string }> = {
  critical: { label: '严重', cls: 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300' },
  high: { label: '高危', cls: 'bg-orange-100 text-orange-700 dark:bg-orange-900/40 dark:text-orange-300' },
  moderate: { label: '中危', cls: 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300' },
  low: { label: '低危', cls: 'bg-slate-200 text-slate-600 dark:bg-slate-700 dark:text-slate-300' },
}

export function DependencyVulnReport({ results }: DependencyVulnReportProps) {
  const total = results.reduce((n, r) => n + r.advisories.length, 0)
  return (
    <div className="rounded-xl border border-red-200 bg-red-50/60 p-4 dark:border-red-900/50 dark:bg-red-900/10">
      <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
        <p className="text-sm font-medium text-red-700 dark:text-red-300">
          检测到 {results.length} 个依赖存在 {total} 条已知漏洞
        </p>
        <p className="text-xs text-red-600/80 dark:text-red-400/80">
          建议升级相关依赖版本后再发布
        </p>
      </div>
      <ul className="max-h-80 space-y-2 overflow-y-auto">
        {results.map((r) => (
          <li key={r.name} className="rounded-lg border border-red-200/70 bg-white p-3 dark:border-red-900/40 dark:bg-slate-800">
            <div className="flex flex-wrap items-center gap-2">
              <span className="font-mono text-sm font-medium text-slate-800 dark:text-slate-100">{r.name}</span>
              <span className="font-mono text-xs text-slate-500 dark:text-slate-400">@{r.version}</span>
              <span className="rounded-full bg-red-100 px-2 py-0.5 text-[10px] font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
                {r.advisories.length} 条
              </span>
            </div>
            <ul className="mt-2 space-y-1.5">
              {r.advisories.map((a) => (
                <li key={a.id} className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`rounded px-1.5 py-0.5 font-medium ${SEVERITY_META[a.severity].cls}`}>
                    {SEVERITY_META[a.severity].label}
                  </span>
                  <span className="font-mono text-slate-500 dark:text-slate-400">{a.id}</span>
                  <span className="text-slate-700 dark:text-slate-300">{a.title}</span>
                  {a.range && (
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 font-mono text-[10px] text-slate-500 dark:bg-slate-700 dark:text-slate-400">
                      影响 {a.range}
                    </span>
                  )}
                  {a.url && (
                    <a
                      href={a.url}
                      target="_blank"
                      rel="noreferrer noopener"
                      className="text-blue-600 underline hover:text-blue-700 dark:text-blue-400"
                    >
                      详情 ↗
                    </a>
                  )}
                </li>
              ))}
            </ul>
          </li>
        ))}
      </ul>
    </div>
  )
}
