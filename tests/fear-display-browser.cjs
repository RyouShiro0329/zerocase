// 恐懼紀錄顯示驗收：同一份情境，對照 main 與候選版本；傳輸只用本機替身。
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const BE=require('./helpers/browser-errors.cjs');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(ROOT,process.env.QA_OUT||'test-results/fear-display'),ORIGIN='http://fear.invalid';
const base=process.env.QA_BASE||'origin/main';
const old=execFileSync('git',['show',base+':index.html'],{cwd:ROOT,maxBuffer:8*1024*1024});
const current=fs.readFileSync(path.join(ROOT,'index.html'));
async function run(){fs.mkdirSync(OUT,{recursive:true});const b=await chromium.launch(),checks=[],screens=[];
try{for(const [label,html] of [['before',old],['after',current]]){for(const [width,height] of [[844,390],[1280,720],[393,690]]){
 const ctx=await b.newContext({viewport:{width,height},hasTouch:width<1000,locale:'zh-TW',timezoneId:'Asia/Taipei',serviceWorkers:'block'});
 await ctx.addInitScript({path:fs.existsSync(path.join(ROOT,'tests/multiplayer/mock.js'))?path.join(ROOT,'tests/multiplayer/mock.js'):path.join(ROOT,'tools/claude/mock.js')});
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==ORIGIN)return r.abort();if(u.pathname==='/index.html')return r.fulfill({contentType:'text/html; charset=utf-8',body:html});const file=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));if(file.startsWith(ROOT+path.sep)&&fs.existsSync(file)&&fs.statSync(file).isFile())return r.fulfill({path:file});return r.fulfill({status:404,body:'404'})});
 const p=await ctx.newPage(),rec=BE.watch(p,ORIGIN);await p.goto(ORIGIN+'/index.html');
 await p.evaluate(()=>{UI.snd=0;UI.bgm=0;UI.spd=.3;BOOTED=true;$('#gate').hidden=true;ROLE='solo';MYPID='fear-qa';newRun([{kind:'custom',pid:MYPID,name:'驗收角色',st:{STR:2,AGI:2,CON:2,PER:1,INT:1,CHA:0},load:{}}],{diff:'normal'},'solo');G.lv='A';G.node='A2';G.phase='node';G.busy=0;busy=false;LOG=[];const p=G.players[0];p.fe=10;setFear(p,15);setFear(p,12);p.fe=98;setFear(p,120);showGame();layout()});
 await p.evaluate(async()=>{await document.fonts.ready;await new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r)))});
 const observed=await p.evaluate(()=>({text:document.querySelector('#log').innerText,raw:LOG.map(x=>x[0]),fear:G.players[0].fe,version:ZC_VER,scrollWidth:document.querySelector('#log').scrollWidth,clientWidth:document.querySelector('#log').clientWidth}));
 if(label==='after'){
  checks.push({name:`${width}x${height}：只顯示實際增減與階段`,ok:/恐懼 \+5。/.test(observed.text)&&/恐懼 −3。/.test(observed.text)&&/恐懼 \+2，陷入「發瘋」。/.test(observed.text)&&!/目前|[／/]\s*100/.test(observed.text),note:observed.text});
  checks.push({name:`${width}x${height}：內部上限與版面維持正確`,ok:observed.fear===100&&observed.scrollWidth<=observed.clientWidth+1});
 }
 checks.push({name:`${label} ${width}x${height}：無頁面或必要資源錯誤`,ok:rec.required.length===0,note:BE.brief(rec)});
 const file=`${label}-${width}x${height}.png`;await p.screenshot({path:path.join(OUT,file),animations:'disabled'});screens.push({label,viewport:[width,height],file,sha256:crypto.createHash('sha256').update(html).digest('hex'),observed});await ctx.close();
}}}finally{await b.close()}
const report={base,checks,screens,failed:checks.filter(c=>!c.ok)};fs.writeFileSync(path.join(OUT,'fear-display.json'),JSON.stringify(report,null,1));checks.forEach(c=>console.log((c.ok?'通過':'失敗')+' '+c.name));process.exitCode=report.failed.length?1:0;
}
run().catch(e=>{console.error(e.stack);process.exitCode=3});
