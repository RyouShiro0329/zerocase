const {PNG}=require('pngjs');
function compare(expected,actual,{channel=24,ratio=.001}={}){
 const a=PNG.sync.read(expected),b=PNG.sync.read(actual);if(a.width!==b.width||a.height!==b.height)return {ok:false,reason:'截圖尺寸不同',changed:1};
 const diff=new PNG({width:a.width,height:a.height});let n=0;
 for(let i=0;i<a.data.length;i+=4){const bad=[0,1,2,3].some(k=>Math.abs(a.data[i+k]-b.data[i+k])>channel);if(bad)n++;diff.data[i]=bad?255:b.data[i]*.25;diff.data[i+1]=bad?0:b.data[i+1]*.25;diff.data[i+2]=bad?0:b.data[i+2]*.25;diff.data[i+3]=255}
 const changed=n/(a.width*a.height);return {ok:changed<=ratio,changed,pixels:n,diff:PNG.sync.write(diff)};
}
module.exports={compare};
