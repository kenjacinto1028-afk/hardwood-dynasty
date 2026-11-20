// Live coaching check (Nov 20 2026): plays your next game paused before every possession, makes calls, and checks they take effect.
const {run} = require('./snap.js')('src', 5, 'tools/snap/nba-team-s10.json.gz');
console.log(run(`(()=>{ const L = SL, out = {}, ok = (k, v) => { out[k] = v ? 'PASS' : 'FAIL'; };
  while (!L.schedule[L.day].some(([h, a]) => h === L.user || a === L.user)) simDay(L);
  const [h, a] = L.schedule[L.day].find(([h, a]) => h === L.user || a === L.user), me = h === L.user ? 0 : 1;
  const runOne = (calls) => { const snap = JSON.stringify(L.players), lg = liveGameStart(L, h, a, false); lg.step(1); const x = lg.ctx, G = me === 0 ? x.H : x.A;
    calls(lg, x, G); while (!lg.step(x.LOG.length + 1)) { if (calls.each) calls.each(lg, x, G); } const g = lg.game; const res = { g, G };
    const ps = JSON.parse(snap); for (const id in ps) Object.assign(L.players[id], ps[id]); return res; };
  // 1. no calls: a full game comes out
  const r0 = runOne(() => {}); out.plain = [r0.g.hs, r0.g.as, r0.g.pbp.length]; ok('plainGame', r0.g.hs + r0.g.as > 150 && r0.g.pbp.length > 200);
  // 2. play call: every half-court play is a spot-up
  const r1 = runOne((lg, x) => x.cmd({ k: 'play', side: me, v: 'spot' })); const pp = r1.g.pt[me === 0 ? h : a]; out.playMix = pp; ok('playCall', pp.spot && pp.spot[0] > 40 && !pp.pnr);
  // 3. zone defense: logged and kept all game
  const r2 = runOne((lg, x) => x.cmd({ k: 'cov', side: me, v: 'zone' })); ok('zone', r2.G.cov === 'zone' && r2.g.pbp.some(e => /2-3 zone/.test(e[3])));
  // 4. timeouts: 3 calls, 3 fewer left
  let n = 0; const calls = (lg, x) => {}; calls.each = (lg, x) => { if (n < 3 && x.LOG.length > 50 + n * 60) { x.cmd({ k: 'to', side: me }); n++; } };
  const r3 = runOne(calls); ok('timeouts', r3.g.pbp.filter(e => e[6].includes('t') && e[2] === me).length >= 3);
  // 5. sub: bench player in, held for 4 minutes
  const r4 = runOne((lg, x, G) => { const outP = G.court[0], inP = G.players.find(p => !G.court.includes(p) && !G.out.has(p.id)); out.sub = x.cmd({ k: 'sub', side: me, out: outP.id, in: inP.id }); out.subIn = inP.id; });
  ok('sub', out.sub === null && r4.g.pbp.some(e => e[6].includes('u') && e[2] === me));
  // 6. coached game feeds simDay
  const lg = liveGameStart(L, h, a, false); beforeDay(L); L.preGame = lg.finish(); const d0 = L.day, n0 = L.games.length; simDay(L);
  ok('simDayUsesIt', L.day === d0 + 1 && L.games.includes(lg.game) && lg.game.id === L.games.indexOf(lg.game) + 1 && !L.preGame);
  return JSON.stringify(out); })()`));
