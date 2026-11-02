'use client'
import Link from 'next/link'
import { useEffect, useId, useState } from 'react'
import { useRouter } from 'next/navigation'
import { Search } from 'lucide-react'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { getBrowserApi } from '@/lib/api/client'
import type { SearchResults } from './types'

export function GlobalSearch() {
  const id = useId()
  const router = useRouter()
  const [q, setQ] = useState('')
  const [items, setItems] = useState<SearchResults['items']>([])
  const [open, setOpen] = useState(false)
  const [index, setIndex] = useState(-1)
  const [error, setError] = useState('')
  useEffect(() => {
    setItems([])
    setIndex(-1)
    if (q.trim().length < 2) return
    const controller = new AbortController()
    const timer = setTimeout(() => {
      void getBrowserApi()
        .search.query({ q: q.trim(), limit: 6 }, { signal: controller.signal })
        .then((result) => {
          if (!controller.signal.aborted) {
            setItems(result.items)
            setError('')
          }
        })
        .catch(() => {
          if (!controller.signal.aborted)
            setError('Suggestions unavailable. Press Enter to search.')
        })
    }, 300)
    return () => {
      clearTimeout(timer)
      controller.abort()
    }
  }, [q])
  return (
    <div className="global-search">
      <form
        action="/search"
        method="get"
        onSubmit={(e) => {
          if (index >= 0 && items[index]) {
            e.preventDefault()
            router.push(items[index].path)
            setOpen(false)
          }
        }}
      >
        <label className="sr-only" htmlFor={id}>
          Search PawTrail
        </label>
        <Input
          id={id}
          role="combobox"
          aria-autocomplete="list"
          aria-controls={`${id}-results`}
          aria-expanded={open && items.length > 0}
          aria-activedescendant={
            open && index >= 0 ? `${id}-${index}` : undefined
          }
          name="q"
          type="search"
          placeholder="Find a story…"
          maxLength={200}
          value={q}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQ(e.target.value)
            setOpen(true)
          }}
          onKeyDown={(e) => {
            if (e.key === 'Escape') {
              setOpen(false)
              setIndex(-1)
            }
            if (e.key === 'ArrowDown' && items.length) {
              e.preventDefault()
              setOpen(true)
              setIndex((i) => (i + 1) % items.length)
            }
            if (e.key === 'ArrowUp' && items.length) {
              e.preventDefault()
              setOpen(true)
              setIndex((i) => (i - 1 + items.length) % items.length)
            }
          }}
        />
        <Button type="submit" variant="ghost" aria-label="Search">
          <Search size={18} aria-hidden="true" />
        </Button>
      </form>
      <ul
        className="search-suggestions"
        role="listbox"
        id={`${id}-results`}
        hidden={!open || !items.length}
      >
        {items.map((result, i) => (
          <li
            key={`${result.ref.kind}:${result.ref.id}`}
            role="option"
            id={`${id}-${i}`}
            aria-selected={i === index}
          >
            <Link
              href={result.path}
              tabIndex={-1}
              onClick={() => setOpen(false)}
            >
              <strong>{result.title}</strong>
              <small>{result.ref.kind}</small>
            </Link>
          </li>
        ))}
      </ul>
      {error && open && (
        <p className="search-feedback" role="status">
          {error}
        </p>
      )}
    </div>
  )
}
