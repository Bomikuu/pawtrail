import { useId } from 'react'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { PHOTO_PORTRAIT_STYLES, photoPortraitPoses, type PhotoPortraitPose } from '@/game/actor-rig/photo-portrait-catalog'

function angles(collection?: string) {
  const style = PHOTO_PORTRAIT_STYLES.find(entry => entry.id === collection)
  return style ? photoPortraitPoses(style) : []
}

/** Only authored angles are selectable; older packs can retain their existing side view. */
export function resolvePortraitAngle(collection: string | undefined, preferred: PhotoPortraitPose): PhotoPortraitPose {
  const available = angles(collection)
  return available.find(pose => pose.id === preferred)?.id
    ?? available.find(pose => pose.id === 'three-quarter-left')?.id
    ?? available[0]?.id ?? preferred
}

export function PortraitAngleSelect({ collection, value, onChange }: {
  collection?: string
  value: PhotoPortraitPose
  onChange: (pose: PhotoPortraitPose) => void
}) {
  const id = useId()
  const available = angles(collection)
  if (available.length < 2) return null
  return <div className="min-w-0 space-y-1">
    <label htmlFor={id} className="text-xs font-medium">Portrait angle</label>
    <Select value={resolvePortraitAngle(collection, value)} onValueChange={pose => onChange(pose as PhotoPortraitPose)}>
      <SelectTrigger id={id} className="h-8 w-full min-w-0 rounded-md border-[#c59a69] bg-[#fff5e3] text-xs text-[#593a22]"><SelectValue /></SelectTrigger>
      <SelectContent>{available.map(pose => <SelectItem key={pose.id} value={pose.id}>{pose.label}</SelectItem>)}</SelectContent>
    </Select>
  </div>
}
