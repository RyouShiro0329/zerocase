# 零號病例：開發音效素材庫

素材庫版本 **1.0.0**。建立基準：main `e414cb8`，遊戲 **v0.71.1／Build 148**。這是供主人、Claude 與 GPT 開發查找的索引；沒有新增遊戲音效觸發、改播放音量或修改預載。

## 1. 查找與取用

### 1.1 入口

- [完整分類目錄](CATALOG.md)：適合手機在 GitHub 瀏覽，列出檔名、用途、規格、使用狀態、作者與授權。
- [完整 JSON](catalog.json)：供程式搜尋，含來源、SHA-256、秒數、取樣率、位元深度、聲道、來源包與程式引用位置。
- [CSV](catalog.csv)：UTF-8 BOM，手機試算表可開啟及篩選。
- [逐檔雜湊](SHA256SUMS.txt)／[清單](MANIFEST.json)。
- [來源與授權](../docs/audio/LICENSES_AND_ORIGINS.md)／[交接與驗收](../docs/audio/LIBRARY_HANDOFF.md)。

### 1.2 使用流程

#### 1.2.1 已收錄原檔

在目錄找到合適聲音，先看來源與授權，從「檔名／取用位置」連結取得原檔。用途多依檔名整理，未完成逐檔人工試聽，接入前仍需試聽並請主人確認聽感。

#### 1.2.2 僅索引的素材

目錄會連到官方素材頁；依 `original_archive` 與 `original_path` 找檔案。原始上傳包仍由主人保管。公開 GitHub 沒有這些音檔，後續開發者可能需要從官方下載，或由主人再次提供。允許用在遊戲不等於允許重新發布素材庫。

#### 1.2.3 接入遊戲

本次全部新增素材是備用，尚未指定遊戲情境。之後由主人指定用途再處理格式及音量，將採用版本放到 `sfx/`，依當時的開發規則更新 Credits、來源、測試與遊戲素材雜湊清單。不要整包加入 `SFILES` 或預載。

## 2. 收錄範圍

| 來源 | 音檔筆數 | 公開 GitHub 處理 |
|---|---:|---|
| 原倉庫 `sfx/` | 113 | 全部索引；原檔、路徑及使用狀態保留 |
| Darkworld Survival | 164 | 原檔收錄，按原始十類分層；附原始授權 PDF |
| SilverIllusionist／ihitokage | 6 | 原檔收錄；CC BY 4.0／CC0，逐筆保留作者及來源 |
| Steel & Impact | 50 | 僅索引；條款禁止獨立素材庫再散布 |
| Zombie Massacre | 198 | 僅索引；獨立素材庫再散布權待確認 |
| Deadly Kombat Free | 50 | 僅索引；獨立素材庫再散布權待確認 |
| 合計 | **581** | **新增 170 個音檔、298 筆僅索引** |

Zombie Massacre 的 198 檔含 99 組 16／24 位元版本。它們是對應版本，並非逐位元相同檔案，不合併或刪除。全庫目前沒有 SHA-256 完全相同的音檔。MP3／OGG 替代格式亦各自保留，不把檔案數當成不同聲音種類數。

即時合成、組合槍聲與弓箭組合名稱另列於 JSON 的 `generated_sounds`，沒有憑空製造獨立音檔。它們不計入上表的 581 個實體音檔。

### 2.1 資料夾

- `files/darkworld-survival/`：衣物、戰鬥、破壞、環境、裝備、飲食、腳步、人聲與動作、醫療、工具；實際路徑保留原作者英文分類及檔名。
- `files/freesound/`：六個原始 WAV／OGG，保留 Freesound ID 與原始檔名。
- `licenses/darkworld-survival.pdf`：上傳包內原始授權，未改寫。
- `imports.json`：本批十個上傳檔案與解壓項目的追溯紀錄；四個壓縮包保留檔名、大小及 SHA-256，未把原始壓縮包再次公開。

### 2.2 欄位的意思

| 欄位 | 意義 |
|---|---|
| `repository_path` | 倉庫內實際音檔路徑；null 代表只建索引，GitHub 沒有該原檔 |
| `use_status` | 程式目前引用／既有備用／新增備用；引用是靜態資料掃描，不代表每局都播放 |
| `rights_status` | 新素材的公開再散布判定，或既有來源查核完整度 |
| `source_url`／`source_urls` | 原作者來源；沒有證據就標缺口，不以檔名猜作者 |
| `source_evidence` | 授權或來源紀錄的倉庫位置 |
| `variant_group` | Zombie Massacre 16／24 位元的對應鍵 |
| `sha256` | 原始檔案內容完整性，不是音訊聽感去重 |

## 3. 授權與署名

### 3.1 本批新增素材

Darkworld Audio 採自訂授權，不能改標 CC0；附包授權允許複製、移交與公開散布，不得販售獨立音效或冒認作者。`Designed` 檔案為設計音效，不能宣稱是對應槍械或事故的實錄。

SilverIllusionist／Dylan Kelk 的五檔依原頁 **CC BY 4.0**：

- [Decapitation (earlier blood spurt).wav](https://freesound.org/people/SilverIllusionist/sounds/580233/)
- [Decapitation (more gory).wav](https://freesound.org/people/SilverIllusionist/sounds/580232/)
- [Headshot 1.wav](https://freesound.org/people/SilverIllusionist/sounds/470585/)
- [Heavy Impact](https://freesound.org/people/SilverIllusionist/sounds/470587/)
- [Brutal Impalment 2](https://freesound.org/people/SilverIllusionist/sounds/685363/)；作者要求署名使用「Brutal Impalement 2」。

授權：[CC BY 4.0](https://creativecommons.org/licenses/by/4.0/)。原檔未裁切、混音、轉檔、變調或調整音量。兩個 Decapitation 的作者頁另揭露上游音效，逐筆作者與原頁保留在 `imports.json` 的 `upstream_credits`；本次未重新驗證全部上游。本次 Headshot 1 與遊戲既有 Credits 的 Headshot 2 不同，不互相取代。

[Sword sheathing — ihitokage](https://freesound.org/people/ihitokage/sounds/395371/) 採 [CC0 1.0](https://creativecommons.org/publicdomain/zero/1.0/)，原檔未修改。以上作者未參與或替本遊戲背書。

### 3.2 既有音效

沿用既有音檔，不重複複製或搬動。能從 `docs/audio/` 對應到的來源轉錄至索引；無逐檔證據者標「待查核」，不將舊來源缺口冒充已核准。部分素材僅允許用在作品中（例如既有 Mixkit 血肉聲），保留既有使用不代表准許另做通用素材庫再散布。

## 4. 維護

在倉庫根目錄執行：

```bash
python tools/build_audio_library.py
python tools/build_audio_library.py --check
sha256sum -c audio-library/SHA256SUMS.txt
```

建置工具只讀取遊戲與音檔，重建開發目錄；不改 `index.html`、`sw.js`、`assets-manifest.json` 或測試。需要 Python、Node 與 ffprobe。匯入新包時先逐一核對授權，補齊 `imports.json`、依法允許收錄的原檔及來源，再重建。

遊戲升版、引用清單或既有音檔改變後需重建；`--check` 會辨識過期的索引。既有缺口待取得可核對證據後逐筆補齊，不直接推定授權。
