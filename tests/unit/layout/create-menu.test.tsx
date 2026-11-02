import { screen, waitFor } from '@testing-library/react'
import userEvent from '@testing-library/user-event'
import { expect, it } from 'vitest'
import { CreateMenu } from '@/components/layout/create-menu'
import { renderSession, guest } from './helpers'
const actions = [
  ['Report Animal', '/animals/report'],
  ['Create Sighting', '/sightings/create'],
  ['Start Fundraiser', '/fundraisers/create'],
  ['Create Community Post', '/community/create'],
  ['Create Quest', '/missions/create'],
]
const ready = new Set(actions.map(([, href]) => href))
it('operates Create with Enter, arrow keys, Escape and focus restoration; all actions map to inventory', async () => {
  const user = userEvent.setup()
  renderSession(<CreateMenu readyRoutes={ready} />)
  const trigger = screen.getByRole('button', { name: 'Create' })
  trigger.focus()
  await user.keyboard('{Enter}')
  for (const [label, href] of actions)
    expect(screen.getByRole('menuitem', { name: label })).toHaveAttribute(
      'href',
      href,
    )
  await waitFor(() =>
    expect(
      screen.getByRole('menuitem', { name: 'Report Animal' }),
    ).toHaveFocus(),
  )
  await user.keyboard('{ArrowDown}')
  expect(
    screen.getByRole('menuitem', { name: 'Create Sighting' }),
  ).toHaveFocus()
  await user.keyboard('{Escape}')
  await waitFor(() => expect(trigger).toHaveFocus())
})
it('redirects anonymous create actions to sign-in with their intended route', async () => {
  const user = userEvent.setup()
  renderSession(<CreateMenu readyRoutes={ready} />, guest)
  await user.click(screen.getByRole('button', { name: 'Create' }))
  for (const [label, href] of actions)
    expect(screen.getByRole('menuitem', { name: label })).toHaveAttribute(
      'href',
      `/login?returnTo=${encodeURIComponent(href)}`,
    )
})
it('announces unfinished actions and never offers them as links', async () => {
  const user = userEvent.setup()
  renderSession(<CreateMenu />)
  await user.click(screen.getByRole('button', { name: 'Create' }))
  for (const [label] of actions) {
    const item = screen.getByRole('menuitem', {
      name: `${label} — Coming soon`,
    })
    expect(item).toHaveAttribute('aria-disabled', 'true')
    expect(item).not.toHaveAttribute('href')
  }
})
