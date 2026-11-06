export function Brand({ compact = false }: { compact?: boolean }) {
  return (
    <span
      className={
        'brand-lockup inline-flex items-center gap-[0.4rem] [&_img]:w-14 [&_img]:h-8 [&_img]:object-contain max-[48rem]:gap-0.5 max-[48rem]:[&_img]:w-10 max-[48rem]:[&_img]:h-6 max-[23rem]:[&_img]:hidden [.sidebar-brand_&]:inline-flex [.sidebar-brand_&]:items-center [.sidebar-brand_&]:gap-1.5 [.sidebar-brand_&_>_img]:w-12 [.sidebar-brand_&_>_img]:h-auto [.sidebar-brand_&_>_img]:object-contain'
      }
    >
      <img
        src="/images/pawtrail/brand-mark.webp"
        width={211}
        height={73}
        alt=""
      />
      {!compact && (
        <span>
          Paw
          <span
            className={
              'brand-trail text-[#c94c09] [.sidebar-brand_&]:text-[color:var(--primary)]'
            }
          >
            Trail
          </span>
        </span>
      )}
    </span>
  )
}
