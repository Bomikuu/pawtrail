import fs from "node:fs/promises";
import path from "node:path";
const target = path.resolve(
  process.argv[2] ?? "/home/micxsz/projects/pawtrail/.worktrees/implementation",
);
const pkg = JSON.parse(
  await fs.readFile(path.join(target, "package.json"), "utf8"),
);
if (pkg.name !== "pawtrail")
  throw new Error("Target must be the existing PawTrail application.");
const dest = path.join(target, "src/features/neighborhood");
await fs.mkdir(dest, { recursive: true });
async function copySource(from, to) {
  await fs.mkdir(to, { recursive: true });
  for (const entry of await fs.readdir(from, { withFileTypes: true })) {
    const source = path.join(from, entry.name),
      output = path.join(to, entry.name);
    if (entry.isDirectory()) await copySource(source, output);
    else if (/\.(ts|tsx|css|json)$/.test(entry.name)) {
      let text = await fs.readFile(source, "utf8");
      text = text
        .replaceAll("@/game/", "@/features/neighborhood/game/")
        .replaceAll(
          "@/components/game/",
          "@/features/neighborhood/components/game/",
        );
      await fs.writeFile(output, text);
    }
  }
}
await fs.copyFile(
  "public/pawtrail-game/game-assets/animation-manifest.json",
  "src/game/runtime/native-actors.json",
);
await copySource("src/game", path.join(dest, "game"));
await copySource("src/components/game", path.join(dest, "components/game"));
// Share the same local font files with the platform's global typography layer.
await fs.mkdir(path.join(target, "public/fonts/pawtrail"), { recursive: true });
await fs.cp(
  "public/fonts/pawtrail",
  path.join(target, "public/fonts/pawtrail"),
  {
    recursive: true,
  },
);
await fs.mkdir(path.join(target, "src/styles"), { recursive: true });
await fs.copyFile(
  "src/game/fonts.css",
  path.join(target, "src/styles/pawtrail-fonts.css"),
);
const installedTheme = path.join(dest, "game/theme.css");
await fs.writeFile(
  installedTheme,
  (await fs.readFile(installedTheme, "utf8")).replace(
    "@import './fonts.css';\n",
    "",
  ),
);
let app = await fs.readFile("src/App.tsx", "utf8");
app =
  "'use client'\n" +
  app
    .replaceAll("@/game/", "@/features/neighborhood/game/")
    .replaceAll(
      "@/components/game/",
      "@/features/neighborhood/components/game/",
    );
