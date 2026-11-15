// v32h cleanup: node tools/t32h.js   (SEED=n default 21)
// A sixth man: plays 25+ min on average over 60 days; the partner starter's minutes hold
// B hard cap: AI trade that leaves next season over the hard cap is refused (your team may); AI team option declined over the cap;
//   an icon whose re-sign won't fit takes a discount or leaves (never signs over the cap)
// C save pruning: stale per-opponent season lines dropped, this season's kept, career lines intact; retired caches dropped; vs panel renders
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 21;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = load(SRC, SEED);
const J = c => JSON.parse(run(`JSON.stringify((function(){${c}})())`));

// ---------- A ----------
{
  const r = J(`const L=newLeague({mode:'commish',size:30,games:82,nba:true});let g=0;while(L.phase==='regular'&&g++<60)simDay(L);
    const by={};for(const p of Object.values(L.players)){const s=p.stats&&p.stats.rs;if(!s||s.gp<12||p.team==null||!p.role||p.roleT!==p.team)continue;(by[p.role]=by[p.role]||[]).push(s.min/60/s.gp);}
    const avg=a=>a.reduce((x,y)=>x+y,0)/a.length;return {six:avg(by.sixth),st:avg(by.starter),star:avg(by.star),n:by.sixth.length,early:SIX_EARLY};`);
  chk('sixth men average 25+ min (range 24-28)', r.six >= 25 && r.six <= 28, r.six.toFixed(1) + ' over ' + r.n);
  chk('starters and stars keep their minutes (26-32 / 32-35)', r.st >= 26 && r.st <= 32 && r.star >= 32 && r.star <= 35.5, r.st.toFixed(1) + ' / ' + r.star.toFixed(1));
}
// ---------- B ----------
run(`var L=newLeague({mode:'team',userTeam:5,size:30,games:82,nba:true}); computeMarket(L);`);
{
  const r = J(`const cs=capSeason(L),nx=cs+1;const ai=L.teams.filter(t=>t.id!==L.user);
    let res=null;
    for(const B of ai){for(const A of ai){if(A===B||isRivalry(L,A.id,B.id))continue;
      const X=rosterOf(L,A).find(p=>p.contract&&p.contract.exp>=nx+1&&p.contract.amt>=20&&!tradeRestricted(L,p));
      const E=rosterOf(L,B).find(p=>p.contract&&p.contract.exp===cs&&p.contract.amt>=X?.contract.amt/1.2&&p.contract.amt<=(X?X.contract.amt*1.2:0)&&!tradeRestricted(L,p));
      if(!X||!E)continue;
      const give={players:[X.id],picks:[]},get={players:[E.id],picks:[]};
      if(tradeCheck(L,A.id,B.id,give,get))continue;   // must be legal before the squeeze
      B.dead=B.dead||[];const d={amt:r1(Math.max(0,APRON-payNoFloor(L,B,nx)-X.contract.amt/2)),exp:nx,from:nx};B.dead.push(d);   // B's next season near the hard cap (dead money next year only)
      const e=tradeCheck(L,A.id,B.id,give,get);B.dead.pop();
      L.user=B.id;const eu=tradeCheck(L,A.id,B.id,give,get);L.user=5;res={e,eu};break;}if(res)break;}
    return res;`);
  chk('AI trade that would leave a team over the hard cap next season is refused', r && /hard cap next season/.test(r.e || ''), r && r.e);
  chk('your own team may take on next-season salary (it is your call)', r && !/hard cap next season/.test(r.eu || ''), r && r.eu);
  const o = J(`const S=L.season;L.phase='off-draft';const t=L.teams.find(x=>x.id!==L.user);const p=rotationOf(L,t)[0];p.contract.exp=S+1;p.contract.opt='TO';p.mval=p.contract.amt*1.2;
    t.dead=t.dead||[];t.dead.push({amt:r1(APRON-payNoFloor(L,t,S+1)+5),exp:S+1,from:S+1});
    for(const q of rosterOf(L,t))if(q.id!==p.id&&q.contract&&q.contract.exp===S)q.contract.exp=S+2;   // nobody else to decide
    startResign(L);const res={opt:p.contract&&p.contract.opt,exp:p.contract?p.contract.exp:S,S,pay:payNoFloor(L,t,S+1),tx:(p.tx||[]).find(x=>/team option/.test(x.t))};t.dead.pop();return res;`);
  chk('AI team option is declined when picking it up leaves the team over the hard cap', o.exp === o.S && /declined/.test((o.tx || {}).t || ''), JSON.stringify(o.tx));
  const ic = J(`const L2=newLeague({mode:'commish',size:30,games:82,nba:true});computeMarket(L2);const S=L2.season;L2.phase='off-draft';L2.user=null;
    let cases=[];for(const t of L2.teams){const p=rosterOf(L2,t).find(q=>iconTier(L2,q,t.id)>=1&&q.ovr>=60);if(!p)continue;p.contract.exp=S;p.contract.opt=null;p.ext=null;p.morale=80;
      for(const q of rosterOf(L2,t))if(q.id!==p.id&&q.contract&&q.contract.exp===S)q.contract.exp=S+2;
      t.dead=t.dead||[];t.dead.push({amt:r1(APRON-payNoFloor(L2,t,S+1)-2),exp:S+1,from:S+1});cases.push([p.id,t.id]);}
    startResign(L2);return cases.map(([id,tid])=>{const t=L2.teams[tid],p=L2.players[id];return {stay:p.team===tid,amt:p.team===tid?p.contract.amt:null,pay:+payNoFloor(L2,t,S+1).toFixed(1),hc:APRON};});`);
  chk('icons squeezed by the hard cap never re-sign over it (discount or leave)', ic.length >= 3 && ic.every(x => x.pay <= x.hc + 0.5) && ic.some(x => !x.stay), ic.length + ' cases, stayed ' + ic.filter(x => x.stay).length + ', max payroll ' + Math.max(...ic.map(x => x.pay)) + ' / hard cap ' + ic[0].hc);
}
// ---------- C ----------
{
  const r = J(`const L2=newLeague({mode:'commish',size:30,games:82,nba:true});let g=0;while(L2.phase==='regular'&&g++<25)simDay(L2);
    const p=active(L2).filter(q=>q.vs).sort((a,b)=>Object.keys(b.vs).length-Object.keys(a.vs).length)[0];
    const k0=Object.keys(p.vs)[0],car=JSON.stringify(Object.fromEntries(Object.entries(p.vs).map(([k,o])=>[k,[o.gp,o.pts,o.w]])));
    const kept=pruneSave(L2),still=Object.values(p.vs).some(o=>o.cs);   // same season: nothing stale
    const r0=retired=Object.values(L2.players).find(q=>!q.retired&&q.team==null)||active(L2)[0];r0.retired=true;r0.moraleParts={a:1};r0.disc={s:1};
    L2.season++;const n=pruneSave(L2);const car2=JSON.stringify(Object.fromEntries(Object.entries(p.vs).map(([k,o])=>[k,[o.gp,o.pts,o.w]])));
    const gone=!Object.values(p.vs).some(o=>o.cs);L2.season--;
    return {kept,still,n,gone,same:car===car2,ret:r0.moraleParts===undefined&&r0.disc===undefined};`);
  chk('pruning keeps this season\'s per-opponent lines', r.kept === 0 && r.still, 'removed ' + r.kept);
  chk('at a new season stale lines are dropped, career lines untouched', r.gone && r.same && r.n > 0, 'removed ' + r.n);
  chk('retired players drop mood/discipline caches', r.ret, '');
  const rt = J(`const L2=newLeague({mode:'commish',size:30,games:82,nba:true});let g=0;while(L2.phase==='regular'&&g++<20)simDay(L2);
    const p=active(L2).filter(q=>q.vs).sort((a,b)=>Object.keys(b.vs).length-Object.keys(a.vs).length)[0];const before=JSON.stringify(Object.values(p.vs).map(o=>[o.gp,o.w,o.min,o.pts,o.fgm,o.fga,o.tpm,o.tpa,o.ftm,o.fta,o.reb,o.ast,o.stl,o.blk,o.tov,o.po?o.po.pts:0]));
    const sz0=JSON.stringify(p.vs).length;p.retired=true;L2.season++;pruneSave(L2);L2.season--;const packed=Object.values(p.vs).every(Array.isArray),sz1=JSON.stringify(p.vs).length;
    const after=JSON.stringify(Object.values(p.vs).map(vsUnpack).map(o=>[o.gp,o.w,o.min,o.pts,o.fgm,o.fga,o.tpm,o.tpa,o.ftm,o.fta,o.reb,o.ast,o.stl,o.blk,o.tov,o.po?o.po.pts:0]));
    return {packed,same:before===after,sz0,sz1};`);
  chk('retired players\' lines vs each team are packed and read back the same', rt.packed && rt.same && rt.sz1 < rt.sz0 * 0.7, rt.sz0 + ' -> ' + rt.sz1 + ' bytes');
  const hook = /pruneSave\(L\)/.test(require('fs').readFileSync(SRC + '/league.js', 'utf8').split('function startNewSeason(L) {')[1].split('\n}\n')[0]);
  chk('pruning runs at every new season', hook, '');
}
console.log(out.join('\n')); console.log(`t32h: ${ok}/${ok + bad} pass`); process.exit(bad ? 1 : 0);
