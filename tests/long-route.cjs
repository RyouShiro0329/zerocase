// 長路線測試（Claude 2026-11-16，主人：現在不測平衡，開無敵把地圖走一遍）
// 開測試用無敵模式（tests/helpers/godmode.cjs，只在測試頁注入），一局裡盡量往「還沒去過的地方」走，
// 從旅館一路走到街區和城裡的地點。每一步檢查：沒有程式錯誤、現在的節點存在、選項的去處存在、
// 紀錄裡沒有 undefined／NaN／[object 這類壞掉的文字。最後列出走過的地點。
// 跑法：node tests/long-route.cjs [動作數，預設 220]（需要 http.server 8768，run_all.sh 會開）
const {chromium}=require('playwright');const {GOD}=require('./helpers/godmode.cjs');
const STEPS=+(process.argv[2]||220),URL='http://localhost:8768/index.html';
(async()=>{const b=await chromium.launch();let fail=0;const say=(ok,n,x)=>{if(!ok)fail++;console.log((ok?'通過':'失敗')+'　'+n+(x?'　'+x:''))};
 const ctx=await b.newContext({viewport:{width:1280,height:720}});
 await ctx.addInitScript(()=>{setInterval(()=>{const q=document.querySelector('#qte .qbx.now:not(.done)');if(q)q.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const k=document.querySelector('#qcode [data-k="no"]');if(k)k.click()},120)});
 const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|fonts|favicon|firebase|gstatic|ERR_/i.test(m.text()))errs.push(m.text())});
 await p.goto(URL);
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});
 await p.reload();
 try{await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');
  await p.click('[data-m="go"]');await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node',null,{timeout:30000});await p.evaluate(GOD)}
 catch(e){say(false,'開局',e.message.split('\n')[0]);await b.close();process.exit(1)}
 await p.evaluate(()=>{window.__seenN=new Set();window.__seenL=new Set();window.__bad=[];window.__badGo=[];window.__logN=0});
 let steps=0,over=null;const t0=Date.now();
 for(;steps<STEPS;steps++){
  const st=await p.evaluate(()=>{
   if(G.node){__seenN.add(G.node);if(G.lv)__seenL.add(G.lv);if(!N[G.node])__badGo.push('目前節點不存在：'+G.node)}
   for(let i=__logN;i<LOG.length;i++){const t=String(LOG[i][0]);if(/undefined|NaN|\[object /.test(t))__bad.push(t.replace(/<[^>]+>/g,'').slice(0,80))}__logN=LOG.length;
   return {over:G.over&&(G.over.dead?'死亡':G.over.end||'結束')}});
  if(st.over){over=st.over;break}
  await p.evaluate(()=>{for(const s of ['#dice','#lvcard'])if(document.querySelector(s)&&!document.querySelector(s).hidden)document.querySelector(s).click();
   const cf=document.querySelector('#cfm:not([hidden]) button');if(cf)cf.click();
   if(G.fight&&!busy){const ft=document.querySelector('#choices [data-ftab="atk"]');if(ft){ft.click();return}
    const a=document.querySelector('#choices button[data-fa="atk"]:not([disabled])');if(a){a.click();return}
    const t=document.querySelector('#choices button[data-tgt]');if(t){t.click();return}}
   if(G.fight)return;
   const done=document.querySelector('#choices button[data-shopdone]:not([disabled])');if(done){done.click();return}  // 商店：買好了，繼續
   const cs=(()=>{try{return choices()}catch(e){return []}})();
   const bs=[...document.querySelectorAll('#choices button[data-ch]:not([disabled])')];
   const goOf=c=>c&&(c.go||(c.ok&&c.ok.go)||(c.ng&&c.ng.go));
   // 會直接結束一局的去處不選：最終結局，以及撤離巴士最後一關（Z3b 只剩「上車」）
   const fin=g=>g&&((END[g]&&END[g].final)||g==='Z3b');
   const info=bs.map(b=>{const c=cs[+b.dataset.ch];const g=goOf(c);if(g&&!N[g]&&!END[g])__badGo.push(`去處不存在：${G.node} 的「${c.l}」→ ${g}`);
    const L=g&&N[g]&&N[g].L;return {b,g,fresh:g&&N[g]&&!__seenN.has(g),freshL:L&&!__seenL.has(L),fin:fin(g)}});
   // 優先：沒去過的區域 → 沒去過的節點 → 會移動的選項（七成）→ 其他
   const ok=info.filter(x=>!x.fin);const mv=ok.filter(x=>x.g&&N[x.g]);
   const pool=ok.filter(x=>x.freshL).length?ok.filter(x=>x.freshL):ok.filter(x=>x.fresh).length?ok.filter(x=>x.fresh):(mv.length&&Math.random()<.7)?mv:ok.length?ok:info;
   if(pool.length){pool[Math.floor(Math.random()*pool.length)].b.click();return}
   const other=[...document.querySelectorAll('#choices button:not([disabled])')].filter(x=>!x.hasAttribute('data-cancel')&&!x.dataset.open&&!x.hasAttribute('data-openshop'));if(other.length)other[0].click()});
  await p.waitForTimeout(120);
  await p.waitForFunction(()=>G.over||(!busy&&!G.busy),null,{timeout:15000}).catch(()=>{});
 }
 const r=await p.evaluate(()=>({L:[...__seenL].map(k=>(LV[k]?LV[k].n+(LV[k].sub?'・'+LV[k].sub:''):k)),ch2:[...__seenL].some(k=>LV[k]&&LV[k].ch===2),n:__seenN.size,bad:__bad.slice(0,5),badGo:[...new Set(__badGo)].slice(0,5),day:typeof dayN==='function'?dayN():0}));
 const sec=Math.round((Date.now()-t0)/1000);
 console.log(`走了 ${steps} 個動作（${sec} 秒），到第 ${r.day} 天，走過 ${r.n} 個節點、${r.L.length} 個區域：${r.L.join('、')}${over?'；結束：'+over:''}`);
 say(errs.length===0,'沒有程式錯誤',errs.slice(0,3).join(' | '));
 say(r.badGo.length===0,'目前節點與選項去處都存在',r.badGo.join('；'));
 say(r.bad.length===0,'紀錄裡沒有 undefined／NaN／[object',r.bad.join('；'));
 say(r.ch2,'走出旅館、到過街區（第二章的地點）',r.L.join('、'));
 await b.close();console.log(fail?`失敗 ${fail} 項`:'全部通過');process.exit(fail?1:0)})();
