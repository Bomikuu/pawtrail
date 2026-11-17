import {Button} from '@/components/ui/button'
import {Dialog,DialogContent,DialogDescription,DialogHeader,DialogTitle,DialogTrigger} from '@/components/ui/dialog'

export function WeaponConceptDialog({name,source,description}:{name:string;source:string;description:string}){
 return <Dialog>
  <DialogTrigger asChild><Button variant="outline" size="sm" className="w-full">Front / side concept</Button></DialogTrigger>
  <DialogContent className="max-h-[90dvh] overflow-y-auto sm:max-w-lg">
   <DialogHeader><DialogTitle className="font-heading text-2xl">{name} · concept</DialogTitle></DialogHeader>
   <img src={source} alt={`Front and side concept views of ${name}`} width={384} height={420} className="mx-auto h-auto max-w-full rounded-md [image-rendering:pixelated]"/>
   <DialogDescription>{description}</DialogDescription>
  </DialogContent>
 </Dialog>
}
