// v25.2 checks (free throws, hack limits, play types, coverages, adjustments, play-by-play): node unit-v252.js <src dir>
const fs = require('fs'), vm = require('vm'); const SRC = process.argv[2] || '/home/claude/v252/src'; let s = +(process.env.SEED || 52);
const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ctx = vm.createContext({ __rs: { get: () => s, set: v => { s = v; } }, console, Math: Object.create(Math, { random: { value: rnd } }), setTimeout, clearTimeout, Date, performance, structuredClone, JSON, Object, Array, Set, Map });
vm.runInContext(fs.readFileSync(SRC + '/engine.js', 'utf8') + '\n' + fs.readFileSync(SRC + '/league.js', 'utf8'), ctx);
const out = vm.runInContext(`(function(){ const res = []; const ok = (n, c, x) => res.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? '  [' + x + ']' : ''));
// ---- free throws
const kn = v => v > ENG.knee ? ENG.knee + (v - ENG.knee) * ENG.kneeSlope : v, ftp = v => ENG.ftA + kn(v) * ENG.ftB;
ok('FT formula: 30 -> 50%, 50 -> 64%, 75 -> 81%, 90 -> ~90%', Math.abs(ftp(30) - 0.504) < 0.006 && Math.abs(ftp(50) - 0.64) < 0.006 && Math.abs(ftp(75) - 0.81) < 0.006 && ftp(90) > 0.88 && ftp(90) < 0.92, [30, 50, 75, 90].map(v => (ftp(v) * 100).toFixed(1)).join('/'));
const gen = {}; for (const pos of POS) { const a = []; for (let i = 0; i < 400; i++) a.push(genPlayer(pos, gauss(0, 1), 26, new Set()).ft); gen[pos] = a; }
const mean = a => a.reduce((x, y) => x + y, 0) / a.length, sd = a => Math.sqrt(mean(a.map(x => (x - mean(a)) ** 2)));
ok('FT ratings by position: guards high, centers low', mean(gen.PG) > mean(gen.SF) && mean(gen.SF) > mean(gen.PF) && mean(gen.PF) > mean(gen.C) && mean(gen.C) < 60, POS.map(p => p + ' ' + mean(gen[p]).toFixed(0)).join(', '));
ok('wider FT spread for bigs', sd(gen.C) > sd(gen.PG) + 1.5, sd(gen.PG).toFixed(1) + ' vs ' + sd(gen.C).toFixed(1));
ok('a few non-shooters among guards and wings', [...gen.PG, ...gen.SG, ...gen.SF].filter(x => x < 50).length >= 3);
// ---- league with your team
const L = newLeague({ mode: 'team', userTeam: 0, size: 30 });
// playbooks
const side = (tid, home) => { const g = buildSide(L, tid, home, false); playbookOf(L, g); return g; };
const ins = L.teams.find(t => t.coach.off === 'inside'), pac = L.teams.find(t => t.coach.off === 'pace');
if (ins && pac) { const a = side(ins.id, true), b = side(pac.id, false), sh = (g, k) => g.pb[k] / PLAY_KEYS.reduce((x, y) => x + g.pb[y], 0);
  ok('playbooks follow the system: inside-out posts up more than pace & space', sh(a, 'post') > sh(b, 'post') * 2, (sh(a, 'post') * 100).toFixed(0) + '% vs ' + (sh(b, 'post') * 100).toFixed(0) + '%'); }
L.teams[0].pbAdj = { iso: 0, spot: 4 }; const u = side(0, true);
ok('your sliders change your playbook (iso off, spot-up up)', u.pb.iso === 0 && u.pb.spot > PB_SYS[L.teams[0].coach.off].spot);
L.teams[0].pbAdj = null;
L.teams[0].cov = 'blitz'; ok('your pregame coverage is used', covOf(L, L.teams[0]) === 'blitz'); L.teams[0].cov = null;
ok('every coach has a default coverage that fits his system', L.teams.every(t => COVS.includes(coachCov(t.coach)) && (t.coach.def !== 'switch' || ['switch', 'hedge'].includes(coachCov(t.coach)))));
// ---- a stretch of games
for (let i = 0; i < 25; i++) simDay(L);
const mine = L.games.filter(g => g.home === 0 || g.away === 0), others = L.games.filter(g => g.home !== 0 && g.away !== 0);
ok('your games keep a play-by-play log; other games do not', mine.length > 5 && mine.every(g => g.pbp && g.pbp.length > 150) && others.every(g => !g.pbp), mine.length + ' games, ' + (mine[0] && mine[0].pbp.length) + ' entries');
const g0 = mine[0], last = g0.pbp[g0.pbp.length - 1];
ok('log ends on the final score', last[4] === g0.hs && last[5] === g0.as, last[5] + '-' + last[4] + ' vs ' + g0.as + '-' + g0.hs);
// running box from the log == the box score
let boxOK = true; for (const g of mine.slice(0, 6)) { const st = {}; for (const e of g.pbp) if (e[7]) for (let j = 0; j < e[7].length; j += 3) { st[e[7][j]] = st[e[7][j]] || new Array(15).fill(0); st[e[7][j]][e[7][j + 1]] += e[7][j + 2]; }
  for (const r of g.box) { const x = st[r[0]] || new Array(15).fill(0); for (const i of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14]) if (x[i] !== r[2 + i]) boxOK = false; } }
ok('replaying the log rebuilds the exact box score', boxOK);
const txt = mine.flatMap(g => g.pbp.map(e => e[3])).join('\\n');
ok('every play type shows up in the feed', PLAY_KEYS.filter(k => txt.includes(PLAYS[k].n + ':')).length >= 10, PLAY_KEYS.filter(k => !txt.includes(PLAYS[k].n + ':')).join(','));
ok('late-game sets show up (ATO, 2-for-1, hold for last shot)', /ATO · /.test(txt) && /2-for-1/.test(txt) && /Hold for last shot/.test(txt));
ok('timeouts and quarter ends are logged', /Timeout /.test(txt) && /End of Q4/.test(txt));
ok('clutch tags only in the last 5 minutes within 5', mine.every(g => g.pbp.filter(e => e[6].includes('c')).every(e => e[0] >= 4 && e[1] <= 300)));
// play stats
const t0 = L.teams[0], pt = t0.pt || {}, n = Object.values(pt).reduce((a, x) => a + x[0], 0);
ok('team points per possession by play type recorded', n > 1000 && PLAY_KEYS.every(k => pt[k] && pt[k][0] > 0), n + ' possessions');
const lg = {}; for (const k of [...PLAY_KEYS, 'trans']) { let a = 0, b = 0; for (const t of L.teams) if (t.pt && t.pt[k]) { a += t.pt[k][0]; b += t.pt[k][1]; } lg[k] = b / a; }
ok('league PPP by play is sensible (0.8-1.35)', Object.values(lg).every(v => v > 0.8 && v < 1.35), Object.entries(lg).map(([k, v]) => k + ' ' + v.toFixed(2)).join(', '));
ok('cuts and transition beat isolations', lg.cut > lg.iso && lg.trans > lg.iso);
const pp = rosterOf(L, t0).filter(p => p.stats.pt); ok('player play-type stats recorded', pp.length >= 8 && pp.every(p => Object.keys(p.stats.pt).every(k => PLAYS[k])));
// defensive adjustments
const adj = L.games.filter(g => g.pbp).flatMap(g => g.pbp.filter(e => e[6].includes('a')).map(e => e[3]));
ok('defenses adjust in some games (coverage, doubles, matchups)', adj.length >= 3 && adj.some(t => /switches to|starts switching/.test(t)), adj.length + ': ' + adj.slice(0, 2).join(' | '));
const changed = L.games.filter(g => g.cov && /[>]/.test(g.cov.join())).length;
ok('coverage changes happen in a minority of games', changed > 0 && changed / L.games.length < 0.6, changed + ' of ' + L.games.length);
// hack-a-player limits
let hk = 0, hkGames = 0, over = 0; for (const g of L.games) { const h = g.lg.hack[0] + g.lg.hack[1]; if (h) { hkGames++; hk += h; } if (g.lg.hack[0] > 8 || g.lg.hack[1] > 8) over++; }
ok('hack-a-player in 10% of games or fewer, never more than 2 short spells', hkGames / L.games.length <= 0.1 && over === 0, hkGames + ' of ' + L.games.length);
// forced hack test: a hacking coach against a 20-FT center
const H = L.teams[1], A = L.teams[2]; H.coach.id = 0; let hc = 0; for (let i = 1; i < 200; i++) { H.coach.id = i; if (coachLate(H.coach).hack) { hc = i; break; } }
const brick = rosterOf(L, A).filter(p => p.injury <= 0).sort((a, b) => b.ovr - a.ovr)[0]; brick.ft = 20;
let hs = 0, games = 0, bad = 0; for (let i = 0; i < 40; i++) { const g = playGame(L, H.id, A.id, false); games++; const x = g.lg.hack[0]; hs += x; if (x > 8) bad++; }
ok('a hacking coach uses short spells (<= 8 hacks a game)', bad === 0 && hs > 0, (hs / games).toFixed(2) + ' hacks/game');
// same result with or without the log
const ids = [...L.teams[0].roster, ...L.teams[3].roster], snapP = ids.map(id => structuredClone(L.players[id])); const sv = __rs.get(); const gA = playGame(L, 0, 3, false); const s2 = __rs.get(); __rs.set(sv); snapP.forEach(p => { for (const k of Object.keys(L.players[p.id])) delete L.players[p.id][k]; Object.assign(L.players[p.id], p); }); L.noLog = true; const gB = playGame(L, 0, 3, false); L.noLog = false; __rs.set(s2);
ok('the log does not change results', gA.hs === gB.hs && gA.as === gB.as && !!gA.pbp && !gB.pbp, gA.as + '-' + gA.hs + ' / ' + gB.as + '-' + gB.hs);
// playoff adjustments carry over within a series
L.teams.forEach(t => t.w = t.w || 0); while (L.phase === 'regular') simDay(L); startPlayoffs(L); let k = 0; while (L.phase === 'playoffs' && k++ < 12) simPlayoffDay(L);
const srs = L.po.rounds.flat().filter(sr => sr.adj); ok('playoff series remember each side\\'s adjustments', srs.length > 0 && srs.every(sr => Object.values(sr.adj).every(a => COVS.includes(a.cov))));
return res; })()`, ctx);
console.log(out.join('\n')); console.log(out.filter(x => x.startsWith('FAIL')).length, 'failed of', out.length);
