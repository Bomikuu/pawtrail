/** Browser acquisition timeouts can exclude time waiting for permission. */
export function requestPosition(
  geolocation: Pick<Geolocation, 'getCurrentPosition'>,
  onSuccess: PositionCallback,
  onUnavailable: () => void,
) {
  let finished = false
  const finish = (callback: () => void) => {
    if (finished) return
    finished = true
    clearTimeout(timer)
    callback()
  }
  const timer = setTimeout(() => finish(onUnavailable), 10_000)
  try {
    geolocation.getCurrentPosition(
      (position) => finish(() => onSuccess(position)),
      () => finish(onUnavailable),
      { enableHighAccuracy: false, timeout: 10_000, maximumAge: 60_000 },
    )
  } catch {
    finish(onUnavailable)
  }
  return () => {
    finished = true
    clearTimeout(timer)
  }
}
