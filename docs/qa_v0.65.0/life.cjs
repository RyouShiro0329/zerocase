const {chromium}=require('playwright');const {GOD}=require('/home/claude/zerocase/tests/helpers/godmode.cjs');
(async()=>{const b=await chromium.launch();const ctx=await b.newContext({viewport:{width:844,height:390}});const p=await ctx.newPage();const errs=[];p.on('pageerror',e=>errs.push(e.message));
 await p.goto('http://localhost:8769/index.html');await p.evaluate(()=>{localStorage.clear();localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:1,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))});await p.reload();
 await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
 await p.waitForFunction(()=>typeof G!=='undefined'&&G&&G.phase==='node'&&!busy,null,{timeout:30000});await p.evaluate(GOD);
 const R={};
 // 背景暫停：500ms 時切到背景 2 秒
 await p.evaluate(()=>{window.__t0=performance.now();window.__H=false;Object.defineProperty(document,'hidden',{configurable:true,get:()=>window.__H});run(()=>startFight({n:1,mode:'normal',names:['感染者']}))});
 await p.waitForTimeout(500);await p.evaluate(()=>{__H=true;document.dispatchEvent(new Event('visibilitychange'))});await p.waitForTimeout(2000);
 R.pausedState=await p.evaluate(()=>({stg:!!G.stg,el:G.stg&&stgEl(G.stg)}));
 await p.evaluate(()=>{__H=false;document.dispatchEvent(new Event('visibilitychange'))});
 // 旋轉（換尺寸）不重播
 await p.waitForTimeout(300);const shown0=await p.evaluate(()=>STGV.shown);await p.evaluate(()=>{window.dispatchEvent(new Event("resize"));window.dispatchEvent(new Event("orientationchange"));layout();draw();draw()});await p.waitForTimeout(200);
 const shown1=await p.evaluate(()=>({shown:STGV.shown,cls:document.getElementById('stg').className}));
 // 音樂開關不重置
 console.log(JSON.stringify(R),await p.evaluate(()=>({stg:!!G.stg,el:G.stg&&stgEl(G.stg),t:performance.now()-__t0})));await p.evaluate(()=>{const b=document.querySelector("#stg [data-stgui=bgm]");if(b)b.click()});const afterToggle=await p.evaluate(()=>({id:G.stg&&G.stg.id,el:G.stg&&stgEl(G.stg),bgm:UI.bgm}));
 await p.waitForFunction(()=>!G.stg,null,{timeout:8000});R.totalMs=Math.round(await p.evaluate(()=>performance.now()-__t0));
 R.rotate={same:shown0===shown1.shown,cls:shown1.cls};R.toggle=afterToggle;
 // 演出結束後才放開的舊觸控不算：演出中按下、演完放開
 await p.waitForFunction(()=>G.fight&&G.phase==='fight'&&!busy,null,{timeout:15000});
 await p.evaluate(()=>{for(const f of G.fight.foes){f.hp=0;f.dead=1}run(endFight)});await p.waitForTimeout(300);
 await p.evaluate(()=>{document.getElementById('stg').dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}))});
 await p.waitForFunction(()=>!G.stg&&!busy&&G.phase==='node',null,{timeout:8000});
 R.staleTap=await p.evaluate(()=>{const v0=JSON.stringify(G.votes||{}),n0=G.node;const b=document.querySelector('#choices button[data-ch]');if(b)b.click();return {had:!!b,changed:JSON.stringify(G.votes||{})!==v0||G.node!==n0||busy}});
 await p.waitForTimeout(300);R.freshTap=await p.evaluate(()=>{document.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const n0=G.node,s0=G.stp;const b=document.querySelector('#choices button[data-ch]');if(b)b.click();return {had:!!b,moved:busy||G.node!==n0||G.stp!==s0}});
 R.errs=errs;console.log(JSON.stringify(R,null,1));await b.close()})();
