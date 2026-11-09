import * as T from "three";
import reference from "./references/aquarium.json";
import turnaround from "./references/aquarium-turnaround.json";
import { furnitureKit, roundedFurnitureVolume } from "./model-kit";
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
  const nativePalette = new Set<string>();
  function woodColor(hex: string) {
    if (style.fabric.toLowerCase() === "#ad591e") return hex;
    const color = new T.Color(hex),
      source = new T.Color("#ad591e").getHSL({ h: 0, s: 0, l: 0 }),
      target = new T.Color(style.fabric).getHSL({ h: 0, s: 0, l: 0 }),
      value = color.getHSL({ h: 0, s: 0, l: 0 });
    const lightness = value.l >= source.l
      ? target.l + (1 - target.l) * (value.l - source.l) / (1 - source.l)
      : target.l * value.l / source.l;
    color.setHSL(target.h + value.h - source.h,
      Math.min(1, target.s * (0.7 + 0.3 * value.s / source.s)),
      Math.max(0.04, Math.min(0.96, lightness)));
    return "#" + color.getHexString();
  }
  function texture(layer: keyof typeof reference.layers, wood = false, solid = false) {
    const indices = Uint8Array.from(atob(reference.layers[layer]), (ch) =>
      ch.charCodeAt(0),
    );
    const data = new Uint8Array(indices.length * 4);
    for (let i = 0; i < indices.length; i++) {
      const code = indices[i];
      if (!code) continue;
      let hex = reference.palette[code].slice(0, 7);
      if (solid) {
        const [r, g, b] = [1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16));
        if (r <= g * 1.15 || r <= b * 1.5) continue;
      }
      if (wood) hex = woodColor(hex);
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
    if (solid) {
      const candidates = Array.from({ length: indices.length }, (_, i) => i)
        .filter((i) => data[i * 4 + 3] !== 0);
      for (let i = 0; i < indices.length; i++) {
        if (data[i * 4 + 3]) continue;
        let closest = candidates[0], distance = Infinity;
        for (const q of candidates) {
          const delta = (i % 96 - q % 96) ** 2 +
            (Math.floor(i / 96) - Math.floor(q / 96)) ** 2;
          if (delta < distance) { distance = delta; closest = q; }
        }
        data.set(data.slice(closest * 4, closest * 4 + 4), i * 4);
      }
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
  const oak = texture("source", true), solidOak = texture("source", true, true),
    water = texture("water"),
    plants = texture("plants"),
    frame = texture("frame");
  // Far glass walls need clean water, not a crop with foliage already baked
  // into its colors. Reuse the source palette for a quiet vertical water ramp.
  const waterColors = reference.palette.slice(1).map((hex) =>
    [1,3,5].map((offset) => parseInt(hex.slice(offset,offset+2),16)))
    .filter(([r,g,b]) => g > 35 && r < g * 0.5 && b > g * 0.8);
  const waterPixels = new Uint8Array(2 * 32 * 4);
  for (let y = 0; y < 32; y++) {
    const target = [0,145-y*2.1,135-y*2.0];
    const color = waterColors.reduce((best,color) =>
      color.reduce((sum,value,i)=>sum+(value-target[i])**2,0) <
      best.reduce((sum,value,i)=>sum+(value-target[i])**2,0) ? color : best);
    for (let x = 0; x < 2; x++) waterPixels.set([...color,255],(y*2+x)*4);
    nativePalette.add("#"+color.map((value)=>value.toString(16).padStart(2,"0")).join(""));
  }
  const waterBackground = new T.DataTexture(waterPixels,2,32,T.RGBAFormat);
  waterBackground.colorSpace=T.SRGBColorSpace;
  waterBackground.magFilter=waterBackground.minFilter=T.NearestFilter;
  waterBackground.generateMipmaps=false;
  waterBackground.needsUpdate=true;
  function material(name: keyof typeof turnaround.patches) {
    const patch = turnaround.patches[name],
      data = Uint8Array.from(atob(patch.rgba), (value) => value.charCodeAt(0));
    for (let i = 0; i < data.length; i += 4) {
      const source = "#" + Array.from(data.slice(i, i + 3))
        .map((value) => value.toString(16).padStart(2, "0")).join("");
      const hex = woodColor(source);
      data.set([1, 3, 5].map((offset) => parseInt(hex.slice(offset, offset + 2), 16)), i);
      nativePalette.add(hex);
    }
    const map = new T.DataTexture(data, patch.width, patch.height, T.RGBAFormat);
    map.colorSpace = T.SRGBColorSpace;
    map.magFilter = map.minFilter = T.NearestFilter;
    map.generateMipmaps = false;
    map.needsUpdate = true;
    return map;
  }
  const cabinetSide = material("cabinetSide"), cabinetRear = material("cabinetRear"),
    hoodSide = material("hoodSide"), hoodRear = material("hoodRear");
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
    oneSided = false,
  ) {
    const [x, y, w, h] = rect;
    const width = map.image.width, height = map.image.height;
    const g = new T.BufferGeometry();
    g.setAttribute("position", new T.Float32BufferAttribute(points.flat(), 3));
    // DataTexture has no image flip; preserve the original top-to-bottom pixel indices.
    g.setAttribute(
      "uv",
      new T.Float32BufferAttribute(
        [
          x / width,
          y / height,
          (x + w) / width,
          y / height,
          (x + w) / width,
          (y + h) / height,
          x / width,
          (y + h) / height,
        ],
        2,
      ),
    );
    g.setIndex([0, 3, 2, 0, 2, 1]);
    g.computeVertexNormals();
    const mesh = k.referenceMesh(parent, name, g, map, opacity);
    if (oneSided) (mesh.material as T.MeshBasicMaterial).side = T.FrontSide;
    return mesh;
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
  // One closed beveled hood; opaque material completion keeps the roof
  // intact from profile/rear views instead of exposing source-alpha cuts.
  const hoodSource = roundedFurnitureVolume(
    [89, lidTop - lidBottom, depth + 1], [6, 1.8, 3.5]);
  const hood = hoodSource.toNonIndexed();
  hoodSource.dispose();
  hood.translate(0, (lidTop + lidBottom) / 2, -depth / 2);
  const positions = hood.getAttribute("position"), normals = hood.getAttribute("normal"),
    surfaces = new Map<string, { points: number[]; uv: number[] }>();
  for (let i = 0; i < positions.count; i += 3) {
    const normal = new T.Vector3();
    for (let j = 0; j < 3; j++) normal.add(new T.Vector3(
      normals.getX(i+j), normals.getY(i+j), normals.getZ(i+j)));
    normal.normalize();
    const sideFace = Math.abs(normal.x) > Math.abs(normal.z) && normal.y < 0.65,
      rearFace = normal.z < -0.6 && normal.y < 0.65,
      key = sideFace ? "side" : rearFace ? "rear" : "source";
    if (!surfaces.has(key)) surfaces.set(key, { points: [], uv: [] });
    const surface = surfaces.get(key)!;
    for (let j = 0; j < 3; j++) {
      const x = positions.getX(i+j), y = positions.getY(i+j), z = positions.getZ(i+j);
      surface.points.push(x,y,z);
      surface.uv.push(key === "source" ? (x+48)/96 : key === "side"
        ? (0.5-z)/(depth+1) : (44.5-x)/89,
        key === "source" ? Math.max(2,Math.min(13.99,64-cosine*y+sine*z))/64
          : (lidTop-y)/(lidTop-lidBottom));
    }
  }
  hood.dispose();
  for (const [key, data] of surfaces) {
    const geometry = new T.BufferGeometry();
    geometry.setAttribute("position",new T.Float32BufferAttribute(data.points,3));
    geometry.setAttribute("uv",new T.Float32BufferAttribute(data.uv,2));
    geometry.computeVertexNormals();
    k.referenceMesh(body,"Beveled solid hood · "+key,geometry,
      key === "source" ? solidOak : key === "side" ? hoodSide : hoodRear);
  }
  for (const sign of [-1, 1]) {
    side(
      sign * 44,
      height(62),
      height(44),
      0,
      -depth,
      "Cabinet side door",
      [0, 0, 22, 18],
      cabinetSide,
    );
    side(
      sign * 41,
      height(43),
      height(14),
      0,
      -depth,
      "Illustrated glass side",
      [0, 0, 2, 32],
      waterBackground,
      0.08,
    );
  }
  quad(
    body,
    "Finished cabinet rear",
    [
      [44, height(44), -depth],
      [-44, height(44), -depth],
      [-44, height(62), -depth],
      [44, height(62), -depth],
    ],
    [0, 0, 88, 18],
    cabinetRear,
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
  quad(body, "Closed cabinet underside", [
    [-44, height(62), 0], [-44, height(62), -depth],
    [44, height(62), -depth], [44, height(62), 0],
  ], [6, 60, 80, 2], oak);
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
    quad(body, "Front foot rear face", [
      [x + 2, height(61), -5], [x - 2, height(61), -5],
      [x - 2, 0, -5], [x + 2, 0, -5],
    ], [5, 61, 5, 3], oak);
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
    quad(body, "Rear foot front face", [
      [x - 2, height(61), -depth + 5], [x + 2, height(61), -depth + 5],
      [x + 2, 0, -depth + 5], [x - 2, 0, -depth + 5],
    ], [5, 61, 5, 3], oak);
    quad(body, "Rear foot sole", [
      [x - 2, 0, -depth], [x + 2, 0, -depth],
      [x + 2, 0, -depth + 5], [x - 2, 0, -depth + 5],
    ], [5, 61, 5, 1], oak);
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
  // Opaque inward-facing backgrounds sit on the far tank wall in each view.
  // The viewer-facing wall is clear, so a front painting cannot hide fish
  // when the tank is rotated to the rear or profile.
  const waterTop = height(14), waterBottom = height(43);
  quad(contents, "Inside rear water wall", [
    [-41, waterTop, -depth + 0.15], [41, waterTop, -depth + 0.15],
    [41, waterBottom, -depth + 0.15], [-41, waterBottom, -depth + 0.15],
  ], [0, 0, 2, 32], waterBackground, 1, true);
  quad(contents, "Inside front water wall", [
    [41, waterTop, -0.15], [-41, waterTop, -0.15],
    [-41, waterBottom, -0.15], [41, waterBottom, -0.15],
  ], [0, 0, 2, 32], waterBackground, 1, true);
  for (const sign of [-1, 1]) {
    const front = sign < 0 ? 0 : -depth,
      rear = sign < 0 ? -depth : 0;
    quad(contents, "Inside profile water wall", [
      [sign * 41, waterTop, front], [sign * 41, waterTop, rear],
      [sign * 41, waterBottom, rear], [sign * 41, waterBottom, front],
    ], [0, 0, 2, 32], waterBackground, 1, true);
  }
  quad(contents, "Water chamber floor", [
    [-41, waterBottom, 0], [41, waterBottom, 0],
    [41, waterBottom, -depth], [-41, waterBottom, -depth],
  ], [7, 35, 82, 8], water);
  const frontWater = patch(contents, "Canonical front water painting",
    [7,14,82,29], -16, water);
  frontWater.material.side = T.FrontSide;
  const frontPlants = patch(
    contents,
    "Source foreground plants and gravel",
    [7, 14, 82, 29],
    -1.2,
    plants,
  );
  frontPlants.material.side = T.FrontSide;
  patch(body, "Source tank edge linework", [5, 14, 86, 29], 0.03, frame);
  quad(body, "Rear waterline", [
    [41,height(15),-depth+0.02],[-41,height(15),-depth+0.02],
    [-41,height(16),-depth+0.02],[41,height(16),-depth+0.02],
  ],[7,14,82,1],water,1,true);
  for (const sign of [-1,1])
    side(sign*41.05,height(16),height(15),0,-depth,
      "Profile waterline",[7,14,82,1],water);
  quad(
    body,
    "Rear-facing planted interior",
    [
      [41, height(14), -depth + 0.1],
      [-41, height(14), -depth + 0.1],
      [-41, height(43), -depth + 0.1],
      [41, height(43), -depth + 0.1],
    ],
    [7, 14, 82, 29],
    plants,
    1,
    true,
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
        [x, height(sy + sh) + sh / cosine * 0.45, -4],
        [x, height(sy + sh) + sh / cosine * 0.45, -20],
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
    patch(group, "Painted fish profile", rect, -8, map);
    const [x, y, w, h] = rect,
      center = point(x + w / 2, y + h / 2, -8);
    // An orthogonal profile gives the illustrated fish a readable side-facing volume.
    quad(
      group,
      "Fish side profile",
      [
        [center[0], center[1] + h / cosine / 2, -8 - w / 2],
        [center[0], center[1] + h / cosine / 2, -8 + w / 2],
        [center[0], center[1] - h / cosine / 2, -8 + w / 2],
        [center[0], center[1] - h / cosine / 2, -8 - w / 2],
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
        (Math.cos(t) - 1) * (index ? 0.65 : 0.55),
      ),
    );
  }
  animate(0);
  const pivot = depth / 2;
  body.position.z = pivot;
  contents.position.z = pivot;
  k.root.userData.reference = {
    source: reference.source,
    sha256: reference.sha256,
    render: reference.render,
    landmarks: reference.landmarks,
    turnaround: turnaround.sheet,
    sheetSha256: turnaround.sheetSha256,
    viewProjection: turnaround.projection,
    representation:
      "Centered volumetric cabinet/hood with reviewed side/rear paint, inward-facing water backgrounds and two animated crossed fish profiles. Illustrated contents are layered, not fully sculpted fish.",
  };
  return {
    top: lidTop,
    grounds: [[-45, -pivot, 90, depth]] as [number, number, number, number][],
    approach: [0, 0, 20 + pivot],
    palette: [...nativePalette],
    animate,
  };
}
