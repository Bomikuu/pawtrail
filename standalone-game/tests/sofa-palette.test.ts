import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import crypto from 'node:crypto'
import data from '../src/game/furniture/palettes/sofa.json'
import {decodePaletteMask,normalizePaletteColor,recolorUpholstery,upholsteryRamp,SOFA_DEFAULT_COLOR} from '../src/game/furniture/palette-color'

test('palette changes only masked RGB, preserves all protected RGBA and never mutates source',()=>{
 const source=new Uint8ClampedArray([137,138,74,255,242,227,197,255,177,84,49,255,155,155,100,0])
 const mask=new Uint8Array([3,0,0,3]),before=new Uint8ClampedArray(source)
 const result=recolorUpholstery(source,mask,upholsteryRamp('#376db7',data.shades))
 assert.notDeepEqual(result.slice(0,3),source.slice(0,3))
 assert.deepEqual(result.slice(3),source.slice(3))
 assert.deepEqual(source,before)
})
test('original palette restores exactly and dark/light colors retain tonal separation',()=>{
 const values=data.shades.flatMap(h=>[...Buffer.from(h.slice(1),'hex'),255])
 const source=new Uint8ClampedArray(values),mask=new Uint8Array(data.shades.map((_,i)=>i+1))
 assert.deepEqual(recolorUpholstery(source,mask,upholsteryRamp(SOFA_DEFAULT_COLOR,data.shades)),source)
 for(const color of ['#000000','#ffffff','#376db7','#e5d5b2'])assert.ok(new Set(upholsteryRamp(color,data.shades).map(c=>c.join(','))).size>1)
})
test('foreground and base use the same ramp without changing transparency or other instances',()=>{
 const base=new Uint8ClampedArray([137,138,74,255,137,138,74,255]),front=new Uint8ClampedArray([137,138,74,255,0,0,0,0]),mask=new Uint8Array([3,3])
 const blue=upholsteryRamp('#376db7',data.shades),rose=upholsteryRamp('#b86a82',data.shades)
 const a=recolorUpholstery(base,mask,blue),b=recolorUpholstery(front,mask,blue),c=recolorUpholstery(base,mask,rose)
 assert.deepEqual(a.slice(0,4),b.slice(0,4));assert.deepEqual(b.slice(4),front.slice(4))
 const saved=new Uint8ClampedArray(c);a[0]=0;assert.deepEqual(c,saved);assert.deepEqual(base,new Uint8ClampedArray([137,138,74,255,137,138,74,255]))
})
test('bad colors and malformed masks are rejected',()=>{
 assert.equal(normalizePaletteColor('#AABBCC'),'#aabbcc')
 for(const color of ['red','#fff','#gg0000','#00000000'])assert.throws(()=>normalizePaletteColor(color))
 assert.throws(()=>decodePaletteMask([[4097,1]],4096,7));assert.throws(()=>decodePaletteMask([[4096,8]],4096,7));assert.throws(()=>decodePaletteMask([[2,0]],4096,7))
})
test('native masks match immutable sources and protect semantic front pillows/feet and profile pillow interiors',()=>{
 const reference=JSON.parse(fs.readFileSync('src/game/furniture/references/couch.json','utf8'))
 for(const [rotation,view]of Object.entries(data.views)){
  const mask=decodePaletteMask(view.runs,4096,data.shades.length)
  assert.ok(mask.some(Boolean));assert.equal(mask.filter(Boolean).length,view.upholsteryPixels)
  for(const [file,hash]of [[view.file,view.sourceSha256],[view.foreground,view.foregroundSha256]])assert.equal(crypto.createHash('sha256').update(fs.readFileSync('public'+file)).digest('hex'),hash)
  if(rotation==='0')for(const key of ['feet','pillowLeft','pillowRight']){
   const layer=Buffer.from(reference.layers[key],'base64')
   layer.forEach((pixel:number,i:number)=>{if(pixel)assert.equal(mask[i],0,key+' pixel '+i)})
  }
  for(const [y,left,right]of view.protectedPillowSpans)for(let x=left;x<=right;x++)assert.equal(mask[y*64+x],0)
  if(rotation!=='0')assert.ok(mask.slice(55*64).every(v=>v===0),'wooden feet stay protected')
 }
})
