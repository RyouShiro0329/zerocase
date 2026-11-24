// v0.65.0 QTE 重構、危險檢定、戰鬥演出（主人 2026-11-24 定案：ZEROCASE_QTE_BGM_REWORK_SPEC）
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(type='infected',st='{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2}',diff='hard'){const g=game();g.run(`newRun([{kind:'custom',pid:'p1',name:'甲',st:${st},load:{}}],{diff:'${diff}'},'solo');globalThis.p=G.players[0];p.max=100;p.hp=100;p.fe=0;p.inf=0;p.wounds={};globalThis.f={id:0,type:'${type}',n:'敵人',hp:50,max:50};G.fight={foes:[f],round:1,order:[],cur:null};G.phase='fight';G.lv='A';LOG=[];dice=async()=>{};globalThis.QN=0;qte=async()=>{QN++;return false};armorOf=()=>0;statEffects=()=>[];globalThis.saves=[];globalThis.OK=[];check=async(t,st,dc,label,extra)=>{saves.push({st,dc,label,extra});const ok=OK.length?OK.shift():true;return {ok,crit:false,fumble:false}};globalThis.SND=[];snd=(k)=>{SND.push(k);return 0}`);return g}
const mv=(g,type,n)=>`MOVES['${type}'].find(m=>m.n==='${n}')`;
// 逐招表（第 3 節）：[種類, 招式, 沒防守能力, 有效防守, 有防守時能力, DC, 成功效果]
/* v0.66.0（主人 2026-11-25 第 3 節）：撲倒改回瞬間 QTE、狙擊改敏捷豁免（有效掩蔽 +2） */
const TABLE=[['acru_sniper','狙擊','AGI','cover','AGI',15,'dodge'],['incubator','丟擲囊泡','AGI','cover','AGI',12,'dodge'],['incubator','噴吐','AGI',null,null,12,'part'],
 ['devourer','震盪重擊','AGI','block','STR',13,'dodge'],['cutter','割喉','AGI','block','STR',14,'dodge'],['harvester','收割','AGI','block','STR',15,'dodge'],
 ['arsonist','投擲燃燒瓶','AGI',null,null,12,'dodge'],['acru_flamer','噴火','AGI',null,null,14,'part']];

test('逐招表：八招改危險檢定、能力與 DC 照表；撲倒、飛撲是瞬間 QTE；三種難度 DC 一樣',async()=>{
 for(const diff of ['normal','hard','real'])for(const [type,n,s0,,,dc,k] of TABLE){const g=setup(type,undefined,diff);
  assert.deepEqual(JSON.parse(g.run(`JSON.stringify(hzOf(f,${mv(g,type,n)}))`)).k,k);
  await g.run(`foeHit(f,${mv(g,type,n)},p,1)`);assert.equal(g.run('QN'),0,`${n} 不再跳 QTE`);
  const s=JSON.parse(g.run('JSON.stringify(saves[0])'));assert.equal(s.st,s0,n);assert.equal(s.dc,dc,`${n}（${diff}）`);assert.equal(s.extra,0)}
 for(const [type,n] of [['predator','飛撲'],['infected','撲倒']]){const g=setup(type);assert.equal(g.run(`hzOf(f,${mv(g,type,n)})`),null);g.run("r2=()=>({a:1,s:1})");await g.run(`foeHit(f,${mv(g,type,n)},p,1)`);assert.equal(g.run('QN'),1,n+' 保留 QTE');assert.ok(!g.run('saves').some(x=>x.dc===11||x.label&&/躲開|抵住|格擋|掩蔽/.test(x.label)),n+' 沒有改擲骰')}
 // 一般攻擊不變：沒有 qte 的招式走原本的命中骰
 const g=setup();g.run("globalThis.R=0;r2=()=>{R++;return {a:1,s:1}}");await g.run(`foeHit(f,${mv(g,'infected','撲咬')},p,1)`);assert.equal(g.run('R'),1);assert.equal(g.run('saves.length'),0);
 assert.equal(g.run("Object.keys(HZMV).length"),8);
});

