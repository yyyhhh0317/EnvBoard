import { describe, it, expect } from 'vitest'
import type { EnvVariable } from '../types'
import { maskSecret, scanSecretValue, scanSecrets } from './secretScan'

function makeVar(key: string, value: string, id = key): EnvVariable {
  return {
    id,
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

function typesOf(value: string): string[] {
  return scanSecretValue(value).map((m) => m.type)
}

describe('secretScan', () => {
  it('detects AWS access key id', () => {
    expect(typesOf(`AKIA${'A'.repeat(16)}`)).toContain('aws-access-key')
    expect(typesOf(`x=ASIA${'1'.repeat(16)}`)).toContain('aws-access-key')
  })

  it('detects AWS secret access key with context', () => {
    const v = `AWS_SECRET_ACCESS_KEY="${'A'.repeat(40)}"`
    expect(typesOf(v)).toContain('aws-secret-key')
  })

  it('detects GitHub tokens', () => {
    expect(typesOf(`ghp_${'a'.repeat(36)}`)).toContain('github-pat')
    expect(typesOf(`github_pat_${'A'.repeat(24)}`)).toContain('github-fine-grained-pat')
  })

  it('detects slack / stripe / google / npm / pypi tokens', () => {
    expect(typesOf(`xoxb-${'a'.repeat(24)}`)).toContain('slack-token')
    expect(typesOf(`sk_live_${'A'.repeat(24)}`)).toContain('stripe-key')
    expect(typesOf(`AIza${'a'.repeat(35)}`)).toContain('google-api-key')
    expect(typesOf(`npm_${'a'.repeat(36)}`)).toContain('npm-token')
    expect(typesOf(`pypi-AgEIcHlwaS5vcmc${'A'.repeat(54)}`)).toContain('pypi-token')
  })

  it('detects PEM private keys, JWT and OpenAI keys', () => {
    expect(typesOf('-----BEGIN RSA PRIVATE KEY-----\nMIIEow...')).toContain('private-key')
    expect(typesOf('-----BEGIN OPENSSH PRIVATE KEY-----')).toContain('private-key')
    expect(typesOf(`eyJ${'a'.repeat(12)}.${'b'.repeat(12)}.${'c'.repeat(12)}`)).toContain('jwt')
    expect(typesOf(`sk-proj-${'a'.repeat(40)}`)).toContain('openai-key')
  })

  it('does not flag short or context-free strings', () => {
    expect(typesOf('AKIA')).toEqual([])
    expect(typesOf('sk-abc')).toEqual([])
    expect(typesOf('example.com/api-key?token=abc123')).toEqual([])
  })

  it('does not flag a random 40-char base64 without aws context', () => {
    // 40 位 base64 字符，但没有 aws 上下文，不应被识别为 AWS secret
    expect(typesOf('xYz0+AbCdEfGh1234567890abcdefghijklmnopq')).toEqual([])
  })

  it('does not flag urls or plain values', () => {
    expect(typesOf('https://api.github.com/repos/owner/repo')).toEqual([])
    expect(typesOf('postgres://user:pass@localhost:5432/db')).toEqual([])
    expect(typesOf('hello world')).toEqual([])
  })

  it('maskSecret hides the middle of a value', () => {
    expect(maskSecret(`ghp_${'1'.repeat(36)}`)).toBe('ghp_11****11')
    expect(maskSecret('short')).toBe('****')
    expect(maskSecret('abcdefghijklmnop')).toBe('ab****op')
  })

  it('scanSecrets aggregates matched variables only', () => {
    const variables = [
      makeVar('PORT', '8080', 'v1'),
      makeVar('AWS_ACCESS_KEY_ID', `AKIA${'A'.repeat(16)}`, 'v2'),
      makeVar('DB_PASSWORD', 'plaintext', 'v3'),
      makeVar('OPENAI_KEY', `sk-proj-${'a'.repeat(40)}`, 'v4'),
    ]
    const result = scanSecrets(variables)
    expect(result.total).toBe(2)
    expect(result.items.map((i) => i.id)).toEqual(['v2', 'v4'])
    expect(result.items[0].matches[0].severity).toBe('high')
  })

  it('a value can hit multiple patterns', () => {
    const value = `ghp_${'a'.repeat(36)}`
    const matches = scanSecretValue(`token=${value}`)
    expect(matches.map((m) => m.type)).toContain('github-pat')
  })
})
