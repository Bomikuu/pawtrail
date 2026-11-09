async(page)=>await page.evaluate(async()=>{
 const {HumanPortraitRenderer}=await import('/src/game/actor-rig/human-portrait.ts');
 const {gameAppearance}=await import('/src/game/actor-rig/game-appearances.ts');
 const {initialCalibration,reference,pointAtUV}=await import('/src/game/actor-rig/maya/reference.ts');
 const {comparePortrait}=await import('/src/game/actor-rig/maya/metrics.ts');
 const {createMayaStarterGLB}=await import('/src/game/actor-rig/maya/authoring.ts');
 const appearance=gameAppearance('maya').appearance,renderer=await HumanPortraitRenderer.create(appearance,1,initialCalibration);
 const img=new Image();img.src=reference.referenceUrl;await img.decode();
 const canvas=document.createElement('canvas');canvas.width=canvas.height=192;const p=canvas.getContext('2d');p.imageSmoothingEnabled=false;p.drawImage(img,0,0,192,192);
 const original=p.getImageData(0,0,192,192),neutral=renderer.frame(0,{yaw:initialCalibration.yaw,expression:'idle',steady:true}),metrics=comparePortrait(original,neutral,renderer.getLandmarks());
 const png=data=>{p.putImageData(data,0,0);return canvas.toDataURL('image/png').split(',')[1]};
 const frames=[{name:'baseline-reference',png:png(neutral)},{name:'baseline-difference',png:png(metrics.difference)},{name:'baseline-silhouette',png:png(metrics.silhouette)}];
 const board=document.createElement('canvas');board.width=192*7;board.height=216;const b=board.getContext('2d');b.imageSmoothingEnabled=false;b.fillStyle='#fff3df';b.fillRect(0,0,board.width,board.height);
 const views=[['Reference',initialCalibration.yaw],['Front',0],['Left 3/4',-Math.PI/4],['Left',-Math.PI/2],['Right 3/4',Math.PI/4],['Right',Math.PI/2],['Back',Math.PI]];
 for(let i=0;i<views.length;i++){const [name,yaw]=views[i];p.putImageData(renderer.frame(0,{yaw,expression:'idle',steady:true}),0,0);b.drawImage(canvas,i*192,0);b.fillStyle='#45291e';b.font='13px sans-serif';b.fillText(name,i*192+4,208)}
 frames.push({name:'baseline-seven-views',png:board.toDataURL('image/png').split(',')[1]});
 for(let i=0;i<96;i++){frames.push({name:'turntable/'+String(i).padStart(3,'0'),png:png(renderer.frame(0,{yaw:initialCalibration.yaw+i/96*Math.PI*2,expression:'idle',steady:true}))});if(i%12===0)await new Promise(requestAnimationFrame)}
 const expressions=document.createElement('canvas');expressions.width=192*5;expressions.height=216;const e=expressions.getContext('2d');e.imageSmoothingEnabled=false;
 const moods=[['Neutral','idle',0],['Blink','idle',33],['Smile','smile',0],['Happy','happy',8],['Talking','talking',1]];
 for(let i=0;i<moods.length;i++){e.fillStyle='#fff3df';e.fillRect(i*192,0,192,216);p.putImageData(renderer.frame(moods[i][2],{yaw:initialCalibration.yaw,expression:moods[i][1],steady:true}),0,0);e.drawImage(canvas,i*192,0);e.fillStyle='#45291e';e.font='13px sans-serif';e.fillText(moods[i][0],i*192+4,208)}
 frames.push({name:'baseline-expressions',png:expressions.toDataURL('image/png').split(',')[1]});
 const variant=structuredClone(appearance);Object.assign(variant.colors,{hair:'#914a34',hairLight:'#c9794e',hairShade:'#542a24',hairSheen:'#e7ad6f',jacket:'#477e79',jacketDark:'#285650',jacketLight:'#78a59b'});
 const vr=await HumanPortraitRenderer.create(variant,1,initialCalibration);frames.push({name:'baseline-color-variation',png:png(vr.frame(0,{yaw:initialCalibration.yaw,expression:'idle',steady:true}))});vr.dispose();
 const buffer=await createMayaStarterGLB(),blob=new Blob([buffer]);const model=await new Promise((resolve,reject)=>{const reader=new FileReader();reader.onload=()=>resolve(String(reader.result).split(',')[1]);reader.onerror=reject;reader.readAsDataURL(blob)});
 const {difference,silhouette,...numbers}=metrics;
 const response=await fetch('/__maya_export',{method:'POST',headers:{'Content-Type':'application/json'},body:JSON.stringify({frames,model,report:{candidate:'procedural baseline — NOT approved Maya',calibration:initialCalibration,metrics:numbers,note:'Landmarks are projected actual UV/mesh anchors, not image-feature detections. Missing features are unavailable. No authored Maya asset is installed.'}})});
 if(!response.ok)throw new Error(await response.text());renderer.dispose();return response.json();
})
