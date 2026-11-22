const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const OUT='qa-output/enemy-attack';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const report={checks:[],errors:[],phone:'待主人實機驗收',network:'未測試：正式多人實連；使用實際頁面受控戰鬥'};
const check=(name,ok)=>{report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)};
try{for(const [width,height] of [[844,390],[393,690]]){const tag=`${width}x${height}`,ctx=await b.newContext({viewport:{width,height},hasTouch:true}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));window.__autoDismiss=true;setInterval(()=>{if(!window.__autoDismiss)return;for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},100)});
await p.goto('http://localhost:8768/index.html');await p.click('#gateNo');await p.click('[data-cat="custom"]');await p.fill('#cname','攻擊驗收');await p.click('[data-ctab="tal"]');await p.click('[data-tal="keen"]');await p.click('[data-ctab="sk"]');await p.click('[data-csk="aid"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-dif="hard"]');await p.click('[data-m="go"]');await p.waitForFunction(()=>G&&G.phase==='node'&&!busy);
// 先走真正的遭遇與先攻，之後只固定骰點／傷害，驗收實際抵抗與減傷函式。
await p.evaluate(()=>{qteLocal=async()=> 'ok';window.__fight=startFight({n:1,types:['infected'],noMut:1,mode:'first'});});await p.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
await p.click('#choices [data-ftab="other"]');check(tag+' 格擋與掩蔽保留且無閃躲',await p.locator('[data-fa="block"]').count()===1&&await p.locator('[data-fa="cover"]').count()===1&&await p.locator('[data-fa="dodge"]').count()===0);
await p.screenshot({path:`${OUT}/defence-${tag}.png`});
await p.evaluate(()=>{stopCd();window.__autoDismiss=false;const t=me();t.hp=t.max=100;t.st.STR=3;t.st.CON=2;t.stance='block';G.fight.foes[0].type='devourer';G.fight.foes[0].n='巨噬者';qte=async()=>false;foeDmg=async()=>10;armorOf=()=>0;statEffects=()=>[];r2=()=>({a:20,s:20});window.__controlDone=false;window.__control=qteHit(G.fight.foes[0],MOVES.devourer[1],t).then(()=>{window.__controlDone=true});});
await p.waitForFunction(()=>!document.querySelector('#dice').hidden&&document.querySelector('#dice').textContent.includes('抵抗暈眩'));
check(tag+' 抵抗視窗文字完整位於舞台',await p.evaluate(()=>{const r=document.querySelector('#dice .tray').getBoundingClientRect(),s=document.querySelector('#stage').getBoundingClientRect();return r.width>0&&r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1}));
await p.screenshot({path:`${OUT}/resist-${tag}.png`});await p.click('#dice');await p.waitForFunction(()=>window.__controlDone);
report.observations=report.observations||[];report.observations.push({size:tag,...await p.evaluate(()=>({hp:me().hp,skip:me().skip||0,dazed:me().dazed||0,stance:me().stance,difficulty:G.opts.diff,multiplier:DF().dmg}))});
check(tag+' 格擋後仍受4傷害、體質成功避免暈眩',await p.evaluate(()=>me().hp===96&&!me().skip&&!me().dazed));
await p.evaluate(()=>{window.__autoDismiss=true;me().stance=null;r2=()=>({a:1,s:1});window.__controlDone=false;window.__control=qteHit(G.fight.foes[0],MOVES.devourer[1],me()).then(()=>{window.__controlDone=true});});await p.waitForFunction(()=>window.__controlDone);
check(tag+' 無格擋受9傷害、抵抗失敗造成暈眩',await p.evaluate(()=>me().hp===87&&me().skip===1&&me().dazed===1));
await p.evaluate(()=>{me().skip=0;me().dazed=0;me().stance='cover';G.fight.foes[0].type='incubator';window.__controlDone=false;window.__control=qteHit(G.fight.foes[0],MOVES.incubator[0],me()).then(()=>{window.__controlDone=true});});await p.waitForFunction(()=>window.__controlDone);
check(tag+' 囊泡掩蔽受5傷害且污染保留',await p.evaluate(()=>me().hp===82&&me().humus===2&&me().inf>0));
await ctx.close()}
check('頁面沒有未處理程式錯誤',report.errors.length===0)
}finally{fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));await b.close()}console.log(JSON.stringify(report,null,2))})().catch(e=>{console.error(e);process.exit(1)});
