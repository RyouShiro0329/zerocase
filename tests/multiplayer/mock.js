(function(){
const qp=new URLSearchParams(location.search);const PID=qp.get('pid');
if(PID){const g=Storage.prototype.getItem;Storage.prototype.getItem=function(k){if(k==='zc5-pid')return JSON.stringify(PID);return g.call(this,k)}}
function makeRoom(name){
  const bc=new BroadcastChannel('mock-'+name);const peer=Math.random().toString(36).slice(2,10);
  const peers=new Map();let myPres={};const ls={},pls=[];let closed=false;
  const self=()=>({peer,by:null,isMe:true,sameTab:true,kind:'viewer',guest:false,presence:myPres,updatedAt:Date.now()});
  peers.set(peer,self());
  const fire=(j,l,u)=>{const ps=[...peers.values()];for(const f of pls)f({peers:ps,joined:j,left:l,updated:u})};
  bc.onmessage=e=>{const m=e.data;if(closed)return;
    if(m.k==='ev'){for(const f of ls[m.topic]||[])f({topic:m.topic,data:m.data,peer:m.peer,by:null,isMe:false,sameTab:false,kind:'viewer',guest:false})}
    else if(m.k==='pres'){const isNew=!peers.has(m.peer);const p={peer:m.peer,by:null,isMe:false,sameTab:false,kind:'viewer',guest:false,presence:m.presence,updatedAt:Date.now()};peers.set(m.peer,p);fire(isNew?[p]:[],[],isNew?[]:[p]);if(m.hello)bc.postMessage({k:'pres',peer,presence:myPres})}
    else if(m.k==='bye'){const p=peers.get(m.peer);if(p){peers.delete(m.peer);fire([],[p],[])}}};
  bc.postMessage({k:'pres',peer,presence:myPres,hello:1});
  addEventListener('beforeunload',()=>bc.postMessage({k:'bye',peer}));
  return {name,
    emit:async(topic,data)=>{{const n=new TextEncoder().encode(JSON.stringify(data)).length;window.__maxEmit=Math.max(window.__maxEmit||0,n);if(n>4096){console.error("emit too big "+n);throw {code:"invalid_argument"}}}bc.postMessage({k:'ev',topic,data,peer});for(const f of ls[topic]||[])f({topic,data,peer,by:null,isMe:true,sameTab:true,kind:'viewer',guest:false})},
    on:(t,f)=>{(ls[t]=ls[t]||[]).push(f);return()=>{ls[t]=ls[t].filter(x=>x!==f)}},
    presence:async patch=>{myPres=Object.assign({},myPres,patch);if(new TextEncoder().encode(JSON.stringify(myPres)).length>4096)throw {code:'invalid_argument'};peers.set(peer,self());bc.postMessage({k:'pres',peer,presence:myPres});fire([],[],[self()])},
    peers:()=>[...peers.values()],
    onPeers:f=>{pls.push(f);setTimeout(()=>f({peers:[...peers.values()],joined:[...peers.values()],left:[],updated:[]}),0);return()=>{}},
    connected:()=>true,onConnection:f=>{setTimeout(()=>f(true));return()=>{}},
    leave:async()=>{closed=true;bc.postMessage({k:'bye',peer});bc.close()}};
}
window.claude={use:async n=>n==='room'?{join:async name=>makeRoom(name)}:null};
})();
