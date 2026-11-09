import { GLTFExporter } from "three/addons/exporters/GLTFExporter.js";
import { PixelFurniture } from "../../src/game/furniture/renderer";
import {
  createFurniture,
  furnitureDefinitions,
  FACINGS,
  projectedGeometry,
} from "../../src/game/furniture/model";

(window as any).exportFurniture = async (id: string) => {
  const definition = furnitureDefinitions.find((item) => item.id === id);
  if (!definition) throw Error("Unknown furniture definition");
  const renderer = new PixelFurniture(
      definition.styles[0],
      undefined,
      definition,
    ),
    frames: object[] = [];
  try {
    for (const style of definition.styles) {
      renderer.style(style);
      for (const rotation of FACINGS) {
        const image = renderer
          .frame(rotation)
          .toDataURL("image/png")
          .split(",")[1];
        const front = renderer
          .frame(rotation, -1, true)
          .toDataURL("image/png")
          .split(",")[1];
        frames.push({
          style: style.id,
          rotation,
          image,
          front,
          view: projectedGeometry(rotation, definition),
          motion:
            definition.model === "couch"
              ? []
              : Array.from({ length: 9 }, (_, index) => ({
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
                })),
        });
        await new Promise(requestAnimationFrame);
      }
    }
    renderer.style(definition.styles[0]);
    const seated: { rotation: number; image: string; seat?: number }[] =
      FACINGS.map((rotation) => ({
        rotation,
        image: renderer.frame(rotation, 0).toDataURL("image/png").split(",")[1],
      }));
    const fit = renderer.seatFit();
    const turnaround = ["couch", "aquarium"].includes(definition.model)
      ? [45, 135].map((rotation) => ({ rotation,
          image: renderer.frame(rotation).toDataURL("image/png").split(",")[1] }))
      : [];
    for (const rotation of FACINGS)
      for (const seat of [1, -3])
        if (definition.model === "couch")
          seated.push({
            rotation,
            image: renderer
              .frame(rotation, seat)
              .toDataURL("image/png")
              .split(",")[1],
            seat,
          });
    const couch = createFurniture(definition, definition.styles[0]);
    let model: string;
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
    const response = await fetch("/__furniture/export", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ id, frames, model, seated, fit, turnaround }),
    });
    if (!response.ok) throw Error(await response.text());
    document.querySelector("p")!.textContent = "Furniture export complete.";
    return response.json();
  } finally {
    renderer.dispose();
  }
};
