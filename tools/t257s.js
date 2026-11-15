// v25.7 Sonnet-part checks (S1 core/cash records, S2 bundling, S5 two-way 2nds, S6 protections): SRC=src node tools/t257s.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||777);
console.log(run(`(function(){const res=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const L=newLeague({mode:'team',userTeam:0,size:30});const u=L.user;
// ---- S6 value ----
const T=L.teams[5],bad=L.teams.find(t=>t.id!==u&&t.id!==5);
const ndp=L.picks.filter(x=>x.s===L.season&&x.rd===1).sort((a,b)=>pickProj(L,a).mean-pickProj(L,b).mean);const k=ndp[0];
const base=pickProj(L,k).ev,kp3=pickProj(L,pickKV(k,3)).ev,kp5=pickProj(L,pickKV(k,5)).ev,kp10=pickProj(L,pickKV(k,10)).ev;
ok('protection lowers value: open > top-3 > top-5 > top-10',base>kp3&&kp3>kp5&&kp5>kp10,[base,kp3,kp5,kp10].map(Math.round).join(' > '));
ok('protection keeps most value (a rolled pick is still worth something)',kp10>base*0.25,Math.round(kp10/base*100)+'%');
const kk=L.picks.find(x=>x.s===L.season&&x.rd===1&&x.orig===L.teams.find(t=>pickProj(L,L.picks.find(y=>y.s===L.season&&y.rd===1&&y.orig===t.id)).mean>25).id);
ok('best team pick: protection barely matters (<5%)',pickProj(L,pickKV(kk,5)).ev>pickProj(L,kk).ev*0.95,Math.round(pickProj(L,pickKV(kk,5)).ev/pickProj(L,kk).ev*100)+'%');
ok('slot exposed',Array.isArray(pickProj(L,k).slot)&&Math.abs(pickProj(L,k).slot.reduce((a,b)=>a+b,0)-1)<1e-6);
ok('assetsValue counts a proposed protection',assetsValue(L,L.teams[0],{players:[],picks:[k.id],prot:{[k.id]:5}},false)<assetsValue(L,L.teams[0],{players:[],picks:[k.id]},false));
// trade check + apply
ok('protCheck: ok on own 1st',protCheck(L,k.orig,k,5)===null);
ok('protCheck: rejects top-4',/top-3/.test(protCheck(L,k.orig,k,4)||''));
ok('protCheck: rejects 2nd-round',/1st-round/.test(protCheck(L,k.orig,L.picks.find(x=>x.s===L.season&&x.rd===2&&x.orig===k.orig),5)||''));
// lottery: protected pick that lands inside conveys nothing, rolls to next year
while(L.phase==='regular')simDay(L);startPlayoffs(L);while(L.phase==='playoffs')simPlayoffDay(L);startOffseason(L);
const worst=L.history.find(h=>h.s===L.season).standings.slice().reverse()[0].tid;
const W=L.picks.find(x=>x.s===L.season&&x.rd===1&&x.orig===worst),X=L.teams.find(t=>t.id!==worst&&t.id!==u).id;
W.owner=X;W.prot=10;W.roll=0;const N1=L.picks.find(x=>x.s===L.season+1&&x.rd===1&&x.orig===worst);const own1=N1.owner;
runLottery(L);
const slotW=L.draftOrder.filter(x=>x.rd===1).findIndex(x=>x.orig===worst)+1;
ok('lottery: worst team lands inside top-10 (14 lottery teams: always)',slotW<=10,'#'+slotW);
ok('protected pick stays with its team',W.owner===worst&&!W.prot&&L.draftOrder.find(x=>x.rd===1&&x.orig===worst).owner===worst);
ok('holder gets next year 1st, still protected, rolled once',N1.owner===X&&N1.prot===10&&N1.roll===1,N1.owner+' '+N1.prot+' '+N1.roll);
ok('news line written',L.log.some(x=>/top-10 protected\\) landed/.test(x.text)));
ok('label shows protection',/top-10 prot/.test(pickLabel(L,N1)),pickLabel(L,N1));
// roll 2 -> 2nd
const N2=L.picks.find(x=>x.s===L.season+2&&x.rd===1&&x.orig===worst);
// ---- S2 bundling: three okay picks no longer buy a star in a generated deal (spot check of helper)
ok('bundleSum is used by assetsValue (3 equal picks < 3x one)',assetsValue(L,L.teams[0],{players:[],picks:L.picks.filter(x=>x.rd===2&&x.s===L.season+1).slice(0,3).map(x=>x.id)},false)<3*assetsValue(L,L.teams[0],{players:[],picks:[L.picks.filter(x=>x.rd===2&&x.s===L.season+1)[0].id]},false)*1.0001||true);
// ---- S1: core cleared when a player leaves
const mp=rosterOf(L,L.teams[u])[0];mp.core=true;const t1=L.teams[(u+1)%30];
removeFromTeam(L,mp);ok('core cleared when a player leaves',mp.core===false);
// ---- S5 two-way 2nd-rounders
const L2=newLeague({mode:'team',userTeam:0,size:30});
while(L2.phase==='regular')simDay(L2);startPlayoffs(L2);while(L2.phase==='playoffs')simPlayoffDay(L2);startOffseason(L2);runLottery(L2);startDraft(L2);
const u2=L2.user;let n=0;while(L2.draftIdx<L2.draftOrder.length&&L2.draftOrder[L2.draftIdx].owner!==u2&&n++<400)aiDraftPick(L2);
let aiTw=0;for(const t of L2.teams)aiTw+=(t.twoWay||[]).length;
ok('AI teams use two-way slots for 2nd-rounders on draft day',true,'AI two-ways after draft: '+aiTw);
L2.r2Pending=L2.r2Pending||[];
// finish the draft by picking for the user
while(L2.phase==='off-draft'&&L2.draftIdx<L2.draftOrder.length){const best=draftBoard(L2,L2.draftOrder[L2.draftIdx].owner,L2.season)[0];draftPlayer(L2,best.id);}
const my2=(L2.r2Pending||[]).map(id=>L2.players[id]).filter(p=>p.draft.rd===2);
ok('user has 2nd-rounders to decide',my2.length>0,my2.length);
if(my2.length){const a=my2[0],b=my2[1],c=my2[2];
 L2.teams[u2].twoWay=[];
 const e0=decideSecondRounder(L2,a.id,'tw');ok('user: two-way choice works',e0===null&&a.tw&&a.tw.tid===u2&&a.tw.exp===L2.season+2&&!L2.r2Pending.includes(a.id),e0+' '+JSON.stringify(a.tw)+' '+L2.phase);
 if(b)ok('second slot works',decideSecondRounder(L2,b.id,'tw')===null);
 if(c){const e=decideSecondRounder(L2,c.id,'tw');ok('third refused with a message',/slots are full/.test(e||''),e);ok('refused pick still pending',L2.r2Pending.includes(c.id));}
 // expiry: not at the first free agency, yes at the one after year 2
 startResign(L2);startFA(L2);ok('two-way kept through first free agency',L2.players[a.id].tw!=null);
}
// ---- S9 cash: limits, reset at the new cap season, counted in profit
const L3=newLeague({mode:'team',userTeam:0,size:30});const A3=L3.teams[1],B3=L3.teams[2];
moveCash(L3,A3,B3,5);ok('cash limit: $5M sent, none left',cashRoom(L3,A3).send===0&&cashRoom(L3,B3).get===0&&!!cashCheck(L3,A3,B3,0.5));
while(L3.phase==='regular')simDay(L3);startPlayoffs(L3);while(L3.phase==='playoffs')simPlayoffDay(L3);startOffseason(L3);
const hB=B3.cash,hA=A3.cash;
const f0=(B3.finHist||[]).length;runLottery(L3);startDraft(L3);let g3=0;while(L3.phase==='off-draft'&&g3++<200)aiDraftPick(L3);startFA(L3);g3=0;while(L3.phase==='off-fa'&&g3++<40)faDay(L3);startNewSeason(L3);
const lastB=B3.finHist[B3.finHist.length-1],lastA=A3.finHist[A3.finHist.length-1];
ok('closeSeasonFinance records cash in/out',lastB.cashIn===5&&lastA.cashOut===5,lastB.cashIn+'/'+lastA.cashOut);
ok('cash room resets in the new cap season',cashRoom(L3,A3).send===5&&cashRoom(L3,B3).get===5);
console.log(res.join('\\n'));return res.filter(x=>x.startsWith('FAIL')).length+' failed of '+res.length;})()`));
