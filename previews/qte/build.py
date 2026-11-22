from pathlib import Path
import base64,re,json,hashlib,sys
ROOT=Path(__file__).resolve().parents[2]
src=(ROOT/'index.html').read_text()
css='\n'.join(re.findall(r'<style>([\s\S]*?)</style>',src))
def data(path,mime):return 'data:'+mime+';base64,'+base64.b64encode((ROOT/path).read_bytes()).decode()
css=re.sub(r'fonts/tw-kai-game\.woff2\?v=[a-f0-9]+',data('fonts/tw-kai-game.woff2','font/woff2'),css)
css=css.replace('fonts/source-serif-4-latin.woff2',data('fonts/source-serif-4-latin.woff2','font/woff2'))
original=src[src.index('function qteLocal(s){'):src.index('\n/* ---- 隨機意外',src.index('function qteLocal(s){'))]
original=original.replace('function qteLocal(s){','function qteLocalOriginal(s){',1)
sequential=original.replace('qteLocalOriginal','qteLocalSequential',1)
old='s.per*s.seq.length+120*(Math.ceil(s.seq.length/2)-1)';assert sequential.count(old)==1
sequential=sequential.replace(old,'s.per*s.seq.length')
assert sequential.count('Math.min(cur+2,s.seq.length)')==1
sequential=sequential.replace('Math.min(cur+2,s.seq.length)','Math.min(cur+1,s.seq.length)')
a="""      if(cur%2===0){live=false;setTimeout(()=>{if(fin)return;showPair();live=true},120)}
      else{const nb=boxes.find(x=>+x.dataset.i===cur);if(nb)nb.classList.add('now')}"""
