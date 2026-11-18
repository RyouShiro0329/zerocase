// 受控隊伍狀態的瀏覽器驗收；不替代真實多人連線與手機實機驗收。
const {chromium}=require('playwright');const fs=require('node:fs');const assert=require('node:assert/strict');
const URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html';
(async()=>{fs.mkdirSync('qa-output',{recursive:true});const browser=await chromium.launch();const report={url:URL,checks:[],errors:[],sizes:[],multiplayer_network:'未測試：使用受控隊伍狀態，沒有連線到正式房間',phone:'待主人實機驗收'};
const check=(name,ok)=>{report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)};
try{for(const [width,height] of [[844,390],[393,690]]){const tag=`${width}x${height}`,context=await browser.newContext({viewport:{width,height},hasTouch:true});const page=await context.newPage();
page.on('pageerror',e=>report.errors.push(`${tag}: ${e.message}`));
page.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|fonts|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(`${tag}: ${m.text()}`)});
await page.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard']){const el=document.querySelector(s);if(el&&!el.hidden)el.click()}},100)});
await page.goto(URL);await page.click('#gateNo');
check(tag+' 主選單版本',await page.locator('.ver').innerText()==='v0.37.0・Build 90');
await page.click('[data-cat="custom"]');await page.fill('#cname','撤離測試');await page.click('[data-ctab="tal"]');await page.click('[data-tal="keen"]');await page.click('[data-ctab="sk"]');
await page.click('[data-csk="evacroute"]');await page.locator('[data-csk="evacroute"]').scrollIntoViewIfNeeded();await page.evaluate(()=>document.fonts.ready);
await page.screenshot({path:`qa-output/skill-${tag}.png`});check(tag+' 初始技能選取',await page.locator('[data-csk="evacroute"]').getAttribute('class').then(s=>s.includes('on')));
await page.click('[data-m="cdone"]');await page.click('[data-m="solo"]');await page.click('[data-m="go"]');await page.waitForFunction(()=>G&&G.phase==='node'&&!busy,{timeout:30000});
await page.evaluate(()=>{
  // 只在測試頁建立固定的三人戰鬥，不修改遊戲本體的亂數、連線或平衡規則。
  window.__originalCheck=check;window.__originalDice=dice;window.__checks=[];window.__mode=true;
  window.__prepare=()=>{ROLE='solo';MYPID='qa1';newRun([1,2,3].map(i=>({kind:'custom',pid:'qa'+i,name:['帶隊者','探索者','受傷隊友'][i-1],tal:'keen',sk:i===1?'evacroute':'aid',st:{STR:1,AGI:2,CON:2,PER:1,INT:1,CHA:1},load:{}})),{diff:'normal',cd:'off'},'mp');
    G.lv='A';G.lvSeen=['A'];G.node='A2';G.levels=1;G.busy=0;busy=false;G.after=null;G.winR=null;LOG=[];
    const foes=[Object.assign(newFoe(0,'infected',3,false),{n:'感染者',img:'inf_m'})];G.fight={foes,P:3,sl:{},hb:{},bg:{},order:[{k:'p',id:'qa1',init:15},{k:'p',id:'qa2',init:12},{k:'f',id:0,init:5}],turn:0,round:1,arrows:{},opening:'normal',cur:null,noflee:false,tUsed:{},escaped:[],group:['qa1','qa2'],gStart:0,gEnd:2,pend:{}};
    const down=P('qa3');Object.assign(down,{down:1,hp:0,bleed:2,bleedN:2,frac:1,inf:37,humus:2,burn:2,fe:56});FTAB='skill';PEND=null;draw();
  };check=async(...a)=>{__checks.push([a[0].pid,a[1],a[2],a[3],a[4]]);return {ok:__mode}};__prepare();
});
await page.screenshot({path:`qa-output/battle-${tag}.png`});check(tag+' 戰鬥技能按鈕',await page.locator('#choices [data-csk="evacroute"]').isEnabled());
// 按真正的技能按鈕，再由第二位隊友送出行動，驗證整組結算能退出戰鬥。
await page.click('#choices [data-csk="evacroute"]');await page.evaluate(async()=>{await fightAct('qa2',{a:'guard'})});await page.waitForFunction(()=>!G.fight&&!busy);
check(tag+' 統帥一次帶全隊撤離',await page.evaluate(()=>__checks.length===1&&__checks[0][1]==='CHA'&&!P('qa3').leftBehind&&P('qa3').down===1));
check(tag+' 帶走者可立即救援',await page.evaluate(async()=>{P('qa1').items.adrenaline=1;const ok=await revive(P('qa1'),'qa3','adrenaline');return ok&&!P('qa3').down&&P('qa3').bleed===2&&P('qa3').frac===1&&P('qa3').inf===37}));
await page.evaluate(async()=>{__prepare();await execAct(P('qa1'),{a:'flee'});G.fight.group=['qa2'];G.fight.gStart=1;G.fight.gEnd=2;G.fight.pend={};FTAB=null;draw()});
await page.screenshot({path:`qa-output/wait-${tag}.png`});check(tag+' 安全區等待畫面',await page.locator('#choices').innerText().then(s=>s.includes('你已脫離戰鬥')));
check(tag+' 等待者不能再行動',await page.locator('#choices [data-fa]').count()===0);
await page.evaluate(async()=>{await execAct(P('qa2'),{a:'flee'});draw()});check(tag+' 普通逃跑留下瀕死者',await page.evaluate(()=>!G.fight&&P('qa3').leftBehind==='A'&&P('qa3').hp===0));
await page.evaluate(()=>{MYPID='qa3';draw()});await page.screenshot({path:`qa-output/stranded-${tag}.png`});check(tag+' 脫隊等待畫面',await page.locator('#choices').innerText().then(s=>s.includes('你還留在原區域')));
await page.evaluate(()=>{rejoinStranded('B');draw()});check(tag+' 極差狀態歸隊且不清除負面狀態',await page.evaluate(()=>{const p=P('qa3');return p.hp===1&&!p.down&&!p.leftBehind&&p.bleed===2&&p.frac===1&&p.inf===37&&p.humus===2&&p.burn===2&&p.fe===56}));
// 所有選項文字必須在自身按鈕寬度內；直拿時舞台旋轉後仍在視窗內。
const geometry=await page.evaluate(()=>{const stage=document.querySelector('#stage').getBoundingClientRect();const panels=['#choices','#cbh'];const data=panels.map(s=>{const e=document.querySelector(s);return {s,ok:!e||e.scrollWidth<=e.clientWidth+2}});return {stage:{x:stage.x,y:stage.y,width:stage.width,height:stage.height},inside:stage.left>=-2&&stage.top>=-2&&stage.right<=innerWidth+2&&stage.bottom<=innerHeight+2,text:data.every(x=>x.ok)}});
check(tag+' 舞台完整可見',geometry.inside);check(tag+' 文字沒有水平裁切',geometry.text);report.sizes.push({width,height,geometry});await context.close();}
check('沒有程式錯誤',report.errors.length===0);
}catch(e){report.failure=e.stack;throw e}finally{fs.writeFileSync('qa-output/report.json',JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
