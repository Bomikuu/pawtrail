import { ImageResponse } from 'next/og'
import { notFound } from 'next/navigation'
import { getServerApi } from '@/lib/api/server'
import { publicRecord } from '@/features/workflows/server'
export const alt = 'A PawTrail community story'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'
export default async function Image({
  params,
}: {
  params: Promise<{ id: string }>
}) {
  const post = await publicRecord(async () =>
    (await getServerApi()).community.get((await params).id),
  )
  if (post.moderation !== 'published') notFound()
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
        PawTrail · Every Paw Has a Story
      </div>
      <div style={{ display: 'flex', fontSize: 52, marginTop: 40 }}>
        {post.text.slice(0, 200)}
      </div>
      <div style={{ display: 'flex', fontSize: 26, marginTop: 40 }}>
        {post.provenance.label}
      </div>
    </div>,
    size,
  )
}
