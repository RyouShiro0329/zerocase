# 零號病例 音效對應表（待主人審查）

遊戲版本 v0.67.1／Build 141。這份由 `node tests/helpers/sfx-map.cjs --md docs/audio/SFX_MAP.md` 產生（QA 升級 PR-D：QA-16）。
「聽起來是什麼」是 Claude 依檔名和遊戲裡的用法整理的，**還沒經過主人審查**。這次**只列缺口，沒有換任何音效**。

## 一、缺口（等主人決定）

- **隨機意外**（10 種）：發生當下沒有聲音 7 種：cart、vent、sign、truck、ac、pipe、crow；躲開時沒有聲音 9 種：tube、cart、floor、vent、window、sign、ac、pipe、crow；受傷聲沒標：（沒有）
- **敵人招式**（31 招）：有傷害、沒標受傷聲（播預設 claw）：（沒有）；開槍卻沒有槍聲：（沒有）
- **劇情扣血**：86 筆扣血結果，沒標受傷聲（播預設 hurt）的 0 筆
- **沒有備援的音效檔**（檔案載入失敗時這一下沒有聲音）：短音效 7 個：glassbreak、firealarm、genstart、woodknock、woodimpact、glassstep、pumpstop；循環、無線電、雷聲 11 個（設計上沒有備援，持續聲會暫停）：rain_indoor_loop、rain_outdoor_loop、thunder_distant_01、thunder_distant_02、genloop、waterpipe、pumpmix、radiostatic、radio02、radio23、radio24
- **播得出來、但遊戲沒有用到的名稱**：farshots2
- **素材資料夾裡有、沒有被引用的音檔**（32 個）：airraid_event.mp3、bgm_battle.mp3、bgm_battle.ogg、bgm_encounter.mp3、bgm_encounter.ogg、goliath.mp3、goliath_loop.mp3、radio01.mp3、radio03.mp3、radio04.mp3、radio05.mp3、radio06.mp3、radio07.mp3、radio08.mp3、radio09.mp3、radio10.mp3、radio11.mp3、radio12.mp3、radio13.mp3、radio14.mp3、radio15.mp3、radio16.mp3、radio17.mp3、radio18.mp3、radio19.mp3、radio20.mp3、radio21.mp3、radio22.mp3、radio25.mp3、radio26.mp3、radio27.mp3、waterpump.mp3
- **頭尾空白**：開頭空白超過 0.3 秒：revolverCock 約 0.63 秒、firealarm 約 1.0 秒、woodknock 約 0.56 秒；結尾空白超過 0.5 秒：zipper、revolverCock、revolver、mp5、firealarm（瀏覽器實測，v0.67.1）。交接文件另記：無線電台詞每句開頭約 0.6 秒安靜、piercehit 尾端 0.47 秒
- **發電機淡入**：genstart 前 1 秒低於 −50 dBFS（淡入），按下去一秒後才聽得到
- **同一下播兩次**：戰鬥 QTE（撲倒、飛撲）躲開時，QTE 本身播一次閃開聲（whoosh），qteHit 又播一次，兩聲疊在一起（瀏覽器實測）
- **待主人試聽**：合成音「失敗、大失敗、落空」（ng、fumble、miss）與強光照射用 click：交接文件記「等主人試聽再調」
- **iOS**：iOS Safari 循環音（雨聲、發電機、抽水機）接縫：沒有測（這裡沒有 iOS 瀏覽器）

## 二、隨機意外的聲音

| 意外 | 描述 | 發生時 | 躲開 | 受傷 |
|---|---|---|---|---|
| tube | 頭頂傳來「啪」的一聲。早就鬆脫的吊架撐不住了，天… | glassbreak | — | thud |
| cart | 走廊另一端傳來撞擊聲。一名感染者撞上停在牆邊的推… | — | — | thud |
| floor | 腳下的地板突然往下一陷。泡了水的木板底下早就爛了… | woodimpact | — | thud |
| vent | 牆上那個大型通風口的鐵網「哐」地被撞開。有東西順… | — | — | claw |
| window | 外面傳來幾聲槍響，旁邊的窗戶整片爆開——… | farshotsglass | — | （事件音效就是這一下） |
| sign | 頭頂傳來金屬斷裂的聲音。一塊招牌的固定架鏽斷了，… | — | — | thud |
| truck | 引擎的怒吼從轉角傳來。一台貨車失控衝上人行道，駕… | — | glassbreak | thud |
| ac | 樓上一台窗型冷氣連著鏽掉的支架，從窗框裡滑了出來… | — | — | thud |
| pipe | 旁邊臨時搭的鷹架被風吹得一直搖晃，上面沒綁牢的鋼… | — | — | thud |
| crow | 一隻眼睛發白的烏鴉從電線上俯衝下來，直撲你的臉—… | — | — | claw |

