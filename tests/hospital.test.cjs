// v0.56.0 聖瑪莉醫院三層（Claude 2026-11-23，PROPOSAL_HOSPITAL 主人定案）：急診「聲音」、四樓「伸手可及」、地下室「空氣」
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(){const g=game();g.run("newRun([{kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'normal'},'solo');G.node='Z0';G.lv='Z';G.ev=null;LOG=[];globalThis.FT_LOG=[];startFight=async s=>{FT_LOG.push(s);G.fight={foes:[]};G.phase='fight'};card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{};deathCheck=async()=>false;tickAll=async()=>true;qte=async()=>true;FAST=1");return g}
const labels=g=>JSON.parse(g.run('JSON.stringify(choices().filter(visible).map(c=>c.l))'));
const log=g=>g.run("LOG.map(x=>x[0]).join('\\n')");
// 照劇情結果直接套用（不擲骰）；每一步先把警戒歸零，免得測路線時被警戒打斷
async function pick(g,l,ok=true){g.run('G.alarm=0;G.ground=[]');const i=g.run(`choices().findIndex(c=>c.l===${JSON.stringify(l)}&&visible(c))`);assert.ok(i>=0,`${g.run('G.node')} 找不到選項：${l}（${labels(g).join('、')}）`);
 // 移動、繼續仔細翻、「不再找了」不算；搜索點挑房間算一次
 const mv=g.run(`(()=>{const c=choices()[${i}];const room=c.go&&N[c.go]&&N[c.go].next===G.node;return (c.t==='mv'&&!room)||c._searchMode==='careful'||!!c.srOut})()`);
 await g.run(`(async()=>{const c=choices()[${i}];await applyRes(c,${ok}?c.ok:c.ng,G.players[0],${!ok})})()`);return mv?0:1}
async function walk(g,steps){let n=0;for(const s of steps){if(Array.isArray(s)){assert.equal(g.run('G.node'),s[0],'應該在 '+s[0]);continue}n+=await pick(g,s)}return n}
const ER_NURSE=[['O0'],'踩著碎玻璃走進去',['O1'],'翻檢傷櫃台的抽屜','看病床配置白板','往裡面走',['OE1b'],'翻椅子上的包包','看看那道血跡','往裡面走',
 ['OE2'],'貼著牆，從推床旁邊擠過去',['OE3'],'從簾子的縫看進去',['OE4'],'翻交班本','只拉開藥車最上面那一格','往前走',['OE5'],'接起來',
 ['OE6'],'翻急救推車的抽屜','關上推門，在裡面等一陣子','往前走',['OE7'],'小聲回應',['OE8'],'用鑰匙開，慢慢推上去',['OE9'],'帶她一起走一段',
 ['OE10'],'撲過去接住',['OE12'],'把紙箱搬下來，慢慢拆開',['OE12n'],'讓瑞秋處理傷口','問她地下室的事','跟她道別',['OE13']];
const FOURTH=[['O2'],'先從門上的玻璃看一陣子',['OF1'],'翻椅子底下的背包','聽走廊上的動靜','往病房走',['OF2'],'401：白板寫著「觀察第 9 日」','拿床頭櫃上的藥袋',
 ['OF2'],'403：白板是空白的','翻床頭櫃的抽屜','回走廊',['OF3'],'問他這裡發生了什麼事','解開他的約束帶',['OF4'],'翻病歷','輸入管制藥品櫃的密碼','往前走',['OF4b'],'回護理站把呼叫系統關掉',
 ['OF5'],'翻架子最上層','往前走',['OF6'],'從旁邊的病房繞過去',['OF7'],'按那顆沒有數字的按鈕',['OF8'],'躲進旁邊的病房，等她走開',['OF9']];
const BASE=[['O3'],'推推看那扇門','聽走廊深處的聲音','往前走',['OBk'],'貼著另一邊的牆走過去',['OB1'],'看牆上的消防平面圖','翻工務的推車','往機房走',
 ['OB2'],'找備用發電機的備品','看發電機的運轉紀錄','重設緊急停止，把發電機開起來','往前走',['OB3'],'從管線架旁邊的窄道擠過去',['OB4'],'翻架子上的器械包','看高壓滅菌鍋裡面','往前走',['OB4b'],'繞路經過洗衣房',
 ['OB5'],'看軟木板上的紙條','摸赫克特的外套口袋','往前走',['OB6'],'看冷藏櫃門上的名牌','翻遺物袋','往前走',['OB7']];

