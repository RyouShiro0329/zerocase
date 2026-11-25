// QTE 固定情境瀏覽器測試（Claude 2026-11-25，QA 升級 PR-D：QA-14）
// 冒煙、長路線、生存路線只會「格子一出來就自動點對」，點錯、太慢、鍵盤、觸控、版面都沒有測到。
// 這支在真的瀏覽器裡叫遊戲自己的 qte()，照寫好的劇本輸入（真的滑鼠點擊、鍵盤、觸控），每個情境的結果都是固定的：
//   Q01 照順序點完 → 成功、播閃開聲、QTE 畫面收掉
//   Q02 完全不點 → 失敗；從第一格出現到判失敗的時間＝每格時間×格數（總時限）；不播閃開聲
//   Q03 點到格子以外的地方 → 立刻失敗
//   Q04 格子出來前先按鍵、先點畫面 → 不算數也不算錯（描述先出現、停 0.5～1 秒才出格子），之後照順序點完照樣成功
//   Q05 鍵盤 WASD 照格子上的字母按 → 成功；Q06 按錯字母 → 失敗
//   Q07 按住不放（瀏覽器的重複按鍵）只算一下；Q08 先按 Shift 這類修飾鍵不算錯
//   Q09 設定成方向鍵：方向鍵成功、格子上畫箭頭；這時按 WASD 算錯
//   Q10 總時限從第一格出現開始算、成功也不重置：每格都在 527 毫秒內點、但總共超過 → 失敗；整組在時限內 → 成功
//   Q11 觸控裝置（手機）：格子上沒有鍵盤字母、用手指點 → 成功
//   Q12 版面（三種尺寸）：每一格都在畫面內、不壓到上面的描述和倒數條、字沒有被裁掉
//   Q13 戰鬥：感染者「撲倒」（瞬間 QTE）：敘述在格子出現前就已經在紀錄裡；躲開 → 不扣血、播閃開聲；
//       沒躲開 → 扣血、播這一招標好的受傷聲（thud）；結束後 QTE 畫面收掉、還在戰鬥裡
//   Q14 戰鬥：獵食者「飛撲」躲開 → 不扣血
// 種子沿用 tests/helpers/driver.cjs（QA_SEED）：格子的位置與字（qteSeq）由測試頁的亂數決定，每個情境的格子序列記在細節檔。
// 只在測試頁注入記錄用的包裝（sfx、out），遊戲本體不動。跑法：node tests/qte-browser.cjs（需要 http.server 8768 或 QA_SERVE=route）
const {chromium}=require('playwright');const BE=require('./helpers/browser-errors.cjs');const DR=require('./helpers/driver.cjs');const fs=require('node:fs');
const ORIGIN=process.env.QA_ORIGIN||'http://localhost:8768',URL=ORIGIN+'/index.html';
const SEED=DR.seedOf();const detail={seed:SEED,checks:[],scenarios:[]};console.log(`種子 ${SEED}（重現：QA_SEED=${SEED}）`);
const writeDetail=()=>{if(process.env.QA_DETAIL)fs.mkdirSync(require('node:path').dirname(process.env.QA_DETAIL),{recursive:true});detail.failed=detail.checks.filter(c=>!c.ok).map(c=>c.name+(c.note?'：'+c.note:''));if(process.env.QA_DETAIL)fs.writeFileSync(process.env.QA_DETAIL,JSON.stringify(detail,null,1))};
const VIEWS=[[844,390,'手機橫拿'],[1280,720,'電腦'],[393,690,'手機窄橫向（Claude App 轉向）']];
// 測試頁：記錄音效名稱、QTE 格子出現的時間
const REC=()=>{if(window.__qr)return;const R=window.__qr={s:[],box:[]};const o=sfx;sfx=function(k){R.s.push(k);return o.apply(this,arguments)};
 new MutationObserver(()=>{const b=document.querySelector('#qte .qbx.now:not(.done)');if(b&&!b.__seen){b.__seen=1;R.box.push({i:+b.dataset.i,t:performance.now()})}const q=document.querySelector('#qte');if(q&&!q.__t0){q.__t0=1;R.qin=performance.now()}if(q&&q.classList.contains('bad')&&!R.bad)R.bad=performance.now()}).observe(document.body,{subtree:true,childList:true,attributes:true,attributeFilter:['class']})};
