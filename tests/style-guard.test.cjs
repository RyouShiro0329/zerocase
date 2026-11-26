const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const {cssRules}=require('./helpers/ui-contract.cjs');
test('重要 CSS 與經審查的基準一致',()=>{const actual=cssRules(fs.readFileSync(path.join(__dirname,'../index.html'),'utf8'));assert.deepEqual(actual,require('./baselines/styles.json'),'重要 CSS 已改動，請檢視版面後明確更新基準，不能自動接受');});
