# 給 Claude Sonnet 的專屬規則（零號病例）

這是長期更新的遊戲，主人要的是**每一版都穩、不改壞**，不是一次做很多。先讀 `AGENTS.md`、`docs/AI_WORKFLOW.md`，這份是在那之上要多注意的地方。

## 一、開工順序（每次都一樣）
1. `git fetch`，從最新的 `origin/main` 開新分支，不要接在舊分支上做。
2. 讀 `docs/VERSIONS.md` 最上面三行和 `更新說明.txt` 最上面那一版，確認目前版本和 Build。
3. 把主人的要求**拆成清單**，一條一條對照。做完逐條確認，不要漏，也不要多做。
4. 有任何下面的情況，**先問主人、等回答再動手**：
   - 新系統，或改核心規則（價錢、戰鬥、警戒、善惡值、存檔）；
   - 刪內容，或改劇情走向；
   - 要求有兩種以上合理做法；
   - 會讓舊測試失敗。

   問的時候給 2～4 個中文選項，推薦的放第一個並標「（推薦）」。

## 二、Sonnet 最容易出錯的地方
- **順手多改**：看到「可以順便整理」的程式也不要動。不改名、不重排、不改縮排、不補註解，只改這次要求的東西。
- **沒驗證就說完成**：
  - 每次說「通過」之前，都要真的跑過指令、看到輸出。
  - 跑不了就寫「未測試」和原因。
  - 不要用推測代替結果。
- **猜函式和變數**：用任何函式、旗標、節點代號之前，先 `grep -n` 確認它存在、看它怎麼寫。不要憑印象寫 `G.xxx`。
- **對話太長忘記規則**：做到一半覺得不確定時，回頭再讀一次 `AI_WORKFLOW.md` 的「2026-11-20 補充」。
- **一次改太大**：一個 commit 只做一件事。大改先列方案，主人同意後再分幾步做，每一步都跑測試。

## 三、改 index.html 的方法
- `index.html` 有七千多行，有些行上千字。
  - 用 `grep -n '關鍵字' index.html | cut -c1-200` 找位置，再用範圍讀那幾行，不要整檔讀。
  - 編輯工具的舊字串要完全相符；長行很難對準，改用 Python：
    ```python
    s=open('index.html',encoding='utf-8').read()
    a="舊的字串"; assert s.count(a)==1, s.count(a)
    s=s.replace(a,"新的字串"); open('index.html','w',encoding='utf-8').write(s)
    ```
- 新增任何名稱（函式、常數、CSS class、節點代號、旗標）之前，先搜尋有沒有撞名。
- 劇情節點 `N.xxx` 的 `go`／`next` 指到的節點一定要存在，長路線測試會抓這個錯。
- 改了旗標名稱或存檔結構，要在 `migrateG` 加舊存檔轉換。

## 四、遊戲文字
- 台灣繁體中文用語。禁用詞在 `tests/guard.test.cjs`，例如視頻、激活、默認、信息、菜單、用戶、點擊、質量、反饋。
- 選項小字照 `AI_WORKFLOW.md` 的規則：只寫需要的東西，不寫後果、不寫數字、不寫去處。
- 主人說劇情文字是草案的時候，照規格寫一版就好，不要加戲、不要自創新角色或新設定。
- 加了新字就要做字型子集，並更新 `?v=` 的 8 碼。

## 五、測試與發布（照順序）
1. 改完先跑 `node --test tests/*.test.cjs`。
2. 新功能或修正補 1～3 個聚焦的測試，放在既有的測試檔，不要寫只檢查常數的測試。
3. 有新字才跑字型步驟。
4. 更新 `ZC_VER`（版本、Build +1、Asia/Taipei 時間）、`更新說明.txt`、`docs/VERSIONS.md`。
5. 重算 MANIFEST，跑 `python3 verify_release.py`。
6. 跑完整的 `bash tests/run_all.sh`，大約 6～7 分鐘，**一次只跑一個**。
   - 沒有 playwright：`mkdir -p /tmp/zc/pw && cd /tmp/zc/pw && npm init -y && npm i playwright && npx playwright install --with-deps chromium`，然後 `NODE_PATH=/tmp/zc/pw/node_modules bash tests/run_all.sh`。
7. commit，把 hash 填回 `VERSIONS.md`，重算 MANIFEST 再 commit，然後 push，開 PR。
8. **不要自己合併**。主人說「可以合併」才用 `gh pr merge --merge`。

## 六、回報給主人
- 用中文，短。
- 內容：改了什麼、測試結果、試玩 zip 網址，以及有沒有碰到原本的設計規則。
- 手機一律寫「待主人實機驗收」。
- 主人問「是什麼意思」時，直接用遊戲裡的例子回答，不要重講流程。
