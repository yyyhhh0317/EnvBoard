// Monorepo 扫描区：多文件上传 + 聚合结果展示
import { useMemo, useRef, useState } from 'react'
import type { MonorepoScanResult } from '../../types'
import { scanMonorepo } from '../../utils/monorepo/monorepoScan'

const TYPE_LABEL: Record<string, string> = {
  npm: 'npm',
  pip: 'pip',
  poetry: 'poetry',
}

/** 依赖分类中文标签 */
const CATEGORY_LABEL: Record<string, string> = {
  dependencies: 'dependencies',
  devDependencies: 'devDependencies',
  peerDependencies: 'peerDependencies',
  optionalDependencies: 'optionalDependencies',
  scripts: 'scripts',
  engines: 'engines',
}

export function MonorepoScan() {
  const inputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const [result, setResult] = useState<MonorepoScanResult | null>(null)
  const [scanning, setScanning] = useState(false)
  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const readFiles = (files: FileList | File[]) => {
    setScanning(true)
    const readers = Array.from(files).map(
      (file) =>
        new Promise<{ filename: string; content: string }>((resolve) => {
          const reader = new FileReader()
          reader.onload = (e) => {
            resolve({ filename: file.name, content: String(e.target?.result ?? '') })
          }
          reader.readAsText(file, 'utf-8')
        }),
    )
    Promise.all(readers).then((items) => {
      setResult(scanMonorepo(items))
      setExpanded(new Set())
      setScanning(false)
    })
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files
    if (files && files.length > 0) readFiles(files)
    // 清空 value，允许重复选择同一批文件
    e.target.value = ''
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const files = e.dataTransfer.files
    if (files && files.length > 0) readFiles(files)
  }

  const toggleExpand = (name: string) => {
    setExpanded((prev) => {
      const next = new Set(prev)
      if (next.has(name)) next.delete(name)
      else next.add(name)
      return next
    })
  }

  const realDeps = useMemo(
    () => (result ? result.packages.map((p) => p.dependencies.filter((d) => !d.isScript && !d.isMeta)) : []),
    [result],
  )

  return (
    <div className="rounded-2xl border border-slate-200 bg-white/80 p-6 shadow-sm backdrop-blur dark:border-slate-800 dark:bg-slate-900/50">
      <div className="mb-4 flex items-center gap-2">
        <svg className="h-5 w-5 text-slate-500 dark:text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
        </svg>
        <h2 className="text-base font-semibold text-slate-900 dark:text-white">Monorepo 扫描</h2>
      </div>
      <p className="mb-4 text-xs text-slate-500 dark:text-slate-400">
        一次选择多个依赖清单（package.json / requirements.txt / pyproject.toml），聚合查看各包依赖、共享依赖与版本冲突。
      </p>

      {/* 上传区 */}
      <div
        onDragOver={(e) => {
          e.preventDefault()
          setDragging(true)
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={handleDrop}
        onClick={() => inputRef.current?.click()}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-8 text-center transition ${
          dragging
            ? 'border-indigo-500 bg-indigo-50/80 dark:bg-indigo-950/30'
            : 'border-slate-300 hover:border-indigo-400 hover:bg-slate-50/80 dark:border-slate-700 dark:hover:border-indigo-500 dark:hover:bg-slate-800/50'
        }`}
      >
        <div className={`mb-2 flex h-10 w-10 items-center justify-center rounded-xl transition ${
          dragging
            ? 'bg-indigo-100 text-indigo-600 dark:bg-indigo-900/50 dark:text-indigo-300'
            : 'bg-slate-100 text-slate-400 dark:bg-slate-800'
        }`}>
          <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.8}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
          </svg>
        </div>
        <p className="text-sm font-medium text-slate-600 dark:text-slate-300">
          {scanning ? '扫描中…' : '点击选择多个文件，或拖拽到此处'}
        </p>
        <p className="mt-1 text-xs text-slate-400">支持多选，混合格式亦可（如 apps/web/package.json + libs/utils/pyproject.toml）</p>
        <input
          ref={inputRef}
          type="file"
          multiple
          accept=".json,.toml,.txt,text/plain,application/json,text/toml"
          className="hidden"
          onChange={handleFileChange}
        />
      </div>

      {/* 结果 */}
      {result && (
        <div className="mt-5 space-y-4">
          {/* 统计 */}
          <div className="flex flex-wrap items-center gap-2 text-xs">
            <span className="rounded-full bg-indigo-100 px-3 py-1 font-medium text-indigo-700 dark:bg-indigo-900/40 dark:text-indigo-300">
              包 {result.packages.length}
            </span>
            <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-600 dark:bg-slate-800 dark:text-slate-300">
              共享依赖 {result.sharedDeps.length}
            </span>
            {result.conflicts.length > 0 ? (
              <span className="rounded-full bg-red-100 px-3 py-1 font-medium text-red-700 dark:bg-red-900/40 dark:text-red-300">
                版本冲突 {result.conflicts.length}
              </span>
            ) : (
              <span className="rounded-full bg-emerald-100 px-3 py-1 font-medium text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300">
                无版本冲突
              </span>
            )}
            {result.workspaces.length > 0 && (
              <span className="rounded-full bg-amber-100 px-3 py-1 font-mono font-medium text-amber-700 dark:bg-amber-900/40 dark:text-amber-300">
                workspaces: {result.workspaces.join(', ')}
              </span>
            )}
            {!result.isMonorepo && (
              <span className="rounded-full bg-slate-100 px-3 py-1 font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                未检测到 monorepo 特征（仅 1 个包且无 workspaces）
              </span>
            )}
          </div>

          {result.errors.length > 0 && (
            <div className="rounded-xl border border-amber-200 bg-amber-50 px-4 py-3 dark:border-amber-800 dark:bg-amber-900/20">
              <ul className="list-inside list-disc space-y-0.5 text-xs text-amber-700 dark:text-amber-400">
                {result.errors.map((e, i) => (
                  <li key={i}>{e}</li>
                ))}
              </ul>
            </div>
          )}

          {/* 版本冲突（置顶醒目） */}
          {result.conflicts.length > 0 && (
            <div className="rounded-xl border border-red-200 bg-red-50/70 dark:border-red-800 dark:bg-red-900/20">
              <div className="flex items-center gap-2 border-b border-red-200/80 px-4 py-2.5 text-sm font-semibold text-red-700 dark:border-red-800/80 dark:text-red-300">
                <svg className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01M5 19h14a2 2 0 001.84-2.75L13.74 4a2 2 0 00-3.48 0L3.16 16.25A2 2 0 005 19z" />
                </svg>
                版本冲突（{result.conflicts.length}）
              </div>
              <div className="divide-y divide-red-200/60 dark:divide-red-800/60">
                {result.conflicts.map((c) => (
                  <div key={c.name} className="px-4 py-2.5">
                    <div className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{c.name}</div>
                    <div className="mt-1 space-y-0.5 text-xs">
                      {c.versions.map((v, i) => (
                        <div key={i} className="flex flex-wrap gap-1.5">
                          <span className="font-mono text-red-600 dark:text-red-400">{v.versionSpec}</span>
                          <span className="text-slate-400">← {v.package}</span>
                        </div>
                      ))}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* 共享依赖 */}
          {result.sharedDeps.length > 0 && (
            <div className="rounded-xl border border-slate-200 dark:border-slate-700">
              <div className="border-b border-slate-200 px-4 py-2.5 text-sm font-semibold text-slate-700 dark:border-slate-700 dark:text-slate-200">
                共享依赖（{result.sharedDeps.length}）
              </div>
              <div className="max-h-64 overflow-y-auto">
                <table className="w-full text-left text-xs">
                  <thead className="sticky top-0 bg-slate-50 text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                    <tr>
                      <th className="px-4 py-2 font-medium">依赖</th>
                      <th className="px-4 py-2 font-medium">版本约束</th>
                      <th className="px-4 py-2 font-medium">声明包</th>
                      <th className="px-4 py-2 font-medium">状态</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                    {result.sharedDeps.map((d) => (
                      <tr key={d.name}>
                        <td className="px-4 py-2 font-mono font-medium text-slate-800 dark:text-slate-100">{d.name}</td>
                        <td className="px-4 py-2">
                          <div className="space-y-0.5">
                            {[...new Set(d.declaredBy.map((x) => x.versionSpec))].map((v) => (
                              <div key={v} className="font-mono text-slate-600 dark:text-slate-300">{v}</div>
                            ))}
                          </div>
                        </td>
                        <td className="px-4 py-2 text-slate-500 dark:text-slate-400">
                          {d.declaredBy.map((x) => x.package).join(', ')}
                        </td>
                        <td className="px-4 py-2">
                          {d.hasConflict ? (
                            <span className="rounded bg-red-100 px-1.5 py-0.5 font-medium text-red-600 dark:bg-red-900/40 dark:text-red-300">冲突</span>
                          ) : (
                            <span className="rounded bg-emerald-100 px-1.5 py-0.5 font-medium text-emerald-600 dark:bg-emerald-900/40 dark:text-emerald-300">一致</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* 包列表 */}
          <div className="space-y-2">
            {result.packages.map((pkg, pIdx) => {
              const isOpen = expanded.has(pkg.name)
              const deps = realDeps[pIdx] ?? []
              return (
                <div key={`${pkg.name}-${pIdx}`} className="rounded-xl border border-slate-200 dark:border-slate-700">
                  <button
                    onClick={() => toggleExpand(pkg.name)}
                    aria-expanded={isOpen}
                    className="flex w-full items-center gap-2 px-4 py-2.5 text-left"
                  >
                    <svg
                      className={`h-3.5 w-3.5 shrink-0 text-slate-400 transition-transform ${isOpen ? 'rotate-90' : ''}`}
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                    </svg>
                    <span className="font-mono text-sm font-semibold text-slate-800 dark:text-slate-100">{pkg.name}</span>
                    <span className="rounded bg-slate-100 px-1.5 py-0.5 text-[10px] font-medium text-slate-500 dark:bg-slate-800 dark:text-slate-400">
                      {TYPE_LABEL[pkg.type] ?? pkg.type}
                    </span>
                    <span className="text-xs text-slate-400">{pkg.filename}</span>
                    <span className="ml-auto text-xs text-slate-400">{deps.length} 项依赖</span>
                  </button>
                  {isOpen && (
                    <div className="border-t border-slate-100 px-4 py-2 dark:border-slate-800">
                      {pkg.errors.length > 0 && (
                        <ul className="list-inside list-disc space-y-0.5 py-1 text-xs text-amber-600 dark:text-amber-400">
                          {pkg.errors.map((e, i) => (
                            <li key={i}>{e}</li>
                          ))}
                        </ul>
                      )}
                      {deps.length === 0 ? (
                        <p className="py-2 text-xs text-slate-400">无依赖项</p>
                      ) : (
                        <table className="w-full text-left text-xs">
                          <tbody className="divide-y divide-slate-100 dark:divide-slate-800">
                            {deps.map((d) => (
                              <tr key={d.id}>
                                <td className="px-2 py-1.5 font-mono text-slate-800 dark:text-slate-100">{d.name}</td>
                                <td className="px-2 py-1.5 font-mono text-slate-500 dark:text-slate-400">{d.versionSpec}</td>
                                <td className="px-2 py-1.5 text-slate-400">{CATEGORY_LABEL[d.category] ?? d.category}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                      )}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
