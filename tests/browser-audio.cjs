// 真實瀏覽器音訊（Claude 2026-11-25，QA 升級 PR-D：QA-17）
// 其他瀏覽器測試一律關掉音效、配樂（snd:0、bgm:0），Node 測試用的是假的 AudioContext，所以「真的瀏覽器裡到底有沒有聲音」一直沒人測。
// 這支開真的 Chromium（允許自動播放），照玩家的方式點進遊戲（音效、配樂都開），在測試頁的 Web Audio 輸出端接一個分析器（AnalyserNode）量實際的波形：
//   A01 音效表 SFILES 每個檔案都在瀏覽器裡解碼成功（沒有被換成備援），十字弓 crossbowshot.wav 也是；每個檔案長度 > 0、不是無聲檔
//       （順便量頭尾空白，超過 0.3／0.5 秒的只記錄）
//   A02 備用格式也解碼得了：配樂三軌的 .ogg 和 .mp3、genloop／雨聲的 .mp3（瀏覽器不支援 ogg 時用）
//   A03 遊戲用得到的每一個音效名稱（音效檔、合成音 SYN、組合槍聲 SCUE、弓箭特別名稱）叫一次 sfx()：回傳長度 > 0、輸出端量得到聲音
//       （量到超過 −54 dBFS 就換下一個，heardDb 是「聽到的那一刻」的值，不是整段的最大音量）
//   A04 把音效關掉（設定的音效：關）之後 sfx() 回傳 0、輸出端沒有聲音、沒有新的聲音節點
//   A05 配樂真的在播：探索時探索配樂在播、時間在走；開戰後戰鬥配樂在播、探索配樂停下；打完回到探索配樂、戰鬥配樂停下歸零
//   A06 切到背景（分頁被蓋住）：配樂全部暫停、短音效停掉、sfx() 不出聲；切回來探索配樂接著播
//   A07 沒有程式錯誤、必要檔案都載入成功、沒有「[ZeroCase audio]」載入或播放失敗的警告
// 只在測試頁接分析器、包裝 AudioNode.connect，遊戲本體不動。量到的數字存在細節檔（test-results/browser-audio.json）。
// 跑法：node tests/browser-audio.cjs（需要 http.server 8768 或 QA_SERVE=route）
const {chromium}=require('playwright');const BE=require('./helpers/browser-errors.cjs');const DR=require('./helpers/driver.cjs');const fs=require('node:fs');
const ORIGIN=process.env.QA_ORIGIN||'http://localhost:8768',URL=ORIGIN+'/index.html';
const SEED=DR.seedOf();const detail={seed:SEED,checks:[],notes:[]};console.log(`種子 ${SEED}（重現：QA_SEED=${SEED}）`);
const writeDetail=()=>{if(process.env.QA_DETAIL)fs.mkdirSync(require('node:path').dirname(process.env.QA_DETAIL),{recursive:true});detail.failed=detail.checks.filter(c=>!c.ok).map(c=>c.name+(c.note?'：'+c.note:''));if(process.env.QA_DETAIL)fs.writeFileSync(process.env.QA_DETAIL,JSON.stringify(detail,null,1))};
const SILENT=.001;// −60 dBFS 以下當成沒有聲音
// 測試頁：接到 destination 的節點另外接一份到分析器；每 15 毫秒讀一次波形，記下最大值
const TAP=()=>{const oc=AudioNode.prototype.connect;window.__qaPeak=0;window.__qaStarts=0;
 AudioNode.prototype.connect=function(dst){const r=oc.apply(this,arguments);
  try{if(dst instanceof AudioDestinationNode&&!this.__qaTap){this.__qaTap=1;const c=this.context;
   if(!c.__qaAn){const an=c.createAnalyser();an.fftSize=2048;const z=c.createGain();z.gain.value=0;oc.call(an,z);oc.call(z,c.destination);c.__qaAn=an;window.__qaCtx=c;
    const buf=new Float32Array(an.fftSize);setInterval(()=>{an.getFloatTimeDomainData(buf);let m=0;for(let i=0;i<buf.length;i++){const v=Math.abs(buf[i]);if(v>m)m=v}if(m>window.__qaPeak)window.__qaPeak=m},15)}
   oc.call(this,c.__qaAn)}}catch(e){}return r};
 for(const C of [AudioBufferSourceNode,OscillatorNode]){const s=C.prototype.start;C.prototype.start=function(){window.__qaStarts++;return s.apply(this,arguments)}}};
