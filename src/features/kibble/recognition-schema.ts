import { z } from 'zod'

/** Null is unranked or private; the public crown is limited to the current all-time top ten. */
export const leaderboardRankSchema = z
  .number()
  .int()
  .min(1)
  .max(10)
  .nullable()
  .default(null)
