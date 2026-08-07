import { describe, it, expect } from 'vitest'
import { detectEnvFromFilename, genEnvName, getEnvMeta, PRESET_ENVS } from './envPresets'

describe('detectEnvFromFilename', () => {
  it('detects preset and aliased environments', () => {
    expect(detectEnvFromFilename('.env.development')).toBe('development')
    expect(detectEnvFromFilename('.env.dev')).toBe('development')
    expect(detectEnvFromFilename('.env.production')).toBe('production')
    expect(detectEnvFromFilename('.env.prod')).toBe('production')
    expect(detectEnvFromFilename('.env.testing')).toBe('test')
    expect(detectEnvFromFilename('.env.stage')).toBe('staging')
  })

  it('ignores plain .env and .env.example/.local', () => {
    expect(detectEnvFromFilename('.env')).toBeNull()
    expect(detectEnvFromFilename('.env.example')).toBeNull()
    expect(detectEnvFromFilename('.env.local')).toBeNull()
  })

  it('returns custom segment as env name', () => {
    expect(detectEnvFromFilename('.env.preview')).toBe('preview')
  })

  it('handles path-prefixed filenames', () => {
    expect(detectEnvFromFilename('configs/.env.production')).toBe('production')
  })
})

describe('getEnvMeta', () => {
  it('returns preset meta', () => {
    const meta = getEnvMeta('development')
    expect(meta.isPreset).toBe(true)
    expect(meta.color).toBe('emerald')
  })

  it('builds custom meta with stable color', () => {
    const a = getEnvMeta('preview')
    const b = getEnvMeta('preview')
    expect(a.isPreset).toBe(false)
    expect(a.color).toBe(b.color)
    expect(a.label).toBe('preview')
  })

  it('exposes the four presets in order', () => {
    expect(PRESET_ENVS.map((e) => e.name)).toEqual(['development', 'test', 'staging', 'production'])
  })
})

describe('genEnvName', () => {
  it('increments until unique', () => {
    expect(genEnvName([])).toBe('custom-1')
    expect(genEnvName(['custom-1'])).toBe('custom-2')
    expect(genEnvName(['custom-1', 'custom-2', 'custom-3'])).toBe('custom-4')
  })
})
