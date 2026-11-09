import * as T from "three";
import definitions from "./definitions.json";
import { furnitureKit } from "./model-kit";
import { createReferenceAquarium } from "./aquarium";
import { createReferenceCouch } from "./couch";
import couchTurnaround from "./references/couch-turnaround.json";
import aquariumTurnaround from "./references/aquarium-turnaround.json";
export const furnitureDefinitions = definitions.items;
export type FurnitureDefinition = (typeof definitions.items)[number];
export type CouchStyle = FurnitureDefinition["styles"][number];
export const FACINGS = [0, 90, 180, 270] as const;
export const facingLabel = (rotation: number) =>
  ({ 0: "Front", 90: "Left", 180: "Back", 270: "Right" })[rotation] ?? "Front";
export const FURNITURE_FRAME = { width: 96, height: 112, anchor: [48, 96] };
const ink = "#38271e";
type Rect3 = [number, number, number, number];

export function createFurniture(
  definition: FurnitureDefinition,
  style: CouchStyle,
) {
  const k = furnitureKit(),
    { root, group, box, round } = k;
  root.name = definition.label;
  const base = group("base"),
    back = group("back"),
    left = group("leftArm"),
    right = group("rightArm"),
    apron = group("apron");
  let seats: { id: string; point: number[] }[] = [],
    grounds: Rect3[] = [],
    top = 40,
    approach = [0, 0, 54],
    sensor: Rect3 | undefined,
    seatSupport: { height: number; front: number } | undefined;
  let animate = (_phase: number, _force: number) => {};
  const palette = [
    ink,
    style.fabric,
    style.light,
    style.shade,
    style.pillow,
    style.wood,
    "#dc854b",
    "#ffd482",
    "#528977",
    "#226a65",
    "#b3e0d5",
    "#4e8748",
    "#9cb768",
    "#d6b77e",
    "#b15431",
    "#cf6d3b",
    "#cfbf9c",
    "#b9aa86",
    "#fff0d1",
    "#003e38",
    "#00695e",
    "#008e81",
    "#06bcb5",
    "#24d5c9",
    "#005850",
    "#1d7739",
    "#91bf47",
  ];
  if (definition.model === "couch") {
    const couch = createReferenceCouch(k, style);
    top = couch.top;
    grounds = couch.grounds;
    approach = couch.approach;
    seats = couch.seats;
    palette.push(...couch.palette);
    seatSupport = couch.seatSupport;
  } else if (definition.model === "curtain") {
    top = 57;
    grounds = [
      [-32, -5, 6, 10],
      [26, -5, 6, 10],
    ];
    sensor = [-25, -8, 50, 16];
    approach = [0, 0, 38];
    for (const x of [-29, 29]) {
      box(base, "Carved timber post", style.wood, x, 27, 0, 5, 54, 8, 0.8);
      box(base, "Post edge glint", "#ce9148", x - 1, 27, 4.2, 1, 48, 0.7, 0.1);
      box(
        base,
        "Post inner dark edge",
        ink,
        x + (x < 0 ? 1.7 : -1.7),
        27,
        4,
        1,
        50,
        0.8,
        0.1,
      );
      box(base, "Foot block", style.wood, x, 2, 0, 8, 4, 11, 0.5);
    }
    box(base, "Top cornice", style.wood, 0, 55, 0, 68, 5, 11, 1);
    box(base, "Cornice lip", "#ce9148", 0, 57, 3, 66, 1, 8, 0.3);
    box(base, "Cornice lower shadow", ink, 0, 52.5, 3.8, 65, 1.2, 1, 0.2);
    box(base, "Wooden threshold", style.wood, 0, 0.7, 0, 67, 1.4, 11, 0.4);
    round(base, "Curtain rod", "#d6b77e", 0, 51, 2, 65, 2, 2);
    const cloths: T.Group[] = [];
    for (const side of [-1, 1]) {
      const cloth = group("Pleated cloth " + side);
      cloth.position.set(side * 18, 50, 3);
      cloths.push(cloth);
      const geometry = new T.PlaneGeometry(18, 44, 18, 20),
        vertices = geometry.getAttribute("position");
      for (let i = 0; i < vertices.count; i++) {
        const x = vertices.getX(i),
          y = vertices.getY(i),
          v = (22 - y) / 44,
          pinch = 1 - 0.35 * Math.exp(-((v - 0.58) ** 2) / 0.025);
        vertices.setXYZ(
          i,
          x * pinch + side * 2 * Math.sin(v * Math.PI),
          y,
          Math.cos((x / 18) * Math.PI * 6) * 1.1,
        );
      }
      geometry.computeVertexNormals();
      const sheet = k.mesh(
        cloth,
        "Draped woven fabric",
        style.fabric,
        [0, -22, 0],
        geometry,
      );
      (sheet.material as T.MeshBasicMaterial).side = T.DoubleSide;
      for (let i = 0; i < 6; i++)
        round(
          base,
          "Rod ring",
          "#d6b77e",
          side * 18 + (i - 2.5) * 3,
          51,
          2,
          2.2,
          2.8,
          2.1,
        );
      box(cloth, "Weighted hem", style.shade, 0, -43, 0, 18, 1.3, 2, 0.4);
      box(cloth, "Tie band", style.wood, 0, -25, 1.4, 18, 1.5, 1, 0.2);
    }
    animate = (_phase, force) => {
      for (const cloth of cloths) {
        cloth.rotation.z = force * 0.14;
        cloth.rotation.x = force * 0.08;
      }
    };
  } else if (definition.model === "aquarium") {
    const aquarium = createReferenceAquarium(k, style);
    top = aquarium.top;
    grounds = aquarium.grounds;
    approach = aquarium.approach;
    palette.push(...aquarium.palette);
    animate = aquarium.animate;
  } else {
    k.dispose();
    throw new Error("Furniture model is not registered.");
  }
  for (const seat of seats) {
    const socket = new T.Object3D();
    socket.name = seat.id;
    socket.position.set(...(seat.point as [number, number, number]));
    root.add(socket);
  }
  return {
    ...k,
    palette: [...palette, ...k.colors],
    seats,
    grounds,
    top,
    approach,
    sensor,
    animate,
    preservePaint:
      definition.model === "aquarium" || definition.model === "couch",
    seatSupport,
    foreground(rotation: number) {
      if (definition.model !== "couch") {
        for (const g of Object.values(k.groups)) g.visible = false;
        return;
      }
      const visible =
        rotation === 0
          ? ["leftArm", "rightArm"]
          : rotation === 90
            ? ["rightArm"]
            : rotation === 180
              ? ["back", "leftArm", "rightArm"]
              : ["leftArm"];
      for (const [name, g] of Object.entries(k.groups))
        g.visible =
          visible.includes(name) ||
          (name.startsWith("Flower pillow") && visible.includes("back"));
    },
  };
}
export const createCouch = (style: CouchStyle) =>
  createFurniture(furnitureDefinitions[0], style);
