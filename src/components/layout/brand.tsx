export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span className="brand-lockup">
      <img
        src="/images/pawtrail/brand-mark.webp"
        width={211}
        height={73}
        alt=""
      />
      {!compact && (
        <span>
          Paw<span className="brand-trail">Trail</span>
        </span>
      )}
    </span>
  )
}
