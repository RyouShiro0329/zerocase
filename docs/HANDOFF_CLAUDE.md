# 零號病例（文字冒險版）開發交接（給 Claude）

給新對話的露涅希亞：先讀完這份，再還原原始碼，才開始改東西。

**2026-11-23 主人選 A：GitHub 是唯一的正本。** 這份交接、工具（`tools/claude/`）、版本資訊（`tools/claude/RELEASE_IDENTITY.json`）都在倉庫裡，每一版和遊戲一起 commit。Claude 專案只留：入口文件 `zerocase/HANDOFF.md`（很短，指到這裡）、訪客兌換碼 `zerocase/GUEST_CODES.md`（**不能放進倉庫**）、還沒搬進倉庫的設計參考（WORLD_DESIGN、PROPOSAL_*、design/、DATA_SHEET 等，要用時再 project_read）。**發布後不再把 RELEASE_IDENTITY、SHA 清單、CHANGELOG、HANDOFF 存回專案。**

## 現況（2026-11-23 18:55 更新）
- 目前版本：**v0.57.0／Build 127**（2026-11-23T16:50:10+08:00，Claude：旅館四層「門／窗／瓦斯／車」；PR #52 merge b8e62eb，主人 18:48 說可以合併，網站已是 v0.57.0）。
- 上一版：v0.56.1／Build 126（2026-11-23T15:17:41+08:00，醫院地下室停電前後的文字；PR #50 merge 5bace0d；交接搬進倉庫 PR #51 merge 3104e0e）。
- **下一步**：主人看 v0.57.0 的 PR 決定合併；之後其他地點照同一標準加深（順序再問主人）。主人 16:31 提的「開瓦斯讓旅館燒起來（燃燒的旅館＝另一張地圖、影響回訪）」寫在 Claude 專案 PROPOSAL_HOTEL 的「之後再做」，和「旅館不燒」那條要主人一起決定，這版沒做。**主人 18:23：測試只跑改到的那幾支，不用每次重跑 run_all（太耗流量）**；大改或發布前再問主人要不要跑全部。
- 再上一版：v0.55.1／Build 124（2026-11-23T13:20:15+08:00，Claude：只有橫向畫面、窄橫向的武器選單），已部署：PR #48 merge 88776d8，網站 ZC_VER＝0.55.1。再上一版 v0.55.0／Build 123（警戒改版、全部選項標時間、搜索逐步深入；PR #47 merge f837933）；v0.54.0／Build 122（一局改回 12 天）；v0.53.2／Build 121（「北口」一律寫成「北口檢查站」）；v0.53.1／Build 120 是 GPT 做的。
- **v0.35.0～v0.53.1 是 GPT 做的**（2026-11-18～11-23，19 版），一版一行的摘要和 Claude 的檢查結果在 Claude 專案的 `zerocase/CHANGELOG_6.md`（舊紀錄，到 v0.56.1 為止，之後不再更新）；完整說明在 GitHub 倉庫的 `更新說明.txt`、`docs/` 各版文件。**主人改過的規則**整理在下面「主人的設計決定」，以這份為準；更細的在倉庫 `docs/AI_WORKFLOW.md`（GPT 和 Claude 共用的規則文件，2026-11-20 之後的定案都寫在那裡）。
- **紀錄（2026-11-23 起）**：每一版寫在倉庫 `更新說明.txt` 最上面、`docs/VERSIONS.md` 加一行、PR 說明；技術細節（改了哪些函式、旗標、測試結果）寫進 `更新說明.txt` 那一版或這份交接。舊紀錄 CHANGELOG～CHANGELOG_6、舊的 SHA 清單都在 Claude 專案，只供查舊版，不再更新。完整性靠 git 和 MANIFEST.json＋verify_release.py。
- **主人的工作方式**：Claude 流量用完時主人改用 GPT 更新，之後也會輪流；**以 Claude 為主**，Claude 負責整合、守設計規則、補紀錄、同步 Claude 連結。主人也會同時開好幾個 Claude 對話。開工前一定先 `git pull` 看最新 commit，不要相信對話開頭說的版本號。
- **正本是 GitHub 倉庫 RyouShiro0329/zerocase 的 index.html**（網站 https://ryoushiro0329.github.io/zerocase/ ，主人現在玩這個，GitHub Pages 從 main 發布）。每一版的 commit 在 `docs/VERSIONS.md`。
- **倉庫裡的工作規則**（CLAUDE.md→`AGENTS.md`、`docs/AI_WORKFLOW.md`、`docs/RULES_SONNET.md`）：從最新 main 開分支、一個任務一個分支、開 PR，**合併要主人說可以**（`gh api -X PUT repos/RyouShiro0329/zerocase/pulls/<n>/merge -f merge_method=merge`；gh 的 GraphQL 在這裡不能用，開 PR 用 `gh api repos/RyouShiro0329/zerocase/pulls -f title=… -f head=… -f base=main -F body=@檔案`）。推送權限要用 add_repo 的 access push。
- **Claude 的遊戲連結（artifact）和 GitHub 同步，v0.57.0**（第 86 版，version id **1795430947-29b2**，換了 index.html 和 fonts/tw-kai-game.woff2〔?v=7ef4f5fd〕；room 能力保留；slug fa8c023f-695e-4eef-b531-d8f0ca61c95c，網址 https://claude.ai/artifact/XwSTDnrZwgbtGBywfVrBZD ）。134 個檔案：index.html、img/ 22 張、fonts/ 5 個、fx/ 6 張、sfx/ 99 個、docs/audio/LICENSES_AND_ORIGINS.md。sfx/bgm_battle、bgm_encounter（v0.53.0 起不用）沒有上傳。
  - 連結上的 index.html＝倉庫 index.html。SHA256SUMS 裡的 zerocase.html 是 build.sh 的產物（不含外層 html），比對連結時用倉庫 index.html（v0.57.0 是 `2b3b8c17…7bab`）。
  - 發布規則：publish_files、帶 base_version、patch 模式、不傳 capabilities（room 能力保留）；files 放 index.html 和這次改過或新增的素材（字型重做要連字型一起傳）。「載入外部 script」的警告是 firebase 動態載入，連結版不用帳號，忽略。
