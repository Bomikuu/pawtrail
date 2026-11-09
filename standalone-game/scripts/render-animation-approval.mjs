import {createServer} from 'vite'
import fs from 'node:fs/promises'
import path from 'node:path'

const root = process.cwd()
const out = path.join(root, 'assets/animation-approval-v1/exports')
const port = Number(process.env.PAWTRAIL_ART_PORT || 5181)
const origin = `http://127.0.0.1:${port}`
const catalogue = JSON.parse(await fs.readFile('assets/actor-appearances/catalog.json','utf8'))
const actions = JSON.parse(await fs.readFile('src/game/actor-rig/actions.json', 'utf8'))
const directions = ['down', 'down_left', 'left', 'up_left', 'up', 'up_right', 'right', 'down_right']
const server = await createServer({
  configFile: false, root,
  optimizeDeps: {entries: ['assets/animation-approval-v1/source/index.html']},
  server: {host: '127.0.0.1', port, strictPort: true,
    watch:{ignored:['**/public/**','**/assets/**/exports/**','**/src/**']}},
  plugins: [{name: 'approval-export', configureServer(server) {
    server.middlewares.use('/__art/appearance',async(req,res)=>{
      try{
        if(req.method!=='POST'||req.headers.origin!==origin){res.statusCode=403;res.end();return}
        let size=0;const chunks=[]
        for await(const chunk of req){size+=chunk.length;if(size>32_000_000)throw Error('Appearance export exceeds 32 MB');chunks.push(chunk)}
        const data=JSON.parse(Buffer.concat(chunks).toString())
        const appearance=catalogue.appearances.find(entry=>entry.id===data.id)
        if(!appearance||!/^[-_a-z0-9]+$/.test(appearance.id))throw Error('Unknown appearance')
        const clips=actions[appearance.kind]
        const directory=appearance.id==='rescuer'||appearance.id==='orange_tabby'
          ?path.join(out,appearance.kind):path.join(root,'assets/actor-appearances/exports',appearance.id)
        for(const frame of data.frames){
          if(!Object.hasOwn(clips,frame.action)||!directions.includes(frame.direction)||!Number.isInteger(frame.frame)||frame.frame<0||frame.frame>=(clips[frame.action].frames??8))throw Error('Invalid appearance frame')
          const folder=path.join(directory,'frames',frame.action,frame.direction);await fs.mkdir(folder,{recursive:true})
          await fs.writeFile(path.join(folder,frame.frame+'.png'),Buffer.from(frame.png,'base64'))
        }
        await fs.writeFile(path.join(directory,'source-rig.glb'),Buffer.from(data.model,'base64'))
        const baseHeight=appearance.kind==='rescuer'?48:32
        const width=appearance.frame?.width??32,height=appearance.frame?.height??baseHeight
        await fs.writeFile(path.join(directory,'appearance-render.json'),JSON.stringify({id:appearance.id,kind:appearance.kind,palette:data.palette,directions,actions:clips,frameWidth:width,frameHeight:height,groundPixel:{x:width/2,y:(baseHeight===48?44:28)+(height-baseHeight)/2},headHeight:appearance.headHeight??(baseHeight===48?38:20),exportedFrameCount:data.frames.length,exportedAt:Date.now()},null,2))
        res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:`Exported ${data.frames.length} native source frames for ${appearance.name}.`}))
      }catch(error){res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:error.message}))}
    })
    server.middlewares.use('/__art/car', async (req, res) => {
      try {
        if(req.method !== 'POST' || req.headers.origin !== origin) {
          res.statusCode=403;res.end();return
        }
        let size=0;const chunks=[]
        for await(const chunk of req){size+=chunk.length;if(size>8_000_000)throw Error('Car export exceeds 8 MB');chunks.push(chunk)}
        const data=JSON.parse(Buffer.concat(chunks).toString()),directory=path.join(out,'emote-car')
        for(const frame of data.frames){
          if(!directions.includes(frame.direction)||!Number.isInteger(frame.frame)||frame.frame<0||frame.frame>=12)throw Error('Invalid car frame')
          const folder=path.join(directory,'frames',frame.direction);await fs.mkdir(folder,{recursive:true})
          await fs.writeFile(path.join(folder,frame.frame+'.png'),Buffer.from(frame.png,'base64'))
        }
        await fs.writeFile(path.join(directory,'source-rig.glb'),Buffer.from(data.model,'base64'))
        await fs.writeFile(path.join(directory,'render.json'),JSON.stringify({palette:data.palette,directions,frames:12,fps:12,frameWidth:data.frameWidth,frameHeight:data.frameHeight,groundPixel:data.groundPixel},null,2))
        res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:'Exported 96 directional car frames with rotating wheels.'}))
      } catch(error){res.statusCode=500;res.setHeader('Content-Type','application/json');res.end(JSON.stringify({message:error.message}))}
    })
    server.middlewares.use('/__art/export', async (req, res) => {
      try {
        if (req.method !== 'POST' || req.headers.origin !== origin) {
          res.statusCode = 403
          res.end()
          return
        }
        let size = 0
        const chunks = []
        for await (const chunk of req) {
          size += chunk.length
          if (size > 32_000_000) throw Error('Art export exceeds 32 MB')
          chunks.push(chunk)
        }
        const data = JSON.parse(Buffer.concat(chunks).toString())
        for (const frame of data.frames) {
          if (!Object.hasOwn(actions, frame.kind) ||
              !Object.hasOwn(actions[frame.kind], frame.action) ||
              !directions.includes(frame.direction) ||
              !Number.isInteger(frame.frame) || frame.frame < 0 ||
              frame.frame >= (actions[frame.kind][frame.action].frames ?? 8)) {
            throw Error('Invalid art frame')
          }
          const directory = path.join(out, frame.kind, 'frames', frame.action, frame.direction)
          await fs.mkdir(directory, {recursive: true})
          await fs.writeFile(path.join(directory, frame.frame + '.png'), Buffer.from(frame.png, 'base64'))
        }
        for (const model of data.models) {
          if (!Object.hasOwn(actions, model.kind)) throw Error('Invalid source model')
          await fs.writeFile(path.join(out, model.kind, 'source-rig.glb'), Buffer.from(model.glb, 'base64'))
        }
        await fs.writeFile(path.join(out, 'render.json'), JSON.stringify({
          palette: data.palette, directions, actions,
          frameCount: directions.length * Object.values(actions).reduce((total, clips) =>
            total + Object.values(clips).reduce((count, clip) => count + (clip.frames ?? 8), 0), 0),
          exportedFrameCount: data.frames.length,
          workflow: 'rigged 3D source → orthographic native frames → palette/outline production pass',
        }, null, 2))
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({message: `Exported ${data.frames.length} frames and 2 animated GLB source rigs.`}))
      } catch (error) {
        res.statusCode = 500
        res.setHeader('Content-Type', 'application/json')
        res.end(JSON.stringify({message: error.message}))
      }
    })
  }}],
})
await server.listen()
console.log(`Art exporter: ${origin}/assets/animation-approval-v1/source/index.html`)
