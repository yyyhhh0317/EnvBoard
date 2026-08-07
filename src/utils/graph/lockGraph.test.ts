import { describe, it, expect } from 'vitest'
import { buildLockGraph } from './lockGraph'

function lock(packages: Record<string, unknown>, name = 'demo', version = '1.0.0') {
  return { name, version, packages } as never
}

describe('buildLockGraph', () => {
  it('builds a nested tree from package-lock v3', () => {
    const g = buildLockGraph(
      lock({
        '': { name: 'demo', version: '1.0.0', dependencies: { react: '^18.0.0' } },
        'node_modules/react': { version: '18.3.1', dependencies: { 'loose-envify': '^1.1.0' } },
        'node_modules/loose-envify': { version: '1.4.0' },
      }),
    )
    expect(g).not.toBeNull()
    expect(g!.name).toBe('demo')
    expect(g!.children).toHaveLength(1)
    const react = g!.children[0]
    expect(react).toMatchObject({ name: 'react', version: '18.3.1', spec: '^18.0.0' })
    expect(react.children[0]).toMatchObject({ name: 'loose-envify', version: '1.4.0' })
  })

  it('marks cycles as duplicated and stops expanding', () => {
    const g = buildLockGraph(
      lock({
        '': { dependencies: { a: '1.0.0' } },
        'node_modules/a': { version: '1.0.0', dependencies: { b: '1.0.0' } },
        'node_modules/b': { version: '1.0.0', dependencies: { a: '1.0.0' } },
      }),
    )
    const a = g!.children[0]
    const b = a.children[0]
    expect(b.duplicated).toBe(false)
    expect(b.children[0].name).toBe('a')
    expect(b.children[0].duplicated).toBe(true)
    expect(b.children[0].children).toEqual([])
  })

  it('falls back to any entry with the same leaf name', () => {
    const g = buildLockGraph(
      lock({
        '': { dependencies: { b: '1.0.0' } },
        'node_modules/a/node_modules/b': { version: '2.0.0' },
      }),
    )
    expect(g!.children[0]).toMatchObject({ name: 'b', version: '2.0.0' })
  })

  it('returns null when packages is missing or empty', () => {
    expect(buildLockGraph({ name: 'x' } as never)).toBeNull()
    expect(buildLockGraph(lock({}))).toBeNull()
  })

  it('keeps leaf without dependencies as empty children', () => {
    const g = buildLockGraph(lock({ '': { dependencies: { solo: '1.0.0' } }, 'node_modules/solo': { version: '1.0.0' } }))
    expect(g!.children[0].children).toEqual([])
  })
})
