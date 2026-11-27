const test=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const path=require('node:path');
const crypto=require('node:crypto');
const root=path.resolve(__dirname,'..');
const read=p=>JSON.parse(fs.readFileSync(path.join(root,p),'utf8'));
const catalog=read('audio-library/catalog.json');
const imports=read('audio-library/imports.json');
const walk=p=>fs.readdirSync(p,{withFileTypes:true}).flatMap(d=>d.isDirectory()?walk(path.join(p,d.name)):[path.relative(root,path.join(p,d.name)).split(path.sep).join('/')]);
const sha=p=>crypto.createHash('sha256').update(fs.readFileSync(path.join(root,p))).digest('hex');

test('音效素材庫完整涵蓋既有與新增實體檔案，逐檔位元與規格可追溯',()=>{
  const rows=catalog.entries.filter(r=>r.repository_path);
  const actual=[...walk(path.join(root,'sfx')),...walk(path.join(root,'audio-library/files'))].filter(p=>/\.(wav|mp3|ogg|flac|aiff|aif|m4a)$/i.test(p)).sort();
  assert.deepEqual(rows.map(r=>r.repository_path).sort(),actual);
  assert.equal(new Set(catalog.entries.map(r=>r.id)).size,catalog.entries.length);
  for(const r of rows){
    assert.ok(!path.isAbsolute(r.repository_path)&&!r.repository_path.split('/').includes('..'));
    assert.equal(fs.statSync(path.join(root,r.repository_path)).size,r.bytes,r.id);
    assert.equal(sha(r.repository_path),r.sha256,r.id);
    assert.ok(r.duration_seconds>0&&r.sample_rate_hz>0&&r.channels>0,r.id);
  }
  const manifest=read('audio-library/MANIFEST.json');
  assert.deepEqual(manifest.files.map(r=>r.path).sort(),actual);
  assert.equal(manifest.index_sha256,sha('index.html'));
  for(const r of manifest.files)assert.equal(sha(r.path),r.sha256,r.path);
});

test('僅索引來源沒有混入公開音檔，16／24 位元對應版本均保留',()=>{
  for(const r of imports.entries){
    const allowed=imports.sources[r.group].redistribution==='允許';
    assert.equal(Boolean(r.repository_path),allowed,r.id);
    assert.ok(r.sha256&&r.original_path&&r.bytes>0,r.id);
    if(!allowed)assert.ok(catalog.entries.find(x=>x.id===r.id&&!x.repository_path));
  }
  const variants=new Map();
  for(const r of imports.entries.filter(x=>x.group==='zombie-massacre')){
    const list=variants.get(r.variant_group)||[];list.push(r);variants.set(r.variant_group,list);
  }
  assert.equal(variants.size,99);
  for(const rows of variants.values())assert.deepEqual(rows.map(r=>r.bit_depth).sort((a,b)=>a-b),[16,24]);
});

test('開發素材沒有自動接入遊戲預載，統計與遊戲版本和實際資料一致',()=>{
  const html=fs.readFileSync(path.join(root,'index.html'),'utf8');
  assert.ok(!html.includes('audio-library/'));
  assert.ok(!fs.readFileSync(path.join(root,'sw.js'),'utf8').includes('audio-library/'));
  assert.ok(!fs.readFileSync(path.join(root,'assets-manifest.json'),'utf8').includes('audio-library/'));
  const version=JSON.parse(html.match(/const ZC_VER=(\{[^\n]+?\});/)[1]);
  assert.deepEqual(catalog.game_version,version);
  assert.equal(catalog.counts.total,catalog.entries.length);
  assert.equal(catalog.counts.existing,catalog.entries.filter(r=>r.group==='existing').length);
  assert.equal(catalog.counts.imported,imports.entries.length);
  assert.equal(catalog.counts.imported_files,imports.entries.filter(r=>r.repository_path).length);
  assert.equal(catalog.counts.metadata_only,imports.entries.filter(r=>!r.repository_path).length);
});