- 工具在倉庫 `tools/claude/`（build.sh〔路徑 proto7〕、release.py、mock.js、bot.js、mp.js、RELEASE_IDENTITY.json）。**遊戲原始碼一律從倉庫的 index.html 切出來**。Claude 專案的 `zerocase/src/` 是很舊的備份，不要用。

## 還原步驟
1. add_repo（owner RyouShiro0329、repo zerocase；要推送用 access push），clone 到 /home/claude/zerocase（`--depth 60` 夠用）；已經有就 `git pull`。看 `git log --oneline -5`、`docs/VERSIONS.md` 前三行、`更新說明.txt` 最上面，確認 GPT 或別的 Claude 對話有沒有發新版。
2. `mkdir /home/claude/proto7`，`python3 /home/claude/zerocase/tools/split_index.py /home/claude/zerocase/index.html /home/claude/proto7` 切出 head.html 與 14 個 js。
3. `cp /home/claude/zerocase/tools/claude/* /home/claude/proto7/`（build.sh、release.py、mock.js、bot.js、mp.js、RELEASE_IDENTITY.json；build.sh 已經是 proto7 路徑）。img/ 從倉庫複製（22 張）；測試時 fonts/、sfx/、fx/ 用 `ln -sfn` 連到工作資料夾（web/ 底下要測也一樣連）。
4. 先確認 RELEASE_IDENTITY.json 的版本和 index.html 的 ZC_VER 一樣，再 `mkdir -p history/sha` 跑 `bash build.sh`：重建的 web/index.html 和倉庫的 index.html **逐位元相同**才算還原成功；不同就停下來回報主人。（不再用 SHA 清單核對；倉庫裡的 `python3 verify_release.py` 要通過。）
5. **GPT 發了新版**（tools/claude/RELEASE_IDENTITY.json 還是舊版號）：切檔後把 RELEASE_IDENTITY 的 version、build、released_at 改成 index.html 的 ZC_VER（build.sh 會用它產生版本行；不要用 release.py 升版），跑 build.sh 確認逐位元相同，在下一個 PR 一起 commit；GPT 改的規則記進這份交接。
6. 發布 Claude 自己做的新版：照倉庫規則開分支 → release.py 升版（會產生本機 CHANGELOG.md，不用存回專案）→ 把 web/index.html 複製成倉庫的 index.html → 遊戲文字加了新字才跑 `python3 tools/make_font_subset.py`（要 `pip install fonttools brotli --break-system-packages`；原始字型會自動從 GitHub 下載），然後把 proto7/head.html 兩處 `fonts/tw-kai-game.woff2?v=` 換成新字型 SHA-256 前 8 碼再重建；字數沒變就 `git checkout fonts/` → `export NODE_PATH=$(npm root -g)`，在倉庫根目錄 `bash tests/run_all.sh` 全部通過 → `更新說明.txt` 最上面寫這一版、`docs/VERSIONS.md` 表格最上面加一行 → MANIFEST.json 的 version／build／created_at 改好、files 重算雜湊（files＝`git -c core.quotepath=false ls-files` 的全部檔案，不含 MANIFEST.json 自己），`python3 verify_release.py` 通過 → commit → VERSIONS 填 commit、重算 MANIFEST、再 commit → push、開 PR（說明要寫有沒有碰到主人原本的設計規則）→ **commit 前把 proto7 的 RELEASE_IDENTITY.json 複製回 `tools/claude/`、這份交接（現況、測試、決定）一起改好**，同一個 PR → 主人同意後合併 → 等一分鐘 curl 網站確認 ZC_VER → 同步 Claude 連結 → 連結的版本 id 寫回這份交接（直接在 main 上 commit 一個小 commit，或放進下一版的 PR）。不用再存回 Claude 專案。
7. **同步 Claude 連結**：
   - 先 list_files 看連結現況；用 `git diff --name-status <上次同步的 commit> HEAD -- img fonts sfx fx docs/audio` 找新素材，再 grep index.html 確認遊戲真的會用到（不用的不傳）。上次同步的 commit：v0.57.0（b8e62eb）。
   - 字型用 fontTools 完整解析；圖片親眼看。
   - **新音檔**：主人會先聽過，Claude 再檢查一次就可以上傳。ffmpeg 完整解碼，看格式、長度、峰值、真峰值、響度、直流偏移、頭尾空白、標籤；畫頻譜圖親眼看；有人聲的用 faster-whisper（small.en）轉文字和 `docs/audio/RADIO_LINES.json` 等來源紀錄對照；循環音用 Chromium decodeAudioData 確認前後沒有空白。有問題先回報主人，不要自己改檔。
   - 做一個和連結相同的資料夾，開 http.server 8768 跑 `node tests/browser-smoke.cjs 40`，再開音效確認 soundStatus() 的 failed 是空的、配樂請求都 200，截圖看過才發布；發布後 list_files 核對檔案數與雜湊。

