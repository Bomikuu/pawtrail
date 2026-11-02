import { readdirSync } from 'node:fs'
import { join } from 'node:path'
import { expect, it } from 'vitest'
import { READY_ROUTES } from '@/components/layout/navigation'
function pagePaths(path: string, segments: string[] = []): string[] {
  return readdirSync(path, { withFileTypes: true }).flatMap((entry) => {
    if (entry.isDirectory())
      return pagePaths(
        join(path, entry.name),
        entry.name.startsWith('(') ? segments : [...segments, entry.name],
      )
    return /^page\.(tsx|ts|jsx|js)$/.test(entry.name)
      ? [`/${segments.join('/')}`]
      : []
  })
}
it('never activates a destination before its page is implemented', () => {
  const routes = pagePaths('src/app')
  for (const route of READY_ROUTES)
    expect(routes, `Ready route ${route} has no page`).toContain(route)
})
