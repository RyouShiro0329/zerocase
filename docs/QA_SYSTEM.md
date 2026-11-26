# 測試系統說明（QA 升級，2026-11-25 起）

規格：主人的 ZEROCASE_QA_SYSTEM_UPGRADE_SPEC；盤點與分階段方案在 Claude 專案 `zerocase/PROPOSAL_QA_UPGRADE.md`。
已完成：**PR-A 結果真實性**（QA-01、02、03、29）、**PR-B 重現與追蹤**（QA-04、05、06）、**PR-C 覆蓋範圍**（QA-07、12、13、19）、**PR-D QTE 與音訊**（QA-14、16、17）。本次 PR-E（P2）：版面／截圖／樣式、多人模擬、存檔樣本、部署後只讀冒煙；之後 PR-F。

## 兩種模式
| 指令 | 跑什麼 | 誰用 |
|---|---|---|
| `bash tests/run_all.sh fast` | 防弱化檢查＋Node 邏輯測試（約 1 分鐘） | 本機平常用 |
| `bash tests/run_all.sh full 40 480 [120]` | 再加瀏覽器冒煙（三種尺寸）＋長路線＋生存路線與戰鬥完整性（第三個數字＝生存路線動作數，預設 120）＋QTE 固定情境＋真實瀏覽器音訊 | GitHub「完整測試」 |

舊寫法 `bash tests/run_all.sh 40 480` 等於 `full 40 480`。本機不能開埠時加 `QA_SERVE=route`（playwright 直接讀檔回應）。

## 六種狀態
- 每個階段：**PASS** 通過、**FAIL** 失敗、**SKIP** 刻意略過（FAST 模式、`SKIP_LONG=1`）、**NOT_RUN** 該跑沒跑成（例如沒有 playwright、找不到基準分支）、**ERROR** 測試工具自己出錯（例如 Node 測試沒有總結、伺服器沒起來、腳本當掉）。
- **TODO**：個別暫緩的項目，列在報告裡，不讓階段失敗。2026-11-26 主人定案：環境相容已知組合等地圖重做、音效缺口之後處理；恐懼紀錄確定只顯示實際增減量，不顯示目前值／上限。guard 的原 TODO 標記依不得修改 guard 的規則保留，是否通過以實際斷言與新增聚焦測試判斷，不代表這項設計仍待決。
- 總結只有每個階段都 PASS 才寫「全部通過」。有略過寫「跑了的都通過，但有略過：…」；有未測試寫「沒有完整跑完」。
- exit code：FAIL、ERROR → 1；完整模式有 NOT_RUN → 1；CI 上完整模式有 SKIP → 1；其他 0。

## 報告（`test-results/`，不進 git；CI 上傳成「test-results」，保留 14 天）
- `report.json`：模式、參數、開始／結束時間（台北）、總秒數、遊戲版本／Build／版本時間、index.html SHA-256 與大小、commit、分支、有沒有未提交修改、Node 與 playwright 版本、每個階段的狀態／秒數／說明／失敗項目／暫緩項目／警告／細節、總結。
- `report.md`：同樣內容的表格（CI 會放在那次執行的 Summary）。
- `node-tap.txt`（Node 原始輸出）、`integrity.json`、`browser-smoke.json`、`long-route.json`（每個尺寸的錯誤分類、步數、節點數）、`screenshots/`（失敗時的截圖）、`selfcheck.json`（自我驗收）。

## 防弱化檢查（`tests/helpers/integrity.cjs`）
和基準（`QA_BASE`，預設 `origin/main`；CI 是 PR 要合進去的分支）比：
- `tests/guard.test.cjs` 任何一個位元不同或被刪 → **失敗**。主人明確同意改 guard 的那個 PR 會失敗，PR 要寫出來，主人說可以合併才合併。
- 測試檔被刪或改名、某支檔案的 `test(` 變少、skip／todo 變多 → **警告**（寫進報告，不擋）。
- 另外記錄 index.html 和基準是否逐位元相同。

## 瀏覽器錯誤分類（`tests/helpers/browser-errors.cjs`）
- 算失敗：頁面程式錯誤、其他 console.error、**同網域檔案回 4xx／5xx 或載入失敗**（以前被正規式整類吞掉）。
- 只記錄：外部連線（firebase、gstatic、googleapis）、favicon.ico、瀏覽器自己取消的請求（ERR_ABORTED）。

