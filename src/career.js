// My Career mode (Nov 19 2026). Create a player, play a pipeline season (a few games with decisions, the rest simmed), earn XP, get drafted.
// Logic (top) works without the page; the UI part (bottom) needs app.js (window.PBL). State: L.career, player flag p.career.
// Hooks: engine simDay -> careerDay; league pipeSeason -> careerPipeLine / careerPipeRec; growProspect skips p.career; app interruptKind -> CAR.pending.

// ---------- backstories ----------
const CAR_STORIES = {
  grinder: { n: 'Small-town grinder', t: 'No big offers, no hype. You got here by outworking everyone in a gym with a leaky roof.', ovr: -2, pot: 4, wet: 4, xp: 1.1, fame: 0 },
  blue: { n: 'Five-star recruit', t: 'Every scout knows your name. Mixtapes since you were 14, and the pressure that comes with it.', ovr: 3, pot: 2, wet: 2, xp: 1, fame: 30, scout: 4 },
  family: { n: 'Basketball family', t: 'Your father played 11 years as a pro. You grew up in locker rooms and read the game like a coach.', ovr: 1, pot: 1, wet: 3, xp: 1, fame: 15, add: { iq: 8, ocn: 4, dcn: 4 } },
  street: { n: 'Streetball legend', t: 'Famous on every outdoor court in the city. Flashy handles, fearless at the rim, still learning structure.', ovr: 0, pot: 2, wet: 2, xp: 1, fame: 10, add: { hnd: 6, fin: 4, iq: -5 } },
  intl: { n: 'International phenom', t: 'Signed your first pro deal at 16 overseas. Grown men taught you the game the hard way.', ovr: 1, pot: 1, wet: 3, xp: 1, fame: 10, add: { pas: 4, iq: 4 }, path: 'EABL' },
  late: { n: 'Late bloomer', t: 'Grew five inches in two years. Your body is still catching up, but the ceiling is sky high.', ovr: -3, pot: 7, wet: 3, xp: 1, fame: 0, traj: 'late' },
  comeback: { n: 'Injury comeback', t: 'A torn knee cost you a year. You rebuilt your game in the weight room and you are hungrier than anyone.', ovr: -2, pot: 3, wet: 5, xp: 1.15, fame: 5 },
  twosport: { n: 'Two-sport athlete', t: 'You gave up football for basketball. The athleticism is rare; the jump shot is a work in progress.', ovr: 0, pot: 3, wet: 3, xp: 1, fame: 8, add: { spd: 6, vrt: 6, str: 6, tp: -5, mid: -3 } }
};
const CAR_PATHS = { NCHF: 'College (NCHF)', EABL: 'Europe (EABL)', APBA: 'Asia-Pacific (APBA)' };
const CAR_FX = { ovr0: 42, pot0: 71, played: 6, lgAvg: { NCHF: 40, EABL: 48, APBA: 41 }, diff: { NCHF: 48, APBA: 50, EABL: 55, PRO: 57 }, score: { NCHF: 72, EABL: 80, APBA: 84 } };
const CAR_GRADES = ['F', 'D', 'C', 'C+', 'B', 'B+', 'A', 'A+'], CAR_GXP = [0, 6, 12, 18, 25, 32, 40, 50];
const CAR_UP_KEYS = [['Athletic', ['spd', 'agi', 'vrt', 'str']], ['Scoring', ['fin', 'pst', 'mid', 'tp', 'ft', 'drw']], ['Playmaking', ['hnd', 'pas', 'iq']], ['Defense', ['per', 'pdf', 'stl', 'blk']], ['Rebounding', ['orb', 'drb']]];

const carP = L => L && L.career ? L.players[L.career.pid] : null;
const carOn = L => !!(L && L.career && carP(L));

// ---------- create ----------
// o: { first, last, pos (0-4), hgt (inches), style (archetype name for that position), story (key), path (NCHF/EABL/APBA), team (index or null), num }
function carCreate(L, o) {
  const st = CAR_STORIES[o.story] || CAR_STORIES.grinder, posK = POS[o.pos] || 'SF', lg = st.path || o.path || 'NCHF';
  const p = newPlayer(L, posK, 0.4, 19);
  p.first = (o.first || 'Rookie').trim().slice(0, 20); p.last = (o.last || 'Player').trim().slice(0, 24); p.name = p.first + ' ' + p.last;
  if (o.nat) p.nat = o.nat;
  p.hgt = clamp(Math.round(o.hgt || HGT_MEAN[posK]), 69, 90); p.wgt = Math.round(clamp(185 + (p.hgt - 75) * 8 + (posK === 'C' ? 12 : posK === 'PF' ? 6 : 0), 165, 290)); p.wing = p.hgt + 3;
  p.keepPos = o.pos; p.uni = null; delete p.giant; delete p.xo;
  // the style shapes the ratings (archetype weights), then the whole profile is scaled to the starting level
  const w = (ARCH[posK] || {})[o.style] || {};
  for (const k in w) if (PROG_KEYS.includes(k)) p[k] = r99(p[k] + w[k] * 4);
  for (const k in (st.add || {})) p[k] = r99(p[k] + st.add[k]);
  assignPositions(p);
  const ovr0 = CAR_FX.ovr0 + (st.ovr || 0);
  scaleToOvr(p, ovr0);
  for (const k in w) if (PROG_KEYS.includes(k)) p[k] = r99(p[k] + w[k] * 1.5);   // keep his signature skill after scaling
  p.ovr = ovr(p);
  p.age = 19; p.dAge = 19; p.draftOvr = p.ovr; p.peak = 27; p.regStart = 31;
  if (st.traj) setTraj(p, st.traj); else setTraj(p, 'std');
  p.pot = Math.max(p.ovr + 10, CAR_FX.pot0 + (st.pot || 0));
  p.wet = st.wet; p.wrk = r99(WET_WRK[p.wet]); p.knW = true; p.knI = true; p.ipt = 1; p.dur = 70;
  p.path = 'avg'; p.bloom = false; p.noGrow = false; delete p.ceil; delete p.severe;
  p.fame = st.fame || 0; p.num = o.num != null ? clamp(+o.num, 0, 99) : p.num;
  setBallDominance(p); addTendencies(p);
  for (const k in w) { if (TEND_K.includes(k)) { fillTv(p); p.tv[k] += w[k] * 6; p[k] = r99(p[k] + w[k] * 6); } else if (k === 'tbd' || k === 'tpa' || k === 'tcs') p[k] = r99((p[k] || 50) + w[k] * 6); else if (k[0] === 'l' && ['tbd', 'tpa', 'tcs'].includes(k.slice(1))) p[k.slice(1)] = r99((p[k.slice(1)] || 50) - w[k] * 6); }   // the style's habits (archetypes = how he plays)
  p.arch = archetypes(p); p.prospect = true; p.draftYear = L.season; p.tier = 'first'; p.career = true;
  p.scout = Math.round(clamp(p.pot + (st.scout || 0), p.ovr, 99)); p.seen = 0;
  // pipeline: one season with the chosen league / team, then the draft
  L.classes[L.season] = L.classes[L.season] || []; L.classes[L.season].push(p.id);
  pipeInit(L); if (L.pipe.s !== L.season) pipeBuild(L);
  p.src = lg === 'NCHF' ? 'c' : 'i'; if (lg === 'NCHF') p.yrsCol = 1; else p.yrsIntl = 1;
  const nT = PIPE_TEAMS[lg].length, ti = o.team != null && o.team >= 0 && o.team < nT ? +o.team : rint(0, nT - 1);
  p.pl = lg; p.pt = ti; p.pFrom = L.season;
  { const tm = L.pipe.lg[lg].t[ti]; if (tm.f.length) tm.f.splice(tm.f.reduce((m, f, k, a) => f.o < a[m].o ? k : m, 0), 1); }
  p.tx.push({ s: L.season, t: `Joined ${pipeTeamName(lg, ti)} (${lg})` });
  L.career = { pid: p.id, story: o.story, style: o.style || '', lg, team: ti, s0: L.season, xp: 40, xpTot: 40, games: [], log: [], ups: {}, cur: null, trust: 50, stop: 'all', pro: [] };
  carLog(L, `Your story begins: ${st.n}. You start at ${pipeTeamName(lg, ti)} (${lg}).`);
  carSchedule(L);
  return p;
}
function carLog(L, t) { const C = L.career; C.log.push({ s: L.season, d: L.day, t }); if (C.log.length > 200) C.log.shift(); }

