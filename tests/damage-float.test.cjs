// 傷害飄字：讀取完整遊戲，結算、顯示與快照各自驗證；不修改既有測試。
const {test}=require('node:test'),assert=require('node:assert/strict');
const {load}=require('./helpers/game-vm.cjs');
function rig(){const g=load();g.run("G.know={};G.fight={musicId:'float-1',foes:[]};globalThis.f=newFoe(0,'infected',1,0);f.n='感染者';G.fight.foes=[f];fltScan(G.fight)");return g}
const texts=g=>JSON.parse(g.run('JSON.stringify(FLT.map(x=>x.txt))'));
test('完整結算：低於、等於、超額、抗性、弱點、減傷與硬化；peek 不更動狀態',()=>{
 for(const [hp,base,extra,dts,want] of [[30,7,'',"slash",7],[14,14,'',"slash",14],[8,25,'',"slash",25],[8,20,"f.ares=['slash'];",'slash',15],[8,20,"f.type='devourer';",'fire',25],[8,20,"f.aff='heavy';",'slash',18],[8,20,'f.shell=1;','slash',15]]){
  const g=rig();g.run(`f.hp=${hp};${extra}`);const before=g.run('JSON.stringify(f)');
  assert.equal(g.run(`applyDmg(f,${base},['${dts}'],null,'peek')`),want);assert.equal(g.run('JSON.stringify(f)'),before);
  assert.equal(g.run(`applyDmg(f,${base},['${dts}'],null,true)`),want);assert.equal(g.run('f.hp'),hp-want);
  g.run('if(f.hp<=0){f.dead=1;f.hp=0}fltScan(G.fight);fltScan(G.fight)');assert.deepEqual(texts(g),['−'+want]);
 }
});
test('多段、未命中、回血、撤退、隱藏與改名：只顯示可見的真實傷害',()=>{
 const g=rig();g.run("applyDmg(f,3,['slash'],null,true);applyDmg(f,4,['slash'],null,true);f.n='改名';fltScan(G.fight);f.hp+=4;fltScan(G.fight);f.mc=1;fltScan(G.fight);f.hp=0;f.fled=1;f.dead=1;fltScan(G.fight)");assert.deepEqual(texts(g),['−7','未命中']);
 const h=rig();h.run("f.type='predator';f.hid=1;fltScan(G.fight);applyDmg(f,4,['slash'],null,true);f.mc=1;fltScan(G.fight);f.hid=0;fltScan(G.fight)");assert.deepEqual(texts(h),[]);h.run("applyDmg(f,3,['blunt'],null,true);fltScan(G.fight)");assert.deepEqual(texts(h),['−3']);
});
test('實際 snap 序列化、倒序水位、新場次與舊存檔遷移（此項不代表正式多人連線）',()=>{
 const g=rig();g.run("applyDmg(f,25,['slash'],null,true);fltScan(G.fight);globalThis.saved=snap();saved.fight.foes[0].fdmgTotal=20;fltScan(saved.fight);saved.fight.foes[0].fdmgTotal=25;fltScan(saved.fight)");assert.deepEqual(texts(g),['−25']);assert.equal(g.run('snap().fight.foes[0].fdmgTotal'),25);
 g.run("saved.fight.foes[0].fdmgTotal=29;fltScan(saved.fight)");assert.deepEqual(texts(g),['−25','−4']);
 g.run("saved.fight.musicId='float-2';fltScan(saved.fight)");assert.deepEqual(texts(g),[]);
 g.run("G.fight.foes[0].fdmgTotal=undefined;migrateG(G)");assert.equal(g.run('f.fdmgTotal'),0);g.run('f.fdmgTotal=29;migrateG(G)');assert.equal(g.run('f.fdmgTotal'),29);
});
