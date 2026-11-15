// v25.8: tanking team trades 3 firsts for a superstar. SRC=src SEED=n DAYS=d node tools/m6.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||777);
console.log(run(`(function(){const L=newLeague({mode:'team',userTeam:0,size:30});for(let i=0;i<${process.env.DAYS||40};i++)simDay(L);const o=[];
const U=L.teams[L.user];
// make the user's team the worst: swap its best players for the worst team's worst? simpler: pick the worst projected team as the user
const P=projRanks(L);const worst=L.teams.slice().sort((a,b)=>P.r[a.id][0]-P.r[b.id][0])[0];L.user=worst.id;const T=worst;T.mode='tank';T.status='tank';
const my=L.picks.filter(k=>k.orig===T.id&&k.owner===T.id&&k.rd===1).sort((a,b)=>a.s-b.s).slice(0,3);
const stars=active(L).filter(p=>p.team!=null&&p.team!==T.id&&p.ovr>=80).sort((a,b)=>b.ovr-a.ovr).slice(0,12);
let acc=0,n=0;
for(const p of stars){const B=L.teams[p.team];const give={players:[],picks:my.map(k=>k.id)},get={players:[p.id],picks:[]};
 const sides=tradeSides(T.id,B.id,give,get);
 const before=my.map(k=>Math.round(pickPtsNow(L,k))),after=withCtx(sides,()=>my.map(k=>Math.round(pickPtsNow(L,k))));
 const ranges=my.map(k=>pickRange(L,k)+' -> '+withCtx(sides,()=>pickRange(L,k)));
 // salary may block; evaluate value only
 const v=dealView(L,B,T.id,give,get,sides),ok=v.gain>=v.loss*1.05;n++;if(ok)acc++;
 const yl=p.contract?p.contract.exp-capSeason(L)+1:0;
 o.push(B.abbr+'('+B.mode+','+foOf(L,B).style+',b'+foOf(L,B).belief+') '+p.name+' '+p.ovr+' age '+p.age+' yl '+yl+(p.tradeReq===L.season?' REQ':'')+' | picks '+before.join('/')+' -> '+after.join('/')+' | '+ranges.join(', ')+' | gain '+v.gain.toFixed(1)+' loss '+v.loss.toFixed(1)+' '+(ok?'ACCEPT':'no')+(v.notes.length?' ['+v.notes.join('; ')+']':''));}
o.push('accepted '+acc+' of '+n);return o.join('\\n');})()`));