## 測試
- **一個指令跑完：在倉庫根目錄 `bash tests/run_all.sh [冒煙步數] [長路線動作數]`**（40／480 約 15 分鐘；`SKIP_LONG=1` 略過長路線時回報寫未測試；不要同時跑兩個，都用 8768 埠；前景指令上限 10 分鐘，用背景執行再等結果）。v0.56.1：Node 242 項通過、1 項 todo（恐懼紀錄數字，主人說先保留）；480 動作長路線到第 9 天、105 個節點，走過醫院三層。`tools/*.test.cjs`（GPT 的驗收腳本）132 項也通過。
- **醫院**：`tests/hospital.test.cjs`（13 項）。其中一項照劇本走一般路線、數每層的選擇次數（移動、繼續仔細翻、「不再找了」不算，挑病房算），會印出「一般路線的選擇次數」，現在急診 15～19、四樓 16、地下室 16。**加深其他地點時照這個寫法做同樣的測試**。
- **旅館**：`tests/hotel.test.cjs`（9 項，v0.57.0）。照醫院的寫法照劇本走一般路線（隨機事件拿掉），會印出「一般路線的選擇次數」：三樓 16、二樓 16、一樓走廚房 16／走洗衣房 15、地下 21。另外測門（房卡）、窗（QTE）、瓦斯（gasZone、hboom）、地下污染區（發電機＋排風機）、大廳多一隻可以疊、前後連動、紅色菌絲、舊存檔轉換。
- **只有橫向畫面（主人 2026-11-23 13:05）**：這是橫向遊戲，不測直式畫面。冒煙測試的 393×690 叫「手機窄橫向（Claude App 轉向）」，測的是轉向後 690×393 的橫向畫面（Claude App 裡就是這個尺寸），要保留。`tests/landscape.test.cjs` 檢查沒有畫面方向設定。
- **測試用無敵模式**：`tests/helpers/godmode.cjs` 的 GOD（主人 2026-11-16：現在不測平衡）。注意它**不會清 v0.51.0 的部位傷勢**（p.wounds），只補生命、恐懼、感染、飢渴、流血燃燒。
- **連線測試 mp.js**（tools/claude）：在 proto7 跑 `python3 -m http.server 8767`，`node mp.js 2`；加 `GODM=1` 開無敵（房主開局後注入），`LIM=毫秒` 改時間上限。輸出 maxG、fights、nodes、兩邊的 node／phase／時間／血量、errs。第三位玩家是自訂角色，要先分配 8 點才能按下一步，所以目前只跑 2 人。要從某個地點開始測：在 `await H.evaluate(GOD)` 後面加 `await H.evaluate(()=>{G.busy=1;void enterNode('O0').then(()=>{G.busy=0;G.phase='node';push();draw()})})`。
  - **v0.56.0 未解的問題**：從醫院開始的雙人測試 10 次裡有 1 次，房主那邊在急診 OE11 的戰鬥中出現同一個錯誤 110 次「Cannot read properties of undefined (reading 'w')」，遊戲卡在戰鬥；之後 9 次都沒重現，原因沒查到（只有房主、在戰鬥中）。看到要抓 stack（pageerror 時記 e.stack）。
