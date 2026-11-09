import type { ReactNode } from 'react'
import { Camera, MapPin, PawPrint, ArrowUpRight, Users } from 'lucide-react'
import { Card, CardContent } from '@/components/ui/card'
import { Badge } from '@/components/ui/badge'
import { ButtonLink } from '@/components/ui/button-link'
import { AnimalImage } from '@/components/shared/animal-image'
import {
  databaseAnimals,
  databaseActivity,
  databaseAnimal,
  type DatabaseAnimal,
} from './public'
function EmptyDatabase({
  title,
  children,
}: {
  title: string
  children: ReactNode
}) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-3 px-6 py-12 text-center">
        <PawPrint className="size-9 text-primary" />
        <h2 className="font-heading text-2xl font-semibold">{title}</h2>
        <p className="max-w-md text-sm leading-relaxed text-muted-foreground">
          {children}
        </p>
        <ButtonLink href="/spot">
          <Camera className="size-4" />
          Photograph an animal
        </ButtonLink>
      </CardContent>
    </Card>
  )
}
function AnimalCard({ animal }: { animal: DatabaseAnimal }) {
  return (
    <Card className="gap-0 overflow-hidden py-0">
      <AnimalImage
        image={animal.photo}
        species={animal.species}
        appearance={animal.appearance}
        className="aspect-[4/3] w-full object-contain"
      />
      <CardContent className="space-y-2 p-4">
        <h2 className="font-heading text-2xl font-semibold">{animal.name}</h2>
        <p className="text-sm capitalize">
          {animal.species} · {animal.appearance || 'Coat not recorded'}
        </p>
        <p className="flex items-center gap-1 text-xs text-muted-foreground">
          <MapPin className="size-3.5" />
          {animal.areaLabel || 'Area not recorded'}
        </p>
        <ButtonLink
          href={'/pets/' + encodeURIComponent(animal.slug)}
          variant="outline"
          size="sm"
        >
          View profile
          <ArrowUpRight className="size-3.5" />
        </ButtonLink>
      </CardContent>
    </Card>
  )
}
export async function DatabaseAnimalsPage() {
  const records = await databaseAnimals()
  return (
    <section className="mx-auto w-full max-w-6xl space-y-6 p-4 md:p-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="font-heading text-3xl font-semibold">
            Animals in our community
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Published animal records from PawTrail’s database.
          </p>
        </div>
        <ButtonLink href="/spot">
          <Camera className="size-4" />
          Record an encounter
        </ButtonLink>
      </div>
      {records.items.length ? (
        <div className="grid gap-5 sm:grid-cols-2 lg:grid-cols-3">
          {records.items.map((animal) => (
            <AnimalCard key={animal.id} animal={animal} />
          ))}
        </div>
      ) : (
        <EmptyDatabase title="Every story starts with an encounter">
          There are no published animal profiles yet. Photograph a cat or dog to
          start a real record; approved encounters will appear here.
        </EmptyDatabase>
      )}
    </section>
  )
}
export async function DatabaseCommunityPage() {
  const [activity, animals] = await Promise.all([
    databaseActivity(),
    databaseAnimals(),
  ])
  return (
    <section className="mx-auto grid w-full max-w-[1124px] gap-6 p-4 xl:grid-cols-[minmax(0,800px)_300px]">
      <section className="min-w-0 space-y-5">
        <header>
          <h1 className="font-heading text-3xl font-semibold">
            Every paw has a story.
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Real encounters and the neighbors behind them.
          </p>
        </header>
        {activity.items.length ? (
          activity.items.map((item) => (
            <Card key={item.id}>
              <CardContent className="space-y-3">
                <div className="flex items-center gap-3">
                  <span className="grid size-10 shrink-0 place-items-center rounded-full bg-secondary">
                    <Users className="size-5" />
                  </span>
                  <div>
                    <p className="text-sm font-semibold">
                      {item.author.displayName}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      Sighting of {item.animal.name}
                      {item.observedAt
                        ? ' · ' +
                          new Date(item.observedAt).toLocaleDateString('en-PH')
                        : ''}
                    </p>
                  </div>
                </div>
                {item.notes && (
                  <p className="whitespace-pre-wrap text-sm leading-relaxed">
                    {item.notes}
                  </p>
                )}
                <AnimalImage
                  image={item.photo}
                  species={item.animal.species}
                  appearance={item.animal.appearance}
                  className="max-h-[32rem] w-full rounded-md object-contain"
                />
                <ButtonLink
                  href={'/pets/' + encodeURIComponent(item.animal.slug)}
                  variant="outline"
                  size="sm"
                >
                  Meet {item.animal.name}
                  <ArrowUpRight className="size-3.5" />
                </ButtonLink>
              </CardContent>
            </Card>
          ))
        ) : (
          <EmptyDatabase title="A little care starts something">
            No published encounters yet. Your accepted sightings will help build
            this community feed.
          </EmptyDatabase>
        )}
      </section>
      <aside className="space-y-4">
        <h2 className="font-heading text-xl font-semibold">Animal neighbors</h2>
        {animals.items.length ? (
          animals.items
            .slice(0, 3)
            .map((animal) => <AnimalCard key={animal.id} animal={animal} />)
        ) : (
          <p className="rounded-md border bg-card p-4 text-sm text-muted-foreground">
            Published animal profiles will appear here.
          </p>
        )}
        <ButtonLink href="/play?map=community" variant="outline">
          Open community map
          <MapPin className="size-4" />
        </ButtonLink>
      </aside>
    </section>
  )
}
export async function DatabaseAnimalProfile({ slug }: { slug: string }) {
  const animal = await databaseAnimal(slug)
  return (
    <section className="mx-auto grid w-full max-w-[1124px] gap-6 p-4 xl:grid-cols-[minmax(0,800px)_300px]">
      <section className="space-y-5">
        <div className="overflow-hidden rounded-xl border bg-card">
          <img
            src="/images/profile-banners/collection-meadow-752.webp"
            alt=""
            className="h-32 w-full object-cover"
          />
          <div className="flex flex-wrap items-center gap-5 p-5">
            <AnimalImage
              image={animal.photo}
              species={animal.species}
              appearance={animal.appearance}
              compact
              className="size-28 rounded-full object-cover"
            />
            <div className="space-y-2">
              <h1 className="font-heading text-4xl font-semibold">
                {animal.name}
              </h1>
              <Badge variant="outline" className="rounded-md capitalize">
                {animal.species}
              </Badge>
              <p className="text-sm text-muted-foreground">
                {animal.areaLabel || 'Area not recorded'}
              </p>
            </div>
            <ButtonLink
              href={'/spot?animalId=' + encodeURIComponent(animal.id)}
            >
              <Camera className="size-4" />
              Create sighting
            </ButtonLink>
          </div>
        </div>
        <Card>
          <CardContent className="space-y-3">
            <h2 className="font-heading text-2xl font-semibold">
              About {animal.name}
            </h2>
            <p className="whitespace-pre-wrap text-sm leading-relaxed">
              {animal.description || 'No description recorded yet.'}
            </p>
            <dl className="grid grid-cols-[auto_1fr] gap-x-4 gap-y-2 text-sm">
              <dt className="text-muted-foreground">Coat / markings</dt>
              <dd>{animal.appearance || 'Not recorded'}</dd>
              <dt className="text-muted-foreground">Age / size</dt>
              <dd>Not recorded</dd>
            </dl>
          </CardContent>
        </Card>
        <h2 className="font-heading text-2xl font-semibold">
          Accepted sightings
        </h2>
        {animal.sightings?.length ? (
          animal.sightings.map((s) => (
            <Card key={s.id}>
              <CardContent className="space-y-3">
                <p className="text-xs text-muted-foreground">
                  {s.observedAt
                    ? new Date(s.observedAt).toLocaleString('en-PH')
                    : 'Time not recorded'}{' '}
                  · {s.areaLabel || 'Area not recorded'}
                </p>
                <p className="whitespace-pre-wrap text-sm">{s.notes}</p>
                <AnimalImage
                  image={s.photo}
                  species={animal.species}
                  appearance={animal.appearance}
                  className="max-h-[28rem] w-full rounded-md object-contain"
                />
              </CardContent>
            </Card>
          ))
        ) : (
          <p className="rounded-md border bg-card p-5 text-sm text-muted-foreground">
            No accepted public sightings yet.
          </p>
        )}
      </section>
      <aside className="space-y-4">
        <Card>
          <CardContent className="space-y-3">
            <h2 className="font-heading text-xl font-semibold">
              Community record
            </h2>
            <p className="text-sm">{animal.sightingCount} accepted sightings</p>
            <p className="text-sm">
              {animal.referenceCount} curated reference photos
            </p>
            <p className="text-xs leading-relaxed text-muted-foreground">
              Location is shown only after an accepted encounter. Illustrations
              are placeholders, never identification evidence.
            </p>
            <ButtonLink href="/play?map=community" variant="outline" size="sm">
              Community map
              <MapPin className="size-3.5" />
            </ButtonLink>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="space-y-2">
            <h2 className="font-heading text-xl font-semibold">
              Last reported area
            </h2>
            <p className="text-sm">
              {animal.location?.neighborhood ||
                'No accepted location evidence yet.'}
            </p>
          </CardContent>
        </Card>
      </aside>
    </section>
  )
}

export function DatabaseDomainState({ title }: { title: string }) {
  return (
    <section className="mx-auto max-w-3xl space-y-5 p-4 md:p-6">
      <h1 className="font-heading text-3xl font-semibold">{title}</h1>
      <Card>
        <CardContent className="space-y-4 py-6">
          <PawPrint className="size-8 text-primary" />
          <h2 className="font-heading text-2xl font-semibold">
            This service isn’t connected yet
          </h2>
          <p className="max-w-lg text-sm leading-relaxed text-muted-foreground">
            {title} does not have a live database service yet. Sample entries
            have been removed. Animal records, camera encounters, reviewed
            sightings and Kibble are available through the real backend.
          </p>
          <div className="flex flex-wrap gap-2">
            <ButtonLink href="/explore" variant="outline">
              Explore animals
            </ButtonLink>
            <ButtonLink href="/spot">
              <Camera className="size-4" />
              Record an encounter
            </ButtonLink>
          </div>
        </CardContent>
      </Card>
    </section>
  )
}
