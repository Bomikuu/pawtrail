'use client'
import { AuthForm } from './login-form'
export function RegisterForm({ returnTo }: { returnTo: string | null }) {
  return <AuthForm kind="register" returnTo={returnTo} />
}
