// v0.57.0 旅館四層（Claude 2026-11-23，PROPOSAL_HOTEL 主人定案）：三樓「門」、二樓「窗」、一樓後場「瓦斯」、地下「車」（整層是污染區）
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
// 隨機事件牌拿掉（evCands 回空），算的是一般路線上固定的選擇
function setup(){const g=game();g.run("newRun([{kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'normal'},'solo');G.node='Z0';G.lv='Z';G.ev=null;LOG=[];globalThis.FT_LOG=[];startFight=async s=>{FT_LOG.push(s)};card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{};deathCheck=async()=>false;tickAll=async()=>true;qte=async()=>true;evCands=()=>[];groundWait=async()=>false;FAST=1");return g}
const labels=g=>JSON.parse(g.run('JSON.stringify(choices().filter(visible).map(c=>c.l))'));
// 照劇情結果直接套用（不擲骰）；每一步先把警戒歸零，免得測路線時被警戒打斷
async function pick(g,l,ok=true){g.run('G.alarm=0;G.ground=[]');const i=g.run(`choices().findIndex(c=>c.l===${JSON.stringify(l)}&&visible(c))`);assert.ok(i>=0,`${g.run('G.node')} 找不到選項：${l}（${labels(g).join('、')}）`);
 // 移動、繼續仔細翻、「不再找了」不算；搜索點挑房間算一次
 const mv=g.run(`(()=>{const c=choices()[${i}];const room=c.go&&N[c.go]&&N[c.go].next===G.node;return (c.t==='mv'&&!room)||c._searchMode==='careful'||!!c.srOut})()`);
 await g.run(`(async()=>{const c=choices()[${i}];const res=c.tb?(c.tb.find(r=>r.g===(${ok}?'good':'bad'))||c.tb[0]):${ok}?c.ok:c.ng;await applyRes(c,res,G.players[0],${!ok})})()`);return mv?0:1}
// 陣列＝確認現在在哪一張卡；{fight:'下一張'}＝這一步會開打（戰鬥在測試裡略過），打完接到下一張卡
async function walk(g,steps){let n=0;for(const s of steps){if(Array.isArray(s)){assert.equal(g.run('G.node'),s[0],'應該在 '+s[0]);continue}
 if(s&&s.fight){n+=await pick(g,s.l);await g.run(`enterNode(${JSON.stringify(s.fight)})`);continue}n+=await pick(g,s)}return n}
/* v0.60.0（主人 2026-11-24 再改：選路翻牌、開場不固定）：選路不算次數、房間做一件就出門（最少的走法）；開場事件有沒有來照種子。
   v0.59.0（主人 2026-11-24 改了決定：三樓改成選擇卡，一張卡一件事、中段抽牌、路況）：三樓不再照固定劇本，
   改成 30 個種子 × 8 種路況，每張卡挑一個不開打、不進房間的選項（沒有就照第一個），數到離開三樓為止；正常路線和捷徑各取最少值。 */
