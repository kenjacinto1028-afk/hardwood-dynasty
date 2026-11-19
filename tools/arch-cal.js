// v35: calibrate ARCH_CAL / SARCH_CAL from generated players: node tools/arch-cal.js [src]  (prints JSON to paste into league.js)
const fs = require('fs'), vm = require('vm'); const SRC = process.argv[2] || 'src'; let s = +(process.env.SEED || 35);
const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ctx = vm.createContext({ console, Math: Object.create(Math, { random: { value: rnd } }), setTimeout, clearTimeout, Date, performance, structuredClone, JSON, Object, Array, Set, Map });
vm.runInContext(fs.readFileSync(SRC + '/engine.js', 'utf8') + '\n' + fs.readFileSync(SRC + '/league.js', 'utf8'), ctx);
const out = vm.runInContext(`(function(){
const N = +(${process.env.N || 3000}), ps = [], used = new Set();
for (let i = 0; i < N * 5; i++) { const p = genPlayer(POS[i % 5], gauss(0, 1), 18 + Math.floor(R() * 16), used); ps.push(p); used.clear(); }
const cal = {}, share = {};
for (const pos in ARCH) { cal[pos] = {}; const g = ps.filter(p => POS[p.pos] === pos);
  for (const n in ARCH[pos]) { const v = g.map(p => archVal(p, ARCH[pos][n])), m = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length); cal[pos][n] = [+m.toFixed(1), +sd.toFixed(1), 0]; } }
Object.assign(ARCH_CAL, cal);
// offsets: even out how often each type is the main one (target 1/8 each)
for (let it = 0; it < 40; it++) {
  for (const pos in ARCH) { const g = ps.filter(p => POS[p.pos] === pos), cnt = {}; for (const n in ARCH[pos]) cnt[n] = 0;
    for (const p of g) { const a = archetypes(p)[0]; if (a.p === pos) cnt[a.n]++; }
    const tot = Object.values(cnt).reduce((a, b) => a + b, 0), k = Object.keys(cnt).length; share[pos] = {};
    for (const n in cnt) { const f = cnt[n] / tot; share[pos][n] = +(f * 100).toFixed(1); ARCH_CAL[pos][n][2] = +(ARCH_CAL[pos][n][2] + 0.25 * Math.log((1 / k) / Math.max(0.005, f))).toFixed(3); } } }
const sc = {}; for (const n in SARCH) { const g = ps.filter(p => p.ovr >= 78 && (SARCH[n].pos.includes(p.pos))); const v = g.map(p => archVal(p, SARCH[n].w)), m = v.reduce((a, b) => a + b, 0) / v.length, sd = Math.sqrt(v.reduce((a, b) => a + (b - m) ** 2, 0) / v.length); sc[n] = [+m.toFixed(1), +sd.toFixed(1)]; }
return JSON.stringify({ cal: ARCH_CAL, sc, share, n: ps.filter(p => p.ovr >= 78).length });
})()`, ctx);
console.log(out);
