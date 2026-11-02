export function CommunityAvatar({
  name,
  small = false,
}: {
  name: string
  small?: boolean
}) {
  const initials =
    name
      .trim()
      .split(/\s+/)
      .slice(0, 2)
      .map((part) => part[0])
      .join('')
      .toUpperCase() || 'P'
  const tone =
    name.split('').reduce((sum, letter) => sum + letter.charCodeAt(0), 0) % 4
  return (
    <span
      className={
        'community-avatar avatar-tone-' + tone + (small ? ' avatar-small' : '')
      }
      aria-hidden="true"
    >
      {initials}
    </span>
  )
}
