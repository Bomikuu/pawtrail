const fs = require('node:fs/promises')
const path = require('node:path')
let sharp
try { sharp = require('sharp') } catch { sharp = require('/home/micxsz/projects/pawtrail/.worktrees/implementation/node_modules/sharp') }
const root = path.resolve(__dirname, '..')
const all = []
async function load(name) {
  return sharp(path.join(root, 'sheets', name + '-v1.png')).ensureAlpha().raw().toBuffer({ resolveWithObject: true })
}
async function objectCrop(sheet,col,row,cols,rows,size) {
  const {width:w,height:h}=sheet.info, src=sheet.data
  if(!sheet.groups) {
    const seen=new Uint8Array(w*h), groups=Array.from({length:cols*rows},()=>[])
    const ys=cols===6?[145,385,585,785,990,1185]:cols===8?[95,260,425,585,740,910,1060,1200]:Array.from({length:rows},(_,i)=>(i+.5)*h/rows)
    for(let p=0;p<w*h;p++)if(!seen[p]&&src[p*4+3]>=160) {
      const q=[p];seen[p]=1;let sx=0,sy=0
      for(let n=0;n<q.length;n++) {
        const v=q[n],x=v%w,y=Math.floor(v/w);sx+=x;sy+=y
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {const nx=x+dx,ny=y+dy,z=ny*w+nx;if(nx>=0&&nx<w&&ny>=0&&ny<h&&!seen[z]&&src[z*4+3]>=160){seen[z]=1;q.push(z)}}
      }
      if(q.length<12)continue
      const cx=Math.min(cols-1,Math.floor(sx/q.length/w*cols)),cy=ys.reduce((best,y,i)=>Math.abs(y-sy/q.length)<Math.abs(ys[best]-sy/q.length)?i:best,0)
      groups[cy*cols+cx].push(q)
    }
    sheet.groups=groups
  }
  const group=sheet.groups[row*cols+col].sort((a,b)=>b.length-a.length)
  const parts=group.filter(q=>q.length>=Math.max(12,(group[0]?.length||0)*.02))
  let x0=w,y0=h,x1=0,y1=0
  for(const q of parts)for(const p of q){const x=p%w,y=Math.floor(p/w);x0=Math.min(x0,x);y0=Math.min(y0,y);x1=Math.max(x1,x);y1=Math.max(y1,y)}
  if(x0===w)return Buffer.alloc(size*size*4)
  const cw=x1-x0+1,ch=y1-y0+1,b=Buffer.alloc(cw*ch*4)
  for(const q of parts)for(const p of q){const i=((Math.floor(p/w)-y0)*cw+p%w-x0)*4;src.copy(b,i,p*4,p*4+3);b[i+3]=255}
  const envSizes=[40,56,56,48,36,40,24,24,24,24,24,28,56,48,48,56,56,32,32,28,28,20,20,28,32,36,48,56,48,56,56,56,48,32,40,36]
  const limit=cols===6?envSizes[row*cols+col]:size-8
  const resized=await sharp(b,{raw:{width:cw,height:ch,channels:4}}).resize({width:limit,height:limit,fit:'inside',kernel:'nearest'}).raw().toBuffer({resolveWithObject:true})
  const out=Buffer.alloc(size*size*4),ox=Math.floor((size-resized.info.width)/2),oy=size-4-resized.info.height
  for(let y=0;y<resized.info.height;y++)resized.data.copy(out,((y+oy)*size+ox)*4,y*resized.info.width*4,(y+1)*resized.info.width*4)
  return out
}
async function crop(sheet, col, row, cols, rows, size, trim = false) {
  if(trim) return objectCrop(sheet,col,row,cols,rows,size)
  const { width: w, height: h } = sheet.info
  const x = Math.round(col*w/cols), y = Math.round(row*h/rows)
  const right = Math.round((col+1)*w/cols), bottom = Math.round((row+1)*h/rows)
  let buf = await sharp(sheet.data,{raw:{width:w,height:h,channels:4}}).extract({left:x,top:y,width:right-x,height:bottom-y}).raw().toBuffer()
  let cw=right-x,ch=bottom-y
  for(let i=0;i<buf.length;i+=4) {
    buf[i+3]=buf[i+3]>=160?255:0
    if(!buf[i+3]) buf.fill(0,i,i+4)
  }
  if(trim) {
    // Keep the main connected sprite; exclude isolated alpha-removal noise.
    const seen=new Uint8Array(cw*ch), groups=[]
    for(let p=0;p<cw*ch;p++) if(!seen[p] && buf[p*4+3]) {
      const q=[p];seen[p]=1
      for(let n=0;n<q.length;n++) {
        const v=q[n], xx=v%cw, yy=Math.floor(v/cw)
        for(const [dx,dy] of [[1,0],[-1,0],[0,1],[0,-1]]) {
          const nx=xx+dx,ny=yy+dy,z=ny*cw+nx
          if(nx>=0&&nx<cw&&ny>=0&&ny<ch&&!seen[z]&&buf[z*4+3]) {seen[z]=1;q.push(z)}
        }
      }
      groups.push(q)
    }
    groups.sort((a,b)=>b.length-a.length)
    const keep=new Uint8Array(cw*ch)
    for(const group of groups) if(group.length >= Math.max(10,(groups[0]?.length||0)*0.012)) for(const p of group) keep[p]=1
    let minx=cw,miny=ch,maxx=0,maxy=0
    for(let p=0;p<cw*ch;p++) {
      if(!keep[p]) buf.fill(0,p*4,p*4+4)
      else {const xx=p%cw,yy=Math.floor(p/cw);minx=Math.min(minx,xx);maxx=Math.max(maxx,xx);miny=Math.min(miny,yy);maxy=Math.max(maxy,yy)}
    }
    if(minx<cw) {
      buf=await sharp(buf,{raw:{width:cw,height:ch,channels:4}}).extract({left:minx,top:miny,width:maxx-minx+1,height:maxy-miny+1}).resize({width:size-8,height:size-8,fit:'inside',kernel:'nearest'}).raw().toBuffer({resolveWithObject:true})
      const out=Buffer.alloc(size*size*4), ox=Math.floor((size-buf.info.width)/2),oy=size-4-buf.info.height
      for(let yy=0;yy<buf.info.height;yy++) buf.data.copy(out,((yy+oy)*size+ox)*4,yy*buf.info.width*4,(yy+1)*buf.info.width*4)
      return out
    }
  }
  return sharp(buf,{raw:{width:cw,height:ch,channels:4}}).resize(size,size,{kernel:'nearest'}).raw().toBuffer()
}
function add(category,id,data,size,extra={}) { const entry={category,id,data,size,...extra};all.push(entry);return entry }
function periodic(data,size=32) {
  const b=Buffer.from(data)
  for(let x=0;x<size;x++) b.copy(b,((size-1)*size+x)*4,x*4,x*4+4)
  for(let y=0;y<size;y++) b.copy(b,(y*size+size-1)*4,y*size*4,y*size*4+4)
  return b
}
function mix(a,b,predicate) {
  const out=Buffer.alloc(32*32*4)
  for(let y=0;y<32;y++)for(let x=0;x<32;x++) {
    const i=(y*32+x)*4, src=predicate(x,y)?b:a
    src.copy(out,i,i,i+4)
  }
  return out
}
function pathMask(x,y,mask,lo=8,hi=23) {
  return (x>=lo&&x<=hi&&y>=lo&&y<=hi)||((mask&1)&&x>=lo&&x<=hi&&y<=hi)||((mask&2)&&y>=lo&&y<=hi&&x>=lo)||((mask&4)&&x>=lo&&x<=hi&&y>=lo)||((mask&8)&&y>=lo&&y<=hi&&x<=hi)
}
async function main() {
  const terrain=await load('terrain'), textures={}
  const bases=[...Array.from({length:8},(_,i)=>['grass_'+i,i,0]),['dirt',0,1],...['stone','brick','concrete','asphalt','sand','gravel','flowers_pink','flowers_yellow'].map((n,i)=>[n,i,3]),['water',3,5]]
  // Remove generated separator lines before deriving native textures.
  for(const [name,col,row] of bases) {
    const w=terrain.info.width,h=terrain.info.height
    const left=Math.round(col*w/8)+3,top=Math.round(row*h/8)+3
    const width=Math.round((col+1)*w/8)-left-3,height=Math.round((row+1)*h/8)-top-3
    const data=await sharp(terrain.data,{raw:{width:w,height:h,channels:4}}).extract({left,top,width,height}).resize(32,32,{kernel:'nearest'}).raw().toBuffer()
    textures[name]=periodic(data)
  }
  const grass=textures.grass_0
  for(let n=1;n<8;n++)for(let y=0;y<32;y++)for(let x=0;x<32;x++)if(x<2||y<2||x>29||y>29){let i=(y*32+x)*4;grass.copy(textures['grass_'+n],i,i,i+4)}
  for(const [id,data] of Object.entries(textures)) add('terrain',id,data,32,{kind:'texture'})
  for(const material of ['dirt','stone','brick','gravel']) for(let mask=0;mask<16;mask++) add('terrain',material+'_path_'+mask,mix(grass,textures[material],(x,y)=>pathMask(x,y,mask)),32,{kind:'path',connections:mask})
  for(let mask=0;mask<16;mask++)add('terrain','water_shore_'+mask,mix(grass,textures.water,(x,y)=>((mask&1)||y>=6)&&((mask&2)||x<26)&&((mask&4)||y<26)&&((mask&8)||x>=6)),32,{kind:'shore',connections:mask})
  for(const [id,test] of [['nw',(x,y)=>x<6&&y<6],['ne',(x,y)=>x>=26&&y<6],['sw',(x,y)=>x<6&&y>=26],['se',(x,y)=>x>=26&&y>=26]])add('terrain','water_inner_'+id,mix(textures.water,grass,test),32,{kind:'shore-inner'})
  for(let mask=0;mask<16;mask++) {
    const sidewalk=mix(grass,textures.concrete,(x,y)=>pathMask(x,y,mask,0,31))
    add('terrain','road_'+mask,mix(sidewalk,textures.asphalt,(x,y)=>pathMask(x,y,mask,4,27)),32,{kind:'road',connections:mask})
  }
  for(let row=0;row<3;row++)for(let col=0;col<3;col++)add('terrain',`grass_dirt_transition_${col}_${row}`,mix(grass,textures.dirt,(x,y)=>(col!==0||x>=6)&&(col!==2||x<26)&&(row!==0||y>=6)&&(row!==2||y<26)),32,{kind:'transition'})
  const buildingNames=['cozy_house','mint_house','coral_house','rescue_shelter','veterinary_clinic','pet_supply_shop','sari_sari_store','bamboo_house','resting_pavilion']
  const buildings=await load('buildings')
  for(let i=0;i<9;i++)add('buildings',buildingNames[i],await crop(buildings,i%3,Math.floor(i/3),3,3,128,true),128,{anchor:[64,124],entrance:[i===6?96:i===7?82:64,120]})
  const envNames=['small_tree','large_tree','palm','flowering_tree','round_bush','leafy_shrub','pink_flowers','yellow_flowers','white_flowers','terracotta_pot','blue_pot','garden_pot','fence_straight','fence_corner','fence_gate','wooden_bench','street_lamp','rocks','wooden_sign','trash_bin','mailbox','water_bowl','food_bowl','cardboard_box','round_bed','rectangular_bed','dog_house','cat_feeding_station','dog_kennel','fabric_shade','low_shelter','bamboo_canopy','round_door_house','stepping_stones','fence_end','sleeping_box']
  const environment=await load('environment')
  for(let i=0;i<36;i++)add('environment',envNames[i],await crop(environment,i%6,Math.floor(i/6),6,6,64,true),64,{anchor:[32,60]})
  const animalNames=['orange_tabby','black_cat','white_cat','calico','gray_cat','siamese','aspin','brown_puppy','white_puppy','black_dog','spotted_dog']
  const animals=await load('animals')
  for(let row=0;row<11;row++)for(let col=0;col<8;col++)add('animals',animalNames[row]+'_'+['south','west','east','north'][Math.floor(col/2)]+'_'+col%2,await crop(animals,col,row,8,12,32),32,{animal:animalNames[row],direction:['south','west','east','north'][Math.floor(col/2)],frame:col%2,anchor:[16,28]})
  const itemNames=['cat_food_bag','cat_food_bag_open','dog_food_bag','dog_food_bag_open','cat_food_tin','cat_food_tin_open','dog_food_tin','dog_food_tin_open','fish_treat','fish_treat_pair','fish_pouch','fish_pouch_open','cat_food_portion','dog_food_portion','kibble_scoop','kibble_scoop_full','water_bottle_full','water_bottle_half','water_bottle_empty','water_bottles','feeding_bowl','feeding_bowl_full','water_bowl','water_bowl_full','first_aid_kit','first_aid_kit_open','bandage','first_aid_cloth','carrier_front','carrier_side','carrier_open','carrier_soft','red_ball','blue_ball','rope_toy','mouse_toy','chew_toy','feather_toy','ring_toy','fish_toy','rescue_blanket','rescue_gloves','rescue_towel','rescue_bag','rescue_crate','carrying_sling','rescue_mat','supply_box',...Array.from({length:8},(_,i)=>'kibble_coin_'+i),...Array.from({length:8},(_,i)=>'paw_indicator_'+i)]
  const items=await load('items')
  for(let i=0;i<64;i++)add('items',itemNames[i],await crop(items,i%8,Math.floor(i/8),8,8,32,true),32,{anchor:[16,28]})
  for(const building of all.filter(a=>a.category==='buildings'))for(let ty=0;ty<4;ty++)for(let tx=0;tx<4;tx++) {
    const data=Buffer.alloc(32*32*4)
    for(let y=0;y<32;y++)building.data.copy(data,y*32*4,((ty*32+y)*128+tx*32)*4,((ty*32+y)*128+tx*32+32)*4)
    if(data.some((v,i)=>i%4===3&&v))add('building_tiles',`${building.id}_${tx}_${ty}`,data,32,{building:building.id,offset:[tx*32,ty*32],kind:'building-chunk'})
  }
  // Build one shared palette from all generated art, then map every pixel without dithering.
  const hist=new Map()
  for(const a of all)for(let i=0;i<a.data.length;i+=4)if(a.data[i+3]>=128){const key=a.data[i]+','+a.data[i+1]+','+a.data[i+2];const prior=hist.get(key);if(prior)prior.n++;else hist.set(key,{c:[a.data[i],a.data[i+1],a.data[i+2]],n:1})}
  const boxes=[Array.from(hist.values())]
  const extent=b=>[0,1,2].map(k=>{let lo=255,hi=0;for(const p of b){lo=Math.min(lo,p.c[k]);hi=Math.max(hi,p.c[k])}return hi-lo})
  while(boxes.length<63){let bi=-1,score=-1;for(let i=0;i<boxes.length;i++){if(boxes[i].length<2)continue;const e=extent(boxes[i]),s=Math.max(...e)*Math.sqrt(boxes[i].reduce((n,p)=>n+p.n,0));if(s>score){score=s;bi=i}}if(bi<0)break;const box=boxes.splice(bi,1)[0],e=extent(box),k=e.indexOf(Math.max(...e));box.sort((a,b)=>a.c[k]-b.c[k]);const total=box.reduce((n,p)=>n+p.n,0);let n=0,cut=1;for(let i=0;i<box.length-1;i++){n+=box[i].n;if(n>=total/2){cut=i+1;break}}boxes.push(box.slice(0,cut),box.slice(cut))}
  const palette=boxes.map(box=>{const n=box.reduce((n,p)=>n+p.n,0);return [0,1,2].map(k=>Math.round(box.reduce((s,p)=>s+p.c[k]*p.n,0)/n))})
  const cache=new Map()
  for(const a of all)for(let i=0;i<a.data.length;i+=4){if(a.data[i+3]<128){a.data.fill(0,i,i+4);continue}const key=a.data[i]+','+a.data[i+1]+','+a.data[i+2];let color=cache.get(key);if(!color){let best=Infinity;for(const c of palette){const d=(c[0]-a.data[i])**2+(c[1]-a.data[i+1])**2+(c[2]-a.data[i+2])**2;if(d<best){best=d;color=c}}cache.set(key,color)}a.data[i]=color[0];a.data[i+1]=color[1];a.data[i+2]=color[2];a.data[i+3]=255}
  const manifest={version:1,baseTile:32,lighting:'upper-left',perspective:'top-down three-quarter',palette:palette.map(c=>'#'+c.map(v=>v.toString(16).padStart(2,'0')).join('')),connectionBits:{north:1,east:2,south:4,west:8},animation:{animals:{fps:5,framesPerDirection:2},kibble_coin:{fps:8,frames:8},paw_indicator:{fps:6,frames:8}},sheets:{},sprites:{}}
  await fs.mkdir(path.join(root,'native'),{recursive:true})
  for(const category of ['terrain','buildings','environment','animals','items','building_tiles']){
    const entries=all.filter(a=>a.category===category),size=entries[0].size,cols={terrain:16,buildings:3,environment:6,animals:8,items:8,building_tiles:16}[category],gutter=['terrain','building_tiles'].includes(category)?0:2,margin=gutter,stride=size+gutter,rows=Math.ceil(entries.length/cols),width=cols*stride+margin,height=rows*stride+margin
    const atlas=Buffer.alloc(width*height*4)
    await fs.mkdir(path.join(root,'native',category),{recursive:true})
    for(let n=0;n<entries.length;n++){
      const a=entries[n],x=margin+n%cols*stride,y=margin+Math.floor(n/cols)*stride
      for(let ry=0;ry<size;ry++)a.data.copy(atlas,((y+ry)*width+x)*4,ry*size*4,(ry+1)*size*4)
      await sharp(a.data,{raw:{width:size,height:size,channels:4}}).png({palette:true,colours:64,dither:0}).toFile(path.join(root,'native',category,a.id+'.png'))
      const {data,category:cat,size:sz,...meta}=a
      manifest.sprites[cat+'/'+a.id]={...meta,sheet:cat,x,y,width:size,height:size,file:`native/${cat}/${a.id}.png`}
    }
    await sharp(atlas,{raw:{width,height,channels:4}}).png({palette:true,colours:64,dither:0}).toFile(path.join(root,'native',category+'.png'))
    manifest.sheets[category]={file:'native/'+category+'.png',width,height,cellSize:size,columns:cols,rows,margin,spacing:gutter,count:entries.length}
  }
  await fs.writeFile(path.join(root,'manifest.json'),JSON.stringify(manifest,null,2)+'\n')
  console.log(JSON.stringify({sprites:all.length,palette:palette.length,sheets:manifest.sheets},null,2))
}
main().catch(e=>{console.error(e);process.exitCode=1})
