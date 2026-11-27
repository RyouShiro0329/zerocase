// 素材完整性掃描（Claude 2026-11-25，QA 升級 PR-C：QA-19）
// index.html 裡直接寫出來的路徑只有十幾個；大部分音效是 'sfx/'+名稱+'.mp3' 動態組成，立繪是 'img/'+名稱+'.webp'。
// 所以這支不只搜尋字串，還在 vm 裡載入遊戲，從遊戲自己的表讀出名稱：
//   1. 寫死的路徑：img/、fx/、sfx/、fonts/ 開頭的檔名（含 CSS 的 url()）→ 檔案要存在
//   2. 音效檔：音效表 SFILES 的每個名稱 → sfx/名稱.mp3；genloop、rain_ 開頭的照遊戲載入順序先 .ogg 再 .mp3，兩個都要有
//      配樂三軌（BGM_MIX 的 explore／battle／intense）→ .ogg 和 .mp3 都要有（瀏覽器看 canPlayType 挑一個）；十字弓 sfx/crossbowshot.wav
//   3. 遊戲裡用到的音效名稱：snd／sfx／sfxW／sndW／play／radioLine 呼叫裡的字串、這些呼叫用到的函式（hurtSnd 等）回傳的字串、
//      資料表裡會拿去播的欄位（snd、cy、rl、hs、ws、okA、audio、audioStop、after 的第一格）→ 每一個都要是「播得出來」的名稱：
//      有音效檔（SFILES）、程式合成（SYN）、組合槍聲（SCUE）或 sfx() 裡特別處理的弓箭聲
//   4. 立繪：資料表裡所有 img 欄位（敵人 ROSTER、FOE_IMG、訪客角色）→ img/名稱.webp 要存在
//   5. 備援 FALL 指到的合成音要存在；組合槍聲 SCUE 用到的槍聲要是音效檔
// 另外列出「資料夾裡有、但沒有被引用」的檔案（只記錄，不算失敗）。
// 用法：node tests/helpers/assets.cjs [遊戲資料夾，預設倉庫根目錄]　有缺少或認不得的名稱 exit 1
const fs=require('node:fs'),path=require('node:path');
const {load}=require('./game-vm.cjs');
const SOUND_KEYS=['snd','cy','rl','hs','ws','okA','audio','audioStop','pre'];/* pre＝敵人招式出手前的聲音（PR-D 補上） */
// sfx() 裡寫死、沒有檔案也沒有合成表的特別名稱（engine_b 的 sfx：bowhit／bowmiss 走 playBowShot，arrow／xbow 走 playArrowAudio）
const SPECIAL=['bowhit','bowmiss','arrowhit','arrowmiss','xbowhit','xbowmiss','crossbowshot'];
const CALLS=['snd','sfx','sfxW','sndW','play','radioLine'];
// 比較式裡的字串（mode==='crossbow'、fac==='inf'）不是音效名稱，先拿掉
const lits=s=>[...String(s).replace(/(?:[=!]==?|<|>)\s*(?:'[^']*'|"[^"]*")|(?:'[^']*'|"[^"]*")\s*(?:[=!]==?)/g,' ').matchAll(/'([A-Za-z_][\w]*)'|"([A-Za-z_][\w]*)"/g)].map(m=>m[1]||m[2]);
// 取出呼叫的第一個參數（括號配對到第一個最外層逗號或右括號）
function firstArg(src,i){let d=0,q=null,out='';for(;i<src.length;i++){const ch=src[i];
 if(q){out+=ch;if(ch==='\\'){out+=src[++i]||'';continue}if(ch===q)q=null;continue}
 if(ch==="'"||ch==='"'||ch==='`'){q=ch;out+=ch;continue}
 if(ch==='('||ch==='['||ch==='{'){d++;out+=ch;continue}
 if(ch===')'||ch===']'||ch==='}'){if(d===0)break;d--;out+=ch;continue}
 if(ch===','&&d===0)break;out+=ch}return out}
function scan(root){
 root=path.resolve(root||path.join(__dirname,'../..'));
 const R={root,files:[],missing:[],unknownKeys:[],notes:[],unused:[],counts:{}};
 const need=(rel,why)=>{R.files.push(rel);if(!fs.existsSync(path.join(root,rel)))R.missing.push({file:rel,why})};
 const g=load(path.join(root,'index.html'));const html=g.html,src=g.script;
 // 1. 寫死的路徑
 const stat=new Set([...html.matchAll(/(?<![\w\/])(img|fx|sfx|fonts)\/([\w\-.]+\.(?:webp|png|jpe?g|svg|mp3|ogg|wav|woff2?|ttf|md|txt))/g)].map(m=>m[1]+'/'+m[2]));
 for(const f of stat)need(f,'index.html 直接寫出的路徑');
 // 2. 音效檔
 const SFILES=g.run('SFILES.slice()');
 for(const n of SFILES){const fm=n==='genloop'||n.startsWith('rain_')?['ogg','mp3']:['mp3'];for(const e of fm)need(`sfx/${n}.${e}`,'音效表 SFILES：'+n)}
 const stems=g.run(`(()=>{const o={};for(const [m,a] of Object.entries(BGM_MIX.tracks)){const s=String(a.src||'').match(/sfx\\/([\\w]+)\\./);o[m]=s?s[1]:null}return o})()`);
 for(const [m,s] of Object.entries(stems)){if(!s){R.missing.push({file:'(配樂 '+m+')',why:'讀不到配樂檔名'});continue}for(const e of ['ogg','mp3'])need(`sfx/${s}.${e}`,'配樂 '+m)}
 need('sfx/crossbowshot.wav','十字弓（loadArrowSound）');
 // 3. 音效名稱
 const SYN=g.run('Object.keys(SYN)'),SCUE=g.run('JSON.parse(JSON.stringify(SCUE))'),FALL=g.run('JSON.parse(JSON.stringify(FALL))');
 const valid=new Set([...SFILES,...SYN,...Object.keys(SCUE),...SPECIAL]);
 const used=new Map();const use=(k,where)=>{if(!k)return;if(!used.has(k))used.set(k,new Set());used.get(k).add(where)};
 const fnNames=new Set(g.globals());
 for(const name of CALLS){const re=new RegExp('(?<![\\w.$])'+name+'\\(','g');let m;
  while((m=re.exec(src))){const arg=firstArg(src,m.index+m[0].length);
   for(const k of lits(arg))use(k,name+'(…) 呼叫');
   // 參數裡呼叫的函式（例如 hurtSnd(t)、foeStep(f)）：取函式裡 return 後面的字串
   for(const fm of arg.matchAll(/([A-Za-z_$][\w$]*)\(/g)){const fn=fm[1];if(!fnNames.has(fn))continue;let body='';try{body=g.run(`typeof ${fn}==='function'?${fn}.toString():''`)}catch(e){}
    for(const r of body.matchAll(/return\s+([^;}]+)/g))for(const k of lits(r[1].replace(/\/(?:\\.|[^\/\n])+\/[gimsuy]*\.test\([^)]*\)/g,'')))use(k,fn+'() 的回傳值')}}}
 // 資料表：把每個最外層的物件走一遍
 const seen=new Set();let walked=0;
 const walk=(o,where,depth)=>{if(!o||typeof o!=='object'||seen.has(o)||depth>9)return;seen.add(o);walked++;
  for(const k of Object.keys(o)){const d=Object.getOwnPropertyDescriptor(o,k);if(!d||d.get)continue;const v=d.value;
   if(SOUND_KEYS.includes(k)){for(const x of [].concat(v))if(typeof x==='string')use(x,where+'.'+k)}
   else if(k==='after'&&Array.isArray(v)&&typeof v[0]==='string')use(v[0],where+'.after');
   else if(k==='img')for(const x of [].concat(v))if(typeof x==='string'&&x)need(`img/${x}.webp`,'立繪 '+where+'.img');
   if(v&&typeof v==='object')walk(v,where+(Array.isArray(o)?'['+k+']':'.'+k),depth+1)}};
 for(const name of g.globals()){let v;try{v=g.run(`typeof ${name}==='undefined'?undefined:${name}`)}catch(e){continue}
  if(name==='UI'||name==='G'||typeof v==='function')continue;if(v&&typeof v==='object')walk(v,name,0)}
 try{for(const [k,arr] of Object.entries(g.run('FOE_IMG')))for(const x of arr)need(`img/${x}.webp`,'FOE_IMG.'+k)}catch(e){R.notes.push('讀不到 FOE_IMG')}
  // 道具圖示：ITEMS 與 WEAP（不含拳頭）→ img/item/<key>.webp
  try{for(const k of g.run('Object.keys(ITEMS)'))need('img/item/'+k+'.webp','道具圖示 ITEMS.'+k);
    for(const k of g.run('Object.keys(WEAP).filter(k=>k!=="fist")'))need('img/item/'+k+'.webp','道具圖示 WEAP.'+k)}catch(e){R.notes.push('讀不到道具圖示表')}
 for(const [k,where] of used)if(!valid.has(k))R.unknownKeys.push({key:k,where:[...where].slice(0,4).join('、')});
 // 5. 備援與組合槍聲
 for(const [k,f] of Object.entries(FALL))if(!SYN.includes(f))R.unknownKeys.push({key:f,where:'FALL.'+k+'（備援要是合成音 SYN）'});
 for(const [k,c] of Object.entries(SCUE))if(!SFILES.includes(c.gun))R.unknownKeys.push({key:c.gun,where:'SCUE.'+k+'.gun（要是音效檔）'});
 // 沒被引用的檔案（只記錄）
 const ref=new Set(R.files);
 for(const d of ['sfx','img','fx'])if(fs.existsSync(path.join(root,d)))for(const f of fs.readdirSync(path.join(root,d)))if(!ref.has(d+'/'+f))R.unused.push(d+'/'+f);
 R.files=[...new Set(R.files)];
 R.used=Object.fromEntries([...used].map(([k,w])=>[k,[...w]]));/* PR-D：音效對應表（tests/helpers/sfx-map.cjs）要知道每個名稱在哪裡用到 */
 R.counts={files:R.files.length,static:stat.size,sfiles:SFILES.length,soundNames:used.size,valid:valid.size,walkedObjects:walked};
 R.ok=!R.missing.length&&!R.unknownKeys.length;
 return R;
}
if(require.main===module){const r=scan(process.argv[2]);
 console.log(`素材掃描：檢查 ${r.counts.files} 個檔案（寫死的路徑 ${r.counts.static}、音效表 ${r.counts.sfiles} 個名稱）、遊戲用到的音效名稱 ${r.counts.soundNames} 個`);
 for(const m of r.missing)console.log('缺少檔案　'+m.file+'　（'+m.why+'）');
 for(const u of r.unknownKeys)console.log('認不得的音效名稱　'+u.key+'　（'+u.where+'）');
 if(r.unused.length)console.log('只記錄：資料夾裡沒有被引用的檔案 '+r.unused.length+' 個：'+r.unused.join('、'));
 if(process.env.QA_DETAIL)fs.writeFileSync(process.env.QA_DETAIL,JSON.stringify(r,null,1));
 console.log(r.ok?'素材都在、音效名稱都認得':'有缺少的素材或認不得的音效名稱');process.exit(r.ok?0:1)}
module.exports={scan};
