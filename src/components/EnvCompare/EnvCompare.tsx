// 对比区域：上传 .env.example 并对比
import { useMemo, useRef, useState } from 'react'
import type { CompareItem, EnvVariable } from '../../types'
import { compareVariables } from '../../utils/parser/compare'
import { parseEnvFile } from '../../utils/parser/envParser'

interface EnvCompareProps {
  variables: EnvVariable[]
  onSync: (missing: CompareItem[]) => void
}

const STATUS_META: Record<
  CompareItem['status'],
  { label: string; cls: string; dot: string }
> = {
  match: {
    label: '匹配',
    cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  missing: {
    label: '缺失',
    cls: 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300',
    dot: 'bg-red-500',
  },
  extra: {
    label: '多余',
    cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  empty: {
    label: '空值',
    cls: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
}

export function EnvCompare({ variables, onSync }: EnvCompareProps) {
  const inputRef = useRef<HTMLInputElement>(null)
  const [exampleVariables, setExampleVariables] = useState<EnvVariable[] | null>(null)
  const [exampleName, setExampleName] = useState<string>('')
  const [error, setError] = useState<string>('')

  const result = useMemo(() => {
    if (!exampleVariables) return []
    return compareVariables(variables, exampleVariables)
  }, [variables, exampleVariables])

  const counts = useMemo(() => {
    const c = { match: 0, missing: 0, extra: 0, empty: 0 }
    result.forEach((r) => {
      c[r.status]++
    })
    return c
  }, [result])

  const handleFile = (file: File) => {
    const reader = new FileReader()
    reader.onload = (e) => {
      const content = e.target?.result
      if (typeof content !== 'string') return
      const parsed = parseEnvFile(content, file.name)
      if (parsed.variables.length === 0) {
        setError('example 文件没有解析到变量，请检查格式')
        return
      }
      setError('')
      setExampleVariables(parsed.variables)
      setExampleName(file.name)
    }
    reader.readAsText(file, 'utf-8')
  }

  const missingItems = result.filter((r) => r.status === 'missing')

  return (
    <div className="rounded-2xl border border-slate-200 bg-white p-5 shadow-sm dark:border-slate-700 dark:bg-slate-800">
      <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
        <div>
          <h2 className="text-base font-semibold text-slate-900 dark:text-white">
            对比 .env.example
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            上传模板文件，检查缺失、多余或空值的变量
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".env,.env.*,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {exampleVariables ? '更换 example' : '上传 .env.example'}
          </button>
          {missingItems.length > 0 && (
            <button
              onClick={() => onSync(missingItems)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              一键同步缺失（{missingItems.length}）
            </button>
          )}
        </div>
      </div>

      {error && (
        <div className="mb-3 rounded-lg bg-red-50 px-3 py-2 text-sm text-red-600 dark:bg-red-900/30 dark:text-red-300">
          {error}
        </div>
      )}

      {!exampleVariables ? (
        <div className="rounded-xl border border-dashed border-slate-300 px-4 py-8 text-center text-sm text-slate-400 dark:border-slate-600">
          未上传 example 文件，对比结果将显示在此处
        </div>
      ) : (
        <>
          {/* 统计 */}
          <div className="mb-3 grid grid-cols-2 gap-2 sm:grid-cols-4">
            {(['match', 'missing', 'extra', 'empty'] as const).map((s) => (
              <div
                key={s}
                className={`rounded-lg px-3 py-2 text-center ${STATUS_META[s].cls}`}
              >
                <div className="text-lg font-bold">{counts[s]}</div>
                <div className="text-xs">{STATUS_META[s].label}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            模板文件：{exampleName}
          </div>

          {/* 对比列表 */}
          <div className="mt-2 max-h-72 overflow-y-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2">状态</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">当前值</th>
                  <th className="px-3 py-2">模板值</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100 dark:divide-slate-700/60">
                {result.map((item) => (
                  <tr key={item.key} className="hover:bg-slate-50 dark:hover:bg-slate-700/30">
                    <td className="px-3 py-2">
                      <span
                        className={`inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs font-medium ${STATUS_META[item.status].cls}`}
                      >
                        <span className={`h-1.5 w-1.5 rounded-full ${STATUS_META[item.status].dot}`} />
                        {STATUS_META[item.status].label}
                      </span>
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-800 dark:text-slate-200">
                      {item.key}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-600 dark:text-slate-300">
                      {item.currentValue ?? <span className="text-slate-400">—</span>}
                    </td>
                    <td className="px-3 py-2 font-mono text-slate-500 dark:text-slate-400">
                      {item.exampleValue ?? <span className="text-slate-400">—</span>}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </>
      )}
    </div>
  )
}
