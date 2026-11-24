// v0.66.0 遭遇立繪：同高、不壓到標題。跑法：倉庫根目錄 python3 -m http.server 8769，再 node docs/qa_v0.66.0/enc.cjs
const {chromium}=require('playwright');const URL='http://localhost:8769/index.html';
const SETS={inf2:['infected','infected'],bloat:['incubator','infected'],mix3:['predator','incubator','harvester'],four:['incubator','devourer','predator','infected'],acru:['acru_sniper','acru_flamer','acru_captain']};
(async()=>{const b=await chromium.launch();const out=[];
for(const [w,h] of [[844,390],[690,393],[1280,720]]){const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<1000});const p=await ctx.newPage();
 await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});await p.reload();
 await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
 await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node'&&!G.busy,null,{timeout:30000});
 for(const [k,names] of Object.entries(SETS)){
  await p.evaluate(n=>{G.fight=null;G.stg=null;G.phase='node';fright=async()=>{};rollInit=async()=>{G.fight.order=[]};advance=async()=>{};endFight=async()=>{};void startFight({n:n.length,mode:'normal',types:n,noMut:1})},names);
  await p.waitForFunction(()=>document.querySelector('#stg.m-name'),null,{timeout:8000}).catch(()=>{});await p.waitForTimeout(250);
  const m=await p.evaluate(()=>{const t=document.querySelector('#stg .enc-state').getBoundingClientRect();return {titleBottom:Math.round(t.bottom),imgs:[...document.querySelectorAll('#stg img')].map(i=>{const r=i.getBoundingClientRect();return [Math.round(r.top),Math.round(r.height),Math.round(r.left),Math.round(r.right)]}),vw:innerWidth}});
  out.push(`${w}x${h} ${k} ${JSON.stringify(m)}`);await p.screenshot({path:`docs/qa_v0.66.0/shots/enc_${k}_${w}x${h}.png`});
  await p.waitForFunction(()=>!G.stg,null,{timeout:8000}).catch(()=>{})}
 await ctx.close()}
console.log(out.join('\n'));await b.close()})();
