/** Presentation of recorded facts; no age or care state is inferred. */
export function formatAnimalAge(ageMonths?: number | null): string | null {
  if (
    typeof ageMonths !== 'number' ||
    !Number.isFinite(ageMonths) ||
    ageMonths < 0
  )
    return null
  const total = Math.floor(ageMonths)
  const years = Math.floor(total / 12)
  const months = total % 12
  const parts: string[] = []
  if (years) parts.push(`${years} ${years === 1 ? 'year' : 'years'}`)
  if (months || !years)
    parts.push(`${months} ${months === 1 ? 'month' : 'months'}`)
  return parts.join(' ')
}

export function animalFactLabel(value?: string | null): string | null {
  if (!value || value === 'unknown') return null
  const words = value.replaceAll('_', ' ').trim()
  return words ? words[0].toUpperCase() + words.slice(1) : null
}

export function animalCareLabel(status: string): string {
  const labels: Record<string, string> = {
    community: 'Community animal',
    sheltered: 'In shelter care',
    owned: 'Has a guardian',
    adopted: 'Adopted',
    missing: 'Reported missing',
  }
  return labels[status] ?? animalFactLabel(status) ?? 'Status not recorded'
}
