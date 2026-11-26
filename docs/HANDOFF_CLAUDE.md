# 合併與發布交接（2026-11-26，Asia/Taipei）

主人已明確同意合併 PR #76 與 #77。QA PR-E #76 已以一般 merge 合併至 main 2e08527，遊戲仍為 v0.69.0／Build144；本分支將其整合進恐懼顯示修正，完成最新整合驗收後合併 #77 並確認正式站發布。這次授權優先於下方候選階段的「不要自行合併」。

- 遊戲維持已驗收的 v0.69.1／Build145，index.html SHA-256 faa287deed1741a545cc1672cfa7f09ee9072c9af9d3d30660b982b520c7d9df；整合只處理紀錄衝突、測試相依及版本標示的截圖基準，不再升版。
- 固定截圖含角色分類選單的版本標示。以相同瀏覽器取得差異候選，人工確認只改版本／Build 後才更新基準；其餘畫面保持原基準。不提高容忍值、不修改 guard 或既有測試判定、不由 CI 自動接受基準。
- 截圖人工審查：三尺寸角色分類選單各只有版本標示的 93 個像素變動，已確認 v0.69.0／Build144 → v0.69.1／Build145，僅更新這三張與來源 manifest。其餘十二張保留，393×690 戰鬥畫面 17 個微小渲染差異由既有容忍值處理，不覆蓋基準。暫時候選擷取步驟已移除。
- 整合 FAST：488 項，485 通過、0 失敗、3 個既有 TODO 標記；最新完整九階段、自我驗收與發布結果以 PR #77 最終提交為準。
- 環境相容已決定等地圖重做，音效已決定之後處理；恐懼只顯示實際 +N／−N，不顯示目前值與上限。Android 待主人實機驗收。
- 下方保留兩個 PR 原候選的範圍、雜湊與驗收紀錄供追溯；最終整合與發布結果看 PR #77 最新提交的 Checks、artifact 與正式站內容雜湊。

---

# GPT／Codex 交接：恐懼紀錄只顯示增減量（v0.69.1／Build145 候選）

2026-11-26（Asia/Taipei）。基準 main 49dca4c／v0.69.0／Build144，獨立分支 fix/fear-delta-only；QA PR-E #76 保持原樣、未合併，不把遊戲修改混入純測試工具 PR。

- 主人定案已寫入 docs/DESIGN.md 最上面的新決定：環境相容 9 組等地圖重做；音效缺口及聽感等之後補齊或另採方式；恐懼確定顯示實際增減量，不顯示目前總值與上限。
- 遊戲僅刪掉 setFear 紀錄中的「（目前 X／100）」；保留 +N／−N、階段變化、角色名稱與既有紀錄傳輸。倍率、上下限、發瘋門檻、結算與存檔皆不改，素材與字型不改。
- tools/release.py patch 升至 v0.69.1／Build145；時間 2026-11-26T22:55:39+08:00，index.html SHA-256 faa287deed1741a545cc1672cfa7f09ee9072c9af9d3d30660b982b520c7d9df。
- 新增 tests/fear-display.test.cjs 三項聚焦測試：增加及裁切後的實際差額、減少及跨階段／零變化、多人紀錄事件格式。tests/fear-display-browser.cjs 與專項 workflow 提供三尺寸修改前後截圖及實際畫面驗收；雲端結果以本修正 PR 的最後提交為準。
- FAST：479 項，476 通過、0 失敗，3 個既有 TODO 標記保留。guard 原恐懼斷言已通過，但依「不得修改 guard」規則保留原標記；不再代表恐懼設定待決。地圖與音效依主人決定暫緩。
- PR-E 若先合併，本修正須重新對齊 main；角色分類選單的固定截圖含版本標示，升版時需依 PR-E 的明確更新流程審查基準，不能提高差異容忍值或自動接受差異。
- 本修正僅開 PR 交付，不沿用下方 B 方案的合併授權。尚未合併／部署；Android 待主人實機驗收。

---

# GPT／Codex 交接：QA PR-E（P2，測試工具）

