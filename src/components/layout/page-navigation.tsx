'use client'
import {
  createContext,
  useCallback,
  useContext,
  useMemo,
  useState,
  useTransition,
  type ReactNode,
} from 'react'
import { usePathname, useRouter } from 'next/navigation'

type NavigationOptions = {
  activePath?: string
  replace?: boolean
  scroll?: boolean
  transitionTypes?: string[]
  region?: string
}
type PageNavigation = {
  pathname: string
  pending: boolean
  region: string | null
  href: string | null
  navigate: (href: string, options?: NavigationOptions) => void
}
const Context = createContext<PageNavigation | null>(null)

export function usePageNavigation() {
  return useContext(Context)
}

/** Programmatic routes share the same immediate feedback as visible links. */
export function useAppRouter() {
  const router = useRouter()
  const navigation = usePageNavigation()
  const navigate = navigation?.navigate
  return useMemo(
    () => ({
      ...router,
      push: (href: string, options?: Parameters<typeof router.push>[1]) => {
        if (navigate) navigate(href, options)
        else router.push(href, options)
      },
      replace: (
        href: string,
        options?: Parameters<typeof router.replace>[1],
      ) => {
        if (navigate) navigate(href, { ...options, replace: true })
        else router.replace(href, options)
      },
    }),
    [router, navigate],
  )
}

/** Select the destination and show page feedback before waiting for its route. */
export function PageNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [targetPath, setTargetPath] = useState(pathname)
  const [targetHref, setTargetHref] = useState<string | null>(null)
  const [targetRegion, setTargetRegion] = useState<string | null>(null)
  const [pending, startTransition] = useTransition()
  const navigate = useCallback(
    (href: string, options: NavigationOptions = {}) => {
      const target = new URL(href, window.location.href)
      if (!['http:', 'https:'].includes(target.protocol)) return
      if (target.origin !== window.location.origin) {
        if (options.replace) window.location.replace(target.href)
        else window.location.assign(target.href)
        return
      }
      setTargetPath(options.activePath ?? target.pathname)
      setTargetHref(target.pathname + target.search + target.hash)
      setTargetRegion(
        target.pathname === window.location.pathname
          ? (options.region ?? null)
          : null,
      )
      const navigateRoute = () => {
        const routeOptions = {
          scroll: options.scroll,
          transitionTypes: options.transitionTypes,
        }
        if (options.replace) router.replace(href, routeOptions)
        else router.push(href, routeOptions)
      }
      // A different same-page anchor only scrolls. Identical URLs can refresh
      // server data in Next, so they still need immediate pending feedback.
      if (
        target.pathname === window.location.pathname &&
        target.search === window.location.search &&
        target.hash &&
        target.hash !== window.location.hash
      ) {
        navigateRoute()
        return
      }
      startTransition(navigateRoute)
    },
    [router],
  )
  const value = useMemo(
    () => ({
      pathname: pending ? targetPath : pathname,
      pending,
      navigate,
      region: pending ? targetRegion : null,
      href: pending ? targetHref : null,
    }),
    [pending, targetPath, pathname, navigate, targetRegion, targetHref],
  )
  return <Context.Provider value={value}>{children}</Context.Provider>
}
