// 瀏覽器測試的「重現與追蹤」（Claude 2026-11-25，QA 升級 PR-B：QA-04 種子、QA-05 操作紀錄、QA-06 逾時與卡死）
// 冒煙、長路線共用。三件事：
// 1. 種子：QA_SEED（run_all.sh 沒給就自己抽一個，印在報告）。測試頁的 Math.random 和 crypto.getRandomValues
//    換成同一個種子的亂數（只在測試頁注入，遊戲本體不動），所以「選哪個按鈕」和遊戲開局種子 G.sd 都由它決定。
//    測試選按鈕用另一條亂數 __qaRnd（不和遊戲共用）。動畫、計時器的時間差仍可能讓長路線後段分岔，所以叫「盡量重現」；自我驗收 V05 會確認前段完全一樣。
// 2. 操作紀錄：每一步記下所在節點、點了什麼、等了多久、有沒有逾時、畫面有沒有變，存成 test-results/trace-*.json。
// 3. 逾時與卡死：等待逾時不再吞掉，分開計數；點了畫面卻沒變算「無效動作」；
//    連續 QA_STUCK 步（預設 20）畫面都沒變＝卡死 → 失敗並停下，存截圖和最後的畫面文字。
const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const OUT=()=>path.resolve(ROOT,process.env.QA_OUT||'test-results');
function seedOf(){const s=process.env.QA_SEED;if(s!=null&&s!==''&&/^\d+$/.test(s))return (+s)>>>0;return (Math.random()*4294967296)>>>0}
// 注入測試頁（addInitScript 第二個參數是種子）
function seedScript(seed){
 const gen=s=>{let a=s>>>0;return ()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return ((t^(t>>>14))>>>0)/4294967296}};
 const r=gen(seed);Math.random=r;
 // 測試自己「選哪個按鈕」用另一條亂數，不和遊戲畫面、聲音（會隨動畫時間多抽幾次）共用，選擇順序才穩定
 window.__qaRnd=gen((seed^0x9E3779B9)>>>0);
 try{const g=crypto.getRandomValues.bind(crypto);crypto.getRandomValues=function(arr){if(arr&&arr.length!=null&&!(arr instanceof Float32Array||arr instanceof Float64Array)){const max=2**(8*(arr.BYTES_PER_ELEMENT||1));for(let i=0;i<arr.length;i++)arr[i]=Math.floor(r()*max);return arr}return g(arr)}}catch(e){}
 window.__QA_SEED=seed;
}
// 畫面狀態的指紋：有變就代表這一步有作用
const SIG=()=>{const q=s=>document.querySelector(s);const vis=s=>{const e=q(s);return e&&!e.hidden?1:0};const ch=q('#choices');
 return [typeof G!=='undefined'&&G?[G.node,G.stp,G.clock,G.over?1:0,G.fight?[G.fight.round,G.fight.turn,(G.fight.foes||[]).map(f=>f.hp).join('.')].join(':'):0].join('|'):'-',
  typeof LOG!=='undefined'?LOG.length:0,vis('#dice'),vis('#lvcard'),vis('#cfm'),vis('#ov'),ch?ch.textContent.length+':'+ch.textContent.slice(0,40):''].join('#')};
function tracker(name,opt={}){
 const T={name,seed:opt.seed,steps:[],timeouts:0,invalid:0,idle:0,stuck:null,maxSame:0,same:0,waitMs:0};
 const STUCK=+(process.env.QA_STUCK||20);
 T.sig=async p=>{try{return await p.evaluate(SIG)}catch(e){return 'ERR:'+e.message.slice(0,40)}};
 // 等遊戲空下來；逾時要記錄，不吞掉
 T.wait=async(p,ms=+(process.env.QA_WAIT_MS||15000))=>{const t=Date.now();try{await p.waitForFunction(()=>G.over||(!busy&&!G.busy),null,{timeout:ms});return {ms:Date.now()-t,to:false}}catch(e){return {ms:Date.now()-t,to:true}}};
 // 記一步：act＝點了什麼（null＝沒東西可點），before／after＝指紋
 T.rec=(i,where,act,w,before,after)=>{const changed=before!==after;
  if(w.to)T.timeouts++;if(!act)T.idle++;else if(!changed)T.invalid++;
  T.same=changed?0:T.same+1;T.maxSame=Math.max(T.maxSame,T.same);T.waitMs+=w.ms;
  T.steps.push({i,node:where.node,fight:where.fight?1:0,act:act?act.k+(act.l?'：'+act.l:''):'（沒有可點的）',ms:w.ms,...(w.to?{timeout:1}:{}),...(changed?{}:{same:T.same})});
  if(T.same>=STUCK&&!T.stuck)T.stuck={at:i,node:where.node,steps:T.same};
  return !!T.stuck};
 T.summary=()=>({seed:T.seed,gameSeed:T.gameSeed,actions:T.steps.length,valid:T.steps.length-T.invalid-T.idle,invalid:T.invalid,idle:T.idle,timeouts:T.timeouts,maxSame:T.maxSame,stuck:T.stuck,avgWaitMs:T.steps.length?Math.round(T.waitMs/T.steps.length):0});
 T.save=()=>{try{const d=OUT();fs.mkdirSync(d,{recursive:true});const f=path.join(d,'trace-'+name.replace(/[^\w.-]+/g,'_')+'.json');fs.writeFileSync(f,JSON.stringify({...T.summary(),steps:T.steps},null,0).replace(/\},\{/g,'},\n{'));return path.relative(ROOT,f)}catch(e){return null}};
 // 卡死或失敗時：最後畫面上的文字
 T.screen=async p=>{try{return await p.evaluate(()=>{const t=s=>{const e=document.querySelector(s);return e?e.innerText.replace(/\s+/g,' ').slice(0,400):''};return {choices:t('#choices'),log:typeof LOG!=='undefined'?LOG.slice(-5).map(x=>String(x[0]).replace(/<[^>]+>/g,'').slice(0,120)):[],busy:typeof busy!=='undefined'?!!busy:null,gbusy:typeof G!=='undefined'&&G?!!G.busy:null}})}catch(e){return {error:e.message}}};
 return T;
}
// 逾時上限：超過動作數的 QA_TIMEOUT_RATIO（預設 5%）算失敗
const timeoutLimit=n=>Math.max(2,Math.floor(n*+(process.env.QA_TIMEOUT_RATIO||0.05)));
module.exports={seedOf,seedScript,tracker,timeoutLimit};
