import * as T from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";
import { paintedSkin, skinUV, type SkinPart } from "./skins";
export { characterColors } from "./skins";
export type ModelOptions = {
  kind: "player" | "cat";
  identity: string;
  hair?: string;
  outfit?: string;
  coat?: string;
  size?: number;
  head?: number;
  yaw?: number;
};
type Joint = {
  node: T.Group;
  role: "leg" | "arm";
  side: number;
  front: boolean;
  base: T.Vector3;
};
export type Rig = {
  root: T.Group;
  upper: T.Group;
  chest: T.Mesh;
  head: T.Group;
  headBase: T.Vector3;
  limbs: T.Group[];
  joints: Joint[];
  tail?: T.Group;
  tailTip?: T.Group;
  ears: T.Group[];
  skin: ReturnType<typeof paintedSkin>;
  seed: number;
  motion: {
    yaw: number;
    initialized: boolean;
    lastTime: number;
    phase: number;
    walk: number;
  };
  dispose: () => void;
};
const cache = new Map<string, T.BufferGeometry>();
function finish(source: T.BufferGeometry, part: SkinPart) {
  const g = source.index ? source.toNonIndexed() : source,
    position = g.getAttribute("position"),
    normal = g.getAttribute("normal"),
    positions: number[] = [],
    normals: number[] = [],
    uvs: number[] = [],
    colors: number[] = [];
  for (let i = 0; i < position.count; i += 3) {
    const nx = (normal.getX(i) + normal.getX(i + 1) + normal.getX(i + 2)) / 3,
      ny = (normal.getY(i) + normal.getY(i + 1) + normal.getY(i + 2)) / 3,
      nz = (normal.getZ(i) + normal.getZ(i + 1) + normal.getZ(i + 2)) / 3;
    const axis =
        Math.abs(nx) > Math.abs(ny) && Math.abs(nx) > Math.abs(nz)
          ? "x"
          : Math.abs(ny) > Math.abs(nz)
            ? "y"
            : "z",
      face =
        axis === "x"
          ? nx > 0
            ? 0
            : 1
          : axis === "y"
            ? ny > 0
              ? 2
              : 3
            : nz > 0
              ? 4
              : 5;
    for (let j = 0; j < 3; j++) {
      const k = i + j,
        x = position.getX(k),
        y = position.getY(k),
        z = position.getZ(k);
      const u =
          face === 0
            ? (-z + 1) / 2
            : face === 1
              ? (z + 1) / 2
              : face === 2 || face === 3
                ? (x + 1) / 2
                : face === 4
                  ? (x + 1) / 2
                  : (1 - x) / 2,
        v = face === 2 ? (1 - z) / 2 : face === 3 ? (z + 1) / 2 : (y + 1) / 2;
      const uv = skinUV(part, face, u, v),
        light =
          normal.getY(k) * 0.5 + normal.getZ(k) * 0.22 - normal.getX(k) * 0.15,
        shade = light < -0.3 ? 0.86 : light < 0.05 ? 0.94 : 1;
      positions.push(x, y, z);
      normals.push(normal.getX(k), normal.getY(k), normal.getZ(k));
      uvs.push(...uv);
      colors.push(shade, shade, shade);
    }
  }
  const result = new T.BufferGeometry();
  result.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
  result.setAttribute("normal", new T.Float32BufferAttribute(normals, 3));
  result.setAttribute("uv", new T.Float32BufferAttribute(uvs, 2));
  result.setAttribute("color", new T.Float32BufferAttribute(colors, 3));
  g.dispose();
  if (g !== source) source.dispose();
  return result;
}
function geometry(shape: "orb" | "box" | "hair" | "ear", part: SkinPart) {
  const key = shape + ":" + part,
    cached = cache.get(key);
  if (cached) return cached;
  let source: T.BufferGeometry;
  if (shape === "orb") source = new T.SphereGeometry(1, 14, 10);
  else if (shape === "box") {
    source = new RoundedBoxGeometry(2, 2, 2, 2, 0.45);
  } else if (shape === "hair") {
    const positions: number[] = [],
      indices: number[] = [],
      cols = 16,
      rows = 9;
    for (let y = 0; y <= rows; y++)
      for (let x = 0; x <= cols; x++) {
        const phi = (x / cols) * Math.PI * 2,
          front = (Math.cos(phi) + 1) / 2,
          theta = (y / rows) * (2.15 - 0.84 * front);
        positions.push(
          Math.sin(phi) * Math.sin(theta),
          Math.cos(theta),
          Math.cos(phi) * Math.sin(theta),
        );
      }
    for (let y = 0; y < rows; y++)
      for (let x = 0; x < cols; x++) {
        const a = y * (cols + 1) + x,
          b = a + cols + 1;
        indices.push(a, b, a + 1, b, b + 1, a + 1);
      }
    source = new T.BufferGeometry();
    source.setAttribute("position", new T.Float32BufferAttribute(positions, 3));
    source.setIndex(indices);
    source.computeVertexNormals();
  } else {
    source = new T.BufferGeometry();
    source.setAttribute(
      "position",
      new T.Float32BufferAttribute(
        [-1, -1, 0.6, 1, -1, 0.6, 0, 1, 0, -1, -1, -0.6, 1, -1, -0.6, 0, 1, 0],
        3,
      ),
    );
    source.setIndex([
      0, 1, 2, 4, 3, 5, 3, 0, 2, 3, 2, 5, 1, 4, 5, 1, 5, 2, 3, 4, 1, 3, 1, 0,
    ]);
    source.computeVertexNormals();
  }
  const g = finish(source, part);
  cache.set(key, g);
  return g;
}
export function createModel(o: ModelOptions): Rig {
  const skin = paintedSkin(o.identity, o.kind, o),
    p = skin.palette,
    id = skin.identity,
    root = new T.Group(),
    upper = new T.Group(),
    limbs: T.Group[] = [],
    joints: Joint[] = [],
    ears: T.Group[] = [],
    materials: T.MeshBasicMaterial[] = [];
  root.add(upper);
  const mat = (face = false) => {
    const m = new T.MeshBasicMaterial({
      map: face ? skin.faceTexture : skin.texture,
      vertexColors: true,
      toneMapped: false,
    });
    materials.push(m);
    return m;
  };
  const main = mat(),
    face = mat(true),
    outline = new T.MeshBasicMaterial({
      color: "#49342d",
      side: T.BackSide,
      toneMapped: false,
    });
  materials.push(outline);
  const mesh = (
    parent: T.Group,
    part: SkinPart,
    x: number,
    y: number,
    z: number,
    w: number,
    h: number,
    d: number,
    shape: "orb" | "box" | "hair" | "ear" = "orb",
    rim = false,
  ) => {
    const g = geometry(shape, part),
      m = new T.Mesh(g, part === "head" ? face : main);
    m.position.set(x, y, z);
    m.scale.set(w / 2, h / 2, d / 2);
    parent.add(m);
    if (rim) {
      const edge = new T.Mesh(g, outline);
      edge.scale.setScalar(1.035);
      m.add(edge);
    }
    return m;
  };
  const group = (parent: T.Group, x: number, y: number, z: number) => {
    const g = new T.Group();
    g.position.set(x, y, z);
    parent.add(g);
    return g;
  };
  const joint = (
    x: number,
    y: number,
    z: number,
    role: Joint["role"],
    side: number,
    front = true,
  ) => {
    const g = group(role === "arm" ? upper : root, x, y, z);
    limbs.push(g);
    joints.push({ node: g, role, side, front, base: g.position.clone() });
    return g;
  };
  let head: T.Group,
    chest: T.Mesh,
    tail: T.Group | undefined,
    tailTip: T.Group | undefined;
  if (o.kind === "player") {
    chest = mesh(upper, "torso", 0, 15.5, 0, 10.8, 10.2, 7.5, "box", true);
    mesh(upper, "ear", 0, 21.3, 0, 3.5, 3, 3.5);
    for (const side of [-1, 1]) {
      const leg = joint(side * 2.5, 10.3, 0, "leg", side);
      mesh(leg, "leg", 0, -3.7, 0, 3.7, 7.7, 4, "box");
      mesh(leg, "foot", 0, -8.7, 1, 4.4, 3.1, 5.7, "box", true);
      const arm = joint(side * 6.4, 20.2, 0, "arm", side);
      mesh(arm, "arm", 0, -3.4, 0, 3.8, 7.6, 4.1, "orb");
    }
    mesh(upper, "bag", 0, 16.5, -4.6, 7.5, 7.6, 3.4, "box", true);
    head = group(upper, 0, 27.7, 0.25);
    head.scale.setScalar(o.head ?? 1);
    mesh(head, "head", 0, 0, 0, 17.8, 15.7, 13, "orb", true);
    mesh(head, "hair", 0, 0.2, -0.15, 19.1, 17, 14.3, "hair", true);
    // Sculpted forelocks, not a square cap or face artwork containing hair.
    const bang = mesh(head, "hair", -2.9, 3.6, 5.9, 8.5, 4.6, 2.8);
    bang.rotation.z = 0.24;
    const fringe = mesh(head, "hair", 4.4, 4.3, 5, 5.1, 4.1, 3);
    fringe.rotation.z = -0.22;
    for (const side of [-1, 1]) {
      mesh(head, "ear", side * 8.5, -0.6, 0, 2.4, 3.6, 2.3);
      if (p.style === "glasses")
        mesh(head, "hair", side * 7, -3.3, -2.3, 3.6, 8.1, 5);
    }
    if (id === "male-violet-volunteer")
      for (const [x, y] of [
        [-5, 6],
        [-1, 7],
        [3, 6.7],
        [6, 5.5],
      ])
        mesh(head, "hair", x, y, 1.8, 5, 4, 5);
    if (p.style === "hat") {
      mesh(head, "hat", 0, 8.7, 0, 21, 2.1, 17);
      mesh(head, "hat", 0, 10.7, -0.5, 13, 6, 12, "orb", true);
    }
  } else {
    chest = mesh(upper, "torso", 0, 8.6, -1.4, 11.6, 10.5, 17.4, "orb", true);
    for (const side of [-1, 1])
      for (const z of [-5.2, 5]) {
        const leg = joint(side * 3.8, 6.3, z, "leg", side, z > 0);
        mesh(leg, "leg", 0, -2.3, 0, 3.3, 5.2, 3.4);
        mesh(leg, "foot", 0, -5.3, 0.7, 3.7, 2, 4, "orb");
      }
    head = group(upper, 0, 13.9, 7);
    head.scale.setScalar(o.head ?? 1);
    mesh(head, "head", 0, 0, 0, 14.8, 12.1, 11.8, "orb", true);
    for (const side of [-1, 1]) {
      const ear = group(head, side * 4.9, 6.5, -0.4);
      ear.rotation.z = -side * 0.16;
      ears.push(ear);
      mesh(ear, "ear", 0, 0, 0, 4.9, 5.8, 3.7, "ear", true);
    }
    tail = group(upper, 0, 10.7, -9);
    mesh(tail, "tail", 0, 2, -1.2, 2.6, 6, 2.6);
    tailTip = group(tail, 0, 4.6, -1.2);
    tailTip.rotation.x = -0.32;
    mesh(tailTip, "tail", 0, 1.4, 0, 2.3, 4, 2.3);
  }
  root.scale.setScalar(o.size ?? 1);
  const seed =
    [...id].reduce((n, c) => (n * 31 + c.charCodeAt(0)) % 10007, 0) / 10007;
  return {
    root,
    upper,
    chest,
    head,
    headBase: head.position.clone(),
    limbs,
    joints,
    tail,
    tailTip,
    ears,
    skin,
    seed,
    motion: { yaw: 0, initialized: false, lastTime: 0, phase: 0, walk: 0 },
    dispose() {
      skin.dispose();
      materials.forEach((m) => m.dispose());
    },
  };
}
export type MotionInput = {
  distance?: number;
  reducedMotion?: boolean;
  exactYaw?: boolean;
};
const damp = (from: number, to: number, rate: number, dt: number) =>
  from + (to - from) * (1 - Math.exp(-rate * dt));