2026-11-26（Asia/Taipei）。基準 main 49dca4c／v0.69.0／Build144，分支 qa/pr-e。只做主人指定六項 P2，不升遊戲版本；index.html、素材、tests/guard.test.cjs 均不改。docs/VERSIONS.md、更新說明.txt 各只加一行「測試工具」。

- 新增固定情境版面／PNG 基準與 CSS 防護、五個歷史版本的存檔 fixtures＋migrateG 驗收、部署後只讀冒煙。使用方式、截圖更新規則與覆蓋範圍見 docs/QA_SYSTEM.md 的 PR-E 各節。
- 多人 mock／mp／bot 與舊 mpstage 搬到 tests/multiplayer/，直接服務 checkout 的 index.html；不再依賴 /home/claude、proto7、外部伺服器或不存在的 fbfake.js。舊 mp／bot 指令保留轉接。build.sh 改為相對位置與工作資料夾參數，重建以 cmp 確認。
- 本機 FAST Node：485 項，482 通過、0 失敗；3 項既有未測試（環境相容已知組合、恐懼數字、音效缺口等待主人決定）。新增固定畫面與多人模擬已另跑；最終自我驗收及 GitHub「完整測試」結果應看本 PR 最後一個 commit 的 Checks 與 artifact，未完成不得宣稱通過。
- tests/qa-selfcheck.sh 追加 V20～V25 故障注入，保留原 V01～V19。CI 固定 Playwright 1.58.2；本機有其他全域版本時，用 NODE_PATH=$PWD/tests/node_modules 執行，避免臨時複本解析到不同版本。
- 主人本次明確要求：開 PR、等待 GitHub 完整結果，**不要自己合併**；舊 B 方案的合併授權不適用本 PR。尚未合併時，main 的部署後冒煙 workflow 未觸發；Android 待主人實機驗收，正式 Firebase 不屬於本機模擬通過範圍。

---

# GPT／Codex 交接：B 方案（v0.69.0／Build144）

2026-11-26（Asia/Taipei）。基準 main 0f7e5d1／v0.68.0／Build143，分支 feat/asset-loading-b，PR #75：
https://github.com/RyouShiro0329/zerocase/pull/75

- 主人已明確授權公開推送、建立 PR，完整驗收通過後合併部署；不需再次詢問相同授權。發布狀態以 PR 與正式站版本為準。
- 架構、工程參數、已知備援缺口與驗收方式見 qa/asset-loading/HANDOFF.md；原規格 SPEC.md 完整保留。
- 原 tests/、guard、split_index、既有 workflow 均未改。Node 476 項＝473 通過、0 失敗、3 既有暫緩；新增聚焦三組通過。最終雲端結果看 PR Checks 與其程式雜湊，不把早期報告誤當現況。
- 同場音效延遲回呼依既有 musicId；普通短音效的傳輸加上本機取消／去重識別，四秒以上排隊、離開分頁、已涵蓋快照及舊節點事件不補播。原有陣列介面保留，舊房主沒有新欄位也可接收。
- SW 限同源公開靜態素材，主頁網路優先，媒體 Range 繞過；不 skipWaiting／claim。自動註冊限 /zerocase/ 結尾的部署範圍，其他完整部署需 ?asset-cache=1；單頁鏡像不發不存在的 SW 請求。
- 未改遊戲核心規則、原素材、混音或 Firebase 權限；無新增備援音效。Android 待主人實機驗收。

---

# 零號病例（文字冒險版）開發交接（給 Claude）

給新對話的露涅希亞：先讀 `docs/RULES_CLAUDE.md`（規則、流程），再讀這份（現況、還原、待辦），還原原始碼後才開始改東西。

**2026-11-23 主人選 A：GitHub 是唯一的正本。** 這份交接、工具（`tools/claude/`、`tools/release.py`）都在倉庫裡，每一版和遊戲一起 commit；版本只看 index.html 的 ZC_VER。Claude 專案只留：入口文件 `zerocase/HANDOFF.md`（很短，指到這裡）、訪客兌換碼 `zerocase/GUEST_CODES.md`（**不能放進倉庫**）、還沒搬進倉庫的設計參考（WORLD_DESIGN、PROPOSAL_*、design/、DATA_SHEET 等，要用時再 project_read）。**發布後不用存任何東西回專案。**

