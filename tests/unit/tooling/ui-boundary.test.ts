import { spawnSync } from 'node:child_process'
import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs'
import { join, resolve } from 'node:path'
import { describe, expect, it } from 'vitest'
import { scanUiSource } from '../../../scripts/check-ui'

const featurePath = 'src/features/community/x.tsx'

const primitives = [
  'button',
  'input',
  'select',
  'textarea',
  'table',
  'thead',
  'tbody',
  'tfoot',
  'tr',
  'th',
  'td',
]

describe('UI component boundary', () => {
  it('rejects_feature_primitives_and_allows_shared_controls', () => {
    expect(scanUiSource(featurePath, '<button />')).toEqual([
      { path: featurePath, line: 1, tag: 'button' },
    ])
    expect(scanUiSource('src/components/ui/button.tsx', '<button />')).toEqual(
      [],
    )
  })

  it.each(primitives)('rejects raw %s controls in feature code', (tag) => {
    expect(scanUiSource(featurePath, `<${tag} />`)).toEqual([
      { path: featurePath, line: 1, tag },
    ])
  })

  it.each(primitives)(
    'allows raw %s controls only in the shared layer',
    (tag) => {
      expect(
        scanUiSource('src/components/ui/nested/control.tsx', `<${tag} />`),
      ).toEqual([])
      expect(
        scanUiSource('src/components/ui-legacy/control.tsx', `<${tag} />`),
      ).toHaveLength(1)
    },
  )

  it('allows shared components, ordinary links, strings, and comments', () => {
    expect(
      scanUiSource(
        featurePath,
        `const hint = '<button />'
         // <input />
         const View = () => <><Button /><Input /><a href="/community">Community</a><Link href="/">Home</Link><Controls.button /></>`,
      ),
    ).toEqual([])
  })

  it('traverses nested JSX and reports opening tags once with their source line', () => {
    const source = `const View = () => (
  <main>
    <section>{ready && <button>Send <input /></button>}</section>
    <table>
      <tbody><tr><td>Story</td></tr></tbody>
    </table>
  </main>
)`
    expect(scanUiSource(featurePath, source)).toEqual([
      { path: featurePath, line: 3, tag: 'button' },
      { path: featurePath, line: 3, tag: 'input' },
      { path: featurePath, line: 4, tag: 'table' },
      { path: featurePath, line: 5, tag: 'tbody' },
      { path: featurePath, line: 5, tag: 'tr' },
      { path: featurePath, line: 5, tag: 'td' },
    ])
  })

  it('does not treat TypeScript type assertions as JSX primitives', () => {
    expect(
      scanUiSource(
        'src/lib/example.ts',
        'type button = string\nconst value = <button>"hello"',
      ),
    ).toEqual([])
  })

  it('rejects route primitives and paths outside the canonical directory', () => {
    for (const path of [
      'src/app/page.tsx',
      'src/features/ui/button.tsx',
      'src/components/ui/../feature/button.tsx',
    ]) {
      expect(scanUiSource(path, '<button />')).toEqual([
        { path, line: 1, tag: 'button' },
      ])
    }
  })
})

describe('UI boundary CLI', () => {
  const scriptPath = resolve('scripts/check-ui.ts')
  const tsxPath = resolve('node_modules/tsx/dist/loader.mjs')

  function runScanner(files: Record<string, string>) {
    mkdirSync('.pawtrail', { recursive: true })
    const directory = mkdtempSync(resolve('.pawtrail/tooling-'))

    try {
      for (const [path, source] of Object.entries(files)) {
        const fullPath = join(directory, path)
        mkdirSync(resolve(fullPath, '..'), { recursive: true })
        writeFileSync(fullPath, source)
      }

      return spawnSync(process.execPath, ['--import', tsxPath, scriptPath], {
        cwd: directory,
        encoding: 'utf8',
        timeout: 10000,
      })
    } finally {
      rmSync(directory, { recursive: true, force: true })
    }
  }

  it('exits nonzero when a nested .tsx feature contains raw controls', () => {
    const result = runScanner({
      'src/features/community/nested/post.tsx':
        'const Post = () => <main>\n<button />\n</main>',
    })
    expect(result.status).toBe(1)
    expect(result.stderr).toContain(
      'src/features/community/nested/post.tsx:2 Raw <button>',
    )
  })

  it('succeeds for shared primitives and feature components', () => {
    const result = runScanner({
      'src/components/ui/button.tsx': 'const Button = () => <button />',
      'src/features/community/post.tsx': 'const Post = () => <Button />',
    })
    expect(result.status).toBe(0)
    expect(result.stdout).toContain('UI boundary check passed')
    expect(result.stderr).toBe('')
  })
})
