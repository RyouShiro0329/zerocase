// 第一版只記錄數字。使用正常播放速度、新瀏覽器 context、本機靜態資源路由；不代表手機網路載入效能。
const fs=require('node:fs'),path=require('node:path');const {context}=require('./helpers/deep-browser.cjs');
async function run(browser,{out='test-results/deep/performance'}={}){
 fs.mkdirSync(out,{recursive:true});const t=performance.now(),metrics={},checks=[];let c,report;
 const measure=async(name,fn)=>{const t=performance.now();await fn();metrics[name]=+(performance.now()-t).toFixed(3)};
 try{
  c=await context(browser,{speed:1});const p=c.page;metrics.navigationMs=+c.navigationMs.toFixed(3);
  await measure('gateToMenuMs',async()=>{await p.click('#gateNo');await p.locator('#scr:not([hidden])').waitFor();await p.locator('#zc-asset-panel').waitFor({state:'hidden'})});
  await measure('menuToRosterMs',async()=>{await p.click('[data-cat="story"]');await p.locator('[data-rsel="maggie"]').waitFor()});
  await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-dif="normal"]');
  await measure('newGameReadyMs',async()=>{await p.click('[data-m="go"]');await p.waitForFunction(()=>G&&G.phase==='node'&&!busy&&!G.busy,null,{timeout:30000})});
  await p.evaluate(()=>{window.__deepActions=[];const original=execAct;execAct=async function(p,a){__deepActions.push({at:performance.now(),action:a.a});return original.apply(this,arguments)}});
  await measure('encounterReadyMs',async()=>{await p.evaluate(async()=>{await run(()=>startFight({n:1,types:['infected'],noMut:1,noElite:1}))});await p.waitForFunction(()=>G.over||G.fight&&G.fight.group&&G.fight.group.includes(MYPID))});
  const ready=await p.evaluate(()=>!!G.fight&&!G.over);if(!ready)throw Error('效能樣本在戰鬥開場已結束，無法量到按鈕回應');
  const tab=p.locator('#choices [data-ftab="atk"]');if(await tab.count())await tab.click();
  await p.evaluate(()=>{window.__deepClickAt=null;document.querySelector('#choices').addEventListener('click',()=>{window.__deepClickAt=performance.now()},{capture:true,once:true})});
  await p.locator('#choices button[data-fa="atk"]:not([disabled])').first().click();
  const target=p.locator('#choices button[data-tgt]');if(await target.count()){
   await p.evaluate(()=>{window.__deepClickAt=null;document.querySelector('#choices').addEventListener('click',()=>{window.__deepClickAt=performance.now()},{capture:true,once:true})});await target.first().click();
  }
  await p.waitForFunction(()=>__deepActions.some(a=>a.action==='atk'));
  metrics.combatInputToActionMs=await p.evaluate(()=>+(__deepActions.find(a=>a.action==='atk').at-__deepClickAt).toFixed(3));
  const settle=performance.now();await p.waitForFunction(()=>G.over||!busy&&!G.busy,null,{timeout:30000});metrics.combatSettleMs=+(performance.now()-settle).toFixed(3);
  checks.push({ok:Object.values(metrics).every(x=>Number.isFinite(x)&&x>=0),name:'P01 效能數字完整有效（不設速度門檻）'});
  checks.push({ok:c.errors.required.length===0,name:'P02 效能流程無必要資源／JS 錯誤',note:JSON.stringify(c.errors.required)});
  report={schema:1,status:checks.every(x=>x.ok)?'PASS':'ERROR',metrics,thresholds:null,environment:{viewport:[844,390],speed:1,transport:'本機 route（不含網路延遲）',browser:browser.version()},checks,errors:c.errors};
  await p.screenshot({path:path.join(out,'combat.png')});
 }catch(e){report={schema:1,status:'ERROR',metrics,thresholds:null,checks,error:e.stack}}
 finally{if(c)await c.ctx.close()}
 report.seconds=+((performance.now()-t)/1000).toFixed(3);fs.writeFileSync(path.join(out,'performance.json'),JSON.stringify(report,null,2));return report;
}
module.exports={run};
if(require.main===module){const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();try{const r=await run(b,{out:process.env.QA_OUT||'test-results/deep/performance'});console.log(JSON.stringify(r));process.exitCode=r.status==='PASS'?0:1}finally{await b.close()}})().catch(e=>{console.error(e.stack);process.exitCode=3})}
