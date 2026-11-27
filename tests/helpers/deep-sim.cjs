// QA-10：完整引擎、無無敵；略過畫面／聲音延遲，反應模型固定 70%，密碼一律取消。
const vm=require('node:vm');
const {load}=require('./game-vm.cjs');
function rng(seed){let a=seed>>>0;return()=>{a=(a+0x6D2B79F5)>>>0;let t=a;t=Math.imul(t^(t>>>15),t|1);t^=t+Math.imul(t^(t>>>7),t|61);return((t^(t>>>14))>>>0)/4294967296}}
async function deadline(p,ms=2000){let id;try{return await Promise.race([p,new Promise((_,reject)=>{id=setTimeout(()=>reject(Object.assign(Error('動作超過工具看門狗期限'),{stuck:true})),ms)})])}finally{clearTimeout(id)}}
async function simulate(seed,{maxActions=500,faultSeed=null}={}){
 const start=performance.now(),g=load(),errors=[],choose=rng(seed^0x9e3779b9),reaction=rng(seed^0x51ed270b),random=rng(seed);
 g.c.Math=Object.create(Math);g.c.Math.random=random;g.c.crypto={getRandomValues:a=>{for(let i=0;i<a.length;i++)a[i]=seed>>>0;return a}};
 g.c.Date=class extends Date{constructor(...a){super(...(a.length?a:[1795737600000]))}static now(){return 1795737600000}};
 g.c.console={log(){},warn(){},error:(...a)=>errors.push(a.map(String).join(' '))};g.c.__qaReaction=()=>reaction()<.7;
 g.c.setTimeout=()=>0;g.c.clearTimeout=()=>{};
 const run=src=>deadline(vm.runInContext(src,g.c,{timeout:1000}));
 const row={seed,gameSeed:null,status:'PASS',actions:0,result:null,node:null,area:null,death:null,stuck:0,errors:[],trace:[]};let same=0,last='';
 try{
  await run(`UI.snd=0;UI.bgm=0;UI.spd=.3;MYPID='p1';ROLE='solo';draw=()=>{};push=()=>{};flush=async()=>{};E=()=>{};out=(t,k)=>LOG.push([String(t),k||'']);showDice=async()=>{};showChapter=async()=>{};encounter=async()=>{};sndW=async()=>0;qte=async()=>__qaReaction();askCode=async()=>'';
   newRun([{kind:'maggie',pid:'p1',name:'種子模擬'}],{diff:'normal'},'solo');run(()=>enterNode('A1'))`);
  row.gameSeed=await run('G.sd');
  if(faultSeed===seed)await run("doChoice=async()=>{G.phase='node'};fightAct=async()=>{};shopLeave=()=>{};advance=async()=>{};");
  for(let i=0;i<maxActions;i++){
   const st=JSON.parse(await run(`JSON.stringify({node:G.node,area:G.lv,nodeName:(curNode()||{}).n||G.node,areaName:(LV[G.lv]||{}).n||G.lv,phase:G.phase,over:G.over,clock:G.clock,hp:G.players[0].hp,fe:G.players[0].fe,inf:G.players[0].inf,fight:G.fight&&[G.fight.round,G.fight.turn,G.fight.foes.map(x=>x.hp)],stp:G.stp,player:G.players[0]})`));
   row.node=st.node;row.area=st.area;row.nodeName=st.nodeName;row.areaName=st.areaName;
   if(st.over){row.result=st.over.dead?'death':st.over.end;row.death=st.over.dead?{node:st.node,area:st.area,nodeName:st.nodeName,areaName:st.areaName,fire:!!st.over.fire,mad:!!st.player.mad,infected:st.player.inf>=100,text:st.over.text}:null;break}
   const sig=JSON.stringify(st);same=sig===last?same+1:0;last=sig;if(same>=12)throw Object.assign(Error('連續 12 個動作狀態沒有變'),{stuck:true});
   let action;
   const item=await run(`(()=>{const p=G.players[0],have=a=>a.find(k=>p.items[k]&&(k!=='photo'||p.photoLv!==G.levels));if(p.hp<p.max*.5)return have(['surgkit','med','sbandage','bandage']);if(p.fe>=50)return have(['sedative','photo','whiskey','coffee']);if(!G.fight&&p.inf>45)return have(['antibiotic','iodine','alcohol']);if(!G.fight&&p.thi<=3)return have(['water','cola','coffee']);if(!G.fight&&p.hun<=3)return have(['bar','noodle','cookie','chips','nuts']);return null})()`);
   if(item){action='使用 '+item;await run(`run(()=>G.fight?fightAct('p1',{a:'use',k:${JSON.stringify(item)}}):useItem(G.players[0],${JSON.stringify(item)}))`)}
   else if(st.phase==='node'){
    const cs=JSON.parse(await run(`JSON.stringify(choices().map((c,i)=>({i,ok:visible(c)&&choiceOk(c),l:c.l,go:c.go||(c.ok&&c.ok.go)})).filter(x=>x.ok))`));
    if(!cs.length)throw Object.assign(Error('沒有可執行的選項'),{stuck:true});
    const selected=cs[Math.floor(choose()*cs.length)];action='選項 '+selected.i+' '+selected.l;
    await run(`G.phase='busy';run(()=>doChoice(${selected.i},ctl()[0]))`);
   }else if(st.phase==='fight'){
    action='普通攻擊';await run(`run(async()=>{if(!G.fight.group)await advance();if(G.fight&&!G.over&&G.fight.group)await fightAct('p1',{a:'atk',h:'R'})})`);
   }else if(st.phase==='shop'){action='離開商店';await run('run(()=>shopLeave(G.shop&&G.shop.go))')}
   else if(st.phase==='gw'){action='離開掉落物';await run('run(()=>groundGo(G.players[0]))')}
   else throw Object.assign(Error('沒有驅動方式的階段：'+st.phase),{stuck:true});
   row.actions++;row.trace.push({i,node:st.node,phase:st.phase,action});if(errors.length)throw Error('引擎回報錯誤：'+errors[0]);
  }
  if(!row.result){const final=JSON.parse(await run('JSON.stringify({over:G.over,node:G.node,area:G.lv,nodeName:(curNode()||{}).n||G.node,areaName:(LV[G.lv]||{}).n||G.lv})'));row.node=final.node;row.area=final.area;row.nodeName=final.nodeName;row.areaName=final.areaName;const over=final.over;if(over){row.result=over.dead?'death':over.end;row.death=over.dead?{node:row.node,area:row.area,nodeName:row.nodeName,areaName:row.areaName,fire:!!over.fire,mad:!!(await run('G.players[0].mad')),infected:(await run('G.players[0].inf'))>=100,text:over.text}:null}else row.result='action-cap'}
 }catch(e){row.status='FAIL';row.result=e.stuck?'stuck':'error';row.stuck=e.stuck?1:0;row.failure=e.stack||String(e);if(!e.stuck&&!errors.length)row.errors.push(row.failure)}
 row.errors.push(...errors);row.seconds=+( (performance.now()-start)/1000).toFixed(4);return row;
}
function aggregate(runs){const deaths=runs.filter(x=>x.result==='death'),locations={};for(const r of deaths){const k=r.death.area+'/'+r.death.node;locations[k]=(locations[k]||0)+1}return {seeds:runs.length,deaths:deaths.length,deathRate:runs.length?deaths.length/runs.length:null,averageSurvivalActions:runs.length?runs.reduce((n,r)=>n+r.actions,0)/runs.length:null,capped:runs.filter(r=>r.result==='action-cap').length,deathLocations:locations,stuck:runs.reduce((n,r)=>n+r.stuck,0),errors:runs.reduce((n,r)=>n+r.errors.length,0),failedSeeds:runs.filter(r=>r.status!=='PASS').map(r=>r.seed)}}
module.exports={simulate,aggregate,rng};
