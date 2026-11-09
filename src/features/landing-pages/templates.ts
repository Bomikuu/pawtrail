import './fonts'
import {
  createDocument,
  node,
  type BuilderNode,
  type WebsiteDocument,
} from '@sitebuilder/core'
export const landingTemplates = [
  {
    id: 'story',
    name: 'A place for kindness',
    description:
      'A warm split opening, your story and a clear invitation to help.',
    color: 'bg-orange-100',
    layout: 'split',
  },
  {
    id: 'adoption',
    name: 'Find your companion',
    description:
      'Photography first, with space to introduce the animals in your care.',
    color: 'bg-emerald-100',
    layout: 'photo',
  },
  {
    id: 'community',
    name: 'Better, together',
    description:
      'An open editorial layout for rescue groups and community organizations.',
    color: 'bg-amber-100',
    layout: 'editorial',
  },
] as const
export function landingDocument(
  template: string,
  shelter: { id: string; slug: string; name: string; description: string },
): WebsiteDocument {
  const doc = createDocument({ title: shelter.name, mode: 'fixed' })
  const profile =
    shelter.id === 'preview'
      ? '#'
      : '/shelters/' + encodeURIComponent(shelter.slug)
  const heading = (text: string, level = 2) => node('heading', { text, level })
  const section = (name: string, children: BuilderNode[]) => ({
    ...node('section', { name }, children),
    style: { padding: 72 },
    responsive: { phone: { padding: 24 } },
  })
  const photo = node('image', {
    assetId: 'hero',
    alt: shelter.name,
    aspect: '4/3',
    fit: 'cover',
  })
  const intro = node('container', {}, [
    heading(shelter.name, 1),
    node('text', {
      text:
        shelter.description ||
        'Discover our work and meet our care community on PawTrail.',
    }),
    node('button', { text: 'Meet our community', href: profile }),
  ])
  const opening: BuilderNode[] =
    template === 'adoption'
      ? [photo, intro]
      : template === 'community'
        ? [intro, photo]
        : [
            {
              ...node('columns', {}, [intro, photo]),
              style: {
                display: 'grid',
                gridColumns: 2,
                gap: 48,
                alignItems: 'center',
              },
              responsive: { phone: { gridColumns: 1, gap: 24 } },
            },
          ]
  doc.children = [
    section('Welcome', opening),
    section('Our care community', [
      heading('Every animal has a story.'),
      node('text', {
        text: 'Get to know our community, explore animal profiles and discover ways to take part.',
      }),
      node('button', { text: 'Explore our PawTrail profile', href: profile }),
    ]),
    section('Take part', [
      heading(
        template === 'community'
          ? 'A little care goes a long way.'
          : 'Your next small kindness starts here.',
      ),
      node('text', {
        text: 'Visit our profile for current animals, activities and opportunities to help.',
      }),
      node('button', { text: 'Find a way to help', href: profile }),
    ]),
  ]
  doc.theme = {
    ...doc.theme,
    headingFont: 'Saira Condensed',
    bodyFont: 'Instrument Sans',
    radius: 6,
    colors: {
      ...doc.theme.colors,
      background: '#fffcf7',
      surface: template === 'adoption' ? '#edf4ee' : '#fff0dd',
      text: '#342a24',
      muted: '#716359',
      primary: template === 'adoption' ? '#285b48' : '#a54b26',
      onPrimary: '#ffffff',
      accent: '#a54b26',
      border: '#e3d9ca',
    },
  }
  doc.context = {
    version: 1,
    purpose: 'landing',
    sourceId: shelter.id,
    setupComplete: 1,
  }
  return doc
}
