import { useEffect, useRef, useState } from 'react'
import {
  ArrowLeft,
  ArrowRight,
  ArrowUp,
  ArrowDown,
  RotateCw,
  RotateCcw,
  Shovel,
  Armchair,
  SlidersHorizontal,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Switch } from '@/components/ui/switch'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { PlayShell } from './shared/play-chrome'
import { FurniturePair } from './furniture-pair'
import { navigateFurnitureCreator, navigatePlay } from '@/game/play-navigation'
import { furnitureDefinitions, facingLabel } from '@/game/furniture/model'
import {
  FurnitureField,
  type FieldOptions,
} from '@/game/furniture/comparison-field'
import { characterCreator } from '@/game/creator/state'
import { loadGameFonts } from '@/game/font-loader'

const initialDefinition = furnitureDefinitions[0]
const arrows = [
  { label: 'Move left', Icon: ArrowLeft, x: -1, y: 0 },
  { label: 'Move up', Icon: ArrowUp, x: 0, y: -1 },
  { label: 'Move down', Icon: ArrowDown, x: 0, y: 1 },
  { label: 'Move right', Icon: ArrowRight, x: 1, y: 0 },
]

export default function FurnitureComparison() {
  const [itemId, setItemId] = useState(initialDefinition.id)
  const definition =
    furnitureDefinitions.find((item) => item.id === itemId) ?? initialDefinition
  const [tab, setTab] = useState<'couch' | 'field'>('couch'),
    [rotation, setRotation] = useState(0),
    [style, setStyle] = useState(definition.styles[0]),
    [seat, setSeat] = useState(-1)
  const [geometry, setGeometry] = useState(false),
    [running, setRunning] = useState(false),
    [rain, setRain] = useState(false),
    [tool, setTool] = useState<FieldOptions['tool']>('none')
  const [reduced, setReduced] = useState(
    () =>
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches,
  )
  const [message, setMessage] = useState(
      'Walk through the curtain or bush. Hold Shift to run into the solid wall.',
    ),
    [fieldZoom, setFieldZoom] = useState(2)
  const field = useRef<FurnitureField | undefined>(undefined),
    canvas = useRef<HTMLCanvasElement>(null),
    host = useRef<HTMLDivElement>(null)
  const settings = useRef<FieldOptions>({
    running,
    rain,
    tool,
    geometry,
    reduced,
    paused: false,
  })
  settings.current = { running, rain, tool, geometry, reduced, paused: false }
  useEffect(() => {
    if (tab !== 'field' || !canvas.current || !host.current) return
    const fieldHost = host.current
    let stopped = false
    void loadGameFonts()
    let active: FurnitureField | undefined
    try {
      active = new FurnitureField(
        canvas.current,
        characterCreator.getSnapshot().appearance,
        () => settings.current,
        setMessage,
      )
      field.current = active
    } catch {
      setMessage(
        'The field could not open. Switch to Furniture comparison, then reopen the field to retry.',
      )
    }
    const resize = () => {
      if (stopped) return
      setFieldZoom(
        Math.max(
          1,
          Math.min(3, Math.floor((fieldHost.clientWidth - 24) / 288)),
        ),
      )
    }
    const observer = new ResizeObserver(resize)
    observer.observe(fieldHost)
    resize()
    return () => {
      stopped = true
      observer.disconnect()
      active?.dispose()
      field.current = undefined
    }
  }, [tab])
  const stop = () => field.current?.input(0, 0)
  const focus = () => canvas.current?.focus({ preventScroll: true })
  return (
    <PlayShell>
      <header className="flex shrink-0 flex-wrap items-center justify-between gap-3 border-b px-4 py-3 sm:px-6">
        <div className="flex items-center gap-3">
          <Button
            variant="ghost"
            size="icon"
            aria-label="Return to game"
            onClick={() => navigatePlay('home')}
          >
            <ArrowLeft className="size-4" />
          </Button>
          <div>
            <h1 className="font-heading text-2xl font-bold">
              Furniture comparison
            </h1>
            <p className="text-xs text-muted-foreground">
              The same scale. A world that responds.
            </p>
          </div>
        </div>
        <Button variant="outline" onClick={navigateFurnitureCreator}>
          <SlidersHorizontal className="size-4" />
          Furniture creator
        </Button>
      </header>
      <main className="min-h-0 flex-1 overflow-auto p-3 sm:p-5">
        <div className="mb-4 flex flex-wrap items-end justify-between gap-3">
          <div>
            <h2 className="font-heading text-3xl font-bold">
              Made to be lived in.
            </h2>
            <p className="mt-1 max-w-2xl text-sm text-muted-foreground">
              Compare the original and authored furniture, then walk through the
              contact field with your creator character.
            </p>
          </div>
          <div className="flex gap-1" role="group" aria-label="Comparison view">
            <Button
              size="sm"
              variant={tab === 'couch' ? 'default' : 'outline'}
              aria-pressed={tab === 'couch'}
              onClick={() => setTab('couch')}
            >
              <Armchair className="size-4" />
              Furniture comparison
            </Button>
            <Button
              size="sm"
              variant={tab === 'field' ? 'default' : 'outline'}
              aria-pressed={tab === 'field'}
              onClick={() => setTab('field')}
            >
              Interaction field
            </Button>
          </div>
        </div>
        <div className="grid items-start gap-5 lg:grid-cols-[minmax(0,1fr)_19rem]">
          <section
            className="min-w-0 overflow-hidden rounded-lg border bg-background"
            aria-label={
              tab === 'couch'
                ? 'Original and current furniture'
                : 'Playable contact field'
            }
          >
            <div className="flex items-center justify-between gap-3 border-b px-4 py-3">
              <p className="font-heading text-lg font-bold">
                {tab === 'couch'
                  ? 'Original & current'
                  : 'Walk, touch and change the ground'}
              </p>
              <span className="text-xs text-muted-foreground">
                Native pixels
              </span>
            </div>
            {tab === 'couch' ? (
              <FurniturePair
                definition={definition}
                onRotate={() => setRotation((value) => (value + 90) % 360)}
                rotation={rotation}
                style={style}
                seat={seat}
                geometry={geometry}
                reduced={reduced}
              />
            ) : (
              <div
                ref={host}
                className="grid min-h-[22rem] place-items-center overflow-auto bg-secondary/40 p-3"
              >
                <canvas
                  ref={canvas}
                  tabIndex={0}
                  role="application"
                  aria-label="Furniture interaction field. WASD or arrows move, Shift runs, E digs with the shovel."
                  aria-describedby="furniture-field-help"
                  onPointerDown={focus}
                  className="shrink-0 outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 [image-rendering:pixelated]"
                  style={{ width: 288 * fieldZoom, height: 240 * fieldZoom }}
                />
              </div>
            )}
            <div className="space-y-2 border-t px-4 py-3 text-xs leading-relaxed text-muted-foreground">
              {tab === 'couch' ? (
                <>
                  <p>
                    {['couch', 'aquarium'].includes(definition.model)
                      ? 'Each turn pairs the model with its matching reference. Interaction points and collision turn with it.'
                      : 'The original keeps its front view. The 3D model turns with its collision and interaction contacts.'}
                  </p>
                  <p>
                    Red outlines show solid ground. Teal points show the actor
                    seat anchors.
                  </p>
                </>
              ) : (
                <>
                  <p id="furniture-field-help">
                    Click the field, then use WASD or arrows. Shift runs; E
                    digs. Enter the rainy garden, then return to the indoor
                    floor to leave wet footprints.
                  </p>
                  <div
                    className="flex flex-wrap gap-1.5"
                    role="group"
                    aria-label="Move field character"
                  >
                    {arrows.map(({ label, Icon, x, y }) => (
                      <Button
                        key={label}
                        variant="outline"
                        size="icon"
                        aria-label={label}
                        onPointerDown={(event) => {
                          event.currentTarget.setPointerCapture(event.pointerId)
                          field.current?.input(x, y)
                        }}
                        onPointerUp={stop}
                        onPointerCancel={stop}
                        onLostPointerCapture={stop}
                        onKeyDown={(event) => {
                          if (event.key === ' ' || event.key === 'Enter') {
                            event.preventDefault()
                            field.current?.input(x, y)
                          }
                        }}
                        onKeyUp={stop}
                        onBlur={stop}
                      >
                        <Icon className="size-4" />
                      </Button>
                    ))}
                  </div>
                </>
              )}
            </div>
          </section>
          <aside className="space-y-5">
            {tab === 'couch' ? (
              <>
                <section className="space-y-3">
                  <Select
                    value={itemId}
                    onValueChange={(id) => {
                      const item = furnitureDefinitions.find(
                        (item) => item.id === id,
                      )!
                      setItemId(id)
                      setStyle(item.styles[0])
                      setRotation(0)
                      setSeat(-1)
                    }}
                  >
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
                  <h3 className="font-heading text-xl font-bold">
                    Facing & finish
                  </h3>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Rotate left"
                      onClick={() =>
                        setRotation((value) => (value + 270) % 360)
                      }
                    >
                      <RotateCcw className="size-4" />
                    </Button>
                    <p className="min-w-24 text-center text-sm font-bold">
                      {rotation}° · {facingLabel(rotation)}
                    </p>
                    <Button
                      variant="outline"
                      size="icon"
                      aria-label="Rotate right"
                      onClick={() => setRotation((value) => (value + 90) % 360)}
                    >
                      <RotateCw className="size-4" />
                    </Button>
                  </div>
                  <div className="flex flex-wrap gap-1.5">
                    {definition.styles.map((value) => (
                      <Button
                        key={value.id}
                        size="sm"
                        variant={
                          style.id === value.id ? 'secondary' : 'outline'
                        }
                        aria-pressed={style.id === value.id}
                        onClick={() => setStyle(value)}
                      >
                        <span
                          className="size-3 rounded-sm border"
                          style={{ background: value.fabric }}
                        />
                        {value.label}
                      </Button>
                    ))}
                  </div>
                </section>
                <section className="space-y-3 border-t pt-4">
                  <h3 className="font-heading text-xl font-bold">
                    Actor connection
                  </h3>
                  <div className="grid grid-cols-2 gap-1.5">
                    {[
                      { label: 'Empty', value: -1 },
                      { label: 'Stand nearby', value: -2 },
                      { label: 'Sit · seat 1', value: 0 },
                      { label: 'Sit · seat 2', value: 1 },
                      { label: 'Both seats', value: -3 },
                    ].map((value) => (
                      <Button
                        key={value.value}
                        size="sm"
                        variant={seat === value.value ? 'secondary' : 'outline'}
                        disabled={
                          definition.model !== 'couch' &&
                          (value.value >= 0 || value.value === -3)
                        }
                        aria-pressed={seat === value.value}
                        onClick={() => setSeat(value.value)}
                      >
                        {value.label}
                      </Button>
                    ))}
                  </div>
                  <p className="text-xs leading-relaxed text-muted-foreground">
                    Preview your character beside the furniture or seated on a
                    couch. Curtains and fish animate as separate parts.
                  </p>
                </section>
              </>
            ) : (
              <>
                <section className="space-y-3">
                  <h3 className="font-heading text-xl font-bold">
                    Conditions & tools
                  </h3>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="field-running">Run</Label>
                    <Switch
                      id="field-running"
                      checked={running}
                      onCheckedChange={setRunning}
                    />
                  </div>
                  <div className="flex items-center justify-between gap-3">
                    <Label htmlFor="field-rain">Rain in the garden</Label>
                    <Switch
                      id="field-rain"
                      checked={rain}
                      onCheckedChange={setRain}
                    />
                  </div>
                  <Label htmlFor="field-tool">Equipped tool</Label>
                  <Select
                    value={tool}
                    onValueChange={(value) => {
                      setTool(value as FieldOptions['tool'])
                      focus()
                    }}
                  >
                    <SelectTrigger id="field-tool">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent className="pawtrail-game">
                      <SelectItem value="none">Empty hands</SelectItem>
                      <SelectItem value="shovel">Garden shovel</SelectItem>
                      <SelectItem value="lawn-mower">Lawn mower</SelectItem>
                    </SelectContent>
                  </Select>
                  <div className="flex flex-wrap gap-2">
                    <Button
                      size="sm"
                      disabled={tool !== 'shovel'}
                      onClick={() => field.current?.dig()}
                    >
                      <Shovel className="size-4" />
                      Dig facing tile
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => field.current?.reset()}
                    >
                      <RotateCcw className="size-4" />
                      Reset field
                    </Button>
                  </div>
                </section>
                <p
                  className="border-t pt-4 text-xs leading-relaxed"
                  role="status"
                  aria-live="polite"
                >
                  {message}
                </p>
              </>
            )}
            <section className="space-y-3 border-t pt-4">
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="furniture-geometry">
                  Show collision & sensors
                </Label>
                <Switch
                  id="furniture-geometry"
                  checked={geometry}
                  onCheckedChange={setGeometry}
                />
              </div>
              <div className="flex items-center justify-between gap-3">
                <Label htmlFor="furniture-reduced">Reduced motion</Label>
                <Switch
                  id="furniture-reduced"
                  checked={reduced}
                  onCheckedChange={setReduced}
                />
              </div>
              {tab === 'field' && (
                <p className="text-xs leading-relaxed text-muted-foreground">
                  Red: solid. Teal: soft contact. Blue: actor feet. Curtain
                  frames stay solid; the opening and bush can be crossed. Fish
                  move within the tank.
                </p>
              )}
            </section>
            <p className="border-t pt-4 text-xs leading-relaxed text-muted-foreground">
              Comparison changes stay in this field. Live tools require
              ownership; yard changes are saved by the game service.
            </p>
          </aside>
        </div>
      </main>
    </PlayShell>
  )
}
