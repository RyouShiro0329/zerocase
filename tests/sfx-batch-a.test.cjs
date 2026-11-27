// v0.71.2 批次 A：用既有音效補探索／狀態接線（不同步加入新戰鬥音檔）
const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('./helpers/audio-game.cjs');

const ST='{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2}';
function setup(extra=''){
  const g=game();
  g.run(`newRun([{kind:'custom',pid:'p1',name:'甲',st:${ST},load:{}}],{diff:'normal'},'solo');globalThis.p=G.players[0];LOG=[];FAST=1;card=async()=>{};chapterCard=async()=>{};hazard=async()=>false;startCd=()=>{};reportEffects=()=>{};reportGround=()=>{};tickAll=async()=>true;groundWait=async()=>false;woundDeteriorate=async()=>{};${extra}`);
  return g;
}
const ev=g=>g.events.filter(e=>e.t==='s').map(e=>e.d);
const keys=g=>ev(g).map(d=>d[0]);

test('選項動作音：門／撬／敲／爬關鍵字與假陽性',()=>{
  const g=setup();
  const ok={
    woodknock:['敲門','輕輕敲門','敲 305 的門','敲一下門試試','敲車窗','敲那戶人家的窗','敲牆回應','敲窗，叫他一起走','敲藥局的鐵捲門，把它們引過去','撬開員工側門','把門撬開','用工具撬開鐵門','用撬棍慢慢把鐵捲門撐起來','撬開販賣機','把鐵捲門撬起來'],
    doorclose:['把門關上','關上門，在裡面躲一陣子','關上推門，在裡面等一陣子','鎖上門，在下舖睡到天亮','把凱文的房門鎖上，躺一下','用身體抵住門','把書桌拖過去頂住門','把門拉上','把門輕輕帶上，繼續走','扣上門閂，安靜躲一陣子'],
    dooropen:['開門出去','推開大門','推開維修門','打開廁所的門','把鐵捲門打開','拆開拖把柄，把門打開','拉開鐵捲門','撞開邊門','進 203：門上有彈孔的那間','員工專用門','後門，從後巷離開','從後門的倉庫進去','從車道連通門到停車場','跳下去，進廚房後門','從撬開的鐵門進去','徒手扳開電梯門','用破拆工具撐開軍械庫的門','把鐵捲門拉高','用赫克特的鑰匙開邊門','推推看那扇門','雙開門，去大廳','從地下停車場的鐵捲門進去'],
    step:['往上爬到頂樓','從破掉的窗戶爬進去','爬上月台邊的長椅','從 301 的窗戶爬到消防梯','抓著旁邊的排水管爬過去'],
    drawer:['翻迷你吧和抽屜','翻被撬開的置物櫃','翻門邊的回收紙箱','用隊長的門禁卡打開保險櫃','搜倉庫的紙箱','找閥門把它關掉']
  };
  for(const [want,labs] of Object.entries(ok)){
    for(const l of labs)assert.equal(g.run(`optionFoley(${JSON.stringify(l)})`),want,l);
  }
  const none=['看門背後的逃生路線圖','貼著門聽外面','快速離開旅館門口','搬走門口的物資','躲進公寓門廊','不開門','叫他們把門鎖好，不要出來','叫他們開門，帶他們一起走','B-118：有人在敲窗戶的那間','304：門沒關的那間','從開著的門走進去','說服她跟你走'];
  for(const l of none)assert.equal(g.run(`optionFoley(${JSON.stringify(l)})`),null,l);
  assert.equal(g.run("optionFoley('先不管那個箱子','rummage')"),'drawer');
  assert.equal(g.run("optionFoley('說服她跟你走','rummage')"),'rummage');
});

test('doPlain 依規則播門／翻找，doCheck 在擲骰之後播、說服不另播',async()=>{
  const g=setup();
  g.run("N.__sfxA={L:'A',n:'測',t:'',c:[]};G.node='__sfxA';G.lv='A';G.ev=null;G.xp=null;spendTime=async()=>false;applyRes=async()=>{};dozeCheck=async()=>{};globalThis.CHK=0;check=async()=>{CHK++;return {ok:true,crit:false,fumble:false}}");
  const play=async(fn,l)=>{g.events.length=0;g.run(`N.__sfxA.c=[{l:${JSON.stringify(l)},k:'STR',d:10,ok:{},ng:{}}];SEARCH_CACHE.delete(N.__sfxA.c)`);await g.run(`${fn}(0,G.players[0])`);return ev(g)};
  let e=await play('doPlain','開門出去');assert.equal(e[0][0],'dooropen');assert.equal(e[0][1],.6);
  e=await play('doPlain','把門關上');assert.equal(e[0][0],'doorclose');
  e=await play('doPlain','翻抽屜裡的文件');assert.equal(e[0][0],'drawer');
  e=await play('doPlain','看看四周');assert.equal(e[0][0],'rummage');
  g.run('CHK=0');e=await play('doCheck','輕輕敲門');
  assert.equal(g.run('CHK'),1);assert.deepEqual(e.map(x=>x[0]),['woodknock']);assert.equal(e[0][1],.6);
  e=await play('doCheck','往上爬到頂樓');assert.deepEqual(e.map(x=>x[0]),['step']);assert.equal(e[0][1],.55);
  e=await play('doCheck','說服她跟你走');assert.deepEqual(e,[]);
});

