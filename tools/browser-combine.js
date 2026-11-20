// Draft combine check (Nov 20 2026): Draft > Combine page (sortable, filterable), prospect page block; 1300 + 390 px.
// node tools/browser-combine.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const wait = (pg, ms) => pg.waitForTimeout(ms);
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.__pbl.L; return eval(js0); }, js);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  for (const W of [1300, 390]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 }, isMobile: W < 500, hasTouch: W < 500, deviceScaleFactor: 1 });
    await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
    const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto(BASE + 'index.html'); await wait(pg, 2500);
    const shot = async n => { await pg.screenshot({ path: path.join(ROOT, 'tools', '_cmb-' + n + '-' + W + '.png'), fullPage: n === 'page' }); };
    await pg.click('[data-setsize="16"]'); await wait(pg, 300);
    await pg.click('[data-setmode=team]'); await wait(pg, 300);
    await pg.click('[data-setteam="3"]'); await wait(pg, 300);
    await pg.click('#create'); await wait(pg, 4000);
    await pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const t = document.getElementById('pb-tour'); if (t) t.remove(); });
    const clk = async sel => { await pg.evaluate(() => { const t = document.getElementById('pb-tour'); if (t) t.remove(); }); await pg.click(sel); };
    await ev(pg, "(() => { location.hash = '#draft'; window.__pbl.ui.dpage = 'cmb'; window.__pbl.ui.cls = L.season; window.__pbl.render(); return 1; })()"); await wait(pg, 700);
    ok(W + ': Combine tab, empty note before the combine', await ev(pg, "!!document.querySelector('[data-dpage=cmb].primary') && /runs right after/.test(document.querySelector('#main').textContent)"));
    await ev(pg, "(() => { runCombine(L, L.season); window.__pbl.render(); return 1; })()"); await wait(pg, 700);
    const n = await ev(pg, "document.querySelectorAll('table.cmb-tbl tbody tr').length");
    ok(W + ': combine table rows', n === (L => L)(n) && n >= 40, n);
    ok(W + ': leader tiles and best marks', await ev(pg, "document.querySelectorAll('.cmb-tile').length >= 4 && document.querySelectorAll('td.cmb-best').length >= 5"));
    // sort by max vertical (desc)
    const ci = await ev(pg, "[...document.querySelectorAll('table.cmb-tbl thead th')].findIndex(th => th.textContent.trim() === 'Max vert')");
    await clk(`table.cmb-tbl thead th:nth-child(${ci + 1})`); await wait(pg, 300); await clk(`table.cmb-tbl thead th:nth-child(${ci + 1})`); await wait(pg, 300);
    const vs = await ev(pg, `[...document.querySelectorAll('table.cmb-tbl tbody tr')].map(r => parseFloat(r.cells[${ci}].dataset.v)).filter(v => !isNaN(v))`);
    ok(W + ': sorts by max vertical', vs.every((v, i) => i === 0 || (vs[i - 1] - v) * (vs[0] - vs[vs.length - 1]) >= 0) && vs[0] !== vs[vs.length - 1], [vs[0], vs[vs.length - 1]]);
    // filter by position C
    await pg.selectOption('[data-fbar=cmb] select >> nth=0', { index: 5 }).catch(() => { }); await wait(pg, 400);
    const vis = await ev(pg, "[...document.querySelectorAll('table.cmb-tbl tbody tr')].filter(r => r.style.display !== 'none').length");
    ok(W + ': position filter narrows the table', vis > 0 && vis < n, [vis, n]);
    ok(W + ': no horizontal page scroll', await ev(pg, "document.documentElement.scrollWidth <= window.innerWidth + 1"), await ev(pg, "document.documentElement.scrollWidth"));
    await pg.selectOption('[data-fbar=cmb] select >> nth=0', { index: 0 }).catch(() => { }); await wait(pg, 300);
    await pg.evaluate(() => window.scrollTo(0, 0)); await shot('page');
    // prospect page
    await ev(pg, "(() => { const id = L.classes[L.season][0]; window.__pbl.ui.player = id; window.__pbl.render(); return 1; })()"); await wait(pg, 700);
    ok(W + ': combine block on prospect page', await ev(pg, "!!document.querySelector('.cmb-card') && /draft combine/.test(document.querySelector('.cmb-card').textContent)"));
    await ev(pg, "document.querySelector('.cmb-card').scrollIntoView()"); await shot('card');
    await clk('[data-cmbpage]'); await wait(pg, 700);
    ok(W + ': link back to full results', await ev(pg, "location.hash === '#draft' && !!document.querySelector('table.cmb-tbl')"));
    ok(W + ': no page errors', errs.length === 0, errs.slice(0, 3));
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
