// Phase 2 UI checks: animated live court, commentary ticker, top plays reel (+ My team strip, box score panel).
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then:
//   node tools/browser-p2.js [PAGE] [SAVE]      (PAGE = index.html or pbl-single.html)
// No web server needed: the page is served from this folder through Playwright (page.route).
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', SAVE = process.argv[3] || 'tools/_t1.json', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.gz': 'application/gzip' };
const res = [];
const ok = (n, c, x) => { const l = (c ? 'PASS ' : 'FAIL ') + n + (x !== undefined && x !== '' ? '  [' + JSON.stringify(x) + ']' : ''); res.push(l); console.error(l); };
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.__pbl.L, ui = window.__pbl.ui; return eval(js0); }, js);
const wait = (pg, ms) => pg.waitForTimeout(ms);
const closeModals = pg => pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const m = document.getElementById('fx-modal'); if (m) m.innerHTML = ''; });

async function load(W, touch) {
  const b = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: touch, isMobile: touch });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(BASE + PAGE); await wait(pg, 1500);
  await pg.evaluate(async f => {
    const txt = await (await fetch(f)).text();
    const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-p2', txt); await put('slots', JSON.stringify([{ id: 'slot-p2', name: 'p2', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-p2');
  }, '/' + SAVE);
  await pg.reload(); await wait(pg, 5000); await closeModals(pg);
  return { b, pg, errs };
}

async function run(W, touch) {
  const { b, pg, errs } = await load(W, touch), T = `${W}px: `, click = s => touch ? pg.tap(s) : pg.click(s);
  let live = false;
  for (let k = 0; k < 5 && !live; k++) {
    if (!await ev(pg, "!!document.querySelector('#simctl [data-sim=\"live\"]')")) { await click('#simctl [data-sim="day"]'); await wait(pg, 3000); await closeModals(pg); continue; }
    await pg.evaluate(() => { const m = document.querySelector('#simctl .sim-more'); if (m && getComputedStyle(m).display !== 'none' && !document.querySelector('#simctl.open')) m.click(); }); await click('#simctl [data-sim="live"]'); await wait(pg, 2500);
    live = await ev(pg, "!!document.querySelector('#lv-board')");
  }
  ok(T + 'live game opened', live);
  if (live) {
    await click('[data-lv="sp:16"]'); await wait(pg, 2500);
    const r = await ev(pg, "(()=>{const t=document.querySelector('.teamstats');return t?{rows:t.querySelectorAll('tbody tr').length,txt:t.innerText.slice(0,200)}:null})()");
    ok(T + 'live view shows team stats', r && r.rows >= 14, r);
    await pg.evaluate(() => document.querySelector('[data-lv="box"]').click()); await wait(pg, 5000);
  }
  const gid = await ev(pg, "(L.games.filter(g=>g.pbp).slice(-1)[0]||L.games.slice(-1)[0]).id");
  await pg.evaluate(id => { const el = document.createElement('a'); el.dataset.game = id; el.className = 'lk'; document.querySelector('#main').appendChild(el); el.click(); }, String(gid)); await wait(pg, 800);
  const r2 = await ev(pg, "(()=>{const t=document.querySelector('.teamstats');const g=L.games.find(x=>x.id===ui.game);if(!t||!g)return null;const pts=[...t.querySelectorAll('tbody tr')].map(tr=>[...tr.children].map(c=>c.textContent));return {rows:pts.length,first:pts[0],lead:pts.find(r=>r[1]==='Biggest lead'),as:g.as,hs:g.hs}})()");
  ok(T + 'result box score shows team stats', r2 && r2.rows >= 14, r2);
  if (process.env.SHOTS) await pg.screenshot({ path: `tools/_ts-${W}.png`, fullPage: false });
  ok(T + 'no page errors', errs.length === 0, errs.slice(0, 3));
  await b.close();
}
(async () => { await run(1280, false); await run(390, true); console.error(res.some(l => l.startsWith('FAIL')) ? 'SOME FAIL' : 'ALL PASS'); })();
