import { describe, it, expect } from 'vitest'
import type { Dependency } from '../../types'
import { formatDependencies } from './dependencyExporter'

function dep(name: string, versionSpec: string, category: Dependency['category'], extra: Partial<Dependency> = {}): Dependency {
  return { id: name, name, versionSpec, category, line: 1, ...extra }
}

describe('formatDependencies: npm', () => {
  it('groups into package.json sections', () => {
    const deps = [
      dep('react', '^18.3.1', 'dependencies'),
      dep('vitest', '^4.1.0', 'devDependencies'),
      dep('build', 'vite build', 'scripts', { isScript: true }),
      dep('node', '>=18', 'engines', { isMeta: true }),
    ]
    const out = formatDependencies(deps, 'npm', { name: 'demo' })
    const parsed = JSON.parse(out)
    expect(parsed.name).toBe('demo')
    expect(parsed.dependencies).toEqual({ react: '^18.3.1' })
    expect(parsed.devDependencies).toEqual({ vitest: '^4.1.0' })
    expect(parsed.scripts).toEqual({ build: 'vite build' })
    expect(parsed.engines).toEqual({ node: '>=18' })
  })
})

describe('formatDependencies: pip', () => {
  it('formats requirements lines with comments', () => {
    const deps = [dep('requests', '>=2.0,<3.0', 'dependencies', { comment: 'HTTP' }), dep('flask', '==2.3.2', 'dependencies')]
    const out = formatDependencies(deps, 'pip', {})
    expect(out).toBe('requests>=2.0,<3.0  # HTTP\nflask==2.3.2')
  })
})

describe('formatDependencies: poetry', () => {
  it('emits PEP 621 style output', () => {
    const deps = [
      dep('requests', '>=2.0', 'dependencies'),
      dep('pytest', '>=7.0', 'optional'),
    ]
    const out = formatDependencies(deps, 'poetry', { name: 'demo', version: '1.0.0' })
    expect(out).toContain('[project]')
    expect(out).toContain('name = "demo"')
    expect(out).toContain('"requests>=2.0"')
    expect(out).toContain('[project.optional-dependencies]')
    expect(out).toContain('"pytest>=7.0"')
  })
})

describe('formatDependencies: lockfile', () => {
  it('lists name@lockedVersion', () => {
    const deps = [dep('react', '^18.0.0', 'dependencies', { lockedVersion: '18.3.1' })]
    const out = formatDependencies(deps, 'lockfile', {})
    expect(out).toBe('react@18.3.1')
  })
})
