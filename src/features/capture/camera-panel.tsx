'use client'
import { useEffect, useRef, useState } from 'react'
import { Camera, ImagePlus, LoaderCircle, RotateCcw, X, PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'

export function CameraPanel({ preview, disabled, onPhoto, onRetake }: {
  preview: string | null
  disabled: boolean
  onPhoto(file: File, source: 'browser_camera' | 'gallery', capturedAt: string | null): void
  onRetake(): void
}) {
  const video = useRef<HTMLVideoElement>(null)
  const fileInput = useRef<HTMLInputElement>(null)
  const stream = useRef<MediaStream | null>(null)
  const sequence = useRef(0)
  const [active, setActive] = useState(false)
  const [starting, setStarting] = useState(false)
  const [error, setError] = useState('')
  function stop() {
    sequence.current += 1
    stream.current?.getTracks().forEach((track) => track.stop())
    stream.current = null
    setActive(false)
    setStarting(false)
  }
  useEffect(() => () => {
    sequence.current += 1
    stream.current?.getTracks().forEach((track) => track.stop())
  }, [])
  useEffect(() => {
    if (video.current && active && stream.current) {
      video.current.srcObject = stream.current
      void video.current.play().catch(() => setError('Tap the camera view to start playback, or choose a photo.'))
    }
  }, [active])
  async function start() {
    setError('')
    if (!navigator.mediaDevices?.getUserMedia) {
      setError('Camera access needs HTTPS or localhost. You can choose a photo from your device instead.')
      return
    }
    setStarting(true)
    const current = ++sequence.current
    try {
      const next = await navigator.mediaDevices.getUserMedia({ video: { facingMode: { ideal: 'environment' }, width: { ideal: 1600 } }, audio: false })
      if (current !== sequence.current) { next.getTracks().forEach((track) => track.stop()); return }
      stream.current = next
      setActive(true)
    } catch (reason) {
      if (current === sequence.current) setError(reason instanceof DOMException && reason.name === 'NotAllowedError' ? 'Camera permission was declined. Allow it in your browser settings or choose a photo.' : 'The camera could not start. Close other camera apps or choose a photo.')
    } finally { if (current === sequence.current) setStarting(false) }
  }
  function capture() {
    const source = video.current
    if (!source?.videoWidth) { setError('Wait for the camera picture, then try again.'); return }
    const canvas = document.createElement('canvas')
    const scale = Math.min(1, 2048 / Math.max(source.videoWidth, source.videoHeight))
    canvas.width = Math.round(source.videoWidth * scale)
    canvas.height = Math.round(source.videoHeight * scale)
    canvas.getContext('2d')?.drawImage(source, 0, 0, canvas.width, canvas.height)
    const time = new Date().toISOString()
    canvas.toBlob((blob) => {
      if (!blob) { setError('The photo could not be captured. Try again.'); return }
      stop()
      onPhoto(new File([blob], 'animal-encounter.jpg', { type: 'image/jpeg' }), 'browser_camera', time)
    }, 'image/jpeg', 0.9)
  }
  return <section aria-label="Photograph an animal" className="space-y-4">
    <div className="relative flex aspect-[4/3] min-h-64 items-center justify-center overflow-hidden rounded-2xl border bg-muted">
      {preview ? <img src={preview} alt="Your selected animal photograph" className="h-full w-full object-contain" />
        : active ? <video ref={video} autoPlay muted playsInline onClick={() => void video.current?.play()} className="h-full w-full object-contain" />
        : <div className="max-w-sm space-y-4 px-7 text-center"><PawPrint className="mx-auto size-14 text-primary/65" /><h2 className="text-xl font-bold">Who did you meet today?</h2><p className="text-sm leading-relaxed text-muted-foreground">Keep a comfortable distance. A clear view of the face and coat helps us compare animals.</p><Button onClick={() => void start()} disabled={disabled || starting}>{starting ? <LoaderCircle className="size-4 animate-spin motion-reduce:animate-none" /> : <Camera className="size-4" />}{starting ? 'Opening camera…' : 'Open camera'}</Button></div>}
      {active && <Button size="icon" variant="secondary" className="absolute right-3 top-3" aria-label="Close camera" onClick={stop}><X className="size-4" /></Button>}
    </div>
    <div className="flex flex-wrap items-center gap-2">
      {active && <Button onClick={capture} disabled={disabled}><Camera className="size-4" />Take photo</Button>}
      {preview && <Button variant="outline" disabled={disabled} onClick={() => { stop(); onRetake(); void start() }}><RotateCcw className="size-4" />Retake</Button>}
      <Button variant="outline" disabled={disabled || starting} onClick={() => fileInput.current?.click()}><ImagePlus className="size-4" />Choose a photo</Button>
      <Input ref={fileInput} id="capture-gallery" aria-label="Choose an animal photograph" className="hidden" tabIndex={-1} type="file" accept="image/jpeg,image/png,image/webp" disabled={disabled} onChange={(event) => {
        const file = event.currentTarget.files?.[0]
        event.currentTarget.value = ''
        if (!file) return
        if (!['image/jpeg', 'image/png', 'image/webp'].includes(file.type) || !file.size || file.size > 10 * 1024 * 1024) { setError('Choose a JPEG, PNG or WebP photo up to 10 MiB. Convert HEIC first.'); return }
        stop(); setError(''); onPhoto(file, 'gallery', null)
      }} />
    </div>
    {error && <p role="alert" className="text-sm text-destructive">{error}</p>}
  </section>
}
