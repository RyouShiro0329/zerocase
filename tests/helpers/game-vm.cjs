// 在 Node 的 vm 裡載入整份遊戲（Claude 2026-11-25，QA 升級 PR-C）
// 和 tests/helpers/audio-game.cjs 同一種做法，差別是可以指定 index.html 的路徑（自我驗收要拿暫存複本來測），
// 並提供 globals()：列出遊戲最外層宣告的名稱（const／let／function），讓檢查工具可以把資料表整個走一遍。
// 只讀遊戲、不改遊戲：網路連線換成已完成的 Promise、畫面函式換成空函式。
const vm=require('node:vm'),fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
function scriptOf(html){const m=html.match(/<script>([\s\S]*?)<\/script>/);if(!m)throw new Error('index.html 裡找不到 <script>');return m[1]}
function load(htmlPath=path.join(ROOT,'index.html')){
 const html=fs.readFileSync(htmlPath,'utf8');
 const param=()=>({value:0,setValueAtTime(){},linearRampToValueAtTime(){},exponentialRampToValueAtTime(){}});
 const output=()=>({connect(){},disconnect(){}});
 class Context{constructor(){this.currentTime=0;this.sampleRate=1000;this.state='running';this.destination={}}resume(){return Promise.resolve()}createBuffer(){return {duration:.1,getChannelData:()=>new Float32Array(1000)}}createGain(){return {...output(),gain:param()}}createDynamicsCompressor(){return {...output(),threshold:param(),knee:param(),ratio:param(),attack:param(),release:param()}}createBufferSource(){return {...output(),start(){},stop(){}}}createOscillator(){const o=this.createBufferSource();o.frequency=param();return o}createBiquadFilter(){return {...output(),type:'',frequency:param(),Q:param()}}decodeAudioData(ab,ok){ok({duration:.2})}}
 const node={addEventListener(){},classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}},appendChild(){},querySelector(){return null}};
 const c=vm.createContext({console:{...console,warn(){},log(){}},matchMedia:()=>({matches:false}),setTimeout:(f,t)=>{const x=setTimeout(f,t);x.unref();return x},clearTimeout,setInterval:()=>0,clearInterval,Date,Math,Promise,
  Audio:class{canPlayType(){return ''}play(){return Promise.resolve()}pause(){}},location:{protocol:'https:'},localStorage:{getItem(){return null},setItem(){},removeItem(){}},
  window:{AudioContext:Context,addEventListener(){}},document:{hidden:false,querySelector:s=>s==='#log'?null:node,querySelectorAll:()=>[],addEventListener(){},createElement:()=>({...node})},
  fetch:async()=>({ok:true,arrayBuffer:async()=>new ArrayBuffer(1)})});
 let s=scriptOf(html).replace(/let netReady=\(async\(\)=>\{[\s\S]*?\}\)\(\);/,'let netReady=Promise.resolve();').replace(/\nlayout\(\);\s*$/,'');
 s=s.replace('const wait=ms=>new Promise(r=>setTimeout(r,ms));','const wait=ms=>Promise.resolve();');
 vm.runInContext(s,c);
 vm.runInContext("UI.snd=0;UI.bgm=0;ROLE='solo';MYPID='p1';G={rid:'qa-vm',players:[],flags:{},node:'A1',lv:'A',ev:null,opts:{diff:'normal'},ground:[],seq:0,hzDone:{}};draw=()=>{};flush=async()=>{};",c);
 const run=x=>vm.runInContext(x,c);
 // 最外層宣告（行首的 const／let／var／function／async function）
 const globals=()=>[...new Set([...s.matchAll(/^(?:const|let|var|(?:async\s+)?function\*?)\s+([A-Za-z_$][\w$]*)/gm)].map(m=>m[1]))];
 return {c,run,html,script:s,globals};
}
module.exports={load,ROOT};
