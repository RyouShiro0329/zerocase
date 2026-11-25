// 長路線測試（Claude 2026-11-16，主人：現在不測平衡，開無敵把地圖走一遍）
// 開測試用無敵模式（tests/helpers/godmode.cjs，只在測試頁注入），一局裡盡量往「還沒去過的地方」走，
// 從旅館一路走到街區和城裡的地點。每一步檢查：沒有程式錯誤、現在的節點存在、選項的去處存在、
// 紀錄裡沒有 undefined／NaN／[object 這類壞掉的文字。最後列出走過的地點。
// 2026-11-25 QA 升級 PR-A：錯誤改用 tests/helpers/browser-errors.cjs 分類；QA_DETAIL＝細節 JSON；失敗截圖；工具出錯 exit 3。
// 2026-11-25 QA 升級 PR-B：driver.cjs 種子（QA_SEED）、操作紀錄 test-results/trace-long-route.json、逾時分開計（超過 5% 算失敗）、卡死偵測。
// 跑法：node tests/long-route.cjs [動作數，預設 220]（需要 http.server 8768，run_all.sh 會開）
const {chromium}=require('playwright');const {GOD}=require('./helpers/godmode.cjs');const BE=require('./helpers/browser-errors.cjs');const DR=require('./helpers/driver.cjs');const fs=require('node:fs');
const STEPS=+(process.argv[2]||220),ORIGIN=process.env.QA_ORIGIN||'http://localhost:8768',URL=ORIGIN+'/index.html';
const SEED=DR.seedOf();const detail={steps:STEPS,seed:SEED,checks:[]};console.log(`種子 ${SEED}（重現：QA_SEED=${SEED}）`);const writeDetail=()=>{detail.failed=detail.checks.filter(c=>!c.ok).map(c=>c.name+(c.note?'：'+c.note:''));if(process.env.QA_DETAIL)fs.writeFileSync(process.env.QA_DETAIL,JSON.stringify(detail,null,1))};
(async()=>{const b=await chromium.launch();let fail=0;const say=(ok,n,x)=>{if(!ok)fail++;detail.checks.push({ok,name:n,note:x||''});console.log((ok?'通過':'失敗')+'　'+n+(x?'　'+x:''))};
 const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(DR.seedScript,SEED);const T=DR.tracker('long-route',{seed:SEED});
 await ctx.addInitScript(()=>{setInterval(()=>{const q=document.querySelector('#qte .qbx.now:not(.done)');if(q)q.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const k=document.querySelector('#qcode [data-k="no"]');if(k)k.click()},120)});
 await BE.serve(ctx,ORIGIN,__dirname+'/..');
 const p=await ctx.newPage();const rec=BE.watch(p,ORIGIN);detail.errors=rec;
 await p.goto(URL);
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});
 await p.reload();
 try{await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');
  await p.click('[data-m="go"]');await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node',null,{timeout:30000});await p.evaluate(GOD);T.gameSeed=await p.evaluate(()=>G.sd)}
 catch(e){say(false,'開局',e.message.split('\n')[0]);detail.shot=await BE.shot(p,'long-route-start');writeDetail();await b.close();process.exit(1)}
 await p.evaluate(()=>{window.__seenN=new Set();window.__seenL=new Set();window.__bad=[];window.__badGo=[];window.__logN=0});
 let steps=0,over=null;const t0=Date.now();
 for(;steps<STEPS;steps++){
  const st=await p.evaluate(()=>{
   if(G.node){__seenN.add(G.node);if(G.lv)__seenL.add(G.lv);if(!N[G.node])__badGo.push('目前節點不存在：'+G.node)}
   for(let i=__logN;i<LOG.length;i++){const t=String(LOG[i][0]);if(/undefined|NaN|\[object /.test(t))__bad.push(t.replace(/<[^>]+>/g,'').slice(0,80))}__logN=LOG.length;
   return {node:G.node,fight:!!G.fight,over:G.over&&(G.over.dead?'死亡':G.over.end||'結束')}});
  if(st.over){over=st.over;break}
  const before=await T.sig(p);
  const act=await p.evaluate(()=>{const A=[],L=b=>(b.innerText||'').replace(/\s+/g,' ').trim().slice(0,30),hit=(k,b)=>{A.push(k+(b?'「'+L(b)+'」':''));b&&b.click()},out=()=>A.length?{k:A.join('＋')}:null;
   for(const s of ['#dice','#lvcard'])if(document.querySelector(s)&&!document.querySelector(s).hidden){A.push(s==='#dice'?'關骰子':'關升級卡');document.querySelector(s).click()}
   const cf=document.querySelector('#cfm:not([hidden]) button');if(cf)hit('確認',cf);
   if(G.fight&&!busy){const ft=document.querySelector('#choices [data-ftab="atk"]');if(ft){hit('攻擊分頁',ft);return out()}
    const a=document.querySelector('#choices button[data-fa="atk"]:not([disabled])');if(a){hit('攻擊',a);return out()}
    const t=document.querySelector('#choices button[data-tgt]');if(t){hit('目標',t);return out()}}
   if(G.fight)return out();
   const done=document.querySelector('#choices button[data-shopdone]:not([disabled])');if(done){hit('買好了',done);return out()}  // 商店：買好了，繼續
   const cs=(()=>{try{return choices()}catch(e){return []}})();
   const bs=[...document.querySelectorAll('#choices button[data-ch]:not([disabled])')];
   const goOf=c=>c&&(c.go||(c.ok&&c.ok.go)||(c.ng&&c.ng.go));
   // 會直接結束一局的去處不選：最終結局，以及撤離巴士最後一關（Z3b 只剩「上車」）
   const fin=g=>g&&((END[g]&&END[g].final)||g==='Z3b');
   const info=bs.map(b=>{const c=cs[+b.dataset.ch];const g=goOf(c);if(g&&!N[g]&&!END[g])__badGo.push(`去處不存在：${G.node} 的「${c.l}」→ ${g}`);
    const L=g&&N[g]&&N[g].L;return {b,g,fresh:g&&N[g]&&!__seenN.has(g),freshL:L&&!__seenL.has(L),fin:fin(g)}});
   // 優先：沒去過的區域 → 沒去過的節點 → 會移動的選項（七成）→ 其他
   const ok=info.filter(x=>!x.fin);const mv=ok.filter(x=>x.g&&N[x.g]);
   const pool=ok.filter(x=>x.freshL).length?ok.filter(x=>x.freshL):ok.filter(x=>x.fresh).length?ok.filter(x=>x.fresh):(mv.length&&(window.__qaRnd||Math.random)()<.7)?mv:ok.length?ok:info;
   if(pool.length){hit('選項',pool[Math.floor((window.__qaRnd||Math.random)()*pool.length)].b);return out()}
   const other=[...document.querySelectorAll('#choices button:not([disabled])')].filter(x=>!x.hasAttribute('data-cancel')&&!x.dataset.open&&!x.hasAttribute('data-openshop'));if(other.length)hit('其他',other[0]);return out()});
  await p.waitForTimeout(120);
  const wt=await T.wait(p);
  if(T.rec(steps,st,act,wt,before,await T.sig(p))){steps++;break}
 }
 const r=await p.evaluate(()=>({L:[...__seenL].map(k=>(LV[k]?LV[k].n+(LV[k].sub?'・'+LV[k].sub:''):k)),ch2:[...__seenL].some(k=>LV[k]&&LV[k].ch===2),n:__seenN.size,bad:__bad.slice(0,5),badGo:[...new Set(__badGo)].slice(0,5),day:typeof dayN==='function'?dayN():0}));
 const sec=Math.round((Date.now()-t0)/1000);
 console.log(`走了 ${steps} 個動作（${sec} 秒），到第 ${r.day} 天，走過 ${r.n} 個節點、${r.L.length} 個區域：${r.L.join('、')}${over?'；結束：'+over:''}`);
 Object.assign(detail,{actions:steps,seconds:sec,day:r.day,nodes:r.n,areas:r.L,over});
 say(rec.required.length===0,'沒有程式錯誤、必要檔案都載入成功',BE.brief(rec));
 if(rec.optional.length)console.log(`　（只記錄：外部連線等 ${rec.optional.length} 筆）`);
 say(r.badGo.length===0,'目前節點與選項去處都存在',r.badGo.join('；'));
 say(r.bad.length===0,'紀錄裡沒有 undefined／NaN／[object',r.bad.join('；'));
 say(r.ch2,'走出旅館、到過街區（第二章的地點）',r.L.join('、'));
 const lim=DR.timeoutLimit(steps),S=T.summary();
 say(!T.stuck,`沒有卡死（連續 ${process.env.QA_STUCK||20} 步畫面沒變）`,T.stuck?`第 ${T.stuck.at} 步在 ${T.stuck.node} 卡住`:`最多連續 ${S.maxSame} 步沒變`);
 say(S.timeouts<=lim,`等待逾時 ${S.timeouts} 次（上限 ${lim}）`,`有效動作 ${S.valid}、無效 ${S.invalid}、沒東西可點 ${S.idle}、平均等待 ${S.avgWaitMs}ms`);
 if(T.stuck||S.timeouts>lim)detail.screen=await T.screen(p);
 Object.assign(detail,{run:S,trace:T.save()});
 if(fail)detail.shot=await BE.shot(p,'long-route-end');writeDetail();
 await b.close();console.log(fail?`失敗 ${fail} 項`:'這個階段的檢查都通過');process.exit(fail?1:0)})().catch(e=>{console.log('長路線測試工具出錯：'+(e&&e.stack||e));process.exit(3)});
