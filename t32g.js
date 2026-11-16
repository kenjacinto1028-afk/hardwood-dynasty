// v32g: node tools/t32g.js   (SEED=n default 7)  open items from v32b-d
// A sixth men: plan + minutes played over ~3 weeks land in 24-28; other roles keep their ranges
// B mid-level as a real cap exception: canFit / faRoom / b2Room, your offer needs "Use mid-level" over the cap, AI over-cap teams
//   sign at most one above-minimum free agent a season and that spends their mid-level; re-signing still goes to the hard cap
// C saved rotation chart with a player out: stand-in takes his blocks, chart still runs, note on the game's timeline
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 7;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = load(SRC, SEED);
const T0 = Date.now(), J = c => { const r = JSON.parse(run(`JSON.stringify((function(){${c}})())`)); if (process.env.V) console.error(((Date.now() - T0) / 1000).toFixed(1) + "s"); return r; };
run(`var L=newLeague({mode:'team',size:30,userTeam:5,games:82,nba:true});`);
// ---------- A: minutes by role ----------
{
  const r = J(`var A={};const rs=rotSetup;rotSetup=function(L0,g,po){rs(L0,g,po);if(po||!g.plan)return;const m={};for(const row of g.plan)for(const p of row)if(p)m[p.id]=(m[p.id]||0)+1;for(const p of g.players){if(p.roleT!==g.t.id||p.role!=='sixth')continue;A.n=(A.n||0)+1;A.plan=(A.plan||0)+(m[p.id]||0);A.tgt=(A.tgt||0)+(g.target[p.id]||0)/60;}};
    let d=0;while(L.phase==='regular'&&d++<22)simDay(L);rotSetup=rs;
    const by={};for(const p of Object.values(L.players)){if(!p.stats||!p.stats.rs||p.stats.rs.gp<6||p.team==null||!p.role)continue;const o=by[p.role]=by[p.role]||[0,0];o[0]+=p.stats.rs.min/60/p.stats.rs.gp;o[1]++;}
    for(const k in by)by[k]=+(by[k][0]/by[k][1]).toFixed(1);return {plan:A.plan/A.n,tgt:A.tgt/A.n,by};`);
  chk('sixth man plan within 3 min of his target (was ~4.2 short)', r.tgt - r.plan <= 3, r.plan.toFixed(1) + ' vs ' + r.tgt.toFixed(1));
  chk('sixth men play 24-28 (3 weeks)', r.by.sixth >= 24 && r.by.sixth <= 28, r.by.sixth);
  chk('other roles in range (+-1): fs 34-37, star 32-35, starter 26-32, rot 16-24, bench 8-16, dev 0-8',
    r.by.fs >= 33 && r.by.fs <= 38 && r.by.star >= 31 && r.by.star <= 36 && r.by.starter >= 25 && r.by.starter <= 33 && r.by.rot >= 15 && r.by.rot <= 25 && r.by.bench >= 7 && r.by.bench <= 17 && r.by.dev <= 9, JSON.stringify(r.by));
}
// ---------- B: mid-level ----------
{
  const r = J(`const t=L.teams.find(x=>x.id!==L.user);t.mleUsed=null;const pad=Math.max(0,CAP-payroll(L,t)+3);t.dead=(t.dead||[]).concat([{pid:-9,name:'pad',amt:pad,exp:capSeason(L)+1}]);
    const pay=payroll(L,t),res={pay,CAP,TAXLINE,MLE};
    res.mle=canFit(L,t,MLE-0.5,false,'signing');res.overMle=canFit(L,t,MLE+2,false,'signing');res.min=canFit(L,t,MINSAL,false,'signing');
    res.resign=canFit(L,t,Math.min(30,APRON-pay-1),false,'re-sign');res.room=faRoom(L,t);res.b2=b2Room(L,t);
    t.mleUsed=capSeason(L);res.used=canFit(L,t,MLE-0.5,false,'signing');res.roomUsed=faRoom(L,t);t.mleUsed=null;
    const pad2=TAXLINE-payroll(L,t)+1;t.dead.push({pid:-8,name:'pad2',amt:pad2,exp:capSeason(L)+1});res.tax=canFit(L,t,3,false,'signing');t.dead=t.dead.filter(d=>d.pid!==-8);
    const u=t.id;t.dead=t.dead.filter(d=>d.pid!==-9);
    // under the cap with a little room: room or the MLE, whichever is more
    const t2=L.teams.find(x=>x.id!==L.user&&x.id!==u);t2.mleUsed=null;const sp=Math.max(0,CAP-payroll(L,t2)-4);t2.dead=(t2.dead||[]).concat([{pid:-7,name:'pad',amt:sp,exp:capSeason(L)+1}]);res.room2=faRoom(L,t2);res.pay2=payroll(L,t2);t2.dead=t2.dead.filter(d=>d.pid!==-7);
    return res;`);
  chk('over the cap, under the tax line: MLE-size deal fits, bigger does not, minimum always fits', r.mle && !r.overMle && r.min, JSON.stringify([r.mle, r.overMle, r.min]));
  chk('mid-level used -> only the minimum; faRoom 0', !r.used && r.roomUsed === 0, JSON.stringify([r.used, r.roomUsed]));
  chk('over the tax line: no mid-level', !r.tax);
  chk('re-signing your own player still goes up to the hard cap', r.resign);
  chk('faRoom / b2Room over the cap = the mid-level at most', r.room <= r.MLE + 1e-6 && r.b2 <= r.MLE + 1e-6, r.room + ' / ' + r.b2);
  chk('a little cap room: faRoom = the mid-level (larger than the room)', Math.abs(r.room2 - r.MLE) < 1e-6, r.room2 + ' pay ' + r.pay2);
}
{
  // your offer over the cap: mle false refused with a reason, mle default signs and spends it; second one blocked
  const r = J(`const U0=L.user,t=L.teams.filter(x=>x.id!==U0&&payroll(L,x)<TAXLINE-MLE-4).sort((a,b)=>payroll(L,a)-payroll(L,b))[0];L.user=t.id;t.mleUsed=null;t.dead=(t.dead||[]).filter(d=>d.pid!==-1);t.dead.push({pid:-1,name:'pad',amt:Math.max(0,CAP-payroll(L,t)+2),exp:capSeason(L)+1});
    while(t.roster.length>12){const n0=t.roster.length;release(L,L.players[t.roster[t.roster.length-1]]);if(t.roster.length===n0)break;}
    const fa=L.fa.map(id=>L.players[id]).filter(p=>p&&!p.prospect&&!p.retired).sort((a,b)=>b.ovr-a.ovr);const a=fa[0],b=fa[1];
    a.ask=6;b.ask=6;a.mval=Math.min(a.mval||6,8);b.mval=Math.min(b.mval||6,8);
    const r1=negotiate(L,a.id,MLE-1,2,L.user,'signing',null,{mle:false});
    const ms=mleStatus(L,t,payroll(L,t),MLE-1);
    const r2=negotiate(L,a.id,MLE-1,2,L.user,'signing',null,{});
    const used=t.mleUsed===capSeason(L), who=t.mleWho&&t.mleWho.pid===a.id;
    const r3=negotiate(L,b.id,MLE-1,2,L.user,'signing',null,{});
    const r4=negotiate(L,b.id,MINSAL,2,L.user,'signing',null,{});
    t.dead=t.dead.filter(d=>d.pid!==-1);L.user=U0;
    return {r1:[r1.ok,r1.msg],elig:ms.eligible,r2:[r2.ok,r2.msg],used,who,r3:[r3.ok,r3.msg],r4:[r4.ok,r4.msg]};`);
  chk('your over-cap offer with "Use mid-level" unticked is refused with a reason', r.r1[0] === false && /mid-level/.test(r.r1[1]), r.r1[1]);
  chk('offer popup sees the deal as mid-level eligible', r.elig === true);
  chk('default (ticked) signs and spends the mid-level (t.mleWho = him)', r.r2[0] === true && r.used && r.who, JSON.stringify(r.r2) + ' used ' + r.used);
  chk('second above-minimum signing over the cap refused; a minimum offer is not blocked by the cap', r.r3[0] === false && /mid-level/.test(r.r3[1]) && !/fit|mid-level/.test(r.r4[1] || ''), JSON.stringify([r.r3, r.r4]));
}
{
  // AI: hook signContract, run free-agent rounds with good free agents; over-cap teams sign at most one above-min player each
  const r = J(`const log=[];const sc=signContract;signContract=function(L0,p,tid,amt,yrs,type,opt,extra){const t=L0.teams[tid];const pre=payroll(L0,t),hit=contractHit(amt,false);if(type==='signing')log.push({tid,hit,pre,over:pre+hit>CAP+1e-6,tax:pre>=TAXLINE,used0:t.mleUsed===capSeason(L0)});return sc.apply(this,arguments);};
    for(const t of L.teams)t.mleUsed=null;
    const fa=L.fa.map(id=>L.players[id]).filter(p=>p&&!p.prospect&&!p.retired);for(const p of fa.slice(0,30)){p.ovr=Math.max(p.ovr,62);p.mval=Math.max(p.mval||0,9);p.ask=Math.max(p.ask||0,6);}
    for(let i=0;i<6;i++)faRound(L,true);signContract=sc;
    const ai=log.filter(x=>x.tid!==L.user&&x.hit>0), over=ai.filter(x=>x.over), per={};for(const x of over)per[x.tid]=(per[x.tid]||0)+1;
    const bad=over.filter(x=>x.hit>MLE+1e-6||x.tax||x.used0).length, used=over.every(x=>L.teams[x.tid].mleUsed===capSeason(L));
    return {n:ai.length,over:over.length,max:Math.max(0,...Object.values(per)),bad,used};`);
  chk('AI signs above-minimum free agents (market alive)', r.n > 0, r.n + ' signings');
  chk('AI over the cap: at most one above-minimum signing per team, within MLE, under the tax line', r.max <= 1 && r.bad === 0, `over-cap ${r.over}, max/team ${r.max}, bad ${r.bad}`);
  chk('AI over-cap signing spends the mid-level', r.over === 0 || r.used);
}
// ---------- C: saved chart with a player out ----------
{
  const r = J(`const t=L.teams[5];for(const id of t.roster){L.players[id].injury=0;L.players[id].susp=0;}
    const ps=t.roster.map(id=>L.players[id]).sort((a,b)=>b.ovr-a.ovr).slice(0,9), a=ps.slice(0,5).map(p=>p.id), b=[ps[5],ps[6],ps[7],ps[8],ps[0]].map(p=>p.id);
    t.rotChart={q:[0,1,2,3].map(q=>[a,a,b,a])};
    const playNext=()=>{let g0=L.games.length;for(let d=0;d<6;d++){simDay(L);const g=L.games.slice(g0).find(x=>x.home===5||x.away===5);if(g)return g;g0=L.games.length;}return null;};
    const out=L.players[b[1]];out.injury=8;out.injName='Ankle sprain';
    const g=playNext();out.injury=0;out.injName=null;const tl=g.tl[g.home===5?0:1];const rp=tlReplay(tl,2880+300*(g.ot||0));
    const box=(g.box||[])[g.home===5?0:1];
    let five=0,inOut=0,tot=0;for(let m=0;m<48;m++){const got=rp.byMin[m];if(!got)continue;tot++;if(new Set(got).size===5)five++;if(got.includes(out.id))inOut++;}
    // the stand-in plays the Q block-3 minutes (6-9 of each quarter) in his place: not one of b already
    const sub=(tl.subs||[])[0]||'';const sn=sub.split(': ')[1]||'';const standIn=Object.values(L.players).find(p=>p.team===5&&sn.startsWith(p.name));
    let standMin=0;if(standIn)for(let q=0;q<4;q++)for(let m=q*12+6;m<q*12+9;m++)if((rp.byMin[m]||[]).includes(standIn.id))standMin++;
    // a 4-man block still falls back to the coach
    t.rotChart={q:[[a.slice(0,4),a,a,a],[a,a,a,a],[a,a,a,a],[a,a,a,a]]};const g3=playNext();const tl3=g3.tl[g3.home===5?0:1];t.rotChart=null;
    return {src:tl.src,bad:tl.bad||'',subs:tl.subs||[],five,tot,inOut,stand:standIn?standIn.name:null,standInB:standIn?b.includes(standIn.id):null,standMin,src3:tl3.src,bad3:tl3.bad||''};`);
  chk('chart with an injured player still runs (source = chart, no fallback)', r.src === 'chart' && !r.bad, r.src + ' ' + r.bad);
  chk('game timeline note names who is out and his stand-in', r.subs.length === 1 && / out: .* took his 4 blocks/.test(r.subs[0]), JSON.stringify(r.subs));
  chk('injured player never on court; 5 on court every minute', r.inOut === 0 && r.five === r.tot, r.inOut + ' / ' + r.five + '/' + r.tot);
  chk('stand-in is a player not already in those blocks and plays most of them', r.stand && r.standInB === false && r.standMin >= 8, r.stand + ' ' + r.standMin + '/12');
  chk('chart with a 4-man block still falls back to the coach', r.src3 === 'coach' && /5 different/.test(r.bad3), r.src3 + ' ' + r.bad3);
}
// ---------- D: salary dumps go to teams under the payroll floor first ----------
{
  const r = J(`const cs=capSeason(L),M0=MINPAY;const pay=t=>payNoFloor(L,t,cs);MINPAY=L.teams.map(pay).sort((a,b)=>a-b)[14]+0.01;for(const t of L.teams)if(t.id!==L.user&&pay(t)<MINPAY&&t.roster.length>=15)release(L,rosterOf(L,t).sort((a,b)=>a.ovr-b.ovr)[0]);let n=0,low=0,tot=0;const lows=new Set(L.teams.filter(t=>t.id!==L.user&&pay(t)<MINPAY&&t.roster.length<15).map(t=>t.id));
    for(let i=0;i<200&&lows.size;i++){const tr=salaryDump(L,false);if(!tr)continue;tot++;if(lows.has(tr.b))low++;}
    const anyLow=L.teams.filter(t=>pay(t)<MINPAY).length;MINPAY=M0;
    // floor charge counts only the part still under the floor
    const t=L.teams[0];const f0=t.floorPaid;const s0=payNoFloor(L,t,cs);MINPAY=s0+10;t.floorPaid=[{s:cs,amt:Math.max(1,MINPAY-s0+5)}];const p1=payroll(L,t,cs);t.floorPaid=[{s:cs,amt:5}];const p2=payroll(L,t,cs);t.floorPaid=f0;const MP=MINPAY;MINPAY=M0;
    return {lows:lows.size,tot,low,anyLow,p1:+p1.toFixed(1),p2:+p2.toFixed(1),s0:+s0.toFixed(1),MINPAY:MP};`);
  chk('salary dumps: a team under the payroll floor takes them first (when one fits)', r.lows > 0 && r.tot > 0 && r.low >= r.tot * 0.6, JSON.stringify(r));
  chk('floor charge counts only up to the floor (salary added later uses it up)', Math.abs(r.p1 - Math.max(r.MINPAY, r.s0)) < 0.05 && Math.abs(r.p2 - (r.s0 < r.MINPAY ? Math.min(r.MINPAY, r.s0 + 5) : r.s0)) < 0.05, JSON.stringify([r.p1, r.p2, r.s0, r.MINPAY]));
}
console.log(out.join('\n')); console.log(`\nt32g: ${ok}/${ok + bad}`); process.exit(bad ? 1 : 0);
