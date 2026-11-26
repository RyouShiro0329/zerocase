// PR-E：在瀏覽器頁面執行，使用螢幕座標；旋轉後的矩形也適用。
function inspectLayout(selectors){
 const issues=[],stage=document.querySelector('#stage'),S=stage.getBoundingClientRect();
 const rect=r=>({left:r.left,right:r.right,top:r.top,bottom:r.bottom,width:r.width,height:r.height});
 const inside=(r,b)=>r.left>=b.left-1&&r.right<=b.right+1&&r.top>=b.top-1&&r.bottom<=b.bottom+1;
 const shown=e=>e.getClientRects().length&&getComputedStyle(e).visibility!=='hidden'&&!e.closest('[hidden]');
 if(!inside(S,{left:0,top:0,right:innerWidth,bottom:innerHeight}))issues.push('舞台超出螢幕');
 const panels=[];
 for(const selector of selectors){const e=document.querySelector(selector);if(!e||!shown(e)){issues.push('缺少可見區塊 '+selector);continue}
  const r=e.getBoundingClientRect();panels.push({selector,rect:rect(r)});if(r.width<=1||r.height<=1||!inside(r,S))issues.push('區塊超出舞台 '+selector);
 }
 const buttons=[];
 for(const container of selectors){const root=document.querySelector(container);if(!root)continue;
  for(const b of root.querySelectorAll('button')){if(!shown(b))continue;const r=b.getBoundingClientRect();if(r.width<1||r.height<1){issues.push('按鈕無面積 '+b.textContent);continue}
   // 可捲動區內的按鈕允許在視窗外，但必須完全位於捲動內容中；四個邊界都檢查。
   let clip=null;for(let a=b.parentElement;a&&a!==stage;a=a.parentElement){const c=getComputedStyle(a);if(/auto|scroll/.test(c.overflowX+' '+c.overflowY)){clip=a;break}}
   if(clip){const r0=clip.getBoundingClientRect(),rot=stage.classList.contains('r90');
    const horizontalOK=rot?r.top>=r0.top-1&&r.bottom<=r0.bottom+1:r.left>=r0.left-1&&r.right<=r0.right+1;
    const start=rot?r.left-r0.left+clip.scrollTop:r.top-r0.top+clip.scrollTop;
    const extent=rot?r.width:r.height;
    // r90 的垂直捲動方向在螢幕上由右向左，轉回未旋轉的 offset 座標計算。
    const localStart=rot?r0.right-r.right+clip.scrollTop:start;
    if(!horizontalOK||localStart< -1||localStart+extent>clip.scrollHeight+1)issues.push('捲動內容裁切 '+b.textContent.trim());
   }else if(!inside(r,S))issues.push('按鈕超出舞台 '+b.textContent.trim());
   if(b.scrollWidth>b.clientWidth+1||b.scrollHeight>b.clientHeight+1)issues.push('按鈕文字裁切 '+b.textContent.trim());
   const c=getComputedStyle(b);if(c.pointerEvents==='none'&&!b.disabled)issues.push('按鈕無法操作 '+b.textContent.trim());
   buttons.push({text:b.textContent.trim().slice(0,50),rect:rect(r),scrollable:!!clip});
  }
 }
 // 同一捲動區中的兄弟操作按鈕不得重疊；不把捲動視窗外的內容當裁切。
 for(let i=0;i<buttons.length;i++)for(let j=i+1;j<buttons.length;j++){const a=buttons[i].rect,b=buttons[j].rect;if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>2&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>2)issues.push('操作按鈕重疊 '+buttons[i].text+'／'+buttons[j].text)}
 // 主要雙欄不得相互蓋住；只檢查同時存在的內容區。
 if(selectors.includes('#logp')&&selectors.includes('#chp')){const a=document.querySelector('#logp').getBoundingClientRect(),b=document.querySelector('#chp').getBoundingClientRect();if(Math.min(a.right,b.right)-Math.max(a.left,b.left)>1&&Math.min(a.bottom,b.bottom)-Math.max(a.top,b.top)>1)issues.push('紀錄與選項重疊')}
 return {issues,panels,buttons,stage:rect(S)};
}
const CRITICAL=['[hidden]','#stage','#stage.r90','#app','.cols','#logp','#log','#chp','#choices','.ch','.ov','.box','#qte','#qte .qbx'];
function cssRules(html){const css=[...html.matchAll(/<style[^>]*>([\s\S]*?)<\/style>/g)].map(m=>m[1]).join('\n').replace(/\/\*[\s\S]*?\*\//g,'');const out={};
 for(const selector of CRITICAL){const rows=[...css.matchAll(/([^{}]+)\{([^{}]*)\}/g)].filter(m=>m[1].split(',').map(x=>x.trim()).includes(selector)).map(m=>m[2].replace(/\s+/g,' ').trim());if(!rows.length)throw Error('缺少重要 CSS '+selector);out[selector]=rows}return out;
}
module.exports={inspectLayout,cssRules};
