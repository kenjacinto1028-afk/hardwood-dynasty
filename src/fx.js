// Phase 1 (Nov 18 2026): sound effects, screen animations and the settings page.
// No audio files: every sound is made in the browser with the Web Audio API.
// Settings are per browser (localStorage 'pbl-fx'), not part of the league save.
// app.js calls: FX.afterRender(key), FX.gameResult({ win, title }), FX.pbp(entry, prev, final, userWon), FX.sfx(name)
(function () {
  const KEY = 'pbl-fx';
  const reduce = (() => { try { return window.matchMedia('(prefers-reduced-motion: reduce)').matches; } catch (e) { return false; } })();
  const DEF = { vol: 0.6, mute: false, speed: 'normal', skip: reduce, confetti: true, live: true, ui: true, music: true, mvol: 0.35, cer: true, draftShow: true, draftTimer: false, stories: true };   // Phase 3: music, ceremonies, draft show, story popups
  let S = Object.assign({}, DEF);
  try { const raw = localStorage.getItem(KEY); if (raw) S = Object.assign({}, DEF, JSON.parse(raw)); } catch (e) { }
  const saveS = () => { try { localStorage.setItem(KEY, JSON.stringify(S)); } catch (e) { } applyCss(); syncMute(); musicSync(); };
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
    click(c, t) { tone(c, t, 'sine', 900, 600, 0.002, 0.04, 0.15); },
    // Phase 3
    drumroll(c, t) { for (let i = 0; i < 26; i++) { const k = i / 26; noise(c, t + i * 0.06, 0.002, 0.05, 0.12 + 0.35 * k, 'bandpass', 260 + 200 * k, 0, 1.4); } tone(c, t + 1.56, 'sine', 120, 50, 0.003, 0.4, 1); noise(c, t + 1.56, 0.002, 0.5, 0.5, 'highpass', 5000); },
    fanfare(c, t) { const n = [[392, 0, 0.16], [523, 0.16, 0.16], [659, 0.32, 0.16], [784, 0.48, 0.55], [659, 1.06, 0.14], [784, 1.2, 0.9]]; for (const [f, d, l] of n) { tone(c, t + d, 'sawtooth', f, f, 0.02, l, 0.09); tone(c, t + d, 'square', f / 2, f / 2, 0.02, l, 0.04); tone(c, t + d, 'triangle', f * 2, f * 2, 0.02, l, 0.05); } },
    boo(c, t) { noise(c, t, 0.25, 1.3, 0.35, 'bandpass', 380, 260, 1.5); tone(c, t, 'sawtooth', 140, 110, 0.3, 1.1, 0.03); },
    reveal(c, t) { tone(c, t, 'sine', 523, 1046, 0.01, 0.35, 0.18); tone(c, t + 0.08, 'triangle', 784, 1568, 0.01, 0.3, 0.1); },
    tick(c, t) { tone(c, t, 'square', 1800, 1800, 0.001, 0.025, 0.06); },
    page(c, t) { noise(c, t, 0.01, 0.12, 0.18, 'bandpass', 3000, 1200, 0.8); }
  };
  let lastAt = 0;
  function sfx(name, opt) {
    if (opt && opt.ui && !S.ui) return;
    if (window.__fxLog) window.__fxLog.push(name);   // tests: which sounds were asked for
    const c = ac(); if (!c || !SOUNDS[name]) return;
    const now = c.currentTime; if (opt && opt.throttle && now - lastAt < opt.throttle) return; lastAt = now;
    try { SOUNDS[name](c, now + 0.01, opt && opt.big); } catch (e) { }
  }

  // ---------- Phase 3: background music (made live with Web Audio, no files) ----------
  // Two loops: 'menu' (laid-back chords) and 'game' (game-day groove while you watch a game live). Own volume (S.mvol), off with S.music or mute.
  const SONGS = {
    menu: { bpm: 84, ch: [[48, 55, 59, 64], [45, 52, 55, 60], [41, 48, 52, 57], [43, 50, 53, 59]], drums: 'soft', lead: [76, 74, 72, 71, 72, 74, 76, 79] },
    game: { bpm: 112, ch: [[45, 52, 57, 60], [41, 48, 53, 57], [43, 50, 55, 59], [40, 47, 52, 56]], drums: 'beat', lead: [69, 72, 74, 76, 74, 72, 69, 67] }
  };
  let mus = { mood: null, want: 'menu', gain: null, timer: null, next: 0, step: 0, started: false };
  const hz = m => 440 * Math.pow(2, (m - 69) / 12);
  function mtone(c, t, type, f, a, d, peak, cut) {
    const o = c.createOscillator(), g = c.createGain(), fl = c.createBiquadFilter(); o.type = type; o.frequency.value = f; fl.type = 'lowpass'; fl.frequency.value = cut || 1800;
    env(g, t, a, peak, d); o.connect(fl); fl.connect(g); g.connect(mus.gain); o.start(t); o.stop(t + a + d + 0.05);
  }
  function mnoise(c, t, d, peak, type, f) { const s = c.createBufferSource(), fl = c.createBiquadFilter(), g = c.createGain(); s.buffer = noiseBuf; fl.type = type; fl.frequency.value = f; env(g, t, 0.002, peak, d); s.connect(fl); fl.connect(g); g.connect(mus.gain); s.start(t, Math.random()); s.stop(t + d + 0.05); }
  function musicStep(c) {
    const song = SONGS[mus.mood]; if (!song) return;
    const q = 60 / song.bpm / 2;   // eighth notes
    while (mus.next < c.currentTime + 0.25) {
      const t = mus.next, st = mus.step, bar = Math.floor(st / 8) % song.ch.length, e = st % 8, ch = song.ch[bar];
      if (e === 0) { for (const m of ch.slice(1)) mtone(c, t, 'triangle', hz(m), 0.08, q * 7, 0.05, 1400); mtone(c, t, 'sine', hz(ch[0] - 12), 0.01, q * 3, 0.22, 600); }
      if (e === 4) mtone(c, t, 'sine', hz(ch[0] - 12 + (song.drums === 'beat' ? 7 : 0)), 0.01, q * 3, 0.18, 600);
      if (song.drums === 'beat') { if (e === 0 || e === 3 || e === 4) mtone(c, t, 'sine', 70, 0.002, 0.18, 0.35, 300); if (e === 2 || e === 6) mnoise(c, t, 0.12, 0.12, 'bandpass', 1800); mnoise(c, t, 0.03, 0.035, 'highpass', 7000); }
      else if (e % 2 === 0) mnoise(c, t, 0.04, 0.02, 'highpass', 8000);
      if ((st >> 3) % 4 >= 2 && e % 2 === 0) { const m = song.lead[(st >> 1) % song.lead.length]; mtone(c, t, 'sine', hz(m), 0.02, q * 1.6, 0.04, 2400); }
      mus.step++; mus.next += q;
    }
  }
  function musicOn() { return S.music && !S.mute && S.vol > 0 && S.mvol > 0; }
  function musicSync() {
    if (!mus.started) return;
    if (!musicOn()) { if (mus.gain) mus.gain.gain.value = 0; if (mus.timer) { clearInterval(mus.timer); mus.timer = null; } mus.mood = null; return; }
    const c = ac(); if (!c) return;
    if (!mus.gain) { mus.gain = c.createGain(); mus.gain.connect(c.destination); }
    mus.gain.gain.value = S.mvol * S.mvol * S.vol;
    if (mus.mood !== mus.want) { if (window.__fxLog) window.__fxLog.push('music:' + mus.want); mus.mood = mus.want; mus.step = 0; mus.next = c.currentTime + 0.1; }
    if (!mus.timer) mus.timer = setInterval(() => { try { if (ctx) musicStep(ctx); } catch (e) { } }, 90);
  }
  function music(mood) { if (mood && mood !== mus.want) { mus.want = mood; musicSync(); } }
  const musicStart = () => { if (mus.started) return; mus.started = true; musicSync(); };
  ['pointerdown', 'keydown'].forEach(ev => document.addEventListener(ev, musicStart, { once: true, capture: true }));

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
    <h3 style="margin-top:14px">Music</h3>
    ${ck('music', 'Background music', 'A laid-back loop on menus, a game-day groove when you watch a game live')}
    <div class="fx-row"><span>Music volume</span><input type="range" id="fx-mvol" min="0" max="100" step="5" value="${Math.round(S.mvol * 100)}" aria-label="Music volume"><span id="fx-mvolv" class="muted">${Math.round(S.mvol * 100)}%</span></div>
    <div class="row" style="flex-wrap:wrap;gap:6px;margin:6px 0 4px"><span class="muted" style="font-size:12px">Try:</span>${['bounce', 'swish', 'dunk', 'rim', 'whistle', 'buzzer', 'cheer'].map(n => `<button class="sm" data-fxt="${n}">${n[0].toUpperCase() + n.slice(1)}</button>`).join('')}</div>
    <h3 style="margin-top:14px">Animations</h3>
    ${ck('skip', 'Skip animations', 'No page fades, count-ups, confetti or result banners')}
    <div class="fx-row"><span>Animation speed</span><span class="seg">${sp('slow')}${sp('normal')}${sp('fast')}</span></div>
    ${ck('confetti', 'Confetti when your team wins')}
    <h3 style="margin-top:14px">Shows</h3>
    ${ck('cer', 'Award and title ceremonies', 'Spotlights, drumroll and trophy reveal for the MVP and the champions')}
    ${ck('draftShow', 'Draft night show', 'Animated pick reveals and crowd reactions')}
    ${ck('draftTimer', 'Auto-pick when your draft clock runs out', 'Off: the clock is just for fun')}
    ${ck('stories', 'Story popups', 'Illustrated story cards for big moments: rivalries, injuries, streaks, press conferences')}
    ${gameHtml()}
    ${stopHtml()}
    ${installHtml()}
    <div class="row" style="margin-top:14px;gap:8px"><button class="primary" id="fx-done">Done</button><button id="fx-reset">Reset to default</button><button id="fx-demo">Preview a win</button></div>`;
  }
  // I2: every "stop the sim for this" switch in one place. These are saved with the league (L.pause*), not with the sound / animation settings.
  const STOPS = [
    ['pauseOffers', 'Trade offers for you', 'New offers wait on the Trades page instead', L => L.pauseOffers !== false, (L, v) => { L.pauseOffers = v ? true : false; }],
    ['pauseIv', 'Interviews', 'Open interview questions wait for you', L => L.pauseIv !== false, (L, v) => { L.pauseIv = v ? true : false; }],
    ['pauseDrama', 'Locker room issues', 'Issues settle themselves after a week', L => L.pauseDrama !== false, (L, v) => { L.pauseDrama = v ? true : false; }],
    ['pauseMtg', 'Player meeting requests', 'A player asks to talk to you', L => L.pauseMtg !== false, (L, v) => { L.pauseMtg = v ? true : false; }],
    ['pausePress', 'Press conferences', 'The popup is skipped; answer from the News page', L => L.pausePress !== false, (L, v) => { L.pausePress = v ? true : false; }],
    ['pauseWarn', 'Deadline reminders', 'Trade deadline eve (offers, players on the block), contract extensions, buyouts, two-way playoff slot', L => L.pauseWarn !== false, (L, v) => { L.pauseWarn = v ? true : false; }],
    ['todoStop', 'Starred to-do items', '3 days before the trade deadline and in the last week of the season', L => { const T = window.__pbl.v30.todo.state(); return !!T.stop; }, (L, v) => { window.__pbl.v30.todo.state().stop = !!v; }],
    ['trainRemind', 'Training focus reminder', 'At the start of each season', L => !L.noTrainRemind, (L, v) => { L.noTrainRemind = !v; }]
  ];
  // I1: "Install as an app" (Android / desktop Chrome give a button; iPhone needs Share > Add to Home Screen)
  let installEv = null;
  window.addEventListener('beforeinstallprompt', e => { e.preventDefault(); installEv = e; });
  window.addEventListener('appinstalled', () => { installEv = null; });
  function installHtml() {
    if (!/^https?:$/.test(location.protocol)) return '';
    const standalone = (window.matchMedia && matchMedia('(display-mode: standalone)').matches) || navigator.standalone;
    if (standalone) return `<h3 style="margin-top:14px">App</h3><p class="muted" style="font-size:13px;margin:0">You're using the installed app. It works offline; your leagues are saved on this device.</p>`;
    const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
    return `<h3 style="margin-top:14px">Install as an app</h3><p class="muted" style="font-size:13px;margin:0 0 6px">Puts the game on your home screen, opens full screen and works with no internet. Your leagues stay saved on this device.</p>${installEv ? '<button class="primary" id="fx-install">Install app</button>' : ios ? '<p style="font-size:13px;margin:0">On iPhone / iPad: tap the Share button in Safari, then <strong>Add to Home Screen</strong>.</p>' : '<p class="muted" style="font-size:13px;margin:0">In Chrome or Edge, open the browser menu and choose <strong>Install app</strong> (or <strong>Add to Home screen</strong>).</p>'}`;
  }
  // Phase B: difficulty (saved with the league) + the guided tour
  function gameHtml() {
    const L = window.PBL && window.PBL.L; if (!L) return '';
    const d = L.diff || 'normal', b = k => `<button class="sm ${d === k ? 'primary' : ''}" data-fxdiff="${k}">${{ easy: 'Easy', normal: 'Normal', hard: 'Hard' }[k]}</button>`;
    return `<h3 style="margin-top:14px">Game</h3><div class="fx-row"><span>Difficulty</span><span class="seg">${b('easy')}${b('normal')}${b('hard')}</span></div>
    <p class="muted" style="font-size:12px;margin:0 0 6px">${{ easy: 'Easy: AI teams take fair trades and your owner is patient.', normal: 'Normal: the game as designed.', hard: 'Hard: AI teams want a clear win in trades and your owner loses patience fast.' }[d]} Saved with this league; change it any time.</p>
    <div class="row" style="gap:8px"><button class="sm" id="fx-tour">Take the tour</button><span class="muted" style="font-size:12px">A quick guide to the main buttons.</span></div>`;
  }
  function stopHtml() {
    const L = window.PBL && window.PBL.L; if (!L || L.user == null) return '';
    return `<h3 style="margin-top:14px">Stop the sim for…</h3><p class="muted" style="font-size:12px;margin:0 0 6px">Checked = the sim stops and asks you. Unchecked = it keeps going (things wait for you on their page). Your roster being over 15 players always stops it.</p>${STOPS.map(([k, t, d, get]) => { let on = true; try { on = get(L); } catch (e) { } return `<label class="fx-ck"><input type="checkbox" data-stop="${k}" ${on ? 'checked' : ''}><span><strong>${t}</strong><br><span class="muted" style="font-size:12px">${d}</span></span></label>`; }).join('')}`;
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
      const mv = m.querySelector('#fx-mvol');
      mv.oninput = () => { S.mvol = +mv.value / 100; m.querySelector('#fx-mvolv').textContent = mv.value + '%'; saveS(); };
      const ib = m.querySelector('#fx-install'); if (ib) ib.onclick = () => { const e = installEv; installEv = null; if (e) { e.prompt(); e.userChoice.finally(draw); } };
      m.querySelectorAll('[data-stop]').forEach(c => c.onchange = () => { const L = window.PBL.L, d = STOPS.find(x => x[0] === c.dataset.stop); if (!L || !d) return; d[4](L, c.checked); try { window.PBL.save(); } catch (e) { } });
      m.querySelectorAll('[data-fxc]').forEach(c => c.onchange = () => { S[c.dataset.fxc] = c.checked; saveS(); });
      m.querySelectorAll('[data-fxs]').forEach(b => b.onclick = () => { S.speed = b.dataset.fxs; saveS(); draw(); });
      m.querySelectorAll('[data-fxt]').forEach(b => b.onclick = () => sfx(b.dataset.fxt));
      m.querySelectorAll('[data-fxdiff]').forEach(b => b.onclick = () => { const L = window.PBL.L; if (!L) return; L.diff = b.dataset.fxdiff; try { window.PBL.save(); } catch (e) { } draw(); });
      const tb = m.querySelector('#fx-tour'); if (tb) tb.onclick = () => { close(); if (window.PB) PB.tour(true); };
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
  window.FX = { sfx, afterRender, gameResult, pbp, confetti, banner, music, get musicMood() { return mus.mood; }, openSettings, get settings() { return Object.assign({}, S); }, set(k, v) { S[k] = v; saveS(); } };
})();
