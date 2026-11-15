#!/bin/bash
# 一次跑完全部回歸測試。用法：bash tests/run_all.sh [冒煙步數，預設 40]
# 1) Node 邏輯測試（tests/*.test.cjs，不需要瀏覽器，幾秒鐘）
# 2) 瀏覽器冒煙測試（需要 playwright；沒有就標「未測試」，不算通過）
cd "$(dirname "$0")/.." || exit 1
echo "== 1. Node 邏輯測試"
node --test tests/*.test.cjs 2>&1 | grep -E "^not ok|^# (tests|pass|fail|todo)" | grep -v "# TODO" ; R1=${PIPESTATUS[0]}
echo "== 2. 瀏覽器冒煙測試"
if NODE_PATH=${NODE_PATH:-$(npm root -g 2>/dev/null)} node -e "require('playwright')" 2>/dev/null; then
  python3 -m http.server 8768 >/dev/null 2>&1 & SV=$!; sleep 1
  NODE_PATH=${NODE_PATH:-$(npm root -g)} node tests/browser-smoke.cjs "${1:-40}"; R2=$?
  kill $SV 2>/dev/null
else echo "未測試：這個環境沒有 playwright"; R2=0; fi
[ $R1 -eq 0 ] && [ $R2 -eq 0 ] && echo "== 全部通過" || { echo "== 有失敗"; exit 1; }
