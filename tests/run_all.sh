#!/bin/bash
# 一次跑完回歸測試（2026-11-25 QA 升級 PR-A 改寫：結果真實性＋結構化報告）
# 用法：
#   bash tests/run_all.sh fast                  FAST：防弱化檢查＋Node 邏輯測試（本機平常用這個，約 1 分鐘）
#   bash tests/run_all.sh full [冒煙步數] [長路線動作數] [生存路線動作數]   完整：再加瀏覽器冒煙（三種尺寸）＋長路線＋正常生存短路線與戰鬥完整性（GitHub「完整測試」跑這個）
#   bash tests/run_all.sh 40 480                舊寫法，等於 full 40 480
# 每個階段只會是：通過 PASS／失敗 FAIL／略過 SKIP／未測試 NOT_RUN／測試工具出錯 ERROR（個別項目另有暫緩 TODO）。
# 只有每個階段都通過才寫「全部通過」。缺 playwright＝未測試，SKIP_LONG=1＝略過，都不會當成通過。
# 報告：test-results/report.json（版本、Build、commit、index.html SHA-256、各階段秒數與細節）、report.md；失敗截圖在 test-results/screenshots/。
# 種子（2026-11-25 PR-B）：瀏覽器兩項「選哪個按鈕」和開局種子都由 QA_SEED 決定；沒給就抽一個，印在報告。重現：QA_SEED=<報告裡的數字> bash tests/run_all.sh full …
#   操作紀錄在 test-results/trace-*.json；等待逾時、無效動作、卡死分開計（見 docs/QA_SYSTEM.md）。
# 環境變數：QA_BASE（防弱化比對的基準，預設 origin/main）、QA_OUT（報告資料夾）、SKIP_LONG=1、
#           QA_SERVE=route（不開本機伺服器，由 playwright 直接讀檔；本機不能開埠時用）
# 素材掃描（tests/assets.test.cjs）、事件環境相容（tests/env-compat.test.cjs）是 Node 測試，FAST 就會跑（2026-11-25 PR-C）。
# 生存路線（tests/survival-route.cjs，PR-C）不開無敵：一般難度短路線＋指定戰鬥（重複結算、戰利品、扣血、回到探索、配樂恢復）。
# QTE 固定情境（tests/qte-browser.cjs）、真實瀏覽器音訊（tests/browser-audio.cjs）是完整模式第 6、7 階段；音效對應表（tests/sfx-map.test.cjs）是 Node 測試（2026-11-25 PR-D）。
# 冒煙、長路線開測試用無敵模式（tests/helpers/godmode.cjs，只在測試頁注入，遊戲本體沒有）：現在不測平衡（主人 2026-11-16）。
cd "$(dirname "$0")/.." || exit 1
MODE=full
case "$1" in fast|full) MODE=$1; shift;; esac
SMOKE=${1:-40}; LONG=${2:-220}; SURV=${3:-120}
OUT=${QA_OUT:-test-results}; export QA_OUT=$OUT
[ -z "$QA_SEED" ] && QA_SEED=$(od -An -N4 -tu4 /dev/urandom | tr -d ' '); export QA_SEED
REP="node tests/helpers/test-reporter.cjs"
now(){ date +%s.%N; }
sec(){ awk "BEGIN{printf \"%.1f\", $(now)-$1}"; }
$REP init "$MODE" "$SMOKE" "$LONG" "$SURV" || { echo "測試工具出錯：報告無法初始化"; exit 1; }
echo "== 模式：$([ "$MODE" = fast ] && echo FAST || echo 完整)"

echo "== 1. 防弱化檢查（和 ${QA_BASE:-origin/main} 比對）"
T=$(now); node tests/helpers/integrity.cjs "$OUT/integrity.json"; R=$?
case $R in 0) S=PASS; N="guard 沒改";; 1) S=FAIL; N="guard 被改或刪";; 4) S=NOT_RUN; N="找不到基準分支";; *) S=ERROR; N="exit $R";; esac
$REP stage integrity "防弱化檢查" $S "$(sec $T)" "$N" "$OUT/integrity.json"

