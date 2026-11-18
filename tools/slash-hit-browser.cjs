// 真實開局／攻擊選單＋受控同步事件。正式多人網路與手機實機另行驗收。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html',OUT=process.env.ZC_QA_OUT||'qa-output/slash-hit';
const report={checks:[],errors:[],timing:[],phone:'待主人實機驗收',network:'未測試：正式多人網路實連；已驗證兩端使用相同演出與接收佇列'};
function check(name,ok){report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)}
async function openGame(browser,width,height,broken=false){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1000});
 if(broken)await ctx.route('**/fx/slash-12.webp',r=>r.abort());
 const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(m.text())});
 await page.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},70)});
 await page.goto(URL);await page.click('#gateNo');await page.click('[data-cat="custom"]');await page.fill('#cname','斬擊驗收');await page.click('[data-ctab="tal"]');await page.click('[data-tal="keen"]');await page.click('[data-ctab="sk"]');await page.click('[data-csk="aid"]');await page.click('[data-m="cdone"]');await page.click('[data-m="solo"]');await page.click('[data-m="go"]');
 await page.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:30000});
 await page.evaluate(()=>{const p=me();p.st={STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0};p.gear=[];p.hand={R:null,L:null};const g=newGear('knife');p.gear.push(g);equip(p,g.u,'R');window.__encounter=startFight({n:2,types:['infected'],noMut:1,mode:'first'})});
 await page.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
 await page.evaluate(()=>{for(const f of G.fight.foes){f.hp=f.max=100;f.aff=null;f.stun=20}UI.partyCards=1;draw();window.__random=Math.random;Math.random=()=>.5;window.__frames=[];window.__sounds=[];const render=renderSlashVfx;renderSlashVfx=fx=>{render(fx);const canvas=document.querySelector('#foes .zc-slash-fx');if(canvas){const c=canvas.getContext('2d'),data=c&&c.getImageData(0,0,canvas.width,canvas.height).data;__frames.push({at:performance.now()-fx.t,ink:!!data&&data.some((v,i)=>i%4===3&&v>0),target:canvas.parentElement.dataset.id})}};UI.snd=1;audio();});
 await page.evaluate(()=>loadSounds());
 await page.evaluate(()=>{const create=AC.createBufferSource.bind(AC);AC.createBufferSource=()=>{const source=create(),start=source.start.bind(source);source.start=(at,...args)=>{if(source.buffer===BUF.knife)__sounds.push({at:performance.now(),delay:(at-AC.currentTime)*1000});return start(at,...args)};return source};});
 return {ctx,page};
}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch();
 try{
 for(const [width,height] of [[393,690],[844,390],[1280,720]]){
  const tag=width+'x'+height,{ctx,page:p}=await openGame(browser,width,height);
  check(tag+' 主人原畫完整載入',await p.evaluate(()=>SLASH_VFX.image.complete&&SLASH_VFX.image.naturalWidth===1728&&SLASH_VFX.image.naturalHeight===846));
  await p.click('#choices [data-ftab="atk"]');await p.locator('#choices [data-fa="atk"]').first().click();await p.locator('#choices [data-tgt]').first().click();
  await p.waitForFunction(()=>!!SLASH_VFX.active);const started=await p.evaluate(()=>SLASH_VFX.active.t);
  await p.waitForTimeout(180);await p.evaluate(()=>draw());await p.waitForTimeout(60);
  check(tag+' 重畫後仍對準同一敵人且不重播',await p.evaluate(t=>SLASH_VFX.active.t===t&&document.querySelectorAll('#foes .zc-slash-fx').length===1&&document.querySelector('.zc-slash-fx').parentElement.dataset.id==='0',started));
  await p.waitForTimeout(240);await p.screenshot({path:OUT+'/hit-'+tag+'.png'});
  check(tag+' 特效不攔截操作且被限制在敵人卡',await p.locator('.zc-slash-fx').evaluate(c=>getComputedStyle(c).pointerEvents==='none'&&getComputedStyle(c.parentElement).overflow==='hidden'&&Math.abs(c.clientWidth-c.parentElement.clientWidth)<2&&Math.abs(c.clientHeight-c.parentElement.clientHeight)<2));
  await p.waitForFunction(()=>!SLASH_VFX.active&&!busy&&!G.busy,null,{timeout:30000});
  const result=await p.evaluate(t=>({frames:__frames,sounds:__sounds.map(s=>({start:s.at+s.delay-t,peak:s.at+s.delay-t+335})),hp:G.fight.foes[0].hp,dur:me().gear.find(g=>g.id==='knife').dur,clean:!document.querySelector('.zc-slash-fx')&&!/undefined|NaN|\[object/.test(document.querySelector('#app').textContent),saved:JSON.stringify(snap()).includes('zc-slash')}),started);
  check(tag+' 實際斬擊扣原傷害4與耐久1',result.hp===96&&result.dur===14);
  check(tag+' 播完清除且沒有無效文字或特效存檔欄位',result.clean&&!result.saved);
  check(tag+' 逐格播放到第6格並且只有一份刀聲',result.frames.some(f=>f.at>=471&&f.at<565&&f.ink)&&result.sounds.length===1&&result.frames.every(f=>f.target==='0'));
  check(tag+' 刀聲峰值對齊主要刀光（偏差小於25ms）',Math.abs(result.sounds[0].peak-533)<25);report.timing.push({tag,...result.sounds[0],frames:result.frames.length});
  check(tag+' 原本選項完整可見',await p.locator('#choices button').evaluateAll(bs=>bs.slice(0,3).every(b=>{const r=b.getBoundingClientRect(),v=document.querySelector('#stage').getBoundingClientRect();return r.left>=v.left-1&&r.right<=v.right+1&&r.top>=v.top-1&&r.bottom<=v.bottom+1})));
  // 確認接收端真的經 pump 播放，狀態在刀光主格更新而非提早扣血。
  await p.evaluate(()=>{ROLE='client';UI.snd=0;__sounds=[];__frames=[];const state=snap();state.fight.foes[0].hp=92;window.__remoteState=state;enqueue({t:'slash',seq:100,d:{id:0,state}})});
  await p.waitForFunction(()=>!!SLASH_VFX.active);await p.waitForTimeout(150);
  check(tag+' 隊友端在主刀光前保留舊生命',await p.evaluate(()=>G.fight.foes[0].hp===96));
  await p.waitForFunction(()=>!qRun&&!SLASH_VFX.active);
  check(tag+' 隊友端更新快照並且靜音仍有動畫',await p.evaluate(()=>G.fight.foes[0].hp===92&&__frames.some(f=>f.ink)&&__sounds.length===0));
  // 減少動態效果設定仍可完成演出；離開戰鬥後不殘留。
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{window.__reduced=playSlashHit({id:0,state:snap()},true,++SLASH_VFX.stateSeq+1)});await p.waitForFunction(()=>!!SLASH_VFX.active);await p.waitForTimeout(100);
  check(tag+' 減少動態模式仍顯示接觸畫面',await p.locator('.zc-slash-fx').count()===1);await p.evaluate(()=>__reduced);
  await p.evaluate(()=>{window.__leaving=playSlashHit({id:0,state:snap()},true,++SLASH_VFX.stateSeq+1)});await p.waitForFunction(()=>!!SLASH_VFX.active);await p.evaluate(()=>{G.fight=null;G.phase='node';draw()});await p.evaluate(()=>__leaving);
  check(tag+' 離開戰鬥清除特效且不還原舊戰鬥',await p.evaluate(()=>G.fight===null&&!document.querySelector('.zc-slash-fx')));
  await ctx.close();
 }
 const {ctx,page:p}=await openGame(browser,844,390,true);
 await p.evaluate(()=>{UI.snd=0;window.__fallback=playSlashHit({id:0,state:snap()},true,++SLASH_VFX.stateSeq+1)});await p.evaluate(()=>__fallback);
 check('素材載入失敗不阻斷回合且仍保留原狀態',await p.evaluate(()=>!!G.fight&&!SLASH_VFX.active&&!document.querySelector('.zc-slash-fx')));await ctx.close();
 check('沒有程式或主控台錯誤',report.errors.length===0);
 }finally{fs.writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
