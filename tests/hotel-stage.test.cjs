const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(flags){const g=game();g.run("newRun([{kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'normal'},'solo');G.node='Z0';G.lv='Z';G.ev=null;G.flags="+JSON.stringify(Object.assign({v_Z0:1},flags))+";deathCheck=async()=>false");return g}
test('旅館階段依城市旗標推進',()=>{const g=setup({});assert.equal(g.run('hotelStage()'),1);g.run('G.flags.blackout=1');assert.equal(g.run('hotelStage()'),2);g.run('G.flags.raiders=1');assert.equal(g.run('hotelStage()'),3);g.run('G.flags.acru=1');assert.equal(g.run('hotelStage()'),4)});
test('停電後第一次回大廳先遇到決定牌，決定後才回大廳且不再出現',async()=>{const g=setup({blackout:1});await g.run("enterNode('Y0')");assert.equal(g.run('G.node'),'YD2');await g.run("doChoice(1,G.players[0])");assert.equal(g.run('G.node'),'Y0');assert.ok(g.run('G.flags.yd2&&G.flags.yd2b'));await g.run("enterNode('Y0')");assert.equal(g.run('G.node'),'Y0')});
test('拖到下一階段沒決定，世界替玩家用預設結果決定',async()=>{const g=setup({blackout:1});await g.run("cityEvent('raid')");assert.ok(g.run('G.flags.yd2&&G.flags.yd2c&&!G.flags.yd2a&&!G.flags.yd2b'));await g.run("enterNode('Y0')");assert.equal(g.run('G.node'),'YD3')});
test('旅館事件牌只抽當階段的旅館牌，搜客房有次數上限',async()=>{const g=setup({blackout:1,yd2:1});for(let i=0;i<3;i++){await g.run("enterNode('Y1')");assert.match(g.run('EVPOOL[G.ev].id'),/^yh2/)}
 g.run("G.flags.ys2=3");assert.equal(g.run("visible(N.Y0.c.find(c=>c.l==='摸黑上樓搜客房'))"),false);assert.match(g.run('hotelTx()'),/都翻過了/)});
