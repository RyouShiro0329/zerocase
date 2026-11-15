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

test('恐懼在畫面與紀錄都不顯示數字（2026-11-13 主人定案）',{todo:'v0.21.11 起紀錄會寫「恐懼 +N（目前 X／100）」，和主人原本的決定衝突，等主人決定'},()=>{
 assert.doesNotMatch(text,/恐懼[^`\n]{0,60}／100/);
});
