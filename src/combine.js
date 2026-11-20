// Draft combine (Nov 20 2026). Right after the draft lottery, this year's class is measured and runs drills.
// Measurements (height without shoes, wingspan, standing reach, weight, body fat) and drills (verticals, lane agility,
// shuttle, sprint, bench, spot-up shooting) come from the prospect's real ratings plus a little noise.
// A strong or weak combine moves the mock drafts and every team's board a few spots (p.cmb.b, about -4..+4),
// and the athletic tests tighten every read on his athleticism. Some top prospects only get measured.
// State: p.cmb = { s, skip, hb, hs, wing, reach, wgt, bf, sv, mv, lane, shut, spr, bench, shot, z, b, g }
//        L.combine[d] = { pre: {pid: consensus rank before}, post: {pid: rank after}, n }
// Noise uses hgauss (hashed), so the sim's random stream is untouched.

// ---------- logic ----------
const CMB_FX = { bMax: 4, bK: 2.2, skipTop: 0.3, skipAny: 0.05 };
const CMB_TESTS = [   // key, label, unit, higher is better, digits
  ['mv', 'Max vertical', '"', true, 1], ['sv', 'Standing vertical', '"', true, 1], ['lane', 'Lane agility', 's', false, 2],
  ['shut', 'Shuttle run', 's', false, 2], ['spr', '3/4 court sprint', 's', false, 2], ['bench', 'Bench (185 lb)', ' reps', true, 0], ['shot', 'Spot-up shooting', '/25', true, 0]];
