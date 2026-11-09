// Install only the approved first pair; source exports remain authoritative.
import fs from 'node:fs/promises'
import path from 'node:path'

const root = path.resolve(import.meta.dirname, '..')
const entries = []
for (const [id, kind, folder] of [
  ['rescuer', 'player', 'rescuer'],
  ['orange_tabby', 'cat', 'orange-tabby'],
]) {
  const source = path.join(root, 'assets/animation-approval-v1/exports', folder)
  const destination = path.join(root, 'public/pawtrail-game/game-assets/baked-actors-v8', folder)
  const manifest = JSON.parse(await fs.readFile(path.join(source, 'manifest.json'), 'utf8'))
  await fs.mkdir(destination, {recursive: true})
  for (const file of ['spritesheet.png', 'manifest.json']) {
    await fs.copyFile(path.join(source, file), path.join(destination, file))
  }
  await fs.copyFile(path.join(source, 'sprites/idle/down/0.png'), path.join(destination, 'portrait.png'))
  const {frameWidth, frameHeight, columns, rows, spacing, margin, anchor, groundPixel, animations} = manifest
  entries.push({id, kind, texture: `actor:baked:v8:${kind}:${id}`,
    file: `/pawtrail-game/game-assets/baked-actors-v8/${folder}/spritesheet.png`,
    frameWidth, frameHeight, columns, rows, spacing, margin, anchor, groundPixel, animations})
}
await fs.writeFile(path.join(root, 'src/game/runtime/baked-actors.json'), JSON.stringify(entries, null, 2) + '\n')
const carSource=path.join(root,'assets/animation-approval-v1/exports/emote-car')
const carDestination=path.join(root,'public/pawtrail-game/game-assets/emote-car-v1')
await fs.mkdir(carDestination,{recursive:true})
for(const file of ['spritesheet.png','manifest.json'])await fs.copyFile(path.join(carSource,file),path.join(carDestination,file))
const car=JSON.parse(await fs.readFile(path.join(carSource,'manifest.json'),'utf8'))
await fs.writeFile(path.join(root,'src/game/runtime/emote-car.json'),JSON.stringify({
  ...car,texture:'actor:emote-car:v1',file:'/pawtrail-game/game-assets/emote-car-v1/spritesheet.png',
},null,2)+'\n')
console.log('Installed the rescuer and orange tabby pixel animation pair.')
