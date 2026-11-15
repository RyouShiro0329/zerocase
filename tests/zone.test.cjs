// v0.24.0 地圖重構第一步（Claude 2026-11-16）：區域＋點位、上鎖保留、每區域三階段警戒、舊存檔放回入口。
// 規則來源：Claude 專案文件 zerocase/PROPOSAL_MAP.md（主人 2026-11-16 同意）。
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(){const g=game();g.run("newRun([{kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'normal'},'solo');G.node='A1';G.lv='A';G.ev=null;LOG=[];globalThis.FT_LOG=[];startFight=async s=>{FT_LOG.push(s);G.fight={foes:[]};G.phase='fight'};card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{}");return g}
const labels=g=>JSON.parse(g.run('JSON.stringify(choices().filter(visible).map(c=>c.l))'));
const log=g=>g.run("LOG.map(x=>x[0]).join('\\n')");

test('旅館每個區域都有區域畫面；原本的清單、出口節點一律換成區域畫面',()=>{const g=setup();
 for(const [z,h] of Object.entries(JSON.parse(g.run('JSON.stringify(Object.fromEntries(Object.entries(ZONES).map(([z,Z])=>[z,Z.hub])))')))){assert.equal(g.run(`N['${h}'].L`),z);assert.equal(g.run(`ZN['${h}'].role`),'hub')}
 for(const j of ['A4','A6','B2','B4','E2','E4','F4','G4','H4','I2','P4','R4','C4','D4'])assert.equal(g.run(`zRoute('${j}')`),g.run(`ZONES[N['${j}'].L].hub`),j);
 assert.equal(g.run("zRoute('A1')"),'A1','區域還沒走過：照原本的劇情');
 g.run("G.zd={B:1}");assert.equal(g.run("zRoute('B1')"),'Bh','走過的區域再進來，不重播開場的劇情');assert.equal(g.run("zRoute('A6e')"),'A6e','往別的區域的樓梯照走');
});

test('三樓的區域畫面：房間、就地搜尋、出口都列出來；上鎖的窗戶留著變灰',async()=>{const g=setup();
 await g.run("enterNode('A4')");assert.equal(g.run('G.node'),'Ah');assert.equal(g.run('G.zd.A'),1);
 const ls=labels(g);for(const l of ['301 號房','製冰機間','302：有光的那間','306：門縫裡有聲音的那間','304：門沒關的那間','打破消防栓箱拿斧頭','東側樓梯','從 301 的窗戶爬到消防梯'])assert.ok(ls.includes(l),l);
 const i=g.run("choices().findIndex(c=>c.l==='從 301 的窗戶爬到消防梯')");
 assert.equal(g.run(`choiceOk(choices()[${i}])`),false);assert.match(g.run(`zWhy(choices()[${i}])`),/逃生路線圖/);
 g.run('G.flags.map=1');assert.equal(g.run(`choiceOk(choices()[${i}])`),true);
 assert.doesNotMatch(labels(g).join(),/東側樓梯上三樓/,'還沒去過的區域不顯示回程');
});

test('點了上鎖的點位：播鎖門聲、跳出缺什麼、記進備忘錄',async()=>{const g=setup();await g.run("enterNode('A4')");
 g.run("globalThis.SFXL=[];globalThis.TOAST='';sfx=(k)=>{SFXL.push(k);return 0};toast=t=>TOAST=t;act=a=>handle('p1',a)");
 const i=g.run("choices().findIndex(c=>c.l==='從 301 的窗戶爬到消防梯')");g.run(`zLockClick(${i})`);await new Promise(r=>setTimeout(r,20));
 assert.equal(g.run('SFXL.join()'),'doorlocked');assert.match(g.run('TOAST'),/301 號房的窗戶.*逃生路線圖/);
 assert.match(g.run("codexMarkup('memo')"),/301 號房的窗戶/);
});

