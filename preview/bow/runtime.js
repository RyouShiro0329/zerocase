/* 僅供主人驗收的弓弩預覽；不載入正式 index.html。 */
;(()=>{
 const pause=ms=>new Promise(ok=>setTimeout(ok,ms));
 const atlas=new Image();atlas.src='preview/bow/arrow-12.webp';
 const ready=new Promise((ok,no)=>{atlas.onload=ok;atlas.onerror=()=>no(Error('箭矢圖集載入失敗'))});
 const api=window.ZCBOWPV={ready:false,playing:false,frames:[],events:[],mode:'bow'};
 const sounds={bowdraw:'sfx/bowdraw.mp3',bowimpact:'sfx/bowimpact.mp3',crossbowshot:'preview/bow/crossbow-dry.wav'};
 async function audioReady(){const ac=audio();await ac.resume();for(const [k,path] of Object.entries(sounds))if(!BUF[k]){const bytes=await (await fetch(path)).arrayBuffer();BUF[k]=await ac.decodeAudioData(bytes)}}
 function controls(){const ch=document.getElementById('choices');ch.innerHTML='<p class="note">'+(api.mode==='bow'?'弓':'弩')+'射擊動畫預覽・俐落版・未部署</p><div style="display:flex;gap:8px;flex-wrap:wrap"><button class="btn" id="zc-bow-preview-bow">播放弓射擊</button><button class="btn" id="zc-bow-preview-crossbow">播放弩射擊</button></div><p class="note">箭矢由下往上射入血條；弓放弦疊加乾爽發射聲；弩不播放拉弦。命中改為黑紅刺入碎痕。</p>';ch.querySelector('#zc-bow-preview-bow').onclick=()=>play('bow');ch.querySelector('#zc-bow-preview-crossbow').onclick=()=>play('crossbow')}
 function frameAt(elapsed,durations){let end=0;for(let f=0;f<12;f++){end+=durations[f];if(elapsed<end)return f}return -1}
 async function play(mode){
  if(api.playing||!api.ready)return;api.playing=true;api.mode=mode;api.frames=[];api.events=[];
  try{
   UI.snd=1;await audioReady();stopSfx();stopAmbience();const target=G.fight.foes[0];target.hp=target.max;draw();controls();document.querySelectorAll('#choices button').forEach(e=>e.disabled=true);
   const start=performance.now(),launch=mode==='bow'?1010:100,durations=[25,25,25,25,30,25,20,20,20,20,25,30],impact=launch+durations.slice(0,5).reduce((a,b)=>a+b,0),end=launch+durations.reduce((a,b)=>a+b,0);let hit=false,last=-1;
   api.start=start;api.impact=impact;api.events.push({name:'sound',source:mode==='bow'?'bowdraw':'crossbowshot',at:0});if(mode==='bow'){sfx('bowdraw',1);window.play('crossbowshot',sfxLevel('bowdraw',1),1000,1.01)}else window.play('crossbowshot',sfxLevel('bowdraw',1),1000);window.play('bowimpact',sfxLevel('bowimpact',1),2000,mode==='bow'?.91:0);
   await new Promise(resolve=>{function render(){
    const elapsed=performance.now()-start;
    if(!hit&&elapsed>=impact){hit=true;target.hp-=6;draw();controls();document.querySelectorAll('#choices button').forEach(e=>e.disabled=true);api.events.push({name:'hit',at:elapsed})}
    const card=document.querySelector('#foes .foe[data-id="0"]');
    if(elapsed>=end||!card||document.hidden){card?.querySelector('.zc-bow-preview-canvas')?.remove();resolve();return}
    let canvas=card.querySelector('.zc-bow-preview-canvas');if(!canvas){canvas=document.createElement('canvas');canvas.className='zc-bow-preview-canvas';canvas.style='position:absolute;inset:0;width:100%;height:100%;pointer-events:none;z-index:10';card.append(canvas)}
    const w=card.clientWidth,h=card.clientHeight,d=Math.min(devicePixelRatio||1,2);canvas.width=w*d;canvas.height=h*d;const ctx=canvas.getContext('2d');ctx.setTransform(d,0,0,d,0,0);
    const fin=card.querySelector('.fin'),hp=card.querySelector('.fhp .hpb');let cx=hp.offsetWidth*.52,cy=hp.offsetHeight/2;for(let e=hp;e&&e!==card;e=e.offsetParent){cx+=e.offsetLeft;cy+=e.offsetTop}
    ctx.beginPath();ctx.rect(fin.offsetLeft,0,fin.clientWidth,h);ctx.clip();
    const reduced=matchMedia('(prefers-reduced-motion:reduce)').matches,f=elapsed<launch?-1:reduced?(elapsed>=impact?5:-1):frameAt(elapsed-launch,durations),size=Math.min(h*1.55,fin.clientWidth*1.10);
    if(f>=0){ctx.drawImage(atlas,f%4*362,Math.floor(f/4)*362,362,362,cx-size*.5,cy+(f<5?[.70,.52,.35,.16,.025][f]*h:0)-size*(f<5?[279,211,161,111,61][f]/362:.235),size,size);if(last!==f){last=f;api.frames.push({f,at:elapsed})}}
    const portrait=card.querySelector('.fpic'),ink=ctx.getImageData(0,0,Math.floor(portrait.offsetWidth*d),canvas.height).data;if(ink.some((v,i)=>i%4===3&&v))api.portraitInk=true;
    requestAnimationFrame(render);
   }render()});
   await pause(Math.max(0,(mode==='bow'?1900:1000)-(performance.now()-start)));
  }finally{api.playing=false;UI.snd=0;controls()}
 }
 api.play=play;
 async function init(){
  UI.snd=0;UI.bgm=0;UI.spd=.3;UI.orient='auto';META.unlocked=[...new Set([...META.unlocked,'maggie'])];boot(false);
  const dismiss=setInterval(()=>{for(const id of ['dice','lvcard','enc']){const e=document.getElementById(id);if(e&&!e.hidden)e.click()}},70);
  for(const sel of ['[data-cat="story"]','[data-rsel="maggie"]','[data-m="rpick"]','[data-m="cdone"]','[data-m="solo"]','[data-m="go"]']){let e;for(let i=0;i<200;i++){e=document.querySelector(sel);if(e)break;await pause(50)}if(!e)throw Error('預覽開局失敗');e.click();await pause(100)}
  for(let i=0;i<400&&(!G||G.phase!=='node'||busy);i++)await pause(50);
  const p=me();p.gear=[];p.hand={R:null,L:null};const g=newGear('compbow');p.gear.push(g);equip(p,g.u,'R');startFight({n:2,types:['infected'],noMut:1,mode:'first'});
  for(let i=0;i<600&&(!G?.fight||!myTurn()||busy||G.busy);i++)await pause(50);
  clearTimeout(cdT);clearInterval(dismiss);for(const f of G.fight.foes){f.hp=f.max=30;f.aff=null;f.stun=99}UI.partyCards=0;draw();await ready;api.ready=true;controls();
 }
 init().catch(e=>{api.error=e.message;document.getElementById('choices').textContent='預覽載入失敗：'+e.message});
})();
