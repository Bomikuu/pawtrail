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
    <div
      className={
        'animal-gallery grid grid-cols-[repeat(auto-fit,_minmax(min(100%,_18rem),_1fr))] gap-4 [&_figure]:m-0 [&_figcaption]:text-sm [&_figcaption]:text-muted-foreground [&_figcaption]:mt-2'
      }
      aria-label={`${animal.name}'s photographs`}
    >
      {photos.length ? (
        photos.map((photo) => (
          <figure key={photo.id}>
            <AnimalImage
              image={photo}
              className={
                'profile-photo block w-full h-auto [aspect-ratio:4/3] object-cover rounded-xl bg-card [.animal-image-fallback&]:grid [.animal-image-fallback&]:[place-items:center] [.animal-image-fallback&]:text-muted-foreground [.animal-image-fallback&]:[border:1px_solid_var(--border)]'
              }
            />
            <figcaption>{photo.provenance.label}</figcaption>
          </figure>
        ))
      ) : (
        <AnimalImage
          image={null}
          className={
            'profile-photo block w-full h-auto [aspect-ratio:4/3] object-cover rounded-xl bg-card [.animal-image-fallback&]:grid [.animal-image-fallback&]:[place-items:center] [.animal-image-fallback&]:text-muted-foreground [.animal-image-fallback&]:[border:1px_solid_var(--border)]'
          }
        />
      )}
    </div>
  )
}
