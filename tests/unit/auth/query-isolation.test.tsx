import { act, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { QueryClient } from '@tanstack/react-query'
import { Providers, scopedHydrationState } from '@/components/providers'
import { useSession, clearSessionCache } from '@/features/auth/session-provider'
import type { Session } from '@/features/auth/types'
import { createUnimplementedApi } from '@/lib/api/unimplemented'
const anonymous: Session = {
  actor: null,
  roles: [],
  demo: true,
  mode: 'mock',
  cacheScope: 'anonymous',
  expiresAt: null,
}
it('cancels outstanding requests and removes every private query and mutation on logout', async () => {
  const client = new QueryClient()
  client.setQueryData(['pawtrail', 'actor-one', 'applications'], {
    private: true,
  })
  client.getMutationCache().build(client, { mutationKey: ['private'] })
  await clearSessionCache(client)
  expect(client.getQueryCache().getAll()).toEqual([])
  expect(client.getMutationCache().getAll()).toEqual([])
})
it('does not hydrate records from another scope', () => {
  expect(
    scopedHydrationState(
      {
        mutations: [],
        queries: [{ queryKey: ['pawtrail', 'other', 'private'] }],
      } as never,
      'mine',
    )?.queries,
  ).toEqual([])
})
it('switches actor cache identity and logs out through the provider', async () => {
  const api = createUnimplementedApi()
  api.auth.selectDemoActor = vi.fn(async () => ({
    ...anonymous,
    cacheScope: 'actor-two',
    actor: {
      id: 'two',
      username: 'two',
      displayName: 'Two',
      roles: ['member'] as ['member'],
      shelterIds: [],
    },
    roles: ['member'] as ['member'],
  }))
  api.auth.logout = vi.fn(async () => undefined)
  api.auth.session = vi.fn(async () => anonymous)
  let actions: ReturnType<typeof useSession>
  function Child() {
    actions = useSession()
    return <p>{actions.session.cacheScope}</p>
  }
  render(
    <Providers initialSession={anonymous} api={api}>
      <Child />
    </Providers>,
  )
  await act(async () => {
    await actions.selectDemoActor('two')
  })
  expect(screen.getByText('actor-two')).toBeInTheDocument()
  await act(async () => {
    await actions.logout()
  })
  await waitFor(() => expect(actions.session.actor).toBeNull())
  expect(actions!.session.cacheScope).toMatch(/^anonymous:/)
  expect(actions!.session.cacheScope).not.toBe('anonymous')
  expect(api.auth.session).not.toHaveBeenCalled()
})
it('remounts query observers into the new actor client instead of retaining the old client', async () => {
  const { useQuery, useQueryClient } = await import('@tanstack/react-query')
  const clients = new Map<string, QueryClient>()
  const api = createUnimplementedApi()
  api.auth.selectDemoActor = async () => ({
    ...anonymous,
    cacheScope: 'next-scope',
  })
  let actions: ReturnType<typeof useSession>
  function PrivateQuery() {
    actions = useSession()
    const scope = actions.session.cacheScope
    clients.set(scope, useQueryClient())
    const result = useQuery({
      queryKey: ['pawtrail', scope, 'private'],
      queryFn: async () => `${scope}-record`,
    })
    return <p>{result.data}</p>
  }
  render(
    <Providers initialSession={anonymous} api={api}>
      <PrivateQuery />
    </Providers>,
  )
  await screen.findByText('anonymous-record')
  await act(async () => {
    await actions.selectDemoActor('two')
  })
  await screen.findByText('next-scope-record')
  expect(clients.get('anonymous')?.getQueryCache().getAll()).toEqual([])
  expect(
    clients
      .get('next-scope')
      ?.getQueryData(['pawtrail', 'next-scope', 'private']),
  ).toBe('next-scope-record')
  expect(clients.get('anonymous')).not.toBe(clients.get('next-scope'))
})
it('discards the signed-out actor and private observers even when session retrieval is unavailable', async () => {
  const { useQuery, useQueryClient } = await import('@tanstack/react-query')
  const signedIn: Session = {
    ...anonymous,
    cacheScope: 'actor-one',
    actor: {
      id: 'one',
      username: 'one',
      displayName: 'One',
      roles: ['member'],
      shelterIds: [],
    },
    roles: ['member'],
  }
  const api = createUnimplementedApi()
  api.auth.logout = vi.fn(async () => undefined)
  api.auth.session = vi.fn(async () => {
    throw new Error('Session retrieval unavailable')
  })
  const clients = new Map<string, QueryClient>()
  let actions: ReturnType<typeof useSession>
  function PrivateApplication() {
    actions = useSession()
    const { session } = actions
    clients.set(session.cacheScope, useQueryClient())
    const result = useQuery({
      queryKey: ['pawtrail', session.cacheScope, 'applications'],
      queryFn: async () => 'Private application answers',
      enabled: !!session.actor,
    })
    return <p>{result.data ?? 'No private application loaded'}</p>
  }
  render(
    <Providers initialSession={signedIn} api={api}>
      <PrivateApplication />
    </Providers>,
  )
  await screen.findByText('Private application answers')
  await act(async () => {
    await expect(actions.logout()).resolves.toBeUndefined()
  })
  expect(api.auth.logout).toHaveBeenCalledTimes(1)
  expect(api.auth.session).not.toHaveBeenCalled()
  expect(actions!.session).toMatchObject({
    actor: null,
    roles: [],
    mode: 'mock',
    demo: true,
    expiresAt: null,
  })
  expect(actions!.session.cacheScope).not.toBe('actor-one')
  expect(actions!.pending).toBe(false)
  expect(
    screen.queryByText('Private application answers'),
  ).not.toBeInTheDocument()
  expect(screen.getByText('No private application loaded')).toBeVisible()
  expect(clients.get('actor-one')?.getQueryCache().getAll()).toEqual([])
  expect(clients.get(actions!.session.cacheScope)).not.toBe(
    clients.get('actor-one'),
  )
})
