// 鈍擊實際遊戲驗收、手機畫面與含音效示範錄影；測試控制只在此腳本注入。
const {chromium}=require('playwright'),fs=require('node:fs'),assert=require('node:assert/strict');
const OUT=process.env.ZC_QA_OUT||'qa-output/blunt-hit',URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html';
const report={checks:[],errors:[],phone:'待主人實機驗收',network:'未測試（正式多人實連）；受控接收事件另行驗證'};
function check(name,ok){report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)}
async function setup(b,width,height,video=false,broken=false){
 const ctx=await b.newContext({viewport:{width,height},hasTouch:true,...(video?{recordVideo:{dir:OUT+'/raw',size:{width,height}}}:{})});
 if(broken)await ctx.route('**/fx/blunt-12.webp',r=>r.abort());
 const p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
 await p.addInitScript(()=>{localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}));localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const id of ['dice','lvcard','enc']){const e=document.getElementById(id);if(e&&!e.hidden)e.click()}},70)});
 await p.goto(URL);await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
 await p.waitForFunction(()=>G&&G.phase==='node'&&!busy);
 await p.evaluate(()=>{const p=me();p.st={STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0};p.gear=[];p.hand={R:null,L:null};const g=newGear('hammer');p.gear.push(g);equip(p,g.u,'R');window.__encounter=startFight({n:2,types:['infected'],noMut:1,mode:'first'})});
 await p.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
 await p.evaluate(()=>{for(const f of G.fight.foes){f.hp=f.max=60;f.aff=null;f.stun=30}UI.partyCards=0;draw();Math.random=()=>.5;window.__frames=[];window.__hits=[];const render=renderBluntVfx;renderBluntVfx=fx=>{render(fx);__frames.push({frame:fx.frame,at:performance.now()-fx.t,target:fx.id})};const orig=sfx;sfx=(k,...a)=>{if(k==='blunthit')__hits.push(performance.now());return orig(k,...a)};UI.snd=1;audio();});
 await p.evaluate(()=>loadSounds());return {ctx,p};
}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch(process.env.ZC_CHROMIUM?{executablePath:process.env.ZC_CHROMIUM,args:['--no-sandbox','--disable-dev-shm-usage']}:{});
try{
 for(const [w,h] of (process.env.ZC_DEMO_ONLY?[]:[[844,390],[393,690]])){
  const {ctx,p}=await setup(b,w,h),tag=w+'x'+h;
  check(tag+' 12格透明圖正確載入',await p.evaluate(()=>BLUNT_VFX.image.naturalWidth===1448&&BLUNT_VFX.image.naturalHeight===1086));
  await p.evaluate(()=>{window.__attack=attack(me(),'R',null,0)});await p.waitForFunction(()=>!!BLUNT_VFX.active);const t=await p.evaluate(()=>BLUNT_VFX.active.t);
  await p.waitForTimeout(160);await p.screenshot({path:OUT+'/hit-'+tag+'.png'});
  await p.evaluate(()=>__attack);
  const r=await p.evaluate(t=>({frames:__frames,hits:__hits.map(x=>x-t),hp:G.fight.foes[0].hp,dur:me().gear[0].dur,clean:!document.querySelector('.zc-blunt-fx')&&!document.querySelector('.zc-blunt-react'),buttons:[...document.querySelectorAll('#choices button')].slice(0,3).every(e=>{const r=e.getBoundingClientRect(),s=document.querySelector('#stage').getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1})}),t);
  check(tag+' 實際扣血與耐久沿用原規則',r.hp===55&&r.dur===27);check(tag+' 播出12格且只有目標卡受擊',new Set(r.frames.map(f=>f.frame)).size===12&&r.frames.every(f=>f.target===0));check(tag+' 音效一次且對齊撞擊（40ms內）',r.hits.length===1&&Math.abs(r.hits[0]-90)<40);check(tag+' 演出清除，按鈕完整',r.clean&&r.buttons);
  await p.evaluate(()=>{UI.snd=0;window.__before=G.fight.foes[0].hp;window.__frames=[];const state=snap();state.fight.foes[0].hp-=5;enqueue({t:'blunt',seq:100,d:{id:0,state}})});await p.waitForFunction(()=>!qRun&&!BLUNT_VFX.active);check(tag+' 接收事件更新血量與演出',await p.evaluate(()=>G.fight.foes[0].hp===__before-5&&__frames.length>0));
  await p.evaluate(()=>{const state=snap();state.fight.foes[0].hp=1;enqueue({t:'blunt',seq:99,d:{id:0,state}})});await p.waitForFunction(()=>!qRun);check(tag+' 過期事件不覆蓋生命',await p.evaluate(()=>G.fight.foes[0].hp===__before-5));
  await p.emulateMedia({reducedMotion:'reduce'});await p.evaluate(()=>{window.__fx=playBluntHit({id:0,state:snap()})});await p.waitForFunction(()=>!!BLUNT_VFX.active);await p.waitForTimeout(100);check(tag+' 減少動態不震動',await p.locator('.zc-blunt-react').count()===0);await p.evaluate(()=>__fx);
  await p.evaluate(()=>{window.__fx=playBluntHit({id:0,state:snap()})});await p.waitForFunction(()=>!!BLUNT_VFX.active);await p.evaluate(()=>{G.fight=null;draw()});await p.evaluate(()=>__fx);check(tag+' 離開戰鬥清除演出',await p.evaluate(()=>!G.fight&&!document.querySelector('.zc-blunt-fx')));await ctx.close();
 }
 if(!process.env.ZC_DEMO_ONLY){const broken=await setup(b,844,390,false,true);await broken.p.evaluate(()=>attack(me(),'R',null,0));check('素材失敗仍扣血完成回合',await broken.p.evaluate(()=>G.fight.foes[0].hp===55&&!BLUNT_VFX.active));await broken.ctx.close();}
 // 影片：真實遊戲畫面；測試固定命中與敵人血量，實際呼叫原攻擊流程。
 const {ctx,p}=await setup(b,844,390);fs.mkdirSync(OUT+'/frames',{recursive:true});let capture=true;const frames=[];const captureTask=(async()=>{while(capture){const start=performance.now();const file='frames/'+String(frames.length).padStart(5,'0')+'.jpg';const bytes=await p.screenshot({type:'jpeg',quality:90});fs.writeFileSync(OUT+'/'+file,bytes);frames.push({file,at:performance.now()});await new Promise(r=>setTimeout(r,Math.max(0,40-(performance.now()-start))))}})();
 await p.evaluate(()=>{stopAmbience();stopSfx();const dest=AC.createMediaStreamDestination();SFX_MASTER.connect(dest);window.__chunks=[];window.__rec=new MediaRecorder(dest.stream);__rec.ondataavailable=e=>__chunks.push(e.data);__rec.start();window.__sync=document.createElement('div');__sync.style='position:fixed;inset:0;z-index:999999;background:#fff';document.body.append(__sync)});
 await p.waitForTimeout(200);await p.evaluate(()=>__sync.remove());await p.waitForTimeout(700);
 for(let i=0;i<3;i++){await p.click('#choices [data-ftab="atk"]');await p.locator('#choices [data-fa="atk"]').first().click();await p.locator('#choices [data-tgt]').first().click();await p.waitForFunction(()=>!busy&&!G.busy&&!BLUNT_VFX.active,null,{timeout:30000});await p.waitForTimeout(900)}
 await p.waitForTimeout(700);
 const audio=await p.evaluate(()=>new Promise(ok=>{__rec.onstop=async()=>{const data=await new Blob(__chunks).arrayBuffer();let s='';for(const v of new Uint8Array(data))s+=String.fromCharCode(v);ok(btoa(s))};__rec.stop()}));fs.writeFileSync(OUT+'/audio.webm',Buffer.from(audio,'base64'));capture=false;await captureTask;await ctx.close();fs.writeFileSync(OUT+'/frames.json',JSON.stringify(frames));report.video=OUT+'/frames.json';
 check('沒有頁面程式錯誤',report.errors.length===0);
}finally{await b.close();fs.writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