export function pose(
  r: Rig,
  kind: ModelOptions["kind"],
  action: string,
  time: number,
  yaw: number,
  input: MotionInput = {},
) {
  const m = r.motion,
    dt = m.lastTime
      ? Math.max(0, Math.min((time - m.lastTime) / 1000, 0.05))
      : 1 / 60;
  m.lastTime = time;
  if (!m.initialized) {
    m.yaw = yaw;
    m.initialized = true;
  }
  m.yaw = input.exactYaw
    ? yaw
    : m.yaw +
      Math.atan2(Math.sin(yaw - m.yaw), Math.cos(yaw - m.yaw)) *
        (1 - Math.exp(-18 * dt));
  r.root.rotation.y = m.yaw;
  const walk = /walk|run|wander/.test(action),
    sit = /sit|rest|perch/.test(action),
    sleep = /sleep/.test(action),
    care = /pet|feed|water|pick|play|eat|drink/.test(action),
    t = time / 1000 + r.seed * 20,
    reduced = input.reducedMotion ?? false;
  m.walk = damp(m.walk, walk ? 1 : 0, walk ? 14 : 18, dt);
  m.phase +=
    (Math.max(0, Math.min(input.distance ?? (walk ? 85 * dt : 0), 12)) /
      (kind === "player" ? 32 : 24)) *
    Math.PI *
    2;
  const idle = (1 - m.walk) * (care ? 0 : 1),
    breath = reduced ? 0 : Math.sin(t * (sleep ? 1.7 : 2.15)),
    weight = reduced ? 0 : Math.sin(t * 0.72) * idle;
  // Feet remain planted; breathing moves the upper body, not the collision actor.
  r.upper.position.y = damp(
    r.upper.position.y,
    reduced
      ? 0
      : breath * (kind === "player" ? 0.3 : 0.22) +
          Math.cos(m.phase * 2) * 0.16 * m.walk,
    12,
    dt,
  );
  r.chest.scale.y =
    ((kind === "player" ? 10.2 : 10.5) / 2) *
    (1 + (reduced ? 0 : breath * (sleep ? 0.018 : 0.009)));
  r.root.rotation.z = damp(
    r.root.rotation.z,
    sleep ? 0.85 : weight * 0.008,
    12,
    dt,
  );
  for (const j of r.joints) {
    const phase =
        kind === "player"
          ? j.role === "leg"
            ? j.side
            : -j.side
          : j.front
            ? j.side
            : -j.side,
      stride =
        Math.sin(m.phase) * phase * (j.role === "arm" ? 0.29 : 0.48) * m.walk;
    const idleArm =
        j.role === "arm" && !reduced
          ? 0.035 * Math.sin(t * 1.4 + j.side * 0.6) * idle
          : 0,
      target = sleep
        ? -0.45
        : sit
          ? j.role === "leg"
            ? -1
            : -0.1
          : care && kind === "player" && j.role === "arm"
            ? -0.8
            : stride + idleArm;
    j.node.rotation.x = damp(j.node.rotation.x, target, 20, dt);
    j.node.position.y =
      j.base.y +
      (j.role === "leg" && !sit && !sleep
        ? Math.max(0, Math.sin(m.phase) * phase) * 0.35 * m.walk
        : 0);
  }
  r.head.position.y = r.headBase.y + (reduced ? 0 : breath * 0.06);
  r.head.rotation.x = damp(
    r.head.rotation.x,
    /eat|drink|feed/.test(action)
      ? 0.2 + (reduced ? 0 : Math.sin(t * 4) * 0.035)
      : reduced
        ? 0
        : Math.sin(t * 0.65) * 0.012 * idle,
    12,
    dt,
  );
  r.head.rotation.y = damp(
    r.head.rotation.y,
    reduced ? 0 : Math.sin(t * 0.42) * 0.035 * idle,
    10,
    dt,
  );
  const blinkCycle = t % (4.6 + r.seed * 1.8);
  r.skin.setBlink(sleep || blinkCycle < 0.15);
  for (let i = 0; i < r.ears.length; i++) {
    const twitch = reduced
      ? 0
      : Math.pow(Math.max(0, Math.sin(t * 0.8 + i * 1.7)), 18) * 0.1;
    r.ears[i].rotation.z = (i === 0 ? 0.16 : -0.16) + twitch;
  }
  if (r.tail) {
    r.tail.rotation.z = damp(
      r.tail.rotation.z,
      reduced ? 0 : Math.sin(t * (care ? 4 : 1.3)) * 0.22,
      12,
      dt,
    );
    r.tail.rotation.x = damp(r.tail.rotation.x, sit ? 0.6 : 0, 12, dt);
  }
  if (r.tailTip)
    r.tailTip.rotation.z = reduced ? 0 : Math.sin(t * 1.6 - 0.7) * 0.18;
}
export function modelStage() {
  const scene = new T.Scene(),
    camera = new T.OrthographicCamera(-24, 24, 30, -30, 0.1, 200);
  camera.position.set(0, 52, 85);
  camera.lookAt(0, 17, 0);
  camera.updateMatrixWorld();
  const foot = new T.Vector3(0, 0, 0).project(camera);
  return { scene, camera, footAnchor: (1 - foot.y) / 2 };
}
export function pixelRenderer(width = 48, height = 60) {
  const renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: true,
  });
  renderer.setPixelRatio(1);
  renderer.setSize(width, height, false);
  renderer.setClearColor(0, 0);
  renderer.outputColorSpace = T.SRGBColorSpace;
  renderer.toneMapping = T.NoToneMapping;
  return renderer;
}