- `tests/guard.test.cjs` 是主人的設計守則。**守則改了先問主人，再改這支。**
- `tests/zone.test.cjs`（單向路線、警戒、搜索、躲藏地點清單）、`tests/time.test.cjs`（**沒標時間就失敗**、新時間表、危險地點沒有商人）、`tests/hotel-stage.test.cjs`、`tests/events.test.cjs`（選項小字規則；跟 v0.21.5 基準比屬性時跳過基準沒有的 OF、OB）。
- Claude 專案的 `zerocase/tools/v0xxxtest.js` 是 Claude 舊版本的專用測試，**v0.34.0 之後大多過期**，要用之前先看預期值。
- 寫法提醒：page.evaluate 呼叫回傳 Promise 的函式要包 `void(...)`；開局後 `waitForFunction(G.phase==='node'&&!G.busy)`；用 evaluate 直接 enterNode 後要補 `draw()` 畫面才會換（`enterNode(x).then(draw)`）；新尺寸開新的 context；新 context 先設 zc5-meta 解鎖麥琪。手機直拿 393×690 畫面會轉，量大小用 offsetWidth／offsetTop。Node 測試用 `tests/helpers/audio-game.cjs` 的 game() 在 vm 裡跑整份遊戲（encounter、fright、push、draw 可以直接覆寫成空函式；qte 可以覆寫成 `async()=>true`）。用 applyRes 照劇本走路線時，每一步先把 G.alarm、G.ground 清掉，不然會被警戒或「地上有東西」擋住。
- 測試結果只寫通過／失敗／未測試；Android 實機一律「待主人實機驗收」；正式多人實連（Firebase）目前一直未測試。

## 檔案結構（依 build.sh 串接的順序）
head.html、items.js、chars.js、story.js、story2.js、story3.js、story4.js、engine_a.js、engine_b.js、engine_c.js、engine_d.js、qte.js、net.js、ui.js、scr.js。每個檔的第一行是固定標題，`tools/split_index.py` 靠它切檔，**不要改**（清單在 AI_WORKFLOW）。全部共用同一個全域範圍：新函式、常數、CSS class（.tm、.sh 撞過）、節點代號、旗標都要先 grep。LV 代號 A～Z 已用完，新地點用兩個字母。長行改用 Python `assert s.count(舊)==1` 再取代。**不要在節點的 c 陣列中間插選項**（有程式用索引參照，例如 story4 的 `N.X.c[2]`；選項的「做過了」也是用索引記的），要加就 push 到最後。GPT 期間新增的主要函式：ROUTE／srMax（單向路線）、alZ（旅館合成一個警戒區 hotel）、karma（善惡值）、resistCheck（抵抗）、wound*（傷勢）、beginEncounterBgm／BGM_MIX（配樂）、evac*（撤離）、outMe（只給某位玩家看的文字）。v0.55.0 新增：alMul、alarmRaid、alarmJoin、alarmClear、ZRAIDW、deepLabel、sqKey、sqDone、deepSearchRes、srDeep、merchOk、evShop。v0.56.0 新增：hspAir、hspGen、hspLit、HSP_AIR、RESIST_EFFECTS.exhaust（engine_c）；v0.57.0 新增：gasZone（engine_c，取代寫死的 G.lv==='F'）、moreFoes 可以吃陣列、evCands 認節點的 at、LV.G 的 fx.dark／fx.toxic 是 getter；旅館四層在 story4.js 最後「v0.57.0 旅館四層」段落；醫院節點在 story4.js「醫院（v0.56.0 深地圖範本）」段落，ROUTE.O／OF／OB 與說明在 story4.js 最後。v0.34.0 以前的檔案內容說明在 CHANGELOG_3～5。

## 主人（了白）的設計決定（不要違反）

