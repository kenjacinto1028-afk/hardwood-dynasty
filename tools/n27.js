// v27 NBA mode: SEED=n node tools/n27.js [seasons] -> league per-game averages vs real 2025-26, standings vs projection, leaders, money
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(function(N){const L=newLeague({mode:'commish',nba:'${process.env.NBA||1}'==='1',games:82});const o=[];const proj=L.nba?NBA_PROJ:{};
for(let y=0;y<N;y++){
 while(L.phase==='regular')simDay(L);
 const ps=Object.values(L.players).filter(p=>p.stats&&p.stats.rs&&p.stats.rs.gp);const S={};for(const p of ps)for(const k in p.stats.rs)if(typeof p.stats.rs[k]==='number')S[k]=(S[k]||0)+p.stats.rs[k];
 const tg=L.teams.reduce((a,t)=>a+t.w+t.l,0);const pg=k=>(S[k]/tg).toFixed(1);
 if(y===0)o.push('keys '+Object.keys(S).join(','));
 o.push('S'+(y+1)+' per team-game: pts '+pg('pts')+' fga '+pg('fga')+' 3pa '+pg('tpa')+' fta '+pg('fta')+' reb '+((S.orb+S.drb)/tg).toFixed(1)+' ast '+pg('ast')+' tov '+pg('tov')+' stl '+pg('stl')+' blk '+pg('blk')+' | fg% '+(S.fgm/S.fga).toFixed(3)+' 3p% '+(S.tpm/S.tpa).toFixed(3)+' ft% '+(S.ftm/S.fta).toFixed(3)+'  (NBA 25-26 ~ pts 115 fga 89 3pa 37 fta 22 reb 44 ast 26.5 tov 14 | .470 .360 .780)');
 const st=L.teams.map(t=>[t.abbr,t.w,proj[t.abbr]]).sort((a,b)=>b[1]-a[1]);
 const n=st.length,mx=st.reduce((a,x)=>a+x[1],0)/n,my=st.reduce((a,x)=>a+x[2],0)/n;let sxy=0,sxx=0,syy=0;for(const x of st){sxy+=(x[1]-mx)*(x[2]-my);sxx+=(x[1]-mx)**2;syy+=(x[2]-my)**2;}
 o.push('standings: '+st.map(x=>x[0]+' '+x[1]+'('+x[2]+')').join(' ')+' | r='+(sxy/Math.sqrt(sxx*syy)).toFixed(2));
 const lead=k=>ps.filter(p=>p.stats.rs.gp>=50).sort((a,b)=>b.stats.rs[k]/b.stats.rs.gp-a.stats.rs[k]/a.stats.rs.gp).slice(0,6).map(p=>p.last+' '+(p.stats.rs[k]/p.stats.rs.gp).toFixed(1)).join(', ');
 o.push('pts: '+lead('pts')+' | ast: '+lead('ast')+' | blk: '+lead('blk'));
 o.push('money: pay avg '+(L.teams.reduce((a,t)=>a+payroll(L,t),0)/n).toFixed(1)+' over tax '+L.teams.filter(t=>payroll(L,t)>TAXLINE).length+' cash min '+Math.round(Math.min(...L.teams.map(t=>t.cash||0)))+' avg '+Math.round(L.teams.reduce((a,t)=>a+(t.cash||0),0)/n));
 if(y<N-1){processPending(L);startPlayoffs(L);let g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);o.push('champ '+L.teams[L.champs?L.champs[L.champs.length-1]?.tid??0:0]?.abbr);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);startNewSeason(L);
 o.push('S'+(y+2)+' start: pay avg '+(L.teams.reduce((a,t)=>a+payroll(L,t),0)/n).toFixed(1)+' FA signed rookies ok; top3 ovr '+Object.values(L.players).filter(p=>p.team!=null).sort((a,b)=>b.ovr-a.ovr).slice(0,3).map(p=>p.last+' '+p.ovr).join(', '));}
}
return o.join('\\n');})(${+process.argv[2]||1})`));
