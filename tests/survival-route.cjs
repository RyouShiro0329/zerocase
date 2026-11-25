// 正常生存短路線＋戰鬥完整性（Claude 2026-11-25，QA 升級 PR-C：QA-12、QA-13）
// 冒煙和長路線都開測試用無敵；這支「不開無敵」，照一般難度真的會受傷、會餓、會死，用來抓無敵模式蓋掉的問題。
// 兩段：
//   一、短路線：一般難度走 N 個動作（預設 120）。每一步檢查沒有程式錯誤、節點和去處存在、紀錄沒有 undefined／NaN、
//       生命／恐懼／感染／飢渴都是有限的數字且在範圍內、沒有卡死、逾時在上限內。死了不算失敗（這是正常玩法會發生的事），
//       但死亡畫面要出得來。
//   二、指定戰鬥：重新開一局，用遊戲自己的 startFight 依序打 感染者、割喉者、快槍手（後兩種會掉裝備），每一場檢查：
//       - 重複結算：在攻擊（只有一隻敵人時直接出手）或選目標的按鈕上快速點兩下，同一回合同一個人只能出手一次；每場 endFight 只跑一次、foeLoot 最多一次
//       - 重複戰利品：戰利品清單每隻最多一筆、拿到的裝備數量＝清單筆數
//       - 扣血對帳：applyDmg、hurt 每次扣的生命＝回報的數字（沒有在同一下裡扣兩次）
//       - 回到探索：打完之後 G.fight 清掉、回到可以選選項的狀態、演出關掉
//       - 音樂恢復：打的時候是戰鬥配樂，打完回到探索配樂、戰鬥兩軌停下
//   路線上碰到的戰鬥也套同一組檢查。
// 種子、操作紀錄、逾時、卡死沿用 tests/helpers/driver.cjs（QA_SEED；紀錄在 test-results/trace-survival.json）。
// 這支只在測試頁注入檢查用的包裝函式，遊戲本體不動；只開配樂（bgm），不開音效（snd），瀏覽器允許自動播放。
// 跑法：node tests/survival-route.cjs [短路線動作數，預設 120]（需要 http.server 8768，run_all.sh 會開；或 QA_SERVE=route）
//   QA_SURV_FIGHTS＝指定戰鬥要打哪些（逗號分隔的敵人種類，預設 infected,cutter,quickdraw；空字串＝不打）
const {chromium}=require('playwright');const BE=require('./helpers/browser-errors.cjs');const DR=require('./helpers/driver.cjs');const fs=require('node:fs');
const STEPS=+(process.argv[2]??120),ORIGIN=process.env.QA_ORIGIN||'http://localhost:8768',URL=ORIGIN+'/index.html';
const FIGHTS=(process.env.QA_SURV_FIGHTS??'infected,cutter,quickdraw').split(',').map(s=>s.trim()).filter(Boolean);
const SEED=DR.seedOf();const detail={steps:STEPS,seed:SEED,fightsPlanned:FIGHTS,checks:[]};console.log(`種子 ${SEED}（重現：QA_SEED=${SEED}）`);
const writeDetail=()=>{detail.failed=detail.checks.filter(c=>!c.ok).map(c=>c.name+(c.note?'：'+c.note:''));if(process.env.QA_DETAIL)fs.writeFileSync(process.env.QA_DETAIL,JSON.stringify(detail,null,1))};

