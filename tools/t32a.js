// v32a S1: node tools/t32a.js [quick]   (SEED=n default 3)
// A ratings applied (exact attribute deltas vs the same league without the table, Embiid -5, injury prone)
// B roster: Porzingis retired (career rows kept), GSW 15, Lakers (Thiero rookie, Knecht FA)
// C LaMelo starts (3 seeds) + rmb rule (cap, team change); fewer top-3 players benched
// D Luka vs DAL permanent grudge, rivalry tag, survives a move and addGrudge
// E extensions: years left = this season + new years; rookie 4-yr extension keeps 4; 2-yr minimum keeps 2
// F draft offers: accepting one removes the others for the same pick; Negotiate target tab (source check)
// "quick" skips E-F draft part that steps a season.
const fs = require('fs'), load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 3, quick = process.argv[2] === 'quick';
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const NB = `newLeague({mode:'commish',size:30,games:82,nba:true})`;

// ---------- A ratings: same seed with and without the table ----------
{
  const dump = (clear) => JSON.parse(load(SRC, SEED).run(`(function(){ ${clear ? "for (const k of Object.keys(NBA_ADJ)) delete NBA_ADJ[k]; for (const k of Object.keys(NBA_OVR_ADJ)) delete NBA_OVR_ADJ[k]; for (const k of Object.keys(NBA_PRONE)) delete NBA_PRONE[k];" : ''}
    const L=${NB}; const o={}; for (const p of Object.values(L.players)) if (p.real) o[p.name]={ovr:p.ovr,ipt:p.ipt,dur:p.dur,a:Object.fromEntries(['fin','mid','tp','pst','ft','hnd','pas','orb','drw','per','pdf','stl','blk','drb','iq'].map(k=>[k,p[k]]))}; return JSON.stringify(o); })()`));
  const base = dump(true), now = dump(false);
  const NAD = JSON.parse(load(SRC, SEED).run(`JSON.stringify(NBA_ADJ)`));
  let allOk = true, bads = [];
  for (const n in NAD) { for (const k in NAD[n]) { const want = Math.max(1, Math.min(99, base[n].a[k] + NAD[n][k])), got = now[n].a[k]; if (got !== want) { allOk = false; bads.push(n + '.' + k + ' ' + base[n].a[k] + '->' + got + ' want ' + want); } } }
  chk('every attribute delta in the table is applied exactly (' + Object.keys(NAD).length + ' players)', allOk, bads.slice(0, 4).join('; '));
  chk('Embiid overall exactly -5', now['Joel Embiid'].ovr - base['Joel Embiid'].ovr === -5, base['Joel Embiid'].ovr + '->' + now['Joel Embiid'].ovr);
  chk('Kawhi + Embiid injury prone (ipt >= 2)', now['Kawhi Leonard'].ipt >= 2 && now['Joel Embiid'].ipt >= 2, now['Kawhi Leonard'].ipt + ',' + now['Joel Embiid'].ipt);
  chk('Kawhi scoring + rebounding + passing all down 3', ['fin', 'mid', 'tp', 'pst', 'orb', 'drb', 'pas'].every(k => now['Kawhi Leonard'].a[k] === base['Kawhi Leonard'].a[k] - 3));
  chk('Ware / Holmgren / Mobley rebounding -7', ["Kel'el Ware", 'Chet Holmgren', 'Evan Mobley'].every(n => now[n].a.orb === base[n].a.orb - 7 && now[n].a.drb === base[n].a.drb - 7));
  const z = now['Ivica Zubac'], zb = base['Ivica Zubac']; chk('Zubac: finishing / rebounding / defense up 2-3, overall up', z.a.fin - zb.a.fin >= 2 && z.a.drb - zb.a.drb >= 2 && z.a.pdf - zb.a.pdf >= 2 && z.ovr > zb.ovr && z.ovr - zb.ovr <= 4, zb.ovr + '->' + z.ovr);
  const k = now['Walker Kessler'], kb = base['Walker Kessler']; chk('Kessler: blk/pdf +3, offense attributes -3', k.a.blk - kb.a.blk === 3 && k.a.pdf - kb.a.pdf === 3 && k.a.fin - kb.a.fin === -3 && k.a.pas - kb.a.pas === -3, kb.ovr + '->' + k.ovr);
  const changed = Object.keys(now).filter(n => now[n].ovr !== base[n].ovr && !NAD[n] && n !== 'Joel Embiid');
  chk('nobody outside the table changes overall (no random drift)', changed.length === 0, changed.slice(0, 5).join(','));
  fs.writeFileSync('tools/runs32/ovr-before-after.csv', 'name,ovr_before,ovr_after,diff\n' + Object.keys(now).filter(n => base[n]).sort().map(n => [JSON.stringify(n), base[n].ovr, now[n].ovr, now[n].ovr - base[n].ovr].join(',')).join('\n') + '\n');
}