// ---------- pipeline schedule ----------
function carSchedule(L) {
  const C = L.career, lg = C.lg, G = PIPE_LG[lg].G, nT = PIPE_TEAMS[lg].length, D = Math.max(G, (L.schedule || []).length - 2);
  const opps = []; let k = 0; while (opps.length < G) { const o = (C.team + 1 + (k++ % (nT - 1))) % nT; opps.push(o); }
  for (let j = opps.length - 1; j > 0; j--) { const m = Math.floor(R() * (j + 1)); [opps[j], opps[m]] = [opps[m], opps[j]]; }
  const play = new Set(); for (let i = 0; i < CAR_FX.played; i++) play.add(Math.min(G - 1, Math.round((i + 0.5) * G / CAR_FX.played)));
  C.games = opps.map((o, i) => ({ i, day: Math.floor(i * D / G), opp: o, home: i % 2 === 0, play: play.has(i), done: false }));
}
function carTeamStr(L, lg, ti) {
  const ros = pipeRosters(L, L.season)[lg][ti] || [], fl = (L.pipe.lg[lg].t[ti] || { f: [] }).f;
  const v = ros.map(p => p.ovr).concat(fl.map(f => f.o)).sort((a, b) => b - a).slice(0, 8);
  return v.reduce((a, b) => a + b, 0) / Math.max(1, v.length);
}
// his normal game in this league (season averages before noise)
function carBase(L, p, lg) {
  const raw = pipeRaw(p), q = clamp((p.ovr - (CAR_FX.lgAvg[lg] || 60)) / 8, -1.2, 3);
  const pts = clamp((9 + q * 4) * raw.sc, 3, 30), ast = clamp((2.2 + q * 0.7) * raw.as, 0.5, 10);
  return { min: clamp(24 + q * 4, 14, 36), pts, reb: clamp((4 + q) * raw.rb, 1, 14), ast, stl: clamp(0.9 * raw.st * (1 + q * 0.1), 0.2, 3), blk: clamp(0.6 * raw.bk * (1 + q * 0.1), 0, 4), tov: 1.2 + ast * 0.25, tpm: pts * raw.tp / 3 };
}
const carVal = l => l.pts + 0.7 * l.reb + 0.9 * l.ast + 1.3 * (l.stl + l.blk) - 0.8 * (l.tov || 0);
function carNoise(b, k) { const out = {}; for (const s in b) out[s] = s === 'min' ? Math.round(clamp(b.min * gauss(1, 0.08), 6, 44)) : Math.max(0, Math.round(b[s] * k * Math.exp(gauss(0, 0.35) - 0.06))); if (out.tpm * 3 > out.pts) out.tpm = Math.floor(out.pts / 3); return out; }
function carGradeOf(r) { return r >= 1.55 ? 7 : r >= 1.3 ? 6 : r >= 1.15 ? 5 : r >= 1.0 ? 4 : r >= 0.88 ? 3 : r >= 0.75 ? 2 : r >= 0.55 ? 1 : 0; }
function carXpK(L) { const st = CAR_STORIES[L.career.story]; return st && st.xp || 1; }
// end a game: result, grade, XP, record
function carSettle(L, g, line, mom, played) {
  const C = L.career, p = carP(L), lg = C.lg, b = carBase(L, p, lg);
  const ratio = carVal(line) / Math.max(4, carVal(b));
  const my = carTeamStr(L, lg, C.team), op = carTeamStr(L, lg, g.opp);
  const win = R() < pipeWin(my + mom * 0.8 + (ratio - 1) * 3 + (g.home ? 0.8 : -0.8), op);
  const avg = CAR_FX.score[lg] || 75, mar = rint(1, 16), ws = Math.round(avg + gauss(0, 6) + mar / 2), ls = Math.max(40, ws - mar);
  const us = win ? ws : ls; line.pts = Math.min(line.pts, us - 10);
  const gr = carGradeOf(ratio + (win ? 0.05 : -0.05)), xp = Math.round((played ? 30 + CAR_GXP[gr] + (win ? 10 : 0) : 10 + CAR_GXP[gr] / 3 + (win ? 4 : 0)) * carXpK(L));
  Object.assign(g, { done: true, played: !!played, win, us, them: win ? ls : ws, line, gr, xp });
  C.xp += xp; C.xpTot += xp;
  return g;
}
function carSimOne(L, g) { const p = carP(L); return carSettle(L, g, carNoise(carBase(L, p, L.career.lg), 1), 0, false); }
// called after every sim day: games before today that were not played are simmed
function careerDay(L, games) {
  if (!carOn(L)) return;
  const p = carP(L);
  if (p.prospect) { if (L.phase === 'regular' && p.pl) for (const g of L.career.games) if (!g.done && g.day < L.day) carSimOne(L, g); return; }
  // pro: grade + XP from his real box score; a game you played (decisions) earns more and moves coach trust
  const C = L.career, fx = C.proFx; if ((games || []).some(g => g.home === p.team || g.away === p.team) || L.phase === 'regular') C.proFx = null;
  for (const g of games || []) { const r = (g.box || []).find(x => x[0] === p.id); if (!r) continue;
    const v = k => r[2 + IX[k]] || 0, line = { min: Math.round(v('min') / 60), pts: v('pts'), reb: v('orb') + v('drb'), ast: v('ast'), stl: v('stl'), blk: v('blk'), tov: v('tov'), tpm: v('tpm'), fgm: v('fgm'), fga: v('fga') };
    if (!line.min) continue;
    const gs = carVal(line), avg = C.proAvg != null ? C.proAvg : Math.max(4, (p.ovr - 40) * 0.6), played = !!(fx && fx.pid === p.id);
    const side = r[1], tid = side === 0 ? g.home : g.away, win = side === 0 ? g.hs > g.as : g.as > g.hs;
    const gr = carGradeOf(gs / Math.max(4, avg) + (win ? 0.05 : -0.05) + (played ? fx.good * 0.03 : 0));
    const xp = Math.round((played ? 12 + CAR_GXP[gr] * 0.4 + (win ? 4 : 0) : 3 + Math.max(0, gs) / 4) * (g.playoff ? 1.5 : 1) * carXpK(L));
    C.xp += xp; C.xpTot += xp; C.proAvg = C.proAvg == null ? gs : C.proAvg * 0.9 + gs * 0.1;
    if (played) C.trust = clamp(C.trust + (gr >= 5 ? 2 : gr >= 3 ? 1 : gr <= 1 ? -2 : 0) + (fx.good >= 3 ? 1 : 0), 0, 100);
    const opp = side === 0 ? g.away : g.home, us = side === 0 ? g.hs : g.as, them = side === 0 ? g.as : g.hs;
    const e = { s: L.season, gid: g.id, po: !!g.playoff, tid, opp, home: side === 0, win, us, them, line, gr, xp, played, res: played ? fx.res : null };
    C.pro.push(e); if (C.pro.length > 40) C.pro.shift();
    if (played) C.lastRes = e;
    if (gr >= 7 && line.pts >= 30) carLog(L, `${line.pts} points vs ${(L.teams[opp] || {}).abbr || ''}. A+ game.`);
  }
}
// ---------- pro games ----------
// today's game for his team (regular season or playoffs), or null
function carProToday(L) {
  const p = carP(L); if (!p || p.prospect || p.team == null || p.injury > 0) return null;
  if (L.phase === 'regular') { const d = L.schedule && L.schedule[L.day]; const m = d && d.find(([h, a]) => h === p.team || a === p.team); return m ? { key: L.season + ':r:' + L.day, opp: m[0] === p.team ? m[1] : m[0], home: m[0] === p.team, po: false } : null; }
  if (L.phase === 'playoffs' && L.po) { const sr = (L.po.rounds[L.po.stage] || []).find(x => x.winner == null && (x.hi === p.team || x.lo === p.team)); if (!sr) return null; return { key: L.season + ':p:' + L.po.stage + ':' + sr.games.length, opp: sr.hi === p.team ? sr.lo : sr.hi, home: null, po: true, sr }; }
  return null;
}
function carBigGame(L, t) { if (t.po) return true; const p = carP(L), tm = L.teams[p.team]; try { if (isRivalry(L, p.team, t.opp)) return true; } catch (e) { } return ((tm.w + tm.l) % 5) === 0; }
function careerProPending(L) {
  if (!carOn(L)) return null; const C = L.career, t = carProToday(L); if (!t || C.proKey === t.key) return null;
  if (C.stop === 'none') return null; if (C.stop === 'big' && !carBigGame(L, t)) return null;
  return t;
}
// decisions for a pro game: the same moments, but they change his form / usage in the real engine (L.career.proFx, read in playGame0)
function carProStart(L) { const t = carProToday(L); if (!t) return null; const p = carP(L); L.career.cur = { pro: t.key, sc: carScenes(p), step: 0, mom: 0, add: {}, res: [], down: rint(1, 3) }; return L.career.cur; }
function carProFx(L) {
  const C = L.career, cur = C.cur; if (!cur || !cur.pro) return null;
  const good = cur.res.filter(r => r.ok).length, a = cur.add, shots = (a.pts || 0) / 2, tr = (C.trust - 50) / 50;
  const fx = { key: cur.pro, pid: C.pid, good, res: cur.res.map(r => r.ok ? 1 : 0),
    o: clamp((good - 2) * 1.2 + cur.mom * 0.35 + tr, -4, 5), d: clamp(((a.stl || 0) + (a.blk || 0)) * 0.8 + cur.mom * 0.2, -3, 4),
    ub: clamp(1 + shots * 0.05 + tr * 0.05 - (a.ast || 0) * 0.02, 0.85, 1.35), tm: clamp((a.ast || 0) * 0.3 + cur.mom * 0.1, -1, 1.5) };
  C.proFx = fx; C.proKey = cur.pro; C.cur = null; return fx;
}
// engine hook (playGame0): apply today's decisions to his side
function careerGameFx(league, H, A) {
  const fx = league.career && league.career.proFx; if (!fx) return;
  for (const g of [H, A]) { const p = g.players.find(x => x.id === fx.pid); if (!p || !g.form[p.id]) continue;
    g.form[p.id].o += fx.o; g.form[p.id].d += fx.d; g.ub[p.id] = (g.ub[p.id] || 1) * fx.ub;
    for (const q of g.players) if (q !== p && g.form[q.id]) g.form[q.id].o += fx.tm; }
}
// the playable game waiting today (stops the sim)
function careerPending(L) {
  if (!carOn(L)) return null;
  if (!carP(L).prospect) return careerProPending(L);
  if (L.phase !== 'regular') return null;
  const p = carP(L); if (!p.prospect || !p.pl) return null;
  return L.career.games.find(g => !g.done && g.play && g.day <= L.day) || null;
}
// pipeSeason hooks: his season line and his team's record come from his games
function careerPipeLine(L, p, lg) {
  if (!p || !p.career || !carOn(L) || L.career.lg !== lg) return null;
  const gs = L.career.games.filter(g => g.done && g.line); if (!gs.length) return null;
  const n = gs.length, a = k => Math.round(gs.reduce((s, g) => s + (g.line[k] || 0), 0) / n * 10) / 10;
  return { gp: n, min: a('min'), pts: a('pts'), reb: a('reb'), ast: a('ast'), stl: a('stl'), blk: a('blk'), tpm: a('tpm') };
}
function careerPipeRec(L, lg) {
  if (!carOn(L) || L.career.lg !== lg) return null;
  const gs = L.career.games.filter(g => g.done); if (!gs.length) return null;
  const w = gs.filter(g => g.win).length, G = PIPE_LG[lg].G;
  return { t: L.career.team, w: Math.round(w * G / gs.length), l: G - Math.round(w * G / gs.length) };
}

