import { Card } from '@/components/ui/card'
import { NavigationForm } from '@/components/layout/navigation-form'
import type { ReactNode } from 'react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { ArrowRight, PawPrint } from 'lucide-react'
import { AnimalImage } from '@/components/shared/animal-image'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from '@/components/ui/native-select'
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
    <header
      className={
        'workspace-heading grid items-start justify-between gap-0.5 [margin:0_0_2rem] [padding:0_0.875rem_1.5rem] [&_h1]:font-heading [&_h1]:text-[length:clamp(1.75rem,_3vw,_2.25rem)] [&_h1]:[line-height:1.18] [&_h1]:[margin:0_0_0.75rem] [&_h1]:[text-wrap:balance] [&_p]:max-w-[65ch] [&_p]:text-muted-foreground [&_p]:m-0 [&_p]:[line-height:1.65] max-[48rem]:block max-[48rem]:[&_>_a]:mt-4 [&_strong]:font-[800] [&_strong]:text-lg [&_strong]:leading-[1.3] [&_strong]:font-heading [&_span]:text-xs [&_span]:text-muted-foreground [.management-shell_&]:mb-6 [.route-transition_>_header&]:flex [.route-transition_>_header&]:items-center [.route-transition_>_header&]:justify-between [.route-transition_>_header&]:gap-6 [.route-transition_>_header&]:p-0 [.route-transition_>_header&]:[margin:0_0_1.25rem] [.route-transition_>_header&_>_div]:min-w-0 [.route-transition_>_header&_h1]:font-[850] [.route-transition_>_header&_h1]:text-[1.75rem] [.route-transition_>_header&_h1]:leading-[1.2] [.route-transition_>_header&_h1]:font-heading [.route-transition_>_header&_h1]:[margin:0_0_0.5rem] [.route-transition_>_header&_p]:text-[length:0.9375rem] [.route-transition_>_header&_p]:[line-height:1.55] [.route-transition_>_header&_>_[data-slot=button]]:shrink-0 [.route-transition_>_header&_>_[data-slot=button]]:w-auto [.route-transition_>_header&_>_[data-slot=button]]:whitespace-nowrap max-[48rem]:[.route-transition_>_header&]:flex-col max-[48rem]:[.route-transition_>_header&]:items-start max-[48rem]:[.route-transition_>_header&]:gap-3.5 max-[48rem]:[.route-transition_>_header&_h1]:text-2xl max-[48rem]:[.route-transition_>_header&_>_[data-slot=button]]:w-auto'
      }
    >
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
    <Card
      role="article"
      className={`journal-card [border:1px_solid_#ede5d8] bg-card rounded-2xl overflow-hidden [margin:0_0_1.25rem] min-w-0 [transition:border-color_150ms] [.journal-grid_&]:m-0 [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:[margin:0.25rem_0_0.75rem] [&_h2_a]:text-[inherit] [&_h2_a]:no-underline [&_p]:[overflow-wrap:anywhere] [.app-shell_&]:min-w-0 [.app-shell_&]:bg-card [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:[overflow-wrap:anywhere] [.app-shell_.journal-grid_&]:m-0 [.app-shell_.journal-grid_&]:h-full [@media(hover:_hover)]:[.app-shell_&:hover]:border-[#d2b89f] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none]${image === undefined ? ' journal-card-compact [.app-shell_&_h2]:text-lg' : ''}`}
    >
      {image !== undefined && (
        <AnimalImage
          image={image}
          className={
            'journal-photo w-full h-auto [aspect-ratio:4/3] object-cover block [.app-shell_&]:[aspect-ratio:16_/_9] [.app-shell_&]:object-cover [.app-shell_&]:max-h-52 max-[48rem]:[.app-shell_&]:[aspect-ratio:16_/_9] max-[48rem]:[.app-shell_&]:max-h-48'
          }
        />
      )}
      <div
        className={
          'journal-card-body p-5 flex flex-col items-start h-auto [&_>_p]:[margin:0_0_0.875rem] [&_>_p]:text-muted-foreground [&_>_p]:text-[length:0.9375rem] [&_>_[data-slot=progress]]:w-full [.app-shell_&]:p-4 [.app-shell_&]:gap-1'
        }
      >
        <header
          className={
            'resource-card-heading flex items-center gap-3.5 min-w-0 mb-3.5 [&_>_div:last-child]:min-w-0 [&_>_div:last-child]:[flex:1] [.app-shell_&_h2]:font-[850] [.app-shell_&_h2]:text-xl [.app-shell_&_h2]:leading-[1.3] [.app-shell_&_h2]:font-heading [.app-shell_&_h2]:[margin:0_0_0.25rem] [.resource-hero-content_&]:m-0 [.resource-hero-content_&]:items-start max-[48rem]:gap-2.5 [.app-shell_.journal-card-compact_&]:mb-1 [.app-shell_.journal-card-compact_&]:items-start [@media(hover:_hover)]:[&_a:hover]:underline [@media(hover:_hover)]:[&_a:hover]:[text-underline-offset:0.2em]'
          }
        >
          {image === undefined && (
            <span
              className={
                'resource-mark [flex:0_0_2.75rem] w-11 h-11 rounded-full object-cover bg-[#fff0df] text-[#96501f] grid [place-items:center]'
              }
            >
              <PawPrint size={20} aria-hidden="true" />
            </span>
          )}
          <div>
            <h2>
              <Link href={href}>{title}</Link>
            </h2>
            {meta && (
              <p
                className={
                  'journal-meta text-sm text-[#6b625b] [margin:0_0_0.5rem] [.resource-card-heading_&]:m-0 [.resource-card-heading_&]:text-[0.8125rem]'
                }
              >
                {meta}
              </p>
            )}
          </div>
        </header>
        {status && (
          <div className={'resource-status [margin:0.25rem_0_0.5rem]'}>
            {status}
          </div>
        )}
        {description && <p>{description}</p>}
        {children}
        {people}
        <Link
          className={
            'story-link inline-flex items-center gap-2 mt-3 [.app-shell_.journal-card_&]:text-[0.8125rem] [.app-shell_.journal-card_&]:[font-weight:650] [.app-shell_.journal-card_&]:min-h-11 [.app-shell_.journal-card_&]:items-center [.app-shell_.journal-card_&]:mt-2 [.care-spotlights_&]:text-[0.8125rem] [.care-spotlights_&]:[line-height:1.5] [.care-spotlights_&]:min-h-11 [.care-spotlights_&]:m-0 [.care-spotlights_&_svg]:shrink-0'
          }
          href={href}
        >
          {actionLabel} <ArrowRight aria-hidden="true" size={16} />
        </Link>
      </div>
    </Card>
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
    <section
      className={
        'journal-empty [padding:3rem_1.5rem] text-center [border:1px_dashed_#c9bcb0] rounded-2xl [margin:1.5rem_0] flex flex-col items-center gap-4 [&_p]:max-w-[55ch] [&_p]:m-0 [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:bg-card [.app-shell_&]:[padding:1.75rem_1.25rem] [.app-shell_&]:gap-3.5 [.app-shell_&]:[margin:1rem_0_1.5rem] [&_>_img]:w-40 [&_>_img]:max-w-[65%] [&_>_img]:h-auto [.app-shell_.attention-panel_&]:[border:0] [.app-shell_.attention-panel_&]:[padding:0.5rem_0] [.app-shell_.attention-panel_&]:m-0 [.app-shell_.attention-panel_&]:bg-[transparent] [.app-shell_.attention-panel_&_>_img]:w-24'
      }
    >
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
    <header
      className={
        'resource-hero [border:1px_solid_var(--social-line)] rounded-2xl overflow-hidden bg-card mb-6 [.app-shell_&_h1]:[font:900_clamp(1.75rem,_2.8vw,_2.375rem)/1.2_var(--font-heading)] [.app-shell_&_h1]:[margin:0_0_0.5rem] [.app-shell_&_h1]:[letter-spacing:-0.02em] [.app-shell_&_h1]:[text-wrap:balance] [&_p]:m-0 [&_p]:text-sm [&_p]:text-muted-foreground'
      }
    >
      <div
        className={
          'resource-hero-cover h-[clamp(8rem,_16vw,_13rem)] bg-[#eaf1dc] overflow-hidden [&_>_img]:block [&_>_img]:w-full [&_>_img]:h-full [&_>_img]:object-cover [&_>_div]:min-h-full max-[48rem]:h-32'
        }
      >
        {image ? <AnimalImage image={image} /> : <ProfileBanner id={banner} />}
      </div>
      <div className={'resource-hero-content p-6 max-[48rem]:p-4'}>
        <div
          className={
            'resource-card-heading flex items-center gap-3.5 min-w-0 mb-3.5 [&_>_div:last-child]:min-w-0 [&_>_div:last-child]:[flex:1] [.app-shell_&_h2]:font-[850] [.app-shell_&_h2]:text-xl [.app-shell_&_h2]:leading-[1.3] [.app-shell_&_h2]:font-heading [.app-shell_&_h2]:[margin:0_0_0.25rem] [.resource-hero-content_&]:m-0 [.resource-hero-content_&]:items-start max-[48rem]:gap-2.5 [.app-shell_.journal-card-compact_&]:mb-1 [.app-shell_.journal-card-compact_&]:items-start [@media(hover:_hover)]:[&_a:hover]:underline [@media(hover:_hover)]:[&_a:hover]:[text-underline-offset:0.2em]'
          }
        >
          <AnimalImage
            image={image}
            compact
            className={
              'resource-avatar [flex:0_0_2.75rem] w-11 h-11 rounded-full object-cover bg-[#fff0df] text-[#96501f] [.animal-image-fallback&]:grid [.animal-image-fallback&]:[place-items:center] [.resource-hero_&]:w-15 [.resource-hero_&]:h-15 [.resource-hero_&]:[flex-basis:3.75rem] max-[48rem]:[.resource-hero_&]:w-11 max-[48rem]:[.resource-hero_&]:h-11 max-[48rem]:[.resource-hero_&]:[flex-basis:2.75rem]'
            }
          />
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
    <NavigationForm
      className={
        'catalog-filters flex items-end flex-wrap gap-3 [padding:1rem_0] [border-block:1px_solid_#ede5d8] mb-6 [&_label]:grid [&_label]:gap-[0.4rem] [&_label]:[flex:1_1_10rem] [&_label]:text-sm [&_label:first-child]:[flex:2_1_15rem] [.management-shell_&]:bg-card [.management-shell_&]:border-border [.management-shell_&]:rounded-xl [.app-shell_&]:gap-3 [.app-shell_&]:[padding:1rem_0] [.app-shell_&]:mb-4 [.app-shell_&]:[border-top:0] [.app-shell_&]:[border-bottom-color:var(--social-line)] [&_>_[data-slot=button]]:whitespace-nowrap [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.events-directory-toolbar_&]:m-0'
      }
      method="get"
    >
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
              <SelectOption key={o.value} value={o.value}>
                {o.label}
              </SelectOption>
            ))}
          </Select>
        </label>
      ))}
      <Button type="submit" variant="outline">
        Apply filters
      </Button>
    </NavigationForm>
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
    <nav
      className={'catalog-pagination flex justify-center [margin:2rem_0]'}
      aria-label={label}
    >
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
  return (
    <div
      className={
        'detail-body max-w-[75ch] [margin:1.5rem_0] [line-height:1.75] [overflow-wrap:anywhere] [&_h2]:font-heading [&_h2]:text-2xl [&_h2]:[margin:2.25rem_0_0.75rem] [.app-shell_&]:max-w-none [.app-shell_&]:w-full [.app-shell_&]:bg-card [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:p-6 [&_>_p]:max-w-[75ch] [&_>_ul]:max-w-[75ch] [&_>_h2:first-child]:mt-0 max-[48rem]:[.app-shell_&]:p-4'
      }
    >
      {children}
    </div>
  )
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
