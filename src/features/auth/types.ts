import type { z } from 'zod'
import type * as schemas from './schemas'
export type Actor = z.infer<typeof schemas.actorSchema>
export type Session = z.infer<typeof schemas.sessionSchema>
export type LoginInput = z.infer<typeof schemas.loginInputSchema>
export type RegisterInput = z.infer<typeof schemas.registerInputSchema>
