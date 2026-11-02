import { NotificationList } from '@/features/notifications/notification-list'
export default function NotificationsPage() {
  return (
    <section className="community-detail">
      <h1>Your activity</h1>
      <p>
        Updates from your PawTrail community. Notifications stay in this app.
      </p>
      <NotificationList />
    </section>
  )
}
