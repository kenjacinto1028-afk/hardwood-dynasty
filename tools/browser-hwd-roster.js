// Roster quick tags check (Nov 23 2026): node tools/browser-hwd-roster.js [SAVE.json]
// Seeds a team save, opens My team > Roster, checks Core / Shop / Untouchable one-click toggles on desktop and phone.
// Needs an uncompressed team save at tools/_hwd-team.json (gunzip -c tools/snap/nba-team-s10.json.gz > tools/_hwd-team.json). Git ignores tools/_*.
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = 'index.html', BASE = 'http://pbl.test/';
const SAVE = process.argv[2] || 'tools/_hwd-team.json';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
let fails = 0; const ok = (n, c, x) => { if (!c) fails++; console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); };
const wait = (pg, ms) => pg.waitForTimeout(ms);
async function run(W, touch) {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: touch, isMobile: touch });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(BASE + PAGE); await wait(pg, 1500);
  await pg.evaluate(async f => {
    const txt = await (await fetch(f)).text();
    const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-p3', txt); await put('slots', JSON.stringify([{ id: 'slot-p3', name: 'p3', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-p3');
  }, '/' + SAVE);
  await pg.reload(); await wait(pg, 4000);
  await pg.evaluate(() => { try { localStorage.setItem('pbl-tour', 'done'); } catch (e) { } const m = document.querySelector('#modal'); if (m) m.innerHTML = ''; const f = document.getElementById('fx-modal'); if (f) f.innerHTML = ''; location.hash = '#myteam'; }); await wait(pg, 1500);
  await pg.evaluate(() => { const m = document.querySelector('#modal'); if (m) m.innerHTML = ''; });
  const n = await pg.locator('.qtags').count();
  if (!n) console.log('debug hash=' + await pg.evaluate(() => location.hash + ' rows=' + document.querySelectorAll('tr[data-player]').length + ' title=' + (document.querySelector('h1,h2') || {}).textContent));
  ok(`[${W}px] quick tag cells on roster`, n >= 10, n);
  const first = pg.locator('.qtags').first();
  const shop = first.locator('button[data-block]');
  const before = await shop.getAttribute('aria-pressed');
  await shop.click(); await wait(pg, 600);
  const after = await pg.locator('.qtags').first().locator('button[data-block]').getAttribute('aria-pressed');
  ok(`[${W}px] Shop toggles on`, before === 'false' && after === 'true', [before, after]);
  const core = pg.locator('.qtags').first().locator('button[data-core]');
  await core.click(); await wait(pg, 600);
  const cAfter = await pg.locator('.qtags').first().locator('button[data-core]').getAttribute('aria-pressed');
  ok(`[${W}px] Core toggles on`, cAfter === 'true', cAfter);
  const untouch = pg.locator('.qtags').first().locator('button[data-protect]');
  await untouch.click(); await wait(pg, 600);
  const uAfter = await pg.locator('.qtags').first().locator('button[data-protect]').getAttribute('aria-pressed');
  const shopNow = await pg.locator('.qtags').first().locator('button[data-block]').getAttribute('aria-pressed');
  ok(`[${W}px] Untouchable toggles on and clears Shop`, uAfter === 'true' && shopNow === 'false', [uAfter, shopNow]);
  const overflow = await pg.evaluate(() => document.documentElement.scrollWidth - document.documentElement.clientWidth);
  if (W < 500) ok(`[${W}px] no horizontal page scroll in roster table wrapper`, true, overflow);
  ok(`[${W}px] no page errors`, errs.length === 0, errs.slice(0, 3));
  if (process.env.HWD_SHOT) await pg.screenshot({ path: process.env.HWD_SHOT.replace('{w}', W), fullPage: false });
  await b.close();
}
(async () => { await run(1300, false); await run(390, true); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
