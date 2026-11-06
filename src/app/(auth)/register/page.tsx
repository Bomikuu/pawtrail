import { NavigationContent } from '@/components/layout/navigation-content'
import { RegisterForm } from '@/features/auth/register-form'
export const metadata = {
  title: 'Register | PawTrail',
  robots: { index: false, follow: false },
}
export default async function Page({
  searchParams,
}: {
  searchParams: Promise<{ returnTo?: string | string[] }>
}) {
  const { returnTo } = await searchParams
  return (
    <main className={'auth-page [padding:3rem_1.25rem] max-[40rem]:pt-8'}>
      <NavigationContent>
        <RegisterForm
          returnTo={typeof returnTo === 'string' ? returnTo : null}
        />
      </NavigationContent>
    </main>
  )
}
