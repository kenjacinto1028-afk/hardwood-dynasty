// Fill check: every page uses the full window width (desktop + phone). node tools/browser-fill.js [W...]
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), SAVE = 'tools/_t1.json', BASE = 'http://pbl.test/', SHOTS = process.env.SHOTS || '';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png' };
const VIEWS = ['myteam', 'cards', 'coaches', 'standings', 'schedule', 'teams', 'stats', 'players', 'injuries', 'discipline', 'awards', 'pipeline', 'expansion', 'rmoves', 'trades', 'fa', 'draft', 'preview', 'weekly', 'news', 'stories', 'feed', 'topplays', 'history', 'trophies', 'hofc', 'rules'];
const MTABS = ['roster', 'office', 'cap', 'shoot', 'plays', 'rivals', 'games', 'watch'];
let fails = 0;
async function run(W, touch) {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: touch, isMobile: touch });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(BASE + 'index.html'); await pg.waitForTimeout(1500);
  await pg.evaluate(async f => {
    const txt = await (await fetch(f)).text();
    const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-bs', txt); await put('slots', JSON.stringify([{ id: 'slot-bs', name: 'bs', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-bs');
  }, '/' + SAVE);
  await pg.reload(); await pg.waitForTimeout(5000);
  const close = () => pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const m = document.getElementById('fx-modal'); if (m) m.innerHTML = ''; });
  const measure = () => pg.evaluate(() => {
    const m = document.getElementById('main'), cs = getComputedStyle(m), mr = m.getBoundingClientRect();
    const L0 = mr.left + parseFloat(cs.paddingLeft), R0 = mr.right - parseFloat(cs.paddingRight);
    let right = L0;
    for (const e of m.querySelectorAll('*')) { const r = e.getBoundingClientRect(); if (r.width < 2 || r.height < 2) continue; const s = getComputedStyle(e); if (s.position === 'fixed' || s.position === 'absolute') continue; if (e.closest('.tblwrap') && e.closest('.tblwrap') !== e) continue; right = Math.max(right, Math.min(r.right, R0 + 1)); }
    return { mainW: Math.round(mr.width), fill: Math.round(100 * (right - L0) / (R0 - L0)), hscroll: document.documentElement.scrollWidth > innerWidth + 1 };
  });
  const out = [];
  const check = async (name, setup, arg) => {
    await pg.evaluate(setup, arg); await pg.waitForTimeout(700); await close();
    await pg.evaluate(setup, arg); await pg.waitForTimeout(500); await close();
    const r = await measure(); const bad = r.mainW < W - 2 || r.fill < 97 || r.hscroll;
    if (bad) fails++; out.push((bad ? 'FAIL ' : 'PASS ') + W + 'px ' + name + ' ' + JSON.stringify(r));
    if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, W + '-' + name.replace(/\W+/g, '_') + '.png') });
  };
  for (const t of MTABS) await check('myteam/' + t, t => { const u = window.__pbl.ui; u.player = u.game = u.coach = u.gm = u.team = null; u.mtab = t; location.hash = '#myteam'; window.__pbl.render(); }, t);
  for (const v of VIEWS.slice(1)) await check(v, v => { const u = window.__pbl.ui; u.player = u.game = u.coach = u.gm = u.team = null; location.hash = '#' + v; u.view = v; window.__pbl.render(); }, v);
  await check('player page', () => { const u = window.__pbl.ui, L = window.__pbl.L; u.player = L.teams[L.user].roster ? L.teams[L.user].roster[0] : Object.values(L.players).find(p => p.team === L.user).id; window.__pbl.render(); });
  await check('other team', () => { const u = window.__pbl.ui; u.player = null; u.view = 'teams'; u.team = (window.__pbl.L.user + 1) % 30; location.hash = '#teams'; window.__pbl.render(); });
  await check('box score', () => { const u = window.__pbl.ui, L = window.__pbl.L; u.team = null; const g = L.games[L.games.length - 1]; u.game = g && g.id; window.__pbl.render(); });
  console.log(out.join('\n')); if (errs.length) { fails++; console.log('ERRORS', errs.slice(0, 3)); }
  await b.close();
}
(async () => { const ws = process.argv.slice(2).map(Number); for (const W of ws.length ? ws : [1920, 1280, 390]) await run(W, W < 700); console.log(fails ? fails + ' FAIL' : 'ALL PASS'); process.exit(fails ? 1 : 0); })();
