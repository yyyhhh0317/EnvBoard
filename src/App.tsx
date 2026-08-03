import { useCallback, useMemo, useState } from 'react'
import { Header } from './components/Header/Header'
import { EnvImport } from './components/EnvImport/EnvImport'
import { EnvTable } from './components/EnvTable/EnvTable'
import { EnvEditor } from './components/EnvEditor/EnvEditor'
import { EnvCompare } from './components/EnvCompare/EnvCompare'
import { EnvExport } from './components/EnvExport/EnvExport'
import { DependencyTable } from './components/DependencyTable/DependencyTable'
import { DependencyEditor } from './components/DependencyEditor/DependencyEditor'
import { DependencyExport } from './components/DependencyExport/DependencyExport'
import { TemplatePicker } from './components/TemplatePicker/TemplatePicker'
import { useTheme } from './hooks/useTheme'
import { createEmptyVariable, parseEnvFile } from './utils/parser/envParser'
import { parsePackageJson } from './utils/parser/packageJsonParser'
import { parseRequirements } from './utils/parser/requirementsParser'
import { parsePyproject } from './utils/parser/pyprojectParser'
import { parseLockfile } from './utils/parser/lockfileParser'
import { detectProjectType } from './utils/parser/detector'
import { validateVariables } from './utils/validator'
import type {
  CompareItem,
  Dependency,
  DependencyParseResult,
  EnvVariable,
  ProjectType,
  TemplateVariable,
} from './types'

function genDepId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

function genEnvId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export default function App() {
  const { theme, toggleTheme } = useTheme()

  // .env 模式状态
  const [variables, setVariables] = useState<EnvVariable[]>([])
  const [editingEnv, setEditingEnv] = useState<EnvVariable | null>(null)
  // 当前应用的模板变量（用于校验）
  const [templateVars, setTemplateVars] = useState<TemplateVariable[]>([])
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)

  // 依赖模式状态
  const [depResult, setDepResult] = useState<DependencyParseResult | null>(null)
  const [editingDep, setEditingDep] = useState<Dependency | null>(null)

  // 派生校验结果
  const issues = useMemo(
    () => validateVariables(variables, templateVars),
    [variables, templateVars],
  )

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
    setTemplateVars([])
  }, [])

  // 应用模板：合并变量并更新模板变量（用于后续校验）
  const handleApplyTemplate = useCallback(
    (newVars: EnvVariable[], tplVars: TemplateVariable[]) => {
      setVariables(newVars)
      // 合并模板变量定义（同 key 覆盖）
      setTemplateVars((prev) => {
        const map = new Map(prev.map((t) => [t.key, t]))
        for (const t of tplVars) map.set(t.key, t)
        return Array.from(map.values())
      })
    },
    [],
  )

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

      <main className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
        {!hasData ? (
          <div className="space-y-6">
            <section className="relative overflow-hidden rounded-3xl bg-gradient-to-br from-emerald-500 via-teal-500 to-cyan-600 p-10 text-center text-white shadow-xl shadow-emerald-500/20">
              <div className="absolute inset-0 bg-[radial-gradient(circle_at_top_right,rgba(255,255,255,0.15),transparent_60%)]" />
              <div className="relative">
                <h2 className="text-3xl font-bold tracking-tight sm:text-4xl">
                  环境配置，一目了然
                </h2>
                <p className="mx-auto mt-3 max-w-2xl text-sm leading-relaxed text-emerald-50/90 sm:text-base">
                  上传 <code className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs">.env</code>、<code className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs">package.json</code>、<code className="rounded bg-white/20 px-1.5 py-0.5 font-mono text-xs">requirements.txt</code> 等配置文件，即可查看、编辑、对比与导出。敏感变量自动脱敏，数据仅在浏览器本地处理。
                </p>
                <div className="mt-6 flex flex-wrap justify-center gap-2 text-xs">
                  {['.env 解析', '依赖管理', '配置模板', '变量校验', '敏感脱敏', '对比同步', '多格式导出', '暗色模式'].map((t) => (
                    <span key={t} className="rounded-full border border-white/30 bg-white/10 px-3 py-1.5 font-medium backdrop-blur-sm transition hover:bg-white/20">
                      {t}
                    </span>
                  ))}
                </div>
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
                  issues={issues}
                  hasTemplate={templateVars.length > 0}
                  onEdit={setEditingEnv}
                  onAdd={() => setEditingEnv(createEmptyVariable())}
                  onDelete={(id) => setVariables((prev) => prev.filter((v) => v.id !== id))}
                  onToggleSensitive={handleToggleSensitive}
                  onOpenTemplate={() => setTemplatePickerOpen(true)}
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
      <TemplatePicker
        open={templatePickerOpen}
        variables={variables}
        genId={genEnvId}
        onApply={handleApplyTemplate}
        onClose={() => setTemplatePickerOpen(false)}
      />

      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-400 dark:border-slate-800/80">
        <p>EnvBoard · 环境配置可视化管理 · 数据仅在浏览器本地处理</p>
        <p className="mt-1 text-slate-300 dark:text-slate-600">联网查版本为可选功能，需手动开启</p>
      </footer>
    </div>
  )
}
