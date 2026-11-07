import Phaser from 'phaser'
import {
  homes,
  movement,
  patch,
  onScene,
  onLive,
  live,
  edit,
  selectPet,
  action,
} from './client'
import { catalogue, furniture, solids, valid } from './geometry'
import { findPath } from '../pathfinding'
import { audio } from '../systems/audio'
import { dayPhase } from '../systems/time'
import type { Placement, Pet, SceneCommand } from './types'
import { Atmosphere, preloadAtmosphere } from '../atmosphere'
import { preloadCatFaces, catReaction } from '../soundboard'
import { SHARED_FINDS, sharedWorld } from '../immersion-data'
type Actor = Phaser.GameObjects.Sprite
export class HomeScene extends Phaser.Scene {
  private player!: Actor
  private actors = new Map<string, Actor>()
  private petActors = new Map<string, Actor>()
  private labels = new Map<string, Phaser.GameObjects.Text>()
  private props = new Map<string, Phaser.GameObjects.Image>()
  private bubbles = new Map<string, Phaser.GameObjects.Text>()
  private floor!: Phaser.GameObjects.TileSprite
  private keys!: Record<string, Phaser.Input.Keyboard.Key>
  private path: { x: number; y: number }[] = []
  private joystick = { x: 0, y: 0 }
  private direction = 'down'
  private lastSend = 0
  private sent = { x: 0, y: 0, direction: 'down', walking: false }
  private version = ''
  private lastHouse = ''
  private shadow!: Phaser.GameObjects.Graphics
  private ghost: Phaser.GameObjects.Image | null = null
  private candidate: Placement | null = null
  private drag = false
  private rotate = 0
  private queueCare: { pet: string; action: string } | null = null
  private nextVoice = 12000
  private reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    .matches
  private lastStep = 0
  private actionUntil = 0
  private actionName = ''
  private atmosphere?: Atmosphere
  private communityBoard?: Phaser.GameObjects.Image
  private discoveries = new Map<string, Phaser.GameObjects.Image>()
  private interactionHint?: Phaser.GameObjects.Text
  private photoPending = false
  constructor() {
    super('Home')
  }
  preload() {
    preloadAtmosphere(this)
    preloadCatFaces(this)
    this.load.image('community-board','/assets/game/missions/board/board-available.png')
    for(const find of SHARED_FINDS)this.load.image('discovery:'+find.id,find.id==='community-letter'?'/assets/game/environment/interactive/mailbox.png':'/assets/game/inventory/items/'+find.item+'.png')
    for (const i of catalogue.items) this.load.image('f:' + i.id, i.file)
    for (const [id, p] of Object.entries(catalogue.players))
      this.load.spritesheet('p:' + id, p.file, {
        frameWidth: 32,
        frameHeight: 48,
      })
    for (const [id, p] of Object.entries(catalogue.cats))
      this.load.spritesheet('c:' + id, p.file, {
        frameWidth: 48,
        frameHeight: 48,
      })
    for (const [id, p] of Object.entries(catalogue.effects))
      this.load.spritesheet('e:' + id, p.file, {
        frameWidth: 32,
        frameHeight: 32,
      })
    for (const name of [
      'oak-light-a',
      'wood-dark-a',
      'carpet-a',
      'ceramic-a',
      'stone',
      'patterned',
    ])
      this.load.image(
        'floor:' + name,
        '/assets/game/housing/tilesets/' + name + '-housing-v1.png',
      )
    for (const style of ['cream', 'sage', 'beige', 'blue', 'wood', 'wallpaper'])
      for (const part of ['north', 'west', 'east', 'south'])
        this.load.image(
          'wall:' + style + ':' + part,
          '/assets/game/housing/tilesets/' +
            style +
            '-' +
            part +
            '-modular-v2.png',
        )
    this.load.image(
      'mailbox',
      '/assets/game/housing/exteriors/mailbox-catalog-v1.png',
    )
    this.load.image(
      'flowerpot',
      '/assets/game/housing/exteriors/flowerpot-catalog-v1.png',
    )
    this.load.image(
      'house',
      '/assets/game/housing/exteriors/starter-house-catalog-v1.png',
    )
    this.load.spritesheet('grass', '/pawtrail-game/game-assets/terrain.png', {
      frameWidth: 32,
      frameHeight: 32,
    })
    this.load.on('loaderror', (file: Phaser.Loader.File) =>
      patch({
        error:
          'A home asset could not load: ' + file.key + '. Reload to retry.',
      }),
    )
  }
  create() {
    this.communityBoard=this.add.image(336,320,'community-board').setOrigin(.5,1).setDepth(320).setVisible(false)
    for(const find of SHARED_FINDS)this.discoveries.set(find.id,this.add.image(find.x,find.y,'discovery:'+find.id).setOrigin(.5,1).setDepth(find.y))
    this.interactionHint=this.add.text(0,0,'',{fontFamily:'Inter',fontSize:'11px',color:'#38271e',backgroundColor:'#fff8ed',padding:{x:7,y:5}}).setOrigin(.5,1).setDepth(19000).setVisible(false)
    this.atmosphere=new Atmosphere(this,768,576,[{x:145,y:240},{x:605,y:210}])
    for (const [id, p] of Object.entries(catalogue.players))
      for (const [name, row] of Object.entries(p.rows))
        this.anims.create({
          key: 'p:' + id + ':' + name,
          frames: this.anims.generateFrameNumbers('p:' + id, {
            start: row * 4,
            end: row * 4 + 3,
          }),
          frameRate: 7,
          repeat: -1,
        })
    for (const [id, c] of Object.entries(catalogue.cats))
      for (const [name, rects] of Object.entries(c.animations))
        this.anims.create({
          key: 'c:' + id + ':' + name,
          frames: rects.map((r) => ({
            key: 'c:' + id,
            frame: (r[1] / 48) * 8 + r[0] / 48,
          })),
          frameRate: 5,
          repeat: -1,
        })
    for (const [id, e] of Object.entries(catalogue.effects))
      this.anims.create({
        key: 'e:' + id,
        frames: this.anims.generateFrameNumbers('e:' + id, {
          start: 0,
          end: e.frames - 1,
        }),
        frameRate: 7,
        repeat: 2,
      })
    this.floor = this.add
      .tileSprite(384, 288, 768, 576, 'floor:oak-light-a')
      .setDepth(-100)
    this.player = this.add.sprite(400, 528, 'p:rescuer').setOrigin(0.5, 46 / 48)
    this.keys = this.input.keyboard!.addKeys(
      'W,A,S,D,UP,DOWN,LEFT,RIGHT,E,SPACE,ESC,R,ENTER',
      false,
    ) as Record<string, Phaser.Input.Keyboard.Key>
    this.shadow = this.add.graphics().setDepth(10000)
    this.input.mouse?.disableContextMenu()
    this.input.on('pointerdown', (p: Phaser.Input.Pointer) => {
      this.game.canvas.focus()
      if (p.rightButtonDown()) {
        this.clearGhost()
        return
      }
      if (homes.get().decoration) return
      const world = this.cameras.main.getWorldPoint(p.x, p.y)
      this.path = findPath(
        this.player,
        world,
        24,
        18,
        this.solidSet(homes.get().data?.house.layout || []),
      )
    })
    this.input.on('pointermove', (p: Phaser.Input.Pointer) => {
      if (this.candidate && (this.drag || p.isDown)) this.preview(p)
    })
    this.input.on('pointerup', (p: Phaser.Input.Pointer) => {
      if (!this.candidate) return
      this.preview(p)
      if (valid(this.candidate, homes.get().draft)) {
        const next = homes
          .get()
          .draft.filter((a) => a.id !== this.candidate!.id)
        edit([...next, { ...this.candidate }])
        this.clearGhost()
        audio.effect('upgrade')
      } else
        patch({
          error:
            'Choose a clear tile inside the room and keep the entrance open.',
        })
      this.drag = false
    })
    const unsubscribe = onScene((c) => this.command(c)),
      unlive = onLive((e) => this.event(e)),
      unstate = homes.subscribe(() => this.renderState())
    this.events.once(Phaser.Scenes.Events.SHUTDOWN, () => {
      unsubscribe()
      unlive()
      unstate()
      this.input.off('pointerdown')
      this.input.off('pointerup')
      this.input.off('pointermove')
    })
    this.cameras.main
      .setBounds(0, 0, 768, 576)
      .setZoom(this.scale.width > 900 ? 2 : 1)
      .startFollow(
        this.player,
        true,
        this.reduced ? 1 : 0.15,
        this.reduced ? 1 : 0.15,
      )
      .setRoundPixels(true)
    this.scale.on('resize', () => this.cameras.main.setRoundPixels(true))
    this.renderState()
    this.game.canvas.tabIndex = 0
    this.game.canvas.setAttribute('role', 'application')
    this.game.canvas.setAttribute(
      'aria-label',
      'PawTrail home world. WASD or arrows to walk, E to interact, Enter to chat, Q for reactions.',
    )
    this.game.events.emit('homes-ready')
    void audio.unlock()
    audio.setScene('shelter', 'afternoon', false)
  }
  private solidSet(layout: Placement[]) {
    return solids(layout, homes.get().data?.house.id.startsWith('system:hub'))
  }
  private renderState() {
    const s = homes.get(),
      h = s.data?.house
    if (!h) return
    const version =
      h.id +
      ':' +
      h.revision +
      ':' +
      JSON.stringify(s.decoration ? s.draft : h.layout) +
      ':' +
      h.floor +
      ':' +
      h.wallpaper
    if (this.version !== version) {
      this.version = version
      for (const image of this.props.values()) image.destroy()
      this.props.clear()
      this.children.list
        .filter((x) => x.getData('wall'))
        .forEach((x) => x.destroy())
      this.floor.setTexture('floor:' + h.floor)
      for (let x = 0; x < 24; x++)
        for (const [y, part] of [
          [0, 'north'],
          [17, 'south'],
        ] as const)
          this.add
            .image(x * 32 + 16, y * 32 + 16, 'wall:' + h.wallpaper + ':' + part)
            .setData('wall', true)
            .setDepth(y === 0 ? -10 : 800)
      for (let y = 1; y < 17; y++)
        for (const [x, part] of [
          [0, 'west'],
          [23, 'east'],
        ] as const)
          this.add
            .image(x * 32 + 16, y * 32 + 16, 'wall:' + h.wallpaper + ':' + part)
            .setData('wall', true)
            .setDepth(-10)
      const exit = this.add
        .text(400, 563, '↓ Neighborhood', {
          fontFamily: 'Nunito',
          fontSize: '10px',
          color: '#fff3d9',
          backgroundColor: '#553c2b',
          padding: { x: 5, y: 3 },
        })
        .setOrigin(0.5)
        .setDepth(1000)
        .setInteractive({ useHandCursor: true })
        .setData('wall', true)
      exit.on('pointerdown', () =>
        window.dispatchEvent(
          new CustomEvent('pawtrail:home-visit', { detail: 'system:hub' }),
        ),
      )
      for (const p of s.decoration ? s.draft : h.layout) {
        const def = furniture[p.item]
        if (!def || !this.textures.exists('f:' + p.item)) continue
        const image = this.add
          .image(p.x * 32 + 16, p.y * 32 + 32, 'f:' + p.item)
          .setOrigin(def.anchor[0] / def.width, def.anchor[1] / def.height)
          .setAngle(p.rotation)
          .setDepth(def.blocking ? p.y * 32 + 32 : -50)
          .setInteractive({ useHandCursor: true })
        this.props.set(p.id, image)
        image.on(
          'pointerdown',
          (
            _: unknown,
            __: unknown,
            ___: unknown,
            event: Phaser.Types.Input.EventData,
          ) => {
            if (homes.get().decoration) {
              this.clearGhost()
              event.stopPropagation()
              this.candidate = { ...p }
              this.rotate = p.rotation
              this.drag = true
              patch({ selectedFurniture: p.id })
              image.setAlpha(0.35)
              this.ghost = this.add
                .image(image.x, image.y, image.texture.key)
                .setOrigin(image.originX, image.originY)
                .setAngle(p.rotation)
                .setAlpha(0.7)
                .setDepth(9999)
            } else {
              this.path = findPath(
                this.player,
                { x: image.x, y: image.y + 30 },
                24,
                18,
                this.solidSet(homes.get().data!.house.layout),
              )
              patch({
                notice:
                  def.label +
                  ' · ' +
                  def.interaction +
                  '. Walk closer and press E.',
              })
            }
          },
        )
      }
      if (this.lastHouse !== h.id) {
        this.lastHouse = h.id
        this.player.setPosition(400, 528)
        this.path = []
      }
    }
    if (h.id.startsWith('system:hub')) {
      this.floor.setTexture('grass', 0)
      if (!this.children.list.some((o) => o.getData('portal'))) {
        for (const [i, p] of [s.data!.player, ...(h.neighbors || [])]
          .slice(0, 5)
          .entries()) {
          const x = 110 + i * 132,
            y = 170
          const image = this.add
            .image(x, y, 'house')
            .setOrigin(0.5, 1)
            .setDepth(y)
            .setData('portal', true)
            .setInteractive({ useHandCursor: true })
          image.on('pointerdown', () =>
            window.dispatchEvent(
              new CustomEvent('pawtrail:home-visit', { detail: p.id }),
            ),
          )
          this.add
            .image(x + 45, y + 25, 'mailbox')
            .setOrigin(0.5, 1)
            .setDepth(y + 25)
            .setData('portal', true)
            .setInteractive({ useHandCursor: true })
            .on('pointerdown', () =>
              window.dispatchEvent(new Event('pawtrail:home-invites')),
            )
          this.add
            .image(x - 45, y + 20, 'flowerpot')
            .setOrigin(0.5, 1)
            .setDepth(y + 20)
            .setData('portal', true)
          this.add
            .text(x, y + 4, p.name, {
              fontFamily: 'Nunito',
              fontSize: '10px',
              color: '#513d2b',
              backgroundColor: '#fff2cf',
              padding: { x: 4, y: 3 },
            })
            .setOrigin(0.5, 0)
            .setData('portal', true)
        }
      }
    } else
      this.children.list
        .filter((o) => o.getData('portal'))
        .forEach((o) => o.destroy())
    for (const p of h.layout) {
      const image = this.props.get(p.id)
      if (!image) continue
      for (const kind of ['water', 'food'])
        if (p.item.startsWith(kind + '-bowl')) {
          const need = kind === 'water' ? 'water' : 'feed',
            empty = s.pets.some(
              (p) =>
                Date.now() / 1000 - (p.lastCare['need:' + need] || 0) > 3600,
            ),
            texture = 'f:' + kind + '-bowl-' + (empty ? 'empty' : 'full')
          if (this.textures.exists(texture)) image.setTexture(texture)
        }
    }
    const mine = s.data!.player,
      texture = 'p:' + mine.appearance
    if (this.player.texture.key !== texture) this.player.setTexture(texture)
    for (const [id, remote] of Object.entries(s.players)) {
      if (id === mine.id) continue
      let sprite = this.actors.get(id)
      if (!sprite) {
        sprite = this.add
          .sprite(remote.x, remote.y, 'p:' + remote.person.appearance)
          .setOrigin(0.5, 46 / 48)
          .setInteractive({ useHandCursor: true })
        this.actors.set(id, sprite)
        this.labels.set(id, this.label(remote.x, remote.y, remote.person.name))
        sprite.on('pointerdown', () =>
          patch({ selectedPlayer: id, selectedPet: null }),
        )
      }
    }
    for (const [id, sprite] of this.actors)
      if (!s.players[id]) {
        sprite.destroy()
        this.actors.delete(id)
        this.labels.get(id)?.destroy()
        this.labels.delete(id)
      }
    for (const pet of s.pets) {
      let sprite = this.petActors.get(pet.id)
      if (!sprite) {
        sprite = this.add
          .sprite(pet.x, pet.y, 'c:' + pet.sprite)
          .setOrigin(0.5, 46 / 48)
          .setInteractive({ useHandCursor: true })
        this.petActors.set(pet.id, sprite)
        this.labels.set(pet.id, this.label(pet.x, pet.y, pet.profile.name))
        sprite.on('pointerdown', () => selectPet(pet.id))
      }
      if (sprite.texture.key !== 'c:' + pet.sprite)
        sprite.setTexture('c:' + pet.sprite)
    }
    for (const [id, sprite] of this.petActors)
      if (!s.pets.some((p) => p.id === id)) {
        sprite.destroy()
        this.petActors.delete(id)
        this.labels.get(id)?.destroy()
        this.labels.delete(id)
      }
  }
  private label(x: number, y: number, text: string) {
    return this.add
      .text(x, y + 3, text, {
        fontFamily: 'Nunito',
        fontSize: '10px',
        color: '#fff5df',
        backgroundColor: '#563e2e',
        padding: { x: 3, y: 2 },
      })
      .setOrigin(0.5, 0)
      .setDepth(y + 1)
  }
  private preview(pointer: Phaser.Input.Pointer) {
    if (!this.candidate) return
    const world = this.cameras.main.getWorldPoint(pointer.x, pointer.y)
    this.candidate.x = Math.floor(world.x / 32)
    this.candidate.y = Math.floor(world.y / 32)
    this.candidate.rotation = this.rotate
    const def = furniture[this.candidate.item]
    if (!this.ghost)
      this.ghost = this.add
        .image(0, 0, 'f:' + def.id)
        .setOrigin(def.anchor[0] / def.width, def.anchor[1] / def.height)
        .setDepth(9999)
        .setAlpha(0.75)
    this.ghost
      .setPosition(this.candidate.x * 32 + 16, this.candidate.y * 32 + 32)
      .setAngle(this.rotate)
      .setTint(valid(this.candidate, homes.get().draft) ? 0x96d99c : 0xef8e7f)
  }
  private clearGhost() {
    this.ghost?.destroy()
    this.ghost = null
    this.candidate = null
    this.shadow.clear()
    this.props.forEach((p) => p.setAlpha(1))
  }
  private command(c: SceneCommand) {
    if (c.type === 'move') {
      this.joystick = { x: c.x, y: c.y }
      return
    }
    if (c.type === 'focus-pet') {
      const a = this.petActors.get(c.id)
      if (a) {
        this.cameras.main.stopFollow()
        this.cameras.main.pan(a.x, a.y, 300)
        this.time.delayedCall(1800, () =>
          this.cameras.main.startFollow(
            this.player,
            true,
            this.reduced ? 1 : 0.15,
            this.reduced ? 1 : 0.15,
          ),
        )
      }
      return
    }
    if (c.type === 'cancel') {
      this.clearGhost()
      return
    }
    if (c.type === 'place') {
      this.clearGhost()
      this.candidate = {
        id: crypto.randomUUID(),
        item: c.item,
        x: 12,
        y: 10,
        rotation: 0,
      }
      this.rotate = 0
      this.preview(this.input.activePointer)
      return
    }
    if (c.type === 'rotate' && this.candidate) {
      if (furniture[this.candidate.item].rotatable) {
        this.rotate = (this.rotate + 90) % 360
        this.candidate.rotation = this.rotate
        this.ghost?.setAngle(this.rotate)
      }
      return
    }
    if (c.type === 'store') {
      const id = homes.get().selectedFurniture
      if (id) edit(homes.get().draft.filter((p) => p.id !== id))
      this.clearGhost()
      return
    }
    if (c.type === 'care') {
      const p = homes.get().pets.find((p) => p.id === c.pet)
      if (!p) return
      this.queueCare = { pet: p.id, action: c.action }
      this.path = findPath(
        this.player,
        p,
        24,
        18,
        this.solidSet(homes.get().data!.house.layout),
      )
      return
    }
    if (c.type === 'photo') {
      this.photoPending = true
      this.game.renderer.snapshot((image) => {
        if ('src' in image)
          action({
            type: 'photo',
            image: image.src,
            caption: 'A moment at ' + homes.get().data?.house.name,
          })
        patch({ photoMode: false })
        this.photoPending = false
      })
      return
    }
    if (c.type === 'interact') this.interact()
  }
  private interact() {
    const s = homes.get()
    const board=!!s.data?.house.id.startsWith('system:hub')&&Phaser.Math.Distance.Between(this.player.x,this.player.y,336,320)<75
    if(board){this.path=[];window.dispatchEvent(new CustomEvent('pawtrail:home-panel',{detail:'board'}));void audio.playSample('/assets/game/audio/missions/board.wav');return}
    const found=SHARED_FINDS.find((find)=>!s.data?.player.facts.includes('world-find:'+find.id)&&Phaser.Math.Distance.Between(this.player.x,this.player.y,find.x,find.y)<70)
    if(found){this.path=[];action({type:'world-pickup',target:found.id});this.actionName='pick_up_furniture';this.actionUntil=this.time.now+700;void audio.playSample('/assets/game/audio/inventory/pickup.wav');return}
    if(Phaser.Math.Distance.Between(this.player.x,this.player.y,528,448)<70){this.path=[];window.dispatchEvent(new Event('pawtrail:home-invites'));return}
    const pet = s.pets.find(
      (p) =>
        Phaser.Math.Distance.Between(p.x, p.y, this.player.x, this.player.y) <
        70,
    )
    if (pet) {
      selectPet(pet.id)
      return
    }
    const p = s.data?.house.layout.find(
      (p) =>
        Phaser.Math.Distance.Between(
          p.x * 32 + 16,
          p.y * 32 + 32,
          this.player.x,
          this.player.y,
        ) < 100,
    )
    if (p) live({ type: 'furniture.interact', item: p.id })
  }
  private event(e: Record<string, unknown>) {
    const s = homes.get(),
      id = String(e.id || e.actor || ''),
      actor = id === s.data?.player.id ? this.player : this.actors.get(id)
    if(e.type==='player.cat-sound') {
      const point=actor??{x:Number(e.x),y:Number(e.y)}
      catReaction(this,point,String(e.emote),id===s.data?.player.id,Phaser.Math.Distance.Between(this.player.x,this.player.y,point.x,point.y))
    }
    if (e.type === 'player.join' && !s.data?.player.quiet) {
      const p = e.player as { id: string }
      if (p.id !== s.data?.player.id) {
        const a = this.actors.get(p.id)
        if (a && !this.reduced) {
          a.setAlpha(0)
          this.tweens.add({ targets: a, alpha: 1, duration: 300 })
        }
        audio.effect('door')
      }
    }
    if (e.type === 'reward') {
      audio.effect('quest')
    }
    if (e.type === 'ready') {
      const me = s.data && s.players[s.data.player.id]
      if (me) this.player.setPosition(me.x, me.y)
    }
    if (e.type === 'correction') {
      this.player.setPosition(Number(e.x), Number(e.y))
      this.path = []
    }
    if (e.type === 'player.chat' && !s.mutedChat) {
      const person = e.player as { id: string },
        target =
          person.id === s.data?.player.id
            ? this.player
            : this.actors.get(person.id)
      if (target) {
        this.bubbles.get(person.id)?.destroy()
        const bubble = this.add
          .text(
            target.x,
            target.y - 70,
            String(e.text).slice(0, 110) +
              (String(e.text).length > 110 ? '…' : ''),
            {
              fontFamily: 'Inter',
              fontSize: '11px',
              color: '#45362a',
              backgroundColor: '#fff9ed',
              wordWrap: { width: 150 },
              padding: { x: 7, y: 5 },
            },
          )
          .setOrigin(0.5, 1)
          .setDepth(20000)
        this.bubbles.set(person.id, bubble)
        this.time.delayedCall(6500, () => {
          bubble.destroy()
          this.bubbles.delete(person.id)
        })
      }
      audio.effect('ui')
    }
    if (e.type === 'player.emote' && actor) {
      const emote = String(e.emote),
        effect = catalogue.effects[emote] ? emote : 'happy'
      const icon = this.add
        .sprite(actor.x, actor.y - 65, 'e:' + effect)
        .setDepth(20000)
        .play('e:' + effect)
      this.time.delayedCall(1800, () => icon.destroy())
      const animation =
        emote === 'wave'
          ? 'wave'
          : emote === 'dance'
            ? 'dance'
            : emote === 'clap'
              ? 'clap'
              : emote === 'cheer'
                ? 'cheer'
                : 'laugh'
      if (id === s.data?.player.id) {
        this.actionName = animation
        this.actionUntil = this.time.now + 1500
      }
      audio.effect('ui')
    }
    if (e.type === 'furniture.interact' && actor) {
      const name = String(e.action)
      if (id === s.data?.player.id) {
        this.actionName =
          name === 'sleep' ? 'sleep' : name === 'sit' ? 'sit' : 'hold_item'
        this.actionUntil = this.time.now + 2500
      }
      patch({
        notice:
          name === 'watch'
            ? 'The television hums softly.'
            : name === 'read'
              ? 'A quiet moment with a good book.'
              : 'Enjoying a cozy moment.',
      })
      audio.effect('ui')
    }
    if (e.type === 'pet.updated' && e.actor === s.data?.player.id) {
      this.actionName =
        e.action === 'feed'
          ? 'feed'
          : e.action === 'water'
            ? 'refill_water'
            : e.action === 'play'
              ? 'play'
              : 'pet'
      this.actionUntil = this.time.now + 1500
      audio.effect(
        e.action === 'feed' ? 'feed' : e.action === 'water' ? 'water' : 'pet',
      )
      if (e.action === 'pet') audio.effect('purr')
    }
  }
  update(time: number, delta: number) {
    const s = homes.get()
    if (!s.data || !this.player) return
    const world=sharedWorld(),outside=s.data.house.id.startsWith('system:hub')
    if(world){this.atmosphere?.step(time,delta,world,!outside);audio.setScene(outside?'neighborhood':'shelter',dayPhase(world.minute))}
    this.communityBoard?.setVisible(outside)
    for(const find of SHARED_FINDS){const sprite=this.discoveries.get(find.id);sprite?.setVisible(find.id==='community-letter'||!s.data.player.facts.includes('world-find:'+find.id));if(sprite)sprite.y=find.y+(this.reduced||find.id==='community-letter'?0:Math.sin(time/550+find.x)*1.5)}
    const nearFind=SHARED_FINDS.find((find)=>!s.data?.player.facts.includes('world-find:'+find.id)&&Phaser.Math.Distance.Between(this.player.x,this.player.y,find.x,find.y)<70)
    const nearBoard=outside&&Phaser.Math.Distance.Between(this.player.x,this.player.y,336,320)<75
    this.interactionHint?.setVisible(!!nearFind||nearBoard).setText(nearBoard?'E · Community Board':nearFind?'E · '+nearFind.name:'').setPosition(this.player.x,this.player.y-65)
    const active = document.activeElement,
      typing =
        active?.matches('input,textarea,[contenteditable=true]') ||
        !!document.querySelector('[role=dialog]')
    let x = 0,
      y = 0
    if (s.status === 'online' && !typing && !s.decoration) {
      x =
        (this.keys.D.isDown || this.keys.RIGHT.isDown ? 1 : 0) -
        (this.keys.A.isDown || this.keys.LEFT.isDown ? 1 : 0) +
        this.joystick.x
      y =
        (this.keys.S.isDown || this.keys.DOWN.isDown ? 1 : 0) -
        (this.keys.W.isDown || this.keys.UP.isDown ? 1 : 0) +
        this.joystick.y
      if (x || y) {
        this.path = []
        this.queueCare = null
      } else if (this.path.length) {
        const target = this.path[0],
          dx = target.x - this.player.x,
          dy = target.y - this.player.y,
          l = Math.hypot(dx, dy)
        if (l < 4) this.path.shift()
        else {
          x = dx / l
          y = dy / l
        }
      }
    }
    const length = Math.hypot(x, y),
      step = (105 * Math.min(delta, 50)) / 1000,
      solid = this.solidSet(s.data.house.layout)
    if (length) {
      x /= Math.max(1, length)
      y /= Math.max(1, length)
      const nx = this.player.x + x * step,
        ny = this.player.y + y * step
      if (
        !solid.has(Math.floor(nx / 32) + ',' + Math.floor(this.player.y / 32))
      )
        this.player.x = nx
      if (
        !solid.has(Math.floor(this.player.x / 32) + ',' + Math.floor(ny / 32))
      )
        this.player.y = ny
      this.direction =
        Math.abs(x) > Math.abs(y)
          ? x < 0
            ? 'left'
            : 'right'
          : y < 0
            ? 'up'
            : 'down'
      if (time > this.lastStep) {
        this.lastStep = time + 350
        audio.effect('step-path')
      }
    }
    const appearance = s.data.player.appearance,
      prefix = 'p:' + appearance + ':',
      desired =
        time < this.actionUntil
          ? this.actionName
          : length
            ? 'walk_' + this.direction
            : 'idle_' + this.direction
    const key = this.anims.exists(prefix + desired)
      ? prefix + desired
      : prefix + 'idle_down'
    this.player.play(key, true).setDepth(this.player.y)
    if (
      s.status === 'online' &&
      time - this.lastSend > 100 &&
      (Math.hypot(this.player.x - this.sent.x, this.player.y - this.sent.y) >
        0.5 ||
        this.direction !== this.sent.direction ||
        !!length !== this.sent.walking)
    ) {
      this.sent = {
        x: this.player.x,
        y: this.player.y,
        direction: this.direction,
        walking: !!length,
      }
      this.lastSend = time
      live({
        type: 'player.move',
        x: this.player.x,
        y: this.player.y,
        direction: this.direction,
        walking: !!length,
      })
    }
    if (!typing && Phaser.Input.Keyboard.JustDown(this.keys.E)) this.interact()
    if (s.decoration && this.candidate && !typing) {
      if (Phaser.Input.Keyboard.JustDown(this.keys.R))
        this.command({ type: 'rotate' })
      for (const [key, dx, dy] of [
        ['LEFT', -1, 0],
        ['RIGHT', 1, 0],
        ['UP', 0, -1],
        ['DOWN', 0, 1],
      ] as const)
        if (Phaser.Input.Keyboard.JustDown(this.keys[key])) {
          this.candidate.x += dx
          this.candidate.y += dy
          this.ghost?.setPosition(
            this.candidate.x * 32 + 16,
            this.candidate.y * 32 + 32,
          )
        }
      if (
        Phaser.Input.Keyboard.JustDown(this.keys.ENTER) &&
        valid(this.candidate, s.draft)
      ) {
        edit([
          ...s.draft.filter((p) => p.id !== this.candidate!.id),
          this.candidate,
        ])
        this.clearGhost()
      }
      if (Phaser.Input.Keyboard.JustDown(this.keys.ESC)) this.clearGhost()
    }
    if (this.queueCare) {
      const p = s.pets.find((p) => p.id === this.queueCare!.pet)
      if (p && Math.hypot(p.x - this.player.x, p.y - this.player.y) < 78) {
        live({ type: 'pet.interact', pet: p.id, action: this.queueCare.action })
        this.queueCare = null
        this.path = []
      } else if (!this.path.length) this.queueCare = null
    }
    for (const [id, a] of this.actors) {
      const r = s.players[id] ? { ...s.players[id], ...movement(id) } : null
      if (!r) continue
      a.x = Phaser.Math.Linear(a.x, r.x, Math.min(1, delta / 100))
      a.y = Phaser.Math.Linear(a.y, r.y, Math.min(1, delta / 100))
      const key =
        'p:' +
        r.person.appearance +
        ':' +
        (r.walking ? 'walk_' : 'idle_') +
        r.direction
      if (this.anims.exists(key)) a.play(key, true)
      a.setDepth(a.y)
      this.labels
        .get(id)
        ?.setPosition(a.x, a.y + 3)
        .setDepth(a.y + 1)
    }
    if (time > this.nextVoice) {
      this.nextVoice = time + 12000 + Math.random() * 14000
      const pet = s.pets.find(
        (p) => Math.hypot(p.x - this.player.x, p.y - this.player.y) < 150,
      )
      if (pet)
        audio.effectAt(
          pet.state === 'sleep' ? 'purr' : 'meow',
          Math.hypot(pet.x - this.player.x, pet.y - this.player.y),
        )
    }
    for (const p of s.pets) {
      const a = this.petActors.get(p.id)
      if (!a) continue
      let px = p.x,
        py = p.y
      if (p.next) {
        const dx = p.next[0] - p.x,
          dy = p.next[1] - p.y,
          l = Math.hypot(dx, dy) || 1,
          d = Math.min(
            l,
            28 * Math.min(1.2, (performance.now() - s.petTick) / 1000),
          )
        px += (dx / l) * d
        py += (dy / l) * d
      }
      const dx = px - a.x,
        dy = py - a.y,
        moving = Math.hypot(dx, dy) > 2
      a.x = Phaser.Math.Linear(a.x, px, Math.min(1, delta / 150))
      a.y = Phaser.Math.Linear(a.y, py, Math.min(1, delta / 150))
      const direction =
        Math.abs(dx) > Math.abs(dy)
          ? dx < 0
            ? 'left'
            : 'right'
          : dy < 0
            ? 'up'
            : 'down'
      const names: Record<string, string> = {
        idle: 'standing',
        wander: 'walk_' + direction,
        sit: 'sitting',
        sleep: 'sleep',
        stretch: 'stretch',
        groom: 'groom',
        eat: 'eat',
        drink: 'drink',
        play: 'play',
        petted: 'pet',
        happy: 'happy',
        scratch: 'scratch_post',
        sofa: 'sofa_sit',
        hide: 'lie_down',
        watch: 'standing',
        follow: 'walk_' + direction,
        approach: 'walk_' + direction,
      }
      const key =
        'c:' +
        p.sprite +
        ':' +
        (moving ? 'walk_' + direction : names[p.state] || 'standing')
      if (this.anims.exists(key)) a.play(key, true)
      a.setDepth(a.y)
      this.labels
        .get(p.id)
        ?.setPosition(a.x, a.y + 3)
        .setDepth(a.y + 1)
        .setVisible(
          s.selectedPet === p.id ||
            Math.hypot(a.x - this.player.x, a.y - this.player.y) < 100,
        )
      a.setTint(s.selectedPet === p.id ? 0xffd995 : 0xffffff)
    }
    for (const [id, b] of this.bubbles) {
      const target = id === s.data.player.id ? this.player : this.actors.get(id)
      if (target) b.setPosition(target.x, target.y - 65)
    }
    this.shadow.clear()
    if (s.decoration) {
      this.shadow.lineStyle(1, 0x725f48, 0.18)
      for (let x = 32; x < 768; x += 32) this.shadow.lineBetween(x, 32, x, 544)
      for (let y = 32; y < 576; y += 32) this.shadow.lineBetween(32, y, 736, y)
      if (this.candidate) {
        const ok = valid(this.candidate, s.draft)
        this.shadow.lineStyle(2, ok ? 0x328d51 : 0xc84337, 1)
        this.shadow.strokeRect(
          this.candidate.x * 32,
          this.candidate.y * 32,
          32,
          32,
        )
      }
    }
  }
}
export function createHomeGame(parent: HTMLElement) {
  return new Phaser.Game({
    type: Phaser.AUTO,
    parent,
    backgroundColor: '#ead7b5',
    pixelArt: true,
    roundPixels: true,
    antialias: false,
    autoFocus: false,
    scale: {
      mode: Phaser.Scale.RESIZE,
      width: parent.clientWidth,
      height: parent.clientHeight,
    },
    scene: [HomeScene],
    audio: { noAudio: true },
    input: { activePointers: 3 },
  })
}