async function walk3F(seed,rd,exit){const g=setup();g.run(`G.sd=${seed};G.dk={on:{},seen:[],cc:{},ret:null};Object.assign(G.flags,${JSON.stringify(rd)});G.players[0].gear.push(newGear('crowbar'))`);
 await g.run("enterNode('A1')");let n=0,seen=[];
 for(let k=0;k<70&&g.run("G.lv")==='A';k++){const id=g.run('G.node');seen.push(id);g.run('G.alarm=0;G.ground=[]');
  const i=g.run(`(()=>{const cs=choices();const ok=cs.map((c,i)=>i).filter(i=>visible(cs[i])&&choiceOk(cs[i])&&!cs[i].srOut);
   const res=c=>c.tb?c.tb[0]:c.ok||{};const dest=c=>c.go||res(c).go;
   if(G.node==='A1'){const m=ok.find(i=>cs[i].l==='摸黑走到門邊');if(m!=null)return m}/* v0.63.1：301 改成情境，到門邊看逃生路線圖、再出門 */
   if(G.node==='A1d'){const m=ok.find(i=>/逃生路線圖/.test(cs[i].l));if(m!=null)return m}
   if(G.node==='A1z'||G.node==='A1w'||G.node==='A1m'){const m=ok.find(i=>cs[i].opout||cs[i].opgo==='A1z');if(m!=null)return m}
   if(G.node==='A6'){const want=${JSON.stringify(exit)};const m=ok.find(i=>want==='stairs'?cs[i].l==='東側樓梯':want==='lift'?/電梯/.test(cs[i].l):/消防梯/.test(cs[i].l));return m==null?-1:m}
   const calm=ok.filter(i=>!res(cs[i]).fight&&!(dest(cs[i])&&N[dest(cs[i])]&&N[dest(cs[i])].next===G.node));return calm.length?calm[0]:ok[0]??-1})()`);
  assert.ok(i>=0,`${id} 沒有選得了的選項（種子 ${seed}，路況 ${JSON.stringify(rd)}，出口 ${exit}）`);
  const fk=g.run(`!!N[G.node].fork`);/* v0.60.0：選路不算一次選擇 */
  const f0=g.run('FT_LOG.length');await g.run(`(async()=>{const c=choices()[${i}];const res=c.tb?c.tb[0]:c.ok;await applyRes(c,res,G.players[0],false)})()`);if(!fk)n++;
  if(g.run('FT_LOG.length')>f0&&g.run('G.node')===id)await g.run('enterNode(G.after)')}
 return {n,seen,lv:g.run('G.lv'),g}}
test('旅館是四層單向路線＋捷徑，共用一個警戒區域；每層進場有環境提示',()=>{const g=setup();
 assert.deepEqual(JSON.parse(g.run("JSON.stringify(Object.keys(ROUTE).filter(L=>ROUTE[L].loc==='旅館'))")).sort(),['A','B','C','D','E','G','I','R'].sort());
 for(const L of ['A','B','E','G']){assert.equal(g.run(`alZ('${L}')`),'hotel');assert.ok(g.run(`!!LV.${L}.rule`),L+' 進場有環境提示')}
 assert.equal(g.run("N.F1.L+N.H2.L+N.P4.L"),'EEG','廚房、洗衣房併進一樓，停車場併進地下');
 assert.match(g.run('LV.A.rule'),/停電/);assert.doesNotMatch(g.run('LV.A.rule'),/自己關上|閉門器/);/* v0.63.0 spec 7.1：不再強迫寫每扇門都會自己關上 */assert.match(g.run('LV.B.rule'),/落地窗/);assert.match(g.run('LV.E.rule'),/瓦斯/);assert.match(g.run('LV.G.rule'),/通風扇停了/);
});
/* v0.63.0（主人 2026-11-24 改了決定：出口長度浮動，不卡最少 15 次；捷徑可以很短）：三樓的長度與出口改在 tests/explore.test.cjs 驗收。
   這裡保留「30 個種子、8 種路況都走得出去」。 */
test('三樓（情境探索）：30 個種子、8 種路況，東側樓梯、電梯井、消防梯都走得出去',async()=>{
 const RD=[];for(let m=0;m<8;m++)RD.push({rd_r302:m&1,rd_rlift:m>>1&1,rd_rwin:m>>2&1});
 const min={stairs:99,lift:99,win:99};
 for(let s=1;s<=30;s++)for(const rd of RD)for(const ex of ['stairs','lift','win']){const w=await walk3F(s*7919,rd,ex);
  assert.notEqual(w.lv,'A',`沒有走出三樓（種子 ${s}，${JSON.stringify(rd)}，${ex}）：${w.seen.join('→')}`);
  assert.equal(w.lv,ex==='stairs'?'B':ex==='lift'?'C':'D');min[ex]=Math.min(min[ex],w.n)}
 console.log('三樓選擇次數（30 種子×8 路況的最少值，走到盡頭的出口）',JSON.stringify({東側樓梯:min.stairs,電梯井:min.lift,消防梯:min.win}));
});
/* v0.64.0（主人 2026-11-24 20:52 改了決定：整座旅館改成情境探索，長度隨種子浮動）：二樓以下不再照固定劇本數次數，
   改成每一層 25 個種子 × 幾種走法走到底：一定走得到出口、一張卡只出現一次、每個選擇都換新的情境；關瓦斯、排風機、鐵捲門鏈條這些機制照樣做得到。 */
