import type { ReactNode } from 'react'
import { CaptureWorkspace } from '@/features/capture/workspace'
export const metadata = { title: 'Spot an animal · PawTrail', robots: { index: false, follow: false } }
export default function SpotLayout({ children }: { children: ReactNode }) { return <CaptureWorkspace>{children}</CaptureWorkspace> }
