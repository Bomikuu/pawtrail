import { NavigationLink as Link } from '@/components/layout/navigation-link'
import credits from '@/data/pet-photo-credits.json'
import { ButtonLink } from '@/components/ui/button-link'

export const metadata = { title: 'Photo credits — PawTrail' }

export default function PhotoCreditsPage() {
  return (
    <article
      className={
        'photo-credits-page max-w-280 [margin:0_auto] [&_h1]:font-[850] [&_h1]:text-[1.75rem] [&_h1]:leading-[1.25] [&_h1]:font-heading [&_>_p]:max-w-[75ch] [&_>_p]:[line-height:1.65] [&_>_ul]:list-none [&_>_ul]:p-0 [&_>_ul]:[margin:1.5rem_0] [&_li]:flex [&_li]:gap-5 [&_li]:[border-top:1px_solid_var(--social-line)] [&_li]:[padding:1.25rem_0] [&_li_img]:w-40 [&_li_img]:h-30 [&_li_img]:object-cover [&_li_img]:rounded-xl [&_li_h2]:font-[800] [&_li_h2]:text-lg [&_li_h2]:leading-[1.3] [&_li_h2]:font-heading [&_li_h2]:[margin:0_0_0.5rem] [&_li_p]:text-sm [&_li_p]:[margin:0.375rem_0] [&_small]:text-muted-foreground [&_small]:text-xs max-[48rem]:[&_li]:flex-col'
      }
    >
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
