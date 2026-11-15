// v25.8 short AI harness (v26.0: counts this season's trade records; L.trades is newest-first and capped at 200, so the old slice(n0) went to 0 after ~4 seasons): SRC=src SEED=n node tools/h258.js [seasons]  -> per season trades, mix, counters, ms
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(function(N){const L=newLeague({mode:'commish',size:30});const o=[];const hasC=typeof DEAL_CNT!=='undefined';
for(let y=0;y<N;y++){const t0=Date.now();if(hasC){DEAL_CNT.chk=DEAL_CNT.blocked=DEAL_CNT.view=DEAL_CNT.star2=0;}
 while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);let g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);
 const S0=L.season,tr=(L.trades||[]).filter(r=>r.s===S0),mix={plyr:0,dump:0,pick:0,mix:0};tr.forEach(r=>mix[tradeTypeRec(r)]++);
 o.push('S'+(y+1)+' trades '+tr.length+' mix '+JSON.stringify(mix)+(hasC?' cnt '+JSON.stringify(DEAL_CNT):'')+' ms '+(Date.now()-t0));
 if(y<N-1)startNewSeason(L);}
return o.join('\\n');})(${+process.argv[2]||2})`));
