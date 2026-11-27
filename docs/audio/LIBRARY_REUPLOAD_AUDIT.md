# 音效素材庫：十二個重新上傳來源獨立驗收

紀錄時間：2026-11-28T03:37:44+08:00（Asia/Taipei）。遊戲維持 v0.71.1／Build148。

## 1. 結果與差異

本次實收 12 個來源：4 個壓縮包與 8 個單獨音檔。獨立列舉得到 470 個音檔，全部完整解碼；37 個目錄、1 個授權 PDF、1 個素材清單 PDF 另列，不計為音檔。未發現未識別或無法讀取的項目。

指定原候選 a31a02b 相對這次十二個來源缺少兩檔：833639（Skull Split #1）、833640（Skull Split #2）。它們是這次比原十來源多出的新檔；不把原統計 468 強行當成新批次的答案。首次缺漏保留於 reupload-before，補入後逐檔重跑於 reupload-after。

| 來源 | 音檔 | 公開原檔 | 僅索引 |
|---|---:|---:|---:|
| 基準既有 sfx | 113 | 113 | 0 |
| Darkworld Survival | 164 | 164 | 0 |
| Freesound（七個 SilverIllusionist、一個 ihitokage） | 8 | 8 | 0 |
| Steel & Impact | 50 | 0 | 50 |
| Zombie Massacre | 198 | 0 | 198 |
| Deadly Kombat Free | 50 | 0 | 50 |
| 合計 | **583** | **285** | **298** |

新匯入來源 470 檔；新增公開原檔 172 檔。最新 main 仍等於指定基準 e414cb8，本批基準與最新 main 沒有另增素材的差異。

## 2. 十二個來源原檔

| 實收檔名 | 大小（位元組） | SHA-256 |
|---|---:|---|
| 395371__ihitokage__sword-sheathing.ogg | 55938 | `ce95d75c13ac4b9bc59fa663acf2cb77f5adb287983521b84f4c2aad3ebcbff0` |
| 470585__silverillusionist__headshot-1.wav | 270160 | `d6cb07ca0fa6bd615820012af321e1c1eb18d9fb0ffe9a0a6d92beca08b734fd` |
| 470587__silverillusionist__heavy-impact.wav | 132344 | `6e5076efccd177bc82a0d0650638da8bd36d61300d2af314401d2b2d9b6e1a95` |
| 580232__silverillusionist__decapitation-more-gory.wav | 1841228 | `307e826730dc51f1262578f6ff7aad3b4ebb01186ae8ec7e5e93f338fde6054e` |
| 580233__silverillusionist__decapitation-earlier-blood-spurt.wav | 1719948 | `605d704e5c5d9d879f47655746f03875f26e26aae0c6cba5dde8ca030ae59464` |
| 685363__silverillusionist__brutal-impalment-2.wav | 176444 | `88f06678add3c512e4396b6246e0cbc5b0b8999718c5239a6bc5c32ca05b2a82` |
| 833639__silverillusionist__skull-split-1.wav | 474124 | `ef186f3fe63f42217220594a51b95b8cf24fd9af106c1106625d9802aafc7f31` |
| 833640__silverillusionist__skull-split-2.wav | 506884 | `94b265119b904b3c402a133c12ffd7feb60b0fff12f315669ff602f189372902` |
| Darkworld Audio - Survival Effects [Free].zip | 54135888 | `a567360529d429535a88fab998e75cfe2d9a25f934661a02eb5533abc7179390` |
| Deadly Kombat Free version.rar | 16520211 | `ea481e490e34679861a256316f796646fac11714e49f7573d5eede9944a6b6d1` |
| Zombie_Massacre_Sound_Effects_Pack_01.zip | 87413530 | `66de1104e01d1b04417b7567d1f269534833dd4e5d2a8bdd4fe31fce0e0b8044` |
| steel-and-impact-50-melee-combat-sfx-WAV.zip | 9859303 | `34d502b36644554b7095abe1e49c48171a74ed7bbd20841bd7076cdd620ce63c` |

四個來源包全讀成功；八個單檔全讀成功。檔名僅用來列示，來源包以內容 SHA-256 對應既有紀錄，單檔也核對大小與 SHA-256。

## 3. 修正後明確問題清單

| 類型 | 筆數 |
|---|---:|
| 原始來源有、索引沒有 | 0 |
| 索引有、來源找不到 | 0 |
| 大小或雜湊不符 | 0 |
| 公開原檔缺少、多出或受限原檔公開 | 0 |
| 重複 ID／路徑碰撞 | 0 |
| 解碼失敗 | 0 |
| 無法核對及未知項目 | 0 |
| 音訊規格不符 | 0 |
| 既有 sfx 被更動或未建索引 | 0 |
| CSV／JSON／MANIFEST／雜湊清單／相對連結不一致 | 0 |
| Zombie Massacre 位元版本配對不符 | 0 |

