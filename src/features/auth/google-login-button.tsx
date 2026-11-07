'use client'

import { useEffect, useRef, useState } from 'react'
import Script from 'next/script'
import { LoadingButton } from '@/components/shared/loading-button'
import type { GoogleLoginInput } from './types'

interface GoogleCodeResponse {
  code?: string
  error?: string
}

interface GoogleIdentityServices {
  accounts: {
    oauth2: {
      initCodeClient(config: {
        client_id: string
        scope: string
        ux_mode: 'popup'
        select_account: boolean
        include_granted_scopes: boolean
        callback(response: GoogleCodeResponse): void
        error_callback(error: { type: string }): void
      }): { requestCode(): void }
    }
  }
}

export function GoogleLoginButton({
  demo,
  disabled,
  onSignIn,
  onPendingChange,
}: {
  demo: boolean
  disabled: boolean
  onSignIn(input: GoogleLoginInput): Promise<void>
  onPendingChange(pending: boolean): void
}) {
  const clientId = process.env.NEXT_PUBLIC_GOOGLE_CLIENT_ID
  const [message, setMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [scriptFailed, setScriptFailed] = useState(false)
  const busy = useRef(false)
  const mounted = useRef(true)

  useEffect(() => {
    mounted.current = true
    return () => {
      mounted.current = false
    }
  }, [])

  function finish(message = '') {
    busy.current = false
    if (!mounted.current) return
    setLoading(false)
    setMessage(message)
    onPendingChange(false)
  }

  function signIn() {
    if (busy.current || disabled) return
    setMessage('')
    if (demo) {
      setMessage('Google sign-in isn’t available in the demo. Use email or try a sample profile below.')
      return
    }
    if (!clientId) {
      setMessage('Google sign-in isn’t available yet. Please use your email and password.')
      return
    }
    const google = (window as unknown as { google?: GoogleIdentityServices }).google
    if (!google?.accounts?.oauth2) {
      setMessage(
        scriptFailed
          ? 'Google couldn’t load. Check your connection or browser settings, then reload and try again.'
          : 'Google is still loading. Please try again in a moment.',
      )
      return
    }
    busy.current = true
    setLoading(true)
    onPendingChange(true)
    try {
      google.accounts.oauth2.initCodeClient({
        client_id: clientId,
        scope: 'openid email profile',
        ux_mode: 'popup',
        select_account: true,
        include_granted_scopes: false,
        callback: async ({ code, error }) => {
          if (!mounted.current || !busy.current) return
          if (error || !code) {
            finish('Google sign-in wasn’t completed. Please try again or use your email.')
            return
          }
          try {
            await onSignIn({ code })
            finish()
          } catch {
            finish('Google sign-in couldn’t be completed. Please try again or use your email.')
          }
        },
        error_callback: ({ type }) => {
          finish(
            type === 'popup_closed'
              ? 'Google sign-in was canceled. You can try again when you’re ready.'
              : 'Allow pop-ups for PawTrail, then try Google sign-in again.',
          )
        },
      }).requestCode()
    } catch {
      finish('Google sign-in couldn’t open. Please try again or use your email.')
    }
  }

  return (
    <div>
      {!demo && clientId && (
        <Script
          src="https://accounts.google.com/gsi/client"
          strategy="afterInteractive"
          onError={() => setScriptFailed(true)}
        />
      )}
      <LoadingButton
        type="button"
        variant="outline"
        className="h-12 w-full rounded-xl border-input bg-card text-sm font-medium text-foreground shadow-none hover:bg-muted dark:bg-card"
        loading={loading}
        disabled={disabled}
        onClick={signIn}
        aria-describedby={message ? 'google-login-message' : undefined}
      >
        <svg aria-hidden="true" viewBox="0 0 24 24" className="size-[1.125rem]">
          <path fill="#4285F4" d="M21.6 12.23c0-.71-.06-1.39-.18-2.05H12v3.88h5.38a4.6 4.6 0 0 1-1.99 3.02v2.51h3.23c1.89-1.74 2.98-4.3 2.98-7.36Z" />
          <path fill="#34A853" d="M12 22c2.7 0 4.96-.9 6.62-2.41l-3.23-2.51c-.9.6-2.05.96-3.39.96-2.6 0-4.81-1.76-5.6-4.12H3.07v2.59A10 10 0 0 0 12 22Z" />
          <path fill="#FBBC05" d="M6.4 13.92a6 6 0 0 1 0-3.84V7.49H3.07a10 10 0 0 0 0 9.02l3.33-2.59Z" />
          <path fill="#EA4335" d="M12 5.96c1.47 0 2.79.51 3.82 1.51l2.86-2.87A9.6 9.6 0 0 0 12 2a10 10 0 0 0-8.93 5.49l3.33 2.59C7.19 7.72 9.4 5.96 12 5.96Z" />
        </svg>
        Continue with Google
      </LoadingButton>
      {message && (
        <p id="google-login-message" role="status" className="mt-3 text-sm leading-relaxed text-muted-foreground">
          {message}
        </p>
      )}
    </div>
  )
}
