import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
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
import { SecretScanPanel } from './components/SecretScanPanel/SecretScanPanel'
import { MonorepoScan } from './components/MonorepoScan/MonorepoScan'
import { EnvSwitcher } from './components/EnvSwitcher/EnvSwitcher'
import { EnvDiffView } from './components/EnvDiffView/EnvDiffView'
import { MultiEnvExport } from './components/MultiEnvExport/MultiEnvExport'
import { useTheme } from './hooks/useTheme'
import { useHistory } from './hooks/useHistory'
import { useSessionPersistence } from './hooks/useSessionPersistence'
import { createEmptyVariable } from './utils/parser/envParser'
import { parseEnvLike } from './utils/parser/envLikeParser'
import { parsePackageJson } from './utils/parser/packageJsonParser'
import { parseRequirements } from './utils/parser/requirementsParser'
import { parsePyproject } from './utils/parser/pyprojectParser'
import { parseLockfile } from './utils/parser/lockfileParser'
import { detectProjectType } from './utils/parser/detector'
import { mergeMultiEnvResults, parseMultiEnvFile } from './utils/parser/multiEnvParser'
import { validateVariables } from './utils/validator'
import type {
  CompareItem,
  Dependency,
  DependencyParseResult,
  EnvName,
  EnvVariable,
  HistoryAction,
  MultiEnvParseResult,
  ProjectType,
  TemplateVariable,
} from './types'

function genId(): string {
  return Math.random().toString(36).slice(2, 10) + Date.now().toString(36).slice(-4)
}

