let QA_BROWSER;
const {setupContext,finish}=require('./harness.cjs');
const {chromium}=require('playwright');const {GOD}=require('../helpers/godmode.cjs');
const N=+(process.argv[2]||2);const CD=process.argv[3]||'off';const LIM=+(process.env.LIM||420000);
(async()=>{const b=QA_BROWSER=await chromium.launch();const ctx=await b.newContext({viewport:{width:844,height:390}});
await setupContext(ctx);const errs=[];const pages=[];await ctx.addInitScript(()=>{setInterval(()=>{const b=document.querySelector('#qte .qbx.now:not(.done)');if(b&&Math.random()<.25)b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const k=document.querySelector('#qcode [data-k="no"]');if(k)k.click()},100)});
for(let i=0;i<N;i++){const p=await ctx.newPage();p.on('pageerror',e=>errs.push(i+':'+(e.stack||e.message)));const rec=require('../helpers/browser-errors.cjs').watch(p,'http://mp.invalid');p.__qaErrors=rec;pages.push(p)}
await pages[0].goto('http://mp.invalid/index.html?pid=h1');
await pages[0].evaluate(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});
for(let i=0;i<N;i++){await pages[i].goto('http://mp.invalid/index.html?pid=pp'+i);await pages[i].click('#gateNo')}
const H=pages[0];await H.waitForTimeout(300);
await H.click('[data-cat="story"]');await H.click('[data-rsel="maggie"]');await H.click('[data-m="rpick"]');await H.click('[data-m="cdone"]');await H.click('[data-m="host"]');await H.waitForSelector('[data-m="start"]',{timeout:10000});
const code=await H.evaluate(()=>NET.code);
for(let i=1;i<N;i++){const p=pages[i];if(i===1){await p.click('[data-cat="story"]');await p.click('[data-rsel="liao"]');await p.click('[data-m="rpick"]')}else{await p.click('[data-cat="custom"]');await p.fill('#cname','隊友'+i);await p.evaluate(()=>{CB.st={STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0};CB.tal='keen';CB.sk='aid';showCreate()})}await p.click('[data-m="cdone"]');await p.click('[data-m="join"]');for(const ch of code)await p.click(`[data-key="${ch}"]`);await p.click('[data-m="dojoin"]');
  await p.waitForSelector('[data-m="leave"]',{timeout:10000});await p.click('[data-m="rdy"]')}
await H.waitForTimeout(800);
await H.click('[data-m="start"]');if(process.env.GODM){await H.waitForFunction(()=>window.__G()&&window.__G().phase==='node',null,{timeout:30000});await H.evaluate(GOD)}
const t0=Date.now();let over=null;let k=0;let maxG=0,fights=0,lastPh='',nodes=new Set(),stuck=0,lastSig='',maxStuck=0;
while(Date.now()-t0<LIM){
  for(const p of pages){await p.evaluate(()=>{const d=document.querySelector('#dice');if(d&&!d.hidden)d.click();const c=document.querySelector('#lvcard');if(c&&!c.hidden)c.click();
    if(Math.random()<.5)return;const bs=[...document.querySelectorAll('#choices button:not([disabled])')].filter(x=>!x.hasAttribute('data-cancel')&&!x.dataset.open&&!x.hasAttribute('data-cdgo')&&!x.hasAttribute('data-menu'));
    const ft=document.querySelector('#choices [data-ftab="atk"]');if(ft&&Math.random()<.7){ft.click();return}const pref=bs.filter(x=>x.dataset.fa==='atk'||x.dataset.tgt!=null||x.dataset.ch!=null||x.dataset.rv!=null||x.dataset.fa==='revive');const pool=pref.length?pref:bs;if(pool.length)pool[Math.floor(Math.random()*pool.length)].click()}).catch(e=>errs.push('eval:'+e.message))}
  const st=await H.evaluate(()=>{const g=window.__G();return g&&{over:g.over,node:g.node,phase:g.phase,sz:JSON.stringify(g).length,day:typeof dayN==='function'?dayN():0,log:LOG.length,clk:g.clock}});
  if(st){maxG=Math.max(maxG,st.sz);if(st.phase==='fight'&&lastPh!=='fight')fights++;lastPh=st.phase;nodes.add(st.node);const sig=st.node+st.phase+st.clk+st.log;if(sig===lastSig){stuck++;maxStuck=Math.max(maxStuck,stuck)}else stuck=0;lastSig=sig}
  if(st&&st.over){over=st;break}
  if(k++%100===0)console.error('t',Math.round((Date.now()-t0)/1000),JSON.stringify(st&&{n:st.node,ph:st.phase,day:st.day}));
  await H.waitForTimeout(150);
}
await H.waitForTimeout(1500);
for(const p of pages)errs.push(...p.__qaErrors.required.map(x=>x.kind+':'+x.msg));
const sync=[];for(const p of pages)sync.push(await p.evaluate(()=>{const g=window.__G();return g&&{node:g.node,phase:g.phase,over:!!g.over,np:g.players.length,maxEmit:window.__maxEmit,log:LOG.length,t:typeof timeTxt==='function'?timeTxt():'',clk:g.clock,hp:g.players.map(p=>p.hp).join('/')}}));
for(let i=0;i<N;i++)await pages[i].screenshot({path:require('node:path').join(process.env.QA_OUT||'test-results','mp-'+i+'.png')});
console.log(JSON.stringify({over:over&&{node:over.node,day:over.day},secs:Math.round((Date.now()-t0)/1000),maxG,fights,nodes:nodes.size,maxStuck,sync,errs:errs.slice(0,15),nerr:errs.length},null,1));await b.close();process.exitCode=errs.length?1:0})().catch(async e=>{console.error(e.stack);if(QA_BROWSER)await QA_BROWSER.close();process.exitCode=3});