// ---------- B roster + C lineups + D Luka (3 seeds) ----------
for (const seed of [SEED, SEED + 1, SEED + 2]) {
  const r = JSON.parse(load(SRC, seed).run(`(function(){ const L=${NB}, by=n=>Object.values(L.players).find(p=>p.name===n), T=ab=>L.teams.find(t=>t.abbr===ab), o={};
    const po = by('Kristaps Porzingis'), gs = T('GSW'); o.porz = { ret: !!po.retired, team: po.team, onGSW: gs.roster.includes(po.id), rows: (nbaPastRows(po) || []).length, gsw: gs.roster.length, gswNums: new Set(rosterOf(L, gs).map(p => p.num)).size };
    const lal = T('LAL'), th = by('Adou Thiero'), kn = by('Dalton Knecht'); o.lal = { n: lal.roster.length, th: th.team === lal.id, rk: th.rookieSeason === L.season, thC: th.contract && th.contract.len, kn: kn.team == null && L.fa.includes(kn.id) && !kn.retired, thNum: th.num != null };
    const mn = T('MIN'), g = buildSide(L, mn.id, true, false); o.melo = g.court.map(p => p.name).includes('LaMelo Ball');
    o.rmbMax = Math.max(...Object.values(L.players).filter(p => p.real).map(p => Math.abs(p.rmb || 0)));
    o.rmbMoved = ['LaMelo Ball', 'Ayo Dosunmu', 'Jaylen Brown'].map(n => by(n).rmb || 0);
    let ben = 0; for (const t of L.teams) { const gg = buildSide(L, t.id, true, false), st = new Set(gg.court.map(p => p.id)); rosterOf(L, t).filter(p => !(p.injury > 0)).sort((a, b) => b.ovr - a.ovr).slice(0, 2).forEach(p => { if (!st.has(p.id)) ben++; }); } o.ben2 = ben;
    const lk = by('Luka Doncic'), dal = T('DAL'); o.luka = { perm: (lk.grudge || []).some(x => x.tid === dal.id && x.perm && x.until >= 9000), vs: !!grudgeVs(L, lk, dal.id), tag: permGrudgeGame(L, lk.team, dal.id), tagOther: permGrudgeGame(L, lk.team, T('BOS').id) };
    L.season = 14; const keep = grudgeVs(L, lk, dal.id); addGrudge(L, lk, dal.id, 'x'); o.luka.later = !!keep && (lk.grudge || []).filter(x => x.tid === dal.id).length === 1 && lk.grudge.find(x => x.tid === dal.id).perm === 1;
    L.season = 1; const bos = T('BOS'); removeFromTeam(L, lk); addToTeam(L, lk, bos.id); o.luka.moved = permGrudgeGame(L, bos.id, dal.id) && !permGrudgeGame(L, lal.id, dal.id);
    L.season = 1; const g2 = playGame(L, bos.id, dal.id, false); o.luka.special = (g2.special || []).some(x => x.pid === lk.id && x.grudge) || JSON.stringify(g2.special || []).includes('"grudge":true');
    return JSON.stringify(o); })()`));
  const s = 'seed ' + seed + ': ';
  chk(s + 'Porzingis retired, off GSW, real career rows kept, GSW has 15 + unique numbers', r.porz.ret && r.porz.team == null && !r.porz.onGSW && r.porz.rows >= 8 && r.porz.gsw === 15 && r.porz.gswNums === 15, JSON.stringify(r.porz));
  chk(s + 'Lakers: 15 players, Thiero on roster + rookie + number, Knecht free agent', r.lal.n === 15 && r.lal.th && r.lal.rk && r.lal.kn && r.lal.thNum, JSON.stringify(r.lal));
  chk(s + 'LaMelo starts for MIN', r.melo);
  chk(s + 'rmb capped at 4; players who changed teams have none', r.rmbMax <= 4 && r.rmbMoved[0] === 0 && r.rmbMoved[2] === 0, r.rmbMax + ' ' + r.rmbMoved);
  chk(s + 'top-2 healthy players benched across the league <= 6 (before the fix 12-16)', r.ben2 <= 6, r.ben2);
  chk(s + 'Luka: permanent grudge vs DAL, rivalry tag on LAL-DAL, not on LAL-BOS', r.luka.perm && r.luka.vs && r.luka.tag && !r.luka.tagOther, JSON.stringify(r.luka));
  chk(s + 'Luka grudge survives later seasons + addGrudge, follows him to a new team, boosts him in the game', r.luka.later && r.luka.moved && r.luka.special, JSON.stringify(r.luka));
}