### 2026-11-18 之後改過的（以這裡為準，舊規則作廢）
- **旅館四層（v0.57.0，主人 2026-11-23 定案，PROPOSAL_HOTEL）**：三樓客房「門」（房卡鎖停電照樣鎖、感染者不會轉門把；萬用房卡 mkey；302、303 要房卡；309 可以躲；樓梯間那一側沒有門把）→ 二樓宴會廳「窗」（警察對窗裡會動、會發光的東西開槍，失敗 QTE）→ 一樓後場「瓦斯」（舊廚房 F、洗衣房 H 的節點 L 改成 E；整層開槍、點火引爆 gasZone，扳掉總閥 gasoff 解除；炸過 hboom 大廳多一隻）→ 大廳出去；或地下「車」（舊停車場 P 的節點 L 改成 G；碰車、照車窗會響；整層污染區 fx.toxic 2，發電機 power＋排風機 fanon 才散；停車場的黑暗只在 P 開頭的卡）。捷徑：電梯井 C、消防梯 D、頂樓 R。新角色：310 的哈蒙夫婦（華特、瓊，瓊是退休的急診夜班護理師）、伴郎奈特。舊的 F、H、P 專用隨機牌靠節點的 at（F3、H3、P3）照舊抽。**主人 16:28：腐殖的菌絲一律寫成鮮紅色、像人的血管一樣在跳**（不要再寫灰白色的纖維）。**窗的邏輯（主人 18:09）**：封鎖線分不出誰是活人，被看見的人影就挨子彈（不是專打窗戶）。善惡值（主人 18:23）：帶走 310 +1、不理 −1，伴郎不扣。
- **醫院三層（v0.56.0，主人 2026-11-23 定案，PROPOSAL_HOSPITAL）**：急診「聲音」（ROUTE.O am 2）、四樓 4 West「伸手可及」（床頭櫃要檢定、失敗被抓 QTE）、地下室「空氣」（**主人 14:54 選 B：整層是污染區，每 30 分鐘感染 +3，面具加濾罐擋得住；另外發電機的廢氣是一氧化碳，面具擋不住**）；進了地下室回不了樓上；新角色藥局護理師瑞秋、B-124（丹尼）。主人在對話裡決定：**B-124 不解開不扣善惡值**（後果是他大喊）；**「敲藥局鐵捲門把病人引過去」扣 2**（比照旅館 302）；醫院四樓那位**改編號 B-124**，研究所的 B-118 是另一個人。文本主人說不用先看、玩的時候再看。
- **警戒（v0.55.0，主人 2026-11-23 定案）**：每區域 0～10。3 有動靜（只預告）／6 被盯上（小波，**只在戰鬥外、一個區域一次**，離開兩小時以上才重新算）／10 驚動（這一帶強敵帶頭的**最後一波**）。戰鬥中到 10＝**亂入**：先一回合預告，下一輪加入戰局（先攻重排、羅馬數字、配樂切激戰段、不同陣營就三方混戰）；打這波時警戒**鎖 10**；**打完或逃走清 0**。戰鬥中越過 6 不另外叫小波。戰鬥外到 10 直接找上門。噪音：快速翻 +1、繼續仔細翻 +2、打破玻璃 +3；開槍等照舊。**安靜躲一陣子**：一個區域一次、−3、30 分，只放在內容指定的合理位置（目前：旅館一樓備品間、便利商店倉庫、地鐵站失物招領、醫院急救室、四樓被服間）。**每層規則可以改警戒倍率**（LV fx.alarmMul／ROUTE am）。
- **時間（v0.55.0）**：**每個選項都要明確標時間種類**（`t`），沒標測試會失敗。一般 5～15 分、同地點移動 5～15、城市地點之間 30～90（夜裡在街上 2 小時）、要一陣子 30～60、大型工作明確標要很久（3 小時）、快速翻 5～10、繼續仔細翻 30～60、戰鬥 20、睡 8 小時／小睡 4 小時。
- **搜索（v0.55.0，主人選 A「逐步深入」）**：每個搜索點一個按鈕「翻○○」（很快、不檢定、拿明顯的一樣、噪音小）；翻完才出現「繼續仔細翻○○」（要一陣子、感知檢定、噪音大、拿藏起來的其他東西）。繼續仔細翻不算「15 次選擇」、不佔走廊「只能挑一件」。一般節點的搜索選項要加 `stay:1`，不然繼續仔細翻完會直接往下一張卡。
- **商人（v0.55.0）**：危險地點抽不到商人；流浪商人只在有休息點的地方、營地、地鐵站黑市。
- **深地圖標準（主人 2026-11-23）**：一層照一般路線至少 15 次選擇（搜索點只算一次、繼續仔細翻不算）；小地點可以一層，重要地點 2～3 層。卡片分停留卡（可以做好幾件事、每件一次）和抉擇卡（只能選一個）；一張卡 3～5 個選項。參考狐霖後室：每層一條符合現實的規則、用「環境：」提示行講、有回不了頭的點、前面的選擇改變後面。範本是醫院（v0.56.0）。**文本由 Claude 寫**（主人：GPT 的文本寫得很差）；文字只寫具體看得到聽得到的東西，不寫會讓人聯想成靈異的現象，用台灣習慣的說法。
- **一局 12 天**（主人 2026-11-23，v0.54.0；2026-11-20 的 30 天作廢）：五個世界階段：①爆發 1～2、②封鎖 3～4、③失序 5～7、④變異 8～9、⑤滅菌 10～12（STAGES＝[1,3,5,8,10]）。停電第 2 天、斷訊與撤離廣播第 3 天、停水第 4 天、最後一班撤離車第 5 天清晨、劫匪第 6 天（困難、真實第 5 天傍晚）、影子第 8 天、A.C.R.U. 第 10 天、夜間巡邏第 11 天 20 點、**第 12 天清晨預警與轟炸＝終局**。隨機事件 d0：劫匪 5、影子 8、A.C.R.U. 10；流浪商人 d1＝5。倉庫 `docs/OUTSIDE_MAP_SPEC.md` 的天數已過期，以 AI_WORKFLOW 為準。地圖加深後再照數據調天數。
- **23:41 伏筆整條拿掉**（v0.40.0）：ARC 合作門診長期包下 303、305、306 給追蹤觀察的病人，馬可、卡爾是隨行看護；**保險箱密碼是旅館開幕年份 1987**（SINCE 1987）。不要再寫回 23:41。不做跨局記憶照舊。
- **旅館改成單向路線**（v0.39.0，主人要像狐霖：選了就往前、不能回頭）：走過的地點、做過的選項整個消失；不顯示「已搜過／還沒進去」；每條走廊只能挑一件事（繼續仔細翻不算）；隨機事件依場景篩選；抉擇要真的有差；旅館出口前沒有商人。**301 的窗戶：沒看門背後逃生路線圖，整條選項不出現**；其他上鎖選項照舊：變灰、點了播鎖門聲、只說缺什麼不說去哪找。街道段 J～V 也是單向路線、共用一個警戒（v0.43.0）。規格在倉庫 `docs/HOTEL_ROUTE_SPEC.md`。
- **選項小字**（v0.40.2）：只寫需要什麼、會用掉什麼、要付多少錢、委託報酬；檢定只寫「力量檢定」（畫面換成「需要力量 12」）。不寫後果、會不會打、吵不吵、時間、通往哪裡、房間裡有什麼。有線索價值的改成察覺徵兆 sign。
- **隱藏數值**：噪音／警戒（見上面警戒）、善惡值 p.karma（−2 以下貴兩成、−4 貴五成、−6 傑西蘿絲不交易、trust 選項變難且不寫原因）。新增會扣善惡值的抉擇前先問主人。商店賣價定價五分之一，一般商人只收自己賣的那類，黑市全收。
- **QTE**（v0.49.0，主人實機選「稍快」；2026-11-23 主人說原本覺得太簡單，才改成這樣）：一次只顯示一格、按對才出下一格，整組倒數不重置；每格固定 527ms，不受能力、傷勢、天賦影響；普通、困難 3～4 格完全相同，真實 4～6 格。只靠反應、不提供擲骰替代照舊。
- **取消獨立閃躲**（v0.46.1）：敏捷防禦、格擋、掩蔽、QTE 保留。
- **撤離**（v0.35.0）：普通逃跑各人擲敏捷 12、只撤離自己；緊急撤退 +5 每場一次；技能「撤離路線」擲統帥 12、成功全隊撤離並帶走瀕死隊友；逃走的人在安全區等、不回血；沒被帶走的瀕死隊友換區後以生命 1 歸隊，傷勢保留。細節在 AI_WORKFLOW。
- **抵抗制**（v0.50.0）：控制成功避免、驚嚇成功減半、持續暴露成功延後一階段；遭遇驚嚇成功從免除改成減半。醫院地下室的廢氣用「減半」。
- **四部位傷勢**（v0.51.0）：頭、軀幹、手臂、腿共用生命值；重擊或爆擊時體質抵抗，輕傷會因時間＋負荷惡化；醫療選部位；夾板固定後仍要休養。畫面只寫部位與階段，不寫數字。
- **飢渴分開、疲勞**（v0.42.0）：睡 8 小時／小睡 4 小時，不睏不能睡，轟炸警報會叫醒。
- **配樂**（v0.53.1）：探索 Evil（bgm）；遇敵成立就切 Kevin MacLeod〈Hitman〉一般段（0～114 秒），最後一波（alarmFt===2，v0.55.0 起包括戰鬥中亂入）用激戰段（114～194 秒）；戰後淡回 Evil。CC BY 4.0，Credits 有署名。**最後一天（第 12 天）的空襲終局還沒做**：goliath.mp3／goliath_loop.mp3 從警報那一刻起取代所有背景音樂（包括戰鬥曲），做的時候要讓它蓋過 BGM_MIX。
- **只有橫向畫面**（v0.55.1，主人 2026-11-23）：手機直拿一律轉成橫向（從開頭畫面起），沒有畫面方向設定；只有輸入文字時暫時不轉（鍵盤方向）。
- **地名**：玩家看到的一律寫「北口檢查站」或「北邊的檢查站」（v0.53.2 全部改好；LV X 名稱是「北口檢查站・鐵絲網」）。

