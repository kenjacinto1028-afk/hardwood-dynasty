// Fantasy league (Nov 20 2026): you draft real sim players against 7 AI managers; weekly head-to-head matchups
// are scored from the sim's own box scores. Standings, waiver pickups, 2-week playoffs, champion.
// Logic (FAN) runs in node tests too; it never draws the sim's random numbers, so league results are unchanged.
// Data: L.fan (this season's fantasy league), L.fanHist (past champions).
const FAN = (function () {
  const N = 8, ROUNDS = 10, WK = 7, ADDS = 4;   // teams, roster size, days a week, your adds a week
  const W = { pts: 1, reb: 1.2, ast: 1.5, stl: 3, blk: 3, tov: -1, tpm: 0.5 };
  const AI_N = ['Bucket Getters', 'Glass Cleaners', 'Fast Break Five', 'Splash Club', 'Paint Patrol', 'Lockdown Crew', 'Bench Mob', 'Alley-Oop Society', 'Triple-Double Trouble', 'Full Court Press', 'And-One Club', 'Swish Kings', 'Boxscore Bandits', 'Pick-and-Roll Posse'];
  const MGR = ['Dee', 'Marco', 'Jules', 'Priya', 'Sam', 'Tomas', 'Avery', 'Kenji', 'Nora', 'Luis', 'Ines', 'Rafa', 'Mona', 'Theo'];
  const STY = { bal: 'Balanced', stars: 'Stars first', young: 'Loves youth', bigs: 'Big men', guards: 'Guards' };
  const STYK = Object.keys(STY);
  const hash = (a, b) => { let h = (a * 2654435761 ^ b * 40503) >>> 0; h = Math.imul(h ^ (h >>> 15), 2246822507) >>> 0; h = Math.imul(h ^ (h >>> 13), 3266489909) >>> 0; return ((h ^ (h >>> 16)) >>> 0) / 4294967296; };
  const r1 = x => Math.round(x * 10) / 10;

  // ---------- scoring ----------
  const fpRow = v => v[IX.pts] * W.pts + (v[IX.orb] + v[IX.drb]) * W.reb + v[IX.ast] * W.ast + v[IX.stl] * W.stl + v[IX.blk] * W.blk + v[IX.tov] * W.tov + v[IX.tpm] * W.tpm;
  const fpTot = r => r.pts * W.pts + (r.orb + r.drb) * W.reb + r.ast * W.ast + r.stl * W.stl + r.blk * W.blk + r.tov * W.tov + r.tpm * W.tpm;
  // games of the fantasy season by day: idx[day] = { pid: fantasy points }
  let cache = { key: '', idx: null };
  function dayIdx(L) {
    const F = L.fan, key = F.s + '|' + L.games.length + '|' + L.day;
    if (cache.key === key) return cache.idx;
    const idx = {};
    for (const g of L.games) { if (g.playoff || g.season !== F.s || g.day < F.start || !g.box) continue; const d = idx[g.day] || (idx[g.day] = {}); for (const r of g.box) if (r[2] > 0) d[r[0]] = r1(fpRow(r.slice(2))); }
    cache = { key, idx }; return idx;
  }
  const onDay = (e, d) => d >= e.a && (e.d == null || d < e.d);
  // a team's points for days [d0, d1): { tot, by: { pid: pts }, gp: { pid: games } }
  function teamPts(L, t, d0, d1) {
    const idx = dayIdx(L), by = {}, gp = {}; let tot = 0;
    for (let d = d0; d < d1; d++) { const x = idx[d]; if (!x) continue; for (const e of t.r) if (onDay(e, d) && x[e.pid] != null) { by[e.pid] = r1((by[e.pid] || 0) + x[e.pid]); gp[e.pid] = (gp[e.pid] || 0) + 1; tot += x[e.pid]; } }
    return { tot: r1(tot), by, gp };
  }

  // ---------- calendar ----------
  const nDays = L => L.schedule.length;
  const wkStart = (F, w) => F.start + w * WK;
  const wkEnd = (L, F, w) => w >= F.nW - 1 ? nDays(L) : wkStart(F, w + 1);
  const curWeek = (L, F) => { if (L.season !== F.s || L.phase !== 'regular') return F.nW; return Math.min(F.nW - 1, Math.floor((L.day - F.start) / WK)); };
  const canStart = L => L.phase === 'regular' && Math.floor((nDays(L) - L.day) / WK) >= 5;

  // ---------- projections (fantasy points a game) ----------
  function proj(L, p) {
    const cur = p.stats && p.stats.rs && p.stats.rs.gp ? p.stats.rs : null;
    const last = (p.hist || []).filter(h => h.s < L.season && h.rs && h.rs.gp >= 10).slice(-1)[0];
    const est = Math.max(2, Math.min(52, (p.ovr - 45) * 1.3));
    const base = last ? fpTot(last.rs) / last.rs.gp * 0.7 + est * 0.3 : est;
    const w = cur ? Math.min(1, cur.gp / 20) : 0;
    return w ? (cur ? fpTot(cur) / cur.gp : 0) * w + base * (1 - w) : base;
  }
  // value for the rest of the season (or next week) with injuries counted
  function val(L, p, horizon) { const v = proj(L, p), out = p.injury || 0; return out <= 0 ? v : v * Math.max(0, 1 - out / Math.max(1, horizon)); }
  const pool = L => active(L).filter(p => p.team != null);
  const owner = (F, pid, d) => F.teams.findIndex(t => t.r.some(e => e.pid === pid && (d == null ? e.d == null : onDay(e, d))));
  const live = t => t.r.filter(e => e.d == null);

  // AI taste: a manager's own value for a player
  function taste(L, F, ti, p, horizon) {
    const t = F.teams[ti]; let v = val(L, p, horizon);
    const sty = t.sty;
    if (sty === 'young' && p.age <= 24) v *= 1.08;
    if (sty === 'stars' && p.ovr >= 75) v *= 1.06;
    if (sty === 'bigs' && p.pos >= 3) v *= 1.06;
    if (sty === 'guards' && p.pos <= 1) v *= 1.06;
    const same = live(t).filter(e => { const q = L.players[e.pid]; return q && q.pos === p.pos; }).length;
    if (same >= 3) v *= 0.88;
    return v * (0.95 + hash(p.id, ti * 7 + F.s) * 0.1);
  }

  // ---------- create + draft ----------
  function create(L, name) {
    if (!canStart(L)) return null;
    const s = L.season, pick = (arr, i) => arr[Math.floor(hash(s, i) * arr.length)];
    const names = AI_N.slice().sort((a, b) => hash(s, a.length * 31 + a.charCodeAt(0)) - hash(s, b.length * 31 + b.charCodeAt(0)));
    const mg = MGR.slice().sort((a, b) => hash(s + 3, a.charCodeAt(0) * 7 + a.length) - hash(s + 3, b.charCodeAt(0) * 7 + b.length));
    const teams = [{ n: String(name || 'My Fantasy Team').slice(0, 30), m: 'You', ai: 0, sty: null, r: [], w: 0, l: 0, pf: 0, pa: 0, adds: {} }];
    for (let i = 1; i < N; i++) teams.push({ n: names[i - 1], m: mg[i - 1], ai: 1, sty: STYK[Math.floor(hash(s, 50 + i) * STYK.length)], r: [], w: 0, l: 0, pf: 0, pa: 0 });
    const nW = Math.floor((nDays(L) - L.day) / WK), nR = nW - 2;
    // draft order: your slot from the season, snake
    const slot = Math.floor(hash(s, 99) * N), base = [];
    for (let i = 0, k = 0; i < N; i++) base.push(i === slot ? 0 : ++k);
    const ord = []; for (let r = 0; r < ROUNDS; r++) ord.push(...(r % 2 ? base.slice().reverse() : base));
    // round robin (circle method), repeated for the regular season
    const rr = []; const ids = [...Array(N).keys()];
    for (let r = 0; r < N - 1; r++) { const wk = []; for (let i = 0; i < N / 2; i++) wk.push([ids[i], ids[N - 1 - i]]); rr.push(wk); ids.splice(1, 0, ids.pop()); }
    const sched = []; for (let w = 0; w < nR; w++) sched.push(rr[(w + Math.floor(hash(s, 7) * rr.length)) % rr.length]);
    L.fan = { s, start: L.day, nW, nR, teams, draft: { ord, i: 0, log: [] }, sched, res: [], wk: 0, po: null, champ: null, moves: [], v: 1 };
    cache.key = '';
    aiDraft(L);
    return L.fan;
  }
  const draftable = L => { const F = L.fan, taken = new Set(F.draft.log.map(x => x[1])); return pool(L).filter(p => !taken.has(p.id)); };
  function draftPick(L, pid) {
    const F = L.fan, D = F.draft; if (!D || D.i >= D.ord.length) return false;
    const p = L.players[pid]; if (!p || D.log.some(x => x[1] === pid)) return false;
    const ti = D.ord[D.i]; D.log.push([ti, pid]); F.teams[ti].r.push({ pid, a: F.start, d: null }); D.i++;
    if (D.i >= D.ord.length) F.draft.done = 1;
    return true;
  }
  function bestFor(L, ti) { const F = L.fan, hz = nDays(L) - L.day; let b = null, bv = -1; for (const p of draftable(L)) { const v = ti === 0 ? val(L, p, hz) : taste(L, F, ti, p, hz); if (v > bv) { bv = v; b = p; } } return b; }
  // AI picks until it is your turn (or all picks if auto)
  function aiDraft(L, all) {
    const F = L.fan, D = F.draft; if (!D) return;
    while (D.i < D.ord.length && (all || D.ord[D.i] !== 0)) { const p = bestFor(L, D.ord[D.i]); if (!p) break; draftPick(L, p.id); }
  }
  const drafting = L => !!(L.fan && L.fan.s === L.season && L.fan.draft && !L.fan.draft.done);

  // ---------- waivers ----------
  function addDrop(L, ti, addId, dropId, day) {
    const F = L.fan, t = F.teams[ti]; if (!t) return 'No team';
    if (owner(F, addId) >= 0) return 'He is on a fantasy team';
    const p = L.players[addId]; if (!p || p.retired || p.team == null) return 'He is not in the league';
    const e = live(t).find(x => x.pid === dropId); if (!e) return 'Pick a player to drop';
    if (e.a === day) t.r.splice(t.r.indexOf(e), 1); else e.d = day;   // same-day undo leaves no trace
    t.r.push({ pid: addId, a: day, d: null });
    F.moves.unshift({ w: curWeek(L, F), day, ti, add: addId, drop: dropId }); if (F.moves.length > 200) F.moves.length = 200;
    return null;
  }
  function userAdd(L, addId, dropId) {
    const F = L.fan; if (!F || F.s !== L.season || L.phase !== 'regular' || drafting(L)) return 'Waivers are closed';
    if (F.champ != null || curWeek(L, F) >= F.nW) return 'The fantasy season is over';
    const w = curWeek(L, F), used = (F.teams[0].adds || {})[w] || 0;
    if (used >= ADDS) return `You used your ${ADDS} adds this week`;
    const err = addDrop(L, 0, addId, dropId, L.day); if (err) return err;
    (F.teams[0].adds = F.teams[0].adds || {})[w] = used + 1;
    return null;
  }
  // before week w: each AI manager swaps his weakest player for the best free agent if it is clearly better (2 moves if someone is hurt for long)
  function aiWaivers(L, w) {
    const F = L.fan, day = wkStart(F, w), hz = Math.max(WK, nDays(L) - day), free = pool(L).filter(p => owner(F, p.id) < 0);
    for (let ti = 1; ti < N; ti++) {
      const t = F.teams[ti]; let moves = live(t).some(e => (L.players[e.pid] || {}).injury > 20) ? 2 : 1;
      while (moves-- > 0) {
        const mine = live(t).map(e => L.players[e.pid]).filter(Boolean).map(p => ({ p, v: val(L, p, hz) })).sort((a, b) => a.v - b.v);
        const worst = mine[0]; if (!worst) break;
        let best = null; for (const p of free) { if (owner(F, p.id) >= 0) continue; const v = taste(L, F, ti, p, hz); if (!best || v > best.v) best = { p, v }; }
        if (!best || best.v < worst.v * 1.15 + 1) break;
        addDrop(L, ti, best.p.id, worst.p.id, day);
      }
    }
  }

  // ---------- weeks, playoffs, champion ----------
  function table(F) {
    return F.teams.map((t, i) => ({ i, t })).sort((a, b) => (b.t.w - b.t.l) - (a.t.w - a.t.l) || b.t.pf - a.t.pf);
  }
  function matchups(F, w) {
    if (w < F.nR) return F.sched[w];
    if (!F.po) return [];
    return w === F.nR ? F.po.semi : F.po.fin ? [F.po.fin] : [];
  }
  function sync(L) {
    const F = L.fan; if (!F || F.s !== L.season || F.v !== 1) return null;
    if (drafting(L) && (L.day > F.start || L.phase !== 'regular')) { aiDraft(L, true); F.draft.done = 1; }
    if (drafting(L)) return null;
    let news = null;
    while (F.wk < F.nW && (L.phase !== 'regular' || L.day >= wkEnd(L, F, F.wk))) {
      const w = F.wk, d0 = wkStart(F, w), d1 = wkEnd(L, F, w), res = [];
      for (const [a, b] of matchups(F, w)) {
        const sa = teamPts(L, F.teams[a], d0, d1).tot, sb = teamPts(L, F.teams[b], d0, d1).tot;
        const win = sa > sb || (sa === sb && F.teams[a].pf >= F.teams[b].pf) ? a : b;   // a tie goes to the team with more points on the year
        res.push({ a, b, sa, sb, win });
        if (w < F.nR) { const A = F.teams[a], B = F.teams[b]; A.pf = r1(A.pf + sa); A.pa = r1(A.pa + sb); B.pf = r1(B.pf + sb); B.pa = r1(B.pa + sa); (win === a ? A : B).w++; (win === a ? B : A).l++; }
      }
      F.res[w] = res; F.wk = w + 1;
      if (w === F.nR - 1) { const s = table(F).map(x => x.i); F.po = { seeds: s.slice(0, 4), semi: [[s[0], s[3]], [s[1], s[2]]], fin: null }; }
      if (w === F.nR) F.po.fin = res.map(x => x.win);
      if (w === F.nR + 1 && res[0]) {
        F.champ = res[0].win; const ct = F.teams[F.champ];
        (L.fanHist = L.fanHist || []).push({ s: F.s, n: ct.n, m: ct.m, you: F.champ === 0, ru: F.teams[res[0].win === res[0].a ? res[0].b : res[0].a].n, yourRec: F.teams[0].w + '-' + F.teams[0].l, yourSeed: F.po.seeds.indexOf(0) + 1 });
        news = F.champ === 0 ? 'won' : 'lost';
        try { logNews(L, F.champ === 0 ? `Fantasy league: your team ${ct.n} won the fantasy title!` : `Fantasy league: ${ct.n} (${ct.m}) won the fantasy title`, L.user != null ? L.user : undefined, 'league'); } catch (e) { }
      }
      if (F.wk < F.nW && (w + 1 < F.nR || F.po)) aiWaivers(L, F.wk);
    }
    return news;
  }
  function addsLeft(L) { const F = L.fan; if (!F) return 0; return Math.max(0, ADDS - ((F.teams[0].adds || {})[curWeek(L, F)] || 0)); }

  return { N, ROUNDS, WK, ADDS, W, STY, fpRow, fpTot, proj, val, pool, owner, live, create, draftPick, aiDraft, bestFor, draftable, drafting, userAdd, aiWaivers, sync, table, matchups, teamPts, wkStart, wkEnd, curWeek, canStart, addsLeft, onDay };
})();
if (typeof window !== 'undefined') window.FAN = FAN;

