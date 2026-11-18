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

  // ---------- #7 save / share / import ----------
  const gzOK = () => typeof CompressionStream === 'function' && typeof DecompressionStream === 'function';
  async function gzip(text) { const s = new Blob([text]).stream().pipeThrough(new CompressionStream('gzip')); return new Blob([await new Response(s).arrayBuffer()], { type: 'application/gzip' }); }
  // a league file: plain JSON text, or gzip (starts 1f 8b). Returns the JSON text
  async function readLeagueFile(file) {
    const buf = new Uint8Array(await file.arrayBuffer());
    if (buf[0] === 0x1f && buf[1] === 0x8b) { if (!gzOK()) throw new Error('nogz'); const s = new Blob([buf]).stream().pipeThrough(new DecompressionStream('gzip')); return await new Response(s).text(); }
    return new TextDecoder().decode(buf);
  }
  const leagueText = () => { L.nextId = NEXT_ID; return JSON.stringify(L, (k, v) => k === '_used' ? undefined : v); };
  const leagueFileName = (ext) => `pbl-${(L.saveName || 'league').toLowerCase().replace(/[^a-z0-9]+/g, '-')}-y${L.season}.${ext}`;
  async function leagueBlob() { const t = leagueText(); if (gzOK()) { try { return { blob: await gzip(t), name: leagueFileName('pbl.gz'), raw: t.length }; } catch (e) { } } return { blob: new Blob([t], { type: 'application/json' }), name: leagueFileName('json'), raw: t.length }; }
  const mb = n => (n / 1048576).toFixed(n < 1048576 * 10 ? 1 : 0) + ' MB';
  async function exportLeague(msg) { const x = await leagueBlob(); const r = await saveBlob(x.name, x.blob); msg(r === 'saved' ? `Saved ${x.name} (${mb(x.blob.size)}, was ${mb(x.raw)} before packing).` : r === 'cancelled' ? 'Export cancelled.' : 'Saving files isn’t available here. Use Share or the plain export below.'); return r; }
  async function shareLeague(msg) { const x = await leagueBlob(); const r = await shareFile(x.name, x.blob, 'My basketball league', `${L.saveName || 'My league'} · ${seasonName(L.season)}`); if (r === 'shared') msg('Shared. Whoever gets the file opens it with Saves → Import league file.'); else if (r === 'cancelled') msg(''); else return exportLeague(msg); }
  // team link: a read-only sheet of your team (roster, record) anyone can open
  function teamLinkData(tid) {
    const t = L.teams[tid]; const ps = rosterOf(L, t).slice().sort((a, b) => b.ovr - a.ovr).slice(0, 13);
    return { v: 1, n: t.city + ' ' + t.name, ab: t.abbr, c1: t.c1, c2: t.c2, w: t.w, l: t.l, s: seasonName(L.season), lg: lgTag(), coach: t.coach ? t.coach.name : '', t: (Object.values(L.awards || {}).filter(A => A && A.champion === tid).length),
      p: ps.map(p => { const sl = seasonLine(p); return [p.name, posLabel(p), stripTags(ovrTxt(p)).replace(/[^0-9~?]/g, ''), p.age, Math.round(sl.v[0] * 10) / 10, Math.round(sl.v[1] * 10) / 10, Math.round(sl.v[2] * 10) / 10]; }) };
  }
  const teamLink = tid => baseUrl() + '#team=' + b64e(teamLinkData(tid));
  function openSharedTeam(code) {
    let d; try { d = b64d(code); } catch (e) { return; } if (!d || !d.n || !Array.isArray(d.p)) return;
    dialog(`<div class="p3-tsheet" style="--c1:${esc(d.c1)};--c2:${esc(d.c2)}"><div class="p3-tshead"><span class="p3-tsab">${esc(d.ab)}</span><div><h2 style="margin:0">${esc(d.n)}</h2><div>${esc(d.lg)} ${esc(d.s)} · ${d.w}-${d.l}${d.t ? ' · ' + d.t + '× champions' : ''}${d.coach ? ' · Coach ' + esc(d.coach) : ''}</div></div></div>
      <div class="tblwrap"><table><thead><tr><th class="l">Player</th><th class="l">Pos</th><th>Ovr</th><th>Age</th><th>Pts</th><th>Reb</th><th>Ast</th></tr></thead><tbody>${d.p.map(r => `<tr><td class="l">${esc(r[0])}</td><td class="l">${esc(r[1])}</td><td><strong>${esc(r[2])}</strong></td><td>${r[3]}</td><td>${Number(r[4]).toFixed(1)}</td><td>${Number(r[5]).toFixed(1)}</td><td>${Number(r[6]).toFixed(1)}</td></tr>`).join('')}</tbody></table></div>
      <p class="muted" style="font-size:12px">A shared team sheet (read-only). It doesn't change your league.</p></div><div class="row"><button class="primary" id="x-close">Close</button></div>`, 'p3-teamdlg');
    $('#x-close').onclick = closeDialog;
  }
  // extra rows in the Saves popup (app.js calls this after drawing it)
  function savesExtra() {
    const box = document.getElementById('x-p3'); if (!box || !L) return;
    box.innerHTML = `<div class="row" style="flex-wrap:wrap;gap:8px"><button id="x-p3exp">Save league file (small)</button><button id="x-p3share">Share league file</button>${L.user != null ? '<button id="x-p3team">Copy my team link</button>' : ''}</div>`;
    const msg = t => { const m = document.getElementById('x-msg'); if (m) m.textContent = t; };
    $('#x-p3exp').onclick = () => exportLeague(msg); $('#x-p3share').onclick = () => shareLeague(msg);
    const tb = $('#x-p3team'); if (tb) tb.onclick = async () => { const u = teamLink(L.user); const ok = await copyText(u); msg(ok ? 'Team link copied. It opens a read-only sheet of your roster.' : 'Copy failed. Link: ' + u); };
  }
  function hashCheck() {
    const h = location.hash;
    if (h.startsWith('#team=')) { const code = h.slice(6); history.replaceState(null, '', baseUrl() + (L && L.user != null ? '#myteam' : '#standings')); setTimeout(() => openSharedTeam(code), 50); return true; }
    return cardHashCheck();
  }
  window.addEventListener('hashchange', () => { if (location.hash.startsWith('#team=')) hashCheck(); });

  // ---------- #11 draft night show ----------
  let dseen = null, dqueue = [], dplaying = false, dskip = false, dclock = null, dclockKey = null;
  const drafted = () => Object.values(L.players).filter(p => p.draft && p.draft.s === L.season && !p.p3undrafted);
  function draftWatch() {
    if (!L || L.user === undefined) return;
    const live = L.phase === 'off-draft' || (L.phase === 'off-resign' && dseen && dseen.s === L.season);
    if (!live) { dseen = { s: L.season, ids: null }; return; }
    const now = drafted();
    if (!dseen || dseen.s !== L.season || !dseen.ids) { dseen = { s: L.season, ids: new Set(now.map(p => p.id)) }; return; }
    const fresh = now.filter(p => !dseen.ids.has(p.id)).sort((a, b) => (a.draft.rd - b.draft.rd) * 100 + a.draft.no - b.draft.no);
    fresh.forEach(p => dseen.ids.add(p.id));
    if (!fresh.length || !fxS().draftShow || noAnim()) return;
    // one pick: show it. Many (sim to my pick / sim draft): lottery picks + yours, max 8
    const pick = fresh.length === 1 ? fresh : fresh.filter(p => (p.draft.rd === 1 && p.draft.no <= 5) || isUser(p.draft.tid) || (p.draft.rd === 1 && p.draft.no <= 14 && fresh.length <= 14)).slice(0, 8);
    dqueue.push(...pick); dskip = false; if (!dplaying) draftNext();
  }
  function draftNext() {
    const old = document.getElementById('p3-draft'); if (old) old.remove();
    if (dskip || !dqueue.length) { dplaying = false; dqueue = []; musicMood(); return; }
    dplaying = true; const p = dqueue.shift(), d = p.draft, t = L.teams[d.tid], mine = isUser(d.tid);
    const cons = d.mock || 0, diff = cons ? cons - ((d.rd - 1) * 30 + d.no) : 0;
    const react = mine ? ['Your pick!', 'cheer', 'mine'] : diff >= 6 ? ['Steal of the draft?', 'cheer', 'steal'] : diff <= -8 ? ['A reach! The crowd boos.', 'boo', 'reach'] : ['Solid pick.', 'cheer', 'ok'];
    const { d: cd, svg } = cardOf(p);
    const el = document.createElement('div'); el.id = 'p3-draft'; el.className = 'p3-draft r-' + react[2]; el.style.setProperty('--c1', t.c1); el.style.setProperty('--c2', t.c2);
    el.innerHTML = `<div class="p3-dpod"><div class="p3-dhead">${draftLabel(d.s)} draft · Round ${d.rd}, pick ${d.no}</div><div class="p3-dwith">With the ${ordinal((d.rd - 1) * 30 + d.no)} pick, the <strong>${esc(tname(t.id))}</strong> select…</div>
      <div class="p3-dcard">${cardBox(cd, svg)}</div><div class="p3-dname">${esc(p.name)}</div><div class="p3-dsub">${esc(posLabel(p))} · age ${p.age}${cons ? ` · consensus #${cons}` : ''}</div><div class="p3-dreact">${react[0]}</div>
      <div class="row" style="justify-content:center;gap:8px;margin-top:10px"><button class="primary" id="p3-dnext">${dqueue.length ? 'Next pick' : 'Done'}</button>${dqueue.length ? `<button id="p3-dskip">Skip show (${dqueue.length} more)</button>` : ''}</div></div>`;
    document.body.appendChild(el);
    sfx('drumroll');
    const m = mult(); let auto = setTimeout(() => { el.classList.add('rev'); sfx('reveal'); setTimeout(() => sfx(react[1]), 250); if (mine) try { FX.confetti(false); } catch (e) { } auto = setTimeout(draftNext, 2600 * m + (mine ? 1500 : 0)); }, 1500 * m);
    el.querySelector('#p3-dnext').onclick = () => { clearTimeout(auto); draftNext(); };
    const sk = el.querySelector('#p3-dskip'); if (sk) sk.onclick = () => { clearTimeout(auto); dskip = true; draftNext(); };
  }
  const ordinal = n => n + (n % 100 >= 11 && n % 100 <= 13 ? 'th' : ['th', 'st', 'nd', 'rd'][n % 10] || 'th');
  // pick clock on the Draft page when you are on the clock
  function draftClock() {
    const s = L && L.phase === 'off-draft' && L.draftOrder ? L.draftOrder[L.draftIdx] : null, on = s && isUser(s.owner) && ui.view === 'draft' && ui.player == null && ui.game == null;
    const key = on ? L.season + ':' + L.draftIdx : null;
    if (!on) { if (dclock) { clearInterval(dclock.t); dclock = null; } dclockKey = null; return; }
    if (dclockKey !== key) { if (dclock) clearInterval(dclock.t); dclockKey = key; dclock = { left: 120, t: null }; dclock.t = setInterval(clockTick, 1000); }
    const main = document.getElementById('main'); if (!main) return;
    let el = document.getElementById('p3-clock'); if (!el) { el = document.createElement('div'); el.id = 'p3-clock'; el.className = 'p3-clock'; main.prepend(el); }
    clockDraw();
  }
  function clockDraw() {
    const el = document.getElementById('p3-clock'); if (!el || !dclock) return;
    const s = dclock.left, auto = fxS().draftTimer;
    el.classList.toggle('low', s <= 20);
    el.innerHTML = `<span class="p3-clk">${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}</span><span><strong>You're on the clock</strong> · pick #${L.draftIdx + 1}. ${auto ? 'At 0:00 your scouting director picks for you.' : 'Take your time: the clock is just for fun (turn on auto-pick in Settings).'}</span>`;
  }
  function clockTick() {
    if (!dclock) return; if (document.hidden) return;
    dclock.left = Math.max(0, dclock.left - 1);
    if (dclock.left <= 10 && dclock.left > 0) sfx('tick');
    clockDraw();
    if (dclock.left === 0) { clearInterval(dclock.t); if (fxS().draftTimer) { const b = document.querySelector('#simctl [data-sim="autopick"]'); if (b && !b.disabled) { sfx('buzzer'); b.click(); } } }
  }

  // ---------- #8 story events ----------
  // illustrated scenes (240 x 120), team colors c1 / c2
  function art(kind, c1, c2, extra) {
    c1 = c1 || '#2a6ae0'; c2 = c2 || '#f2d14b';
    const bg = (a, b) => `<defs><linearGradient id="ag${kind}" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="${a}"/><stop offset="1" stop-color="${b}"/></linearGradient></defs><rect width="240" height="120" fill="url(#ag${kind})"/>`;
    const S = {
      injury: `${bg('#2b3440', '#0f141a')}<rect x="20" y="78" width="200" height="12" rx="6" fill="#e9eef2" opacity=".9"/><rect x="34" y="90" width="6" height="18" fill="#aab4bd"/><rect x="200" y="90" width="6" height="18" fill="#aab4bd"/><circle cx="60" cy="68" r="12" fill="#f0c9a0"/><rect x="72" y="62" width="110" height="16" rx="8" fill="${c1}"/><rect x="150" y="60" width="30" height="20" rx="6" fill="#fff"/><path d="M150 64 H180 M150 70 H180 M150 76 H180" stroke="#cfd6dc" stroke-width="2"/><g transform="translate(200 38)"><circle r="17" fill="#d93a3a"/><rect x="-4" y="-11" width="8" height="22" fill="#fff"/><rect x="-11" y="-4" width="22" height="8" fill="#fff"/></g>`,
      rivalry: `${bg(c1, '#111')}<path d="M120 0 L240 0 L240 120 L100 120 Z" fill="${extra || '#7a1f1f'}" opacity=".9"/><path d="M128 14 L104 62 L122 62 L108 106 L146 50 L126 50 L142 14 Z" fill="#ffd34d" stroke="#fff" stroke-width="2"/><circle cx="58" cy="60" r="30" fill="${c2}" opacity=".9"/><circle cx="184" cy="60" r="30" fill="#fff" opacity=".85"/><text x="58" y="66" text-anchor="middle" font-size="18" font-weight="900" fill="${c1}" font-family="Inter,sans-serif">VS</text>`,
      presser: `${bg('#1b2230', '#2c3a52')}<rect x="0" y="0" width="240" height="70" fill="${c1}" opacity=".35"/>${[30, 70, 110, 150, 190].map((x, i) => `<g fill="${i % 2 ? c2 : '#fff'}" opacity=".25"><circle cx="${x + 10}" cy="20" r="6"/></g>`).join('')}<rect x="85" y="64" width="70" height="50" rx="4" fill="#3b4656"/><rect x="85" y="64" width="70" height="10" fill="${c2}"/>${[100, 114, 128, 142].map((x, i) => `<g><rect x="${x}" y="${44 - i % 2 * 4}" width="5" height="22" fill="#222"/><ellipse cx="${x + 2.5}" cy="${42 - i % 2 * 4}" rx="5" ry="7" fill="${['#c33', '#36c', '#333', '#2a8'][i]}"/></g>`).join('')}<g class="p3-flash"><circle cx="30" cy="40" r="10" fill="#fff"/><circle cx="210" cy="30" r="8" fill="#fff"/></g>`,
      hot: `${bg('#3a1004', '#a83a0c')}<circle cx="120" cy="70" r="30" fill="#e8742a"/><path d="M90 70 H150 M120 40 V100 M98 48 Q120 70 98 92 M142 48 Q120 70 142 92" stroke="#3b1a08" stroke-width="2.5" fill="none"/><path d="M84 66 Q78 30 102 14 Q100 36 114 34 Q112 10 136 4 Q132 30 150 32 Q158 20 156 8 Q178 34 158 66" fill="#ffb02e" opacity=".85"/><path d="M98 60 Q96 38 112 30 Q114 44 124 42 Q126 26 140 22 Q138 42 146 58" fill="#ffe27a" opacity=".9"/>`,
      cold: `${bg('#0b2a44', '#2a6fa3')}<circle cx="120" cy="62" r="30" fill="#9cc7e6"/><path d="M90 62 H150 M120 32 V92 M98 40 Q120 62 98 84 M142 40 Q120 62 142 84" stroke="#2a4f6e" stroke-width="2.5" fill="none"/>${[[40, 30], [200, 40], [60, 96], [186, 92]].map(([x, y]) => `<g stroke="#fff" stroke-width="2" opacity=".8"><path d="M${x - 8} ${y} H${x + 8} M${x} ${y - 8} V${y + 8} M${x - 6} ${y - 6} L${x + 6} ${y + 6} M${x + 6} ${y - 6} L${x - 6} ${y + 6}"/></g>`).join('')}`,
      trade: (() => { const [a, b] = String(extra || '').split('|'), ta = L.teams.find(t => t.abbr === a), tb = L.teams.find(t => t.abbr === b), J = (x, t, ab) => `<g transform="translate(${x} 28) scale(.85)"><path d="M10 0 L26 0 Q30 8 40 8 Q50 8 54 0 L70 0 L80 18 L68 24 L68 70 L12 70 L12 24 L0 18 Z" fill="${t ? t.c1 : '#e9eef2'}" stroke="${t ? t.c2 : '#999'}" stroke-width="2.5"/><text x="40" y="52" text-anchor="middle" font-size="19" font-weight="900" fill="${t ? t.c2 : '#333'}" font-family="Inter,sans-serif">${esc(ab || '?')}</text></g>`;
        return `${bg('#1d2a24', '#33473d')}${J(22, ta, a)}${J(150, tb, b)}<path d="M100 50 H140 L132 42 M140 50 L132 58 M140 74 H100 L108 66 M100 74 L108 82" stroke="#ffd34d" stroke-width="4" fill="none" stroke-linecap="round"/>`; })(),
      drama: `${bg('#2a2f36', '#14171b')}${[20, 64, 108, 152, 196].map((x, i) => `<g><rect x="${x}" y="34" width="38" height="80" fill="${i === 2 ? c1 : '#4b5562'}"/><rect x="${x + 4}" y="40" width="30" height="4" fill="#222" opacity=".5"/><rect x="${x + 4}" y="48" width="30" height="4" fill="#222" opacity=".5"/><circle cx="${x + 30}" cy="80" r="2" fill="#ccc"/></g>`).join('')}<g fill="#5b6470"><ellipse cx="120" cy="34" rx="44" ry="13"/><ellipse cx="96" cy="30" rx="20" ry="11"/><ellipse cx="146" cy="30" rx="22" ry="11"/></g><path d="M118 42 L108 56 L118 56 L110 72" stroke="#ffd34d" stroke-width="3" fill="none"/>`,
      milestone: `${bg(c1, '#111')}${Array.from({ length: 12 }, (_, i) => `<path d="M120 60 L${120 + 140 * Math.cos(i * Math.PI / 6)} ${60 + 140 * Math.sin(i * Math.PI / 6)} L${120 + 140 * Math.cos(i * Math.PI / 6 + 0.18)} ${60 + 140 * Math.sin(i * Math.PI / 6 + 0.18)} Z" fill="#fff" opacity=".08"/>`).join('')}<path d="M120 22 L130 48 L158 48 L136 64 L144 92 L120 76 L96 92 L104 64 L82 48 L110 48 Z" fill="${c2}" stroke="#fff" stroke-width="2"/><text x="120" y="112" text-anchor="middle" font-size="12" font-weight="900" fill="#fff" font-family="Inter,sans-serif">${esc(extra || 'MILESTONE')}</text>`,
      feat: `${bg('#121826', c1)}<path d="M0 100 Q120 60 240 100 L240 120 L0 120 Z" fill="#c98b4a" opacity=".6"/><circle cx="150" cy="40" r="16" fill="#e8742a"/><path d="M134 40 H166 M150 24 V56" stroke="#3b1a08" stroke-width="2"/><path d="M40 100 Q80 20 150 40" stroke="#fff" stroke-width="2" stroke-dasharray="4 5" fill="none" opacity=".7"/><text x="30" y="40" font-size="22" font-weight="900" fill="${c2}" font-family="Inter,sans-serif">${esc(extra || 'BIG NIGHT')}</text>`,
      fight: `${bg('#3a0d0d', '#111')}<path d="M70 70 L100 40 L110 60 L140 30 L130 66 L170 52 L130 90 Z" fill="#ffd34d" opacity=".9"/><text x="120" y="108" text-anchor="middle" font-size="14" font-weight="900" fill="#fff" font-family="Inter,sans-serif">BENCHES CLEAR</text>`,
      award: `${bg('#2b2205', '#6b5410')}<path d="M100 20 h40 v14 q0 22 -20 24 q-20 -2 -20 -24z M116 58 h8 v14 h12 v8 h-32 v-8 h12z" fill="#ffd34d" stroke="#fff3b0" stroke-width="2"/><path d="M100 26 q-14 0 -14 10 q0 10 14 12 M140 26 q14 0 14 10 q0 10 -14 12" stroke="#ffd34d" stroke-width="4" fill="none"/>${Array.from({ length: 14 }, (_, i) => `<rect x="${(i * 37) % 240}" y="${(i * 23) % 110}" width="5" height="3" fill="${['#f08a52', '#3c8cf0', '#1f8a4c', '#fff'][i % 4]}" transform="rotate(${i * 25} ${(i * 37) % 240} ${(i * 23) % 110})"/>`).join('')}`,
      story: `${bg('#e9e4d8', '#cfc6b2')}<rect x="30" y="14" width="180" height="96" fill="#fbf8f1" stroke="#9b917c"/><rect x="40" y="22" width="160" height="14" fill="#222"/><text x="120" y="33" text-anchor="middle" font-size="10" font-weight="900" fill="#fff" font-family="Georgia,serif">${esc(extra || 'THE DAILY HOOP')}</text><rect x="40" y="42" width="70" height="44" fill="${c1}" opacity=".8"/>${[44, 52, 60, 68, 76, 84].map(y => `<rect x="118" y="${y}" width="82" height="3" fill="#9b917c"/>`).join('')}${[92, 100].map(y => `<rect x="40" y="${y}" width="160" height="3" fill="#9b917c"/>`).join('')}`,
      draft: `${bg('#0c1830', '#24426e')}<rect x="80" y="60" width="80" height="54" fill="#33404f"/><rect x="80" y="60" width="80" height="10" fill="${c2}"/><circle cx="120" cy="38" r="14" fill="#f0c9a0"/><path d="M100 26 L120 16 L140 26 L120 34 Z" fill="${c1}"/>`
    };
    return `<svg class="p3-art" viewBox="0 0 240 120" preserveAspectRatio="xMidYMid slice" role="img" aria-label="${kind} illustration">${S[kind] || S.story}</svg>`;
  }
  const userAbbr = () => L.user != null ? L.teams[L.user].abbr : '#';
  const mineLog = x => L.user != null && (x.tid === L.user || new RegExp('\\b' + userAbbr() + '\\b').test(x.text) || x.text.includes(L.teams[L.user].name));
  // a log entry -> a story (or null)
  function storyOf(x) {
    const tx = x.text || '', mine = mineLog(x);
    let k = null, title = '', imp = 0, extra = '';
    if (x.cat === 'inj') { const g = +((tx.match(/(?:out|miss) (\d+) games?/) || [])[1] || 0); if (!mine && g < 25) return null; k = 'injury'; title = g >= 25 ? 'Major injury' : 'Injury report'; imp = mine ? 5 + Math.min(4, g / 10) : 3; }
    else if (x.cat === 'trade' && !/pending your review/i.test(tx)) { k = 'trade'; title = 'Trade'; imp = mine ? 8 : 2; const ab = new Set(L.teams.map(t => t.abbr)), m = [...new Set((tx.match(/\b[A-Z]{2,3}\b/g) || []).filter(x => ab.has(x)))]; extra = m.slice(0, 2).join('|'); }
    else if (x.cat === 'team' && x.k === 'drama') { k = 'drama'; title = 'Locker room'; imp = mine ? 6 : 1; }
    else if (x.k === 'streak') { k = /los|skid|slump|dropped/i.test(tx) ? 'cold' : 'hot'; title = k === 'hot' ? 'Hot streak' : 'Cold spell'; imp = mine ? 5 : 1; }
    else if (/rival/i.test(tx)) { k = 'rivalry'; title = 'Rivalry'; imp = mine ? 5 : 2; }
    else if (x.k === 'milestone') { k = 'milestone'; title = 'Milestone'; imp = mine ? 6 : 2; const m = tx.match(/[\d,]{5,}/); extra = m ? m[0] + ' PTS' : ''; }
    else if (x.cat === 'award' && /championship/i.test(tx)) { k = 'award'; title = 'Champions'; imp = 9; }
    else if (x.cat === 'award' && x.k !== 'pipe') { k = 'award'; title = 'Award'; imp = mine ? 6 : 2; }
    else if (x.cat === 'league' && x.k === 'disc' || /benches cleared/i.test(tx)) { k = 'fight'; title = 'Scuffle'; imp = mine ? 5 : 1; }
    else if (x.cat === 'feat') { if (!mine) return null; k = 'feat'; title = 'Big night'; imp = 3; const m = tx.match(/Triple-double|Quadruple-double|\d+ (?:points|threes|assists|rebounds|blocks|steals)/i); extra = m ? m[0].toUpperCase() : ''; }
    else if (x.cat === 'story') { k = 'story'; title = 'Storyline'; imp = mine ? 4 : 1; }
    else if (x.cat === 'draft' && x.k !== 'pipe' && mine) { k = 'draft'; title = 'Draft'; imp = 3; }
    if (!k) return null;
    const t = x.tid != null && L.teams[x.tid] ? L.teams[x.tid] : mine ? L.teams[L.user] : null;
    return { n: x.n, k, title, text: tx, imp, mine, s: x.season, day: x.day, ph: x.phase, c1: t ? t.c1 : null, c2: t ? t.c2 : null, extra, tid: t ? t.id : null };
  }
  let logSeen = null, toastQ = [], toastOn = false;
  function storyWatch() {
    if (!L || !L.log) return;
    const top = L.logN || 0;
    if (logSeen == null || logSeen.L !== L) { logSeen = { L, n: top }; return; }
    if (top <= logSeen.n) return;
    const fresh = L.log.filter(x => x.n > logSeen.n); logSeen.n = top;
    if (!fxS().stories || L.user == null) return;
    const st = fresh.map(storyOf).filter(s => s && (s.mine || s.imp >= 9)).sort((a, b) => b.imp - a.imp).slice(0, 2);
    if (!st.length) return;
    toastQ.push(...st); if (!toastOn) toastNext();
  }
  function toastNext() {
    const old = document.getElementById('p3-story'); if (old) old.remove();
    const s = toastQ.shift(); if (!s) { toastOn = false; return; } toastOn = true;
    const el = document.createElement('div'); el.id = 'p3-story'; el.className = 'p3-story'; el.setAttribute('role', 'status');
    el.innerHTML = `${art(s.k, s.c1, s.c2, s.extra)}<div class="p3-stbody"><div class="p3-stk">${esc(s.title)}${toastQ.length ? ` <span class="muted">· ${toastQ.length} more</span>` : ''}</div><div class="p3-stx">${esc(s.text)}</div><div class="row" style="gap:6px;margin-top:6px"><button class="sm" id="p3-stall">All stories</button><button class="sm" id="p3-stx" aria-label="Close story">${toastQ.length ? 'Next' : 'Close'}</button></div></div>`;
    document.body.appendChild(el); sfx('page');
    let tm = setTimeout(toastNext, 9000 * Math.max(1, mult()));
    el.querySelector('#p3-stx').onclick = () => { clearTimeout(tm); toastNext(); };
    el.querySelector('#p3-stall').onclick = () => { clearTimeout(tm); toastQ = []; toastNext(); location.hash = '#stories'; };
  }
  P3V.stories = function () {
    const f = ui.p3stF || (L.user != null ? 'mine' : 'all');
    const all = L.log.slice(0, 600).map(storyOf).filter(Boolean).filter(s => f === 'all' ? s.imp >= 2 || s.mine : s.mine).slice(0, 36);
    const when = s => `${seasonName(s.s)} · ${s.ph === 'regular' && s.day != null ? 'Day ' + (s.day + 1) : s.ph === 'playoffs' ? 'Playoffs' : 'Offseason'}`;
    const tabs = (L.user != null ? [['mine', 'Your team'], ['all', 'Whole league']] : [['all', 'Whole league']]).map(([k, n]) => `<button class="sm ${k === f ? 'primary' : ''}" data-p3stf="${k}">${n}</button>`).join('');
    return `<section class="panel"><h2>Stories</h2><p class="muted" style="margin-top:-4px">The big moments, illustrated: injuries, rivalries, streaks, trades, milestones, locker room drama. Turn the popups on or off in Settings.</p><div class="subtabs">${tabs}</div>
      ${all.length ? `<div class="p3-stories">${all.map(s => `<article class="p3-stcard${s.imp >= 6 ? ' p3-big' : ''}">${art(s.k, s.c1, s.c2, s.extra)}<div class="p3-stbody"><div class="p3-stk">${esc(s.title)}${s.tid != null ? ' · ' + esc(L.teams[s.tid].abbr) : ''}</div><div class="p3-stx">${esc(s.text)}</div><div class="muted" style="font-size:12px;margin-top:4px">${when(s)}</div></div></article>`).join('')}</div>` : '<p class="muted">No stories yet. Sim some games.</p>'}</section>`;
  };
  document.addEventListener('click', e => { const b = e.target.closest('[data-p3stf]'); if (b) { ui.p3stF = b.dataset.p3stf; render(); } });
  // art on top of the press conference, locker room, interview, meeting, holdout and rivalry-night popups (app.js calls this after each popup opens)
  const DLG_ART = [[/^Press conference/, 'presser'], [/^Locker room/, 'drama'], [/^Media interview/, 'presser'], [/^One-on-one/, 'drama'], [/^Holdout/, 'drama'], [/^Tonight:/, 'rivalry']];
  function dialogArt() {
    const h = document.querySelector('#modal .dialog h2'); if (!h || !L || h.parentElement.querySelector('.p3-dlgart')) return;
    const m = DLG_ART.find(([r]) => r.test(h.textContent.trim())); if (!m) return;
    const t = L.user != null ? L.teams[L.user] : null; const w = document.createElement('div'); w.className = 'p3-dlgart'; w.innerHTML = art(m[1], t && t.c1, t && t.c2, ''); h.parentElement.insertBefore(w, h);
  }

  // ---------- render hook: music mood, draft show, stories ----------
  function musicMood() { try { if (window.FX) FX.music(ui.liveMode != null && ui.game === ui.liveMode ? 'game' : document.getElementById('p3-draft') ? 'game' : 'menu'); } catch (e) { } }
  function afterRender() {
    try { draftWatch(); draftClock(); } catch (e) { console.error(e); }
    musicMood();
    try { storyWatch(); } catch (e) { console.error(e); }
  }
  setTimeout(hashCheck, 400);

  return { get _clock() { return dclock; }, afterRender, savesExtra, dialogArt, readLeagueFile, leagueBlob, teamLink, teamLinkData, openSharedTeam, storyOf, art, draftWatch, cardData, cardSvg, cardDialog, cardLink, openSharedCard, ceremony: (k, once) => once ? ceremonyOnce(k) : ceremony(k), closeCer, teamTrophies, saveBlob, shareFile, copyText, b64e, b64d, svgToPng, rarOf };
} })();
window.P3 = P3;
