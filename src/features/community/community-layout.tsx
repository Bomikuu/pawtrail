import type { ReactNode } from 'react'

/** Matches the pet profile: an 800px feed, a 300px rail, and a 24px gap. */
export function CommunityLayout({
  children,
  rail,
  loading = false,
}: {
  children: ReactNode
  rail: ReactNode
  loading?: boolean
}) {
  return (
    <div
      className="community-layout mx-auto w-full min-w-0 max-w-[1124px] @container/community"
      data-page-loading={loading || undefined}
    >
      <div className="grid items-start gap-6 @min-[52rem]/community:grid-cols-[minmax(0,1fr)_minmax(15rem,18.75rem)]">
        <div className="community-journal mx-auto w-full min-w-0 max-w-[800px]">
          {children}
        </div>
        <aside
          className="community-rail grid min-w-0 gap-6 @min-[52rem]/community:sticky @min-[52rem]/community:top-22"
          aria-label="Animals to know"
        >
          {rail}
        </aside>
      </div>
    </div>
  )
}
