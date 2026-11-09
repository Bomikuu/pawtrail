import { redirect } from 'next/navigation'
export const metadata = {
  title: 'PawTrail',
  robots: { index: false, follow: false },
}
export default async function Page() {
  redirect('/spot')
}