// 注入測試頁：包裝戰鬥相關的函式，記下每一場的結算次數、戰利品、扣血、出手、配樂
const INSTR=()=>{if(window.__qa)return;const Q=window.__qa={fights:[],bad:[],acts:[],music:[],seq:0};
 const rec=F=>{if(!F)return null;if(!F.__qa){F.__qa=++Q.seq;Q.fights.push({id:F.__qa,foes:(F.foes||[]).map(f=>f.type),ends:0,lootCalls:0,lootRows:null,gearDelta:null,gearRows:null,itemDelta:null,musicIn:null,musicAfter:null,back:null,stg:null})}return Q.fights.find(x=>x.id===F.__qa)};
 const bad=m=>{if(Q.bad.length<50)Q.bad.push(m)};
 const inv=()=>{let g=0,i=0;for(const p of G.players){g+=(p.gear||[]).length;for(const v of Object.values(p.items||{}))i+=+v||0}return {g,i}};
 const _end=endFight;endFight=async function(){const F=G.fight,r=rec(F);if(r){r.ends++;if(r.ends>1)bad(`第 ${r.id} 場 endFight 跑了 ${r.ends} 次`);r.lootRows=F&&F.loot?F.loot.length:0;
   const dead=F?F.foes.filter(f=>f.dead).length:0;if(r.lootRows>dead)bad(`第 ${r.id} 場戰利品清單 ${r.lootRows} 筆，但只倒下 ${dead} 隻`);Q.ending=r;r.endAt=Date.now()}
  try{return await _end.apply(this,arguments)}finally{Q.ending=null}};
 const _loot=foeLoot;foeLoot=function(L){const r=Q.ending||rec(G.fight);const b=inv();const out=_loot.apply(this,arguments);const a=inv();
  if(r){r.lootCalls++;if(r.lootCalls>1)bad(`第 ${r.id} 場 foeLoot 跑了 ${r.lootCalls} 次（戰利品重複）`);r.gearDelta=a.g-b.g;r.itemDelta=a.i-b.i;
   r.gearRows=(L||[]).filter(x=>FOES[x.t]&&FOES[x.t].loot&&FOES[x.t].loot.gear).length;if(able().length&&r.gearDelta!==r.gearRows)bad(`第 ${r.id} 場戰利品裝備 ${r.gearRows} 筆，實際多了 ${r.gearDelta} 件`)}return out};
 const _ex=execAct;execAct=async function(p,a){const F=G.fight;const r=rec(F);if(r&&p&&a){Q.acts.push({f:r.id,round:F.round,pid:p.pid,a:a.a,sneak:F.sneak?1:0})}return _ex.apply(this,arguments)};
 const _ad=applyDmg;applyDmg=function(f,base,dts,p,quiet){if(quiet==='peek')return _ad.apply(this,arguments);const h0=f.hp;const d=_ad.apply(this,arguments);
  if(Number.isFinite(h0)&&f.hp!==h0-d)bad(`applyDmg：${f.n||f.name} 生命 ${h0} → ${f.hp}，回報扣 ${d}`);if(!Number.isFinite(f.hp))bad(`applyDmg：${f.n||f.name} 生命變成 ${f.hp}`);return d};
 const _hu=hurt;hurt=function(t,d){const h0=t.hp,s0=t.shd||0,on=typeof shdOn==='function'&&shdOn(t);const out=_hu.apply(this,arguments);const ab=on?s0-(t.shd||0):0;
  if(Number.isFinite(h0)&&t.hp!==h0-Math.max(0,d-ab))bad(`hurt：${t.name} 生命 ${h0} → ${t.hp}，扣 ${d}（護盾擋 ${ab}）`);return out};
 // 配樂：打的時候記一次模式；打完 2.5 秒再看一次
 setInterval(()=>{try{const M=BGM_MIX,F=G&&G.fight;if(F&&F.musicStarted){const r=rec(F);if(r&&!r.musicIn)r.musicIn=M.mode}
  for(const r of Q.fights)if(r.endAt&&!r.musicAfter&&Date.now()-r.endAt>2500&&!G.fight){const T=M.tracks;r.musicAfter={mode:M.mode,allowed:!!M.allowed,bgm:!!UI.bgm,over:!!G.over,explorePaused:T.explore.paused,exploreVol:+T.explore.volume.toFixed(2),battlePaused:T.battle.paused,intensePaused:T.intense.paused,failed:Object.entries(T).filter(([k,a])=>a.zcFailed).map(([k])=>k)}}}catch(e){}},200);
};
// 每一步：玩家數值都要是有限的數字、在範圍內
const STATS=()=>{const B=[];if(typeof G==='undefined'||!G||!G.players)return B;for(const p of G.players){const n=p.name||p.pid;
 for(const [k,lo,hi] of [['hp',-99,p.max],['max',1,999],['fe',0,100],['inf',0,100],['hun',0,10],['thi',0,10]]){const v=p[k];if(v==null)continue;if(!Number.isFinite(v))B.push(`${n} 的 ${k}＝${v}`);else if(v<lo||v>hi)B.push(`${n} 的 ${k}＝${v}（範圍 ${lo}～${hi}）`)}}return B};
