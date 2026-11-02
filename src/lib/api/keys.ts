function stable(value: unknown): unknown {
  if (Array.isArray(value)) return value.map(stable)
  if (value && typeof value === 'object')
    return Object.fromEntries(
      Object.entries(value)
        .filter(([, v]) => v !== undefined)
        .sort(([a], [b]) => a.localeCompare(b))
        .map(([k, v]) => [k, stable(v)]),
    )
  return value
}
export interface QueryKeyFactory {
  all(domain: string): readonly string[]
  list(domain: string, filters?: object): readonly string[]
  detail(domain: string, id: string): readonly string[]
}
/** Scope is a non-secret viewer/session cache identity, never a credential. */
export function queryKeys(scope: string): QueryKeyFactory {
  return {
    all: (domain) => ['pawtrail', scope, domain],
    list: (domain, filters = {}) => [
      'pawtrail',
      scope,
      domain,
      'list',
      JSON.stringify(stable(filters)),
    ],
    detail: (domain, id) => ['pawtrail', scope, domain, 'detail', id],
  }
}