// keep the fantasy league in step with every simmed day (no random numbers used)
if (typeof simDay === 'function') {
  const _simDay = simDay;
  simDay = function (L) { const r = _simDay.apply(this, arguments); try { const n = FAN.sync(L); if (n && typeof window !== 'undefined' && window.FANUI) FANUI.champPopup(n); } catch (e) { if (typeof console !== 'undefined') console.warn('fantasy sync', e); } return r; };   // eslint-disable-line no-global-assign
}

// ---------- screens (Fantasy tab) ----------
const FANUI = (function () {
  if (typeof window === 'undefined' || !window.PBL) return null;
  const P = window.PBL, esc = P.esc, plink = P.plink;
  window.P3V = window.P3V || {};
  const ui = () => P.ui, Lg = () => P.L;
  const f1 = x => (Math.round(x * 10) / 10).toFixed(1);
  const tab = (k, n, cur, attr) => `<button class="sm ${cur === k ? 'primary' : ''}" data-${attr}="${k}">${n}</button>`;
  const abbr = L => tid => tid != null && L.teams[tid] ? L.teams[tid].abbr : 'FA';
  const inj = p => p.injury > 0 ? ` <span class="pill inj" title="Out about ${p.injury} games">Out ${p.injury}g</span>` : '';
  const tName = (F, i) => `<span class="fan-tn${i === 0 ? ' you' : ''}">${esc(F.teams[i].n)}</span>`;
  const lastFp = (L, p) => { const h = (p.hist || []).filter(x => x.s < L.season && x.rs && x.rs.gp >= 10).slice(-1)[0]; return h ? FAN.fpTot(h.rs) / h.rs.gp : null; };
  const curFp = p => p.stats && p.stats.rs && p.stats.rs.gp ? FAN.fpTot(p.stats.rs) / p.stats.rs.gp : null;
  const posF = (sel, attr) => `<span class="seg">${['all', ...POS].map((k, i) => `<button class="sm ${sel === (i ? i - 1 : 'all') ? 'primary' : ''}" data-${attr}="${i ? i - 1 : 'all'}">${i ? k : 'All'}</button>`).join('')}</span>`;
  const scoring = () => `<table class="fan-sc"><tbody>${[['Point', '1'], ['Rebound', '1.2'], ['Assist', '1.5'], ['Steal', '3'], ['Block', '3'], ['Three made', '+0.5'], ['Turnover', '−1']].map(([a, b]) => `<tr><td>${a}</td><td class="num">${b}</td></tr>`).join('')}</tbody></table>`;

  function vSetup(L) {
    const H = (L.fanHist || []).slice().reverse();
    const old = L.fan && L.fan.s !== L.season ? L.fan : null;
    const can = FAN.canStart(L), def = L.user != null ? L.teams[L.user].abbr + ' Ballers' : 'Commish Ballers';
    return `<section class="panel fan-hero"><h2>Fantasy league</h2>
      <p>Draft real players from this league against 7 AI managers. Every week you face one team head-to-head: your players' real box scores from the sim add up to your score. Most points wins the week.</p>
      <div class="fan-how"><div><strong>How it works</strong><ul><li>8 teams, 10 players each, snake draft.</li><li>Weeks are 7 game days. All 10 players count.</li><li>Top 4 make the playoffs: semifinal week, then the final week.</li><li>Waivers: swap a player for a free agent, ${FAN.ADDS} adds a week. AI managers make moves too.</li></ul></div><div><strong>Scoring</strong>${scoring()}</div></div>
      ${can ? `<div class="row fan-start"><label>Your team name <input id="fan-name" maxlength="30" value="${esc(def)}"></label><button class="primary" data-fango="1">Start fantasy draft</button></div>` : `<p class="muted">${L.phase === 'regular' ? 'Too late in the season: a fantasy league needs at least 5 weeks left.' : 'A fantasy league starts during the regular season.'} Start one ${L.phase === 'regular' ? 'next season' : 'once the season tips off'}.</p>`}
    </section>${old ? `<section class="panel"><h3>Last fantasy season (${old.s})</h3><p>${old.champ != null ? `Champion: <strong>${esc(old.teams[old.champ].n)}</strong>${old.champ === 0 ? ' (you!)' : ''}` : 'Not finished.'} · You went ${old.teams[0].w}-${old.teams[0].l}.</p></section>` : ''}${histPanel(H)}`;
  }
  const histPanel = H => H.length ? `<section class="panel"><h3>Fantasy champions</h3><div class="tblwrap"><table class="sortable" data-sid="fanhist"><thead><tr><th>Season</th><th>Champion</th><th>Runner-up</th><th>Your record</th><th>Your seed</th></tr></thead><tbody>${H.map(h => `<tr class="${h.you ? 'fan-me' : ''}"><td>${h.s}</td><td>${esc(h.n)}${h.you ? ' 🏆' : ` <span class="muted">(${esc(h.m)})</span>`}</td><td>${esc(h.ru)}</td><td>${h.yourRec}</td><td>${h.yourSeed > 0 ? '#' + h.yourSeed : 'Missed'}</td></tr>`).join('')}</tbody></table></div></section>` : '';

  function playerRows(L, list, btn) {
    const ab = abbr(L);
    return list.map(p => { const c = curFp(p), l = lastFp(L, p); return `<tr><td>${plink(p)}${inj(p)}</td><td>${POS[p.pos]}</td><td>${ab(p.team)}</td><td class="num">${p.age}</td><td class="num">${p.ovr}</td><td class="num">${f1(FAN.proj(L, p))}</td><td class="num">${c == null ? '—' : f1(c)}</td><td class="num">${l == null ? '—' : f1(l)}</td><td class="nosort">${btn(p)}</td></tr>`; }).join('');
  }
  const PHEAD = '<th>Player</th><th>Pos</th><th>Team</th><th class="num">Age</th><th class="num">OVR</th><th class="num" title="Projected fantasy points a game">Proj</th><th class="num" title="Fantasy points a game this season">FP/G</th><th class="num" title="Fantasy points a game last season">Last</th><th class="nosort"></th>';
  function filterList(L, list) {
    const u = ui(), q = (u.fanQ || '').toLowerCase();
    return list.filter(p => (u.fanPos == null || u.fanPos === 'all' || p.pos === +u.fanPos) && (!q || p.name.toLowerCase().includes(q))).sort((a, b) => FAN.proj(L, b) - FAN.proj(L, a)).slice(0, 60);
  }
  const searchBar = () => `<div class="filters">${posF(ui().fanPos == null ? 'all' : ui().fanPos === 'all' ? 'all' : +ui().fanPos, 'fanpos')}<input id="fan-q" type="search" placeholder="Search players" value="${esc(ui().fanQ || '')}" aria-label="Search players"></div>`;

  function vDraft(L) {
    const F = L.fan, D = F.draft, ti = D.ord[D.i], rd = Math.floor(D.i / FAN.N) + 1, pk = D.i % FAN.N + 1, me = F.teams[0];
    const avail = filterList(L, FAN.draftable(L));
    const recent = D.log.slice(-8).reverse().map(([t, pid], k) => { const p = L.players[pid], n = D.log.length - k; return `<li><span class="muted">${Math.floor((n - 1) / FAN.N) + 1}.${(n - 1) % FAN.N + 1}</span> ${tName(F, t)}: ${p ? plink(p) : '?'}</li>`; }).join('');
    const mine = me.r.map(e => L.players[e.pid]).filter(Boolean).map(p => `<li>${plink(p)} <span class="muted">${POS[p.pos]} · ${f1(FAN.proj(L, p))}</span></li>`).join('');
    return `<section class="panel fan-dhead"><h2>Fantasy draft</h2><div class="fan-clock"><div><span class="muted">Round ${rd} of ${FAN.ROUNDS} · Pick ${pk}</span><strong>${ti === 0 ? 'You are on the clock' : esc(F.teams[ti].n) + ' is picking'}</strong></div><div class="row"><button class="primary" data-fanauto="1" title="Take the best player left by projection">Auto-pick for me</button><button data-fanauto="all" title="Draft the rest of your team by projection">Auto-draft the rest</button></div></div></section>
      <div class="grid2"><section class="panel"><h3>Available players</h3>${searchBar()}<div class="tblwrap"><table class="sortable fan-tbl" data-sid="fandraft"><thead><tr>${PHEAD}</tr></thead><tbody>${playerRows(L, avail, p => `<button class="sm primary" data-fandraft="${p.id}">Draft</button>`)}</tbody></table></div><p class="muted fan-note">Top 60 by projection. Proj blends this season, last season and his rating, minus injury time.</p></section>
      <div class="stack"><section class="panel"><h3>Your team (${me.r.length}/${FAN.ROUNDS})</h3>${mine ? `<ol class="fan-list">${mine}</ol>` : '<p class="muted">No picks yet.</p>'}</section><section class="panel"><h3>Latest picks</h3>${recent ? `<ul class="fan-list">${recent}</ul>` : '<p class="muted">The draft is about to start.</p>'}</section></div></div>`;
  }

  function weekLabel(F, w) { return w < F.nR ? `Week ${w + 1}` : w === F.nR ? 'Playoffs: semifinals' : 'Playoffs: final'; }
  function vMatchup(L) {
    const F = L.fan, u = ui(), cw = Math.min(F.nW - 1, FAN.curWeek(L, F)), w = u.fanWk != null ? Math.max(0, Math.min(F.nW - 1, u.fanWk)) : cw;
    const ms = FAN.matchups(F, w), d0 = FAN.wkStart(F, w), d1 = FAN.wkEnd(L, F, w), done = F.res[w], live = !done && w === cw && L.phase === 'regular';
    const nav = `<div class="fan-wknav"><button class="sm" data-fanwk="${w - 1}" ${w <= 0 ? 'disabled' : ''} aria-label="Previous week">←</button><strong>${weekLabel(F, w)}</strong><span class="muted">${done ? 'Final' : live ? 'In progress' : w > cw ? 'Coming up' : ''}</span><button class="sm" data-fanwk="${w + 1}" ${w >= F.nW - 1 ? 'disabled' : ''} aria-label="Next week">→</button>${w !== cw ? `<button class="sm" data-fanwk="${cw}">This week</button>` : ''}</div>`;
    if (!ms.length) return `<section class="panel">${nav}<p class="muted">Matchups for this week are set when the regular season ends.</p></section>`;
    const mine = ms.find(m => m.includes(0));
    const side = (i, pts) => { const t = F.teams[i], rows = t.r.filter(e => e.a < d1 && (e.d == null || e.d > d0)).map(e => ({ p: L.players[e.pid], pts: pts.by[e.pid] || 0, gp: pts.gp[e.pid] || 0, gone: e.d != null && e.d <= d1 })).filter(x => x.p).sort((a, b) => b.pts - a.pts);
      return `<div class="fan-side"><div class="fan-sh"><span>${tName(F, i)}<small class="muted">${t.w}-${t.l} · ${esc(t.m)}</small></span><b>${f1(pts.tot)}</b></div><table class="fan-mini"><tbody>${rows.map(x => `<tr class="${x.gone ? 'muted' : ''}"><td>${plink(x.p)}${inj(x.p)}${x.gone ? ' <span class="pill pos">dropped</span>' : ''}</td><td class="num muted">${x.gp}g</td><td class="num">${f1(x.pts)}</td></tr>`).join('')}</tbody></table></div>`; };
    let big = '';
    if (mine) { const [a, b] = mine[0] === 0 ? mine : [mine[1], mine[0]], pa = FAN.teamPts(L, F.teams[a], d0, d1), pb = FAN.teamPts(L, F.teams[b], d0, d1), lead = pa.tot - pb.tot;
      big = `<section class="panel fan-big">${nav}<div class="fan-score"><span class="${lead >= 0 ? 'w' : ''}">${f1(pa.tot)}</span><em>${done ? (done.find(x => x.a === a || x.b === a).win === 0 ? 'You won' : 'You lost') : lead === 0 ? 'Tied' : lead > 0 ? 'You lead by ' + f1(lead) : 'You trail by ' + f1(-lead)}</em><span class="${lead < 0 ? 'w' : ''}">${f1(pb.tot)}</span></div><div class="fan-sides">${side(a, pa)}${side(b, pb)}</div></section>`; }
    else big = `<section class="panel fan-big">${nav}<p class="muted">${w >= F.nR ? 'Your season is over: you missed the playoffs or were knocked out.' : ''}</p></section>`;
    const others = ms.filter(m => m !== mine).map(([a, b]) => { const x = done ? done.find(r => r.a === a) : null, sa = x ? x.sa : FAN.teamPts(L, F.teams[a], d0, d1).tot, sb = x ? x.sb : FAN.teamPts(L, F.teams[b], d0, d1).tot; return `<div class="fan-om"><span class="${sa > sb ? 'w' : ''}">${tName(F, a)} <b>${f1(sa)}</b></span><span class="${sb > sa ? 'w' : ''}">${tName(F, b)} <b>${f1(sb)}</b></span></div>`; }).join('');
    return big + (others ? `<section class="panel"><h3>Around the league</h3><div class="fan-oms">${others}</div></section>` : '');
  }

  function bracket(F) {
    if (!F.po) return '';
    const r = F.res, sr = r[F.nR], fr = r[F.nR + 1];
    const cell = (i, s, win) => `<div class="fan-bt ${win ? 'w' : ''}">${i == null ? '<span class="muted">TBD</span>' : tName(F, i)}${s != null ? `<b>${f1(s)}</b>` : ''}</div>`;
    const semis = F.po.semi.map(([a, b]) => { const x = sr && sr.find(q => q.a === a); return `<div class="fan-bm">${cell(a, x && x.sa, x && x.win === a)}${cell(b, x && x.sb, x && x.win === b)}</div>`; }).join('');
    const fin = F.po.fin || [null, null], x = fr && fr[0];
    return `<section class="panel"><h3>Playoffs</h3><div class="fan-br"><div><span class="muted">Semifinals</span>${semis}</div><div><span class="muted">Final</span><div class="fan-bm">${cell(fin[0], x && x.sa, x && x.win === fin[0])}${cell(fin[1], x && x.sb, x && x.win === fin[1])}</div>${F.champ != null ? `<div class="fan-champ">🏆 ${esc(F.teams[F.champ].n)}</div>` : ''}</div></div></section>`;
  }
  function vStand(L) {
    const F = L.fan, T = FAN.table(F);
    const streak = i => { let s = '', n = 0; for (let w = Math.min(F.wk, F.nR) - 1; w >= 0; w--) { const x = F.res[w] && F.res[w].find(q => q.a === i || q.b === i); if (!x) break; const r = x.win === i ? 'W' : 'L'; if (!s) s = r; if (r !== s) break; n++; } return s ? s + n : '—'; };
    return `<section class="panel"><h3>Standings <span class="muted" style="font-weight:400;font-size:13px">${Math.min(F.wk, F.nR)} of ${F.nR} weeks · top 4 make the playoffs</span></h3><div class="tblwrap"><table class="sortable fan-tbl" data-sid="fanst"><thead><tr><th class="num">#</th><th>Team</th><th>Manager</th><th class="num">W</th><th class="num">L</th><th class="num" title="Points for">PF</th><th class="num" title="Points against">PA</th><th>Streak</th></tr></thead><tbody>${T.map((x, k) => `<tr class="${x.i === 0 ? 'fan-me' : ''}${k === 3 ? ' fan-cut' : ''}"><td class="num">${k + 1}</td><td>${tName(F, x.i)}</td><td>${esc(x.t.m)}${x.t.sty ? ` <span class="muted">· ${FAN.STY[x.t.sty]}</span>` : ''}</td><td class="num">${x.t.w}</td><td class="num">${x.t.l}</td><td class="num">${f1(x.t.pf)}</td><td class="num">${f1(x.t.pa)}</td><td>${streak(x.i)}</td></tr>`).join('')}</tbody></table></div></section>${bracket(F)}`;
  }

  function seasonPts(L, F, ti, pid) { const t = F.teams[ti]; let s = 0; const idx = {}; for (const e of t.r) if (e.pid === pid) { const x = FAN.teamPts(L, { r: [e] }, F.start, L.day + 1); s += x.tot; } return s; }
  function vRoster(L) {
    const F = L.fan, u = ui(), w = FAN.curWeek(L, F), d0 = FAN.wkStart(F, Math.min(w, F.nW - 1)), wk = FAN.teamPts(L, F.teams[0], d0, L.day + 1), ab = abbr(L);
    const open = L.phase === 'regular' && F.champ == null && w < F.nW, left = FAN.addsLeft(L);
    const rows = FAN.live(F.teams[0]).map(e => L.players[e.pid]).filter(Boolean).sort((a, b) => FAN.proj(L, b) - FAN.proj(L, a)).map(p => { const c = curFp(p); return `<tr class="${u.fanDrop === p.id ? 'fan-sel' : ''}"><td>${plink(p)}${inj(p)}</td><td>${POS[p.pos]}</td><td>${ab(p.team)}</td><td class="num">${f1(FAN.proj(L, p))}</td><td class="num">${c == null ? '—' : f1(c)}</td><td class="num">${f1(wk.by[p.id] || 0)}</td><td class="num">${f1(seasonPts(L, F, 0, p.id))}</td><td class="nosort">${open ? `<button class="sm ${u.fanDrop === p.id ? 'primary' : ''}" data-fandrop="${p.id}">${u.fanDrop === p.id ? 'Dropping' : 'Drop'}</button>` : ''}</td></tr>`; }).join('');
    const free = filterList(L, FAN.pool(L).filter(p => FAN.owner(F, p.id) < 0));
    const dp = u.fanDrop != null && L.players[u.fanDrop] && FAN.live(F.teams[0]).some(e => e.pid === u.fanDrop) ? L.players[u.fanDrop] : null;
    const moves = F.moves.slice(0, 12).map(m => { const a = L.players[m.add], d = L.players[m.drop]; return `<li><span class="muted">${weekLabel(F, m.w)}</span> ${tName(F, m.ti)} added ${a ? plink(a) : '?'}, dropped ${d ? plink(d) : '?'}</li>`; }).join('');
    return `<section class="panel"><h3>My roster <span class="muted" style="font-weight:400;font-size:13px">${esc(F.teams[0].n)} · ${F.teams[0].w}-${F.teams[0].l}</span></h3><div class="tblwrap"><table class="sortable fan-tbl" data-sid="fanro"><thead><tr><th>Player</th><th>Pos</th><th>Team</th><th class="num">Proj</th><th class="num">FP/G</th><th class="num" title="Fantasy points this week">Week</th><th class="num" title="Fantasy points for your team this season">Season</th><th class="nosort"></th></tr></thead><tbody>${rows}</tbody></table></div></section>
      <section class="panel"><h3>Waivers <span class="muted" style="font-weight:400;font-size:13px">${open ? `${left} of ${FAN.ADDS} adds left this week` : 'closed'}</span></h3>${open ? `<p class="fan-note">${dp ? `Dropping <strong>${esc(dp.name)}</strong>. Pick a free agent to add. He scores from today's games on.` : 'Step 1: tap <strong>Drop</strong> on a player above. Step 2: tap <strong>Add</strong> on a free agent.'}</p>` : ''}${searchBar()}<div class="tblwrap"><table class="sortable fan-tbl" data-sid="fanfa"><thead><tr>${PHEAD}</tr></thead><tbody>${playerRows(L, free, p => open ? `<button class="sm ${dp && left ? 'primary' : ''}" data-fanadd="${p.id}" ${dp && left ? '' : 'disabled'}>Add</button>` : '')}</tbody></table></div>${u.fanMsg ? `<p class="fan-msg">${esc(u.fanMsg)}</p>` : ''}</section>
      ${moves ? `<section class="panel"><h3>Recent moves</h3><ul class="fan-list">${moves}</ul></section>` : ''}`;
  }
  function vLeague(L) {
    const F = L.fan, ab = abbr(L);
    return `<div class="fan-teams">${F.teams.map((t, i) => `<section class="panel"><h3>${tName(F, i)} <span class="muted" style="font-weight:400;font-size:12px">${t.w}-${t.l} · ${esc(t.m)}</span></h3><ul class="fan-list">${FAN.live(t).map(e => L.players[e.pid]).filter(Boolean).sort((a, b) => FAN.proj(L, b) - FAN.proj(L, a)).map(p => `<li>${plink(p)}${inj(p)} <span class="muted">${POS[p.pos]} · ${ab(p.team)} · ${f1(FAN.proj(L, p))}</span></li>`).join('')}</ul></section>`).join('')}</div>`;
  }

  window.P3V.fantasy = function () {
    const L = Lg(), u = ui();
    try { FAN.sync(L); } catch (e) { }
    const F = L.fan && L.fan.s === L.season ? L.fan : null;
    if (!F) return vSetup(L);
    if (FAN.drafting(L)) return vDraft(L);
    const T = [['matchup', 'Matchup'], ['standings', 'Standings'], ['roster', 'My roster & waivers'], ['league', 'All teams'], ['history', 'History'], ['rules', 'Scoring']];
    const t = T.some(x => x[0] === u.fanTab) ? u.fanTab : 'matchup';
    const head = `<div class="fan-top"><div><h2>${esc(F.teams[0].n)}</h2><span class="muted">Fantasy league ${F.s} · ${F.teams[0].w}-${F.teams[0].l}${F.champ != null ? ` · Champion: ${esc(F.teams[F.champ].n)}` : ''}</span></div><span class="seg">${T.map(([k, n]) => tab(k, n, t, 'fantab')).join('')}</span></div>`;
    const body = t === 'standings' ? vStand(L) : t === 'roster' ? vRoster(L) : t === 'league' ? vLeague(L) : t === 'history' ? (histPanel((L.fanHist || []).slice().reverse()) || '<section class="panel"><p class="muted">No finished fantasy seasons yet.</p></section>') : t === 'rules' ? `<section class="panel"><h3>Scoring</h3>${scoring()}<p class="fan-note">A player scores only on days he is on your roster. Ties go to the team with more points on the season.</p></section>` : vMatchup(L);
    return head + body;
  };

  function rr() { P.save(); P.render(); }
  document.addEventListener('click', e => {
    const L = Lg(); if (!L) return;
    const b = e.target.closest('[data-fango],[data-fandraft],[data-fanauto],[data-fantab],[data-fanwk],[data-fanpos],[data-fandrop],[data-fanadd]'); if (!b || !document.getElementById('main').contains(b)) return;
    const u = ui(), d = b.dataset; u.fanMsg = null;
    if (d.fango) { const nm = (document.getElementById('fan-name') || {}).value; if (FAN.create(L, (nm || '').trim() || 'My Fantasy Team')) { u.fanTab = 'matchup'; u.fanWk = null; } rr(); return; }
    if (d.fandraft) { if (L.fan.draft.ord[L.fan.draft.i] === 0 && FAN.draftPick(L, +d.fandraft)) FAN.aiDraft(L); rr(); return; }
    if (d.fanauto) { const D = L.fan.draft; do { if (D.ord[D.i] === 0) FAN.draftPick(L, FAN.bestFor(L, 0).id); FAN.aiDraft(L); } while (d.fanauto === 'all' && FAN.drafting(L)); rr(); return; }
    if (d.fantab) { u.fanTab = d.fantab; u.fanWk = null; P.render(); return; }
    if (d.fanwk != null) { u.fanWk = +d.fanwk; P.render(); return; }
    if (d.fanpos) { u.fanPos = d.fanpos; P.render(); return; }
    if (d.fandrop) { u.fanDrop = u.fanDrop === +d.fandrop ? null : +d.fandrop; P.render(); return; }
    if (d.fanadd) { const err = FAN.userAdd(L, +d.fanadd, u.fanDrop); if (err) u.fanMsg = err; else { u.fanMsg = `Added ${L.players[+d.fanadd].name}.`; u.fanDrop = null; } rr(); }
  });
  let qT = null;
  document.addEventListener('input', e => { if (e.target.id !== 'fan-q') return; ui().fanQ = e.target.value; clearTimeout(qT); qT = setTimeout(() => { P.render(); const q = document.getElementById('fan-q'); if (q) { q.focus(); q.setSelectionRange(q.value.length, q.value.length); } }, 250); });

  function champPopup(n) {
    const L = Lg(); if (!L || !L.fan) return; const F = L.fan, c = F.teams[F.champ];
    P.queueDialog(() => { P.dialog(`<div class="fan-pop"><div class="fan-trophy">🏆</div><h2>${n === 'won' ? 'Fantasy champions!' : 'Fantasy final'}</h2><p>${n === 'won' ? `<strong>${esc(c.n)}</strong> won the ${F.s} fantasy title. Your draft and waiver moves paid off.` : `<strong>${esc(c.n)}</strong> (${esc(c.m)}) won the ${F.s} fantasy title. You finished ${F.teams[0].w}-${F.teams[0].l}.`}</p><div class="row"><a class="btn primary" href="#fantasy" data-fanclose="1">See the fantasy league</a></div></div>`); const a = document.querySelector('[data-fanclose]'); if (a) a.onclick = () => P.closeDialog(); if (n === 'won' && window.FX) FX.confetti(true); });
  }
  return { champPopup };
})();
if (typeof window !== 'undefined') window.FANUI = FANUI;
