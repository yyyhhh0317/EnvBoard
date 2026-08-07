// env 类格式统一入口（v1.3.0）：按文件名/内容在 .env / .ini / .properties 间路由
import type { ParseResult } from '../../types'
import { parseEnvFile } from './envParser'
import { parseIni } from './iniParser'
import { parseProperties } from './propertiesParser'

/**
 * 解析任意 env 类配置文件为 EnvVariable[]。
 * 判定优先级：文件名扩展名 > 内容信号（[section] → ini；点分小写 key → properties）> 默认 .env。
 */
export function parseEnvLike(content: string, filename = '.env'): ParseResult {
  const name = filename.toLowerCase()
  if (name.endsWith('.ini')) return parseIni(content, filename)
  if (name.endsWith('.properties')) return parseProperties(content, filename)

  const trimmed = content.trim()
  if (!trimmed) return parseEnvFile(content, filename)

  // 内容信号：出现 [section] 段 → ini
  if (/^\[[^\]]+\]/m.test(trimmed)) {
    return parseIni(content, filename)
  }
  // 内容信号：点分小写 key（如 spring.datasource.url=...）→ properties
  if (/^[a-z0-9_.-]+\.[a-z0-9_.-]+\s*[:=]\s*\S/m.test(trimmed)) {
    return parseProperties(content, filename)
  }
  return parseEnvFile(content, filename)
}
