// 多环境导出：单文件（带 @env 分段）或多文件下载（含密钥脱敏确认 v1.2.0）
import { useEffect, useMemo, useState } from 'react'
import type { EnvName, EnvVariable } from '../../types'
import {
  downloadFile,
  exportMultiEnvAsFiles,
  exportMultiEnvAsSingle,
} from '../../utils/formatter/multiEnvExporter'
import { redactSecrets, scanSecrets } from '../../utils/secretScan'
import { ExportSecretWarning } from '../ExportSecretWarning/ExportSecretWarning'
import { useI18n } from '../../i18n/index.tsx'

interface MultiEnvExportProps {
  envs: Record<EnvName, EnvVariable[]>
  envOrder: EnvName[]
}

export function MultiEnvExport({ envs, envOrder }: MultiEnvExportProps) {
  const { t } = useI18n()
  const [mode, setMode] = useState<'single' | 'multi'>('multi')
  // 导出脱敏（v1.2.0）
  const [redact, setRedact] = useState(false)
  const [pendingAction, setPendingAction] = useState<'single' | 'multi' | null>(null)

  const allVars = useMemo(
    () => envOrder.flatMap((e) => envs[e] ?? []),
    [envs, envOrder],
  )
  const scan = useMemo(() => scanSecrets(allVars), [allVars])

  useEffect(() => {
    if (scan.total === 0) setRedact(false)
  }, [scan.total])

  const runExport = (action: 'single' | 'multi', target: Record<EnvName, EnvVariable[]>) => {
    if (action === 'single') {
      downloadFile(exportMultiEnvAsSingle(target, envOrder), '.env.all')
      return
    }
    const files = exportMultiEnvAsFiles(target, envOrder)
    // 浏览器无法批量打包，依次触发下载（间隔避免被拦截）
    files.forEach((f, i) => {
      setTimeout(() => downloadFile(f.filename, f.content), i * 200)
    })
  }

  const handleClick = (action: 'single' | 'multi') => {
    if (scan.total > 0) {
      setPendingAction(action)
      return
    }
    runExport(action, envs)
  }

  const redactedEnvs = useMemo(() => {
    const out: Record<EnvName, EnvVariable[]> = {}
    for (const e of envOrder) out[e] = redactSecrets(envs[e] ?? [])
    return out
  }, [envs, envOrder])

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
        {t('multiEnvExport.title')}
      </h3>
      <div className="mb-3 flex gap-1 rounded-lg bg-slate-100 p-1 dark:bg-slate-700">
        <button
          onClick={() => setMode('multi')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            mode === 'multi'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {t('multiEnvExport.modeMulti')}
        </button>
        <button
          onClick={() => setMode('single')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            mode === 'single'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          {t('multiEnvExport.modeSingle')}
        </button>
      </div>

      {scan.total > 0 && !pendingAction && (
        <p className="mb-2 text-xs text-red-600 dark:text-red-400">
          {redact
            ? t('envExport.leakHintRedacted', { n: scan.total })
            : t('envExport.leakHint', { n: scan.total })}
        </p>
      )}
      {pendingAction && (
        <ExportSecretWarning
          total={scan.total}
          onRedact={() => {
            const action = pendingAction
            setPendingAction(null)
            setRedact(true)
            runExport(action, redactedEnvs)
          }}
          onProceed={() => {
            const action = pendingAction
            setPendingAction(null)
            runExport(action, envs)
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {mode === 'multi' ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('multiEnvExport.multiHint')}
          </p>
          <ul className="space-y-1">
            {envOrder.map((envName) => (
              <li key={envName} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs dark:bg-slate-900/40">
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  .env.{envName}
                </span>
                <span className="text-slate-400">{t('header.vars', { n: envs[envName]?.length ?? 0 })}</span>
              </li>
            ))}
          </ul>
          <button
            onClick={() => handleClick('multi')}
            className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            {t('multiEnvExport.downloadAll', { n: envOrder.length })}
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('multiEnvExport.singleHint')}
          </p>
          <pre className="max-h-40 overflow-auto rounded-lg bg-slate-50 p-3 text-[11px] text-slate-600 dark:bg-slate-900/40 dark:text-slate-400">
{`# @env development
NODE_ENV=development
...

# @env production
NODE_ENV=production
...`}
          </pre>
          <button
            onClick={() => handleClick('single')}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            {t('multiEnvExport.downloadSingle')}
          </button>
        </div>
      )}
    </div>
  )
}
