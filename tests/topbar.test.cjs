const {test}=require('node:test'),assert=require('node:assert/strict'),fs=require('node:fs'),path=require('node:path');
const html=fs.readFileSync(path.join(__dirname,'../index.html'),'utf8');
const css=html.match(/<style>([\s\S]*?)<\/style>/)[1];
function declarations(selector){let out={};for(const m of css.matchAll(/([^{}]+)\{([^{}]*)\}/g))if(m[1].split(',').some(s=>s.trim()===selector)){for(const item of m[2].split(';')){const i=item.indexOf(':');if(i>0)out[item.slice(0,i).trim()]=item.slice(i+1).trim()}}return out}
test('窄橫向頂端欄維持單列，不把工具列推至第二列',()=>{const bar=declarations('#stage.compact-tools .topbar');assert.equal(bar.display,'flex');assert.equal(bar['flex-wrap'],'nowrap');assert.equal(declarations('#stage.compact-tools .tools')['grid-column'],undefined)});
test('窄畫面的警戒值維持顯示，天象與時間保留獨立空間',()=>{assert.notEqual(declarations('#stage.narrow .mid small .nz').display,'none');const mid=declarations('#stage.compact-tools .mid');assert.ok(parseFloat(mid['min-width'])>=150)});
