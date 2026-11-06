import 'server-only'
import { DEMO_NOW } from '@/lib/api/clock'
import { samplePhotos } from './photos'
import { location } from './shared'

export const animalNames = [
  'Milo',
  'Luna',
  'Bantay',
  'Ming',
  'Coco',
  'Pepper',
  'Sunny',
  'Patches',
  'Tala',
  'Oreo',
  'Pip',
  'Bella',
  'Cloud',
  'Ginger',
  'Daisy',
  'Shadow',
  'Mocha',
  'Bean',
  'Star',
  'Biscuit',
]
export const sampleAreas = [
  { ...location, name: location.neighborhood },
  {
    areaId: 'area-davao-buhangin',
    name: 'Buhangin, Davao City',
    neighborhood: 'Buhangin, Davao City',
    latitude: 7.1102,
    longitude: 125.6131,
    approximateRadiusMeters: 900,
  },
  {
    areaId: 'area-davao-matina',
    name: 'Matina, Davao City',
    neighborhood: 'Matina, Davao City',
    latitude: 7.0586,
    longitude: 125.5874,
    approximateRadiusMeters: 900,
  },
  {
    areaId: 'area-davao-agdao',
    name: 'Agdao, Davao City',
    neighborhood: 'Agdao, Davao City',
    latitude: 7.0903,
    longitude: 125.6294,
    approximateRadiusMeters: 800,
  },
  {
    areaId: 'area-davao-talomo',
    name: 'Talomo, Davao City',
    neighborhood: 'Talomo, Davao City',
    latitude: 7.0505,
    longitude: 125.5459,
    approximateRadiusMeters: 1000,
  },
]
export function sampleLocation(index: number) {
  const { name: _name, ...area } = sampleAreas[index % sampleAreas.length]!
  return area
}
export function samplePast(daysAgo: number, hour = 0) {
  return new Date(
    Date.parse(DEMO_NOW) - daysAgo * 86400000 + hour * 3600000,
  ).toISOString()
}
/** Each fictional animal keeps the same distinct licensed portrait across connected activity. */
export function sampleAnimalPhoto(index: number) {
  return { ...samplePhotos[index % samplePhotos.length]! }
}
export const hordeNames = [
  'Riverside Paws',
  'Buhangin Whiskers',
  'Matina Care Circle',
  'Agdao Market Friends',
  'Talomo Trail Pals',
]
export const shelterNames = [
  'Riverside Rescue House',
  'Buhangin Cat Haven',
  'Matina Second Chances',
  'Agdao Animal Care',
  'Talomo Foster Network',
]
export const careTasks = [
  'Prepare a neighborhood feeding kit',
  'Refresh shaded water stations',
  'Help with a shelter supply inventory',
  'Support a quiet adoption meet-and-greet',
  'Plan a community cat welfare visit',
  'Prepare a foster welcome pack',
  'Photograph an animal’s public profile',
  'Coordinate a safe transport roster',
  'Sort donated blankets and bowls',
  'Share a neighborhood care update',
]
export const memberBios = [
  'Sample shelter coordinator arranging feeding rounds and foster introductions.',
  'Sample cat-care volunteer connecting neighbors with practical shelter support.',
  'Sample adoption coordinator helping families understand an animal’s needs.',
  'Sample rescue organizer planning transport, supplies and community visits.',
  'Sample foster coordinator making room for animals between homes.',
  'Sample neighborhood volunteer documenting sightings and completing care missions.',
  'Sample adoption advocate sharing calm introductions and thoughtful animal stories.',
  'Sample weekend helper keeping water stations and feeding kits ready.',
  'Sample community photographer telling the stories behind familiar neighborhood paws.',
  'Sample mission volunteer supporting shelter visits and recurring food drives.',
]
