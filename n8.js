// v27 N8: SEED=n node tools/n8.js [seasons]  -> max tiers for ever-All-Stars, est rows on 5 random role players, HOF inductions over N seasons (default 0 = skip)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
const N=+process.argv[2]||0;
console.log(run(`(function(N){const out=[];const L=newLeague({mode:'commish',nba:true,games:${+process.env.G||82}});
const real=Object.values(L.players).filter(p=>p.real);
// 1. contracts: ever-All-Stars get the 30%+ tier; supermax eligibility from real awards
const as=real.filter(p=>p.awards.some(a=>a.real&&a.a==='All-Star'));
const bad=as.filter(p=>maxFor(p)<CAP*0.30-1e-6);
out.push('ever-All-Stars '+as.length+', below 30% tier: '+bad.length+(bad.length?' '+bad.map(p=>p.name).join(', '):''));
out.push('supermax-eligible at start: '+real.filter(p=>superOK(L,p)).map(p=>p.name).join(', '));
const cAt=p=>{const c=p.contract||(p.contracts&&p.contracts[0]);return c?c.amt:null};
const rows=as.map(p=>[p.name,p.age,p.ovr,p.svc,(maxFor(p)/CAP*100).toFixed(0)+'%',money(p.mval||0),cAt(p)!=null?money(cAt(p)):'-']).sort((a,b)=>b[2]-a[2]);
out.push('top / bottom ever-All-Stars (name age ovr svc tier mval contract):');for(const r of rows.slice(0,5).concat(rows.slice(-6)))out.push('  '+r.join(' | '));
const old=as.filter(p=>p.ovr<70);out.push('ever-All-Stars below 70 ovr: '+old.length+' | mval avg '+(old.reduce((a,p)=>a+(p.mval||0),0)/Math.max(1,old.length)).toFixed(1)+' vs CAP '+CAP);
// 2. est rows, 5 random role players
const role=real.filter(p=>typeof nbaEstRows==='function'&&(nbaEstRows(p)||[]).some(r=>r.est));
for(let i=0;i<5&&role.length;i++){const p=role.splice(Math.floor(Math.random()*role.length),1)[0];const R=nbaEstRows(p);out.push('EST '+p.name+' (age '+p.age+', ovr '+p.ovr+')');
 for(const r of R){const g=r.gp||1;out.push('   '+r.season+' '+(r.team||'')+(r.est?' est':' REAL')+' gp '+r.gp+' mpg '+(r.mp/g).toFixed(1)+' ppg '+(r.pts/g).toFixed(1)+' rpg '+(((r.orb||0)+(r.drb||0))/g).toFixed(1)+' apg '+(r.ast/g).toFixed(1)+' fg% '+(r.fga?(r.fgm/r.fga*100).toFixed(0):'-')+' 3pa '+(r.tpa/g).toFixed(1));}}
// 3. HOF over N seasons
const yr=s=>(2026+s)+'';const hof=[];const ret=[];
for(let k=0;k<N;k++){let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 const h0=L.hof.length;const pre=new Set(Object.values(L.players).filter(p=>!p.retired&&p.ovr>=78).map(p=>p.id));startOffseason(L);for(const id of pre){const p=L.players[id];if(p&&p.retired===L.season)ret.push(yr(L.season)+' '+p.name+' age '+p.age+' ovr '+p.ovr+' why '+p.retireWhy);}runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);
 for(const h of L.hof.slice(h0)){const p=L.players[h.pid]||{};const n=k=>(p.awards||[]).filter(a=>a.a===k).length;hof.push(yr(L.season)+' '+h.name+(p.real?' (real)':' (sim)')+' legacy '+h.score+' AS '+n('All-Star')+' MVP '+n('MVP')+' AL1 '+n('All-League 1st Team')+' age '+p.age);}
 startNewSeason(L);}
if(N){out.push('HOF inductions over '+N+' seasons: '+hof.length);out.push(...hof.map(x=>'  '+x));
 const retired=Object.values(L.players).filter(p=>p.real&&p.retired&&p.awards.some(a=>a.a==='All-Star'));out.push('retired real ever-All-Stars: '+retired.length+', in HOF '+retired.filter(p=>p.hof).length+' | missed: '+retired.filter(p=>!p.hof).map(p=>p.name+' '+(p.legacy||0)).join(', '));
 out.push('hofMin '+hofMin(L));out.push('78+ players retiring: '+ret.length);out.push(...ret.map(x=>'  '+x));}
return out.join('\\n');})(${N})`));