// ---------- decisions ----------
// opts: l label, k rating keys, d difficulty shift, ok / no: stat changes (+ m momentum, t text)
const CAR_SCENES = [
  { k: 'open3', w: [3, 3, 2, 1, 0.5], t: 'The defender goes under the screen. You have an open look from deep.', o: [
    { l: 'Let it fly', k: ['tp'], d: 0, ok: { pts: 3, tpm: 1, m: 1, t: 'Splash. Nothing but net.' }, no: { m: -0.3, t: 'Rattles in and out.' } },
    { l: 'Attack the closeout', k: ['fin', 'spd'], d: 3, ok: { pts: 2, m: 0.8, t: 'You blow by him and finish at the rim.' }, no: { tov: 1, m: -0.8, t: 'Help defense strips you on the drive.' } },
    { l: 'Swing it to the open man', k: ['pas', 'iq'], d: -8, ok: { ast: 1, m: 0.5, t: 'Extra pass, corner three, good offense.' }, no: { m: 0, t: 'Your teammate misses the open look.' } }] },
  { k: 'iso', w: [2, 3, 3, 1, 0.5], t: 'Shot clock winding down. Ball in your hands, one-on-one at the top of the key.', o: [
    { l: 'Step-back jumper', k: ['mid', 'hnd'], d: 4, ok: { pts: 2, m: 1, t: 'Step-back, rise, bucket. The bench is on its feet.' }, no: { m: -0.4, t: 'Heavily contested and short.' } },
    { l: 'Drive and draw contact', k: ['fin', 'drw'], d: 2, ok: { pts: 3, m: 1.2, t: 'And-one! You hit the free throw too.' }, no: { tov: 1, m: -0.8, t: 'Charge called. Coach is not happy.' } },
    { l: 'Kick to the corner', k: ['pas'], d: -6, ok: { ast: 1, m: 0.4, t: 'Shooter knocks it down at the buzzer.' }, no: { m: -0.2, t: 'Shot clock violation.' } }] },
  { k: 'break', w: [2, 2, 2, 2, 1], t: 'You poke the ball loose and it is a 2-on-1 the other way.', o: [
    { l: 'Finish it yourself', k: ['fin', 'vrt'], d: 0, ok: { pts: 2, stl: 1, m: 1.5, t: 'You rise up and throw it down. The crowd erupts.' }, no: { stl: 1, m: 0, t: 'The defender recovers and blocks it.' } },
    { l: 'Lob it up', k: ['pas'], d: 2, ok: { ast: 1, stl: 1, m: 1.5, t: 'Perfect lob. Your teammate slams it home.' }, no: { stl: 1, tov: 1, m: -0.5, t: 'The lob sails out of bounds.' } },
    { l: 'Pull up for a jumper', k: ['mid'], d: 4, ok: { pts: 2, stl: 1, m: 0.6, t: 'Smooth pull-up, good.' }, no: { stl: 1, m: -0.3, t: 'Pull-up rims out.' } }] },
  { k: 'post', w: [0, 0.5, 1.5, 3, 4], t: 'You seal a smaller defender deep in the paint.', o: [
    { l: 'Back him down', k: ['pst', 'str'], d: 0, ok: { pts: 2, m: 1, t: 'Drop step, easy two.' }, no: { m: -0.4, t: 'Double team arrives and the shot is altered.' } },
    { l: 'Face up and shoot', k: ['mid'], d: 6, ok: { pts: 2, m: 0.7, t: 'Turnaround jumper, swish.' }, no: { m: -0.3, t: 'Off the back iron.' } },
    { l: 'Pass out of the double', k: ['pas', 'iq'], d: -4, ok: { ast: 1, m: 0.6, t: 'Kick-out, three, money.' }, no: { tov: 1, m: -0.6, t: 'The pass is picked off.' } }] },
  { k: 'stopper', w: [2, 2, 2, 1.5, 1], t: 'Their best scorer has 12 already. Coach asks who wants him.', o: [
    { l: 'I got him', k: ['per', 'agi'], d: 3, ok: { stl: 1, m: 2, t: 'You lock him up. He goes cold the rest of the half.' }, no: { m: -1.2, t: 'He cooks you twice in a row.' } },
    { l: 'Stay on my man, help smart', k: ['iq'], d: -6, ok: { m: 0.6, t: 'Solid team defense. Nobody gets an easy look.' }, no: { m: -0.3, t: 'A blown rotation gives up a layup.' } },
    { l: 'Jump the passing lanes', k: ['stl'], d: 4, ok: { stl: 1, pts: 2, m: 1.5, t: 'Pick-six! Steal and an uncontested layup.' }, no: { m: -1, t: 'You gamble, miss, and they get an open three.' } }] },
  { k: 'rim', w: [0.3, 0.5, 1, 2.5, 4], t: 'A guard turns the corner and attacks the rim.', o: [
    { l: 'Go for the block', k: ['blk', 'vrt'], d: 2, ok: { blk: 1, m: 1.8, t: 'Sent into the third row!' }, no: { m: -0.8, t: 'Foul on the arm, and-one for him.' } },
    { l: 'Take the charge', k: ['iq', 'str'], d: 4, ok: { m: 1.5, t: 'You plant your feet. Offensive foul.' }, no: { m: -0.6, t: 'Blocking foul. Two free throws.' } },
    { l: 'Wall up and box out', k: ['drb', 'pdf'], d: -5, ok: { reb: 1, m: 0.5, t: 'Tough miss, you grab the board.' }, no: { m: -0.4, t: 'He finishes over you.' } }] },
  { k: 'glass', w: [1, 1, 1.5, 3, 3.5], t: 'A teammate fires a three. The ball is in the air.', o: [
    { l: 'Crash the offensive glass', k: ['orb', 'vrt'], d: 2, ok: { reb: 1, pts: 2, m: 1, t: 'Tip-in! Second-chance points.' }, no: { m: -0.6, t: 'They get the board and leak out for a fast break.' } },
    { l: 'Get back on defense', k: ['iq'], d: -10, ok: { m: 0.3, t: 'Transition stopped. Disciplined.' }, no: { m: -0.2, t: 'They score anyway.' } },
    { l: 'Box out and secure it', k: ['drb', 'str'], d: -2, ok: { reb: 1, m: 0.4, t: 'You own the paint.' }, no: { m: -0.3, t: 'Long rebound goes the other way.' } }] },
  { k: 'pnr', w: [4, 3, 1, 0.3, 0], t: 'High pick-and-roll. Their big man drops back into the paint.', o: [
    { l: 'Pull-up jumper', k: ['mid', 'tp'], d: 2, ok: { pts: 2, m: 0.8, t: 'He gave you space, you made him pay.' }, no: { m: -0.3, t: 'Pull-up is long.' } },
    { l: 'Hit the roller', k: ['pas', 'iq'], d: -2, ok: { ast: 1, m: 0.8, t: 'Pocket pass, dunk.' }, no: { tov: 1, m: -0.6, t: 'The pass gets deflected.' } },
    { l: 'Turn the corner', k: ['spd', 'fin'], d: 4, ok: { pts: 2, m: 1, t: 'Around the big, reverse layup.' }, no: { m: -0.5, t: 'The big recovers and swats it.' } }] },
  { k: 'trap', w: [3, 2.5, 1.5, 0.5, 0.3], t: 'They send a hard trap at you near half court.', o: [
    { l: 'Split the trap', k: ['hnd', 'spd'], d: 4, ok: { pts: 2, m: 1.2, t: 'You split it and race to the rim.' }, no: { tov: 1, m: -1, t: 'Stripped. Easy two for them.' } },
    { l: 'Pass out of it', k: ['pas', 'iq'], d: -4, ok: { ast: 1, m: 0.5, t: 'Quick pass, 4-on-3, layup.' }, no: { tov: 1, m: -0.6, t: 'Floating pass picked off.' } },
    { l: 'Call timeout', k: ['iq'], d: -20, ok: { m: 0, t: 'Safe. Coach draws up a new play.' }, no: { m: -0.2, t: 'Ten-second violation.' } }] },
  { k: 'hustle', w: [1, 1, 1, 1, 1], t: 'A loose ball is rolling toward the sideline.', o: [
    { l: 'Dive for it', k: ['str', 'spd'], d: -2, ok: { m: 1.5, t: 'You dive, save it, and the bench goes crazy.' }, no: { m: -0.2, t: 'Just out of reach.' } },
    { l: 'Let it go, stay ready', k: ['iq'], d: -15, ok: { m: 0, t: 'Their ball. On to the next one.' }, no: { m: -0.3, t: 'They inbound for an easy look.' } }] }
];
const CAR_CLUTCH = { k: 'clutch', t: 'Down {d} with 24 seconds left. Timeout. Coach looks at you.', o: [
  { l: 'Give me the ball', k: ['best'], d: 6, ok: { pts: 2, m: 3, t: 'You take over. Bucket! The building shakes.' }, no: { m: -2, t: 'Your shot is off. Game slips away.' } },
  { l: 'Run it for the hot hand', k: ['pas', 'iq'], d: 0, ok: { ast: 1, m: 2.2, t: 'You draw two defenders and find him. Money.' }, no: { m: -1.4, t: 'He misses the look.' } },
  { l: 'Set the screen, crash the boards', k: ['orb', 'str'], d: 2, ok: { reb: 1, pts: 2, m: 2, t: 'Miss, but you tip it in!' }, no: { m: -1.4, t: 'They secure the rebound.' } }] };
