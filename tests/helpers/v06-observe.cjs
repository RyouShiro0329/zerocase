// 僅供隔離診斷：保留等待條件的傳回值，在條件成立時記錄當下狀態。
const fs=require('node:fs'),path=require('node:path');
const {chromium}=require('playwright');
const launch=chromium.launch.bind(chromium);
chromium.launch=async(...args)=>{
 const browser=await launch(...args),newContext=browser.newContext.bind(browser);
 browser.newContext=async(options)=>{
  const context=await newContext(options),pages=[],newPage=context.newPage.bind(context),close=context.close.bind(context);
  context.newPage=async(...args)=>{
   const page=await newPage(...args),wait=page.waitForFunction.bind(page);pages.push(page);
   page.waitForFunction=async(fn,arg,options)=>{
    if(typeof fn==='function'&&fn.toString().replace(/\s/g,'').includes('G.over||(!busy&&!G.busy)')){
     return wait(()=>{const result=G.over||(!busy&&!G.busy);
      if(result){(window.__v06WaitHits||(window.__v06WaitHits=[])).push({at:performance.now(),busy:!!busy,gbusy:!!G.busy,phase:G.phase,node:G.node,fight:!!G.fight,over:!!G.over,queue:typeof RQ==='undefined'?null:RQ.length});}
      return result;
     },arg,options);
    }
    return wait(fn,arg,options);
   };
   return page;
  };
  context.close=async(...args)=>{
   const observations=[];
   for(const page of pages){try{observations.push(await page.evaluate(()=>({hits:window.__v06WaitHits||[],last:typeof G==='undefined'||!G?null:{busy:!!busy,gbusy:!!G.busy,phase:G.phase,node:G.node,fight:!!G.fight,over:!!G.over}})))}catch(e){observations.push({error:e.message})}}
   fs.mkdirSync('out',{recursive:true});fs.writeFileSync(path.join('out',`observation-${options.viewport.width}x${options.viewport.height}.json`),JSON.stringify({viewport:options.viewport,observations},null,2));
   return close(...args);
  };
  return context;
 };
 return browser;
};