export default function App() {
  const { theme, toggleTheme } = useTheme()

  // 撤销/重做（v1.1.0）：仅跟踪单环境 .env 的 variables
  const history = useHistory()

  // 会话持久化（v1.1.0）：刷新/重开自动恢复，敏感值加密落盘
  const { hydrated, setHydrated, restore, persist, clear: clearSession } = useSessionPersistence()

  // .env 模式状态
  const [variables, setVariables] = useState<EnvVariable[]>([])
  const [editingEnv, setEditingEnv] = useState<EnvVariable | null>(null)
  // 当前应用的模板变量（用于校验）
  const [templateVars, setTemplateVars] = useState<TemplateVariable[]>([])
  const [templatePickerOpen, setTemplatePickerOpen] = useState(false)
  // Monorepo 扫描面板是否展开（v1.4.0）
  const [monorepoOpen, setMonorepoOpen] = useState(false)

  // 依赖模式状态
  const [depResult, setDepResult] = useState<DependencyParseResult | null>(null)
  const [editingDep, setEditingDep] = useState<Dependency | null>(null)

  // 多环境模式状态（v0.3.0）
  const [multiEnv, setMultiEnv] = useState<MultiEnvParseResult | null>(null)
  const [activeEnv, setActiveEnv] = useState<EnvName | null>(null)
  const [customEnvs, setCustomEnvs] = useState<EnvName[]>([])
  const appendInputRef = useRef<HTMLInputElement>(null)

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
  // 多环境模式：已有多环境数据，或单文件含 @env 分段
  const isMultiEnvMode = multiEnv !== null && multiEnv.hasSegments

  // 当前激活环境的变量列表（多环境模式下使用）
  const activeEnvVars = useMemo(() => {
    if (!multiEnv || !activeEnv) return []
    return multiEnv.envs[activeEnv] ?? []
  }, [multiEnv, activeEnv])

  // 多环境模式下，当前环境的变量同步到 variables（复用 EnvTable/校验逻辑）
  const displayVariables = isMultiEnvMode ? activeEnvVars : variables

  // 多环境模式下重新派生校验
  const displayIssues = useMemo(() => {
    if (!isMultiEnvMode) return issues
    return validateVariables(activeEnvVars, templateVars)
  }, [isMultiEnvMode, activeEnvVars, templateVars, issues])

  // 环境变量计数（用于 EnvSwitcher）
  const envCounts = useMemo(() => {
    const counts: Record<EnvName, number> = {}
    if (multiEnv) {
      for (const envName of multiEnv.envOrder) {
        counts[envName] = (multiEnv.envs[envName] ?? []).filter((v) => !v.isDisabled).length
      }
    }
    return counts
  }, [multiEnv])

  const handleImport = useCallback(
    (content: string, name: string) => {
      // 加载新文件视为全新会话，清空撤销历史
      history.clearHistory()
      const type = detectProjectType(name, content)
      setProjectType(type)
      setFilename(name)

    if (type === 'env') {
      // 先检测是否含 @env 分段标记
      const multiResult = parseMultiEnvFile(content, name)
      if (multiResult.hasSegments) {
        // 单文件多环境
        setMultiEnv(multiResult)
        setActiveEnv(multiResult.envOrder[0] ?? null)
        setVariables([])
        setErrors(multiResult.errors)
        setDepResult(null)
        return
      }
      // 无分段：按普通单环境 env 处理（.env / .ini / .properties 均可）
      const result = parseEnvLike(content, name)
      setVariables(result.variables)
      setErrors(result.errors)
      setMultiEnv(null)
      setActiveEnv(null)
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
      setMultiEnv(null)
      setActiveEnv(null)
    }
  }, [history])

  // 追加环境文件（多文件导入场景）
  const handleAppendFiles = useCallback((files: FileList) => {
    const readers = Array.from(files).map(
      (file) =>
        new Promise<{ content: string; filename: string }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({ content: String(e.target?.result ?? ''), filename: file.name })
          }
          reader.readAsText(file, 'utf-8')
        }),
    )
    Promise.all(readers).then((items) => {
      // 合并已有环境 + 新文件
      const allItems = [...items]
      // 把现有 multiEnv 的各环境重新作为输入
      if (multiEnv) {
        for (const envName of multiEnv.envOrder) {
          const vars = multiEnv.envs[envName] ?? []
          // 重建该环境的文本（简单序列化）
          const text = vars
            .map((v) => (v.isDisabled ? `# ${v.key}=${v.value}` : `${v.key}=${v.value}`))
            .join('\n')
          allItems.unshift({ content: text, filename: `.env.${envName}` })
        }
      }
      const merged = mergeMultiEnvResults(allItems)
      setMultiEnv(merged)
      setActiveEnv(merged.envOrder[0] ?? null)
      setErrors(merged.errors)
      setProjectType('env')
    })
  }, [multiEnv])

  // 多环境模式下编辑当前环境的变量
  const handleSaveMultiEnvVar = useCallback(
    (updated: EnvVariable) => {
      if (!multiEnv || !activeEnv) return
      setMultiEnv((prev) => {
        if (!prev || !activeEnv) return prev
        const envVars = prev.envs[activeEnv] ?? []
        // upsert：存在则更新，不存在则追加（处理新增变量场景）
        const exists = envVars.some((v) => v.id === updated.id)
        const newVars = exists
          ? envVars.map((v) => (v.id === updated.id ? { ...updated, isNew: false } : v))
          : [...envVars, { ...updated, isNew: false }]
        return {
          ...prev,
          envs: { ...prev.envs, [activeEnv]: newVars },
        }
      })
      setEditingEnv(null)
    },
    [multiEnv, activeEnv],
  )

  const handleDeleteMultiEnvVar = useCallback(
    (id: string) => {
      if (!multiEnv || !activeEnv) return
      setMultiEnv((prev) => {
        if (!prev || !activeEnv) return prev
        const envVars = prev.envs[activeEnv] ?? []
        return {
          ...prev,
          envs: {
            ...prev.envs,
            [activeEnv]: envVars.filter((v) => v.id !== id),
          },
        }
      })
    },
    [multiEnv, activeEnv],
  )

  const handleToggleMultiEnvSensitive = useCallback(
    (id: string) => {
      if (!multiEnv || !activeEnv) return
      setMultiEnv((prev) => {
        if (!prev || !activeEnv) return prev
        const envVars = prev.envs[activeEnv] ?? []
        return {
          ...prev,
          envs: {
            ...prev.envs,
            [activeEnv]: envVars.map((v) =>
              v.id === id ? { ...v, isSensitive: !v.isSensitive, isModified: true } : v,
            ),
          },
        }
      })
    },
    [multiEnv, activeEnv],
  )

  // 新增自定义环境
  const handleAddCustomEnv = useCallback((envName: EnvName) => {
    setMultiEnv((prev) => {
      if (!prev) return prev
      if (prev.envOrder.includes(envName)) return prev
      return {
        ...prev,
        envOrder: [...prev.envOrder, envName],
        envs: { ...prev.envs, [envName]: [] },
      }
    })
    setCustomEnvs((prev) => [...prev, envName])
    setActiveEnv(envName)
  }, [])

  // 删除自定义环境
  const handleRemoveCustomEnv = useCallback(
    (envName: EnvName) => {
      if (!multiEnv) return
      let nextActive = activeEnv
      setMultiEnv((prev) => {
        if (!prev) return prev
        const newOrder = prev.envOrder.filter((e) => e !== envName)
        const newEnvs = { ...prev.envs }
        delete newEnvs[envName]
        // 删除的是当前激活环境时，切到剩余的第一个
        if (activeEnv === envName) {
          nextActive = newOrder[0] ?? null
        }
        return { ...prev, envOrder: newOrder, envs: newEnvs }
      })
      setCustomEnvs((prev) => prev.filter((e) => e !== envName))
      setActiveEnv(nextActive)
    },
    [multiEnv, activeEnv],
  )

  // 包装一次变量变更：记录历史快照 + 更新状态（仅单环境 .env 模式使用）
  const commitVariables = useCallback(
    (action: HistoryAction, description: string, next: EnvVariable[], variableKey?: string) => {
      history.record(action, description, variables, next, variableKey)
      setVariables(next)
    },
    [variables, history],
  )

  const handleUndo = useCallback(() => {
    const snap = history.undo()
    if (snap) setVariables(snap)
  }, [history])

  const handleRedo = useCallback(() => {
    const snap = history.redo()
    if (snap) setVariables(snap)
  }, [history])

  // 快捷键：Ctrl/Cmd+Z 撤销，Ctrl/Cmd+Shift+Z 或 Ctrl+Y 重做（仅在单环境 .env 模式）
  useEffect(() => {
    if (!(isEnvMode && !isMultiEnvMode)) return
    const onKey = (e: KeyboardEvent) => {
      const t = e.target as HTMLElement | null
      if (t && (t.tagName === 'INPUT' || t.tagName === 'TEXTAREA' || t.isContentEditable)) return
      if (!(e.ctrlKey || e.metaKey)) return
      const key = e.key.toLowerCase()
      if (key === 'z' && !e.shiftKey) {
        e.preventDefault()
        handleUndo()
      } else if ((key === 'z' && e.shiftKey) || key === 'y') {
        e.preventDefault()
        handleRedo()
      }
    }
    window.addEventListener('keydown', onKey)
    return () => window.removeEventListener('keydown', onKey)
  }, [isEnvMode, isMultiEnvMode, handleUndo, handleRedo])

  // 挂载时恢复上次会话（恢复完成前不自动保存，避免空状态覆盖已存会话）
  useEffect(() => {
    let cancelled = false
    void restore().then((s) => {
      if (cancelled) return
      if (s) {
        setProjectType(s.projectType)
        setFilename(s.filename)
        setVariables(s.variables)
        setDepResult(s.depResult)
        setMultiEnv(s.multiEnv)
        setActiveEnv(s.activeEnv)
        setCustomEnvs(s.customEnvs)
        setTemplateVars(s.templateVars)
      }
      setHydrated(true)
    })
    return () => {
      cancelled = true
    }
  }, [restore, setHydrated])

  // 状态变化后防抖自动保存（无数据时不保存；敏感值由存储层加密）
  useEffect(() => {
    if (!hydrated || projectType === null) return
    const t = setTimeout(() => {
      void persist({
        projectType,
        filename,
        variables,
        depResult,
        multiEnv,
        activeEnv,
        customEnvs,
        templateVars,
      })
    }, 400)
    return () => clearTimeout(t)
  }, [hydrated, persist, projectType, filename, variables, depResult, multiEnv, activeEnv, customEnvs, templateVars])

  // ===== .env 模式操作 =====
  const handleSaveEnv = useCallback(
    (updated: EnvVariable) => {
      const next = variables.map((v) => (v.id === updated.id ? { ...updated, isNew: false } : v))
      commitVariables(
        updated.isNew ? 'add' : 'edit',
        updated.isNew ? `添加 ${updated.key}` : `编辑 ${updated.key}`,
        next,
        updated.key,
      )
      setEditingEnv(null)
    },
    [variables, commitVariables],
  )

  const handleToggleSensitive = useCallback(
    (id: string) => {
      const target = variables.find((v) => v.id === id)
      const next = variables.map((v) =>
        v.id === id ? { ...v, isSensitive: !v.isSensitive, isModified: true } : v,
      )
      commitVariables('toggle-sensitive', `${target?.key ?? '变量'} 敏感标记`, next, target?.key)
    },
    [variables, commitVariables],
  )

  const handleDeleteEnv = useCallback(
    (id: string) => {
      const target = variables.find((v) => v.id === id)
      const next = variables.filter((v) => v.id !== id)
      commitVariables('delete', `删除 ${target?.key ?? '变量'}`, next, target?.key)
    },
    [variables, commitVariables],
  )

  const handleSync = useCallback(
    (missing: CompareItem[]) => {
      const existing = new Set(variables.map((v) => v.key))
      const toAdd: EnvVariable[] = missing
        .filter((m) => !existing.has(m.key))
        .map((m) => ({
          ...createEmptyVariable(),
          key: m.key,
          value: m.exampleValue ?? '',
          comment: '从 .env.example 同步',
          isNew: true,
        }))
      commitVariables('sync', '从 .env.example 同步缺失项', [...variables, ...toAdd])
    },
    [variables, commitVariables],
  )

  // ===== 密钥泄露检测操作（v1.2.0）=====
  const clearSecretInEnv = useCallback(
    (id: string) => {
      if (!multiEnv || !activeEnv) return
      setMultiEnv((prev) => {
        if (!prev || !activeEnv) return prev
        const envVars = prev.envs[activeEnv] ?? []
        return {
          ...prev,
          envs: {
            ...prev.envs,
            [activeEnv]: envVars.map((v) =>
              v.id === id ? { ...v, value: '', isModified: true } : v,
            ),
          },
        }
      })
    },
    [multiEnv, activeEnv],
  )

  const handleClearSecret = useCallback(
    (id: string) => {
      if (isMultiEnvMode) {
        clearSecretInEnv(id)
        return
      }
      const target = variables.find((v) => v.id === id)
      const next = variables.map((v) =>
        v.id === id ? { ...v, value: '', isModified: true } : v,
      )
      commitVariables('edit', `清除泄露值 ${target?.key ?? ''}`, next, target?.key)
    },
    [isMultiEnvMode, clearSecretInEnv, variables, commitVariables],
  )

  const handleClearAllSecrets = useCallback(
    (ids: string[]) => {
      const idSet = new Set(ids)
      if (isMultiEnvMode) {
        if (!multiEnv || !activeEnv) return
        setMultiEnv((prev) => {
          if (!prev || !activeEnv) return prev
          const envVars = prev.envs[activeEnv] ?? []
          return {
            ...prev,
            envs: {
              ...prev.envs,
              [activeEnv]: envVars.map((v) =>
                idSet.has(v.id) ? { ...v, value: '', isModified: true } : v,
              ),
            },
          }
        })
        return
      }
      const next = variables.map((v) =>
        idSet.has(v.id) ? { ...v, value: '', isModified: true } : v,
      )
      commitVariables('edit', `清除泄露密钥（${ids.length} 个）`, next)
    },
    [isMultiEnvMode, multiEnv, activeEnv, variables, commitVariables],
  )

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
      id: genId(),
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
    setMultiEnv(null)
    setActiveEnv(null)
    setCustomEnvs([])
    setMonorepoOpen(false)
    history.clearHistory()
    clearSession()
  }, [history, clearSession])

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

  // 多环境模式下应用模板：合并到当前激活环境
  const handleApplyTemplateToMultiEnv = useCallback(
    (newVars: EnvVariable[], tplVars: TemplateVariable[]) => {
      if (!multiEnv || !activeEnv) return
      setMultiEnv((prev) => {
        if (!prev || !activeEnv) return prev
        const existing = prev.envs[activeEnv] ?? []
        const existingKeys = new Set(existing.map((v) => v.key))
        const toAdd = newVars.filter((v) => !existingKeys.has(v.key))
        return {
          ...prev,
          envs: {
            ...prev.envs,
            [activeEnv]: [...existing, ...toAdd],
          },
        }
      })
      setTemplateVars((prev) => {
        const map = new Map(prev.map((t) => [t.key, t]))
        for (const t of tplVars) map.set(t.key, t)
        return Array.from(map.values())
      })
    },
    [multiEnv, activeEnv],
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
            ? displayVariables.filter((v) => !v.isDisabled).length
            : depResult?.dependencies.length ?? 0
        }
      />

      <main id="main-content" className="mx-auto max-w-6xl space-y-6 px-4 py-8 sm:px-6">
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
                  {['.env 解析', '依赖管理', '配置模板', '变量校验', '多环境切换', '敏感脱敏', '多格式导出', '暗色模式'].map((t) => (
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

            {/* Monorepo 扫描入口（v1.4.0） */}
            <div className="flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-slate-200 bg-white/80 px-5 py-4 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
              <div className="flex items-center gap-3">
                <div className="flex h-9 w-9 items-center justify-center rounded-xl bg-indigo-100 text-indigo-600 dark:bg-indigo-900/40 dark:text-indigo-300">
                  <svg className="h-4.5 w-4.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                  </svg>
                </div>
                <div>
                  <div className="text-sm font-semibold text-slate-800 dark:text-slate-100">Monorepo 扫描</div>
                  <div className="text-xs text-slate-500 dark:text-slate-400">
                    多选依赖清单文件，聚合查看共享依赖与版本冲突
                  </div>
                </div>
              </div>
              <button
                onClick={() => setMonorepoOpen((v) => !v)}
                aria-expanded={monorepoOpen}
                className={`rounded-lg px-4 py-2 text-sm font-medium transition ${
                  monorepoOpen
                    ? 'bg-slate-100 text-slate-600 hover:bg-slate-200 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700'
                    : 'bg-indigo-600 text-white hover:bg-indigo-700'
                }`}
              >
                {monorepoOpen ? '收起' : '开始扫描'}
              </button>
            </div>
            {monorepoOpen && <MonorepoScan />}

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

            {isEnvMode && isMultiEnvMode && multiEnv && (
              <>
                {/* 多环境切换器 + 追加文件按钮 */}
                <div className="flex flex-wrap items-center gap-3">
                  <div className="flex-1 min-w-[280px]">
                    <EnvSwitcher
                      envOrder={multiEnv.envOrder}
                      activeEnv={activeEnv}
                      envCounts={envCounts}
                      customEnvs={customEnvs}
                      onSelect={setActiveEnv}
                      onAddCustom={handleAddCustomEnv}
                      onRemoveCustom={handleRemoveCustomEnv}
                    />
                  </div>
                  <button
                    onClick={() => appendInputRef.current?.click()}
                    className="rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-medium text-slate-700 transition hover:bg-slate-50 dark:border-slate-600 dark:bg-slate-700 dark:text-slate-200 dark:hover:bg-slate-600"
                    title="追加 .env.xxx 环境文件"
                  >
                    + 追加环境文件
                  </button>
                  <input
                    ref={appendInputRef}
                    type="file"
                    multiple
                    accept=".env,.env.*"
                    className="hidden"
                    onChange={(e) => {
                      if (e.target.files && e.target.files.length > 0) {
                        handleAppendFiles(e.target.files)
                        e.target.value = ''
                      }
                    }}
                  />
                </div>

                {/* 当前环境的变量表格 */}
                <EnvTable
                  variables={displayVariables}
                  issues={displayIssues}
                  hasTemplate={templateVars.length > 0}
                  onEdit={setEditingEnv}
                  onAdd={() => setEditingEnv(createEmptyVariable())}
                  onDelete={handleDeleteMultiEnvVar}
                  onToggleSensitive={handleToggleMultiEnvSensitive}
                  onOpenTemplate={() => setTemplatePickerOpen(true)}
                  canUndo={false}
                  canRedo={false}
                  onUndo={() => {}}
                  onRedo={() => {}}
                  onReplace={(next) => {
                    if (!activeEnv) return
                    setMultiEnv((prev) =>
                      prev ? { ...prev, envs: { ...prev.envs, [activeEnv]: next } } : prev,
                    )
                  }}
                />

                {/* 环境对比 + 多环境导出 */}
                <div className="grid gap-6 lg:grid-cols-2">
                  <EnvDiffView envs={multiEnv.envs} envOrder={multiEnv.envOrder} />
                  <MultiEnvExport envs={multiEnv.envs} envOrder={multiEnv.envOrder} />
                </div>
              </>
            )}

            {isEnvMode && !isMultiEnvMode && (
              <>
                <EnvTable
                  variables={variables}
                  issues={issues}
                  hasTemplate={templateVars.length > 0}
                  onEdit={setEditingEnv}
                  onAdd={() => setEditingEnv(createEmptyVariable())}
                  onDelete={handleDeleteEnv}
                  onToggleSensitive={handleToggleSensitive}
                  onOpenTemplate={() => setTemplatePickerOpen(true)}
                  canUndo={history.canUndo}
                  canRedo={history.canRedo}
                  onUndo={handleUndo}
                  onRedo={handleRedo}
                  onReplace={(next) => commitVariables('replace', '搜索替换', next)}
                />
                <div className="grid gap-6 lg:grid-cols-2">
                  <EnvCompare variables={variables} onSync={handleSync} />
                  <EnvExport variables={variables} />
                </div>
              </>
            )}

            {isEnvMode && (
              <SecretScanPanel
                variables={displayVariables}
                onClear={handleClearSecret}
                onClearAll={handleClearAllSecrets}
              />
            )}

            {isDepMode && depResult && (
              <>
                <DependencyTable
                  dependencies={depResult.dependencies}
                  projectType={depResult.type}
                  meta={depResult.meta}
                  graph={depResult.graph}
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

      <EnvEditor
        variable={editingEnv}
        onSave={isMultiEnvMode ? handleSaveMultiEnvVar : handleSaveEnv}
        onClose={() => setEditingEnv(null)}
      />
      <DependencyEditor dependency={editingDep} onSave={handleSaveDep} onClose={() => setEditingDep(null)} />
      <TemplatePicker
        open={templatePickerOpen}
        variables={displayVariables}
        genId={genId}
        onApply={isMultiEnvMode ? handleApplyTemplateToMultiEnv : handleApplyTemplate}
        onClose={() => setTemplatePickerOpen(false)}
      />

      <footer className="border-t border-slate-200/80 py-6 text-center text-xs text-slate-400 dark:border-slate-800/80">
        <p>EnvBoard · 环境配置可视化管理 · 数据仅在浏览器本地处理</p>
        <p className="mt-1 text-slate-300 dark:text-slate-600">联网查版本为可选功能，需手动开启</p>
      </footer>
    </div>
  )
}