const carRating = (p, ks) => ks[0] === 'best' ? Math.max(p.fin, p.mid, p.tp) : ks.reduce((a, k) => a + (p[k] || 50), 0) / ks.length;
function carChance(L, p, opt) { const D = p.prospect ? (CAR_FX.diff[L.career.lg] || 50) : CAR_FX.diff.PRO + (L.career.trust - 50) / -10; return clamp(0.5 + (carRating(p, opt.k) - D - (opt.d || 0)) / 40, 0.08, 0.92); }
function carScenes(p) {
  const pool = CAR_SCENES.slice(), out = [];
  for (let i = 0; i < 3; i++) { const sc = wpick(pool, pool.map(s => s.w[p.pos] + 0.05)); out.push(sc.k); pool.splice(pool.indexOf(sc), 1); }
  out.push('clutch'); return out;
}
const carScene = k => k === 'clutch' ? CAR_CLUTCH : CAR_SCENES.find(s => s.k === k);
// start / step / finish a played game (state in L.career.cur)
function carStart(L, g) { const p = carP(L); L.career.cur = { gi: g.i, sc: carScenes(p), step: 0, mom: 0, add: {}, res: [], down: rint(1, 3) }; return L.career.cur; }
function carChoose(L, oi) {
  const C = L.career, cur = C.cur, p = carP(L); if (!cur || cur.step >= cur.sc.length) return null;
  const sc = carScene(cur.sc[cur.step]), opt = sc.o[oi]; if (!opt) return null;
  const ch = carChance(L, p, opt), ok = R() < ch, fx = ok ? opt.ok : opt.no;
  for (const k in fx) if (k !== 't' && k !== 'm') cur.add[k] = (cur.add[k] || 0) + fx[k];
  cur.mom += fx.m || 0; cur.res.push({ k: sc.k, o: oi, ok, t: fx.t }); cur.step++;
  return { ok, t: fx.t, ch };
}
function carFinish(L) {
  const C = L.career, cur = C.cur; if (!cur) return null;
  const g = C.games[cur.gi], p = carP(L), line = carNoise(carBase(L, p, C.lg), 0.8);
  for (const k in cur.add) line[k] = (line[k] || 0) + cur.add[k];
  const good = cur.res.filter(r => r.ok).length; line.min = Math.round(line.min + (good - 2) * 1.5);
  carSettle(L, g, line, cur.mom, true); g.res = cur.res.map(r => r.ok ? 1 : 0); C.cur = null;
  if (g.gr >= 6) carLog(L, `${CAR_GRADES[g.gr]} game vs ${pipeTeam(C.lg, g.opp).abbr}: ${line.pts} pts, ${line.reb} reb, ${line.ast} ast.`);
  return g;
}

