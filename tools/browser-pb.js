// Phase B UI check: automatic backups + recovery, error card, guided tour, difficulty setting.
// gunzip -c tools/snap/pbl16-commish-s10.json.gz > tools/_c16.json, then: node tools/browser-pb.js [PAGE]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.PBL.L, ui = window.PBL.ui; return eval(js0); }, js), wait = (pg, ms) => pg.waitForTimeout(ms);
const idbJs = `const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  const get = k => new Promise((res, rej) => { const r = db.transaction('s', 'readonly').objectStore('s').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });`;
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  for (const W of [1300, 390]) {
    const T = W + 'px: ', ctx = await b.newContext({ viewport: { width: W, height: 860 } });
    await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' } }); });
    const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto(BASE + PAGE); await wait(pg, 1200);
    await pg.evaluate(new Function('f', `return (async () => { const txt = await (await fetch(f)).text(); ${idbJs} await put('league:slot-pb', txt); await put('slots', JSON.stringify([{ id: 'slot-pb', name: 'pb', mode: 'commish', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-pb'); })()`), '/tools/_c16.json');
    await pg.evaluate(() => { try { ['pbl-tour','pbl-tour-career','pbl-tour-coach','pbl-tour-fantasy'].forEach(k => localStorage.setItem(k, 'done')); } catch (e) { } });
    await pg.reload(); await wait(pg, 4500); await ev(pg, "document.querySelector('#modal').innerHTML=''");
    // backups
    await ev(pg, '(async()=>{await PBL.saveNow();})()'); await wait(pg, 400);
    const bk = await pg.evaluate(new Function(`return (async () => { ${idbJs} const v = await get('baks:slot-pb'); return v ? JSON.parse(v) : null; })()`));
    ok(T + 'backup made on save', bk && bk.length === 1 && bk[0].season === 11, bk);
    for (const ph of ['regular-done', 'regular', 'regular-done', 'regular']) { await ev(pg, `PBL.L.phase='${ph}'`); await ev(pg, '(async()=>{await PBL.saveNow();})()'); }
    const bk2 = await pg.evaluate(new Function(`return (async () => { ${idbJs} return JSON.parse(await get('baks:slot-pb')); })()`));
    ok(T + 'keeps only the last 3 backups, newest first', bk2.length === 3 && bk2[0].phase === 'regular' && bk2[1].phase === 'regular-done' && bk2[2].phase === 'regular', bk2.map(x => x.phase));
    // Saves popup lists them
    await pg.click('#b-menu', { force: true }).catch(async () => { await ev(pg, "document.getElementById('b-menu').click()"); }); await wait(pg, 700);
    ok(T + 'Saves popup lists the backups', await ev(pg, "document.querySelectorAll('#x-baks [data-bak]').length===3"));
    await ev(pg, "document.querySelectorAll('#x-baks [data-bak]')[1].click()"); await wait(pg, 200);
    await ev(pg, "document.querySelector('#x-baks [data-baky]').click()"); await wait(pg, 1200);
    ok(T + 'going back to a backup works', await ev(pg, "PBL.L.phase==='regular-done'"), await ev(pg, 'PBL.L.phase'));
    // broken save -> backup opens
    await pg.evaluate(new Function(`return (async () => { ${idbJs} await put('league:slot-pb', 'this is not a league {'); })()`));
    await pg.reload(); await wait(pg, 4500);
    ok(T + 'broken save: newest backup opens', await ev(pg, "!!PBL.L && PBL.L.teams.length===16"));
    ok(T + 'broken save: popup explains', await ev(pg, "/Backup opened/.test(document.querySelector('#modal h2')?.textContent||'')"), await ev(pg, "document.querySelector('#modal h2')?.textContent||'(none)'"));
    await ev(pg, "PBL.closeDialog()");
    // error card
    await ev(pg, "setTimeout(()=>{throw new Error('pb test boom')},0)"); await wait(pg, 400);
    ok(T + 'error card shows', await ev(pg, "!!document.querySelector('#pb-err') && /league is safe/.test(document.querySelector('#pb-err').textContent)"));
    ok(T + 'error card fits the screen', await ev(pg, "(()=>{const r=document.querySelector('#pb-err').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.bottom<=innerHeight})()"));
    await ev(pg, "document.querySelector('#pb-x').click()");
    // settings: difficulty + tour
    await ev(pg, "document.getElementById('b-settings').click()"); await wait(pg, 500);
    ok(T + 'settings: difficulty buttons', await ev(pg, "document.querySelectorAll('[data-fxdiff]').length===3"));
    await ev(pg, "document.querySelector('[data-fxdiff=\"hard\"]').click()"); await wait(pg, 200);
    ok(T + 'difficulty saved with the league', await ev(pg, "PBL.L.diff==='hard' && document.querySelector('[data-fxdiff=\"hard\"]').classList.contains('primary')"));
    await ev(pg, "document.querySelector('#fx-tour').click()"); await wait(pg, 500);
    ok(T + 'tour opens from Settings', await ev(pg, "!!document.querySelector('#pb-tour .pb-tip')"));
    let n = 0, fit = true;
    while (n < 12 && await ev(pg, "!!document.querySelector('#pb-next')")) { const f = await ev(pg, "(()=>{const r=document.querySelector('#pb-tour .pb-tip').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1&&r.top>=0&&r.bottom<=innerHeight+1})()"); if (!f) { fit = false; console.log('  tip off screen at step', n + 1); } await ev(pg, "document.querySelector('#pb-next').click()"); await wait(pg, 300); n++; }
    ok(T + 'tour goes through all steps', n >= 10 && !(await ev(pg, "!!document.querySelector('#pb-tour')")), n);
    ok(T + 'tour tips fit the screen', fit);
    // first time on a brand-new league
    await ev(pg, "localStorage.removeItem('pbl-tour'); PBL.L.phase='regular'; PBL.L.season=1; PBL.L.day=0; PBL.render()"); await wait(pg, 1500);
    ok(T + 'tour starts by itself on a new league', await ev(pg, "!!document.querySelector('#pb-tour')"));
    ok(T + 'no page errors (except the test one)', errs.filter(e => !/pb test boom/.test(e)).length === 0, errs.slice(0, 3));
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
