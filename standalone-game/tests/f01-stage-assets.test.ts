import test from 'node:test'
import assert from 'node:assert/strict'
import { starterStage, assetsById, assetView, stagePoint, stageRect } from '../src/game/stage-editor/data'
import { groundForState } from '../src/game/housing/geometry'
import { footRect, intersects } from '../src/game/housing/spatial'

test('the three F01 layouts resolve independently while the original district remains available',()=>{
  const maps=['f01-lobby','f01-arrival','f01-market'].map(starterStage)
  assert.equal(new Set(maps.map(map=>map.name)).size,3)
  for(const map of maps)for(const object of map.objects)assert.ok(assetsById[object.asset],object.asset)
  assert.equal(starterStage('cyberpunk').name,'Sampaguita Neon Heights')
})

test('new model contacts use their own native anchor at every supported facing',()=>{
  for(const name of ['lift','allocation','planning','counter'])for(const rotation of [0,90,180,270]){
    const object={id:'local',asset:'f01:'+name,x:400,y:400,elevation:0,layer:'world' as const,bias:0,rotation}
    const view=assetView(object)
    assert.deepEqual(stagePoint(object,view.anchor),{x:400,y:400})
    for(const approach of view.geometry.approaches){
      const foot=footRect(stagePoint(object,approach))
      assert.ok(!view.geometry.ground.some(rect=>intersects(foot,stageRect(object,rect))),name+' '+rotation+' has no clear action approach')
    }
  }
})

test('opening the lift clears its passage and retains both frame columns',()=>{
  for(const rotation of [0,90,180,270]){
    const object={id:'lift',asset:'f01:lift',x:400,y:400,elevation:0,layer:'world' as const,bias:0,rotation},view=assetView(object)
    const passage=footRect({x:400,y:400})
    assert.ok(groundForState(view,{open:false}).some(rect=>intersects(passage,stageRect(object,rect))))
    assert.equal(groundForState(view,{open:true}).length,2)
    assert.ok(!groundForState(view,{open:true}).some(rect=>intersects(passage,stageRect(object,rect))))
  }
})

test('floor NPCs resolve local contacts without entering the housing catalogue',()=>{
  for(const name of ['mara','ivo']){
    const object={id:name,asset:'f01:'+name,x:400,y:500,elevation:0,layer:'world' as const,bias:0,rotation:0},view=assetView(object)
    assert.deepEqual(stagePoint(object,view.anchor),{x:400,y:500})
    assert.ok(view.geometry.actions.includes('talk_npc'))
    assert.ok(view.geometry.approaches.some(point=>!view.geometry.ground.some(rect=>intersects(footRect(stagePoint(object,point)),stageRect(object,rect)))))
  }
})
