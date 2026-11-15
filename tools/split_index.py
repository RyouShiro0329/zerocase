#!/usr/bin/env python3
"""把 GitHub 的 index.html（網站版）切回原始碼模組。
用法：python3 tools/split_index.py 路徑/index.html 輸出資料夾
GPT 或其他人直接改 index.html 之後，用這支切回 head.html 和 14 個 js 檔，
再跑 build.sh，確認重建的 web/index.html 和原檔 SHA 相同才算切對。
切分依據：每個模組第一行的固定標題。改了模組第一行，這裡也要跟著改。"""
import sys,os,re
MODS=[('items.js','const ITEMS={'),('chars.js','/* ============ 能力 ============ */'),
 ('story.js','/* ================= 第一章：旅館 ================= */'),
 ('story2.js','/* ================= 第一章延伸：旅館加長 ================= */'),
 ('story3.js','/* ================= 第一章：更多隨機事件 ================= */'),
 ('story4.js','/* ================= 休息點、商人、人性值 ================= */'),
 ('engine_a.js','/* ================= 基礎 ================= */'),
 ('engine_b.js','/* ================= 音效 ================= */'),
 ('engine_c.js','/* ================= 生存值 ================= */'),
 ('engine_d.js','/* ================= 戰鬥 ================= */'),
 ('qte.js','/* ================= QTE：'),('net.js','/* ================= 連線 ================='),
 ('ui.js','/* ================= 遊戲畫面 ================= */'),
 ('scr.js','/* ================= 選單、建立角色、房間 ================= */')]
src,out=sys.argv[1],sys.argv[2];os.makedirs(out,exist_ok=True)
t=open(src,encoding='utf-8').read()
first,rest=t.split('\n',1)
assert first.startswith('<!doctype html>') and first.endswith('<body>'),'第一行不是網站版外殼'
assert rest.endswith('</body></html>\n'),'最後一行不是 </body></html>'
z=rest[:-len('</body></html>\n')]
i=z.index('<script>\n');head=z[:i];body=z[i+len('<script>\n'):]
assert body.endswith('</script>\n');body=body[:-len('</script>\n')]
ver,body=body.split('\n',1);assert ver.startswith('const ZC_VER='),'找不到 ZC_VER'
pos=[]
for f,mk in MODS:
    hits=[m.start() for m in re.finditer('(?m)^'+re.escape(mk),body)]
    assert len(hits)>=1,f'找不到 {f} 的開頭：{mk}'
    p=[h for h in hits if not pos or h>pos[-1][1]][0];pos.append((f,p))
assert pos[0][1]==0,'items.js 前面還有東西'
open(os.path.join(out,'head.html'),'w',encoding='utf-8').write(head)
for k,(f,p) in enumerate(pos):
    e=pos[k+1][1] if k+1<len(pos) else len(body)
    open(os.path.join(out,f),'w',encoding='utf-8').write(body[p:e])
print('切出 15 個檔；版本行：',ver[:90])
