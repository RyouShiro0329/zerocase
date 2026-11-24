// v0.64.0 整座旅館改成情境探索（主人 2026-11-24 20:52：三樓 v0.63.1 定為範本，二樓以下、地下、捷徑一次改完；文字要合理、文字和效果要一致）
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
const ST={STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2};
const TWO=[{kind:'custom',pid:'p1',name:'甲',st:ST,load:{}},{kind:'custom',pid:'p2',name:'乙',st:ST,load:{}}];
function setup(players,mode){const g=game();g.run(`newRun(${JSON.stringify(players||[{kind:'custom',pid:'p1',name:'甲',st:ST,load:{}}])},{diff:'normal'},'${mode||'solo'}');G.node='Z0';G.lv='Z';G.ev=null;LOG=[];globalThis.FT_LOG=[];startFight=async s=>{FT_LOG.push(s)};card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{};deathCheck=async()=>false;tickAll=async()=>true;qte=async()=>true;groundWait=async()=>false;dice=async()=>{};FAST=1`);return g}
const labels=g=>JSON.parse(g.run('JSON.stringify(choices().filter(visible).map(c=>c.l))'));
const log=g=>g.run("LOG.map(x=>x[0]).join('\\n')");
const pickL=(g,l,r)=>g.run(`(async()=>{G.alarm=0;const c=choices().find(c=>visible(c)&&c.l===${JSON.stringify(l)});if(!c)throw new Error(G.node+' 沒有選項 ${l}：'+choices().filter(visible).map(c=>c.l).join('、'));const res=c.tb?(c.tb.find(x=>x.g===${JSON.stringify(r||'good')})||c.tb[0]):${r==='bad'?'(c.ng||c.ok)':'c.ok'};await applyRes(c,res,G.players[0],${r==='bad'})})()`);
// 三樓的走法跟 tests/explore.test.cjs 一樣
async function walk3(seed,mode,rd){const g=setup();g.run(`G.sd=${seed};G.dk={on:{},seen:[],cc:{},ret:null};Object.assign(G.flags,${JSON.stringify(rd||{})});G.players[0].gear.push(newGear('crowbar'))`);
 await g.run("enterNode('A1')");const seen=[];
 for(let k=0;k<90&&g.run('G.lv')==='A';k++){const id=g.run('G.node');seen.push(id);g.run('G.alarm=0;G.ground=[]');
  const i=g.run(`(()=>{const cs=choices();const ok=cs.map((c,i)=>i).filter(i=>visible(cs[i])&&choiceOk(cs[i]));const M=${JSON.stringify(mode)};
   const res=c=>c.tb?c.tb[0]:c.ok||{};
   if(G.node==='A1'){const m=ok.find(i=>cs[i].l==='摸黑走到門邊');if(m!=null)return m}
   if(G.node==='A1d'){const m=ok.find(i=>/逃生路線圖/.test(cs[i].l));if(m!=null)return m}
   if(/^A1[wmz]$/.test(G.node)){const m=ok.find(i=>cs[i].opout||cs[i].opgo==='A1z');if(m!=null)return m}
   if(G.node==='A6'){const m=ok.find(i=>M==='lift'?/電梯/.test(cs[i].l):M==='win'?/消防梯/.test(cs[i].l):cs[i].l==='東側樓梯');return m==null?-1:m}
   if(M==='win'){const w=ok.find(i=>cs[i].xpx&&/窗戶/.test(cs[i].l));if(w!=null)return w}
   if(M==='stairs'){const r=ok.find(i=>cs[i].xpx&&/東側樓梯/.test(cs[i].l));if(r!=null)return r}
   const calm=ok.filter(i=>!res(cs[i]).fight&&!cs[i].xpx);
   if(M==='deep'){const s=calm.find(i=>/^s[qd]$/.test(cs[i].t));if(s!=null)return s}
   const mv=calm.find(i=>cs[i].t==='mv'&&!(res(cs[i]).go&&N[res(cs[i]).go]));if(M!=='deep'&&mv!=null)return mv;
   return calm.length?calm[0]:ok[0]??-1})()`);
  const f0=g.run('FT_LOG.length');await g.run(`(async()=>{const c=choices()[${i}];const res=c.tb?c.tb[0]:c.ok;await applyRes(c,res,G.players[0],false)})()`);
  if(g.run('FT_LOG.length')>f0&&g.run('G.node')===id)await g.run('enterNode(G.after)')}
 return seen}
