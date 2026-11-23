// Playtime counter check: per-league time (L.playMs + 'pt:<slot>'), overall 'playtotal', Saves popup + Settings lines, survives reload, stops when idle.
// gunzip -c tools/snap/pbl16-commish-s10.json.gz > tools/_c16.json, then: node tools/browser-play.js [PAGE]   (~2 min: the counter ticks every 15 s)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const ev = (pg, js) => pg.evaluate(js0 => eval(js0), js), wait = (pg, ms) => pg.waitForTimeout(ms);
const idbJs = `const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
  const get = k => new Promise((res, rej) => { const r = db.transaction('s', 'readonly').objectStore('s').get(k); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });`;
const idbGet = (pg, k) => pg.evaluate(new Function(`return (async () => { ${idbJs} return await get('${k}'); })()`));
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: 1300, height: 860 } });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' } }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(BASE + PAGE); await wait(pg, 1200);
  await pg.evaluate(new Function('f', `return (async () => { const txt = await (await fetch(f)).text(); ${idbJs} await put('league:slot-a', txt); await put('league:slot-b', txt); await put('pt:slot-b', String(2 * 3600000 + 5 * 60000)); await put('playtotal', String(3 * 3600000)); await put('slots', JSON.stringify([{ id: 'slot-a', name: 'A', mode: 'commish', season: 11, phase: 'regular', updated: Date.now() }, { id: 'slot-b', name: 'B', mode: 'commish', season: 11, phase: 'regular', updated: Date.now() - 1000 }])); await put('current', 'slot-a'); })()`), '/tools/_c16.json');
  await pg.evaluate(() => { try { ['pbl-tour','pbl-tour-career','pbl-tour-coach','pbl-tour-fantasy'].forEach(k => localStorage.setItem(k, 'done')); } catch (e) { } });
  await pg.reload(); await wait(pg, 4500); await ev(pg, "document.querySelector('#modal').innerHTML=''");
  const move = async () => { for (let i = 0; i < 4; i++) { await pg.mouse.move(100 + i * 10, 300); await wait(pg, 200); } };
  // play ~50 s with activity
  for (let i = 0; i < 10; i++) { await move(); await wait(pg, 4200); }
  const ms = await ev(pg, 'PBL.L.playMs || 0'); ok('this league counts time while you play', ms >= 25000 && ms <= 70000, ms);
  const pt = +(await idbGet(pg, 'pt:slot-a')), tot = +(await idbGet(pg, 'playtotal'));
  ok('quick copy stored', pt === ms, pt); ok('overall total grew', tot >= 3 * 3600000 + 25000, tot);
  // Saves popup
  await ev(pg, "document.getElementById('b-menu').click()"); await wait(pg, 900);
  const sv = await ev(pg, "document.querySelector('#modal').textContent");
  ok('Saves popup: total line', /Total playtime, all leagues: 3 h 0 min/.test(sv), sv.slice(0, 120));
  ok('Saves popup: other save shows its own time', /played 2 h 5 min/.test(sv));
  ok('Saves popup: open save shows its time', /played (under 1 min|1 min)/.test(sv));
  await ev(pg, 'PBL.closeDialog()');
  // Settings
  await ev(pg, 'FX.openSettings()'); await wait(pg, 600);
  const st = await ev(pg, "document.querySelector('#fx-modal').textContent");
  ok('Settings shows playtime', /Playtime.*this league.*3 h 0 min all leagues/.test(st), (st.match(/Playtime.{0,80}/) || [''])[0]);
  await ev(pg, "document.querySelector('#fx-modal').innerHTML=''");
  // reload without a full save: time kept from the quick copy
  await pg.reload(); await wait(pg, 4500); await ev(pg, "document.querySelector('#modal').innerHTML=''"); await move(); await wait(pg, 16000);
  const ms2 = await ev(pg, 'PBL.L.playMs || 0'); ok('time kept after reload (no full save)', ms2 >= ms, [ms, ms2]);
  // idle: no input for 5+ min -> no counting (fake the clock forward)
  const before = await ev(pg, 'PBL.L.playMs');
  await pg.evaluate(() => { const real = Date.now, off = 6 * 60 * 1000; Date.now = () => real() + off; });
  await wait(pg, 32000);
  const after = await ev(pg, 'PBL.L.playMs'); ok('idle time is not counted', after - before <= 15000 * 2 && after - before < 31000, after - before);
  await pg.evaluate(() => { }); await move(); await wait(pg, 16000);
  ok('counting resumes after input', (await ev(pg, 'PBL.L.playMs')) > after);
  ok('no page errors', !errs.length, errs);
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
