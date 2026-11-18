// Phase 1 (Nov 18 2026): sound effects, screen animations and the settings page.
// No audio files: every sound is made in the browser with the Web Audio API.
// Settings are per browser (localStorage 'pbl-fx'), not part of the league save.
// app.js calls: FX.afterRender(key), FX.gameResult({ win, title }), FX.pbp(entry, prev, final, userWon), FX.sfx(name)
(function () {
  const KEY = 'pbl-fx';
  const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  const DEF = { vol: 0.6, mute: false, speed: 'normal', skip: reduce, confetti: true, live: true, ui: true };
  let S = Object.assign({}, DEF);
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign({}, DEF, JSON.parse(raw)); } catch (e) { }
  const saveS = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } applyCss(); syncMute(); };
  const SPEED = { slow: 1.6, normal: 1, fast: 0.5 };
  const mult = () => SPEED[S.speed] || 1;
  function applyCss() {
    const r = document.documentElement;
    r.style.setProperty('--fx-mult', String(mult()));
    r.classList.toggle('fx-off', !!S.skip);
  }

  // ---------- sound ----------
  let ctx = null, master = null, noiseBuf = null;
  function ac() {
    if (S.mute || S.vol <= 0) return null;
    try {
      if (!ctx) {
        const C = window.AudioContext || window.webkitAudioContext; if (!C) return null;
        ctx = new C(); master = ctx.createGain(); master.connect(ctx.destination);
        noiseBuf = ctx.createBuffer(1, ctx.sampleRate * 2, ctx.sampleRate);
        const d = noiseBuf.getChannelData(0); let b = 0;
        for (let i = 0; i < d.length; i++) { const w = Math.random() * 2 - 1; b = 0.97 * b + 0.03 * w; d[i] = w * 0.6 + b * 3; }   // white + a little brown = crowd-like
      }
      if (ctx.state === 'suspended') ctx.resume();
      master.gain.value = S.vol * S.vol;   // squared feels more even on a slider
      return ctx;
    } catch (e) { return null; }
  }
  function env(g, t, a, peak, d) { g.gain.setValueAtTime(0.0001, t); g.gain.exponentialRampToValueAtTime(peak, t + a); g.gain.exponentialRampToValueAtTime(0.0001, t + a + d); }
  function tone(c, t, type, f0, f1, a, d, peak, dest) {
    const o = c.createOscillator(), g = c.createGain(); o.type = type; o.frequency.setValueAtTime(f0, t); if (f1 && f1 !== f0) o.frequency.exponentialRampToValueAtTime(f1, t + a + d);
    env(g, t, a, peak, d); o.connect(g); g.connect(dest || master); o.start(t); o.stop(t + a + d + 0.05);
  }
  function noise(c, t, a, d, peak, type, f0, f1, q) {
    const s = c.createBufferSource(), f = c.createBiquadFilter(), g = c.createGain();
    s.buffer = noiseBuf; s.loop = true; f.type = type || 'bandpass'; f.frequency.setValueAtTime(f0 || 1000, t); if (f1) f.frequency.exponentialRampToValueAtTime(f1, t + a + d); f.Q.value = q || 1;
    env(g, t, a, peak, d); s.connect(f); f.connect(g); g.connect(master); s.start(t, Math.random()); s.stop(t + a + d + 0.05);
  }
  const SOUNDS = {
    bounce(c, t) { tone(c, t, 'sine', 150, 55, 0.004, 0.16, 0.9); noise(c, t, 0.002, 0.05, 0.25, 'lowpass', 400); },
    swish(c, t) { noise(c, t, 0.03, 0.22, 0.35, 'bandpass', 2500, 6000, 1.2); },
    rim(c, t) { tone(c, t, 'triangle', 880, 860, 0.002, 0.25, 0.3); tone(c, t, 'sine', 1320, 1300, 0.002, 0.18, 0.12); },
    dunk(c, t) { tone(c, t, 'sine', 110, 45, 0.003, 0.3, 1); noise(c, t, 0.002, 0.12, 0.5, 'lowpass', 900); tone(c, t + 0.01, 'square', 320, 300, 0.002, 0.35, 0.08); tone(c, t + 0.01, 'triangle', 640, 600, 0.002, 0.45, 0.15); },
    block(c, t) { tone(c, t, 'sine', 200, 70, 0.003, 0.12, 0.8); noise(c, t, 0.002, 0.08, 0.4, 'lowpass', 1500); },
    whistle(c, t) { tone(c, t, 'sine', 2900, 2950, 0.01, 0.35, 0.18); tone(c, t, 'sine', 3080, 3100, 0.01, 0.35, 0.08); },
    buzzer(c, t) { for (const f of [196, 247, 294]) tone(c, t, 'sawtooth', f, f, 0.01, 0.9, 0.12); },
    cheer(c, t, big) { const d = big ? 3.2 : 1.8; noise(c, t, 0.35, d, big ? 0.7 : 0.45, 'bandpass', 900, 1300, 0.7); noise(c, t + 0.1, 0.3, d * 0.9, 0.25, 'bandpass', 2400, 2000, 2); for (let i = 0; i < (big ? 8 : 4); i++) { const s = t + 0.2 + Math.random() * d * 0.6; tone(c, s, 'sine', 700 + Math.random() * 500, 1100 + Math.random() * 600, 0.08, 0.35, 0.04); } },
    groan(c, t) { noise(c, t, 0.2, 0.9, 0.3, 'bandpass', 700, 350, 0.8); },
    click(c, t) { tone(c, t, 'sine', 900, 600, 0.002, 0.04, 0.15); }
  };
  let lastAt = 0;
  function sfx(name, opt) {
    if (opt && opt.ui && !S.ui) return;
    if (window.__fxLog) window.__fxLog.push(name);   // tests: which sounds were asked for
    const c = ac(); if (!c || !SOUNDS[name]) return;
    const now = c.currentTime; if (opt && opt.throttle && now - lastAt < opt.throttle) return; lastAt = now;
    try { SOUNDS[name](c, now + 0.01, opt && opt.big); } catch (e) { }
  }

  // ---------- animations ----------
  let lastKey = null;
  function countUp(root) {
    if (S.skip) return;
    const els = root.querySelectorAll('[data-cu]'); if (!els.length) return;
    const dur = 700 * mult(), t0 = performance.now();
    const items = [...els].map(el => ({ el, txt: el.textContent })).filter(x => /\d/.test(x.txt));
    const step = now => {
      const k = Math.min(1, (now - t0) / dur), e = 1 - Math.pow(1 - k, 3);
      for (const x of items) { if (!x.el.isConnected) continue; x.el.textContent = k >= 1 ? x.txt : x.txt.replace(/\d+(\.\d+)?/g, m => { const v = parseFloat(m) * e, dp = (m.split('.')[1] || '').length; return v.toFixed(dp); }); }
      if (k < 1) requestAnimationFrame(step);
    };
    requestAnimationFrame(step);
  }
  function afterRender(key) {
    const main = document.getElementById('main'); if (!main) return;
    if (key === lastKey) return;
    lastKey = key;
    if (S.skip) return;
    main.classList.remove('fx-in'); void main.offsetWidth; main.classList.add('fx-in');
    countUp(main);
  }
  function confetti(big) {
    if (S.skip || !S.confetti) return;
    const cv = document.createElement('canvas'); cv.className = 'fx-confetti'; cv.setAttribute('aria-hidden', 'true');
    const W = cv.width = window.innerWidth, H = cv.height = window.innerHeight; document.body.appendChild(cv);
    const g = cv.getContext('2d'); if (!g) { cv.remove(); return; }
    const cols = ['#f08a52', '#1f8a4c', '#f2d14b', '#3c8cf0', '#c8382e', '#ffffff'];
    const N = big ? 260 : 120, ps = [];
    for (let i = 0; i < N; i++) { const left = i % 2 === 0; ps.push({ x: left ? 0 : W, y: H * (0.55 + Math.random() * 0.3), vx: (left ? 1 : -1) * (4 + Math.random() * 7) * (W / 1200 + 0.5), vy: -(9 + Math.random() * 9) * (H / 900 + 0.4), r: Math.random() * 6.28, vr: (Math.random() - 0.5) * 0.4, w: 6 + Math.random() * 6, h: 3 + Math.random() * 4, c: cols[i % cols.length] }); }
    const dur = (big ? 4200 : 2600) * mult(), t0 = performance.now();
    const frame = now => {
      const k = (now - t0) / dur; g.clearRect(0, 0, W, H);
      for (const p of ps) { p.vy += 0.32; p.vx *= 0.99; p.x += p.vx; p.y += p.vy; p.r += p.vr; g.save(); g.globalAlpha = Math.max(0, 1 - Math.max(0, k - 0.7) / 0.3); g.translate(p.x, p.y); g.rotate(p.r); g.fillStyle = p.c; g.fillRect(-p.w / 2, -p.h / 2, p.w, p.h); g.restore(); }
      if (k < 1) requestAnimationFrame(frame); else cv.remove();
    };
    requestAnimationFrame(frame);
  }
  function banner(text, win) {
    if (S.skip) return;
    const b = document.createElement('div'); b.className = 'fx-banner ' + (win ? 'win' : 'loss'); b.textContent = text; b.setAttribute('role', 'status');
    document.body.appendChild(b); setTimeout(() => b.remove(), 1900 * mult());
  }
  // your game's result after a sim (not when you watch it live: the live screen has its own)
  function gameResult(r) {
    if (!r) return;
    if (r.title) { sfx('buzzer'); setTimeout(() => sfx('cheer', { big: true }), 350); confetti(true); setTimeout(() => confetti(true), 900 * mult()); banner('Champions!', true); return; }
    if (r.win) { sfx('cheer'); confetti(false); banner(r.text || 'Win!', true); }
    else { sfx('groan'); banner(r.text || 'Loss', false); }
  }
  // one live play-by-play entry: [q, clock, side, text, hs, as, flags, ...]
  const RX_BLOCK = /blocked by|swatted by|rejected by|shut down by/i, RX_MISS = /\bmiss\b|no good|rims out|bricked/i;
  function pbp(e, prev, final, userWon) {
    if (!S.live || !e) return;
    const fl = e[6] || '', pts = prev ? (e[4] - prev[4]) + (e[5] - prev[5]) : e[4] + e[5], tx = String(e[3] || '');
    if (final) { sfx('buzzer'); if (userWon != null) setTimeout(() => { if (userWon) { sfx('cheer', { big: true }); confetti(false); } else sfx('groan'); }, 500); return; }
    if (fl.includes('q')) { sfx('buzzer'); return; }
    if (fl.includes('t')) { sfx('whistle', { throttle: 0.15 }); return; }
    if (pts > 0 && /\bdunk\b/i.test(tx)) { sfx('dunk', { throttle: 0.08 }); if (fl.includes('c')) setTimeout(() => sfx('cheer'), 150); return; }
    if (pts >= 3 && /3PT/.test(tx)) { sfx('swish', { throttle: 0.08 }); if (fl.includes('c')) setTimeout(() => sfx('cheer'), 150); return; }
    if (pts > 0 && /→/.test(tx)) { sfx('swish', { throttle: 0.08 }); return; }
    if (RX_BLOCK.test(tx)) { sfx('block', { throttle: 0.08 }); return; }
    if (RX_MISS.test(tx)) { sfx('rim', { throttle: 0.08 }); return; }
  }

  // ---------- header buttons + settings page ----------
  function syncMute() {
    const b = document.getElementById('b-mute'); if (!b) return;
    const off = S.mute || S.vol <= 0; b.textContent = off ? '🔇' : '🔊'; b.title = off ? 'Sound is off (click to turn on)' : 'Sound is on (click to mute)'; b.setAttribute('aria-label', b.title); b.setAttribute('aria-pressed', off ? 'true' : 'false');
  }
  function settingsHtml() {
    const sp = k => `<button class="sm ${S.speed === k ? 'primary' : ''}" data-fxs="${k}">${{ slow: 'Slow', normal: 'Normal', fast: 'Fast' }[k]}</button>`;
    const ck = (k, t, sub) => `<label class="fx-ck"><input type="checkbox" data-fxc="${k}" ${S[k] ? 'checked' : ''}> <span>${t}${sub ? `<br><span class="muted" style="font-size:12px">${sub}</span>` : ''}</span></label>`;
    return `<h2>Settings</h2><p class="muted" style="margin-top:-6px">Saved in this browser. They don't change your league.</p>
    <h3>Sound</h3>
    ${ck('mute', 'Mute all sound')}
    <div class="fx-row"><span>Volume</span><input type="range" id="fx-vol" min="0" max="100" step="5" value="${Math.round(S.vol * 100)}" aria-label="Volume"><span id="fx-volv" class="muted">${Math.round(S.vol * 100)}%</span></div>
    ${ck('live', 'Sounds while watching a game live', 'Swish, dunk, rim, block, whistle and buzzer')}
    ${ck('ui', 'Sim button sound', 'A ball bounce when you press a sim button')}
    <div class="row" style="flex-wrap:wrap;gap:6px;margin:6px 0 4px"><span class="muted" style="font-size:12px">Try:</span>${['bounce', 'swish', 'dunk', 'rim', 'whistle', 'buzzer', 'cheer'].map(n => `<button class="sm" data-fxt="${n}">${n[0].toUpperCase() + n.slice(1)}</button>`).join('')}</div>
    <h3 style="margin-top:14px">Animations</h3>
    ${ck('skip', 'Skip animations', 'No page fades, count-ups, confetti or result banners')}
    <div class="fx-row"><span>Animation speed</span><span class="seg">${sp('slow')}${sp('normal')}${sp('fast')}</span></div>
    ${ck('confetti', 'Confetti when your team wins')}
    <div class="row" style="margin-top:14px;gap:8px"><button class="primary" id="fx-done">Done</button><button id="fx-reset">Reset to default</button><button id="fx-demo">Preview a win</button></div>`;
  }
  function openSettings() {
    let m = document.getElementById('fx-modal');
    if (!m) { m = document.createElement('div'); m.id = 'fx-modal'; document.body.appendChild(m); }
    const draw = () => {
      m.innerHTML = `<div class="overlay" id="fx-ov"><div class="dialog" role="dialog" aria-modal="true" aria-label="Settings"><button class="dx" aria-label="Close" title="Close">×</button>${settingsHtml()}</div></div>`;
      const close = () => { m.innerHTML = ''; };
      m.querySelector('.dx').onclick = close; m.querySelector('#fx-done').onclick = close;
      m.querySelector('#fx-ov').onclick = e => { if (e.target.id === 'fx-ov') close(); };
      m.querySelector('#fx-reset').onclick = () => { S = Object.assign({}, DEF); saveS(); draw(); };
      m.querySelector('#fx-demo').onclick = () => gameResult({ win: true, text: 'Win! (preview)' });
      const vol = m.querySelector('#fx-vol');
      vol.oninput = () => { S.vol = +vol.value / 100; m.querySelector('#fx-volv').textContent = vol.value + '%'; saveS(); };
      vol.onchange = () => sfx('bounce');
      m.querySelectorAll('[data-fxc]').forEach(c => c.onchange = () => { S[c.dataset.fxc] = c.checked; saveS(); });
      m.querySelectorAll('[data-fxs]').forEach(b => b.onclick = () => { S.speed = b.dataset.fxs; saveS(); draw(); });
      m.querySelectorAll('[data-fxt]').forEach(b => b.onclick = () => sfx(b.dataset.fxt));
    };
    draw();
  }
  document.addEventListener('keydown', e => { if (e.key === 'Escape') { const m = document.getElementById('fx-modal'); if (m && m.firstChild) m.innerHTML = ''; } });
  function bind() {
    const mb = document.getElementById('b-mute'), sb = document.getElementById('b-settings');
    if (mb) mb.onclick = () => { if (S.vol <= 0) { S.vol = DEF.vol; S.mute = false; } else S.mute = !S.mute; saveS(); if (!S.mute) sfx('bounce'); };
    if (sb) sb.onclick = openSettings;
    const sim = document.getElementById('simctl');
    if (sim) sim.addEventListener('click', e => { const b = e.target.closest('[data-sim]'); if (b && !b.disabled) sfx('bounce', { ui: true }); });
    syncMute();
  }
  applyCss();
  if (document.readyState === 'loading') document.addEventListener('DOMContentLoaded', bind); else bind();
  window.FX = { sfx, afterRender, gameResult, pbp, confetti, openSettings, get settings() { return Object.assign({}, S); }, set(k, v) { S[k] = v; saveS(); } };
})();
