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

## v0.46.0 弓／弩發射音效（2026-11-22）

| 素材 | 作者 | 來源頁 | 授權及處理 |
|---|---|---|---|
| `sfx/crossbowshot.wav`（bow02.wav 衍生版本） | Erdie | https://freesound.org/people/Erdie/sounds/65734/ | CC BY 4.0：https://creativecommons.org/licenses/by/4.0/ ；主人提供原始WAV；120Hz高通、7.8kHz低通、900／1900Hz輕度等化、130ms後指數衰減、尾端淡出，縮為330ms；不變速、不變調。 |

2026-11-22（Asia/Taipei）核對作者原始頁面，明確標示Attribution 4.0。原始單聲道44.1kHz／16位元／0.749796秒。原始SHA-256：`004802859c7c89fc2129da0ae89e074cec4b7b594730397462699ff04b9b0754`；衍生SHA-256：`2eb69134e1b5959e582ef2c1160607f5c5cc7ba2cbc69f49d2691ca24bc2210c`。

改作用於弩的發射聲，亦依主人後續指示在弓放弦時疊加同一乾爽發射聲；命中仍使用既有bowimpact。遊戲內的「製作與授權」已補作者、來源、CC BY 4.0與改作說明，作者未替遊戲背書。已隨本版整合至正式index.html的Credits。處理可由 `tools/process-crossbow.py INPUT.wav OUTPUT.wav` 重現。


## v0.52.0 遭遇與戰鬥配樂

音樂來源與合法使用資訊（正式整合時請加入 Credits 與素材來源文件）

原始作品：Imminent Threat
原作曲及作者：Matthew Pablo
素材頁面：https://opengameart.org/content/imminent-threat
發表日期：2014-04-04（以來源頁面為準）
音訊授權：Creative Commons Attribution-ShareAlike 3.0 Unported（CC BY-SA 3.0）
授權全文：https://creativecommons.org/licenses/by-sa/3.0/

