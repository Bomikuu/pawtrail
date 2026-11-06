import { NavigationContent } from '@/components/layout/navigation-content'
import { NavigationLink as Link } from '@/components/layout/navigation-link'
export default function NotFound() {
  return (
    <main className="journal-empty">
      <NavigationContent>
        <img
          src="/images/pawtrail/not-found.webp"
          className="empty-illustration"
          width={242}
          height={128}
          alt=""
        />
        <h1>This trail doesn’t lead to a public story</h1>
        <p>The record may have moved, been withdrawn, or be awaiting review.</p>
        <Link href="/community">Return to the community</Link>
      </NavigationContent>
    </main>
  )
}
