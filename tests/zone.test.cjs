// v0.24.0 地圖重構（Claude 2026-11-16）留下的警戒規則；v0.39.0 旅館改成單向路線（docs/HOTEL_ROUTE_SPEC.md），區域畫面的測試換成路線的測試。
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(){const g=game();g.run("newRun([{kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'normal'},'solo');G.node='A1';G.lv='A';G.ev=null;LOG=[];globalThis.FT_LOG=[];startFight=async s=>{FT_LOG.push(s);G.fight={foes:[]};G.phase='fight'};card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{};deathCheck=async()=>false;tickAll=async()=>true;FAST=1");return g}
const labels=g=>JSON.parse(g.run('JSON.stringify(choices().filter(visible).map(c=>c.l))'));
const log=g=>g.run("LOG.map(x=>x[0]).join('\\n')");
async function pick(g,l,ok=true){const i=g.run(`choices().findIndex(c=>c.l===${JSON.stringify(l)}&&visible(c))`);assert.ok(i>=0,'找不到選項：'+l+'（'+labels(g).join('、')+'）');
 await g.run(`(async()=>{const c=choices()[${i}];await applyRes(c,${ok}?c.ok:c.ng,G.players[0],${!ok})})()`)}

test('單向路線：每個地點的卡都存在、照順序接下去；最後一張是出口；搜索點的房間看完回到搜索點；沒有區域畫面',()=>{const g=setup();
 const bad=JSON.parse(g.run(`JSON.stringify((()=>{const bad=[];for(const [L,R] of Object.entries(ROUTE)){R.seq.forEach((id,i)=>{const nd=N[id];if(!nd||nd.L!==L)bad.push(id);else if(i<R.seq.length-1&&nd.next!==R.seq[i+1])bad.push(id+'.next');});
   const last=N[R.seq.at(-1)];if(!(last.c||[]).every(c=>c.go||(c.ok&&c.ok.go)))bad.push(L+' 出口有不移動的選項');
   for(const [s,rooms] of Object.entries(R.search||{})){if(!N[s].sr)bad.push(s);for(const r of rooms){if(N[r].next!==s)bad.push(r+'→'+N[r].next);if(!N[s].c.some(c=>(c.go||(c.ok&&c.ok.go))===r))bad.push(s+' 沒有去 '+r+' 的選項')}}}
  for(const h of ['Ah','Bh','Eh','Gh'])if(N[h])bad.push(h);return bad})())`));
 assert.deepEqual(bad,[]);
});

test('旅館走廊只能挑一件事：拿了消防斧就不能再進房間，也不寫已搜過／還沒進去',async()=>{const g=setup();
 g.run("G.flags.rd_r302=0");/* v0.59.0 路況：302 的門沒關好的局另有一個選項 */await g.run("enterNode('A4')");assert.equal(g.run('G.node'),'A4');
 assert.deepEqual(labels(g),['302：有光的那間','306：門縫裡有聲音的那間','304：門沒關的那間','打破消防栓箱拿斧頭','不再找了，往前走']);
 assert.equal(g.run("choices().filter(visible).map(c=>zNote(c)).join('')"),'');
 await pick(g,'打破消防栓箱拿斧頭');assert.notEqual(g.run('G.node'),'A4','做完一件就往前走');
 assert.match(log(g),/沒辦法每一間都翻/);assert.doesNotMatch(log(g),/已搜過|還沒進去|你回到三樓走廊/);
});

test('旅館走廊：進了房間，看完直接往前，不回走廊；也可以不找直接往前',async()=>{const g=setup();
 g.run("G.players.push({...G.players[0],pid:'p2',name:'乙',items:{},gear:[]},{...G.players[0],pid:'p3',name:'丙',items:{},gear:[]})");assert.equal(g.run('srMax()'),1,'人多也只能挑一件');
 await g.run("enterNode('E2')");await pick(g,'行李寄放間');assert.equal(g.run('G.node'),'E2x');await pick(g,'翻找代客泊車的櫃子');
 assert.notEqual(g.run('G.node'),'E2');assert.doesNotMatch(log(g),/你回到一樓走廊/);
 const g2=setup();await g2.run("enterNode('E2')");await pick(g2,'不再找了，往前走');assert.equal(g2.run('G.node'),'E3d','直接走到下一張卡');
});

