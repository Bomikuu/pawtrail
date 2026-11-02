import type { z } from 'zod'
import type * as schemas from './schemas'
export type Notification = z.infer<typeof schemas.notificationSchema>
