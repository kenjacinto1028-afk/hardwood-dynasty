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
  // 2. News table: sort + filters
  await go(() => { const u = window.__pbl.ui; u.p3trT = null; u.ncat = ''; location.hash = '#news'; window.__pbl.render(); });
  const nw = await pg.evaluate(() => { const tb = document.querySelector('#main table[data-sid="news"]'); return tb && { rows: tb.tBodies[0].rows.length, bar: !!document.querySelector('#main [data-gfbar="news"]'), sels: document.querySelectorAll('#main [data-gfbar="news"] select').length }; });
  ok(tag + ' news is a table with a filter bar', nw && nw.rows > 10 && nw.bar && nw.sels >= 1, nw);
  await pg.evaluate(() => { const s = document.querySelector('#main [data-gfbar="news"] select'); s.value = s.options[1].value; s.dispatchEvent(new Event('change')); }); await wait(pg, 300);
  const nf = await pg.evaluate(() => { const tb = document.querySelector('#main table[data-sid="news"]'); const vis = [...tb.tBodies[0].rows].filter(r => r.style.display !== 'none').length; return { vis, all: tb.tBodies[0].rows.length, txt: document.querySelector('#main [data-gfn]').textContent }; });
  ok(tag + ' news dropdown filters rows', nf.vis > 0 && nf.vis < nf.all && /of/.test(nf.txt), nf);
  await pg.evaluate(() => { const i = document.querySelector('#main [data-gfbar="news"] [data-gfq]'); i.value = 'zzzzqqq'; i.dispatchEvent(new Event('input')); }); await wait(pg, 200);
  ok(tag + ' news search hides all rows', await pg.evaluate(() => [...document.querySelector('#main table[data-sid="news"]').tBodies[0].rows].every(r => r.style.display === 'none')));
  await pg.evaluate(() => document.querySelector('#main [data-gfx]').click()); await wait(pg, 500);
  ok(tag + ' Clear resets filters', await pg.evaluate(() => [...document.querySelector('#main table[data-sid="news"]').tBodies[0].rows].every(r => r.style.display !== 'none')));
  await pg.evaluate(() => [...document.querySelectorAll('#main table[data-sid="news"] thead th')][3].click()); await wait(pg, 600);
  ok(tag + ' news sorts by Team', await pg.evaluate(() => { const v = [...document.querySelector('#main table[data-sid="news"]').tBodies[0].rows].map(r => r.cells[3].textContent.trim()).filter(x => x !== '—'); return v.length > 2 && v.every((x, i) => !i || v[i - 1].toLowerCase().localeCompare(x.toLowerCase()) <= 0); }));
  await pg.screenshot({ path: 'tools/_news-' + W + '.png', fullPage: false });
  // 3. History tabs: every table sortable, big ones filterable
  for (const ht of ['seasons', 'book', 'awards', 'greats', 'records', 'legends', 'dyn', 'ach']) {
    await go(h => { const u = window.__pbl.ui; u.histTab = h; u.hs = null; location.hash = '#history'; window.__pbl.render(); }, ht);
    const r = await pg.evaluate(() => { const t = [...document.querySelectorAll('#main table')]; return { tables: t.length, sortable: t.filter(x => x.classList.contains('sortable')).length, bars: document.querySelectorAll('#main [data-gfbar]').length }; });
    ok(tag + ' history/' + ht + ' tables sortable + filters', r.tables === 0 || (r.sortable > 0 && r.bars > 0), r);
  }
  await go(() => { const u = window.__pbl.ui; u.histTab = 'seasons'; window.__pbl.render(); });
  await pg.screenshot({ path: 'tools/_hist-' + W + '.png', fullPage: false });
  // 4. Team needs window on Roster moves
  await go(() => { const u = window.__pbl.ui; u.rmTab = 'mine'; location.hash = '#rmoves'; window.__pbl.render(); });
  const rn = await pg.evaluate(() => { const w = document.querySelector('#main #rmneeds'); return w && { txt: w.textContent.slice(0, 80), pos: w.querySelectorAll('tbody tr').length, needs: w.querySelectorAll('.need').length + w.querySelectorAll('p.muted').length }; });
  ok(tag + ' My team tab shows Team needs window with 5 positions', rn && rn.pos === 5 && /Team needs/.test(rn.txt), rn);
  await pg.screenshot({ path: 'tools/_needs-' + W + '.png', fullPage: false });
  await go(() => { const u = window.__pbl.ui; u.rmTab = 'league'; window.__pbl.render(); });
  await pg.evaluate(() => { const s = document.querySelector('#rm-needteam'); s.value = '5'; s.dispatchEvent(new Event('change', { bubbles: true })); }); await wait(pg, 600);
  ok(tag + ' League tab team picker switches team', await pg.evaluate(() => window.__pbl.ui.rmNeedT === 5 && document.querySelector('#rmneeds h3').textContent.includes(window.__pbl.L.teams[5].name)));
  ok(tag + ' no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
}
(async () => { await run(1280, false); await run(390, true); console.error(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
