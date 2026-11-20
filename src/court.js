// Phase 2 (Nov 18 2026): animated top-down court for live games and the top-plays reel.
// Draws on a <canvas>: ten dots (team colors, jersey numbers) move, pass and shoot for each play-by-play entry.
// The engine stores what happened (who shot, from which zone, assist, block, rebound, steal), not where everyone stood,
// so positions are a believable picture built from that: a set formation around the basket, the shooter at a spot inside
// the real shot zone, the passer, the defender closing out, the ball's flight and where it ends up.
// app.js calls: COURT.live(g, n, ms) after each live tick, COURT.reel(canvas id, play) for a highlight, COURT.stop().
// Uses engine.js globals pbpReplay, shortName and window.__pblCourt (L, scSpot, scRng) from app.js.
(function () {
  const FT_W = 94, FT_H = 50, RIM_IN = 5.25;
  const ease = t => t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
  const clamp = (v, a, b) => Math.max(a, Math.min(b, v));
  const fx = () => (window.FX && FX.settings) || {};
  const CX = () => window.__pblCourt || {};   // app.js keeps L and the chart helpers inside its closure and lends them here
  // keyframes: [[t, x, y, z?], ...] sorted by t; z = ball height in feet
  function at(kf, t) {
    if (!kf || !kf.length) return null;
    const rest = k => [t, k[1], k[2], k[3] || 0, null, 0];
    if (t <= kf[0][0]) return rest(kf[0]);
    for (let i = 1; i < kf.length; i++) {
      const b = kf[i]; if (t > b[0]) continue;
      const a = kf[i - 1], k = b[0] > a[0] ? (t - a[0]) / (b[0] - a[0]) : 1, e = b[4] === 'lin' ? k : ease(k);
      return [t, a[1] + (b[1] - a[1]) * e, a[2] + (b[2] - a[2]) * e, (a[3] || 0) + ((b[3] || 0) - (a[3] || 0)) * (b[4] === 'arc' ? k : e), b[4], b[5] != null ? b[5] * Math.sin(Math.PI * k) : 0];
    }
    return rest(kf[kf.length - 1]);
  }
  // a spot in shot zone z (half-court chart coordinates, 10 units = 1 foot, basket at x 250, y 52) -> court feet
  function toCourt(sx, sy, right) { return right ? [FT_W - sy / 10, sx / 10] : [sy / 10, FT_H - sx / 10]; }
  function zoneSpot(z, seed, right) {
    const r = CX().scRng ? CX().scRng(seed) : Math.random;
    const p = CX().scSpot ? CX().scSpot(clamp(z, 0, 13), r) : [250, 150];
    return toCourt(p[0], p[1], right);
  }
  const hoop = right => [right ? FT_W - RIM_IN : RIM_IN, 25];
  // offense spots by court slot (PG, SG, SF, PF, C) in half-court chart units; defense sits between his man and the basket
  const SPOTS = [[250, 285], [430, 175], [70, 175], [110, 75], [360, 115]];
  function formation(off5, def5, right, seed) {
    const r = CX().scRng ? CX().scRng(seed) : Math.random, B = hoop(right), o = {}, d = {};
    off5.forEach((id, k) => { const s = SPOTS[k] || SPOTS[0]; o[id] = toCourt(s[0] + (r() - 0.5) * 60, s[1] + (r() - 0.5) * 40, right); });
    def5.forEach((id, k) => { const m = o[off5[k]] || B; d[id] = [m[0] + (B[0] - m[0]) * 0.24 + (r() - 0.5) * 1.5, m[1] + (B[1] - m[1]) * 0.24 + (r() - 0.5) * 1.5]; });
    return { o, d };
  }
  // ---------- colors ----------
  function hexRgb(h) { const m = /^#?([0-9a-f]{6})$/i.exec(h || ''); if (!m) return [120, 120, 120]; const v = parseInt(m[1], 16); return [v >> 16, (v >> 8) & 255, v & 255]; }
  const lum = c => (0.299 * c[0] + 0.587 * c[1] + 0.114 * c[2]) / 255;
  const dist = (a, b) => Math.hypot(a[0] - b[0], a[1] - b[1], a[2] - b[2]);
  function teamCols(home, away) {
    const h = { fill: home.c1 || '#1f5fbf', line: home.c2 || '#ffffff' }, a = { fill: away.c1 || '#c8382e', line: away.c2 || '#ffffff' };
    if (dist(hexRgb(h.fill), hexRgb(a.fill)) < 110) { a.fill = '#ffffff'; a.line = away.c1 || '#c8382e'; }   // too alike: the away team wears white
    for (const t of [h, a]) t.ink = lum(hexRgb(t.fill)) > 0.6 ? '#111' : '#fff';
    return [h, a];
  }
  // ---------- drawing ----------
  // half = the right basket only, turned so the baseline is at the top (like the shot charts): 50 ft across, 34 ft deep
  const HALF_D = 34;
  function size(cv, half) {
    const w = Math.max(200, Math.round(cv.parentElement ? cv.parentElement.clientWidth : 600)), h = Math.round(w * (half ? HALF_D / FT_H : FT_H / FT_W));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
    return { w, h, dpr };
  }
  // v.P(x, y): court feet -> canvas pixels; v.s: pixels per foot
  function viewOf(cv, half) {
    const { w, h, dpr } = size(cv, half), s = (half ? w / FT_H : w / FT_W) * dpr;
    const P = half ? (x, y) => [y * s, (FT_W - x) * s] : (x, y) => [x * s, y * s];
    return { s, P, w, h, dpr, half };
  }
  function poly(g, pts, close) { g.beginPath(); pts.forEach((q, i) => i ? g.lineTo(q[0], q[1]) : g.moveTo(q[0], q[1])); if (close) g.closePath(); }
  function arcPts(v, cx, cy, r, a0, a1) { const n = 40, out = []; for (let i = 0; i <= n; i++) { const a = a0 + (a1 - a0) * i / n; out.push(v.P(cx + Math.cos(a) * r, cy + Math.sin(a) * r)); } return out; }
  function drawCourt(g, v, paint, label) {
    const P = v.P, S = v.s;
    g.fillStyle = '#d9b382'; g.fillRect(0, 0, v.w * v.dpr, v.h * v.dpr);
    g.strokeStyle = 'rgba(120,80,40,.10)'; g.lineWidth = 1;
    for (let y = 0; y <= FT_H; y += 2.5) { poly(g, [P(0, y), P(FT_W, y)]); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.92)'; g.lineWidth = Math.max(1.2, S * 0.17);
    const line = (x1, y1, x2, y2) => { poly(g, [P(x1, y1), P(x2, y2)]); g.stroke(); };
    const rect = (x1, y1, x2, y2, fill) => { poly(g, [P(x1, y1), P(x2, y1), P(x2, y2), P(x1, y2)], true); if (fill) { g.fillStyle = fill; g.fill(); } g.stroke(); };
    const arc = (cx, cy, r, a0, a1) => { poly(g, arcPts(v, cx, cy, r, a0, a1)); g.stroke(); };
    rect(0, 0, FT_W, FT_H); line(47, 0, 47, 50); arc(47, 25, 6, 0, Math.PI * 2);
    for (const right of [false, true]) {
      const bx = right ? FT_W - RIM_IN : RIM_IN, sg = right ? -1 : 1, base = right ? FT_W : 0;
      rect(base, 17, base + sg * 19, 33, paint);
      arc(base + sg * 19, 25, 6, right ? Math.PI / 2 : -Math.PI / 2, right ? Math.PI * 1.5 : Math.PI / 2);
      const cy = Math.sqrt(23.75 * 23.75 - 22 * 22), cx = bx + sg * cy, t = Math.atan2(22, cy);
      line(base, 3, cx, 3); line(base, 47, cx, 47);
      if (right) arc(bx, 25, 23.75, Math.PI - t, Math.PI + t); else arc(bx, 25, 23.75, -t, t);
      line(base + sg * 4, 22, base + sg * 4, 28);
      g.strokeStyle = '#e8562a'; arc(bx, 25, 0.75, 0, Math.PI * 2); g.strokeStyle = 'rgba(255,255,255,.92)';
    }
    if (label && !v.half) { const c = P(47, 25); g.fillStyle = 'rgba(255,255,255,.5)'; g.font = `700 ${Math.round(S * 3.2)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, c[0], c[1]); }
  }
  const dotR = v => Math.max(6 * v.dpr, v.s * (v.half ? 1.05 : 1.35));
  function drawDot(g, v, x, y, col, num, hi) {
    const c = v.P(x, y), r = dotR(v);
    if (hi) { g.beginPath(); g.arc(c[0], c[1], r * 1.55, 0, 7); g.fillStyle = 'rgba(255,230,90,.55)'; g.fill(); }
    g.beginPath(); g.arc(c[0] + r * 0.12, c[1] + r * 0.18, r, 0, 7); g.fillStyle = 'rgba(0,0,0,.22)'; g.fill();
    g.beginPath(); g.arc(c[0], c[1], r, 0, 7); g.fillStyle = col.fill; g.fill(); g.lineWidth = Math.max(1.5, r * 0.22); g.strokeStyle = col.line; g.stroke();
    if (num != null && num !== '') { g.fillStyle = col.ink; g.font = `700 ${Math.round(r * 1.05)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(num), c[0], c[1] + r * 0.05); }
  }
  function drawBall(g, v, x, y, z) {
    const S = v.s, c = v.P(x, y), r = Math.max(3.5 * v.dpr, S * (v.half ? 0.45 : 0.55) * (1 + z * 0.06));
    if (z > 0.3) { g.beginPath(); g.ellipse(c[0] + z * S * 0.08, c[1] + z * S * 0.12, r * 0.8, r * 0.5, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.25)'; g.fill(); }
    const cy = c[1] - z * S * 0.18;
    g.beginPath(); g.arc(c[0], cy, r, 0, 7); g.fillStyle = '#f07a24'; g.fill(); g.lineWidth = Math.max(1, r * 0.22); g.strokeStyle = '#7a3208'; g.stroke();
    g.beginPath(); g.moveTo(c[0] - r, cy); g.lineTo(c[0] + r, cy); g.stroke();
  }
  function drawTag(g, v, x, y, text, col) {
    if (!text) return;
    const p = v.P(x, y), c = [p[0], p[1] - dotR(v) - 4 * v.dpr], fs = Math.round(Math.max(10 * v.dpr, Math.min(16 * v.dpr, v.s * 1.5)));
    g.font = `700 ${fs}px system-ui,sans-serif`; const w = g.measureText(text).width + fs * 0.8;
    const bx = clamp(c[0] - w / 2, 2, v.w * v.dpr - w - 2), by = Math.max(2, c[1] - fs * 1.3);
    g.fillStyle = 'rgba(20,20,24,.82)'; g.beginPath(); if (g.roundRect) g.roundRect(bx, by, w, fs * 1.35, fs * 0.35); else g.rect(bx, by, w, fs * 1.35); g.fill();
    g.fillStyle = col || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, bx + w / 2, by + fs * 0.7);
  }
  function drawPop(g, v, x, y, text, k, col) {
    const S = Math.min(v.s, 14 * v.dpr), p = v.P(x, y), c = [p[0], p[1] + (v.half ? 1 : -1) * k * S * 4];
    g.globalAlpha = clamp(1.4 - k, 0, 1); g.beginPath(); g.arc(p[0], p[1], S * (1 + k * 3), 0, 7); g.lineWidth = 2 * v.dpr; g.strokeStyle = col; g.stroke();
    g.font = `800 ${Math.round(S * 3)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.lineWidth = 3 * v.dpr; g.strokeStyle = 'rgba(0,0,0,.6)'; g.strokeText(text, c[0], c[1]); g.fillStyle = '#fff'; g.fillText(text, c[0], c[1]);
    g.globalAlpha = 1;
  }
  // ---------- a scene = one play: keyframes for every dot and the ball ----------
  // scene = { el: canvas id, half, t0, dur, dots: { id: { kf, col, num } }, ball: kf, tag: { id, text, from }, pop: { at, x, y, text, col }, hi }
  const scenes = {};
  let raf = 0;
  function frame(now) {
    raf = 0; let alive = false;
    for (const key in scenes) {
      const sc = scenes[key], cv = document.getElementById(sc.el);
      if (!cv) { if (now - (sc.lost || (sc.lost = now)) > 3000) delete scenes[key]; else alive = true; continue; }
      sc.lost = 0; alive = true;
      let t = sc.dur > 0 ? clamp((now - sc.t0) / sc.dur, 0, 1) : 1;
      if (sc.loop && t >= 1 && now - sc.t0 > sc.dur + sc.loop) { sc.t0 = now; t = 0; sc.sfxDone = false; }
      sc.t = t;
      const v = viewOf(cv, sc.half), g = cv.getContext('2d'); if (!g) continue;
      drawCourt(g, v, sc.paint || 'rgba(31,95,191,.18)', sc.half ? '' : sc.label);
      sc.drawn = {};
      const ids = Object.keys(sc.dots);
      for (const id of ids) { const d = sc.dots[id], p = at(d.kf, t); if (!p) continue; sc.drawn[id] = [p[1], p[2]]; }
      if (sc.trails) for (const id of sc.trails) { const d = sc.dots[id]; if (d && t > 0.2 && t < 0.75) drawTrail(g, v, d.kf, t, d.col.fill === '#ffffff' ? d.col.line : d.col.fill); }
      if (sc.screens) for (const s of sc.screens) if (t >= s.t0 && t <= s.t1 + 0.04 && sc.drawn[s.id] && sc.drawn[s.user]) drawScreen(g, v, sc.drawn[s.id], sc.drawn[s.user]);
      for (const id of ids) { const d = sc.dots[id], p = sc.drawn[id]; if (p) drawDot(g, v, p[0], p[1], d.col, d.num, sc.hi === +id && t > (sc.hiFrom || 0)); }
      if (sc.ball) { const b = at(sc.ball, t); if (b) { sc.drawn.ball = [b[1], b[2]]; drawBall(g, v, b[1], b[2], Math.max(0, (b[3] || 0) + (b[5] || 0))); } }
      if (sc.tag && t >= (sc.tag.from || 0)) { const p = sc.drawn[sc.tag.id]; if (p) drawTag(g, v, p[0], p[1], sc.tag.text, sc.tag.col); }
      if (sc.banner && t < 0.97) drawBanner(g, v, sc.banner, sc.bannerR);
      if (sc.pop && t >= sc.pop.at) drawPop(g, v, sc.pop.x, sc.pop.y, sc.pop.text, (t - sc.pop.at) / (1 - sc.pop.at + 0.0001), sc.pop.col);
      if (sc.onShot && !sc.sfxDone && t >= sc.onShotAt) { sc.sfxDone = true; try { sc.onShot(); } catch (e) { } }
    }
    if (alive) raf = requestAnimationFrame(frame);
  }
  const kick = () => { if (!raf) raf = requestAnimationFrame(frame); };
  function snapPos(key) { const sc = scenes[key]; return sc && sc.drawn ? sc.drawn : {}; }

  // ---------- reading one play-by-play entry ----------
  // entry: [q, clock, side, text, home pts, away pts, flags, ev (id, stat, +n triples), court ids, seconds, shot code]
  // stats (engine BX): 1 pts 3 fga 5 3pa 7 fta 8 orb 9 drb 10 ast 11 stl 12 blk 13 tov 14 pf
  function readEntry(e, prev) {
    const ev = e[7] || [], by = st => { for (let j = 0; j < ev.length; j += 3) if (ev[j + 1] === st && ev[j + 2] > 0) return ev[j]; return null; };
    const pts = (e[4] + e[5]) - (prev ? prev[4] + prev[5] : 0), tx = String(e[3] || '');
    const r = { pts, shooter: by(3), fta: by(7), ast: by(10), blk: by(12), stl: by(11), tov: by(13), reb: by(8) || by(9), orb: by(8), three: by(5) != null, fl: e[6] || '', side: e[2], tx };
    let code = e[10];
    if (code == null && r.shooter != null) {   // entries from before Phase 2: guess the zone from the text
      code = r.three || /3PT/.test(tx) ? (/corner/.test(tx) ? 90 : 114) : /\bdunk\b/i.test(tx) ? 0 : /layup/i.test(tx) ? 1 : /mid-range/i.test(tx) ? 63 : 12;
    }
    if (code != null) { r.zone = Math.floor(code / 10); r.type = code % 10; }
    return r;
  }
  const SIDE_OF = (court, id) => court.indexOf(id) < 5 ? 0 : 1;

  // ---------- Nov 20 2026: plays. The engine logs the play it ran (entry[11]); the dots act it out ----------
  // Spots in half-court chart units (basket at 250, 52; y = distance from the baseline). "S" = strong side (where the shot ends up), "W" = weak side.
  const SP = { TOP: [250, 305], SLOT_S: [330, 285], SLOT_W: [170, 285], WING_S: [425, 215], WING_W: [75, 215], CORNER_S: [468, 40], CORNER_W: [32, 40],
    ELBOW_S: [322, 200], ELBOW_W: [178, 200], BLOCK_S: [300, 90], BLOCK_W: [200, 90], DUNK_S: [335, 50], DUNK_W: [165, 50], RIM: [262, 72], LANE: [275, 150] };
  const TS = 0.18, TR = 0.62;   // the set is in place at TS; the shot leaves the hand at TR
  const PLAY_N = { pnr: 'Pick-and-roll', roll: 'Pick-and-roll', pop: 'Pick-and-pop', iso: 'Isolation', post: 'Post-up', spot: 'Drive and kick', screen: 'Off-screen', dho: 'Handoff', cut: 'Backdoor cut', horns: 'Horns', kick: 'Post kick-out', trans: 'Fast break' };
  const COV_N = { drop: 'Drop', switch: 'Switch', hedge: 'Hedge', blitz: 'Blitz', ice: 'Ice' };
  function pInfo(id) {
    const p = (CX().L && CX().L.players[id]) || {}, a = p.arch && p.arch[0] ? p.arch[0].n || '' : '';
    return { pos: p.pos == null ? 2 : p.pos, tp: p.tp || 45, fin: p.fin || 50, hnd: p.hnd || 50, arch: a, xo: p.xo || '' };
  }
  // put the four players who are not the ball handler on the floor where their game says they belong (shooters in the corners, non-shooting bigs on the dunker spot)
  function baseSpots(ids) {
    const spots = ['CORNER_S', 'CORNER_W', 'WING_S', 'WING_W', 'DUNK_W'], inf = ids.map(pInfo);
    const fit = (k, s) => { const p = inf[k], big = p.pos >= 3, shoot = p.tp >= 60 || /sniper|Spot-up|Stretch|3-and-D|shooter/i.test(p.arch);
      if (s.startsWith('CORNER')) return (shoot ? 40 : 0) + p.tp * 0.5 - (big && !shoot ? 40 : 0);
      if (s.startsWith('WING')) return 30 + (p.pos <= 2 ? 10 : 0) + p.hnd * 0.1;
      return (big ? 45 : -30) + (60 - p.tp) * 0.8 + p.fin * 0.2; };
    let best = null, bs = -1e9;
    const go = (k, used, acc, sc) => { if (k === ids.length) { if (sc > bs) { bs = sc; best = acc.slice(); } return; } for (let j = 0; j < spots.length; j++) if (!used[j]) { used[j] = 1; acc.push(spots[j]); go(k + 1, used, acc, sc + fit(k, spots[j])); acc.pop(); used[j] = 0; } };
    go(0, [], [], 0);
    const out = {}; ids.forEach((id, k) => { out[id] = best ? best[k] : spots[k]; }); return out;
  }
  // plan: { path: { id: [[t, sx, sy]] } in chart units (canonical: strong side to the right, mirrored by sgn), hold: [[t, id]] who has the ball from t,
  //         screens: [{ id, user, t0, t1 }], ov: defense overrides, trails: ids, label }
  function choreo(pl, off5, def5, r, shooter, spotC, seed) {
    const rnd = CX().scRng ? CX().scRng(seed) : Math.random, j = (a) => (rnd() - 0.5) * a;
    const play = pl[0], cov = pl[3] || 'drop', sgn = spotC ? (spotC[0] >= 250 ? 1 : -1) : (rnd() < 0.5 ? 1 : -1);
    const M = q => [sgn > 0 ? q[0] : 500 - q[0], q[1]];   // canonical -> real chart side
    const S = k => M(SP[k]);
    let h = off5.includes(pl[1]) ? pl[1] : off5[0];
    const sh = shooter != null && off5.includes(shooter) ? shooter : null;
    const others = off5.filter(id => id !== h), base = baseSpots(others), path = {}, hold = [], screens = [], ov = [], trails = [];
    const bigOf = (ex) => off5.filter(id => !ex.includes(id)).sort((a, b) => { const A = pInfo(a), B = pInfo(b); return (B.pos - A.pos) || (A.tp - B.tp); })[0];
    const guardOf = (ex) => off5.filter(id => !ex.includes(id)).sort((a, b) => pInfo(a).pos - pInfo(b).pos || pInfo(b).hnd - pInfo(a).hnd)[0];
    const mv = (id, t, q, jit) => { if (id == null) return; (path[id] || (path[id] = [])).push([t, q[0] + j(jit == null ? 24 : jit), q[1] + j(jit == null ? 16 : jit)]); };
    const posOf = (id, t) => { const p = path[id]; if (!p || !p.length) return S('TOP'); let a = p[0]; for (const k of p) { if (k[0] <= t) a = k; else { const f = (t - a[0]) / Math.max(0.001, k[0] - a[0]); return [a[1] + (k[1] - a[1]) * f, a[2] + (k[2] - a[2]) * f]; } } return [a[1], a[2]]; };
    // the set: handler up top, the rest in their spots
    mv(h, TS, S('TOP'), 30); for (const id of others) mv(id, TS, S(base[id]));
    hold.push([0, h]);
    const spot = spotC || S('ELBOW_S'), rim = spotC && spotC[1] < 110 && Math.abs(spotC[0] - 250) < 70;
    const finish = (id, t) => mv(id, t == null ? TR : t, spot, 0);
    const passTo = (t, id) => { if (id != null && hold[hold.length - 1][1] !== id) hold.push([t, id]); };
    const away = (id, t) => { const k = base[id] || 'WING_W'; mv(id, t, S(k.endsWith('_S') ? k.replace('_S', '_W') : k)); };
    let label = PLAY_N[play] || '';
    const screenFor = (scr, user, t0, t1) => screens.push({ id: scr, user, t0, t1 });
    if (play === 'pnr' || play === 'roll' || play === 'pop' || play === 'horns') {
      // the screener comes up to the ball, the handler turns the corner, the screener rolls (or pops)
      let scr = play === 'roll' || play === 'pop' ? (sh != null && sh !== h ? sh : bigOf([h])) : bigOf([h, sh]);
      if (scr == null) scr = others[0];
      const popper = play === 'pop' || (play !== 'roll' && (pInfo(scr).tp >= 62 || /Stretch|Pick-and-pop/i.test(pInfo(scr).arch)));
      if (play === 'horns') { const b2 = bigOf([h, scr, sh]) || others.find(x => x !== scr); mv(scr, TS, S('ELBOW_S'), 10); if (b2 != null && b2 !== sh) mv(b2, TS, S('ELBOW_W'), 10); label = 'Horns'; }
      const scrSpot = M([SP.TOP[0] + 30, SP.TOP[1] - 22]);
      mv(scr, 0.3, scrSpot, 6); screenFor(scr, h, 0.28, 0.42);
      mv(h, 0.27, M([SP.TOP[0] - 10, SP.TOP[1] + 6]), 6);
      mv(h, 0.44, M([360, 230]), 10); trails.push(h);
      if (popper) mv(scr, 0.52, sh === scr ? spot : M([200, 290]), sh === scr ? 0 : 20); else { mv(scr, 0.52, sh === scr ? spot : S('RIM'), sh === scr ? 0 : 8); }
      trails.push(scr);
      if (sh === h) { mv(h, 0.54, rim ? M([330, 150]) : spot, rim ? 8 : 0); finish(h); }
      else if (sh != null) { if (sh !== scr) { finish(sh, 0.5); } passTo(0.5, sh); finish(sh); }
      if (play === 'pnr') label = popper ? 'Pick-and-pop' : 'Pick-and-roll';
    } else if (play === 'iso') {
      // the scorer gets it on his side, everyone else clears out to the other side
      const iso = sh != null ? sh : h;
      if (iso !== h) { mv(iso, TS, S('WING_S'), 10); passTo(0.24, iso); }
      for (const id of off5) if (id !== iso) { const k = base[id] || 'WING_W'; mv(id, 0.32, id === h ? S('SLOT_W') : S(k.startsWith('DUNK') ? 'DUNK_W' : k.startsWith('CORNER') ? 'CORNER_W' : 'WING_W'), 20); }
      const q = posOf(iso, 0.3); mv(iso, 0.36, [q[0] + j(18), q[1] + j(10)], 0); mv(iso, 0.42, [q[0] + j(26), q[1] + j(14)], 0);   // sizing him up
      if (/Slasher|Rim|athlet/i.test(pInfo(iso).arch) && !rim) mv(iso, 0.5, M([300, 170]), 10);
      finish(iso); trails.push(iso);
    } else if (play === 'post' || play === 'kick') {
      // feed the post: a big seals on the block, the ball goes in from the wing; on a kick-out the double comes and he passes out
      const pm = play === 'kick' ? (off5.includes(pl[2]) ? pl[2] : bigOf([h, sh])) : (sh != null ? sh : bigOf([h]));
      const feeder = h !== pm ? h : guardOf([pm]);
      if (feeder != null) { mv(feeder, 0.3, S('WING_S'), 14); passTo(0.36, pm); }
      mv(pm, 0.3, S('BLOCK_S'), 8); trails.push(pm);
      if (play === 'post') { mv(pm, 0.48, M([290, 110]), 12); finish(pm); }
      else { mv(pm, 0.5, S('BLOCK_S'), 6); if (sh != null && sh !== pm) { finish(sh, 0.48); passTo(0.52, sh); } label = 'Post-up, kick-out'; }
      if (pl[4] && pl[4] === pm) ov.push({ kind: 'double', on: pm, t0: 0.38, t1: TR });
    } else if (play === 'spot' || play === 'trans') {
      if (play === 'trans') { mv(h, TS, M([250, 360]), 20); for (const id of others) mv(id, TS, S(base[id]), 30); }
      // the handler attacks the paint, the help comes, he sprays it out to the open shooter
      mv(h, 0.36, M([300, 230]), 12); mv(h, 0.48, M([285, 140]), 10); trails.push(h);
      if (sh === h) finish(h); else if (sh != null) { finish(sh, 0.44); passTo(0.52, sh); }
      ov.push({ kind: 'help', t0: 0.4, t1: 0.56 });
    } else if (play === 'screen') {
      // a big sets a down screen, the shooter curls off it to his spot
      const tgt = sh != null && sh !== h ? sh : guardOf([h]), scr = bigOf([h, tgt]);
      mv(tgt, TS, S('BLOCK_W'), 10); if (scr != null) { mv(scr, TS, M([300, 140]), 10); mv(scr, 0.32, M([330, 150]), 6); screenFor(scr, tgt, 0.3, 0.46); }
      mv(tgt, 0.38, M([320, 120]), 8); finish(tgt, 0.52); trails.push(tgt);
      passTo(0.52, tgt); if (sh === h) { passTo(0.56, h); finish(h); }
    } else if (play === 'dho') {
      // the big brings it up, a guard runs at him, takes the handoff and goes
      const giver = pInfo(h).pos >= 3 ? h : (bigOf([h, sh]) || others[0]), recv = sh != null && sh !== giver ? sh : (h !== giver ? h : guardOf([giver]));
      mv(giver, 0.26, M([300, 260]), 8); if (giver !== h) passTo(0.24, giver);
      mv(recv, 0.26, S('WING_W'), 12); mv(recv, 0.38, M([300, 255]), 4); screenFor(giver, recv, 0.36, 0.46); passTo(0.38, recv);
      mv(recv, 0.48, M([360, 200]), 10); trails.push(recv);
      if (sh === giver) { mv(giver, 0.5, S('RIM'), 8); passTo(0.54, giver); finish(giver); } else if (sh != null) finish(sh);
    } else if (play === 'cut') {
      // the cutter fakes out to the wing, then cuts behind his man to the rim
      const cutter = sh != null && sh !== h ? sh : guardOf([h]);
      mv(cutter, 0.3, S('WING_S'), 8); mv(cutter, 0.36, M([440, 235]), 4); mv(cutter, 0.5, M([300, 100]), 8); finish(cutter); trails.push(cutter);
      if (h !== cutter) mv(h, 0.34, S('SLOT_S'), 10); passTo(0.52, cutter);
      ov.push({ kind: 'beat', on: cutter, t0: 0.38, t1: TR });
    } else if (sh != null) finish(sh, 0.5);
    if (sh != null && hold[hold.length - 1][1] !== sh && sh !== h) passTo(0.52, sh);
    // weak-side players drift a little so the floor never freezes
    for (const id of off5) { const p = path[id]; if (p && p[p.length - 1][0] < 0.5 && id !== sh) { const q = p[p.length - 1]; mv(id, 0.58, [q[1], q[2]], 18); } }
    return { path, hold, screens, ov, trails, label: label ? label + (/pnr|roll|pop|horns|dho|screen/.test(play) && COV_N[cov] ? ' · vs ' + COV_N[cov] : '') : '', cov, posOf, sgn, M, h };
  }
  // turn a plan into keyframes: offense from the plan, defense guarding its man (lag, sag, help, screens, coverage), the ball from holder to holder.
  // Returns the ball keyframes up to tEnd (the release, or the turnover).
  function actOut(plan, off5, def5, right, B, place, dotsRef, was, shooter, tEnd, r) {
    const C = q => toCourt(q[0], q[1], right), okf = {};
    for (const id of off5) {
      const p = (plan.path[id] || []).filter(k => k[0] <= tEnd + 0.001).sort((a, b) => a[0] - b[0]), kf = [];
      for (const k of p) { const c = C([k[1], k[2]]); if (kf.length && Math.abs(kf[kf.length - 1][0] - k[0]) < 0.005) kf[kf.length - 1] = [k[0], c[0], c[1]]; else kf.push([k[0], c[0], c[1]]); }
      okf[id] = kf; place(id, kf);
    }
    const dotsKf = id => (dotsRef[id] || {}).kf;
    const oPos = (id, t) => { const p = at(dotsKf(id), Math.max(0, t)); return p ? [p[1], p[2]] : B; };
    const hold = plan.hold.slice().sort((a, b) => a[0] - b[0]);
    const holderAt = t => { let h = hold[0][1]; for (const x of hold) if (x[0] <= t) h = x[1]; return h; };
    // who guards whom (switches change it)
    const man = {}; def5.forEach((d, k) => { man[d] = off5[k]; });
    const swaps = [];
    for (const s of plan.screens) if (plan.cov === 'switch') { const du = def5.find(d => man[d] === s.user), ds = def5.find(d => man[d] === s.id); if (du != null && ds != null) swaps.push([s.t0 + 0.06, du, ds, s.user, s.id]); }
    const manAt = (d, t) => { let m = man[d]; for (const w of swaps) if (t >= w[0]) { if (d === w[1]) m = w[4]; else if (d === w[2]) m = w[3]; } return m; };
    const help = plan.ov.find(o => o.kind === 'help'), dbl = plan.ov.find(o => o.kind === 'double'), beat = plan.ov.find(o => o.kind === 'beat');
    let dblBy = null;
    if (dbl) { const pm0 = oPos(dbl.on, dbl.t0); dblBy = def5.filter(d => man[d] !== dbl.on).sort((a, b) => { const pa = oPos(man[a], dbl.t0), pb = oPos(man[b], dbl.t0); return Math.hypot(pa[0] - pm0[0], pa[1] - pm0[1]) - Math.hypot(pb[0] - pm0[0], pb[1] - pm0[1]); })[0]; }
    const toward = (a, b, f) => [a[0] + (b[0] - a[0]) * f, a[1] + (b[1] - a[1]) * f];
    const unit = (a, b, len) => { const dx = b[0] - a[0], dy = b[1] - a[1], L0 = Math.hypot(dx, dy) || 1; return [dx / L0 * len, dy / L0 * len]; };
    const dPos = (d, t) => {
      const m = manAt(d, t), lag = beat && m === beat.on && t >= beat.t0 ? 0.1 : 0.035, mp = oPos(m, t - lag), hid = holderAt(t), bp = oPos(hid, t);
      const inPaint = Math.abs(bp[0] - B[0]) < 16 && Math.abs(bp[1] - 25) < 9;
      let f = hid === m ? 0.14 : 0.3 + (help && t >= help.t0 && t <= help.t1 ? 0.2 : 0) + (inPaint ? 0.12 : 0);
      let q = toward(mp, B, f); if (hid !== m) q = toward(q, bp, 0.1);
      for (const s of plan.screens) {
        if (t < s.t0 || t > s.t1 + 0.08) continue;
        const sp = oPos(s.id, t), up = oPos(s.user, t);
        if (m === s.user && !swaps.length) { const u = unit(up, sp, 2.2); q = [sp[0] + u[0], sp[1] + u[1]]; }   // caught on the screen
        if (m === s.id && !swaps.length) {
          if (plan.cov === 'drop' || plan.cov === 'ice') q = toward(B, up, 0.33);
          else if (plan.cov === 'hedge' && t <= s.t0 + 0.12) { const u = unit(up, B, 2); q = [up[0] + u[0] + 1, up[1] + u[1]]; }
          else if (plan.cov === 'blitz') { const u = unit(up, B, 1.6); q = [up[0] + u[0] - 1.2, up[1] + u[1] + 1.2]; }
        }
      }
      if (dbl && d === dblBy && t >= dbl.t0 && t <= dbl.t1) { const pp = oPos(dbl.on, t), u = unit(pp, [pp[0] + (right ? -10 : 10), 25 + (pp[1] > 25 ? -4 : 4)], 2.2); q = [pp[0] + u[0], pp[1] + u[1]]; }
      return q;
    };
    const ts = [0.1, TS, 0.24, 0.3, 0.36, 0.42, 0.48, 0.54, 0.58].filter(t => t <= tEnd);
    for (const d of def5) {
      const contest = shooter != null && (d === r.blk || (r.blk == null && manAt(d, TR) === shooter));
      const kf = ts.map(t => { const q = dPos(d, t); return [t, q[0], q[1]]; });
      if (contest) { const sp = oPos(shooter, TR); kf.push([0.6, sp[0] + (B[0] - sp[0]) * 0.12, sp[1] + (B[1] - sp[1]) * 0.12 + 0.8]); }
      else if (tEnd >= TR) { const q = dPos(d, TR); kf.push([TR, q[0], q[1]]); }
      place(d, kf);
    }
    // the ball: dribbled by the holder, passed (low and quick) to the next one
    const ball = [], h0 = oPos(hold[0][1], 0);
    ball.push([0, ...(was.ball || h0), 0]);
    for (let i = 0; i < hold.length; i++) {
      const [t0, id] = hold[i], t1 = i + 1 < hold.length ? Math.min(tEnd, hold[i + 1][0]) : tEnd;
      if (i > 0) { const q = oPos(id, t0); ball.push([t0, q[0], q[1], 4, 'lin']); }
      for (let t = Math.max(t0 + 0.06, 0.06); t < t1 - 0.07; t += 0.06) { const q = oPos(id, t); ball.push([t, q[0], q[1], (Math.round(t * 50) % 2) ? 3 : 1]); }
      if (t1 >= tEnd) break;
      const q = oPos(id, t1 - 0.06); ball.push([t1 - 0.06, q[0], q[1], 4]);
    }
    return { ball, oPos };
  }
  // a screen: a short bar on the screener's side facing the defender
  function drawScreen(g, v, sp, up) {
    const dx = up[0] - sp[0], dy = up[1] - sp[1], L0 = Math.hypot(dx, dy) || 1, nx = -dy / L0, ny = dx / L0, ox = sp[0] - dx / L0 * 1.6, oy = sp[1] - dy / L0 * 1.6;
    const a = v.P(ox + nx * 1.6, oy + ny * 1.6), b = v.P(ox - nx * 1.6, oy - ny * 1.6);
    g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.lineWidth = Math.max(2.5, v.s * 0.45); g.lineCap = 'round'; g.strokeStyle = 'rgba(255,255,255,.95)'; g.stroke(); g.lineCap = 'butt';
  }
  function drawTrail(g, v, kf, t, col) {
    const pts = []; for (let k = 0; k <= 10; k++) { const tt = Math.max(0, t - 0.22 + k * 0.022); const p = at(kf, tt); if (p) pts.push(v.P(p[1], p[2])); }
    if (pts.length < 2) return;
    g.save(); g.setLineDash([v.s * 0.6, v.s * 0.5]); g.lineWidth = Math.max(1.5, v.s * 0.22); g.strokeStyle = col; g.globalAlpha = 0.55; poly(g, pts); g.stroke(); g.restore();
  }
  function drawBanner(g, v, text, atRight) {
    if (!text) return;
    const fs = Math.round(Math.max(11 * v.dpr, Math.min(15 * v.dpr, v.s * 1.35))); g.font = `700 ${fs}px system-ui,sans-serif`;
    const w = g.measureText(text).width + fs * 1.1, x = atRight ? v.w * v.dpr - w - 8 * v.dpr : 8 * v.dpr, y = 8 * v.dpr;
    g.fillStyle = 'rgba(20,20,24,.78)'; g.beginPath(); if (g.roundRect) g.roundRect(x, y, w, fs * 1.6, fs * 0.5); else g.rect(x, y, w, fs * 1.6); g.fill();
    g.fillStyle = '#ffd76a'; g.textAlign = 'left'; g.textBaseline = 'middle'; g.fillText(text, x + fs * 0.55, y + fs * 0.82);
  }

  // ---------- live game ----------
  let liveKey = null, liveCols = null;
  function live(g, n, ms) {
    const L = CX().L; if (!g || !g.pbp || !L) return;
    const key = g.id + ':' + n;
    if (liveKey === key && scenes.live) { kick(); return; }
    const first = !scenes.live || !String(liveKey || '').startsWith(g.id + ':');
    liveKey = key;
    const H = L.teams[g.home], A = L.teams[g.away]; liveCols = teamCols(H, A);
    const log = g.pbp, e = n > 0 ? log[n - 1] : null, prev = n > 1 ? log[n - 2] : null;
    const court = (typeof pbpReplay === 'function' ? pbpReplay(g, n).court : []) || [];
    const home5 = court.slice(0, 5), away5 = court.slice(5, 10), q = e ? e[0] : 1;
    const homeRight = q <= 2;   // home attacks the right basket in the first half
    const skip = fx().skip || !ms || ms < 120;
    const dur = skip ? 0 : Math.round(ms * 0.94);
    const was = first ? {} : snapPos('live');
    const dots = {}, num = id => { const p = L.players[id]; return p && p.num != null ? p.num : ''; };
    const colOf = id => liveCols[SIDE_OF(court, id)];
    const start = (id, fb) => was[id] ? [0, was[id][0], was[id][1]] : [0, fb[0], fb[1]];
    const benchSpot = id => [SIDE_OF(court, id) === 0 ? 40 : 54, -1.5];
    const sc = { el: 'lv-canvas', half: false, t0: performance.now(), dur, dots, label: H.abbr, paint: hexA(liveCols[0].fill === '#ffffff' ? H.c1 : liveCols[0].fill, 0.2) };
    const name = id => { const p = L.players[id]; return p ? (typeof shortName === 'function' ? shortName(p) : p.name) : ''; };
    if (!e) {   // tip-off: both teams around the center circle
      court.forEach((id, k) => { const s = SIDE_OF(court, id), i = k % 5, ang = (i / 5) * Math.PI * 2; const p = i === 4 ? [47 + (s === 0 ? -1.4 : 1.4), 25] : [47 + (s === 0 ? -1 : 1) * (8 + Math.cos(ang) * 4), 25 + Math.sin(ang) * 12]; dots[id] = { kf: [start(id, benchSpot(id)), [0.7, p[0], p[1]]], col: colOf(id), num: num(id) }; });
      sc.ball = [[0, 47, 25, 4], [1, 47, 25, 9]];
      scenes.live = sc; kick(); return;
    }
    const r = readEntry(e, prev), offSide = r.side === 0 || r.side === 1 ? r.side : (r.shooter != null ? SIDE_OF(court, r.shooter) : 0);
    const right = offSide === 0 ? homeRight : !homeRight, B = hoop(right);
    const off5 = offSide === 0 ? home5 : away5, def5 = offSide === 0 ? away5 : home5;
    const F = formation(off5, def5, right, g.id * 1000 + n);
    const T = [...off5, ...def5];
    const place = (id, kfs) => { dots[id] = { kf: [start(id, benchSpot(id)), ...kfs], col: colOf(id), num: num(id) }; };
    const posAt = (id, t) => { const d = dots[id]; const p = d ? at(d.kf, t) : null; return p ? [p[1], p[2]] : B; };
    const fl = r.fl;
    const pl = Array.isArray(e[11]) && e[11][0] ? e[11] : null;   // Nov 20: the play the engine ran
    sc.bannerR = !right;   // the banner sits in the empty backcourt
    if (fl.includes('q') || fl.includes('t')) {   // quarter break or timeout: everyone walks to the bench side
      T.forEach((id, k) => { const s = SIDE_OF(court, id), i = k % 5; place(id, [[0.8, (s === 0 ? 38 : 56) + (i - 2) * 1.6 * (s === 0 ? -1 : 1), 6 + (i % 2) * 2.5]]); });
      sc.ball = [[0, ...(was.ball || [47, 25]), 0], [0.8, 47, 25, 0]];
      sc.tag = fl.includes('q') ? { id: T[0], text: '', from: 1 } : null;
      scenes.live = sc; kick(); return;
    }
    if (r.shooter != null || (r.fta != null && r.pts >= 0 && r.tov == null)) {
      const shooter = r.shooter != null ? r.shooter : r.fta, ftOnly = r.shooter == null;
      let spot = ftOnly ? [right ? FT_W - 19 : 19, 25] : r.type <= 1 ? [B[0] + (right ? -2.2 : 2.2), 25 + ((n % 5) - 2) * 0.6] : zoneSpot(r.zone, g.id * 7919 + n, right);
      const passer = r.ast != null && r.ast !== shooter ? r.ast : null;
      const handler = passer || off5[0] || shooter;
      let act = null;
      if (pl && !ftOnly) {   // act out the play: set, action, pass, shot
        const chart = r.type <= 1 ? [250 + (n % 2 ? 14 : -14), 68] : (CX().scSpot ? CX().scSpot(clamp(r.zone, 0, 13), CX().scRng(g.id * 7919 + n)) : [250, 150]);
        spot = toCourt(chart[0], chart[1], right);
        const plan = choreo(pl, off5, def5, r, shooter, chart, g.id * 131 + n);
        act = actOut(plan, off5, def5, right, B, place, dots, was, shooter, TR, r);
        for (const id of off5) { const d = dots[id], k = d.kf[d.kf.length - 1]; if (id !== shooter) d.kf.push([1, k[1] + (B[0] - k[1]) * 0.06, k[2]]); }
        sc.banner = plan.label; sc.screens = plan.screens; sc.trails = plan.trails;
      }
      if (pl && ftOnly && PLAY_N[pl[0]]) sc.banner = PLAY_N[pl[0]] + ' · shooting foul';
      if (!act) for (const id of off5) {
        const home = F.o[id] || B;
        if (id === shooter) place(id, ftOnly ? [[0.4, spot[0], spot[1]]] : r.type <= 1 ? [[0.25, home[0], home[1]], [0.55, spot[0] + (right ? -5 : 5), spot[1] + 3], [0.62, spot[0], spot[1]]] : [[0.3, home[0], home[1]], [0.48, spot[0], spot[1]]]);
        else if (ftOnly) { const k = off5.indexOf(id); place(id, [[0.4, right ? FT_W - 23 - k * 2 : 23 + k * 2, 25 + (k % 2 ? 12 : -12)]]); }
        else place(id, [[0.4, home[0], home[1]], [1, home[0] + (B[0] - home[0]) * 0.05, home[1]]]);
      }
      if (!act) for (const id of def5) {
        const k = def5.indexOf(id), guard = F.d[id] || B;
        if (ftOnly) { place(id, [[0.4, right ? FT_W - 9 - (k % 3) * 3 : 9 + (k % 3) * 3, 25 + (k % 2 ? 8 : -8)]]); continue; }
        const contest = id === r.blk || (r.blk == null && off5.indexOf(shooter) === k);
        if (contest) place(id, [[0.35, guard[0], guard[1]], [0.6, spot[0] + (B[0] - spot[0]) * 0.12, spot[1] + (B[1] - spot[1]) * 0.12 + 0.8]]);
        else place(id, [[0.4, guard[0], guard[1]]]);
      }
      // the rebounder crashes toward the rim after the shot
      if (!r.pts && r.reb != null && dots[r.reb]) { const d = dots[r.reb], p = at(d.kf, 0.7); d.kf = d.kf.filter(x => x[0] <= 0.7); d.kf.push([0.7, p[1], p[2]], [1, B[0] + (right ? -4 : 4), 25 + ((n % 7) - 3)]); }
      // ball: with the handler, pass, release, flight, result
      const sp = posAt(shooter, 0.62), rel = [sp[0], sp[1], 7], ball = [];
      if (ftOnly) { const s0 = posAt(shooter, 0.4); ball.push([0, ...(was.ball || s0), 0], [0.4, s0[0], s0[1], 3], [0.55, s0[0], s0[1], 7], [0.85, B[0], B[1], 10, 'arc', 5]); }
      else if (act) { ball.push(...act.ball); ball.push([0.62, rel[0], rel[1], rel[2]]); const peak = r.type <= 1 ? 2 : r.type === 4 ? 9 : 6;
        if (r.blk != null) { const bp = posAt(r.blk, 0.66); ball.push([0.68, bp[0], bp[1], 9, 'lin'], [1, bp[0] + (bp[0] - sp[0]) * 1.4 + (right ? -3 : 3), bp[1] + (bp[1] - sp[1]) * 1.4 + 4, 0]); }
        else ball.push([0.84, B[0], B[1], 10, 'arc', peak]); }
      else {
        const h0 = posAt(handler, 0), h1 = posAt(handler, 0.3);
        ball.push([0, ...(was.ball || h0), 0], [0.3, h1[0], h1[1], 3]);
        if (passer) { const s4 = posAt(shooter, 0.42); ball.push([0.42, s4[0], s4[1], 4, 'lin']); }
        else if (handler !== shooter) { const s4 = posAt(shooter, 0.42); ball.push([0.42, s4[0], s4[1], 4, 'lin']); }
        ball.push([0.62, rel[0], rel[1], rel[2]]);
        const peak = r.type <= 1 ? 2 : r.type === 4 ? 9 : 6;
        if (r.blk != null) { const bp = posAt(r.blk, 0.66); ball.push([0.68, bp[0], bp[1], 9, 'lin'], [1, bp[0] + (bp[0] - sp[0]) * 1.4 + (right ? -3 : 3), bp[1] + (bp[1] - sp[1]) * 1.4 + 4, 0]); }
        else ball.push([0.84, B[0], B[1], 10, 'arc', peak]);
      }
      if (r.blk == null) {
        if (r.pts > 0) ball.push([0.93, B[0], B[1], 5, 'lin'], [1, B[0] + (right ? -1 : 1), B[1] + 0.6, 0]);
        else if (r.reb != null && dots[r.reb]) { const rp = posAt(r.reb, 1); ball.push([0.92, B[0] + (right ? -3 : 3), B[1] + ((n % 5) - 2), 7], [1, rp[0], rp[1], 4]); }
        else ball.push([1, B[0] + (right ? -6 : 6), B[1] + ((n % 9) - 4) * 1.5, 0]);
      }
      sc.ball = ball;
      sc.hi = +shooter; sc.hiFrom = 0.3;
      sc.tag = { id: shooter, text: name(shooter) + (ftOnly ? ' · FT' : ''), from: 0.35, col: '#fff' };
      if (r.blk != null) sc.tag = { id: r.blk, text: 'Blocked by ' + name(r.blk), from: 0.66, col: '#ffd76a' };
      if (r.pts > 0) sc.pop = { at: ftOnly ? 0.85 : 0.84, x: B[0], y: B[1], text: '+' + r.pts, col: colOf(shooter).fill === '#ffffff' ? colOf(shooter).line : colOf(shooter).fill };
      scenes.live = sc; kick(); return;
    }
    if (r.tov != null) {   // turnover: the ball goes the other way (to the stealer, or out of bounds)
      let act = null;
      if (pl && off5.includes(r.tov)) {   // the play starts, then the ball is lost
        const plan = choreo(pl, off5, def5, r, null, null, g.id * 131 + n), lh = plan.hold[plan.hold.length - 1];
        plan.hold = plan.hold.filter(x => x[0] < 0.36); if (plan.hold[plan.hold.length - 1][1] !== r.tov) plan.hold.push([0.36, r.tov]); void lh;
        act = actOut(plan, off5, def5, right, B, place, dots, was, null, 0.45, r);
        for (const id of [...off5, ...def5]) { const d = dots[id], k = d.kf[d.kf.length - 1]; d.kf.push([1, k[1] + (right ? -1 : 1) * (off5.includes(id) ? 6 : 9), k[2]]); }
        sc.banner = plan.label; sc.screens = plan.screens.filter(x => x.t0 < 0.45); sc.trails = plan.trails;
      } else {
        for (const id of off5) { const h = F.o[id] || B; place(id, [[0.45, h[0], h[1]], [1, h[0] + (right ? -6 : 6), h[1]]]); }
        for (const id of def5) { const h = F.d[id] || B; place(id, [[0.45, h[0], h[1]], [1, h[0] + (right ? -9 : 9), h[1]]]); }
      }
      const h0 = posAt(r.tov, 0), h1 = posAt(r.tov, 0.45);
      const ball = act ? [...act.ball, [0.45, h1[0], h1[1], 3]] : [[0, ...(was.ball || h0), 0], [0.45, h1[0], h1[1], 3]];
      if (r.stl != null && dots[r.stl]) { const d = dots[r.stl]; const p = at(d.kf, 0.55); d.kf = d.kf.filter(x => x[0] < 0.5); d.kf.push([0.55, (p[1] + h1[0]) / 2, (p[2] + h1[1]) / 2], [1, p[1] + (right ? -12 : 12), p[2]]); const s5 = posAt(r.stl, 0.6), s1 = posAt(r.stl, 1); ball.push([0.6, s5[0], s5[1], 3, 'lin'], [1, s1[0], s1[1], 2]); sc.tag = { id: r.stl, text: 'Steal: ' + name(r.stl), from: 0.55, col: '#ffd76a' }; sc.hi = +r.stl; sc.hiFrom = 0.55; }
      else { ball.push([1, h1[0], h1[1] < 25 ? -0.5 : 50.5, 0]); sc.tag = { id: r.tov, text: 'Turnover', from: 0.4, col: '#ffb3a8' }; }
      sc.ball = ball; scenes.live = sc; kick(); return;
    }
    // anything else (sub, foul, adjustment): settle into the formation
    for (const id of off5) { const h = F.o[id] || B; place(id, [[0.7, h[0], h[1]]]); }
    for (const id of def5) { const h = F.d[id] || B; place(id, [[0.7, h[0], h[1]]]); }
    const hb = posAt(off5[0], 0.7); sc.ball = [[0, ...(was.ball || hb), 0], [0.7, hb[0], hb[1], 2]];
    if (fl.includes('u')) sc.tag = null;
    scenes.live = sc; kick();
  }
  function hexA(h, a) { const c = hexRgb(h); return `rgba(${c[0]},${c[1]},${c[2]},${a})`; }

  // ---------- top-plays reel: one play on the right half court, looping ----------
  // play: { kind, pid, tid, oppTid, zone, type, ast, other, made }
  function reel(el, p, ms) {
    const L = CX().L; if (!L || !p) return;
    const T = L.teams[p.tid], O = L.teams[p.oppTid] || T, cols = teamCols(T, O), right = true, B = hoop(right);
    const skip = fx().skip, dur = skip ? 0 : (ms || 2600);
    const shotTeam = p.kind === 'B' ? 1 : 0;   // a block: the hero is on defense
    const oc = cols[shotTeam], dc = cols[1 - shotTeam];
    const shooterId = p.kind === 'B' ? p.other : p.pid, num = id => { const x = L.players[id]; return x && x.num != null ? x.num : ''; };
    const spot = p.type <= 1 ? [B[0] - 2.2, 25.6] : zoneSpot(p.zone, (p.pid || 1) * 31 + (p.zone || 0), right);
    const F = formation([1, 2, 3, 4, 5], [6, 7, 8, 9, 10], right, (p.pid || 1) * 17);
    const dots = {}, sc = { el, half: true, t0: performance.now(), dur, dots, loop: skip ? 0 : 900, paint: hexA(T.c1 || '#888', 0.18) };
    const offIds = [shooterId, p.ast || -2, -3, -4, -5], fp = [F.o[1], F.o[2], F.o[3], F.o[4], F.o[5]];
    offIds.forEach((id, k) => { const h = fp[k]; dots[id] = { kf: id === shooterId ? (p.type <= 1 ? [[0, 70, 25 + (k - 2) * 4], [0.3, h[0], h[1]], [0.58, spot[0] - 5, spot[1] + 3], [0.64, spot[0], spot[1]]] : [[0, h[0] - 6, h[1]], [0.35, h[0], h[1]], [0.5, spot[0], spot[1]]]) : [[0, h[0] - 6, h[1]], [0.4, h[0], h[1]]], col: oc, num: id > 0 ? num(id) : '' }; });
    const hero = p.kind === 'B' ? p.pid : null;
    [hero || -6, -7, -8, -9, -10].forEach((id, k) => { const g0 = F.d[k + 6]; dots[id] = { kf: k === 0 ? [[0, g0[0] - 5, g0[1]], [0.35, g0[0], g0[1]], [0.62, spot[0] + 1.2, spot[1] + 0.6]] : [[0, g0[0] - 5, g0[1]], [0.4, g0[0], g0[1]]], col: dc, num: id > 0 ? num(id) : '' }; });
    const ps = [...offIds].map(id => at(dots[id].kf, 0.3)), sp = at(dots[shooterId].kf, 0.64), ball = [];
    const holder = p.ast ? p.ast : shooterId, h3 = at(dots[holder].kf, 0.35);
    ball.push([0, h3[1] - 6, h3[2], 2], [0.35, h3[1], h3[2], 3]);
    if (p.ast) ball.push([0.48, sp[1], sp[2], 4, 'lin']);
    ball.push([0.64, sp[1], sp[2], p.type === 0 ? 9 : 7]);
    if (p.kind === 'B') { const bp = at(dots[hero || -6].kf, 0.66); ball.push([0.68, bp[1], bp[2], 9, 'lin'], [1, bp[1] - 14, bp[2] + 9, 0]); }
    else if (p.type === 0) ball.push([0.78, B[0], B[1], 10.5, 'lin'], [0.9, B[0], B[1], 4], [1, B[0] - 1, B[1] + 0.5, 0]);
    else ball.push([0.84, B[0], B[1], 10, 'arc', p.type === 4 ? 10 : 6], [0.93, B[0], B[1], 5, 'lin'], [1, B[0] - 1, B[1] + 0.6, 0]);
    sc.ball = ball; sc.hi = p.kind === 'B' ? (hero || -6) : shooterId; sc.hiFrom = 0.25;
    if (p.kind !== 'B') sc.pop = { at: p.type === 0 ? 0.8 : 0.86, x: B[0], y: B[1], text: p.type === 4 ? '+3' : p.kind === 'A' ? '+2 & 1' : '+2', col: oc.fill === '#ffffff' ? oc.line : oc.fill };
    sc.onShotAt = p.kind === 'B' ? 0.67 : p.type === 0 ? 0.8 : 0.86;
    sc.onShot = () => { if (!window.FX) return; FX.sfx(p.kind === 'B' ? 'block' : p.type === 0 ? 'dunk' : 'swish'); };
    if (skip) { sc.t0 = performance.now() - 1; sc.onShot = null; }
    scenes[el] = sc; kick();
    void ps;
  }
  function stop(el) { if (el) delete scenes[el]; else for (const k in scenes) delete scenes[k]; if (!el) liveKey = null; }
  window.COURT = { live, reel, stop, readEntry, get scenes() { return scenes; } };
})();
