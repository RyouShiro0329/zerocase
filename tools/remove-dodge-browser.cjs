const {chromium}=require('playwright'),assert=require('node:assert/strict'),fs=require('node:fs');
const {GOD}=require('../tests/helpers/godmode.cjs');
const OUT='qa-output/remove-dodge';
(async()=>{fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch();const report={checks:[],errors:[],phone:'待主人實機驗收',network:'未測試：正式多人實連'};
const check=(name,ok)=>{report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)};
try{for(const [width,height] of [[844,390],[393,690]]){const tag=`${width}x${height}`,ctx=await b.newContext({viewport:{width,height},hasTouch:true}),p=await ctx.newPage();p.on('pageerror',e=>report.errors.push(e.message));
await p.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},100)});
await p.goto('http://localhost:8768/index.html');await p.click('#gateNo');await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');await p.waitForFunction(()=>G&&G.phase==='node'&&!busy);await p.evaluate(GOD);
await p.evaluate(()=>{window.__fight=startFight({n:1,types:['infected'],noMut:1,mode:'normal'})});await p.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
await p.click('#choices [data-ftab="other"]');check(tag+' 無閃躲按鈕',await p.locator('[data-fa="dodge"]').count()===0);check(tag+' 格擋與掩蔽保留',await p.locator('#choices [data-fa="block"]').count()===1&&await p.locator('#choices [data-fa="cover"]').count()===1);
check(tag+' 行動文字沒有閃躲',!(await p.locator('#choices').innerText()).includes('閃躲'));
check(tag+' 兩顆防守按鈕完整位於舞台',await p.evaluate(()=>['block','cover'].every(a=>{const r=document.querySelector(`[data-fa="${a}"]`).getBoundingClientRect(),s=document.querySelector('#stage').getBoundingClientRect();return r.width>0&&r.height>0&&r.left>=s.left-1&&r.right<=s.right+1&&r.top>=s.top-1&&r.bottom<=s.bottom+1})));
await p.screenshot({path:`${OUT}/actions-${tag}.png`});
check(tag+' 舊指令不提交',await p.evaluate(async()=>{const f=G.fight,before=JSON.stringify(f.pend);await fightAct(me().pid,{a:'dodge'});return before===JSON.stringify(f.pend)&&me().stance!=='dodge'}));
await p.click('#choices [data-fa="block"]');await p.waitForFunction(()=>G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});check(tag+' 格擋後可繼續回合',await p.locator('#choices [data-ftab="other"]').count()===1);await p.click('#choices [data-ftab="other"]');await p.click('#choices [data-fa="cover"]');await p.waitForFunction(()=>G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});check(tag+' 掩蔽後可繼續回合',await p.locator('#choices [data-ftab="other"]').count()===1);await ctx.close()}
check('遊戲主控台無未處理錯誤',report.errors.length===0)
}finally{fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));await b.close()}console.log(JSON.stringify(report,null,2))})().catch(e=>{console.error(e);process.exit(1)});