test('房間回去時：選過的標成已搜過、不消失；劇情專用的選項收起來；有回到走廊的選項',async()=>{const g=setup();
 g.run("G.zd={A:1};G.flags.v_A1=1;G.node='A1';G.used={'A1|2':1}");
 const ls=labels(g);assert.ok(ls.includes('回到三樓走廊'));assert.ok(!ls.includes('貼著門聽外面'));
 const c="choices().find(c=>c.l==='看門背後的逃生路線圖')";assert.equal(g.run(`visible(${c})`),true);assert.equal(g.run(`choiceOk(${c})`),false);assert.equal(g.run(`zNote(${c})`),'做過了','調查類的叫做過了，搜尋類的叫已搜過');
 assert.match(g.run(`zWhy(${c})`),/已經做過了/);
 await g.run("enterNode('A1')");assert.match(log(g),/你回到 301 號房/);assert.doesNotMatch(log(g),/槍聲。/,'回來不重播醒來的那段');
});

test('第一次照劇情走過的房間，選過的那個之後也算搜過（不會重複拿東西）',async()=>{const g=setup();
 g.run("G.node='A1';deathCheck=async()=>false;passTime=async()=>false");const i=g.run("choices().findIndex(c=>c.l==='看門背後的逃生路線圖')");
 g.run('enterNode=async id=>{globalThis.WENT=id}');await g.run(`applyRes(choices()[${i}],choices()[${i}].ok,G.players[0],false)`);
 assert.equal(g.run('WENT'),'A2','區域還沒走過：照原本的劇情往下');assert.equal(g.run(`G.used['A1|${i}']`),1);
});

test('警戒每個區域各自計算：離開時記下，回來 −2、每離開一小時再 −1',()=>{const g=setup();
 g.run("G.lv='A';G.alarm=0;G.clock=0;addAlarm(4,null)");assert.equal(g.run('G.alarm'),4);
 g.run("zSwap('A','B');G.lv='B'");assert.equal(g.run('G.alarm'),0,'新的區域從 0 開始');
 g.run("G.clock=90;zSwap('B','A');G.lv='A'");assert.equal(g.run('G.alarm'),1,'4 −2 −1（離開 90 分鐘）');
});

test('深處（深度 2 以上）會出聲的動作警戒多 1；仔細搜查在區域裡算 1',()=>{const g=setup();
 g.run("G.lv='G';G.alarm=0;addAlarm(1,null)");assert.equal(g.run('G.alarm'),2);
 g.run("G.lv='A';G.alarm=0;addAlarm(1,null)");assert.equal(g.run('G.alarm'),1);
});

test('三個階段：3 只提示、6 來一小波、10 一波強敵；強敵打完回到 3、這次停留不再累積',async()=>{const g=setup();
 g.run("G.lv='A';G.alarm=2;addAlarm(1,null)");assert.match(log(g),/有動靜/);assert.equal(await g.run('alarmCheck(null,true)'),false,'3 不打');
 g.run('addAlarm(3,null)');assert.equal(await g.run('alarmCheck(null,true)'),true);
 let s=JSON.parse(g.run('JSON.stringify(FT_LOG.at(-1))'));assert.ok(s.types.length>=1&&s.types.length<=2);assert.ok(!s.types.includes('devourer'),'小波不放菁英');
 g.run('G.fight=null;G.phase="node"');assert.equal(await g.run('alarmCheck(null,true)'),false,'同一次升到 6 只來一波');
 g.run('addAlarm(4,null)');assert.equal(g.run('G.alarm'),10);assert.equal(await g.run('alarmCheck(null,true)'),true);
 s=JSON.parse(g.run('JSON.stringify(FT_LOG.at(-1))'));assert.equal(s.types[0],'devourer','旅館是感染者陣營：菁英是巨噬者');assert.equal(g.run('G.alarmFt'),2);
 g.run("G.fight={foes:[]};G.after=null;deathCheck=async()=>false;enterNode=async()=>{}");await g.run('endFight()');
 assert.equal(g.run('G.alarm'),3);g.run('addAlarm(5,null)');assert.equal(g.run('G.alarm'),3,'已驚動：不再累積');assert.match(log(g),/剛被驚動過/);
 g.run("G.clock=(G.clock||0)+10;zSwap('A','B');G.lv='B';G.clock+=130;zSwap('B','A');G.lv='A';addAlarm(2,null)");assert.ok(g.run('G.alarm')>=2,'離開兩小時以上又會累積');
});

