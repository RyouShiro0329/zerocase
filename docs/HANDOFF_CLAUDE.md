# 零號病例（文字冒險版）開發交接（給 Claude）

給新對話的露涅希亞：先讀 `docs/RULES_CLAUDE.md`（規則、流程），再讀這份（現況、還原、待辦），還原原始碼後才開始改東西。

**2026-11-23 主人選 A：GitHub 是唯一的正本。** 這份交接、工具（`tools/claude/`、`tools/release.py`）都在倉庫裡，每一版和遊戲一起 commit；版本只看 index.html 的 ZC_VER。Claude 專案只留：入口文件 `zerocase/HANDOFF.md`（很短，指到這裡）、訪客兌換碼 `zerocase/GUEST_CODES.md`（**不能放進倉庫**）、還沒搬進倉庫的設計參考（WORLD_DESIGN、PROPOSAL_*、design/、DATA_SHEET 等，要用時再 project_read）。**發布後不用存任何東西回專案。**

## 現況（2026-11-23 21:10 更新）
- 目前版本：**v0.57.0／Build 127**（2026-11-23T16:50:10+08:00，Claude：旅館四層「門／窗／瓦斯／車」；PR #52 merge b8e62eb，網站已是 v0.57.0）。這個環境推不上 git 標籤；找某一版用 `docs/VERSIONS.md` 或 `git log --grep='^v版本'`。
- **2026-11-23 21:01 主人定案：發布流程整套換新**（PR「發布流程整理」）：拿掉 MANIFEST.json、verify_release.py、RELEASE_IDENTITY.json、舊的 tools/claude/release.py、VERSIONS 回填 commit、連結同步前的冒煙測試；9 個舊的 GitHub 驗收合成 1 個「完整測試」；舊驗收 zip 和單一版本 QA 紀錄刪掉；規則整理成 `docs/RULES_CLAUDE.md`、`docs/RULES_GPT.md`，設計決定搬到 `docs/DESIGN.md`；舊規則文件在 `docs/archive/`。
- **下一步**：其他地點照醫院／旅館的深地圖標準加深，順序再問主人。之後再做：燃燒的旅館（主人 16:31 提議，「旅館不燒」那條要一起決定，見 Claude 專案 `zerocase/PROPOSAL_HOTEL.md` 第八節）。
- **v0.35.0～v0.53.1 是 GPT 做的**（2026-11-18～11-23）；那段時間的定案都在 `docs/DESIGN.md`。舊紀錄 CHANGELOG～CHANGELOG_6、舊 SHA 清單在 Claude 專案，只供查舊版，不再更新。
- **主人的工作方式**：Claude 流量用完時改用 GPT，之後也會輪流；**以 Claude 為主**，Claude 負責整合、守設計規則、補紀錄、同步 Claude 連結。主人會同時開好幾個 Claude 對話，開工前一定先 `git pull`。
- **正本是 GitHub 倉庫 RyouShiro0329/zerocase 的 index.html**（網站 https://ryoushiro0329.github.io/zerocase/ ，GitHub Pages 從 main 發布）。推送權限要用 add_repo 的 access push。
- **Claude 的遊戲連結（artifact）**：slug fa8c023f-695e-4eef-b531-d8f0ca61c95c，網址 https://claude.ai/artifact/XwSTDnrZwgbtGBywfVrBZD 。目前和 v0.57.0 同步。134 個檔案：index.html、img/ 22 張、fonts/ 5 個、fx/ 6 張、sfx/ 99 個、docs/audio/LICENSES_AND_ORIGINS.md（sfx/bgm_battle、bgm_encounter 沒用到，沒上傳）。「載入外部 script」的警告是 firebase 動態載入，連結版不用帳號，忽略。同步方法在 RULES_CLAUDE 第六節。
- 工具：`tools/claude/`（build.sh〔路徑 proto7〕、mock.js、bot.js、mp.js）、`tools/release.py`（升版）、`tools/split_index.py`（切檔）、`tools/make_font_subset.py`（字型）。**遊戲原始碼一律從倉庫的 index.html 切出來**；Claude 專案的 `zerocase/src/` 是很舊的備份，不要用。

