// 測試報告（Claude 2026-11-25，QA 升級 PR-A：QA-01 結果真實性、QA-02 結構化報告）
// run_all.sh 每跑完一個階段就記一筆，最後 finish 產生 test-results/report.json 和 report.md。
// 每個階段只能是六種狀態之一：
//   PASS 通過｜FAIL 失敗｜SKIP 刻意略過（FAST 模式、SKIP_LONG）｜NOT_RUN 該跑但沒跑成（缺 playwright 等）
//   ERROR 測試工具自己出錯（沒有結果可看）｜TODO 已知暫緩（只用在個別項目，階段本身不會是 TODO）
// 總結：只有每個階段都是 PASS 才會寫「全部通過」。有 SKIP／NOT_RUN 就寫出哪幾項沒跑。
// 用法（run_all.sh 會呼叫，平常不用自己打）：
//   node tests/helpers/test-reporter.cjs init <fast|full> [冒煙步數] [長路線動作數]
//   node tests/helpers/test-reporter.cjs node <TAP 檔> <exit code> <秒數>
//   node tests/helpers/test-reporter.cjs stage <代號> <名稱> <狀態> <秒數> [說明] [細節 JSON 檔]
//   node tests/helpers/test-reporter.cjs finish
// 輸出資料夾：環境變數 QA_OUT，預設 test-results/（不進 git）。
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execSync}=require('node:child_process');
const ROOT=path.resolve(__dirname,'../..');
const OUT=path.resolve(ROOT,process.env.QA_OUT||'test-results');
const RUN=path.join(OUT,'run.json');
const STATUS=['PASS','FAIL','SKIP','NOT_RUN','ERROR','TODO'];
const ZH={PASS:'通過',FAIL:'失敗',SKIP:'略過',NOT_RUN:'未測試',ERROR:'測試工具出錯',TODO:'暫緩'};

function taipei(d=new Date()){const t=new Date(d.getTime()+8*3600e3).toISOString().replace('Z','+08:00');return t.slice(0,19)+'+08:00'}
function git(cmd){try{return execSync('git '+cmd,{cwd:ROOT,stdio:['ignore','pipe','ignore']}).toString().trim()}catch(e){return null}}
function gameMeta(){
 const f=path.join(ROOT,'index.html');
 if(!fs.existsSync(f))return {error:'找不到 index.html'};
 const buf=fs.readFileSync(f),m=buf.toString('utf8').match(/ZC_VER=(\{[^}]*\})/);
 let v=null;try{v=m&&JSON.parse(m[1])}catch(e){}
 return {version:v&&v.v||null,build:v&&v.b||null,versionTime:v&&v.t||null,sha256:crypto.createHash('sha256').update(buf).digest('hex'),bytes:buf.length};
}
function pwVersion(){try{return require('playwright/package.json').version}catch(e){return null}}
function load(){if(!fs.existsSync(RUN))throw new Error('還沒有 init：'+RUN);return JSON.parse(fs.readFileSync(RUN,'utf8'))}
function save(r){fs.writeFileSync(RUN,JSON.stringify(r,null,1))}

