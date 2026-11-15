const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||777);
console.log(run(`(function(){const L=newLeague({mode:'team',userTeam:0,size:${process.env.N||30}});const o=[];
const show=lab=>{o.push('== '+lab+' phase '+L.phase+' day '+L.day);
 const ks=L.picks.filter(k=>k.rd===1).sort((a,b)=>a.s-b.s||pickProj(L,a).mean-pickProj(L,b).mean);
 for(const s of [...new Set(ks.map(k=>k.s))]){o.push(' draft '+s+': '+ks.filter(k=>k.s===s).map(k=>L.teams[k.orig].abbr+'('+L.teams[k.orig].mode[0]+')'+pickRange(L,k)+'='+Math.round(pickPtsNow(L,k))).join(' '));}
 o.push(' rd2 '+L.picks.filter(k=>k.rd===2&&k.s===nextDraftS(L)).map(k=>Math.round(pickPtsNow(L,k))).sort((a,b)=>b-a).join(' '));};
let t0=Date.now();show('preseason');o.push('ms '+(Date.now()-t0));
for(let i=0;i<120;i++)simDay(L);show('day120');
const t=Date.now();for(let i=0;i<200;i++){PROJ_C=null;PP_C=null;for(const k of L.picks)pickTV(L,L.teams[0],k);}o.push('200 full recomputes ms '+(Date.now()-t));
return o.join('\\n');})()`));
