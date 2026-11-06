/** One-time source migration: move legacy presentation rules onto JSX as Tailwind utilities. */
import fs from 'node:fs/promises'
import path from 'node:path'
import { execFileSync } from 'node:child_process'
import postcss from 'postcss'
import ts from 'typescript'
const env = { ...process.env, GIT_EXEC_PATH: '/usr/bin' }
// This codemod was applied once. Reapplying its expansion would duplicate utilities.
try {
  await fs.access('src/styles/complex.css')
  throw new Error(
    'The Tailwind migration has already been applied. Do not rerun this one-time codemod.',
  )
} catch (error) {
  if (error.code !== 'ENOENT') throw error
}
const baseline = 'f9573c9'
const cssFiles = [
  'src/app/globals.css',
  'src/app/social-surfaces.css',
  'src/app/interactions.css',
  'src/app/shell.css',
  'src/features/animals/pet-profile.css',
  'src/features/events/events.css',
  'src/features/marketing/marketing.css',
]
const originals = new Map(
  cssFiles.map((file) => [
    file,
    execFileSync('/usr/bin/git', ['show', `${baseline}:${file}`], {
      env,
      maxBuffer: 8e6,
    }).toString(),
  ]),
)
await fs.mkdir('/tmp/pawtrail-ui-backup/css', { recursive: true })
for (const [file, source] of originals)
  await fs.writeFile(
    `/tmp/pawtrail-ui-backup/css/${path.basename(file)}`,
    source,
  )
async function files(dir) {
  const out = []
  for (const f of await fs.readdir(dir, { withFileTypes: true })) {
    const p = path.join(dir, f.name)
    if (f.isDirectory()) out.push(...(await files(p)))
    else if (p.endsWith('.tsx') && !p.startsWith('src/components/ui/'))
      out.push(p)
  }
  return out
}
const sources = new Map(
  await Promise.all(
    (await files('src')).map(async (file) => [
      file,
      await fs.readFile(file, 'utf8'),
    ]),
  ),
)
const known = new Set(),
  dynamic = new Map()
