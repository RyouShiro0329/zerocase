const assert=require('node:assert/strict'),fs=require('node:fs');
const {game}=require('../../tests/helpers/audio-game.cjs');
const source=fs.readFileSync(require('node:path').join(__dirname,'../../index.html'),'utf8');
const realSend=source.match(/function E\(t,d\)\{[\s\S]*?(?=\nlet pushT=null)/)[0];
(async()=>{
const h=game();
h.run(`newRun([{kind:'custom',pid:'p1',name:'驗收',tal:'keen',sk:'aid',st:{STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0},load:{}}],{diff:'normal',cd:'off'},'solo');globalThis.p=G.players[0];out=()=>{};dice=async()=>{};push=()=>{};globalThis.weapon=newGear('icepick');p.gear.push(weapon);p.hand.R=weapon.u;G.fight={foes:[Object.assign(newFoe(0,'infected',1,false),{hp:100,max:100})],first:false,noise:null};r2=()=>({a:15,b:15,s:15});Math.random=()=>.5;ROLE='host';globalThis.fragments=[];NET.r={emit:(event,data)=>{fragments.push({event,data});return Promise.resolve()}};`);
h.run(realSend);
const before=h.run('snap()');await h.run("attack(p,'R',null,0)");
const parts=h.run('fragments'),groups=new Map();
for(const {event,data} of parts){assert.equal(event,'ev');if(!groups.has(data.m))groups.set(data.m,[]);groups.get(data.m)[data.i]=data.s}
const packets=[...groups.values()].map(x=>JSON.parse(x.join(''))),hits=packets.filter(x=>x.t==='pierce');
assert.equal(hits.length,1);assert.equal(hits[0].d.id,0);assert.equal(hits[0].d.melee,true);assert.equal(hits[0].d.state.fight.foes[0].hp,h.run('G.fight.foes[0].hp'));assert.ok(parts.length>1);
const c=game();c.run(`G=${JSON.stringify(before)};ROLE='client';NET.hostPeer='host-peer';`);
for(const {data} of parts)c.run(`onEv({peer:'host-peer',data:${JSON.stringify(data)}})`);
for(let i=0;i<100&&c.run('qRun');i++)await c.run('Promise.resolve()');
assert.equal(c.run('G.fight.foes[0].hp'),h.run('G.fight.foes[0].hp'));assert.equal(c.run('qRun'),false);
console.log('通過：直接載入index.html原有E/send，房主穿刺事件分片編碼及隊友onEv/pump重組接收，生命與目標一致。');
console.log('未測試：正式多人網路實連；上述使用受控傳輸端，不宣稱真實網路通過。');
})().catch(e=>{console.error(e);process.exit(1)});
