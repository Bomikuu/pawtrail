'use client'
import Link from 'next/link'
import type { ComponentProps } from 'react'
import { usePageNavigation } from './page-navigation'

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
        if (
          cancelled ||
          !navigation ||
          typeof href !== 'string' ||
          !href.startsWith('/') ||
          href.startsWith('//')
        )
          return
        event.preventDefault()
        navigation.navigate(href, {
          activePath,
          replace,
          scroll,
          transitionTypes,
        })
      }}
    />
  )
}
