const {chromium}=require('playwright');const {GOD}=require('/home/claude/zerocase/tests/helpers/godmode.cjs');
const URL='http://localhost:8769/index.html';const OUT='/home/claude/qa/shots/';
async function boot(b,vw,bgm){const ctx=await b.newContext({viewport:vw});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.stack||e.message));
 await p.goto(URL);await p.evaluate(b=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:1,bgm:b,spd:1,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))},bgm);await p.reload();
 await p.click(bgm?'#gateGo':'#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
 await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node'&&!busy,null,{timeout:30000});await p.evaluate(GOD);return {ctx,p,errs}}
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});const R={};
 for(const [tag,vw] of [['844x390',{width:844,height:390}],['1280x720',{width:1280,height:720}],['690x393',{width:690,height:393}]]){
  const {ctx,p,errs}=await boot(b,vw,1);
  // 1) 一般遭遇：兩隻感染者
  const node0=await p.evaluate(()=>G.node);
  await p.evaluate(()=>{window.__marks=[];const st=document.getElementById('stg');new MutationObserver(()=>{const a=BGM_MIX.tracks[BGM_MIX.mode];__marks.push({cls:st.className,t:performance.now(),stEl:G.stg?stgEl(G.stg):null,audio:a?a.currentTime:null,mode:BGM_MIX.mode,paused:a?a.paused:null})}).observe(st,{attributes:true,attributeFilter:['class']});
   window.__t0=performance.now();run(()=>startFight({n:2,mode:'normal',names:['感染者','感染者']}))});
  await p.waitForTimeout(450);const lock=await p.evaluate(async()=>{const before={stg:!!G.stg,phase:G.phase,busy};const st=document.getElementById('stg');for(let i=0;i<10;i++){st.dispatchEvent(new MouseEvent('click',{bubbles:true,cancelable:true}));document.body.dispatchEvent(new KeyboardEvent('keydown',{key:'1',code:'Digit1',bubbles:true,cancelable:true}));}
   const cs=document.querySelector('#choices button');if(cs)cs.click();act({a:'atk',h:'R'});return {before,still:!!G.stg,pend:JSON.stringify(G.fight&&G.fight.pend||{}),acts:typeof NET!=='undefined'?NET.acts.length:null}});
  for(const ms of [350,1050,1800,2300]){await p.waitForFunction(m=>performance.now()-__t0>=m,ms);await p.screenshot({path:`${OUT}enc_${tag}_${ms}.png`})}
  // 演出中狂點、按鍵、長按
  await p.waitForFunction(()=>!G.stg,null,{timeout:8000});const endT=await p.evaluate(()=>performance.now()-__t0);
  R[tag]={lock,stageMs:Math.round(endT),marks:await p.evaluate(()=>__marks.map(m=>({cls:m.cls,dt:Math.round(m.t-__t0),stEl:m.stEl,audio:m.audio&&+m.audio.toFixed(3),mode:m.mode,paused:m.paused})))};
  await p.waitForFunction(()=>G.fight&&G.phase==='fight'&&!busy,null,{timeout:20000}).catch(()=>{});await p.screenshot({path:`${OUT}fight_${tag}.png`});
  // 2) 亂入：警戒滿 → 下一輪加入
  await p.evaluate(()=>{G.fight.reinf={r:G.fight.round-1,f:'inf'};window.__t1=performance.now();run(async()=>{await alarmJoin()})});
  await p.waitForTimeout(400);await p.screenshot({path:`${OUT}raid_${tag}_400.png`});await p.waitForTimeout(1300);await p.screenshot({path:`${OUT}raid_${tag}_1700.png`});
  await p.waitForFunction(()=>!G.stg&&!busy,null,{timeout:10000});R[tag].raidMs=Math.round(await p.evaluate(()=>performance.now()-__t1));R[tag].raidMusic=await p.evaluate(()=>BGM_MIX.mode);
  // 3) 結束：把敵人都打倒
  await p.evaluate(()=>{for(const f of G.fight.foes){f.hp=0;f.dead=1}window.__t2=performance.now();run(endFight)});
  await p.waitForTimeout(450);await p.screenshot({path:`${OUT}end_${tag}_450.png`});
  await p.waitForFunction(()=>!G.stg&&!busy,null,{timeout:10000});R[tag].endMs=Math.round(await p.evaluate(()=>performance.now()-__t2));R[tag].afterEnd=await p.evaluate(()=>({mode:BGM_MIX.mode,phase:G.phase}));
  R[tag].errs=errs;await ctx.close()}
 // 4) 沒有音樂（BGM 關）也照時間軸
 {const {ctx,p,errs}=await boot(b,{width:844,height:390},0);await p.evaluate(()=>{window.__t0=performance.now();run(()=>startFight({n:1,mode:'normal',names:['感染者']}))});await p.waitForFunction(()=>!G.stg,null,{timeout:8000});R.nobgm={ms:Math.round(await p.evaluate(()=>performance.now()-__t0)),errs};await ctx.close()}
 // 5) 音檔載入失敗
 {const ctx=await b.newContext({viewport:{width:844,height:390}});await ctx.route(/bgm_hitman/,r=>r.abort());const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
  await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:1,bgm:1,spd:1,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});await p.reload();
  await p.click('#gateGo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node'&&!busy,null,{timeout:30000});await p.evaluate(GOD);
  await p.evaluate(()=>{window.__t0=performance.now();run(()=>startFight({n:1,mode:'normal',names:['感染者']}))});await p.waitForFunction(()=>!G.stg,null,{timeout:8000});R.loadfail={ms:Math.round(await p.evaluate(()=>performance.now()-__t0)),failed:await p.evaluate(()=>Object.fromEntries(Object.entries(BGM_MIX.tracks).map(([k,a])=>[k,!!a.zcFailed]))),errs};await ctx.close()}
 console.log(JSON.stringify(R,null,1));await b.close()})();
