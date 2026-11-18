// Phase A check: expansion from a saved league, then N more seasons. node tools/t-exp.js [snap] [seasons after] [new teams]
const snap = process.argv[2] || 'tools/snap/pbl16-commish-s10.json.gz', N = +(process.argv[3] || 2), K = +(process.argv[4] || 2);
const { run } = require('./snap.js')('src', 5, snap);
let fails = 0; const ok = (c, m) => { console.log((c ? 'PASS ' : 'FAIL ') + m); if (!c) fails++; };
const t0 = Date.now();
const r = JSON.parse(run(`(()=>{ const L = SL, out = { seasons: [] }; out.n0 = L.teams.length;
  const c = xpnCandidates(L); out.cands = c.length;
  out.bad = [xpnPlan(L, c.slice(0, 1)), xpnPlan(L, [Object.assign({}, c[0], { abbr: L.teams[0].abbr }), c[1]])];
  out.err = xpnPlan(L, c.slice(0, ${K}));
  out.planS = L.xpnPlan && L.xpnPlan.s;
  const U = L.user;
  const year = () => { let g = 0; while (L.phase === 'regular' && g++ < 400) simDay(L); processPending(L); startPlayoffs(L); g = 0; while (L.phase === 'playoffs' && g++ < 400) simPlayoffDay(L);
    const champ = L.po.champion;
    startOffseason(L); runLottery(L); startDraft(L); if (U != null) L.user = null; g = 0; while (L.phase === 'off-draft' && g++ < 200) aiDraftPick(L); if (L.phase === 'off-resign') startFA(L);
    g = 0; while (L.phase === 'off-fa' && g++ < 60) faDay(L); processPending(L);
    if (U != null) { L.user = U; const t = L.teams[U]; while (t.roster.length > 15) { const p = rosterOf(L, t).sort((a, b) => a.ovr - b.ovr)[0]; release(L, p); } }
    startNewSeason(L); return champ; };
  for (let y = 0; y < ${N} + 1; y++) {
    const champ = year();
    const gp = L.teams.map(t => 0); for (const d of L.schedule) for (const [h, a] of d) { gp[h]++; gp[a]++; }
    const ros = L.teams.map(t => t.roster.length), news = L.teams.filter(t => t.xpn != null);
    out.seasons.push({ s: L.season, n: L.teams.length, champ, gpMin: Math.min(...gp), gpMax: Math.max(...gp), sg: L.sg, rosMin: Math.min(...ros), rosMax: Math.max(...ros),
      newRec: news.map(t => t.abbr + ' ' + (L.history.find(h => h.s === L.season - 1) || { standings: [] }).standings.filter(x => x.tid === t.id).map(x => x.w + '-' + x.l).join('')),
      newOvr: news.map(t => Math.round(rosterOf(L, t).sort((a, b) => b.ovr - a.ovr).slice(0, 8).reduce((a, p) => a + p.ovr, 0) / 8)),
      lgOvr: Math.round(L.teams.reduce((a, t) => a + rosterOf(L, t).sort((x, y) => y.ovr - x.ovr).slice(0, 8).reduce((b, p) => b + p.ovr, 0) / 8, 0) / L.teams.length),
      pay: news.map(t => Math.round(payroll(L, t))), divs: news.map(t => t.div || '-'), picks: news.map(t => L.picks.filter(k => k.orig === t.id).length) });
  }
  const X = (L.xpnLog || [])[0]; out.xp = X ? { s: X.s, picks: X.picks.length, lose: X.lose, maxFrom: Math.max(...Object.values(X.picks.reduce((m, x) => (m[x.from] = (m[x.from] || 0) + 1, m), {}))), top: X.picks.slice(0, 4).map(x => x.name + ' ' + x.ovr) } : null;
  out.big = isBig(L); out.n = L.teams.length;
  out.noTeam = Object.values(L.players).filter(p => p.team != null && !L.teams[p.team].roster.includes(p.id)).length;
  out.dup = L.teams.reduce((a, t) => a + t.roster.filter(id => L.players[id].team !== t.id).length, 0);
  return JSON.stringify(out); })()`));
console.log(JSON.stringify(r, null, 1));
ok(r.bad[0] && r.bad[1], 'bad plans refused: ' + r.bad.join(' | '));
ok(!r.err, 'plan accepted ' + (r.err || ''));
ok(r.xp && r.xp.picks >= K * 7, 'expansion draft picked ' + (r.xp && r.xp.picks));
ok(r.xp && r.xp.maxFrom <= r.xp.lose, 'no team lost more than ' + (r.xp && r.xp.lose));
ok(r.n === r.n0 + K, 'league size ' + r.n0 + ' -> ' + r.n);
for (const s of r.seasons.slice(1)) { ok(s.gpMin === s.sg && s.gpMax === s.sg, `S${s.s} every team has ${s.sg} games (${s.gpMin}-${s.gpMax})`); ok(s.rosMin >= 13 && s.rosMax <= 15, `S${s.s} rosters ${s.rosMin}-${s.rosMax}`); }
ok(r.noTeam === 0 && r.dup === 0, 'rosters consistent');
console.log(fails ? fails + ' FAILED' : 'ALL PASS', Math.round((Date.now() - t0) / 1000) + 's');
process.exit(fails ? 1 : 0);
