const {game}=require('/home/claude/zerocase/tests/helpers/audio-game.cjs');
const TAB=[['infected','撲倒'],['incubator','丟擲囊泡'],['incubator','噴吐'],['devourer','震盪重擊'],['cutter','割喉'],['harvester','收割'],['arsonist','投擲燃燒瓶'],['acru_flamer','噴火']];
const BUILDS={'力量專精 STR5 CON3':'{STR:5,AGI:0,CON:3,PER:0,INT:0,CHA:0}','敏捷專精 AGI5 PER3':'{STR:0,AGI:5,CON:0,PER:3,INT:0,CHA:0}','平均 STR2 AGI2 CON2 PER2':'{STR:2,AGI:2,CON:2,PER:2,INT:0,CHA:0}'};
const N=3000;const out=[];
(async()=>{for(const [bn,st] of Object.entries(BUILDS))for(const stance of [null,'block','cover']){const row={build:bn,stance:stance||'無'};
 for(const [type,n] of TAB){const g=game();g.run(`newRun([{kind:'custom',pid:'p1',name:'甲',st:${st},load:{}}],{diff:'hard'},'solo');globalThis.p=G.players[0];globalThis.f={id:0,type:'${type}',n:'敵人',hp:50,max:50};G.fight={foes:[f],round:1,order:[],cur:null};G.phase='fight';G.lv='A';dice=async()=>{};out=()=>{};L_out=()=>{};snd=()=>0;woundImpact=async()=>{};globalThis.mv=MOVES['${type}'].find(m=>m.n==='${n}')`);
  const r=JSON.parse(await g.run(`(async()=>{let av=0,pt=0,dmg=0;for(let i=0;i<${N};i++){p.max=999;p.hp=999;p.inf=0;p.burn=0;p.unbal=0;p.dazed=0;p.skip=0;p.held=0;p.humus=0;p.stance=${stance?`'${stance}'`:'null'};const H=hzOf(f,mv);const x=await hzRoll(f,mv,p,H);if(x==='dodge')av++;else{if(x==='part')pt++;await bigHit(f,mv,p,x==='part'?1:0)}dmg+=999-p.hp}return JSON.stringify({av:av/${N},pt:pt/${N},dmg:dmg/${N}})})()`));
  row[n]=`${Math.round((r.av+r.pt)*100)}%／${r.dmg.toFixed(1)}`}
 out.push(row)}
 console.log('格式：檢定成功率／平均每次生命損失（困難、無護甲、3000 次）');console.table(out)})();
