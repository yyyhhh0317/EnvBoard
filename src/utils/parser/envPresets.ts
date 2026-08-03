// 预设环境定义与文件名识别
import type { EnvMeta, EnvName, PresetEnv } from '../../types'

/** 预设环境元信息（顺序即展示顺序） */
export const PRESET_ENVS: EnvMeta[] = [
  { name: 'development', label: '开发', color: 'emerald', isPreset: true },
  { name: 'test', label: '测试', color: 'amber', isPreset: true },
  { name: 'staging', label: '预发布', color: 'purple', isPreset: true },
  { name: 'production', label: '生产', color: 'rose', isPreset: true },
]

/** 预设环境名集合 */
export const PRESET_ENV_NAMES = new Set<string>(PRESET_ENVS.map((e) => e.name))

/** 预设环境别名 → 标准名（用于文件名识别） */
const ENV_ALIASES: Record<string, PresetEnv> = {
  dev: 'development',
  development: 'development',
  test: 'test',
  testing: 'test',
  staging: 'staging',
  stage: 'staging',
  prod: 'production',
  production: 'production',
}

/**
 * 从文件名识别环境。
 * 支持 .env.development / .env.dev / .env.production / .env.local 等。
 * 返回 null 表示无法识别（如纯 .env）。
 */
export function detectEnvFromFilename(filename: string): EnvName | null {
  // 取 basename
  const base = filename.split(/[\\/]/).pop() ?? filename
  // 去掉 .env 前缀后的部分
  const m = base.match(/^\.env(?:\.([a-z0-9_-]+))?(?:\.(?:local|example|template))?$/i)
  if (!m) return null
  const seg = m[1]?.toLowerCase()
  if (!seg) return null
  // .env.local / .env.example 不算环境
  if (['local', 'example', 'template', 'sample'].includes(seg)) return null
  return ENV_ALIASES[seg] ?? seg
}

/** 获取环境元信息（预设或构造自定义） */
export function getEnvMeta(name: EnvName, filename?: string): EnvMeta {
  const preset = PRESET_ENVS.find((e) => e.name === name)
  if (preset) {
    return filename ? { ...preset, filename } : preset
  }
  // 自定义环境：分配默认颜色（循环取色）
  const colors = ['cyan', 'blue', 'teal', 'indigo', 'pink', 'orange']
  const idx = Array.from(name).reduce((acc, ch) => acc + ch.charCodeAt(0), 0) % colors.length
  return {
    name,
    label: name,
    color: colors[idx],
    filename,
    isPreset: false,
  }
}

/** 生成自定义环境唯一名 */
export function genEnvName(customEnvs: EnvName[]): string {
  let i = 1
  while (customEnvs.includes(`custom-${i}`)) i++
  return `custom-${i}`
}
