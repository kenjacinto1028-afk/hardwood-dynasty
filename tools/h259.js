// v25.9 balance: SRC=src SEED=n node tools/h259.js [seasons] -> growth by coachability, D by motor, FA leavers by money/loyalty, injuries by durability
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||2);
console.log(run(`(function(N){const L=newLeague({mode:'commish',size:30});const o=[];
const grow={lo:[],mid:[],hi:[]},dres={lo:[],mid:[],hi:[]},inj={lo:[],mid:[],hi:[]};let leave={hiMon:[0,0],loMon:[0,0],hiLoy:[0,0]};
const b3=(v,a,b)=>v<a?'lo':v>b?'hi':'mid';const avg=a=>a.length?(a.reduce((x,y)=>x+y,0)/a.length).toFixed(2):'-';
for(let y=0;y<N;y++){let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 const ps=active(L).filter(p=>p.team!=null&&!p.prospect&&p.stats.rs&&p.stats.rs.gp>=20);
 // D residual vs ovr: dbpm minus a linear fit on ovr
 const xs=ps.map(p=>p.ovr),ys=ps.map(p=>p.stats.rs.dbpm||0);const mx=xs.reduce((a,b)=>a+b)/xs.length,my=ys.reduce((a,b)=>a+b)/ys.length;const sl=xs.reduce((a,x,i)=>a+(x-mx)*(ys[i]-my),0)/xs.reduce((a,x)=>a+(x-mx)*(x-mx),0);
 ps.forEach((p,i)=>dres[b3(trv(p,'mot'),45,67)].push(ys[i]-my-sl*(xs[i]-mx)));
 active(L).filter(p=>p.team!=null&&!p.prospect).forEach(p=>inj[b3(trv(p,'dur'),55,75)].push((p.injuries||[]).filter(x=>x.s===L.season).reduce((a,x)=>a+x.games,0)));
 const young=active(L).filter(p=>p.team!=null&&!p.prospect&&p.age<=23).map(p=>[p,p.ovr]);
 const exp=active(L).filter(p=>p.team!=null&&p.contract&&p.contract.exp===L.season&&p.ovr>=65).map(p=>[p,p.team]);
 startOffseason(L);young.forEach(([p,b])=>{if(!p.retired)grow[b3(trv(p,'cch'),45,67)].push(p.ovr-b);});
 runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);
 exp.forEach(([p,t])=>{if(p.retired)return;const left=p.team!==t?1:0;if(trv(p,'mon')>=70){leave.hiMon[0]++;leave.hiMon[1]+=left;}if(trv(p,'mon')<=40){leave.loMon[0]++;leave.loMon[1]+=left;}if(trv(p,'loy')>=70){leave.hiLoy[0]++;leave.hiLoy[1]+=left;}});
 if(y<N-1)startNewSeason(L);}
o.push('growth (age<=23) by coachability lo/mid/hi: '+avg(grow.lo)+' / '+avg(grow.mid)+' / '+avg(grow.hi)+'  n '+grow.lo.length+'/'+grow.mid.length+'/'+grow.hi.length);
o.push('DBPM residual by motor lo/mid/hi: '+avg(dres.lo)+' / '+avg(dres.mid)+' / '+avg(dres.hi));
o.push('games lost to injury by durability lo/mid/hi: '+avg(inj.lo)+' / '+avg(inj.mid)+' / '+avg(inj.hi));
o.push('expiring 65+ who changed teams [n, left]: '+JSON.stringify(leave));
return o.join('\\n');})(${+process.argv[2]||4})`));