// 其他樓層：W＝優先挑的選項
async function walkF(seed,start,W,pre,flags){const g=setup();g.run(`G.sd=${seed};G.route=${JSON.stringify(pre||['A'])};G.lv='A';Object.assign(G.flags,${JSON.stringify(flags||{})});G.players[0].items.coin=1;G.players[0].items.bandage=2;G.players[0].gear.push(newGear('crowbar'))`);
 await g.run(`enterNode('${start}')`);const L0=g.run('G.lv');const seen=[];
 for(let k=0;k<80&&g.run('G.lv')===L0;k++){const id=g.run('G.node');seen.push(id);g.run('G.alarm=0;G.ground=[]');
  const i=g.run(`(()=>{const cs=choices();const ok=cs.map((c,i)=>i).filter(i=>visible(cs[i])&&choiceOk(cs[i])&&!(cs[i].ok&&cs[i].ok.code));const W=${JSON.stringify(W||[])};
   const res=c=>c.tb?c.tb[0]:c.ok||{};for(const w of W){const m=ok.find(i=>cs[i].l===w);if(m!=null)return m}
   const calm=ok.filter(i=>!res(cs[i]).fight&&!cs[i].xpx);return calm.length?calm[0]:ok[0]??-1})()`);
  const f0=g.run('FT_LOG.length');await g.run(`(async()=>{const c=choices()[${i}];const res=c.tb?c.tb[0]:c.ok;await applyRes(c,res,G.players[0],false)})()`);
  if(g.run('FT_LOG.length')>f0)await g.run('enterNode(G.after)')}
 return {seen,g}}

test('三樓不變：引擎拆開之後，同一個種子、同一套走法遇到的卡和 v0.63.1 一模一樣',async()=>{
 const want={stairs1:["A1","A2","A1d","A1z","A3","A4d","A4","AE1","A3c","AD6","A6d","AM3","A4e","AD4","AD7","A6","A6e"],
  deep2:["A1","AO2","A1d","A1z","A3","A3c","AW2","AQ","A4d","AW3","A4","A6d","AD3","A4e","AE5","AD6","AQ","A6","A6e"],
  win3:["A1","A1d","A1z","A3","A4"],
  lift4:["A1","AO2","A1d","A1z","A3","A3c","A4","AD2","A4d","AW4","AW3","A6d","AM4","AU","A4e","A4f","AT5","AT2","A6"]};
 for(const [k,seq] of Object.entries(want)){const m=k.replace(/\d+$/,''),s=+k.match(/\d+$/)[0];
  assert.deepEqual(await walk3(s*7919,m,{rd_rwin:s&1,rd_rlift:s>>1&1,rd_r302:s>>2&1,rd_rbar:s>>3&1}),seq,k)}
 const g=setup();assert.deepEqual(JSON.parse(g.run('JSON.stringify(Object.keys(XPL))')).sort(),['A','B','C','D','E','G','R'],'每一層一份設定，共用同一套引擎');
 assert.equal(g.run("typeof XPL.A.plan+typeof XPL.B.plan+typeof xpGen"),'functionfunctionfunction');
});

test('地理：二樓、一樓、地下、消防梯的順序照實際的位置走；固定的劇情卡一定經過',async()=>{
 for(let s=1;s<=20;s++){
  const b=(await walkF(s*31,'B1')).seen,at=x=>b.indexOf(x);
  for(const x of ['B1','B2','B1w','B2p','B2w','B2b','B4'])assert.ok(at(x)>=0,`二樓一定經過 ${x}：${b.join('→')}`);
  assert.ok(at('B1')<at('B2')&&at('B2')<at('B1w')&&at('B1w')<at('B2p'),'樓梯口→保全的屍體→窗邊→保全室');
  for(const x of ['B2m','B2x'])if(at(x)>=0)assert.ok(at(x)>at('B2p')&&at(x)<at('B2w'),'宴會廳那一區在保全室之後、奈特之前');
  assert.ok(at('B2w')<at('B2b')&&at('B2b')<at('B4'));
  const e=(await walkF(s*31,'E1',['穿過洗衣房'])).seen,ae=x=>e.indexOf(x);
  assert.ok(ae('E1')<ae('E2')&&ae('E2')<ae('E3d')&&ae('E3d')<ae('E1g')&&ae('E1g')<ae('E7')&&ae('E7')<ae('H1'),'前場→員工通道→岔路→洗衣房：'+e.join('→'));
  assert.ok(!e.some(x=>/^F/.test(x)),'走洗衣房就不經過廚房');assert.ok(!e.includes('E1s'),'沒走員工樓梯，不會在員工樓梯底');
  const st=(await walkF(s*31,'E1s',['穿過廚房'],['A','B'],{hstaff:1})).seen,as=x=>st.indexOf(x);
  assert.ok(as('E1s')<as('E1g')&&as('E1g')<as('E2')&&as('E2')<as('E7'),'從員工樓梯下來的人，從員工通道繞到前場：'+st.join('→'));
  assert.equal(st.filter(x=>x==='E2').length,1,'前場走廊只走一次');assert.ok(!st.some(x=>/^H/.test(x)));
  const d=(await walkF(s*31,'D1',['繼續往下','跳下去，直接從後巷離開'])).seen;assert.ok(d.indexOf('D2x')<d.indexOf('D2'),'先到三樓平台，再到二樓平台：'+d.join('→'));
  const gg=(await walkF(s*31,'G1',['從車道連通門到停車場'])).seen;assert.ok(gg.indexOf('G4')<gg.indexOf('P1'),'設備層走到底才到停車場');
 }
});

