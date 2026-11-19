// v39: trophy room history, News/History filters + sort, Team needs on Roster moves. Desktop + phone.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then: node tools/browser-hist39.js [PAGE]
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
  // 1. trophy room
  await go(() => { const u = window.__pbl.ui; const L = window.__pbl.L; u.p3trT = L.teams.findIndex(t => (t.nbaAb || t.abbr) === 'BOS'); location.hash = '#trophies'; window.__pbl.render(); });
  const tr = await pg.evaluate(() => { const v = [...document.querySelectorAll('#main .p3-trsum .v')].map(x => +x.textContent); return { sum: v, banners: document.querySelectorAll('#main .p3-banner').length, cups: document.querySelectorAll('#main .p3-shelf .p3-tr').length, jer: document.querySelectorAll('#main .p3-jersey').length }; });
  ok(tag + ' BOS trophy room has history titles (18+)', tr.sum[0] >= 18, tr);
  ok(tag + ' BOS has player awards + retired numbers', tr.sum[2] > 5 && tr.jer > 10, tr);
  await go(() => { window.__pbl.ui.p3trA = 'mvp'; window.__pbl.render(); });
  ok(tag + ' award filter MVP only', await pg.evaluate(() => document.querySelector('#main [data-p3tra]').closest('.seg').nextElementSibling.querySelectorAll('figcaption').length > 0 && [...document.querySelector('#main [data-p3tra]').closest('.seg').nextElementSibling.querySelectorAll('figcaption')].every(f => /^MVP/.test(f.textContent))));
  await go(() => { window.__pbl.ui.p3trE = 'league'; window.__pbl.ui.p3trA = ''; window.__pbl.render(); });
  ok(tag + ' era filter league-only drops history', await pg.evaluate(() => +document.querySelector('#main .p3-trsum .v').textContent < 18));
  await go(() => { window.__pbl.ui.p3trE = ''; window.__pbl.ui.p3trT = 'all'; window.__pbl.render(); });
  ok(tag + ' league table lists 30 teams', await pg.evaluate(() => document.querySelectorAll('#main table[data-sid="trophy-lg"] tbody tr').length === 30));
  await pg.screenshot({ path: 'tools/_trophy-lg-' + W + '.png', fullPage: false });
  await go(() => { window.__pbl.ui.p3trT = window.__pbl.L.teams.findIndex(t => (t.nbaAb || t.abbr) === 'LAL'); window.__pbl.render(); });
  await pg.screenshot({ path: 'tools/_trophy-' + W + '.png', fullPage: false });
  ok(tag + ' no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
}
(async () => { await run(1280, false); await run(390, true); console.error(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
