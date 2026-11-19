// Real top-100 NBA single-game records (History > League records > Single game > Top 100). Desktop + phone.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then: node tools/browser-recgame.js [PAGE]
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
  await pg.evaluate(() => { const u = window.__pbl.ui; u.histTab = 'records'; u.recTab = 'game'; location.hash = '#history'; window.__pbl.render(); }); await wait(pg, 1500); await close();
  await pg.evaluate(() => { const u = window.__pbl.ui; u.histTab = 'records'; u.recTab = 'game'; window.__pbl.render(); }); await wait(pg, 800);
  const btns = await pg.evaluate(() => [...document.querySelectorAll('#main [data-top100^="g-"]')].map(b => b.dataset.top100));
  ok(tag + ' Single game tab: Top 100 button on all 9 lists', btns.length === 9, btns);
  const want = { 'g-pts': ['Wilt Chamberlain', '100'], 'g-reb': ['Wilt Chamberlain', '55'], 'g-ast': ['Scott Skiles', '30'], 'g-stl': ['Kendall Gill', '11'], 'g-blk': ['Elmore Smith', '17'], 'g-tpm': ['Klay Thompson', '14'], 'g-ftm': ['Bam Adebayo', '36'], 'g-fgm': ['Wilt Chamberlain', '36'], 'g-orb': ['Zaza Pachulia', '18'] };
  for (const [id, [nm, v]] of Object.entries(want)) {
    await pg.evaluate(id => document.querySelector(`#main [data-top100="${id}"]`).click(), id); await wait(pg, 500);
    const r = await pg.evaluate(() => { const rows = [...document.querySelectorAll('#modal tbody tr')]; return { n: rows.length, first: rows[0] && rows[0].innerText, wide: document.documentElement.scrollWidth <= window.innerWidth + 1 }; });
    ok(`${tag} ${id}: 100 rows, #1 ${nm} ${v}`, r.n === 100 && r.first.includes(nm) && r.first.includes(v), r);
    ok(`${tag} ${id}: no sideways page scroll`, r.wide);
    if (W > 1000 && id === 'g-pts') await pg.screenshot({ path: path.join(ROOT, 'tools', '_recgame.png') });
    await close(); await wait(pg, 200);
  }
  ok(tag + ' no page errors', errs.length === 0, errs);
  await b.close();
}
(async () => { await run(1280, false); await run(390, true); console.error(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
