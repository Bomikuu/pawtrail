import type { MetadataRoute } from 'next'
import { siteOrigin } from '@/lib/seo/origin'
export default function robots(): MetadataRoute.Robots {
  return process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false'
    ? { rules: { userAgent: '*', disallow: '/' } }
    : {
        rules: {
          userAgent: '*',
          allow: '/',
          disallow: [
            '/dashboard',
            '/api/',
            '/adopt/applications',
            '/adopt/preferences',
            '/adopt/interested',
            '/login',
            '/register',
            '/animals/report',
            '/sightings/create',
            '/fundraisers/create',
            '/missions/create',
          ],
        },
        sitemap: `${siteOrigin}/sitemap.xml`,
      }
}
