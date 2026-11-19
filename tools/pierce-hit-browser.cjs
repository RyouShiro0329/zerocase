// 實際Chromium三尺寸穿刺驗收；正式多人網路與Android/iOS實機另行驗收。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html',OUT=process.env.ZC_QA_OUT||'qa-output/pierce-hit';
const report={checks:[],errors:[],phone:'待主人實機驗收',network:'未測試：正式多人網路實連；本次驗證接收佇列和過期序號'};
function check(name,okay){report.checks.push({name,result:okay?'通過':'失敗'});assert.ok(okay,name)}
async function openGame(browser,width,height,broken=false){
 const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1000});
 if(broken)await ctx.route('**/fx/pierce-12.webp',r=>r.abort());
 const page=await ctx.newPage();page.on('pageerror',e=>report.errors.push(e.message));
 page.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(m.text())});
 await page.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},70)});
 await page.goto(URL);await page.click('#gateNo');await page.click('[data-cat="custom"]');await page.fill('#cname','穿刺驗收');await page.click('[data-ctab="tal"]');await page.click('[data-tal="keen"]');await page.click('[data-ctab="sk"]');await page.click('[data-csk="aid"]');await page.click('[data-m="cdone"]');await page.click('[data-m="solo"]');await page.click('[data-m="go"]');
 await page.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:30000});
 await page.evaluate(()=>{const p=me();p.st={STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0};p.gear=[];p.hand={R:null,L:null};const g=newGear('icepick');p.gear.push(g);equip(p,g.u,'R');window.__encounter=startFight({n:2,types:['infected'],noMut:1,mode:'first'})});
 await page.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
 await page.evaluate(()=>{for(const f of G.fight.foes){f.hp=f.max=100;f.aff=null;f.stun=20}r2=()=>({a:15,b:15,s:15});UI.partyCards=1;UI.snd=0;draw();window.__frames=[];const render=renderPierceVfx;renderPierceVfx=fx=>{render(fx);const canvas=document.querySelector('#foes .zc-pierce-fx');if(canvas){const c=canvas.getContext('2d'),data=c&&c.getImageData(0,0,canvas.width,canvas.height).data;__frames.push({at:performance.now()-fx.t,ink:!!data&&data.some((v,i)=>i%4===3&&v>0),target:canvas.parentElement.dataset.id})}};});
 return {ctx,page};
}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch();
 try{
  for(const [width,height] of [[393,690],[844,390],[1280,720]]){
   const tag=width+'x'+height,{ctx,page:p}=await openGame(browser,width,height);
   check(tag+' 正確載入4×3透明穿刺圖片',await p.evaluate(()=>PIERCE_VFX.image.complete&&PIERCE_VFX.image.naturalWidth===1056&&PIERCE_VFX.image.naturalHeight===1350));
   await p.click('#choices [data-ftab="atk"]');await p.locator('#choices [data-fa="atk"]').first().click();await p.locator('#choices [data-tgt]').first().click();
   await p.waitForFunction(()=>!!PIERCE_VFX.active);const started=await p.evaluate(()=>PIERCE_VFX.active.t);
   await p.waitForTimeout(175);await p.evaluate(()=>draw());await p.waitForTimeout(145);
   await p.screenshot({path:OUT+'/pierce-impact-'+tag+'.png'});
   check(tag+' 重畫後仍在原目標卡播放不重置時間',await p.evaluate(t=>PIERCE_VFX.active&&PIERCE_VFX.active.t===t&&document.querySelectorAll('#foes .zc-pierce-fx').length===1&&document.querySelector('.zc-pierce-fx').parentElement.dataset.id==='0',started));
   check(tag+' 特效畫布限於敵人卡且不攔截點擊',await p.locator('.zc-pierce-fx').evaluate(c=>getComputedStyle(c).pointerEvents==='none'&&Math.abs(c.clientWidth-c.parentElement.clientWidth)<2));
   check(tag+' 特效像素只在立繪區不遮擋名稱與生命',await p.locator('.zc-pierce-fx').evaluate(c=>{const data=c.getContext('2d').getImageData(0,0,c.width,c.height).data,pw=c.parentElement.querySelector('.fpic').clientWidth,scale=c.width/c.clientWidth;let ink=0;for(let y=0;y<c.height;y++)for(let x=0;x<c.width;x++)if(data[(y*c.width+x)*4+3]){ink++;if(x/scale>pw)return false}return ink>0}));
   await p.waitForFunction(()=>!PIERCE_VFX.active&&!busy&&!G.busy,null,{timeout:30000});
   check(tag+' 12格正常繪製及消散',await p.evaluate(()=>__frames.some(x=>x.at>=335&&x.at<410&&x.ink)&&__frames.every(x=>x.target==='0')&&!document.querySelector('.zc-pierce-fx')));
   check(tag+' 攻擊結果有效且沒有未定義文字',await p.evaluate(()=>G.fight.foes[0].hp<100&&!/undefined|NaN|\[object/.test(document.querySelector('#app').textContent)));
   check(tag+' 本機特效不進入存檔',await p.evaluate(()=>!JSON.stringify(snap()).includes('PIERCE_VFX')));
   check(tag+' 按鈕沒有超出遊戲舞台',await p.locator('#choices button').evaluateAll(bs=>bs.slice(0,3).every(b=>{const r=b.getBoundingClientRect(),s=document.querySelector('#stage').getBoundingClientRect();return r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1})));
   // 模擬隊友收到穿刺事件：動畫主命中格前不提前變更生命。
   await p.evaluate(()=>{ROLE='client';const state=snap();state.fight.foes[0].hp=90;window.__remote=state;enqueue({t:'pierce',seq:300,d:{id:0,melee:true,state}})});
   await p.waitForFunction(()=>!!PIERCE_VFX.active);
   await p.waitForTimeout(120);
   check(tag+' 隊友端主命中格前尚未更新生命',await p.evaluate(()=>G.fight.foes[0].hp!==90));
   await p.waitForFunction(()=>!PIERCE_VFX.active&&!qRun,null,{timeout:30000});
   check(tag+' 隊友端命中後更新且清理畫面',await p.evaluate(()=>G.fight.foes[0].hp===90&&!document.querySelector('.zc-pierce-fx')));
   // 減少動態下仍顯示靜態命中，不產生動畫位移。
   await p.emulateMedia({reducedMotion:'reduce'});
   await p.evaluate(()=>{window.__reduce=playPierceHit({id:0,melee:false,state:snap()},true,SLASH_VFX.stateSeq+1)});
   await p.waitForFunction(()=>!!PIERCE_VFX.active);
   check(tag+' 減少動態模式保留靜態特效',await p.locator('.zc-pierce-fx').count()===1);
   await p.evaluate(()=>__reduce);
   const miss=await p.evaluate(async()=>{ROLE='solo';const f=G.fight.foes[0],hp=f.hp,n=__frames.length;r2=()=>({a:2,b:2,s:2});await attack(me(),'R',null,0);return f.hp===hp&&__frames.length===n&&!PIERCE_VFX.active});
   check(tag+' 真實落空不播放也不扣生命',miss);
   const double=await p.evaluate(async()=>{const p=me();p.hand={R:null,L:null};const w=newGear('compbow');p.gear.push(w);equip(p,w.u,'R');p.items.arrow=5;for(const f of G.fight.foes){f.hp=f.max=100;f.dead=0}r2=()=>({a:15,b:15,s:15});let count=0;const old=pierceAttack;pierceAttack=async(...args)=>{count++;return old(...args)};try{await attack(p,'R','double2',0)}finally{pierceAttack=old}return count===2&&p.items.arrow===3&&G.fight.foes[0].hp<100&&!PIERCE_VFX.active});
   check(tag+' 真實弓二連射播放兩次且回合不阻斷',double);
   const through=await p.evaluate(async()=>{const p=me();p.hand={R:null,L:null};const w=newGear('crossbow');p.gear.push(w);equip(p,w.u,'R');w.cocked=1;p.items.bolt=3;for(const f of G.fight.foes){f.hp=f.max=100;f.dead=0}const ids=[],old=pierceAttack;pierceAttack=async(...args)=>{ids.push(args[0].id);return old(...args)};const n=__frames.length;try{await attack(p,'R','pierce',0)}finally{pierceAttack=old}return ids.join(',')==='0,1'&&__frames.slice(n).some(f=>f.target==='1'&&f.ink)&&G.fight.foes.every(f=>f.hp<100)&&p.items.bolt===2&&!w.cocked&&!PIERCE_VFX.active});
   check(tag+' 真實十字弓貫穿第二目標也有畫面',through);
   const lethal=await p.evaluate(async()=>{const p=me();p.hand={R:null,L:null};const w=newGear('icepick');p.gear.push(w);equip(p,w.u,'R');G.fight.foes[0].hp=1;const kills=G.kills,n=__frames.length;await attack(p,'R',null,0);draw();return G.fight.foes[0].dead===1&&G.kills===kills+1&&__frames.slice(n).some(f=>f.ink)&&!PIERCE_VFX.active&&!document.querySelector('.zc-pierce-fx')});
   check(tag+' 真實致死有動畫且只結算一次',lethal);
   check(tag+' 完整攻擊後文字沒有undefined或NaN',await p.evaluate(()=>!/undefined|NaN|\[object/.test(document.querySelector('#app').textContent)));
   await p.evaluate(()=>{const old=snap();G.fight=null;G.phase='node';draw();window.__old=old});
   check(tag+' 結束戰鬥沒有殘留特效',await p.evaluate(()=>!document.querySelector('.zc-pierce-fx')));
   await ctx.close();
  }
  const {ctx,page:p}=await openGame(browser,844,390,true);
  await p.evaluate(()=>{window.__fallback=playPierceHit({id:0,melee:true,state:snap()},true,1001)});await p.evaluate(()=>__fallback);
  check('素材載入失敗能回退且不阻斷戰鬥',await p.evaluate(()=>!!G.fight&&!PIERCE_VFX.active&&!document.querySelector('.zc-pierce-fx')));await ctx.close();
  check('沒有程式或主控台錯誤',report.errors.length===0);
 }finally{fs.writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
