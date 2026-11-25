// 事件環境相容（Claude 2026-11-25，QA 升級 PR-C：QA-07）
// 遊戲自己有「這個地方有哪些環境標記」（qte.js 的 HZL／HZN），但那是寫遊戲的人自己標的，標錯了沒有東西會發現。
// 這裡是測試這邊「另外一份」對照表：照節點文字判斷每個地點是室內、有頂棚還是戶外，事件節點有什麼東西（地毯、客房、街道……），
// 再和遊戲實際會抽到的東西比對：
//   1. 隨機意外（HAZ）：遊戲給這個節點的環境標記，要符合這裡的室內／戶外（例如烏鴉不會在地下的維修步道、燈管不會砸在大街上）
//   2. 隨機事件（EVPOOL）：每個事件節點抽得到的事件，文字裡需要的東西（地毯、客房、街道、看得到天空……）這個節點要有
// 新增地點、事件節點、事件、意外種類時，對照表沒有就算失敗：要先在這裡分類（看節點文字），不能默默略過。
// 對照表是 Claude 2026-11-25 讀節點文字整理的；KNOWN 是目前遊戲裡對不上、等主人決定的組合（列為暫緩，不讓測試失敗；
// 修好之後還留在 KNOWN 會失敗，提醒把它拿掉）。
const path=require('node:path');
const {load}=require('./game-vm.cjs');
// 地點：in 室內、cover 有頂棚但不是密閉的房間（地下停車場、加油站頂棚）、out 戶外
const PLACE_IO={A:'in',B:'in',C:'in',E:'in',F:'in',G:'in',H:'in',I:'in',Y:'in',M:'in',O:'in',OF:'in',OB:'in',T:'in',L:'in',S:'in',N:'in',SA:'in',SB:'in',SC:'in',U:'in',PP:'in',BM:'in',
 P:'cover',D:'out',R:'out',J:'out',K:'out',Q:'out',BQ:'out',V:'out',Z:'out',X:'out',W:'out',CA:'out',BA:'out',WP:'out'};
