// ---------- S6b functions (packed after NBA_HX by tools/hx-pack.py.txt) ----------
const hxOn = L => !!(L && L.nba && typeof NBA_HX !== 'undefined');
const hxNorm = n => String(n || '').normalize('NFKD').replace(/[̀-ͯ]/g, '').toLowerCase().replace(/[.'’`,-]/g, '').replace(/\s+/g, ' ').trim();
const hxYr = s => +String(s).slice(0, 4);
const hxLbl = y => `${y}-${String(y + 1).slice(2)}`;
// game-formula box plus-minus (computeBPM) for a real past season; VORP from it (B-Ref definition, 82-game scale)
function hxBpmOf(name, y) { const r = NBA_HX.bpmRows[hxNorm(name)]; return r ? r[y] || null : null; }
function hxFixRow(name, o) {
  if (!o || typeof NBA_HX === 'undefined') return o; const b = hxBpmOf(name, hxYr(o.season)); if (!b) return o;
  o.obpm = b[0]; o.dbpm = b[1]; o.bpm = b[2]; if (o.mp) o.vorp = Math.round((b[2] + 2) * o.mp / (82 * 48) * 10) / 10; return o;
}
(function () {
  if (typeof nbaRealRows === 'function') { const f0 = nbaRealRows; nbaRealRows = function (p) { const r = f0(p); return r && p ? r.map(o => hxFixRow(p.name, o)) : r; }; }
  if (typeof nbaEstRows === 'function') { const f1 = nbaEstRows; nbaEstRows = function (p) { const r = f1(p); return r && p ? r.map(o => hxFixRow(p.name, o)) : r; }; }
  if (typeof nbaLegends === 'function') { const f2 = nbaLegends; let done = false; nbaLegends = function () { const a = f2(); if (!done) { done = true; for (const l of a) { const b = NBA_HX.bpmLeg[hxNorm(l.name)]; if (b && l.rs) { l.rs.bpm = b[2]; if (l.rs.mp) l.rs.vorp = Math.round((b[2] + 2) * l.rs.mp / (82 * 48) * 10) / 10; } } } return a; }; }
})();

// ---------- data access ----------
const hxAb = t => (typeof nbaAbOf === 'function' ? nbaAbOf(t) : t.abbr);
function hxSeasons(ab) { return (NBA_HX.fs[ab] || []); }
function hxBestRecord(y) { let best = null; for (const ab in NBA_HX.fs) for (const r of NBA_HX.fs[ab]) if (r[0] === y && r[2] != null && r[3] != null) { const pc = r[2] / Math.max(1, r[2] + r[3]); if (!best || pc > best.pc) best = { ab, name: r[1], w: r[2], l: r[3], pc }; } return best; }
function hxRetired(ab) { return NBA_HX.ret.filter(r => r[0] === ab); }
function hxHof() { return NBA_HX.hof.slice().sort((a, b) => (b[1] || 0) - (a[1] || 0)); }
function hxAwards(y, kind) { return NBA_HX.aw.filter(r => r[0] === y && (!kind || r[1] === kind)); }
// sim seasons with a franchise (one universe: they add to the real totals)
const HX_FL_STAT = { G: s => s.gp, MP: s => Math.round((s.min || 0) / 60), PTS: s => s.pts, TRB: s => (s.orb || 0) + (s.drb || 0), AST: s => s.ast, STL: s => s.stl, BLK: s => s.blk, '3P': s => s.tpm };
function hxSimTeamTotals(L, tid, ty) {
  const out = {};
  for (const p of Object.values(L.players)) for (const h of p.hist || []) {
    const s = ty === 'PO' ? (h.poT && h.poT[tid] ? h.poT[tid] : h.tid === tid ? h.po : null) : (h.rsT && h.rsT[tid] ? h.rsT[tid] : h.tid === tid ? h.rs : null);
    if (!s || !s.gp) continue; const o = out[p.id] = out[p.id] || { p, s: {} };
    for (const k in HX_FL_STAT) o.s[k] = (o.s[k] || 0) + (HX_FL_STAT[k](s) || 0);
  }
  return out;
}
function hxLeaders(L, t, ty, st) {
  const base = ((NBA_HX.fl[hxAb(t)] || {})[ty] || {})[st] || [], sim = hxSimTeamTotals(L, t.id, ty), byN = {};
  const out = base.map(r => ({ name: r[0], v: r[1], pid: null }));
  out.forEach(x => { byN[hxNorm(x.name)] = x; });
  for (const id in sim) { const x = sim[id], k = hxNorm(x.p.name), v = x.s[st] || 0; if (byN[k]) { byN[k].v += v; byN[k].pid = x.p.id; } else out.push({ name: x.p.name, v, pid: x.p.id }); }
  return out.filter(x => x.v > 0).sort((a, b) => b.v - a.v).slice(0, 10);
}
// league records from history in the shape records() uses: {pid, name, v, ctx}
const HX_GAME = { pts: 'PTS', reb: 'TRB', ast: 'AST', stl: 'STL', blk: 'BLK', tpm: '3P', ftm: 'FTM', fgm: 'FGM' };
function hxRecGame(k, ty) { const L0 = (NBA_HX.rec.game[ty || 'RS'] || {})[HX_GAME[k]] || []; return L0.map(r => ({ pid: null, name: r[0], v: r[4], ctx: `${r[2]} ${r[1]}${r[3] ? ' vs ' + r[3] : ''}` })); }
function hxRecSeason(st, kind) { return ((NBA_HX.rec.season.RS || {})[st + ':' + kind] || []).map(r => ({ pid: null, name: r[0], v: r[3], ctx: `${r[1]}${r[2] ? ' ' + r[2] : ''}` })); }
function hxRecCareer(st, ty) { return ((NBA_HX.rec.career[ty || 'RS'] || {})[st] || []).map(r => ({ pid: null, name: r[0], v: r[1], ctx: 'retired' })); }
function hxRecAdv(kind) { return kind === 'career' ? NBA_HX.rec.adv.careerBpm.map(r => ({ pid: null, name: r[0], v: r[1], ctx: 'career' })) : NBA_HX.rec.adv.seasonBpm.map(r => ({ pid: null, name: r[0], v: r[3], ctx: r[1] })); }
// merge history entries into a records list: a name already in the list (a player in this league) keeps the game's own value
function hxMerge(list, extra) {
  const have = new Set(list.map(x => hxNorm(x.name)));
  return list.concat(extra.filter(x => !have.has(hxNorm(x.name)))).sort((a, b) => b.v - a.v).slice(0, 100);
}

// ---------- team page: franchise seasons, leaders, retired numbers ----------
function hxTeamPanels(L, t) {
  if (!hxOn(L)) return '';
  const e = typeof esc === 'function' ? esc : (x => String(x)), ab = hxAb(t), fs = hxSeasons(ab).slice().reverse();
  const pl = x => x.pid != null && L.players[x.pid] && typeof plink === 'function' ? plink(L.players[x.pid]) : e(x.name);
  const ty = (typeof ui !== 'undefined' && ui.hxTy === 'PO') ? 'PO' : 'RS';
  const stats = ['PTS', 'TRB', 'AST', 'STL', 'BLK', '3P', 'G', 'MP'], nm = { PTS: 'Points', TRB: 'Rebounds', AST: 'Assists', STL: 'Steals', BLK: 'Blocks', '3P': '3-pointers', G: 'Games', MP: 'Minutes' };
  const lead = stats.map(st => { const l = hxLeaders(L, t, ty, st); return l.length ? `<div class="panel"><h3>${nm[st]}</h3>${l.map((x, i) => `<div class="leader"><span class="muted">${i + 1}</span><span>${pl(x)}</span><span class="v">${Math.round(x.v).toLocaleString()}</span></div>`).join('')}</div>` : ''; }).join('');
  const ret = hxRetired(ab);
  const seasons = fs.length ? `<div class="tblwrap"><table><thead><tr><th class="l">Season</th><th class="l">Team</th><th>W</th><th>L</th><th class="l">Result</th><th class="l">Coach</th></tr></thead><tbody>${fs.map(r => `<tr><td class="l">${hxLbl(r[0])}</td><td class="l">${e(r[1])}</td><td>${r[2] ?? '—'}</td><td>${r[3] ?? '—'}</td><td class="l">${e(r[4] || '—')}</td><td class="l">${e(r[5] || '—')}</td></tr>`).join('')}</tbody></table></div>` : '<p class="muted">No earlier seasons.</p>';
  return `<section class="panel hx-fr" style="margin-top:16px"><h2>Franchise leaders</h2><div class="subtabs" style="margin-bottom:8px"><button class="sm ${ty === 'RS' ? 'primary' : ''}" data-hxty="RS">Regular season</button><button class="sm ${ty === 'PO' ? 'primary' : ''}" data-hxty="PO">Playoffs</button></div><div class="grid3">${lead || '<p class="muted">None yet.</p>'}</div></section>
  <section class="panel" style="margin-top:16px"><h2>Retired numbers</h2>${ret.length ? ret.map(r => `<div class="leader" style="grid-template-columns:3em minmax(0,1fr) auto"><span class="v">#${e(r[1])}</span><span>${e(r[2])}${r[4] ? ` <span class="muted">${e(r[4])}</span>` : ''}</span><span class="muted">${r[3] || ''}</span></div>`).join('') : '<p class="muted">None.</p>'}</section>
  <section class="panel" style="margin-top:16px"><details><summary><h2 style="display:inline">Franchise seasons 1946-2026</h2> <span class="muted">${fs.length}</span></summary>${seasons}</details></section>`;
}
// History > Awards and Hall of Fame: Hall of Fame members from before this league, newest first (league inductees are listed above them)
function hxHofRows() { const e = typeof esc === 'function' ? esc : (x => String(x)); return hxHof().map(r => `<div class="leader" style="grid-template-columns:minmax(0,1fr) auto"><span>${e(r[0])} <span class="muted">${e(r[2] || '')}${r[3] ? ' · ' + e(r[3]) : ''}</span></span><span class="muted">${r[1] || ''}</span></div>`).join(''); }
