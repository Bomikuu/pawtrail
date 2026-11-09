import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import original from "./references/couch.json";
import turnaround from "./references/couch-turnaround.json";
import { furnitureKit } from "./model-kit";
import type { CouchStyle } from "./model";

const c = 90 / Math.hypot(90, 34.5),
  s = 34.5 / Math.hypot(90, 34.5);
type Layer = keyof typeof original.layers;
type MaterialKind = "side" | "rear" | "upper" | "edge" | "wood";

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
        if (name.startsWith("pillow") && original.materials.fabric.includes(
          original.palette[codes[i]].slice(0, 7))) continue;
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
        (i) => pixels[i * 4 + 3] !== 0,
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
    kind: MaterialKind = "side",
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
    const bounds = new T.Box3().setFromBufferAttribute(p as T.BufferAttribute),
      size = bounds.getSize(new T.Vector3());
    for (let i = 0; i < p.count; i += 3) {
      const normal = new T.Vector3();
      for (let j = 0; j < 3; j++)
        normal.add(new T.Vector3(n.getX(i + j), n.getY(i + j), n.getZ(i + j)));
      normal.normalize();
      const isTop = normal.y > 0.7,
        isBottom = normal.y < -0.7,
        axis = Math.abs(normal.x) > Math.abs(normal.z) ? "x" : "z";
      let key: string, mode: string;
      if (kind === "wood") {
        key = "wood";
        mode = axis;
      } else if (isTop && kind === "upper") {
        key = "upper";
        mode = "top";
      } else if ((axis === "z" && normal.z > 0 && !isBottom) || isTop) {
        key = front ? "front:" + front : "edge";
        mode = front ? "front" : "top";
      } else if (axis === "z" && normal.z < 0 && !isBottom) {
        key = kind === "upper" ? "upper" : "rear";
        mode = "rear";
      } else {
        key = isBottom ? "rear" : kind === "upper" ? "upper" : "side";
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
          pillow = front?.startsWith("pillow") && mode === "front",
          box = front === "pillowLeft" ? [9,27,18,16] : [37,27,17,16];
        const u = pillow
          ? (box[0] + box[2] * (local.x - localBounds.min.x) / (localBounds.max.x - localBounds.min.x)) / 64
          : mode === "front"
            ? (x + 32) / 64
            : mode === "side"
              ? (z - bounds.min.z) / Math.max(0.1, size.z)
              : (x - bounds.min.x) / Math.max(0.1, size.x);
        const v = pillow
          ? (box[1] + box[3] * (localBounds.max.y - local.y) / (localBounds.max.y - localBounds.min.y)) / 64
          : mode === "front"
            ? (55 - c * y + s * z) / 64
            : mode === "top"
              ? (z - bounds.min.z) / Math.max(0.1, size.z)
              : (bounds.max.y - y) / Math.max(0.1, size.y);
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
    kind: MaterialKind = "side",
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
  function back(x: number, key: Layer) {
    // The cushion is rounded in depth as well as in its front outline.
    // A flat extruded cap reads as a vertical slab in the profile views.
    const width = 23.4, height = 26.4, depth = 13,
      rows = 40, columns = 48, positions: number[] = [], indices: number[] = [];
    const edge = (y: number, radius: number) => {
      const distance = height / 2 - Math.abs(y);
      return distance >= radius ? width / 2 : width / 2 - radius +
        Math.sqrt(Math.max(0, radius ** 2 - (radius - distance) ** 2));
    };
    for (let row = 0; row <= rows; row++) {
      const normalized = row / rows * 2 - 1, y = normalized * height / 2,
        left = -edge(y, x < 0 ? 6.5 : 3.5),
        right = edge(y, x < 0 ? 3.5 : 6.5),
        radius = depth / 2 * Math.sqrt(Math.max(0, 1 - normalized ** 2));
      for (let column = 0; column <= columns; column++) {
        const angle = column / columns * Math.PI * 2,
          cosine = Math.cos(angle), sine = Math.sin(angle);
        positions.push((left + right) / 2 + (right - left) / 2 *
          Math.sign(cosine) * Math.abs(cosine) ** 0.4,
          y, radius * Math.sign(sine) * Math.abs(sine) ** 0.4);
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
    part(groups.back, "Sculpted padded back cushion", geometry,
      [x, 24.5, -12.8], key, "upper");
  }
  // A continuous rear shell and closed lower base, with no view-facing extrusion.
  box(
    groups.back,
    "Continuous upholstered rear shell",
    [0, 16.5, -19.2],
    [48.5, 27, 4],
    2.5,
    "source",
    "rear",
  );
  box(
    groups.base,
    "Closed upholstered base",
    [0, 5.9, -3.5],
    [43, 6.2, 36],
    1.6,
    "apron",
    "rear",
  );
  back(-11.8, "backLeft");
  back(11.8, "backRight");
  for (const [x, key] of [
    [-9.3, "seatLeft"],
    [9.3, "seatRight"],
  ] as const)
    box(
      groups.base,
      "Separate seat cushion",
      [x, 8.5, -1.5],
      [18.8, 3.8, 28],
      1.4,
      key,
    );
  for (const [parent, x, key] of [
    [groups.leftArm, -24.2, "leftArm"],
    [groups.rightArm, 24.2, "rightArm"],
  ] as const) {
    box(
      parent,
      "Continuous padded arm side",
      [x, 12, -2],
      [9.6, 18, 30],
      4.2,
      key,
    );
    const roll = new T.SphereGeometry(1, 20, 14);
    roll.scale(4.8, 2.5, 15);
    part(parent, "Integrated rounded arm roll", roll, [x, 20.5, -2], key);
  }
  for (const [side, key] of [
    [-1, "pillowLeft"],
    [1, "pillowRight"],
  ] as const) {
    const group = k.group("Flower pillow " + side, groups.back);
    box(
      group,
      "Angled floral pillow",
      [side * 14.3, 18.6, -4.8],
      [17, 16, 4],
      0.8,
      key,
      "side",
      [-0.14, 0, side * 0.2],
    );
  }
  for (const x of [-21.5, 21.5])
    for (const z of [-18, 12.5])
      box(
        groups.base,
        "Honey timber foot",
        [x, 2.3, z],
        [4.8, 4.6, 4.8],
        0.35,
        null,
        "wood",
      );
  k.root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(k.root);
  k.root.userData.reference = {
    source: original.source,
    sha256: original.sha256,
    render: original.render,
    turnaround: turnaround.sheet,
    sheetSha256: turnaround.sheetSha256,
    representation:
      "Coherent rounded volumetric couch with source-painted front faces and generated-turnaround material patches; shared geometry across all facings.",
  };
  return {
    seats: [-9.3, 9.3].map((x, index) => ({
      id: "seat-" + (index + 1),
      point: [x, 10.4, 6],
    })),
    top: bounds.max.y,
    grounds: [[-28, -21.5, 56, 36]] as [number, number, number, number][],
    approach: [0, 0, 36],
    palette: [...palette],
    seatSupport: { height: 10.4, front: 11.1 },
  };
}
