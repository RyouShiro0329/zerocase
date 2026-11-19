// 真實開局與攻擊選單；受控骰點僅在測試頁使用，不改遊戲本體。
const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html',OUT='qa-output/pierce-audio';
const report={url:URL,checks:[],errors:[],audio:[],phone:'待主人實機驗收',network:'未測試：正式多人網路實連；事件接收由邏輯測試驗證'};
function check(name,ok){report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch();
try{for(const [width,height] of [[844,390],[393,690]]){
 const tag=width+'x'+height,ctx=await browser.newContext({viewport:{width,height},hasTouch:true}),p=await ctx.newPage();
 p.on('pageerror',e=>report.errors.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(m.text())});
 await p.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},70)});
 await p.goto(URL);await p.click('#gateNo');check(tag+'主選單版本',await p.locator('.ver').innerText()==='v0.37.2・Build 92');
 await p.click('[data-cat="custom"]');await p.fill('#cname','穿刺驗收');await p.click('[data-ctab="tal"]');await p.click('[data-tal="keen"]');await p.click('[data-ctab="sk"]');await p.click('[data-csk="aid"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
 await p.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:30000});
 await p.evaluate(()=>{const p=me();p.gear=[];p.hand={R:null,L:null};const g=newGear('screwdriver');p.gear.push(g);equip(p,g.u,'R');window.__encounter=startFight({n:2,types:['infected'],noMut:1,mode:'first'})});
 await p.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
 await p.evaluate(()=>{for(const f of G.fight.foes){f.hp=f.max=100;f.aff=null;f.stun=20}UI.snd=1;audio();});await p.evaluate(()=>loadSounds());
 check(tag+'新音效完整解碼',await p.evaluate(()=>BUF.piercehit&&Math.abs(BUF.piercehit.duration-1)<.05));
 await p.evaluate(()=>{window.__sounds=[];const create=AC.createBufferSource.bind(AC);AC.createBufferSource=()=>{const s=create(),start=s.start.bind(s);s.start=(at,...args)=>{if(s.buffer===BUF.piercehit)__sounds.push({start:at,duration:s.buffer.duration});return start(at,...args)};return s};Math.random=()=>.5;window.__before={hp:G.fight.foes[0].hp,dur:me().gear.find(g=>g.id==='screwdriver').dur};draw()});
 await p.click('#choices [data-ftab="atk"]');await p.locator('#choices [data-fa="atk"]').first().click();await p.locator('#choices [data-tgt]').first().click();
 await p.waitForFunction(()=>__sounds.length===1);await p.waitForFunction(()=>!busy&&!G.busy,null,{timeout:30000});
 check(tag+'實際穿刺命中僅播放一次',await p.evaluate(()=>__sounds.length===1));
 check(tag+'原耐久只消耗一次且有傷害',await p.evaluate(()=>me().gear.find(g=>g.id==='screwdriver').dur===__before.dur-1&&G.fight.foes[0].hp<__before.hp));
 check(tag+'沒有誤播斬擊演出',await p.evaluate(()=>!SLASH_VFX.active&&!document.querySelector('.zc-slash-fx')));
 await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:OUT+'/battle-'+tag+'.png'});
 check(tag+'主要操作按鈕完整可見',await p.locator('#choices button').evaluateAll(bs=>bs.slice(0,3).every(b=>{const r=b.getBoundingClientRect(),v=document.querySelector('#stage').getBoundingClientRect();return r.width>0&&r.left>=v.left-1&&r.right<=v.right+1&&r.top>=v.top-1&&r.bottom<=v.bottom+1})));
 await p.evaluate(()=>{setSoundEnabled(false);__sounds=[];sfx('piercehit',.9,1200)});check(tag+'關音效立即停止且不重播',await p.evaluate(()=>ACTIVE_SFX.size===0&&__sounds.length===0));
 await p.evaluate(()=>panel('credits'));check(tag+'遊戲內署名與授權連結',await p.locator('#ov').innerText().then(t=>t.includes('-GeorgeDiamond-')&&t.includes('CC BY 4.0')));
 await p.locator('#ov a[href*="718259"]').scrollIntoViewIfNeeded();await p.screenshot({path:OUT+'/credits-'+tag+'.png'});
 report.audio.push({size:tag,...await p.evaluate(()=>({duration:BUF.piercehit.duration,status:soundStatus()}))});await ctx.close();
 }
 check('沒有程式或主控台錯誤',report.errors.length===0);
}finally{fs.writeFileSync(OUT+'/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
