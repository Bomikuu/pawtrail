import { LogIn, MessageCircle } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button-link'
export function SignInPrompt({
  href,
  label = 'Sign in to comment',
  description = 'Join the conversation with a kind observation or a useful update.',
  placeholder = 'Add a thoughtful comment…',
}: {
  href: string
  label?: string
  description?: string
  placeholder?: string
}) {
  return (
    <div
      className={
        'sign-in-prompt [border:1px_solid_var(--social-line)] rounded-[0.875rem] p-4 bg-card [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none]'
      }
    >
      <div
        className={
          'sign-in-prompt-placeholder flex items-center gap-3 p-3.5 [border:1px_solid_#e1d8cd] bg-[#faf7f2] rounded-xl text-sm text-muted-foreground [line-height:1.5] [&_>_svg]:shrink-0 [&_>_svg]:text-[#92745a] [.dark_.app-shell_&]:bg-[#1c1c1c] [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border'
        }
        aria-hidden="true"
      >
        <MessageCircle size={21} />
        <span>{placeholder}</span>
      </div>
      <div
        className={
          'sign-in-prompt-action flex flex-wrap items-center gap-3.5 pt-3.5 [&_>_p]:[flex:1_1_12rem] [&_>_p]:m-0 [&_>_p]:text-[0.8125rem] [&_>_p]:[line-height:1.5] [&_>_p]:text-muted-foreground [&_>_[data-slot=button]]:[flex:0_0_auto]'
        }
      >
        <p>{description}</p>
        <ButtonLink href={href}>
          <LogIn size={17} aria-hidden="true" />
          {label}
        </ButtonLink>
      </div>
    </div>
  )
}
