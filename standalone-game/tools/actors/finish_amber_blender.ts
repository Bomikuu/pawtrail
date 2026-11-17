/** Produce an offline art contact sheet with the game's actual palette/contour. */
import { createRequire } from 'node:module'
import { readFileSync, writeFileSync } from 'node:fs'
import { resolve } from 'node:path'
import { PixelFinish } from '../../src/game/actor-rig/pixel-finish'

const root = resolve('assets/actor-appearances/amber-blender-mcp-v1')
const require = createRequire(resolve(process.env.PAWTRAIL_CANVAS_ROOT ?? '/run/media/micxsz/Drive/Blender/authoring', 'package.json'))
const { createCanvas, loadImage, ImageData } = require('@napi-rs/canvas')
Object.assign(globalThis, { ImageData })
const source = JSON.parse(readFileSync(resolve(root, 'source.json'), 'utf8'))
const finish = new PixelFinish(Object.values(source.appearance.colors))
const sheet = createCanvas(768, 1280), ctx = sheet.getContext('2d')
ctx.fillStyle = '#ece8d9'; ctx.fillRect(0, 0, sheet.width, sheet.height)
ctx.imageSmoothingEnabled = false
ctx.fillStyle = '#453026'; ctx.font = 'bold 18px sans-serif'
ctx.fillText('Current Amber', 72, 28); ctx.fillText('Blender MCP revision', 435, 28)
for (const [row, heading] of ['front', 'three-quarter', 'side'].entries()) {
  for (const [column, model] of ['current', 'blender'].entries()) {
    const canvas = createCanvas(128,160), c = canvas.getContext('2d')
    c.drawImage(await loadImage(resolve(root, `renders/${model}-${heading}.png`)),0,0)
    c.putImageData(finish.finish(c.getImageData(0,0,128,160),2),0,0)
    writeFileSync(resolve(root, `renders/${model}-${heading}-pixel.png`),canvas.toBuffer('image/png'))
    ctx.drawImage(canvas,0,16,128,128,column*384,44+row*400,384,384)
  }
  ctx.fillStyle = '#453026'; ctx.font = '15px sans-serif'
  ctx.fillText(heading,16,55+row*400)
}
writeFileSync(resolve(root,'model-contact-sheet.png'),sheet.toBuffer('image/png'))
console.log('Offline Blender art contact sheet saved. Browser/game action review remains pending.')
