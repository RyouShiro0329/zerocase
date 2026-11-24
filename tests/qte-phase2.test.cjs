// v0.66.0 第二階段：敵人招式、QTE、背景豁免與戰鬥開場（主人 2026-11-25 ZEROCASE_QTE_COMBAT_PHASE2_FINAL）
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
const ST='{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2}';
function setup(type='infected',st=ST){const g=game();g.run(`newRun([{kind:'custom',pid:'p1',name:'甲',st:${st},load:{}}],{diff:'hard'},'solo');globalThis.p=G.players[0];p.max=100;p.hp=100;p.fe=0;p.inf=0;p.wounds={};globalThis.f=newFoe(0,'${type}',1,false);f.n='敵人';f.hp=f.max=99;G.fight={foes:[f],round:1,order:[],cur:null,sl:{},hb:{},bg:{},escaped:[],tUsed:{}};G.phase='fight';G.lv='A';LOG=[];globalThis.DICE=0;dice=async()=>{DICE++};globalThis.QN=0;globalThis.QT=[];qte=async(t,o)=>{QN++;QT.push({to:t.pid,now:!!o.now,log:LOG.length});return false};armorOf=()=>0;statEffects=()=>[];globalThis.SND=[];snd=(k)=>{SND.push(k);return 0};deathCheck=async()=>false;woundDeteriorate=async()=>{}`);return g}
const log=g=>g.run("LOG.map(x=>x[0]).join('\\n')");

test('背景檢定：和看得到的檢定同一顆骰、同樣的加值與自然 1／20，不跳骰子、紀錄只寫能力與成敗',async()=>{
 for(const [a,m,dc,ok] of [[1,30,5,false],[20,-30,25,true],[10,3,13,true],[10,2,13,false]]){const g=setup();g.run(`r2=()=>({a:${a},s:${a}});p.st.AGI=${m}`);
  const v=JSON.parse(await g.run(`check(p,'AGI',${dc},'看得到').then(JSON.stringify)`));const n=g.run('DICE');
  const b=JSON.parse(await g.run(`check(p,'AGI',${dc},'背景',0,{bg:'豁免'}).then(JSON.stringify)`));
  assert.deepEqual(b,v);assert.equal(v.ok,ok);assert.equal(g.run('DICE'),n,'背景不跳骰子');
  const L=g.run('LOG.at(-1)[0]');assert.match(L,/【敏捷豁免・/);assert.doesNotMatch(L,/d20|\d{2}|難度/,'不寫骰值、難度')}
 // 抵抗、合併抵抗、驚嚇都在背景
 const g=setup();g.run('r2=()=>({a:15,s:15})');await g.run('resistCheck(p,RESIST_EFFECTS.storyFear,{amount:8})');await g.run('woundJointSave(f,MOVES.infected[3],p,12)');await g.run('fright([f],[p])');
 assert.equal(g.run('DICE'),0);assert.match(log(g),/統帥抵抗/);assert.match(log(g),/力量抵抗.*體質抵抗/);
});

test('撲倒：當下就出手（不蓄力）、走 QTE、不擲避傷骰；敘述先直接出現，QTE 不等打字；冷卻照舊',async()=>{const g=setup();
 const m=JSON.parse(g.run("JSON.stringify(MOVES.infected.find(x=>x.n==='撲倒'))"));assert.ok(!m.tele);assert.equal(m.cd,3);assert.equal(m.w,2,'主人 2026-11-25 選：權重維持 2');assert.equal(g.run("hzOf(f,MOVES.infected[3])"),null);
 g.run("pickMove=(f,l)=>l?l[0]:MOVES.infected[3];foeDmg=async()=>6;globalThis.saves=[];const c0=check;check=async(...a)=>{saves.push(a[1]);return c0(...a)}");
 await g.run('foeAct(f)');assert.equal(g.run('QN'),1,'當下 QTE');assert.equal(g.run('f.charge'),undefined,'沒有蓄力');assert.equal(g.run('QT[0].now'),true);
 assert.ok(g.run("LOG.slice(0,QT[0].log).some(x=>/猛然撲了上來/.test(x[0]))"),'敘述在 QTE 之前（同時）出現');assert.deepEqual(JSON.parse(g.run('JSON.stringify(saves)')),['STR'],'只有沒躲開後的控制抵抗');
 assert.equal(g.run("f.cd['撲倒']"),4,'原本的冷卻 3 回合');
 // 飛撲照舊當下 QTE
 const h=setup('predator');await h.run("qteHit(f,MOVES.predator[2],p)");assert.equal(h.run('QN'),1);assert.match(log(h),/後腿一縮/);
});

