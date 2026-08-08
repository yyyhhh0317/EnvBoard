// 轻量 i18n（v2.0.0）：零依赖，Context + 扁平 key 字典
import { createContext, useCallback, useContext, useMemo, useState } from 'react'
import type { ReactNode } from 'react'
import { zh } from './zh'
import { en } from './en'

export type Lang = 'zh' | 'en'

export const messages: Record<Lang, Record<string, string>> = { zh, en }

const STORAGE_KEY = 'envboard:lang'

/** 初始语言：本地记忆 > 浏览器语言 > 中文 */
export function detectLang(): Lang {
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved === 'en' || saved === 'zh') return saved
  } catch {
    // localStorage 不可用时静默降级
  }
  if (typeof navigator !== 'undefined') {
    const nav = (navigator.language ?? '').toLowerCase()
    if (nav.startsWith('en')) return 'en'
  }
  return 'zh'
}

export function translate(lang: Lang, key: string, params?: Record<string, string | number>): string {
  const template = messages[lang][key] ?? messages.zh[key] ?? key
  if (!params) return template
  return template.replace(/\{(\w+)\}/g, (_, name: string) =>
    name in params ? String(params[name]) : `{${name}}`,
  )
}

interface I18nValue {
  lang: Lang
  setLang: (l: Lang) => void
  toggleLang: () => void
  t: (key: string, params?: Record<string, string | number>) => string
}

const I18nContext = createContext<I18nValue | null>(null)

export function I18nProvider({ children }: { children: ReactNode }) {
  const [lang, setLangState] = useState<Lang>(detectLang)

  const setLang = useCallback((l: Lang) => {
    setLangState(l)
    try {
      localStorage.setItem(STORAGE_KEY, l)
    } catch {
      // 忽略存储失败
    }
    // 同步 html lang 属性
    document.documentElement.lang = l === 'zh' ? 'zh-CN' : 'en'
  }, [])

  const toggleLang = useCallback(() => {
    setLang(lang === 'zh' ? 'en' : 'zh')
  }, [lang, setLang])

  const t = useCallback(
    (key: string, params?: Record<string, string | number>) => translate(lang, key, params),
    [lang],
  )

  const value = useMemo<I18nValue>(() => ({ lang, setLang, toggleLang, t }), [lang, setLang, toggleLang, t])

  return <I18nContext.Provider value={value}>{children}</I18nContext.Provider>
}

export function useI18n(): I18nValue {
  const ctx = useContext(I18nContext)
  if (!ctx) throw new Error('useI18n 必须在 I18nProvider 内使用')
  return ctx
}
