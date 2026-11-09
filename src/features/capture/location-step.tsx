'use client'
import { useState } from 'react'
import { LocateFixed, LoaderCircle, MapPin, X } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import type { CaptureLocation } from './schemas'

export function LocationStep({ value, onChange, gallery, disabled }: {
  value: CaptureLocation | null
  onChange(value: CaptureLocation | null): void
  gallery: boolean
  disabled: boolean
}) {
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const [latitude, setLatitude] = useState('')
  const [longitude, setLongitude] = useState('')
  function locate() {
    if (!navigator.geolocation) { setError('Location is unavailable. You can leave it unknown.'); return }
    setPending(true); setError('')
    navigator.geolocation.getCurrentPosition((position) => {
      onChange({ latitude: position.coords.latitude, longitude: position.coords.longitude, accuracyMeters: position.coords.accuracy, measuredAt: new Date(position.timestamp).toISOString(), source: 'device' })
      setPending(false)
    }, () => { setPending(false); setError('Your location could not be acquired. Try again outdoors or continue without it.') }, { enableHighAccuracy: true, maximumAge: 0, timeout: 15000 })
  }
  return <section className="space-y-3" aria-labelledby="capture-location-heading">
    <h2 id="capture-location-heading" className="flex items-center gap-2 font-semibold"><MapPin className="size-4 text-primary" />Where was the photo taken?</h2>
    <p className="text-sm leading-relaxed text-muted-foreground">{gallery ? 'An imported photo may be older. Add its capture location if you know it; your current position will not be attached automatically.' : 'An optional location helps compare nearby sightings. Exact coordinates and device accuracy stay private.'}</p>
    {!gallery && <Button variant="outline" onClick={locate} disabled={disabled || pending}>{pending ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <LocateFixed className="size-4" />}{pending ? 'Finding your position…' : value ? 'Refresh location' : 'Use my location'}</Button>}
    {value && <div className="flex items-center justify-between gap-2 rounded-lg bg-accent p-3 text-sm"><span>{value.source === 'device' ? 'Device location added' : 'Manually reported location'}{value.accuracyMeters !== null ? ' · accuracy about ' + Math.round(value.accuracyMeters) + ' m' : ''}</span><Button variant="ghost" size="icon" aria-label="Remove capture location" disabled={disabled} onClick={() => onChange(null)}><X className="size-4" /></Button></div>}
    <details className="text-sm"><summary className="cursor-pointer rounded-md py-2 text-muted-foreground focus-visible:outline-2 focus-visible:outline-ring">Enter known coordinates manually</summary><div className="mt-2 grid gap-3 sm:grid-cols-2"><label className="grid gap-2" htmlFor="capture-lat">Latitude<Input id="capture-lat" type="number" step="any" min={-90} max={90} value={latitude} onChange={(event) => setLatitude(event.target.value)} disabled={disabled} /></label><label className="grid gap-2" htmlFor="capture-lng">Longitude<Input id="capture-lng" type="number" step="any" min={-180} max={180} value={longitude} onChange={(event) => setLongitude(event.target.value)} disabled={disabled} /></label><Button variant="outline" disabled={disabled} onClick={() => {
      const lat = Number(latitude), lng = Number(longitude)
      if (!latitude.trim() || !longitude.trim() || !Number.isFinite(lat) || !Number.isFinite(lng) || Math.abs(lat) > 90 || Math.abs(lng) > 180) { setError('Enter both valid latitude and longitude.'); return }
      onChange({ latitude: lat, longitude: lng, accuracyMeters: null, measuredAt: null, source: 'manual' }); setError('')
    }}>Use these coordinates</Button></div></details>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>
}
