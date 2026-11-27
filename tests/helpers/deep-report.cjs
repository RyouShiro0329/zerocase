const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),{execFileSync}=require('node:child_process');
const {readSourceVersion}=require('./source-version.cjs'),{summarize}=require('./test-reporter.cjs');
const ROOT=path.resolve(__dirname,'../..'),STATUS=['PASS','FAIL','SKIP','NOT_RUN','ERROR','TODO'];
const ZH={PASS:'通過',FAIL:'失敗',SKIP:'略過',NOT_RUN:'未測試',ERROR:'測試工具出錯',TODO:'暫緩'};
function taipei(){return new Date(Date.now()+8*3600000).toISOString().slice(0,19)+'+08:00'}
function git(...a){try{return execFileSync('git',a,{cwd:ROOT,encoding:'utf8',stdio:['ignore','pipe','ignore']}).trim()}catch{return null}}
function source(){const bytes=fs.readFileSync(path.join(ROOT,'index.html')),v=readSourceVersion(bytes);return {version:v.v,build:v.b,versionTime:v.t,sha256:crypto.createHash('sha256').update(bytes).digest('hex'),bytes:bytes.length}}
function save(report,out){
 for(const s of report.stages)if(!STATUS.includes(s.status))throw Error('未知測試狀態 '+s.status);
 report.summary=summarize({...report,mode:'full'});if(report.summary.overall==='PARTIAL'||report.summary.overall==='PASS'&&(!report.finished||!report.stages.every(s=>s.status==='PASS'))){report.summary.overall='NOT_RUN';report.summary.text='尚有未完成的必要階段'}report.summary.overallZh=ZH[report.summary.overall];report.summary.exit=report.finished&&report.stages.length&&report.stages.every(s=>s.status==='PASS')?0:1;
 fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'report.json'),JSON.stringify(report,null,2));
 const lines=['# 零號病例 DEEP 測試報告','',`遊戲 v${report.game.version}／Build${report.game.build}；commit ${report.commit}；${report.started}`,`index.html SHA-256：\`${report.game.sha256}\``,'',`結果：${ZH[report.summary.overall]}；耗時 ${report.seconds||0} 秒。`,'','| 階段 | 狀態 | 秒數 | 說明 |','|---|---|---:|---|'];
 for(const s of report.stages)lines.push(`| ${s.name} | ${ZH[s.status]} | ${s.seconds} | ${String(s.note||'').replace(/\|/g,'／').replace(/\n/g,' ')} |`);
 const o=report.observations||{};
 if(o.balance){const b=o.balance;lines.push('','種子模擬：',`- ${b.seeds} 個種子（${b.start}～${b.last}），耗時 ${b.seconds} 秒。`,`- 死亡 ${b.deaths} 局（${(b.deathRate*100).toFixed(2)}%），平均存活動作 ${b.averageSurvivalActions.toFixed(2)}，達動作上限 ${b.capped} 局。`,`- 平均值包含達上限的截尾樣本；策略為隨機選項、普通攻擊與基本物資照護，QTE 反應模型 70%、密碼取消，沒有無敵。這不是實際玩家死亡率。`,'','| 死亡地點 | 局數 |','|---|---:|');const names=new Map((b.places||[]).map(p=>[p.area+'/'+p.node,(p.areaName||p.area)+'／'+(p.nodeName||p.node)]));for(const [key,n] of Object.entries(b.deathLocations).sort((a,b)=>b[1]-a[1]))lines.push(`| ${String(names.get(key)||key).replace(/\|/g,'／')}（${key}） | ${n} |`)}
 if(o.endings)lines.push('',`結局覆蓋：${o.endings.terminalCompleted}/${o.endings.terminalPlanned} 終局情境；地點轉場 ${o.endings.transitionCompleted}/${o.endings.transitionPlanned}。`);
 if(o.resources?.assessment){lines.push('','資源穩定性：',`- 觀察 ${o.resources.observedSeconds.toFixed(1)} 秒，${o.resources.cycles} 循環、${o.resources.samples} 份 GC 後樣本；比較前三筆與最後三筆中位數增量。`,'','| 指標 | 起始中位數 | 結束中位數 | 增量 | 失敗門檻 | 每秒斜率 |','|---|---:|---:|---:|---:|---:|');const names={heapBytes:'JS heap（bytes）',timers:'計時器（含動畫幀）',listeners:'事件監聽器',nodes:'DOM 節點'};for(const [key,m] of Object.entries(o.resources.assessment.metrics))lines.push(`| ${names[key]||key} | ${m.first} | ${m.last} | ${m.growth} | ${m.limit} | ${m.slopePerSecond.toFixed(3)} |`)}
 if(o.performance){lines.push('','效能只記錄，不設速度失敗門檻。使用 844×390、正常播放速度與本機靜態資源路由，不包含網路延遲。','','| 指標 | 毫秒 |','|---|---:|');const names={navigationMs:'頁面載入',gateToMenuMs:'入口到主選單',menuToRosterMs:'主選單到角色頁',newGameReadyMs:'開局到可操作',encounterReadyMs:'戰鬥進場到可操作',combatInputToActionMs:'戰鬥按下到動作開始',combatSettleMs:'戰鬥動作到空閒'};for(const [key,v] of Object.entries(o.performance))lines.push(`| ${names[key]||key} | ${v} |`)}
 if(report.findings.length){lines.push('','發現的問題（本工具不修遊戲）：');for(const f of report.findings)lines.push('- '+f.replace(/\n/g,' ').slice(0,600))}
 const md=lines.join('\n')+'\n';fs.writeFileSync(path.join(out,'report.md'),md);return md;
}
module.exports={ROOT,STATUS,ZH,taipei,git,source,save};
