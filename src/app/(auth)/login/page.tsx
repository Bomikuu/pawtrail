import { NavigationContent } from '@/components/layout/navigation-content'
import { LoginForm } from '@/features/auth/login-form'
export const metadata = {
  title: 'Login | PawTrail',
  robots: { index: false, follow: false },
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>
}) {
  const { returnTo } = await searchParams
  return (
    <main className="auth-page">
      <NavigationContent>
        <LoginForm returnTo={typeof returnTo === 'string' ? returnTo : null} />
      </NavigationContent>
    </main>
  )
}
