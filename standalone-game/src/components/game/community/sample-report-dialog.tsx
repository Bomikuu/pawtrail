import { useState, type FormEvent } from 'react'
import { Camera, Check, Flag } from 'lucide-react'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Button } from '@/components/ui/button'
import { Textarea } from '@/components/ui/textarea'
import { reportSampleAnimal } from '@/game/discovery/sample-progress'
import type { MapEntity } from '@/game/discovery/types'
import type { AnimalReportKind } from './discovery-badges'
import { SampleBadge } from './discovery-badges'
export function SampleReportDialog({
  entity,
  kind,
  onClose,
}: {
  entity: MapEntity
  kind: AnimalReportKind
  onClose: () => void
}) {
  const [description, setDescription] = useState(''),
    [saved, setSaved] = useState(false),
    [error, setError] = useState('')
  const animal = entity.animal ?? entity.membership?.animals[0]
  const Icon = kind === 'sighting' ? Camera : Flag
  function submit(event: FormEvent) {
    event.preventDefault()
    try {
      reportSampleAnimal(
        animal?.id ?? entity.id,
        animal?.name ?? entity.name,
        kind,
        description,
      )
      setSaved(true)
      setError('')
    } catch (e) {
      setError((e as Error).message)
    }
  }
  return (
    <Dialog
      open
      onOpenChange={(open) => {
        if (!open) onClose()
      }}
    >
      <DialogContent className="pawtrail-game rounded-lg text-foreground">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-foreground">
            <Icon className="size-5" />
            Sample {kind === 'sighting' ? 'sighting' : 'concern'} for{' '}
            {animal?.name ?? entity.name}
          </DialogTitle>
          <DialogDescription>
            This practice report stays in this browser session. It is not sent
            to camera identification, reviewers or animal owners.
          </DialogDescription>
        </DialogHeader>
        <SampleBadge />
        {saved ? (
          <div className="space-y-3">
            <p
              role="status"
              className="flex items-center gap-2 rounded-md border border-green-700/25 p-3 text-sm"
            >
              <Check className="size-4 text-green-800" />
              Sample report saved for this session.
            </p>
            <Button className="rounded-md" onClick={onClose}>
              Done
            </Button>
          </div>
        ) : (
          <form onSubmit={submit} className="space-y-4">
            <label className="block space-y-2 text-sm font-semibold">
              {kind === 'sighting'
                ? 'What did you see?'
                : 'What is your concern?'}
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                required
                minLength={10}
                maxLength={2000}
                className="min-h-28 rounded-md font-normal"
                placeholder="Describe the observation and any uncertainty."
              />
            </label>
            {error && (
              <p role="alert" className="text-sm text-destructive">
                {error}
              </p>
            )}
            <div className="flex justify-end gap-2">
              <Button
                type="button"
                variant="outline"
                className="rounded-md text-foreground"
                onClick={onClose}
              >
                Cancel
              </Button>
              <Button type="submit" className="rounded-md">
                Save sample report
              </Button>
            </div>
          </form>
        )}
      </DialogContent>
    </Dialog>
  )
}