本交接包改作音檔：
- bgm_encounter.ogg / bgm_encounter.mp3：原始 INTRO Loop Var 2 前段重編成 8.067 秒可循環緊張音樂，調整音量、首尾交疊淡化及編碼。
- bgm_encounter_5s_optional.*：同一素材改成 5.04 秒短循環；正式專案二擇一。
- bgm_battle.ogg / bgm_battle.mp3：B2 64.54 秒戰鬥循環，混合原始 INTRO Loop Var 2、Beat A NO GTR Loop、Beat B BEAT ONLY Loop、INTRO LOOP Var，調整音量、等化、動態與首尾循環銜接。
- battle_entry_impact.*：先前 A1 合成衝擊聲，僅備用，非必要配樂。
- previews/*：示範音檔屬於編輯改作，僅供驗收，並非〈Evil〉原檔。

請保留上述作者、作品、來源、授權連結、改作說明和無背書聲明。
這些改作音訊依 CC BY-SA 3.0 分享；整個程式碼專案的授權另按原有授權文件。
現有 sfx/bgm.ogg / bgm.mp3（〈Evil〉）沒有收錄於本 ZIP，也沒有在此文件中聲稱其著作權或授權情況。

可直接放在 Credits 的文字：
「戰鬥與遭遇配樂改作自 Imminent Threat，原作者 Matthew Pablo；原始素材：https://opengameart.org/content/imminent-threat；授權 CC BY-SA 3.0：https://creativecommons.org/licenses/by-sa/3.0/；《零號病例》版本曾進行混音、剪輯、循環與音量處理。原作者未參與或背書本遊戲。」

正式網站只收錄 bgm_encounter 與 bgm_battle 共四檔；其餘備選保留於原交接包。

作者網站與署名：Music by Matthew Pablo — https://www.matthewpablo.com 。來源頁列明CC BY-SA 3.0，另依作者服務頁的署名格式保留網站連結（https://www.matthewpablo.com/services）。


## v0.53.0 一般戰鬥與激戰：Hitman

- 作品：Hitman；作者：Kevin MacLeod（https://incompetech.com）。ISRC：USUAN1300013。
- 官方素材來源：https://incompetech.com/music/royalty-free/index.html?Search=Search&isrc=USUAN1300013
- 官方系列頁與使用說明：https://incompetech.com/agent-section/
- 授權：Creative Commons Attribution 4.0（CC BY 4.0），https://creativecommons.org/licenses/by/4.0/ 。2026-11-23（Asia/Taipei）核對官方資料。
- 署名："Hitman" Kevin MacLeod (incompetech.com), Licensed under Creative Commons: By Attribution 4.0。
- 主人提供Hitman.mp3；SHA-256：005d6e28345e3c50a0715f5cf887c4cf02c3fa70910cdacc312bf348a3f2a647。
- 改作：sfx/bgm_hitman_battle.ogg／.mp3使用0～114秒；sfx/bgm_hitman_intense.ogg／.mp3使用114～194秒。分段、各20ms首尾淡化、轉檔；不變速、不變調、不正規化。工具：tools/process-hitman.py。
- 原曲前奏納入一般段，取消獨立遭遇曲；3:14以後收尾不納入循環。作者未參與或替本遊戲背書。
- 遊戲Credits已列作品、作者、來源、授權與改作說明。舊Imminent Threat檔案與署名保留，不繼續作為目前戰鬥配樂。


## 霰彈機械音效（v0.68.0，實錄音效）

泵動與填彈原本誤用左輪上膛聲 `revolverCock`，且開火後沒有拉機。以下為正式採用的專屬短音效：44.1 kHz 單聲道 MP3 96 kbps，裁切、40 Hz 高通與峰值正規化。Freesound 原始 WAV 需登入，取用該站 HQ 預覽再重編碼。候選由主人聽過後指定（2026-11-26）。

| 素材 | 作者 | 來源頁 | 授權及處理 |
|---|---|---|---|
| sgpump | TotallyPhilip | https://freesound.org/people/TotallyPhilip/sounds/755495/ | CC0；取 6.90–7.55 s 雷明頓 870 拉機（候選 pump-a） |
| sgshell | AugustSandberg | https://freesound.org/people/AugustSandberg/sounds/508746/ | CC0；《Pump Action Shotgun Reload》（Weatherby PA08），取約 3.28–3.70 s 一發管式填彈（候選 r870塞彈-3） |
| sgshellbr | DrinkingWindGames | https://freesound.org/people/DrinkingWindGames/sounds/789642/ | CC BY 4.0；《Load Shotgun 1》：Pushing a shotgun shell into the magazine tube；裁切約 0.20–0.89 s（候選 r870塞彈-2）。遊戲致謝已署名；授權：https://creativecommons.org/licenses/by/4.0/ |
| sgopen | sentryx86 | https://freesound.org/people/sentryx86/sounds/52202/ | CC0；取約 5.10–6.15 s 折開（候選 open-a） |
| sgclose | sentryx86 | https://freesound.org/people/sentryx86/sounds/52202/ | CC0；取約 13.08–13.55 s 較響機械聲（候選 close-a；來源未明示關膛，主人指定用較響的這一發） |

不再出貨的預覽切段：zer0_sol《Subsequent Shells》（原 sgshell 預設）、sentryx86 約 8.12–8.95 s 單管塞彈（原 sgshellbr 預設）。作者未替本作品背書。


## 左輪換彈音效（v0.70.0，實錄音效）

原本 Model 10、Model 500 與快槍手裝填都誤用左輪扳擊錘 `revolverCock`（該檔仍給十字弓上弦）。以下為正式採用的專屬短音效：44.1 kHz 單聲道 MP3 96 kbps，裁切、高通、降噪並閘至靜音。Freesound 原始 WAV 需登入，取用該站 HQ 預覽再重編碼。候選由主人聽過後指定（2026-11-26／2026-11-27）。

| 素材 | 作者 | 來源頁 | 授權及處理 |
|---|---|---|---|
| revopen | o_ciz | https://freesound.org/people/o_ciz/sounds/475420/ | CC0；《Revolver reloading_2》，取約 8.38–9.15 s 開巢 |
| reveject | o_ciz ＋ Yin_Yang_Jake007 | https://freesound.org/people/o_ciz/sounds/475420/ 、https://freesound.org/people/Yin_Yang_Jake007/sounds/406091/ | 皆 CC0。開巢錄音中取約 14.22–14.50 s 的金屬推桿，接上《Bullet Shells》約 0.68–1.58 s 黃銅彈殼互撞（不落地、無木板）。黃銅段高通 80 Hz。已棄用 craigsmith 675956／675625：復古庫含旁白與落地聲 |
| revshell | Guy_Personface | https://freesound.org/people/Guy_Personface/sounds/795317/ | CC0；《Revolver Loading – Remington 1875》，取約 2.22–2.90 s 一發入膛 |
| revclose | AugustSandberg | https://freesound.org/people/AugustSandberg/sounds/508744/ | CC0；《Revolver Reload》（Ruger GP100），取約 19.18–20.00 s 合上彈巢 |

作者未替本作品背書。

## Model 500 開槍聲（v0.70.0，實錄音效）

Model 10 仍使用既有 `revolver` 槍聲。Model 500 改用專屬素材 `m500`：44.1 kHz 單聲道 MP3 96 kbps；30 Hz 高通、降噪、峰值正規化，並以較長的自然淡出（二次對數）壓低戶外林間回聲，不使用 FFT 去混響。Freesound 原始 WAV 需登入，取用該站 HQ 預覽再重編碼。主人指定「開槍-長-自然淡出-2」（2026-11-27）。

| 素材 | 作者 | 來源頁 | 授權及處理 |
|---|---|---|---|
| m500 | dcsimon | https://freesound.org/people/dcsimon/sounds/139979/ | CC BY 3.0（https://creativecommons.org/licenses/by/3.0/）；《44 Magnum.wav》，戶外 .44 Magnum 實錄第三槍。遊戲致謝已署名。裁切、降噪、自然淡出與音量調整 |

作者未替本作品背書。


## 開發音效素材庫 1.0.0（2026-11-28，Asia/Taipei）

新增素材尚未接入遊戲。完整逐檔來源、作者、授權及上游署名見 [素材庫說明](../../audio-library/README.md)、[匯入紀錄](../../audio-library/imports.json)與[分類目錄](../../audio-library/CATALOG.md)。

- Darkworld Audio：164 檔，依隨包授權公開原檔，保留 [原始授權 PDF](../../audio-library/licenses/darkworld-survival.pdf)。不是 CC0。
- SilverIllusionist／Dylan Kelk：580233、580232、470585、470587、685363，CC BY 4.0；原檔未修改。最後一檔依作者要求署名為「Brutal Impalement 2」by SilverIllusionist，來源 https://freesound.org/people/SilverIllusionist/sounds/685363/ 。其餘逐檔來源與兩個斷首音效的上游署名保存在匯入紀錄。
- ihitokage：Sword sheathing，Freesound 395371，CC0 1.0；原檔未修改。
- Steel & Impact（breathinghuman）：50 檔只建索引；作者條款禁止將獨立原檔或改作當音效庫再散布。
- Zombie Massacre（Dustin Crenna／DCAudio；TerrorByteGames 發布）：198 檔只建索引；獨立素材庫再散布權未確認。
- Deadly Kombat Free（Daniel SoundsGood）：50 檔只建索引；作品使用須保留作者的署名要求，再散布權未確認。

既有遊戲音效只引用原路徑，不將既有作品授權擴張為獨立素材再散布許可。作者未參與本專案或替本專案背書。


## 重新上傳驗收補入兩檔（2026-11-28，Asia/Taipei）

- [Skull Split #1](https://freesound.org/people/SilverIllusionist/sounds/833639/) 與 [Skull Split #2](https://freesound.org/people/SilverIllusionist/sounds/833640/)：作者頁均列 CC BY 4.0（https://creativecommons.org/licenses/by/4.0/）。
- 逐檔署名：`"Skull Split #1" by Dylan Kelk/SilverIllusionist (Freesound)`、`"Skull Split #2" by Dylan Kelk/SilverIllusionist (Freesound)`。來源頁沒有列其他上游來源；不將此當成已獨立驗證來源真實性的證明。
- 兩檔皆保留主人提供的 WAV 原始位元，未剪輯、轉檔或調整音量；未接入遊戲，未逐檔人工試聽。作者未參與或替本遊戲背書。
- 原有五個 SilverIllusionist 音檔與 ihitokage 音檔的授權、作者及已知上游署名保留；本次沒有重新查證全部上游或補足既有音效的授權缺口。
