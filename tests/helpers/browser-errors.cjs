// 瀏覽器錯誤分類（Claude 2026-11-25，QA 升級 PR-A：QA-29）
// 原本冒煙用正規式把 Failed to load／net::／ERR_ 整類濾掉，必要的圖片、音效 404 也一起被吞掉。
// 現在改成看網路事件逐筆分類：
//   required（算失敗）：頁面錯誤（pageerror）、其他 console.error、同網域的檔案回 4xx／5xx 或載入失敗
//   optional（只記錄）：外部連線（firebase、gstatic、googleapis：測試環境可能沒網路）、favicon.ico
//   aborted（只記錄）：net::ERR_ABORTED（換頁、重新整理時瀏覽器自己取消的請求；檔案不存在會先回 404，不會走這裡）
// console 的「Failed to load resource」不另外算：同一件事網路事件已經分類過了。
const fs=require('node:fs'),path=require('node:path');
const EXTERNAL_OK=/firebase|gstatic|googleapis|firebaseio/i;
function watch(page,origin){
 const rec={required:[],optional:[],aborted:[]};
 const add=(k,kind,msg)=>{if(rec[k].length<200)rec[k].push({kind,msg:String(msg).slice(0,300)})};
 const classify=(url,why)=>{let u;try{u=new URL(url)}catch(e){return add('required','網路',why+' '+url)}
  const same=u.origin===origin,p=decodeURIComponent(u.pathname).replace(/^\//,'');
  if(same&&p==='favicon.ico')return add('optional','favicon',why+' '+p);
  if(same)return add('required','缺少或載入失敗的檔案',why+' '+p);
  if(EXTERNAL_OK.test(u.host))return add('optional','外部連線',why+' '+u.host+u.pathname);
  return add('optional','其他外部連線',why+' '+u.host+u.pathname)};
 page.on('pageerror',e=>add('required','程式錯誤',e.message));
 page.on('console',m=>{if(m.type()!=='error')return;const t=m.text();
  if(/^Failed to load resource/i.test(t))return;
  if(EXTERNAL_OK.test(t))return add('optional','外部連線',t);
  add('required','console.error',t)});
 page.on('response',r=>{if(r.status()>=400)classify(r.url(),'HTTP '+r.status())});
 page.on('requestfailed',r=>{const err=(r.failure()||{}).errorText||'失敗';if(/ERR_ABORTED/i.test(err))return add('aborted','取消',err+' '+r.url());classify(r.url(),err)});
 return rec;
}
const brief=rec=>rec.required.slice(0,3).map(x=>x.kind+'：'+x.msg).join(' | ');
// QA_SERVE=route：不開本機伺服器，由 playwright 直接讀倉庫檔案回應（本機不能開埠時用；CI 照舊用 python http.server）
const MIME={html:'text/html; charset=utf-8',js:'text/javascript',css:'text/css',json:'application/json',webp:'image/webp',png:'image/png',jpg:'image/jpeg',svg:'image/svg+xml',mp3:'audio/mpeg',ogg:'audio/ogg',wav:'audio/wav',m4a:'audio/mp4',woff2:'font/woff2',woff:'font/woff',ttf:'font/ttf',txt:'text/plain; charset=utf-8'};
async function serve(ctx,origin,root){
 if(process.env.QA_SERVE!=='route')return;
 root=path.resolve(root);
 await ctx.route(origin+'/**',async r=>{const u=new URL(r.request().url());const f=path.join(root,decodeURIComponent(u.pathname));
  if(f.startsWith(root+path.sep)&&fs.existsSync(f)&&fs.statSync(f).isFile())return r.fulfill({status:200,body:fs.readFileSync(f),contentType:MIME[f.split('.').pop().toLowerCase()]||'application/octet-stream'});
  return r.fulfill({status:404,contentType:'text/plain',body:'404'})});
}
// 失敗時存截圖到 test-results/screenshots/（CI 會上傳）
async function shot(page,name){try{const d=path.resolve(__dirname,'../..',process.env.QA_OUT||'test-results','screenshots');fs.mkdirSync(d,{recursive:true});const f=path.join(d,name.replace(/[^\w.-]+/g,'_')+'.png');await page.screenshot({path:f});return path.relative(path.resolve(__dirname,'../..'),f)}catch(e){return null}}
module.exports={watch,brief,serve,shot};
