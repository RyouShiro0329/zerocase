// 調查用，不修正遊戲／測試。每輪保留原 V06 的故障注入、參數及判定。
const fs=require('node:fs'),path=require('node:path'),os=require('node:os'),crypto=require('node:crypto'),{spawn,execFileSync}=require('node:child_process');
const root=path.resolve(process.env.SOURCE_ROOT||'.'),out=path.resolve(process.env.DIAG_OUT||'test-results/v06-investigation');
const rounds=Number(process.env.DIAG_ROUNDS||20),paired=process.env.DIAG_PAIRED==='1',observed=process.env.DIAG_OBSERVED==='1';
const hash=b=>crypto.createHash('sha256').update(b).digest('hex');
const original=fs.readFileSync(path.join(root,'index.html'),'utf8');
const observer=path.join(__dirname,'observe.cjs');
const fault6="setInterval(()=>{try{if(typeof G!=='undefined'&&G&&G.phase==='node')busy=true}catch(e){}},20)";
const fault10="window.addEventListener('click',e=>{try{if(typeof G!=='undefined'&&G&&G.phase==='node'&&e.target.closest&&e.target.closest('#choices'))e.stopImmediatePropagation()}catch(x){}},true)";
fs.mkdirSync(out,{recursive:true});
const summary={started:new Date().toISOString(),sourceCommit:execFileSync('git',['rev-parse','HEAD'],{cwd:root,encoding:'utf8'}).trim(),sourceSha256:hash(original),playwright:require('playwright/package.json').version,node:process.version,chromium:execFileSync(require('playwright').chromium.executablePath(),['--version'],{encoding:'utf8'}).trim(),paired,observed,rounds,results:[]};
function make(dir,fault){
 fs.mkdirSync(path.join(dir,'tests'),{recursive:true});
 fs.cpSync(path.join(root,'tests/helpers'),path.join(dir,'tests/helpers'),{recursive:true});
 fs.copyFileSync(path.join(root,'tests/browser-smoke.cjs'),path.join(dir,'tests/browser-smoke.cjs'));
 for(const asset of ['img','sfx','fx','fonts'])fs.symlinkSync(path.join(root,asset),path.join(dir,asset),'dir');
 if(original.split('</body></html>').length!==2)throw Error('故障注入位置不唯一');
 fs.writeFileSync(path.join(dir,'index.html'),original.replace('</body></html>','<script>'+fault+'</script></body></html>'));
}
function run(dir,v06){return new Promise((resolve,reject)=>{
 const fd=fs.openSync(path.join(dir,'out.log'),'w');
 const args=['300',process.execPath,...(v06&&observed?['-r',observer]:[]),'tests/browser-smoke.cjs',v06?'6':'15'];
 const child=spawn('timeout',args,{cwd:dir,env:{...process.env,QA_SERVE:'route',QA_OUT:'out',QA_DETAIL:'out/smoke.json',QA_SEED:'1',QA_STUCK:v06?'99':'5',...(v06?{QA_WAIT_MS:'800'}:{})},stdio:['ignore',fd,fd]});fs.closeSync(fd);
 child.once('error',reject);child.once('exit',(code,signal)=>{fs.writeFileSync(path.join(dir,'out.exit'),String(code));resolve({code,signal})});
})}
(async()=>{
 for(let round=1;round<=rounds;round++){
  const dir=path.join(out,String(round).padStart(2,'0')),d6=path.join(dir,'v06'),d10=path.join(dir,'v10');make(d6,fault6);if(paired)make(d10,fault10);
  const start=Date.now();const [exit6,exit10]=await Promise.all([run(d6,true),paired?run(d10,false):Promise.resolve(null)]);
  let result;
  try{const detail=JSON.parse(fs.readFileSync(path.join(d6,'out/smoke.json')));
   const traces=fs.readdirSync(path.join(d6,'out')).filter(f=>/^trace-.*\.json$/.test(f)).length;
   // 和 tests/qa-selfcheck.sh V06 的 A、E、T6 條件完全相同。
   const predicate=detail.views.every(v=>v.run&&v.run.timeouts>=5&&!v.run.stuck)&&detail.checks.filter(c=>/等待逾時/.test(c.name)).every(c=>!c.ok);
   const ok=exit6.code===1&&predicate&&traces===3;
   result={round,status:ok?'通過':'失敗',exit6,exit10,predicate,traces,seconds:(Date.now()-start)/1000,views:detail.views.map(v=>({viewport:v.viewport,steps:v.steps,run:v.run,screen:v.screen,errors:v.errors.required})),failed:detail.failed};
  }catch(e){result={round,status:'未測試',exit6,exit10,error:e.stack,seconds:(Date.now()-start)/1000};}
  summary.results.push(result);fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log(JSON.stringify(result));
 }
 summary.finished=new Date().toISOString();summary.counts={pass:summary.results.filter(r=>r.status==='通過').length,fail:summary.results.filter(r=>r.status==='失敗').length,notRun:summary.results.filter(r=>r.status==='未測試').length};
 summary.sourceDirty=execFileSync('git',['status','--porcelain'],{cwd:root,encoding:'utf8'}).trim();
 fs.writeFileSync(path.join(out,'summary.json'),JSON.stringify(summary,null,2));console.log('診斷完成 '+JSON.stringify(summary.counts));
 // 已觀察到 V06 失敗也算完成調查；診斷工具缺少資料才讓工作流程失敗。
 process.exitCode=summary.counts.notRun||summary.sourceDirty?1:0;
})().catch(e=>{console.error(e.stack);process.exitCode=3});
