// 音效對應表（Claude 2026-11-25，QA 升級 PR-D：QA-16）
// 「這個名稱是什麼聲音、用在哪裡」整理成一張表，讓主人審查；這次**只列缺口，不換任何音效**。
// 做三件事：
//   1. DESC：每一個播得出來的音效名稱（音效檔 SFILES、合成音 SYN、組合槍聲 SCUE、弓箭特別名稱）寫一行「聽起來是什麼」。
//      說明是 Claude 依檔名、遊戲裡的用法整理的，**還沒經過主人審查**（文件標「待主人審查」）。
//      遊戲多了新名稱、表裡沒有 → 失敗（新音效要先寫說明）；表裡的名稱遊戲已經沒有 → 失敗（拿掉）。
//   2. 用在哪裡：沿用素材掃描（tests/helpers/assets.cjs）找到的呼叫與資料欄位，加上環境音（ambientSpec）。
//   3. 缺口（只列出來，等主人決定）：
//      - 隨機意外 HAZ：發生時沒有聲音（audio）、躲開沒有聲音（okA）、受傷聲（hs）
//      - 敵人招式 MOVES：有傷害卻沒標受傷聲（播預設的 claw）；開槍的招式沒有槍聲
//      - 劇情結果：扣血卻沒標受傷聲（播預設的 hurt）
//      - 音效檔沒有備援（FALL）：檔案載入失敗時那一下沒有聲音
//      - 素材資料夾裡有、遊戲沒有用到的音檔
//      - 人工觀察（瀏覽器測試量到、交接文件記的）：MANUAL
// 用法：node tests/helpers/sfx-map.cjs [--md 輸出檔]　（docs/audio/SFX_MAP.md 就是這樣產生的）
const fs=require('node:fs'),path=require('node:path');
const {load}=require('./game-vm.cjs');const {scan}=require('./assets.cjs');
// 名稱 → 說明（Claude 整理，待主人審查）
const DESC={
 // 音效檔：戰鬥
 piercehit:'刺擊命中（刺進肉裡）',bowdraw:'拉弓、放箭',bowimpact:'箭射中',crossbowshot:'十字弓發射',
 beretta:'手槍槍聲',berettaReload:'手槍換彈匣',revolver:'左輪槍聲',revolverCock:'左輪扳擊錘',casing:'彈殼落地',
 fal:'戰鬥步槍槍聲',falReload:'戰鬥步槍換彈匣',mp5:'衝鋒槍槍聲',mp5Reload:'衝鋒槍換彈匣',rifle:'獵槍（栓動步槍）槍聲',bolt:'拉槍機',shotgun:'霰彈槍槍聲',sgpump:'泵動霰彈槍拉泵（咔、咔）',sgshell:'泵動霰彈槍塞一發彈殼',sgshellbr:'單管霰彈槍塞彈',sgopen:'單管霰彈槍折開',sgclose:'單管霰彈槍合上',revopen:'左輪甩開彈巢',reveject:'左輪倒出彈殼',revshell:'左輪塞一發進彈巢',revclose:'左輪合上彈巢',m500:'Model 500 開槍（大口徑）',dryfire:'空槍扣扳機',
 fist:'拳頭打中',claw:'爪子抓傷（敵人招式的預設受傷聲）',knife:'刀刃砍、割',bite:'被咬',smash:'重擊砸中',splat:'黏稠的東西砸開',spit:'噴吐',thud:'撞擊、摔倒、被砸（鈍擊）',squish:'軟爛的東西被擠壓',bhit:'子彈打中',
 headshot:'爆頭',mthrow:'丟出燃燒瓶',mimpact:'燃燒瓶炸開、火焰',death:'倒下、死亡',
 // 音效檔：移動、動作
 stairs:'上下樓梯',step:'人的腳步',zstep:'感染者的腳步',dooropen:'開門',doorclose:'關門',
 heal:'包紮、處理傷口',pill:'吞藥',rummage:'翻找東西',zipper:'拉背包拉鍊',drawer:'拉抽屜',pickup:'撿起東西',equip:'裝上裝備',click:'按鍵、開關（也用在強光照射）',
 // 音效檔：環境
 rain_indoor_loop:'室內聽到的雨聲（循環）',rain_outdoor_loop:'室外的雨聲（循環）',thunder_distant_01:'遠處的雷聲（一）',thunder_distant_02:'遠處的雷聲（二）',
 glassbreak:'玻璃碎掉',glassstep:'踩到碎玻璃',woodknock:'敲木頭、木門',woodimpact:'木板砸下來',firealarm:'火災警鈴',genstart:'發電機發動',genloop:'發電機運轉（循環）',
 waterpipe:'水管裡的水流（循環）',pumpmix:'抽水機運轉（循環）',pumpstop:'抽水機停下',radiostatic:'無線電雜訊',radio02:'無線電台詞 02',radio23:'無線電台詞 23',radio24:'無線電台詞 24',
 // 合成音（程式即時合成，沒有音檔）
 humanstep:'合成：人的腳步（腳步聲檔案載入失敗時的備援）',infectedstep:'合成：感染者的腳步（備援）',doorlocked:'合成：門鎖住、推不開',rattle:'合成：骰子在杯裡滾',land:'合成：骰子落地、悶響',
 ok:'合成：檢定成功',crit:'合成：大成功',ng:'合成：檢定失敗',fumble:'合成：大失敗',miss:'合成：攻擊落空',whoosh:'合成：揮空、閃開的風聲',groan:'合成：低沉的呻吟',hurt:'合成：一般受傷聲（劇情扣血的預設）',
 craft:'合成：動手做東西',dry:'合成：喀一聲（空槍、換彈的備援）',eat:'合成：吃東西',gulp:'合成：喝水',ext:'合成：滅火器噴出',zap:'合成：觸電',level:'合成：升級',
 // 組合槍聲（v0.67.0，用現有槍聲排成短連射）
 farshot1:'組合：遠處一槍',farshots:'組合：遠處 2～4 槍',farshots2:'組合：遠處兩槍',farshotsglass:'組合：遠處 2～4 槍＋近處玻璃碎',farshots2glass:'組合：遠處兩槍＋近處玻璃碎',
 farshots2glassfar:'組合：遠處兩槍＋遠處玻璃碎',streetshots3glassfar:'組合：街上三槍＋遠處玻璃碎',shot1:'組合：近處一槍',shotsglass:'組合：近處 3～4 槍＋玻璃碎',farmp5:'組合：遠處衝鋒槍',farrifle:'組合：遠處獵槍',
 // 弓箭（sfx 裡特別處理）
 bowhit:'弓：拉弓＋命中',bowmiss:'弓：拉弓、沒中',arrowhit:'弓箭攻擊命中',arrowmiss:'弓箭攻擊沒中',xbowhit:'十字弓攻擊命中',xbowmiss:'十字弓攻擊沒中'};
