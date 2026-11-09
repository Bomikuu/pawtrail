import { useEffect, useState } from 'react'
import {
  ArrowLeft,
  ArrowUpRight,
  Droplets,
  Heart,
  MapPin,
  PawPrint,
  Play,
  Settings2,
  Utensils,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Badge } from '@/components/ui/badge'
import { Progress } from '@/components/ui/progress'
import { action, patch, scene, selectPet, live } from '@/game/housing/client'
import { catalogue } from '@/game/housing/geometry'
import type { HomesState } from '@/game/housing/types'
function HomeAchievements({ username }: { username: string }) {
  const [badges, setBadges] = useState<{ id: string; label: string }[]>([]),
    [status, setStatus] = useState('loading')
  useEffect(() => {
    const controller = new AbortController()
    setStatus('loading')
    fetch('/api/v1/users/' + encodeURIComponent(username) + '/preview', {
      credentials: 'same-origin',
      cache: 'no-store',
      signal: controller.signal,
    })
      .then(async (response) => {
        if (!response.ok) throw new Error()
        const data = await response.json()
        setBadges(Array.isArray(data.badges) ? data.badges.slice(0, 6) : [])
        setStatus('ready')
      })
      .catch(() => {
        if (!controller.signal.aborted) setStatus('error')
      })
    return () => controller.abort()
  }, [username])
  return (
    <section className="mt-5 border-t pt-4">
      <h3 className="mb-2 text-sm font-bold">PawTrail achievements</h3>
      {status === 'loading' ? (
        <div
          className="h-7 rounded bg-muted motion-safe:animate-pulse"
          role="status"
          aria-label="Loading profile achievements"
        />
      ) : status === 'error' ? (
        <p className="text-xs text-muted-foreground">
          Profile achievements couldn’t load.
        </p>
      ) : badges.length ? (
        <div className="flex flex-wrap gap-1.5">
          {badges.map((b) => (
            <Badge key={b.id} variant="outline" className="text-[10px]">
              {b.label}
            </Badge>
          ))}
        </div>
      ) : (
        <p className="text-xs text-muted-foreground">
          No public profile badges to display yet.
        </p>
      )}
    </section>
  )
}
export function PetsPanel({ state }: { state: HomesState }) {
  const data = state.data!,
    pet = state.pets.find((p) => p.id === state.selectedPet),
    [settings, setSettings] = useState(false),
    [food, setFood] = useState(''),
    [toy, setToy] = useState('')
  const portrait = (sprite: string) => (
    <div
      className="size-12 shrink-0 rounded-lg bg-muted [image-rendering:pixelated]"
      style={{
        backgroundImage: `url(${catalogue.cats[sprite]?.file})`,
        backgroundSize: '384px 576px',
        backgroundPosition: '0 0',
        backgroundRepeat: 'no-repeat',
      }}
    />
  )
  if (!pet)
    return (
      <section className="p-4">
        <div className="mb-5">
          <h2 className="font-heading text-xl font-extrabold">
            {data.house.name}
          </h2>
          <p className="mt-1 text-xs text-muted-foreground">
            {state.pets.length} furry{' '}
            {state.pets.length === 1 ? 'resident' : 'residents'} · Virtual care
          </p>
        </div>
        <h3 className="mb-2 text-xs font-bold text-muted-foreground">
          RESIDENT PETS
        </h3>
        {state.pets.map((p) => (
          <Button
            key={p.id}
            variant="ghost"
            className="mb-2 h-auto w-full justify-start gap-3 whitespace-normal rounded-xl border p-2.5 text-left"
            onClick={() => selectPet(p.id)}
          >
            {portrait(p.sprite)}
            <div className="min-w-0">
              <p className="font-bold">{p.profile.name}</p>
              <p className="mt-0.5 truncate text-[11px] text-muted-foreground">
                {p.profile.appearance || p.profile.species}
              </p>
              <p className="mt-1 flex items-center gap-1.5 text-[11px] capitalize">
                <span
                  className={
                    'size-1.5 rounded-full ' +
                    (p.state === 'sleep'
                      ? 'bg-muted-foreground'
                      : 'bg-emerald-600')
                  }
                />
                {p.activity || p.state}
              </p>
            </div>
          </Button>
        ))}
        {!state.pets.length && (
          <div className="py-7 text-center">
            <PawPrint className="mx-auto mb-3 size-8 text-primary" />
            <h3 className="text-sm font-bold">Room for a furry friend</h3>
            <p className="mt-2 text-xs leading-relaxed text-muted-foreground">
              Owned, published cat profiles are linked automatically. Community
              and shelter animals stay in their care circles.
            </p>
            <Button asChild size="sm" variant="link" className="mt-2">
              <a href="/animals/report">
                Manage animal profiles
                <ArrowUpRight className="size-3.5" />
              </a>
            </Button>
          </div>
        )}
        {(data.house.id.startsWith('system:map-demo:') || data.house.owner.id.startsWith('demo:map-guest:'))
          ? <p className="mt-5 border-t pt-4 text-xs leading-relaxed text-muted-foreground">Fictional demo host and animals. Explore the room and try virtual care; there are no public profile achievements for this sample host.</p>
          : <HomeAchievements username={data.house.owner.username} />}
        <div className="mt-6 border-t pt-4">
          <p className="text-xs leading-relaxed text-muted-foreground">
            Game memories and friendship are virtual. They never create verified
            real-world care records.
          </p>
        </div>
      </section>
    )
  const isOwner =
    pet.id.startsWith(data.player.sample ? 'demo:' : 'real:') &&
    data.player.id === data.house.owner.id
  const disabled =
    state.status !== 'online' ||
    pet.state === 'sleep' ||
    (!data.house.permissions.pets && data.house.id !== data.player.id)
  return (
    <section className="space-y-4 p-4">
      <Button
        variant="ghost"
        size="sm"
        className="-ml-2"
        onClick={() => {
          patch({ selectedPet: null })
          setSettings(false)
        }}
      >
        <ArrowLeft className="size-4" />
        Residents
      </Button>
      <div className="flex items-center gap-3">
        {portrait(pet.sprite)}
        <div>
          <h2 className="font-heading text-xl font-extrabold">
            {pet.profile.name}
          </h2>
          <p className="text-xs capitalize text-muted-foreground">
            {pet.profile.species} · {pet.profile.gender}
          </p>
        </div>
      </div>
      {pet.profile.sample && <Badge variant="secondary">Sample profile</Badge>}
      <p className="text-sm leading-relaxed">
        {pet.profile.description ||
          'This pet’s introduction has not been published yet.'}
      </p>
      <div className="flex flex-wrap gap-1">
        {pet.profile.personality.map((t) => (
          <Badge key={t} variant="outline" className="text-[10px]">
            {t}
          </Badge>
        ))}
      </div>
      <div className="space-y-2 rounded-xl bg-muted/60 p-3 text-xs">
        <p className="flex justify-between gap-3">
          <span className="text-muted-foreground">Owner</span>
          <strong>{data.house.owner.name}</strong>
        </p>
        <p className="flex justify-between gap-3 capitalize">
          <span className="text-muted-foreground">Activity</span>
          <strong>{pet.activity || pet.state}</strong>
        </p>
        <p className="flex justify-between gap-3">
          <span className="text-muted-foreground">Favorite food</span>
          <strong>{pet.favoriteFood || 'Not set'}</strong>
        </p>
        <p className="flex justify-between gap-3">
          <span className="text-muted-foreground">Favorite toy</span>
          <strong>{pet.favoriteToy || 'Not set'}</strong>
        </p>
      </div>
      <div>
        <p className="mb-2 flex justify-between text-xs font-bold">
          <span>Friendship · Level {Math.floor(pet.friendship / 50) + 1}</span>
          <span>{pet.friendship % 50}/50</span>
        </p>
        <Progress value={(pet.friendship % 50) * 2} className="h-1.5" />
      </div>
      {pet.state === 'sleep' && (
        <p className="text-xs text-muted-foreground">
          Let this sleepy neighbor rest. Actions return when they wake.
        </p>
      )}
      <div className="grid grid-cols-2 gap-2">
        {[
          ['pet', 'Pet', Heart],
          ['feed', 'Feed', Utensils],
          ['play', 'Play', Play],
          ['water', 'Water', Droplets],
          ['help', 'Refill & help', PawPrint],
        ].map(([id, label, Icon]) => {
          const C = Icon as typeof Heart,
            kind = id as string
          const last = Math.max(
              pet.lastCare[kind + ':' + data.player.id] || 0,
              pet.lastCare['need:' + kind] || 0,
            ),
            cooldown = ['feed', 'water', 'help'].includes(kind) ? 3600 : 45,
            ready = Date.now() / 1000 - last >= cooldown
          return (
            <Button
              key={kind}
              variant="outline"
              size="sm"
              disabled={
                disabled ||
                !ready ||
                (kind === 'help' &&
                  !data.house.permissions.help &&
                  data.house.id !== data.player.id)
              }
              onClick={() => scene({ type: 'care', pet: pet.id, action: kind })}
              title={
                ready
                  ? 'Walk closer to offer virtual care'
                  : 'This need was already met. Let the pet rest.'
              }
            >
              <C className="size-3.5" />
              {label as string}
            </Button>
          )
        })}
      </div>
      <Button
        variant="ghost"
        className="w-full"
        size="sm"
        onClick={() => {
          scene({ type: 'focus-pet', id: pet.id })
          live({ type: 'pet.interact', pet: pet.id, action: 'show' })
        }}
      >
        <MapPin className="size-3.5" />
        Show this pet to visitors
      </Button>
      {pet.profile.demo ? <p className="rounded-lg bg-muted p-3 text-xs leading-relaxed text-muted-foreground">This is a fictional demo animal. Its care and memories stay in this game room; it has no real adoption or public profile.</p> : <Button asChild size="sm" variant="outline" className="w-full">
        <a href={'/pets/' + encodeURIComponent(pet.profile.slug)}>
          Full PawTrail profile
          <ArrowUpRight className="size-3.5" />
        </a>
      </Button>}
      {isOwner && (
        <Button
          size="sm"
          variant="ghost"
          onClick={() => {
            setSettings(!settings)
            setFood(pet.favoriteFood)
            setToy(pet.favoriteToy)
          }}
        >
          <Settings2 className="size-3.5" />
          Virtual preferences
        </Button>
      )}
      {settings && isOwner && (
        <div className="space-y-2 border-t pt-3">
          <label className="block text-xs font-bold">
            Favorite food
            <Input
              value={food}
              onChange={(e) => setFood(e.target.value)}
              maxLength={80}
            />
          </label>
          <label className="block text-xs font-bold">
            Favorite toy
            <Input
              value={toy}
              onChange={(e) => setToy(e.target.value)}
              maxLength={80}
            />
          </label>
          <div className="flex flex-wrap gap-1">
            {Object.keys(catalogue.cats).map((sprite) => (
              <Button
                key={sprite}
                size="sm"
                variant={sprite === pet.sprite ? 'default' : 'outline'}
                className="text-[10px]"
                onClick={() =>
                  action({
                    type: 'pet-settings',
                    target: pet.id,
                    sprite,
                    food,
                    toy,
                  })
                }
              >
                {sprite.replaceAll('-', ' ')}
              </Button>
            ))}
          </div>
          <Button
            size="sm"
            onClick={() => {
              action({
                type: 'pet-settings',
                target: pet.id,
                sprite: pet.sprite,
                food,
                toy,
              })
              setSettings(false)
            }}
          >
            Save preferences
          </Button>
        </div>
      )}
      <div className="border-t pt-4">
        <h3 className="mb-2 text-sm font-bold">Little memories</h3>
        {pet.memories.length ? (
          pet.memories.map((m, i) => (
            <p
              key={i}
              className="mb-3 text-xs leading-relaxed text-muted-foreground"
            >
              {m.text}
              <time className="mt-1 block text-[10px]">
                {new Date(m.at * 1000).toLocaleDateString()}
              </time>
            </p>
          ))
        ) : (
          <p className="text-xs text-muted-foreground">
            Your first kind moment will find a home here.
          </p>
        )}
      </div>
    </section>
  )
}
