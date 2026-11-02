/** Curated artwork IDs are persisted; URLs and crop positions are never supplied by profile inputs. */
export const profileBannerIds = [
  'meadow',
  'garden',
  'coast',
  'starlight',
] as const
export const profileBanners = [
  {
    id: 'meadow',
    label: 'Meadow companions',
    description: 'A sunny trail, a calico cat and a puppy.',
    position: '72% 38%',
    height: 540,
  },
  {
    id: 'garden',
    label: 'Garden nap',
    description: 'Sleepy friends among warm daisies.',
    position: '72% 70%',
    height: 480,
  },
  {
    id: 'coast',
    label: 'Coastal wanderers',
    description: 'A quiet shoreline and sandy pawprints.',
    position: '72% 48%',
    height: 481,
  },
  {
    id: 'starlight',
    label: 'Starlight friends',
    description: 'Moonlit company in a peaceful park.',
    position: '72% 68%',
    height: 480,
  },
] as const
export function getProfileBanner(id?: string | null) {
  return profileBanners.find((banner) => banner.id === id) ?? profileBanners[0]
}
