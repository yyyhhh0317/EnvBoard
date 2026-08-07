import { describe, it, expect } from 'vitest'
import { parseEnvLike } from './envLikeParser'
import { parseIni } from './iniParser'
import { parseProperties } from './propertiesParser'

describe('parseIni', () => {
  it('parses sections with flattened keys and comments', () => {
    const content = [
      '; 数据库配置',
      '[database]',
      'host = localhost',
      'port = 5432  ; 行内注释',
      '# 通用',
      '[app]',
      'name = "myapp"',
    ].join('\n')
    const result = parseIni(content, 'config.ini')
    expect(result.errors).toEqual([])
    const keys = result.variables.map((v) => v.key)
    expect(keys).toEqual(['database.host', 'database.port', 'app.name'])
    expect(result.variables[0].comment).toBe('数据库配置')
    expect(result.variables[1].value).toBe('5432')
    expect(result.variables[1].comment).toBe('行内注释')
    expect(result.variables[2].value).toBe('myapp')
  })

  it('keys without a section stay plain', () => {
    const result = parseIni('ROOT_KEY = 1\n', 'config.ini')
    expect(result.variables[0].key).toBe('ROOT_KEY')
  })

  it('reports invalid lines', () => {
    const result = parseIni('[a]\nthis is not valid\n', 'config.ini')
    expect(result.errors.length).toBe(1)
  })

  it('marks sensitive keys', () => {
    const result = parseIni('[db]\npassword = secret\n', 'config.ini')
    expect(result.variables[0].isSensitive).toBe(true)
  })

  it('returns error for empty content', () => {
    const result = parseIni('', 'config.ini')
    expect(result.errors.length).toBe(1)
    expect(result.variables).toEqual([])
  })
})

describe('parseProperties', () => {
  it('parses = and : separators, dotted keys, ! comments', () => {
    const content = [
      '# 主配置',
      'app.name=myapp',
      'app.port: 8080',
      '! 数据库',
      'db.url=jdbc:mysql://localhost:3306/db',
    ].join('\n')
    const result = parseProperties(content, 'application.properties')
    expect(result.errors).toEqual([])
    expect(result.variables.map((v) => v.key)).toEqual(['app.name', 'app.port', 'db.url'])
    expect(result.variables[0].comment).toBe('主配置')
    expect(result.variables[1].value).toBe('8080')
    expect(result.variables[2].value).toBe('jdbc:mysql://localhost:3306/db')
  })

  it('joins continuation lines ending with backslash', () => {
    const content = 'msg = hello \\\n  world\n'
    const result = parseProperties(content, 'app.properties')
    expect(result.variables[0].value).toBe('hello world')
  })

  it('unescapes value escapes', () => {
    const result = parseProperties('key = a\\tb\\nc\\:d', 'app.properties')
    expect(result.variables[0].value).toBe('a\tb\nc:d')
  })

  it('marks sensitive keys', () => {
    const result = parseProperties('api.key = xyz', 'app.properties')
    expect(result.variables[0].isSensitive).toBe(true)
  })
})

describe('parseEnvLike routing', () => {
  it('routes by filename extension', () => {
    expect(parseEnvLike('[s]\na=1\n', 'config.ini').variables[0].key).toBe('s.a')
    expect(parseEnvLike('app.port: 8080\n', 'application.properties').variables[0].key).toBe('app.port')
  })

  it('routes pasted content by signals', () => {
    // [section] → ini
    expect(parseEnvLike('[web]\nport=3000\n', 'pasted.txt').variables[0].key).toBe('web.port')
    // 点分小写 key → properties
    expect(parseEnvLike('spring.datasource.url=jdbc:mysql://h/d\n', 'pasted.txt').variables[0].key).toBe('spring.datasource.url')
    // 默认 → env
    expect(parseEnvLike('PORT=8080\n', 'pasted.txt').variables[0].key).toBe('PORT')
  })
})
