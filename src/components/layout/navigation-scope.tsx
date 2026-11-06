'use client'
import { createContext, useContext, type ReactNode } from 'react'
const Context = createContext<{ pathname: string; region: string } | null>(null)
export function NavigationScope({
  pathname,
  region,
  children,
}: {
  pathname: string
  region: string
  children: ReactNode
}) {
  return (
    <Context.Provider value={{ pathname, region }}>{children}</Context.Provider>
  )
}
export function useNavigationScope() {
  return useContext(Context)
}