test('分岔：已經走過的地點不會再出現在出口',async()=>{const g=setup();
 // v0.57.0 旅館四層（主人 2026-11-23 定案）：洗衣房併進一樓，改用消防梯的二樓平台測同一條規則
 g.run("G.node='D2';G.lv='D';G.route=['A','D']");assert.ok(labels(g).includes('從開著的窗戶進二樓'));
 g.run("G.route=['A','B','D']");assert.ok(!labels(g).includes('從開著的窗戶進二樓'),'走過二樓，不再出現進二樓的路');
});

test('條件卡：凱文死了才會在停車場坡道遇到他，否則直接跳過',async()=>{const g=setup();
 await g.run("enterNode('P1k')");assert.equal(g.run('G.node'),'P2');
 g.run('G.flags.kevin_dead=1');await g.run("enterNode('P1k')");assert.equal(g.run('G.node'),'P1k');
});

test('301 的窗戶：沒看逃生路線圖整條不出現；上鎖的車門變灰，點了說明缺什麼',async()=>{const g=setup();
 g.run("G.node='A6';G.lv='A'");assert.ok(!labels(g).includes('從 301 的窗戶爬到消防梯'));g.run('G.flags.map=1');assert.ok(labels(g).includes('從 301 的窗戶爬到消防梯'));
 g.run("G.node='P4';G.lv='G';globalThis.SFXL=[];globalThis.TOAST='';sfx=(k)=>{SFXL.push(k);return 0};toast=t=>TOAST=t;act=a=>handle('p1',a)");
 const i=g.run("choices().findIndex(c=>c.l==='開車衝出去')");assert.equal(g.run(`visible(choices()[${i}])`),true);assert.equal(g.run(`choiceOk(choices()[${i}])`),false);
 g.run(`zLockClick(${i})`);await new Promise(r=>setTimeout(r,20));assert.equal(g.run('SFXL.join()'),'doorlocked');assert.match(g.run('TOAST'),/B2-17 的銀色轎車.*沒有車鑰匙/);
 assert.match(g.run("codexMarkup('memo')"),/B2-17 的銀色轎車/);
});

test('舊存檔停在區域畫面：換回那一區的節點，走過的地點記成路線',()=>{const g=setup();
 g.run("globalThis.old={node:'Eh',lv:'E',zv:1,lvSeen:['A','B','E'],flags:{v_E2:1},players:G.players,clock:300};old=migrateG(old)");
 assert.equal(g.run('old.node'),'E2');assert.deepEqual(JSON.parse(g.run('JSON.stringify(old.route)')),['A','B','E']);
 g.run("globalThis.old2={node:'Z0',lv:'Z',zv:1,lvSeen:['A','Z'],flags:{},players:G.players};old2=migrateG(old2)");assert.equal(g.run('old2.node'),'Z0');
});

test('地圖照樣記錄去過的地點，不出現已搜過／還沒進去',async()=>{const g=setup();
 await g.run("enterNode('A1')");await g.run("enterNode('A4')");g.run('syncCodex()');const h=g.run('mapTree()');
 assert.match(h,/301 號房/);assert.match(h,/三樓走廊/);assert.doesNotMatch(h,/已搜過|還沒進去|未探索/);
});