(async()=>{const b=await chromium.launch({args:['--autoplay-policy=no-user-gesture-required']});let fail=0;
 const say=(ok,n,x)=>{if(!ok)fail++;detail.checks.push({ok,name:n,note:x||''});console.log((ok?'通過':'失敗')+'　'+n+(x?'　'+x:''))};
 const ctx=await b.newContext({viewport:{width:1280,height:720}});await ctx.addInitScript(DR.seedScript,SEED);await ctx.addInitScript(TAP);await BE.serve(ctx,ORIGIN,__dirname+'/..');
 const p=await ctx.newPage();const rec=BE.watch(p,ORIGIN);const warn=[];p.on('console',m=>{if(/ZeroCase audio/.test(m.text()))warn.push(m.type()+'：'+m.text().slice(0,200))});
 try{
  await p.goto(URL);
  await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:1,bgm:1,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});
  await p.reload();await p.click('#gateNo');/* 和玩家一樣按「開始」：建立 AudioContext、開始配樂、載入音效 */
  const ld=await p.evaluate(async()=>{const t=performance.now();await loadSounds();await loadArrowSound();return {ms:Math.round(performance.now()-t),st:soundStatus(),files:SFILES.length,ac:AC&&AC.state,sr:AC&&AC.sampleRate}});
  detail.load=ld;
  // A01 每個檔案：長度、峰值、頭尾空白
  const fa=await p.evaluate(TH=>{const o={};for(const [k,B] of Object.entries(BUF)){let pk=0,first=-1,last=-1;for(let c=0;c<B.numberOfChannels;c++){const d=B.getChannelData(c);for(let i=0;i<d.length;i++){const v=Math.abs(d[i]);if(v>pk)pk=v;if(v>TH){if(first<0||i<first)first=i;if(i>last)last=i}}}
   o[k]={dur:+B.duration.toFixed(3),peakDb:pk>0?+(20*Math.log10(pk)).toFixed(1):-999,lead:first<0?null:+(first/B.sampleRate).toFixed(3),tail:last<0?null:+(B.duration-last/B.sampleRate).toFixed(3)}}return o},SILENT);
  detail.files=fa;const names=Object.keys(fa);
  const bad1=names.filter(k=>!(fa[k].dur>0)||fa[k].peakDb<=20*Math.log10(SILENT));
  const want=[...await p.evaluate(()=>SFILES.slice()),'crossbowshot'],miss=want.filter(k=>!fa[k]);
  say(ld.ac==='running'&&!ld.st.failed.length&&!miss.length&&!bad1.length,`A01 音效檔在瀏覽器裡全部解碼成功（${want.length} 個），長度 > 0、不是無聲檔`,
   [ld.ac!=='running'?'AudioContext '+ld.ac:'',ld.st.failed.length?'載入失敗 '+ld.st.failed.join('、'):'',miss.length?'沒有解碼結果 '+miss.join('、'):'',bad1.length?'無聲或長度 0：'+bad1.join('、'):''].filter(Boolean).join('；')||`載入 ${ld.ms} 毫秒、取樣率 ${ld.sr}`);
  const lead=names.filter(k=>fa[k].lead>.3).map(k=>`${k} 開頭 ${fa[k].lead} 秒`),tail=names.filter(k=>fa[k].tail>.5&&!/loop|bgm/.test(k)).map(k=>`${k} 結尾 ${fa[k].tail} 秒`);
  if(lead.length||tail.length){detail.notes.push('頭尾空白（只記錄）：'+[...lead,...tail].join('、'));console.log('　只記錄：頭尾空白 '+[...lead,...tail].join('、'))}
  // A02 備用格式
  const alt=await p.evaluate(async()=>{const st=[];for(const a of Object.values(BGM_MIX.tracks)){const m=String(a.src).match(/sfx\/(\w+)\./);if(m)st.push(m[1])}
   const list=[...st.flatMap(s=>['sfx/'+s+'.ogg','sfx/'+s+'.mp3']),...SFILES.filter(n=>n==='genloop'||n.startsWith('rain_')).map(n=>'sfx/'+n+'.mp3')];const o={};
   for(const u of list){try{const r=await fetch(u);if(!r.ok)throw Error('HTTP '+r.status);const B=await AC.decodeAudioData(await r.arrayBuffer());o[u]=+B.duration.toFixed(2)}catch(e){o[u]='失敗 '+e.message}}return o});
  detail.altFormats=alt;const bad2=Object.entries(alt).filter(([u,d])=>!(d>0));
  say(Object.keys(alt).length>=9&&!bad2.length,`A02 備用格式也解碼得了：配樂三軌 .ogg／.mp3、持續聲的 .mp3（${Object.keys(alt).length} 個）`,bad2.map(([u,d])=>u+' '+d).join('；'));
  // A03 每一個音效名稱真的出聲（在選單畫面、還沒開局，不會被環境音蓋到）
  const all=await p.evaluate(()=>{const sp=['bowhit','bowmiss','arrowhit','arrowmiss','xbowhit','xbowmiss'];return [...new Set([...SFILES,'crossbowshot',...Object.keys(SYN),...Object.keys(SCUE),...sp])]});
  const pl=await p.evaluate(async({all,TH})=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const o={};
   for(const k of all){stopSfx();if(typeof stopAmbience==='function')stopAmbience();await sl(70);const quiet=window.__qaPeak;window.__qaPeak=0;await sl(30);const base=window.__qaPeak;window.__qaPeak=0;
    let ms=0,err=null;try{ms=sfx(k,1)||0}catch(e){err=String(e)}
    /* 等到量得到聲音就換下一個；最多等這個聲音的長度＋0.15 秒（上限 2.6 秒，開頭有一段淡入的 genstart 也量得到） */
    const win=Math.min(2600,Math.max(250,ms+150));for(let t=0;t<win&&window.__qaPeak<=TH*2;t+=30)await sl(30);
    o[k]={ms:Math.round(ms),heardDb:window.__qaPeak>0?+(20*Math.log10(window.__qaPeak)).toFixed(1):-999,base:+base.toFixed(4),err}}
   stopSfx();return o},{all,TH:SILENT});
  detail.playback=pl;const quietDb=20*Math.log10(SILENT);
  const bad3=Object.entries(pl).filter(([k,r])=>r.err||!(r.ms>0)||r.heardDb<=quietDb).map(([k,r])=>`${k}（${r.err?'錯誤 '+r.err:r.ms>0?'量到 '+r.heardDb+' dBFS':'回傳 0'}）`);
  say(!bad3.length&&all.length>=80,`A03 每一個音效名稱（${all.length} 個）叫 sfx() 都有回傳長度、輸出端量得到聲音`,bad3.slice(0,8).join('、'));
  // A04 音效關掉
  const off=await p.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));setSoundEnabled(false);await sl(120);window.__qaPeak=0;const s0=window.__qaStarts;
   const r=['click','whoosh','beretta','farshots','glassbreak'].map(k=>sfx(k,1));await sl(400);const o={ret:r,peak:window.__qaPeak,starts:window.__qaStarts-s0};setSoundEnabled(true);await sl(100);return o});
  say(off.ret.every(x=>!x)&&off.peak<SILENT&&off.starts===0,'A04 音效關掉之後：sfx() 回傳 0、輸出端沒有聲音、沒有新的聲音節點',JSON.stringify(off));
  // A05 配樂：開局探索 → 開戰 → 打完
  const tap=s=>p.click(s);
  await tap('[data-cat="story"]');await tap('[data-rsel="maggie"]');await tap('[data-m="rpick"]');await tap('[data-m="cdone"]');await tap('[data-m="solo"]');
  const d=await p.$('[data-dif="normal"]');if(d)await d.click();await tap('[data-m="go"]');
  await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node'&&!busy&&!G.busy,null,{timeout:30000});
  const M=async()=>p.evaluate(async()=>{const T=BGM_MIX.tracks,s=()=>Object.fromEntries(Object.entries(T).map(([k,a])=>[k,{p:a.paused,t:a.currentTime,v:+a.volume.toFixed(2),rs:a.readyState,src:String(a.src).split('/').pop(),f:!!a.zcFailed}]));
   const a=s();await new Promise(r=>setTimeout(r,1200));const z=s();for(const k of Object.keys(z))z[k].adv=+(z[k].t-a[k].t).toFixed(2);return {mode:BGM_MIX.mode,tr:z}});
  const playing=(m,k)=>{const x=m.tr[k];return !x.p&&x.adv>=.6&&x.v>0&&x.rs>=2&&!x.f};
  const m1=await M();
  const fightStart=await p.evaluate(()=>{for(const q of G.players){q.hp=q.max}G.alarm=0;void startFight({n:1,types:['infected'],noMut:1,noElite:1});return 1});
  await p.waitForFunction(()=>!!G.fight,null,{timeout:15000});await p.waitForTimeout(600);
  const m2=await M();
  for(let i=0;i<80;i++){const k=await p.evaluate(()=>{if(!G.fight)return 'done';for(const f of G.fight.foes)if(!f.dead){f.hp=Math.min(f.hp,1);f.def=0}for(const q of G.players)q.hp=q.max;if(busy)return 'wait';
    const t=document.querySelector('#choices [data-ftab="atk"]')||document.querySelector('#choices button[data-fa="atk"]:not([disabled])')||document.querySelector('#choices button[data-tgt]');if(t){t.click();return 'click'}return 'wait'});if(k==='done')break;await p.waitForTimeout(250)}
  await p.waitForFunction(()=>!G.fight&&G.phase==='node'&&!busy&&!G.busy,null,{timeout:20000}).catch(()=>{});await p.waitForTimeout(1600);
  const m3=await M();detail.bgm={explore:m1,fight:m2,after:m3,fightStart};
  const ok5=m1.mode==='explore'&&playing(m1,'explore')&&['battle','intense'].includes(m2.mode)&&playing(m2,m2.mode)&&m2.tr.explore.p&&m3.mode==='explore'&&playing(m3,'explore')&&m3.tr.battle.p&&m3.tr.intense.p&&m3.tr.battle.t===0;
  say(ok5,'A05 配樂真的在播：探索配樂在播、時間在走；開戰換戰鬥配樂、探索停下；打完回到探索配樂，戰鬥配樂停下歸零',
   `探索 ${m1.mode}（${m1.tr.explore.src} 走了 ${m1.tr.explore.adv} 秒）→ 戰鬥 ${m2.mode}（${m2.mode&&m2.tr[m2.mode]?m2.tr[m2.mode].src+' 走了 '+m2.tr[m2.mode].adv+' 秒':'—'}、探索${m2.tr.explore.p?'停':'沒停'}）→ 打完 ${m3.mode}（探索走了 ${m3.tr.explore.adv} 秒、戰鬥${m3.tr.battle.p?'停':'沒停'}在 ${m3.tr.battle.t.toFixed(2)} 秒）`);
  // A06 切到背景再切回來
  const vis=await p.evaluate(async()=>{const sl=ms=>new Promise(r=>setTimeout(r,ms));const T=BGM_MIX.tracks;let hid=true;
   Object.defineProperty(document,'hidden',{configurable:true,get:()=>hid});Object.defineProperty(document,'visibilityState',{configurable:true,get:()=>hid?'hidden':'visible'});
   sfx('genloop',1);await sl(100);document.dispatchEvent(new Event('visibilitychange'));await sl(400);window.__qaPeak=0;const r=sfx('click',1);await sl(300);
   const h={paused:Object.values(T).every(a=>a.paused),active:ACTIVE_SFX.size,ret:r,peak:+window.__qaPeak.toFixed(4)};
   hid=false;document.dispatchEvent(new Event('visibilitychange'));await sl(300);const t0=T.explore.currentTime;await sl(1000);
   const back={mode:BGM_MIX.mode,paused:T.explore.paused,adv:+(T.explore.currentTime-t0).toFixed(2)};delete document.hidden;delete document.visibilityState;return {hidden:h,back}});
  detail.visibility=vis;
  say(vis.hidden.paused&&vis.hidden.active===0&&!vis.hidden.ret&&vis.hidden.peak<SILENT&&vis.back.mode==='explore'&&!vis.back.paused&&vis.back.adv>=.6,'A06 切到背景：配樂全部暫停、短音效停掉、sfx() 不出聲；切回來探索配樂接著播',JSON.stringify(vis));
 }catch(e){say(false,'音訊測試中斷',e.message.split('\n')[0]);detail.shot=await BE.shot(p,'audio-error')}
 say(rec.required.length===0&&!warn.length,'A07 沒有程式錯誤、必要檔案都載入成功、沒有音效載入或播放失敗的警告',[BE.brief(rec),...warn.slice(0,3)].filter(Boolean).join(' | '));
 writeDetail();await b.close();console.log(fail?`失敗 ${fail} 項`:'這個階段的檢查都通過');process.exit(fail?1:0)})().catch(e=>{console.log('音訊測試工具出錯：'+(e&&e.stack||e));writeDetail();process.exit(3)});
