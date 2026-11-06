import { NavigationContent } from '@/components/layout/navigation-content'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
export default function NotFound() {
  return (
    <main
      className={
        'journal-empty [padding:3rem_1.5rem] text-center [border:1px_dashed_#c9bcb0] rounded-2xl [margin:1.5rem_0] flex flex-col items-center gap-4 [&_p]:max-w-[55ch] [&_p]:m-0 [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:bg-card [.app-shell_&]:[padding:1.75rem_1.25rem] [.app-shell_&]:gap-3.5 [.app-shell_&]:[margin:1rem_0_1.5rem] [&_>_img]:w-40 [&_>_img]:max-w-[65%] [&_>_img]:h-auto [.app-shell_.attention-panel_&]:[border:0] [.app-shell_.attention-panel_&]:[padding:0.5rem_0] [.app-shell_.attention-panel_&]:m-0 [.app-shell_.attention-panel_&]:bg-[transparent] [.app-shell_.attention-panel_&_>_img]:w-24'
      }
    >
      <NavigationContent>
        <img
          src="/images/pawtrail/not-found.webp"
          className={
            'empty-illustration block w-[min(11rem,_65%)] h-auto [margin:0_0_1.25rem] [mix-blend-mode:multiply] [.app-shell_.data-state_&]:block [.app-shell_.data-state_&]:w-40 [.app-shell_.data-state_&]:max-w-[70%] [.app-shell_.data-state_&]:h-auto [.app-shell_.data-state_&]:[margin:0_auto_1rem]'
          }
          width={242}
          height={128}
          alt=""
        />
        <h1>This trail doesn’t lead to a public story</h1>
        <p>The record may have moved, been withdrawn, or be awaiting review.</p>
        <Link href="/community">Return to the community</Link>
      </NavigationContent>
    </main>
  )
}