async function walkF(seed,start,mode,want,pre){const g=setup();g.run(`G.sd=${seed};G.route=${JSON.stringify(pre||['A'])};G.lv='A';G.players[0].items.coin=1;G.players[0].items.bandage=2;G.players[0].gear.push(newGear('crowbar'))`);
 await g.run(`enterNode('${start}')`);const L0=g.run('G.lv');const seen=[];let n=0;
 for(let k=0;k<80&&g.run('G.lv')===L0;k++){const id=g.run('G.node');seen.push(id);g.run('G.alarm=0;G.ground=[]');
  const i=g.run(`(()=>{const cs=choices();const ok=cs.map((c,i)=>i).filter(i=>visible(cs[i])&&choiceOk(cs[i])&&!(cs[i].ok&&cs[i].ok.code));const W=${JSON.stringify(want||[])},M=${JSON.stringify(mode)};
   const res=c=>c.tb?c.tb[0]:c.ok||{};for(const w of W){const m=ok.find(i=>cs[i].l===w);if(m!=null)return m}
   if(M==='rand')return ok.length?ok[(${seed}+G.stp*7)%ok.length]:-1;
   const calm=ok.filter(i=>!res(cs[i]).fight&&!cs[i].xpx);if(M==='deep'){const s=calm.find(i=>/^s[qd]$/.test(cs[i].t));if(s!=null)return s}
   return calm.length?calm[0]:ok[0]??-1})()`);
  assert.ok(i>=0,`${id} 沒有選得了的選項（種子 ${seed}）`);
  const f0=g.run('FT_LOG.length');await g.run(`(async()=>{const c=choices()[${i}];const res=c.tb?c.tb[0]:c.ok;await applyRes(c,res,G.players[0],false)})()`);n++;
  if(g.run('FT_LOG.length')>f0)await g.run('enterNode(G.after)');else if(g.run('G.lv')===L0)assert.notEqual(g.run('G.node'),id,`${id} 選了之後還停在同一張卡（種子 ${seed}）`)}
 return {n,seen,lv:g.run('G.lv'),g}}