// ---------- XP upgrades ----------
function carCost(p, k) { const r = p[k] || 50, phys = ATH.includes(k) ? 1.5 : 1; return Math.round((5 + Math.max(0, r - 40) / 5 + Math.pow(Math.max(0, r - 75), 2) / 25) * phys); }
function carUpgrade(L, k) {
  const C = L.career, p = carP(L); if (!p || !PROG_KEYS.includes(k)) return 'Unknown rating.';
  if (p[k] >= 99) return 'Already maxed.';
  const c = carCost(p, k); if (C.xp < c) return `Not enough XP (needs ${c}).`;
  const o0 = p.ovr; C.xp -= c; p[k] = Math.min(99, p[k] + 1); C.ups[k] = (C.ups[k] || 0) + 1;
  assignPositions(p); p.ovr = ovr(p);
  if (p.ovr > o0) { const d = p.ovr - o0; p.pot = Math.max(p.pot + d * 0.5, p.ovr + 3); p.pot = Math.round(p.pot); if (p.prospect) { p.draftOvr = p.ovr; p.scout = Math.round(clamp(p.scout + d * 0.7, p.ovr, 99)); } }
  if (p.pot <= p.ovr) p.pot = p.ovr + 1;
  p.arch = archetypes(p); setBallDominance(p);
  return null;
}
// season averages from his games
function carSeasonLine(L) {
  const gs = (L.career.games || []).filter(g => g.done && g.line); if (!gs.length) return null;
  const n = gs.length, a = k => Math.round(gs.reduce((s, g) => s + (g.line[k] || 0), 0) / n * 10) / 10;
  return { gp: n, w: gs.filter(g => g.win).length, min: a('min'), pts: a('pts'), reb: a('reb'), ast: a('ast'), stl: a('stl'), blk: a('blk'), tov: a('tov'), tpm: a('tpm') };
}

