#!/usr/bin/env node
// Production art export. No game navigation, project tests, builds or checks.
import fs from 'node:fs/promises'
import path from 'node:path'
import {createHash} from 'node:crypto'
import {spawn,execFile} from 'node:child_process'
import {promisify} from 'node:util'

const run=promisify(execFile),root=path.resolve(import.meta.dirname,'..')
const args=process.argv.slice(2),value=flag=>args[args.indexOf(flag)+1]
if(!['render','pack'].includes(args[0]))throw Error('Use: node scripts/pawtrail-actors.mjs render --id ID [--actions idle,walk] or render --all [--actions walk]')
let stopping=false
const catalogue=JSON.parse(await fs.readFile(path.join(root,'assets/actor-appearances/catalog.json'),'utf8'))
const ids=args.includes('--ids')?value('--ids')?.split(','):args.includes('--id')?[value('--id')]:[]
const selected=args.includes('--all')?catalogue.appearances:catalogue.appearances.filter(entry=>ids.includes(entry.id))
if(!args.includes('--all')&&ids.some(id=>!catalogue.appearances.some(entry=>entry.id===id)))throw Error('One or more appearance IDs are unknown.')
if(!selected.length)throw Error('Choose a known appearance with --id or use --all.')
const actions=args.includes('--actions')?value('--actions').split(',').filter(Boolean):undefined
const hash=data=>createHash('sha256').update(data).digest('hex')
const legacySignature=entry=>hash(JSON.stringify({kind:entry.kind,colors:entry.colors??{},accessories:entry.accessories??{}}))
const signature=entry=>hash(JSON.stringify({kind:entry.kind,colors:entry.colors??{},accessories:entry.accessories??{},parts:entry.parts??{},frame:entry.frame??null,...(entry.cat?{cat:entry.cat}:{}),...(entry.face?{face:entry.face}:{})}))
const sourceFor=entry=>path.join(root,entry.id==='rescuer'||entry.id==='orange_tabby'
  ?'assets/animation-approval-v1/exports/'+entry.kind:'assets/actor-appearances/exports/'+entry.id)
