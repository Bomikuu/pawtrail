import type { ReactNode } from 'react'
import {
  Heart,
  HeartHandshake,
  PawPrint,
  TriangleAlert,
  UserRound,
} from 'lucide-react'
import { Badge } from '@/components/ui/badge'
import type { PlatformAnimalDetail } from '@/game/platform'
import type { MapEntity } from '@/game/discovery/types'
import {
  animalCareLabel,
  animalFactLabel,
  formatAnimalAge,
} from '@/game/discovery/animal-labels'
import { AnimalFace } from './markers'
import { DetailDrawer } from './detail-drawer'

export function AnimalDetailDrawer({
  entity,
  detail,
  open,
  onClose,
  children,
}: {
  entity: MapEntity
  detail?: PlatformAnimalDetail | null
  open: boolean
  onClose: () => void
  children: ReactNode
}) {
  const animal = entity.animal
  const age = formatAnimalAge(detail?.ageMonths ?? animal?.ageMonths)
  const gender = animalFactLabel(detail?.gender ?? animal?.gender)
  const status = detail?.status ?? animal?.status
  const summary = [animalFactLabel(animal?.species), age, gender]
    .filter(Boolean)
    .join(' · ')
  const StatusIcon =
    status === 'sheltered'
      ? HeartHandshake
      : status === 'owned'
        ? UserRound
        : status === 'adopted'
          ? Heart
          : status === 'missing'
            ? TriangleAlert
            : PawPrint
  return (
    <DetailDrawer
      title={entity.name}
      summary={summary}
      description={entity.area + ' · approximate published location'}
      portrait={
        animal && (
          <AnimalFace
            animal={{
              ...animal,
              photo: entity.photo ?? animal.photo,
            }}
            className="size-20 shrink-0 border border-border [image-rendering:auto] sm:size-24"
          />
        )
      }
      status={
        status && (
          <Badge
            variant="outline"
            className={
              'max-w-full gap-1.5 whitespace-normal rounded-md px-2 py-1 text-xs font-medium ' +
              (status === 'missing'
                ? 'border-destructive/30 bg-destructive/5 text-destructive'
                : 'border-border bg-secondary/40 text-foreground')
            }
          >
            <StatusIcon aria-hidden="true" className="size-3.5 shrink-0" />
            {animalCareLabel(status)}
          </Badge>
        )
      }
      open={open}
      onClose={onClose}
    >
      {children}
    </DetailDrawer>
  )
}
