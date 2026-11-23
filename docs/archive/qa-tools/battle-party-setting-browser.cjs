// 平台以 Chromium 的 UA／觸控資料模擬；不取代手機實機或正式多人實連。
const {chromium}=require('playwright');
const fs=require('node:fs'),assert=require('node:assert/strict');
const URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html';
const OUT=process.env.ZC_QA_OUT||'qa-output/battle-party-setting';
const desktopUA='Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Safari/537.36';
const macUA='Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15';
const androidUA='Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/143.0.0.0 Mobile Safari/537.36';
const iphoneUA='Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Mobile/15E148 Safari/604.1';
const cases=[
 {name:'desktop',width:1280,height:720,ua:desktopUA,platform:'Win32',touch:0,on:1},
 {name:'desktop-narrow',width:393,height:690,ua:desktopUA,platform:'Win32',touch:0,on:1},
 {name:'android-portrait',width:393,height:690,ua:androidUA,platform:'Linux armv8l',touch:5,on:0},
 {name:'android-landscape',width:844,height:390,ua:androidUA,platform:'Linux armv8l',touch:5,on:0},
 {name:'iphone',width:393,height:690,ua:iphoneUA,platform:'iPhone',touch:5,on:0},
 {name:'ipad-desktop-ua',width:1024,height:768,ua:macUA,platform:'MacIntel',touch:5,on:0},
 {name:'mac-desktop',width:1280,height:720,ua:macUA,platform:'MacIntel',touch:0,on:1},
 {name:'android-desktop-ua',width:844,height:390,ua:desktopUA,platform:'Linux armv8l',touch:5,uaPlatform:'Android',on:0}
];
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();
 const report={checks:[],errors:[],phone:'待主人實機驗收',network:'未測試：正式多人網路實連；八人以受控狀態驗收'};
 const check=(name,ok)=>{report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)};
 try{for(const c of cases){
  const ctx=await b.newContext({viewport:{width:c.width,height:c.height},userAgent:c.ua,hasTouch:c.touch>0}),p=await ctx.newPage();
  p.on('pageerror',e=>report.errors.push(c.name+': '+e.message));
  p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|fonts|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(c.name+': '+m.text())});
  await p.addInitScript(c=>{
   Object.defineProperty(navigator,'platform',{value:c.platform,configurable:true});Object.defineProperty(navigator,'maxTouchPoints',{value:c.touch,configurable:true});
   if(c.uaPlatform)Object.defineProperty(navigator,'userAgentData',{value:{platform:c.uaPlatform},configurable:true});
   if(!localStorage.getItem('qa-party-seeded')){localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('qa-party-seeded','1')}
   setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},100);
  },c);
  await p.goto(URL);await p.click('#gateNo');
  check(c.name+' 舊介面設定沒有新欄位時套用平台預設',await p.evaluate(()=>UI.partyCards)===c.on);
  await p.evaluate(()=>panel('settings'));
  check(c.name+' 設定有新開關且預設按鈕正確',await p.locator(`[data-ui="partyCards"][data-v="${c.on}"].on`).count()===1&&await p.locator('#ov').innerText().then(t=>t.includes('戰鬥友軍角色卡')));
  check(c.name+' 新開關按鈕在設定面板內完整可見',await p.locator('[data-ui="partyCards"]').evaluateAll(bs=>bs.every(b=>{const r=b.getBoundingClientRect(),v=b.closest('.box').getBoundingClientRect();return r.left>=v.left-1&&r.top>=v.top-1&&r.right<=v.right+1&&r.bottom<=v.bottom+1&&b.scrollWidth<=b.clientWidth+2})));
  check(c.name+' 新增開關後仍可捲到原設定最下方',await p.evaluate(()=>{const box=document.querySelector('#ov .box');box.scrollTop=box.scrollHeight;const r=document.querySelector('#ov [data-redeem]').getBoundingClientRect(),v=box.getBoundingClientRect();const ok=r.left>=v.left-1&&r.top>=v.top-1&&r.right<=v.right+1&&r.bottom<=v.bottom+1;box.scrollTop=0;return ok}));
  if(['desktop','android-portrait','android-landscape'].includes(c.name)){await p.evaluate(()=>document.fonts.ready);await p.screenshot({path:`${OUT}/settings-${c.name}.png`})}
  await p.click('#ov [data-close]');
  await p.click('[data-cat="custom"]');await p.fill('#cname','開關測試');await p.click('[data-ctab="tal"]');await p.click('[data-tal="keen"]');await p.click('[data-ctab="sk"]');await p.click('[data-csk="aid"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');
  await p.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:30000});
  await p.evaluate(()=>{window.__encounter=startFight({n:1,types:['infected'],noMut:1,mode:'normal'})});
  await p.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
  check(c.name+' 進入戰鬥套用預設且保留敵人與順序',await p.locator('#battle-party').isVisible()===!!c.on&&await p.locator('#foes').isVisible()&&await p.locator('#order').isVisible());
  await p.evaluate(()=>{
   const original=G.players[0];for(let i=1;i<8;i++)makePlayer({kind:'custom',pid:'qa'+i,name:'隊友'+i,tal:'keen',sk:'aid',load:{},st:{STR:1,AGI:2,CON:2,PER:1,INT:1,CHA:1}},i);
   G.fight.foes=[newFoe(0,'infected',1,false),newFoe(1,'infected',1,false)];nameFoes(G.fight.foes);G.fight.group=[original.pid];draw();window.__partyState=JSON.stringify(G);
  });
  await p.locator('#app [data-open="settings"]').click();
  await p.locator('[data-ui="partyCards"][data-v="1"]').click();await p.click('#ov [data-close]');
  check(c.name+' 開啟立即顯示包含自己的八位玩家',await p.locator('#battle-party').isVisible()&&await p.locator('#battle-party .battle-player').count()===8&&await p.locator('#battle-party .fh b').first().innerText()==='開關測試');
  await p.evaluate(()=>{PEND={a:{a:'atk',h:'R'},lab:'普通攻擊'};draw()});
  check(c.name+' 開啟卡片時兩名敵人與返回完整可見',await p.locator('#choices button').evaluateAll(bs=>bs.slice(0,3).length===3&&bs.slice(0,3).every(b=>{const r=b.getBoundingClientRect(),v=document.querySelector('#stage').getBoundingClientRect();return r.left>=v.left-1&&r.top>=v.top-1&&r.right<=v.right+1&&r.bottom<=v.bottom+1&&b.scrollWidth<=b.clientWidth+2})));
  const onHeight=await p.locator('.cols').evaluate(e=>e.clientHeight);
  if(['desktop','android-portrait','android-landscape'].includes(c.name))await p.screenshot({path:`${OUT}/battle-on-${c.name}.png`});
  await p.locator('#app [data-open="settings"]').click();await p.locator('[data-ui="partyCards"][data-v="0"]').click();await p.click('#ov [data-close]');
  check(c.name+' 關閉整列立即釋放畫面空間',!await p.locator('#battle-party').isVisible()&&await p.locator('.cols').evaluate(e=>e.clientHeight)>onHeight);
  check(c.name+' 關閉卡片時兩名敵人與返回完整可見',await p.locator('#choices button').evaluateAll(bs=>bs.slice(0,3).length===3&&bs.slice(0,3).every(b=>{const r=b.getBoundingClientRect(),v=document.querySelector('#stage').getBoundingClientRect();return r.left>=v.left-1&&r.top>=v.top-1&&r.right<=v.right+1&&r.bottom<=v.bottom+1&&b.scrollWidth<=b.clientWidth+2})));
  await p.evaluate(()=>{PEND=null;draw()});
  check(c.name+' 開關不改G且敵人與順序仍可見',await p.evaluate(()=>JSON.stringify(G)===window.__partyState)&&await p.locator('#foes').isVisible()&&await p.locator('#order').isVisible());
  check(c.name+' 關閉時普通攻擊仍可操作',await p.locator('#choices [data-ftab="atk"]').isEnabled());
  await p.click('#choices [data-ftab="atk"]');check(c.name+' 普通攻擊選單可繼續',await p.locator('#choices [data-fa="atk"]').count()>0);
  if(['desktop','android-portrait','android-landscape'].includes(c.name))await p.screenshot({path:`${OUT}/battle-off-${c.name}.png`});
  check(c.name+' 新偏好不寫入帳號同步的zc5-ui',await p.evaluate(()=>JSON.parse(localStorage.getItem('zc-battle-party'))===0&&!Object.hasOwn(JSON.parse(localStorage.getItem('zc5-ui')),'partyCards')));
  await p.reload();await p.click('#gateNo');check(c.name+' 手動關閉重載後保留',await p.evaluate(()=>UI.partyCards)===0);
  await p.evaluate(()=>panel('settings'));await p.locator('[data-ui="partyCards"][data-v="1"]').click();
  await p.evaluate(()=>{const ui=JSON.parse(localStorage.getItem('zc5-ui'));ui.partyCards=0;localStorage.setItem('zc5-ui',JSON.stringify(ui))});
  await p.reload();await p.click('#gateNo');check(c.name+' 手動開啟重載保留且舊雲端UI不覆蓋本機',await p.evaluate(()=>UI.partyCards)===1);
  await p.evaluate(()=>{localStorage.removeItem('zc-battle-party');const ui=JSON.parse(localStorage.getItem('zc5-ui'));ui.partyCards=1;localStorage.setItem('zc5-ui',JSON.stringify(ui))});
  await p.reload();await p.click('#gateNo');check(c.name+' 本機未選擇時忽略雲端卡片欄位並回到平台預設',await p.evaluate(()=>UI.partyCards)===c.on);
  await ctx.close();
 }
 check('所有情境沒有程式錯誤',report.errors.length===0);
 }finally{fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));await b.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
