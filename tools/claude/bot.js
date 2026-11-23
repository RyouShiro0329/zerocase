const {chromium}=require('playwright');
const runs=+(process.argv[2]||6);
(async()=>{const b=await chromium.launch();const res=[];
for(let r=0;r<runs;r++){
  const ctx=await b.newContext({viewport:{width:844,height:390}});await ctx.addInitScript(()=>{setInterval(()=>{const b=document.querySelector('#qte .qbx.now:not(.done)');if(b&&Math.random()<.25)b.dispatchEvent(new PointerEvent('pointerdown',{bubbles:true}));const k=document.querySelector('#qcode [data-k="no"]');if(k)k.click()},100)});const p=await ctx.newPage();const errs=[];
  p.on('pageerror',e=>errs.push(e.message));p.on('console',m=>{if(m.type()==='error'&&!/Failed to load|fonts/.test(m.text()))errs.push(m.text())});
  await p.goto('http://localhost:8767/test.html');
  await p.evaluate(()=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:.3,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}));localStorage.setItem('zc9-build',JSON.stringify({kind:'custom',name:'',st:{STR:2,AGI:2,CON:2,PER:2,INT:2,CHA:2},tal:'keen',sk:'aid',load:{water:1,bar:1,bandage:1,'g:knife':1,med:1,lighter:1,tape:1}}));});
  await p.reload();
  await p.click('#gateNo');
  if(process.argv[3]){await p.click('[data-cat="story"]');await p.click('[data-rsel="'+process.argv[3]+'"]');await p.click('[data-m="rpick"]')}else await p.click('[data-cat="custom"]');
  await p.click('[data-m="cdone"]');await p.click('[data-m="solo"]');if(process.argv[4])await p.click('[data-dif="'+process.argv[4]+'"]');await p.click('[data-m="go"]');
  const t0=Date.now();let steps=0;
  while(Date.now()-t0<240000){
    const st=await p.evaluate(()=>{const g=window.__G();if(!g)return {none:1};return {over:g.over,node:g.node,phase:g.phase,busy:g.busy}});
    if(st.over){res.push({r,over:st.over.dead?'dead':st.over.end,steps,node:st.node,errs,p:await p.evaluate(()=>{const m=window.__G().players[0];return {hp:m.hp,fe:m.fe,stg:typeof fstgN==='function'?fstgN(m):'',inf:m.inf,lost:m.lost,lv:m.lv,kills:m.kills,hun:m.hun,thi:m.thi,levels:window.__G().levels,path:LOG.filter(x=>x[1]==='hd').map(x=>x[0]).join('>'),log:LOG.slice(-40).map(x=>x[0].replace(/<[^>]+>/g,'')).join('\n')}})});break}
    await p.evaluate(()=>{const g=window.__G();const m=window.__me();if(m&&!g.busy&&!g.over&&!m.down){const myT=!g.fight||(g.fight.order[g.fight.turn]||{}).id===m.pid;
      if(myT){const med=['surgkit','med','sbandage','bandage','painkiller'].find(k=>m.items[k]);const inf=['antibiotic','iodine','alcohol'].find(k=>m.items[k]);
        if(m.hp<m.max*.5&&med){window.__act({a:'use',k:med});return}
        const sk=['sedative','coffee','whiskey','photo','cigarette'].find(k=>m.items[k]&&(k!=='cigarette'||m.items.lighter));if((m.fe||0)>=50&&sk&&!(k=>0)()){window.__act({a:'use',k:sk})}
        if(!g.fight&&m.inf>45&&inf){window.__act({a:'use',k:inf});return}
        if(!g.fight&&(m.thi<=3)&&(m.items.water||m.items.cola||m.items.coffee)){window.__act({a:'use',k:m.items.water?'water':m.items.cola?'cola':'coffee'});return}
        if(!g.fight&&(m.hun<=3)){const f=['bar','noodle','cookie','chips','nuts'].find(k=>m.items[k]);if(f){window.__act({a:'use',k:f});return}}
        if(!g.fight&&m.bleed&&m.items.cloth>=2){window.__act({a:'craft',slots:[{k:'cloth'},{k:'cloth'}]});return}
      }}});
    await p.evaluate(()=>{const d=document.querySelector('#dice');if(!d.hidden)d.click();const c=document.querySelector('#lvcard');if(!c.hidden)c.click();
      const g=window.__G();if(g&&g.fight&&!g.busy){const ft=document.querySelector('#choices [data-ftab="atk"]');if(ft){ft.click();return}
        const atks=[...document.querySelectorAll('#choices button[data-fa="atk"]:not([disabled])')];if(atks.length){atks[0].click();return}
        const tg=document.querySelector('#choices button[data-tgt]');if(tg){tg.click();return}}
      const bs=[...document.querySelectorAll('#choices button:not([disabled])')].filter(x=>!x.hasAttribute('data-cancel')&&!(x.dataset.open));
      const pref=bs.filter(x=>x.dataset.fa==='atk'||x.dataset.tgt!=null||x.dataset.ch!=null);
      const pool=pref.length?pref:bs;if(pool.length){pool[Math.floor(Math.random()*pool.length)].click()}});
    steps++;await p.waitForTimeout(120);
  }
  if(!res.find(x=>x.r===r))res.push({r,over:'timeout',steps,errs,st:await p.evaluate(()=>{const g=window.__G();return g&&{node:g.node,phase:g.phase,busy:g.busy,fight:!!g.fight}})});
  await ctx.close();
}
console.log(JSON.stringify(res,null,1));await b.close()})();
