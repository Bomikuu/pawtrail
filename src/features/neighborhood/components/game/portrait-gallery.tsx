import { useEffect, useState } from 'react'
import { ArrowLeft, MessageCircle, Sparkles } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select'
import { LivingPortrait } from './shared/living-portrait'
import { PORTRAIT_EXPRESSIONS, type PortraitExpression } from '@/features/neighborhood/game/actor-rig/portrait-state'
import sizes from '@/features/neighborhood/game/actor-rig/portrait-sizes.json'
import { defaultCatAppearance } from '@/features/neighborhood/game/cat-creator/appearance'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { PhotoPortraitStudio } from './photo-portrait-studio'

const names: Record<string,string> = {
  maya:'Maya',jo:'Jo',lina:'Lina','trail-rescuer':'Trail rescuer',
  'glasses-rescuer':'Glasses rescuer','blonde-rescuer':'Blonde rescuer','red-rescuer':'Redhead rescuer',
  'violet-rescuer':'Violet rescuer','male-blonde-scout':'Blonde scout','male-violet-volunteer':'Violet volunteer','male-red-gardener':'Copper gardener',
  'cat-orange':'Orange tabby','cat-black':'Black cat','cat-white':'White cat','cat-gray':'Gray cat','cat-cream':'Cream cat','cat-brown':'Brown cat',
}
const catIdentities: Record<string,string> = { 'cat-orange':'orange_tabby','cat-black':'black_cat','cat-white':'white_cat','cat-gray':'gray_cat','cat-cream':'siamese','cat-brown':'brown-cat' }
const coats:Record<string,string>={ 'cat-orange':'#e69a45','cat-black':'#343333','cat-white':'#f0e9df','cat-gray':'#96928d','cat-cream':'#d9bd8f','cat-brown':'#926143' }
const root='/pawtrail-game/game-assets/dialogue-portraits/'
function artwork(id:string) { return root+(id==='trail-rescuer'?'illustrated-v2/trail-rescuer.png':id.startsWith('cat-')?'layered-v1/'+id+'-base.png':id+'.png') }

export default function PortraitGallery() {
  return <main className="h-dvh overflow-y-auto bg-[#f7eedf] px-4 py-6 font-body text-[#45291e] sm:px-8 sm:py-10">
    <div className="mx-auto max-w-6xl">
      <Button variant="ghost" className="mb-5 rounded-md text-[#553421]" onClick={()=>window.location.assign('/play?explore=1')}><ArrowLeft className="size-4"/>Back to PawTrail</Button>
      <h1 className="font-heading text-4xl font-semibold sm:text-5xl">Living 2D portraits</h1>
      <p className="mt-3 max-w-2xl text-sm leading-relaxed text-[#805d3c]">Choose a pixel style, explore each angle and bring the illustration to life with emotions, blinking and conversation.</p>
      <Tabs defaultValue="collection" className="mt-6 gap-6"><TabsList className="rounded-md"><TabsTrigger value="collection" className="rounded-md">New pixel collection</TabsTrigger><TabsTrigger value="game" className="rounded-md">Game portraits</TabsTrigger></TabsList>
        <TabsContent value="collection"><PhotoPortraitStudio/></TabsContent>
        <TabsContent value="game"><GamePortraitGallery/></TabsContent>
      </Tabs>
    </div>
  </main>
}

function GamePortraitGallery() {
  const [id,setId]=useState('maya'),[expression,setExpression]=useState<PortraitExpression>('idle'),[talking,setTalking]=useState(false)
  const row=sizes.portraits.find(item=>item.id===id)!,name=names[id],isCat=id.startsWith('cat-')
  const catAppearance=defaultCatAppearance();catAppearance.colors.orange=coats[id]??coats['cat-orange']
  useEffect(()=>{if(!talking)return;const timer=window.setTimeout(()=>setTalking(false),5000);return()=>window.clearTimeout(timer)},[talking])
  return <div className="max-w-4xl">
      <h2 className="flex items-center gap-2 font-heading text-2xl font-semibold"><Sparkles className="size-5"/>PawTrail characters</h2>
      <div className="mt-7 max-w-xs"><label htmlFor="portrait-character" className="mb-2 block text-sm font-semibold">Character</label><Select value={id} onValueChange={value=>{setId(value);setExpression('idle');setTalking(false)}}><SelectTrigger id="portrait-character" className="rounded-md bg-[#fff9ef]"><SelectValue/></SelectTrigger><SelectContent>{sizes.portraits.map(item=><SelectItem key={item.id} value={item.id}>{names[item.id]??item.id}</SelectItem>)}</SelectContent></Select></div>
      <div className="mt-6 grid gap-4 sm:grid-cols-2">
        <section className="rounded-md border border-[#d9c8af] bg-[#fff9ef] p-4"><h2 className="font-heading text-xl font-semibold">Original illustration</h2><div className="mx-auto mt-4 aspect-square w-full max-w-72 overflow-hidden rounded-md bg-[#e3e7ce]"><img src={artwork(id)} alt={`${name}, original 2D artwork`} className="size-full object-contain [image-rendering:pixelated]"/></div><p className="mt-3 text-xs text-[#805d3c]">Native artwork · nearest-neighbor display</p></section>
        <section className="rounded-md border border-[#d9c8af] bg-[#fff9ef] p-4"><h2 className="font-heading text-xl font-semibold">Animated portrait</h2><div className="mx-auto mt-4 aspect-square w-full max-w-72 overflow-hidden rounded-md bg-[#e3e7ce]"><LivingPortrait key={id} subject={isCat?{kind:'cat',appearance:catAppearance}:undefined} identity={id==='trail-rescuer'?'rescuer':catIdentities[id]??id} name={name} fallback={artwork(id)} expression={expression} talking={talking}/></div><p className="mt-3 text-xs text-[#805d3c]">{(row.bytes/1000).toFixed(1)} KB complete artwork bundle · within 300 KB</p></section>
      </div>
      <section className="mt-5 rounded-md border border-[#d9c8af] bg-[#fff9ef] p-4"><h2 className="font-heading text-xl font-semibold">Try an expression</h2><div className="mt-3 flex flex-wrap gap-2">{(isCat?['idle','happy'] as const:PORTRAIT_EXPRESSIONS).map(value=><Button key={value} variant={expression===value?'secondary':'outline'} className="rounded-md capitalize" aria-pressed={expression===value} onClick={()=>{setExpression(value);setTalking(false)}}>{value==='idle'?'Neutral':value}</Button>)}{!isCat&&<Button variant="outline" className="rounded-md" disabled={talking} onClick={()=>{setExpression('idle');setTalking(true)}}><MessageCircle className="size-4"/>{talking?'Speaking…':'Try dialogue → idle'}</Button>}</div><p className="mt-3 text-xs leading-relaxed text-[#805d3c]">Blinking runs independently of talking. Use the portrait’s pause control to stop motion. Portraits use Canvas 2D and load when opened.</p></section>
  </div>
}
