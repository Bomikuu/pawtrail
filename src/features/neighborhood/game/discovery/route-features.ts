import type { WalkingRoute } from "./directions";
import type { Point } from "./types";
import { metersBetween } from "./geo";

export function routeFeatures(route: WalkingRoute | null) {
  const features: {
    type: "Feature";
    properties: { kind: string };
    geometry: { type: "LineString"; coordinates: Point[] };
  }[] = [];
  if (route) {
    features.push({
      type: "Feature",
      properties: { kind: "route" },
      geometry: { type: "LineString", coordinates: route.coordinates },
    });
    for (const points of [
      [route.origin, route.coordinates[0]],
      [route.coordinates[route.coordinates.length - 1], route.destination],
    ])
      if (metersBetween(points[0], points[1]) > 2)
        features.push({
          type: "Feature",
          properties: { kind: "connector" },
          geometry: { type: "LineString", coordinates: points },
        });
  }
  return { type: "FeatureCollection" as const, features };
}
