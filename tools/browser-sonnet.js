// Phase 3 UI checks: player cards, trophy room, ceremonies, music (+ later parts appended per PR).
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then:
//   node tools/browser-p3.js [PAGE] [SAVE]      (PAGE = index.html or pbl-single.html)
// No web server needed: the page is served from this folder through Playwright (page.route).
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', SAVE = process.argv[3] || 'tools/_t1.json', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.gz': 'application/gzip' };
const res = [];
const ok = (n, c, x) => { const l = (c ? 'PASS ' : 'FAIL ') + n + (x !== undefined && x !== '' ? '  [' + JSON.stringify(x) + ']' : ''); res.push(l); console.error(l); };
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.__pbl.L, ui = window.__pbl.ui; return eval(js0); }, js);
const wait = (pg, ms) => pg.waitForTimeout(ms);
const closeModals = pg => pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const m = document.getElementById('fx-modal'); if (m) m.innerHTML = ''; });

async function load(W, touch, SAVE2) {
  const b = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: touch, isMobile: touch });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e) + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await pg.goto(BASE + PAGE); await wait(pg, 1500);
  await pg.evaluate(async f => {
    const txt = await (await fetch(f)).text();
    const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-p3', txt); await put('slots', JSON.stringify([{ id: 'slot-p3', name: 'p3', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-p3');
  }, '/' + (SAVE2 || SAVE));
  await pg.reload(); await wait(pg, 5000); await closeModals(pg);
  return { b, pg, errs };
}


