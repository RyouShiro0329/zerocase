const test=require('node:test'),assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs'),os=require('node:os'),path=require('node:path');
const {ensureBusyFault,readBusyFault}=require('./helpers/v06-fault.cjs');
function page({drop=0,game=true}={}){
 const state={window:{},G:game?{busy:0,phase:'node',node:'A1',over:null}:null,busy:false};vm.createContext(state);let installed=0;
 return {state,get installed(){return installed},async evaluate(fn){const r=vm.runInContext('('+fn.toString()+')()',state);if(fn.name==='installBusyFault'&&++installed<=drop&&state.G)vm.runInContext("Object.defineProperty(G,'busy',{value:0,writable:true,configurable:true})",state);return r}};
}
test('V06：正常清除與跨階段不解除故障，讀回仍保持忙碌',async()=>{
 const p=page();await ensureBusyFault(p);vm.runInContext("busy=false;G.busy=0;G.phase='fight'",p.state);
 const r=await p.evaluate(readBusyFault);assert.equal(r.busy,false);assert.equal(r.gbusy,1);assert.equal(r.ready,true);assert.equal(r.writes,1);
});
test('V06：注入讀回失效會重注入，持續失效或遊戲未建立不能算成功',async()=>{
 const p=page({drop:1}),r=await ensureBusyFault(p);assert.equal(p.installed,2);assert.equal(r.attempts[0].readback.ready,false);assert.equal(r.state.ready,true);
 for(const q of [page({drop:99}),page({game:false})])await assert.rejects(ensureBusyFault(q),e=>e.attempts.length===3&&/讀回不符/.test(e.message));
});
test('自我驗收證據：保留等待／狀態／日誌，排除素材與符號連結',()=>{
 const root=fs.mkdtempSync(path.join(os.tmpdir(),'v06-evidence-'));
 try{const src=path.join(root,'src'),dst=path.join(root,'dst');fs.mkdirSync(path.join(src,'v06/out'),{recursive:true});fs.mkdirSync(path.join(src,'v06/img'));
 fs.writeFileSync(path.join(src,'v06/out/state.json'),JSON.stringify({ms:801,busy:false,gbusy:1}));fs.writeFileSync(path.join(src,'v06/out.log'),'failure');fs.writeFileSync(path.join(src,'tool.log'),'root failure');fs.writeFileSync(path.join(src,'v06/img/unwanted.json'),'asset');fs.symlinkSync(path.join(src,'v06/out/state.json'),path.join(src,'v06/leak.json'));
 const r=require('./helpers/selfcheck-evidence.cjs').preserve(src,dst,{all:true});assert.equal(r.files.length,3);assert.equal(fs.readFileSync(path.join(dst,'tool.log'),'utf8'),'root failure');assert.equal(JSON.parse(fs.readFileSync(path.join(dst,'v06/out/state.json'))).gbusy,1);assert(!fs.existsSync(path.join(dst,'v06/img')));assert(!fs.existsSync(path.join(dst,'v06/leak.json')));
 }finally{fs.rmSync(root,{recursive:true,force:true})}
});
test('V06-proof：缺步數或故障被解除的證據必須失敗',()=>{
 const out=fs.mkdtempSync(path.join(os.tmpdir(),'v06-proof-'));
 try{const check=require('./helpers/selfcheck-evidence.cjs').verifyV06;assert.equal(check(out),false);
 const valid=()=>({ms:801,before:{ready:true,gbusy:1},after:{ready:true,gbusy:1}});
 const save=waits=>{for(const view of ['393','844','1280'])fs.writeFileSync(path.join(out,'v06-state-'+view+'.json'),JSON.stringify({waits}))};
 save(Array.from({length:6},valid));assert.equal(check(out),true);
 save(Array.from({length:5},valid));assert.equal(check(out),false);
 const waits=Array.from({length:6},valid);waits[2].after.gbusy=0;save(waits);assert.equal(check(out),false);
 }finally{fs.rmSync(out,{recursive:true,force:true})}
});
