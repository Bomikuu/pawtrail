export function DemoBanner() {
  return (
    <aside
      className={
        'demo-banner border-b bg-[#fff9ed] px-3 py-1.5 text-center text-[0.6875rem] text-muted-foreground md:px-6 md:text-xs md:[.app-shell_>_&]:ms-[14rem] dark:bg-[#1c1c1c] dark:text-foreground'
      }
      aria-label="Demonstration mode"
    >
      <p>
        <strong>Sample community.</strong> Profiles, activity, and verification
        are illustrative. Contributions are simulated; no real payments.
      </p>
    </aside>
  )
}