test('警戒每個區域各自計算：離開時記下，回來 −2、每離開一小時再 −1',()=>{const g=setup();
 g.run("G.lv='V';G.alarm=0;G.clock=0;addAlarm(4,null)");assert.equal(g.run('G.alarm'),4);
 g.run("zSwap('V','W');G.lv='W'");assert.equal(g.run('G.alarm'),0,'新的區域從 0 開始');
 g.run("G.clock=90;zSwap('W','V');G.lv='V'");assert.equal(g.run('G.alarm'),1,'4 −2 −1（離開 90 分鐘）');
});
test('首次旅館的每一層樓算同一個區域：換樓層警戒不會清掉，離開旅館才會',()=>{const g=setup();
 g.run("G.lv='A';G.alarm=0;G.clock=0;addAlarm(4,null);zSwap('A','B');G.lv='B'");assert.equal(g.run('G.alarm'),4);
 g.run("addAlarm(1,null);zSwap('B','E');G.lv='E'");assert.equal(g.run('G.alarm'),5);
 g.run("zSwap('E','V');G.lv='V'");assert.equal(g.run('G.alarm'),0);
});
test('翻找有聲音：快速翻 +1、繼續仔細翻 +2，選項上不寫數字（v0.55.0 搜索逐步深入）',async()=>{
 const g=setup();const ids=JSON.parse(g.run("JSON.stringify(Object.keys(N).filter(k=>ROUTE[N[k].L]&&!N[k].sr&&searchChoices(N[k]).some(c=>c._searchMode)))"));assert.ok(ids.length);
 g.run(`G.node='${ids[0]}';G.lv=N['${ids[0]}'].L;G.alarm=0;G.zal={}`);const d=g.run('zDepth()')>=2?1:0;
 assert.ok(!g.run("choices().some(c=>c._searchMode==='careful'&&visible(c))"),'快速翻之前看不到繼續仔細翻');
 const q=JSON.parse(g.run(`JSON.stringify(choices().find(c=>c._searchMode==='quick'))`));assert.doesNotMatch(q.s||'',/警戒/);assert.ok(!q.k,'快速翻不檢定');
 await pick(g,q.l);assert.equal(g.run('G.alarm'),1+d,'quick');
 const c=JSON.parse(g.run(`JSON.stringify(choices().find(c=>c._searchMode==='careful'&&c._deepOf===${JSON.stringify(q._searchBase)}))`));assert.ok(c.k,'繼續仔細翻要檢定');assert.match(c.l,/^繼續仔細翻/);
 assert.ok(g.run(`choices().some(c=>c.l===${JSON.stringify(c.l)}&&visible(c))`),'快速翻完才出現繼續仔細翻');
 await pick(g,c.l);assert.equal(g.run('G.alarm'),1+d+2+d,'careful');
 assert.ok(!g.run("Object.values(N).some(n=>ROUTE[n.L]&&(n.c||[]).some(c=>/警戒/.test(c.s||'')))"),'旅館選項不寫警戒數字');
});
test('繼續仔細翻拿的是快速翻之外的東西：兩次加起來等於原本的全部',async()=>{const g=setup();
 /* v0.59.0 三樓（A）改成選擇卡、沒有繼續仔細翻（主人 2026-11-24），這裡改用還沒轉換的二樓 B 測 */g.run("N.T55S={L:'B',n:'測試',t:'測試',c:[{l:'翻測試櫃',t:'sd',ok:{t:'x',r:{items:{water:1,bandage:2}}}}]};G.node='T55S';G.lv='B';G.players[0].items={}");
 await pick(g,'翻測試櫃');assert.equal(g.run("Object.values(G.players[0].items).reduce((a,b)=>a+b,0)"),1);
 await pick(g,'繼續仔細翻測試櫃');assert.equal(g.run('G.players[0].items.water||0'),1);assert.equal(g.run('G.players[0].items.bandage||0'),2);
 assert.ok(!g.run("choices().some(c=>visible(c)&&/測試櫃/.test(c.l))"),'都翻完就消失');
});
test('深處（深度 2 以上）會出聲的動作警戒多 1；仔細搜查在區域裡算 1',()=>{const g=setup();
 g.run("G.lv='G';G.alarm=0;addAlarm(1,null)");assert.equal(g.run('G.alarm'),2);
 g.run("G.lv='A';G.alarm=0;addAlarm(1,null)");assert.equal(g.run('G.alarm'),1);
});

