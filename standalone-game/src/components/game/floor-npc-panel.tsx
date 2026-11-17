import { useEffect, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LivingPortrait } from './shared/living-portrait'
import { IllustrationPreview } from './shared/illustration-preview'
import { floorNpcs, type FloorNpcId } from '@/game/floors/npcs'
import type { PhotoPortraitPose } from '@/game/actor-rig/photo-portrait-catalog'
import type { PortraitExpression } from '@/game/actor-rig/portrait-state'

export function FloorNpcPanel({npc,onClose}:{npc:FloorNpcId|null;onClose:()=>void}){
  const [pose,setPose]=useState<PhotoPortraitPose>('three-quarter-left'),[expression,setExpression]=useState<PortraitExpression>('idle'),[talking,setTalking]=useState(false)
  useEffect(()=>{setTalking(false);setExpression('idle')},[npc])
  const data=npc?floorNpcs[npc]:null
  return <Dialog open={!!data} onOpenChange={open=>{if(!open)onClose()}}><DialogContent className="pawtrail-game max-h-[90dvh] overflow-y-auto sm:max-w-3xl"><DialogHeader><DialogTitle>{data?.name}</DialogTitle><DialogDescription>{data?.role} · character presentation rehearsal</DialogDescription></DialogHeader>{data&&<div className="grid gap-6 sm:grid-cols-[192px_1fr]"><IllustrationPreview illustration={data.illustration}/><div className="space-y-4"><LivingPortrait name={data.name} collection={data.portrait} pose={pose} expression={expression} talking={talking} controls={false} className="h-48"/><div className="flex flex-wrap gap-2"><Select value={pose} onValueChange={value=>setPose(value as PhotoPortraitPose)}><SelectTrigger className="w-40" aria-label="Portrait angle"><SelectValue/></SelectTrigger><SelectContent><SelectItem value="front-pout">Front</SelectItem><SelectItem value="three-quarter-left">Three-quarter</SelectItem><SelectItem value="head-tilt-smile-right">Head tilt</SelectItem></SelectContent></Select><Select value={expression} onValueChange={value=>setExpression(value as PortraitExpression)}><SelectTrigger className="w-32" aria-label="Expression"><SelectValue/></SelectTrigger><SelectContent>{['idle','smile','happy','sad','angry','surprised'].map(value=><SelectItem key={value} value={value}>{value}</SelectItem>)}</SelectContent></Select><Button variant="outline" aria-pressed={talking} onClick={()=>setTalking(value=>!value)}>{talking?'Stop talking':'Animate speech'}</Button></div><p className="text-sm leading-relaxed">{data.line}</p><p className="text-xs text-muted-foreground">Art and interaction rehearsal. Open the connected Neon Heights adventure for saved story choices, reputation and purchases.</p></div></div>}</DialogContent></Dialog>
}