// 選一個動作（和長路線一樣：戰鬥裡攻擊，平常挑沒去過的地方，避開會直接結束一局的去處）
const STEP=dbl=>{const A=[],L=b=>(b.innerText||'').replace(/\s+/g,' ').trim().slice(0,30),hit=(k,b)=>{A.push(k+(b?'「'+L(b)+'」':''));b&&b.click()},out=()=>A.length?{k:A.join('＋')}:null;
 const at=b=>{const r=b.getBoundingClientRect();return {x:r.left+r.width/2,y:r.top+r.height/2}};
 for(const s of ['#dice','#lvcard'])if(document.querySelector(s)&&!document.querySelector(s).hidden){A.push(s==='#dice'?'關骰子':'關升級卡');document.querySelector(s).click()}
 const cf=document.querySelector('#cfm:not([hidden]) button');if(cf)hit('確認',cf);
 if(G.fight&&!busy){const ft=document.querySelector('#choices [data-ftab="atk"]');if(ft){hit('攻擊分頁',ft);return out()}
  const a=document.querySelector('#choices button[data-fa="atk"]:not([disabled])');if(a){if(dbl)return {k:'快速點兩下「攻擊」',dbl:at(a)};hit('攻擊',a);return out()}
  const t=document.querySelector('#choices button[data-tgt]');if(t){if(dbl)return {k:'快速點兩下「目標」',dbl:at(t)};hit('目標',t);return out()}}
 if(G.fight)return out();
 const done=document.querySelector('#choices button[data-shopdone]:not([disabled])');if(done){hit('買好了',done);return out()}
 window.__seenN=window.__seenN||new Set();if(G.node)__seenN.add(G.node);
 const cs=(()=>{try{return choices()}catch(e){return []}})();const goOf=c=>c&&(c.go||(c.ok&&c.ok.go)||(c.ng&&c.ng.go));const fin=g=>g&&((END[g]&&END[g].final)||g==='Z3b');
 const bs=[...document.querySelectorAll('#choices button[data-ch]:not([disabled])')];window.__badGo=window.__badGo||[];
 const info=bs.map(b=>{const c=cs[+b.dataset.ch];const g=goOf(c);if(g&&!N[g]&&!END[g])__badGo.push(`去處不存在：${G.node} 的「${c.l}」→ ${g}`);return {b,g,fresh:g&&N[g]&&!__seenN.has(g),fin:fin(g)}});
 const ok=info.filter(x=>!x.fin),fr=ok.filter(x=>x.fresh);const pool=fr.length&&(window.__qaRnd||Math.random)()<.7?fr:ok.length?ok:info;
 if(pool.length){hit('選項',pool[Math.floor((window.__qaRnd||Math.random)()*pool.length)].b);return out()}
 const other=[...document.querySelectorAll('#choices button:not([disabled])')].filter(x=>!x.hasAttribute('data-cancel')&&!x.dataset.open&&!x.hasAttribute('data-openshop'));if(other.length)hit('其他',other[0]);return out()};

