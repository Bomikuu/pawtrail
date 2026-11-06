'use client'
import { useState } from 'react'
import { UploadField } from '@/features/media/upload-field'
import type { MediaAsset } from '@/features/media/types'
export function ShelterEvidence({ shelterId }: { shelterId: string }) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  return (
    <section
      className={
        'workflow-panel [padding:1.5rem_0] [border-top:1px_solid_#ede5d8] [margin:1.5rem_0] [&_h2]:mt-0 [&_h3]:mt-0 [.app-shell_&]:min-w-0 [.app-shell_&]:bg-card [.app-shell_&]:[border:1px_solid_var(--social-line)] [.app-shell_&]:rounded-2xl [.app-shell_&]:[overflow-wrap:anywhere] [.app-shell_&]:p-5 [.app-shell_&]:[margin:0_0_1rem] [.management-shell_&]:border-border [.management-shell_&_>_h3]:mt-4 [.management-shell_&_>_h2]:mt-4 max-[48rem]:[.app-shell_&]:p-4'
      }
    >
      <h3>Submit organization verification evidence</h3>
      <p>
        These documents are attached to this shelter, remain private, and
        require an independent moderator. Your own staff cannot verify the
        organization. A demo review never represents real-world accreditation.
      </p>
      <UploadField
        purpose="private_evidence"
        shelterId={shelterId}
        verificationShelterId={shelterId}
        value={assets}
        onChange={setAssets}
      />
      {assets.length > 0 && (
        <p role="status">
          Evidence submitted to the independent verification queue.
        </p>
      )}
    </section>
  )
}
