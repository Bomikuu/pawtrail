/** Original simple vector brand mark; implementation asset, pending owner brand review. */
export function PawMarker({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      aria-hidden="true"
      viewBox="0 0 48 56"
      fill="none"
    >
      <path
        d="M24 53S4 36 4 23a20 20 0 0 1 40 0c0 13-20 30-20 30Z"
        fill="var(--primary)"
        stroke="var(--foreground)"
        strokeWidth="2"
      />
      <g fill="var(--foreground)">
        <ellipse cx="15" cy="20" rx="3" ry="4" transform="rotate(-25 15 20)" />
        <ellipse cx="22" cy="15" rx="3" ry="4" />
        <ellipse cx="30" cy="16" rx="3" ry="4" transform="rotate(15 30 16)" />
        <ellipse cx="35" cy="23" rx="3" ry="4" transform="rotate(30 35 23)" />
        <path d="M14 31c0-4 7-10 11-10s9 8 9 11c0 5-6 4-10 3s-10 2-10-4Z" />
      </g>
    </svg>
  )
}
