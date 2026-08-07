// 密钥泄露检测（v1.2.0）
// 基于常见密钥/令牌的格式特征做正则匹配，帮助用户在上传、导出、提交前发现真实泄露的凭证。
// 设计说明：
//  - 只检测「值」的格式特征（与变量名无关），可发现未标记敏感的明文密钥
//  - 每个模式取首次命中；同一变量可命中多个不同类型
//  - 全部在浏览器本地执行，不发送任何数据
//  - 误报策略：只收录格式强特征（定长、固定前缀），避免把普通字符串/URL 误判为密钥

import type { EnvVariable } from '../types'

/** 密钥类型 */
export type SecretType =
  | 'aws-access-key'
  | 'aws-secret-key'
  | 'github-pat'
  | 'github-fine-grained-pat'
  | 'slack-token'
  | 'stripe-key'
  | 'google-api-key'
  | 'google-oauth-token'
  | 'private-key'
  | 'jwt'
  | 'openai-key'
  | 'npm-token'
  | 'pypi-token'
  | 'sendgrid-key'
  | 'twilio-key'
  | 'telegram-bot-token'
  | 'mailgun-key'

/** 单次命中 */
export interface SecretMatch {
  type: SecretType
  /** 人类可读名称 */
  label: string
  severity: 'high' | 'medium'
  /** 命中的原文片段 */
  matched: string
  start: number
  end: number
}

/** 包含泄露的变量条目 */
export interface SecretItem {
  id: string
  key: string
  value: string
  matches: SecretMatch[]
}

/** 扫描结果 */
export interface SecretScanResult {
  /** 命中变量列表（仅含至少一个命中的变量） */
  items: SecretItem[]
  /** 命中总数（变量 × 模式） */
  total: number
}

interface SecretPattern {
  type: SecretType
  label: string
  severity: 'high' | 'medium'
  re: RegExp
}

const PATTERNS: SecretPattern[] = [
  // AWS 访问密钥 ID：AKIA / ASIA + 16 位大写字母数字
  { type: 'aws-access-key', label: 'AWS Access Key ID', severity: 'high', re: /\b(?:AKIA|ASIA)[0-9A-Z]{16}\b/ },
  // AWS 秘密访问密钥：aws 上下文 + 40 位 base64 字符（含 / +）
  { type: 'aws-secret-key', label: 'AWS Secret Access Key', severity: 'high', re: /aws.{0,20}['"][0-9A-Za-z/+]{40}['"]/i },
  // GitHub Personal Access Token（ghp_ / gho_ / ghu_ / ghs_ / ghr_ + 36 位）
  { type: 'github-pat', label: 'GitHub Token', severity: 'high', re: /\bgh[pousr]_[A-Za-z0-9]{36}\b/ },
  // GitHub fine-grained PAT
  { type: 'github-fine-grained-pat', label: 'GitHub Fine-grained Token', severity: 'high', re: /\bgithub_pat_[A-Za-z0-9_]{22,}\b/ },
  // Slack token（xoxb / xoxa / xoxp / xoxr / xoxs）
  { type: 'slack-token', label: 'Slack Token', severity: 'medium', re: /\bxox[baprs]-[0-9A-Za-z-]{10,48}\b/ },
  // Stripe 密钥
  { type: 'stripe-key', label: 'Stripe Key', severity: 'high', re: /\b(?:sk|pk)_(?:live|test)_[0-9A-Za-z]{16,}\b/ },
  // Google API Key
  { type: 'google-api-key', label: 'Google API Key', severity: 'high', re: /\bAIza[0-9A-Za-z\-_]{35}\b/ },
  // Google OAuth Token
  { type: 'google-oauth-token', label: 'Google OAuth Token', severity: 'high', re: /\bya29\.[0-9A-Za-z\-_]{20,}\b/ },
  // PEM 私钥头
  { type: 'private-key', label: '私钥 (PEM)', severity: 'high', re: /-----BEGIN (?:RSA |EC |OPENSSH |DSA |PGP )?PRIVATE KEY-----/ },
  // JWT（三段式）
  { type: 'jwt', label: 'JWT Token', severity: 'medium', re: /\beyJ[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\.[A-Za-z0-9_-]{10,}\b/ },
  // OpenAI API Key（sk- 或 sk-proj- 变体）
  { type: 'openai-key', label: 'OpenAI API Key', severity: 'high', re: /\bsk-[A-Za-z0-9_-]{20,}\b/ },
  // npm token
  { type: 'npm-token', label: 'npm Token', severity: 'medium', re: /\bnpm_[A-Za-z0-9]{36}\b/ },
  // PyPI token
  { type: 'pypi-token', label: 'PyPI Token', severity: 'medium', re: /\bpypi-AgEIcHlwaS5vcmc[A-Za-z0-9\-_]{50,}\b/ },
  // SendGrid API Key
  { type: 'sendgrid-key', label: 'SendGrid Key', severity: 'medium', re: /\bSG\.[0-9A-Za-z\-_]{22}\.[0-9A-Za-z\-_]{43}\b/ },
  // Twilio API Key
  { type: 'twilio-key', label: 'Twilio API Key', severity: 'medium', re: /\bSK[0-9a-fA-F]{32}\b/ },
  // Telegram Bot Token
  { type: 'telegram-bot-token', label: 'Telegram Bot Token', severity: 'medium', re: /\b[0-9]{8,10}:[A-Za-z0-9_-]{35}\b/ },
  // Mailgun API Key
  { type: 'mailgun-key', label: 'Mailgun Key', severity: 'medium', re: /\bkey-[0-9A-Za-z]{32}\b/ },
]

/** 扫描单个变量值，返回命中的模式列表（每个模式至多一条） */
export function scanSecretValue(value: string): SecretMatch[] {
  if (!value) return []
  const matches: SecretMatch[] = []
  for (const p of PATTERNS) {
    const m = value.match(p.re)
    if (m && m[0]) {
      const start = m.index ?? 0
      matches.push({
        type: p.type,
        label: p.label,
        severity: p.severity,
        matched: m[0],
        start,
        end: start + m[0].length,
      })
    }
  }
  return matches
}

/** 扫描一组变量，聚合出命中结果 */
export function scanSecrets(variables: EnvVariable[]): SecretScanResult {
  const items: SecretItem[] = []
  let total = 0
  for (const v of variables) {
    const matches = scanSecretValue(v.value)
    if (matches.length > 0) {
      items.push({ id: v.id, key: v.key, value: v.value, matches })
      total += matches.length
    }
  }
  return { items, total }
}

/** 脱敏展示：保留首尾少量字符，中间打码 */
export function maskSecret(value: string): string {
  if (value.length <= 8) return '****'
  if (value.length <= 16) return `${value.slice(0, 2)}****${value.slice(-2)}`
  return `${value.slice(0, 6)}****${value.slice(-2)}`
}