test('打槍的噪音接上區域警戒（深處多 1）',async()=>{const g=setup();
 g.run("G.uid=0;G.know={};G.phase='fight';G.lv='G';G.node='Gh';G.alarm=0;globalThis.p=G.players[0];p.gear=[newGear('beretta',3)];equip(p,p.gear[0].u,'R');G.fight={foes:[{id:0,type:'infected',n:'測試',hp:999,max:999,bleed:0}],first:false};out=()=>{};dice=async()=>{};push=()=>{};r2=()=>({a:10,s:10})");
 await g.run("attack(p,'R',null,0)");assert.equal(g.run('G.alarm'),3,'貝瑞塔噪音 2，地下設備層最深處 +1');
});

test('舊存檔在旅館裡：讀檔時放回三樓走廊，走過的區域直接算走過',()=>{const g=setup();
 g.run("globalThis.old={node:'B2x',lv:'B',alarm:5,flags:{v_A4:1,v_B2:1},players:G.players,clock:300};old=migrateG(old)");
 assert.equal(g.run('old.zmove'),'Ah');assert.equal(g.run('old.zd.A'),1);assert.equal(g.run('old.zd.B'),1);assert.equal(g.run('old.zal.B.v'),5);
 g.run("globalThis.old2={node:'Z0',lv:'Z',flags:{},players:G.players};old2=migrateG(old2)");assert.equal(g.run('old2.zmove'),undefined,'不在新格式的地點就不動');
});

test('區域畫面裡做過一件事之後，回到區域畫面才發生那一層的隨機事件（一次）',()=>{const g=setup();
 g.run("G.zd={A:1};G.zc={}");assert.equal(g.run("zRoute('Ah')"),'Ah');g.run('G.zc.A=1');assert.equal(g.run("zRoute('Ah')"),'A5');g.run('G.flags.v_A5=1');assert.equal(g.run("zRoute('Ah')"),'Ah');
});

test('清單地圖：第一層目前區域的點位、第二層旅館的區域，沒去過的區域不顯示名稱',async()=>{const g=setup();
 await g.run("enterNode('A4')");g.run('syncCodex()');const h=g.run('mapTree()');
 assert.match(h,/你在這裡：旅館・三樓（內部）/);assert.match(h,/製冰機間/);assert.match(h,/301 號房的窗戶|從 301 的窗戶爬到消防梯/);assert.match(h,/上鎖/);
 assert.doesNotMatch(h,/data-ch|data-lock|onclick/);assert.doesNotMatch(h,/洗衣房|地下設備層|地下停車場/,'沒去過的地方不揭露');
});

test('每個區域畫面：每個點位都有去處；每個房間回去時都有回到區域畫面的選項',async()=>{const g=setup();
 const bad=JSON.parse(g.run(`(()=>{const bad=[];for(const [z,Z] of Object.entries(ZONES)){G.zd={};G.zd[z]=1;G.node=Z.hub;G.lv=z;G.flags={};
   for(const c of choices()){const d=c.go||(c.ok&&c.ok.go);if(c.zp.k==='search'){if(d)bad.push(z+':'+c.l+' 搜尋不該移動');continue}if(!d||(!N[d]&&!END[d]))bad.push(z+':'+c.l+'→'+d)}
   for(const r of Z.rooms||[]){G.node=r;const cs=choices();if(!cs.some(c=>c.zback&&c.go===Z.hub))bad.push(r+' 沒有回去的選項');if(!cs.some(c=>visible(c)&&!c.zback))bad.push(r+' 房間裡沒有東西可做')}}
  return JSON.stringify(bad)})()`));
 assert.deepEqual(bad,[]);
});
