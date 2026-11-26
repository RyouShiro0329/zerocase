// 僅 V06 子程序以 -r 載入；不改原 browser-smoke.cjs 或 driver.cjs。
const Module=require('node:module'),fs=require('node:fs'),path=require('node:path');
const {ensureBusyFault,readBusyFault}=require('./v06-fault.cjs');
const load=Module._load;
Module._load=function(id,parent,...rest){
 const value=load.call(this,id,parent,...rest);
 if(/(?:^|\/)helpers\/driver\.cjs$/.test(id)&&value&&value.tracker&&!value.__v06Wrapped){
  value.__v06Wrapped=true;const tracker=value.tracker;
  value.tracker=function(...args){
   const T=tracker(...args),sig=T.sig,wait=T.wait;
   const detail={tracker:args[0],injections:[],waits:[]};
   const save=()=>{const out=path.resolve(process.env.QA_OUT||'test-results');fs.mkdirSync(out,{recursive:true});fs.writeFileSync(path.join(out,'v06-state-'+args[0]+'.json'),JSON.stringify(detail,null,2))};
   const ensure=async p=>{try{const r=await ensureBusyFault(p);detail.injections.push(r);save();return r.state}catch(e){detail.error={message:e.message,attempts:e.attempts};save();throw e}};
   T.sig=async p=>{await ensure(p);return sig(p)}; // 第一次指紋位於第一個操作之前，先完成注入就緒確認。
   T.wait=async(p,...args)=>{
    const before=await ensure(p),r=await wait(p,...args),after=await p.evaluate(readBusyFault);
    detail.waits.push({step:detail.waits.length,ms:r.ms,timeout:r.to,before,after});save();return r;
   };
   return T;
  };
 }
 return value;
};
