// 本次修正專項；只在測試頁建立固定生命與傷害，不改遊戲或既有 QA。
const {chromium}=require('playwright');
const fs=require('node:fs'),path=require('node:path'),assert=require('node:assert/strict');
const BE=require('./helpers/browser-errors.cjs');
const ROOT=path.resolve(__dirname,'..'),OUT=path.resolve(ROOT,'test-results/damage-float');
const ORIGIN=process.env.QA_ORIGIN||'http://localhost:8768',URL=process.env.QA_URL||ORIGIN+'/index.html';
fs.mkdirSync(OUT,{recursive:true});
const EXPECTED=JSON.parse(fs.readFileSync(path.join(ROOT,'index.html'),'utf8').match(/const ZC_VER=(\{.*?\});/)[1]);
const report={checks:[],views:[],multiplayer:{status:'NOT_RUN'},errors:[]};
const check=(name,fn)=>{try{const result=fn();report.checks.push({name,status:'PASS',result});return result}catch(e){report.checks.push({name,status:'FAIL',error:e.message});throw e}};
const fixed=({hp=8,type='infected',extra={},scope='fixed'}={})=>{
 const f=newFoe(0,type,1,false);Object.assign(f,{hp,n:FOES[type].n,...extra});
 G.fight={foes:[f],musicId:G.rid+':'+scope,P:1,sl:{},hb:{},bg:{},order:[{k:'p',id:MYPID,init:20}],turn:0,round:1,arrows:{},opening:'normal',cur:null,escaped:[],tUsed:{},group:[MYPID],pend:{}};
 G.phase='fight';G.busy=0;busy=false;G.stg=null;PEND=null;draw();return f.hp;
};
async function boot(ctx){const p=await ctx.newPage();await p.goto(URL);await p.evaluate(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}));});await p.reload();
 await p.click('#gateNo');if(process.env.QA_LIVE){report.version=await p.evaluate(()=>ZC_VER);assert.equal(report.version.v,EXPECTED.v);assert.equal(report.version.b,EXPECTED.b);await p.screenshot({path:path.join(OUT,'live-menu.png')})}await p.click('[data-cat="story"]');await p.click('[data-rsel="maggie"]');await p.click('[data-m="rpick"]');await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');await p.click('[data-m="go"]');await p.waitForFunction(()=>G&&G.phase==='node'&&!busy);if(process.env.QA_LIVE){const nodes=[];for(let i=0;i<3;i++){await p.waitForFunction(()=>!busy&&!G.busy);nodes.push(await p.evaluate(()=>G.node));await p.locator('#choices [data-ch]:not([disabled])').first().click();await p.waitForFunction(()=>!busy&&!G.busy,null,{timeout:30000})}report.exploration=nodes;await p.screenshot({path:path.join(OUT,'live-exploration.png')})}return p}
