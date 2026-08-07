// @vitest-environment node
// versionCheck 使用全局 fetch，通过 mock 验证解析与并发逻辑
import { afterEach, describe, expect, it, vi } from 'vitest'
import type { Dependency } from '../../types'
import { fetchLatestVersions } from './versionCheck'

function dep(name: string, versionSpec: string, extra: Partial<Dependency> = {}): Dependency {
  return { id: name, name, versionSpec, category: 'dependencies', line: 1, ...extra }
}

function mockFetchOnce(urlContains: string, body: unknown, ok = true) {
  return vi.fn(async (url: string) => {
    if (!url.includes(urlContains)) throw new Error(`unexpected url: ${url}`)
    return { ok, json: async () => body }
  })
}

afterEach(() => vi.restoreAllMocks())

describe('fetchLatestVersions', () => {
  it('queries npm and marks outdated deps', async () => {
    vi.stubGlobal('fetch', mockFetchOnce('registry.npmjs.org', { version: '2.0.0' }))
    const deps = [dep('react', '^18.0.0'), dep('lodash', '^4.0.0')]
    const result = await fetchLatestVersions(deps, 'npm')
    expect(result[0].latestVersion).toBe('2.0.0')
    expect(result[0].isOutdated).toBe(true)
    expect(result[1].latestVersion).toBe('2.0.0')
  })

  it('URL-encodes scoped npm package names', async () => {
    let called = ''
    vi.stubGlobal(
      'fetch',
      vi.fn(async (url: string) => {
        called = url
        return { ok: true, json: async () => ({ version: '1.0.0' }) }
      }),
    )
    await fetchLatestVersions([dep('@scope/pkg', '^1.0.0')], 'npm')
    expect(called).toContain('@scope%2Fpkg')
  })

  it('parses PyPI info.version', async () => {
    vi.stubGlobal('fetch', mockFetchOnce('pypi.org', { info: { version: '3.1.0' } }))
    const result = await fetchLatestVersions([dep('requests', '>=2.0')], 'pypi')
    expect(result[0].latestVersion).toBe('3.1.0')
    expect(result[0].isOutdated).toBe(true)
  })

  it('returns null on non-ok or error responses', async () => {
    vi.stubGlobal('fetch', mockFetchOnce('registry.npmjs.org', {}, false))
    let result = await fetchLatestVersions([dep('a', '^1.0.0')], 'npm')
    expect(result[0].latestVersion).toBeUndefined()
    expect(result[0].isOutdated).toBe(false)

    vi.stubGlobal('fetch', vi.fn(async () => { throw new Error('network') }))
    result = await fetchLatestVersions([dep('a', '^1.0.0')], 'npm')
    expect(result[0].latestVersion).toBeUndefined()
    expect(result[0].isOutdated).toBe(false)
  })

  it('skips scripts and meta deps', async () => {
    const fetchMock = vi.fn()
    vi.stubGlobal('fetch', fetchMock)
    const deps = [
      dep('react', '^18.0.0'),
      dep('build', 'vite build', { category: 'scripts', isScript: true }),
      dep('node', '>=18', { category: 'engines', isMeta: true }),
    ]
    await fetchLatestVersions(deps, 'npm')
    expect(fetchMock).toHaveBeenCalledTimes(1)
  })

  it('reports progress via callback', async () => {
    vi.stubGlobal('fetch', mockFetchOnce('registry.npmjs.org', { version: '1.0.0' }))
    const calls: string[] = []
    await fetchLatestVersions([dep('a', '^1.0.0'), dep('b', '^1.0.0')], 'npm', (done, total) => {
      calls.push(`${done}/${total}`)
    })
    expect(calls).toContain('2/2')
  })
})
