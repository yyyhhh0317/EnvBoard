// 导入区域：上传文件 / 粘贴文本 两种模式
import { useRef, useState } from 'react'
import { useI18n } from '../../i18n/index.tsx'

interface EnvImportProps {
  onImport: (content: string, filename: string) => void
}

type ImportMode = 'file' | 'paste'

export function EnvImport({ onImport }: EnvImportProps) {
  const { t } = useI18n()
  const inputRef = useRef<HTMLInputElement>(null)
  const [mode, setMode] = useState<ImportMode>('file')
  const [dragging, setDragging] = useState(false)
  const [pasteValue, setPasteValue] = useState('')

  const readFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content === 'string') {
        onImport(content, file.name)
      }
    }
    reader.readAsText(file, 'utf-8')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) readFile(file)
    // 清空 value，允许重复选择同一文件
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  /** 根据内容推断文件名，避免硬编码导致误判 */
  function inferPastedFilename(content: string): string {
    const trimmed = content.trim()
    if (trimmed.startsWith('{')) return 'pasted.json'
    if (trimmed.includes('[project]') || trimmed.includes('[tool.poetry]')) return 'pasted.toml'
    if (/^[A-Za-z0-9_][A-Za-z0-9_.-]*\s*(==|>=|<=|~=|>|<)/m.test(trimmed)) return 'pasted.txt'
    if (/^[A-Za-z_][A-Za-z0-9_.]*\s*=/m.test(trimmed)) return 'pasted.env'
    return 'pasted.txt'
  }

  const handleSubmitPaste = () => {
    if (pasteValue.trim()) {
      onImport(pasteValue, inferPastedFilename(pasteValue))
      setPasteValue('')
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
      {/* 模式切换 */}
      <div className="mb-5 flex gap-1 rounded-xl bg-slate-100 p-1 dark:bg-slate-800">
        <button
          onClick={() => setMode('file')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === 'file'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
          {t('envImport.uploadFile')}
        </button>
        <button
          onClick={() => setMode('paste')}
          className={`flex flex-1 items-center justify-center gap-1.5 rounded-lg px-4 py-2 text-sm font-medium transition ${
            mode === 'paste'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-700 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400 dark:hover:text-slate-200'
          }`}
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          {t('envImport.pasteText')}
        </button>
      </div>

      {/* 上传文件模式 */}
      {mode === 'file' && (
        <div
          onDragOver={(e) => {
            e.preventDefault()
            setDragging(true)
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          onClick={() => inputRef.current?.click()}
          className={`group flex cursor-pointer flex-col items-center justify-center rounded-2xl border-2 border-dashed px-6 py-12 text-center transition ${
            dragging
              ? 'border-emerald-500 bg-emerald-50/80 dark:bg-emerald-950/30'
              : 'border-slate-300 hover:border-emerald-400 hover:bg-slate-50/80 dark:border-slate-700 dark:hover:border-emerald-500 dark:hover:bg-slate-800/50'
          }`}
        >
          <div className={`mb-4 flex h-14 w-14 items-center justify-center rounded-2xl transition ${
            dragging
              ? 'bg-emerald-100 text-emerald-600 dark:bg-emerald-900/50 dark:text-emerald-400'
              : 'bg-slate-100 text-slate-400 group-hover:bg-emerald-100 group-hover:text-emerald-500 dark:bg-slate-800 dark:group-hover:bg-emerald-900/50'
          }`}>
            <svg className="h-7 w-7" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
            </svg>
          </div>
          <p className="text-sm font-semibold text-slate-700 dark:text-slate-200">
            {t('envImport.dropHint')}
          </p>
          <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
            {t('envImport.supported')}
          </p>
          <input
            ref={inputRef}
            type="file"
            accept=".env,.env.*,text/plain,text/toml,application/json,.json,.txt,.yaml,.yml"
            className="hidden"
            onChange={handleFileChange}
          />
        </div>
      )}

      {/* 粘贴文本模式 */}
      {mode === 'paste' && (
        <div>
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder={t('envImport.pastePlaceholder')}
            className="h-48 w-full resize-y rounded-xl border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            spellCheck={false}
            autoFocus
          />
          <div className="mt-3 flex justify-end">
            <button
              onClick={handleSubmitPaste}
              disabled={!pasteValue.trim()}
              className="rounded-lg bg-emerald-600 px-6 py-2 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              {t('envImport.parse')}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
