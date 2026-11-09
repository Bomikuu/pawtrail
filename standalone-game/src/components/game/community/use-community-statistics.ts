import { useEffect, useMemo, useState } from 'react'
import type { PlatformBridge, MapViewer } from '@/game/platform'
import type {
  CityMetrics,
  CityStatistics,
  CommunityStatistics,
} from '@/game/discovery/region-stats'
import { loadHomeCommunityCounts, housingFailure } from '@/game/housing/client'
const EMPTY_PROVINCES: CityStatistics[] = []
export function useCommunityStatistics(
  platform: PlatformBridge | undefined,
  revision: number,
  viewer: MapViewer | null,
) {
  const [data, setData] = useState<CommunityStatistics | null>(null)
  const [homes, setHomes] = useState<Record<string, number> | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)
  const [homeStatus, setHomeStatus] = useState<
    'ready' | 'auth' | 'unavailable'
  >('auth')
  const [pulse, setPulse] = useState(0)
  useEffect(() => {
    const timer = setInterval(() => setPulse((value) => value + 1), 60000)
    return () => clearInterval(timer)
  }, [])
  useEffect(() => {
    const abort = new AbortController()
    setLoading(true)
    setError(false)
    if (!platform?.communityStats) {
      setLoading(false)
      setError(true)
      return
    }
    platform
      .communityStats(abort.signal)
      .then((value) => {
        if (!abort.signal.aborted) setData(value)
      })
      .catch(() => {
        if (!abort.signal.aborted) {
          setData(null)
          setError(true)
        }
      })
      .finally(() => {
        if (!abort.signal.aborted) setLoading(false)
      })
    return () => abort.abort()
  }, [platform, revision, pulse])
  useEffect(() => {
    const abort = new AbortController()
    setHomes(null)
    setHomeStatus(viewer?.authenticated ? 'unavailable' : 'auth')
    if (viewer?.authenticated && viewer.id) {
      loadHomeCommunityCounts(abort.signal)
        .then((value) => {
          if (!abort.signal.aborted && value.viewerId === 'real:' + viewer.id) {
            setHomes(value.cities)
            setHomeStatus('ready')
          }
        })
        .catch((reason) => {
          if (!abort.signal.aborted)
            setHomeStatus(
              housingFailure(reason) === 'auth' ? 'auth' : 'unavailable',
            )
        })
    }
    return () => abort.abort()
  }, [viewer?.id, viewer?.authenticated, revision, pulse])
  const cities = useMemo<CityMetrics[]>(
    () =>
      data?.cities.map((city) => ({
        ...city,
        homes: homes ? (homes[city.id] ?? 0) : null,
      })) ?? [],
    [data, homes],
  )
  return {
    cities,
    provinces: data?.provinces ?? EMPTY_PROVINCES,
    loading,
    error,
    homeStatus,
  }
}
