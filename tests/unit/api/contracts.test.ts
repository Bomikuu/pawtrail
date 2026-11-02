import { describe, expect, it, vi } from 'vitest'
import { getApiConfig } from '@/lib/api/config'
import { ApiError } from '@/lib/api/errors'
import { queryKeys } from '@/lib/api/keys'
import { createMockApi } from '@/lib/api/adapters/mock'
import { getBrowserApi } from '@/lib/api/client'
import { parseResponse } from '@/lib/api/validation'
import { animalProfileSchema } from '@/features/animals/schemas'

vi.mock('server-only', () => ({}))

describe('API foundation', () => {
  it('does not fall back to mock records in real mode without an origin', () => {
    expect(() => getApiConfig({ NEXT_PUBLIC_USE_MOCK_API: 'false' })).toThrow(
      ApiError,
    )
  })
  it('defaults page size to 12, caps at 50, and uses stable opaque cursors', async () => {
    const api = createMockApi()
    const first = await api.animals.list({})
    const second = await api.animals.list({ cursor: first.nextCursor! })
    expect(first.items).toHaveLength(12)
    expect(second.items).toHaveLength(8)
    expect(
      new Set([...first.items, ...second.items].map((x) => x.id)).size,
    ).toBe(20)
    expect((await api.animals.list({ limit: 100 })).items).toHaveLength(20)
    await expect(api.animals.list({ cursor: 'invalid' })).rejects.toMatchObject(
      { code: 'INVALID_CURSOR' },
    )
  })
  it('fails unfinished features explicitly and honors cancellation', async () => {
    const api = createMockApi()
    await expect(api.auth.session()).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
      status: 501,
    })
    const abort = new AbortController()
    abort.abort()
    await expect(
      api.animals.list({}, { signal: abort.signal }),
    ).rejects.toMatchObject({ code: 'CANCELLED' })
  })
  it('normalizes malformed records and scopes stable filter keys', () => {
    expect(() => parseResponse(animalProfileSchema, { id: 'broken' })).toThrow(
      ApiError,
    )
    expect(queryKeys('guest').list('animals', { q: 'cat', limit: 12 })).toEqual(
      queryKeys('guest').list('animals', { limit: 12, q: 'cat' }),
    )
    expect(queryKeys('guest').all('animals')).not.toEqual(
      queryKeys('actor-1').all('animals'),
    )
  })
  it('browser transport uses same-origin endpoints and validates success responses', async () => {
    const fetch = vi
      .fn()
      .mockResolvedValue(new Response(JSON.stringify({ id: 'broken' })))
    vi.stubGlobal('fetch', fetch)
    await expect(getBrowserApi().animals.get('milo')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/animals/milo')
  })
})

