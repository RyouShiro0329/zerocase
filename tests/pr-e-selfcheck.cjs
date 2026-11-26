// PR-E 自我驗收：所有破壞只在暫存目錄或測試頁，絕不改倉庫遊戲。
const fs=require('node:fs'),os=require('node:os'),path=require('node:path'),{spawnSync}=require('node:child_process'),http=require('node:http');
const {chromium}=require('playwright');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(ROOT,process.env.QA_OUT||'test-results'),checks=[];
const say=(id,ok,note)=>{checks.push({id,status:ok?'通過':'失敗',note});console.log((ok?'通過':'失敗')+' '+id+' '+note)};
function exec(script,args=[],opts={}){return spawnSync(process.execPath,[script,...args],{cwd:ROOT,encoding:'utf8',timeout:120000,...opts})}
(async()=>{fs.mkdirSync(OUT,{recursive:true});const tmp=fs.mkdtempSync(path.join(os.tmpdir(),'zc-pr-e-'));
try{
 // V20：真實三尺寸／五畫面的未修改對照通過；第四個按鈕、上下裁切及重疊都要失敗。
 const baseline=exec('tests/ui-regression.cjs',[],{env:{...process.env,QA_OUT:path.join(tmp,'control')}});say('V20-control',baseline.status===0,baseline.status===0?'固定畫面對照通過':baseline.stdout+baseline.stderr);
 for(const [id,css,needle] of [
  ['V20-fourth','#choices button:nth-child(4){position:fixed!important;left:-200px!important;top:-100px!important}','裁切'],
  ['V20-vertical','#chp{transform:translateY(400px)!important}','超出'],
  ['V20-overlap','#choices button:nth-child(4){position:absolute!important;inset:0!important}','重疊'],
  ['V20-text','#choices button{height:2px!important;min-height:0!important;overflow:hidden!important}','文字裁切'],
 ]){const dir=path.join(tmp,id),r=exec('tests/ui-regression.cjs',[],{env:{...process.env,QA_OUT:dir,QA_UI_MUTATION:css}});let d={checks:[]};try{d=JSON.parse(fs.readFileSync(path.join(dir,'ui-regression.json')))}catch{}say(id,r.status===1&&d.checks.some(c=>!c.ok&&c.name.endsWith('版面')&&c.note.includes(needle)),needle+'會被版面檢查抓到')}
 // V21：版面不變但整體顏色改了，只能靠截圖抓到；缺少基準不得自動建立。
 {const dir=path.join(tmp,'color'),r=exec('tests/ui-regression.cjs',[],{env:{...process.env,QA_OUT:dir,QA_UI_MUTATION:'#stage{filter:invert(1)!important}'}});let d={checks:[]};try{d=JSON.parse(fs.readFileSync(path.join(dir,'ui-regression.json')))}catch{}say('V21',r.status===1&&d.checks.some(c=>!c.ok&&c.name.endsWith('基準截圖'))&&d.checks.filter(c=>c.name.endsWith('版面')).every(c=>c.ok),'顏色破壞由截圖比對抓到，版面對照仍通過')}
 // V22／V24：在暫存 checkout 真的改 CSS、拿掉 migrateG 的工作，執行正式測試。
 const copy=path.join(tmp,'repo');fs.mkdirSync(copy);fs.cpSync(path.join(ROOT,'tests'),path.join(copy,'tests'),{recursive:true,filter:p=>!p.split(path.sep).includes('node_modules')});fs.symlinkSync(path.join(ROOT,'tests/node_modules'),path.join(copy,'tests/node_modules'),'dir');
 const html=fs.readFileSync(path.join(ROOT,'index.html'),'utf8');
 for(const dir of ['fonts','img','sfx','fx'])fs.symlinkSync(path.join(ROOT,dir),path.join(copy,dir),'dir');
 fs.writeFileSync(path.join(copy,'index.html'),html);
 const missing=path.join(copy,'tests/baselines/ui/844x390-gate.png');fs.unlinkSync(missing);
 const missingRun=exec('tests/ui-regression.cjs',[],{cwd:copy,env:{...process.env,QA_OUT:path.join(tmp,'missing')}});
 say('V21-missing',missingRun.status===1&&!fs.existsSync(missing)&&missingRun.stdout.includes('缺少基準截圖'),'缺少基準會失敗，而且不自動建立');
 fs.writeFileSync(path.join(copy,'index.html'),html.replace('</style>','#choices{overflow-y:hidden}\n</style>'));
 const style=exec('tests/style-guard.test.cjs',[],{cwd:copy});say('V22',style.status===1&&style.stdout.includes('重要 CSS'),'重要 CSS 破壞會失敗');
 fs.writeFileSync(path.join(copy,'index.html'),html.replace('function migrateG(g){','function migrateG(g){return g;'));
 const migration=exec('tests/save-fixtures.test.cjs',[],{cwd:copy});say('V24',migration.status===1&&migration.stdout.includes('跨版本存檔'),'存檔轉換失效會失敗');
 // V23：多人模擬使用真實頁面和 BroadcastChannel；把 emit 丟掉，必須不能成功。
 {const script=path.join(copy,'tests/multiplayer/mock.js');fs.writeFileSync(script,fs.readFileSync(script,'utf8').replace("bc.postMessage({k:'ev',topic,data,peer})","void 0"));fs.writeFileSync(path.join(copy,'index.html'),html);const r=exec('tests/multiplayer/mpstage.cjs',[],{cwd:copy,env:{...process.env,QA_OUT:path.join(tmp,'mp')},timeout:70000});say('V23',r.status!==0&&r.status!==null&&/Timeout|timeout/.test(r.stderr),'丟失多人訊息必須失敗，不能只印觀察值')}
 // V25：用本機唯讀網站走部署腳本。對照通過、錯誤雜湊失敗、修改請求被封鎖且伺服器收不到。
 const {run,hash}=require('./deployed-smoke.cjs');let writes=0;let served=html;
 const server=http.createServer((req,res)=>{if(!['GET','HEAD'].includes(req.method))writes++;const u=new URL(req.url,'http://localhost');if(u.pathname==='/index.html'||u.pathname==='/'){res.setHeader('Content-Type','text/html; charset=utf-8');res.end(served);return}const f=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));if(f.startsWith(ROOT+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile()){const ext=path.extname(f);res.setHeader('Content-Type',({'.woff2':'font/woff2','.js':'text/javascript','.webp':'image/webp','.png':'image/png','.mp3':'audio/mpeg','.ogg':'audio/ogg','.json':'application/json'})[ext]||'application/octet-stream');fs.createReadStream(f).pipe(res)}else{res.statusCode=404;res.end('404')}});
 await new Promise(r=>server.listen(0,'127.0.0.1',r));const url='http://127.0.0.1:'+server.address().port+'/index.html';
 try{const a=await run({url,expectedSha:hash(Buffer.from(served)),out:path.join(tmp,'live-ok')});say('V25-control',a.failed.length===0,'本機部署頁面對照通過');
 const b=await run({url,expectedSha:'0'.repeat(64),out:path.join(tmp,'live-stale')});say('V25-stale',b.failed.some(x=>x.includes('SHA-256')),'部署舊內容會失敗');
 served=html.replace('</body>','<script>fetch("/qa-write",{method:"POST",body:"forbidden"}).catch(()=>{})</script></body>');const c=await run({url,expectedSha:hash(Buffer.from(served)),out:path.join(tmp,'live-write')});say('V25-write',c.failed.some(x=>x.includes('修改請求'))&&writes===0,'修改請求會失敗，伺服器收到的修改請求為零');
 }finally{await new Promise(r=>server.close(r))}
}finally{fs.rmSync(tmp,{recursive:true,force:true})}
fs.writeFileSync(path.join(OUT,'pr-e-selfcheck.json'),JSON.stringify({checks},null,1));process.exitCode=checks.some(c=>c.status==='失敗')?1:0;
})().catch(e=>{console.error(e.stack);fs.writeFileSync(path.join(OUT,'pr-e-selfcheck.json'),JSON.stringify({checks:[...checks,{id:'PR-E',status:'失敗',note:e.stack}]},null,1));process.exitCode=3});
