/* 正式站唯讀素材驗收；只建立瀏覽器本機新局，不修改站台或既有玩家資料。 */
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),assert=require('node:assert/strict');
const root=path.resolve(__dirname,'../..'),out=path.resolve('test-results/live-asset-loading');fs.mkdirSync(out,{recursive:true});
const url='https://ryoushiro0329.github.io/zerocase/index.html',sha=b=>crypto.createHash('sha256').update(b).digest('hex');
const report={started:new Date().toISOString(),url,checks:[],limitations:['Android 手機實機：待主人實機驗收。']};
let browser;
(async()=>{
 const expected=sha(fs.readFileSync(path.join(root,'index.html')));let matched=false;
 for(let i=0;i<60;i++){try{const r=await fetch(url+'?qa='+Date.now(),{signal:AbortSignal.timeout(20000)});if(r.ok&&sha(Buffer.from(await r.arrayBuffer()))===expected){matched=true;break}}catch(e){console.log(e.name)}await new Promise(r=>setTimeout(r,10000))}
 assert(matched,'正式站 HTML 必須與本次提交完全一致');report.sourceSha256=expected;
 for(const file of ['assets-manifest.json','sw.js']){const r=await fetch(new URL(file+'?qa='+Date.now(),url));assert(r.ok);assert.equal(sha(Buffer.from(await r.arrayBuffer())),sha(fs.readFileSync(path.join(root,file))),file+' 內容不一致')}
 report.checks.push('正式站 HTML、素材索引及 SW 雜湊一致');
 browser=await chromium.launch();const c=await browser.newContext({viewport:{width:844,height:390},hasTouch:true});
 const p=await c.newPage(),errors=[];p.on('pageerror',e=>errors.push(String(e)));
 async function enter(){await p.locator('#gateNo').tap();await p.waitForFunction(()=>document.querySelector('#zc-asset-panel').hidden,null,{timeout:40000});await p.evaluate(async()=>{await loadSounds();await loadArrowSound()});await p.waitForFunction(()=>SFILES.every(n=>BUF[n]),null,{timeout:120000})}
 await p.goto(url,{waitUntil:'domcontentloaded'});await enter();
 const cold=await p.evaluate(()=>({version:ZC_VER,ac:AC.state,stats:ZC_ASSET_LOADER.memory(),required:[...ZC_ASSET_LOADER.records.values()].filter(r=>r.required).map(r=>({key:r.key,state:r.state}))}));
 assert.equal(cold.version.v,'0.69.0');assert.equal(cold.version.b,144);assert.equal(cold.ac,'running');assert(cold.required.every(r=>r.state==='ready'));report.cold=cold;
 await p.evaluate(()=>navigator.serviceWorker.ready);await p.reload({waitUntil:'domcontentloaded'});await p.waitForFunction(()=>navigator.serviceWorker.controller);await enter();
 const warm=await p.evaluate(()=>({stats:ZC_ASSET_LOADER.memory(),controller:navigator.serviceWorker.controller.scriptURL,scope:location.pathname}));assert(warm.stats.hits>0);assert(warm.controller.endsWith('/zerocase/sw.js'));report.warm=warm;report.checks.push('冷快取必要素材、觸控音訊解鎖、SW 控制與暖快取命中');
 await p.screenshot({path:path.join(out,'menu-844x390.png')});
 await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');await p.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:40000});
 await p.screenshot({path:path.join(out,'new-run-844x390.png')});assert.equal(errors.length,0,errors.join('\n'));report.checks.push('正式站新局與探索畫面、無未處理 JavaScript 錯誤');
 report.browser=await browser.version();report.status='通過';await c.close();
})().catch(e=>{report.status='失敗';report.error=e.stack;process.exitCode=1}).finally(async()=>{report.finished=new Date().toISOString();fs.writeFileSync(path.join(out,'results.json'),JSON.stringify(report,null,2));if(browser)await browser.close();console.log(JSON.stringify(report))});
