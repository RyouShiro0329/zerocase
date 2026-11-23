// 戰鬥玩家卡驗收：受控隊伍不替代正式多人連線或手機實機。
const {chromium}=require('playwright');
const assert=require('node:assert/strict'),fs=require('node:fs');
const OUT=process.env.ZC_QA_OUT||'qa-output/battle-player-cards';
const URL=process.env.ZC_QA_URL||'http://localhost:8768/index.html';
(async()=>{
 fs.mkdirSync(OUT,{recursive:true});const browser=await chromium.launch();
 const report={checks:[],errors:[],phone:'待主人實機驗收',network:'未測試：正式多人網路實連；本驗收使用受控隊伍及狀態序列化'};
 const check=(name,ok)=>{report.checks.push({name,result:ok?'通過':'失敗'});assert.ok(ok,name)};
 try{for(const [width,height] of [[393,690],[844,390],[1280,720]]){
  const tag=`${width}x${height}`,ctx=await browser.newContext({viewport:{width,height},hasTouch:width<1000}),page=await ctx.newPage();
  page.on('pageerror',e=>report.errors.push(tag+': '+e.message));
  page.on('console',m=>{if(m.type()==='error'&&!/Failed to load|net::|fonts|favicon|firebase|gstatic|ERR_/i.test(m.text()))report.errors.push(tag+': '+m.text())});
  await page.addInitScript(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));setInterval(()=>{for(const s of ['#dice','#lvcard','#enc']){const e=document.querySelector(s);if(e&&!e.hidden)e.click()}},100)});
  await page.goto(URL);await page.click('#gateNo');await page.click('[data-cat="custom"]');await page.fill('#cname','玩家名稱');await page.click('[data-ctab="tal"]');await page.click('[data-tal="keen"]');await page.click('[data-ctab="sk"]');await page.click('[data-csk="aid"]');await page.click('[data-m="cdone"]');await page.click('[data-m="solo"]');await page.click('[data-m="go"]');
  await page.waitForFunction(()=>G&&G.phase==='node'&&!busy,null,{timeout:30000});
  // 真正進入遭遇，再按原有攻擊選單，證明卡片未擋住操作。
  await page.evaluate(()=>{window.__encounter=startFight({n:1,types:['infected'],noMut:1,mode:'normal'})});
  await page.waitForFunction(()=>G&&G.fight&&myTurn()&&!busy&&!G.busy,null,{timeout:60000});
  check(tag+' 單人戰鬥顯示玩家名稱',await page.locator('#battle-party .battle-player .fh b').allTextContents().then(x=>x.length===1&&x[0]==='玩家名稱'));
  await page.click('#choices [data-ftab="atk"]');
  check(tag+' 原有攻擊選單可操作',await page.locator('#choices [data-fa="atk"]').count()>0);
  await page.evaluate(()=>{const p=me(),g=newGear('knuckles');p.gear.push(g);equip(p,g.u,'R');FTAB='atk';draw()});
  const attackGeometry=await page.evaluate(()=>({ok:[...document.querySelectorAll('#choices button')].slice(0,3).every(b=>{const r=b.getBoundingClientRect(),s=document.querySelector('#stage').getBoundingClientRect();return r.width>0&&r.left>=s.left-1&&r.right<=s.right+1}),height:document.querySelector('#choices').clientHeight,party:document.querySelector('#battle-party').clientHeight,buttons:[...document.querySelectorAll('#choices button')].slice(0,3).map(b=>({text:b.textContent,rect:b.getBoundingClientRect().toJSON()}))}));
  console.log(tag+' 攻擊選單幾何',JSON.stringify(attackGeometry));
  await page.screenshot({path:`${OUT}/attack-${tag}.png`});
  check(tag+' 單手武器含返回的前三顆按鈕完整可見',attackGeometry.ok);
  // 建立固定八人資料，涵蓋圖片、舊欄位缺省與撤離等顯示；不替換遊戲邏輯。
  await page.evaluate(()=>{
   ROLE='solo';MYPID='qa1';newRun(Array.from({length:8},(_,i)=>({kind:i===0?'dar':'custom',pid:'qa'+(i+1),name:['玩家名稱','頭貼玩家','無頭貼玩家','瀕死隊友','死亡隊友','撤離隊友','脫隊隊友','斷線隊友'][i],tal:'keen',sk:'aid',st:{STR:1,AGI:2,CON:2,PER:1,INT:1,CHA:1},load:{}})),{diff:'normal',cd:'off'},'mp');
   G.lv='A';G.lvSeen=['A'];G.node='A2';G.levels=1;G.busy=0;busy=false;G.phase='fight';LOG=[];
   P('qa1').name='玩家名稱';P('qa1').shdMax=12;P('qa1').shd=7;P('qa1').hp=8;
   AVS.qa2='data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+aX1sAAAAASUVORK5CYII=';
   Object.assign(P('qa3'),{bleed:2,frac:1,held:1,unbal:1,burn:1,humus:1,dazed:1,stance:'cover'});
   Object.assign(P('qa4'),{hp:0,down:1});Object.assign(P('qa5'),{hp:0,dead:1});P('qa7').leftBehind='A';P('qa8').away=1;
   G.fight={foes:[Object.assign(newFoe(0,'infected',8,false),{n:'感染者'})],P:8,sl:{},hb:{},bg:{},order:[{k:'p',id:'qa1',init:15},{k:'f',id:0,init:5}],turn:0,round:1,arrows:{},opening:'normal',cur:null,noflee:false,tUsed:{},escaped:['qa6'],group:['qa1'],gStart:0,gEnd:1,pend:{}};
   FTAB=null;PEND=null;draw();
  });
  check(tag+' 所有八位玩家都有卡片',await page.locator('#battle-party .battle-player').count()===8);
  check(tag+' 立繪優先、頭貼與初字備援',await page.evaluate(()=>{const c=document.querySelectorAll('.battle-player');return c[0].querySelector('.fpic img').getAttribute('src')==='img/g_dar.webp'&&c[1].querySelector('.av.pic img')&&c[2].querySelector('.av').textContent==='無'}));
  check(tag+' 血量護盾防禦及戰鬥狀態',await page.evaluate(()=>{const c=[...document.querySelectorAll('.battle-player')].map(x=>x.textContent);return /生命\s*8\//.test(c[0])&&/護盾\s*7\/12/.test(c[0])&&c[0].includes('防禦')&&['流血','骨折','被抓住','失衡','燃燒','腐殖','暈眩','掩蔽'].every(x=>c[2].includes(x))&&c[3].includes('瀕死')&&c[4].includes('死亡')&&c[5].includes('已撤離')&&c[6].includes('脫隊')&&c[7].includes('離線')}));
  check(tag+' 繪製不寫入G，舊存檔與同步狀態可重畫',await page.evaluate(()=>{const before=JSON.stringify(G);battlePlayerCards();const same=before===JSON.stringify(G);G=JSON.parse(before);draw();return same&&document.querySelectorAll('.battle-player').length===8}));
  await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(500);
  check(tag+' 卡片位於順序條下方且保留操作空間',await page.evaluate(()=>{const p=document.querySelector('#battle-party'),o=document.querySelector('#order'),c=document.querySelector('.cols');return o.nextElementSibling===p&&p.offsetTop>=o.offsetTop+o.offsetHeight&&c.clientHeight>=95&&p.clientWidth>100}));
  check(tag+' 卡片文字沒有裁切且卡片可滑到最後',await page.evaluate(()=>{const p=document.querySelector('#battle-party');const ok=[...p.querySelectorAll('.fin,.fh b,.fk,.fst')].every(e=>e.scrollWidth<=e.clientWidth+2&&e.scrollHeight<=e.clientHeight+2);p.scrollLeft=p.scrollWidth;return ok&&p.scrollLeft>0&&p.scrollLeft+p.clientWidth>=p.scrollWidth-2}));
  await page.screenshot({path:`${OUT}/party-last-${tag}.png`});await page.evaluate(()=>document.querySelector('#battle-party').scrollLeft=0);
  check(tag+' 圖片均已載入',await page.locator('#battle-party img').evaluateAll(xs=>xs.every(x=>x.complete&&x.naturalWidth>0)));
  await page.screenshot({path:`${OUT}/party-${tag}.png`});
  check(tag+' 護盾停用、破盾、受傷與治療即時更新',await page.evaluate(()=>{const p=P('qa1'),h=p.hand.R;p.hand.R=null;p.hand.L=null;draw();const off=document.querySelector('.battle-player').textContent.includes('離手');p.shd=0;draw();const broken=document.querySelector('.battle-player').textContent.includes('已破');p.hand.R=h;p.shd=3;p.hp=5;draw();const hit=/生命\s*5\//.test(document.querySelector('.battle-player').textContent);p.hp=p.max;draw();return off&&broken&&hit&&document.querySelector('.battle-player .fhp span').textContent===p.max+'/'+p.max}));
  check(tag+' 非戰鬥隱藏卡片且不出現無效文字',await page.evaluate(()=>{const clean=!/undefined|NaN|\[object/.test(document.querySelector('#battle-party').textContent);G.fight=null;G.phase='node';draw();return clean&&document.querySelector('#cbar').hidden}));
  await ctx.close();
 }
 check('沒有程式錯誤',report.errors.length===0);
 }finally{fs.writeFileSync(`${OUT}/report.json`,JSON.stringify(report,null,2));await browser.close();console.log(JSON.stringify(report,null,2))}
})().catch(e=>{console.error(e);process.exit(1)});
