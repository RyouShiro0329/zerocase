const {game}=require('/home/claude/zerocase/tests/helpers/audio-game.cjs');
const g=game();
const roots=g.run('({N,EVPOOL,XPL:typeof XPL!=="undefined"?XPL:null,HAZ})');
const seen=new Set(),res=[];
function walk(o,path){if(!o||typeof o!=='object'||seen.has(o))return;seen.add(o);
 if(o.qte&&typeof o.qte==='object')res.push({path,t:(o.qte.t||'').slice(0,40),ok:JSON.stringify(o.qte.ok&&(o.qte.ok.p||o.qte.ok.r||o.qte.ok.go)||''),ng:JSON.stringify(o.qte.ng&&{p:o.qte.ng.p,r:o.qte.ng.r,go:o.qte.ng.go,fight:o.qte.ng.fight})});
 for(const k of Object.keys(o)){let v;try{v=o[k]}catch(e){continue}if(k==='qte')continue;walk(v,path+'.'+k)}}
for(const [k,v] of Object.entries(roots))walk(v,k);
console.log(res.length);for(const r of res)console.log(r.path,'|',r.t,'|ok',r.ok,'|ng',r.ng);
