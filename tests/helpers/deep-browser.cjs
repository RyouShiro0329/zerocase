const path=require('node:path');
const BE=require('./browser-errors.cjs'),DR=require('./driver.cjs');
const ROOT=path.resolve(__dirname,'../..'),ORIGIN='http://deep.invalid';
async function context(browser,{speed=.3,seed=773,instrument}={}){
 const ctx=await browser.newContext({viewport:{width:844,height:390},serviceWorkers:'block'});
 await ctx.addInitScript(DR.seedScript,seed);
 await ctx.addInitScript({path:path.join(ROOT,'tests/multiplayer/mock.js')});
 await ctx.addInitScript(speed=>{localStorage.setItem('zc5-ui',JSON.stringify({snd:0,bgm:0,spd:speed,orient:'auto'}));localStorage.setItem('zc5-meta',JSON.stringify({shards:0,unlocked:['maggie','liao'],runs:0,clears:0,got:[]}))},speed);
 if(instrument)await ctx.addInitScript(instrument);
 await ctx.routeWebSocket('**/*',ws=>ws.close());
 process.env.QA_SERVE='route';await BE.serve(ctx,ORIGIN,ROOT);
 await ctx.route(u=>u.origin!==ORIGIN,r=>r.abort());
 const page=await ctx.newPage(),errors=BE.watch(page,ORIGIN),nav=performance.now();await page.goto(ORIGIN+'/index.html');const navigationMs=performance.now()-nav;
 return {ctx,page,errors,navigationMs};
}
async function start(page,{gate=false}={}){
 if(gate)await page.click('#gateNo');
 await page.click('[data-cat="story"]');await page.click('[data-rsel="maggie"]');await page.click('[data-m="rpick"]');await page.click('[data-m="cdone"]');await page.click('[data-m="solo"]');await page.click('[data-dif="normal"]');await page.click('[data-m="go"]');
 await page.waitForFunction(()=>G&&G.phase==='node'&&!busy&&!G.busy,null,{timeout:30000});
}
module.exports={context,start,ROOT,ORIGIN};
