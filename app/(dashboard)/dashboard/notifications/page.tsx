import { listNotifications, getNotificationStats, listNotificationTemplates } from '@/app/actions/notifications'
import { NotificationsClient } from './_components/notifications-client'

export default async function NotificationsPage() {
  const [notifResult, statsResult, templatesResult] = await Promise.all([
    listNotifications({}),
    getNotificationStats(),
    listNotificationTemplates(),
  ])

  return (
    <NotificationsClient
      initialNotifications={notifResult.ok ? notifResult.data : []}
      initialStats={statsResult.ok ? statsResult.data : null}
      initialTemplates={templatesResult.ok ? templatesResult.data : []}
    />
  )
}
