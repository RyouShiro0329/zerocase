// v0.59.0 選擇卡引擎＋旅館三樓試做（Claude 2026-11-24，主人定案：Claude 專案 zerocase/PLAN_CHOICE_CARDS.md 第一、二、五節、PROPOSAL_CHOICE_CARDS_3F.md）
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
const ST={STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2};
function setup(players){const g=game();g.run(`newRun(${JSON.stringify(players||[{kind:'custom',pid:'p1',name:'甲',st:ST,load:{}}])},{diff:'normal'},'solo');G.node='Z0';G.lv='Z';G.ev=null;LOG=[];globalThis.FT_LOG=[];startFight=async s=>{FT_LOG.push(s)};card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{};deathCheck=async()=>false;tickAll=async()=>true;qte=async()=>true;groundWait=async()=>false;dice=async()=>{};FAST=1`);return g}
const labels=g=>JSON.parse(g.run('JSON.stringify(choices().filter(visible).map(c=>c.l))'));
const idx=(g,l)=>g.run(`choices().findIndex(c=>c.l===${JSON.stringify(l)}&&visible(c))`);
const A=g=>JSON.parse(g.run("JSON.stringify(Object.keys(N).filter(id=>N[id].L==='A'))"));

test('同一個種子、同一張卡、同一個選項，讀檔後結果一樣；換選項結果不一樣（50 個種子）',async()=>{
 let diff=0;
 for(let s=1;s<=50;s++){const g=setup();g.run(`G.sd=${s*104729};G.stp=3;G.lv='A';G.node='A3c';G.players[0].items={};globalThis.SNAP=JSON.stringify(G)`);
  const run=async i=>{g.run("G=migrateG(JSON.parse(SNAP))");await g.run(`doChoice(${i},G.players[0])`);return g.run("JSON.stringify([G.players[0].items,G.players[0].inf,G.alarm||0])")};
  const i=idx(g,'翻推車上的備品'),j=idx(g,'拿推車把手上的萬用房卡');
  const a=await run(i),b=await run(i);assert.equal(a,b,'種子 '+s+' 讀檔後同一個選項結果不同');
  // 先翻背包、吃東西（用掉停在卡上的那一串亂數）再按，結果不變
  g.run("G=migrateG(JSON.parse(SNAP));for(let k=0;k<7;k++)RNG();globalThis.SNAP2=JSON.stringify(G)");await g.run(`doChoice(${i},G.players[0])`);
  assert.equal(g.run("JSON.stringify([G.players[0].items,G.players[0].inf,G.alarm||0])"),a,'先做別的事不影響結果');
  g.run("G=migrateG(JSON.parse(SNAP));reseed(G.stp,G.node,'',"+i+")");const ri=g.run(`RNG()`);g.run("reseed(G.stp,G.node,'',"+j+")");if(ri!==g.run('RNG()'))diff++}
 assert.equal(diff,50,'換選項換一串亂數');
});
test('結果表：大成功只出最好的、大失敗只出最壞的，成功抽好＋普通、失敗抽普通＋壞；缺級別往旁邊補；tbMul、告知徵兆會改權重',()=>{const g=setup();g.run("G.lv='A'");
 g.run("globalThis.C={tb:[{g:'good',w:1,t:'g1'},{g:'good',w:3,t:'g2'},{g:'mid',w:2,t:'m'},{g:'bad',w:1,t:'b1'},{g:'bad',w:5,t:'b2'}]}");
 assert.equal(g.run("pickRes(C,'crit').t"),'g2');assert.equal(g.run("pickRes(C,'fumble').t"),'b2');
 const many=j=>JSON.parse(g.run(`JSON.stringify([...new Set(Array.from({length:400},()=>pickRes(C,${JSON.stringify(j)}).t))].sort())`));
 assert.deepEqual(many('ok'),['g1','g2','m']);assert.deepEqual(many('fail'),['b1','b2','m']);assert.deepEqual(many(null),['b1','b2','g1','g2','m']);
 g.run("globalThis.C2={tb:[{g:'good',t:'G'},{g:'bad',t:'B'}]}");
 assert.deepEqual(JSON.parse(g.run("JSON.stringify([pickRes(C2,'ok').t,pickRes(C2,'fail').t,pickRes(C2,'crit').t,pickRes(C2,'fumble').t])")),['G','B','G','B']);
 g.run("globalThis.C3={tb:[{g:'mid',t:'M'}]}");assert.deepEqual(JSON.parse(g.run("JSON.stringify(['crit','ok','fail','fumble',null].map(j=>pickRes(C3,j).t))")),['M','M','M','M','M']);
 // tbMul：壞結果 ×0 就不會出現
 g.run("LV.A.tbMul={bad:0}");assert.deepEqual(many('fail'),['m']);g.run("LV.A.tbMul=()=>({good:0})");assert.deepEqual(many('ok'),['m']);g.run("delete LV.A.tbMul");
 // 告知徵兆：sign.w
 g.run("C.sign={t:'x',dc:1,w:{bad:0}};G.told={0:{pid:'p1',t:'x'}}");assert.deepEqual(JSON.parse(g.run("JSON.stringify([...new Set(Array.from({length:300},()=>pickRes(C,'fail',0).t))].sort())")),['m']);
 g.run("G.told={}");assert.deepEqual(many('fail'),['b1','b2','m']);
});
test('檢定、沒有檢定的選項都走結果表；守則測試換掉 applyRes 時順序照舊（先擲骰再結算）',async()=>{const g=setup();
 g.run("G.lv='A';G.node='A3c';globalThis.__got=[];applyRes=async(c,res,a,bad)=>{__got.push([res.t,bad])};check=async()=>({ok:false,fumble:true,crit:false})");
 await g.run(`doPlain(${idx(g,'翻推車上的備品')},G.players[0])`);assert.ok(g.run('__got.length===1'));
 g.run("G.node='A4d'");await g.run(`doCheck(${idx(g,'趴下來，從門縫底下看')},G.players[0])`);
 assert.match(g.run('__got[1][0]'),/一根手指從門底下伸出來/,'大失敗出最壞的');assert.equal(g.run('__got[1][1]'),true);
});
test('藍色選項：條件不成立看不到；職業、天賦、道具、旗標；多人只讓符合的人擲',async()=>{
 const g=setup();g.run("G.lv='A';G.node='A3c'");assert.ok(!labels(g).includes('房務員都把萬用卡和房務單夾在一起'));
 const h=setup([{kind:'guard',pid:'p1',name:'甲',load:{}}]);h.run("G.lv='A';G.node='A3c'");assert.ok(labels(h).includes('房務員都把萬用卡和房務單夾在一起'));
 h.run("G.node='A4d';delete G.flags.mkey");const v=h.run("choices().some(c=>c.blu&&visible(c))");assert.equal(v,false,'退伍軍人的選項還要房卡');
 const vet=setup([{kind:'veteran',pid:'p1',name:'乙',load:{}}]);vet.run("G.lv='A';G.node='A4d'");assert.ok(!labels(vet).some(l=>/算準/.test(l)));vet.run("G.flags.mkey=1");assert.ok(labels(vet).some(l=>/算準/.test(l)));
 // 道具要在同一個人身上（尼龍繩＋膠帶）
 g.run("G.node='A6d';G.players[0].items={rope:1}");assert.ok(!labels(g).includes('在走廊最窄的地方拉一條絆腳繩'));g.run("G.players[0].items.tape=1");assert.ok(labels(g).includes('在走廊最窄的地方拉一條絆腳繩'));
 // 任一組條件（手電筒或夜貓子）
 g.run("G.node='AD2';G.players[0].items={}");assert.ok(!labels(g).includes('看清楚那個東西在哪裡'));g.run("G.players[0].traits.push('nightowl')");assert.ok(labels(g).includes('看清楚那個東西在哪裡'));
 // 多人：只讓符合的人擲（擲骰的人選單）
 const m=setup([{kind:'custom',pid:'p1',name:'甲',st:ST,load:{}},{kind:'guard',pid:'p2',name:'乙',load:{}}]);m.run("G.lv='A';G.node='A3c'");
 assert.deepEqual(JSON.parse(m.run(`JSON.stringify(rollEl(choices()[${idx(m,'房務員都把萬用卡和房務單夾在一起')}]).map(p=>p.pid))`)),['p2']);
});
test('牌庫：同一局不重複、本層抽乾才用通用；條件牌只在成立時出現、一層最多 2 張；一般牌至少 9 張',()=>{const g=setup();g.run("G.lv='A';G.flags={};G.dk={on:{},seen:[],cc:{},ret:null}");
 const norm=JSON.parse(g.run("JSON.stringify(dkList('A').filter(id=>!N[id].cc))"));assert.ok(norm.length>=30,'三樓一般牌只有 '+norm.length+' 張');/* v0.60.0 補到 30 張 */
 assert.ok(JSON.parse(g.run("JSON.stringify(dkList('A').filter(id=>N[id].cc))")).length>=5);assert.ok(g.run("dkList('hotel').length")>=3);
 // 條件都不成立（有房卡、警戒低、沒有老夫妻、沒人驚恐）：只會抽到一般牌；被咬的住客是無條件的條件牌
 g.run("G.flags.mkey=1;G.alarm=0;G.players[0].fe=0");const got=[];for(let k=0;k<norm.length+4;k++){const d=g.run("dkDraw('AK1')");got.push(d)}
 assert.equal(new Set(got.filter(Boolean)).size,got.filter(Boolean).length,'不重複');
 const loc=got.filter(d=>d&&N_L(g,d)==='A');assert.ok(!got.some(d=>['AE1','AE2','AE3','AE4'].includes(d)),'條件不成立的條件牌不出現');
 const firstHotel=got.findIndex(d=>/^HG/.test(d||''));assert.ok(firstHotel>=0&&norm.every(id=>got.slice(0,firstHotel).includes(id)),'本層一般牌抽乾之後才用通用牌：'+got.join());
 assert.ok(g.run("G.dk.cc.A||0")<=2);
 // 條件牌：沒有房卡時伊蓮娜會出現；一層最多 2 張
 const h=setup();h.run("G.lv='A';G.flags={};G.alarm=5;G.players[0].fe=60;G.dk={on:{},seen:[],cc:{},ret:null}");const c=[];for(let k=0;k<14;k++)c.push(h.run("dkDraw('AK1')"));
 assert.ok(c.filter(d=>/^AE/.test(d||'')).length<=2,'條件牌最多 2 張：'+c.join());
 let seen=0;for(let s=1;s<=40;s++){const k=setup();k.run(`G.sd=${s};G.lv='A';G.flags={};G.dk={on:{},seen:[],cc:{},ret:null};reseed(${s},'t')`);for(let n=0;n<5;n++)if(k.run("dkDraw('AK1')")==='AE1')seen++}
 assert.ok(seen>0,'沒有房卡的局，伊蓮娜會出現');
});
function N_L(g,id){return g.run(`N[${JSON.stringify(id)}].L`)}
test('選路格：三樓 10 格都開；路況照種子決定，三種都會出現（v0.60.0 主人改了決定：抽牌格固定 10 格）',()=>{const g=setup();const rd={r302:0,rlift:0,rwin:0};
 for(let s=1;s<=100;s++){g.run(`G.sd=${s*31337};G.flags={};G.dk={on:{},seen:[],cc:{},ret:null};dkPrep('A')`);assert.equal(g.run('G.dk.on.A.length'),10);
  for(const k of Object.keys(rd))rd[k]+=g.run(`G.flags.rd_${k}`)}
 for(const k of Object.keys(rd))assert.ok(rd[k]>10&&rd[k]<90,k+' '+rd[k]);
 g.run("G.sd=99;G.flags={};G.dk={on:{},seen:[],cc:{},ret:null};dkPrep('A');globalThis.O1=JSON.stringify([G.flags.rd_r302,G.flags.rd_rlift,G.flags.rd_rwin]);RNG();RNG();G.flags={};G.dk={on:{},seen:[],cc:{},ret:null};dkPrep('A')");
 assert.equal(g.run("JSON.stringify([G.flags.rd_r302,G.flags.rd_rlift,G.flags.rd_rwin])"),g.run('O1'));
 assert.deepEqual(JSON.parse(g.run("JSON.stringify(ROUTE.A.seq)")),['A1','AK1','AK2','AK3','AK4','AK5','AK6','A4f','AK7','A6d','AK8','AK9','AK10','A6']);
});
test('路況：302 的門沒關好不用房卡；電梯門卡死只能撬；301 的窗戶卡住要工具',()=>{const g=setup();g.run("G.lv='A';G.node='A4';G.flags={rd_r302:1}");
 assert.ok(labels(g).includes('302：門沒關好的那間'));assert.ok(!labels(g).includes('302：有光的那間'));
 g.run("G.flags={rd_r302:0}");assert.ok(!labels(g).includes('302：門沒關好的那間'));assert.ok(labels(g).includes('302：有光的那間'));
 g.run("G.node='A6';G.flags={rd_rlift:1,map:1}");assert.ok(!labels(g).includes('徒手扳開電梯門'));assert.ok(labels(g).includes('撬開電梯門，爬電梯井'));
 g.run("G.flags={rd_rwin:1,map:1}");const w=g.run("choices().findIndex(c=>c.l==='從 301 的窗戶爬到消防梯'&&visible(c))");assert.ok(g.run(`!!choices()[${w}].req`),'卡住的窗戶要工具');
 g.run("G.flags={rd_rwin:0,map:1}");const w2=g.run("choices().findIndex(c=>c.l==='從 301 的窗戶爬到消防梯'&&visible(c))");assert.ok(g.run(`!choices()[${w2}].req`));
 g.run("G.flags={rd_rwin:1}");assert.ok(!labels(g).includes('從 301 的窗戶爬到消防梯'),'不知道有消防梯就看不到');
});
test('選擇卡地點（v2）：沒有停留選項、沒有繼續仔細翻；純運氣每層最多 2 個、不放重的壞結果；二樓以下照舊',()=>{const g=setup();
 assert.equal(g.run("isV2('A')"),true);assert.equal(g.run("isV2('B')"),false);
 const bad=JSON.parse(g.run("JSON.stringify(Object.keys(N).filter(id=>N[id].L==='A').flatMap(id=>(N[id].c||[]).filter(c=>!c._hid&&(c.stay||(c.ok&&c.ok.stay))).map(c=>id+'|'+c.l)))"));
 assert.deepEqual(bad,[],'v2 地點不能有 stay');
 for(const id of ['A4b','A4c','A3c','AD6']){g.run(`G.lv='A';G.node='${id}';G.players[0].items={cloth:1,flashlight:1,tableleg:1}`);assert.ok(!labels(g).some(l=>/^繼續仔細翻/.test(l)),id);assert.ok(!g.run("choices().some(c=>c._searchMode)"),id)}
 // 搜索點三選一：快速翻／仔細翻／不碰（＋藍色）
 g.run("G.node='A4c'");assert.deepEqual(labels(g).sort(),['把屍體翻過來','收拾推車上的東西就走','快速翻他的口袋','用布包著手翻'].sort());
 const luck=JSON.parse(g.run("JSON.stringify(Object.keys(N).filter(id=>N[id].L==='A').flatMap(id=>(N[id].c||[]).filter(c=>c.luck).map(c=>({id,tb:c.tb}))))"));
 assert.ok(luck.length<=2,'三樓純運氣 '+luck.length+' 個');for(const x of luck)for(const r of x.tb)assert.ok(!r.fight&&!((r.p||{}).hp<0)&&!((r.p||{}).inf>0),x.id+' 的純運氣不能放重的壞結果');
 // 一張卡一件事：做完就往前
 g.run("G.lv='A';G.node='A6b';G.alarm=0");const before=g.run('G.node');
 return g.run(`(async()=>{const c=choices().find(c=>c.l==='從窗簾縫看街上');await applyRes(c,c.ok,G.players[0])})()`).then(()=>assert.notEqual(g.run('G.node'),before,'看完窗外就往前走'));
});
test('選路：選了才進那張卡，做完接回選路格的下一格；沒開成的格子跳過；舊存檔補 G.dk、v0.59.0 的格子重算',async()=>{const g=setup();
 g.run("G.lv='A';G.route=['A'];G.sd=7;G.dk={on:{},seen:[],cc:{},ret:null}");await g.run("enterNode('AK4')");assert.equal(g.run('G.node'),'AK4','停在選路卡');
 const o=JSON.parse(g.run('JSON.stringify(G.dk.fk.o)'));assert.equal(g.run('choices().length'),o.length);assert.ok(g.run("choices().every(c=>c.kind==='選路'&&c.t==='mv'&&c.fork)"));
 await g.run("(async()=>{const c=choices()[0];await applyRes(c,c.ok,G.players[0])})()");assert.equal(g.run('G.node'),o[0]);assert.equal(g.run('G.dk.ret'),'AK5');
 assert.deepEqual(JSON.parse(g.run('JSON.stringify(G.dk.skip)')),o.slice(1));assert.ok(g.run(`G.dk.seen.includes('${o[0]}')`));
 await g.run(`(async()=>{const c=choices().find(c=>visible(c)&&choiceOk(c)&&!(c.tb?c.tb[0]:c.ok).fight&&!c.go);G.alarm=0;await applyRes(c,c.tb?c.tb[0]:c.ok,G.players[0])})()`);assert.equal(g.run('G.node'),'AK5','做完接回下一格');
 const o2=JSON.parse(g.run('JSON.stringify(G.dk.fk.o)'));assert.ok(!o2.some(id=>o.includes(id)),'上一格沒選的、選過的，這一格都不出現');
 g.run("G.dk.on.A=[]");await g.run("enterNode('AK3')");assert.equal(g.run('G.node'),'A4f','沒開的格子直接跳過');
 const m=JSON.parse(g.run("JSON.stringify(migrateG({players:[],flags:{},sd:5,stp:2}))"));assert.deepEqual(m.dk,{on:{},seen:[],cc:{},ret:null});
 const m2=JSON.parse(g.run("JSON.stringify(migrateG({players:[],flags:{},sd:5,stp:2,dk:{on:{A:['AK1','AK3','AK4','AK5']},seen:[],cc:{},ret:null}}))"));assert.equal(m2.dk.on.A,undefined,'v0.59.0 開的 4～5 格重算成 10 格');
 // 舊存檔停在 v0.59.0 的骨架卡：做完接到新流程的格子
 assert.equal(g.run("N.A3x.next+N.A4.next+N.A4e.next+N.A6b.next"),'AK4AK4A4fA6');
});
test('劇情卡結果固定：303 開門、310 老夫妻、轉角的馬可沒有結果表；瓊的藥袋不動善惡值',()=>{const g=setup();
 assert.ok(g.run("!N.A4d.c[0].tb&&N.A4f.c.every(c=>!c.tb)&&N.A6d.c.every(c=>!c.tb)"));
 assert.ok(g.run("N.AE3.c.every(c=>!c.tb&&!((c.ok.r||{}).karma))"));assert.equal(g.run("N.AE3.kind"),'cross');
 assert.equal(g.run("N.A4f.c[0].ok.r.karma"),1);assert.equal(g.run("N.A4f.c.find(c=>c.blu).ok.r.karma"),1);
});
test('瓊的藥袋只在帶著老夫妻、有人流血時出現；收下來止血',async()=>{const g=setup();g.run("G.lv='A';G.flags={};G.players[0].bleed=0");assert.equal(g.run("dkOk(N.AE3)"),false);
 g.run("G.flags.elders=1");assert.equal(g.run("dkOk(N.AE3)"),false);g.run("G.players[0].bleed=1");assert.equal(g.run("dkOk(N.AE3)"),true);
 g.run("G.node='AE3';G.dk={on:{},seen:['AE3'],cc:{},ret:'A6d'}");await g.run("(async()=>{const c=choices()[0];await applyRes(c,c.ok,G.players[0])})()");assert.equal(g.run('G.players[0].bleed'),0);assert.equal(g.run('G.node'),'A6d');
});
test('二樓窗邊：退伍軍人數過探照燈（swcount），可以直接走過去、沒有 QTE',()=>{const g=setup();g.run("G.lv='B';G.node='B1w';G.flags={}");
 assert.ok(!labels(g).includes('照剛才數好的時間，直接走過去'));g.run("G.flags.swcount=1");assert.ok(labels(g).includes('照剛才數好的時間，直接走過去'));
 assert.ok(!labels(g).includes('看準探照燈轉開的空檔，直接走過去'));assert.ok(g.run("!N.B1w.c.find(c=>c.need==='swcount').ok.qte"));
});
test('藍色選項在畫面上是藍色（.ch.blu）',()=>{const g=setup();assert.match(g.run("document.querySelector?String(chBtn('x','y','','','',false,'','blu')):''"),/class="ch blu"/)});

