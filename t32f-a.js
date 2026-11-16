// v32f-a: node tools/t32f-a.js [seasons]   (SEED=n default 3; seasons simmed before the checks, default 1; SAVE=path writes the league json for the browser check; LOAD=path starts from that saved league instead of simming)
// One universe: the History tab, team pages, player pages and trophy case show NBA seasons and this league's seasons as one history.
// Renders the real app.js views in node with a small DOM stub and checks the HTML text:
//  A no "Real NBA" / "(real" / "real NBA" / "historical" text in History (every tab), team (overview + history), player pages and trophy cases
//  B History > Seasons is one list in order (newest first: this league's seasons, then 2025-26 ... 1946-47); no separate Real NBA tab
//  C Championships list totals: each team's count = NBA titles + titles won here; no "in this league" text; defunct franchise row kept
//  D team pages: summary counts match the data (titles, Finals appearances, Finals losses), Finals MVPs of earlier titles in Award winners
//  E dynasties and eras: no `real` class, no muted rows, no "real NBA" text
//  F trophy case: one case, no "(real NBA)", a real star and a non-star both show their honors; rating chart note has no "real"
const fs = require('fs'), vm = require('vm');
const SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 3, N = +process.argv[2] || 1;
const load = require('./load.js');
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { ctx, run } = load(SRC, SEED);
// ---- DOM stub: any property / call returns another stub, so app.js loads without a browser
const deep = () => new Proxy(function () { }, { get: (t, k) => k === Symbol.toPrimitive ? () => '' : k === 'length' ? 0 : k === 'then' ? undefined : deep(), apply: () => deep(), construct: () => deep(), set: () => true, has: () => true });
for (const k of ['document', 'localStorage', 'sessionStorage', 'location', 'navigator', 'matchMedia', 'requestAnimationFrame', 'indexedDB', 'Image', 'Audio', 'Blob', 'alert', 'confirm', 'prompt', 'getComputedStyle', 'fetch', 'HTMLElement', 'CSS', 'ResizeObserver', 'IntersectionObserver', 'MutationObserver', 'Worker', 'FileReader', 'XMLHttpRequest', 'DOMParser', 'XMLSerializer']) ctx[k] = deep();
ctx.window = ctx; ctx.self = ctx;
for (const k of ['addEventListener', 'removeEventListener', 'dispatchEvent', 'scrollTo', 'open', 'print']) ctx[k] = deep();
process.on('unhandledRejection', () => { });
const read = f => fs.readFileSync(SRC + '/' + f, 'utf8');
const app = read('app.js'); const cut = app.indexOf('// ---------- boot ----------');
// app.js is one closure: cut before the boot block and expose the views we render
const hook = `\nwindow.__t = { get L() { return L; }, set L(v) { L = v; }, ui, vHistory, vTeam, vPlayer, trophyCase, dynastyView, titleRibbon };\n})();`;
try { vm.runInContext(read('vendor-faces.js') + '\n' + app.slice(0, cut) + hook, ctx); } catch (e) { console.log('app.js load failed: ' + e.stack); process.exit(1); }
// ---- league + seasons
if (process.env.LOAD) { ctx.__snap = JSON.parse(fs.readFileSync(process.env.LOAD, 'utf8')); run(`var L = __snap; NEXT_ID = L.nextId || (Math.max(...Object.keys(L.players).map(Number)) + 1); migrateLeague(L); LCUR = L;`); }
else run(`var L = newLeague({mode:'commish',size:30,userTeam:undefined,games:82,nba:true}); LCUR = L;`);
// the engine's L (script global) and the app's closure L must be the same league: the app reads it through window.__t
ctx.__t.L = run(`L`);
const t0 = Date.now();
for (let y = 0; y < (process.env.LOAD ? 0 : N); y++) run(`(function(){let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);startOffseason(L);})()`);
const nSim = run(`L.history.length`);
chk('league has ' + (process.env.LOAD ? 'a saved league with ' : 'simmed ') + nSim + ' season(s) in L.history', nSim >= 1, nSim + ' in ' + Math.round((Date.now() - t0) / 1000) + 's');
if (process.env.SAVE) { fs.writeFileSync(process.env.SAVE, run(`JSON.stringify(L)`)); }
const R = c => run(`(function(){${c}})()`);
const bannedRe = /Real NBA|real NBA|\(real|\(Real|historical|Historical/;
const txt = h => String(h).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');
const viewHist = tab => R(`const ui=__t.ui;ui.view='history';ui.histTab=${JSON.stringify(tab)};ui.hs=null;return __t.vHistory()`);
// ---------- A + B: History ----------
const tabs = ['seasons', 'dyn', 'book', 'awards', 'greats', 'records', 'ach', 'legends', 'nba'];
for (const tb of tabs) { const h = viewHist(tb); const hit = txt(h).match(bannedRe); chk('History tab "' + tb + '": no real-vs-game text', !hit, hit ? hit[0] : null); }
chk('no "Real NBA history" sub-tab button', !/data-histtab="nba"/.test(viewHist('seasons')) && !/Real NBA history/.test(viewHist('seasons')));
chk('ui.histTab "nba" (old save) falls back to Seasons', /League history/.test(viewHist('nba')));
const sh = viewHist('seasons');
const seasonsPanel = sh.slice(sh.indexOf('League history'), sh.indexOf('Championships'));
const rows = seasonsPanel.split('<tr').slice(1).map(r => txt('<tr' + r).trim().match(/^(\d{4}-\d{2})/)).filter(Boolean).map(m => m[1]);
const start = x => +x.slice(0, 4);
chk('Seasons list has this league\'s seasons + 80 NBA seasons', rows.length === nSim + 80, rows.length);
chk('Seasons list: newest first, no gaps (2026-27 ... 1946-47)', rows.every((r, i) => i === 0 || start(rows[i - 1]) === start(r) + 1), rows.slice(0, 4).join(',') + ' ... ' + rows.slice(-2).join(','));
chk('Seasons list: starts at this league\'s latest season, ends 1946-47', start(rows[0]) === 2025 + nSim && rows[rows.length - 1] === '1946-47', rows[0] + ' / ' + rows[rows.length - 1]);
chk('Seasons list: a NBA row and a league row use the same columns', (seasonsPanel.match(/<th /g) || []).length === 6);
// ---------- C: Championships ----------
const C = R(`const hist=nbaHist();const per={};for(const t of L.teams)per[t.abbr]={n:nbaTitlesAll(L,t),real:nbaRealTitles(L,t).length,sim:t.titles||0,simHist:L.history.filter(h=>h.champion===t.id).length};const known=new Set(L.teams.map(nbaAbOf));return {per,champRows:hist.filter(h=>h.champ).length,gone:hist.filter(h=>h.champ&&!known.has(h.champ)).length,goneTeams:new Set(hist.filter(h=>h.champ&&!known.has(h.champ)).map(h=>h.champ)).size,simChamps:L.history.filter(h=>h.champion!=null).length}`);
const cp = sh.slice(sh.indexOf('<h2>Championships</h2>'));
const cpEnd = cp.indexOf('</section>'); const champHtml = cp.slice(0, cpEnd);
const champRows = champHtml.split('class="leader"').slice(1).map(r => { const m = txt(r.replace(/<div\s*$/, '')).trim().match(/^(.*\D)\s+(\d+)$/); return m ? [m[1].trim(), +m[2]] : null; }).filter(Boolean);
const total = champRows.reduce((a, r) => a + r[1], 0);
chk('Championships total = NBA champions + this league\'s champions', total === C.champRows + C.simChamps, total + ' vs ' + (C.champRows + C.simChamps));
chk('sim titles in L.history match team.titles', Object.values(C.per).every(x => x.sim === x.simHist));
chk('Championships rows: each team shows NBA titles + titles won here', Object.entries(C.per).filter(([ab, x]) => x.n).every(([ab, x]) => champRows.filter(r => r[1] === x.n).length >= 1) && champRows.length === Object.values(C.per).filter(x => x.n).length + C.goneTeams, champRows.length + ' rows');
chk('Championships: no "in this league" / source text', !/in this league|plus titles won|Real NBA/.test(txt(champHtml)));
chk('Championships: defunct franchise row kept (Baltimore Bullets)', /Baltimore Bullets/.test(champHtml));
chk('Championships sorted by count', champRows.every((r, i) => i === 0 || champRows[i - 1][1] >= r[1]));
// ---------- D + E: team pages ----------
let teamBad = 0, teamMis = 0, mvpMissing = 0;
for (let tid = 0; tid < 30; tid++) {
  for (const tab of ['overview', 'history']) {
    const h = R(`const ui=__t.ui;ui.view='teams';ui.team=${tid};ui.teamTab=${JSON.stringify(tab)};return __t.vTeam(L.teams[${tid}])`);
    if (bannedRe.test(txt(h)) || /\d+ real,/.test(txt(h))) { teamBad++; out.push('  banned text on team ' + tid + ' ' + tab + ': ' + (txt(h).match(/.{0,30}(Real NBA|real NBA|\(real|\d+ real,).{0,30}/) || [''])[0]); }
    if (tab === 'history') {
      const D = R(`const t=L.teams[${tid}];const F=nbaRealFinals(L,t),ab=nbaAbOf(t);const sf=L.history.filter(h=>h.champion===t.id||h.runnerUp===t.id).length;return {titles:nbaTitlesAll(L,t),finals:F.length+sf,lost:F.filter(h=>h.ru===ab).length+L.history.filter(h=>h.runnerUp===t.id).length,fm:F.filter(h=>h.champ===ab&&h.fmvp).length}`);
      const T = txt(h);
      const cm = T.match(/Championships (\d+)/), fm = T.match(/Finals appearances (\d+)/), lm = T.match(/Finals losses (\d+)/);
      if (!cm || +cm[1] !== D.titles || !fm || +fm[1] !== D.finals || !lm || +lm[1] !== D.lost) { teamMis++; out.push('  mismatch team ' + tid + ': ' + JSON.stringify(D) + ' vs ' + [cm && cm[1], fm && fm[1], lm && lm[1]]); }
      if ((h.match(/Finals MVP: /g) || []).length < D.fm) mvpMissing++;
      if (/Real NBA history<\/h3>/.test(h)) teamBad++;
    }
  }
}
chk('30 team pages (overview + history): no real-vs-game text, no separate Real NBA panel', teamBad === 0, teamBad);
chk('30 team pages: Championships / Finals appearances / Finals losses match the data', teamMis === 0, teamMis);
chk('30 team pages: Finals MVPs of earlier titles appear in Award winners', mvpMissing === 0, mvpMissing);
{
  const h = R(`const ui=__t.ui;ui.view='teams';ui.team=${5};ui.teamTab='history';return __t.vTeam(L.teams[5])`); const T = txt(h);
  chk('team page: titles years listed in order with the count', /Championships \d+ (\d{4}-\d{2}(, )?)+/.test(T) || /Championships 0/.test(T), (T.match(/Championships.{0,80}/) || [''])[0]);
  let hdrBad = 0; for (let tid = 0; tid < 30; tid++) { const hh = txt(R(`const ui=__t.ui;ui.view='teams';ui.team=${tid};ui.teamTab='overview';return __t.vTeam(L.teams[${tid}])`)); const exp = R(`return nbaTitlesAll(L,L.teams[${tid}])`); const m = hh.match(/Titles (\d+)/i); if (!m || +m[1] !== exp) hdrBad++; }
  chk('30 team headers: Titles tile = NBA + league titles (not league only)', hdrBad === 0, hdrBad);
  const rib = R(`return __t.titleRibbon(L.teams[5])`);
  chk('team header ribbon: combined counts, no real wording', !bannedRe.test(txt(rib)) && /champions|titles/.test(txt(rib)) || /No titles/.test(txt(rib)), txt(rib));
}
{
  const d = R(`const ui=__t.ui;__t.ui.view='history';__t.ui.histTab='dyn';return __t.dynastyView()`);
  chk('dynasties & eras: no real class, no muted rows, no "real NBA", no "greyed"', !/dyncard real|class="muted"><td|real NBA|greyed/.test(d) && !/<tr class="muted">/.test(d));
  chk('dynasties list includes pre-league dynasties (Celtics / Lakers eras present)', /Celtics|Lakers|Bulls/.test(d));
}
// ---------- F: players ----------
const P = R(`const ps=Object.values(L.players);const star=ps.filter(p=>p.real&&(p.awards||[]).some(a=>a.real&&a.a==='MVP')).sort((a,b)=>b.ovr-a.ovr)[0];const plain=ps.filter(p=>p.real&&!(p.awards||[]).some(a=>a.real)&&nbaRealHonors(p.name).length)[0];const role=ps.filter(p=>p.real&&!p.retired&&p.team!=null&&!(p.awards||[]).length&&!nbaRealHonors(p.name).length)[0];return {star:star&&star.id,plain:plain&&plain.id,role:role&&role.id,sim:ps.filter(p=>!p.real&&p.hist.length&&!p.retired)[0]?.id}`);
let pOK = 0;
for (const [k, id] of Object.entries(P)) {
  if (id == null) { out.push('  (no ' + k + ' player found)'); continue; }
  const h = R(`const ui=__t.ui;ui.view='players';ui.player=${id};return __t.vPlayer(L.players[${id}])`); const T = txt(h);
  const hit = T.match(/.{0,30}(Real NBA|real NBA|\(real|\(Real|historical|\best\.|real seasons|real NBA seasons|Sim seasons only|real \+ sim|real NBA \+ sim).{0,30}/);
  chk('player page (' + k + '): no real/sim/est wording', !hit, hit ? hit[0] : null);
  if (/Overall rating by season/.test(T)) chk('player page (' + k + '): rating chart note has no "real"', !/real/i.test((T.match(/Overall rating by season.{0,300}/) || [''])[0]));
  chk('player page (' + k + '): one career table (no est rows, no estimated styling)', !/class="est"/.test(h)); pOK++;
}
{
  const { star, plain } = P;
  if (star != null) { const tc = R(`return __t.trophyCase(L.players[${star}])`); chk('trophy case (star): one case, MVP drawn, no "(real NBA)"', /Trophy case/.test(tc) && /MVP/.test(tc) && !/real/i.test(txt(tc)) && (tc.match(/class="trcase"/g) || []).length === 1); }
  if (plain != null) {
    const H = R(`return nbaRealHonors(L.players[${plain}].name).map(h=>h.n)`);
    const tc = R(`return __t.trophyCase(L.players[${plain}])`);
    chk('trophy case (player with NBA honors only in the award list): drawn like any other', /Trophy case/.test(tc) && H.every(n => tc.includes(n === 'Defensive POY' ? 'DPOY' : n === 'Sixth Man' ? 'Sixth Man' : n.replace('Most Improved', 'Most Improved'))) && !/real/i.test(txt(tc)) && (tc.match(/class="trcase"/g) || []).length === 1, H.join(','));
  }
  chk('no "Before this league" heading in any trophy case', !R(`return Object.values(L.players).filter(p=>p.real).slice(0,200).some(p=>/Before this league|real NBA/.test(__t.trophyCase(p)))`));
}
// ---------- G: texts ----------
{
  const files = ['app.js', 'league.js', 'engine.js', 'nba-setup.js', 'nba-text.js'];
  const pat = /(Real NBA|real NBA|\(real\)|\(real NBA\)|[Hh]istorical|Real 2026|real rosters|real ones|real scale|real life|Real teams)/;
  const hits = [];
  for (const f of files) read(f).split('\n').forEach((l, i) => { const s = l.trim(); if (s.startsWith('//')) return; const m = l.replace(/\/\/.*$/, '').match(pat); if (m) hits.push(f + ':' + (i + 1) + ' ' + m[0]); });
  chk('user-facing strings: no "Real NBA" / "(real)" / "historical" left in app, league, engine, nba-setup, nba-text', hits.length === 0, hits.join(' | '));
  const nt = R(`return JSON.stringify(NBA_TEXT)`);
  chk('NBA_TEXT (setup + how it works): no "real"', !/real/i.test(nt), (nt.match(/.{0,20}real.{0,20}/i) || [''])[0]);
}
console.log(out.join('\n') + `\nt32f-a: ${ok} pass, ${bad} fail`);
process.exit(bad ? 1 : 0);
