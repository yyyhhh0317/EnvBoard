// 环境变量对比工具
import type { CompareItem, EnvVariable } from '../../types'

/**
 * 对比当前变量列表与 example 变量列表。
 * - missing: example 有而当前没有
 * - extra: 当前有而 example 没有
 * - empty: 两边都有但当前值为空
 * - match: 两边都有且当前值非空
 */
export function compareVariables(
  current: EnvVariable[],
  example: EnvVariable[],
): CompareItem[] {
  // 仅对比未禁用的变量
  const currentMap = new Map<string, EnvVariable>()
  current
    .filter((v) => !v.isDisabled && v.key)
    .forEach((v) => currentMap.set(v.key, v))

  const exampleMap = new Map<string, EnvVariable>()
  example
    .filter((v) => !v.isDisabled && v.key)
    .forEach((v) => exampleMap.set(v.key, v))

  const result: CompareItem[] = []
  const allKeys = new Set<string>([...currentMap.keys(), ...exampleMap.keys()])

  allKeys.forEach((key) => {
    const cur = currentMap.get(key)
    const ex = exampleMap.get(key)

    if (cur && ex) {
      result.push({
        key,
        status: cur.value.trim() === '' ? 'empty' : 'match',
        currentValue: cur.value,
        exampleValue: ex.value,
      })
    } else if (!cur && ex) {
      result.push({
        key,
        status: 'missing',
        exampleValue: ex.value,
      })
    } else if (cur && !ex) {
      result.push({
        key,
        status: 'extra',
        currentValue: cur.value,
      })
    }
  })

  // 排序：缺失 > 空值 > 多余 > 匹配
  const order: Record<string, number> = { missing: 0, empty: 1, extra: 2, match: 3 }
  result.sort((a, b) => order[a.status] - order[b.status] || a.key.localeCompare(b.key))
  return result
}
