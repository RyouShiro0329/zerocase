#!/bin/bash
# 舊切檔工作區的相容入口。參數一：split_index.py 的輸出資料夾。
# 多人測試請直接執行 tests/multiplayer/mpstage.cjs，不依賴重建檔或 fbfake.js。
set -euo pipefail
REPO=$(cd "$(dirname "$0")/../.." && pwd)
WORKDIR=${1:-$PWD}
cd "$WORKDIR"
{ cat head.html; echo '<script>'; grep -m1 '^const ZC_VER=' "$REPO/index.html"; cat items.js chars.js story.js story2.js story3.js story4.js engine_a.js engine_b.js engine_c.js engine_d.js qte.js net.js ui.js scr.js; echo '</script>'; } > zerocase.html
mkdir -p web
{ echo '<!doctype html><html lang="zh-Hant"><head><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1,viewport-fit=cover"><meta name="theme-color" content="#060605"><meta name="mobile-web-app-capable" content="yes"></head><body>'; cat zerocase.html; echo '</body></html>'; } > web/index.html
cmp "$REPO/index.html" web/index.html
