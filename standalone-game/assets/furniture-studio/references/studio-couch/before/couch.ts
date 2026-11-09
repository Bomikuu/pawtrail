import * as T from "three";
import reference from "./references/couch.json";
import { furnitureKit } from "./model-kit";
import type { CouchStyle } from "./model";

const c = 90 / Math.hypot(90, 34.5),
  s = 34.5 / Math.hypot(90, 34.5);
type Point = [number, number, number];
type Layer = keyof typeof reference.layers;

/** Closed curved reliefs preserve the source projection while retaining physical depth. */
export function createReferenceCouch(
  k: ReturnType<typeof furnitureKit>,
  style: CouchStyle,
) {
  const { groups } = k;
  const palette = new Set<string>();
  const seatY = 8.5;
  const seatFrontZ = (48 - 60 + c * seatY) / s;
  const point = (u: number, v: number, z: number): Point => [
    u - 32,
    (60 - v + s * z) / c,
    z,
  ];
  const dome = (
    u: number,
    v: number,
    x: number,
    y: number,
    rx: number,
    ry: number,
  ) => Math.sqrt(Math.max(0, 1 - ((u - x) / rx) ** 2 - ((v - y) / ry) ** 2));
  function depth(name: Layer, u: number, v: number) {
    if (name.startsWith("back"))
      return -45 + 3.2 * dome(u, v, name === "backLeft" ? 21 : 43, 25, 13, 15);
    if (name.startsWith("pillow"))
      return (
        -30 +
        (v - 34) * 0.12 +
        1.1 * dome(u, v, name === "pillowLeft" ? 18 : 45, 34, 9, 9)
      );
    if (name.endsWith("Arm")) {
      if (v <= 41) return (v - 60 + c * 20.3) / s;
      return Math.sin(Math.min(1, (v - 41) / 14) * Math.PI) * 1.7;
    }
    if (name.startsWith("seat"))
      return v <= 48 ? (v - 60 + c * seatY) / s : seatFrontZ;
    if (name === "apron") return -14;
    return 0;
  }
  function paint(name: Layer) {
    const codes = Uint8Array.from(atob(reference.layers[name]), (char) =>
      char.charCodeAt(0),
    );
    const pixels = new Uint8Array(64 * 64 * 4);
    const colors = reference.palette.map((hex) => new T.Color(hex.slice(0, 7)));
    for (let i = 0; i < codes.length; i++) {
      if (!codes[i]) continue;
      let hex = reference.palette[codes[i]].slice(0, 7);
      const rgb = [1, 3, 5].map((offset) =>
        parseInt(hex.slice(offset, offset + 2), 16),
      );
      const green = reference.materials.fabric.includes(hex);
      const change = green
        ? [style.fabric, "#898a4a"]
        : name === "feet" && rgb[0] > 100 && rgb[1] > 45
          ? [style.wood, "#ce9148"]
          : null;
      if (change && change[0].toLowerCase() !== change[1]) {
        const value = colors[codes[i]].clone(),
          target = new T.Color(change[0]),
          original = new T.Color(change[1]);
        if (green) {
          const a = value.getHSL({ h: 0, s: 0, l: 0 }),
            b = original.getHSL({ h: 0, s: 0, l: 0 }),
            t = target.getHSL({ h: 0, s: 0, l: 0 });
          const light =
            a.l >= b.l
              ? t.l + ((1 - t.l) * (a.l - b.l)) / (1 - b.l)
              : (t.l * a.l) / b.l;
          value.setHSL(
            t.h + (a.h - b.h),
            Math.min(1, t.s * (0.7 + (0.3 * a.s) / Math.max(0.01, b.s))),
            Math.min(0.96, Math.max(0.04, light)),
          );
        } else {
          value.r *= target.r / original.r;
          value.g *= target.g / original.g;
          value.b *= target.b / original.b;
        }
        hex = "#" + value.getHexString();
      }
      pixels.set(
        [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16),
          255,
        ],
        i * 4,
      );
      palette.add(hex);
    }
    const texture = new T.DataTexture(pixels, 64, 64, T.RGBAFormat);
    texture.colorSpace = T.SRGBColorSpace;
    texture.magFilter = texture.minFilter = T.NearestFilter;
    texture.generateMipmaps = false;
    texture.needsUpdate = true;
    return { codes, texture };
  }
  function volume(name: Layer, parent: T.Object3D, extrusion: Point) {
    const { codes, texture } = paint(name);
    const positions: number[] = [],
      uvs: number[] = [],
      triangles: number[] = [],
      sideTriangles: number[] = [];
    function quad(vertices: Point[], uv: number[][], side = false) {
      const first = positions.length / 3;
      positions.push(...vertices.flat());
      uvs.push(...uv.flat());
      (side ? sideTriangles : triangles).push(
        first,
        first + 3,
        first + 2,
        first,
        first + 2,
        first + 1,
      );
    }
    const occupied = (u: number, v: number) =>
      u >= 0 && u < 64 && v >= 0 && v < 64 && !!codes[v * 64 + u];
    for (let v = 0; v < 64; v++)
      for (let u = 0; u < 64; u++) {
        if (!occupied(u, v)) continue;
        const source = [
          [u, v],
          [u + 1, v],
          [u + 1, v + 1],
          [u, v + 1],
        ];
        const front = source.map(([x, y]) => point(x, y, depth(name, x, y)));
        const rear = front.map((p) => {
          const q = p.map((value, i) => value + extrusion[i]) as Point;
          if (name === "apron" || name === "feet") q[1] = Math.max(0, q[1]);
          return q;
        });
        const uv = source.map(([x, y]) => [x / 64, y / 64]);
        const rearUV = rear.map((p) => [
          (p[0] + 32) / 64,
          (60 - c * p[1] + s * p[2]) / 64,
        ]);
        quad(front, uv);
        quad(
          [rear[3], rear[2], rear[1], rear[0]],
          [rearUV[3], rearUV[2], rearUV[1], rearUV[0]],
        );
        for (const [a, b, dx, dy] of [
          [0, 1, 0, -1],
          [1, 2, 1, 0],
          [2, 3, 0, 1],
          [3, 0, -1, 0],
        ]) {
          if (occupied(u + dx, v + dy)) continue;
          const side =
            !name.startsWith("seat") && name !== "feet" && name !== "apron";
          quad(
            [front[a], front[b], rear[b], rear[a]],
            side
              ? [
                  [0.5, 0],
                  [0.5, 0],
                  [0.5, 1],
                  [0.5, 1],
                ]
              : [uv[a], uv[b], rearUV[b], rearUV[a]],
            side,
          );
        }
      }
    const geometry = new T.BufferGeometry();
    geometry.setAttribute(
      "position",
      new T.Float32BufferAttribute(positions, 3),
    );
    geometry.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
    geometry.setIndex(triangles);
    geometry.computeVertexNormals();
    if (sideTriangles.length) {
      const walls = new T.BufferGeometry();
      walls.setAttribute("position", geometry.getAttribute("position"));
      walls.setAttribute("uv", geometry.getAttribute("uv"));
      walls.setIndex(sideTriangles);
      walls.computeVertexNormals();
      const shades = name.startsWith("pillow")
        ? [style.pillow, "#cfbf9c"]
        : name === "feet"
          ? [style.wood, "#91572d"]
          : [style.fabric, style.shade];
      const values = new Uint8Array(
        shades.flatMap((hex) =>
          [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(255),
        ),
      );
      const map = new T.DataTexture(values, 1, 2, T.RGBAFormat);
      map.colorSpace = T.SRGBColorSpace;
      map.magFilter = map.minFilter = T.NearestFilter;
      map.generateMipmaps = false;
      map.needsUpdate = true;
      k.referenceMesh(parent, "Upholstered depth " + name, walls, map);
    }
    return k.referenceMesh(parent, "Source-painted " + name, geometry, texture);
  }
  // View-ray extrusion keeps the measured source contour; the closed sides gain real depth.
  const ray = (d: number): Point => [0, -s * d, -c * d];
  volume("backLeft", groups.back, ray(7));
  volume("backRight", groups.back, ray(7));
  volume("seatLeft", groups.base, [0, -2, 0]);
  volume("seatRight", groups.base, [0, -2, 0]);
  volume("leftArm", groups.leftArm, ray(6));
  volume("rightArm", groups.rightArm, ray(6));
  volume("apron", groups.apron, ray(5));
  volume("feet", groups.base, [0, 0, -3]);
  for (const [name, side] of [
    ["pillowLeft", -1],
    ["pillowRight", 1],
  ] as const) {
    const pillow = k.group("Flower pillow " + side, groups.back);
    volume(name, pillow, ray(2.4));
  }
  // Finished padded side panels fill the rolled arms, rather than leaving an open L shell.
  const bandPixels = new Uint8Array(
    [style.light, style.fabric, style.fabric, style.shade].flatMap((hex) =>
      [1, 3, 5].map((i) => parseInt(hex.slice(i, i + 2), 16)).concat(255),
    ),
  );
  const bands = new T.DataTexture(bandPixels, 1, 4, T.RGBAFormat);
  bands.colorSpace = T.SRGBColorSpace;
  bands.magFilter = bands.minFilter = T.NearestFilter;
  bands.generateMipmaps = false;
  bands.needsUpdate = true;
  function armSide(parent: T.Object3D, x: number) {
    const shape = new T.Shape()
      .moveTo(-36, 4)
      .lineTo(-2, 4)
      .quadraticCurveTo(2, 4, 2, 8)
      .lineTo(2, 15)
      .quadraticCurveTo(2, 20.3, -3, 20.3)
      .lineTo(-35, 20.3)
      .quadraticCurveTo(-40, 20.3, -40, 15)
      .lineTo(-40, 8)
      .quadraticCurveTo(-40, 4, -36, 4);
    const g = new T.ShapeGeometry(shape, 12),
      p = g.getAttribute("position"),
      uv = g.getAttribute("uv");
    for (let i = 0; i < p.count; i++) {
      const z = p.getX(i),
        y = p.getY(i);
      p.setXYZ(i, x, y, z);
      uv.setXY(i, 0.5, (20.3 - y) / 16.3);
    }
    g.computeVertexNormals();
    k.referenceMesh(parent, "Filled upholstered arm side", g, bands);
  }
  for (const [parent, side] of [
    [groups.leftArm, -1],
    [groups.rightArm, 1],
  ] as const)
    for (const x of [20.2, 27.8]) armSide(parent, x * side);
  // A closed upholstered base supports the cushions; its front/top retain source projection.
  const atlas = paint("source").texture;
  const body = new T.BoxGeometry(38, 3.5, 32);
  body.translate(0, 4.75, -29);
  const p = body.getAttribute("position"),
    uv = body.getAttribute("uv");
  for (let i = 0; i < p.count; i++)
    uv.setXY(
      i,
      (p.getX(i) + 32) / 64,
      (60 - c * p.getY(i) + s * p.getZ(i)) / 64,
    );
  k.referenceMesh(groups.base, "Closed upholstered couch base", body, atlas);
  // Plain lower rear upholstery covers the structural base; upper cushion backs remain visible.
  const rearPixels = new Uint8Array(64 * 64 * 4),
    rearPositions: number[] = [],
    rearUV: number[] = [],
    rearIndices: number[] = [];
  const masks = ["backLeft", "backRight"].map((name) =>
    Uint8Array.from(
      atob(reference.layers[name as "backLeft" | "backRight"]),
      (ch) => ch.charCodeAt(0),
    ),
  );
  for (let v = 23; v < 39; v++)
    for (let u = 8; u < 56; u++) {
      const i = v * 64 + u;
      if (!masks.some((mask) => mask[i])) continue;
      const edge = u === 8 || u === 55 || v === 38;
      const hex =
        edge || v > 36 ? style.shade : v === 23 ? style.light : style.fabric;
      rearPixels.set(
        [1, 3, 5].map((o) => parseInt(hex.slice(o, o + 2), 16)).concat(255),
        i * 4,
      );
      const source = [
          [u, v],
          [u + 1, v],
          [u + 1, v + 1],
          [u, v + 1],
        ],
        first = rearPositions.length / 3;
      rearPositions.push(...source.flatMap(([x, y]) => point(x, y, -52.2)));
      rearUV.push(...source.flatMap(([x, y]) => [x / 64, y / 64]));
      rearIndices.push(
        first,
        first + 3,
        first + 2,
        first,
        first + 2,
        first + 1,
      );
    }
  const rearMap = new T.DataTexture(rearPixels, 64, 64, T.RGBAFormat);
  rearMap.colorSpace = T.SRGBColorSpace;
  rearMap.magFilter = rearMap.minFilter = T.NearestFilter;
  rearMap.generateMipmaps = false;
  rearMap.needsUpdate = true;
  const rearGeometry = new T.BufferGeometry();
  rearGeometry.setAttribute(
    "position",
    new T.Float32BufferAttribute(rearPositions, 3),
  );
  rearGeometry.setAttribute("uv", new T.Float32BufferAttribute(rearUV, 2));
  rearGeometry.setIndex(rearIndices);
  rearGeometry.computeVertexNormals();
  k.referenceMesh(
    groups.back,
    "Plain lower rear upholstery",
    rearGeometry,
    rearMap,
  );
  // Grounded rear supports finish the unseen structure; hidden behind the painted front.
  for (const x of [-24.5, 24.5])
    k.box(
      groups.base,
      "Rear wooden couch foot",
      style.wood,
      x,
      2,
      -36,
      4,
      4,
      4,
      0.3,
    );
  // Center the rotation pivot. Nine exact native pixels keep the source grid aligned.
  const pivotShift = 9 / s;
  for (const child of k.root.children) child.position.z += pivotShift;
  k.root.updateMatrixWorld(true);
  const bounds = new T.Box3().setFromObject(k.root);
  const seats = [-9.3, 9.3].map((x, index) => ({
    id: "seat-" + (index + 1),
    point: [x, seatY, -17 + pivotShift],
  }));
  k.root.userData.reference = {
    source: reference.source,
    sha256: reference.sha256,
    render: reference.render,
    landmarks: reference.landmarks,
    representation: reference.representation,
  };
  return {
    seats,
    top: bounds.max.y,
    grounds: [[-28, -50 + pivotShift, 56, 52]] as [
      number,
      number,
      number,
      number,
    ][],
    approach: [0, 0, 20 + pivotShift],
    palette: [...palette],
    seatSupport: { height: seatY, front: seatFrontZ + pivotShift },
  };
}
