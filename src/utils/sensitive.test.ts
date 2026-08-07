import { describe, it, expect } from 'vitest'
import { isSensitiveKey, maskValue, SENSITIVE_KEYWORDS } from './sensitive'

describe('isSensitiveKey', () => {
  it('detects exact keyword segments', () => {
    expect(isSensitiveKey('PASSWORD')).toBe(true)
    expect(isSensitiveKey('DB_PASSWORD')).toBe(true)
    expect(isSensitiveKey('API_KEY')).toBe(true)
    expect(isSensitiveKey('GITHUB_TOKEN')).toBe(true)
    expect(isSensitiveKey('SECRET_KEY')).toBe(true)
    expect(isSensitiveKey('AUTH_TOKEN')).toBe(true)
  })

  it('does not flag substrings like MONKEY / AUTHOR', () => {
    expect(isSensitiveKey('MONKEY_NAME')).toBe(false)
    expect(isSensitiveKey('AUTHOR_NAME')).toBe(false)
    expect(isSensitiveKey('KEYBOARD')).toBe(false)
  })

  it('treats separators as segmentation', () => {
    expect(isSensitiveKey('db.password')).toBe(true)
    expect(isSensitiveKey('my-secret-value')).toBe(true)
    expect(isSensitiveKey('token/header')).toBe(true)
  })

  it('returns false for empty or undefined input', () => {
    expect(isSensitiveKey('')).toBe(false)
  })

  it('maskValue returns the placeholder', () => {
    expect(maskValue()).toBe('****')
    expect(SENSITIVE_KEYWORDS).toContain('API_KEY')
  })
})
