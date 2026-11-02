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
    <section className="profile-section">
      <h2>Community conversation</h2>
      <ReportDialog target={target} returnTo={path} />
      <Discussion
        target={target}
        returnTo={path}
        photoContext={[{ ref: target, title, href: path }]}
      />
    </section>
  )
}
