// v0.67.0 截圖：特殊選項（藍字、沒有藍框）與檢定標籤、隨機意外的背景豁免紀錄。跑法：倉庫根目錄 python3 -m http.server 8769，再 node docs/qa_v0.67.0/shots.cjs [頁面 檔名前綴]
const {chromium}=require('playwright');const PAGE=process.argv[2]||'index.html',PRE=process.argv[3]||'after';const URL='http://localhost:8769/'+PAGE;
const VIEWS=[[844,390],[1280,720],[690,393]];
(async()=>{const b=await chromium.launch();const errs=[];
for(const [w,h] of VIEWS){const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<1000});const p=await ctx.newPage();
 p.on('pageerror',e=>errs.push(w+':'+e.message));
 await p.goto(URL);await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});await p.reload();
 await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
 await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node'&&!G.busy,null,{timeout:30000});
 await p.evaluate(()=>{G.opts.diff='hard';addI(G.players[0],'flashlight');G.hazCd=99;G.busy=1;void enterNode('AM2').then(()=>{G.busy=0;G.phase='node';draw()})});
 await p.waitForFunction(()=>G.node==='AM2'&&!G.busy,null,{timeout:20000});await p.waitForTimeout(500);
 await p.screenshot({path:`docs/qa_v0.67.0/shots/${PRE}_blu_${w}x${h}.png`});
 const info=await p.evaluate(()=>{const b=document.querySelector('.ch.blu');const n=document.querySelector('.ch:not(.blu)');const t=document.querySelector('.tag.t-ck');const cs=x=>x&&getComputedStyle(x);
  return {blu:b&&{border:cs(b).borderTopColor,text:cs(b.querySelector('.cl')).color},plain:n&&cs(n).borderTopColor,tag:t&&{text:t.innerText,border:cs(t).borderTopColor,color:cs(t).color}}});
 await p.evaluate(()=>{G.hazCd=0;G.node='A3c';const r=RNG;RNG=()=>0;void hazard(N.A3c).then(()=>{RNG=r;draw()})});await p.waitForTimeout(1500);
 await p.screenshot({path:`docs/qa_v0.67.0/shots/${PRE}_hazard_${w}x${h}.png`});
 console.log(w+'x'+h,JSON.stringify(info),await p.evaluate(()=>LOG.slice(-4).map(x=>x[0]).join(' / ')));
 await ctx.close()}
console.log('errors',JSON.stringify(errs));await b.close()})();