## 還原步驟
1. add_repo（owner RyouShiro0329、repo zerocase；要推送用 access push），clone 到 /home/claude/zerocase（`--depth 60`），之後 register_repo_root；已經有就 `git pull`。看 `git log --oneline -5`、`更新說明.txt` 最上面，確認 GPT 或別的 Claude 對話有沒有發新版。
2. `mkdir /home/claude/proto7`，`python3 /home/claude/zerocase/tools/split_index.py /home/claude/zerocase/index.html /home/claude/proto7` 切出 head.html 與 14 個 js。
3. `cp /home/claude/zerocase/tools/claude/* /home/claude/proto7/`，img/ 從倉庫複製；測試時 fonts/、sfx/、fx/ 用 `ln -sfn` 連到工作資料夾。
4. `bash build.sh`（版本行直接取倉庫 index.html 的 ZC_VER，GPT 發的新版也一樣，不用另外處理）：重建的 web/index.html 和倉庫的 index.html **逐位元相同**才算還原成功；不同就停下來回報主人。
5. 改完之後的測試、升版、發布、同步連結照 `docs/RULES_CLAUDE.md`。

## 測試
- **本機只跑 Node 測試**（`node --test tests/*.test.cjs`，2026-11-23 起 384 項，含從 tools/ 搬來的 132 項功能測試；1 項 todo 是恐懼紀錄數字，主人說先保留）。瀏覽器冒煙和長路線交給 GitHub 的「完整測試」（每個 PR 自動跑 `bash tests/run_all.sh 40 480`）。主人要求才在本機跑 run_all：背景執行、一次只跑一個（都用 8768 埠），約 15 分鐘。v0.56.1：480 動作長路線到第 9 天、105 個節點。
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
head.html、items.js、chars.js、story.js、story2.js、story3.js、story4.js、engine_a.js、engine_b.js、engine_c.js、engine_d.js、qte.js、net.js、ui.js、scr.js。每個檔的第一行是固定標題，`tools/split_index.py` 靠它切檔，**不要改**（清單在 tools/split_index.py）。全部共用同一個全域範圍：新函式、常數、CSS class（.tm、.sh 撞過）、節點代號、旗標都要先 grep。LV 代號 A～Z 已用完，新地點用兩個字母。長行改用 Python `assert s.count(舊)==1` 再取代。**不要在節點的 c 陣列中間插選項**（有程式用索引參照，例如 story4 的 `N.X.c[2]`；選項的「做過了」也是用索引記的），要加就 push 到最後。GPT 期間新增的主要函式：ROUTE／srMax（單向路線）、alZ（旅館合成一個警戒區 hotel）、karma（善惡值）、resistCheck（抵抗）、wound*（傷勢）、beginEncounterBgm／BGM_MIX（配樂）、evac*（撤離）、outMe（只給某位玩家看的文字）。v0.55.0 新增：alMul、alarmRaid、alarmJoin、alarmClear、ZRAIDW、deepLabel、sqKey、sqDone、deepSearchRes、srDeep、merchOk、evShop。v0.56.0 新增：hspAir、hspGen、hspLit、HSP_AIR、RESIST_EFFECTS.exhaust（engine_c）；v0.57.0 新增：gasZone（engine_c，取代寫死的 G.lv==='F'）、moreFoes 可以吃陣列、evCands 認節點的 at、LV.G 的 fx.dark／fx.toxic 是 getter；旅館四層在 story4.js 最後「v0.57.0 旅館四層」段落；醫院節點在 story4.js「醫院（v0.56.0 深地圖範本）」段落，ROUTE.O／OF／OB 與說明在 story4.js 最後。v0.34.0 以前的檔案內容說明在 CHANGELOG_3～5。

## 主人的設計決定
搬到 `docs/DESIGN.md`（2026-11-23，原文沒改）。開工不用整份讀，要改哪一塊就搜尋那一塊。新的定案寫在那份最上面那一節。

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
