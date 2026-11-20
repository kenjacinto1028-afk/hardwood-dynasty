// Fantasy league check (Nov 20 2026): node tools/fantasy.js
// Creates a fantasy league on day 0 of the saved NBA league, sims the regular season, checks draft, scores, waivers, playoffs, champion,
// and that the league's own results are the same with and without the fantasy league.
const fs = require('fs');
let fails = 0; const ok = (n, c, x) => { console.log((c ? 'PASS ' : 'FAIL ') + n + (x !== undefined ? '  [' + JSON.stringify(x) + ']' : '')); if (!c) fails++; };
const mk = fan => { const o = require('./snap.js')('src', 5, 'tools/snap/nba-team-s10.json.gz'); if (fan) o.run(fs.readFileSync('src/fantasy.js', 'utf8')); return o; };
const A = mk(true), B = mk(false);
const r = JSON.parse(A.run(`(()=>{const L=SL;const F=FAN.create(L,'Test Ballers');const D=F.draft;const out={aiFirst:D.i,yourTurn:D.ord[D.i]===0};
while(FAN.drafting(L)){ if(D.ord[D.i]===0){FAN.draftPick(L,FAN.bestFor(L,0).id);} FAN.aiDraft(L);}
out.sizes=F.teams.map(t=>t.r.length);out.uniq=new Set(F.teams.flatMap(t=>t.r.map(e=>e.pid))).size;
let g=0;while(L.phase==='regular'&&g++<400){ simDay(L); if(L.day===F.start+10){const fa=FAN.pool(L).filter(p=>FAN.owner(F,p.id)<0).sort((a,b)=>FAN.proj(L,b)-FAN.proj(L,a))[0];out.add=FAN.userAdd(L,fa.id,F.teams[0].r[9].pid);} }
out.wk=F.wk;out.nW=F.nW;out.nR=F.nR;out.res=F.res.length;out.champ=F.champ;out.hist=L.fanHist;
out.wl=F.teams.reduce((a,t)=>a+t.w+t.l,0);out.games=F.nR*4*2;
out.scores=F.res[0].map(x=>[x.sa,x.sb]);out.aiMoves=F.moves.filter(m=>m.ti>0).length;out.youMoves=F.moves.filter(m=>m.ti===0).length;
out.tbl=FAN.table(F).map(x=>x.t.n+' '+x.t.w+'-'+x.t.l+' '+x.t.pf);
out.news=L.log.filter(x=>/Fantasy/.test(x.text)).length;
out.hash=L.games.map(g=>g.hs+'-'+g.as).join(',').length+':'+L.games.slice(-30).map(g=>g.hs+'-'+g.as).join(',');
return JSON.stringify(out);})()`));
const hb = B.run(`(()=>{const L=SL;let g=0;while(L.phase==='regular'&&g++<400)simDay(L);return L.games.map(g=>g.hs+'-'+g.as).join(',').length+':'+L.games.slice(-30).map(g=>g.hs+'-'+g.as).join(',');})()`);
console.log(JSON.stringify({ ...r, hash: undefined }, null, 0));
ok('AI drafts until your turn', r.yourTurn || r.aiFirst === 0);
ok('every team drafted 10', r.sizes.every(n => n === 10), r.sizes);
ok('no player on two teams', r.uniq === 80, r.uniq);
ok('all weeks played', r.wk === r.nW && r.res === r.nW, [r.wk, r.nW]);
ok('W-L adds up', r.wl === r.games, [r.wl, r.games]);
ok('scores are real numbers', r.scores.every(([a, b]) => a > 100 && b > 100), r.scores);
ok('your waiver add worked', r.add === null, r.add);
ok('AI managers made waiver moves', r.aiMoves > 0, r.aiMoves);
ok('champion crowned', r.champ != null && r.hist && r.hist.length === 1, r.hist);
ok('news line', r.news === 1);
ok('league results unchanged', r.hash === hb);
console.log(fails ? fails + ' FAIL' : 'ALL PASS');
