const {chromium}=require('playwright');
(async()=>{const b=await chromium.launch();const p=await b.newPage();await p.goto('http://localhost:8769/README.md');
 const r=await p.evaluate(async()=>{const ac=new OfflineAudioContext(1,44100,44100);const o={};
  for(const s of ['bgm_hitman_battle','bgm_hitman_intense'])for(const e of ['ogg','mp3']){const ab=await (await fetch('sfx/'+s+'.'+e)).arrayBuffer();let buf;try{buf=await ac.decodeAudioData(ab)}catch(err){o[s+'.'+e]='decode fail '+err;continue}
   const d=buf.getChannelData(0);let i=0;while(i<d.length&&Math.abs(d[i])<0.01)i++;
   // 找第一個大於 0.3 的峰值（起拍）
   let j=0;while(j<d.length&&Math.abs(d[j])<0.3)j++;
   o[s+'.'+e]={dur:buf.duration.toFixed(4),firstSoundMs:(i/buf.sampleRate*1000).toFixed(1),firstPeakMs:(j/buf.sampleRate*1000).toFixed(1)}}
  return o});console.log(JSON.stringify(r,null,1));await b.close()})();
