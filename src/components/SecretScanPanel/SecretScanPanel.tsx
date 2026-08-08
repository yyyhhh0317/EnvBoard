// 密钥泄露检测面板（v1.2.0）
// 基于值格式特征扫描变量，发现疑似泄露的密钥；支持单条清除与一键全部清除
import { useEffect, useMemo, useState } from 'react'
import type { EnvVariable } from '../../types'
import { maskSecret, scanSecrets } from '../../utils/secretScan'
import { useI18n } from '../../i18n/index.tsx'

interface SecretScanPanelProps {
  variables: EnvVariable[]
  /** 清除单个变量的值 */
  onClear: (id: string) => void
  /** 批量清除（传入命中变量的 id 列表） */
  onClearAll: (ids: string[]) => void
}

export function SecretScanPanel({ variables, onClear, onClearAll }: SecretScanPanelProps) {
  const { t } = useI18n()
  const [open, setOpen] = useState(false)
  const scan = useMemo(() => scanSecrets(variables), [variables])
  const hasSecrets = scan.total > 0
  const hitIds = useMemo(() => scan.items.map((i) => i.id), [scan])

  // 检测到泄露时自动展开
  useEffect(() => {
    if (hasSecrets) setOpen(true)
  }, [hasSecrets])

  return (
    <section
      className={`rounded-2xl border bg-white shadow-sm dark:bg-slate-800 ${
        hasSecrets
          ? 'border-red-200 dark:border-red-900/60'
          : 'border-slate-200 dark:border-slate-700'
      }`}
      aria-label={t('secretScan.ariaLabel')}
    >
      <button
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        className="flex w-full items-center justify-between gap-3 p-4 text-left"
      >
        <span className="flex items-center gap-2 text-sm font-medium text-slate-800 dark:text-slate-100">
          <svg className="h-4 w-4 text-red-500" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
          </svg>
          {t('secretScan.title')}
          {hasSecrets ? (
            <span className="rounded-full bg-red-100 px-2 py-0.5 text-xs font-bold text-red-700 dark:bg-red-900/40 dark:text-red-300">
              {t('secretScan.leaked', { n: scan.total })}
            </span>
          ) : (
            <span className="rounded-full bg-emerald-100 px-2 py-0.5 text-xs font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
              {t('secretScan.clean')}
            </span>
          )}
        </span>
        <svg
          className={`h-4 w-4 text-slate-400 transition-transform ${open ? 'rotate-180' : ''}`}
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
          aria-hidden="true"
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
        </svg>
      </button>

      {open && (
        <div className="border-t border-slate-200 p-4 dark:border-slate-700">
          {!hasSecrets ? (
            <p className="text-sm text-slate-500 dark:text-slate-400">
              {t('secretScan.emptyDesc')}
            </p>
          ) : (
            <>
              <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
                <p className="text-xs text-red-600 dark:text-red-400">
                  {t('secretScan.warning')}
                </p>
                <button
                  onClick={() => onClearAll(hitIds)}
                  disabled={hitIds.length === 0}
                  className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  {t('secretScan.clearAll', { n: hitIds.length })}
                </button>
              </div>
              <ul className="max-h-72 space-y-2 overflow-y-auto">
                {scan.items.map((item) => (
                  <li
                    key={item.id}
                    className="flex flex-wrap items-center gap-2 rounded-lg border border-slate-200 bg-slate-50/60 px-3 py-2 dark:border-slate-700 dark:bg-slate-900/40"
                  >
                    <span className="font-mono text-xs font-medium text-slate-800 dark:text-slate-100">
                      {item.key}
                    </span>
                    <span className="font-mono text-xs text-slate-500 dark:text-slate-400">
                      {maskSecret(item.matches[0]?.matched ?? item.value)}
                    </span>
                    <div className="flex flex-wrap items-center gap-1">
                      {item.matches.map((m, i) => (
                        <span
                          key={i}
                          className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${
                            m.severity === 'high'
                              ? 'bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300'
                              : 'bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300'
                          }`}
                        >
                          {m.label}
                        </span>
                      ))}
                    </div>
                    <button
                      onClick={() => onClear(item.id)}
                      className="ml-auto rounded-lg border border-red-200 px-2.5 py-1 text-xs text-red-600 transition hover:bg-red-50 dark:border-red-800 dark:text-red-400 dark:hover:bg-red-900/30"
                    >
                      {t('secretScan.clearValue')}
                    </button>
                  </li>
                ))}
              </ul>
            </>
          )}
        </div>
      )}
    </section>
  )
}