test('三個階段（v0.55.0）：3 只提示、6 小波一區域一次、10 強敵最後一波；打完清 0',async()=>{const g=setup();
 g.run("G.lv='A';G.alarm=2;addAlarm(1,null)");assert.match(log(g),/有動靜/);assert.equal(await g.run('alarmCheck(null,true)'),false,'3 不打');
 g.run('addAlarm(3,null)');assert.equal(await g.run('alarmCheck(null,true)'),true);
 let s=JSON.parse(g.run('JSON.stringify(FT_LOG.at(-1))'));assert.ok(s.types.length>=1&&s.types.length<=2);assert.ok(!s.types.includes('devourer'),'小波不放菁英');
 g.run('G.fight=null;G.phase="node";G.alarmFt=0;G.alarm=4');g.run('addAlarm(3,null)');assert.equal(await g.run('alarmCheck(null,true)'),false,'同一個區域小波只來一次');
 g.run('addAlarm(4,null)');assert.equal(g.run('G.alarm'),10);assert.equal(await g.run('alarmCheck(null,true)'),true);
 s=JSON.parse(g.run('JSON.stringify(FT_LOG.at(-1))'));assert.equal(s.types[0],'devourer','旅館是感染者陣營：菁英是巨噬者');assert.equal(g.run('G.alarmFt'),2);
 g.run('addAlarm(-3,null)');assert.equal(g.run('G.alarm'),10,'打最後一波時警戒鎖在 10');
 g.run("G.fight={foes:[]};G.after=null;deathCheck=async()=>false;enterNode=async()=>{}");await g.run('endFight()');
 assert.equal(g.run('G.alarm'),0,'打完清 0');g.run('addAlarm(5,null)');assert.equal(g.run('G.alarm'),5,'清 0 之後可以重新累積');
 assert.equal(await g.run('alarmCheck(null,true)'),false,'小波已經來過，這次越過 6 不再叫');
});
test('戰鬥中越過 6 不叫小波；戰鬥中滿 10：先預告一回合，下一輪加入戰局，鎖 10，打完清 0',async()=>{const g=setup();
 g.run("G.lv='A';G.zal={};G.alarm=5;encounter=async()=>{};fright=async()=>{};roundEnd=async()=>{};push=()=>{};draw=()=>{};G.fight={foes:[newFoe(0,'infected',1,false)],order:[{k:'p',id:G.players[0].pid,init:10},{k:'f',id:0,init:5}],turn:0,round:1,escaped:[]};nameFoes(G.fight.foes)");
 g.run('addAlarm(2,null)');assert.equal(g.run('ALV().w6'),1,'戰鬥中越過 6：小波算用掉了');
 g.run('addAlarm(4,null)');assert.equal(g.run('G.alarm'),10);assert.ok(g.run('!!G.fight.reinf'),'先預告');assert.equal(g.run('G.fight.foes.length'),1,'這一回合還沒加入');assert.match(log(g),/再撐一下|再過一下/);
 await g.run('nextTurn()');assert.equal(g.run('G.fight.foes.length'),1);await g.run('nextTurn()');
 assert.equal(g.run('G.fight.round'),2);assert.ok(g.run('G.fight.foes.length')>=2,'下一輪加入');assert.equal(g.run('G.alarmFt'),2);assert.ok(g.run('G.fight.musicIntense'),'配樂切激戰段');
 assert.equal(g.run("G.fight.order.filter(o=>o.k==='f').length"),g.run('G.fight.foes.length'),'新敵人排進先攻');
 assert.ok(g.run("new Set(G.fight.foes.map(f=>f.n)).size===G.fight.foes.length"),'名字不重複（羅馬數字）');
 g.run('addAlarm(3,null)');assert.equal(g.run('G.alarm'),10);
 await g.run('nextTurn();nextTurn();nextTurn();nextTurn()');assert.equal(g.run('G.fight.foes.length>=2&&G.fight.reinf.in'),1,'不會再亂入第二次');
 g.run("G.after=null;deathCheck=async()=>false;enterNode=async()=>{}");await g.run('endFight()');assert.equal(g.run('G.alarm'),0);
});
test('最後一波還在路上就逃走：警戒清 0',async()=>{const g=setup();
 g.run("G.lv='A';G.zal={};G.alarm=9;push=()=>{};draw=()=>{};G.fight={foes:[newFoe(0,'infected',1,false)],order:[],turn:0,round:1,escaped:[]};addAlarm(2,null);enterNode=async()=>{};G.after=null");
 assert.ok(g.run('!!G.fight.reinf'));await g.run('finishEvacuation(G.players[0],true)');assert.equal(g.run('G.alarm'),0);
});
test('安靜躲一陣子：一個區域一次、警戒 −3、30 分鐘，只放在內容指定的地方',async()=>{const g=setup();
 const at=JSON.parse(g.run("JSON.stringify(Object.entries(N).filter(([k,n])=>(n.c||[]).some(c=>c.quiet)).map(([k])=>k))"));assert.deepEqual(at.sort(),['A4h','E2s','M2','OE6','OF5','U2s'],'v0.56.0 醫院：急診的急救室、四樓的被服間；v0.57.0 旅館三樓的 309（門會自己鎖；v0.59.0 改成進 309 的小卡 A4h）');
 assert.ok(g.run("Object.values(N).every(n=>(n.c||[]).every(c=>!c.quiet||c.t==='qh'))"));
 g.run("G.node='E2s';G.lv='E';G.zal={};G.alarm=7;G.clock=600");const c0=g.run('G.clock');
 await g.run("(async()=>{const c=choices().find(c=>c.quiet);await spendTime(c);await applyRes(c,c.ok,G.players[0])})()");assert.equal(g.run('G.alarm'),4);assert.equal(g.run('G.clock')-c0,30);
 assert.ok(!g.run('choices().some(c=>c.quiet&&visible(c))'),'用過就不再出現');
 g.run("G.lv='A'");assert.ok(!g.run('ALV().qh===undefined?false:!ALV().qh'),'旅館各層是同一個區域');
});
test('每層規則可以改警戒倍率（LV fx.alarmMul／ROUTE am）',()=>{const g=setup();
 g.run("G.lv='A';G.zal={};G.alarm=0;LV.A.fx=Object.assign({},LV.A.fx,{alarmMul:2});addAlarm(1,null)");assert.equal(g.run('G.alarm'),2);
 g.run("LV.A.fx.alarmMul=1;ROUTE.A.am=3;G.alarm=0;addAlarm(1,null)");assert.equal(g.run('G.alarm'),3);g.run('delete ROUTE.A.am');
});
test('打槍的噪音接上區域警戒（深處多 1）',async()=>{const g=setup();
 g.run("G.uid=0;G.know={};G.phase='fight';G.lv='G';G.node='G4';G.alarm=0;globalThis.p=G.players[0];p.gear=[newGear('beretta',3)];equip(p,p.gear[0].u,'R');G.fight={foes:[{id:0,type:'infected',n:'測試',hp:999,max:999,bleed:0}],first:false};out=()=>{};dice=async()=>{};push=()=>{};r2=()=>({a:10,s:10})");
 await g.run("attack(p,'R',null,0)");assert.equal(g.run('G.alarm'),3,'貝瑞塔噪音 2，地下設備層最深處 +1');
});

