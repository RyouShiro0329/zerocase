// v0.66.0 截圖：我方先制偷襲選單、遭遇演出的說明、背景豁免的紀錄。跑法：倉庫根目錄 python3 -m http.server 8769，再 node docs/qa_v0.66.0/shots.cjs
const {chromium}=require('playwright');const URL='http://localhost:8769/index.html';
const VIEWS=[[844,390],[1280,720],[690,393]];
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of VIEWS){const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<1000});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push(w+':'+e.message));
 await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});await p.reload();
 await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
 await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node'&&!G.busy,null,{timeout:30000});
 // 我方先制：真的跑 startFight
 await p.evaluate(()=>{void startFight({n:2,mode:'first',names:['感染者','感染者'],noMut:1})});
 await p.waitForTimeout(900);await p.screenshot({path:`docs/qa_v0.66.0/shots/enc_first_${w}x${h}.png`});
 await p.waitForFunction(()=>G.fight&&G.fight.sneak===1&&!G.stg,null,{timeout:20000});
 await p.evaluate(()=>{for(const s of ['#dice'])if(!document.querySelector(s).hidden)document.querySelector(s).click()});await p.waitForTimeout(600);
 await p.click('[data-ftab="atk"]').catch(()=>{});await p.waitForTimeout(300);
 await p.screenshot({path:`docs/qa_v0.66.0/shots/sneak_${w}x${h}.png`});
 const menu=await p.evaluate(()=>document.querySelector('#choices').innerText);
 // 打下去
 await p.evaluate(()=>{const b=document.querySelector('[data-fa="atk"]');b&&b.click()});await p.waitForTimeout(300);
 await p.evaluate(()=>{const b=document.querySelector('[data-tgt]');b&&b.click()});
 await p.waitForFunction(()=>G.fight&&!G.fight.sneak,null,{timeout:20000}).catch(()=>{});
 const st=await p.evaluate(()=>({sneak:G.fight&&G.fight.sneak,round:G.fight&&G.fight.round,hp:G.fight&&G.fight.foes.map(f=>f.hp+'/'+f.max)}));
 // 背景豁免的紀錄：隨機意外
 await p.evaluate(()=>{G.fight=null;G.phase='node';draw();G.hazCd=0;const r=RNG;RNG=()=>0;void hazard({}).then(()=>{RNG=r;draw()})});await p.waitForTimeout(1500);
 await p.screenshot({path:`docs/qa_v0.66.0/shots/hazard_log_${w}x${h}.png`});
 const lg=await p.evaluate(()=>LOG.slice(-4).map(x=>x[0]).join(' / '));
 console.log(w+'x'+h,JSON.stringify({menu:menu.slice(0,160),st,lg}));
 await ctx.close()}
console.log('errors',JSON.stringify(errs));await b.close()})();