## 三、全部音效名稱（104 個）

| 名稱 | 種類 | 分類 | 聽起來是什麼 | 載入失敗的備援 | 用在哪裡 |
|---|---|---|---|---|---|
| sgpump | 音效檔 | combat | 泵動霰彈槍拉泵（咔、咔） | dry | WEAP.r870.cy；GUN_VFX_CFG.r870.after |
| sgshell | 音效檔 | combat | 泵動霰彈槍塞一發彈殼 | dry | WEAP.r870.rl |
| sgshellbr | 音效檔 | combat | 單管霰彈槍塞彈 | dry | sndW(…) 呼叫；WEAP.sbshot.rl |
| sgopen | 音效檔 | combat | 單管霰彈槍折開 | dry | sndW(…) 呼叫 |
| sgclose | 音效檔 | combat | 單管霰彈槍合上 | dry | sndW(…) 呼叫 |
| piercehit | 音效檔 | combat | 刺擊命中（刺進肉裡） | hurt | snd(…) 呼叫 |
| bowdraw | 音效檔 | combat | 拉弓、放箭 | whoosh | sfx(…) 呼叫 |
| bowimpact | 音效檔 | combat | 箭射中 | hurt | sfx(…) 呼叫；play(…) 呼叫 |
| rain_indoor_loop | 音效檔 | environment | 室內聽到的雨聲（循環） | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| rain_outdoor_loop | 音效檔 | environment | 室外的雨聲（循環） | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| thunder_distant_01 | 音效檔 | environment | 遠處的雷聲（一） | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| thunder_distant_02 | 音效檔 | environment | 遠處的雷聲（二） | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| heal | 音效檔 | foley | 包紮、處理傷口 | craft | sndW(…) 呼叫；ITEMS.bandage.snd；ITEMS.sbandage.snd；ITEMS.med.snd；…共 8 處 |
| pill | 音效檔 | foley | 吞藥 | craft | sndW(…) 呼叫；ITEMS.iodine.snd；ITEMS.alcohol.snd；ITEMS.antibiotic.snd；…共 7 處 |
| rummage | 音效檔 | foley | 翻找東西 | craft | snd(…) 呼叫 |
| stairs | 音效檔 | movement | 上下樓梯 | land | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| zipper | 音效檔 | foley | 拉背包拉鍊 | craft | sfx(…) 呼叫；sndW(…) 呼叫 |
| step | 音效檔 | movement | 人的腳步 | humanstep | encounterStep() 的回傳值；foeStep() 的回傳值；snd(…) 呼叫 |
| drawer | 音效檔 | foley | 拉抽屜 | craft | snd(…) 呼叫 |
| pickup | 音效檔 | foley | 撿起東西 | ok | snd(…) 呼叫；sndW(…) 呼叫 |
| dooropen | 音效檔 | movement | 開門 | land | snd(…) 呼叫 |
| doorclose | 音效檔 | movement | 關門 | land | snd(…) 呼叫 |
| beretta | 音效檔 | combat | 手槍槍聲 | fumble | WEAP.beretta.snd；GUN_VFX_CFG.beretta.snd |
| berettaReload | 音效檔 | combat | 手槍換彈匣 | dry | snd(…) 呼叫；sndW(…) 呼叫；WEAP.beretta.rl |
| revolver | 音效檔 | combat | 左輪槍聲 | fumble | WEAP.model10.snd；WEAP.model500.snd；MOVES.quickdraw[0].snd；MOVES.quickdraw[1].snd；…共 7 處 |
| revolverCock | 音效檔 | combat | 左輪扳擊錘 | dry | sndW(…) 呼叫；WEAP.model10.rl；WEAP.model500.rl；FOES.quickdraw.rl |
| casing | 音效檔 | combat | 彈殼落地 | dry | snd(…) 呼叫；GUN_VFX_CFG.beretta.after；GUN_VFX_CFG.mp5.after；GUN_VFX_CFG.fal.after |
| fist | 音效檔 | combat | 拳頭打中 | hurt | snd(…) 呼叫；sfx(…) 呼叫；BUTT.hs；BUTT4.hs；…共 7 處 |
| claw | 音效檔 | combat | 爪子抓傷（敵人招式的預設受傷聲） | hurt | snd(…) 呼叫；MOVES.infected[1].hs；MOVES.infected[2].hs；MOVES.predator[0].hs；…共 10 處 |
| knife | 音效檔 | combat | 刀刃砍、割 | hurt | snd(…) 呼叫；sfx(…) 呼叫；play(…) 呼叫；MOVES.cutter[0].hs；…共 7 處 |
| zstep | 音效檔 | movement | 感染者的腳步 | infectedstep | snd(…) 呼叫；encounterStep() 的回傳值；foeStep() 的回傳值 |
| headshot | 音效檔 | combat | 爆頭 | fumble | snd(…) 呼叫；sfx(…) 呼叫 |
| mthrow | 音效檔 | combat | 丟出燃燒瓶 | whoosh | snd(…) 呼叫 |
| mimpact | 音效檔 | combat | 燃燒瓶炸開、火焰 | fumble | snd(…) 呼叫；sndW(…) 呼叫 |
| death | 音效檔 | combat | 倒下、死亡 | fumble | snd(…) 呼叫；sndW(…) 呼叫 |
| click | 音效檔 | ui | 按鍵、開關（也用在強光照射） | dry | snd(…) 呼叫；sfx(…) 呼叫 |
| equip | 音效檔 | foley | 裝上裝備 | dry | snd(…) 呼叫；sndW(…) 呼叫 |
| fal | 音效檔 | combat | 戰鬥步槍槍聲 | fumble | WEAP.fal.snd；MOVES.acru_captain[0].snd；MOVES.acru_captain[1].snd；GUN_VFX_CFG.fal.snd |
| falReload | 音效檔 | combat | 戰鬥步槍換彈匣 | dry | WEAP.fal.rl；FOES.acru_captain.rl |
| mp5 | 音效檔 | combat | 衝鋒槍槍聲 | fumble | WEAP.mp5.snd；MOVES.acru_trooper[0].snd；MOVES.acru_trooper[1].snd；N.ZA.c[0].ng.audio；…共 5 處 |
| mp5Reload | 音效檔 | combat | 衝鋒槍換彈匣 | dry | WEAP.mp5.rl；FOES.acru_trooper.rl |
| rifle | 音效檔 | combat | 獵槍（栓動步槍）槍聲 | fumble | WEAP.model70.snd；WEAP.r700.snd；MOVES.oldhunter[0].snd；MOVES.acru_sniper[0].snd；…共 8 處 |
| bolt | 音效檔 | combat | 拉槍機 | dry | snd(…) 呼叫；sndW(…) 呼叫；WEAP.model70.rl；WEAP.model70.cy；…共 10 處 |
| bite | 音效檔 | combat | 被咬 | hurt | MOVES.infected[0].hs；MOVES.devourer[2].hs；MOVES.predator[1].hs；N.OF2a.c[1].ng.hz.ng.hs；…共 8 處 |
| smash | 音效檔 | combat | 重擊砸中 | fumble | MOVES.devourer[0].hs；MOVES.devourer[1].hs |
| splat | 音效檔 | combat | 黏稠的東西砸開 | hurt | MOVES.incubator[0].hs；MOVES.incubator[1].hs |
| spit | 音效檔 | combat | 噴吐 | whoosh | MOVES.incubator[0].pre；MOVES.incubator[1].pre |
| thud | 音效檔 | combat | 撞擊、摔倒、被砸（鈍擊） | land | MOVES.infected[3].hs；MOVES.predator[2].hs；N.C1.c[0].ng.hs；N.C2.c[1].ng.hs；…共 46 處 |
| squish | 音效檔 | combat | 軟爛的東西被擠壓 | hurt | MOVES.incubator[0].ws；MOVES.incubator[1].ws；MOVES.incubator[2].hs |
| bhit | 音效檔 | combat | 子彈打中 | dry | snd(…) 呼叫 |
| shotgun | 音效檔 | combat | 霰彈槍槍聲 | fumble | snd(…) 呼叫；WEAP.r870.snd；WEAP.sbshot.snd；GUN_VFX_CFG.r870.snd；…共 5 處 |
| glassbreak | 音效檔 | environment | 玻璃碎掉 | — | N.A4.c[3].tb[0].audio；N.A4.c[3].tb[1].audio；N.A4.c[3].tb[2].audio；N.A3x.c[1].tb[1].audio；…共 9 處 |
| firealarm | 音效檔 | environment | 火災警鈴 | — | snd(…) 呼叫；N.AD3.c[0].tb[0].audioStop；N.AD3.c[0].tb[1].audioStop；EVPOOL[11].c[0].ok.audioStop |
| genstart | 音效檔 | environment | 發電機發動 | — | snd(…) 呼叫；N.G2.c[0].ok.audio；N.PP3.c[0].ok.audio；N.PP3.c[1].ok.audio；…共 5 處 |
| genloop | 音效檔 | environment | 發電機運轉（循環） | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| dryfire | 音效檔 | environment | 空槍扣扳機 | dry | snd(…) 呼叫 |
| woodknock | 音效檔 | environment | 敲木頭、木門 | — | snd(…) 呼叫 |
| woodimpact | 音效檔 | environment | 木板砸下來 | — | snd(…) 呼叫；N.A2.c[0].ng.audio；N.A2.c[2].ng.audio；N.A2.c[3].ok.audio；…共 5 處 |
| glassstep | 音效檔 | environment | 踩到碎玻璃 | — | N.I1.c[1].ng.audio；N.O0.c[0].ok.audio；N.YD4.c[1].ng.audio；N.BD4.c[0].ng.audio；…共 5 處 |
| waterpipe | 音效檔 | environment | 水管裡的水流（循環） | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| pumpmix | 音效檔 | environment | 抽水機運轉（循環） | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| pumpstop | 音效檔 | environment | 抽水機停下 | — | snd(…) 呼叫 |
| radiostatic | 音效檔 | environment | 無線電雜訊 | — | N.L1.audio；N.CA4.c[1].ok.audio；N.CA4.audio；N.AM3.c[0].tb[0].audio；…共 14 處 |
| radio02 | 音效檔 | environment | 無線電台詞 02 | — | radioLine(…) 呼叫 |
| radio23 | 音效檔 | environment | 無線電台詞 23 | — | radioLine(…) 呼叫 |
| radio24 | 音效檔 | environment | 無線電台詞 24 | — | radioLine(…) 呼叫 |
| crossbowshot | 音效檔 | combat | 十字弓發射 | whoosh | sfx(…) 呼叫；play(…) 呼叫 |
| humanstep | 合成音 | — | 合成：人的腳步（腳步聲檔案載入失敗時的備援） | — | 備援：step |
| infectedstep | 合成音 | — | 合成：感染者的腳步（備援） | — | 備援：zstep |
| doorlocked | 合成音 | environment | 合成：門鎖住、推不開 | — | sfx(…) 呼叫；N.W0.c[1].ng.audio |
| rattle | 合成音 | ui | 合成：骰子在杯裡滾 | — | sfx(…) 呼叫 |
| land | 合成音 | ui | 合成：骰子落地、悶響 | — | sfx(…) 呼叫；備援：stairs、dooropen、doorclose、thud |
| ok | 合成音 | ui | 合成：檢定成功 | — | sfx(…) 呼叫；備援：pickup |
| crit | 合成音 | ui | 合成：大成功 | — | sfx(…) 呼叫 |
| ng | 合成音 | system | 合成：檢定失敗 | — | snd(…) 呼叫；sfx(…) 呼叫 |
| fumble | 合成音 | system | 合成：大失敗 | — | snd(…) 呼叫；sfx(…) 呼叫；備援：beretta、revolver、headshot、mimpact、death、smash、shotgun、fal、mp5、rifle |
| miss | 合成音 | system | 合成：攻擊落空 | — | snd(…) 呼叫 |
| whoosh | 合成音 | combat | 合成：揮空、閃開的風聲 | — | snd(…) 呼叫；sfx(…) 呼叫；備援：crossbowshot、bowdraw、mthrow、spit |
| groan | 合成音 | combat | 合成：低沉的呻吟 | — | snd(…) 呼叫 |
| hurt | 合成音 | combat | 合成：一般受傷聲（劇情扣血的預設） | — | N.A4c.c[0].tb[2].hs；N.A6.c[2].ng.hs；N.C2.c[1].ok.hz.ng.hs；N.D2x.c[0].ng.hs；…共 30 處 |
| craft | 合成音 | foley | 合成：動手做東西 | — | snd(…) 呼叫；備援：heal、pill、rummage、zipper、drawer |
| dry | 合成音 | ui | 合成：喀一聲（空槍、換彈的備援） | — | 備援：sgpump、sgshell、sgshellbr、sgopen、sgclose、berettaReload、revolverCock、casing、click、equip、bhit、falReload、mp5Reload、bolt、dryfire |
| eat | 合成音 | foley | 合成：吃東西 | — | sndW(…) 呼叫 |
| gulp | 合成音 | foley | 合成：喝水 | — | sndW(…) 呼叫 |
| ext | 合成音 | combat | 合成：滅火器噴出 | — | snd(…) 呼叫；N.WP3.c[0].ok.hz.audio |
| zap | 合成音 | combat | 合成：觸電 | — | N.OB3.c[0].ng.hs；N.W1.c[1].ok.hs；N.N0.c[1].ng.hs；N.PP5.c[1].ok.hz.ng.hs |
| level | 合成音 | system | 合成：升級 | — | snd(…) 呼叫；sfx(…) 呼叫 |
| farshot1 | 組合槍聲 | — | 組合：遠處一槍 | — | N.V3.audio；EVPOOL[27].audio |
| farshots | 組合槍聲 | — | 組合：遠處 2～4 槍 | — | N.A1.c[0].ok.audio；N.B1w.c[2].ok.hz.ng.audio；N.A1r.audio；N.BD1.c[1].ng.hz.audio；…共 6 處 |
| farshots2 | 組合槍聲 | — | 組合：遠處兩槍 | — | （沒有用到） |
| farshotsglass | 組合槍聲 | — | 組合：遠處 2～4 槍＋近處玻璃碎 | — | N.B1w.c[0].ng.hz.audio；N.B2w.c[0].ok.audio；N.B2w.c[0].ng.hz.audio；N.B2w.c[2].ng.hz.audio；…共 5 處 |
| farshots2glass | 組合槍聲 | — | 組合：遠處兩槍＋近處玻璃碎 | — | N.B2w.c[1].ok.audio |
| farshots2glassfar | 組合槍聲 | — | 組合：遠處兩槍＋遠處玻璃碎 | — | N.A6b.c[0].ok.audio |
| streetshots3glassfar | 組合槍聲 | — | 組合：街上三槍＋遠處玻璃碎 | — | N.A1.audio |
| shot1 | 組合槍聲 | — | 組合：近處一槍 | — | N.K2.c[0].ng.audio；EVPOOL[24].c[3].ng.audio |
| shotsglass | 組合槍聲 | — | 組合：近處 3～4 槍＋玻璃碎 | — | N.L0.c[3].ng.audio |
| farmp5 | 組合槍聲 | — | 組合：遠處衝鋒槍 | — | N.ZA.c[0].ok.audio |
| farrifle | 組合槍聲 | — | 組合：遠處獵槍 | — | N.BA0.c[4].ng.audio |
| bowhit | 弓箭 | — | 弓：拉弓＋命中 | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| bowmiss | 弓箭 | — | 弓：拉弓、沒中 | — | 程式裡直接寫到（環境音、回傳名稱的函式等） |
| arrowhit | 弓箭 | — | 弓箭攻擊命中 | — | snd(…) 呼叫 |
| arrowmiss | 弓箭 | — | 弓箭攻擊沒中 | — | snd(…) 呼叫 |
| xbowhit | 弓箭 | — | 十字弓攻擊命中 | — | snd(…) 呼叫 |
| xbowmiss | 弓箭 | — | 十字弓攻擊沒中 | — | snd(…) 呼叫 |