## 傷害飄字候選 v0.67.2（2026-11-25，Asia/Taipei）
- 從最新 main 18b7683 開 fix/damage-float-overkill；附件九處精確替換通過，release.py patch 升為 Build142（2026-11-25T23:54:20+08:00）。未改任何既有測試與 QA PR-A～D。
- newFoe.fdmgTotal、migrateG 缺值補零；foeDmgMark 只由 applyDmg 真實扣血與 roundEnd 流血呼叫。燃燒不另記，peek 不記，隱藏獵食者不記。
- fltScan 用 musicId／id 比對累計、同場水位不倒退，保留原紅白字與時序；fltReset 用於離戰與讀檔。snap 既有 JSON 帶欄位；不新增網路事件。
- 不改 HP 算法、kill 歸零、攻擊公式、核心規則或其他內容。重新檢查全檔扣血：敵人僅 applyDmg 與流血兩個入口，其餘為生成詞綴、治療、逃走、死亡或玩家傷害。
- 通過：附件獨立驗證 3 組；新增完整遊戲 tests/damage-float.test.cjs 3 組；FAST Node469 通過、0失敗、3既有暫緩。FAST 報告的五個瀏覽器階段是略過，不能說完整通過。
- 新增 tests/damage-float-browser.cjs 與獨立 workflow 取得三尺寸前後截圖、真實畫面／演出、Firebase雙端與房主交接；既有完整測試 workflow 不動。
- 本機 Chromium 不可執行、下載403；GitHub run 45650845102 的 26 項傷害／畫面／正式 Firebase 專項全部通過，含房主交接；三尺寸截圖已逐張檢視。另補真實單人讀檔、重新加入及倒序快照情境；完整回歸、自我驗收與追加專項結果以 PR #73 Checks 為準，未完成或有新失敗不得部署，不可改舊測試讓它通過。
- 專項首輪角色未解鎖、第二輪誤把原始 25 當所有屬性的結算傷害，均只修正本次新測試。非標準測試房號曾遭 Firebase PERMISSION_DENIED，改回原遊戲四位房號後實連通過，未改任何資料庫權限。
- .github/workflows/damage-float.yml 另在 main 的 index.html 更新後等待正式站 SHA-256 與本次完全相同，再以正式 URL 驗證版本、開新局探索、手機飄字與多人；原完整測試與自我驗收 workflow 均未改。
- PR：https://github.com/RyouShiro0329/zerocase/pull/73；專項紀錄：https://github.com/RyouShiro0329/zerocase/actions/runs/45650845102。部署後結果應另看 main 的「傷害飄字專項驗收」live_damage_float，未執行不可聲稱正式站通過。
- 尚未合併／部署；正式站新版與戰鬥未驗證；Android待主人實機驗收。既有三項暫緩保留。

