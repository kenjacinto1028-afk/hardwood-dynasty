// Court plays check (Nov 20 2026): live game, step to entries that carry a play (entry[11]), freeze mid-play, check dots / banner / screens, screenshot.
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
      await pg.click('#simctl [data-sim="live"]'); await wait(pg, 3000); await close(); live = await ev(pg, "!!document.querySelector('#lv-board')"); if (live && await ev(pg, '!!ui.cg')) { await pg.evaluate(() => document.querySelector('[data-lv="box"]').click()); await wait(pg, 6000); await pg.evaluate(() => { const m = document.querySelector('#modal'); if (m) m.innerHTML = ''; const u = window.__pbl.ui; u.lv.i = 0; u.lv.paused = false; document.querySelector('[data-lv="f:all"]').click(); }); await wait(pg, 1500); }   // Nov 20: coached live game: finish it, then watch the replay
    }
    ok(W + ': live game opened', live);
    if (!live) continue;
    ok(W + ': ½x speed button', await ev(pg, "!!document.querySelector('[data-lv=\"sp:h\"]')"));
    await pg.click('[data-lv="pause"]'); await wait(pg, 300);
    const want = ['pnr', 'pop', 'iso', 'post', 'kick', 'spot', 'screen', 'dho', 'cut', 'horns', 'trans', 'roll'];
    const idx = await ev(pg, `(()=>{const g=L.games.find(x=>x.id===ui.lv.gid),o={};g.pbp.forEach((e,i)=>{const p=e[11];if(p&&o[p[0]]==null&&e[10]!=null)o[p[0]]=i+1;});return o})()`);
    ok(W + ': plays found in the log', Object.keys(idx).length >= 8, idx);
    let shots = 0;
    for (const k of want) {
      if (idx[k] == null) continue;
      await ev(pg, `COURT.stop('live'); (()=>{const g=L.games.find(x=>x.id===ui.lv.gid); COURT.live(g, ${idx[k]}, 2400);})()`);
      await ev(pg, "document.getElementById('lv-canvas').scrollIntoView({block:'center'})"); await wait(pg, k === 'trans' ? 700 : 1050);
      const s = await ev(pg, "(()=>{const s=COURT.scenes.live;const d=s.drawn||{};const ids=Object.keys(s.dots);return {n:ids.length,bad:ids.filter(i=>!d[i]||!isFinite(d[i][0])||!isFinite(d[i][1])||d[i][0]<-3||d[i][0]>97||d[i][1]<-3||d[i][1]>53).length,banner:s.banner||'',scr:(s.screens||[]).length,t:Math.round(s.t*100)/100}})()");
      ok(`${W}: ${k} scene: 10 dots on the floor, banner`, s.n === 10 && s.bad === 0 && !!s.banner, s);
      if (['pnr', 'pop', 'screen', 'dho', 'horns'].includes(k)) ok(`${W}: ${k} draws a screen`, s.scr > 0, s.scr);
      await ev(pg, "document.getElementById('lv-canvas').scrollIntoView({block:'center'})");
      if (shots < 6 && W > 500) { await pg.locator('#lv-canvas').screenshot({ path: `tools/_cp-${k}.png` }); shots++; }
      if (W < 500 && k === 'pnr') await pg.locator('#lv-canvas').screenshot({ path: `tools/_cp-phone-${k}.png` });
    }
    ok(W + ': no page side-scroll', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'));
    ok(W + ': no page errors', !errs.length, errs);
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
