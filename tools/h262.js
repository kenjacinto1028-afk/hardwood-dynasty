// v26.2 Stepien trace: SRC=src SEED=n node tools/h262.js [seasons]  -> every time a team gains a Stepien gap, which call did it (trade record, phase)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||4);
console.log(run(`(function(N){const L=newLeague({mode:'commish',size:30});const out=[];let last={};
const snap=()=>{const g={};L.teams.forEach(t=>g[t.id]=stepienGaps(L,t.id,null).join(','));return g;};
const chk=(tag)=>{const g=snap();for(const id in g)if(g[id]&&g[id]!==(last[id]||''))out.push('S'+L.season+' '+L.phase+' d'+L.day+' team '+L.teams[id].abbr+' gaps '+g[id]+' after '+tag+(L.trades[0]?' | last trade: '+JSON.stringify(L.trades[0]).slice(0,260):''));last=g;};
for(let y=0;y<N;y++){let g=0;while(L.phase==='regular'){simDay(L);chk('day');}processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);chk('playoffs');
 startOffseason(L);chk('offseason');runLottery(L);chk('lottery');startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);chk('draft');startFA(L);g=0;while(L.phase==='off-fa'&&g++<40){faDay(L);chk('fa');}processPending(L);if(y<N-1){startNewSeason(L);chk('newseason');}}
return out.join('\\n')||'no gaps';})(${+process.argv[2]||12})`));
