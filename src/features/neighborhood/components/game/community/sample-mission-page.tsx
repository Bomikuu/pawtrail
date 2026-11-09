import { useEffect } from 'react'
import {
  ArrowLeft,
  Check,
  ClipboardList,
  HandHelping,
  Home,
  PawPrint,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card } from '@/components/ui/card'
import {
  getSampleAnimal,
  getSampleMission,
} from '@/features/neighborhood/game/discovery/sample-missions'
import { AnimalFace } from './markers'
import {
  AnimalCharacteristics,
  IconBadge,
  SampleBadge,
} from './discovery-badges'
import { SampleMissionOffer } from './sample-mission-offer'
export function SampleMissionPage({ id }: { id: string }) {
  useEffect(() => {
    document.body.dataset.pawtrailGame = 'true'
    return () => {
      delete document.body.dataset.pawtrailGame
    }
  }, [])
  const mission = getSampleMission(id),
    base = window.location.pathname === '/' ? '/' : '/play',
    back = base + '?map=community'
  const animals =
    mission?.animalIds.map(getSampleAnimal).filter((a) => !!a) ?? []
  return (
    <div className="pawtrail-game h-dvh overflow-y-auto bg-background text-foreground">
      <header className="flex items-center justify-between gap-3 border-b bg-card px-4 py-3">
        <a
          href="/community"
          className="flex items-center gap-2 font-heading text-lg font-extrabold text-foreground"
        >
          <img
            src="/pawtrail-game/discovery/pawtrail-brand-mark.webp"
            alt=""
            className="h-7 w-12 object-contain"
          />
          PawTrail
        </a>
        <div className="flex gap-2">
          <Button
            asChild
            variant="outline"
            size="sm"
            className="rounded-md text-foreground"
          >
            <a href={back}>
              <ArrowLeft className="size-4" />
              Community map
            </a>
          </Button>
          <Button
            asChild
            variant="ghost"
            size="icon"
            className="rounded-md text-foreground"
          >
            <a href={base + '?home=me'} aria-label="My home">
              <Home className="size-4" />
            </a>
          </Button>
        </div>
      </header>
      <main className="mx-auto max-w-4xl space-y-6 px-4 py-7 sm:px-6">
        {!mission ? (
          <Card className="p-6">
            <h1 className="text-xl font-extrabold text-foreground">
              Sample mission not found
            </h1>
            <p className="text-sm text-muted-foreground">
              Choose a linked mission from an animal’s help dialog.
            </p>
            <Button
              asChild
              variant="outline"
              className="rounded-md text-foreground"
            >
              <a href={back}>Return to the map</a>
            </Button>
          </Card>
        ) : (
          <>
            <div className="space-y-3">
              <div className="flex flex-wrap gap-2">
                <SampleBadge />
                <IconBadge icon={ClipboardList} label={mission.category} />
                <IconBadge icon={Check} label="Open for sample offers" />
              </div>
              <h1 className="text-2xl font-extrabold text-foreground sm:text-3xl">
                {mission.title}
              </h1>
              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                {mission.description}
              </p>
            </div>
            <div className="grid gap-6 md:grid-cols-[minmax(0,1fr)_19rem]">
              <div className="space-y-6">
                <section className="space-y-3 rounded-lg border bg-card p-4">
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    <PawPrint className="size-4" />
                    Animals in this mission
                  </h2>
                  <div className="space-y-4">
                    {animals.map((animal) => (
                      <div
                        key={animal.id}
                        className="space-y-3 border-t pt-3 first:border-t-0 first:pt-0"
                      >
                        <div className="flex items-center gap-3">
                          <AnimalFace animal={animal} className="size-14" />
                          <div>
                            <h3 className="font-bold text-foreground">
                              {animal.name}
                            </h3>
                            <p className="text-xs text-muted-foreground">
                              {animal.species} · sample animal
                            </p>
                          </div>
                        </div>
                        <AnimalCharacteristics animal={animal} />
                      </div>
                    ))}
                  </div>
                </section>
                <section className="space-y-3 rounded-lg border bg-card p-4">
                  <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
                    <ClipboardList className="size-4" />
                    What help is needed?
                  </h2>
                  <ul className="space-y-2">
                    {mission.requirements.map((requirement, i) => (
                      <li
                        key={i}
                        className="flex items-start gap-2 text-sm leading-relaxed"
                      >
                        <Check className="mt-0.5 size-4 shrink-0 text-primary" />
                        {requirement}
                      </li>
                    ))}
                  </ul>
                </section>
              </div>
              <aside className="space-y-3">
                <h2 className="flex items-center gap-2 text-base font-extrabold text-foreground">
                  <HandHelping className="size-4" />
                  Offer help
                </h2>
                <SampleMissionOffer mission={mission} />
                <p className="text-xs leading-relaxed text-muted-foreground">
                  This is a functional sample page for practicing the offer
                  flow. It does not schedule a real appointment, visit or
                  search.
                </p>
              </aside>
            </div>
          </>
        )}
      </main>
    </div>
  )
}
