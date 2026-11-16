// v27.13 U9: team money over N seasons (cash, revenue, expenses, profit). SEED=n node tools/u9.js [seasons]
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(function(N){const L=newLeague({mode:'commish',nba:true,games:${+process.env.G||82}});const out=[];
const snap=y=>{const c=L.teams.map(t=>t.cash||0),f=L.teams.map(t=>{const h=(t.finHist||[]).slice(-1)[0];return h?[h.revenue,h.expenses,h.profit]:[0,0,0]});
 const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;out.push('S'+y+' cash min '+Math.min(...c).toFixed(0)+' avg '+avg(c).toFixed(0)+' max '+Math.max(...c).toFixed(0)+' neg '+c.filter(x=>x<0).length+' | rev '+avg(f.map(x=>x[0])).toFixed(0)+' exp '+avg(f.map(x=>x[1])).toFixed(0)+' profit avg '+avg(f.map(x=>x[2])).toFixed(1)+' min '+Math.min(...f.map(x=>x[2])).toFixed(0)+' max '+Math.max(...f.map(x=>x[2])).toFixed(0)+' | cap '+CAP+' tax '+TAXLINE);};
for(let y=1;y<=N;y++){let g=0;
 while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);snap(y);startNewSeason(L);}
const c=L.teams.map(t=>[t.abbr,Math.round(t.cash||0)]).sort((a,b)=>a[1]-b[1]);out.push('lowest '+c.slice(0,4).join(' ')+' | highest '+c.slice(-4).join(' '));
return out.join('\\n');})(${+process.argv[2]||10})`));
