// 顶部导航栏
import type { Theme } from '../../types'

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
  filename: string | null
  variableCount: number
}

export function Header({ theme, onToggleTheme, filename, variableCount }: HeaderProps) {
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200 bg-white/80 backdrop-blur dark:border-slate-700 dark:bg-slate-900/80">
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <img src="/env.svg" alt="EnvBoard" className="h-9 w-9" />
          <div>
            <h1 className="text-lg font-bold text-slate-900 dark:text-white">
              EnvBoard
            </h1>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              环境变量可视化管理工具
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {filename && (
            <div className="hidden items-center gap-2 rounded-full bg-emerald-50 px-3 py-1 text-xs font-medium text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300 sm:flex">
              <span className="h-2 w-2 rounded-full bg-emerald-500" />
              {filename} · {variableCount} 个变量
            </div>
          )}
          <button
            onClick={onToggleTheme}
            className="rounded-lg border border-slate-200 bg-white p-2 text-slate-600 transition hover:bg-slate-100 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700"
            title={theme === 'light' ? '切换到暗色模式' : '切换到浅色模式'}
            aria-label="切换主题"
          >
            {theme === 'light' ? (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M21 12.79A9 9 0 1111.21 3 7 7 0 0021 12.79z" />
              </svg>
            ) : (
              <svg className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M12 3v1m0 16v1m9-9h-1M4 12H3m15.364 6.364l-.707-.707M6.343 6.343l-.707-.707m12.728 0l-.707.707M6.343 17.657l-.707.707M16 12a4 4 0 11-8 0 4 4 0 018 0z" />
              </svg>
            )}
          </button>
        </div>
      </div>
    </header>
  )
}
