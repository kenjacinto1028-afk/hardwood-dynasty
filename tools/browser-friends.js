// Friendships check (Nov 20 2026): Friends panel on a player page, Friendships in team chemistry; 1300 + 390 px.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then: node tools/browser-friends.js
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
    const pid = await ev(pg, "(() => { const p = Object.values(L.players).find(p => !p.retired && p.team === L.user && friendsOf(L, p).length) || Object.values(L.players).find(p => !p.retired && p.team != null && friendsOf(L, p).some(x => x.f.duo)); return p.id; })()");
    await pg.evaluate(id => window.__pbl.openPlayer(id), pid); await wait(pg, 1200);
    ok(W + ': Friends panel on player page', await ev(pg, "[...document.querySelectorAll('#main section h3')].some(h => h.textContent === 'Friends') && !!document.querySelector('.fr-tag')"));
    { const h = await pg.$$('#main section.panel'); for (const s of h) if (/^Friends/.test(await s.evaluate(e => (e.querySelector('h3') || {}).textContent || ''))) { await s.screenshot({ path: path.join(ROOT, 'tools', '_fr-player-' + W + '.png') }); break; } }
    const tid = await ev(pg, `L.players[${pid}].team`);
    await pg.evaluate(t => { const ui = window.__pbl.ui; ui.player = null; ui.team = t; ui.twin = Object.assign(ui.twin || {}, { chem: 'Team chemistry' }); window.__pbl.render(); }, tid); await wait(pg, 1200);
        ok(W + ': team chemistry lists friendships', await ev(pg, "/Friendships/.test(document.querySelector('#main').innerHTML) && !!document.querySelector('#main .fr-tag')"));
    { const s = await pg.$('.twbody .fr-tag'); if (s) { const p = await s.evaluateHandle(e => e.closest('section')); await p.asElement().screenshot({ path: path.join(ROOT, 'tools', '_fr-team-' + W + '.png') }); } }
    ok(W + ': no page errors', errs.length === 0, errs.slice(0, 2));
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
