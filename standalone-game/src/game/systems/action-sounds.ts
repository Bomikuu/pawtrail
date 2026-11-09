/** Original, lightweight action foley. No external samples or per-frame sources. */
export type ActionSound = 'cry_rain' | 'power_up' | 'jetpack' | 'float' | 'dash' | 'gentle' | 'happy' | 'angry' | 'dance' | 'sleep' | 'pet' | 'feed' | 'water' | 'play' | 'laugh' | 'sick' | 'ride' | 'tired' | 'surprised' | 'clap' | 'rustle' | 'clean'

export function actionSound(action: string, kind: 'player' | 'cat'): ActionSound | undefined {
  if (/^(power_up|power_run|super_saiyan)$/.test(action)) return 'power_up'
  if (/^jetpack(_takeoff|_land)?$/.test(action)) return 'jetpack'
  return ({
    sad: 'cry_rain', cry: 'cry_rain', crying: 'cry_rain', float: 'float', floating: 'float',
    rescue_dash: 'dash', gentle_approach: 'gentle', happy: 'happy', cheer: 'happy',
    angry: 'angry', dance: 'dance', sleep: 'sleep', sleepy: 'sleep', rest: 'sleep',
    pet: 'pet', petting: 'pet', petted: 'pet', being_petted: 'pet',
    feed: 'feed', eat: 'feed', fill_food: 'feed', water: 'water', drink: 'water',
    refill_water: 'water', fill_water: 'water', water_plant: 'water',
    play: 'play', yarn: 'play', laugh: 'laugh', laughing: 'laugh', sick: 'sick',
    car: 'ride', ride: 'ride', tired: 'tired', surprised: 'surprised', clap: 'clap',
    pick_up: 'rustle', give_gift: 'rustle', rescue: 'rustle', clean: 'clean',
    wave: 'rustle', sit: 'rustle', lie_down: 'rustle', stretch: 'rustle', climb: 'clean',
    roll_yarn: 'play', jump: 'rustle', pounce: 'rustle', knead: 'pet',
    chase_tail: 'play', tail_wag: 'gentle', sniff: 'rustle', shake: 'clean', fly: 'float',
    groom: kind === 'cat' ? 'pet' : 'rustle', scratch: 'clean',
  } as Record<string, ActionSound>)[action]
}

const noiseBuffers = new WeakMap<AudioContext, AudioBuffer>()
function noiseBuffer(ctx: AudioContext) {
  let buffer = noiseBuffers.get(ctx)
  if (!buffer) {
    buffer = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate)
    const samples = buffer.getChannelData(0)
    for (let i = 0; i < samples.length; i++) samples[i] = Math.random() * 2 - 1
    noiseBuffers.set(ctx, buffer)
  }
  return buffer
}

/** One actor owns one voice; every node is disconnected on fade-out. */
export class ActionSoundVoice {
  alive = true
  private output: GainNode
  private sources = new Set<AudioScheduledSourceNode>()
  private nodes = new Set<AudioNode>()
  private next = 0
  private beat = 0
  private stage = ''

  constructor(private ctx: AudioContext, destination: AudioNode, private sound: ActionSound, private cat: boolean, private release: () => void) {
    this.output = this.node(ctx.createGain())
    this.output.gain.value = 0
    this.output.connect(destination)
    if (sound === 'cry_rain') {
      // Close, gentle rain under the visible storm cloud, separate from weather.
      this.noise(3500, .11, 'lowpass', 380)
    } else if (sound === 'power_up') {
      const hum = this.loopTone(64, .035, 'sawtooth', 420)
      this.loopTone(128, .025, 'sine')
      this.noise(750, .085, 'lowpass', 90)
      const lfo = this.source(ctx.createOscillator()), depth = this.node(ctx.createGain())
      lfo.frequency.value = 7
      depth.gain.value = 7
      lfo.connect(depth); depth.connect(hum.frequency); lfo.start()
      this.tone(140, 620, .55, .065, 'triangle')
    } else if (sound === 'jetpack') {
      this.noise(950, .2, 'lowpass', 110)
      this.loopTone(72, .035, 'sawtooth', 240)
    } else if (sound === 'float') {
      this.noise(1000, .025, 'bandpass', 450)
    } else if (sound === 'ride') {
      this.loopTone(52, .025, 'sawtooth', 200)
      this.noise(260, .035, 'lowpass', 70)
    }
  }