(async()=>{const b=await chromium.launch();let fail=0;
 const say=(ok,n,x)=>{if(!ok)fail++;detail.checks.push({ok,name:n,note:x||''});console.log((ok?'通過':'失敗')+'　'+n+(x?'　'+x:''))};
 const open=async(w,h,o={})=>{const ctx=await b.newContext({viewport:{width:w,height:h},...o});await ctx.addInitScript(DR.seedScript,SEED);await BE.serve(ctx,ORIGIN,__dirname+'/..');
  const p=await ctx.newPage();const rec=BE.watch(p,ORIGIN);await p.goto(URL);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});
  await p.reload();const tap=o.hasTouch?s=>p.tap(s):s=>p.click(s);
  await tap('#gateNo');await tap('[data-cat="story"]');await tap('[data-rsel="maggie"]');await tap('[data-m="rpick"]');await tap('[data-m="cdone"]');await tap('[data-m="solo"]');
  const d=await p.$('[data-dif="hard"]');if(d)await tap('[data-dif="hard"]');await tap('[data-m="go"]');
  await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node'&&!busy&&!G.busy,null,{timeout:30000});await p.evaluate(REC);return {ctx,p,rec}};
 // 跑一次 QTE：start 開始、input 照劇本輸入；回傳結果、時間、格子序列、播了哪些音效
 const runQ=async(p,o,input)=>{await p.evaluate(o=>{const R=__qr;R.s=[];R.box=[];R.bad=0;R.qin=0;window.__qq=null;const t0=performance.now();
   qte(me(),{t:'QA 固定情境：'+o.name,n:o.n,w:o.w}).then(v=>{__qq={v,t0,end:performance.now()}})},o);
  await p.waitForSelector('#qte',{timeout:5000});let err=null;try{await input()}catch(e){err=e.message.split('\n')[0]}
  await p.waitForFunction(()=>window.__qq,null,{timeout:12000}).catch(()=>{});
  await p.waitForTimeout(80);
  const r=await p.evaluate(()=>({res:window.__qq,box:__qr.box,bad:__qr.bad,qin:__qr.qin,s:__qr.s.slice(),left:!!document.querySelector('#qte')}));
  r.err=err;r.v=r.res?r.res.v:null;r.first=r.box.length?r.box[0].t:null;r.failMs=r.bad&&r.first?Math.round(r.bad-r.first):null;r.delay=r.first&&r.qin?Math.round(r.first-r.qin):null;
  detail.scenarios.push({name:o.name,n:o.n,v:r.v,failMs:r.failMs,delay:r.delay,boxes:r.box.length,sounds:r.s,err});return r};
 // 輸入工具
 const now=p=>p.waitForSelector('#qte .qbx.now:not(.done)',{timeout:3000});
 const clickNow=async p=>{const h=await now(p);const bb=await h.boundingBox();await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2)};
 const keyNow=async(p,map)=>{const h=await now(p);const z=await h.evaluate(e=>(e.querySelector('kbd')||{}).dataset.z);await p.keyboard.press(map?map[z]:'Key'+z);return z};
 const all=async(p,n,f,gap=60)=>{for(let i=0;i<n;i++){await f();await p.waitForTimeout(gap)}};
 const ARROW={W:'ArrowUp',A:'ArrowLeft',S:'ArrowDown',D:'ArrowRight'};
 try{
  const {ctx,p,rec}=await open(844,390);
  const per=await p.evaluate(()=>qtePer(me()));detail.per=per;
  let r=await runQ(p,{name:'照順序點完',n:3},()=>all(p,3,()=>clickNow(p)));
  say(r.v===true&&r.s.includes('whoosh')&&r.s.filter(x=>x==='click').length===3&&!r.left,'Q01 照順序點完：成功、每格一聲點擊、播閃開聲、QTE 畫面收掉',`結果 ${r.v}、音效 ${r.s.join(',')}${r.err?'、'+r.err:''}`);
  r=await runQ(p,{name:'完全不點',n:3},async()=>{await now(p)});
  const tot=per*3;
  say(r.v===false&&r.failMs!=null&&Math.abs(r.failMs-tot)<=250&&!r.s.includes('whoosh')&&!r.left,`Q02 完全不點：失敗，第一格出現後 ${tot} 毫秒（每格 ${per}×3）判失敗、不播閃開聲`,`結果 ${r.v}、判失敗在 ${r.failMs} 毫秒、音效 ${r.s.join(',')||'（無）'}`);
  r=await runQ(p,{name:'點到格子外面',n:3},async()=>{const h=await now(p);const bb=await h.boundingBox();const vp=p.viewportSize();
   const x=bb.x+bb.width/2<vp.width/2?vp.width*.85:vp.width*.15;const t=Date.now();await p.mouse.click(x,vp.height*.6);detail.q03={clickAt:t}});
  say(r.v===false&&r.failMs!=null&&r.failMs<tot-200,'Q03 點到格子以外的地方：立刻失敗（不用等時間到）',`結果 ${r.v}、第一格出現後 ${r.failMs} 毫秒失敗`);
  r=await runQ(p,{name:'格子出來前先輸入',n:3},async()=>{await p.waitForTimeout(150);const vp=p.viewportSize();await p.keyboard.press('KeyA');await p.keyboard.press('KeyD');await p.mouse.click(vp.width/2,vp.height/2);await all(p,3,()=>clickNow(p))});
  say(r.v===true&&r.delay!=null&&r.delay>=450&&r.delay<=1250,'Q04 格子出來前先按鍵、先點：不算數也不算錯；描述先出現，停 0.5～1 秒才出格子，之後照順序點完成功',`結果 ${r.v}、描述到第一格 ${r.delay} 毫秒`);
  r=await runQ(p,{name:'鍵盤 WASD',n:4},()=>all(p,4,()=>keyNow(p)));
  say(r.v===true&&r.s.includes('whoosh'),'Q05 鍵盤照格子上的字母（WASD）按：成功',`結果 ${r.v}${r.err?'、'+r.err:''}`);
  r=await runQ(p,{name:'鍵盤按錯',n:3},async()=>{const h=await now(p);const z=await h.evaluate(e=>e.querySelector('kbd').dataset.z);const wrong='WASD'.split('').find(k=>k!==z);await p.keyboard.press('Key'+wrong)});
  say(r.v===false&&r.failMs!=null&&r.failMs<tot-200,'Q06 鍵盤按錯字母：立刻失敗',`結果 ${r.v}、第一格出現後 ${r.failMs} 毫秒失敗`);
  r=await runQ(p,{name:'按住不放',n:3},async()=>{const h=await now(p);const z=await h.evaluate(e=>e.querySelector('kbd').dataset.z);
   await p.keyboard.down('Key'+z);await p.waitForTimeout(40);await p.keyboard.down('Key'+z);await p.keyboard.down('Key'+z);/* 第二、三下是重複按鍵（repeat） */
   detail.q07={after:await p.evaluate(()=>{const b=document.querySelector('#qte .qbx.now:not(.done)');return b?+b.dataset.i:null})};await p.keyboard.up('Key'+z);await all(p,2,()=>keyNow(p))});
  say(r.v===true&&detail.q07&&detail.q07.after===1,'Q07 按住不放：重複按鍵不算第二下（還停在第 2 格）、之後照常按完成功',`結果 ${r.v}、按住後現在是第 ${detail.q07&&detail.q07.after!=null?detail.q07.after+1:'?'} 格`);
  r=await runQ(p,{name:'修飾鍵',n:3},async()=>{await now(p);await p.keyboard.press('Shift');await p.keyboard.press('Control');await all(p,3,()=>keyNow(p))});
  say(r.v===true,'Q08 先按 Shift、Ctrl 這類修飾鍵：不算錯，之後按對成功',`結果 ${r.v}`);
  await p.evaluate(()=>{UI.qkey='arrow'});
  let arrowSvg=false;r=await runQ(p,{name:'方向鍵',n:4},async()=>{arrowSvg=await (await now(p)).evaluate(e=>!!e.querySelector('kbd svg.qa'));await all(p,4,()=>keyNow(p,ARROW))});
  const r9b=await runQ(p,{name:'方向鍵模式按 WASD',n:3},async()=>{const z=await (await now(p)).evaluate(e=>e.querySelector('kbd').dataset.z);await p.keyboard.press('Key'+z)});
  await p.evaluate(()=>{UI.qkey='wasd'});
  say(r.v===true&&arrowSvg&&r9b.v===false,'Q09 設定成方向鍵：方向鍵成功、格子上畫箭頭；這時按 WASD 算錯',`方向鍵 ${r.v}、箭頭 ${arrowSvg}、按 WASD ${r9b.v}`);
  const slow=Math.round(per*1.45),fast=Math.round(per*.5);
  r=await runQ(p,{name:'每格都慢一點',n:4},async()=>{for(let i=0;i<4;i++){const h=await now(p).catch(()=>null);if(!h)break;await p.waitForTimeout(i?slow:0);if(!(await p.$('#qte .qbx.now:not(.done)')))break;await clickNow(p).catch(()=>{})}});
  const r10b=await runQ(p,{name:'整組在時限內',n:4},async()=>{for(let i=0;i<4;i++){await now(p);await p.waitForTimeout(i?fast:0);await clickNow(p)}});
  say(r.v===false&&r10b.v===true,`Q10 總時限從第一格開始算、成功不重置：每格間隔 ${slow} 毫秒（4 格共超過 ${per*4}）→ 失敗；間隔 ${fast} 毫秒 → 成功`,`慢 ${r.v}（第一格後 ${r.failMs} 毫秒失敗）、快 ${r10b.v}`);
  say(rec.required.length===0,'QTE 情境：沒有程式錯誤、必要檔案都載入成功',BE.brief(rec));
  // Q13、Q14 戰鬥
  const fight=async(type,name,input)=>{await p.evaluate(()=>{for(const q of G.players){q.hp=q.max;q.fe=0;q.inf=0;q.held=0;q.prone=0}G.alarm=0});
   const st=await p.evaluate(ty=>{if(G.fight)return 'busy';void startFight({n:1,types:[ty],noMut:1,noElite:1});return 'ok'},type);
   await p.waitForFunction(()=>G.fight&&!busy&&!G.busy&&document.querySelector('#choices [data-fa],#choices [data-ftab]'),null,{timeout:30000});
   await p.evaluate(({type,name})=>{const R=__qr;R.s=[];R.box=[];R.bad=0;window.__fh=null;const f=G.fight.foes[0];const mv=MOVES[type].find(m=>m.n===name);const t=me();t.hp=t.max;f.cd={};
    const L0=LOG.length;window.__fhL0=L0;foeHit(f,mv,t,1).then(()=>{__fh={h0:t.max,hp:t.hp}},e=>{__fh={err:String(e)}})},{type,name});
   await p.waitForSelector('#qte',{timeout:8000});const cue=await p.evaluate(()=>LOG.slice(window.__fhL0).map(x=>String(x[0]).replace(/<[^>]+>/g,'')).join('｜'));
   await input();await p.waitForFunction(()=>window.__fh,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(150);
   const out=await p.evaluate(()=>({fh:window.__fh,s:__qr.s.slice(),left:!!document.querySelector('#qte'),fight:!!G.fight,over:!!G.over,log:LOG.slice(window.__fhL0).map(x=>String(x[0]).replace(/<[^>]+>/g,'')).slice(0,6)}));
   out.cue=cue;detail.scenarios.push({name:`戰鬥 ${type}・${name}`,...out});return out};
  const endFightNow=async()=>{
   // 打到敵人倒下：敵人生命壓到 1、點攻擊直到戰鬥結束（和無敵模式同一種做法，只用在情境之間收尾）
   for(let i=0;i<60;i++){const k=await p.evaluate(()=>{if(!G.fight)return 'done';for(const f of G.fight.foes)if(!f.dead){f.hp=Math.min(f.hp,1);f.def=0}for(const q of G.players)q.hp=q.max;if(busy)return 'wait';const t=document.querySelector('#choices [data-ftab="atk"]')||document.querySelector('#choices button[data-fa="atk"]:not([disabled])')||document.querySelector('#choices button[data-tgt]');if(t){t.click();return 'click'}return 'wait'});if(k==='done')break;await p.waitForTimeout(250)}
   await p.waitForFunction(()=>!G.fight&&G.phase==='node'&&!busy&&!G.busy,null,{timeout:20000}).catch(()=>{})};
  let F=await fight('infected','撲倒',()=>all(p,4,()=>clickNow(p).catch(()=>{})));
  const cueOk=/猛然撲了上來/.test(F.cue);
  say(F.fh&&!F.fh.err&&F.fh.hp===F.fh.h0&&F.s.includes('whoosh')&&!F.s.includes('thud')&&!F.left&&F.fight&&cueOk,'Q13a 戰鬥「撲倒」躲開：敘述在格子出現前就在紀錄裡、不扣血、播閃開聲、QTE 收掉、還在戰鬥裡',`生命 ${F.fh&&F.fh.h0}→${F.fh&&F.fh.hp}、音效 ${F.s.join(',')}、敘述${cueOk?'有':'沒有'}先出現${F.fh&&F.fh.err?'、錯誤 '+F.fh.err:''}`);
  await endFightNow();
  F=await fight('infected','撲倒',async()=>{await now(p)});
  say(F.fh&&!F.fh.err&&F.fh.hp<F.fh.h0&&F.s.includes('thud')&&!F.s.includes('whoosh')&&!F.left&&(F.fight||F.over),'Q13b 戰鬥「撲倒」沒躲開：扣血、播這一招標好的受傷聲（thud）、不播閃開聲、QTE 收掉',`生命 ${F.fh&&F.fh.h0}→${F.fh&&F.fh.hp}、音效 ${F.s.join(',')}`);
  await endFightNow();
  F=await fight('predator','飛撲',()=>all(p,4,()=>clickNow(p).catch(()=>{})));
  say(F.fh&&!F.fh.err&&F.fh.hp===F.fh.h0&&F.s.includes('whoosh')&&!F.left,'Q14 戰鬥「飛撲」躲開：不扣血、播閃開聲',`生命 ${F.fh&&F.fh.h0}→${F.fh&&F.fh.hp}、音效 ${F.s.join(',')}`);
  await endFightNow();
  say(rec.required.length===0,'戰鬥 QTE：沒有程式錯誤',BE.brief(rec));
  if(detail.checks.some(c=>!c.ok))detail.shot=await BE.shot(p,'qte-844x390');
  await ctx.close();
  // Q11 觸控
  {const {ctx,p,rec}=await open(844,390,{hasTouch:true,isMobile:true});
   let info=null;const r=await runQ(p,{name:'觸控',n:3},async()=>{for(let i=0;i<3;i++){const h=await now(p);if(!info)info=await h.evaluate(e=>({kbd:!!e.querySelector('kbd'),tch:e.classList.contains('tch')}));const bb=await h.boundingBox();await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(60)}});
   say(r.v===true&&info&&!info.kbd&&info.tch,'Q11 觸控裝置：格子上沒有鍵盤字母、用手指點完成功',`結果 ${r.v}、${JSON.stringify(info)}`);
   say(rec.required.length===0,'觸控：沒有程式錯誤',BE.brief(rec));await ctx.close()}
  // Q12 版面：三種尺寸各跑 4 格，每格出現時量位置
  for(const [w,h,name] of VIEWS){const {ctx,p,rec}=await open(w,h,{hasTouch:w<1000});const bad=[];let n=0;
   await runQ(p,{name:'版面 '+name,n:4},async()=>{for(let i=0;i<4;i++){const hd=await now(p);
     const m=await hd.evaluate(b=>{const R=b.getBoundingClientRect(),vw=innerWidth,vh=innerHeight,q=document.querySelector('#qte');const Q=q.getBoundingClientRect();
      const hit=s=>{const e=q.querySelector(s);if(!e)return false;const r=e.getBoundingClientRect();return r.width>0&&!(R.right<=r.left||R.left>=r.right||R.bottom<=r.top||R.top>=r.bottom)};
      const t=b.querySelector('b');return {r:[R.left,R.top,R.right,R.bottom].map(Math.round),inView:R.left>=0&&R.top>=0&&R.right<=vw+.5&&R.bottom<=vh+.5,inQte:R.left>=Q.left-.5&&R.top>=Q.top-.5&&R.right<=Q.right+.5&&R.bottom<=Q.bottom+.5,
       overText:hit('.qt'),overBar:hit('.qbar'),clip:t?t.scrollWidth>t.clientWidth+1||t.scrollHeight>t.clientHeight+1:true,word:t?t.textContent:''}});
     n++;if(!m.inView||!m.inQte||m.overText||m.overBar||m.clip)bad.push(`第 ${i+1} 格 ${JSON.stringify(m)}`);
     if(i===0&&process.env.QA_QTE_SHOTS)await p.screenshot({path:`${process.env.QA_QTE_SHOTS}/qte-${w}x${h}.png`});
     const bb=await hd.boundingBox();if(w<1000)await p.touchscreen.tap(bb.x+bb.width/2,bb.y+bb.height/2);else await p.mouse.click(bb.x+bb.width/2,bb.y+bb.height/2);await p.waitForTimeout(60)}});
   say(n===4&&!bad.length,`Q12 版面（${name} ${w}×${h}）：4 格都在畫面內、不壓到描述和倒數條、字沒有被裁掉`,bad.slice(0,2).join('；')||`量了 ${n} 格`);
   say(rec.required.length===0,`版面（${name}）：沒有程式錯誤`,BE.brief(rec));
   if(bad.length)detail.shot=await BE.shot(p,`qte-${w}x${h}`);await ctx.close()}
 }catch(e){say(false,'QTE 測試中斷',e.message.split('\n')[0])}
 writeDetail();await b.close();console.log(fail?`失敗 ${fail} 項`:'這個階段的檢查都通過');process.exit(fail?1:0)})().catch(e=>{console.log('QTE 測試工具出錯：'+(e&&e.stack||e));writeDetail();process.exit(3)});
