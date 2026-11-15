// v25.8 checks: SRC=<src> node t258.js (needs load.js)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||3);
console.log(run(`(function(){const res=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const L=newLeague({mode:'team',userTeam:0,size:30});for(let i=0;i<40;i++)simDay(L);
const P=projRanks(L),T=L.teams.slice().sort((a,b)=>P.r[a.id][0]-P.r[b.id][0])[0];
const star=active(L).filter(x=>x.team!=null&&x.team!==T.id).sort((a,b)=>b.ovr-a.ovr)[0],B=L.teams[star.team];
const my=L.picks.filter(k=>k.orig===T.id&&k.rd===1).sort((a,b)=>a.s-b.s);
const sides=tradeSides(T.id,B.id,{players:[],picks:my.map(k=>k.id)},{players:[star.id],picks:[]});
const b=my.map(k=>pickPtsNow(L,k)),a=withCtx(sides,()=>my.map(k=>pickPtsNow(L,k)));
ok('after adding a star, every one of his team\\'s 1sts is worth less',a.every((v,i)=>v<b[i]),b.map(Math.round)+' -> '+a.map(Math.round));
ok('the future 1sts drop more than this year\\'s (share)',(b[1]-a[1])/b[1]>(b[0]-a[0])/b[0],((b[0]-a[0])/b[0]).toFixed(2)+' vs '+((b[1]-a[1])/b[1]).toFixed(2));
ok('outside the trade nothing changes',pickPtsNow(L,my[0])===b[0]&&!TRADE_CXT_LEAK());
function TRADE_CXT_LEAK(){return TRADE_CTX!==null;}
ok('rosters restored after a what-if',T.roster.indexOf(star.id)<0&&B.roster.indexOf(star.id)>=0);
const bp=L.picks.filter(k=>k.orig===B.id&&k.rd===1&&k.s>L.season);const bb=bp.map(k=>pickPtsNow(L,k)),ba=withCtx(sides,()=>bp.map(k=>pickPtsNow(L,k)));
ok('the team selling its star: its future 1sts rise',ba.every((v,i)=>v>=bb[i])&&ba.some((v,i)=>v>bb[i]),bb.map(Math.round)+' -> '+ba.map(Math.round));
const ot=L.teams.find(x=>x.id!==T.id&&x.id!==B.id),ok2=L.picks.find(k=>k.orig===ot.id&&k.rd===1);ok('a third team\\'s pick is unchanged',Math.abs(withCtx(sides,()=>pickPtsNow(L,ok2))-pickPtsNow(L,ok2))/pickPtsNow(L,ok2)<0.15);
// front office and noise
const fos=L.teams.map(t=>foOf(L,t));ok('front-office styles: all three appear',['picks','neutral','win'].every(s=>fos.some(f=>f.style===s)),fos.map(f=>f.style[0]).join(''));
ok('belief 0.5-1.0',fos.every(f=>f.belief>=0.5&&f.belief<=1));
const n1=dealNoise(L,1,2);ok('deal noise within ±8%',n1>=0.92&&n1<=1.08,n1.toFixed(3));ok('noise is the same on a second ask',dealNoise(L,1,2)===n1);
const R0=Math.random();ok('foOf/dealNoise do not use the game RNG',(()=>{const s=Math.random;let used=0;Math.random=()=>{used++;return s();};foOf(L,{id:99,abbr:'ZZZ'});dealNoise(L,3,4);Math.random=s;return used===0;})());
// leverage
const q=star;const l0=sellLeverage(L,B,q).m;q.tradeReq=L.season;const l1=sellLeverage(L,B,q).m;q.tradeReq=null;ok('a trade request lowers the seller\\'s ask',l1<l0,l0+' -> '+l1);
// grades still work and use the after-trade view
const g=tradeGrades(L,T.id,B.id,{players:[],picks:my.map(k=>k.id)},{players:[star.id],picks:[]});ok('grades computed',!!g.a&&!!g.b,g.a+'/'+g.b);
return res.join('\\n')+'\\n'+res.filter(x=>x.startsWith('FAIL')).length+' failed of '+res.length;})()`));
