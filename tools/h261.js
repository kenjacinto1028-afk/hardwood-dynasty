// v26.1 harness: SRC=src SEED=n node tools/h261.js [seasons]  (AI-only league)
// per season: trades, payroll / dead money never negative, incentives held / paid, kickers / opt-outs / guarantees, promises broken
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||1);
console.log(run(`(function(N){const L=newLeague({mode:'commish',size:30});const o=[];let bad=[];let totPaid=0;
for(let y=0;y<N;y++){const t0=Date.now();let g=0;
 let paidBefore=0;
 while(L.phase==='regular')simDay(L);processPending(L);
 const incsHeld=active(L).filter(p=>p.team!=null&&p.contract).reduce((a,p)=>a+incsOf(p.contract).length,0);
 startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);
 const S=L.season,paid=active(L).reduce((a,p)=>a+(p.contract?incsOf(p.contract).filter(x=>x.paid===S).length:0),0),paidAmt=active(L).reduce((a,p)=>a+(p.contract?incsOf(p.contract).filter(x=>x.paid===S).reduce((s,x)=>s+x.amt,0):0),0);
 totPaid+=paid;
 runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);
 const cs=capSeason(L);let negPay=0,negDead=0,dead=0;
 for(const t of L.teams){for(const yy of [cs,cs+1,cs+2]){const pr=payroll(L,t,yy);if(!(pr>=0)||isNaN(pr))negPay++;}for(const d of t.dead||[]){if(!(d.amt>=0)||isNaN(d.amt))negDead++;dead+=d.amt;}}
 const cons=active(L).filter(p=>p.team!=null&&p.contract).map(p=>p.contract);
 const kick=cons.filter(c=>c.kick>0).length,eto=cons.filter(c=>c.eto).length,gtd=cons.filter(c=>c.gtd!=null&&c.gtd<1).length,role=cons.filter(c=>c.role).length,broken=cons.filter(c=>c.role&&(c.role.br||[]).length).length,nan=cons.filter(c=>isNaN(c.amt)||c.amt<0).length;
 const tr=(L.trades||[]).filter(r=>r.s===S).length;
 if(negPay||negDead||nan)bad.push('S'+(y+1)+' negPay '+negPay+' negDead '+negDead+' badAmt '+nan);
 o.push('S'+(y+1)+' trades '+tr+' incsHeld '+incsHeld+' paid '+paid+' ($'+paidAmt.toFixed(1)+'M) dead $'+dead.toFixed(1)+'M kick '+kick+' eto '+eto+' gtd '+gtd+' role '+role+' broken '+broken+' negPay '+negPay+' negDead '+negDead+' ms '+(Date.now()-t0));
 if(y<N-1)startNewSeason(L);}
o.push('TOTAL incentives paid '+totPaid+'; problems: '+(bad.length?bad.join(' | '):'none'));
return o.join('\\n');})(${+process.argv[2]||2})`));
