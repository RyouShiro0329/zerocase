// 鈍擊命中驗收：獨立工具，不更動既有 tests/。
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require(process.env.ZC_TEST_GAME||'../tests/helpers/audio-game.cjs');
function setup(id='hammer'){
 const g=game();
 g.run("newRun([{kind:'custom',pid:'p1',name:'測試',tal:'keen',sk:'aid',st:{STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0},load:{}}],{diff:'normal',cd:'off'},'solo');globalThis.p=G.players[0];out=()=>{};dice=async()=>{};push=()=>{};globalThis.weapon=newGear('"+id+"',20);p.gear.push(weapon);p.hand.R=weapon.u;G.fight={foes:[Object.assign(newFoe(0,'infected',1,false),{n:'測試敵人',hp:100,max:100})],first:false,noise:null};r2=()=>({a:15,b:15,s:15});Math.random=()=>.5;");
 return g;
}
test('鐵鎚命中傳出一次鈍擊，傷害與耐久沿用原計算',async()=>{
 const g=setup(),dur=g.run('weapon.dur');
 await g.run("attack(p,'R',null,0)");
 const events=g.events.filter(x=>x.t==='blunt');
 assert.equal(events.length,1);assert.equal(events[0].d.id,0);
 assert.ok(events[0].d.state.fight.foes[0].hp<100);
 assert.equal(g.run('G.fight.foes[0].hp'),events[0].d.state.fight.foes[0].hp);
 assert.equal(g.run('weapon.dur'),dur-1);
 assert.equal(g.events.filter(x=>x.t==='slash').length,0);
});
test('鈍擊落空不會產生命中特效',async()=>{
 const g=setup();g.run('r2=()=>({a:2,b:2,s:2})');
 await g.run("attack(p,'R',null,0)");
 assert.equal(g.events.filter(x=>x.t==='blunt').length,0);
 assert.equal(g.run('G.fight.foes[0].hp'),100);
});
for(const id of ['knife','screwdriver','beretta'])test(id+'不誤播鈍擊',async()=>{
 const g=setup(id);await g.run("attack(p,'R',null,0)");
 assert.equal(g.events.filter(x=>x.t==='blunt').length,0);
});
test('球棒橫掃逐一播放鈍擊，不重複結算',async()=>{
 const g=setup('bat');
 g.run("G.fight.foes.push(Object.assign(newFoe(1,'infected',1,false),{n:'另一敵人',hp:100,max:100}))");
 await g.run("attack(p,'R','sweep',0)");
 assert.deepEqual(g.events.filter(x=>x.t==='blunt').map(x=>x.d.id),[0,1]);
 assert.ok(g.run('G.fight.foes.every(x=>x.hp<100)'));
});
test('致死鈍擊維持倒地與擊殺結算',async()=>{
 const g=setup();g.run('G.fight.foes[0].hp=1;teamXP=()=>{}');
 await g.run("attack(p,'R',null,0)");
 assert.equal(g.events.filter(x=>x.t==='blunt').length,1);
 assert.equal(g.run('G.fight.foes[0].dead'),1);assert.equal(g.run('G.kills'),1);
});
test('過期鈍擊封包不能還原新的血量或回合',async()=>{
 const g=setup();
 g.run("ROLE='client';globalThis.oldState=snap();G.fight.foes[0].hp=70;G.fight.round=3;SLASH_VFX.stateSeq=200");
 await g.run('playBluntHit({id:0,state:oldState},true,190)');
 assert.equal(g.run('G.fight.foes[0].hp'),70);assert.equal(g.run('G.fight.round'),3);
});
test('不同戰鬥時間的舊鈍擊不能替換戰場',async()=>{
 const g=setup();g.run("ROLE='client';globalThis.oldState=snap();G.clock+=20;G.fight.foes[0].hp=70");
 await g.run('playBluntHit({id:0,state:oldState},true,1)');
 assert.equal(g.run('G.fight.foes[0].hp'),70);
});
test('鈍擊事件保留最新連線收件序號',async()=>{
 const g=setup();
 g.run("ROLE='client';NET.hostPeer='host-peer';globalThis.oldState=snap();G.fight.foes[0].hp=70;globalThis.latest=snap();globalThis.packet=(m,o)=>onEv({peer:'host-peer',data:{m,i:0,n:1,s:JSON.stringify(o)}});packet(200,{t:'st',d:latest});packet(190,{t:'blunt',d:{id:0,state:oldState}})");
 for(let i=0;i<20&&g.run('qRun');i++)await g.run('Promise.resolve()');
 assert.equal(g.run('G.fight.foes[0].hp'),70);assert.equal(g.run('SLASH_VFX.stateSeq'),200);
});
test('鈍擊沿用斬擊335ms主命中和755ms總長',()=>{
 const g=game();assert.equal(g.run('SLASH_TIMING.impact'),335);
 assert.equal(g.run('SLASH_TIMING.total'),755);
 assert.equal(g.run("typeof bluntAttack==='function'&&typeof playBluntHit==='function'"),true);
});
