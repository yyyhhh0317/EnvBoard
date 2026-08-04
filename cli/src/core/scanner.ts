// 本地文件扫描与读取
import fs from 'node:fs'
import path from 'node:path'
import { detectProjectType } from '../../../src/utils/parser/detector.ts'
import { parseEnvFile } from '../../../src/utils/parser/envParser.ts'
import { parsePackageJson } from '../../../src/utils/parser/packageJsonParser.ts'
import { parseRequirements } from '../../../src/utils/parser/requirementsParser.ts'
import { parsePyproject } from '../../../src/utils/parser/pyprojectParser.ts'
import type { ProjectType } from '../../../src/types/index.ts'

/** 扫描结果 */
export interface ScanResult {
  type: ProjectType
  filename: string
  content: string
  parsed: unknown
  errors: string[]
}

/** 默认扫描的文件名列表（按优先级） */
const SCAN_FILES = [
  '.env',
  'package.json',
  'requirements.txt',
  'pyproject.toml',
  'Pipfile',
  'yarn.lock',
  'pnpm-lock.yaml',
  'package-lock.json',
]

/**
 * 扫描指定目录下的配置文件
 * @param dir 目标目录（默认 cwd）
 * @returns 扫描到的文件列表
 */
export function scanDirectory(dir: string = process.cwd()): ScanResult[] {
  const results: ScanResult[] = []

  for (const filename of SCAN_FILES) {
    const filepath = path.join(dir, filename)
    if (!fs.existsSync(filepath)) continue
    if (!fs.statSync(filepath).isFile()) continue

    try {
      const content = fs.readFileSync(filepath, 'utf-8')
      const type = detectProjectType(filename, content)

      if (type === 'env') {
        const parsed = parseEnvFile(content, filename)
        results.push({ type, filename, content, parsed, errors: parsed.errors })
      } else if (type === 'npm') {
        const parsed = parsePackageJson(content, filename)
        results.push({ type, filename, content, parsed, errors: parsed.errors })
      } else if (type === 'pip') {
        const parsed = parseRequirements(content, filename)
        results.push({ type, filename, content, parsed, errors: parsed.errors })
      } else if (type === 'poetry') {
        const parsed = parsePyproject(content, filename)
        results.push({ type, filename, content, parsed, errors: parsed.errors })
      } else if (type === 'lockfile') {
        // lockfile 暂不深入解析，仅记录存在
        results.push({ type, filename, content, parsed: null, errors: [] })
      }
    } catch (err) {
      results.push({
        type: 'env' as ProjectType,
        filename,
        content: '',
        parsed: null,
        errors: [`读取失败: ${(err as Error).message}`],
      })
    }
  }

  return results
}

/**
 * 读取指定文件
 */
export function readSpecifiedFile(filepath: string): ScanResult {
  const abs = path.resolve(filepath)
  if (!fs.existsSync(abs)) {
    throw new Error(`文件不存在: ${abs}`)
  }
  const content = fs.readFileSync(abs, 'utf-8')
  const filename = path.basename(abs)
  const type = detectProjectType(filename, content)

  if (type === 'env') {
    const parsed = parseEnvFile(content, filename)
    return { type, filename, content, parsed, errors: parsed.errors }
  } else if (type === 'npm') {
    const parsed = parsePackageJson(content, filename)
    return { type, filename, content, parsed, errors: parsed.errors }
  } else if (type === 'pip') {
    const parsed = parseRequirements(content, filename)
    return { type, filename, content, parsed, errors: parsed.errors }
  } else if (type === 'poetry') {
    const parsed = parsePyproject(content, filename)
    return { type, filename, content, parsed, errors: parsed.errors }
  }

  return { type, filename, content, parsed: null, errors: ['未知文件类型'] }
}
