// 命令执行器：封装 npm / pip / poetry 等子进程调用
import { spawn } from 'node:child_process'
import type { ProjectType } from '../../../src/types/index.ts'

/** 执行命令的选项 */
export interface RunOptions {
  cwd?: string
  /** 是否实时输出到当前进程（默认 true） */
  silent?: boolean
}

/** 执行结果 */
export interface RunResult {
  code: number
  stdout: string
  stderr: string
  success: boolean
}

/**
 * 执行 shell 命令
 */
export function runCommand(command: string, args: string[], options: RunOptions = {}): Promise<RunResult> {
  return new Promise((resolve, reject) => {
    const silent = options.silent ?? false
    const proc = spawn(command, args, {
      cwd: options.cwd ?? process.cwd(),
      shell: process.platform === 'win32',
      stdio: silent ? ['ignore', 'pipe', 'pipe'] : 'inherit',
    })

    let stdout = ''
    let stderr = ''

    if (silent) {
      proc.stdout?.on('data', (data) => (stdout += data.toString()))
      proc.stderr?.on('data', (data) => (stderr += data.toString()))
    }

    proc.on('close', (code) => {
      resolve({
        code: code ?? 1,
        stdout,
        stderr,
        success: code === 0,
      })
    })

    proc.on('error', (err) => {
      reject(new Error(`命令执行失败: ${err.message}`))
    })
  })
}

/**
 * 根据 ProjectType 获取包管理器命令
 */
export function getPackageManager(projectType: ProjectType): { command: string; type: 'npm' | 'pip' | 'poetry' } | null {
  switch (projectType) {
    case 'npm':
    case 'lockfile':
      return { command: 'npm', type: 'npm' }
    case 'pip':
      return { command: 'pip', type: 'pip' }
    case 'poetry':
      return { command: 'poetry', type: 'poetry' }
    default:
      return null
  }
}

/**
 * 检测命令是否可用
 */
export async function commandExists(command: string): Promise<boolean> {
  try {
    const check = process.platform === 'win32' ? 'where' : 'which'
    const result = await runCommand(check, [command], { silent: true })
    return result.success
  } catch {
    return false
  }
}
