// 測試用無敵模式（Claude 2026-11-16，主人：現在不測平衡，測試可以直接開無敵）
// 只在測試的瀏覽器頁面裡注入，遊戲本體（index.html）沒有這個開關，玩家看不到也開不了。
// 做的事：隊伍生命一直補滿、不會倒下或死亡、恐懼與感染歸零、不餓不渴、不流血不燒；
//         戰鬥中的敵人生命壓到 1、防禦歸零，打中一下就倒，戰鬥不會拖住步數。
// QTE、擲骰、時間、警戒、劇情檢定都照常跑（要測的是程式與文字，不是數值）。
// 用法：await page.evaluate(GOD) —— 在開局之後、G 已經存在時呼叫一次。
const GOD=`(()=>{if(window.__god)return;window.__god=1;
 const heal=()=>{if(typeof G==='undefined'||!G||!G.players||G.over)return;
  for(const p of G.players){p.dead=0;p.down=0;p.mad=0;p.hp=p.max;p.fe=0;p.inf=0;p.hun=Math.max(p.hun||0,8);p.thi=Math.max(p.thi||0,8);p.bleed=0;p.burn=0;p.held=0}
  if(G.fight&&G.fight.foes)for(const f of G.fight.foes)if(!f.dead){if(f.hp>1)f.hp=1;f.def=0}};
 window.__godHeal=heal;
 const dc=deathCheck;deathCheck=async function(){heal();return dc.apply(this,arguments)};
 setInterval(heal,80);heal()})()`;
module.exports={GOD};
