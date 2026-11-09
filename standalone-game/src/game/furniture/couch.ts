import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import original from "./references/couch.json";
import turnaround from "./references/couch-turnaround.json";
import { furnitureKit } from "./model-kit";
import type { CouchStyle } from "./model";

const c = 90 / Math.hypot(90, 34.5),
  s = 34.5 / Math.hypot(90, 34.5);
type Layer = keyof typeof original.layers;
type MaterialKind = keyof typeof turnaround.patches;
type PartKind = "fabric" | "cushion" | "arm" | "rear" | "pillow" | "wood";

/** Shared volumetric construction fitted to the reviewed six-view furniture turnaround. */
export function createReferenceCouch(
  k: ReturnType<typeof furnitureKit>,
  style: CouchStyle,
) {
  const palette = new Set<string>(),
    cache = new Map<string, T.Texture>();
  const groups = k.groups;
  const tint = (hex: string, wood = false) => {
    const fabric = original.materials.fabric.includes(hex);
    if (!fabric && !wood) return hex;
    const targetHex = wood ? style.wood : style.fabric,
      baseHex = wood ? "#ce9148" : "#898a4a";
    if (targetHex.toLowerCase() === baseHex) return hex;
    const value = new T.Color(hex),
      base = new T.Color(baseHex),
      target = new T.Color(targetHex);
    if (fabric) {
      const a = value.getHSL({ h: 0, s: 0, l: 0 }),
        b = base.getHSL({ h: 0, s: 0, l: 0 }),
        t = target.getHSL({ h: 0, s: 0, l: 0 });
      const l =
        a.l >= b.l
          ? t.l + ((1 - t.l) * (a.l - b.l)) / (1 - b.l)
          : (t.l * a.l) / b.l;
      value.setHSL(
        t.h + a.h - b.h,
        Math.min(1, t.s * (0.7 + (0.3 * a.s) / Math.max(0.01, b.s))),
        Math.min(0.96, Math.max(0.04, l)),
      );
    } else {
      value.r *= target.r / base.r;
      value.g *= target.g / base.g;
      value.b *= target.b / base.b;
    }
    return "#" + value.getHexString();
  };
  function texture(key: string) {
    if (cache.has(key)) return cache.get(key)!;
    let w: number, h: number, pixels: Uint8Array;
    if (key.startsWith("front:")) {
      w = h = 64;
      pixels = new Uint8Array(w * h * 4);
      const name = key.slice(6) as Layer,
        codes = Uint8Array.from(atob(original.layers[name]), (v) =>
          v.charCodeAt(0),
        );
      for (let i = 0; i < codes.length; i++) {
        if (!codes[i]) continue;
        if (name.startsWith("pillow")) {
          const hex = original.palette[codes[i]].slice(0, 7);
          if (original.materials.fabric.includes(hex)) continue;
        }
        const hex = tint(
          original.palette[codes[i]].slice(0, 7),
          name === "feet" &&
            !original.materials.fabric.includes(
              original.palette[codes[i]].slice(0, 7),
            ),
        );
        pixels.set(
          [1, 3, 5].map((o) => parseInt(hex.slice(o, o + 2), 16)).concat(255),
          i * 4,
        );
        palette.add(hex);
      }
      // Complete the material outside the photographed layer. Alpha-cut front
      // paintings otherwise punch holes through rounded side/rear silhouettes.
      const opaque = Array.from({ length: w * h }, (_, i) => i).filter(
        (i) => pixels[i * 4 + 3] !== 0 &&
          (!name.startsWith("pillow") || pixels[i * 4] > 140),
      );
      for (let i = 0; i < w * h; i++) {
        if (pixels[i * 4 + 3]) continue;
        let closest = opaque[0], distance = Infinity;
        for (const q of opaque) {
          const d = (i % w - q % w) ** 2 +
            (Math.floor(i / w) - Math.floor(q / w)) ** 2;
          if (d < distance) {
            distance = d;
            closest = q;
          }
        }
        pixels.set(pixels.slice(closest * 4, closest * 4 + 4), i * 4);
      }
    } else {
      const patch = turnaround.patches[key as MaterialKind];
      w = patch.width;
      h = patch.height;
      pixels = Uint8Array.from(atob(patch.rgba), (v) => v.charCodeAt(0));
      for (let i = 0; i < pixels.length; i += 4) {
        const hex = tint(
          "#" +
            Array.from(pixels.slice(i, i + 3))
              .map((v) => v.toString(16).padStart(2, "0"))
              .join(""),
          key === "wood",
        );
        pixels.set(
          [1, 3, 5].map((o) => parseInt(hex.slice(o, o + 2), 16)),
          i,
        );
        palette.add(hex);
      }
    }
    const map = new T.DataTexture(pixels, w, h, T.RGBAFormat);
    map.colorSpace = T.SRGBColorSpace;
    map.magFilter = map.minFilter = T.NearestFilter;
    map.generateMipmaps = false;
    map.needsUpdate = true;
    cache.set(key, map);
    return map;
  }
  function part(
    parent: T.Object3D,
    name: string,
    geo: T.BufferGeometry,
    position: number[],
    front: Layer | null,
    kind: PartKind = "fabric",
    angles = [0, 0, 0],
  ) {
    let geometry = geo.index ? geo.toNonIndexed() : geo;
    if (geometry !== geo) geo.dispose();
    const localBounds = new T.Box3().setFromBufferAttribute(
      geometry.getAttribute("position") as T.BufferAttribute);
    const transform = new T.Matrix4().compose(
        new T.Vector3(...(position as [number, number, number])),
        new T.Quaternion().setFromEuler(
          new T.Euler(...(angles as [number, number, number])),
        ),
        new T.Vector3(1, 1, 1),
      );
    const inverse = transform.clone().invert();
    geometry.applyMatrix4(transform);
    const p = geometry.getAttribute("position"),
      n = geometry.getAttribute("normal"),
      buckets = new Map<string, { p: number[]; uv: number[] }>();
    for (let i = 0; i < p.count; i += 3) {
      const normal = new T.Vector3();
      for (let j = 0; j < 3; j++)
        normal.add(new T.Vector3(n.getX(i + j), n.getY(i + j), n.getZ(i + j)));
      normal.normalize();
      const isTop = normal.y > 0.65,
        isBottom = normal.y < -0.7,
        axis = Math.abs(normal.x) > Math.abs(normal.z) ? "x" : "z";
      let key: string, mode: string;
      if (kind === "wood") {
        key = "wood";
        mode = axis;
      } else if (kind === "pillow") {
        key = normal.z > 0.4 || isTop ? "front:" + front : "pillowEdge";
        mode = "local-front";
      } else if (kind === "cushion") {
        if (normal.z > 0.55) {
          key = "front:" + front;
          mode = "local-front";
        } else if (normal.z < -0.55) {
          key = "cushionRear";
          mode = "rear-cushion";
        } else {
          key = isTop ? "upper" : "cushionSide";
          mode = isTop ? "top" : "side";
        }
      } else if (kind === "arm") {
        key = normal.z > 0.65 && !isTop ? "front:" + front : "arm";
        mode = key.startsWith("front:") ? "front" : "side";
      } else if (kind === "rear" && normal.z < 0.6) {
        key = "rearPanel";
        mode = "rear";
      } else if ((axis === "z" && normal.z > 0 && !isBottom) || isTop) {
        key = front ? "front:" + front : "edge";
        mode = front ? "front" : "top";
      } else if (axis === "z" && normal.z < 0 && !isBottom) {
        key = "rear";
        mode = "rear";
      } else {
        key = isBottom ? "rear" : "side";
        mode = axis === "x" ? "side" : "rear";
      }
      if (!buckets.has(key)) buckets.set(key, { p: [], uv: [] });
      const bucket = buckets.get(key)!;
      for (let j = 0; j < 3; j++) {
        const x = p.getX(i + j),
          y = p.getY(i + j),
          z = p.getZ(i + j);
        bucket.p.push(x, y, z);
        const local = new T.Vector3(x, y, z).applyMatrix4(inverse),
          localSize = localBounds.getSize(new T.Vector3()),
          horizontal = (local.x - localBounds.min.x) / localSize.x,
          vertical = (localBounds.max.y - local.y) / localSize.y,
          depth = (localBounds.max.z - local.z) / localSize.z,
          crop = front === "pillowLeft" ? [9, 27, 18, 16]
            : front === "pillowRight" ? [37, 27, 17, 16]
            : front === "backLeft" ? [8, 13, 24, 26] : [32, 13, 24, 26];
        const u = mode === "local-front" && key.startsWith("front:")
          ? (crop[0] + crop[2] * horizontal) / 64
          : mode === "front" ? (x + 32) / 64
          : mode === "side" ? depth
          : mode === "rear" || mode === "rear-cushion" ? 1 - horizontal
          : horizontal;
        const v = mode === "local-front" && key.startsWith("front:")
          ? (crop[1] + crop[3] * vertical) / 64
          : mode === "front" ? (55 - c * y + s * z) / 64
          : mode === "top" ? depth
          : mode === "rear-cushion" ? Math.min(1, vertical / 0.6)
          : vertical;
        bucket.uv.push(u, v);
      }
    }
    geometry.dispose();
    for (const [key, data] of buckets) {
      const g = new T.BufferGeometry();
      g.setAttribute("position", new T.Float32BufferAttribute(data.p, 3));
      g.setAttribute("uv", new T.Float32BufferAttribute(data.uv, 2));
      g.computeVertexNormals();
      k.referenceMesh(parent, name + " · " + key, g, texture(key));
    }
  }
  function box(
    parent: T.Object3D,
    name: string,
    pos: number[],
    dims: number[],
    radius: number,
    front: Layer | null,
    kind: PartKind = "fabric",
    rot = [0, 0, 0],
  ) {
    part(
      parent,
      name,
      new RoundedBoxGeometry(
        dims[0],
        dims[1],
        dims[2],
        4,
        Math.min(radius, ...dims.map((v) => v / 2)),
      ),
      pos,
      front,
      kind,
      rot,
    );
  }
  // Each axis has its own cushion radius: a thin arm can still have a
  // deeply rounded Y/Z profile instead of inheriting width/2 as its limit.
  function paddedBox(
    parent: T.Object3D,
    name: string,
    position: number[],
    dimensions: number[],
    radii: number[],
    front: Layer | null,
    kind: PartKind,
    angles = [0, 0, 0],
  ) {
    const half = new T.Vector3(...dimensions.map((value) => value / 2) as [number, number, number]),
      radius = new T.Vector3(...radii as [number, number, number]),
      core = half.clone().sub(radius),
      geometry = new T.BoxGeometry(...dimensions as [number, number, number], 18, 18, 24),
      positions = geometry.getAttribute("position");
    for (let index = 0; index < positions.count; index++) {
      const point = new T.Vector3().fromBufferAttribute(positions, index),
        closest = point.clone().clamp(core.clone().negate(), core),
        normal = point.clone().sub(closest).divide(radius).normalize();
      point.copy(closest).add(normal.multiply(radius));
      if (kind === "arm") {
        // Rolled padding over a slimmer lower frame. The broad upper lobe
        // must read from the rear as well as from the front.
        point.x *= 0.70 + 0.38 * Math.exp(-(((point.y - 3.5) / 4.5) ** 2));
      }
      positions.setXYZ(index, point.x, point.y, point.z);
    }
    geometry.computeVertexNormals();
    part(parent, name, geometry, position, front, kind, angles);
  }
  function back(x: number, key: Layer) {
    const width = 22.8, height = 19.5, depth = 12.4,
      rows = 48, columns = 56, positions: number[] = [], indices: number[] = [];
    for (let row = 0; row <= rows; row++) {
      const normalized = row / rows * 2 - 1,
        y = normalized * height / 2,
        widthAtHeight = width / 2 * Math.max(0, 1 - Math.abs(normalized) ** 3.2) ** (1 / 3.2),
        depthAtHeight = depth / 2 * Math.sqrt(Math.max(0, 1 - normalized ** 2));
      for (let column = 0; column <= columns; column++) {
        const angle = column / columns * Math.PI * 2,
          cosine = Math.cos(angle), sine = Math.sin(angle);
        positions.push(widthAtHeight * Math.sign(cosine) * Math.abs(cosine) ** 0.55,
          y, depthAtHeight * Math.sign(sine) * Math.abs(sine) ** 0.55);
        if (row < rows && column < columns) {
          const i = row * (columns + 1) + column, next = i + columns + 1;
          indices.push(i, next, i + 1, i + 1, next, next + 1);
        }
      }
    }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    geometry.setIndex(indices);
    geometry.computeVertexNormals();
    part(groups.back, "Rounded upholstered back cushion", geometry,
      [x, 27.6, -14.6], key, "cushion", [-0.08, 0, 0]);
  }
  paddedBox(groups.back, "Lower rounded rear panel",
    [0, 14.4, -18.7], [46.5, 22.2, 4], [5.5, 4.8, 1.4], "source", "rear");
  box(groups.base, "Closed upholstered lower frame",
    [0, 5.7, -4.8], [42, 5.8, 33], 1.4, "apron");
  back(-11.5, "backLeft");
  back(11.5, "backRight");
  for (const [x, key] of [[-9.3, "seatLeft"], [9.3, "seatRight"]] as const)
    box(groups.base, "Rounded separate seat pad", [x, 8.2, -1],
      [18.8, 4.4, 26.8], 1.5, key);
  for (const [parent, x, key] of [
    [groups.leftArm, -23.7, "leftArm"],
    [groups.rightArm, 23.7, "rightArm"],
  ] as const)
    paddedBox(parent, "Rounded continuous padded arm",
      [x, 12.1, -3.5], [8.6, 18, 33], [2.2, 6.2, 7], key, "arm");
  for (const [side, key] of [[-1, "pillowLeft"], [1, "pillowRight"]] as const) {
    const group = k.group("Flower pillow " + side, groups.back);
    paddedBox(group, "Soft angled floral pillow",
      [side * 14, 19.4, -9], [16, 14.6, 4.4], [1.7, 1.7, 1.4],
      key, "pillow", [-0.14, side * 0.5, side * 0.2]);
  }
  for (const x of [-21, 21])
    for (const z of [-17.8, 10.8])
      box(groups.base, "Short honey timber foot", [x, 2.25, z],
        [4.4, 4.5, 4.4], 0.4, null, "wood");
  k.root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(k.root);
  k.root.userData.reference = {
    source: original.source,
    sha256: original.sha256,
    render: original.render,
    turnaround: turnaround.sheet,
    sheetSha256: turnaround.sheetSha256,
    viewProjection: turnaround.projection,
    representation:
      "Shared rounded cushions, anisotropic arm padding and lowered rear panel, with dedicated reference-aligned front, side and rear upholstery maps.",
  };
  return {
    seats: [-9.3, 9.3].map((x, index) => ({
      id: "seat-" + (index + 1),
      point: [x, 10.4, 6],
    })),
    top: bounds.max.y,
    grounds: [[-27, -21.3, 54, 34.3]] as [number, number, number, number][],
    approach: [0, 0, 36],
    palette: [...palette],
    seatSupport: { height: 10.4, front: 10.9 },
  };
}