test('每一層的隨機情境來自自己的牌庫，照地理分段；每局不同、同一個種子一樣',async()=>{
 const g=setup();const decks=JSON.parse(g.run("JSON.stringify(Object.fromEntries(['B','E','G','C','D','R'].map(L=>[L,dkList(L).length])))"));
 for(const [L,n] of Object.entries(decks))assert.ok(n>=2,L+' 牌庫 '+n+' 張');
 const segBad=JSON.parse(g.run("JSON.stringify(['B','E','G','C','D','R'].flatMap(L=>dkList(L).filter(id=>N[id].L!==L).map(id=>id)))"));assert.deepEqual(segBad,[]);
 const kitchen=JSON.parse(g.run("JSON.stringify(dkList('E').filter(id=>[].concat(N[id].seg).includes('k')))")),laundry=JSON.parse(g.run("JSON.stringify(dkList('E').filter(id=>[].concat(N[id].seg).includes('l')))"));
 const seqs=new Set();
 for(let s=1;s<=20;s++){const w=(await walkF(s*53,'E1',['穿過洗衣房'])).seen;seqs.add(w.join());for(const x of kitchen)assert.ok(!w.includes(x),'走洗衣房不會抽到廚房的卡 '+x)}
 assert.ok(seqs.size>=8,'不同種子遇到的不一樣：'+seqs.size);
 const a=(await walkF(99,'B1')).seen,b=(await walkF(99,'B1')).seen;assert.deepEqual(a,b,'同一個種子一樣');
 assert.ok(laundry.length>=2&&kitchen.length>=2);
});

test('文字和效果一致：305 的三明治和柳橙汁、水塔的水；吃喝的結算照吃道具的格式寫出來；吃了喝了的文字一定有效果',async()=>{
 const g=setup();g.run("G.lv='A';G.node='AW1';G.players[0].hun=3;G.players[0].thi=3");await pickL(g,'拿走餐盤上的東西','mid');
 assert.equal(g.run('G.players[0].hun'),5);assert.equal(g.run('G.players[0].thi'),5,'柳橙汁有喝');assert.match(log(g),/飢餓 \+2　口渴 \+2/);
 const h=setup();h.run("G.lv='A';G.node='AW1';G.players[0].hun=3;G.players[0].thi=3");await pickL(h,'拿走餐盤上的東西','bad');assert.equal(h.run('G.players[0].thi'),5);assert.match(h.run('N.AW1.c[2].tb[1].t'),/柳橙汁也喝光/);
 const r=setup();r.run("G.lv='R';G.node='R2';G.players[0].thi=2");await pickL(r,'喝水塔裡的水');assert.equal(r.run('G.players[0].thi'),6);
 // 旅館每一張卡：寫了「你把它吃掉／喝光」的結果，一定有飢餓或口渴的效果
 const bad=JSON.parse(g.run(`JSON.stringify((()=>{const o=[];const L='ABCDEGIR';const eat=/你[^。「」]{0,20}(吃掉|吃了|喝光|喝了|一口喝|喝得停不下來|喝了好幾口)/;
  const chk=(w,r)=>{if(!r)return;let t='';try{t=r.t||''}catch(e){}if(eat.test(t)&&!(r.p&&(r.p.hun||r.p.thi)))o.push(w)};
  for(const id of Object.keys(N)){if(!L.includes(N[id].L))continue;let cs=[];try{cs=N[id].c||[]}catch(e){}cs.forEach((c,i)=>{chk(id+i,c.ok);chk(id+i+'ng',c.ng);(c.tb||[]).forEach((x,j)=>chk(id+i+'tb'+j,x))})}return o})())`));
 assert.deepEqual(bad,[],'寫了吃喝卻沒有效果');
 // 瓊幫你包紮：回血也止血，結算寫出來
 const j=setup();j.run("G.lv='B';G.node='B2b';G.flags.elders=1;G.players[0].hp=G.players[0].max-8;G.players[0].bleed=1");await pickL(j,'讓瓊幫你處理傷口');
 assert.equal(j.run('G.players[0].bleed'),0);assert.match(log(j),/生命 \+6/);
});