## 種子、操作紀錄、逾時與卡死（`tests/helpers/driver.cjs`，PR-B）
- **種子**：`QA_SEED`（沒給 run_all.sh 會抽一個，寫在報告和 Summary）。測試頁的 `Math.random`、`crypto.getRandomValues` 換成這個種子的亂數（只在測試頁注入），所以遊戲開局種子 `G.sd` 固定；測試自己選按鈕用另一條亂數 `__qaRnd`，不和遊戲畫面、聲音共用。冒煙三種尺寸用 種子＋0／1／2。
- **重現**：`QA_SEED=<報告裡的數字> bash tests/run_all.sh full 40 480`。本機實測同種子冒煙 40 步、三種尺寸每一步都一樣；長路線很長，計時器的時間差仍可能讓後段分岔，所以叫「盡量重現」。
- **操作紀錄**：`test-results/trace-smoke-<尺寸>.json`、`trace-long-route.json`：每一步的節點、點了什麼、等了幾毫秒、有沒有逾時、畫面有沒有變；開頭有種子、開局種子、有效／無效／沒東西可點／逾時次數。
- **逾時**：等遊戲空下來最多 `QA_WAIT_MS`（預設 15000）毫秒；逾時照實記錄，超過動作數的 5%（`QA_TIMEOUT_RATIO`）算失敗。以前逾時被吞掉、照樣算一步。
- **無效動作**：點了東西但畫面指紋（節點、時間、紀錄行數、戰鬥狀態、彈窗、選項文字）沒變。
- **卡死**：連續 `QA_STUCK`（預設 20）步畫面都沒變 → 失敗並停下，存截圖和最後的選項、紀錄文字。
- 本機基準（v0.67.1，種子 777）：長路線 480 動作逾時 0、無效 0、最多連續 0 步沒變；冒煙 40 步×3 也都是 0。

## 素材掃描（`tests/assets.test.cjs`、`tests/helpers/assets.cjs`，PR-C：QA-19）
- 在 vm 載入遊戲，不只看寫死的路徑：音效表 `SFILES`（genloop、rain_ 要 .ogg＋.mp3，其他 .mp3）、配樂三軌（.ogg＋.mp3）、`sfx/crossbowshot.wav`、資料表所有 `img` 欄位和 `FOE_IMG` → 檔案要存在。
- 遊戲用到的音效名稱（snd／sfx／sfxW／sndW／play／radioLine 呼叫的字串、這些呼叫裡函式的回傳字串、資料欄位 snd、cy、rl、hs、ws、okA、audio、audioStop、after）→ 要有檔案、合成音 SYN、組合槍聲 SCUE 或弓箭特別名稱。FALL 要指到 SYN，SCUE 的槍要是音效檔。
- 沒被引用的檔案只記錄。單獨跑：`node tests/helpers/assets.cjs`。

## 事件環境相容（`tests/env-compat.test.cjs`、`tests/helpers/env-compat.cjs`，PR-C：QA-07）
- 測試側對照表（讀節點文字整理）：`PLACE_IO`／`NODE_IO`（室內 in、有頂棚 cover、戶外 out）、`HZ_NEED`（每種意外要的地方）、`EV_NODE`（事件節點有什麼：地毯、客房、街道、天空……）、`EV_NEED`（事件文字需要什麼）。
- 比對遊戲的 `hzEnvOf`（意外）和照 `evCands` 規則選出的事件候選。對照表缺地點、事件節點、事件、意外種類 → 失敗（新增內容要先分類）。
- `KNOWN`：現在對不上、等主人決定的組合，列成 TODO（暫緩）；修好之後還留著會失敗，提醒拿掉。單獨跑：`node tests/helpers/env-compat.cjs`。

## 生存路線與戰鬥完整性（`tests/survival-route.cjs`，PR-C：QA-12、13；完整模式第 5 階段）
- **不開無敵**、一般難度、只開配樂。短路線 120 動作：沒有程式錯誤、去處存在、紀錄沒有 undefined／NaN、玩家數值每一步是有限數字且在範圍內、死掉時結束畫面出得來（死掉不算失敗）。
- 指定戰鬥：重開一局用 `startFight` 打 `QA_SURV_FIGHTS`（預設 infected,cutter,quickdraw；開打前補滿、把人類敵人的逃跑檢查標成做過，才測得到戰利品）。檢查：在攻擊／目標按鈕快速點兩下，同一回合同一人只出手一次；endFight 一次、foeLoot 最多一次、裝備數量＝戰利品清單；applyDmg／hurt 扣的＝回報的；打完 G.fight 清掉、回到 node、有選項、演出關掉；打的時候是戰鬥配樂、打完 2.5 秒是探索配樂且戰鬥兩軌停下。路線上碰到的戰鬥也套同樣檢查。
- 檢查用的包裝函式只注入測試頁；紀錄在 `test-results/survival.json`、`trace-survival.json`。