const read=async(file,fallback)=>{try{return JSON.parse(await fs.readFile(file,'utf8'))}catch(error){if(error.code==='ENOENT')return fallback;throw error}}
const write=async(file,data)=>{await fs.mkdir(path.dirname(file),{recursive:true});const temp=file+'.tmp-'+process.pid;await fs.writeFile(temp,JSON.stringify(data,null,2)+'\n');await fs.rename(temp,file)}
async function finishAndInstall(entry){
  const source=sourceFor(entry),meta=await read(path.join(source,'appearance-render.json'),null);
    const finished=await run('python3',['scripts/finish-actor-appearance.py',source],{cwd:root,timeout:180000,maxBuffer:500000})
    console.log(finished.stdout.trim())
    if(stopping)throw Error('Appearance export cancelled.')
    const manifest=await read(path.join(source,'manifest.json'),null)
    const revision=hash(Buffer.concat([await fs.readFile(path.join(source,'spritesheet.png')),Buffer.from(JSON.stringify(manifest))])).slice(0,12)
    const folder=`pawtrail-game/actor-studio/appearances/${entry.id}/${revision}`
    const destination=path.join(root,'public',folder);await fs.mkdir(destination,{recursive:true})
    for(const name of ['spritesheet.png','manifest.json','portrait.png'])await fs.copyFile(path.join(source,name),path.join(destination,name))
    const sheet={...manifest,id:entry.id,kind:entry.kind==='rescuer'?'player':'cat',texture:`actor:appearance:${entry.id}:${revision}`,file:'/'+folder+'/spritesheet.png'}
    if(entry.status==='preview'){
      const file=path.join(root,'src/game/runtime/actor-previews.json'),registry=await read(file,[])
      const reference=entry.reference?{file:entry.reference.file,role:entry.reference.role,source:entry.reference.source,brief:entry.reference.brief}:undefined
      const preview={...entry,reference,revision,rigHash:meta.rigHash,portrait:'/'+folder+'/portrait.png',sheet}
      await write(file,[...registry.filter(item=>item.id!==entry.id),preview])
    }else{
      const file=path.join(root,'src/game/runtime/baked-actors.json'),registry=await read(file,[])
      await write(file,[...registry.filter(item=>!(item.id===sheet.id&&item.kind===sheet.kind)),sheet])
    }
    console.log(`Installed ${entry.name} in the ${entry.status} registry (${revision}).`)
}
for(const entry of selected){
  if(!/^[-_a-z0-9]+$/.test(entry.id)||!['rescuer','orange-tabby'].includes(entry.kind)||!['live','preview'].includes(entry.status))throw Error('Invalid appearance catalogue entry.')
  const slots=JSON.parse(await fs.readFile(path.join(root,'src/game/actor-rig/contract.json'),'utf8')).parts
  for(const [slot,choice] of Object.entries(entry.parts??{})){
    if(slot==='backpack'){if(typeof choice!=='boolean')throw Error('Backpack must be true or false.')}
    else if(!slots[slot]?.includes(choice))throw Error('Unsupported geometry slot '+slot+': '+choice)
  }
  if(entry.parts&&entry.kind!=='rescuer')throw Error('Human geometry slots require the rescuer rig.')
  if(entry.cat){
    if(entry.kind!=='orange-tabby')throw Error('Cat morphology requires the shared cat rig.')
    const choices=JSON.parse(await fs.readFile(path.join(root,'src/game/actor-rig/cat-contract.json'),'utf8'))
    for(const [slot,choice] of Object.entries(entry.cat))if(!choices[slot]?.includes(choice))throw Error('Unsupported cat option '+slot+': '+choice)
  }
  if(entry.face){
    if(Object.keys(entry.face).some(key=>!['leftEye','rightEye','nose','marking'].includes(key))||['leftEye','rightEye','nose','marking'].some(key=>typeof entry.face[key]!=='string'||!/^#[0-9a-f]{6}$/i.test(entry.face[key])))throw Error('Face details require four valid hex colors.')
  }
  if(entry.kind==='rescuer'){
    const choices=JSON.parse(await fs.readFile(path.join(root,'src/game/actor-rig/contract.json'),'utf8')).accessories
    for(const [slot,options] of Object.entries(choices))if(entry.accessories?.[slot]!==undefined&&!options.includes(entry.accessories[slot]))throw Error('Unsupported face accessory '+slot)
  }
  if(entry.frame){
    const {width,height}=entry.frame,minimum=entry.kind==='rescuer'?48:32
    if(!Number.isInteger(width)||!Number.isInteger(height)||width<32||height<minimum||width>64||height>80||width%8||height%8)throw Error('Frame padding must use multiples of 8 within 32–64 pixels wide and the base height–80 pixels tall.')
  }
  const previous=await read(path.join(sourceFor(entry),'appearance-render.json'),null)
  const expected=previous?.signatureVersion===2?signature(entry):legacySignature(entry)
  if(actions&&previous?.appearanceSignature&&(previous.appearanceSignature!==expected||(previous.signatureVersion!==2&&(entry.parts||entry.frame||entry.face||entry.cat))))throw Error(entry.id+': appearance geometry, colors, accessories or bounds changed. Render its complete action set.')
  if(actions&&!previous&&!['rescuer','orange_tabby'].includes(entry.id))throw Error(entry.id+': export its complete action set first.')
  const clips=JSON.parse(await fs.readFile(path.join(root,'src/game/actor-rig/actions.json'),'utf8'))[entry.kind]
  if(actions?.some(action=>!Object.hasOwn(clips,action)))throw Error('Unknown action for '+entry.id)
}

if(args[0]==='pack'){
 for(const entry of selected){const meta=await read(path.join(sourceFor(entry),'appearance-render.json'),null);if(!meta||meta.appearanceSignature!==signature(entry))throw Error('Render the current appearance before packing.');await finishAndInstall(entry)}
 process.exit(0)
}

const session='pawtrail-actors-'+process.pid,port=5182
const server=spawn(process.execPath,['scripts/render-animation-approval.mjs'],{cwd:root,env:{...process.env,PAWTRAIL_ART_PORT:String(port)},stdio:['ignore','pipe','pipe']})
let browser=false
const cli=async command=>{
  const result=await run('npx',['--yes','--package','@playwright/cli','playwright-cli','-s='+session,...command],{cwd:root,timeout:180000,maxBuffer:2_000_000})
  if(result.stdout.includes('### Error'))throw Error(result.stdout)
  return result.stdout
}
const abort=()=>{stopping=true;server.kill('SIGTERM')}
process.once('SIGINT',abort);process.once('SIGTERM',abort)
try{
  await new Promise((resolve,reject)=>{
    const deadline=setTimeout(()=>reject(Error('The private art exporter did not start within 30 seconds.')),30000)
    let output=''
    const finish=(error)=>{clearTimeout(deadline);error?reject(error):resolve()}
    server.stdout.on('data',chunk=>{output+=chunk.toString();if(output.includes('Art exporter:'))finish()})
    server.stderr.on('data',chunk=>{output+=chunk.toString()})
    server.once('error',finish);server.once('exit',code=>finish(Error('Art exporter exited ('+code+'): '+output.slice(-2000))))
  })
  browser=true
  await cli(['open',`http://127.0.0.1:${port}/assets/animation-approval-v1/source/index.html`,'--browser=firefox'])
  for(const entry of selected){
    if(stopping)throw Error('Appearance export cancelled.')
    console.log('Rendering '+entry.name+' on the shared '+entry.kind+' rig…')
    const started=Date.now()
    const code=`async(page)=>await page.evaluate(async()=>await window.exportAppearanceApproval(${JSON.stringify(entry.id)},${JSON.stringify(actions)??'undefined'}))`
    console.log((await cli(['run-code',code])).split('### Ran Playwright code')[0].trim())
    const source=sourceFor(entry),meta=await read(path.join(source,'appearance-render.json'),null)
    if(stopping)throw Error('Appearance export cancelled.')
    if(!meta||!meta.exportedAt||meta.exportedAt<started)throw Error('The authoring page did not create fresh appearance metadata.')
    meta.appearanceSignature=signature(entry)
    meta.signatureVersion=2
    meta.rigHash=hash(Buffer.concat(await Promise.all(['rigs.ts','appearance-parts.ts','part-kit.ts','angel-parts.ts','costume-parts.ts','outrider-parts.ts','action-layers.ts','action-playback.ts','jetpack-parts.ts','cat-appearance.ts','cat-parts.ts','cat-contract.json','face-details.ts','actions.json','palette.json','contract.json'].map(file=>fs.readFile(path.join(root,'src/game/actor-rig',file))))))
    meta.updatedActions=actions??Object.keys(meta.actions)
    await write(path.join(source,'appearance-render.json'),meta)
    await finishAndInstall(entry)
  }
  console.log('Preview page: http://127.0.0.1:3000/play?preview=actors')
}finally{
  if(browser)await cli(['close']).catch(error=>console.error('Could not close the private Firefox session:',error.message))
  server.kill('SIGTERM')
  process.removeListener('SIGINT',abort);process.removeListener('SIGTERM',abort)
}
