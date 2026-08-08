// 顶部导航栏
import type { Theme } from '../../types'
import { useI18n } from '../../i18n/index.tsx'

interface HeaderProps {
  theme: Theme
  onToggleTheme: () => void
  filename: string | null
  variableCount: number
}

export function Header({ theme, onToggleTheme, filename, variableCount }: HeaderProps) {
  const { t, toggleLang, lang } = useI18n()
  return (
    <header className="sticky top-0 z-20 border-b border-slate-200/80 bg-white/70 backdrop-blur-lg dark:border-slate-800/80 dark:bg-slate-950/70">
      {/* 无障碍：跳过导航直达主内容 */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-3 focus:z-50 focus:rounded-lg focus:bg-emerald-600 focus:px-4 focus:py-2 focus:text-sm focus:font-medium focus:text-white"
      >
        {t('header.skipToContent')}
      </a>
      <div className="mx-auto flex max-w-7xl items-center justify-between px-4 py-3.5 sm:px-6">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-400 to-teal-500 shadow-sm shadow-emerald-500/20">
            <svg viewBox="0 0 64 64" fill="none" className="h-6 w-6">
              <rect width="64" height="64" rx="14" fill="#10b981"/>
              <path d="M18 20h28M18 32h28M18 44h18" stroke="#fff" strokeWidth={4} strokeLinecap="round"/>
              <circle cx="46" cy="44" r="4" fill="#fff"/>
            </svg>
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-slate-900 dark:text-white">
              EnvBoard
            </h1>
            <p className="hidden text-xs text-slate-500 dark:text-slate-400 sm:block">
              {t('header.title')}
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {filename && (
            <div className="hidden items-center gap-2 rounded-full border border-emerald-200/60 bg-emerald-50/80 px-3 py-1.5 text-xs font-medium text-emerald-700 dark:border-emerald-800/60 dark:bg-emerald-950/40 dark:text-emerald-300 sm:flex">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
                <span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-500" />
              </span>
              {filename} · {variableCount} 项
            </div>
          )}
          <button
            onClick={toggleLang}
            className="rounded-xl border border-slate-200 bg-white px-3 py-2 text-xs font-semibold text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            title={t('header.switchLang')}
            aria-label={t('header.switchLang')}
          >
            {lang === 'zh' ? 'EN' : '中'}
          </button>
          <button
            onClick={onToggleTheme}
            className="rounded-xl border border-slate-200 bg-white p-2 text-slate-600 shadow-sm transition hover:bg-slate-50 hover:text-slate-900 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-300 dark:hover:bg-slate-700 dark:hover:text-white"
            title={t('header.themeToggle')}
            aria-label={t('header.themeToggle')}
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