(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});let fail=0;const say=(ok,n,x)=>{if(!ok)fail++;detail.checks.push({ok,name:n,note:x||''});console.log((ok?'通過':'失敗')+'　'+n+(x?'　'+x:''))};
 const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(DR.seedScript,SEED);const T=DR.tracker('survival',{seed:SEED});
 await ctx.addInitScript(()=>{setInterval(()=>{const q=document.querySelector('#qte .qbx.now:not(.done)');if(q)q.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const k=document.querySelector('#qcode [data-k="no"]');if(k)k.click()},120)});
 await BE.serve(ctx,ORIGIN,__dirname+'/..');
 const p=await ctx.newPage();const rec=BE.watch(p,ORIGIN);detail.errors=rec;
 await p.goto(URL);
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:1,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});
 const start=async tag=>{await p.reload();
  await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');
  const d=await p.$('[data-dif="normal"]');if(d)await d.click();await p.click('[data-m="go"]');
  await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node',null,{timeout:30000});await p.evaluate(INSTR);return p.evaluate(()=>G.sd)};
 try{T.gameSeed=await start('route')}catch(e){say(false,'開局',e.message.split('\n')[0]);detail.shot=await BE.shot(p,'survival-start');writeDetail();await b.close();process.exit(1)}
 const god=await p.evaluate(()=>!!window.__god||typeof window.__godHeal==='function');
 say(!god,'沒有開測試用無敵（這支要測正常生存）',god?'頁面裡有 __god':'');
 const statBad=[],nodes=new Set();let dblN=0,steps=0,over=null,dmgSeen=0,hp0=null;
 // 走一步：回傳 true 代表卡死要停
 const one=async(i,dbl)=>{const st=await p.evaluate(()=>({node:G.node,fight:!!G.fight,over:G.over&&(G.over.dead?'死亡':G.over.end||G.over.n||'結束'),hp:G.players.reduce((s,q)=>s+q.hp,0)}));
  nodes.add(st.node);if(st.over){over=st.over;return 'over'}if(hp0!=null&&st.hp<hp0)dmgSeen++;hp0=st.hp;
  const before=await T.sig(p);let act=await p.evaluate(STEP,!!dbl);
  if(act&&act.dbl){await p.mouse.dblclick(act.dbl.x,act.dbl.y,{delay:15});act={k:act.k};dblN++}
  await p.waitForTimeout(120);const wt=await T.wait(p);
  // 畫面還沒變（敵人回合、擲骰動畫）：再等最多 3 秒，免得把等待算成好幾步「沒反應」
  let after=await T.sig(p);for(let w=0;after===before&&w<20&&!(await p.evaluate(()=>!!G.over));w++){await p.waitForTimeout(150);wt.ms+=150;after=await T.sig(p)}
  for(const x of await p.evaluate(STATS))if(statBad.length<10)statBad.push(`第 ${i} 步：${x}`);
  return T.rec(i,st,act,wt,before,after)?'stuck':null};
 // 一、短路線
 for(;steps<STEPS;steps++){const r=await one(steps);if(r==='over')break;if(r==='stuck'){steps++;break}}
 const routeSteps=steps;let deathScreen=null;
 if(over){await p.waitForTimeout(800);deathScreen=await p.evaluate(()=>/GAME OVER|結局|你死了|全員倒下|你發瘋了|葬身火海/.test(document.body.innerText))}
 const R1=await p.evaluate(()=>({bad:[...new Set(window.__badGo||[])].slice(0,5),log:LOG.map(x=>String(x[0])).filter(t=>/undefined|NaN|\[object /.test(t)).map(t=>t.replace(/<[^>]+>/g,'').slice(0,80)).slice(0,5),day:typeof dayN==='function'?dayN():0}));
 console.log(`短路線：${routeSteps} 個動作、走過 ${nodes.size} 個節點、到第 ${R1.day} 天、生命減少過 ${dmgSeen} 次${over?'；結束：'+over:''}`);
 Object.assign(detail,{route:{actions:routeSteps,nodes:nodes.size,day:R1.day,damageSteps:dmgSeen,over}});
 // 二、指定戰鬥（重新開一局）
 let fightRows=[];
 if(FIGHTS.length){let tries=0;
  try{await start('fights')}catch(e){say(false,'指定戰鬥：開局',e.message.split('\n')[0])}
  for(let k=0;k<FIGHTS.length;k++){const ty=FIGHTS[k];
   const ok=await p.evaluate(async ty=>{if(G.over)return 'over';
    for(const q of G.players){q.hp=q.max;q.fe=0;q.inf=0;q.hun=Math.max(q.hun||0,8);q.thi=Math.max(q.thi||0,8);q.bleed=0;q.burn=0}/* 每場開打前補滿，讓三場都打得到（打的過程不補） */
    G.alarm=0;void startFight({n:1,types:[ty],noMut:1,noElite:1});return 'ok'},ty);
   if(ok!=='ok'){say(false,`指定戰鬥：${ty}`,'這一局已經結束，打不了');break}
   await p.waitForFunction(()=>!!G.fight||G.over,null,{timeout:15000}).catch(()=>{});
   await p.evaluate(()=>{if(G.fight)for(const f of G.fight.foes)f.fchk=1});/* 人類敵人生命低時會逃（逃走不掉東西）；指定戰鬥要測戰利品，先把逃跑檢查標成做過 */
   let dblDone=0;for(let j=0;j<60;j++){const inF=await p.evaluate(()=>!!G.fight&&!G.over);if(!inF)break;
    const want=dblDone<2&&await p.evaluate(()=>!busy&&!!document.querySelector('#choices button[data-fa="atk"]:not([disabled]),#choices button[data-tgt]'));
    const r=await one(routeSteps+(tries++),want);if(want)dblDone++;if(r)break}
   // 打完：等回到可以選選項
   await p.waitForFunction(()=>G.over||(!G.fight&&G.phase==='node'&&!busy&&!G.busy),null,{timeout:20000}).catch(()=>{});
   await p.waitForTimeout(2900);/* 等配樂淡出、2.5 秒後的那次檢查 */
   const back=await p.evaluate(()=>({fight:!!G.fight,phase:G.phase,over:!!G.over,choices:document.querySelectorAll('#choices button:not([disabled])').length,stgOpen:!!(G.stg&&G.stg.k!=='end'),stgHidden:(()=>{const e=document.querySelector('#stg');return !e||e.hidden||getComputedStyle(e).display==='none'||getComputedStyle(e).visibility==='hidden'||e.childElementCount===0})()}));
   await p.evaluate(b=>{const r=__qa.fights[__qa.fights.length-1];if(r)r.back=b},back);
   if(back.over){say(true,`指定戰鬥：${ty}`,'這一場打到全隊倒下，後面的不打');break}
  }}
 const Q=await p.evaluate(()=>({fights:__qa.fights,bad:__qa.bad,acts:__qa.acts}));fightRows=Q.fights;
 // 同一回合同一個人只能出手一次（反擊、架式這類不佔行動的不算）
 const FREE=new Set(['counter','brace']);const per={};for(const a of Q.acts)if(!FREE.has(a.a)){const k=[a.f,a.round,a.pid,a.sneak].join(':');per[k]=(per[k]||0)+1}
 const dupAct=Object.entries(per).filter(([k,n])=>n>1).map(([k,n])=>`第 ${k.split(':')[0]} 場第 ${k.split(':')[1]} 回合 ${k.split(':')[2]} 出手 ${n} 次`);
 const ended=Q.fights.filter(f=>f.ends>0);
 console.log(`戰鬥：${Q.fights.length} 場（打完 ${ended.length} 場）：${Q.fights.map(f=>f.foes.join('+')+(f.ends?'':'（沒打完）')).join('、')}`);
 Object.assign(detail,{fights:Q.fights,dupAct,doubleClicks:dblN});
 // 檢查
 say(rec.required.length===0,'沒有程式錯誤、必要檔案都載入成功',BE.brief(rec));
 say(R1.bad.length===0,'目前節點與選項去處都存在',R1.bad.join('；'));
 say(R1.log.length===0,'紀錄裡沒有 undefined／NaN／[object',R1.log.join('；'));
 say(statBad.length===0,'生命、恐懼、感染、飢渴每一步都是有限的數字且在範圍內',statBad.slice(0,3).join('；'));
 say(!over||deathScreen,'一局結束時結束畫面出得來',over?`結束：${over}、畫面${deathScreen?'有':'沒有'}出來`:'短路線沒有走到結束');
 if(STEPS>0)say(nodes.size>=6||!!over,'短路線有往下走（走過 6 個節點以上）',`走過 ${nodes.size} 個節點`);else console.log('（短路線動作數 0：只打指定戰鬥）');
 const plannedOk=!FIGHTS.length||Q.fights.filter(f=>f.ends>0).length>=Math.min(FIGHTS.length,1);
 say(plannedOk,'戰鬥：至少打完一場（指定戰鬥）',`打完 ${ended.length} 場`);
 say(dupAct.length===0&&(dblN>0||!FIGHTS.length),'戰鬥：同一回合同一個人只出手一次（含快速點兩下）',dupAct.slice(0,3).join('；')||`在攻擊或目標上快速點兩下 ${dblN} 次、出手紀錄 ${Q.acts.length} 筆`);
 const multi=Q.bad.filter(x=>/跑了|戰利品/.test(x));
 say(multi.length===0,'戰鬥：每場結算一次、戰利品沒有重複',multi.slice(0,3).join('；')||ended.map(f=>`${f.foes.join('+')}：裝備 ${f.gearRows??0} 筆／拿到 ${f.gearDelta??0} 件`).join('、'));
 const hp=Q.bad.filter(x=>/^(applyDmg|hurt)/.test(x));
 say(hp.length===0,'戰鬥：每次扣的生命＝回報的數字（沒有重複扣血）',hp.slice(0,3).join('；'));
 const notBack=ended.filter(f=>f.back&&!f.back.over&&(f.back.fight||f.back.phase!=='node'||!f.back.choices||f.back.stgOpen||!f.back.stgHidden));
 say(notBack.length===0,'戰鬥：打完回到探索（戰鬥清掉、有選項可以選、演出關掉）',notBack.map(f=>`第 ${f.id} 場：${JSON.stringify(f.back)}`).join('；'));
 const mus=ended.filter(f=>f.musicAfter&&!f.musicAfter.over&&f.musicAfter.allowed&&f.musicAfter.bgm);
 const musBad=mus.filter(f=>{const m=f.musicAfter;return m.mode!=='explore'||!m.battlePaused||!m.intensePaused||m.explorePaused||m.exploreVol<.4});
 const musIn=ended.filter(f=>f.musicIn&&f.musicIn!=='battle'&&f.musicIn!=='intense');
 if(!mus.length)say(false,'戰鬥：打完音樂回到探索配樂','沒有可以檢查的戰鬥（配樂沒開或沒打完）');
 else say(!musBad.length&&!musIn.length,'戰鬥：打的時候是戰鬥配樂，打完回到探索配樂、戰鬥兩軌停下',[...musIn.map(f=>`第 ${f.id} 場打的時候是 ${f.musicIn}`),...musBad.map(f=>`第 ${f.id} 場打完：${JSON.stringify(f.musicAfter)}`)].join('；')||`檢查了 ${mus.length} 場`);
 const lim=DR.timeoutLimit(T.steps.length),S=T.summary();
 say(!T.stuck,`沒有卡死（連續 ${process.env.QA_STUCK||20} 步畫面沒變）`,T.stuck?`第 ${T.stuck.at} 步在 ${T.stuck.node} 卡住`:`最多連續 ${S.maxSame} 步沒變`);
 say(S.timeouts<=lim,`等待逾時 ${S.timeouts} 次（上限 ${lim}）`,`有效動作 ${S.valid}、無效 ${S.invalid}、沒東西可點 ${S.idle}、平均等待 ${S.avgWaitMs}ms`);
 if(T.stuck||S.timeouts>lim)detail.screen=await T.screen(p);
 Object.assign(detail,{run:S,trace:T.save()});
 if(fail)detail.shot=await BE.shot(p,'survival-end');writeDetail();
 await b.close();console.log(fail?`失敗 ${fail} 項`:'這個階段的檢查都通過');process.exit(fail?1:0)})().catch(e=>{console.log('生存路線測試工具出錯：'+(e&&e.stack||e));writeDetail();process.exit(3)});