function eligible(node) {
  for (let p = node.parent; p; p = p.parent) {
    if (ts.isJsxAttribute(p)) return p.name.getText() === 'className'
    if (ts.isPropertyAssignment(p) && p.name.getText() === 'className')
      return true
    if (
      ts.isCallExpression(p) &&
      /^(cn|cva|clsx|classnames)$/.test(p.expression.getText())
    )
      return true
    if (ts.isFunctionLike(p) || ts.isSourceFile(p)) break
  }
  return false
}
function stringNode(node) {
  return (
    ts.isStringLiteral(node) ||
    ts.isNoSubstitutionTemplateLiteral(node) ||
    ts.isTemplateHead(node) ||
    ts.isTemplateMiddle(node) ||
    ts.isTemplateTail(node)
  )
}
for (const [file, source] of sources) {
  const tree = ts.createSourceFile(
    file,
    source,
    ts.ScriptTarget.Latest,
    true,
    ts.ScriptKind.TSX,
  )
  function visit(n) {
    if (stringNode(n) && eligible(n)) {
      const tokens = n.text.trim().split(/\s+/)
      for (const t of tokens) if (/^[\w-]+$/.test(t)) known.add(t)
      const base = tokens.find(
        (t) => /^[a-z][\w-]+$/.test(t) && !t.endsWith('-'),
      )
      if (base)
        for (const t of tokens) if (t.endsWith('-')) dynamic.set(t, base)
    }
    ts.forEachChild(n, visit)
  }
  visit(tree)
}
function split(s) {
  let d = 0,
    q = '',
    out = [],
    start = 0
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (q) {
      if (c === q && s[i - 1] !== '\\') q = ''
      continue
    }
    if (c === '"' || c === "'") {
      q = c
      continue
    }
    if (c === '(' || c === '[') d++
    if (c === ')' || c === ']') d--
    if (c === ',' && !d) {
      out.push(s.slice(start, i).trim())
      start = i + 1
    }
  }
  out.push(s.slice(start).trim())
  return out
}
function expand(selector) {
  const m = /:is\(|:where\(/.exec(selector)
  if (!m) return [selector]
  let i = m.index + m[0].length,
    d = 1,
    q = ''
  for (; i < selector.length; i++) {
    const c = selector[i]
    if (q) {
      if (c === q && selector[i - 1] !== '\\') q = ''
      continue
    }
    if (c === '"' || c === "'") {
      q = c
      continue
    }
    if (c === '(') d++
    if (c === ')' && !--d) break
  }
  if (d) return [selector]
  return split(selector.slice(m.index + m[0].length, i)).flatMap((part) =>
    expand(selector.slice(0, m.index) + part + selector.slice(i + 1)),
  )
}
const uiPattern =
  /^ui-(button(?:-.*)?|input|textarea|menu(?:-.*)?|dialog(?:-.*)?|overlay|confirm|description|progress|table|hover-card|skeleton|toast)$/
const uiSlots = {
  'ui-button': 'button',
  'ui-input': 'input',
  'ui-textarea': 'textarea',
  'ui-menu': 'dropdown-menu-content',
  'ui-menu-item': 'dropdown-menu-item',
  'ui-dialog': 'dialog-content',
  'ui-dialog-title': 'dialog-title',
  'ui-description': 'dialog-description',
  'ui-overlay': 'dialog-overlay',
  'ui-hover-card': 'hover-card-content',
  'ui-progress': 'progress',
  'ui-table': 'table',
  'ui-skeleton': 'skeleton',
}
const styles = new Map(),
  retained = [],
  fonts = []
const encode = (s) =>
  s.replace(/_/g, '\\_').replace(/\s+/g, '_').replaceAll('"', "'")
function variants(rule) {
  let prefix = ''
  for (let p = rule.parent; p && p.type !== 'root'; p = p.parent) {
    if (p.type !== 'atrule') return null
    if (p.name === 'media') {
      const t = p.params
      if (t.includes('prefers-reduced-motion: reduce'))
        prefix = 'motion-reduce:' + prefix
      else if (/^\(?((min|max)-width)/.test(t)) {
        for (const m of t.matchAll(/(min|max)-width:\s*([^\)]+)/g))
          prefix = `${m[1]}-[${encode(m[2].trim())}]:` + prefix
      } else prefix = `[@media(${encode(t.replace(/^\(|\)$/g, ''))})]:` + prefix
    } else if (p.name === 'container') {
      const m = /(min|max)-width:\s*([^\)]+)/.exec(p.params)
      if (!m) return null
      prefix = `@${m[1]}-[${encode(m[2])}]:` + prefix
    } else return null
  }
  return prefix
}
function classesOutside(s) {
  let depth = 0,
    quote = '',
    out = []
  for (let i = 0; i < s.length; i++) {
    const c = s[i]
    if (quote) {
      if (c === quote && s[i - 1] !== '\\') quote = ''
      continue
    }
    if (c === '"' || c === "'") {
      quote = c
      continue
    }
    if (c === '[' || c === '(') depth++
    if (c === ']' || c === ')') depth--
    if (c === '.' && !depth) {
      const m = /^\.([a-zA-Z_][\w-]*)/.exec(s.slice(i))
      if (m) {
        out.push({ name: m[1], index: i })
        i += m[0].length - 1
      }
    }
  }
  return out
}
function anchor(selector) {
  const c = classesOutside(selector).filter(
    (c) => !['dark', 'light'].includes(c.name) && !uiPattern.test(c.name),
  )
  for (let i = c.length - 1; i >= 0; i--)
    if (known.has(c[i].name))
      return {
        name: c[i].name,
        selector:
          selector.slice(0, c[i].index) +
          '&' +
          selector.slice(c[i].index + c[i].name.length + 1),
      }
  for (let i = c.length - 1; i >= 0; i--) {
    for (const [prefix, base] of dynamic)
      if (c[i].name.startsWith(prefix) && known.has(base))
        return {
          name: base,
          selector: selector.replace('.' + c[i].name, '&.' + c[i].name),
        }
  }
  return null
}
for (const [file, source] of originals) {
  const root = postcss.parse(source)
  root.walkAtRules('font-face', (n) => fonts.push(n.toString()))
  root.walkAtRules(/keyframes$/, (n) => retained.push(n.toString()))
  root.walkRules((rule) => {
    if (rule.parent?.type === 'atrule' && /keyframes$/.test(rule.parent.name))
      return
    const prefix = variants(rule)
    if (prefix === null) return
    for (const original of split(rule.selector))
      for (let selector of expand(original)) {
        if (
          /^(:root|html)(\s*\{|$)/.test(selector) ||
          selector === ':root' ||
          selector === "html[data-theme='dark']"
        )
          continue
        selector = selector
          .replace(/html\[data-theme=['"]dark['"]\]/g, '.dark')
          .replace(/html\[data-theme=['"]light['"]\]/g, '.light')
          .replace(/\.dark\s+/g, '.dark ')
        const found = anchor(selector)
        if (!found) {
          if (
            !/\.ui-|\.dark|\.light/.test(selector) &&
            /::-(webkit|moz)|::selection|:focus-visible|^html|^body|^h[1-6](?:\b|,)|^a\b|^\*/.test(
              selector,
            )
          ) {
            const clone = rule.clone({ selector: original })
            let n = clone
            for (let p = rule.parent; p && p.type !== 'root'; p = p.parent)
              if (p.type === 'atrule') {
                const a = postcss.atRule({ name: p.name, params: p.params })
                a.append(n)
                n = a
              }
            retained.push(n.toString())
          }
          continue
        }
        if (
          /\.ui-button-(primary|outline|ghost)|\.ui-input|\.ui-menu(?:-item)?(?:[:\s]|$)/.test(
            selector,
          ) &&
          classesOutside(selector)
            .filter((c) => !uiPattern.test(c.name))
            .every((c) =>
              ['app-shell', 'platform-shell', 'management-shell'].includes(
                c.name,
              ),
            )
        )
          continue
        let context = found.selector
        for (const [name, slot] of Object.entries(uiSlots).sort(
          (a, b) => b[0].length - a[0].length,
        ))
          context = context.replace(
            new RegExp('\\.' + name + '(?![\\w-])', 'g'),
            `[data-slot=${slot}]`,
          )
        context = context
          .replace(/\bprogress\b(?![\w-])/g, (match) =>
            context.includes('data-slot=progress')
              ? match
              : '[data-slot=progress]',
          )
          .replace(/=(["'])([\w-]+)\1/g, '=$2')
        const variant =
          prefix +
          (context.trim() === '&' ? '' : `[${encode(context.trim())}]:`)
        const key = found.name + '\0' + variant
        if (!styles.has(key))
          styles.set(key, { name: found.name, variant, props: new Map() })
        for (const d of rule.nodes)
          if (d.type === 'decl')
            styles
              .get(key)
              .props.set(d.prop, { value: d.value, important: d.important })
      }
  })
}
const spacing = (v) => {
  if (v === '0' || v === '0px') return '0'
  if (v === 'auto') return 'auto'
  const m = /^([\d.]+)rem$/.exec(v)
  if (m && (Number(m[1]) * 4) % 0.5 === 0) return String(Number(m[1]) * 4)
  if (/^\d+px$/.test(v) && parseInt(v) % 4 === 0) return String(parseInt(v) / 4)
  return '[' + encode(v) + ']'
}
const colors = {
  '#ffffff': 'card',
  '#fff': 'card',
  '#fffdf9': 'card',
  '#fffcf8': 'card',
  '#fffbf5': 'background',
  '#f97316': 'primary',
  '#3b2416': 'foreground',
  'var(--surface)': 'card',
  'var(--background)': 'background',
  'var(--foreground)': 'foreground',
  'var(--secondary-text)': 'muted-foreground',
  'var(--social-muted)': 'muted-foreground',
  'var(--social-line)': 'border',
  'var(--border)': 'border',
  'var(--social-canvas)': 'background',
}
function utility(prop, v) {
  const raw = '[' + prop + ':' + encode(v) + ']'
  if (prop.startsWith('--')) return raw
  const fixed = {
    display: {
      flex: 'flex',
      grid: 'grid',
      block: 'block',
      none: 'hidden',
      'inline-flex': 'inline-flex',
      'inline-grid': 'inline-grid',
      contents: 'contents',
      inline: 'inline',
      'inline-block': 'inline-block',
    },
    position: {
      relative: 'relative',
      absolute: 'absolute',
      fixed: 'fixed',
      sticky: 'sticky',
      static: 'static',
    },
    'align-items': {
      center: 'items-center',
      start: 'items-start',
      'flex-start': 'items-start',
      end: 'items-end',
      'flex-end': 'items-end',
      stretch: 'items-stretch',
      baseline: 'items-baseline',
    },
    'justify-content': {
      center: 'justify-center',
      start: 'justify-start',
      'flex-start': 'justify-start',
      'space-between': 'justify-between',
      'flex-end': 'justify-end',
    },
    'flex-direction': {
      column: 'flex-col',
      'column-reverse': 'flex-col-reverse',
      row: 'flex-row',
      'row-reverse': 'flex-row-reverse',
    },
    'flex-wrap': { wrap: 'flex-wrap', nowrap: 'flex-nowrap' },
    'font-weight': {
      400: 'font-normal',
      500: 'font-medium',
      600: 'font-semibold',
      700: 'font-bold',
      800: 'font-extrabold',
      900: 'font-black',
    },
    'text-decoration': { none: 'no-underline', underline: 'underline' },
    'list-style': { none: 'list-none' },
    'white-space': {
      nowrap: 'whitespace-nowrap',
      normal: 'whitespace-normal',
      'pre-wrap': 'whitespace-pre-wrap',
    },
    'font-variant-numeric': { 'tabular-nums': 'tabular-nums' },
    visibility: { hidden: 'invisible', visible: 'visible' },
    'pointer-events': {
      none: 'pointer-events-none',
      auto: 'pointer-events-auto',
    },
    'object-fit': { cover: 'object-cover', contain: 'object-contain' },
    'text-transform': {
      uppercase: 'uppercase',
      capitalize: 'capitalize',
      none: 'normal-case',
    },
  }
  if (fixed[prop]?.[v]) return fixed[prop][v]
  if (prop === 'font-family')
    return v.includes('heading')
      ? 'font-heading'
      : v.includes('body')
        ? 'font-sans'
        : raw
  if (prop === 'font') {
    const m =
      /^(\d+)\s+([^/\s]+)(?:\/([^\s]+))?\s+var\(--font-(heading|body)\)$/.exec(
        v,
      )
    if (m)
      return [
        `font-[${m[1]}]`,
        ...utility('font-size', m[2]).split(' '),
        m[3] ? `leading-[${encode(m[3])}]` : '',
        m[4] === 'heading' ? 'font-heading' : 'font-sans',
      ]
        .filter(Boolean)
        .join(' ')
    return raw
  }
  const sizes = {
    '0.625rem': 'text-[0.625rem]',
    '0.6875rem': 'text-[0.6875rem]',
    '0.75rem': 'text-xs',
    '0.8125rem': 'text-[0.8125rem]',
    '0.875rem': 'text-sm',
    '1rem': 'text-base',
    '1.125rem': 'text-lg',
    '1.25rem': 'text-xl',
    '1.5rem': 'text-2xl',
    '1.75rem': 'text-[1.75rem]',
    '2rem': 'text-[2rem]',
  }
  if (prop === 'font-size') return sizes[v] ?? `text-[length:${encode(v)}]`
  if (prop === 'color')
    return (
      'text-' +
      (v === 'var(--muted)'
        ? 'muted-foreground'
        : (colors[v.toLowerCase()] ?? '[' + encode(v) + ']'))
    )
  if (prop === 'background' || prop === 'background-color')
    return colors[v.toLowerCase()]
      ? 'bg-' + colors[v.toLowerCase()]
      : /^(#[\da-f]+|var\(|rgb|oklch|transparent)/i.test(v)
        ? 'bg-[' + encode(v) + ']'
        : raw
  const space = {
    padding: 'p',
    'padding-inline': 'px',
    'padding-block': 'py',
    'padding-top': 'pt',
    'padding-bottom': 'pb',
    'padding-left': 'pl',
    'padding-right': 'pr',
    'padding-inline-start': 'ps',
    'padding-inline-end': 'pe',
    margin: 'm',
    'margin-inline': 'mx',
    'margin-block': 'my',
    'margin-top': 'mt',
    'margin-bottom': 'mb',
    'margin-left': 'ml',
    'margin-right': 'mr',
    'margin-inline-start': 'ms',
    'margin-inline-end': 'me',
    gap: 'gap',
    'column-gap': 'gap-x',
    'row-gap': 'gap-y',
  }
  if (space[prop]) return !/\s/.test(v) ? space[prop] + '-' + spacing(v) : raw
  const dim = {
    width: 'w',
    height: 'h',
    'min-width': 'min-w',
    'max-width': 'max-w',
    'min-height': 'min-h',
    'max-height': 'max-h',
    top: 'top',
    bottom: 'bottom',
    left: 'left',
    right: 'right',
  }
  if (dim[prop])
    return (
      dim[prop] +
      '-' +
      ({
        '100%': 'full',
        auto: 'auto',
        none: 'none',
        '100dvh': 'dvh',
        '100vh': 'screen',
        'fit-content': 'fit',
        'max-content': 'max',
        'min-content': 'min',
      }[v] ?? spacing(v))
    )
  if (prop === 'border-radius')
    return (
      {
        '999px': 'rounded-full',
        '50%': 'rounded-full',
        '0.5rem': 'rounded-lg',
        '0.625rem': 'rounded-[0.625rem]',
        '0.75rem': 'rounded-xl',
        '0.875rem': 'rounded-[0.875rem]',
        '1rem': 'rounded-2xl',
      }[v] ?? 'rounded-[' + encode(v) + ']'
    )
  if (prop === 'border-color')
    return (
      'border-' +
      (v === 'var(--muted)'
        ? 'input'
        : (colors[v.toLowerCase()] ?? '[' + encode(v) + ']'))
    )
  if (prop === 'grid-template-columns') {
    const m = /^repeat\((\d+),\s*minmax\(0,\s*1fr\)\)$/.exec(v)
    return m
      ? 'grid-cols-' + m[1]
      : v === '1fr' || v === 'minmax(0, 1fr)'
        ? 'grid-cols-1'
        : 'grid-cols-[' + encode(v) + ']'
  }
  if (prop === 'overflow' || prop === 'overflow-x' || prop === 'overflow-y')
    return prop + '-' + v
  if (prop === 'text-align') return 'text-' + v
  if (prop === 'cursor') return 'cursor-' + v
  if (prop === 'opacity') return 'opacity-[' + v + ']'
  if (prop === 'flex-shrink' && (v === '0' || v === '1'))
    return v === '0' ? 'shrink-0' : 'shrink'
  return raw
}
const recipes = new Map()
for (const { name, variant, props } of styles.values()) {
  if (!recipes.has(name)) recipes.set(name, [])
  for (const [prop, { value, important }] of props) {
    if (['scrollbar-width', 'scrollbar-color'].includes(prop)) continue
    const tokens = utility(prop, value)
      .split(' ')
      .filter(Boolean)
      .map((t) => variant + t + (important ? '!' : ''))
    recipes.get(name).push(...tokens)
  }
}
for (const [key, value] of recipes) recipes.set(key, [...new Set(value)])
let updated = 0
for (const [file, source] of sources) {
  const tree = ts.createSourceFile(
      file,
      source,
      ts.ScriptTarget.Latest,
      true,
      ts.ScriptKind.TSX,
    ),
    edits = []
  function visit(n) {
    if (stringNode(n) && eligible(n)) {
      const out = n.text.replace(
        /(^|\s)([\w-]+)(?=\s|$)/g,
        (all, ws, key) =>
          ws + key + (recipes.has(key) ? ' ' + recipes.get(key).join(' ') : ''),
      )
      if (out !== n.text) {
        let text = JSON.stringify(out)
        if (ts.isJsxAttribute(n.parent)) text = '{' + text + '}'
        else if (
          ts.isTemplateHead(n) ||
          ts.isTemplateMiddle(n) ||
          ts.isTemplateTail(n)
        ) {
          const raw = source.slice(n.getStart(tree), n.end)
          const head = ts.isTemplateHead(n) ? '`' : '}'
          const tail = ts.isTemplateTail(n) ? '`' : '${'
          text =
            head +
            out
              .replace(/\\/g, '\\\\')
              .replace(/`/g, '\\`')
              .replace(/\$\{/g, '\\${') +
            tail
        }
        edits.push({ start: n.getStart(tree), end: n.end, text })
      }
    }
    ts.forEachChild(n, visit)
  }
  visit(tree)
  let out = source
  for (const e of edits.sort((a, b) => b.start - a.start))
    out = out.slice(0, e.start) + e.text + out.slice(e.end)
  out = out.replace(/^import\s+['"][^'"]+\.css['"]\n/gm, '')
  if (out !== source) {
    await fs.writeFile(file, out)
    updated++
  }
}
await fs.mkdir('src/styles', { recursive: true })
await fs.writeFile(
  'src/styles/complex.css',
  '/* Browser-specific behavior and authored animation only. Routine presentation lives in Tailwind classes. */\n' +
    [...new Set(retained)].join('\n\n') +
    '\n',
)
await fs.writeFile(
  '/tmp/pawtrail-ui-backup/font-faces.css',
  [...new Set(fonts)].join('\n\n'),
)
for (const file of cssFiles)
  if (file !== 'src/app/globals.css') await fs.unlink(file)
await fs.writeFile(
  '/tmp/pawtrail-ui-backup/migration-summary.json',
  JSON.stringify(
    {
      updated,
      recipes: recipes.size,
      retained: retained.length,
      sourceStylesheets: cssFiles,
    },
    null,
    2,
  ),
)
console.log(
  `Moved presentation into ${updated} source files using ${recipes.size} component style recipes.`,
)
