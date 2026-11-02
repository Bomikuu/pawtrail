import { useState } from 'react'
import { fireEvent, render, screen, waitFor } from '@testing-library/react'
import { expect, it, vi } from 'vitest'
import { UploadField } from '@/features/media/upload-field'
import { AnimalImage } from '@/components/shared/animal-image'
import type { MediaAsset } from '@/features/media/types'

it('creates and revokes preview URLs on removal and unmount', () => {
  const created: string[] = [],
    revoked: string[] = []
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL() {
        const url = `blob:sample-${created.length}`
        created.push(url)
        return url
      }
      static revokeObjectURL(url: string) {
        revoked.push(url)
      }
    },
  )
  const { unmount } = render(<UploadField value={[]} onChange={() => {}} />)
  fireEvent.change(screen.getByLabelText('Attachments'), {
    target: {
      files: [
        new File(['sample'], 'cat.png', { type: 'image/png' }),
        new File(['sample'], 'dog.png', { type: 'image/png' }),
      ],
    },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Remove cat.png' }))
  expect(revoked).toEqual([created[0]])
  unmount()
  expect(revoked).toEqual(created)
})
it('preserves selection and descriptions after failure so the form can retry', async () => {
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL() {
        return 'blob:sample'
      }
      static revokeObjectURL() {}
    },
  )
  const upload = vi
    .fn()
    .mockRejectedValueOnce(new Error('Upload unavailable'))
    .mockResolvedValueOnce({
      id: 'asset-1',
      url: '/api/v1/media/asset-1/content',
      alt: 'Cat beside a tree',
      visibility: 'private',
      mimeType: 'image/png',
      bytes: 6,
    })
  const remove = vi.fn()
  function Form() {
    const [value, setValue] = useState<MediaAsset[]>([])
    return (
      <>
        <p>Story draft remains</p>
        <UploadField
          value={value}
          onChange={setValue}
          api={{ upload, remove }}
        />
      </>
    )
  }
  render(<Form />)
  fireEvent.change(screen.getByLabelText('Attachments'), {
    target: { files: [new File(['sample'], 'cat.png', { type: 'image/png' })] },
  })
  fireEvent.change(screen.getByLabelText('Description for cat.png'), {
    target: { value: 'Cat beside a tree' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Upload attachments' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Upload unavailable',
  )
  expect(screen.getByLabelText('Description for cat.png')).toHaveValue(
    'Cat beside a tree',
  )
  expect(screen.getByText('Story draft remains')).toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Upload attachments' }))
  await waitFor(() => expect(upload).toHaveBeenCalledTimes(2))
  expect(await screen.findByText('Uploaded privately')).toBeInTheDocument()
})
it('rejects seven files and never embeds PDF/private download URLs in the animal image', () => {
  render(<UploadField value={[]} onChange={() => {}} />)
  fireEvent.change(screen.getByLabelText('Attachments'), {
    target: {
      files: Array.from(
        { length: 7 },
        (_, i) => new File(['sample'], `${i}.png`, { type: 'image/png' }),
      ),
    },
  })
  expect(screen.getByRole('alert')).toHaveTextContent('six')
  const { rerender } = render(
    <AnimalImage
      image={{
        url: '/api/v1/media/private/content',
        alt: 'Private evidence',
        mimeType: 'application/pdf',
        visibility: 'private',
      }}
    />,
  )
  expect(
    screen.queryByRole('img', { name: 'Private evidence' }),
  ).not.toBeInTheDocument()
  rerender(
    <AnimalImage image={{ url: '/sample-cat.jpg', alt: 'A sample cat' }} />,
  )
  fireEvent.error(screen.getByRole('img', { name: 'A sample cat' }))
  expect(
    screen.getByRole('img', { name: 'A sample cat — photograph unavailable' }),
  ).toBeInTheDocument()
})

it('labels private PDF evidence without an object URL and gates sensitive public photos', () => {
  const objectUrl = vi.fn()
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL = objectUrl
      static revokeObjectURL() {}
    },
  )
  render(
    <UploadField value={[]} onChange={() => {}} purpose="private_evidence" />,
  )
  fireEvent.change(screen.getByLabelText('Attachments'), {
    target: {
      files: [
        new File(['sample'], 'evidence.pdf', { type: 'application/pdf' }),
      ],
    },
  })
  expect(screen.getByText('evidence.pdf')).toBeInTheDocument()
  expect(objectUrl).not.toHaveBeenCalled()
  render(
    <AnimalImage
      image={{ url: '/sample-cat.jpg', alt: 'A sample cat', sensitive: true }}
    />,
  )
  expect(
    screen.queryByRole('img', { name: 'A sample cat' }),
  ).not.toBeInTheDocument()
  fireEvent.click(screen.getByRole('button', { name: 'Show photograph' }))
  expect(screen.getByRole('img', { name: 'A sample cat' })).toBeInTheDocument()
})

it('preserves an expired selection and renews its upload key for a successful retry', async () => {
  const { ApiError } = await import('@/lib/api/errors')
  vi.stubGlobal(
    'URL',
    class extends URL {
      static createObjectURL() {
        return 'blob:sample'
      }
      static revokeObjectURL() {}
    },
  )
  const upload = vi
    .fn()
    .mockRejectedValueOnce(
      new ApiError(
        'UPLOAD_EXPIRED',
        'This upload is no longer available. Upload the file again.',
        410,
      ),
    )
    .mockResolvedValueOnce({
      id: 'replacement',
      url: '/api/v1/media/replacement/content',
      alt: 'A sample cat',
      visibility: 'private',
      mimeType: 'image/png',
      bytes: 6,
    })
  function Form() {
    const [value, setValue] = useState<MediaAsset[]>([])
    return (
      <UploadField
        value={value}
        onChange={setValue}
        api={{ upload, remove: vi.fn() }}
      />
    )
  }
  render(<Form />)
  fireEvent.change(screen.getByLabelText('Attachments'), {
    target: { files: [new File(['sample'], 'cat.png', { type: 'image/png' })] },
  })
  fireEvent.change(screen.getByLabelText('Description for cat.png'), {
    target: { value: 'A sample cat' },
  })
  fireEvent.click(screen.getByRole('button', { name: 'Upload attachments' }))
  expect(await screen.findByRole('alert')).toHaveTextContent(
    'Upload the file again',
  )
  expect(screen.getByLabelText('Description for cat.png')).toHaveValue(
    'A sample cat',
  )
  fireEvent.click(screen.getByRole('button', { name: 'Upload attachments' }))
  expect(await screen.findByText('Uploaded privately')).toBeInTheDocument()
  expect(upload.mock.calls[1][1].idempotencyKey).not.toBe(
    upload.mock.calls[0][1].idempotencyKey,
  )
})
