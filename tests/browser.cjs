const {chromium}=require('playwright-core');
const assert=require('node:assert/strict');
(async()=>{
 const url=process.argv[2],stage=Number(process.argv[3]||4);
 const browser=await chromium.launch({headless:true,args:['--no-sandbox']});
 try{
 for(const width of [390,1280]){
  const ctx=await browser.newContext({viewport:{width,height:width===390?844:900},reducedMotion:'reduce'});
  const page=await ctx.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
  assert.equal((await page.goto(url,{waitUntil:'networkidle'})).status(),200);
  await page.waitForFunction(()=>!!window.threadToy);
  const state=()=>page.evaluate(()=>window.threadToy.getState());
  assert.equal((await state()).remaining,192);
  const original=(await state()).colors;
  assert.equal(await page.locator('h1').innerText(),'One Long Thread');
  await page.locator('#pull-one').click();assert.equal((await state()).remaining,191);
  await page.locator('#pull-row').click();assert.equal((await state()).remaining,179);
  await page.locator('#knit-one').click();assert.equal((await state()).remaining,180);
  await page.locator('#knit-back').click();assert.equal((await state()).remaining,192);
  assert.deepEqual((await state()).colors,original);
  await page.locator('#pull-handle').focus();await page.keyboard.press('ArrowRight');assert.equal((await state()).remaining,191);
  await page.keyboard.press('ArrowLeft');assert.equal((await state()).remaining,192);
  // Actual pointer motion; neither click nor pointerdown should consume yarn.
  await page.locator('#pull-handle').scrollIntoViewIfNeeded();
  const box=await page.locator('#pull-handle').boundingBox();assert(box&&box.width>=45&&box.height>=45);
  const x=box.x+box.width/2,y=box.y+box.height/2;
  await page.mouse.move(x,y);await page.mouse.down();assert.equal((await state()).remaining,192);
  await page.mouse.move(x+42,y,{steps:3});await page.mouse.up();assert.equal((await state()).remaining,189);
  await page.locator('#knit-back').click();
  for(let i=0;i<16;i++)await page.locator('#pull-row').click();
  assert.equal((await state()).remaining,0);assert.match(await page.locator('#status').innerText(),/0 stitches in cloth.*192 in thread/);
  assert.equal(await page.locator('#end-note').innerText(),'Nothing lost. Just no longer a moth.');
  assert.equal(await page.locator('#stage').getAttribute('data-remaining'),'0');
  await page.locator('#knit-back').click();assert.deepEqual((await state()).colors,original);
  if(stage>=3){
   await page.locator('#design > summary').click();
   await page.locator('#pattern').selectOption('stairs');assert.equal((await state()).pattern,'stairs');
   await page.locator('[data-color="1"]').click();await page.locator('[data-index="191"]').click();
   assert.equal((await state()).colors[191],1);assert.equal((await state()).pattern,'custom');
   const dyed=(await state()).colors;
   await page.locator('#pull-row').click();assert.equal((await state()).remaining,180);
   assert.equal(await page.locator('[data-index="191"]').isDisabled(),true);
   await page.locator('#knit-back').click();assert.deepEqual((await state()).colors,dyed);
   await page.locator('#pattern').selectOption('comet');assert.equal((await state()).pattern,'comet');
   assert.equal((await state()).remaining,192);
  }
  if(stage>=4){
   assert(await page.evaluate(()=>document.documentElement.scrollWidth<=innerWidth));
   assert.equal(await page.locator('#motion').isChecked(),false);
   await page.locator('#about > summary').click();
   assert.match(await page.locator('#about').innerText(),/not a simulation of yarn tension/);
   assert.equal(await page.locator('#about a').getAttribute('href'),'https://en.wikipedia.org/wiki/Knitting');
   for(const id of ['pull-one','pull-row','knit-one','knit-back','stop']){
    await page.locator('#'+id).scrollIntoViewIfNeeded();const b=await page.locator('#'+id).boundingBox();assert(b&&b.width>=45&&b.height>=45,id);
   }
   await page.locator('#motion').check();
   for(let i=0;i<8;i++)await page.locator('#pull-row').click();
   await page.locator('#knit-back').click();await page.waitForTimeout(150);await page.locator('#stop').click();
   const stopped=(await state()).remaining;await page.waitForTimeout(400);assert.equal((await state()).remaining,stopped);assert(stopped<192);
   await page.locator('#knit-back').click();await page.locator('#pull-one').click();
   const interrupted=(await state()).remaining;await page.waitForTimeout(400);assert.equal((await state()).remaining,interrupted);
   await page.locator('#knit-back').click();
   await page.evaluate(()=>{Object.defineProperty(document,'hidden',{configurable:true,value:true});document.dispatchEvent(new Event('visibilitychange'));});
   const hiddenStop=(await state()).remaining;await page.waitForTimeout(400);assert.equal((await state()).remaining,hiddenStop);
   await page.evaluate(()=>{delete document.hidden;document.dispatchEvent(new Event('visibilitychange'));});
   await page.waitForTimeout(250);assert.equal((await state()).remaining,hiddenStop);
   await page.locator('#motion').uncheck();await page.locator('#knit-back').click();assert.equal((await state()).remaining,192);
  }
  assert.deepEqual(errors,[]);
  if(stage>=4){await page.locator('#design > summary').evaluate(el=>el.parentElement.open=false);await page.locator('#about > summary').evaluate(el=>el.parentElement.open=false);await page.screenshot({path:`/work/artifacts/${width}.png`,fullPage:true});}
  await ctx.close();
 }
 console.log(`thread browser stage ${stage} pass`);
 }finally{await browser.close();}
})().catch(e=>{console.error(e);process.exit(1)});