## QTE 固定情境（`tests/qte-browser.cjs`，PR-D：QA-14；完整模式第 6 階段，約 1.5 分鐘）
- 在真的瀏覽器叫遊戲自己的 `qte()`，照劇本用真的滑鼠、鍵盤、觸控輸入（以前只會自動點對）。Q01 照順序點完、Q02 不點（第一格出現後 527×格數毫秒判失敗）、Q03 點格子外面、Q04 格子出來前先輸入（不算數也不算錯；描述停 0.5～1 秒）、Q05 WASD、Q06 按錯、Q07 按住不放只算一下、Q08 修飾鍵不算錯、Q09 方向鍵模式、Q10 總時限不重置、Q11 觸控、Q12 三種尺寸版面（格子在畫面內、不壓描述和倒數條、字沒裁掉）、Q13 戰鬥撲倒（躲開不扣血；沒躲開扣血、播 thud）、Q14 飛撲。
- 細節（每個情境的結果、時間、播了哪些音效）在 `test-results/qte.json`；`QA_QTE_SHOTS=<資料夾>` 會存三種尺寸第一格的截圖。

## 真實瀏覽器音訊（`tests/browser-audio.cjs`，PR-D：QA-17；完整模式第 7 階段，約 50 秒）
- 開真的 Chromium、音效和配樂都開（允許自動播放），在測試頁的 Web Audio 輸出端接分析器量波形。A01 音效檔全部解碼成功、不是無聲檔（頭尾空白只記錄）；A02 備用格式（配樂 .ogg／.mp3、持續聲 .mp3）也解碼得了；A03 99 個音效名稱叫 sfx() 都量得到聲音；A04 關掉音效就沒聲音；A05 探索→戰鬥→打完，配樂真的在播、時間在走、切換正確；A06 切到背景全部停、切回來接著播；A07 沒有錯誤和音訊警告。
- 量到的數字在 `test-results/browser-audio.json`（每個檔案的長度、峰值、頭尾空白；每個名稱回傳的長度）。

## 音效對應表（`tests/sfx-map.test.cjs`、`tests/helpers/sfx-map.cjs`，PR-D：QA-16；Node 測試）
- 每個播得出來的名稱寫一行「聽起來是什麼」（Claude 整理，**待主人審查**），列出用在哪裡、載入失敗的備援；給主人看的文件 `docs/audio/SFX_MAP.md`（`node tests/helpers/sfx-map.cjs --md docs/audio/SFX_MAP.md` 產生）。
- 新名稱沒寫說明、表裡有遊戲已經不用的名稱、文件少列名稱 → 失敗。缺口（意外沒有聲音、沒有備援、沒用到的名稱等）**只列成暫緩，不換音效**。
- 素材掃描順便補上敵人招式的 `pre` 欄位（出手前的聲音，例如 spit）。

## 自我驗收（`tests/qa-selfcheck.sh`，CI 每次都跑，約 5 分鐘）
在暫存目錄故意製造失敗，確認工具不會說謊：V01 沒有 playwright、V02 SKIP_LONG、V03 Node 測試失敗／壞檔／沒有總結、V04 報告欄位與實際相符、V11 guard 被改、V12 測試被刪或變少、V13 必要圖片 404；PR-B 加 V05 同種子兩次操作紀錄相同、V06 遊戲一直忙（逾時要記錄、超過上限失敗）、V10 點了沒反應（無效動作、卡死）。PR-C 加 V14 素材（拿掉動態音效檔、敵人立繪、放不存在的音效名稱）、V15 環境相容（客房抽到烏鴉、地鐵抽到街上事件、沒分類的新事件）、V16 戰鬥（戰利品給兩次、一下扣兩次血、配樂停在戰鬥、一回合出手兩次、打完卡住，各要被抓到；沒改的對照組要通過）。PR-D 加 V17 QTE（qte() 永遠成功 → 不點、點錯、按錯、太慢、撲倒沒躲開都要抓到；吞掉 WASD → 鍵盤情境失敗）、V18 音訊（無聲檔、壞檔、載入警告；配樂停在戰鬥、背景收不到通知）、V19 音效對應表（沒寫說明的新名稱）。V06、V10 用暫存複本的 index.html 製造故障，倉庫的遊戲不動。
自我驗收的情境由 Claude 依 PR-A 範圍定義（規格書原文的 V 編號細節不在這次對話可讀的文件裡）；之後有出入照規格書調整。

## PR-E：固定版面、基準截圖與樣式防護

