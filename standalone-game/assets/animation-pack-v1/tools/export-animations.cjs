const fs = require('node:fs/promises')
const path = require('node:path')
let sharp
try { sharp = require('sharp') } catch { sharp = require('/home/micxsz/projects/pawtrail/.worktrees/implementation/node_modules/sharp') }
const root = path.resolve(__dirname, '..')
const humanRows = [['walk_down',6,9],['walk_up',6,9],['walk_left',6,9],['walk_right',6,9],['idle_down',4,4],['idle_up',4,4],['idle_left',4,4],['idle_right',4,4],['feed',6,7],['pet',6,6],['pick_up',6,7],['sit',4,4]]
const animalRows = [['idle',4,4],['walk_down',4,7],['walk_up',4,7],['walk_left',4,7],['walk_right',4,7],['sit',4,4],['sleep',4,2],['eat',6,5],['happy',4,6],['petted',4,4]]
const palette = require('../../pixel-art-v1/manifest.json').palette.map(hex=>[1,3,5].map(i=>parseInt(hex.slice(i,i+2),16)))
const colorCache=new Map()
function quantize(b) {
 for(let i=0;i<b.length;i+=4){if(b[i+3]<160){b.fill(0,i,i+4);continue}const key=b[i]+','+b[i+1]+','+b[i+2];let color=colorCache.get(key);if(!color){let distance=Infinity;for(const c of palette){const d=(c[0]-b[i])**2+(c[1]-b[i+1])**2+(c[2]-b[i+2])**2;if(d<distance){distance=d;color=c}}colorCache.set(key,color)}b[i]=color[0];b[i+1]=color[1];b[i+2]=color[2];b[i+3]=255}
}
function clean(b,w,h) {
 const seen=new Uint8Array(w*h),parts=[]
 for(let p=0;p<w*h;p++)if(!seen[p]&&b[p*4+3]>=160){const q=[p];seen[p]=1;for(let n=0;n<q.length;n++){const v=q[n],x=v%w,y=Math.floor(v/w);for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,z=ny*w+nx;if(nx>=0&&nx<w&&ny>=0&&ny<h&&!seen[z]&&b[z*4+3]>=160){seen[z]=1;q.push(z)}}}parts.push(q)}
 parts.sort((a,b)=>b.length-a.length)
 const keep=new Uint8Array(w*h)
 for(const q of parts)if(q.length>=Math.max(8,(parts[0]?.length||0)*.015))for(const p of q)keep[p]=1
 let x0=w,y0=h,x1=-1,y1=-1
 for(let p=0;p<w*h;p++){if(!keep[p])b.fill(0,p*4,p*4+4);else{b[p*4+3]=255;x0=Math.min(x0,p%w);x1=Math.max(x1,p%w);y0=Math.min(y0,Math.floor(p/w));y1=Math.max(y1,Math.floor(p/w))}}
 return {b,w,h,x0,y0,x1,y1}
}
async function main(){
 const sources=JSON.parse(await fs.readFile(path.join(root,'sources.json'),'utf8'))
 const manifest={version:1,baseTile:32,perspective:'top-down three-quarter',lighting:'upper-left',palette:palette.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')),sheets:{},animations:{}}
 let total=0
 await fs.mkdir(path.join(root,'native'),{recursive:true})
 for(const[id,source]of Object.entries(sources)){
  const human=id==='rescuer',rows=human?humanRows:animalRows,fw=32,fh=human?48:32,baseline=human?44:28
  const {data,info}=await sharp(path.join(root,source)).ensureAlpha().raw().toBuffer({resolveWithObject:true})
  // Extract whole connected figures before placing them into exact cells.
  // Generated row spacing is not assumed to be pixel-exact.
  const seen=new Uint8Array(info.width*info.height), groups=new Map()
  for(let p=0;p<seen.length;p++)if(!seen[p]&&data[p*4+3]>=160){
    const q=[p];seen[p]=1;let sx=0,sy=0
    for(let n=0;n<q.length;n++){const v=q[n],x=v%info.width,y=Math.floor(v/info.width);sx+=x;sy+=y;for(const[dx,dy]of [[1,0],[-1,0],[0,1],[0,-1]]){const nx=x+dx,ny=y+dy,z=ny*info.width+nx;if(nx>=0&&nx<info.width&&ny>=0&&ny<info.height&&!seen[z]&&data[z*4+3]>=160){seen[z]=1;q.push(z)}}}
    if(q.length<100)continue
    const col=Math.min(5,Math.floor(sx/q.length/info.width*6)),row=Math.min(rows.length-1,Math.floor(sy/q.length/info.height*rows.length)),key=row+','+col
    if(!groups.has(key)||groups.get(key).length<q.length)groups.set(key,q)
  }
  const frames=[]
  for(let row=0;row<rows.length;row++)for(let col=0;col<rows[row][1];col++){
    const q=groups.get(row+','+col)
    if(!q)throw Error(`Missing art: ${id}/${rows[row][0]}/${col}`)
    let x0=info.width,y0=info.height,x1=0,y1=0
    for(const p of q){x0=Math.min(x0,p%info.width);x1=Math.max(x1,p%info.width);y0=Math.min(y0,Math.floor(p/info.width));y1=Math.max(y1,Math.floor(p/info.width))}
    const w=x1-x0+1,h=y1-y0+1,b=Buffer.alloc(w*h*4)
    for(const p of q){const i=((Math.floor(p/info.width)-y0)*w+p%info.width-x0)*4;data.copy(b,i,p*4,p*4+3);b[i+3]=255}
    frames.push({b,w,h,x0:0,y0:0,x1:w-1,y1:h-1,row,col,centerOffset:x0+w/2-(col+.5)*info.width/6})
  }
  // One uniform scale per identity: crouched and sleeping poses remain shorter.
  const maxWidth=Math.max(...frames.map(f=>f.x1-f.x0+1)), maxHeight=Math.max(...frames.map(f=>f.y1-f.y0+1))
  const scale=Math.min((fw-6)/maxWidth,(human?40:25)/maxHeight)
  const width=fw*6,height=fh*rows.length,atlas=Buffer.alloc(width*height*4)
  for(const f of frames){
   const sw=f.x1-f.x0+1,sh=f.y1-f.y0+1,dw=Math.max(1,Math.round(sw*scale)),dh=Math.max(1,Math.round(sh*scale))
   const resized=await sharp(f.b,{raw:{width:f.w,height:f.h,channels:4}}).extract({left:f.x0,top:f.y0,width:sw,height:sh}).resize(dw,dh,{kernel:'nearest'}).raw().toBuffer()
   quantize(resized)
   const canvas=Buffer.alloc(fw*fh*4)
   // Preserve the source cell center rather than recentering a moving tail.
   const ox=Math.max(2,Math.min(fw-dw-2,Math.round(fw/2+f.centerOffset*scale-dw/2))),oy=baseline-dh+1
   for(let ry=0;ry<dh;ry++)resized.copy(canvas,((oy+ry)*fw+ox)*4,ry*dw*4,(ry+1)*dw*4)
   const name=rows[f.row][0]
   await fs.mkdir(path.join(root,'frames',id,name),{recursive:true})
   await sharp(canvas,{raw:{width:fw,height:fh,channels:4}}).png({palette:true,colors:64,dither:0}).toFile(path.join(root,'frames',id,name,String(f.col).padStart(2,'0')+'.png'))
   for(let ry=0;ry<fh;ry++)canvas.copy(atlas,((f.row*fh+ry)*width+f.col*fw)*4,ry*fw*4,(ry+1)*fw*4)
   total++
  }
  await sharp(atlas,{raw:{width,height,channels:4}}).png({palette:true,colors:64,dither:0}).toFile(path.join(root,'native',id+'.png'))
  manifest.sheets[id]={file:'native/'+id+'.png',frameWidth:fw,frameHeight:fh,width,height,columns:6,rows:rows.length,spacing:0,margin:0,anchor:[16,baseline],scaleFromMaster:scale}
  for(let row=0;row<rows.length;row++){
   const[name,count,fps]=rows[row]
   manifest.animations[id+'/'+name]={sheet:id,row,fps,loop:true,frames:Array.from({length:count},(_,col)=>({x:col*fw,y:row*fh,width:fw,height:fh,file:`frames/${id}/${name}/${String(col).padStart(2,'0')}.png`}))}
  }
 }
 manifest.frameCount=total
 await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n')
 console.log(JSON.stringify({sheets:Object.keys(manifest.sheets).length,animations:Object.keys(manifest.animations).length,frames:total}))
}
main().catch(e=>{console.error(e);process.exitCode=1})
