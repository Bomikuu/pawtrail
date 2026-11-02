import type { AnimalProfile } from '@/features/animals/types'
import { animalUrl, siteOrigin } from './origin'
type JsonValue =
  null | string | number | boolean | JsonValue[] | { [key: string]: JsonValue }
export type JsonLdDocument = {
  '@context': 'https://schema.org'
  '@graph': { [key: string]: JsonValue }[]
}
export function animalJsonLd(animal: AnimalProfile): JsonLdDocument {
  const url = animalUrl(animal.slug)
  return {
    '@context': 'https://schema.org',
    '@graph': [
      {
        '@type': 'WebPage',
        '@id': url,
        url,
        name: `${animal.name} — PawTrail`,
        description: animal.description,
        mainEntity: { '@id': `${url}#animal` },
      },
      {
        '@type': 'Thing',
        '@id': `${url}#animal`,
        name: animal.name,
        description: animal.description,
        url,
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
          { '@type': 'ListItem', position: 2, name: animal.name, item: url },
        ],
      },
    ],
  }
}
export function safeJsonLd(value: JsonLdDocument): string {
  return JSON.stringify(value)
    .replace(/</g, '\\u003c')
    .replace(/>/g, '\\u003e')
    .replace(/&/g, '\\u0026')
    .replace(/\u2028/g, '\\u2028')
    .replace(/\u2029/g, '\\u2029')
}
