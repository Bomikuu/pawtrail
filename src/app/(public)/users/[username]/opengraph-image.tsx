import { ImageResponse } from 'next/og'
import { getServerApi } from '@/lib/api/server'
import { publicRecord } from '@/features/workflows/server'
export const alt = 'A PawTrail community profile'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export default async function Image({
  params,
}: {
  params: Promise<{ username: string }>
}) {
  const u = await publicRecord(async () =>
    (await getServerApi()).users.get((await params).username),
  )
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        height: '100%',
        width: '100%',
        background: '#FFFBF5',
        color: '#3B2416',
        padding: 70,
        fontSize: 36,
      }}
    >
      <div style={{ display: 'flex', color: '#0F766E' }}>
        PawTrail community
      </div>
      <div style={{ display: 'flex', fontSize: 80, marginTop: 40 }}>
        {u.displayName}
      </div>
      <div style={{ display: 'flex', marginTop: 30 }}>
        {u.bio.slice(0, 160)}
      </div>
      <div style={{ display: 'flex', fontSize: 26, marginTop: 40 }}>
        {u.provenance.label}
      </div>
    </div>,
    size,
  )
}
