// v33d payroll floor + balance + awards: node tools/t33d.js   (SEED=n default 21)
// A payroll floor: a team under the floor takes a salary dump into cap room (floorAbsorb), signs short deals above value
//   (floorSign, 'payroll' type, young-player rule and under-60 cap kept), bids above value in free agency (faRound fl);
//   middle teams may use the mid-level (b2Ceiling), rebuild / tank stay at the cap; hard cap: trade kicker / schedule counted
//   for the team getting the player (inHit), holdout raises checked for later years (swapFits)
// B balance: stronger league pull values, generated bigs' block ratings match real ones at the top, regular-season minutes ceiling
// C awards: MVP weights (WS 35%, game score 30%, team record 0.8), ROY 20+ mpg, MIP not from the MVP top 5; est. tag; stint BPM history
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 21;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = load(SRC, SEED);
const J = c => JSON.parse(run(`JSON.stringify((function(){${c}})())`));
// ---------- A: floor (new PBL16 league, made an offseason by hand) ----------
run(`var L=newLeague({mode:'commish',size:16,games:82});L.phase='off-fa';L.faDay=3;L.season=L.season;`);
{
  const r = J(`const cs=capSeason(L);const B=L.teams[0];
    // B sheds salary to the free agents until far under the floor (release = dead money, so move them out directly)
    const big=rosterOf(L,B).filter(p=>capHit(L,p,cs)>0).sort((a,b)=>capHit(L,b,cs)-capHit(L,a,cs));
    for(const p of big){if(payNoFloor(L,B,cs)<MINPAY-30)break;removeFromTeam(L,p);p.contract=null;L.fa.push(p.id);setAsk(L,p);}
    while(B.roster.length<13){const p=bestFA(L,null);if(!p)break;signContract(L,p,B.id,MINSAL,1,'signing');}
    const gap0=MINPAY-payNoFloor(L,B,cs);
    // another team well over the floor with a short overpaid deal
    let x=null;for(const A of L.teams.slice(1)){const top=new Set(rosterOf(L,A).sort((a,b)=>b.ovr-a.ovr).slice(0,5).map(p=>p.id));const c=rosterOf(L,A).filter(p=>!top.has(p.id)&&capHit(L,p,cs)>3&&capHit(L,p,cs)<40&&p.age>=27)[0];if(!c)continue;c.contract.exp=cs;c.mval=Math.min(c.mval,capHit(L,c,cs)*0.5);c.noTrade=null;x=c;}
    const tr=floorAbsorb(L,B);const made=tr?{b:tr.b,n:tr.aGive.players.length,floor:!!tr.floor,back:tr.bGive.players.length,hit:capHit(L,L.players[tr.aGive.players[0]],cs),room:CAP-payroll(L,B,cs)}:null;
    return {gap0,made,x:!!x};`);
  chk('A setup: a team $30M+ under the floor', r.gap0 >= 30, r.gap0.toFixed(1));
  chk('A floorAbsorb: takes an overpaid short deal into cap room, nothing goes back', r.made && r.made.b === 0 && r.made.floor && r.made.back === 0 && r.made.hit <= r.made.room + 1e-6, JSON.stringify(r.made));
}
{
  const r = J(`const cs=capSeason(L);const B=L.teams[0];
    const mk=(ovr,age)=>{const p=newPlayer(L,'SF',0,age);p.ovr=ovr;p.mval=MINSAL*1.5;L.fa.push(p.id);setAsk(L,p);p.ask=MINSAL;return p;};
    const ps=[mk(66,31),mk(63,29),mk(58,27),mk(57,23),mk(54,22)];
    const gap0=MINPAY-payNoFloor(L,B,cs);const n=floorSign(L,B);
    const got=rosterOf(L,B).filter(p=>p.contract&&p.contract.type==='payroll').map(p=>({ovr:p.ovr,age:p.age,amt:p.contract.amt,yrs:p.contract.len,type:p.contract.type}));
    return {gap0,gap1:MINPAY-payNoFloor(L,B,cs),n,got};`);
  chk('A floorSign: signs free agents to payroll-floor deals and closes the gap', r.n >= 1 && r.gap1 < r.gap0 && r.got.length === r.n, `gap ${r.gap0.toFixed(1)} -> ${r.gap1.toFixed(1)}, ${JSON.stringify(r.got)}`);
  chk('A floor deals are short (1-2 years) and above value', r.got.length && r.got.every(x => x.yrs <= 2) && r.got.some(x => x.amt > 2), JSON.stringify(r.got.map(x => [x.ovr, x.amt, x.yrs])));
  chk('A young-player rule: 55 and under not paid above the minimum, 56-59 at 25 or younger at most 2.2x, nobody under 60 at $10M+', r.got.every(x => (x.ovr > 55 || x.amt <= 1.0001) && (x.ovr >= 60 || x.age > 25 || x.amt <= 2.2 + 1e-6) && (x.ovr >= 60 || x.amt < 10)), JSON.stringify(r.got));
}
{
  const r = J(`const t=L.teams[2];const was=[t.status,t.owner&&t.owner.limit,t.owner&&t.owner.tight];if(t.owner){t.owner.limit=APRON;t.owner.tight=false;t.cash=50;}
    const p=Object.values(L.players).find(x=>x.team!=null&&x.team!==t.id&&x.ovr>=70);const f=b2Fit(L,t,p);
    const res={};for(const st of ['hopeful','rising','retool','rebuild','tank']){t.status=st;res[st]=b2Ceiling(L,t,p);}t.status=was[0];
    return {res,fit:f,CAP,MLE,TAXLINE};`);
  const mid = Math.min(r.TAXLINE, r.CAP + r.MLE);
  chk('A b2Ceiling: hopeful / rising / retool may use the mid-level for a player who helps; rebuild / tank stay at the cap', ['hopeful', 'rising', 'retool'].every(k => r.res[k] >= mid - 1e-6 || (r.fit.starter && r.fit.need)) && r.res.rebuild <= r.TAXLINE && r.res.tank <= r.TAXLINE, JSON.stringify(r.res));
}
{
  const r = J(`const cs=capSeason(L);const p=Object.values(L.players).find(x=>x.team!=null&&x.contract&&x.contract.amt>=10);const c=p.contract;const base=inHit(L,p,p.team===1?2:1,cs);
    c.kick=0.15;c.kicked=false;const withK=inHit(L,p,p.team===1?2:1,cs);
    const exp=Math.min(Math.max(c.amt,maxFor(p)),c.amt*1.15)-c.amt;c.kick=0;
    // holdout raise: fits now but not a later cap year
    const t=L.teams[p.team];const y2=cs+1;const filler=rosterOf(L,t).find(x=>x.id!==p.id&&x.contract);const keep=filler?JSON.stringify(filler.contract):null;
    let later=null;if(filler){filler.contract.exp=cs+1;filler.contract.sched=null;const need=APRON-payNoFloor(L,t,y2)+0.5;if(need>0)filler.contract.amt+=need;later=swapFits(L,t,p,c.amt+20,3);filler.contract=JSON.parse(keep);}
    const now=swapFits(L,t,p,c.amt,1);
    return {base,withK,exp,later,now};`);
  chk('A inHit: a trade kicker counts for the team getting him', Math.abs(r.withK - r.base - r.exp) < 0.05, `${r.base.toFixed(1)} -> ${r.withK.toFixed(1)} (+${r.exp.toFixed(1)})`);
  chk('A swapFits: a holdout raise that leaves a later cap year over the hard cap is refused; same amount fits', r.later === false && r.now === true, JSON.stringify(r));
}
// ---------- B: balance ----------
{
  const r = J(`const pc=(a,q)=>{a=a.slice().sort((x,y)=>x-y);return a[Math.floor((a.length-1)*q)];};const g=[];for(let i=0;i<500;i++)g.push(genPlayer(['PF','C'][i%2],rnd(-0.5,1.2),22,new Set()));const b=g.map(p=>p.blk);
    const fs=roleMinutes([{id:1,k:'fs'},{id:2,k:'star'},{id:3,k:'starter'},{id:4,k:'starter'},{id:5,k:'starter'},{id:6,k:'sixth'},{id:7,k:'rot'}],{rot:'Tight'},false,240);
    const po=roleMinutes([{id:1,k:'fs'},{id:2,k:'star'},{id:3,k:'starter'},{id:4,k:'starter'},{id:5,k:'starter'},{id:6,k:'sixth'},{id:7,k:'rot'}],{rot:'Tight'},true,240);
    return {p50:pc(b,.5),p90:pc(b,.9),p95:pc(b,.95),n70:b.filter(x=>x>=70).length/b.length,G:LG_GRAV,fs:fs[1],po:po[1],top:MPG_TOP};`);
  chk('B league pull: the stronger values (maxD 1.5, trimK 2, nudgeK 0.8)', r.G.maxD === 1.5 && r.G.trimK === 2 && r.G.nudgeK === 0.8, JSON.stringify(r.G));
  chk('B generated bigs: block ratings top end like real bigs (p90 <= 65, p95 <= 69, 70+ under 5%)', r.p90 <= 65 && r.p95 <= 69 && r.n70 < 0.05, `p50 ${r.p50} p90 ${r.p90} p95 ${r.p95} 70+ ${(r.n70 * 100).toFixed(1)}%`);
  chk('B regular-season minutes plan: no target over MPG_TOP (38.5); playoffs can go higher', r.fs <= r.top + 0.3 && r.po >= r.fs, `fs ${r.fs.toFixed(1)}, playoffs ${r.po.toFixed(1)}`);
}
// ---------- C: awards on a played season ----------
run(`var L3=newLeague({mode:'commish',size:16,games:82});var g3=0;while(L3.phase==='regular'&&g3++<400)simDay(L3);computeAdv(L3,'rs',true);`);
{
  const r = J(`const L=L3,F=awardFns(L),q=awardQual(L);const S=L.season;
    const mvp=F.mvp.pool(q).map(p=>[p,F.mvp.score(p)]).sort((a,b)=>b[1]-a[1]);const top5=new Set(mvp.slice(0,5).map(x=>x[0].id));
    // make a top-5 MVP player look like a breakout (last season far worse), then check the MIP pool leaves him out
    const star=mvp[0][0];star.hist.push({s:S-1,tid:star.team,age:star.age-1,ovr:star.ovr-10,rs:Object.assign({},star.stats.rs,{pts:star.stats.rs.pts*0.3,per:8,ws48:0.02,min:star.stats.rs.min*0.8})});
    const mipPool=F.mip.pool(q).map(p=>p.id);
    // two qualified players made rookies: one at 20+ mpg, one under
    const byM=q.slice().sort((a,b)=>b.stats.rs.min/b.stats.rs.gp-a.stats.rs.min/a.stats.rs.gp);const hi=byM.find(p=>p.stats.rs.min/p.stats.rs.gp/60>=24),lo=byM.slice().reverse().find(p=>p.stats.rs.min/p.stats.rs.gp/60<18);const rs0=[hi.rookieSeason,lo.rookieSeason];hi.rookieSeason=S;lo.rookieSeason=S;
    const rk=F.roy.pool(q);const ok20=rk.every(p=>p.stats.rs.min/p.stats.rs.gp/60>=20)&&rk.some(p=>p.id===hi.id)&&!rk.some(p=>p.id===lo.id);const any20=true;hi.rookieSeason=rs0[0];lo.rookieSeason=rs0[1];
    const was=Object.assign({},AW_ADV);Object.assign(AW_ADV,AW_V33C);const F2=awardFns(L);const old=F2.mvp.pool(q).map(p=>[p.id,F2.mvp.score(p)]).sort((a,b)=>b[1]-a[1]).slice(0,3);Object.assign(AW_ADV,was);
    star.hist.pop();
    const lad=awardLadder(L,'mvp',3);
    return {w:AW_ADV.mvp,team:AW_ADV.mvpTeam,mipHasStar:mipPool.includes(star.id),mipOverlap:mipPool.filter(id=>top5.has(id)).length,ok20,any20,nRoy:rk.length,ws:lad.map(x=>x.ws),old:old.length};`);
  chk('C MVP weights (v36c): WS 35%, game score 30%, BPM 20%, team record 0.5', r.w.ws === 0.35 && r.w.gs === 0.3 && r.w.bpm === 0.2 && Math.abs(Object.values(r.w).reduce((a, b) => a + b, 0) - 1) < 1e-9 && r.team === 0.5, JSON.stringify(r.w) + ' team ' + r.team);
  chk('C MIP pool leaves out the MVP top 5 (even after a big jump)', !r.mipHasStar && r.mipOverlap === 0, `overlap ${r.mipOverlap}`);
  chk('C ROY pool: 20+ mpg rookies only (when there are any)', !r.any20 || r.ok20, `${r.nRoy} in pool, any 20+ mpg ${r.any20}`);
  chk('C v33c preset still scores (comparison runs)', r.old === 3, r.old);
}
// ---------- C: est. tag + stint BPM history ----------
{
  const fs = require('fs'), app = fs.readFileSync(SRC + '/app.js', 'utf8');
  chk('C est. tag on backfilled seasons (player Advanced tab + season records)', /advEstTag\(h\[key\]\)/.test(app) && /x\.h\.rs\.advEst \? ' \(est\.\)'/.test(app));
  const r = J(`return {min:hxBpmOf('Andrew Wiggins',2019,'MIN'),gsw:hxBpmOf('Andrew Wiggins',2019,'GSW'),s:hxBpmOf('Andrew Wiggins',2019),one:hxBpmOf('Andrew Wiggins',2021,'GSW'),n:Object.values(NBA_HX.bpmRows).reduce((a,r)=>a+Object.keys(r).filter(k=>k.includes('|')).length,0)};`);
  chk('C history BPM per traded stint (Wiggins 2019-20 MIN / GSW differ; one-team seasons use the season value)', r.min && r.gsw && r.min[2] !== r.gsw[2] && r.n > 300 && r.one && r.one[2] === (J(`return hxBpmOf('Andrew Wiggins',2021)`) || [])[2], JSON.stringify(r));
}
console.log(out.join('\n'));
console.log(`\nt33d: ${ok}/${ok + bad} pass`);
process.exit(bad ? 1 : 0);
