// Card variety checks: season / rookie / title / career / Hall of Fame / coach cards, rarity tiers, binder filter, popup picker.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then: node tools/browser-cards.js
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

  let live = false;
const shot = (pg, n) => process.env.SHOTS ? pg.screenshot({ path: `tools/_p3-${n}.png`, fullPage: false }) : null;
async function run(W, touch) {
  const { b, pg, errs } = await load(W, touch), T = `${W}px: `, click = s => touch ? pg.tap(s) : pg.click(s);
  await ev(pg, "location.hash='#cards'"); await wait(pg, 1200);
  const counts = {};
  for (const k of ['now', 'best', 'career', 'rookie', 'special', 'coach', 'hof']) {
    await click(`[data-p3show="${k}"]`); await wait(pg, 500);
    counts[k] = await ev(pg, "document.querySelectorAll('.p3-binder .p3-slot').length");
    ok(T + `"${k}" binder fits`, await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'));
  }
  ok(T + 'every card type shows cards', counts.now >= 12 && counts.best >= 8 && counts.career >= 8 && counts.rookie >= 8 && counts.coach === 30 && counts.hof >= 5, counts);
  const rar = await ev(pg, "(()=>{const c={};for(const p of Object.values(L.players)){if((p.retired||p.team==null)&&!L.hof.some(h=>h.pid===p.id))continue;for(const k of ['now','career']){const r=P3.cardOf(p,{k}).d.r;c[r]=(c[r]||0)+1}}return c})()");
  ok(T + 'all rarity tiers in use', ['com', 'unc', 'rare', 'epic', 'leg', 'hof'].every(k => rar[k] > 0), rar);
  // MVP season card is Legendary-ish and named
  const mvp = await ev(pg, "(()=>{for(const p of Object.values(L.players)){const a=(p.awards||[]).find(a=>a.a==='MVP'&&P3.seasonsOf(p).some(h=>h.s===a.s));if(a){const d=P3.seasonCard(p,'season',a.s);return [d.rb,d.r,P3.flavorOf(d)]}}})()");
  ok(T + 'MVP season card has ribbon + high rarity', mvp && /MVP SEASON/.test(mvp[0]) && ['leg', 'epic'].includes(mvp[1]), mvp);
  // popup picker on a vet with a title
  await click('[data-p3show="special"]'); await wait(pg, 400);
  if (counts.special) {
    await click('.p3-binder .p3-slot'); await wait(pg, 700);
    ok(T + 'special card popup has ribbon + flavor', await ev(pg, "!!document.querySelector('#modal .p3-flavor')&&/·/.test(document.querySelector('#modal .p3-card svg').getAttribute('aria-label'))"));
    await click('#modal [data-p3v="career"]'); await wait(pg, 500);
    ok(T + 'Career chip switches card', await ev(pg, "/CAREER|HALL OF FAME/.test(document.querySelector('#modal .p3-card svg').textContent)"));
    const opt = await ev(pg, "document.querySelector('#p3-vseason option:nth-child(2)')?.value");
    if (opt) { await pg.selectOption('#p3-vseason', opt); await wait(pg, 500); ok(T + 'season picker switches card', await ev(pg, `document.querySelector('#p3-vseason').value==='${opt}'`)); }
    ok(T + 'popup fits the screen', await ev(pg, "(()=>{const r=document.querySelector('#modal .p3-card').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})()"));
    await shot(pg, 'special-' + W);
    await click('.p3-cardnav [data-p3cn]:last-child'); await wait(pg, 500);
    ok(T + 'next arrow pages specials', await ev(pg, "document.querySelector('.p3-cardnav .muted').textContent.startsWith('2 /')"));
    await closeModals(pg);
  }
  await click('[data-p3show="coach"]'); await wait(pg, 400); await click('.p3-binder .p3-slot'); await wait(pg, 700);
  ok(T + 'coach card popup', await ev(pg, "document.querySelector('#modal h2').textContent==='Coach card'&&/WINS/.test(document.querySelector('#modal .p3-card svg').textContent)"));
  const png = await pg.evaluate(async () => { const s = document.querySelector('#modal .p3-card svg').outerHTML; try { return (await P3.svgToPng(s, 2)).size; } catch (e) { return 'ERR ' + e.message; } });
  ok(T + 'coach card saves as PNG', typeof png === 'number' && png > 5000, png);
  await shot(pg, 'coach-' + W); await closeModals(pg);
  await click('[data-p3show="hof"]'); await wait(pg, 400); await shot(pg, 'hof-' + W);
  const link = await ev(pg, "P3.cardLink(P3.careerCard(L.players[L.hof[0].pid]))");
  await ev(pg, `location.hash='${'#card=' + link.split('#card=')[1]}'`); await wait(pg, 900);
  ok(T + 'shared career card opens', await ev(pg, "document.querySelector('#modal h2')?.textContent==='Shared player card'"));
  ok(T + 'no page errors', !errs.length, errs.slice(0, 3));
  await b.close();
}
(async () => { await run(1300, false); await run(390, true); console.log(res.some(l => l.startsWith('FAIL')) ? 'SOME FAILED' : 'ALL PASS'); })();
