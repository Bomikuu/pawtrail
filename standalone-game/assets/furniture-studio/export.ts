import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { PixelFurniture } from "../../src/game/furniture/renderer";
import {
  createFurniture,
  furnitureDefinitions,
  FACINGS,
  projectedGeometry,
} from "../../src/game/furniture/model";
import { furnitureTurnaround } from '../../src/game/furniture/references/turnarounds';
function visibleBounds(canvas: HTMLCanvasElement) {
  const { width, height } = canvas, data = canvas.getContext('2d')!.getImageData(0,0,width,height).data;
  let left = width, top = height, right = -1, bottom = -1;
  for (let y = 0; y < height; y++) for (let x = 0; x < width; x++) if (data[(y*width+x)*4+3]) {
    left = Math.min(left,x); top = Math.min(top,y); right = Math.max(right,x); bottom = Math.max(bottom,y);
  }
  return right < 0 ? [0,0,width,height] : [left,top,right-left+1,bottom-top+1];
}

(window as any).exportFurniture = async (id: string, preview = false) => {
  const definition = furnitureDefinitions.find((item) => item.id === id);
  if (!definition) throw Error("Unknown furniture definition");
  const renderer = new PixelFurniture(
      definition.styles[0],
      undefined,
      definition,
    ),
    frames: object[] = [];
  const views = new Map(FACINGS.map(rotation => [rotation, projectedGeometry(rotation, definition)]));
  const blank = document.createElement('canvas'); blank.width=96; blank.height=112;
  const blankPNG = blank.toDataURL('image/png').split(',')[1];
  try {
    for (const [index,style] of (preview ? definition.styles.slice(0,1) : definition.styles).entries()) {
      if (index) renderer.style(style);
      for (const rotation of FACINGS) {
        const base = renderer.frame(rotation);
        const bounds = visibleBounds(base);
        const image = base
          .toDataURL("image/png")
          .split(",")[1];
        const front = preview ? blankPNG : renderer
          .frame(rotation, -1, true)
          .toDataURL("image/png")
          .split(",")[1];
        frames.push({
          style: style.id,
          rotation,
          image,
          front,
          view: { ...views.get(rotation)!, visibleBounds: bounds },
          motion:
            !preview && ["curtain", "aquarium"].includes(definition.model)
              ? Array.from({ length: 9 }, (_, index) => ({
                  image: renderer
                    .frame(
                      rotation,
                      -1,
                      false,
                      index / 9,
                      definition.model === "curtain" ? (index - 4) / 4 : 0,
                    )
                    .toDataURL("image/png")
                    .split(",")[1],
                  front: renderer
                    .frame(
                      rotation,
                      -1,
                      true,
                      index / 9,
                      definition.model === "curtain" ? (index - 4) / 4 : 0,
                    )
                    .toDataURL("image/png")
                    .split(",")[1],
                })) : [],
        });
        await new Promise(requestAnimationFrame);
      }
    }
    if (!preview && definition.styles.length > 1) renderer.style(definition.styles[0]);
    const seated: { rotation: number; image: string; seat?: number; pose?: string }[] =
      preview && !renderer.seatCount ? [] : FACINGS.map((rotation) => ({
        rotation,
        pose: renderer.seatCount ? 'sit' : 'stand',
        image: renderer.frame(rotation, renderer.seatCount ? 0 : -2).toDataURL("image/png").split(",")[1],
      }));
    if (renderer.seatCount === 1) for (const rotation of FACINGS) seated.push({rotation,pose:'stand',image:renderer.frame(rotation,-2).toDataURL('image/png').split(',')[1]});
    const fit = preview && !renderer.seatCount ? null : renderer.seatFit();
    const turnaround = furnitureTurnaround(definition.model)
      ? [45, 135].map((rotation) => ({ rotation,
          image: renderer.frame(rotation).toDataURL("image/png").split(",")[1] }))
      : [];
    for (const rotation of FACINGS)
      for (const seat of [1, -3])
        if (!preview && definition.model === "couch")
          seated.push({
            rotation,
            image: renderer
              .frame(rotation, seat)
              .toDataURL("image/png")
              .split(",")[1],
            seat,
          });
    let model = '';
    if (!preview) {
      const couch = createFurniture(definition, definition.styles[0]);
      try {
      const binary = (await new GLTFExporter().parseAsync(couch.root, {
        binary: true,
      })) as ArrayBuffer;
      model = await new Promise((resolve) => {
        const reader = new FileReader();
        reader.onload = () => resolve(String(reader.result).split(",")[1]);
        reader.readAsDataURL(new Blob([binary]));
      });
      } finally {
        couch.dispose();
      }
    }
    const response = await fetch("/__furniture/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, preview, frames, model, seated, fit, turnaround }),
    });
    if (!response.ok) throw Error(await response.text());
    document.querySelector("p")!.textContent = "Furniture export complete.";
    return response.json();
  } finally {
    renderer.dispose();
  }
};
