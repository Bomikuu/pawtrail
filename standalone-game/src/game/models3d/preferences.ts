import type { ModelOptions } from "./model";
import manifest from "./uv-manifest.json";
import { canonicalSkinId } from "./skin-ids";
const key = "pawtrail:models3d:v1:";
export function modelPreferences(identity: string): Partial<ModelOptions> {
  try {
    const canonical = canonicalSkinId(identity);
    const candidates = [
      canonical,
      identity,
      ...Object.keys(manifest.aliases).filter(
        (id) => canonicalSkinId(id) === canonical,
      ),
    ];
    for (const id of candidates) {
      const stored = localStorage.getItem(key + id);
      if (stored) return JSON.parse(stored);
    }
  } catch {
    /* Original appearance remains available if browser storage is blocked. */
  }
  return {};
}
export function saveModelPreferences(
  identity: string,
  value: Partial<ModelOptions>,
) {
  localStorage.setItem(key + canonicalSkinId(identity), JSON.stringify(value));
  window.dispatchEvent(new Event("pawtrail:models3d"));
}
