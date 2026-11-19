// 只截手繪草稿。不碰 index.html。
import {spawn} from 'node:child_process';
import {mkdirSync, writeFileSync, rmSync} from 'node:fs';
import {setTimeout as sleep} from 'node:timers/promises';
import path from 'node:path';
import {fileURLToPath} from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '../..');
const out = path.resolve(process.argv[2] || '/tmp/blunt-sprite');
const port = 8766;
const ids = ['sp-shock','sp-shock-low','sp-smash','sp-smash-low','sp-compare'];
mkdirSync(out, {recursive:true});

const server = spawn('python3', ['-m', 'http.server', String(port), '--bind', '127.0.0.1'], {cwd:root, stdio:'ignore'});
const chrome = spawn('google-chrome', [
  '--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-first-run',
  '--no-default-browser-check', '--disable-dev-shm-usage',
  '--remote-debugging-port=9223', '--user-data-dir=/tmp/chrome-blunt-sprite',
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
    try{ await fetch('http://127.0.0.1:9223/json/version'); break; }
    catch{ await sleep(200); }
    if(i===49) throw new Error('Chrome 沒有起來');
  }
  const ver = await (await fetch('http://127.0.0.1:9223/json/version')).json();
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
  for(const size of sizes){
    await cdpSend(ws, 'Emulation.setDeviceMetricsOverride', {
      width:size.w, height:size.h, deviceScaleFactor:1, mobile:false
    }, sessionId);
    const url = `http://127.0.0.1:${port}/docs/blunt/preview.html?fx=sp-compare&t=0&sound=0&motion=full`;
    await cdpSend(ws, 'Page.navigate', {url}, sessionId);
    for(let i=0;i<50;i++){
      const href = await evalJson(ws, sessionId, 'location.href').catch(()=>'');
      const ready = await evalJson(ws, sessionId, 'document.readyState').catch(()=>'');
      if(String(href).includes('preview.html') && ready==='complete') break;
      await sleep(200);
      if(i===49) throw new Error('預覽頁沒有載入');
    }
    await cdpSend(ws, 'Runtime.evaluate', {
      expression:'BLUNT_PREVIEW.ready', awaitPromise:true
    }, sessionId);
    const dir = path.join(out, size.tag);
    mkdirSync(dir, {recursive:true});
    for(const id of ids){
      const still = await evalJson(ws, sessionId, `BLUNT_PREVIEW.still(${JSON.stringify(id)})`);
      const total = await evalJson(ws, sessionId, `BLUNT_PREVIEW.total(${JSON.stringify(id)})`);
      await paint(ws, sessionId, id, still);
      const ink = await evalJson(ws, sessionId, 'BLUNT_PREVIEW.ink()');
      if(!(ink>30)) throw new Error(`${size.tag} ${id} 幾乎是空的（${ink}）`);
      writeFileSync(path.join(dir, `${id}.png`), await shot(ws, sessionId));
      const effectDir = path.join(out, 'frames', `${size.tag}-${id}`);
      rmSync(effectDir, {recursive:true, force:true});
      mkdirSync(effectDir, {recursive:true});
      let fi=0;
      for(let t=0; t<=total; t+=40){
        await paint(ws, sessionId, id, t);
        writeFileSync(path.join(effectDir, String(fi).padStart(3,'0')+'.png'), await shot(ws, sessionId));
        fi++;
      }
      await encode(path.join(effectDir, '%03d.png'), path.join(dir, `${id}.mp4`));
      console.log(`${size.tag} ${id} still=${still} ink=${ink} frames=${fi}`);
    }
  }
  console.log('輸出', out);
}
async function paint(ws, sessionId, id, t){
  const r = await cdpSend(ws, 'Runtime.evaluate', {
    expression:`BLUNT_PREVIEW.setReduce(false); BLUNT_PREVIEW.show(${JSON.stringify(id)}, ${t});`,
    returnByValue:true
  }, sessionId);
  if(r.exceptionDetails) throw new Error(JSON.stringify(r.exceptionDetails));
}
async function evalJson(ws, sessionId, expr){
  const r = await cdpSend(ws, 'Runtime.evaluate', {expression:expr, returnByValue:true, awaitPromise:true}, sessionId);
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
    p.on('exit', code=> code===0 ? resolve() : reject(new Error('ffmpeg '+code)));
  });
}
main().catch(err=>{ console.error(err); process.exitCode=1; }).finally(()=>{
  chrome.kill('SIGKILL'); server.kill('SIGKILL');
});