describe('request isolation and validation edges', () => {
  it('caps actual large collections and rejects invalid limits', async () => {
    const { paginate } = await import('@/lib/api/pagination')
    const rows = Array.from({ length: 70 }, (_, i) => ({
      id: `${i}`,
      createdAt: '2026-11-02T00:00:00+08:00',
    }))
    expect(paginate(rows, { limit: 1000 }, 'test').items).toHaveLength(50)
    expect(() => paginate(rows, { limit: 0 }, 'test')).toThrow(ApiError)
    const first = paginate(rows, { limit: 10 }, 'test')
    expect(() =>
      paginate(rows, { cursor: first.nextCursor! }, 'different-filter'),
    ).toThrow(ApiError)
  })
  it('creates a fresh server service without self-fetching or sharing DTO mutations', async () => {
    vi.stubEnv('NEXT_PUBLIC_USE_MOCK_API', 'true')
    const fetch = vi.fn()
    vi.stubGlobal('fetch', fetch)
    const { getServerApi } = await import('@/lib/api/server')
    const first = await getServerApi()
    const second = await getServerApi()
    expect(first).not.toBe(second)
    const record = await first.animals.get('milo')
    record.name = 'Changed'
    record.location.neighborhood = 'Changed'
    expect((await first.animals.get('milo')).name).toBe('Milo')
    expect((await second.animals.get('milo')).location.neighborhood).toBe(
      'Poblacion, Davao City',
    )
    expect(fetch).not.toHaveBeenCalled()
  })
  it('rejects malformed JSON, cancellation, and timeouts without exposing raw error text', async () => {
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockResolvedValue(new Response('upstream secret', { status: 502 })),
    )
    await expect(getBrowserApi().animals.get('milo')).rejects.toMatchObject({
      code: 'HTTP_ERROR',
      message: 'The service could not complete the request',
    })
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue(new Response('not JSON')))
    await expect(getBrowserApi().animals.get('milo')).rejects.toMatchObject({
      code: 'INVALID_RESPONSE',
    })
    vi.stubGlobal(
      'fetch',
      vi
        .fn()
        .mockRejectedValue(new DOMException('timeout secret', 'TimeoutError')),
    )
    await expect(getBrowserApi().animals.get('milo')).rejects.toMatchObject({
      code: 'TIMEOUT',
    })
    const abort = new AbortController()
    abort.abort()
    await expect(
      getBrowserApi().animals.get('milo', { signal: abort.signal }),
    ).rejects.toMatchObject({ code: 'CANCELLED' })
  })
  it('retains final options, desired state, and 204 semantics in browser requests', async () => {
    const fetch = vi.fn().mockResolvedValue(new Response(null, { status: 204 }))
    vi.stubGlobal('fetch', fetch)
    const signal = new AbortController().signal
    await expect(
      getBrowserApi().animals.setSaved('animal-1', true, {
        idempotencyKey: 'test-key',
        signal,
      }),
    ).resolves.toBeUndefined()
    expect(fetch.mock.calls[0][0]).toBe('/api/v1/animals/animal-1/saved')
    const options = fetch.mock.calls[0][1]
    expect(options.method).toBe('PUT')
    expect(options.signal).toBe(signal)
    expect(options.headers.get('Idempotency-Key')).toBe('test-key')
    expect(JSON.parse(options.body)).toEqual({ saved: true })
  })
  it('keeps strict integer-centavo money rules', async () => {
    const { parseMoneyMinor, DONATION_PRESETS_MINOR } =
      await import('@/lib/api/money')
    expect(parseMoneyMinor('100.25')).toBe(10025)
    expect(DONATION_PRESETS_MINOR).toEqual([10000, 25000, 50000, 100000])
    for (const value of [
      '-1',
      '1.001',
      '1e3',
      'NaN',
      'Infinity',
      ' 10',
      '90071992547410',
    ])
      expect(() => parseMoneyMinor(value)).toThrow(ApiError)
  })
  it('returns typed failures for every unfinished service and no implicit mock fallback', async () => {
    const { createDjangoApi } = await import('@/lib/api/adapters/django')
    const api = createDjangoApi('https://api.example.invalid/v1')
    await expect(api.animals.list({})).rejects.toMatchObject({
      code: 'NOT_IMPLEMENTED',
    })
    for (const url of [
      '',
      'file:///etc/passwd',
      'https://user:pass@example.invalid',
      'https://example.invalid?proxy=1',
    ])
      expect(() =>
        getApiConfig({
          NEXT_PUBLIC_USE_MOCK_API: 'false',
          DJANGO_API_BASE_URL: url,
        }),
      ).toThrow(ApiError)
  })
})

it('keeps browser-reachable imports free of server-only fixture and private-record modules', async () => {
  const ts = await import('typescript')
  const { readFileSync, existsSync } = await import('node:fs')
  const { resolve, dirname } = await import('node:path')
  const visited = new Set<string>()
  const visit = (file: string): void => {
    if (visited.has(file)) return
    visited.add(file)
    expect(file).not.toContain('/data/fixtures/')
    expect(file).not.toContain('/lib/server/')
    const source = ts.createSourceFile(
      file,
      readFileSync(file, 'utf8'),
      ts.ScriptTarget.Latest,
      true,
    )
    for (const statement of source.statements) {
      if (
        !ts.isImportDeclaration(statement) ||
        !ts.isStringLiteral(statement.moduleSpecifier) ||
        statement.importClause?.isTypeOnly
      )
        continue
      const target = statement.moduleSpecifier.text
      expect(target).not.toBe('server-only')
      if (!target.startsWith('.') && !target.startsWith('@/')) continue
      const base = target.startsWith('@/')
        ? resolve('src', target.slice(2))
        : resolve(dirname(file), target)
      const dependency = [base + '.ts', base + '/index.ts'].find(existsSync)
      expect(dependency).toBeDefined()
      visit(dependency!)
    }
  }
  visit(resolve('src/lib/api/client.ts'))
})

it('orders timestamps by instant across offsets and supports Unicode cursor scopes', async () => {
  const { paginate } = await import('@/lib/api/pagination')
  const rows = [
    { id: 'older', createdAt: '2026-11-02T00:00:00+08:00' },
    { id: 'newer', createdAt: '2026-11-01T20:00:00Z' },
  ]
  const first = paginate(rows, { limit: 1 }, 'animals:compañero 🐾')
  expect(first.items[0].id).toBe('newer')
  expect(
    paginate(rows, { cursor: first.nextCursor! }, 'animals:compañero 🐾')
      .items[0].id,
  ).toBe('older')
})
