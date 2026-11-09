import { ActionSoundVoice, type ActionSound } from './action-sounds'

export type AudioPreferences = {
  master: number
  music: number
  effects: number
  ambient: number
  muted: boolean
}
export const DEFAULT_AUDIO: AudioPreferences = {
  master: 0.55,
  music: 0.3,
  effects: 0.45,
  ambient: 0.28,
  muted: false,
}
export function audioPreferences(value: unknown): AudioPreferences {
  const v =
    value && typeof value === 'object' ? (value as Record<string, unknown>) : {}
  return {
    ...Object.fromEntries(
      (['master', 'music', 'effects', 'ambient'] as const).map((k) => [
        k,
        typeof v[k] === 'number' && Number.isFinite(v[k])
          ? Math.max(0, Math.min(1, v[k] as number))
          : DEFAULT_AUDIO[k],
      ]),
    ),
    muted: typeof v.muted === 'boolean' ? v.muted : false,
  } as AudioPreferences
}
function load() {
  try {
    return audioPreferences(
      JSON.parse(localStorage.getItem('pawtrail:audio:v1') ?? 'null'),
    )
  } catch {
    return { ...DEFAULT_AUDIO }
  }
}
/** Original procedural score and sounds: no external recordings or silent placeholders. */
class AudioManager {
  settings = load()
  private attenuation = 1
  private context: AudioContext | null = null
  private master: GainNode | null = null
  private channels: Partial<Record<'music' | 'effects' | 'ambient', GainNode>> =
    {}
  private timer: ReturnType<typeof setInterval> | null = null
  private beat = 0
  private nextBeat = 0
  private nextBird = 0
  private location = 'neighborhood'
  private phase = 'morning'
  private water = false
  private ambientSources: AudioBufferSourceNode[] = []
  private noiseGain: GainNode | null = null
  private clips = new Map<string, Promise<AudioBuffer>>()
  private voices = 0
  private rain: { source: AudioBufferSourceNode; gain: GainNode } | null = null
  private loadingRain = false
  private actionVoices = new Set<ActionSoundVoice>()
  createActionVoice(sound: ActionSound, cat = false) {
    if (!this.context || this.context.state !== 'running' || !this.channels.effects || this.actionVoices.size >= 8) return
    let voice: ActionSoundVoice
    voice = new ActionSoundVoice(this.context, this.channels.effects, sound, cat, () => this.actionVoices.delete(voice))
    this.actionVoices.add(voice)
    return voice
  }
  async playSample(url: string, volume = .4, ambient = false, distance = 0, signal?: AbortSignal) {
    if (signal?.aborted || !this.context || this.context.state !== 'running' || this.voices >= 2) return
    const ctx = this.context
    this.voices++
    try {
      if (!this.clips.has(url)) this.clips.set(url, fetch(url).then((r) => { if (!r.ok) throw new Error('Audio unavailable'); return r.arrayBuffer() }).then((data) => ctx.decodeAudioData(data)))
      const buffer = await this.clips.get(url)!
      if (signal?.aborted || this.context !== ctx || ctx.state !== 'running') { this.voices=Math.max(0,this.voices-1);return }
      const source = ctx.createBufferSource(), gain = ctx.createGain()
      source.buffer = buffer; gain.gain.value = volume * Math.max(0, 1-distance/300)
      source.connect(gain);gain.connect(this.channels[ambient ? 'ambient' : 'effects']!)
      const cancel = () => { gain.gain.setTargetAtTime(0,ctx.currentTime,.02);try{source.stop(ctx.currentTime+.09)}catch{} }
      source.onended = () => { signal?.removeEventListener('abort',cancel);source.disconnect();gain.disconnect();this.voices=Math.max(0,this.voices-1) }
      signal?.addEventListener('abort',cancel,{once:true})
      source.start();return true
    } catch { this.clips.delete(url) }
    this.voices=Math.max(0,this.voices-1)
    return false
  }
  async setRain(intensity: number, indoors: boolean) {
    const ctx=this.context
    if (!ctx || ctx.state !== 'running') return
    if (!this.rain && intensity > .01 && !this.loadingRain) {
      this.loadingRain=true
      try {
        const response=await fetch('/assets/game/audio/weather/rain-loop.wav')
        if (!response.ok) throw new Error('Rain audio unavailable')
        const buffer=await ctx.decodeAudioData(await response.arrayBuffer())
        if (this.context !== ctx) return
        const source=ctx.createBufferSource(),gain=ctx.createGain();source.buffer=buffer;source.loop=true;gain.gain.value=0;source.connect(gain);gain.connect(this.channels.ambient!);source.start();this.rain={source,gain}
      } catch {} finally { this.loadingRain=false }
    }
    this.rain?.gain.gain.setTargetAtTime(intensity*(indoors ? .07 : .32),ctx.currentTime,1.2)
  }
  get unlocked() {
    return !!this.context && this.context.state === 'running'
  }
  async unlock() {
    try {
      if (!this.context) {
        const Ctx = window.AudioContext
        this.context = new Ctx()
        this.master = this.context.createGain()
        this.master.connect(this.context.destination)
        for (const name of ['music', 'effects', 'ambient'] as const) {
          const gain = this.context.createGain()
          gain.connect(this.master)
          this.channels[name] = gain
        }
        this.apply()
        this.startWind()
        this.nextBeat = this.context.currentTime + 0.1
        this.timer = setInterval(() => this.schedule(), 100)
      }
      await this.context.resume()
      return true
    } catch {
      return false
    }
  }
  update(patch: Partial<AudioPreferences>) {
    this.settings = audioPreferences({ ...this.settings, ...patch })
    try {
      localStorage.setItem('pawtrail:audio:v1', JSON.stringify(this.settings))
    } catch {}
    this.apply()
    return { ...this.settings }
  }
  private apply() {
    if (!this.context || !this.master) return
    const t = this.context.currentTime
    this.master.gain.setTargetAtTime(
      this.settings.muted ? 0 : this.settings.master,
      t,
      0.08,
    )
    for (const name of ['music', 'effects', 'ambient'] as const)
      this.channels[name]!.gain.setTargetAtTime(this.settings[name], t, 0.08)
  }
  setScene(location: string, phase: string, water = false) {
    this.location = location
    this.phase = phase
    this.water = water
    if (this.noiseGain && this.context)
      this.noiseGain.gain.setTargetAtTime(
        water ? 0.09 : phase === 'night' ? 0.028 : 0.045,
        this.context.currentTime,
        1,
      )
  }
  private tone(
    frequency: number,
    at: number,
    duration: number,
    volume: number,
    channel: 'music' | 'effects' | 'ambient' = 'effects',
    type: OscillatorType = 'triangle',
    end?: number,
  ) {
    if (!this.context || !this.channels[channel]) return
    const oscillator = this.context.createOscillator(),
      gain = this.context.createGain()
    oscillator.type = type
    oscillator.frequency.setValueAtTime(frequency, at)
    if (end)
      oscillator.frequency.exponentialRampToValueAtTime(end, at + duration)
    gain.gain.setValueAtTime(0, at)
    gain.gain.linearRampToValueAtTime(volume * this.attenuation, at + 0.018)
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration)
    oscillator.connect(gain)
    gain.connect(this.channels[channel]!)
    oscillator.start(at)
    oscillator.stop(at + duration + 0.03)
    oscillator.onended = () => {
      oscillator.disconnect()
      gain.disconnect()
    }
  }
  private startWind() {
    if (!this.context) return
    const ctx = this.context,
      buffer = ctx.createBuffer(1, ctx.sampleRate * 3, ctx.sampleRate),
      data = buffer.getChannelData(0)
    let prior = 0
    for (let i = 0; i < data.length; i++) {
      prior = (prior + Math.random() * 0.04 - 0.02) * 0.985
      data[i] = prior
    }
    const source = ctx.createBufferSource(),
      filter = ctx.createBiquadFilter(),
      gain = ctx.createGain()
    source.buffer = buffer
    source.loop = true
    filter.type = 'lowpass'
    filter.frequency.value = 550
    gain.gain.value = 0.045
    source.connect(filter)
    filter.connect(gain)
    gain.connect(this.channels.ambient!)
    source.start()
    this.ambientSources.push(source)
    this.noiseGain = gain
  }
  private schedule() {
    const ctx = this.context
    if (!ctx || ctx.state !== 'running') return
    if (document.hidden) {
      for (const voice of this.actionVoices) voice.stop(true)
      return
    }
    for (const voice of this.actionVoices) voice.tick(ctx.currentTime)
    const night = this.phase === 'night',
      shelter = this.location === 'shelter',
      park = this.location === 'park' || this.location === 'garden'
    const bpm = night ? 56 : shelter ? 66 : park ? 78 : 72,
      step = 60 / bpm / 2
    const melody = night
      ? [0, 7, 4, 11, 7, 4, 2, 7]
      : shelter
        ? [0, 4, 7, 12, 11, 7, 4, 2]
        : park
          ? [4, 7, 12, 7, 9, 4, 2, 7]
          : [0, 4, 7, 9, 7, 4, 2, 4]
    const roots = [48, 53, 55, 48]
    while (this.nextBeat < ctx.currentTime + 0.25) {
      if (this.nextBeat < ctx.currentTime - 0.5)
        this.nextBeat = ctx.currentTime + 0.05
      const root = roots[Math.floor(this.beat / 8) % 4],
        note = root + 12 + melody[this.beat % melody.length]
      this.tone(
        440 * Math.pow(2, (note - 69) / 12),
        this.nextBeat,
        night ? 1.5 : 0.85,
        night ? 0.045 : 0.08,
        'music',
        'triangle',
      )
      if (this.beat % 4 === 0)
        this.tone(
          440 * Math.pow(2, (root - 69) / 12),
          this.nextBeat,
          1.9,
          0.06,
          'music',
          'sine',
        )
      this.nextBeat += step
      this.beat++
    }
    if (ctx.currentTime > this.nextBird) {
      this.nextBird = ctx.currentTime + 5 + Math.random() * 8
      if (night) {
        for (let i = 0; i < 3; i++)
          this.tone(
            3200,
            ctx.currentTime + i * 0.15,
            0.06,
            0.018,
            'ambient',
            'sine',
            3600,
          )
      } else if (!shelter)
        this.tone(
          1700 + Math.random() * 500,
          ctx.currentTime,
          0.16,
          0.04,
          'ambient',
          'sine',
          2800,
        )
    }
  }
  effectAt(kind: string, distance: number) {
    this.attenuation = Math.max(0, 1 - distance / 180)
    this.effect(kind)
    this.attenuation = 1
  }
  effect(kind: string) {
    const ctx = this.context
    if (!ctx || ctx.state !== 'running') return
    const t = ctx.currentTime
    if (['quest', 'achievement', 'claim'].includes(kind)) {
      ;[523, 659, 784, 1047].forEach((f, i) =>
        this.tone(f, t + i * 0.11, 0.45, 0.12),
      )
      return
    }
    if (kind === 'feed' || kind === 'water') {
      ;[440, 550, 660].forEach((f, i) =>
        this.tone(f, t + i * 0.06, 0.13, 0.07, 'effects', 'sine'),
      )
      return
    }
    if (kind === 'pet' || kind === 'play') {
      this.tone(330, t, 0.23, 0.08, 'effects', 'sine', 460)
      return
    }
    if (kind === 'photo') {
      this.tone(1100, t, 0.035, 0.09, 'effects', 'square')
      return
    }
    if (kind === 'door') {
      this.tone(190, t, 0.18, 0.06, 'effects', 'triangle', 280)
      return
    }
    if (kind === 'step-grass' || kind === 'step-path') {
      this.tone(
        kind === 'step-grass' ? 85 : 180,
        t,
        0.045,
        0.035,
        'effects',
        'triangle',
        45,
      )
      return
    }
    if (kind === 'purr') {
      this.tone(65, t, 0.9, 0.035, 'ambient', 'triangle', 48)
      return
    }
    if (kind === 'meow') {
      this.tone(520, t, 0.32, 0.04, 'ambient', 'triangle', 750)
      return
    }
    if (kind === 'bark') {
      this.tone(180, t, 0.1, 0.045, 'ambient', 'triangle', 85)
      this.tone(160, t + 0.14, 0.08, 0.03, 'ambient', 'triangle', 90)
      return
    }
    this.tone(
      kind === 'accept' ? 660 : 520,
      t,
      0.12,
      0.065,
      'effects',
      'sine',
      kind === 'accept' ? 880 : 440,
    )
  }
  dispose() {
    for (const voice of this.actionVoices) voice.stop(true)
    this.actionVoices.clear()
    this.rain?.source.stop();this.rain=null;this.loadingRain=false;this.clips.clear();this.voices=0
    if (this.timer) clearInterval(this.timer)
    this.timer = null
    this.ambientSources.forEach((s) => s.stop())
    this.ambientSources = []
    void this.context?.close()
    this.context = null
    this.master = null
  }
}
export const audio = new AudioManager()