test('常規戰鬥 QTE 只有撲倒、飛撲；普通攻擊有「撲」字也不跳 QTE；沒有全域次數上限',async()=>{const g=setup();
 const q=JSON.parse(g.run("JSON.stringify(Object.entries(MOVES).flatMap(([k,ms])=>ms.filter(m=>(m.qte||m.cover)&&!hzOf({type:k},m)).map(m=>k+'/'+m.n)))"));assert.deepEqual(q.sort(),['infected/撲倒','predator/飛撲']);
 assert.equal(g.run("Object.keys(HZMV).length"),8);
 g.run("r2=()=>({a:2,s:2})");await g.run("foeHit(f,MOVES.infected[0],p,1)");assert.equal(g.run('QN'),0,'撲咬不是 QTE');
 // 同一輪兩隻都撲倒同一個人：各自 QTE；下一輪照樣可以
 g.run("globalThis.PM0=pickMove;globalThis.f2=newFoe(1,'infected',1,false);G.fight.foes.push(f2);pickMove=(x,l)=>l?l[0]:MOVES.infected[3];foeTarget=()=>p;foeDmg=async()=>1;p.hp=100");
 await g.run('foeAct(f)');await g.run('foeAct(f2)');assert.equal(g.run('QN'),2);
 g.run("G.fight.round=5;f.cd={};f2.cd={}");await g.run('foeAct(f)');assert.equal(g.run('QN'),3,'隔一輪同一個人還是可能遇到');
 // 冷卻中的撲倒不會被選到
 g.run("G.fight.round=6;f.cd={'撲倒':9};pickMove=PM0");for(let i=0;i<30;i++)assert.notEqual(g.run("pickMove(f).n"),'撲倒');
});

test('狙擊：敏捷 15、有效掩蔽 +2；成功不擲命中，失敗照原本擲命中（不是必中）',async()=>{const g=setup('acru_sniper');
 g.run("globalThis.saves=[];globalThis.OK=[];check=async(t,st,dc,l,x,o)=>{saves.push({st,dc,x,bg:o&&o.bg});return {ok:OK.length?OK.shift():true}};globalThis.R=0;r2=()=>{R++;return {a:2,s:2}}");
 await g.run("foeHit(f,MOVES.acru_sniper[0],p,1)");assert.deepEqual(JSON.parse(g.run('JSON.stringify(saves[0])')),{st:'AGI',dc:15,x:0,bg:'豁免'});assert.equal(g.run('R'),0);assert.equal(g.run('p.hp'),100);
 g.run("OK=[false];p.stance='cover'");await g.run("foeHit(f,MOVES.acru_sniper[0],p,1)");assert.equal(g.run('saves[1].x'),2);assert.equal(g.run('R'),1,'失敗進命中骰');assert.equal(g.run('p.hp'),100,'命中骰落空就沒事');assert.equal(g.run('QN'),0);
});

test('探索：十種隨機意外改背景敏捷豁免（DC 照表），機率、挑人、結果照舊；劇情檢定背景擲、OE10 照樣跳骰子',async()=>{const g=setup();
 assert.deepEqual(JSON.parse(g.run("JSON.stringify([1,2].map(c=>HAZ[c].map(h=>h.st+h.dc)))")),[['AGI11','AGI11','AGI12','AGI12','AGI12'],['AGI12','AGI13','AGI12','AGI12','AGI11']]);
 g.run("G.fight=null;G.phase='node';G.hazCd=0;RNG=()=>0;globalThis.saves=[];check=async(t,st,dc,l,x,o)=>{saves.push({st,dc,bg:o&&o.bg});return {ok:false}};hurtP=(q,d)=>{q.hp-=d};woundImpact=async()=>{}");
 await g.run("hazard({})");assert.equal(g.run('QN'),0);assert.equal(g.run('saves[0].bg'),'豁免');assert.equal(g.run('saves[0].st'),'AGI');assert.ok(g.run('p.hp')<100);assert.equal(g.run('G.hazCd'),3);
 g.run("outcome=async()=>{}");await g.run("storyHz(N.B1w.c[0].ng,p)");assert.equal(g.run('saves.at(-1).bg'),'豁免');assert.equal(g.run('saves.at(-1).dc'),13);
 await g.run("storyHz(N.OE10.c[0].ok,p)");assert.ok(!g.run('saves.at(-1).bg'),'OE10 主動接點滴架：看得到的檢定');
 assert.equal(g.run("typeof ambushQte"),'undefined');
});

