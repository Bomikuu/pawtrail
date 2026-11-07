import { NavigationContent } from '@/components/layout/navigation-content'
import { LoginForm } from '@/features/auth/login-form'
import { LoginIntroduction } from '@/features/auth/login-introduction'
import { PawPrint } from 'lucide-react'
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
    <main className="relative isolate min-h-svh overflow-hidden bg-[#fffaf5] px-5 py-8 text-foreground sm:px-8 sm:py-12 lg:flex lg:items-center lg:px-12 dark:bg-background">
      <div aria-hidden="true" className="pointer-events-none absolute -top-72 -left-48 -z-10 h-[29rem] w-[36rem] -rotate-25 rounded-[45%] bg-[#ffd69d]/35 dark:bg-primary/5" />
      <div aria-hidden="true" className="pointer-events-none absolute -right-64 -bottom-80 -z-10 h-[31rem] w-[40rem] -rotate-30 rounded-[45%] bg-[#ffd69d]/30 dark:bg-primary/5" />
      <PawPrint aria-hidden="true" className="pointer-events-none absolute top-9 right-10 hidden size-20 rotate-12 fill-[#f7dfc6]/45 text-transparent sm:block dark:fill-primary/5" />
      <div className="relative mx-auto grid w-full max-w-[69rem] items-center gap-12 lg:grid-cols-[minmax(0,1fr)_minmax(0,28rem)] lg:gap-16 xl:gap-24">
        <LoginIntroduction />
        <div className="min-w-0">
          <NavigationContent>
            <LoginForm returnTo={typeof returnTo === 'string' ? returnTo : null} />
          </NavigationContent>
          <img
            src="/images/illustrations/login-companions.webp"
            width={1100}
            height={704}
            alt=""
            className="mx-auto mt-6 block w-60 max-w-full lg:hidden"
          />
        </div>
      </div>
    </main>
  )
}
