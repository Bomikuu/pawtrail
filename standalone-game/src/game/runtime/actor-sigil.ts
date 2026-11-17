import Phaser from 'phaser'

const SOURCES={mira:{key:'compare:mira-sigil',file:'/pawtrail-game/actor-studio/mira-adler/v1/sigil.png',color:0xe6ba75},sieghart:{key:'compare:sieghart-sigil',file:'/pawtrail-game/actor-studio/sieghart/v3/sigil.png',color:0xe4ccff},aurelia:{key:'compare:aurelia-sigil',file:'/pawtrail-game/actor-studio/aurelia-weiss/v1/sigil.png',color:0xf3d4f5},rika:{key:'compare:rika-sigil',file:'/pawtrail-game/actor-studio/rika-hoshino/v1/sigil.png',color:0x60ead5},peony:{key:'compare:rika-sigil',file:'/pawtrail-game/actor-studio/rika-hoshino/v1/sigil.png',color:0x60ead5}}
const WORKING = 'compare:sieghart-sigil-rotated'

/** Rotate the round drawing first, then project it onto the ground plane. */
export class ActorGroundSigil {
  static preload(scene: Phaser.Scene) {
    const unique=new Map(Object.values(SOURCES).map(source=>[source.key,source]))
    for(const source of unique.values())if(!scene.textures.exists(source.key))scene.load.image(source.key,source.file)
  }

  private texture: Phaser.Textures.CanvasTexture
  private ring: Phaser.GameObjects.Image
  private halo: Phaser.GameObjects.Image
  private motes: Phaser.GameObjects.Graphics
  private last = -Infinity
  private source = ''
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)')

  constructor(private scene: Phaser.Scene) {
    this.texture = scene.textures.createCanvas(WORKING, 128, 128)!
    this.texture.setFilter(Phaser.Textures.FilterMode.NEAREST)
    this.halo = scene.add.image(0, 0, WORKING).setDisplaySize(48, 17).setDepth(1.12).setBlendMode(Phaser.BlendModes.ADD)
    this.ring = scene.add.image(0, 0, WORKING).setDisplaySize(43, 14).setDepth(1.14)
    this.motes = scene.add.graphics().setDepth(1.16)
    this.hide()
  }

  update(x: number, y: number, clock: number, actor:keyof typeof SOURCES='sieghart') {
    const source=SOURCES[actor]
    this.ring.setDisplaySize(actor==='peony'?68:43,actor==='peony'?22:14);this.halo.setDisplaySize(actor==='peony'?74:48,actor==='peony'?26:17)
    if(this.source!==source.key){this.source=source.key;this.last=-Infinity}
    const time = this.reduced.matches ? 0 : clock
    if (time < this.last || Math.abs(time - this.last) >= 1000 / 20) {
      const context = this.texture.context
      context.clearRect(0, 0, 128, 128)
      context.save()
      context.translate(64, 64)
      context.rotate(time * .000075)
      context.drawImage(this.scene.textures.get(source.key).getSourceImage() as HTMLImageElement, -64, -64, 128, 128)
      context.restore()
      this.texture.refresh()
      this.last = time
    }
    const pulse = this.reduced.matches ? .5 : .5 + .5 * Math.sin(time / 3600 * Math.PI * 2)
    this.ring.setVisible(true).setPosition(x, y).setAlpha(.78 + pulse * .12)
    this.halo.setVisible(true).setPosition(x, y).setAlpha(.12 + pulse * .09)
    this.motes.setVisible(true).setPosition(x, y).clear()
    for (let i = 0; i < 4; i++) {
      const angle = time * .00018 + i * Math.PI / 2
      this.motes.fillStyle(source.color, .4 + pulse * .3)
      this.motes.fillRect(Math.round(Math.cos(angle) * 23), Math.round(Math.sin(angle) * 7), 1, 1)
    }
  }

  hide() { this.ring.setVisible(false); this.halo.setVisible(false); this.motes.setVisible(false) }
  destroy() {
    for (const object of [this.ring, this.halo, this.motes]) if (object.scene) object.destroy()
    if (this.scene.textures.exists(WORKING)) this.scene.textures.remove(WORKING)
  }
}
