// 新增獨立穿刺驗收；不更動 tests/ 既有規則與斬擊驗收。
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('../tests/helpers/audio-game.cjs');
function setup(id='icepick'){
  const g=game();
  g.run(`newRun([{kind:'custom',pid:'p1',name:'測試',tal:'keen',sk:'aid',st:{STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0},load:{}}],{diff:'normal',cd:'off'},'solo');globalThis.p=G.players[0];out=()=>{};dice=async()=>{};push=()=>{};globalThis.weapon=newGear('${id}',20);p.gear.push(weapon);p.hand.R=weapon.u;G.fight={foes:[Object.assign(newFoe(0,'infected',1,false),{n:'測試敵人',hp:100,max:100})],first:false,noise:null};r2=()=>({a:15,b:15,s:15});Math.random=()=>.5;`);
  return g;
}
test('穿刺圖只在成功命中的敵人卡播放一次',async()=>{
 const g=setup();await g.run("attack(p,'R',null,0)");
 const ev=g.events.filter(x=>x.t==='pierce');assert.equal(ev.length,1);assert.equal(ev[0].d.id,0);assert.ok(ev[0].d.melee);
 assert.equal(g.events.filter(x=>x.t==='slash').length,0);assert.ok(g.run('G.fight.foes[0].hp')<100);
});
test('未命中不播放穿刺，也不扣敵人血量',async()=>{
 const g=setup();g.run('r2=()=>({a:2,b:2,s:2})');await g.run("attack(p,'R',null,0)");
 assert.equal(g.events.filter(x=>x.t==='pierce').length,0);assert.equal(g.run('G.fight.foes[0].hp'),100);
});
for(const id of ['knife','hammer','beretta'])test(id+'不誤播穿刺',async()=>{
 const g=setup(id);await g.run("attack(p,'R',null,0)");
 assert.equal(g.events.filter(x=>x.t==='pierce').length,0);
});
test('穿刺播放不新增G或玩家的特效欄位',async()=>{
 const g=setup();g.run('snap()'); // 原有snap會先透過syncCodex初始化探索紀錄，與特效無關。
 const before=g.run('Object.keys(G).join(",")'),playerBefore=g.run('Object.keys(p).sort().join(",")');await g.run("attack(p,'R',null,0)");
 assert.equal(g.run('Object.keys(G).join(",")'),before);
 assert.equal(g.run('Object.keys(p).sort().join(",")'),playerBefore);
 assert.equal(g.run('JSON.stringify(snap()).includes("PIERCE_VFX")'),false);
});
test('穿刺12格由下向上，335ms命中，780ms收尾',()=>{
 const g=game();for(const [ms,i] of [[0,0],[104,0],[105,1],[189,1],[190,2],[254,2],[255,3],[299,3],[300,4],[334,4],[335,5],[409,5],[410,6],[459,6],[460,7],[514,7],[515,8],[569,8],[570,9],[634,9],[635,10],[704,10],[705,11],[779,11],[780,-1],[-1,-1]])assert.equal(g.run('pierceFrame('+ms+')'),i,'時間 '+ms);
});
test('過期穿刺事件不能倒灌新生命或回合',async()=>{
 const g=setup();g.run("ROLE='client';globalThis.oldState=snap();G.fight.foes[0].hp=70;G.fight.round=3;SLASH_VFX.stateSeq=200");
 await g.run('playPierceHit({id:0,melee:true,state:oldState},true,190)');
 assert.equal(g.run('G.fight.foes[0].hp'),70);assert.equal(g.run('G.fight.round'),3);
});
test('不同戰鬥的舊快照不影響新戰鬥',async()=>{
 const g=setup();g.run("ROLE='client';globalThis.oldState=snap();G.clock+=20;G.fight.foes[0].hp=80;SLASH_VFX.stateSeq=0");
 await g.run('playPierceHit({id:0,melee:true,state:oldState},true,190)');
 assert.equal(g.run('G.fight.foes[0].hp'),80);
});
test('經真正收件佇列丟棄較舊穿刺事件',async()=>{
 const g=setup();g.run("ROLE='client';NET.hostPeer='host-peer';globalThis.oldState=snap();G.fight.foes[0].hp=70;globalThis.latest=snap();globalThis.packet=(m,o)=>onEv({peer:'host-peer',data:{m,i:0,n:1,s:JSON.stringify(o)}});packet(200,{t:'st',d:latest});packet(190,{t:'pierce',d:{id:0,melee:true,state:oldState}})");
 for(let i=0;i<20&&g.run('qRun');i++)await g.run('Promise.resolve()');
 assert.equal(g.run('G.fight.foes[0].hp'),70);assert.equal(g.run('SLASH_VFX.stateSeq'),200);
});
test('房主交接可接受新房主較小序號的穿刺',async()=>{
 const g=setup();g.run("ROLE='client';SLASH_VFX.peer='new-host';SLASH_VFX.stateSeq=0;globalThis.before=snap();globalThis.after=snap();after.fight.foes[0].hp=90;Q.push({t:'st',peer:'old-host',seq:500,d:before},{t:'pierce',peer:'new-host',seq:2,d:{id:0,melee:true,state:after}})");
 await g.run('pump()');assert.equal(g.run('G.fight.foes[0].hp'),90);assert.equal(g.run('SLASH_VFX.stateSeq'),2);
});
test('多段穿刺每一段分別指向正確敵人且不誤播斬擊',async()=>{
 const g=setup('mopspear');g.run("G.fight.foes.push(Object.assign(newFoe(1,'infected',1,false),{n:'另一敵人',hp:100,max:100}))");
 // 每個被命中的穿刺目標應有一筆事件，且不可觸發斬擊特效。
 await g.run("attack(p,'R',null,0)");assert.deepEqual(g.events.filter(x=>x.t==='pierce').map(x=>x.d.id),[0]);
 assert.equal(g.events.filter(x=>x.t==='slash').length,0);
});
test('致死穿刺先送出演出再結算一次死亡，維持冰鑿傷害與耐久',async()=>{
 const g=setup();g.run('G.fight.foes[0].hp=1;teamXP=()=>{}');await g.run("attack(p,'R',null,0)");
 const ev=g.events.filter(x=>x.t==='pierce');assert.equal(ev.length,1);assert.equal(!!ev[0].d.state.fight.foes[0].dead,false);
 assert.equal(g.run('G.fight.foes[0].dead'),1);assert.equal(g.run('G.kills'),1);assert.equal(g.run('weapon.dur'),19);
});
test('弓二連射每段各播放一次，不重複刀聲且耗箭兩支',async()=>{
 const g=setup('compbow');g.run('p.items.arrow=5');await g.run("attack(p,'R','double2',0)");
 const ev=g.events.filter(x=>x.t==='pierce');assert.deepEqual(ev.map(x=>x.d.id),[0,0]);assert.ok(ev.every(x=>!x.d.melee));
 assert.equal(g.run('p.items.arrow'),3);assert.equal(g.events.filter(x=>x.t==='s'&&x.d[0]==='knife').length,0);
 assert.equal(g.events.filter(x=>x.t==='s'&&x.d[0]==='bowhit').length,2);
});
test('十字弓貫穿逐一對準兩目標，第二目標仍維持原傷害',async()=>{
 const g=setup('crossbow');g.run("p.items.bolt=3;weapon.cocked=1;G.fight.foes.push(Object.assign(newFoe(1,'infected',1,false),{hp:100,max:100}))");
 await g.run("attack(p,'R','pierce',0)");assert.deepEqual(g.events.filter(x=>x.t==='pierce').map(x=>x.d.id),[0,1]);
 assert.ok(g.run('G.fight.foes.every(x=>x.hp<100)'));assert.equal(g.run('G.fight.foes[0].hp'),g.run('G.fight.foes[1].hp'));
 assert.equal(g.run('p.items.bolt'),2);assert.equal(g.run('weapon.cocked'),0);
});