/* ---- v0.60.0 選路翻牌＋開場不固定（主人 2026-11-24 選 A，Claude 專案 zerocase/PROPOSAL_FORK_CARDS.md、FORK_CARDS_CONTENT.md） ---- */
const fork=(g,sid)=>JSON.parse(g.run(`JSON.stringify(dkFork('${sid}'))`));
test('選路張數：基本 3～4；手電筒、夜貓子、被動感知 14 以上 +1；警戒 6 以上 −1；一律 2～5 張；同一個種子同一組',()=>{
 const low={kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:0,INT:2,CHA:2},load:{}};
 const cnt=(extra)=>{const n=new Set();for(let s=1;s<=60;s++){const g=setup([low]);g.run(`G.lv='A';G.sd=${s*977};G.flags={mkey:1};G.alarm=0;G.dk={on:{},seen:[],cc:{},ret:null};${extra||''}`);
   const per=g.run('passPer(G.players[0])');if(!extra)assert.ok(per<14,'這個角色被動感知要低於 14：'+per);n.add(g.run("dkForkN()"))}return [...n].sort()};
 assert.deepEqual(cnt(),[3,4]);
 assert.deepEqual(cnt("G.players[0].items.flashlight=1"),[4,5]);assert.deepEqual(cnt("G.players[0].traits.push('nightowl')"),[4,5]);
 assert.deepEqual(cnt("G.alarm=6"),[2,3]);assert.deepEqual(cnt("G.alarm=6;G.players[0].items.flashlight=1"),[3,4]);
 const g=setup();g.run("G.lv='A';G.sd=5;G.dk={on:{},seen:[],cc:{},ret:null}");const a=fork(g,'AK1');g.run("G.dk={on:{},seen:[],cc:{},ret:null};RNG();RNG()");assert.deepEqual(fork(g,'AK1'),a,'跟按選項的順序無關');
 for(const id of a)assert.ok(g.run(`!!N.${id}.peek`),id+' 沒有線索');
});
test('分段：西段的格子只翻西段和通用卡，中段、東段一樣；條件牌一格最多 1 張、一層最多 2 張',()=>{
 for(let s=1;s<=40;s++){const g=setup();g.run(`G.lv='A';G.sd=${s*131};G.flags={};G.alarm=5;G.players[0].fe=60;G.players[0].bleed=1;G.flags.elders=1;G.dk={on:{},seen:[],cc:{},ret:null}`);
  for(const [sid,seg] of [['AK1','w'],['AK2','w'],['AK4','m'],['AK7','m'],['AK8','e'],['AK10','e']]){const o=fork(g,sid);
   for(const id of o){const sg=g.run(`N.${id}.seg||''`);assert.ok(sg===''||sg===seg,`${sid} 翻到別段的卡 ${id}（${sg}）`)}
   assert.ok(o.filter(id=>g.run(`!!N.${id}.cc`)).length<=1,'一格最多 1 張條件牌');g.run(`G.dk.skip=[]`)}
  assert.ok(g.run('G.dk.cc.A||0')<=2,'一層最多 2 張條件牌')}
 const g=setup();const seg=JSON.parse(g.run("JSON.stringify(['w','m','e'].map(s=>dkList('A').filter(id=>N[id].seg===s&&!N[id].cc).length))"));
 assert.deepEqual(seg,[10,10,7],'西 10、中 10、東 7（＋通用）');
 assert.ok(g.run("dkList('A').every(id=>!!N[id].peek)"),'每張牌庫卡都有線索');
});
test('新卡 15 張：表面上是旅館（沒有病床、點滴架）、沒有純運氣；藍色選項用道具為主',()=>{const g=setup();
 const ids=['AW1','AW2','AW3','AW4','AM1','AM2','AM3','AM4','AM5','AM6','AT1','AT2','AT3','AT4','AT5'];
 const txt=g.run(`JSON.stringify(${JSON.stringify(ids)}.map(id=>{const n=N[id];return n.t+n.peek+JSON.stringify(n.c)}).join(''))`);
 assert.doesNotMatch(txt,/病床|點滴|靈異|鬼/);
 assert.ok(g.run(`${JSON.stringify(ids)}.every(id=>N[id].c.every(c=>!c.luck))`));
 const blu=JSON.parse(g.run(`JSON.stringify(${JSON.stringify(ids)}.flatMap(id=>N[id].c.filter(c=>c.blu).map(c=>JSON.stringify(c.blu))))`));
 assert.ok(blu.filter(b=>/item/.test(b)).length>blu.length/2,'藍色選項大多是道具：'+blu.join(' '));
});
test('開場：時間和種類照種子（第 1／2／3 件之後、不來都有；5 張都會出現）；開門出去從第 2 張起才有；第 3 件做完一定出去',async()=>{
 const when={0:0,1:0,2:0,3:0},kind=new Set();
 for(let s=1;s<=200;s++){const g=setup();g.run(`G.sd=${s*7};delete G.op`);const o=JSON.parse(g.run('JSON.stringify(opSt())'));when[o.ev]++;kind.add(o.k);
  g.run('delete G.op');assert.equal(g.run('JSON.stringify(opSt())'),JSON.stringify(o),'讀檔一樣')}
 for(const k of [0,1,2,3])assert.ok(when[k]>10,JSON.stringify(when));assert.equal(kind.size,5);
 const g=setup();g.run("G.lv='A';G.sd=1;G.op={n:0,ev:0,k:0,done:0}");await g.run("enterNode('A1')");assert.ok(!labels(g).includes('開門出去'));
 for(let n=1;n<=3;n++){await g.run(`(async()=>{const c=choices().find(c=>visible(c)&&c.opk&&!c.k);await applyRes(c,c.ok,G.players[0])})()`);
  if(n<3){assert.equal(g.run('G.node'),'A1r');assert.ok(labels(g).includes('開門出去'))}else assert.equal(g.run('G.node'),'AK1','第 3 件做完一定出去')}
 // 事件在第 1 件之後來，做完回房間；開場事件只出現一次
 const h=setup();h.run("G.lv='A';G.op={n:0,ev:1,k:2,done:0}");await h.run("enterNode('A1')");await h.run(`(async()=>{const c=choices().find(c=>c.l==='看門背後的逃生路線圖');await applyRes(c,c.ok,G.players[0])})()`);
 assert.equal(h.run('G.node'),'AO3');assert.equal(h.run('G.flags.opfire'),1);await h.run(`(async()=>{const c=choices().find(c=>c.l==='留在房裡等它停');await applyRes(c,c.tb[0],G.players[0])})()`);assert.equal(h.run('G.node'),'A1r');
 assert.equal(h.run('dkOk(N.AD3)'),false,'來了火警，這一局不抽煙霧偵測器');
 // 舊存檔停在撞門那張（沒有 G.op）：做完直接出門
 const k=setup();k.run("G.lv='A';G.node='A2';delete G.op");await k.run(`(async()=>{const c=N.A2.c[1];await applyRes(c,c.ok,G.players[0])})()`);assert.equal(k.run('G.node'),'AK1');
});
test('先做的事會改變開場事件：聽過門、頂過門、看過貓眼、看過窗外各多一個選項；房間裡做過的不再出現在撞門那張',()=>{const g=setup();g.run("G.lv='A';G.node='A2';G.flags={}");
 const base=labels(g);assert.ok(base.includes('把書桌拖過去頂住門')&&base.includes('從貓眼看清楚外面'));
 g.run("G.flags={barred:1}");assert.ok(labels(g).includes('書桌頂著，等它撞累'));assert.ok(!labels(g).includes('把書桌拖過去頂住門'));
 g.run("G.flags={saw:1}");assert.ok(labels(g).includes('它只有一個，退到門邊的牆後面等它'));assert.ok(!labels(g).includes('從貓眼看清楚外面'));
 g.run("G.flags={heard:1}");assert.ok(labels(g).includes('等它撞完退開的那一下，開門先動手'));
 g.run("G.node='AO4';G.flags={}");assert.ok(!labels(g).some(l=>/穿制服/.test(l)));g.run("G.flags={saw:1}");assert.ok(labels(g).some(l=>/穿制服/.test(l)));
 g.run("G.node='AO3';G.flags={sawstreet:1}");assert.ok(labels(g).some(l=>/現在就走/.test(l)));
 g.run("G.node='AO2';G.flags={heard:1}");assert.equal(labels(g).filter(l=>l==='開門，先對付他後面那個').length,1);g.run("G.flags={heard:1,saw:1}");assert.equal(labels(g).filter(l=>l==='開門，先對付他後面那個').length,1,'兩個都有也只出現一次');
});
