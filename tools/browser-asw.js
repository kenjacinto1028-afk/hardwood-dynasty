// All-Star Weekend check (Nov 20 2026): contests panel on Awards tab, popup with your winner; 1300 + 390 px.
// node tools/asw-save.js (saves tools/_t1.json just past All-Star day), then: node tools/browser-asw.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const wait = (pg, ms) => pg.waitForTimeout(ms);
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.__pbl.L, ui = window.__pbl.ui; return eval(js0); }, js);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  for (const W of [1300, 390]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 }, isMobile: W < 500, hasTouch: W < 500 });
    await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
    const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto(BASE + 'index.html'); await wait(pg, 1500);
    await pg.evaluate(async f => { const txt = await (await fetch(f)).text(); const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
      const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
      await put('league:slot-c', txt); await put('slots', JSON.stringify([{ id: 'slot-c', name: 'c', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-c'); }, '/tools/_t1.json');
    await pg.reload(); await wait(pg, 5000);
    const close = () => pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const m = document.getElementById('fx-modal'); if (m) m.innerHTML = ''; });
    await close();
    ok(W + ': contests saved', await ev(pg, "!!(L.allStar && L.allStar.contests && L.allStar.contests.three && L.allStar.contests.dunk && L.allStar.contests.skills)"));
    await pg.evaluate(() => { const ui = window.__pbl.ui; ui.player = null; ui.team = null; ui.view = 'awards'; window.__pbl.render(); }); await wait(pg, 1200);
    ok(W + ': Awards tab shows 3 contest cards', await ev(pg, "document.querySelectorAll('#main .asw-card').length === 3"));
    ok(W + ': no horizontal page scroll', await ev(pg, "document.documentElement.scrollWidth <= window.innerWidth + 1"), await ev(pg, "document.documentElement.scrollWidth"));
    await pg.evaluate(() => document.querySelectorAll('#main .asw-card details').forEach(d => d.open = true)); await wait(pg, 300);
    { const s = await pg.$('#main .asw-grid'); if (s) { const p = await s.evaluateHandle(e => e.closest('section')); await p.asElement().screenshot({ path: path.join(ROOT, 'tools', '_asw-awards-' + W + '.png') }); } }
    await ev(pg, "(() => { const p = Object.values(L.players).find(p => !p.retired && p.team === L.user); L.allStar.contests.dunk.win = p.id; window.__pbl.allStarDialog(); return 1; })()"); await wait(pg, 900);
    ok(W + ': popup shows your winner', await ev(pg, "!!document.querySelector('.asw-yours') && document.querySelectorAll('.asw-card').length >= 3"));
    { const m = await pg.$('#modal .modal, #modal > *'); if (m) await m.screenshot({ path: path.join(ROOT, 'tools', '_asw-popup-' + W + '.png') }); }
    ok(W + ': no page errors', errs.length === 0, errs.slice(0, 2));
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