test('敵方突襲：突襲者在第 1 回合前照平常的方式先動一次，不必中、沒有 +4；一般遭遇沒有',async()=>{
 const roll=async mode=>{const g=setup();g.run(`RNG=()=>0.45;for(let i=1;i<3;i++)G.fight.foes.push(newFoe(i,'infected',1,false));G.fight.opening='${mode}';G.fight.foes.forEach((x,i)=>{x.n='感染者'+i;x.amb=i===0?1:0})`);
  await g.run("rollInit('${mode}')");return JSON.parse(g.run("JSON.stringify(G.fight.order.filter(o=>o.k==='f').map(o=>o.init))"))};
 assert.deepEqual(await roll('ambush'),await roll('normal'),'先攻沒有 +4');
 const mk=(mode,amb)=>{const g=setup();g.run("G.fight=null;G.phase='node';passTime=async()=>false;fright=async()=>{};encounter=async()=>{};globalThis.ADV=0;advance=async()=>{ADV++};globalThis.ACT=[];foeAct=async x=>{ACT.push(x.id)}");return g};
 const g=mk();await g.run("startFight({n:2,mode:'ambush',names:['感染者','感染者'],noMut:1})");
 assert.deepEqual(JSON.parse(g.run('JSON.stringify(ACT)')),[0],'只有突襲的那一隻先動一次');assert.equal(g.run('ADV'),1);assert.equal(g.run('G.fight.ambDone'),1);assert.equal(g.run('QN'),0);
 await g.run('openStart()');assert.equal(g.run('ACT.length'),1,'換房主補跑開場也不會再動一次');
 const a=mk();await a.run("startFight({n:3,mode:'ambush',amb:'all',names:['感染者','感染者','感染者'],noMut:1})");assert.equal(a.run('ACT.length'),3,'明確集體設伏全體先動');
 const n=mk();await n.run("startFight({n:1,mode:'normal',names:['感染者'],noMut:1})");assert.equal(n.run('ACT.length'),0);assert.equal(n.run('p.hp'),100);
 // 先動的那一下照常擲命中（不必中）
 const h=setup();h.run("G.fight.opening='ambush';f.amb=1;f.cd={};pickMove=()=>MOVES.infected[0];r2=()=>({a:2,s:2});foeDmg=async()=>5;advance=async()=>{}");await h.run('ambushAct()');assert.equal(h.run('p.hp'),100,'骰太低照樣落空');
 assert.match(g.run("encounterMarkup([{n:'x',img:'inf_m'}],'ambush')"),/先出手/);assert.doesNotMatch(g.run("encounterMarkup([{n:'x',img:'inf_m'}],'ambush')"),/反應成功/);
});

