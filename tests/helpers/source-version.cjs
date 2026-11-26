// 正式站驗收以本次 checkout 的完整版本資訊為基準，不寫死發布版本。
const assert=require('node:assert/strict');
function readSourceVersion(source){
 const matches=[...String(source).matchAll(/const ZC_VER=(\{[^}]*\});/g)];
 assert.equal(matches.length,1,'來源必須恰有一個 ZC_VER');
 const version=JSON.parse(matches[0][1]);
 assert.match(version.v,/^\d+\.\d+\.\d+$/);assert(Number.isSafeInteger(version.b)&&version.b>0);assert.equal(typeof version.t,'string');assert(Number.isFinite(Date.parse(version.t)));
 return version;
}
function assertSourceVersion(observed,expected){assert.deepEqual(observed,expected,'正式站完整版本資訊必須與本次 checkout 相同')}
module.exports={readSourceVersion,assertSourceVersion};
