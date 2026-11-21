# 來源及授權（2026-11-15 更新）

## 第二批素材

| 素材 | 作者 | 來源頁 | 授權及處理 |
|---|---|---|---|
| glassstep | LukaCafuka | https://freesound.org/people/LukaCafuka/sounds/757830/ | CC0；裁切、音量調整 |
| waterpipe | HenKonen | https://freesound.org/people/HenKonen/sounds/797674/ | CC0；裁切、循環交疊、音量調整 |
| waterpump／pumpmix／pumpstop | unfa | https://freesound.org/people/unfa/sounds/221551/ | CC0；裁切、循環交疊、與上述管線混合、音量調整 |
| radiostatic | harrisonlace | https://freesound.org/people/harrisonlace/sounds/812929/ | CC0；裁切、淡入淡出、音量調整 |
| radio01–radio27 | VoiceBosch | https://voicebosch.itch.io/radio-soldier-announcer-audio-pack | CC BY-SA 4.0；由主人提供的同名 27 句 MP3 切段，降低一個半音、保留原速與共振峰、調整音量；本次衍生音檔同採 CC BY-SA 4.0 |

人聲授權連結：https://creativecommons.org/licenses/by-sa/4.0/ 。作者同時於 Pixabay 提供同名合輯：https://pixabay.com/sound-effects/film-special-effects-radio-soldier-announcer-pack-197724/ 。本次以作者官方音效包的 CC BY-SA 4.0 條件標示衍生錄音，保留作者與來源，未宣稱對錄音擁有原創權。作者未替遊戲背書。未使用聲音複製或模型訓練。

`D_GACHA.WAV` 僅有使用者提供的檔名，尚未確認可公開使用之授權；不放入 GitHub 或交付發布素材。遊戲改用自行程式合成的鎖門卡榫聲。之後取得可核對來源再替換。

## 第一批素材

六個素材上傳的原始檔名已包含 Freesound ID 和部分作者資訊；以下逐一核對來源頁面標示。下列是來源頁面授權紀錄，**不是對音訊內容著作權真實來源的法律保證**。建議在遊戲 Credits 中一併保留作者及來源。

| 聲音 | 作者 | Freesound ID | 來源 | 頁面授權 |
|---|---|---:|---|---|
| window breaking | RangoAnimations | 613879 | https://freesound.org/people/RangoAnimations/sounds/613879/ | CC0 |
| Fire Alarm | simonjeffery13 | 792484 | https://freesound.org/people/simonjeffery13/sounds/792484/ | CC0 |
| Small Diesel Generator | jameswrowles | 516759 | https://freesound.org/people/jameswrowles/sounds/516759/ | CC0 |
| 9mm Handgun Being Dry Fired | serøutōnin--deprivəd | 674568 | https://freesound.org/people/ser%C3%B8ut%C5%8Dnin--depriv%C9%99d/sounds/674568/ | CC0 |
| Echo Bang.m4a | RoyalRose | 560295 | https://freesound.org/people/RoyalRose/sounds/560295/ | CC0 |
| Kicking/Forcing/Breaking Wooden Door | qubodup | 160213 | https://freesound.org/people/qubodup/sounds/160213/ | CC0 |

**備註：** qubodup 頁面在描述中提及作者個人頁面的「CC BY attribution requirements」，但音效頁面另明確標示本檔為 **Creative Commons 0**。以檔案頁面標示為核對依據，仍建議 Credits 自願列出作者名稱以避免來源資訊流失。

這六個新增素材的授權核對不代表**既有 39 個音效**全部已完成來源及授權審查；原本 Credits 記載的其他素材仍應個別查核。


## v0.37.2 穿刺命中音效（2026-11-20，Asia/Taipei）

