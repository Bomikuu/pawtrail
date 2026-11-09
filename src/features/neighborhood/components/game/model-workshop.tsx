import { catSkinOptions, skinPalette } from "@/features/neighborhood/game/models3d/skins";
import {
  Select,
  SelectTrigger,
  SelectContent,
  SelectItem,
  SelectValue,
} from "@/components/ui/select";
import { useEffect, useRef, useState } from "react";
import { Box, RotateCcw } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Slider } from "@/components/ui/slider";
import {
  characterColors,
  createModel,
  modelStage,
  pixelRenderer,
  pose,
  type ModelOptions,
} from "@/features/neighborhood/game/models3d/model";
import {
  modelPreferences,
  saveModelPreferences,
} from "@/features/neighborhood/game/models3d/preferences";
import { gameAppearance } from '@/features/neighborhood/game/actor-rig/game-appearances'
import { PixelActor, humanClips, CREATOR_FRAME } from '@/features/neighborhood/game/actor-rig/pixel-renderer'
export function ModelWorkshop({ identity }: { identity: string }) {
  const [open, setOpen] = useState(false),
    [kind, setKind] = useState<"player" | "cat">("player"),
    [cat, setCat] = useState("black-cat"),
    [action, setAction] = useState("idle"),
    [options, setOptions] = useState<Partial<ModelOptions>>({}),
    [yaw, setYaw] = useState(0.35),
    [error, setError] = useState("");
  const [viewport, setViewport] = useState<HTMLDivElement | null>(null),
    config = useRef({ options, yaw, action });
  config.current = { options, yaw, action };
  const target = kind === "player" ? identity : cat;
  useEffect(() => {
    if (open) setOptions(modelPreferences(target));
  }, [open, target]);
  useEffect(() => {
    if (!open || !viewport) return;
    const container = viewport;
    let stop = false,
      frame = 0;
    if(kind==='player'){
      const canvas=document.createElement('canvas')
      canvas.width=CREATOR_FRAME.width;canvas.height=CREATOR_FRAME.height
      canvas.className='h-full w-full object-contain [image-rendering:pixelated] touch-none'
      canvas.style.transformOrigin='50% 75%'
      const context=canvas.getContext('2d')
      let actor:PixelActor|undefined,signature='',rendered=''
      const headings=['down','down_right','right','up_right','up','up_left','left','down_left']
      const draw=(time:number)=>{
        if(stop)return
        try{
          const c=config.current,next=JSON.stringify(c.options)
          if(next!==signature){
            const look=gameAppearance(target,c.options)??gameAppearance('rescuer')!
            actor??=new PixelActor(look.appearance,CREATOR_FRAME.density)
            actor.setAppearance(look.appearance);actor.setHeadScale(look.headScale)
            canvas.style.transform='scale('+look.bodyScale+')';signature=next;rendered=''
          }
          const action=c.action==='eat'?'feed':c.action,clip=humanClips[action]??humanClips.idle
          const direction=headings[(Math.round(c.yaw/(Math.PI/4))%8+8)%8]
          const index=window.matchMedia('(prefers-reduced-motion: reduce)').matches?0:Math.floor(time/1000*clip.fps)%(clip.frames??8)
          const key=[action,direction,index].join(':')
          if(key!==rendered){context?.putImageData(actor!.frame(action,direction,index),0,0);rendered=key}
          frame=requestAnimationFrame(draw)
        }catch{setError('The character preview could not render. Close and reopen the workshop to retry.')}
      }
      setError('');container.appendChild(canvas);frame=requestAnimationFrame(draw)
      return()=>{stop=true;cancelAnimationFrame(frame);actor?.dispose();canvas.remove()}
    }
    let renderer: ReturnType<typeof pixelRenderer>;
    try {
      renderer = pixelRenderer(96, 120);
    } catch {
      setError("WebGL 2 is unavailable. Your existing character is preserved.");
      return;
    }
    setError("");
    renderer.domElement.style.cssText =
      "width:100%;height:100%;object-fit:contain;image-rendering:pixelated;touch-action:none";
    container.appendChild(renderer.domElement);
    const stage = modelStage();
    let signature = "",
      rig: ReturnType<typeof createModel> | undefined;
    const draw = (t: number) => {
      if (stop) return;
      const c = config.current,
        next = JSON.stringify(c.options);
      if (next !== signature) {
        if (rig) {
          stage.scene.remove(rig.root);
          rig.dispose();
        }
        rig = createModel({ kind, identity: target, ...c.options });
        stage.scene.add(rig.root);
        signature = next;
      }
      pose(rig!, kind, c.action, t, c.yaw, {
        exactYaw: true,
        reducedMotion: window.matchMedia("(prefers-reduced-motion: reduce)")
          .matches,
      });
      renderer.render(stage.scene, stage.camera);
      frame = requestAnimationFrame(draw);
    };
    frame = requestAnimationFrame(draw);
    return () => {
      stop = true;
      cancelAnimationFrame(frame);
      rig?.dispose();
      renderer.dispose();
      renderer.domElement.remove();
    };
  }, [open, kind, target, viewport]);
  const change = (patch: Partial<ModelOptions>) =>
    setOptions((v) => ({ ...v, ...patch }));
  return (
    <>
      <Button
        variant="outline"
        className="rounded-md"
        onClick={() => setOpen(true)}
      >
        <Box className="size-4" />
        Adjust 3D models
      </Button>
      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent className="max-h-[92dvh] overflow-y-auto sm:max-w-3xl">
          <DialogHeader>
            <DialogTitle className="font-heading text-3xl">
              Character workshop
            </DialogTitle>
            <DialogDescription>
              Characters share the creator’s face, breathing and movement.
              Drag to turn, preview actions and adjust your look.
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-6 sm:grid-cols-[1fr_16rem]">
            <div>
              <div
                className="relative h-80 overflow-hidden rounded-md border bg-[#b3c9a0]"
                ref={setViewport}
                onPointerDown={(e) => {
                  e.currentTarget.setPointerCapture(e.pointerId);
                }}
                onPointerMove={(e) => {
                  if (e.currentTarget.hasPointerCapture(e.pointerId))
                    setYaw((v) => v + e.movementX * 0.025);
                }}
                onPointerUp={(e) =>
                  e.currentTarget.releasePointerCapture(e.pointerId)
                }
                aria-label="Rotatable 3D model preview"
              />
              {error && <p role="alert">{error}</p>}
              <label className="mt-4 block text-sm">
                Rotation
                <Slider
                  className="mt-3"
                  min={-3.14}
                  max={3.14}
                  step={0.01}
                  value={[yaw]}
                  onValueChange={(v) => setYaw(v[0])}
                />
              </label>
            </div>
            <div className="space-y-4">
              <div className="flex gap-2">
                {(["player", "cat"] as const).map((k) => (
                  <Button
                    key={k}
                    variant={kind === k ? "default" : "outline"}
                    onClick={() => setKind(k)}
                    aria-pressed={kind === k}
                  >
                    {k === "player" ? "Character" : "Cat"}
                  </Button>
                ))}
              </div>
              {kind === "cat" && (
                <label className="block text-sm">
                  Coat
                  <Select value={cat} onValueChange={setCat}>
                    <SelectTrigger
                      className="mt-1 w-full"
                      aria-label="Cat coat"
                    >
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {catSkinOptions.filter((id) => id !== "orange-tabby").map((id) => (
                        <SelectItem key={id} value={id}>
                          {id.replaceAll("_", " ").replaceAll("-", " ")}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </label>
              )}
              {(kind === "player" ? ["hair", "outfit"] : ["coat"]).map(
                (key) => (
                  <label
                    key={key}
                    className="flex items-center justify-between gap-3 text-sm capitalize"
                  >
                    {key}
                    <Input
                      aria-label={key + " color"}
                      type="color"
                      className="h-9 w-16 p-1"
                      value={String(
                        options[key as keyof ModelOptions] ??
                          (key === "hair"
                            ? characterColors(target).hair
                            : key === "outfit"
                              ? characterColors(target).outfit
                              : (skinPalette(target).coat ?? "#df9850")),
                      )}
                      onChange={(e) => change({ [key]: e.target.value })}
                    />
                  </label>
                ),
              )}
              <label className="block text-sm">
                Head proportions
                <Slider
                  className="mt-3"
                  min={0.8}
                  max={1.25}
                  step={0.05}
                  value={[options.head ?? 1]}
                  onValueChange={(v) => change({ head: v[0] })}
                />
              </label>
              <label className="block text-sm">
                Model size
                <Slider
                  className="mt-3"
                  min={0.8}
                  max={1.2}
                  step={0.05}
                  value={[options.size ?? 1]}
                  onValueChange={(v) => change({ size: v[0] })}
                />
              </label>
              <p className="text-xs text-muted-foreground">
                Cosmetic changes stay on this device. Collision sizes and real
                animal records stay unchanged.
              </p>
            </div>
          </div>
          <div className="flex flex-wrap gap-2" aria-label="Preview action">
            {["idle", "walk", "sit", "pet", "eat", "sleep"].map((a) => (
              <Button
                key={a}
                size="sm"
                variant={action === a ? "secondary" : "outline"}
                aria-pressed={action === a}
                onClick={() => setAction(a)}
              >
                {a}
              </Button>
            ))}
          </div>
          <div className="flex justify-between gap-3">
            <Button
              variant="outline"
              onClick={() => {
                setOptions({});
                setYaw(0.35);
              }}
            >
              <RotateCcw className="size-4" />
              Reset preview
            </Button>
            <Button
              onClick={() => {
                saveModelPreferences(target, options);
                setOpen(false);
              }}
            >
              Apply appearance
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