echo "== 2. Node 邏輯測試"
T=$(now); node --test --test-reporter=tap tests/*.test.cjs > "$OUT/node-tap.txt" 2>&1; R=$?
$REP node "$OUT/node-tap.txt" $R "$(sec $T)"

NP=${NODE_PATH:-$(pwd)/tests/node_modules:$(npm root -g 2>/dev/null)}
if [ "$MODE" = fast ]; then
  $REP stage smoke "瀏覽器冒煙" SKIP 0 "FAST 模式不跑"
  $REP stage long "長路線" SKIP 0 "FAST 模式不跑"
  $REP stage survival "生存路線與戰鬥完整性" SKIP 0 "FAST 模式不跑"
  $REP stage qte "QTE 固定情境" SKIP 0 "FAST 模式不跑"
  $REP stage audio "真實瀏覽器音訊" SKIP 0 "FAST 模式不跑"
elif ! NODE_PATH=$NP node -e "require('playwright')" 2>/dev/null; then
  echo "== 3、4. 瀏覽器測試：這個環境沒有 playwright"
  $REP stage smoke "瀏覽器冒煙" NOT_RUN 0 "這個環境沒有 playwright"
  if [ -n "$SKIP_LONG" ]; then $REP stage long "長路線" SKIP 0 "SKIP_LONG 略過"
  else $REP stage long "長路線" NOT_RUN 0 "這個環境沒有 playwright"; fi
  $REP stage survival "生存路線與戰鬥完整性" NOT_RUN 0 "這個環境沒有 playwright"
  $REP stage qte "QTE 固定情境" NOT_RUN 0 "這個環境沒有 playwright"
  $REP stage audio "真實瀏覽器音訊" NOT_RUN 0 "這個環境沒有 playwright"
else
  SV=""
  if [ "$QA_SERVE" != route ]; then
    python3 -m http.server 8768 --bind 127.0.0.1 >/dev/null 2>&1 & SV=$!
    for i in $(seq 1 20); do curl -fs -o /dev/null http://localhost:8768/index.html && break; sleep 0.5; done
  fi
  if [ -n "$SV" ] && ! curl -fs -o /dev/null http://localhost:8768/index.html; then
    $REP stage smoke "瀏覽器冒煙" ERROR 0 "本機伺服器 8768 沒有起來"
    $REP stage long "長路線" ERROR 0 "本機伺服器 8768 沒有起來"
    $REP stage survival "生存路線與戰鬥完整性" ERROR 0 "本機伺服器 8768 沒有起來"
    $REP stage qte "QTE 固定情境" ERROR 0 "本機伺服器 8768 沒有起來"
    $REP stage audio "真實瀏覽器音訊" ERROR 0 "本機伺服器 8768 沒有起來"
  else
    echo "== 3. 瀏覽器冒煙測試（$SMOKE 步 × 三種尺寸）"
    T=$(now); rm -f "$OUT/browser-smoke.json"; QA_DETAIL="$OUT/browser-smoke.json" NODE_PATH=$NP node tests/browser-smoke.cjs "$SMOKE"; R=$?
    case $R in 0) S=PASS; N="$SMOKE 步×3 種尺寸，種子 $QA_SEED";; 1) S=FAIL; N="見細節";; *) S=ERROR; N="exit $R";; esac
    $REP stage smoke "瀏覽器冒煙" $S "$(sec $T)" "$N" "$OUT/browser-smoke.json"
    if [ -n "$SKIP_LONG" ]; then $REP stage long "長路線" SKIP 0 "SKIP_LONG 略過"
    else
      echo "== 4. 長路線測試（$LONG 動作，無敵模式）"
      T=$(now); rm -f "$OUT/long-route.json"; QA_DETAIL="$OUT/long-route.json" NODE_PATH=$NP node tests/long-route.cjs "$LONG"; R=$?
      case $R in 0) S=PASS; N="$LONG 動作，種子 $QA_SEED";; 1) S=FAIL; N="見細節";; *) S=ERROR; N="exit $R";; esac
      $REP stage long "長路線" $S "$(sec $T)" "$N" "$OUT/long-route.json"
    fi
    echo "== 5. 正常生存短路線（$SURV 動作，不開無敵）＋指定戰鬥"
    T=$(now); rm -f "$OUT/survival.json"; QA_DETAIL="$OUT/survival.json" NODE_PATH=$NP node tests/survival-route.cjs "$SURV"; R=$?
    case $R in 0) S=PASS; N="$SURV 動作＋指定戰鬥，種子 $QA_SEED";; 1) S=FAIL; N="見細節";; *) S=ERROR; N="exit $R";; esac
    $REP stage survival "生存路線與戰鬥完整性" $S "$(sec $T)" "$N" "$OUT/survival.json"
    echo "== 6. QTE 固定情境（點擊、鍵盤、觸控、總時限、版面、戰鬥撲倒）"
    T=$(now); rm -f "$OUT/qte.json"; QA_DETAIL="$OUT/qte.json" NODE_PATH=$NP node tests/qte-browser.cjs; R=$?
    case $R in 0) S=PASS; N="固定情境，種子 $QA_SEED";; 1) S=FAIL; N="見細節";; *) S=ERROR; N="exit $R";; esac
    $REP stage qte "QTE 固定情境" $S "$(sec $T)" "$N" "$OUT/qte.json"
    echo "== 7. 真實瀏覽器音訊（音效、配樂開著，量輸出端）"
    T=$(now); rm -f "$OUT/browser-audio.json"; QA_DETAIL="$OUT/browser-audio.json" NODE_PATH=$NP node tests/browser-audio.cjs; R=$?
    case $R in 0) S=PASS; N="解碼、每個音效出聲、配樂切換、背景暫停";; 1) S=FAIL; N="見細節";; *) S=ERROR; N="exit $R";; esac
    $REP stage audio "真實瀏覽器音訊" $S "$(sec $T)" "$N" "$OUT/browser-audio.json"
  fi
  [ -n "$SV" ] && kill $SV 2>/dev/null
fi
# PR-E：固定版面／截圖、多人體驗模擬。不依賴外部伺服器。
for SPEC in 'ui|固定版面與基準截圖|tests/ui-regression.cjs|ui-regression.json' 'multiplayer|多人演出與房主交接模擬|tests/multiplayer/mpstage.cjs|multiplayer.json'; do
  IFS='|' read -r ID TITLE SCRIPT DETAIL <<< "$SPEC"
  if [ "$MODE" = fast ]; then
    $REP stage "$ID" "$TITLE" SKIP 0 "FAST 模式不跑"
  elif ! node -e "require('./tests/node_modules/playwright')" 2>/dev/null; then
    $REP stage "$ID" "$TITLE" NOT_RUN 0 "請先 npm ci --prefix tests --ignore-scripts"
  else
    T=$(now); rm -f "$OUT/$DETAIL"; node "$SCRIPT"; R=$?
    case $R in 0) S=PASS; N="見細節";; 1) S=FAIL; N="見細節";; *) S=ERROR; N="exit $R";; esac
    $REP stage "$ID" "$TITLE" "$S" "$(sec $T)" "$N" "$OUT/$DETAIL"
  fi
done
$REP finish
