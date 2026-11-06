import type { ReactNode } from 'react'
import '@/features/animals/pet-profile.css'
import { getPublicAnimal, getPetActivity } from '@/features/animals/server'
import { getServerApi } from '@/lib/api/server'
import { animalUrl } from '@/lib/seo/origin'
import { animalJsonLd, safeJsonLd } from '@/lib/seo/json-ld'
import {
  AnimalSocialHeader,
  AnimalAbout,
  AnimalCareMilestones,
  AnimalRecentSighting,
} from '@/features/animals/social-profile'
import { ProfileActions } from '@/features/animals/profile-actions'
import { HelpPanel } from '@/features/animals/help-panel'
import { AchievementActivity } from '@/features/achievements/activity'
import { Discussion } from '@/features/community/discussion'
import { ReportDialog } from '@/features/community/report-dialog'
import { NavigationScope } from '@/components/layout/navigation-scope'
import { NavigationRegion } from '@/components/layout/navigation-region'
import { PetSectionLoading } from '@/features/animals/profile-navigation'

export default async function PetLayout({
  children,
  params,
}: {
  children: ReactNode
  params: Promise<{ slug: string }>
}) {
  const { slug } = await params
  const [animal, activity, session] = await Promise.all([
    getPublicAnimal(slug),
    getPetActivity(slug, 'all', 'priority', undefined).catch(() => null),
    (await getServerApi()).auth.session(),
  ])
  const path = '/pets/' + encodeURIComponent(animal.slug)
  return (
    <NavigationScope pathname={path} region={path + ':section'}>
      <article className="animal-profile pet-social-profile">
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(animalJsonLd(animal)) }}
        />
        <div className="pet-social-columns">
          <div className="pet-primary-column">
            <AnimalSocialHeader
              animal={animal}
              activity={activity}
              actions={
                <ProfileActions
                  key={`${animal.id}:${animal.viewerSaved}`}
                  id={animal.id}
                  slug={animal.slug}
                  name={animal.name}
                  initialSaved={animal.viewerSaved}
                  viewerScope={session.cacheScope}
                  url={animalUrl(animal.slug)}
                  adoptable={animal.adoptable}
                  fundraiserId={animal.fundraiserIds[0]}
                />
              }
            />
            <div className="pet-main-column" id="pet-activity">
              <NavigationRegion
                region={path + ':section'}
                fallback={<PetSectionLoading />}
              >
                {children}
              </NavigationRegion>
              <section
                id="discussion"
                className="profile-section pet-discussion"
                aria-labelledby="discussion-heading"
              >
                <h2 id="discussion-heading">Talk about {animal.name}</h2>
                <ReportDialog
                  target={{ kind: 'animal', id: animal.id }}
                  returnTo={path}
                />
                <Discussion
                  target={{ kind: 'animal', id: animal.id }}
                  returnTo={path + '#discussion'}
                  subject={animal.name}
                  composerFirst
                  photoContext={[
                    {
                      ref: { kind: 'animal', id: animal.id },
                      title: animal.name,
                      href: path,
                    },
                  ]}
                />
              </section>
            </div>
          </div>
          <aside
            className="pet-details-column"
            aria-label={'About and care for ' + animal.name}
          >
            <AnimalAbout animal={animal} />
            <AnimalCareMilestones animal={animal} activity={activity} />
            <AnimalRecentSighting animal={animal} activity={activity} />
            <HelpPanel animal={animal} />
            <AchievementActivity
              target={{ kind: 'animal', id: animal.id }}
              href={path}
              showShare={false}
            />
          </aside>
        </div>
      </article>
    </NavigationScope>
  )
}
