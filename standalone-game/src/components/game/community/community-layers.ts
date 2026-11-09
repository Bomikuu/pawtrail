import type { Map, GeoJSONSource } from 'maplibre-gl'
import type { CommunityAreas } from '@/game/discovery/communities'
import {
  CITY_BOUNDARY_MIN_ZOOM,
  STREET_ZOOM,
} from '@/game/discovery/region-stats'
const SOURCE = 'geographic-communities'
export const COMMUNITY_FILL = 'community-area-fill'
export function highlightCommunity(
  map: Map,
  selected?: string,
  hovered?: string,
) {
  if (!map.getLayer(COMMUNITY_FILL)) return
  const selectedExpression = ['==', ['get', 'id'], selected ?? '']
  const hoveredExpression = ['==', ['get', 'id'], hovered ?? '']
  map.setPaintProperty(COMMUNITY_FILL, 'fill-opacity', [
    'case',
    selectedExpression,
    0.035,
    hoveredExpression,
    0.06,
    0.008,
  ])
  map.setPaintProperty('community-area-line', 'line-width', [
    'case',
    selectedExpression,
    1.8,
    hoveredExpression,
    1.6,
    1,
  ])
  map.setPaintProperty('community-area-casing', 'line-width', [
    'case',
    selectedExpression,
    3.2,
    hoveredExpression,
    3,
    2,
  ])
}
export function updateCommunityLayers(
  map: Map,
  areas: CommunityAreas,
  selected?: string,
  hovered?: string,
) {
  if (!map.getSource('places')) return
  if (!map.getSource(SOURCE)) {
    const before = map
      .getStyle()
      .layers.find((layer) => layer.type === 'symbol')?.id
    map.addSource(SOURCE, {
      type: 'geojson',
      data: { type: 'FeatureCollection', features: [] },
    })
    map.addLayer(
      {
        id: COMMUNITY_FILL,
        type: 'fill',
        source: SOURCE,
        minzoom: CITY_BOUNDARY_MIN_ZOOM,
        maxzoom: STREET_ZOOM,
        paint: { 'fill-color': ['get', 'color'], 'fill-opacity': 0.008 },
      },
      before,
    )
    map.addLayer(
      {
        id: 'community-area-casing',
        type: 'line',
        source: SOURCE,
        minzoom: CITY_BOUNDARY_MIN_ZOOM,
        maxzoom: STREET_ZOOM,
        paint: {
          'line-color': '#ffffff',
          'line-width': 2,
          'line-opacity': 0.65,
        },
      },
      before,
    )
    map.addLayer(
      {
        id: 'community-area-line',
        type: 'line',
        source: SOURCE,
        minzoom: CITY_BOUNDARY_MIN_ZOOM,
        maxzoom: STREET_ZOOM,
        paint: {
          'line-color': ['get', 'color'],
          'line-width': 1,
          'line-opacity': 0.7,
        },
      },
      before,
    )
  }
  for (const id of [
    COMMUNITY_FILL,
    'community-area-casing',
    'community-area-line',
  ]) {
    const layer = map.getLayer(id)
    if (
      layer &&
      (layer.minzoom !== CITY_BOUNDARY_MIN_ZOOM ||
        layer.maxzoom !== STREET_ZOOM)
    ) {
      map.setLayerZoomRange(id, CITY_BOUNDARY_MIN_ZOOM, STREET_ZOOM)
    }
  }
  const source = map.getSource(SOURCE) as GeoJSONSource
  source.setData({ type: 'FeatureCollection', features: areas.features })
  highlightCommunity(map, selected, hovered)
}
