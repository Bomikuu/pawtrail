export type ContactPoint = { x: number; y: number }
export type ContactRect = ContactPoint & { width: number; height: number }
export type SoftContact = {
  id: string
  kind: 'bush' | 'curtain'
  bounds: ContactRect
}
export type Footprint = ContactPoint & {
  angle: number
  side: number
  born: number
}
const distance = (a: ContactPoint, b: ContactPoint) =>
  Math.hypot(a.x - b.x, a.y - b.y)
export const inside = (p: ContactPoint, r: ContactRect) =>
  p.x >= r.x && p.y >= r.y && p.x <= r.x + r.width && p.y <= r.y + r.height

/** Sweep a sensor, so running across a thin curtain still registers. */
function crosses(a: ContactPoint, b: ContactPoint, r: ContactRect) {
  const count = Math.max(1, Math.ceil(distance(a, b) / 3))
  for (let i = 0; i <= count; i++)
    if (
      inside(
        {
          x: a.x + ((b.x - a.x) * i) / count,
          y: a.y + ((b.y - a.y) * i) / count,
        },
        r,
      )
    )
      return true
  return false
}

/** Solid collision and short recoil use exactly the same clearance function. */
export class ContactMotor {
  private recoil = { x: 0, y: 0, until: 0 }
  private nextImpact = 0
  impacts = 0
  reset() {
    this.recoil = { x: 0, y: 0, until: 0 }
    this.nextImpact = 0
  }
  get recoiling() {
    return this.recoil.until > performance.now()
  }
  move(
    position: ContactPoint,
    delta: ContactPoint,
    clear: (p: ContactPoint) => boolean,
    running: boolean,
    now: number,
    dt: number,
  ) {
    const p = { ...position },
      recovering = now < this.recoil.until
    const step = recovering
      ? {
          x: (this.recoil.x * Math.min(dt, 40)) / 1000,
          y: (this.recoil.y * Math.min(dt, 40)) / 1000,
        }
      : delta
    const count = Math.max(1, Math.ceil(Math.hypot(step.x, step.y) / 2))
    let hitX = false,
      hitY = false
    for (let i = 0; i < count; i++) {
      if (clear({ x: p.x + step.x / count, y: p.y })) p.x += step.x / count
      else if (step.x) hitX = true
      if (clear({ x: p.x, y: p.y + step.y / count })) p.y += step.y / count
      else if (step.y) hitY = true
    }
    if (!recovering && running && now >= this.nextImpact && (hitX || hitY)) {
      this.recoil = {
        x: hitX ? -Math.sign(step.x) * 85 : 0,
        y: hitY ? -Math.sign(step.y) * 85 : 0,
        until: now + 150,
      }
      this.nextImpact = now + 650
      this.impacts++
    }
    return p
  }
}

/** Cosmetic contact state is bounded, temporary and never changes collision. */
export class ContactEffects {
  sensors: SoftContact[] = []
  footprints: Footprint[] = []
  private actors = new Map<
    string,
    { point: ContactPoint; lastPrint: ContactPoint; side: number }
  >()
  private springs = new Map<string, { at: number; force: number }>()
  reset() {
    this.sensors = []
    this.footprints = []
    this.actors.clear()
    this.springs.clear()
  }
  observe(
    id: string,
    point: ContactPoint,
    running: boolean,
    wet: boolean,
    indoor: boolean,
    now: number,
  ) {
    const previous = this.actors.get(id) ?? { point, lastPrint: point, side: 1 }
    const moved = distance(previous.point, point)
    if (moved > 0.2 && moved < 64) {
      for (const sensor of this.sensors) {
        const spring = this.springs.get(sensor.id)
        if (
          (!spring || now - spring.at > 180) &&
          crosses(previous.point, point, sensor.bounds)
        )
          this.springs.set(sensor.id, {
            at: now,
            force: (running ? 1 : 0.45) * (point.x < previous.point.x ? -1 : 1),
          })
      }
      if (indoor && wet && distance(previous.lastPrint, point) >= 12) {
        this.footprints.push({
          ...point,
          side: previous.side,
          angle: Math.atan2(
            point.x - previous.lastPrint.x,
            point.y - previous.lastPrint.y,
          ),
          born: now,
        })
        previous.lastPrint = { ...point }
        previous.side *= -1
        if (this.footprints.length > 100) this.footprints.shift()
      }
    } else if (moved >= 64) previous.lastPrint = { ...point }
    previous.point = { ...point }
    this.actors.set(id, previous)
    // Room visitor churn cannot grow this pool indefinitely.
    if (this.actors.size > 40)
      this.actors.delete(this.actors.keys().next().value!)
    this.footprints = this.footprints.filter(
      (print) => now - print.born < 12000,
    )
  }
  sway(id: string, now: number, reduced = false) {
    const spring = this.springs.get(id)
    if (!spring) return 0
    const age = (now - spring.at) / 1000
    if (age > 1.2) {
      this.springs.delete(id)
      return 0
    }
    return reduced ? 0 : Math.sin(age * 22) * Math.exp(-age * 4) * spring.force
  }
}

/** Shared aquarium motion stays inside the authored water bounds. */
export function swimmingFish(bounds: ContactRect, now: number, count = 4) {
  return Array.from({ length: count }, (_, i) => {
    const phase = now / (2400 + i * 700) + i * 1.8
    return {
      x: Math.round(
        bounds.x +
          5 +
          ((Math.sin(phase) + 1) / 2) * Math.max(0, bounds.width - 10),
      ),
      y: Math.round(
        bounds.y +
          4 +
          ((i + 0.5) / count) * Math.max(0, bounds.height - 8) +
          Math.sin(phase * 2) * 2,
      ),
      facing: Math.cos(phase) < 0 ? -1 : 1,
      color: ['#f5a553', '#f5d785', '#df875f', '#c4dc9a'][i % 4],
    }
  })
}
