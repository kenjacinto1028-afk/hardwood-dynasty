// exploit replays: SRC=src N=30 node tools/m2.js
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||777);
console.log(run(`(function(){const L=newLeague({mode:'team',userTeam:0,size:${process.env.N||30}});const o=[];
while(L.phase==='regular')simDay(L);startPlayoffs(L);while(L.phase==='playoffs')simPlayoffDay(L);startOffseason(L);runLottery(L);L.phase='off-lottery';
const r1=L.draftOrder.filter(x=>x.rd===1),pk=x=>L.picks.find(k=>k.s===L.season&&k.rd===x.rd&&k.orig===x.orig);
const u=L.user,U=L.teams[u];
const give=(ids,picks)=>({players:ids||[],picks:picks||[]});
const tryT=(lab,owner,gp,gk)=>{for(const k of [...gp.picks,...gk.picks]){} const res=evaluateUserTrade(L,owner,gp,gk);const AI=L.teams[owner];const gain=assetsValue(L,AI,gp,false),loss=assetsValue(L,AI,gk,true);o.push(lab+' -> '+(res.ok?'ACCEPT':'NO')+'  AI('+AI.mode+') gets '+gain.toFixed(1)+' gives '+loss.toFixed(1)+'  '+res.msg.slice(0,90));};
// move picks to the user so we can test any combination
const own=(k)=>{k.owner=u;const o2=draftSlotOf(L,k);if(o2)o2.owner=u;};
const p1=pk(r1[0]),p6=pk(r1[5]),p7=pk(r1[6]),p11=pk(r1[10]);
const hold1=L.teams[r1[0].owner];
// make user tanking for the projection test
U.mode='tank';U.status='tank';
own(p6);own(p7);own(p11);
const fut=L.picks.find(k=>k.s===L.season+1&&k.rd===1&&k.orig===u);
o.push('user status '+U.mode+' next-yr 1st '+pickRange(L,fut)+' pts '+Math.round(pickPtsNow(L,fut))+' ; #1 pts '+Math.round(pickPtsNow(L,p1))+' #6 '+Math.round(pickPtsNow(L,p6))+' #7 '+Math.round(pickPtsNow(L,p7))+' #11 '+Math.round(pickPtsNow(L,p11)));
if(r1[0].owner===u){o.push('user owns #1; skip');return o.join('\\n');}
tryT('#11 + next 1st for #1',hold1.id,give([],[p11.id,fut.id]),give([],[p1.id]));
tryT('#6 + #7 for #1',hold1.id,give([],[p6.id,p7.id]),give([],[p1.id]));
const r2=L.draftOrder.filter(x=>x.rd===2).slice(0,3).map(pk);r2.forEach(own);
tryT('#31+#32+#33 for #6',L.teams[r1[5].orig].id===u?hold1.id:hold1.id,give([],r2.map(k=>k.id)),give([],[p1.id]));
const p15=pk(r1[14]),p16=pk(r1[15]),p17=pk(r1[16]),p3=pk(r1[2]);[p15,p16,p17].forEach(own);
if(r1[2].owner!==u)tryT('#15+#16+#17 for #3',r1[2].owner,give([],[p15.id,p16.id,p17.id]),give([],[p3.id]));
const p2=pk(r1[1]);if(r1[1].owner!==u)tryT('#6+#7+#11 for #2',r1[1].owner,give([],[p6.id,p7.id,p11.id]),give([],[p2.id]));
return o.join('\\n');})()`));
