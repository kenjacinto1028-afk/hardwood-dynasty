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

  let live = false;
const shot = (pg, n) => process.env.SHOTS ? pg.screenshot({ path: `tools/_p3-${n}.png`, fullPage: false }) : null;
async function run(W, touch) {
  const { b, pg, errs } = await load(W, touch), T = `${W}px: `, click = s => touch ? pg.tap(s) : pg.click(s);
  // --- cards
  await ev(pg, "location.hash='#cards'"); await wait(pg, 1500);
  const nC = await ev(pg, "document.querySelectorAll('.p3-binder .p3-slot').length");
  ok(T + 'cards view shows my roster as cards', nC >= 12, nC); if (!nC) { console.log(await ev(pg, "[ui.view, document.querySelector('#main').innerHTML.slice(0,400)]"), errs); process.exit(1); }
  ok(T + 'cards have faces + stats', await ev(pg, "(()=>{const s=document.querySelector('.p3-binder svg');return !!s&&s.innerHTML.includes('PTS')&&s.querySelectorAll('svg').length>=1})()"));
  ok(T + 'cards tab in My team group', await ev(pg, "!!document.querySelector('#subtabs a[data-v=\"cards\"]')"));
  ok(T + 'no side-scroll on cards', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'), await ev(pg, 'document.documentElement.scrollWidth'));
  await shot(pg, 'cards-' + W);
  await click('.p3-binder .p3-slot'); await wait(pg, 900);
  ok(T + 'card popup opens', await ev(pg, "!!document.querySelector('#modal .p3-cardstage svg')&&!!document.querySelector('#p3c-save')"));
  ok(T + 'card popup fits the screen', await ev(pg, "(()=>{const r=document.querySelector('#modal .p3-card').getBoundingClientRect();return r.left>=0&&r.right<=innerWidth+1})()"));
  await shot(pg, 'carddlg-' + W);
  const png = await pg.evaluate(async () => { const { L, portrait, logo } = PBL; const pid = +document.querySelector('[data-p3cn]')?.dataset.p3cn || +document.querySelector('.p3-binder [data-p3card]').dataset.p3card; const { svg } = (() => { const d = P3.cardData(L.players[pid]); return { svg: P3.cardSvg(d, portrait('p', pid, L.players[pid].nat, d.tid), logo(d.tid, 46)) }; })(); try { const b = await P3.svgToPng(svg, 2); return b.size; } catch (e) { return 'ERR ' + e.message; } });
  ok(T + 'card turns into a PNG image', typeof png === 'number' && png > 5000, png);
  await click('.p3-cardnav [data-p3cn]:last-child'); await wait(pg, 500);
  ok(T + 'next card arrow works', await ev(pg, "document.querySelector('.p3-cardnav .muted').textContent.startsWith('2 /')"));
  const link = await ev(pg, "P3.cardLink(P3.cardData(L.players[L.teams[L.user].roster[0]]))");
  ok(T + 'card link made', /#card=[A-Za-z0-9_-]{40,}$/.test(link), link.length);
  await closeModals(pg);
  await ev(pg, `location.hash='${'#card=' + link.split('#card=')[1]}'`); await wait(pg, 900);
  ok(T + 'shared card link opens the card', await ev(pg, "document.querySelector('#modal h2')?.textContent==='Shared player card'&&!location.hash.startsWith('#card=')"));
  await closeModals(pg);
  // player page button
  await ev(pg, "(()=>{const a=document.createElement('a');a.dataset.player=L.teams[L.user].roster[1];a.className='lk';document.querySelector('#main').appendChild(a);a.click();})()"); await wait(pg, 800);
  await click('#main [data-p3card]'); await wait(pg, 700);
  ok(T + 'Player card button on the player page', await ev(pg, "!!document.querySelector('#modal .p3-cardstage')"));
  await closeModals(pg);
  // --- trophy room
  await ev(pg, "ui.p3trT=L.teams.findIndex((t,i)=>Object.values(L.awards).some(A=>A&&A.champion===i));location.hash='#trophies'"); await wait(pg, 1500);
  ok(T + 'trophy room: banners for a champion', await ev(pg, "document.querySelectorAll('.p3-rafters .p3-banner.champ').length>=1"), await ev(pg, "document.querySelectorAll('.p3-rafters .p3-banner').length"));
  ok(T + 'trophy room: trophies on the shelf', await ev(pg, "document.querySelectorAll('.p3-shelf .p3-tr').length>=1"));
  ok(T + 'trophy room tab under News & history', await ev(pg, "!!document.querySelector('#subtabs a[data-v=\"trophies\"]')"));
  ok(T + 'no side-scroll on trophy room', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'), await ev(pg, 'document.documentElement.scrollWidth'));
  await shot(pg, 'trophies-' + W);
  // --- ceremonies (season 10 awards on the snap)
  await ev(pg, "(()=>{window.__s=L.season;L.season=10;window.__po=L.po;L.po=Object.assign({},L.po||{},{champion:L.awards[10].champion});FX.set('skip',false);FX.set('cer',true);return P3.ceremony('mvp')})()"); await wait(pg, 300);
  ok(T + 'MVP ceremony overlay', await ev(pg, "!!document.querySelector('#p3-cer.k-mvp .p3-certroph svg')"));
  await wait(pg, 2200);
  ok(T + 'MVP name revealed after the drumroll', await ev(pg, "document.querySelector('#p3-cer').classList.contains('rev')&&getComputedStyle(document.querySelector('.p3-cerwho')).opacity>0.9"));
  await shot(pg, 'cer-mvp-' + W);
  await click('#p3-cerok'); await wait(pg, 300);
  ok(T + 'ceremony closes', await ev(pg, "!document.getElementById('p3-cer')"));
  await ev(pg, "P3.ceremony('title')"); await wait(pg, 2600);
  ok(T + 'title ceremony with banner', await ev(pg, "!!document.querySelector('#p3-cer.k-title.rev .p3-drop')"));
  await shot(pg, 'cer-title-' + W);
  await pg.keyboard.press('Escape'); await wait(pg, 200);
  ok(T + 'Esc closes ceremony', await ev(pg, "!document.getElementById('p3-cer')"));
  await ev(pg, "FX.set('skip',true)"); ok(T + 'no ceremony with Skip animations', await ev(pg, "P3.ceremony('mvp')===false")); await ev(pg, "FX.set('skip',false);L.season=window.__s;L.po=window.__po");
  // --- music
  await pg.evaluate(() => { window.__fxLog = []; }); await click('#b-home'); await wait(pg, 600);
  ok(T + 'menu music starts after a tap', await ev(pg, "FX.musicMood==='menu'"), await ev(pg, 'FX.musicMood'));
  await pg.evaluate(() => document.getElementById('b-settings').click()); await wait(pg, 300);
  ok(T + 'settings has music + show options', await ev(pg, "!!document.querySelector('#fx-mvol')&&!!document.querySelector('[data-fxc=\"music\"]')&&!!document.querySelector('[data-fxc=\"cer\"]')&&!!document.querySelector('[data-fxc=\"draftShow\"]')&&!!document.querySelector('[data-fxc=\"stories\"]')"));
  await click('[data-fxc="music"]'); await wait(pg, 200);
  ok(T + 'music off stops it', await ev(pg, "FX.musicMood===null&&FX.settings.music===false"));
  await click('[data-fxc="music"]'); await wait(pg, 200); await click('#fx-done');
  ok(T + 'music back on', await ev(pg, "FX.musicMood==='menu'"));
  if (typeof extra === 'function') await extra(pg, T, click, W, touch, load, ok, ev, wait, shot);
  ok(T + 'no page errors', !errs.length, errs.slice(0, 3));
  await b.close();
}
let extra = null; try { extra = require('./browser-p3x.js'); } catch (e) { }
(async () => {
  await run(1300, false);
  await run(390, true);
  console.log(res.join('\n')); console.log(`${res.filter(r => r.startsWith('PASS')).length}/${res.length} passed`);
})();
