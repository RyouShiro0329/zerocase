// 穿刺特效瀏覽器驗收：三種尺寸實際建角、攻擊、同步；Android 實機另行驗收。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html',OUT=process.env.ZC_QA_OUT||'qa-output/pierce-hit';
const report={checks:[],errors:[],phone:'待主人實機驗收',network:'未測試：正式多人網路實連；已測試連線事件佇列'};
function check(n,ok){report.checks.push({name:n,result:ok?'通過':'失敗'});assert.ok(ok,n)}
async function openGame(browser,w,h,broken=false){
 const ctx=await browser.newContext({viewport:{width:w,height:h},hasTouch:w<1000});
 if(broken)await ctx.route('**/fx/pierce-12.svg',r=>r.abort());
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(m.text())});
 await page.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},70)});
 await page.goto(URL);await page.click('#gateNo');await page.click('[data-cat="custom"]');await page.fill('#cname','穿刺驗收');await page.click('[data-ctab="tal"]');await page.click('[data-tal="keen"]');await page.click('[data-ctab="sk"]');await page.click('[data-csk="aid"]');await page.click('[data-m="cdone"]');await page.click('[data-m="solo"]');await page.click('[data-m="go"]');
 await page.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:30000});
 await page.evaluate(()=>{const p=me();p.st={STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0};p.gear=[];p.hand={R:null,L:null};const g=newGear('screwdriver');p.gear.push(g);equip(p,g.u,'R');window.__encounter=startFight({n:2,types:['infected'],noMut:1,mode:'first'})});
 await page.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
 await page.evaluate(()=>{for(const f of G.fight.foes){f.hp=f.max=100;f.aff=null;f.stun=20}UI.partyCards=1;draw();window.__frames=[];const render=renderPierceVfx;renderPierceVfx=fx=>{render(fx);const canvas=document.querySelector('#foes .zc-pierce-fx');if(canvas){const d=canvas.getContext('2d').getImageData(0,0,canvas.width,canvas.height).data;__frames.push({at:performance.now()-fx.t,ink:d.some((v,i)=>i%4===3&&v>0),target:canvas.parentElement.dataset.id})}};});
 return {ctx,page};
}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch();
 try{
 for(const [w,h] of [[393,690],[844,390],[1280,720]]){
  const tag=w+'x'+h,{ctx,page:p}=await openGame(browser,w,h);
  check(tag+' 12格透明素材載入',await p.evaluate(()=>PIERCE_VFX.image.complete&&PIERCE_VFX.image.naturalWidth===960&&PIERCE_VFX.image.naturalHeight===480));
  await p.click('#choices [data-ftab="atk"]');await p.locator('#choices [data-fa="atk"]').first().click();await p.locator('#choices [data-tgt]').first().click();
  await p.waitForFunction(()=>!!PIERCE_VFX.active);
  const started=await p.evaluate(()=>PIERCE_VFX.active.t);
  await p.waitForTimeout(180);await p.evaluate(()=>draw());await p.waitForTimeout(170);
  check(tag+' 主命中段動畫仍對準同一敵人',await p.evaluate(t=>PIERCE_VFX.active.t===t&&document.querySelectorAll('#foes .zc-pierce-fx').length===1&&document.querySelector('.zc-pierce-fx').parentElement.dataset.id==='0',started));
  await p.screenshot({path:OUT+'/hit-'+tag+'.png'});
  check(tag+' 特效不攔截點擊也不增加卡片範圍',await p.locator('.zc-pierce-fx').evaluate(c=>getComputedStyle(c).pointerEvents==='none'&&getComputedStyle(c.parentElement).overflow==='hidden'&&Math.abs(c.clientWidth-c.parentElement.clientWidth)<2));
  await p.waitForFunction(()=>!PIERCE_VFX.active&&!busy&&!G.busy,null,{timeout:30000});
  check(tag+' 完整播放與清除、無無效文字',await p.evaluate(()=>__frames.some(f=>f.at>=350&&f.at<425&&f.ink)&&__frames.every(f=>f.target==='0')&&!document.querySelector('.zc-pierce-fx')&&!['undefined','NaN','[object'].some(t=>document.querySelector('#app').textContent.includes(t))));
  check(tag+' 傷害與耐久照既有規則扣除且不新增存檔欄位',await p.evaluate(()=>G.fight.foes[0].hp<100&&me().gear.find(x=>x.id==='screwdriver').dur===11&&!JSON.stringify(snap()).includes('PIERCE_VFX')));
  check(tag+' 操作選項沒有被擋住',await p.locator('#choices button').evaluateAll(bs=>bs.slice(0,3).every(b=>{const r=b.getBoundingClientRect(),v=document.querySelector('#stage').getBoundingClientRect();return r.left>=v.left-1&&r.right<=v.right+1&&r.top>=v.top-1&&r.bottom<=v.bottom+1})));
  await p.evaluate(()=>{ROLE='client';const state=snap();state.fight.foes[0].hp=72;window.__remoteState=state;enqueue({t:'pierce',seq:100,d:{id:0,melee:true,state}})});
  await p.waitForFunction(()=>!!PIERCE_VFX.active);
  await p.waitForTimeout(130);
  check(tag+' 隊友端命中前不提前套新生命',await p.evaluate(()=>G.fight.foes[0].hp!==72));
  await p.waitForFunction(()=>!qRun&&!PIERCE_VFX.active,null,{timeout:30000});
  check(tag+' 隊友端動畫結束後同步生命',await p.evaluate(()=>G.fight.foes[0].hp===72));
  await p.evaluate(()=>{window.__leaving=playPierceHit({id:0,melee:true,state:snap()},true,++SLASH_VFX.stateSeq+1)});
  await p.waitForFunction(()=>!!PIERCE_VFX.active);
  await p.evaluate(()=>{G.fight=null;G.phase='node';draw()});
  await p.evaluate(()=>__leaving);
  check(tag+' 離開戰鬥後不殘留',await p.evaluate(()=>G.fight===null&&!document.querySelector('.zc-pierce-fx')));
  await ctx.close();
 }
 const {ctx,page:p}=await openGame(browser,844,390,true);
 await p.evaluate(()=>{window.__fallback=playPierceHit({id:0,melee:true,state:snap()},true,++SLASH_VFX.stateSeq+1)});
 await p.evaluate(()=>__fallback);
 check('特效素材失敗時不阻擋回合',await p.evaluate(()=>!!G.fight&&!PIERCE_VFX.active));
 await ctx.close();
 check('沒有程式或主控台錯誤',report.errors.length===0);
 }finally{fs.writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
