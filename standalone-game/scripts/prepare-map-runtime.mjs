import fs from 'node:fs/promises'
import path from 'node:path'

// Keep the same-version ESM worker and its shared module available to Vite and Next.
// These vendor files retain their upstream license headers.
const base = path.resolve('node_modules/maplibre-gl')
const output = path.resolve('public/pawtrail-game/maplibre')
await fs.mkdir(output, { recursive: true })
for (const file of ['maplibre-gl-worker.mjs', 'maplibre-gl-shared.mjs'])
  await fs.copyFile(path.join(base, 'dist', file), path.join(output, file))
const pkg = JSON.parse(await fs.readFile(path.join(base, 'package.json'), 'utf8'))
await fs.writeFile(path.join(output, 'version.json'), JSON.stringify({ version: pkg.version, license: pkg.license }) + '\n')
await fs.copyFile(path.join(base, 'LICENSE.txt'), 'docs/licenses/maplibre-gl.txt')
console.log('Prepared MapLibre worker assets for Vite and Next:', pkg.version)
