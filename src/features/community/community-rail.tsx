import {
  ArrowRight,
  ArrowUpRight,
  MapPin,
  PawPrint,
  SquarePen,
} from 'lucide-react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { AnimalImage } from '@/components/shared/animal-image'
import { DataState } from '@/components/shared/data-state'
import { ButtonLink } from '@/components/ui/button-link'
import { Card, CardContent } from '@/components/ui/card'
import { loginPath } from '@/features/auth/return-path'
import type { AnimalSummary } from '@/features/animals/types'

export function CommunityRail({
  animals,
  signedIn,
  sample,
}: {
  animals: AnimalSummary[]
  signedIn: boolean
  sample: boolean
}) {
  return (
    <>
      <Card className="community-welcome gap-0 overflow-hidden border-orange-200/70 bg-orange-50/70 py-0 shadow-none dark:border-orange-900/50 dark:bg-orange-950/20">
        <img
          src="/images/pawtrail/care-circle.webp"
          width={504}
          height={245}
          alt=""
          loading="lazy"
          className="aspect-[2.05] w-full object-cover"
        />
        <CardContent className="grid gap-3 p-5">
          <h2 className="text-2xl font-extrabold leading-tight text-balance">
            Every paw has a story.
          </h2>
          <p className="text-sm leading-relaxed text-muted-foreground">
            Share a moment. Find your people. Help a paw along the way.
          </p>
          <ButtonLink
            href={
              signedIn ? '/community/create' : loginPath('/community/create')
            }
            className="mt-1 h-10 w-full"
          >
            <SquarePen className="size-4" aria-hidden="true" /> Share a story
          </ButtonLink>
        </CardContent>
      </Card>

      <section
        className="grid gap-3"
        aria-labelledby="community-adoption-title"
      >
        <div className="flex items-center justify-between gap-2">
          <h2 id="community-adoption-title" className="text-lg font-extrabold">
            Looking for a home
          </h2>
          <Link
            href="/adopt"
            className="inline-flex min-h-10 items-center gap-1 text-xs font-medium hover:underline"
            aria-label="See all adoptable animals"
          >
            View all <ArrowRight className="size-3.5" aria-hidden="true" />
          </Link>
        </div>
        {animals.length ? (
          animals.slice(0, 4).map((animal) => (
            <Card
              key={animal.id}
              role="article"
              className="gap-0 overflow-hidden py-0 shadow-none transition-colors duration-150 hover:border-primary/50 hover:bg-accent/40 focus-within:border-ring"
            >
              <Link
                href={'/pets/' + encodeURIComponent(animal.slug)}
                className="group/pet flex min-w-0 items-center gap-3 rounded-xl p-3 text-foreground no-underline outline-offset-2"
                aria-label={`Meet ${animal.name}, ${animal.species} in ${animal.location.neighborhood}`}
              >
                <span className="size-16 shrink-0 overflow-hidden rounded-full border bg-muted [&_>_*]:size-full [&_>_*]:rounded-full">
                  <AnimalImage
                    image={animal.photo}
                    compact
                    className="size-full rounded-full object-cover transition-transform duration-200 motion-safe:group-hover/pet:scale-105"
                  />
                </span>
                <span className="grid min-w-0 flex-1 gap-1">
                  <strong className="truncate text-sm font-bold group-hover/pet:text-[color:var(--teal)]">
                    {animal.name}
                  </strong>
                  <span className="text-xs text-muted-foreground capitalize">
                    {animal.species} · {animal.ageMonths} months
                  </span>
                  <span className="flex min-w-0 items-center gap-1 text-[0.6875rem] text-muted-foreground">
                    <MapPin className="size-3 shrink-0" aria-hidden="true" />
                    <span className="truncate">
                      {animal.location.neighborhood}
                    </span>
                  </span>
                </span>
                <ArrowUpRight
                  className="size-4 shrink-0 text-muted-foreground transition-transform duration-150 group-hover/pet:text-[color:var(--teal)] motion-safe:group-hover/pet:-translate-y-0.5 motion-safe:group-hover/pet:translate-x-0.5"
                  aria-hidden="true"
                />
              </Link>
            </Card>
          ))
        ) : (
          <DataState
            state="empty"
            emptyTitle="No adoption profiles yet"
            emptyDescription="Check back soon to meet animals looking for a home."
          />
        )}
        {sample && (
          <p className="text-[0.6875rem] text-muted-foreground">
            Illustrative community profiles
          </p>
        )}
      </section>

      <section className="grid gap-2 border-t pt-5">
        <PawPrint className="size-5 text-primary" aria-hidden="true" />
        <h2 className="text-lg font-extrabold">A small act. A happier paw.</h2>
        <p className="text-sm leading-relaxed text-muted-foreground">
          A meal, a short walk, a helping hand. There’s a way for you to get
          involved.
        </p>
        <Link
          href="/missions"
          className="inline-flex min-h-10 items-center gap-2 text-sm font-medium hover:underline"
        >
          Explore missions <ArrowRight className="size-4" aria-hidden="true" />
        </Link>
      </section>
      <footer className="flex flex-wrap gap-x-3 gap-y-2 border-t pt-4 text-[0.6875rem] text-muted-foreground [&_a]:text-inherit [&_a:hover]:underline">
        <Link href="/shelters">Shelters</Link>
        <Link href="/events">Events</Link>
        <Link href="/dashboard/settings">Privacy settings</Link>
        <span className="w-full">PawTrail · Every Paw Has a Story.</span>
      </footer>
    </>
  )
}