// 解析 node --test 的 TAP 輸出。沒有總結行＝工具出錯，不能當通過。
function parseTap(txt,exit){
 const num=k=>{const m=txt.match(new RegExp('^# '+k+' (\\d+)','m'));return m?+m[1]:null};
 const c={tests:num('tests'),pass:num('pass'),fail:num('fail'),cancelled:num('cancelled'),skipped:num('skipped'),todo:num('todo')};
 const lines=txt.split('\n');
 const name=l=>l.replace(/^\s*(not )?ok \d+ - /,'').replace(/\s*#\s*(TODO|SKIP).*$/i,'').trim();
 const failed=lines.filter(l=>/^\s*not ok \d+ - /.test(l)&&!/#\s*(TODO|SKIP)/i.test(l)).map(name);
 const todo=lines.filter(l=>/^\s*(not )?ok \d+ - .*#\s*TODO/i.test(l)).map(name);
 const skipped=lines.filter(l=>/^\s*ok \d+ - .*#\s*SKIP/i.test(l)).map(name);
 let status,note;
 if(c.tests==null||c.pass==null){status='ERROR';note='沒有測試總結（Node 測試沒有正常跑完），exit '+exit}
 else if(c.tests===0){status='ERROR';note='一項測試都沒有跑到'}
 else if((c.fail||0)>0||(c.cancelled||0)>0){status='FAIL';note=`失敗 ${c.fail||0} 項${c.cancelled?`、中斷 ${c.cancelled} 項`:''}`}
 else if(exit!==0){status='ERROR';note='沒有失敗的測試，但 node --test 回傳 exit '+exit}
 else {status='PASS';note=`${c.tests} 項：通過 ${c.pass}${c.todo?`、暫緩 ${c.todo}`:''}${c.skipped?`、略過 ${c.skipped}`:''}`}
 return {status,note,counts:c,failed:[...new Set(failed)].slice(0,50),todo,skipped};
}

function summarize(r){
 const st=r.stages,has=s=>st.some(x=>x.status===s),list=s=>st.filter(x=>x.status===s).map(x=>x.name);
 let overall,text;
 if(has('FAIL')){overall='FAIL';text='有失敗：'+list('FAIL').join('、')}
 else if(has('ERROR')){overall='ERROR';text='測試工具出錯，沒有結果可以判斷：'+list('ERROR').join('、')}
 else if(has('NOT_RUN')){overall='NOT_RUN';text='沒有完整跑完，未測試：'+list('NOT_RUN').join('、')+(has('SKIP')?'；略過：'+list('SKIP').join('、'):'')}
 else if(has('SKIP')){overall='PARTIAL';text='跑了的都通過，但有略過：'+list('SKIP').join('、')}
 else if(st.length){overall='PASS';text='全部通過'}
 else {overall='ERROR';text='沒有任何階段的結果'}
 const todo=st.flatMap(x=>(x.todo||[]).map(t=>x.name+'：'+t));
 if(todo.length&&overall!=='FAIL'&&overall!=='ERROR')text+=`（另有暫緩 ${todo.length} 項）`;
 // exit code：失敗、出錯 → 1；完整模式缺階段 → 1；CI 上完整模式不准略過 → 1
 const ci=!!process.env.CI&&process.env.CI!=='false';
 let exit=0;
 if(overall==='FAIL'||overall==='ERROR')exit=1;
 else if(overall==='NOT_RUN'&&r.mode==='full')exit=1;
 else if(overall==='PARTIAL'&&r.mode==='full'&&ci)exit=1;
 return {overall,overallZh:ZH[overall]||'部分通過',text,todo,exit,warnings:st.flatMap(x=>(x.warnings||[]).map(w=>x.name+'：'+w))};
}

function md(rep){
 const g=rep.game,L=[];
 L.push(`## 零號病例 測試報告：${rep.summary.text}`,'');
 L.push(`- 模式：${rep.mode==='full'?'完整':'FAST'}　遊戲 v${g.version}／Build ${g.build}　commit ${(rep.commit||'').slice(0,7)}${rep.dirty?'（有未提交修改）':''}`);
 if(rep.args&&rep.args.seed!=null)L.push(`- 種子：${rep.args.seed}（重現：\`QA_SEED=${rep.args.seed} bash tests/run_all.sh full ${rep.args.smokeSteps||40} ${rep.args.longSteps||480}\`）`);
 L.push(`- index.html SHA-256：\`${g.sha256}\``,`- 開始 ${rep.started}　結束 ${rep.finished}　共 ${rep.seconds} 秒`,'');
 L.push('| 階段 | 狀態 | 秒 | 說明 |','|---|---|---|---|');
 for(const s of rep.stages)L.push(`| ${s.name} | ${ZH[s.status]}（${s.status}） | ${s.seconds} | ${String(s.note||'').replace(/\|/g,'／')} |`);
 if(rep.summary.warnings.length){L.push('','**警告**');for(const w of rep.summary.warnings)L.push('- '+w)}
 if(rep.summary.todo.length){L.push('','**暫緩（TODO）**');for(const t of rep.summary.todo)L.push('- '+t)}
 for(const s of rep.stages)if(s.failed&&s.failed.length){L.push('',`**${s.name} 失敗項目**`);for(const f of s.failed.slice(0,20))L.push('- '+f)}
 return L.join('\n')+'\n';
}

function cli(cmd,a){
if(cmd==='init'){
 fs.mkdirSync(OUT,{recursive:true});
 for(const f of ['report.json','report.md','node-tap.txt'])fs.rmSync(path.join(OUT,f),{force:true});
 const mode=a[0]==='fast'?'fast':'full';
 save({schema:1,mode,args:{smokeSteps:a[1]?+a[1]:null,longSteps:a[2]?+a[2]:null,seed:process.env.QA_SEED!=null&&process.env.QA_SEED!==''?+process.env.QA_SEED:null},t0:Date.now(),started:taipei(),stages:[]});
}else if(cmd==='node'){
 const [file,exit,sec]=a,r=load();
 const txt=fs.existsSync(file)?fs.readFileSync(file,'utf8'):'';
 const p=parseTap(txt,+exit);
 r.stages.push({id:'node',name:'Node 邏輯測試',status:p.status,seconds:+(+sec).toFixed(1),note:p.note,counts:p.counts,failed:p.failed,todo:p.todo,skipped:p.skipped});
 save(r);console.log(`[${p.status}] Node 邏輯測試：${p.note}`);for(const f of p.failed.slice(0,20))console.log('  失敗：'+f);for(const t of p.todo)console.log('  暫緩：'+t);
}else if(cmd==='stage'){
 const [id,name,status,sec,note,detailFile]=a,r=load();
 if(!STATUS.includes(status)||status==='TODO')throw new Error('階段狀態只能是 PASS／FAIL／SKIP／NOT_RUN／ERROR：'+status);
 const s={id,name,status,seconds:+(+sec||0).toFixed(1),note:note||''};
 if(detailFile&&fs.existsSync(detailFile)){try{const d=JSON.parse(fs.readFileSync(detailFile,'utf8'));s.detail=d;if(d.warnings)s.warnings=d.warnings;if(d.failed)s.failed=d.failed}catch(e){s.status='ERROR';s.note+='（細節檔讀不出來：'+e.message+'）'}}
 else if(detailFile&&(status==='PASS'||status==='FAIL')){s.status='ERROR';s.note+='（沒有產生細節檔 '+path.basename(detailFile)+'）'}
 r.stages.push(s);save(r);console.log(`[${s.status}] ${name}${s.note?'：'+s.note:''}`);for(const w of s.warnings||[])console.log('  警告：'+w);
}else if(cmd==='finish'){
 const r=load();
 const rep={schema:1,tool:'tests/run_all.sh',mode:r.mode,args:r.args,started:r.started,finished:taipei(),seconds:Math.round((Date.now()-r.t0)/100)/10,
  game:gameMeta(),commit:git('rev-parse HEAD')||process.env.GITHUB_SHA||null,branch:process.env.GITHUB_HEAD_REF||git('rev-parse --abbrev-ref HEAD'),dirty:!!git('status --porcelain'),
  ci:process.env.GITHUB_ACTIONS?{run:process.env.GITHUB_RUN_ID,event:process.env.GITHUB_EVENT_NAME,base:process.env.GITHUB_BASE_REF||null}:null,
  env:{node:process.version,playwright:pwVersion(),platform:process.platform},stages:r.stages};
 rep.summary=summarize(r);
 fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(rep,null,1));
 const m=md(rep);fs.writeFileSync(path.join(OUT,'report.md'),m);
 if(process.env.GITHUB_STEP_SUMMARY)try{fs.appendFileSync(process.env.GITHUB_STEP_SUMMARY,m)}catch(e){}
 console.log(`== 總結（${rep.mode==='full'?'完整':'FAST'} 模式）：${rep.summary.text}`);
 console.log(`   報告：${path.relative(ROOT,path.join(OUT,'report.json'))}　v${rep.game.version}／Build ${rep.game.build}　SHA-256 ${rep.game.sha256}`);
 process.exit(rep.summary.exit);
}else{console.error('用法見檔案開頭');process.exit(2)}
}
if(require.main===module)cli(process.argv[2],process.argv.slice(3));
module.exports={parseTap,summarize};
