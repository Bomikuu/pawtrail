/** Owner-supplied banner sheet. Legacy preset IDs remain stable when the art collection changes. */
export const profileBannerIds = [
  'meadow',
  'garden',
  'coast',
  'starlight',
  'sunset',
  'explorer',
  'home',
  'champion',
] as const
export const profileBanners = [
  {
    id: 'meadow',
    label: 'Sunny companions',
    description: 'A happy cat and dog in a sunny flower meadow.',
    position: '50% 55%',
    height: 205,
  },
  {
    id: 'sunset',
    label: 'Sunset together',
    description: 'Two friends watching the sun set over the hills.',
    position: '50% 55%',
    height: 206,
  },
  {
    id: 'garden',
    label: 'Campfire dreams',
    description: 'A cat and dog napping beside their tent and lantern.',
    position: '50% 55%',
    height: 215,
  },
  {
    id: 'explorer',
    label: 'Trail explorers',
    description: 'Two little explorers sharing a map and a paw marker.',
    position: '50% 50%',
    height: 216,
  },
  {
    id: 'home',
    label: 'Home sweet home',
    description: 'A cozy pet house with a heart sign and sleepy friends.',
    position: '50% 55%',
    height: 216,
  },
  {
    id: 'starlight',
    label: 'Hearts in the sky',
    description: 'Two companions looking up at heart-shaped clouds.',
    position: '50% 55%',
    height: 216,
  },
  {
    id: 'coast',
    label: 'Neighborhood wanderers',
    description: 'A cat and dog taking a sunny trail through the neighborhood.',
    position: '50% 55%',
    height: 218,
  },
  {
    id: 'champion',
    label: 'Little champions',
    description: 'Two medal-wearing friends celebrating a golden paw trophy.',
    position: '50% 50%',
    height: 217,
  },
] as const
export function getProfileBanner(id?: string | null) {
  return profileBanners.find((banner) => banner.id === id) ?? profileBanners[0]
}
