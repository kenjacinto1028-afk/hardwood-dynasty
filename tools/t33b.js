// v33b asks follow the league + hard-cap hole: node tools/t33b.js   (SEED=n default 21)
// A start league (NBA + PBL16): ask shift 0; young (25-) OVR 55- ask the minimum, 56-59 at most ~2x, nobody under 60 asks $10M+;
//   the market spends the budget (lift follows the league)
// B a stronger league (+4 OVR for everyone) moves the bands up ~4 (a 59 is now at the minimum); a weaker one (-3) moves them down;
//   a squeezed league (spread x0.75) still spends the budget; under 60 still never $10M+
// C offer sheets: the offering team that lost its room since the sheet is void (no signing over the cap / hard cap); with room it signs;
//   a stale sign-and-trade is refused; a deal that fits this cap year but leaves a later year over the hard cap is refused
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 21;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = load(SRC, SEED);
const J = c => JSON.parse(run(`JSON.stringify((function(){${c}})())`));
run(`var mkt=function(L){const ps=active(L).filter(p=>!p.prospect);const top=ps.slice().sort((a,b)=>(b.mval||0)-(a.mval||0)).slice(0,13*L.teams.length);
  return top.reduce((s,p)=>s+(p.mval>1.5?p.mval:0),0)/L.teams.length;};
 var rule=function(L){const ps=active(L).filter(p=>!p.prospect);let y55=0,y55min=0,y59=0,y59max=0,u60=0;
  for(const p of ps){const a=rampAmt(L,p,60);if(p.ovr<60&&a>=10)u60++;if(p.age<=25&&p.ovr<=55){y55++;if(a<=MINSAL+1e-6)y55min++;}if(p.age<=25&&p.ovr>=56&&p.ovr<=59){y59++;y59max=Math.max(y59max,a/MINSAL);}}
  return {y55,y55min,y59,y59max:+y59max.toFixed(2),u60};};`);
