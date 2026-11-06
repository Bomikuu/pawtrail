'use client'
import {
  HandHeart,
  Heart,
  House,
  MapPin,
  MessageCircle,
  Share2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { ButtonLink } from '@/components/ui/button-link'
import { ButtonAnchor } from '@/components/ui/button-anchor'
import {
  Dialog,
  DialogTrigger,
  DialogContent,
  DialogTitle,
  DialogDescription,
  DialogClose,
} from '@/components/ui/dialog'
import { useSession } from '@/features/auth/session-provider'
import { loginPath } from '@/features/auth/return-path'

export function PetHelpDialog({
  id,
  slug,
  name,
  adoptable,
  fundraiserId,
  onShare,
}: {
  id: string
  slug: string
  name: string
  adoptable: boolean
  fundraiserId?: string
  onShare: () => Promise<void>
}) {
  const { session } = useSession()
  const path = '/pets/' + encodeURIComponent(slug)
  const sighting = '/sightings/create?animalId=' + encodeURIComponent(id)
  const adoption = '/adopt/applications/new?animalId=' + encodeURIComponent(id)
  const actions = [
    {
      title: 'Explore care requests',
      description: `Find missions, care updates, and community support connected to ${name}.`,
      icon: HandHeart,
      href: path + '?tab=activity&kind=help#pet-activity',
    },
    {
      title: session.actor ? 'Add a sighting' : 'Sign in to add a sighting',
      description: `Seen ${name} recently? Share an observation with the community.`,
      icon: MapPin,
      href: session.actor ? sighting : loginPath(sighting),
    },
    ...(fundraiserId
      ? [
          {
            title: 'View a care fundraiser',
            description:
              'Read the campaign story, goal, and updates before choosing to help.',
            icon: Heart,
            href: '/fundraisers/' + encodeURIComponent(fundraiserId),
          },
        ]
      : []),
    ...(adoptable
      ? [
          {
            title: 'Ask about adoption',
            description: `Learn whether you and ${name} could be a good match.`,
            icon: House,
            href: session.actor ? adoption : loginPath(adoption),
          },
        ]
      : []),
  ]
  return (
    <Dialog>
      <DialogTrigger asChild>
        <Button>
          <Heart size={18} aria-hidden="true" />
          Help {name}
        </Button>
      </DialogTrigger>
      <DialogContent
        className="pet-help-dialog"
        closeLabel={'Close ways to help ' + name}
      >
        <span className="pet-help-mark">
          <HandHeart size={26} aria-hidden="true" />
        </span>
        <DialogTitle>How would you like to help {name}?</DialogTitle>
        <DialogDescription>
          Small acts of care start here. Choose a way to take part.
        </DialogDescription>
        <div className="pet-help-options">
          {actions.map(({ title, description, icon: Icon, href }) => (
            <DialogClose asChild key={title}>
              <ButtonLink
                variant="ghost"
                className="pet-help-option"
                href={href}
              >
                <Icon size={22} aria-hidden="true" />
                <span>
                  <strong>{title}</strong>
                  <small>{description}</small>
                </span>
              </ButtonLink>
            </DialogClose>
          ))}
          <DialogClose asChild>
            <ButtonAnchor
              variant="ghost"
              className="pet-help-option"
              href="#discussion"
            >
              <MessageCircle size={22} aria-hidden="true" />
              <span>
                <strong>
                  {session.actor
                    ? 'Join the conversation'
                    : 'See the conversation'}
                </strong>
                <small>
                  Share a useful detail, ask a question, or leave a kind word.
                </small>
              </span>
            </ButtonAnchor>
          </DialogClose>
          <DialogClose asChild>
            <Button
              variant="ghost"
              className="pet-help-option"
              onClick={() => void onShare()}
            >
              <Share2 size={22} aria-hidden="true" />
              <span>
                <strong>Share {name}’s story</strong>
                <small>
                  Help the right person discover this pet’s profile.
                </small>
              </span>
            </Button>
          </DialogClose>
        </div>
      </DialogContent>
    </Dialog>
  )
}
