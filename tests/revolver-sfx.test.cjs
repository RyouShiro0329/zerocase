const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(id){const g=game();g.run(`newRun([{kind:'custom',pid:'p1',name:'測試',tal:'keen',sk:'vital',st:{STR:3,AGI:2,CON:2,PER:3,INT:1,CHA:0},load:{}}],{diff:'normal',cd:'off'},'solo');globalThis.p=G.players[0];globalThis.__outs=[];globalThis.__dice=0;out=(t)=>{__outs.push(String(t))};dice=async()=>{__dice++};push=()=>{};globalThis.weapon=newGear('${id}');weapon.mag=30;p.gear.push(weapon);p.hand.R=weapon.u;G.fight={foes:[Object.assign(newFoe(0,'infected',1,false),{hp:200,max:200,stun:99}),Object.assign(newFoe(1,'infected',1,false),{hp:200,max:200,stun:99})],first:false};r2=()=>({a:16,b:16,s:16});Math.random=()=>.5;`);return g}
const sounds=g=>g.events.filter(e=>e.t==='s').map(e=>e.d[0]);

test('Model 10 與 Model 500 換彈為開巢、退殼、逐發塞彈、合上',()=>{const g=game();
 const r=JSON.parse(g.run(`JSON.stringify({m10:{rl:WEAP.model10.rl,rlEach:WEAP.model10.rlEach,bo:WEAP.model10.bo,ej:WEAP.model10.ej,bc:WEAP.model10.bc,load:WEAP.model10.load||null,nojam:WEAP.model10.nojam},m500:{rl:WEAP.model500.rl,rlEach:WEAP.model500.rlEach,bo:WEAP.model500.bo,ej:WEAP.model500.ej,bc:WEAP.model500.bc,mag:WEAP.model500.mag}})`));
 assert.deepEqual(r.m10,{rl:'revshell',rlEach:1,bo:'revopen',ej:'reveject',bc:'revclose',load:null,nojam:1});
 assert.deepEqual(r.m500,{rl:'revshell',rlEach:1,bo:'revopen',ej:'reveject',bc:'revclose',mag:5});
});

test('左輪空巢一次補滿並逐發播塞彈；十字弓上弦仍用 revolverCock',async()=>{
 const a=setup('model10');a.run("p.items.ammo38=10;weapon.mag=0");await a.run("execAct(p,{a:'reload',h:'R'})");
 assert.deepEqual(sounds(a),['revopen','reveject',...Array(6).fill('revshell'),'revclose']);
 assert.equal(a.run('weapon.mag'),6);
 const b=setup('model10');b.run("p.items.ammo38=10;weapon.mag=4");await b.run("execAct(p,{a:'reload',h:'R'})");
 assert.deepEqual(sounds(b),['revopen','reveject','revshell','revshell','revclose']);
 assert.equal(b.run('weapon.mag'),6);
 const c=setup('model500');c.run("p.items.ammo500=10;weapon.mag=0");await c.run("execAct(p,{a:'reload',h:'R'})");
 assert.deepEqual(sounds(c),['revopen','reveject',...Array(5).fill('revshell'),'revclose']);
 assert.equal(c.run('weapon.mag'),5);
});

test('十字弓上弦仍用 revolverCock，不用新的左輪換彈聲',async()=>{
 const d=setup('crossbow');d.run('weapon.cocked=0;p.items.bolt=5');
 await d.run("execAct(p,{a:'cock',h:'R'})");
 assert.deepEqual(sounds(d),['revolverCock']);
 assert.equal(d.run('weapon.cocked'),1);
});

test('快槍手打空後改播開巢、退殼、六發塞彈、合上，不再用左輪上膛聲',async()=>{
 const g=setup('model10');
 g.run(`G.fight={foes:[Object.assign(newFoe(0,'quickdraw',1,false),{mag:0,hp:20,max:20})],first:false};globalThis.f=G.fight.foes[0];`);
 await g.run('qdAct(f)');
 assert.deepEqual(sounds(g),['revopen','reveject',...Array(6).fill('revshell'),'revclose']);
 assert.equal(g.run('f.mag'),6);
 assert.ok(g.run('__outs.join("")').includes('甩開彈巢'));
});

test('Model 500 用專屬開槍聲，Model 10 仍用左輪槍聲',()=>{
 const g=game();
 assert.equal(g.run('WEAP.model500.snd'),'m500');
 assert.equal(g.run('GUN_VFX_CFG.model500.snd'),'m500');
 assert.equal(g.run('FALL.m500'),'fumble');
 assert.ok(g.run("SFILES.includes('m500')&&SFX_CATEGORY.m500==='combat'&&!!SFX_TRIM.m500"));
 assert.equal(g.run('WEAP.model10.snd'),'revolver');
 assert.equal(g.run('GUN_VFX_CFG.model10.snd'),'revolver');
 assert.notEqual(g.run('WEAP.model10.snd'),g.run('WEAP.model500.snd'));
});
