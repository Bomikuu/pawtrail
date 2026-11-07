import { PawPrint } from 'lucide-react'
import { NavigationLink } from '@/components/layout/navigation-link'
import { cn } from '@/lib/utils'

export function AuthBrand({ className }: { className?: string }) {
  return (
    <NavigationLink
      href="/"
      aria-label="PawTrail home"
      className={cn(
        'inline-flex w-fit items-center gap-2.5 rounded-md font-heading text-[1.75rem] font-bold leading-none tracking-tight text-foreground no-underline',
        className,
      )}
    >
      <PawPrint aria-hidden="true" className="size-9 fill-primary text-primary" />
      <span>
        Paw<span className="text-[#c65313] dark:text-primary">Trail</span>
      </span>
    </NavigationLink>
  )
}
