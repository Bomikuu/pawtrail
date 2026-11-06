import type { ReactNode } from 'react'
import Link from 'next/link'
import { ArrowRight, PawPrint } from 'lucide-react'
import { AnimalImage } from '@/components/shared/animal-image'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import { Select } from '@/components/ui/select'
import type { Field } from './form'
import { ProfileBanner } from '@/features/users/profile-banner'

export function PageHeading({
  title,
  description,
  action,
}: {
  title: string
  description?: string
  action?: ReactNode
}) {
  return (
    <header className="workspace-heading">
      <div>
        <h1>{title}</h1>
        {description && <p>{description}</p>}
      </div>
      {action}
    </header>
  )
}
export function CatalogCard({
  href,
  title,
  description,
  meta,
  image,
  children,
  people,
  status,
  actionLabel = 'View details',
}: {
  href: string
  title: string
  description?: string
  meta?: string
  image?: { url: string; alt: string; sensitive?: boolean } | null
  children?: ReactNode
  people?: ReactNode
  status?: ReactNode
  actionLabel?: string
}) {
  return (
    <article
      className={`journal-card${image === undefined ? ' journal-card-compact' : ''}`}
    >
      {image !== undefined && (
        <AnimalImage image={image} className="journal-photo" />
      )}
      <div className="journal-card-body">
        <header className="resource-card-heading">
          {image === undefined && (
            <span className="resource-mark">
              <PawPrint size={20} aria-hidden="true" />
            </span>
          )}
          <div>
            <h2>
              <Link href={href}>{title}</Link>
            </h2>
            {meta && <p className="journal-meta">{meta}</p>}
          </div>
        </header>
        {status && <div className="resource-status">{status}</div>}
        {description && <p>{description}</p>}
        {children}
        {people}
        <Link className="story-link" href={href}>
          {actionLabel} <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </article>
  )
}
export function Empty({
  children,
  href,
  label,
}: {
  children: ReactNode
  href?: string
  label?: string
}) {
  return (
    <section className="journal-empty">
      <img
        src="/images/pawtrail/caught-up.webp"
        width={239}
        height={119}
        loading="lazy"
        alt=""
      />
      <p>{children}</p>
      {href && (
        <ButtonLink href={href}>{label ?? 'Explore the community'}</ButtonLink>
      )}
    </section>
  )
}
export function ResourceHero({
  title,
  description,
  image,
  children,
  banner = 'meadow',
}: {
  title: string
  description: string
  image?: { url: string; alt: string; sensitive?: boolean } | null
  children?: ReactNode
  banner?: string
}) {
  return (
    <header className="resource-hero">
      <div className="resource-hero-cover">
        {image ? <AnimalImage image={image} /> : <ProfileBanner id={banner} />}
      </div>
      <div className="resource-hero-content">
        <div className="resource-card-heading">
          <AnimalImage image={image} compact className="resource-avatar" />
          <div>
            <h1>{title}</h1>
            <p>{description}</p>
          </div>
        </div>
        {children}
      </div>
    </header>
  )
}
export function FilterForm({
  fields,
  q,
  search = true,
}: {
  fields?: Field[]
  q?: string
  search?: boolean
}) {
  return (
    <form className="catalog-filters" method="get">
      {search && (
        <label>
          Search
          <Input
            name="q"
            defaultValue={q}
            type="search"
            placeholder="Name, story or neighborhood"
            maxLength={200}
          />
        </label>
      )}
      {fields?.map((f) => (
        <label key={f.name}>
          {f.label}
          <Select name={f.name} defaultValue={String(f.value ?? '')}>
            {f.options?.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </label>
      ))}
      <Button type="submit" variant="outline">
        Apply filters
      </Button>
    </form>
  )
}
export function NextPage({
  cursor,
  params = {},
  cursorKey = 'cursor',
  anchor,
  label = 'Next page',
}: {
  cursor: string | null
  params?: Record<string, string | undefined>
  cursorKey?: string
  anchor?: string
  label?: string
}) {
  if (!cursor) return null
  const q = new URLSearchParams(
    Object.entries(params).filter(
      (entry): entry is [string, string] => entry[1] !== undefined,
    ),
  )
  q.set(cursorKey, cursor)
  return (
    <nav className="catalog-pagination" aria-label={label}>
      <ButtonLink
        variant="outline"
        href={`?${q}${anchor ? `#${encodeURIComponent(anchor)}` : ''}`}
      >
        {label}
      </ButtonLink>
    </nav>
  )
}
export function DetailBody({ children }: { children: ReactNode }) {
  return <div className="detail-body">{children}</div>
}
export const php = (minor: number) =>
  new Intl.NumberFormat('en-PH', { style: 'currency', currency: 'PHP' }).format(
    minor / 100,
  )
export const date = (instant: string) =>
  new Intl.DateTimeFormat('en-PH', {
    timeZone: 'Asia/Manila',
    dateStyle: 'medium',
    timeStyle: 'short',
  }).format(new Date(instant))
export const options = (values: string[], empty = 'Any') => [
  { value: '', label: empty },
  ...values.map((value) => ({ value, label: value.replaceAll('_', ' ') })),
]
