import Link from 'next/link'
export default function NotFound() {
  return (
    <main className="journal-empty">
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
    </main>
  )
}
