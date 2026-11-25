// 音效對應表（Claude 2026-11-25，QA 升級 PR-D：QA-16）。表在 tests/helpers/sfx-map.cjs，給主人看的文件在 docs/audio/SFX_MAP.md。
// 只列缺口、不換音效：新的音效名稱要先在表裡寫「聽起來是什麼」，文件要重新產生（node tests/helpers/sfx-map.cjs --md docs/audio/SFX_MAP.md）。
const {test}=require('node:test');const assert=require('node:assert/strict');const fs=require('node:fs'),path=require('node:path');
const {build}=require('./helpers/sfx-map.cjs');
const R=build();const G=R.gaps;
test('音效對應表：每一個播得出來的名稱都有說明、表裡沒有遊戲已經不用的名稱',()=>{
 assert.deepEqual(R.unreviewed,[],'新的音效名稱要在 tests/helpers/sfx-map.cjs 的 DESC 寫說明');
 assert.deepEqual(R.stale,[],'遊戲已經沒有這些名稱，從 DESC 拿掉');
 assert.ok(R.names>=90,'名稱太少：'+R.names);
});
test('音效對應表：docs/audio/SFX_MAP.md 列出每一個名稱（名稱有變要重新產生文件）',()=>{
 const f=path.join(__dirname,'../docs/audio/SFX_MAP.md');assert.ok(fs.existsSync(f),'沒有 docs/audio/SFX_MAP.md');const s=fs.readFileSync(f,'utf8');
 const miss=R.rows.map(r=>r.k).filter(k=>!s.includes('| '+k+' |'));assert.deepEqual(miss,[],'重新產生：node tests/helpers/sfx-map.cjs --md docs/audio/SFX_MAP.md');
});
const n=G.hazNoAudio.length+G.hazNoOk.length+G.noFall.length+G.unused.length;
test(`音效對應表：缺口等主人決定（意外沒聲音 ${G.hazNoAudio.length}、躲開沒聲音 ${G.hazNoOk.length}、沒有備援 ${G.noFall.length}、沒用到 ${G.unused.length}；詳見 docs/audio/SFX_MAP.md）`,{todo:n?'只列缺口，不換音效':false},()=>{assert.equal(n,0)});
