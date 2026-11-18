// Phase 3 (Nov 18 2026): player cards, trophy room + ceremonies, music moods, save/share, draft night show, story events, phone layout.
// Loaded after app.js / fx.js / court.js; uses app.js globals (L, ui, dialog, render, portrait, logo, trophySvg ...).
// New views register in P3V (render() looks there first). Settings live in fx.js (FX.settings).
window.P3V = window.P3V || {};
const P3 = (function () { with (window.PBL) {   // eslint-disable-line no-with

  const fxS = () => (window.FX ? FX.settings : {});
  const sfx = n => { try { if (window.FX) FX.sfx(n); } catch (e) { } };
  const mult = () => ({ slow: 1.6, normal: 1, fast: 0.5 }[fxS().speed] || 1);
  const noAnim = () => !!fxS().skip;
  const stripTags = h => String(h).replace(/<[^>]*>/g, '');
  const b64e = o => btoa(unescape(encodeURIComponent(JSON.stringify(o)))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
  const b64d = s => JSON.parse(decodeURIComponent(escape(atob(s.replace(/-/g, '+').replace(/_/g, '/')))));
  const baseUrl = () => location.href.split('#')[0];

  // ---------- files: save / share a blob (same order as Export league: Claude downloads, browser download, else a message) ----------
  async function saveBlob(name, blob) {
    let dl = null; try { dl = await window.claude?.use?.('downloads'); } catch (e) { }
    if (dl) { try { await dl.save({ filename: name, data: blob }); return 'saved'; } catch (e) { if (e && e.code === 'declined') return 'cancelled'; } }
    try { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); return 'saved'; } catch (e) { return 'failed'; }
  }
  async function shareFile(name, blob, title, text) {
    try { const f = new File([blob], name, { type: blob.type }); if (navigator.canShare && navigator.canShare({ files: [f] })) { await navigator.share({ files: [f], title, text }); return 'shared'; } } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
    return null;
  }
  async function copyText(t) { try { await navigator.clipboard.writeText(t); return true; } catch (e) { return false; } }

  // ---------- #4 player cards ----------
  const RAR = {
    hof: { n: 'Hall of Fame', g: ['#1a1a1a', '#d4af37', '#fff3b0', '#d4af37', '#1a1a1a'] },
    leg: { n: 'Legendary', g: ['#9a6b00', '#ffd966', '#fff6cc', '#e0a800', '#9a6b00'] },
    epic: { n: 'Epic', g: ['#4b1590', '#a35cff', '#e7c8ff', '#8a3df0', '#4b1590'] },
    rare: { n: 'Rare', g: ['#0f3d99', '#3f8cff', '#cfe3ff', '#2a6ae0', '#0f3d99'] },
    com: { n: 'Common', g: ['#5b6168', '#aeb4bb', '#eef1f4', '#9aa0a7', '#5b6168'] }
  };
  const rarOf = (o, hof) => hof ? 'hof' : o >= 80 ? 'leg' : o >= 70 ? 'epic' : o >= 60 ? 'rare' : 'com';
  function seasonLine(p) {
    const cur = p.stats && p.stats.rs && p.stats.rs.gp ? { s: L.season, rs: p.stats.rs, tid: p.team } : null;
    const h = cur || (p.hist || []).filter(x => x.rs && x.rs.gp).slice(-1)[0];
    if (!h) return { s: null, v: [0, 0, 0], gp: 0 };
    const r = h.rs, g = r.gp; return { s: h.s, v: [r.pts / g, (r.orb + r.drb) / g, r.ast / g], gp: g };
  }
  // the card's data: what this viewer can see (scouted ratings stay scouted)
  function cardData(p) {
    const t = p.team != null ? L.teams[p.team] : (p.hist || []).length ? L.teams[p.hist[p.hist.length - 1].tid] : null;
    const shown = stripTags(ovrTxt(p)), o = parseInt(shown, 10) || p.ovr, hof = !!(L.hof || []).some(h => h.pid === p.id);
    const sl = seasonLine(p), acc = {}; for (const a of p.awards || []) if (/MVP|Champion|Player of the Year|Rookie of the Year|Sixth Man|Most Improved/.test(a.a)) acc[a.a] = (acc[a.a] || 0) + 1;
    const aw = Object.entries(acc).sort((a, b) => b[1] - a[1]).slice(0, 2).map(([a, n]) => (n > 1 ? n + '× ' : '') + a.replace('Most Valuable Player', 'MVP').replace('Champion', 'Champ')).join(' · ');
    return { id: p.id, nat: p.nat, tid: t ? t.id : null, n: p.name, tc: t ? t.city + ' ' + t.name : p.retired ? 'Retired' : 'Free agent', ab: t ? t.abbr : 'FA', c1: t ? t.c1 : '#3a4740', c2: t ? t.c2 : '#9aa0a7',
      o: shown.replace(/[^0-9~?]/g, '') || String(o), ps: posLabel(p), a: p.age, num: p.num != null ? p.num : '', s: sl.s != null ? seasonName(sl.s) : '', st: sl.v.map(x => Math.round(x * 10) / 10), r: rarOf(o, hof), aw, lg: lgTag(), ret: p.retired ? 1 : 0 };
  }
  // root <svg> of a portrait / logo, placed at x, y, w, h inside the card
  function placeSvg(html, x, y, w, h) {
    const i = html.indexOf('<svg'), j = html.lastIndexOf('</svg>'); if (i < 0 || j < 0) return '';
    let s = html.slice(i, j + 6); const end = s.indexOf('>'); let head = s.slice(0, end);
    head = head.replace(/\s(width|height|x|y|style|class|preserveAspectRatio|xmlns:xlink|version)="[^"]*"/g, '');
    if (!/viewBox=/.test(head)) head += ' viewBox="0 0 400 600"';
    return head + ` x="${x}" y="${y}" width="${w}" height="${h}" preserveAspectRatio="xMidYMax meet"` + s.slice(end);
  }
  const silhouette = (c) => `<g transform="translate(125 150)" fill="${c}" opacity=".55"><circle cx="0" cy="-30" r="38"/><path d="M-70 82 Q-66 22 0 18 Q66 22 70 82 Z"/></g>`;
  let cardN = 0;
  function cardSvg(d, faceHtml, logoHtml) {
    const R = RAR[d.r] || RAR.com, u = 'c' + (++cardN), W = 250, H = 350;
    const nameSize = Math.min(21, Math.floor(220 / Math.max(6, d.n.length * 0.6)));
    const face = faceHtml ? placeSvg(faceHtml, 35, 44, 180, 196) : silhouette('#fff');
    const lg = logoHtml ? placeSvg(logoHtml, 186, 16, 46, 46).replace('preserveAspectRatio="xMidYMax meet"', '') : `<g><circle cx="209" cy="39" r="22" fill="${d.c2}" stroke="#fff" stroke-width="2"/><text x="209" y="44" text-anchor="middle" font-size="13" font-weight="900" fill="${d.c1}">${esc(d.ab)}</text></g>`;
    const stat = (i, k, x) => `<text x="${x}" y="308" text-anchor="middle" font-size="19" font-weight="900" fill="#fff">${(d.st[i] || 0).toFixed(1)}</text><text x="${x}" y="322" text-anchor="middle" font-size="8.5" font-weight="700" fill="#fff" opacity=".8" letter-spacing="1">${k}</text>`;
    const sparkle = d.r === 'leg' || d.r === 'hof' ? [[30, 120], [222, 150], [40, 210], [214, 230], [120, 60]].map(([x, y], i) => `<path class="p3-spk" style="animation-delay:${i * 0.4}s" d="M${x} ${y - 6} L${x + 1.6} ${y - 1.6} L${x + 6} ${y} L${x + 1.6} ${y + 1.6} L${x} ${y + 6} L${x - 1.6} ${y + 1.6} L${x - 6} ${y} L${x - 1.6} ${y - 1.6} Z" fill="#fff"/>`).join('') : '';
    return `<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" viewBox="0 0 ${W} ${H}" width="${W}" height="${H}" font-family="Inter,system-ui,sans-serif" role="img" aria-label="${esc(d.n)} player card, ${R.n}">
<defs><linearGradient id="${u}b" x1="0" y1="0" x2="1" y2="1">${R.g.map((c, i) => `<stop offset="${i / (R.g.length - 1)}" stop-color="${c}"/>`).join('')}</linearGradient>
<linearGradient id="${u}f" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${d.c1}"/><stop offset="1" stop-color="#0d0f12"/></linearGradient>
<linearGradient id="${u}s" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="${d.c2}" stop-opacity="0"/><stop offset=".5" stop-color="${d.c2}" stop-opacity=".45"/><stop offset="1" stop-color="${d.c2}" stop-opacity="0"/></linearGradient>
<clipPath id="${u}k"><rect x="9" y="9" width="232" height="332" rx="11"/></clipPath></defs>
<rect width="${W}" height="${H}" rx="16" fill="url(#${u}b)"/>
<rect x="9" y="9" width="232" height="332" rx="11" fill="url(#${u}f)"/>
<g clip-path="url(#${u}k)"><path d="M-20 200 L270 40 L270 90 L-20 250 Z" fill="url(#${u}s)"/><circle cx="125" cy="150" r="92" fill="#fff" opacity=".07"/>${face}
<rect x="9" y="236" width="232" height="105" fill="#0b0d10" opacity=".82"/><rect x="9" y="236" width="232" height="3" fill="${d.c2}"/></g>
<text x="22" y="52" font-size="38" font-weight="900" fill="#fff">${esc(d.o)}</text><text x="23" y="68" font-size="12" font-weight="800" fill="#fff" opacity=".9" letter-spacing="1">${esc(d.ps)}</text>
${lg}
<text x="125" y="${258 + nameSize / 3}" text-anchor="middle" font-size="${nameSize}" font-weight="900" fill="#fff">${esc(d.n)}</text>
<text x="125" y="281" text-anchor="middle" font-size="10" fill="#fff" opacity=".85">${esc(d.tc)}${d.num !== '' ? ' · #' + esc(d.num) : ''}${d.a ? ' · age ' + d.a : ''}</text>
${stat(0, 'PTS', 62)}${stat(1, 'REB', 125)}${stat(2, 'AST', 188)}
<text x="22" y="337" font-size="8" font-weight="800" fill="#fff" opacity=".9" letter-spacing="1.2">${esc(R.n.toUpperCase())}</text>
<text x="228" y="337" text-anchor="end" font-size="8" fill="#fff" opacity=".75">${esc(d.lg)} ${esc(d.s)}${d.aw ? ' · ' + esc(d.aw) : ''}</text>
${sparkle}</svg>`;
  }
  const cardOf = p => { const d = cardData(p); return { d, svg: cardSvg(d, portrait('p', p.id, p.nat, d.tid), d.tid != null ? logo(d.tid, 46) : '') }; };
  const cardBox = (d, svg, cls) => `<div class="p3-cardwrap rar-${d.r} ${cls || ''}"><div class="p3-card">${svg}</div></div>`;
  function svgToPng(svg, scale) {
    return new Promise((res, rej) => {
      const img = new Image(), url = URL.createObjectURL(new Blob([svg], { type: 'image/svg+xml' }));
      img.onload = () => { try { const c = document.createElement('canvas'); c.width = 250 * scale; c.height = 350 * scale; const g = c.getContext('2d'); g.drawImage(img, 0, 0, c.width, c.height); URL.revokeObjectURL(url); c.toBlob(b => b ? res(b) : rej(new Error('png')), 'image/png'); } catch (e) { rej(e); } };
      img.onerror = () => { URL.revokeObjectURL(url); rej(new Error('svg')); }; img.src = url;
    });
  }
  const fileName = d => `card-${d.n.toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
  function bindTilt(root) {
    const w = root.querySelector('.p3-cardwrap'); if (!w || noAnim()) return;
    w.onpointermove = e => { const r = w.getBoundingClientRect(), x = (e.clientX - r.left) / r.width - 0.5, y = (e.clientY - r.top) / r.height - 0.5; w.style.setProperty('--rx', (-y * 14).toFixed(1) + 'deg'); w.style.setProperty('--ry', (x * 18).toFixed(1) + 'deg'); w.style.setProperty('--gx', ((x + 0.5) * 100).toFixed(0) + '%'); };
    w.onpointerleave = () => { w.style.setProperty('--rx', '0deg'); w.style.setProperty('--ry', '0deg'); };
  }
  // card popup. list = ids to page through (a team's cards)
  function cardDialog(pid, list) {
    const p = L.players[pid]; if (!p) return;
    const { d, svg } = cardOf(p), i = list ? list.indexOf(pid) : -1;
    const nav = i >= 0 && list.length > 1 ? `<button class="sm" data-p3cn="${list[(i - 1 + list.length) % list.length]}" aria-label="Previous card">←</button><span class="muted">${i + 1} / ${list.length}</span><button class="sm" data-p3cn="${list[(i + 1) % list.length]}" aria-label="Next card">→</button>` : '';
    dialog(`<h2>Player card</h2><div class="p3-cardstage">${cardBox(d, svg, noAnim() ? '' : 'p3-flip')}</div>
      <div class="row p3-cardnav" style="justify-content:center;margin:8px 0">${nav}</div>
      <div class="row" style="justify-content:center;flex-wrap:wrap;gap:8px"><button class="primary" id="p3c-save">Save image</button><button id="p3c-share">Share</button><button id="p3c-link">Copy link</button><button data-player="${p.id}" class="lk-btn" id="p3c-open">Player page</button><button id="x-close">Close</button></div>
      <p class="muted" id="p3c-msg" style="text-align:center;min-height:18px;margin:8px 0 0"></p>`, 'p3-carddlg');
    sfx('page');
    const msg = t => { const m = $('#p3c-msg'); if (m) m.textContent = t; };
    $('#x-close').onclick = closeDialog;
    $('#p3c-open').onclick = () => { closeDialog(); };
    document.querySelectorAll('[data-p3cn]').forEach(b => b.onclick = () => cardDialog(+b.dataset.p3cn, list));
    $('#p3c-save').onclick = async () => { try { const r = await saveBlob(fileName(d), await svgToPng(svg, 3)); msg(r === 'saved' ? 'Card image saved.' : r === 'cancelled' ? 'Cancelled.' : 'Saving images is not available here.'); } catch (e) { msg('Could not make the image.'); } };
    $('#p3c-share').onclick = async () => { let r = null; try { r = await shareFile(fileName(d), await svgToPng(svg, 3), d.n, d.n + ' · ' + RAR[d.r].n + ' card'); } catch (e) { } if (r === 'shared') msg('Shared.'); else if (r === 'cancelled') msg(''); else { const ok = await copyText(cardLink(d)); msg(ok ? 'This device can’t share images, so the card link was copied instead.' : 'Sharing is not available here. Use Save image.'); } };
    $('#p3c-link').onclick = async () => { const ok = await copyText(cardLink(d)); msg(ok ? 'Link copied. Anyone who opens it sees this card.' : 'Copy failed. Link: ' + cardLink(d)); };
    bindTilt($('#modal'));
  }
  const cardLink = d => baseUrl() + '#card=' + b64e(Object.assign({}, d, { id: undefined }));
  // a shared card link opens a read-only card (works without the league)
  function openSharedCard(code) {
    let d; try { d = b64d(code); } catch (e) { return; }
    if (!d || !d.n) return;
    d.r = RAR[d.r] ? d.r : 'com'; d.st = (d.st || [0, 0, 0]).map(Number);
    const svg = cardSvg(d, '', '');
    const html = `<h2>Shared player card</h2><div class="p3-cardstage">${cardBox(d, svg, noAnim() ? '' : 'p3-flip')}</div><p class="muted" style="text-align:center">${esc(d.n)} · ${esc(d.tc)} · ${esc(RAR[d.r].n)}</p><div class="row" style="justify-content:center"><button class="primary" id="x-close">Close</button></div>`;
    if (typeof dialog === 'function' && document.getElementById('modal')) { dialog(html, 'p3-carddlg'); $('#x-close').onclick = closeDialog; bindTilt($('#modal')); }
  }
  function cardHashCheck() {
    const h = location.hash; if (!h.startsWith('#card=')) return false;
    const code = h.slice(6); history.replaceState(null, '', baseUrl() + (L && L.user != null ? '#myteam' : '#standings'));
    setTimeout(() => openSharedCard(code), 50); return true;
  }
  window.addEventListener('hashchange', () => { cardHashCheck(); });
  // Cards view: a team's binder
  P3V.cards = function () {
    const tid = ui.p3cardT != null && L.teams[ui.p3cardT] ? ui.p3cardT : L.user != null ? L.user : 0;
    const ps = rosterOf(L, L.teams[tid]).slice().sort((a, b) => (parseInt(stripTags(ovrTxt(b)), 10) || b.ovr) - (parseInt(stripTags(ovrTxt(a)), 10) || a.ovr));
    const cards = ps.map(p => ({ p, ...cardOf(p) }));
    const cnt = {}; for (const c of cards) cnt[c.d.r] = (cnt[c.d.r] || 0) + 1;
    const chips = ['hof', 'leg', 'epic', 'rare', 'com'].filter(k => cnt[k]).map(k => `<span class="p3-chip rar-${k}">${cnt[k]} ${RAR[k].n}</span>`).join('');
    const opts = L.teams.map(t => `<option value="${t.id}" ${t.id === tid ? 'selected' : ''}>${esc(t.city + ' ' + t.name)}${isUser(t.id) ? ' (you)' : ''}</option>`).join('');
    return `<section class="panel"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><h2 style="margin:0">Player cards</h2><label class="row" style="gap:6px">Team <select id="p3-cardteam" aria-label="Team">${opts}</select></label></div>
      <p class="muted" style="margin:6px 0 10px">Tap a card to flip it up, save it as an image or share it. Border = rarity (Common under 60, Rare 60+, Epic 70+, Legendary 80+, Hall of Fame).</p>
      <div class="row" style="gap:6px;flex-wrap:wrap;margin-bottom:12px">${chips}</div>
      <div class="p3-binder">${cards.map(c => `<button class="p3-slot" data-p3card="${c.p.id}" aria-label="${esc(c.p.name)} card">${cardBox(c.d, c.svg)}</button>`).join('')}</div></section>`;
  };
  document.addEventListener('change', e => { if (e.target && e.target.id === 'p3-cardteam') { ui.p3cardT = +e.target.value; render(); } });
  document.addEventListener('click', e => {
    const b = e.target.closest('[data-p3card]'); if (!b || !L) return;
    e.preventDefault(); e.stopPropagation();
    const pid = +b.dataset.p3card, p = L.players[pid]; if (!p) return;
    const list = b.closest('.p3-binder') ? [...document.querySelectorAll('.p3-binder [data-p3card]')].map(x => +x.dataset.p3card) : p.team != null ? rosterOf(L, L.teams[p.team]).map(x => x.id) : null;
    cardDialog(pid, list);
  }, true);

  // ---------- #12 trophy room + ceremonies ----------
  const AWK = [['mvp', 'MVP'], ['fmvp', 'Finals MVP'], ['dpoy', 'Defensive Player of the Year'], ['roy', 'Rookie of the Year'], ['smoy', 'Sixth Man of the Year'], ['mip', 'Most Improved Player'], ['clutch', 'Clutch Player of the Year']];
  const TRK = { mvp: 'mvp', fmvp: 'fmvp', dpoy: 'dpoy', roy: 'roy', smoy: 'smoy', mip: 'mip', clutch: 'clutch' };
  const pidOf = v => v == null ? null : typeof v === 'object' ? (v.pid != null ? v.pid : v.id) : v;
  function teamTrophies(tid) {
    const out = { titles: [], finals: [], aw: [], coy: [], eoy: [], all: 0 };
    for (const s of Object.keys(L.awards || {}).map(Number).sort((a, b) => a - b)) {
      const A = L.awards[s]; if (!A) continue;
      if (A.champion === tid) out.titles.push(s); else if (A.runnerUp === tid) out.finals.push(s);
      for (const [k, n] of AWK) { const pid = pidOf(A[k]); if (pid == null) continue; let t = null; try { t = awardTid(A, k, pid); } catch (e) { } if (t === tid) out.aw.push({ s, k, n, pid }); }
      if (A.coyTid === tid) out.coy.push(s);
      if (A.eoy && A.eoy.tid === tid) out.eoy.push(s);
      for (const k of ['all1', 'all2', 'all3']) for (const x of A[k] || []) { const pid = pidOf(x); try { if (pid != null && awardTid(A, k, pid) === tid) out.all++; } catch (e) { } }
    }
    return out;
  }
  function banner(t, s, kind) {
    return `<svg class="p3-banner ${kind}" viewBox="0 0 60 90" width="60" height="90" role="img" aria-label="${kind === 'champ' ? 'Champions' : 'Finals'} ${seasonName(s)}"><path d="M4 2 H56 V76 L30 88 L4 76 Z" fill="${t.c1}" stroke="${t.c2}" stroke-width="3"/><text x="30" y="24" text-anchor="middle" font-size="9" font-weight="900" fill="${t.c2}" font-family="Inter,sans-serif">${kind === 'champ' ? 'WORLD' : 'CONF'}</text><text x="30" y="36" text-anchor="middle" font-size="9" font-weight="900" fill="${t.c2}" font-family="Inter,sans-serif">${kind === 'champ' ? 'CHAMPS' : 'CHAMPS'}</text>${kind === 'champ' ? '<path d="M22 44 h16 v6 q0 8 -8 9 q-8 -1 -8 -9z M28 59 h4 v6 h4 v3 h-12 v-3 h4z" fill="#ffd34d"/>' : '<circle cx="30" cy="52" r="7" fill="none" stroke="#fff" stroke-width="2"/>'}<text x="30" y="80" text-anchor="middle" font-size="9" font-weight="800" fill="#fff" font-family="Inter,sans-serif">${seasonName(s)}</text></svg>`;
  }
  P3V.trophies = function () {
    const tid = ui.p3trT != null && L.teams[ui.p3trT] ? ui.p3trT : L.user != null ? L.user : (L.awards[L.season - 1] || {}).champion != null ? L.awards[L.season - 1].champion : 0;
    const t = L.teams[tid], T = teamTrophies(tid);
    const opts = L.teams.map(x => { const n = Object.values(L.awards || {}).filter(A => A && A.champion === x.id).length; return `<option value="${x.id}" ${x.id === tid ? 'selected' : ''}>${esc(x.city + ' ' + x.name)}${n ? ' · ' + n + '×' : ''}${isUser(x.id) ? ' (you)' : ''}</option>`; }).join('');
    const rafters = T.titles.length || T.finals.length ? `<div class="p3-rafters">${T.titles.map(s => banner(t, s, 'champ')).join('')}${T.finals.map(s => banner(t, s, 'fin')).join('')}</div>` : '<p class="muted">No banners yet. Win a title to hang the first one.</p>';
    const shelf = (items) => `<div class="p3-shelf">${items.join('')}</div>`;
    const cups = T.titles.map(s => `<figure class="p3-tr">${trophySvg('champ', 76, seasonName(s))}<figcaption>Champions<br><span class="muted">${seasonName(s)}</span></figcaption></figure>`);
    const indiv = T.aw.slice().reverse().map(x => { const p = L.players[x.pid]; return `<figure class="p3-tr">${trophySvg(TRK[x.k], 60, seasonName(x.s))}<figcaption>${esc(x.n)}<br>${p ? plink(p) : 'Former player'} <span class="muted">${seasonName(x.s)}</span></figcaption></figure>`; });
    const misc = [...T.coy.map(s => `<figure class="p3-tr">${trophySvg('coy', 56, seasonName(s))}<figcaption>Coach of the Year<br><span class="muted">${seasonName(s)}</span></figcaption></figure>`), ...T.eoy.map(s => `<figure class="p3-tr">${trophySvg('eoy', 56, seasonName(s))}<figcaption>Executive of the Year<br><span class="muted">${seasonName(s)}</span></figcaption></figure>`)];
    const jerseys = (t.retired || []).map(j => `<div class="p3-jersey" style="--c1:${t.c1};--c2:${t.c2}"><span class="n">${esc(j.num)}</span><span class="nm">${L.players[j.pid] ? plink(L.players[j.pid]) : esc(j.name)}</span></div>`).join('');
    const hof = (L.hof || []).filter(h => h.teams && h.teams.includes(tid));
    return `<section class="panel"><div class="row" style="justify-content:space-between;flex-wrap:wrap;gap:8px"><h2 style="margin:0">${logo(tid, 28)} Trophy room</h2><label class="row" style="gap:6px">Team <select id="p3-trteam" aria-label="Team">${opts}</select></label></div>
      <div class="p3-trsum"><div><span class="v" data-cu>${T.titles.length}</span><span class="k">Titles</span></div><div><span class="v" data-cu>${T.titles.length + T.finals.length}</span><span class="k">Finals</span></div><div><span class="v" data-cu>${T.aw.length}</span><span class="k">Player awards</span></div><div><span class="v" data-cu>${T.all}</span><span class="k">All-League picks</span></div><div><span class="v" data-cu>${hof.length}</span><span class="k">Hall of Famers</span></div></div>
      <h3>Banners in the rafters</h3>${rafters}
      ${cups.length ? `<h3>Championship trophies</h3>${shelf(cups)}` : ''}
      <h3>Player awards won here</h3>${indiv.length ? shelf(indiv) : '<p class="muted">None yet.</p>'}
      ${misc.length ? `<h3>Coach and front office</h3>${shelf(misc)}` : ''}
      ${jerseys ? `<h3>Retired numbers</h3><div class="p3-jerseys">${jerseys}</div>` : ''}
      ${hof.length ? `<h3>Hall of Famers</h3><p>${hof.map(h => L.players[h.pid] ? plink(L.players[h.pid]) : esc(h.name)).join(', ')}</p>` : ''}</section>`;
  };
  document.addEventListener('change', e => { if (e.target && e.target.id === 'p3-trteam') { ui.p3trT = +e.target.value; render(); } });

  // ceremony overlay (above popups). kind 'mvp' or 'title'. Click / Esc / Continue closes.
  let cerTimers = [];
  function closeCer() { const c = document.getElementById('p3-cer'); if (c) c.remove(); cerTimers.forEach(clearTimeout); cerTimers = []; try { if (window.FX) FX.music(ui.liveMode ? 'game' : 'menu'); } catch (e) { } }
  function ceremony(kind) {
    if (!fxS().cer || noAnim() || !L) return false;
    const A = L.awards[L.season]; if (!A) return false;
    let head, troph, who, line, tidC;
    if (kind === 'mvp') {
      const p = L.players[pidOf(A.mvp)]; if (!p) return false;
      let tid = null; try { tid = awardTid(A, 'mvp', p.id); } catch (e) { } tidC = tid;
      const r = p.stats && p.stats.rs && p.stats.rs.gp ? p.stats.rs : null;
      head = `${seasonName(L.season)} · Most Valuable Player`; troph = trophySvg('mvp', 150, seasonName(L.season));
      who = `${portrait('p', p.id, p.nat, tid, 'p3-cerface')}<div class="p3-cername">${esc(p.name)}</div><div class="p3-certeam">${tid != null ? logo(tid, 26) + ' ' + esc(tname(tid)) : ''}</div>`;
      line = r ? `${f1(r.pts / r.gp)} pts · ${f1((r.orb + r.drb) / r.gp)} reb · ${f1(r.ast / r.gp)} ast` : '';
    } else {
      const c = L.po && L.po.champion; if (c == null) return false; tidC = c;
      const fm = L.players[pidOf(A.fmvp)];
      head = `${seasonName(L.season)} · ${lgTag()} Champions`; troph = trophySvg('champ', 170, seasonName(L.season));
      who = `<div class="p3-cerlogo">${logo(c, 110)}</div><div class="p3-cername">${esc(tname(c))}</div>${banner(L.teams[c], L.season, 'champ').replace('class="p3-banner champ"', 'class="p3-banner champ p3-drop"')}`;
      line = fm ? `Finals MVP: ${esc(fm.name)}` : '';
    }
    const t = tidC != null ? L.teams[tidC] : null;
    closeCer();
    const el = document.createElement('div'); el.id = 'p3-cer'; el.className = 'p3-cer k-' + kind; el.setAttribute('role', 'dialog'); el.setAttribute('aria-label', head);
    if (t) { el.style.setProperty('--c1', t.c1); el.style.setProperty('--c2', t.c2); }
    el.innerHTML = `<div class="p3-beams" aria-hidden="true"><i></i><i></i><i></i></div><div class="p3-cerstage"><div class="p3-cerhead">${esc(head)}</div><div class="p3-certroph">${troph}</div><div class="p3-cerwho">${who}<div class="p3-cerline">${line}</div></div><button class="primary p3-cerbtn" id="p3-cerok">Continue</button></div>`;
    document.body.appendChild(el);
    el.addEventListener('click', e => { if (e.target.id === 'p3-cerok' || e.target === el) closeCer(); });
    try { if (window.FX) FX.music(null); } catch (e) { }
    sfx('drumroll');
    const m = mult();
    cerTimers.push(setTimeout(() => { el.classList.add('rev'); sfx('fanfare'); setTimeout(() => sfx('cheer'), 300); try { FX.confetti(kind === 'title'); } catch (e) { } }, 1700 * m));
    if (kind === 'title') cerTimers.push(setTimeout(() => { try { FX.confetti(true); sfx('cheer'); } catch (e) { } }, 3000 * m));
    setTimeout(() => { const b = document.getElementById('p3-cerok'); if (b) b.focus(); }, 50);
    return true;
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape' && document.getElementById('p3-cer')) { e.stopPropagation(); closeCer(); } }, true);
  // app.js calls ceremony(kind, true) when the season's popup first opens: show once per season
  const seen = {};
  function ceremonyOnce(kind) { const k = kind + L.season; if (seen[k]) return false; seen[k] = 1; return ceremony(kind); }

  // ---------- render hook: music mood ----------
  function afterRender() {
    try { if (window.FX) FX.music(ui.liveMode != null && ui.game === ui.liveMode ? 'game' : 'menu'); } catch (e) { }
  }
  setTimeout(cardHashCheck, 400);

  return { afterRender, cardData, cardSvg, cardDialog, cardLink, openSharedCard, ceremony: (k, once) => once ? ceremonyOnce(k) : ceremony(k), closeCer, teamTrophies, saveBlob, shareFile, copyText, b64e, b64d, svgToPng, rarOf };
} })();
window.P3 = P3;
