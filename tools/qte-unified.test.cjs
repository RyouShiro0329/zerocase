const {test}=require('node:test'),assert=require('node:assert/strict');
const {game}=require('../tests/helpers/audio-game.cjs');
test('統一QTE時間：全能力、天賦、傷勢、難度與環境皆527ms',()=>{const g=game();for(const diff of ['normal','hard','real'])for(const n of [-5,0,2,5,30]){g.run(`G={opts:{diff:'${diff}'}}`);assert.equal(g.run(`qtePer({st:{AGI:${n},PER:${n}},traits:['athletic'],dazed:1,frac:1})`),527)}assert.equal(g.run('JSON.stringify(QTE_D.normal)===JSON.stringify(QTE_D.hard)'),true)});
test('逐個提示與連續倒數沿用核准預覽，不保留兩格預顯示或換組停頓',()=>{const g=game();const s=g.run('qteLocal.toString()');assert.ok(s.includes('Math.min(cur+1,s.seq.length)'));assert.ok(s.includes('const total=s.per*s.seq.length'));assert.ok(s.includes('queueMicrotask'));assert.ok(!s.includes('cur%2===0'));assert.ok(!s.includes('120*'))});
