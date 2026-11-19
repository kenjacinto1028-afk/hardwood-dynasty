// My Career check: create a player from New league, sim to a big game, play it (4 decisions), spend XP, sim the season, playoffs, draft.
// node tools/browser-career.js [PAGE] [WIDTH]   (~3-4 min; 16-team PBL, 58 games)
const { chromium } = require('playwright'); const fs = require('fs'), path = require('path');
const ROOT = path.join(__dirname, '..'), PAGE = process.argv[2] || 'index.html', W = +(process.argv[3] || 1300), BASE = 'http://pbl.test/';
const MIME = { '.html': 'text/html', '.js': 'text/javascript', '.css': 'text/css', '.json': 'application/json', '.png': 'image/png', '.webmanifest': 'application/manifest+json' };
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const ev = (pg, js) => pg.evaluate(js0 => eval(js0), js), wait = (pg, ms) => pg.waitForTimeout(ms);
const SHOTS = process.env.SHOTS;
(async () => {
  const b = await chromium.launch({ args: ['--no-sandbox'] });
  const ctx = await b.newContext({ viewport: { width: W, height: 900 } });
  await ctx.route(BASE + '**', r => { const f = path.join(ROOT, decodeURIComponent(new URL(r.request().url()).pathname)); if (!f.startsWith(ROOT) || !fs.existsSync(f) || fs.statSync(f).isDirectory()) return r.fulfill({ status: 404, body: '' }); r.fulfill({ status: 200, body: fs.readFileSync(f), headers: { 'content-type': MIME[path.extname(f)] || 'application/octet-stream' } }); });
  const pg = await ctx.newPage(), errs = []; pg.on('pageerror', e => errs.push(String(e))); pg.on('console', m => { if (m.type() === 'error') errs.push(m.text()); });
  await pg.goto(BASE + PAGE); await pg.evaluate(() => { try { localStorage.setItem('pbl-tour', 'done'); } catch (e) { } }); await pg.reload(); await wait(pg, 2500);
  const shot = async n => { if (SHOTS) await pg.screenshot({ path: path.join(SHOTS, n + '.png') }); };
  // setup
  const has = await ev(pg, "!!document.querySelector('[data-setmode=career]')"); ok('New league offers My Career', has);
  await pg.click('[data-setsize="16"]'); await pg.click('[data-setgames="58"]'); await pg.click('[data-setmode="career"]'); await wait(pg, 300);
  ok('create-a-player form shows', await ev(pg, "!!document.getElementById('car-first') && document.querySelectorAll('[data-carstory]').length === 8"));
  await pg.fill('#car-first', 'Kenji'); await pg.fill('#car-last', 'Dela Cruz'); await pg.click('[data-carpos="1"]'); await wait(pg, 200);
  await pg.click('[data-carstory="street"]'); await wait(pg, 200); await pg.click('[data-carpath="NCHF"]'); await wait(pg, 200);
  await shot('car-01-setup');
  await pg.click('#create'); await wait(pg, 3000); await ev(pg, "document.querySelector('#modal').innerHTML=''");
  const st = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { view: PBL.ui.view, name: p.name, pos: p.pos, ovr: p.ovr, pl: p.pl, games: L.career.games.length, big: L.career.games.filter(g => g.play).length, cls: L.classes[L.season].includes(p.id), tab: document.querySelector('#tabs a.on').textContent }; })()");
  ok('career league created, hub open', st.view === 'career' && st.tab === 'My Career', st);
  ok('player built as asked', st.name === 'Kenji Dela Cruz' && st.pos === 1 && st.pl === 'NCHF' && st.cls, st);
  ok('30-game college schedule with 6 big games', st.games === 30 && st.big === 6, st);
  await shot('car-02-hub');
  // sim: should stop at the first big game
  await ev(pg, "document.querySelector('#simctl [data-sim=end]').click()"); await wait(pg, 2500);
  for (let i = 0; i < 40 && await ev(pg, 'PBL.ui.busy'); i++) await wait(pg, 500);
  const dlg = await ev(pg, "document.querySelector('#modal').textContent");
  ok('sim stops on a big game', /Game day/.test(dlg), dlg.slice(0, 80));
  const g0 = await ev(pg, "PBL.L.career.games.filter(g => g.done).length"); ok('earlier games were simmed', g0 >= 1, g0);
  await pg.click('#car-go'); await wait(pg, 300); await shot('car-03-decision');
  for (let i = 0; i < 4; i++) { const n = await ev(pg, "document.querySelectorAll('[data-carop]').length"); ok('moment ' + (i + 1) + ' has choices', n >= 2, n); await pg.click('[data-carop="0"]'); await wait(pg, 250); }
  const res = await ev(pg, "document.querySelector('#modal').textContent"); ok('result popup with grade + XP', /(Win|Loss) \d+-\d+/.test(res) && /XP/.test(res), res.slice(0, 120));
  await shot('car-04-result');
  const gp = await ev(pg, "(() => { const g = PBL.L.career.games.find(g => g.played); return g ? { xp: g.xp, gr: g.gr, pts: g.line.pts } : null; })()"); ok('played game stored', gp && gp.xp > 0, gp);
  await pg.click('#car-ok'); await wait(pg, 300);
  // spend XP
  const before = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { xp: L.career.xp, tp: p.tp }; })()");
  await pg.click('[data-carup="tp"]'); await wait(pg, 300);
  const after = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { xp: L.career.xp, tp: p.tp }; })()");
  ok('XP buys +1 three-point', after.tp === before.tp + 1 && after.xp < before.xp, [before, after]);
  // the rest: sim every big game, through the season
  for (let k = 0; k < 30; k++) {
    if (await ev(pg, "PBL.L.phase !== 'regular'")) break;
    if (await ev(pg, "/Game day/.test(document.querySelector('#modal').textContent)")) { await pg.click('#car-sim'); await wait(pg, 200); await ev(pg, "PBL.closeDialog()"); continue; }
    await ev(pg, "PBL.closeDialog()"); await wait(pg, 100); await ev(pg, "document.querySelector('#modal').innerHTML=''");
    await ev(pg, "document.querySelector('#simctl [data-sim=end]').click()"); await wait(pg, 1500);
    for (let i = 0; i < 120 && await ev(pg, 'PBL.ui.busy'); i++) await wait(pg, 500);
  }
  const fin = await ev(pg, "(() => { const L = PBL.L; return { ph: L.phase, done: L.career.games.filter(g => g.done).length, played: L.career.games.filter(g => g.played).length }; })()");
  ok('regular season over, all 30 college games done', fin.ph === 'regular-done' && fin.done === 30, fin);
  // playoffs -> offseason -> lottery -> draft (by engine calls, then check the popup)
  await ev(pg, "PBL.closeDialog()");
  await ev(pg, "(() => { const L = PBL.L; startPlayoffs(L); while (L.phase === 'playoffs') simPlayoffDay(L); startOffseason(L); PBL.save(); })()"); await wait(pg, 500);
  const pre = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid], ln = (p.pre || []).find(x => x.s === L.season); const sl = carSeasonLine(L); const tm = L.pipe.lg.NCHF.res.st.find(r => r[0] === L.career.team); return { ln, sl, rec: tm && [tm[1], tm[2]], w: sl.w }; })()");
  ok('college season line = his games', pre.ln && pre.ln.gp === 30 && Math.abs(pre.ln.pts - pre.sl.pts) < 0.11, pre);
  ok('his team record matches his games', pre.rec && pre.rec[0] === pre.w, pre.rec);
  await ev(pg, "(() => { const L = PBL.L; runLottery(L); startDraft(L); while (L.phase === 'off-draft') aiDraftPick(L); PBL.save(); location.hash = '#career'; })()"); await wait(pg, 800);
  await ev(pg, "PBL.render()"); await wait(pg, 800);
  let dd = '';
  for (let i = 0; i < 25; i++) { dd = await ev(pg, "document.querySelector('#modal').textContent"); if (/select…|Undrafted/.test(dd)) break; await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); PBL.closeDialog(); })()"); await wait(pg, 600); }
  const dr = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { prospect: p.prospect, draft: p.draft || null, team: p.team, ovr: p.ovr }; })()");
  ok('draft night popup', /select…|Undrafted/.test(dd), dd.slice(0, 120));
  ok('no longer a prospect', dr.prospect === false, dr);
  await shot('car-05-draft');
  await ev(pg, "PBL.closeDialog()"); await wait(pg, 300);
  const hub = await ev(pg, "document.querySelector('#main').textContent"); ok('hub shows pro status', /You're a pro|Free agent/.test(hub));
  ok('no page errors', !errs.length, errs.slice(0, 5));
  await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();
