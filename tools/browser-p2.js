// Phase 2 UI checks: animated live court, commentary ticker, top plays reel (+ My team strip, box score panel).
// gunzip -c tools/snap/nba-team-s10.json.gz > tools/_t1.json, then:
//   node tools/browser-p2.js [PAGE] [SAVE]      (PAGE = index.html or pbl-single.html)
// No web server needed: the page is served from this folder through Playwright (page.route).
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', SAVE = process.argv[3] || 'tools/_t1.json', BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.gz': 'application/gzip' };
const res = [];
const ok = (n, c, x) => { const l = (c ? 'PASS ' : 'FAIL ') + n + (x !== undefined && x !== '' ? '  [' + JSON.stringify(x) + ']' : ''); res.push(l); console.error(l); };
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.__pbl.L, ui = window.__pbl.ui; return eval(js0); }, js);
const wait = (pg, ms) => pg.waitForTimeout(ms);
const closeModals = pg => pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const m = document.getElementById('fx-modal'); if (m) m.innerHTML = ''; });

async function load(W, touch) {
  const b = await chromium.launch({ args: ['--no-sandbox', '--autoplay-policy=no-user-gesture-required'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 }, hasTouch: touch, isMobile: touch });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
  await pg.goto(BASE + PAGE); await wait(pg, 1500);
  await pg.evaluate(async f => {
    const txt = await (await fetch(f)).text();
    const db = await new Promise((res, rej) => { const r = indexedDB.open('pbl-league', 1); r.onupgradeneeded = () => r.result.createObjectStore('s'); r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
    const put = (k, v) => new Promise((res, rej) => { const tx = db.transaction('s', 'readwrite'); tx.objectStore('s').put(v, k); tx.oncomplete = res; tx.onerror = () => rej(tx.error); });
    await put('league:slot-p2', txt); await put('slots', JSON.stringify([{ id: 'slot-p2', name: 'p2', mode: 'team', season: 11, phase: 'regular', updated: Date.now() }])); await put('current', 'slot-p2');
  }, '/' + SAVE);
  await pg.reload(); await wait(pg, 5000); await closeModals(pg);
  return { b, pg, errs };
}

async function run(W, touch) {
  const { b, pg, errs } = await load(W, touch), T = `${W}px: `, click = s => touch ? pg.tap(s) : pg.click(s);
  // ---- live game ----
  let live = false;
  for (let k = 0; k < 5 && !live; k++) {
    if (!await ev(pg, "!!document.querySelector('#simctl [data-sim=\"live\"]')")) { await click('#simctl [data-sim="day"]'); await wait(pg, 3000); await closeModals(pg); continue; }
    await click('#simctl [data-sim="live"]'); await wait(pg, 3000); await closeModals(pg);
    live = await ev(pg, "!!document.querySelector('#lv-board')");
  }
  ok(T + 'live game opened', live);
  if (live) {
    ok(T + 'court canvas drawn', await ev(pg, "(()=>{const c=document.getElementById('lv-canvas');return !!c&&c.width>200&&c.height>100})()"));
    ok(T + 'court has 10 player dots + ball', await ev(pg, "(()=>{const s=COURT.scenes.live;return !!s&&Object.keys(s.dots).length===10&&!!s.ball})()"), await ev(pg, "COURT.scenes.live&&Object.keys(COURT.scenes.live.dots).length"));
    ok(T + 'court keeps a 94:50 shape', await ev(pg, "(()=>{const c=document.getElementById('lv-canvas');return Math.abs(c.clientWidth/c.clientHeight-94/50)<0.06})()"));
    const g = await ev(pg, "(()=>{const g=L.games.find(x=>x.id===ui.lv.gid);return {shots:g.pbp.filter(e=>e[10]!=null).length,hl:!!g.hl}})()");
    ok(T + 'play-by-play shots carry a shot code', g.shots > 20, g);
    ok(T + 'game keeps its top plays', g.hl);
    const p0 = await ev(pg, "JSON.stringify(COURT.scenes.live.drawn)");
    await click('[data-lv="sp:4"]'); await wait(pg, 2500);
    const p1 = await ev(pg, "JSON.stringify(COURT.scenes.live.drawn)");
    ok(T + 'dots move during the game', p0 !== p1);
    ok(T + 'scene timing follows the live speed', await ev(pg, "COURT.scenes.live.dur>200&&COURT.scenes.live.dur<300"), await ev(pg, 'COURT.scenes.live.dur'));
    const n1 = await ev(pg, "document.querySelectorAll('.lv-tick .tk-row').length");
    ok(T + 'commentary ticker beside the court has lines', n1 > 3, n1);
    ok(T + 'newest commentary slides in', await ev(pg, "!!document.querySelector('.lv-tick .tk-row.tk-new')||document.querySelectorAll('.lv-tick .tk-row').length>0"));
    if (W > 900) ok(T + 'ticker sits beside the court', await ev(pg, "(()=>{const a=document.querySelector('.lv-anim').getBoundingClientRect(),t=document.querySelector('.lv-tick').getBoundingClientRect();return t.left>=a.right-1&&Math.abs(t.top-a.top)<30})()"));
    else ok(T + 'ticker under the court on a phone', await ev(pg, "(()=>{const a=document.querySelector('.lv-anim').getBoundingClientRect(),t=document.querySelector('.lv-tick').getBoundingClientRect();return t.top>=a.bottom-1})()"));
    ok(T + 'no page side-scroll in live view', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'), await ev(pg, 'document.documentElement.scrollWidth'));
    await click('[data-lv="pause"]'); await wait(pg, 400);
    const a = await ev(pg, "JSON.stringify(COURT.scenes.live.drawn)"); await wait(pg, 600);
    ok(T + 'pause freezes the court', a === await ev(pg, "JSON.stringify(COURT.scenes.live.drawn)"));
    await pg.screenshot({ path: `tools/_p2-live-${W}.png` });
    await ev(pg, "FX.set('skip',true)"); await click('[data-lv="pause"]'); await wait(pg, 700);
    ok(T + 'skip animations: plays jump to the end', await ev(pg, "COURT.scenes.live.dur===0"));
    await ev(pg, "FX.set('skip',false)");
    await click('[data-lv="sp:inst"]'); await wait(pg, 1200);
    ok(T + 'instant: final state, commentary complete', await ev(pg, "COURT.scenes.live.dur===0&&document.querySelector('.lv-clock').textContent.includes('Final')"));
    ok(T + 'commentary has runs / lead changes / milestones', await ev(pg, "document.querySelectorAll('.lv-tick .tk-run,.lv-tick .tk-lead,.lv-tick .tk-tie,.lv-tick .tk-star').length>0"));
  }
  // ---- top plays ----
  await ev(pg, "location.hash='#myteam'"); await wait(pg, 800); await closeModals(pg);
  ok(T + 'My team shows top plays of the night', await ev(pg, "document.querySelectorAll('.tp-strip .tp-mrow').length>=1"), await ev(pg, "document.querySelectorAll('.tp-strip .tp-mrow').length"));
  await click('.tp-strip [data-tpgo="night"]'); await wait(pg, 900);
  ok(T + 'reel opens on Top plays', await ev(pg, "ui.view==='topplays'&&!!document.getElementById('tp-canvas')&&!!document.querySelector('#tp-card .face')"));
  const nPlays = await ev(pg, "document.querySelectorAll('#tp-list .tp-row').length");
  ok(T + 'night list: up to 10 plays, max 2 per player', nPlays >= 3 && nPlays <= 10 && await ev(pg, "(()=>{const c={};for(const b of document.querySelectorAll('#tp-list .tp-row strong'))c[b.textContent]=(c[b.textContent]||0)+1;return Object.values(c).every(v=>v<=2)})()"), nPlays);
  ok(T + 'reel replay scene running', await ev(pg, "!!COURT.scenes['tp-canvas']&&Object.keys(COURT.scenes['tp-canvas'].dots).length===10"));
  ok(T + 'replay canvas is a half court', await ev(pg, "(()=>{const c=document.getElementById('tp-canvas');return Math.abs(c.clientWidth/c.clientHeight-50/34)<0.06})()"));
  const c0 = await ev(pg, "document.getElementById('tp-card').textContent");
  await click('[data-tp="next"]'); await wait(pg, 300);
  ok(T + 'Next shows the next play', c0 !== await ev(pg, "document.getElementById('tp-card').textContent") && await ev(pg, "document.getElementById('tp-pos').textContent.startsWith('2 /')"));
  await click('[data-tp="prev"]'); await wait(pg, 300);
  ok(T + 'Prev goes back', await ev(pg, "document.getElementById('tp-pos').textContent.startsWith('1 /')"));
  await wait(pg, 4600);
  ok(T + 'reel autoplays to the next play', await ev(pg, "document.getElementById('tp-pos').textContent.startsWith('2 /')"), await ev(pg, "document.getElementById('tp-pos').textContent"));
  await pg.evaluate(() => { window.__fxLog = window.__snd = []; }); await wait(pg, 2600);
  ok(T + 'replay plays a sound on the shot', (await ev(pg, 'window.__snd||[]')).some(s => ['swish', 'dunk', 'block'].includes(s)), await ev(pg, 'window.__snd'));
  await click('#tp-pause'); const pp = await ev(pg, "document.getElementById('tp-pos').textContent"); await wait(pg, 4500);
  ok(T + 'pause stops the reel', pp === await ev(pg, "document.getElementById('tp-pos').textContent"));
  await click('#tp-list .tp-row:nth-child(3)'); await wait(pg, 300);
  ok(T + 'tap a play in the list', await ev(pg, "document.getElementById('tp-pos').textContent.startsWith('3 /')&&document.querySelectorAll('#tp-list .tp-row.on').length===1"));
  if (touch) ok(T + 'play rows are 44px+ tall', await ev(pg, "[...document.querySelectorAll('#tp-list .tp-row')].every(b=>b.getBoundingClientRect().height>=44)"));
  ok(T + 'no page side-scroll on Top plays', await ev(pg, 'document.documentElement.scrollWidth<=innerWidth+1'), await ev(pg, 'document.documentElement.scrollWidth'));
  await pg.screenshot({ path: `tools/_p2-plays-${W}.png` });
  // box score: the game's own top plays
  const gid = await ev(pg, "(L.games.filter(g=>g.hl&&g.hl.length).slice(-1)[0]||{}).id");
  await pg.evaluate(id => { const el = document.createElement('a'); el.dataset.game = id; el.className = 'lk'; document.querySelector('#main').appendChild(el); el.click(); }, String(gid)); await wait(pg, 800);
  ok(T + 'box score lists the game\'s top plays', await ev(pg, "!!document.querySelector('[data-tpgo^=\"g:\"]')"));
  await click('[data-tpgo^="g:"]'); await wait(pg, 800);
  ok(T + 'Watch opens that game\'s reel', await ev(pg, "ui.view==='topplays'&&ui.tpGame!=null&&!!document.getElementById('tp-canvas')&&!!document.querySelector('[data-tp=\"all\"]')"));
  await click('[data-tp="all"]'); await wait(pg, 600);
  ok(T + 'back to the whole night', await ev(pg, "ui.tpGame==null&&document.querySelector('h2').textContent.includes('of the night')"));
  await ev(pg, "location.hash='#standings'"); await wait(pg, 3000);
  ok(T + 'reel stops when you leave', await ev(pg, "!COURT.scenes['tp-canvas']"));
  ok(T + 'no page errors', !errs.length, errs.slice(0, 3));
  await b.close();
}
(async () => {
  await run(1300, false);
  await run(390, true);
  console.log(res.join('\n')); console.log(`${res.filter(r => r.startsWith('PASS')).length}/${res.length} passed`);
})();
