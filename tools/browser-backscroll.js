// Back arrow keeps scroll: My Team (scrolled down) -> News -> Back = same spot; player page -> Back too; Forward too. Desktop + phone.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then: node tools/browser-backscroll.js [PAGE]
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
  await pg.evaluate(() => { location.hash = '#myteam'; }); await wait(pg, 800); await close();
  // scroll to the rotation panel (or 1200px if not found)
  const y0 = await pg.evaluate(() => { const h = [...document.querySelectorAll('#main h2, #main h3, #main summary, #main button')].find(e => /rotation/i.test(e.textContent)); const t = h ? h.getBoundingClientRect().top + scrollY - 80 : 1200; scrollTo(0, Math.min(t, document.documentElement.scrollHeight - innerHeight)); return Math.round(scrollY); });
  await wait(pg, 300);
  ok(tag + ' scrolled down My Team', y0 > 300, y0);
  await pg.evaluate(() => { location.hash = '#news'; }); await wait(pg, 800); await close();
  ok(tag + ' News opens at top', await pg.evaluate(() => scrollY < 5));
  await pg.click('#b-back'); await wait(pg, 900);
  const y1 = await pg.evaluate(() => [location.hash, Math.round(scrollY)]);
  ok(tag + ' Back from News returns to My Team at same spot', y1[0] === '#myteam' && Math.abs(y1[1] - y0) < 5, { y0, got: y1 });
  await pg.click('#b-fwd'); await wait(pg, 900);
  const y2 = await pg.evaluate(() => [location.hash, Math.round(scrollY)]);
  ok(tag + ' Forward goes to News at top', y2[0] === '#news' && y2[1] < 5, y2);
  await pg.click('#b-back'); await wait(pg, 900);
  // open a player from the scrolled page, then Back
  const y3 = await pg.evaluate(() => Math.round(scrollY));
  const hit = await pg.evaluate(() => { const a = [...document.querySelectorAll('#main [data-player]')].find(e => { const r = e.getBoundingClientRect(); return r.top > 0 && r.bottom < innerHeight && r.width; }); if (!a) return false; a.click(); return true; });
  await wait(pg, 900); await close();
  ok(tag + ' opened a player page at top', hit && await pg.evaluate(() => window.__pbl.ui.player != null && scrollY < 5));
  await pg.click('#b-back'); await wait(pg, 900);
  const y4 = await pg.evaluate(() => [window.__pbl.ui.player, Math.round(scrollY)]);
  ok(tag + ' Back from player returns to same spot', y4[0] == null && Math.abs(y4[1] - y3) < 5, { y3, got: y4 });
  // a normal tab click still opens at the top
  await pg.evaluate(() => { location.hash = '#standings'; }); await wait(pg, 800);
  ok(tag + ' new page opens at top', await pg.evaluate(() => scrollY < 5));
  ok(tag + ' no page errors', !errs.length, errs.slice(0, 3));
  await b.close();
}
(async () => { await run(1280, false); await run(390, true); console.error(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
