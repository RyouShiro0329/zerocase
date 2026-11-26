const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {game}=require('./helpers/audio-game.cjs');
const DIR=path.join(__dirname,'fixtures/saves');
function migrate(f){const g=game();g.run(`G=JSON.parse(${JSON.stringify(JSON.stringify(f.G))});G=migrateG(G)`);return {g,state:JSON.parse(g.run('JSON.stringify(G)'))}}
for(const file of fs.readdirSync(DIR).filter(f=>f.endsWith('.json'))){const fixture=JSON.parse(fs.readFileSync(path.join(DIR,file)));
 test('跨版本存檔 '+fixture.provenance.version+'：轉換、保留資料、重複載入',()=>{const {g,state:s}=migrate(fixture);
  assert.equal(s.node,fixture.expected.node);assert.equal(s.lv,fixture.expected.lv);assert.equal(s.flags.qa_preserve,1);assert.equal(s.clock,123);
  assert.equal(s.players[0].pid,fixture.G.players[0].pid);assert.deepEqual(s.players[0].items,fixture.G.players[0].items);assert.equal(s.players[0].hp,fixture.G.players[0].hp);assert.deepEqual(s.opts,fixture.G.opts);
  assert.ok(Number.isFinite(s.sd));assert.ok(Number.isFinite(s.stp));assert.ok(s.dk);assert.equal(s.stg,undefined);
  if(fixture.provenance.version==='0.59.0'){assert.ok(s.xp);assert.equal(s.dk.on.A,undefined);assert.equal(s.dk.ret,null)}
  if(fixture.provenance.version==='0.62.0'){assert.equal(s.xp.mig,4)}
  if(s.fight){assert.equal(s.fight.foes[0].fdmgTotal,0);assert.equal(s.fight.sneak,0);assert.deepEqual(s.fight.pend,{});assert.deepEqual(s.fight.order,[])}
  const again=JSON.parse(g.run('G=migrateG(G);JSON.stringify(G)'));assert.deepEqual(again,s,'重複轉換不得再次改變狀態');
  assert.equal(g.run('!!N[G.node]'),true,'轉換後節點必須存在');
 });
}
module.exports={migrate};
