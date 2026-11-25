const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(id){const g=game();g.run(`newRun([{kind:'custom',pid:'p1',name:'測試',tal:'keen',sk:'vital',st:{STR:3,AGI:2,CON:2,PER:3,INT:1,CHA:0},load:{}}],{diff:'normal',cd:'off'},'solo');globalThis.p=G.players[0];globalThis.__outs=[];globalThis.__dice=0;out=(t)=>{__outs.push(String(t))};dice=async()=>{__dice++};push=()=>{};globalThis.weapon=newGear('${id}');weapon.mag=30;p.gear.push(weapon);p.hand.R=weapon.u;G.fight={foes:[Object.assign(newFoe(0,'infected',1,false),{hp:200,max:200,stun:99}),Object.assign(newFoe(1,'infected',1,false),{hp:200,max:200,stun:99})],first:false};r2=()=>({a:16,b:16,s:16});Math.random=()=>.5;`);return g}
const sounds=g=>g.events.filter(e=>e.t==='s').map(e=>e.d[0]);

test('雷明頓 870 每發之後拉泵，延遲 500ms，單管沒有拉機',()=>{const g=game();
 const r=JSON.parse(g.run(`JSON.stringify({r870:{cy:WEAP.r870.cy,cyt:WEAP.r870.cyt,rl:WEAP.r870.rl,rlEach:WEAP.r870.rlEach,uj:WEAP.r870.uj,after:GUN_VFX_CFG.r870.after},sb:{cy:WEAP.sbshot.cy||null,after:GUN_VFX_CFG.sbshot.after||null,rl:WEAP.sbshot.rl,bo:WEAP.sbshot.bo,bc:WEAP.sbshot.bc,rlEach:WEAP.sbshot.rlEach,uj:WEAP.sbshot.uj}})`));
 assert.deepEqual(r.r870,{cy:'sgpump',cyt:500,rl:'sgshell',rlEach:1,uj:'sgpump',after:['sgpump',500,.7]});
 assert.deepEqual(r.sb,{cy:null,after:null,rl:'sgshellbr',bo:'sgopen',bc:'sgclose',rlEach:1,uj:'sgopen'});
});

test('泵動裝填每發一聲填彈；折開式開膛、塞彈、關膛；栓動與彈匣槍仍一次裝填聲',async()=>{
 const a=setup('r870');a.run("p.items.shell=10;weapon.mag=6");await a.run("execAct(p,{a:'reload',h:'R'})");
 assert.deepEqual(sounds(a),['sgshell','sgshell']);
 assert.equal(a.run('weapon.mag'),8);
 const b=setup('sbshot');b.run("p.items.shell=5;weapon.mag=0");await b.run("execAct(p,{a:'reload',h:'R'})");
 assert.deepEqual(sounds(b),['sgopen','sgshellbr','sgclose']);
 assert.equal(b.run('weapon.mag'),1);
 const c=setup('model70');c.run("p.items.ammo308=10;weapon.mag=4");await c.run("execAct(p,{a:'reload',h:'R'})");
 assert.deepEqual(sounds(c),['bolt']);
 assert.equal(c.run('weapon.mag'),5);
 const d=setup('fal');d.run("p.items.ammo762=30;weapon.mag=17");await d.run("execAct(p,{a:'reload',h:'R'})");
 assert.deepEqual(sounds(d),['falReload']);
 assert.equal(d.run('weapon.mag'),20);
 const e=setup('r700');e.run("p.items.ammo308=10;weapon.mag=4");await e.run("execAct(p,{a:'reload',h:'R'})");
 assert.deepEqual(sounds(e),['bolt']);
});

test('索命客裝填改為折開、塞彈、關膛，不再用左輪上膛聲',async()=>{
 const g=setup('sbshot');
 g.run(`G.fight={foes:[Object.assign(newFoe(0,'collector',1,false),{loaded:0,hp:20,max:20})],first:false};globalThis.f=G.fight.foes[0];`);
 await g.run('collectorAct(f)');
 assert.deepEqual(sounds(g),['sgopen','sgshellbr','sgclose']);
 assert.equal(g.run('f.loaded'),1);
 assert.ok(g.run('__outs.join("")').includes('折開槍管'));
});

const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(p)).digest('hex');
const root=path.join(__dirname,'..');
test('出貨的塞彈音檔是主人指定的候選',()=>{
 assert.equal(sha(path.join(root,'sfx/sgshell.mp3')),'d471e8deeaafd4e6eaa1ae1b9d0ecf97574fb542ca2ccf3cf544e14833942ff6');
 assert.equal(sha(path.join(root,'sfx/sgshellbr.mp3')),'1482dd6df1d41a61bf5aaadfea6d6c90780b6d502d6cb6dce025a344749e13e6');
 assert.equal(sha(path.join(root,'sfx/sgclose.mp3')),'27d7c27bd05a6d286cb91fc1f529b7a631ff72f7d38e99b2ee3b86bd3d9be1a0');
});
