async (page) => {
  await page.evaluate(async () => {
    const { HumanPortraitRenderer } = await import('/src/game/actor-rig/human-portrait.ts');
    const { defaultAppearance } = await import('/src/game/actor-rig/appearance.ts');
    const { gameAppearance } = await import('/src/game/actor-rig/game-appearances.ts');
    const { PORTRAIT_SIZE } = await import('/src/game/actor-rig/portrait-stage.ts');
    const maya = await HumanPortraitRenderer.create(gameAppearance('maya').appearance);
    const trail = await HumanPortraitRenderer.create(defaultAppearance());
    const reference = new Image();reference.src='/pawtrail-game/game-assets/dialogue-portraits/maya.png';await reference.decode();
    const poses = [
      ['Maya · original 2D reference', null,0,'idle',0], ['Maya · painted 3D', maya,-.42,'idle',0],
      ['Maya · front', maya,0,'idle',0], ['Maya · side', maya,-Math.PI/2,'idle',0], ['Maya · happy', maya,-.2,'happy',8],
      ['Trail · painted 3D',trail,-.42,'idle',0], ['Trail · front',trail,0,'idle',0], ['Trail · side',trail,-Math.PI/2,'idle',0],
      ['Trail · smile',trail,0,'smile',0], ['Trail · talking',trail,0,'talking',1]
    ];
    const canvas=document.createElement('canvas');canvas.id='portrait-art';canvas.width=1040;canvas.height=464;
    const p=canvas.getContext('2d');p.fillStyle='#fff3df';p.fillRect(0,0,canvas.width,canvas.height);p.imageSmoothingEnabled=false;
    const cell=document.createElement('canvas');cell.width=cell.height=PORTRAIT_SIZE;const c=cell.getContext('2d');
    for(let i=0;i<poses.length;i++){
      const [label,renderer,yaw,expression,frame]=poses[i],x=(i%5)*208+8,y=Math.floor(i/5)*232+8;
      p.fillStyle='#dbe4c9';p.fillRect(x,y,192,192);
      if(renderer){c.putImageData(renderer.frame(frame,{yaw,expression}),0,0);p.drawImage(cell,x,y)}else p.drawImage(reference,x,y,192,192);
      p.fillStyle='#45291e';p.font='13px sans-serif';p.fillText(label,x+2,y+215);
    }
    maya.dispose();trail.dispose();document.body.replaceChildren(canvas);document.body.style.margin='0';
  });
  await page.locator('#portrait-art').screenshot({path:'/home/micxsz/Documents/ChatGPT/pawtrail/assets/actor-appearances/reviews/maya-painted-bust-v4.png'});
  return {artwork:'maya-painted-bust-v4.png',renderedViews:9,styleReferences:1};
}