const q4 = x => Math.round(x * 4) / 4, r2c = x => Math.round(x * 100) / 100, r1c = x => Math.round(x * 10) / 10;
function cmbMeasure(L, p, top) {
  const g = k => hgauss(p.id, 88000 + k * 17 + (p.draftYear || 0) * 3);
  const hb = q4(p.hgt - 1.25 + g(1) * 0.2), wing = q4(p.wing + g(2) * 0.25);
  const c = { s: p.draftYear, hb, hs: q4(hb + 1.25), wing, reach: q4(hb * 1.27 + (wing - hb) * 0.45 + 4 + g(3) * 0.5), wgt: Math.round(p.wgt + g(4) * 2) };
  const bmi = p.wgt / (p.hgt * p.hgt) * 703;
  c.bf = r1c(clamp(5.5 + (bmi - 24) * 0.55 + (55 - p.str) * 0.04 + g(5) * 1.1, 3.5, 16));
  // top prospects sometimes sit out the drills; a few others are hurt or withdraw
  const skip = hrand(p.id, 88123 + (p.draftYear || 0), 1) < (top ? CMB_FX.skipTop : CMB_FX.skipAny);
  if (skip) { c.skip = true; return c; }
  const sv = clamp(27 + (p.vrt - 50) * 0.22 - (p.hgt - 78) * 0.25 + g(6) * 1.6, 20, 38);
  c.sv = r1c(sv); c.mv = r1c(clamp(sv + 6 + (p.spd - 50) * 0.05 + g(7) * 1.1, 24, 46));
  c.lane = r2c(clamp(11.3 - (p.agi - 50) * 0.028 + (p.hgt - 78) * 0.04 + g(8) * 0.18, 10.2, 13.2));
  c.shut = r2c(clamp(3.05 - (p.agi - 50) * 0.008 + (p.hgt - 78) * 0.01 + g(9) * 0.06, 2.7, 3.5));
  c.spr = r2c(clamp(3.28 - (p.spd - 50) * 0.0075 + g(10) * 0.05, 2.95, 3.65));
  c.bench = Math.round(clamp(8 + (p.str - 50) * 0.35 + g(11) * 2.5, 0, 26));
  c.shot = Math.round(clamp(25 * (0.42 + (p.tp - 50) * 0.009 + (p.mid - 50) * 0.003 + g(12) * 0.06), 3, 25));
  return c;
}
// class z-scores: athletic tests 60%, length (wingspan over height, reach for the position) 25%, shooting 15%
function cmbScore(ps) {
  const z = (k, hi) => { const xs = ps.filter(p => p.cmb[k] != null).map(p => p.cmb[k]); const m = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length); const sd = Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length)) || 1; return p => p.cmb[k] == null ? null : (hi ? 1 : -1) * (p.cmb[k] - m) / sd; };
  const zs = ['mv', 'sv', 'lane', 'shut', 'spr', 'bench'].map(k => z(k, CMB_TESTS.find(t => t[0] === k)[3])), zShot = z('shot', true);
  const lenOf = p => (p.cmb.wing - p.cmb.hb) + (p.cmb.reach - (HGT_MEAN[POS[p.pos]] || 78) * 1.27 - 4) * 0.3;
  const lens = ps.map(lenOf), lm = lens.reduce((a, b) => a + b, 0) / Math.max(1, lens.length), lsd = Math.sqrt(lens.reduce((a, b) => a + (b - lm) ** 2, 0) / Math.max(1, lens.length)) || 1;
  for (const p of ps) {
    const len = (lenOf(p) - lm) / lsd;
    if (p.cmb.skip) { p.cmb.z = r2c(0.25 * len); }
    else { const a = zs.map(f => f(p)).reduce((s, v) => s + v, 0) / zs.length; p.cmb.z = r2c(0.6 * a + 0.25 * len + 0.15 * zShot(p)); }
    p.cmb.b = r1c(clamp(p.cmb.z * CMB_FX.bK, -CMB_FX.bMax, CMB_FX.bMax));
    const v = p.cmb.z; p.cmb.g = p.cmb.skip ? '—' : v >= 1.1 ? 'A+' : v >= 0.7 ? 'A' : v >= 0.35 ? 'B+' : v >= 0 ? 'B' : v >= -0.35 ? 'C+' : v >= -0.7 ? 'C' : 'D';
  }
}
function runCombine(L, d) {
  d = d == null ? L.season : d;
  L.combine = L.combine || {};
  if (L.combine[d]) return L.combine[d];
  const ps = (L.classes[d] || []).map(id => L.players[id]).filter(p => p && p.prospect);
  if (!ps.length) return null;
  const pre = Object.assign({}, mockSet(L, d).consRank);
  for (const p of ps) p.cmb = cmbMeasure(L, p, (pre[p.id] || 99) <= 5);
  cmbScore(ps);
  L.combine[d] = { pre, n: ps.length };   // the mock cache key changes here
  const post = L.combine[d].post = Object.assign({}, mockSet(L, d).consRank);
  // news: the best athletic marks, the longest wingspan, the biggest risers and fallers among the top 40
  const tested = ps.filter(p => !p.cmb.skip), lbl = draftLabel(d);
  const mv = tested.slice().sort((a, b) => b.cmb.mv - a.cmb.mv)[0], wg = ps.slice().sort((a, b) => (b.cmb.wing - b.cmb.hb) - (a.cmb.wing - a.cmb.hb))[0];
  logNews(L, `Draft combine opens: ${tested.length} of ${ps.length} ${lbl} prospects test${ps.length - tested.length ? `, ${ps.length - tested.length} measured only` : ''}`, null, 'draft');
  if (mv) logNews(L, `Combine: ${mv.name} (${posLabel(mv)}) posts the top max vertical, ${mv.cmb.mv}"`, null, 'draft');
  if (wg) logNews(L, `Combine: ${wg.name} (${posLabel(wg)}) measures a ${Math.floor(wg.cmb.wing / 12)}'${r1c(wg.cmb.wing % 12)}" wingspan, ${r1c(wg.cmb.wing - wg.cmb.hb)}" longer than his height`, null, 'draft');
  const mv2 = ps.filter(p => Math.min(pre[p.id], post[p.id]) <= 40).map(p => ({ p, m: pre[p.id] - post[p.id] }));
  const up = mv2.slice().sort((a, b) => b.m - a.m)[0], dn = mv2.slice().sort((a, b) => a.m - b.m)[0];
  if (up && up.m >= 3) logNews(L, `Combine riser: ${up.p.name} climbs from #${pre[up.p.id]} to #${post[up.p.id]} in the mock drafts`, null, 'draft');
  if (dn && dn.m <= -3) logNews(L, `Combine slide: ${dn.p.name} falls from #${pre[dn.p.id]} to #${post[dn.p.id]} in the mock drafts`, null, 'draft');
  if (L.user != null) for (const p of ps) if (p.cmb.g === 'A+' && typeof isWatched === 'function' && isWatched(L, p)) logNews(L, `Combine: ${p.name}, on your watch list, tested off the charts`, L.user, 'draft');
  return L.combine[d];
}
// used by mock drafts and team boards (league.js)
function cmbBoost(L, p) { return p && p.cmb && p.cmb.s === p.draftYear && p.prospect ? p.cmb.b || 0 : 0; }
// athletic tests tighten the read on athleticism (league.js readErr)
function cmbAthK(p) { return p && p.cmb && !p.cmb.skip && p.prospect ? 0.45 : 1; }

