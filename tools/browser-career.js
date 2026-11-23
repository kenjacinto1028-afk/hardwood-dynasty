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
  await pg.goto(BASE + PAGE); await pg.evaluate(() => { try { ['pbl-tour','pbl-tour-career','pbl-tour-coach','pbl-tour-fantasy'].forEach(k => localStorage.setItem(k, 'done')); } catch (e) { } }); await pg.reload(); await wait(pg, 2500);
  const tab = async k => { await pg.evaluate(k0 => { PBL.ui.carTab = k0; PBL.render(); }, k); await pg.waitForTimeout(250); };
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
  ok('Draft stock panel shows a mock rank and projection', await ev(pg, "(() => { const e = document.getElementById('car-stock'); return !!e && /Mock draft\\s*#\\d+/i.test(e.innerText) && /pick|undrafted/i.test(e.innerText); })()"));
  ok('player built as asked', st.name === 'Kenji Dela Cruz' && st.pos === 1 && st.pl === 'NCHF' && st.cls, st);
  ok('30-game college schedule with 6 big games', st.games === 30 && st.big === 6, st);
  await shot('car-02-hub');
  // sim: should stop at the first big game
  await ev(pg, "document.querySelector('#simctl [data-sim=end]').click()"); await wait(pg, 2500);
  for (let i = 0; i < 40 && await ev(pg, 'PBL.ui.busy'); i++) await wait(pg, 500);
  const dlg = await ev(pg, "document.querySelector('#modal').textContent");
  ok('sim stops on a big game', /Game day/.test(dlg), dlg.slice(0, 80));
  const g0 = await ev(pg, "PBL.L.career.games.filter(g => g.done).length"); ok('earlier games were simmed', g0 >= 1, g0);
  await pg.click('#car-go'); await wait(pg, 300);
  ok('plan screen first (5 game plans)', await ev(pg, "document.querySelectorAll('[data-carplan]').length === 5 && !!document.getElementById('car-tip')"));
  await pg.click('[data-carplan="take"]'); await wait(pg, 150); await shot('car-03a-plan'); await pg.click('#car-tip'); await wait(pg, 300); await shot('car-03-decision');
  ok('moment shows margin, momentum, energy and risk tags', await ev(pg, "!!document.querySelector('.car-lead') && document.querySelectorAll('.car-meter').length >= 2 && document.querySelectorAll('.car-tag').length >= 2"));
  for (let i = 0; i < 4; i++) { const n = await ev(pg, "document.querySelectorAll('[data-carop]').length"); ok('moment ' + (i + 1) + ' has choices', n >= 2, n); if (i === 1) { ok('breather button on the 2nd moment', await ev(pg, "!!document.getElementById('car-rest')")); await pg.click('#car-rest'); await wait(pg, 200); } await pg.click('[data-carop="0"]'); await wait(pg, 250); }
  const res = await ev(pg, "document.querySelector('#modal').textContent"); ok('result popup with grade + XP', /(Win|Loss) \d+-\d+/.test(res) && /XP/.test(res), res.slice(0, 120));
  await shot('car-04-result');
  const gp = await ev(pg, "(() => { const g = PBL.L.career.games.find(g => g.played); return g ? { xp: g.xp, gr: g.gr, pts: g.line.pts } : null; })()"); ok('played game stored', gp && gp.xp > 0, gp);
  await pg.click('#car-ok'); await wait(pg, 300);
  // spend XP
  const before = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { xp: L.career.xp, tp: p.tp }; })()");
  await tab('skills'); await pg.click('[data-carup="tp"]'); await wait(pg, 300);
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
  { const r = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid], st = carStock(L, p); return [!st || !st.cap || st.c >= Math.min(st.cap, 60) * 0.6 || p.scout <= p.ovr + 1, st && st.c, st && st.cap, L.career.scoutAdj, p.scout, p.ovr]; })()"); ok('draft stock follows his production (rank not far better than cap)', r[0], r); }
  ok('his team record matches his games', pre.rec && pre.rec[0] === pre.w, pre.rec);
  await ev(pg, "(() => { const L = PBL.L; runLottery(L); startDraft(L); while (L.phase === 'off-draft') aiDraftPick(L); PBL.save(); location.hash = '#career'; })()"); await wait(pg, 800);
  await ev(pg, "PBL.render()"); await wait(pg, 800);
  let dd = '';
  for (let i = 0; i < 25; i++) { dd = await ev(pg, "document.querySelector('#modal').textContent"); if (/select…|Undrafted/.test(dd)) break; await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); PBL.closeDialog(); })()"); await wait(pg, 600); }
  const dr = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { prospect: p.prospect, draft: p.draft || null, team: p.team, ovr: p.ovr }; })()");
  ok('draft night popup', /select…|Undrafted/.test(dd), dd.slice(0, 120));
  ok('no longer a prospect', dr.prospect === false, dr);
  await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; if (p.team == null && p.draft) { const i = L.fa.indexOf(p.id); if (i >= 0) L.fa.splice(i, 1); signSecondRounder(L, p, p.draft.tid); } })()");   // a weak prospect can fall to the 2nd round and go unsigned; sign him so the pro tests can run
  await shot('car-05-draft');
  await ev(pg, "PBL.closeDialog()"); await wait(pg, 300);
  await tab('overview');
  const hub = await ev(pg, "document.querySelector('#main').textContent"); ok('hub shows pro status', /You're a pro|Free agent/.test(hub));
  ok('pro hub shows season averages', await ev(pg, "/averages/.test(document.getElementById('main').innerText)"));
  ok('award popup lists a new award', await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; p.awards.push({ s: L.season, a: 'All-Star' }); carCheck(L); return (L.career.pop || []).some(x => x.t === 'award' && x.n === 'All-Star'); })()"));
  // Phase 2: next season as a pro (offseason by the top sim button until the new season starts)
  for (let i = 0; i < 40 && await ev(pg, "PBL.L.phase !== 'regular'"); i++) {
    await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); document.querySelector('#modal').innerHTML = ''; })()");
    const k = await ev(pg, "(() => { const b = document.querySelector('#simctl button[data-sim]'); if (!b) return null; b.click(); return b.dataset.sim; })()");
    await wait(pg, 1200); for (let j = 0; j < 120 && await ev(pg, 'PBL.ui.busy'); j++) await wait(pg, 500);
    await ev(pg, "(() => { const b = document.getElementById('autofill'); if (b) b.click(); })()");
  }
  const pro = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { ph: L.phase, s: L.season, team: p.team }; })()");
  ok('new season, he is on a team', pro.ph === 'regular' && pro.s === 2 && pro.team != null, pro.team != null ? pro : [pro, await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { hold: L.career.hold, fa: L.fa.includes(p.id), pros: p.prospect, club: !!p.club, ret: p.retired, ab: p.abroad, pl: p.pl, dr: p.draft }; })()")]);
  await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); document.querySelector('#modal').innerHTML = ''; location.hash = '#career'; })()"); await wait(pg, 500);
  await ev(pg, "document.querySelector('#simctl [data-sim=end]').click()"); await wait(pg, 1500);
  for (let j = 0; j < 60 && await ev(pg, 'PBL.ui.busy'); j++) await wait(pg, 500);
  let gd = '';
  for (let i = 0; i < 10; i++) { gd = await ev(pg, "document.querySelector('#modal').textContent"); if (/Game day/.test(gd)) break; await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); PBL.closeDialog(); })()"); await wait(pg, 600); }
  ok('pro game day popup', /Game day/.test(gd) && /Coach trust/.test(gd), gd.slice(0, 100));
  const g0n = await ev(pg, 'PBL.L.career.pro.length');
  await ev(pg, "document.getElementById('car-go').click()"); await wait(pg, 300); await ev(pg, "document.getElementById('car-tip').click()"); await wait(pg, 300); await shot('car-06-pro-decision');
  for (let i = 0; i < 4; i++) { await ev(pg, "document.querySelector('[data-carop]').click()"); await wait(pg, 250); }
  for (let j = 0; j < 40 && await ev(pg, 'PBL.ui.busy'); j++) await wait(pg, 300);
  let pr = '';
  for (let i = 0; i < 10; i++) { pr = await ev(pg, "document.querySelector('#modal').textContent"); if (/Your calls/.test(pr)) break; await wait(pg, 600); }
  ok('pro result popup with real box line', /Your calls/.test(pr) && /FG/.test(pr), pr.slice(0, 140));
  const last = await ev(pg, "(() => { const C = PBL.L.career; const e = C.pro[C.pro.length - 1]; return { n: C.pro.length, played: e && e.played, gid: e && e.gid, trust: C.trust, fx: C.proFx }; })()");
  ok('game stored as played, decisions cleared', last.n === g0n + 1 && last.played && last.fx === null, last);
  await shot('car-07-pro-result');
  const popFind = async (rx, n) => { let m = ''; for (let i = 0; i < (n || 12); i++) { m = await ev(pg, "document.querySelector('#modal').textContent"); if (rx.test(m)) return m;
    if (/Game day/.test(m) && !rx.test('Game day')) { await ev(pg, "document.getElementById('car-sim').click()"); await wait(pg, 900); for (let j = 0; j < 60 && await ev(pg, 'PBL.ui.busy'); j++) await wait(pg, 300); continue; }
    await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); PBL.closeDialog(); })()"); await wait(pg, 600); } return m; };
  // Phase 3: achievements, Legend meter, badges
  const a3 = await ev(pg, "(() => { const C = PBL.L.career; return { first: C.ach && C.ach.progame, xp: C.xpTot, pend: (C.pop || []).length, log: C.log.some(x => /Welcome to the pros/.test(x.t)) }; })()");
  ok('achievement unlocked: first pro game (XP + story line)', a3.first != null && a3.log, a3);
  const ap = await popFind(/Achievement unlock/);
  ok('Achievement unlocked popup', /Achievement unlock/.test(ap) && /Welcome to the pros/.test(ap), ap.slice(0, 120));
  await ev(pg, "PBL.closeDialog(); document.querySelector('#modal').innerHTML=''; location.hash = '#career'; PBL.render()"); await wait(pg, 600);
  const lg = await ev(pg, "(() => { const e = document.getElementById('car-legend'); return e ? { t: e.textContent, w: e.querySelector('.car-lgbar i').style.width } : null; })()");
  ok('Legend meter renders with tier + Hall of Fame tracker', lg && /Legend meter/.test(lg.t) && /Hall of Fame tracker/.test(lg.t) && /Prospect|Rotation|Starter|All-Star|Superstar|Legend/.test(lg.t) && /%$/.test(lg.w), lg);
  await tab('skills'); const grid0 = await ev(pg, "({ n: document.querySelectorAll('.car-achc').length, on: document.querySelectorAll('.car-achc.on').length, b: document.querySelectorAll('.car-badge').length })"); await tab('story'); const grid = await ev(pg, "({ n: document.querySelectorAll('.car-achc').length, on: document.querySelectorAll('.car-achc.on').length, b: document.querySelectorAll('.car-badge').length, st: !!document.querySelector('#car-stats table.sortable tbody tr') })");
  ok('badge / achievement / stats panels render', grid0.n >= 24 && grid0.on >= 1 && grid0.b >= 16 && grid.st, [grid0, grid]); await tab('skills');
  await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; for (const k of ['tp']) p[k] = 90; L.career.xp = 1000; delete L.career.badges.deadeye; L.career.tot.tpm = 0; PBL.render(); })()"); await wait(pg, 400);
  const bb0 = await ev(pg, "(() => { const C = PBL.L.career; return { t: (C.badges || {}).deadeye, xp: C.xp, tot: C.xpTot }; })()");
  ok('Buy button shows cost', await ev(pg, "(document.querySelector('[data-carbuy=deadeye]') || {}).textContent") === 'Buy Bronze · 60 XP', bb0);
  await ev(pg, "PBL.closeDialog(); document.querySelector('#modal').innerHTML = ''; document.querySelector('[data-carbuy=deadeye]').click()"); await wait(pg, 400);
  const bb1 = await ev(pg, "(() => { const C = PBL.L.career; return { t: (C.badges || {}).deadeye, xp: C.xp, tot: C.xpTot, own: !!document.querySelector('#car-badges .car-badge.own') }; })()");
  ok('XP buys a badge tier', bb1.t === 0 && (bb0.xp - bb1.xp) + (bb1.tot - bb0.tot) === 60 && bb1.own, [bb0, bb1]);   // achievement XP may land in between
  const ch = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid], o = { k: ['tp'], d: 0 }; const a = carChance(L, p, o); L.career.badges.deadeye = 3; const b = carChance(L, p, o); L.career.badges.deadeye = 0; return [a, b]; })()");
  ok('badge raises decision chance', ch[1] >= ch[0] && (ch[1] > ch[0] || ch[0] >= 0.92), ch);
  await shot('car-09-badges');
  const clear0 = async () => { await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); PBL.closeDialog(); document.querySelector('#modal').innerHTML = ''; })()"); await wait(pg, 200); };
  const noOv0 = async n => { const o = await ev(pg, "document.documentElement.scrollWidth > window.innerWidth + 1"); ok('no sideways scroll: ' + n, !o); };
  // Phase 5: tabs, Brand (endorsements, sneakers, social, agent, community), Rivals
  await clear0();
  const tabsTxt = await ev(pg, "[...document.querySelectorAll('.car-tabs [data-cartab]')].map(b => b.dataset.cartab).join(',')");
  ok('hub has organized tabs (pro)', tabsTxt === 'overview,skills,life,brand,rivals,story', tabsTxt);
  await tab('brand'); await ev(pg, "(() => { const L = PBL.L, B = carBizInit(L); B.offers = []; B.sawShoe = 1; B.hype = 60; L.players[L.career.pid].ovr = Math.max(L.players[L.career.pid].ovr, 76); for (let i = 0; i < 6; i++) carBizOffers(L, true); B.offers.forEach(o => o.seen = 1); PBL.render(); })()"); await wait(pg, 300);
  ok('Brand tab: summary + 5 sub tabs', await ev(pg, "document.querySelectorAll('[data-biz^=\"sub:\"]').length === 5 && /Brand value/.test(document.querySelector('#main').textContent)"));
  ok('Endorsements: offers listed with Accept / Agent counter / Decline', await ev(pg, "document.querySelectorAll('.car-offer [data-biz^=\"acc:\"]').length >= 1 && document.querySelectorAll('.car-offer [data-biz^=\"ctr:\"]').length >= 1 && document.querySelectorAll('.car-offer [data-biz^=\"dec:\"]').length >= 1"));
  await shot('car-11-brand');
  await clear0(); await pg.click('.car-offer [data-biz^="ctr:"]'); await wait(pg, 300);
  ok('agent counter shows a result', await ev(pg, "/Your agent got|will not move|pulled the offer/.test(document.querySelector('#main').textContent)"));
  await clear0(); await pg.click('.car-offer [data-biz^="acc:"]'); await wait(pg, 300);
  ok('accepting an offer adds a row to the deals table', await ev(pg, "document.querySelectorAll('table[data-sid=\"biz-deals\"] tbody tr').length >= 1 && PBL.L.career.biz.deals.length >= 1"));
  await clear0(); await pg.click('[data-biz="sub:shoe"]'); await wait(pg, 250);
  ok('Sneakers tab renders companies', await ev(pg, "/Apex Footwear/.test(document.querySelector('#main').textContent) && /Northpeak/.test(document.querySelector('#main').textContent)"));
  await clear0(); await pg.click('[data-biz="sub:social"]'); await wait(pg, 250); await ev(pg, "(() => { const B = PBL.L.career.biz; B.posts = 2; B.lastG = { gr: 5, pts: 25, win: true }; PBL.render(); })()"); await wait(pg, 200);
  const h0 = await ev(pg, "PBL.L.career.biz.hype"); await clear0(); await pg.click('[data-biz="post:highlight"]'); await wait(pg, 300);
  ok('social post raises hype and uses a post', await ev(pg, "PBL.L.career.biz.hype") > h0 && await ev(pg, "PBL.L.career.biz.posts") === 1);
  await clear0(); await pg.click('[data-biz="sub:agent"]'); await wait(pg, 250);
  ok('Agent tab: shop around, change agent, contract link', await ev(pg, "!!document.querySelector('[data-biz=\"shop\"]') && !!document.querySelector('[data-biz=\"agents\"]') && !!document.querySelector('[data-cartab=\"life\"]')"));
  await clear0(); await pg.click('[data-biz="agents"]'); await wait(pg, 250);
  ok('Change agent lists candidates', await ev(pg, "document.querySelectorAll('[data-biz^=\"hire:\"]').length >= 2"));
  await clear0(); await pg.click('[data-biz="sub:community"]'); await wait(pg, 250); await ev(pg, "(() => { const B = PBL.L.career.biz; B.cash = 3; B.ch.k = null; PBL.render(); })()"); await wait(pg, 200);
  const f0 = await ev(pg, "PBL.L.career.biz.fans"); await clear0(); await pg.click('[data-biz="char:court"]'); await wait(pg, 300);
  ok('community event raises fan rating and costs savings', await ev(pg, "PBL.L.career.biz.fans") > f0 && await ev(pg, "PBL.L.career.biz.cash") < 3);
  await clear0(); await tab('rivals'); await wait(pg, 200);
  ok('Rivals tab renders a sortable tracker', await ev(pg, "!!document.querySelector('table[data-sid=\"biz-rv\"]') || /No rivals yet/.test(document.querySelector('#main').textContent)"));
  await noOv0('brand + rivals pages');
  await tab('overview');
  // Phase 4: interviews, locker room, extension, trade request, news, free agency offers
  await tab('life');
  const clear = async () => { await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); PBL.closeDialog(); document.querySelector('#modal').innerHTML = ''; })()"); await wait(pg, 200); };
  const modal = () => ev(pg, "document.querySelector('#modal').textContent");
  const noOv = async n => { const o = await ev(pg, "document.documentElement.scrollWidth > window.innerWidth + 1 || (document.querySelector('#modal') && document.querySelector('#modal').scrollWidth > document.querySelector('#modal').clientWidth + 1)"); ok('no horizontal scroll: ' + n, !o); };
  await clear(); await ev(pg, "(() => { const L = PBL.L; L.career.pop = []; L.career.cur = null; L.career.ivQ = null; carIvAsk(L, 'win', { opp: (L.teams[L.career.lastTeam === 0 ? 1 : 0]).id, pts: 31, win: true, home: true }); PBL.render(); })()"); await wait(pg, 800);
  const iv = await popFind(/Post-game interview/);
  ok('interview popup with 3 answers', /Post-game interview/.test(iv) && await ev(pg, "document.querySelectorAll('[data-civ]').length") === 3, iv.slice(0, 100) + (/Post-game/.test(iv) ? '' : await ev(pg, "JSON.stringify({ pend: CAR.pending(), cur: !!PBL.L.career.cur, q: PBL.L.career.ivQ, busy: PBL.popupBusy(), ov: !!document.getElementById('ov'), ph: PBL.L.phase })")));
  await shot('car-10-interview'); await noOv('interview popup');
  const b4 = await ev(pg, "(() => { const C = PBL.L.career, p = PBL.L.players[C.pid]; return { tr: C.trust, ch: C.chem, fb: p.fameBase || 0 }; })()");
  await pg.click('[data-civ="0"]'); await wait(pg, 500);
  const ar = await modal(); const af = await ev(pg, "(() => { const C = PBL.L.career, p = PBL.L.players[C.pid]; return { n: C.iv.length, q: !!C.ivQ, tr: C.trust, ch: C.chem, fb: p.fameBase || 0, fx: C.iv[0] && C.iv[0].fx }; })()");
  ok('answer applied (trust / chem / fame) and stored', /On the record/.test(ar) && af.n === 1 && !af.q && af.tr === b4.tr + af.fx.trust && af.ch === b4.ch + af.fx.chem && af.fb === b4.fb + af.fx.fame, [b4, af]);
  await clear(); await ev(pg, "location.hash = '#career'; PBL.render()"); await wait(pg, 600); await clear();
  ok('Interviews hub panel lists it', await ev(pg, "/Told|“/.test(document.querySelector('#car-iv').textContent) && document.querySelectorAll('#car-iv .car-ivrow').length === 1"));
  ok('Locker room panel lists coach + teammates', await ev(pg, "document.querySelectorAll('#car-rel .car-relrow').length >= 10"));
  // Talk to coach
  await ev(pg, "document.getElementById('car-talk').scrollIntoView()"); const tr0 = await ev(pg, "PBL.L.career.trust"); await pg.click('#car-talk'); await wait(pg, 400);
  const tk = await ev(pg, "(() => { const C = PBL.L.career; return { talk: C.talk, res: C.talkRes && C.talkRes.msg, tr: C.trust, dis: document.getElementById('car-talk').disabled, log: C.log.some(x => /Talked to the coach/.test(x.t)) }; })()");
  ok('Talk to coach: outcome, trust change, story line, once a week', !!tk.talk && !!tk.res && tk.tr !== tr0 && tk.dis && tk.log, [tr0, tk]);
  // extension: offer popup, ask, accept
  ok('no extension offer in the rookie year', await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; p.contract = { amt: 4, exp: L.season, type: 'rookie', len: 3, opt: null }; p.ext = null; L.career.ext = null; return carExtMake(L) === null; })()"));
  await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; p.rookieSeason = L.season - 1; (p.hist = p.hist || []).push({ s: L.season - 1, tid: p.team, age: p.age - 1, rs: { gp: 50, min: 50 * 1500, pts: 500, orb: 50, drb: 150, ast: 100, stl: 30, blk: 10, fgm: 200, fga: 450, tpm: 20, ftm: 80, fta: 100, tov: 60 } }); p.contract = { amt: 4, exp: L.season, type: 'rookie', len: 3, opt: null }; p.ext = null; p.mval = Math.max(p.mval || 1, 8); p.scout = 80; L.career.ext = null; carExtMake(L); PBL.render(); })()"); await wait(pg, 800);
  let ex = ''; for (let i = 0; i < 8; i++) { ex = await modal(); if (/Contract talks/.test(ex)) break; await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); PBL.closeDialog(); })()"); await wait(pg, 500); }
  ok('extension offer popup (Accept / Ask for more / Test free agency)', /Contract talks/.test(ex) && /Accept/.test(ex) && /Ask for more/.test(ex) && /Test free agency/.test(ex), ex.slice(0, 120));
  await noOv('extension popup'); await shot('car-11-extension');
  const am = await ev(pg, "PBL.L.career.ext.amt"); await pg.click('#modal [data-carext="ask"]'); await wait(pg, 600);
  const ax = await ev(pg, "(() => { const x = PBL.L.career.ext; return { st: x.st, amt: x.amt, ask: x.ask, msg: x.msg }; })()");
  ok('agent counter resolved (raised, firm or walked)', ax.ask && ax.msg && (ax.amt > am || ax.st === 'walked' || /budge/.test(ax.msg)), [am, ax]);
  if (ax.st === 'open') { await clear(); await ev(pg, "location.hash = '#career'; PBL.render()"); await wait(pg, 500); await clear(); await pg.click('#car-contract [data-carext="ok"]'); await wait(pg, 400);
    ok('Accept sets the extension', await ev(pg, "(() => { const p = PBL.L.players[PBL.L.career.pid]; return !!p.ext && p.ext.amt === PBL.L.career.ext.amt; })()")); } else ok('Accept skipped (team walked)', true);
  // trade request
  await clear(); await ev(pg, "location.hash = '#career'; PBL.render()"); await wait(pg, 500); await clear();
  const t0 = await ev(pg, "(() => { const C = PBL.L.career; return { tr: C.trust, ch: C.chem, team: PBL.L.players[C.pid].team }; })()");
  await ev(pg, "document.getElementById('car-treq').scrollIntoView()"); await pg.click('#car-treq'); await wait(pg, 300); await noOv('trade request confirm'); await pg.click('#car-treq-go'); await wait(pg, 500);
  const t1 = await ev(pg, "(() => { const L = PBL.L, C = L.career, p = L.players[C.pid]; return { req: p.tradeReq === L.season, tr: C.trust, ch: C.chem, news: L.log.some(x => x.text.includes(p.name) && /wants out|trade/i.test(x.text)), kk: L.log.slice(0, 3).map(x => x.k + '|' + x.text.slice(0, 50)) }; })()");
  ok('Request a trade sets tradeReq, drops trust + chem, logs news', t1.req && t1.tr < t0.tr && t1.ch < t0.ch && t1.news, [t0, t1]);
  ok('Request button replaced by notice', await ev(pg, "!document.getElementById('car-treq') && /asked for a trade/.test(document.querySelector('#car-contract').textContent)"));
  // Your news
  const nw = await ev(pg, "(() => { const e = document.getElementById('car-news'); return e ? { rows: e.querySelectorAll('.car-nrow').length, chips: e.querySelectorAll('[data-carnews]').length, txt: e.textContent.includes(PBL.L.players[PBL.L.career.pid].name) } : null; })()");
  ok('Your news panel lists stories naming him, with filters', nw && nw.rows >= 1 && nw.chips >= 2 && nw.txt, nw);
  await shot('car-12-life-hub'); await noOv('career hub with life panels');
  // the AI moves him
  const mv = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; p.ovr = Math.max(p.ovr, 66); p.mval = Math.max(p.mval || 1, 10); p.age = Math.min(p.age, 24); const d0 = L.day; L.day = Math.max(L.day, tradeOpenDay(L)); try { for (let i = 0; i < 150; i++) if (carTradeTry(L, 30)) return true; return false; } finally { L.day = d0; } })()");
  ok('AI trades a player who asked out', mv, mv ? undefined : await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; const d0 = L.day; L.day = Math.max(L.day, tradeOpenDay(L)); const r = { win: inTradeWindow(L), restr: tradeRestricted(L, p), nt: p.noTrade, req: p.tradeReq, s: L.season, ph: L.phase, ovr: p.ovr, age: p.age, ts: tradeStatus(L, p), tm: p.team, mode: L.mode, ntc: p.contract && p.contract.ntc, inj: p.injury, hard: p.hardship }; L.day = d0; return r; })()"));
  if (mv) { await ev(pg, "PBL.render()"); await wait(pg, 600); const md = await popFind(/trades you/);
    ok('traded popup; chem / relationships reset', /trades you/.test(md) && await ev(pg, "(() => { const C = PBL.L.career; return C.chem === 45 && Object.keys(C.rel).length === 0 && !PBL.L.players[C.pid].tradeReq; })()"), md.slice(0, 100)); await noOv('traded popup'); }
  // free agency offers for a career free agent
  await clear(); await ev(pg, "(() => { const L = PBL.L, C = L.career, p = L.players[C.pid]; L.phase = 'off-resign'; L.resign = []; toFA(L, p); startFA(L); C.pop = []; PBL.render(); })()"); await wait(pg, 800);
  let fa = ''; for (let i = 0; i < 8; i++) { fa = await modal(); if (/Free agency offers/.test(fa)) break; await ev(pg, "(() => { const c = document.getElementById('p3-cer'); if (c) c.remove(); PBL.closeDialog(); })()"); await wait(pg, 500); }
  const fo = await ev(pg, "(() => { const L = PBL.L, C = L.career; return { cards: document.querySelectorAll('#modal .car-offer').length, hold: !!C.hold, inFA: L.fa.includes(C.pid) }; })()");
  ok('FA offers popup: team / years / $ / role / status, held out of the AI pool', /Free agency offers/.test(fa) && fo.cards >= 3 && fo.hold && !fo.inFA && /Per year/.test(fa) && /Role/.test(fa) && /Contender|Playoff hopeful|Rebuilding|Tanking/.test(fa), [fo, fa.slice(0, 100)]);
  await noOv('FA offers popup'); await shot('car-13-fa-offers');
  await ev(pg, "(() => { const L = PBL.L; faDay(L); faDay(L); PBL.render(); })()"); await wait(pg, 400);
  ok('AI does not sign him while he decides', await ev(pg, "(() => { const p = PBL.L.players[PBL.L.career.pid]; return p.team == null && !!PBL.L.career.hold; })()"));
  await pg.click('#modal [data-carfa="0"]'); await wait(pg, 600);
  const fs2 = await ev(pg, "(() => { const L = PBL.L, p = L.players[L.career.pid]; return { team: p.team, c: p.contract && p.contract.amt, hold: !!L.career.hold, news: L.log.some(x => x.k === 'car' && /sign|terms|contract|extends|locks/i.test(x.text) && x.text.includes(p.name)) }; })()");
  ok('picking an offer signs him via signContract', fs2.team != null && fs2.c > 0 && !fs2.hold, fs2);
  await clear();
  const ov = await ev(pg, "document.documentElement.scrollWidth > window.innerWidth + 1"); ok('no horizontal page scroll on career hub', !ov);
  await ev(pg, "PBL.closeDialog()"); await wait(pg, 300); await shot('car-08-pro-hub');
  ok('no page errors', !errs.length, errs.slice(0, 5));
  await b.close(); console.log(fails ? `\n${fails} FAILED` : '\nALL PASS'); process.exit(fails ? 1 : 0);
})();
