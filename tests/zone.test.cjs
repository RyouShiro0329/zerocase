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

test('搜索點：選過的整個消失、不寫已搜過／還沒進去；次數＝max(2,人數)，用完自動往前',async()=>{const g=setup();
 await g.run("enterNode('A4')");assert.equal(g.run('G.node'),'A4');
 assert.deepEqual(labels(g),['302：有光的那間','306：門縫裡有聲音的那間','304：門沒關的那間','打破消防栓箱拿斧頭','不再找了，往前走']);
 await pick(g,'304：門沒關的那間');assert.equal(g.run('G.node'),'A4','就地搜尋做完留在原地');assert.ok(!labels(g).includes('304：門沒關的那間'));
 assert.equal(g.run("choices().filter(visible).map(c=>zNote(c)).join('')"),'');
 await pick(g,'306：門縫裡有聲音的那間');assert.equal(g.run('G.after'),'A4c','先打一場，打完進 306');
 g.run("G.fight=null;G.phase='node'");await g.run("enterNode('A4c')");await pick(g,'收拾推車上的東西就走');
 assert.notEqual(g.run('G.node'),'A4','兩次用完，不回走廊，直接往前');assert.match(log(g),/沒辦法每一間都翻/);assert.doesNotMatch(log(g),/已搜過|還沒進去|你回到三樓走廊/);
});

test('搜索點：房間看完、次數還有就回到搜索點；也可以不找直接往前',async()=>{const g=setup();
 g.run("G.players.push({...G.players[0],pid:'p2',name:'乙',items:{},gear:[]},{...G.players[0],pid:'p3',name:'丙',items:{},gear:[]})");assert.equal(g.run('srMax()'),3,'三個人可以翻三次');
 await g.run("enterNode('E2')");await pick(g,'行李寄放間');assert.equal(g.run('G.node'),'E2x');await pick(g,'翻找代客泊車的櫃子');
 assert.equal(g.run('G.node'),'E2');assert.match(log(g),/你回到一樓走廊/);assert.ok(!labels(g).includes('行李寄放間'));
 await pick(g,'不再找了，往前走');assert.equal(g.run('G.node'),'E3d','直接走到下一張卡');
});

test('分岔：已經走過的地點不會再出現在出口',async()=>{const g=setup();
 g.run("G.node='H4';G.lv='H';G.route=['A','B','H']");assert.deepEqual(labels(g),['往大廳','往停車場']);
 g.run("G.route=['A','B','E','H']");assert.deepEqual(labels(g),['往停車場'],'從一樓來的，不再回一樓');
});

test('條件卡：凱文死了才會在停車場坡道遇到他，否則直接跳過',async()=>{const g=setup();
 await g.run("enterNode('P1k')");assert.equal(g.run('G.node'),'P2');
 g.run('G.flags.kevin_dead=1');await g.run("enterNode('P1k')");assert.equal(g.run('G.node'),'P1k');
});

test('301 的窗戶：沒看逃生路線圖整條不出現；上鎖的車門變灰，點了說明缺什麼',async()=>{const g=setup();
 g.run("G.node='A6';G.lv='A'");assert.ok(!labels(g).includes('從 301 的窗戶爬到消防梯'));g.run('G.flags.map=1');assert.ok(labels(g).includes('從 301 的窗戶爬到消防梯'));
 g.run("G.node='P4';G.lv='P';globalThis.SFXL=[];globalThis.TOAST='';sfx=(k)=>{SFXL.push(k);return 0};toast=t=>TOAST=t;act=a=>handle('p1',a)");
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
 g.run("G.uid=0;G.know={};G.phase='fight';G.lv='G';G.node='G4';G.alarm=0;globalThis.p=G.players[0];p.gear=[newGear('beretta',3)];equip(p,p.gear[0].u,'R');G.fight={foes:[{id:0,type:'infected',n:'測試',hp:999,max:999,bleed:0}],first:false};out=()=>{};dice=async()=>{};push=()=>{};r2=()=>({a:10,s:10})");
 await g.run("attack(p,'R',null,0)");assert.equal(g.run('G.alarm'),3,'貝瑞塔噪音 2，地下設備層最深處 +1');
});

test('被打的恐懼（主人選 A）：一般命中不加，重擊或一下打掉三成以上生命才加',()=>{const g=setup();
 g.run("globalThis.t=G.players[0];t.max=20;t.fe=0;Math.random=()=>0;const f={type:'infected',id:0};hitFx(f,{},t,3,false)");assert.equal(g.run('t.fe'),0);
 g.run("hitFx({type:'infected',id:0},{},t,3,true)");assert.ok(g.run('t.fe')>0,'重擊');
 g.run("t.fe=0;hitFx({type:'infected',id:0},{},t,6,false)");assert.ok(g.run('t.fe')>0,'三成以上');
});
