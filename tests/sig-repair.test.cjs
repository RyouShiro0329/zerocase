// 專武修理（主人 2026-11-27 回報：訪客妲爾的手提箱修不了）：專武照自己的類別，用一般修理用品也能修；背包「要修哪一把」只列出這樣東西真的修得了的武器
const {test}=require('node:test'),assert=require('node:assert/strict');const {game}=require('./helpers/audio-game.cjs');
function setup(kind,fix){const g=game();g.run(`newRun([{kind:'${kind}',pid:'p1',name:'甲',st:{STR:0,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'hard'},'solo');globalThis.p=G.players[0];p.items={${fix}:1};globalThis.MSG=[];msgTo=(q,t)=>{MSG.push(t)}`);return g}
const CASES=[['dar','darcase'],['maggie','knuckles'],['liao','armyknife']];
test('三把專武都在角色開局裝備裡、有耐久、標成專武',()=>{for(const [kind,id] of CASES){const g=setup(kind,'tape');assert.equal(g.run(`WEAP.${id}.sig`),1);assert.equal(g.run(`p.gear.filter(x=>x.id==='${id}').length`),1,`${kind} 帶 ${id}`);assert.equal(g.run(`p.gear.find(x=>x.id==='${id}').dur`),g.run(`WEAP.${id}.dur`))}});
test('專武照自己的類別修：手提箱、指虎是鈍器（膠帶、強力膠），軍刀是刃器（磨刀石、強力膠），修理工具組都能修',async()=>{
  const want={darcase:{tape:16,superglue:14,whetstone:null,repairkit:25,gunoil:null},knuckles:{tape:16,superglue:14,whetstone:null,repairkit:25,gunoil:null},armyknife:{tape:null,superglue:14,whetstone:18,repairkit:25,gunoil:null}};
  for(const id of Object.keys(want))for(const [fix,dur] of Object.entries(want[id])){const g=setup('custom',fix);g.run(`globalThis.k=newGear('${id}');k.dur=10;p.gear.push(k)`);const ok=await g.run(`repair(p,'${fix}',k.u)`);
    assert.equal(ok,dur!=null,`${id}＋${fix}`);assert.equal(g.run('k.dur'),dur==null?10:dur,`${id}＋${fix} 耐久`);assert.equal(g.run(`p.items.${fix}||0`),dur==null?1:0,`${id}＋${fix} 用品`);
    if(dur==null)assert.match(g.run('MSG.join("")'),/不能修/)}});
test('修理不會超過上限；巧手照舊多回 50%',async()=>{const g=setup('custom','tape');g.run("globalThis.k=newGear('darcase');k.dur=48;p.gear.push(k)");await g.run("repair(p,'tape',k.u)");assert.equal(g.run('k.dur'),50);const h=setup('custom','tape');h.run("globalThis.k=newGear('darcase');k.dur=10;p.gear.push(k);p.traits=[...(p.traits||[]),'handy']");await h.run("repair(p,'tape',k.u)");assert.equal(h.run('k.dur'),19)});
test('背包「要修哪一把」只列出修得了的武器：膠帶列出手提箱、不列軍刀；槍油只列槍',()=>{const g=setup('custom','tape');g.run("p.items.gunoil=1;for(const id of ['darcase','armyknife','beretta'])p.gear.push(newGear(id,8));FIXK='tape'");
  const t=g.run("itemCol(p,false,true)");assert.match(t,/data-k="tape" >古怪的手提箱/);assert.doesNotMatch(t,/data-k="tape" >野戰軍刀/);assert.doesNotMatch(t,/data-k="tape" >貝瑞塔/);
  g.run("FIXK='gunoil'");const o=g.run("itemCol(p,false,true)");const names=[...o.matchAll(/data-k="gunoil" >([^<]+)</g)].map(x=>x[1]);assert.deepEqual(names,[g.run('WEAP.beretta.n')])});
