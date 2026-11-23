// v0.58.0 種子與自動存檔（主人 2026-11-24，專案 PLAN_CHOICE_CARDS 第三節）
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');
function setup(){const g=game();g.run("globalThis.__LS={};LS.get=(k,d)=>k in __LS?JSON.parse(__LS[k]):d;LS.set=(k,v)=>{__LS[k]=JSON.stringify(v)};LS.del=k=>{delete __LS[k]};newRun([{kind:'custom',pid:'p1',name:'甲',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},load:{}}],{diff:'normal'},'solo');G.ev=null;LOG=[];FAST=1;card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};groundWait=async()=>false;qte=async()=>true;dice=async()=>{};globalThis.ROLLS=[];const r0=r2;r2=()=>{const r=r0();ROLLS.push(r.a);return r};applyRes=async()=>{};passTime=async()=>false;G.node='A6e';G.lv='A'");return g}
// 停在東側樓梯（有敏捷檢定的選項），按「屏住呼吸溜過去」，回傳這次擲出的骰
async function roll(g,i){g.run("G.node='A6e';G.lv='A';ROLLS.length=0");await g.run(`doChoice(${i},G.players[0])`);return g.run('ROLLS[0]')}
const SNEAK="choices().findIndex(c=>c.l==='屏住呼吸溜過去')";

test('開局有種子；同一張卡、同一個選項擲出一樣的骰，下一張卡就不一樣',async()=>{const g=setup();
 assert.equal(typeof g.run('G.sd'),'number');assert.equal(g.run('G.stp'),0);const i=g.run(SNEAK);
 const a=await roll(g,i),b=await roll(g,i);assert.equal(a,b,'同一張卡同一個選項');
 // 換 50 張卡（G.stp 往上加），骰子不會一直一樣
 const xs=new Set();for(let k=1;k<=50;k++){g.run(`G.stp=${k}`);xs.add(await roll(g,i))}assert.ok(xs.size>5,'不同的卡結果會變');
});
test('停在卡上先做別的事（吃東西、翻背包也會用到亂數），再按同一個選項，結果不變',async()=>{const g=setup();const i=g.run(SNEAK);
 g.run('G.stp=7');const a=await roll(g,i);g.run("reseed(G.stp,'idle');for(let k=0;k<20;k++)RNG()");const b=await roll(g,i);assert.equal(a,b);
});
test('自動存檔：停在卡上等選的時候存一格，存的時候換到下一張卡；讀檔回來同一個選項同一個結果',async()=>{const g=setup();const i=g.run(SNEAK);
 g.run("G.node='A6e';G.lv='A'");g.run('autoSave()');assert.equal(g.run('G.stp'),1);assert.ok(g.run("!!__LS['zc7-save']"),'寫進 zc7-save');
 const a=await roll(g,i);
 // 讀檔：照 resumeSolo 的做法把存檔讀回來
 g.run("G=migrateG(JSON.parse(__LS['zc7-save']).G)");const b=await roll(g,i);assert.equal(a,b,'讀檔後同一個選項');
});
test('全員死亡、結局跑完都刪掉存檔；多人由房主存在 zc7-mpsave',async()=>{const g=setup();
 g.run("autoSave()");assert.ok(g.run("!!__LS['zc7-save']"));await g.run("(async()=>{flush=async()=>{};stopBgm=()=>{};sndW=async()=>{};await gameOver()})()");assert.equal(g.run("'zc7-save' in __LS"),false,'全滅刪檔');
 const h=setup();h.run("autoSave()");h.run("G.over={dead:0};dropSave()");assert.equal(h.run("'zc7-save' in __LS"),false,'結局刪檔');
 assert.match(h.run("String(ending)"),/dropSave\(\)/);assert.match(h.run("String(fireEnding)"),/dropSave\(\)/);
 const m=setup();m.run("ROLE='host';G.over=null;autoSave()");assert.ok(m.run("!!__LS['zc7-mpsave']"));m.run("ROLE='client';delete __LS['zc7-mpsave'];autoSave()");assert.equal(m.run("'zc7-mpsave' in __LS"),false,'隊友不存');
});
test('舊存檔沒有種子：讀進來新給一個',()=>{const g=setup();const old=JSON.parse(g.run('JSON.stringify(G)'));delete old.sd;delete old.stp;
 g.run(`globalThis.__o=${JSON.stringify(JSON.stringify(old))}`);const s=JSON.parse(g.run("JSON.stringify(migrateG(JSON.parse(__o)))"));assert.equal(typeof s.sd,'number');assert.equal(s.stp,0);
});
test('沒有手動存檔按鈕；畫面、骰子動畫、QTE 格子不吃種子',()=>{const g=setup();const src=require('node:fs').readFileSync(require('node:path').join(__dirname,'../index.html'),'utf8');
 assert.ok(!/data-save/.test(src),'存檔按鈕拿掉了');
 // 骰子動畫亂跳的數字、QTE 格子位置用 urnd／upick：不會讓遊戲裡的亂數往前走
 g.run("reseed(3,'x')");const a=g.run('RNG()');g.run("reseed(3,'x');urnd(1,20);upick([1,2,3])");assert.equal(g.run('RNG()'),a);
 assert.ok(src.includes('let z=upick(pool)'),'QTE 格子位置不吃種子');
});
test('測試把 Math.random 換掉時照用測試的（舊測試靠這個控制骰子）',()=>{const g=setup();g.run("reseed(1,'y');globalThis.__mr=Math.random;Math.random=()=>0.999");assert.equal(g.run('rnd(1,20)'),20);g.run('Math.random=__mr');});
