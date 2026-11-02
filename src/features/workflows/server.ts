import 'server-only'
import { redirect, notFound } from 'next/navigation'
import { getServerApi } from '@/lib/api/server'
import { ApiError } from '@/lib/api/errors'
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
  if (!a) throw new Error('No public neighborhood is configured')
  return {
    areaId: a.id,
    neighborhood: a.name,
    latitude: a.latitude,
    longitude: a.longitude,
    approximateRadiusMeters: a.approximateRadiusMeters,
  }
}
