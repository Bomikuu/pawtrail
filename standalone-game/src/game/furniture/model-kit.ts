import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

/** Independent edge radii for thin furniture panels and padded volumes. */
export function roundedFurnitureVolume(
  dimensions: [number, number, number],
  radii: [number, number, number],
) {
  const half = new T.Vector3(...dimensions).multiplyScalar(0.5),
    radius = new T.Vector3(...radii).min(half),
    core = half.clone().sub(radius),
    geometry = new T.BoxGeometry(...dimensions, 20, 12, 20),
    positions = geometry.getAttribute("position");
  for (let i = 0; i < positions.count; i++) {
    const point = new T.Vector3().fromBufferAttribute(positions, i),
      closest = point.clone().clamp(core.clone().negate(), core),
      normal = point.clone().sub(closest).divide(radius).normalize();
    point.copy(closest).add(normal.multiply(radius));
    positions.setXYZ(i, point.x, point.y, point.z);
  }
  geometry.computeVertexNormals();
  return geometry;
}

export function furnitureKit() {
  const root = new T.Group(),
    groups: Record<string, T.Group> = {},
    geometries = new Set<T.BufferGeometry>(),
    materials = new Set<T.Material>(),
    textures = new Map<string, T.Texture>(),
    colors = new Set<string>();
  function surface(color: string, name: string) {
    const mode = /water (back|volume)/i.test(name)
      ? "water"
      : /timber|cabinet|panel|cornice|door|drawer|rail|post|plinth|lid/i.test(
            name,
          )
        ? "wood"
        : /cushion|upholster|skirt|arm|woven|cloth|pillow/i.test(name) &&
            !/seam|piping|stitch|border|welt|shadow/i.test(name)
          ? "fabric"
          : "";
    if (!mode) return;
    const key = color + mode;
    if (textures.has(key)) return textures.get(key);
    const canvas = document.createElement("canvas");
    canvas.width = canvas.height = 32;
    const context = canvas.getContext("2d")!;
    const base = new T.Color(color);
    const ramp =
      mode === "water"
        ? ["#003e38", "#00695e", "#008e81", "#06bcb5", "#24d5c9"]
        : [0.58, 0.76, 0.9, 1, 1.13].map(
            (shade) => "#" + base.clone().multiplyScalar(shade).getHexString(),
          );
    for (const value of ramp) colors.add(value);
    for (let y = 0; y < 32; y++)
      for (let x = 0; x < 32; x++) {
        const cluster =
          Math.abs(
            Math.sin(Math.floor(x / 2) * 71.13 + Math.floor(y / 2) * 43.17) *
              43758.5453,
          ) % 1;
        const grain = Math.abs(Math.sin(x * 19.1 + y * 71.7) * 12515.7) % 1;
        let index =
          cluster < 0.12 ? 1 : cluster > 0.88 ? 4 : grain < 0.1 ? 2 : 3;
        if (mode === "wood")
          index = y % 8 === 0 ? 1 : y % 8 === 1 ? 4 : grain > 0.92 ? 2 : 3;
        if (mode === "water") index = y < 3 ? 4 : y < 8 ? 3 : y < 20 ? 2 : 1;
        context.fillStyle = ramp[index];
        context.fillRect(x, y, 1, 1);
      }
    const texture = new T.CanvasTexture(canvas);
    texture.colorSpace = T.SRGBColorSpace;
    texture.magFilter = T.NearestFilter;
    texture.minFilter = T.NearestFilter;
    texture.generateMipmaps = false;
    textures.set(key, texture);
    return texture;
  }
  const group = (name: string, parent: T.Object3D = root) => {
    const g = new T.Group();
    g.name = name;
    parent.add(g);
    groups[name] = g;
    return g;
  };
  const mesh = (
    parent: T.Object3D,
    name: string,
    color: string,
    position: number[],
    geometry: T.BufferGeometry,
  ) => {
    colors.add(color);
    const normals = geometry.getAttribute("normal"),
      vertexColors: number[] = [];
    for (let i = 0; i < normals.count; i++) {
      const light =
          normals.getY(i) * 0.7 +
          normals.getZ(i) * 0.2 -
          normals.getX(i) * 0.45,
        s =
          light < -0.35
            ? 0.43
            : light < -0.05
              ? 0.62
              : light < 0.3
                ? 0.9
                : light > 0.6
                  ? 1.2
                  : 1.06;
      vertexColors.push(s, s, s);
    }
    geometry.setAttribute(
      "color",
      new T.Float32BufferAttribute(vertexColors, 3),
    );
    const map = surface(color, name);
    const material = new T.MeshBasicMaterial({
        color: map ? "#ffffff" : color,
        map: map ?? null,
        vertexColors: true,
        toneMapped: false,
      }),
      item = new T.Mesh(geometry, material);
    item.name = name;
    item.position.set(...(position as [number, number, number]));
    parent.add(item);
    geometries.add(geometry);
    materials.add(material);
    return item;
  };
  /** Source-painted surfaces: no second lighting pass or procedural grain. */
  const referenceMesh = (
    parent: T.Object3D,
    name: string,
    geometry: T.BufferGeometry,
    texture: T.Texture,
    opacity = 1,
  ) => {
    const material = new T.MeshBasicMaterial({
      map: texture,
      color: "#ffffff",
      toneMapped: false,
      transparent: opacity < 1,
      opacity,
      alphaTest: opacity < 1 ? 0 : 0.5,
      side: T.DoubleSide,
      depthWrite: opacity === 1,
    });
    const item = new T.Mesh(geometry, material);
    item.name = name;
    parent.add(item);
    geometries.add(geometry);
    materials.add(material);
    textures.set("reference:" + texture.uuid, texture);
    return item;
  };
  const box = (
    p: T.Object3D,
    n: string,
    c: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    radius = 0.4,
  ) =>
    mesh(
      p,
      n,
      c,
      [x, y, z],
      new RoundedBoxGeometry(w, h, d, 2, Math.min(radius, w / 2, h / 2, d / 2)),
    );
  const round = (
    p: T.Object3D,
    n: string,
    c: string,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
  ) => {
    const item = mesh(p, n, c, [x, y, z], new T.SphereGeometry(1, 16, 12));
    item.scale.set(w / 2, h / 2, d / 2);
    return item;
  };
  return {
    root,
    colors,
    mesh,
    groups,
    group,
    box,
    round,
    referenceMesh,
    whole() {
      for (const g of Object.values(groups)) g.visible = true;
    },
    dispose() {
      for (const g of geometries) g.dispose();
      for (const m of materials) m.dispose();
      for (const texture of textures.values()) texture.dispose();
    },
  };
}