test('有效防守才 +2、依防守切換能力，不自動取最高能力；不適用的防守沒有加成',async()=>{
 for(const [type,n,,gd,s1,dc] of TABLE){const g=setup(type,'{STR:0,AGI:5,CON:2,PER:2,INT:2,CHA:2}');g.run(`p.stance='${gd||'block'}'`);await g.run(`foeHit(f,${mv(g,type,n)},p,1)`);
  const s=JSON.parse(g.run('JSON.stringify(saves[0])'));if(gd&&g.run(`stanceOf(p,f,${mv(g,type,n)}).half`)){assert.equal(s.st,s1,n);assert.equal(s.extra,2,n)}else{assert.equal(s.st,'AGI',n);assert.equal(s.extra,0,n+' 沒有新增防守加成')}}
 // 沒防守：巨噬、割喉、收割一律敏捷，就算力量比較高
 for(const [type,n] of [['devourer','震盪重擊'],['cutter','割喉'],['harvester','收割']]){const g=setup(type,'{STR:5,AGI:0,CON:2,PER:2,INT:2,CHA:2}');await g.run(`foeHit(f,${mv(g,type,n)},p,1)`);assert.equal(g.run('saves[0].st'),'AGI',n)}
 // 盲目的敵人：防守不算數
 const g=setup('devourer');g.run("p.stance='block';f.aff='blind'");await g.run(`foeHit(f,${mv(g,'devourer','震盪重擊')},p,1)`);assert.equal(g.run('saves[0].st'),'AGI');assert.equal(g.run('saves[0].extra'),0);
});

test('完全避開：沒有傷害、感染、負面狀態、傷勢，不擲控制抵抗，不播受傷聲',async()=>{
 for(const [type,n] of TABLE.filter(x=>x[6]==='dodge')){const g=setup(type);g.run('p.bleed=1');await g.run(`foeHit(f,${mv(g,type,n)},p,1)`);
  assert.equal(g.run('p.hp'),100,n);assert.equal(g.run('p.inf'),0,n);assert.equal(g.run('saves.length'),1,n+' 只擲一次');
  assert.ok(!g.run('p.unbal||p.dazed||p.humus||p.burn'),n);assert.equal(g.run('Object.keys(p.wounds).length'),0);assert.equal(g.run('p.bleed'),1,'原本的流血不被清掉');
  assert.ok(!g.run("SND.some(k=>['thud','smash','claw','knife','splat','bite'].includes(k))"),n+' 沒有受傷聲')}
});

test('沒躲開：照原本完整命中；格擋、掩蔽失敗仍有原本的減傷，控制抵抗照舊（一次避傷＋一次抵抗）',async()=>{
 /* v0.66.0：撲倒改回瞬間 QTE，QTE 沒躲開就不再另擲避傷，只剩控制抵抗 */const g=setup('infected','{STR:3,AGI:2,CON:2,PER:2,INT:2,CHA:2}');g.run('OK=[false];foeDmg=async()=>10');await g.run(`foeHit(f,${mv(g,'infected','撲倒')},p,1)`);
 assert.equal(g.run('p.hp'),91);assert.ok(g.run('p.inf')>0);assert.equal(g.run('p.unbal'),1);assert.equal(g.run('QN'),1);assert.equal(g.run('saves.length'),1,'QTE 一次、控制一次');assert.equal(g.run('saves[0].dc'),12);
 const b=setup('infected','{STR:3,AGI:2,CON:2,PER:2,INT:2,CHA:2}');b.run("OK=[true];foeDmg=async()=>10;p.stance='block'");await b.run(`foeHit(f,${mv(b,'infected','撲倒')},p,1)`);
 assert.equal(b.run('p.hp'),96,'格擋失敗仍減半');assert.equal(b.run('saves[0].extra'),2,'力量控制抵抗原本的格擋 +2 照舊');
 const d=setup('devourer','{STR:3,AGI:2,CON:2,PER:2,INT:2,CHA:2}');d.run("OK=[false,true];foeDmg=async()=>10;p.stance='block'");await d.run(`foeHit(f,${mv(d,'devourer','震盪重擊')},p,1)`);
 assert.equal(d.run('p.hp'),96,'格擋豁免失敗仍減半');assert.equal(d.run('saves[0].extra'),2);assert.equal(d.run('saves.length'),2,'避傷一次、控制一次');
 const c=setup('incubator');c.run("OK=[false];foeDmg=async()=>10;p.stance='cover'");await c.run(`foeHit(f,${mv(c,'incubator','丟擲囊泡')},p,1)`);assert.equal(c.run('p.hp'),95,'掩蔽失敗仍減半');assert.ok(c.run('p.humus')>0,'掩蔽不擋腐殖');
});

