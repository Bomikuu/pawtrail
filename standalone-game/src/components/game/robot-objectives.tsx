import { Crosshair, Shield, ShieldOff, Check, Zap } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Progress } from '@/components/ui/progress'
import type { HydraSceneReport } from '@/game/monsters/hydra-scene'

export function RobotObjectives({ report, bodyId, target }: { report: HydraSceneReport; bodyId: string; target: (id:string)=>void }) {
  if(!report.components)return null
  const remaining=report.components.filter(f=>f.hp>0).length
  return <section aria-label="Funnel objectives" className="space-y-3">
    <h2 className="flex items-center gap-2 font-heading text-xl font-bold">{report.shielded?<Shield className="size-5"/>:<ShieldOff className="size-5"/>}{report.shielded?'Break the funnel shield':'Main body vulnerable'}</h2>
    <p className="text-xs text-muted-foreground">{remaining} / 4 funnels online. {report.shielded?'Body damage is blocked until all four are destroyed.':'All funnels destroyed. Strike the main body; recovery hits deal ×1.5.'}</p>
    <div className="grid grid-cols-2 gap-2">{report.components.map(f=><Button key={f.id} variant="outline" aria-label={'Target '+f.name} aria-pressed={report.targetId===f.id} disabled={f.hp<=0||report.hp<=0} className={'h-auto min-w-0 flex-col items-stretch gap-1.5 px-2 py-2 text-left '+(report.targetId===f.id?'border-cyan-700 bg-cyan-50 text-foreground dark:bg-cyan-950/40':'')} onClick={()=>target(f.id)}>
      <span className="flex items-center justify-between gap-1 text-xs">{f.hp>0?<Zap className="size-3.5"/>:<Check className="size-3.5"/>}<strong>{f.name}</strong>{report.targetId===f.id&&<Crosshair className="size-3.5"/>}</span>
      <span className="text-[11px] tabular-nums">{f.hp>0?`${f.hp} / ${f.maxHp} HP`:'Destroyed'}</span><Progress value={f.hp/f.maxHp*100} aria-label={f.name+' health'} className="h-1 rounded-sm [&_[data-slot=progress-indicator]]:bg-cyan-600"/>
    </Button>)}</div>
    <Button variant="outline" size="sm" className="w-full" aria-pressed={report.targetId===bodyId} onClick={()=>target(bodyId)} disabled={report.hp<=0}><Crosshair/>Target main body{report.shielded?' · shielded':''}</Button>
    <p className="text-xs leading-relaxed text-muted-foreground">Targeting aims the next attack. Walk into reach and press J to strike; K uses the sword ultimate. Tab cycles live targets. Selecting a target deals no damage.</p>
  </section>
}
