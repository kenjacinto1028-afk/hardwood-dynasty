// v38: T / S / A / Eye buttons on draft board + class list, Eye on League > Players and Stats > Players, Hardwood Dynasty name. Desktop + phone.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then: node tools/browser-qtags.js [PAGE]
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
  const tag = W + 'px', P = window => 0;
  ok(tag + ' title + header say Hardwood Dynasty', await pg.evaluate(() => /Hardwood Dynasty/.test(document.title) && document.getElementById('brandname').textContent === 'Hardwood Dynasty'));
  const go = async (setup) => { await pg.evaluate(setup); await wait(pg, 900); await close(); };
  for (const dtab of ['board', 'cons']) {
    await go(dt => { const u = window.__pbl.ui; u.dpage = 'cls'; u.dtab = dt; location.hash = '#draft'; window.__pbl.render(); }, dtab);
    await pg.evaluate(dt => { const u = window.__pbl.ui; u.dpage = 'cls'; u.dtab = dt; window.__pbl.render(); }, dtab); await wait(pg, 500);
    const info = await pg.evaluate(() => { const r = document.querySelector('#main tr[data-player] .qtags'); if (!r) return null; return { pid: +r.closest('tr').dataset.player, btns: [...r.querySelectorAll('button')].map(b => b.textContent.trim() || (b.querySelector('svg') ? 'EYE' : '')) }; });
    ok(tag + ' ' + dtab + ': row has T S A Eye', info && info.btns.join(',') === 'T,S,A,EYE', info);
    if (!info) continue;
    const pid = info.pid;
    const vis = await pg.evaluate(id => { const b = document.querySelector(`#main tr[data-player="${id}"] .qtags [data-ptv="target"]`); const r = b.getBoundingClientRect(); return r.width > 10 && r.height > 10; }, pid);
    ok(tag + ' ' + dtab + ': T button visible', vis);
    await pg.evaluate(id => document.querySelector(`#main tr[data-player="${id}"] .qtags [data-ptv="target"]`).click(), pid); await wait(pg, 500);
    ok(tag + ' ' + dtab + ': T tags Target and stays on page', await pg.evaluate(id => window.__pbl.L.ptag && window.__pbl.L.ptag[id] === 'target' && window.__pbl.ui.player == null && location.hash === '#draft', pid));
    await pg.evaluate(id => document.querySelector(`#main tr[data-player="${id}"] .qtags [data-ptv="sleeper"]`).click(), pid); await wait(pg, 500);
    ok(tag + ' ' + dtab + ': S switches to Sleeper, button lit', await pg.evaluate(id => window.__pbl.L.ptag[id] === 'sleeper' && document.querySelector(`#main tr[data-player="${id}"] .qtags [data-ptv="sleeper"]`).classList.contains('on'), pid));
    await pg.evaluate(id => document.querySelector(`#main tr[data-player="${id}"] .qtags [data-ptv="sleeper"]`).click(), pid); await wait(pg, 500);
    ok(tag + ' ' + dtab + ': S again removes the tag', await pg.evaluate(id => !window.__pbl.L.ptag[id], pid));
    await pg.evaluate(id => document.querySelector(`#main tr[data-player="${id}"] .qtags [data-ptv="avoid"]`).click(), pid); await wait(pg, 500);
    ok(tag + ' ' + dtab + ': A tags Avoid', await pg.evaluate(id => window.__pbl.L.ptag[id] === 'avoid', pid));
    const w0 = await pg.evaluate(id => (window.__pbl.L.watch || []).includes(id), pid);
    await pg.evaluate(id => document.querySelector(`#main tr[data-player="${id}"] .qtags [data-watch]`).click(), pid); await wait(pg, 500);
    ok(tag + ' ' + dtab + ': Eye toggles watch list', await pg.evaluate(([id, w]) => document.querySelector(`#main tr[data-player="${id}"] .qtags [data-watch]`).classList.contains('on') !== w, [pid, w0]));
  }
  for (const [nm, setup] of [['League > Players', () => { location.hash = '#players'; }], ['Stats > Players', () => { window.__pbl.ui.statTab = 'players'; window.__pbl.ui.pAll = true; location.hash = '#stats'; window.__pbl.render(); }]]) {
    await go(setup); await go(setup);
    const pid = await pg.evaluate(() => { const b = [...document.querySelectorAll('#main tr[data-player] .qtag.eye')].find(b => !b.classList.contains('on')); return b ? +b.dataset.watch : null; });
    ok(tag + ' ' + nm + ': rows have an Eye button', pid != null, await pg.evaluate(() => [location.hash, document.querySelectorAll('#main tr[data-player]').length, window.__pbl.L.phase, (document.querySelector('#main tr[data-player]') || {}).outerHTML && document.querySelector('#main tr[data-player]').outerHTML.slice(0, 200)]));
    if (pid == null) continue;
    await pg.evaluate(id => document.querySelector(`#main .qtag.eye[data-watch="${id}"]`).click(), pid); await wait(pg, 600);
    ok(tag + ' ' + nm + ': Eye adds to watch list, stays on list', await pg.evaluate(id => document.querySelector(`#main .qtag.eye[data-watch="${id}"]`).classList.contains('on') && window.__pbl.ui.player == null, pid));
    await pg.evaluate(id => document.querySelector(`#main .qtag.eye[data-watch="${id}"]`).click(), pid); await wait(pg, 600);
    ok(tag + ' ' + nm + ': Eye again removes him', await pg.evaluate(id => !document.querySelector(`#main .qtag.eye[data-watch="${id}"]`).classList.contains('on'), pid));
  }
  if (W === 1280) await pg.screenshot({ path: 'tools/_qtags.png' });
  await go(() => { const u = window.__pbl.ui; u.dpage = 'cls'; u.dtab = 'board'; location.hash = '#draft'; window.__pbl.render(); }); await pg.evaluate(() => { const t = document.querySelector('#main .qtags'); if (t) t.scrollIntoView({ block: 'center', inline: 'center' }); }); await pg.screenshot({ path: 'tools/_qtags-board-' + W + '.png' });
  ok(tag + ' no page errors', !errs.length, errs.slice(0, 3));
  await b.close();
}
(async () => { await run(1280, false); await run(390, true); console.error(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