test('woodknock 播放跳過約 0.85 秒開頭靜音；緩衝太短則不跳',()=>{
  const g=setup();
  g.run("BUF.woodknock={duration:2.3}");
  g.sources.length=0;g.run("sfx('woodknock',1)");
  const src=g.sources.at(-1);
  assert.equal(src.offset,.85);
  g.run("BUF.woodknock={duration:.2}");
  g.sources.length=0;g.run("sfx('woodknock',1)");
  assert.equal(g.sources.at(-1).offset,0);
});

test('同層換節點播一次 step；換層只走既有 stairs／step，不重疊',async()=>{
  const g=setup();
  g.run("G.node='A3c';G.lv='A';G.lvSeen=['A'];G.ch=1;G.ev=null;G.flags['v_A3c']=1;evCands=()=>[]");
  g.events.length=0;
  await g.run("enterNode('A4')");
  assert.equal(g.run('G.node'),'A4');
  assert.equal(g.run('G.lv'),'A');
  const steps=ev(g).filter(d=>d[0]==='step'||d[0]==='stairs');
  assert.equal(steps.length,1);assert.equal(steps[0][0],'step');assert.equal(Number(steps[0][1]),.55);
  g.run("G.node='AT3';G.lv='A';G.flags['v_AT3']=1");
  g.events.length=0;
  await g.run("enterNode('B2')");
  const move=ev(g).filter(d=>d[0]==='step'||d[0]==='stairs');
  assert.equal(move.length,1,'換層只播一次移動聲');
  assert.equal(move[0][0],g.run("movementSound('A','B')"));
});

test('隨機意外：發生／躲開用既有檔；貨車發生保持安靜、躲開仍是玻璃',()=>{
  const g=setup();
  const rows=JSON.parse(g.run("JSON.stringify([...HAZ[1],...HAZ[2]].map(h=>[h.id,h.audio||null,h.okA||null]))"));
  assert.deepEqual(rows,[
    ['tube','glassbreak','whoosh'],
    ['cart','thud','whoosh'],
    ['floor','woodimpact','whoosh'],
    ['vent','woodimpact','whoosh'],
    ['window','farshotsglass','whoosh'],
    ['sign','thud','whoosh'],
    ['truck',null,'glassbreak'],
    ['ac','woodimpact','whoosh'],
    ['pipe','thud','whoosh'],
    ['crow','whoosh','whoosh']
  ]);
});

test('隊友倒下播 thud 不播 death；單人死亡仍交給 gameOver',async()=>{
  const g=setup();
  g.run("G.mode='mp';G.players=[{pid:'p1',name:'甲',hp:0,max:100,down:0,dead:0,inf:0,fe:0},{pid:'p2',name:'乙',hp:20,max:100,down:0,dead:0,inf:0,fe:0}];G.over=null;loseSan=()=>{};gameOver=async()=>{throw new Error('不該結束')}");
  g.events.length=0;
  await g.run('deathCheck()');
  assert.equal(g.run('G.players[0].down'),1);
  assert.equal(g.run('G.players[0].dead')||0,0);
  assert.deepEqual(keys(g),['thud']);
  assert.equal(ev(g)[0][1],.8);
  const s=setup();
  s.run("G.mode='solo';G.players[0].hp=0;G.players[0].down=0;G.players[0].dead=0;globalThis.GO=0;gameOver=async()=>{GO++}");
  s.events.length=0;
  await s.run('deathCheck()');
  assert.equal(s.run('G.players[0].dead'),1);
  assert.ok(!keys(s).includes('thud'));
  assert.ok(!keys(s).includes('death'));
  assert.equal(s.run('GO'),1);
});

test('回合結束：流血播較輕的 knife、腐殖物播 squish、燃燒保持安靜',async()=>{
  const g=setup();
  g.run("G.fight={foes:[],round:1};G.players[0].bleed=1;G.players[0].bleedN=3;G.players[0].humus=1;G.players[0].humusV=2;G.players[0].burn=1;G.players[0].hp=20;addInf=()=>{};deathCheck=async()=>false;push=()=>{};draw=()=>{}");
  g.events.length=0;
  await g.run('roundEnd()');
  const k=keys(g);
  assert.ok(k.includes('knife'));
  assert.ok(k.includes('squish'));
  assert.ok(!k.includes('mimpact'));
  assert.ok(!k.includes('firealarm'));
  assert.equal(ev(g).find(d=>d[0]==='knife')[1],.4);
  assert.equal(ev(g).find(d=>d[0]==='squish')[1],.55);
});

test('QTE 閃避成功只播一次 whoosh（qte 統一，qteHit 不再加播）',async()=>{
  const g=setup();
  g.run("qteLocal=async()=>'ok';out=()=>{}");
  g.events.length=0;
  await g.run("qte(G.players[0],{t:'閃',w:['閃避'],n:3,now:1})");
  assert.deepEqual(keys(g),['whoosh']);
  assert.equal(ev(g)[0][1],.9);
  g.events.length=0;
  await g.run("qteHit({n:'敵人'},{n:'撲倒',qw:['閃避']},G.players[0])");
  assert.deepEqual(keys(g),['whoosh']);
});
