import { useEffect, useRef, useState } from 'react'
import type { MapEntity, Point, UserPosition } from '@/features/neighborhood/game/discovery/types'
import type { MapViewer, PlatformBridge } from '@/features/neighborhood/game/platform'
import {
  routeDestination,
  walkingRoute,
  type WalkingRoute,
} from '@/features/neighborhood/game/discovery/directions'

export type DirectionsState = {
  target: MapEntity
  phase: 'locating' | 'routing' | 'ready' | 'error' | 'picking'
  origin: UserPosition | null
  route: WalkingRoute | null
  error: string
  destinationReady: boolean
}
export function useDirections(
  locate: () => Promise<UserPosition | null>,
  resolveDestination?: PlatformBridge['mapDestination'],
) {
  const [state, setState] = useState<DirectionsState | null>(null)
  const [fit, setFit] = useState(0)
  const request = useRef<AbortController | null>(null)
  const revision = useRef(0)
  const beforePick = useRef<DirectionsState | null>(null)
  const current = useRef<DirectionsState | null>(null)
  // Update the ref in the same event, so a second map tap cannot reuse an old
  // picking state before React renders. The destination belongs to this intent.
  function commit(value: DirectionsState | null) {
    current.current = value
    setState(value)
  }
  useEffect(
    () => () => {
      revision.current++
      request.current?.abort()
    },
    [],
  )
  function stop() {
    revision.current++
    request.current?.abort()
    beforePick.current = null
    commit(null)
  }
  async function start(
    entity: MapEntity,
    chosenOrigin?: UserPosition,
    destinationResolved = false,
  ) {
    if (!entity.animal) return
    request.current?.abort()
    beforePick.current = null
    const controller = new AbortController(),
      run = ++revision.current,
      animalId = entity.animal.id
    request.current = controller
    let target = routeDestination(entity)
    let destinationReady = destinationResolved || !resolveDestination
    commit({
      target,
      phase: chosenOrigin ? 'routing' : 'locating',
      origin: chosenOrigin ?? null,
      route: null,
      error: '',
      destinationReady,
    })
    try {
      if (resolveDestination && !destinationResolved) {
        const location = await resolveDestination(animalId, controller.signal)
        if (revision.current !== run) return
        if (!location || location.animalId !== animalId)
          throw new Error(
            'A matching published location is no longer available for this animal. Open its profile for the latest information.',
          )
        target = {
          ...target,
          name: location.name,
          area: location.area,
          coordinates: [...location.coordinates],
          locationLabel: location.label,
          approximateRadiusMeters: location.radiusMeters,
          animal: {
            ...entity.animal,
            name: location.name,
            publicLocation: location,
            lastSeen: location.lastSeen,
          },
        }
        destinationReady = true
        commit({
          target,
          phase: chosenOrigin ? 'routing' : 'locating',
          origin: chosenOrigin ?? null,
          route: null,
          error: '',
          destinationReady,
        })
      }
      const origin = chosenOrigin ?? (await locate())
      if (revision.current !== run) return
      if (!origin) {
        const unavailable: DirectionsState = {
          target,
          phase: 'error',
          origin: null,
          route: null,
          error:
            'Location access is unavailable. Choose your starting point on the map to continue.',
          destinationReady,
        }
        beforePick.current = unavailable
        commit({ ...unavailable, phase: 'picking' })
        return
      }
      commit({
        target,
        phase: 'routing',
        origin,
        route: null,
        error: '',
        destinationReady,
      })
      const route = await walkingRoute(
        origin.coordinates,
        target.coordinates,
        controller.signal,
      )
      if (revision.current !== run) return
      commit({
        target,
        phase: 'ready',
        origin,
        route,
        error: '',
        destinationReady,
      })
      setFit((value) => value + 1)
    } catch (error) {
      if (revision.current !== run || !current.current) return
      commit({
        ...current.current,
        phase: 'error',
        destinationReady,
        error:
          error instanceof Error
            ? error.message
            : 'Walking directions could not load. Try again.',
      })
    }
  }
  function pickOrigin() {
    if (
      !current.current?.destinationReady ||
      current.current.phase === 'picking'
    )
      return
    beforePick.current = current.current
    revision.current++
    request.current?.abort()
    commit({ ...current.current, phase: 'picking', route: null, error: '' })
  }
  function cancelPicking() {
    if (current.current?.phase !== 'picking') return
    const previous = beforePick.current
    beforePick.current = null
    if (
      previous &&
      (previous.phase === 'locating' || previous.phase === 'routing')
    ) {
      void start(
        previous.target,
        previous.origin ?? undefined,
        previous.destinationReady,
      )
      return
    }
    commit(previous)
    if (previous?.route) setFit((value) => value + 1)
  }
  function chooseOrigin(coordinates: Point, identity: MapViewer | null) {
    const value = current.current
    if (!value?.destinationReady || value.phase !== 'picking') return
    // Choosing a start must never resolve or replace the destination again.
    return start(
      value.target,
      {
        coordinates,
        accuracy: null,
        source: 'manual',
        name: identity?.name ?? value.origin?.name ?? 'You',
        avatar: identity?.avatar ?? value.origin?.avatar ?? null,
      },
      true,
    )
  }
  function retry() {
    const value = current.current
    if (value)
      return start(
        value.target,
        value.origin ?? undefined,
        value.destinationReady,
      )
  }
  return {
    state,
    isPicking: () => current.current?.phase === 'picking',
    fit,
    start,
    retry,
    stop,
    pickOrigin,
    chooseOrigin,
    cancelPicking,
    showRoute: () => setFit((value) => value + 1),
  }
}
