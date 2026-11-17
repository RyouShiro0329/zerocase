// 設計守則與結構檢查（Claude 2026-11-16 加入）。跑法：node --test tests/
// 這支檢查的是「不管誰改都不能壞」的東西：主人定案的設計規則、節點去處、名稱撞名。
// 規則來源：Claude 專案文件 zerocase/HANDOFF.md「主人的設計決定」。要改規則先問主人，再改這裡。
const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const src=html.match(/<script>([\s\S]*?)<\/script>/)[1];
function game(){
 const node={addEventListener(){},classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}},appendChild(){},querySelector(){return null}};
 const c=vm.createContext({console,setTimeout,clearTimeout,setInterval:(fn,ms)=>{const t=setInterval(fn,ms);t.unref();return t},clearInterval,Date,Math,Promise,Audio:class{canPlayType(){return ''}},location:{protocol:'file:'},localStorage:{getItem(){return null},setItem(){},removeItem(){}},window:{addEventListener(){}},document:{querySelector(s){return s==='#log'?null:node},querySelectorAll(){return []},addEventListener(){},createElement(){return {...node}}}});
 let s=src.replace(/let netReady=\(async\(\)=>\{[\s\S]*?\}\)\(\);/,'let netReady=Promise.resolve();').replace(/\nlayout\(\);\s*$/,'');
 vm.runInContext(s,c);
 return s2=>vm.runInContext(s2,c);
}
const g=game();
// 只看玩家會讀到的文字：去掉註解
const text=src.replace(/\/\*[\s\S]*?\*\//g,'').split('\n').filter(l=>!/^\s*\/\//.test(l)).join('\n');

test('每個選項的去處（go）都是存在的節點或結局',()=>{
 const bad=JSON.parse(g(`(()=>{const bad=[];const seen=new Set();
  const walk=(o,from,d)=>{if(!o||typeof o!=='object'||d>6||seen.has(o))return;seen.add(o);
   for(const k of Object.keys(o)){let v;try{v=o[k]}catch(e){continue}
    if(k==='go'&&typeof v==='string'&&!N[v]&&!END[v])bad.push(from+'→'+v);else if(v&&typeof v==='object')walk(v,from,d+1)}};
  for(const id of Object.keys(N)){const n=N[id];for(const c of (n.c||[]))walk(c,id,0)}
  return JSON.stringify(bad)})()`));
 assert.deepEqual(bad,[],'找不到的節點：'+bad.join('、'));
});

test('遊戲文字不出現喪屍、殭屍（敵人一律叫感染者陣營）',()=>{
 assert.deepEqual(text.match(/喪屍|殭屍|丧尸|僵尸/g)||[],[]);
});

test('遊戲文字沒有中國大陸用語',()=>{
 const W=/視頻|軟件|硬件|激活|網絡|默認|鼠標|屏幕|文件夾|信息|菜單|用戶|登錄|反饋|質量|渠道|視屏|攝像頭|充電寶|打車|點擊/g;
 assert.deepEqual([...new Set(text.match(W)||[])],[]);
});

test('舞台是美國城市：沒有台灣在地地名與事物',()=>{
 const W=/台北|臺北|新北|桃園|台中|臺中|台南|臺南|高雄|捷運|悠遊卡|健保卡|新台幣|機車行|7-11|全家便利/g;
 assert.deepEqual([...new Set(text.match(W)||[])],[]);
});

test('QTE：普通和困難完全相同（只差受到的傷害），普通困難最多 4 格、真實最多 6 格',()=>{
 const q=JSON.parse(g('JSON.stringify(QTE_D)'));
 assert.deepEqual(q.normal,q.hard);
 assert.equal(q.normal.n[1],4);assert.equal(q.real.n[1],6);
 const d=JSON.parse(g('JSON.stringify([DIFF.normal.dmg,DIFF.hard.dmg,DIFF.real.dmg])'));
 assert.ok(d[0]<d[1]&&d[1]<d[2],'傷害倍率要 普通<困難<真實');
});

test('QTE 只能靠反應：沒有改成擲骰的選項',()=>{
 const fn=g('String(qte)')+g('String(qteLocal)');
 assert.doesNotMatch(fn,/r2\(|check\(|dice\(/);
});

test('QTE 失敗不另外播燃燒瓶聲，燒燙傷用一般受傷聲',()=>{
 assert.doesNotMatch(g('String(qteLocal)'),/sfx\('mimpact'/);
 assert.notEqual(g("hurtSnd('火焰燒到了你的手臂')"),'mimpact');
});

test('一局 10 天',()=>{assert.equal(g('DAYS'),10)});

test('頂層函式沒有重複宣告（全部檔案共用同一個全域範圍）',()=>{
 const names=[...src.matchAll(/^(?:async\s+)?function\s+([A-Za-z_$][\w$]*)\s*\(/gm)].map(m=>m[1]);
 const dup=[...new Set(names.filter((n,i)=>names.indexOf(n)!==i))].filter(n=>!['msgTo'].includes(n));
 assert.deepEqual(dup,[],'重複的函式：'+dup.join('、'));
});

test('恐懼在畫面與紀錄都不顯示數字（2026-11-13 主人定案）',{todo:'v0.21.11 起紀錄會寫「恐懼 +N（目前 X／100）」；主人 2026-11-16：先暫時保留數字，之後再決定'},()=>{
 assert.doesNotMatch(text,/恐懼[^`\n]{0,60}／100/);
});

test('劇情節點代號沒有重複（2026-11-16：旅館東側樓梯和購物中心都叫 S1，後面的蓋掉前面的，走樓梯直接跑到購物中心）',()=>{
 const ids=[...src.matchAll(/^ ?([A-Za-z][\w]*):\{L:'/gm)].map(m=>m[1]);
 const dup=[...new Set(ids.filter((n,i)=>ids.indexOf(n)!==i))];
 assert.ok(ids.length>100,'沒有抓到節點，檢查寫法是不是變了');
 assert.deepEqual(dup,[],'重複的節點：'+dup.join('、'));
});

test('備忘錄、任務的時間只寫天數與時段，不寫幾點幾分',()=>{
 const s=g('codexStamp({t0:1200,clock:1000})');
 assert.match(s,/^第 \d+ 天・(清晨|白天|傍晚|夜晚)$/);
});

test('遊戲文字沒有缺字（缺的字會改用手機字型，大小粗細不一樣；修法：python3 tools/make_font_subset.py）',()=>{
 const cov=new Set([...fs.readFileSync(path.join(__dirname,'../fonts/coverage.txt'),'utf8').split('\n').slice(1).join('')]);
 const miss=[...new Set([...text].filter(c=>c.codePointAt(0)>0x7F&&!/\s/.test(c)&&!cov.has(c)))];
 assert.deepEqual(miss,[],'字型缺字：'+miss.join(''));
});

// v0.29.0 特殊欄位（主人 2026-11-17 02:38）：只放有戰鬥技能的道具（手電筒、滅火器），每人兩格；打火機、照片是一般道具，背包有就能用；
// 劇情選項要的道具要在同一個人身上（燃燒瓶＋打火機也是），由身上有的人來做；戰鬥丟燃燒瓶，丟的人身上要有打火機
function g29(){const r=game();r(`UI.snd=0;UI.bgm=0;FAST=1;draw=()=>{};push=()=>{};flush=async()=>{};snd=()=>0;sfx=()=>0;
 globalThis.mk=(pid,name)=>({pid,name,col:'#ccc',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},traits:[],items:{},gear:[],hand:{R:null,L:null},eq:{head:null,face:null,body:null,arm:null,leg:null},tl:[null,null],hun:7,thi:7,fe:30,pk:0,frac:0,lv:1,xp:0,hp:20,max:20,inf:0,bon:{}});
 globalThis.p=mk('p1','了白');globalThis.q=mk('p2','隊友');ROLE='host';
 G={rid:'t',mode:'mp',host:'p1',players:[p,q],lv:'C',node:'C1',ground:[],grounds:{},flags:{},uid:0,opts:{diff:'normal'},seq:0,levels:1,used:{}};LOG=[];`);return r}
test('特殊欄位只放手電筒、滅火器，每人兩格',()=>{
 assert.equal(g('TOOLK.join()'),'flashlight,extinguisher');assert.equal(g('TOOLN'),2);
});
test('打火機、照片不用裝：背包有就能點菸、看照片',async()=>{const r=g29();
 r("p.items.lighter=1;p.items.cigarette=1;p.items.photo=1");
 assert.notEqual(await r("useItem(p,'cigarette')"),false,'點菸');assert.notEqual(await r("useItem(p,'photo')"),false,'看照片');
});
test('戰鬥丟燃燒瓶：丟的人身上要有打火機（隊友有也不行）',async()=>{const r=g29();
 r("p.items.molotov=1;q.items.lighter=1;G.fight={foes:[newFoe(0,'infected',2)],round:1}");
 assert.equal(await r("execAct(p,{a:'molotov'})"),false);assert.equal(r('p.items.molotov'),1,'沒丟出去');
});
test('劇情要兩樣道具：分在兩個人身上不能選，說明要寫在同一個人身上；拿過來之後只列身上有的人',()=>{const r=g29();
 r("globalThis.c={l:'丟燃燒瓶',req:['molotov','lighter'],ok:{t:'x'}};p.items.molotov=1;q.items.lighter=1");
 assert.equal(r('choiceOk(c)'),false);assert.match(r('reqWhy(c)'),/燃燒瓶、打火機要在同一個人身上/);
 r("delete q.items.lighter;p.items.lighter=1");assert.equal(r('choiceOk(c)'),true);
 assert.equal(r('rollEl(c).map(x=>x.pid).join()'),'p1');
});
test('強光照射每場一次、不會用掉；滅火器全場命中 −2、每場一次、每次扣一個',async()=>{const r=g29();
 r("p.items.flashlight=1;p.items.extinguisher=2;p.tl=['flashlight','extinguisher'];p.tlUsed={};G.fight={foes:[newFoe(0,'infected',2),newFoe(1,'infected',2)],round:1}");
 await r("execAct(p,{a:'flash',t:1})");
 assert.equal(r('G.fight.foes[1].dazzle'),4);assert.equal(r('G.fight.foes[0].dazzle'),0);assert.equal(r('p.items.flashlight'),1,'手電筒不會用掉');
 assert.equal(r('foeHitMod(G.fight.foes[1])<=-4'),true);
 assert.equal(await r("execAct(p,{a:'flash',t:0})"),false,'同一場第二次不行');
 await r("execAct(p,{a:'ext'})");
 assert.equal(r('G.fight.foes.map(f=>f.dazzle).join()'),'2,4');assert.equal(r('p.items.extinguisher'),1);
 assert.equal(await r("execAct(p,{a:'ext'})"),false,'同一場第二次不行');assert.equal(r('p.items.extinguisher'),1);
});
test('手電筒、滅火器放背包沒裝：不能用技能',async()=>{const r=g29();
 r("p.items.flashlight=1;p.items.extinguisher=1;p.tl=[null,null];p.tlUsed={};G.fight={foes:[newFoe(0,'infected',2)],round:1}");
 assert.equal(await r("execAct(p,{a:'flash',t:0})"),false);assert.equal(await r("execAct(p,{a:'ext'})"),false);assert.equal(r('p.items.extinguisher'),1);
});

// v0.30.0 骰子機制（主人 2026-11-17 16:25～16:48 定案，方案在專案 zerocase/PROPOSAL_DICE.md）
function g30(){const r=g29();r(`dice=async()=>{};G.know={};G.alarm=0;G.flags={};globalThis.F0=(n)=>Array.from({length:n},(_,i)=>({id:i,type:'infected',n:'感染者'+i,hp:999,max:999,bleed:0,burn:0,stun:0,weak:0,prone:0,dead:0}));
 globalThis.seq=a=>{let i=0;return ()=>{const v=a[Math.min(i,a.length-1)];i++;return {a:v,s:v}}};`);return r}
test('抗性 ×0.75、弱點 ×1.25 四捨五入；抗性至少少 1、弱點至少多 1；最少 1',()=>{const r=g30();
 r("globalThis.f=F0(1)[0];G.fight={foes:[f],first:false};globalThis.hit=(b,dt)=>{f.hp=999;applyDmg(f,b,[dt],null,true);return 999-f.hp}");
 assert.equal(r("[1,2,3,4,8,10,12].map(b=>hit(b,'pierce')).join()"),'1,1,2,3,6,8,9','感染者抗穿刺');
 assert.equal(r("[1,2,4,6,8].map(b=>hit(b,'blunt')).join()"),'2,3,5,8,10','感染者弱鈍擊');
 assert.equal(r("[1,4,7].map(b=>hit(b,'slash')).join()"),'1,4,7','沒有抗性不變');
});
test('固定加值不再保底 1：力量 0、1 級拿球棒，加值是 0',()=>{const r=g30();
 assert.equal(r("p.st.STR=0;p.lv=1;dmgOf(p,WEAP.bat,null)"),0);assert.equal(r("p.st.STR=4;dmgOf(p,WEAP.bat,null)"),2);
});
// v0.31.0 能力重新設計（主人 2026-11-17 21:12～11-18 01:42，PROPOSAL_STATS）
test('能力：建角 8 點、魅力改統帥、防禦＝10＋敏捷÷2、力量每 3 點格擋 1',()=>{const r=g30();r('globalThis.SV={mr:Math.random,se:statEffects,ar:armorOf,fd:foeDmg,r2:r2,h:hurt}');
 assert.equal(r('STAT_PTS+","+STAT_MAX'),'8,5');assert.equal(r('STN.CHA'),'統帥');
 r('statEffects=()=>[]');assert.equal(r("[0,1,2,3,4,5].map(v=>{p.st.AGI=v;return baseDef(p)}).join()"),'10,10,11,11,12,12');
 assert.equal(r("[0,2,3,5,6].map(v=>{p.st.STR=v;return strBlock(p)}).join()"),'0,0,1,1,2');
 assert.equal(r("[...Object.values(PRESETS),...Object.entries(JOBS).filter(([k])=>!RETIRED_JOBS.has(k)).map(([,j])=>j)].every(c=>Object.values(c.st).reduce((a,b)=>a+b,0)===8)"),true,'每個劇情角色 8 點');r('Math.random=SV.mr;statEffects=SV.se;armorOf=SV.ar;foeDmg=SV.fd;r2=SV.r2;hurt=SV.h');
});
test('統帥：恐懼累積看隊上最高統帥（每點 4%，單人加倍）；驚嚇檢定擲統帥',()=>{const r=g30();r('globalThis.SV={mr:Math.random,se:statEffects,ar:armorOf,fd:foeDmg,r2:r2,h:hurt}');
 r("statEffects=()=>[];p.traits=[];q.traits=[];p.st.CHA=0;q.st.CHA=0;p.st.INT=0;globalThis.B0=fearRate(p);p.st.INT=5;globalThis.B1=fearRate(p);q.st.CHA=3");
 assert.equal(r("B1===B0"),true,'智力不再影響恐懼');
 assert.equal(r("(fearRate(p)/B0).toFixed(2)"),'0.88','多人：隊友統帥 3，全隊少漲 12%');
 r("G.players=[p];p.st.CHA=3");assert.equal(r("(fearRate(p)/B0).toFixed(2)"),'0.76','單人加倍');
 assert.ok(/statMod\(p,'CHA'\)\+\(tr\(p,'calm'\)/.test(r("fright.toString()")),'驚嚇檢定用統帥');r('Math.random=SV.mr;statEffects=SV.se;armorOf=SV.ar;foeDmg=SV.fd;r2=SV.r2;hurt=SV.h');
});
test('力量格擋只擋近戰：感染者撲咬減 1、槍擊不減',()=>{const r=g30();r('globalThis.SV={mr:Math.random,se:statEffects,ar:armorOf,fd:foeDmg,r2:r2,h:hurt}');
 r("p.st.STR=3;p.st.AGI=0;p.eq={head:null,face:null,body:null,arm:null,leg:null};armorOf=()=>0;Math.random=()=>0.99;globalThis.f=F0(1)[0];G.fight={foes:[f],first:false,round:1};foeDmg=async()=>5;r2=()=>({a:19,s:19,b:19})");
 r("globalThis.H=[];hurt=(t,d,x)=>H.push(d)");
 return (async()=>{await r("foeHit(f,MOVES.infected[0],p,1)");await r("foeHit(f,{n:'快射',d:5,h:6,gun:1,rng:1},p,1)");assert.equal(r("H[1]-H[0]"),1,'近戰比槍擊少 1');r("p.st.STR=2;H.length=0");await r("foeHit(f,MOVES.infected[0],p,1)");await r("foeHit(f,{n:'快射',d:5,h:6,gun:1,rng:1},p,1)");assert.equal(r("H[1]-H[0]"),0,'力量 2 沒有格擋')})().finally(()=>{r('Math.random=SV.mr;statEffects=SV.se;armorOf=SV.ar;foeDmg=SV.fd;r2=SV.r2;hurt=SV.h');});
});
test('武器能力逐把決定：劈砍與長柄看敏捷命中、力量傷害；霰彈槍與 FAL 力量 1 以下命中 −2',()=>{const r=g30();
 assert.equal(r("['kitchenknife','cutter','baton','mopspear','pipespear','firehook'].map(k=>WEAP[k].st.join()+'/'+WEAP[k].ds).join()"),'AGI/STR,AGI/STR,AGI/STR,AGI/STR,AGI/STR,AGI/STR');
 assert.equal(r("['knife','bat','fireaxe'].map(k=>WEAP[k].st.join()+'/'+WEAP[k].ds).join()"),'AGI/AGI,STR/STR,STR/STR');
 assert.equal(r("['r870','sbshot','fal'].map(k=>WEAP[k].heavy).join()"),'1,1,1');
});
test('武器說明寫出命中、傷害看哪個能力與耐久；地上的武器也寫耐久',()=>{const r=g30();
 const t=r("wLine(p,WEAP.kitchenknife,{id:'kitchenknife',u:1,dur:9},'R')");
 assert.ok(t.includes('命中看敏捷')&&t.includes('看力量')&&t.includes('耐久 9／14'),t);
 assert.ok(r("wLine(p,WEAP.beretta,{id:'beretta',u:2,dur:30,mag:8},'R')").includes('不看能力'));
 assert.ok(r("groundName({g:{id:'bat',u:3,dur:5}})").includes('耐久 5／'+r('WEAP.bat.dur')));
});
test('合成三格，每個配方（材料＋工具）最多三樣',()=>{const r=g30();
 assert.equal(r('CRAFT_SLOTS'),3);
 assert.equal(r("RECIPES.filter(x=>!x.special&&x.in.length+(x.tools||[]).length>3).map(x=>x.id).join()"),'');
});
// v0.31.2 骰子結果寫成算式（主人 2026-11-18 02:29）：骰出 ＋ 加值 ＝ 總和，後面接結果；輪到敵人也一樣
// v0.32.0 只顯示命中骰（主人 2026-11-18 03:10～03:37）：傷害骰在背景擲（照狐霖），只寫在事件紀錄
test('只骰命中：檢定與命中寫成算式，傷害在背景擲、寫進紀錄',async()=>{const r=g30();
 r("globalThis.SV2={d:dice,r2:r2,mr:Math.random,se:statEffects,h:hurt};globalThis.DS=[];dice=async s=>{DS.push(s)};statEffects=()=>[]");
 try{
  r("r2=seq([14]);p.st.AGI=3;p.traits=[]");await r("check(p,'AGI',10,'測試')");
  assert.match(r("DS[0].result"),/14 \+ 3 = 17<\/span><span[^>]*>成功/);
  r("DS.length=0;LOG.length=0;r2=seq([12]);globalThis.f=F0(1)[0];G.fight={foes:[f],first:false,round:1};hurt=()=>{}");
  await r("foeHit(f,MOVES.infected[0],p,1)");
  assert.equal(r("DS.length"),1,'敵人只跳命中骰');
  assert.match(r("DS[0].result"),/12 \+ \d+ = \d+<\/span>/,'敵人命中算式');
  assert.match(r("LOG.map(x=>x[0]).join('\\n')"),/傷害 2d4\(<b>\d、\d<\/b>\)＝<b>\d+<\/b>/,'敵人傷害 2d4 寫在紀錄');
  r("DS.length=0;LOG.length=0;p.hand={R:null,L:null};p.st.STR=4;G.fight={foes:F0(1),first:false};r2=seq([15])");
  await r("attack(p,'R',null,0)");
  assert.equal(r("DS.length"),1,'玩家只跳命中骰，不跳傷害骰');
  assert.doesNotMatch(r("DS.map(x=>x.result).join()"),/傷害/);
  assert.match(r("LOG.map(x=>x[0]).join('\\n')"),/拳頭　→　感染者0　傷害/,'玩家傷害寫在紀錄');
 }finally{r("dice=SV2.d;r2=SV2.r2;Math.random=SV2.mr;statEffects=SV2.se;hurt=SV2.h")}
});
// v0.32.0（主人 2026-11-18 03:37）：雙手武器只能雙手拿；穿刺只給弓弩和用戳的近戰；刀類斬擊、釘刺棒鈍擊；建角物品寫公式與耐久
test('武器：雙手只能雙手拿、穿刺分配、建角寫公式與耐久',()=>{const r=g30();
 assert.equal(r("Object.values(WEAP).filter(w=>w.one).length"),0,'沒有可以單手拿的雙手武器');
 r("p.gear=[newGear('bat'),newGear('knife')];p.hand={R:null,L:null};equip(p,p.gear[1].u,'R');equip(p,p.gear[0].u,'L',1)");
 assert.equal(r("p.hand.R===p.gear[0].u&&p.hand.L===p.gear[0].u"),true,'球棒一定佔兩手');
 assert.equal(r("handW(p,'L').w.dd.join()"),'1,6');
 const pier=r("Object.keys(WEAP).filter(k=>WEAP[k].dt.includes('pierce')).sort().join()");
 assert.equal(pier,['compbow','crossbow','firehook','handxbow','icepick','mopspear','pipespear','pvcbow','screwdriver','stake'].sort().join());
 for(const k of ['knife','armyknife','scissors','shiv','cutter','kitchenknife'])assert.equal(r(`WEAP.${k}.dt[0]`),'slash',k);
 for(const k of ['nailbat','nailboard'])assert.equal(r(`WEAP.${k}.dt[0]`),'blunt',k);
 assert.match(r("ldFml(WEAP.knife)"),/命中看敏捷.*傷害 1d4＋敏捷÷2.*耐久 15/);
 assert.match(r("ldFml(WEAP.bat)"),/傷害 1d6＋力量÷2.*耐久 25/);
 r("globalThis.og=JSON.parse(JSON.stringify(G));og.players[0].gear=[{id:'bat',u:7,one:1,dur:25}];og.players[0].hand={R:7,L:null};migrateG(og)");
 assert.equal(r("og.players[0].hand.R===7&&og.players[0].hand.L===7&&!og.players[0].gear[0].one"),true,'舊存檔單手拿的改雙手');
});
// v0.30.1 等級成長（主人 2026-11-17 20:30 同意）：每 2 級命中 +1，傷害不隨等級
test('等級：每 2 級命中 +1，傷害不隨等級增加',()=>{const r=g30();
 assert.equal(r("[1,2,3,4,5,10].map(l=>{p.lv=l;return lvHit(p)}).join()"),'0,1,1,2,2,5');
 assert.equal(r("p.st.STR=4;p.lv=1;globalThis.A1=dmgOf(p,WEAP.bat,null);p.lv=9;A1+','+dmgOf(p,WEAP.bat,null)"),'2,2');
 assert.equal(r("G.fight=null;p.st.STR=0;p.dual=0;p.lv=1;globalThis.A2=hitBonus(p,'R',WEAP.bat,null);p.lv=6;hitBonus(p,'R',WEAP.bat,null)-A2"),3);
});
test('敵人傷害改擲骰：每一招的固定數字都有對應的骰子，平均值差不到 0.5',async()=>{const r=g30();
 const bad=r("const o=[];for(const [k,ms] of Object.entries(MOVES))for(const m of ms){const v=m.d??FOES[k].dmg;const [n,s,b]=fddOf(v);if(!FDD[v]||Math.abs((n?n*(s+1)/2:0)+b-v)>.5)o.push(k+':'+m.n+':'+v)}o.join()");
 assert.equal(bad,'');
 const v=await r("(async()=>{const f=F0(1)[0];let lo=99,hi=0;for(let i=0;i<300;i++){const x=await foeDmg(f,{d:5,n:'測試'});lo=Math.min(lo,x);hi=Math.max(hi,x)}return lo+','+hi})()");
 assert.equal(v,'2,8','撲咬 5 → 2d4 擲得出 2～8');
});
test('攻擊擲出 20 叫爆擊：整個傷害 ×2，再算弱點',async()=>{const r=g30();
 r("p.hand={R:null,L:null};G.fight={foes:F0(1),first:false};r2=seq([20]);rollDmg=()=>({r:3,d:4});LOG.length=0");
 await r("attack(p,'R',null,0)");
 assert.equal(r('G.fight.foes[0].hp'),989,'4×2＝8，弱鈍擊 ×1.25＝10');
 assert.match(r("LOG.map(x=>x[0]).join('｜')"),/爆擊/);assert.doesNotMatch(r("LOG.map(x=>x[0]).join('｜')"),/<span[^>]*>(大成功|重擊)</,'擲骰結果的字不能是大成功或重擊（敘事文字裡的「一記重擊」可以）');
});
test('橫掃對每個目標各擲一次：一個爆擊、一個大失敗、一個命中',async()=>{const r=g30();
 r("p.gear=[newGear('bat')];p.hand={R:null,L:null};equip(p,p.gear[0].u,'R');p.st.STR=2;G.fight={foes:F0(3),first:false};r2=seq([20,1,10]);rollDmg=()=>({r:3,d:4})");
 await r("attack(p,'R','sweep',0)");
 assert.equal(r("G.fight.foes.map(f=>f.hp).join()"),'989,999,994');
});
test('敵人的攻擊也叫爆擊；槍架穩是傷害 +2 不是 ×1.5',()=>{
 assert.doesNotMatch(src,/'重擊':hit/);assert.doesNotMatch(src,/d\*1\.5/);assert.match(src,/brace\?2:0/);
});
test('全隊投票的檢定沒有協助 +2：多人時擲骰的人只看自己的能力',async()=>{const r=g30();
 // 直接走 doCheck（真正決定加值的地方），把擲骰換成只記錄加值
 r("globalThis.__ex=null;G.ev=null;N.T30G={L:'A',n:'測試',t:'測試',c:[{l:'測試',k:'AGI',d:12,ok:{t:'x'},ng:{t:'y'}}]};G.node='T30G';searchChoices=n=>n.c;zView=cs=>cs;check=async(p,st,dc,l,ex)=>{__ex=ex||0;return {ok:true,r:10,tot:10}};passTime=async()=>false;applyRes=async()=>{}");
 await r("doCheck(0,p)");assert.equal(r('G.players.length'),2);assert.equal(r('__ex'),0);
});
test('先攻同分：玩家先於敵人，玩家之間先比敏捷',async()=>{const r=g30();
 // rnd 是 const，改 Math.random：前三次對應 d20 12、10、12，之後（同分的隨機序）固定 0.5；測完還原
 r("p.st.AGI=2;q.st.AGI=4;G.fight={foes:F0(1),first:false,round:1}");assert.ok(r("statMod(q,'AGI')>statMod(p,'AGI')"));
 await r("(async()=>{const R0=Math.random;const fm=FOES.infected.init+(isNight()?2:0),a=[14-statMod(p,'AGI'),14-statMod(q,'AGI'),14-fm].map(v=>(v-1)/20+.01);let i=0;Math.random=()=>i<a.length?a[i++]:.5;try{await rollInit('normal')}finally{Math.random=R0}})()");
 assert.equal(r("G.fight.order.map(o=>o.k+':'+o.id).join()"),'p:p2,p:p1,f:0',r("JSON.stringify(G.fight.order)"));
});
test('多段攻擊選之前先確認彈藥：箭不夠射兩次就不能用二連射',async()=>{const r=g30();
 r("p.gear=[newGear('pvcbow')];p.hand={R:null,L:null};equip(p,p.gear[0].u,'R');p.items.arrow=1;G.fight={foes:F0(1),first:false}");
 assert.equal(await r("attack(p,'R','double2',0)"),false);assert.equal(r('p.items.arrow'),1);
});