## 現況（2026-11-25 17:40 更新）
- **QA 測試系統升級 PR-A（測試工具，不升版，index.html 和 v0.67.1 逐位元相同）**：run_all.sh 分 fast／full、六種狀態、`test-results/report.json`；防弱化檢查（guard 被改就失敗）；瀏覽器錯誤分類（必要檔案 404 算失敗）；CI 上傳報告與截圖、跑自我驗收。說明在 `docs/QA_SYSTEM.md`。方案在 Claude 專案 `zerocase/PROPOSAL_QA_UPGRADE.md`。PR-A（#69）、PR-B（#70）已合併；**PR-C 覆蓋範圍**（素材掃描 tests/assets.test.cjs、事件環境相容 tests/env-compat.test.cjs〔對照表在 tests/helpers/env-compat.cjs，KNOWN＝等主人決定的 9 組〕、不開無敵的生存路線＋戰鬥完整性 tests/survival-route.cjs）主人 16:33 說處理好直接合併；**PR-D QTE 與音訊**（QTE 固定情境 tests/qte-browser.cjs、真實瀏覽器音訊 tests/browser-audio.cjs，完整模式第 6、7 階段；音效對應表 tests/helpers/sfx-map.cjs＋docs/audio/SFX_MAP.md，缺口只列、待主人審查）主人 17:26 說處理好直接合併。下一步 PR-E（版面擴充、基準截圖、樣式防護、多人模擬搬進 tests/、存檔樣本、部署後冒煙），等主人說再做。**新音效名稱要在 sfx-map 的 DESC 寫說明、重新產生 SFX_MAP.md。****新增地點、事件節點、事件、意外種類時要在 env-compat 的對照表分類，不然 FAST 會失敗。**
- 目前版本：**v0.67.1／Build 141**（2026-11-25T06:05:38+08:00，Claude：販賣機玻璃整片碎掉加玻璃聲，主人 06:03 選 A，改了 tests/audio.test.cjs 一項）。
- 前一版 **v0.67.0／Build 140**（2026-11-25T05:39:54+08:00，Claude：實玩回饋與細節優化 SPEC_POLISH_AFTER_v0.66.0；主人 05:30 說全部處理完直接部署）。上一版 v0.66.0／Build 139。
- **v0.67.0**：紀錄在 `docs/POLISH_v0.67.0.md`。新東西：engine_b `SCUE`／`SCUE_FAR`／`cueAt`／`shotCue`（組合槍聲，sfx 認得這些鍵）、resultAudio 的 audio 可以是陣列；engine_c outcome 扣血播 `o.hs`（不再呼叫 hurtSnd；hurtSnd 留給 guard 測試）、節點欄位 `audio`（第一次描寫場景時播）；qte.js HAZ 每筆 `id`／`env`／`audio`／`okA`／`hs`，`HZBAN`、`HZL`（地點預設）、`HZN`（節點覆寫）、`hzBanned`／`hzEnvOf`／`hzCands`／`hzMark`、`G.hzDone`（同地點同種意外一次）；storyHz 的 `hz.audio` 在擲之前響，子結果也播 audio；engine_a「v0.67.0 事件音效標記」段落用路徑逐條標 hs／audio（之後新增會扣血的結果，記得在這裡標）。驗收 `tests/polish-v0670.test.cjs`；截圖 `docs/qa_v0.67.0/shots.cjs`。**待主人**：實機聽感、缺的音效素材（販賣機玻璃聲 v0.67.1 已加）。
- 上一版 v0.66.0：
- **第二階段（v0.66.0，ZEROCASE_QTE_COMBAT_PHASE2_FINAL）**：紀錄在 `docs/QTE_PHASE2_v0.66.0.md`。新東西：engine_b `bgTag`、`check` 第 6 個參數 `o.bg`（背景擲，不跳骰子）；engine_d `openStart`（開場：擲先攻→我方先動／敵方先動→advance，換房主也走這裡）、`ambushAct`／`F.ambDone`（突襲者先動一次）、`sneakCan`／`sneakOpen`／`sneakResume`／`sneakDrop`／`sneakRun`（我方敏捷最高的人先做一次任何行動）、`F.sneak`（1 等人選、2 結算中）、`F.sneakBy`、`f.amb`（突襲者）、fight spec `amb:'all'`（集體設伏，目前沒有事件用）；qte() 的 `o.now`；HAZ 每筆 `st`／`dc`；劇情 `hz.vis`（看得到的檢定）、`hz.bk`（紀錄寫抵抗）；story4.js 最後「v0.66.0」段落把 11 筆劇情 QTE 換成 hz。拿掉 `ambushQte`。驗收 `tests/qte-phase2.test.cjs`；截圖腳本 `docs/qa_v0.66.0/shots.cjs`。**待主人**：實機手感、正式多人、非無敵實戰的 QTE 頻率（突襲維持單一突襲者，主人 04:23 選）。
- 上一版 v0.65.0（QTE 重構、危險檢定、戰鬥演出）：
- **QTE 重構（v0.65.0，ZEROCASE_QTE_BGM_REWORK_SPEC；撲倒、狙擊、探索 QTE、偷襲開場已被 v0.66.0 取代）**：戰鬥八招改危險檢定（engine_d「v0.65.0 危險檢定」：HZMV 逐招表、hzOf、hzGuard、hzRoll、hzHit、bigHit〔原 qteHit 的失敗結算抽出來〕、HZPART、HZOK；hitFx 多一個參數 part），飛撲、狙擊照舊走 qteHit。劇情結果新欄位 `hz:{st,dc,l,t,ok,ng,mask,mk}`（qte.js 的 storyHz，engine_c applyRes 在 res.qte 前面處理），探索 6 筆改 hz、11 筆保留 qte，清單鎖在 tests/qte-rework.test.cjs。戰鬥演出（engine_d「v0.65.0 戰鬥演出」：STGL 標記表、STGV、stgOn／stgOpen／stgWait／stgClose／stgPast／stgSyncIn／stgView／stgFirst／stgMarkup／stgDraw／stgTick／stgEvac；G.stg；head.html #stg）：startFight、alarmJoin、endFight、finishEvacuation 有掛；encounter() 有演出時只等演出；handle()、act() 在演出中丟掉指令；snap() 帶 stg.left、stg.hs；setG 呼叫 stgSyncIn；becomeHost 接手演出。音檔分析與標記表在 docs/BGM_STAGE_v0.65.0.md。**待主人**：實機聽感與畫面、正式多人、非無敵實戰平衡。這個環境推不上 git 標籤；找某一版用 `docs/VERSIONS.md` 或 `git log --grep='^v版本'`。
- **旅館情境探索（ZEROCASE_HOTEL_EXPLORATION_SPEC，v0.64.0 全部做完）**：引擎在 engine_c「v0.63.0 情境探索」段落（xpSt／xpGen／xpNext／xpSync／xpResume，只有共用的部分）；每一層的設定 XPL 在 story4.js：三樓在「v0.64.0 共用情境探索：三樓設定」，其他樓層在「v0.64.0 整座旅館改成情境探索」段落（記號節點 BXN／EXN／GXN／CXN／DXN／RXN，繼續翻 BXQ…，牌庫 deck B／E／G／C／D／R，路線表的 #名稱…/ 是條件段落）。驗收：`tests/explore.test.cjs`（三樓）、`tests/hotel-xp.test.cjs`（全旅館、三樓路線鎖）、`tests/hotel.test.cjs`。**下一步**：主人實機驗收整座旅館。主人 2026-11-24 23:07 定案：每層長度維持浮動（不補到 15 次）；多人分頭做的時間算最長的那一件（DESIGN.md 有記）。之後其他地點要改情境探索，照 XPL 的格式加一份設定。
- **選擇卡改版（主人 2026-11-24 定案）**：正式方案在 Claude 專案 `zerocase/PLAN_CHOICE_CARDS.md`，三樓試做內容在 `zerocase/PROPOSAL_CHOICE_CARDS_3F.md`，選路翻牌＋開場不固定在 `zerocase/PROPOSAL_FORK_CARDS.md`（卡片內容 `zerocase/FORK_CARDS_CONTENT.md`）。版本：v0.58.0 種子與自動存檔 → v0.59.0 引擎＋三樓試做 → v0.60.0 三樓選路翻牌＋開場不固定（主人玩過：每格都五條路很怪、沒有推進感）→ v0.61.0 分支再收束（主人玩過：還是奇怪，越來越迷茫）→ v0.62.0 狐霖式四個基本行動：走廊常駐往前走／觀察四周／搜索這裡／休息，只有往前走推進（Claude 專案 `zerocase/PROPOSAL_BASIC_ACTIONS.md`；做完，等主人玩）→ 之後：多人分開做＋私人卡 → 迷失與感染病程（數字先給主人看）→ NPC 隊伍。原本「其他地點照深地圖標準加深」暫停。**寫卡守則（主人 2026-11-24 04:18）**：三樓表面上是旅館，走廊上不放病床、點滴架這類醫療設備（門診的痕跡只藏在單據、行李、看護的私人物品裡）；怪聲、怪狀況都在同一張卡寫出看得到的原因，不寫靈異。
- **2026-11-23 21:01 主人定案：發布流程整套換新**（PR「發布流程整理」）：拿掉 MANIFEST.json、verify_release.py、RELEASE_IDENTITY.json、舊的 tools/claude/release.py、VERSIONS 回填 commit、連結同步前的冒煙測試；9 個舊的 GitHub 驗收合成 1 個「完整測試」；舊驗收 zip 和單一版本 QA 紀錄刪掉；規則整理成 `docs/RULES_CLAUDE.md`、`docs/RULES_GPT.md`，設計決定搬到 `docs/DESIGN.md`；舊規則文件在 `docs/archive/`。
- **下一步**：主人玩三樓（v0.62.0）覺得對了，才把四個基本行動推到二樓以下，再做多人分開行動（走廊上的觀察、搜索、休息各自做；往前走、事件、換樓層全隊投票）。待主人決定：一層 12 步的長度、安靜機率 20%。被動感知門檻 14 照舊（實際開局：麥琪 10、護理師 11、保全 12、了白 14、退伍軍人 14；v0.60.0 回報說「一般角色約 15」是錯的，那是測試角色自動帶了觀察入微）。燃燒的旅館（`zerocase/PROPOSAL_HOTEL.md` 第八節）等改版後再說。
- **v0.35.0～v0.53.1 是 GPT 做的**（2026-11-18～11-23）；那段時間的定案都在 `docs/DESIGN.md`。舊紀錄 CHANGELOG～CHANGELOG_6、舊 SHA 清單在 Claude 專案，只供查舊版，不再更新。
- **主人的工作方式**：Claude 流量用完時改用 GPT，之後也會輪流；**以 Claude 為主**，Claude 負責整合、守設計規則、補紀錄。主人會同時開好幾個 Claude 對話，開工前一定先 `git pull`。
- **正本是 GitHub 倉庫 RyouShiro0329/zerocase 的 index.html**（網站 https://ryoushiro0329.github.io/zerocase/ ，GitHub Pages 從 main 發布）。推送權限要用 add_repo 的 access push。
- **Claude 的遊戲連結（artifact）**：2026-11-24 主人決定**不用再同步**（主人用網站版玩，Claude 測試也用倉庫的 index.html）。連結停在 v0.57.0（slug fa8c023f-695e-4eef-b531-d8f0ca61c95c），之後不再更新。
- 工具：`tools/claude/`（build.sh〔路徑 proto7〕、mock.js、bot.js、mp.js）、`tools/release.py`（升版）、`tools/split_index.py`（切檔）、`tools/make_font_subset.py`（字型）。**遊戲原始碼一律從倉庫的 index.html 切出來**；Claude 專案的 `zerocase/src/` 是很舊的備份，不要用。

