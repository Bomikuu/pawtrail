import 'server-only'
import type { ReactNode } from 'react'
import { redirect } from 'next/navigation'
import { getServerApi } from '@/lib/api/server'
import { loginPath } from './return-path'
export async function RequireSession({
  children,
  returnTo,
}: {
  children: ReactNode
  returnTo: string
}) {
  const session = await (await getServerApi()).auth.session()
  if (!session.actor) redirect(loginPath(returnTo))
  return children
}
