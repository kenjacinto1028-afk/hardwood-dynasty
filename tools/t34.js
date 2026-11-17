// v34 unit checks: node tools/t34.js   (SEED=n default 21; uses tools/snap/nba-team-s10.json.gz)
// A1 re-sign (owner stretch for own stars), A3 top-rating cap, A4 young asks; B legends' awards from NBA_HX.aw;
// C scouting: director pro rating, department level (cost, slots, tighter reads, window), pro fog (own players exact, size, better scout
//   tighter, commissioner none), AI free-agent value from its read, pro report text, draft accuracy rows, old-save migration
const SEED = +process.env.SEED || 21, SNAP = process.env.SNAP || 'tools/snap/nba-team-s10.json.gz';
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = require('./snap.js')(process.env.SRC || 'src', SEED, SNAP);
const J = c => JSON.parse(run(`JSON.stringify((function(){const L=SL;${c}})())`));
// ---------- C: pro fog ----------
{
  const r = J(`const u=L.user,ps=active(L).filter(p=>!p.prospect&&p.team!=null);const d=[];for(const p of ps)if(p.team!==u)d.push(proOvr(L,u,p)-p.ovr);
    const a=d.map(Math.abs).sort((x,y)=>x-y);const own=ps.filter(p=>p.team===u);
    const fa=L.fa.map(id=>L.players[id]).filter(p=>p&&!p.retired&&!p.prospect);
    const p0=ps.find(p=>p.team!==u&&(p.hist||[]).filter(h=>h.rs&&h.rs.gp>=10).length>=1&&!(p.hist||[]).some(h=>h.tid===u)&&p.lastTeam!==u);
    const sc=L.teams[u].scout;const keep=[sc.pro,L.teams[u].scoutLv];sc.pro=85;L.teams[u].scoutLv=0;const sHi=proSd(L,u,p0);sc.pro=40;const sLo=proSd(L,u,p0);L.teams[u].scoutLv=2;const sLoE=proSd(L,u,p0);sc.pro=keep[0];L.teams[u].scoutLv=keep[1]||0;
    const attrOwn=own.every(p=>proAttr(L,u,p,'tp')===p.tp);const attrDiff=ps.filter(p=>p.team!==u).some(p=>proAttr(L,u,p,'tp')!==p.tp);
    const md=L.mode;L.mode='commish';const com=ps.filter(p=>p.team!==u).every(p=>proOvr(L,u,p)===p.ovr);L.mode=md;
    const ks=fa.concat(ps.filter(p=>p.team!==u&&p.team!==(u+3)%L.teams.length)).map(p=>proValK(L,(u+3)%L.teams.length,p));   /* v36a: free agents + other teams' players (the v36a save starts with 9 free agents) */
    const rep=proReport(L,u,ps.find(p=>p.team!==u&&p.ovr>=70));const txt=fl('sc.pro',{name:'X',role:rep.role,lo:rep.lo,hi:rep.hi},3)+fl('sc.proconf',{conf:rep.conf,why:rep.why.join(', ')},1);
    return {n:d.length,mean:d.reduce((x,y)=>x+y,0)/d.length,med:a[a.length>>1],max:a[a.length-1],own:own.every(p=>proOvr(L,u,p)===p.ovr),attrOwn,attrDiff,sHi,sLo,sLoE,com,kMin:Math.min(...ks),kMax:Math.max(...ks),kAvg:ks.reduce((x,y)=>x+y,0)/ks.length,rep:!!rep,ownRep:proReport(L,u,own[0]),txt,
      teamOvrProspect:(()=>{const q=active(L).find(x=>x.prospect);return q?teamOvr(L,u,q)===ovrRead(L,u,q):true;})()};`);
  chk('C pro fog: own players exact (OVR + ratings), others read', r.own && r.attrOwn && r.attrDiff, `${r.n} others`);
  chk('C pro fog Medium: median miss 1-2, max <= 6, no bias', r.med >= 1 && r.med <= 2 && r.max <= 6 && Math.abs(r.mean) < 0.5, `median ${r.med}, max ${r.max}, mean ${r.mean.toFixed(2)}`);
  chk('C better pro scout and bigger department read tighter', r.sHi < r.sLo && r.sLoE < r.sLo && r.sHi <= 1.3, `pro 85 ${r.sHi.toFixed(2)}, pro 40 ${r.sLo.toFixed(2)}, pro 40 Elite ${r.sLoE.toFixed(2)}`);
  chk('C commissioner mode: no pro fog for you', r.com);
  chk('C AI free-agent value from its read: 0.8-1.25, about 1 on average', r.kMin >= 0.8 && r.kMax <= 1.25 && Math.abs(r.kAvg - 1) < 0.04, `${r.kMin.toFixed(2)}-${r.kMax.toFixed(2)}, avg ${r.kAvg.toFixed(3)}`);
  chk('C pro report: other teams yes, own no; sc.* text filled', r.rep && r.ownRep === null && !/[{}]/.test(r.txt), r.txt.slice(0, 120));
  chk('C prospects keep the draft read', r.teamOvrProspect);
}
// ---------- C: department level, director pro rating ----------
{
  const r = J(`const u=L.user,t=L.teams[u],q=active(L).find(x=>x.prospect);t.scoutLv=0;const ph=L.phase;
    const base={sd:readSd(L,u,q),slots:assignMax(L,u),iv:interviewMax(L,u),cost:staffCost(L,t)};
    const e1=setScoutLv(L,u,2);L.phase='off-fa';t.staffBudget=99;const e2=setScoutLv(L,u,2);
    const el={sd:readSd(L,u,q),slots:assignMax(L,u),iv:interviewMax(L,u),cost:staffCost(L,t)};
    t.staffBudget=0.1;t.scoutLv=0;const e3=setScoutLv(L,u,2);L.phase=ph;
    const sc=genScout(L);const pool=(L.scoutPool||[]).concat(L.teams.map(x=>x.scout)).filter(Boolean);
    const old=JSON.parse(JSON.stringify(t.scout));delete t.scout.pro;migrateLeague(L);
    L.teams.forEach(x=>aiScoutLv(L,x));const lv=L.teams.map(x=>x.scoutLv||0);
    return {base,el,e1:!!e1,e2,e3:!!e3,pro:sc.pro,allPro:pool.every(s=>s.pro!=null),mig:t.scout.pro!=null&&t.scout.pro===scoutProOf(t.scout),lv,userLv:t.scoutLv};`);
  chk('C department: Elite = 5 slots, 7 interviews, reads x0.7, costs $2M', r.el.slots === 5 && r.el.iv === 7 && Math.abs(r.el.sd / r.base.sd - 0.7) < 0.02 && Math.abs(r.el.cost - r.base.cost - 2) < 0.01, JSON.stringify(r.el));
  chk('C department: Standard = 3 slots, 5 interviews, no cost (as before)', r.base.slots === 3 && r.base.iv === 5, JSON.stringify(r.base));
  chk('C department: change only in the window and within the staff budget', r.e1 && r.e2 === null && r.e3);
  chk('C AI teams pick levels (some above Standard); yours untouched', r.lv.some(x => x > 0) && r.lv.every(x => x >= 0 && x <= 2), r.lv.join(''));
  chk('C directors have a pro rating; old saves get one on load (from his rating)', r.pro >= 25 && r.allPro && r.mig);
}
// ---------- C: draft accuracy (rows for past classes) ----------
{
  const r = J(`const a=draftAccuracy(L);return {n:a.length,r:a[0]};`);
  chk('C draft accuracy: rows for classes 2+ seasons back (real order + consensus)', r.n >= 3 && r.r.pick && r.r.cons && r.r.pick.r > 0.3, JSON.stringify(r.r));
}
// ---------- A: young asks, top cap, owner stretch ----------
{
  const r = J(`const keep=L.askShift;L.askShift=-4;const ys=active(L).filter(p=>!p.prospect&&p.age<=25);let mx=0,n=0,lo=true;
    for(const p of ys){const c=lowAskCap(L,p);if(p.ovr>=56&&p.ovr<=59){n++;mx=Math.max(mx,c.cap/MINSAL);}if(p.ovr<=55&&(!c||c.cap!==MINSAL))lo=false;}
    const big=active(L).filter(p=>!p.prospect&&p.age<=25&&p.ovr<=59).map(p=>rampAmt(L,p,30));L.askShift=keep;
    return {n,mx,lo,u10:big.every(v=>v<10)};`);
  chk('A4 young 56-59 ask at most 2.4x the minimum even when the league is weaker (shift -4)', r.n >= 3 && r.mx <= 2.41, `${r.n} players, max ${r.mx.toFixed(2)}x`);
  chk('A4 young 55- at the minimum; under 60 never $10M', r.lo && r.u10);
  const t = J(`const ps=active(L).filter(p=>!p.prospect&&!p.retired);const p=ps.sort((a,b)=>b.ovr-a.ovr)[0];const q=ps[1];const g=p.gen;p.gen=false;q.gen=true;
    growTo(p,99,Math.max(p.age,25));p.ovr=ovr(p);p.pot=99;growTo(q,99,Math.max(q.age,25));q.ovr=ovr(q);q.pot=99;const before=[p.ovr,q.ovr];
    nbaBalance(L,{});const c95=ps.filter(x=>x.ovr>=95).length;return {before,after:[p.ovr,q.ovr],pot:[p.pot,q.pot],c95,c98:ps.filter(x=>x.ovr>=98&&!x.gen).length};`);
  chk('A3 top cap: none 98+ (a generational talent may reach 98), ceilings 97 / 98', t.after[0] <= 97 && t.after[1] <= 98 && t.pot[0] <= 97 && t.pot[1] <= 98 && t.c98 === 0, JSON.stringify(t));
  const o = J(`const t=L.teams.find(x=>x.owner&&!x.owner.tight&&x.id!==L.user);const p=rosterOf(L,t).sort((a,b)=>b.ovr-a.ovr)[0];const room=Math.max(t.owner.limit,ownerPay(L,t))+5-ownerPay(L,t);
    return {star:p.ovr,a:resignOwnerOK(L,t,p,room+8),b:resignOwnerOK(L,t,p,room+40),own:ownerOK(L,t,room+8)};`);
  chk('A1 owner stretches for his own star on a re-sign (not without limit)', o.star >= 75 ? (o.a && !o.b && !o.own) : true, JSON.stringify(o));
}
// ---------- B: legends' awards ----------
{
  const r = J(`const lg=nbaLegends();const tp=lg.find(l=>l.name==='Tony Parker'),mj=lg.find(l=>l.name==='Michael Jordan');
    return {tp:hxTopAwards(tp),mj:hxTopAwards(mj),fz:hxAwKey('Mike Jordan',1984,2002),h:(hxHonors('Mike Jordan',1984,2002).m1||[]).length};`);
  chk('B legends Top awards from NBA_HX.aw (Tony Parker no All-NBA 1st; Jordan 5 MVP, 10 1st, 14 All-Star)', !r.tp['All-NBA 1st'] && r.mj.MVP === 5 && r.mj['All-NBA 1st'] === 10 && r.mj['All-Star'] === 14, JSON.stringify(r.mj));
  chk('B name spelled differently still matches (Mike Jordan -> Michael Jordan)', r.fz === 'michael jordan' && r.h === 10);
}
console.log(out.join('\n')); console.log(`t34: ${ok}/${ok + bad} pass`); process.exit(bad ? 1 : 0);
