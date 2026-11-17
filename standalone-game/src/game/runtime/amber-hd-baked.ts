import detail from './amber-detail-manifest.json'
import type { AmberComparisonController, AmberComparisonOptions } from './amber-representation-scene'

/** One decoded clip at a time; release bitmap pixels on every clip change. */
export async function mountAmberHD(host: HTMLElement, read: () => AmberComparisonOptions, failed: (message: string) => void, signal: AbortSignal, notify: (message: string) => void): Promise<AmberComparisonController> {
  const canvas = document.createElement('canvas'), context = canvas.getContext('2d')!
  canvas.width = detail.frameWidth; canvas.height = detail.frameHeight
  canvas.style.width = detail.displayFrame.width * read().zoom + 'px'; canvas.style.height = detail.displayFrame.height * read().zoom + 'px'
  canvas.style.imageRendering = 'auto'; canvas.className = 'block shrink-0'
  canvas.setAttribute('role', 'img'); canvas.setAttribute('aria-label', 'Amber high-detail baked animation')
  let bitmap: ImageBitmap | undefined, request: AbortController | undefined
  let disposed = false, raf = 0, previous = 0, elapsed = 0, key = '', signature = '', loading = false
  const dispose = () => { if (disposed) return; disposed = true; cancelAnimationFrame(raf); request?.abort(); bitmap?.close(); bitmap = undefined; canvas.remove(); signal.removeEventListener('abort', dispose) }
  signal.addEventListener('abort', dispose, { once: true })
  const selectClip = async (action: AmberComparisonOptions['action'], direction: AmberComparisonOptions['direction']) => {
    const nextKey = action + ':' + direction
    key = nextKey; loading = true; request?.abort(); request = new AbortController()
    const local = request
    bitmap?.close(); bitmap = undefined; context.clearRect(0, 0, canvas.width, canvas.height)
    notify(`Loading ${action} · ${direction}…`)
    try {
      const response = await fetch(detail.clips[action][direction].url, { signal: local.signal })
      if (!response.ok) throw new Error('Amber’s detail frames could not load. Retry the preview.')
      const next = await createImageBitmap(await response.blob())
      if (disposed || signal.aborted || local.signal.aborted || key !== nextKey) { next.close(); return }
      bitmap = next; loading = false; signature = ''; notify(`Ready · ${action} · ${direction}`)
    } catch (error) {
      if (disposed || signal.aborted || local.signal.aborted) return
      throw error
    }
  }
  try {
    signal.throwIfAborted()
    await selectClip(read().action, read().direction)
    signal.throwIfAborted(); host.append(canvas)
    const tick = (now: number) => {
      if (disposed) return
      raf = requestAnimationFrame(tick)
      if (document.hidden) { previous = 0; return }
      const options = read(), dt = previous ? Math.min(50, now - previous) : 0; previous = now
      if (!options.paused) elapsed += dt * options.speed
      const nextKey = options.action + ':' + options.direction
      if (nextKey !== key) void selectClip(options.action, options.direction).catch(error => { dispose(); failed(error instanceof Error ? error.message : 'Amber’s detail frames stopped loading.') })
      if (loading || !bitmap) return
      const clip = detail.clips[options.action][options.direction]
      const frame = Math.floor(elapsed % clip.durationMs / clip.durationMs * clip.frames)
      const next = [key, frame, options.zoom, options.focus].join(':')
      if (signature === next) return
      signature = next
      try {
        canvas.style.width = detail.displayFrame.width * options.zoom + 'px'
        canvas.style.height = detail.displayFrame.height * options.zoom + 'px'
        context.clearRect(0, 0, canvas.width, canvas.height); context.imageSmoothingEnabled = true
        const x = frame % clip.columns * detail.frameWidth, y = Math.floor(frame / clip.columns) * detail.frameHeight
        if (options.focus === 'face') {
          const crop = detail.faceCrop
          const scale = Math.min(canvas.width / crop.width, canvas.height / crop.height)
          const width = crop.width * scale, height = crop.height * scale
          context.drawImage(bitmap, x + crop.x, y + crop.y, crop.width, crop.height, (canvas.width - width) / 2, (canvas.height - height) / 2, width, height)
        } else {
          context.fillStyle = 'rgba(52, 39, 31, .2)'; context.beginPath(); context.ellipse(128, 244, 34, 8, 0, 0, Math.PI * 2); context.fill()
          context.drawImage(bitmap, x, y, detail.frameWidth, detail.frameHeight, 0, 0, canvas.width, canvas.height)
        }
      } catch (error) { dispose(); failed(error instanceof Error ? error.message : 'Amber’s detail image could not be displayed. Retry the preview.') }
    }
    raf = requestAnimationFrame(tick)
    return { restart() { elapsed = 0; signature = '' }, dispose }
  } catch (error) { dispose(); throw error }
}
