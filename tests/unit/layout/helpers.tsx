import type { ReactNode } from 'react'
import { render } from '@testing-library/react'
import { Providers } from '@/components/providers'
import type { Session } from '@/features/auth/types'
export const member: Session = {
  actor: {
    id: 'sample-member',
    username: 'sample-helper',
    displayName: 'Sample Helper',
    roles: ['member'],
    shelterIds: [],
  },
  roles: ['member'],
  demo: true,
  mode: 'mock',
  cacheScope: 'layout-test',
  expiresAt: null,
}
export const guest: Session = {
  ...member,
  actor: null,
  roles: [],
  cacheScope: 'guest',
}
export function renderSession(children: ReactNode, session = member) {
  return render(<Providers initialSession={session}>{children}</Providers>)
}
