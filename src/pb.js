// Phase B (Nov 18 2026): friendly error screen + first-time guided tour.
// Loaded last; uses app.js helpers through window.PBL. Backups live in app.js (backupMaybe / getBaks), difficulty in league.js (diffK) + fx.js.
const PB = (function () {
  const $ = s => document.querySelector(s), vis = el => { if (!el) return false; const r = el.getBoundingClientRect(); return r.width > 0 && r.height > 0 && getComputedStyle(el).visibility !== 'hidden'; };
  const pick = (...sel) => { for (const s of sel) { const e = [...document.querySelectorAll(s)].find(vis); if (e) return e; } return null; };
  const esc = s => String(s == null ? '' : s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));

  // ---------- error screen: any uncaught error shows a small card instead of a silently broken page ----------
  let lastErr = 0, errCount = 0;
  const IGNORE = /ResizeObserver loop|Script error\.?$|NotAllowedError|AbortError|play\(\) request/i;
  function showError(msg, stack) {
    if (IGNORE.test(String(msg))) return;
    errCount++;
    const now = Date.now(); if (now - lastErr < 20000) return; lastErr = now;
    let box = document.getElementById('pb-err');
    if (!box) { box = document.createElement('div'); box.id = 'pb-err'; box.setAttribute('role', 'alert'); document.body.appendChild(box); }
    const det = (String(msg) + '\n' + String(stack || '')).slice(0, 1500);
    box.innerHTML = `<strong>Something went wrong on this screen.</strong><p>Your league is safe: it is saved after every step, and the game keeps 3 automatic backups (Saves). Reloading usually fixes it.</p>
      <div class="row" style="gap:8px;flex-wrap:wrap"><button class="primary sm" id="pb-reload">Reload</button><button class="sm" id="pb-copy">Copy details</button><button class="sm" id="pb-x">Dismiss</button></div><pre hidden id="pb-det">${esc(det)}</pre>`;
    box.querySelector('#pb-reload').onclick = () => location.reload();
    box.querySelector('#pb-x').onclick = () => box.remove();
    box.querySelector('#pb-copy').onclick = async () => { const d = box.querySelector('#pb-det'); try { await navigator.clipboard.writeText(det); box.querySelector('#pb-copy').textContent = 'Copied'; } catch (e) { d.hidden = false; } };
  }
  window.addEventListener('error', e => { if (e && e.message) showError(e.message, e.error && e.error.stack); });
  window.addEventListener('unhandledrejection', e => { const r = e && e.reason; showError(r && r.message || String(r), r && r.stack); });

  // ---------- guided tour ----------
  const TOUR_KEY = 'pbl-tour';
  // Tour text per game mode (Commissioner keeps the original wording)
  const steps = () => {
    const L = window.PBL && window.PBL.L, mine = L && L.user != null;
    const mode = !mine ? 'commish' : L.mode === 'coach' ? 'coach' : L.career ? 'career' : 'team';
    const WELCOME = {
      commish: 'You run the whole league as commissioner. This 1-minute tour shows the main buttons.',
      team: 'You run a team: sign players, make trades and win titles. This 1-minute tour shows the main buttons.',
      coach: 'You coach your team: lineup, minutes, playbook and live games. An AI general manager makes the trades, signings and draft picks. This 1-minute tour shows the main buttons.',
      career: 'You play one player\'s career: train him, answer interviews and climb from draft pick to star. This 1-minute tour shows the main buttons.'
    };
    const MODE_STEP = {
      // Team (GM): tag players in one click
      team: { el: () => pick('#tabs a[href="#myteam"]', '#p3-bnav a[data-v="myteam"]', '#tabs'), t: 'Roster tags', b: 'On My team › Roster, the Core, Shop and Untouchable buttons tag a player in one click. Core players are protected from coach targets. A player whose contract has expired can\'t be traded until he re-signs.' },
      // Play as coach: lineup and job security
      coach: { el: () => pick('#tabs a[href="#myteam"]', '#tabs'), t: 'Your job', b: 'You set the lineup, minutes, playbook and sliders, then play the live games. My team › My job shows your job security and any offers.' },
      // My Career: one player's story
      career: { el: () => pick('#tabs a[href="#career"]', '#tabs'), t: 'My Career', b: 'Train your player, answer interviews and decide on contract offers on the My Career page. Your draft stock and award news show up there too.' }
    };
    const list = [
      { t: 'Welcome!', b: WELCOME[mode] },
      { el: () => pick('#simctl button.primary', '#simctl'), t: 'Play games', b: 'Sim day plays one day. The other sim buttons (on phones under "Sim") play a week, a month or up to the next big moment. The game stops and asks when something needs you.' },
      { el: () => pick('#p3-bnav', '#tabs'), t: 'Pages', b: 'Everything is grouped here: ' + (mode === 'commish' ? 'Staff' : 'My team') + ', League, Roster moves, News & history and How it works.' },
      { el: () => pick('#subrow:not([hidden]) #subtabs', '#tabs a.on'), t: 'Sub pages', b: 'Each group has more pages in this row. On a phone you can also swipe left and right.' },
      { el: () => pick('#tabs a[href="#rmoves"], #tabs a[data-v="trades"], #tabs a[data-v="fa"], #tabs a[data-v="draft"]', '#p3-bnav a[data-v="rmoves"]', '#tabs'), t: 'Roster moves', b: 'Trades, free agents and the draft. AI teams say yes or no and tell you what they would want instead.' }
    ];
    if (MODE_STEP[mode]) list.push(MODE_STEP[mode]);
    list.push(
      { el: () => pick('#gsearch'), t: 'Search', b: 'Find any player, coach or team. Every underlined name opens its page.' },
      { el: () => pick('#b-menu', '#b-more'), t: 'Saves', b: 'The game saves by itself after every step and keeps backups. Export a file here to keep your own copy or move it to another device.' },
      { el: () => pick('#b-settings', '#b-more'), t: 'Settings', b: 'Sound, music, animation speed, difficulty, when the sim should stop, and this tour again.' },
      { t: "You're ready", b: 'Press Sim day to start. The "How it works" page explains every rule if you want the details. Good luck!' }
    );
    return list;
  };
  let cur = -1;
  function tourEnd(done) { cur = -1; const o = document.getElementById('pb-tour'); if (o) o.remove(); if (done) { try { localStorage.setItem(TOUR_KEY, 'done'); } catch (e) { } } }
  function draw() {
    const S = steps(), s = S[cur]; if (!s) return tourEnd(true);
    let o = document.getElementById('pb-tour');
    if (!o) { o = document.createElement('div'); o.id = 'pb-tour'; document.body.appendChild(o); }
    const el = s.el ? s.el() : null; if (el && el.scrollIntoView) { const r0 = el.getBoundingClientRect(); if (r0.top < 0 || r0.bottom > innerHeight) el.scrollIntoView({ block: 'center' }); }
    const r = el ? el.getBoundingClientRect() : null, pad = 6;
    const hole = r ? `<div class="pb-hole" style="left:${Math.max(0, r.left - pad)}px;top:${Math.max(0, r.top - pad)}px;width:${Math.min(innerWidth, r.width + pad * 2)}px;height:${r.height + pad * 2}px"></div>` : '<div class="pb-dim"></div>';
    const W = Math.min(340, innerWidth - 24); let left = 12, top = innerHeight / 2 - 90;
    if (r) { left = Math.min(Math.max(12, r.left), innerWidth - W - 12); top = r.bottom + 14; if (top + 190 > innerHeight) top = Math.max(12, r.top - 200); }
    o.innerHTML = `${hole}<div class="pb-tip" role="dialog" aria-label="Tour" style="left:${r ? left : (innerWidth - W) / 2}px;top:${top}px;width:${W}px"><div class="muted" style="font-size:12px">${cur + 1} / ${S.length}</div><h3>${esc(s.t)}</h3><p>${esc(s.b)}</p>
      <div class="row" style="gap:8px;justify-content:space-between"><button class="sm" id="pb-skip">${cur === S.length - 1 ? 'Close' : 'Skip tour'}</button><span class="row" style="gap:6px">${cur > 0 ? '<button class="sm" id="pb-back">Back</button>' : ''}<button class="sm primary" id="pb-next">${cur === S.length - 1 ? 'Start playing' : 'Next'}</button></span></div></div>`;
    o.querySelector('#pb-next').onclick = () => { cur++; draw(); };
    o.querySelector('#pb-skip').onclick = () => tourEnd(true);
    const bk = o.querySelector('#pb-back'); if (bk) bk.onclick = () => { cur--; draw(); };
  }
  function tour(force) {
    let seen = null; try { seen = localStorage.getItem(TOUR_KEY); } catch (e) { }
    if (!force && seen) return false;
    try { const m = document.getElementById('modal'); if (m && force) m.innerHTML = ''; } catch (e) { }
    cur = 0; draw(); return true;
  }
  addEventListener('resize', () => { if (cur >= 0) draw(); });
  addEventListener('keydown', e => { if (cur >= 0 && e.key === 'Escape') tourEnd(true); });
  // first time: a brand-new league (season 1, day 0), once the first popups are gone
  function afterRender() {
    const L = window.PBL && window.PBL.L; if (!L || cur >= 0) return;
    if (L.season !== 1 || (L.day || 0) > 0 || L.phase !== 'regular') return;
    let seen = null; try { seen = localStorage.getItem(TOUR_KEY); } catch (e) { } if (seen) return;
    setTimeout(() => { const m = document.getElementById('modal'); if (cur < 0 && !(m && m.firstChild) && !document.getElementById('fx-modal')?.firstChild) tour(false); }, 900);
  }
  return { tour, afterRender, showError, get errors() { return errCount; } };
})();
window.PB = PB;