先執行 `npm ci --prefix tests --ignore-scripts`、`tests/node_modules/.bin/playwright install chromium`。相依固定為 Playwright 1.58.2（Chromium 145.0.7632.6）、pngjs 7.0.0；CI 使用 Ubuntu 24.04、Node 22。既有測試不減少，完整模式新增第 8、9 階段；FAST 新增樣式與存檔的 Node 測試。

- `tests/ui-regression.cjs`：入口、角色分類選單、探索、玩家戰鬥回合、背包，844×390、1280×720、393×690（轉向後 690×393），共 15 張。每個畫面檢查主要區塊四邊、所有按鈕（含第 4 個之後）、文字裁切、按鈕及雙欄重疊；有捲動區的內容以完整捲動範圍檢查，不把正常捲動當裁切。
- `tests/helpers/fixed-scenes.cjs`：種子 777、固定日期、時區、語系、DPR、角色與遊戲狀態；只有測試頁注入，不修改遊戲。關閉音訊、動畫與轉場，等待字型和圖片解碼；每個畫面各開 context，從 checkout 回應素材並封鎖外部連線與 Service Worker。
- `tests/baselines/ui/`：有提交的 PNG 基準及環境／遊戲 SHA-256 清單。差異超過 0.1% 像素即失敗（單通道差異超過 24 才計）；失敗同時上傳 expected、actual、紅色 diff。報告為 `test-results/ui-regression.json`，含各區塊／按鈕座標。首次基準已人工檢視。
- 基準不存在會失敗，測試不會自動接受。畫面刻意變動時，先用相同 Linux／瀏覽器版本執行 `node tests/ui-regression.cjs --update`，人工看過 15 張及差異後，再將基準與 manifest 隨 PR 提交；CI 禁止 `--update`。不要為通過測試而提高容忍值。
- `tests/style-guard.test.cjs`：比對 `tests/baselines/styles.json` 的重要 CSS 規則（hidden、舞台與旋轉、安全區、雙欄、紀錄、選項、彈窗、QTE）。新增覆寫或刪除規則都會失敗。刻意改樣式時應先驗證實際畫面，再審查及更新該基準；不能直接接受所有 CSS 修改。

## PR-E：可攜式多人模擬

- `tests/multiplayer/mock.js`：原工具搬入，使用 BroadcastChannel、4096-byte 封包限制及 presence；只作用於測試頁，不連 Firebase。
- `node tests/multiplayer/mpstage.cjs`：完整模式自動跑。正常同步、演出期間輸入作廢、隊友延遲 1200ms 從目前進度接續、演出中房主離開接任、不重複加入敵人／先攻。現在有斷言及非零失敗碼，寫 `test-results/multiplayer.json`，不再只印觀察值。保留頁面錯誤 stack 與必要資源錯誤。
- `node tests/multiplayer/mp.cjs 2`、`node tests/multiplayer/bot.cjs 1 maggie`：原探索工具搬入供人工長測，仍保留 LIM／GODM 等操作；`mp.cjs` 第三位以上的自訂角色已補屬性配置。這兩個長測不是完整模式中的固定演出驗收。
- 從任何 checkout 執行都透過相對路徑直接服務該份 index.html，不需 8767 伺服器、proto7、test.html、fbfake.js。舊 `tools/claude/mp.js`、`bot.js` 保留相對路徑轉接。
- `tools/claude/build.sh <切檔資料夾>` 保留離線重建用途，以腳本位置尋找倉庫；只建立 zerocase.html 與 web/index.html，並用 cmp 驗證與正本逐位元相同；移除依賴缺失 fbfake.js 的測試產物。多人模擬不需要此步驟。
- 這是本機傳輸模擬，正式 Firebase、Android 實機另行驗收，不混寫成通過。

## PR-E：跨版本存檔樣本

`tests/fixtures/saves/` 保存 v0.57.0、v0.59.0、v0.62.0、v0.65.0、v0.67.1 五份合成存檔；每份由指定歷史 commit 的 `newRun` 建立，再設定遷移情境，不含玩家資料。來源 SHA、版本與預期節點保存在各 JSON，手動重建方式為 `node tests/fixtures/generate-saves.cjs`（需要完整 git 歷史，不在驗收時重建）。

`tests/save-fixtures.test.cjs` 將固定樣本交給目前 `migrateG`，驗證廚房／洗衣房／停車場地點合併、舊抽牌格改走廊、探索進度、301 舊節點、舊演出清理、偷襲輪及敵人傷害缺值，並確認角色、物品、血量、旗標、時間與選項保留、節點存在、重複轉換不變。樣本或預期不可在每次測試時自動重建。

## PR-E：部署後只讀冒煙