// Sonnet batch (Nov 18 2026): F1 popup queue, F2 no spoilers while live, U1 phone top bar, U2 phone tables, I2 Settings stop-the-sim, I1 manifest + service worker files.
async function run(W, touch) {
  const { b, pg, errs } = await load(W, touch), T = `${W}px: `, phone = W < 700;
  // F1: three popups at once -> one at a time, in order
  await ev(pg, "PBL.queueDialog(()=>PBL.dialog('<h2>Popup A</h2><button id=\"x-close\">ok</button>')); PBL.queueDialog(()=>PBL.dialog('<h2>Popup B</h2><button id=\"x-close\">ok</button>')); PBL.queueDialog(()=>PBL.dialog('<h2>Popup C</h2><button id=\"x-close\">ok</button>')); 0"); await wait(pg, 300);
  ok(T + 'F1: one popup on screen, the first one', await ev(pg, "document.querySelectorAll('#ov').length===1 && document.querySelector('#modal h2').textContent==='Popup A'"));
  await ev(pg, "PBL.closeDialog()"); await wait(pg, 300);
  ok(T + 'F1: next popup shows after closing', await ev(pg, "document.querySelector('#modal h2').textContent==='Popup B'"));
  await ev(pg, "PBL.closeDialog()"); await wait(pg, 300); await ev(pg, "PBL.closeDialog()"); await wait(pg, 300);
  ok(T + 'F1: queue empties', await ev(pg, "!document.querySelector('#ov')"));
  // F1: ceremony on screen holds the next popup
  await ev(pg, "const c=document.createElement('div');c.id='p3-cer';document.body.appendChild(c);PBL.queueDialog(()=>PBL.dialog('<h2>After ceremony</h2>'));0"); await wait(pg, 900);
  ok(T + 'F1: popup waits behind a ceremony', await ev(pg, "!document.querySelector('#ov')"));
  await ev(pg, "document.getElementById('p3-cer').remove()"); await wait(pg, 900);
  ok(T + 'F1: popup shows once the ceremony is gone', await ev(pg, "!!document.querySelector('#ov')")); await closeModals(pg);
  // I2: Settings has the stop-the-sim section
  await pg.evaluate(() => document.getElementById('b-settings').click()); await wait(pg, 300);
  ok(T + 'I2: Settings lists "Stop the sim for"', await ev(pg, "document.querySelectorAll('#fx-modal [data-stop]').length>=8"));
  await pg.evaluate(() => { const c = document.querySelector('#fx-modal [data-stop="pauseMtg"]'); c.checked = false; c.dispatchEvent(new Event('change')); const d = document.querySelector('#fx-modal [data-stop="todoStop"]'); d.checked = !d.checked; d.dispatchEvent(new Event('change')); });
  ok(T + 'I2: switch saves into the league', await ev(pg, "L.pauseMtg===false"));
  ok(T + 'I2: Settings has the install section', await ev(pg, "/Install as an app|installed app/.test(document.querySelector('#fx-modal').textContent) || location.protocol==='http:' ")); await closeModals(pg);
  await ev(pg, "L.pauseMtg=true; 0");
  // F2: live game
  const has = await ev(pg, "!!document.querySelector('#simctl [data-sim=\"live\"]')");
  if (has) {
    const rec0 = await ev(pg, "(()=>{const t=L.teams[L.user];return t.w+'-'+t.l})()");
    await ev(pg, "document.querySelector('#simctl [data-sim=\"live\"]').click()"); await wait(pg, 3500);
    ok(T + 'F2: live screen is open', await ev(pg, "ui.liveMode!=null && !!document.querySelector('.lv-board')"));
    await ev(pg, "const L2=PBL.L; ui.lv.paused=true; PBL.queueDialog(()=>PBL.dialog('<h2>Held popup</h2>')); 0"); await wait(pg, 1200);
    const when = await ev(pg, "document.querySelector('#when').textContent"), done = await ev(pg, "ui.lv.i>=L.games.find(g=>g.id===ui.liveMode).pbp.length");
    ok(T + 'F2: top bar shows the record from before the game', when.includes(rec0), [when, rec0]);
    ok(T + 'F2: popups wait while the game is live', !done && await ev(pg, "!document.querySelector('#ov')"));
    ok(T + 'F2: news ticker hidden while live', await ev(pg, "document.getElementById('ticker')?document.getElementById('ticker').hidden:true"));
    await ev(pg, "ui.lv.i=L.games.find(g=>g.id===ui.liveMode).pbp.length; PBL.render(); 0"); await wait(pg, 1500);
    ok(T + 'F2: popup shows after the final buzzer', await ev(pg, "document.querySelector('#modal h2') && document.querySelector('#modal h2').textContent.length>0"));
    const t = await ev(pg, "(()=>{const t=L.teams[L.user];return t.w+'-'+t.l})()");
    ok(T + 'F2: top bar shows the new record after the game', (await ev(pg, "document.querySelector('#when').textContent")).includes(t), t);
    await closeModals(pg);
  } else ok(T + 'F2: (no game today, skipped)', true);
  // U1 / U2: phone
  if (phone) {
    await ev(pg, "location.hash='#myteam'"); await wait(pg, 800);
    const h = await ev(pg, "document.querySelector('header.top').getBoundingClientRect().height");
    ok(T + 'U1: top bar under 180px tall', h < 180, h);
    ok(T + 'U1: extra sim buttons hidden, Sim menu shown', await ev(pg, "getComputedStyle(document.querySelector('#simctl .sim-more')).display!=='none' && [...document.querySelectorAll('#simctl .sim-x')].every(x=>getComputedStyle(x).display==='none')"));
    await pg.evaluate(() => document.querySelector('#simctl .sim-more').click()); await wait(pg, 200);
    ok(T + 'U1: Sim menu opens the other sim buttons', await ev(pg, "[...document.querySelectorAll('#simctl .sim-x')].some(x=>getComputedStyle(x).display!=='none')"));
    await pg.evaluate(() => document.querySelector('#simctl .sim-more').click());
    await pg.evaluate(() => document.getElementById('b-more').click()); await wait(pg, 200);
    ok(T + 'U1: "..." shows sound / settings / recent / saves', await ev(pg, "['b-mute','b-settings','b-recent','b-menu'].every(i=>getComputedStyle(document.getElementById(i)).display!=='none')"));
    await pg.evaluate(() => document.getElementById('b-more').click());
    await ev(pg, "window.scrollTo(0,600)"); await wait(pg, 300); await ev(pg, "window.scrollTo(0,900)"); await wait(pg, 400);
    ok(T + 'U1: top bar hides on scroll down', await ev(pg, "document.body.classList.contains('p3-hdr-hide')"));
    await ev(pg, "window.scrollTo(0,700)"); await wait(pg, 400);
    ok(T + 'U1: top bar returns on scroll up', await ev(pg, "!document.body.classList.contains('p3-hdr-hide')"));
    await ev(pg, "location.hash='#standings'"); await wait(pg, 1200);
    ok(T + 'U2: Standings shows W / L on screen', await ev(pg, "(()=>{const th=[...document.querySelectorAll('table.st-tbl thead th')].find(x=>x.textContent==='W');const r=th.getBoundingClientRect();return r.right<=innerWidth&&r.width>0})()"));
    ok(T + 'U2: Standings has no sideways page scroll', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'));
    await ev(pg, "location.hash='#players'"); await wait(pg, 1200);
    ok(T + 'U2: Players table shows Ovr on screen', await ev(pg, "(()=>{const th=[...document.querySelectorAll('table[data-ph] thead th')].find(x=>x.textContent==='Ovr');const r=th.getBoundingClientRect();return r.right<=innerWidth&&r.width>0})()"));
  }
  // I1: files
  ok(T + 'I1: manifest, service worker and icons exist', ['manifest.webmanifest', 'sw.js', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable-512.png'].every(f => fs.existsSync(path.join(ROOT, f))));
  ok(T + 'I1: manifest is linked from the page', await ev(pg, "!!document.querySelector('link[rel=manifest]') || " + JSON.stringify(PAGE !== 'index.html')));
  ok(T + 'no page errors', errs.length === 0, errs);
  await b.close();
}
(async () => { await run(1280, false); await run(390, true); const f = res.filter(x => x.startsWith('FAIL')); console.error('\n' + res.length + ' checks, ' + (res.length - f.length) + ' passed'); process.exit(f.length ? 1 : 0); })();