// ---------- E contracts ----------
{
  const r = JSON.parse(load(SRC, SEED).run(`(function(){ const L=newLeague({mode:'team',size:30,userTeam:13,games:82,nba:true}), o={rk:[],min:[]}; L.phase='regular'; L.day=5;
    const me=L.teams[13], by=n=>Object.values(L.players).find(p=>p.name===n);
    // offer exactly what he wants for the years offered (the counter always works): returns the final negotiate() result
    const close=(p,tid,yrs,type)=>{ let r=negotiate(L,p.id,MINSAL,yrs,tid,type,null,{}); for (let i=0;i<3&&!r.ok&&!r.refused;i++){ const m=/wants \\$([0-9.]+)M\\/yr for \\d+ year/.exec(r.msg); if(!m) break; r=negotiate(L,p.id,+m[1],yrs,tid,type,null,{}); } return r; };
    // Luka: expiring deal, 4-year extension -> 5 years left everywhere
    const lk=by('Luka Doncic'); lk.contract.exp=L.season; lk.contract.len=3; lk.contract.opt=null; const before=yrsLeft(L,lk), res=close(lk,13,4,'extension');
    o.luka={ok:res.ok,msg:(res.msg||'').slice(0,90),yrs:res.accepted&&res.accepted.yrs,ext:lk.ext&&lk.ext.yrs,before,left:yrsLeft(L,lk),end:contractEnd(lk)-L.season+1,cap5:capProjection(L,me).players.find(r=>r.p===lk).cells.filter(Boolean).length};
    // young players on rookie deals (early extension window): 4-year extension keeps 4
    let n=0; for (const t of L.teams) for (const p of rosterOf(L,t)) { if (n>=8) break; if (!(p.contract&&p.contract.type==='rookie')) continue; p.contract.exp=L.season+1; p.contract.len=4; p.contract.opt=null; p.ext=null; if(!canExtend(L,p)) continue;
      L.user=t.id; const rr=close(p,t.id,4,'extension'); if(rr.refused) continue; n++; o.rk.push({n:p.name,ok:rr.ok,yrs:rr.accepted&&rr.accepted.yrs,ext:p.ext&&p.ext.yrs,mval:Math.round(p.mval*10)/10,amt:p.ext&&p.ext.amt,disc:!!(p.ext&&p.ext.amt<0.8*p.mval),msg:rr.ok?'':(rr.msg||'').slice(0,70)}); }
    L.user=13;
    // 2-year minimum deals for free agents whose ask fell to the minimum (market value above it): the old rule cut these to 1 year
    while (me.roster.length > 11) { const x=rosterOf(L,me).sort((a,b)=>a.ovr-b.ovr)[0]; removeFromTeam(L,x); x.contract=null; L.fa.push(x.id); }
    for (const id of L.fa.slice(0,60)) { const p=L.players[id]; if (!p||me.roster.length>=14||p.retired||p.prospect) continue; if (o.min.length>=4) break; setAsk(L,p); p.mval=Math.max(p.mval,4); p.ask=MINSAL; p.prefY=2; const rr=negotiate(L,p.id,MINSAL,2,13,'signing',null,{}); o.min.push({n:p.name,ok:rr.ok,yrs:rr.accepted&&rr.accepted.yrs,len:p.contract&&p.contract.len,msg:rr.ok?'':(rr.msg||'').slice(0,60)}); }
    return JSON.stringify(o); })()`));
  chk('Luka 4-yr extension accepted as 4', r.luka.ok && r.luka.yrs === 4 && r.luka.ext === 4, JSON.stringify(r.luka));
  chk('Luka years left 1 -> 5 (yrsLeft, contractEnd, cap projection shows 5 seasons)', r.luka.before === 1 && r.luka.left === 5 && r.luka.end === 5 && r.luka.cap5 === 5, JSON.stringify(r.luka));
  chk('rookie 4-yr extensions keep 4 years (' + r.rk.length + ' tested, ' + r.rk.filter(x => x.disc).length + ' below 80% of value)', r.rk.length >= 3 && r.rk.every(x => x.ok && x.yrs === 4 && x.ext === 4), JSON.stringify(r.rk.slice(0, 5)));
  chk('2-year minimum deals keep 2 years (' + r.min.length + ' tested)', r.min.length >= 3 && r.min.every(x => x.ok && x.yrs === 2 && x.len === 2), JSON.stringify(r.min));
}
// UI source checks (the browser check covers the flows)
{
  const app = fs.readFileSync(SRC + '/app.js', 'utf8'), lg = fs.readFileSync(SRC + '/league.js', 'utf8');
  chk("Negotiate on an offer opens the Trade center tab", /ui\.tGet = \{[^]*?ui\.trTab = 'center'/.test(app));
  chk('contractCell uses yrsLeft (extension counts)', /const yl = yrsLeft\(L, p\);/.test(app));
  chk('no silent 1-year shortening left in negotiate()', !/he took a discount/.test(lg) && !/disc \? 1 : yrs/.test(lg));
}

// ---------- F draft offers ----------
if (!quick) {
  const STEP = `function stepL(L){switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':processPending(L);startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;default:return false;}return true;}`;
  const r = JSON.parse(load(SRC, SEED).run(`${STEP}(function(){ const L=newLeague({mode:'team',size:16,userTeam:3,games:30,nba:false}); let g=0; while (L.phase!=='off-draft' && g++<4000) stepL(L); const o={phase:L.phase};
    // natural trade-up offers are conditional, so build the offers by hand in the same shape tradeUpOffer returns
    const idx=L.draftIdx; L.draftOrder[idx].owner=L.user; const slot=L.draftOrder[idx], cur=L.picks.find(k=>k.s===L.season&&k.rd===slot.rd&&k.orig===slot.orig);
    cur.owner=L.user; const mk=(j,id,extra)=>{ const s2=L.draftOrder[j], th=L.picks.find(k=>k.s===L.season&&k.rd===s2.rd&&k.orig===s2.orig); return Object.assign({a:s2.owner,b:L.user,aGive:{players:[],picks:[th.id]},bGive:{players:[],picks:[cur.id]},id,draft:true,slotIdx:idx,ttl:1,why:'test'},extra||{}); };
    const js=[]; for (let j=idx+1;j<L.draftOrder.length&&js.length<2;j++) if (L.draftOrder[j].owner!==L.user&&!js.some(x=>L.draftOrder[x].owner===L.draftOrder[j].owner)) js.push(j);
    const mine=L.teams[L.user].roster[0], other=L.teams.find(t=>t.id!==L.user&&t.id!==L.draftOrder[js[0]].owner&&t.id!==L.draftOrder[js[1]].owner);
    L.offers=[mk(js[0],'o1'),mk(js[1],'o2'),{a:other.id,b:L.user,aGive:{players:[],picks:[]},bGive:{players:[mine],picks:[]},id:'o3'}];   // o3 is unrelated (asks for a player, not the pick)
    o.before=L.offers.length; o.valid=L.offers.every(x=>x.id==='o3'||offerValid(L,x));
    o.err=acceptOffer(L,'o1'); o.ids=L.offers.map(x=>x.id);
    return JSON.stringify(o); })()`));
  chk('draft: two offers for the user pick exist and are valid', r.before === 3 && r.valid && r.phase === 'off-draft', JSON.stringify(r));
  chk('draft: accepting one offer removes every other offer for that pick, unrelated offers stay', r.err == null && !r.ids.includes('o1') && !r.ids.includes('o2') && r.ids.includes('o3'), JSON.stringify(r));
}
fs.writeFileSync('tools/runs32/t32a.txt', out.join('\n') + '\n');
console.log(out.join('\n')); console.log(`\nt32a: ${ok}/${ok + bad}`); process.exit(bad ? 1 : 0);
