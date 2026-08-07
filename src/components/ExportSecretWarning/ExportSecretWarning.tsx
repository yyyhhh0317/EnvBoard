// 导出脱敏确认（v1.2.0）
// 当导出内容包含疑似泄露密钥时，在真正导出前弹出确认：
//  - 导出并脱敏（推荐）：命中片段替换为 [REDACTED]
//  - 仍然导出（不脱敏）
//  - 取消
interface ExportSecretWarningProps {
  total: number
  onRedact: () => void
  onProceed: () => void
  onCancel: () => void
}

export function ExportSecretWarning({ total, onRedact, onProceed, onCancel }: ExportSecretWarningProps) {
  return (
    <div
      role="alert"
      className="mt-3 rounded-lg border border-red-200 bg-red-50 p-3 dark:border-red-900/50 dark:bg-red-900/20"
    >
      <p className="text-xs font-medium text-red-700 dark:text-red-300">
        导出内容包含 {total} 处疑似泄露的密钥，建议脱敏或先清除再导出。
      </p>
      <div className="mt-2 flex flex-wrap gap-2">
        <button
          onClick={onRedact}
          className="rounded-lg bg-red-600 px-3 py-1.5 text-xs font-medium text-white transition hover:bg-red-700"
        >
          导出并脱敏
        </button>
        <button
          onClick={onProceed}
          className="rounded-lg border border-red-300 px-3 py-1.5 text-xs font-medium text-red-700 transition hover:bg-red-100 dark:border-red-700 dark:text-red-300 dark:hover:bg-red-900/30"
        >
          仍然导出（不脱敏）
        </button>
        <button
          onClick={onCancel}
          className="rounded-lg px-3 py-1.5 text-xs text-slate-500 transition hover:bg-slate-100 dark:text-slate-400 dark:hover:bg-slate-700"
        >
          取消
        </button>
      </div>
    </div>
  )
}
