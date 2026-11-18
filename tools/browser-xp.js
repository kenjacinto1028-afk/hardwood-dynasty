// Phase A UI check: League > Expansion page, team creator, protected list, expansion draft popup, new teams on the standings.
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json; gunzip -c tools/snap/pbl16-commish-s10.json.gz > tools/_c16.json
//   node tools/browser-xp.js [PAGE]      (PAGE = index.html or pbl-single.html)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.PBL.L, ui = window.PBL.ui; return eval(js0); }, js), wait = (pg, ms) => pg.waitForTimeout(ms);
async function load(b, W, save, mode) {
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' } }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e) + ' @ ' + String(e.stack || '').split('\n').slice(1, 3).join(' | ')));
  await pg.goto(BASE + PAGE); await wait(pg, 1200);
  await pg.evaluate(async ([f, mode]) => { const txt = await (await fetch(f)).text(); const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-xp', txt); await put('slots', JSON.stringify([{ id: 'slot-xp', name: 'xp', mode, season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-xp'); }, ['/' + save, mode]);
  await pg.reload(); await wait(pg, 4500); await pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; });
  return { pg, errs, ctx };
}
let mine0 = [];
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  for (const [save, mode, W] of [['tools/_t1.json', 'team', 1300], ['tools/_c16.json', 'commish', 390]]) {
    const T = `${mode} ${W}px: `, { pg, errs, ctx } = await load(b, W, save, mode);
    const n0 = await ev(pg, 'L.teams.length');
    await ev(pg, "location.hash='#expansion'"); await wait(pg, 900);
    ok(T + 'Expansion tab in League group', await ev(pg, "!!document.querySelector('#subtabs a[data-v=\"expansion\"]')"));
    ok(T + 'builder shows 2 team cards with logos', await ev(pg, "document.querySelectorAll('.xp-card').length===2&&document.querySelectorAll('.xp-card svg.logo').length===2"));
    // team creator: rename the first team
    await pg.fill('[data-xpi="0"][data-xpk="city"]', 'Test City'); await pg.dispatchEvent('[data-xpi="0"][data-xpk="city"]', 'change'); await wait(pg, 300);
    await pg.fill('[data-xpi="0"][data-xpk="name"]', 'Testers'); await pg.dispatchEvent('[data-xpi="0"][data-xpk="name"]', 'change');
    await pg.fill('[data-xpi="0"][data-xpk="abbr"]', 'tst'); await pg.dispatchEvent('[data-xpi="0"][data-xpk="abbr"]', 'change'); await wait(pg, 300);
    ok(T + 'team creator updates the card', await ev(pg, "document.querySelector('.xp-card strong').textContent.includes('Test City Testers')"));
    const L0 = await ev(pg, "L.teams[0].abbr"); await pg.fill('[data-xpi="1"][data-xpk="abbr"]', L0); await pg.dispatchEvent('[data-xpi="1"][data-xpk="abbr"]', 'change'); await wait(pg, 300);
    await pg.click('#xp-go'); await wait(pg, 400);
    ok(T + 'taken short name refused', await ev(pg, "!L.xpnPlan && /taken/.test(document.querySelector('#main').textContent)"));
    await pg.selectOption('[data-xpi="1"][data-xpk="pick"]', { index: 2 }); await wait(pg, 300);
    await pg.click('#xp-go'); await wait(pg, 500);
    ok(T + 'expansion announced', await ev(pg, "!!L.xpnPlan && L.xpnPlan.teams[0].abbr==='TST' && L.xpnPlan.teams[0].conf!==L.xpnPlan.teams[1].conf"));
    if (mode === 'team') {
      ok(T + 'protect list shows', await ev(pg, "document.querySelectorAll('[data-xpprot]').length>=5 && document.querySelectorAll('[data-xpprot]:checked').length===Math.min(L.xpnPlan.protect, document.querySelectorAll('[data-xpprot]').length)"), await ev(pg, "[document.querySelectorAll('[data-xpprot]').length, document.querySelectorAll('[data-xpprot]:checked').length, L.xpnPlan.protect]"));
      await ev(pg, "document.querySelectorAll('[data-xpprot]:checked')[0].click()"); await wait(pg, 100);
      await pg.click('#xp-psave'); await wait(pg, 400);
      ok(T + 'protect list saved', await ev(pg, "Array.isArray(L.xpnPlan.mine)&&L.xpnPlan.mine.length===document.querySelectorAll('[data-xpprot]:checked').length"));
      mine0 = await ev(pg, 'L.xpnPlan.mine.slice()');
    }
    ok(T + 'no side-scroll', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'), await ev(pg, 'document.documentElement.scrollWidth'));
    // jump to the end of re-signing and start free agency (runs the expansion draft)
    await ev(pg, "(()=>{L.phase='off-resign';L.resign=[];L.teamOptions=[];startFA(L);PBL.render();})()"); await wait(pg, 1500);
    ok(T + 'league grew by 2', await ev(pg, 'L.teams.length') === n0 + 2);
    for (let i = 0; i < 6 && !/Expansion draft/.test(await ev(pg, "document.querySelector('#modal h2')?.textContent||''")); i++) { console.log('  closing popup: ' + await ev(pg, "document.querySelector('#modal h2')?.textContent||'(none)'")); await ev(pg, "PBL.closeDialog()"); await wait(pg, 300); }
    ok(T + 'expansion draft popup', await ev(pg, "/Expansion draft/.test(document.querySelector('#modal h2')?.textContent||'') && document.querySelectorAll('#modal tbody tr').length>=6"), await ev(pg, "[document.querySelector('#modal h2')?.textContent, document.querySelectorAll('#modal tbody tr').length, document.querySelector('#modal').innerHTML.length]"));
    if (mode === 'team') ok(T + 'protected players kept', await ev(pg, `${JSON.stringify(mine0)}.every(id=>L.players[id].team===L.user)`));
    await ev(pg, "document.querySelector('#xp-ok')?.click()"); await wait(pg, 300);
    await ev(pg, "location.hash='#standings'"); await wait(pg, 900);
    ok(T + 'new team on the standings', await ev(pg, "document.querySelector('#main').textContent.includes('TST')||document.querySelector('#main').textContent.includes('Test City')"));
    await ev(pg, "location.hash='#expansion'"); await wait(pg, 700);
    ok(T + 'results kept on the Expansion page', await ev(pg, "/expansion draft/i.test(document.querySelector('#main').textContent)"));
    await ev(pg, `document.querySelector('[data-team="${n0}"]')?.click()`); await wait(pg, 900);
    ok(T + 'new team page opens', await ev(pg, "document.querySelector('#main').textContent.includes('Test City')"));
    ok(T + 'saved', await ev(pg, '(async()=>{await PBL.saveNow();return true})()'));
    ok(T + 'no page errors', !errs.length, errs.slice(0, 3));
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
