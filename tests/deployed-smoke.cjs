// 只讀正式站：GET／HEAD、同源靜態資源；封鎖其他方法、外部連線及 WebSocket。
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const {inspectLayout}=require('./helpers/ui-contract.cjs'),BE=require('./helpers/browser-errors.cjs');
const {prepare}=require('./helpers/fixed-scenes.cjs');
const hash=bytes=>crypto.createHash('sha256').update(bytes).digest('hex');
function allowed(url,method,base){return ['GET','HEAD'].includes(method)&&new URL(url).origin===new URL(base).origin}
async function run({url=process.env.QA_LIVE_URL||'https://ryoushiro0329.github.io/zerocase/',expectedSha=hash(fs.readFileSync(path.join(__dirname,'../index.html'))),waitMs=Number(process.env.QA_DEPLOY_WAIT_MS||0),out=process.env.QA_OUT||'test-results'}={}){
 const b=await chromium.launch(),checks=[],blocked=[];fs.mkdirSync(out,{recursive:true});
 const ctx=await b.newContext({viewport:{width:844,height:390},serviceWorkers:'block'});await prepare(ctx);
 await ctx.routeWebSocket('**/*',ws=>{blocked.push('WebSocket '+ws.url());ws.close()});
 await ctx.route('**/*',r=>{const q=r.request();if(allowed(q.url(),q.method(),url))return r.continue();blocked.push(q.method()+' '+q.url());return r.abort()});
 let observedSha=null,version=null,errors=null;
 try{
  const p=await ctx.newPage();errors=BE.watch(p,new URL(url).origin);const deadline=Date.now()+waitMs;
  do{let response;try{response=await ctx.request.get(url,{headers:{'Cache-Control':'no-cache'},timeout:20000});}catch(e){if(Date.now()>=deadline)throw e;await p.waitForTimeout(5000);continue}const bytes=await response.body();observedSha=hash(bytes);
   if(response.ok()&&observedSha===expectedSha)break;if(Date.now()>=deadline)break;await p.waitForTimeout(5000);
  }while(true);
  checks.push({name:'部署內容 SHA-256 與本次 checkout 相同',ok:observedSha===expectedSha,note:observedSha});
  if(observedSha===expectedSha){await p.goto(url,{waitUntil:'load'});await p.evaluate(()=>document.fonts.ready);
   version=await p.evaluate(()=>ZC_VER);const gate=await p.evaluate(inspectLayout,['#gate']);checks.push({name:'入口版面與操作按鈕',ok:gate.issues.length===0,note:gate.issues.join('；')});
   await p.click('#gateNo');await p.waitForSelector('#scr:not([hidden])');await p.locator('#zc-asset-panel').waitFor({state:'hidden',timeout:30000});
   const menu=await p.evaluate(inspectLayout,['#scr']);checks.push({name:'選角選單可以開啟',ok:menu.issues.length===0,note:menu.issues.join('；')});
   checks.push({name:'頁面、程式及同源素材載入',ok:!errors.required.length,note:BE.brief(errors)});await p.screenshot({path:path.join(out,'deployed-smoke.png')});
  }
 }catch(e){checks.push({name:'部署冒煙執行',ok:false,note:e.stack||String(e)})}finally{await b.close()}
 // 被封鎖的外部讀取只記錄；任何修改請求／WebSocket 嘗試都判失敗。
 checks.push({name:'網站沒有送出修改請求',ok:!blocked.some(x=>!/^GET |^HEAD /.test(x)),note:blocked.join('；')});
 const detail={url,expectedSha,observedSha,version,checks,blocked,failed:checks.filter(c=>!c.ok).map(c=>c.name+'：'+c.note)};
 fs.writeFileSync(path.join(out,'deployed-smoke.json'),JSON.stringify(detail,null,1));checks.forEach(c=>console.log((c.ok?'通過':'失敗')+' '+c.name));return detail;
}
if(require.main===module)run().then(r=>{process.exitCode=r.failed.length?1:0}).catch(e=>{console.error(e.stack);process.exitCode=3});module.exports={run,allowed,hash};
