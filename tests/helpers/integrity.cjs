// 防弱化檢查（Claude 2026-11-25，QA 升級 PR-A：QA-03）
// 跟基準分支（預設 origin/main，CI 上是 PR 要合進去的分支）比對：
//   1. tests/guard.test.cjs（主人的設計守則）只要有任何一個位元不同或被刪掉 → 失敗。
//      主人明確同意改 guard 的那個 PR 這項會失敗，PR 要寫出來，主人說可以合併才合併。
//   2. 測試檔被刪、被改名 → 警告。
//   3. 某支測試檔裡的 test( 數量變少、skip／todo 變多 → 警告。
//   4. 記錄 index.html 和基準是否逐位元相同（只記錄，不判斷）。
// 找不到基準（沒有 fetch main）→ 未測試（NOT_RUN），不會當成通過。
// 用法：node tests/helpers/integrity.cjs <輸出 JSON 檔>；基準用環境變數 QA_BASE 指定。
// exit：0 通過、1 失敗、4 未測試（找不到基準）、3 工具出錯
const fs=require('node:fs'),path=require('node:path'),{execFileSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const out=process.argv[2];
const base=process.env.QA_BASE||'origin/main';
const git=(...a)=>execFileSync('git',a,{cwd:ROOT,stdio:['ignore','pipe','pipe'],maxBuffer:64<<20});
const done=(code,obj)=>{if(out)fs.writeFileSync(out,JSON.stringify(obj,null,1));process.exit(code)};
try{
 try{git('rev-parse','--verify','--quiet',base+'^{commit}')}
 catch(e){console.log(`未測試：找不到基準 ${base}（要先 git fetch origin main）`);done(4,{base,error:'找不到基準'})}
 const baseSha=git('rev-parse',base).toString().trim();
 const show=f=>{try{return git('show',`${base}:${f}`)}catch(e){return null}};
 const cur=f=>{const p=path.join(ROOT,f);return fs.existsSync(p)?fs.readFileSync(p):null};
 const failed=[],warnings=[],info={};
 // 1. guard
 const gB=show('tests/guard.test.cjs'),gH=cur('tests/guard.test.cjs');
 if(!gB)warnings.push('基準沒有 tests/guard.test.cjs，無法比對');
 else if(!gH)failed.push('tests/guard.test.cjs 被刪掉了');
 else if(!gB.equals(gH))failed.push('tests/guard.test.cjs 和基準不同（主人的設計守則不能改）');
 info.guardSame=!!(gB&&gH&&gB.equals(gH));
 // 2、3. 測試檔與測試數量
 const isTest=f=>/^tests\/.*\.cjs$/.test(f)&&!f.startsWith('tests/helpers/');
 const baseFiles=git('ls-tree','-r','--name-only',base,'--','tests').toString().split('\n').filter(isTest);
 const count=(buf,re)=>buf?(buf.toString('utf8').match(re)||[]).length:0;
 const RE_T=/(^|[^\w.])(test|it)\s*\(/gm,RE_W=/(\.skip\s*\(|\.todo\s*\(|\{\s*(skip|todo)\s*:)/g;
 let nB=0,nH=0;
 for(const f of baseFiles){
  const b=show(f),h=cur(f);const tb=count(b,RE_T),th=count(h,RE_T);nB+=tb;nH+=th;
  if(!h){warnings.push(`測試檔被刪掉或改名：${f}（原本 ${tb} 個 test）`);continue}
  if(th<tb)warnings.push(`${f} 的 test 從 ${tb} 個變成 ${th} 個`);
  const wb=count(b,RE_W),wh=count(h,RE_W);if(wh>wb)warnings.push(`${f} 的 skip／todo 從 ${wb} 個變成 ${wh} 個`);
 }
 const added=fs.readdirSync(path.join(ROOT,'tests')).map(f=>'tests/'+f).filter(f=>isTest(f)&&!baseFiles.includes(f));
 for(const f of added)nH+=count(cur(f),RE_T);
 info.testFiles={base:baseFiles.length,head:baseFiles.filter(f=>cur(f)).length+added.length,added};
 info.testCalls={base:nB,head:nH};
 // 4. index.html
 const iB=show('index.html'),iH=cur('index.html');info.indexSameAsBase=!!(iB&&iH&&iB.equals(iH));
 const obj={base,baseSha,failed,warnings,info};
 for(const w of warnings)console.log('警告：'+w);
 for(const f of failed)console.log('失敗：'+f);
 console.log(`基準 ${base}（${baseSha.slice(0,7)}）：guard ${info.guardSame?'相同':'不同'}、測試檔 ${info.testFiles.base}→${info.testFiles.head}、test 呼叫 ${nB}→${nH}、index.html ${info.indexSameAsBase?'和基準逐位元相同':'和基準不同'}`);
 done(failed.length?1:0,obj);
}catch(e){console.log('防弱化檢查出錯：'+e.message);done(3,{base,error:e.message})}