test('部分命中：噴吐、噴火成功傷害與感染各減半（向上取整），不新增燃燒；失敗照原本',async()=>{
 for(const raw of [7,8]){const g=setup('incubator');g.run(`foeDmg=async()=>${raw}`);await g.run(`foeHit(f,${mv(g,'incubator','噴吐')},p,1)`);assert.equal(g.run('p.hp'),100-Math.ceil(raw/2),'噴吐 '+raw);
  assert.equal(g.run('p.inf'),g.run('(()=>{const q={inf:0,traits:[]};addInf(q,Math.ceil(4/2));return q.inf})()'),'感染增量減半')}
 const f1=setup('acru_flamer');f1.run('foeDmg=async()=>7');await f1.run(`foeHit(f,${mv(f1,'acru_flamer','噴火')},p,1)`);assert.equal(f1.run('p.hp'),96);assert.ok(!f1.run('p.burn'),'部分命中不新增燃燒');
 assert.match(f1.run("LOG.map(x=>x[0]).join('')"),/火舌只掃到邊緣/);assert.doesNotMatch(f1.run("LOG.map(x=>x[0]).join('')"),/著火/);
 const f2=setup('acru_flamer');f2.run('OK=[false];foeDmg=async()=>7');await f2.run(`foeHit(f,${mv(f2,'acru_flamer','噴火')},p,1)`);assert.equal(f2.run('p.hp'),93);assert.equal(f2.run('p.burn'),3,'失敗照原本燒起來');
 const b=setup('incubator');b.run('p.burn=2;foeDmg=async()=>6');await b.run(`foeHit(f,${mv(b,'incubator','噴吐')},p,1)`);assert.equal(b.run('p.burn'),2,'原本的燃燒不被清掉');
});

test('全體攻擊：每個受影響的人各自擲；敵人互打不擲玩家檢定',async()=>{const g=setup('incubator');
 g.run("Object.assign(makePlayer({kind:'custom',pid:'p2',name:'乙',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}},1),{max:100,hp:100,wounds:{}});OK=[true,false];foeDmg=async()=>6");
 await g.run(`strike(f,${mv(g,'incubator','噴吐')},able())`);assert.equal(g.run('saves.length'),2);assert.equal(g.run('G.players[0].hp'),97);assert.equal(g.run('G.players[1].hp'),94);
 const h=setup('arsonist');h.run("globalThis.x={id:1,type:'infected',n:'感染者',hp:30,max:30};G.fight.foes.push(x);r2=()=>({a:15,s:15});foeDmg=async()=>4");await h.run(`foeVsFoe(f,${mv(h,'arsonist','投擲燃燒瓶')},x)`);assert.equal(h.run('saves.length'),0);
});

test('危險檢定沿用一般檢定（v0.66.0 改用震盪重擊測，撲倒改回 QTE）：自然 1 失敗、20 成功；不蓋掉劇情主檢定的結果（LASTJ）',async()=>{
 const g=setup('devourer');const h=game();g.run('check=('+h.run('check.toString()')+')');
 g.run("r2=()=>({a:1,s:1});p.st.AGI=30;LASTJ='crit'");assert.equal(await g.run(`hzRoll(f,${mv(g,'devourer','震盪重擊')},p,hzOf(f,${mv(g,'devourer','震盪重擊')}))`),'hit');assert.equal(g.run('LASTJ'),'crit');
 g.run("r2=()=>({a:20,s:20});p.st.AGI=-20");assert.equal(await g.run(`hzRoll(f,${mv(g,'devourer','震盪重擊')},p,hzOf(f,${mv(g,'devourer','震盪重擊')}))`),'dodge');
 g.run("r2=()=>({a:10,s:10});p.st.AGI=3");assert.equal(await g.run(`hzRoll(f,${mv(g,'devourer','震盪重擊')},p,hzOf(f,${mv(g,'devourer','震盪重擊')}))`),'dodge','10+3＝13 剛好過');
 g.run("p.st.AGI=2");assert.equal(await g.run(`hzRoll(f,${mv(g,'devourer','震盪重擊')},p,hzOf(f,${mv(g,'devourer','震盪重擊')}))`),'hit','10 差一點');
});

