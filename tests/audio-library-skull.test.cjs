const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');

test('本批額外兩個 Skull Split 原檔各自保留來源與作者指定署名',()=>{
  const data=JSON.parse(fs.readFileSync(path.join(root,'audio-library/imports.json'),'utf8'));
  for(const [sid,n] of [['833639',1],['833640',2]]){
    const rows=data.entries.filter(r=>r.original_path===`${sid}__silverillusionist__skull-split-${n}.wav`);
    assert.equal(rows.length,1,`來源 ${sid} 必須恰好一筆`);
    const r=rows[0];
    assert.equal(r.source_url,`https://freesound.org/people/SilverIllusionist/sounds/${sid}/`);
    assert.equal(r.attribution,`"Skull Split #${n}" by Dylan Kelk/SilverIllusionist (Freesound)`);
    assert.equal(r.license_url,'https://creativecommons.org/licenses/by/4.0/');
    assert.equal(data.sources[r.group].license,'CC BY 4.0');
    const raw=fs.readFileSync(path.join(root,r.repository_path));
    assert.equal(raw.length,r.bytes);
    assert.equal(crypto.createHash('sha256').update(raw).digest('hex'),r.sha256);
  }
});