| 素材 | 作者 | 來源頁 | 授權及處理 |
|---|---|---|---|
| `sfx/piercehit.mp3`（Sword Stab Body Hit） | -GeorgeDiamond- | https://freesound.org/people/-GeorgeDiamond-/sounds/718259/ | CC BY 4.0：https://creativecommons.org/licenses/by/4.0/ ；主人提供原始 WAV，轉為 MP3（libmp3lame，品質 2），保留完整 1 秒與立體聲，不裁切、不變速、不變調；執行時套用戰鬥音量與 0.8 增益修整。 |

原始檔名：`718259__georgediamond__sword-stab-body-hit.wav`。原始規格：48 kHz、24 位元、立體聲、1 秒。2026-11-20 核對作者來源頁，明確標示 Attribution 4.0。作者未替本遊戲背書。

用途：玩家近戰攻擊實際造成穿刺傷害的命中聲，包含穿刺武器、反擊與箱中靈・撕咬；弓、弩、槍擊、斬擊、鈍擊與落空不套用。沿用既有音效同步事件；素材失敗回退既有合成受傷聲。原始 WAV 不加入遊戲載入清單，MP3 不截斷尾音（播放上限 1,200ms）。

## v0.44.0 鈍擊命中合成音效

| 素材 | 作者 | 來源網址 | 授權及處理 |
|---|---|---|---|
| `SYN.blunthit`（即時合成，無外部錄音） | OpenAI ChatGPT，為《零號病例》本次製作 | https://github.com/RyouShiro0329/zerocase/blob/main/index.html （搜尋 `blunthit`） | 本次原創合成配方採 CC0：https://creativecommons.org/publicdomain/zero/1.0/ ；白雜訊濾波、135→43 Hz 低頻衰減與短促碎裂聲，全長約 260ms。 |

撞擊聲在第 4 格開始（90ms）播放；沿用戰鬥音量、總音量、靜音、背景暫停與音源停止管理。不使用授權不明的既有拳擊錄音；本次不新增音檔下載，也不更換既有素材。

## v0.44.1 恢復既有鈍擊音效

依主人指示，鈍擊命中恢復使用原專案既有的 `sfx/fist.mp3`（約 0.81 秒），音量維持原本的 0.9 戰鬥音量參數；未裁切、變速、重新編碼或更換音檔。SHA-256：`e820c711f82a67c246ac299338c8248fa838a7f5626f12b9733fef21fc98939f`，與 v0.43.3 基準一致。

上方 v0.44.0 合成聲說明保留為歷史紀錄；該合成聲已移除，不再用於目前遊戲。原 `fist` 素材的既有來源與署名沿用原專案紀錄，本次未新增外部音訊素材，也未把該既有錄音改標為 CC0。

## 2026-11-22 弩發射音效預覽（尚未部署）

| 素材 | 作者 | 來源頁 | 授權及處理 |
|---|---|---|---|
| `preview/bow/crossbow-dry.wav`（bow02.wav 衍生版本） | Erdie | https://freesound.org/people/Erdie/sounds/65734/ | CC BY 4.0：https://creativecommons.org/licenses/by/4.0/ ；主人提供原始WAV；120Hz高通、7.8kHz低通、900／1900Hz輕度等化、130ms後指數衰減、尾端淡出，縮為330ms；不變速、不變調。 |

2026-11-22（Asia/Taipei）核對作者原始頁面，明確標示Attribution 4.0。原始單聲道44.1kHz／16位元／0.749796秒。原始SHA-256：`004802859c7c89fc2129da0ae89e074cec4b7b594730397462699ff04b9b0754`；衍生SHA-256：`2eb69134e1b5959e582ef2c1160607f5c5cc7ba2cbc69f49d2691ca24bc2210c`。

改作用於弩的發射聲，弓不變；命中仍使用既有bowimpact。預覽內的「製作與授權」已補作者、來源、CC BY 4.0與改作說明，作者未替遊戲背書。正式index.html尚未修改，正式整合時必須將此署名一併加入Credits。處理可由 `preview/bow/process-crossbow.py INPUT.wav OUTPUT.wav` 重現。
