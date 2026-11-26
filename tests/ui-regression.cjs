// PR-E 固定畫面：預設只比較；--update 才能更新基準（不得在 CI 使用）。
const {chromium}=require('playwright'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const BE=require('./helpers/browser-errors.cjs'),DR=require('./helpers/driver.cjs');
const {ROOT,VIEWS,SCENES,prepare,scene,settled}=require('./helpers/fixed-scenes.cjs');
const {inspectLayout}=require('./helpers/ui-contract.cjs'),{compare}=require('./helpers/visual-diff.cjs');
const OUT=path.resolve(ROOT,process.env.QA_OUT||'test-results'),BASE=path.join(__dirname,'baselines/ui'),origin='http://qa.invalid';
async function run(){const update=process.argv.includes('--update');if(update&&process.env.CI)throw Error('CI 不得更新截圖基準');fs.mkdirSync(OUT,{recursive:true});
 const b=await chromium.launch(),checks=[],layouts=[];const meta={playwright:require('playwright/package.json').version,chromium:b.version(),platform:process.platform,indexSha256:crypto.createHash('sha256').update(fs.readFileSync(path.join(ROOT,'index.html'))).digest('hex')};
 try{for(const [width,height] of VIEWS){for(const name of Object.keys(SCENES)){
  const ctx=await b.newContext({viewport:{width,height},deviceScaleFactor:1,hasTouch:width<1000,locale:'zh-TW',timezoneId:'Asia/Taipei',serviceWorkers:'block'});
  await ctx.addInitScript(DR.seedScript,777);await prepare(ctx);
  // 所有素材直接從這個 checkout 回應，避免網路、SW 或上一版快取影響基準。
  await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!==origin)return r.abort();const f=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));if(!f.startsWith(ROOT+path.sep))return r.abort();if(fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.fulfill({status:404,body:'404'})});
  const p=await ctx.newPage(),errors=BE.watch(p,origin);await p.goto(origin+'/index.html');await scene(p,name);await settled(p);
  if(process.env.QA_UI_MUTATION)await p.addStyleTag({content:process.env.QA_UI_MUTATION});
  const content=await p.evaluate(()=>document.querySelector('#stage').innerText);if(/undefined|NaN/.test(content))throw Error(name+' 固定情境出現無效內容');
  if(['exploration','combat'].includes(name)&&await p.locator('#choices button').count()<4)throw Error(name+' 固定情境必須有至少四個選項');
  const id=`${width}x${height}-${name}`,layout=await p.evaluate(inspectLayout,SCENES[name]);layouts.push({id,...layout});checks.push({name:id+' 版面',ok:layout.issues.length===0,note:layout.issues.join('；')});
  const actual=await p.screenshot({animations:'disabled'}),file=path.join(BASE,id+'.png');let result;
  if(update){fs.mkdirSync(BASE,{recursive:true});fs.writeFileSync(file,actual);result={ok:true,note:'建立基準，須人工檢視'}}
  else if(!fs.existsSync(file))result={ok:false,note:'缺少基準截圖，不能自動接受'};
  else {const d=compare(fs.readFileSync(file),actual);result={ok:d.ok,note:d.reason||`差異 ${d.pixels} 像素（${(d.changed*100).toFixed(4)}%）`};if(!d.ok){const dir=path.join(OUT,'screenshots/ui');fs.mkdirSync(dir,{recursive:true});fs.writeFileSync(path.join(dir,id+'-actual.png'),actual);fs.copyFileSync(file,path.join(dir,id+'-expected.png'));if(d.diff)fs.writeFileSync(path.join(dir,id+'-diff.png'),d.diff)}}
  checks.push({name:id+' 基準截圖',...result});checks.push({name:id+' 載入與程式錯誤',ok:!errors.required.length,note:BE.brief(errors)});await ctx.close();
 }}if(update)fs.writeFileSync(path.join(BASE,'manifest.json'),JSON.stringify(meta,null,2)+'\n');
 }finally{await b.close()}
 const detail={meta,checks,layouts,failed:checks.filter(c=>!c.ok).map(c=>c.name+'：'+c.note)};fs.writeFileSync(path.join(OUT,'ui-regression.json'),JSON.stringify(detail,null,1));for(const c of checks)console.log((c.ok?'通過':'失敗')+' '+c.name+' '+c.note);process.exitCode=detail.failed.length?1:0;return detail;
}
if(require.main===module)run().catch(e=>{console.error(e.stack);process.exitCode=3});module.exports={run};
