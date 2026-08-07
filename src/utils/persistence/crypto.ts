// 会话持久化加密工具：Web Crypto AES-GCM
// 用途：敏感值（isSensitive 的变量 value）落盘前加密，浏览器本地存储中不出现明文密钥
// 说明：加密密钥随机生成一次并保存在本地存储；这是「防止本地明文泄露」的纵深防御，
//       并非用户口令加密。所有操作仍在浏览器本地完成，不产生任何网络请求。

/** 加密后的值（iv 与密文均 base64 编码） */
export interface EncryptedValue {
  iv: string
  data: string
}

function b64encode(buf: ArrayBuffer | Uint8Array): string {
  const bytes = buf instanceof Uint8Array ? buf : new Uint8Array(buf)
  let s = ''
  for (let i = 0; i < bytes.length; i++) s += String.fromCharCode(bytes[i])
  return btoa(s)
}

function b64decode(s: string) {
  const bin = atob(s)
  const bytes = new Uint8Array(bin.length)
  for (let i = 0; i < bin.length; i++) bytes[i] = bin.charCodeAt(i)
  return bytes
}

/** 生成新的 AES-GCM 256 位密钥 */
export async function generateKey(): Promise<CryptoKey> {
  return crypto.subtle.generateKey({ name: 'AES-GCM', length: 256 }, true, [
    'encrypt',
    'decrypt',
  ])
}

/** 导出密钥为 base64（用于本地持久化密钥本身） */
export async function exportKey(key: CryptoKey): Promise<string> {
  const raw = await crypto.subtle.exportKey('raw', key)
  return b64encode(raw)
}

/** 从 base64 导入密钥 */
export async function importKey(b64: string): Promise<CryptoKey> {
  const raw = b64decode(b64)
  return crypto.subtle.importKey('raw', raw, { name: 'AES-GCM' }, true, ['encrypt', 'decrypt'])
}

/** 加密明文，返回 iv + 密文（均 base64） */
export async function encryptValue(plain: string, key: CryptoKey): Promise<EncryptedValue> {
  const iv = crypto.getRandomValues(new Uint8Array(12))
  const data = await crypto.subtle.encrypt({ name: 'AES-GCM', iv }, key, new TextEncoder().encode(plain))
  return { iv: b64encode(iv), data: b64encode(new Uint8Array(data)) }
}

/** 解密密文；密钥错误或数据被篡改时抛异常 */
export async function decryptValue(enc: EncryptedValue, key: CryptoKey): Promise<string> {
  const iv = b64decode(enc.iv)
  const data = b64decode(enc.data)
  const plain = await crypto.subtle.decrypt({ name: 'AES-GCM', iv }, key, data)
  return new TextDecoder().decode(plain)
}
