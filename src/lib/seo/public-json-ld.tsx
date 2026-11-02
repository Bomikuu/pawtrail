import { siteOrigin } from './origin'
import { safeJsonLd } from './json-ld'
export function PublicJsonLd({
  name,
  description,
  path,
}: {
  name: string
  description: string
  path: string
}) {
  const url = `${siteOrigin}${path}`
  return (
    <script
      type="application/ld+json"
      dangerouslySetInnerHTML={{
        __html: safeJsonLd({
          '@context': 'https://schema.org',
          '@graph': [
            {
              '@type': 'WebPage',
              '@id': url,
              url,
              name,
              description: description.slice(0, 500),
            },
            {
              '@type': 'BreadcrumbList',
              itemListElement: [
                {
                  '@type': 'ListItem',
                  position: 1,
                  name: 'PawTrail',
                  item: siteOrigin,
                },
                { '@type': 'ListItem', position: 2, name, item: url },
              ],
            },
          ],
        }),
      }}
    />
  )
}
