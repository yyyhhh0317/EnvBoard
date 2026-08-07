import { describe, it, expect } from 'vitest'
import { parsePyproject } from './pyprojectParser'

describe('parsePyproject: PEP 621', () => {
  const content = `[project]
name = "demo"
version = "0.1.0"
description = "A demo project"
requires-python = ">=3.9"
dependencies = [
    "requests>=2.0,<3.0",
    "flask==2.3.2",
]

[project.optional-dependencies]
dev = ["pytest>=7.0", "ruff"]
docs = ["sphinx"]
`

  it('parses metadata, main deps and optional groups', () => {
    const result = parsePyproject(content)
    expect(result.type).toBe('poetry')
    expect(result.meta.name).toBe('demo')
    expect(result.meta.version).toBe('0.1.0')

    const deps = Object.fromEntries(result.dependencies.map((d) => [d.name, d]))
    expect(deps.requests.versionSpec).toBe('>=2.0,<3.0')
    expect(deps.flask.versionSpec).toBe('==2.3.2')
    expect(deps.pytest.category).toBe('optional')
    expect(deps.pytest.subgroup).toBe('dev')
    expect(deps.ruff.subgroup).toBe('dev')
    expect(deps.sphinx.subgroup).toBe('docs')
    expect(deps.python.category).toBe('engines')
    expect(deps.python.isMeta).toBe(true)
  })
})

describe('parsePyproject: Poetry', () => {
  const content = `[tool.poetry]
name = "poetry-demo"
version = "1.0.0"
description = "poetry style"

[tool.poetry.dependencies]
python = "^3.9"
django = ">=4.0"
celery = { version = "^5.2", extras = ["redis"] }

[tool.poetry.dev-dependencies]
pytest = "^7.0"

[build-system]
requires = ["poetry-core>=1.0"]
`

  it('parses poetry deps, dev deps and build-system', () => {
    const result = parsePyproject(content)
    expect(result.meta.name).toBe('poetry-demo')
    const deps = Object.fromEntries(result.dependencies.map((d) => [d.name, d]))
    expect(deps.django.versionSpec).toBe('>=4.0')
    expect(deps.celery.versionSpec).toBe('^5.2')
    expect(deps.pytest.category).toBe('devDependencies')
    // build-system 依赖进入 optional，注释标明来源
    expect(deps['poetry-core'].category).toBe('optional')
    expect(deps['poetry-core'].comment).toBe('build-system')
  })
})

describe('parsePyproject: errors', () => {
  it('returns error for invalid TOML', () => {
    const result = parsePyproject('[project\nbroken', 'pyproject.toml')
    expect(result.errors.length).toBeGreaterThan(0)
  })

  it('reports when nothing found', () => {
    const result = parsePyproject('[tool.black]\nline-length = 88\n')
    expect(result.errors.some((e) => e.includes('未在 pyproject'))).toBe(true)
  })
})
