import type { ReactNode } from 'react'
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
      <article
        className={
          'animal-profile max-w-224 pet-social-profile [.dark_.animal-profile&]:bg-[transparent] [.animal-profile&]:w-full [.animal-profile&]:max-w-281 [.animal-profile&]:[container-type:inline-size] [.animal-profile&]:mx-auto [.animal-profile&]:min-w-0 [.animal-profile&]:bg-[transparent] [.animal-profile&]:rounded-2xl [.animal-profile&]:pb-6'
        }
      >
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: safeJsonLd(animalJsonLd(animal)) }}
        />
        <div
          className={
            'pet-social-columns grid grid-cols-1 gap-6 p-6 items-start max-[65rem]:grid-cols-1 max-[65rem]:gap-4 max-[48rem]:p-4 [.pet-social-profile_&]:grid-cols-[minmax(0,_1fr)_minmax(15rem,_18.75rem)] [.pet-social-profile_&]:p-0 [.pet-social-profile_&]:gap-6 @max-[52rem]:[.pet-social-profile_&]:grid-cols-1'
          }
        >
          <div
            className={
              'pet-primary-column [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] min-w-0 w-full max-w-200 rounded-2xl bg-card @max-[52rem]:mx-auto'
            }
          >
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
            <div
              className={
                'pet-main-column min-w-0 grid gap-5 [scroll-margin-top:6rem] [.pet-primary-column_>_&]:p-5 @max-[38rem]:[.pet-primary-column_>_&]:p-4'
              }
              id="pet-activity"
            >
              <NavigationRegion
                region={path + ':section'}
                fallback={<PetSectionLoading />}
              >
                {children}
              </NavigationRegion>
              <section
                id="discussion"
                className={
                  'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm pet-discussion [.dark_&]:border-[#333333] [.pet-social-profile_&]:p-4.5 [.pet-social-profile_&]:[border:1px_solid_#e8ddcf] [.pet-social-profile_&]:rounded-2xl [.pet-social-profile_&]:[scroll-margin-top:6rem] [.pet-social-profile_&]:m-0'
                }
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
            className={
              'pet-details-column min-w-0 grid gap-5 grid-cols-2 items-start max-[65rem]:grid-cols-2 max-[48rem]:grid-cols-1 max-[38rem]:grid-cols-1 [.pet-social-profile_&]:grid-cols-1 [.pet-social-profile_&]:gap-4 @max-[52rem]:[.pet-social-profile_&]:grid-cols-2 @max-[52rem]:[.pet-social-profile_&]:max-w-200 @max-[52rem]:[.pet-social-profile_&]:w-full @max-[52rem]:[.pet-social-profile_&]:mx-auto @max-[38rem]:[.pet-social-profile_&]:grid-cols-1'
            }
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
