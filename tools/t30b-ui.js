// v30b: node tools/t30b-ui.js  (SEED=n)  engine hook for the live play-by-play (6b): on-court 5s, minutes, plus-minus replay
// A replay of g.pbp at the end equals the box score (minutes within 1s per player, +/- exact); 10 on-court ids, 5 per side, all on the team;
// lineups change over a game; every pbp entry replays at any point (court always 10 ids); NBA + small league; speed overhead.
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 3;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
for (const nba of [true, false]) {
  const { run } = load(SRC, SEED);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'team',size:30,userTeam:3,games:82,nba:${nba}});
    const o={n:0,minBad:0,pmBad:0,court10:0,sideBad:0,changes:0,teamMin:[],sumPm:0,maxMinDiff:0,po:0};
    for(let i=0;i<40;i++)simDay(L);
    for(const g of L.games){ if(!g.pbp)continue; o.n++;
      const rp=pbpReplay(g); if(rp.court.length===10)o.court10++;
      const home=new Set(g.box.filter(r=>r[1]===0).map(r=>r[0]));
      rp.court.forEach((id,i)=>{if(home.has(id)!==(i<5))o.sideBad++;});
      for(const r of g.box){const m=(rp.min[r[0]]||0), d=Math.abs(m-r[2]);if(d>o.maxMinDiff)o.maxMinDiff=d;if(d>1)o.minBad++; if((rp.pm[r[0]]||0)!==r[18])o.pmBad++;}
      const tm=[0,0];for(const r of g.box)tm[r[1]]+=r[2];o.teamMin.push(tm[0]/60,tm[1]/60);
      o.changes+=g.pbp.filter(e=>e[8]).length;
      let p=0;for(const r of g.box)if(r[1]===0)p+=r[18];o.sumPm+=Math.abs(p-5*(g.hs-g.as));
      for(const k of [1,5,50,g.pbp.length>>1]){const x=pbpReplay(g,k);if(x.court.length!==10)o.court10--;}
    }
    return JSON.stringify(o);})()`));
  const t = nba ? 'NBA' : 'PBL';
  chk(t + ': user games have a log', r.n >= 10, r.n);
  chk(t + ': 10 on-court ids at the end and at any point', r.court10 === r.n, r.court10 + '/' + r.n);
  chk(t + ': home 5 first, away 5 second', r.sideBad === 0);
  chk(t + ': replayed minutes match the box (<=1s)', r.minBad === 0, 'bad ' + r.minBad + ' max diff ' + r.maxMinDiff);
  chk(t + ': replayed +/- equals box +/-', r.pmBad === 0, 'bad ' + r.pmBad);
  chk(t + ': home +/- sums to 5x the score margin (5 on court)', r.sumPm === 0, r.sumPm);
  chk(t + ': minutes add up to 240 per team (or more with OT)', r.teamMin.every(m => m >= 239 && m <= 301), Math.min(...r.teamMin) + '-' + Math.max(...r.teamMin));
  chk(t + ': lineups change during games (subs logged)', r.changes > r.n * 8, (r.changes / r.n).toFixed(1) + ' per game');
}
// speed: 40 days with logs on (user) vs noLog
{
  const t = noLog => { const { run } = load(SRC, SEED); return +run(`(function(){const L=newLeague({mode:'team',size:30,userTeam:3,games:82,nba:true});L.noLog=${noLog};const t0=Date.now();for(let i=0;i<60;i++)simDay(L);return Date.now()-t0;})()`); };
  const a = t(false), b = t(true);
  chk('speed: logging overhead small', a < b * 1.5 + 400, 'with log ' + a + ' ms, no log ' + b + ' ms');
}
out.push(ok + ' pass, ' + bad + ' fail'); console.log(out.join('\n'));
process.exit(bad ? 1 : 0);
