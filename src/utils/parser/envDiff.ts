// 环境对比工具：计算多环境间的 key 差异
import type { EnvDiffItem, EnvName, EnvVariable } from '../../types'

/**
 * 计算多环境对比结果。
 * @param envs 环境名 -> 变量列表
 * @param envOrder 环境顺序
 * @returns 按 key 排序的对比项列表
 */
export function diffEnvs(
  envs: Record<EnvName, EnvVariable[]>,
  envOrder: EnvName[],
): EnvDiffItem[] {
  // 收集所有 key（保留首次出现顺序）
  const keyOrder: string[] = []
  const keySet = new Set<string>()
  for (const envName of envOrder) {
    const vars = envs[envName] ?? []
    for (const v of vars) {
      if (v.isDisabled) continue
      if (!keySet.has(v.key)) {
        keySet.add(v.key)
        keyOrder.push(v.key)
      }
    }
  }

  const items: EnvDiffItem[] = []
  for (const key of keyOrder) {
    const values: Record<EnvName, string | undefined> = {}
    const presentIn: EnvName[] = []
    const missingIn: EnvName[] = []
    const valueSet = new Set<string>()

    for (const envName of envOrder) {
      const vars = envs[envName] ?? []
      const v = vars.find((x) => x.key === key && !x.isDisabled)
      if (v) {
        values[envName] = v.value
        presentIn.push(envName)
        if (v.value) valueSet.add(v.value)
      } else {
        values[envName] = undefined
        missingIn.push(envName)
      }
    }

    let status: EnvDiffItem['status']
    if (missingIn.length === 0) {
      // 所有环境都有该 key
      status = valueSet.size <= 1 ? 'same' : 'different'
    } else {
      // 部分环境缺失
      status = 'partial-missing'
    }

    items.push({ key, values, status, presentIn, missingIn })
  }

  return items
}

/** 统计对比结果 */
export function summarizeDiff(items: EnvDiffItem[]): {
  same: number
  different: number
  partialMissing: number
  total: number
} {
  let same = 0
  let different = 0
  let partialMissing = 0
  for (const item of items) {
    if (item.status === 'same') same++
    else if (item.status === 'different') different++
    else partialMissing++
  }
  return { same, different, partialMissing, total: items.length }
}
