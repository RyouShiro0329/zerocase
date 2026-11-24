#!/bin/bash
# 測試工具自我驗收（Claude 2026-11-25，QA 升級 PR-A）
# 在暫存目錄故意製造失敗，確認 run_all.sh 和報告「不會把沒跑、失敗、被弱化的情況寫成通過」。
# 不碰倉庫裡的任何檔案：每個情境都在 mktemp 的資料夾裡做，用假的小測試代替真正的 Node 測試，幾秒就跑完。
#   V01 沒有 playwright（完整模式）→ 瀏覽器兩項「未測試」、總結不是全部通過、exit≠0
#   V02 SKIP_LONG=1 → 長路線「略過」；只有通過＋略過時，本機 exit 0 但不寫全部通過、CI 上 exit≠0
#   V03 有一項 Node 測試失敗 → 失敗、列出測試名稱；Node 測試整個沒跑完（語法錯誤）→ 測試工具出錯
#   V04 報告欄位：版本、Build、commit、index.html SHA-256 都和實際相符，每個階段都有秒數
#   V11 guard.test.cjs 被改 → 防弱化檢查失敗、總結失敗
#   V12 測試檔被刪、test 變少 → 警告（不擋，但寫進報告）
#   V13 必要圖片 404 → 瀏覽器冒煙失敗，錯誤裡寫出缺的檔案（需要 playwright；沒有就寫未測試）
# 用法：bash tests/qa-selfcheck.sh　結果：每個情境 通過／失敗／未測試，另存 test-results/selfcheck.json
cd "$(dirname "$0")/.." || exit 1
REPO=$(pwd); OUTD=${QA_OUT:-test-results}; mkdir -p "$OUTD"
NP=${NODE_PATH:-$(npm root -g 2>/dev/null)}
WORK=$(mktemp -d); trap 'rm -rf "$WORK"' EXIT
EMPTY="$WORK/empty-node-path"; mkdir -p "$EMPTY"
RES=(); FAILN=0
ok(){ RES+=("$1|$2|$3"); [ "$2" = 失敗 ] && FAILN=$((FAILN+1)); echo "$2　$1${3:+　$3}"; }
J(){ node -e "const r=require(process.argv[1]);console.log(eval(process.argv[2]))" "$1" "$2" 2>/dev/null; }

