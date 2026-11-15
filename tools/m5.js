// draft-day trades with the v25.7c values and cash: SRC=src SEED=n node tools/m5.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||777);
console.log(run(`(function(){const L=newLeague({mode:'team',userTeam:0,size:30});L.user=null;
while(L.phase==='regular')simDay(L);startPlayoffs(L);while(L.phase==='playoffs')simPlayoffDay(L);startOffseason(L);runLottery(L);startDraft(L);
const n0=L.trades.length;while(L.draftIdx<L.draftOrder.length)aiDraftPick(L);
const d=L.trades.slice(0,L.trades.length-n0).filter(t=>t.when==='Draft');
return 'draft trades '+d.length+'\\n'+L.log.filter(x=>/Draft-day trade/.test(x.text)).map(x=>'  '+x.text).join('\\n')+'\\ncash sent: '+L.teams.filter(t=>t.cashTr&&t.cashTr.sent).map(t=>t.abbr+' '+t.cashTr.sent).join(', ');})()`));
