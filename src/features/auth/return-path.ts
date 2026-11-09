/** Accept only local page navigation, never auth loops, endpoints, or encoded separators. */
export function validateReturnPath(input: string | null): string {
  if (
    !input ||
    !input.startsWith('/') ||
    input.startsWith('//') ||
    /[\\\u0000-\u0020\u007f]/.test(input) ||
    /%(?:2f|5c|0[0-9a-f]|1[0-9a-f]|7f|25)/i.test(input)
  )
    return '/community'
  try {
    const url = new URL(input, 'https://pawtrail.invalid')
    if (
      url.origin !== 'https://pawtrail.invalid' ||
      /^\/(?:api|auth|login|register)(?:\/|$)/.test(url.pathname)
    )
      return '/community'
    return `${url.pathname}${url.search}${url.hash}`
  } catch {
    return '/community'
  }
}
export const loginPath = (returnTo: string) =>
  `/login?returnTo=${encodeURIComponent(validateReturnPath(returnTo))}`
