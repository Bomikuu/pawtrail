import { ApiError } from './errors'
import { moneySchema } from './schemas'
import { parseInput } from './validation'
export const DONATION_PRESETS_MINOR = [10000, 25000, 50000, 100000] as const
export function parseMoneyMinor(input: string): number {
  if (!/^\d+(\.\d{1,2})?$/.test(input))
    throw new ApiError(
      'VALIDATION_ERROR',
      'Use a nonnegative amount with at most two decimal places',
      400,
    )
  const [whole, fraction = ''] = input.split('.')
  const amount = BigInt(whole) * 100n + BigInt(fraction.padEnd(2, '0'))
  return parseInput(moneySchema, Number(amount))
}
export function formatMoneyMinor(value: number): string {
  return new Intl.NumberFormat('en-PH', {
    style: 'currency',
    currency: 'PHP',
  }).format(parseInput(moneySchema, value) / 100)
}
