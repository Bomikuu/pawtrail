/** Only explicit implemented patterns match. Reject normalized/encoded path escapes. */
export function isRouteReady(
  href: string,
  routes: ReadonlySet<string>,
): boolean {
  if (
    !href.startsWith('/') ||
    href.startsWith('//') ||
    /[\\\s\u0000-\u001f\u007f]/.test(href)
  )
    return false
  const pathname = href.split(/[?#]/, 1)[0]
  let decoded: string
  try {
    decoded = decodeURIComponent(pathname)
  } catch {
    return false
  }
  if (
    decoded.includes('\\') ||
    decoded.includes('%') ||
    /[?#\s\u0000-\u001f\u007f]/.test(decoded)
  )
    return false
  // Encoded delimiters and dot segments must never turn an unsafe href into a match.
  if (
    decoded.split('/').length !== pathname.split('/').length ||
    decoded.split('/').some((part) => part === '.' || part === '..')
  )
    return false
  const actual = decoded.split('/')
  return [...routes].some((pattern) => {
    const expected = pattern.split('/')
    return (
      expected.length === actual.length &&
      expected.every((part, index) =>
        /^\[[a-zA-Z][a-zA-Z0-9_]*\]$/.test(part)
          ? !!actual[index] && !/[\[\]]/.test(actual[index])
          : part === actual[index],
      )
    )
  })
}
