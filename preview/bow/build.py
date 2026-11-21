"""建立手機可直接開啟、自帶原素材與音效的單檔預覽。"""
from pathlib import Path
import base64,json,re
root=Path(__file__).resolve().parents[2]
def data(path):
    mime={'.webp':'image/webp','.woff2':'font/woff2','.mp3':'audio/mpeg','.wav':'audio/wav'}[path.suffix]
    return 'data:'+mime+';base64,'+base64.b64encode(path.read_bytes()).decode()
s=(root/'index.html').read_text().replace('zc5-','zc-bow-preview-v1-')
assets={p.stem:data(p) for p in (root/'img').glob('*.webp')}
assert 'const ZCBOWPV_ASSETS=' not in s
s=s.replace('const ZC_VER=','const ZCBOWPV_ASSETS='+json.dumps(assets)+';\nconst ZC_VER=',1)
s=s.replace("const foeImg=f=>f&&f.img?`img/${f.img}.webp`:'';","const foeImg=f=>f&&f.img?ZCBOWPV_ASSETS[f.img]||'':'';")
for old,new in [('img/${esc(x.img)}.webp',"${ZCBOWPV_ASSETS[x.img]||''}"),('img/${esc(pr.img)}.webp',"${ZCBOWPV_ASSETS[pr.img]||''}"),('img/${pr.img}.webp',"${ZCBOWPV_ASSETS[pr.img]||''}")]:s=s.replace(old,new)
for folder,pattern in [('fonts','*.woff2'),('img','*.webp'),('fx','*.webp')]:
    for p in (root/folder).glob(pattern):s=re.sub(re.escape(folder+'/'+p.name)+r'(?:\?v=[a-f0-9]+)?',lambda m:data(p),s)
s=s.replace('function loadSounds(){','function loadSounds(){return Promise.resolve();}\nfunction zcBowPreviewUnusedLoadSounds(){',1)
js=(root/'preview/bow/runtime.js').read_text()
for path in ['preview/bow/arrow-12.webp','sfx/bowdraw.mp3','sfx/bowimpact.mp3','preview/bow/crossbow-dry.wav']:js=js.replace(path,data(root/path))
s=s.replace('${CREDITS}</p>', '${CREDITS}<br>弩發射音效：<a href="https://freesound.org/people/Erdie/sounds/65734/" target="_blank" rel="noopener">bow02.wav — Erdie</a>，<a href="https://creativecommons.org/licenses/by/4.0/" target="_blank" rel="noopener">CC BY 4.0</a>；本預覽有減弱嗡鳴、縮短尾音及濾波改作，作者未替遊戲背書。</p>')
s=s.replace('</body>','<script>'+js+'</script></body>')
out=root/'preview/bow/zerocase_bow_crossbow_preview.html';out.write_text(s);print(out)
