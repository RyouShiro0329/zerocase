// 瀏覽器冒煙測試（Claude 2026-11-16）：真的開網頁、真的點選項，確認遊戲能一路往下走、沒有程式錯誤。
// 需要 playwright（npm i -g playwright 並裝 chromium）。跑法：node tests/browser-smoke.cjs [步數，預設 40]
// 不會自己架伺服器：run_all.sh 會在倉庫根目錄開 python3 -m http.server 8768。
const {chromium}=require('playwright');
const STEPS=+(process.argv[2]||40),URL='http://localhost:8768/index.html';
const VIEWS=[[393,690,'手機直拿（轉橫向）'],[844,390,'手機橫拿'],[1280,720,'電腦']];
const DIFFS=['normal','hard','real'];
(async()=>{const b=await chromium.launch();let fail=0;const say=(ok,n,x)=>{if(!ok)fail++;console.log((ok?'通過':'失敗')+'　'+n+(x?'　'+x:''))};
for(let i=0;i<VIEWS.length;i++){const [w,h,name]=VIEWS[i],diff=DIFFS[i];
 const ctx=await b.newContext({viewport:{width:w,height:h},hasTouch:w<1000});
 await ctx.addInitScript(()=>{setInterval(()=>{const q=document.querySelector('#qte .qbx.now:not(.done)');if(q)q.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const k=document.querySelector('#qcode [data-k="no"]');if(k)k.click()},120)});
 const p=await ctx.newPage();const errs=[];
 p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|fonts|favicon|firebase|gstatic|ERR_/i.test(m.text()))errs.push(m.text())});
 await p.goto(URL);
 await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});
 await p.reload();
 try{
  await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');
  const d=await p.$(`[data-dif="${diff}"]`);if(d)await d.click();await p.click('[data-m="go"]');
  await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node',null,{timeout:30000});
 }catch(e){say(false,`${name}：開局`,e.message.split('\n')[0]);await ctx.close();continue}
 const nodes=new Set();let fights=0,steps=0,over=null;const log0=await p.evaluate(()=>LOG.length);
 for(;steps<STEPS;steps++){
  const st=await p.evaluate(()=>({node:G.node,over:G.over&&(G.over.dead?'死亡':G.over.end||'結束'),fight:!!G.fight}));
  nodes.add(st.node);if(st.fight)fights++;if(st.over){over=st.over;break}
  await p.evaluate(()=>{for(const s of ['#dice','#lvcard'])if(document.querySelector(s)&&!document.querySelector(s).hidden)document.querySelector(s).click();
   const cf=document.querySelector('#cfm:not([hidden]) button');if(cf)cf.click();
   if(G.fight&&!busy){const ft=document.querySelector('#choices [data-ftab="atk"]');if(ft){ft.click();return}
    const a=document.querySelector('#choices button[data-fa="atk"]:not([disabled])');if(a){a.click();return}
    const t=document.querySelector('#choices button[data-tgt]');if(t){t.click();return}}
   const bs=[...document.querySelectorAll('#choices button:not([disabled])')].filter(x=>!x.hasAttribute('data-cancel')&&!x.dataset.open&&!x.classList.contains('tellb'));
   const pref=bs.filter(x=>x.dataset.ch!=null||x.dataset.fa==='atk'||x.dataset.tgt!=null);const pool=pref.length?pref:bs;
   if(pool.length)pool[Math.floor(Math.random()*pool.length)].click()});
  await p.waitForTimeout(150);
 }
 // 選項按鈕要在畫面內（沒有被裁掉）
 const vis=await p.evaluate(()=>{const s=document.querySelector('#stage')||document.body;const R=s.getBoundingClientRect();const bs=[...document.querySelectorAll('#choices button')].slice(0,3);return bs.every(b=>{const r=b.getBoundingClientRect();return r.width>0&&r.left>=R.left-1&&r.right<=R.right+1})});
 say(errs.length===0,`${name}（${diff}）：${steps} 步沒有程式錯誤`,errs.slice(0,3).join(' | '));
 const grew=await p.evaluate(n=>LOG.length-n,log0);
 say(grew>=15||!!over,`${name}：遊戲有往下走（紀錄有新內容）`,`紀錄多了 ${grew} 行、走過 ${nodes.size} 個節點、戰鬥中 ${fights} 步${over?'、結束：'+over:''}`);
 say(vis,`${name}：選項按鈕在畫面內`);
 await ctx.close()}
await b.close();console.log(fail?`失敗 ${fail} 項`:'全部通過');process.exit(fail?1:0)})();
