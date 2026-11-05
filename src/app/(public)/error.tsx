'use client'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Button } from '@/components/ui/button'
export default function ErrorPage({ retry }: { retry: () => void }) {
  const path = usePathname()
  return (
    <section className="journal-empty">
      <h1>We couldn’t load this part of the story</h1>
      <p>
        Your saved work has not been cleared. Try again, or clear the current
        page filters.
      </p>
      <Button onClick={retry}>Try again</Button>
      <Link href={path}>Clear filters and return to the first page</Link>
      <Link href="/community">Back to community</Link>
    </section>
  )
}
