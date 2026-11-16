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