export function furnitureCamera(rotation = 0, definition?: FurnitureDefinition) {
  const camera = new T.OrthographicCamera(-48, 48, 96, -16, 0.1, 300);
  const calibration = definition?.model === "couch" ? couchTurnaround.projection
      : definition?.model === "aquarium" ? aquariumTurnaround.projection : undefined,
    power = calibration && "blendPower" in calibration ? calibration.blendPower : 4,
    basePitch = Math.atan2(34.5, 90),
    profileWeight = Math.sin(rotation * Math.PI / 180) ** power,
    pitch = calibration
      ? basePitch + (calibration.sidePitchDegrees * Math.PI / 180 - basePitch) * profileWeight
      : basePitch;
  camera.position.set(0, Math.tan(pitch) * 90, 90);
  camera.lookAt(0, 0, 0);
  camera.updateMatrixWorld();
  return camera;
}
export function projectedGeometry(
  rotation: number,
  definition: FurnitureDefinition = furnitureDefinitions[0],
) {
  const camera = furnitureCamera(rotation, definition),
    turn = new T.Matrix4().makeRotationY((-rotation * Math.PI) / 180);
  // The game actor keeps its shared native projection. Dock its pelvis to
  // the couch's projected seat instead of changing the actor's sprite/camera.
  const nativeCos = 90 / Math.hypot(90, 34.5),
    viewCos = 90 / Math.hypot(90, camera.position.y),
    hipHeight = definition.model === "couch" ? 5.8 * nativeCos / viewCos : 5.8;
  const project = (p: number[]) => {
    const v = new T.Vector3(...(p as [number, number, number]))
      .applyMatrix4(turn)
      .project(camera);
    return [Math.round((v.x + 1) * 48), Math.round((1 - v.y) * 56)];
  };
  const model = createFurniture(definition, definition.styles[0]);
  try {
    const rect = (r: Rect3) => {
      const [x, z, w, d] = r,
        pts = [
          [x, 0, z],
          [x + w, 0, z],
          [x, 0, z + d],
          [x + w, 0, z + d],
        ].map(project);
      const xx = Math.min(...pts.map((p) => p[0])),
        yy = Math.min(...pts.map((p) => p[1]));
      return [
        xx,
        yy,
        Math.max(...pts.map((p) => p[0])) - xx,
        Math.max(...pts.map((p) => p[1])) - yy,
      ];
    };
    const ground = model.grounds.map(rect),
      exit = project(model.approach),
      all = model.grounds.flatMap((r) => [
        [r[0], r[1]],
        [r[0] + r[2], r[1] + r[3]],
      ]),
      xx = Math.min(...all.map((p) => p[0])),
      zz = Math.min(...all.map((p) => p[1])),
      ww = Math.max(...all.map((p) => p[0])) - xx,
      dd = Math.max(...all.map((p) => p[1])) - zz;
    const footprint = rect([xx, zz, ww, dd]),
      anchor = project([0, 0, 0]),
      highest = Math.min(
        ...[xx, xx + ww].flatMap((x) =>
          [zz, zz + dd].map((z) => project([x, model.top, z])[1]),
        ),
      );
    const reaction =
      definition.model === "couch"
        ? undefined
        : definition.model === "curtain"
          ? { kind: "sway", fps: 10, sensor: rect(model.sensor!) }
          : { kind: "loop", fps: 6 };
    return {
      width: 96,
      height: 112,
      anchor,
      indicatorHeight: anchor[1] - highest + 5,
      footprint,
      reaction,
      geometry: {
        version: 2,
        ground,
        placement: [footprint],
        approaches:
          definition.model === "curtain"
            ? [exit, project([0, 0, -38])]
            : [exit],
        seats: model.seats.map((s) => ({
          id: s.id,
          point: project([s.point[0], 0, s.point[2]]),
          facing: "down",
          elevation:
            project([s.point[0], 0, s.point[2]])[1] -
            project([s.point[0], s.point[1] - hipHeight, s.point[2]])[1],
          exit,
        })),
        surfaces: [],
        occlusion: "base",
        actions:
          definition.model === "couch"
            ? ["sit", "inspect"]
            : definition.model === "aquarium"
              ? ["care_aquarium", "inspect"]
              : ["inspect"],
      },
    };
  } finally {
    model.dispose();
  }
}
