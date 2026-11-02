import { readdir, readFile } from 'node:fs/promises'
import { extname, relative, resolve, sep } from 'node:path'
import { fileURLToPath } from 'node:url'
import ts from 'typescript'

export type UiViolation = {
  path: string
  line: number
  tag: string
}

const rawPrimitives = new Set([
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
])
const sourceExtensions = new Set(['.ts', '.tsx', '.js', '.jsx'])

export function scanUiSource(path: string, source: string): UiViolation[] {
  const normalizedPath = relative(
    process.cwd(),
    resolve(path.replaceAll('\\', '/')),
  )
    .split(sep)
    .join('/')

  if (normalizedPath.startsWith('src/components/ui/')) return []

  const sourceFile = ts.createSourceFile(
    path,
    source,
    ts.ScriptTarget.Latest,
    true,
    extname(path) === '.ts' ? ts.ScriptKind.TS : ts.ScriptKind.TSX,
  )
  const violations: UiViolation[] = []

  function visit(node: ts.Node) {
    if (
      (ts.isJsxOpeningElement(node) || ts.isJsxSelfClosingElement(node)) &&
      ts.isIdentifier(node.tagName) &&
      rawPrimitives.has(node.tagName.text)
    ) {
      const { line } = sourceFile.getLineAndCharacterOfPosition(
        node.getStart(sourceFile),
      )
      violations.push({ path, line: line + 1, tag: node.tagName.text })
    }

    ts.forEachChild(node, visit)
  }

  visit(sourceFile)
  return violations
}

async function scanDirectory(directory: string): Promise<UiViolation[]> {
  const entries = await readdir(directory, { withFileTypes: true })
  const violations: UiViolation[] = []

  for (const entry of entries.sort((a, b) => a.name.localeCompare(b.name))) {
    const path = resolve(directory, entry.name)

    if (entry.isDirectory()) {
      violations.push(...(await scanDirectory(path)))
    } else if (entry.isFile() && sourceExtensions.has(extname(path))) {
      const source = await readFile(path, 'utf8')
      violations.push(...scanUiSource(relative(process.cwd(), path), source))
    }
  }

  return violations
}

async function main() {
  const violations = await scanDirectory(resolve('src'))

  if (violations.length > 0) {
    for (const { path, line, tag } of violations) {
      console.error(`${path}:${line} Raw <${tag}> must use a shared UI control`)
    }
    process.exitCode = 1
    return
  }

  console.log('UI boundary check passed')
}

if (
  process.argv[1] &&
  resolve(process.argv[1]) === fileURLToPath(import.meta.url)
) {
  main().catch((error: unknown) => {
    console.error(error instanceof Error ? error.message : String(error))
    process.exitCode = 1
  })
}