// 節點和所在地點不一樣的（看節點文字）
const NODE_IO={
 J2:'out',      // 前街：藥局鐵捲門外的人行道
 M3:'out',M4:'out',M5:'out',M3s:'cover', // 便利商店：側邊出口、後面停車場、大馬路；加油站頂棚
 T2:'out',      // 消防局：看得到整個街區的高處
 O0:'out',Orv:'out', // 醫院救護車道
 L0:'out',      // 警察局門口沙包牆、停車場
 BA2:'in',BA3:'in',BA4:'in', // 後備中心：軍械庫、指揮大樓會議室、拘留室
 PP0:'out',PP5:'out',PP5t:'out',PP5w:'out',PP6:'out', // 電廠：圍牆、煤場、開關場碎石地、油罐車
 WP3:'in',WP4:'in',WP5:'in',WP5b:'in', // 淨水廠：加氯室、中央控制室、送水泵房、管理大樓
 BM0:'in'       // 地鐵維修步道、配電室（地下）
};
// 每種意外需要的地方
const HZ_NEED={tube:['in','cover'],cart:['in','cover'],floor:['in'],vent:['in','cover'],window:['in','out'],sign:['out'],truck:['out'],ac:['out'],pipe:['out'],crow:['out','cover']};
// 事件節點有什麼（看節點和前後節點的文字）
const H=['hotel'],ST=['out','street','sky'];
const EV_NODE={
 A5:[...H,'in','carpet','guestroom','corridor'],A5x:[...H,'in','carpet','guestroom','corridor'],
 B3:[...H,'in','carpet','guestroom','corridor'],B3x:[...H,'in','carpet','guestroom','corridor'],
 C3:[...H,'in','shaft'],D3:[...H,'out','fireescape','sky'],
 E3:[...H,'in','corridor','backhouse'],E3x:[...H,'in','corridor','backhouse'], // 一樓後場：辦公室、備品間、櫃台後面，文字裡沒有地毯、客房
 F3:[...H,'in','kitchen'],G3:[...H,'in','basement'],R3:[...H,'out','roof','sky'],H3:[...H,'in','laundry','corridor'],P3:[...H,'cover','parking','cars'],
 Y1:[...H,'in','corridor','guestroom','carpet'],
 J3:[...ST,'cars'],V2:[...ST,'cars'],Z1:[...ST,'cars'],K3:[...ST,'alley'],M3:[...ST,'store','cars'],Q3:[...ST,'blockade','cars'],
 U3:['in','subway','water']
};
// 每個事件文字裡需要的東西
const need=(ids,f)=>Object.fromEntries(ids.map(i=>[i,f]));
const EV_NEED={
 ...need(['lights','name','blood','radio','survivor','body','smell'],['hotel']),
 floor:['carpet'],kid:['carpet'],tv:['guestroom'],phone:['guestroom'],smoke:['corridor'],mirror:['corridor'],roomservice:['carpet','corridor'],
 ...need(['scooter','pack','atm','shrine','looters','phonebooth','trader1','trader2','raid1','raid2','shadow1','acru1','acru2','water1','bmrumor'],['street']),
 drone:['sky'],rain:['sky'],
 ...need(['c_cable','c_breath','c_relic','c_oil','c_drop'],['shaft']),
 ...need(['d_figure','d_curtain','d_ladder','d_pack','d_siren'],['fireescape']),
 ...need(['f_grease','f_pantry','f_bell'],['kitchen']),
 ...need(['h_dryer','h_sheets','h_locker'],['laundry']),
 ...need(['g_pipe','g_fiber','g_worker'],['basement']),
 ...need(['p_alarm','p_crawl','p_trunk'],['parking']),
 ...need(['yh1a','yh1b','yh1c','yh1d','yh1e','yh2a','yh2b','yh2c','yh2d','yh2e','yh3a','yh3b','yh3c','yh3d','yh3e','yh4a','yh4b','yh4c'],['hotel']),
 ...need(['sj_hydrant','sj_mannequin','sv_ambulance','sv_sign'],['street']),
 ...need(['sk_dumpster','sk_ladder'],['alley']),
 ...need(['sm_van','sm_ding'],['store']),
 ...need(['sq_speaker','sq_crate'],['blockade']),
 ...need(['su_flood','su_rats','su_vending'],['subway'])
};
// 目前對不上、等主人決定的（2026-11-25 PR-C 找到）
const KNOWN=[
 'hz:J2:tube',   // 前街藥局門口（人行道）會抽到「天花板的燈管整排垂下來」
 'hz:M3:tube',   // 便利商店 M3（事件節點，抽到的都是街上的事件：下雨、無人機、劫匪）會抽到「天花板的燈管」（M 整個地點標成 tube）
 'hz:BM0:crow',  // 地下維修步道、配電室會抽到「烏鴉從電線上俯衝」（BM 整個地點標成 crow）
 'ev:E3:floor','ev:E3x:floor',             // 一樓後場抽到「地毯上有東西在反光」
 'ev:E3:kid','ev:E3x:kid',                 // 一樓後場抽到「轉角的地毯上放著一雙小運動鞋」
 'ev:E3:roomservice','ev:E3x:roomservice'  // 一樓後場抽到「客房服務推車……餐蓋掉在地毯上」
];
function check(htmlPath){
 const g=load(htmlPath);
 const D=JSON.parse(g.run(`JSON.stringify({
  nodes:Object.entries(N).map(([k,n])=>[k,n.L,n.at||null,!!n.ev,hzBanned(k)||!!(n.noHaz||n.trade||n.rest),hzEnvOf(k,n.L)]),
  lv:Object.fromEntries(Object.entries(LV).map(([k,v])=>[k,v.ch||1])),
  ev:EVPOOL.map(e=>({id:e.id,ch:e.ch||1,at:e.at||null,z:e.z||null})),
  haz:[...HAZ[1],...HAZ[2]].map(h=>({id:h.id,env:h.env}))})`));
 const R={problems:[],known:[],staleKnown:[],tableGaps:[],counts:{}};const found=new Set();
 const bad=(k,msg)=>{found.add(k);(KNOWN.includes(k)?R.known:R.problems).push(k+'　'+msg)};
 // 對照表本身要完整
 for(const h of D.haz)if(!HZ_NEED[h.env])R.tableGaps.push(`意外 ${h.id} 的環境標記「${h.env}」不在 HZ_NEED`);
 for(const e of D.ev)if(!EV_NEED[e.id])R.tableGaps.push(`事件 ${e.id} 不在 EV_NEED（要先看文字分類）`);
 let hzChecked=0,evChecked=0;
 // 1. 隨機意外
 for(const [k,L,,,ban,env] of D.nodes){if(ban||!env.length)continue;
  const io=NODE_IO[k]||PLACE_IO[L];if(!io){R.tableGaps.push(`地點 ${L}（節點 ${k}）不在 PLACE_IO`);continue}
  for(const e of env){hzChecked++;const ok=HZ_NEED[e];if(ok&&!ok.includes(io))bad(`hz:${k}:${e}`,`${k}（${io==='in'?'室內':io==='out'?'戶外':'有頂棚'}）會抽到意外「${e}」，需要 ${ok.join('／')}`)}}
 // 2. 隨機事件（照 engine_c 的 evCands 選候選，旗標、天數、旅館階段都當作可能成立）
 for(const [k,L,at,isEv] of D.nodes){if(!isEv)continue;const has=EV_NODE[k];if(!has){R.tableGaps.push(`事件節點 ${k}（${L}）不在 EV_NODE（要先看文字分類）`);continue}
  const ch=D.lv[L]||1,key=at||L;let m=D.ev.filter(e=>e.ch===ch&&(!e.at||e.at.includes(key)));const zm=m.filter(e=>e.z===L);m=zm.length?zm:m.filter(e=>!e.z);
  for(const e of m){evChecked++;const nd=EV_NEED[e.id];if(!nd)continue;const miss=nd.filter(f=>!has.includes(f));if(miss.length)bad(`ev:${k}:${e.id}`,`事件節點 ${k} 會抽到事件「${e.id}」，需要 ${miss.join('、')}，這個節點沒有`)}}
 for(const k of KNOWN)if(!found.has(k))R.staleKnown.push(k);
 for(const k of Object.keys(NODE_IO))if(!D.nodes.some(n=>n[0]===k))R.tableGaps.push(`NODE_IO 的節點 ${k} 已經不存在`);
 for(const k of Object.keys(EV_NODE))if(!D.nodes.some(n=>n[0]===k&&n[3]))R.tableGaps.push(`EV_NODE 的 ${k} 已經不是事件節點`);
 R.counts={nodes:D.nodes.length,hazPairs:hzChecked,evPairs:evChecked,evNodes:D.nodes.filter(n=>n[3]).length,events:D.ev.length};
 R.ok=!R.problems.length&&!R.tableGaps.length&&!R.staleKnown.length;
 return R;
}
if(require.main===module){const r=check(process.argv[2]&&path.resolve(process.argv[2]));
 console.log(`事件環境相容：意外 ${r.counts.hazPairs} 組、事件 ${r.counts.evPairs} 組（${r.counts.evNodes} 個事件節點）`);
 for(const x of r.tableGaps)console.log('對照表缺　'+x);for(const x of r.problems)console.log('對不上　'+x);
 for(const x of r.known)console.log('暫緩（等主人決定）　'+x);for(const x of r.staleKnown)console.log('已經對得上，請從 KNOWN 拿掉　'+x);
 process.exit(r.ok?0:1)}
module.exports={check,PLACE_IO,NODE_IO,HZ_NEED,EV_NODE,EV_NEED,KNOWN};