test('文字合理：生物災難不是靈異，東西不會自己動；停電、瓦斯的狀況前後一致',()=>{const g=setup();
 const txt=g.run(`(()=>{const o=[];const L='ABCDEGIR';const add=r=>{if(!r)return;try{o.push(r.t||'')}catch(e){}if(r.qte){add(r.qte.ok);add(r.qte.ng)}if(r.win)add(r.win)};
  for(const id of Object.keys(N)){const n=N[id];if(!L.includes(n.L)||n.ev)continue;try{o.push(n.t||'')}catch(e){}let cs=[];try{cs=n.c||[]}catch(e){}for(const c of cs){add(c.ok);add(c.ng);(c.tb||[]).forEach(add)}}return o.join('\\n')})()`);
 for(const s of ['布料離開了貓眼','一片深色的布料','自己彈開','那台機器的門，在你身後慢慢闔上','雨刷在你經過的時候突然動了一下','覺得那不是水','像有人在下面呼吸','濕漉漉的嘆息','緊急照明重新亮了起來','電視還開著','皮膚底下有東西在蠕動','又像是在叫自己的名字','門內透出一點火光','一圈小小的藍色火焰','門把慢慢往下轉','往你的方向鼓了一下','人影不見了'])
  assert.ok(!txt.includes(s),'旅館文字不該再出現：'+s);
 assert.match(g.run('N.AO4.t'),/外套的肩膀/,'301 貓眼：門外靠著的是一個穿著衣服的人');
 assert.match(g.run('N.AD3.t'),/點東西照明/,'煙霧偵測器有原因');
});

test('存讀檔、種子：二樓走到一半存檔讀回來，下一個情境一樣；v0.63.1 的舊存檔停在二樓以下，接在走到的地方',async()=>{
 const g=setup();g.run("G.sd=321;G.route=['A'];G.lv='A'");await g.run("enterNode('B1')");await g.run(`(async()=>{const c=choices()[0];await applyRes(c,c.ok,G.players[0],false)})()`);await g.run('enterNode(G.after)');
 assert.equal(g.run('G.node'),'B2');g.run('globalThis.S1=JSON.stringify(G)');
 await pickL(g,'搜保全的屍體');const a=g.run('G.node');g.run('G=migrateG(JSON.parse(S1))');await pickL(g,'搜保全的屍體');assert.equal(g.run('G.node'),a,'讀檔後一樣');
 // 舊存檔：G.xp 還是三樓的（沒有 L），人停在二樓的楓葉廳
 const h=setup();const old=JSON.parse(h.run('JSON.stringify(G)'));Object.assign(old,{sd:44,lv:'B',node:'B2m',route:['A','B'],xp:{k:9,seg:'e',ne:2,seen:['A3','A6'],rooms:{},cc:0,q:['@w','A3','A6']}});
 Object.assign(old.flags,{v_B1:1,v_B2:1,v_B1w:1,v_B2p:1,v_B2m:1});h.run(`G=migrateG(JSON.parse(${JSON.stringify(JSON.stringify(old))}))`);
 await pickL(h,'看門口的立牌');const id=h.run('G.node');assert.ok(!['B1','B2','B1w','B2p','B2m'].includes(id),'不會從二樓開頭重來：'+id);assert.equal(h.run('G.xp.L'),'B');
 // 舊存檔停在原本的隨機事件格：做完接回情境探索
 assert.equal(h.run('N.B3.next+N.E3.next+N.G3.next'),'BXNEXNGXN');
});

test('戰鬥後續：二樓打完照當下的狀態接下一個情境；一樓開槍點燃瓦斯之後也是',async()=>{
 const g=setup();g.run("G.sd=8;G.route=['A'];G.lv='A'");await g.run("enterNode('B1')");await pickL(g,'站在原地迎戰');assert.equal(g.run('G.after'),'BXN','打起來的時候還沒抽下一張');
 await g.run('enterNode(G.after)');assert.equal(g.run('G.node'),'B2');
 const f=setup();f.run("G.sd=8;G.route=['A','B'];G.lv='B'");await f.run("enterNode('F2')");f.run("G.players[0].gear.push(newGear('beretta'));G.players[0].gear.at(-1).mag=4");assert.ok(labels(f).includes('開槍'));
 await f.run(`(async()=>{const c=choices().find(c=>c.l==='開槍');await applyRes(c,c.ok,G.players[0],false)})()`);assert.equal(f.run('G.flags.hboom'),1);assert.notEqual(f.run('G.node'),'F3','不再跳去隨機事件格');assert.equal(f.run('G.lv'),'E');
});

