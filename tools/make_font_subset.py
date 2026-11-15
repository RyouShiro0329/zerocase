#!/usr/bin/env python3
"""重做正楷字型子集 fonts/tw-kai-game.woff2，並更新 fonts/coverage.txt（Claude 2026-11-16）。

什麼時候要跑：遊戲文字加了新字，tests/guard.test.cjs 的「遊戲文字沒有缺字」失敗時。
缺字會讓那幾個字改用手機內建字型，大小、粗細和旁邊的字不一樣。

用法（在倉庫根目錄）：
  pip install fonttools brotli
  python3 tools/make_font_subset.py [原始字型路徑]
原始字型 TW-Kai-98_1.ttf（全字庫正楷體，約 47 MB，不放進倉庫）；沒給路徑就從下面的網址下載到 /tmp。
收錄的字＝舊子集的字 ＋ index.html 裡所有非 ASCII 字元（舊的字不會被拿掉）。
"""
import sys, os, urllib.request
from fontTools.ttLib import TTFont
from fontTools import subset

URL = ('https://raw.githubusercontent.com/yuleshow/chinese-fonts/master/'
       '%E8%87%BA%E7%81%A3%E6%95%99%E8%82%B2%E9%83%A8%E5%AD%97%E9%AB%94/'
       '%E5%85%A8%E5%AD%97%E5%BA%AB/TW-Kai-98_1.ttf')
ROOT = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
KAI = os.path.join(ROOT, 'fonts', 'tw-kai-game.woff2')
LATIN = os.path.join(ROOT, 'fonts', 'source-serif-4-latin.woff2')
COV = os.path.join(ROOT, 'fonts', 'coverage.txt')

src = sys.argv[1] if len(sys.argv) > 1 else '/tmp/TW-Kai-98_1.ttf'
if not os.path.exists(src):
    print('下載原始字型……'); urllib.request.urlretrieve(URL, src)
orig = TTFont(src)
assert any(r.nameID == 5 and 'Version 103.1' in r.toUnicode() for r in orig['name'].names), '原始字型版本不是 103.1，請確認來源'
ocmap = orig.getBestCmap()
old = set(TTFont(KAI).getBestCmap()) if os.path.exists(KAI) else set()
html = open(os.path.join(ROOT, 'index.html'), encoding='utf-8').read()
need = old | {ord(c) for c in html if ord(c) > 0x7F}
missing = sorted(c for c in need if c not in ocmap)

opt = subset.Options()
opt.flavor = 'woff2'; opt.layout_features = ['*']; opt.name_IDs = ['*']; opt.name_languages = ['*']
opt.notdef_outline = True; opt.glyph_names = False; opt.hinting = True
f = TTFont(src); s = subset.Subsetter(opt); s.populate(unicodes=[c for c in need if c in ocmap]); s.subset(f)
f.flavor = 'woff2'; f.save(KAI)

kai = set(TTFont(KAI).getBestCmap()); lat = set(TTFont(LATIN).getBestCmap())
open(COV, 'w', encoding='utf-8').write(
    '# 遊戲字型收錄的字（tw-kai-game.woff2 ＋ source-serif-4-latin.woff2）。由 tools/make_font_subset.py 產生，不要手改。\n'
    + ''.join(chr(c) for c in sorted(kai | lat) if c > 0x7F) + '\n')
print(f'子集 {len(kai)} 字（原本 {len(old)}），檔案 {os.path.getsize(KAI)} bytes')
if missing: print('原始字型也沒有的字（會用裝置字型顯示）：', ''.join(chr(c) for c in missing))
