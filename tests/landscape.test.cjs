// v0.55.1（主人 2026-11-23）：這是橫向遊戲，手機直拿也不能出現直式畫面
const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
test('設定裡沒有「不旋轉」，畫面方向不受設定影響',()=>{
 assert.doesNotMatch(html,/不旋轉/);assert.doesNotMatch(html,/seg\('orient'/);
 const m=html.match(/const rot=([^;]+);/);assert.ok(m,'找得到轉向判斷');
 assert.doesNotMatch(m[1],/orient|BOOTED/,'從「進入遊戲」畫面起，直拿就轉成橫向');
});
test('窄橫向畫面的武器選單：說明最多兩行、返回和左手同一列',()=>{
 assert.match(html,/\.short #choices>\.ch:is\(\[data-fa="atk"\],\[data-fa="dual"\]\) \.cs\{[^}]*-webkit-line-clamp:2/);
});
