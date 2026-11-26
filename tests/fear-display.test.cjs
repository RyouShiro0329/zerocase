// 2026-11-26 主人定案：紀錄只顯示本次實際增減，不顯示總值或上限。
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(){const g=game();g.run("newRun([{kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0},load:{}}],{diff:'normal'},'solo');globalThis.p=G.players[0];G.lv='A';G.node='A1';LOG=[]");return g}
const logs=g=>g.run('LOG.map(x=>x[0]).join(" ")').replace(/<[^>]*>/g,'');
function deltaOnly(s){assert.doesNotMatch(s,/目前|[／/]\s*100|上限/)}
test('恐懼增加只記實際增量，上限裁切後不會把請求量寫成結果',()=>{const g=setup();g.run('p.fe=10;setFear(p,15)');assert.match(logs(g),/恐懼 \+5。/);deltaOnly(logs(g));g.run('LOG=[];p.fe=98;setFear(p,120)');assert.equal(g.run('p.fe'),100);assert.match(logs(g),/恐懼 \+2，陷入「發瘋」。/);deltaOnly(logs(g));});
test('恐懼減少只記實際減量，保留階段文字；沒有變化就不記錄',()=>{const g=setup();g.run('p.fe=50;setFear(p,24)');assert.match(logs(g),/恐懼 −26，回到「平靜」。/);deltaOnly(logs(g));g.run('LOG=[];p.fe=3;setFear(p,-5)');assert.equal(g.run('p.fe'),0);assert.match(logs(g),/恐懼 −3。/);deltaOnly(logs(g));const n=g.run('LOG.length');g.run('setFear(p,0)');assert.equal(g.run('LOG.length'),n);});
test('多人紀錄傳輸保留玩家名稱與正負差額，不傳出目前值或上限文字',()=>{const g=setup();g.run("ROLE='host';G.mode='mp';p.fe=10;setFear(p,15);setFear(p,12)");const sent=g.events.filter(e=>e.t==='o');assert.equal(sent.length,2);assert.match(sent[0].d[0],/甲/);assert.match(sent[0].d[0],/恐懼 \+5。/);assert.match(sent[1].d[0],/恐懼 −3。/);for(const e of sent){deltaOnly(e.d[0]);assert.equal(e.d[2],1)}deltaOnly(logs(g));});
