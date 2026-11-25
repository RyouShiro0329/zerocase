#!/bin/bash
# 測試工具自我驗收（Claude 2026-11-25，QA 升級 PR-A；PR-B、PR-C 加項）
# 在暫存目錄故意製造失敗，確認 run_all.sh 和報告「不會把沒跑、失敗、被弱化的情況寫成通過」。
# 不碰倉庫裡的任何檔案：每個情境都在 mktemp 的資料夾裡做，用假的小測試代替真正的 Node 測試，幾秒就跑完。
#   V01 沒有 playwright（完整模式）→ 瀏覽器兩項「未測試」、總結不是全部通過、exit≠0
#   V02 SKIP_LONG=1 → 長路線「略過」；只有通過＋略過時，本機 exit 0 但不寫全部通過、CI 上 exit≠0
#   V03 有一項 Node 測試失敗 → 失敗、列出測試名稱；Node 測試整個沒跑完（語法錯誤）→ 測試工具出錯
#   V04 報告欄位：版本、Build、commit、index.html SHA-256 都和實際相符，每個階段都有秒數
#   V11 guard.test.cjs 被改 → 防弱化檢查失敗、總結失敗
#   V12 測試檔被刪、test 變少 → 警告（不擋，但寫進報告）
#   V13 必要圖片 404 → 瀏覽器冒煙失敗，錯誤裡寫出缺的檔案（需要 playwright；沒有就寫未測試）
#   （PR-B）V05 同一個種子跑兩次 → 操作紀錄每一步都一樣、遊戲開局種子相同；換種子 → 開局種子不同
#   （PR-B）V06 遊戲一直忙（暫存複本讓 busy 永遠是 true）→ 等待逾時有記錄、超過上限算失敗（以前逾時被吞掉、照樣算一步）
#   （PR-B）V10 點了沒反應（暫存複本吞掉選項的點擊）→ 記成無效動作、連續沒變判卡死、失敗並停下
#   （PR-C）V14 素材掃描：暫存複本拿掉一個只靠音效表組出來的檔案（sfx/genloop.ogg）、一張只在敵人表裡的立繪（img/acru_flm.webp），
#             資料裡放一個不存在的音效名稱 → 三個都要被抓到、exit 1
#   （PR-C）V15 事件環境相容：暫存複本讓旅館客房 A4b 會抽到烏鴉、地鐵 U3 會抽到街上的機車事件 → 兩組都要被抓到、exit 1；
#             對照表缺一個事件（新增事件沒分類）→ 也要失敗
#   （PR-C）V16 戰鬥完整性（真的開瀏覽器）：暫存複本分別故意做成 戰利品給兩次、一下扣兩次血、打完配樂停在戰鬥、
#             同一回合出手兩次、打完卡在忙碌狀態 → 生存路線的對應檢查要失敗；沒改的複本要通過
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

