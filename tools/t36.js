// v36a unit checks: node tools/t36.js   (SEED=n default 21; ~2 min)
// D  PBL top cap (leagueTopCap, v35b) forced: a star set to 96 and a generational talent set to 99, sim a season + summer, both end at or under the cap
// A1 early free agency (faEarly / FA_EARLY): middle teams bid on 60+ players days 1-3 (more real offers than with it off), hard cap holds
// A2 re-sign (resignWantP mid60): a middle team under the tax keeps its 60+ rotation player; tank / over-tax teams unchanged
// B  NBA top cap (NBA_BAL t95 1, cap 96, capGen 97)
// C  owner cash (cashPayroll) charges the season's scheduled amount (real yearly deals, renegotiated raises)
// v36e   clear room may move one 7th-9th man; stay discount 25%
// v36d A  hard-cap clear room (capClear): bench deal moved, 60+ player re-signed under the hard cap; nothing moved when no one is movable
const SEED = +process.env.SEED || 21, SRC = process.env.SRC || 'src';
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const snapJ = (file) => { const { run } = require('./snap.js')(SRC, SEED, file); return c => JSON.parse(run(`JSON.stringify((function(){const L=SL;${c}})())`)); };

// ---------- D: PBL top cap, forced ----------
{
  const J = snapJ('tools/snap/pbl16-commish-s10.json.gz');
  const r = J(`let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
    const ro=[];for(const t of L.teams)for(const id of t.roster){const p=L.players[id];if(p&&!p.retired)ro.push(p);}
    const ps=ro.filter(p=>!p.gen&&p.age>=24&&p.age<=29).sort((a,b)=>b.ovr-a.ovr);const star=ps[0],gen=ps[1];
    const push=(p,x)=>{for(let i=0;i<40&&p.ovr<x;i++){growTo(p,x+1,Math.max(p.age,25));p.ovr=ovr(p);}p.pot=Math.max(p.pot,p.ovr);p.ceil=Math.max(p.ceil||0,p.ovr);};
    push(star,96);gen.gen=true;push(gen,99);gen.pot=99;gen.ceil=99;const b={star:star.ovr,gen:gen.ovr};
    let cap=null;const lt=leagueTopCap;leagueTopCap=function(L,d){return (cap=lt(L,d));};
    startOffseason(L);leagueTopCap=lt;
    return {b,cap,star:[star.ovr,star.pot,star.ceil],gen:[gen.ovr,gen.pot,gen.ceil],top:Object.values(L.players).filter(p=>!p.retired&&!p.prospect).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,4)};`);
  const c = r.cap || {};
  chk('D forced PBL star 96 -> at or under the cap after a summer (ovr, pot, ceil)', r.b.star >= 96 && c.cap && r.star[0] <= c.cap && r.star[1] <= c.cap && r.star[2] <= c.cap, `before ${r.b.star}, cap ${c.cap}, after ${r.star.join('/')}`);
  chk('D generational talent 99 -> at or under the generational cap (above the normal cap allowed)', r.b.gen >= 98 && c.capG && r.gen[0] <= c.capG && r.gen[1] <= c.capG && c.capG > c.cap, `before ${r.b.gen}, capG ${c.capG}, after ${r.gen.join('/')}`);
  chk('D league top after the summer <= generational cap', r.top[0] <= c.capG, `top ${r.top.join(',')}, hi ${c.hi}`);
}

