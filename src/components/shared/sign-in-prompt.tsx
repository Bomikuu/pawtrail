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
    <div className="sign-in-prompt">
      <div className="sign-in-prompt-placeholder" aria-hidden="true">
        <MessageCircle size={21} />
        <span>{placeholder}</span>
      </div>
      <div className="sign-in-prompt-action">
        <p>{description}</p>
        <ButtonLink href={href}>
          <LogIn size={17} aria-hidden="true" />
          {label}
        </ButtonLink>
      </div>
    </div>
  )
}
