// v0.55.0（Claude 2026-11-23）：時間表、每個選項都要標時間、危險地點沒有商人
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(){const g=game();g.run("newRun([{kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'normal'},'solo');G.node='A1';G.lv='A';G.ev=null;LOG=[]");return g}
test('每個選項都明確標了時間種類（劇情節點、隨機事件、路線與搜索自動產生的選項）',()=>{const g=setup();
 const bad=JSON.parse(g.run(`JSON.stringify((()=>{const ok=new Set([...Object.keys(TCOST),'sleep','nap']);const bad=[];
  for(const [id,n] of Object.entries(N))(n.c||[]).forEach((c,i)=>{if(!ok.has(c.t))bad.push(id+'|'+i+'|'+c.l+'|'+c.t)});
  EVPOOL.forEach(e=>(e.c||[]).forEach((c,i)=>{if(!ok.has(c.t))bad.push(e.id+'|'+i+'|'+c.l+'|'+c.t)}));
  for(const id of Object.keys(N)){G.node=id;G.lv=N[id].L;G.ev=null;G.route=[];G.rs={};try{for(const c of choices())if(!c._searchMode&&!ok.has(c.t))bad.push('gen:'+id+'|'+c.l+'|'+c.t)}catch(e){}}
  return bad})())`));
 assert.deepEqual(bad,[],'沒標時間的選項：'+bad.slice(0,20).join('、'));
});
test('新時間表：一般 5～15、移動 5～15、城市之間 30～90、夜裡街上 2 小時、快速翻 5～10、繼續仔細翻 30～60、躲一陣子 30',()=>{const g=setup();
 const R=k=>JSON.parse(g.run(`JSON.stringify(TCOST.${k})`));
 assert.deepEqual(R('q'),[5,15]);assert.deepEqual(R('mv'),[5,15]);assert.deepEqual(R('c'),[30,90]);assert.deepEqual(R('sq'),[5,10]);assert.deepEqual(R('sd'),[30,60]);assert.deepEqual(R('qh'),[30,30]);assert.deepEqual(R('l'),[180,180]);
 g.run("G.lv='Z';G.t0=0;G.clock=22*60");assert.equal(g.run("tKind({l:'去醫院',t:'c'})"),'cn');assert.equal(g.run("tMin({l:'去醫院',t:'c'})"),120);
 g.run("G.clock=12*60");assert.equal(g.run("tKind({l:'去醫院',t:'c'})"),'c');
 assert.equal(g.run("tKind({l:'先不管那個箱子'})"),'q','不再從字面猜（「箱子」不會變成要很久）');
 assert.equal(g.run("tMin({l:'睡',t:'sleep'})"),480);assert.equal(g.run("tMin({l:'小睡',t:'nap'})"),240);
});
test('危險地點抽不到商人：商人事件只在有休息點的地方、營地、地鐵站',()=>{const g=setup();
 g.run("G.t0=0;G.clock=2*1440+600");const shop=L=>g.run(`evCands({L:'${L}'}).some(i=>(EVPOOL[i].c||[]).some(c=>c.ok&&c.ok.r&&c.ok.r.shop))`);
 for(const L of ['J','V','Q','O','L','S','A','E'])assert.equal(shop(L),false,L);
 assert.equal(shop('K'),true,'後巷有休息點');assert.equal(shop('Z'),true,'街區有休息點');
});
