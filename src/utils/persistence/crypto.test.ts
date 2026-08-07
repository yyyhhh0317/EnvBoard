// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { decryptValue, encryptValue, exportKey, generateKey, importKey } from './crypto'

describe('crypto (AES-GCM)', () => {
  it('encrypts and decrypts a value roundtrip', async () => {
    const key = await generateKey()
    const enc = await encryptValue('sk-proj-abc123', key)
    expect(enc.iv).toBeTruthy()
    expect(enc.data).toBeTruthy()
    expect(enc.data).not.toContain('sk-proj-abc123')
    expect(await decryptValue(enc, key)).toBe('sk-proj-abc123')
  })

  it('produces different ciphertexts for the same plaintext (random IV)', async () => {
    const key = await generateKey()
    const a = await encryptValue('same-value', key)
    const b = await encryptValue('same-value', key)
    expect(a.data).not.toBe(b.data)
  })

  it('export/import key roundtrip keeps usability', async () => {
    const key = await generateKey()
    const b64 = await exportKey(key)
    const key2 = await importKey(b64)
    const enc = await encryptValue('value', key)
    expect(await decryptValue(enc, key2)).toBe('value')
  })

  it('a different key cannot decrypt', async () => {
    const k1 = await generateKey()
    const k2 = await generateKey()
    const enc = await encryptValue('secret', k1)
    await expect(decryptValue(enc, k2)).rejects.toThrow()
  })

  it('tampered ciphertext fails to decrypt', async () => {
    const key = await generateKey()
    const enc = await encryptValue('secret', key)
    const flipped = enc.data.endsWith('AA') ? 'BB' : 'AA'
    await expect(decryptValue({ ...enc, data: enc.data.slice(0, -2) + flipped }, key)).rejects.toThrow()
  })

  it('tampered iv fails to decrypt', async () => {
    const key = await generateKey()
    const enc = await encryptValue('secret', key)
    const flipped = enc.iv.endsWith('AA') ? 'BB' : 'AA'
    await expect(decryptValue({ ...enc, iv: enc.iv.slice(0, -2) + flipped }, key)).rejects.toThrow()
  })

  it('empty string encrypt/decrypt roundtrip', async () => {
    const key = await generateKey()
    const enc = await encryptValue('', key)
    expect(await decryptValue(enc, key)).toBe('')
  })
})
