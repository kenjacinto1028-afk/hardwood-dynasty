// Live coaching check (Nov 20 2026): Play & coach live, timeout, zone, play call, sub, sim to final; 1300 + 390 px.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then: node tools/browser-courtplays.js
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
    let live = false;
    for (let k = 0; k < 5 && !live; k++) {
      if (!await ev(pg, "!!document.querySelector('#simctl [data-sim=\"live\"]')")) { await pg.click('#simctl [data-sim="day"]'); await wait(pg, 3000); await close(); continue; }
      await pg.evaluate(() => { const m = document.querySelector('#simctl .sim-more'); if (m && getComputedStyle(m).display !== 'none' && !document.querySelector('#simctl.open')) m.click(); });
      await pg.click('#simctl [data-sim="live"]'); await wait(pg, 3000); await close(); live = await ev(pg, "!!document.querySelector('#lv-board')");
    }
    ok(W + ': live game opened', live);
    if (!live) continue;
    ok(W + ': ½x speed button', await ev(pg, "!!document.querySelector('[data-lv=\"sp:h\"]')"));
    await pg.click('[data-lv="pause"]'); await wait(pg, 300);
    const want = ['pnr', 'pop', 'iso', 'post', 'kick', 'spot', 'screen', 'dho', 'cut', 'horns', 'trans', 'roll'];
    const d0 = await ev(pg, 'L.day'), n0 = await ev(pg, 'L.games.length');
    ok(W + ': coaching panel', await ev(pg, "!!document.querySelector('.cg-panel [data-cg=\"to\"]') && /You are coaching/i.test(document.body.innerText)"));
    ok(W + ': day not simmed yet', await ev(pg, 'L.games.length') === n0);
    await pg.click('.cg-panel [data-cg="to"]'); await wait(pg, 300);
    ok(W + ': timeout pauses', await ev(pg, "ui.lv.paused && /Timeout!/.test(document.querySelector('.cg-msg').textContent)"));
    await pg.selectOption('[data-cgcov]', 'zone'); await wait(pg, 200);
    await pg.selectOption('[data-cgplay]', 'spot'); await wait(pg, 200);
    const sub = await ev(pg, "(() => { const s = document.querySelector('[data-cgsub]'); return [s.dataset.cgsub, s.options[1] && s.options[1].value]; })()");
    await pg.selectOption(`[data-cgsub="${sub[0]}"]`, sub[1]); await wait(pg, 300);
    ok(W + ': calls applied', await ev(pg, `(() => { const c = ui.cg, G = c.me === 0 ? c.lg.ctx.H : c.lg.ctx.A; return G.uCov === 'zone' && G.uPlay === 'spot' && G.court.some(p => p.id === ${sub[1]}) && G.uLock > 0; })()`));
    if (W < 500) ok(W + ': no side scroll', await ev(pg, 'document.documentElement.scrollWidth <= innerWidth + 1'), await ev(pg, 'document.documentElement.scrollWidth'));
    await ev(pg, "document.getElementById('lv-court').scrollIntoView()"); await pg.screenshot({ path: path.join(ROOT, 'tools', `_coach-${W}.png`), fullPage: false });
    await pg.click('[data-lv="pause"]'); await pg.click('[data-lv="sp:16"]'); await wait(pg, 4000);
    ok(W + ': game moves on', await ev(pg, 'ui.cg && ui.lv.i > 20'), await ev(pg, 'ui.lv && ui.lv.i'));
    await pg.evaluate(() => document.querySelector('[data-lv="box"]').click()); await wait(pg, 6000); await close();
    const res = await ev(pg, `(() => { const g = L.games[L.games.length - 1 - 0] && L.games.slice(${n0}).find(x => x.pbp); return { day: L.day, cg: !!ui.cg, gid: g && g.id, live: ui.liveMode, final: ui.lv && g && ui.lv.i === g.pbp.length, zone: g && g.pbp.some(e => /2-3 zone/.test(e[3])), pre: !!L.preGame }; })()`);
    ok(W + ': day simmed with your coached game, final shown', res.day === d0 + 1 && !res.cg && res.live === res.gid && res.final && res.zone && !res.pre, res);
    ok(W + ': no page errors', !errs.length, errs.slice(0, 3));
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAIL' : 'ALL PASS');
})();
