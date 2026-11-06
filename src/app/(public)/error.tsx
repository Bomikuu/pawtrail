'use client'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
export default function ErrorPage({ retry }: { retry: () => void }) {
  const path = usePathname()
  return (
    <section
      className={
        'journal-empty [padding:3rem_1.5rem] text-center [border:1px_dashed_#c9bcb0] rounded-2xl [margin:1.5rem_0] flex flex-col items-center gap-4 [&_p]:max-w-[55ch] [&_p]:m-0 [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:bg-card [.app-shell_&]:[padding:1.75rem_1.25rem] [.app-shell_&]:gap-3.5 [.app-shell_&]:[margin:1rem_0_1.5rem] [&_>_img]:w-40 [&_>_img]:max-w-[65%] [&_>_img]:h-auto [.app-shell_.attention-panel_&]:[border:0] [.app-shell_.attention-panel_&]:[padding:0.5rem_0] [.app-shell_.attention-panel_&]:m-0 [.app-shell_.attention-panel_&]:bg-[transparent] [.app-shell_.attention-panel_&_>_img]:w-24'
      }
    >
      <h1>We couldn’t load this part of the story</h1>
      <p>
        Your saved work has not been cleared. Try again, or clear the current
        page filters.
      </p>
      <Button onClick={retry}>Try again</Button>
      <Link href={path}>Clear filters and return to the first page</Link>
      <Link href="/community">Back to community</Link>
    </section>
  )
}
