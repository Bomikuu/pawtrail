import type { z } from 'zod'
import type * as schemas from './schemas'
export type KibbleEntry = z.infer<typeof schemas.kibbleEntrySchema>
export type KibbleWallet = z.infer<typeof schemas.kibbleWalletSchema>
export type LeaderboardEntry = z.infer<typeof schemas.leaderboardEntrySchema>
