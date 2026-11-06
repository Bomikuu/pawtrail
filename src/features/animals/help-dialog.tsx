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
        className={
          'pet-help-dialog max-w-[min(32rem,_calc(100vw_-_2rem))] max-h-[85dvh] overflow-y-auto [&_[data-slot=dialog-title]]:pr-8 [&_[data-slot=dialog-title]]:text-2xl [&_[data-slot=dialog-title]]:[line-height:1.25]'
        }
      >
        <span
          className={
            'pet-help-mark inline-grid [place-items:center] w-12 h-12 rounded-[0.875rem] text-[#a64712] bg-[#fff0df] mb-3.5'
          }
        >
          <HandHeart size={26} aria-hidden="true" />
        </span>
        <DialogTitle>How would you like to help {name}?</DialogTitle>
        <DialogDescription>
          Small acts of care start here. Choose a way to take part.
        </DialogDescription>
        <div className={'pet-help-options grid gap-1 mt-4'}>
          {actions.map(({ title, description, icon: Icon, href }) => (
            <DialogClose asChild key={title}>
              <ButtonLink
                variant="ghost"
                className={
                  'pet-help-option [.dark_&_small]:text-muted-foreground [[data-slot=dialog-content]_&]:grid [[data-slot=dialog-content]_&]:grid-cols-[1.5rem_minmax(0,_1fr)] [[data-slot=dialog-content]_&]:items-start [[data-slot=dialog-content]_&]:gap-3.5 [[data-slot=dialog-content]_&]:justify-start [[data-slot=dialog-content]_&]:text-left [[data-slot=dialog-content]_&]:w-full [[data-slot=dialog-content]_&]:p-3.5 [[data-slot=dialog-content]_&]:min-h-17 [[data-slot=dialog-content]_&]:whitespace-normal [&_>_svg]:text-[color:var(--teal)] [&_>_svg]:mt-0.5 [&_>_span]:grid [&_>_span]:gap-[0.3rem] [&_strong]:font-bold [&_strong]:text-sm [&_small]:text-xs [&_small]:[line-height:1.5] [&_small]:text-muted-foreground [&_small]:font-normal'
                }
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
              className={
                'pet-help-option [.dark_&_small]:text-muted-foreground [[data-slot=dialog-content]_&]:grid [[data-slot=dialog-content]_&]:grid-cols-[1.5rem_minmax(0,_1fr)] [[data-slot=dialog-content]_&]:items-start [[data-slot=dialog-content]_&]:gap-3.5 [[data-slot=dialog-content]_&]:justify-start [[data-slot=dialog-content]_&]:text-left [[data-slot=dialog-content]_&]:w-full [[data-slot=dialog-content]_&]:p-3.5 [[data-slot=dialog-content]_&]:min-h-17 [[data-slot=dialog-content]_&]:whitespace-normal [&_>_svg]:text-[color:var(--teal)] [&_>_svg]:mt-0.5 [&_>_span]:grid [&_>_span]:gap-[0.3rem] [&_strong]:font-bold [&_strong]:text-sm [&_small]:text-xs [&_small]:[line-height:1.5] [&_small]:text-muted-foreground [&_small]:font-normal'
              }
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
              className={
                'pet-help-option [.dark_&_small]:text-muted-foreground [[data-slot=dialog-content]_&]:grid [[data-slot=dialog-content]_&]:grid-cols-[1.5rem_minmax(0,_1fr)] [[data-slot=dialog-content]_&]:items-start [[data-slot=dialog-content]_&]:gap-3.5 [[data-slot=dialog-content]_&]:justify-start [[data-slot=dialog-content]_&]:text-left [[data-slot=dialog-content]_&]:w-full [[data-slot=dialog-content]_&]:p-3.5 [[data-slot=dialog-content]_&]:min-h-17 [[data-slot=dialog-content]_&]:whitespace-normal [&_>_svg]:text-[color:var(--teal)] [&_>_svg]:mt-0.5 [&_>_span]:grid [&_>_span]:gap-[0.3rem] [&_strong]:font-bold [&_strong]:text-sm [&_small]:text-xs [&_small]:[line-height:1.5] [&_small]:text-muted-foreground [&_small]:font-normal'
              }
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
