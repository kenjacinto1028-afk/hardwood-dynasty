// v25.7 (Opus part) checks: SRC=<src> node t257.js   (needs load.js next to it)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||777);
console.log(run(`(function(){const res=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const L=newLeague({mode:'team',userTeam:0,size:30});
ok('curve: 60 slots',PICK_PTS.length===60);
ok('curve: #1 1000, #5 690, #6 500, #14 380, #15 300, #30 110, #31 100, #45 58, #46 45, #60 10',[1,5,6,14,15,30,31,45,46,60].map(i=>PICK_PTS[i-1]).join()==='1000,690,500,380,300,110,100,58,45,10');
ok('curve: never rises',PICK_PTS.every((v,i)=>i===0||v<=PICK_PTS[i-1]));
ok('#6 + #7 < #1 (no bundling)',PICK_PTS[5]+PICK_PTS[6]<PICK_PTS[0]);
ok('bundleSum 100/80/60/40',Math.abs(bundleSum([10,10,10,10,10])-(10+8+6+4+4))<1e-9);
ok('bundleSum: burdens count in full',Math.abs(bundleSum([10,-3])-7)<1e-9);
const M=lotteryMatrix(L);ok('lottery matrix rows sum to 1',M.slice(1).every(r=>Math.abs(r.reduce((a,b)=>a+b,0)-1)<1e-9));
ok('worst team: 14% at #1 (±1.5)',Math.abs(M[1][1]-0.14)<0.015,M[1][1].toFixed(3));
ok('playoff team rank 20 picks 20th',M[20][20]===1);
const nd=L.picks.filter(k=>k.s===L.season&&k.rd===1).sort((a,b)=>pickProj(L,a).mean-pickProj(L,b).mean);
ok('projection: worst team pick worth more than best team pick',pickPtsNow(L,nd[0])>pickPtsNow(L,nd[nd.length-1])*2);
const r2=L.picks.filter(k=>k.s===L.season&&k.rd===2).map(k=>pickPtsNow(L,k)),r1=nd.map(k=>pickPtsNow(L,k));
ok('best 2nd < worst 1st (same draft)',Math.max(...r2)<Math.min(...r1),Math.round(Math.max(...r2))+' < '+Math.round(Math.min(...r1)));
const k3=L.picks.find(k=>k.s===L.season+2&&k.rd===1&&k.orig===nd[0].orig);ok('3-years-out pick worth less than next one',pickPtsNow(L,k3)<pickPtsNow(L,nd[0]));
ok('pickRange text',/^(Top \\d+|#\\d+-\\d+|~#\\d+|#\\d+)$/.test(pickRange(L,nd[0])),pickRange(L,nd[0]));
// exploit replay after the lottery
while(L.phase==='regular')simDay(L);startPlayoffs(L);while(L.phase==='playoffs')simPlayoffDay(L);startOffseason(L);runLottery(L);
const DO=L.draftOrder.filter(x=>x.rd===1),pk=x=>L.picks.find(k=>k.s===L.season&&k.rd===x.rd&&k.orig===x.orig),u=L.user;
const own=k=>{k.owner=u;const o=draftSlotOf(L,k);if(o)o.owner=u;};
const p1=pk(DO[0]);if(DO[0].owner===u){const sw=L.teams.find(t=>t.id!==u).id;p1.owner=sw;DO[0].owner=sw;}
const H=DO[0].owner,p6=pk(DO[5]),p7=pk(DO[6]),p11=pk(DO[10]);[p6,p7,p11].forEach(own);
const fut=L.picks.find(k=>k.s===L.season+1&&k.rd===1&&k.orig===u);fut.owner=u;
ok('known pick has range #n',pickRange(L,p1)==='#1');
ok('#11 + next 1st for #1 declined',!evaluateUserTrade(L,H,{players:[],picks:[p11.id,fut.id]},{players:[],picks:[p1.id]}).ok);
ok('#6 + #7 for #1 declined',!evaluateUserTrade(L,H,{players:[],picks:[p6.id,p7.id]},{players:[],picks:[p1.id]}).ok);
// coach targets: core spots respected
const t=L.teams[u],ps=rosterOf(L,t).sort((a,b)=>b.ovr-a.ovr);const cp=ps[0];
ok('setCore works',setCore(L,cp,true)===null&&cp.core);
ps.slice(1,4).forEach(p=>setCore(L,p,true));ok('core max 4',setCore(L,ps[4],true)!==null);
const kept=keptSpots(L,t);let over=0,n=0;for(const tab of ['plan','now','dev'])for(const x of coachTargets(L,t,'trade',tab)){n++;if(takesSpot(L,t,x.p,kept))over++;}
ok('no target takes a core spot',over===0,n+' targets');
ok('dev tab: all 24 or younger',coachTargets(L,t,'trade','dev').every(x=>x.p.age<=24));
t.status='tank';t.mode='tank';ok('plan tab for a tanking team: 25 and under',coachTargets(L,t,'trade','plan').every(x=>x.p.age<=25));
const pr=positionRead(L,t);// two early 2nds (bundled) vs a top-100 player
{const P=active(L).filter(p=>p.team!=null).sort((a,b)=>b.ovr-a.ovr),near=P.slice(94,105).map(q=>{const v=L.teams.filter(x=>x.id!==q.team).map(x=>playerTV(L,x,q,false)).sort((a,b)=>a-b);return v[v.length>>1];}).sort((a,b)=>a-b),top100=near[5];
const hop=L.teams.find(x=>x.mode==='hopeful')||L.teams[1],r2k=L.draftOrder.filter(x=>x.rd===2).slice(0,2).map(pk);ok('two best 2nds (known, hopeful team) < top-100 player',bundleSum(r2k.map(k=>pickTV(L,hop,k)))<top100,bundleSum(r2k.map(k=>pickTV(L,hop,k))).toFixed(2)+' < '+top100.toFixed(2));}
// v25.7c cash
{const A=L.teams[1],B=L.teams[2];A.cashTr=null;B.cashTr=null;
ok('cash: value $1M = 6 pts (neutral owner)',Math.abs(cashTV(L,{owner:{},cash:30},1)-0.18)<1e-9);
ok('cash: over the limit refused',!!cashCheck(L,A,B,CASH_MAX+1));
const c0=A.cash||0;moveCash(L,A,B,3);ok('cash: room after sending $3M',cashRoom(L,A).send===2&&cashRoom(L,B).get===2);
ok('cash: second $3M refused',!!cashCheck(L,A,B,3));ok('cash: team cash not touched until the season closes',(A.cash||0)===c0);
const k30=pk(DO[29]),k31=pk(L.draftOrder.filter(x=>x.rd===2)[0]),T=L.teams.find(x=>x.mode==='hopeful')||L.teams[3],v30=pickTV(L,T,k30),v31=pickTV(L,T,k31);
ok('#31 + up to $5M cash can reach #30 (x1.02)',v31+cashTV(L,T,5)>=v30*1.02,v31.toFixed(2)+' + '+cashTV(L,T,5).toFixed(2)+' vs '+(v30*1.02).toFixed(2));}
ok('position read: 5 rows with lines',pr.length===5&&pr.every(r=>r.line&&!/\\{/.test(r.line)),pr.map(r=>r.status).join());
return res.join('\\n')+'\\n'+res.filter(x=>x.startsWith('FAIL')).length+' failed of '+res.length;})()`));
