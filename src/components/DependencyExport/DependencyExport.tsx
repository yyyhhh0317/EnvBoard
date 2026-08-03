// 依赖导出区域：预览 + 复制 + 下载
import { useState } from 'react'
import type { ProjectType } from '../../types'
import {
  copyToClipboard,
  downloadFile,
} from '../../utils/formatter/exporter'
import { formatDependencies } from '../../utils/formatter/dependencyExporter'

interface DependencyExportProps {
  dependencies: import('../../types').Dependency[]
  projectType: ProjectType
  meta: Record<string, string>
}

const FILENAME_MAP: Record<ProjectType, string> = {
  env: '.env',
  npm: 'package.json',
  pip: 'requirements.txt',
  poetry: 'pyproject.toml',
  lockfile: 'lockfile.txt',
}

export function DependencyExport({ dependencies, projectType, meta }: DependencyExportProps) {
  const [copied, setCopied] = useState(false)

  const output = formatDependencies(dependencies, projectType, meta)

  const handleCopy = async () => {
    const ok = await copyToClipboard(output)
    if (ok) {
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    }
  }

  const handleDownload = () => {
    downloadFile(output, FILENAME_MAP[projectType] ?? 'output.txt')
  }

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4">
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">导出</h2>
        <p className="text-xs text-slate-500 dark:text-slate-400">
          预览修改后的配置，复制或下载文件
        </p>
      </div>

      <pre className="mb-3 max-h-64 overflow-auto rounded-lg bg-slate-900 p-3 font-mono text-xs leading-relaxed text-slate-100">
        {output || '（无内容）'}
      </pre>

      <div className="flex gap-2">
        <button
          onClick={handleCopy}
          className="flex-1 rounded-lg border border-slate-200 bg-white px-4 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
        >
          {copied ? '已复制 ✓' : '复制到剪贴板'}
        </button>
        <button
          onClick={handleDownload}
          className="flex-1 rounded-lg bg-emerald-600 px-4 py-2 text-sm font-medium text-white transition hover:bg-emerald-700"
        >
          下载文件
        </button>
      </div>
    </div>
  )
}
