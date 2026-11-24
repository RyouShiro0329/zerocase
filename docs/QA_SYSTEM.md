# 測試系統說明（QA 升級，2026-11-25 起）

規格：主人的 ZEROCASE_QA_SYSTEM_UPGRADE_SPEC；盤點與分階段方案在 Claude 專案 `zerocase/PROPOSAL_QA_UPGRADE.md`。
已完成：**PR-A 結果真實性**（QA-01、02、03、29）。之後：PR-B 重現與追蹤（QA-04～06）→ PR-C～F。

## 兩種模式
| 指令 | 跑什麼 | 誰用 |
|---|---|---|
| `bash tests/run_all.sh fast` | 防弱化檢查＋Node 邏輯測試（約 1 分鐘） | 本機平常用 |
| `bash tests/run_all.sh full 40 480` | 再加瀏覽器冒煙（三種尺寸）＋長路線 | GitHub「完整測試」 |

舊寫法 `bash tests/run_all.sh 40 480` 等於 `full 40 480`。本機不能開埠時加 `QA_SERVE=route`（playwright 直接讀檔回應）。

## 六種狀態
- 每個階段：**PASS** 通過、**FAIL** 失敗、**SKIP** 刻意略過（FAST 模式、`SKIP_LONG=1`）、**NOT_RUN** 該跑沒跑成（例如沒有 playwright、找不到基準分支）、**ERROR** 測試工具自己出錯（例如 Node 測試沒有總結、伺服器沒起來、腳本當掉）。
- **TODO**：個別暫緩的項目（目前只有恐懼數字那一項），列在報告裡，不讓階段失敗。
- 總結只有每個階段都 PASS 才寫「全部通過」。有略過寫「跑了的都通過，但有略過：…」；有未測試寫「沒有完整跑完」。
- exit code：FAIL、ERROR → 1；完整模式有 NOT_RUN → 1；CI 上完整模式有 SKIP → 1；其他 0。

## 報告（`test-results/`，不進 git；CI 上傳成「test-results」，保留 14 天）
- `report.json`：模式、參數、開始／結束時間（台北）、總秒數、遊戲版本／Build／版本時間、index.html SHA-256 與大小、commit、分支、有沒有未提交修改、Node 與 playwright 版本、每個階段的狀態／秒數／說明／失敗項目／暫緩項目／警告／細節、總結。
- `report.md`：同樣內容的表格（CI 會放在那次執行的 Summary）。
- `node-tap.txt`（Node 原始輸出）、`integrity.json`、`browser-smoke.json`、`long-route.json`（每個尺寸的錯誤分類、步數、節點數）、`screenshots/`（失敗時的截圖）、`selfcheck.json`（自我驗收）。

## 防弱化檢查（`tests/helpers/integrity.cjs`）
和基準（`QA_BASE`，預設 `origin/main`；CI 是 PR 要合進去的分支）比：
- `tests/guard.test.cjs` 任何一個位元不同或被刪 → **失敗**。主人明確同意改 guard 的那個 PR 會失敗，PR 要寫出來，主人說可以合併才合併。
- 測試檔被刪或改名、某支檔案的 `test(` 變少、skip／todo 變多 → **警告**（寫進報告，不擋）。
- 另外記錄 index.html 和基準是否逐位元相同。

## 瀏覽器錯誤分類（`tests/helpers/browser-errors.cjs`）
- 算失敗：頁面程式錯誤、其他 console.error、**同網域檔案回 4xx／5xx 或載入失敗**（以前被正規式整類吞掉）。
- 只記錄：外部連線（firebase、gstatic、googleapis）、favicon.ico、瀏覽器自己取消的請求（ERR_ABORTED）。

## 自我驗收（`tests/qa-selfcheck.sh`，CI 每次都跑，約 20 秒）
在暫存目錄故意製造失敗，確認工具不會說謊：V01 沒有 playwright、V02 SKIP_LONG、V03 Node 測試失敗／壞檔／沒有總結、V04 報告欄位與實際相符、V11 guard 被改、V12 測試被刪或變少、V13 必要圖片 404。
自我驗收的情境由 Claude 依 PR-A 範圍定義（規格書原文的 V 編號細節不在這次對話可讀的文件裡）；之後有出入照規格書調整。
