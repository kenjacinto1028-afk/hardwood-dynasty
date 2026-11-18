// Offensive-rebound fix check: one regular season from a saved league, league-wide per-team-game numbers.
// SRC=src SEED=21 SNAP=tools/snap/nba-commish-s10.json.gz node tools/oreb-check.js
const {run}=require('./snap.js')(process.env.SRC||'src',+process.env.SEED||21,process.env.SNAP||'tools/snap/nba-commish-s10.json.gz');
console.log(run(`(function(){const L=SL;let g=0;while(L.phase==='regular'&&g++<400)simDay(L);
const tg=L.teams.reduce((a,t)=>a+t.w+t.l,0),T={};for(const p of Object.values(L.players)){const s=p.stats&&p.stats.rs;if(!s||!s.gp)continue;for(const k of ['pts','orb','drb','fga','fgm','tpa','tpm','fta','ftm','tov','ast'])T[k]=(T[k]||0)+(s[k]||0);}
const pg=k=>+(T[k]/tg).toFixed(1),poss=(T.fga-T.orb+T.tov+0.44*T.fta)/tg;
const w=L.teams.map(t=>t.w/(t.w+t.l)),m=w.reduce((a,b)=>a+b,0)/w.length,sd=Math.sqrt(w.reduce((a,b)=>a+(b-m)*(b-m),0)/w.length);
const ps=Object.values(L.players).filter(p=>p.stats&&p.stats.rs&&p.stats.rs.gp>=50),top=(f)=>ps.slice().sort((a,b)=>f(b)-f(a)).slice(0,3).map(p=>p.name+' '+f(p).toFixed(1));
return JSON.stringify({ptsPerTeamGame:pg('pts'),orb:pg('orb'),drb:pg('drb'),fga:pg('fga'),fgPct:+(100*T.fgm/T.fga).toFixed(1),tpa:pg('tpa'),fta:pg('fta'),tov:pg('tov'),ast:pg('ast'),possessions:+poss.toFixed(1),ortg:+(100*T.pts/tg/poss).toFixed(1),winPctSpread:+sd.toFixed(3),
 bestRecord:L.teams.map(t=>t.abbr+' '+t.w+'-'+t.l).sort((a,b)=>+b.split(' ')[1].split('-')[0]-+a.split(' ')[1].split('-')[0]).slice(0,3),topScorers:top(p=>p.stats.rs.pts/p.stats.rs.gp),topRebounders:top(p=>(p.stats.rs.orb+p.stats.rs.drb)/p.stats.rs.gp)},null,1);})()`));
