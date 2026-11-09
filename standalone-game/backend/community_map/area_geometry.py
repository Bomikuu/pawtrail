"""Import-time polygon validation and explicitly custom two-way partitions."""
import json
import math
from shapely import make_valid
from shapely.geometry import shape, mapping, box, Polygon, MultiPolygon, GeometryCollection
from shapely.ops import unary_union

MAX_VERTICES = 100_000

def polygon(value):
    if not isinstance(value, dict) or value.get('type') not in ['Polygon', 'MultiPolygon']:
        raise ValueError('Supply a GeoJSON Polygon or MultiPolygon.')
    count = 0
    def points(node):
        nonlocal count
        if isinstance(node, (list, tuple)) and len(node) >= 2 and all(isinstance(v, (int, float)) and not isinstance(v, bool) for v in node[:2]):
            count += 1
            if count > MAX_VERTICES or len(node) != 2 or not all(math.isfinite(v) for v in node) or not -180 <= node[0] <= 180 or not -85 <= node[1] <= 85:
                raise ValueError('Boundary coordinates are invalid or too complex.')
        elif isinstance(node, (list, tuple)) and node:
            for child in node: points(child)
        else:
            raise ValueError('Boundary rings are empty or malformed.')
    points(value.get('coordinates'))
    result = shape(value)
    if not result.is_valid:
        result = make_valid(result)
    if isinstance(result, GeometryCollection):
        result = unary_union([g for g in result.geoms if isinstance(g, (Polygon, MultiPolygon))])
    if not isinstance(result, (Polygon, MultiPolygon)) or result.is_empty or not result.is_valid or result.area <= 0:
        raise ValueError('The boundary must contain a valid non-empty area.')
    return result

def geometry_fields(geometry):
    geometry = polygon(mapping(geometry))
    west, south, east, north = geometry.bounds
    center = geometry.representative_point()
    display = geometry.simplify(0.00001, preserve_topology=True)
    return dict(geometry=mapping(geometry), display_geometry=mapping(display), west=west, south=south, east=east, north=north,
        center=[center.x, center.y], area_km2=geometry.area * 111.32 ** 2 * math.cos(math.radians(geometry.centroid.y)))

def divide(geometry, axis=None, cut=None):
    west, south, east, north = geometry.bounds
    axis = axis or ('longitude' if (east-west)*math.cos(math.radians(geometry.centroid.y)) >= north-south else 'latitude')
    if axis not in ['longitude', 'latitude']: raise ValueError('Choose longitude or latitude.')
    lo, hi = (west, east) if axis == 'longitude' else (south, north)
    cut = (lo + hi) / 2 if cut is None else float(cut)
    if not math.isfinite(cut) or not lo < cut < hi: raise ValueError('The split must lie inside the parent bounds.')
    shapes = [box(west-1, south-1, cut, north+1), box(cut, south-1, east+1, north+1)] if axis == 'longitude' else [box(west-1, south-1, east+1, cut), box(west-1, cut, east+1, north+1)]
    parts = [polygon(mapping(geometry.intersection(mask))) for mask in shapes]
    tolerance = max(geometry.area * 1e-8, 1e-12)
    if parts[0].intersection(parts[1]).area > tolerance or unary_union(parts).symmetric_difference(geometry).area > tolerance:
        raise ValueError('Custom zones must cover the parent without overlap or gaps.')
    return parts, dict(method='long-axis-bisection-v1', axis=axis, cut=cut)
