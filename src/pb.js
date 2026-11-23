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
  const TOUR_KEY = 'pbl-tour';   // GM and commissioner share the old key; other modes have their own
  const keyOf = m => m === 'career' ? 'pbl-tour-career' : m === 'coach' ? 'pbl-tour-coach' : m === 'fantasy' ? 'pbl-tour-fantasy' : TOUR_KEY;
  const modeOf = () => { const L = window.PBL && window.PBL.L; return !L ? 'gm' : L.career ? 'career' : L.mode === 'coach' ? 'coach' : L.user != null ? 'gm' : 'commish'; };
  let tourMode = null;
  const steps = (mode) => {
    mode = mode || modeOf();
    const common = [
      { el: () => pick('#simctl button.primary', '#simctl'), t: 'Play games', b: 'Sim day plays one day. The other sim buttons (on phones under "Sim") play a week, a month or up to the next big moment. The game stops and asks when something needs you.' }
    ];
    const saves = [
      { el: () => pick('#b-menu', '#b-more'), t: 'Saves', b: 'The game saves by itself after every step and keeps backups. Export a file here to keep your own copy or move it to another device.' },
      { el: () => pick('#b-settings', '#b-more'), t: 'Settings', b: 'Sound, music, animation speed, difficulty, when the sim should stop, and this tour again.' }
    ];
    const pages = { el: () => pick('#p3-bnav', '#tabs'), t: 'Pages', b: 'Everything is grouped here. On a phone you can swipe left and right between pages.' };
    if (mode === 'career') return [
      { t: 'Welcome to My Career', b: 'You are the player. Start as a draft prospect, make the calls in big games, get drafted, sign deals and chase the Hall of Fame. This tour shows the main parts.' },
      ...common,
      { el: () => pick('.car-tabs', '#tabs a.on'), t: 'Career tabs', b: 'Overview (next game, schedule), Skills (spend XP, badges), Life (contract, locker room, interviews), Brand (money and fans), Rivals and your Career story.' },
      { el: () => pick('#car-legend', '.car-head'), t: 'Legend meter', b: 'Your name in the league. Awards, titles and stats fill it. The Hall of Fame tracker says if you are on pace.' },
      { el: () => pick('#car-playnow', '.car-tabs'), t: 'Big games: your calls', b: 'On big games the sim stops. Pick a game plan (take over, facilitate, lock down, pace yourself), then make four calls. Each shows its odds and a Safe, Balanced or Bold tag. Bold plays cost more energy, and tired legs hurt every call. You get one breather per game.' },
      { el: () => pick('[data-cartab="skills"]', '.car-tabs'), t: 'Skills and XP', b: 'Every game earns XP. Spend it on ratings and badges. Better ratings mean better odds on your calls and a higher draft pick.' },
      { el: () => pick('[data-cartab="brand"]', '.car-tabs'), t: 'Brand', b: 'After the draft, companies make offers: endorsements, a sneaker deal and maybe your own signature shoe. Your agent can push for more (it can backfire). Post on social media for hype, and do community events to lift your fan rating.' },
      { el: () => pick('[data-cartab="rivals"]', '.car-tabs'), t: 'Rivals', b: 'Face the same star again and again and a rivalry builds. Beat your rival in a game you play for extra XP and hype.' },
      { el: () => pick('[data-cartab="life"]', '.car-tabs'), t: 'Life', b: 'Contract offers, extensions, requesting a trade, locker room chemistry and post-game interviews live here.' },
      ...saves,
      { t: "You're ready", b: 'Sim to your first big game. Good luck, rookie!' }
    ];
    if (mode === 'coach') return [
      { t: 'Welcome, Coach', b: 'You run the bench: lineup, minutes, playbook and live games. An AI general manager handles trades, signings and the draft. Keep winning or you get fired.' },
      ...common,
      { el: () => pick('#tabs a[href="#cmjob"]', '#tabs a[data-v="cmjob"]', '#p3-bnav', '#tabs'), t: 'My job', b: 'The job security meter, your GM, the team plan and expected wins, offers from other teams and your coaching history.' },
      { el: () => pick('#tabs a[href="#myteam"]', '#tabs a[data-v="myteam"]', '#tabs'), t: 'Lineup and minutes', b: 'Set starters, minutes, sliders and the playbook on My team. You can also coach live games and make calls on the fly.' },
      { el: () => pick('#tabs a[href="#rmoves"]', '#tabs a[data-v="trades"]', '#tabs'), t: 'Roster moves', b: 'Trades, free agents and the draft are the GM\'s job. You can read them but not make them.' },
      pages, ...saves,
      { t: "You're ready", b: 'Press Sim day. If the GM warns you about your job, win more or you may be shown the door. Job offers come in the offseason.' }
    ];
    if (mode === 'fantasy') return [
      { t: 'Fantasy league', b: 'Draft 10 real players from the league into your fantasy team and face 7 AI managers every week. Points come from the real box scores.' },
      { el: () => pick('#main .fan-dhead', '#main .fan-hero', '#main'), t: 'Snake draft', b: 'Draft, Auto-pick or Auto-draft the rest. Picks reverse every round.' },
      { el: () => pick('#main .fan-score', '#main .fan-wknav', '#main'), t: 'Weekly matchup', b: 'Head-to-head each week. Points: 1 per point, 1.2 per rebound, 1.5 per assist, 3 per steal or block, +0.5 per three, -1 per turnover.' },
      { el: () => pick('#main .fan-tbl', '#main'), t: 'Standings, roster and waivers', b: 'Check the standings and playoff line, your roster, and the waiver wire. You get 4 adds a week: drop a player, then add a free agent.' },
      { t: 'Playoffs', b: 'The top 4 play a semifinal week and a final week. The champion gets a popup and a spot in the Fantasy champions history.' }
    ];
    // GM (and commissioner, unchanged)
    const mine = mode === 'gm';
    return [
      { t: 'Welcome!', b: mine ? 'You run a team: sign players, make trades and win titles. This 1-minute tour shows the main buttons.' : 'You run the whole league as commissioner. This 1-minute tour shows the main buttons.' },
      ...common,
      { el: () => pick('#p3-bnav', '#tabs'), t: 'Pages', b: 'Everything is grouped here: ' + (mine ? 'My team' : 'Staff') + ', League, Roster moves, News & history and How it works.' },
      { el: () => pick('#subrow:not([hidden]) #subtabs', '#tabs a.on'), t: 'Sub pages', b: 'Each group has more pages in this row. On a phone you can also swipe left and right.' },
      { el: () => pick('#tabs a[href="#rmoves"], #tabs a[data-v="trades"], #tabs a[data-v="fa"], #tabs a[data-v="draft"]', '#p3-bnav a[data-v="rmoves"]', '#tabs'), t: 'Roster moves', b: 'Trades, free agents and the draft. AI teams say yes or no and tell you what they would want instead.' },
      ...(mine ? [{ el: () => pick('#tabs a[href="#fantasy"]', '#tabs a[data-v="fantasy"]', '#tabs'), t: 'Fantasy league', b: 'Under My team there is also a Fantasy league you can start any time in the regular season. It has its own short tour.' }] : []),
      { el: () => pick('#gsearch'), t: 'Search', b: 'Find any player, coach or team. Every underlined name opens its page.' },
      ...saves,
      { t: "You're ready", b: 'Press Sim day to start. The "How it works" page explains every rule if you want the details. Good luck!' }
    ];
  };
  let cur = -1;
  function tourEnd(done) { const k = keyOf(tourMode || modeOf()); cur = -1; const o = document.getElementById('pb-tour'); if (o) o.remove(); if (done) { try { localStorage.setItem(k, 'done'); } catch (e) { } } }
  function draw() {
    const S = steps(tourMode), s = S[cur]; if (!s) return tourEnd(true);
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
  function tour(force, mode) {
    mode = mode || modeOf(); let seen = null; try { seen = localStorage.getItem(keyOf(mode)); } catch (e) { }
    if (!force && seen) return false;
    try { const m = document.getElementById('modal'); if (m && force) m.innerHTML = ''; } catch (e) { }
    tourMode = mode; cur = 0; draw(); return true;
  }
  addEventListener('resize', () => { if (cur >= 0) draw(); });
  addEventListener('keydown', e => { if (cur >= 0 && e.key === 'Escape') tourEnd(true); });
  // first time: a brand-new league (season 1, day 0), once the first popups are gone
  function afterRender() {
    const P = window.PBL, L = P && P.L; if (!L || cur >= 0) return;
    const idle = () => { const m = document.getElementById('modal'); return cur < 0 && !(m && m.firstChild) && !document.getElementById('fx-modal')?.firstChild; };
    // Fantasy: the first time its page opens
    if (P.ui && P.ui.view === 'fantasy') { let f = null; try { f = localStorage.getItem(keyOf('fantasy')); } catch (e) { } if (!f) { setTimeout(() => { if (idle() && P.ui.view === 'fantasy') tour(false, 'fantasy'); }, 700); return; } }
    if (L.season !== 1 || (L.day || 0) > 0 || L.phase !== 'regular') return;
    const mode = modeOf(); let seen = null; try { seen = localStorage.getItem(keyOf(mode)); } catch (e) { } if (seen) return;
    setTimeout(() => { if (idle()) tour(false, mode); }, 900);
  }
  return { tour, afterRender, showError, get errors() { return errCount; } };
})();
window.PB = PB;
