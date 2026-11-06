import 'server-only'
import { provenance } from './shared'
import credits from '@/data/pet-photo-credits.json'
/** Stock subjects illustrate fictional animals. See docs/assets/credits.md. */
export const samplePhotos = credits.map((photo) => ({
  id: `stock-${photo.slug}`,
  url: photo.image,
  alt: `${photo.description} — licensed illustrative photograph for fictional ${photo.slug.charAt(0).toUpperCase() + photo.slug.slice(1)}`,
  provenance,
}))
