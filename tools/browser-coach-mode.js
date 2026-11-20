// Play as coach mode check (Nov 20 2026): new-league setup, My job page, GM-only actions blocked, fired popup, job offer; 1300 + 390 px.
// node tools/browser-coach-mode.js
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.svg': 'image/svg+xml', '.png': 'image/png', '.webmanifest': 'application/json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const wait = (pg, ms) => pg.waitForTimeout(ms);
const ev = (pg, js) => pg.evaluate(js0 => { const L = window.__pbl.L; return eval(js0); }, js);
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  for (const W of [1300, 390]) {
    const ctx = await b.newContext({ viewport: { width: W, height: 900 }, isMobile: W < 500, hasTouch: W < 500, deviceScaleFactor: 1 });
    await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f)) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), contentType: MIME[path.extname(f)] || 'application/octet-stream' }); });
    const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e)));
    await pg.goto(BASE + 'index.html'); await wait(pg, 2500);
    const shot = async n => { await pg.screenshot({ path: path.join(ROOT, 'tools', '_cm-' + n + '-' + W + '.png') }); };
    ok(W + ': setup shows Head Coach', await ev(pg, "!!document.querySelector('[data-setmode=coach]')"));
    await pg.click('[data-setsize="16"]'); await wait(pg, 300);
    await pg.click('[data-setmode=coach]'); await wait(pg, 300);
    await pg.click('[data-setteam="3"]'); await wait(pg, 300);
    await pg.fill('#gmname', 'Coach Test'); await shot('setup');
    await pg.click('#create'); await wait(pg, 4000);
    await pg.evaluate(() => { document.querySelector('#modal').innerHTML = ''; const t = document.getElementById('pb-tour'); if (t) t.remove(); });
    ok(W + ': coach league created', await ev(pg, "L.mode === 'coach' && L.user === 3 && L.teams[3].coach.user && L.teams[3].coach.name === 'Coach Test' && !!L.teams[3].gm"));
    ok(W + ': My job page', await ev(pg, "location.hash === '#cmjob' && !!document.querySelector('.cm-meter') && !!document.querySelector('#subtabs a[data-v=cmjob]')"));
    ok(W + ': header says Head coach', await ev(pg, "/Head coach/.test(document.querySelector('#fchip').textContent)"));
    ok(W + ': no horizontal scroll', await ev(pg, "document.documentElement.scrollWidth <= window.innerWidth + 1"), await ev(pg, "document.documentElement.scrollWidth"));
    await shot('job');
    // GM-only action is blocked
    await ev(pg, "(() => { location.hash = '#players'; return 1; })()"); await wait(pg, 600);
    await ev(pg, "(() => { const p = Object.values(L.players).find(p => p.team === 5 && !p.retired); window.__pbl.ui.player = p.id; window.__pbl.render(); return 1; })()"); await wait(pg, 600);
    const hasTf = await ev(pg, "!!document.querySelector('[data-tradefor]')");
    if (hasTf) { await pg.click('[data-tradefor]'); await wait(pg, 600); }
    ok(W + ': trade button blocked with a note', hasTf && await ev(pg, "document.getElementById('cm-toast') && document.getElementById('cm-toast').classList.contains('on') && location.hash !== '#trades'"));
    // sim a week as the coach (AI GM runs the roster)
    await ev(pg, "(() => { window.__pbl.ui.player = null; for (let i = 0; i < 8; i++) simDay(L); location.hash = '#cmjob'; window.__pbl.render(); return 1; })()"); await wait(pg, 800);
    ok(W + ': games played, still your team', await ev(pg, "L.user === 3 && L.teams[3].w + L.teams[3].l > 0 && L.cm.ai === undefined"));
    // fired
    await ev(pg, "(() => { const t = L.teams[3], me = t.coach; fireCoach(L, t); const nc = affordableCoach(L, t, me.id) || makeInterim(L, t); hireCoach(L, 3, nc.id, true); cmAfter(L); window.__pbl.render(); window.CMUI.popDialog(); return 1; })()"); await wait(pg, 800);
    ok(W + ': fired popup', await ev(pg, "/fired/.test(document.querySelector('#modal').textContent) && L.user === null && L.cm.jobless"));
    await shot('fired');
    await pg.evaluate(() => { const t = document.getElementById('pb-tour'); if (t) t.remove(); }); await pg.click('#modal [data-cmclose=go]'); await wait(pg, 800);
    // a job offer
    await ev(pg, "(() => { L.cm.offers = [{ tid: 6, yrs: 3, amt: 2.5, rank: 9, need: 40 }, { tid: 9, yrs: 3, amt: 2.2, rank: 14, need: 20 }]; window.__pbl.render(); return 1; })()"); await wait(pg, 600);
    ok(W + ': jobless page with offers', await ev(pg, "!!document.querySelector('.cm-jobless') && document.querySelectorAll('[data-cmtake]').length === 2"));
    ok(W + ': no horizontal scroll (offers)', await ev(pg, "document.documentElement.scrollWidth <= window.innerWidth + 1"), await ev(pg, "document.documentElement.scrollWidth"));
    await shot('offers');
    await pg.click('[data-cmtake="6"]'); await wait(pg, 800);
    ok(W + ': took the job', await ev(pg, "L.user === 6 && !L.cm.jobless && L.teams[6].coach.id === L.cm.cid && L.teams[3].coach.id !== L.cm.cid"));
    await shot('newjob');
    ok(W + ': no page errors', errs.length === 0, errs.slice(0, 3));
    await ctx.close();
  }
  await b.close(); console.log(fails ? fails + ' FAILED' : 'ALL PASS'); process.exit(fails ? 1 : 0);
})();
