const fs=require('node:fs'),path=require('node:path');
const {context,start}=require('./helpers/deep-browser.cjs'),{timerProbe,LIMITS,assess,sample}=require('./helpers/deep-resources.cjs');
async function cycle(page,index=0){
 if(index%3===0)await page.evaluate(async()=>{await run(()=>startFight({n:1,types:['infected'],noMut:1,noElite:1}))});
 await page.evaluate(()=>{panel('bag')});await page.evaluate(()=>closeOv());
 await page.evaluate(async()=>{await run(()=>{G.players[0].hp=0;return deathCheck()})});
 await page.click('#choices [data-menu]');await page.waitForFunction(()=>G===null&&SCR==='menu');await start(page);
}
async function run(browser,{out='test-results/deep/stability',seconds=600,interval=10,minimumCycles=12,leak=false}={}){
 if(seconds<1||interval<=0||minimumCycles<6)throw Error('穩定性參數不符');fs.mkdirSync(out,{recursive:true});
 const t=performance.now(),samples=[],checks=[];let c,cdp,report;
 try{
  c=await context(browser,{instrument:timerProbe});const {page:p}=c;cdp=await c.ctx.newCDPSession(p);await start(p,{gate:true});
  for(let i=0;i<3;i++)await cycle(p,i); // 資源、字型、面板與結算暖身；全部樣本都在同一個新局入口。
  const t0=performance.now();samples.push(await sample(cdp,p,0,0));let count=0,next=performance.now()+interval*1000;
  while(performance.now()-t0<seconds*1000||count<minimumCycles){
   await cycle(p,count);count++;
   if(leak)await p.evaluate(i=>{(window.__qaLeaks||(window.__qaLeaks=[])).push(new Array(1024*1024).fill(i));for(let k=0;k<8;k++){setInterval(()=>{},3600000);window.addEventListener('qa-leak-'+i+'-'+k,()=>{})}const box=document.createElement('div');for(let j=0;j<220;j++)box.appendChild(document.createElement('span'));document.body.appendChild(box)},count);
   if(performance.now()<next)await p.waitForTimeout(next-performance.now());next=Math.max(next+interval*1000,performance.now());
   samples.push(await sample(cdp,p,(performance.now()-t0)/1000,count));fs.writeFileSync(path.join(out,'samples.json'),JSON.stringify(samples,null,2));const s=samples.at(-1);console.log(JSON.stringify({probe:'QA-26',elapsed:+s.elapsed.toFixed(2),cycle:s.cycle,heapBytes:s.heapBytes,timers:s.timers,listeners:s.listeners,nodes:s.nodes}));
  }
  const result=assess(samples);for(const [key,m] of Object.entries(result.metrics))checks.push({ok:m.ok,name:'R01 '+key,note:JSON.stringify(m)});
  checks.push({ok:c.errors.required.length===0,name:'R02 穩定性流程無必要資源／JS 錯誤',note:JSON.stringify(c.errors.required)});
  report={schema:1,status:checks.every(c=>c.ok)?'PASS':'FAIL',requestedSeconds:seconds,observedSeconds:samples.at(-1).elapsed,cycles:count,warmupCycles:3,limits:LIMITS,assessment:result,samples,checks,errors:c.errors};
  await p.screenshot({path:path.join(out,'final.png')});
 }catch(e){checks.push({ok:false,name:'穩定性工具執行',note:e.stack});report={schema:1,status:'ERROR',samples,checks,error:e.stack};}
 finally{if(cdp)await cdp.detach().catch(()=>{});if(c)await c.ctx.close()}
 report.seconds=+((performance.now()-t)/1000).toFixed(3);fs.writeFileSync(path.join(out,'stability.json'),JSON.stringify(report,null,2));return report;
}
module.exports={run,cycle};
if(require.main===module){const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();try{const r=await run(b,{seconds:Number(process.env.QA_STABILITY_SECONDS||600),interval:Number(process.env.QA_STABILITY_INTERVAL||10),leak:process.env.QA_INJECT_LEAK==='1',out:process.env.QA_OUT||'test-results/deep/stability'});console.log(JSON.stringify({status:r.status,seconds:r.seconds,cycles:r.cycles,assessment:r.assessment,error:r.error}));process.exitCode=r.status==='PASS'?0:1}finally{await b.close()}})().catch(e=>{console.error(e.stack);process.exitCode=3})}