(async()=>{const browser=await chromium.launch();try{
 for(const [width,height] of [[844,390],[393,690],[1280,720]]){
  const ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1000});await BE.serve(ctx,ORIGIN,ROOT);const p=await boot(ctx);const errors=BE.watch(p,ORIGIN);const V={width,height,errors};report.views.push(V);
  await p.evaluate(fixed,{});await p.screenshot({path:path.join(OUT,`${width}x${height}-before.png`)});
  const result=await p.evaluate(async()=>{const f=G.fight.foes[0],damage=applyDmg(f,25,['slash'],null,false);await kill(f,null);return {damage,hp:f.hp,txt:[...document.querySelectorAll('.f-dmg')].map(x=>x.textContent),bars:[...document.querySelectorAll('.fhp s,.fhp u')].map(x=>x.style.width)}});
  check(`${width}×${height}：生命 8 受傷 25，死亡歸零且飄字完整`,()=>{assert.equal(result.damage,25);assert.equal(result.hp,0);assert.deepEqual(result.txt,['−25']);assert.ok(result.bars.every(x=>parseFloat(x)>=0));return result});
  await p.screenshot({path:path.join(OUT,`${width}x${height}-after.png`)});
  V.geometry=await p.evaluate(()=>{const r=document.querySelector('.f-dmg').getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height,screen:[innerWidth,innerHeight]}});
  check(`${width}×${height}：飄字在螢幕內`,()=>{const r=V.geometry;assert.ok(r.x>=0&&r.y>=0&&r.x+r.width<=width+1&&r.y+r.height<=height+1);return r});
  if(width===844){
   for(const [hp,base,type,extra,dt,want] of [[30,7,'infected',{},'slash',7],[14,14,'infected',{},'slash',14],[8,20,'infected',{ares:['slash']},'slash',15],[8,20,'devourer',{},'fire',25],[8,20,'infected',{aff:'heavy'},'slash',18],[8,20,'infected',{shell:1},'slash',15]]){
    await p.evaluate(fixed,{hp,type,extra,scope:JSON.stringify([hp,extra,dt])});const r=await p.evaluate(({base,dt})=>{const f=G.fight.foes[0],before=JSON.stringify(f),peek=applyDmg(f,base,[dt],null,'peek'),same=before===JSON.stringify(f),damage=applyDmg(f,base,[dt],null,true);draw();return {peek,same,damage,hp:f.hp,texts:FLT.map(x=>x.txt)}},{base,dt});
    check(`數值矩陣 ${hp}/${base}/${type}/${dt}/${JSON.stringify(extra)}`,()=>{assert.equal(r.peek,want);assert.ok(r.same);assert.equal(r.damage,want);assert.equal(r.hp,hp-want);assert.deepEqual(r.texts,['−'+want]);return r});
   }
   for(const [effect,dt] of [['slashAttack','slash'],['bluntAttack','blunt'],['pierceAttack','pierce'],['arrowAttack','pierce'],['gunAttack','ballistic']]){
    if(effect==='gunAttack')continue; // 槍械走 playGunShot，下方單獨檢查。
    await p.evaluate(fixed,{scope:effect});const r=await p.evaluate(async({effect,dt})=>{const f=G.fight.foes[0],d=applyDmg(f,25,[dt],null,true);if(effect==='arrowAttack')await arrowAttack(f,'bow');else await window[effect](f);return {d,txt:FLT.map(x=>x.txt)}},{effect,dt});
    check(`既有命中演出 ${effect} 傳遞完整傷害`,()=>{const expected=dt==='blunt'?31:dt==='pierce'?19:25;assert.equal(r.d,expected);assert.deepEqual(r.txt,['−'+expected]);return r});
   }
   await p.evaluate(fixed,{scope:'gun'});const gun=await p.evaluate(async()=>{const f=G.fight.foes[0];applyDmg(f,25,['ballistic'],null,true);await playGunShot({id:f.id,wid:'beretta',state:snap()});return FLT.map(x=>x.txt)});check('槍械命中演出傳遞完整傷害',()=>assert.deepEqual(gun,['−25']));
   await p.evaluate(fixed,{hp:4,extra:{burn:1,bleed:5},scope:'dot'});const dot=await p.evaluate(async()=>{await roundEnd();return {hp:G.fight.foes[0].hp,txt:FLT.map(x=>x.txt)}});check('真實 roundEnd 燃燒弱點 3 加流血 5 合計 −8、死亡歸零',()=>{assert.equal(dot.hp,0);assert.deepEqual(dot.txt,['−8']);return dot});
   await p.evaluate(fixed,{hp:30,scope:'non-damage'});const nd=await p.evaluate(()=>{const f=G.fight.foes[0];f.mc=1;draw();f.hp+=5;draw();f.hp=0;f.dead=1;f.fled=1;draw();return FLT.map(x=>[x.txt,x.c])});check('落空白字、治療及逃走沒有假紅字',()=>assert.deepEqual(nd,[['未命中','f-miss']]));
   await p.evaluate(fixed,{hp:30,scope:'save'});const save=await p.evaluate(()=>{const f=G.fight.foes[0];applyDmg(f,7,['slash'],null,true);draw();LS.set('zc7-save',{G:snap(),LOG});applyDmg(f,4,['slash'],null,true);draw();resumeSolo();const current={hp:G.fight.foes[0].hp,total:G.fight.foes[0].fdmgTotal,texts:FLT.map(x=>x.txt)};const old=snap();delete old.fight.foes[0].fdmgTotal;LS.set('zc7-save',{G:old,LOG});resumeSolo();return {current,oldTotal:G.fight.foes[0].fdmgTotal,oldTexts:FLT.map(x=>x.txt)}});check('真實 resumeSolo 讀本版及舊存檔：保留累計、缺值補零、不補播',()=>{assert.deepEqual(save.current,{hp:23,total:7,texts:[]});assert.equal(save.oldTotal,0);assert.deepEqual(save.oldTexts,[]);return save});
   await p.evaluate(fixed,{hp:30,type:'predator',extra:{hid:1},scope:'hidden'});const hidden=await p.evaluate(()=>{const f=G.fight.foes[0];applyDmg(f,5,['blunt'],null,true);f.mc=1;draw();const a=FLT.length;f.hid=0;draw();const b=FLT.length;applyDmg(f,3,['blunt'],null,true);draw();return {a,b,txt:FLT.map(x=>x.txt)}});check('隱藏不洩漏、現身不補播、新命中正常',()=>{assert.equal(hidden.a,0);assert.equal(hidden.b,0);assert.deepEqual(hidden.txt,['−3']);return hidden});
  }
  check(`${width}×${height}：沒有遊戲程式及必要素材錯誤`,()=>assert.deepEqual(errors.required,[]));await ctx.close();
 }
 // 正式 Firebase 實連，兩個獨立瀏覽器環境沿用遊戲 openRoom、E、快照接收與房主交接。
 const hc=await browser.newContext({viewport:{width:844,height:390}}),cc=await browser.newContext({viewport:{width:844,height:390}});
 await BE.serve(hc,ORIGIN,ROOT);await BE.serve(cc,ORIGIN,ROOT);const host=await boot(hc),client=await boot(cc);const code=String(1000+Math.floor(Math.random()*9000));let ownPeers=[];
 try{
  await host.waitForFunction(()=>NET.kind==='fb'&&NET.room,null,{timeout:30000});await client.waitForFunction(()=>NET.kind==='fb'&&NET.room,null,{timeout:30000});
  const guest=await client.evaluate(()=>MYPID);await host.evaluate(fixed,{hp:100,scope:'network'});
  await host.evaluate(async({code,guest})=>{G.mode='mp';const p=JSON.parse(JSON.stringify(me()));p.pid=guest;p.name='驗收隊友';G.players.push(p);await openRoom(true,code);NET.started=1;setPres();},{code,guest});
  await client.evaluate(async code=>{await openRoom(false,code);NET.started=1;setPres()},code);await host.waitForFunction(()=>NET.lobby.length>0);ownPeers=await client.evaluate(()=>[NET.hostPeer,...NET.lobby.filter(x=>x.presence?.pid===MYPID).map(x=>x.peer)].filter(Boolean));await host.evaluate(()=>fullSync());await client.waitForFunction(()=>ROLE==='client'&&G.mode==='mp'&&G.fight?.musicId?.endsWith('network'));
  await host.evaluate(async()=>{applyDmg(G.fight.foes[0],25,['slash'],null,true);await slashAttack(G.fight.foes[0])});await client.waitForFunction(()=>FLT.some(x=>x.txt==='−25'));
  const both=await Promise.all([host,client].map(p=>p.evaluate(()=>({total:G.fight.foes[0].fdmgTotal,hp:G.fight.foes[0].hp,texts:FLT.map(x=>x.txt)}))));check('Firebase 主機及隊友命中演出皆顯示 −25',()=>{assert.deepEqual(both[0],both[1]);assert.equal(both[1].total,25);assert.equal(both[1].hp,75);assert.deepEqual(both[1].texts,['−25']);return both});
  await host.evaluate(()=>fullSync());await client.waitForTimeout(200);const repeated=await client.evaluate(()=>FLT.filter(x=>x.txt==='−25').length);check('Firebase 重送快照不重複飄字',()=>assert.equal(repeated,1));
  await client.evaluate(()=>{const old=setG;window.__floatSyncCount=0;setG=function(g){window.__floatSyncCount++;return old(g)}});
  await client.evaluate(()=>leaveRoom());await host.waitForFunction(pid=>G.players.find(p=>p.pid===pid)?.away,guest);
  await client.evaluate(async code=>{await openRoom(false,code);NET.started=1;setPres()},code);await host.waitForFunction(pid=>!G.players.find(p=>p.pid===pid)?.away,guest);await host.evaluate(()=>fullSync());await client.waitForFunction(()=>window.__floatSyncCount>0);
  const rejoin=await client.evaluate(()=>({hp:G.fight.foes[0].hp,total:G.fight.foes[0].fdmgTotal}));check('Firebase 重新加入及全量快照保留生命與累計',()=>assert.deepEqual(rejoin,{hp:75,total:25}));
  await host.evaluate(()=>{const old=snap();old.fight.foes[0].fdmgTotal=20;E('st',old)});await client.waitForFunction(()=>G.fight.foes[0].fdmgTotal===20);
  await host.evaluate(()=>{applyDmg(G.fight.foes[0],4,['slash'],null,true);push();draw()});await client.waitForFunction(()=>G.fight.foes[0].fdmgTotal===29&&FLT.some(x=>x.txt==='−4'));
  const afterRejoin=await client.evaluate(()=>({total:G.fight.foes[0].fdmgTotal,texts:FLT.map(x=>x.txt)}));check('Firebase 同場倒序不倒退水位，下一次新傷害仍完整顯示 −4',()=>{assert.equal(afterRejoin.total,29);assert.ok(afterRejoin.texts.includes('−4'));assert.ok(!afterRejoin.texts.includes('−9'));return afterRejoin});
  await host.evaluate(()=>leaveRoom());await client.waitForFunction(()=>ROLE==='host',null,{timeout:15000});const total=await client.evaluate(()=>G.fight.foes[0].fdmgTotal);check('Firebase 房主交接保留累計',()=>assert.equal(total,29));
  report.multiplayer={status:'PASS',total};
 }catch(e){report.multiplayer={status:'FAIL',reason:e.message};report.checks.push({name:'正式 Firebase 實連與房主交接',status:'FAIL',error:e.message})}
 finally{for(const p of [host,client])await p.evaluate(()=>leaveRoom()).catch(()=>{});if(ownPeers.length)try{await host.evaluate(async({code,peers})=>{const F=NET.F,base='rooms/zc-'+code+'/ev';const s=await F.get(F.ref(F.db,base));for(const [id,v] of Object.entries(s.val()||{}))if(peers.includes(v.f))await F.remove(F.ref(F.db,base+'/'+id))},{code,peers:ownPeers});report.multiplayer.cleanup='PASS'}catch(e){report.errors.push('測試訊息清理失敗：'+e.message)}await hc.close();await cc.close()}
 }catch(e){report.errors.push(e.stack);process.exitCode=1}finally{await browser.close();report.status=report.errors.length||report.checks.some(x=>x.status==='FAIL')?'FAIL':'PASS';fs.writeFileSync(path.join(OUT,'report.json'),JSON.stringify(report,null,2));console.log(JSON.stringify(report,null,2));if(report.status==='FAIL')process.exitCode=1}})();
