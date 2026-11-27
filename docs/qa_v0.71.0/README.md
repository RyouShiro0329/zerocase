# v0.71.0 預覽截圖（道具圖示）

本機瀏覽器實機畫面，非正式基準。固定版面基準仍在 `tests/baselines/ui/*-bag.png`。

注入物資僅供預覽（槍、彈藥、醫療、材料都會入列）；格子數可能略超過上限，不代表遊戲放行超重。

## 背包（含槍、彈藥、醫療、材料）

- `844x390-bag-showcase.png` 頂部：HK MP5、S&W Model 500、繃帶
- `844x390-bag-showcase-mid.png` 中段：能量棒、9×19mm、12 號霰彈
- `844x390-bag-showcase-bottom.png` 底部：霰彈、布料、碎玻璃
- `393x690-bag-showcase.png`（直向視窗，遊戲轉橫向）同上頂部
- `393x690-bag-showcase-mid.png` 中段
- `393x690-bag-showcase-bottom.png` 底部
- `*-bag-stuffed.png`：更多槍種（另含 FAL、R700 等）的較滿背包，僅見頂部武器列

## 裝備頁（此版一併加上圖示）

- `844x390-equip-showcase.png`／`*-bottom.png`：右手折疊小刀；右欄背包裡的 MP5、Model 500
- `393x690-equip-showcase.png`／`*-bottom.png`：同上（直向視窗轉橫向）

控制台：背包與裝備頁沒有 `console.error` 或 pageerror。切換面板時，已被拿掉的圖有可能出現 `net::ERR_ABORTED`（請求被中止），圖示本身都有載入成功（64px 原圖、32px 顯示）。
