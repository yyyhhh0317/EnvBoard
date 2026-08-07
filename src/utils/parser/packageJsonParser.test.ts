import { describe, it, expect } from 'vitest'
import { parsePackageJson } from './packageJsonParser'

describe('parsePackageJson', () => {
  const pkg = {
    name: 'demo',
    version: '1.2.3',
    description: 'demo pkg',
    dependencies: { react: '^18.3.1' },
    devDependencies: { vitest: '^4.1.0' },
    peerDependencies: { 'prop-types': '^15.8.1' },
    optionalDependencies: { 'fsevents': '^2.3.3' },
    scripts: { build: 'vite build' },
    engines: { node: '>=18' },
  }

  it('parses metadata and dependency categories', () => {
    const result = parsePackageJson(JSON.stringify(pkg))
    expect(result.type).toBe('npm')
    expect(result.meta).toEqual({ name: 'demo', version: '1.2.3', description: 'demo pkg' })
    const categories = Object.fromEntries(result.dependencies.map((d) => [d.name, d.category]))
    expect(categories).toEqual({
      react: 'dependencies',
      vitest: 'devDependencies',
      'prop-types': 'peerDependencies',
      fsevents: 'optionalDependencies',
      build: 'scripts',
      node: 'engines',
    })
  })

  it('marks scripts and engines', () => {
    const result = parsePackageJson(JSON.stringify(pkg))
    const build = result.dependencies.find((d) => d.name === 'build')
    expect(build?.isScript).toBe(true)
    const node = result.dependencies.find((d) => d.name === 'node')
    expect(node?.isMeta).toBe(true)
  })

  it('returns error for invalid JSON', () => {
    const result = parsePackageJson('{ not json')
    expect(result.errors.length).toBeGreaterThan(0)
    expect(result.dependencies).toEqual([])
  })

  it('reports when no relevant fields found', () => {
    const result = parsePackageJson('{}')
    expect(result.errors.some((e) => e.includes('未在 package.json'))).toBe(true)
  })
})
