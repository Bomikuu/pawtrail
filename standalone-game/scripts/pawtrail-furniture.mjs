#!/usr/bin/env node
// Furniture asset production, not game navigation, a build or an application test.
import fs from "node:fs/promises";
import path from "node:path";
import { createHash } from "node:crypto";
import { execFile } from "node:child_process";
import { promisify } from "node:util";
import { createServer } from "vite";

const root = path.resolve(import.meta.dirname, ".."),
  args = process.argv.slice(2);
const value = (name) => args[args.indexOf(name) + 1];
if (args[0] !== "render" || !args.includes("--id"))
  throw Error(
    "Use: node scripts/pawtrail-furniture.mjs render --id studio-couch [--install]",
  );
const definitions = JSON.parse(
  await fs.readFile(
    path.join(root, "src/game/furniture/definitions.json"),
    "utf8",
  ),
);
const definition = definitions.items.find((item) => item.id === value("--id"));
if (!definition || !/^[a-z0-9-]+$/.test(definition.id))
  throw Error("Choose an existing furniture definition.");
const port = 5184,
  origin = `http://127.0.0.1:${port}`,
  session = "pawtrail-furniture-" + process.pid;
const run = promisify(execFile);
const writeJSON = async (file, value) => {
  const temporary = file + ".tmp-" + process.pid;
  await fs.writeFile(temporary, JSON.stringify(value, null, 2) + "\n");
  await fs.rename(temporary, file);
};
// Nonvisual Firefox capture metadata must not churn the native asset revision.
function stablePNG(encoded) {
  const bytes = Buffer.from(encoded, "base64");
  if (
    !bytes.subarray(0, 8).equals(Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]))
  )
    throw Error("Invalid PNG frame");
  const chunks = [bytes.subarray(0, 8)];
  for (let offset = 8; offset < bytes.length;) {
    const end = offset + bytes.readUInt32BE(offset) + 12;
    if (end > bytes.length) throw Error("Incomplete PNG frame");
    if (bytes.toString("ascii", offset + 4, offset + 8) !== "deBG")
      chunks.push(bytes.subarray(offset, end));
    offset = end;
  }
  return Buffer.concat(chunks).toString("base64");
}
const cli = async (command) => {
  const result = await run(
    "npx",
    [
      "--yes",
      "--package",
      "@playwright/cli",
      "playwright-cli",
      "-s=" + session,
      ...command,
    ],
    { cwd: root, timeout: 180000, maxBuffer: 2000000 },
  );
  if (result.stdout.includes("### Error")) throw Error(result.stdout);
  return result.stdout;
};
let installed;
const server = await createServer({
  root,
  configFile: false,
  optimizeDeps: { entries: ["assets/furniture-studio/export.html"] },
  server: {
    host: "127.0.0.1",
    port,
    strictPort: true,
    watch: { ignored: ["**/public/**", "**/assets/**/exports/**"] },
  },
  plugins: [
    {
      name: "furniture-export",
      configureServer(vite) {
        vite.middlewares.use(
          "/__furniture/export",
          async (request, response) => {
            try {
              if (
                request.method !== "POST" ||
                request.headers.origin !== origin
              ) {
                response.statusCode = 403;
                response.end();
                return;
              }
              let size = 0;
              const chunks = [];
              for await (const chunk of request) {
                size += chunk.length;
                if (size > 24000000)
                  throw Error("Furniture export exceeds 24 MB");
                chunks.push(chunk);
              }
              const data = JSON.parse(Buffer.concat(chunks).toString());
              if (
                data.id !== definition.id ||
                !Array.isArray(data.frames) ||
                data.frames.length !== definition.styles.length * 4
              )
                throw Error("Incomplete furniture render");
              const keys = new Set();
              for (const frame of data.frames) {
                const key = frame.style + ":" + frame.rotation;
                if (
                  keys.has(key) ||
                  !/^[a-z0-9-]+$/.test(frame.style) ||
                  !definition.styles.some(
                    (style) => style.id === frame.style,
                  ) ||
                  ![0, 90, 180, 270].includes(frame.rotation)
                )
                  throw Error("Invalid furniture facing");
                keys.add(key);
              }
              for (const frame of data.frames) {
                for (const image of [frame, ...(frame.motion ?? [])]) {
                  image.image = stablePNG(image.image);
                  image.front = stablePNG(image.front);
                }
              }
              const revision = createHash("sha256")
                .update(JSON.stringify({ definition, frames: data.frames }))
                .digest("hex")
                .slice(0, 12);
              const relative = `pawtrail-game/furniture-studio/${definition.id}/${revision}`,
                output = path.join(root, "public", relative);
              const source = path.join(
                root,
                "assets/furniture-studio/exports",
                definition.id,
              );
              await fs.mkdir(output, { recursive: true });
              await fs.mkdir(source, { recursive: true });
              const views = {},
                styles = definition.styles.map((style) => ({
                  id: style.id,
                  label: style.label,
                  color: style.fabric,
                  views: {},
                }));
              for (const frame of data.frames) {
                const file = `${frame.style}-${frame.rotation}.png`,
                  front = `${frame.style}-${frame.rotation}-front.png`;
                await fs.writeFile(
                  path.join(output, file),
                  Buffer.from(frame.image, "base64"),
                );
                await fs.writeFile(
                  path.join(output, front),
                  Buffer.from(frame.front, "base64"),
                );
                styles.find((style) => style.id === frame.style).views[
                  String(frame.rotation)
                ] = {
                  file: "/" + relative + "/" + file,
                  frontFile: "/" + relative + "/" + front,
                  motion: await Promise.all(
                    (frame.motion ?? []).map(async (motion, index) => {
                      const motionFile = `${frame.style}-${frame.rotation}-motion-${index}.png`,
                        frontFile = `${frame.style}-${frame.rotation}-motion-${index}-front.png`;
                      await fs.writeFile(
                        path.join(output, motionFile),
                        Buffer.from(motion.image, "base64"),
                      );
                      await fs.writeFile(
                        path.join(output, frontFile),
                        Buffer.from(motion.front, "base64"),
                      );
                      return {
                        file: "/" + relative + "/" + motionFile,
                        frontFile: "/" + relative + "/" + frontFile,
                      };
                    }),
                  ),
                };
                views[String(frame.rotation)] = frame.view;
              }
              const model = Buffer.from(data.model, "base64");
              for (const preview of data.seated ?? []) {
                if (![0, 90, 180, 270].includes(preview.rotation))
                  throw Error("Invalid seat preview facing");
                if (
                  preview.seat !== undefined &&
                  ![1, -3].includes(preview.seat)
                )
                  throw Error("Invalid seat preview slot");
                await fs.writeFile(
                  path.join(
                    source,
                    `seated-${preview.rotation}${preview.seat === undefined ? "" : "-" + (preview.seat === -3 ? "both" : preview.seat + 1)}.png`,
                  ),
                  Buffer.from(preview.image, "base64"),
                );
              }
              for (const preview of data.turnaround ?? []) {
                if (![45, 135].includes(preview.rotation))
                  throw Error("Invalid turnaround review facing");
                await fs.writeFile(path.join(source, `review-${preview.rotation}.png`),
                  Buffer.from(stablePNG(preview.image), "base64"));
              }
              if (data.fit)
                await writeJSON(path.join(source, "seat-fit.json"), data.fit);
              await fs.writeFile(path.join(source, "source-model.glb"), model);
              const first = styles[0].views["0"];
              const item = {
                id: definition.id,
                label: definition.label,
                file: first.file,
                ...views["0"],
                blocking: true,
                rotatable: true,
                category: "Living room",
                interaction: definition.model === "couch" ? "sit" : "inspect",
                price: definition.price,
                zones: ["interior"],
                supportedRotations: [0, 90, 180, 270],
                defaultStyle: styles[0].id,
                renderedViews: views,
                styles,
                construction: definition.construction,
              };
              let referenceStudy;
              if (["aquarium", "couch"].includes(definition.model)) {
                const reference = JSON.parse(
                  await fs.readFile(
                    path.join(
                      root,
                      `src/game/furniture/references/${definition.model}.json`,
                    ),
                    "utf8",
                  ),
                );
                referenceStudy = {
                  source: reference.source,
                  sha256: reference.sha256,
                  render: reference.render,
                  landmarks: reference.landmarks,
                  normalizedLandmarks: reference.normalizedLandmarks,
                  approach:
                    reference.representation ??
                    "Source-painted volumetric structure and layered illustrated contents; unseen surfaces are authored interpretations.",
                };
                if (["couch", "aquarium"].includes(definition.model)) {
                  const turnaround = JSON.parse(await fs.readFile(path.join(root,
                    `src/game/furniture/references/${definition.model}-turnaround.json`), "utf8"));
                  referenceStudy.turnaround = {
                    sheet: turnaround.sheet, sha256: turnaround.sheetSha256,
                    views: turnaround.referenceViews, dimensions: turnaround.dimensions,
                    calibration: turnaround.calibration,
                    projection: turnaround.projection,
                    reviewFacings: [45, 135],
                  };
                  referenceStudy.approach = definition.model === "couch"
                    ? "Shared rounded cushions, tapered padded arms and lower rear panel with face-aligned source paint. Calibrated profile cameras and projected contacts retain the actor's native projection."
                    : "Centered volumetric hood/cabinet with approved side/rear material maps, inward-facing water backgrounds, layered planting and two animated crossed fish profiles. Native actor projection is retained.";
                }
                await writeJSON(
                  path.join(source, "reference-camera.json"),
                  referenceStudy,
                );
                await writeJSON(
                  path.join(output, "reference-camera.json"),
                  referenceStudy,
                );
              }
              const manifest = {
                version: 1,
                id: definition.id,
                revision,
                reference: definition.reference,
                source:
                  definition.model === "aquarium"
                    ? "src/game/furniture/aquarium.ts"
                    : definition.model === "couch"
                      ? "src/game/furniture/couch.ts"
                      : "src/game/furniture/model.ts",
                definition,
                item,
                frame: definition.frame,
                filter: "nearest",
                ...(referenceStudy ? { referenceStudy } : {}),
                note: "Reference-guided authored geometry; explicit projected contacts and native foreground layers.",
              };
              await fs.writeFile(
                path.join(source, "manifest.json"),
                JSON.stringify(manifest, null, 2) + "\n",
              );
              await fs.writeFile(
                path.join(output, "manifest.json"),
                JSON.stringify(manifest, null, 2) + "\n",
              );
              const generatedPath = path.join(
                root,
                "src/game/furniture/generated.json",
              );
              const previous = JSON.parse(
                await fs.readFile(generatedPath, "utf8"),
              );
              await writeJSON(generatedPath, {
                version: 2,
                items: [
                  ...(previous.items ?? [previous]).filter(
                    (entry) => entry.id !== manifest.id,
                  ),
                  manifest,
                ],
              });
              if (args.includes("--install"))
                for (const file of [
                  "src/game/housing/catalog.json",
                  "backend/housing/catalog.json",
                ]) {
                  const destination = path.join(root, file),
                    catalog = JSON.parse(
                      await fs.readFile(destination, "utf8"),
                    );
                  catalog.items = [
                    ...catalog.items.filter((value) => value.id !== item.id),
                    item,
                  ];
                  await writeJSON(destination, catalog);
                }
              installed = {
                id: item.id,
                revision,
                images: data.frames.reduce(
                  (count, frame) => count + 2 + (frame.motion?.length ?? 0) * 2,
                  0,
                ),
                installed: args.includes("--install"),
              };
              response.setHeader("Content-Type", "application/json");
              response.end(JSON.stringify(installed));
            } catch (error) {
              response.statusCode = 500;
              response.end(error.message);
            }
          },
        );
      },
    },
  ],
});
let opened = false;
try {
  await server.listen();
  opened = true;
  await cli([
    "open",
    origin + "/assets/furniture-studio/export.html",
    "--browser=firefox",
  ]);
  console.log(
    (
      await cli([
        "run-code",
        `async(page)=>{await page.waitForFunction(()=>typeof window.exportFurniture==='function',undefined,{timeout:30000});return page.evaluate(async()=>await window.exportFurniture(${JSON.stringify(definition.id)}))}`,
      ])
    )
      .split("### Ran Playwright code")[0]
      .trim(),
  );
  if (!installed)
    throw Error("The furniture authoring page did not return an export.");
  console.log(
    "Furniture creator: http://127.0.0.1:3000/play?preview=furniture",
  );
} finally {
  if (opened) await cli(["close"]).catch(() => {});
  await server.close();
}
