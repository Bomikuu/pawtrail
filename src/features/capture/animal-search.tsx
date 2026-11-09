'use client'
import { useState } from 'react'
import { z } from 'zod'
import { Search, PawPrint } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { captureRequest } from './api'
import { captureAnimalSchema } from './schemas'

export function AnimalSearch({ onSelect, disabled = false }: { onSelect(id: string, name: string): void; disabled?: boolean }) {
  const [query, setQuery] = useState('')
  const [results, setResults] = useState<z.infer<typeof captureAnimalSchema>[]>([])
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  async function search() {
    setPending(true); setError('')
    try {
      const data = await captureRequest('animals?q=' + encodeURIComponent(query.trim()) + '&limit=10', z.object({ items: z.array(captureAnimalSchema) }))
      setResults(data.items)
      if (!data.items.length) setError('No confirmed real animal records matched that name.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Search failed. Try again.') }
    finally { setPending(false) }
  }
  return <details className="space-y-3 rounded-lg border p-3 text-sm"><summary className="cursor-pointer font-medium focus-visible:outline-2 focus-visible:outline-ring">Know their name? Find an existing animal</summary><div className="mt-3 flex gap-2"><Input aria-label="Existing animal name" placeholder="Search real animal records" maxLength={100} value={query} disabled={disabled || pending} onChange={(event) => setQuery(event.target.value)} onKeyDown={(event) => { if (event.key === 'Enter') { event.preventDefault(); void search() } }} /><Button variant="outline" aria-label="Find animal by name" disabled={disabled || pending || !query.trim()} onClick={() => void search()}><Search className="size-4" /></Button></div>{error && <p role="status" className="mt-3 text-muted-foreground">{error}</p>}<div className="mt-3 space-y-2">{results.map((animal) => <Button key={animal.id} variant="ghost" disabled={disabled} className="h-auto w-full justify-start gap-3 whitespace-normal text-left" onClick={() => onSelect(animal.id, animal.name)}>{animal.photo ? <img src={animal.photo.url} alt="" className="size-10 rounded-full object-cover" /> : <PawPrint className="size-7" />}<span>{animal.name}<span className="block text-xs font-normal text-muted-foreground">{animal.species} · {animal.areaLabel || 'Area not supplied'} · identity still needs comparison</span></span></Button>)}</div></details>
}