test('被打的恐懼（主人選 A）：一般命中不加，重擊或一下打掉三成以上生命才加',()=>{const g=setup();
 g.run("globalThis.t=G.players[0];t.max=20;t.fe=0;Math.random=()=>0;const f={type:'infected',id:0};hitFx(f,{},t,3,false)");assert.equal(g.run('t.fe'),0);
 g.run("hitFx({type:'infected',id:0},{},t,3,true)");assert.ok(g.run('t.fe')>0,'重擊');
 g.run("t.fe=0;hitFx({type:'infected',id:0},{},t,6,false)");assert.ok(g.run('t.fe')>0,'三成以上');
});
test('出口去哪裡不寫在選項上：感知夠的人才察覺得到，可以告知隊友；搜尋選項沒有小字',()=>{const g=setup();
 g.run("G.node='A6';G.lv='A';G.players[0].st.PER=-5;makeHints()");assert.ok(!g.run("G.hint.p1"),'感知低看不到');
 g.run("G.players[0].st.PER=4;makeHints()");const i=g.run("choices().findIndex(c=>c.l==='東側樓梯')");assert.match(g.run(`G.hint.p1[${i}]`),/二樓/);
 g.run("G.phase='node'");assert.ok(g.run(`tell(G.players[0],${i})`));assert.ok(!g.run("Object.values(N).some(n=>ROUTE[n.L]&&(n.c||[]).some(c=>/→/.test(c.s||'')))"));
 assert.ok(!g.run("Object.values(N).some(n=>searchChoices(n).some(c=>c._searchMode&&c.s))"));
});

// v0.43.0 街道段（OUTSIDE_MAP_SPEC 第 3 節；抉擇是主人 2026-11-20 決定的）
test('街道段走單向路線：地點寫街區；整段共用一個警戒，和旅館分開',()=>{const g=setup();
 g.run("G.node='K1';G.lv='K'");assert.equal(g.run('zPlace()'),'街區・後巷');
 g.run("G.lv='A';G.alarm=0;G.clock=0;addAlarm(4,null);zSwap('A','K');G.lv='K'");assert.equal(g.run('G.alarm'),0,'出了旅館，街上從 0 開始');
 g.run("addAlarm(3,null);zSwap('K','Q');G.lv='Q';zSwap('Q','V');G.lv='V'");assert.equal(g.run('G.alarm'),3,'街道段換地點不清掉');
 g.run("G.node='K5';G.route=['J','K','U']");assert.deepEqual(labels(g),['往封鎖線走'],'走過的地鐵站不再出現');
});

