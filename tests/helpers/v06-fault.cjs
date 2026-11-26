// 只在 V06 測試頁使用。G.busy 是持續鎖；遊戲的正常賦值不會解除。
function installBusyFault(){
 if(typeof G==='undefined'||!G)return {installed:false,reason:'遊戲尚未建立'};
 let s=window.__qaV06;
 if(!s||s.target!==G){s={target:G,original:Object.getOwnPropertyDescriptor(G,'busy'),initialBusy:typeof busy==='undefined'?null:busy,writes:0,installs:0};s.get=()=>1;s.set=value=>{s.writes++;s.lastWrite=value};window.__qaV06=s}
 const d=Object.getOwnPropertyDescriptor(G,'busy');
 if(!d||d.get!==s.get||d.set!==s.set){Object.defineProperty(G,'busy',{enumerable:true,configurable:true,get:s.get,set:s.set});s.installs++}
 if(typeof busy!=='undefined')busy=true;
 return {installed:true,installs:s.installs};
}
function readBusyFault(){
 const game=typeof G==='undefined'?null:G,s=window.__qaV06,d=game&&Object.getOwnPropertyDescriptor(game,'busy');
 return {ready:!!(game&&s&&s.target===game&&d&&d.get===s.get&&d.set===s.set&&game.busy===1&&!game.over),busy:typeof busy==='undefined'?null:!!busy,gbusy:game?game.busy:null,phase:game&&game.phase,node:game&&game.node,over:game?!!game.over:null,writes:s?s.writes:0,lastWrite:s&&s.lastWrite,installs:s?s.installs:0};
}
async function ensureBusyFault(page,maxAttempts=3){
 const attempts=[];
 for(let i=1;i<=maxAttempts;i++){
  const installed=await page.evaluate(installBusyFault);
  const readback=await page.evaluate(readBusyFault); // 分開讀回，不能拿注入函式的傳回值當證明。
  attempts.push({attempt:i,installed,readback});
  if(readback.ready)return {attempts,state:readback};
 }
 const error=new Error('V06 故障注入讀回不符，不能開始測量');error.attempts=attempts;throw error;
}
module.exports={installBusyFault,readBusyFault,ensureBusyFault};
