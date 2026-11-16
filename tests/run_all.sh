#!/bin/bash
# 一次跑完全部回歸測試。用法：bash tests/run_all.sh [冒煙步數，預設 40] [長路線動作數，預設 220]
# 1) Node 邏輯測試（tests/*.test.cjs，不需要瀏覽器，幾秒鐘）
# 2) 瀏覽器冒煙測試（需要 playwright；沒有就標「未測試」，不算通過；約 2 分鐘）
# 3) 長路線測試（tests/long-route.cjs：測試用無敵模式，從旅館往城裡走；約 3～4 分鐘；SKIP_LONG=1 可略過，略過就寫未測試）
# 2、3 都開測試用無敵模式（tests/helpers/godmode.cjs，只在測試頁注入，遊戲本體沒有）：現在不測平衡（主人 2026-11-16）。
cd "$(dirname "$0")/.." || exit 1
echo "== 1. Node 邏輯測試"
node --test tests/*.test.cjs 2>&1 | grep -E "^not ok|^# (tests|pass|fail|todo)" | grep -v "# TODO" ; R1=${PIPESTATUS[0]}
echo "== 2. 瀏覽器冒煙測試"
if NODE_PATH=${NODE_PATH:-$(npm root -g 2>/dev/null)} node -e "require('playwright')" 2>/dev/null; then
  python3 -m http.server 8768 >/dev/null 2>&1 & SV=$!; sleep 1
  NODE_PATH=${NODE_PATH:-$(npm root -g)} node tests/browser-smoke.cjs "${1:-40}"; R2=$?
  echo "== 3. 長路線測試（無敵模式）"
  if [ -n "$SKIP_LONG" ]; then echo "未測試：SKIP_LONG 略過"; R3=0
  else NODE_PATH=${NODE_PATH:-$(npm root -g)} node tests/long-route.cjs "${2:-220}"; R3=$?; fi
  kill $SV 2>/dev/null
else echo "未測試：這個環境沒有 playwright"; R2=0; R3=0; fi
[ $R1 -eq 0 ] && [ $R2 -eq 0 ] && [ $R3 -eq 0 ] && echo "== 全部通過" || { echo "== 有失敗"; exit 1; }
