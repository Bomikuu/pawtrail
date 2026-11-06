import Link from 'next/link'
import credits from '@/data/pet-photo-credits.json'
import { ButtonLink } from '@/components/ui/button-link'

export const metadata = { title: 'Photo credits — PawTrail' }

export default function PhotoCreditsPage() {
  return (
    <article className="photo-credits-page">
      <h1>Every photograph has a maker</h1>
      <p>
        Thank you to the photographers whose work illustrates PawTrail’s sample
        community. These are fictional profiles; the photographed animals’
        identities, locations and care histories are not PawTrail records.
      </p>
      <p>
        Images are cropped, resized and encoded as WebP. Each derivative keeps
        its source license. Creative Commons ShareAlike terms apply to those
        image files.
      </p>
      <ButtonLink variant="outline" href="/community">
        Back to the community
      </ButtonLink>
      <ul>
        {credits.map((photo) => (
          <li key={photo.slug}>
            <img
              src={photo.image}
              width={192}
              height={144}
              alt={photo.description}
              loading="lazy"
            />
            <div>
              <h2>
                {photo.slug.charAt(0).toUpperCase() + photo.slug.slice(1)}’s
                sample portrait
              </h2>
              <p>{photo.author}</p>
              <p>
                <a href={photo.source}>Original photograph</a> ·{' '}
                <a href={photo.licenseUrl}>{photo.license}</a>
              </p>
              <small>{photo.changes}</small>
            </div>
          </li>
        ))}
      </ul>
      <p>
        Avatar, badge and banner illustrations were supplied by the PawTrail
        owner. <Link href="/community">Explore the community</Link>.
      </p>
    </article>
  )
}
