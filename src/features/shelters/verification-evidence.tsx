'use client'
import { useState } from 'react'
import { UploadField } from '@/features/media/upload-field'
import type { MediaAsset } from '@/features/media/types'
export function ShelterEvidence({ shelterId }: { shelterId: string }) {
  const [assets, setAssets] = useState<MediaAsset[]>([])
  return (
    <section className="workflow-panel">
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
