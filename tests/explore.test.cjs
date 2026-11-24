// v0.63.0 三樓情境探索（主人 2026-11-24 與 GPT 討論定案，ZEROCASE_HOTEL_EXPLORATION_SPEC 第 13 節驗收矩陣）
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
const ST={STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2};
function setup(players,mode){const g=game();g.run(`newRun(${JSON.stringify(players||[{kind:'custom',pid:'p1',name:'甲',st:ST,load:{}}])},{diff:'normal'},'${mode||'solo'}');G.node='Z0';G.lv='Z';G.ev=null;LOG=[];globalThis.FT_LOG=[];startFight=async s=>{FT_LOG.push(s)};card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{};deathCheck=async()=>false;tickAll=async()=>true;qte=async()=>true;groundWait=async()=>false;dice=async()=>{};FAST=1`);return g}
const labels=g=>JSON.parse(g.run('JSON.stringify(choices().filter(visible).map(c=>c.l))'));
const pickL=(g,l,r)=>g.run(`(async()=>{const c=choices().find(c=>visible(c)&&c.l===${JSON.stringify(l)});if(!c)throw new Error(G.node+' 沒有選項 ${l}：'+choices().filter(visible).map(c=>c.l).join('、'));const res=c.tb?(c.tb.find(x=>x.g===${JSON.stringify(r||'good')})||c.tb[0]):${r==='bad'?'(c.ng||c.ok)':'c.ok'};await applyRes(c,res,G.players[0],${r==='bad'})})()`);
// 走出三樓：每張卡挑一個不開打的選項；mode：stairs 直接逃、deep 盡量翻東西、win 走窗戶、lift 電梯
async function walk(seed,mode,rd){const g=setup();g.run(`G.sd=${seed};G.dk={on:{},seen:[],cc:{},ret:null};Object.assign(G.flags,${JSON.stringify(rd||{})});G.players[0].gear.push(newGear('crowbar'))`);
 await g.run("enterNode('A1')");let n=0;const seen=[];
 for(let k=0;k<90&&g.run('G.lv')==='A';k++){const id=g.run('G.node');seen.push(id);g.run('G.alarm=0;G.ground=[]');
  const i=g.run(`(()=>{const cs=choices();const ok=cs.map((c,i)=>i).filter(i=>visible(cs[i])&&choiceOk(cs[i]));const M=${JSON.stringify(mode)};
   const res=c=>c.tb?c.tb[0]:c.ok||{};const f=i=>ok.find(j=>f0(cs[j]));let f0;
   if(G.node==='A1'){const m=ok.find(i=>cs[i].l==='看門背後的逃生路線圖');if(m!=null&&!G.flags.map)return m;const o=ok.find(i=>cs[i].opout);if(o!=null)return o}
   if(G.node==='A1r'){const o=ok.find(i=>cs[i].opout);if(o!=null)return o}
   if(G.node==='A6'){const m=ok.find(i=>M==='lift'?/電梯/.test(cs[i].l):M==='win'?/消防梯/.test(cs[i].l):cs[i].l==='東側樓梯');return m==null?-1:m}
   if(M==='win'){const w=ok.find(i=>cs[i].xpx&&/窗戶/.test(cs[i].l));if(w!=null)return w}
   if(M==='stairs'){const r=ok.find(i=>cs[i].xpx&&/東側樓梯/.test(cs[i].l));if(r!=null)return r}
   const calm=ok.filter(i=>!res(cs[i]).fight&&!cs[i].xpx);
   if(M==='deep'){const s=calm.find(i=>/^s[qd]$/.test(cs[i].t));if(s!=null)return s}
   const mv=calm.find(i=>cs[i].t==='mv'&&!(res(cs[i]).go&&N[res(cs[i]).go]));if(M!=='deep'&&mv!=null)return mv;
   return calm.length?calm[0]:ok[0]??-1})()`);
  assert.ok(i>=0,`${id} 沒有選得了的選項（種子 ${seed}，${mode}）`);
  const cnt=g.run(`(()=>{const c=choices()[${i}];return !(c._xpDeep)})()`);
  const f0=g.run('FT_LOG.length');await g.run(`(async()=>{const c=choices()[${i}];const res=c.tb?c.tb[0]:c.ok;await applyRes(c,res,G.players[0],false)})()`);if(cnt)n++;
  if(g.run('FT_LOG.length')>f0&&g.run('G.node')===id)await g.run('enterNode(G.after)')}
 return {n,seen,lv:g.run('G.lv'),g}}