// ---------- NBA: A1, A2, B, C ----------
{
  const J = snapJ('tools/snap/nba-commish-s10.json.gz');
  // B
  const b = J(`return {B:NBA_BAL,top:active(L).filter(p=>!p.prospect&&!p.retired).map(p=>p.ovr).sort((a,b)=>b-a).slice(0,3)};`);
  chk('B NBA_BAL: one 95+ player, ceiling 96 (97 generational)', b.B.t95 === 1 && b.B.cap === 96 && b.B.capGen === 97, JSON.stringify({ t95: b.B.t95, cap: b.B.cap, capGen: b.B.capGen }));
  const b2 = J(`const all=active(L).filter(p=>!p.prospect&&!p.retired);const ps=all.filter(p=>!p.gen).sort((a,b)=>b.ovr-a.ovr).slice(0,3);
    const push=(p,x)=>{for(let i=0;i<40&&p.ovr<x;i++){growTo(p,x+1,Math.max(p.age,25));p.ovr=ovr(p);}p.pot=Math.max(p.pot,p.ovr);};
    push(ps[0],98);push(ps[1],95);push(ps[2],95);const bf=ps.map(p=>p.ovr);nbaBalance(L,{});
    return {bf,af:ps.map(p=>p.ovr),pot:ps.map(p=>p.pot),n95:all.filter(p=>p.ovr>=95).length};`);
  chk('B nbaBalance: a 98 is eased to <= 96, extra 95+ players eased back', b2.af[0] <= 96 && b2.pot[0] <= 96 && b2.n95 < 3, `before ${b2.bf}, after ${b2.af}, 95+ now ${b2.n95}`);

  // part 2: re-sign at value + PER (engine volume rules); the season effect is checked by tools/per36.js / r30
  const p2 = J(`return {val:RESIGN_K.val,valOvr:RESIGN_K.valOvr,useTax:ENG.useTax,shareCap:ENG.shareCap,shareK:ENG.shareK};`);
  chk('A3 re-sign at value (60+: max(ask, mval))', p2.val === 1 && p2.valOvr === 60, JSON.stringify(p2));
  chk('B2 PER: volume costs efficiency (useTax 1.0), shots passed on past 25% of team FGA', p2.useTax === 1 && p2.shareCap === 0.25 && p2.shareK === 5);
  const mk = J(`const r=[];for(const on of [false,true]){MKT_ROOKIE_FIXED=on;computeMarket(L);const ps=active(L).filter(p=>p.team!=null&&p.ovr>=60&&p.ovr<=75);r.push({scale:L.marketScale,lift:L.marketLift,mv:ps.reduce((a,p)=>a+p.mval,0)/ps.length});}return r;`);
  chk('A4 NBA market counts rookie deals at their cap hit: higher scale, 60-75 values up, lift <= MKT_LIFT_NBA', mk[1].scale > mk[0].scale && mk[1].mv > mk[0].mv && mk[1].lift <= 3.4 + 1e-9, `scale ${mk[0].scale} -> ${mk[1].scale}, 60-75 mval ${mk[0].mv.toFixed(1)} -> ${mk[1].mv.toFixed(1)}, lift ${mk[1].lift}`);
  // part 3: owner money + hard-cap discount
  const own = J(`const t=L.teams.find(x=>x.market===3&&x.owner&&(x.cash||0)>=0&&(x.finHist||[]).length);const c0=t.cash;const a=cuttingLosses(L,t);t.cash=-20;const b=cuttingLosses(L,t);
    const p=rosterOf(L,t).sort((x,y)=>y.ovr-x.ovr)[0];const st=resignOwnerOK(L,t,p,10);t.cash=c0;return {a,b,st,media:mediaFor(L),disc:RESIGN_K.disc};`);
  chk('Q2 a big-market owner in the red (-20) cuts back; no Bird-rights stretch below $0', own.a === false && own.b === true && own.st === false, JSON.stringify(own));
  chk('Q2 NBA media money 150 (+4 big league)', own.media === 154, own.media);
  chk('Q3 hard-cap hometown discount up to 25% (v36e, was 15%)', own.disc === 0.75);
  // v36d A: hard-cap clear room (capClear): a team blocked by the hard cap moves a bench deal, then re-signs its 60+ player
  const JC = snapJ('tools/snap/nba-commish-s10.json.gz');   // own copy: this check changes the league
  const cc = JC(`L.phase='off-resign';const S=L.season,cs=capSeason(L);
    let res=null;
    for(const t of L.teams){const r=rosterOf(L,t).filter(x=>x.contract).sort((a,b)=>b.ovr-a.ovr);const core=new Set(r.slice(0,9).map(x=>x.id));
      const x=r.find(y=>!core.has(y.id)&&capHit(L,y,cs)>=3&&y.contract.exp>=cs&&!tradeRestricted(L,y)&&!y.contract.ntc&&!y.ext&&!(y.contract.type==='rookie'&&y.age<=21));
      const p=r.slice(0,9).find(y=>y.ovr>=62&&x&&y.ovr>=x.ovr+4);if(!x||!p)continue;
      p.contract.exp=S;p.ask=r1(capHit(L,x,cs)*1.5);const own=t.owner;   /* v36e: gap > the 25% discount */
      for(const y of [cs,cs+1,cs+2]){const pay=y===cs?payroll(L,t,y):payNoFloor(L,t,y);const h=capHit(L,x,y),amt=APRON-pay-(h>0?p.ask-0.5*h:p.ask+5);t.dead.push({amt,exp:y,from:y,name:'t36',pid:-1,s:S});}
      const c0=t.cash,r0=t.roster.length;t.cash=-50;const kOwn=own?capClear(L,t,p,[p.ask,r1(p.ask*RESIGN_K.disc)],false,k=>canFit(L,t,k,false,'re-sign')):-1;const sameOwn=t.roster.length===r0;t.cash=c0;t.owner=null;
      const fitsAt=k=>canFit(L,t,k,false,'re-sign');const before=[p.ask,r1(p.ask*RESIGN_K.disc)].map(fitsAt);
      L.resignLog={s:S,n:0,kept:0,out:{},o60:{n:0,kept:0}};const n0=t.roster.length,ids0=t.roster.slice();
      const k=capClear(L,t,p,[p.ask,r1(p.ask*RESIGN_K.disc)],false,fitsAt);
      const gone=ids0.filter(id=>!t.roster.includes(id)).map(id=>L.players[id]);
      res={t:t.abbr,p:p.name+' '+p.ovr,ask:p.ask,before,k,gone:gone.map(g=>({n:g.name,ovr:g.ovr,core:core.has(g.id),to:g.team!=null?L.teams[g.team].abbr:null,txg:g.tx.some(z=>z.s===S&&/clear hard-cap room to re-sign/.test(z.t)),toPay:g.team!=null?payroll(L,L.teams[g.team],cs):null})),
        kOwn,sameOwn,tk:(L.trades||[]).slice(0,1).map(r=>r.kind+'/'+r.wk)[0],txp:p.tx.some(z=>z.s===S&&/cleared hard-cap room to re-sign him/.test(z.t)),fitAfter:fitsAt(k),cleared:L.resignLog.o60.capCleared||0,cap:[CAP,APRON,RESIGN_K.disc,CAP_CLEAR.max]};
      // nothing to move: every bench player signed this season -> no move
      const t2=L.teams.find(z=>z.id!==t.id&&z.id!==(res.gone[0]&&L.players[ids0.find(id=>!t.roster.includes(id))].team));
      const r2=rosterOf(L,t2).filter(y=>y.contract&&y.contract.exp>S).sort((a,b)=>b.ovr-a.ovr),p2=r2[0];p2.contract.exp=S;p2.ask=20;t2.owner=null;
      for(const y of rosterOf(L,t2))y.contracts.push({s:cs,tid:t2.id,amt:y.contract.amt,yrs:1,type:'t36'});
      for(const y of [cs,cs+1,cs+2]){const pay=y===cs?payroll(L,t2,y):payNoFloor(L,t2,y);t2.dead.push({amt:APRON-pay-5,exp:y,from:y,name:'t36',pid:-1,s:S});}
      const r20=t2.roster.length;res.neg={k:capClear(L,t2,p2,[20,17],false,k=>canFit(L,t2,k,false,'re-sign')),same:t2.roster.length===r20};
      break;}
    return res||{none:true};`);
  chk('A v36d hard cap blocks the ask and the stay discount before the move', !cc.none && cc.before.every(v => v === false), cc.none ? 'no case' : JSON.stringify(cc.before));
  chk('A v36d capClear: re-signs at his ask after moving 1-2 bench deals (not top 9), deal fits the hard cap', !cc.none && cc.k === cc.ask && cc.fitAfter && cc.gone.length >= 1 && cc.gone.length <= 2 && cc.gone.every(g => !g.core && g.to), cc.none ? '' : `${cc.t} ${cc.p} ask ${cc.ask}: moved ${cc.gone.map(g => g.n + ' ' + g.ovr + ' -> ' + g.to).join(', ')}`);
  chk('A v36d receiving team stays under the soft cap; tx line on both players; resignLog capCleared 1', !cc.none && cc.gone.every(g => g.toPay <= cc.cap[0] + 1e-6 && g.txg) && cc.txp && cc.cleared === 1, cc.none ? '' : JSON.stringify({ pay: cc.gone.map(g => g.toPay && +g.toPay.toFixed(1)), txp: cc.txp, cleared: cc.cleared }));
  chk('A v36e clear-room trade stored as kind clear (not a salary dump)', !cc.none && cc.tk === 'clear/clear', cc.none ? '' : cc.tk);
  chk('A v36d owner in the red (cash -50, cutting losses): no move (owner limit / tax-line rule hold)', !cc.none && cc.kOwn === 0 && cc.sameOwn, cc.none ? '' : JSON.stringify({ k: cc.kOwn, same: cc.sameOwn }));
  chk('A v36d nobody movable (all signed this season): no move, no re-sign', !cc.none && cc.neg.k === 0 && cc.neg.same, cc.none ? '' : JSON.stringify(cc.neg));
  chk('A v36d NBA soft cap / hard cap / discount unchanged (165 / 221.7), discount 0.75 (v36e), max 2 moves', !cc.none && cc.cap[0] === 165 && cc.cap[1] === 221.7 && cc.cap[2] === 0.75 && cc.cap[3] === 2, cc.none ? '' : JSON.stringify(cc.cap));
  // v36e: no bench deal can go -> one 7th-9th man (paid less than the player kept) is moved instead; never a top-6 player
  const JE = snapJ('tools/snap/nba-commish-s10.json.gz');
  const ce = JE(`L.phase='off-resign';const S=L.season,cs=capSeason(L);let res=null;
    for(const t of L.teams){const top=rosterOf(L,t).sort((a,b)=>b.ovr-a.ovr);const p=top[0];
      const y=top.slice(6,9).find(z=>z.contract&&z.contract.exp>=cs&&capHit(L,z,cs)>=3&&z.ovr<=p.ovr-4&&!tradeRestricted(L,z)&&!z.contract.ntc&&!z.ext&&!(z.contract.type==='rookie'&&z.age<=21)&&((z.contracts||[]).slice(-1)[0]||{s:0}).s<cs&&(tradeStatus(L,z)||{}).k!=='protect');
      if(!y||p.ovr<62)continue;
      for(const z of top.slice(9))z.contracts.push({s:cs,tid:t.id,amt:1,yrs:1,type:'t36'});   // bench: all signed this offseason
      p.contract.exp=S;p.ask=r1(Math.max(capHit(L,y,cs)+2,capHit(L,y,cs)*1.4));t.owner=null;
      for(const yy of [cs,cs+1,cs+2]){const pay=yy===cs?payroll(L,t,yy):payNoFloor(L,t,yy);const h=capHit(L,y,yy);t.dead.push({amt:APRON-pay-(h>0?p.ask-0.5*h:p.ask+5),exp:yy,from:yy,name:'t36',pid:-1,s:S});}
      L.resignLog={s:S,n:0,kept:0,out:{},o60:{n:0,kept:0}};const ids0=t.roster.slice(),top6=new Set(top.slice(0,6).map(z=>z.id));
      const fitsAt=k=>canFit(L,t,k,false,'re-sign');const before=fitsAt(r1(p.ask*RESIGN_K.disc));
      const k=capClear(L,t,p,[p.ask,r1(p.ask*RESIGN_K.disc)],false,fitsAt);const gone=ids0.filter(id=>!t.roster.includes(id));
      res={t:t.abbr,p:p.name+' '+p.ovr+' $'+p.ask,y:y.name+' '+y.ovr+' $'+r1(capHit(L,y,cs)),before,k,gone:gone.map(id=>L.players[id].name),top6:gone.some(id=>top6.has(id)),c9:L.resignLog.o60.capClear9||0};break;}
    return res||{none:true};`);
  chk('A v36e bench all just signed: a 7th-9th man paid less than him is moved, he re-signs; no top-6 player moved; capClear9 logged', !ce.none && ce.before === false && ce.k > 0 && ce.gone.length >= 1 && !ce.top6 && ce.c9 === 1, ce.none ? 'no case' : JSON.stringify(ce));
  // A2: re-sign want
  const a2 = J(`const cs=capSeason(L);const mid=L.teams.filter(t=>t.mode!=='tank'&&payroll(L,t,cs)<TAXLINE-25);
    let t=null,p=null;for(const x of mid){const r=rosterOf(L,x).sort((a,b)=>b.ovr-a.ovr);const q=r.slice(0,9).find(y=>y.ovr>=60&&y.age>=30&&y.age<33&&(y.ask||0)<20);if(q){t=x;p=q;break;}}
    if(!t)return {none:true};
    const m0=t.mode;t.mode='rebuild';const on=resignWantP(L,t,p,0);const k=RESIGN_K.mid60;RESIGN_K.mid60=0;const off=resignWantP(L,t,p,0);RESIGN_K.mid60=k;
    t.mode='tank';const tank=resignWantP(L,t,p,0);t.mode=m0;
    const over=L.teams.find(x=>payroll(L,x,cs)>TAXLINE&&x.status!=='allin');let ov=null;if(over){const q=rosterOf(L,over).find(y=>y.ovr>=60);if(q){const a=q.ask;q.ask=Math.max(q.ask||0,12);ov=resignWantP(L,over,q,0);q.ask=a;}}
    return {t:t.abbr,p:p.name+' '+p.ovr+' a'+p.age,on,off,tank,ov};`);
  chk('A2 middle team (rebuild, under the tax) keeps its 60+ top-9 player age 30-32: want >= 0.95 (0.58 without)', !a2.none && a2.on >= 0.95 && a2.off < a2.on, a2.none ? 'no case' : `${a2.t} ${a2.p}: ${a2.on.toFixed(2)} vs ${a2.off.toFixed(2)} off`);
  chk('A2 tanking team unchanged (age 28+ x0.3)', !a2.none && a2.tank < 0.5, a2.none ? '' : a2.tank.toFixed(2));
  chk('A2 team over the tax: not raised (<= 0.97 x tax)', a2.ov == null || a2.ov <= 0.97 * 0.9 + 1e-9, a2.ov == null ? 'no taxpayer' : a2.ov.toFixed(3));

  // A1: early free agency, two runs of the same day (with / without)
  const a1 = on => J(`FA_EARLY.on=${on};const S=L.season;L.phase='off-fa';L.faDay=1;
    const cand=active(L).filter(p=>p.team!=null&&p.ovr>=62&&p.ovr<=66&&p.age<=28&&!p.prospect).sort((a,b)=>a.id-b.id).slice(0,12);   /* v36d: 12 (6 tied on the new save) */
    for(const p of cand){p.tx.push({s:S,t:'test'});toFA(L,p);setAsk(L,p);}
    const fe=L.teams.filter(t=>faEarly(L,t,cand[0])).length;
    const fe4=(()=>{L.faDay=4;const n=L.teams.filter(t=>faEarly(L,t,cand[0])).length;L.faDay=1;return n;})();
    const lo=active(L).find(p=>p.team==null&&!p.prospect&&p.ovr<=59&&p.ovr>=50);const feLo=lo?L.teams.filter(t=>faEarly(L,t,lo)).length:0;
    faRound(L,false);
    const bids=cand.map(p=>(L.faBids&&L.faBids[p.id]?L.faBids[p.id].n:0)+(p.team!=null?100:0));
    const cs=capSeason(L),over=L.teams.filter(t=>payNoFloor(L,t,cs)>APRON+0.5).length;
    return {fe,fe4,feLo,bids,signed:cand.filter(p=>p.team!=null).length,over};`);
  const A = a1(true), Z = a1(false);
  const nb = r => r.bids.reduce((a, x) => a + (x >= 100 ? 1 : x), 0);
  chk('A1 faEarly: middle teams on day 1, none on day 4, none for a 50-59 player', A.fe > 0 && A.fe4 === 0 && A.feLo === 0, `day 1 ${A.fe} teams, day 4 ${A.fe4}, 50-59 ${A.feLo}`);
  chk('A1 day 1: 60+ free agents get more real bids / signings with it on', nb(A) > nb(Z) || A.signed > Z.signed, `on ${A.bids} (signed ${A.signed}), off ${Z.bids} (signed ${Z.signed}); 100+ = signed`);
  chk('A1 hard cap holds', A.over === 0, `${A.over} over`);

  // C: owner cash uses the scheduled amount
  const c = J(`const cs=capSeason(L);const q=x=>x.contract&&x.contract.amt>5&&x.contract.exp>=cs+1&&x.contract.type!=='rookie';const t=L.teams.find(z=>rosterOf(L,z).some(q));const p=rosterOf(L,t).find(q);   /* v36d: any team (new save) */
    const c0=cashPayroll(L,t,cs);const ct=p.contract;const keep=JSON.stringify({s:ct.sched,s0:ct.s0});
    ct.s0=cs;ct.sched=[];for(let y=cs;y<=ct.exp;y++)ct.sched.push(ct.amt);ct.sched[0]=ct.amt+7;
    const c1=cashPayroll(L,t,cs),c2=cashPayroll(L,t,cs+1);ct.sched[1]=ct.amt+3;const c3=cashPayroll(L,t,cs+1);
    return {c0,c1,c2,c3,amt:ct.amt};`);
  chk('C cashPayroll: a renegotiated raise this season (+7) is charged; next season base unless scheduled (+3)', Math.abs(c.c1 - c.c0 - 7) < 1e-6 && Math.abs(c.c3 - c.c2 - 3) < 1e-6, `${c.c0.toFixed(1)} -> ${c.c1.toFixed(1)}; next ${c.c2.toFixed(1)} -> ${c.c3.toFixed(1)}`);
}
{
  const { run } = require('./load.js')(SRC, SEED);
  const r = JSON.parse(run(`JSON.stringify((function(){const L=newLeague({mode:'commish',size:30,games:82,nba:true}),cs=capSeason(L)+1;let n=0,cash=0,base=0,sched=0;
    for(const t of L.teams){cash+=cashPayroll(L,t,cs);for(const p of rosterOf(L,t)){const c=p.contract;if(!c||c.exp<cs)continue;base+=c.amt;sched+=schedAmt(c,cs);if(c.sched&&c.s0!=null)n++;}}
    return {n,cash:cash/30,base:base/30,sched:sched/30};})())`));
  chk('C new NBA league, S2: real yearly deals charged at their S2 amounts', r.n > 100 && Math.abs(r.cash - r.sched) < 0.5 && r.cash > r.base + 3, `${r.n} deals, cash ${r.cash.toFixed(1)} (was base ${r.base.toFixed(1)})`);
}
console.log(out.join('\n')); console.log(`${ok}/${ok + bad} passed`);
process.exit(bad ? 1 : 0);
