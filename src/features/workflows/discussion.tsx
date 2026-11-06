import { Discussion } from '@/features/community/discussion'
import { ReportDialog } from '@/features/community/report-dialog'
import type { ResourceRef } from '@/types/common'
export function ResourceDiscussion({
  target,
  title,
  path,
}: {
  target: ResourceRef
  title: string
  path: string
}) {
  return (
    <section
      className={
        'profile-section py-8 [border-bottom:1px_solid_var(--border)] [scroll-margin-top:6rem] [&_h2]:mb-3 [&_>_p]:max-w-[70ch] [&_>_p]:[white-space:pre-line] [&_>_p]:[overflow-wrap:anywhere] [.dark_.app-shell_&]:bg-card [.dark_.app-shell_&]:text-foreground [.dark_.app-shell_&]:border-border [.dark_.app-shell_&]:[box-shadow:none] [.pet-social-profile_&]:max-w-none [.pet-social-profile_&_>_h2]:font-[850] [.pet-social-profile_&_>_h2]:text-xl [.pet-social-profile_&_>_h2]:leading-[1.35] [.pet-social-profile_&_>_h2]:font-heading [.pet-social-profile_&_>_p]:text-sm'
      }
    >
      <h2>Community conversation</h2>
      <ReportDialog target={target} returnTo={path} />
      <Discussion
        composerFirst
        allowPhotos={['animal', 'horde', 'fundraiser', 'mission'].includes(
          target.kind,
        )}
        target={target}
        returnTo={path}
        photoContext={[{ ref: target, title, href: path }]}
      />
    </section>
  )
}