test('醫院是三層單向路線，共用一個警戒區域；急診吵的動作加倍',()=>{const g=setup();
 assert.deepEqual(JSON.parse(g.run("JSON.stringify(['O','OF','OB'].map(L=>[ROUTE[L].loc,alZ(L)]))")),[['聖瑪莉醫院','hospital'],['聖瑪莉醫院','hospital'],['聖瑪莉醫院','hospital']]);
 g.run("G.lv='O';G.zal={};G.alarm=0;addAlarm(1,null)");assert.equal(g.run('G.alarm'),2,'急診：聲音的規則');
 g.run("G.lv='OF';G.alarm=0;addAlarm(1,null)");assert.equal(g.run('G.alarm'),1,'四樓照常');
 for(const L of ['O','OF','OB'])assert.ok(g.run(`!!LV.${L}.rule`),L+' 進場有環境提示');
});
test('一般路線：每一層至少 15 次選擇（移動、繼續仔細翻不算），走得到出口',async()=>{const g=setup();g.run("G.flags.blackout=1;G.clock=3*1440+600");
 await g.run("enterNode('O0')");
 const a=await walk(g,ER_NURSE);assert.ok(a>=15,'急診（帶護理師）只有 '+a+' 次');
 await pick(g,'上四樓');const b=await walk(g,FOURTH);assert.ok(b>=15,'四樓只有 '+b+' 次');
 await pick(g,'下地下室');const c=await walk(g,BASE);assert.ok(c>=15,'地下室只有 '+c+' 次');
 assert.equal(g.run('G.flags.gotfuse'),1);assert.equal(g.run('G.flags.arcfile'),1);assert.equal(g.run('G.flags.erlog'),1);
 await pick(g,'用赫克特的鑰匙開邊門');assert.equal(g.run('G.node'),'Z0');assert.equal(g.run('G.flags.hspout'),1);
 assert.deepEqual(JSON.parse(g.run('JSON.stringify(G.route)')),['O','OF','OB']);
 const g2=setup();g2.run("G.clock=600");await g2.run("enterNode('O0')");
 const quiet=[...ER_NURSE.slice(0,ER_NURSE.indexOf('小聲回應')),'不出聲，繼續走',['OE10'],'撲過去接住',['OE12'],'把紙箱搬下來，慢慢拆開',['OE13']];
 const d=await walk(g2,quiet);assert.ok(d>=15,'急診（不理護理師）只有 '+d+' 次');
 console.log('一般路線的選擇次數',JSON.stringify({急診帶護理師:a,急診不理護理師:d,四樓:b,地下室:c}));
});
test('回不了頭：進了地下室，防火門從這一側打不開；四樓下得了地下室，地下室上不了四樓',async()=>{const g=setup();g.run("G.route=['O','OF'];G.flags.hfront=1");
 await g.run("enterNode('O3')");assert.equal(g.run("N.O3.L"),'OB');
 const exits=JSON.parse(g.run("JSON.stringify(N.OB7.c.map(c=>[c.l,c.go||(c.ok&&c.ok.go),c.need||'']))"));
 for(const [l,go,need] of exits)assert.ok(go==='Z0'||(go==='O2'&&need==='acru'),l+' → '+go);
 g.run("G.node='OB7';G.lv='OB'");assert.ok(!labels(g).includes('從樓梯上四樓'),'平常沒有上樓的路');
 g.run("G.node='OF9';G.lv='OF';G.route=['O','OF','OB']");assert.deepEqual(labels(g),['從另一頭的逃生梯下樓，回街區'],'去過地下室就不再出現');
 g.run("G.node='OE13';G.lv='O';G.route=['O'];G.flags.hpw=0");assert.deepEqual(labels(g),['上四樓','下地下室','放棄，從救護車道回街區'],'沒電：沒有電梯');
});
test('第一層的選擇留到後面：急診吵了兩次以上，被吵醒的病人起來；地下室一開發電機，它們往有光的地方走',async()=>{const g=setup();
 g.run("G.flags.ernoise=1");assert.equal(g.run("rtSkip('OE11')"),true,'吵一次還不會');
 g.run("G.flags.ernoise=2");assert.equal(g.run("rtSkip('OE11')"),false);
 g.run("G.flags.blackout=1;G.flags.hfront=1;G.route=['O']");await g.run("enterNode('OB2')");await pick(g,'重設緊急停止，把發電機開起來');assert.equal(g.run('G.node'),'OB2','開完還在機房');await pick(g,'往前走');
 assert.equal(g.run('G.node'),'OBw');assert.equal(g.run('G.flags.hgen'),1);
 const g2=setup();g2.run("G.flags.blackout=1;G.flags.ernoise=1");await g2.run("enterNode('OB2')");await pick(g2,'重設緊急停止，把發電機開起來');await pick(g2,'往前走');assert.equal(g2.run('G.node'),'OB3','沒吵醒就沒有');
});
test('地下室的空氣（主人選 B）：整層是污染區，每 30 分鐘感染 +3，面具加濾罐擋得住',async()=>{
 const run=async(pre)=>{const g=setup();g.run(`G.lv='OB';G.node='OB1';G.zal={};globalThis.pl=G.players[0];pl.inf=0;${pre||''}`);await g.run('passTime(60)');return g};
 let g=await run();assert.ok(g.run('pl.inf')>0);assert.equal(g.run('pl.inf'),g.run('2*Math.round(3*DF().inf)'),'沒戴面具：兩次 +3（照難度的感染倍率）');
 g=await run("pl.items.filter=1;pl.eq.face={k:'gasmask'}");assert.equal(g.run('pl.inf'),0,'面具加濾罐');
 g=await run("G.lv='OF'");assert.equal(g.run('pl.inf'),0,'四樓不是污染區');
});
test('地下室的廢氣：發電機開著、排風機沒修，每 30 分鐘抵抗、生命最低留 1；防毒面具擋不住；修好排風機就沒事；發電機每小時警戒 +1',async()=>{
 const run=async(pre)=>{const g=setup();g.run(`G.lv='OB';G.node='OB2';G.zal={};G.alarm=0;G.flags.blackout=1;G.flags.hgen=1;globalThis.pl=G.players[0];pl.hp=pl.max=20;check=async()=>({ok:false});${pre||''}`);await g.run('passTime(60)');return g};
 let g=await run();assert.ok(g.run('pl.hp')<20,'吸到廢氣');assert.match(log(g),/頭開始痛了/);assert.equal(g.run('G.alarm'),2,'響了一小時（地下室是深處，再多 1）');
 g=await run("pl.hp=2;G.hgS=5");assert.equal(g.run('pl.hp'),1,'最低留 1');
 g=await run("pl.items.filter=1;pl.eq.face={k:'gasmask'}");assert.ok(g.run('pl.hp')<20,'一氧化碳：面具擋不住');assert.match(log(g),/擋不住發電機的廢氣/);
 g=await run("G.flags.hvent=1");assert.equal(g.run('pl.hp'),20,'排風機修好了');assert.equal(g.run('G.alarm'),2,'發電機還是會吵');
 g=await run("G.flags.hgenoff=1");assert.equal(g.run('pl.hp'),20,'關掉了');
 g=await run("G.lv='OF'");assert.equal(g.run('pl.hp'),20,'不在地下室');
});
/* v0.65.0（主人 2026-11-24 改了決定：被抓住改用力量掙脫，不再是 QTE） */
test('伸手可及：床尾的東西安全，床頭櫃要檢定，失敗被抓住（力量掙脫）',()=>{const g=setup();
 const c=JSON.parse(g.run("JSON.stringify(N.OF2a.c.map(c=>({l:c.l,k:c.k||'',q:!!(c.ng&&c.ng.hz&&c.ng.hz.st==='STR'&&!c.ng.qte)})))"));
 assert.deepEqual(c[0],{l:'拿床尾的病歷夾',k:'',q:false});assert.ok(c.slice(1).every(x=>x.k==='AGI'&&x.q),'床頭櫃：敏捷檢定、失敗被抓住要用力量掙脫');
 assert.equal(g.run("srMax('OF2')"),2,'病房挑兩間');
});
test('B-124：解開他，之後在地下室遇到他；不解開不扣善惡值，但他大喊；問話不會用掉這張卡',async()=>{const g=setup();
 g.run("G.flags.ofpre=1");await g.run("enterNode('OF3')");await pick(g,'問他這裡發生了什麼事');assert.equal(g.run('G.node'),'OF3');
 await pick(g,'解開他的約束帶');assert.equal(g.run('G.flags.b124free'),1);assert.equal(g.run('G.flags.ofkey'),1);assert.equal(g.run("rtSkip('OBk')"),false);
 const g2=setup();g2.run("G.flags.ofpre=1;G.lv='OF';G.zal={}");await g2.run("enterNode('OF3')");const k0=g2.run('G.players[0].karma||0');
 g2.run("globalThis.A0=0;const a=addAlarm;addAlarm=(n,p)=>{A0+=n;a(n,p)}");
 await g2.run("(async()=>{const c=choices().find(c=>c.l==='不解開他，繼續走');await applyRes(c,c.ok,G.players[0])})()");
 assert.equal(g2.run('G.players[0].karma||0'),k0,'主人 2026-11-23：不扣');assert.equal(g2.run('A0'),3);assert.equal(g2.run("rtSkip('OBk')"),true);
 assert.match(g2.run('N.OF3.t'),/B-124/,'主人 2026-11-23：研究所的 B-118 是另一個人，醫院這位是 B-124');
});
test('護理師瑞秋：只有敲門有回應才會遇到；沒救她時才有「引到藥局」，扣 2（主人 2026-11-23）',async()=>{const g=setup();
 assert.equal(g.run("rtSkip('OE8')"),true);g.run("G.flags.ernurse=1");assert.equal(g.run("rtSkip('OE8')"),false);
 g.run("G.flags.ernoise=2;G.node='OE11';G.lv='O'");assert.ok(!labels(g).includes('敲藥局的鐵捲門，把它們引過去'));
 g.run("G.flags.nursestay=1");assert.ok(labels(g).includes('敲藥局的鐵捲門，把它們引過去'));const k0=g.run('G.players[0].karma||0');
 await pick(g,'敲藥局的鐵捲門，把它們引過去');assert.equal(g.run('G.players[0].karma'),k0-2);assert.equal(g.run('G.flags.nurselured'),1);
 assert.ok(g.run("N.OE9.c.find(c=>c.l==='帶她一起走一段').ok.r.karma")===1);
});
test('離開醫院之後：街區和警察局改去救護車道，只剩救護車後門；地下室去過就進不去',async()=>{const g=setup();
 assert.ok(labels(g).includes('去醫院'));assert.ok(!labels(g).includes('回聖瑪莉醫院'));
 g.run("G.flags.hspout=1");assert.ok(!labels(g).includes('去醫院'));assert.ok(labels(g).includes('回聖瑪莉醫院'));
 g.run("G.node='L0';G.lv='L'");assert.ok(!labels(g).includes('走到醫院'));
 g.run("G.route=['O','OF']");await g.run("enterNode('Orv')");assert.ok(labels(g).includes('繞到後面，從救護車後門進地下室'));
 await pick(g,'繞到後面，從救護車後門進地下室');assert.equal(g.run('G.node'),'OBa');
 const g2=setup();g2.run("G.flags.hspout=1;G.route=['O','OB']");await g2.run("enterNode('Orv')");assert.ok(!labels(g2).includes('繞到後面，從救護車後門進地下室'));
});
test('A.C.R.U. 期：急診正門進不去，從救護車後門進地下室，可以反過來上四樓；四樓被搬空',async()=>{const g=setup();g.run("G.flags.acru=1;G.flags.shadow=1");
 await g.run("enterNode('O0')");assert.deepEqual(labels(g),['繞到後面，從救護車後門進地下室','走到隔壁的警察局','回街區']);
 await pick(g,'繞到後面，從救護車後門進地下室');assert.equal(g.run('G.node'),'OBa');
 g.run("G.node='OB7';G.lv='OB'");g.run("N.OB7.onEnter()");assert.ok(labels(g).includes('從樓梯上四樓'));
 await pick(g,'從樓梯上四樓');assert.equal(g.run('G.node'),'O2');assert.equal(g.run('G.flags.ofempty'),1);
 await pick(g,'推開玻璃門進去');assert.equal(g.run('G.node'),'OF1');await pick(g,'往病房走');assert.equal(g.run('G.node'),'OFs','搬空的病房');
});
test('舊存檔停在四樓或地下室：換成新的那一層',()=>{const g=setup();
 g.run("globalThis.o={node:'O3',lv:'O',flags:{},players:G.players,clock:300};o=migrateG(o)");assert.equal(g.run('o.lv'),'OB');
 g.run("globalThis.o2={node:'O2',lv:'O',flags:{},players:G.players,clock:300};o2=migrateG(o2)");assert.equal(g.run('o2.lv'),'OF');
});
test('v0.56.1 停電前後的文字一致：停電前機房沒有「不要開」的膠帶、沒有運轉紀錄，太平間的冷藏櫃還是冷的；有電時不寫排風機在轉',()=>{const g=setup();
 g.run("G.flags={};G.lv='OB';G.node='OB2'");assert.match(g.run('N.OB2.t'),/自動待機/);assert.doesNotMatch(g.run('N.OB2.t'),/不要開|靜止/);
 assert.ok(!labels(g).includes('看發電機的運轉紀錄'));assert.match(g.run('N.OB6.t'),/壓縮機在嗡嗡地響/);assert.doesNotMatch(g.run('LV.OB.rule'),/通風扇沒有在轉/);
 g.run("G.node='OB5'");assert.ok(!labels(g).includes('看軟木板上的紙條'));
 assert.doesNotMatch(g.run("N.OE12n.c.find(c=>c.l==='問她地下室的事').ok.t"),/停電那天晚上/);
 g.run("G.flags.blackout=1;G.node='OB2'");assert.match(g.run('N.OB2.t'),/不要開/);assert.ok(labels(g).includes('看發電機的運轉紀錄'));
 assert.match(g.run("N.OE12n.c.find(c=>c.l==='問她地下室的事').ok.t"),/停電那天晚上/);
 g.run("G.flags.streetpower=1");assert.doesNotMatch(g.run('N.OB2.tx()'),/排風機在轉/);
});
