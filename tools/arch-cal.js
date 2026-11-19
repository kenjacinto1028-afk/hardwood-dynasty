// v35: calibrate archetypes and playstyle norms. node tools/arch-cal.js  -> writes the ARCH_CAL / ARCH_CAL_NBA / PS_NORM / SARCH_CAL lines in src/league.js
// PBL: types calibrated on 15,000 generated players; NBA: on the real 2026-27 players. Norms: per position mean and spread of habits and skills in a new league.
const fs = require('fs'), path = require('path'), SRC = process.argv[2] || path.join(__dirname, '../src');
const load = require('./load.js');
const PSK = ['t3', 'tmd', 'trm', 'tps', 'tpa', 'tbd', 'tp', 'mid', 'fin', 'pst', 'pas', 'def'];
const body = (nba) => `(function(){
const PSK = ${JSON.stringify(PSK)}, ms = v => { const m = v.reduce((a, b) => a + b, 0) / v.length; return [+m.toFixed(1), +Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length).toFixed(1)]; };
const L = newLeague({ mode: 'commish', size: 30, games: 82${nba ? ', nba: true' : ''} });
const lg = Object.values(L.players).filter(p => !p.retired && p.team != null);
const norm = {}; for (const pos of POS) { norm[pos] = {}; const g = lg.filter(p => POS[p.pos] === pos); for (const k of PSK) norm[pos][k] = ms(g.map(p => k === 'def' ? (p.per + p.pdf) / 2 : p[k])); }
let ps = lg;
if (!${nba}) { ps = []; const used = new Set(); for (let i = 0; i < 15000; i++) { ps.push(genPlayer(POS[i % 5], gauss(0, 1), 18 + Math.floor(R() * 16), used)); used.clear(); } }
const CAL = ${nba} ? ARCH_CAL_NBA : ARCH_CAL;
for (const pos in ARCH) { CAL[pos] = {}; const g = ps.filter(p => POS[p.pos] === pos); for (const n in ARCH[pos]) CAL[pos][n] = ms(g.map(p => archVal(p, ARCH[pos][n]))).concat(0); }
const share = {}, K = ${nba} ? 0.15 : 0.25;
for (let it = 0; it < 40; it++) for (const pos in ARCH) { const g = ps.filter(p => POS[p.pos] === pos), cnt = {}; for (const n in ARCH[pos]) cnt[n] = 0;
  for (const p of g) { const a = archetypes(p)[0]; if (a.p === pos) cnt[a.n]++; }
  const tot = Object.values(cnt).reduce((a, b) => a + b, 0), k = Object.keys(cnt).length; share[pos] = {};
  for (const n in cnt) { const f = cnt[n] / tot; share[pos][n] = +(f * 100).toFixed(1); CAL[pos][n][2] = +clamp(CAL[pos][n][2] + K * Math.log((1 / k) / Math.max(0.01, f)), -1.2, 1.2).toFixed(3); } }
const sc = {}; for (const n in SARCH) { const g = ps.filter(p => p.ovr >= 78 && SARCH[n].pos.includes(p.pos)); sc[n] = ms(g.map(p => archVal(p, SARCH[n].w))); }
return JSON.stringify({ cal: CAL, norm, sc, share });
})()`;
const pbl = JSON.parse(load(SRC, 35).run(body(false))), nba = JSON.parse(load(SRC, 35).run(body(true)));
const f = SRC + '/league.js'; let s = fs.readFileSync(f, 'utf8'); const J = x => JSON.stringify(x);
s = s.replace(/^const ARCH_CAL = .*$/m, `const ARCH_CAL = ${J(pbl.cal)};   // [mean, spread, offset] per type`)
  .replace(/^(let|const) ARCH_CAL_NBA = .*$/m, `const ARCH_CAL_NBA = ${J(nba.cal)}, PS_NORM = { pbl: ${J(pbl.norm)}, nba: ${J(nba.norm)} };`)
  .replace(/^const SARCH_CAL = .*$/m, `const SARCH_CAL = ${J(pbl.sc)};`);
fs.writeFileSync(f, s);
console.log('PBL shares', J(pbl.share)); console.log('NBA shares', J(nba.share));