const SPECIAL=['bowhit','bowmiss','arrowhit','arrowmiss','xbowhit','xbowmiss'];
// 人工觀察：瀏覽器測試（tests/browser-audio.cjs、tests/qte-browser.cjs）量到的、交接文件記的。只列，不改。
const MANUAL=[
 ['頭尾空白','開頭空白超過 0.3 秒：revolverCock 約 0.63 秒、firealarm 約 1.0 秒、woodknock 檔案開頭約 0.85 秒靜音（v0.71.2 起播放時從 0.85 秒處開始，不改檔案；瀏覽器實測曾記約 0.56 秒，v0.67.1）；結尾空白超過 0.5 秒：zipper、revolverCock、revolver、mp5、firealarm（瀏覽器實測，v0.67.1）。交接文件另記：無線電台詞每句開頭約 0.6 秒安靜、piercehit 尾端 0.47 秒'],
 ['發電機淡入','genstart 前 1 秒低於 −50 dBFS（淡入），按下去一秒後才聽得到'],
 ['同一下播兩次','戰鬥 QTE（撲倒、飛撲）躲開時，QTE 本身播一次閃開聲（whoosh），qteHit 又播一次，兩聲疊在一起（瀏覽器實測）'],
 ['待主人試聽','合成音「失敗、大失敗、落空」（ng、fumble、miss）與強光照射用 click：交接文件記「等主人試聽再調」'],
 ['iOS','iOS Safari 循環音（雨聲、發電機、抽水機）接縫：沒有測（這裡沒有 iOS 瀏覽器）']];
