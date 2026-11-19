# v0.38.0（Build 93）穿刺特效交接

基準：main 7bdbe032740fe90d7e95270abcc397dbf3287ca5／v0.37.2 Build 92。版本欄位以 index.html 的 ZC_VER 為準。

## 主人需求與美術
先讀取並實際查看既有 fx/slash-12.webp：銀白刀光、深紅飛濺、黑灰煙霧。新穿刺特效採相同配色與材質感，**不是藍色魔法能量**。畫面為由下往上直線刺擊，12 格，4 欄 × 3 列，檔案 fx/pierce-12.png（768×576；每格 192×192；索引色 PNG 保留 alpha），用於敵人卡的近戰穿刺命中。素材是本次新製作的攻擊特效，不是敵人立繪；原有斬擊素材不變。

## 接手技術
- index.html：沿用 SLASH_TIMING（12 格、共 755ms、命中第 6 格開始的 335ms 時點）及 renderSlashVfx 的 Canvas 疊圖、殘影、微震、縮減動態和清理。
- PIERCE_VFX.image 與 loadPierceVfx 載入獨立素材；SLASH_VFX.active 與 stateSeq 仍是本機共用演出／連線防過期工具。不加入 G、玩家、存檔欄位。
- 原本的刀聲只有斬擊播放。穿刺由 pierceAttack 在命中時透過原 snd('piercehit',.9,1200) 播一次（保留既有單人／多人音效通道）；另外送 t:'pierce' 給隊友播放動畫與命中快照，沿用接收佇列的順序及 SLASH_VFX.stateSeq。
- 穿刺生效判斷仍由 applyDmg 後的 x.lastDt==='pierce' 決定，範圍為近戰（含原技能、反擊、箱中靈）；弓弩、槍擊、斬擊、鈍擊與落空不新增特效。
- 素材載入失敗、無動畫支援、頁面隱藏或快轉時，沿用即時傷害更新；原本穿刺音效已送出，不重播。畫面離開／演出結束的清理機制沿用現行斬擊。
- 現行 slash-hit 專項仍走原本的 12 格斬擊，沒有替換原圖；原模組標題未更動。
- 配合新版本，僅調整工具 tools/evacuation-browser.cjs 與 tools/pierce-audio-browser.cjs 的預期版本；後者增加兩尺寸穿刺命中逐格檢查與實際截圖。未修改 tests/ 或 tools/split_index.py。

## 設計規則
沒有變更原設計規則：2038 年美國城市、10 天、QTE、劇情、判定、耐久、死亡、字型、角色立繪與存檔格式均不變。

## 驗收
雲端兩組既有 GitHub Actions 工作流程在 PR #13 執行；以工作流程最終結果為準。手機實機：待主人實機驗收。
