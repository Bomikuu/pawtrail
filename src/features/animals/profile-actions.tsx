'use client'
import { useRef, useState } from 'react'
import { useRouter } from 'next/navigation'
import { useQuery, useQueryClient } from '@tanstack/react-query'
import { Bookmark, Share2 } from 'lucide-react'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'
import { getBrowserApi } from '@/lib/api/client'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import { toast } from '@/components/ui/sonner'
import { AnimalDestination } from './help-panel'
export function ProfileActions({
  id,
  slug,
  name,
  initialSaved,
  viewerScope,
  url,
  adoptable,
}: {
  id: string
  slug: string
  name: string
  initialSaved: boolean
  viewerScope: string
  url: string
  adoptable: boolean
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
    } catch (error) {
      if (!(error instanceof Error && error.name === 'AbortError'))
        setError(
          'Couldn’t share this link. Use the permanent profile link below.',
        )
    }
  }
  return (
    <div className="animal-action-bar" aria-label={`Actions for ${name}`}>
      <div className="profile-link-row">
        <AnimalDestination
          href={`/sightings/create?animalId=${encodeURIComponent(id)}`}
        >
          Add a sighting
        </AnimalDestination>
        <ButtonAnchor href="#help">Help {name}</ButtonAnchor>
        <Button onClick={share} variant="outline">
          <Share2 aria-hidden="true" size={18} />
          Share
        </Button>
        {session.actor ? (
          <Button
            onClick={save}
            variant="outline"
            aria-pressed={saved}
            disabled={
              pending ||
              changingSession ||
              savedState.isPending ||
              savedState.isError
            }
          >
            <Bookmark aria-hidden="true" size={18} />
            {pending
              ? 'Saving…'
              : savedState.isPending
                ? 'Loading saved state…'
                : saved
                  ? 'Saved'
                  : 'Save'}
          </Button>
        ) : (
          <ButtonLink
            href={loginPath(`/pets/${encodeURIComponent(slug)}`)}
            variant="outline"
          >
            Sign in to save
          </ButtonLink>
        )}
        {adoptable && (
          <AnimalDestination
            href={`/adopt/applications/new?animalId=${encodeURIComponent(id)}`}
          >
            Adopt
          </AnimalDestination>
        )}
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
      <a className="profile-permalink" href={url}>
        Permanent profile link
      </a>
    </div>
  )
}
