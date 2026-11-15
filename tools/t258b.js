// v25.8 S3: acceptance of "3 firsts for a star" by a tanking buyer. SRC=src SEEDS=5 DAYS=40 node tools/t258b.js
const seeds=+process.env.SEEDS||5,agg={};let tot=0,accT=0;
for(let sd=1;sd<=seeds;sd++){const {run}=require('./load.js')(process.env.SRC||'src',sd*17);
const rows=JSON.parse(run(`(function(){const L=newLeague({mode:'team',userTeam:0,size:30});for(let i=0;i<${process.env.DAYS||40};i++)simDay(L);
const P=projRanks(L),T=L.teams.slice().sort((a,b)=>P.r[a.id][0]-P.r[b.id][0])[0];L.user=T.id;T.mode='tank';T.status='tank';
const my=L.picks.filter(k=>k.orig===T.id&&k.owner===T.id&&k.rd===1).sort((a,b)=>a.s-b.s).slice(0,3);const cs=capSeason(L);
const stars=active(L).filter(p=>p.team!=null&&p.team!==T.id&&p.ovr>=82).sort((a,b)=>b.ovr-a.ovr).slice(0,40);const o=[];
for(const p of stars){const B=L.teams[p.team],give={players:[],picks:my.map(k=>k.id)},get={players:[p.id],picks:[]},sides=tradeSides(T.id,B.id,give,get);
 const v=dealView(L,B,T.id,give,get,sides),yl=p.contract?p.contract.exp-cs+1:0;
 o.push({ovr:p.ovr,yl,req:p.tradeReq===L.season||(p.morale!=null&&p.morale<30),mode:B.mode,fo:foOf(L,B).style,ok:v.gain>=v.loss*1.05});}
return JSON.stringify(o);})()`));
for(const r of rows){tot++;if(r.ok)accT++;const keys=['all','ovr'+(r.ovr>=90?'90+':r.ovr>=86?'86-89':'82-85'),r.req||r.yl<=1?'asked/1yr':'happy',r.ovr>=90&&r.yl>=3&&!r.req?'90+,3yr+,happy':null,'seller:'+r.mode,'fo:'+r.fo,'yl:'+Math.min(r.yl,4)].filter(Boolean);
 for(const k of keys){agg[k]=agg[k]||[0,0];agg[k][1]++;if(r.ok)agg[k][0]++;}}}
for(const k of Object.keys(agg).sort())console.log(k.padEnd(22),(agg[k][0]+'/'+agg[k][1]).padEnd(8),(100*agg[k][0]/agg[k][1]).toFixed(0)+'%');