### 一直有效的
- 舞台是 2038 年**美國城市**，不放台灣在地事物；台灣繁體中文用語，不寫大陸用語（「爆擊」不寫「暴擊」；guard 也擋「菜單」，菜單要寫成傳單或價目表）。**感染者**是還保有大部分人類外觀的敵人統稱，變異越深越失去人形；陣營叫「感染者陣營」，不寫喪屍、殭屍。世界觀以 Claude 專案的 `zerocase/WORLD_DESIGN.md` 為準（學校段落之後要刪）。
- **A.C.R.U.（滅菌部隊）**：秘密部隊、持槍正規軍。一般文字只寫「穿黑色制服的人」「沒有標示的車」；玩家第一次看到字母是營地軍醫帳篷的徽章。不談判、帶隊者倒下照樣作戰、不會崩潰；重傷可能撤退。不寫「城市是病人、截肢」那類說法。
- **旅館不燒**：A.C.R.U. 進城後佔領，兩人看守地下室的門。研究所入口四條件：S 區門禁卡＋電廠恢復市電＋淨水廠恢復市水＋知道入口在旅館地下。
- **結局分級**：壞結局＝死亡、發瘋、葬身火海、被 A.C.R.U. 帶走滅口；普通＝活著逃出去但不知道真相；**真結局＝了解真相＋打贏 boss＋逃離**。
- **工作順序**：旅館、電廠、淨水廠完成 → ④ 研究所＋boss＋真結局（先跟主人討論，決定在 `PROPOSAL_LAB.md`；零號病例＝雷摩斯・凱德中士）→ ⑤ 空襲終局最後做（主人要「看著自己累積的一切毀於一旦」的感覺；進戰鬥有機率空襲，遠處炸敵人、近處炸友軍 −5 可 QTE 躲）。做首領地點時 LV 加 `boss:1`（妲爾的靈界的橋樑不能用）。
- **城裡沒有國民兵**：只有北口檢查站和撤離巴士。警察局白板「國民兵聯絡中斷」保留。
- **事件**要符合現實邏輯、沒有靈異（訪客自己的能力除外）；爆發後不會有人照常上班；停電一致（pwNow()、getter 寫法；緊急照明只撐幾小時）；事件之間要有節奏。
- **陣營**：玩家、滅菌部隊、劫匪、感染者四方敵對，小機率撞在一起互打。
- **能力（v0.31.0）**：建角 8 點、單項最高 5；「統帥」（程式鍵 CHA）管交涉、驚嚇、全隊恐懼累積、重傷人類敵人逃走（單人加倍）；防禦＝10＋敏捷÷2；力量格擋＝力量÷3 只擋近戰。武器一把一把決定命中／傷害看哪個能力，說明寫能力與耐久；雙手武器只能雙手拿；刀類斬擊，穿刺給弓弩與戳的近戰。合成三格、每個配方最多三樣。等級：命中每 2 級 +1、傷害不隨等級、生命每級 +1、能力點每級 1。
- **骰子（v0.30.0～v0.32.0）**：攻擊擲 20「爆擊」傷害 ×2、擲 1 大失敗；抗性 ×0.75、弱點 ×1.25；畫面只跳命中骰、傷害骰背景擲寫紀錄；結果寫成「骰出＋加值＝總和」；骰子原地整顆翻滾、數字亂跳到落地、不能略過、一律二十面骰外形；全隊投票的檢定沒有協助 +2（協助只在分頭行動）；架槍 +2；多段攻擊先確認彈藥；先攻同分玩家先。v0.48.0 起連射合併成一次擲骰顯示（判定仍逐發）。槍械傷害先維持現狀。
- **數字盡量不顯示**：時間只顯示「第 N 天・時段」；背包與狀態下拉的生命、恐懼、感染、飢渴、護盾、傷勢只顯示條和階段；敵人卡顯示血量與防禦（真實模式不顯示防禦）、受傷浮紅字「−N」、未命中浮白字；恐懼紀錄的數字主人說先暫時保留。
- **難度**開局前選：普通、困難、真實。真實不顯示檢定難度與命中率、倒下不會自己醒、不顯示敵人防禦。
- **敵人**：立繪只用主人提供的美術，不自行生成；沒有狗；名稱不加詞綴、多隻用羅馬數字；卡片不寫蓄力瞄準的目標。數值見 `DATA_SHEET.md`（舊值）、`PROPOSAL_FACTION_B1.md`；多人血量：感染者與首領每多一人 +30%、劫匪與 A.C.R.U. +10%（無條件進位）。人類敵人打倒可搜身；劫匪與滅菌部隊三成以下血量檢查一次、三成機率逃走；沒有「跟對方談」。劫匪強敵＝梟首（還沒做，據點地點要問主人）。
- **被打中不會每次都加恐懼**：只有重擊或一下打掉三成以上生命。受傷音效只有被抓咬才播抓咬聲。
- **特殊欄位**：手電筒（強光照射每場一次、一名敵人下次攻擊 −4）、滅火器（每場一次、全場 −2、用一次扣一個）；裝在特殊欄位不佔背包（v0.43.3）。打火機、照片是一般道具；劇情選項要道具時要在同一個人身上、像檢定一樣選人；丟燃燒瓶的人要有打火機。防毒面具戴在臉。
- **背包版面**：左欄狀態維持原本寬度，物品一條一條，按鈕間隔大；美金固定不捲。主選單底部按鈕同寬同高。
- **燙手貨與黑市**：A.C.R.U. 的槍只有黑市收；黑市商人在地鐵站維修通道、不報名字。
- **帳號**：幽靈帳號或綁定 Google（Firebase Realtime Database asia-southeast1，saves/$uid 只有本人讀寫，改規則不要刪 rooms）；帳號在開始畫面與設定，主選單不放。**待主人在網站版真的按一次 Google 登入（手機、電腦各一次）**。Firebase 設定：apiKey `AIzaSyAxQLM4vXURmfT8NPEit3p79EWyd17CJ0k`、authDomain zerocase.firebaseapp.com、databaseURL https://zerocase-default-rtdb.asia-southeast1.firebasedatabase.app 、projectId zerocase、appId 1:383147688801:web:4de2a828aba58c6e433b20（網頁本來就公開）。Claude 連結不用帳號，存在手機裡。
- **訪客**：主人朋友用角色設定表（`GUEST_TEMPLATE.md`）設計的故事外角色，被動 1＋主動 1（專武技能最多 2），可帶一點超自然但不寫進主線，100 碎片。第一位妲爾（v0.33.0，`PROPOSAL_GUEST_DAR.md`）。**兌換碼**（v0.34.0）：每位訪客一組，露涅希亞隨機產生，記在 Claude 專案的 `zerocase/GUEST_CODES.md`，**不能寫進程式或倉庫的任何檔案**（程式只放 GUESTS 的 rc 雜湊）；碎片解鎖要保留。戰鬥選單第五顆叫「行動」。
- **多人**：最多 8 人；投票、選擲骰的人可以取消；房間裡隊友自己按「準備」；要支援安卓、iOS、電腦跨平台。
- 劇情角色 7 個：急診護理師、夜班保全、廚師、退伍軍人、高中化學老師、了白（男主角）、麥琪（女主角）。NPC 只知道身分合理知道的事；沒定案的設定（城市名稱等）不要寫死。
- **重大改動先跟主人討論**。**主人全部做完才會開始玩**，中間不會實機測試。

