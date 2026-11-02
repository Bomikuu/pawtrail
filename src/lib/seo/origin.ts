/** Validated deployment origin shared by canonical links and structured data. */
export function getSiteOrigin(
  value = process.env.NEXT_PUBLIC_SITE_URL,
): string {
  const url = new URL(value ?? 'http://localhost:3000')
  if (
    !['http:', 'https:'].includes(url.protocol) ||
    url.username ||
    url.password ||
    url.pathname !== '/' ||
    url.search ||
    url.hash
  )
    throw new Error('NEXT_PUBLIC_SITE_URL must be an HTTP(S) origin')
  return url.origin
}
export const siteOrigin = getSiteOrigin()
export const animalUrl = (slug: string) =>
  `${siteOrigin}/pets/${encodeURIComponent(slug)}`
