// QA-27：從正式結局入口執行，測試頁設定前置狀態，保留真實結算與選單／開局事件。
const fs=require('node:fs'),path=require('node:path');
const {context,start}=require('./helpers/deep-browser.cjs');
async function run(browser,{out='test-results/deep/endings',fault=false,limit=Infinity,transitions=true}={}){
 fs.mkdirSync(out,{recursive:true});const t=performance.now(),checks=[],cases=[];let planned=null,transitionPlanned=0,toolError=null;const {ctx,page:p,errors}=await context(browser);
 const check=(ok,name,note='')=>{checks.push({ok,name,note});if(!ok)throw Error(name+'：'+note)};
 try{
  await start(p,{gate:true});
  const catalog=await p.evaluate(()=>({endings:Object.entries(END).map(([key,e])=>({key,name:e.n,shards:e.shards,next:e.next||null,final:!!e.final})),fires:Object.keys(FIRE_END).map(key=>{const candidate=Object.entries(N).find(([id,n])=>{const l=LV[n.L];if(!l)return false;return(l.fire||(n.rest?'safe':l.ch===1?'hotel':'street'))===key});return {key,node:candidate&&candidate[0],lv:candidate&&candidate[1].L}})}));
  fs.writeFileSync(path.join(out,'catalog.json'),JSON.stringify(catalog,null,2));transitionPlanned=!fault&&transitions?catalog.endings.filter(e=>e.next).length:0;if(catalog.fires.some(f=>!f.node||!f.lv))throw Error('有燃燒彈結局缺少可用的測試前置狀態');
  const scenarios=[...catalog.endings.filter(e=>!e.next).map(e=>({kind:'ending',key:e.key,shards:e.shards,name:'結局・'+e.name})),{kind:'ending',key:'END_heli',shards:catalog.endings.find(e=>e.key==='END_heli').shards,warn:true,name:'結局・'+catalog.endings.find(e=>e.key==='END_heli').name},
   {kind:'hp',name:'你死了'},{kind:'fight-death',name:'你死了'},{kind:'infection',name:'你死了'},{kind:'mad',name:'你發瘋了'},
   {kind:'mp-death',name:'全員倒下'},{kind:'mp-mad',name:'全員倒下'},...catalog.fires.map(f=>({kind:'fire',...f,name:'葬身火海'}))].slice(0,limit);planned=scenarios.length;
  for(const [i,spec] of scenarios.entries()){
   const c={spec,checks:[],status:'PASS'},before=checks.length;cases.push(c);
   try{
    const result=await p.evaluate(async({spec,fault,i})=>{
     if(spec.kind.startsWith('mp-')||spec.key==='END_evac_split'){newRun([{kind:'maggie',pid:MYPID},{kind:'liao',pid:'qa-other'}],{diff:'normal'},'mp');G.node='A1';G.lv='A';if(spec.key==='END_evac_split')G.players[1].leftBehind=1;G.phase='node';G.busy=0;busy=false;showGame()}
     const old={rid:G.rid,shards:META.shards,runs:META.runs,clears:META.clears};G.__qaPrevious=i+1;G.flags.__qaPrevious=true;G.bank[MYPID]=7;G.levels=1;G.kills=2;G.players[0].kills=2;
     if(fault){ending=async()=>{window.__qaEndFaultHits=(window.__qaEndFaultHits||0)+1;G.phase='busy'}}
     if(spec.kind==='ending'){G.flags.warn=!!spec.warn;await run(()=>ending(spec.key))}
     else if(spec.kind==='fire'){G.node=spec.node;G.lv=spec.lv;await run(fireEnding)}
     else{for(const q of G.players){q.hp=spec.kind==='mp-mad'?q.max:0;if(spec.kind==='mp-mad')q.mad=1}
      const q=G.players[0];if(spec.kind==='infection'){q.hp=q.max;q.inf=100}if(spec.kind==='mad'){q.hp=q.max;q.fe=100}
      if(spec.kind==='fight-death')G.fight={foes:[],order:[],round:1};await run(deathCheck)}
     await flush();draw();const once=META.shards;draw();draw();
     return {faultHits:window.__qaEndFaultHits||0,old,over:G.over,phase:G.phase,once,twice:META.shards,runs:META.runs,clears:META.clears,save:localStorage.getItem('zc7-save'),title:$('#chTitle').innerText,text:$('#choices').innerText,log:$('#log').innerText};
    },{spec,fault:fault&&i===0,i});
    c.result=result;
    check(!!result.over&&result.phase==='over','E01 '+spec.kind+' '+(spec.key||''),'結局已建立');
    check(result.title===spec.name&&result.text.includes('獲得碎片'),'E02 結局畫面與結算文字',result.text.slice(0,180));
    const expected=result.over.sh&&result.over.sh[await p.evaluate(()=>MYPID)];
    check(expected===(spec.kind==='ending'?spec.shards+4+7:14)&&result.once-result.old.shards===expected&&result.twice===result.once,'E03 碎片結算一次',JSON.stringify({expected,old:result.old.shards,once:result.once,twice:result.twice}));
    check(result.runs===result.old.runs+1&&result.clears===result.old.clears+(result.over.dead?0:1),'E04 遊玩與通關次數');
    check(result.save===null,'E05 結局刪除單人存檔');
    if(spec.kind==='fire'){const text=await p.evaluate(key=>FIRE_END[key],spec.key);check(result.over.text===text&&result.log.includes(text.slice(0,14)),'E06 燃燒彈地點文字',spec.key)}
    if(spec.warn)check(result.log.includes('第一團火'),'E07 直升機警報分支文字');
    await p.screenshot({path:path.join(out,'ending-'+i+'.png')});
    await p.click('#choices [data-menu]');await p.waitForFunction(()=>G===null&&SCR==='menu');
    check(await p.evaluate(()=>LOG.length===0&&RQ.length===0&&PEND===null&&FTAB===null),'E08 回主選單清除局內狀態');
    await start(p);
    check(await p.evaluate(old=>G.rid!==old&&G.phase==='node'&&!G.over&&!G.fight&&!G.__qaPrevious&&!G.flags.__qaPrevious&&G.node==='A1'&&G.clock===0&&G.players.every(q=>!q.dead&&!q.mad&&q.hp===q.max),result.old.rid),'E09 新局沒有上一局狀態');
   }catch(e){c.status='FAIL';c.error=e.stack;await p.screenshot({path:path.join(out,'failure-'+i+'.png')}).catch(()=>{});try{await p.evaluate(()=>quitGame());await start(p)}catch(recovery){c.recoveryError=recovery.stack;for(const next of scenarios.slice(i+1))cases.push({spec:next,status:'NOT_RUN',reason:'前一情境無法復原'});break}}
   finally{c.checks=checks.slice(before)}
  }
  if(!fault&&transitions){
   for(const e of catalog.endings.filter(e=>e.next)){
    await p.evaluate(()=>quitGame());await start(p);
    const before=await p.evaluate(()=>({rid:G.rid,shards:META.shards}));
    await p.evaluate(async key=>{await run(()=>ending(key))},e.key);
    const ok=await p.evaluate(({e,before})=>!G.over&&G.node===e.next&&G.rid===before.rid&&META.shards===before.shards,{e,before});checks.push({ok,name:'E10 地點轉場 '+e.key,note:e.next});
   }
  }
 }catch(e){toolError=e.stack;checks.push({ok:false,name:'結局工具執行',note:e.stack})}
 finally{await ctx.close()}
 checks.push({ok:errors.required.length===0,name:'E11 結局流程無必要資源／JS 錯誤',note:JSON.stringify(errors.required)});
 const report={schema:1,status:toolError?'ERROR':checks.length&&!checks.some(c=>!c.ok)&&cases.every(c=>c.status==='PASS')?'PASS':'FAIL',seconds:+((performance.now()-t)/1000).toFixed(3),coverage:{terminalPlanned:planned,terminalCompleted:cases.filter(c=>c.status!=='NOT_RUN').length,terminalNotRun:cases.filter(c=>c.status==='NOT_RUN').length,transitionPlanned,transitionCompleted:checks.filter(c=>c.name.startsWith('E10 ')).length},cases,checks,errors};fs.writeFileSync(path.join(out,'endings.json'),JSON.stringify(report,null,2));return report;
}
module.exports={run};
if(require.main===module){const {chromium}=require('playwright');(async()=>{const b=await chromium.launch();try{const r=await run(b,{out:process.env.QA_OUT||'test-results/deep/endings'});console.log(r.status,r.cases.length,r.seconds,r.checks.filter(c=>!c.ok));process.exitCode=r.status==='PASS'?0:1}finally{await b.close()}})().catch(e=>{console.error(e.stack);process.exitCode=3})}
