const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto'),vm=require('node:vm');
const {game}=require('../../tests/helpers/audio-game.cjs');
test('素材管理器：同檔去重、一次失敗重試、三次上限及明確重試',async()=>{
 const g=game();let n=0;g.c.fetch=async url=>{n++;return {ok:n!==1,status:n===1?503:200,arrayBuffer:async()=>new ArrayBuffer(3)}};
 await Promise.all([g.run("ZC_ASSET_LOADER.sound('casing',1)"),g.run("ZC_ASSET_LOADER.sound('casing',1)")]);assert.equal(n,2);assert.equal(g.run("ZC_ASSET_LOADER.records.get('sound:casing').state"),'ready');
 const h=game();h.requests.fail='casing';await h.run("ZC_ASSET_LOADER.sound('casing',1)");assert.equal(h.requests.filter(x=>x.includes('casing')).length,3);assert.equal(h.run("ZC_ASSET_LOADER.records.get('sound:casing').state"),'failed');for(let i=0;i<20;i++)h.run("sfx('casing')");assert.equal(h.requests.filter(x=>x.includes('casing')).length,3);h.requests.fail=null;await h.run("ZC_ASSET_LOADER.sound('casing',1,true)");assert(h.run('!!BUF.casing'));
});
test('解碼失敗重試、備用格式、音效長度契約及過期取消',async()=>{
 const g=game();g.run('audio()');let calls=0;g.c.badDecode=(bytes,yes,no)=>{calls++;if(calls===1)no(Error('invalid audio'));else yes({duration:.4,length:100,numberOfChannels:1})};g.run('AC.decodeAudioData=badDecode');await g.run("ZC_ASSET_LOADER.sound('genloop',1)");assert.equal(calls,2);assert(g.requests.includes('sfx/genloop.mp3'));assert.equal(g.run("sfx('genloop')"),400);
 const h=game();h.c.mark={n:0};h.run('ZC_ASSET_LOADER.later(()=>mark.n++,10);stopSfx()');await new Promise(r=>setTimeout(r,30));assert.equal(h.c.mark.n,0);assert.equal(h.run('ZC_ASSET_LOADER.stats.cancelled'),1);
});
test('素材索引完整性、P1 圖像預算與 SW scope／Range／錯誤回應',async()=>{
 const root=path.resolve(__dirname,'../..'),m=JSON.parse(fs.readFileSync(path.join(root,'assets-manifest.json')));for(const f of m.assets)assert.equal(crypto.createHash('sha256').update(fs.readFileSync(path.join(root,f.url))).digest('hex'),f.hash);
 const inventory=JSON.parse(fs.readFileSync(path.join(root,'qa/asset-loading/INVENTORY.json')));assert(inventory.p1ImageDecodedBytes<=48*1048576);let handler,network=0,puts=0;const data=fs.readFileSync(path.join(root,'img/inf_m.webp')),entry=m.assets.find(x=>x.url==='img/inf_m.webp'),cache=new Map();const base='http://localhost/zerocase/';
 const worker={location:{href:base+'sw.js',pathname:'/zerocase/sw.js'},addEventListener:(name,fn)=>{if(name==='fetch')handler=fn},clients:{matchAll:async()=>[{url:base+'index.html'}]}};
 const c=vm.createContext({self:worker,URL,Response,crypto:crypto.webcrypto,caches:{open:async()=>({match:async key=>cache.get(typeof key==='string'?key:key.url)?.clone(),put:async(k,r)=>{puts++;cache.set(k,r)},keys:async()=>[]})},fetch:async req=>{network++;const u=typeof req==='string'?req:req.url||req.href;if(u.includes('assets-manifest'))return Response.json(m);if(typeof req!=='string'&&req.headers?.has('Range'))return new Response(data.subarray(0,10),{status:206});return new Response(data)}});vm.runInContext(fs.readFileSync(path.join(root,'sw.js'),'utf8'),c);
 let response;const send=async(url,headers)=>{response=null;handler({request:new Request(url,{headers}),respondWith:p=>response=p});return response?await response:null};
 assert.equal(await send('http://localhost/private.json'),null);assert.equal(await send(base+'save.json'),null);let r=await send(base+'img/inf_m.webp?zc-h='+entry.hash);assert.equal(r.status,200);assert.equal(puts,1);const before=network;r=await send(base+'img/inf_m.webp?zc-h='+entry.hash);assert.equal(network,before);r=await send(base+'img/inf_m.webp',{Range:'bytes=0-9'});assert.equal(r.status,206);assert.equal(puts,1);
});
