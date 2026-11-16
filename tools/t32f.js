// S6b (v32i): node tools/t32f.js   (SEED=n default 3; sims 1 NBA season; LOAD=path uses a saved league json with 1+ seasons, SAVE=path writes it)
// History data (src/nba-history.js) + its pages: counts, no duplicates, consistency with champions, hidden source flags, game-formula BPM on
// history rows, rendered team history / records / Hall of Fame / seasons list, sim seasons add to franchise leaders and can set records.
const fs = require('fs'), vm = require('vm');
const SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 3;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { ctx, run } = require('./load.js')(SRC, SEED);
const deep = () => new Proxy(function () { }, { get: (t, k) => k === Symbol.toPrimitive ? () => '' : k === 'length' ? 0 : k === 'then' ? undefined : deep(), apply: () => deep(), construct: () => deep(), set: () => true, has: () => true });
for (const k of ['document', 'localStorage', 'sessionStorage', 'location', 'navigator', 'matchMedia', 'requestAnimationFrame', 'indexedDB', 'Image', 'Audio', 'Blob', 'alert', 'confirm', 'prompt', 'getComputedStyle', 'fetch', 'history', 'URL', 'FileReader', 'MutationObserver', 'ResizeObserver', 'IntersectionObserver', 'CompressionStream', 'DecompressionStream', 'Response', 'TextEncoder', 'TextDecoder', 'Event', 'CustomEvent', 'HTMLElement', 'Node', 'innerWidth', 'innerHeight', 'devicePixelRatio', 'screen', 'crypto', 'BroadcastChannel', 'Notification', 'speechSynthesis', 'SpeechSynthesisUtterance', 'AudioContext', 'webkitAudioContext', 'caches', 'Worker']) if (!(k in ctx)) ctx[k] = deep();
ctx.window = ctx; ctx.self = ctx; for (const k of ['addEventListener', 'removeEventListener', 'dispatchEvent', 'scrollTo', 'open', 'print']) ctx[k] = deep();
process.on('unhandledRejection', () => { });
const read = f => fs.readFileSync(SRC + '/' + f, 'utf8'), app = read('app.js'), cut = app.indexOf('// ---------- boot ----------');
try { vm.runInContext(read('vendor-faces.js') + '\n' + app.slice(0, cut) + `\nwindow.__t = { get L() { return L; }, set L(v) { L = v; }, ui, vHistory, vTeam, records };\n})();`, ctx); } catch (e) { console.log('app.js load failed: ' + e.stack); process.exit(1); }
if (process.env.LOAD) { ctx.__snap = JSON.parse(fs.readFileSync(process.env.LOAD, 'utf8')); run(`var L = __snap; NEXT_ID = L.nextId || (Math.max(...Object.keys(L.players).map(Number)) + 1); migrateLeague(L); LCUR = L;`); }
else run(`var L = newLeague({mode:'commish',size:30,userTeam:undefined,games:82,nba:true}); LCUR = L;`);
ctx.__t.L = run(`L`);
const R = c => run(`(function(){${c}})()`), txt = h => String(h).replace(/<[^>]*>/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ');

// ---------- A data counts + no duplicates + flags ----------
const A = R(`const H=NBA_HX;const fsN=Object.values(H.fs).reduce((a,v)=>a+v.length,0);
 const awK=new Set(H.aw.map(r=>r[0]+'|'+r[1]+'|'+hxNorm(r[2])));const retK=new Set(H.ret.map(r=>r[0]+'|'+r[1]+'|'+hxNorm(r[2])));
 const flags=[...Object.values(H.fs).flat(),...H.aw,...H.hof,...H.ret].map(r=>r[r.length-1]);
 const fl10=Object.values(H.fl).filter(d=>(d.RS.PTS||[]).length>=10).length;
 return {teams:Object.keys(H.fs).length,fsN,aw:H.aw.length,awU:awK.size,hof:H.hof.length,ret:H.ret.length,retU:retK.size,fl10,car:(H.rec.career.RS.PTS||[]).length,
  badFlag:flags.filter(f=>f!=='c'&&f!=='f').length,f:flags.filter(f=>f==='f').length,c:flags.filter(f=>f==='c').length,
  asNoStart:H.aw.filter(r=>r[1]==='AS'&&!r[5]).length,oppBlank:Object.values(H.rec.game.RS).flat().filter(r=>!r[3]).length,yrs:Object.keys(H.bpmRows).length};`);
chk('30 franchises, 1,687 franchise seasons', A.teams === 30 && A.fsN === 1687, A.teams + ' / ' + A.fsN);
chk('awards 4,000+ rows, no duplicate season+award+player', A.aw >= 4000 && A.awU === A.aw, A.aw + ' / ' + A.awU);
chk('Hall of Fame 263, retired numbers no duplicates', A.hof === 263 && A.retU === A.ret, A.hof + ' / ' + A.ret + ' ' + A.retU);
chk('franchise leaders: every team has a top-10 RS points list', A.fl10 === 30, A.fl10);
chk('career RS points top 25', A.car >= 25, A.car);
chk('every row carries a hidden source flag (c / f), both kinds present', A.badFlag === 0 && A.f > 0 && A.c > 0, 'c ' + A.c + ' f ' + A.f);
chk('gaps filled: every All-Star has a starter flag, no blank RS game-record opponent', A.asNoStart === 0 && A.oppBlank === 0, A.asNoStart + ' / ' + A.oppBlank);

// ---------- B consistency with the in-game champions ----------
const B = R(`let bad=[];for(const h of nbaHist()){const y=h.y;const win=Object.entries(NBA_HX.fs).find(([ab,v])=>v.some(r=>r[0]===y&&r[4]==='Won Finals'));const lose=Object.entries(NBA_HX.fs).find(([ab,v])=>v.some(r=>r[0]===y&&r[4]==='Lost Finals'));
 if(h.champ&&win&&win[0]!==h.champ)bad.push(y+' champ '+h.champ+'/'+win[0]);if(h.ru&&lose&&lose[0]!==h.ru)bad.push(y+' ru '+h.ru+'/'+lose[0]);}return bad;`);
chk('franchise seasons agree with in-game champions and runners-up (active franchises)', B.length === 0, B.slice(0, 5).join('; '));

// ---------- C game-formula BPM on history rows (v34: per team stint for traded seasons, as hxBpmOf since v33d) ----------
const C = R(`let n=0,has=0,diff=0;for(const p of Object.values(L.players)){if(!p.real)continue;for(const r of [...(nbaRealRows(p)||[]),...(nbaEstRows(p)||[])]){if(!r||!(r.mp>=500)||r.season==='2025-26')continue;n++;const b=hxBpmOf(p.name,+r.season.slice(0,4),r.team);if(b){has++;if(r.bpm===b[2])diff++;}}}
 const lg=nbaLegends();return {n,has,same:diff,leg:lg.filter(l=>l.rs&&NBA_HX.bpmLeg[hxNorm(l.name)]&&l.rs.bpm===NBA_HX.bpmLeg[hxNorm(l.name)][2]).length,legN:lg.length};`);
chk('history player rows (500+ min) use game-formula BPM', C.has / Math.max(1, C.n) >= 0.95 && C.same === C.has, C.has + ' of ' + C.n + ', set ' + C.same);
chk('legend careers use game-formula BPM', C.leg === C.legN, C.leg + ' / ' + C.legN);

// ---------- D rendered pages (before any sim season) ----------
const banned = /Real NBA|real NBA|\(real|historical|Historical|\bfilled\b|source flag/;
const team = R(`const ui=__t.ui;const t=L.teams.find(x=>hxAb(x)==='CHI');ui.view='teams';ui.team=t.id;ui.teamTab='history';return __t.vTeam(t)`);
chk('team history: franchise leaders, retired numbers, franchise seasons', /Franchise leaders/.test(team) && /Retired numbers/.test(team) && /Franchise seasons 1946-2026/.test(team) && /Michael Jordan/.test(team) && /72/.test(team));
chk('team history: no real-vs-game or source text', !banned.test(txt(team)), (txt(team).match(banned) || [])[0]);
const recs = R(`const ui=__t.ui;ui.view='history';ui.histTab='records';ui.hs=null;return __t.vHistory()`);
chk('records: Wilt 100 is the single-game points record', /Wilt Chamberlain/.test(recs) && txt(recs).includes('100'));
chk('records: career points led by LeBron (one list, real + sim)', /LeBron James/.test(recs) && /Kareem Abdul-Jabbar/.test(recs));
chk('records: box plus-minus season + career lists', /Box plus-minus · career/.test(recs) && /Box plus-minus · season/.test(recs));
chk('records: no real-vs-game or source text', !banned.test(txt(recs)), (txt(recs).match(banned) || [])[0]);
const aw = R(`const ui=__t.ui;ui.view='history';ui.histTab='awards';ui.hs=null;return __t.vHistory()`);
chk('Hall of Fame list includes history members', /Kareem Abdul-Jabbar|Larry Bird/.test(aw) && /Hall of Fame/.test(aw));
const sh = R(`const ui=__t.ui;ui.view='history';ui.histTab='seasons';ui.hs=null;return __t.vHistory()`);
chk('Seasons list: NBA seasons show the best record (1995-96 Bulls 72-10)', /Chicago Bulls <span class="muted">72-10<\/span>/.test(sh));

// ---------- E a sim season adds to franchise leaders and can set records ----------
const t0 = Date.now();
if (!process.env.LOAD) run(`(function(){let g=0;while(L.phase==='regular'&&g++<400)simDay(L);processPending(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);startOffseason(L);})()`);
if (process.env.SAVE) fs.writeFileSync(process.env.SAVE, run('JSON.stringify(L)'));
const E = R(`let pick=null;for(const t of L.teams){for(const r of ((NBA_HX.fl[hxAb(t)]||{}).RS||{}).PTS||[]){const q=Object.values(L.players).find(p=>hxNorm(p.name)===hxNorm(r[0]));if(!q)continue;const sp=(q.hist||[]).reduce((a,h)=>a+(h.tid===t.id&&h.rs&&!h.rsT?h.rs.pts:0),0);if(sp>0){pick={t,r,q,sp};break;}}if(pick)break;}
 const now=pick?hxLeaders(L,pick.t,'RS','PTS').find(x=>hxNorm(x.name)===hxNorm(pick.r[0])):null;const lb=pick?pick.r:null,simPts=pick?pick.sp:0,lp=pick?pick.q:Object.values(L.players)[0];
 L.records.game.pts=(L.records.game.pts||[]).concat([{pid:lp?lp.id:null,name:lp.name,v:101,s:L.season,lb:'test',opp:0}]);return {who:pick?pick.r[0]+' '+hxAb(pick.t):null,lb:lb?lb[1]:null,now:now?now.v:null,simPts,hist:L.history.length};`);
chk('a sim season is in the league history', E.hist >= 1, E.hist + ' in ' + Math.round((Date.now() - t0) / 1000) + 's');
chk('franchise leaders = history total + sim seasons with the team', E.who && E.now === E.lb + E.simPts, E.who + ': ' + E.lb + ' + ' + E.simPts + ' = ' + E.now);
const recs2 = R(`const ui=__t.ui;ui.view='history';ui.histTab='records';ui.hs=null;return __t.vHistory()`);
const g = recs2.slice(recs2.indexOf('Points · game'), recs2.indexOf('Points · game') + 600);
chk('a sim game can break the single-game record (101 tops Wilt 100)', /101/.test(txt(g)) && txt(g).indexOf('101') < txt(g).indexOf('100'), txt(g).slice(0, 120));

console.log(out.join('\n')); console.log(`t32f: ${ok}/${ok + bad} pass`); process.exit(bad ? 1 : 0);