## 下一步與待辦
- 旅館加深 v0.57.0 做完（等合併）。之後其他地點照同一標準，順序再問主人。之後再做：燃燒的旅館（主人 16:31 提議，見 PROPOSAL_HOTEL）。
- 主人在 2026-11-18 01:38 排的順序：② 天賦與技能第一階段（`PROPOSAL_REBUILD.md`）＋輔助道具 → ③ 模擬每種配點、單人多人給主人看。優勢／劣勢（`PROPOSAL_COMBAT2.md`）等穩了再做。GPT 期間做的是地圖單向路線、30 天、戰鬥演出、抵抗、傷勢、配樂，這條順序主人還沒重新排，開工前問主人。
- 研究所＋boss＋真結局（④）、空襲終局（⑤，配合 12 天與新配樂系統重寫 FIRE_END）。
- 三陣營還沒做：梟首、零號病例兩階段、作戰指揮官與月台三方戰、劫匪精英；E 表三項（孵化者退開、巨噬者接縫、噴火兵燃料爆炸）。v0.49.0 已逐招整理 14 種敵人，做之前先看倉庫 `docs/ENEMY_QTE_v0.49.0.md`。
- 港口運柴油到電廠的路線；市電恢復後夜間遭遇；旅館的活人；情報旗標（erlog、arcfile、acruseen、opsnote、opslog）。
- 快照大小：v0.56.0 雙人測試 G 最大約 7.4KB（mock 單次封包上限 4096，實際送的封包最大 1766），12 天沒問題。