# V05／V06／V10（PR-B，真的開瀏覽器）
if NODE_PATH=$NP node -e "require('playwright')" 2>/dev/null; then
  # V05：直接用倉庫的遊戲，報告寫到暫存目錄
  for k in a b c; do sd=4242; [ $k = c ] && sd=4243
    ( QA_SERVE=route QA_OUT="$WORK/v05$k" QA_DETAIL="$WORK/v05$k/smoke.json" QA_SEED=$sd NODE_PATH=$NP timeout 300 node tests/browser-smoke.cjs 8 > "$WORK/v05$k.log" 2>&1 ) & done; wait
  A=$(node -e "
const fs=require('fs'),W='$WORK';let same=true,n=0;
for(const f of fs.readdirSync(W+'/v05a').filter(f=>/^trace-/.test(f))){const a=require(W+'/v05a/'+f),b=require(W+'/v05b/'+f),c=require(W+'/v05c/'+f);n++;
 if(JSON.stringify(a.steps.map(x=>[x.node,x.act]))!==JSON.stringify(b.steps.map(x=>[x.node,x.act]))||a.gameSeed!==b.gameSeed||a.gameSeed===c.gameSeed||a.seed!==b.seed)same=false}
const d=require(W+'/v05a/smoke.json');console.log(same&&n===3&&d.seed===4242)" 2>/dev/null)
  if [ "$A" = true ]; then ok V05 通過 "種子 4242 跑兩次，三種尺寸的操作紀錄完全一樣；換種子開局不同"; else ok V05 失敗 "比對結果 $A"; fi
  # V06、V10：暫存複本（素材用符號連結，index.html 是複製的，只改複本）
  mkv(){ local d="$WORK/$1"; mkdir -p "$d/tests"; cp -rs "$REPO/img" "$REPO/sfx" "$REPO/fx" "$REPO/fonts" "$d/"
    cp -r "$REPO/tests/helpers" "$REPO/tests/browser-smoke.cjs" "$d/tests/"
    node -e "const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');fs.writeFileSync(process.argv[2],s.replace('</body></html>','<script>'+process.argv[3]+'</script></body></html>'))" "$REPO/index.html" "$d/index.html" "$2"; echo "$d"; }
  D6=$(mkv v06 "setInterval(()=>{try{if(typeof G!=='undefined'&&G&&G.phase==='node')busy=true}catch(e){}},20)")
  D10=$(mkv v10 "window.addEventListener('click',e=>{try{if(typeof G!=='undefined'&&G&&G.phase==='node'&&e.target.closest&&e.target.closest('#choices'))e.stopImmediatePropagation()}catch(x){}},true)")
  ( cd "$D6" && QA_SERVE=route QA_OUT=out QA_DETAIL=out/smoke.json QA_WAIT_MS=800 QA_STUCK=99 QA_SEED=1 NODE_PATH=$NP timeout 300 node tests/browser-smoke.cjs 6 > out.log 2>&1; echo $? > out.exit ) &
  ( cd "$D10" && QA_SERVE=route QA_OUT=out QA_DETAIL=out/smoke.json QA_STUCK=5 QA_SEED=1 NODE_PATH=$NP timeout 300 node tests/browser-smoke.cjs 15 > out.log 2>&1; echo $? > out.exit ) & wait
  A=$(J "$D6/out/smoke.json" 'r.views.every(v=>v.run&&v.run.timeouts>=5&&!v.run.stuck)&&r.checks.filter(c=>/等待逾時/.test(c.name)).every(c=>!c.ok)')
  E=$(cat "$D6/out.exit"); T6=$(ls "$D6"/out/trace-*.json 2>/dev/null | wc -l)
  if [ "$E" = 1 ] && [ "$A" = true ] && [ "$T6" = 3 ]; then ok V06 通過 "每一步逾時都有記錄、超過上限判失敗、exit 1"; else ok V06 失敗 "exit $E、判定 $A、紀錄檔 $T6：$(grep -m1 逾時 "$D6/out.log")"; fi
  A=$(J "$D10/out/smoke.json" 'r.views.every(v=>v.run&&v.run.stuck&&v.run.invalid>=5&&v.steps<15&&v.screen)&&r.checks.filter(c=>/沒有卡死/.test(c.name)).every(c=>!c.ok)')
  E=$(cat "$D10/out.exit")
  if [ "$E" = 1 ] && [ "$A" = true ]; then ok V10 通過 "點了沒變記成無效動作、第 5 步判卡死並停下、存了最後畫面"; else ok V10 失敗 "exit $E、判定 $A：$(grep -m1 卡死 "$D10/out.log")"; fi
else ok V05 未測試 "這個環境沒有 playwright"; ok V06 未測試 "這個環境沒有 playwright"; ok V10 未測試 "這個環境沒有 playwright"; fi

# V14／V15（PR-C，不用瀏覽器）：暫存複本的 index.html 在第一個 </script> 前面加幾行，素材用符號連結
mkg(){ local d="$WORK/$1"; mkdir -p "$d/tests"; cp -rs "$REPO/img" "$REPO/sfx" "$REPO/fx" "$REPO/fonts" "$d/"; cp -r "$REPO/tests/helpers" "$d/tests/"
  node -e "const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');const i=s.indexOf('</script>');fs.writeFileSync(process.argv[2],s.slice(0,i)+';'+process.argv[3]+'\n'+s.slice(i))" "$REPO/index.html" "$d/index.html" "$2"; echo "$d"; }
D=$(mkg v14 "HAZ[1][0].hs='qa_nosuch';"); rm "$D/sfx/genloop.ogg" "$D/img/acru_flm.webp"
( cd "$D" && node tests/helpers/assets.cjs "$D" > out.log 2>&1; echo $? > out.exit ); E=$(cat "$D/out.exit")
if [ "$E" = 1 ] && grep -q "sfx/genloop.ogg" "$D/out.log" && grep -q "img/acru_flm.webp" "$D/out.log" && grep -q "qa_nosuch" "$D/out.log"; then ok V14 通過 "動態組成的音效檔、只在敵人表的立繪、不存在的音效名稱都抓到"; else ok V14 失敗 "exit $E：$(grep -m3 -e 缺少 -e 認不得 "$D/out.log" | tr '\n' ' ')"; fi
D=$(mkg v15 "HZN.A4b=['crow'];EVPOOL.find(e=>e.id==='scooter').at.push('U');")
( cd "$D" && node tests/helpers/env-compat.cjs "$D/index.html" > out.log 2>&1; echo $? > out.exit ); E=$(cat "$D/out.exit")
D2=$(mkg v15b "EVPOOL.push({id:'qa_new_event',ch:2,at:['J'],t:'測試用'});")
( cd "$D2" && node tests/helpers/env-compat.cjs "$D2/index.html" > out.log 2>&1; echo $? > out.exit ); E2=$(cat "$D2/out.exit")
if [ "$E" = 1 ] && grep -q "hz:A4b:crow" "$D/out.log" && grep -q "ev:U3:scooter" "$D/out.log" && [ "$E2" = 1 ] && grep -q "qa_new_event" "$D2/out.log"; then ok V15 通過 "客房的烏鴉、地鐵的機車事件都抓到；沒分類的新事件也算失敗"; else ok V15 失敗 "exit $E／$E2：$(grep -m2 -e 對不上 -e 對照表 "$D/out.log" "$D2/out.log" | tr '\n' ' ')"; fi

# V16（PR-C，真的開瀏覽器）：生存路線只打一場割喉者（會掉裝備），短路線 0 步
if NODE_PATH=$NP node -e "require('playwright')" 2>/dev/null; then
  mkb(){ local d="$WORK/$1"; mkdir -p "$d/tests"; cp -rs "$REPO/img" "$REPO/sfx" "$REPO/fx" "$REPO/fonts" "$d/"
    cp -r "$REPO/tests/helpers" "$REPO/tests/survival-route.cjs" "$d/tests/"
    node -e "const fs=require('fs');const s=fs.readFileSync(process.argv[1],'utf8');fs.writeFileSync(process.argv[2],s.replace('</body></html>','<script>'+process.argv[3]+'</script></body></html>'))" "$REPO/index.html" "$d/index.html" "$2"; echo "$d"; }
  sv(){ ( cd "$1" && QA_SERVE=route QA_OUT=out QA_DETAIL=out/s.json QA_SEED=31 QA_SURV_FIGHTS=cutter NODE_PATH=$NP timeout 400 node tests/survival-route.cjs 0 > out.log 2>&1; echo $? > out.exit ) ; }
  V0=$(mkb v16ok "")
  VL=$(mkb v16loot "{const e=endFight;endFight=async function(){const F=G.fight;const L=F&&F.loot?F.loot.slice():[];const r=await e.apply(this,arguments);if(L.length)foeLoot(L);return r}}")
  VD=$(mkb v16dmg "{const a=applyDmg;applyDmg=function(f,b,d,p,q){const r=a.apply(this,arguments);if(q!=='peek'&&f.hp>1)f.hp-=1;return r}}")
  VM=$(mkb v16music "{const s=syncBgmState;syncBgmState=function(){if(G&&!G.fight&&BGM_MIX.mode==='battle')return;return s.apply(this,arguments)}}")
  VA=$(mkb v16act "{const e=execAct;execAct=async function(p,a){const r=await e.apply(this,arguments);if(a&&a.a==='atk'&&!window.__dbl&&G.fight&&!G.over){window.__dbl=1;try{await execAct(p,a)}finally{window.__dbl=0}}return r}}")
  VB=$(mkb v16back "{const e=endFight;endFight=async function(){const r=await e.apply(this,arguments);G.phase='busy';return r}}")
  sv "$V0" & sv "$VL" & sv "$VD" & wait; sv "$VM" & sv "$VA" & sv "$VB" & wait
  # 每個情境：exit 1、指定的那一項失敗（名稱關鍵字）
  fx(){ node -e "const r=require(process.argv[1]);const f=r.checks.filter(c=>!c.ok).map(c=>c.name);console.log(f.some(n=>n.includes(process.argv[2]))?'yes':'no:'+f.join('|'))" "$1/out/s.json" "$2" 2>/dev/null || echo "no:沒有細節檔"; }
  A0=$(node -e "const r=require(process.argv[1]);console.log(r.checks.every(c=>c.ok)&&r.fights.length===1&&r.fights[0].gearRows===1)" "$V0/out/s.json" 2>/dev/null); E0=$(cat "$V0/out.exit")
  R=""; for x in "$VL:戰利品沒有重複" "$VD:沒有重複扣血" "$VM:回到探索配樂" "$VA:只出手一次" "$VB:打完回到探索"; do d=${x%%:*}; k=${x#*:}; e=$(cat "$d/out.exit"); m=$(fx "$d" "$k"); [ "$e" = 1 ] && [ "$m" = yes ] || R="$R $(basename $d)（exit $e，$m）"; done
  if [ "$E0" = 0 ] && [ "$A0" = true ] && [ -z "$R" ]; then ok V16 通過 "沒改的複本通過；戰利品重複、重複扣血、配樂沒恢復、一回合出手兩次、打完卡住都被抓到"; else ok V16 失敗 "沒改的複本 exit $E0／$A0；沒抓到：$R"; fi
else ok V16 未測試 "這個環境沒有 playwright"; fi

printf '%s\n' "${RES[@]}" | node -e "let s='';process.stdin.on('data',d=>s+=d).on('end',()=>{const r=s.trim().split('\n').map(l=>{const [id,status,note]=l.split('|');return {id,status,note}});require('fs').writeFileSync(process.argv[1],JSON.stringify({checks:r},null,1))})" "$OUTD/selfcheck.json"
echo "== 自我驗收：${#RES[@]} 項，失敗 $FAILN 項（結果存在 $OUTD/selfcheck.json）"
[ $FAILN -eq 0 ]
