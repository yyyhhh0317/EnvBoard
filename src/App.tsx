import { useCallback, useState } from 'react'
import { Header } from './components/Header/Header'
import { EnvImport } from './components/EnvImport/EnvImport'
import { EnvTable } from './components/EnvTable/EnvTable'
import { EnvEditor } from './components/EnvEditor/EnvEditor'
import { EnvCompare } from './components/EnvCompare/EnvCompare'
import { EnvExport } from './components/EnvExport/EnvExport'
import { useTheme } from './hooks/useTheme'
import { createEmptyVariable, parseEnvFile } from './utils/parser/envParser'
import type { CompareItem, EnvVariable } from './types'

export default function App() {
  const { theme, toggleTheme } = useTheme()
  const [variables, setVariables] = useState<EnvVariable[]>([])
  const [filename, setFilename] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])
  const [editing, setEditing] = useState<EnvVariable | null>(null)

  const handleImport = useCallback((content: string, name: string) => {
    const result = parseEnvFile(content, name)
    setVariables(result.variables)
    setFilename(result.filename)
    setErrors(result.errors)
  }, [])

  const handleSave = useCallback((updated: EnvVariable) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === updated.id ? { ...updated, isNew: false } : v)),
    )
    setEditing(null)
  }, [])

  const handleAdd = useCallback(() => {
    setEditing(createEmptyVariable())
  }, [])

  const handleDelete = useCallback((id: string) => {
    setVariables((prev) => prev.filter((v) => v.id !== id))
  }, [])

  const handleToggleSensitive = useCallback((id: string) => {
    setVariables((prev) =>
      prev.map((v) =>
        v.id === id ? { ...v, isSensitive: !v.isSensitive, isModified: true } : v,
      ),
    )
  }, [])

  const handleSync = useCallback((missing: CompareItem[]) => {
    setVariables((prev) => {
      const existing = new Set(prev.map((v) => v.key))
      const toAdd: EnvVariable[] = missing
        .filter((m) => !existing.has(m.key))
        .map((m) => ({
          ...createEmptyVariable(),
          key: m.key,
          value: m.exampleValue ?? '',
          comment: '从 .env.example 同步',
          isNew: true,
        }))
      return [...prev, ...toAdd]
    })
  }, [])

  const handleClear = useCallback(() => {
    setVariables([])
    setFilename(null)
    setErrors([])
  }, [])

  const hasData = variables.length > 0 || filename !== null

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        filename={filename}
        variableCount={variables.filter((v) => !v.isDisabled).length}
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {!hasData ? (
          // 空状态：欢迎介绍 + 导入
          <div className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white shadow-lg">
              <h2 className="text-2xl font-bold sm:text-3xl">
                安全管理你的环境变量
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-emerald-50 sm:text-base">
                上传 .env 文件，即可查看、编辑、对比和导出环境变量。敏感变量自动识别并脱敏，所有操作在浏览器本地完成，数据不会上传。
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                {['解析展示', '敏感脱敏', '对比同步', '多格式导出', '暗色模式'].map((t) => (
                  <span key={t} className="rounded-full bg-white/20 px-3 py-1 backdrop-blur">
                    {t}
                  </span>
                ))}
              </div>
            </section>
            <EnvImport onImport={handleImport} />
          </div>
        ) : (
          <>
            <EnvImport onImport={handleImport} />

            {errors.length > 0 && (
              <div className="rounded-xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-800 dark:bg-amber-900/20">
                <div className="mb-1 flex items-center gap-2 text-sm font-medium text-amber-800 dark:text-amber-300">
                  <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
                  </svg>
                  解析提示（{errors.length}）
                </div>
                <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
                  {errors.map((e, i) => (
                    <li key={i}>{e}</li>
                  ))}
                </ul>
              </div>
            )}

            <EnvTable
              variables={variables}
              onEdit={setEditing}
              onAdd={handleAdd}
              onDelete={handleDelete}
              onToggleSensitive={handleToggleSensitive}
            />

            <div className="grid gap-6 lg:grid-cols-2">
              <EnvCompare variables={variables} onSync={handleSync} />
              <EnvExport variables={variables} />
            </div>

            <div className="flex justify-center pb-4">
              <button
                onClick={handleClear}
                className="rounded-lg px-4 py-2 text-sm text-slate-500 transition hover:bg-slate-200 hover:text-slate-700 dark:text-slate-400 dark:hover:bg-slate-800 dark:hover:text-slate-200"
              >
                清空并重新开始
              </button>
            </div>
          </>
        )}
      </main>

      <EnvEditor variable={editing} onSave={handleSave} onClose={() => setEditing(null)} />

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        EnvBoard · 环境变量可视化管理 · 数据仅在浏览器本地处理
      </footer>
    </div>
  )
}
