import { useEffect, useState } from 'react'
import {
  EMPTY_COMMUNITIES,
  invalidateCommunityAreas,
  loadCommunityAreas,
  type CommunityAreas,
} from '@/features/neighborhood/game/discovery/communities'
import type { MapBounds } from './map-canvas'
export function useCommunityAreas(
  bounds: MapBounds | null,
  enabled: boolean,
  revision: number,
) {
  const [data, setData] = useState<CommunityAreas>(EMPTY_COMMUNITIES)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(false)
  const [attempt, setAttempt] = useState(0)
  useEffect(() => {
    invalidateCommunityAreas()
  }, [revision])
  useEffect(() => {
    if (!enabled || !bounds) {
      setLoading(false)
      return
    }
    const request = new AbortController()
    setLoading(true)
    const timer = setTimeout(() => {
      loadCommunityAreas(bounds, request.signal)
        .then((value) => {
          if (!request.signal.aborted) {
            setData(value)
            setError(false)
          }
        })
        .catch(() => {
          if (!request.signal.aborted) setError(true)
        })
        .finally(() => {
          if (!request.signal.aborted) setLoading(false)
        })
    }, 350)
    return () => {
      clearTimeout(timer)
      request.abort()
    }
  }, [bounds, enabled, revision, attempt])
  return {
    data: enabled ? data : EMPTY_COMMUNITIES,
    loading: enabled && (!bounds || loading),
    error,
    retry: () => {
      invalidateCommunityAreas()
      setAttempt((value) => value + 1)
    },
  }
}
