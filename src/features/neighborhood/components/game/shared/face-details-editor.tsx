import { useEffect, useState } from 'react'
import { Eye } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Switch } from '@/components/ui/switch'
import type { FaceColors } from '@/features/neighborhood/game/actor-rig/face-details'

/** Identical eye/face editing and inspection controls for humans and cats. */
export function FaceDetailsEditor({ value, onChange, inspecting, onInspect, markingLabel = 'Facial hair / freckles', showNose = true }: {
  value: FaceColors; onChange: (value: FaceColors) => void; inspecting: boolean; onInspect: () => void; markingLabel?: string; showNose?: boolean
}) {
  const [matching, setMatching] = useState(value.leftEye === value.rightEye)
  useEffect(() => { if(value.leftEye!==value.rightEye)setMatching(false) }, [value.leftEye,value.rightEye])
  const color = (key: keyof FaceColors, next: string) => onChange({ ...value, [key]: next, ...(matching && (key === 'leftEye' || key === 'rightEye') ? { leftEye: next, rightEye: next } : {}) })
  return <div className="space-y-4">
    <label className="flex items-center justify-between gap-3 text-xs font-medium"><span>Match both eyes</span><Switch checked={matching} onCheckedChange={next => { setMatching(next); if(next)onChange({...value,rightEye:value.leftEye}) }} /></label>
    <div className="grid grid-cols-2 gap-3">{([['leftEye','Left eye'],['rightEye','Right eye'],['nose','Nose'],['marking',markingLabel]] as const).filter(([key])=>showNose||key!=='nose').map(([key,title]) => <label key={key} className="flex items-center gap-2 text-xs"><Input type="color" value={value[key]} aria-label={title+' color'} className="size-10 shrink-0 rounded-md p-1" onChange={event=>color(key,event.target.value)} /><span>{title}</span></label>)}</div>
    <div className="flex flex-wrap gap-2" role="group" aria-label="Eye colors">{[['Brown','#6b4b36'],['Amber','#d7a52c'],['Green','#6fa358'],['Blue','#69b6d4'],['Grey','#909b9b'],['Copper','#b97632']].map(([title,next]) => <Button key={title} size="sm" variant="outline" onClick={()=>color('leftEye',next)}>{title}</Button>)}</div>
    <Button variant="outline" className="w-full" aria-pressed={inspecting} onClick={onInspect}><Eye className="size-4" />{inspecting?'Show full body':'Inspect face'}</Button>
  </div>
}
