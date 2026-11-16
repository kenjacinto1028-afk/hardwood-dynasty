// v33c award report: SNAP=tools/snap/nba-commish-s10.json.gz OLD=0|1 SEED=21 node tools/t33c-awards.js [seasons]
// Plays N seasons from a saved league (commissioner flow, as tools/snap-make.js). OLD=1 = the old award scoring (AW_ADV.on = false).
// Each season prints one "A " JSON line: winners (MVP, DPOY, ROY, 6MOY, MIP) with MPG / GP / PER / WS / BPM, the MVP's WS rank and the
// DPOY's DWS rank among qualified players, and who the other scoring would have picked (ladder leader) on the same season.
const N = +process.argv[2] || 10, OLD = process.env.OLD || '', SNAP = process.env.SNAP || 'tools/snap/nba-commish-s10.json.gz';
// v33d: OLD=v33c = the v33c weights (AW_V33C: MVP game score 40% / WS 20%, team record 1.1, no ROY mpg rule, MIP may go to an MVP-level player);
// OLD=1 = scoring before v33c (AW_ADV.on = false). "other" = the ladder leader under the other setting on the same season.
const { run } = require('./snap.js')(process.env.SRC || 'src', +process.env.SEED || 21, SNAP);
run(`var AWMODE = ${JSON.stringify(OLD)}; var AWR = [];
var AW_NEW = { mvp: Object.assign({}, AW_ADV.mvp), mvpTeam: AW_ADV.mvpTeam, royMpg: AW_ADV.royMpg, mipNoMvp: AW_ADV.mipNoMvp };
function awSet(mode) { if (mode === '1') { AW_ADV.on = false; return; } AW_ADV.on = true; Object.assign(AW_ADV, typeof AW_V33C !== 'undefined' && mode === 'v33c' ? AW_V33C : AW_NEW); }
awSet(AWMODE);
(function () { const ca = computeAwards; computeAwards = function (L) {
  const other = {}; try { awSet(AWMODE ? '' : 'v33c'); for (const k of ['mvp', 'dpoy', 'roy', 'smoy', 'mip']) { const l = awardLadder(L, k, 1); other[k] = l[0] ? l[0].pid : null; } } finally { awSet(AWMODE); }
  const r = ca.apply(this, arguments), A = L.awards[L.season], q = awardQual(L);
  const rank = (pid, f) => { const p = L.players[pid]; if (!p) return null; const v = f(p); return q.filter(x => f(x) > v).length + 1; };
  const line = pid => { const p = L.players[pid]; if (!p) return null; const s = p.stats.rs; return { n: p.name, pid, age: p.age, ovr: p.ovr, gp: s.gp, mpg: Math.round(s.min / s.gp / 6) / 10, ppg: Math.round(s.pts / s.gp * 10) / 10, per: s.per, ws: s.ws, ws48: s.ws48, bpm: s.bpm, dws: s.dws, tm: L.teams[p.team] ? L.teams[p.team].abbr + ' ' + L.teams[p.team].w + '-' + L.teams[p.team].l : '' }; };
  const w = {}; for (const k of ['mvp', 'dpoy', 'roy', 'smoy', 'mip']) w[k] = A[k] != null ? line(A[k]) : null;
  const mvpTop5 = awardLadder(L, 'mvp', 5).map(x => x.pid);
  AWR.push({ s: L.season, w, mipMvpTop5: A.mip != null && mvpTop5.includes(A.mip), mvpWsRank: A.mvp != null ? rank(A.mvp, p => p.stats.rs.ws || 0) : null, dpoyDwsRank: A.dpoy != null ? rank(A.dpoy, p => p.stats.rs.dws || 0) : null,
    other, same: Object.fromEntries(Object.keys(other).map(k => [k, other[k] === A[k]])), all1: A.all1.map(id => L.players[id].name), def1: A.def1.map(id => L.players[id].name) });
  return r; }; })();`);
const t0 = Date.now();
for (let y = 1; y <= N; y++) {
  const r = run(`(function(){ const L = SL; let g = 0; while (L.phase === 'regular' && g++ < 400) simDay(L); processPending(L); startPlayoffs(L); g = 0; while (L.phase === 'playoffs' && g++ < 400) simPlayoffDay(L);
    startOffseason(L); runLottery(L); startDraft(L); g = 0; while (L.phase === 'off-draft' && g++ < 200) aiDraftPick(L); if (L.phase === 'off-resign') startFA(L); g = 0; while (L.phase === 'off-fa' && g++ < 60) faDay(L); processPending(L); startNewSeason(L);
    return JSON.stringify(AWR.shift() || null); })()`);
  console.log('A ' + r); console.error(`season ${y} ${Math.round((Date.now() - t0) / 1000)} s`);
}
