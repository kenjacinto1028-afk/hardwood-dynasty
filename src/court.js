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
  function size(cv, half) {
    const w = Math.max(200, Math.round(cv.parentElement ? cv.parentElement.clientWidth : 600)), h = Math.round(w * (half ? 50 / 47 : FT_H / FT_W) * (half ? 0.62 : 1));
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    if (cv.width !== Math.round(w * dpr) || cv.height !== Math.round(h * dpr)) { cv.width = Math.round(w * dpr); cv.height = Math.round(h * dpr); cv.style.width = w + 'px'; cv.style.height = h + 'px'; }
    return { w, h, dpr };
  }
  // view: full court, or the right half (reel) — returns feet -> pixels
  function viewOf(cv, half) {
    const { w, h, dpr } = size(cv, half);
    if (!half) { const s = w / FT_W; return { s: s * dpr, ox: 0, oy: 0, w, h, dpr, x0: 0 }; }
    const x0 = FT_W - 47, s = w / 47; return { s: s * dpr, ox: -x0 * s * dpr, oy: -((50 - h / s) / 2) * s * dpr, w, h, dpr, x0 };
  }
  function drawCourt(g, v, paint, label) {
    const S = v.s, P = (x, y) => [v.ox + x * S, v.oy + y * S];
    g.fillStyle = '#d9b382'; g.fillRect(0, 0, v.w * v.dpr, v.h * v.dpr);
    // floor boards
    g.strokeStyle = 'rgba(120,80,40,.10)'; g.lineWidth = 1;
    for (let y = 0; y < FT_H; y += 2.5) { const a = P(0, y), b = P(FT_W, y); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); }
    g.strokeStyle = 'rgba(255,255,255,.92)'; g.lineWidth = Math.max(1.2, S * 0.17);
    const line = (x1, y1, x2, y2) => { const a = P(x1, y1), b = P(x2, y2); g.beginPath(); g.moveTo(a[0], a[1]); g.lineTo(b[0], b[1]); g.stroke(); };
    const arc = (x, y, r, a0, a1) => { const c = P(x, y); g.beginPath(); g.arc(c[0], c[1], r * S, a0, a1); g.stroke(); };
    { const a = P(0, 0); g.strokeRect(a[0], a[1], FT_W * S, FT_H * S); }
    line(47, 0, 47, 50); arc(47, 25, 6, 0, 7);
    for (const right of [false, true]) {
      const bx = right ? FT_W - RIM_IN : RIM_IN, sg = right ? -1 : 1, base = right ? FT_W : 0;
      // paint
      const a = P(right ? FT_W - 19 : 0, 17); g.fillStyle = paint; g.fillRect(a[0], a[1], 19 * S, 16 * S);
      { const a2 = P(right ? FT_W - 19 : 0, 17); g.strokeRect(a2[0], a2[1], 19 * S, 16 * S); }
      arc(base + sg * 19, 25, 6, right ? Math.PI / 2 : -Math.PI / 2, right ? Math.PI * 1.5 : Math.PI / 2);
      // three-point line: corners 22 ft, arc 23.75 ft
      const cy = Math.sqrt(23.75 * 23.75 - 22 * 22), cx = bx + sg * cy;
      line(base, 3, cx, 3); line(base, 47, cx, 47);
      { const c = P(bx, 25); g.beginPath(); const t = Math.atan2(22, cy); if (right) g.arc(c[0], c[1], 23.75 * S, Math.PI - t, Math.PI + t); else g.arc(c[0], c[1], 23.75 * S, -t, t); g.stroke(); }
      // backboard + rim
      line(base + sg * 4, 22, base + sg * 4, 28);
      g.strokeStyle = '#e8562a'; arc(bx, 25, 0.75, 0, 7); g.strokeStyle = 'rgba(255,255,255,.92)';
    }
    if (label) { const c = P(47, 25); g.fillStyle = 'rgba(255,255,255,.5)'; g.font = `700 ${Math.round(S * 3.2)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(label, c[0], c[1]); }
  }
  function drawDot(g, v, x, y, col, num, hi) {
    const S = v.s, c = [v.ox + x * S, v.oy + y * S], r = Math.max(6 * v.dpr, S * 1.35);
    if (hi) { g.beginPath(); g.arc(c[0], c[1], r * 1.55, 0, 7); g.fillStyle = 'rgba(255,230,90,.55)'; g.fill(); }
    g.beginPath(); g.arc(c[0] + r * 0.12, c[1] + r * 0.18, r, 0, 7); g.fillStyle = 'rgba(0,0,0,.22)'; g.fill();
    g.beginPath(); g.arc(c[0], c[1], r, 0, 7); g.fillStyle = col.fill; g.fill(); g.lineWidth = Math.max(1.5, r * 0.22); g.strokeStyle = col.line; g.stroke();
    if (num != null && num !== '') { g.fillStyle = col.ink; g.font = `700 ${Math.round(r * 1.05)}px system-ui,sans-serif`; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(String(num), c[0], c[1] + r * 0.05); }
  }
  function drawBall(g, v, x, y, z) {
    const S = v.s, c = [v.ox + x * S, v.oy + y * S], r = Math.max(3.5 * v.dpr, S * (0.55 + z * 0.035));
    if (z > 0.3) { g.beginPath(); g.ellipse(c[0] + z * S * 0.08, c[1] + z * S * 0.12, r * 0.8, r * 0.5, 0, 0, 7); g.fillStyle = 'rgba(0,0,0,.25)'; g.fill(); }
    const cy = c[1] - z * S * 0.18;
    g.beginPath(); g.arc(c[0], cy, r, 0, 7); g.fillStyle = '#f07a24'; g.fill(); g.lineWidth = Math.max(1, r * 0.22); g.strokeStyle = '#7a3208'; g.stroke();
    g.beginPath(); g.moveTo(c[0] - r, cy); g.lineTo(c[0] + r, cy); g.stroke();
  }
  function drawTag(g, v, x, y, text, col) {
    if (!text) return;
    const S = v.s, c = [v.ox + x * S, v.oy + y * S - Math.max(6 * v.dpr, S * 1.35) - 4 * v.dpr], fs = Math.round(Math.max(10 * v.dpr, S * 1.5));
    g.font = `700 ${fs}px system-ui,sans-serif`; const w = g.measureText(text).width + fs * 0.8;
    const bx = clamp(c[0] - w / 2, 2, v.w * v.dpr - w - 2), by = Math.max(2, c[1] - fs * 1.3);
    g.fillStyle = 'rgba(20,20,24,.82)'; g.beginPath(); if (g.roundRect) g.roundRect(bx, by, w, fs * 1.35, fs * 0.35); else g.rect(bx, by, w, fs * 1.35); g.fill();
    g.fillStyle = col || '#fff'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText(text, bx + w / 2, by + fs * 0.7);
  }
  function drawPop(g, v, x, y, text, k, col) {
    const S = v.s, c = [v.ox + x * S, v.oy + y * S - k * S * 4];
    g.globalAlpha = clamp(1.4 - k, 0, 1); g.beginPath(); g.arc(v.ox + x * S, v.oy + y * S, S * (1 + k * 3), 0, 7); g.lineWidth = 2 * v.dpr; g.strokeStyle = col; g.stroke();
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
      for (const id of ids) { const d = sc.dots[id], p = sc.drawn[id]; if (p) drawDot(g, v, p[0], p[1], d.col, d.num, sc.hi === +id && t > (sc.hiFrom || 0)); }
      if (sc.ball) { const b = at(sc.ball, t); if (b) { sc.drawn.ball = [b[1], b[2]]; drawBall(g, v, b[1], b[2], Math.max(0, (b[3] || 0) + (b[5] || 0))); } }
      if (sc.tag && t >= (sc.tag.from || 0)) { const p = sc.drawn[sc.tag.id]; if (p) drawTag(g, v, p[0], p[1], sc.tag.text, sc.tag.col); }
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
    if (fl.includes('q') || fl.includes('t')) {   // quarter break or timeout: everyone walks to the bench side
      T.forEach((id, k) => { const s = SIDE_OF(court, id), i = k % 5; place(id, [[0.8, (s === 0 ? 38 : 56) + (i - 2) * 1.6 * (s === 0 ? -1 : 1), 6 + (i % 2) * 2.5]]); });
      sc.ball = [[0, ...(was.ball || [47, 25]), 0], [0.8, 47, 25, 0]];
      sc.tag = fl.includes('q') ? { id: T[0], text: '', from: 1 } : null;
      scenes.live = sc; kick(); return;
    }
    if (r.shooter != null || (r.fta != null && r.pts >= 0 && r.tov == null)) {
      const shooter = r.shooter != null ? r.shooter : r.fta, ftOnly = r.shooter == null;
      const spot = ftOnly ? [right ? FT_W - 19 : 19, 25] : r.type <= 1 ? [B[0] + (right ? -2.2 : 2.2), 25 + ((n % 5) - 2) * 0.6] : zoneSpot(r.zone, g.id * 7919 + n, right);
      const passer = r.ast != null && r.ast !== shooter ? r.ast : null;
      const handler = passer || off5[0] || shooter;
      for (const id of off5) {
        const home = F.o[id] || B;
        if (id === shooter) place(id, ftOnly ? [[0.4, spot[0], spot[1]]] : r.type <= 1 ? [[0.25, home[0], home[1]], [0.55, spot[0] + (right ? -5 : 5), spot[1] + 3], [0.62, spot[0], spot[1]]] : [[0.3, home[0], home[1]], [0.48, spot[0], spot[1]]]);
        else if (ftOnly) { const k = off5.indexOf(id); place(id, [[0.4, right ? FT_W - 23 - k * 2 : 23 + k * 2, 25 + (k % 2 ? 12 : -12)]]); }
        else place(id, [[0.4, home[0], home[1]], [1, home[0] + (B[0] - home[0]) * 0.05, home[1]]]);
      }
      for (const id of def5) {
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
      for (const id of off5) { const h = F.o[id] || B; place(id, [[0.45, h[0], h[1]], [1, h[0] + (right ? -6 : 6), h[1]]]); }
      for (const id of def5) { const h = F.d[id] || B; place(id, [[0.45, h[0], h[1]], [1, h[0] + (right ? -9 : 9), h[1]]]); }
      const h0 = posAt(r.tov, 0), h1 = posAt(r.tov, 0.45);
      const ball = [[0, ...(was.ball || h0), 0], [0.45, h1[0], h1[1], 3]];
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
