#!/usr/bin/env node
// Isolated Firefox native-art production; does not navigate or verify the game.
import {createServer} from 'vite'
import {execFile} from 'node:child_process'
import {promisify} from 'node:util'
import fs from 'node:fs/promises'
import path from 'node:path'
const run=promisify(execFile),root=path.resolve(import.meta.dirname,'..')
const server=await createServer({configFile:false,root,optimizeDeps:{entries:[]},server:{host:'127.0.0.1',port:0,strictPort:true,watch:null}})
const session='pawtrail-portrait-art-'+process.pid
const cli=async(...args)=>{const result=await run('npx',['--offline','--yes','--package','@playwright/cli','playwright-cli','-s='+session,...args],{cwd:root,maxBuffer:2_000_000,timeout:60000});if(result.stdout.includes('### Error'))throw Error(result.stdout);return result.stdout}
try{
 await server.listen()
 const port=server.httpServer.address().port
 await cli('open',`http://127.0.0.1:${port}/assets/animation-approval-v1/source/index.html`,'--browser=firefox')
 const code=await fs.readFile(path.join(root,'assets/actor-appearances/source/portrait-review.js'),'utf8')
 await cli('run-code',code)
 console.log('Exported assets/actor-appearances/reviews/maya-painted-bust-v4.png (9 native views/expressions plus the Maya style reference).')
}finally{
 try{await cli('close')}catch{}
 await server.close()
}
