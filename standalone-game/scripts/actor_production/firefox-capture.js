async page => {
  const {actor,case:unit,target}=/*PRODUCTION_PARAMS*/;
  page.setDefaultTimeout(4500);
  const shot=(name,locator=page)=>locator.screenshot({path:target+'/'+name+'.png',timeout:6000});
  const select=async(label,text,scope=page)=>{
    await scope.getByRole('combobox',{name:label,exact:true}).click();
    await page.getByRole('option',{name:text,exact:true}).press('Enter');
    await page.getByRole('listbox').waitFor({state:'hidden',timeout:1500}).catch(()=>{throw Error('Selection stayed open: '+label+'. Inspect a fresh snapshot; do not continue the batch.');});
    if((await scope.getByRole('combobox',{name:label,exact:true}).innerText()).trim()!==text)throw Error('Selection was not applied: '+label);
  };
  const current=new URL(page.url()),wanted=new URL(actor.previewUrl);
  if(current.origin!==wanted.origin||current.pathname!==wanted.pathname||current.searchParams.get('skin')!==wanted.searchParams.get('skin')||current.searchParams.get('preview')!=='actors')await page.goto(actor.previewUrl);
  await page.getByRole('combobox',{name:'Action',exact:true}).waitFor({timeout:15000});
  await page.waitForFunction(async()=>{const {actorComparison}=await import('/src/game/runtime/actor-comparison-state.ts');const s=actorComparison.getSnapshot();if(s.status==='error')throw Error(s.error);return s.status==='ready';},{},{timeout:15000});
  if(await page.getByRole('dialog').count())throw Error('Unexpected open dialog. Inspect and close it explicitly, then resume.');
  // Read current labels; make all presentation changes through the real controls.
  const labels=await page.evaluate(async()=>{const m=await import('/src/game/runtime/actor-comparison-state.ts');return {actions:Object.fromEntries(m.previewActions.map(x=>[x.value,x.label])),headings:Object.fromEntries(m.comparisonDirections.map(x=>[x.value,x.label]))};});
  const field=page.getByRole('region',{name:'Approved rig and new appearance preview',exact:true});
  const chooseAction=async value=>{if(!labels.actions[value])throw Error('Unsupported action: '+value);await select('Action',labels.actions[value]);};
  if(unit.kind==='action'||unit.kind==='heading'){
    await page.getByRole('tab',{name:'Portrait',exact:true}).click();
    await chooseAction(unit.kind==='heading'?'walk':unit.action);
    await select('Model angle',labels.headings[unit.direction??'down_left']);
    const state=await page.evaluate(async()=> (await import('/src/game/runtime/actor-comparison-state.ts')).actorComparison.getSnapshot());
    if(state.paused)await page.getByRole('button',{name:'Play',exact:true}).click();
    await page.getByRole('button',{name:'Reset',exact:true}).click();
    // Capture the whole live field: dash/movement can invalidate fixed crops.
    for(const [i,wait]of [Math.max(120,(unit.durationMs??1200)*.2),Math.max(200,(unit.durationMs??1200)*.45)].entries()){
      await page.waitForTimeout(wait);await shot('body-'+i,field);await shot('paired-portrait-'+i,page.getByRole('tabpanel',{name:'Portrait',exact:true}));
    }
    await chooseAction('idle');await page.waitForTimeout(300);await shot('return',field);
  }else if(unit.kind==='portrait'){
    await page.getByRole('tab',{name:'Portrait',exact:true}).click();
    await page.getByRole('button',{name:/^Open .+ portrait preview$/}).click();
    const dialog=page.getByRole('dialog');
    await dialog.getByRole('img',{name:/animated 2D portrait/}).waitFor({timeout:12000});
    const angle=await page.evaluate(async({collection,pose})=>{const m=await import('/src/game/actor-rig/photo-portrait-catalog.ts');const style=m.PHOTO_PORTRAIT_STYLES.find(s=>s.id===collection);if(!style)throw Error('Portrait collection is not installed');const entry=m.photoPortraitPoses(style).find(s=>s.id===pose);if(!entry)throw Error('Missing authored portrait angle');return entry.label;},{collection:actor.portrait.collection,pose:unit.pose});
    await select('Portrait angle',angle,dialog);
    await dialog.getByRole('button',{name:unit.emotion==='idle'?'Neutral':unit.emotion,exact:true}).click();
    await page.waitForTimeout(300);await shot('rest',dialog);
    await dialog.getByRole('button',{name:'Speaking preview',exact:true}).click();
    for(const [i,wait]of [500,600,1800].entries()){await page.waitForTimeout(wait);await shot('speech-blink-breath-'+i,dialog);}
    await dialog.getByRole('button',{name:'Close',exact:true}).click();
  }else if(unit.kind==='illustration'){
    await page.getByRole('tab',{name:'Illustration',exact:true}).click();
    const region=page.getByRole('region',{name:actor.illustrationName+' animated illustration',exact:true});
    await region.getByRole('button',{name:unit.variant==='enraged'?'Enraged':'Normal',exact:true}).click();
    await region.locator('canvas[aria-hidden="false"]').waitFor({timeout:12000});
    await region.scrollIntoViewIfNeeded();
    for(const name of ['Background','Aura']){const toggle=region.getByRole('switch',{name,exact:true});if(await toggle.isChecked())await toggle.click();}
    const play=region.getByRole('button',{name:'Play',exact:true});if(await play.count())await play.click();
    await region.getByRole('button',{name:'Restart',exact:true}).click();
    for(let i=0;i<10;i++){await page.waitForTimeout(unit.cycleMs*.23);await shot('actor-loop-'+i,region);}
    for(const name of ['Background','Aura']){const toggle=region.getByRole('switch',{name,exact:true});if(!await toggle.isChecked())await toggle.click();}
    await shot('layers-restored',region);
  }else if(unit.kind==='icon'){
    await shot('native-frame',page.getByRole('group',{name:'Refined actor previews',exact:true}));
    const icon=page.getByRole('group',{name:'Refined actor previews'}).getByRole('button',{name:actor.name,exact:true});
    await shot('active-icon',icon);
  }else if(unit.kind==='dialogue'){
    await page.getByRole('tab',{name:'Portrait',exact:true}).click();
    await page.getByRole('button',{name:'Dialogue',exact:true}).click();
    await page.waitForTimeout(900);await shot('dialogue-speaking');
    await page.waitForTimeout(1200);await shot('dialogue-transition');
    await page.getByRole('dialog').getByRole('button',{name:/^Close/}).first().click();
    // The remaining pages/choices are deliberately a human observation gate.
  }else if(unit.kind==='mobile'){
    await page.setViewportSize({width:390,height:844});
    try{await page.getByRole('tab',{name:'Portrait',exact:true}).click();await shot('portrait');await shot('model',field);}
    finally{await page.setViewportSize({width:1280,height:720});}
  }else throw Error('No capture adapter for '+unit.kind);
  return {case:unit.id,state:'captured — needs visual review',instructions:unit.instructions};
}
