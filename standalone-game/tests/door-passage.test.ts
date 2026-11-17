import test from 'node:test'
import assert from 'node:assert/strict'
import { Navigation } from '../src/game/housing/spatial'

const door={id:'door-under-test',item:'wooden-door',x:3.5,y:3,rotation:0}
const environment={width:256,height:256,rects:[]}
const navigation=(open:boolean,item='wooden-door')=>new Navigation([{...door,item}],false,'interior','studio',{[door.id]:{open}},environment)

test('closed panel blocks passage; open doorway allows a full foot body through',()=>{
 const from={x:128,y:160},to={x:128,y:80}
 assert.equal(navigation(false).segment(from,to),false)
 assert.equal(navigation(true).segment(from,to),true)
})
test('opening preserves solid jambs on both sides instead of deleting the object collider',()=>{
 const open=navigation(true)
 assert.equal(open.clear({x:112,y:120}),false)
 assert.equal(open.clear({x:148,y:120}),false)
 assert.equal(open.clear({x:128,y:120}),true)
 assert.equal(open.segment({x:128,y:120},{x:110,y:120}),false)
})
test('an open flag cannot make furniture without authored passage states traversable',()=>{
 assert.equal(navigation(false,'sofa').clear({x:128,y:120}),false)
 assert.equal(navigation(true,'sofa').clear({x:128,y:120}),false)
})
