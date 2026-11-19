// 鈍擊Canvas視覺：兩種手機尺寸、實際開局、打擊、同步、清理、畫面截圖。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html',OUT=process.env.ZC_QA_OUT||'qa-output/blunt-hit';
const report={checks:[],errors:[],phone:'待主人實機驗收'};
function check(name,ok){report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)}
async function openGame(browser,width,height){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1000});
 const page=await ctx.newPage();
 page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(m.text())});
 await page.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},70)});
 await page.goto(URL);await page.click('#gateNo');await page.click('[data-cat="custom"]');
 await page.fill('#cname','鈍擊驗收');
 await page.click('[data-ctab="tal"]');await page.click('[data-tal="keen"]');
 await page.click('[data-ctab="sk"]');await page.click('[data-csk="aid"]');
 await page.click('[data-m="cdone"]');await page.click('[data-m="solo"]');await page.click('[data-m="go"]');
 await page.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:30000});
 await page.evaluate(()=>{const p=me();p.st={STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0};p.gear=[];p.hand={R:null,L:null};const g=newGear('hammer');p.gear.push(g);equip(p,g.u,'R');window.__encounter=startFight({n:2,types:['infected'],noMut:1,mode:'first'})});
 await page.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
 await page.evaluate(()=>{for(const f of G.fight.foes){f.hp=f.max=100;f.aff=null;f.stun=20}UI.partyCards=1;draw();Math.random=()=>.5;window.__samples=[];const original=renderBluntVfx;renderBluntVfx=fx=>{original(fx);const canvas=document.querySelector('#foes .zc-blunt-fx');if(canvas){const c=canvas.getContext('2d'),v=c&&c.getImageData(0,0,canvas.width,canvas.height).data;__samples.push({at:performance.now()-fx.t,ink:!!v&&v.some((a,i)=>i%4===3&&a>0),id:canvas.parentElement.dataset.id})}};UI.snd=0});
 return {ctx,page};
}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch();
 try{
  for(const [width,height] of [[844,390],[393,690]]){
   const tag=width+'x'+height,{ctx,page:p}=await openGame(browser,width,height);
   check(tag+' 主選單版本',await p.locator('.ver').count()===0||await p.evaluate(()=>ZC_VER.v==='0.38.0'&&ZC_VER.b===92));
   await p.click('#choices [data-ftab="atk"]');
   await p.locator('#choices [data-fa="atk"]').first().click();
   await p.locator('#choices [data-tgt]').first().click();
   await p.waitForFunction(()=>BLUNT_VFX.active!=null);
   const started=await p.evaluate(()=>BLUNT_VFX.active.t);
   await p.waitForTimeout(180);await p.evaluate(()=>draw());
   check(tag+' 重繪仍在原命中目標上',await p.evaluate(t=>BLUNT_VFX.active.t===t&&document.querySelectorAll('#foes .zc-blunt-fx').length===1&&document.querySelector('.zc-blunt-fx').parentElement.dataset.id==='0',started));
   await p.waitForTimeout(140);await p.screenshot({path:OUT+'/hit-'+tag+'.png'});
   check(tag+' Canvas不攔截觸控且不溢出敵人卡',await p.locator('.zc-blunt-fx').evaluate(c=>getComputedStyle(c).pointerEvents==='none'&&getComputedStyle(c.parentElement).overflow==='hidden'&&Math.abs(c.clientWidth-c.parentElement.clientWidth)<2));
   await p.waitForFunction(()=>!BLUNT_VFX.active&&!busy&&!G.busy,null,{timeout:30000});
   const result=await p.evaluate(()=>({hp:G.fight.foes[0].hp,dur:me().gear.find(x=>x.id==='hammer').dur,samples:__samples,clean:!document.querySelector('.zc-blunt-fx')&&![...document.querySelectorAll('#foes .foe')].some(c=>c.classList.contains('zc-blunt-react')||['x','y','px','tilt'].some(k=>c.style.getPropertyValue('--zc-blunt-'+k))),saved:JSON.stringify(snap()).includes('zc-blunt')}));
   check(tag+' 鈍擊真的扣血並耗損原本耐久',result.hp<100&&result.dur===27);
   check(tag+' 命中後確實畫出衝擊環且只打到單一敵人',result.samples.some(x=>x.at>=335&&x.at<755&&x.ink)&&result.samples.every(x=>x.id==='0'));
   check(tag+' 播放完移除畫布、微震與暫存樣式',result.clean&&!result.saved);
   check(tag+' 戰鬥選項完整顯示',await p.locator('#choices button').evaluateAll(bs=>bs.slice(0,3).every(b=>{const r=b.getBoundingClientRect(),v=document.querySelector('#stage').getBoundingClientRect();return r.left>=v.left-1&&r.right<=v.right+1&&r.top>=v.top-1&&r.bottom<=v.bottom+1})));
   await p.evaluate(()=>{ROLE='client';const state=snap();state.fight.foes[0].hp=50;window.__remoteState=state;enqueue({t:'blunt',seq:100,d:{id:0,state}})});
   await p.waitForFunction(()=>BLUNT_VFX.active!=null);
   check(tag+' 隊友端命中前保留原血量',await p.evaluate(()=>G.fight.foes[0].hp>50));
   await p.waitForFunction(()=>!qRun&&!BLUNT_VFX.active,null,{timeout:30000});
   check(tag+' 隊友端命中後正確同步',await p.evaluate(()=>G.fight.foes[0].hp===50));
   await p.emulateMedia({reducedMotion:'reduce'});
   await p.evaluate(()=>{window.__reduced=playBluntHit({id:0,state:snap()},true,++SLASH_VFX.stateSeq+1)});
   await p.waitForFunction(()=>BLUNT_VFX.active!=null);
   check(tag+' 減少動態模式仍有靜態衝擊波',await p.locator('.zc-blunt-fx').count()===1&&await p.locator('.zc-blunt-react').count()===0);
   await p.evaluate(()=>__reduced);
   await p.evaluate(()=>{window.__leaving=playBluntHit({id:0,state:snap()},true,++SLASH_VFX.stateSeq+1)});
   await p.waitForFunction(()=>BLUNT_VFX.active!=null);
   await p.evaluate(()=>{G.fight=null;G.phase='node';draw()});await p.evaluate(()=>__leaving);
   check(tag+' 離開戰場不恢復舊狀態',await p.evaluate(()=>!G.fight&&!document.querySelector('.zc-blunt-fx')));
   await ctx.close();
  }
  check('沒有程式與主控台錯誤',report.errors.length===0);
 }finally{fs.writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
