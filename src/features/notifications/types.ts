import type { z } from 'zod'
import type * as schemas from './schemas'
export type Notification = z.infer<typeof schemas.notificationViewSchema>

/** Trusted domain producer input, using the domain's existing serialized draft. */
export interface NotificationInput {
  draft: import('@/lib/server/demo/transactions').DemoDraft
  recipientId: string
  kind: Notification['kind']
  ref: import('@/types/common').ResourceRef | null
  now: string
}
