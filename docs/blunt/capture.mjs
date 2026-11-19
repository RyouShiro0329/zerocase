// 預覽截圖。只讀 docs/blunt/preview.html，不碰遊戲本體。
// 用法：node docs/blunt/capture.mjs [輸出目錄]
import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.resolve(process.argv[2] || '/tmp/blunt-preview');
const port = 8765;
mkdirSync(out, {recursive:true});

const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {cwd:root, stdio:'ignore'});
const chrome = spawn('google-chrome', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--no-default-browser-check', '--disable-dev-shm-usage',
  '--remote-debugging-port=9222', '--user-data-dir=/tmp/chrome-blunt-profile',
  '--window-size=1280,720', 'about:blank'
], {stdio:'ignore'});

let seq = 0;
const waiters = new Map();
function cdpSend(ws, method, params={}, sessionId){
  const id = ++seq;
  const msg = {id, method, params};
  if(sessionId) msg.sessionId = sessionId;
  ws.send(JSON.stringify(msg));
  return new Promise((resolve, reject)=>{
    const timer = setTimeout(()=>reject(new Error('逾時 '+method)), 20000);
    waiters.set(id, {resolve, reject, timer});
  });
}

async function main(){
  for(let i=0;i<50;i++){
    try{ await fetch('http://127.0.0.1:9222/json/version'); break; }
    catch{ await sleep(200); }
    if(i===49) throw new Error('Chrome 沒有起來');
  }
  const ver = await (await fetch('http://127.0.0.1:9222/json/version')).json();
  const ws = new WebSocket(ver.webSocketDebuggerUrl);
  await new Promise((res,rej)=>{ ws.addEventListener('open', res); ws.addEventListener('error', rej); });
  ws.addEventListener('message', ev=>{
    const m = JSON.parse(ev.data);
    if(m.id && waiters.has(m.id)){
      const w = waiters.get(m.id); waiters.delete(m.id); clearTimeout(w.timer);
      if(m.error) w.reject(new Error(JSON.stringify(m.error)));
      else w.resolve(m.result);
    }
  });
  const {targetId} = await cdpSend(ws, 'Target.createTarget', {url:'about:blank'});
  const {sessionId} = await cdpSend(ws, 'Target.attachToTarget', {targetId, flatten:true});
  await cdpSend(ws, 'Page.enable', {}, sessionId);
  await cdpSend(ws, 'Runtime.enable', {}, sessionId);

  const sizes = [{w:1280,h:720,tag:'1280x720'}, {w:844,h:390,tag:'844x390'}];
  const framesRoot = path.join(out, 'frames');
  rmSync(framesRoot, {recursive:true, force:true});
  mkdirSync(framesRoot, {recursive:true});

  for(const size of sizes){
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', {
      width:size.w, height:size.h, deviceScaleFactor:1, mobile:false
    }, sessionId);
    const url = `http://127.0.0.1:${port}/docs/blunt/preview.html?fx=hit&t=0&sound=0&motion=full`;
    await cdpSend(ws, 'Page.navigate', {url}, sessionId);
    for(let i=0;i<50;i++){
      const href = await evalJson(ws, sessionId, 'location.href').catch(()=> '');
      const ready = await evalJson(ws, sessionId, 'document.readyState').catch(()=> '');
      if(String(href).includes('preview.html') && ready==='complete') break;
      await sleep(200);
      if(i===49) throw new Error('預覽頁沒有載入');
    }
    await cdpSend(ws, 'Runtime.evaluate', {
      expression:`Promise.all([document.fonts.ready, ...[...document.images].map(i=>i.decode().catch(()=>{}))])`,
      awaitPromise:true
    }, sessionId);
    const ids = await evalJson(ws, sessionId, 'BLUNT_PREVIEW.ids');
    const dir = path.join(out, size.tag);
    mkdirSync(dir, {recursive:true});
    const reel = path.join(framesRoot, size.tag);
    mkdirSync(reel, {recursive:true});
    let reelIndex = 0;
    for(const id of ids){
      const still = await evalJson(ws, sessionId, `BLUNT_PREVIEW.still(${JSON.stringify(id)})`);
      const total = await evalJson(ws, sessionId, `BLUNT_PREVIEW.total(${JSON.stringify(id)})`);
      await paint(ws, sessionId, id, still, false);
      const ink = await evalJson(ws, sessionId, 'BLUNT_PREVIEW.ink()');
      if(!(ink>8)) throw new Error(`${size.tag} ${id} 畫面幾乎是空的（${ink}）`);
      const png = await shot(ws, sessionId);
      writeFileSync(path.join(dir, `${id}.png`), png);
      const step = 40;
      const effectDir = path.join(framesRoot, `${size.tag}-${id}`);
      mkdirSync(effectDir, {recursive:true});
      let fi = 0;
      for(let t=0; t<=total; t+=step){
        await paint(ws, sessionId, id, t, false);
        const frame = await shot(ws, sessionId);
        const name = String(fi).padStart(3,'0')+'.png';
        writeFileSync(path.join(effectDir, name), frame);
        writeFileSync(path.join(reel, String(reelIndex).padStart(4,'0')+'.png'), frame);
        fi++; reelIndex++;
      }
      console.log(`${size.tag} ${id} still=${still} total=${total} ink=${ink} frames=${fi}`);
      await encode(path.join(effectDir, '%03d.png'), path.join(dir, `${id}.mp4`));
    }
    await paint(ws, sessionId, 'crush', await evalJson(ws, sessionId, 'BLUNT_PREVIEW.still("crush")'), true);
    const reduceInk = await evalJson(ws, sessionId, 'BLUNT_PREVIEW.ink()');
    if(!(reduceInk>8)) throw new Error('減少動態的粉碎是空的');
    writeFileSync(path.join(dir, 'crush-reduce.png'), await shot(ws, sessionId));
    await encode(path.join(reel, '%04d.png'), path.join(dir, 'reel.mp4'));
  }
  console.log('輸出', out);
}

async function paint(ws, sessionId, id, t, reduce){
  await cdpSend(ws, 'Runtime.evaluate', {
    expression:`BLUNT_PREVIEW.setReduce(${reduce?'true':'false'}); BLUNT_PREVIEW.show(${JSON.stringify(id)}, ${t});`,
    returnByValue:true
  }, sessionId);
}
async function evalJson(ws, sessionId, expr){
  const r = await cdpSend(ws, 'Runtime.evaluate', {expression:expr, returnByValue:true}, sessionId);
  if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
  return r.result.value;
}
async function shot(ws, sessionId){
  const r = await cdpSend(ws, 'Page.captureScreenshot', {format:'png'}, sessionId);
  return Buffer.from(r.data, 'base64');
}
function encode(pattern, dest){
  return new Promise((resolve, reject)=>{
    const p = spawn('ffmpeg', ['-y','-framerate','25','-i',pattern,'-c:v','libx264','-pix_fmt','yuv420p','-movflags','+faststart', dest], {stdio:'ignore'});
    p.on('exit', code=> code===0 ? resolve() : reject(new Error('ffmpeg '+code+' '+dest)));
  });
}

main().catch(err=>{ console.error(err); process.exitCode=1; }).finally(()=>{
  chrome.kill('SIGKILL');
  server.kill('SIGKILL');
});
