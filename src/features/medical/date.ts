export function medicalDate(value: string | null) {
  return value ? new Date(value + 'T12:00:00+08:00').toLocaleDateString('en-PH', { year: 'numeric', month: 'short', day: 'numeric', timeZone: 'Asia/Manila' }) : 'Not recorded'
}
