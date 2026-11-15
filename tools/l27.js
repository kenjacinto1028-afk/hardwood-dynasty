// v27 L2/L3: SEED=n node tools/l27.js [seasons] -> icon trades, Curry / Jokic / SGA team each season, GSW status, old-star teams tanking 2 years in a row
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
run(`(function(N){const L=newLeague({mode:'commish',nba:true,games:82});const P=n=>Object.values(L.players).find(p=>p.name===n);
const W=['Stephen Curry','Nikola Jokic','Shai Gilgeous-Alexander','Joel Embiid','Jayson Tatum','Kevin Durant','LeBron James','Giannis Antetokounmpo'].map(P);let shopped={};
const tk={};
for(let y=1;y<=N;y++){let g=0;const st0=L.teams.map(t=>t.status);
 while(L.phase==='regular'&&g++<400){simDay(L);if(L.day%10===0){for(const p of W){if(!p||p.team==null)continue;const s=tradeStatus(L,p);if(s&&s.k==='block')shopped[p.last]=(shopped[p.last]||0)+1;}}}
 const gsw=L.teams.find(t=>t.abbr==='GSW');const line=W.map(p=>p?p.last+':'+(p.retired?'ret':p.team!=null?L.teams[p.team].abbr:'FA')+'/'+p.ovr:'').join(' ');
 const two=L.teams.filter(t=>t.status==='tank'&&tk[t.id]===y-1&&rosterOf(L,t).some(p=>p.age>=32&&p.ovr>=82)).map(t=>t.abbr);L.teams.forEach(t=>{if(t.status==='tank')tk[t.id]=y;});
 console.log('S'+y+' GSW '+gsw.status+' | '+line+(two.length?' | 2yr tank w/ old star: '+two:''));
 processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);startNewSeason(L);}
const it=(L.feed||[]).filter(x=>x.ev==='icon').length;console.log('shopped (block) counts: '+JSON.stringify(shopped)+' | icon-trade posts in feed: '+it);
})(${+process.argv[2]||8})`);
