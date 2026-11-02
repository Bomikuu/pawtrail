import Link from 'next/link'
import {
  CalendarDays,
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
import { Select } from '@/components/ui/select'
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
    <span className="recognition-kibble">
      <PawPrint size={18} aria-hidden="true" />
      {number(amount)} <span>Kibble</span>
    </span>
  )
}
function Contributions({ entry }: { entry: LeaderboardEntry }) {
  return (
    <ul
      className="recognition-contributions"
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
    return <span className="recognition-no-badges">No badges showcased</span>
  return (
    <div
      className="recognition-badges"
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
          className="recognition-badge-more"
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
      <div className="recognition-section-heading">
        <h2 id="podium-title">{title}</h2>
        <p>Every contribution has a person behind it.</p>
      </div>
      <ol className={'recognition-podium podium-count-' + entries.length}>
        {entries.map((entry) => (
          <li key={entry.userId} className={'podium-place place-' + entry.rank}>
            <Link
              href={'/users/' + encodeURIComponent(entry.username)}
              className="podium-person"
            >
              {entry.rank === 1 && (
                <Crown className="podium-crown" size={42} aria-hidden="true" />
              )}
              <div className="podium-portrait">
                {entry.rank === 1 && (
                  <Leaf
                    className="podium-laurel laurel-left"
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
                    className="podium-laurel laurel-right"
                    size={40}
                    aria-hidden="true"
                  />
                )}
                <span className="podium-medal">
                  <span className="sr-only">Rank </span>
                  {entry.rank}
                </span>
              </div>
              <div className="podium-plinth">
                <h3>{entry.displayName}</h3>
                <span className="podium-handle">@{entry.username}</span>
                <Kibble amount={entry.kibble} />
                <p>
                  {category === 'all'
                    ? `${entry.contributions.missions} approved missions`
                    : `${number(entry.contributions[category])} ${category === 'missions' ? 'approved missions' : category === 'sightings' ? 'published sightings' : 'campaigns supported'}`}
                </p>
              </div>
            </Link>
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
    <div className="recognition-board">
      <header className="recognition-banner">
        <img
          className="recognition-banner-pets"
          src="/images/pawtrail/care-circle.webp"
          width={504}
          height={245}
          alt=""
        />
        <div>
          <img
            className="recognition-banner-trophy"
            src="/images/badges/mission-complete.webp"
            width={72}
            height={72}
            alt=""
          />
          <h1>PawPal Leaderboard</h1>
          <p>Celebrating our community of animal heroes</p>
        </div>
        <img
          className="recognition-banner-friends"
          src="/images/pawtrail/community-friends.webp"
          width={264}
          height={122}
          alt=""
        />
      </header>
      <section
        className="recognition-intro"
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
          <div className="recognition-impact-label">
            <span>{periodNames[period]} · Public community impact</span>
            <span>From members who share their contributions</span>
          </div>
          <dl className="recognition-stats">
            <div className="impact-helpers">
              <dt>
                <PawPrint aria-hidden="true" />
                <span>PawPals</span>
              </dt>
              <dd>{number(summary.activeHelpers)}</dd>
              <dd className="recognition-impact-description">
                Helpers with recorded activity
              </dd>
            </div>
            <div className="impact-kibble">
              <dt>
                <PawPrint aria-hidden="true" />
                <span>Kibble earned</span>
              </dt>
              <dd>{number(summary.kibbleEarned)}</dd>
              <dd className="recognition-impact-description">
                Non-cash community rewards
              </dd>
            </div>
            <div className="impact-contributions">
              <dt>
                <Check aria-hidden="true" />
                <span>Contributions</span>
              </dt>
              <dd>{number(summary.contributions)}</dd>
              <dd className="recognition-impact-description">
                Missions, sightings and campaign support
              </dd>
            </div>
            <div className="impact-animals">
              <dt>
                <Heart aria-hidden="true" />
                <span>Animals supported</span>
              </dt>
              <dd>{number(summary.animalsHelped)}</dd>
              <dd className="recognition-impact-description">
                Linked to approved missions
              </dd>
            </div>
          </dl>
        </section>
      )}
      <div className="recognition-controls">
        <nav aria-label="Leaderboard period" className="recognition-periods">
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
        <form
          key={`${period}:${category}:${q ?? ''}`}
          method="get"
          action="/leaderboard"
          className="recognition-filters"
        >
          <Input type="hidden" name="period" value={period} />
          <label>
            <span className="sr-only">Contribution category</span>
            <Select name="category" defaultValue={category}>
              {Object.entries(categories).map(([value, label]) => (
                <option key={value} value={value}>
                  {label}
                </option>
              ))}
            </Select>
          </label>
          <label className="recognition-search">
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
        </form>
      </div>
      <Podium entries={leaders} category={category} />
      <div className="recognition-results-heading">
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
            className="recognition-table-scroll"
            role="region"
            aria-label="Community helper rankings. Scroll horizontally for all contribution details."
            tabIndex={0}
          >
            <Table className="recognition-table">
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
                    <span className="recognition-kibble">
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
                      (entry.rank === 1 ? 'recognition-first ' : '') +
                      (entry.userId === session.actor?.id
                        ? 'recognition-you'
                        : '')
                    }
                  >
                    <TableCell>
                      <span className={'recognition-rank rank-' + entry.rank}>
                        {entry.rank <= 3 && (
                          <Crown size={16} aria-hidden="true" />
                        )}
                        <span className="sr-only">Rank </span>
                        {entry.rank}
                      </span>
                    </TableCell>
                    <TableHead scope="row">
                      <Link
                        href={'/users/' + encodeURIComponent(entry.username)}
                        className="recognition-person"
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
                              <span className="recognition-you-label">You</span>
                            )}
                          </strong>
                          <small>@{entry.username}</small>
                        </span>
                      </Link>
                    </TableHead>
                    <TableCell>
                      <div className="recognition-mastery">
                        <div>
                          <span
                            className="recognition-level"
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
                              max={entry.mastery.total}
                              value={entry.mastery.unlocked}
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
          <footer className="recognition-pagination">
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
        <section className="recognition-empty">
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
      <details className="recognition-method">
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
      <aside className="recognition-invitation">
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
