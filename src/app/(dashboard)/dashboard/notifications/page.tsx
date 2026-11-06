import { NotificationList } from '@/features/notifications/notification-list'
export default function NotificationsPage() {
  return (
    <section
      className={
        'community-detail max-w-184 [margin:0_auto] [&_>_h1]:[margin:1rem_0_1.5rem] [.management-shell_&]:max-w-none [.management-shell_&]:w-full'
      }
    >
      <h1>Your activity</h1>
      <p>
        Updates from your PawTrail community. Notifications stay in this app.
      </p>
      <NotificationList />
    </section>
  )
}
