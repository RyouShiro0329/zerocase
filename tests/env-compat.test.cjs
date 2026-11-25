// 事件環境相容（Claude 2026-11-25，QA 升級 PR-C：QA-07）。對照表在 tests/helpers/env-compat.cjs，說明見 docs/QA_SYSTEM.md。
// 測試這邊另外整理一份「每個地方是室內還是戶外、事件節點有什麼」，和遊戲實際抽得到的意外、事件比對。
const {test}=require('node:test');const assert=require('node:assert/strict');
const {check,KNOWN}=require('./helpers/env-compat.cjs');
const R=check();
test('環境相容：對照表涵蓋所有地點、事件節點、事件、意外種類',()=>{assert.deepEqual(R.tableGaps,[])});
test('環境相容：隨機意外和隨機事件都符合地點（等主人決定的另列）',()=>{
 assert.deepEqual(R.problems,[]);
 assert.ok(R.counts.hazPairs>100&&R.counts.evPairs>100,'比對的組合太少：'+JSON.stringify(R.counts));
});
test('環境相容：等主人決定的清單和遊戲現況一致（修好了要從 KNOWN 拿掉）',()=>{assert.deepEqual(R.staleKnown,[])});
test('環境相容：遊戲現在對不上、等主人決定（'+KNOWN.length+' 組）',{todo:R.known.join('；')||true},()=>{assert.equal(R.known.length,0)});
