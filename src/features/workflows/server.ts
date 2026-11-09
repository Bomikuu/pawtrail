import 'server-only'
import { redirect, notFound } from 'next/navigation'
import { getServerApi } from '@/lib/api/server'
import { ApiError } from '@/lib/api/errors'
import type { PawTrailApi } from '@/lib/api/contracts'

export async function shelterOptions(api: PawTrailApi, ids: string[]) {
  const names = new Map<string, string>()
  const keys = [...new Set(ids)]
  if (!keys.length) return []
  let cursor: string | undefined
  do {
    const page = await api.shelters.list({
      limit: 50,
      ...(cursor ? { cursor } : {}),
    })
    for (const shelter of page.items) names.set(shelter.id, shelter.name)
    cursor = page.nextCursor ?? undefined
  } while (cursor && keys.some((id) => !names.has(id)))
  return keys.map((id, index) => ({
    value: id,
    label: names.get(id) ?? `Assigned shelter ${index + 1}`,
  }))
}
export async function privateApi(path: string) {
  const api = await getServerApi()
  if (!(await api.auth.session()).actor)
    redirect(`/login?returnTo=${encodeURIComponent(path)}`)
  return api
}
export async function publicRecord<T>(read: () => Promise<T>): Promise<T> {
  try {
    return await read()
  } catch (e) {
    if (e instanceof ApiError && e.status === 404) notFound()
    throw e
  }
}
export type SearchParams = Promise<
  Record<string, string | string[] | undefined>
>
export function queryValue(value: string | string[] | undefined) {
  return typeof value === 'string' ? value.slice(0, 2000) : undefined
}
export async function publicArea() {
  const api = await getServerApi(),
    areas = await api.discovery.searchAreas('')
  const a = areas[0]
  if (!a) return null
  return {
    areaId: a.id,
    neighborhood: a.name,
    latitude: a.latitude,
    longitude: a.longitude,
    approximateRadiusMeters: a.approximateRadiusMeters,
  }
}
