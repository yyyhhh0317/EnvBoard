// 导入区域：文件上传 / 粘贴 / 示例
import { useRef, useState } from 'react'
import { SAMPLE_ENV } from '../../utils/sample'

interface EnvImportProps {
  onImport: (content: string, filename: string) => void
}

export function EnvImport({ onImport }: EnvImportProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [pasteOpen, setPasteOpen] = useState(false)
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
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files?.[0]
    if (file) readFile(file)
  }

  const handleLoadSample = () => {
    onImport(SAMPLE_ENV, '.env.example')
  }

  const handleSubmitPaste = () => {
    if (pasteValue.trim()) {
      onImport(pasteValue, 'pasted.txt')
      setPasteValue('')
      setPasteOpen(false)
    }
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
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
          点击选择文件，或拖拽到此处
        </p>
        <p className="mt-1.5 text-xs text-slate-500 dark:text-slate-400">
          支持 <code className="font-mono">.env</code> / <code className="font-mono">package.json</code> / <code className="font-mono">requirements.txt</code> / <code className="font-mono">pyproject.toml</code> / lockfile
        </p>
        <input
          ref={inputRef}
          type="file"
          accept=".env,.env.*,text/plain,text/toml,application/json,.json,.txt,.yaml,.yml"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      <div className="mt-4 flex flex-wrap gap-3">
        <button
          onClick={() => setPasteOpen((v) => !v)}
          className="inline-flex items-center gap-1.5 rounded-xl border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 shadow-sm transition hover:bg-slate-50 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200 dark:hover:bg-slate-700"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          粘贴文本
        </button>
        <button
          onClick={handleLoadSample}
          className="inline-flex items-center gap-1.5 rounded-xl border border-emerald-200 bg-emerald-50 px-4 py-2 text-sm font-medium text-emerald-700 shadow-sm transition hover:bg-emerald-100 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 dark:hover:bg-emerald-900/30"
        >
          <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 10V3L4 14h7v7l9-11h-7z" />
          </svg>
          加载示例 .env
        </button>
      </div>

      {pasteOpen && (
        <div className="mt-4 rounded-xl border border-slate-200 p-4 dark:border-slate-700">
          <textarea
            value={pasteValue}
            onChange={(e) => setPasteValue(e.target.value)}
            placeholder={`# 粘贴配置文件内容，例如：\nDATABASE_URL=postgresql://localhost:5432/mydb\nAPI_KEY=your-api-key\n\n# 或粘贴 package.json / requirements.txt 等`}
            className="h-40 w-full resize-y rounded-lg border border-slate-300 bg-white p-3 font-mono text-sm text-slate-800 outline-none transition focus:border-emerald-500 focus:ring-2 focus:ring-emerald-500/20 dark:border-slate-600 dark:bg-slate-950 dark:text-slate-200"
            spellCheck={false}
          />
          <div className="mt-2 flex justify-end gap-2">
            <button
              onClick={() => {
                setPasteOpen(false)
                setPasteValue('')
              }}
              className="rounded-lg px-3 py-1.5 text-sm text-slate-500 transition hover:text-slate-700 dark:hover:text-slate-300"
            >
              取消
            </button>
            <button
              onClick={handleSubmitPaste}
              disabled={!pasteValue.trim()}
              className="rounded-lg bg-emerald-600 px-4 py-1.5 text-sm font-medium text-white shadow-sm transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-50"
            >
              解析
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
