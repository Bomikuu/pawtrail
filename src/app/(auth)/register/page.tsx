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
    <main className="relative isolate grid min-h-svh place-items-center overflow-hidden bg-[#fffaf5] px-4 py-8 text-foreground sm:px-8 sm:py-10 dark:bg-background">
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -top-72 -left-48 -z-10 h-[29rem] w-[36rem] -rotate-25 rounded-[45%] bg-[#ffd69d]/35 dark:bg-primary/5"
      />
      <div
        aria-hidden="true"
        className="pointer-events-none absolute -right-64 -bottom-80 -z-10 h-[31rem] w-[40rem] -rotate-30 rounded-[45%] bg-[#ffd69d]/30 dark:bg-primary/5"
      />
      <div className="w-full min-w-0 max-w-3xl">
        <NavigationContent>
          <RegisterForm
            returnTo={typeof returnTo === 'string' ? returnTo : null}
          />
        </NavigationContent>
      </div>
    </main>
  )
}