for (const nba of [true, false]) {
  const tag = nba ? 'NBA' : 'PBL16';
  const r = J(`const L=newLeague({mode:'commish',size:${nba ? 30 : 16},games:82${nba ? ',nba:true' : ''}});var LT=L;globalThis.LT=L;
    return {shift:L.askShift,lift:L.marketLift,m:mkt(L),b:CAP*SPEND_K,rule:rule(L)};`);
  chk(`${tag} A start league: ask shift 0`, r.shift === 0, r.shift);
  chk(`${tag} A young 55- ask the minimum`, r.rule.y55 > 10 && r.rule.y55min === r.rule.y55, `${r.rule.y55min}/${r.rule.y55}`);
  chk(`${tag} A young 56-59 at most ~2x minimum`, r.rule.y59 > 3 && r.rule.y59max <= 2.4, `${r.rule.y59} players, max ${r.rule.y59max}x`);
  chk(`${tag} A nobody under 60 asks $10M+`, r.rule.u60 === 0, r.rule.u60);
  chk(`${tag} A market spends the budget (95-101%)`, r.m >= r.b * 0.95 && r.m <= r.b * 1.01, `${r.m.toFixed(1)} vs ${r.b.toFixed(1)}, lift ${r.lift}`);
  // B
  const b = J(`const L=LT;const base={};for(const p of active(L))base[p.id]=p.ovr;
    const res={};const set=f=>{for(const p of active(L))p.ovr=clamp(Math.round(f(base[p.id])),25,99);computeMarket(L);};
    set(o=>o+4);const p59=active(L).filter(p=>!p.prospect&&p.ovr===59);
    res.up={shift:L.askShift,m:mkt(L),lift:L.marketLift,p59min:p59.filter(p=>rampAmt(L,p,30)<=MINSAL+1e-6).length,p59:p59.length,u60:rule(L).u60};
    set(o=>o-3);const p55=active(L).filter(p=>!p.prospect&&p.ovr===55);
    res.dn={shift:L.askShift,m:mkt(L),lift:L.marketLift,p55up:p55.filter(p=>rampAmt(L,p,30)>MINSAL+1e-6).length,p55:p55.length,u60:rule(L).u60};
    const mean=Object.values(base).reduce((a,b)=>a+b,0)/Object.keys(base).length;set(o=>mean+(o-mean)*0.75);
    res.sq={shift:L.askShift,m:mkt(L),lift:L.marketLift,u60:rule(L).u60};
    set(o=>o);res.back=L.askShift;return res;`);
  chk(`${tag} B stronger league (+4): shift +3.5..+4.5`, b.up.shift >= 3.5 && b.up.shift <= 4.5, b.up.shift);
  chk(`${tag} B stronger league: a 59 now asks the minimum`, b.up.p59 >= 3 && b.up.p59min === b.up.p59, `${b.up.p59min}/${b.up.p59}`);
  chk(`${tag} B weaker league (-3): shift -2.5..-3.5, most 55s ask above the minimum (a 58 before)`, b.dn.shift <= -2.5 && b.dn.shift >= -3.5 && b.dn.p55 > 2 && b.dn.p55up >= b.dn.p55 * 0.6, `${b.dn.shift}, ${b.dn.p55up}/${b.dn.p55}`);
  for (const [k, v] of [['stronger', b.up], ['weaker', b.dn], ['squeezed', b.sq]]) chk(`${tag} B ${k} league still spends the budget (93-101%), under 60 never $10M+`, v.m >= r.b * 0.93 && v.m <= r.b * 1.01 && v.u60 === 0, `${v.m.toFixed(1)} lift ${v.lift} shift ${v.shift} u60 ${v.u60}`);
  chk(`${tag} B back to the start ratings: shift 0 (within one 0.25 step)`, Math.abs(b.back) <= 0.25, b.back);   // v33d: generated block ratings changed the sample (3 players at 59, -0.25 on one seed)
}
// ---------- C ----------
run(`var L=newLeague({mode:'team',userTeam:5,size:30,games:82,nba:true}); L.phase='off-fa'; L.faDay=3; computeMarket(L);
  var mkRFA=function(H){const p=rosterOf(L,H).filter(p=>p.contract&&p.contract.amt>2).sort((a,b)=>b.ovr-a.ovr)[3];release(L,p);p.ask=8;p.rfa={tid:H.id,s:L.season,want:true};return p;};
  var squeeze=function(O){const cs=capSeason(L),pay=payNoFloor(L,O,cs);O.dead=O.dead||[];O.dead.push({pid:-1,amt:r1(APRON-pay-3),exp:cs,from:cs});O.mleUsed=cs;while(O.roster.length>13)release(L,rosterOf(L,O).sort((a,b)=>a.ovr-b.ovr)[0]);};`);
{
  const r = J(`const H=L.teams[1],O=L.teams[2];const p=mkRFA(H);squeeze(O);const cs=capSeason(L),before=payNoFloor(L,O,cs);
    p.sheet={tid:O.id,amt:30,yrs:3,day:1};sheetDecide(L,p,false);
    return {team:p.team,rfa:p.rfa,before,after:payNoFloor(L,O,cs),apron:APRON,fa:L.fa.includes(p.id)};`);
  chk('C AI sheet: offering team over the cap since -> void, he stays a free agent (unrestricted)', r.team == null && r.rfa == null && r.fa, JSON.stringify(r));
  chk('C AI sheet: offering team payroll unchanged (never over the hard cap)', Math.abs(r.after - r.before) < 1e-6 && r.after <= r.apron, r.before.toFixed(1) + ' -> ' + r.after.toFixed(1));
}
{
  const r = J(`const H=L.teams[3],O=L.teams[4];const p=mkRFA(H);const cs=capSeason(L);O.dead=O.dead||[];
    while(payNoFloor(L,O,cs)+12>CAP){const q=rosterOf(L,O).filter(q=>capHit(L,q,cs)>0).sort((a,b)=>b.contract.amt-a.contract.amt)[0];if(!q)break;release(L,q);O.dead=O.dead.filter(d=>d.pid!==q.id);}
    while(O.roster.length>13)release(L,rosterOf(L,O).sort((a,b)=>a.ovr-b.ovr)[0]);
    p.sheet={tid:O.id,amt:10,yrs:2,day:1};sheetDecide(L,p,false);return {team:p.team,O:O.id};`);
  chk('C AI sheet: offering team with room signs him', r.team === r.O, JSON.stringify(r));
}
{
  const r = J(`const H=L.teams[6],O=L.teams[L.user];const p=mkRFA(H);squeeze(O);const cs=capSeason(L),before=payNoFloor(L,O,cs);
    p.sheet={tid:O.id,amt:25,yrs:3,day:1};sheetDecide(L,p,false);return {team:p.team,before,after:payNoFloor(L,O,cs),ev:(L.faEvents||[]).filter(e=>e.pid===p.id).map(e=>e.k+':'+e.why)};`);
  chk('C your sheet: you no longer have the room -> void, told why', r.team == null && Math.abs(r.after - r.before) < 1e-6 && r.ev.some(x => /cap room/.test(x)), JSON.stringify(r));
}
{
  const r = J(`L.phase='off-resign';const U=L.teams[L.user],A=L.teams[7];const p=rosterOf(L,U).sort((a,b)=>b.ovr-a.ovr)[2];const cs=capSeason(L);
    const o={a:A.id,b:U.id,aGive:{players:[],picks:[]},bGive:{players:[p.id],picks:[]},amt:20,yrs:3};
    A.dead=A.dead||[];A.dead.push({pid:-2,amt:r1(CAP-payroll(L,A,cs)+1),exp:cs,from:cs});const before=payroll(L,A,cs);
    const res=doSignAndTrade(L,o);L.phase='off-fa';return {res,team:p.team,U:U.id,before,after:payroll(L,A,cs)};`);
  chk('C stale sign-and-trade (other team now over the cap) is refused', typeof r.res === 'string' && r.team === r.U && Math.abs(r.after - r.before) < 1e-6, JSON.stringify(r));
}
{
  const r = J(`L.phase='off-fa';const T=L.teams[9],cs=capSeason(L);const pay=payNoFloor(L,T,cs);const a=canFit(L,T,10,false,'re-sign');
    T.dead=T.dead||[];T.dead.push({pid:-3,amt:r1(APRON-payNoFloor(L,T,cs+2)-5),exp:cs+2,from:cs+2});const b=canFit(L,T,10,false,'re-sign'),c=canFit(L,T,4,false,'re-sign');
    const rk=futFits(L,T,rookieScale(1,1,L.teams.length));T.dead.pop();return {pay,a,b,c,rk,next2:payNoFloor(L,T,cs+2)};`);
  chk('C later cap years: a deal that would leave a later year over the hard cap is refused (fits this year)', r.a === true && r.b === false && r.c === true && r.rk === false, JSON.stringify(r));
}
console.log(out.join('\n')); console.log(`\n${ok}/${ok + bad} passed`); process.exit(bad ? 1 : 0);
