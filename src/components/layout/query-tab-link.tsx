'use client'
import type { ComponentProps } from 'react'
import { NavigationLink } from './navigation-link'
import { usePageNavigation } from './page-navigation'
export function QueryTabLink({
  queryParam,
  value,
  defaultValue,
  selected,
  retainParams = [],
  ...props
}: ComponentProps<typeof NavigationLink> & {
  queryParam: string
  value: string
  defaultValue: string
  selected: boolean
  retainParams?: string[]
}) {
  const navigation = usePageNavigation()
  let active = selected
  let href = props.href
  if (
    navigation?.pending &&
    navigation.href &&
    typeof props.href === 'string'
  ) {
    const target = new URL(navigation.href, 'https://pawtrail.invalid')
    const link = new URL(props.href, 'https://pawtrail.invalid')
    if (target.pathname === link.pathname) {
      active = (target.searchParams.get(queryParam) ?? defaultValue) === value
      for (const key of retainParams) {
        const requested = target.searchParams.get(key)
        if (key !== queryParam && requested !== null)
          link.searchParams.set(key, requested)
      }
      href = link.pathname + link.search + link.hash
    }
  }
  return (
    <NavigationLink
      {...props}
      href={href}
      scroll={props.scroll ?? false}
      aria-current={active ? 'page' : undefined}
    />
  )
}
