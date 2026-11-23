# 舊文件（2026-11-23 發布流程整理後不再使用）

- `RULES_SONNET.md`、`AI_WORKFLOW.md`：舊的規則文件。規則改看 `docs/RULES_CLAUDE.md`、`docs/RULES_GPT.md`；設計決定原文搬到 `docs/DESIGN.md`。
- `workflows/`：GPT 時期 9 個單一功能的 GitHub 驗收流程，已由 `.github/workflows/test.yml`（完整測試）取代。放在這裡不會執行。
- `qa-tools/`：那些驗收流程用的瀏覽器腳本。路徑是照原本放在 `tools/` 寫的，要再用得先搬回 `tools/`。
- 它們原本用到的 Node 測試（`tools/*.test.cjs`）已經搬進 `tests/`，每次都會跑。
- 舊的驗收 zip、單一版本的 QA 紀錄已刪除（主人 2026-11-23），要查就到 git 歷史裡找。
