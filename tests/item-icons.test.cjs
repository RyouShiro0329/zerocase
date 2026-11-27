// 背包／裝備列道具圖示（v0.71.0）：64px webp，列上 32px，缺少時不佔位。
const {test}=require('node:test');const assert=require('node:assert/strict');
const fs=require('node:fs');const path=require('node:path');
const {load}=require('./helpers/game-vm.cjs');
const {scan}=require('./helpers/assets.cjs');
const ROOT=path.resolve(__dirname,'..');
const g=load(path.join(ROOT,'index.html'));
const keys=g.run('Object.keys(ITEMS).concat(Object.keys(WEAP).filter(k=>k!=="fist"))');

test('道具圖示：ITEMS 與 WEAP（不含拳頭）都有 img/item/<key>.webp',()=>{
  assert.equal(keys.length,120);
  const miss=keys.filter(k=>!fs.existsSync(path.join(ROOT,'img/item',k+'.webp')));
  assert.equal(miss.length,0,miss.join(','));
  assert.ok(!fs.existsSync(path.join(ROOT,'img/item','fist.webp')),'拳頭不應有圖示檔');
});

test('道具圖示：素材索引有這 120 個檔，priority 為 2 且不是進場必載',()=>{
  const index=g.run('ZC_ASSET_INDEX.filter(x=>x.url.startsWith("img/item/"))');
  assert.equal(index.length,120);
  for(const a of index){
    assert.equal(a.type,'image');
    assert.equal(a.priority,2);
    assert.equal(a.required,false);
    assert.ok(/^[0-9a-f]{64}$/.test(a.hash));
    assert.ok(a.size>0&&a.size<20000,a.url+' 過大或空白：'+a.size);
  }
  const R=scan(ROOT);
  assert.ok(R.ok,'素材掃描失敗');
  for(const k of keys)assert.ok(R.files.includes('img/item/'+k+'.webp'),'掃描沒有 '+k);
});

test('道具圖示：有檔的 key 會輸出 32px 圖，拳頭或沒有的 key 則空白',()=>{
  assert.equal(g.run('itemIco("fist")'),'');
  assert.equal(g.run('itemIco("no-such-item")'),'');
  const html=g.run('itemIco("bandage")');
  assert.match(html,/class="iico"/);
  assert.match(html,/data-zc-src="img\/item\/bandage\.webp"/);
  assert.match(html,/src="img\/item\/bandage\.webp(\?zc-h=[0-9a-f]+)?"/);
  const bag=g.run('lnRow("bandage","<b>繃帶</b>","","",false,itemIco("bandage"))');
  assert.match(bag,/^<div class="irow ln /);
  assert.match(bag,/<img class="iico"/);
  assert.ok(bag.indexOf('iico')<bag.indexOf('class="in"'),'圖示應在名稱左側');
});
