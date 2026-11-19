// v35: archetypes + playstyle + superstar badge on the player page, roster rows, type filter; old save migrates. Desktop + phone.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then: SHOTS=dir node tools/browser-arch.js [PAGE]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', SAVE = 'tools/_t1.json', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.error((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); };
const wait = (pg, ms) => pg.waitForTimeout(ms);
async function run(W, touch) {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 800 }, hasTouch: touch, isMobile: touch });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(BASE + PAGE); await wait(pg, 1500);
  await pg.evaluate(async f => {
    const txt = await (await fetch(f)).text();
    const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-bs', txt); await put('slots', JSON.stringify([{ id: 'slot-bs', name: 'bs', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-bs');
  }, '/' + SAVE);
  await pg.reload(); await wait(pg, 5000);
  const close = () => pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const m = document.getElementById('fx-modal'); if (m) m.innerHTML = ''; });
  await close();
  const tag = W + 'px';
  const go = async (setup, arg) => { await pg.evaluate(setup, arg); await wait(pg, 900); await close(); };
  const L0 = await pg.evaluate(() => { const L = window.__pbl.L, ps = Object.values(L.players).filter(p => !p.retired && p.team != null);
    return { mig: L.arch35, star: (ps.find(p => p.sarch) || {}).id, old: ps.filter(p => (p.arch || []).some(a => ['Pass-first', 'Stretch four', 'Shooting', 'All-around'].includes(a.n))).length, mine: ps.find(p => p.team === L.user && playstyle(p).length) }; });
  ok(tag + ' old save migrated (no old type names left)', L0.mig === 1 && L0.old === 0, L0.old);
  ok(tag + ' league has a superstar', L0.star != null);
  await go(id => { const u = window.__pbl.ui; u.game = u.coach = u.gm = u.team = null; u.player = id; window.__pbl.render(); }, L0.star);
  const pp = await pg.evaluate(() => { const b = document.querySelector('#main .sstar'); return b ? b.textContent : null; });
  ok(tag + ' player page shows superstar badge', !!pp, pp);
  await pg.screenshot({ path: path.join(SHOTS, `arch-player-${W}.png`) });
  if (L0.mine) { await go(id => { const u = window.__pbl.ui; u.player = id; window.__pbl.render(); }, L0.mine.id);
    const ps = await pg.evaluate(() => { const e = document.querySelector('#main .psty'); return e ? e.textContent : null; });
    ok(tag + ' player page shows playstyle', !!ps, ps); }
  await go(() => { const u = window.__pbl.ui; u.player = u.game = u.coach = u.gm = u.team = null; location.hash = '#myteam'; window.__pbl.render(); });
  const rt = await pg.evaluate(() => { const names = Object.values(ARCH).flatMap(o => Object.keys(o)); return [...document.querySelectorAll('#main td')].map(e => e.textContent).filter(x => names.some(n => x.includes(n))).slice(0, 4); });
  ok(tag + ' roster rows show archetype', rt.length > 0, rt);
  await pg.screenshot({ path: path.join(SHOTS, `arch-roster-${W}.png`) });
  await go(() => { const u = window.__pbl.ui; u.player = null; u.statTab = 'players'; location.hash = '#stats'; window.__pbl.render(); });
  const opt = await pg.evaluate(() => { const s = document.querySelector('#pfty'); return s ? [...s.querySelectorAll('optgroup')].map(g => g.label + ':' + g.children.length) : null; });
  ok(tag + ' type filter grouped (Superstars + 5 positions x 8)', opt && opt.length === 6 && opt.slice(1).every(x => /:8$/.test(x)), opt);
  ok(tag + ' no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
}
const SHOTS = process.env.SHOTS || '/tmp';
(async () => { await run(1280, false); await run(390, true); console.error(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
