const fs=require('node:fs'),path=require('node:path');
const ROOT=path.resolve(__dirname,'../..');
const VIEWS=[[844,390],[1280,720],[393,690]];
const SCENES={gate:['#gate'],character:['#scr'],exploration:['.topbar','#logp','#chp'],combat:['.topbar','#cbar','#logp','#chp'],bag:['#ov .box']};
async function prepare(ctx){
 await ctx.addInitScript(()=>{
  const OriginalDate=Date;const epoch=1795665600000;Date=class extends OriginalDate{constructor(...args){super(...(args.length?args:[epoch]))}static now(){return epoch}};
  localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}));
 });
 // 模擬傳輸只在本機測試頁注入；不連 Firebase、不需要 fbfake.js。
 await ctx.addInitScript({path:path.join(ROOT,'tests/multiplayer/mock.js')});
}
async function scene(p,name){
 if(name==='gate')return;
 await p.evaluate(()=>{BOOTED=true;UI.snd=0;UI.bgm=0;$('#gate').hidden=true;showMenu();layout()});
 if(name==='character')return;
 await p.evaluate(()=>{
  ROLE='solo';MYPID='qa-fixed';newRun([{kind:'custom',pid:MYPID,name:'測試角色',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},tal:'keen',sk:'aid',load:{water:2,bar:2,bandage:2,'g:knife':1}}],{diff:'normal'},'solo');
  G.sd=777;G.stp=4;G.node='A2';G.lv='A';G.phase='node';G.busy=0;busy=false;G.ex={p:2,fresh:0,nx:null,quiet:0};LOG=[['旅館・301 號房','hd'],['走廊安靜得只剩下雨聲。',''],['你停下腳步，確認身上的物資。','sys']];showGame();layout();
 });
 if(name==='combat')await p.evaluate(()=>{
  const f=newFoe(0,'infected',1,false);f.n='感染者';G.phase='fight';G.fight={foes:[f],order:[{k:'p',id:MYPID,init:15},{k:'f',id:0,init:8}],turn:0,round:1,pend:{},group:[MYPID],cur:null,tUsed:{},sl:{},hb:{},bg:{},P:1,loot:[],site:null,musicId:'qa-fixed',musicStart:Date.now(),first:false};draw();layout();
 });
 if(name==='bag')await p.evaluate(()=>panel('bag'));
}
async function settled(p){
 await p.evaluate(async()=>{await document.fonts.ready;await Promise.all([...document.images].map(i=>i.decode().catch(()=>{})))});
 await p.addStyleTag({content:'*,*::before,*::after{animation:none!important;transition:none!important;caret-color:transparent!important}'});
 await p.evaluate(()=>new Promise(r=>requestAnimationFrame(()=>requestAnimationFrame(r))));
}
module.exports={ROOT,VIEWS,SCENES,prepare,scene,settled};
