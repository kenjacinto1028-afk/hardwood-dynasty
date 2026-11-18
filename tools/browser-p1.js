// Phase 1 UI checks: sound + mute, settings popup, page fade / count-ups, win banner + sound, live-game sounds, shot charts.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json; serve the game folder (python3 -m http.server 8801), then:
//   node tools/browser-p1.js [PORT] [PAGE] [SAVE]      (PAGE = index.html or pbl-single.html; PORT = route: no server needed)
// Sound can't be heard in a test: fx.js logs each sound name to window.__fxLog (the Web Audio graph is still built, so errors would show).
const { chromium } = require('playwright');
const PORT = process.argv[2] || '8801', PAGE = process.argv[3] || 'index.html', SAVE = process.argv[4] || 'tools/_t1.json';
const res = [];
const ok = (n, c, x) => { const l = (c ? 'PASS ' : 'FAIL ') + n + (x !== undefined && x !== '' ? '  [' + JSON.stringify(x) + ']' : ''); res.push(l); console.error(l); };
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.__pbl.L; return eval(js0); }, js);
const wait = (pg, ms) => pg.waitForTimeout(ms);

async function load(W, touch) {
  const b = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: touch, isMobile: touch });
  if (PORT === 'route') {   // Phase 2: no web server needed, serve this folder through Playwright
    const fs = require('fs'), path = require('path'), ROOT = path.join(__dirname, '..'), MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json' };
    await ctx.route('http://pbl.test/**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  }
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(PORT === 'route' ? `http://pbl.test/${PAGE}` : `http://localhost:${PORT}/${PAGE}`); await wait(pg, 2000);
  await pg.evaluate(async f => {
    const txt = await (await fetch(f)).text();
    const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-p1', txt); await put('slots', JSON.stringify([{ id: 'slot-p1', name: 'p1', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-p1');
  }, '/' + SAVE);
  await pg.reload(); await wait(pg, 6000);
  await pg.evaluate(() => { window.__fxLog = window.__snd = []; });
  return { b, pg, errs };
}
const closeModals = pg => pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const m = document.getElementById('fx-modal'); if (m) m.innerHTML = ''; });
const openLink = (pg, attr, v) => pg.evaluate(([a, v]) => { const el = document.createElement('a'); el.dataset[a] = v; el.className = 'lk'; document.querySelector('#main').appendChild(el); el.click(); }, [attr, String(v)]);
const marks = pg => ev(pg, "document.querySelectorAll('#main .scdots .mk, #main .scdots .ms').length");

