import Link from 'next/link'
export default function NotFound() {
  return (
    <main className="journal-empty">
      <h1>This trail doesn’t lead to a public story</h1>
      <p>The record may have moved, been withdrawn, or be awaiting review.</p>
      <Link href="/community">Return to the community</Link>
    </main>
  )
}
