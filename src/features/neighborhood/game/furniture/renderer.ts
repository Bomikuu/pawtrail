import * as T from "three"
import { PixelFinish } from "../actor-rig/pixel-renderer"
import {
  createRescuer,
  disposeRig,
  appearancePalette,
  type Rig,
} from "../actor-rig/rigs"
import {
  defaultAppearance,
  type ActorAppearance,
} from "../actor-rig/appearance"
import {
  createFurniture,
  furnitureCamera,
  furnitureDefinitions,
  type CouchStyle,
  type FurnitureDefinition,
} from "./model"

/** Same native-pixel finish as the actor creator; furniture and actor share a camera. */
export class PixelFurniture {
  private renderer = new T.WebGLRenderer({
    alpha: true,
    antialias: false,
    preserveDrawingBuffer: true,
    premultipliedAlpha: false,
  })
  private scene = new T.Scene()
  private camera = furnitureCamera()
  private actorCamera = furnitureCamera()
  private couch: ReturnType<typeof createFurniture>
  private actor: Rig
  private partner?: Rig
  private finish: PixelFinish
  private actorFinish: PixelFinish
  private layer = document.createElement("canvas")
  private canvas = document.createElement("canvas")
  constructor(
    style: CouchStyle = furnitureDefinitions[0].styles[0],
    private appearance: ActorAppearance = defaultAppearance(),
    private definition: FurnitureDefinition = furnitureDefinitions[0],
  ) {
    this.renderer.setPixelRatio(1)
    this.renderer.setSize(96, 112, false)
    this.renderer.setClearColor(0, 0)
    this.renderer.outputColorSpace = T.SRGBColorSpace
    this.renderer.toneMapping = T.NoToneMapping
    this.canvas.width = 96
    this.canvas.height = 112
    this.layer.width = 96
    this.layer.height = 112
    this.actorFinish = new PixelFinish(appearancePalette(appearance))
    this.couch = createFurniture(this.definition, style)
    this.actor = createRescuer(appearance)
    this.finish = new PixelFinish([
      ...this.couch.palette,
      ...appearancePalette(appearance),
    ])
    this.scene.add(this.couch.root, this.actor.root)
  }
  style(style: CouchStyle) {
    this.scene.remove(this.couch.root)
    this.couch.dispose()
    this.couch = createFurniture(this.definition, style)
    this.scene.add(this.couch.root)
    this.finish = new PixelFinish([
      ...this.couch.palette,
      ...appearancePalette(this.appearance),
    ])
  }
  frame(rotation: number, seat = -1, foreground = false, phase = 0, force = 0) {
    this.camera = furnitureCamera(rotation, this.definition)
    this.couch.whole()
    this.couch.animate(phase, force)
    this.couch.root.rotation.y = (-rotation * Math.PI) / 180
    this.actor.root.visible =
      seat !== -1 &&
      !foreground &&
      (seat === -2 || this.couch.seats.length > 0)
    if (seat === -3 && !this.partner && this.couch.seats.length > 1) {
      this.partner = createRescuer(this.appearance)
      this.scene.add(this.partner.root)
    }
    if (this.partner) this.partner.root.visible = seat === -3 && !foreground
    const actors =
      this.partner && seat === -3 ? [this.actor, this.partner] : [this.actor]
    for (const [index, actor] of actors.entries())
      if (actor.root.visible) {
        const socket =
          this.couch.seats[seat === -3 ? index : seat] ?? this.couch.seats[0]
        actor.pose(seat === -2 ? "idle" : "sit", phase)
        actor.root.rotation.y = seat === -2 ? 0 : (-rotation * Math.PI) / 180
        const position =
          seat === -2
            ? new T.Vector3(0, 0, 32)
            : new T.Vector3(
                socket.point[0],
                socket.point[1] - 5.8,
                socket.point[2],
              ).applyAxisAngle(
                new T.Vector3(0, 1, 0),
                (-rotation * Math.PI) / 180,
              )
        actor.root.position.copy(position)
      }
    if (foreground) this.couch.foreground(rotation)
    if (this.couch.preservePaint && !foreground && this.actor.root.visible) {
      // Match the live game's base → native actors → authored foreground composition.
      // Finish solid furniture separately, so actors never recolor its source art.
      const ctx = this.canvas.getContext("2d", { willReadFrequently: true })!
      const layer = this.layer.getContext("2d", { willReadFrequently: true })!
      const visible = actors.map((actor) => actor.root.visible)
      const positions = actors.map((actor) => actor.root.position.clone())
      try {
        actors.forEach((actor) => (actor.root.visible = false))
        this.renderer.render(this.scene, this.camera)
        ctx.clearRect(0, 0, 96, 112)
        ctx.drawImage(this.renderer.domElement, 0, 0)
        if (this.definition.model === "couch")
          ctx.putImageData(this.finish.finish(ctx.getImageData(0, 0, 96, 112)), 0, 0)
        this.couch.root.visible = false
        actors.forEach((actor, index) => (actor.root.visible = visible[index]))
        const nativeCos = 90 / Math.hypot(90, 34.5)
        for (const actor of actors) {
          const pelvis = actor.root.position.clone()
          if (seat !== -2) pelvis.y += 5.8
          const target = pelvis.clone().project(this.camera),
            native = pelvis.project(this.actorCamera)
          actor.root.position.y += (target.y - native.y) * 56 / nativeCos
        }
        this.renderer.render(this.scene, this.actorCamera)
        layer.clearRect(0, 0, 96, 112)
        layer.drawImage(this.renderer.domElement, 0, 0)
        layer.putImageData(
          this.actorFinish.finish(layer.getImageData(0, 0, 96, 112)),
          0,
          0,
        )
        ctx.drawImage(this.layer, 0, 0)
        actors.forEach((actor) => (actor.root.visible = false))
        this.couch.root.visible = true
        if (seat !== -2) {
          this.couch.foreground(rotation)
          this.renderer.render(this.scene, this.camera)
          layer.clearRect(0, 0, 96, 112)
          layer.drawImage(this.renderer.domElement, 0, 0)
          if (this.definition.model === "couch")
            layer.putImageData(this.finish.finish(layer.getImageData(0, 0, 96, 112)), 0, 0)
          ctx.drawImage(this.layer, 0, 0)
        }
        return this.canvas
      } finally {
        this.couch.root.visible = true
        this.couch.whole()
        actors.forEach((actor, index) => (actor.root.visible = visible[index]))
        actors.forEach((actor, index) => actor.root.position.copy(positions[index]))
      }
    }
    this.renderer.render(this.scene, this.camera)
    const context = this.canvas.getContext("2d", { willReadFrequently: true })!
    context.clearRect(0, 0, 96, 112)
    context.drawImage(this.renderer.domElement, 0, 0)
    if (!this.couch.preservePaint || this.definition.model === "couch" || this.actor.root.visible) {
      const finished = this.finish.finish(context.getImageData(0, 0, 96, 112))
      context.putImageData(finished, 0, 0)
    }
    return this.canvas
  }
  /** Authoring measurement of the actual visible Sit rig, including its clothing/hat. */
  seatFit() {
    if (this.couch.seats.length < 2) return null
    const samples = []
    const previous = this.couch.root.rotation.y
    this.couch.root.rotation.y = 0
    this.couch.whole()
    this.couch.root.updateMatrixWorld(true)
    const left = new T.Box3().setFromObject(this.couch.groups.leftArm).max.x,
      right = new T.Box3().setFromObject(this.couch.groups.rightArm).min.x
    const pillowFront = Math.max(
      ...Object.entries(this.couch.groups)
        .filter(([name]) => name.startsWith("Flower pillow"))
        .map(([, node]) => new T.Box3().setFromObject(node).max.z),
    )
    for (const phase of [0, 0.25, 0.5, 0.75]) {
      const pelvisFront: number[] = []
      const bodies = this.couch.seats.map((socket) => {
        this.actor.pose("sit", phase)
        this.actor.root.rotation.y = 0
        this.actor.root.position.set(
          socket.point[0],
          socket.point[1] - 5.8,
          socket.point[2],
        )
        this.actor.root.updateMatrixWorld(true)
        const bounds = new T.Box3()
        this.actor.root.traverse((node) => {
          if (!(node instanceof T.Mesh)) return
          const scale = node.getWorldScale(new T.Vector3())
          if (
            Math.max(Math.abs(scale.x), Math.abs(scale.y), Math.abs(scale.z)) <
            0.01
          )
            return
          let p: T.Object3D | null = node
          while (p) {
            if (!p.visible) return
            p = p.parent
          }
          const box = new T.Box3().setFromObject(node)
          bounds.union(box)
          if (node.name.startsWith("ContinuousShortsWaist"))
            pelvisFront.push(box.max.z)
        })
        return bounds
      })
      samples.push({
        phase,
        outerArmClearance: Math.min(
          bodies[0].min.x - left,
          right - bodies[1].max.x,
        ),
        betweenActors: bodies[1].min.x - bodies[0].max.x,
        pillowClearance: Math.min(...bodies.map((b) => b.min.z - pillowFront)),
        actorWidth: bodies[0].max.x - bodies[0].min.x,
        seatSupportFrontClearance:
          this.couch.seatSupport && pelvisFront.length
            ? this.couch.seatSupport.front - Math.max(...pelvisFront)
            : null,
        floorClearance: Math.min(...bodies.map((b) => b.min.y)),
      })
    }
    const bounds = new T.Box3().setFromObject(this.couch.root)
    this.couch.root.rotation.y = previous
    return {
      units: "native world units",
      appearance: "exported shared rescuer",
      furnitureBounds: {
        min: bounds.min.toArray(),
        max: bounds.max.toArray(),
        size: bounds.getSize(new T.Vector3()).toArray(),
      },
      samples,
    }
  }
  dispose() {
    this.couch.dispose()
    disposeRig(this.actor)
    if (this.partner) disposeRig(this.partner)
    this.renderer.dispose()
    this.renderer.forceContextLoss()
  }
}