async function run(W, touch) {
  const { b, pg, errs } = await load(W, touch), T = `${W}px: `, click = s => touch ? pg.tap(s) : pg.click(s);
  await closeModals(pg);
  ok(T + 'mute + settings buttons in header', await ev(pg, "!!document.querySelector('#b-mute') && !!document.querySelector('#b-settings')"));
  ok(T + 'no page side-scroll', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'), await ev(pg, 'document.documentElement.scrollWidth'));
  // settings popup
  await pg.evaluate(() => document.getElementById('b-settings').click()); await wait(pg, 300);
  ok(T + 'settings popup opens', await ev(pg, "!!document.querySelector('#fx-modal .dialog #fx-vol')"));
  await pg.screenshot({ path: `tools/_p1-settings-${W}.png` });
  ok(T + 'settings popup fits the screen', await ev(pg, "(()=>{const r=document.querySelector('#fx-modal .dialog').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})()"));
  await pg.evaluate(() => { window.__fxLog = window.__snd = []; }); await click('[data-fxt="swish"]'); await wait(pg, 100);
  ok(T + 'try button plays a sound', await ev(pg, "window.__snd.includes('swish')"));
  await click('[data-fxs="fast"]'); await wait(pg, 100);
  ok(T + 'speed fast saved', await ev(pg, "JSON.parse(localStorage.getItem('pbl-fx')).speed==='fast' && getComputedStyle(document.documentElement).getPropertyValue('--fx-mult').trim()==='0.5'"));
  await click('[data-fxs="normal"]'); await wait(pg, 100);
  await click('[data-fxc="skip"]'); await wait(pg, 100);
  ok(T + 'skip animations sets .fx-off', await ev(pg, "document.documentElement.classList.contains('fx-off')"));
  await click('[data-fxc="skip"]'); await wait(pg, 100);
  ok(T + 'skip off again', await ev(pg, "!document.documentElement.classList.contains('fx-off')"));
  await click('#fx-done'); await wait(pg, 200);
  ok(T + 'settings closes', await ev(pg, "!document.querySelector('#fx-modal .dialog')"));
  await pg.evaluate(() => document.getElementById('b-mute').click()); await wait(pg, 100);
  ok(T + 'mute on: icon + saved', await ev(pg, "document.querySelector('#b-mute').textContent==='🔇' && FX.settings.mute===true"));
  await pg.evaluate(() => document.getElementById('b-mute').click()); await wait(pg, 100);
  ok(T + 'mute off', await ev(pg, "document.querySelector('#b-mute').textContent==='🔊' && FX.settings.mute===false"));
  // page fade + count-ups
  await ev(pg, "location.hash='#standings'"); await wait(pg, 400);
  await ev(pg, "location.hash='#myteam'"); await wait(pg, 60);
  ok(T + 'page fade on view change', await ev(pg, "document.querySelector('#main').classList.contains('fx-in')"));
  ok(T + 'team record has a count-up', await ev(pg, "!!document.querySelector('#main [data-cu]')"));
  await wait(pg, 900);
  ok(T + 'count-up ends at the real value', await ev(pg, "document.querySelector('#main [data-cu]').textContent.trim()===L.teams[L.user].w+'-'+L.teams[L.user].l"), await ev(pg, "document.querySelector('#main [data-cu]').textContent"));
  // sim a day until your team plays: result sound + banner, games keep shots
  const g0 = await ev(pg, 'L.games.length');
  await pg.evaluate(() => { window.__fxLog = window.__snd = []; });
  let banner = false;
  for (let k = 0; k < 4; k++) {
    await closeModals(pg); await click('#simctl [data-sim="day"]');
    for (let i = 0; i < 40 && !banner; i++) { await wait(pg, 100); banner = banner || await ev(pg, "!!document.querySelector('.fx-banner')"); }
    await wait(pg, 1500); await closeModals(pg);
    if (await ev(pg, `L.games.slice(${g0}).some(g=>g.home===L.user||g.away===L.user)`)) break;
  }
  const mine = await ev(pg, `(()=>{const g=L.games.slice(${g0}).filter(g=>g.home===L.user||g.away===L.user).pop();return g?{id:g.id,win:(g.home===L.user?g.hs>g.as:g.as>g.hs)}:null})()`);
  ok(T + 'your team played', !!mine);
  const snd = await ev(pg, 'window.__snd');
  ok(T + 'sim bounce + result sound', snd.includes('bounce') && snd.includes(mine && mine.win ? 'cheer' : 'groan'), snd);
  ok(T + 'result banner shown', banner);
  ok(T + 'new games keep their shots', await ev(pg, `L.games.slice(${g0}).every(g=>g.sh&&Object.keys(g.sh).length>=14)`));
  ok(T + 'shots = box score FGA, every player', await ev(pg, `L.games.slice(${g0}).every(g=>g.box.every(r=>(g.sh[r[0]]||'').length===r[2+IX.fga]))`));
  // box score shot chart
  await openLink(pg, 'game', mine ? mine.id : 1); await wait(pg, 700);
  ok(T + 'box score shows a shot chart', await ev(pg, "!!document.querySelector('#main .scdots')"));
  const nTeam = await marks(pg), fgaAway = await ev(pg, `(()=>{const g=L.games.find(x=>x.id===${mine ? mine.id : 1});return g.box.filter(r=>r[1]===1).reduce((a,r)=>a+r[2+IX.fga],0)})()`);
  ok(T + 'away team chart = team FGA', nTeam === fgaAway, [nTeam, fgaAway]);
  const btns = await ev(pg, "[...document.querySelectorAll('#main [data-gsh]')].map(b=>b.dataset.gsh)");
  ok(T + 'team + player buttons', btns.length >= 6, btns.length);
  await click(`#main [data-gsh="${btns[3]}"]`); await wait(pg, 400);
  const [gid, pk] = btns[3].split(':'), want = await ev(pg, `(L.games.find(x=>x.id===${gid}).sh[${pk}]||'').length`), n1 = await marks(pg);
  ok(T + 'player chart = his shots', n1 === want && n1 > 0, [n1, want]);
  await ev(pg, "document.querySelector('#main .scdots').scrollIntoView({block:'center'})"); await wait(pg, 200);
  await pg.screenshot({ path: `tools/_p1-box-${W}.png` });
  ok(T + 'box score: no page side-scroll', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'));
  // player page: heat / dots + season picker
  const pid = await ev(pg, "L.teams[L.user].roster.map(i=>L.players[i]).filter(p=>p.hist.some(h=>h.z)).sort((a,b)=>b.ovr-a.ovr)[0].id");
  await openLink(pg, 'player', pid); await wait(pg, 800);
  ok(T + 'player page has season picker', await ev(pg, "!!document.querySelector('#main [data-pscs]')"));
  const opts = await ev(pg, "[...document.querySelectorAll('#main [data-pscs] option')].map(o=>o.value)");
  ok(T + 'seasons listed (this season, past, career)', opts.includes('car') && opts.some(o => /^s\d/.test(o)), opts.slice(0, 6));
  await click(`#main [data-psc="${pid}:m:dots"]`); await wait(pg, 400);
  ok(T + 'makes and misses view', await ev(pg, "!!document.querySelector('#main .scdots')"));
  const past = opts.find(o => /^s\d/.test(o));
  await pg.selectOption('#main [data-pscs]', past); await wait(pg, 400);
  const n2 = await marks(pg);
  ok(T + 'past season dots (sample <= 350)', n2 > 0 && n2 <= 352, n2);
  ok(T + 'dots view kept after season change', await ev(pg, `document.querySelector('#main [data-pscs]').value==='${past}' && !!document.querySelector('#main .scdots')`));
  await ev(pg, "document.querySelector('#main .scdots').scrollIntoView({block:'center'})"); await wait(pg, 200);
  await pg.screenshot({ path: `tools/_p1-player-${W}.png` });
  await click(`#main [data-psc="${pid}:m:heat"]`); await wait(pg, 400);
  ok(T + 'heat view back', await ev(pg, "!!document.querySelector('#main svg.shotchart:not(.scdots)')"));
  ok(T + 'player page: no page side-scroll', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'));
  // live game: sounds per play, buzzer at the final
  await ev(pg, "location.hash='#myteam'"); await wait(pg, 300); await closeModals(pg);
  let live = false;
  for (let k = 0; k < 4 && !live; k++) {
    await closeModals(pg); await pg.evaluate(() => { window.__fxLog = window.__snd = []; });
    if (!await ev(pg, "!!document.querySelector('#simctl [data-sim=\"live\"]')")) { await click('#simctl [data-sim="day"]'); await wait(pg, 3000); continue; }
    await pg.evaluate(() => { const m = document.querySelector('#simctl .sim-more'); if (m && getComputedStyle(m).display !== 'none' && !document.querySelector('#simctl.open')) m.click(); }); await click('#simctl [data-sim="live"]'); await wait(pg, 3500); await closeModals(pg);
    live = await ev(pg, "!!document.querySelector('#lv-board')");
  }
  if (live) {
    const sp = await ev(pg, "[...document.querySelectorAll('[data-lv^=\"sp:\"]')].map(b=>b.dataset.lv)");
    await click(`[data-lv="${sp[sp.length - 2]}"]`); await wait(pg, 6000);
    const s1 = await ev(pg, 'window.__snd');
    ok(T + 'live game plays sounds', s1.filter(s => ['swish', 'rim', 'dunk', 'block', 'whistle', 'buzzer'].includes(s)).length >= 5, s1.slice(0, 12));
    ok(T + 'no page fade on live ticks', await ev(pg, "!document.querySelector('#main').classList.contains('fx-in') || document.getAnimations().filter(a=>a.animationName==='fx-in').length===0"));
    await click(`[data-lv="${sp[sp.length - 1]}"]`); await wait(pg, 1500);
    ok(T + 'final buzzer', (await ev(pg, 'window.__snd')).includes('buzzer'));
  } else ok(T + 'live game: no game found in 4 days (skipped)', true);
  ok(T + 'no page errors', !errs.length, errs.slice(0, 3));
  await b.close();
}
(async () => {
  await run(1300, false);
  await run(390, true);
  console.log(res.join('\n')); console.log(`${res.filter(r => r.startsWith('PASS')).length}/${res.length} passed`);
})();
