// 正式 QA-10。重現單局：node tests/balance.cjs --count 1 --start <seed> [--actions 500]
const fs=require('node:fs'),path=require('node:path');
const {source}=require('./helpers/deep-report.cjs');
const {simulate,aggregate}=require('./helpers/deep-sim.cjs');
async function run({count=5,start=1,maxActions=500,out=process.env.QA_OUT||'test-results/deep-pilot',faultSeed=null}={}){
 for(const [k,v,min,max] of [['count',count,1,10000],['start',start,0,4294967295],['maxActions',maxActions,20,10000]])if(!Number.isInteger(v)||v<min||v>max)throw Error(k+' 超出允許範圍');if(start+count>4294967296)throw Error('種子範圍不可溢位');
 fs.mkdirSync(out,{recursive:true});const t=performance.now(),runs=[],game=source();
 for(let i=0;i<count;i++){const row=await simulate(start+i,{maxActions,faultSeed});row.sourceSha256=game.sha256;row.reproduce='node tests/balance.cjs --count 1 --start '+row.seed+' --actions '+maxActions;runs.push(row);fs.writeFileSync(path.join(out,'seed-'+row.seed+'.json'),JSON.stringify(row,null,2));console.log(JSON.stringify({seed:row.seed,result:row.result,actions:row.actions,seconds:row.seconds,errors:row.errors.length}));}
 const report={schema:1,tool:'QA-10',game,options:{count,start,maxActions,reactionSuccess:.7,password:'取消',godmode:false},seconds:+((performance.now()-t)/1000).toFixed(3),...aggregate(runs),status:runs.every(r=>r.status==='PASS')?'PASS':'FAIL',runs};
 fs.writeFileSync(path.join(out,'balance.json'),JSON.stringify(report,null,2));return report;
}
if(require.main===module){const a=process.argv.slice(2),arg=(n,d)=>a.includes(n)?Number(a[a.indexOf(n)+1]):d;if(a.includes('--hazards'))require('./deep-hazards.cjs');else run({count:arg('--count',5),start:arg('--start',1),maxActions:arg('--actions',500)}).then(r=>{console.log(JSON.stringify({status:r.status,seeds:r.seeds,seconds:r.seconds,deathRate:r.deathRate,averageSurvivalActions:r.averageSurvivalActions,stuck:r.stuck,errors:r.errors}));process.exitCode=r.status==='PASS'?0:1}).catch(e=>{console.error(e.stack);process.exitCode=3})}
module.exports={run};