  private node<T extends AudioNode>(node: T): T { this.nodes.add(node); return node }
  private source<T extends AudioScheduledSourceNode>(source: T): T {
    this.sources.add(source)
    source.onended = () => { this.sources.delete(source); this.nodes.delete(source); source.disconnect() }
    return source
  }
  private noise(frequency: number, volume: number, type: BiquadFilterType, highpass = 0, duration?: number) {
    const source = this.source(this.ctx.createBufferSource())
    const filter = this.node(this.ctx.createBiquadFilter()), gain = this.node(this.ctx.createGain())
    source.buffer = noiseBuffer(this.ctx); source.loop = true
    filter.type = type; filter.frequency.value = frequency; filter.Q.value = .6
    gain.gain.value = volume
    source.connect(filter)
    const high = highpass ? this.node(this.ctx.createBiquadFilter()) : undefined
    if (high) {
      high.type = 'highpass'; high.frequency.value = highpass
      filter.connect(high); high.connect(gain)
    } else filter.connect(gain)
    gain.connect(this.output)
    source.start()
    if (duration) {
      const now = this.ctx.currentTime
      gain.gain.setValueAtTime(0, now)
      gain.gain.linearRampToValueAtTime(volume, now + .018)
      gain.gain.exponentialRampToValueAtTime(.0001, now + duration)
      source.stop(now + duration + .02)
      source.onended = () => {
        this.sources.delete(source); source.disconnect(); filter.disconnect(); gain.disconnect()
        this.nodes.delete(filter); this.nodes.delete(gain)
        high?.disconnect(); if (high) this.nodes.delete(high)
      }
    }
  }
  private loopTone(frequency: number, volume: number, type: OscillatorType, lowpass?: number) {
    const osc = this.source(this.ctx.createOscillator()), gain = this.node(this.ctx.createGain())
    osc.type = type; osc.frequency.value = frequency; gain.gain.value = volume
    if (lowpass) {
      const filter = this.node(this.ctx.createBiquadFilter())
      filter.type = 'lowpass'; filter.frequency.value = lowpass
      osc.connect(filter); filter.connect(gain)
    } else osc.connect(gain)
    gain.connect(this.output); osc.start()
    return osc
  }
  private tone(from: number, to: number, duration: number, volume: number, type: OscillatorType = 'sine', delay = 0, formant?: number) {
    const start = this.ctx.currentTime + delay
    const osc = this.source(this.ctx.createOscillator()), gain = this.node(this.ctx.createGain())
    const filter = formant ? this.node(this.ctx.createBiquadFilter()) : undefined
    osc.type = type; osc.frequency.setValueAtTime(from, start)
    osc.frequency.exponentialRampToValueAtTime(Math.max(20, to), start + duration)
    gain.gain.setValueAtTime(0, start)
    gain.gain.linearRampToValueAtTime(volume, start + Math.min(.04, duration / 4))
    gain.gain.exponentialRampToValueAtTime(.0001, start + duration)
    if (filter) { filter.type = 'bandpass'; filter.frequency.value = formant!; filter.Q.value = 2; osc.connect(filter); filter.connect(gain) }
    else osc.connect(gain)
    gain.connect(this.output); osc.start(start); osc.stop(start + duration + .02)
    osc.onended = () => {
      this.sources.delete(osc); osc.disconnect(); gain.disconnect(); filter?.disconnect()
      this.nodes.delete(gain); if (filter) this.nodes.delete(filter)
    }
  }
  setVolume(volume: number, stage: string) {
    if (!this.alive) return
    if (this.sound === 'jetpack' && this.stage !== stage && stage === 'jetpack_land') this.noise(450, .08, 'lowpass', 0, .23)
    this.stage = stage
    this.output.gain.setTargetAtTime(Math.max(0, Math.min(1, volume)), this.ctx.currentTime, .055)
  }
  tick(now: number) {
    if (!this.alive || now < this.next) return
    const n = this.beat++
    this.next = now + 1
    switch (this.sound) {
      case 'cry_rain':
        this.next = now + 1.8
        // Two falling voiced sobs with a nasal formant, followed by an inhale.
        if (!this.cat) for (let i = 0; i < 2; i++) this.tone(215, 145, .42, .09, 'sawtooth', i * .34, 820)
        this.noise(1400, .03, 'bandpass', 0, .2)
        break
      case 'power_up':
        this.next = now + .55
        this.tone(80, 125, .22, .055, 'triangle')
        if (n % 2 === 0) this.noise(2100, .055, 'highpass', 0, .07)
        break
      case 'jetpack': this.next = now + .7; this.tone(92, 67, .35, .025, 'triangle'); break
      case 'float': this.next = now + 2.4; this.tone(880, 1174, .6, .025); break
      case 'dash': this.next = Infinity; this.noise(1900, .23, 'bandpass', 0, .35); this.tone(220, 70, .3, .055, 'triangle'); break
      case 'gentle': this.next = Infinity; this.tone(660, 880, .26, .035); break
      case 'happy': this.next = now + 1.3; [523, 659, 784].forEach((f, i) => this.tone(f, f, .2, .035, 'triangle', i * .1)); break
      case 'angry': this.next = now + 1.6; this.tone(this.cat ? 170 : 120, 65, .35, .055, 'sawtooth', 0, 500); this.noise(1100, .045, 'bandpass', 0, .16); break
      case 'dance': this.next = now + .45; this.tone([196, 247, 294, 247][n % 4], 98, .15, .035, 'triangle'); this.noise(3200, .025, 'highpass', 0, .05); break
      case 'sleep': this.next = now + 2.7; this.tone(this.cat ? 70 : 90, this.cat ? 55 : 60, .85, .025, 'triangle'); break
      case 'pet': this.next = now + 1.5; this.tone(this.cat ? 65 : 330, this.cat ? 52 : 460, .65, .03, this.cat ? 'triangle' : 'sine'); break
      case 'feed': this.next = now + .9; this.noise(2100, .045, 'bandpass', 0, .1); this.tone(420, 250, .1, .02, 'triangle'); break
      case 'water': this.next = now + .8; this.noise(1900, .045, 'lowpass', 500, .23); this.tone(620, 980, .09, .025); break
      case 'play': this.next = now + 1.1; this.tone(780, 540, .15, .025, 'triangle'); this.noise(1600, .025, 'bandpass', 0, .08); break
      case 'laugh': this.next = now + 1.4; if (!this.cat) for (let i = 0; i < 3; i++) this.tone(240, 170, .16, .07, 'sawtooth', i * .2, 750); break
      case 'sick': this.next = now + 2.1; this.noise(850, .08, 'bandpass', 0, .18); this.tone(150, 80, .16, .04, 'sawtooth', .06, 600); break
      case 'ride': this.next = now + 1.5; this.tone(78, 60, .6, .02, 'triangle'); break
      case 'tired': this.next = now + 2.2; this.noise(650, .04, 'bandpass', 0, .6); break
      case 'surprised': this.next = Infinity; this.tone(400, 850, .18, .045, 'triangle'); break
      case 'clap': this.next = now + .5; this.noise(1600, .13, 'bandpass', 0, .08); break
      case 'rustle': this.next = Infinity; this.noise(1300, .07, 'bandpass', 0, .24); break
      case 'clean': this.next = now + .8; this.noise(1700, .045, 'bandpass', 0, .22); break
    }
  }
  stop(immediate = false) {
    if (!this.alive) return
    this.alive = false
    this.release()
    const now = this.ctx.currentTime
    this.output.gain.cancelScheduledValues(now)
    this.output.gain.setTargetAtTime(0, now, .025)
    const cleanup = () => {
      for (const source of this.sources) { try { source.stop() } catch {} source.disconnect() }
      this.sources.clear()
      for (const node of this.nodes) node.disconnect()
      this.nodes.clear()
    }
    if (immediate || this.ctx.state !== 'running') cleanup()
    else setTimeout(cleanup, 140)
  }
}
