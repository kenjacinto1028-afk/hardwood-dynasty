// Team logos check (Nov 20 2026): PBL teams (motif emblem tiles) + 40 college / overseas teams (nickname emblems), no initials left. node tools/browser-logos.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1300, height: 900 }, deviceScaleFactor: 1 });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(BASE + 'index.html'); await pg.waitForTimeout(2500);
  await pg.click('[data-setsize="16"]'); await pg.click('[data-setmode=team]'); await pg.click('[data-setteam="3"]'); await pg.click('#create'); await pg.waitForTimeout(4000);
  const r = await pg.evaluate(() => {
    const P = window.__pbl, L = P.L, v = P.v30, out = [];
    const pbl = L.teams.map(t => v.logo(t.id, 64)), small = L.teams.map(t => v.logo(t.id, 18));
    const pipe = []; for (const lg of ['EABL', 'APBA', 'NCHF']) for (let i = 0; i < 16; i++) { const s = v.pipeLogo(lg, i, 64); if (s) pipe.push(s); }
    const pipeSmall = []; for (const lg of ['EABL', 'APBA', 'NCHF']) for (let i = 0; i < 16; i++) { const s = v.pipeLogo(lg, i, 18); if (s) pipeSmall.push(s); }
    document.querySelector('#modal').innerHTML = ''; const tr = document.getElementById('pb-tour'); if (tr) tr.remove();
    document.body.innerHTML = `<div id="gal" style="padding:16px;background:#f4f5f7;display:flex;flex-wrap:wrap;gap:10px">${pbl.concat(pipe).join('')}</div><div style="padding:16px;display:flex;flex-wrap:wrap;gap:8px">${small.concat(pipeSmall).join('')}</div>`;
    const big = [...document.querySelectorAll('#gal svg')];
    return { nPbl: pbl.length, nPipe: pipe.length, art: big.filter(s => s.querySelectorAll('path,circle,ellipse,polygon,rect').length >= 3).length, words: big.filter(s => s.querySelector('text')).length, abbrOnlySmall: pipeSmall.filter(s => /<text/.test(s)).length, uniq: new Set(pipe).size };
  });
  ok('16 PBL logos', r.nPbl === 16, r.nPbl); ok('40 pipeline logos', r.nPipe === 40, r.nPipe);
  ok('every big logo has emblem art', r.art === r.nPbl + r.nPipe, r.art);
  ok('small pipeline logos have no letters', r.abbrOnlySmall === 0, r.abbrOnlySmall);
  ok('pipeline logos all different', r.uniq === 40, r.uniq);
  ok('no page errors', errs.length === 0, errs.slice(0, 3));
  await pg.screenshot({ path: path.join(ROOT, 'tools', '_logos.png'), fullPage: true });
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
