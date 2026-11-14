const {test}=require('node:test');
const assert=require('node:assert/strict');
const vm=require('node:vm');
const fs=require('node:fs');
const path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
function game(source=html){
 const node={addEventListener(){},classList:{add(){},remove(){},toggle(){}},style:{setProperty(){}},appendChild(){},querySelector(){return null}};
 const c=vm.createContext({console,setTimeout,clearTimeout,setInterval:(fn,ms)=>{const t=setInterval(fn,ms);t.unref();return t},clearInterval,Date,Math,Promise,Audio:class{canPlayType(){return ''}},location:{protocol:'file:'},localStorage:{getItem(){return null},setItem(){},removeItem(){}},window:{addEventListener(){}},document:{querySelector(s){return s==='#log'?null:node},querySelectorAll(){return []},addEventListener(){},createElement(){return {...node}}}});
 let s=source.match(/<script>([\s\S]*?)<\/script>/)[1];
 s=s.replace(/let netReady=\(async\(\)=>\{[\s\S]*?\}\)\(\);/,'let netReady=Promise.resolve();').replace(/\nlayout\(\);\s*$/,'');
 vm.runInContext(s,c);
 vm.runInContext(`UI.snd=0;UI.bgm=0;UI.spd=.3;FAST=1;globalThis.realDraw=draw;draw=()=>{};push=()=>{};flush=async()=>{};snd=()=>0;
 globalThis.p={pid:'p1',name:'了白',col:'#ccc',st:{STR:5,AGI:5,CON:2,PER:3,INT:1,CHA:2},traits:[],items:{},gear:[],hand:{R:null,L:null},eq:{head:null,body:null,arm:null,leg:null},hun:7,thi:7,fe:0,pk:0,frac:0,lv:1,xp:0,hp:20,max:20,inf:0,bon:{}};
 globalThis.q={...p,pid:'p2',name:'隊友',items:{},gear:[],hand:{R:null,L:null},eq:{...p.eq}};
 ROLE='host';G={rid:'test',mode:'mp',host:'p1',players:[p,q],lv:'C',node:'C1',ground:[],grounds:{},gnode:'C1',flags:{},uid:0,opts:{diff:'normal'},seq:0};LOG=[];
 globalThis.sent=[];NET.r={emit:async(k,v)=>sent.push(v)};`,c);
 return {c,run:s=>vm.runInContext(s,c),log:()=>vm.runInContext('LOG.map(x=>x[0]).join("\\n")',c)};
}
test('電梯井的有效敏捷及面板說明有明確來源',()=>{let g=game();assert.equal(g.run("statMod(p,'AGI')"),3);assert.match(g.run('statWhy(p)'),/電梯井/);assert.match(g.run('teamExtra(p)'),/電梯井/)});
test('沒有黑暗扣值的人不應被告知受到黑暗影響',()=>{let g=game();g.run("G.lv='P';p.items.flashlight=1");assert.equal(g.run("statMod(p,'PER')"),3);assert.doesNotMatch(g.run('statWhy(p)'),/環境影響|黑暗/)});
test('屬性數值維持既有規則，後巷只加檢定',()=>{let g=game();for(const [zone,agi,per] of [['C',3,3],['H',4,3],['R',5,1],['P',5,1],['U',5,1],['A',5,3]]){g.run(`G.lv='${zone}'`);assert.equal(g.run("statMod(p,'AGI')"),agi);assert.equal(g.run("statMod(p,'PER')"),per)}g.run("G.lv='K'");assert.equal(g.run("statMod(p,'CHA')"),2);assert.equal(g.run("checkBonus(p,'CHA')"),2)});
test('環境效果開始、同區不重複、離開解除，並送進同步事件',()=>{let g=game();g.run('reportEffects();reportEffects()');assert.equal((g.log().match(/電梯井/g)||[]).length,2);/* 每人各一次 */g.run("G.lv='A';reportEffects()");assert.match(g.log(),/解除/);assert.ok(g.run("sent.some(x=>JSON.parse(x.s).t==='o')"))});
test('停電與黑暗可疊加，取得手電筒兩者解除',()=>{let g=game();g.run("G.lv='P';LV.P.indoor=1;G.flags.blackout=1;reportEffects()");assert.equal(g.run("statMod(p,'PER')"),0);assert.match(g.log(),/停電/);assert.match(g.log(),/黑暗/);g.run('p.items.flashlight=1;reportEffects()');assert.equal(g.run("statMod(p,'PER')"),3);assert.match(g.log(),/解除/)});
test('飢渴只扣一次，骨折及恐懼來源可同時辨認',()=>{let g=game();g.run("G.lv='A';p.hun=0;p.thi=0;p.frac=1;p.fe=80;reportEffects()");assert.equal(g.run("statMod(p,'AGI')"),0);assert.equal(g.run("statMod(p,'PER')"),-1);for(const x of ['骨折','飢','恐懼'])assert.ok(g.log().includes(x));g.run('p.pk=2;reportEffects()');assert.equal(g.run("statMod(p,'AGI')"),3);assert.match(g.log(),/解除/)});
test('左手裝備、換手、收起都有具名位置紀錄',()=>{let g=game();g.run("p.gear.push(newGear('hammer'));doEquip(p,{u:1,h:'L'})");assert.match(g.log(),/了白/);assert.match(g.log(),/鐵鎚/);assert.match(g.log(),/左手/);g.run("doEquip(p,{u:1,h:'R'});doEquip(p,{h:'R'})");assert.match(g.log(),/右手/);assert.match(g.log(),/背包/)});
test('雙手武器替換時，舊武器放回背包有紀錄',()=>{let g=game();g.run("p.gear.push(newGear('hammer'));doEquip(p,{u:1,h:'L'});p.gear.push(newGear('mp5'));doEquip(p,{u:2,h:'R'})");assert.equal(g.run('p.hand.R===p.hand.L'),true);assert.match(g.log(),/雙手/);assert.match(g.log(),/鐵鎚.*背包/)});
test('丟棄道具及武器，人物、數量、地面與雙手狀態正確',async()=>{let g=game();g.run("p.items.water=2;p.gear.push(newGear('mp5'));equip(p,1,'R')");await g.run("run(async()=>{handle('p1',{a:'drop',k:'water'});})");/* queued run */await new Promise(r=>setImmediate(r));assert.equal(g.run('p.items.water'),1);assert.match(g.log(),/了白.*水/);await g.run("handle('p1',{a:'drop',u:1})");await new Promise(r=>setImmediate(r));assert.equal(g.run('p.hand.R'),null);assert.equal(g.run('p.hand.L'),null);assert.equal(g.run('G.ground.length'),2);assert.match(g.log(),/MP5/)});
test('部分撿取有正確數量及地上剩餘量，滿包失敗不造假紀錄',()=>{let g=game();g.run("p.st.STR=0;p.items={water:4,cloth:35};G.ground=[{k:'water',q:4}];pickGround(p,0)");assert.equal(g.run('p.items.water'),5);assert.equal(g.run('G.ground[0].q'),3);assert.match(g.log(),/撿起.*水.*1/);assert.match(g.log(),/3/);let n=g.run('LOG.length');g.run('pickGround(p,0)');assert.equal(g.run('LOG.length'),n)});
test('撿到武器自動放入左手時，事件明確顯示',()=>{let g=game();g.run("p.gear.push(newGear('hammer'));equip(p,1,'R');G.ground=[{g:newGear('beretta',4)}];pickGround(p,0)");assert.equal(g.run('p.hand.L'),2);assert.match(g.log(),/左手/);assert.match(g.log(),/貝瑞塔/)});
test('物資溢出與脫下防具都會具名報告',()=>{let g=game();g.run("p.st.STR=0;p.items={cloth:40};addI(p,'water',2);p.eq.body={k:'jacket'};unwear(p,'body')");assert.match(g.log(),/了白.*放不下/);assert.match(g.log(),/皮外套/);assert.match(g.log(),/地上/);assert.equal(g.run('p.eq.body'),null)});
test('重回節點或讀檔可列出地上的物品及數量',()=>{let g=game();g.run("G.ground=[{k:'water',q:2},{g:newGear('hammer')}];reportGround()");assert.match(g.log(),/水.*2/);assert.match(g.log(),/鐵鎚/)});
test('逃跑遺落的武器真的留在原節點，無法從裝備欄重複丟出',async()=>{let g=game();g.run("let gg=newGear('hammer');gg.drop='far';p.gear.push(gg);recoverDrops(true)");assert.equal(g.run('p.gear.length'),0);assert.equal(g.run('G.ground.length'),1);assert.equal(g.run('G.ground[0].g.drop'),null);assert.match(g.log(),/地上|原地/)});
test('轉交武器會顯示接收者實際拿在哪一手',()=>{let g=game();g.run("p.gear.push(newGear('hammer'));give(p,'p2',null,1)");assert.match(g.log(),/了白.*隊友/);assert.match(g.log(),/右手/)});
test('全區域及多種狀態組合與發布基準的有效屬性及檢定加值一致',()=>{
 const base=fs.readFileSync(path.join(__dirname,'baseline-v0.21.5.html'),'utf8');
 const before=game(base),after=game();const zones=JSON.parse(after.run('JSON.stringify(Object.keys(LV))'));
 let count=0;
 for(const zone of zones)for(let i=0;i<32;i++){
  const state=`G.lv=${JSON.stringify(zone)};G.flags={blackout:${i%2},citypower:${i%7===0?1:0},streetpower:${i%11===0?1:0}};p.frac=${(i>>1)%2};p.pk=${i%5===0?1:0};p.hun=${i%3===0?0:7};p.thi=${i%4===0?0:7};p.fe=${[0,25,50,75,100][i%5]};p.items=${JSON.stringify(i%6===0?{flashlight:1}:{})};p.traits=${JSON.stringify(i%9===0?['nightowl','keen','athletic','talker']:[])};JSON.stringify(Object.keys(STN).map(s=>[statMod(p,s),checkBonus(p,s)]))`;
  assert.equal(after.run(state),before.run(state),`區域 ${zone}／情境 ${i}`);count++;
 }
 assert.ok(count>=900);console.log('已比對',count,'組情境，共',count*12,'個屬性／檢定結果');
});
test('效果解除只發生一次，客戶端不自行重複產生事件',()=>{let g=game();g.run("reportEffects();LOG=[];G.lv='A';reportEffects();reportEffects()");assert.equal(g.run('LOG.length'),2);g.run("LOG=[];ROLE='client';G.lv='C';reportEffects()");assert.equal(g.run('LOG.length'),0)});
test('同一武器留在同一手不重複紀錄，無效操作不創造物品',()=>{let g=game();g.run("p.gear.push(newGear('hammer'));doEquip(p,{u:1,h:'R'});LOG=[];doEquip(p,{u:1,h:'R'});doEquip(p,{u:999,h:'L'});dropItem(p,{u:999});pickGround(p,99)");assert.equal(g.run('LOG.length'),0);assert.equal(g.run('G.ground.length'),0)});
test('自動裝備雙手武器擠下舊左手武器，撿取與獲得都須記錄收起舊物',()=>{for(const action of ["G.ground=[{g:newGear('mp5')}];pickGround(p,0)","addGear(p,'mp5')"]){let g=game();g.run("p.gear.push(newGear('hammer'));equip(p,1,'L');LOG=[];"+action);assert.match(g.log(),/鐵鎚.*背包/);assert.equal(g.run('p.hand.R===p.hand.L'),true)}});
test('接收轉交與戰後回收造成的自動替換也記錄舊武器收起',()=>{let g=game();g.run("q.gear.push(newGear('hammer'));equip(q,1,'L');p.gear.push(newGear('mp5'));give(p,'p2',null,2)");assert.match(g.log(),/隊友.*鐵鎚.*背包/);g=game();g.run("p.gear.push(newGear('hammer'));equip(p,1,'L');const gg=newGear('mp5');gg.drop='feet';p.gear.push(gg);recoverDrops(false)");assert.match(g.log(),/鐵鎚.*背包/)});
test('一樓、停車場與地鐵的規則明確區分有效屬性與條件豁免',()=>{let g=game();for(const zone of ['E','P','U']){const text=g.run(`LV.${zone}.rule`);assert.match(text,/有效感知/);assert.match(text,/夜行者/);assert.doesNotMatch(text,/感知檢定/);}});
function renderedChoices(g,diff,phase='node'){
 return g.run(`MYPID='p1';G.lv='A';G.node='A2';G.ev=null;G.phase=${JSON.stringify(phase)};G.pc=0;G.players=[p];G.votes={};G.rv={};G.used={};G.opts.diff=${JSON.stringify(diff)};
 document.querySelector=((orig)=>s=>s==='#log'?{classList:{toggle(){}}}:orig(s))(document.querySelector);realDraw();document.querySelector('#choices').innerHTML`);
}
test('普通模式選項保留屬性難度標籤，不重複檢定文字，保留實際提示',()=>{const g=game();const h=renderedChoices(g,'normal');assert.match(h,/需要力量 12/);assert.match(h,/需要感知 12/);assert.doesNotMatch(h,/力量檢定|感知檢定|體質檢定/);assert.match(h,/看清楚有幾個/);assert.match(h,/一點聲音都不能出/);assert.match(h,/不用檢定，但很吵/);});
test('真實模式選項的屬性標籤仍存在，只隱藏檢定難度數字',()=>{const g=game();const h=renderedChoices(g,'real');assert.match(h,/class="tag t-ck">需要力量<\/span>/);assert.match(h,/class="tag t-ck">需要感知<\/span>/);assert.match(h,/class="tag t-ck">需要體質<\/span>/);assert.doesNotMatch(h,/需要力量 12|需要感知 12|需要體質 11|力量檢定|感知檢定|體質檢定/);assert.match(h,/看清楚有幾個/);});
test('真實模式選擇檢定者及逃跑標籤不洩漏判定數字',()=>{let g=game();let h=renderedChoices(g,'real','roller');assert.match(h,/class="tag t-ck">力量<\/span>/);assert.doesNotMatch(h,/class="tag t-ck">力量 \d/);g.run("G.fight={foes:[],noflee:0,pend:{},group:['p1'],tUsed:{},site:null};FTAB='other';G.busy=0");h=g.run('fightMenu(p)');assert.match(h,/需要敏捷/);assert.doesNotMatch(h,/需要敏捷 12/)});
test('清理重複前綴不會刪掉物品條件、不用檢定或後續說明',()=>{const g=game();for(const [c,want] of [[{k:'STR',s:'力量檢定'},''],[{k:'PER',s:'感知檢定：看清楚有幾個'},'看清楚有幾個'],[{k:'CON',s:'體質檢定；忍住不吐'},'忍住不吐'],[{s:'不用檢定，但很吵（警戒 +2）'},'不用檢定，但很吵（警戒 +2）'],[{k:'STR',s:'需要鐵撬'},'需要鐵撬'],[{k:'PER',s:'需要步槍；感知檢定'},'需要步槍']])assert.equal(g.run('choiceNote('+JSON.stringify(c)+')'),want)});
test('隊友斷線與重新連線使用系統通知，保留原參與狀態變化',()=>{const g=game();g.run("MYPID='p1';NET.started=1;G.phase='idle';drawLobby=()=>{};onPeers({peers:[],joined:[]})");assert.equal(g.run('q.away'),1);assert.match(g.log(),/隊友.*連線中斷/);assert.doesNotMatch(g.log(),/黑暗|身影|走失/);g.run("onPeers({peers:[{peer:'q',presence:{pid:'p2',acts:[]}}],joined:[]})");assert.equal(g.run('q.away'),0);assert.match(g.log(),/隊友.*重新連線/);assert.doesNotMatch(g.log(),/閃爍|身影/)});
test('房主交接通知清楚指出斷線玩家與接任者',()=>{const g=game();g.run("MYPID='p2';G.phase='idle';NET.r.presence=async()=>{};becomeHost([])");assert.equal(g.run('G.host'),'p2');assert.equal(g.run('p.away'),1);assert.match(g.log(),/了白.*連線中斷/);assert.match(g.log(),/隊友.*接任房主|由.*隊友.*接任房主/);assert.doesNotMatch(g.log(),/黑暗|身影/)});
function bagHTML(g){return g.run("MYPID='p1';panel('bag');document.querySelector('#ov').innerHTML")}
test('背包沒有地面物品時仍提供獨立地面區與空狀態',()=>{const g=game();const h=bagHTML(g);assert.match(h,/地面物品/);assert.match(h,/目前地上沒有物品/);assert.match(h,/class="scr2 grounditems"/)});
test('物品與備用武器不必先選取就能放到地上',()=>{const g=game();g.run("p.items.water=1;p.gear.push(newGear('hammer'));SEL=null");const h=bagHTML(g);assert.match(h,/data-drop="water"[^>]*>放到地上/);assert.match(h,/data-dropg="1"[^>]*>放到地上/)});
test('滿包時手持武器可直接放到地上，無須先收進背包',()=>{const g=game();g.run("p.items.water=65;p.gear.push(newGear('hammer'));equip(p,1,'R')");const h=bagHTML(g);assert.match(h,/data-dropg="1"[^>]*>放到地上/);assert.equal(g.run("dropItem(p,{u:1})"),true);assert.equal(g.run('p.hand.R'),null);assert.equal(g.run('G.ground[0].g.id'),'hammer');assert.equal(g.run('p.items.water'),65)});
test('滿包失敗保留地面物品，放下一整疊最後一個後可騰格再撿取',()=>{const g=game();g.run("p.st.STR=0;p.items={water:1,bar:5,bandage:5,cloth:5,tape:5,lighter:5,coffee:5,painkiller:5};G.ground=[{k:'iodine',q:2}]");assert.equal(g.run('used(p)'),8);assert.equal(g.run('pickGround(p,0)'),false);assert.equal(g.run('G.ground[0].q'),2);g.run("dropItem(p,{k:'water'})");assert.equal(g.run('used(p)'),7);assert.equal(g.run('pickGround(p,0)'),true);assert.equal(g.run('p.items.iodine'),2);assert.equal(g.run('G.ground.length'),1);assert.equal(g.run('G.ground[0].k'),'water');assert.match(g.log(),/礦泉水.*地上/);assert.match(g.log(),/優碘.*背包/)});
test('戰鬥中地面區明示限制，沒有可繞過回合的丟棄按鈕',()=>{const g=game();g.run("p.items.water=1;G.ground=[{k:'bandage',q:1}];G.fight={};myTurn=()=>true");const h=bagHTML(g);assert.match(h,/戰鬥中.*不能.*撿取/);assert.doesNotMatch(h,/data-drop(?:g)?=/);assert.match(h,/data-pick="0" disabled/)});
