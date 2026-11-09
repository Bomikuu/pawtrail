#!/usr/bin/env node
// Requested native visual evidence and starter-asset export, not a test suite/build.
import {createServer} from 'vite'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
const run=promisify(execFile),root=path.resolve(import.meta.dirname,'..'),evidence=path.join(root,'assets/maya-portrait/evidence')
let origin=''
const server=await createServer({configFile:false,root,optimizeDeps:{entries:[]},server:{host:'127.0.0.1',port:0,strictPort:true,watch:null},plugins:[{name:'maya-native-evidence',configureServer(server){
 server.middlewares.use('/__maya_export',async(req,res)=>{try{
  if(req.method!=='POST'||req.headers.origin!==origin){res.statusCode=403;res.end();return}
  let size=0;const chunks=[];for await(const chunk of req){size+=chunk.length;if(size>24_000_000)throw Error('Evidence export too large');chunks.push(chunk)}
  const data=JSON.parse(Buffer.concat(chunks).toString());if(!Array.isArray(data.frames)||data.frames.length>128)throw Error('Invalid evidence frame count')
  for(const frame of data.frames){if(!/^(baseline-[a-z-]+|turntable\/\d{3})$/.test(frame.name))throw Error('Invalid evidence filename');const file=path.join(evidence,frame.name+'.png');await fs.mkdir(path.dirname(file),{recursive:true});await fs.writeFile(file,Buffer.from(frame.png,'base64'))}
  await fs.mkdir(path.join(root,'assets/maya-portrait/handoff'),{recursive:true});await fs.writeFile(path.join(root,'assets/maya-portrait/handoff/prototype-bust.glb'),Buffer.from(data.model,'base64'))
  await fs.writeFile(path.join(evidence,'baseline-report.json'),JSON.stringify(data.report,null,2)+'\n');res.setHeader('Content-Type','application/json');res.end(JSON.stringify({exportedFrames:data.frames.length,asset:'unapproved procedural starter'}))
 }catch(e){res.statusCode=500;res.end(e.message)}})
}}]})
const session='maya-reference-evidence-'+process.pid
const cli=async(...args)=>{const r=await run('npx',['--offline','--yes','--package','@playwright/cli','playwright-cli','-s='+session,...args],{cwd:root,maxBuffer:2_000_000,timeout:90000});if(r.stdout.includes('### Error'))throw Error(r.stdout);return r.stdout}
try{
 await server.listen();origin='http://127.0.0.1:'+server.httpServer.address().port
 await cli('open',origin+'/assets/animation-approval-v1/source/index.html','--browser=firefox')
 await cli('run-code',await fs.readFile(path.join(root,'assets/maya-portrait/reference/render-evidence.js'),'utf8'))
 console.log('Exported Maya baseline discrepancy, seven views, 96-frame turntable, expressions, variation and editable starter GLB.')
}finally{try{await cli('close')}catch{}await server.close()}