## 還沒決定、等主人回覆的事
- **v0.56.0 雙人測試偶發錯誤**（見上面「測試」）：重跑 9 次沒重現，原因沒查到。
- v0.52.0 抵抗制的隨機邊界測試曾失敗一次，GPT 重跑就過，原因沒查。
- 倉庫 `docs/VERSIONS.md` 的 v0.38.0～v0.38.2 還寫「待提交」（被 v0.39.0 取代）、v0.47.0 沒列（沒部署、併入 v0.49.0）。主人說可以再整理。
- 配樂與 piercehit 解碼峰值略超過 0 dBFS、piercehit 尾端 0.47 秒空白（不影響播放，沒改）。
- 妲爾的靈界的橋樑只帶到「去過的」休息點（v0.33.0），主人還沒回覆。旅館改單向路線後休息點也變了，之後要再確認這個技能在新路線下的效果。
- 戰鬥變難與自訂角色點數：主人 11-18 說先不用改（選項：A 配點 10、B 基礎生命 10→14（推薦）、C 不改＋提醒）。
- 狐霖參考：屬性超過 5 每點花 2 點、大失敗懲罰多樣化，還沒決定（閃躲已取消）。
- 合成音（失敗、大失敗、揮空）、強光照射用 click.mp3，等主人試聽再調。
- 碎片商店骨架、帶入物資、委託、敵人掉錢、初始資金與壓價還沒做（掉錢先問主人）。舊的滅菌部隊詞綴、「噴火的」詞綴沒有效果（詞綴生成率 0）；「巧手」天賦偏弱。
- 天賦與技能完整內容在主人的 Claude 文件「零號病例・角色設定表」https://claude.ai/artifact/37PHTe6tqqaKuvAsMWhf1G 。
- 音效小事：對講機每句開頭約 0.6 秒安靜；woodknock、firealarm 開頭有空白；iOS Safari 循環音接縫沒測。
