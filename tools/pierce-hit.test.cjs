// 穿刺特效專項：不修改 tests/ 既有測試；確認命中、連線、傷害與資源計算。
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('../tests/helpers/audio-game.cjs');
function setup(id='screwdriver'){
 const g=game();
 g.run(`newRun([{kind:'custom',pid:'p1',name:'測試',tal:'keen',sk:'aid',st:{STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0},load:{}}],{diff:'normal',cd:'off'},'solo');globalThis.p=G.players[0];out=()=>{};dice=async()=>{};push=()=>{};globalThis.weapon=newGear('${id}',20);p.gear.push(weapon);p.hand.R=weapon.u;G.fight={foes:[Object.assign(newFoe(0,'infected',1,false),{n:'測試敵人',hp:100,max:100})],first:false,noise:null};r2=()=>({a:15,b:15,s:15});Math.random=()=>.5;`);
 return g;
}
test('近戰穿刺命中只送一次演出，血量、耐久仍依既有規則結算',async()=>{
 const g=setup(),before=g.run('weapon.dur');await g.run("attack(p,'R',null,0)");
 const ev=g.events.filter(x=>x.t==='pierce');assert.equal(ev.length,1);assert.equal(ev[0].d.id,0);assert.equal(ev[0].d.melee,true);
 assert.equal(g.run('G.fight.foes[0].hp'),ev[0].d.state.fight.foes[0].hp);assert.ok(g.run('G.fight.foes[0].hp')<100);
 assert.equal(g.run('weapon.dur'),before-1);assert.equal(g.events.filter(x=>x.t==='slash').length,0);
});
test('冰鑿穿刺走相同命中演出',async()=>{const g=setup('icepick');await g.run("attack(p,'R',null,0)");assert.equal(g.events.filter(x=>x.t==='pierce').length,1)});
test('未命中不可觸發穿刺',async()=>{const g=setup();g.run('r2=()=>({a:2,b:2,s:2})');await g.run("attack(p,'R',null,0)");assert.equal(g.events.filter(x=>x.t==='pierce').length,0);assert.equal(g.run('G.fight.foes[0].hp'),100)});
for(const id of ['knife','hammer','beretta'])test(id+'不是穿刺不可誤播',async()=>{
 const g=setup(id);await g.run("attack(p,'R',null,0)");assert.equal(g.events.filter(x=>x.t==='pierce').length,0);
});
test('穿刺致死只結算一次，不額外修改死亡規則',async()=>{
 const g=setup();g.run('G.fight.foes[0].hp=1;teamXP=()=>{}');await g.run("attack(p,'R',null,0)");
 assert.equal(g.events.filter(x=>x.t==='pierce').length,1);assert.equal(g.run('G.fight.foes[0].dead'),1);assert.equal(g.run('G.kills'),1);
});
test('過期穿刺事件不得還原較新的生命及回合',async()=>{
 const g=setup();g.run("ROLE='client';globalThis.oldState=snap();G.fight.foes[0].hp=70;G.fight.round=3;SLASH_VFX.stateSeq=200");
 await g.run('playPierceHit({id:0,melee:true,state:oldState},true,190)');
 assert.equal(g.run('G.fight.foes[0].hp'),70);assert.equal(g.run('G.fight.round'),3);
});
test('同位置另一場戰鬥的舊穿刺事件不得覆蓋',async()=>{
 const g=setup();g.run("ROLE='client';globalThis.oldState=snap();G.clock+=20;G.fight.foes[0].hp=80");
 await g.run('playPierceHit({id:0,melee:true,state:oldState},true,190)');
 assert.equal(g.run('G.fight.foes[0].hp'),80);
});
test('穿刺事件經現有連線佇列遵守狀態封包序號',async()=>{
 const g=setup();g.run("ROLE='client';NET.hostPeer='host';globalThis.old=snap();G.fight.foes[0].hp=70;globalThis.latest=snap();globalThis.packet=(m,o)=>onEv({peer:'host',data:{m,i:0,n:1,s:JSON.stringify(o)}});packet(200,{t:'st',d:latest});packet(190,{t:'pierce',d:{id:0,state:old}})");
 for(let i=0;i<20&&g.run('qRun');i++)await g.run('Promise.resolve()');
 assert.equal(g.run('G.fight.foes[0].hp'),70);assert.equal(g.run('SLASH_VFX.stateSeq'),200);
});
test('穿刺時間與12格完整收尾',()=>{
 const g=game();assert.equal(g.run('PIERCE_TIMING.frames.reduce((a,b)=>a+b,0)'),755);
 for(const [ms,f] of [[0,0],[89,0],[90,1],[159,1],[160,2],[349,5],[350,6],[754,11],[755,-1],[-1,-1]])assert.equal(g.run('pierceFrame('+ms+')'),f);
});