test('E01／E02：選了一個選項，原卡的選項全部關閉、直接出現新的情境；沒有常駐的四個基本行動，也不會回到走廊卡',async()=>{
 for(let s=1;s<=20;s++){const w=await walk(s*977,'stairs');assert.equal(w.lv,'B',`種子 ${s} 沒走出三樓：${w.seen.join('→')}`);
  assert.ok(!w.seen.includes('AH'),'不回到 v0.62.0 的走廊行動卡');assert.ok(!w.seen.includes('AN'),'AN 只是記號，不會停在上面');
  const ids=w.seen.filter(id=>!['A1','A1r','AU','AUl','AUe','AUs'].includes(id));/* 未知客房一段一間，用同一張卡 */const dup=ids.filter((x,i)=>ids.indexOf(x)!==i);assert.deepEqual(dup,[],'一張卡只出現一次：'+w.seen.join('→'))}
 const g=setup();g.run("G.lv='A';G.sd=3");await g.run("enterNode('A1')");await pickL(g,'看門背後的逃生路線圖');await g.run("(async()=>{const c=choices().find(c=>c.opout&&visible(c));await applyRes(c,c.ok,G.players[0])})()");
 assert.equal(g.run('G.node'),'A3','開門出去就是走廊上的第一個情境');for(const l of ['往前走','停下來觀察四周','搜索這裡','找一間空房躲起來休息'])assert.ok(!labels(g).includes(l),'沒有常駐的「'+l+'」');
 const before=JSON.stringify(labels(g));await pickL(g,'站穩，正面迎戰');await g.run('enterNode(G.after)');assert.notEqual(g.run('G.node'),'A3');assert.notEqual(JSON.stringify(labels(g)),before);
});
test('E09／E17：一般路線、深入搜索、窗戶、電梯都走得出去；長度隨種子浮動，不是固定步數；同一個種子走法一樣',async()=>{
 const st={};for(const m of ['stairs','deep','win','lift']){const ns=[];for(let s=1;s<=25;s++){const w=await walk(s*7919,m,{rd_rwin:s&1,rd_rlift:s>>1&1,rd_r302:s>>2&1,rd_rbar:s>>3&1});
   assert.equal(w.lv,m==='lift'?'C':m==='win'?'D':'B',`${m} 種子 ${s}：${w.seen.join('→')}`);ns.push(w.n)}
  st[m]={min:Math.min(...ns),max:Math.max(...ns)}}
 console.log('三樓選擇次數（25 個種子，最少～最多）',JSON.stringify(st));
 assert.ok(st.stairs.max>st.stairs.min,'長度會浮動');assert.ok(st.deep.min>=st.stairs.min,'深入搜索比直接逃走長');assert.ok(st.win.min<st.stairs.min,'窗戶是捷徑');
 const a=await walk(4242,'stairs'),b=await walk(4242,'stairs');assert.deepEqual(a.seen,b.seen,'同一個種子、同一套走法，遇到的一樣');
 const seq=new Set();for(let s=1;s<=12;s++)seq.add((await walk(s*31,'stairs')).seen.slice(2,8).join());assert.ok(seq.size>=8,'不同種子遇到的不一樣');
});
test('地理：固定房號的劇情只在自己那一段；303、302／306、房務推車在西段，307～310 在中段，318、316 在東段；馬可在轉角',async()=>{
 const W=['A3','A3c','A4','A4d','A4b','A4c','A3x','AD1','AW1','AW2','AW3','AW4'],M=['A4e','A4f','A4h','AM1','AM2','AM3','AM4','AM5','AM6','AD4','AD5'],E=['AT1','AT2','AT3','AT4','AT5','AD7','AD8','A6b','A6'];
 for(let s=1;s<=25;s++){const w=await walk(s*613,'deep');const at=id=>w.seen.indexOf(id);const iw=Math.max(...W.map(at)),im=M.filter(id=>at(id)>=0),ie=E.filter(id=>at(id)>=0);
  for(const x of im)assert.ok(at(x)>iw,`中段的 ${x} 出現在西段之前：${w.seen.join('→')}`);for(const x of ie)for(const y of im)assert.ok(at(x)>at(y),`東段的 ${x} 出現在中段 ${y} 之前`);
  const md=at('A6d');if(md>=0){assert.ok(md>iw,'馬可在西段走完的轉角');for(const y of im)assert.ok(md<at(y))}
  for(const id of ['A3','A3c','A4','A4d','A4e','A6'])assert.ok(at(id)>=0,`固定的 ${id} 一定會經過（種子 ${s}）`)}
});
test('E03：未知客房的內容開局就定好；先聽門再進去、直接推門，看到的是同一個房間；聽不出來也不會換房間',async()=>{
 const kinds=new Set();
 for(let s=1;s<=60;s++){const g=setup();g.run(`G.lv='A';G.sd=${s*101};G.flags={};G.dk={on:{},seen:[],cc:{},ret:null};delete G.xp;xpSt();G.xp.seg='m';G.xp.k=G.xp.q.indexOf('@m')+1`);
  let id=null;for(let n=0;n<12&&id!=='AU';n++)id=g.run("xpDraw('m')");if(id!=='AU')continue;const r=JSON.parse(g.run('JSON.stringify(G.xp.rm)'));kinds.add(r.k);
  g.run(`globalThis.S0=JSON.stringify(G);G.node='AU'`);await pickL(g,'貼著門縫聽一下');assert.equal(g.run('G.node'),'AUl');assert.equal(g.run('G.xp.rm.k'),r.k,'聽門不改內容');
  g.run("G=migrateG(JSON.parse(S0));G.node='AU'");await pickL(g,'貼著門縫聽一下','bad');assert.equal(g.run('G.xp.rm.k'),r.k,'聽不出來也不換');assert.match(g.run('N.AUl.t'),/聽不出/);
  g.run("G=migrateG(JSON.parse(S0));G.node='AU'");const f0=g.run('FT_LOG.length');await pickL(g,'推開門進去');
  if(r.k==='foe')assert.equal(g.run('FT_LOG.length'),f0+1,'房裡有感染者就開打');else assert.equal(g.run('G.node'),r.k==='surv'?'AUs':'AUe')}
 assert.deepEqual([...kinds].sort(),['empty','foe','surv']);
});
test('E04／E05：快速翻完換一張新的卡（繼續仔細翻／帶著東西離開），原卡不再出現；仔細翻不重複發已經拿走的；沒有到處都能休息',async()=>{
 const g=setup();g.run("G.lv='A';G.sd=5;delete G.xp;xpSt();G.xp.seg='w';G.xp.k=3;G.node='A4c';G.players[0].items={}");
 await pickL(g,'快速翻他的口袋','good');assert.notEqual(g.run('G.node'),'AQ','沒帶布：沒有能繼續翻的方法，直接往下走');assert.ok(g.run("hasI(G.players[0],'g:beretta')"));
 const g2=setup();g2.run("G.lv='A';G.sd=5;delete G.xp;xpSt();G.xp.seg='w';G.xp.k=3;G.node='A4c';G.players[0].items={cloth:1}");await pickL(g2,'快速翻他的口袋','good');assert.equal(g2.run('G.node'),'AQ');
 await pickL(g2,'用布包著手翻','good');assert.equal(g2.run("G.players[0].gear.filter(w=>(w.k||w.id)==='beretta').length"),1,'槍不會拿到兩把');
 const h=setup();h.run("G.lv='A';G.sd=5;delete G.xp;xpSt();G.xp.seg='w';G.xp.k=3;G.node='AW2';G.players[0].items={}");
 await pickL(h,'快速翻椅背的置物袋','good');assert.equal(h.run('G.node'),'AQ');assert.ok(labels(h).includes('把置物袋整個倒出來翻'));assert.ok(!labels(h).includes('快速翻椅背的置物袋'),'原卡的選項不再出現');
 await pickL(h,'把置物袋整個倒出來翻','good');assert.equal(h.run('G.players[0].items.water||0'),1,'水只拿到一次');assert.notEqual(h.run('G.node'),'AW2');
 const k=setup();k.run("G.lv='A';G.sd=5;delete G.xp;xpSt();G.xp.seg='w';G.xp.k=3;G.node='AW2'");await pickL(k,'不碰');assert.notEqual(k.run('G.node'),'AQ','不碰就直接走');
 // 休息只在能躲的地方（309、兩頭夾擊時閃進空房）；三樓其他卡沒有休息、睡覺
 const rest=JSON.parse(g.run("JSON.stringify(Object.keys(N).filter(id=>N[id].L==='A'&&id!=='AH'&&!/^AS[wme]$/.test(id)).flatMap(id=>{let cs=[];try{cs=N[id].c||[]}catch(e){}return cs.filter(c=>!c._hid&&(c.quiet||c.t==='sleep'||c.t==='nap'||/休息/.test(c.l))).map(c=>id)}))"));
 assert.deepEqual([...new Set(rest)].sort(),['A4h'],'三樓能休息的地方：'+rest.join());
});
test('E06／E08：310 的老夫妻、轉角的馬可不保證遇到；錯過不扣善惡值；自己敲 310 的門一定見到',async()=>{
 let met=0,miss=0,marco=0;
 for(let s=1;s<=30;s++){const w=await walk(s*389,'stairs');const k=w.g.run('G.players[0].karma||0');if(w.seen.includes('A4f'))met++;else{miss++;assert.ok(!w.g.run('G.flags.elderleft'),'沒遇到不算不理');if(!w.seen.includes('A6d'))assert.equal(k,0,'沒遇到不扣善惡值')}if(w.seen.includes('A6d'))marco++}
 assert.ok(met>0&&miss>0,`老夫妻遇到 ${met}、錯過 ${miss}`);assert.ok(marco>0&&marco<30,'馬可 '+marco);
 const g=setup();g.run("G.lv='A';G.sd=9;delete G.xp;xpSt();G.node='A4e';G.flags={}");await pickL(g,'蹲下來，輕輕敲 310 的門');assert.equal(g.run('G.node'),'A4f');assert.match(g.run('N.A4f.t'),/回敲了兩下/);
 await pickL(g,'叫他們把門鎖好，不要出來');assert.equal(g.run('G.flags.elderstay'),1);assert.ok(!g.run("G.xp.q.slice(G.xp.k).includes('?A4f')")||!g.run("xpCond('A4f')"),'見過就不再出現');
});
test('E07：西段知道窗外有消防梯才看得到退回 301；窗戶卡住要工具；東段看得到樓梯口才可以不再停留',async()=>{
 const g=setup();g.run("G.lv='A';G.sd=9;delete G.xp;xpSt();G.xp.seg='w';G.xp.k=4;G.node='A4';G.flags={}");assert.ok(!labels(g).some(l=>/退回 301/.test(l)),'沒看逃生路線圖');
 g.run("G.flags={map:1}");assert.ok(labels(g).includes('退回 301，從窗戶爬到消防梯'));g.run("G.flags={map:1,rd_rwin:1}");const i=g.run("choices().findIndex(c=>visible(c)&&/退回 301/.test(c.l))");assert.ok(g.run(`!!choices()[${i}].req`));
 g.run("G.xp.seg='e';G.xp.ne=0;G.node='AT2';G.flags={}");assert.ok(!labels(g).some(l=>/東側樓梯那頭/.test(l)),'剛進東段還看不到');g.run("G.flags={radiotip:1}");assert.ok(labels(g).some(l=>/東側樓梯那頭/.test(l)),'聽說東梯能走');
 await pickL(g,'不再停留，直接往東側樓梯那頭走');assert.equal(g.run('G.node'),'A6');
});
test('E10：牌庫抽乾、條件都不成立時，照地理走到下一段和出口，不會卡住、不會回到常駐選單',async()=>{
 const g=setup();g.run("G.lv='A';G.sd=11;G.flags={};delete G.xp;xpSt();G.xp.seen=Object.keys(N).filter(id=>N[id].deck);G.xp.rooms={m:'x',e:'x'};G.xp.k=G.xp.q.indexOf('@m')");
 const got=[];for(let n=0;n<10;n++){const id=g.run('xpGen()');got.push(id);if(id==='A6')break}
 assert.equal(got[got.length-1],'A6','走到出口：'+got.join());assert.ok(!got.includes('AH'));
});
test('E12：同一個種子存讀檔，下一個情境、未知客房的內容、結果都一樣；戰鬥後才決定下一張',async()=>{
 const g=setup();g.run("G.lv='A';G.sd=77;delete G.xp;xpSt();G.node='A3';G.stp=4;globalThis.S1=JSON.stringify(G)");
 const go=async()=>{g.run('G=migrateG(JSON.parse(S1))');await g.run('doChoice(choices().findIndex(c=>c.l===\'站穩，正面迎戰\'),G.players[0])');return g.run('G.after')};
 assert.equal(await go(),'AN','打起來的時候還沒抽下一張');await g.run('enterNode(G.after)');const a=g.run('G.node');await go();await g.run('enterNode(G.after)');assert.equal(g.run('G.node'),a);
});
test('E13：舊存檔（v0.62.0 走廊、搜索卡、牌庫卡做到一半）轉到新流程，物品旗標不動',async()=>{
 const g=setup();const old=JSON.parse(g.run("JSON.stringify(G)"));Object.assign(old,{lv:'A',node:'AH',ex:{p:6,fresh:0},flags:{mkey:1,elders:1}});old.dk.seen=['AM1','AW2'];old.players[0].items={water:2};
 g.run(`G=migrateG(${JSON.stringify(JSON.stringify(old))}.length?JSON.parse(${JSON.stringify(JSON.stringify(old))}):null)`);assert.equal(g.run('G.node'),'AH');assert.equal(g.run('G.flags.mkey'),1);assert.equal(g.run('G.players[0].items.water'),2);
 assert.deepEqual(labels(g),['沿著牆繼續往前']);await pickL(g,'沿著牆繼續往前');const id=g.run('G.node');assert.notEqual(id,'AH');assert.equal(g.run('G.xp.seg'),'m','走到第 6 步的人接在中段');assert.ok(!['AM1','AW2'].includes(id));
 const h=setup();const o2=JSON.parse(h.run("JSON.stringify(G)"));Object.assign(o2,{lv:'A',node:'ASm',ex:{p:5}});o2.dk.ret='AH';h.run(`G=migrateG(JSON.parse(${JSON.stringify(JSON.stringify(o2))}))`);await pickL(h,'算了，不翻了');assert.ok(!['AH','ASm'].includes(h.run('G.node')));
});
test('E14／E15：多人分頭翻同一間房：各自的動作各自結算、時間只算最長那一件、同一個地方只能一個人；舊畫面的按鈕不算',async()=>{
 const two=[{kind:'custom',pid:'p1',name:'甲',st:ST,load:{}},{kind:'custom',pid:'p2',name:'乙',st:ST,load:{}}];
 const g=setup(two,'mp');g.run("G.lv='A';G.sd=21;delete G.xp;xpSt();G.xp.seg='w';G.xp.k=4;G.node='A4b';G.phase='node';G.votes={};G.players.forEach(p=>p.items={})");
 assert.equal(g.run('xpSplit()'),true);const ib=g.run("choices().findIndex(c=>c.l==='仔細翻那三只行李箱')"),is=g.run("choices().findIndex(c=>c.l==='掃一遍置物架')"),iq=g.run("choices().findIndex(c=>c.l==='快速翻最上面那一只')");
 g.run(`vote('p1',${ib})`);g.run(`vote('p2',${iq})`);assert.equal(g.run("G.votes.p2"),undefined,'行李箱已經有人在翻');assert.equal(g.run(`xpSoloOk('p2',${is})`),true);
 const c0=g.run('G.clock');g.run(`G.votes.p2=${is}`);await g.run('xpSplitResolve()');
 assert.notEqual(g.run('G.node'),'A4b','做完一起往下一個情境');assert.ok(g.run("(G.players[0].items.rope||0)>=1"),'甲翻到行李箱的東西');assert.ok(g.run("(G.players[1].items.tape||0)>=1"),'乙掃了置物架');
 const dt=g.run('G.clock')-c0;assert.ok(dt<=60+15,'兩件同時做，時間只算一次：'+dt);
 // 舊畫面：上一張卡的按鈕送過來不算
 g.run("G.node='A4b';G.phase='node';G.votes={};busy=false;globalThis.ST0=G.stp");g.run("handle('p2',{a:'vote',i:0,s:ST0-1})");assert.equal(g.run('G.votes.p2'),undefined);g.run("handle('p2',{a:'vote',i:0,s:ST0})");assert.equal(g.run('G.votes.p2'),0);
});
