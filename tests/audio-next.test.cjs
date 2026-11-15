const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
test('感染者與所有人類陣營腳步依實際角色分流',()=>{
 const g=game();for(const [type,want] of [['infected','zstep'],['acru_trooper','step'],['collector','step']])assert.equal(g.run(`foeStep({type:'${type}'})`),want);
});
test('人類與感染者素材失敗時仍有不同備援',()=>{
 const g=game();assert.notEqual(g.run('FALL.step'),g.run('FALL.zstep'));assert.ok(g.run("sfx('step')")>0);assert.ok(g.run("sfx('zstep')")>0);
});
test('泵房重送不疊加，失敗或離開立即停機，成功仍運轉',async()=>{
 const g=game();await g.run('loadSounds()');g.run("G.node='WP5';G.lv='WP';syncAmbience();syncAmbience();setG(JSON.parse(JSON.stringify(G)))");
 assert.equal(g.run('soundStatus().ambient'),'pumpmix');assert.equal(g.sources.filter(s=>s.loop&&s.started).length,1);
 g.run("G.node='WP5b';G.flags.citywater=1;syncAmbience()");assert.equal(g.run('soundStatus().ambient'),'pumpmix');
 g.run('G.flags.wpfail=1;syncAmbience()');assert.equal(g.run('soundStatus().ambient'),null);
});
test('控制室只有供水成功後有管線水聲，其他場景保持安靜',async()=>{
 const g=game();await g.run('loadSounds()');g.run("G.node='WP4';G.lv='WP';syncAmbience()");assert.equal(g.sources.length,0);
 g.run('G.flags.citywater=1;syncAmbience()');assert.equal(g.run('soundStatus().ambient'),'waterpipe');g.run("G.node='Z0';G.lv='Z';syncAmbience()");assert.equal(g.run('soundStatus().ambient'),null);
});
test('無線電人聲避免重疊，關音效後可重新播放',async()=>{
 const g=game();await g.run('loadSounds()');g.run("sfx('radio23');sfx('radio24')");assert.equal(g.sources.filter(s=>s.started).length,1);
 g.run("setSoundEnabled(false);setSoundEnabled(true);sfx('radio24')");assert.equal(g.sources.filter(s=>s.started).length,2);
});
test('踩玻璃只標記實際踩踏結果，未踩的成功分支不播放',()=>{
 const g=game();g.run("resultAudio(N.I1.c.find(c=>c.l==='貼著柱子溜向大門').ok)");assert.equal(g.events.length,0);g.run("resultAudio(N.I1.c.find(c=>c.l==='貼著柱子溜向大門').ng)");assert.equal(g.events.at(-1)?.d[0],'glassstep');
});
test('真實戰鬥開場依生成敵人播放人類或感染者腳步',async()=>{
 for(const [name,want] of [['A.C.R.U. 隊員','step'],['感染者','zstep']]){
  const g=game();g.run("newRun([{kind:'custom',pid:'p1',name:'測試',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'normal'},'solo');G.lv='A';G.node='A2';passTime=async()=>false;push=()=>{};encounter=async()=>{throw new Error('停在遭遇演出之前')}");
  await assert.rejects(g.run(`startFight({n:1,names:[${JSON.stringify(name)}]})`),/停在遭遇演出之前/);assert.equal(g.events.find(x=>x.t==='s').d[0],want);
 }
});
test('人類攻擊預告使用人類腳步，明確武器預告優先',()=>{
 const g=game();g.run("out=()=>{};push=()=>{};const f={type:'acru_trooper',n:'隊員'};warnTele(f,{warn:'接近',all:1},[]);warnTele(f,{warn:'裝填',ws:'mp5Reload',all:1},[])");assert.deepEqual(g.events.map(x=>x.d[0]),['step','mp5Reload']);
});
test('真實隊友收到重複狀態不重播無線電或增加水泵',async()=>{
 const g=game();await g.run('loadSounds()');await g.run("ROLE='client';G.lv='WP';G.node='WP5';enqueue({t:'s',d:['radio02',1,4000]});enqueue({t:'st',d:JSON.parse(JSON.stringify(G))});enqueue({t:'full',d:{G:JSON.parse(JSON.stringify(G)),log:[]}})");assert.equal(g.sources.filter(s=>s.started&&!s.loop).length,1);assert.equal(g.sources.filter(s=>s.started&&s.loop).length,1);g.run('setSoundEnabled(false)');assert.ok(g.sources.every(s=>s.stopped));
});
test('舊存檔在WP5重新守泵時不受前次失敗旗標影響',async()=>{
 const g=game();await g.run('loadSounds()');g.run("G.lv='WP';G.node='WP5';G.flags.wpfail=1;setG(JSON.parse(JSON.stringify(G)))");assert.equal(g.run('soundStatus().ambient'),'pumpmix');
});
test('隊友先收到停機聲後收到狀態，不讓舊水泵循環重啟',async()=>{
 const g=game();await g.run('loadSounds()');g.run("ROLE='client';G.lv='WP';G.node='WP5';syncAmbience()");const pump=g.sources.find(s=>s.loop);
 await g.run("enqueue({t:'s',d:['pumpstop',1,8000]})");assert.equal(pump.stopped,true);g.run('syncAmbience()');assert.equal(g.run('soundStatus().ambient'),null);
 g.run("G.node='WP5b';G.flags.wpfail=1;setG(JSON.parse(JSON.stringify(G)))");assert.equal(g.run('soundStatus().ambient'),null);
 g.run("G.node='WP5';G.audioVisit++;G.flags.wpfail=0;syncAmbience()");assert.equal(g.run('soundStatus().ambient'),'pumpmix');
});
