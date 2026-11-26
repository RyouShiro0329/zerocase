// 由實際資料表及既有動態路徑掃描產生；不取遊戲 RNG、不改測試。
const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
const root=path.resolve(__dirname,'..'),file=path.join(root,'index.html');
const {scan}=require('../tests/helpers/assets.cjs');const scanned=scan(root);
if(!scanned.ok)throw Error(JSON.stringify({missing:scanned.missing,unknown:scanned.unknownKeys}));
const rows=scanned.files.filter(p=>/\.(webp|png|jpe?g|svg|mp3|ogg|wav|woff2?)$/.test(p)).sort().map(url=>{
 const data=fs.readFileSync(path.join(root,url));const type=/sfx\/bgm/.test(url)?'media':url.startsWith('sfx/')?'audio':url.startsWith('fonts/')?'font':'image';
 return {id:url,url,type,priority:type==='font'||/cat_/.test(url)?0:type==='image'?(url.startsWith('img/')||/fx\/(slash|blunt)-/.test(url)?1:2):type==='audio'?(/radio|gen|pump|waterpipe/.test(url)?3:2):2,required:type==='font',hash:crypto.createHash('sha256').update(data).digest('hex'),size:data.length};
});
const index=JSON.stringify(rows),html=fs.readFileSync(file,'utf8');
let next=html.replace(/^const ZC_ASSET_INDEX=.*; \/\/ tools\/build_assets.cjs 產生$/m,'const ZC_ASSET_INDEX='+index+'; // tools/build_assets.cjs 產生');
if(next===html&&!html.includes('const ZC_ASSET_INDEX='+index+';'))throw Error('找不到素材索引插入點');
// CSS 與原生字型請求也固定當版內容；兩處 ?v= 保留給既有升版工具。
for(const f of rows){
 const escaped=f.url.replace(/[.*+?^${}()|[\]\\]/g,'\\$&');
 const suffix=f.url==='fonts/tw-kai-game.woff2'?'?v='+f.hash.slice(0,8)+'&zc-h='+f.hash:'?zc-h='+f.hash;
 const css=new RegExp('(url\\(\\s*["\']?)'+escaped+'(?:\\?[^"\')\\s]*)?(["\']?\\s*\\))','g');
 next=next.replace(css,(_,before,after)=>before+f.url+suffix+after);
 if(f.type==='font'){const preload=new RegExp('(<link rel="preload" href=")'+escaped+'(?:\\?[^"]*)?(" as="font")','g');next=next.replace(preload,(_,before,after)=>before+f.url+suffix+after)}
}
const manifest=JSON.stringify({schema:1,cache:'zc-assets-content-v1',assets:rows},null,2)+'\n';
if(process.argv.includes('--check')){if(!fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('const ZC_SW_FILES='+JSON.stringify(rows)+';')||next!==html||fs.readFileSync(path.join(root,'assets-manifest.json'),'utf8')!==manifest)throw Error('素材索引過期');}
else{const swPath=path.join(root,'sw.js');const sw=fs.readFileSync(swPath,'utf8').replace(/^const ZC_SW_FILES=.*; \/\/ tools\/build_assets.cjs 產生$/m,'const ZC_SW_FILES='+JSON.stringify(rows)+'; // tools/build_assets.cjs 產生');fs.writeFileSync(swPath,sw);fs.writeFileSync(file,next);fs.writeFileSync(path.join(root,'assets-manifest.json'),manifest)}
console.log(`${rows.length} 個素材，${rows.reduce((a,x)=>a+x.size,0)} bytes；已核對動態路徑及內容雜湊`);