test('舊存檔蓄力中的招式照新表分類（目標、冷卻保留）；預告不再寫「要反應」',async()=>{const g=setup('devourer');
 g.run(`f.charge={m:JSON.parse(JSON.stringify(${mv(g,'devourer','震盪重擊')})),to:'p1'};G=migrateG(JSON.parse(JSON.stringify(G)));globalThis.f=G.fight.foes[0];globalThis.p=G.players[0];p.hp=100;p.max=100`);
 assert.ok(g.run('!!hzOf(f,f.charge.m)'));assert.equal(g.run('f.charge.to'),'p1');
 g.run(`warnTele(f,${mv(g,'devourer','震盪重擊')},[p])`);assert.doesNotMatch(g.run("LOG.at(-1)[0]"),/要反應/);
 const s=setup('acru_sniper');s.run(`warnTele(f,${mv(s,'acru_sniper','狙擊')},[p])`);assert.doesNotMatch(s.run("LOG.at(-1)[0]"),/要反應/,'v0.66.0 狙擊改敏捷豁免，預告不再寫要反應');assert.match(s.run("LOG.at(-1)[0]"),/紅光/,'原本的瞄準預告保留');
});

test('探索：被抓住、抓鋼索改力量檢定，氯氣改體質（戴面具不擲）；v0.66.0 其他 11 筆也改敏捷檢定，劇情不再有 QTE',async()=>{const g=setup();
 const list=JSON.parse(g.run(`JSON.stringify((()=>{const o={qte:[],hz:[]};const seen=new Set();const walk=(x,p)=>{if(!x||typeof x!=='object'||seen.has(x))return;seen.add(x);if(x.qte&&typeof x.qte==='object')o.qte.push(p);if(x.hz)o.hz.push(p+':'+x.hz.st+x.hz.dc);for(const k of Object.keys(x)){if(k==='qte'||k==='hz')continue;let v;try{v=x[k]}catch(e){continue}walk(v,p+'.'+k)}};walk(N,'N');walk(EVPOOL,'E');return o})())`));
 assert.deepEqual(list.hz.sort(),['N.C2.c.1.ok:STR12','N.OF2a.c.1.ng:STR12','N.OF2a.c.2.ng:STR12','N.OF4b.c.0.ng:STR12','N.OF6.c.0.ng:STR12','N.WP3.c.0.ok:CON12',
  'N.AD1.c.0.tb.1:AGI12','N.B1w.c.0.ng:AGI13','N.B1w.c.2.ok:AGI13','N.B2w.c.0.ng:AGI13','N.B2w.c.2.ng:AGI13','N.BD1.c.1.ng:AGI13','N.BD2.c.1.tb.1:AGI13','N.BD6.c.1.ng:AGI13','N.J2.c.0.ok:AGI12','N.OE10.c.0.ok:AGI12','N.PP5.c.1.ok:AGI13'].sort());
 assert.deepEqual(list.qte,[],'v0.66.0（主人 2026-11-25 第 4.1 節）：劇情 QTE 全部改成檢定');
 // 被抓住：力量成功＝原本 QTE 成功的結果，失敗＝原本失敗的結果；由實際做的人擲
 g.run("p.hp=20;p.max=20;p.inf=0;OK=[false];outcome=async(r,a)=>{if(r.p&&r.p.hp)a.hp+=r.p.hp;if(r.p&&r.p.inf)a.inf+=r.p.inf}");
 await g.run("storyHz(N.OF2a.c[1].ng,p)");assert.equal(g.run('p.hp'),17);assert.equal(g.run('p.inf'),6);assert.equal(g.run('saves.at(-1).st'),'STR');assert.equal(g.run('QN'),0);
 g.run("OK=[true]");await g.run("storyHz(N.OF2a.c[1].ng,p)");assert.equal(g.run('p.hp'),17);
 // 氯氣：戴著有濾罐的防毒面具不擲；沒戴擲體質，成功減半
 g.run("saves.length=0;p.eq.face={k:'gasmask'};p.mf=100");const r=await g.run("storyHz(N.WP3.c[0].ok,p).then(x=>x===N.WP3.c[0].ok.hz.mk)");assert.equal(r,true);assert.equal(g.run('saves.length'),0);
 g.run("p.eq.face=null;OK=[true]");await g.run("storyHz(N.WP3.c[0].ok,p)");assert.equal(g.run('saves.at(-1).st'),'CON');assert.equal(g.run('p.hp'),15,'成功減半：−2');
 // QTE 本身沒有改
 assert.doesNotMatch(g.run('String(qte)+String(qteLocal)+String(storyQte)'),/r2\(|check\(|dice\(|storyHz/);
});

test('演出時間軸：時間點在總長之內、遭遇與亂入 2～3 秒、結束 1～2 秒；沒有音樂也照時間走完',async()=>{const g=setup();
 const L=JSON.parse(g.run('JSON.stringify(STGL)'));for(const [k,T] of Object.entries(L)){for(const t of Object.values(T.m))assert.ok(t>0&&t<T.dur,k);
  if(k.startsWith('end'))assert.ok(T.dur>=1000&&T.dur<=2000,k);else assert.ok(T.dur>=2000&&T.dur<=3000,k)}
 g.run("UI.bgm=0;G.fight={foes:[],musicId:'m1'};globalThis.id=stgOpen('enc','battle',{foes:[]})");assert.equal(g.run('stgOn()'),true);
 await g.run('stgWait(id)');g.run('stgClose(id)');assert.equal(g.run('stgOn()'),false);assert.equal(g.run('G.stg'),null);
});

test('演出期間：指令一律作廢、不排隊；快照帶剩餘時間；舊存檔不會重播；隊友照剩餘時間接上',async()=>{const g=setup();
 g.run("G.fight=null;G.phase='node';globalThis.V=0;vote=()=>{V++};globalThis.id=stgOpen('end','explore',{t:'x'})");
 g.run("handle('p1',{a:'vote',i:0,s:G.stp})");assert.equal(g.run('V'),0,'演出中的投票作廢');
 const s=JSON.parse(g.run('JSON.stringify(snap())'));assert.ok(s.stg.left>0&&s.stg.left<=s.stg.dur);assert.equal(s.stg.at,undefined);
 assert.equal(g.run('migrateG(JSON.parse(JSON.stringify(G))).stg'),undefined);
 g.run('stgClose(id)');g.run("handle('p1',{a:'vote',i:0,s:G.stp})");assert.equal(g.run('V'),1,'演完照常');
 // 隊友：晚 800ms 收到，從目前進度接上，不從頭
 g.run("ROLE='client';stgSyncIn({stg:{id:'z',dur:2500,left:1700}})");assert.ok(Math.abs(g.run('Date.now()-STGV.anchor')-800)<50);
 g.run("G.stg={id:'z',dur:2500,left:1700}");assert.equal(g.run('stgOn()'),true);g.run("stgClose('z')");assert.ok(g.run('!!G.stg'),'隊友端不能自己解鎖');
});

test('真實 startFight：開戰立刻鎖住、配樂照舊先切、演完才驚嚇；打完先演結束再給戰利品',async()=>{const g=setup();
 g.run("G.fight=null;G.phase='node';globalThis.ORD=[];fright=async()=>{ORD.push('fright:'+(G.stg?'locked':'free'))};rollInit=async()=>{ORD.push('init');G.fight.order=[{k:'p',id:'p1',init:1}]};advance=async()=>{};deathCheck=async()=>false;const bo=beginEncounterBgm;beginEncounterBgm=()=>{ORD.push('bgm:'+(G.stg?'locked':'free'));bo()}");
 await g.run("startFight({n:1,mode:'normal',names:['感染者']})");assert.deepEqual(JSON.parse(g.run('JSON.stringify(ORD)')),['bgm:locked','fright:free','init']);
 g.run("G.fight.loot=[{t:'collector',mag:1,by:'p1'}];globalThis.LT=[];foeLoot=()=>{LT.push(G.stg?'locked':'free')};G.after=null;enterNode=async()=>{};autoSave=()=>{};globalThis.WK=[];const sw=stgWait;stgWait=async id=>{WK.push(G.stg&&G.stg.k);LT.push('wait');await sw(id)}");
 await g.run('endFight()');assert.deepEqual(JSON.parse(g.run('JSON.stringify(LT)')),['wait','free'],'先演完結束，才給戰利品');assert.deepEqual(JSON.parse(g.run('JSON.stringify(WK)')),['end']);assert.equal(g.run('G.stg'),null);
});
