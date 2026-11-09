import * as T from "three";
import reference from "./references/aquarium.json";
import { furnitureKit } from "./model-kit";
import type { CouchStyle } from "./model";

const cosine = 90 / Math.hypot(90, 34.5);
const sine = 34.5 / Math.hypot(90, 34.5);
type Rect = readonly number[];
type Point = [number, number, number];

/** Measured relief/volume construction; the supplied painting is the front-view authority. */
export function createReferenceAquarium(
  k: ReturnType<typeof furnitureKit>,
  style: CouchStyle,
) {
  const body = k.group("Aquarium volume");
  const contents = k.group("Painted aquatic layers");
  const sourceColors = reference.palette.map(
    (hex) => new T.Color(hex.slice(0, 7)),
  );
  const nativePalette = new Set<string>();
  function texture(layer: keyof typeof reference.layers, wood = false) {
    const indices = Uint8Array.from(atob(reference.layers[layer]), (ch) =>
      ch.charCodeAt(0),
    );
    const data = new Uint8Array(indices.length * 4);
    const target = new T.Color(style.fabric);
    const original = new T.Color("#ad591e");
    for (let i = 0; i < indices.length; i++) {
      const code = indices[i];
      if (!code) continue;
      let hex = reference.palette[code].slice(0, 7);
      if (wood && style.fabric.toLowerCase() !== "#ad591e") {
        const color = sourceColors[code].clone();
        color.r *= target.r / original.r;
        color.g *= target.g / original.g;
        color.b *= target.b / original.b;
        hex = "#" + color.getHexString();
      }
      data.set(
        [
          parseInt(hex.slice(1, 3), 16),
          parseInt(hex.slice(3, 5), 16),
          parseInt(hex.slice(5, 7), 16),
          255,
        ],
        i * 4,
      );
      nativePalette.add(hex);
    }
    const map = new T.DataTexture(
      data,
      reference.width,
      reference.height,
      T.RGBAFormat,
    );
    map.colorSpace = T.SRGBColorSpace;
    map.magFilter = map.minFilter = T.NearestFilter;
    map.generateMipmaps = false;
    map.needsUpdate = true;
    return map;
  }
  const oak = texture("source", true),
    water = texture("water"),
    plants = texture("plants"),
    frame = texture("frame");
  // Reference pixels map into the fixed game projection, without moving/scaling the camera.
  const point = (x: number, y: number, z: number): Point => [
    x - 48,
    (64 - y + sine * z) / cosine,
    z,
  ];
  const height = (row: number) => (64 - row) / cosine;
  function quad(
    parent: T.Object3D,
    name: string,
    points: Point[],
    rect: Rect,
    map: T.Texture,
    opacity = 1,
  ) {
    const [x, y, w, h] = rect;
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(points.flat(), 3));
    // DataTexture has no image flip; preserve the original top-to-bottom pixel indices.
    g.setAttribute(
      "uv",
      new T.Float32BufferAttribute(
        [
          x / 96,
          y / 64,
          (x + w) / 96,
          y / 64,
          (x + w) / 96,
          (y + h) / 64,
          x / 96,
          (y + h) / 64,
        ],
        2,
      ),
    );
    g.setIndex([0, 3, 2, 0, 2, 1]);
    g.computeVertexNormals();
    return k.referenceMesh(parent, name, g, map, opacity);
  }
  function patch(
    parent: T.Object3D,
    name: string,
    rect: Rect,
    z: number,
    map: T.Texture,
  ) {
    const [x, y, w, h] = rect;
    return quad(
      parent,
      name,
      [
        point(x, y, z),
        point(x + w, y, z),
        point(x + w, y + h, z),
        point(x, y + h, z),
      ],
      rect,
      map,
    );
  }
  function side(
    x: number,
    y0: number,
    y1: number,
    front: number,
    rear: number,
    name: string,
    rect: Rect,
    map: T.Texture,
    opacity = 1,
  ) {
    return quad(
      body,
      name,
      [
        [x, y1, front],
        [x, y1, rear],
        [x, y0, rear],
        [x, y0, front],
      ],
      rect,
      map,
      opacity,
    );
  }
  const depth = 8 / sine,
    lidTop = height(10),
    lidBottom = height(14);
  // A real roof: its eight painted image rows are the top surface, not a tall front billboard.
  quad(
    body,
    "Painted hood top",
    [
      [-44, lidTop, -depth],
      [44, lidTop, -depth],
      [44, lidTop, 0],
      [-44, lidTop, 0],
    ],
    [4, 2, 88, 8],
    oak,
  );
  patch(body, "Painted hood front lip", [4, 10, 88, 4], 0, oak);
  for (const sign of [-1, 1]) {
    quad(
      body,
      "Solid hood side",
      [
        [sign * 44, lidTop, 0],
        [sign * 40, lidTop, -depth],
        [sign * 40, lidBottom, -depth],
        [sign * 44, lidBottom, 0],
      ],
      [5, 10, 18, 4],
      oak,
    );
    side(
      sign * 44,
      height(62),
      height(44),
      0,
      -depth,
      "Cabinet side door",
      [6, 46, 20, 16],
      oak,
    );
    side(
      sign * 41,
      height(43),
      height(14),
      0,
      -depth,
      "Illustrated glass side",
      [8, 18, 20, 24],
      water,
      0.2,
    );
  }
  quad(
    body,
    "Finished hood rear",
    [
      [40, lidTop, -depth],
      [-40, lidTop, -depth],
      [-40, lidBottom, -depth],
      [40, lidBottom, -depth],
    ],
    [4, 10, 88, 4],
    oak,
  );
  quad(
    body,
    "Finished cabinet rear",
    [
      [44, height(44), -depth],
      [-44, height(44), -depth],
      [-44, height(62), -depth],
      [44, height(62), -depth],
    ],
    [4, 44, 88, 18],
    oak,
  );
  quad(
    body,
    "Cabinet upper surface",
    [
      [-44, height(44), -depth],
      [44, height(44), -depth],
      [44, height(44), 0],
      [-44, height(44), 0],
    ],
    [3, 43, 90, 5],
    oak,
  );
  patch(
    body,
    "Source cabinet molding doors and feet",
    [3, 43, 90, 21],
    0.01,
    oak,
  );
  patch(body, "Painted left plinth return", [3, 36, 2, 7], 0.05, oak);
  patch(body, "Painted right plinth return", [91, 36, 2, 7], 0.05, oak);
  // Feet have volume; their front markings remain supplied artwork.
  for (const x of [-40.5, 41]) {
    side(x - 2, 0, height(61), -0.1, -5, "Foot inner side", [5, 60, 5, 4], oak);
    side(x + 2, 0, height(61), -0.1, -5, "Foot outer side", [5, 60, 5, 4], oak);
    quad(
      body,
      "Foot sole",
      [
        [x - 2, 0, -0.1],
        [x + 2, 0, -0.1],
        [x + 2, 0, -5],
        [x - 2, 0, -5],
      ],
      [5, 61, 5, 1],
      oak,
    );
  }
  for (const x of [-40.5, 41]) {
    for (const sideX of [x - 2, x + 2])
      side(
        sideX,
        0,
        height(61),
        -depth + 5,
        -depth,
        "Rear foot side",
        [5, 60, 5, 4],
        oak,
      );
    quad(
      body,
      "Rear foot back",
      [
        [x - 2, height(61), -depth],
        [x + 2, height(61), -depth],
        [x + 2, 0, -depth],
        [x - 2, 0, -depth],
      ],
      [5, 61, 5, 3],
      oak,
    );
  }
  // A continuous rim and corner posts keep the side glass visibly inside the tank.
  for (const x of [-43, 43]) {
    side(
      x,
      height(43),
      height(42),
      0,
      -depth,
      "Tank lower side rim",
      [5, 42, 1, 1],
      frame,
    );
    side(
      x,
      height(15),
      height(14),
      0,
      -depth,
      "Tank upper side rim",
      [5, 14, 1, 1],
      frame,
    );
  }
  // Source blue, tint and plants are authored colors, not refractive/relit glass.
  patch(contents, "Clean source water", [7, 14, 82, 29], -2.5, water);
  patch(
    contents,
    "Source foreground plants and gravel",
    [7, 14, 82, 29],
    -1.2,
    plants,
  );
  patch(body, "Source tank edge linework", [5, 14, 86, 29], 0.03, frame);
  quad(
    body,
    "Teal rear tank backing",
    [
      [41, height(14), -depth + 0.1],
      [-41, height(14), -depth + 0.1],
      [-41, height(43), -depth + 0.1],
      [41, height(43), -depth + 0.1],
    ],
    [7, 14, 82, 29],
    water,
  );
  // Crossed planted cards fill the tank's depth in the side view; hidden behind the source front water.
  for (const [x, region] of [
    [-29, [8, 19, 20, 24]],
    [0, [29, 29, 18, 14]],
    [28, [66, 20, 20, 23]],
  ] as const) {
    const [sx, sy, sw, sh] = region;
    quad(
      contents,
      "Depth planted foliage",
      [
        [x, height(sy), -4],
        [x, height(sy), -20],
        [x, height(sy + sh), -20],
        [x, height(sy + sh), -4],
      ],
      [sx, sy, sw, sh],
      plants,
    );
  }
  const fish = reference.landmarks.fish.map((rect, index) => {
    const group = k.group("Source swimming fish " + (index + 1), contents);
    const map = texture(index === 0 ? "fish1" : "fish2");
    patch(group, "Painted fish profile", rect, -0.4, map);
    const [x, y, w, h] = rect,
      center = point(x + w / 2, y + h / 2, -0.4);
    // An orthogonal profile gives the illustrated fish a readable side-facing volume.
    quad(
      group,
      "Fish side profile",
      [
        [center[0], center[1] + h / cosine / 2, -7 - w / 2],
        [center[0], center[1] + h / cosine / 2, -7 + w / 2],
        [center[0], center[1] - h / cosine / 2, -7 + w / 2],
        [center[0], center[1] - h / cosine / 2, -7 - w / 2],
      ],
      rect,
      map,
    );
    return group;
  });
  function animate(phase: number) {
    const t = phase * Math.PI * 2;
    fish.forEach((f, index) =>
      f.position.set(
        Math.sin(t) * (index ? -2.4 : 2.8),
        (Math.cos(t) - 1) * 0.22,
        0,
      ),
    );
  }
  animate(0);
  k.root.userData.reference = {
    source: reference.source,
    sha256: reference.sha256,
    render: reference.render,
    landmarks: reference.landmarks,
    representation:
      "Volumetric source-painted cabinet/hood/tank; layered flora and two animated crossed fish profiles. Rear and side artwork are authored interpretations.",
  };
  return {
    top: lidTop,
    grounds: [[-45, -depth, 90, depth]] as [number, number, number, number][],
    approach: [0, 0, 20],
    palette: [...nativePalette],
    animate,
  };
}
