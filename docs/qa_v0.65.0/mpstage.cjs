// 雙人：共用時間軸、隊友延遲、演出中點按作廢、房主交接
const {chromium}=require('playwright');const {GOD}=require('/home/claude/zerocase/tests/helpers/godmode.cjs');
const BASE='http://localhost:8767/test.html';
async function setup(b,delay){const ctx=await b.newContext({viewport:{width:844,height:390}});const errs=[];const pages=[];
 for(let i=0;i<2;i++){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(i+':'+(e.stack||e.message)));pages.push(p)}
 await pages[0].goto(BASE+'?pid=h1');await pages[0].evaluate(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});
 for(let i=0;i<2;i++){await pages[i].goto(BASE+'?pid=pp'+i);await pages[i].click('#gateNo')}
 const [H,C]=pages;await H.waitForTimeout(300);
 await H.click('[data-cat="story"]');await H.click('[data-rsel="maggie"]');await H.click('[data-m="rpick"]');await H.click('[data-m="cdone"]');await H.click('[data-m="host"]');await H.waitForSelector('[data-m="start"]');
 const code=await H.evaluate(()=>NET.code);
 await C.click('[data-cat="story"]');await C.click('[data-rsel="liao"]');await C.click('[data-m="rpick"]');await C.click('[data-m="cdone"]');await C.click('[data-m="join"]');for(const ch of code)await C.click(`[data-key="${ch}"]`);await C.click('[data-m="dojoin"]');await C.waitForSelector('[data-m="leave"]');await C.click('[data-m="rdy"]');
 await H.waitForTimeout(800);await H.click('[data-m="start"]');
 await H.waitForFunction(()=>window.__G()&&window.__G().phase==='node'&&!busy,null,{timeout:30000});await H.evaluate(GOD);
 await C.waitForFunction(()=>window.__G()&&window.__G().phase==='node',null,{timeout:30000});
 if(delay)await C.evaluate(d=>{const o=enqueue;window.__delay=0;enqueue=x=>{if(window.__delay)setTimeout(()=>o(x),d);else o(x)}},delay);
 // 兩邊都記錄自己看到的演出
 for(const p of pages)await p.evaluate(()=>{window.__log=[];setInterval(()=>{const g=window.__G();const s=g&&g.stg;const el=document.getElementById('stg');__log.push({t:Date.now(),id:s&&s.id,on:typeof stgOn==='function'&&stgOn(),vis:el&&!el.hidden,cls:el&&el.className,view:s&&typeof stgView==='function'&&stgView()?Math.round(stgView().el):null})},40)});
 return {ctx,H,C,errs}}
const sum=L=>{const on=L.filter(x=>x.id);if(!on.length)return null;const first=on[0],last=on.at(-1);const mi=L.find(x=>/m-img/.test(x.cls||''));return {firstSeen:first.t,firstView:first.view,lastSeen:last.t,imgAt:mi&&mi.t,ids:[...new Set(on.map(x=>x.id))].length}};
(async()=>{const b=await chromium.launch();const R={};
 // A：正常同步 + 隊友演出中狂點
 {const {ctx,H,C,errs}=await setup(b,0);
  await H.evaluate(()=>{window.__h0=Date.now();run(()=>startFight({n:2,mode:'normal',names:['感染者','感染者']}))});
  await C.waitForFunction(()=>window.__G().stg,null,{timeout:5000});
  const tries=await C.evaluate(async()=>{const n0=NET.acts.length;for(let i=0;i<6;i++){document.getElementById('stg').dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));act({a:'atk',h:'R'})}await new Promise(r=>setTimeout(r,300));return {queued:NET.acts.length-n0}});
  await H.waitForFunction(()=>!window.__G().stg,null,{timeout:8000});const hEnd=await H.evaluate(()=>Date.now());
  await C.waitForFunction(()=>!window.__G().stg,null,{timeout:8000});const cEnd=await C.evaluate(()=>Date.now());
  await H.waitForTimeout(500);
  const hs=sum(await H.evaluate(()=>__log)),cs=sum(await C.evaluate(()=>__log));const h0=await H.evaluate(()=>__h0);
  const pend=await H.evaluate(()=>JSON.stringify(window.__G().fight&&window.__G().fight.pend||{}));
  R.normal={hostStageMs:hEnd-h0,clientUnlockLagMs:cEnd-hEnd,clientFirstSeenAfterHostMs:cs.firstSeen-h0,clientFirstViewMs:cs.firstView,hostImgMs:hs.imgAt-h0,clientImgMs:cs.imgAt-h0,clientQueuedActs:tries.queued,hostPendAfter:pend,errs};await ctx.close()}
 // B：隊友延遲 1200ms 收到：從目前進度接上，不從頭；不拖慢房主
 {const {ctx,H,C,errs}=await setup(b,1200);await C.evaluate(()=>{window.__delay=1});
  await H.evaluate(()=>{window.__h0=Date.now();run(()=>startFight({n:1,mode:'normal',names:['感染者']}))});
  await H.waitForFunction(()=>!window.__G().stg,null,{timeout:8000});const hEnd=await H.evaluate(()=>Date.now());
  await C.waitForFunction(()=>window.__G().fight&&!window.__G().stg&&window.__log.some(x=>x.id),null,{timeout:10000});
  const cs=sum(await C.evaluate(()=>__log)),h0=await H.evaluate(()=>__h0);await C.evaluate(()=>{window.__delay=0});
  R.delayed={hostStageMs:hEnd-h0,clientFirstSeenAfterHostMs:cs.firstSeen-h0,clientFirstViewMs:cs.firstView,clientIds:cs.ids,errs};await ctx.close()}
 // C：亂入演出進行中房主斷線 → 隊友接任，把剩下的演完，不重複加敵人、不重複先攻
 {const {ctx,H,C,errs}=await setup(b,0);
  await H.evaluate(()=>run(()=>startFight({n:1,mode:'normal',names:['感染者']})));await H.waitForFunction(()=>{const g=window.__G();return g.fight&&g.fight.order.length&&!g.stg&&g.phase==='fight'},null,{timeout:15000});
  await H.evaluate(()=>{const F=window.__G().fight;F.reinf={r:F.round-1,f:'inf'};run(()=>alarmJoin())});
  await C.waitForFunction(()=>window.__G().stg&&window.__G().stg.k==='raid',null,{timeout:5000});const foes0=await C.evaluate(()=>window.__G().fight.foes.length);
  await C.waitForTimeout(700);await H.evaluate(()=>NET.r.leave());await H.close();const t0=await C.evaluate(()=>Date.now());
  await C.waitForFunction(()=>ROLE==='host',null,{timeout:20000});const tHost=await C.evaluate(()=>Date.now());
  await C.waitForFunction(()=>!window.__G().stg,null,{timeout:10000});const t1=await C.evaluate(()=>Date.now());
  await C.waitForTimeout(1500);
  const st=await C.evaluate(()=>{const g=window.__G();return {foes:g.fight&&g.fight.foes.length,order:g.fight&&g.fight.order.length,orderFoes:g.fight&&g.fight.order.filter(o=>o.k==='f').length,stg:!!g.stg,phase:g.phase,reinfIn:g.fight&&g.fight.reinf&&g.fight.reinf.in}});
  R.handover={foesDuringStage:foes0,after:st,hostLeftToNewHostMs:tHost-t0,newHostFinishMs:t1-tHost,errs};await ctx.close()}
 console.log(JSON.stringify(R,null,1));await b.close()})();
