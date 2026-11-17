import {useEffect,useState} from 'react'
import {Input} from '@/components/ui/input'
import {Select,SelectContent,SelectItem,SelectTrigger,SelectValue} from '@/components/ui/select'
import {Switch} from '@/components/ui/switch'
import type {Triple} from '@/game/skin-studio/model-document'
export function NumberField({label,value,min=0,max=10000,step=1,onChange}:{label:string;value:number;min?:number;max?:number;step?:number;onChange:(n:number)=>void}){
 const[draft,setDraft]=useState(String(value));useEffect(()=>setDraft(String(Math.round(value*100)/100)),[value])
 return <label className="block min-w-0 space-y-1 text-xs font-medium"><span>{label}</span><Input type="number" className="h-8 tabular-nums" value={draft} min={min} max={max} step={step} onChange={e=>setDraft(e.target.value)} onKeyDown={e=>{if(e.key==='Enter')e.currentTarget.blur()}} onBlur={()=>{const n=Number(draft);if(draft.trim()&&Number.isFinite(n))onChange(Math.max(min,Math.min(max,n)));else setDraft(String(value))}}/></label>
}
export function VectorField({label,value,onChange,min=-40,max=40}:{label:string;value:Triple;onChange:(n:Triple)=>void;min?:number;max?:number}){return <fieldset><legend className="mb-2 text-xs font-medium">{label}</legend><div className="grid grid-cols-3 gap-2">{['X','Y','Z'].map((axis,i)=><NumberField key={axis} label={axis} value={value[i]} min={min} max={max} step={.1} onChange={v=>onChange(value.map((n,j)=>j===i?v:n) as Triple)}/>)}</div></fieldset>}
export function Choice({label,value,options,onChange}:{label:string;value:string;options:readonly (readonly [string,string])[];onChange:(v:string)=>void}){return <label className="block space-y-1 text-xs font-medium"><span>{label}</span><Select value={value} onValueChange={onChange}><SelectTrigger className="h-8 w-full" aria-label={label}><SelectValue/></SelectTrigger><SelectContent>{options.map(([v,text])=><SelectItem key={v} value={v}>{text}</SelectItem>)}</SelectContent></Select></label>}
export function Toggle({label,checked,onChange}:{label:string;checked:boolean;onChange:(b:boolean)=>void}){return <label className="flex items-center justify-between gap-3 text-xs font-medium"><span>{label}</span><Switch checked={checked} onCheckedChange={onChange} aria-label={label}/></label>}
