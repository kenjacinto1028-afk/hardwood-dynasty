// Phase A (Nov 18 2026): League expansion page (League > Expansion), team creator, protected list, expansion draft results popup.
// Logic lives in league.js (xpnPlan / xpnRun). Loaded after p3.js; uses app.js globals (L, ui, render, dialog, queueDialog, logo, logoBody, esc, save).
window.P3V = window.P3V || {};
const XP = (function () { with (window.PBL) {   // eslint-disable-line no-with
  const st = () => (ui.xp = ui.xp || { n: 2, defs: null, err: '' });
  const fresh = n => { const c = xpnCandidates(L), half = n / 2; return Array.from({ length: n }, (_, i) => Object.assign({}, c[i] || { city: '', name: '', abbr: '', region: '', c1: '#1d3f8f', c2: '#f2c230', logo: 'star', market: 2 }, { conf: i < half ? 'North' : 'South' })); };
  const preview = (d, i, size) => { const t = { id: 900 + i, abbr: d.abbr || '?', name: d.name || '', c1: d.c1, c2: d.c2, logo: d.logo, logoStyle: 'A', logoShape: 'shield' }; try { return `<svg class="logo" width="${size}" height="${size}" viewBox="0 0 100 100">${logoBody(t, size <= 26, size)}</svg>`; } catch (e) { return ''; } };
  const cn = c => (typeof confName === 'function' ? confName(c) : c);
  const when = s => s === L.season ? (['off-review', 'off-lottery', 'off-draft', 'off-resign'].includes(L.phase) ? 'this offseason, when free agency starts' : 'this coming offseason, when free agency starts') : 'next offseason, when free agency starts';

  function builder() {
    const S = st(); if (!S.defs || S.defs.length !== S.n) S.defs = fresh(S.n);
    const room = 36 - L.teams.length, cands = xpnCandidates(L), motifs = xpnMotifs();
    if (room < 2) return `<p class="muted">The league is full (${L.teams.length} teams, the most is 36).</p>`;
    const row = (d, i) => `<div class="panel xp-card" style="margin:0">
      <div class="row" style="gap:10px;align-items:center;margin-bottom:8px">${preview(d, i, 56)}<div><strong>${esc(d.city || 'New city')} ${esc(d.name || '')}</strong><div class="muted" style="font-size:12px">${esc(cn(d.conf))} Conference</div></div></div>
      <label class="xp-f">Start from <select data-xpi="${i}" data-xpk="pick"><option value="">Custom team</option>${cands.concat(d.abbr && !cands.some(c => c.abbr === d.abbr) ? [] : []).map(c => `<option value="${esc(c.abbr)}" ${c.abbr === d.abbr ? 'selected' : ''}>${esc(c.city)} ${esc(c.name)}</option>`).join('')}</select></label>
      <label class="xp-f">City <input data-xpi="${i}" data-xpk="city" value="${esc(d.city)}" maxlength="24"></label>
      <label class="xp-f">Nickname <input data-xpi="${i}" data-xpk="name" value="${esc(d.name)}" maxlength="24"></label>
      <label class="xp-f">Short name <input data-xpi="${i}" data-xpk="abbr" value="${esc(d.abbr)}" maxlength="4" style="width:70px;text-transform:uppercase"></label>
      <div class="row" style="gap:10px;flex-wrap:wrap"><label class="xp-f">Main color <input type="color" data-xpi="${i}" data-xpk="c1" value="${esc(d.c1)}"></label><label class="xp-f">Second color <input type="color" data-xpi="${i}" data-xpk="c2" value="${esc(d.c2)}"></label></div>
      <label class="xp-f">Logo <select data-xpi="${i}" data-xpk="logo">${motifs.map(m => `<option ${m === d.logo ? 'selected' : ''}>${esc(m)}</option>`).join('')}</select></label>
      <label class="xp-f">Market <select data-xpi="${i}" data-xpk="market">${[[3, 'Big'], [2, 'Mid'], [1, 'Small']].map(([v, t]) => `<option value="${v}" ${+d.market === v ? 'selected' : ''}>${t} market</option>`).join('')}</select></label>
    </div>`;
    return `<p>Pick the new cities. Each one starts with an expansion draft: every team protects ${XPN_PROTECT} players and the new teams pick from the rest. Then they sign free agents like everyone else.</p>
      <div class="row" style="gap:8px;margin:8px 0 12px"><span>New teams:</span>${[2, 4].filter(n => n <= room).map(n => `<button data-xpn="${n}" class="${S.n === n ? 'on primary' : ''}">${n}</button>`).join('')}<span class="muted">League: ${L.teams.length} → ${L.teams.length + S.n} teams</span></div>
      <div class="xp-grid">${S.defs.map(row).join('')}</div>
      ${S.err ? `<p class="lo" style="margin-top:10px">${esc(S.err)}</p>` : ''}
      <div class="row" style="margin-top:12px;gap:8px"><button class="primary" id="xp-go">Announce expansion</button><span class="muted">They join ${when(xpnSeason(L))}.</span></div>`;
  }
  function protectBox(P) {
    if (L.user == null) return '';
    const t = L.teams[L.user], pool = xpnPool(L, t).sort((a, b) => b.ovr - a.ovr), mine = new Set(P.mine || xpnAutoProtect(L, t, P.protect));
    const left = rosterOf(L, t).filter(p => !pool.includes(p));
    return `<div class="panel" style="margin-top:12px"><h3>Protect your players (${mine.size}/${P.protect})</h3><p class="muted" style="margin-top:-4px">Unprotected players can be taken. You lose at most ${Math.max(1, Math.ceil(XPN_PER_DRAFT * P.teams.length / L.teams.length))}. ${P.mine ? 'Your list is saved.' : 'Until you save a list, your best players are protected for you.'}</p>
      <div class="xp-prot">${pool.map(p => `<label class="check"><input type="checkbox" data-xpprot="${p.id}" ${mine.has(p.id) ? 'checked' : ''}> <span>${plink(p)} <span class="muted">${POS[p.pos]} · ${p.age} · ${ovrTxt(p)}</span></span></label>`).join('')}</div>
      ${left.length ? `<p class="muted" style="font-size:12px">Safe anyway (expiring deal or this year's rookie): ${left.map(p => esc(p.name)).join(', ')}.</p>` : ''}
      <div class="row" style="gap:8px"><button class="primary" id="xp-psave">Save protected list</button><span id="xp-pmsg" class="muted"></span></div></div>`;
  }
  function results(x, inDialog) {
    return x.teams.map(tid => { const t = L.teams[tid], ps = x.picks.filter(k => k.tid === tid);
      return `<div class="panel" style="margin:0"><h3>${logo(tid, 28)} ${esc(t.city)} ${esc(t.name)}</h3><div class="tblwrap"><table><thead><tr><th>#</th><th class="l">Player</th><th>Pos</th><th>Age</th><th>OVR</th><th class="l">From</th></tr></thead><tbody>${ps.map(k => { const p = L.players[k.pid]; return `<tr${k.from === L.user ? ' class="mineHL"' : ''}><td>${k.no}</td><td class="l">${p ? plink(p) : esc(k.name)}</td><td>${POS[k.pos]}</td><td>${k.age}</td><td>${k.ovr}</td><td class="l">${tlabel(k.from)}</td></tr>`; }).join('')}</tbody></table></div></div>`; }).join('');
  }
  P3V.expansion = function () {
    const P = L.xpnPlan, log = L.xpnLog || [];
    let body;
    if (P) body = `<p>Coming ${when(P.s)}:</p><div class="xp-grid">${P.teams.map((d, i) => `<div class="panel row" style="margin:0;gap:10px;align-items:center">${preview(d, i, 48)}<div><strong>${esc(d.city)} ${esc(d.name)}</strong> <span class="muted">(${esc(d.abbr)})</span><div class="muted" style="font-size:12px">${esc(cn(d.conf))} Conference · ${['', 'Small', 'Mid', 'Big'][d.market]} market</div></div></div>`).join('')}</div>
      <div class="row" style="gap:8px;margin-top:10px"><button id="xp-cancel">Call it off</button></div>${protectBox(P)}`;
    else body = builder();
    const past = log.slice().reverse().map(x => `<details class="panel" ${x.s === L.season ? 'open' : ''}><summary><strong>${yr(x.s)} expansion draft</strong> · ${x.teams.map(id => esc(L.teams[id].abbr)).join(', ')} · ${x.picks.length} players</summary><div class="xp-grid" style="margin-top:8px">${results(x)}</div></details>`).join('');
    return `<section class="panel"><h2>League expansion</h2>${body}</section>${past}`;
  };
  function resultsDialog(s) {
    const x = (L.xpnLog || []).find(e => e.s === s); if (!x) return;
    const lost = x.mineLost && x.mineLost.length ? `<p><strong>You lost:</strong> ${x.mineLost.map(id => plink(L.players[id])).join(', ')}.</p>` : '';
    dialog(`<h2>Expansion draft</h2><p>${x.teams.map(id => `<strong>${esc(L.teams[id].city)} ${esc(L.teams[id].name)}</strong>`).join(' and ')} join the league. Each team protected ${x.protect} players. Free agency is next, so the new teams will add more.</p>${lost}<div class="xp-grid">${results(x, true)}</div><div class="row" style="margin-top:12px"><button class="primary" id="xp-ok">OK</button></div>`, 'wide');
    const b = document.getElementById('xp-ok'); if (b) b.onclick = closeDialog;
  }
  function afterRender() {
    if (!L) return;
    if (L.xpnShow != null) { const s = L.xpnShow; L.xpnShow = null; try { save(); } catch (e) { } queueDialog(() => resultsDialog(s)); }
    const P = L.xpnPlan;
    if (P && L.user != null && P.s === L.season && L.phase === 'off-resign' && !P.mine && !P.asked) { P.asked = true; queueDialog(() => { dialog(`<h2>Expansion draft is next</h2><p>When free agency starts, the new teams pick players. Choose which ${P.protect} of your players to protect, or your best players are protected for you.</p><div class="row" style="gap:8px;margin-top:12px"><a class="btn primary" href="#expansion" id="xp-go2">Protect players</a><button id="xp-later">Use my best players</button></div>`); const a = document.getElementById('xp-go2'), b = document.getElementById('xp-later'); if (a) a.onclick = () => closeDialog(); if (b) b.onclick = closeDialog; }); }
  }
  document.addEventListener('click', e => {
    if (!L || ui.view !== 'expansion') return;
    const n = e.target.closest('[data-xpn]'); if (n) { st().n = +n.dataset.xpn; st().defs = null; st().err = ''; render(); return; }
    if (e.target.id === 'xp-go') { const S = st(); S.err = xpnPlan(L, S.defs) || ''; if (!S.err) { S.defs = null; save(); } render(); return; }
    if (e.target.id === 'xp-cancel') { xpnCancel(L); save(); render(); return; }
    if (e.target.id === 'xp-psave') { const ids = [...document.querySelectorAll('[data-xpprot]:checked')].map(x => +x.dataset.xpprot); const err = xpnSetMine(L, ids); const m = document.getElementById('xp-pmsg'); if (err) { if (m) m.textContent = err; return; } save(); render(); }
  });
  document.addEventListener('change', e => {
    if (!L || ui.view !== 'expansion') return;
    const el = e.target.closest('[data-xpi]');
    if (el) { const S = st(), d = S.defs[+el.dataset.xpi], k = el.dataset.xpk;
      if (k === 'pick') { const c = xpnCandidates(L).find(x => x.abbr === el.value); if (c) Object.assign(d, c); else Object.assign(d, { city: '', name: '', abbr: '' }); }
      else d[k] = k === 'abbr' ? el.value.toUpperCase() : k === 'market' ? +el.value : el.value;
      S.err = ''; setTimeout(render, 0); return; }
    const pr = e.target.closest('[data-xpprot]');
    if (pr && L.xpnPlan) { const on = document.querySelectorAll('[data-xpprot]:checked').length; if (on > L.xpnPlan.protect) { pr.checked = false; const m = document.getElementById('xp-pmsg'); if (m) m.textContent = `You can protect ${L.xpnPlan.protect}.`; } }
  });
  return { afterRender, resultsDialog };
} })();
window.XP = XP;
