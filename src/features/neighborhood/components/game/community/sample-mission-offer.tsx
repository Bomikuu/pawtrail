import { useEffect, useState, type FormEvent } from 'react'
import { Check, HandHelping } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import {
  offerSampleMission,
  useSampleProgress,
} from '@/features/neighborhood/game/discovery/sample-progress'
import type { SampleMission } from '@/features/neighborhood/game/discovery/sample-missions'
export function SampleMissionOffer({ mission }: { mission: SampleMission }) {
  const progress = useSampleProgress(),
    offer = progress.offers[mission.id]
  const [editing, setEditing] = useState(false),
    [description, setDescription] = useState(offer?.description ?? ''),
    [error, setError] = useState('')
  useEffect(() => {
    if (!editing) setDescription(offer?.description ?? '')
  }, [offer?.description, editing])
  function submit(event: FormEvent) {
    event.preventDefault()
    try {
      offerSampleMission(mission.id, description)
      setEditing(false)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <section
      className="space-y-3 rounded-md border p-3"
      aria-label="Sample mission participation"
    >
      {offer && !editing && (
        <div role="status" className="space-y-1">
          <p className="flex items-center gap-1.5 text-sm font-bold text-foreground">
            <Check className="size-4 text-green-700" />
            You offered help · sample
          </p>
          <p className="whitespace-pre-wrap text-xs leading-relaxed text-muted-foreground">
            {offer.description}
          </p>
        </div>
      )}
      {editing ? (
        <form onSubmit={submit} className="space-y-3">
          <label className="block space-y-2 text-sm font-semibold text-foreground">
            How could you help?
            <Textarea
              autoFocus
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
              minLength={10}
              maxLength={1000}
              className="min-h-24 rounded-md font-normal"
              placeholder="Describe a sample role and when you would be available."
            />
          </label>
          {error && (
            <p role="alert" className="text-sm text-destructive">
              {error}
            </p>
          )}
          <div className="flex gap-2">
            <Button type="submit" className="rounded-md">
              Save sample offer
            </Button>
            <Button
              type="button"
              variant="outline"
              className="rounded-md text-foreground"
              onClick={() => setEditing(false)}
            >
              Cancel
            </Button>
          </div>
        </form>
      ) : (
        <Button
          type="button"
          className="rounded-md"
          onClick={() => setEditing(true)}
        >
          <HandHelping className="size-4" />
          {offer ? 'Update sample offer' : 'Offer help · sample'}
        </Button>
      )}
      <p className="text-[11px] leading-relaxed text-muted-foreground">
        Saved only in this browser session and shared with the sample mission
        page. Nothing is sent to a real organizer and no Kibble is awarded.
      </p>
    </section>
  )
}