test('多人：二樓保全的屍體和三間房可以分頭做（同一個地方一個人、時間算最長的一件）；各樓層的繼續翻是自己那一層的卡',async()=>{
 const g=setup(TWO,'mp');g.run("G.sd=5;G.route=['A'];G.lv='B';G.node='B2';delete G.xp;xpSt('B');G.xp.k=G.xp.q.indexOf('B2')+1;G.phase='node';G.votes={};G.players.forEach(p=>p.items={})");
 assert.equal(g.run('xpSplit()'),true);const i1=g.run("choices().findIndex(c=>c.l==='進 203：門上有彈孔的那間')"),i2=g.run("choices().findIndex(c=>c.l==='進 205：門被釘過的那間')");
 g.run(`vote('p1',${i1})`);g.run(`vote('p2',${i1})`);assert.equal(g.run('G.votes.p2'),undefined,'203 已經有人在翻');
 const c0=g.run('G.clock');g.run(`G.votes.p2=${i2}`);await g.run('xpSplitResolve()');assert.notEqual(g.run('G.node'),'B2');
 assert.ok(g.run("(G.players[0].items.tape||0)>=1"),'甲翻 203');assert.ok(g.run("(G.players[1].items.nails||0)>=1"),'乙翻 205');assert.ok(g.run('G.clock')-c0<=75,'時間只算一次');
 const h=setup();for(const L of ['B','E','G','C','D','R'])assert.equal(h.run(`N[XPL.${L}.aq].L+N[XPL.${L}.mark].L`),L+L);
 const k=setup();k.run("G.sd=5;G.route=['A'];G.lv='B';delete G.xp;xpSt('B');G.xp.seg='w';G.node='BD1';G.players[0].items={}");await pickL(k,'順手翻門口那只行李箱');assert.equal(k.run('G.node'),'BXQ');assert.equal(k.run('G.lv'),'B','繼續翻不會跳回三樓');
 await pickL(k,'趁光轉開，把 204 翻一遍');assert.ok(!['BD1','BXQ'].includes(k.run('G.node')));
});

test('沒有原地反覆：地下的發電機發動後是新的情境；頂樓撞不開機房不會一直重來；瓦斯關了就不會再有人點菸；帶著老夫妻要先到吧台',async()=>{
 const g=setup();g.run("G.lv='G';G.sd=3;delete G.xp;xpSt('G');G.node='G2'");await pickL(g,'啟動發電機');assert.equal(g.run('G.node'),'G2g');assert.ok(labels(g).includes('打開排風機的開關'));
 await pickL(g,'打開排風機的開關');assert.equal(g.run('G.flags.fanon'),1);assert.ok(!['G2','G2g'].includes(g.run('G.node')));
 const r=setup();r.run("G.lv='R';G.node='R4';G.flags={}");await pickL(r,'用身體撞開機房','bad');assert.equal(r.run('G.node'),'R4');assert.ok(!labels(r).includes('用身體撞開機房'));assert.match(r.run('N.R4.t'),/紋風不動/);
 const e=setup();e.run("G.lv='E';G.flags={}");assert.equal(e.run("dkOk(N.ED2)"),true);e.run('G.flags.gasoff=1');assert.equal(e.run("dkOk(N.ED2)"),false);
 const b=setup();b.run("G.lv='B';G.sd=3;delete G.xp;xpSt('B');G.xp.seg='m';G.xp.ne=3;G.node='B2x';G.flags={elders:1}");assert.ok(!labels(b).some(l=>/員工門/.test(l)),'哈蒙夫婦還跟著，不能跳過吧台');
 b.run("G.flags={}");assert.ok(labels(b).some(l=>/員工門/.test(l)));
 // 情境探索的樓層沒有「留在原地」的選項
 const stay=JSON.parse(b.run("JSON.stringify(Object.keys(N).filter(id=>['B','E','G','C','D','R'].includes(N[id].L)).flatMap(id=>{let cs=[];try{cs=N[id].c||[]}catch(e){}return cs.filter(c=>c.stay).map(c=>id)}))"));assert.deepEqual(stay,[]);
});