function build(root){
 root=path.resolve(root||path.join(__dirname,'../..'));const A=scan(root);const g=load(path.join(root,'index.html'));
 const SF=g.run('SFILES.slice()'),SYN=g.run('Object.keys(SYN)'),SCUE=g.run('Object.keys(SCUE)'),FALL=g.run('JSON.parse(JSON.stringify(FALL))');
 const kind=k=>SF.includes(k)||k==='crossbowshot'?'音效檔':SYN.includes(k)?'合成音':SCUE.includes(k)?'組合槍聲':'弓箭';
 const all=[...new Set([...SF,'crossbowshot',...SYN,...SCUE,...SPECIAL])];
 const R={root,names:all.length,unreviewed:all.filter(k=>!DESC[k]),stale:Object.keys(DESC).filter(k=>!all.includes(k)),rows:[],gaps:{}};
 // 用在哪裡：素材掃描找到的＋環境音＋FALL 備援
 // 程式裡直接寫出名稱的地方（環境音 ambientSpec、movementSound 這類回傳名稱的函式）：拿掉音效表本身的宣告再找
 const bare=g.script.replace(/const (SFILES|SFX_TYPES|SFX_TRIM|SFX_OFFSET|FALL|SYN|SCUE)=[\s\S]*?\n(?=const |function |let |\/\*|\/\/)/g,'').replace(/[=!]==\s*['"]\w+['"]/g,'');/* 比較式（k==='bowhit'）是 sfx() 自己的分支，不算用到 */
 for(const k of all){const w=[...(A.used[k]||[])];if(!w.length&&new RegExp("['\"]"+k+"['\"]").test(bare))w.push('程式裡直接寫到（環境音、回傳名稱的函式等）');
  const fb=Object.entries(FALL).filter(([a,b])=>b===k).map(([a])=>a);if(fb.length)w.push('備援：'+fb.join('、'));
  R.rows.push({k,kind:kind(k),cat:g.run(`SFX_CATEGORY[${JSON.stringify(k)}]||''`),desc:DESC[k]||'（沒有說明）',fall:FALL[k]||null,where:w})}
 // 缺口
 const G=R.gaps;
 G.unused=R.rows.filter(r=>!r.where.length).map(r=>r.k);
 const LOOPY=k=>/loop$|^radio|^thunder/.test(k)||['genloop','waterpipe','pumpmix'].includes(k);
 G.noFall=SF.filter(k=>!FALL[k]&&!LOOPY(k));
 G.noFallLoop=SF.filter(k=>!FALL[k]&&LOOPY(k));
 G.haz=g.run(`[...HAZ[1],...HAZ[2]].map(h=>({id:h.id,t:String(h.t).slice(0,24),audio:h.audio||null,okA:h.okA||null,hs:h.hs===undefined?null:h.hs}))`);
 G.hazNoAudio=G.haz.filter(h=>!h.audio).map(h=>h.id);G.hazNoOk=G.haz.filter(h=>!h.okA).map(h=>h.id);G.hazNoHs=G.haz.filter(h=>h.hs===null).map(h=>h.id);
 const MV=g.run(`Object.entries(MOVES).flatMap(([t,ms])=>ms.map(m=>({t,n:m.n,d:m.d||0,hs:m.hs||null,gun:!!m.gun,shot:!!m.shot,flame:!!m.flame,snd:m.snd||null})))`);
 G.moveNoHs=MV.filter(m=>m.d>0&&!m.hs&&!m.gun&&!m.shot&&!m.flame).map(m=>m.t+'／'+m.n);
 G.gunNoSnd=MV.filter(m=>m.gun&&!m.snd&&!m.shot).map(m=>m.t+'／'+m.n);
 G.moves=MV.length;
 // 劇情結果：扣血卻沒標受傷聲
 G.storyHp=g.run(`(()=>{let n=0;const miss=[],seen=new Set();const walk=(o,p,d)=>{if(!o||typeof o!=='object'||seen.has(o)||d>9)return;seen.add(o);
  if(o.p&&typeof o.p.hp==='number'&&o.p.hp<0){n++;if(o.hs===undefined&&miss.length<200)miss.push(p)}
  for(const k of Object.keys(o)){let v;try{v=o[k]}catch(e){continue}if(v&&typeof v==='object')walk(v,p+'/'+k,d+1)}};
  for(const [id,nd] of Object.entries(N))walk(nd,id,0);for(const e of EVPOOL)walk(e,'ev:'+e.id,0);return {n,miss}})()`);
 G.files=A.unused.filter(f=>/^sfx\//.test(f));
 R.manual=MANUAL;R.version=(g.html.match(/ZC_VER=(\{[^}]*\})/)||[])[1]||null;
 R.ok=!R.unreviewed.length&&!R.stale.length;
 return R}
function md(R){const v=R.version?JSON.parse(R.version):{};const G=R.gaps,L=[];const j=a=>a.length?a.join('、'):'（沒有）';
 L.push('# 零號病例 音效對應表（待主人審查）','',`遊戲版本 v${v.v||'?'}／Build ${v.b||'?'}。這份由 \`node tests/helpers/sfx-map.cjs --md docs/audio/SFX_MAP.md\` 產生（QA 升級 PR-D：QA-16）。`,
  '「聽起來是什麼」是 Claude 依檔名和遊戲裡的用法整理的，**還沒經過主人審查**。這次**只列缺口，沒有換任何音效**。','');
 L.push('## 一、缺口（等主人決定）','');
 L.push(`- **隨機意外**（${G.haz.length} 種）：發生當下沒有聲音 ${G.hazNoAudio.length} 種：${j(G.hazNoAudio)}；躲開時沒有聲音 ${G.hazNoOk.length} 種：${j(G.hazNoOk)}；受傷聲沒標：${j(G.hazNoHs)}`);
 L.push(`- **敵人招式**（${G.moves} 招）：有傷害、沒標受傷聲（播預設 claw）：${j(G.moveNoHs)}；開槍卻沒有槍聲：${j(G.gunNoSnd)}`);
 L.push(`- **劇情扣血**：${G.storyHp.n} 筆扣血結果，沒標受傷聲（播預設 hurt）的 ${G.storyHp.miss.length} 筆${G.storyHp.miss.length?'：'+G.storyHp.miss.slice(0,20).join('、'):''}`);
 L.push(`- **沒有備援的音效檔**（檔案載入失敗時這一下沒有聲音）：短音效 ${G.noFall.length} 個：${j(G.noFall)}；循環、無線電、雷聲 ${G.noFallLoop.length} 個（設計上沒有備援，持續聲會暫停）：${j(G.noFallLoop)}`);
 L.push(`- **播得出來、但遊戲沒有用到的名稱**：${j(G.unused)}`);
 L.push(`- **素材資料夾裡有、沒有被引用的音檔**（${G.files.length} 個）：${j(G.files.map(f=>f.replace(/^sfx\//,'')))}`);
 for(const [k,t] of R.manual)L.push(`- **${k}**：${t}`);
 L.push('','## 二、隨機意外的聲音','','| 意外 | 描述 | 發生時 | 躲開 | 受傷 |','|---|---|---|---|---|');
 for(const h of G.haz)L.push(`| ${h.id} | ${h.t}… | ${h.audio||'—'} | ${h.okA||'—'} | ${h.hs===null?'（沒標）':h.hs===''?'（事件音效就是這一下）':h.hs} |`);
 L.push('',`## 三、全部音效名稱（${R.names} 個）`,'','| 名稱 | 種類 | 分類 | 聽起來是什麼 | 載入失敗的備援 | 用在哪裡 |','|---|---|---|---|---|---|');
 for(const r of R.rows)L.push(`| ${r.k} | ${r.kind} | ${r.cat||'—'} | ${r.desc} | ${r.fall||'—'} | ${r.where.length?r.where.slice(0,4).join('；').replace(/\|/g,'／')+(r.where.length>4?`；…共 ${r.where.length} 處`:''):'（沒有用到）'} |`);
 return L.join('\n')+'\n'}
if(require.main===module){const a=process.argv.slice(2);const i=a.indexOf('--md');const R=build(a.find((x,k)=>!x.startsWith('--')&&a[k-1]!=='--md'));
 console.log(`音效對應表：${R.names} 個名稱；沒寫說明 ${R.unreviewed.length}：${R.unreviewed.join('、')||'（沒有）'}；表裡多出來的 ${R.stale.length}：${R.stale.join('、')||'（沒有）'}`);
 const G=R.gaps;console.log(`缺口（只列）：意外沒聲音 ${G.hazNoAudio.length}、意外躲開沒聲音 ${G.hazNoOk.length}、招式沒標受傷聲 ${G.moveNoHs.length}、開槍沒槍聲 ${G.gunNoSnd.length}、劇情扣血沒標 ${G.storyHp.miss.length}／${G.storyHp.n}、沒有備援 ${G.noFall.length}、沒用到 ${G.unused.length}、沒引用的音檔 ${G.files.length}`);
 if(i>=0)fs.writeFileSync(a[i+1],md(R));if(process.env.QA_DETAIL)fs.writeFileSync(process.env.QA_DETAIL,JSON.stringify(R,null,1));process.exit(R.ok?0:1)}
module.exports={build,md,DESC,MANUAL};
