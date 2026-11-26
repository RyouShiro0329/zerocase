const test=require('node:test'),assert=require('node:assert/strict');
const {readSourceVersion,assertSourceVersion}=require('./helpers/source-version.cjs');
const source=v=>'const ZC_VER='+JSON.stringify(v)+';';
const current={v:'0.69.1',b:145,t:'2026-11-26T22:55:39+08:00'};
test('正式站版本：從來源讀取，後續升版也能嚴格比對',()=>{
 for(const expected of [current,{...current,v:'0.70.0',b:146}]){
  const parsed=readSourceVersion(Buffer.from(source(expected)));assert.deepEqual(parsed,expected);assertSourceVersion({...expected},parsed);
 }
});
test('正式站版本：舊版、錯 Build 與錯發布時間都失敗',()=>{
 for(const wrong of [{...current,v:'0.69.0'},{...current,b:144},{...current,t:'2026-11-25T22:55:39+08:00'}])assert.throws(()=>assertSourceVersion(wrong,current),/正式站完整版本資訊/);
});
test('正式站版本：缺少、重複或格式錯誤的來源不能接受',()=>{
 for(const invalid of ['',source(current)+source(current),'const ZC_VER={bad};',source({...current,v:'bad'}),source({...current,b:0}),source({...current,t:'bad'})])assert.throws(()=>readSourceVersion(invalid));
});