test('公車司機：用繃帶救他，廣播前就知道北口，但還不能排隊；不救沒有差別、不扣善惡值',async()=>{const g=setup();
 await g.run("enterNode('J4b')");g.run("G.players[0].items={bandage:1}");await pick(g,'幫司機包紮');
 assert.equal(g.run('G.flags.busnews'),1);assert.ok(!g.run('G.players[0].items.bandage'),'繃帶用掉了');assert.equal(g.run('G.node'),'J5');
 g.run("G.node='Z0';G.lv='Z';G.ev=null");assert.equal(labels(g).filter(l=>l==='到北口檢查站').length,1);
 await pick(g,'到北口檢查站');assert.equal(g.run('G.node'),'Z3');assert.ok(!labels(g).includes('排隊等撤離車'),'廣播前不能排隊');assert.match(log(g),/時間還沒公布/);
 g.run("G.flags.evacinfo=1;G.node='Z0'");assert.equal(labels(g).filter(l=>l==='到北口檢查站').length,1,'廣播後只剩一個北口選項');
 g.run("G.node='Z3'");assert.ok(labels(g).includes('排隊等撤離車'));
 const g2=setup();await g2.run("enterNode('J4b')");const k0=g2.run('G.players[0].karma||0');await pick(g2,'不管他，繼續走');assert.equal(g2.run('G.node'),'J5');
 assert.ok(!g2.run('G.flags.busnews'));assert.equal(g2.run('G.players[0].karma||0'),k0,'不扣善惡值');
 g2.run("G.node='Z0';G.lv='Z'");assert.ok(!labels(g2).includes('到北口檢查站'));
});

test('傑西的倉庫：翻了紙箱再敲門，他們不開門，之後也找不到傑西',async()=>{const g=setup();
 await g.run("enterNode('M2')");await pick(g,'搜倉庫的紙箱');assert.equal(g.run('G.node'),'M2','翻完還在倉庫');
 assert.ok(!labels(g).includes('搜倉庫的紙箱'));await pick(g,'敲門');assert.equal(g.run('G.node'),'M3');assert.ok(!g.run('G.flags.v_M2t'));
 g.run("G.node='Z0';G.lv='Z'");assert.ok(!labels(g).includes('去便利商店找傑西'));
 const g2=setup();await g2.run("enterNode('M2')");await pick(g2,'敲門');assert.equal(g2.run('G.node'),'M2t','沒翻紙箱，敲門照舊進休息室');
});

test('地鐵站的腐殖核心：不燒掉過不去，可以退回地面改走封鎖線',async()=>{const g=setup();
 await g.run("enterNode('U4')");assert.deepEqual(labels(g),['燒掉腐殖核心','撿那些背包','退回地面，改走封鎖線']);
 assert.equal(g.run("choiceOk(choices().find(c=>c.l==='燒掉腐殖核心'))"),false,'沒有火就燒不了');
 await pick(g,'撿那些背包');assert.equal(g.run('G.node'),'U4');assert.deepEqual(labels(g),['燒掉腐殖核心','退回地面，改走封鎖線']);
 await pick(g,'退回地面，改走封鎖線');assert.equal(g.run('G.node'),'Q1');
 const g2=setup();await g2.run("enterNode('U4')");g2.run("G.players[0].items={molotov:1}");await pick(g2,'燒掉腐殖核心');
 assert.equal(g2.run('G.node'),'U5');assert.equal(g2.run('G.flags.burnednest'),1);
});

// v0.43.1 街道段（二）（OUTSIDE_MAP_SPEC 第 3.1、3.4 節）
test('街道段每段都有一個搜索點，只能挑一件，挑完往前走',async()=>{const g=setup();
 for(const L of ['J','K','M','Q','U','V']){const ss=JSON.parse(g.run(`JSON.stringify(Object.keys(ROUTE.${L}.search||{}))`));assert.equal(ss.length,1,L);assert.equal(g.run(`srMax('${ss[0]}')`),1,L)}
 await g.run("enterNode('J2s')");assert.ok(labels(g).includes('不再找了，往前走'));await pick(g,'翻報攤的抽屜');
 assert.equal(g.run('G.node'),'J2s','快速翻完還可以繼續仔細翻');assert.deepEqual(labels(g).sort(),['不再找了，往前走','繼續仔細翻報攤的抽屜'].sort(),'其他搜索點收掉');
 await pick(g,'繼續仔細翻報攤的抽屜');
 assert.notEqual(g.run('G.node'),'J2s','翻完往前');assert.equal(g.run('G.players[0].items.battery'),2);
});
test('街道段的隨機牌：每段有自己的牌；地鐵站抽不到戶外的牌，街區中段照樣抽得到',()=>{const g=setup();
 const ids=L=>JSON.parse(g.run(`JSON.stringify(evCands({L:'${L}'}).map(i=>EVPOOL[i].id))`));
 for(const L of ['J','K','M','Q','U','V'])assert.ok(EVn(g,L)>=2,L);
 assert.ok(ids('U').every(id=>/^su_/.test(id)),'地鐵站只有地鐵站的牌：'+ids('U'));
 for(const id of ['scooter','drone','pack','rain'])assert.ok(ids('Z').includes(id),'街區中段還有 '+id);
 assert.ok(!ids('J').some(id=>/^s[kmquv]_/.test(id)),'別段的牌不會跑到前街');
});
function EVn(g,L){return g.run(`EVPOOL.filter(e=>e.ch===2&&e.at&&e.at.length===1&&e.at[0]==='${L}').length`)}

