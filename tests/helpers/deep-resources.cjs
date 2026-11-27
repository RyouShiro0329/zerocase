// 僅觀察測試頁的計時器；事件監聽器、DOM 與 JS heap 由 Chromium CDP 在 GC 後讀取，避免自行保留節點。
function timerProbe(){
 const pending=new Map(),frames=new Set(),original={setTimeout:window.setTimeout,setInterval:window.setInterval,clearTimeout:window.clearTimeout,clearInterval:window.clearInterval,raf:window.requestAnimationFrame,caf:window.cancelAnimationFrame};
 const wrap=interval=>function(fn,ms,...args){let id;const callback=function(...a){if(!interval)pending.delete(id);return typeof fn==='function'?fn.apply(this,a):(0,eval)(String(fn))};id=original[interval?'setInterval':'setTimeout'].call(window,callback,ms,...args);pending.set(id,interval?'interval':'timeout');return id};
 window.setTimeout=wrap(false);window.setInterval=wrap(true);
 for(const name of ['clearTimeout','clearInterval'])window[name]=id=>{pending.delete(id);return original[name].call(window,id)};
 window.requestAnimationFrame=fn=>{let id;id=original.raf.call(window,t=>{frames.delete(id);fn(t)});frames.add(id);return id};window.cancelAnimationFrame=id=>{frames.delete(id);return original.caf.call(window,id)};
 window.__qaTimerCounts=()=>({timeouts:[...pending.values()].filter(v=>v==='timeout').length,intervals:[...pending.values()].filter(v=>v==='interval').length,frames:frames.size});
}
const LIMITS={heapBytes:8*1024*1024,timers:4,listeners:16,nodes:200};
function assess(samples,limits=LIMITS){
 if(samples.length<6)throw Error('穩定性至少需要六個 GC 後樣本');
 const n=Math.min(3,Math.floor(samples.length/2)),median=a=>a.sort((x,y)=>x-y)[Math.floor(a.length/2)],metrics={};
 for(const key of Object.keys(limits)){
  const first=median(samples.slice(0,n).map(s=>s[key])),last=median(samples.slice(-n).map(s=>s[key])),growth=last-first;
  const x=samples.map(s=>s.elapsed),y=samples.map(s=>s[key]),xm=x.reduce((a,b)=>a+b)/x.length,ym=y.reduce((a,b)=>a+b)/y.length,den=x.reduce((a,b)=>a+(b-xm)**2,0);
  const slope=den?x.reduce((a,b,i)=>a+(b-xm)*(y[i]-ym),0)/den:0;
  const breaches=samples.slice(-n).filter(s=>s[key]-first>limits[key]).length;
  metrics[key]={first,last,growth,limit:limits[key],slopePerSecond:slope,breaches,ok:growth<=limits[key]};
 }
 return {ok:Object.values(metrics).every(m=>m.ok),metrics};
}
async function sample(session,page,elapsed,cycle){
 await session.send('HeapProfiler.collectGarbage');const [heap,dom,timers]=await Promise.all([session.send('Runtime.getHeapUsage'),session.send('Memory.getDOMCounters'),page.evaluate(()=>__qaTimerCounts())]);
 return {elapsed,cycle,heapBytes:heap.usedSize,backingStorageBytes:heap.backingStorageSize??null,nodes:dom.nodes,documents:dom.documents,listeners:dom.jsEventListeners,timers:timers.timeouts+timers.intervals+timers.frames,timerDetails:timers};
}
module.exports={timerProbe,LIMITS,assess,sample};
