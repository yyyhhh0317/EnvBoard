// 对比区域：上传另一个 env 类文件（.env / .ini / .properties）并对比（v1.3.0 泛化）
import { useMemo, useRef, useState } from 'react'
import type { CompareItem, EnvVariable } from '../../types'
import { compareVariables } from '../../utils/parser/compare'
import { parseEnvLike } from '../../utils/parser/envLikeParser'
import { useI18n } from '../../i18n/index.tsx'

interface EnvCompareProps {
  variables: EnvVariable[]
  onSync: (missing: CompareItem[]) => void
}

const STATUS_META: Record<
  CompareItem['status'],
  { labelKey: string; cls: string; dot: string }
> = {
  match: {
    labelKey: 'envCompare.statusMatch',
    cls: 'text-emerald-700 bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300',
    dot: 'bg-emerald-500',
  },
  missing: {
    labelKey: 'envCompare.statusMissing',
    cls: 'text-red-700 bg-red-50 dark:bg-red-900/30 dark:text-red-300',
    dot: 'bg-red-500',
  },
  extra: {
    labelKey: 'envCompare.statusExtra',
    cls: 'text-blue-700 bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300',
    dot: 'bg-blue-500',
  },
  empty: {
    labelKey: 'envCompare.statusEmpty',
    cls: 'text-amber-700 bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300',
    dot: 'bg-amber-500',
  },
}

export function EnvCompare({ variables, onSync }: EnvCompareProps) {
  const { t } = useI18n()
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
      const parsed = parseEnvLike(content, file.name)
      if (parsed.variables.length === 0) {
        setError(t('envCompare.noVarsError'))
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
            {t('envCompare.title')}
          </h2>
          <p className="text-xs text-slate-500 dark:text-slate-400">
            {t('envCompare.desc')}
          </p>
        </div>
        <div className="flex gap-2">
          <input
            ref={inputRef}
            type="file"
            accept=".env,.env.*,.ini,.properties,text/plain"
            className="hidden"
            onChange={(e) => {
              const file = e.target.files?.[0]
              if (file) handleFile(file)
              // 清空 value，允许重复选择同一文件
              e.target.value = ''
            }}
          />
          <button
            onClick={() => inputRef.current?.click()}
            className="rounded-lg border border-slate-200 bg-white px-3 py-1.5 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
          >
            {exampleVariables ? t('envCompare.change') : t('envCompare.upload')}
          </button>
          {missingItems.length > 0 && (
            <button
              onClick={() => onSync(missingItems)}
              className="rounded-lg bg-emerald-600 px-3 py-1.5 text-sm font-medium text-white transition hover:bg-emerald-700"
            >
              {t('envCompare.sync', { n: missingItems.length })}
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
          {t('envCompare.empty')}
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
                <div className="text-xs">{t(STATUS_META[s].labelKey)}</div>
              </div>
            ))}
          </div>

          <div className="text-xs text-slate-500 dark:text-slate-400">
            {t('envCompare.templateFile')}：{exampleName}
          </div>

          {/* 对比列表 */}
          <div className="mt-2 max-h-72 overflow-auto rounded-lg border border-slate-200 dark:border-slate-700">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-slate-50 text-xs uppercase text-slate-500 dark:bg-slate-900 dark:text-slate-400">
                <tr>
                  <th className="px-3 py-2">{t('envCompare.colStatus')}</th>
                  <th className="px-3 py-2">Key</th>
                  <th className="px-3 py-2">{t('envCompare.colCurrent')}</th>
                  <th className="px-3 py-2">{t('envCompare.colTemplate')}</th>
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
                        {t(STATUS_META[item.status].labelKey)}
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
