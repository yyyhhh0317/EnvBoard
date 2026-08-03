import { useCallback, useState } from 'react'
import { Header } from './components/Header/Header'
import { EnvImport } from './components/EnvImport/EnvImport'
import { EnvTable } from './components/EnvTable/EnvTable'
import { EnvEditor } from './components/EnvEditor/EnvEditor'
import { EnvCompare } from './components/EnvCompare/EnvCompare'
import { EnvExport } from './components/EnvExport/EnvExport'
import { DependencyTable } from './components/DependencyTable/DependencyTable'
import { DependencyEditor } from './components/DependencyEditor/DependencyEditor'
import { DependencyExport } from './components/DependencyExport/DependencyExport'
import { useTheme } from './hooks/useTheme'
import { createEmptyVariable, parseEnvFile } from './utils/parser/envParser'
import { parsePackageJson } from './utils/parser/packageJsonParser'
import { parseRequirements } from './utils/parser/requirementsParser'
import { parsePyproject } from './utils/parser/pyprojectParser'
import { parseLockfile } from './utils/parser/lockfileParser'
import { detectProjectType } from './utils/parser/detector'
import type {
  CompareItem,
  Dependency,
  DependencyParseResult,
  EnvVariable,
  ProjectType,
} from './types'

function genDepId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export default function App() {
  const { theme, toggleTheme } = useTheme()

  // .env 模式状态
  const [variables, setVariables] = useState<EnvVariable[]>([])
  const [editingEnv, setEditingEnv] = useState<EnvVariable | null>(null)

  // 依赖模式状态
  const [depResult, setDepResult] = useState<DependencyParseResult | null>(null)
  const [editingDep, setEditingDep] = useState<Dependency | null>(null)

  // 公共状态
  const [projectType, setProjectType] = useState<ProjectType | null>(null)
  const [filename, setFilename] = useState<string | null>(null)
  const [errors, setErrors] = useState<string[]>([])

  const isEnvMode = projectType === 'env'
  const isDepMode = projectType !== null && projectType !== 'env'

  const handleImport = useCallback((content: string, name: string) => {
    const type = detectProjectType(name, content)
    setProjectType(type)
    setFilename(name)

    if (type === 'env') {
      const result = parseEnvFile(content, name)
      setVariables(result.variables)
      setErrors(result.errors)
      setDepResult(null)
    } else {
      let result: DependencyParseResult
      if (type === 'npm') result = parsePackageJson(content, name)
      else if (type === 'pip') result = parseRequirements(content, name)
      else if (type === 'poetry') result = parsePyproject(content, name)
      else result = parseLockfile(content, name)
      setDepResult(result)
      setErrors(result.errors)
      setVariables([])
    }
  }, [])

  // ===== .env 模式操作 =====
  const handleSaveEnv = useCallback((updated: EnvVariable) => {
    setVariables((prev) =>
      prev.map((v) => (v.id === updated.id ? { ...updated, isNew: false } : v)),
    )
    setEditingEnv(null)
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

  // ===== 依赖模式操作 =====
  const handleSaveDep = useCallback((updated: Dependency) => {
    setDepResult((prev) =>
      prev
        ? { ...prev, dependencies: prev.dependencies.map((d) => (d.id === updated.id ? updated : d)) }
        : prev,
    )
    setEditingDep(null)
  }, [])

  const handleAddDep = useCallback(() => {
    setEditingDep({
      id: genDepId(),
      name: '',
      versionSpec: '',
      category: 'dependencies',
      line: 0,
    })
  }, [])

  const handleDeleteDep = useCallback((id: string) => {
    setDepResult((prev) =>
      prev ? { ...prev, dependencies: prev.dependencies.filter((d) => d.id !== id) } : prev,
    )
  }, [])

  const handleClear = useCallback(() => {
    setVariables([])
    setDepResult(null)
    setProjectType(null)
    setFilename(null)
    setErrors([])
  }, [])

  const hasData = projectType !== null

  return (
    <div className="min-h-full bg-slate-50 text-slate-900 dark:bg-slate-950 dark:text-slate-100">
      <Header
        theme={theme}
        onToggleTheme={toggleTheme}
        filename={filename}
        variableCount={
          isEnvMode
            ? variables.filter((v) => !v.isDisabled).length
            : depResult?.dependencies.length ?? 0
        }
      />

      <main className="mx-auto max-w-7xl space-y-6 px-4 py-6 sm:px-6">
        {!hasData ? (
          <div className="space-y-6">
            <section className="rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 p-8 text-center text-white shadow-lg">
              <h2 className="text-2xl font-bold sm:text-3xl">
                安全管理你的环境配置
              </h2>
              <p className="mx-auto mt-2 max-w-2xl text-sm text-emerald-50 sm:text-base">
                上传 .env / package.json / requirements.txt / pyproject.toml / lockfile，即可查看、编辑、对比和导出。敏感变量自动脱敏，所有操作在浏览器本地完成，数据不会上传。
              </p>
              <div className="mt-4 flex flex-wrap justify-center gap-2 text-xs">
                {['.env 解析', '依赖管理', '敏感脱敏', '版本查询', '对比同步', '多格式导出', '暗色模式'].map((t) => (
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

            {isEnvMode && (
              <>
                <EnvTable
                  variables={variables}
                  onEdit={setEditingEnv}
                  onAdd={() => setEditingEnv(createEmptyVariable())}
                  onDelete={(id) => setVariables((prev) => prev.filter((v) => v.id !== id))}
                  onToggleSensitive={handleToggleSensitive}
                />
                <div className="grid gap-6 lg:grid-cols-2">
                  <EnvCompare variables={variables} onSync={handleSync} />
                  <EnvExport variables={variables} />
                </div>
              </>
            )}

            {isDepMode && depResult && (
              <>
                <DependencyTable
                  dependencies={depResult.dependencies}
                  projectType={depResult.type}
                  meta={depResult.meta}
                  onEdit={setEditingDep}
                  onAdd={handleAddDep}
                  onDelete={handleDeleteDep}
                />
                <DependencyExport
                  dependencies={depResult.dependencies}
                  projectType={depResult.type}
                  meta={depResult.meta}
                />
              </>
            )}

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

      <EnvEditor variable={editingEnv} onSave={handleSaveEnv} onClose={() => setEditingEnv(null)} />
      <DependencyEditor dependency={editingDep} onSave={handleSaveDep} onClose={() => setEditingDep(null)} />

      <footer className="border-t border-slate-200 py-4 text-center text-xs text-slate-400 dark:border-slate-800">
        EnvBoard · 环境配置可视化管理 · 数据仅在浏览器本地处理（联网查版本除外，需手动开启）
      </footer>
    </div>
  )
}
