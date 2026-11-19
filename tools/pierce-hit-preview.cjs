// 獨立美術驗收：只在測試頁記憶體替換素材、時點及畫布落點，不寫回遊戲正本。
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {execFileSync}=require('node:child_process');
const OUT='qa-output/pierce-stop-preview',URL='http://localhost:8768/index.html';
const report={previewOnly:true,base:'ff72fe3068dee1e642b29809a09af11569170679',checks:[],errors:[],phone:'待主人實機驗收',scope:'單次攻擊受控展示；未部署、未修改index.html，不含後續敵方回合'};
function check(name,result){report.checks.push({name,result:result?'通過':'失敗'});assert.ok(result,name)}
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch();
 try{
  for(const [width,height] of [[393,690],[844,390],[1280,720]]){
   const tag=width+'x'+height,record=width===844;
   const options={viewport:{width,height},deviceScaleFactor:1,hasTouch:width<1000};
   if(width<1000)options.userAgent='Mozilla/5.0 (Linux; Android 13) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/133.0.0.0 Mobile Safari/537.36';
   if(record)options.recordVideo={dir:OUT+'/video',size:{width,height}};
   const ctx=await browser.newContext(options),videoStart=Date.now(),p=await ctx.newPage();
   p.on('pageerror',e=>report.errors.push(tag+': '+e.message));
   p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(tag+': '+m.text())});
   await p.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const el=document.querySelector(s);if(el&&!el.hidden)el.click()}},60)});
   await p.goto(URL);await p.click('#gateNo');await p.click('[data-cat="custom"]');await p.fill('#cname','攻擊預覽');
   await p.click('[data-ctab="tal"]');await p.click('[data-tal="keen"]');await p.click('[data-ctab="sk"]');await p.click('[data-csk="aid"]');
   await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
   await p.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:30000});
   await p.evaluate(()=>{const p=me();p.st={STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0};p.gear=[];p.hand={R:null,L:null};const w=newGear('icepick');p.gear.push(w);equip(p,w.u,'R');window.__previewEncounter=startFight({n:2,types:['infected'],noMut:1,mode:'first'})});
   await p.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
   await p.evaluate(async()=>{
    window.__originalFeedback=[fltScan.toString(),fltRun.toString(),hpSet.toString(),hpRun.toString()];
    const image=new Image();await new Promise((resolve,reject)=>{image.onload=resolve;image.onerror=()=>reject(new Error('新版預覽素材載入失敗'));image.src='tools/preview/pierce-stop-v5.webp'});
    PIERCE_VFX.image=image;PIERCE_VFX.ready=Promise.resolve(image);
    PIERCE_TIMING.frames=[40,30,25,25,60,50,35,30,35,40,40,40];PIERCE_TIMING.total=450;PIERCE_TIMING.impact=95;
    window.__previewFrames=[];
    renderPierceVfx=function(fx){
     if(PIERCE_VFX.active!==fx)return;
     const elapsed=performance.now()-fx.t;
     if(elapsed>=PIERCE_TIMING.total||document.hidden||!G||G.rid!==fx.rid||G.fight!==fx.battle){clearPierceVfx();return}
     const card=document.querySelector('#foes .foe[data-id="'+fx.id+'"]');
     if(card){let c=card.querySelector('.zc-pierce-fx');if(!c){c=document.createElement('canvas');c.className='zc-pierce-fx';c.setAttribute('aria-hidden','true');card.appendChild(c)}
      const w=card.clientWidth,h=card.clientHeight,d=Math.min(devicePixelRatio||1,2);c.width=Math.round(w*d);c.height=Math.round(h*d);
      const bar=card.querySelector('.fhp .hpb');let hitX=bar.offsetWidth/2,hitY=bar.offsetHeight/2;
      for(let n=bar;n&&n!==card;n=n.offsetParent){hitX+=n.offsetLeft;hitY+=n.offsetTop}
      const ctx=c.getContext('2d'),f=pierceFrame(elapsed),dh=h*1.75,dw=dh*264/450;
      ctx.setTransform(d,0,0,d,0,0);ctx.clearRect(0,0,w,h);
      if(f>=0)ctx.drawImage(image,f%4*264,Math.floor(f/4)*450,264,450,hitX-dw/2,hitY-dh/3,dw,dh);
      __previewFrames.push({at:elapsed,frame:f,target:fx.id,hitX,hitY,barX:hitX,barY:hitY,portraitWidth:card.querySelector('.fpic').clientWidth});
     }
     fx.raf=requestAnimationFrame(()=>renderPierceVfx(fx));
    };
    for(const f of G.fight.foes){f.hp=f.max=20;f.aff=null;f.stun=0}
    r2=()=>({a:15,b:15,s:15});Math.random=()=>.65;UI.snd=0;draw();
   });
   check(tag+' 原扣血與傷害浮字函式未變更',await p.evaluate(()=>JSON.stringify(__originalFeedback)===JSON.stringify([fltScan.toString(),fltRun.toString(),hpSet.toString(),hpRun.toString()])));
   await p.screenshot({path:OUT+'/before-'+tag+'.png'});
   await p.evaluate(()=>{busy=true;draw();window.__previewAttack=attack(me(),'R',null,0).finally(()=>{busy=false;draw()})});
   await p.waitForFunction(()=>!!PIERCE_VFX.active,null,{timeout:30000});
   const effectSec=(Date.now()-videoStart)/1000;
   await p.waitForTimeout(140);
   await p.screenshot({path:OUT+'/impact-'+tag+'.png'});
   check(tag+' 命中時原傷害浮字正常出現',await p.locator('#foes .foe[data-id="0"] .flt.f-dmg').count()>0);
   check(tag+' 命中時血條已下降',await p.evaluate(()=>G.fight.foes[0].hp<20));
   await p.evaluate(()=>__previewAttack);
   check(tag+' 刀光對準血條而非立繪',await p.evaluate(()=>__previewFrames.length>4&&__previewFrames.every(f=>f.hitX>f.portraitWidth&&Math.abs(f.hitX-f.barX)<1&&Math.abs(f.hitY-f.barY)<1)));
   check(tag+' 命中後落點固定直到消散',await p.evaluate(()=>{const hit=__previewFrames.filter(f=>f.at>=95);return hit.length>2&&hit.every(f=>Math.abs(f.hitX-hit[0].hitX)<1&&Math.abs(f.hitY-hit[0].hitY)<1)}));
   check(tag+' 結束沒有殘留畫布或未定義文字',await p.evaluate(()=>!PIERCE_VFX.active&&!document.querySelector('.zc-pierce-fx')&&!/undefined|NaN|\[object/.test(document.querySelector('#app').textContent)));
   await p.waitForTimeout(650);await p.screenshot({path:OUT+'/after-'+tag+'.png'});
   const video=record?p.video():null;await ctx.close();
   if(record){const input=await video.path(),output=OUT+'/attack-844x390.gif';
    execFileSync('ffmpeg',['-y','-ss',Math.max(0,effectSec-.2).toFixed(3),'-t','1.7','-i',input,'-filter_complex','fps=30,split[a][b];[a]palettegen=stats_mode=diff[p];[b][p]paletteuse=dither=bayer:bayer_scale=3','-loop','0',output],{stdio:'pipe'});
    report.animation=output;report.recordedEffectAt=effectSec;
   }
  }
  check('正常流程沒有程式或主控台錯誤',report.errors.length===0);
 }finally{fs.writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
