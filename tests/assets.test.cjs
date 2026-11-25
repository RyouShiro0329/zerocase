// 素材完整性（Claude 2026-11-25，QA 升級 PR-C：QA-19）。掃描工具在 tests/helpers/assets.cjs，說明見 docs/QA_SYSTEM.md。
// 不只看 index.html 寫死的路徑，還從遊戲的音效表（SFILES）、配樂、資料表的 img／音效欄位讀出 'sfx/'+名稱 這類動態組成的檔名。
const {test}=require('node:test');const assert=require('node:assert/strict');
const {scan}=require('./helpers/assets.cjs');
const R=scan();
test('素材：寫死的路徑和動態組成的音效、配樂、立繪檔案都存在',()=>{
 assert.deepEqual(R.missing.map(m=>m.file+'（'+m.why+'）'),[]);
});
test('素材：遊戲用到的音效名稱都播得出來（有檔案、合成音或組合槍聲）',()=>{
 assert.deepEqual(R.unknownKeys.map(u=>u.key+'（'+u.where+'）'),[]);
});
test('素材：掃描真的讀到了動態名稱（防止工具什麼都沒讀到也算通過）',()=>{
 assert.ok(R.counts.sfiles>=50,'音效表只有 '+R.counts.sfiles+' 個名稱');
 assert.ok(R.counts.soundNames>=50,'只找到 '+R.counts.soundNames+' 個音效名稱');
 for(const f of ['sfx/genloop.ogg','sfx/genloop.mp3','sfx/bgm.ogg','sfx/bgm_hitman_battle.mp3','sfx/crossbowshot.wav','img/inf_m.webp','img/g_dar.webp'])assert.ok(R.files.includes(f),'沒有檢查到 '+f);
});
