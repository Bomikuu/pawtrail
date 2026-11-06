import { NavigationForm } from '@/components/layout/navigation-form'
import { AnimatedNumber } from '@/components/shared/animated-number'
import { ProfileLink } from '@/features/users/profile-link'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import {
  CalendarDays,
  ArrowRight,
  ChartNoAxesColumnIncreasing,
  Check,
  ChevronLeft,
  ChevronRight,
  Crown,
  Heart,
  Leaf,
  MapPin,
  PawPrint,
  Search,
  Trophy,
} from 'lucide-react'
import { CommunityAvatar } from '@/components/shared/community-avatar'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { Input } from '@/components/ui/input'
import {
  NativeSelect as Select,
  NativeSelectOption as SelectOption,
} from '@/components/ui/native-select'
import { Progress } from '@/components/ui/progress'
import {
  Table,
  TableBody,
  TableCaption,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { getServerApi } from '@/lib/api/server'
import { findBadge } from '@/features/achievements/catalog'
import { queryValue, type SearchParams } from '@/features/workflows/server'
import type {
  LeaderboardEntry,
  LeaderboardPeriod,
  LeaderboardQuery,
} from './types'

const number = (n: number) => new Intl.NumberFormat('en-PH').format(n)
const periodNames = { all: 'All time', month: 'This month', week: 'This week' }
const categories = {
  all: 'All contributions',
  missions: 'Mission helpers',
  sightings: 'Animal spotters',
  fundraisers: 'Fundraiser supporters',
}
function href(
  period: LeaderboardPeriod,
  category: LeaderboardQuery['category'],
  q?: string,
  cursor?: string | null,
) {
  const params = new URLSearchParams({ period, category: category ?? 'all' })
  if (q) params.set('q', q)
  if (cursor) params.set('cursor', cursor)
  return '/leaderboard?' + params.toString()
}
function Kibble({ amount }: { amount: number }) {
  return (
    <span
      className={
        'recognition-kibble inline-flex items-center gap-1.5 [font-weight:750] whitespace-nowrap [&_svg]:text-[#b85408] [&_svg]:shrink-0 max-[48rem]:[.podium-plinth_&]:flex-wrap max-[48rem]:[.podium-plinth_&]:justify-center max-[48rem]:[.podium-plinth_&]:text-xs max-[48rem]:[.podium-plinth_&]:gap-1 max-[48rem]:[.podium-plinth_&_svg]:w-3.5'
      }
    >
      <PawPrint size={18} aria-hidden="true" />
      <AnimatedNumber value={amount} /> <span>Kibble</span>
    </span>
  )
}
function Contributions({ entry }: { entry: LeaderboardEntry }) {
  return (
    <ul
      className={
        'recognition-contributions flex items-center gap-3.5 list-none m-0 p-0 [&_li]:flex [&_li]:items-center [&_li]:gap-1 [&_li]:text-[0.6875rem] [&_li]:whitespace-nowrap [&_li:nth-child(1)_svg]:text-[#b85408] [&_li:nth-child(2)_svg]:text-[#487d26] [&_li:nth-child(3)_svg]:text-[#b54837] [&_strong]:[font-weight:650] max-[76rem]:flex-col max-[76rem]:items-start max-[76rem]:gap-1.5'
      }
      aria-label="Recorded contributions"
    >
      <li>
        <MapPin size={15} aria-hidden="true" />
        <span>
          <strong>{number(entry.contributions.sightings)}</strong> sightings
        </span>
      </li>
      <li>
        <Check size={15} aria-hidden="true" />
        <span>
          <strong>{number(entry.contributions.missions)}</strong> missions
        </span>
      </li>
      <li>
        <Heart size={15} aria-hidden="true" />
        <span>
          <strong>{number(entry.contributions.fundraisers)}</strong> fundraisers
        </span>
      </li>
    </ul>
  )
}
function Badges({ entry }: { entry: LeaderboardEntry }) {
  const badges = entry.badges.flatMap((b) => {
    const badge = findBadge(b.id)
    return badge ? [badge] : []
  })
  if (!badges.length)
    return (
      <span
        className={
          'recognition-no-badges block min-w-28 max-w-32 text-[0.6875rem] text-muted-foreground'
        }
      >
        No badges showcased
      </span>
    )
  return (
    <div
      className={
        'recognition-badges flex items-center gap-0.5 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:justify-center [&_>_a]:min-w-11 [&_>_a]:min-h-11 [&_>_a]:rounded-full [&_>_a]:no-underline [&_>_a]:shrink-0 [&_img]:w-9 [&_img]:h-9 [&_img]:rounded-full [&_img]:object-cover'
      }
      aria-label="Chosen achievement showcase"
    >
      {badges.slice(0, 3).map((badge) => (
        <Link
          key={badge.id}
          href={
            '/users/' +
            encodeURIComponent(entry.username) +
            '#profile-achievements'
          }
          title={badge.title}
        >
          <img
            src={badge.image}
            width={40}
            height={40}
            alt={badge.title}
            loading="lazy"
          />
        </Link>
      ))}
      {badges.length > 3 && (
        <Link
          className={
            'recognition-badge-more text-[0.6875rem] font-bold bg-[#eee7dd] text-foreground'
          }
          href={
            '/users/' +
            encodeURIComponent(entry.username) +
            '#profile-achievements'
          }
          aria-label={`View ${badges.length - 3} more showcased badges for ${entry.displayName}`}
        >
          +{badges.length - 3}
        </Link>
      )}
    </div>
  )
}
function Podium({
  entries,
  category,
}: {
  entries: LeaderboardEntry[]
  category: NonNullable<LeaderboardQuery['category']>
}) {
  if (!entries.length) return null
  const title =
    category === 'all' ? 'Leading with kindness' : categories[category]
  return (
    <section
      className="recognition-podium-section"
      aria-labelledby="podium-title"
    >
      <div
        className={
          'recognition-section-heading flex justify-between flex-wrap items-baseline [gap:0.5rem_1rem] [&_h2]:font-[800] [&_h2]:text-lg [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:m-0 [&_p]:text-xs [&_p]:text-muted-foreground [&_p]:m-0 max-[48rem]:[&_p]:max-w-[32ch]'
        }
      >
        <h2 id="podium-title">{title}</h2>
        <p>Every contribution has a person behind it.</p>
      </div>
      <ol
        className={
          'recognition-podium list-none [padding:3.75rem_1.5rem_0] m-0 grid grid-cols-3 items-end gap-4 [border-bottom:1px_solid_#e3d2b7] [&.podium-count-1]:grid-cols-1 [&.podium-count-1]:max-w-120 [&.podium-count-1]:mx-auto [&.podium-count-2]:grid-cols-2 min-[105rem]:px-[10%] max-[48rem]:gap-2 max-[48rem]:[padding:3.25rem_0_0] podium-count-' +
          entries.length
        }
      >
        {entries.map((entry) => (
          <li
            key={entry.userId}
            className={
              'podium-place min-w-0 text-[color:var(--recognition-gold)] [&.place-1]:[grid-column:2] [&.place-1]:[grid-row:1] [&.place-2]:[grid-column:1] [&.place-2]:[grid-row:1] [&.place-2]:text-[color:var(--recognition-silver)] [&.place-3]:[grid-column:3] [&.place-3]:[grid-row:1] [&.place-3]:text-[color:var(--recognition-bronze)] [.podium-count-1_&.place-1]:[grid-column:1] place-' +
              entry.rank
            }
          >
            <ProfileLink
              username={entry.username}
              className={
                'podium-person flex flex-col items-center relative text-[inherit] no-underline rounded-[1rem_1rem_0_0] [&:hover_h3]:underline [&:hover_h3]:[text-underline-offset:0.2em]'
              }
            >
              {entry.rank === 1 && (
                <Crown
                  className={
                    'podium-crown absolute top-[-2.875rem] text-[#9f6005] [fill:#ffd05c] [stroke-width:1.75] max-[48rem]:w-8 max-[48rem]:h-8 max-[48rem]:top-[-2.375rem]'
                  }
                  size={42}
                  aria-hidden="true"
                />
              )}
              <div
                className={
                  'podium-portrait relative mb-[-0.125rem] [z-index:1]'
                }
              >
                {entry.rank === 1 && (
                  <Leaf
                    className={
                      'podium-laurel absolute bottom-2.5 text-[#b17a08] [fill:#f7d57d] max-[48rem]:w-6 max-[48rem]:h-6 max-[48rem]:bottom-4 laurel-left left-[-2.625rem] [transform:rotate(-45deg)] max-[48rem]:left-[-1.375rem]'
                    }
                    size={40}
                    aria-hidden="true"
                  />
                )}
                <CommunityAvatar
                  name={entry.displayName}
                  image={entry.avatar}
                  userId={entry.userId}
                  large
                />
                {entry.rank === 1 && (
                  <Leaf
                    className={
                      'podium-laurel absolute bottom-2.5 text-[#b17a08] [fill:#f7d57d] max-[48rem]:w-6 max-[48rem]:h-6 max-[48rem]:bottom-4 laurel-right right-[-2.625rem] [transform:rotate(45deg)_scaleX(-1)] max-[48rem]:right-[-1.375rem]'
                    }
                    size={40}
                    aria-hidden="true"
                  />
                )}
                <span
                  className={
                    'podium-medal absolute bottom-[-0.5rem] left-[50%] [transform:translateX(-50%)] w-9 h-9 rounded-full grid [place-items:center] bg-[var(--recognition-gold)] [border:3px_solid_white] font-[900] text-xl leading-[1] font-heading text-card [.place-2_&]:bg-[var(--recognition-silver)] [.place-3_&]:bg-[var(--recognition-bronze)] max-[48rem]:w-7.5 max-[48rem]:h-7.5 max-[48rem]:text-base max-[48rem]:[border-width:2px] [@media(forced-colors:_active)]:[forced-color-adjust:none]'
                  }
                >
                  <span className="sr-only">Rank </span>
                  {entry.rank}
                </span>
              </div>
              <div
                className={
                  'podium-plinth w-full min-h-33 [padding:1.375rem_0.875rem_1rem] text-center rounded-[1rem_1rem_0_0] bg-[#edf1f3] text-foreground [border-top:5px_solid_#90b0bd] [.place-1_&]:pt-6 [.place-1_&]:min-h-37 [.place-1_&]:bg-[#ffedb6] [.place-1_&]:border-[#e8b438] [.place-3_&]:bg-[#fae5d5] [.place-3_&]:border-[#df9b6c] [&_h3]:[font:850_clamp(0.875rem,_1.5vw,_1.375rem)/1.25_var(--font-heading)] [&_h3]:m-0 [&_h3]:[overflow-wrap:anywhere] [&_h3]:[text-wrap:balance] [&_p]:text-xs [&_p]:[margin:0.375rem_0_0] [&_p]:text-muted-foreground max-[48rem]:[padding:1.25rem_0.375rem_0.75rem] max-[48rem]:min-h-32 max-[48rem]:[.place-1_&]:min-h-36 max-[48rem]:[.place-1_&]:pt-5.5 max-[48rem]:[&_h3]:text-[0.8125rem] max-[48rem]:[&_p]:text-[0.625rem] [@media(forced-colors:_active)]:[border:1px_solid_CanvasText]'
                }
              >
                <h3>{entry.displayName}</h3>
                <span
                  className={
                    'podium-handle block text-[0.6875rem] text-muted-foreground [overflow-wrap:anywhere] [margin:0.25rem_0_0.5rem] max-[48rem]:text-[length:0.5625rem]'
                  }
                >
                  @{entry.username}
                </span>
                <Kibble amount={entry.kibble} />
                <p>
                  {category === 'all'
                    ? `${entry.contributions.missions} approved missions`
                    : `${number(entry.contributions[category])} ${category === 'missions' ? 'approved missions' : category === 'sightings' ? 'published sightings' : 'campaigns supported'}`}
                </p>
              </div>
            </ProfileLink>
          </li>
        ))}
      </ol>
    </section>
  )
}
export async function CommunityLeaderboard({
  searchParams,
}: {
  searchParams: SearchParams
}) {
  const p = await searchParams
  const period: LeaderboardPeriod =
    p.period === 'month' || p.period === 'week' ? p.period : 'all'
  const category =
    p.category === 'missions' ||
    p.category === 'sightings' ||
    p.category === 'fundraisers'
      ? p.category
      : 'all'
  const q = queryValue(p.q)?.slice(0, 200)
  const api = await getServerApi()
  const [board, session] = await Promise.all([
    api.kibble.leaderboard(period, {
      category,
      q,
      cursor: queryValue(p.cursor),
      limit: 10,
    }),
    api.auth.session(),
  ])
  const leaders = board.podium.length
    ? board.podium
    : board.items.filter((r) => r.rank <= 3)
  const summary = board.summary
  return (
    <div
      className={
        'recognition-board [--recognition-gold:#b56b00] [--recognition-silver:#4e6d80] [--recognition-bronze:#b34e16] grid gap-6 w-full [padding:0.25rem_0_1rem] text-foreground tabular-nums max-[48rem]:gap-5 max-[48rem]:p-0'
      }
    >
      <header
        className={
          'recognition-banner w-full max-w-180 mx-auto relative overflow-hidden rounded-2xl bg-[#c3eafa] [&_>_img]:block [&_>_img]:w-full [&_>_img]:h-auto [&_>_img]:[aspect-ratio:3_/_1] [&_>_img]:object-contain [@media(forced-colors:_active)]:[border:1px_solid_CanvasText]'
        }
      >
        <h1 className="sr-only">PawPal Leaderboard</h1>
        <p className="sr-only">Celebrating our community of animal heroes!</p>
        <img
          src="/images/pawtrail/leaderboard-banner-1280.webp"
          srcSet="/images/pawtrail/leaderboard-banner-640.webp 640w, /images/pawtrail/leaderboard-banner-1280.webp 1280w, /images/pawtrail/leaderboard-banner-1920.webp 1920w"
          sizes="(max-width: 48rem) calc(100vw - 2rem), (max-width: 65rem) calc(100vw - 8rem), 720px"
          width={1920}
          height={640}
          alt=""
          fetchPriority="high"
        />
      </header>
      <section
        className={
          'recognition-intro flex items-center justify-between flex-wrap [gap:1rem_2rem] [&_h2]:[font:850_clamp(1.5rem,_2vw,_2rem)/1.2_var(--font-heading)] [&_h2]:[margin:0_0_0.5rem] [&_h2]:[letter-spacing:-0.02em] [&_p]:m-0 [&_p]:text-muted-foreground [&_p]:max-w-[68ch] [&_p]:text-[length:0.9375rem] max-[48rem]:[&_h2]:text-2xl max-[48rem]:[&_p]:text-sm'
        }
        aria-labelledby="recognition-heading"
      >
        <div>
          <h2 id="recognition-heading">Good deeds leave pawprints.</h2>
          <p>
            For the people who show up, lend a hand and make life kinder for
            animals. Your care deserves to be seen.
          </p>
        </div>
        <ButtonLink href="/missions" variant="outline">
          <Heart size={16} aria-hidden="true" /> Find a way to help
        </ButtonLink>
      </section>
      {summary && (
        <section aria-label={`${periodNames[period]} public community impact`}>
          <div
            className={
              'recognition-impact-label flex justify-between [gap:0.5rem_1rem] flex-wrap mb-2.5 text-xs text-muted-foreground max-[48rem]:[&_>_span:last-child]:max-w-[35ch]'
            }
          >
            <span>{periodNames[period]} · Public community impact</span>
            <span>From members who share their contributions</span>
          </div>
          <dl
            className={
              'recognition-stats grid grid-cols-4 gap-3 m-0 [&_>_div]:grid [&_>_div]:grid-cols-[3rem_minmax(0,_1fr)] [&_>_div]:[grid-template-rows:auto_auto_auto] [&_>_div]:gap-x-3.5 [&_>_div]:p-4 [&_>_div]:[border:1px_solid_var(--border)] [&_>_div]:rounded-[0.875rem] [&_dt]:contents [&_dt]:font-[800] [&_dt]:text-sm [&_dt]:leading-[1.3] [&_dt]:font-heading [&_dt_svg]:[grid-column:1] [&_dt_svg]:[grid-row:1_/_4] [&_dt_svg]:w-12 [&_dt_svg]:h-12 [&_dt_svg]:rounded-full [&_dt_svg]:p-3 [&_dt_svg]:[align-self:center] [&_dt_span]:[grid-column:2] [&_dt_span]:[grid-row:2] [&_dd]:[grid-column:2] [&_dd]:[grid-row:1] [&_dd]:[margin:0_0_0.125rem] [&_dd]:font-[900] [&_dd]:text-[length:1.625rem] [&_dd]:leading-[1.1] [&_dd]:font-heading max-[76rem]:grid-cols-2 max-[48rem]:gap-2 max-[48rem]:[&_>_div]:p-3 max-[48rem]:[&_>_div]:grid-cols-[2.125rem_minmax(0,_1fr)] max-[48rem]:[&_>_div]:gap-x-2 max-[48rem]:[&_dt_svg]:w-8.5 max-[48rem]:[&_dt_svg]:h-8.5 max-[48rem]:[&_dt_svg]:p-2 max-[48rem]:[&_dd]:text-[length:1.375rem] max-[48rem]:[&_dt_span]:text-xs [@media(forced-colors:_active)]:[&_>_div]:[border:1px_solid_CanvasText]'
            }
          >
            <div
              className={
                'impact-helpers [.recognition-stats_&]:bg-[#f4f8eb] [.recognition-stats_&]:border-[#b8cd8c] [.recognition-stats_&]:text-[#294b20] [&_svg]:bg-[#dcebc5]'
              }
            >
              <dt>
                <PawPrint aria-hidden="true" />
                <span>PawPals</span>
              </dt>
              <dd>
                <AnimatedNumber value={summary.activeHelpers} />
              </dd>
              <dd
                className={
                  'recognition-impact-description [.recognition-stats_&]:[grid-column:2] [.recognition-stats_&]:[grid-row:3] [.recognition-stats_&]:[margin:0.375rem_0_0] [.recognition-stats_&]:font-sans [.recognition-stats_&]:font-normal [.recognition-stats_&]:text-[0.6875rem] [.recognition-stats_&]:[line-height:1.5] max-[48rem]:[.recognition-stats_&]:text-[0.625rem]'
                }
              >
                Helpers with recorded activity
              </dd>
            </div>
            <div
              className={
                'impact-kibble [.recognition-stats_&]:bg-[#fff7e7] [.recognition-stats_&]:border-[#eec77e] [.recognition-stats_&]:text-[#694016] [&_svg]:bg-[#ffe6a9]'
              }
            >
              <dt>
                <PawPrint aria-hidden="true" />
                <span>Kibble earned</span>
              </dt>
              <dd>
                <AnimatedNumber value={summary.kibbleEarned} />
              </dd>
              <dd
                className={
                  'recognition-impact-description [.recognition-stats_&]:[grid-column:2] [.recognition-stats_&]:[grid-row:3] [.recognition-stats_&]:[margin:0.375rem_0_0] [.recognition-stats_&]:font-sans [.recognition-stats_&]:font-normal [.recognition-stats_&]:text-[0.6875rem] [.recognition-stats_&]:[line-height:1.5] max-[48rem]:[.recognition-stats_&]:text-[0.625rem]'
                }
              >
                Non-cash community rewards
              </dd>
            </div>
            <div
              className={
                'impact-contributions [.recognition-stats_&]:bg-[#eef8f4] [.recognition-stats_&]:border-[#9bc9bb] [.recognition-stats_&]:text-[#185b4b] [&_svg]:bg-[#cbe9de]'
              }
            >
              <dt>
                <Check aria-hidden="true" />
                <span>Contributions</span>
              </dt>
              <dd>
                <AnimatedNumber value={summary.contributions} />
              </dd>
              <dd
                className={
                  'recognition-impact-description [.recognition-stats_&]:[grid-column:2] [.recognition-stats_&]:[grid-row:3] [.recognition-stats_&]:[margin:0.375rem_0_0] [.recognition-stats_&]:font-sans [.recognition-stats_&]:font-normal [.recognition-stats_&]:text-[0.6875rem] [.recognition-stats_&]:[line-height:1.5] max-[48rem]:[.recognition-stats_&]:text-[0.625rem]'
                }
              >
                Missions, sightings and campaign support
              </dd>
            </div>
            <div
              className={
                'impact-animals [.recognition-stats_&]:bg-[#fff1eb] [.recognition-stats_&]:border-[#eab7a9] [.recognition-stats_&]:text-[#843923] [&_svg]:bg-[#ffd6c7]'
              }
            >
              <dt>
                <Heart aria-hidden="true" />
                <span>Animals supported</span>
              </dt>
              <dd>
                <AnimatedNumber value={summary.animalsHelped} />
              </dd>
              <dd
                className={
                  'recognition-impact-description [.recognition-stats_&]:[grid-column:2] [.recognition-stats_&]:[grid-row:3] [.recognition-stats_&]:[margin:0.375rem_0_0] [.recognition-stats_&]:font-sans [.recognition-stats_&]:font-normal [.recognition-stats_&]:text-[0.6875rem] [.recognition-stats_&]:[line-height:1.5] max-[48rem]:[.recognition-stats_&]:text-[0.625rem]'
                }
              >
                Linked to approved missions
              </dd>
            </div>
          </dl>
        </section>
      )}
      <div
        className={
          'recognition-controls flex items-center justify-between flex-wrap gap-4 max-[76rem]:items-start'
        }
      >
        <nav
          aria-label="Leaderboard period"
          className={
            'recognition-periods flex items-center flex-wrap gap-2 [&_a]:min-h-11 [&_a]:inline-flex [&_a]:items-center [&_a]:justify-center [&_a]:gap-2 [&_a]:[border:1px_solid_var(--border)] [&_a]:[padding:0.625rem_1rem] [&_a]:rounded-full [&_a]:text-foreground [&_a]:bg-card [&_a]:no-underline [&_a]:text-[0.8125rem] [&_a]:[font-weight:650] [&_a]:[transition:background_150ms_ease-out] [&_a[aria-current=page]]:text-[white] [&_a[aria-current=page]]:bg-[var(--teal)] [&_a[aria-current=page]]:border-[color:var(--teal)] [&_a:hover]:bg-[#f1ebde] [&_a[aria-current=page]:hover]:bg-[#115e59] max-[48rem]:w-full max-[48rem]:gap-1.5 max-[48rem]:[&_a]:[flex:1] max-[48rem]:[&_a]:[padding:0.625rem_0.5rem] max-[48rem]:[&_a]:text-xs max-[48rem]:[&_a]:gap-1.5 motion-reduce:[&_a]:[transition:none] [@media(forced-colors:_active)]:[&_a[aria-current=page]]:[outline:2px_solid_Highlight] [.dark_.app-shell_&_a[aria-current=page]]:bg-[#2b1c12] [.dark_.app-shell_&_a[aria-current=page]]:text-[#ffad70] [.dark_.app-shell_&_a[aria-current=page]]:border-[#a85721]'
          }
        >
          {(['all', 'month', 'week'] as const).map((key) => (
            <Link
              key={key}
              href={href(key, category, q)}
              aria-current={period === key ? 'page' : undefined}
            >
              {key === 'all' ? (
                <Crown size={17} aria-hidden="true" />
              ) : key === 'month' ? (
                <CalendarDays size={17} aria-hidden="true" />
              ) : (
                <ChartNoAxesColumnIncreasing size={17} aria-hidden="true" />
              )}
              {periodNames[key]}
            </Link>
          ))}
        </nav>
        <NavigationForm
          key={`${period}:${category}:${q ?? ''}`}
          method="get"
          action="/leaderboard"
          className={
            'recognition-filters flex items-center gap-2 flex-wrap [&_[data-slot=input]]:text-[0.8125rem] [&_[data-slot=input]]:min-h-11 [&_[data-slot=input]]:bg-card [&_label]:m-0 max-[76rem]:w-full max-[48rem]:[&_label:first-of-type]:w-full max-[48rem]:[&_label:first-of-type_[data-slot=input]]:w-full'
          }
        >
          <Input type="hidden" name="period" value={period} />
          <label>
            <span className="sr-only">Contribution category</span>
            <Select name="category" defaultValue={category}>
              {Object.entries(categories).map(([value, label]) => (
                <SelectOption key={value} value={value}>
                  {label}
                </SelectOption>
              ))}
            </Select>
          </label>
          <label
            className={
              'recognition-search [.recognition-filters_&]:relative [.recognition-filters_&]:w-48 [&_>_svg]:absolute [&_>_svg]:top-3.5 [&_>_svg]:left-3 [&_>_svg]:text-muted-foreground [&_[data-slot=input]]:pl-8.5 [&_[data-slot=input]]:w-full max-[76rem]:[.recognition-filters_&]:[flex:1] max-[48rem]:[.recognition-filters_&]:min-w-0'
            }
          >
            <span className="sr-only">Find a PawPal by name or username</span>
            <Search size={16} aria-hidden="true" />
            <Input
              name="q"
              type="search"
              placeholder="Find a PawPal"
              maxLength={200}
              defaultValue={q}
            />
          </label>
          <Button type="submit" variant="outline">
            Apply
          </Button>
        </NavigationForm>
      </div>
      <Podium entries={leaders} category={category} />
      <div
        className={
          'recognition-results-heading flex justify-between flex-wrap items-baseline [gap:0.5rem_1rem] mb-[-0.625rem] [&_h2]:font-[800] [&_h2]:text-lg [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:m-0 [&_p]:text-xs [&_p]:text-muted-foreground [&_p]:m-0'
        }
      >
        <h2>
          {q ? `Results for “${q}”` : 'Meet the people making a difference'}
        </h2>
        <p>
          {category === 'all'
            ? 'Ranked by earned Kibble'
            : `Ranked by ${category === 'missions' ? 'approved missions' : category === 'sightings' ? 'published sightings' : 'distinct campaigns supported'}`}{' '}
          · {periodNames[period].toLowerCase()}
        </p>
      </div>
      {board.items.length ? (
        <>
          <div
            className={
              'recognition-table-scroll max-w-full overflow-x-auto [border:1px_solid_#e6ddce] rounded-[0.875rem] bg-card max-[48rem]:mt-1'
            }
            role="region"
            aria-label="Community helper rankings. Scroll horizontally for all contribution details."
            tabIndex={0}
          >
            <Table
              className={
                'recognition-table [border-collapse:collapse] w-full text-[0.8125rem] text-left [&_thead]:bg-[#faf6ee] [&_th]:[padding:0.875rem_1rem] [&_th]:[vertical-align:middle] [&_td]:[padding:0.875rem_1rem] [&_td]:[vertical-align:middle] [&_thead_th]:text-xs [&_thead_th]:[font-weight:650] [&_thead_th]:whitespace-nowrap [&_tbody_tr_+_tr]:[border-top:1px_solid_#eee7dd] [&_tbody_tr:hover]:bg-[#faf4e8] [&_th:last-child]:text-right [&_td:last-child]:text-right min-[105rem]:[&_th]:py-4 min-[105rem]:[&_td]:py-4 max-[76rem]:[&_th]:p-3 max-[76rem]:[&_td]:p-3 max-[48rem]:min-w-212'
              }
            >
              <TableCaption className="sr-only">
                {categories[category]} rankings,{' '}
                {periodNames[period].toLowerCase()}. Mastery and showcased
                badges are all-time and shared by each member.
              </TableCaption>
              <TableHeader>
                <TableRow>
                  <TableHead scope="col">#</TableHead>
                  <TableHead scope="col">PawPal</TableHead>
                  <TableHead scope="col">Level & mastery</TableHead>
                  <TableHead scope="col">Key contributions</TableHead>
                  <TableHead scope="col">Badges</TableHead>
                  <TableHead scope="col">
                    <span
                      className={
                        'recognition-kibble inline-flex items-center gap-1.5 [font-weight:750] whitespace-nowrap [&_svg]:text-[#b85408] [&_svg]:shrink-0 max-[48rem]:[.podium-plinth_&]:flex-wrap max-[48rem]:[.podium-plinth_&]:justify-center max-[48rem]:[.podium-plinth_&]:text-xs max-[48rem]:[.podium-plinth_&]:gap-1 max-[48rem]:[.podium-plinth_&_svg]:w-3.5'
                      }
                    >
                      <PawPrint size={18} aria-hidden="true" />
                      Kibble
                    </span>
                  </TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {board.items.map((entry) => (
                  <TableRow
                    key={entry.userId}
                    className={
                      (entry.rank === 1
                        ? 'recognition-first [.recognition-table_&]:bg-[#fff1c9] [.recognition-table_&:hover]:bg-[#ffebaf] '
                        : '') +
                      (entry.userId === session.actor?.id
                        ? 'recognition-you [.recognition-table_&]:[outline:2px_solid_var(--teal)] [.recognition-table_&]:[outline-offset:-2px]'
                        : '')
                    }
                  >
                    <TableCell>
                      <span
                        className={
                          'recognition-rank inline-flex items-center gap-1.5 text-[length:0.9375rem] [font-weight:750] [&.rank-1]:text-[#9f5300] [&.rank-2]:text-[color:var(--recognition-silver)] [&.rank-3]:text-[color:var(--recognition-bronze)] [&.rank-crown-1]:bg-[#ffe7a2] [&.rank-crown-1]:border-[#d19a26] [&.rank-crown-1]:text-[#704409] [&.rank-crown-2]:bg-[#eef2f5] [&.rank-crown-2]:border-[#a3b7c5] [&.rank-crown-2]:text-[#40596b] [&.rank-crown-2_svg]:[fill:#c5d6e0] [&.rank-crown-3]:bg-[#fae8d8] [&.rank-crown-3]:border-[#cf9b76] [&.rank-crown-3]:text-[#7f441d] [&.rank-crown-3_svg]:[fill:#edbd94] rank-' +
                          entry.rank
                        }
                      >
                        {entry.rank <= 3 && (
                          <Crown size={16} aria-hidden="true" />
                        )}
                        <span className="sr-only">Rank </span>
                        {entry.rank}
                      </span>
                    </TableCell>
                    <TableHead scope="row">
                      <ProfileLink
                        username={entry.username}
                        className={
                          'recognition-person flex items-center gap-3 no-underline text-foreground min-w-40 [&:hover_strong]:underline [&:hover_strong]:[text-underline-offset:0.2em] [&_strong]:block [&_strong]:text-[0.8125rem] [&_strong]:[overflow-wrap:anywhere] [&_small]:block [&_small]:text-muted-foreground [&_small]:text-[0.6875rem] [&_small]:font-normal [&_small]:[overflow-wrap:anywhere]'
                        }
                      >
                        <CommunityAvatar
                          name={entry.displayName}
                          image={entry.avatar}
                          userId={entry.userId}
                        />
                        <span>
                          <strong>
                            {entry.displayName}{' '}
                            {entry.userId === session.actor?.id && (
                              <span
                                className={
                                  'recognition-you-label inline-block text-[#115e59] text-[0.625rem] [padding:0.125rem_0.375rem] ml-1 bg-[#d5ece4] rounded-[0.25rem]'
                                }
                              >
                                You
                              </span>
                            )}
                          </strong>
                          <small>@{entry.username}</small>
                        </span>
                      </ProfileLink>
                    </TableHead>
                    <TableCell>
                      <div
                        className={
                          'recognition-mastery min-w-36 max-w-52 [&_>_div]:flex [&_>_div]:items-center [&_>_div]:gap-2 [&_>_div]:text-[0.6875rem] [&_[data-slot=progress]]:h-[0.3rem] [&_[data-slot=progress]]:[margin:0.5rem_0_0.125rem] [&_[data-slot=progress]]:block [&_>_small]:text-[0.625rem] [&_>_small]:text-muted-foreground'
                        }
                      >
                        <div>
                          <span
                            className={
                              'recognition-level inline-flex shrink-0 bg-[#ffe2a0] text-[#663c0a] [padding:0.125rem_0.5rem] rounded-full text-[0.6875rem] [font-weight:750]'
                            }
                            title="One level for each 100 lifetime net Kibble, starting at level 1"
                          >
                            Lv. {entry.level}
                          </span>
                          <span>
                            {entry.mastery?.tier ?? 'Community helper'}
                          </span>
                        </div>
                        {entry.mastery && (
                          <>
                            <Progress
                              max={100}
                              value={
                                (100 * entry.mastery.unlocked) /
                                Math.max(1, entry.mastery.total)
                              }
                              aria-label={`${entry.displayName}: ${entry.mastery.unlocked} of ${entry.mastery.total} badges unlocked`}
                            />
                            <small>
                              {entry.mastery.unlocked} / {entry.mastery.total}{' '}
                              badges unlocked
                            </small>
                          </>
                        )}
                      </div>
                    </TableCell>
                    <TableCell>
                      <Contributions entry={entry} />
                      <p
                        className={
                          'recognition-reason text-[0.6875rem] text-muted-foreground max-w-[34ch] [margin:0.5rem_0_0] [line-height:1.5]'
                        }
                      >
                        <strong>Why recognized:</strong>{' '}
                        {entry.contributions.missions > 0
                          ? `${entry.contributions.missions} independently approved acts of help.`
                          : entry.contributions.sightings > 0
                            ? 'Published sightings help neighbors coordinate care.'
                            : entry.contributions.fundraisers > 0
                              ? 'Public support for animal welfare campaigns.'
                              : 'Unlocked contribution milestones.'}
                      </p>
                    </TableCell>
                    <TableCell>
                      <Badges entry={entry} />
                    </TableCell>
                    <TableCell>
                      <Kibble amount={entry.kibble} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </div>
          <footer
            className={
              'recognition-pagination flex justify-between gap-4 items-center flex-wrap [padding:0_0.25rem] [&_p]:text-xs [&_p]:text-muted-foreground [&_p]:m-0 [&_nav]:flex [&_nav]:items-center [&_nav]:gap-2 [&_nav_>_span]:text-xs [&_nav_>_span]:p-2 [&_[data-slot=button]]:p-2.5 [&_[data-slot=button]]:min-w-11 [&_[data-slot=button]]:rounded-full max-[48rem]:gap-2'
            }
          >
            <p>
              Showing {board.offset + 1}–{board.offset + board.items.length} of{' '}
              {number(board.count)} PawPals
            </p>
            <nav aria-label="Leaderboard pages">
              {board.offset > 0 ? (
                <ButtonLink
                  variant="outline"
                  href={href(period, category, q, board.previousCursor)}
                  aria-label="Previous leaderboard page"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </ButtonLink>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  aria-label="Previous leaderboard page"
                >
                  <ChevronLeft size={18} aria-hidden="true" />
                </Button>
              )}
              <span aria-current="page">
                Page {Math.floor(board.offset / 10) + 1}
              </span>
              {board.nextCursor ? (
                <ButtonLink
                  variant="outline"
                  href={href(period, category, q, board.nextCursor)}
                  aria-label="Next leaderboard page"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </ButtonLink>
              ) : (
                <Button
                  variant="outline"
                  disabled
                  aria-label="Next leaderboard page"
                >
                  <ChevronRight size={18} aria-hidden="true" />
                </Button>
              )}
            </nav>
          </footer>
        </>
      ) : (
        <section
          className={
            'recognition-empty grid [justify-items:center] [padding:2.5rem_1rem] [border-block:1px_solid_var(--border)] text-center gap-3 [&_>_svg]:text-[color:var(--teal)] [&_h2]:font-[800] [&_h2]:text-2xl [&_h2]:leading-[1.25] [&_h2]:font-heading [&_h2]:m-0 [&_p]:max-w-[55ch] [&_p]:[margin:0_0_0.5rem] [&_p]:text-muted-foreground'
          }
        >
          <PawPrint size={36} aria-hidden="true" />
          <h2>
            {q
              ? 'No PawPals match that name'
              : 'There’s room for your first good deed'}
          </h2>
          <p>
            {q
              ? 'Try another name or clear your search. The podium still celebrates this category’s leaders.'
              : 'No eligible public activity is recorded for this period and category yet. Every small act of care can start something.'}
          </p>
          <ButtonLink href={q ? href(period, category) : '/missions'}>
            {q ? 'Clear search' : 'Explore help missions'}
          </ButtonLink>
        </section>
      )}
      {!!board.spotlights.length && (
        <section
          className={
            'care-spotlights [margin:1.25rem_0] [&_>_ul]:grid [&_>_ul]:grid-cols-3 [&_>_ul]:gap-4 [&_>_ul]:list-none [&_>_ul]:p-0 [&_>_ul]:[margin:0.75rem_0] [&_>_ul_>_li]:min-w-0 [&_>_ul_>_li]:p-4 [&_>_ul_>_li]:bg-card [&_>_ul_>_li]:[border:1px_solid_var(--social-line)] [&_>_ul_>_li]:rounded-2xl [&_p]:[margin:0.75rem_0] [&_p]:text-[0.8125rem] [&_p]:[line-height:1.6] [&_p]:text-muted-foreground max-[76rem]:[&_>_ul]:grid-cols-1'
          }
          aria-labelledby="care-spotlights-heading"
        >
          <div
            className={
              'recognition-section-heading flex justify-between flex-wrap items-baseline [gap:0.5rem_1rem] [&_h2]:font-[800] [&_h2]:text-lg [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:m-0 [&_p]:text-xs [&_p]:text-muted-foreground [&_p]:m-0 max-[48rem]:[&_p]:max-w-[32ch]'
            }
          >
            <h2 id="care-spotlights-heading">The people behind the care</h2>
            <p>Approved help from the last 30 days. Every beginning matters.</p>
          </div>
          <ul>
            {board.spotlights.map((helper) => (
              <li key={helper.id}>
                <div
                  className={
                    'social-byline [.journal-card-body_>_&]:pt-4 [.journal-card-body_>_&]:mt-2 [.journal-card-body_>_&]:[border-top:1px_solid_var(--social-line)] [.journal-card-body_>_&]:w-full flex items-center gap-3 min-w-0 [&_>_a]:shrink-0 [&_>_a]:inline-flex [&_>_a]:items-center [&_>_a]:justify-center [&_>_a]:min-w-11 [&_>_a]:min-h-11 [&_>_a]:rounded-full [&_>_div:last-child]:min-w-0 [&_strong]:text-[length:0.9375rem] [&_strong]:[line-height:1.35] [&_strong]:text-foreground [&_a]:text-[inherit] [&_a]:[text-underline-offset:0.2em] [&_small]:block [&_small]:text-xs [&_small]:[line-height:1.5] [&_small]:text-muted-foreground [&_small]:mt-1 [.app-shell_.journal-card-body_>_&]:pt-2.5 [.app-shell_.journal-card-body_>_&]:mt-1 [.management-shell_.workflow-panel_&]:mb-2.5 [.care-spotlights_&_a]:no-underline'
                  }
                >
                  <ProfileLink
                    username={helper.username}
                    aria-label={`View ${helper.displayName}’s profile`}
                  >
                    <CommunityAvatar
                      name={helper.displayName}
                      image={helper.avatar}
                      userId={helper.userId}
                      small
                    />
                  </ProfileLink>
                  <div>
                    <ProfileLink username={helper.username}>
                      <strong>{helper.displayName}</strong>
                    </ProfileLink>
                    <small>{helper.label}</small>
                  </div>
                </div>
                <p>{helper.description}</p>
                <Link
                  className={
                    'story-link inline-flex items-center gap-2 mt-3 [.app-shell_.journal-card_&]:text-[0.8125rem] [.app-shell_.journal-card_&]:[font-weight:650] [.app-shell_.journal-card_&]:min-h-11 [.app-shell_.journal-card_&]:items-center [.app-shell_.journal-card_&]:mt-2 [.care-spotlights_&]:text-[0.8125rem] [.care-spotlights_&]:[line-height:1.5] [.care-spotlights_&]:min-h-11 [.care-spotlights_&]:m-0 [.care-spotlights_&_svg]:shrink-0'
                  }
                  href={helper.href}
                >
                  {helper.missionTitle}
                  <ArrowRight size={16} aria-hidden="true" />
                </Link>
              </li>
            ))}
          </ul>
        </section>
      )}
      <details
        className={
          'recognition-method [border-top:1px_solid_var(--border)] pt-5 text-[0.8125rem] [&_summary]:cursor-pointer [&_summary]:[font-weight:650] [&_summary]:min-h-11 [&_summary]:py-2.5 [&_summary]:text-[color:var(--teal)] [&_>_div]:max-w-[75ch] [&_>_div]:text-muted-foreground [&_p]:[margin:0_0_1rem]'
        }
      >
        <summary>How recognition works</summary>
        <div>
          <p>
            Kibble is a non-cash reward. All contributions ranks members by net
            Kibble earned in the selected period. Category views rank by
            approved missions, published sightings or distinct publicly
            supported campaigns. Mission count breaks ties, then a stable
            account ID keeps the order consistent. Likes, followers and post
            reach do not affect rank.
          </p>
          <p>
            Week starts Monday; periods use Asia/Manila. Missions use their
            approval date; older records use a reward’s approval date when
            available. Undated legacy approvals appear only in All time.
            Published sightings use their record creation date and campaign
            support uses its recorded date. Reversed rewards reduce Kibble in
            the period when the correction is recorded. Ranking points are
            floored at zero for each helper in each period, so a period with
            only corrections does not show negative points.
          </p>
          <p>
            Animal totals count distinct public animals linked to approved
            missions. They do not certify rescues or adoptions. Contribution
            totals combine mission approvals, published sightings and distinct
            campaigns supported per helper; they are activities, not a count of
            animals saved. Public totals cover the selected period, before
            category and name filters.
          </p>
          <p>
            Only discoverable members who share contributions appear. Anonymous
            campaign support stays private. Badges appear only when earned and
            chosen for a member’s profile; mastery is opt-in. Levels use
            lifetime net Kibble, with one level per 100 Kibble. Badges and
            levels stay all-time when you change periods.
          </p>
          {session.demo && (
            <p>
              This is a sample community. Profiles, reviews and activity are
              illustrative; fundraiser contributions are simulated and transfer
              no money. Demo time is fixed at 2 November 2026, so period
              comparisons use that date.
            </p>
          )}
        </div>
      </details>
      <aside
        className={
          'recognition-invitation flex items-center gap-6 [padding:1rem_1.25rem] bg-[#f3f6e9] rounded-2xl [&_img]:w-28 [&_img]:h-auto [&_img]:[mix-blend-mode:multiply] [&_>_div]:[flex:1] [&_h2]:font-[800] [&_h2]:text-lg [&_h2]:leading-[1.3] [&_h2]:font-heading [&_h2]:[margin:0_0_0.375rem] [&_p]:m-0 [&_p]:text-[#526141] [&_p]:text-[0.8125rem] max-[48rem]:flex-wrap max-[48rem]:p-4 max-[48rem]:gap-4 max-[48rem]:[&_img]:w-19 max-[48rem]:[&_>_div]:min-w-40 max-[48rem]:[&_>_[data-slot=button]]:w-full [.dark_.app-shell_&]:bg-[#1c1c1c] [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border'
        }
      >
        <img
          src="/images/pawtrail/community-friends.webp"
          width={264}
          height={122}
          alt=""
          loading="lazy"
        />
        <div>
          <h2>A little care goes a long way.</h2>
          <p>
            Help an animal, complete a mission or share a sighting. Recognition
            starts with showing up.
          </p>
        </div>
        <ButtonLink href="/dashboard/achievements" variant="outline">
          Explore your achievements
        </ButtonLink>
      </aside>
    </div>
  )
}
