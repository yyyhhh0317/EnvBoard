// 导出区域：格式选择、敏感值控制、复制/下载（含密钥脱敏确认 v1.2.0）
import { useEffect, useMemo, useState } from 'react'
import type { EnvVariable, ExportFormat } from '../../types'
import {
  copyToClipboard,
  downloadFile,
  formatVariables,
  getExportFilename,
} from '../../utils/formatter/exporter'
import { redactSecrets, scanSecrets } from '../../utils/secretScan'
import { ExportSecretWarning } from '../ExportSecretWarning/ExportSecretWarning'
import { useI18n } from '../../i18n/index.tsx'

interface EnvExportProps {
  variables: EnvVariable[]
}

export function EnvExport({ variables }: EnvExportProps) {
  const { t } = useI18n()
  const [format, setFormat] = useState<ExportFormat>('env')
  const [includeSensitive, setIncludeSensitive] = useState(true)
  const [copied, setCopied] = useState(false)
  // 导出脱敏（v1.2.0）
  const [redact, setRedact] = useState(false)
  const [pendingAction, setPendingAction] = useState<'copy' | 'download' | null>(null)

  const scan = useMemo(() => scanSecrets(variables), [variables])
  // env-example 只导出 key 不含值，无泄露风险
  const leaksInOutput = format !== 'env-example' && scan.total > 0

  // 泄露清除后自动退出脱敏态
  useEffect(() => {
    if (scan.total === 0) setRedact(false)
  }, [scan.total])

  const exportVars = useMemo(
    () => (redact ? redactSecrets(variables) : variables),
    [variables, redact],
  )

  const output = useMemo(
    () => formatVariables(exportVars, format, includeSensitive),
    [exportVars, format, includeSensitive],
  )

  // 用显式变量列表执行导出，避免脱敏切换后的闭包残留旧内容
  const execute = (vars: EnvVariable[], action: 'copy' | 'download') => {
    const text = formatVariables(vars, format, includeSensitive)
    if (action === 'copy') {
      void copyToClipboard(text).then((ok) => {
        if (ok) {
          setCopied(true)
          setTimeout(() => setCopied(false), 1500)
        }
      })
    } else {
      downloadFile(text, getExportFilename(format))
    }
  }

  const handleExportClick = (action: 'copy' | 'download') => {
    if (leaksInOutput) {
      setPendingAction(action)
      return
    }
    execute(exportVars, action)
  }

  const FORMATS: { value: ExportFormat; label: string; desc: string }[] = [
    { value: 'env', label: '.env', desc: t('envExport.formatEnv') },
    { value: 'env-example', label: '.env.example', desc: t('envExport.formatExample') },
    { value: 'json', label: 'JSON', desc: t('envExport.formatJson') },
    { value: 'yaml', label: 'YAML', desc: t('envExport.formatYaml') },
  ]

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">{t('envExport.title')}</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          {t('envExport.desc')}
        </p>
      </div>

      {/* 格式选择 */}
      <div className="mb-4 grid grid-cols-2 gap-2 sm:grid-cols-4">
        {FORMATS.map((f) => (
          <button
            key={f.value}
            onClick={() => setFormat(f.value)}
            className={`rounded-lg border px-3 py-2 text-left transition ${
              format === f.value
                ? 'border-emerald-500 bg-emerald-50 dark:bg-emerald-900/30'
                : 'border-slate-200 bg-white hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:hover:bg-slate-600'
            }`}
          >
            <div className={`text-sm font-medium ${format === f.value ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-700 dark:text-slate-200'}`}>
              {f.label}
            </div>
            <div className="text-xs text-slate-500 dark:text-slate-400">{f.desc}</div>
          </button>
        ))}
      </div>

      {/* 选项 */}
      <label className="mb-3 flex items-center gap-2 text-sm text-slate-700 dark:text-slate-300">
        <input
          type="checkbox"
          checked={includeSensitive}
          onChange={(e) => setIncludeSensitive(e.target.checked)}
          className="h-4 w-4 rounded border-slate-300 text-emerald-600 focus:ring-emerald-500"
        />
        {t('envExport.includeSensitiveLabel')}
      </label>

      {/* 预览 */}
      <pre className="mb-3 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
        {output || t('common.noContent')}
      </pre>

      {/* 泄露提示（v1.2.0） */}
      {leaksInOutput && !pendingAction && (
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
            execute(redactSecrets(variables), action)
          }}
          onProceed={() => {
            const action = pendingAction
            setPendingAction(null)
            execute(exportVars, action)
          }}
          onCancel={() => setPendingAction(null)}
        />
      )}

      {/* 操作 */}
      <div className="flex gap-2">
        <button
          onClick={() => handleExportClick('copy')}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          {copied ? t('common.copied') : t('envExport.copy')}
        </button>
        <button
          onClick={() => handleExportClick('download')}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          {t('envExport.download')}
        </button>
      </div>
    </div>
  )
}
