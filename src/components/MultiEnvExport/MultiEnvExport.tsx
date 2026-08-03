// 多环境导出：单文件（带 @env 分段）或多文件下载
import { useState } from 'react'
import type { EnvName, EnvVariable } from '../../types'
import {
  downloadFile,
  exportMultiEnvAsFiles,
  exportMultiEnvAsSingle,
} from '../../utils/formatter/multiEnvExporter'

interface MultiEnvExportProps {
  envs: Record<EnvName, EnvVariable[]>
  envOrder: EnvName[]
}

export function MultiEnvExport({ envs, envOrder }: MultiEnvExportProps) {
  const [mode, setMode] = useState<'single' | 'multi'>('multi')

  const handleExportSingle = () => {
    const content = exportMultiEnvAsSingle(envs, envOrder)
    downloadFile('.env.all', content)
  }

  const handleExportMulti = () => {
    const files = exportMultiEnvAsFiles(envs, envOrder)
    // 浏览器无法批量打包，依次触发下载（间隔避免被拦截）
    files.forEach((f, i) => {
      setTimeout(() => downloadFile(f.filename, f.content), i * 200)
    })
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-4 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <h3 className="mb-3 text-sm font-bold text-slate-800 dark:text-slate-100">
        多环境导出
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
          多文件（.env.xxx）
        </button>
        <button
          onClick={() => setMode('single')}
          className={`flex-1 rounded-md px-3 py-1.5 text-xs font-medium transition ${
            mode === 'single'
              ? 'bg-white text-slate-900 shadow-sm dark:bg-slate-900 dark:text-white'
              : 'text-slate-500 hover:text-slate-700 dark:text-slate-400'
          }`}
        >
          单文件（带分段）
        </button>
      </div>

      {mode === 'multi' ? (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            将每个环境导出为独立文件，浏览器会依次触发下载：
          </p>
          <ul className="space-y-1">
            {envOrder.map((envName) => (
              <li key={envName} className="flex items-center justify-between rounded-lg bg-slate-50 px-3 py-1.5 text-xs dark:bg-slate-900/40">
                <span className="font-mono text-slate-700 dark:text-slate-300">
                  .env.{envName}
                </span>
                <span className="text-slate-400">{envs[envName]?.length ?? 0} 个变量</span>
              </li>
            ))}
          </ul>
          <button
            onClick={handleExportMulti}
            className="mt-2 w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            下载全部（{envOrder.length} 个文件）
          </button>
        </div>
      ) : (
        <div className="space-y-2">
          <p className="text-xs text-slate-500 dark:text-slate-400">
            合并为单个文件，用 <code className="rounded bg-slate-100 px-1 font-mono dark:bg-slate-700"># @env</code> 标记分段：
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
            onClick={handleExportSingle}
            className="w-full rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
          >
            下载 .env.all
          </button>
        </div>
      )}
    </div>
  )
}
