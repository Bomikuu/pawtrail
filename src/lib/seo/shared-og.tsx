import { ImageResponse } from 'next/og'
import { publicEntity, type PublicCollection } from './public-entities'
export async function entityOg(collection: PublicCollection, slug: string) {
  const row = await publicEntity(collection, slug)
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
      <div style={{ display: 'flex', fontSize: 76, marginTop: 40 }}>
        {row.name}
      </div>
      <div style={{ display: 'flex', fontSize: 26, marginTop: 40 }}>
        {row.provenance.label}
      </div>
    </div>,
    { width: 1200, height: 630 },
  )
}
