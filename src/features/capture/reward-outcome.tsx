import { Cookie, RotateCcw } from 'lucide-react'
import { ButtonLink } from '@/components/ui/button-link'
import type { ObservationReceipt } from './schemas'

export function RewardOutcome({ receipt, compact = false }: {
  receipt: Pick<ObservationReceipt, 'rewardStatus' | 'rewardAmount' | 'rewardReason'>
  compact?: boolean
}) {
  return <div className={'space-y-1 text-sm ' + (compact ? '' : 'rounded-xl bg-accent p-4')}>
    <p className="flex items-center gap-2 font-semibold">
      {receipt.rewardStatus === 'reversed' ? <RotateCcw className="size-4 shrink-0" /> : <Cookie className="size-4 shrink-0 text-primary" />}
      {receipt.rewardAmount > 0 ? '+' + receipt.rewardAmount + ' real Kibble earned' : receipt.rewardStatus === 'reversed' ? 'Kibble credit reversed' : receipt.rewardStatus === 'pending_review' ? 'Kibble awaits accepted evidence' : 'No sighting Kibble credited'}
    </p>
    {!compact && <><p className="leading-relaxed text-muted-foreground">{receipt.rewardReason}</p><ButtonLink href="/spot/kibble" variant="link" className="h-auto px-0">View real Kibble history</ButtonLink></>}
  </div>
}