// ===================== UI =====================
if (typeof window !== 'undefined') window.CAR = (function () {
  if (!window.PBL) return null;
  with (window.PBL) {   // eslint-disable-line no-with
    const S = () => (ui.car = ui.car || { first: '', last: '', pos: 2, hgt: 79, style: '', story: 'grinder', path: 'NCHF', team: -1, num: 23 });
    const styles = pos => Object.keys(ARCH[POS[pos]] || {});
    // ----- setup form (shown on New league when My Career is picked) -----
    function setupForm() {
      const s = S(), st = CAR_STORIES[s.story], pk = POS[s.pos], m = HGT_MEAN[pk], sty = styles(s.pos);
      if (!sty.includes(s.style)) s.style = sty[0];
      const hs = []; for (let h = Math.round(m - 4); h <= Math.round(m + 4); h++) hs.push(h);
      if (!hs.includes(s.hgt)) s.hgt = Math.round(m);
      const ft = h => Math.floor(h / 12) + "'" + (h % 12) + '"';
      const path = st.path || s.path, teams = PIPE_TEAMS[path] || [];
      return `<h3>Create your player</h3>
      <div class="car-form">
        <label class="xp-f">First name <input id="car-first" maxlength="20" value="${esc(s.first)}" placeholder="First"></label>
        <label class="xp-f">Last name <input id="car-last" maxlength="24" value="${esc(s.last)}" placeholder="Last"></label>
        <label class="xp-f">Jersey number <input id="car-num" type="number" min="0" max="99" value="${s.num}" style="width:80px"></label>
      </div>
      <p class="k" style="margin:12px 0 6px">Position</p><div class="choice car-pos">${POS.map((n, i) => `<button data-carpos="${i}" class="${s.pos === i ? 'on' : ''}"><strong>${n}</strong></button>`).join('')}</div>
      <div class="car-form"><label class="xp-f">Height <select id="car-hgt">${hs.map(h => `<option value="${h}" ${h === s.hgt ? 'selected' : ''}>${ft(h)}</option>`).join('')}</select></label>
      <label class="xp-f">Style <select id="car-style">${sty.map(n => `<option ${n === s.style ? 'selected' : ''}>${esc(n)}</option>`).join('')}</select></label></div>
      <p class="k" style="margin:12px 0 6px">Your story <button class="sm" id="car-roll" type="button">🎲 Random</button></p>
      <div class="choice car-story">${Object.entries(CAR_STORIES).map(([k, v]) => `<button data-carstory="${k}" class="${s.story === k ? 'on' : ''}"><strong>${esc(v.n)}</strong><br><span class="muted">${esc(v.t)}</span></button>`).join('')}</div>
      <p class="k" style="margin:12px 0 6px">Where you play before the draft</p>
      ${st.path ? `<p class="muted">Your story starts you in ${esc(CAR_PATHS[st.path])}.</p>` : `<div class="choice">${Object.entries(CAR_PATHS).map(([k, v]) => `<button data-carpath="${k}" class="${s.path === k ? 'on' : ''}"><strong>${esc(v)}</strong><br><span class="muted">${PIPE_LG[k].G} games, ${k === 'NCHF' ? 'one-and-done freshman' : 'a pro club as a teenager'}</span></button>`).join('')}</div>`}
      <label class="xp-f">Team <select id="car-team"><option value="-1">Random</option>${teams.map((t, i) => `<option value="${i}" ${s.team === i ? 'selected' : ''}>${esc(t[0] + ' ' + t[1])}</option>`).join('')}</select></label>
      <p class="muted" style="margin-top:10px">You play ${CAR_FX.played} big games and the rest are simmed. Every game earns XP to spend on your ratings. Then it is draft night.</p>`;
    }
    document.addEventListener('click', e => {
      if (!ui.setupOpen && L) return;
      const a = e.target.closest('[data-carpos],[data-carstory],[data-carpath],#car-roll'); if (!a) return;
      const s = S();
      if (a.dataset.carpos != null) { s.pos = +a.dataset.carpos; s.hgt = Math.round(HGT_MEAN[POS[s.pos]]); s.style = ''; }
      else if (a.dataset.carstory) s.story = a.dataset.carstory;
      else if (a.dataset.carpath) { s.path = a.dataset.carpath; s.team = -1; }
      else if (a.id === 'car-roll') { s.story = pick(Object.keys(CAR_STORIES)); }
      render();
    });
    document.addEventListener('input', e => { const id = e.target && e.target.id; if (!id || !id.startsWith('car-')) return; const s = S();
      if (id === 'car-first') s.first = e.target.value; else if (id === 'car-last') s.last = e.target.value; else if (id === 'car-num') s.num = +e.target.value; });
    document.addEventListener('change', e => { const id = e.target && e.target.id; if (!id || !id.startsWith('car-')) return; const s = S();
      if (id === 'car-hgt') s.hgt = +e.target.value; else if (id === 'car-style') s.style = e.target.value; else if (id === 'car-team') s.team = +e.target.value; });
    function createFrom(Lnew) { const s = S(); if (!s.first.trim()) s.first = 'Rookie'; if (!s.last.trim()) s.last = 'Player'; carCreate(Lnew, { first: s.first, last: s.last, pos: s.pos, hgt: s.hgt, style: s.style, story: s.story, path: s.path, team: s.team >= 0 ? s.team : null, num: s.num }); }

    // ----- hub page -----
    const pct = x => Math.round(x * 100) + '%';
    const gline = l => `${l.pts} pts · ${l.reb} reb · ${l.ast} ast${l.stl ? ' · ' + l.stl + ' stl' : ''}${l.blk ? ' · ' + l.blk + ' blk' : ''}`;
    function hub() {
      const C = L.career, p = carP(L); if (!p) return '<section class="panel"><p>No career player.</p></section>';
      const st = CAR_STORIES[C.story] || {}, pre = p.prospect && p.pl, sl = pre ? carSeasonLine(L) : null, nxt = pre ? C.games.find(g => !g.done) : null;
      const club = pre ? pipeTeamName(C.lg, C.team) : p.team != null ? tname(p.team) : 'Free agent';
      const head = `<section class="panel car-head"><div class="car-id">${portrait('p', p.id, p.nat, p.team)}<div><div class="k">${esc(st.n || '')} · ${posLabel(p)} · ${Math.floor(p.hgt / 12)}'${p.hgt % 12}" · Age ${p.age}</div><div class="big">${esc(p.name)} <span class="muted">#${p.num}</span></div><div>${esc(club)}${pre ? ` <span class="muted">(${C.lg})</span>` : ''} · ${esc(archLabel(p))}</div></div></div>
        <div class="car-stats"><div><div class="k">Overall</div><div class="v">${p.ovr}</div></div><div><div class="k">XP to spend</div><div class="v">${C.xp}</div></div>${pre ? `<div><div class="k">Record</div><div class="v">${sl ? sl.w + '-' + (sl.gp - sl.w) : '0-0'}</div></div><div><div class="k">Draft</div><div class="v" style="font-size:16px">${esc(draftLabel(p.draftYear))}</div></div>` : p.draft ? `<div><div class="k">Drafted</div><div class="v" style="font-size:16px">${p.draft.rd === 1 ? '1st' : '2nd'} round, #${p.draft.no}</div></div>` : ''}</div>
        <div class="row" style="gap:8px;margin-top:8px"><button class="sm" data-player="${p.id}">Full player page</button></div></section>`;
      const next = nxt ? `<section class="panel"><h3>Next game</h3><p>${nxt.home ? 'vs' : 'at'} <strong>${esc(pipeTeamName(C.lg, nxt.opp))}</strong> · ${esc(dayLbl(nxt.day))}${nxt.play ? ' · <span class="pill">Big game: you make the calls</span>' : ' · simmed'}</p>${careerPending(L) ? '<button class="primary" id="car-playnow">Play it now</button>' : `<p class="muted">Use the sim buttons at the top. The sim stops on your big games.</p>`}</section>`
        : pre ? `<section class="panel"><h3>Season over</h3><p>Your ${C.lg} season is done. Sim to the end of the league season, then the playoffs, then the draft. Your name will be called… or not.</p></section>` : proNote(p);
      const ups = upPanel(p);
      const sched = pre ? `<section class="panel"><h3>${esc(pipeTeamName(C.lg, C.team))} schedule</h3><div class="tblwrap"><table class="car-sched"><thead><tr><th>#</th><th class="l">Date</th><th class="l">Opponent</th><th>Result</th><th class="l">Your line</th><th>Grade</th><th>XP</th></tr></thead><tbody>${C.games.map(g => `<tr class="${g.play ? 'car-big' : ''}"><td>${g.i + 1}</td><td class="l">${esc(dayLbl(g.day))}</td><td class="l">${g.home ? 'vs' : 'at'} ${esc(pipeTeam(C.lg, g.opp).abbr)}${g.play ? ' ★' : ''}</td><td>${g.done ? `<span class="${g.win ? 'w' : 'lo'}">${g.win ? 'W' : 'L'}</span> ${g.us}-${g.them}` : ''}</td><td class="l">${g.done ? gline(g.line) : ''}</td><td>${g.done ? CAR_GRADES[g.gr] : ''}</td><td>${g.done ? '+' + g.xp : ''}</td></tr>`).join('')}</tbody></table></div>${sl ? `<p class="muted">Averages: ${sl.pts} pts, ${sl.reb} reb, ${sl.ast} ast, ${sl.stl} stl, ${sl.blk} blk in ${sl.min} min over ${sl.gp} games. ★ = big game you play.</p>` : '<p class="muted">★ = big game you play.</p>'}</section>` : '';
      const log = `<section class="panel"><h3>Career story</h3>${C.log.slice().reverse().slice(0, 30).map(x => `<div class="leader" style="grid-template-columns:auto minmax(0,1fr)"><span class="muted">${esc(seasonName(x.s))}</span><span>${esc(x.t)}</span></div>`).join('')}</section>`;
      return `<div class="car">${head}<div class="grid2"><div class="stack">${next}${sched}</div><div class="stack">${ups}${log}</div></div></div>`;
    }
    const dayLbl = d => { try { const t = dayDate(L, d); if (t) return t.label.replace(/, \d{4}$/, ''); } catch (e) { } return 'Day ' + (d + 1); };
    function proNote(p) {
      if (p.team == null) return `<section class="panel"><h3>Free agent</h3><p>No team has signed you yet. Keep improving and wait for a call.</p></section>`;
      const C = L.career, t = carProToday(L), rec = C.pro.slice().reverse().slice(0, 12);
      const tr = C.trust, trW = tr >= 75 ? 'Go-to guy' : tr >= 60 ? 'Trusted' : tr >= 40 ? 'Earning it' : 'On a short leash';
      return `<section class="panel"><h3>You're a pro: ${esc(tname(p.team))}</h3>
        <div class="car-stats" style="margin-bottom:8px"><div><div class="k">Coach trust</div><div class="v">${tr}</div><div class="muted" style="font-size:12px">${trW}</div></div><div><div class="k">Role</div><div class="v" style="font-size:16px">${esc(roleName(roleOf(L, p)) || '—')}</div></div></div>
        <p class="muted" style="margin-top:0">Trust grows with good games you play. More trust = more touches and easier calls.</p>
        ${t && careerPending(L) ? `<button class="primary" id="car-playnow">Today: ${t.home === false ? 'at' : 'vs'} ${esc(L.teams[t.opp].abbr)}. Play it now</button>` : ''}
        <p style="margin:10px 0 4px">Stop the sim for: ${stopBtns()}</p></section>
        ${rec.length ? `<section class="panel"><h3>Recent games</h3><div class="tblwrap"><table><thead><tr><th class="l">Opp</th><th>Result</th><th class="l">Your line</th><th>Grade</th><th>XP</th></tr></thead><tbody>${rec.map(e => `<tr class="${e.played ? 'car-big' : ''}"><td class="l">${e.home ? 'vs' : 'at'} ${esc((L.teams[e.opp] || {}).abbr || '')}${e.po ? ' (PO)' : ''}</td><td><span class="${e.win ? 'w' : 'lo'}">${e.win ? 'W' : 'L'}</span> ${e.us}-${e.them}</td><td class="l">${gline(e.line)}</td><td>${CAR_GRADES[e.gr]}</td><td>+${e.xp}</td></tr>`).join('')}</tbody></table></div><p class="muted" style="font-size:12px">Shaded = you made the calls.</p></section>` : ''}`;
    }
    function upPanel(p) {
      const C = L.career;
      return `<section class="panel"><h3>Upgrade ratings <span class="muted" style="font-weight:normal">· ${C.xp} XP</span></h3><p class="muted" style="margin-top:-4px">Costs rise as a rating climbs. Athletic ratings cost 50% more.</p>
        <div class="car-ups">${CAR_UP_KEYS.map(([g, ks]) => `<div><div class="k">${g}</div>${ks.map(k => { const c = carCost(p, k), can = C.xp >= c && p[k] < 99; return `<div class="car-up"><span>${esc(LABELS[k] || k)}</span><strong>${p[k]}</strong><button class="sm ${can ? 'primary' : ''}" data-carup="${k}" ${can ? '' : 'disabled'} title="Costs ${c} XP">+1 · ${c}</button></div>`; }).join('')}</div>`).join('')}</div><div id="car-upmsg" class="muted"></div></section>`;
    }

    // ----- game dialog -----
    function proDialog() {
      const C = L.career, p = carP(L), t = carProToday(L); if (!t) { closeDialog(); return; }
      const me = L.teams[p.team], ot = L.teams[t.opp], vs = t.home === false ? 'at' : 'vs';
      const title = `${esc(me.abbr)} ${vs} ${esc(ot.city + ' ' + ot.name)}${t.po ? ' · ' + esc(poStages(L)[L.po.stage]) + ' game ' + (t.sr.games.length + 1) : ''}`;
      if (!C.cur || C.cur.pro !== t.key) {
        dialog(`<h2>Game day: ${title}</h2><p>${t.po ? 'Playoff basketball. ' : carBigGame(L, t) ? 'A big one tonight. ' : ''}Coach trust ${C.trust}/100. Make the calls at four key moments (they change how you play in the real game), or let it sim.</p>
          <div class="row" style="gap:8px;margin-top:12px;flex-wrap:wrap"><button class="primary" id="car-go">Play the game</button><button id="car-sim">Sim it</button></div>
          <p class="muted" style="font-size:12px;margin-top:10px">Stop the sim for: ${stopBtns()}</p>`);
        $('#car-go').onclick = () => { carProStart(L); save(); proDialog(); };
        $('#car-sim').onclick = () => { C.proKey = t.key; save(); closeDialog(); simToday(); };
        bindStop(); return;
      }
      const cur = C.cur;
      if (cur.step >= cur.sc.length) { carProFx(L); save(); closeDialog(); simToday(); return; }
      momentHtml(cur, `${esc(me.abbr)} ${vs} ${esc(ot.abbr)}`, p); document.querySelectorAll('[data-carop]').forEach(b => b.onclick = () => { carChoose(L, +b.dataset.carop); save(); proDialog(); });
    }
    const STOPS = [['all', 'every game'], ['big', 'big games'], ['none', 'never']];
    const stopBtns = () => STOPS.map(([k, n]) => `<button class="sm ${L.career.stop === k ? 'on primary' : ''}" data-carstop="${k}">${n}</button>`).join(' ');
    function bindStop() { document.querySelectorAll('#modal [data-carstop]').forEach(b => b.onclick = () => { L.career.stop = b.dataset.carstop; save(); render(); proDialog(); }); }
    function simToday() { const b = document.querySelector(`#simctl [data-sim="${L.phase === 'playoffs' ? 'pday' : 'day'}"]`); if (b) { b.disabled = false; b.click(); } }
    function momentHtml(cur, lbl, p) {
      const sc = carScene(cur.sc[cur.step]), Q = ['1st quarter', '2nd quarter', '3rd quarter', 'Crunch time'][cur.step] || '', last = cur.res[cur.res.length - 1];
      dialog(`<div class="car-game"><div class="k">${lbl} · ${Q} · Moment ${cur.step + 1} of ${cur.sc.length}</div>
        ${last ? `<div class="msg ${last.ok ? 'ok' : 'no'}" style="margin:8px 0">${esc(last.t)}</div>` : ''}
        <div class="panel" style="margin:8px 0"><strong>${esc(sc.t.replace('{d}', cur.down))}</strong></div>
        <div class="car-opts">${sc.o.map((o, i) => { const ch = carChance(L, p, o); return `<button class="car-opt" data-carop="${i}"><strong>${esc(o.l)}</strong><span class="car-bar"><i style="width:${pct(ch)}"></i></span><span class="muted">${pct(ch)} chance · ${esc(o.k.map(k => k === 'best' ? 'best scoring skill' : (LABELS[k] || k)).join(' + '))}</span></button>`; }).join('')}</div>
        <p class="muted" style="font-size:12px">Momentum ${cur.mom >= 0 ? '+' : ''}${Math.round(cur.mom * 10) / 10}. Good calls swing the game and your grade.</p></div>`);
    }
    function proResultDialog(e) {
      const ot = L.teams[e.opp] || {}, l = e.line;
      dialog(`<h2>${e.win ? 'Win' : 'Loss'} ${e.us}-${e.them} ${e.home ? 'vs' : 'at'} ${esc(ot.abbr || '')}</h2><div class="car-res"><div class="car-grade g${e.gr}">${CAR_GRADES[e.gr]}</div><div><div><strong>${gline(l)}</strong></div><div class="muted">${l.min} min · ${l.fgm}-${l.fga} FG · ${l.tpm} threes · ${l.tov} turnovers</div><div style="margin-top:6px">Your calls: ${(e.res || []).map(x => x ? '✓' : '✗').join(' ')} · +${e.xp} XP · coach trust ${L.career.trust}/100</div></div></div><div class="row" style="gap:8px;margin-top:12px"><button class="primary" id="car-ok">Continue</button><a class="btn" href="#career" id="car-up">Spend XP</a></div>`);
      $('#car-ok').onclick = closeDialog; $('#car-up').onclick = () => closeDialog();
    }
    function gameDialog() {
      const C = L.career; if (!C) return;
      if (!carP(L).prospect) { proDialog(); return; }
      const g = C.cur ? C.games[C.cur.gi] : careerPending(L); if (!g) { closeDialog(); return; }
      const opp = pipeTeam(C.lg, g.opp), me = pipeTeam(C.lg, C.team);
      if (!C.cur) {
        dialog(`<h2>Game day: ${esc(me.abbr)} ${g.home ? 'vs' : 'at'} ${esc(opp.full)}</h2><p>One of your big games this season. Make the calls at four key moments, or let it sim.</p><div class="row" style="gap:8px;margin-top:12px"><button class="primary" id="car-go">Play the game</button><button id="car-sim">Sim it</button></div>`);
        $('#car-go').onclick = () => { carStart(L, g); save(); gameDialog(); };
        $('#car-sim').onclick = () => { carSimOne(L, g); save(); closeDialog(); render(); resultDialog(g); };
        return;
      }
      const cur = C.cur, p = carP(L);
      if (cur.step >= cur.sc.length) { const done = carFinish(L); save(); closeDialog(); render(); resultDialog(done); return; }
      const sc = carScene(cur.sc[cur.step]), Q = ['1st quarter', '2nd quarter', '3rd quarter', 'Crunch time'][cur.step] || '';
      const last = cur.res[cur.res.length - 1];
      dialog(`<div class="car-game"><div class="k">${esc(me.abbr)} ${g.home ? 'vs' : 'at'} ${esc(opp.abbr)} · ${Q} · Moment ${cur.step + 1} of ${cur.sc.length}</div>
        ${last ? `<div class="msg ${last.ok ? 'ok' : 'no'}" style="margin:8px 0">${esc(last.t)}</div>` : ''}
        <div class="panel" style="margin:8px 0"><strong>${esc(sc.t.replace('{d}', cur.down))}</strong></div>
        <div class="car-opts">${sc.o.map((o, i) => { const ch = carChance(L, p, o); return `<button class="car-opt" data-carop="${i}"><strong>${esc(o.l)}</strong><span class="car-bar"><i style="width:${pct(ch)}"></i></span><span class="muted">${pct(ch)} chance · ${esc(o.k.map(k => k === 'best' ? 'best scoring skill' : (LABELS[k] || k)).join(' + '))}</span></button>`; }).join('')}</div>
        <p class="muted" style="font-size:12px">Momentum ${cur.mom >= 0 ? '+' : ''}${Math.round(cur.mom * 10) / 10}. Good calls swing the game and your grade.</p></div>`);
      document.querySelectorAll('[data-carop]').forEach(b => b.onclick = () => { carChoose(L, +b.dataset.carop); save(); gameDialog(); });
    }
    function resultDialog(g) {
      const C = L.career, opp = pipeTeam(C.lg, g.opp);
      dialog(`<h2>${g.win ? 'Win' : 'Loss'} ${g.us}-${g.them} ${g.home ? 'vs' : 'at'} ${esc(opp.abbr)}</h2><div class="car-res"><div class="car-grade g${g.gr}">${CAR_GRADES[g.gr]}</div><div><div><strong>${gline(g.line)}</strong></div><div class="muted">${g.line.min} min · ${g.line.tpm} threes · ${g.line.tov || 0} turnovers</div><div style="margin-top:6px">+${g.xp} XP${g.played ? '' : ' (simmed games earn less)'} · ${C.xp} XP to spend</div></div></div><div class="row" style="gap:8px;margin-top:12px"><button class="primary" id="car-ok">Continue</button><a class="btn" href="#career" id="car-up">Spend XP</a></div>`);
      $('#car-ok').onclick = closeDialog; $('#car-up').onclick = () => closeDialog();
    }
    function draftDialog() {
      const C = L.career, p = carP(L); C.draftShown = L.season;
      if (p.draft && p.draft.s === L.season) { const t = L.teams[p.draft.tid], no = L.draftOrder ? L.draftOrder.findIndex(o => o.pid === p.id) + 1 : p.draft.no;
        carLog(L, `Drafted ${p.draft.rd === 1 ? '1st' : '2nd'} round, pick ${p.draft.no} (${no} overall) by the ${tname(t.id)}.`);
        dialog(`<div style="text-align:center"><div class="k">Draft night · ${esc(draftLabel(L.season))}</div>${logo(t.id, 84)}<h2 style="margin-top:8px">With pick #${no}, the ${esc(tname(t.id))} select…</h2><div class="big" style="font-size:30px">${esc(p.name)}</div><p class="muted">${posLabel(p)} · ${esc(pipeTeamName(C.lg, C.team))}</p></div><div class="row" style="justify-content:center;margin-top:12px"><button class="primary" id="car-ok">Let's go</button></div>`);
        try { if (window.FX && FX.gameResult) FX.gameResult({ title: true }); } catch (e) { }
      } else { carLog(L, 'Went undrafted. Time to prove everyone wrong.');
        dialog(`<h2>Undrafted</h2><p>Your name was not called. Plenty of legends started this way. Keep earning XP; teams sign free agents all summer.</p><div class="row"><button class="primary" id="car-ok">OK</button></div>`); }
      $('#car-ok').onclick = closeDialog; save();
    }
    function afterRender() {
      if (!carOn(L)) return;
      const p = carP(L);
      if (L.career.lastRes) { const e = L.career.lastRes; L.career.lastRes = null; queueDialog(() => proResultDialog(e)); }
      if (L.phase !== 'off-draft' && L.career.draftShown !== L.season && !p.prospect && ['off-resign', 'off-fa', 'off-ready', 'off-draft'].includes(L.phase) && (p.draft ? p.draft.s === L.season : p.draftYear === L.season)) queueDialog(draftDialog);
      else if (L.phase === 'off-draft' && L.career.draftShown !== L.season && !p.prospect) queueDialog(draftDialog);
    }
    document.addEventListener('click', e => {
      if (!L || !L.career) return;
      const u = e.target.closest('[data-carup]');
      if (u) { const err = carUpgrade(L, u.dataset.carup); if (!err) { save(); render(); } else { const m = document.getElementById('car-upmsg'); if (m) m.textContent = err; } return; }
      if (e.target.id === 'car-playnow') { gameDialog(); return; }
      const sb = e.target.closest('#main [data-carstop]'); if (sb) { L.career.stop = sb.dataset.carstop; save(); render(); }
    });
    window.P3V = window.P3V || {}; P3V.career = hub;
    return { setupForm, createFrom, afterRender, gameDialog, pending: () => !!careerPending(L) };
  }
})();
if (typeof module !== 'undefined') module.exports = { CAR_STORIES, CAR_FX, carCreate, careerDay, careerPending, careerPipeLine, careerPipeRec, carStart, carChoose, carFinish, carUpgrade, carCost, carSeasonLine, carSimOne };
