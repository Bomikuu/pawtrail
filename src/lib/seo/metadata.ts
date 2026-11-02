import type { Metadata } from 'next'
import type { AnimalProfile } from '@/features/animals/types'
import { animalUrl } from './origin'
export function animalMetadata(animal: AnimalProfile): Metadata {
  const url = animalUrl(animal.slug)
  const title = `${animal.name} — PawTrail`
  const description = animal.description.slice(0, 160)
  const demo =
    process.env.NEXT_PUBLIC_USE_MOCK_API !== 'false' ||
    animal.provenance.kind !== 'real'
  return {
    title,
    description,
    alternates: { canonical: url },
    robots: { index: !demo, follow: !demo },
    openGraph: {
      type: 'website',
      title,
      description,
      url,
      images: [
        {
          url: `${url}/opengraph-image`,
          width: 1200,
          height: 630,
          alt: `${animal.name} — Every Paw Has a Story`,
        },
      ],
    },
    twitter: {
      card: 'summary_large_image',
      title,
      description,
      images: [`${url}/opengraph-image`],
    },
  }
}
