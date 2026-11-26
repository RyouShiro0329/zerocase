const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const {ROOT}=require('../helpers/fixed-scenes.cjs');
async function setupContext(ctx){
 fs.mkdirSync(process.env.QA_OUT||'test-results',{recursive:true});
 await ctx.addInitScript({path:path.join(__dirname,'mock.js')});
 await ctx.addInitScript(()=>{window.__G=()=>G;window.__act=a=>act(a);window.__me=()=>me()});
 await ctx.route('**/*',r=>{const u=new URL(r.request().url());if(u.origin!=='http://mp.invalid')return r.abort();const f=path.resolve(ROOT,'.'+decodeURIComponent(u.pathname));if(f.startsWith(ROOT+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({path:f});return r.fulfill({status:404,body:'404'})});
}
function validate(R){
 const checks=[];const check=(name,fn)=>{try{fn();checks.push({name,ok:true})}catch(e){checks.push({name,ok:false,note:e.message})}};
 check('正常同步、演出中點按作廢',()=>{const n=R.normal;assert.equal(n.clientQueuedActs,0);assert.equal(n.hostPendAfter,'{}');assert.ok(n.hostStageMs>=1000&&n.hostStageMs<8000);assert.ok(Math.abs(n.clientUnlockLagMs)<2000);assert.ok(n.hostImgMs>=0&&n.clientImgMs>=0);assert.deepEqual(n.errs,[])});
 check('延遲隊友從目前進度接續、不拖住房主',()=>{const d=R.delayed;assert.ok(d.clientFirstSeenAfterHostMs>=900);assert.ok(d.clientFirstViewMs>=700);assert.equal(d.clientIds,1);assert.ok(d.hostStageMs<8000);assert.deepEqual(d.errs,[])});
 check('房主交接、不重複加入敵人或先攻',()=>{const h=R.handover;assert.equal(h.after.foes,h.foesDuringStage);assert.equal(h.after.orderFoes,h.after.foes);assert.equal(h.after.stg,false);assert.equal(h.after.phase,'fight');assert.ok(h.hostLeftToNewHostMs<20000);assert.deepEqual(h.errs,[])});
 return checks;
}
function finish(R){const checks=validate(R);const detail={checks,observations:R,failed:checks.filter(c=>!c.ok).map(c=>c.name+'：'+c.note)};fs.writeFileSync(path.join(process.env.QA_OUT||'test-results','multiplayer.json'),JSON.stringify(detail,null,1));checks.forEach(c=>console.log((c.ok?'通過':'失敗')+' '+c.name+(c.note?' '+c.note:'')));process.exitCode=detail.failed.length?1:0}
module.exports={setupContext,finish,validate};
