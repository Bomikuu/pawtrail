import type { ReactNode } from 'react'
import { RequireSession } from '@/features/auth/require-session'
export const dynamic = 'force-dynamic'
export const metadata = { robots: { index: false, follow: false } }
export default function DashboardLayout({ children }: { children: ReactNode }) {
  return <RequireSession returnTo="/dashboard">{children}</RequireSession>
}
