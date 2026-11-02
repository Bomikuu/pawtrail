import { ImageResponse } from 'next/og'
import { getPublicAnimal } from '@/features/animals/server'
export const alt = 'PawTrail — Every Paw Has a Story'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export default async function Image({
  params,
}: {
  params: Promise<{ slug: string }>
}) {
  const animal = await getPublicAnimal((await params).slug)
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#FFFBF5',
        color: '#3B2416',
        padding: 70,
        fontSize: 36,
      }}
    >
      <div style={{ display: 'flex', color: '#0F766E' }}>
        PawTrail · Every Paw Has a Story
      </div>
      <div style={{ display: 'flex', fontSize: 100, marginTop: 40 }}>
        {animal.name}
      </div>
      <div style={{ display: 'flex', marginTop: 25 }}>
        {animal.location.neighborhood} · {animal.status}
      </div>
      <div style={{ display: 'flex', fontSize: 26, marginTop: 40 }}>
        {animal.provenance.label}
      </div>
    </div>,
    size,
  )
}