test('每階段牌數大於次數上限，同一局看到的是子集',()=>{for(const s of [1,2,3,4])assert.ok(setup({}).run(`EVPOOL.filter(e=>e.z==='Y'&&e.stg.includes(${s})).length`)>=setup({}).run(`HCAP[${s}]`))});
test('舊存檔（沒有 yd 旗標）不會壞：佔領階段只被引導到仍未決定的決定牌',async()=>{const g=setup({blackout:1,raiders:1,acru:1});await g.run("enterNode('Y0')");assert.equal(g.run('G.node'),'YD2')});
// v0.39.0 單向路線（docs/HOTEL_ROUTE_SPEC.md）：各區專用隨機牌與六個抉擇的後果
const opts=g=>g.run("choices().filter(visible).map(c=>c.l)");
async function pick(g,l,ok=true){const i=g.run(`choices().findIndex(c=>c.l===${JSON.stringify(l)}&&visible(c))`);assert.ok(i>=0,'找不到選項：'+l);await g.run(`(async()=>{const c=choices()[${i}];await applyRes(c,${ok}?c.ok:c.ng,G.players[0],${!ok})})()`)}
function route(g,node){g.run(`G.node='${node}';G.lv=N['${node}'].L;G.ev=null;LOG=[];globalThis.FT_LOG=[];startFight=async s=>{FT_LOG.push(s);G.fight={foes:[]};G.phase='fight'};card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{};tickAll=async()=>true;alarmCheck=async()=>false;FAST=1`)}
test('隨機事件符合所在地：電梯井、外牆有自己的牌，不抽走廊事件；商人移到旅館外的街上',async()=>{const g=setup({});
 for(const L of ['C','D']){const ids=g.run(`evCands({L:'${L}'}).map(i=>EVPOOL[i].id)`);assert.ok(ids.length>=5,L);for(const id of ids)assert.ok(!/smell|tv|kid|mirror|roomservice|phone|floor/.test(id),id)}
 for(const L of ['F','H','G','P'])assert.ok(g.run(`evCands({L:'${L}'}).filter(i=>/^[fhgp]_/.test(EVPOOL[i].id)).length`)>=3,L);
 assert.ok(!g.run("['A','B','E','H'].some(L=>evCands({L}).some(i=>EVPOOL[i].id==='trader1'))"),'旅館裡沒有商人');assert.ok(g.run("evCands({L:'J'}).some(i=>EVPOOL[i].id==='trader1')"));
 route(g,'C2x');await g.run("enterNode('C3')");assert.equal(g.run('G.node'),'C3');assert.match(g.run('EVPOOL[G.ev].id'),/^c_|^[a-z]/);assert.ok(g.run("EVPOOL[G.ev].at.includes('C')"));
});
test('D1 守住走廊：馬可在大廳、停車場幫忙；把聲音引走不用打但警戒 +1',async()=>{const g=setup({});route(g,'A6d');
 assert.equal(g.run("N.A6d.c.find(c=>c.l==='守住走廊口').ok.win.r.flag"),'corr_held');
 g.run('G.alarm=0');await pick(g,'把聲音引到 302');assert.equal(g.run('FT_LOG.length'),0);assert.ok(g.run('G.flags.corr_lured'));assert.equal(g.run('G.alarm'),1);
 route(g,'I1');assert.ok(!opts(g).includes('跟馬可會合'));g.run('G.flags.corr_held=1');assert.ok(opts(g).includes('跟馬可會合'));
 await pick(g,'跟馬可會合');assert.equal(g.run('FT_LOG[0].n'),1,'大廳只剩一隻');
 route(g,'P4');assert.ok(opts(g).includes('跟馬可一起拉開鐵捲門'));
});
test('D2 冷藏室：開門救出蘿莎＝大廳有人幫忙、知道地下室鐵門的事；不開就沒有',async()=>{const g=setup({});route(g,'F2x');
 await pick(g,'拆開拖把柄，把門打開');assert.equal(g.run('FT_LOG[0].n'),2);assert.equal(g.run('G.winR.r.flag.join()'),'freezer_open,fzhint');
 route(g,'I1');assert.ok(!opts(g).includes('讓蘿莎引開一隻'));g.run('G.flags.freezer_open=1;G.flags.fzhint=1');assert.ok(opts(g).includes('讓蘿莎引開一隻'));
 g.run('N.Y0.onEnter&&N.Y0.onEnter()');assert.equal(g.run('G.flags.knowlab'),1,'回訪旅館時知道地下室鐵門');
});
test('D3 凱文：幫他包紮＝拿到鑰匙和捷徑；鎖門休息＝他死在門外、停車場遇到他',async()=>{const g=setup({});route(g,'H2');
 const bc="choices().find(c=>c.l==='等凱文回來，幫他包紮')";g.run('for(const k of ["bandage","sbandage","med","alcohol"])delete G.players[0].items[k]');assert.equal(g.run(`choiceOk(${bc})`),false,'沒有繃帶不能選');g.run("G.players[0].items.bandage=1");
 await pick(g,'等凱文回來，幫他包紮');assert.ok(g.run('G.flags.kevin_alive&&G.flags.carkey&&G.flags.parknote'));assert.equal(g.run('G.players[0].items.bandage||0'),0);
 const g2=setup({});route(g2,'H2');await pick(g2,'把凱文的房門鎖上，躺一下');assert.ok(g2.run('G.flags.kevin_dead'));assert.ok(!opts(g2).some(l=>/等凱文回來/.test(l)),'錯過了');
 route(g2,'P1');await g2.run("enterNode('P1k')");assert.equal(g2.run('G.node'),'P1k');
});
test('D4 路易斯：止血＝他帶你走員工樓梯直接到停車場；三個選項互斥',async()=>{const g=setup({});route(g,'E3d');
 assert.deepEqual(JSON.parse(g.run('JSON.stringify(choices().filter(visible).map(c=>c.l))')),['幫他止血','打開寄放間裡那個在動的箱子','不碰，繼續走']);g.run("G.players[0].items.bandage=1");await pick(g,'幫他止血');
 assert.equal(g.run('G.node'),'E4');assert.ok(opts(g).includes('跟著路易斯走員工樓梯'));assert.equal(g.run("N.E4.c.find(c=>c.l==='跟著路易斯走員工樓梯').ok.go"),'P4');
});
test('D5 發電機：開了燈，大廳的戰鬥多一隻被燈光引來的',async()=>{const g=setup({});route(g,'I1');await pick(g,'趁它們還沒發現，先動手');const n0=g.run('FT_LOG[0].n');
 route(g,'I1');g.run('G.flags.power=1');await pick(g,'趁它們還沒發現，先動手');assert.equal(g.run('FT_LOG[0].n'),n0+1);assert.ok(g.run("FT_LOG[0].names.includes('被燈光引來的感染者')"));
});
test('D6 入住簿：不能賣；帶去分局給羅培茲警佐看，有另外的對話',async()=>{const g=setup({});route(g,'BM0');assert.ok(!opts(g).some(l=>/入住簿/.test(l)));
 g.run("G.flags.ledger=1");await g.run("N.BM0.onEnter()");assert.ok(!opts(g).some(l=>/入住簿/.test(l)),'黑市不收');
 route(g,'L1');g.run('G.flags.ledger=0');await g.run("N.L1.onEnter()");assert.ok(!opts(g).includes('給羅培茲警佐看旅館的入住簿'));
 g.run("G.flags.ledger=1");await g.run("N.L1.onEnter()");await pick(g,'給羅培茲警佐看旅館的入住簿');assert.ok(g.run('G.flags.ledgercop&&G.flags.pdok'));
 await g.run("N.L1.onEnter()");assert.ok(!opts(g).includes('給羅培茲警佐看旅館的入住簿'));
});
test('善惡值：引到 302 −2、凱文還在時鎖門休息 −1；惡越高買東西越貴，太低商人不賣、要信任的選項變難',async()=>{const g=setup({});
 const lure=g.run("JSON.stringify(Object.values(N).flatMap(n=>n.c||[]).find(c=>c.l==='把聲音引到 302').ok.r.karma)");assert.equal(+lure,-2);
 g.run("G.players[0].karma=0");assert.equal(g.run("buyPrice(G.players[0],{p:100})"),100);
 g.run("G.players[0].karma=-2");assert.equal(g.run("buyPrice(G.players[0],{p:100})"),120);
 g.run("G.players[0].karma=-4");assert.equal(g.run("buyPrice(G.players[0],{p:100})"),150);
 g.run("G.players[0].karma=5");assert.equal(g.run("buyPrice(G.players[0],{p:100})"),100,'善不打折');
 g.run("G.players[0].karma=-6");route(g,'L1');await g.run("N.L1.onEnter()");const c=JSON.parse(g.run("JSON.stringify(choices().find(c=>c.l==='幫她把一個掙脫手銬的人押回去'))"));assert.equal(c.k,'CHA');assert.equal(c.d,14);
 await g.run("openShop('jesse')");assert.notEqual(g.run('G.phase'),'shop');
});
test('賣東西：價錢是五分之一，一般商人只收自己也賣的那類，黑市什麼都收',()=>{const g=setup({});
 const j=g.run("JSON.stringify(Object.keys(ITEMS).find(k=>!shopBuys(SHOPS.jesse,k)))");assert.ok(j);assert.ok(g.run(`shopBuys(SHOPS.black,${j})`));
 const [k,v]=JSON.parse(g.run("JSON.stringify(Object.entries(PRICE).find(([k,v])=>v>=20))"));assert.equal(g.run(`sellPrice('${k}')`),Math.floor(v/5));
});
test('麥琪的內心話只送給麥琪玩家，不進共用紀錄',()=>{const g=setup({});
 g.run("globalThis.SENT=[];E=(t,d)=>SENT.push([t,d]);G.mode='mp';G.players[0].pid='other';const mg={pid:'mg',kind:'maggie'};LOG=[];outMe([mg],'秘密','lore')");
 assert.equal(g.run("JSON.stringify(SENT)"),JSON.stringify([['pv',{to:'mg',h:'秘密',c:'lore'}]]));assert.equal(g.run('LOG.length'),0);
 assert.equal(g.run("SENT=[];outMe([],'秘密','lore');SENT.length+LOG.length"),0);
});
