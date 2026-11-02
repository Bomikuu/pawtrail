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
      src={`/images/profile-banners/${banner.id}-${preview ? 384 : 1440}.webp`}
      srcSet={
        preview
          ? undefined
          : `/images/profile-banners/${banner.id}-384.webp 384w, /images/profile-banners/${banner.id}-768.webp 768w, /images/profile-banners/${banner.id}-1440.webp 1440w`
      }
      sizes={
        preview ? undefined : '(max-width: 48rem) 100vw, calc(100vw - 19rem)'
      }
      width={1440}
      height={banner.height}
      alt=""
      style={{ objectPosition: banner.position }}
      loading={preview ? 'lazy' : undefined}
      fetchPriority={preview ? undefined : 'high'}
    />
  )
}
