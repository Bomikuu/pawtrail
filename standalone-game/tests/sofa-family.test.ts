import fs from 'node:fs'
import test from 'node:test'
import assert from 'node:assert/strict'
import { catalogue } from '../src/game/housing/geometry'
import { furnitureAt } from '../src/game/housing/geometry'
import { Navigation, worldPoint } from '../src/game/housing/spatial'
const ids=['sofa-sage','sofa-terracotta','sofa-cream','three-seat-sofa']
const server=JSON.parse(fs.readFileSync('backend/housing/catalog.json','utf8'))
for(const id of ids){
 test(id+' supplies intact original front, matching native frames and stable seats in four directions',()=>{
  const item=catalogue.items.find(i=>i.id===id)!
  assert.equal(item.file,'/assets/game/housing/furniture/'+id+'-complete-v1.png')
  assert.deepEqual(item.supportedRotations,[0,90,180,270])
  for(const rotation of item.supportedRotations!){
   const view=furnitureAt({id:'trial',item:id,x:3.5,y:3,rotation})
   assert.equal(view.geometry.seats.length,id==='three-seat-sofa'?3:2)
   assert.equal(new Set(view.geometry.seats.map(s=>s.id)).size,view.geometry.seats.length)
   for(const file of [view.file,view.frontFile!]){
    const png=fs.readFileSync('public'+file)
    assert.equal(png.readUInt32BE(16),view.width)
    assert.equal(png.readUInt32BE(20),view.height)
   }
  }
 })
 test(id+' keeps exits clear and reachable in every facing',()=>{
  for(const rotation of [0,90,180,270]){
   const p={id:'trial',item:id,x:3.5,y:3,rotation}
   const view=furnitureAt(p),nav=new Navigation([p],false,'interior','studio',{}, {width:256,height:256,rects:[]})
   assert.equal(nav.clear({x:128,y:120}),false,'furniture retains physical ground collision')
   for(const seat of view.geometry.seats){
    const exit=worldPoint(p,seat.exit)
    assert.equal(nav.clear(exit),true,rotation+' '+seat.id+' exit is clear')
    assert.ok(nav.path({x:128,y:200},exit).length>0,rotation+' '+seat.id+' exit is reachable')
   }
  }
 })
}
test('all batch native collision/seat contracts match the authoritative backend catalog',()=>{
 for(const id of ids)assert.deepEqual(catalogue.items.find(i=>i.id===id),server.items.find((i:{id:string})=>i.id===id))
})
