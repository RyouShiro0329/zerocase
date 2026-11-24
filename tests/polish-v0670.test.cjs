// v0.67.0 實玩回饋與細節優化（主人 2026-11-25 SPEC_POLISH_AFTER_v0.66.0）：介面、事件音效、隨機意外的場所條件、無線電來源
const {test}=require('node:test'),assert=require('node:assert/strict');
const fs=require('node:fs'),path=require('node:path');
const {game}=require('./helpers/audio-game.cjs');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const ST='{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2}';
function setup(){const g=game();g.run(`newRun([{kind:'custom',pid:'p1',name:'甲',st:${ST},load:{}}],{diff:'hard'},'solo');globalThis.p=G.players[0];p.max=100;p.hp=100;LOG=[];woundImpact=async()=>{};deathCheck=async()=>false;push=()=>{};draw=()=>{}`);return g}
const sounds=g=>g.events.filter(x=>x.t==='s').map(x=>x.d[0]);

test('介面：特殊選項只留藍字、沒有藍框；檢定標籤的共用樣式還在',()=>{
 assert.doesNotMatch(html,/\.ch\.blu\{border-color/);
 assert.match(html,/\.ch\.blu \.cl\{color:#8fc4ff\}/);
 assert.match(html,/\.tag\{margin-left:auto;flex:none;[^}]*border:1px solid var\(--line\)/);
 assert.match(html,/\.t-ck\{color:var\(--blue\);border-color:#2f4560\}/);
 const g=game();assert.equal(g.run("G.opts.diff='real';checkTag('AGI',12)"),'需要敏捷');assert.equal(g.run("G.opts.diff='hard';checkTag('AGI',12)"),'需要敏捷 12');
});

test('劇情受傷聲照標記，不看文字：玻璃割傷不播刀砍，事件音效已經有的不再疊',async()=>{const g=setup();
 assert.doesNotMatch(g.run('String(outcome)'),/hurtSnd/);assert.doesNotMatch(g.run('String(applyHaz)'),/hurtSnd/);
 await g.run("outcome(N.L0.c[2].ng,p)");assert.deepEqual(sounds(g),['hurt'],'窗框碎玻璃割手：一般受傷聲');
 g.events.length=0;await g.run("outcome(N.EVPOOL_DUMMY||EVPOOL.find(e=>e.id==='lights').c[1].ng,p)");assert.deepEqual(sounds(g),['thud']);
 g.events.length=0;g.run("check=async()=>({ok:false})");await g.run("storyHz(N.B1w.c[0].ng,p)");
 assert.deepEqual(sounds(g),['farshotsglass'],'先響槍聲和玻璃，割傷不再疊刀砍或槍彈命中');
 g.events.length=0;g.run("check=async()=>({ok:true})");await g.run("storyHz(N.B1w.c[0].ng,p)");assert.deepEqual(sounds(g),['farshotsglass'],'躲開了，已經響過的槍聲照樣聽得到');
 g.events.length=0;g.run("check=async()=>({ok:true})");await g.run("storyHz(N.BD1.c[1].ng,p)");assert.deepEqual(sounds(g),['farshots'],'成功：子彈打進牆裡，玻璃沒碎');
 g.events.length=0;g.run("check=async()=>({ok:false})");await g.run("storyHz(N.BD1.c[1].ng,p)");assert.deepEqual(sounds(g),['farshots','glassbreak']);
 g.events.length=0;g.run("check=async()=>({ok:true})");await g.run("storyHz(N.B1w.c[2].ok,p)");assert.deepEqual(sounds(g),[],'街上沒有開槍就不播槍聲');
});

test('所有扣血的劇情結果都標了 hs 或走一般受傷聲；標的都是存在的音效',()=>{const g=game();
 const bad=JSON.parse(g.run(`(()=>{const seen=new WeakSet(),out=[],ok=k=>k===''||k==='hurt'||SFILES.includes(k)||SYN[k];
  const walk=(o,p,d)=>{if(!o||typeof o!=='object'||seen.has(o)||d>14)return;seen.add(o);let ds;try{ds=Object.getOwnPropertyDescriptors(o)}catch(e){return}
   if(o.hs!==undefined&&!ok(o.hs))out.push(p+':'+o.hs);if(o.audio)for(const k of [].concat(o.audio))if(!ok(k)&&!SCUE[k])out.push(p+':'+k);
   for(const [k,x] of Object.entries(ds))if(!x.get)walk(x.value,p+'.'+k,d+1)};walk(N,'N',0);walk(EVPOOL,'EV',0);walk(HAZ,'HAZ',0);return JSON.stringify(out)})()`));
 assert.deepEqual(bad,[]);
});

test('十種隨機意外：數值不變，每一筆都有場所條件與受傷聲',()=>{const g=game();
 const h=JSON.parse(g.run("JSON.stringify([...HAZ[1],...HAZ[2]].map(h=>[h.id,h.env,h.hp,h.st,h.dc,h.inf||0,h.bleed||0,h.alarm||0,h.woundDt,typeof h.hs]))"));
 assert.deepEqual(h,[['tube','tube',3,'AGI',11,0,.4,0,'blunt','string'],['cart','cart',3,'AGI',11,0,0,0,'blunt','string'],['floor','floor',3,'AGI',12,0,0,0,'blunt','string'],['vent','vent',2,'AGI',12,5,0,0,'slash','string'],['window','window',2,'AGI',12,0,.6,0,'slash','string'],
  ['sign','sign',4,'AGI',12,0,0,0,'blunt','string'],['truck','truck',5,'AGI',13,0,0,1,'blunt','string'],['ac','ac',4,'AGI',12,0,0,0,'blunt','string'],['pipe','pipe',3,'AGI',12,0,.3,0,'blunt','string'],['crow','crow',2,'AGI',11,4,0,0,'pierce','string']]);
 assert.doesNotMatch(g.run("[...HAZ[1],...HAZ[2]].map(h=>h.t+h.ok).join('')"),/自己滑|沒人駕駛|工地/);
});

test('301 出生客房不出通用意外；沒有合理候選就略過、不設冷卻；合法的地方照常發生',async()=>{
 for(const id of ['A1','A1r','A1d','AO3']){const g=setup();g.run(`G.node='${id}';G.lv='A';G.hazCd=0;RNG=()=>0`);assert.equal(await g.run(`hazard(N['${id}'])`),false);assert.equal(g.run('p.hp'),100);assert.equal(g.run('G.hazCd'),0)}
 const g=setup();g.run("G.node='A4b';G.lv='A';G.hazCd=0;RNG=()=>0;globalThis.R=0;const r0=RNG;RNG=()=>{R++;return 0}");
 assert.deepEqual(JSON.parse(g.run("JSON.stringify(hzCands('A4b','A'))")),[]);await g.run("hazard(N.A4b)");assert.equal(g.run('G.hazCd'),0,'客房裡沒有推車：不抽、不設冷卻');assert.equal(g.run('R'),0,'沒有候選就不擲機率');
 const ids=(id,L)=>JSON.parse(g.run(`JSON.stringify(hzCands('${id}','${L}').map(h=>h.id))`));
 assert.deepEqual(ids('A3c','A'),['cart'],'三樓走廊只有推車');assert.ok(!ids('A3c','A').includes('vent'));
 assert.deepEqual(ids('AD1','A'),['tube','cart','floor']);assert.deepEqual(ids('A6b','A'),['cart','window']);
 assert.deepEqual(ids('G1','G'),['tube','vent']);assert.deepEqual(ids('P1','G'),['tube'],'停車場沒有大型風管');
 assert.deepEqual(ids('J1','J'),['sign','truck','ac','crow']);assert.deepEqual(ids('OE2','O'),['tube','cart']);
 for(const [id,L] of [['B1w','B'],['B2w','B'],['C1','C'],['U1','U']])assert.ok(!ids(id,L).includes('window'),id+' 沒有隨機窗戶');
 for(const L of ['A','B','E','G','M','O','OF','OB','L','S','U','SA'])for(const h of ids('',L))assert.ok(!['crow','truck','sign','ac','pipe'].includes(h),L+' 室內沒有戶外意外 '+h);
 // 合法走廊照常發生；同一個地方同一種意外只一次
 g.run("G.node='A3c';G.hazCd=0;RNG=()=>0;check=async()=>({ok:false})");await g.run("hazard(N.A3c)");assert.ok(g.run('p.hp')<100);assert.equal(g.run('G.hazCd'),3);assert.deepEqual(ids('A3c','A'),[]);
 assert.ok(sounds(g).includes('thud'));assert.ok(!sounds(g).includes('knife'));
});

test('同種子、同地方：隨機意外的結果一樣',async()=>{const run=async()=>{const g=setup();g.run("G.sd=12345;reseed(3,'A3c');G.node='A3c';G.lv='A';G.hazCd=0;check=async()=>({ok:false});G.opts.diff='real';G.players.push(JSON.parse(JSON.stringify(p)));G.players[1].pid='p2';G.players[1].name='乙'");
  for(let i=0;i<40;i++){g.run("G.hazCd=0;G.hzDone={}");await g.run("hazard(N.A3c)")}return g.run("LOG.map(x=>x[0]).join('|')")};
 assert.equal(await run(),await run());
});

test('遠處槍聲：beretta 短連射、壓低、濾高頻，玻璃接在後面；靜音或素材沒載入就不播',async()=>{
 const g=game();await g.run('loadSounds()');const n0=g.sources.length;const ms=g.run("shotCue('farshotsglass',1)");
 const used=g.sources.slice(n0);assert.ok(used.length>=3&&used.length<=5,'2～4 發加一聲玻璃');assert.ok(ms>0&&ms<5000);
 assert.ok(g.run("SCUE.farshots.far===1&&SCUE_FAR[1].g<.5&&SCUE_FAR[1].lp<2000"));
 g.run("UI.snd=0");assert.equal(g.run("sfx('farshots',1)"),0);
 const h=game();assert.equal(h.run("shotCue('farshots',1)"),0,'沒載入就不播、不卡');
});

test('無線電：室內聽到的通訊都有看得到的來源；文字不再反覆強調',()=>{
 assert.doesNotMatch(html,/警車的無線電開得很大聲|警車的無線電斷斷續續傳上來/);
 assert.doesNotMatch(html,/只有一聲。|只有一扇。/);
 const g=game();assert.equal(g.run("N.AM3.audio"),'radiostatic');assert.match(g.run("EVPOOL.find(e=>e.id==='yh4c').t"),/肩上的對講機/);
});
