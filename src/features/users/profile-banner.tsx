import { getProfileBanner } from './banner-presets'
export function ProfileBanner({
  id,
  preview = false,
}: {
  id?: string | null
  preview?: boolean
}) {
  const banner = getProfileBanner(id)
  return (
    <img
      className="profile-cover-image"
      src={`/images/profile-banners/collection-${banner.id}-${preview ? 384 : 752}.webp`}
      srcSet={
        preview
          ? undefined
          : `/images/profile-banners/collection-${banner.id}-384.webp 384w, /images/profile-banners/collection-${banner.id}-752.webp 752w`
      }
      sizes={
        preview ? undefined : '(max-width: 48rem) 100vw, calc(100vw - 19rem)'
      }
      width={752}
      height={banner.height}
      alt=""
      style={{ objectPosition: banner.position }}
      loading={preview ? 'lazy' : undefined}
      fetchPriority={preview ? undefined : 'high'}
    />
  )
}