assert sequential.count(a)==1
sequential=sequential.replace(a,"""      live=false;queueMicrotask(()=>{if(fin)return;showPair();live=true})""")
sequential=sequential.replace('// 顯示下一組（兩格）','// 逐個顯示：成功輸入後才建立下一個提示')
helpers=src[src.index('const QTE_D='):src.index('// 回傳 true＝反應過來了',src.index('const QTE_D='))]
helpers=helpers.replace("const qteTouch=()=>matchMedia('(pointer:coarse)').matches&&!matchMedia('(hover:hover)').matches;","const qteTouch=()=>$('#inputMode').value==='touch';")
layout=src[src.index('function layout(){'):src.index('// 全螢幕並鎖定橫向',src.index('function layout(){'))]
custom_css='''
.preview-title{display:flex;align-items:center;justify-content:space-between;gap:12px;min-height:40px;border-bottom:1px solid var(--line)}
.preview-title h1{font-size:1.25rem;color:var(--gold);margin:0}.preview-title small{color:var(--muted)}
.preview-body{display:grid;grid-template-columns:minmax(0,1fr) minmax(0,1fr);gap:10px;flex:1;min-height:0}
.preview-left,.preview-right{padding:12px;box-sizing:border-box;min-height:0;overflow:auto}.preview-left p{line-height:1.65;margin:8px 0}.preview-left h2{color:var(--gold);font-size:1.05rem;margin:0 0 8px}
.preview-foe{display:flex;gap:12px;align-items:center}.preview-foe img{height:85px;width:64px;object-fit:cover;object-position:top;border:1px solid #5a3632}.preview-foe b{display:block;color:#cb8075}.preview-foe span{display:block;color:var(--muted);font-size:.83rem;margin-top:7px}
.preview-modes{display:grid;grid-template-columns:repeat(3,1fr);gap:6px}.preview-modes button{padding:9px 3px;min-height:48px;font-size:.92rem}.preview-modes button[aria-pressed=true]{border-color:var(--gold);background:linear-gradient(180deg,#4b3b1d,#17130b);color:#f3d79a}
.preview-setting{display:flex;flex-wrap:wrap;gap:6px 12px;align-items:center;margin:9px 0}.preview-setting label{font-size:.86rem;white-space:nowrap}.preview-setting select{background:#151510;color:var(--ink);border:1px solid #5a574e;padding:5px;font-size:.85rem;min-height:32px}
.preview-setting.configs{display:grid;grid-template-columns:repeat(2,minmax(0,1fr))}.configs label{display:flex;flex-direction:column;gap:3px;min-width:0}.configs select{width:100%;min-width:0;box-sizing:border-box}
#start{width:100%;min-height:48px;font-size:1.1rem;margin-top:3px}#result{margin:8px 0 0;min-height:24px;color:var(--gold)}#timing{font-size:.82rem;color:var(--muted);line-height:1.5;margin:8px 0}.preview-note{font-size:.8rem;color:var(--muted)}
#stage.short .preview-left,#stage.short .preview-right{padding:9px}#stage.short .preview-left p{font-size:.9rem;line-height:1.5;margin:7px 0}#stage.short .preview-foe img{height:70px;width:52px}#stage.short .preview-title{min-height:32px}#stage.short .preview-modes button{min-height:40px;padding:6px 2px}#stage.short #start{min-height:42px}#stage.short .preview-setting{margin:6px 0}#stage.short #timing{margin:5px 0;font-size:.75rem;line-height:1.35}
#stage.narrow .preview-title small{font-size:.65rem}#stage.narrow .preview-title h1{font-size:1.1rem}.preview-left{display:flex;flex-direction:column;gap:4px}.preview-left .preview-note{margin-top:auto}
'''
markup='''<div id="stage"><div id="app">
<header class="preview-title"><h1>零號病例｜QTE 節奏試玩</h1><small>預覽 v2 · 正式遊戲未修改</small></header>
<div class="preview-body"><section class="preview-left panel">
<div class="preview-foe"><img src="__FOE__" alt="巨噬者"><div><b>巨噬者 · 震盪重擊</b><span>牠把手臂往後拉，盯著你的動作。</span></div></div>
<h2>看見提示，再按。</h2><p>新版一次只出現一個提示。成功按下後，才會出現下一個；倒數持續，不會重置。</p><p>所有角色使用相同節奏。敏捷、感知、天賦與負傷都不影響反應時間。</p>
<p class="preview-note">手機直拿會自動轉成橫向。按錯與逾時沿用原判定；這裡不會扣血、不會改存檔。預覽無聲。</p></section>
<section class="preview-right panel"><h2>稍快・逐個</h2>
<div class="preview-setting configs"><label>難度 <select id="difficulty"><option value="normal">普通</option><option value="hard">困難</option></select></label><label>操作 <select id="inputMode"><option value="touch">手機觸控</option><option value="keys">鍵盤 WASD</option></select></label></div>
<div class="preview-setting"><label><input type="checkbox" id="fixed">固定路線對照</label></div>
<p id="timing"></p><button class="btn" id="start">開始試玩</button><p id="result" role="status" aria-live="polite">所有角色採用相同的「稍快・逐個」。</p>
<p class="preview-note">普通與困難的提示數與時間完全相同。身手與傷勢不會加快或放慢。</p></section></div></div></div>'''.replace('__FOE__',data('img/riot.webp','image/webp'))
runtime='''
const $=s=>document.querySelector(s),clamp=(v,a,b)=>Math.max(a,Math.min(b,v)),rnd=(a,b)=>a+Math.floor(Math.random()*(b-a+1)),pick=a=>a[Math.floor(Math.random()*a.length)];
const UI={orient:'auto',qkey:'wasd'},BOOTED=true;let G={opts:{diff:'normal'}};
const statMod=(p,st)=>p.st[st]||0,tr=(p,t)=>(p.traits||[]).includes(t);
let chosen='brisk',running=false,fixedSeq=null;
const PRESETS={current:{name:'現行對照',factor:1,sequential:false},brisk:{name:'稍快・逐個',factor:.85,sequential:true},tense:{name:'更快・逐個',factor:.70,sequential:true}};
const PREVIEW_QTE_PER=527;
function sfx(){return 0}
function settings(){G.opts.diff=$('#difficulty').value;const cfg=PRESETS.brisk,base=620,per=PREVIEW_QTE_PER,n=4,total=per*n;return {cfg,base,per,n,total}}
function refresh(){const o=settings();$('#timing').textContent=`${o.cfg.name}：四題 ${(o.total/1000).toFixed(2)} 秒｜每次反應預算 ${o.per} 毫秒${o.cfg.sequential?'｜僅顯示當前提示':'｜目前兩格預顯示'}`;}
for(const id of ['difficulty','fixed'])$('#'+id).addEventListener('change',refresh);
$('#start').addEventListener('click',async()=>{if(running)return;running=true;const {cfg,per,n}=settings();if(!fixedSeq)fixedSeq=qteSeq(n,['閃避','後退','側身','站穩']);const seq=$('#fixed').checked?fixedSeq:qteSeq(n,['閃避','後退','側身','站穩']);$('#result').textContent='留意牠出手的瞬間……';$('#start').disabled=true;
try{const r=await (cfg.sequential?qteLocalSequential:qteLocalOriginal)({t:'巨噬者：震盪重擊——你',seq,per});$('#result').textContent=r==='ok'?'反應成功。可以再試一次。':'反應失敗。可以立即再試一次。';window.lastPreviewResult=r;}finally{running=false;$('#start').disabled=false;$('#start').textContent='再試一次';}});
refresh();layout();
'''
notices='\n\n'.join((ROOT/p).read_text() for p in ['fonts/SOURCES.md','fonts/SourceSerif4-OFL.txt'])
assert '</script>' not in notices
html='<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><title>零號病例 QTE 節奏試玩</title><script type="text/plain" id="font-licenses">'+notices+'</script><style>'+css+'\n'+custom_css+'</style></head><body>'+markup+'<script>\n'+helpers+'\n'+original+'\n'+sequential+'\n'+layout+'\n'+runtime+'\n</script></body></html>'
# layout 事件監聽要在 BOOTED/UI 宣告後執行。
html=html.replace('<script>\n'+helpers,'<script>\n'+runtime[:runtime.index("function sfx")]+'\n'+helpers)
html=html.replace('\n'+runtime+'\n</script>','\n'+runtime[runtime.index('function sfx'):]+'\n</script>')
out=Path(sys.argv[1] if len(sys.argv)>1 else ROOT/'qa-output/qte-preview/zerocase_qte_preview_v2.html');out.parent.mkdir(parents=True,exist_ok=True);out.write_text(html)
print(json.dumps({'path':str(out),'bytes':out.stat().st_size,'sha256':hashlib.sha256(out.read_bytes()).hexdigest(),'fixed_per_ms':527,'total_ms':2108},ensure_ascii=False))
