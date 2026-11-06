import 'server-only'
import type { DemoDraft } from '@/lib/server/demo/transactions'
import type { FixtureSeed } from './index'

const legacy = new Set([
  '/images/pets/milo-dog.jpg',
  '/images/pets/luna-cat.jpg',
])

/** Only replace bundled legacy stock art. Custom photos, edits, and removed records stay authoritative. */
export function refreshSamplePhotos(draft: DemoDraft, baseline: FixtureSeed) {
  for (const collection of ['animals', 'hordes', 'fundraisers'] as const) {
    for (const row of draft.data[collection]) {
      if (
        row.provenance.kind !== 'sample' ||
        !row.photo ||
        !legacy.has(row.photo.url)
      )
        continue
      const original = baseline[collection].find(
        (candidate) => candidate.id === row.id,
      )
      if (original?.photo) row.photo = structuredClone(original.photo)
    }
  }
  for (const row of draft.data.animals) {
    const original = baseline.animals.find(
      (candidate) => candidate.id === row.id,
    )
    if (row.provenance.kind === 'sample' && row.version === 1 && original) {
      if (
        [
          'Brown and white coat; stock photograph is illustrative',
          'Cat at a window; stock photograph is illustrative',
          'Short fur with tabby markings',
          'Short brown and white fur',
        ].includes(row.appearance)
      )
        row.appearance = original.appearance
      if (
        row.characteristics.length === 1 &&
        row.characteristics[0] === 'short coat'
      )
        row.characteristics = original.characteristics
    }
  }
  for (const collection of ['posts', 'sightings'] as const) {
    for (const row of draft.data[collection]) {
      if (row.provenance.kind !== 'sample') continue
      const original = baseline[collection].find(
        (candidate) => candidate.id === row.id,
      )
      if (!original) continue
      row.media = row.media.map((image, index) =>
        legacy.has(image.url) && original.media[index]
          ? structuredClone(original.media[index]!)
          : image,
      )
    }
  }
}
