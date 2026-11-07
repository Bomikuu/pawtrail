import { Badge } from '@/components/ui/badge'
import type { ReactNode } from 'react'
export function StatusBadge({
  tone = 'neutral',
  children,
}: {
  tone?: 'neutral' | 'success' | 'warning' | 'error'
  children: ReactNode
}) {
  return (
    <Badge
      variant="outline"
      className={`status-badge max-w-full shrink whitespace-normal break-words text-left leading-relaxed inline-flex items-center gap-1.5 rounded-[0.375rem] [padding:0.125rem_0.5rem] text-[0.8125rem] font-semibold text-foreground bg-border [&.status-success]:bg-[var(--teal)] [&.status-success]:text-card [&.status-warning]:bg-[var(--primary)] [&.status-warning]:text-primary-foreground [&.status-error]:bg-foreground [&.status-error]:text-card [.post-heading_&]:max-w-40 [.profile-main-identity_>_&]:text-[0.6875rem] max-[48rem]:[.profile-main-identity_>_&]:text-[0.625rem] [.pet-name-line_>_&]:bg-[#ffe9ca] [.pet-name-line_>_&]:text-[#6e3b13] [.pet-name-line_>_&]:text-[0.8125rem] [.pet-verification_&]:text-[0.625rem] [.pet-record-labels_&]:text-[0.625rem] max-[48rem]:[.pet-name-line_>_&]:text-[0.6875rem] [.event-title-tools_>_&]:inline-flex [.event-title-tools_>_&]:items-center [.event-title-tools_>_&]:gap-2 [.event-title-tools_>_&]:bg-[#ffead7] [.event-title-tools_>_&]:text-[#8c390f] [.event-title-tools_>_&]:[border:0] [.event-title-tools_>_&]:rounded-[2rem] [.event-title-tools_>_&]:[padding:0.375rem_0.75rem] status-${tone}`}
    >
      {children}
    </Badge>
  )
}
