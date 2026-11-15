# 零號病例 v0.21.9 音效整合（PR 待合併）

基準：main 8616f3397709a89b84e893c77afc19efbd3a9787／v0.21.8，主頁blob e8360690943c790ee350dca6aa7708eebb5403cb，與v4完全一致。只使用v4內核心修補一次。分支feature/audio-v4；main與正式站保持原樣。

## 新增接線

| ID | 觸發 | 停止與防重複 |
|---|---|---|
| glassbreak | A3x販賣機成功；A4消防箱成功及確實碎裂的失敗 | 行動結果一次，只有裂縫不播 |
| woodknock | A2房門遭感染者敲擊 | 進入節點一次，重繪與讀檔不重播 |
| woodimpact | A2抵門失敗、貓眼失敗、躲浴室成功的房門撞開 | 僅結果一次，不用於材質不明的普通門 |
| dryfire | 真正槍擊連射途中彈匣耗盡的空擊分支 | 不播正常槍聲或彈殼；原本空槍改槍托攻擊的玩法保持不變 |
| genstart | G2 power、PP3 ppgen的首次成功啟動 | 已啟動或失敗不重播 |
| genloop | G2且power、PP3且ppgen | 本機唯一loop；離房、關機、結束、靜音、背景時停止；回房恢復、不播啟動 |
| firealarm | smoke事件 | 最多9秒；拆除成功、離開事件、靜音、結束、背景時停止，不因full/state重送重播 |

G2成功會前往G2x，因此不將運轉聲延伸整個地下層。PP5t停的是汽輪機，不能清除柴油機ppgen。genloop先用OGG，失敗回退MP3。firealarm與genloop全部載入失敗時保持安靜並記錄failed，不假造另一種機械聲。

## 音量及既有修正

素材與tone/noise合成音共用master gain .86及壓縮器。分類初值：介面.56、移動.65、擬音.78、戰鬥.92、系統.8、環境.6；槍聲、爆頭、警報及木門另有trim。這是保守初值，聽感待驗收。dryfire與woodimpact的解碼峰值0dBFS，檔案不重剪，播放時衰減及保留餘量。

- 合成聲遵守v音量參數，零音量不再被轉回1。
- 所有SFX與已排程合成音可停止；BGM維持獨立開關。
- fal/falReload/mp5/mp5Reload/rifle/bolt失敗時使用原有合成備援。
- 已瞄準後首發槍擊暴擊才用headshot；普通暴擊、近戰、後續連發不誤播。
- 旅館已知跨樓層使用stairs；其餘跨區使用step，背包操作不額外播放步行聲。
- casing.mp3、dooropen.mp3、doorclose.mp3原檔blob完全不變。

## 同步及生命週期

一次聲仍經snd→E→隊友pump。循環依當前節點、旗標與事件visit校對；重送狀態不疊loop。載入期間離場用token取消；失敗後可關開音效重試。隊友循環會等本機啟動聲結束，避免佇列延遲或時鐘差造成重疊。背景忽略新SFX，回前景只恢復當前環境。

## 測試與限制

- node --test tests/*.test.cjs：50項通過（原32＋18音效），含12,672個既有數值對照。
- 真實遊戲JS於Node VM執行，DOM與音訊節點使用替身；不是實機播放試聽。
- node --check通過；附件核心修補5項原測試通過。
- 全52份音檔ffmpeg解碼通過，格式、長度、峰值見ASSET_VALIDATION.json。
- 46種預載ID以模擬fetch/AudioContext驗證載入及失敗回退，不能宣稱瀏覽器網路載入已通過。
- 本機Chromium遭socket／ptrace權限阻擋，附件browser_audio_smoke.py未完成執行。
- Android Chrome、iPhone Safari、耳機主觀音量／爆音、loop接縫、真實多人跨裝置及掉線仍待驗證。
- Claude原始開發專案沒有可存取URL或檔案入口，未同步Claude端。請依此分支同步，不要再套v1/v2/v3修補器覆蓋。

## 合併建議與缺音

先保留PR，完成手機試聽及雙人驗收後再合併。授權依v4記錄保留六位作者、CC0與Freesound來源，見LICENSES_AND_ORIGINS.md；不表示既有素材的授權全數重新查核。

仍缺／待核定：踩碎玻璃、水泵／送水泵啟動、無線電雜訊候選授權與場景、遠方槍聲／直升機／都市底噪、不同地面腳步。瞬間碎玻璃、火警、柴油機、空擊、木門已接入，不再列為缺檔。本次不擅自接入其他對話新增的聲音。