await fs.writeFile(path.join(dest, "app.tsx"), app);
// These retired fixtures must not survive an incremental installation.
for (const file of [
  "public/pawtrail-game/maps/community-demo.json",
  "src/features/neighborhood/game/discovery/samples.ts",
  "src/features/neighborhood/game/discovery/sample-room-missions.json",
]) {
  await fs.rm(path.join(target, file), { force: true });
}
await fs.cp("public/pawtrail-game", path.join(target, "public/pawtrail-game"), {
  recursive: true,
});
// Runtime-only immersion packs. Generation masters/prompts stay in assets/.
for (const directory of [
  "missions",
  "inventory",
  "soundboard",
  "weather",
  "environment",
  "audio",
  "community",
]) {
  const source = path.join("public/assets/game", directory);
  try {
    await fs.access(source);
  } catch {
    continue;
  }
  await fs.cp(source, path.join(target, "public/assets/game", directory), {
    recursive: true,
  });
}
try {
  await fs.copyFile(
    "public/assets/game/immersion-manifest.json",
    path.join(target, "public/assets/game/immersion-manifest.json"),
  );
} catch {}
// Install only game-ready housing assets, not source renders or ZIP downloads.
const housingCatalog = JSON.parse(
  await fs.readFile("src/game/housing/catalog.json", "utf8"),
);
const housePresets = JSON.parse(
  await fs.readFile("src/game/housing/house-presets.json", "utf8"),
);
const housingFiles = new Set([
  ...housePresets.flatMap((p) => [p.thumbnail, p.preview]),
  "/assets/game/housing/furniture/cozy-room-v1/manifest.json",
  "/assets/game/housing/tilesets/door-open-housing-v1.png",
  "/assets/game/housing/tilesets/curtained-window-housing-v1.png",
  ...housingCatalog.items.map((i) => i.file),
  ...Object.values(housingCatalog.players).map((i) => i.file),
  ...Object.values(housingCatalog.cats).map((i) => i.file),
  ...Object.values(housingCatalog.effects).map((i) => i.file),
  "/assets/game/housing/exteriors/starter-house-catalog-v1.png",
  "/assets/game/housing/exteriors/mailbox-catalog-v1.png",
  "/assets/game/housing/exteriors/flowerpot-catalog-v1.png",
  ...[
    "oak-light-a",
    "wood-dark-a",
    "carpet-a",
    "ceramic-a",
    "stone",
    "patterned",
  ].map((i) => "/assets/game/housing/tilesets/" + i + "-housing-v1.png"),
  ...["cream", "sage", "beige", "blue", "wood", "wallpaper"].flatMap((s) =>
    ["north", "west", "east", "south"].map(
      (p) => "/assets/game/housing/tilesets/" + s + "-" + p + "-modular-v2.png",
    ),
  ),
]);
for (const file of housingFiles) {
  const output = path.join(target, "public", file);
  await fs.mkdir(path.dirname(output), { recursive: true });
  await fs.copyFile(path.join("public", file), output);
}
const mapAssetsRoute = path.join(
  target,
  "src/app/api/game/map-assets/route.ts",
);
await fs.mkdir(path.dirname(mapAssetsRoute), { recursive: true });
await fs.copyFile("integration/map-assets-route.ts", mapAssetsRoute);
const communityRecordsRoute = path.join(
  target,
  "src/app/api/game/community-records/route.ts",
);
await fs.mkdir(path.dirname(communityRecordsRoute), { recursive: true });
await fs.copyFile(
  "integration/community-records-route.ts",
  communityRecordsRoute,
);
const communityAreasRoute = path.join(target, "src/app/api/game/community-areas/route.ts");
await fs.mkdir(path.dirname(communityAreasRoute), { recursive: true });
await fs.copyFile("integration/community-areas-route.ts", communityAreasRoute);
const sessionRoute = path.join(target, "src/app/api/game/session/route.ts");
await fs.mkdir(path.dirname(sessionRoute), { recursive: true });
await fs.writeFile(
  sessionRoute,
  (
    await fs.readFile("integration/housing-session-route.ts", "utf8")
  ).replaceAll("@/game/", "@/features/neighborhood/game/"),
);

const route = path.join(target, "src/app/(game)/play");
await fs.mkdir(route, { recursive: true });
await fs.writeFile(
  path.join(dest, "client.tsx"),
  await fs.readFile("integration/game-client.tsx", "utf8"),
);
for (const file of [
  "platform-bridge.ts",
  "map-quests.ts",
  "database-bridge.ts",
  "game-return-link.tsx",
]) {
  const source = (
    await fs.readFile(path.join("integration", file), "utf8")
  ).replaceAll("@/game/", "@/features/neighborhood/game/");
  await fs.writeFile(path.join(dest, file), source);
}
const layoutFile = path.join(target, "src/app/layout.tsx");
let layout = await fs.readFile(layoutFile, "utf8");
// Use Next's direct global CSS entry, avoiding Tailwind's nested import resolver.
if (!layout.includes("import '../styles/pawtrail-fonts.css'")) {
  layout = "import '../styles/pawtrail-fonts.css'\n" + layout;
  await fs.writeFile(layoutFile, layout);
}
if (!layout.includes("<GameReturnLink")) {
  if (!layout.includes("{children}</Providers>"))
    throw new Error(
      "Could not install the game return link: update the root Providers layout explicitly.",
    );
  layout = layout.replace(
    "{children}</Providers>",
    "{children}<GameReturnLink /></Providers>",
  );
  if (!layout.includes("import { GameReturnLink }"))
    layout =
      "import { GameReturnLink } from '@/features/neighborhood/game-return-link'\n" +
      layout;
  await fs.writeFile(layoutFile, layout);
}
await fs.writeFile(
  path.join(route, "page.tsx"),
  `import type {Metadata} from 'next'\nimport GameClient from '@/features/neighborhood/client'\nexport const metadata:Metadata={title:'Play PawTrail — Homes & Neighborhood',description:'Explore, make animal friends, and bring a little kindness to the neighborhood.',alternates:{canonical:'/play'},robots:{index:false,follow:true}}\nexport default function PlayPage(){return <GameClient/>}\n`,
);
console.log(
  "Installed game source and isolated assets into the existing app at /play.",
);
