# 給 Claude 的規則（零號病例，2026-11-23 主人定案的新流程）

這是 Claude 唯一要從頭讀完的規則。接著讀 `docs/HANDOFF_CLAUDE.md`（現況、還原、待辦）。設計決定在 `docs/DESIGN.md`，**只讀這次要改的那一塊**，用關鍵字搜尋。

## 一、開工
1. `git pull`（或照 HANDOFF 重新 clone），看 `git log --oneline -5` 和 `更新說明.txt` 最上面。版本以 index.html 的 `ZC_VER` 為準，不要相信對話裡說的版本號。
2. 主人只是問、討論：只回答，不改檔案。主人明確說要改、開始做：才動手，已授權的範圍一路做完。
3. 先停下來給主人選（2～4 個選項，推薦的放第一個標「（推薦）」）：新系統、改核心規則（價錢、戰鬥、警戒、善惡值、存檔）、刪內容、改劇情走向、有兩種以上合理做法、會讓舊測試失敗、新增會扣善惡值的抉擇。
4. 主人的要求拆成清單，做完逐條對照。只改這次要求的東西，不順便重構、改名、重排。

## 二、一定要守
- 所有文字用台灣繁體中文用語，沒有簡體字和中國大陸用語。舞台是 2038 年美國城市，不放台灣在地事物；不寫喪屍、殭屍；事件沒有靈異；文字只寫看得到、聽得到的具體東西。
- 感染者＝還保有大部分人類外觀的敵人統稱。腐殖的菌絲一律寫成鮮紅色、像血管在跳。
- 敵人立繪只用主人原本的美術。QTE 只靠玩家反應，不做擲骰替代。不做跨局記憶、不做配方記錄。選項小字不寫後果、數字、去處。
- 訪客兌換碼只在 Claude 專案的 `zerocase/GUEST_CODES.md`，程式只放雜湊，不能進倉庫。
- `tests/guard.test.cjs` 永遠不改。舊測試只有在主人這次明確改了決定時才能改，PR 要寫出來。

## 三、改程式
- 照 HANDOFF 的還原步驟從倉庫 index.html 切出原始碼，build 後和倉庫**逐位元相同**才開始改；不同就停下來回報。
- 新增函式、常數、CSS class、節點代號、旗標之前先 `grep`，不要撞名，也不要憑印象用不存在的名稱。
- 節點的 `c` 陣列不要在中間插選項（「做過了」用索引記），新選項 push 到最後。`go`／`next` 指到的節點要存在。改旗標或存檔結構要在 `migrateG` 加轉換。
- 每個模組的第一行標題不能改（切檔靠它，清單在 `tools/split_index.py`）。
- 長行用 Python 取代：`assert s.count(舊)==1` 再 `replace`。

## 四、測試（主人 2026-11-23：省流量，只跑需要的）
- **本機只跑 FAST**：`export NODE_PATH=$(npm root -g)`，`bash tests/run_all.sh fast`（約 1 分鐘：防弱化檢查＋全部 Node 測試，報告在 `test-results/report.json`）。全部跑，不要只挑幾支，便宜又能抓到改壞的舊測試。說明見 `docs/QA_SYSTEM.md`。新功能或修正補 1～3 個聚焦的測試。
- 新增地點、事件節點、隨機事件、意外種類時，要在 `tests/helpers/env-compat.cjs` 的對照表照節點文字分類（室內／戶外、有什麼東西），不然 FAST 會失敗；新音效名稱要有檔案或合成音，不然素材掃描會失敗（2026-11-25 PR-C）。
- **改到畫面**：只截改到的那幾個畫面，親眼看過文字清楚、沒被擋住。版面有動才拍三種尺寸（844×390、1280×720、393×690＝手機窄橫向），只改文字拍 844×390 就好。
- **瀏覽器冒煙、長路線**：開 PR 後 GitHub 的「完整測試」會自動跑（`.github/workflows/test.yml`），本機不跑，看結果就好：`gh api repos/RyouShiro0329/zerocase/commits/<分支>/check-runs --jq '.check_runs[]|.name+" "+.status+" "+(.conclusion//"")'`；報告與失敗截圖在那次執行的 artifact「test-results」。主人要求才在本機跑 `bash tests/run_all.sh full`（背景執行，一次只跑一個）。
- 報告的六種狀態：PASS 通過、FAIL 失敗、SKIP 略過、NOT_RUN 未測試、ERROR 測試工具出錯、TODO 暫緩；回報時 SKIP、NOT_RUN、ERROR 都寫成「未測試（原因）」，不能寫通過。改測試工具要跑 `bash tests/qa-selfcheck.sh`。CI 失敗時看報告裡的種子，用 `QA_SEED=<種子>` 重跑，對照 `trace-*.json`。
- 結果只能寫「通過／失敗／未測試（原因）」。Android 實機一律「待主人實機驗收」。正式多人連線（Firebase）沒有實測就寫未測試。

## 五、發布（照順序）
1. 從最新 `origin/main` 開分支（`feat/…`、`fix/…`），一個任務一個分支。
2. 改完、build、把 `web/index.html` 複製成倉庫的 `index.html`，跑 Node 測試。
3. 遊戲文字有新字才跑 `python3 tools/make_font_subset.py`（先 `pip install fonttools brotli --break-system-packages`）；字數沒變就 `git checkout fonts/`。
4. 升版：`python3 tools/release.py patch|minor|major`（只改 index.html 的 ZC_VER 和字型網址 `?v=`，印出新的 SHA-256）。
5. 寫紀錄：`更新說明.txt` 最上面一段（改了什麼、測試結果、碰到哪些主人原本的規則）；`docs/VERSIONS.md` 表格最上面一行（commit 欄寫「見 commit 訊息」）；`docs/HANDOFF_CLAUDE.md` 的現況和待辦。
6. 一個 commit（訊息用「v版本：」開頭，之後靠它找這一版），push，開 PR：`gh api repos/RyouShiro0329/zerocase/pulls -f title=… -f head=<分支> -f base=main -F body=@檔案`（gh 的 GraphQL 在這裡不能用）。PR 說明短，細節指向更新說明。
7. 等「完整測試」結果，回報主人。**不要自己合併。**
8. 主人說「可以合併」或「開始部署」：`gh api -X PUT repos/RyouShiro0329/zerocase/pulls/<n>/merge -f merge_method=merge`（一般 merge，不用 squash）→ 約一分鐘後確認網站 https://ryoushiro0329.github.io/zerocase/ 的 ZC_VER 是新版。

## 六、不用同步 Claude 遊戲連結（主人 2026-11-24）
- 主人現在都用網站版 https://ryoushiro0329.github.io/zerocase/ 玩，Claude 測試也用倉庫的 index.html。**Claude 的遊戲連結（artifact）不用再同步、不用上傳素材**；合併後確認網站的 ZC_VER 是新版就完成。
- 新音檔照樣要先檢查（ffmpeg 解碼、響度、頭尾空白、頻譜圖親眼看；有人聲的轉文字對照來源紀錄），有問題先回報主人。

## 七、回報給主人
- 中文、短，手機一兩個畫面讀得完。
- 列出：版本／Build／上一版、時間、遊戲檔 SHA-256、改了什麼、實際通過的測試、未測試和原因、待主人決定的事。
- 主人問「是什麼意思」時，用遊戲裡的例子回答，不重講流程。