首次未修正結果有 2 筆來源未索引，其餘問題 0 筆；首次結果完整保留，不以最後的零筆覆蓋。

## 4. 驗收方法與證據

- 獨立工具 [audit_audio_sources.py](../../tools/audit_audio_sources.py) 不匯入 build_audio_library.py，直接由 libarchive 讀取上傳原包的全部成員，逐檔計算大小、SHA-256、Git blob SHA；使用 ffprobe 讀規格，ffmpeg 以 -xerror 與嚴格錯誤模式完整解碼全部 470 檔。
- [來源列舉](library-qa/reupload-after/source-inventory.json)：含所有目錄、音檔與非音檔。Darkworld 授權 PDF 與倉庫副本逐位元相同；Deadly Kombat 的 File List PDF 另以 pdftotext 成功讀取，列 50 檔，沒有擅自公開該 PDF 或壓縮包。
- [逐檔對照](library-qa/reupload-after/comparisons.json)：來源原始路徑、索引 ID、大小、SHA-256、Git blob SHA、倉庫取用位置與解碼規格。
- [既有 sfx](library-qa/reupload-after/baseline-sfx.json)：基準 113 檔逐一保留、各自一筆索引。
- [保護範圍](library-qa/protected-files.json)：263 個既有遊戲、sfx、測試、qa 與 workflow 檔案 Git blob 完全相同；沒有修改 guard、版本、遊戲行為、音量、預載、快取。
- [99 組位元版本](library-qa/reupload-after/zombie-pairs.json)：由來源檔名末端編號獨立正規化，包含 01／1_24_bit；各組保留 16／24 位元兩檔、秒數差小於 0.002 秒。此為命名與規格配對，不宣稱已人工聽辨。
- [相對連結](library-qa/reupload-after/relative-links.json)：README、分類目錄及來源交接中的相對檔案連結均存在；CSV 逐欄對照 JSON，MANIFEST 與 SHA256SUMS 對照全部 285 個公開音檔。
- 全倉庫追蹤檔案依內容 SHA-256 掃描，沒有將 298 個受限音檔換名公開，也沒有公開四個原始壓縮包。
- [指定候選遠端核對](library-qa/original-remote-tree-check.json)：GitHub 完整遞迴樹未截斷，851 個遠端 blob 與本機 a31a02b 全集合及 SHA 相同；本機 tree efd04a54573ed39b136b4d02bced2784e37df897。修正後候選的最後遠端核對記錄於 PR #84。

## 5. 授權與聽感限制

Darkworld 依隨包自訂授權處理，保留原 PDF，未改標 CC0。兩個 Skull Split 的作者頁本次另查核 CC BY 4.0 與作者指定署名，八個 Freesound 原檔均未剪輯、轉檔或調整音量。Steel & Impact、Zombie Massacre、Deadly Kombat 沿用僅索引，沒有擴張再散布許可。

未逐檔人工試聽；可完整解碼只證明音訊可讀，不代表聽感合格。分類主要依檔名與原分類推定。既有來源授權缺口與已知上游來源未全面重新查證；全部原作者未參與或替本遊戲背書。Android：待主人實機驗收。

## 6. 測試、PR、合併與部署

- 修正後 FAST：[完整報告](library-qa/reupload-fast.json)，511 項＝508 通過、0 失敗、3 個既有暫緩；防弱化通過。FAST 略過的七個瀏覽器等階段均為未測試（原因：FAST 模式不跑），不算通過。
- 原候選三個 GitHub run 均已通過：完整測試 46054600571、傷害飄字 46054600590、素材載入 46054600626。下載 artifact 後核對 SHA-256 與其內報告，摘要與報告在 [原候選狀態](library-qa/original-github-status.json)、[原候選報告](library-qa/original-ci/full-report.json)。
- 原完整測試報告記的是 PR 測試合併 commit e766efda378e250f5e29aa638fe9242cdfd0f7bd；GitHub run 的 head_sha 為 a31a02b。不可混稱新候選已跑完。其完整階段及自我驗收均通過，原暫緩 3 項保留。專項 run 的正式站工作因 PR 事件略過，不算正式站驗收。
- 修正後推送仍使用 feat/audio-library 與 PR #84；新候選 CI 另查核，當下狀態與最後遠端比對見 PR。
- PR 未合併；本次沒有合併或部署。遊戲維持 v0.71.1／Build148。合併待主人核准。

## 7. 可接續進度

本次已完成原始來源獨立重建、補入兩檔、重建索引、完整來源解碼、基準保護、第一次與修正後報告保存、FAST。接手時先讀本報告與 LIBRARY_HANDOFF，再重新查詢 PR #84 head/main 和最新 CI。不要重傳已一致的原檔、不改測試基準、不刪首次失敗。

重跑：`python tools/audit_audio_sources.py --sources /實際來源資料夾 --out /新報告資料夾`。依賴 Python、libarchive-c、系統 libarchive、ffmpeg、ffprobe；原始受限素材由主人保管，未公開於 GitHub。