# 建一個最小的假倉庫：真的 run_all.sh、helpers、index.html，假的 Node 測試；main 分支當基準
mk(){ local d="$WORK/$1"; mkdir -p "$d/tests/helpers"
  cp "$REPO/tests/run_all.sh" "$REPO/tests/browser-smoke.cjs" "$REPO/tests/long-route.cjs" "$d/tests/"
  cp "$REPO"/tests/helpers/*.cjs "$d/tests/helpers/"; cp "$REPO/index.html" "$d/"
  cat > "$d/tests/a.test.cjs" <<'EOF'
const {test}=require('node:test');
test('第一項',()=>{});test('第二項',()=>{});test('暫緩的一項',{todo:true},()=>{});
EOF
  cat > "$d/tests/b.test.cjs" <<'EOF'
const {test}=require('node:test');
test('b 一',()=>{});test('b 二',()=>{});
EOF
  printf "const {test}=require('node:test');\ntest('守則',()=>{});\n" > "$d/tests/guard.test.cjs"
  ( cd "$d" && git init -q -b main && git -c user.email=qa@local -c user.name=qa add -A && git -c user.email=qa@local -c user.name=qa commit -qm base && git checkout -q -b work ) >/dev/null 2>&1
  echo "$d"; }
run(){ local d=$1; shift; ( cd "$d" && env QA_BASE=main QA_OUT=out "$@" bash tests/run_all.sh $MODE_ARGS > out.log 2>&1; echo $? > out.exit ); }

# V01
D=$(mk v01); MODE_ARGS="full 1 1" run "$D" NODE_PATH="$EMPTY" CI=
E=$(cat "$D/out.exit"); R="$D/out/report.json"
if [ "$(J $R 'r.stages.find(s=>s.id==="smoke").status')" = NOT_RUN ] && [ "$(J $R 'r.stages.find(s=>s.id==="long").status')" = NOT_RUN ] && [ "$(J $R 'r.summary.overall')" = NOT_RUN ] && [ "$E" != 0 ] && ! grep -q 全部通過 "$D/out.log"
then ok V01 通過 "瀏覽器兩項未測試、總結 NOT_RUN、exit $E"; else ok V01 失敗 "exit $E：$(tail -2 "$D/out.log" | head -1)"; fi

# V02
D=$(mk v02); MODE_ARGS="full 1 1" run "$D" NODE_PATH="$EMPTY" SKIP_LONG=1 CI=
L=$(J "$D/out/report.json" 'r.stages.find(s=>s.id==="long").status')
P=$(node -e "
const {summarize}=require('$D/tests/helpers/test-reporter.cjs');const st=[{name:'Node',status:'PASS'},{name:'冒煙',status:'PASS'},{name:'長路線',status:'SKIP'}];
delete process.env.CI;const a=summarize({mode:'full',stages:st});process.env.CI='true';const b=summarize({mode:'full',stages:st});
console.log([a.overall,a.exit,b.exit,/全部通過/.test(a.text)].join(','))")
if [ "$L" = SKIP ] && [ "$P" = "PARTIAL,0,1,false" ] && ! grep -q 全部通過 "$D/out.log"; then ok V02 通過 "長路線略過；通過＋略過＝部分通過（本機 exit 0、CI exit 1）"; else ok V02 失敗 "長路線 $L、判定 $P"; fi

# V03
D=$(mk v03); echo "test('故意失敗的一項',()=>{throw new Error('x')});" >> "$D/tests/b.test.cjs"
MODE_ARGS="fast" run "$D" CI=; R="$D/out/report.json"; E=$(cat "$D/out.exit")
A=$(J $R 'r.stages.find(s=>s.id==="node").status+","+r.stages.find(s=>s.id==="node").failed.includes("故意失敗的一項")+","+r.summary.overall')
D2=$(mk v03b); echo "this is ( not javascript" > "$D2/tests/c.test.cjs"; MODE_ARGS="fast" run "$D2" CI=
B=$(J "$D2/out/report.json" 'r.stages.find(s=>s.id==="node").status'); E2=$(cat "$D2/out.exit")
# 語法錯誤的檔案在 node --test 裡會被當成一項失敗；不管判成 FAIL 還是 ERROR，都不能是 PASS、exit 不能是 0
if [ "$A" = "FAIL,true,FAIL" ] && [ "$E" = 1 ] && { [ "$B" = FAIL ] || [ "$B" = ERROR ]; } && [ "$E2" != 0 ]; then ok V03 通過 "失敗項目有列名稱、exit 1；壞掉的測試檔判 $B"; else ok V03 失敗 "$A exit $E；壞檔 $B exit $E2"; fi
D3=$(mk v03c); : > "$D3/out-tap.txt"
X=$(node -e "const {parseTap}=require('$D3/tests/helpers/test-reporter.cjs');console.log(parseTap('',1).status+','+parseTap('# tests 0\n# pass 0\n# fail 0',0).status)")
if [ "$X" = "ERROR,ERROR" ]; then ok V03b 通過 "沒有總結、0 項測試都判測試工具出錯"; else ok V03b 失敗 "$X"; fi

# V04
D=$(mk v04); MODE_ARGS="fast" run "$D" CI=; R="$D/out/report.json"
SHA=$(sha256sum "$D/index.html" | cut -c1-64); HEAD=$(git -C "$D" rev-parse HEAD)
VER=$(grep -o 'ZC_VER={[^}]*}' "$D/index.html" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const v=JSON.parse(s.slice(7));console.log(v.v+','+v.b)})")
G=$(J $R 'r.game.version+","+r.game.build')
A=$(J $R '[r.game.sha256,r.commit,r.stages.every(s=>typeof s.seconds==="number"),r.mode,r.summary.overall].join(",")')
if [ "$G" = "$VER" ] && [ "$A" = "$SHA,$HEAD,true,fast,PARTIAL" ]; then ok V04 通過 "v$G、SHA-256 與 commit 相符、各階段有秒數"; else ok V04 失敗 "$G / $A"; fi

# V11
D=$(mk v11); echo "// 改一個字" >> "$D/tests/guard.test.cjs"; MODE_ARGS="fast" run "$D" CI=; R="$D/out/report.json"; E=$(cat "$D/out.exit")
A=$(J $R 'r.stages.find(s=>s.id==="integrity").status+","+r.summary.overall')
if [ "$A" = "FAIL,FAIL" ] && [ "$E" = 1 ]; then ok V11 通過 "guard 被改：防弱化檢查失敗、exit 1"; else ok V11 失敗 "$A exit $E"; fi

# V12
D=$(mk v12); rm "$D/tests/b.test.cjs"; printf "const {test}=require('node:test');\ntest('第一項',()=>{});\n" > "$D/tests/a.test.cjs"
MODE_ARGS="fast" run "$D" CI=; R="$D/out/report.json"
A=$(J $R 'const s=r.stages.find(s=>s.id==="integrity");[s.status,s.warnings.some(w=>/b\.test\.cjs/.test(w)),s.warnings.some(w=>/a\.test\.cjs 的 test 從 3 個變成 1 個/.test(w)),r.summary.warnings.length>0].join(",")')
if [ "$A" = "PASS,true,true,true" ] && grep -q "警告" "$D/out/report.md"; then ok V12 通過 "刪測試檔、test 變少都有警告，寫進報告"; else ok V12 失敗 "$A"; fi

# V13（真的開瀏覽器）
if NODE_PATH=$NP node -e "require('playwright')" 2>/dev/null; then
  D="$WORK/v13"; mkdir -p "$D/tests"; cp -rs "$REPO/img" "$REPO/sfx" "$REPO/fx" "$REPO/fonts" "$D/"; cp "$REPO/index.html" "$D/"
  cp -r "$REPO/tests/helpers" "$REPO/tests/browser-smoke.cjs" "$D/tests/"
  rm "$D/img/cat_story.webp"   # 暫存目錄裡是符號連結，只刪連結，倉庫原檔不受影響
  ( cd "$D" && QA_SERVE=route QA_OUT=out QA_DETAIL=out/smoke.json NODE_PATH=$NP timeout 300 node tests/browser-smoke.cjs 2 > out.log 2>&1; echo $? > out.exit )
  E=$(cat "$D/out.exit"); A=$(J "$D/out/smoke.json" 'r.views.some(v=>v.errors.required.some(x=>/img\/cat_story\.webp/.test(x.msg)&&/404/.test(x.msg)))')
  if [ "$E" = 1 ] && [ "$A" = true ]; then ok V13 通過 "img/cat_story.webp 404 被抓到、冒煙失敗"; else ok V13 失敗 "exit $E、抓到 $A：$(grep -m2 失敗 "$D/out.log")"; fi
else ok V13 未測試 "這個環境沒有 playwright"; fi

printf '%s\n' "${RES[@]}" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=s.trim().split('\n').map(l=>{const [id,status,note]=l.split('|');return {id,status,note}});require('fs').writeFileSync(process.argv[1],JSON.stringify({checks:r},null,1))})" "$OUTD/selfcheck.json"
echo "== 自我驗收：${#RES[@]} 項，失敗 $FAILN 項（結果存在 $OUTD/selfcheck.json）"
[ $FAILN -eq 0 ]
