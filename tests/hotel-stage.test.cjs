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