test('一般路線（v0.64.0 情境探索）：二樓、一樓、地下、捷徑每一層都走得到出口；一張卡只出現一次；長度隨種子浮動',async()=>{
 const st={};const RUNS=[['二樓','B1',['B2']],['一樓','E1',['E2']],['一樓（員工樓梯）','E1s',['E1g']],['地下','G1',['G4']],['電梯井','C1',[]],['消防梯','D1',[]],['頂樓','R1',[]]];
 for(const [nm,start,must] of RUNS){const ns=[];for(let s=1;s<=25;s++)for(const m of ['calm','deep','rand']){const w=await walkF(s*977,start,m,null,start==='E1s'?['A','B']:null);
   assert.notEqual(w.lv,w.g.run(`N['${start}'].L`),`${nm} 種子 ${s} ${m} 沒走出去：${w.seen.join('→')}`);
   const ids=w.seen.filter(x=>!/X[NQ]$/.test(x));assert.deepEqual(ids.filter((x,i)=>ids.indexOf(x)!==i),[],`${nm} 一張卡只出現一次：${w.seen.join('→')}`);
   for(const x of must)assert.ok(w.seen.includes(x),`${nm} 一定經過 ${x}：${w.seen.join('→')}`);
   assert.ok(!w.seen.some(x=>/^[BCDEFGHPR]3x?$/.test(x)),'不再走到原本的隨機事件格');if(m==='calm')ns.push(w.n)}
  st[nm]=Math.min(...ns)+'～'+Math.max(...ns)}
 console.log('各層選擇次數（25 個種子，一般走法，最少～最多）',JSON.stringify(st));
 // 機制照樣做得到：關瓦斯、發電機＋排風機、鐵捲門的手動鏈條
 const k=await walkF(5,'E1','calm',['穿過廚房','扳紅色管子上的把手','先把瓦斯關掉']);assert.equal(k.g.run('G.flags.gasoff'),1,'一樓關得掉瓦斯：'+k.seen.join('→'));
 const f=await walkF(5,'G1','calm',['啟動發電機','打開排風機的開關','從車道連通門到停車場','打開那個鐵盒子','拉手動鏈條，把鐵捲門拉高']);assert.equal(f.g.run('G.flags.power&&G.flags.fanon'),1,'發電機和排風機：'+f.seen.join('→'));
 assert.ok(f.seen.includes('G2g'),'發電機發動之後是新的情境');
});
test('門：房卡鎖停電照樣鎖，302、303 要萬用房卡；309 可以躲；從樓梯下去就回不了頭',async()=>{const g=setup();
 g.run("G.node='A4';G.lv='A'");let i=g.run("choices().findIndex(c=>c.l==='302：有光的那間')");assert.equal(g.run(`visible(choices()[${i}])`),true);assert.equal(g.run(`choiceOk(choices()[${i}])`),false,'沒有房卡');
 g.run("G.flags.mkey=1");assert.equal(g.run(`choiceOk(choices()[${i}])`),true);
 g.run("G.node='A4e';delete G.flags.mkey");assert.ok(!labels(g).includes('用萬用房卡進 309'));g.run("G.flags.mkey=1");assert.ok(labels(g).includes('用萬用房卡進 309'));
 assert.equal(g.run("N.A4e.c[1].ok.go"),'A4h');assert.ok(g.run("N.A4h.c.some(c=>c.quiet&&c.t==='qh')"),'309 裡可以安靜躲一陣子');
 assert.match(g.run("N.A6.c.find(c=>c.l==='東側樓梯').ok.t"),/樓梯間這一側沒有門把/);
});
test('窗：二樓靠窗的地方失敗會被打（QTE）；看過窗外的人比較好過',()=>{const g=setup();
 const c=JSON.parse(g.run("JSON.stringify(N.B1w.c.map(c=>({k:c.k||'',b:c.bonusFlag||'',q:!!((c.ng&&c.ng.qte)||(c.ok&&c.ok.qte))})))"));
 assert.deepEqual(c[0],{k:'AGI',b:'sawwin',q:true});assert.equal(c[2].q,true);
 assert.ok(g.run("N.B2w.c.every(c=>c.t)"));
});
test('瓦斯：一樓後場開槍、點火會炸；扳掉總閥就沒事；炸過的話大廳多一隻',async()=>{const g=setup();
 g.run("G.lv='E';G.node='E1g'");assert.equal(g.run('gasZone()'),true);g.run("G.flags.gasoff=1");assert.equal(g.run('gasZone()'),false);
 g.run("G.lv='A';delete G.flags.gasoff");assert.equal(g.run('gasZone()'),false,'別的樓層沒有瓦斯');
 g.run("G.lv='E';G.node='E1g'");await g.run('explode()');assert.equal(g.run('G.flags.hboom'),1);assert.match(g.run("LOG.map(x=>x[0]).join('')"),/員工通道/);
 const n=g.run("moreFoes(N.I1.c.find(c=>c.l==='趁它們還沒發現，先動手').ok.fight).n");assert.equal(n,3,'大廳多一隻被爆炸聲引來的');
});
test('大廳：窗戶被打破、發電機的燈、爆炸各自多一隻，可以疊',()=>{const g=setup();const f="N.I1.c.find(c=>c.l==='趁它們還沒發現，先動手').ok.fight";
 assert.equal(g.run(`moreFoes(${f}).n`),2);g.run("G.flags.winbait=1");assert.equal(g.run(`moreFoes(${f}).n`),3);g.run("G.flags.power=1;G.flags.hboom=1");assert.equal(g.run(`moreFoes(${f}).n`),5);
});
test('車＋污染區：地下每 30 分鐘感染上升；發電機開了、排風機打開才散掉；停車場一片黑',async()=>{
 const run=async(pre)=>{const g=setup();g.run(`G.lv='G';G.node='G2';G.zal={};globalThis.pl=G.players[0];pl.inf=0;${pre||''}`);await g.run('passTime(60)');return g};
 let g=await run();assert.ok(g.run('pl.inf')>0);
 g=await run("G.flags.power=1");assert.ok(g.run('pl.inf')>0,'只開發電機還不夠');
 g=await run("G.flags.power=1;G.flags.fanon=1");assert.equal(g.run('pl.inf'),0,'排風機在轉');
 g=await run("pl.items.filter=1;pl.eq.face={k:'gasmask'}");assert.equal(g.run('pl.inf'),0,'面具加濾罐');
 g=setup();g.run("G.lv='G';G.node='P2'");assert.equal(g.run('LV.G.fx.dark'),1);g.run("G.node='G2'");assert.equal(g.run('LV.G.fx.dark'),0,'設備層照舊');
 assert.ok(g.run("(N.P2.c.find(c=>c.l==='用手電筒照進旁邊幾台車').ng.p.alarm||0)>=3"),'照車窗失敗，警報響');
});
test('前面的選擇改變後面：310 的老夫妻、拉下伴郎、手動鏈條、引開',async()=>{const g=setup();
 const call=pre=>{g.run(`G.flags={${pre}}`);return g.run("N.E6.c[0].ok.t")};
 assert.match(call('elderstay:1'),/我們有照做/);assert.match(call('elderleft:1'),/華特！不要開/);assert.match(call('elders:1'),/是 303/);
 g.run("G.flags={};G.node='B2b';G.lv='B'");assert.ok(!labels(g).includes('讓瓊幫你處理傷口'));g.run("G.flags.elders=1");assert.ok(labels(g).includes('讓瓊幫你處理傷口'));
 g.run("G.flags={};G.node='P4';G.lv='G'");assert.ok(!labels(g).includes('趁警報還在響，從人行通道走'));g.run("G.flags.carlure=1;G.flags.chainknow=1");assert.ok(labels(g).includes('趁警報還在響，從人行通道走'));assert.ok(labels(g).includes('拉手動鏈條，把鐵捲門拉高'));
 assert.equal(g.run("N.A4f.c[0].ok.r.karma"),1);assert.equal(g.run("N.A4f.c[2].ok.r.karma"),-1,'不理 310 扣 1（主人 18:23）');assert.ok(g.run("N.B2w.c.every(c=>!(c.ok.r||{}).karma)"),'伴郎不扣');
 const g2=setup();g2.run("G.node='B2w';G.lv='B';G.flags={}");await pick(g2,'衝過去把他拉下來');assert.equal(g2.run('G.flags.winsaved'),1);assert.ok(!g2.run('G.flags.winbait'));
});
test('菌絲統一成鮮紅色、像血管在跳（主人 2026-11-23）；舊存檔的廚房、停車場轉到新的層',()=>{const g=setup();
 assert.equal(g.run("Object.values(N).some(n=>/灰白色的纖維/.test(typeof n.t==='string'?n.t:''))"),false);assert.match(g.run('N.G1.t'),/鮮紅色/);
 const m=JSON.parse(g.run("JSON.stringify(migrateG({lv:'F',node:'F2',route:['A','B','E','F'],lvSeen:['A','B','E','F'],players:[],flags:{}}))"));
 assert.equal(m.lv,'E');assert.deepEqual(m.route,['A','B','E']);
 const p=JSON.parse(g.run("JSON.stringify(migrateG({lv:'P',node:'P2',route:['A','B','H','P'],players:[],flags:{}}))"));assert.equal(p.lv,'G');assert.deepEqual(p.route,['A','B','E','G']);
});
