// 主人提供的穿刺命中音效：驗證實際攻擊事件、原傷害與耐久，以及弓弩排除。
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('../tests/helpers/audio-game.cjs');
function setup(id='screwdriver'){
 const g=game();g.run(`newRun([{kind:'custom',pid:'p1',name:'測試',tal:'keen',sk:'aid',st:{STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0},load:{}}],{diff:'normal',cd:'off'},'solo');globalThis.p=G.players[0];out=()=>{};dice=async()=>{};push=()=>{};globalThis.weapon=newGear('${id}',20);p.gear.push(weapon);p.hand.R=weapon.u;p.items.arrow=10;p.items.bolt=10;G.fight={foes:[Object.assign(newFoe(0,'infected',1,false),{n:'測試敵人',hp:100,max:100})],first:false,noise:null};r2=()=>({a:15,b:15,s:15});Math.random=()=>.5;`);return g;
}
const impacts=g=>g.events.filter(e=>e.t==='s'&&e.d[0]==='piercehit');
for(const id of ['screwdriver','icepick','stake','mopspear','pipespear','firehook'])test(id+'命中播放一次穿刺音效並維持傷害與耐久',async()=>{const g=setup(id),before=g.run('weapon.dur');await g.run("attack(p,'R',null,0)");assert.equal(impacts(g).length,1);assert.equal(impacts(g)[0].d[2],1200);assert.equal(g.run('weapon.dur'),before-1);assert.ok(g.run('G.fight.foes[0].hp')<100);assert.equal(g.events.filter(e=>e.t==='slash').length,0)});
test('螺絲起子對感染者保留原有抗性後傷害3',async()=>{const g=setup();await g.run("attack(p,'R',null,0)");assert.equal(g.run('G.fight.foes[0].hp'),97)});
for(const [id,sk] of [['icepick','pierce'],['screwdriver','stab'],['darcase','dbite']])test(id+'技能'+sk+'使用穿刺命中聲',async()=>{const g=setup(id);await g.run(`attack(p,'R','${sk}',0)`);assert.equal(impacts(g).length,1)});
for(const id of ['pvcbow','compbow','handxbow','crossbow','model500','hammer','knife'])test(id+'不誤播穿刺音效',async()=>{const g=setup(id);await g.run("attack(p,'R',null,0)");assert.equal(impacts(g).length,0);assert.ok(g.run('G.fight.foes[0].hp')<100)});
for(const roll of [1,2])test('命中骰'+roll+'落空不播放穿刺命中聲',async()=>{const g=setup();g.run(`r2=()=>({a:${roll},b:${roll},s:${roll}})`);await g.run("attack(p,'R',null,0)");assert.equal(impacts(g).length,0);assert.equal(g.run('G.fight.foes[0].hp'),100)});
test('反擊沿用相同穿刺命中聲',async()=>{const g=setup();await g.run("attack(p,'R',null,0,true)");assert.equal(impacts(g).length,1)});
test('素材解碼、戰鬥音量分類與完整播放長度',async()=>{const g=game();await g.run('loadSounds()');assert.ok(g.requests.includes('sfx/piercehit.mp3'));assert.equal(g.run('SFX_CATEGORY.piercehit'),'combat');g.run('BUF.piercehit.duration=1');assert.equal(g.run("sfx('piercehit',.9,1200)"),1000);assert.equal(g.sources.at(-1).stopAt,1);assert.ok(Math.abs(g.gains.at(-1).gain.value-.6624)<1e-8)});
test('缺少素材時用既有合成受傷聲備援，靜音不發聲',async()=>{const g=game();g.requests.fail='piercehit.mp3';await g.run('loadSounds()');assert.ok(g.run('AUDIO_LOAD_STATUS.failed.has("piercehit")'));assert.ok(g.run("sfx('piercehit',.9,1200)")>0);g.run('stopSfx();UI.snd=0');const n=g.sources.length;assert.equal(g.run("sfx('piercehit',.9,1200)"),0);assert.equal(g.sources.length,n)});
test('隊友透過原有音效事件播放且重送狀態不重播',async()=>{const g=game();await g.run('loadSounds()');await g.run("ROLE='client';enqueue({t:'s',d:['piercehit',.9,1200]});enqueue({t:'st',d:JSON.parse(JSON.stringify(G))})");assert.equal(g.sources.filter(s=>s.buffer===g.run('BUF.piercehit')).length,1)});
