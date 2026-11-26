const fs=require('node:fs'),path=require('node:path'),crypto=require('node:crypto');
function preserve(source,dest,{all=false}={}){
 fs.mkdirSync(dest,{recursive:true});const files=[];
 function walk(dir,relative=''){
  for(const e of fs.readdirSync(dir,{withFileTypes:true})){
   if(e.isSymbolicLink())continue;
   const rel=path.join(relative,e.name),full=path.join(dir,e.name);
   if(e.isDirectory()){if(!['.git','tests','img','sfx','fx','fonts','node_modules'].includes(e.name))walk(full,rel);continue}
   if(!e.isFile()||!(/\.(?:json|log|txt|exit|png)$/.test(e.name)))continue;
   const target=path.join(dest,rel);fs.mkdirSync(path.dirname(target),{recursive:true});fs.copyFileSync(full,target);
   const bytes=fs.readFileSync(full);files.push({path:rel,bytes:bytes.length,sha256:crypto.createHash('sha256').update(bytes).digest('hex')});
  }
 }
 for(const e of fs.readdirSync(source,{withFileTypes:true}))if(e.isDirectory()&&!e.isSymbolicLink()&&(all||['v06','v10'].includes(e.name)))walk(path.join(source,e.name),e.name);
 const report={all,files};fs.writeFileSync(path.join(dest,'manifest.json'),JSON.stringify(report,null,2));return report;
}
function verifyV06(out){
 const files=fs.readdirSync(out).filter(n=>/^v06-state-.*\.json$/.test(n));
 if(files.length!==3)return false;
 return files.every(f=>{const r=JSON.parse(fs.readFileSync(path.join(out,f)));return !r.error&&r.waits.length===6&&r.waits.every(w=>typeof w.ms==='number'&&w.before.ready&&w.after.ready&&w.before.gbusy===1&&w.after.gbusy===1)});
}
if(require.main===module){try{
 if(process.argv[2]==='verify')process.exitCode=verifyV06(process.argv[3])?0:1;
 else preserve(process.argv[2],process.argv[3],{all:process.argv[4]==='all'});
}catch(e){console.error(e.stack);process.exitCode=1}}
module.exports={preserve,verifyV06};
