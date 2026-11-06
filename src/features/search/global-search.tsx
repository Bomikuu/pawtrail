'use client'
import { NavigationForm } from '@/components/layout/navigation-form'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { useEffect, useId, useRef, useState } from 'react'
import { useAppRouter as useRouter } from '@/components/layout/page-navigation'
import { Search, X } from 'lucide-react'
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
  const [composing, setComposing] = useState(false)
  const input = useRef<HTMLInputElement>(null)
  useEffect(() => {
    setItems([])
    setIndex(-1)
    if (q.trim().length < 2 || composing) return
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
  }, [q, composing])
  return (
    <div
      className={
        'global-search relative hidden min-w-0 flex-1 md:block md:max-w-[38rem]'
      }
    >
      <NavigationForm
        className="flex items-center gap-1 rounded-full border bg-muted/50 px-2"
        action="/search"
        method="get"
        onSubmit={(e) => {
          if (composing) {
            e.preventDefault()
            return
          }
          setOpen(false)
          if (index >= 0 && items[index]) {
            e.preventDefault()
            router.push(items[index].path)
          }
        }}
      >
        <label className="sr-only" htmlFor={id}>
          Search PawTrail
        </label>
        <Input
          className="h-10 border-0 bg-transparent shadow-none focus-visible:ring-0 dark:bg-transparent"
          ref={input}
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
          placeholder="Search pets, people, stories…"
          maxLength={200}
          value={q}
          onFocus={() => setOpen(true)}
          onBlur={() => setTimeout(() => setOpen(false), 150)}
          onChange={(e) => {
            setQ(e.target.value)
            setError('')
            setOpen(true)
          }}
          onCompositionStart={() => setComposing(true)}
          onCompositionEnd={() => setComposing(false)}
          onKeyDown={(e) => {
            if (e.nativeEvent.isComposing) return
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
        {!!q && (
          <Button
            type="button"
            variant="ghost"
            aria-label="Clear search"
            className={
              'search-clear [.app-shell_.global-search_&]:absolute [.app-shell_.global-search_&]:right-0.5 [.app-shell_.global-search_&]:top-0 [.app-shell_.global-search_&]:p-2.5 [.app-shell_.global-search_&]:rounded-full'
            }
            onClick={() => {
              setQ('')
              setError('')
              setItems([])
              setIndex(-1)
              setOpen(false)
              input.current?.focus()
            }}
          >
            <X size={16} aria-hidden="true" />
          </Button>
        )}
      </NavigationForm>
      <ul
        className={
          'search-suggestions absolute z-50 mt-2 w-full rounded-xl border bg-popover p-2 text-popover-foreground shadow-lg'
        }
        role="listbox"
        id={`${id}-results`}
        hidden={!open || !items.length}
      >
        {items.map((result, i) => (
          <li
            key={`${result.ref.kind}:${result.ref.id}`}
            role="option"
            id={`${id}-${i}`}
            className="rounded-lg aria-selected:bg-accent"
            aria-selected={i === index}
          >
            <Link
              className="grid gap-0.5 rounded-lg px-3 py-2 text-sm hover:bg-accent"
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
        <p
          className={
            'search-feedback absolute z-50 mt-2 w-full rounded-lg border bg-popover p-3 text-sm text-popover-foreground shadow-sm'
          }
          role="status"
        >
          {error}
        </p>
      )}
    </div>
  )
}
