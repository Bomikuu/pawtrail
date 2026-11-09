import { useEffect, useState } from "react";
import {
  Armchair,
  ArrowLeft,
  Download,
  RotateCcw,
  RotateCw,
  Save,
  Pause,
  Play,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { PlayShell } from "@/components/game/shared/play-chrome";
import { FurniturePair } from "./furniture-pair";
import {
  FACINGS,
  furnitureDefinitions,
  facingLabel,
  type CouchStyle,
} from "@/game/furniture/model";
import {
  navigatePlay,
  navigateFurnitureComparison,
} from "@/game/play-navigation";

const initialDefinition = furnitureDefinitions[0];
const draftKey = "pawtrail:furniture-design:v1";
export default function FurnitureStudio() {
  const [itemId, setItemId] = useState(initialDefinition.id);
  const definition =
    furnitureDefinitions.find((item) => item.id === itemId) ??
    initialDefinition;
  const [style, setStyle] = useState<CouchStyle>(definition.styles[0]);
  const [rotation, setRotation] = useState(0),
    [seat, setSeat] = useState(-1);
  const [mode, setMode] = useState("instant"),
    [seconds, setSeconds] = useState(definition.construction.seconds);
  const [materials, setMaterials] = useState(definition.construction.materials);
  const [message, setMessage] = useState("");
  const [paused, setPaused] = useState(false);
  const [reduced] = useState(
    () => window.matchMedia("(prefers-reduced-motion: reduce)").matches,
  );
  useEffect(() => {
    try {
      const saved = JSON.parse(localStorage.getItem(draftKey) ?? "null");
      if (saved?.item === definition.id) {
        const base = definition.styles.find(
          (item) => item.id === saved.style?.id,
        );
        if (base && /^#[0-9a-f]{6}$/i.test(saved.style.fabric))
          setStyle({ ...base, fabric: saved.style.fabric });
        if (FACINGS.includes(saved.rotation)) setRotation(saved.rotation);
        if (["instant", "timed", "recipe"].includes(saved.mode))
          setMode(saved.mode);
        if (
          Number.isInteger(saved.seconds) &&
          saved.seconds >= 0 &&
          saved.seconds <= 86400
        )
          setSeconds(saved.seconds);
        if (Array.isArray(saved.materials))
          setMaterials(
            definition.construction.materials.map((item) => ({
              ...item,
              amount: Math.max(
                1,
                Math.min(
                  100,
                  Math.floor(
                    Number(
                      saved.materials.find(
                        (value: { id: string }) => value.id === item.id,
                      )?.amount,
                    ) || item.amount,
                  ),
                ),
              ),
            })),
          );
      }
    } catch {}
  }, [itemId]);
  const chooseItem = (id: string) => {
    const item = furnitureDefinitions.find((item) => item.id === id)!;
    setItemId(id);
    setStyle(item.styles[0]);
    setSeconds(item.construction.seconds);
    setMaterials(item.construction.materials);
    setRotation(0);
    setSeat(-1);
  };
  const design = () => ({
    version: 1,
    item: definition.id,
    reference: definition.reference,
    style,
    rotation,
    mode,
    seconds,
    materials,
  });
  const save = () => {
    try {
      localStorage.setItem(draftKey, JSON.stringify(design()));
      setMessage("Furniture design saved on this device.");
    } catch {
      setMessage("Storage is unavailable. Export the definition instead.");
    }
  };
  const download = () => {
    const url = URL.createObjectURL(
      new Blob([JSON.stringify(design(), null, 2)], {
        type: "application/json",
      }),
    );
    const link = document.createElement("a");
    link.href = url;
    link.download = definition.id + "-design.json";
    link.click();
    setTimeout(() => URL.revokeObjectURL(url), 1000);
    setMessage(
      "Definition exported. Apply it through the furniture skill to publish new game rules.",
    );
  };
  return (
    <PlayShell>
      <header className="flex shrink-0 items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Return to game"
            onClick={() => navigatePlay("home")}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">
              Furniture creator
            </h1>
            <p className="text-xs text-muted-foreground">
              Build a piece. Give it a place.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={navigateFurnitureComparison}>
          Compare & interact
        </Button>
      </header>
      <main className="grid min-h-0 flex-1 overflow-auto lg:grid-cols-[minmax(0,1fr)_22rem] lg:overflow-hidden">
        <section className="flex flex-col lg:min-h-0">
          <div className="flex items-center justify-between gap-2 border-b px-4 py-3">
            <div>
              <h2 className="font-heading text-xl font-bold">
                {definition.label}
              </h2>
              <p className="text-xs text-muted-foreground">
                3D source · native pixel preview
              </p>
            </div>
            <div className="flex gap-1">
              <Button
                variant="outline"
                size="icon"
                aria-label="Rotate furniture left"
                onClick={() => setRotation((value) => (value + 270) % 360)}
              >
                <RotateCcw className="size-4" />
              </Button>
              <Button
                variant="outline"
                size="icon"
                aria-label="Rotate furniture right"
                onClick={() => setRotation((value) => (value + 90) % 360)}
              >
                <RotateCw className="size-4" />
              </Button>
            </div>
          </div>
          <div className="min-h-[24rem] shrink-0 lg:min-h-0 lg:flex-1">
            <FurniturePair
              definition={definition}
              onRotate={() => setRotation((value) => (value + 90) % 360)}
              rotation={rotation}
              style={style}
              seat={seat}
              geometry={false}
              reduced={reduced || paused}
            />
          </div>
          <div className="flex flex-wrap items-center justify-center gap-2 border-t p-3">
            {[
              { value: -1, label: "Empty furniture" },
              { value: 0, label: "Sit · seat 1" },
              { value: 1, label: "Sit · seat 2" },
              { value: -3, label: "Both seats" },
              { value: -2, label: "Stand up" },
            ].map((item) => (
              <Button
                key={item.value}
                size="sm"
                disabled={
                  definition.model !== "couch" &&
                  (item.value >= 0 || item.value === -3)
                }
                variant={seat === item.value ? "secondary" : "outline"}
                aria-pressed={seat === item.value}
                onClick={() => setSeat(item.value)}
              >
                <Armchair className="size-4" />
                {item.label}
              </Button>
            ))}
            <Button
              size="sm"
              variant="outline"
              aria-pressed={paused}
              onClick={() => setPaused((value) => !value)}
              title="Pause at the original reference pose"
            >
              {paused ? (
                <Play className="size-4" />
              ) : (
                <Pause className="size-4" />
              )}
              {paused ? "Play animation" : "Pause animation"}
            </Button>
          </div>
        </section>
        <aside className="space-y-6 border-t p-4 lg:overflow-y-auto lg:border-l lg:border-t-0 lg:p-5">
          <section className="space-y-3">
            <Select value={itemId} onValueChange={chooseItem}>
              <SelectTrigger aria-label="Furniture model">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="pawtrail-game">
                {furnitureDefinitions.map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <h2 className="font-heading text-xl font-bold">Appearance</h2>
            <div className="flex items-center gap-3">
              <img
                src={definition.reference}
                alt="Original furniture reference"
                className="size-16 rounded-md border bg-muted [image-rendering:pixelated]"
              />
              <p className="text-xs text-muted-foreground">
                Based on the original artwork. Four actual model facings share
                collision and interaction geometry.
              </p>
            </div>
            <div className="flex flex-wrap gap-1">
              {definition.styles.map((item) => (
                <Button
                  key={item.id}
                  size="sm"
                  variant={style.id === item.id ? "secondary" : "outline"}
                  onClick={() => setStyle(item)}
                >
                  <span
                    className="size-3 rounded-sm border"
                    style={{ backgroundColor: item.fabric }}
                  />
                  {item.label}
                </Button>
              ))}
            </div>
            <label className="grid gap-1 text-xs font-medium">
              {definition.model === "aquarium" ? "Wood color" : "Fabric color"}
              <Input
                type="color"
                value={style.fabric}
                onChange={(event) =>
                  setStyle({ ...style, fabric: event.target.value })
                }
                className="h-10 w-full"
              />
            </label>
            <div className="grid grid-cols-4 gap-1">
              {FACINGS.map((angle) => (
                <Button
                  key={angle}
                  variant={rotation === angle ? "secondary" : "outline"}
                  size="sm"
                  onClick={() => setRotation(angle)}
                >
                  {angle}°
                </Button>
              ))}
            </div>
          </section>
          <section className="space-y-3 border-t pt-4">
            <h2 className="font-heading text-xl font-bold">
              Construction rules
            </h2>
            <Select value={mode} onValueChange={setMode}>
              <SelectTrigger aria-label="Construction mode">
                <SelectValue />
              </SelectTrigger>
              <SelectContent className="pawtrail-game">
                {[
                  { id: "instant", label: "Instant purchase" },
                  { id: "timed", label: "Build time" },
                  { id: "recipe", label: "Recipe materials" },
                ].map((item) => (
                  <SelectItem key={item.id} value={item.id}>
                    {item.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            {mode !== "instant" && (
              <label className="grid gap-1 text-xs font-medium">
                Build time in seconds
                <Input
                  type="number"
                  min={0}
                  max={86400}
                  value={seconds}
                  onChange={(event) =>
                    setSeconds(
                      Math.max(
                        0,
                        Math.min(
                          86400,
                          Math.floor(Number(event.target.value) || 0),
                        ),
                      ),
                    )
                  }
                />
              </label>
            )}
            {mode === "recipe" &&
              materials.map((material) => (
                <label
                  key={material.id}
                  className="grid grid-cols-[1fr_5rem] items-center gap-2 text-xs"
                >
                  {material.label}
                  <Input
                    type="number"
                    min={1}
                    max={100}
                    value={material.amount}
                    onChange={(event) =>
                      setMaterials((items) =>
                        items.map((item) =>
                          item.id === material.id
                            ? {
                                ...item,
                                amount: Math.max(
                                  1,
                                  Math.min(
                                    100,
                                    Math.floor(Number(event.target.value) || 1),
                                  ),
                                ),
                              }
                            : item,
                        ),
                      )
                    }
                  />
                </label>
              ))}
            <p className="text-xs leading-relaxed text-muted-foreground">
              These are authoring settings saved on this device. Export the
              definition to apply new colors or recipes through the furniture
              skill. Live construction uses the server's installed recipe.
            </p>
          </section>
          <div className="flex flex-wrap gap-2">
            <Button onClick={save}>
              <Save className="size-4" />
              Save design
            </Button>
            <Button variant="outline" onClick={download}>
              <Download className="size-4" />
              Export
            </Button>
          </div>
          <p role="status" className="text-xs text-muted-foreground">
            {message}
          </p>
        </aside>
      </main>
    </PlayShell>
  );
}
