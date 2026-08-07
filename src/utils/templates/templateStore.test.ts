// @vitest-environment node
const store = new Map<string, string>()
Object.defineProperty(globalThis, 'localStorage', {
  value: {
    getItem: (k: string) => store.get(k) ?? null,
    setItem: (k: string, v: string) => void store.set(k, v),
    removeItem: (k: string) => void store.delete(k),
    clear: () => void store.clear(),
  },
  configurable: true,
})

import { beforeEach, describe, expect, it } from 'vitest'
import type { ConfigTemplate, EnvVariable } from '../../types'
import {
  addCustomTemplate,
  deleteCustomTemplate,
  genTemplateId,
  loadCustomTemplates,
  saveCustomTemplates,
  templateToVariables,
  variablesToTemplate,
} from './templateStore'

function makeTpl(id = 't1', name = '测试模板'): ConfigTemplate {
  return { id, name, description: 'desc', category: 'custom', variables: [] }
}

function makeVar(key: string, value: string): EnvVariable {
  return {
    id: key,
    key,
    value,
    comment: '',
    isSensitive: false,
    isDisabled: false,
    isModified: false,
    isNew: false,
    error: null,
    line: 0,
  }
}

beforeEach(() => store.clear())

describe('templateStore', () => {
  it('returns empty list when nothing stored', () => {
    expect(loadCustomTemplates()).toEqual([])
  })

  it('roundtrips save / load / add / delete', () => {
    saveCustomTemplates([makeTpl('a')])
    expect(loadCustomTemplates().map((t) => t.id)).toEqual(['a'])
    addCustomTemplate(makeTpl('b'))
    expect(loadCustomTemplates().map((t) => t.id)).toEqual(['a', 'b'])
    // 同 id 覆盖
    addCustomTemplate({ ...makeTpl('a'), name: '覆盖' })
    expect(loadCustomTemplates().find((t) => t.id === 'a')?.name).toBe('覆盖')
    expect(loadCustomTemplates()).toHaveLength(2)
    deleteCustomTemplate('a')
    expect(loadCustomTemplates().map((t) => t.id)).toEqual(['b'])
  })

  it('tolerates corrupt storage', () => {
    store.set('envboard:custom-templates', '{corrupt')
    expect(loadCustomTemplates()).toEqual([])
    store.set('envboard:custom-templates', '{"not":"array"}')
    expect(loadCustomTemplates()).toEqual([])
  })

  it('templateToVariables converts with placeholder and isNew', () => {
    const tpl = makeTpl()
    tpl.variables = [
      { key: 'HOST', placeholder: 'localhost', comment: '主机', isSensitive: false, expectedType: 'string' },
      { key: 'TOKEN', placeholder: 'x', comment: '', isSensitive: true },
    ]
    let n = 0
    const vars = templateToVariables(tpl, () => `id-${n++}`)
    expect(vars[0]).toMatchObject({ key: 'HOST', value: 'localhost', isNew: true, isSensitive: false })
    expect(vars[1].isSensitive).toBe(true)
    expect(vars[0].id).toBe('id-0')
  })

  it('variablesToTemplate keeps key/placeholder/comment/sensitive and skips disabled/empty', () => {
    const vars = [
      makeVar('A', '1'),
      { ...makeVar('B', '2'), isDisabled: true },
      { ...makeVar('', 'x'), isSensitive: true },
    ]
    const tpl = variablesToTemplate('c1', '名称', '描述', vars)
    expect(tpl.category).toBe('custom')
    expect(tpl.variables).toHaveLength(1)
    expect(tpl.variables[0]).toEqual({ key: 'A', placeholder: '1', comment: '', isSensitive: false })
  })

  it('genTemplateId produces unique ids', () => {
    const ids = new Set(Array.from({ length: 20 }, () => genTemplateId()))
    expect(ids.size).toBe(20)
  })
})
