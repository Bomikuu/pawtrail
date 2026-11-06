'use client'
import { FollowButton } from '@/features/users/follow-button'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Share2, MoreHorizontal, MapPin } from 'lucide-react'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import {
  DropdownMenu,
  DropdownMenuTrigger,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
} from '@/components/ui/dropdown-menu'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { getBrowserApi } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { PetHelpDialog } from './help-dialog'
import { toast } from '@/components/ui/sonner'
export function ProfileActions({
  id,
  slug,
  name,
  initialSaved,
  viewerScope,
  url,
  adoptable,
  fundraiserId,
}: {
  id: string
  slug: string
  name: string
  initialSaved: boolean
  viewerScope: string
  url: string
  adoptable: boolean
  fundraiserId?: string
}) {
  const { session, pending: changingSession } = useSession()
  const [pending, setPending] = useState(false)
  const [error, setError] = useState('')
  const busy = useRef(false)
  const router = useRouter()
  const client = useQueryClient()
  const queryKey = ['animal-saved', session.cacheScope, id]
  const savedState = useQuery({
    queryKey,
    queryFn: async () => (await getBrowserApi().animals.get(slug)).viewerSaved,
    initialData: session.cacheScope === viewerScope ? initialSaved : undefined,
    enabled: !!session.actor,
    staleTime: Infinity,
  })
  const saved = savedState.data ?? false
  async function save() {
    if (busy.current) return
    busy.current = true
    const before = saved
    client.setQueryData(queryKey, !before)
    setPending(true)
    setError('')
    try {
      await getBrowserApi().animals.setSaved(id, !before)
      await client.invalidateQueries({ queryKey })
      router.refresh()
      toast.success(
        !before ? `${name} saved` : `${name} removed from saved animals`,
      )
    } catch {
      client.setQueryData(queryKey, before)
      setError('Couldn’t update saved animals. Please try again.')
    } finally {
      busy.current = false
      setPending(false)
    }
  }
  async function share() {
    try {
      if (navigator.share)
        await navigator.share({ title: `${name} — PawTrail`, url })
      else {
        await navigator.clipboard.writeText(url)
        toast.success('Profile link copied')
      }
      if (session.actor) {
        try {
          await getBrowserApi().achievements.record({
            kind: 'share',
            ref: { kind: 'animal', id },
          })
          await client.invalidateQueries()
        } catch {
          toast.error(
            'Link shared, but achievement progress could not sync. You can retry sharing.',
          )
        }
      }
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError'))
        setError(
          'Couldn’t share this link. Use the permanent profile link in More actions.',
        )
    }
  }
  return (
    <div className="animal-action-bar" aria-label={`Actions for ${name}`}>
      <div className="profile-link-row">
        <FollowButton
          target={{ kind: 'animal', id }}
          name={name}
          returnTo={'/pets/' + encodeURIComponent(slug)}
          compact
        />
        <PetHelpDialog
          id={id}
          slug={slug}
          name={name}
          adoptable={adoptable}
          fundraiserId={fundraiserId}
          onShare={share}
        />
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <Button variant="outline" aria-label={'More actions for ' + name}>
              <MoreHorizontal size={20} aria-hidden="true" />
            </Button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem asChild>
              <Link
                href={'/sightings/create?animalId=' + encodeURIComponent(id)}
              >
                <MapPin size={16} aria-hidden="true" />
                Add a sighting
              </Link>
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => void share()}>
              <Share2 size={16} aria-hidden="true" />
              Share profile
            </DropdownMenuItem>
            {session.actor ? (
              <DropdownMenuItem
                disabled={
                  pending ||
                  changingSession ||
                  savedState.isPending ||
                  savedState.isError
                }
                onSelect={() => void save()}
              >
                <Bookmark size={16} aria-hidden="true" />
                {pending
                  ? 'Saving…'
                  : saved
                    ? 'Remove from saved'
                    : 'Save animal'}
              </DropdownMenuItem>
            ) : (
              <DropdownMenuItem asChild>
                <Link href={loginPath('/pets/' + encodeURIComponent(slug))}>
                  Sign in to save
                </Link>
              </DropdownMenuItem>
            )}
            {adoptable && (
              <DropdownMenuItem asChild>
                <Link
                  href={
                    '/adopt/applications/new?animalId=' + encodeURIComponent(id)
                  }
                >
                  Ask about adoption
                </Link>
              </DropdownMenuItem>
            )}
            <DropdownMenuSeparator />
            <DropdownMenuItem asChild>
              <a href={url}>Permanent profile link</a>
            </DropdownMenuItem>
          </DropdownMenuContent>
        </DropdownMenu>
      </div>
      {savedState.isError && (
        <div>
          <p role="alert">Saved animals couldn’t load.</p>
          <Button variant="outline" onClick={() => void savedState.refetch()}>
            Retry saved animals
          </Button>
        </div>
      )}
      {error && <p role="alert">{error}</p>}
    </div>
  )
}
