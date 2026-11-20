// Court plays check (Nov 20 2026): sims 40 days from the franchise save, prints a hash of every box score (must not change when
// only logging changes) and how many of your play-by-play lines carry play info (entry[11]).
const {run} = require('./snap.js')('src', 5, 'tools/snap/nba-team-s10.json.gz');
console.log(run(`(()=>{ const L = SL; for (let i = 0; i < 40; i++) simDay(L);
  let h = 0; const g = L.games.filter(x => x.played || x.box);
  for (const x of g) { const s = JSON.stringify([x.hs, x.as, x.box]); for (let i = 0; i < s.length; i++) h = (h * 31 + s.charCodeAt(i)) | 0; }
  const mine = g.filter(x => x.pbp); let n = 0, wp = 0; const by = {};
  for (const x of mine) for (const e of x.pbp) { n++; if (e[11]) { wp++; by[e[11][0]] = (by[e[11][0]] || 0) + 1; } }
  return JSON.stringify({ games: g.length, hash: h, userGames: mine.length, entries: n, withPlay: wp, by, sample: mine[0] && mine[0].pbp.find(e => e[11]) }); })()`));