## 還原步驟
1. add_repo（owner RyouShiro0329、repo zerocase；要推送用 access push），clone 到 /home/claude/zerocase（`--depth 60`），之後 register_repo_root；已經有就 `git pull`。看 `git log --oneline -5`、`更新說明.txt` 最上面，確認 GPT 或別的 Claude 對話有沒有發新版。
2. `mkdir /home/claude/proto7`，`python3 /home/claude/zerocase/tools/split_index.py /home/claude/zerocase/index.html /home/claude/proto7` 切出 head.html 與 14 個 js。
3. `cp /home/claude/zerocase/tools/claude/* /home/claude/proto7/`，img/ 從倉庫複製；測試時 fonts/、sfx/、fx/ 用 `ln -sfn` 連到工作資料夾。
4. `bash build.sh`（版本行直接取倉庫 index.html 的 ZC_VER，GPT 發的新版也一樣，不用另外處理）：重建的 web/index.html 和倉庫的 index.html **逐位元相同**才算還原成功；不同就停下來回報主人。
5. 改完之後的測試、升版、發布照 `docs/RULES_CLAUDE.md`。

## 測試
- **本機只跑 FAST**（`bash tests/run_all.sh fast`，2026-11-25 起；就是防弱化檢查＋`node --test tests/*.test.cjs`，v0.67.1 是 459 項；v0.66.0 是 451 項（含 `tests/qte-phase2.test.cjs` 8 項）；v0.65.0 是 443 項（含 QTE 重構與演出 `tests/qte-rework.test.cjs` 12 項；本機瀏覽器演出、雙人同步的 QA 腳本在 docs/qa_v0.65.0/）；2026-11-24 v0.60.0 起 409 項（含種子與自動存檔 `tests/seed-save.test.cjs` 7 項、選擇卡 `tests/cards.test.cjs` 13 項），含從 tools/ 搬來的 132 項功能測試；1 項 todo 是恐懼紀錄數字，主人說先保留）。瀏覽器冒煙和長路線交給 GitHub 的「完整測試」（每個 PR 自動跑 `bash tests/run_all.sh full 40 480`＋`tests/qa-selfcheck.sh`）。主人要求才在本機跑 run_all full：背景執行、一次只跑一個（都用 8768 埠），約 15 分鐘。v0.56.1：480 動作長路線到第 9 天、105 個節點。
- **醫院**：`tests/hospital.test.cjs`（13 項）。其中一項照劇本走一般路線、數每層的選擇次數（移動、繼續仔細翻、「不再找了」不算，挑病房算），會印出「一般路線的選擇次數」，現在急診 15～19、四樓 16、地下室 16。**加深其他地點時照這個寫法做同樣的測試**。
- **選擇卡**：`tests/cards.test.cjs`（18 項，v0.59.0 起；v0.60.0 加選路與開場）：同種子同卡同選項、結果表對照、藍色選項、牌庫（一般牌至少 30 張）、10 個選路格、路況、選路接回下一格、沒選的下一格不出現、張數 2～5 與加減條件、分段、條件牌上限、新卡守則（沒有病床點滴）、開場事件的時間與種類、先做的事改變事件、v2 地點沒有停留和繼續仔細翻、純運氣、舊存檔。
- **旅館**：`tests/hotel.test.cjs`（10 項，v0.60.0 起三樓 30 個種子×8 種路況×3 個出口走到底取最少值（選路不算次數、房間做一件就出門）：東側樓梯 16、電梯井 15、消防梯 15）。二樓以下照劇本走一般路線（隨機事件拿掉），會印出「一般路線的選擇次數」：一樓走廚房 16／走洗衣房 15、地下 21。另外測門（房卡）、窗（QTE）、瓦斯（gasZone、hboom）、地下污染區（發電機＋排風機）、大廳多一隻可以疊、前後連動、紅色菌絲、舊存檔轉換。
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
head.html、items.js、chars.js、story.js、story2.js、story3.js、story4.js、engine_a.js、engine_b.js、engine_c.js、engine_d.js、qte.js、net.js、ui.js、scr.js。每個檔的第一行是固定標題，`tools/split_index.py` 靠它切檔，**不要改**（清單在 tools/split_index.py）。全部共用同一個全域範圍：新函式、常數、CSS class（.tm、.sh 撞過）、節點代號、旗標都要先 grep。LV 代號 A～Z 已用完，新地點用兩個字母。長行改用 Python `assert s.count(舊)==1` 再取代。**不要在節點的 c 陣列中間插選項**（有程式用索引參照，例如 story4 的 `N.X.c[2]`；選項的「做過了」也是用索引記的），要加就 push 到最後。GPT 期間新增的主要函式：ROUTE／srMax（單向路線）、alZ（旅館合成一個警戒區 hotel）、karma（善惡值）、resistCheck（抵抗）、wound*（傷勢）、beginEncounterBgm／BGM_MIX（配樂）、evac*（撤離）、outMe（只給某位玩家看的文字）。v0.55.0 新增：alMul、alarmRaid、alarmJoin、alarmClear、ZRAIDW、deepLabel、sqKey、sqDone、deepSearchRes、srDeep、merchOk、evShop。v0.56.0 新增：hspAir、hspGen、hspLit、HSP_AIR、RESIST_EFFECTS.exhaust（engine_c）；v0.58.0 新增（engine_a）：NATIVE_RND、RSTATE、RNG（遊戲亂數）、seedKey、reseed（換子種子）、newSeed、urnd／upick（畫面用、不吃種子）；ui.js：saveKey、autoSave、dropSave（取代 saveGame）；G.sd 種子、G.stp 第幾張卡。v0.59.0 新增（engine_c 最後「選擇卡引擎」段落）：isV2、CKIND、bluWho、TBG、tbW、pickRes、subRng、dkSt、dkPrep、dkOn、dkList（DKL）、dkOk、dkW、dkDraw；選項欄位 tb（結果表）、blu（藍色選項，可以是陣列＝任一組）、vis（只管看不看得到的旗標，可以是陣列）、luck；節點欄位 slot、deck、w、dcond、cc、kind（cross 等，標題加「｜十字路口」）；ROUTE 欄位 v2、slots、road、deck；G.dk（on 開的格子、seen 抽過的、cc 條件牌張數、ret 牌庫卡做完接回哪裡）；路況旗標 rd_r302／rd_rlift／rd_rwin；outcome 的 r.stopBleed；startFight 的 prone0（第一隻開場倒地）；CSS .ch.blu。v0.60.0／v0.61.0 新增（engine_c 選擇卡引擎段落）：dkForkN、dkFork（第二個參數 n＝自動抽幾張）、forkCs（FKC）、forkTake、forkPick、OPEV、opSt、opNext；v0.62.0：EXS、EXANC、exSt、exDraw、exNext（走廊行動）、節點欄位 hub、選項欄位 exa、G.ex；走廊 AH、搜索卡 ASw／ASm／ASe、抽牌用 AXw／AXm／AXe 在 story4.js 最後「v0.62.0 三樓：四個基本行動」段落；v0.60／0.61 的選路格 AK1～AK10 不再用。節點欄位 fork（v0.61.0 路口，已不用）、seg（沒有 fork 的格子照順序自動抽同一段）、intro（AK1 開門那句）、peek、peek2、op、opev、dsub；選項欄位 opk、opout；G.dk.fk／skip／fc、G.op；三樓新卡、選路格 AK1～AK10、301 房間第 2 張 A1r、開場事件 AO2～AO5 在 story4.js 最後「v0.60.0 三樓選路翻牌＋開場不固定」段落（選路格的 t、c 是 getter，載入時 G 還沒宣告，用 GG()）。三樓 v0.59.0 內容在 story4.js「v0.59.0 選擇卡：旅館三樓試做」段落（抽牌格 AK1～AK5、309 小卡 A4h、牌庫 A3x＋AD1～AD8、條件牌 AE1～AE5、旅館通用 HG1～HG4）。v0.57.0 新增：gasZone（engine_c，取代寫死的 G.lv==='F'）、moreFoes 可以吃陣列、evCands 認節點的 at、LV.G 的 fx.dark／fx.toxic 是 getter；旅館四層在 story4.js 最後「v0.57.0 旅館四層」段落；醫院節點在 story4.js「醫院（v0.56.0 深地圖範本）」段落，ROUTE.O／OF／OB 與說明在 story4.js 最後。v0.34.0 以前的檔案內容說明在 CHANGELOG_3～5。

## 主人的設計決定
搬到 `docs/DESIGN.md`（2026-11-23，原文沒改）。開工不用整份讀，要改哪一塊就搜尋那一塊。新的定案寫在那份最上面那一節。

## 下一步與待辦
- 選擇卡改版：三樓主人玩過覺得對了，才做多人分開做＋私人卡、再轉換其他地點；三樓試做主人玩過覺得對了，才一個地點一個地點轉換。燃燒的旅館等改版後。
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