`.github/workflows/deployed-smoke.yml` 在 main 有提交（含合併）或手動觸發；只有 contents: read，沒有部署／資料庫寫入權限。等待最多 10 分鐘，正式站 index.html SHA-256 必須等於這個 checkout，避免測到上一版；逾時、無法連線或頁面錯誤會失敗並留下報告。

`tests/deployed-smoke.cjs` 僅開入口與角色分類選單、檢查版面和同源素材；不建立房間、不登入、不送出玩家操作。測試頁使用本機傳輸替身，所有外部請求、非 GET／HEAD 方法與 WebSocket 都封鎖；若嘗試送出修改請求則失敗。禁用 Service Worker，使用新 context。輸出 `deployed-smoke.json` 與 PNG，workflow 另上傳 deployed-smoke artifact。PR 尚未合併時，新增 workflow 的 main 觸發不會發生，不能因此宣稱正式站已通過。

## PR-E：自我驗收

`tests/qa-selfcheck.sh` 保留 V01～V19，追加 `tests/pr-e-selfcheck.cjs`：V20 未修改對照及第四個按鈕裁切、垂直超出、按鈕重疊、文字裁切；V21 顏色破壞與基準缺檔（不得自動建立）；V22 CSS 破壞；V23 在暫存複本丟掉多人 emit，真的走雙頁模擬必須失敗；V24 讓 migrateG 直接原樣回傳；V25 本機只讀網站對照、部署舊內容與修改請求封鎖（伺服器收到的修改請求必須為零）。全部破壞只在暫存複本／測試頁；細節寫入 pr-e-selfcheck.json，並合併進 selfcheck.json。


## V06 持續忙碌故障與證據保存（2026-11-27）

V06 保留六步至少五次逾時、QA_WAIT_MS=800、QA_STUCK=99 的原判定。舊方式每 20ms、僅 node 階段設定 busy=true；正常 run() 的 finally 會清除 busy／G.busy，兩次注入之間可能先通過等待條件，進入 fight 後更停止注入。因此偶發未達五次逾時是故障情境失效，不是等待工具沒有回報逾時。

現在只對 V06 子程序載入 v06-preload.cjs：第一個操作之前、每次測量之前，安裝 G.busy 持續鎖並以另一個 evaluate 讀回；確認描述子、目標 G 與值都相符，最多重注入三次，仍失效就讓工具失敗。正常的 busy 清除仍可執行，但 G.busy 的寫入不能解除鎖，跨 node／fight 都保持故障。實際 driver.wait 與其逾時值、傳回結果完全沿用，沒有製造假的逾時結果。

每一步保存實測等待 ms、timeout、測量前後 busy／G.busy、階段、節點、正常流程嘗試清除的次數，以及每次注入與讀回。V06-proof 要求三尺寸各六步證據完整且持續鎖有效。Node 自我驗收刻意移除首次注入、持續移除注入、模擬正常清除與跨階段，確認重注入與失敗路徑。

qa-selfcheck.sh 結束時先將暫存細節複製到 test-results/selfcheck-details，再刪暫存；V06／V10 每次保留，任何自我驗收失敗則保留全部情境的 JSON、日誌、退出碼及截圖，附大小與 SHA-256 清單。只收普通檔案，排除符號連結與素材；既有完整測試的 artifact 上傳會一併保存。

### 狀態觀察對時序的影響

修正前同一最新版與 V10 平行的原測試為 20/20；加入等待條件內的狀態觀察後為 16/20。觀察包裝保留原布林傳回值，但增加回呼運算與通訊排程，會改變短暫清除窗口被取樣的機率。失敗集中在 1280×720、種子 3：前兩步約 255–259ms 就觀察到 busy=false、G.busy=false，後四步才逾時；並非 800ms 不足。這類觀察不能宣稱完全無干擾，兩組失敗率不得合併比較。修正後另跑相同觀察組二十輪，並靠持續鎖消除原本依賴取樣時機的窗口。

原始首次失敗的「紀錄已保留」說法須更正：當時只留下 selfcheck 摘要，V06 暫存明細已刪除，正常冒煙的 trace 不能代替它。後續二十輪調查資料另存 qa/v06-evidence-cd20588 分支，屬於重現資料，不是原始失敗現場。

穩定性驗收：.github/workflows/v06-stability.yml 固定各二十輪，包含最新版單獨、與 V10 平行、加狀態觀察，以及 6ba5f1f 舊版與 V10 平行的負向對照；修正組必須全過，舊版組必須重現至少一次失敗。不能將舊版未重現當成修正有效，也不能靠反覆重跑挑結果。
