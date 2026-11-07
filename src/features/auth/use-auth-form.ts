'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { useAppRouter } from '@/components/layout/page-navigation'
import { avatarPresets } from '@/features/users/avatar-presets'
import { ApiError } from '@/lib/api/errors'
import { loginInputSchema, registerInputSchema } from './schemas'
import type { RegisterInput } from './types'
import { useSession } from './session-provider'
import { validateReturnPath } from './return-path'

export function useAuthForm(kind: 'login' | 'register', returnTo: string | null) {
  const session = useSession()
  const router = useAppRouter()
  const [message, setMessage] = useState('')
  const registration = kind === 'register'
  const schema = registration
    ? registerInputSchema
    : loginInputSchema.extend({
        username: registerInputSchema.shape.username.optional(),
        displayName: registerInputSchema.shape.displayName.optional(),
        avatarId: registerInputSchema.shape.avatarId,
      })
  const form = useForm<{
    email: string
    password: string
    username?: string
    displayName?: string
    avatarId?: string
  }>({
    resolver: zodResolver(schema),
    defaultValues: registration ? { avatarId: avatarPresets[0].id } : undefined,
  })
  const destination = validateReturnPath(returnTo)

  async function perform(operation: () => Promise<unknown>) {
    setMessage('')
    try {
      await operation()
      router.replace(destination)
      router.refresh()
    } catch (error) {
      if (error instanceof ApiError) {
        for (const [field, messages] of Object.entries(error.fieldErrors ?? {}))
          if (['email', 'password', 'username', 'displayName', 'avatarId'].includes(field))
            form.setError(
              field as keyof RegisterInput,
              { message: messages[0] },
              { shouldFocus: true },
            )
        setMessage(error.message)
      } else {
        setMessage('Unable to connect. Try again when your connection returns.')
      }
    }
  }

  return { session, form, message, destination, perform }
}
