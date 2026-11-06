'use client'
import {
  createContext,
  useContext,
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
}
type PageNavigation = {
  pathname: string
  pending: boolean
  navigate: (href: string, options?: NavigationOptions) => void
}
const Context = createContext<PageNavigation | null>(null)

export function usePageNavigation() {
  return useContext(Context)
}

/** Select the destination and show page feedback before waiting for its route. */
export function PageNavigationProvider({ children }: { children: ReactNode }) {
  const router = useRouter()
  const pathname = usePathname()
  const [targetPath, setTargetPath] = useState(pathname)
  const [pending, startTransition] = useTransition()
  function navigate(href: string, options: NavigationOptions = {}) {
    const target = new URL(href, window.location.href)
    setTargetPath(options.activePath ?? target.pathname)
    const navigateRoute = () => {
      const routeOptions = {
        scroll: options.scroll,
        transitionTypes: options.transitionTypes,
      }
      if (options.replace) router.replace(href, routeOptions)
      else router.push(href, routeOptions)
    }
    // Same-page anchors and reselecting the current page need no loading screen.
    if (
      target.pathname === window.location.pathname &&
      target.search === window.location.search
    ) {
      navigateRoute()
      return
    }
    startTransition(navigateRoute)
  }
  return (
    <Context.Provider
      value={{ pathname: pending ? targetPath : pathname, pending, navigate }}
    >
      {children}
    </Context.Provider>
  )
}
