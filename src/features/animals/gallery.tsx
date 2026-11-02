import type { AnimalProfile } from './types'
import { AnimalImage } from '@/components/shared/animal-image'
export function Gallery({ animal }: { animal: AnimalProfile }) {
  const photos = [animal.photo, ...animal.gallery]
    .filter((photo) => photo !== null)
    .filter(
      (photo, index, all) =>
        all.findIndex((row) => row.id === photo.id) === index,
    )
  return (
    <div className="animal-gallery" aria-label={`${animal.name}'s photographs`}>
      {photos.length ? (
        photos.map((photo) => (
          <figure key={photo.id}>
            <AnimalImage image={photo} className="profile-photo" />
            <figcaption>{photo.provenance.label}</figcaption>
          </figure>
        ))
      ) : (
        <AnimalImage image={null} className="profile-photo" />
      )}
    </div>
  )
}