// v0.43.2 主人：背包放不下、東西掉在地上，選項結果又直接往前走，東西就不見了
test('地上還有東西要離開時先停下來：按了「繼續往前」才走；地上沒東西照常直接走',async()=>{const g=setup();
 await g.run("enterNode('J2')");g.run("G.ground.push({k:'bandage',q:2})");
 await pick(g,'不要靠近');
 assert.equal(g.run('G.node'),'J2','還沒走');assert.equal(g.run('G.phase'),'gw');
 await g.run("groundGo(G.players[0])");
 assert.equal(g.run('G.node'),'J2s','按了繼續才往前');
 await g.run("enterNode('J3')");await pick(g,labels(g)[0]);
 assert.notEqual(g.run('G.phase'),'gw','地上沒東西不會停');
});
test('連線：每個人都按了「繼續往前」才走',async()=>{const g=setup();
 g.run("G.players.push({...JSON.parse(JSON.stringify(G.players[0])),pid:'p2',name:'乙'});ROLE='host';push=()=>{}");
 await g.run("enterNode('J2')");g.run("G.ground.push({k:'bandage',q:1})");
 assert.equal(await g.run("groundWait('J2s')"),true);
 await g.run("groundGo(P('p1'))");assert.equal(g.run('G.node'),'J2','只有一個人按');
 await g.run("groundGo(P('p2'))");assert.equal(g.run('G.node'),'J2s');
});
// v0.43.3 主人：搜索點翻完、被「時間不多了」直接帶往下一段時，地上的東西也要先停下來
test('搜索點次數用完要被跳過時，地上還有東西也先停下來',async()=>{const g=setup();
 await g.run("enterNode('Q2s')");g.run("G.ground.push({k:'gunoil',q:1});srSt('Q2s').n=srMax('Q2s')");
 assert.equal(await g.run("enterNode('Q2s')"),undefined);
 assert.equal(g.run('G.phase'),'gw');assert.equal(g.run('G.node'),'Q2s','還沒走');
 await g.run("groundGo(G.players[0])");assert.notEqual(g.run('G.node'),'Q2s','按了繼續才往前');
});
// v0.43.3 主人：檢定失敗不能一直重骰。不是必經的失敗一次就消失；必經的不再檢定
test('電廠堵門失敗一次就消失；必經的關卡不再檢定',async()=>{const g=setup();
 await g.run("enterNode('PP4')");await pick(g,'先把廠房大門堵起來',false);
 assert.ok(!labels(g).includes('先把廠房大門堵起來'),'失敗後不能再骰');
 const gates=JSON.parse(g.run(`JSON.stringify([['W1','換上保險絲，重新送電'],['W1','不用保險絲，直接拉旁路'],['PP2','照著程序書送廠用電'],['PP3','換上保險絲，接通輸油泵'],['PP3','用手搖泵一桶一桶打'],['WP2','把攔汙柵前面的東西拖開'],['WP4','照程序啟動送水泵'],['BA5','逼飛行員起飛']].map(([n,l])=>{const c=N[n].c.find(c=>c.l===l);return [l,!!c&&!c.k&&!c.ng]}))`));
 for(const [l,ok] of gates)assert.ok(ok,l+' 不該有檢定');
 assert.equal(g.run("N.W1.c.find(c=>c.l==='不用保險絲，直接拉旁路').req"),'pliers');
 assert.ok(!g.run("N.PP2.c.some(c=>c.l==='憑感覺試著送廠用電')"));
});
