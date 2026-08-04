// 配置文件写入器：安全修改 package.json / requirements.txt / .env
import fs from 'node:fs'
import path from 'node:path'
import { parseRequirements } from '../../../src/utils/parser/requirementsParser.ts'
import { parsePackageJson } from '../../../src/utils/parser/packageJsonParser.ts'
import type { Dependency } from '../../../src/types/index.ts'

/**
 * 修改 package.json 中的依赖版本
 * 保留 JSON 结构与缩进格式
 */
export function writePackageJson(
  filepath: string,
  updates: { name: string; version?: string; category: string; action: 'update' | 'remove' }[],
): void {
  const raw = fs.readFileSync(filepath, 'utf-8')
  const pkg = JSON.parse(raw)
  const indent = raw.includes('\n  ') ? 2 : 4

  for (const u of updates) {
    const section = u.category as 'dependencies' | 'devDependencies' | 'peerDependencies' | 'optionalDependencies'
    if (!pkg[section]) continue

    if (u.action === 'remove') {
      delete pkg[section][u.name]
    } else if (u.version) {
      pkg[section][u.name] = u.version
    }
  }

  fs.writeFileSync(filepath, JSON.stringify(pkg, null, indent) + '\n', 'utf-8')
}

/**
 * 修改 requirements.txt：更新版本或删除依赖
 * 尽量保留注释分组结构
 */
export function writeRequirements(
  filepath: string,
  updates: { name: string; versionSpec?: string; action: 'update' | 'remove' }[],
): void {
  const content = fs.readFileSync(filepath, 'utf-8')
  const lines = content.split(/\r?\n/)
  const parsed = parseRequirements(content, path.basename(filepath))

  // 构建 name -> dependency 映射
  const depMap = new Map<string, Dependency>()
  for (const dep of parsed.dependencies) {
    depMap.set(dep.name.toLowerCase(), dep)
  }

  const updateMap = new Map<string, { versionSpec?: string; action: 'update' | 'remove' }>()
  for (const u of updates) {
    updateMap.set(u.name.toLowerCase(), u)
  }

  const newLines: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    // 跳过注释与空行（原样保留）
    if (trimmed === '' || trimmed.startsWith('#')) {
      newLines.push(line)
      continue
    }

    // 尝试匹配依赖名
    const dep = matchRequirementLine(trimmed, depMap)
    if (dep && updateMap.has(dep.name.toLowerCase())) {
      const u = updateMap.get(dep.name.toLowerCase())!
      if (u.action === 'remove') {
        // 删除：跳过此行
        continue
      } else if (u.versionSpec) {
        // 更新版本
        newLines.push(`${dep.name}${u.versionSpec}`)
        continue
      }
    }
    newLines.push(line)
  }

  fs.writeFileSync(filepath, newLines.join('\n'), 'utf-8')
}

/** 匹配 requirements.txt 行到依赖项 */
function matchRequirementLine(line: string, depMap: Map<string, Dependency>): Dependency | null {
  // 提取包名（支持 name==1.0 / name>=1.0 / name<2.0 / name 等）
  const m = line.match(/^([a-zA-Z0-9_-]+)/)
  if (!m) return null
  return depMap.get(m[1].toLowerCase()) ?? null
}

/**
 * 修改 .env 文件：更新变量值或删除变量
 * 保留注释与空行结构
 */
export function writeEnvFile(
  filepath: string,
  updates: { key: string; value?: string; action: 'update' | 'remove' }[],
): void {
  const content = fs.readFileSync(filepath, 'utf-8')
  const lines = content.split(/\r?\n/)

  const updateMap = new Map<string, { value?: string; action: 'update' | 'remove' }>()
  for (const u of updates) {
    updateMap.set(u.key, u)
  }

  const newLines: string[] = []
  for (const line of lines) {
    const trimmed = line.trim()
    if (trimmed === '' || trimmed.startsWith('#')) {
      newLines.push(line)
      continue
    }

    const eqIdx = line.indexOf('=')
    if (eqIdx === -1) {
      newLines.push(line)
      continue
    }

    const key = line.slice(0, eqIdx).trim()
    if (updateMap.has(key)) {
      const u = updateMap.get(key)!
      if (u.action === 'remove') {
        continue
      } else if (u.value !== undefined) {
        newLines.push(`${key}=${u.value}`)
        continue
      }
    }
    newLines.push(line)
  }

  fs.writeFileSync(filepath, newLines.join('\n'), 'utf-8')
}
