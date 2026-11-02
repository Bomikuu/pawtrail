import type { MoneyMinor } from '@/types/common'
import { formatMoneyMinor } from '@/lib/api/money'
export function formatPHP(amount: MoneyMinor): string {
  return formatMoneyMinor(amount)
}
export function Money({ amount }: { amount: MoneyMinor }) {
  return <span className="money">{formatPHP(amount)}</span>
}
