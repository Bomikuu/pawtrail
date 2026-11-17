import { useEffect, useId, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { SOFA_DEFAULT_COLOR } from '@/game/furniture/palette-color'

export function SofaColorControl({ color, onChange, disabled = false, description }: {
  color: string; onChange: (value: string) => void; disabled?: boolean; description: string
}) {
  const id = useId(), [hex, setHex] = useState(color)
  useEffect(() => setHex(color), [color])
  const valid = /^#[0-9a-f]{6}$/i.test(hex)
  const choose = (value: string) => { setHex(value.toLowerCase()); onChange(value) }
  return <section className="space-y-2" aria-label="Sofa upholstery">
    <h3 className="font-heading text-lg font-semibold">Upholstery color</h3>
    <p className="text-xs leading-relaxed text-muted-foreground">{description} Wood and pillows keep their original colors.</p>
    <div className="flex items-end gap-2">
      <div className="space-y-1"><Label htmlFor={id + '-color'} className="text-xs">Color</Label><Input id={id + '-color'} aria-label="Sofa upholstery color" type="color" value={color} disabled={disabled} onChange={event => choose(event.target.value)} className="h-9 w-12 p-1" /></div>
      <div className="min-w-0 flex-1 space-y-1"><Label htmlFor={id + '-hex'} className="text-xs">Hex</Label><Input id={id + '-hex'} value={hex} maxLength={7} spellCheck={false} disabled={disabled} aria-invalid={!valid} aria-describedby={id + '-help'} onChange={event => setHex(event.target.value)} onKeyDown={event => { if (event.key === 'Enter') { event.preventDefault(); if (valid) choose(hex) } }} className="h-9 font-mono" /></div>
      <Button size="sm" variant="outline" disabled={disabled || !valid} onClick={() => choose(hex)}>Apply</Button>
    </div>
    <div className="grid grid-cols-2 gap-2">{[['Ocean blue', '#376db7'], ['Warm cream', '#e5d5b2'], ['Rose', '#b86a82'], ['Charcoal', '#343946']].map(([label, value]) => <Button key={value} variant={color === value ? 'secondary' : 'outline'} size="sm" disabled={disabled} aria-pressed={color === value} onClick={() => choose(value)}><span aria-hidden="true" className="size-3 shrink-0 rounded-sm border border-foreground/20" style={{ backgroundColor: value }} />{label}</Button>)}</div>
    <Button size="sm" variant="outline" disabled={disabled} onClick={() => choose(SOFA_DEFAULT_COLOR)}>Restore original color</Button>
    <p id={id + '-help'} className="text-xs text-muted-foreground">{valid ? 'Applies to all four views.' : 'Enter a six-digit color such as #376db7.'}</p>
  </section>
}