test('我方先制：先擲先攻，敏捷最高的一人多做一次任何行動（照常擲骰）；不占回合、順序不重擲',async()=>{
 const two=()=>{const g=setup();g.run("Object.assign(makePlayer({kind:'custom',pid:'p2',name:'乙',st:{STR:2,AGI:4,CON:2,PER:2,INT:2,CHA:2},load:{}},1),{max:100,hp:100,wounds:{}});globalThis.q=G.players[1];G.fight=null;G.phase='node';passTime=async()=>false;fright=async()=>{};encounter=async()=>{};globalThis.ADV=0;advance=async()=>{ADV++};globalThis.IM=0;const ri=rollInit;rollInit=async m=>{IM++;await ri(m)}");return g};
 const g=two();await g.run("startFight({n:2,mode:'first',names:['感染者','感染者'],noMut:1})");
 assert.equal(g.run('IM'),1,'正常擲一次先攻');assert.equal(g.run('G.fight.sneak'),1);assert.equal(g.run('G.fight.sneakBy'),'p2','敏捷最高');assert.deepEqual(JSON.parse(g.run('JSON.stringify(G.fight.group)')),['p2']);assert.equal(g.run('ADV'),0);assert.equal(g.run('G.fight.first'),false);
 const ord=g.run('JSON.stringify(G.fight.order)');
 g.run("globalThis.EX=[];execAct=async(p,a)=>{EX.push(p.pid+':'+a.a+(a.sk?'/'+a.sk:''));return true}");
 await g.run("fightAct('p1',{a:'atk',h:'R'})");assert.equal(g.run('EX.length'),0,'別人不能動');
 await g.run("fightAct('p2',{a:'atk',h:'R',sk:'shove',t:1})");assert.deepEqual(JSON.parse(g.run('JSON.stringify(EX)')),['p2:atk/shove'],'技能也可以');
 assert.equal(g.run('G.fight.sneak'),0);assert.equal(g.run('G.fight.group'),null);assert.equal(g.run('G.fight.round'),1);assert.equal(g.run('JSON.stringify(G.fight.order)'),ord,'先攻順序不重擲');assert.equal(g.run('ADV'),1);
 await g.run("fightAct('p2',{a:'atk',h:'R'})");assert.equal(g.run('EX.length'),1,'不能再送一次');
 const u=two();await u.run("startFight({n:1,mode:'first',names:['感染者'],noMut:1})");u.run("globalThis.EX=[];execAct=async(p,a)=>{EX.push(a.a);return true}");await u.run("fightAct('p2',{a:'use',k:'bandage',to:'p2'})");assert.deepEqual(JSON.parse(u.run('JSON.stringify(EX)')),['use'],'用道具也可以');
 // 同敏捷比先攻、再照隊伍順序
 const h=two();h.run("q.st.AGI=2;RNG=()=>0.45");await h.run("startFight({n:1,mode:'first',names:['感染者'],noMut:1})");assert.equal(h.run('G.fight.sneakBy'),'p1');
 // 實際打：骰 1 落空、骰 20 爆擊（不必中、照常爆擊）
 for(const [a,hit] of [[1,false],[20,true]]){const k=setup();k.run(`G.fight.sneak=1;G.fight.sneakBy='p1';G.fight.group=['p1'];G.fight.pend={};G.fight.order=[{k:'p',id:'p1',init:5}];advance=async()=>{};r2=()=>({a:${a},s:${a}});rollDmg=()=>({r:3,rs:[3],d:3})`);
  await k.run("fightAct('p1',{a:'atk',h:'R',t:0})");assert.equal(k.run('f.hp')<99,hit,'骰 '+a);if(hit)assert.ok(k.run('f.hp')<=99-6,'爆擊 ×2')}
});

test('舊存檔：舊的全隊偷襲輪不補不退、改回照常擲先攻；結算到一半換房主不重送',async()=>{const g=setup();
 g.run("G.fight.sneak=1;G.fight.round=0;G.fight.order=[{k:'p',id:'p1',init:0}];G.fight.group=['p1'];G=migrateG(JSON.parse(JSON.stringify(G)))");
 assert.equal(g.run('G.fight.sneak'),0);assert.equal(g.run('G.fight.order.length'),0);assert.equal(g.run('G.fight.round'),1);assert.equal(g.run('G.fight.group'),null);
 const h=setup();h.run("G.fight.sneak=2;G.fight.sneakBy='p1';G.fight.order=[{k:'f',id:0,init:9},{k:'p',id:'p1',init:3}];G=migrateG(JSON.parse(JSON.stringify(G)))");assert.equal(h.run('G.fight.sneak'),0);assert.equal(h.run('G.fight.order.length'),2,'已經擲好的先攻保留');
 const k=setup();k.run("G.fight.sneak=1;G.fight.sneakBy='p1';G.fight.order=[{k:'p',id:'p1',init:3}];G.fight.group=null");assert.equal(k.run('sneakResume()'),true);assert.deepEqual(JSON.parse(k.run('JSON.stringify(G.fight.group)')),['p1']);
 k.run("G.fight.sneak=2");assert.equal(k.run('sneakResume()'),false);assert.equal(k.run('G.fight.sneak'),0);
});
