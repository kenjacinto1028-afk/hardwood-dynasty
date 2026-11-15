// v26.3: SRC=src SEED=n node tools/h263.js [seasons] -> AI swaps made / resolved, opt-outs, trades, Stepien gaps
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(function(N){const L=newLeague({mode:'commish',size:30});const o=[];
for(let y=0;y<N;y++){SWAP_CNT.made=0;const t0=Date.now();let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);const open0=(L.swaps||[]).length;runLottery(L);const used=L.log.filter(x=>x.season===L.season&&/swap/i.test(x.text)&&x.cat==='draft').length;
 startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);
 const tr=L.trades.filter(x=>x.s===L.season),sw=tr.filter(x=>/swap/.test(x.aGets+x.bGets)).length;
 const eto=active(L).filter(p=>p.contract&&p.contract.eto).length,etoUsed=L.log.filter(x=>x.season===L.season&&/opted out of the rest/.test(x.text)).length;
 const gaps=L.teams.filter(t=>stepienGaps(L,t.id,null).length).length;
 o.push('S'+(y+1)+' trades '+tr.length+' with swaps '+sw+' (built '+SWAP_CNT.made+') swaps resolved at lottery '+used+' open '+(L.swaps||[]).length+' | opt-outs held '+eto+' used '+etoUsed+' | Stepien gaps '+gaps+' | ms '+(Date.now()-t0));
 if(y<N-1)startNewSeason(L);}
return o.join('\\n');})(${+process.argv[2]||4})`));
