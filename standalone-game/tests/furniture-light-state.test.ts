import test from 'node:test'
import assert from 'node:assert/strict'
import fs from 'node:fs'
import { furnitureStateView } from '../src/game/furniture/state-view'
import type { ObjectState } from '../src/game/housing/types'
import { furniture, groundForState } from '../src/game/housing/geometry'

test('candles default lit, toggle to real off art and restore canonical on art',()=>{
  const candle=furniture.candles
  assert.equal(furnitureStateView(candle).file,candle.file)
  assert.equal(furnitureStateView(candle,{lit:true}).suffix,'')
  assert.equal(furnitureStateView(candle,{lit:false}).suffix,':unlit')
  assert.notEqual(furnitureStateView(candle,{lit:false}).file,candle.file)
  const offState:ObjectState={lit:false}
  assert.deepEqual(groundForState(candle,offState),candle.geometry.ground)
  assert.deepEqual(candle.supportedRotations,[0])
  assert.equal(candle.price,31)
})

test('legacy lights and door passage retain their existing selection/geometry',()=>{
  const light={file:'original',stateViews:undefined}
  assert.deepEqual(furnitureStateView(light,{lit:false}),{file:'original',suffix:''})
  const door=furniture['wooden-door']
  assert.equal(furnitureStateView(door,{open:true}).suffix,':open')
  assert.deepEqual(groundForState(door,{open:true}),door.stateViews!.open!.ground)
})

test('frontend/backend candle contracts agree; states use existing lit authority',()=>{
  const frontend=JSON.parse(fs.readFileSync('src/game/housing/catalog.json','utf8')).items.find((i:{id:string})=>i.id==='candles')
  const backend=JSON.parse(fs.readFileSync('backend/housing/catalog.json','utf8')).items.find((i:{id:string})=>i.id==='candles')
  assert.deepEqual(frontend,backend)
  assert.deepEqual(frontend.geometry.actions,['toggle_light','inspect'])
  for(const file of [frontend.file,frontend.stateViews.unlit.file])assert.ok(fs.existsSync('public'+file))
})
