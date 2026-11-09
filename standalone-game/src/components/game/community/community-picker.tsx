import { communityColor } from '@/game/discovery/communities'
import { Map as MapIcon, RotateCw } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import type {
  CommunityArea,
  CommunityAreas,
} from '@/game/discovery/communities'
export function CommunityPicker({
  areas,
  selected,
  enabled,
  loading,
  error,
  onEnabled,
  onChoose,
  onRetry,
}: {
  areas: CommunityAreas
  selected: CommunityArea | null
  enabled: boolean
  loading: boolean
  error: boolean
  onEnabled: (value: boolean) => void
  onChoose: (id: string) => void
  onRetry: () => void
}) {
  const choices =
    selected && !areas.features.some((area) => area.id === selected.id)
      ? [selected, ...areas.features]
      : areas.features
  const nameCounts = new Map<string, number>()
  for (const area of choices) nameCounts.set(area.properties.name, (nameCounts.get(area.properties.name) ?? 0) + 1)
  return (
    <section aria-label="City communities" className="space-y-2 border-b pb-3">
      <div className="flex items-center justify-between gap-2">
        <label
          htmlFor="community-borders"
          className="flex items-center gap-2 text-xs font-semibold text-foreground"
        >
          <MapIcon aria-hidden="true" className="size-3.5" />
          City communities
        </label>
        <Switch
          id="community-borders"
          checked={enabled}
          onCheckedChange={onEnabled}
          aria-label="Show community borders"
        />
      </div>
      {enabled && (
        <>
          <Select
            value={selected?.id ?? ''}
            onValueChange={onChoose}
            disabled={!choices.length}
          >
            <SelectTrigger
              id="community-area-picker"
              className="h-9 w-full text-xs text-foreground"
              aria-label="Choose a city community"
            >
              <SelectValue
                placeholder={
                  loading
                    ? 'Loading communities…'
                    : 'Choose a city community'
                }
              />
            </SelectTrigger>
            <SelectContent className="pawtrail-game max-h-72 text-foreground">
              {choices.map((area) => (
                <SelectItem key={area.id} value={area.id}>
                  <span className="flex items-center gap-2"><span aria-hidden="true" className="size-2.5 shrink-0 rounded-full" style={{ backgroundColor: communityColor(area) }} />{area.properties.name}{(nameCounts.get(area.properties.name) ?? 0) > 1 && area.properties.province ? ` · ${area.properties.province}` : ''}</span>
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          {error ? (
            <div className="flex items-center gap-2">
              <p className="flex-1 text-xs text-muted-foreground">
                Community borders could not refresh.
              </p>
              <Button
                size="sm"
                variant="outline"
                className="h-8 rounded-md text-xs text-foreground"
                onClick={onRetry}
              >
                <RotateCw aria-hidden="true" className="size-3" />
                Retry
              </Button>
            </div>
          ) : (
            <p className="text-[11px] leading-relaxed text-muted-foreground">
              {areas.truncated
                ? 'Zoom in to see more communities.'
                : choices.length
                  ? 'Hover or tap a colored city to view its entrance. Each city stays whole, without smaller zones.'
                  : loading
                    ? 'Loading community borders…'
                    : 'No communities are published in this map area.'}
            </p>
          )}
        </>
      )}
    </section>
  )
}
