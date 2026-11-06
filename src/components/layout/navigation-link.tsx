'use client'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { usePageNavigation } from './page-navigation'
import { useNavigationScope } from './navigation-scope'

/** Keep native link behavior while making in-app page selection immediate. */
export function NavigationLink({
  href,
  activePath,
  onNavigate,
  replace,
  scroll,
  transitionTypes,
  ...props
}: ComponentProps<typeof Link> & { activePath?: string }) {
  const navigation = usePageNavigation()
  const scope = useNavigationScope()
  return (
    <Link
      {...props}
      href={href}
      replace={replace}
      scroll={scroll}
      transitionTypes={transitionTypes}
      onNavigate={(event) => {
        let cancelled = false
        onNavigate?.({
          preventDefault: () => {
            cancelled = true
            event.preventDefault()
          },
        })
        if (cancelled || !navigation || typeof href !== 'string') return
        const target = new URL(href, window.location.href)
        if (target.origin !== window.location.origin) return
        event.preventDefault()
        navigation.navigate(href, {
          activePath,
          replace,
          scroll,
          transitionTypes,
          region:
            scope?.pathname === target.pathname ? scope.region : undefined,
        })
      }}
    />
  )
}
