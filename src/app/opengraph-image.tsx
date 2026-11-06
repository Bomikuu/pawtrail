import { ImageResponse } from 'next/og'
import { readFile } from 'node:fs/promises'
import { join } from 'node:path'

export const alt =
  'PawTrail — Every Paw Has a Story. Animal stories, kind neighbors, practical care.'
export const size = { width: 1200, height: 630 }
export const contentType = 'image/png'

export default async function Image() {
  const mark = await readFile(
    join(process.cwd(), 'public/images/pawtrail/share-community.png'),
  )
  return new ImageResponse(
    <div
      style={{
        display: 'flex',
        flexDirection: 'column',
        justifyContent: 'center',
        width: '100%',
        height: '100%',
        background: '#fffbf5',
        color: '#3b2416',
        padding: '64px 72px',
        borderBottom: '18px solid #f97316',
      }}
    >
      <div
        style={{
          display: 'flex',
          fontSize: 48,
          fontWeight: 800,
          marginBottom: 32,
        }}
      >
        Paw<span style={{ color: '#df5a0a' }}>Trail</span>
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 82,
          fontWeight: 800,
          lineHeight: 1.05,
          maxWidth: 780,
        }}
      >
        Every paw has a story.
      </div>
      <div
        style={{
          display: 'flex',
          fontSize: 28,
          color: '#655344',
          marginTop: 28,
          maxWidth: 690,
        }}
      >
        Animal stories. Kind neighbors. Practical care.
      </div>
      <img
        src={`data:image/png;base64,${mark.toString('base64')}`}
        alt=""
        width={330}
        height={153}
        style={{
          position: 'absolute',
          right: 54,
          bottom: 48,
          objectFit: 'contain',
        }}
      />
    </div>,
    size,
  )
}