// ---------- UI ----------
const cmbFt = i => `${Math.floor(i / 12)}'${r1c(i % 12)}"`;
function cmbVal(c, k) { const t = CMB_TESTS.find(x => x[0] === k); return c[k] == null ? '—' : (t[4] ? c[k].toFixed(t[4]) : c[k]) + t[2]; }
function cmbGradeChip(c) { if (!c) return ''; const g = c.g, cls = !g || g === '—' ? '' : g[0] === 'A' ? 'cmb-a' : g[0] === 'B' ? 'cmb-b' : g[0] === 'C' ? 'cmb-c' : 'cmb-d'; return `<span class="cmb-g ${cls}" title="${c.skip ? 'Measured only, skipped the drills' : 'Combine grade against this class'}">${c.skip ? 'Measured' : g}</span>`; }
function cmbMove(rec, p) { if (!rec || !rec.post || !rec.pre[p.id]) return { v: 0, h: '<span class="muted">—</span>' }; const m = rec.pre[p.id] - rec.post[p.id]; return { v: m, h: m > 0 ? `<span class="cmb-up">▲${m}</span>` : m < 0 ? `<span class="cmb-dn">▼${-m}</span>` : '<span class="muted">–</span>' }; }
// Draft > Combine page
function combineView(d) {
  const rec = (L.combine || {})[d];
  if (!rec) {
    const when = d === L.season && ['off-review', 'regular', 'regular-done', 'playoffs', 'season-done'].includes(L.phase) ? 'right after this year\'s draft lottery' : d === L.season ? 'right after the lottery' : `after the ${seasonName ? seasonName(d - 1) : d - 1} season's lottery`;
    return `<section class="panel"><h2>Draft combine · ${draftLabel(d)} class</h2><p class="muted">The combine runs ${when}. Every prospect is measured (height without shoes, wingspan, reach, weight, body fat), and most run the drills: verticals, lane agility, shuttle, sprint, bench and spot-up shooting. A strong or weak combine moves the mock drafts and every team's board a few spots.</p></section>`;
  }
  const ps = (L.classes[d] || []).map(id => L.players[id]).filter(p => p && p.cmb && p.cmb.s === d);
  const ms = mockSet(L, d), tested = ps.filter(p => !p.cmb.skip);
  const best = {}; for (const [k, , , hi] of CMB_TESTS) { const xs = tested.map(p => p.cmb[k]).filter(v => v != null); best[k] = xs.length ? (hi ? Math.max(...xs) : Math.min(...xs)) : null; }
  const wl = ps.map(p => p.cmb.wing - p.cmb.hb); best.wd = Math.max(...wl);
  const td = (p, k) => { const v = p.cmb[k]; return `<td data-v="${v == null ? '' : v}" class="${v != null && v === best[k] ? 'cmb-best' : ''}">${cmbVal(p.cmb, k)}</td>`; };
  const rows = ps.slice().sort((a, b) => (ms.consRank[a.id] || 999) - (ms.consRank[b.id] || 999)).map(p => { const c = p.cmb, mv = cmbMove(rec, p), wd = r1c(c.wing - c.hb);
    return `<tr class="click" data-player="${p.id}" ${frow(p)}><td><strong>${ms.consRank[p.id] || '—'}</strong></td><td data-v="${mv.v}">${mv.h}</td><td class="l">${esc(p.name)}</td><td class="l">${posLabel(p)}</td><td>${p.age}</td>
    <td data-v="${c.hb}">${cmbFt(c.hb)}</td><td data-v="${c.wing}">${cmbFt(c.wing)}</td><td data-v="${wd}" class="${wd === r1c(best.wd) ? 'cmb-best' : ''}">${wd > 0 ? '+' : ''}${wd}"</td><td data-v="${c.reach}">${cmbFt(c.reach)}</td><td data-v="${c.wgt}">${c.wgt}</td><td data-v="${c.bf}">${c.bf}%</td>
    ${CMB_TESTS.map(t => td(p, t[0])).join('')}<td data-v="${c.skip ? -9 : c.z}">${cmbGradeChip(c)}</td></tr>`; }).join('');
  const risers = ps.map(p => ({ p, m: cmbMove(rec, p).v })).filter(x => Math.min(rec.pre[x.p.id] || 99, rec.post[x.p.id] || 99) <= 40);
  const top3 = (arr) => arr.slice(0, 3).map(x => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><a class="lk" data-player="${x.p.id}">${esc(x.p.name)}</a><span>#${rec.pre[x.p.id]} → #${rec.post[x.p.id]}</span></div>`).join('') || '<p class="muted">None.</p>';
  const leaders = [['mv', 'Max vertical'], ['spr', 'Fastest sprint'], ['lane', 'Quickest lane agility'], ['shot', 'Best shooter']].map(([k, n]) => { const hi = CMB_TESTS.find(t => t[0] === k)[3]; const p = tested.slice().sort((a, b) => hi ? b.cmb[k] - a.cmb[k] : a.cmb[k] - b.cmb[k])[0]; return p ? `<div class="cmb-tile"><div class="k">${n}</div><div class="v">${cmbVal(p.cmb, k)}</div><a class="lk" data-player="${p.id}">${esc(p.name)}</a></div>` : ''; }).join('');
  const lw = ps.slice().sort((a, b) => (b.cmb.wing - b.cmb.hb) - (a.cmb.wing - a.cmb.hb))[0];
  return `<section class="panel"><h2>Draft combine · ${draftLabel(d)} class</h2><p class="muted" style="margin-top:-4px">${tested.length} of ${ps.length} prospects ran the drills; the rest were measured only. Heights are without shoes. Gold marks the best in the class. "Move" is how far he moved in the consensus mock after the combine.</p>
  <div class="cmb-tiles">${leaders}${lw ? `<div class="cmb-tile"><div class="k">Longest arms</div><div class="v">+${r1c(lw.cmb.wing - lw.cmb.hb)}"</div><a class="lk" data-player="${lw.id}">${esc(lw.name)}</a></div>` : ''}</div>
  <div class="grid2 cmb-moves"><div><h3>Stock up</h3>${top3(risers.filter(x => x.m > 0).sort((a, b) => b.m - a.m))}</div><div><h3>Stock down</h3>${top3(risers.filter(x => x.m < 0).sort((a, b) => a.m - b.m))}</div></div></section>
  <section class="panel">${fbar('cmb')}<div class="tblwrap"><table class="sortable cmb-tbl" data-sid="cmb" data-flist="cmb"><thead><tr><th title="Consensus mock rank now">Cons</th><th title="Moves in the consensus mock after the combine">Move</th><th class="l">Prospect</th><th class="l">Pos</th><th>Age</th><th title="Height without shoes">Height</th><th>Wingspan</th><th title="Wingspan minus height">+/-</th><th title="Standing reach">Reach</th><th title="Weight (lb)">Wt</th><th title="Body fat">Fat</th>${CMB_TESTS.map(t => `<th title="${esc(t[1])}">${esc({ mv: 'Max vert', sv: 'Std vert', lane: 'Lane', shut: 'Shuttle', spr: 'Sprint', bench: 'Bench', shot: 'Shooting' }[t[0]])}</th>`).join('')}<th title="Overall combine grade against this class">Grade</th></tr></thead><tbody>${rows}</tbody></table></div></section>`;
}
// combine block on a prospect's page
function cmbCard(p) {
  const c = p && p.cmb; if (!c || !p.prospect && !(p.draft && p.draft.s === c.s)) return '';
  const rec = (L.combine || {})[c.s], mv = rec ? cmbMove(rec, p) : null;
  const m = [['Height (no shoes)', cmbFt(c.hb)], ['Wingspan', `${cmbFt(c.wing)} <span class="muted">(${c.wing - c.hb >= 0 ? '+' : ''}${r1c(c.wing - c.hb)}")</span>`], ['Standing reach', cmbFt(c.reach)], ['Weight', c.wgt + ' lb'], ['Body fat', c.bf + '%']];
  const dr = c.skip ? [] : CMB_TESTS.map(t => [t[1], cmbVal(c, t[0])]);
  const cell = ([k, v]) => `<div><div class="k">${esc(k)}</div><div class="v">${v}</div></div>`;
  return `<section class="panel cmb-card" style="margin-bottom:16px"><h3>${draftLabel(c.s)} draft combine ${cmbGradeChip(c)}${mv && mv.v ? ` <span style="font-size:13px">${mv.h} <span class="muted">in the mocks</span></span>` : ''}</h3>
  <div class="cmb-grid">${m.map(cell).join('')}</div>${c.skip ? '<p class="muted" style="margin:8px 0 0">Measured only; he skipped the drills.</p>' : `<div class="cmb-grid" style="margin-top:8px">${dr.map(cell).join('')}</div>`}<p style="margin:8px 0 0"><a class="lk" data-cmbpage="${c.s}">Full combine results →</a></p></section>`;
}
if (typeof document !== 'undefined') document.addEventListener('click', e => { const a = e.target.closest && e.target.closest('[data-cmbpage]'); if (!a) return; ui.player = null; ui.dpage = 'cmb'; ui.cls = +a.dataset.cmbpage; location.hash = '#draft'; render(); });
