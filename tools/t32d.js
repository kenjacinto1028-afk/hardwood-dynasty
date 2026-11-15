// v32d S4: node tools/t32d.js   (SEED=n default 5)  engine side of the UI pass
// A mid-level: mleStatus (open / eligible / why), a signing with mle:false keeps it, default (and mle:true) spends it, AI rule unchanged
// B coaching targets (free agents): every target fits under the hard cap and carries a cap-fit note
// C rotation chart round trip: a saved chart is used, reset (null) goes back to the coach pattern; tl starters/minutes follow the chart
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 5;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = load(SRC, SEED);
const J = c => JSON.parse(run(`JSON.stringify((function(){${c}})())`));
run(`var L=newLeague({mode:'team',size:30,userTeam:5,games:82,nba:true});`);
// ---------- A: mid-level ----------
{
  const r = J(`const t=L.teams[L.user];const pay=payroll(L,t);
    const a=mleStatus(L,t,CAP+2,MLE-1);                    // an offer under the MLE, payroll just over the cap, under the tax line
    t.mleUsed=capSeason(L);const b=mleStatus(L,t,pay,3);t.mleUsed=null;
    const c=mleStatus(L,t,CAP-5,3);                        // fits under the cap: not needed
    const d=mleStatus(L,t,TAXLINE+1,MLE-1);                // over the tax line
    const e=mleStatus(L,t,CAP-1,MLE+2);                    // over the MLE amount
    return {pay,CAP,TAXLINE,MLE,a:[a.open,a.left,a.eligible,a.why],b:[b.open,b.left,b.eligible,b.why],c:c.why,d:d.why,e:e.why};`);
  chk('mleStatus: open + eligible when the deal crosses the cap under the tax line', r.a[0] === true && r.a[1] === r.MLE && r.a[2] === true, JSON.stringify(r.a));
  chk('mleStatus: used -> left 0, not eligible', r.b[0] === false && r.b[1] === 0 && r.b[2] === false && /used/.test(r.b[3]), JSON.stringify(r.b));
  chk('mleStatus reasons: fits under cap / over tax line / over MLE', /fits under the cap/.test(r.c) && /tax line/.test(r.d) && /over/.test(r.e), [r.c, r.d, r.e].join(' | '));
}
{
  // put the user team just over the cap by raising salaries is invasive; instead drive signContract directly on a fresh FA with payroll forced above the cap
  const r = J(`const t=L.teams[L.user];const fa=L.fa.map(id=>L.players[id]).filter(p=>p&&!p.prospect).sort((a,b)=>b.ovr-a.ovr);
    const mk=(i)=>fa[i];
    // pad payroll above the cap with dead money so any deal > minimum crosses it
    t.dead=(t.dead||[]).concat([{pid:-1,name:'x',amt:Math.max(0,CAP-payroll(L,t)+3),exp:capSeason(L)}]);
    while(t.roster.length>13)release(L,t.roster[t.roster.length-1]);
    const pay0=payroll(L,t);
    const p1=mk(0),p2=mk(1);
    t.mleUsed=null;signContract(L,p1,t.id,4,1,'signing',null,{mle:false,role:null});const keep=t.mleUsed;
    signContract(L,p2,t.id,4,1,'signing',null,{mle:true});const spent=t.mleUsed;
    const p3=mk(2);t.mleUsed=null;signContract(L,p3,t.id,4,1,'signing',null,{});const dflt=t.mleUsed;
    return {pay0,CAP,keep:keep==null?null:keep,spent,dflt,cs:capSeason(L)};`);
  chk('payroll over the cap for the signing test', r.pay0 + 4 > r.CAP, r.pay0 + ' vs ' + r.CAP);
  chk('signing with mle:false keeps the mid-level', r.keep == null, String(r.keep));
  chk('signing with mle:true spends it', r.spent === r.cs, String(r.spent));
  chk('signing with no flag (AI rule) spends it', r.dflt === r.cs, String(r.dflt));
}
// ---------- B: coaching targets ----------
{
  const r = J(`const me=L.teams[L.user];me.dead=(me.dead||[]).filter(d=>d.pid>=0);
    const low=L.teams.slice().sort((a,b)=>payroll(L,a)-payroll(L,b))[0];
    const res={};
    for(const [nm,t] of [['low',low],['me',me]]){res[nm]={};for(const tab of ['plan','now','dev']){const l=coachTargets(L,t,'fa',tab);const pay=payroll(L,t);
      res[nm][tab]={n:l.length,pay,over:l.filter(x=>contractHit(x.p.ask,false)>0&&pay+contractHit(x.p.ask,false)>APRON+1e-6).length,noNote:l.filter(x=>!x.cap).length,notes:l.map(x=>x.cap.slice(0,24))};}}
    // squeeze low-payroll team to about 12M under the hard cap: only cheap FAs should remain, all "hard cap" / minimum / tax notes
    low.dead=(low.dead||[]).concat([{pid:-2,name:'y',amt:Math.max(0,APRON-payroll(L,low)-12),exp:capSeason(L)}]);
    const l2=coachTargets(L,low,'fa','now'),pay2=payroll(L,low);
    res.tight={n:l2.length,over:l2.filter(x=>contractHit(x.p.ask,false)>0&&pay2+contractHit(x.p.ask,false)>APRON+1e-6).length,notes:l2.map(x=>x.cap.slice(0,24)),room:APRON-pay2,maxAsk:Math.max(0,...l2.map(x=>x.p.ask))};
    return res;`);
  const all = ['plan', 'now', 'dev'];
  chk('targets: nobody over the hard cap (2 teams, 3 tabs)', ['low', 'me'].every(w => all.every(k => r[w][k].over === 0)), JSON.stringify(['low', 'me'].map(w => all.map(k => r[w][k].over))));
  chk('targets: every FA target has a cap-fit note', ['low', 'me'].every(w => all.every(k => r[w][k].noNote === 0)), JSON.stringify(['low', 'me'].map(w => all.map(k => r[w][k].noNote))));
  chk('lowest-payroll team gets "Fits cap space" or minimum notes', r.low.now.n === 0 || r.low.now.notes.some(x => /cap space|Minimum|tax line/.test(x)), r.low.now.notes.join(' | '));
  chk('squeezed team: nobody asks more than the room under the hard cap', r.tight.over === 0 && r.tight.maxAsk <= r.tight.room + 1e-6, JSON.stringify(r.tight));
  chk('squeezed team: notes are hard-cap / minimum', r.tight.n === 0 || r.tight.notes.every(x => /hard cap|Minimum|tax line|cap space/.test(x)), r.tight.notes.join(' | '));
}
// ---------- C: rotation chart round trip ----------
{
  const r = J(`const t=L.teams[L.user];t.dead=(t.dead||[]).filter(d=>d.pid>=0);
    const ids=t.roster.map(id=>L.players[id]).filter(p=>p.injury<=0).sort((a,b)=>b.ovr-a.ovr).slice(0,8).map(p=>p.id);
    const A=ids.slice(0,5),B=[ids[0],ids[1],ids[5],ids[6],ids[7]];
    t.rotChart={q:[0,1,2,3].map(q=>[A,B,A,B])};
    const g=buildSide(L,t.id,true,false);const src1=g.planSrc;const set1=[...g.court.map(p=>p.id)].sort().join();
    t.rotChart=null;const g2=buildSide(L,t.id,true,false);
    return {src1,src2:g2.planSrc,startsA:set1===A.slice().sort().join(),mins:g.target[ids[0]]/60};`);
  chk('saved chart is used (planSrc chart), starters = first block', r.src1 === 'chart' && r.startsA, r.src1);
  chk('reset (rotChart = null) goes back to the coach pattern', r.src2 === 'coach', r.src2);
  chk('chart minutes follow the blocks (player in every block = 48)', r.mins === 48, r.mins);
}
console.log(out.join('\n')); console.log(`\nt32d: ${ok}/${ok + bad}`); process.exit(bad ? 1 : 0);
