// ===== League layer: archetypes, contracts, trades, awards, history, offseason =====
let CAP = 150, MINSAL = 1, MINPAY = 120; // millions (v27: let, NBA mode switches to the real 2026-27 numbers in setEconomy)
let TAXLINE = 160, APRON = 170, MLE = 8, SPEND_K = 0.93, NBA_ON = false;
let MEDIA = 98, SHARE_PCT = 0.2;   // media rights per team; share of ticket and merchandise money pooled and split evenly     // tax line, hard cap ("apron"), mid-level exception, media rights per team
const MODE_LABEL = { tank: 'Tanking', rebuild: 'Rebuilding', hopeful: 'Playoff hopeful', contend: 'Contender' };
const money = x => '$' + (Math.round(x * 10) / 10).toFixed(1) + 'M';
const r1 = x => Math.round(x * 10) / 10;

// ---------- Archetypes (v35: how a player plays, not only what he is good at) ----------
// Each position has 8 distinct types. Weights mix shot habits (t3 threes, tmd mid-range, trm rim, tps post, tpa passing,
// tbd ball dominance, tcs catch-and-shoot, ttr transition, tcr crashing the glass, tgb gambling) with the skills behind them.
// 'l' + key = the opposite habit (ltbd = plays off the ball, lcs = pull-up, ltps = stays out of the post).
const ARCH = {
  PG: { 'Floor general': { tpa: 3, pas: 2, iq: 1.5, ltbd: 0.5 }, 'Scoring guard': { tbd: 3, drw: 1, hnd: 1, lcs: 1, ltpa: 1 }, '3pt sniper': { t3: 3, tp: 2.5 }, 'Slasher': { trm: 3, fin: 1.5, spd: 1, drw: 1 },
    'Mid-range maestro': { tmd: 3, mid: 1.5, lcs: 1 }, 'Defensive pest': { per: 2.5, stl: 2.5, tgb: 1, ltbd: 0.5 }, 'Jumbo playmaker': { hgtB: 2.5, tpa: 1.5, pas: 1.5 }, 'Rebounding guard': { drb: 2.5, tcr: 1.5, orb: 1 } },
  SG: { '3pt sniper': { t3: 3, tp: 2.5 }, 'Shot creator': { tbd: 2, lcs: 1.5, hnd: 1.5, mid: 1 }, 'Slasher': { trm: 3, fin: 1.5, spd: 1, drw: 1 }, 'Mid-range maestro': { tmd: 3, mid: 1.5, lcs: 1 },
    '3-and-D': { t3: 1.5, tcs: 1, per: 2.5, ltbd: 1 }, 'Lockdown defender': { per: 3, stl: 1, agi: 1, ltbd: 1 }, 'Combo guard': { tpa: 2.5, pas: 1.5, hnd: 1.5 }, 'Rebounding guard': { drb: 2.5, tcr: 1.5, orb: 1 } },
  SF: { 'Scoring wing': { tbd: 2, lcs: 1, mid: 1, hnd: 1, drw: 1 }, 'Slasher': { trm: 3, fin: 1.5, drw: 1.5, hnd: 0.5 }, 'Spot-up shooter': { t3: 3, tcs: 1.5, tp: 1.5, ltbd: 1 }, '3-and-D wing': { t3: 1.5, tcs: 1, per: 2.5, wingB: 1, ltbd: 0.5 },
    'Wing stopper': { per: 3, pdf: 1, wingB: 1, ltbd: 1 }, 'Point forward': { tpa: 3, pas: 2, hnd: 1 }, 'Athletic finisher': { ttr: 2, vrt: 2, fin: 1, ltbd: 1 }, 'Rebounding wing': { drb: 3, orb: 1.5, tcr: 1, str: 1 } },
  PF: { 'Stretch 4': { t3: 3, tp: 1.5, ltps: 1 }, 'Face-up 4': { tmd: 3, mid: 1.5, hnd: 1 }, 'Post scorer': { tps: 3, pst: 2, str: 1 }, 'Rim runner': { trm: 2.5, vrt: 1.5, fin: 1, ltbd: 1.5 },
    'Point 4': { tpa: 3, pas: 2, hnd: 1 }, 'Small-ball 4': { spd: 1.5, agi: 1.5, per: 1.5, ttr: 1 }, 'Glass cleaner': { tcr: 2.5, orb: 1.5, drb: 1.5, ltbd: 1 }, 'Rim protector': { blk: 3, pdf: 2, hgtB: 1 } },
  C: { 'Stretch 5': { t3: 3, tp: 1, ltps: 1 }, 'Face-up 5': { tmd: 3, mid: 1.5, ltps: 0.5 }, 'Post scorer': { tps: 3, pst: 2, str: 1 }, 'Rim runner': { trm: 2.5, vrt: 1.5, fin: 1, ltbd: 1.5 },
    'Playmaking hub': { tpa: 3, pas: 2.5, iq: 1 }, 'Rim protector': { blk: 3, pdf: 2, hgtB: 1 }, 'Mobile big': { spd: 1.5, agi: 1.5, pdf: 1, per: 1 }, 'Glass cleaner': { tcr: 2.5, orb: 1.5, drb: 1.5, ltbd: 1 } }
};
// v35: old type names (saves from before v35) -> new ones, so stored filters and notes still point somewhere
const ARCH_OLD = { 'Pass-first': 'Floor general', 'Scoring': 'Scoring guard', 'Shooting': '3pt sniper', 'Shooter': '3pt sniper', 'Movement shooter': '3pt sniper', 'Microwave scorer': 'Scoring guard', 'All-around': null,
  'Two-way wing': '3-and-D wing', 'Lockdown defender': 'Lockdown defender', 'Stretch four': 'Stretch 4', 'Stretch five': 'Stretch 5', 'Playmaking four': 'Point 4', 'Rebounder/defender': 'Glass cleaner', 'Rebounder': 'Glass cleaner' };
// Superstars (85+) also get one signature type of their own, on top of their position types
const SSTAR = 85;
const SARCH = {
  'Point god': { pos: [0, 1], w: { pas: 3, hnd: 2, iq: 2, tpa: 1 }, d: 'Runs the whole offense and makes everyone better' },
  'Heliocentric engine': { pos: [0, 1, 2], w: { tbd: 3, hnd: 2, pas: 1.5, drw: 1, mid: 1 }, d: 'The ball is in his hands on almost every play' },
  'Walking bucket': { pos: [0, 1, 2, 3], w: { mid: 2, tp: 1.5, fin: 1.5, drw: 1.5, tbd: 1 }, d: 'Scores from anywhere, against anyone' },
  'Gravity shooter': { pos: [0, 1, 2], w: { tp: 3, t3: 2.5, spd: 1, ft: 1 }, d: 'His range bends the whole defense' },
  'Two-way superstar': { pos: [1, 2, 3], w: { per: 2, pdf: 1.5, stl: 1, fin: 1, mid: 1, tp: 1 }, d: 'A star on both ends of the floor' },
  'Freight train': { pos: [2, 3, 4], w: { fin: 2.5, str: 2, vrt: 1.5, trm: 2, spd: 1 }, d: 'Unstoppable going downhill to the rim' },
  'Unicorn': { pos: [3, 4], w: { tp: 2, blk: 2, hgtB: 1.5, t3: 1, agi: 1 }, d: 'A shot-blocking big who also shoots threes' },
  'Point center': { pos: [3, 4], w: { pas: 3, iq: 2, tpa: 1.5, pst: 1 }, d: 'A big who runs the offense like a point guard' },
  'Dominant big': { pos: [3, 4], w: { pst: 2, fin: 1.5, blk: 1.5, drb: 1.5, str: 1 }, d: 'Owns the paint on both ends' }
};
const ARCH_OPP = { ltbd: 'tbd', lcs: 'tcs', ltps: 'tps', ltpa: 'tpa' };
const ARCH_SKILL = new Set(['fin', 'pst', 'mid', 'tp', 'ft', 'hnd', 'pas', 'orb', 'drw', 'per', 'pdf', 'stl', 'blk', 'drb', 'iq', 'spd', 'agi', 'vrt', 'str', 'hgtB', 'wingB']);
function archVal(p, w, skillOnly) {
  let s = 0, t = 0;
  for (const k in w) {
    if (skillOnly && !ARCH_SKILL.has(k)) continue;
    const o = ARCH_OPP[k], v = o ? 100 - (p[o] != null ? p[o] : 50) : sysVal(p, { [k]: 1 });
    s += (v != null && !isNaN(v) ? v : 50) * w[k]; t += w[k];
  }
  return t ? s / t : 50;
}
// Each type is judged by how far a player stands out on it compared with others at his position (calibrated from generated
// players, tools/arch-cal.js), so types built on naturally high ratings don't crowd out the rest.
const ARCH_CAL = {"PG":{"Floor general":[62.5,8.6,0.057],"Scoring guard":[56.3,6.9,0.069],"3pt sniper":[55.6,11.4,-0.16],"Slasher":[57,10.3,0.029],"Mid-range maestro":[49.1,9.8,-0.118],"Defensive pest":[51.2,8.4,0.009],"Jumbo playmaker":[58,6.3,0.074],"Rebounding guard":[28.6,9.9,0.07]},"SG":{"3pt sniper":[54.5,11.9,-0.033],"Shot creator":[51.9,9,0.105],"Slasher":[52.9,10.9,0.038],"Mid-range maestro":[49.6,10.1,-0.118],"3-and-D":[51.7,6.7,-0.015],"Lockdown defender":[51.1,7.8,0.127],"Combo guard":[51.6,11.5,-0.079],"Rebounding guard":[32,11,0.028]},"SF":{"Scoring wing":[46.7,8.8,0.102],"Slasher":[50.9,10.3,0.102],"Spot-up shooter":[51,8.7,-0.168],"3-and-D wing":[51.7,7.1,0.113],"Wing stopper":[50.1,7,0.05],"Point forward":[45.1,11.2,-0.054],"Athletic finisher":[53.2,7.1,-0.072],"Rebounding wing":[43.1,10,-0.009]},"PF":{"Stretch 4":[41.4,13.1,-0.126],"Face-up 4":[44.4,11.4,0.033],"Post scorer":[46.2,11.4,-0.106],"Rim runner":[55.5,7.4,-0.016],"Point 4":[39.6,11.6,-0.008],"Small-ball 4":[48.5,9,0.169],"Glass cleaner":[51.1,8.6,-0.019],"Rim protector":[51.6,9.5,0.135]},"C":{"Stretch 5":[27,11.8,-0.201],"Face-up 5":[37,11.6,-0.038],"Post scorer":[55.4,10.3,-0.011],"Rim runner":[58,7.4,-0.051],"Playmaking hub":[38.4,11.3,0.025],"Rim protector":[60.9,8.6,0.169],"Mobile big":[47.3,9.1,0.254],"Glass cleaner":[58.7,8.2,-0.028]}};   // [mean, spread, offset] per type
const ARCH_CAL_NBA = {"PG":{"Floor general":[59.9,8.6,0.346],"Scoring guard":[55.8,7.1,0.518],"3pt sniper":[58.6,13.1,-0.605],"Slasher":[56.9,8.9,0.311],"Mid-range maestro":[43,8.9,0.058],"Defensive pest":[48.9,6.6,-0.243],"Jumbo playmaker":[57.4,7.2,0.396],"Rebounding guard":[25.4,7.5,0.013]},"SG":{"3pt sniper":[61.5,13.4,-0.47],"Shot creator":[51.5,8.2,0.466],"Slasher":[55.7,7.3,-0.039],"Mid-range maestro":[40.2,8.8,0.129],"3-and-D":[54.9,6.5,-0.262],"Lockdown defender":[52,5.6,0.132],"Combo guard":[47.7,8.7,0.381],"Rebounding guard":[32.4,7.8,0.123]},"SF":{"Scoring wing":[50.5,10.2,0.484],"Slasher":[56.5,10.3,0.409],"Spot-up shooter":[59,11.3,-0.399],"3-and-D wing":[56.7,5.6,-0.241],"Wing stopper":[51.9,5.5,0.286],"Point forward":[45.2,8.8,0.613],"Athletic finisher":[54.2,4.7,-0.578],"Rebounding wing":[45.8,6.8,0.421]},"PF":{"Stretch 4":[57.1,15.2,-0.242],"Face-up 4":[40.1,10.5,0.638],"Post scorer":[49.6,9.1,0.519],"Rim runner":[59,4.9,0.053],"Point 4":[39,8.4,0.364],"Small-ball 4":[52.2,4.1,0.086],"Glass cleaner":[50,6,0.183],"Rim protector":[53,8,-0.203]},"C":{"Stretch 5":[37.2,19.5,-0.709],"Face-up 5":[36.7,6.7,0.396],"Post scorer":[54.3,6.8,0.414],"Rim runner":[63,6.4,-0.279],"Playmaking hub":[35.8,9.6,0.191],"Rim protector":[58.6,8.1,0.119],"Mobile big":[51.5,4.3,0.146],"Glass cleaner":[55.6,7.3,0.373]}}, PS_NORM = { pbl: {"PG":{"t3":[54.2,13.3],"tmd":[44.4,13.1],"trm":[53.3,16.2],"tps":[11.3,9.2],"tpa":[65.9,14.2],"tbd":[63.9,8.2],"tp":[55.7,10.5],"mid":[52.4,9.1],"fin":[56.1,10.7],"pst":[30.2,9.9],"pas":[65.4,10.3],"def":[36.5,8.6]},"SG":{"t3":[53.7,13.1],"tmd":[47.9,11.1],"trm":[49.3,13.7],"tps":[15.3,11.4],"tpa":[47,13.7],"tbd":[51.7,10.8],"tp":[53.5,9.7],"mid":[53,10.7],"fin":[52.3,10.4],"pst":[32.7,11.5],"pas":[50.4,11.5],"def":[40.4,8.7]},"SF":{"t3":[51,14],"tmd":[49.8,11.7],"trm":[52,13.3],"tps":[27,13.7],"tpa":[44.9,13.9],"tbd":[47.5,9.8],"tp":[52.2,10.4],"mid":[52.5,9.4],"fin":[55.9,11.9],"pst":[42.3,11.9],"pas":[47.4,9.4],"def":[46.5,8.9]},"PF":{"t3":[37.9,16.6],"tmd":[46.9,14.6],"trm":[49.7,14.7],"tps":[38.7,14.1],"tpa":[38.6,14.8],"tbd":[36.2,10.5],"tp":[42.7,12.5],"mid":[48.2,11.8],"fin":[56.8,11.4],"pst":[47.9,10.4],"pas":[45.5,14.8],"def":[48.4,9.8]},"C":{"t3":[23.1,16.2],"tmd":[37.5,13.8],"trm":[53.2,14.5],"tps":[53,16.5],"tpa":[34.4,13.4],"tbd":[28.4,10.9],"tp":[32.7,11.9],"mid":[41.9,10.8],"fin":[57.7,11],"pst":[54.3,10.2],"pas":[41.4,12.2],"def":[50.9,8.9]}}, nba: {"PG":{"t3":[63.4,18.8],"tmd":[35.4,9.3],"trm":[58.5,8.5],"tps":[8,0],"tpa":[66.3,8.1],"tbd":[64.3,6.9],"tp":[52.8,10.8],"mid":[51.1,14],"fin":[50,15.3],"pst":[24.9,8.6],"pas":[62.9,14.8],"def":[35.1,7.7]},"SG":{"t3":[67.2,19.3],"tmd":[32.8,9.7],"trm":[56.9,7.7],"tps":[8,0],"tpa":[41,5.4],"tbd":[53.4,6],"tp":[54.6,10.7],"mid":[52.7,12.1],"fin":[51.9,12.6],"pst":[32.5,8.1],"pas":[50.7,12.5],"def":[39.9,7.4]},"SF":{"t3":[64.5,19.6],"tmd":[34.5,10.6],"trm":[60.2,10.8],"tps":[16,0],"tpa":[39.9,4.8],"tbd":[49.9,5.9],"tp":[55.9,9.9],"mid":[55.4,15.2],"fin":[55.2,12.3],"pst":[45.2,9.1],"pas":[49.5,13.6],"def":[48.9,8.9]},"PF":{"t3":[61,22.6],"tmd":[35.5,11.7],"trm":[60.9,9.6],"tps":[45.9,9.6],"tpa":[35.4,4.9],"tbd":[43.6,6],"tp":[51.4,9.8],"mid":[48.1,13.5],"fin":[53.7,13.4],"pst":[49.9,13.6],"pas":[42.9,12.8],"def":[48.9,7.2]},"C":{"t3":[34.2,25.2],"tmd":[35.2,11.2],"trm":[69.3,11.5],"tps":[54.7,7.7],"tpa":[31.6,5.3],"tbd":[40.6,5.4],"tp":[38.1,17.5],"mid":[36.6,13.6],"fin":[50.1,14.6],"pst":[47.7,11.2],"pas":[35.8,14.6],"def":[46.3,7.6]}} };
const SARCH_CAL = {"Point god":[73.5,6.8],"Heliocentric engine":[72.6,6.3],"Walking bucket":[68.2,5.3],"Gravity shooter":[70.9,8.1],"Two-way superstar":[66.1,4.5],"Freight train":[70,5.7],"Unicorn":[58.5,5.7],"Point center":[59.1,9],"Dominant big":[72.4,4.6]};
function archetypes(p) {
  const c = [];
  for (const slot of [p.pos, p.pos2]) {
    if (slot == null) continue;
    const pos = POS[slot];
    for (const n in ARCH[pos]) { const raw = archVal(p, ARCH[pos][n]), cal = ((NBA_ON ? ARCH_CAL_NBA : ARCH_CAL)[pos] || {})[n] || [50, 9]; c.push({ p: pos, n, raw, sk: archVal(p, ARCH[pos][n], true), sc: (raw - cal[0]) / cal[1] + (cal[2] || 0) - (slot === p.pos ? 0 : 0.5) }); }
  }
  c.sort((a, b) => b.sc - a.sc);
  const out = [{ p: c[0].p, n: c[0].n, e: p.ovr >= 86 && c[0].sk >= 76 }];
  // stars are more multi-dimensional: a second type from 76, a third from 84 (never the same name twice)
  const more = c.filter(x => x.n !== c[0].n);
  if (p.ovr >= 76 && more[0] && more[0].sc >= c[0].sc - 0.6) out.push({ p: more[0].p, n: more[0].n, e: false });
  const m2 = more.filter(x => x.n !== more[0].n);
  if (out.length > 1 && p.ovr >= 84 && m2[0] && m2[0].sc >= c[0].sc - 0.75) out.push({ p: m2[0].p, n: m2[0].n, e: false });
  p.sarch = superArch(p);
  return out;
}
function superArch(p) {
  if (!(p.ovr >= SSTAR)) return undefined;
  let best = null;
  for (const n in SARCH) { const s = SARCH[n]; if (!s.pos.includes(p.pos) && !(p.pos2 != null && s.pos.includes(p.pos2))) continue;
    const cal = SARCH_CAL[n] || [65, 8], v = (archVal(p, s.w) - cal[0]) / cal[1]; if (!best || v > best.v) best = { n, v }; }
  return best ? best.n : undefined;
}
// v35: the label everywhere is "[★ superstar type · ] archetype(s) · playstyle" (e.g. "3pt sniper SG · Low-volume shooter"); types=true leaves the playstyle off
function archTypes(p) { return (p.arch || []).map(a => (a.e ? 'Elite ' : '') + a.n + ' ' + a.p).join(' + '); }
function archLabel(p, types) { const ps = types ? [] : playstyle(p); return (p.sarch ? '★ ' + p.sarch + ' · ' : '') + archTypes(p) + (ps.length ? ' · ' + ps.join(', ') : ''); }
// v35 playstyle: the habits and caveats next to the archetype ("3pt sniper · Low-volume shooter"). Up to 2, strongest first.
function playstyle(p) {
  if (!p || p.t3 == null) return [];
  const pos = POS[p.pos], N = (NBA_ON ? PS_NORM.nba : PS_NORM.pbl)[pos]; if (!N) return [];
  const z = k => { const n = N[k]; if (!n) return 0; const v = k === 'def' ? (p.per + p.pdf) / 2 : p[k]; return v == null ? 0 : (v - n[0]) / Math.max(1, n[1]); };
  const big = p.pos >= 3, out = [], add = (txt, m) => out.push({ txt, m });
  const a0 = p.arch && p.arch[0] ? p.arch[0].n : '', shootType = /sniper|Spot-up|Stretch|3-and-D/.test(a0);
  const zt3 = z('t3'), ztp = z('tp'), vol3 = zt3 + 0.5 * z('tbd');
  if (ztp >= 0.6 && p.tp >= 62 && vol3 - ztp <= -1.1) add('Low-volume shooter', 1 + (ztp - vol3) / 2 + (shootType ? 0.6 : 0));
  else if (ztp >= 0.2 && zt3 >= 1 && vol3 - ztp >= 1.1) add('High-volume shooter', 0.8 + (vol3 - ztp) / 2 + (shootType ? 0.3 : 0));
  if (ztp <= -0.5 && (zt3 >= 0.4 || shootType)) add('Below-average 3pt shooter', 1 + (zt3 - ztp) / 3 + (shootType ? 0.8 : 0));
  const zmd = z('tmd');
  if (/Stretch/.test(a0) && zmd >= 0.5 && zmd - zt3 >= 0.6) add('Low-volume 3, more mid-range', 1.4 + (zmd - zt3) / 2);
  else if (zmd >= 1 && zmd - z('mid') >= 0.9) add('Loves the mid-range', 0.9 + (zmd - z('mid')) / 2);
  const zrm = z('trm'), zfn = z('fin');
  if (zfn >= 0.4 && zrm - zfn <= -1.3) add(big ? 'Shies away from the rim' : 'Avoids contact', 0.9 + (zfn - zrm) / 2);
  else if (zrm >= 1.4 && zrm - zfn >= 1.1) add('Attacks the rim', 0.6 + (zrm - zfn) / 2);
  if (big && z('pst') >= 0.6 && z('tps') - z('pst') <= -1.4) add('Rarely posts up', 0.7 + (z('pst') - z('tps')) / 2);
  const zpa = z('tpa') - z('pas');
  if (z('tpa') >= 0.8 && zpa >= 1) add(big || p.pos === 2 ? 'Looks to pass first' : 'Pass-first', 0.8 + zpa / 2);
  else if (p.pos <= 1 && z('tpa') <= -1 && zpa <= -1.1) add('Shoot-first', 0.6 + -zpa / 2);
  const zbd = z('tbd');
  if (zbd >= 1.6) add('Ball-dominant', 0.5 + (zbd - 1.6));
  else if (zbd <= -1.4 && p.ovr >= 65) add('Low usage', 0.5 + (-1.4 - zbd));
  if (z('def') <= -1.4 && !/Defensive|Lockdown|stopper|3-and-D|Rim protector/.test(a0)) add('Defensive liability', 0.5 + (-1.4 - z('def')));
  if (p.ft < (big ? 45 : 56)) add('Poor free-throw shooter', 0.3 + ((big ? 45 : 56) - p.ft) / 15);
  return out.sort((a, b) => b.m - a.m).slice(0, 2).map(x => x.txt);
}
const SYS_WANTS = {
  pace: ['PG|3pt sniper', 'PG|Slasher', 'SG|3pt sniper', 'SG|3-and-D', 'SF|Spot-up shooter', 'SF|3-and-D wing', 'SF|Athletic finisher', 'PF|Stretch 4', 'PF|Small-ball 4', 'C|Stretch 5', 'C|Rim runner'],
  inside: ['SF|Rebounding wing', 'SF|Slasher', 'PF|Post scorer', 'PF|Rim runner', 'PF|Glass cleaner', 'C|Post scorer', 'C|Rim runner', 'C|Glass cleaner', 'PG|Floor general'],
  motion: ['PG|Floor general', 'PG|Jumbo playmaker', 'SG|Combo guard', 'SG|3pt sniper', 'SF|Point forward', 'PF|Point 4', 'PF|Face-up 4', 'C|Playmaking hub', 'C|Face-up 5'],
  iso: ['PG|Scoring guard', 'PG|Mid-range maestro', 'SG|Shot creator', 'SG|Mid-range maestro', 'SG|Slasher', 'SF|Scoring wing', 'SF|Slasher', 'PF|Face-up 4', 'C|Post scorer'],
  switch: ['SG|3-and-D', 'SG|Lockdown defender', 'SF|3-and-D wing', 'SF|Wing stopper', 'PF|Small-ball 4', 'C|Mobile big'],
  rim: ['PF|Rim protector', 'PF|Glass cleaner', 'C|Rim protector', 'C|Glass cleaner', 'C|Mobile big'],
  pressure: ['PG|Defensive pest', 'SG|Lockdown defender', 'SG|3-and-D', 'SF|Wing stopper', 'SF|3-and-D wing']
};
// v35: how well a playstyle suits the coach's offense (-1..1): pace wants volume shooters, inside wants players who go to the rim, ...
function styleFit(p, c) {
  const ps = playstyle(p); let v = 0;
  for (const s of ps) {
    if (c.off === 'pace') v += s === 'High-volume shooter' ? 0.5 : s === 'Low-volume shooter' || s === 'Loves the mid-range' ? -0.4 : s === 'Below-average 3pt shooter' ? -0.5 : 0;
    if (c.off === 'inside') v += s === 'Attacks the rim' ? 0.4 : s === 'Shies away from the rim' || s === 'Avoids contact' || s === 'Rarely posts up' ? -0.5 : 0;
    if (c.off === 'motion') v += s === 'Looks to pass first' || s === 'Pass-first' ? 0.5 : s === 'Ball-dominant' || s === 'Shoot-first' ? -0.4 : 0;
    if (c.off === 'iso') v += s === 'Ball-dominant' || s === 'Loves the mid-range' ? 0.4 : s === 'Low usage' ? -0.3 : 0;
    if (s === 'Defensive liability' && c.def !== 'rim') v -= 0.2;
  }
  return clamp(v, -1, 1);
}

// ---------- Helpers ----------
const active = L => Object.values(L.players).filter(p => !p.retired);
const rosterOf = (L, t) => t.roster.map(id => L.players[id]);
const totalDays = L => L.schedule.length;
// v24.6: the season now runs ~110 days instead of ~62. Per-day chances are scaled by dayK so a season has the same number of events,
// and 'weekly' league chores run every wkLen days (about every 3-4 games, as before).
const dayK = L => Math.min(1, 62 / Math.max(1, totalDays(L)));
const wkLen = L => Math.max(7, Math.round(7 / dayK(L)));
function seasonLabel(L) { return L.phase === 'regular' ? `Day ${L.day + 1}` : L.phase === 'playoffs' ? 'Playoffs' : 'Offseason'; }
function flL(L, key, vars, seed) { return fl(key, vars, seed != null ? seed : (L.logN || 0) + 1); }   // v25.6: news variant from the next news number (stable, no R())
function logNews(L, text, tid, cat, kind) { L.logN = (L.logN || 0) + 1; L.log.unshift({ n: L.logN, season: L.season, day: L.day, phase: L.phase, text, tid, cat: cat || 'league', k: kind || undefined }); if (L.log.length > 600) L.log.length = 600; }
function usedNames(L) { if (!(L._used instanceof Set)) L._used = new Set(L.usedNames || []); return L._used; }
function newPlayer(L, pos, talent, age) { const p = genPlayer(pos, talent, age, usedNames(L)); L.players[p.id] = p; L.usedNames = [...usedNames(L)]; giveAgent(L, p); return p; }
// League talent level (average of each team's top 8); used to keep shooting steady as ratings drift
function setLgOvr(L) { const v = L.teams.map(t => { const r = rosterOf(L, t).sort((a, b) => b.ovr - a.ovr).slice(0, 8); return r.reduce((a, p) => a + p.ovr, 0) / Math.max(1, r.length); }); L.lgOvr = Math.round(v.reduce((a, b) => a + b, 0) / v.length * 10) / 10; if (L.lgOvr0 == null) L.lgOvr0 = L.lgOvr; }
// ---------- Contracts 2.0: agents, incentives, no-trade clauses, holdouts, rookie extensions ----------
const AGENT_STYLE = { tough: { ask: 1.07, need: 1.03, txt: 'Tough: asks about 7% more and may hold out' }, fair: { ask: 1, need: 1, txt: 'Fair: close to market value' }, loyal: { ask: 0.98, need: 1, own: 0.94, txt: 'Loyal: gives his current team a discount (about 6%)' } };
// v25.1: agent types. Style (tough / fair / loyal) is how he negotiates; kind is the size of his book and what he pushes for.
// power broker 40-60 clients and most of the stars: leverage (steers clients toward his favorite teams and away from feuds), asks a bit high, stars may hold out.
// mid-size 15-35. boutique 5-15: close attention, fewer holdouts, cares more about role and fit than the last dollar.
// youth specialist 10-25: signs most top prospects, pushes for early rookie extensions and gives a small discount on the first one.
const AGENT_KIND = {
  power: { lo: 40, hi: 60, ask: 1.04, hold: 1.6, label: 'Power broker', txt: 'Power broker: 40-60 clients and many of the stars. Asks run a bit high, stars may hold out, and he steers clients toward the teams he likes and away from teams he is feuding with' },
  mid: { lo: 15, hi: 35, ask: 1, hold: 1, label: 'Mid-size agency', txt: 'Mid-size agency: 15-35 clients' },
  boutique: { lo: 5, hi: 15, ask: 0.99, hold: 0.35, label: 'Boutique', txt: 'Boutique: 5-15 clients and close attention. Fewer holdouts; cares more about role and fit than the last dollar' },
  youth: { lo: 10, hi: 25, ask: 1, hold: 0.8, ext: 0.95, label: 'Rookie/youth specialist', txt: 'Rookie/youth specialist: 10-25 clients, signs most top prospects, pushes for early rookie extensions and gives about 5% off the first extension' } };
const agKind = a => (a && AGENT_KIND[a.kind]) || AGENT_KIND.mid;
function newAgent(L, kind) {
  const id = (L.agents || []).reduce((m, a) => Math.max(m, a.id), 0) + 1;
  const style = kind === 'power' ? wpick(['tough', 'fair'], [65, 35]) : kind === 'boutique' ? wpick(['tough', 'fair', 'loyal'], [15, 50, 35]) : wpick(['tough', 'fair', 'loyal'], [30, 45, 25]);
  const a = { id, name: genName(usedNames(L)), style, kind };
  if (kind === 'power' && L.teams && L.teams.length) { const ids = L.teams.map(t => t.id).sort(() => R() - 0.5); a.fav = ids.slice(0, 2); a.feud = ids.slice(2, 2 + rint(1, 2)); }
  L.agents.push(a); return a;
}
// clients counted for an agent's range: active, non-prospect players
function agentCounts(L) { const n = {}; for (const p of Object.values(L.players)) if (!p.retired && !p.prospect && p.agent != null) n[p.agent] = (n[p.agent] || 0) + 1; return n; }
function ensureAgents(L) {
  if (L.agents && L.agents.length) return;
  L.agents = [];
  const N = Math.max(200, Object.values(L.players).filter(p => !p.retired && !p.prospect).length || (L.teams && L.teams.length > 16 ? 520 : 280));
  const big = N >= 400, nP = big ? 3 : 2, nM = big ? 6 : 4;
  for (let i = 0; i < nP; i++) newAgent(L, 'power');
  for (let i = 0; i < nM; i++) newAgent(L, 'mid');
  const rest = Math.max(0, N - nP * 50 - nM * 25), nY = Math.max(3, Math.round(rest * 0.4 / 17)), nB = Math.max(4, Math.round(rest * 0.6 / 10));
  for (let i = 0; i < nY; i++) newAgent(L, 'youth');
  for (let i = 0; i < nB; i++) newAgent(L, 'boutique');
}
// pick an agent for a new client: stars lean to power brokers, top prospects and young players to youth specialists; agents under their range first
function chooseAgent(L, p, cnt, avoid) {
  const n = cnt || agentCounts(L);
  const star = !p.prospect && p.ovr >= 78, topPro = p.prospect && (p.tier === 'gen' || p.tier === 'top'), young = p.prospect || p.age <= 22;
  const kw = star ? { power: 6, mid: 1.2, boutique: 0.5, youth: young ? 1.5 : 0.3 } : topPro ? { power: 1.2, mid: 0.4, boutique: 0.2, youth: 6 } : young ? { power: 0.25, mid: 1, boutique: 1, youth: 2.2 } : { power: 0.2, mid: 1.3, boutique: 1.2, youth: 0.4 };
  const as = L.agents.filter(a => a.id !== avoid), w = as.map(a => { const K = agKind(a), c = n[a.id] || 0; const room = c < K.lo ? 3 + (K.lo - c) * 0.3 : c < K.hi ? (K.hi - c) / (K.hi - K.lo) + 0.15 : 0.01; return (kw[a.kind] || 1) * room; });
  return wpick(as, w);
}
function giveAgent(L, p) { ensureAgents(L); if (p.agent == null) p.agent = chooseAgent(L, p, L._agCnt).id; if (L._agCnt && !p.prospect) L._agCnt[p.agent] = (L._agCnt[p.agent] || 0) + 1; }
// after the draft: top-10 picks sign with youth specialists (or a power broker), stars drift to power brokers, overloaded agents shed clients
// to agents with room (draftees first), and a new boutique agency opens when the league outgrows the agents it has
function agentOffseason(L) {
  ensureAgents(L);
  const n = agentCounts(L), move = (p, a) => { if (!a || a.id === p.agent) return; n[p.agent] = (n[p.agent] || 1) - 1; p.agent = a.id; n[a.id] = (n[a.id] || 0) + 1; };
  const byKind = k => L.agents.filter(a => a.kind === k && (n[a.id] || 0) < agKind(a).hi);
  const roomy = (k, x) => { const as = byKind(k); return as.length ? as.sort((a, b) => (n[a.id] || 0) - (n[b.id] || 0))[0] : x; };
  const act = Object.values(L.players).filter(p => !p.retired && !p.prospect);
  for (const p of act) if (p.draft && p.draft.s === L.season && p.draft.rd === 1 && p.draft.no <= 10) { const a = agentOf(L, p); if (!a || (a.kind !== 'youth' && a.kind !== 'power')) { if (R() < 0.8) move(p, roomy('youth') || roomy('power')); } }
  for (const p of act) if (p.ovr >= 80) { const a = agentOf(L, p); if (a && a.kind !== 'power' && R() < 0.12) move(p, roomy('power')); }
  // power brokers below their range sign good players away from the mid-size agencies
  for (const a of L.agents.filter(x => x.kind === 'power')) { const need = agKind(a).lo + 4 - (n[a.id] || 0); if (need <= 0) continue;
    const cand = act.filter(p => p.ovr >= 70 && (agentOf(L, p) || {}).kind === 'mid').sort((x, y) => y.ovr - x.ovr).slice(0, need + rint(0, 4));
    for (const p of cand) move(p, a); }
  // too many clients: shed draftees and the lowest-rated clients first
  for (const a of L.agents) { const hi = agKind(a).hi; if ((n[a.id] || 0) <= hi) continue;
    const cl = act.filter(p => p.agent === a.id).sort((x, y) => ((y.draft && y.draft.s === L.season) ? 1 : 0) - ((x.draft && x.draft.s === L.season) ? 1 : 0) || x.ovr - y.ovr);
    for (const p of cl) { if ((n[a.id] || 0) <= hi) break; move(p, chooseAgent(L, p, n, a.id)); } }
  // agents below their range pick up this year's draftees and unsigned players
  const under = L.agents.filter(a => (n[a.id] || 0) < agKind(a).lo);
  if (under.length) { const pool = act.filter(p => (p.draft && p.draft.s === L.season) || p.team == null).filter(p => { const a = agentOf(L, p); return !a || (n[a.id] || 0) > agKind(a).lo + 3; });
    for (const p of pool) { const u = under.filter(a => (n[a.id] || 0) < agKind(a).lo); if (!u.length) break; move(p, pick(u)); } }
  const cap = L.agents.reduce((s, a) => s + agKind(a).hi, 0);
  if (act.length > cap * 0.85) newAgent(L, R() < 0.6 ? 'boutique' : 'youth');
}
// v25.1: what his agent's type does to his ask and appeal (power-broker steering, boutique role and fit)
function agentAppeal(L, p, t) {
  const a = agentOf(L, p); if (!a || !t) return 1;
  if (a.kind === 'power') return (a.fav || []).includes(t.id) ? 1.06 : (a.feud || []).includes(t.id) ? 0.9 : 1;
  if (a.kind === 'boutique' && L) { const better = rosterOf(L, t).filter(x => x.id !== p.id && x.pos === p.pos && x.ovr > p.ovr).length; return better === 0 ? 1.04 : better >= 2 ? 0.96 : 1; }
  return 1;
}
function agentOf(L, p) { return (L.agents || []).find(a => a.id === p.agent) || null; }
const NTC_ELIGIBLE = p => ((p.svc || 0) >= 7 || p.age >= 29) && p.ovr >= 75;
// how likely an incentive is to be earned (the player weighs it by this)
function incLikely(L, p, t, k) {
  if (k === 'gp') return clamp(0.45 + (p.dur || 60) / 200 - (p.prone != null && p.prone >= L.season - 1 ? 0.2 : 0) - (p.age >= 33 ? 0.1 : 0), 0.2, 0.9);
  if (k === 'allstar') return p.ovr >= 82 ? 0.85 : p.ovr >= 77 ? 0.5 : p.ovr >= 72 ? 0.18 : 0.04;
  if (k === 'playoffs') return { contend: 0.85, hopeful: 0.55, rebuild: 0.2, tank: 0.05 }[t.mode] || 0.4;
  return 0;
}
const INC_LABEL = { gp: 'plays 45+ games', allstar: 'makes the All-Star team', playoffs: 'team makes the playoffs' };
// paid at the end of the regular season, in cash (not on the cap)
function payIncentives(L) { payIncs(L, INC_KINDS.filter(k => !INC_PO.includes(k))); }   // v26.1: several incentives per contract
function payIncentivesOld(L) {
  for (const t of L.teams) for (const p of rosterOf(L, t)) {
    const c = p.contract; if (!c || !c.inc || c.incPaid === L.season) continue;
    const s = p.stats.rs || {}, seed = seedOrder(L, t.conf).indexOf(t.id) + 1;
    const ok = c.incK === 'gp' ? (s.gp || 0) >= gpq(45) : c.incK === 'allstar' ? p.awards.some(a => a.a === 'All-Star' && a.s === L.season) : seed > 0 && seed <= poPlayinTo(L);
    if (!ok) continue;
    c.incPaid = L.season;
    if (t.fin) t.fin.paySum += c.inc * Math.max(1, t.fin.payDays);
    if (t.id === L.user || c.inc >= 3) logNews(L, `${p.name} earned his ${money(c.inc)} incentive (${INC_LABEL[c.incK]})`, t.id, 'tx');
  }
}
// v33d: a new deal that replaces his current one (holdout raise) fits under the hard cap this cap year and the next two:
// the scheduled amount of the old deal comes off, the new amount goes on (the old check used the base amount and this year only)
function swapFits(L, t, p, amt, yrs) { const cs = capSeason(L), h = contractHit(amt, false); for (let i = 0; i < Math.min(3, yrs); i++) { const y = cs + i, old = capHit(L, p, y); if (h > old && payNoFloor(L, t, y) - old + h > APRON + 1e-6) return false; } return true; }
// v33d: what a traded player's salary will count for the team getting him: the scheduled amount (real deals), a pending extension,
// the 90% hometown hit only for his drafting team, and a trade kicker (applied when he is traded). The old check used the base amount.
function inHit(L, p, tid, y) {
  const c = p.contract; let h = capHit(L, p, y); if (!h || !c) return h;
  if (c.exp >= y && c.hg) h = h / (p.team === p.draftTid ? 0.9 : 1) * (tid === p.draftTid ? 0.9 : 1);
  if (c.exp >= y && c.kick > 0 && !c.kicked) h += Math.max(0, Math.min(Math.max(c.amt, maxFor(p)), c.amt * (1 + c.kick)) - c.amt);
  return h;
}
// Holdouts: a player with a tough agent who badly outplays his deal may sit out the start of the season
function holdoutTerms(L, p) { const left = p.contract.exp - L.season + 1; return { amt: Math.min(maxFor(p), r1(p.mval * 0.95)), yrs: Math.min(5, left + 1) }; }
function holdoutCheck(L) {
  L.holdouts = [];
  for (const t of L.teams) for (const p of rosterOf(L, t)) {
    const ag = agentOf(L, p), c = p.contract;
    const pw = ag && ag.kind === 'power' && p.ovr >= 78;   // v25.1: a power broker's stars may hold out too; boutique agents rarely push it
    if (!ag || !(ag.style === 'tough' || pw) || !c || c.exp <= L.season || c.type === 'rookie' || p.ovr < 72 || !p.mval || p.mval < c.amt * (pw && ag.style !== 'tough' ? 1.4 : 1.3) || R() > 0.5 * agKind(ag).hold) continue;
    if (t.id === L.user) { p.holdout = { s: L.season, left: 15 }; L.holdouts.push(p.id); p.morale = Math.max(0, (p.morale || 60) - 12); logNews(L, `${p.name} is holding out for a new deal`, t.id, 'tx'); try { feedHoldout(L, p, t); } catch (e) { } continue; }
    const terms = holdoutTerms(L, p);
    if (R() < 0.5 && swapFits(L, t, p, terms.amt, terms.yrs)) { signContract(L, p, t.id, terms.amt, terms.yrs, 're-sign'); logNews(L, `${t.abbr} gave ${p.name} a new deal to end his holdout: ${terms.yrs} yr, ${money(terms.amt)}/yr`, t.id, 'tx'); }
    else { p.holdout = { s: L.season, left: rint(4, 12) }; p.morale = Math.max(0, (p.morale || 60) - 12); logNews(L, `${p.name} (${t.abbr}) is holding out for a new deal`, t.id, 'tx'); try { feedHoldout(L, p, t); } catch (e) { } }
  }
}
function resolveHoldout(L, pid, pay) {
  const p = L.players[pid]; if (!p || !p.holdout) return;
  const t = L.teams[p.team];
  if (pay) { const terms = holdoutTerms(L, p); if (!swapFits(L, t, p, terms.amt, terms.yrs)) return `That raise would put you over the ${money(APRON)} hard cap.`; signContract(L, p, t.id, terms.amt, terms.yrs, 're-sign'); p.holdout = null; p.morale = Math.min(100, (p.morale || 50) + 10); logNews(L, `${t.abbr} gave ${p.name} a new deal to end his holdout: ${terms.yrs} yr, ${money(terms.amt)}/yr`, t.id, 'tx'); }
  else p.holdout.firm = true;
  L.holdouts = (L.holdouts || []).filter(id => id !== pid);
  return null;
}
// no-trade clause: he decides on each destination (a contender is an easier yes)
function ntcConsent(L, p, dest) {
  const t = L.teams[dest]; const base = t.mode === 'contend' ? 0.65 : t.mode === 'hopeful' ? 0.35 : 0.1;
  return hrand(p.id, dest * 31 + L.season, 7) < base + (t.mode === 'contend' ? 0.2 * Math.min(1, twp(p, 'win')) : 0);   // v25.9: the more he wants to win
}
function addToTeam(L, p, tid) {
  if (p.team != null) removeFromTeam(L, p);
  L.fa = L.fa.filter(id => id !== p.id);
  p.team = tid; L.teams[tid].roster.push(p.id);
  assignNumber(L, p, L.teams[tid]);   // v30 review: trades and every other move keep numbers unique on a team (he keeps his if it is free)
  famNews(L, p, tid);
}
function famNews(L, p, tid) {
  if (p.rel && p.rel.length) { const t = L.teams[tid]; for (const r of p.rel) { const w = r.c ? (t.coach && t.coach.id === r.id ? t.coach : null) : (L.players[r.id] && L.players[r.id].team === tid && !L.players[r.id].retired ? L.players[r.id] : null); const key = tid + ':' + r.id; if (w && !(p.famNews || []).includes(key)) { p.famNews = (p.famNews || []).concat(key); logNews(L, r.k === 'brother' ? `Brothers together: ${p.name} joins ${w.name} on the ${t.name}` : r.k === 'son' ? `${p.name} joins the ${t.name}, coached by his father ${w.name}` : `${p.name} joins his son ${w.name} on the ${t.name}`, tid, 'tx'); } } }
}
function removeFromTeam(L, p) {
  if (p.team == null) return;
  p.block = false; p.protect = false; p.core = false;   // v25.7: core marks belong to your team only
  const t = L.teams[p.team];
  t.roster = t.roster.filter(id => id !== p.id);
  if (t.manual) { t.manual.starters = t.manual.starters.map(id => id === p.id ? null : id); t.manual.order = (t.manual.order || []).filter(id => id !== p.id); }
  p.team = null;
}
function toFA(L, p) { if (p.team != null) p.lastTeam = p.team; removeFromTeam(L, p); p.contract = null; p.ext = null; if (!L.fa.includes(p.id)) L.fa.push(p.id); setAsk(L, p); }

// ---------- Cap ----------
// v27: NBA mode shows the conferences as East / West (internal keys stay North / South)
function confName(c, LL) { const X = LL || (typeof L !== 'undefined' ? L : null); return X && X.nba ? (c === 'North' ? 'East' : c === 'South' ? 'West' : c) : c; }
function capSeason(L) { return ['regular', 'regular-done', 'playoffs'].includes(L.phase) ? L.season : L.season + 1; }
function maxFor(p) { const honors = (p.awards || []).some(a => a.a === 'All-Star' || a.a === 'All-League 1st Team' || a.a === 'All-League 2nd Team' || a.a === 'MVP'); return CAP * (p.svc >= 10 ? 0.35 : p.svc >= 7 || honors ? 0.30 : 0.25); }   // v18: young stars with honors reach the 30% tier early
function capHit(L, p, cs) {
  cs = cs == null ? capSeason(L) : cs;
  const c = p.contract; if (!c) return 0;
  if (c.exp < cs) { const x = p.ext; if (!x || x.amt <= MINSAL + 1e-9 || cs > c.exp + x.yrs) return 0; return x.amt * (x.hg ? 0.9 : 1); }
  if (c.amt <= MINSAL + 1e-9) return 0;
  const sa = c.sched && c.s0 != null ? c.sched[cs - c.s0] : null;   // v27: real deals with yearly amounts
  let a = (sa != null ? sa : c.amt) * (c.hg && p.team === p.draftTid ? 0.9 : 1);
  if (p.capRelief === cs) a *= 0.5;
  a += incCap(c);   // v26.1: likely incentives count on the cap
  return a;
}
function payroll(L, t, cs) {
  cs = cs == null ? capSeason(L) : cs;
  let s = 0; for (const id of t.roster) s += capHit(L, L.players[id], cs);
  for (const d of t.dead || []) if (d.exp >= cs && (d.from == null || d.from <= cs)) s += d.amt;
  for (const fp of t.floorPaid || []) if (fp.s === cs) s += Math.min(fp.amt, Math.max(0, MINPAY - s));      // a payroll-floor charge counts as payroll that season; v32g: only the part still under the floor (salary added later in the season uses it up, as the NBA settles the shortfall at season end)
  return s;
}
function payNoFloor(L, t, cs) { cs = cs == null ? capSeason(L) : cs; let s = 0; for (const id of t.roster) s += capHit(L, L.players[id], cs); for (const d of t.dead || []) if (d.exp >= cs && (d.from == null || d.from <= cs)) s += d.amt; return s; }   // v32g: salary without the floor charge
// Cap commitments for the next five seasons: each player's salary per season, plus dead money and floor charges
function capProjection(L, t) {
  const cs = capSeason(L), years = [0, 1, 2, 3, 4].map(i => cs + i);
  const players = rosterOf(L, t).filter(p => p.contract).map(p => {
    const c = p.contract;
    const cells = years.map(y => {
      if (c.exp >= y) return { amt: c.sched && c.s0 != null && c.sched[y - c.s0] != null ? c.sched[y - c.s0] : c.amt, hit: capHit(L, p, y), opt: y === c.exp ? c.opt : null };   // v27: real yearly amounts
      if (p.ext && y <= c.exp + p.ext.yrs) return { amt: p.ext.amt, hit: capHit(L, p, y), ext: true, opt: y === c.exp + p.ext.yrs ? p.ext.opt : null };
      return null;
    });
    return { p, cells };
  }).sort((a, b) => (b.cells[0] ? b.cells[0].amt : 0) - (a.cells[0] ? a.cells[0].amt : 0));
  const totals = years.map((y, i) => {
    const sal = players.reduce((a, r) => a + (r.cells[i] ? r.cells[i].hit : 0), 0);
    const dead = (t.dead || []).filter(d => d.exp >= y && (d.from == null || d.from <= y)).reduce((a, d) => a + d.amt, 0);
    const floor = (t.floorPaid || []).filter(x => x.s === y).reduce((a, x) => a + x.amt, 0);
    const n = players.filter(r => r.cells[i]).length;
    return { y, sal, dead, floor, total: sal + dead + floor, room: CAP - (sal + dead + floor), n };
  });
  return { years, players, totals };
}
function contractHit(amt, hg) { return amt <= MINSAL + 1e-9 ? 0 : amt * (hg ? 0.9 : 1); }
// Soft cap: free agents fit under the $150M cap, or once a season through the mid-level exception (up to $8M for a team
// under the tax line; the signing itself may cross the line but never the hard cap). Your own players can be re-signed or extended up to the $170M hard cap. Minimum deals always fit.
function mleOpen(L, t) { return t.mleUsed !== capSeason(L); }
// v32d: mid-level status for the UI. pay = payroll now, hit = cap hit of the offer. eligible = the offer can use it (not used yet, up to MLE, payroll under the tax line before it, and the deal goes over the cap)
function mleStatus(L, t, pay, hit) {
  const open = mleOpen(L, t), crosses = hit > 0 && pay + hit > CAP + 1e-6;
  let why = '';
  if (!open) why = 'already used this season'; else if (hit <= 0) why = 'minimum deals do not need it'; else if (!crosses) why = 'the deal fits under the cap'; else if (hit > MLE + 1e-6) why = `the offer is over ${money(MLE)}`; else if (pay >= TAXLINE) why = 'payroll is already over the tax line';
  return { open, left: open ? MLE : 0, eligible: !why, why };
}
// v32g: the mid-level is a real cap exception again (MLE_REAL). A free agent above the minimum must fit under the cap, or use the
// once-a-season mid-level (up to MLE, payroll under the tax line before the deal, never past the hard cap). Re-signing your own
// players (Bird rights), extensions and rookie deals still go up to the hard cap. Off = the v24.4 B2 rule (any signing up to the hard cap).
const MLE_REAL = true;
function mleFits(L, t, pay, hit) { return mleOpen(L, t) && hit <= MLE + 1e-6 && pay < TAXLINE && pay + hit <= APRON + 1e-6; }
// v33b: the hard cap holds for the next seasons too. A deal that fits this cap year but would leave a later year over the hard cap
// (rookie deals and multi-year signings on top of what is already committed) is refused; the AI can't fix a later year in time
// (S16 NYK $228.8M next season in the v33b run). Checks the two cap years after this one.
function futFits(L, t, hit, n) { const cs = capSeason(L); for (let i = 1; i <= (n == null ? 2 : n); i++) if (payNoFloor(L, t, cs + i) + hit > APRON + 1e-6) return false; return true; }
function futRoom(L, t) { const cs = capSeason(L); return APRON - Math.max(payNoFloor(L, t, cs + 1), payNoFloor(L, t, cs + 2)); }
function canFit(L, t, amt, hg, type) {
  const hit = contractHit(amt, hg); if (hit === 0) return true;
  if (!futFits(L, t, hit)) return false;
  const pay = payroll(L, t);
  if (type === 're-sign' || type === 'extension' || type === 'rookie') return pay + hit <= APRON + 1e-6;
  if (pay + hit <= CAP + 1e-6) return true;
  if (V244.b2 && !MLE_REAL) return pay + hit <= APRON + 1e-6;   // v24.4 B2: no cap-room or mid-level test, only the hard cap
  return mleFits(L, t, pay, hit);
}
// Most a team can offer a free agent right now (0 = minimum deals only): cap room, or the mid-level if that is more
function faRoom(L, t, pay) {
  if (pay == null) pay = payroll(L, t);
  const room = Math.max(0, CAP - pay), mle = mleOpen(L, t) && pay < TAXLINE ? Math.max(0, Math.min(MLE, APRON - pay)) : 0;
  return Math.max(room, mle);
}

// ---------- v24.4 B2: every team may bid up to the $170M hard cap, but past the soft cap and the tax line it costs something ----------
// One bid formula: ceiling = min(status ceiling, owner limit); bid = what he's worth to them, cut to the room under the ceiling and,
// past the tax line, by the tax it would cost (All-in teams and rich or big-market contenders bid through it).
// Over the soft cap a team only bids on a player who fills a need or would start.
function taxCostOf(L, t, pay, amt) { const s = capSeason(L); return Math.max(0, taxFor(L, t, pay + amt, s) - taxFor(L, t, pay, s)); }
function bidsThroughTax(L, t) { return t.status === 'allin' || (t.status === 'contend' && (t.market === 3 || (t.cash || 0) > 40)); }
function b2Fit(L, t, p, needs) {
  const rot = rotationOf(L, t), pov = hiddenFor(L, p) ? ovrRead(L, t.id, p) : p.ovr;
  return { starter: pov >= (rot[4] ? rot[4].ovr : 0), need: needMult(L, t, p, needs) >= 1.25 };
}
const B2_MLE_OK = ['hopeful', 'rising', 'retool'];
function b2Ceiling(L, t, p, needs) {
  if (t.id === L.user) return APRON;
  const st = t.status;
  let c = st === 'allin' ? APRON : st === 'contend' ? TAXLINE + taxTolerance(L, t) : st === 'push' ? TAXLINE : B2_MLE_OK.includes(st) ? Math.min(TAXLINE, CAP + MLE) : CAP;   // v33d: middle teams may use the mid-level (real teams do); rebuild / tank stay at the cap
  if (p) { const f = b2Fit(L, t, p, needs); if (c <= CAP && f.starter && f.need) c = TAXLINE; else if (c > CAP && !f.starter && !f.need) c = CAP; }
  if (t.owner) { if (t.owner.tight || (t.cash || 0) < 0) c = Math.min(c, CAP); c = Math.min(c, t.owner.limit); }
  return Math.min(APRON, c);
}
function b2Room(L, t, p, needs) { const pay = payroll(L, t), r = Math.max(0, b2Ceiling(L, t, p, needs) - pay); return MLE_REAL ? Math.min(r, faRoom(L, t, pay)) : r; }   // v32g: also limited by cap room / the mid-level
// most he can bid so that salary plus the tax it adds stays within what the player is worth to the team
function b2Bid(L, t, W, pay) {
  if (bidsThroughTax(L, t) || pay + W <= TAXLINE + 1e-6) return W;
  let lo = 0, hi = W; for (let i = 0; i < 18; i++) { const m = (lo + hi) / 2; if (m + taxCostOf(L, t, pay, m) <= W) lo = m; else hi = m; }
  return Math.max(Math.min(W, Math.max(0, TAXLINE - pay)), lo);
}
// suitor premium: stars ask more when several teams would really bid (pass the bid formula), up to 1.5x in free agency, 1.3x when re-signing
function realSuitors(L, p) {
  let n = 0; const own = ownTeamOf(p);
  for (const t of L.teams) {
    if (t.id === own || t.id === L.user || t.roster.length >= 15) continue;
    if (trv(p, 'win') >= 72 && t.mode === 'tank') continue;   // v25.9
    const rot = rotationOf(L, t), f = b2Fit(L, t, p);
    if (!(f.need || p.ovr >= (rot[2] ? rot[2].ovr : 0))) continue;   // he'd fill a need or be one of their top 3
    if (b2Room(L, t, p) >= (p.mval || 0)) n++;
  }
  return n;
}
function suitorPrem(L, p, proj) {
  p.suitors = null;
  if (!V244.b2 || (p.mval || 0) < 12 || !(p.ovr >= 74 || (p.fame || 0) >= 50)) return 1;
  const n = realSuitors(L, p); p.suitors = n;
  return Math.min(proj ? 1.3 : 1.5, 1 + 0.05 * Math.max(0, n - 2));
}

// Market value: what the league can afford, spread by talent (market-based curve)
function worth(p) {
  const sp = p.scout != null ? p.scout : p.pot;
  let e = p.ovr + (p.age < 25 ? (sp - p.ovr) * 0.4 : p.age <= 27 ? (sp - p.ovr) * 0.2 : 0) - (p.age > 30 ? (p.age - 30) * 1.2 : 0);
  return Math.exp((e - 75) / 9.5);
}
// Accolade premium: past honors add value on top of ratings. Recent honors count most; old ones fade but never fully vanish,
// so a 32-year-old former MVP still earns a bit more than a role player with the same rating.
const ACC_W = { 'All-Star': 0.01, 'MVP': 0.12, 'Finals MVP': 0.05, 'Defensive Player of the Year': 0.06, 'All-League 1st Team': 0.05, 'All-League 2nd Team': 0.03, 'All-League 3rd Team': 0.015, 'Clutch Player of the Year': 0.015, 'Conference Finals MVP': 0.01, 'All-Defense 1st Team': 0.025, 'All-Defense 2nd Team': 0.015, 'Sixth Man of the Year': 0.02, 'Rookie of the Year': 0.01, 'Most Improved Player': 0.01, 'Scoring title': 0.02, 'Champion': 0.01 };
function accBoost(p, now) {
  let b = 0;
  for (const a of p.awards || []) { const w = ACC_W[a.a]; if (w) b += w * Math.max(0.35, 1 - 0.1 * Math.max(0, now - a.s)); }
  return Math.min(0.35, b);
}
// ---------- Fame: built mostly from accolades (fading with time), a little from scoring, plus an established star's name at league start ----------
const FAME_W = { 'MVP': 32, 'Finals MVP': 20, 'Defensive Player of the Year': 14, 'All-League 1st Team': 16, 'All-League 2nd Team': 9, 'All-League 3rd Team': 4, 'Clutch Player of the Year': 6, 'Conference Finals MVP': 5, 'All-Defense 1st Team': 6, 'All-Defense 2nd Team': 3, 'All-Star': 7, 'All-Star MVP': 4, 'Three-Point Contest champion': 3, 'Slam Dunk Contest champion': 4, 'Skills Challenge champion': 2, 'Rookie of the Year': 6, 'Sixth Man of the Year': 5, 'Most Improved Player': 3, 'Scoring title': 6, 'Rebounding title': 2, 'Assists title': 2, 'Steals title': 1, 'Blocks title': 1, 'Champion': 5 };
function fameOf(L, p) {
  let a = 0; for (const x of p.awards || []) { const w = FAME_W[x.a]; if (w) a += w * Math.max(0.3, 1 - 0.12 * Math.max(0, L.season - x.s)); }
  const s = p.stats && p.stats.rs && p.stats.rs.gp >= 10 ? p.stats.rs : (p.hist.length ? p.hist[p.hist.length - 1].rs : null);
  const ppg = s && s.gp ? s.pts / s.gp : 0;
  return Math.round(clamp(a + Math.min(10, Math.max(0, ppg - 14) * 0.8) + (p.fameBase || 0), 0, 100));
}
function updateFame(L) { for (const p of active(L)) if (!p.prospect) p.fame = fameOf(L, p); }
const fameLabel = f => f >= 80 ? 'Superstar' : f >= 60 ? 'Star' : f >= 35 ? 'Known' : f >= 15 ? 'Rising' : 'Unknown';
// v32e: low-rated players ask little, with a smooth ramp up to the open market (no cliff at 60).
// OVR 55 and under = the minimum. 56-64: a ceiling that grows ~38% a point (56 ~1.25x min, 59 ~2x, 62 ~5x, 64 ~10x),
// times a per-player factor (0.88-1.12: agent, reputation, timing). Up to 59 the ceiling is hard; from 60 it is soft
// (the part above it is kept at 15% at 60, 25% at 61 ... 55% at 64), so better young players still get more, just not a jump. 65+: open market.
// Hidden rookies: the lower of the media read and the real rating.
const ASK_RAMP = { min: 55, hard: 59, open: 65, base: 2, g: 1.38 };
// v33b: the bands follow the league. L.askRef (set on the first market of a league) stores where OVR 55 / 59 / 65 sat in the
// market pool (top 13 per team by OVR) as fractions; each market finds the OVRs at those fractions now, and the average move is
// L.askShift (0 at the start league, so Kenneth's young-player rule holds there; 0.25 steps, -4..+6). A player's ramp uses OVR - shift.
// Under 60 nobody asks $10M+ (absolute, whatever the shift).
const ASK_REL = { q: [55, 59, 65], lo: -4, hi: 6, u60: 9.9 };
const ASK_YOUNG_X = 2.4;   // v34 A4: 25-and-under, 56-59 OVR: ask ceiling in minimums
const ASK_REF0 = { nba: [0.377, 0.544, 0.742], pbl: [0.376, 0.537, 0.714] };   // start-league fractions, for saves made before v33b
function askPool(L) { return active(L).filter(p => !p.prospect && !p.abroad && !p.club).map(p => p.ovr).sort((a, b) => b - a).slice(0, 13 * L.teams.length).reverse(); }
function askQ(a, f) { const x = clamp(f, 0, 1) * (a.length - 1), i = Math.floor(x), j = Math.min(a.length - 1, i + 1); return a[i] + (a[j] - a[i]) * (x - i); }
function askFrac(a, v) { let lt = 0, eq = 0; for (const o of a) { if (o < v) lt++; else if (o === v) eq++; } return (lt + eq / 2) / Math.max(1, a.length - 1); }
function updateAskShift(L) {
  const a = askPool(L); if (a.length < 20) return;
  if (!L.askRef || !L.askRef.f) { const f = ASK_REL.q.map(v => askFrac(a, v)); L.askRef = { f, q0: f.map(x => r1(askQ(a, x))), s: L.season }; }
  const R0 = L.askRef, d = R0.f.reduce((sum, f, i) => sum + askQ(a, f) - R0.q0[i], 0) / R0.f.length;
  L.askShift = clamp(Math.round(d * 4) / 4, ASK_REL.lo, ASK_REL.hi);
}
function lowAskCap(L, p) {
  if (!p || p.prospect) return null;
  const o0 = L && hiddenFor(L, p) ? Math.min(p.ovr, ovrRead(L, null, p)) : p.ovr, o = o0 - ((L && L.askShift) || 0);
  if (p.age <= 25 && o0 < 60) {   // v34 A4 (Kenneth): young 55- at the minimum, 56-59 at most ~2.4x it every season, whatever the shift (a weaker league let them reach 3-3.6x)
    const oy = Math.min(o, o0); if (oy <= ASK_RAMP.min) return { cap: MINSAL, hard: true };
    const jy = 0.88 + (flHash('ask|' + p.id) % 241) / 1000;
    return { cap: Math.max(MINSAL, r1(Math.min(MINSAL * ASK_YOUNG_X, MINSAL * ASK_RAMP.base * Math.pow(ASK_RAMP.g, oy - ASK_RAMP.hard) * jy))), hard: true };
  }
  if (o >= ASK_RAMP.open) return o0 < 60 ? { cap: ASK_REL.u60, hard: true } : null;
  if (o <= ASK_RAMP.min) return { cap: MINSAL, hard: true };
  const jit = 0.88 + (flHash('ask|' + p.id) % 241) / 1000;   // stable per player
  const cap = MINSAL * ASK_RAMP.base * Math.pow(ASK_RAMP.g, o - ASK_RAMP.hard) * jit;
  // v33b: rampK (market) lets more of the soft part through, but the ramp stays smooth: at most RAMP_STEP x per rating point above 59 (top)
  return { cap: Math.max(MINSAL, r1(cap)), hard: o <= ASK_RAMP.hard, soft: clamp((0.1 * (o - ASK_RAMP.hard) + 0.05) * ((L && L.rampK) || 1), 0, 1), top: MINSAL * ASK_RAMP.base * Math.pow(RAMP_STEP, o - ASK_RAMP.hard) * jit };
}
function rampAmt(L, p, v) {   // apply the ramp to an amount (market value, ask, bid)
  const c = lowAskCap(L, p); if (!c || v == null || v <= c.cap) return v;
  let out = c.hard ? c.cap : Math.min(c.cap + c.soft * (v - c.cap), Math.max(c.cap, c.top));
  if (p.ovr < 60) out = Math.min(out, ASK_REL.u60);
  return out < 1.5 ? MINSAL : r1(out);
}
function capAsk(L, p) { if (p.ask != null) p.ask = rampAmt(L, p, p.ask); return p.ask; }
// v33b: the market spends the budget, following the league. With the 1.2x lift alone it totalled ~$152M a team in NBA mode and ~$120M
// in PBL from season 1 (payroll drifted down to that). Step 1: the scale may rise to 1.2x (MKT_RAMP_LIFT) as before. Step 2: if that
// is short of the budget, the soft part of the ramp (60-64, league-relative) lets more through (L.rampK up to RAMP_K_MAX), so the money
// goes to mid-tier players that teams under the cap can afford, not only to stars already at the max. Step 3: if still short, the
// scale rises up to MKT_LIFT_MAX. Hard part (59 and under, league-relative) and the under-60 $10M rule never change.
const MKT_RAMP_LIFT = 1.2, RAMP_K_MAX = 2, MKT_LIFT_MAX = 3, RAMP_STEP = 2;
let MKT_ROOKIE_FIXED = true, MKT_LIFT_NBA = 3.4;   // v36a: rookie deals count at their cap hit; NBA lift ceiling (10 seasons x2 seeds with 3.0: payroll 169.4 / 170.3)
function computeMarket(L) {
  updateAskShift(L);
  const ps = active(L).filter(p => !p.prospect);
  const fb = p => Math.min(0.03, (p.fame || 0) / 100 * 0.03);   // fame adds a little beyond the accolade premium
  const wv = p => worth(hiddenFor(L, p) ? { ...p, ovr: ovrRead(L, null, p) } : p);   // v16: hidden rookies are valued on the media read
  const W = p => wv(p) * (1 + accBoost(p, L.season) + fb(p));
  ps.sort((a, b) => W(b) - W(a));
  const top = ps.slice(0, 13 * L.teams.length);
  const budget = L.teams.length * CAP * SPEND_K;
  // v36a: NBA: a player on his rookie deal is paid the scale, not his value, so he counts at his cap hit (the budget went to unpaid
  // rookie value: S11 save 60+ rookies valued $43.6M a team, paid $9.1M; most teams sat at the floor)
  const fixed = p => MKT_ROOKIE_FIXED && NBA_ON && p.contract && p.contract.type === 'rookie' && p.team != null ? capHit(L, p, capSeason(L)) : null;
  const total = (s, rmp) => top.reduce((sum, p) => { const f = fixed(p); if (f != null) return sum + f; let v = Math.min(maxFor(p), s * W(p)); if (rmp) v = rampAmt(L, p, v); return sum + (v < 1.5 ? 0 : v); }, 0);
  // scale so expected league-wide spending lands near the budget (between the $120M floor and the cap)
  const fit = rmp => { let lo = 0, hi = CAP * 4; for (let i = 0; i < 40; i++) { const m = (lo + hi) / 2; if (total(m, rmp) > budget) hi = m; else lo = m; } return lo; };
  // v32e: low-rated players are paid less (ramp); part of that money moves up to better players (the scale may rise up to 20%), the rest stays as team room
  L.rampK = 1;
  const f0 = fit(false); let scale = Math.min(fit(true), f0 * MKT_RAMP_LIFT);
  if (total(scale, true) < budget * 0.995) {
    let lo = 1, hi = RAMP_K_MAX; L.rampK = hi;
    if (total(scale, true) >= budget) { for (let i = 0; i < 24; i++) { L.rampK = (lo + hi) / 2; if (total(scale, true) > budget) hi = L.rampK; else lo = L.rampK; } L.rampK = Math.round(lo * 100) / 100; }
    else scale = Math.min(fit(true), f0 * (NBA_ON ? MKT_LIFT_NBA : MKT_LIFT_MAX));   // v36a: NBA may lift further (the rookie fix hit 3.0)
  }
  L.marketScale = r1(scale); L.marketLift = Math.round(scale / Math.max(1e-6, f0) * 100) / 100;
  for (const p of active(L)) { const b = accBoost(p, L.season); p.accPrem = Math.round(b * 100); const raw = scale * wv(p) * (1 + b + fb(p)) * (p.prone >= L.season - 1 ? 0.95 : 1) * (layoffAhead(L, p) >= 20 ? 1 - 0.35 * Math.min(1, layoffAhead(L, p) / SEASON_GAMES) : 1), v = Math.min(maxFor(p), raw); p.mval = v < 1.5 ? MINSAL : r1(v); p.mvalRaw = r1(raw); const rv = rampAmt(L, p, p.mval); if (rv < p.mval) { p.mval = rv; p.mvalRaw = Math.min(p.mvalRaw, rv); } }
}
// Players from recent champions and finalists want to be paid like winners (fades over two seasons)
function recentWinner(L, p) { const c = (p.awards || []).filter(a => a.a === 'Champion').map(a => a.s); const S = L.season; return c.includes(S) ? 2 : p.finalsLoss === S || c.includes(S - 1) ? 1 : p.finalsLoss === S - 1 ? 0.5 : 0; }
function winPrem(L, p) { const r = recentWinner(L, p); return r >= 2 ? 1.06 : r >= 1 ? 1.03 : r > 0 ? 1.015 : 1; }
// ---------- v15: archetype demand pricing ----------
// Live (free agency): teams that need his archetype and have room, vs free agents of that archetype at his level. Up to 1.5x.
// Projected (re-signings, extensions): teams expected to have room next summer and need him, vs next summer's class. Up to 1.3x.
const DEM = { fa: 1.5, proj: 1.3, lo: 0.85, k: 0.15 };
const DEM_CACHE = new WeakMap();
function demandCtx(L, proj) {
  const key = `${proj ? 1 : 0}|${L.season}|${L.phase}|${L.day || 0}|${L.faDay || 0}|${L.fa.length}`;
  let c = DEM_CACHE.get(L); if (c && c.key === key) return c;
  const needs = {}, room = {};
  for (const t of L.teams) {
    needs[t.id] = teamNeeds(L, t);
    let r = V244.b2 ? (proj ? b2Ceiling(L, t) - payroll(L, t, L.season + 1) : b2Room(L, t)) : proj ? CAP - payroll(L, t, L.season + 1) : faRoom(L, t);
    if (MLE_REAL && proj) { const pn = payroll(L, t, L.season + 1); r = Math.min(r, Math.max(CAP - pn, pn < TAXLINE ? MLE : 0)); }   // v32g: next summer: cap room or the mid-level
    if (t.owner) r = Math.min(r, Math.max(0, t.owner.limit - payroll(L, t, proj ? L.season + 1 : L.season)));
    room[t.id] = r;
  }
  const pool = proj ? [...active(L).filter(p => p.team != null && p.contract && p.contract.exp === L.season && !p.ext), ...L.fa.map(id => L.players[id]).filter(Boolean)] : L.fa.map(id => L.players[id]).filter(p => p && !p.retired);
  c = { key, needs, room, pool }; DEM_CACHE.set(L, c); return c;
}
function rawDemand(L, p, c) {
  const keys = p.arch.map(a => a.p + '|' + a.n), base = p.mval || MINSAL;
  let dem = 0;
  for (const t of L.teams) {
    const n = Math.max(...keys.map(k => c.needs[t.id][k] || 0));
    const rm = t.id === p.team ? Infinity : c.room[t.id];      // his own team can always go over the cap to keep him
    if (n >= 0.5 && (rm >= Math.min(base * 0.6, 8) || base <= MINSAL * 1.5)) dem += n;
  }
  let sup = 0;
  for (const q of c.pool) if (q.id !== p.id && q.ovr >= p.ovr - 3 && (q.arch || []).some(a => keys.includes(a.p + '|' + a.n))) sup++;
  return (dem + 0.5) / (sup + 1.5);
}
// demand is relative: compared with the typical player on the same market, so the league as a whole doesn't inflate
function demandOf(L, p, proj) {
  if (!p || p.ovr < 55 || !p.arch || !p.arch.length || p.prospect) return 1;
  const c = demandCtx(L, proj);
  if (c.med == null) { const v = c.pool.filter(q => q.ovr >= 55 && q.arch && q.arch.length).map(q => rawDemand(L, q, c)).sort((a, b) => a - b); c.med = v.length >= 5 ? v[Math.floor(v.length / 2)] : 1; }
  const ratio = rawDemand(L, p, c) / Math.max(0.05, c.med);
  return Math.round(clamp(1 + DEM.k * (ratio - 1), DEM.lo, proj ? DEM.proj : DEM.fa) * 100) / 100;
}
// what a team will pay on top of value when his archetype is in demand (most of the premium; less of a discount when cold)
function demPay(p) { const d = p.dem || 1; return d >= 1 ? 1 + 0.9 * (d - 1) : 1 - 0.5 * (1 - d); }
function setAsk(L, p) {
  if (!p.mval) p.mval = MINSAL;
  const ag = agentOf(L, p), am = ag ? AGENT_STYLE[ag.style].ask * agKind(ag).ask : 1;
  p.dem = p.mval <= MINSAL ? 1 : demandOf(L, p, p.team != null);
  p.insult = 0; p.prefY = null; p.faSeen = 0; p.faTalked = false; p.faTalk = null;
  // players know the most they can be paid (it depends on years of service), so nobody asks for more than that
  const sOK = superOK(L, p), base = sOK ? Math.max(p.mval, p.mvalRaw || 0) : p.mval, cap = sOK ? maxForTeam(L, p, ownTeamOf(p)) : maxFor(p);
  const proj = p.team != null, sp = p.mval <= MINSAL ? 1 : suitorPrem(L, p, proj); p.sprem = sp;
  const dm = Math.max(p.dem, Math.min(proj ? DEM.proj : DEM.fa, p.dem * sp));   // v24.4: demand and suitors together top out at 1.5x (1.3x re-signing)
  p.ask = p.mval <= MINSAL ? MINSAL : Math.min(cap, r1(base * rnd(1.0, 1.12) * (p.age >= 33 ? 0.9 : 1) * (1 + 0.04 * tw(p, 'mon')) * winPrem(L, p) * am * dm));
  if (p.ask < 1.5) p.ask = MINSAL;
  capAsk(L, p);   // v32e
  p.faDays = 0;
}
function yrsFor(p, amt) {
  if (amt <= MINSAL + 1e-9) return rint(1, 2);
  if (p.mval && amt < 0.8 * p.mval) return 1; // took a discount: wants a new deal soon
  let y = p.age <= 25 ? rint(3, 5) : p.age <= 28 ? rint(2, 4) : p.age <= 29 ? rint(1, 3) : p.age <= 31 ? rint(1, 2) : 1;   // careful with long deals past 30
  if (p.ovr >= 76 && p.age <= 28) y = Math.min(5, y + 1);
  // stars still command long deals into their 30s (free agents can sign for 4 at most; only his own team can offer 5)
  if (p.ovr >= 74 && p.age >= 29) y = p.age <= 31 ? wpick([3, 4, 5], [30, 40, 30]) : p.age <= 33 ? wpick([2, 3, 4], [35, 45, 20]) : rint(1, 2);
  if (p.ovr < 60) y = Math.min(y, 2);
  return clamp(y, 1, 5);
}
function signContract(L, p, tid, amt, yrs, type, opt, extra) {
  if (p.club) try { pipeLeave(L, p, tid); } catch (e) { }   // v29 P8: in-season signing from an international club (EABL buyout)
  if (extra && extra.callUp) extra = null;
  let rl0 = null; if (extra && extra.rl && Object.keys(extra).length === 1) { rl0 = extra.rl; extra = null; }   // v32b: an AI offer's role is info only, not a clause
  let mvS = null; try { mvS = mvSignPre(L, p, tid, type, amt); } catch (e) { }   // v30c #5
  const aiMade = !extra && tid !== L.user;   // v26.1 review: AI deals get clauses too (aiClauses)
  amt = Math.max(MINSAL, r1(amt));
  if (amt > maxFor(p) + 1e-6) { p.superUsed = L.season; logNews(L, `${p.name} signed a supermax with ${L.teams[tid].abbr}: ${money(amt)}/yr`, tid, 'tx'); }   // v16: one per career
  // AI teams put part of a deal in games-played incentives for injury-prone or older players, and give stars no-trade clauses sometimes
  if (!extra && tid !== L.user && amt >= 4 && type !== 'rookie' && ((p.prone != null && p.prone >= L.season - 1) || p.age >= 32) && R() < 0.6) { const inc = r1(amt * 0.15); amt = Math.max(MINSAL, r1(amt - inc)); extra = { inc, incK: 'gp' }; }
  if (!extra && tid !== L.user && NTC_ELIGIBLE(p) && yrs >= 3 && R() < 0.4) extra = { ntc: true };
  if (aiMade && type !== 'rookie' && amt >= 4) { const ac = aiClauses(L, p, tid, yrs); if (ac) extra = Object.assign(extra || {}, ac); }
  const cs = capSeason(L);
  const hg = (type === 're-sign' || type === 'extension') && p.draftTid === tid && amt >= 10;
  if (opt === undefined) opt = autoOption(p, yrs, amt);
  if (yrs < 2) opt = null;
  p.contract = { amt, exp: cs + yrs - 1, hg, type, len: yrs, opt: opt || null };
  if (extra) { if (extra.inc > 0) { p.contract.inc = r1(extra.inc); p.contract.incK = extra.incK || 'gp'; } if (extra.ntc) p.contract.ntc = true;
    // v26.1: several incentives, trade kicker, early opt-out, partial guarantee, role promise
    if (extra.incs && extra.incs.length) { p.contract.inc = 0; p.contract.incs = extra.incs.filter(x => x.amt > 0 && INC_KINDS.includes(x.k)).map(x => ({ k: x.k, amt: r1(x.amt), lk: incLikely2(L, p, L.teams[tid], x.k) >= 0.5 })); }
    if (extra.kick > 0) p.contract.kick = Math.min(KICK_MAX, extra.kick);
    if (extra.eto && yrs >= 3) p.contract.eto = cs + clamp(Math.round(extra.eto), 1, yrs - 1) - 1;
    if (extra.gtd != null && extra.gtd < 1 && yrs >= 2) p.contract.gtd = extra.gtd;
    if (extra.role) p.contract.role = ROLE_BY[extra.role.k] ? { k: extra.role.k, v: ROLE_BY[extra.role.k].lo, br: [] } : { k: extra.role.k === 'min' ? 'min' : 'starter', v: extra.role.k === 'min' ? (extra.role.v || 24) : null, br: [] }; }   // v32b: a promised role (ROLES key) or the older starter / minutes promise
  try { p.contract.rl = extra && extra.role && ROLE_BY[extra.role.k] ? extra.role.k : rl0 || (extra && extra.rl) || expRole(L, L.teams[tid], p); } catch (e) { }   // v32b: the role he signed for
  p.contracts.push({ s: cs, tid, amt, yrs, type, hg, opt: opt || null });
  const joining = p.team !== tid;
  // free-agent signings can't be traded until the 25% mark of the next season (in-season signings: 14 days)
  p.noTrade = type === 'signing' && joining ? (L.phase === 'regular' ? { s: L.season, day: L.day + 14 } : { s: capSeason(L), day: -1 }) : null;
  if (joining) { p.morale = 60; p.tradeReq = null; }
  if (type === 'signing' && tid === L.user && L.me && L.phase !== 'regular') { const k = capSeason(L); L.me.spree = L.me.spree && L.me.spree.s === k ? L.me.spree : { s: k, n: 0 }; if (++L.me.spree.n >= 5) unlock(L, 'spree'); }
  const t0 = L.teams[tid];
  // v32g: a signing above the minimum that doesn't fit under the cap is the team's mid-level for the season (AI and you; your
  // offer can only reach this point over the cap with "Use mid-level" ticked, see negotiate). p is not on the roster yet here.
  if (type === 'signing' && contractHit(amt, false) > 0 && payroll(L, t0) + contractHit(amt, false) > CAP + 1e-6 && (!extra || extra.mle == null || extra.mle || MLE_REAL)) { t0.mleUsed = capSeason(L); t0.mleWho = { s: capSeason(L), pid: p.id, amt }; }
  for (const ot of L.teams) if (ot.id !== tid && (ot.dead || []).some(d => d.pid === p.id)) {
    ot.dead = ot.dead.filter(d => d.pid !== p.id);
    logNews(L, `${p.name} signed with ${t0.abbr}, so his dead money comes off ${ot.abbr}'s cap`, ot.id, 'tx');
  }
  addToTeam(L, p, tid);
  if (joining) assignNumber(L, p, L.teams[tid]);
  p.ask = null; p.hardship = false; p.ext = null;
  const t = L.teams[tid];
  const txt = type === 're-sign' ? `Re-signed with ${t.abbr}` : type === 'rookie' ? `Rookie deal with ${t.abbr}` : type === 'hardship' ? `Hardship signing with ${t.abbr}` : type === 'payroll' ? `Signed with ${t.abbr} (payroll-floor deal)` : `Signed with ${t.abbr}`;
  const os = opt ? ` with a ${opt === 'PO' ? 'player' : 'team'} option` : '';
  try { mvSignPost(L, p, tid, mvS, amt, yrs); } catch (e) { }   // v30c #5
  p.tx.push({ s: L.season, t: `${txt}: ${yrs} yr, ${money(amt)}/yr${os}${hg ? ' (90% cap hit)' : ''}` });
  if (p.tx.length > 60) p.tx.splice(0, p.tx.length - 60);
  if (type === 'signing' || type === 're-sign' || type === 'extension') try { feedSign(L, p, tid, type, amt, yrs); } catch (e) { }   // v26.5
  if (amt >= 8 || tid === L.user || type === 'payroll') logNews(L, flL(L, type === 're-sign' ? 'news.resign' : 'news.sign', { team: t.abbr, name: p.name, ovr: p.ovr, yrs, amt: money(amt), os }), tid, 'tx');
}
// Options in AI-made deals: stars and money-first players get player options, young or unproven players team options
function autoOption(p, yrs, amt) {
  if (yrs < 2 || amt <= MINSAL) return null;
  if ((p.ovr >= 80 || trv(p, 'mon') >= 70) && R() < 0.45) return 'PO';
  if ((p.age <= 24 || p.ovr < 65) && R() < 0.35) return 'TO';
  return null;
}
function assignNumber(L, p, t) {
  // v30 review: two-way players count as taken too, and numbers compare as text ("00", 23 vs "23")
  const taken = new Set([...t.roster, ...(t.twoWay || [])].filter(id => id !== p.id).map(id => L.players[id] && L.players[id].num).filter(n => n != null).map(String).concat((t.retired || []).map(r => String(r.num))));
  if (p.num != null && p.num !== '' && !taken.has(String(p.num))) return;
  const pool = [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14, 15, 17, 18, 19, 20, 21, 22, 23, 24, 25, 26, 27, 28, 30, 31, 32, 33, 34, 35, 40, 41, 42, 43, 44, 45, 50, 51, 52, 55, 77, 88, 99].filter(n => !taken.has(String(n)));
  p.num = pool.length ? pick(pool) : rint(60, 98);
}
function releaseBlock(L, p) {
  const t = L.teams[p.team]; if (!t) return 'He is not on a team.';
  if (L.phase === 'playoffs') return 'Rosters are frozen during the playoffs.';
  if (L.phase === 'regular' && t.roster.length <= 13 && t.id === L.user) return `Teams need at least 13 players during the season. Sign someone before releasing ${p.name}.`;
  return null;
}
// v24.2: minimum-contract players an AI team can waive (worst first), leaving out anyone in the deal
// v24.3: who an AI team can cut to get back to 15: minimum-contract players first (worst first), then non-core players on bigger deals (outside its top 9, not injured long-term, protected or a young rookie-scale pick). The second group leaves dead money, which tradeCheck charges to the team.
function waivable(L, t, giveIds) {
  const r = rosterOf(L, t).filter(p => !giveIds.includes(p.id) && p.contract);
  const core = new Set(r.slice().sort((x, y) => y.ovr - x.ovr).slice(0, 9).map(p => p.id));
  const mins = r.filter(p => p.contract.amt <= MINSAL).sort((x, y) => x.ovr - y.ovr);
  const rest = r.filter(p => p.contract.amt > MINSAL && !core.has(p.id) && !p.hardship && !(p.injLong && p.injury > 10) && !((tradeStatus(L, p) || {}).k === 'protect') && !(p.contract.type === 'rookie' && p.age <= 21)).sort((x, y) => x.ovr - y.ovr);
  return mins.concat(rest);
}
function waiveDead(L, t, giveIds, ex) { const cs = capSeason(L); return ex > 0 ? waivable(L, t, giveIds).slice(0, ex).reduce((s, p) => s + (p.contract.amt > MINSAL && p.contract.exp >= cs ? capHit(L, p, cs) : 0), 0) : 0; }
// can both AI sides get back to 15 after this deal? (used by deals that skip tradeCheck)
function rosterFits(L, a, b, aGive, bGive) { return [[L.teams[a], aGive, bGive], [L.teams[b], bGive, aGive]].every(([T, give, get]) => T.id === L.user || (() => { const ex = T.roster.length - give.players.length + get.players.length - Math.max(15, T.roster.length); return ex <= 0 || waivable(L, T, give.players).length >= ex; })()); }
function release(L, p) {
  const t = L.teams[p.team]; if (!t) return;
  let mvR = null; try { mvR = { why: mvWhyRelease(L, t, p), s0: mvSnap(L, t.id) }; } catch (e) { }   // v30c #5
  if (p.ovr >= 65 && p.morale != null && p.morale < 40) addGrudge(L, p, t.id, 'being released');   // v17
  const cs = capSeason(L);
  // Non-minimum deals stay on the cap as dead money until the deal ends, unless another team signs him
  if (p.contract && p.contract.exp >= cs && capHit(L, p, cs) > 0) { const c = p.contract, h = capHit(L, p, cs) - incCap(c);   // v26.1: a partial guarantee only owes that share of the final season
    if (c.gtd != null && c.gtd < 1) { if (c.exp > cs) t.dead.push({ amt: h, exp: c.exp - 1, name: p.name, pid: p.id, s: L.season }); t.dead.push({ amt: r1(h * c.gtd), exp: c.exp, from: c.exp, name: p.name, pid: p.id, s: L.season }); }
    else t.dead.push({ amt: h, exp: c.exp, name: p.name, pid: p.id, s: L.season }); }
  p.tx.push({ s: L.season, t: `Released by ${t.abbr}` });
  logNews(L, flL(L, 'news.release', { team: t.abbr, name: p.name }), t.id, 'tx');
  toFA(L, p);
  try { if (mvR) mvRec(L, { kind: 'release', tids: [t.id], pid: p.id, name: p.name, wu: [mvWU(L, t.id, 'release', mvR.why, mvR.s0, mvSnap(L, t.id), false)] }); } catch (e) { }   // v30c #5
}

// ---------- Initial finances ----------
function initFinances(L) {
  for (const p of active(L)) if (!p.prospect && p.age >= 28) p.scout = Math.max(p.ovr, Math.round((p.pot + p.ovr) / 2) - (p.age >= 31 ? 3 : 0));
  for (const p of active(L)) { if (!p.real) p.svc = 0; p.arch = archetypes(p); }
  computeMarket(L);
  for (const t of L.teams) {
    if (L.nba) continue;   // v27: real contracts
    for (const p of rosterOf(L, t)) {
      let amt = p.mval <= MINSAL ? MINSAL : r1(p.mval * rnd(0.9, 1.1));
      if (amt < 1.5) amt = MINSAL;
      const yrs = p.ovr >= 75 && p.age <= 29 ? rint(2, 3) : p.age >= 32 ? 1 : rint(1, 3);
      p.contract = { amt, exp: L.season + yrs - 1, hg: false, type: 'initial', len: yrs, opt: null };
      p.contracts.push({ s: L.season, tid: t.id, amt, yrs, type: 'initial', hg: false });
      p.tx.push({ s: L.season, t: `Joined ${t.abbr} in the league's first season` });
    }
    const pay = payroll(L, t), lim = CAP * 0.94, floor = MINPAY + 2;
    const scaleTo = target => { const f = target / payroll(L, t); for (const p of rosterOf(L, t)) if (p.contract.amt > MINSAL) p.contract.amt = Math.min(maxFor(p), Math.max(MINSAL, r1(p.contract.amt * f))), p.contracts[p.contracts.length - 1].amt = p.contract.amt; };
    if (pay > lim) scaleTo(lim); else if (pay < floor && pay > 0) { scaleTo(floor); scaleTo(floor); }
  }
  for (const id of L.fa) setAsk(L, L.players[id]);
  ensurePicks(L);
}
const PICK_YEARS = 6;   // v26.2: picks for this season and the next 6 drafts
function ensurePicks(L) {
  for (let s = L.season; s <= L.season + PICK_YEARS; s++) for (const rd of [1, 2]) for (const t of L.teams)
    if (!L.picks.some(k => k.s === s && k.rd === rd && k.orig === t.id)) L.picks.push({ id: `${s}-${rd}-${t.id}`, s, rd, orig: t.id, owner: t.id });
}
function draftSlotOf(L, k) { return L.draftOrder && k.s === L.season ? L.draftOrder.find(x => x.rd === k.rd && x.orig === k.orig) : null; }
function pickUsed(L, k) { const o = draftSlotOf(L, k); return !!(o && o.pid); }
function pickLabel(L, k) { const o = draftSlotOf(L, k); return `${draftLabel(k.s)} ${k.rd === 1 ? '1st' : '2nd'}${o ? ' (#' + o.no + ')' : ''}${k.orig !== k.owner ? ' (' + L.teams[k.orig].abbr + ')' : ''}${protLabel(k)}`; }

// ---------- Team needs & modes ----------
// v19: during an AI trade search nothing changes, so rotations and needs are cached per team
let TV_MEMO = null;
function memoT(kind, t, f) {
  if (!TV_MEMO) return f();
  const k = kind + t.id, e = TV_MEMO.get(k);
  if (e && e.t === t && e.r === t.roster && e.n === t.roster.length) return e.v;
  const v = f(); TV_MEMO.set(k, { t, r: t.roster, n: t.roster.length, v }); return v;
}
function rotationOf(L, t) { return memoT('r', t, () => rotationOf0(L, t)); }
function rotationOf0(L, t) {
  const rem = SEASON_GAMES - (t.w + t.l);
  return rosterOf(L, t).filter(p => !(p.injLong && p.injury >= rem)).sort((a, b) => playerValue(b, t.coach) - playerValue(a, t.coach)).slice(0, 9);
}
function teamNeeds(L, t) { return memoT('n', t, () => teamNeeds0(L, t)); }
function teamNeeds0(L, t) {
  const rot = rotationOf(L, t);
  const covered = new Set(); const posCount = [0, 0, 0, 0, 0];
  for (const p of rot) { if (p.ovr >= 62) for (const a of p.arch || []) covered.add(a.p + '|' + a.n); posCount[p.pos]++; if (p.pos2 != null) posCount[p.pos2]++; }
  const wants = new Set([...SYS_WANTS[t.coach.off], ...SYS_WANTS[t.coach.def]]);
  const out = {};
  for (const pos in ARCH) for (const n in ARCH[pos]) {
    const k = pos + '|' + n;
    const lack = covered.has(k) ? 0.12 : 1, want = wants.has(k) ? 1 : 0.35;
    out[k] = clamp(0.55 * want * lack + 0.25 * lack + (posCount[POS.indexOf(pos)] < 2 ? 0.4 : 0), 0, 1);
  }
  return out;
}
function needMult(L, t, p, needs) {
  needs = needs || teamNeeds(L, t);
  const rot = rotationOf(L, t);
  const bar = rot.length >= 8 ? rot[7].ovr - 3 : 0;
  if (p.ovr < bar) return 1;
  let m = 0; for (const a of p.arch || []) m = Math.max(m, needs[a.p + '|' + a.n] || 0);
  return 1 + 0.5 * m;
}
// ---------- v25.7 core players, coach targets (3 tabs) and position reads ----------
// Core: up to 4 players a team builds around. Coach targets never suggest someone who would take a core player's spot.
// Your team: the players you mark (p.core). AI teams: picked from value and, for rebuilders, the young core.
const CORE_MAX = 4;
function coreOf(L, t) {
  const ps = rosterOf(L, t);
  if (t.id === L.user) return ps.filter(p => p.core).slice(0, CORE_MAX);
  const low = t.mode === 'rebuild' || t.mode === 'tank';
  const young = ps.filter(p => p.age <= 24 && (p.scout || 0) >= 72).sort((a, b) => b.scout - a.scout);
  const byV = ps.slice().sort((a, b) => playerTV(L, t, b, true) - playerTV(L, t, a, true));
  const out = [];
  for (const p of low ? [...young.slice(0, 3), ...byV.slice(0, 1)] : [...byV.slice(0, 2), ...young.slice(0, 1)]) if (!out.includes(p)) out.push(p);
  return out.slice(0, 3);
}
function setCore(L, p, on) {
  if (!on) { p.core = false; return null; }
  if (p.team !== L.user) return 'Only players on your team can be core players.';
  const n = rosterOf(L, L.teams[L.user]).filter(x => x.core && x.id !== p.id).length;
  if (n >= CORE_MAX) return `You can mark up to ${CORE_MAX} core players. Unmark one first.`;
  p.core = true; return null;
}
// Spots the coach keeps open: core players, plus (rebuilding or tanking) young players with upside in the rotation
function keptSpots(L, t) {
  const core = coreOf(L, t), out = core.map(p => ({ p, why: 'core' }));
  if (t.mode === 'rebuild' || t.mode === 'tank') for (const p of rotationOf(L, t)) if (!core.includes(p) && p.age <= 23 && (p.scout || 0) >= 72) out.push({ p, why: 'young' });
  return out;
}
// Would this player take a kept player's spot? He would if every position he plays is held by a kept player he could pass (within 5 OVR or better).
function takesSpot(L, t, p, kept) {
  const mine = [p.pos, p.pos2].filter(x => x != null), blockers = [];
  for (const s of mine) { const k = kept.find(x => x.p.pos === s && x.p.id !== p.id && p.ovr > x.p.ovr - 5); if (!k) return null; blockers.push(k); }
  return blockers[0] || null;
}
const TARGET_TABS = { plan: "Owner's plan", now: 'Win now', dev: 'Development' };
// Which way the owner's plan leans: 0 = all about now, 1 = all about the future
const PLAN_LEAN = { allin: 0, contend: 0, push: 0.1, hopeful: 0.25, rising: 0.55, retool: 0.5, rebuild: 0.8, tank: 1 };
function planLean(t) { const v = PLAN_LEAN[t.status]; return v != null ? v : PLAN_LEAN[t.mode] != null ? PLAN_LEAN[t.mode] : 0.3; }
function coachTargets(L, t, kind, tab) {
  tab = TARGET_TABS[tab] ? tab : 'plan';
  const needs = teamNeeds(L, t), rot = rotationOf(L, t), c = t.coach, kept = keptSpots(L, t);
  const bar = rot.length >= 8 ? rot[7].ovr : 0, cov = [0, 0, 0, 0, 0]; for (const p of rot) { cov[p.pos]++; if (p.pos2 != null) cov[p.pos2]++; }
  const room = kind === 'fa' ? Math.max(V244.b2 ? b2Room(L, t) : faRoom(L, t), MINSAL) : 0;
  const pool = kind === 'fa' ? L.fa.map(id => L.players[id]).filter(p => p && !p.prospect && !p.retired) : active(L).filter(p => p.team != null && p.team !== t.id && !p.prospect);
  const lean = tab === 'now' ? 0 : tab === 'dev' ? 1 : planLean(t);
  const out = [];
  for (const p of pool) {
    if (p.injLong) continue;
    const est = teamPotEst(L, t.id, p).est, young = p.age <= 24;
    if (tab === 'dev' && !young) continue;
    if (tab === 'plan' && p.age > (lean >= 0.8 ? 25 : lean >= 0.5 ? 28 : 99)) continue;   // a rebuild targets 25 and under, a retool 28 and under
    const floor = tab === 'dev' ? bar - 12 : bar - (kind === 'fa' ? 3 : 1) - (lean >= 0.5 && young ? 8 : 0);
    if (p.ovr < floor) continue;
    if (tab === 'dev' && est < Math.max(70, bar + 2)) continue;
    let capNote = '';
    if (kind === 'fa') {   // v32d: only free agents whose ask fits under the hard cap, each with where it fits
      if (p.ask == null) setAsk(L, p);
      const hit = contractHit(p.ask, false), after = payroll(L, t) + hit;
      if (hit > 0 && after > APRON + 1e-6) continue;
      if (MLE_REAL && hit > 0 && after > CAP + 1e-6 && !mleFits(L, t, payroll(L, t), hit)) continue;   // v32g: over the cap only a mid-level deal fits
      if (hit <= 0) capNote = 'Minimum deal: always fits';
      else if (after <= CAP + 1e-6) capNote = `Fits cap space (${money(CAP - after)} left after)`;
      else if (MLE_REAL) { let tx = 0; try { tx = after > TAXLINE ? taxCostOf(L, t, payroll(L, t), hit) : 0; } catch (e) { } capNote = `Needs your mid-level (${money(MLE)}, once a season)${tx > 0 ? `; over the tax line after, about ${money(tx)} tax` : ''}`; }
      else if (after <= TAXLINE + 1e-6) capNote = `Fits under the tax line (${money(TAXLINE - after)} to spare); over the cap`;
      else { let tx = 0; try { tx = taxCostOf(L, t, payroll(L, t), hit); } catch (e) { } capNote = `Fits under the hard cap (${money(APRON - after)} left); over the tax line, about ${money(tx)} tax`; }
    }
    else { const st = tradeStatus(L, p); if ((st && st.k === 'protect') || tradeRestricted(L, p) || p.protect) continue; }
    const blk = takesSpot(L, t, p, kept); if (blk) continue;                      // never suggest someone who takes a kept player's spot
    let need = 0, needA = null; for (const a of p.arch || []) { const v = needs[a.p + '|' + a.n] || 0; if (v > need) { need = v; needA = a; } }
    const f = fit(p, c), why = [];
    // now-score: what he gives this season; dev-score: what he can become, and how many years he has to get there
    const nowSc = p.ovr + need * 8 + (f - 60) * 0.15 + (cov[p.pos] < 2 ? 4 : 0) - (p.age >= 32 ? (p.age - 31) * 2 : 0);
    const devSc = est + (young ? (25 - p.age) * 0.8 : -10) + need * 6 + (f - 60) * 0.2 + (p.ovr - bar) * 0.2;
    const sf = styleFit(p, c), ps = playstyle(p);   // v35: his habits vs the coach's offense (a pace coach wants volume shooters)
    let sc = (1 - lean) * nowSc + lean * devSc + sf * 3;
    if (p.sarch) why.push(`superstar: ${p.sarch}`);
    if (needA && need >= 0.5) why.push(`fills a need: ${needA.n} ${needA.p}${ps.length ? ' (' + ps[0].toLowerCase() + ')' : ''}`);
    if (sf >= 0.4) why.push(`his playstyle suits ${OFF_SYS[c.off].name.toLowerCase()}`);
    if (f >= 70) why.push(`fits his ${OFF_SYS[c.off].name.toLowerCase()} / ${DEF_SYS[c.def].name.toLowerCase()} systems (fit ${f})`);
    if (cov[p.pos] < 2) why.push(`thin at ${POS[p.pos]}`);
    if (lean >= 0.5 && young && est >= p.ovr + 4) why.push(`${p.age} with room to grow (coach's read: ${est} potential)`);
    if (lean <= 0.25 && p.ovr >= (rot[4] || { ovr: 99 }).ovr) { sc += 3; why.push('could start now'); }
    { const sp = kept.filter(k => p.pos2 != null && k.p.pos === p.pos && p.pos2 !== p.pos); if (sp.length) why.push(`plays ${POS[p.pos2]} next to ${sp[0].p.name}`); }
    { const bk = kept.find(k => k.p.pos === p.pos && p.ovr <= k.p.ovr - 5); if (bk) why.push(`backs up ${bk.p.name} without taking his minutes`); }
    if (kind !== 'fa') { const st = tradeStatus(L, p); if (st && st.k === 'block') { sc += 3; why.push('his team is shopping him'); } }
    if (!why.length) continue;
    out.push({ p, sc, why: why.join('; '), est, cap: capNote });
  }
  return out.sort((a, b) => b.sc - a.sc).slice(0, 8);
}
// Position read: per position, who holds it, how deep it is and which playstyles the team needs there (team needs + coach's systems + core)
function positionRead(L, t) {
  const needs = teamNeeds(L, t), rot = rotationOf(L, t), kept = keptSpots(L, t), c = t.coach;
  const wants = new Set([...SYS_WANTS[c.off], ...SYS_WANTS[c.def]]), covered = new Set();
  for (const p of rot) if (p.ovr >= 62) for (const a of p.arch || []) covered.add(a.p + '|' + a.n);
  const out = [];
  for (let s = 0; s < 5; s++) {
    const here = rot.filter(p => p.pos === s || p.pos2 === s).sort((a, b) => slotRating(b, s) - slotRating(a, s));
    const keep = kept.find(k => k.p.pos === s);
    const archs = Object.keys(ARCH[POS[s]]).map(n => ({ n, v: needs[POS[s] + '|' + n] || 0, k: POS[s] + '|' + n })).sort((a, b) => b.v - a.v).slice(0, 2).filter(a => a.v >= 0.4)
      .map(a => ({ n: a.n, v: Math.round(a.v * 100) / 100, why: [wants.has(a.k) ? `fits the ${(SYS_WANTS[c.off].includes(a.k) ? OFF_SYS[c.off] : DEF_SYS[c.def]).name.toLowerCase()} system` : null, covered.has(a.k) ? null : 'nobody in the rotation plays it'].filter(Boolean).join(', ') }));
    const st = keep ? 'core' : here.length < 2 ? 'thin' : archs.length && archs[0].v >= 0.6 ? 'need' : 'set';
    const vars = { pos: POS[s], name: keep ? keep.p.name : here[0] ? here[0].name : 'nobody', n: here.length, arch: archs.length ? (/^[aeiou]/i.test(archs[0].n) ? 'an ' : 'a ') + archs.map(a => a.n.toLowerCase()).join(' or ') : 'more depth' };
    out.push({ pos: s, status: st, starter: here[0] ? here[0].id : null, keep: keep ? keep.p.id : null, depth: here.map(p => p.id), archs, line: fl('pr.' + st, vars, t.id * 7 + s + L.season) });
  }
  return out;
}
function teamStrength(L, t) {
  const rem = SEASON_GAMES - (t.w + t.l);
  const ps = rosterOf(L, t).filter(p => !(p.injury >= rem && rem > 0)).sort((a, b) => b.ovr - a.ovr);
  const w = [1, 1, 1, 1, 1, 0.7, 0.5, 0.4]; let s = 0;
  w.forEach((x, i) => s += x * (ps[i] ? ps[i].ovr : 40));
  return s / 6.6;
}
// v21 team status. Ranked league-wide by a fuller roster strength (preseason) or a strength + results blend (midseason review),
// then placed in bands: 1-4 All-in, 5-8 Contender, 9-16 Push / Hopeful / Retool, 17-24 Rebuild / Hopeful, 25-30 Tank (max 20%) / Rebuild.
// Bands scale with league size. Rebuild and Tank are multi-season plans; midseason changes need a clear miss.
// t.status is the detailed status; t.mode keeps the 4 base modes the rest of the AI uses (All-in/Contender -> contend, Push/Hopeful/Retool -> hopeful).
// v22: display-only label update at the deadline and at the end of the regular season (strategy and spending don't change)
function relabelStatus(L) {
  const n = L.teams.length, ord = L.teams.slice().sort((a, b) => (b.w / Math.max(1, b.w + b.l)) - (a.w / Math.max(1, a.w + a.l)) || (b.pf - b.pa) - (a.pf - a.pa)), r = {};
  ord.forEach((t, i) => r[t.id] = i + 1);
  for (const t of L.teams) { t.stShow = null; if (['allin', 'contend', 'push'].includes(t.status) && r[t.id] > n * 0.6) t.stShow = 'hopeful'; else if (['rebuild', 'tank'].includes(t.status) && r[t.id] <= n * 0.4) t.stShow = 'hopeful'; }
}
const shownStatus = t => t.stShow || t.status;
const STATUS_LABEL = { allin: 'All-in', contend: 'Contender', push: 'Push', hopeful: 'Playoff hopeful', rising: 'Rising', retool: 'Retooling', rebuild: 'Rebuilding', tank: 'Tanking' };
const STATUS_MODE = { allin: 'contend', contend: 'contend', push: 'hopeful', hopeful: 'hopeful', rising: 'hopeful', retool: 'hopeful', rebuild: 'rebuild', tank: 'tank' };
const STATUS_WHY = { allin: 'Title favorite: trades picks and young players for help and spends up to the hard cap', contend: 'Real title shot: buys at the deadline and pays up to the tax line', push: 'Close to contending with a star or veterans: buys a piece or two instead of selling', hopeful: 'Chasing a playoff or play-in spot: buys only clear upgrades', rising: 'A rebuild that reached playoff range early: buys only expiring veterans with 2nds or far-off 1sts, keeps its own near 1sts and young core, and keeps playing the kids', retool: 'Good but aging or slipping: getting younger without bottoming out', rebuild: 'Building around young players for the next 2-3 seasons: sells veterans', tank: 'Bottoming out for the lottery: sells veterans, plays the kids' };
function rosterPower(L, t, pre) {
  const ps = rosterOf(L, t), rem = SEASON_GAMES - (t.w + t.l);
  const avail = ps.filter(p => !(p.injLong && p.injury >= Math.max(10, rem * 0.5)));
  const rot = avail.map(p => ({ p, v: playerValue(p, t.coach) * (p.injury > 0 ? 0.85 : 1) })).sort((a, b) => b.v - a.v);   // ratings plus coach-system fit
  const w = [1, 1, 1, 1, 1, 0.7, 0.5, 0.4];
  let sc = 0; w.forEach((x, i) => sc += x * (rot[i] ? rot[i].v : 40)); sc /= 6.6;
  sc -= balanceIssues(L, t, avail) * 1.0;                                    // position balance
  try { sc += Math.min(1.2, teamDuos(L, t).avg * 0.6); } catch (e) { }       // chemistry: time played together
  const top = rot.slice(0, 8).map(x => x.p), best = top[0];
  if (best) sc += best.ovr >= 85 ? 1.2 : best.ovr >= 80 ? 0.6 : 0;          // star power
  if (pre && top.length) { const age = top.reduce((a, p) => a + p.age, 0) / top.length; sc += age < 25 ? 0.6 : age > 30 ? -0.6 * (age - 30) : 0; }   // age trend for the season ahead
  return sc;
}
function computeModes(L, label) {
  for (const t of L.teams) t.stShow = null;
  const n = L.teams.length, pre = label === 'Preseason';
  const z = arr => { const m = arr.reduce((a, b) => a + b, 0) / n; const sd = Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / n) || 1; return arr.map(x => (x - m) / sd); };
  const st = z(L.teams.map(t => rosterPower(L, t, pre)));
  const gp = L.teams.map(t => t.w + t.l);
  const wp = z(L.teams.map(t => gp[t.id] ? t.w / gp[t.id] : 0.5)), pd = z(L.teams.map(t => gp[t.id] ? (t.pf - t.pa) / gp[t.id] : 0));
  const live = label !== 'Preseason';
  const rf = z(L.teams.map(t => { const l = t.last10 || ''; return l.length >= 6 ? l.split('').filter(c => c === 'W').length / l.length : 0.5; }));   // v24.1: last 10 games
  const score = L.teams.map((t, i) => gp[i] >= 8 ? (live ? 0.4 * st[i] + 0.5 * (0.5 * wp[i] + 0.5 * pd[i]) + 0.1 * rf[i] : 0.45 * st[i] + 0.55 * (0.5 * wp[i] + 0.5 * pd[i])) : st[i]);
  const holdMap = {};
  // v26.5 review: rebuild fatigue. lowRun = seasons in a row that ended Rebuilding / Tanking. 3+: no more tanking, the plan stops holding and buying gets likelier; 4+: the owner fires the GM (new front office)
  if (pre) for (const t of L.teams) { if (t.id === L.user) continue; t.lowRun = t.status === 'rebuild' || t.status === 'tank' ? (t.lowRun || 0) + 1 : 0; if (t.lowRun >= 4 && !(t.newGM >= L.season - 2)) gmReset(L, t); }
  const order = L.teams.map(t => t.id).sort((a, b) => score[b] - score[a]);
  const B = k => Math.round(n * k / 30);                // band edges on the 30-team scale
  const tankMax = Math.floor(n * 0.2);
  const rank = {}; order.forEach((tid, i) => rank[tid] = i + 1);
  const bandOf = r => r <= B(4) ? 0 : r <= B(8) ? 1 : r <= B(16) ? 2 : r <= B(24) ? 3 : 4;
  const want = {}, whyMap = {}, ridx = { Preseason: 0, Midseason: 1, 'Pre-deadline': 2 }[label] != null ? { Preseason: 0, Midseason: 1, 'Pre-deadline': 2 }[label] : 3;
  for (const tid of order) {
    const t = L.teams[tid], r = rank[tid], ps = rosterOf(L, t).sort((a, b) => b.ovr - a.ovr), top = ps[0];
    const tight = !!(t.owner && t.owner.tight);
    const young = ps.filter(p => p.age <= 24 && ((p.scout || 0) >= 70 || p.ovr >= 65)).length;
    const top5 = ps.slice(0, 5), age5 = top5.reduce((a, p) => a + p.age, 0) / Math.max(1, top5.length);
    const starPrime = top && top.ovr >= 80 && top.age <= 31, starPush = top && top.ovr >= 78 && top.age >= 26 && top.age <= 33;
    const vets = ps.filter(p => p.age >= 30 && p.ovr >= 72).length;
    const prev = t.status, b = bandOf(r);
    let m;
    if (b === 0) m = starPrime && !tight ? 'allin' : 'contend';
    else if (b === 1) m = 'contend';
    else if (b === 2) m = (starPush || vets >= 2) && !tight && r <= B(14) ? 'push' : age5 >= 29 && (r > B(12) || prev === 'contend' || prev === 'allin') ? 'retool' : 'hopeful';
    else if (b === 3) m = young >= 3 || (t.plan && t.plan.until >= L.season) ? 'rebuild' : 'hopeful';
    else m = 'tank';
    // multi-season plans: a rebuild runs 2-3 seasons and a tank 1-2 (a big market tanks for 1 season at most), unless the team is clearly good
    const plan = t.plan && t.plan.until >= L.season && t.id !== L.user ? t.plan : null;
    if (plan && b >= 3) m = (plan.k === 'tank' || (young < 3 && r > n - B(5))) && b >= 4 ? 'tank' : 'rebuild';   /* v26.5 review: a rebuild with no young core in the bottom 4 bottoms out; v26.6 review: bottom 5 */   // v22: a plan only holds while the team is in the bottom half
    if (plan && b <= 2) t.plan = null;                                           // a winning rebuild ends early
    // midseason: only change on a clear miss (two bands away, or more than 3 ranks outside the current band)
    if (prev && STATUS_MODE[prev] && !(plan && b <= 2)) {   /* v22: preseason too: keep last season's status unless clearly out of line */ const pb = { allin: 0, contend: 1, push: 2, hopeful: 2, rising: 2, retool: 2, rebuild: 3, tank: 4 }[prev]; const edge = [0, B(4), B(8), B(16), B(24), n]; const lo = edge[pb] + 1, hi = edge[pb + 1]; if (Math.abs(b - pb) < 2 && r >= lo - 3 && r <= hi + 3) m = prev; }
    // v26.5: blended statuses: weighted random picks on band edges (Rising, Rebuild, Hopeful, Tank), shifted by front-office personality, owner trust and record
    { const bl = t.id === L.user ? null : blendStatus(L, t, { r, b, n, B, young, prev, m, live, plan, ridx, starPush, gp: gp[tid] });
      if (bl) { m = bl.m; if (bl.hold) holdMap[tid] = true; if (bl.why) whyMap[tid] = bl.why; if (bl.endPlan) t.plan = null; } }
    // v24.1: a rebuilding team that has climbed into the top half: with a young core (3+) it holds and keeps its veterans, otherwise it becomes a buyer (the band above)
    if (live && (prev === 'rebuild' || prev === 'tank') && b <= 2 && m !== 'rebuild' && m !== 'tank' && young >= 3 && t.id !== L.user) { m = 'rebuild'; holdMap[tid] = true; }
    if (prev && m !== prev && t.stLeft && t.stLeft.s === L.season && m === t.stLeft.st && t.id !== L.user) m = prev;   // v26.5: no flip-flops (never back to a status it left earlier this season)
    // v27 L3: an aging star (32+, 82+ or a franchise face) with a weak cast: the team buys around him; a tank lasts one season at most while he's there
    if (t.id !== L.user) { const os = ps.find(p => p.age >= 32 && !(p.injLong && p.injury > 40) && (p.ovr >= 82 || (p.ovr >= 74 && iconTier(L, p, t.id) >= 1)));
      if (os) { const cast = ps.slice(1, 8), ca = cast.reduce((a, p) => a + p.ovr, 0) / Math.max(1, cast.length), weak = ca < (L.lgOvr || 60) - 1;
        if (m === 'tank' && t.tankedS === L.season - 1) { m = 'hopeful'; whyMap[tid] = 'oldstar'; }
        else if (weak && (m === 'rebuild' || m === 'retool' || (m === 'tank' && b <= 3)) && !(t.plan && t.plan.k === 'tank' && t.plan.until >= L.season && b >= 4)) { m = b <= 2 ? 'push' : 'hopeful'; whyMap[tid] = 'oldstar'; if (t.plan) t.plan = null; } } }
    if (m === 'tank' && t.owner && t.owner.trust != null && t.owner.trust < 25) m = 'rebuild';   // an owner on the edge won't sit through a tank
    if (m === 'tank' && t.market === 3 && t.tankedS === L.season - 1) m = 'rebuild';                                // big markets tank one season at most
    if (m === 'tank' && (t.lowRun || 0) >= 3 && t.id !== L.user) m = 'rebuild';   // v26.5 review: no tanking in a 4th straight low season
    want[tid] = m;
  }
  // at most 20% of the league tanks: the best of the would-be tankers rebuild instead
  const tankers = order.filter(id => want[id] === 'tank');
  for (const id of tankers.slice(0, Math.max(0, tankers.length - tankMax))) want[id] = 'rebuild';
  // v26.5: at most RISING_MAX of 30 teams are Rising (the lowest-ranked extras go back to Rebuild, or Hopeful in the top half)
  { const ris = order.filter(id => want[id] === 'rising'), cap = Math.max(1, Math.round(n * RISING_MAX / 30));
    for (const id of ris.slice(cap)) { want[id] = rank[id] > B(16) ? 'rebuild' : 'hopeful'; delete whyMap[id]; } }
  order.forEach(tid => {
    const t = L.teams[tid], old = t.status || t.mode; let m = want[tid];
    if (old && m !== old && t.stLeft && t.stLeft.s === L.season && m === t.stLeft.st && t.id !== L.user) m = old;   // v26.6 review: the no-return rule again after the tank / Rising caps
    const wasHold = t.hold; t.hold = !!holdMap[tid] && m === 'rebuild';
    if (t.hold && !wasHold && label !== 'Preseason') logNews(L, `${t.city} ${t.name} are in the race but hold their young core and keep their veterans`, tid, 'league');
    if (old && old !== m && !t.hold && (m === 'hopeful' || m === 'push') && (old === 'rebuild' || old === 'tank') && label !== 'Preseason') logNews(L, `${t.city} ${t.name} are in the race and will buy at the deadline`, tid, 'league');
    if (m === 'rebuild' || m === 'tank') t.lowS = L.season;   // v24.2: last season this team was rebuilding or tanking (young-core deals)
    t.status = m; t.mode = STATUS_MODE[m]; t.pwRank = rank[tid];
    if (m === 'tank') t.tankedS = L.season;
    if ((m === 'rebuild' || m === 'tank') && !(t.plan && t.plan.until >= L.season && t.plan.k === m)) t.plan = { k: m, until: L.season + (m === 'tank' ? (t.market === 3 ? 0 : 1) : planYears(L, t)) };   // v26.5: rebuild length by front-office patience
    if (m !== 'rebuild' && m !== 'tank') t.plan = null;
    if (m === 'rising' && old !== 'rising') t.risingS = L.season;
    if (old && old !== m && label !== 'Preseason') logNews(L, `${t.city} ${t.name} are now ${STATUS_LABEL[m].toLowerCase()} (${label} review)`, tid, 'league');
    if (old !== m || whyMap[tid]) { if (old && old !== m) t.stLeft = { s: L.season, st: old, r: ridx }; statusNews(L, t, old, m, whyMap[tid] || (old === 'rising' && STATUS_MODE[m] === 'contend' ? 'grewUp' : null), label); }   // v26.5
  });
  L.modeCheck = label;
  try { youthPlan(L); } catch (e) { }   // v26.5: status sets minutes right away
  if (label === 'Preseason') { setExpectations(L); updatePowerRankings(L); setOwnerGoals(L); }
  refreshTradeStatus(L);
}

// ---------- Trade valuation ----------
const baseV = o => Math.pow(3, (o - 50) / 10);
// v32a: a signed extension (p.ext, starts next season) counts: years left = this deal + the extension years (a 4-year extension on an expiring deal = 5)
function contractEnd(p) { return p.contract ? p.contract.exp + (p.ext ? p.ext.yrs : 0) : null; }
function yrsLeft(L, p, cs) { return p.contract ? Math.max(0, contractEnd(p) - (cs == null ? capSeason(L) : cs) + 1) : 0; }
// v24.3: how much an AI team marks a player down for injury risk (0 to 0.35): a current layoff, serious injuries in his history, the injury-prone label, and his hidden proneness tier as far as it has been revealed in the league
// v24.4: what anyone can see of his injury history: major (25+ game) injuries and games missed in the last 3 seasons
// v24.5.1: games he still has to miss, counting the summer's healing when it is still ahead (offseason)
function layoffAhead(L, p) { return !(p.injury > 0) ? 0 : /^off/.test(L.phase) ? Math.max(0, p.injury - (p.injSE ? SE_SUMMER : 28)) : p.injury; }
function injHistory(L, p) { const S = L.season, r = (p.injuries || []).filter(x => x.s >= S - 2); return { majors: r.filter(x => x.games >= 25).length, mids: r.filter(x => x.games >= 15 && x.games < 25).length, missed: r.reduce((a, x) => a + (x.games || 0), 0) }; }   // v24.5: 15-24 game injuries count too
// v24.4: a physical before a trade or signing moves the injury-proneness read forward one season (for that deal only)
function physicalRead(p) { return iptText(p, traitLevel(p, 'ipt', 1)); }
function injDiscount(L, t, p) {
  let d = 0;
  if (p.injury > 0) { const inSeason = ['regular', 'regular-done', 'playoffs'].includes(L.phase), sumH = inSeason || /^off/.test(L.phase) ? (p.injSE ? SE_SUMMER : 28) : 0;   // v24.5.1: the summer's healing still to come
    const inj = inSeason ? p.injury : Math.max(0, p.injury - sumH), rem = L.phase === 'regular' ? Math.max(1, SEASON_GAMES - (t.w + t.l)) : SEASON_GAMES, nxt = inSeason ? Math.max(0, p.injury - rem - sumH) : Math.max(0, inj - rem);
    if (inj >= 5) d += clamp(inj / rem, 0, 1) * (p.injSevere ? 0.3 : 0.2); if (nxt > 0) d += clamp(nxt / SEASON_GAMES, 0, 1) * 0.2; }   // v24.5: a layoff that runs into next season
  // v24.4: the larger of what his history shows (major injuries and games missed, last 3 seasons) and the read of his hidden tier after a physical
  const h = injHistory(L, p), histRead = Math.min(0.16, 0.05 * h.majors + 0.025 * h.mids + 0.0006 * h.missed);
  const traitRead = p.ipt != null ? [-0.02, 0, 0.07, 0.14][p.ipt] * traitFrac(p, 'ipt', 1) : 0;
  d += histRead > 0 ? Math.max(histRead, traitRead) : traitRead;
  if (p.prone != null && p.prone >= L.season - 1) d += 0.07;
  if (t.mode === 'contend') d *= 1.3;
  return clamp(d, 0, 0.35);
}
function playerTV(L, t, p, giving) {
  const sp = p.scout != null ? p.scout : p.pot;
  // the younger he is, the more of the gap to his potential counts (more time to develop)
  const yw = p.age <= 20 ? 0.6 : p.age <= 21 ? 0.55 : p.age <= 22 ? 0.5 : p.age <= 23 ? 0.45 : p.age <= 24 ? 0.4 : p.age <= 25 ? 0.25 : 0;
  const o = hiddenFor(L, p) ? ovrRead(L, t.id, p) : p.ovr;
  let e = o + (sp - o) * yw - (p.age >= 31 ? (p.age - 30) * 1.5 : 0);
  let v = baseV(e);
  const young = p.age <= 23, vet = p.age >= 28;
  switch (t.mode) {
    case 'tank': if (young) v *= 1.3; if (vet) v *= 0.5; break;
    case 'rebuild': if (young) v *= giving ? 1.45 : 1.25; if (vet && p.ovr < 76) v *= 0.75; if (p.ovr >= 76 && p.age <= 27) v *= 1.2; break;
    case 'hopeful': if (p.age >= 25 && p.age <= 31) v *= 1.1; if (young && p.ovr < 65) v *= 0.85; break;
    case 'contend': if (p.ovr >= 75) v *= 1.3; if (young && p.ovr < 68) v *= 0.7; break;
  }
  if (t.status === 'retool') { if (p.age >= 30) v *= 0.85; if (p.age <= 25) v *= 1.1; }   // v21: getting younger
  if (t.status === 'allin' && p.ovr >= 72 && p.age >= 25) v *= 1.08;                      // v21: help now
  if (t.status === 'rising') { if (young) v *= giving ? 1.3 : 1.15; if (p.age >= 28 && yrsLeft(L, p) >= 2 && !giving) v *= 0.7; }   // v26.5: keeps the kids, no long veteran deals
  const owner = p.team != null ? L.teams[p.team] : null;
  const s = p.stats.rs, mpg = s && s.gp >= 5 ? s.min / s.gp / 60 : null;
  const inRot = owner ? rotationOf(L, owner).slice(0, 8).some(x => x.id === p.id) : false;
  const upside = p.age <= 24 && sp >= 72;
  if (!upside && (!inRot || (mpg != null && mpg < 14))) v *= 0.6; // bench player: about a 2nd-round pick
  if (!giving && !upside) { const r8 = rotationOf(L, t)[7]; if (r8 && p.ovr < r8.ovr && (t.mode === 'contend' || t.mode === 'hopeful')) v *= 0.75; }
  if (!giving) v *= needMult(L, t, p);
  if (p.contract && p.mval) {
    // every remaining year counts (later years a bit less); a player option on the last year gives less control
    let yl = yrsLeft(L, p); if (p.contract.opt === 'PO' && yl > 1) yl -= 0.5;
    let w = 0; for (let i = 0; i < Math.ceil(yl); i++) w += Math.pow(0.85, i) * Math.min(1, yl - i);
    v += (p.mval - p.contract.amt) * w * 0.09;
    // rebuilding teams like expiring money; contenders like controlling good players for years
    if ((t.mode === 'rebuild' || t.mode === 'tank') && yl <= 1 && p.contract.amt >= 5) v *= 1.06;
    if ((t.mode === 'contend' || t.mode === 'hopeful') && p.ovr >= 72 && yl >= 3 && p.age <= 29) v *= 1.08;
  }
  const rem = SEASON_GAMES - (t.w + t.l);
  if (p.injLong && p.injury >= rem && L.phase === 'regular') v *= t.mode === 'contend' ? 0.3 : t.mode === 'hopeful' ? 0.6 : 0.8;
  { const dj = injDiscount(L, t, p); if (dj > 0) v *= 1 - dj * (giving ? 0.5 : 1); }   // v24.3: a buyer is more cautious than the team that owns him
  v = clauseTV(L, t, p, giving, v);   // v26.1: kicker, promise, partial guarantee
  return v * tagTV(L, t, p, giving);   // v26.0: tags (cornerstone premium, overpaid stigma, bargain)
}
// ---------- v25.7 pick value ----------
// Base points per slot on the 30-team scale (1st round 1-30, 2nd round 31-60). 1000 points = trade value 30 (PICK_SCALE),
// about a 22-24 year old ~78 OVR with upside on a fair deal. A 16-team league maps its slots onto this shape (pickPts).
const PICK_PTS = [1000, 900, 820, 750, 690, 500, 485, 470, 455, 440, 425, 410, 395, 380, 300, 287, 275, 262, 249, 237, 224, 211, 199, 186, 173, 161, 148, 135, 123, 110,
  100, 97, 94, 91, 88, 85, 82, 79, 76, 73, 70, 67, 64, 61, 58, 45, 42.5, 40, 37.5, 35, 32.5, 30, 27.5, 25, 22.5, 20, 17.5, 15, 12.5, 10];   // v25.7c: late 1sts slide to 110 so #30 and #31 (100) are close; two early 2nds < a top-100 player
const PICK_SCALE = 0.03;
const PICK_UNC = [1, 0.9, 0.8, 0.74, 0.55, 0.48, 0.42];          // next draft, 2 drafts out, ... (v26.2: 7 drafts; v26.4: 4+ drafts out steeper, was .69/.65/.62)
const PICK_STATUS = { tank: 1.2, rebuild: 1.2, hopeful: 1, contend: 0.85 };   // v25.8 tune: contend 0.8 -> 0.85   // how the team valuing the pick cares about picks
const CLASS_MULT = { loaded: 1.2, elite: 1.15, deep: 1.1, normal: 1, thin: 0.8 };
const PICK_KNOWN = 1.1;                                            // a known slot (after the lottery) is worth a bit more than a projection
const BUNDLE_W = [1, 0.8, 0.6, 0.4];                               // in one package: best asset 100%, then 80, 60, 40% (and 40% after)
function lotSize(L) { return isBig(L) ? 14 : Math.round(L.teams.length * 10 / 16); }
// slot (1..n within its round) -> position on the 30-team scale
function slot30(L, rd, no) {
  const n = L.teams.length; if (n === 30) return no;
  if (rd === 2) return 1 + (no - 1) * 29 / Math.max(1, n - 1);
  const lot = lotSize(L);
  if (no <= 5) return no;
  if (no <= lot) return 6 + (no - 6) * 8 / Math.max(1, lot - 6);
  return 15 + (no - lot - 1) * 15 / Math.max(1, n - lot - 1);
}
function pickPts(L, rd, no) {
  const x = clamp(slot30(L, rd, no), 1, 30), i = Math.floor(x), f = x - i, b = (rd === 2 ? 30 : 0) - 1;
  return i >= 30 ? PICK_PTS[b + 30] : PICK_PTS[b + i] * (1 - f) + PICK_PTS[b + i + 1] * f;
}
// The draft that comes next: this season's until it has been held, then next season's
function nextDraftS(L) { return ['off-resign', 'off-fa', 'off-ready'].includes(L.phase) ? L.season + 1 : L.season; }
function pickDist(L, k) { return clamp(k.s - nextDraftS(L), 0, PICK_UNC.length - 1); }
// Round-1 slot odds by pre-lottery rank (1 = worst), from the game's own lottery rules. Simulated once per league size with a private RNG.
const LOT_M = {};
function lotteryMatrix(L) {
  const n = L.teams.length, key = n + (isBig(L) ? 'b' : 's'); if (LOT_M[key]) return LOT_M[key];
  let s = 12345; const rnd = () => (s = (s * 1103515245 + 12345) % 2147483648) / 2147483648;
  const draw = (ts, os) => { ts = ts.slice(); os = os.slice(); const out = []; while (ts.length) { let tot = os.reduce((a, b) => a + b, 0), r = rnd() * tot, i = 0; for (; i < ts.length - 1; i++) { r -= os[i]; if (r <= 0) break; } out.push(ts[i]); ts.splice(i, 1); os.splice(i, 1); } return out; };
  const M = Array.from({ length: n + 1 }, () => new Array(n + 1).fill(0)), N = 20000, ranks = Array.from({ length: n }, (_, i) => i + 1);
  for (let it = 0; it < N; it++) {
    let order;
    if (isBig(L)) { const lot = ranks.slice(0, 14); order = [...draw(lot, [14, 14, 14, 12.5, 10.5, 9, 7.5, 6, 4.5, 3, 2, 1.5, 1, 0.5]), ...ranks.slice(14)]; }
    else { const lot = lotSize(L), pi = Math.max(0, lot - 6); order = [...draw(ranks.slice(0, 5), [25, 25, 25, 15, 10]), ...ranks.slice(5, 6), ...draw(ranks.slice(6, 6 + pi), ranks.slice(6, 6 + pi).map(() => 25)), ...ranks.slice(6 + pi)]; }
    order.forEach((r, i) => M[r][i + 1]++);
  }
  for (const row of M) for (let j = 0; j < row.length; j++) row[j] /= N;
  return (LOT_M[key] = M);
}
// Projected finish (1 = worst record) for each team in the next draft, and drift for later drafts. Cached per sim day.
let PROJ_C = null;
function projStamp(L) { return L.season + '|' + L.phase + '|' + (L.day || 0) + '|' + (L.faDay || 0) + '|' + L.teams.reduce((a, t) => a + t.w + t.l, 0); }
function projRanks(L) {
  const st = projStamp(L);
  if (TRADE_CTX) {   // v25.8: re-project only the teams in the trade, on their after-trade rosters
    if (PROJ_X && PROJ_X.L === L && PROJ_X.st === st && PROJ_X.key === TRADE_CTX.key) return PROJ_X.v;
    const base = projRanks0(L, st), sides = TRADE_CTX.sides, ov = {};
    onRostersAfter(L, sides, () => { for (const tid of Object.keys(sides)) ov[tid] = projRaw(L, L.teams[tid], base.f < 0.05); });
    const v = projFinish(L, base, ov);
    PROJ_X = { L, st, key: TRADE_CTX.key, v }; return v;
  }
  return projRanks0(L, st);
}
let PROJ_X = null;
function projRaw(L, t, pre) { const top5 = rosterOf(L, t).sort((a, b) => b.ovr - a.ovr).slice(0, 5); return { pw: rosterPower(L, t, pre), age5: top5.reduce((a, p) => a + p.age, 0) / Math.max(1, top5.length) }; }
function projRanks0(L, st) {
  if (PROJ_C && PROJ_C.L === L && PROJ_C.st === st) return PROJ_C.v;
  const n = L.teams.length, nd = nextDraftS(L), cur = nd === L.season && L.phase !== 'off-ready';
  const gp = L.teams.map(t => cur ? t.w + t.l : 0), f = cur ? clamp(gp.reduce((a, b) => a + b, 0) / n / SEASON_GAMES, 0, 1) : 0;
  const raw = L.teams.map(t => projRaw(L, t, f < 0.05));
  const base = { raw, gp, f, cur, nd };
  base.out = projFinish(L, base, {});
  PROJ_C = { L, st, v: base.out }; base.out.base = base; return base.out;
}
// ranks from raw roster power + record; `ov` replaces some teams' raw values (after a trade) and drops their tank/rebuild plan if they got clearly better
function projFinish(L, b, ov) {
  if (b.base) b = b.base;
  const n = L.teams.length, { gp, f, cur, nd } = b;
  const z = arr => { const m = arr.reduce((a, x) => a + x, 0) / n, sd = Math.sqrt(arr.reduce((a, x) => a + (x - m) ** 2, 0) / n) || 1; return arr.map(x => (x - m) / sd); };
  const raw = b.raw.map((r, i) => ov[i] || r);
  const pw = z(raw.map(r => r.pw)), pw0 = z(b.raw.map(r => r.pw));
  const wp = z(L.teams.map((t, i) => gp[i] ? t.w / gp[i] : 0.5)), pd = z(L.teams.map((t, i) => gp[i] ? (t.pf - t.pa) / gp[i] : 0));
  // results count more as the season goes on; at the end of the season the record is the projection
  const sc = L.teams.map((t, i) => (1 - f) * pw[i] + f * (0.7 * wp[i] + 0.3 * pd[i]));
  // later seasons: roster only (the record so far doesn't carry over)
  const scF = pw;
  const rk = arr => { const ord = L.teams.map(t => t.id).sort((a, c) => arr[a] - arr[c]), r = {}; ord.forEach((tid, i) => r[tid] = i + 1); return r; };
  const r0 = rk(sc), rF = rk(scF);
  const sc30 = n / 30, mid = (n + 1) / 2, out = {};
  for (const t of L.teams) {
    const age5 = raw[t.id].age5, better = ov[t.id] && pw[t.id] - pw0[t.id] >= 0.5;   // a team that got clearly better in the trade is no longer on its tank/rebuild path
    const r = [r0[t.id]];
    for (let d = 1; d < PICK_UNC.length; d++) {   // v26.2: up to 6 drafts out
      const inPlan = !better && t.plan && t.plan.until >= nd + d && (t.plan.k === 'tank' || t.plan.k === 'rebuild');
      let drift = 0;
      if (!inPlan && !better && (t.mode === 'tank' || t.mode === 'rebuild')) drift += 1.5 * sc30;   // the plan ends: young teams climb
      if (age5 >= 30) drift -= 2.5 * sc30 * (age5 - 29); else if (age5 <= 24.5 && !inPlan) drift += 1.5 * sc30;
      const reg = inPlan ? 0.9 : [1, 0.85, 0.7, 0.55, 0.45, 0.35, 0.3][d];
      // a team in the trade: next season starts from its new roster only (its record was made with the old one)
      const from = d === 1 && ov[t.id] ? rF[t.id] : r[d - 1];
      r.push(clamp(mid + (from - mid) * reg + drift, 1, n));
    }
    out[t.id] = r;
  }
  return { r: out, f, cur };
}
// Value of a pick in base points, with its likely range. {ev, lo, hi, known, no, mean}
let PP_C = null;
function pickProj(L, k) {
  const st = projStamp(L); if (!PP_C || PP_C.L !== L || PP_C.st !== st) PP_C = { L, st, m: new Map() };
  const ck = TRADE_CTX ? k.id + '#' + TRADE_CTX.key : k.id;   // v25.8: a separate entry while a trade is judged
  const hit = PP_C.m.get(ck); if (hit) return hit;
  let res;
  const o = draftSlotOf(L, k);
  if (o) { res = { ev: pickPts(L, k.rd, o.no) * PICK_KNOWN, lo: o.no, hi: o.no, known: true, no: o.no, mean: o.no }; if (k.prot && k.rd === 1) { const sl = new Array(L.teams.length + 1).fill(0); sl[o.no] = 1; res.slot = sl; } }
  else {
    const n = L.teams.length, d = pickDist(L, k), P = projRanks(L), mu = P.r[k.orig][d], s30 = n / 30;
    const sd = Math.max(0.5, (d === 0 ? (P.cur ? 0.6 + 2.9 * (1 - P.f) : 2.0) : d === 1 ? 3.0 : Math.min(6, 4.2 + 0.5 * (d - 2))) * s30);
    const pr = []; let tot = 0; for (let r = 1; r <= n; r++) { const w = Math.exp(-0.5 * ((r - mu) / sd) ** 2); pr.push(w); tot += w; }
    const M = k.rd === 1 ? lotteryMatrix(L) : null, slot = new Array(n + 1).fill(0);
    for (let r = 1; r <= n; r++) { const pw = pr[r - 1] / tot; if (M) for (let j = 1; j <= n; j++) slot[j] += pw * M[r][j]; else slot[r] += pw; }
    let ev = 0, mean = 0, c = 0, lo = null, hi = null;
    for (let j = 1; j <= n; j++) { ev += slot[j] * pickPts(L, k.rd, j); mean += slot[j] * j; c += slot[j]; if (lo == null && c >= 0.1) lo = j; if (hi == null && c >= 0.9) hi = j; }
    res = { ev, lo: lo || 1, hi: hi || n, known: false, no: null, mean, slot };
  }
  if (k.prot && k.rd === 1 && res.slot) { res.evOpen = res.ev; res.ev = protEv(L, k, res.slot, res.known ? PICK_KNOWN : 1); }   // v25.7 S6
  if (PP_C.m.size > 4000) PP_C.m.clear();
  PP_C.m.set(ck, res); return res;
}
// v25.7 S6 pick protections. A 1st protected top-N (3, 5 or 10 on the 30-team scale) conveys only if it lands outside the protected slots; if it lands inside,
// it stays with its team and the holder gets that team's 1st next year with the same protection (rolled once or twice), then that team's 2nd the year after.
// Value = P(outside) x average value of those slots + P(inside) x 0.9 x the rolled pick (the same recursion, one year further out).
// k.prot is the number of protected slots; the options scale with the league (30 teams: 3, 5, 10; 16 teams: 2, 3, 5)
function protOpts(L) { return [3, 5, 10].map(n => Math.max(1, Math.round(n * L.teams.length / 30))); }
function protN(L, k) { return k.prot; }
function protEv(L, k, slot, known) {
  const n = L.teams.length, N = Math.min(protN(L, k), n), roll = k.roll || 0;
  let pin = 0, out = 0; for (let j = 1; j <= n; j++) { if (j <= N) pin += slot[j]; else out += slot[j] * pickPts(L, 1, j) * known; }
  const nx = roll >= 2 ? { id: k.id + '|n2', s: k.s + 1, rd: 2, orig: k.orig, owner: k.owner } : { id: k.id + '|n' + (roll + 1), s: k.s + 1, rd: 1, orig: k.orig, owner: k.owner, prot: k.prot, roll: roll + 1 };
  return out + pin * 0.9 * pickProj(L, nx).ev;
}
// a pick as it would be once a protection is attached (for valuing a proposed trade); N = 0 leaves it alone
function pickKV(k, N) { return N && k.rd === 1 && !k.prot ? Object.assign({}, k, { prot: N, roll: 0, id: k.id + '|p' + N }) : k; }
function protLabel(k) { return k.prot ? ` (top-${k.prot} prot.)` : ''; }
// AI rule: a rebuilding or tanking team sending its own 1st protects it top-5; a hopeful team sending its next 1st protects it top-10
function aiProt(L, A, k) {
  if (k.rd !== 1 || k.prot || k.orig !== A.id || draftSlotOf(L, k)) return 0;
  { const nx = L.picks.find(x => x.s === k.s + 1 && x.rd === 1 && x.orig === k.orig); if (nx && nx.owner !== k.orig) return 0; }
  if (A.mode === 'rebuild' || A.mode === 'tank') return protOpts(L)[1];
  if (A.mode === 'hopeful' && k.s === nextDraftS(L)) return protOpts(L)[2];
  return 0;
}
// can this protection be attached? only to a 1st with no protection yet, before its slot is known, and the team's next 1st must be there to roll into
function protCheck(L, giver, k, N) {
  if (!N) return null;
  if (!protOpts(L).includes(N)) return `Protection must be ${protOpts(L).map(n => 'top-' + n).join(', ')}`;
  if (k.rd !== 1) return 'Only 1st-round picks can be protected';
  if (k.prot) return `${pickLabel(L, k)} is already protected`;
  if (k.swap) return `${pickLabel(L, k)} is tied to a pick swap`;
  if (draftSlotOf(L, k)) return 'Protections can only be added before the draft order is set';
  const nx = L.picks.find(x => x.s === k.s + 1 && x.rd === 1 && x.orig === k.orig);
  if (nx && nx.owner !== k.orig && nx.owner !== giver) return `${L.teams[k.orig].abbr}'s ${draftLabel(k.s + 1)} 1st belongs to someone else, so ${pickLabel(L, k)} can't be protected`;
  return null;
}
function applyProt(L, give) { if (!give.prot) return; for (const [id, N] of Object.entries(give.prot)) { const k = L.picks.find(x => x.id === id); if (k && N && k.rd === 1 && !k.prot) { k.prot = N; k.roll = 0; } } PP_C = null; }
// at the lottery: protected 1sts that land inside the protected slots stay with their team; the holder gets next year's pick (or the 2nd after two rolls)
function resolveProtections(L, r1order) {
  const S = L.season, find = (rd, orig) => L.picks.find(x => x.s === S + 1 && x.rd === rd && x.orig === orig);
  for (const k of L.picks.filter(x => x.s === S && x.rd === 1 && x.prot)) {
    const slot = r1order.indexOf(k.orig) + 1, prot = k.prot, roll = k.roll || 0, X = k.owner, O = k.orig;
    k.prot = 0; k.roll = 0;
    if (slot > protN(L, { prot })) continue;                     // lands outside the protected slots: conveys as is
    k.owner = O;                                                 // inside: stays with its team
    if (X === O) continue;
    const ok = x => x && (x.owner === O || x.owner === X);
    const lbl = `${L.teams[O].abbr}'s ${yr(S)} 1st (top-${prot} protected) landed at #${slot} and stays with ${L.teams[O].abbr}`;
    let nk = roll >= 2 ? find(2, O) : find(1, O);
    if (!ok(nk) && roll < 2) nk = find(2, O);                    // the next 1st was traded elsewhere: settle for the 2nd
    if (!ok(nk)) { logNews(L, `${lbl}; ${L.teams[X].abbr} get nothing more`, X, 'trade'); continue; }
    nk.owner = X;
    if (nk.rd === 1) { nk.prot = prot; nk.roll = roll + 1; logNews(L, `${lbl}; ${L.teams[X].abbr} get their ${yr(S + 1)} 1st (top-${prot} protected)`, X, 'trade'); }
    else logNews(L, `${lbl}; ${L.teams[X].abbr} get their ${yr(S + 1)} 2nd instead`, X, 'trade');
  }
  PP_C = null;
}
function classMult(L, k) {
  const d = pickDist(L, k), ty = (L.classType || {})[k.s];
  let m = CLASS_MULT[ty] || 1;
  if (k.rd === 1 && hypedClass(L, k.s) && pickProj(L, k).mean <= 5) m *= 1.1;      // a special talent at the top
  m = clamp(m, 0.8, 1.25);
  return 1 + (m - 1) * [1, 0.75, 0.5, 0.3, 0.2, 0.1, 0][d] * (k.rd === 2 ? 0.5 : 1);                 // the further out, the less the class is known; 2nd-rounders feel it half as much
}
// Projected slot (kept for older callers): the expected slot
function projSlot(L, k) { return pickProj(L, k).mean; }
// Range label for the UI: "#4" (known), "Top 3", "#6-11"
function pickRange(L, k) { const p = pickProj(L, k); return p.known ? '#' + p.no : p.lo <= 1 ? 'Top ' + p.hi : p.lo === p.hi ? '~#' + p.lo : '#' + p.lo + '-' + p.hi; }
// Points before the valuing team's view (for the UI tier): base value x class x uncertainty
function pickPtsNow(L, k) { const p = pickProj(L, k); return p.ev * classMult(L, k) * PICK_UNC[pickDist(L, k)]; }
function pickTier(pts) { return pts >= 650 ? 'Franchise' : pts >= 420 ? 'High lottery' : pts >= 300 ? 'Lottery' : pts >= 190 ? 'Mid 1st' : pts >= 60 ? 'Early 2nd' : 'Late 2nd'; }
// v26.4: a tanking or rebuilding team holding its OWN 1st during its plan (or the next 3 drafts) values it ×1.3: that pick is why it is losing.
// (A team only values a pick it already owns when it might give it up, so this is the seller's view.)
const OWN_PREM = 1.3;
function ownPickPrem(L, t, k) {
  if (k.rd !== 1 || k.owner !== t.id || k.orig !== t.id) return 1;
  if (t.status === 'rising') return k.s <= nextDraftS(L) + 2 ? OWN_PREM : 1;   // v26.5: Rising teams keep their near 1sts
  if (!(t.mode === 'tank' || t.mode === 'rebuild')) return 1;
  const until = t.plan && (t.plan.k === 'tank' || t.plan.k === 'rebuild') ? Math.max(t.plan.until, nextDraftS(L) + 2) : nextDraftS(L) + 2;
  return k.s <= until ? OWN_PREM : 1;
}
function pickTV(L, t, k) {
  return pickPtsNow(L, k) * (PICK_STATUS[t.mode] || 1) * PICK_SCALE * ownPickPrem(L, t, k);
}
// v25.7c cash in trades: up to CASH_MAX ($M) sent and CASH_MAX received per team per season (the cap season), counted in that season's profit.
// Value: $1M = CASH_PTS points, outside the bundling discount. Owners cutting costs value cash more and can't send it; rich teams value it less.
const CASH_MAX = 5, CASH_PTS = 6;
function cashSeason(L) { return capSeason(L); }
function cashLog(L, t) { const s = cashSeason(L); if (!t.cashTr || t.cashTr.s !== s) t.cashTr = { s, sent: 0, got: 0 }; return t.cashTr; }
function cashRoom(L, t) { const c = cashLog(L, t); return { send: r1(Math.max(0, CASH_MAX - c.sent)), get: r1(Math.max(0, CASH_MAX - c.got)) }; }
function cashMult(L, t) { return t.owner && t.owner.tight || (t.cash || 0) < 0 ? 1.5 : (t.cash || 0) > 80 ? 0.7 : 1; }
function cashTV(L, t, amt) { return (amt || 0) * CASH_PTS * PICK_SCALE * cashMult(L, t); }
function cashCheck(L, from, to, amt) {
  if (!amt) return null;
  if (amt < 0 || amt > CASH_MAX + 1e-9) return `Cash in a trade must be between $0 and ${money(CASH_MAX)}`;
  if (from.id !== L.user && from.owner && from.owner.tight) return `${from.abbr}'s owner is cutting costs and won't send cash`;
  if (amt > cashRoom(L, from).send + 1e-9) return `${from.abbr} can send only ${money(cashRoom(L, from).send)} more cash this season (limit ${money(CASH_MAX)})`;
  if (amt > cashRoom(L, to).get + 1e-9) return `${to.abbr} can take only ${money(cashRoom(L, to).get)} more cash this season (limit ${money(CASH_MAX)})`;
  return null;
}
function moveCash(L, from, to, amt) {
  if (!(amt > 0)) return;
  const a = cashLog(L, from), b = cashLog(L, to); a.sent = r1(a.sent + amt); b.got = r1(b.got + amt);
}
// v25.7 bundling: one great asset beats several okay ones. Positive values sorted high to low get 100/80/60/40%; burdens (negative) count in full.
function bundleSum(vals) {
  const pos = vals.filter(v => v > 0).sort((a, b) => b - a), neg = vals.filter(v => v <= 0);
  return pos.reduce((a, v, i) => a + v * BUNDLE_W[Math.min(i, BUNDLE_W.length - 1)], 0) + neg.reduce((a, v) => a + v, 0);
}
function assetsValue(L, t, give, giving) {
  const vals = [];
  for (const id of give.players) vals.push(playerTV(L, t, L.players[id], giving));
  for (const pk of give.picks) vals.push(pickTV(L, t, pickKV(L.picks.find(k => k.id === pk), give.prot && give.prot[pk])));   // v25.7 S6: a protection being added counts
  return bundleSum(vals) + cashTV(L, t, give.cash) + swapTV(L, t, give.swaps);   // v26.2: swap rights
}
// ---------- v25.8 picks valued on the roster after the trade, and deal variance ----------
// While a trade is being judged, TRADE_CTX holds the roster moves. projRanks re-projects only the teams whose rosters change,
// so a tanking team that adds a star sees its own picks drop (and a team selling its star sees its own picks rise).
let TRADE_CTX = null;
function tradeSides(a, b, aGive, bGive) { return { [a]: { out: aGive.players || [], in: bGive.players || [] }, [b]: { out: bGive.players || [], in: aGive.players || [] } }; }
function sides3to(L, teams, moves) { const S = sides3(L, teams, moves), o = {}; for (const t of teams) o[t] = { out: S[t].give.players || [], in: S[t].get.players || [] }; return o; }
function ctxKey(sides) { return Object.keys(sides).sort().map(t => t + ':' + sides[t].out.slice().sort().join(',') + '>' + sides[t].in.slice().sort().join(',')).join('|'); }
function withCtx(sides, fn) {
  const real = Object.values(sides).some(s => s.out.length || s.in.length);
  const prev = TRADE_CTX; TRADE_CTX = real ? { sides, key: ctxKey(sides) } : null;
  try { return fn(); } finally { TRADE_CTX = prev; }
}
// run fn with the listed teams' rosters swapped to their after-trade rosters (restored after)
function onRostersAfter(L, sides, fn) {
  const saved = [];
  for (const [tid, s] of Object.entries(sides)) { const t = L.teams[tid], out = new Set(s.out); saved.push([t, t.roster]); t.roster = [...t.roster.filter(id => !out.has(id)), ...s.in.filter(id => L.players[id])]; }
  try { return fn(); } finally { for (const [t, r] of saved) t.roster = r; }
}
// v25.8 front-office style (fixed per team, from a hash so it never uses the game's RNG): how much they love picks, and how much they believe a trade changes a team
const FO_STYLE = { picks: { label: 'Loves picks', pick: 1.15 }, neutral: { label: 'Balanced', pick: 1 }, win: { label: 'Win-now', pick: 0.9 } };
function foOf(L, t) {
  if (!t.fo) { const h = flHash('fo|' + t.id + '|' + t.abbr + '|' + (L.startSeason || L.season)); const u = (h % 1000) / 1000, v = ((h >>> 10) % 1000) / 1000; t.fo = { style: u < 0.3 ? 'picks' : u < 0.75 ? 'neutral' : 'win', belief: r1(0.5 + v * 0.5) }; }
  if (t.fo.pat == null) foPersona(L, t);   // v26.5: patience and ambition (old saves get one here)
  if (t.gm && t.id !== L.user) { gmFill(L, t.gm, t); t.fo = t.gm.fo; }   // v27 S2: the front office is its GM
  return t.fo;
}
function foPickMult(L, t) { return (FO_STYLE[foOf(L, t).style] || FO_STYLE.neutral).pick; }
// deal noise: +/-8%, the same for a pair of teams for a week (asking again doesn't change the answer)
function dealNoise(L, a, b) { const wk = L.phase === 'regular' ? Math.floor((L.day || 0) / 7) : 900 + Math.floor((L.faDay || 0) / 7); const h = flHash('dn|' + L.season + '|' + wk + '|' + Math.min(a, b) + '|' + Math.max(a, b) + '|' + a); return 0.92 + (h % 1601) / 10000; }
// a team's leverage on a player it gives up: lower when he asked out, has 1 year left, or is 30+ on a rebuilding team
function sellLeverage(L, t, p) {
  const notes = []; let m = 1;
  if (p.tradeReq === L.season || (p.morale != null && p.morale < 30)) { m *= p.tradeReq === L.season ? 0.7 : 0.8; notes.push(fl(p.tradeReq === L.season ? 'deal.why.asked' : 'deal.why.unhappy', { name: p.name, team: t.abbr }, p.id * 7 + L.season)); }   // v25.8 tune: asked out 0.8 -> 0.7
  const yl = p.contract ? p.contract.exp - capSeason(L) + 1 : 0;
  if (yl <= 1 && p.ovr >= 70) { m *= 0.85; notes.push(fl(yl <= 0 ? 'deal.why.expiring' : 'deal.why.oneYear', { name: p.name, team: t.abbr }, p.id * 7 + L.season + 1)); }
  if (p.age >= 30 && (t.mode === 'rebuild' || t.mode === 'tank')) { m *= 0.88; notes.push(fl('deal.why.timeline', { name: p.name, team: t.abbr }, p.id * 7 + L.season + 2)); }
  return { m: Math.max(0.6, m), notes };
}
// How team t sees one side of a deal, with the after-trade pick projection blended by its belief, its pick taste, and its leverage on players it gives.
// Returns { v, notes }. giving = true for what t sends.
function sideValue(L, t, give, giving, sides, opts) {
  opts = opts || {};
  const vals = [], notes = [], w = opts.plain ? 1 : foOf(L, t).belief, pm = opts.plain ? 1 : foPickMult(L, t);
  for (const id of give.players) {
    let v = playerTV(L, t, L.players[id], giving);
    if (giving && !opts.plain && v > 0) { const lv = sellLeverage(L, t, L.players[id]); v *= lv.m; notes.push(...lv.notes); }
    vals.push(v);
  }
  for (const pk of give.picks) {
    const k = pickKV(L.picks.find(x => x.id === pk), give.prot && give.prot[pk]);
    const base = pickTV(L, t, k), aft = sides ? withCtx(sides, () => pickTV(L, t, k)) : base;
    vals.push((base + w * (aft - base)) * pm);
  }
  return { v: bundleSum(vals) + cashTV(L, t, give.cash) + swapTV(L, t, give.swaps), notes };   // v26.2: swap rights
}
// Full view of a 2-team deal for team t (who gets `get` and sends `give` with `other`): gain, loss, and why
function dealView(L, t, other, get, give, sides, opts) {
  const g = sideValue(L, t, get, false, sides, opts), l = sideValue(L, t, give, true, sides, opts);
  const nz = opts && opts.plain ? 1 : dealNoise(L, t.id, other);
  const notes = [...l.notes], st = foOf(L, t).style, plain = opts && opts.plain;
  // v25.8 tune: the front-office note only when it explains the deal (pick lovers getting picks; win-now teams paying picks for players, not while rebuilding)
  if (!plain && st === 'picks' && get.picks.length) notes.push(fl('deal.why.picks', { team: t.abbr }, t.id * 7 + L.season));
  if (!plain && st === 'win' && give.picks.length && get.players.length && t.mode !== 'rebuild' && t.mode !== 'tank') notes.push(fl('deal.why.winNow', { team: t.abbr }, t.id * 7 + L.season));
  return { gain: g.v * nz, loss: l.v, notes };
}
// Gate for AI-made deals: re-check each AI side with picks valued after the trade. Only runs when a pick of a team whose roster changes is moving.
// v25.8 S1b counters (per run; harnesses read DEAL_CNT and reset it): gate checks / blocks, deals built with the new view, 80+ stars moved for 2+ firsts
const DEAL_CNT = { chk: 0, blocked: 0, view: 0, star2: 0 };
const GATE_NO = new Map();   // v25.8 tune: deals the gate blocked this week (not saved)
function countDeal(L, tr) {
  if (tr.nv) DEAL_CNT.view++;
  for (const [pl, o] of [[tr.aGive, tr.bGive], [tr.bGive, tr.aGive]]) if (pl.players.some(id => L.players[id] && L.players[id].ovr >= 80) && o.picks.filter(id => { const k = L.picks.find(x => x.id === id); return k && k.rd === 1; }).length >= 2) DEAL_CNT.star2++;
}
// v25.8 S1b: build/adjust an AI deal with the after-trade view. A (the buyer) must come out ahead; if the seller B isn't satisfied, add more of A's picks (up to 4 assets).
// extra = A's spare picks [{ id, prot }] best first. Returns true when both sides pass (B only checked when it is an AI team).
function fitNewView(L, A, B, aGive, bGive, extra) {
  for (let i = 0; ; i++) {
    const sides = tradeSides(A.id, B.id, aGive, bGive), vA = dealView(L, A, B.id, bGive, aGive, sides);
    if (vA.gain < vA.loss * 1.03) return false;
    if (B.id === L.user) return true;
    const vB = dealView(L, B, A.id, aGive, bGive, sides);
    if (vB.gain >= vB.loss * 1.05) return true;
    if (i >= extra.length || aGive.players.length + aGive.picks.length >= 4) return false;
    aGive.picks.push(extra[i].id); if (extra[i].prot) (aGive.prot = aGive.prot || {})[extra[i].id] = extra[i].prot;
  }
}
// v25.8 S2: add the reasons behind an AI deal (asked out, year left, front-office taste) to its text
function addWhy(L, tr) {
  if (!tr || tr.three || tr.whyDone) return; tr.whyDone = true;
  const sides = tradeSides(tr.a, tr.b, tr.aGive, tr.bGive), ns = [];
  for (const [me, op, get, give] of [[tr.a, tr.b, tr.bGive, tr.aGive], [tr.b, tr.a, tr.aGive, tr.bGive]]) {
    if (me === L.user) continue;
    for (const n of dealView(L, L.teams[me], op, get, give, sides).notes) if (!ns.includes(n)) ns.push(n);
  }
  ns.splice(2);   // v25.8 tune: at most 2 reasons
  if (ns.length) tr.why = (tr.why ? tr.why.replace(/\s*$/, ' ') : '') + ns.map(n => n[0].toUpperCase() + n.slice(1)).join('; ') + '.';
}
function afterTradeOK(L, tr) {
  if (!tr || tr.three) return true;
  if (!risingOK(L, L.teams[tr.a], tr.aGive, tr.bGive) || !risingOK(L, L.teams[tr.b], tr.bGive, tr.aGive)) { DEAL_CNT.rising = (DEAL_CNT.rising || 0) + 1; return false; }   // v26.5
  { // v26.4: safety net for AI-built deals that skip tradeCheck (draft-day trade-ups): Stepien rule and swap-tied picks
    const ids = [...tr.aGive.picks, ...tr.bGive.picks]; if (ids.some(id => { const k = L.picks.find(x => x.id === id); return k && k.swap; })) return false;
    if (ids.length) { const mv = {}; tr.aGive.picks.forEach(id => mv[id] = tr.b); tr.bGive.picks.forEach(id => mv[id] = tr.a); if (stepienCheck(L, mv, [tr.a, tr.b])) return false; } }
  const sides = tradeSides(tr.a, tr.b, tr.aGive, tr.bGive), ids = [...tr.aGive.picks, ...tr.bGive.picks];
  const moved = ids.some(id => { const k = L.picks.find(x => x.id === id); return k && sides[k.orig] && (sides[k.orig].out.length || sides[k.orig].in.length); });
  if (!moved) return true;
  // v25.8 tune: a deal the gate blocked stays blocked for the week (deal noise is weekly), so generators that rebuild the same deal don't re-check it
  const wk = L.phase === 'regular' ? Math.floor((L.day || 0) / 7) : L.phase + Math.floor((L.faDay || 0) / 7);
  const key = L.season + '|' + wk + '|' + tr.a + ':' + tr.aGive.players.join(',') + '/' + tr.aGive.picks.join(',') + '|' + tr.b + ':' + tr.bGive.players.join(',') + '/' + tr.bGive.picks.join(',');
  if (GATE_NO.has(key)) { DEAL_CNT.memo = (DEAL_CNT.memo || 0) + 1; return false; }
  DEAL_CNT.chk++;
  for (const [me, op, get, give] of [[tr.a, tr.b, tr.bGive, tr.aGive], [tr.b, tr.a, tr.aGive, tr.bGive]]) {
    if (me === L.user) continue;
    const v = dealView(L, L.teams[me], op, get, give, sides); if (v.gain < v.loss) { if (v.gain >= v.loss * 0.85) try { noteNearDeal(L, tr, me); } catch (e) { }   /* v26.6 R3 */ DEAL_CNT.blocked++; if (GATE_NO.size > 400) GATE_NO.clear(); GATE_NO.set(key, 1); return false; }
  }
  return true;
}
function rosterBounds(L) { return L.phase === 'regular' ? [13, 15] : [8, 17]; }
// Trade salary rules. Under the cap after the deal: anything goes. Over the cap: take back up to 125% of outgoing salary
// (or use your cap room). Over the tax line, or within $5M of the hard cap: money must match (+$0.5M). Never past $170M.
function salaryBand(T, pay, after, out, inn) {
  if (after <= pay + 1e-6 || after <= CAP + 1e-6) return null;
  if (after > APRON + 1e-6) return `${T.abbr} would go over the ${money(APRON)} hard cap (${money(after)})`;
  if (after > TAXLINE + 1e-6 || after > APRON - 5) { if (inn > out + 0.5 + 1e-6) return `${T.abbr} are over the tax line: salaries must match (taking ${money(inn)} for ${money(out)})`; return null; }
  if (inn > Math.max(out * 1.25 + 0.1, out + Math.max(0, CAP - pay)) + 1e-6) return `${T.abbr} are over the cap: they can take back at most 125% of outgoing salary (${money(out * 1.25 + 0.1)})`;
  return null;
}
function tradeRestricted(L, p) {
  const r = p.noTrade; if (!r) return false;
  if (L.season < r.s) return true;
  if (L.season > r.s || L.phase !== 'regular') return false;
  return L.day < (r.day < 0 ? tradeOpenDay(L) : r.day);
}
function tradeCheck(L, a, b, aGive, bGive) {
  const A = L.teams[a], B = L.teams[b];
  if (a !== L.user && b !== L.user && isRivalry(L, a, b) && hrand(a * 100 + b, L.season * 1000 + (L.day || 0), 91) > 0.02) return 'Rival teams avoid trading with each other';   // v24.3: AI teams that are conference, playoff or arch rivals
  { const ce = cashCheck(L, A, B, aGive.cash) || cashCheck(L, B, A, bGive.cash); if (ce) return ce; }   // v25.7c
  { // v26.2: picks tied to a swap can't move; swap rights must be valid; the Stepien rule
    const ids = [...aGive.picks, ...bGive.picks];
    for (const id of ids) { const k = L.picks.find(x => x.id === id); if (k && k.swap) return `${pickLabel(L, k)} is tied to a pick swap`; }
    for (const [g, who, to] of [[aGive, a, b], [bGive, b, a]]) for (const sw of g.swaps || []) { if (sw.g !== who || sw.r !== to) return 'A pick swap is on the wrong side of the deal'; const e = swapCheck(L, sw, ids); if (e) return e; }
    if (ids.length) { const mv = {}; aGive.picks.forEach(id => mv[id] = b); bGive.picks.forEach(id => mv[id] = a); const st = stepienCheck(L, mv, [a, b]); if (st) return st; }
  }
  for (const [g, who] of [[aGive, a], [bGive, b]]) if (g.prot) for (const [id, N] of Object.entries(g.prot)) { const k = L.picks.find(x => x.id === id); if (!g.picks.includes(id) || !k) return 'A protection is on a pick that is not in the deal'; const pe = protCheck(L, who, k, N); if (pe) return pe; }   // v25.7 S6
  const rp = [...aGive.players, ...bGive.players].map(id => L.players[id]).find(p => tradeRestricted(L, p));
  if (rp) return `${rp.name} signed as a free agent and can't be traded yet`;
  for (const [ids, dest] of [[aGive.players, b], [bGive.players, a]]) for (const id of ids) { const p = L.players[id]; if (p.contract && p.contract.ntc && !ntcConsent(L, p, dest)) return `${p.name} has a no-trade clause and won't approve a move to ${L.teams[dest].abbr}`; }
  const [lo, hi] = rosterBounds(L);
  const aN = A.roster.length - aGive.players.length + bGive.players.length;
  const bN = B.roster.length - bGive.players.length + aGive.players.length;
  // v24.2: AI teams may dip up to 2 under the minimum (a minimum free agent is signed the same day) and may end a deal over 15 if they can waive enough minimum-contract players to get back to 15. Your own roster may go over: a release prompt opens until you cut.
  const slack = t => t.id === L.user ? 0 : 2;
  if (aN < lo - slack(A) || bN < lo - slack(B)) return `Roster would drop below ${lo} players`;
  for (const [T, n, give] of [[A, aN, aGive], [B, bN, bGive]]) if (T.id !== L.user) { const ex = n - Math.max(15, T.roster.length); if (ex > 0 && waivable(L, T, give.players).length < ex) return 'Roster would go over 15 players'; }
  const cs = capSeason(L);
  const hitTo = (ids, tid) => ids.reduce((s, id) => s + inHit(L, L.players[id], tid, cs), 0);   // v33d: scheduled amount, pending extension, trade kicker
  const aOut = aGive.players.reduce((s, id) => s + capHit(L, L.players[id], cs), 0), bOut = bGive.players.reduce((s, id) => s + capHit(L, L.players[id], cs), 0);
  const aPay = payroll(L, A, cs), bPay = payroll(L, B, cs);
  const wd = (T, n, give) => T.id === L.user ? 0 : waiveDead(L, T, give.players, n - Math.max(15, T.roster.length));   // dead money from cutting non-minimum players to get back to 15
  const aNew = aPay - aOut + hitTo(bGive.players, a) + wd(A, aN, aGive), bNew = bPay - bOut + hitTo(aGive.players, b) + wd(B, bN, bGive);
  for (const [T, pay, nw] of [[A, aPay, aNew], [B, bPay, bNew]]) if (T.id !== L.user && T.owner && T.owner.tight && nw > pay + 0.5 && nw > T.owner.limit) return `${T.abbr}'s owner is cutting costs and won't add payroll`;
  const band = salaryBand(A, aPay, aNew, aOut, hitTo(bGive.players, a)) || salaryBand(B, bPay, bNew, bOut, hitTo(aGive.players, b)); if (band) return band;
  // v32h: an AI team doesn't take on salary that leaves next season's committed payroll over the hard cap (it would have to shed it)
  const nx = cs + 1, nHit = (ids, tid) => ids.reduce((x, id) => x + (tid == null ? capHit(L, L.players[id], nx) : inHit(L, L.players[id], tid, nx)), 0);
  for (const [T, inn, out] of [[A, bGive.players, aGive.players], [B, aGive.players, bGive.players]]) {
    if (T.id === L.user) continue;
    const before = payNoFloor(L, T, nx), after = before + nHit(inn, T.id) - nHit(out);
    if (after > APRON + 1e-6 && after > before + 0.5) return `${T.abbr} would be over the ${money(APRON)} hard cap next season (${money(after)})`;
  }
  return null;
}
const TRADE_OPEN = 0.25, TRADE_CLOSE = 0.7;
function tradeOpenDay(L) { return Math.floor(totalDays(L) * TRADE_OPEN); }
function deadlineDay(L) { return Math.floor(totalDays(L) * TRADE_CLOSE); }
function inTradeWindow(L) {
  if (L.phase === 'regular') return L.day >= tradeOpenDay(L) && L.day < deadlineDay(L);
  return ['off-review', 'off-lottery', 'off-draft', 'off-resign', 'off-fa', 'off-ready'].includes(L.phase);
}
function describe(L, give) {
  return [...give.players.map(id => L.players[id].name), ...give.picks.map(pk => pickLabel(L, pickKV(L.picks.find(k => k.id === pk), give.prot && give.prot[pk]))), ...(give.cash > 0 ? [money(give.cash) + ' cash'] : []), ...(give.swaps || []).map(sw => `the right to swap ${yr(sw.s)} 1sts`)].join(', ') || 'nothing';
}
// How each front office saw the deal (their own valuation of what they got vs what they gave), as a letter grade
function tradeGrades(L, a, b, aGive, bGive) {
  const A = L.teams[a], B = L.teams[b];
  const g = (gotV, gaveV) => { const r = gotV / Math.max(0.3, gaveV); return r >= 1.3 ? 'A' : r >= 1.08 ? 'B' : r >= 0.92 ? 'C' : r >= 0.75 ? 'D' : 'F'; };
  const sd = tradeSides(a, b, aGive, bGive), pv = (t, g, giving) => sideValue(L, t, g, giving, sd, { plain: true }).v;   // v25.8: graded on the rosters after the deal
  const aGot = pv(A, bGive, false), aGave = pv(A, aGive, true), bGot = pv(B, aGive, false), bGave = pv(B, bGive, true);
  return { a: g(aGot, aGave), b: g(bGot, bGave), av: [r1(aGot), r1(aGave)], bv: [r1(bGot), r1(bGave)] };
}
function executeTrade(L, tr) {
  const { a, b, aGive, bGive } = tr;
  let grades = null; try { grades = tradeGrades(L, a, b, aGive, bGive); } catch (err) { grades = null; }
  let mvP = null; try { mvP = mvTradePre(L, [{ tid: a, ins: bGive.players, outs: aGive.players, inPicks: bGive.picks.length, wk: tr.wkA || (tr.dump ? 'dump' : null) }, { tid: b, ins: aGive.players, outs: bGive.players, inPicks: aGive.picks.length, wk: tr.wkB || (tr.dump ? 'absorb' : null) }]); } catch (err) { }   // v30c #5
  const move = (ids, to, from) => ids.forEach(id => { const p = L.players[id]; removeFromTeam(L, p); p.team = to; L.teams[to].roster.push(id); p.exT = { tid: from, s: L.season }; famNews(L, p, to); p.tx.push({ s: L.season, t: `Traded from ${L.teams[from].abbr} to ${L.teams[to].abbr}` }); applyKicker(L, p); });
  // v24.2: an AI team that would end over 15 waives its worst minimum-contract players first, so its roster is legal the same day
  for (const [T, give, inN] of [[L.teams[a], aGive.players, bGive.players.length], [L.teams[b], bGive.players, aGive.players.length]]) {
    if (T.id === L.user) continue;
    const ex = T.roster.length - give.length + inN - Math.max(15, T.roster.length);
    if (ex > 0) for (const p of waivable(L, T, give).slice(0, ex)) release(L, p);
  }
  const icons = [...aGive.players.map(id => [id, a]), ...bGive.players.map(id => [id, b])].filter(([id, from]) => iconTier(L, L.players[id], from) >= 1);   // v27 L2
  move(aGive.players, b, a); move(bGive.players, a, b);
  for (const id of aGive.players) assignNumber(L, L.players[id], L.teams[b]); for (const id of bGive.players) assignNumber(L, L.players[id], L.teams[a]);   // v30 review: no two players with one number on a team
  for (const [id, from] of icons) { const p = L.players[id], T = L.teams[from], v = { name: p.name, team: T.name, city: T.city };
    hypeBump(T, -6); logNews(L, `${p.name}, ${(iconLabel(L, p, from) || 'face of the franchise').toLowerCase()} of the ${T.name}, has been traded.`, from, 'trade'); addPost(L, 'icon', 'fan', 'upset', v, { tid: from, pid: id, size: 1.6 }); addPost(L, 'icon', 'beat', 'calm', v, { tid: from, pid: id, size: 1.2 });
    if (T.owner && T.owner.trust != null) T.owner.trust = clamp(T.owner.trust - 5, 0, 100); }
  // settled: drop offers that this deal answers (same two teams) or that no longer work
  if (L.offers && L.offers.length) L.offers = L.offers.filter(o => o !== tr && !((o.a === a && o.b === b) || (o.a === b && o.b === a)) && offerValid(L, o));
  moveCash(L, L.teams[a], L.teams[b], aGive.cash); moveCash(L, L.teams[b], L.teams[a], bGive.cash);   // v25.7c
  makeSwaps(L, [...(aGive.swaps || []), ...(bGive.swaps || [])]);   // v26.2
  aGive.picks.forEach(pk => L.picks.find(k => k.id === pk).owner = b);
  bGive.picks.forEach(pk => L.picks.find(k => k.id === pk).owner = a);
  applyProt(L, aGive); applyProt(L, bGive);   // v25.7 S6
  // a traded pick in the draft that's underway moves in the draft order too
  for (const pk of [...aGive.picks, ...bGive.picks]) { const k = L.picks.find(x => x.id === pk); const o = draftSlotOf(L, k); if (o && !o.pid) o.owner = k.owner; }
  // v17: a starter or star traded away, or an unhappy player, holds a grudge against the team that traded him
  for (const [ids, from] of [[aGive.players, a], [bGive.players, b]]) for (const id of ids) { const p = L.players[id]; const top = rotationOf(L, L.teams[from]).slice(0, 5).some(x => x.id === id); if (p.ovr >= 70 || (top && p.ovr >= 62) || (p.morale != null && p.morale < 40)) addGrudge(L, p, from, 'the trade'); frictionRival(L, p, from); }
  { const star = p => p.ovr >= 76 || (p.fame || 0) >= 60; const sa = aGive.players.map(id => L.players[id]).filter(star), sb = bGive.players.map(id => L.players[id]).filter(star); if (sa.length && sb.length) addRival(L, sa[0], sb[0], 'traded for each other'); }   // v18
  // a fresh start: traded players reset their mood and any trade request
  for (const id of [...aGive.players, ...bGive.players]) { const p = L.players[id]; p.morale = Math.max(p.morale || 55, 55); p.tradeReq = null; p.lastTrade = L.season * 1000 + (L.phase === 'regular' ? L.day : 900); }
  for (const [ids, from] of [[aGive.players, a], [bGive.players, b]]) for (const id of ids) { const p = L.players[id]; const yrs = p.hist.filter(h => h.tid === from).length; if (yrs >= 4 && p.ovr >= 72 && L.teams[from].hype != null) { hypeBump(L.teams[from], -5); } }
  const rec = { s: L.season, day: L.phase === 'regular' ? L.day : null, ph: L.phase, when: seasonLabel(L), a, b, aGets: describe(L, bGive), bGets: describe(L, aGive), aIn: { players: bGive.players.slice(), picks: bGive.picks.map(pk => pickLabel(L, L.picks.find(k => k.id === pk))), cash: bGive.cash || 0 }, bIn: { players: aGive.players.slice(), picks: aGive.picks.map(pk => pickLabel(L, L.picks.find(k => k.id === pk))), cash: aGive.cash || 0 } };
  rec.why = tr.why || ''; if (tr.yc) rec.yc = tr.yc; rec.grades = grades; rec.top = Math.max(0, ...[...aGive.players, ...bGive.players].map(id => L.players[id].ovr)); rec.kind = /^swap-/.test(String(tr.id)) ? 'swap' : tr.exp ? 'exp' : tr.dump ? 'dump' : tr.clear ? 'clear' : /^buy-/.test(String(tr.id)) ? 'buy' : /^sat|sign-and-trade/i.test(String(tr.id) + rec.why) ? 'sign-and-trade' : (!aGive.players.length && !bGive.players.length) ? 'picks' : 'trade';
  if (tr.exp || tr.dump || tr.clear) rec.wk = tr.exp ? 'expiring' : tr.clear ? 'clear' : 'dump';   // v36e: 'clear' = hard-cap clear room (capClear)   // v32e: reason key for reports
  try { if (mvP) mvTradePost(L, mvP, rec); } catch (err) { }   // v30c #5
  L.trades.unshift(rec); if (L.trades.length > 200) L.trades.length = 200;
  logNews(L, flL(L, 'news.trade', { a: L.teams[a].abbr, b: L.teams[b].abbr, aGets: rec.aGets, bGets: rec.bGets, grades: grades ? ` (grades: ${L.teams[a].abbr} ${grades.a}, ${L.teams[b].abbr} ${grades.b})` : '' }), a, 'trade');
  try { feedTrade(L, rec, aGive, bGive, grades); } catch (e) { }   // v26.5
}

// ---- v25: three-team trades (you plus two AI teams) ----
// A deal is a list of moves { kind: 'players' | 'picks', id, from, to }. Each team's side is what it sends and what it receives;
// every team must send and receive something. Each AI team judges only its own side, with the same value code as two-team deals.
function sides3(L, teams, moves) {
  const S = {}; for (const t of teams) S[t] = { give: { players: [], picks: [], cash: 0, prot: {} }, get: { players: [], picks: [], cash: 0, prot: {} } };
  for (const m of moves) { if (!S[m.from] || !S[m.to] || m.from === m.to) continue; if (m.kind === 'cash') { S[m.from].give.cash = r1(S[m.from].give.cash + m.amt); S[m.to].get.cash = r1(S[m.to].get.cash + m.amt); continue; } S[m.from].give[m.kind].push(m.id); S[m.to].get[m.kind].push(m.id); if (m.kind === 'picks' && m.prot) { S[m.from].give.prot[m.id] = m.prot; S[m.to].get.prot[m.id] = m.prot; } }
  return S;
}
function tradeCheck3(L, teams, moves) {
  if (new Set(teams).size !== 3) return 'Pick three different teams';
  const S = sides3(L, teams, moves);
  for (const t of teams) { const x = S[t]; if (!x.give.players.length && !x.give.picks.length) return `${L.teams[t].abbr} must send a player or pick`; if (!x.get.players.length && !x.get.picks.length) return `${L.teams[t].abbr} must receive a player or pick`; }
  for (const m of moves) if (m.kind === 'picks' && m.prot) { const k = L.picks.find(x => x.id === m.id), pe = k && protCheck(L, m.from, k, m.prot); if (pe) return pe; }   // v25.7 S6
  for (const m of moves) if (m.kind === 'cash') { const ce = cashCheck(L, L.teams[m.from], L.teams[m.to], m.amt); if (ce) return ce; }
  { const mv = {}; for (const m of moves) if (m.kind === 'picks') { const k = L.picks.find(x => x.id === m.id); if (k && k.swap) return `${pickLabel(L, k)} is tied to a pick swap`; mv[m.id] = m.to; } if (Object.keys(mv).length) { const st = stepienCheck(L, mv, teams); if (st) return st; } }   // v26.2
  for (const t of teams) { const x = S[t]; if (x.give.cash > cashRoom(L, L.teams[t]).send + 1e-9) return `${L.teams[t].abbr} can send only ${money(cashRoom(L, L.teams[t]).send)} more cash this season`; if (x.get.cash > cashRoom(L, L.teams[t]).get + 1e-9) return `${L.teams[t].abbr} can take only ${money(cashRoom(L, L.teams[t]).get)} more cash this season`; }
  for (const m of moves) {
    if (m.kind === 'players') { const p = L.players[m.id]; if (!p || p.team !== m.from) return 'A player is no longer on that team'; if (tradeRestricted(L, p)) return `${p.name} signed as a free agent and can't be traded yet`; if (p.contract && p.contract.ntc && !ntcConsent(L, p, m.to)) return `${p.name} has a no-trade clause and won't approve a move to ${L.teams[m.to].abbr}`; }
    else if (m.kind === 'picks') { const k = L.picks.find(x => x.id === m.id); if (!k || k.owner !== m.from || pickUsed(L, k)) return 'A pick is no longer available'; }
  }
  const [lo] = rosterBounds(L), cs = capSeason(L);
  const hitIn = (ids, tid) => ids.reduce((sum, id) => sum + inHit(L, L.players[id], tid, cs), 0);   // v33d: scheduled amount, pending extension, trade kicker (as tradeCheck)
  for (const t of teams) {
    const T = L.teams[t], x = S[t], n = T.roster.length - x.give.players.length + x.get.players.length;
    if (n < lo - (t === L.user ? 0 : 2)) return `${T.abbr}'s roster would drop below ${lo} players`;
    if (t !== L.user) { const ex = n - Math.max(15, T.roster.length); if (ex > 0 && waivable(L, T, x.give.players).length < ex) return `${T.abbr}'s roster would go over 15 players`; }
    const out = x.give.players.reduce((sum, id) => sum + capHit(L, L.players[id], cs), 0), inn = hitIn(x.get.players, t), pay = payroll(L, T, cs);
    const nw = pay - out + inn + (t === L.user ? 0 : waiveDead(L, T, x.give.players, n - Math.max(15, T.roster.length)));
    if (t !== L.user && T.owner && T.owner.tight && nw > pay + 0.5 && nw > T.owner.limit) return `${T.abbr}'s owner is cutting costs and won't add payroll`;
    const band = salaryBand(T, pay, nw, out, inn); if (band) return band;
    if (t !== L.user) { const nx = cs + 1, before = payNoFloor(L, T, nx), after = before + x.get.players.reduce((a, id) => a + inHit(L, L.players[id], t, nx), 0) - x.give.players.reduce((a, id) => a + capHit(L, L.players[id], nx), 0);   // v33d: next season's hard cap too (as tradeCheck)
      if (after > APRON + 1e-6 && after > before + 0.5) return `${T.abbr} would be over the ${money(APRON)} hard cap next season (${money(after)})`; }
  }
  return null;
}
function evaluateUserTrade3(L, teams, moves) {
  if (!inTradeWindow(L)) return { ok: false, msg: 'Trades are closed right now.' };
  if (teams[0] !== L.user) return { ok: false, msg: 'You must be one of the three teams.' };
  const err = tradeCheck3(L, teams, moves); if (err) return { ok: false, msg: err + '.' };
  const S = sides3(L, teams, moves), verdict = [];
  for (const t of teams.slice(1)) {
    const T = L.teams[t], x = S[t];
    const prot = x.give.players.map(id => L.players[id]).find(p => { const st = tradeStatus(L, p); return st && st.k === 'protect'; });
    if (prot) { verdict.push({ t, ok: false, why: `won't discuss ${prot.name} (protected)` }); continue; }
    { const other = teams[1] === t ? teams[2] : teams[1]; if (isRivalry(L, t, other) && moves.some(m => m.kind === 'players' && ((m.from === t && m.to === other) || (m.from === other && m.to === t)))) { verdict.push({ t, ok: false, why: `won't swap players directly with ${L.teams[other].abbr} (rivals)` }); continue; } }
    const sd = sides3to(L, teams, moves), gain = sideValue(L, T, x.get, false, sd).v * dealNoise(L, t, teams[0]), loss = sideValue(L, T, x.give, true, sd).v, fc = fitCheck(L, T, x.give.players, x.get.players);   // v25.8
    if (fc.worse) { verdict.push({ t, ok: false, why: 'it would leave their rotation lopsided at one position', gain, loss }); continue; }
    verdict.push({ t, ok: gain >= loss * 1.08, why: gain >= loss * 1.08 ? 'accept' : gain >= loss * 0.9 ? 'close, but want a bit more' : 'not close on value', gain, loss });   // a 3-way deal needs a slightly bigger edge than a 2-way one
  }
  const ok = verdict.every(v => v.ok);
  return { ok, verdict, msg: verdict.map(v => `${L.teams[v.t].abbr}: ${v.ok ? 'accept' : v.why}`).join(' · ') + (ok ? '.' : '. All three teams must agree.') };
}
function executeTrade3(L, tr) {
  const { teams, moves } = tr, S = sides3(L, teams, moves);
  const g = (gotV, gaveV) => { const r = gotV / Math.max(0.3, gaveV); return r >= 1.3 ? 'A' : r >= 1.08 ? 'B' : r >= 0.92 ? 'C' : r >= 0.75 ? 'D' : 'F'; };
  let grades = null; try { grades = {}; for (const t of teams) grades[t] = g(assetsValue(L, L.teams[t], S[t].get, false), assetsValue(L, L.teams[t], S[t].give, true)); } catch (e) { grades = null; }
  let mvP = null; try { mvP = mvTradePre(L, teams.map(t => ({ tid: t, ins: S[t].get.players, outs: S[t].give.players, inPicks: S[t].get.picks.length }))); } catch (err) { }   // v30c #5
  const desc = {}; for (const t of teams) desc[t] = describe(L, S[t].get);
  const pickLbl = {}; const lblPicks = () => { for (const m of moves) if (m.kind === 'picks') pickLbl[m.id] = pickLabel(L, L.picks.find(k => k.id === m.id)); }; lblPicks();
  for (const t of teams) { if (t === L.user) continue; const T = L.teams[t], x = S[t], ex = T.roster.length - x.give.players.length + x.get.players.length - Math.max(15, T.roster.length); if (ex > 0) for (const p of waivable(L, T, x.give.players).slice(0, ex)) release(L, p); }
  for (const m of moves) {
    if (m.kind === 'players') { const p = L.players[m.id]; const top = rotationOf(L, L.teams[m.from]).slice(0, 5).some(x => x.id === p.id); removeFromTeam(L, p); p.team = m.to; L.teams[m.to].roster.push(p.id); famNews(L, p, m.to); p.tx.push({ s: L.season, t: `Traded from ${L.teams[m.from].abbr} to ${L.teams[m.to].abbr} (3-team trade)` }); applyKicker(L, p);
      if (p.ovr >= 70 || (top && p.ovr >= 62) || (p.morale != null && p.morale < 40)) addGrudge(L, p, m.from, 'the trade');
      p.morale = Math.max(p.morale || 55, 55); p.tradeReq = null; p.lastTrade = L.season * 1000 + (L.phase === 'regular' ? L.day : 900); }
    else if (m.kind === 'cash') moveCash(L, L.teams[m.from], L.teams[m.to], m.amt);
    else { const k = L.picks.find(x => x.id === m.id); k.owner = m.to; const o = draftSlotOf(L, k); if (o && !o.pid) o.owner = k.owner; if (m.prot) applyProt(L, { prot: { [m.id]: m.prot } }); }
  }
  for (const m of moves) if (m.kind === 'players') assignNumber(L, L.players[m.id], L.teams[m.to]);   // v30 review: unique numbers after the 3-team deal
  if (L.offers && L.offers.length) L.offers = L.offers.filter(o => offerValid(L, o));
  lblPicks();
  const [a, b, c] = teams, inOf = t => ({ players: S[t].get.players.slice(), picks: S[t].get.picks.map(id => pickLbl[id]), cash: S[t].get.cash || 0 });
  const rec = { s: L.season, day: L.phase === 'regular' ? L.day : null, ph: L.phase, when: seasonLabel(L), multi: true, a, b, c, aGets: desc[a], bGets: desc[b], cGets: desc[c], aIn: inOf(a), bIn: inOf(b), cIn: inOf(c),
    why: '3-team trade', grades: grades ? { a: grades[a], b: grades[b], c: grades[c] } : null, top: Math.max(0, ...moves.filter(m => m.kind === 'players').map(m => L.players[m.id].ovr)), kind: 'multi' };
  try { if (mvP) mvTradePost(L, mvP, rec); } catch (err) { }   // v30c #5
  L.trades.unshift(rec); if (L.trades.length > 200) L.trades.length = 200;
  logNews(L, `3-team trade: ${teams.map(t => `${L.teams[t].abbr} get ${desc[t]}`).join('; ')}${grades ? ` (grades: ${teams.map(t => `${L.teams[t].abbr} ${grades[t]}`).join(', ')})` : ''}`, a, 'trade');
  return rec;
}

// ---- Roster fit: judge a trade on the roster a team would have afterwards ----
function rosterAfter(L, t, outIds, inIds) {
  const out = new Set(outIds || []);
  return [...t.roster.filter(id => !out.has(id)), ...(inIds || [])].map(id => L.players[id]);
}
function rotationFrom(L, t, ps) {
  const rem = SEASON_GAMES - (t.w + t.l);
  return ps.filter(p => !(p.injLong && p.injury >= rem)).sort((a, b) => playerValue(b, t.coach) - playerValue(a, t.coach)).slice(0, 9);
}
// Best starting five by slot rating plus the next three off the bench
function lineupScore(L, t, ps) {
  const rot = rotationFrom(L, t, ps);
  const pairs = []; for (const p of rot) for (let s = 0; s < 5; s++) pairs.push([slotRating(p, s), p, s]);
  pairs.sort((a, b) => b[0] - a[0]);
  const used = new Set(), slots = [null, null, null, null, null]; let sc = 0;
  for (const [v, p, s] of pairs) { if (slots[s] != null || used.has(p.id)) continue; slots[s] = v; used.add(p.id); sc += v; }
  for (let s = 0; s < 5; s++) if (slots[s] == null) sc += 30;
  const bench = rot.filter(p => !used.has(p.id)).slice(0, 3);
  return sc + bench.reduce((a, p) => a + p.ovr * 0.4, 0);
}
// Positional problems in the top 8: an uncovered spot, or a pile-up (3+ centers, 4+ at any other spot)
function balanceIssues(L, t, ps) {
  const top = rotationFrom(L, t, ps).slice(0, 8);
  const elig = [0, 0, 0, 0, 0], prim = [0, 0, 0, 0, 0];
  for (const p of top) { prim[p.pos]++; elig[p.pos]++; if (p.pos2 != null) elig[p.pos2]++; }
  let n = 0;
  for (let s = 0; s < 5; s++) { if (elig[s] === 0) n++; if (prim[s] > (s === 4 ? 2 : 3)) n++; }
  return n;
}
function fitCheck(L, t, outIds, inIds) {
  const before = rosterOf(L, t), after = rosterAfter(L, t, outIds, inIds);
  return { dLine: lineupScore(L, t, after) - lineupScore(L, t, before), worse: balanceIssues(L, t, after) > balanceIssues(L, t, before) };
}
// Does this deal make sense for this team's plan, not just on value?
function planOK(L, t, outIds, inIds, picksIn, picksOut) {
  const f = fitCheck(L, t, outIds, inIds);
  if (f.worse) return false;
  const ins = inIds.map(id => L.players[id]), outs = outIds.map(id => L.players[id]);
  if (!risingOK(L, t, { players: outIds, picks: [] }, { players: inIds })) return false;   // v26.5
  switch (t.mode) {
    case 'contend': return f.dLine >= 0.5;                                   // must make the team better now
    case 'hopeful': return f.dLine >= 0 || picksIn >= 1 && f.dLine >= -2;
    case 'rebuild': return !outs.some(p => p.age <= 23 && p.scout >= 74) && (ins.some(p => p.age <= 25) || picksIn >= 1); // keep the young core
    case 'tank': return !ins.some(p => p.age >= 29 && p.contract && p.contract.amt > 5 && Math.max(0, p.contract.exp - capSeason(L) + 1) > 1) && (ins.every(p => p.age <= 25) || picksIn >= 1);
  }
  return true;
}
// v27 L2: franchise legacy. A player who has done a lot for this team (real NBA legacy p.leg + his seasons and awards here in the sim).
// Tier 2 = franchise icon (never shopped; traded only if he asks out), tier 1 = face of the franchise (kept unless a rebuild and 31+).
const ICON_T = { icon: 500, face: 250 };
function teamLegacy(L, p, tid) { if (tid == null) return 0; return (p.leg && p.leg.tid === tid ? p.leg.v : 0) + legacyScore(p, tid); }
function iconLabel(L, p, tid) { tid = tid == null ? p.team : tid; const it = iconTier(L, p, tid); return it === 2 ? 'Franchise icon' : it === 1 ? (p.leg && p.leg.cs && p.leg.tid === tid ? 'Franchise cornerstone' : 'Face of the franchise') : null; }   // named cornerstones (NBA_FACE) keep that label
function iconTier(L, p, tid) { tid = tid == null ? p.team : tid; if (tid == null || !p.hist) return 0; const v = teamLegacy(L, p, tid); return v >= ICON_T.icon ? 2 : v >= ICON_T.face ? 1 : 0; }
// AI front offices mark who they'd move (and why) and who is untouchable. Refreshed at each outlook review.
function refreshTradeStatus(L) {
  for (const t of L.teams) {
    if (t.id === L.user) continue;
    const st = {}, rot = rotationOf(L, t), rotIds = new Set(rot.slice(0, 8).map(p => p.id));
    const ps = rosterOf(L, t);
    const byVal = ps.slice().sort((a, b) => playerTV(L, t, b, true) - playerTV(L, t, a, true));
    const yc = ps.filter(p => p.age <= 24 && p.scout >= 72).sort((a, b) => b.scout - a.scout), low = t.mode === 'rebuild' || t.mode === 'tank';
    // v26.5 mixed protection: Rising teams protect 2 young players + their top star; Hopeful teams with a young core (2+) protect 1-2 young (2 with 3+) + their top star
    const mixed = !low && (t.status === 'rising' || t.status === 'hopeful') && yc.length >= 2;
    const prot = low ? yc.slice(0, 2) : mixed ? [...new Set([...yc.slice(0, t.status === 'rising' || yc.length >= 3 ? 2 : 1), byVal[0]].filter(Boolean))] : byVal.slice(0, 2);
    const leaving = p => p.tradeReq === L.season || (p.contract && p.contract.exp <= capSeason(L) && p.morale != null && p.morale < 40);   // v25.8 tune: a star who asked out or won't re-sign isn't a cornerstone
    for (const p of prot.filter(p => !leaving(p))) st[p.id] = { k: 'protect', why: low || (mixed && yc.includes(p) && p !== byVal[0]) ? 'Part of the young core' : 'Franchise cornerstone' };
    for (const p of ps) { const it = iconTier(L, p, t.id); if (it === 2 && p.tradeReq !== L.season) st[p.id] = { k: 'protect', why: 'Franchise icon', icon: 2 }; else if (it === 1 && !leaving(p) && !(low && p.age >= 31)) st[p.id] = { k: 'protect', why: iconLabel(L, p, t.id), icon: 1 }; }   // v27 L2
    if (t.hold) for (const p of ps) if (!st[p.id] && (p.age <= 24 || (p.age >= 26 && rotIds.has(p.id)))) st[p.id] = { k: 'protect', why: 'In the race: holding the young core and the rotation' };   // v24.1
    const add = (p, why) => { if (!st[p.id] && Object.values(st).filter(x => x.k === 'block').length < 3) st[p.id] = { k: 'block', why }; };
    const cs = capSeason(L);
    if (payroll(L, t, cs) > TAXLINE) { const dp = dumpCandidate(L, t); if (dp) add(dp, `Salary dump: ${t.abbr} are over the ${money(TAXLINE)} tax line`); }
    else if ((t.mode === 'rebuild' || t.mode === 'tank') && payroll(L, t, cs) > CAP - 8) { const dp = dumpCandidate(L, t); if (dp) add(dp, 'Salary dump: clearing cap space for the rebuild'); }
    for (const p of ps) {
      const yl = p.contract ? p.contract.exp - cs + 1 : 0;
      if ((t.mode === 'rebuild' || t.mode === 'tank') && p.age >= 29 && p.ovr >= 64) add(p, 'Rebuilding: veteran who doesn\'t fit the timeline');
      else if (p.contract && p.mval && p.contract.amt >= 8 && p.contract.amt > p.mval * 1.4 && yl >= 2) add(p, `Overpaid: looking to shed ${money(p.contract.amt)}/yr through ${yr(p.contract.exp)}`);
    }
    const cnt = [0, 0, 0, 0, 0]; for (const p of rot.slice(0, 10)) cnt[p.pos]++;
    for (const p of ps) if (cnt[p.pos] >= 4 && !rotIds.has(p.id) && p.ovr >= 58) add(p, `Logjam at ${POS[p.pos]}: not getting minutes`);
    if (t.mode === 'contend') for (const p of ps) if (p.age <= 23 && !rotIds.has(p.id) && p.scout >= 65) add(p, 'Contender willing to cash in a young asset');
    if (t.status === 'contend' || t.status === 'allin') for (const p of ps) if (p.age <= 25 && !rotIds.has(p.id) && fitTag(p, t.coach) === 'clash') add(p, "Doesn't fit the coach's system");   // v26.6 P5
    for (const p of ps) if (t.mode !== 'contend' && p.contract && p.contract.exp === cs && p.age >= 27 && p.ovr >= 62 && !rotIds.has(p.id)) add(p, 'Expiring contract, not in the rotation');
    t.tstat = st;
  }
}
// Trade status for any rostered player: { k: 'block' | 'protect', why } or null
function tradeStatus(L, p) {
  if (p.team == null) return null;
  if (p.team === L.user) return p.protect ? { k: 'protect', why: 'Protected by you' } : p.block ? { k: 'block', why: p.blockWhy || 'Shopped by you' } : p.tradeReq === L.season ? { k: 'block', why: 'Requested a trade' } : null;
  const s = (L.teams[p.team].tstat || {})[p.id];
  if (p.tradeReq === L.season && !(s && s.k === 'protect')) return { k: 'block', why: 'Requested a trade' };
  return s || null;
}
// Ask the league what it would give for your selected players. Returns up to 5 proposals.
function proposalsFor(L, pids) {
  if (!inTradeWindow(L) || !pids.length) return [];
  const U = L.teams[L.user], targets = pids.map(id => L.players[id]);
  const out = [];
  for (const A of L.teams) {
    if (A.id === L.user || R() > pairKeep(L, A, U)) continue;
    const vaArr = targets.map(p => playerTV(L, A, p, false)), vbArr = targets.map(p => playerTV(L, U, p, true) * (p.block ? 0.85 : 1));
    const va = bundleSum(vaArr), vb = bundleSum(vbArr);   // v25.7: several assets count less than one great one
    if (va < vb * 0.95) continue;                       // they don't value him enough
    // for a real target they'll put good players in the deal; only protected players (and a contender's best player) stay out
    const keep = new Set([...rotationOf(L, A).slice(0, A.mode === 'contend' ? 1 : 0).map(p => p.id), ...Object.keys(A.tstat || {}).filter(id => A.tstat[id].k === 'protect').map(Number)]);
    const pool = [];
    for (const p of rosterOf(L, A)) if (!keep.has(p.id) && !p.hardship) pool.push({ type: 'p', id: p.id, vb: playerTV(L, U, p, false), va: playerTV(L, A, p, true) });
    for (const k of L.picks.filter(k => k.owner === A.id && k.s >= L.season && !pickUsed(L, k))) { const N = aiProt(L, A, k), kv = pickKV(k, N); pool.push({ type: 'k', id: k.id, vb: pickTV(L, U, kv), va: pickTV(L, A, kv), prot: N }); }   // v25.7 S6
    pool.sort((x, y) => y.vb / Math.max(0.1, y.va) - x.vb / Math.max(0.1, x.va));
    const aGive = { players: [], picks: [] }, bGive = { players: pids.slice(), picks: [] };
    let got = 0, cost = 0, askVa = 0; let need = vb; const gotArr = [], costArr = [];
    { const k = askPick(L, A, U, va * 0.5); if (k) { bGive.picks.push(k.id); need = bundleSum([...vbArr, pickTV(L, U, k)]); askVa = pickTV(L, A, k); } }   // v24.1
    // keep both rosters legal: you can't end up over the limit, they can't drop under the minimum
    const [lo, hi] = rosterBounds(L);
    const maxP = Math.min(hi - (U.roster.length - pids.length), A.roster.length + pids.length - lo);
    let cand = pool.filter(a => a.vb > 0.2);
    let cashGot = 0, cashCost = 0;
    while (got < need && aGive.players.length + aGive.picks.length < 5 && cand.length) {
      if (gotArr.length) { const c = aiCash(L, A, U, need - got); if (c) { aGive.cash = c; cashGot = cashTV(L, U, c); cashCost = cashTV(L, A, c); got += cashGot; cost += cashCost; break; } }
      if (gotArr.length) { const sw = aiSwap(L, A, U, need - got, aGive.picks); if (sw) { aGive.swaps = [sw]; cashGot += swapTV(L, U, [sw]); cashCost += swapTV(L, A, [sw]); got += swapTV(L, U, [sw]); cost += swapTV(L, A, [sw]); break; } }   // v26.3: a pick swap can close the last gap
      if (aGive.players.length >= maxP) cand = cand.filter(a => a.type === 'k');
      if (!cand.length) break;
      // the smallest piece that finishes the deal; otherwise lead with the most valuable piece (stars cost real players)
      const fin = cand.filter(a => bundleSum([...gotArr, a.vb]) >= need).sort((x, y) => x.vb - y.vb)[0], a = fin || cand.slice().sort((x, y) => y.vb - x.vb)[0];
      cand.splice(cand.indexOf(a), 1); (a.type === 'p' ? aGive.players : aGive.picks).push(a.id); if (a.prot) (aGive.prot = aGive.prot || {})[a.id] = a.prot; gotArr.push(a.vb); costArr.push(a.va); got = bundleSum(gotArr); cost = bundleSum(costArr);
    }
    if (got < need || got > need * 1.8 + 1 || bundleSum([...vaArr, askVa]) - cost <= 0.2) continue;
    const err = tradeCheck(L, A.id, U.id, aGive, bGive);
    if (err || !planOK(L, A, aGive.players, bGive.players, 0, aGive.picks.length) || !afterTradeOK(L, { a: A.id, b: U.id, aGive, bGive })) continue;   // v25.8
    const pr = { a: A.id, b: U.id, aGive, bGive, id: 'prop-' + A.id + '-' + Date.now(), why: tradeWhy(L, A, U, targets[0], aGive), fair: got / need }; addWhy(L, pr); out.push(pr);
  }
  return out.sort((x, y) => x.fair - y.fair).slice(0, 5);
}
// AI-to-AI trade search
function aiTradeAttempt(L, forceB, want) {
  const outer = !TV_MEMO; if (outer) TV_MEMO = new Map();
  try { return aiTradeAttempt0(L, forceB, want); } finally { if (outer) TV_MEMO = null; }
}
function aiTradeAttempt0(L, forceB, want) {
  const ai = L.teams.filter(t => t.id !== L.user);
  const wts = ai.map(t => ({ allin: 3.5, contend: 3, push: 2.8, hopeful: 1.8, rising: 1.4, retool: 1.8, rebuild: 1.3, tank: 0.6 }[t.status] || { contend: 3, hopeful: 2, rebuild: 1.3, tank: 0.6 }[t.mode]));
  const A = wpick(ai, wts);
  const others = forceB != null ? [L.teams[forceB]] : ai.filter(t => t.id !== A.id);
  // candidate targets: sample players from other AI teams, ranked by how much more A values them than their owner
  const cands = [];
  const toUser = forceB != null && forceB === L.user;
  const blockIds = toUser ? rosterOf(L, L.teams[L.user]).filter(p => p.block).map(p => p.id) : [];
  const onlyBlock = blockIds.length && R() < 0.7;     // shopped players draw most of the calls
  const needsA = teamNeeds(L, A);
  for (const B of others) { if (R() > pairKeep(L, A, B)) continue; for (const p of rosterOf(L, B)) {   // v24: rivals, top teams and bubble teams avoid each other
    const ts = tradeStatus(L, p);
    if ((ts && ts.k === 'protect') || (B.id === L.user && onlyBlock && !p.block)) continue;   // protected players are off limits
    if (p.hardship || p.injury > 20 || (p.contract && p.contract.type === 'rookie' && p.age <= 20 && B.mode === 'rebuild' && p.tradeReq !== L.season)) continue;   // a rookie who asked out is movable (My Career)
    const shopped = !!(ts && ts.k === 'block');    // a shopped player is cheaper to get and only needs to be a rotation piece
    // v19: stars rarely move. Mostly from sellers, players who asked out, or the block
    if (B.id !== L.user && (p.ovr >= 78 || (p.fame || 0) >= 70) && !shopped && p.tradeReq !== L.season && !(B.mode === 'tank' || B.mode === 'rebuild') && R() < (B.id !== L.user && sellLeverage(L, B, p).m <= 0.85 ? 0.4 : 0.7)   /* v25.8 tune: star skip 0.6/0.85 -> 0.4/0.7 */) continue;
    const va = playerTV(L, A, p, false), vb = playerTV(L, B, p, true) * (shopped ? 0.8 : 1);
    const fitsA = shopped ? (A.mode === 'contend' || A.mode === 'hopeful' ? p.ovr >= (rotationOf(L, A)[7] || { ovr: 0 }).ovr : p.age <= 27) : A.mode === 'contend' || A.mode === 'hopeful' ? p.ovr >= (rotationOf(L, A)[4] || { ovr: 0 }).ovr - 2 : A.mode === 'rebuild' ? (p.age <= 25 && (p.scout >= 74 || p.ovr >= 72)) : (p.age <= 22 && p.scout >= 72);
    if (!fitsA || va <= vb * 1.05) continue;
    if ((A.mode === 'contend' || A.mode === 'hopeful') && fitCheck(L, A, [], [p.id]).dLine < (shopped ? 0 : 1)) continue;
    // v19: most deals are for role players who fill a need
    const nv = Math.max(0, ...(p.arch || []).map(a => needsA[a.p + '|' + a.n] || 0)), role = p.ovr >= 58 && p.ovr < 76 ? 1 + 0.8 * nv : 1;
    cands.push({ p, B, va, vb, r: va / vb * role * (p.block && B.id === L.user ? 1.3 : 1) });
  } }
  if (!cands.length) return null;
  cands.sort((x, y) => y.r - x.r);
  // v19: a front office works a few calls before giving up (up to 3 of its top targets)
  const top = cands.slice(0, 6).sort(() => R() - 0.5);
  for (const c of top.slice(0, forceB != null ? 1 : 3)) { const tr = tradeFor(c); if (tr) return tr; }
  return null;
  function tradeFor(c) {
  const B = c.B, target = c.p;
  // build A's package from assets B values more than A does
  const keep = new Set(rotationOf(L, A).slice(0, A.mode === 'contend' ? 3 : 2).map(p => p.id));
  const assets = [];
  for (const p of rosterOf(L, A)) if (!keep.has(p.id) && !p.hardship) assets.push({ type: 'p', id: p.id, vb: playerTV(L, B, p, false), va: playerTV(L, A, p, true) });
  for (const k of L.picks.filter(k => k.owner === A.id && k.s >= L.season && !pickUsed(L, k))) { const N = aiProt(L, A, k), kv = pickKV(k, N); assets.push({ type: 'k', id: k.id, vb: pickTV(L, B, kv), va: pickTV(L, A, kv), prot: N }); }   // v25.7 S6
  assets.sort((x, y) => y.vb / Math.max(0.1, y.va) - x.vb / Math.max(0.1, x.va));
  const aGive = { players: [], picks: [] }, bGive = { players: [target.id], picks: [] };
  let got = 0, cost = 0, askVa = 0; const gotArr = [], costArr = [], bonusArr = []; let cashGot = 0, cashCost = 0;
  const lev = B.id !== L.user && want !== 'plyr' ? sellLeverage(L, B, target).m : 1;   // v25.8 S1b: the seller's ask drops when he asked out, has a year left, or is old for a rebuilder
  let need = c.vb * 1.05 * lev;
  if (B.id === L.user && (!want || want === 'mix' || want === 'dump')) { const k = askPick(L, A, B, c.vb * 0.8); if (k) { bGive.picks.push(k.id); need = bundleSum([c.vb, pickTV(L, B, k)]) + c.vb * 0.05; askVa = pickTV(L, A, k); } }   // v24.1
  let pool = assets.filter(as => as.vb > 0.2);
  // v24: steer the package toward the trade type the season is short of (players only, picks only, or both)
  if (want === 'plyr') pool = pool.filter(as => as.type === 'p');
  else if (want === 'dump') pool = pool.filter(as => as.type === 'k');
  else if (want === 'mix') {
    for (const ty of ['p', 'k']) {
      const seed = pool.filter(as => as.type === ty && as.vb > 0.3).sort((x, y) => x.vb - y.vb)[0];
      if (!seed) return null;
      pool.splice(pool.indexOf(seed), 1); (ty === 'p' ? aGive.players : aGive.picks).push(seed.id); if (seed.prot) (aGive.prot = aGive.prot || {})[seed.id] = seed.prot; gotArr.push(seed.vb); costArr.push(seed.va); got = bundleSum(gotArr) + cashGot; cost = bundleSum(costArr) + cashCost;
    }
  }
  while (got < need && aGive.players.length + aGive.picks.length < 4 && pool.length) {
    if (gotArr.length) { const c = aiCash(L, A, B, need - got); if (c) { aGive.cash = c; cashGot = cashTV(L, B, c); cashCost = cashTV(L, A, c); got += cashGot; cost += cashCost; break; } }
    if (gotArr.length) { const sw = aiSwap(L, A, B, need - got, aGive.picks); if (sw) { aGive.swaps = [sw]; cashGot += swapTV(L, B, [sw]); cashCost += swapTV(L, A, [sw]); got += swapTV(L, B, [sw]); cost += swapTV(L, A, [sw]); break; } }   // v26.3: a pick swap can close the last gap
    const rem = need - got;
    // smallest single asset that finishes the deal; otherwise the best-value piece and keep going
    const finisher = pool.filter(as => bundleSum([...gotArr, as.vb]) >= need).sort((x, y) => x.vb - y.vb)[0];
    const as = finisher || pool[0];
    pool.splice(pool.indexOf(as), 1);
    (as.type === 'p' ? aGive.players : aGive.picks).push(as.id); if (as.prot) (aGive.prot = aGive.prot || {})[as.id] = as.prot; gotArr.push(as.vb); costArr.push(as.va); got = bundleSum(gotArr) + cashGot; cost = bundleSum(costArr) + cashCost;
  }
  if (got < need) return null;
  if (got > need * 1.8 + 1) return null; // would be a clear overpay
  if (bundleSum([c.va, askVa]) - cost <= 0.3) return null;
  // keep rosters legal: add a minimum-salary filler from B if A sends extra bodies
  let err = tradeCheck(L, A.id, B.id, aGive, bGive);
  if (err && /drop below/.test(err)) {
    const filler = rosterOf(L, B).filter(p => p.id !== target.id && !p.protect && (!p.contract || p.contract.amt <= MINSAL)).sort((x, y) => x.ovr - y.ovr)[0];
    if (filler) { bGive.players.push(filler.id); err = tradeCheck(L, A.id, B.id, aGive, bGive); }
  }
  // v19: make the money work. The team taking back too much salary (or too many bodies) adds a contract going the other way
  let bonus = 0;
  for (let k = 0; k < 2 && err && /salar|outgoing|hard cap|go over \d+ players/.test(err); k++) {
    const hi = 15;   // v24.2
    let snd = err.startsWith(A.abbr + ' ') ? A : err.startsWith(B.abbr + ' ') ? B : null;
    if (/go over \d+ players/.test(err)) snd = A.roster.length - aGive.players.length + bGive.players.length > hi ? A : B;
    if (!snd || snd.id === L.user) break;
    const used = new Set([...aGive.players, ...bGive.players]), cs = capSeason(L);
    const sal = q => (q.contract && q.contract.exp >= cs ? q.contract.amt : 0);
    const opts = rosterOf(L, snd).filter(q => !used.has(q.id) && !q.hardship && !(snd === A && keep.has(q.id)) && !tradeRestricted(L, q) && !((tradeStatus(L, q) || {}).k === 'protect') && (/players/.test(err) || sal(q) >= 2))
      .map(q => ({ q, v: playerTV(L, snd, q, true) })).sort((x, y) => x.v / Math.max(1, sal(x.q)) - y.v / Math.max(1, sal(y.q)));
    const f = opts[0]; if (!f) break;
    if (snd === A) { aGive.players.push(f.q.id); costArr.push(f.v); gotArr.push(playerTV(L, B, f.q, false)); cost = bundleSum(costArr) + cashCost; got = bundleSum(gotArr) + cashGot; }
    else { bGive.players.push(f.q.id); bonus += playerTV(L, A, f.q, false); bonusArr.push(playerTV(L, A, f.q, false)); if (got < need + f.v * 0.5) break; }
    err = tradeCheck(L, A.id, B.id, aGive, bGive);
  }
  if (err) return null;
  let nv = false;
  if (aGive.picks.length) {   // v25.8 S1b: deals with the buyer's picks are judged on the rosters after the trade (both sides), adding picks if the seller needs more
    const extra = pool.filter(a => a.type === 'k' && !aGive.picks.includes(a.id)).sort((x, y) => y.vb - x.vb);
    if (!fitNewView(L, A, B, aGive, bGive, extra)) return null; nv = true;
  } else {
    if (bonus && bundleSum([c.va, askVa, ...bonusArr]) - cost <= 0.3) return null;
    if (!bonus && bundleSum([c.va, askVa]) - cost <= 0.3) return null;
  }
  // both front offices check the roster they'd have afterwards against their plan
  if (!planOK(L, A, aGive.players, bGive.players, bGive.picks.length, aGive.picks.length)) return null;
  if (B.id !== L.user && !planOK(L, B, bGive.players, aGive.players, aGive.picks.length, bGive.picks.length)) return null;
  if (want && tradeType(aGive, bGive) !== want) return null;   // v24: the deal has to be the type that was asked for
  if (R() > assetKeep(L, A, B, aGive, bGive)) return null;     // v24: rebuilding teams don't swap picks and young core with each other
  return { a: A.id, b: B.id, aGive, bGive, nv, id: Date.now() + '-' + rint(1, 1e6), why: tradeWhy(L, A, B, target, aGive) };
}
}
// Plain-language reason for an AI proposal
// Why a trade happened: short tags (top 2 shown first), then a brief explanation. A = buyer of target, B = seller.
function tradeWhy(L, A, B, target, aGive) {
  const tags = [], notes = [], cs = capSeason(L);
  const outs = aGive.players.map(id => L.players[id]);
  const pay = x => (x.contract && x.contract.exp >= cs ? x.contract.amt : 0);
  const needs = teamNeeds(L, A); let best = null;
  for (const a of target.arch || []) { const v = needs[a.p + '|' + a.n] || 0; if (!best || v > best.v) best = { v, label: a.n + ' ' + a.p }; }
  const win = A.mode === 'contend' || A.mode === 'hopeful';
  // seller side
  const rotB = rotationOf(L, B), samePos = rotB.filter(p => p.pos === target.pos && p.id !== target.id && p.ovr >= target.ovr - 4).length;
  if (samePos >= 2) tags.push(`Logjam at ${POS[target.pos]} (${B.abbr})`);
  if (target.tradeReq === L.season) tags.push('He asked out');
  if (target.contract && target.contract.exp === cs && B.mode !== 'contend') tags.push('Contract year');
  const payB = payroll(L, B, cs), netB = pay(target) - outs.reduce((x, p) => x + pay(p), 0);
  if (payB > TAXLINE && payB - netB <= TAXLINE) tags.push(`Gets ${B.abbr} under the tax`);
  if (fit(target, A.coach) - fit(target, B.coach) >= 7) tags.push('Better system fit');
  if (B.coachSince != null && B.coachSince >= capSeason(L) - (L.phase === 'regular' ? 0 : 1) && B.coachSince > 1) tags.push(`New ${B.abbr} coach reshaping`);
  // buyer side
  if (injDiscount(L, A, target) >= 0.12) tags.push('Injury concern priced in');   // v24.3
  else if (outs.some(p => injDiscount(L, B, p) >= 0.12)) tags.push('Selling an injury risk');
  const hurt = rotationOf(L, A).concat(rosterOf(L, A)).find(p => p.injLong && p.injury >= 15 && p.pos === target.pos);
  if (hurt) tags.push(`Replaces injured ${hurt.name}`);
  if (win && target.age >= 31 && target.ovr >= 68) tags.push('Veteran for a title push');
  if (win) { const slot = rotationOf(L, A).filter(x => x.ovr > target.ovr).length + 1; notes.push(`${target.name} (${target.ovr}) would be their ${slot <= 5 ? 'no. ' + slot + ' player' : slot + 'th man'}.`); }
  else { tags.push('Young upside'); notes.push(`${target.name}, ${target.age}, scouted at ${target.scout}.`); }
  if (best && best.v >= 0.55) tags.push(`Need: ${best.label}`);
  if (!win && outs.some(p => p.age >= 28)) tags.push('Moving veterans');
  if (win && outs.some(p => p.age <= 23)) tags.push('Youth for win-now');
  if (aGive.picks.length) notes.push(`${A.abbr} add ${aGive.picks.length} pick${aGive.picks.length > 1 ? 's' : ''}.`);
  const net = outs.reduce((x, p) => x + pay(p), 0) - pay(target);
  if (net > 3) tags.push(`Clears ${money(net)} for ${A.abbr}`);
  const tsT = tradeStatus(L, target); if (tsT && tsT.k === 'block') tags.push(B.id === L.user ? 'On your block' : 'On the block');
  const uniq = [...new Set(tags)];
  return (uniq.length ? uniq.slice(0, 3).join(' · ') + '. ' : '') + notes.join(' ');
}
// v25.4: what a team gets out of a deal, as tags from data (strongest first, max 3). get/give = { players: [ids], picks: [ids] }.
const GETS_K = { need: 0.9, expBest: true };   // 5a knobs (tuned from tag frequencies)
const GETS_ORDER = ['star', 'winNow', 'young', 'pick1', 'picks', 'fit', 'need', 'cap', 'expiring', 'depth'];
function tradeGets(L, tid, get, give) {
  const T = L.teams[tid], cs = capSeason(L), ins = get.players.map(id => L.players[id]), outs = give.players.map(id => L.players[id]), tags = [];
  const has = k => tags.some(t => t.k === k), add = (k, x) => { if (!has(k)) tags.push({ k, x }); };
  const best = ins.reduce((m, p) => (!m || p.ovr > m.ovr ? p : m), null);
  if (best && best.ovr >= 80) add('star');
  if (best && best.ovr >= 75 && best.age >= 26) add('winNow');
  if (ins.length && (ins.reduce((s, p) => s + p.age, 0) / ins.length <= 24 || ins.reduce((s, p) => s + Math.max(0, (p.pot || p.ovr) - p.ovr), 0) / ins.length >= 8)) add('young');
  const ks = get.picks.map(id => L.picks.find(k => k.id === id)).filter(Boolean);
  if (ks.some(k => k.rd === 1)) add('pick1'); else if (ks.length) add('picks');
  if (ins.some(p => p.team != null && p.team !== tid && fit(p, T.coach) - fit(p, L.teams[p.team].coach) >= 5)) add('fit');
  { const needs = teamNeeds(L, T); let bn = null; for (const p of ins) for (const a of p.arch || []) { const v = needs[a.p + '|' + a.n] || 0; if (v >= GETS_K.need && (!bn || v > bn.v)) bn = { v, pos: POS[p.pos] }; } if (bn) add('need', bn.pos); }
  if (outs.reduce((s, p) => s + capHit(L, p, cs), 0) - ins.reduce((s, p) => s + capHit(L, p, cs), 0) >= CAP * 0.1) add('cap');
  if (GETS_K.expBest ? (best && best.ovr >= 65 && best.contract && best.contract.exp === cs) : ins.some(p => p.contract && p.contract.exp === cs)) add('expiring');
  { const rot = rotationOf(L, T), cut = rot.length ? Math.min(...rot.map(p => p.ovr)) : 50; if (ins.filter(p => p.ovr >= cut).length >= 2) add('depth'); }
  tags.sort((a, b) => GETS_ORDER.indexOf(a.k) - GETS_ORDER.indexOf(b.k));
  return tags.slice(0, 3);
}
// v25.4 5b: 3 phrases per tag; n = how many players (or picks) the tag is about
const POS_NAME = { PG: 'point guard', SG: 'shooting guard', SF: 'small forward', PF: 'power forward', C: 'center' };
const GETS_TXT = {
  star: ['a star', 'a true star', 'a franchise-level player'],
  winNow: ['a win-now player', 'a proven veteran', 'a player who helps right away'],
  young: [n => n > 1 ? 'young players' : 'a young player', n => n > 1 ? 'young talent' : 'a young talent', n => n > 1 ? 'players with room to grow' : 'a player with room to grow'],
  pick1: ['a 1st-round pick', 'a first-round pick', 'a 1st-round pick to build on'],
  picks: [n => n > 1 ? 'draft picks' : 'a 2nd-round pick', n => n > 1 ? 'extra picks' : 'a draft pick', n => n > 1 ? 'a couple of picks' : 'a 2nd-round pick'],
  fit: ['a better system fit', 'a player who suits their system', 'a better fit for their coach'],
  need: [x => `help at ${POS_NAME[x]}`, x => `a ${POS_NAME[x]} they need`, x => `depth where they are thin at ${POS_NAME[x]}`],
  cap: ['cap room', 'more breathing room under the cap', 'salary relief'],
  expiring: ['an expiring contract', 'a deal that ends this season', 'a contract that comes off the books this season'],
  depth: ['rotation depth', 'more rotation players', 'depth for the rotation']
};
const GETS_NONE = ['a fair swap', 'a change of scenery', 'a straight swap'];
function tradeGetsText(L, tid, get, give) {
  const cashT = get.cash > 0 ? `${money(get.cash)} in cash` : '';
  if (!get.players.length && !get.picks.length) return cashT;
  const tags = tradeGets(L, tid, get, give), seed = tid * 7 + get.players.concat(get.picks).reduce((s, id) => s + (+id || 0), 0);   // same deal → same words on every redraw
  const nIn = { young: get.players.length, picks: get.picks.length };
  const parts = tags.map((t, i) => { const v = GETS_TXT[t.k][(seed + i) % 3]; return typeof v === 'function' ? v(t.k === 'need' ? t.x : nIn[t.k] || 1) : v; });
  if (!parts.length) return GETS_NONE[seed % 3] + (cashT ? ' plus ' + cashT : '');
  if (cashT) parts.push(cashT);
  return parts.length > 1 ? parts.slice(0, -1).join(', ') + ' and ' + parts[parts.length - 1] : parts[0];
}
// AI teams make offers to the user's team
function aiOfferToUser(L) {
  if (L.user == null || (L.offers || []).length >= 3) return;
  let tr = null; for (const w of wantOrder(L).filter(k => k !== 'pick').slice(0, 3)) { tr = aiTradeAttempt(L, L.user, w); if (tr) break; }   // v24: offers follow the same mix and caps
  if (!tr || !afterTradeOK(L, tr)) return;   // v25.8
  addWhy(L, tr);
  if (L.offers.some(o => o.a === tr.a)) return;
  tr.made = L.season * 1000 + (L.phase === 'regular' ? L.day : 900 + (L.faDay || 0)); tr.ttl = L.phase === 'regular' ? 7 : 3; tr.isNew = true;
  L.offers.push(tr);
  logNews(L, `${L.teams[tr.a].abbr} made you a trade offer: they want ${describe(L, tr.bGive)} for ${describe(L, tr.aGive)}`, tr.a, 'trade');
}
function offerValid(L, o) {
  return o.aGive.players.every(id => L.players[id].team === o.a) && o.bGive.players.every(id => L.players[id].team === o.b) && o.aGive.picks.every(pk => L.picks.find(k => k.id === pk && k.owner === o.a)) && o.bGive.picks.every(pk => L.picks.find(k => k.id === pk && k.owner === o.b)) && !tradeCheck(L, o.a, o.b, o.aGive, o.bGive);
}
function processOffers(L) {
  const keep = [];
  for (const o of L.offers || []) {
    o.isNew = false;
    if (!inTradeWindow(L) || !offerValid(L, o)) { logNews(L, `${L.teams[o.a].abbr}'s trade offer is off the table`, o.a, 'trade'); continue; }
    o.ttl--;
    if (o.ttl <= 0 || R() < 0.12) { logNews(L, `${L.teams[o.a].abbr} withdrew their trade offer`, o.a, 'trade'); continue; }
    keep.push(o);
  }
  L.offers = keep;
}
function acceptOffer(L, id) {
  const o = L.offers.find(x => x.id === id); if (!o) return 'That offer is gone.';
  if (!offerValid(L, o)) { L.offers = L.offers.filter(x => x.id !== id); return 'That offer is no longer valid.'; }
  executeTrade(L, o); L.offers = L.offers.filter(x => x.id !== id && !offerOverlaps(o, x)); return null;
}
// v32a: once one offer for a pick (or player) is accepted, the other offers that ask for the same assets or the same draft slot are removed
function offerOverlaps(a, b) {
  if (a.draft && b.draft && a.slotIdx != null && a.slotIdx === b.slotIdx) return true;
  const pk = new Set((a.bGive.picks || [])), pl = new Set((a.bGive.players || []));
  return (b.bGive.picks || []).some(x => pk.has(x)) || (b.bGive.players || []).some(x => pl.has(x));
}
function declineOffer(L, id) { const o = L.offers.find(x => x.id === id); L.offers = L.offers.filter(x => x.id !== id); if (o) logNews(L, `You declined ${L.teams[o.a].abbr}'s trade offer`, o.a, 'trade');
}
// v18 deadline day: rumors and a burst of AI deals on the last day trades are allowed
function deadlineFrenzy(L) {
  if (L.ddSeason === L.season) return; L.ddSeason = L.season; L.ddRumors = [];
  const sellers = L.teams.filter(t => t.id !== L.user && (t.mode === 'tank' || t.mode === 'rebuild'));
  for (const t of sellers.sort(() => R() - 0.5).slice(0, 3)) { const p = rosterOf(L, t).filter(x => x.age >= 27 && x.ovr >= 66).sort((a, b) => b.ovr - a.ovr)[0]; if (p) { L.ddRumors.push(p.id); logNews(L, flL(L, 'rumor.seller', { team: t.abbr, name: p.name, ovr: p.ovr, pos: posLabelL(p) }), t.id, 'tx'); } }
  aiTradeRound(L, 400, tradeGoal(L).reg, true);   // v24: deadline day fills whatever is left of the season's in-season goal
  if (L.user != null) for (let i = 0; i < 2; i++) if (R() < 0.6) aiOfferToUser(L);
}

// v20: your watch list (any player) and prospect tags (Target / Sleeper / Avoid). News alerts when something changes.
const WATCH_MAX = 40, PTAGS = { target: 'Target', sleeper: 'Sleeper', avoid: 'Avoid' };
function isWatched(L, p) { return !!(L.watch && L.watch.includes(p.id)); }
function ptagOf(L, p) { return (L.ptag || {})[p.id] || null; }
function watchList(L) { return (L.watch || []).map(id => L.players[id]).filter(p => p && !p.retired); }
function watchState(L, p) { const ts = p.team != null && p.team !== L.user ? tradeStatus(L, p) : null; return { t: p.team, fa: L.fa.includes(p.id), b: !!(ts && ts.k === 'block'), inj: !!(p.injLong && p.injury >= 10), o: p.ovr, h: !!(hiddenFor(L, p)), r: !!p.retired }; }
function toggleWatch(L, id) {
  L.watch = L.watch || []; L.watchSnap = L.watchSnap || {};
  const i = L.watch.indexOf(id);
  if (i >= 0) { L.watch.splice(i, 1); delete L.watchSnap[id]; return false; }
  if (L.watch.length >= WATCH_MAX) return null;
  L.watch.push(id); L.watchSnap[id] = watchState(L, L.players[id]); return true;
}
function setPtag(L, id, tag) { L.ptag = L.ptag || {}; if (!tag || L.ptag[id] === tag) delete L.ptag[id]; else L.ptag[id] = tag; }
function watchScan(L) {
  if (L.user == null) return;
  L.watchSnap = L.watchSnap || {};
  const ab = t => L.teams[t] ? L.teams[t].abbr : '?';
  for (const id of L.watch || []) {
    const p = L.players[id]; if (!p) continue;
    const n = watchState(L, p), o = L.watchSnap[id]; L.watchSnap[id] = n; if (!o) continue;
    const m = [];
    if (n.r && !o.r) m.push('retired');
    else {
      if (o.t == null && n.t != null && !o.fa) m.push(`${p.draft && p.draft.s === L.season && p.draft.tid === n.t ? `was drafted by ${ab(n.t)} (#${p.draft.no})` : `joined ${ab(n.t)}`}`);
      else if (n.t != null && o.t != null && n.t !== o.t) m.push(`was traded to ${ab(n.t)}`);
      if (n.fa && !o.fa) m.push('is a free agent');
      if (!n.fa && o.fa && n.t != null) m.push(`signed with ${ab(n.t)}`);
      if (n.b && !o.b) m.push(`is on the ${ab(n.t)} trading block`);
      if (n.inj && !o.inj) m.push(`is out long-term (${injGames(p)} games)`);
      if (!n.h && !o.h && n.o - o.o >= 3) m.push(`jumped to ${n.o} overall (+${n.o - o.o})`);
    }
    if (m.length) logNews(L, `Watch list: ${p.name} ${m.join(', ')}`, L.user, 'watch');
  }
  L.ptagSeen = L.ptagSeen || {};
  for (const id in L.ptag || {}) {
    const p = L.players[id]; if (!p || L.ptag[id] !== 'target' || L.ptagSeen[id] || p.team == null || !p.draft || p.draft.s !== L.season) continue;
    L.ptagSeen[id] = 1;
    logNews(L, p.team === L.user ? `Draft target landed: you took ${p.name} (#${p.draft.no})` : `Your draft target ${p.name} went #${p.draft.no} to ${ab(p.team)}`, L.user, 'watch');
  }
}
const posLabelL = p => ['PG', 'SG', 'SF', 'PF', 'C'][p.pos];
// v19: teams spend the first weeks evaluating their roster and needs; calls pick up toward the deadline
function tradeTempo(L) {
  const o = tradeOpenDay(L), d = deadlineDay(L);
  if (L.day >= d - 14) return [8, 0.5];
  const f = (L.day - o) / Math.max(1, d - 14 - o);
  return f < 0.4 ? [2, 0.15] : f < 0.75 ? [3, 0.3] : [5, 0.45];
}
// v21: rookie roles by team status. Rebuilding and tanking teams play their draft picks to "hit" on them; a retooling team gives 1st-rounders bench minutes.
// Year 1: top-5 picks keep a big role all season; other 1st-rounders until the midseason review; 2nd-rounders get a season role (60% end of bench,
// 30% bench minutes, 10% starter) protected for 20 games. Year 2: 1st-rounders keep a smaller boost (top-5 picks if they're producing or improving).
// Boosts are lineup value (about 0.75 per overall point), bigger in the first half. A player who clearly isn't producing loses part or all of it.
function youthTeam(L, t) { return t.status === 'rebuild' || t.status === 'tank' || (!t.status && (t.mode === 'rebuild' || t.mode === 'tank')); }
function eff36(p) { const s = p.stats && p.stats.rs; if (!s || !s.min) return null; return (s.pts + s.orb + s.drb + s.ast + s.stl + s.blk - (s.fga - s.fgm) - (s.fta - s.ftm) - s.tov) / (s.min / 60) * 36; }
function rookieBoost(L, t, p, med) {
  const yr1 = p.rookieSeason === L.season, yr2 = p.rookieSeason === L.season - 1, d = p.draft;
  if (!d || !(yr1 || yr2) || d.s == null) return 0;
  const half = L.day < totalDays(L) / 2, mid = L.day >= totalDays(L) * 0.4, gp = p.stats.rs ? p.stats.rs.gp : 0, e = eff36(p);
  const weak = k => gp >= 8 && med != null && e != null && e < med * k;
  const top5 = d.rd === 1 && d.no <= 5, r1 = d.rd === 1;
  if (t.status === 'retool') return yr1 && r1 ? (weak(0.55) ? 0 : 4) : 0;
  if (t.status === 'rising') return yr1 && r1 ? (weak(0.55) ? 0 : 5) : yr2 && r1 && !weak(0.6) ? 3 : 0;   // v26.5
  if (!youthTeam(L, t)) return 0;
  let b = 0;
  if (yr1 && top5) b = half ? 9 : 7;                                              // keeps the role all season
  else if (yr1 && r1) { b = half ? 7 : 5; if (mid && weak(0.45)) b = 0; else if (mid && weak(0.6)) b *= 0.5; }
  else if (yr1) { if (!p.r2r || p.r2r.s !== L.season) p.r2r = { s: L.season, b: wpick([0, 4, 8], [60, 30, 10]) }; b = p.r2r.b; if (b && gp >= gpq(20) && mid && weak(0.6)) b = 0; }
  else if (yr2 && top5) { const grew = p.hist.some(h => h.s === p.rookieSeason && p.ovr - h.ovr >= 3); b = grew || !weak(0.7) ? (half ? 6 : 5) : 0; }
  else if (yr2 && r1) { b = half ? 4 : 3; if (mid && weak(0.6)) b = 0; }
  return b;
}
function youthPlan(L) {
  for (const t of L.teams) {
    t.yb = {};
    if (t.id === L.user || !(youthTeam(L, t) || t.status === 'retool' || t.status === 'rising')) { t.ud = {}; continue; }
    const vets = rotationOf(L, t).slice(0, 8).filter(p => p.age > 23).map(eff36).filter(x => x != null).sort((a, b) => a - b);
    const med = vets.length ? vets[Math.floor(vets.length / 2)] : null;
    t.ud = {};
    for (const p of rosterOf(L, t)) { const b = rookieBoost(L, t, p, med) + statusMinBoost(L, t, p) + devRoleBoost(L, t, p); if (b) t.yb[p.id] = r1(b); const u = devUsage(L, t, p); if (u > 1) t.ud[p.id] = u; }   // v26.5: + status bonus; v26.6: + development role (potential, coach adapts the role) and touches
  }
}
// v19: role-player swaps. Two teams trade rotation pieces that fill each other's needs (with a 2nd-round pick to even it out)
function roleSwap(L) {
  const outer = !TV_MEMO; if (outer) TV_MEMO = new Map();
  try { return roleSwap0(L); } finally { if (outer) TV_MEMO = null; }
}
function roleSwap0(L) {
  const ai = L.teams.filter(t => t.id !== L.user), A = pick(ai);
  const nA = teamNeeds(L, A), cs = capSeason(L);
  const keyNeed = (n, q) => Math.max(0, ...(q.arch || []).map(a => n[a.p + '|' + a.n] || 0));
  const stamp = L.season * 1000 + (L.phase === 'regular' ? L.day : 900);
  const movable = (t, q, k) => !(q.lastTrade != null && stamp - q.lastTrade < 25) && q.ovr >= 58 && q.ovr < 76 && !q.hardship && !(q.injLong && q.injury > 10) && !tradeRestricted(L, q) && !((tradeStatus(L, q) || {}).k === 'protect') && !rotationOf(L, t).slice(0, k).some(x => x.id === q.id);
  const wantsA = [];
  for (const B of ai) if (B !== A && R() <= pairKeep(L, A, B)) for (const q of rosterOf(L, B)) if (movable(B, q, 3) && keyNeed(nA, q) >= 0.6) wantsA.push({ B, q });
  if (!wantsA.length) return null;
  const { B, q } = pick(wantsA), nB = teamNeeds(L, B);
  const vAq = playerTV(L, A, q, false), vBq = playerTV(L, B, q, true);
  const offers = rosterOf(L, A).filter(r => movable(A, r, 3) && Math.abs(r.ovr - q.ovr) <= 6).map(r => ({ r, vAr: playerTV(L, A, r, true), vBr: playerTV(L, B, r, false), nb: keyNeed(nB, r) }))
    .filter(o => o.vAr <= vAq * 1.05 && o.nb >= 0.35).sort((x, y) => (y.nb + y.vBr / Math.max(0.3, vBq)) - (x.nb + x.vBr / Math.max(0.3, vBq)));
  for (const o of offers.slice(0, 3)) {
    const aGive = { players: [o.r.id], picks: [] }, bGive = { players: [q.id], picks: [] };
    if (o.vBr < vBq * 0.95) {   // B wants a little more: A adds a 2nd-round pick
      const k = L.picks.filter(k => k.owner === A.id && k.rd === 2 && k.s >= L.season && !pickUsed(L, k)).sort((x, y) => x.s - y.s)[0];
      if (!k || bundleSum([o.vBr, pickTV(L, B, k)]) < vBq * 0.95) continue; aGive.picks.push(k.id);
    }
    if (tradeCheck(L, A.id, B.id, aGive, bGive)) continue;
    if (fitCheck(L, A, aGive.players, bGive.players).worse || fitCheck(L, B, bGive.players, aGive.players).worse) continue;
    if ((A.mode === 'contend' && fitCheck(L, A, aGive.players, bGive.players).dLine < 0) || (B.mode === 'contend' && fitCheck(L, B, bGive.players, aGive.players).dLine < 0)) continue;
    const lab = (n, x) => { let best = null; for (const a of x.arch || []) { const v = n[a.p + '|' + a.n] || 0; if (!best || v > best.v) best = { v, l: a.n + ' ' + a.p }; } return best ? best.l : POS[x.pos]; };
    return { a: A.id, b: B.id, aGive, bGive, id: 'swap-' + Date.now() + '-' + rint(1, 1e6), why: `Role-player swap · Need: ${lab(nA, q)} (${A.abbr}) · Need: ${lab(nB, o.r)} (${B.abbr}). Both teams fill a hole in the rotation.` };
  }
  return null;
}
function runAITrade(L, gen, ntypes, relax) {
  let tr = null;
  if (gen) tr = gen(L);
  else if ((tr = ycTry(L, relax)) && afterTradeOK(L, tr)) tr.gateOK = true;   /* v24.2: young-core deal; v25.8 tune: if the gate blocks it, try the other generators */
  else for (const want of wantOrder(L, relax).slice(0, ntypes || 2)) {   // v24: try the trade type the season is most short of, then the next
    if (want === 'pick') { if (L.phase === 'regular' && seasonDeals(L).filter(d => d.type === 'pick').length >= 2) continue; tr = pickSwap(L); }   // leave room for draft-day trade-ups
    else if (want === 'dump' && R() < 0.7) tr = R() < 0.7 ? vetForPicks(L) : salaryDump(L, false);
    else if (want === 'plyr' && R() < 0.25) tr = roleSwap(L);
    else tr = aiTradeAttempt(L, undefined, want);
    if (tr && typeBlocked(L, tradeType(tr.aGive, tr.bGive), relax)) tr = null;   // never past a type's cap (one over after many misses), whichever generator made the deal
    if (tr) break;
  }
  if (!tr || !(tr.gateOK || afterTradeOK(L, tr))) return false;   // v25.8: picks valued on the rosters after the deal
  delete tr.gateOK;
  addWhy(L, tr);
  if (L.mode === 'commish') { tr.when = seasonLabel(L); tr.isNew = true; L.pending.push(tr); logNews(L, `Trade agreed, pending your review: ${L.teams[tr.a].abbr} get ${describe(L, tr.bGive)}; ${L.teams[tr.b].abbr} get ${describe(L, tr.aGive)}`, tr.a, 'trade'); }
  else executeTrade(L, tr);
  countDeal(L, tr);
  return true;
}

// ---- v24.2: young-core deals for teams that were rebuilding and are now in the race ----
const ycYoung = p => p.age <= 24 && ((p.scout || 0) >= 70 || p.ovr >= 65);
function commitAITrade(L, tr) {
  if (!afterTradeOK(L, tr)) return;   // v25.8
  countDeal(L, tr); addWhy(L, tr);
  if (L.mode === 'commish') { tr.when = seasonLabel(L); tr.isNew = true; L.pending.push(tr); logNews(L, `Trade agreed, pending your review: ${L.teams[tr.a].abbr} get ${describe(L, tr.bGive)}; ${L.teams[tr.b].abbr} get ${describe(L, tr.aGive)}`, tr.a, 'trade'); }
  else executeTrade(L, tr);
}
function ycCounts(L) {
  let yc = 0, st = 0; const top = (a, b) => Math.max(0, ...[...a.players, ...b.players].map(id => L.players[id].ovr));
  for (const r of seasonTrades(L)) { if (r.yc) yc++; if (r.top >= 78) st++; }
  for (const t of L.pending || []) { if (t.yc) yc++; if (top(t.aGive, t.bGive) >= 78) st++; }
  return { yc, st };
}
// 3-6 young-core deals and 2-4 star-level deals a season; more likely from the 60% review to the deadline and in the offseason
function ycTry(L, relax) {
  if (!inTradeWindow(L)) return null;
  const g = tradeGoal(L); if (g.yc == null) { g.yc = rint(3, 6); g.star = rint(2, 4); }
  const c = ycCounts(L), needStar = c.st < g.star;
  if (c.yc >= g.yc && !(needStar && c.yc < g.yc + 3)) return null;   // past the goal only for a star-level deal
  const late = L.phase !== 'regular' || L.day >= Math.floor(totalDays(L) * 0.6);
  if (R() > (late ? (needStar ? 0.55 : 0.4) : (needStar ? 0.2 : 0.12))) return null;
  const tr = youngCoreDeal(L, needStar && (c.yc >= g.yc ? 'only' : R() < 0.85));
  if (!tr || typeBlocked(L, tradeType(tr.aGive, tr.bGive), relax)) return null;
  return tr;
}
function youngCoreDeal(L, wantStar) {
  const ai = L.teams.filter(t => t.id !== L.user);
  // teams in the race (hopeful or better) with 2+ young players, not on a hold (they keep the young core); teams that rebuilt within the last 4 seasons are 4x as likely to be the one that deals
  const srcs = ai.filter(t => ['hopeful', 'push', 'contend', 'allin'].includes(t.status) && !t.hold && rosterOf(L, t).filter(ycYoung).length >= 2);
  if (!srcs.length) return null;
  const outer = !TV_MEMO; if (outer) TV_MEMO = new Map();
  try {
    const fns = wantStar === 'only' ? [ycWin] : wantStar || R() < 0.5 ? [ycWin, ycSell] : [ycSell, ycWin];
    const ws = srcs.map(t => t.lowS != null && t.lowS >= L.season - 4 ? 4 : 1);
    for (const f of fns) { const tr = f(L, wpick(srcs, ws), ai, wantStar); if (tr) return tr; }
    return null;
  } finally { if (outer) TV_MEMO = null; }
}
// Win-now: one young player plus assets (picks, at most one more young player) for a clearly better veteran or star from a seller
function ycWin(L, A, ai, wantStar) {
  const rot = rotationOf(L, A), bar = (rot[4] || { ovr: 60 }).ovr;
  const youngs = rosterOf(L, A).filter(p => ycYoung(p) && !p.hardship && !tradeRestricted(L, p) && !(p.injLong && p.injury > 10)).sort((x, y) => playerTV(L, A, y, true) - playerTV(L, A, x, true));
  if (!youngs.length) return null;
  const cands = [];
  for (const B of ai) {
    if (B.id === A.id || B.hold || B.mode === 'contend' || R() > pairKeep(L, A, B)) continue;
    for (const p of rosterOf(L, B)) {
      const ts = tradeStatus(L, p);
      if (p.age < 26 || p.ovr < Math.max(bar + 1, 66) || p.hardship || p.injury > 20 || tradeRestricted(L, p) || (ts && ts.k === 'protect' && !(wantStar && p.ovr >= 78 && p.age >= 27 && !ts.icon)) || (wantStar === 'only' && p.ovr < 78) || !p.contract) continue;   // a star of 27+ can move even from a team that protects him
      cands.push({ p, B });
    }
  }
  cands.sort((x, y) => (y.p.ovr + (wantStar && y.p.ovr >= 78 ? 20 : 0)) - (x.p.ovr + (wantStar && x.p.ovr >= 78 ? 20 : 0)) + (R() - 0.5) * 6);
  for (const { p, B } of cands.slice(0, wantStar ? 14 : 10)) {
    for (const y of youngs.slice(0, 4)) {
      if (p.ovr < y.ovr + 4) continue;
      const needB = playerTV(L, B, p, true) * 1.05, aGive = { players: [y.id], picks: [] }, bGive = { players: [p.id], picks: [] };
      const gbA = [playerTV(L, B, y, false)], caA = [playerTV(L, A, y, true)]; let gotB = gbA[0], costA = caA[0];
      const assets = L.picks.filter(k => k.owner === A.id && k.s >= L.season && !pickUsed(L, k)).map(k => ({ k, vb: pickTV(L, B, k), va: pickTV(L, A, k) })).filter(x => x.vb > 0.1).sort((x, z) => z.vb / Math.max(0.1, z.va) - x.vb / Math.max(0.1, x.va));
      for (const as of assets) { if (gotB >= needB || aGive.picks.length >= 4) break; aGive.picks.push(as.k.id); gbA.push(as.vb); caA.push(as.va); gotB = bundleSum(gbA); costA = bundleSum(caA); }
      if (gotB < needB) { const y2 = youngs.find(z => z.id !== y.id && z.ovr < p.ovr - 6); if (y2) { const v2 = playerTV(L, B, y2, false); if (bundleSum([...gbA, v2]) >= needB) { aGive.players.push(y2.id); gbA.push(v2); caA.push(playerTV(L, A, y2, true)); gotB = bundleSum(gbA); costA = bundleSum(caA); } } }
      if (gotB < needB || gotB > needB * 2.6 + 1) continue;   // a win-now buyer may overpay
      if (playerTV(L, A, p, false) <= costA * 1.02) continue;   // the buyer has to come out ahead by its own valuation
      let err = tradeCheck(L, A.id, B.id, aGive, bGive);
      for (let k = 0; k < 2 && err && /salar|outgoing|hard cap/.test(err); k++) {   // make the money work: send a non-core contract along
        const used = new Set(aGive.players), core = new Set(rot.slice(0, 5).map(x => x.id)), cs = capSeason(L);
        const f = rosterOf(L, A).filter(q => !used.has(q.id) && !core.has(q.id) && !q.hardship && !tradeRestricted(L, q) && q.contract && q.contract.exp >= cs && q.contract.amt >= 2).sort((x, z) => playerTV(L, A, x, true) / x.contract.amt - playerTV(L, A, z, true) / z.contract.amt)[0];
        if (!f) break; aGive.players.push(f.id); err = tradeCheck(L, A.id, B.id, aGive, bGive);
      }
      if (err) continue;
      if (!planOK(L, A, aGive.players, bGive.players, 0, aGive.picks.length) || !planOK(L, B, bGive.players, aGive.players, aGive.picks.length, 0)) continue;
      if (R() > assetKeep(L, A, B, aGive, bGive)) continue;
      const star = p.ovr >= 78;
      return { a: A.id, b: B.id, aGive, bGive, id: 'young-' + Date.now() + '-' + rint(1, 1e6), yc: 'win',
        why: `${star ? 'Young core for a star' : 'Young core for a veteran'}. ${A.abbr} were rebuilding and are now in the race: ${aGive.players.map(id => L.players[id].name).join(' and ')} (${y.age}, ${y.ovr}, scouted ${y.scout}) go${aGive.players.length > 1 ? '' : 'es'} to ${B.abbr}${aGive.picks.length ? ' with ' + aGive.picks.length + ' pick' + (aGive.picks.length > 1 ? 's' : '') : ''} for ${p.name} (${p.ovr}).` };
    }
  }
  return null;
}
// Sell: a young player who is blocked at his position, has a contract running out, or has no place in a win-now plan goes to a team that values him, for picks
function ycSell(L, A, ai) {
  const rot = rotationOf(L, A), cs = capSeason(L), win = A.mode === 'contend' || A.mode === 'hopeful';
  const reason = p => {
    const idx = rot.findIndex(x => x.id === p.id);
    if (idx !== 0 && rot.filter(x => x.pos === p.pos && x.id !== p.id && x.ovr >= p.ovr).length >= 1 && idx > 2) return `blocked at ${POS[p.pos]}`;
    if (p.contract && p.contract.exp <= cs + (L.phase === 'regular' ? 0 : 1) && !p.ext && idx > 2) return 'his contract is up soon';
    if (win && idx > 4) return 'no long-term plan for him';
    return null;
  };
  const ys = rosterOf(L, A).filter(p => ycYoung(p) && !p.hardship && !tradeRestricted(L, p) && !(p.injLong && p.injury > 10) && reason(p)).sort(() => R() - 0.5).slice(0, 2);
  for (const y of ys) for (const B of ai.filter(t => t.id !== A.id).sort(() => R() - 0.5).slice(0, 8)) {
    if (R() > pairKeep(L, A, B)) continue;
    const vA = playerTV(L, A, y, true) * 0.85, vB = playerTV(L, B, y, false);   // a team with a reason to sell values him a bit less
    if (vB < vA * 1.08 || vB < 0.5) continue;
    const opts = L.picks.filter(k => k.owner === B.id && k.s >= L.season && !pickUsed(L, k)).map(k => ({ k, a: pickTV(L, A, k), b: pickTV(L, B, k) })).sort((x, z) => z.a / Math.max(0.1, z.b) - x.a / Math.max(0.1, x.b));
    const bGive = { players: [], picks: [] }; const as = [], bs = [];
    for (const o of opts) { if (bundleSum(as) >= vA * 1.03 || bGive.picks.length >= 4) break; if (bundleSum([...bs, o.b]) > vB / 1.04) continue; bGive.picks.push(o.k.id); as.push(o.a); bs.push(o.b); }
    if (bundleSum(as) < vA * 1.03 || !bGive.picks.length) continue;
    const aGive = { players: [y.id], picks: [] };
    if (tradeCheck(L, A.id, B.id, aGive, bGive)) continue;
    if (!planOK(L, A, aGive.players, [], bGive.picks.length, 0) || !planOK(L, B, [], aGive.players, 0, bGive.picks.length)) continue;
    if (R() > assetKeep(L, A, B, aGive, bGive)) continue;
    return { a: A.id, b: B.id, aGive, bGive, id: 'young-' + Date.now() + '-' + rint(1, 1e6), yc: 'sell',
      why: `Selling a young player. ${A.abbr} move ${y.name} (${y.age}, ${y.ovr}, scouted ${y.scout}) to ${B.abbr} for ${bGive.picks.length} pick${bGive.picks.length > 1 ? 's' : ''}: ${reason(y)}.` };
  }
  return null;
}
// ---- v24 trade overhaul: volume, timing, trade mix and who trades with whom ----
// A season (its schedule plus the offseason after it) aims for 40-50 trades, 65-75% of them in season, mostly near the deadline.
// Mix: about 25% player for player, 20% player for picks, 5-10% picks for picks, the rest players plus picks. A running tally steers each attempt.
const TRADE_MIX = { plyr: 0.25, dump: 0.20, pick: 0.075, mix: 0.475 };
function tradeType(aGive, bGive) {
  const ap = aGive.players.length, bp = bGive.players.length, pk = aGive.picks.length + bGive.picks.length;
  if (!ap && !bp) return 'pick';
  if (ap && bp) return pk ? 'mix' : 'plyr';
  return 'dump';
}
function tradeTypeRec(r) { return tradeType({ players: r.aIn.players, picks: r.aIn.picks }, { players: r.bIn.players, picks: r.bIn.picks }); }
function seasonTrades(L) { return (L.trades || []).filter(r => r.s === L.season); }
// this season's deals as { a, b, type }, including ones waiting for commissioner review (so a burst of attempts sees its own deals)
function seasonDeals(L) {
  return [...seasonTrades(L).map(r => ({ a: r.a, b: r.b, type: tradeTypeRec(r) })), ...(L.pending || []).map(t => ({ a: t.a, b: t.b, type: tradeType(t.aGive, t.bGive) }))];
}
function tradeGoal(L) {
  if (!L.tgoal || L.tgoal.s !== L.season) { const tot = 40 + Math.floor(R() * 11), reg = Math.round(tot * (0.65 + R() * 0.10)); L.tgoal = { s: L.season, tot, reg, off: tot - reg }; }
  return L.tgoal;
}
// trades made so far this season in the regular season (regular = true) or in the offseason, counting deals waiting for commissioner review
function tradeCount(L, regular) {
  let n = 0; for (const r of L.trades || []) if (r.s === L.season && (r.ph === 'regular') === regular) n++;
  return n + ((L.phase === 'regular') === regular ? (L.pending || []).length : 0);
}
// Trade types in the order the season needs them: furthest under its share first, and a type that has hit its cap (picks for picks about 10%) is left out
const TRADE_TOL = { plyr: 0.015, dump: 0.04, pick: 0.015, mix: 0.04 };
function wantOrder(L, all) {
  const g = tradeGoal(L), cnt = { plyr: 0, dump: 0, pick: 0, mix: 0 }; for (const d of seasonDeals(L)) cnt[d.type]++;
  const n = Math.max(g.tot, 1), under = Object.keys(TRADE_MIX).filter(k => all || cnt[k] < typeCap(L, k));
  return under.map(k => ({ k, v: TRADE_MIX[k] * n - cnt[k] + (R() - 0.5) * 3 })).sort((a, b) => b.v - a.v).map(x => x.k);
}
function wantType(L) { return wantOrder(L)[0] || 'mix'; }
function typeFull(L, k) { return !wantOrder(L).includes(k); }
// v24.2: generators that used to bypass the type caps (salary dumps, contender buys, sign-and-trades) check them
function typeCap(L, k) { const n = Math.max(tradeGoal(L).tot, 1); return k === 'pick' ? Math.min(3, Math.floor((TRADE_MIX[k] + TRADE_TOL[k]) * n)) : k === 'dump' ? Math.floor(TRADE_MIX[k] * n) : Math.ceil((TRADE_MIX[k] + TRADE_TOL[k]) * n); }   // picks for picks: at most 3 a season; players for picks: at most 20%
// a type at its cap is blocked; after many misses (relax) a type may go one over, picks for picks never
function typeBlocked(L, k, relax) { if (!typeFull(L, k)) return false; if (!relax || k === 'pick') return true; return seasonDeals(L).filter(d => d.type === k).length >= typeCap(L, k) + (seasonDeals(L).length < 40 ? 3 : 1); }   // a season still under 40 deals may run a type a few over
function gateType(L, tr) { return tr && (typeFull(L, tradeType(tr.aGive, tr.bGive)) || !afterTradeOK(L, tr)) ? null : tr; }   // v25.8: after-trade pick check too
// Where a team stands: top (win-now), bubble (play-in hopeful), low (rebuilding or tanking) or mid (retooling). Status first; the table can move a team once 15 games are in.
let GRP = null, GRP_KEY = '';
function teamGroup(L, t) {
  const key = L.season + '-' + L.phase + '-' + L.day;
  if (GRP_KEY !== key || !GRP) { GRP = {}; GRP_KEY = key; }
  if (GRP[t.id]) return GRP[t.id];
  const st = t.status || ({ contend: 'contend', hopeful: 'hopeful', rebuild: 'rebuild', tank: 'tank' }[t.mode]);
  let g = st === 'tank' || st === 'rebuild' ? 'low' : st === 'allin' || st === 'contend' || st === 'push' ? 'top' : st === 'hopeful' || st === 'rising' ? 'bubble' : 'mid';
  if (L.phase === 'regular' && t.w + t.l >= 15 && g !== 'low') {
    const rk = seedOrder(L, t.conf).indexOf(t.id) + 1, per = L.teams.filter(x => x.conf === t.conf).length, top = Math.max(3, Math.round(per / 3));
    if (rk > 0 && rk <= Math.min(5, top)) g = 'top'; else if (g === 'top' && rk > top + 4) g = 'bubble';
  }
  return GRP[t.id] = g;
}
function needsRelief(L, t) { return payroll(L, t, capSeason(L)) > TAXLINE; }   // a team over the tax line has a real reason to deal
// Chance (0-1) that two teams go ahead with a deal at all. Soft: it makes some pairings rare, not impossible.
function pairKeep(L, A, B) {
  let keep = 1; const ga = teamGroup(L, A), gb = teamGroup(L, B), same = A.conf === B.conf;
  if (ga === 'top' && gb === 'top') keep *= same ? 0.12 : 0.45;                 // contenders: very rare in a conference, less rare across
  if (ga === 'bubble' && gb === 'bubble' && same) keep *= 0.3;                  // play-in hopefuls chasing the same spots
  if (needsRelief(L, A) || needsRelief(L, B)) keep = Math.min(1, keep * 3);     // unless somebody needs to clear money
  if (isRivalry(L, A.id, B.id)) keep = Math.min(keep, 0.02);                  // v24.3: team rivals (conference, playoff, arch) almost never trade, even to clear money
  const list = seasonDeals(L), n = list.length;                                 // keep the conference split about even
  if (n >= 6) { const sc = list.filter(r => L.teams[r.a].conf === L.teams[r.b].conf).length / n; if (same && sc > 0.55) keep *= 0.5; else if (!same && sc < 0.45) keep *= 0.5; }
  return keep;
}
// The part of the rule that depends on what is in the deal: two rebuilding teams don't trade picks or young core players with each other
function assetKeep(L, A, B, aGive, bGive) {
  if (teamGroup(L, A) !== 'low' || teamGroup(L, B) !== 'low') return 1;
  const young = [...aGive.players, ...bGive.players].some(id => { const p = L.players[id]; return p && p.age <= 23 && (p.scout >= 70 || p.ovr >= 65); });
  if (!young && !aGive.picks.length && !bGive.picks.length) return 1;
  return needsRelief(L, A) || needsRelief(L, B) ? 0.6 : 0.2;
}
// v24.1: a team making an offer to you can ask for one of your picks too. Rebuilding teams ask most and aim for the best pick they can afford; contenders ask least and for smaller ones.
// v25.7c: a small final gap in an AI deal is closed with cash before another pick is added (never from cost-cutting owners; about a third of the chances, so cash stays rare)
function aiCash(L, A, B, gap) {
  if (!(gap > 0) || (A.owner && A.owner.tight) || R() > 0.3) return 0;
  const per = cashTV(L, B, 1), room = Math.min(cashRoom(L, A).send, cashRoom(L, B).get);
  if (!(per > 0) || gap > per * CASH_MAX) return 0;
  const c = Math.ceil(gap / per * 2) / 2; return c <= room && c >= 0.5 ? c : 0;
}
// v26.3: AI pick swaps. When an AI team is a little short in a deal, it may offer the other team the right to swap 1sts in one draft
// (about 1 in 3 chances, after cash). It picks the cheapest year whose value to the other team covers the gap (and not more than 2.5x it).
// Value is the same swapPts for both sides, weighted by each team's pick taste, so contenders tend to give swaps to rebuilders.
function aiSwap(L, A, B, gap, inDeal) {
  if (!(gap > 0) || R() > 0.35) return null;
  let best = null;
  for (let s = nextDraftS(L); s <= L.season + PICK_YEARS; s++) {
    const sw = { s, g: A.id, r: B.id }; if (swapCheck(L, sw, inDeal)) continue;
    const v = swapTV(L, B, [sw]); if (v >= gap && v <= gap * 2.5 + 0.2 && (!best || v < best.v)) best = { sw, v };
  }
  if (best) SWAP_CNT.made++;
  return best ? best.sw : null;
}
const SWAP_CNT = { made: 0 };
function askPick(L, A, B, cap) {
  const g = teamGroup(L, A);
  if (R() > (g === 'low' ? 0.7 : g === 'mid' ? 0.45 : g === 'bubble' ? 0.3 : 0.2)) return null;
  const ks = L.picks.filter(k => k.owner === B.id && k.s >= L.season && !pickUsed(L, k)).map(k => ({ k, v: pickTV(L, A, k) })).filter(x => x.v > 0.15 && x.v <= cap).sort((x, y) => y.v - x.v);
  return ks.length ? (g === 'low' ? ks[0] : ks[ks.length - 1]).k : null;
}
// Attempts until the season's count reaches stopAt (or the tries run out). Returns how many deals were made.
function aiTradeRound(L, maxTries, stopAt, regular) {
  let made = 0;
  for (let i = 0; i < maxTries; i++) {
    if (stopAt != null && tradeCount(L, regular) >= stopAt) break;
    if (runAITrade(L, null, 4, i > 150)) made++;   // v24.2: each attempt walks down all four wanted types; after 150 misses the type caps are lifted
  }
  return made;
}
// In season: the cumulative target rises slowly, then steeply toward the deadline; deadline day fills the rest (see deadlineFrenzy)
function dailyTrades(L) {
  const g = tradeGoal(L), o = tradeOpenDay(L), d = deadlineDay(L);
  const f = Math.min(1, Math.max(0, (L.day - o + 1) / Math.max(1, d - 1 - o)));
  const target = Math.round(g.reg * 0.78 * Math.pow(f, 2.3));
  if (R() < 0.1 || tradeCount(L, true) >= target) return;
  aiTradeRound(L, 20, target, true);
}
// Player for picks: a team that isn't contending sells a veteran to a team that values him more, for picks the seller values at least as much
function vetForPicks(L) {
  const ai = L.teams.filter(t => t.id !== L.user), sellers = ai.filter(t => ['low', 'mid'].includes(teamGroup(L, t)));
  if (!sellers.length) return null;
  const A = pick(sellers), top2 = new Set(rotationOf(L, A).slice(0, 2).map(p => p.id));
  const vets = rosterOf(L, A).filter(p => p.age >= 26 && p.ovr >= 60 && !p.hardship && !(p.injLong && p.injury > 10) && !tradeRestricted(L, p) && !((tradeStatus(L, p) || {}).k === 'protect') && !top2.has(p.id)).sort((x, y) => sellLeverage(L, A, x).m - sellLeverage(L, A, y).m + (R() - 0.5) * 0.3).slice(0, 3);   // v25.8 S1b: sellers with a reason (asked out, expiring, old on a rebuilder) go first
  for (const p of vets) for (const B of ai.filter(t => t.id !== A.id).sort(() => R() - 0.5).slice(0, 8)) {
    if (R() > pairKeep(L, A, B)) continue;
    const vA = playerTV(L, A, p, true), vB = playerTV(L, B, p, false);
    if (vB < vA * 1.08 || vB < 0.5) continue;
    const opts = L.picks.filter(k => k.owner === B.id && k.s >= L.season && !pickUsed(L, k)).map(k => ({ k, a: pickTV(L, A, k), b: pickTV(L, B, k) })).sort((x, y) => y.a / Math.max(0.1, y.b) - x.a / Math.max(0.1, x.b));
    const bGive = { players: [], picks: [] }; const as = [], bs = [];
    for (const o of opts) { if (bundleSum(as) >= vA * 1.03 || bGive.picks.length >= 4) break; if (bundleSum([...bs, o.b]) > vB / 1.04) continue; bGive.picks.push(o.k.id); as.push(o.a); bs.push(o.b); }
    if (bundleSum(as) < vA * 1.03 || !bGive.picks.length) continue;
    const aGive = { players: [p.id], picks: [] };
    if (tradeCheck(L, A.id, B.id, aGive, bGive)) continue;
    if (!planOK(L, A, aGive.players, [], bGive.picks.length, 0) || !planOK(L, B, [], aGive.players, 0, bGive.picks.length)) continue;
    if (R() > assetKeep(L, A, B, aGive, bGive)) continue;
    return { a: A.id, b: B.id, aGive, bGive, id: Date.now() + '-' + rint(1, 1e6), why: tradeWhy(L, B, A, p, bGive) };
  }
  return null;
}
// Picks for picks: two teams swap picks to fit their timelines (rebuilders like later years, contenders sooner), so both come out ahead
function pickSwap(L) {
  const ai = L.teams.filter(t => t.id !== L.user), A = pick(ai);
  const hz = (t, k) => { const g = teamGroup(L, t); return 1 + (g === 'low' ? 0.12 : g === 'top' ? -0.10 : 0) * Math.min(3, Math.max(0, k.s - L.season)); };   // v26.2: capped (picks now go 6 years out)
  const val = (t, k) => pickTV(L, t, k) * hz(t, k);
  const own = t => L.picks.filter(k => k.owner === t.id && k.s >= L.season && !pickUsed(L, k));
  const sample = (arr, n) => arr.slice().sort(() => R() - 0.5).slice(0, n);
  const pa = own(A); if (pa.length < 2) return null;
  for (const B of sample(ai.filter(t => t.id !== A.id), 8)) {
    if (R() > pairKeep(L, A, B)) continue;
    const pb = own(B); if (pb.length < 2) continue;
    for (let i = 0; i < 25; i++) {
      const xs = sample(pa, 1 + (R() < 0.3 ? 1 : 0)), ys = sample(pb, 1 + (R() < 0.3 ? 1 : 0));
      const sum = (t, ks) => bundleSum(ks.map(k => val(t, k)));
      const aGets = sum(A, ys), aGave = sum(A, xs), bGets = sum(B, xs), bGave = sum(B, ys);
      let cash = 0, from = null;   // v25.7c: a side a hair short is made whole with cash from the other
      if ((aGets < aGave * 1.06 || bGets < bGave * 1.06) && R() < 0.3) {
        const shortA = aGets < aGave * 1.06, S = shortA ? A : B, G = shortA ? B : A, sGets = shortA ? aGets : bGets, sGave = shortA ? aGave : bGave, gGets = shortA ? bGets : aGets, gGave = shortA ? bGave : aGave;
        if (!(G.owner && G.owner.tight)) for (let c = 0.5; c <= CASH_MAX + 1e-9; c += 0.5) if (sGets + cashTV(L, S, c) >= sGave * 1.06 && gGets - cashTV(L, G, c) >= gGave * 1.06) { cash = c; from = G; break; }
      }
      if (!cash && (aGets < aGave * 1.06 || bGets < bGave * 1.06 || aGets > aGave * 1.5 || bGets > bGave * 1.5)) continue;
      const aGive = { players: [], picks: xs.map(k => k.id) }, bGive = { players: [], picks: ys.map(k => k.id) };
      if (cash) (from === A ? aGive : bGive).cash = cash;
      if (tradeCheck(L, A.id, B.id, aGive, bGive)) continue;
      return { a: A.id, b: B.id, aGive, bGive, id: 'pks-' + Date.now() + '-' + rint(1, 1e6), why: `Pick swap · ${A.abbr} and ${B.abbr} move picks to fit their timelines.` };
    }
  }
  return null;
}
function processPending(L) {
  const list = L.pending || []; L.pending = [];
  for (const tr of list) {
    const stillOwned = tr.aGive.players.every(id => L.players[id].team === tr.a) && tr.bGive.players.every(id => L.players[id].team === tr.b)
      && tr.aGive.picks.every(pk => L.picks.find(k => k.id === pk && k.owner === tr.a)) && tr.bGive.picks.every(pk => L.picks.find(k => k.id === pk && k.owner === tr.b));
    const iconOut = [[tr.aGive.players, tr.a], [tr.bGive.players, tr.b]].some(([ids, from]) => from !== L.user && ids.some(id => iconTier(L, L.players[id], from) === 2 && L.players[id].tradeReq !== L.season));   // v27 L2: an AI team never sends out its franchise icon unless he asked out
    if (stillOwned && !iconOut && !tradeCheck(L, tr.a, tr.b, tr.aGive, tr.bGive)) executeTrade(L, tr);
  }
}
function approveTrade(L, id) {
  const tr = L.pending.find(x => x.id === id); if (!tr) return;
  L.pending = L.pending.filter(x => x.id !== id);
  const ok = tr.aGive.players.every(pid => L.players[pid].team === tr.a) && tr.bGive.players.every(pid => L.players[pid].team === tr.b) && !tradeCheck(L, tr.a, tr.b, tr.aGive, tr.bGive);
  if (ok) executeTrade(L, tr);
}
function vetoTrade(L, id) {
  const tr = L.pending.find(x => x.id === id); if (!tr) return;
  L.pending = L.pending.filter(x => x.id !== id);
  logNews(L, `Commissioner vetoed: ${L.teams[tr.a].abbr} get ${describe(L, tr.bGive)}; ${L.teams[tr.b].abbr} get ${describe(L, tr.aGive)}`, tr.a, 'trade');
}
// User proposes: user gives `give`, receives `get` from AI team
function evaluateUserTrade(L, aiTid, give, get) {
  const me = L.user, AI = L.teams[aiTid];
  if (!inTradeWindow(L)) return { ok: false, msg: 'Trades are closed right now. In-season trading runs from the 25% to the 70% mark of the schedule, and trades reopen in the offseason.' };
  if (!give.players.length && !give.picks.length && !get.players.length && !get.picks.length && !(give.swaps || []).length && !(get.swaps || []).length) return { ok: false, msg: 'Add players or picks to both sides.' };
  const err = tradeCheck(L, me, aiTid, give, get);
  if (err) return { ok: false, msg: err + '.' };
  const prot = get.players.map(id => L.players[id]).find(p => { const s = tradeStatus(L, p); return s && s.k === 'protect'; });
  if (prot) return { ok: false, msg: `${AI.abbr} won't discuss ${prot.name}: he's protected (${tradeStatus(L, prot).why.toLowerCase()}).` };
  const sides = tradeSides(me, aiTid, give, get), view = dealView(L, AI, me, give, get, sides);   // v25.8: picks on the rosters after the deal, front-office style, leverage, weekly noise
  const gain = view.gain, loss = view.loss;
  const fc = fitCheck(L, AI, get.players, give.players);
  if (fc.worse) return { ok: false, msg: `${AI.abbr} say no: it would leave their rotation lopsided at one position.` };
  const why = view.notes.length ? ` (${[...new Set(view.notes)].slice(0, 3).join('; ')})` : '';
  const DK = diffK(L).trade;   // Phase B: difficulty (Normal 1.05 as before)
  if (gain >= loss * DK) return { ok: true, msg: `${AI.abbr} accept${why}.` };
  const deficit = loss * DK - gain;
  { const per = cashTV(L, AI, 1), room = Math.min(cashRoom(L, L.teams[me]).send - (give.cash || 0), cashRoom(L, AI).get - (give.cash || 0)), c = per > 0 ? Math.ceil(deficit / per * 2) / 2 : 99;   // v25.7c: a small gap can be closed with cash
    if (c <= room && !(get.cash > 0)) return { ok: false, msg: `${AI.abbr} (${MODE_LABEL[AI.mode].toLowerCase()}) want a little more. They would accept if you add ${money(c)} cash.`, suggest: { t: 'c', amt: c, name: money(c) + ' cash' } }; }
  const mine = [...rosterOf(L, L.teams[me]).filter(p => !give.players.includes(p.id)).map(p => ({ t: 'p', id: p.id, v: playerTV(L, AI, p, false), name: p.name })),
    ...L.picks.filter(k => k.owner === me && !give.picks.includes(k.id) && k.s >= L.season && !pickUsed(L, k)).map(k => ({ t: 'k', id: k.id, v: withCtx(sides, () => pickTV(L, AI, k)) * foPickMult(L, AI), name: pickLabel(L, k) }))]
    .filter(x => x.v >= deficit).sort((x, y) => x.v - y.v);
  for (const s of mine) {
    const g2 = { players: s.t === 'p' ? [...give.players, s.id] : give.players, picks: s.t === 'k' ? [...give.picks, s.id] : give.picks };
    if (!tradeCheck(L, me, aiTid, g2, get)) return { ok: false, msg: `${AI.abbr} (${MODE_LABEL[AI.mode].toLowerCase()}) want more. They would accept if you add ${s.name}.`, suggest: s };
  }
  return { ok: false, msg: `${AI.abbr} (${MODE_LABEL[AI.mode].toLowerCase()}) say the value isn't close. Try asking for less or offering more.` };
}

// ---------- Game records ----------
const REC_KEYS = { pts: 'Points', reb: 'Rebounds', ast: 'Assists', stl: 'Steals', blk: 'Blocks', tpm: '3-pointers made', ftm: 'Free throws made', fgm: 'Field goals made', orb: 'Off. rebounds' };
function gmsc(r) { // r = [min,pts,fgm,fga,tpm,tpa,ftm,fta,orb,drb,ast,stl,blk,tov,pf]
  return r[1] + 0.4 * r[2] - 0.7 * r[3] - 0.4 * (r[7] - r[6]) + 0.7 * r[8] + 0.3 * r[9] + r[11] + 0.7 * r[10] + 0.7 * r[12] - 0.4 * r[14] - r[13];
}
// v18: did he play well? Game score vs his average, a big night on the boards, passing or defense, efficiency, or plus/minus
function standout(p, row) {
  const v = k => row[2 + IX[k]], r = row.slice(2, 17), gs = gmsc(r), s = p.stats && p.stats.rs, avg = s && s.gp ? gmsc(seasonLine(s)) / s.gp : 10;
  const reb = v('orb') + v('drb'), fga = v('fga'), ts = fga + v('fta') ? v('pts') / (2 * (fga + 0.44 * v('fta'))) : 0, avgTs = s && s.fga ? s.pts / (2 * (s.fga + 0.44 * s.fta)) : 0.55;
  const bits = [];
  if (gs >= avg + 6 || gs >= 20) bits.push(`${v('pts')} pts`);
  if (reb >= 12) bits.push(`${reb} reb`);
  if (v('ast') >= 10) bits.push(`${v('ast')} ast`);
  if (v('stl') >= 3 || v('blk') >= 3 || v('stl') + v('blk') >= 5) bits.push([v('stl') ? `${v('stl')} stl` : '', v('blk') ? `${v('blk')} blk` : ''].filter(Boolean).join(', '));
  if (fga >= 10 && ts >= avgTs + 0.1) bits.push(`${Math.round(ts * 100)}% TS`);
  if (v('pm') >= 15 && v('min') >= 24 * 60) bits.push(`+${v('pm')}`);
  if (!bits.length) return null;
  if (!bits.some(b => /pts/.test(b))) bits.unshift(`${v('pts')} pts`);
  return bits.join(', ');
}
// v17: revenge games (first meeting with the old team each season) and player rivalries
function specialNews(L, g) {
  for (const x of g.special || []) {
    const p = L.players[x.pid]; if (!p) continue;
    const row = g.box.find(r => r[0] === p.id); if (!row) continue;
    const tid = row[1] === 0 ? g.home : g.away, opp = row[1] === 0 ? g.away : g.home, won = row[1] === 0 ? g.hs > g.as : g.as > g.hs;
    const line = `${row[2 + IX.pts]} pts, ${row[2 + IX.orb] + row[2 + IX.drb]} reb, ${row[2 + IX.ast]} ast`;
    if (x.grudge) { const gr = (p.grudge || []).find(q => q.tid === opp && q.until >= L.season); if (gr && (gr.perm ? gr.hit !== L.season * 1000 + (L.day || 0) : gr.hit !== L.season) && !g.playoff) { gr.hit = gr.perm ? L.season * 1000 + (L.day || 0) : L.season; const st = standout(p, row); if (st) logNews(L, gr.perm ? `Rivalry game: ${p.name} vs ${L.teams[opp].abbr}: ${st}${won ? ', and won' : ''} (${gr.why})` : `Revenge game: ${p.name} vs his old team ${L.teams[opp].abbr}: ${st}${won ? ', and won' : ''} (first meeting since ${gr.why})`, tid, 'game'); } }
    if (x.rival != null && p.id < x.rival) {   // count each rivalry meeting once
      const r = (L.rivals || []).find(q => q.until >= L.season && ((q.a === p.id && q.b === x.rival) || (q.b === p.id && q.a === x.rival))); if (!r) continue;
      const oRow = g.box.find(rr => rr[0] === x.rival); if (!oRow) continue;
      const winner = won ? p.id : x.rival; r.w = r.w || {}; r.w[winner] = (r.w[winner] || 0) + 1;
      if (r.hit !== L.season) { r.hit = L.season; const q = L.players[x.rival]; logNews(L, `Rivalry: ${p.name} vs ${q.name}: ${line} against ${oRow[2 + IX.pts]} pts (${L.players[winner].name}'s team won)`, null, 'game'); }
    }
  }
}
// v18: player head-to-head (players rated 72+, both played): wins for each side
function trackP2P(L, g) {
  const won0 = g.hs > g.as, H = [], A = [];
  for (const r of g.box) { const p = L.players[r[0]]; if (!p || p.ovr < 72 || !r[2]) continue; (r[1] === 0 ? H : A).push(p.id); }
  if (!H.length || !A.length) return; L.p2p = L.p2p || {};
  for (const a of H) for (const b of A) { const k = a < b ? a + '-' + b : b + '-' + a, rec = L.p2p[k] = L.p2p[k] || [0, 0]; const aWon = won0; const lowWon = a < b ? aWon : !aWon; rec[lowWon ? 0 : 1]++; }
}
function p2pRecord(L, a, b) { const k = a < b ? a + '-' + b : b + '-' + a, r = (L.p2p || {})[k]; if (!r) return null; return a < b ? { w: r[0], l: r[1] } : { w: r[1], l: r[0] }; }
function recordGame(L, g) {
  try { recordGame0(L, g); } finally { try { mediaGame(L, g); } catch (e) { } try { lr2Game(L, g); if (g.playoff && L.user != null && (g.home === L.user || g.away === L.user) && !/Play-in/.test(g.stage || '')) ivTrigger(L, 'playoffs'); } catch (e) { } }   // v28.8: discipline, playoff interview   // v26.5: reactions, posts, press triggers after the game is recorded
}
function recordGame0(L, g) {
  try { specialNews(L, g); } catch (e) { }
  try { if (!g.playoff || true) trackP2P(L, g); } catch (e) { }
  try { tourNews(L, g); } catch (e) { }
  const lb = g.playoff ? `${g.stage} G${g.gnum}` : `Day ${g.day + 1}`;
  // usage rate: team possessions used (FGA + 0.44 FTA + TO) and minutes per side, for USG%
  const side = [0, 1].map(si => { let use = 0, min = 0; for (const r of g.box) if (r[1] === si) { use += r[5] + 0.44 * r[9] + r[15]; min += r[2]; } return { use, min }; });
  for (const row of g.box) { const p = L.players[row[0]]; const st = p && p.stats[g.playoff ? 'po' : 'rs']; if (!st || !row[2]) continue; const sd = side[row[1]]; st.usgDen = (st.usgDen || 0) + sd.use * (row[2] * 5 / Math.max(1, sd.min)); }
  // v22: season clutch totals (regular season): games with clutch minutes, points, FGA, FGM, plus/minus, go-ahead buckets
  if (g.cl && !g.playoff) for (const id in g.cl) { const p = L.players[id]; if (!p || !p.stats) continue; const c = p.stats.cl || (p.stats.cl = [0, 0, 0, 0, 0, 0]), v = g.cl[id]; c[0]++; for (let i = 0; i < 5; i++) c[i + 1] += v[i]; }
  for (const row of g.box) {
    const p = L.players[row[0]]; if (!p) continue;
    const r = row.slice(2, 17); const tid = row[1] === 0 ? g.home : g.away, opp = row[1] === 0 ? g.away : g.home;
    const key = g.playoff ? 'po' : 'rs';
    const s = p.stats[key]; if (s) { s.teams = s.teams || []; if (!s.teams.includes(tid)) s.teams.push(tid); }
    const vals = { pts: r[1], reb: r[8] + r[9], ast: r[10], stl: r[11], blk: r[12], tpm: r[4], ftm: r[6], fgm: r[2], orb: r[8] };
    const ctx = { s: L.season, lb, tid, opp, po: g.playoff, gid: g.id };
    for (const k in vals) {
      const h = p.highs[k];
      if (vals[k] > 0 && (!h || vals[k] > h.v)) p.highs[k] = { v: vals[k], ...ctx };
      { const tr = L.teams[tid]; if (tr && vals[k] > 0) { const gr = tr.grec = tr.grec || { rs: {}, po: {} }, b = gr[key]; if (!b[k] || vals[k] > b[k].v) b[k] = { v: vals[k], pid: p.id, name: p.name, s: L.season, opp, gid: g.id }; } }   // v15 franchise single-game records
      const list = L.records.game[k] = L.records.game[k] || [];
      if (vals[k] > 0 && (list.length < 100 || vals[k] > list[list.length - 1].v)) {
        list.push({ v: vals[k], pid: p.id, name: p.name, ...ctx }); list.sort((a, b) => b.v - a.v); if (list.length > 100) list.length = 100;
      }
    }
    countFeats(L, p, r, g.playoff);
    const tags = [];
    if (r[1] >= 50) tags.push(r[1] + ' points'); if (vals.reb >= 20) tags.push(vals.reb + ' rebounds'); if (r[10] >= 15) tags.push(r[10] + ' assists');
    if (r[11] >= 7) tags.push(r[11] + ' steals'); if (r[12] >= 7) tags.push(r[12] + ' blocks'); if (r[4] >= 10) tags.push(r[4] + ' threes');
    if ([r[1], vals.reb, r[10], r[11], r[12]].filter(x => x >= 10).length >= 3) tags.push('Triple-double');
    if (tags.length) {
      p.best.push({ ...ctx, line: r, tags, gs: r1(gmsc(r)) });
      p.best.sort((a, b) => b.gs - a.gs); if (p.best.length > 30) p.best.length = 30;
      logNews(L, `${p.name} (${L.teams[tid].abbr}): ${tags.join(', ')} vs ${L.teams[opp].abbr}`, tid, 'feat');
    }
  }
  for (const inj of g.inj) {
    const p = L.players[inj.pid]; if (!p) continue;
    let ce = false;
    if (inj.severe && R() < (NBA_ON ? 0.04 + (p.age >= 32 ? 0.08 : 0) : 0.1 + (p.age >= 30 ? 0.15 : 0))) { ce = true; p.careerEnd = true; }   // v27 N8: NBA mode: real stars come back from ACL / Achilles (was 25% career-ending at 30+)
    p.injuries.push({ s: L.season, lb, games: inj.games, long: inj.long, ce, name: inj.name, part: injPart(inj.name), rep: p.injRepeat || undefined });
    if (p.injSE && p.team != null) { const left = Math.max(0, SEASON_GAMES - (L.teams[p.team].w + L.teams[p.team].l)); logNews(L, flL(L, 'news.injLong', { name: p.name, team: L.teams[p.team].abbr, injury: (inj.name || 'injury').toLowerCase(), games: inj.games, next: inj.games > left + SE_SUMMER ? `, into next season` : '' }), p.team, 'inj'); L.seInj = (L.seInj || 0) + 1; }   // v24.5
    { const rec = p.injuries.filter(x => x.s >= L.season - 1 && x.games >= 5); if (rec.length >= 3 && p.prone !== L.season) { p.prone = L.season; logNews(L, `${p.name} is getting an injury-prone label: ${rec.length} injuries of 5+ games in two seasons`, p.team, 'inj'); } }
    let extra = '';
    const t = L.teams[inj.tid];
    if (!g.playoff && p.contract && p.contract.amt >= 10 && inj.games >= SEASON_GAMES - (t.w + t.l) && p.contract.exp >= L.season) { p.capRelief = L.season; extra = '. Out for the season: 50% cap relief'; }
    logNews(L, flL(L, 'news.injury', { name: p.name, team: t.abbr, injury: inj.name || 'injury', games: inj.games, s: inj.games > 1 ? 's' : '', ce: ce ? '. The injury may end his career' : '', extra }), inj.tid, 'inj');
    try { feedInjury(L, p, inj.tid, inj.games, inj.name); } catch (e) { }   // v26.5
  }  // v24.7: players who played through a day-to-day injury: counted, and sometimes it gets worse (a few more games out)
  for (const pid of g.hurt || []) {
    const p = L.players[pid]; if (!p || g.inj.some(x => x.pid === pid)) continue;
    const ss = p.hurtLog = p.hurtLog && p.hurtLog.s === L.season ? p.hurtLog : { s: L.season, gp: 0, aggr: 0 }; ss.gp++;
    if (p.injury > 0 && R() < ENG.aggr + 0.02 * p.injury) {
      const add = rint(2, 6), tid = p.team; p.injury = Math.round((p.injury + add) * 1000) / 1000; p.injLong = p.injury >= 14; p.hurtPlan = null; ss.aggr++;
      const last = (p.injuries || []).slice().reverse().find(x => x.name === p.injName); if (last) { last.games += add; last.aggr = true; }
      if (tid != null) logNews(L, `${p.name} (${L.teams[tid].abbr}) aggravated his ${(p.injName || 'injury').toLowerCase()} playing through it: out about ${injGames(p)} more games`, tid, 'inj');
    }
  }
}

// ---------- Feats: how often players reach single-game milestones ----------
// r = box line [min,pts,fgm,fga,tpm,tpa,ftm,fta,orb,drb,ast,stl,blk,tov,pf,gs,pm]
const FEATS = [
  ['pts', 'points', r => r[1], [30, 40, 50, 60, 70, 80, 90, 100]],
  ['reb', 'rebounds', r => r[8] + r[9], [10, 15, 20, 25, 30]],
  ['ast', 'assists', r => r[10], [10, 15, 20, 30]],
  ['stl', 'steals', r => r[11], [5, 10]],
  ['blk', 'blocks', r => r[12], [5, 10]],
  ['tpm', 'threes made', r => r[4], [5, 8, 10, 12]],
  ['ftm', 'free throws made', r => r[6], [10, 15, 20]],
  ['fgm', 'field goals made', r => r[2], [15, 20]],
  ['orb', 'offensive rebounds', r => r[8], [8, 12]],
  ['drb', 'defensive rebounds', r => r[9], [15, 20]],
  ['gmsc', 'game score', r => gmsc(r), [30, 40, 50]],
  ['pm', 'plus-minus', r => r[16] || 0, [30, 40]]
];
const MULTI_FEATS = [['dd', 'Double-doubles', 2], ['td', 'Triple-doubles', 3], ['qd', 'Quadruple-doubles', 4]];
function featList() {
  const out = [];
  for (const [k, n, , th] of FEATS) for (const x of th) out.push({ key: k + x, label: `${x}+ ${n}`, cat: k });
  for (const [k, n] of MULTI_FEATS) out.push({ key: k, label: n, cat: 'multi' });
  return out;
}
function countFeats(L, p, r, po) {
  const side = po ? 'po' : 'rs';
  L.feats = L.feats || { rs: {}, po: {} }; L.featsBy = L.featsBy || {};
  p.feats = p.feats || { rs: {}, po: {} };
  const by = L.featsBy[L.season] = L.featsBy[L.season] || {};
  const add = key => { p.feats[side][key] = (p.feats[side][key] || 0) + 1; L.feats[side][key] = (L.feats[side][key] || 0) + 1; if (!po) by[key] = (by[key] || 0) + 1; };
  for (const [k, , f, th] of FEATS) { const v = f(r); for (const x of th) if (v >= x) add(k + x); }
  const tens = [r[1], r[8] + r[9], r[10], r[11], r[12]].filter(x => x >= 10).length;
  for (const [k, , n] of MULTI_FEATS) if (tens >= n) add(k);
}

// ---------- Box plus-minus (an estimate built from the box score, per 100 possessions) ----------
// Offense: scoring, passing, offensive boards, minus misses and turnovers. Defense: defensive boards, steals, blocks, minus fouls.
// Both are measured against the league average, then each team's players are shifted so they add up to the team's
// offensive and defensive ratings (the same team adjustment real BPM uses).
function computeBPM(L, key, force) {
  const ck = key + ':' + L.season + ':' + L.phase + ':' + L.day + ':' + (L.po ? L.po.day : 0);
  if (!force && (L._bpm || {})[key] === ck) return;
  (L._bpm = L._bpm || {})[key] = ck;
  const tkey = key === 'po' ? 'tpo' : 'trs';
  const rows = [];
  let tp = 0, tposs = 0, tmin = 0;
  const adv = {};
  for (const t of L.teams) { const x = t[tkey]; if (!x || !x.g) continue; const poss = ((x.fga - x.orb + x.tov + 0.44 * x.fta) + (x.ofga - x.oorb + x.otov + 0.44 * x.ofta)) / 2; adv[t.id] = { poss, ortg: 100 * x.pts / poss, drtg: 100 * x.opts / poss, min: x.min * 5 }; tp += x.pts; tposs += poss; tmin += x.min; }
  if (!tposs) return;
  const lgRtg = 100 * tp / tposs, possPer48 = tposs / (tmin / 48);
  for (const p of Object.values(L.players)) {
    const s = p.stats && p.stats[key]; if (!s || !s.gp || !s.min) continue;
    const poss = s.min / 60 / 48 * possPer48; if (poss <= 0) continue;
    const k = 100 / poss;
    const o = k * (0.55 * s.pts + 0.8 * s.ast + 0.65 * s.orb - 0.9 * s.tov - 0.32 * (s.fga - s.fgm) - 0.15 * (s.fta - s.ftm));
    const d = k * (0.32 * s.drb + 1.4 * s.stl + 0.9 * s.blk - 0.25 * s.pf);
    // team minutes split (traded players count for each team they played for)
    const split = p.stats[key + 'T'];
    const parts = split ? Object.entries(split).map(([tid, x]) => [+tid, x.min || 0]) : (p.team != null ? [[p.team, s.min]] : []);
    rows.push({ s, o, d, min: s.min, parts });
  }
  const wavg = f => { let a = 0, w = 0; for (const r of rows) { a += f(r) * r.min; w += r.min; } return w ? a / w : 0; };
  const mo = wavg(r => r.o), md = wavg(r => r.d);
  const so = Math.sqrt(wavg(r => (r.o - mo) ** 2)) || 1, sd = Math.sqrt(wavg(r => (r.d - md) ** 2)) || 1;
  for (const r of rows) { r.ob = (r.o - mo) / so * 2.6; r.db = (r.d - md) / sd * 1.5; }
  // team adjustment: minutes-weighted sum of a team's players should match its rating vs league average
  const sumO = {}, sumD = {};
  for (const r of rows) for (const [tid, m] of r.parts) { if (!adv[tid]) continue; const sh = 5 * (m / 60) / adv[tid].min; /* m is in seconds; shares sum to 5 per team */ sumO[tid] = (sumO[tid] || 0) + r.ob * sh; sumD[tid] = (sumD[tid] || 0) + r.db * sh; }
  const adjO = {}, adjD = {};
  for (const tid in adv) { adjO[tid] = ((adv[tid].ortg - lgRtg) - (sumO[tid] || 0)) / 5; adjD[tid] = ((lgRtg - adv[tid].drtg) - (sumD[tid] || 0)) / 5; }
  for (const r of rows) {
    let ao = 0, ad = 0, mw = 0; for (const [tid, m] of r.parts) if (adv[tid]) { ao += adjO[tid] * m; ad += adjD[tid] * m; mw += m; }
    if (mw) { ao /= mw; ad /= mw; }
    r.s.obpm = Math.round((r.ob + ao) * 10) / 10; r.s.dbpm = Math.round((r.db + ad) * 10) / 10; r.s.bpm = Math.round((r.s.obpm + r.s.dbpm) * 10) / 10;
  }
}

// ---------- v33c: the game's own PER, USG%, win shares and VORP (Basketball-Reference formulas) ----------
// Same inputs as computeBPM: each player's box line per team (stats.rsT / poT), that team's totals for and against, league totals.
// PER: Hollinger's unadjusted PER, times league pace / team pace, scaled so the minutes-weighted league average is 15.
// USG%: share of team plays used while on the floor. OWS: points produced (Oliver) minus 0.92 x league points per possession x
// possessions used; DWS: minutes share x team defensive possessions x (1.08 x league points per possession - individual defensive
// rating / 100); both divided by marginal points per win (0.32 x league points per game x team pace / league pace). WS/48 = WS per 48
// minutes. VORP = (BPM + 2) x minutes / (48 x 82). Traded players: each team stint uses that team's context; WS add up, PER / USG% are minutes-weighted.
const ADV_KEYS = ['per', 'usg', 'ows', 'dws', 'ws', 'ws48', 'vorp'];
function advTeamCtx(x) {
  const T = {}, O = {};
  for (const k of TS_KEYS) { T[k] = x[k] || 0; O[k] = x['o' + k] || 0; }
  T.mp = O.mp = 5 * x.min;                  // player-minutes (x.min = game minutes incl. overtime)
  const half = (a, b) => a.fga + 0.4 * a.fta - 1.07 * (a.orb / Math.max(1, a.orb + b.drb)) * (a.fga - a.fgm) + a.tov;
  T.poss = O.poss = 0.5 * (half(T, O) + half(O, T));
  T.pace = 48 * T.poss / Math.max(1, x.min); T.g = x.g;
  return { T, O };
}
// one stint: box line s (min in seconds) with team context T / O and league lg. Returns the parts to combine.
function advStint(s, T, O, lg) {
  const MP = (s.min || 0) / 60; if (MP <= 0) return null;
  const nz = v => v || 0, FG = nz(s.fgm), FGA = nz(s.fga), TP = nz(s.tpm), FT = nz(s.ftm), FTA = nz(s.fta), ORB = nz(s.orb), DRB = nz(s.drb), TRB = ORB + DRB,
    AST = nz(s.ast), STL = nz(s.stl), BLK = nz(s.blk), TOV = nz(s.tov), PF = nz(s.pf), PTS = nz(s.pts);
  // PER (unadjusted, then pace)
  const tAF = T.fgm ? T.ast / T.fgm : 0, V = lg.vop, D = lg.drbp;
  const uPER = (1 / MP) * (TP + (2 / 3) * AST + (2 - lg.factor * tAF) * FG + FT * 0.5 * (1 + (1 - tAF) + (2 / 3) * tAF) - V * TOV - V * D * (FGA - FG) - V * 0.44 * (0.44 + 0.56 * D) * (FTA - FT)
    + V * (1 - D) * (TRB - ORB) + V * D * ORB + V * STL + V * D * BLK - PF * ((lg.ftm / lg.pf) - 0.44 * (lg.fta / lg.pf) * V));
  const aPER = uPER * lg.pace / Math.max(1e-6, T.pace);
  const usg = 100 * ((FGA + 0.44 * FTA + TOV) * (T.mp / 5)) / (MP * Math.max(1e-6, T.fga + 0.44 * T.fta + T.tov));
  // offense: points produced and possessions (Dean Oliver)
  const sh = MP / (T.mp / 5), ftp = FTA ? FT / FTA : 0, tftp = T.fta ? T.ftm / T.fta : 0;
  const qd = (T.fgm / T.mp) * MP * 5 - FG;
  const qAST = sh * (1.14 * ((T.ast - AST) / Math.max(1, T.fgm))) + (qd > 0 ? (((T.ast / T.mp) * MP * 5 - AST) / qd) : 0) * (1 - sh);
  const pfr = FGA ? (PTS - FT) / (2 * FGA) : 0, oFGA = T.fga - FGA;
  const FGp = FG * (1 - 0.5 * pfr * qAST);
  const ASTp = oFGA > 0 ? 0.5 * (((T.pts - T.ftm) - (PTS - FT)) / (2 * oFGA)) * AST : 0;
  const FTp = FTA ? (1 - (1 - ftp) ** 2) * 0.4 * FTA : 0;
  const tSc = T.fgm + (1 - (1 - tftp) ** 2) * T.fta * 0.4;
  const tORBp = T.orb / Math.max(1, T.orb + (O.orb + O.drb - O.orb));
  const tPlay = tSc / Math.max(1, T.fga + T.fta * 0.4 + T.tov);
  const tORBw = ((1 - tORBp) * tPlay) / Math.max(1e-6, (1 - tORBp) * tPlay + tORBp * (1 - tPlay));
  const ORBp = ORB * tORBw * tPlay, cut = 1 - (T.orb / Math.max(1, tSc)) * tORBw * tPlay;
  const ScPoss = (FGp + ASTp + FTp) * cut + ORBp;
  const totPoss = ScPoss + (FGA - FG) * (1 - 1.07 * tORBp) + (FTA ? (1 - ftp) ** 2 * 0.4 * FTA : 0) + TOV;
  const ppFG = 2 * (FG + 0.5 * TP) * (1 - 0.5 * pfr * qAST);
  const oFG = T.fgm - FG, ppAST = oFG > 0 && oFGA > 0 ? 2 * ((oFG + 0.5 * (T.tpm - TP)) / oFG) * 0.5 * (((T.pts - T.ftm) - (PTS - FT)) / (2 * oFGA)) * AST : 0;
  const ppORB = ORB * tORBw * tPlay * (T.pts / Math.max(1, tSc));
  const pprod = (ppFG + ppAST + FT) * cut + ppORB;
  // defense: individual defensive rating (stops)
  const DORp = O.orb / Math.max(1, O.orb + T.drb), DFGp = O.fgm / Math.max(1, O.fga);
  const FMwt = (DFGp * (1 - DORp)) / Math.max(1e-6, DFGp * (1 - DORp) + (1 - DFGp) * DORp);
  const st1 = STL + BLK * FMwt * (1 - 1.07 * DORp) + DRB * (1 - FMwt);
  const oftp = O.fta ? O.ftm / O.fta : 0;
  const st2 = (((O.fga - O.fgm - T.blk) / T.mp) * FMwt * (1 - 1.07 * DORp) + ((O.tov - T.stl) / T.mp)) * MP + (T.pf ? PF / T.pf : 0) * 0.4 * O.fta * (1 - oftp) ** 2;
  const stopP = ((st1 + st2) * O.mp) / Math.max(1e-6, T.poss * MP);
  const tDR = 100 * O.pts / T.poss, dPPS = O.pts / Math.max(1, O.fgm + (1 - (1 - oftp) ** 2) * O.fta * 0.4);
  const drtg = tDR + 0.2 * (100 * dPPS * (1 - stopP) - tDR);
  const mpw = 0.32 * lg.ppg * (T.pace / lg.pace);
  const ows = (pprod - 0.92 * lg.ppp * totPoss) / mpw, dws = (MP / T.mp) * T.poss * (1.08 * lg.ppp - drtg / 100) / mpw;
  return { MP, aPER, usg, ows, dws, ortg: totPoss > 0 ? 100 * pprod / totPoss : null, drtg };
}
function computeAdv(L, key, force) {
  const ck = key + ':' + L.season + ':' + L.phase + ':' + L.day + ':' + (L.po ? L.po.day : 0);
  if (!force && (L._adv || {})[key] === ck) return;
  computeBPM(L, key, force);
  (L._adv = L._adv || {})[key] = ck;
  const tkey = key === 'po' ? 'tpo' : 'trs', tx = {}; for (const t of L.teams) if (t[tkey] && t[tkey].g) tx[t.id] = t[tkey];
  const lines = [];
  for (const p of Object.values(L.players)) {
    const s = p.stats && p.stats[key]; if (!s || !s.gp || !s.min) continue;
    const split = p.stats[key + 'T'];
    lines.push({ s, parts: split ? Object.entries(split).map(([tid, x]) => [+tid, x]) : (p.team != null ? [[p.team, s]] : []) });
  }
  advApply(tx, lines);
}
// team totals by id (t.trs shape: TS_KEYS, 'o' + key, min, g) + lines [{ s, parts: [[tid, box]] }] -> writes per / usg / ows / dws / ws / ws48 / vorp into each s
function advApply(tx, lines) {
  const lg = { g: 0, mp: 0, poss: 0 }; for (const k of TS_KEYS) lg[k] = 0; const ctx = {};
  for (const id in tx) { const x = tx[id]; if (!x || !x.g) continue; const c = ctx[id] = advTeamCtx(x); for (const k of TS_KEYS) lg[k] += c.T[k]; lg.g += x.g; lg.mp += x.min; lg.poss += c.T.poss; }
  if (!lg.poss || !lg.fgm || !lg.pf) return;
  lg.pace = 48 * lg.poss / lg.mp; lg.ppp = lg.pts / lg.poss; lg.ppg = lg.pts / lg.g; lg.trb = lg.orb + lg.drb;
  lg.factor = 2 / 3 - (0.5 * (lg.ast / lg.fgm)) / (2 * (lg.fgm / Math.max(1, lg.ftm)));
  lg.vop = lg.pts / (lg.fga - lg.orb + lg.tov + 0.44 * lg.fta); lg.drbp = lg.drb / Math.max(1, lg.trb);
  const rows = [];
  for (const ln of lines) { const st = []; for (const [tid, x] of ln.parts) { const c = ctx[tid]; if (!c || !x || !x.min) continue; const r = advStint(x, c.T, c.O, lg); if (r) st.push(r); } if (st.length) rows.push({ s: ln.s, st }); }
  let w = 0, a = 0; for (const r of rows) for (const x of r.st) { a += x.aPER * x.MP; w += x.MP; }
  const lgA = w ? a / w : 1, k15 = 15 / (lgA || 1), R = (v, d) => Math.round(v * d) / d;
  for (const r of rows) {
    let mp = 0, per = 0, usg = 0, ows = 0, dws = 0; for (const x of r.st) { mp += x.MP; per += x.aPER * k15 * x.MP; usg += x.usg * x.MP; ows += x.ows; dws += x.dws; }
    const s = r.s; s.per = R(per / mp, 10); s.usg = R(usg / mp, 10); s.ows = R(ows, 10); s.dws = R(dws, 10); s.ws = R(ows + dws, 10); s.ws48 = R((ows + dws) * 48 / mp, 1000);
    s.vorp = s.bpm != null ? R((s.bpm + 2) * mp / (48 * 82), 10) : null;
  }
}
// Saves from before v33c: past sim seasons get PER / WS from their stored lines. Team totals = the sum of its players' lines; the
// opponents' line is not stored, so it is the league-average line scaled to the points the team allowed (standings). Marked est on the row.
function advBackfill(L) {
  const by = {};
  for (const p of Object.values(L.players)) for (const h of p.hist || []) if (h.s < L.season && ((h.rs && h.rs.gp && h.rs.per == null) || (h.po && h.po.gp && h.po.per == null))) (by[h.s] = by[h.s] || []).push([p, h]);
  let n = 0;
  for (const S in by) {
    const hs = (L.history || []).find(x => x.s === +S), st = {}; if (hs) for (const r of hs.standings || []) st[r.tid] = r;
    for (const key of ['rs', 'po']) {
      const all = []; for (const p of Object.values(L.players)) for (const h of p.hist || []) if (h.s === +S && h[key] && h[key].gp && h[key].min) all.push(h);
      const tx = {}, lines = [];
      for (const h of all) {
        const parts = h[key + 'T'] ? Object.entries(h[key + 'T']).map(([tid, x]) => [+tid, x]) : h.tid != null ? [[h.tid, h[key]]] : [];
        for (const [tid, x] of parts) { const t = tx[tid] = tx[tid] || { g: 0, min: 0, gpMax: 0 }; for (const k of TS_KEYS) t[k] = (t[k] || 0) + (x[k] || 0); t.min += (x.min || 0) / 300; t.gpMax = Math.max(t.gpMax, x.gp || 0); }
        if (h[key].per == null) lines.push({ s: h[key], parts });
      }
      if (!lines.length) continue;
      const tot = {}; let gsum = 0;
      for (const tid in tx) { const t = tx[tid], r = st[tid]; t.g = key === 'rs' && r ? (r.w + r.l) || t.gpMax : t.gpMax; gsum += t.g; for (const k of TS_KEYS) tot[k] = (tot[k] || 0) + t[k]; }
      if (!gsum) continue;
      for (const tid in tx) { const t = tx[tid], r = st[tid], pg = tot.pts / gsum, f = key === 'rs' && r && r.pa ? (r.pa / Math.max(1, t.g)) / pg : 1; for (const k of TS_KEYS) t['o' + k] = tot[k] / gsum * t.g * f; }
      advApply(tx, lines); for (const l of lines) if (l.s.per != null) { l.s.advEst = 1; n++; }
    }
  }
  return n;
}
// career / multi-season line: WS, OWS, DWS, VORP add up; PER and USG% minutes-weighted; WS/48 from the totals
function advCareer(lines) {
  let mp = 0, per = 0, usg = 0, pm = 0, um = 0, ows = 0, dws = 0, vorp = 0, n = 0, bm = 0, bpm = 0;
  for (const s of lines) { if (!s || !s.min) continue; const m = s.min / 60; mp += m; if (s.per != null) { per += s.per * m; pm += m; } if (s.usg != null) { usg += s.usg * m; um += m; } if (s.ws != null) { ows += s.ows || 0; dws += s.dws || 0; n++; } if (s.vorp != null) vorp += s.vorp; if (s.bpm != null) { bpm += s.bpm * m; bm += m; } }
  if (!n) return null;
  const R = (v, d) => Math.round(v * d) / d;
  return { per: pm ? R(per / pm, 10) : null, usg: um ? R(usg / um, 10) : null, ows: R(ows, 10), dws: R(dws, 10), ws: R(ows + dws, 10), ws48: mp ? R((ows + dws) * 48 / mp, 1000) : null, vorp: R(vorp, 10), bpm: bm ? R(bpm / bm, 10) : null };
}

// ---------- Power rankings: results, margin, recent form and current (healthy) roster strength ----------
function powerRankings(L) {
  const n = L.teams.length;
  const z = arr => { const m = arr.reduce((a, b) => a + b, 0) / n; const sd = Math.sqrt(arr.reduce((a, b) => a + (b - m) ** 2, 0) / n) || 1; return arr.map(x => (x - m) / sd); };
  const gp = L.teams.map(t => t.w + t.l);
  const st = z(L.teams.map(t => teamStrength(L, t)));
  const wp = z(L.teams.map((t, i) => gp[i] ? t.w / gp[i] : 0.5));
  const net = z(L.teams.map((t, i) => gp[i] ? (t.pf - t.pa) / gp[i] : 0));
  const l10 = z(L.teams.map(t => { const s = t.last10 || ''; return s.length ? s.split('').filter(x => x === 'W').length / s.length : 0.5; }));
  const w = Math.min(1, Math.max(...gp) / 20);                     // early on, the roster matters most
  const sc = L.teams.map((t, i) => (1 - w) * st[i] + w * (0.35 * wp[i] + 0.3 * net[i] + 0.15 * l10[i] + 0.2 * st[i]));
  return L.teams.map(t => t.id).sort((a, b) => sc[b] - sc[a]).map(id => ({ tid: id, sc: Math.round(sc[id] * 100) / 100 }));
}
// v25.5: weekly report snapshot (every 7 game days): headlines, big injuries, MVP ladder, power rankings with last week's order
function updateWeekly(L, final) {
  if (L.phase !== 'regular' || !L.day || !L.pr || !L.pr.now) return;
  const prev = L.wk && L.wk.s === L.season ? L.wk : null, n = prev ? prev.n + 1 : 1, nm = tid => L.teams[tid].abbr;
  const pr = L.pr.now.slice(), prPrev = prev ? prev.pr : null;   // week 1 has nothing to compare with (the first ranking is day 1, before any games)
  let mvp = []; try { mvp = awardLadder(L, 'mvp', 5).map(x => ({ pid: x.pid, sc: x.sc, pts: x.pts, reb: x.reb, ast: x.ast, tid: x.tid })); } catch (e) { }
  const hurt = Object.values(L.players).filter(p => !p.retired && p.team != null && p.injury >= 5).sort((a, b) => b.ovr - a.ovr);
  const prevInj = new Set(prev ? prev.injIds : []);
  const inj = hurt.slice(0, 8).map(p => ({ pid: p.id, tid: p.team, games: injGames(p), name: p.injName || 'Injury', fresh: !prev || !prevInj.has(p.id) }));
  const heads = [], V = (a) => a[n % a.length], pn = pid => L.players[pid] ? L.players[pid].name : '';
  const ps = prev && prev.streaks || {}, streaks = {};
  for (const t of L.teams) if (Math.abs(t.streak) >= 5) streaks[t.id] = t.streak;
  // order: MVP, big injury, risers, fallers, top spot, top scorer, streaks (the last ones are cut first)
  if (mvp[0]) { const m = mvp[0], pm = prev && prev.mvp[0], v = { name: pn(m.pid), pts: m.pts, reb: m.reb, ast: m.ast };
    heads.push(pm && pm.pid !== m.pid ? fl('wk.mvpTakeover', { name: pn(m.pid), prev: pn(pm.pid) }, n) : (prev ? fl('wk.mvpLead', v, n) : fl('wk.mvpOpen', v, n))); }
  const big = inj.filter(x => x.fresh && L.players[x.pid].ovr >= 70)[0]; if (big) heads.push(fl('wk.injury', { name: pn(big.pid), team: nm(big.tid), games: big.games, injury: big.name.toLowerCase() }, n));
  if (prPrev) { const mv = pr.map((tid, i) => ({ tid, d: prPrev.indexOf(tid) - i, i })), up = mv.slice().sort((a, b) => b.d - a.d)[0], dn = mv.slice().sort((a, b) => a.d - b.d)[0];
    if (up && up.d >= 3) heads.push(fl('wk.riser', { team: nm(up.tid), d: up.d, rank: up.i + 1 }, n));
    if (dn && dn.d <= -3) heads.push(fl('wk.faller', { team: nm(dn.tid), d: -dn.d, rank: dn.i + 1 }, n)); }
  if (pr[0] != null) { const t = L.teams[pr[0]], v = { team: nm(pr[0]), rec: `${t.w}-${t.l}` }; heads.push(prPrev && prPrev[0] !== pr[0] ? fl('wk.topTake', v, n) : (prev ? fl('wk.topStay', v, n) : fl('wk.topOpen', v, n))); }
  const best = {}; for (const g of L.games) { if (g.playoff || g.day <= L.day - 8) continue; for (const r of g.box || []) best[r[0]] = (best[r[0]] || 0) + r[2 + IX.pts]; }
  const star = Object.entries(best).sort((a, b) => b[1] - a[1])[0]; if (star && L.players[star[0]]) heads.push(fl('wk.scorer', { name: pn(star[0]), pts: star[1] }, n));
  // streak lines: only when new, or it grew by 3+ since last week
  const hot = L.teams.filter(t => t.streak >= 5 && (ps[t.id] == null || t.streak - ps[t.id] >= 3)).sort((a, b) => b.streak - a.streak)[0], cold = L.teams.filter(t => t.streak <= -5 && (ps[t.id] == null || ps[t.id] - t.streak >= 3)).sort((a, b) => a.streak - b.streak)[0];
  if (hot) heads.push(fl('wk.streakW', { team: nm(hot.id), n: hot.streak }, n)); if (cold) heads.push(fl('wk.streakL', { team: nm(cold.id), n: -cold.streak }, n));
  L.wk = { s: L.season, n, day: L.day, final: !!final, pr, prPrev, mvp, mvpPrev: prev ? prev.mvp.map(x => x.pid) : null, inj, injIds: hurt.map(p => p.id), streaks, heads: heads.slice(0, 6) };
}
function updatePowerRankings(L) {
  const now = powerRankings(L);
  L.pr = { prev: L.pr && L.pr.s === L.season ? L.pr.now : null, now: now.map(x => x.tid), s: L.season, day: L.day };
}

// ---------- Renaming: update every saved place a name is written ----------
function renameEverywhere(L, oldName, newName, kind, id) {
  if (!oldName || oldName === newName) return;
  const swap = txt => typeof txt === 'string' ? txt.split(oldName).join(newName) : txt;
  for (const x of L.log) x.text = swap(x.text);
  for (const tr of L.trades || []) { tr.aGets = swap(tr.aGets); tr.bGets = swap(tr.bGets); }
  for (const x of L.feed || []) { if (x.au) x.au = swap(x.au); for (const k in x.v || {}) x.v[k] = swap(x.v[k]); }   // v26.5
  if (kind === 'player') {
    for (const k in L.records.game) for (const r of L.records.game[k]) if (r.pid === id) r.name = newName;
    for (const h of L.hof || []) if (h.pid === id) h.name = newName;
    for (const t of L.teams) { for (const r of t.retired || []) if (r.pid === id) r.name = newName; for (const d of t.dead || []) if (d.pid === id) d.name = newName; }
    for (const h of L.history) for (const k in h.leaders || {}) for (const r of h.leaders[k]) if (r.pid === id) r.name = newName;
    for (const s in L.awards) { const A = L.awards[s]; for (const k in A.ladder || {}) for (const r of A.ladder[k]) if (r.pid === id) r.name = newName; for (const k in A.snaps || {}) if (+k === id) A.snaps[k].name = newName; }
  } else {
    for (const h of L.history) for (const st of h.standings) if (st.cid === id || (st.cid == null && st.coach === oldName)) st.coach = newName;
    for (const s in L.awards) for (const r of ((L.awards[s].ladder || {}).coy || [])) if (r.cid === id) r.name = newName;
    for (const t of L.teams) for (const o of t.coachOwed || []) if (o.cid === id) o.name = newName;
  }
}

// ---------- Morale: minutes vs role, winning, pay, loyalty, coach fit, being shopped ----------
const EXP_MIN = [34, 33, 32, 31, 30, 26, 23, 20, 16, 12, 8, 5, 3, 2, 1, 1, 1];
function moraleParts(L, p) {
  const t = L.teams[p.team]; if (!t) return null;
  const parts = {};
  const healthy = rosterOf(L, t).filter(x => x.injury <= 0).sort((a, b) => b.ovr - a.ovr);
  const rank = Math.max(0, healthy.findIndex(x => x.id === p.id));
  const s = p.stats.rs;
  const rl = typeof roleOf === 'function' ? roleOf(L, p) : null;   // v32b: minutes are judged against his role's range
  if (rl && p.injury <= 0 && s && s.gp >= 5 && p.ovr >= 50) { const mpg = s.min / s.gp / 60, r = ROLE_BY[rl], ck = clamp(1 - 0.3 * trc(p, 'cch'), 0.6, 1.4);
    parts.minutes = mpg < r.lo - 1 ? clamp((mpg - (r.lo - 1)) * 1.2 * ck, -20, 0) : mpg > r.hi + 1 ? clamp((mpg - r.hi - 1) * 0.5, 0, 4) : 1.5; parts.expMin = roleRange(rl); parts.role = rl; parts.mpg = mpg; }
  else if (p.injury <= 0 && s && s.gp >= 5 && p.ovr >= 55) { const mpg = s.min / s.gp / 60, exp = EXP_MIN[Math.min(rank, EXP_MIN.length - 1)]; parts.minutes = clamp((mpg - exp) * 1.2 * (mpg < exp ? clamp(1 - 0.3 * trc(p, 'cch'), 0.6, 1.4) : 1), -20, 8); /* v25.9: coachable players accept a smaller role more easily */ parts.expMin = exp; parts.mpg = mpg; }
  const g = t.w + t.l, wp = g >= 5 ? t.w / g : (t.expW != null ? t.expW : 0.5);
  const ww = clamp((p.age >= 30 ? 1.2 : 0.8) + 0.5 * tw(p, 'win'), 0.5, 2);   // v25.9
  parts.winning = clamp((wp - 0.5) * 40 * ww, -16, 12);
  if (p.contract && p.mval > MINSAL) { const mw = clamp(0.9 + 0.7 * tw(p, 'mon'), 0.4, 1.8); parts.pay = clamp((p.contract.amt - p.mval) / Math.max(p.mval, 1) * 15 * mw, -15, 8); }
  let yrs = 0; for (let i = p.hist.length - 1; i >= 0 && p.hist[i].tid === t.id; i--) yrs++;
  parts.loyalty = Math.min(8, yrs * 2) * clamp(1 + 0.9 * tw(p, 'loy'), 0.4, 2.3) * 0.6;
  parts.fit = clamp((fit(p, t.coach) - 60) * 0.15, -4, 3);
  const ts = tradeStatus(L, p); if (ts && ts.k === 'block' && !p.tradeReq) parts.shopped = -8;
  if (familyOn(L, p, t)) parts.family = 4;
  if (friendOn(L, p, t)) parts.friend = FR.morale;   // v37
  if (p.career && L.career && L.career.chem != null) parts.chem = clamp((L.career.chem - 50) / 12, -4, 4);   // My Career: locker-room chemistry
  if (p.mentor != null && t.coach && t.coach.id === p.mentor && (p.svc || 0) >= 3) parts.mentor = 3;
  if ((p.friction || []).includes(t.coach.id)) parts.friction = -4;
  { const ps = promiseState(L, p); if (ps === 'broken') parts.promise = -8; else if (ps === 'kept') parts.promise = 2; }   // v26.1
  drMorale(L, p, t, parts);   // v28.7: locker room harmony and feuds
  lr2Morale(L, p, t, parts);   // v28.8: talks, your promises, team suspension
  return parts;
}
function updateMorale(L) {
  for (const t of L.teams) for (const p of rosterOf(L, t)) {
    if (p.morale == null) p.morale = 60;
    const parts = moraleParts(L, p); if (!parts) continue;
    const target = clamp(60 + ['minutes', 'winning', 'pay', 'loyalty', 'fit', 'shopped', 'family', 'mentor', 'friction', 'promise', 'locker', 'feud', 'talk', 'gmPromise', 'susp', 'chem'].reduce((a, k) => a + (parts[k] || 0), 0), 0, 100);
    noteMentor(L, p);
    p.morale = Math.round(clamp(p.morale + 0.35 * (target - p.morale), 0, 100));
    p.moraleParts = parts;
    // v26.6 R5: an unhappy star goes public first (a vague post, then a rumor) before asking out
    if (L.phase === 'regular' && p.morale < 35 && pubStar(p) && p.tradeReq !== L.season) try { publicUnhappy(L, p, t); } catch (e) { }
    // an unhappy regular asks out (once a season)
    if (L.phase === 'regular' && p.morale < (iconTier(L, p) === 2 ? 15 : iconTier(L, p) === 1 ? 22 : 30) && p.ovr >= 60 && pubReady(L, p) && p.tradeReq !== L.season && !(p.contract && p.contract.exp === L.season && L.day >= deadlineDay(L))) {
      p.tradeReq = L.season; if (p.team != null && L.teams[p.team] && !(p.friction || []).includes(L.teams[p.team].coach.id)) p.friction = (p.friction || []).concat(L.teams[p.team].coach.id);
      p.tx.push({ s: L.season, t: `Requested a trade from ${t.abbr}` });
      logNews(L, `${p.name} (${t.abbr}) has requested a trade${parts.minutes != null && parts.minutes < -8 ? ': he wants more minutes' : parts.winning < -6 ? ': he wants to win' : parts.pay != null && parts.pay < -6 ? ': he feels underpaid' : ''}`, t.id, 'tx');
    }
    if (p.tradeReq === L.season && p.morale >= 50 && !p.career) p.tradeReq = null;     // patched things up
  }
  manageMoods(L);
}
// Coaches manage moods: a regular who's unhappy about minutes gets a few more (taken from content teammates).
// Every AI coach does it; yours does unless you turn it off.
function manageMoods(L) {
  for (const t of L.teams) {
    const on = t.id === L.user ? t.moodAuto !== false : true;
    const ps = rosterOf(L, t);
    if (!on) { for (const p of ps) p.moodMin = 0; continue; }
    const rot = rotationOf(L, t), bar = rot.length >= 8 ? rot[7].ovr - 4 : 0, core = new Set(rot.slice(0, 8).map(x => x.id));
    // only players the coach wants to keep happy: core rotation players, stars, good system fits, and young talent on a rebuilding team
    const keeps = p => core.has(p.id) || p.ovr >= 78 || ((t.mode === 'rebuild' || t.mode === 'tank') && p.age <= 24 && (p.scout || 0) >= 70) || (fit(p, t.coach) >= 72 && p.ovr >= bar);
    let total = 0;
    for (const p of ps.sort((a, b) => b.ovr - a.ovr)) {
      const mp = p.moraleParts;
      const wants = mp && mp.minutes != null && mp.minutes < -4 && p.morale < 55 && p.ovr >= bar && p.injury <= 0 && keeps(p);
      if (wants && total < 12) p.moodMin = Math.min(6, (p.moodMin || 0) + 2);
      else if (p.moodMin) p.moodMin = Math.max(0, p.moodMin - (p.morale >= 65 || !mp || (mp.minutes || 0) >= 0 ? 2 : 1));
      total += p.moodMin || 0;
    }
  }
}
const moodLabel = m => m == null ? '—' : m >= 70 ? 'Happy' : m >= 45 ? 'Content' : m >= 30 ? 'Unhappy' : 'Upset';

// ---------- Scouting directors: their eye sets how accurate a team's potential estimates are ----------
function hrand(a, b, c) { let h = (2166136261 ^ a) >>> 0; h = Math.imul(h ^ (b + 0x9e3779b9), 16777619); h = Math.imul(h ^ c, 2246822507); h ^= h >>> 13; h = Math.imul(h, 3266489909); h ^= h >>> 16; return ((h >>> 0) + 0.5) / 4294967296; }
function hgauss(a, b) { return Math.sqrt(-2 * Math.log(hrand(a, b, 1))) * Math.cos(2 * Math.PI * hrand(a, b, 2)); }
const SCOUT_EYE = { guards: 'Guards', wings: 'Wings', bigs: 'Bigs', balanced: 'Balanced' };
function genScout(L, young) {
  L.scoutNext = (L.scoutNext || 0) + 1;
  const idn = genIdentity(usedNames(L));
  const s = { id: L.scoutNext, name: idn[0], nat: idn[1], age: young ? rint(30, 40) : rint(36, 62), rating: r99(gauss(young ? 56 : 62, 11)), eye: pick(Object.keys(SCOUT_EYE)), hist: [], bias: pickBias() };
  s.pro = scoutProOf(s);   // v34: a second rating for pro / free-agent reads (draft = rating)
  s.salary = r1(clamp(0.3 + (0.6 * s.rating + 0.4 * s.pro - 40) * 0.04, 0.3, 2.5));
  return s;
}
// accuracy multiplier on the error: 1.2 for a weak scout, about 0.65 for an elite one; his specialty sharpens it further
function scoutFactor(sc, p) {
  if (!sc) return 1;
  let f = clamp(1.55 - sc.rating / 100, 0.55, 1.25);
  const grp = p.pos <= 1 ? 'guards' : p.pos <= 2 ? 'wings' : 'bigs';
  if (sc.eye === grp) f *= 0.8;
  return f;
}
// A team's own read on a player's potential: fixed per team and player (so it doesn't jump around), tighter with a better scout
const DIR_MAXERR = 10;
// typical miss for a director: about ±5 for the weakest, about ±1.5 for the best (his eye for a position group sharpens it)
// typical miss: about 2-3 for the best directors, about 6-7 for the weakest (never more than 10)
function dirSd(sc, p) { if (!sc) return 10; const grp = p.pos <= 1 ? 'guards' : p.pos <= 2 ? 'wings' : 'bigs'; return clamp(3 + (85 - sc.rating) * 0.13, 3, 10) * (sc.eye === grp ? 0.85 : 1); }
// A director's read on a young player's development: 'bust' risk or late-bloomer 'bloom' upside (better directors catch more, and raise fewer false alarms)
function dirFlags(L, tid, p) {
  if (tid == null || !L.teams[tid] || !(p.prospect || p.age <= 24) || p.retired) return null;
  const sc = L.teams[tid].scout; if (!sc) return null;
  const r = hrand(p.id, tid * 17 + 3, 77);
  if (p.path === 'bust') return r < clamp((sc.rating - 30) / 80, 0.05, 0.75) ? 'bust' : null;
  if (r > 1 - clamp((90 - sc.rating) / 400, 0.01, 0.15)) return 'bust';     // false alarm
  if (p.bloom && r < clamp((sc.rating - 40) / 120, 0.03, 0.4)) return 'bloom';
  return null;
}
// Hidden blind spot: some directors fall for a type of prospect and rate it a little too high
const SC_BIAS = { athletes: 'athletes', shooters: 'shooters', size: 'size and length', skill: 'skilled playmakers' };
function pickBias() { return R() < 0.35 ? null : pick(Object.keys(SC_BIAS)); }
function biasMatch(b, p) {
  if (b === 'athletes') return (p.spd + p.agi + p.vrt) / 3 >= 57;
  if (b === 'shooters') return p.tp >= 50;
  if (b === 'size') return p.wing - p.hgt >= 5 || p.hgt >= HGT_MEAN[POS[p.pos]] + 1.5;
  if (b === 'skill') return (p.iq + p.hnd + p.pas) / 3 >= 50;
  return false;
}
// ---------- v34 scouting overhaul (Kenneth, Nov 16): pro rating, department level, pro / free-agent fog ----------
// The director has two ratings: draft (s.rating, as before) and pro (s.pro: reads on players already in the league). Older directors get a pro
// rating near their draft one. The scouting department level (t.scoutLv) is paid from the staff budget: tighter reads (draft and pro),
// more assignment slots and interviews. Standard costs nothing (as before v34).
const SCOUT_LV = [{ n: 'Standard', cost: 0, k: 1, slots: 3, iv: 5 }, { n: 'Expanded', cost: 0.8, k: 0.85, slots: 4, iv: 6 }, { n: 'Elite', cost: 2, k: 0.7, slots: 5, iv: 7 }];
function scoutProOf(s) { return clamp(Math.round(s.rating + hgauss(s.id, 4242) * 8), 25, 99); }
function lvOf(L, tid) { const t = tid != null && L.teams[tid]; return SCOUT_LV[clamp((t && t.scoutLv) || 0, 0, SCOUT_LV.length - 1)]; }
const lvK = (L, tid) => tid == null ? 1 : lvOf(L, tid).k;
function assignMax(L, tid) { return tid == null ? ASSIGN_MAX : lvOf(L, tid).slots; }
function interviewMax(L, tid) { return tid == null ? INTERVIEW_MAX : lvOf(L, tid).iv; }
function scoutLvCost(L, t) { return SCOUT_LV[clamp(t.scoutLv || 0, 0, SCOUT_LV.length - 1)].cost; }
// your level: same window as hiring a director (after the draft, before the season); the extra cost must fit the staff budget
function setScoutLv(L, tid, lv) {
  const t = L.teams[tid]; lv = clamp(Math.round(lv), 0, SCOUT_LV.length - 1); if ((t.scoutLv || 0) === lv) return null;
  if (tid === L.user && !scoutWindow(L)) return 'The scouting budget can only be changed after the draft, before the season starts.';
  const add = SCOUT_LV[lv].cost - scoutLvCost(L, t);
  if (add > 0 && add > staffRoom(L, t, 'dept') + 1e-6) return `${SCOUT_LV[lv].n} scouting costs ${money(SCOUT_LV[lv].cost)} a season; your staff budget has ${money(Math.max(0, staffRoom(L, t, 'dept')))} of room.`;
  t.scoutLv = lv;
  if ((t.scoutAssign || []).length > SCOUT_LV[lv].slots) t.scoutAssign = t.scoutAssign.slice(0, SCOUT_LV[lv].slots);
  return null;
}
// AI teams: the highest level the staff budget allows with ~$1M to spare; rebuilding / tanking teams lean on the draft, so they go up first
function aiScoutLv(L, t) {
  if (t.id === L.user) return;
  const room = staffRoom(L, t, 'dept') + scoutLvCost(L, t), want = t.mode === 'rebuild' || t.mode === 'tank' ? 2 : t.mode === 'contend' ? 1 : (hrand(t.id, L.season, 61) < 0.5 ? 1 : 0);
  let lv = 0; for (let i = want; i > 0; i--) if (SCOUT_LV[i].cost <= room - 1) { lv = i; break; }
  t.scoutLv = lv;
}
// Pro / free-agent fog (Medium): players outside your team are seen through your staff's read: OVR and ratings off by about 1-4
// (tighter with a better pro rating, a bigger department, a player on your watch list or who played for you, later in the season);
// box stats, age, size and contracts stay exact. Your own players (and two-way players) are exact. Fixed per team, player and season.
// AI teams use their own read when bidding in free agency (draft too, as before); trades stay on true values (Kenneth).
const PRO_FOG = { on: true, ai: true, max: 6, valK: 0.5 };
function proFogOn(L, tid, p) {
  if (!PRO_FOG.on || L.proFog === false || tid == null || !L.teams[tid] || !p || p.prospect || p.retired || hiddenFor(L, p)) return false;
  if (p.team === tid || (p.tw && p.tw.tid === tid)) return false;
  return tid === L.user ? L.mode !== 'commish' : PRO_FOG.ai;
}
function proSd(L, tid, p) {
  const sc = L.teams[tid].scout, r = sc ? (sc.pro != null ? sc.pro : sc.rating) : 45;
  let s = clamp(1 + (85 - r) * 0.06, 1, 4) * lvK(L, tid);
  const seen = (p.hist || []).filter(h => h.rs && h.rs.gp >= 10).length;
  if (seen === 0) s *= 1.25; else if (seen >= 4) s *= 0.85;
  if ((p.hist || []).some(h => h.tid === tid) || p.lastTeam === tid) s *= 0.6;   // he played for you
  if (tid === L.user && isWatched(L, p)) s *= 0.7;
  if (p.abroad || p.club) s *= 1.3;
  if (L.phase === 'regular') s *= 1 - 0.3 * clamp(L.day / Math.max(1, totalDays(L)), 0, 1);   // a season of games to watch
  return clamp(s, 0.5, 5);
}
function proErr(L, tid, p) {
  const sc = L.teams[tid].scout, s = proSd(L, tid, p), k = tid * 733 + (sc ? sc.id : 0) * 11 + L.season * 97 + 5;
  const sh = hgauss(p.id, k) * s;
  return READ_GROUPS.map((g, i) => clamp(0.8 * sh + 0.5 * hgauss(p.id, k + (i + 1) * 29) * s, -PRO_FOG.max, PRO_FOG.max));
}
function proOvr(L, tid, p) { if (!proFogOn(L, tid, p)) return p.ovr; const e = proErr(L, tid, p); return clamp(Math.round(p.ovr + e.reduce((a, b) => a + b, 0) / e.length), 25, 99); }
function proAttr(L, tid, p, k) {
  if (!proFogOn(L, tid, p)) return p[k];
  const gi = READ_GROUPS.findIndex(g => g[1].includes(k)); if (gi < 0) return p[k];
  return clamp(Math.round(p[k] + proErr(L, tid, p)[gi] + hgauss(p.id, tid * 59 + k.charCodeAt(0) * 3 + k.length + L.season) * 0.7), 1, 99);
}
// a team's read on anyone: prospects / unrevealed rookies (draft read), other teams' players and free agents (pro read), own players exact
function teamOvr(L, tid, p) { return hiddenFor(L, p) ? ovrRead(L, tid, p) : proOvr(L, tid, p); }
// AI free-agent bids: the value of what they think they see (square root of the worth ratio, so a 2-point miss is ~10%, not ~20%)
function proValK(L, tid, p) { const o = proOvr(L, tid, p); if (o === p.ovr) return 1; return clamp(Math.pow(worth({ ...p, ovr: o }) / worth(p), PRO_FOG.valK), 0.8, 1.25); }
// v34: a written pro scouting report on a player outside your team (your staff's read; it can be wrong)
const PRO_GROUPS = [['shooting', ['mid', 'tp', 'ft']], ['finishing', ['fin', 'drw']], ['post game', ['pst']], ['ball handling', ['hnd']], ['passing', ['pas']], ['rebounding', ['orb', 'drb']], ['perimeter defense', ['per', 'stl']], ['interior defense', ['pdf', 'blk']], ['athleticism', ['spd', 'agi', 'vrt']], ['strength', ['str']], ['feel for the game', ['iq']]];
function proReport(L, tid, p) {
  if (!proFogOn(L, tid, p)) return null;
  const o = proOvr(L, tid, p), sd = proSd(L, tid, p), w = Math.max(1, Math.round(sd * 1.3)), sc = L.teams[tid].scout;
  const grp = p.pos <= 1 ? [0, 1] : p.pos <= 2 ? [2] : [3, 4], peers = active(L).filter(x => !x.prospect && x.team != null && grp.includes(x.pos));
  const avg = ks => x => ks.reduce((a, k) => a + (x[k] || 0), 0) / ks.length;
  const reads = PRO_GROUPS.map(([n, ks]) => { const mean = peers.length ? peers.reduce((a, x) => a + avg(ks)(x), 0) / peers.length : 50; return { n, v: ks.reduce((a, k) => a + proAttr(L, tid, p, k), 0) / ks.length - mean }; }).sort((a, b) => b.v - a.v);
  const role = o >= 80 ? 'a star' : o >= 72 ? 'a starter' : o >= 64 ? 'a rotation player' : o >= 57 ? 'a bench player' : 'a fringe player';
  const conf = sd <= 1.5 ? 'High' : sd <= 2.8 ? 'Medium' : 'Low';
  const why = [];
  why.push(sc ? `${sc.name} (pro ${sc.pro != null ? sc.pro : sc.rating})` : 'no scouting director');
  why.push(lvOf(L, tid).n.toLowerCase() + ' department');
  if ((p.hist || []).some(h => h.tid === tid) || p.lastTeam === tid) why.push('he played for us');
  if (tid === L.user && isWatched(L, p)) why.push('on the watch list');
  const seen = (p.hist || []).filter(h => h.rs && h.rs.gp >= 10).length; if (seen === 0) why.push('little league film'); else if (seen >= 4) why.push('a long track record');
  if (p.abroad || p.club) why.push('playing abroad');
  return { ovr: o, lo: Math.max(25, o - w), hi: Math.min(99, o + w), sd, role, conf, why, strengths: reads.slice(0, 2).filter(r => r.v > 2).map(r => r.n), concerns: reads.slice(-2).filter(r => r.v < -2).map(r => r.n).reverse(), by: sc ? sc.name : null };
}
// v34: how the mocks and your board did: for each draft class two or more seasons back, the rank correlation of each list (three outlets,
// consensus, your board, the real draft order) with peak OVR so far, and how many of each list's top 10 are top 10 by peak
function draftAccuracy(L) {
  const out = [], peak = p => Math.max(p.ovr, ...(p.hist || []).map(h => h.ovr || 0));
  const byS = {}; for (const p of Object.values(L.players)) if (p.draft && p.draft.s != null && p.draft.rd) (byS[p.draft.s] = byS[p.draft.s] || []).push(p);
  const rk = a => { const r = new Map(); a.forEach((x, i) => r.set(x, i + 1)); return r; };
  const spear = (xs, ys) => { const n = xs.length; if (n < 5) return null; const rx = rk(xs.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map(x => x[1])), ry = rk(ys.map((v, i) => [v, i]).sort((a, b) => a[0] - b[0]).map(x => x[1])); let d2 = 0; for (let i = 0; i < n; i++) d2 += (rx.get(i) - ry.get(i)) ** 2; return Math.round((1 - 6 * d2 / (n * (n * n - 1))) * 100) / 100; };
  for (const sk of Object.keys(byS).map(Number).sort((a, b) => b - a)) {
    if (L.season - sk < 2) continue;
    const ps = byS[sk], pk = ps.map(p => -peak(p)), top10 = new Set(ps.slice().sort((a, b) => peak(b) - peak(a)).slice(0, 10).map(p => p.id));
    const lists = { pick: p => (p.draft.rd - 1) * 100 + p.draft.no, cons: p => p.draft.mock || null, o0: p => p.draft.mo ? p.draft.mo[0] : null, o1: p => p.draft.mo ? p.draft.mo[1] : null, o2: p => p.draft.mo ? p.draft.mo[2] : null, mine: p => p.draft.ub || null };
    const row = { s: sk, n: ps.length, best: ps.slice().sort((a, b) => peak(b) - peak(a))[0].id };
    for (const k in lists) { const q = ps.filter(p => lists[k](p) != null); if (q.length < Math.min(10, ps.length) * 0.8) { row[k] = null; continue; } const qs = q.slice().sort((a, b) => lists[k](a) - lists[k](b)); row[k] = { r: spear(q.map(lists[k]), q.map(p => -peak(p))), hit: qs.slice(0, 10).filter(p => top10.has(p.id)).length }; }
    out.push(row);
  }
  return out;
}
// Scouting assignments (your team): up to 3, each a country, a position or one prospect. After two weeks of games (or from next season) they sharpen the reads.
const ASSIGN_MAX = 3, INTERVIEW_MAX = 5;
function assignMult(L, tid, p) {
  const t = L.teams[tid]; if (!t || !p.prospect || !(t.scoutAssign || []).length) return 1;
  let m = 1;
  for (const a of t.scoutAssign) {
    if (!assignReady(L, a)) continue;
    if (a.k === 'pid' && a.v === p.id) m = Math.min(m, 0.6);
    else if (a.k === 'nat' && a.v === p.nat) m = Math.min(m, 0.75);
    else if (a.k === 'pos' && a.v === p.pos) m = Math.min(m, 0.75);
  }
  return m;
}
function assignReady(L, a) { return a.s < L.season || L.day - a.d >= 14; }
function setAssign(L, tid, slot, a) {
  const t = L.teams[tid]; t.scoutAssign = t.scoutAssign || [];
  if (a == null) { t.scoutAssign.splice(slot, 1); return; }
  const rec = { k: a.k, v: a.v, s: L.season, d: L.phase === 'regular' ? L.day : 1e6 };   // offseason assignments start working next season
  if (slot < t.scoutAssign.length) t.scoutAssign[slot] = rec; else if (t.scoutAssign.length < assignMax(L, tid)) t.scoutAssign.push(rec);
}
// Interviews: up to 5 per season; personality read is right more often with a better director, work ethic is a noisy read
// Your director's recommendations: where to focus (assignments) and whom to interview, with his reasons.
// They come from his own reads, so a weaker director gives shakier advice.
function projectedPick(L, tid) {
  // early in the season the preseason expectation says more than a handful of games
  const early = L.phase === 'regular' && L.day < 10;
  const order = L.teams.slice().sort((a, b) => (early ? (a.expW || 0.5) - (b.expW || 0.5) : pctOf(a) - pctOf(b)) || a.id - b.id);
  return order.findIndex(t => t.id === tid) + 1;
}
function scoutRecs(L, tid) {
  const t = L.teams[tid], d = L.season, ms = mockSet(L, d), cons = ms.cons.map(id => L.players[id]).filter(Boolean);
  const pick = projectedPick(L, tid), as = t.scoutAssign || [], iv = t.interviews || {};
  const assigned = a => as.some(x => x.k === a.k && x.v === a.v);
  const near = cons.map((p, i) => ({ p, rank: i + 1, e: teamPotEst(L, tid, p) })).filter(x => Math.abs(x.rank - pick) <= 4);
  const assign = [];
  // 1) the prospect near your pick he is least sure about
  const unsure = near.filter(x => !assigned({ k: 'pid', v: x.p.id })).sort((a, b) => b.e.sd - a.e.sd || a.rank - b.rank)[0];
  if (unsure) assign.push({ k: 'pid', v: unsure.p.id, why: `${unsure.p.name} (${POS[unsure.p.pos]}) is #${unsure.rank} in the mocks, near your projected pick (#${pick}), and his read on him is the shakiest (potential ${Math.max(unsure.p.ovr, unsure.e.est - unsure.e.sd)}–${Math.min(99, unsure.e.est + unsure.e.sd)}).` });
  // 2) the position you're thinnest at, among good young players
  const young = rosterOf(L, t).filter(p => p.age <= 25 && p.ovr >= 50); const cnt = [0, 0, 0, 0, 0]; for (const p of young) cnt[p.pos]++;
  const top30 = cons.slice(0, 30);
  const posPick = [0, 1, 2, 3, 4].filter(i => !assigned({ k: 'pos', v: i })).map(i => ({ i, n: top30.filter(p => p.pos === i).length, have: cnt[i] })).sort((a, b) => a.have - b.have || b.n - a.n)[0];
  if (posPick) assign.push({ k: 'pos', v: posPick.i, why: `You have ${posPick.have === 0 ? 'no' : posPick.have} young ${POS[posPick.i]}${posPick.have === 1 ? '' : 's'} (25 or under, 50+), and ${posPick.n} of the top 30 prospects are ${POS[posPick.i]}s.` });
  // 3) the country with the most top-30 prospects
  const byNat = {}; for (const p of top30) byNat[p.nat] = (byNat[p.nat] || 0) + 1;
  const nat = Object.entries(byNat).filter(([k]) => !assigned({ k: 'nat', v: k })).sort((a, b) => b[1] - a[1])[0];
  if (nat) assign.push({ k: 'nat', v: nat[0], why: `${nat[1]} of the top 30 prospects are from ${NAT_NAME[nat[0]] || nat[0]}, the deepest pool in this class.` });
  // interviews: prospects near your pick, flagged ones first, then the ones with the most upside in his read
  const interview = near.filter(x => !iv[x.p.id]).map(x => {
    const flag = dirFlags(L, tid, x.p), why = [];
    if (x.p.wrk <= 45) why.push('the mocks mention work-ethic questions');
    if (flag === 'bust') why.push('he sees bust risk and wants to know if it\'s effort');
    if (x.e.est - x.p.ovr >= 15) why.push(`big upside in his read (${x.p.ovr} now, could reach ${x.e.est})`);
    if (!why.length) why.push(`projected near your pick (#${x.rank} in the mocks)`);
    return { pid: x.p.id, score: (x.p.wrk <= 45 ? 3 : 0) + (flag === 'bust' ? 2 : 0) + (x.e.est - x.p.ovr) / 10 - Math.abs(x.rank - pick) * 0.3, why: x.p.name + ': ' + why.join('; ') + '.' };
  }).sort((a, b) => b.score - a.score).slice(0, 4);
  return { pick, assign: assign.slice(0, Math.max(0, assignMax(L, tid) - as.length)), interview: interview.slice(0, Math.max(0, interviewsLeft(L, tid))) };
}
function interviewsLeft(L, tid) { const iv = L.teams[tid].interviews || {}; return interviewMax(L, tid) - Object.values(iv).filter(x => x.s === L.season).length; }
function interview(L, tid, pid) {
  const t = L.teams[tid], p = L.players[pid]; t.interviews = t.interviews || {};
  if (!p || !p.prospect) return 'Only draft prospects can be interviewed.';
  if (t.interviews[pid]) return 'You already interviewed him.';
  if (interviewsLeft(L, tid) <= 0) return `You've used all ${interviewMax(L, tid)} interviews this season.`;
  const sc = t.scout, rt = sc ? sc.rating : 45;
  const right = hrand(pid, tid * 29 + 5, 11) < clamp(0.6 + rt / 250, 0.6, 0.95);
  const others = ['Loyal', 'Money', 'Winner', 'Balanced'].filter(x => x !== p.pers);
  const pers = right ? p.pers : others[Math.floor(hrand(pid, tid * 29 + 5, 12) * 3)];
  const work = Math.round(clamp(p.wrk + hgauss(pid, tid * 29 + 6) * clamp(3 + (85 - rt) * 0.15, 3, 10), 20, 99));
  // v25.9: noisy reads of the five new traits (a better scouting director reads them closer)
  const trd = {}; ['loy', 'mon', 'win', 'mot', 'cch'].forEach((k, i) => trd[k] = clamp(Math.round(trv(p, k) + hgauss(pid, tid * 29 + 40 + i) * clamp(3 + (85 - rt) * 0.2, 4, 14)), 10, 95));
  t.interviews[pid] = { s: L.season, pers, work, tr: trd };
  return null;
}
const workLabel = w => w >= 75 ? 'Gym rat' : w >= 58 ? 'Solid worker' : w >= 42 ? 'Needs a push' : 'Work-ethic red flag';
// A written scouting report: built from the team's potential read, plus noisy reads of his skills. It can be wrong.
const SKILL_GROUPS = [['Athleticism', ['spd', 'agi', 'vrt']], ['Strength', ['str']], ['Finishing', ['fin']], ['Post game', ['pst']], ['Shooting', ['mid', 'tp', 'ft']], ['Ball handling', ['hnd']], ['Passing', ['pas']], ['Rebounding', ['orb', 'drb']], ['Perimeter defense', ['per', 'stl']], ['Interior defense', ['pdf', 'blk']], ['Feel for the game', ['iq']]];
function scoutReport(L, tid, p) {
  if (tid == null || !L.teams[tid]) return null;
  const t = L.teams[tid], sc = t.scout, e = teamPotEst(L, tid, p);
  const noise = (sc ? dirSd(sc, p) : 10) * 0.9 * assignMult(L, tid, p) * lvK(L, tid);
  const grp = p.pos <= 1 ? [0, 1] : p.pos <= 2 ? [2] : [3, 4];
  const peers = active(L).filter(x => x.prospect && grp.includes(x.pos));
  const avg = ks => x => ks.reduce((a, k) => a + (x[k] || 0), 0) / ks.length;
  const reads = SKILL_GROUPS.map(([n, ks], i) => { const f = avg(ks); const mean = peers.length ? peers.reduce((a, x) => a + f(x), 0) / peers.length : 50; return { n, v: f(p) - mean + hgauss(p.id, tid * 41 + i + 3 * L.season) * noise * 0.6 }; }).sort((a, b) => b.v - a.v);
  const role = e.est >= 76 ? 'a future star' : e.est >= 69 ? 'a starter' : e.est >= 62 ? 'a rotation player' : e.est >= 55 ? 'a bench player' : 'a long shot to stick';
  const conf = e.sd <= 3 ? 'High' : e.sd <= 6 ? 'Medium' : 'Low';
  const comp = compFor(L, { ...p, scout: e.est });
  const flag = dirFlags(L, tid, p);
  return { role, est: e.est, lo: Math.max(p.ovr, e.est - e.sd), hi: Math.min(99, e.est + e.sd), conf, strengths: reads.slice(0, 2).filter(r => r.v > 0).map(r => r.n), concerns: reads.slice(-2).filter(r => r.v < 0).map(r => r.n).reverse(), comp: comp ? comp.id : null, flag, by: sc ? sc.name : null, focus: assignMult(L, tid, p) < 1 };
}
// ---------- v15: hidden prospect ratings ----------
// Until summer league, a prospect's ratings are a read, not the truth. Each team's read comes from its scouting director:
// one shared over/under error per prospect plus a smaller error per skill group. The media read (mock drafts) is its own guess.
// Height, weight, wingspan and age are measured, so they're always exact.
const READ_GROUPS = [['Scoring', ['fin', 'pst', 'mid', 'tp', 'ft', 'drw']], ['Playmaking', ['hnd', 'pas', 'iq']], ['Defense', ['per', 'pdf', 'stl', 'blk']], ['Athleticism', ['spd', 'agi', 'vrt', 'str', 'orb', 'drb']]];
const READ_MAX = 10;
function hiddenFor(L, p) { return !!(p && (p.prospect || p.unrev)); }
function readSd(L, tid, p) { const sc = tid != null && L.teams[tid] ? L.teams[tid].scout : null; const r = sc ? sc.rating : 45; return clamp(2 * (1 + (85 - r) * 0.07), 2, 10) * (tid != null ? assignMult(L, tid, p) * lvK(L, tid) : 1); }   // v34: department level   // v16: wider reads
function readErr(L, tid, p) {
  const sc = tid != null && L.teams[tid] ? L.teams[tid].scout : null, s = tid == null ? 5 : readSd(L, tid, p), k = tid == null ? 7771 : tid * 977 + (sc ? sc.id : 0) * 7 + 13;
  const sh = hgauss(p.id, k) * s;
  const ak = typeof cmbAthK === 'function' ? cmbAthK(p) : 1;   // combine: tighter athletic read
  return READ_GROUPS.map((g, i) => clamp((0.8 * sh + 0.6 * hgauss(p.id, k + (i + 1) * 31) * s) * (i === 3 ? ak : 1), -READ_MAX, READ_MAX));
}
function ovrRead(L, tid, p) { if (!hiddenFor(L, p)) return p.ovr; const e = readErr(L, tid, p); return clamp(Math.round(p.ovr + e.reduce((a, b) => a + b, 0) / e.length), 25, 99); }
function attrRead(L, tid, p, k) {
  if (!hiddenFor(L, p)) return p[k];
  const gi = READ_GROUPS.findIndex(g => g[1].includes(k)); if (gi < 0) return p[k];
  return clamp(Math.round(p[k] + readErr(L, tid, p)[gi] + hgauss(p.id, (tid == null ? 5 : tid) * 53 + k.charCodeAt(0) * 3 + k.length) * 0.8), 1, 99);
}
// summer league is over: everyone sees the truth. Big misses make the news.
function revealRookies(L) {
  const ps = active(L).filter(p => p.unrev);
  const media = ps.map(p => ({ p, d: p.ovr - ovrRead(L, null, p) })).filter(x => Math.abs(x.d) >= 4 && x.p.draft && x.p.draft.s === L.season).sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 3);
  const mine = L.user != null ? ps.filter(p => p.team === L.user).map(p => ({ p, d: p.ovr - ovrRead(L, L.user, p) })) : [];
  L.reveals = L.reveals || {};
  L.reveals[L.season] = ps.filter(p => p.draft && p.draft.s === L.season).map(p => ({ pid: p.id, tid: p.team, ovr: p.ovr, media: ovrRead(L, null, p), team: p.team != null ? ovrRead(L, p.team, p) : null, dr: p.team != null && L.teams[p.team].scout ? L.teams[p.team].scout.rating : null, pick: p.draft.rd + '-' + p.draft.no }));
  for (const x of media) logNews(L, `${x.d > 0 ? 'Summer league standout' : 'Looked lost in summer league'}: ${x.p.name}${x.p.team != null ? ` (${L.teams[x.p.team].abbr})` : ''} is ${x.d > 0 ? 'better' : 'worse'} than the experts thought (rated ${x.p.ovr}, mocked as ${x.p.ovr - x.d})`, x.p.team, 'draft');
  for (const x of mine) if (Math.abs(x.d) >= 3) logNews(L, `Summer league verdict on ${x.p.name}: your director read him at ${x.p.ovr - x.d}; he's a ${x.p.ovr}`, L.user, 'draft');
  if (L.user != null) L.revealMine = { s: L.season, list: ps.filter(p => p.team === L.user).map(p => ({ pid: p.id, read: ovrRead(L, L.user, p), ovr: p.ovr, how: p.draft && p.draft.s === L.season ? `pick ${p.draft.rd}-${p.draft.no}` : 'undrafted' })) };   // v17: your rookies' reveal popup
  for (const p of ps) p.unrev = false;
}
function teamPotEst(L, tid, p) {
  let tf;
  if (p.prospect) { const k = Math.max(0, p.draftYear - capSeason(L) + 1); tf = [0.75, 0.85, 1, 1.15, 1.25][Math.min(4, k)]; }
  else tf = p.age <= 21 ? 0.8 : p.age <= 24 ? 0.55 : p.age <= 27 ? 0.3 : 0;
  if (!tf) return { est: Math.max(p.ovr, p.scout), sd: 0 };
  const sc = tid != null && L.teams[tid] ? L.teams[tid].scout : null;
  if (tid == null) return { est: p.scout, sd: Math.max(1, Math.round(5 * tf)) };
  const s = dirSd(sc, p) * tf * assignMult(L, tid, p) * lvK(L, tid);   // v34: department level
  const bias = sc && sc.bias && p.prospect && biasMatch(sc.bias, p) ? 2.5 * tf : 0;
  // a fixed read on the player plus a part that changes each season as he's seen more
  const err = clamp((0.75 * hgauss(p.id, tid * 131 + 7) + 0.66 * hgauss(p.id, tid * 131 + 7 + 1009 * L.season)) * s, -DIR_MAXERR, DIR_MAXERR);
  return { est: Math.round(clamp(p.pot + err + bias, ovrRead(L, tid, p), 99)), sd: Math.max(1, Math.round(s)) };
}
// Director's board for a draft class: his potential read, current level, and the team's needs
// v25.1: youth in boards and mocks, by draft-day age: a little per year under 21, and a steeper drop for 23-24
function youthB(L, p, k) { const a = draftAgeOf(L, p); return ((21 - a) - (a >= 23 ? (a - 22) * 1.5 : 0)) * k; }
function draftBoard(L, tid, d) {
  const t = L.teams[tid], needs = teamNeeds(L, t);
  const potW = t.mode === 'tank' || t.mode === 'rebuild' ? 0.65 : 0.5;
  const pros = (L.classes[d] || []).map(id => L.players[id]).filter(Boolean);
  const sc = p => { const fl = dirFlags(L, tid, p); return potW * teamPotEst(L, tid, p).est + (1 - potW) * ovrRead(L, tid, p) + (needMult(L, t, p, needs) - 1) * 6 + youthB(L, p, 1.2) + (fl === 'bust' ? -3 : fl === 'bloom' ? 2 : 0) + (typeof cmbBoost === 'function' ? cmbBoost(L, p) : 0) - (p.career && L.career && p.scout < p.pot ? (p.pot - p.scout) * 0.5 : 0); };   // My Career: weak pre-draft stats lower his scouting grade; teams' boards follow it too (not just the mocks), so the real draft follows the mock. Works on older saves (uses scout vs pot)
  let board = pros.sort((a, b) => sc(b) - sc(a));
  const mine = tid === L.user && L.myBoard && L.myBoard[d];
  if (mine) { const pos = new Map(mine.map((id, i) => [id, i])); board = board.slice().sort((a, b) => (pos.has(a.id) ? pos.get(a.id) : 999) - (pos.has(b.id) ? pos.get(b.id) : 999)); }
  return board;
}
// v15: the user can change scouting directors only after the draft, until the season starts (or any time the job is empty)
function scoutWindow(L) { return L.phase === 'off-resign' || L.phase === 'off-fa' || L.phase === 'off-ready'; }
const scoutAmt = (s, yrs) => r1(s.salary * (yrs >= 3 ? 0.95 : 1));
function fireScout(L, tid) {
  const t = L.teams[tid], o = t.scout; if (!o) return 'You have no scouting director.';
  if (tid === L.user && !scoutWindow(L)) return 'Scouting directors can only be changed after the draft, before the season starts.';
  const from = coachStartSeason(L);
  if (o.contract && o.contract.exp >= from) (t.coachOwed = t.coachOwed || []).push({ sid: o.id, name: o.name + ' (director)', amt: o.contract.amt, thru: o.contract.exp });
  o.contract = null; o.tid = null; o.hist.push({ tid, to: L.season }); L.scoutPool.push(o); t.scout = null;
  logNews(L, `${t.abbr} fired scouting director ${o.name}`, tid, 'coach');
  return null;
}
// anyone without a director when the season starts gets one: a random available director, never one of the best two
function autoFillScouts(L) {
  for (const t of L.teams) {
    if (t.scout) continue;
    const pool = (L.scoutPool || []).slice().sort((a, b) => b.rating - a.rating).slice(2).filter(x => canAffordStaff(L, t, 'scout', x.salary));
    const s = pool.length ? pool[Math.floor(R() * pool.length)] : genScout(L);
    L.scoutPool = (L.scoutPool || []).filter(x => x.id !== s.id);
    t.scout = s; s.tid = t.id; s.contract = { amt: s.salary, exp: L.season + 1 };
    logNews(L, t.id === L.user ? `You didn't hire a scouting director, so the front office brought in ${s.name} (rating ${s.rating}) on a 2-year deal` : `${t.abbr} hired ${s.name} as scouting director`, t.id, 'coach');
  }
}
function hireScout(L, tid, sid, yrs) {
  const t = L.teams[tid], s = (L.scoutPool || []).find(x => x.id === sid); if (!s) return 'That scout is no longer available.';
  if (tid === L.user && t.scout && !scoutWindow(L)) return 'Scouting directors can only be changed after the draft, before the season starts.';
  yrs = clamp(Math.round(yrs || 3), 1, 4);
  if (!canAffordStaff(L, t, 'scout', scoutAmt(s, yrs))) return `${s.name} doesn't fit your staff budget (${money(staffRoom(L, t, 'scout'))} of room).`;
  if (t.scout) {
    const o = t.scout, from = coachStartSeason(L);
    if (o.contract && o.contract.exp >= from) (t.coachOwed = t.coachOwed || []).push({ sid: o.id, name: o.name + ' (director)', amt: o.contract.amt, thru: o.contract.exp });
    o.contract = null; o.hist.push({ tid, to: L.season }); L.scoutPool.push(o);
  }
  L.scoutPool = L.scoutPool.filter(x => x.id !== sid);
  t.scout = s; s.tid = tid; s.contract = { amt: scoutAmt(s, yrs), exp: coachStartSeason(L) + yrs - 1 };
  logNews(L, `${t.abbr} hired ${s.name} as scouting director`, tid, 'coach');
  return null;
}
function scoutOffseason(L) {
  const all = [...L.teams.map(t => t.scout).filter(Boolean), ...(L.scoutPool || [])];
  for (const s of all) { s.age++; const dv = s.age <= 45 ? rnd(0, 2) : s.age <= 58 ? rnd(-1, 1) : -rnd(0, 2); s.rating = r99(s.rating + dv); if (s.pro == null) s.pro = scoutProOf(s); else s.pro = r99(s.pro + dv + rnd(-0.5, 0.5)); s.salary = r1(clamp(0.3 + (0.6 * s.rating + 0.4 * s.pro - 40) * 0.04, 0.3, 2.5)); }   // v34: pro rating ages too; salary on both
  L.scoutPool = (L.scoutPool || []).filter(s => s.age < 68);
  for (const t of L.teams) {
    if (t.id === L.user) continue;
    const best = L.scoutPool.slice().sort((a, b) => b.rating - a.rating)[0];
    if ((t.scout.age >= 68) || (best && best.rating > t.scout.rating + 12 && R() < 0.3 && canAffordStaff(L, t, 'scout', best.salary) && (!t.scout.contract || t.scout.contract.exp <= L.season + 1))) { if (t.scout.age >= 68) { t.scout = null; } if (best) { if (!t.scout) { L.scoutPool = L.scoutPool.filter(x => x.id !== best.id); t.scout = best; best.tid = t.id; } else hireScout(L, t.id, best.id); } }
    if (!t.scout) { t.scout = genScout(L); t.scout.tid = t.id; }
  }
  if (L.user != null && L.teams[L.user].scout && L.teams[L.user].scout.age >= 68) { const old = L.teams[L.user].scout; L.teams[L.user].scout = genScout(L); L.teams[L.user].scout.tid = L.user; logNews(L, `Your scouting director ${old.name} retired; ${L.teams[L.user].scout.name} takes over`, L.user, 'coach'); }
  while (L.scoutPool.length < 6) L.scoutPool.push(genScout(L, R() < 0.5));
  for (const t of L.teams) if (t.scout && (!t.scout.contract || t.scout.contract.exp <= L.season)) { t.scout.contract = { amt: t.scout.salary, exp: L.season + 3 }; }
  for (const t of L.teams) aiScoutLv(L, t);   // v34: department level for the coming season
}

// ---------- Draft-day trades: a team further down moves up for the player it wants ----------
const rdTxt = o => (o.rd === 1 ? '#' : '2nd-round #') + o.no;
function tradeUpOffer(L, idx, avoid) {
  const slot = L.draftOrder[idx]; if (!slot || slot.pid) return null;
  const owner = L.teams[slot.owner];
  const cur = L.picks.find(k => k.s === L.season && k.rd === slot.rd && k.orig === slot.orig); if (!cur) return null;
  const mock = mockOrder(L, L.season);
  for (let j = idx + 1; j < Math.min(L.draftOrder.length, idx + 7); j++) {
    const s2 = L.draftOrder[j]; if (s2.owner === slot.owner || s2.pid || (s2.rd !== slot.rd && !(slot.rd === 1 && s2.rd === 2 && slot.no >= L.teams.length - 2)) || s2.owner === L.user || (avoid && avoid.includes(s2.owner))) continue;
    const A = L.teams[s2.owner], top = draftBoard(L, A.id, L.season)[0]; if (!top) continue;
    const left = mock.findIndex(x => x.id === top.id) + 1;          // rank among players still available
    if (left > j - idx) continue;                                    // he'll probably still be there at their pick
    const mr = (L.mockRank && L.mockRank[top.id]) || left;
    const theirs = L.picks.find(k => k.s === L.season && k.rd === s2.rd && k.orig === s2.orig); if (!theirs) continue;
    const need = pickTV(L, owner, cur) * 1.02;
    const aGive = { players: [], picks: [theirs.id] }; const gv = [pickTV(L, owner, theirs)]; let got = gv[0], cash = 0;
    // v25.7c: a small gap is closed with cash first (up to the season limit), a bigger one with future picks
    const cashFor = gap => { const per = cashTV(L, owner, 1), room = A.owner && A.owner.tight ? 0 : Math.min(cashRoom(L, A).send, cashRoom(L, owner).get); if (!(per > 0) || gap <= 0) return 0; const c = Math.ceil(gap / per * 2) / 2; return c <= room ? c : 0; };
    cash = cashFor(need - got); if (cash) got += cashTV(L, owner, cash);   // cash sits outside the bundle
    const extras = L.picks.filter(k => k.owner === A.id && k.id !== theirs.id && k.s > L.season && !k.swap).sort((a, b) => a.rd - b.rd || a.s - b.s);
    for (const k of extras.slice().sort((a, b) => pickTV(L, owner, a) - pickTV(L, owner, b))) { if (got >= need || aGive.picks.length >= 4) break; if (k.rd === 1) { const mv = {}; for (const id of [...aGive.picks, k.id]) mv[id] = owner.id; mv[cur.id] = A.id; if (stepienCheck(L, mv, [A.id])) continue; }   // v26.4: draft-day trade-ups respect the Stepien rule
      aGive.picks.push(k.id); gv.push(pickTV(L, owner, k)); got = bundleSum(gv) + cashTV(L, owner, cash); }
    if (got < need) continue;
    if (cash) aGive.cash = cash;
    const extraTxt = [...aGive.picks.slice(1).map(id => pickLabel(L, L.picks.find(k => k.id === id))), ...(cash ? [money(cash) + ' cash'] : [])].map((x, i, a) => (i ? (i === a.length - 1 ? ' and ' : ', ') : ' plus ') + x).join('');
    return { a: A.id, b: owner.id, aGive, bGive: { players: [], picks: [cur.id] }, id: 'dt-' + Date.now() + '-' + j, draft: true, ttl: 1, why: `${A.abbr} want to move up from ${rdTxt(s2)} to ${rdTxt(slot)} to take ${top.name} (mocked #${mr} overall). They'd give ${rdTxt(s2)}${extraTxt}.` };
  }
  return null;
}
function draftTrades(L) {
  // before an AI pick: sometimes a team below trades up
  const slot = L.draftOrder[L.draftIdx]; if (!slot || slot.owner === L.user || R() >= 0.18 * 32 / Math.max(32, L.draftOrder.length)) return;
  if (typeFull(L, 'pick')) return;   // v24: draft-day trade-ups are picks for picks, so they respect that cap   // v21: same draft-day volume with more picks
  const tr = tradeUpOffer(L, L.draftIdx); if (!tr || !afterTradeOK(L, tr)) return;
  executeTrade(L, tr); L.trades[0].when = 'Draft';
  logNews(L, `Draft-day trade: ${tr.why}`, tr.a, 'trade');
}
function offersForUserPick(L) {
  const slot = L.draftOrder[L.draftIdx]; if (!slot || slot.owner !== L.user) return;
  if ((L.offers || []).some(o => o.draft && o.slotIdx === L.draftIdx)) return;
  const made = [];
  for (let i = 0; i < 2; i++) { const tr = tradeUpOffer(L, L.draftIdx, made); if (!tr || !afterTradeOK(L, tr)) break; made.push(tr.a); tr.isNew = true; tr.slotIdx = L.draftIdx; tr.made = L.season * 1000 + 950; L.offers.push(tr); }
}

// ---------- Sign-and-trade: re-sign an expiring player and send him to a team he'd sign with ----------
function buildPackage(L, A, U, need, maxP) {
  const keep = new Set([...rotationOf(L, A).slice(0, A.mode === 'contend' ? 2 : 1).map(p => p.id), ...Object.keys(A.tstat || {}).filter(id => A.tstat[id].k === 'protect').map(Number)]);
  const pool = [];
  for (const p of rosterOf(L, A)) if (!keep.has(p.id) && !p.hardship && !tradeRestricted(L, p)) pool.push({ type: 'p', id: p.id, vb: playerTV(L, U, p, false), va: playerTV(L, A, p, true) });
  for (const k of L.picks.filter(k => k.owner === A.id && k.s >= L.season && !pickUsed(L, k))) pool.push({ type: 'k', id: k.id, vb: pickTV(L, U, k), va: pickTV(L, A, k) });
  pool.sort((x, y) => y.vb / Math.max(0.1, y.va) - x.vb / Math.max(0.1, x.va));
  const aGive = { players: [], picks: [] }; let got = 0; const gv = []; let cand = pool.filter(a => a.vb > 0.2);
  while (got < need && aGive.players.length + aGive.picks.length < 4 && cand.length) {
    if (aGive.players.length >= maxP) cand = cand.filter(a => a.type === 'k');
    if (!cand.length) break;
    const fin = cand.filter(a => bundleSum([...gv, a.vb]) >= need).sort((x, y) => x.vb - y.vb)[0], a = fin || cand[0];
    cand.splice(cand.indexOf(a), 1); (a.type === 'p' ? aGive.players : aGive.picks).push(a.id); gv.push(a.vb); got = bundleSum(gv);
  }
  return got >= need ? { aGive, got } : null;
}
function sntTerms(L, p) { const amt = Math.min(maxFor(p), Math.max(MINSAL, p.ask || p.mval || MINSAL)); return { amt, yrs: yrsFor(p, amt) }; }
function sntOffers(L, pid) {
  const p = L.players[pid], U = L.teams[p.team]; if (!U || !['off-resign', 'off-draft'].includes(L.phase)) return [];
  const { amt, yrs } = sntTerms(L, p), cs = capSeason(L), out = [];
  for (const A of L.teams) {
    if (A.id === U.id || signConcerns(L, p, A, 'signing').refuse || (U.id !== L.user && A.id !== L.user && isRivalry(L, A.id, U.id) && R() > 0.02)) continue;
    if (payroll(L, A, cs) + contractHit(amt, false) > CAP + 1e-6 || A.roster.length >= 16) continue;
    const save = p.contract; p.contract = { amt, exp: cs + yrs - 1, len: yrs, type: 're-sign', opt: null };
    const va = playerTV(L, A, p, false); p.contract = save;
    const pk = buildPackage(L, A, U, Math.max(0.6, va * 0.45), Math.max(0, 17 - U.roster.length));
    if (!pk) continue;
    // the sending team takes salary back, so it has to stay under the cap too
    const inHit = pk.aGive.players.reduce((s, id) => s + capHit(L, L.players[id], cs), 0);
    if (payroll(L, U, cs) + inHit > CAP + 1e-6 && inHit > 0) continue;
    if (!afterTradeOK(L, { a: A.id, b: U.id, aGive: pk.aGive, bGive: { players: [pid], picks: [] } })) continue;   // v25.8
    out.push({ a: A.id, b: U.id, aGive: pk.aGive, bGive: { players: [pid], picks: [] }, amt, yrs, val: pk.got, id: 'snt-' + A.id, why: `${A.abbr} (${MODE_LABEL[A.mode].toLowerCase()}) would sign ${p.name} at ${money(amt)}/yr for ${yrs} yr and send back assets, instead of you losing him for nothing.` });
  }
  return out.sort((x, y) => y.val - x.val).slice(0, 4);
}
function doSignAndTrade(L, o) {
  const p = L.players[o.bGive.players[0]], from = p.team, A = L.teams[o.a];
  if (!p || from == null) return 'He is no longer under your control.';
  { const cs = capSeason(L), back = o.aGive.players.reduce((s, id) => s + capHit(L, L.players[id], cs), 0);   // v33b: the offer was made earlier; check the cap again now (same rule as sntOffers)
    if (payroll(L, A, cs) + contractHit(o.amt, false) > CAP + 1e-6) return `${A.abbr} no longer have the cap room for this sign-and-trade.`;
    if (payNoFloor(L, L.teams[from], cs) + back > APRON + 1e-6) return `This would put ${L.teams[from].abbr} over the ${money(APRON)} hard cap.`; }
  signContract(L, p, from, o.amt, o.yrs, 're-sign');
  L.resign = (L.resign || []).filter(id => id !== p.id);
  executeTrade(L, { a: o.a, b: from, aGive: o.aGive, bGive: o.bGive });
  p.tx.push({ s: L.season, t: `Sign-and-trade: re-signed by ${L.teams[from].abbr} and sent to ${L.teams[o.a].abbr}` });
  logNews(L, `Sign-and-trade: ${p.name} re-signs with ${L.teams[from].abbr} (${o.yrs} yr, ${money(o.amt)}/yr) and goes to ${L.teams[o.a].abbr}`, o.a, 'trade');
}

// ---------- Playoff race: games left, clinch / elimination, magic numbers, remaining schedule strength ----------
function gamesLeft(L) {
  const g = {}, opp = {}; for (const t of L.teams) { g[t.id] = 0; opp[t.id] = []; }
  if (L.phase === 'regular') for (let d = L.day; d < L.schedule.length; d++) for (const [h, a] of L.schedule[d]) { g[h]++; g[a]++; opp[h].push(a); opp[a].push(h); }
  return { g, opp };
}
// Conservative: a team only "clinches" if it would hold the spot even losing every tiebreaker,
// and is only "eliminated" if enough teams already have more wins than it can still reach.
function raceInfo(L) {
  const { g, opp } = gamesLeft(L);
  const sc = {}; for (const r of powerRankings(L)) sc[r.tid] = r.sc;
  const pctT = id => { const t = L.teams[id]; return t.w + t.l ? t.w / (t.w + t.l) : 0.5; };
  const out = {};
  for (const conf of CONFS) {
    const ids = seedOrder(L, conf);
    const maxW = id => L.teams[id].w + g[id];
    for (const id of ids) {
      const t = L.teams[id], others = ids.filter(x => x !== id);
      const clinch = k => others.filter(o => maxW(o) >= t.w).length < k;
      const elim = k => others.filter(o => L.teams[o].w > maxW(id)).length >= k;
      const magic = k => { const thr = others.map(maxW).sort((a, b) => b - a)[k - 1]; return thr == null ? 0 : Math.max(0, thr + 1 - t.w); };
      const D = poDirect(L), P = poPlayinTo(L), status = clinch(1) ? 'y' : clinch(D) ? 'x' : clinch(P) ? 'p' : elim(P) ? 'e' : elim(D) ? 'o' : '';
      const os = opp[id];
      out[id] = { gl: g[id], status, m3: clinch(D) || elim(D) ? null : magic(D), m5: clinch(P) || elim(P) ? null : magic(P), sos: os.length ? os.reduce((a, o) => a + sc[o], 0) / os.length : null, oppPct: os.length ? os.reduce((a, o) => a + pctT(o), 0) / os.length : null, opps: os };
    }
  }
  const ranked = Object.keys(out).filter(id => out[id].sos != null).sort((a, b) => out[b].sos - out[a].sos);
  ranked.forEach((id, i) => out[id].sosRank = i + 1);
  return out;
}

// ---------- Buyouts ----------
function buyoutDeadlineDay(L) { return deadlineDay(L) + 7; }
function buyoutOpen(L) { return (L.phase === 'regular' && L.day < buyoutDeadlineDay(L)) || L.phase.startsWith('off'); }
// What he'd give back to be let go: more if he's older, wants to win on a non-contender, or can earn it back elsewhere
function buyoutTerms(L, p) {
  const t = p.team != null ? L.teams[p.team] : null, c = p.contract; if (!t || !c) return null;
  const cs = capSeason(L), hit = capHit(L, p, cs); if (hit <= 0 || c.exp < cs) return null;
  const yl = c.exp - cs + 1, owed = hit * yl;
  let rate = 0.05;
  if (p.age >= 30) rate += 0.08;
  if (t.mode !== 'contend') rate += 0.12 * Math.min(1, twp(p, 'win'));
  if ((t.mode === 'tank' || t.mode === 'rebuild') && p.age >= 28) rate += 0.05;
  rate -= 0.05 * Math.min(1, twp(p, 'mon')) + 0.03 * Math.min(1, twp(p, 'loy'));
  const resale = p.mval || MINSAL;
  if (resale >= hit * 0.8) rate += 0.05; else if (resale < hit * 0.4) rate *= 0.5;
  rate = clamp(rate, 0, 0.35);
  const give = r1(owed * rate);
  return { owed: r1(owed), give, rate, deadPerYr: r1((owed - give) / yl), yl, exp: c.exp };
}
function buyout(L, p) {
  const t = L.teams[p.team], b = buyoutTerms(L, p); if (!b) { release(L, p); return; }
  t.dead.push({ amt: b.deadPerYr, exp: b.exp, name: p.name, pid: p.id, s: L.season, buyout: true });
  p.tx.push({ s: L.season, t: `Bought out by ${t.abbr}: gave back ${money(b.give)} of ${money(b.owed)}` });
  logNews(L, `${t.abbr} bought out ${p.name}: he gave back ${money(b.give)}; ${money(b.deadPerYr)}/yr stays on their cap through ${yr(b.exp)} unless another team signs him`, t.id, 'tx');
  p.boughtOut = L.season;
  toFA(L, p);
  // he's still being paid, so he signs cheaply, usually with a contender
  p.ask = r1(Math.max(MINSAL, Math.min(p.ask || MINSAL, (p.mval || MINSAL) * 0.5))); if (p.ask < 1.5) p.ask = MINSAL;
}
// AI: rebuilding and tanking teams buy out veterans a few days after the trade deadline
function aiBuyouts(L) {
  for (const t of L.teams) {
    if (t.id === L.user || !(t.mode === 'tank' || t.mode === 'rebuild')) continue;
    for (const p of rosterOf(L, t)) {
      if (t.roster.length <= 13) break;
      const s = tradeStatus(L, p); if (s && s.k === 'protect') continue;
      const b = buyoutTerms(L, p);
      if (b && p.age >= 29 && p.ovr >= 62 && b.yl <= 2 && R() < 0.35) buyout(L, p);
    }
  }
}

// ---------- Finances ----------
const ARENA_KIND = ['Arena', 'Dome', 'Fieldhouse', 'Pavilion', 'Center', 'Coliseum'];
const BASE_PRICE = { 3: 72, 2: 65, 1: 55 }, BASE_SEATS = { 3: 18000, 2: 15000, 1: 12500 }, BASE_MERCH = { 3: 12, 2: 10, 1: 8 };
const SPONSOR_NAMES = ['Pacific Telecom', 'Island Air', 'Harbor Bank', 'Sunrise Foods', 'Bayani Motors', 'Tala Energy', 'Mabuhay Insurance', 'Coral Beverages', 'Summit Cement', 'Lakas Logistics', 'Banyan Realty', 'Tidewater Shipping', 'Northstar Mobile', 'Kalayaan Steel', 'Golden Grain Mills', 'Bluewave Water', 'Malaya Bank', 'Tanaw Electronics', 'Lumen Pharmacy', 'Habagat Apparel'];
const SPONSOR_BASE = { 3: 8, 2: 8.5, 1: 8 }, WIN_K = { 3: 20, 2: 28, 1: 40 }, SMALL_MULT = { 3: 1, 2: 1.25, 1: 1.5 };
const PO_PTS = { 'Champion': 6, 'Lost in Finals': 4, 'Lost in conference finals': 2.5, 'Lost in conference semis': 1, 'Lost in first round': 0.6, 'Lost in play-in': 0.3 };
// Star power: very good players and recent award winners draw sponsors and sell jerseys
function starPower(L, t) { let s = 0; for (const p of rosterOf(L, t)) s += Math.max(0, (p.fame || 0) - 35) * 0.16; return r1(Math.min(12, s * (t.market === 1 ? 1.3 : t.market === 2 ? 1.1 : 1))); }
function recentWinPct(L, t) {
  const rows = L.history.slice(-2).map(h => h.standings.find(x => x.tid === t.id)).filter(Boolean);
  if (!rows.length) return 0.5;
  return rows.reduce((a, r) => a + r.w / Math.max(1, r.w + r.l), 0) / rows.length;
}
// What a sponsor pays a season: market size and hype, winning (worth more to a small market), last playoff run, stars
function sponsorValue(L, t) {
  const hype = t.hype == null ? 50 : t.hype, m = t.market;
  const win = (recentWinPct(L, t) - 0.5) * WIN_K[m];
  const po = (PO_PTS[t.lastPo] || 0) * SMALL_MULT[m];
  const parts = { base: r1(SPONSOR_BASE[m] * (0.75 + 0.5 * hype / 100)), win: r1(win), po: r1(po), stars: starPower(L, t) };
  let raw = parts.base + parts.win + parts.po + parts.stars;
  const soft = SPONSOR_BASE[m] * 2; if (raw > soft) raw = soft + (raw - soft) * 0.5;      // diminishing returns at the top
  const floor = SPONSOR_BASE[m] * (0.5 + 0.3 * hype / 100);
  return { amt: r1(clamp(raw, floor, 32)), parts };
}
function signSponsor(L, t, quiet) {
  const v = sponsorValue(L, t), yrs = rint(2, 3), old = t.sponsor;
  const name = old && R() < 0.6 ? old.name : pick(SPONSOR_NAMES.filter(n => !L.teams.some(o => o !== t && o.sponsor && o.sponsor.name === n)));
  t.sponsor = { name, amt: v.amt, from: L.season, exp: L.season + yrs - 1, parts: v.parts };
  (t.sponsorHist = t.sponsorHist || []).push({ s: L.season, name, amt: v.amt, yrs });
  if (!quiet) logNews(L, `${t.abbr} signed a ${yrs}-year sponsorship with ${name}: ${money(v.amt)} a season${old ? ` (was ${money(old.amt)})` : ''}`, t.id, 'league');
}
// Playoff bonus paid by the sponsor on top of the deal
function sponsorBonus(L, t, po) { return r1((PO_PTS[po] || 0) * 0.6 * SMALL_MULT[t.market]); }
function sponsorFor(L, t, s) { return t.sponsor && t.sponsor.exp >= s && t.sponsor.from <= s ? t.sponsor.amt : t.sponsor ? t.sponsor.amt : 0; }
function newFin(L) { return { s: L.season, gate: 0, playoff: 0, att: 0, homeGames: 0, poHome: 0, paySum: 0, payDays: 0 }; }
function genOwner(L, t) { return { name: genName(usedNames(L)), trust: 60, hot: 0, wealth: t.market * 8 - 16 + rint(-4, 4), goal: null, limit: CAP, hist: [] }; }
// v24.6: the season the current GM (or you) took over this team
function gmSince(L, t) { if (t.id === L.user && L.me) { const st = (L.me.stints || []).filter(x => x.tid === t.id).slice(-1)[0]; return st && st.from != null ? st.from : 1; } return t.gm && t.gm.since != null ? t.gm.since : 1; }
// v24.6: a missed playoff doesn't add to the drought in the league's first season or in a GM's first 2 seasons with the team
function droughtGrace(L, t, S) { return S <= 1 || S - gmSince(L, t) + 1 <= 2; }
function genGM(L, o) { L.gmNext = (L.gmNext || 0) + 1; return { id: L.gmNext, name: genName(usedNames(L)), rep: rint(35, 70), hist: [], fired: 0, age: o && o.age != null ? o.age : (L.day || L.season > 1 ? rint(36, 54) : rint(38, 62)), fo: o && o.fo ? o.fo : (L.day || L.season > 1 ? gmPersona() : null), stints: [] }; }   // v27 S2: age, personality (first GMs keep the team's)
function initFinance(L, t) {
  t.arena = t.arena || { name: `${t.name} ${pick(ARENA_KIND)}`, cap: Math.round((BASE_SEATS[t.market] + rint(-1000, 1000)) / 100) * 100 };
  if (t.priceAuto == null) t.priceAuto = true;
  if (t.hype == null) t.hype = 44 + t.market * 3;
  if (t.cash == null) t.cash = 30 + t.market * 10;
  t.fin = t.fin || newFin(L); t.finHist = t.finHist || []; t.taxYears = t.taxYears || [];
  t.owner = t.owner || genOwner(L, t);
  if (!t.sponsor) signSponsor(L, t, true);
  if (t.staffBudget == null) t.staffBudget = staffBudgetFor(L, t);
  if (t.id !== L.user && !t.gm) {
    t.gm = genGM(L); t.gm.since = L.season - (L.season === 1 ? rint(0, 5) : 0);
    // v24.6: the league's first GMs have been in the job 0-5 years already, and one who has may already be 1-2 seasons into a playoff drought,
    // so playoff clocks (and firings) don't all come due in the same season
    if (L.season === 1 && L.day === 0 && !t.drought) t.drought = rint(0, Math.min(2, L.season - t.gm.since));
  }
  if (t.scout && !t.scout.contract) t.scout.contract = { amt: t.scout.salary, exp: L.season + rint(0, 2) };
}
const clampHype = t => { t.hype = Math.round(clamp(t.hype, 0, 100) * 10) / 10; };
// gains shrink as hype climbs (very slow above ~85)
function hypeBump(t, x) { const h = t.hype == null ? 50 : t.hype; if (x > 0 && h > 60) x *= Math.max(0.08, (100 - h) / 40); t.hype = h + x; clampHype(t); }
function marketPrice(L, t) { return Math.round(BASE_PRICE[t.market] * (0.8 + 0.4 * (t.hype == null ? 50 : t.hype) / 100)); }
function ticketPrice(L, t) { return t.priceAuto || !t.price ? marketPrice(L, t) : t.price; }
// share of seats sold at a price (playoff games get a demand boost and a 50% price premium)
// small markets: fans respond more to a winner (hype climbs faster and fills the arena sooner)
const HYPE_DEMAND = { 3: 0.3, 2: 0.34, 1: 0.4 }, HYPE_WIN = { 3: 1, 2: 1.15, 1: 1.4 };
function demandFor(L, t, price, playoff, rival) {
  const mkt = marketPrice(L, t) * (playoff ? 1.5 : 1);
  return clamp(0.82 + HYPE_DEMAND[t.market] * ((t.hype == null ? 50 : t.hype) - 50) / 50 + (rival || 0) + (playoff ? 0.25 : 0) - 0.9 * (price / mkt - 1), 0.15, 1.3);
}
function financeGame(L, g) {
  const home = L.teams[g.home], away = L.teams[g.away];
  if (!home.fin) return;
  const rk = rivalKind(L, g.home, g.away), rival = rk ? { arch: 0.09, po: 0.08, conf: 0.06 }[rk] : permGrudgeGame(L, g.home, g.away) ? 0.08 : 0;   // v24.3: rivalry games draw 6-9% more (v32a: a permanent player rivalry counts)
  const price = ticketPrice(L, home) * (g.playoff ? 1.5 : 1);
  const att = Math.round(Math.min(home.arena.cap, home.arena.cap * demandFor(L, home, price, g.playoff, rival)));
  const rev = att * price / 1e6 * (g.playoff ? 1 : 58 / SEASON_GAMES);   // v26.6: the same season gate at any season length
  const hk = g.playoff ? 1 : 58 / SEASON_GAMES;   // and the same hype swing over a season
  if (g.playoff) { home.fin.playoff += rev; home.fin.poHome++; } else { home.fin.gate += rev; home.fin.att += att; home.fin.homeGames++; }
  g.att = att;
  // hype: wins and losses, rivalry wins, and fans souring on overpriced tickets
  const hw = g.hs > g.as, W = hw ? home : away, Lo = hw ? away : home;
  hypeBump(W, (0.35 + (rival ? 0.2 : 0)) * HYPE_WIN[W.market] * hk); hypeBump(Lo, -0.3 * hk);
  const ratio = price / (marketPrice(L, home) * (g.playoff ? 1.5 : 1));
  if (ratio > 1.1) hypeBump(home, -(ratio - 1.1) * 2 * hk);
}
// v36a C: the season's scheduled amount (real yearly deals, v35a renegotiated raises), not the base amount
function schedAmt(c, cs) { const a = c.sched && c.s0 != null ? c.sched[cs - c.s0] : null; return a != null ? a : c.amt; }
function cashPayroll(L, t, cs) { cs = cs == null ? capSeason(L) : cs; let s = 0; for (const p of rosterOf(L, t)) if (p.contract && p.contract.exp >= cs) s += schedAmt(p.contract, cs); for (const d of t.dead || []) if (d.exp >= cs) s += d.amt; for (const fp of t.floorPaid || []) if (fp.s === cs) s += Math.min(fp.amt, Math.max(0, MINPAY - s)); return s; }
const STAFF_BASE = { 3: 15, 2: 12, 1: 9.5 }, INTERIM_PAY = 0.5;
// Owner's budget for the head coach, the scouting director and money still owed to fired staff (a hard limit on new hires)
function staffBudgetFor(L, t) { return r1(clamp(STAFF_BASE[t.market] + (t.owner ? t.owner.wealth * 0.1 : 0) + Math.max(0, t.cash || 0) * 0.01, 7, 20)); }
function staffOwed(L, t, s) { return (t.coachOwed || []).filter(o => o.thru >= s).reduce((a, o) => a + o.amt, 0); }
// Room under the staff budget to hire a coach or director (the person being replaced is owed the rest of his deal)
function staffRoom(L, t, kind) {
  const s = coachStartSeason(L), pay = x => x ? (x.contract ? x.contract.amt : x.salary || 0) : 0;
  if (kind === 'dept') return r1((t.staffBudget || staffBudgetFor(L, t)) - staffOwed(L, t, s) - pay(t.coach) - pay(t.scout) - scoutLvCost(L, t));   // v34: room for the scouting department
  const cur = kind === 'coach' ? t.coach : t.scout, other = kind === 'coach' ? t.scout : t.coach;
  const otherAmt = pay(other) + scoutLvCost(L, t);
  const curOwed = cur && cur.contract && cur.contract.exp >= s && !cur.interim ? cur.contract.amt : 0;
  return r1((t.staffBudget || staffBudgetFor(L, t)) - staffOwed(L, t, s) - otherAmt - curOwed);
}
function canAffordStaff(L, t, kind, amt) { return amt <= INTERIM_PAY + 1e-6 || amt <= staffRoom(L, t, kind) + 1e-6; }
function staffCost(L, t, s) { s = s == null ? L.season : s; return (t.coach.contract ? t.coach.contract.amt : 0) + (t.coachOwed || []).filter(o => o.thru >= s).reduce((a, o) => a + o.amt, 0) + (t.scout ? (t.scout.contract ? t.scout.contract.amt : t.scout.salary) : 0) + scoutLvCost(L, t); }   // v34: scouting department
// Merchandise = other merch (market and hype) + jersey sales (players' fame; a famous player sells extra in a small market)
const JERSEY_K = 6, MARKET_J = { 3: 1.15, 2: 1, 1: 0.85 };
function otherMerch(L, t) { return r1(BASE_MERCH[t.market] * (0.6 + 0.8 * (t.hype == null ? 50 : t.hype) / 100) * 0.7); }
function jerseysFor(L, t) { let s = 0; for (const p of rosterOf(L, t)) { const f = (p.fame || 0) / 100; let v = f * f * JERSEY_K * MARKET_J[t.market]; if (t.market === 1 && p.fame >= 60) v *= 1.25; s += v; } return r1(s + 1 + (t.hype == null ? 50 : t.hype) / 50); }
function merchFor(L, t) { return r1(otherMerch(L, t) + jerseysFor(L, t)); }
// Luxury tax: $1.50 per $1 over the line for the first $5M, $2.00 for the next $5M, $2.50 beyond; +$1.00 per $1 for repeat payers (3 of 4 seasons)
function taxFor(L, t, pay, s) {
  const over = pay - TAXLINE; if (over <= 0) return 0;
  const repeat = (t.taxYears || []).filter(y => y >= s - 3 && y < s).length >= 2;
  const b1 = Math.min(5, over), b2 = Math.min(5, Math.max(0, over - 5)), b3 = Math.max(0, over - 10);
  return r1(b1 * 1.5 + b2 * 2 + b3 * 2.5 + (repeat ? over : 0));
}
function isRepeatTaxer(L, t, s) { return (t.taxYears || []).filter(y => y >= s - 3 && y < s).length >= 2; }
// Full-season projection for the current season (to date + the rest at the current pace)
function seasonProjection(L, t) {
  const S = L.season, inSeason = ['regular', 'regular-done', 'playoffs', 'season-done'].includes(L.phase);
  // in the offseason last season's books are closed: project next season from scratch
  const f = inSeason && t.fin ? t.fin : newFin(L);
  const homeTotal = SEASON_GAMES / 2, done = f.homeGames;
  const perGame = done ? f.gate / done : ticketPrice(L, t) * t.arena.cap * Math.min(1, demandFor(L, t, ticketPrice(L, t))) / 1e6;
  const gate = L.phase === 'regular' || !inSeason ? f.gate + perGame * Math.max(0, homeTotal - done) : f.gate;
  const pay = inSeason ? payroll(L, t, S) : payroll(L, t);
  const payCost = f.payDays ? f.paySum / f.payDays : cashPayroll(L, t, inSeason ? S : capSeason(L));
  const tax = taxFor(L, t, pay, inSeason ? S : S + 1);
  // league pools from everyone's projected gate and tax
  let gatePool = 0, taxPool = 0, nonTax = 0;
  for (const o of L.teams) { const of = inSeason && o.fin ? o.fin : newFin(L), d = of.homeGames; const pg = d ? of.gate / d : ticketPrice(L, o) * o.arena.cap * Math.min(1, demandFor(L, o, ticketPrice(L, o))) / 1e6; gatePool += SHARE_PCT * ((L.phase === 'regular' || !inSeason ? of.gate + pg * Math.max(0, homeTotal - d) : of.gate) + merchFor(L, o)); const tx = taxFor(L, o, inSeason ? payroll(L, o, S) : payroll(L, o), inSeason ? S : S + 1); taxPool += tx; if (!tx) nonTax++; }
  const merch = merchFor(L, t), staff = staffCost(L, t, inSeason ? S : S + 1);
  const shareIn = 0.75 * gatePool / L.teams.length + fundShare(L, t, gatePool, taxPool) + (tax ? 0 : 0.5 * taxPool / Math.max(1, nonTax)), shareOut = SHARE_PCT * (gate + merch);
  const sponsor = sponsorFor(L, t, inSeason ? S : S + 1);
  const ct = t.cashTr && t.cashTr.s === (inSeason ? S : S + 1) ? t.cashTr : { sent: 0, got: 0 };   // v25.7c cash in trades counts in the profit
  const revenue = gate + f.playoff + mediaFor(L) + merch + sponsor + shareIn + ct.got, expenses = payCost + staff + tax + shareOut + ct.sent;
  return { cashGot: ct.got, cashSent: ct.sent, gate, playoff: f.playoff, media: mediaFor(L), merch, sponsor, shareIn: r1(shareIn), shareOut: r1(shareOut), taxShare: tax ? 0 : r1(0.5 * taxPool / Math.max(1, nonTax)), fund: r1(fundShare(L, t, gatePool, taxPool)), payCost: r1(payCost), staff: r1(staff), tax, revenue: r1(revenue), expenses: r1(expenses), profit: r1(revenue - expenses), pay };
}
// Close the books at the end of the season: sharing, tax, profit, cash
const CASH_CAP = { 3: 120, 2: 90, 1: 70 };
// v22: 30-team media deal (+4 per team, shared equally), and a small-market fund: a quarter of the pooled gate and merchandise money
// and half the luxury tax go to small markets (2 shares) and mid markets (1 share); the rest is split as before
function mediaFor(L) { return MEDIA + (isBig(L) ? 4 : 0); }
function fundShare(L, t, gatePool, taxPool) { const w = x => ({ 1: 2, 2: 1, 3: 0 })[x.market] || 0, tot = L.teams.reduce((a, x) => a + w(x), 0) || 1; return (0.25 * gatePool + 0.5 * taxPool) * w(t) / tot; }
function closeSeasonFinance(L) {
  const S = L.season, rows = {};
  for (const t of L.teams) { if (!t.fin) initFinance(L, t); const pay = payroll(L, t, S); rows[t.id] = { pay, tax: taxFor(L, t, pay, S) }; }
  const merchOf = {}; for (const t of L.teams) merchOf[t.id] = merchFor(L, t) + (L.po && L.po.champion === t.id ? 5 : 0);
  const gatePool = L.teams.reduce((a, t) => a + SHARE_PCT * (t.fin.gate + merchOf[t.id]), 0), taxPool = Object.values(rows).reduce((a, r) => a + r.tax, 0);
  const nonTax = L.teams.filter(t => !rows[t.id].tax).length;
  for (const t of L.teams) {
    const f = t.fin, r = rows[t.id];
    const merch = merchOf[t.id], po = poResult(L, t.id);
    const fund = fundShare(L, t, gatePool, taxPool), shareIn = 0.75 * gatePool / L.teams.length + fund, taxIn = r.tax ? 0 : 0.5 * taxPool / Math.max(1, nonTax), shareOut = SHARE_PCT * (f.gate + merch);
    const sponsor = sponsorFor(L, t, S), bonus = sponsorBonus(L, t, po);
    t.prevPo = t.lastPo; t.lastPo = po;
    t.drought = /Missed|play-in/.test(po) ? (t.drought || 0) + (droughtGrace(L, t, S) ? 0 : 1) : 0;   // v24.6: season 1 and a GM's first 2 seasons don't count
    const payCost = (f.payDays ? f.paySum / f.payDays : cashPayroll(L, t, S)) - (f.suspSaved || 0), staff = staffCost(L, t, S);
    const ct = t.cashTr && t.cashTr.s === S ? t.cashTr : { sent: 0, got: 0 };   // v25.7c cash sent and received in trades this season
    const revenue = f.gate + f.playoff + mediaFor(L) + merch + sponsor + bonus + shareIn + taxIn + ct.got + (f.fines || 0), expenses = payCost + staff + r.tax + shareOut + ct.sent + (f.intlBuy || 0);   /* v29 P8: international buyouts */
    const profit = revenue - expenses;
    t.cash = r1((t.cash || 0) + profit);
    // owners take money out: about 30% of any profit, and everything above the franchise's cash cap
    let dist = profit > 0 ? profit * 0.3 : 0; t.cash = r1(t.cash - dist);
    if (t.cash > CASH_CAP[t.market]) { dist += t.cash - CASH_CAP[t.market]; t.cash = CASH_CAP[t.market]; }
    if (r.tax) t.taxYears.push(S);
    t.finHist.push({ s: S, gate: r1(f.gate), playoff: r1(f.playoff), media: mediaFor(L), merch: r1(merch), jersey: jerseysFor(L, t), sponsor: r1(sponsor), spBonus: bonus, shareIn: r1(shareIn), cashIn: ct.got, cashOut: ct.sent, fund: r1(fund), taxIn: r1(taxIn), shareOut: r1(shareOut), payroll: r1(payCost), fines: f.fines || 0, suspSaved: f.suspSaved || 0, intlBuy: f.intlBuy || 0, capPay: r1(r.pay), staff: r1(staff), tax: r.tax, revenue: r1(revenue), expenses: r1(expenses), profit: r1(profit), dist: r1(dist), cash: t.cash, att: f.homeGames ? Math.round(f.att / f.homeGames) : 0, full: f.homeGames ? f.att / f.homeGames / t.arena.cap : 0, hype: t.hype, price: ticketPrice(L, t), repeat: r.tax ? isRepeatTaxer(L, t, S) : false, limit: t.owner ? t.owner.limit : null });   // v24.7: owner's limit that season (finance chart)
    if (r.tax) logNews(L, `${t.abbr} paid ${money(r.tax)} in luxury tax (payroll ${money(r.pay)})`, t.id, 'league');
    if (r.tax && isRepeatTaxer(L, t, S)) { hypeBump(t, -3); if (profit < 0 && t.owner) t.owner.trust = Math.max(0, (t.owner.trust || 60) - 4); logNews(L, `${t.abbr} are repeat tax payers: ${money(r.tax)} this season${profit < 0 ? ', and the owner is unhappy about the losses' : ''}`, t.id, 'league'); }   // v24.4
  }
}
// ---------- Owners: goals, spending limits, trust; GMs on the hot seat ----------
// A small-market owner who is losing money scales back: still wants a competitive team, but within budget
function cuttingLosses(L, t) { const last = (t.finHist || []).slice(-1)[0]; return !!last && ((t.market === 1 && (last.profit < -5 || (t.cash || 0) < 0)) || (t.cash || 0) < OWNER_RED); }   // v36a part 3: any owner in the red (cash below OWNER_RED) cuts back too
const OWNER_RED = -10;
function ownerGoalFor(L, t) {
  const m = t.expMode || t.mode;
  if (t.lastPo === 'Champion' && (m === 'contend' || m === 'hopeful')) return { key: 'finals', txt: 'Defend the title: reach the Finals' };
  if (cuttingLosses(L, t) && !['final', 'demand'].includes(t.pstate)) {
    if (m === 'contend') return { key: 'poC', txt: `Make the playoffs and lose no more than ${money(10)}` };
    if (m === 'hopeful') { const n = Math.max(22, Math.round((t.expW || 0.45) * SEASON_GAMES) - 2); return { key: 'wins', n, txt: `Win at least ${n} games and lose no more than ${money(15)}` }; }
  }
  if (m === 'contend') return { key: 'cf', txt: 'Reach the conference finals' };
  if (m === 'hopeful') return { key: 'po', txt: `Make the playoffs (top ${poDirect(L)} seed)` };
  // owners lose patience with long rebuilds: after 3 seasons out of the playoffs they want progress, after 5 the playoffs
  if (t.pstate === 'final') return { key: 'po', txt: 'Make the playoffs, or the GM is fired' };
  if (t.pstate === 'demand') return { key: 'po', txt: `Make the playoffs (${t.strikes} season${t.strikes > 1 ? 's' : ''} left before a change)` };
  if (t.pstate === 'probation') return { key: 'po', txt: 'Make the playoffs again to win back the owner' };
  if ((t.drought || 0) >= 2 && (m === 'rebuild' || m === 'tank')) { const n = Math.max(24, Math.round((t.expW || 0.4) * SEASON_GAMES) + 3); return { key: 'wins', n, txt: `Show progress: win at least ${n} games (${t.drought} seasons out of the playoffs)` }; }
  if (m === 'rebuild') return { key: 'wins', n: Math.max(10, Math.round((t.expW || 0.4) * SEASON_GAMES) - 3), txt: `Win at least ${Math.max(10, Math.round((t.expW || 0.4) * SEASON_GAMES) - 3)} games and lose no more than ${money(t.market === 1 ? 15 : 10)}` };
  return t.market === 1 ? { key: 'profit', txt: `Build for the future and lose no more than ${money(10)}` } : { key: 'profit', txt: 'Build for the future and turn a profit' };
}
function ownerLimit(L, t) {
  const last = (t.finHist || []).slice(-1)[0];
  const rev = last ? last.revenue : mediaFor(L) + BASE_PRICE[t.market] * BASE_SEATS[t.market] * 0.82 * SEASON_GAMES / 2 / 1e6 + BASE_MERCH[t.market] + 8;
  const lim = r1(clamp(rev - staffCost(L, t) + Math.max(0, t.cash || 0) * 0.08 + (t.owner ? t.owner.wealth : 0), MINPAY + 5, APRON));
  return last ? lim : Math.max(lim, r1(payroll(L, t)));   // first season: the owner accepts the payroll he inherited
}
// v22 budget discipline: small and mid markets that aren't contending count real (cash) payroll against the owner's budget
const ownerPay = (L, t) => t.market <= 2 && t.mode !== 'contend' ? Math.max(payroll(L, t), cashPayroll(L, t)) : payroll(L, t);
function ownerOK(L, t, amt) { return !t.owner || t.id === L.user || ownerPay(L, t) + contractHit(amt, false) <= (t.owner.tight ? t.owner.limit + Math.min(contractHit(amt, false), MINSAL) : Math.max(t.owner.limit, ownerPay(L, t)) + 5); }
// a contending team's owner will pay some luxury tax: more in a big market or with cash in the bank
function taxTolerance(L, t) { if ((t.expMode || t.mode) !== 'contend') return 0; return ({ 3: 12, 2: 6, 1: 0 })[t.market] + ((t.cash || 0) > 80 ? 5 : (t.cash || 0) > 40 ? 2 : 0); }
// v21: what each status will spend to: All-in up to the hard cap, Contender up to the tax line (rich owners and big markets a bit past it), Push up to the tax line
function statusFloor(L, t) { const s = t.status; return s === 'allin' ? APRON : s === 'contend' ? TAXLINE + taxTolerance(L, t) : s === 'push' ? TAXLINE : 0; }
// v24.5.1: the season's spending limit as setOwnerGoals sets it (also used to preview next season's limit during the offseason)
function seasonLimit(L, t) { const low = (t.cash || 0) < OWNER_TAXCASH, sf = low ? Math.min(TAXLINE, statusFloor(L, t)) : statusFloor(L, t), tt = low ? 0 : taxTolerance(L, t); return cuttingLosses(L, t) ? r1(Math.min(APRON, ownerLimit(L, t))) : r1(Math.min(APRON, Math.max(ownerLimit(L, t), tt ? TAXLINE + tt : 0, sf))); }   // v36a part 3: with under $20M in the bank, all-in / contending owners stop at the tax line (deep repeat tax took owners to -$85M / -$101M)
const OWNER_TAXCASH = 20;
function setOwnerGoals(L) { for (const t of L.teams) { if (!t.owner) initFinance(L, t); t.owner.goal = ownerGoalFor(L, t); { const e = t.owner.esc; if (e && e.s === L.season) { if (goalRank(e.goal) >= goalRank(t.owner.goal)) t.owner.goal = e.goal; else t.owner.esc = null; } } t.owner.tight = cuttingLosses(L, t); t.owner.limit = seasonLimit(L, t); } }   // v24.5.1: a promise outranked by the new base goal is dropped (nothing extra at stake)
// v24.5.1: the limit that applies to signings now: this season's, or during the offseason a preview of next season's
function ownerLimitFor(L, t, cs) { cs = cs == null ? capSeason(L) : cs; return cs === L.season || !t.owner ? (t.owner ? t.owner.limit : APRON) : Math.max(0, seasonLimit(L, t)); }
// ---------- v24.5: owner approval for your free-agent signings past his spending limit ----------
// He approves if you accept one tougher goal for that season (one step up the ladder). Hard stops: more than $10M past his limit, or cash at or below zero.
// A goal of "win the title" means he is all in: no escalation needed. A missed promised goal costs double trust and a strike toward the hot seat.
const OWNER_HARD = 10;
function goalRank(g) { const k = g && g.key; return k === 'title' ? 4 : k === 'finals' ? 3 : k === 'cf' ? 2 : k === 'r2' ? 1 : k === 'po' || k === 'poC' ? 0 : -1; }
function goalOfRank(r) { return [{ key: 'po', txt: 'Make the playoffs' }, { key: 'r2', txt: 'Win a playoff round' }, { key: 'cf', txt: 'Reach the conference finals' }, { key: 'finals', txt: 'Reach the Finals' }, { key: 'title', txt: 'Win the title' }][clamp(r, 0, 4)]; }
function goalForSeason(L, t, cs) {
  const e = t.owner && t.owner.esc, base = cs === L.season && t.owner.goal ? t.owner.goal : ownerGoalFor(L, t);
  return e && e.s === cs && goalRank(e.goal) >= goalRank(base) ? e.goal : base;
}
function ownerCheck(L, amt, pend) {
  const t = L.teams[L.user]; if (!t || !t.owner || L.mode !== 'team') return { ok: true };
  const cs = capSeason(L), lim = ownerLimitFor(L, t, cs), after = payroll(L, t) + (pend || 0) + contractHit(amt, false), ls = `${yr(cs)} spending limit`;
  if (after <= lim + 1e-6) return { ok: true, lim, cs };
  if (after > lim + OWNER_HARD + 1e-6) return { ok: false, hard: true, lim, cs, msg: `Your owner won't go more than ${money(OWNER_HARD)} past his ${money(lim)} ${ls} (this would put payroll at ${money(after)}).` };
  if ((t.cash || 0) <= 0) return { ok: false, hard: true, lim, cs, msg: `Your owner won't spend past his ${money(lim)} ${ls} while the team's cash is at or below zero (${money(t.cash || 0)}).` };
  const cur = goalForSeason(L, t, cs);
  if (goalRank(cur) >= 4) return { ok: true, allIn: true };
  if (t.owner.esc && t.owner.esc.s === cs) return { ok: true, promised: true };
  const next = goalOfRank(goalRank(cur) + 1);
  return { ok: false, ask: true, cur, next, after, lim, cs, msg: `Needs owner approval: this puts payroll at ${money(after)}, past his ${money(lim)} ${ls}. He'll approve if you promise a tougher goal for ${yr(cs)}: "${next.txt}" instead of "${cur.txt}". Miss it and you lose about twice the usual trust and take a strike toward the hot seat.` };
}
function acceptOwnerGoal(L) {
  const t = L.teams[L.user], cs = capSeason(L), cur = goalForSeason(L, t, cs);
  if (goalRank(cur) >= 4 || (t.owner.esc && t.owner.esc.s === cs)) return;
  const nx = goalOfRank(goalRank(cur) + 1), goal = { key: nx.key, txt: nx.txt + ' (promised to the owner)', esc: true };
  t.owner.esc = { s: cs, goal };
  if (cs === L.season) t.owner.goal = goal;
  logNews(L, `You promised your owner a tougher goal for ${yr(cs)}: ${nx.txt.toLowerCase()}. He approved spending past his limit.`, t.id, 'league');
  addTimeline(L, `Promised the owner: ${nx.txt.toLowerCase()} (${yr(cs)})`, 'owner');
}
function goalMet(L, t, last) {
  const g = t.owner.goal || ownerGoalFor(L, t), po = poResult(L, t.id);
  if (g.key === 'title') return po === 'Champion';
  if (g.key === 'r2') return poRoundsWon(L, t.id) >= 1;   // v24.5.1: counts series won (in the 16-team format the first round is the conference semis)
  if (g.key === 'finals') return /Finals|Champion/.test(po);
  if (g.key === 'cf') return /conference finals|Finals|Champion/.test(po);
  if (g.key === 'po') return !/Missed|play-in/.test(po);
  if (g.key === 'poC') return !/Missed|play-in/.test(po) && last.profit >= -10;
  if (g.key === 'wins') return t.w >= g.n && last.profit >= (t.market === 1 ? -15 : -10);
  return last.profit >= (t.market === 1 ? -10 : 0);
}
// Owner sales: very rare, mostly after years of heavy losses. The new owner brings a fresh start (trust 60).
function ownerSales(L) {
  for (const t of L.teams) {
    t.redYears = (t.cash || 0) < -30 ? (t.redYears || 0) + 1 : 0;
    if (!((t.redYears >= 3 && R() < 0.5) || R() < 0.004)) continue;
    const old = t.owner; (t.ownerHist = t.ownerHist || []).push({ name: old.name, to: L.season });
    t.owner = genOwner(L, t); t.owner.goal = ownerGoalFor(L, t); t.owner.limit = ownerLimit(L, t);
    t.cash = Math.max(t.cash, 10); t.redYears = 0;
    logNews(L, `${old.name} sold the ${t.city} ${t.name} to ${t.owner.name}${t.id === L.user ? '. Your new owner starts fresh with you' : ''}`, t.id, 'league');
    if (t.id === L.user && L.me) addTimeline(L, `${old.name} sold the team to ${t.owner.name}`, 'owner');
  }
}
// ---------- Your career: timeline and achievements ----------
const ACH = { never: 'Never tanked: 10 straight non-losing seasons', spree: 'Shopping spree: 5 free agents in one offseason', penny: 'Penny pincher: playoffs with the lowest payroll', patient: 'Patience pays: your draft pick became an All-Star after 5+ seasons', dealer: 'Wheeler-dealer: 15 trades', lifer: 'Lifer: 10 seasons with one team', phoenix: 'From the ashes: a title within 4 seasons of a sub-20-win season', cinder: 'Cinderella: playoffs after being picked last', taxman: 'Taxman: paid the luxury tax', door: 'Revolving door: 3 head coaches in 2 seasons', po: 'First playoff berth', cf: 'Conference finals', title: 'Champion', b2b: 'Back-to-back titles', dynasty: 'Dynasty: 3 titles', w40: '40-win season', turn: 'Turnaround: +12 wins', steal: 'Draft steal', mvp: 'Your MVP', profit3: 'Profit machine: 3 straight profitable seasons', fav: "Owner's favorite: trust 90+", fired: 'Fired',
  // v25.1: more GM achievements
  homegrown: 'Homegrown: a title with 3+ starters you drafted', nomax: 'No superstar needed: a title without a max-contract player', youngest: 'Young guns: a title with the youngest roster in the league', undercap: 'Cap wizard: a title with a payroll under the cap',
  r2star: 'Second-round gem: a second-round pick of yours became an All-Star', mvpdraft: 'Called it: a player you drafted won MVP', asg3: 'All-Star factory: three of your draftees in one All-Star Game', nonlotto: 'Found outside the lottery: a non-lottery pick of yours made All-League', roydraft: 'Rookie of the Year from your draft', dev85: 'Built from scratch: a player you drafted reached 85+ with your team',
  fleece: 'Fleeced: an A-grade trade where the player you got became an All-Star', taxfree50: 'Efficient: 50+ wins while under the tax', profit5: 'Money printer: 5 straight profitable seasons', deadline: 'Deadline masterstroke: a title in a season with a deadline-week deal',
  worst2po: 'Worst to first round: the league\'s worst record, then the playoffs the next season', dynrun: 'Dynasty run: 3 titles in 5 seasons', hotseat: 'Survivor: off the hot seat and won a playoff round the next season' };
function addTimeline(L, text, k) { if (!L.me) return; (L.me.timeline = L.me.timeline || []).push({ s: L.season, t: text, k }); }
function unlock(L, key, text) { L.me.ach = L.me.ach || {}; if (L.me.ach[key] != null) return; L.me.ach[key] = L.season; addTimeline(L, (text || ACH[key]), 'ach'); }
// ---------- Season storylines: 3-5 threads picked from what's happening, followed in the news, wrapped up next preseason ----------
function storyStart(L) {
  const S = L.season, th = [{ k: 'mvp' }];
  const act = active(L).filter(p => !p.prospect && p.team != null);
  const rook = act.filter(p => p.draft && p.draft.s === S - 1 && p.draft.rd === 1).sort((a, b) => a.draft.no - b.draft.no)[0];
  if (rook) th.push({ k: 'rookie', pid: rook.id, tid: rook.team });
  const hot = L.teams.filter(t => t.owner).sort((a, b) => (['final', 'demand'].includes(b.pstate) ? 100 : 0) - (['final', 'demand'].includes(a.pstate) ? 100 : 0) || a.owner.trust - b.owner.trust)[0];
  if (hot && (hot.owner.trust < 45 || ['final', 'demand'].includes(hot.pstate))) th.push({ k: 'hotseat', tid: hot.id, cid: hot.coach.id, gm: hot.id === L.user ? 1 : 0 });
  const cy = act.filter(p => p.contract && p.contract.exp === S && p.ovr >= 70).sort((a, b) => b.ovr - a.ovr)[0];
  if (cy) th.push({ k: 'cy', pid: cy.id, tid: cy.team });
  const cb = act.filter(p => p.ovr >= 66 && (p.injuries || []).some(i => i.s === S - 1 && i.games >= 25)).sort((a, b) => b.ovr - a.ovr)[0];
  if (cb) th.push({ k: 'comeback', pid: cb.id });
  const rv = rivalPairs(L).map(q => h2h(L, q.lo, q.hi)).sort((a, b) => b.heat - a.heat)[0];
  if (rv) th.push({ k: 'rival', a: rv.lo, b: rv.hi, w0: [rv.wLo, rv.wHi] });
  const ch = act.map(p => { const c = careerTotals(p), m = MILESTONES.pts.find(x => x > c.pts); return { p, need: m ? m - c.pts : 1e9, m }; }).filter(x => x.need <= 1300).sort((a, b) => a.need - b.need)[0];
  if (ch) th.push({ k: 'chase', pid: ch.p.id, m: ch.m });
  L.story = { s: S, th: th.slice(0, 1).concat(th.slice(1).sort(() => R() - 0.5).slice(0, 4)) };
}
function storyTitle(L, x) {
  const P = id => (L.players[id] || {}).name || 'a player', T = id => L.teams[id] ? L.teams[id].city + ' ' + L.teams[id].name : 'a team';
  return { mvp: 'The MVP race', rookie: `Rookie watch: ${P(x.pid)}`, hotseat: `Hot seat: ${x.gm ? 'you and ' : ''}the ${T(x.tid)}`, cy: `Contract year: ${P(x.pid)}`, comeback: `Comeback: ${P(x.pid)}`, rival: `Rivalry: ${L.teams[x.a] ? L.teams[x.a].abbr : ''} vs ${L.teams[x.b] ? L.teams[x.b].abbr : ''}`, chase: `Chasing ${(x.m || 0).toLocaleString()}: ${P(x.pid)}`, surprise: `${x.up ? 'Surprise' : 'Collapse'}: the ${T(x.tid)}` }[x.k] || '';
}
function storyStatus(L, x) {
  const p = x.pid != null ? L.players[x.pid] : null, s = p && p.stats.rs && p.stats.rs.gp ? p.stats.rs : null, line = s ? `${f1n(s.pts / s.gp)} pts, ${f1n((s.orb + s.drb) / s.gp)} reb, ${f1n(s.ast / s.gp)} ast in ${s.gp} games` : 'no games yet';
  const rec = t => t ? `${t.w}-${t.l}` : '';
  if (x.k === 'mvp') { const l = L.phase === 'regular' && L.day >= 10 ? awardLadder(L, 'mvp', 3) : []; return l.length ? 'Leaders: ' + l.map(r => r.name).join(', ') : 'Too early to tell.'; }
  if (x.k === 'rookie' || x.k === 'comeback') return line;
  if (x.k === 'cy') return `${line}; ${p && p.team != null ? L.teams[p.team].abbr + ' ' + rec(L.teams[p.team]) : ''}`;
  if (x.k === 'hotseat') { const t = L.teams[x.tid]; return `${rec(t)} · owner trust ${t.owner ? t.owner.trust : '—'}`; }
  if (x.k === 'rival') { const r = L.h2h[h2hKey(x.a, x.b)]; return r ? `This season ${r.wLo - x.w0[0]}-${r.wHi - x.w0[1]} (${L.teams[r.lo].abbr} first)` : ''; }
  if (x.k === 'chase') { const c = careerTotals(p || { hist: [], stats: {} }); return c.pts >= x.m ? 'Reached it.' : `${(x.m - c.pts).toLocaleString()} points to go`; }
  if (x.k === 'surprise') { const t = L.teams[x.tid]; return `${rec(t)}, picked ${t.expRank}th preseason`; }
  return '';
}
const f1n = x => (Math.round(x * 10) / 10).toFixed(1);
function storyUpdate(L) {
  if (!L.story || L.story.s !== L.season) return;
  if (L.day === 25 && !L.story.th.some(x => x.k === 'surprise')) {
    const ord = L.teams.slice().sort((a, b) => pctOf(b) - pctOf(a));
    const sp = L.teams.map(t => ({ t, d: (t.expRank || 8) - (ord.indexOf(t) + 1) })).sort((a, b) => Math.abs(b.d) - Math.abs(a.d))[0];
    if (sp && Math.abs(sp.d) >= 5) { const x = { k: 'surprise', tid: sp.t.id, up: sp.d > 0 }; L.story.th.push(x); logNews(L, `Storyline: ${storyTitle(L, x)} (${storyStatus(L, x)})`, sp.t.id, 'story'); }
  }
  if (L.day % 14 === 7) { const x = L.story.th[(Math.floor(L.day / 14)) % L.story.th.length]; logNews(L, `Storyline · ${storyTitle(L, x)}: ${storyStatus(L, x)}`, x.tid != null ? x.tid : null, 'story'); }
}
// wrap-up at the start of the next season (free agency and firings are settled by then)
function storyEnd(L) {
  const st = L.story; if (!st) return;
  const S = st.s, A = L.awards[S] || {}, out = [];
  const P = id => L.players[id], H = (p, s) => p ? p.hist.find(h => h.s === s) : null, ln = h => h && h.rs && h.rs.gp ? `${f1n(h.rs.pts / h.rs.gp)} pts in ${h.rs.gp} games` : 'barely played';
  for (const x of st.th) {
    let r = '';
    if (x.k === 'mvp') r = A.mvp != null && P(A.mvp) ? `${P(A.mvp).name} won it.` : 'No MVP named.';
    else if (x.k === 'rookie') r = `${ln(H(P(x.pid), S))}${A.roy === x.pid ? ', and Rookie of the Year.' : '.'}`;
    else if (x.k === 'hotseat') { const t = L.teams[x.tid]; r = x.gm ? (L.user === x.tid ? 'You kept your job.' : 'You were fired.') : (t.coach.id === x.cid ? 'The coach survived.' : 'The coach was let go.'); }
    else if (x.k === 'cy') { const p = P(x.pid); r = !p ? 'Gone.' : p.retired ? 'He retired.' : p.team === x.tid ? `Stayed with ${L.teams[x.tid].abbr}${p.contract ? ` (${money(p.contract.amt)}/yr)` : ''}.` : p.team != null ? `Left for ${L.teams[p.team].abbr}.` : 'Still unsigned.'; }
    else if (x.k === 'comeback') r = ln(H(P(x.pid), S)) + '.';
    else if (x.k === 'rival') { const h = L.history.find(z => z.s === S); r = h && (h.champion === x.a || h.champion === x.b) ? `${L.teams[h.champion].abbr} won the title.` : 'Bragging rights only.'; }
    else if (x.k === 'chase') { const p = P(x.pid); r = p && careerTotals(p).pts >= x.m ? 'He got there.' : 'Not yet.'; }
    else if (x.k === 'surprise') { const h = L.history.find(z => z.s === S), s2 = h && h.standings.find(z => z.tid === x.tid); r = s2 ? `Finished ${s2.w}-${s2.l}.` : ''; }
    out.push({ t: storyTitle(L, x), r });
  }
  (L.storyHist = L.storyHist || {})[S] = out;
  L.story = null;
}
// ---------- Relationships: family (brothers, fathers and sons), mentors and friction ----------
function relate(a, b, ka, kb) { (a.rel = a.rel || []).push({ k: ka, id: b.id, c: !!b.isCoach }); (b.rel = b.rel || []).push({ k: kb, id: a.id }); }
function renameFamily(L, p, last, nat, home) { if (p.real) return false; const n = p.first + ' ' + last; if (usedNames(L).has(n)) return false; p.last = last; p.name = n; if (home || p.nat !== nat) p.home = home || hometownFor(nat) || undefined; p.nat = nat; usedNames(L).add(n); L.usedNames = [...usedNames(L)]; return true; }
// A few prospects each class are related to someone in the league
function familyTies(L, pros) {
  if (!pros.length) return;
  if (R() < 0.6) {   // a brother of a current player
    const p = pick(pros), o = pick(active(L).filter(x => !x.prospect && x.team != null && Math.abs(x.age - p.age) <= 7 && !(x.rel || []).length));
    if (o && renameFamily(L, p, o.last || splitName(o.name)[1], o.nat, o.home)) { relate(p, o, 'brother', 'brother'); logNews(L, `Family ties: draft prospect ${p.name} is the younger brother of ${o.name}`, o.team, 'draft'); }
  }
  if (R() < 0.3) {   // the son of a coach or a former star
    const p = pick(pros.filter(x => !(x.rel || []).length));
    const coaches = L.teams.map(t => t.coach).concat(L.coachPool || []).filter(c => c && c.age >= 46);
    const stars = Object.values(L.players).filter(x => x.retired && (x.legacy || 0) >= 250 && x.age - p.age >= 20);
    const useCoach = coaches.length && (R() < 0.5 || !stars.length);
    const dad = useCoach ? pick(coaches) : pick(stars);
    if (p && dad) {
      const last = dad.last || splitName(dad.name)[1], nat = dad.nat || p.nat;
      if (renameFamily(L, p, last, nat)) { (p.rel = p.rel || []).push({ k: 'son', id: dad.id, c: !!useCoach }); (dad.rel = dad.rel || []).push({ k: 'father', id: p.id }); logNews(L, `Family ties: draft prospect ${p.name} is the son of ${useCoach ? 'coach ' : ''}${dad.name}`, null, 'draft'); }
    }
  }
}
// a couple of brother pairs in a brand-new league
function initFamilies(L) {
  const ps = active(L).filter(p => p.team != null && !p.real);   // v27 H3: never rename a real NBA player (Brandon Ingram became 'Brandon Fontecchio')
  if (ps.length < 10) return;
  for (let i = 0; i < 2; i++) {
    const a = pick(ps), b = pick(ps.filter(x => x.id !== a.id && Math.abs(x.age - a.age) <= 6 && !(x.rel || []).length && !(a.rel || []).length));
    if (a && b && renameFamily(L, b, a.last || splitName(a.name)[1], a.nat, a.home)) relate(a, b, 'brother', 'brother');
  }
}
function relatives(L, p) { return (p.rel || []).map(r => ({ ...r, who: r.c ? findCoach(L, r.id) : L.players[r.id] })).filter(r => r.who); }
// Is family on this team? (a brother on the roster, or his father coaching it)
function familyOn(L, p, t) { return (p.rel || []).some(r => r.c ? t.coach && t.coach.id === r.id : (L.players[r.id] && L.players[r.id].team === t.id && r.id !== p.id && !L.players[r.id].retired)); }
// first head coach = mentor; a coach he asked out on = friction
function noteMentor(L, p) { if (p.mentor == null && p.team != null && L.teams[p.team]) p.mentor = L.teams[p.team].coach.id; }
// ---------- Player chemistry: seasons played together (20+ games each for the same team). Resets when they split up. ----------
function duoFit(a, b) { const fit1 = (x, y) => (x.pas >= 65 && y.tp >= 65) || (x.pos <= 1 && y.pos >= 3 && y.fin >= 65); return fit1(a, b) || fit1(b, a); }
function updateDuos(L) {
  const old = L.duo || {}, nw = {};
  for (const t of L.teams) {
    const ps = active(L).filter(p => p.stats && p.stats.rsT ? (p.stats.rsT[t.id] || {}).gp >= gpq(20) : (p.team === t.id && p.stats.rs && p.stats.rs.gp >= gpq(20)));
    for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) { const k = duoKey(ps[i].id, ps[j].id); nw[k] = Math.min(4, (old[k] || 0) + (duoFit(ps[i], ps[j]) ? 1.5 : 1)); }
  }
  L.duo = nw;
}
function teamDuos(L, t) {
  const ps = rotationOf(L, t).slice(0, 8), out = [];
  for (let i = 0; i < ps.length; i++) for (let j = i + 1; j < ps.length; j++) out.push({ a: ps[i], b: ps[j], n: duoYears(L, ps[i].id, ps[j].id) });
  const avg = out.length ? out.reduce((s, x) => s + x.n, 0) / out.length : 0;
  return { avg, best: out.filter(x => x.n > 0).sort((x, y) => y.n - x.n).slice(0, 3) };
}
// ---------- v37: friendships and duos ----------
// L.fr[duoKey(a,b)] = { since, why, duo }. Teammates who stick together become friends; two starting stars who are friends become a duo.
// Friends (or a duo) on the floor together add a little chemistry, a friend on a team pulls a free agent there, and he is happier with a friend beside him.
const FR = { max: 3, yrs: 2, chance: 0.10, mentor: 0.30, perTeam: 2, duoOvr: 70, duoYrs: 2, appeal: 0.08, appealDuo: 0.12, morale: 3, chem: 0.0015, chemDuo: 0.003 };
const FR_WHY = ['years as teammates', 'road roommates', 'same workout group in the summer', 'grew close in the locker room', 'pregame handshake partners', 'share a love of cards on team flights', 'neighbors in the same building', 'came up on the second unit together'];
const FR_NEWS = ['{a} and {b} are now close friends ({why}).', 'Locker room bond: {a} and {b} have become good friends ({why}).', '{a} calls {b} his best friend on the team ({why}).'];
const DUO_NEWS = ['Dynamic duo: {a} and {b} ({t}) are a pair the league has to plan for.', '{a} and {b} ({t}) are the new duo everyone is talking about.', 'Friends on and off the floor: {a} and {b} have become {t}\'s go-to duo.'];
const DUO_SPLIT = ['The duo is split up: {a} and {b} are no longer teammates, but stay friends.', '{a} and {b} won\'t share a floor anymore. The friendship stays, the duo is over.'];
function frGet(L, a, b) { return L.fr ? L.fr[duoKey(a, b)] || null : null; }
function friendsOf(L, p) {
  const out = []; if (!L.fr || !p) return out;
  for (const k in L.fr) { const [x, y] = k.split('-').map(Number); if (x !== p.id && y !== p.id) continue; const q = L.players[x === p.id ? y : x]; if (q && !q.retired) out.push({ f: L.fr[k], other: q, duo: !!(L.fr[k].duo && p.team != null && p.team === q.team) }); }   // duo only while teammates
  return out.sort((x, y) => (y.duo ? 1 : 0) - (x.duo ? 1 : 0) || x.f.since - y.f.since);
}
// a friend on team t (the best: a duo partner first). Used by free agency, morale and the signing tags.
function friendOn(L, p, t) { if (!L || !t) return null; return friendsOf(L, p).find(x => x.other.team === t.id && x.other.id !== p.id) || null; }
function frFill(s, a, b, why, t) { return s.replace('{a}', a.name).replace('{b}', b.name).replace('{why}', why || '').replace('{t}', t ? t.abbr : ''); }
function addFriend(L, a, b, why) {
  if (!a || !b || a.id === b.id || a.retired || b.retired) return null;
  L.fr = L.fr || {}; const k = duoKey(a.id, b.id); if (L.fr[k]) return L.fr[k];
  if (friendsOf(L, a).length >= FR.max || friendsOf(L, b).length >= FR.max) return null;
  try { if (rivalsOf(L, a).some(r => r.other.id === b.id)) return null; } catch (e) { }
  const f = L.fr[k] = { since: gameSeason(L), why };
  if (a.ovr >= 68 || b.ovr >= 68 || a.team === L.user) logNews(L, frFill(FR_NEWS[Math.floor(R() * FR_NEWS.length)], a, b, why), a.team === L.user ? a.team : null, 'league');
  return f;
}
// once a season, after updateDuos: new friendships between long-time teammates (and mentors with young players), duos made and split
function seedFriends(L) {
  L.fr = L.fr || {};
  for (const k in L.fr) { const [x, y] = k.split('-').map(Number); const a = L.players[x], b = L.players[y]; if (!a || !b || a.retired || b.retired) delete L.fr[k]; }
  for (const t of L.teams) {
    const rot = rotationOf(L, t).slice(0, 9), top5 = new Set(rot.slice(0, 5).map(p => p.id)); let made = 0;
    for (let i = 0; i < rot.length; i++) for (let j = i + 1; j < rot.length; j++) {
      const a = rot[i], b = rot[j], f = frGet(L, a.id, b.id);
      if (!f && made < FR.perTeam) {
        const yrs = duoYears(L, a.id, b.id), men = (a.pers === 'Mentor' && b.age <= 23) || (b.pers === 'Mentor' && a.age <= 23);
        const n0 = Object.keys(L.fr).length;
        if (men && yrs >= 1 && R() < FR.mentor) addFriend(L, a, b, a.pers === 'Mentor' ? `${a.name.split(' ').pop()} took him under his wing` : `${b.name.split(' ').pop()} took him under his wing`);
        else if (yrs >= FR.yrs && R() < FR.chance * (a.pers === 'Loyal' || b.pers === 'Loyal' ? 1.4 : 1)) addFriend(L, a, b, FR_WHY[Math.floor(R() * FR_WHY.length)]);
        if (Object.keys(L.fr).length > n0) made++;
      }
      const g = frGet(L, a.id, b.id);
      if (g && !g.duo && top5.has(a.id) && top5.has(b.id) && a.ovr >= FR.duoOvr && b.ovr >= FR.duoOvr && duoYears(L, a.id, b.id) >= FR.duoYrs) {
        g.duo = gameSeason(L); g.tid = t.id; logNews(L, frFill(DUO_NEWS[Math.floor(R() * DUO_NEWS.length)], a, b, '', t), t.id === L.user ? t.id : null, 'league');
      }
    }
  }
  for (const k in L.fr) { const f = L.fr[k]; if (!f.duo) continue; const [x, y] = k.split('-').map(Number); const a = L.players[x], b = L.players[y];
    if (a.team == null || a.team !== b.team) { delete f.duo; delete f.tid; if (a.ovr >= 70 || b.ovr >= 70) logNews(L, frFill(DUO_SPLIT[Math.floor(R() * DUO_SPLIT.length)], a, b), [a.team, b.team].includes(L.user) ? L.user : null, 'league'); } }
}
// new league: a few real-feeling bonds right away (teammates with the most seasons together)
function setupFriends(L) {
  if (L.fr) return; L.fr = {};
  for (const t of L.teams) {
    const rot = rotationOf(L, t).slice(0, 9), top = new Set(rot.slice(0, 5).map(p => p.id)), pairs = [];
    for (let i = 0; i < rot.length; i++) for (let j = i + 1; j < rot.length; j++) pairs.push([rot[i], rot[j], duoYears(L, rot[i].id, rot[j].id) + R()]);
    pairs.sort((x, y) => y[2] - x[2]); let n = 0;
    for (const [a, b, w] of pairs) {
      if (n >= 2) break; if (w < 1 || friendsOf(L, a).length >= FR.max || friendsOf(L, b).length >= FR.max) continue;
      const f = L.fr[duoKey(a.id, b.id)] = { since: gameSeason(L) - 1, why: w >= 2 ? 'years as teammates' : FR_WHY[1 + Math.floor(R() * (FR_WHY.length - 1))] }; n++;
      if (top.has(a.id) && top.has(b.id) && a.ovr >= 74 && b.ovr >= 74) { f.duo = gameSeason(L); f.tid = t.id; }
    }
  }
}
// engine: chemistry from friends sharing the floor (index by id for speed)
function frChem(L, five) { if (!L.fr) return { v: 0, n: 0, duo: 0 }; let v = 0, n = 0, d = 0; for (let i = 0; i < five.length; i++) for (let j = i + 1; j < five.length; j++) { const f = L.fr[duoKey(five[i].id, five[j].id)]; if (f) { n++; if (f.duo) { d++; v += FR.chemDuo; } else v += FR.chem; } } return { v, n, duo: d }; }
// ---------- Achievements for players, teams and coaches (GM ones are in ACH) ----------
const ACH_P = { iron: 'Iron man: every game for 6 straight seasons', journey: 'Journeyman: played for 8+ teams', oneteam: 'One-team man: 13+ seasons with one team', late: 'Late bloomer: first All-Star at 31+', tdm: 'Triple-double machine: 10 in a season', fifty: '55-point game', sniper: 'Sniper: 12 threes in a game', brick: 'Brick layer: 0-for-12 or worse', ghost: 'Ghost: 36+ minutes, 0 points on 5+ shots', blocks10: 'Swat team: 10 blocks in a game', dimes20: 'Dime store: 20 assists in a game', thousand: '1,000 career games', p10k: '15,000 career points' };
const ACH_T = { home: 'Perfect at home', w2f: 'Worst to first', comeback: 'Comeback kids: won after trailing by 30+', triot: 'Marathon: triple-overtime game', streak15: 'Hot streak: 18 straight wins', cold12: 'Cold streak: 18 straight losses', hundred: 'Lockdown: held a team under 68', blowout: 'Statement win: by 45+' };
const ACH_C = { interim: 'Interim miracle: playoffs as an interim coach', coy3: '3-time Coach of the Year', w300: '400 career wins', first: 'Instant impact: title in his first season with the team', survivor: 'Survivor: 10 seasons with one team' };
function achGive(L, ent, kind, key, extra) {
  ent.ach = ent.ach || {}; if (ent.ach[key] != null) return false;
  ent.ach[key] = L.season;
  const names = kind === 'p' ? ACH_P : kind === 't' ? ACH_T : ACH_C;
  (L.achLog = L.achLog || []).unshift({ s: L.season, kind, id: ent.id, key, text: names[key] + (extra ? ' (' + extra + ')' : '') });
  if (L.achLog.length > 500) L.achLog.length = 500;
  return true;
}
// Career milestones (regular season + playoffs, games and points), announced in the news
const MILESTONES = { pts: [10000, 15000, 20000, 25000], g: [1000] };
function careerTotals(p) { let pts = 0, g = 0; for (const h of p.hist) for (const s of [h.rs, h.po]) if (s) { pts += s.pts || 0; g += s.gp || 0; } for (const s of [p.stats.rs, p.stats.po]) if (s) { pts += s.pts || 0; g += s.gp || 0; } return { pts, g }; }
function milestoneCheck(L, p, before) {
  const now = careerTotals(p);
  for (const m of MILESTONES.pts) if (before.pts < m && now.pts >= m) { logNews(L, flL(L, 'ms.points', { name: p.name, n: m.toLocaleString() }), p.team, 'award', 'milestone'); (L.milestones = L.milestones || []).unshift({ s: L.season, pid: p.id, t: `${m.toLocaleString()} points` }); try { feedMilestone(L, p, `${m.toLocaleString()} career points`); } catch (e) { } }
  for (const m of MILESTONES.g) if (before.g < m && now.g >= m) { logNews(L, flL(L, 'ms.games', { name: p.name, n: m.toLocaleString() }), p.team, 'award', 'milestone'); (L.milestones = L.milestones || []).unshift({ s: L.season, pid: p.id, t: `${m.toLocaleString()} games` }); }
}
function gameAch(L, g) {
  for (const r of g.box) { const p = L.players[r[0]]; if (!p || !r[2]) continue; const now = careerTotals(p), before = { pts: now.pts - r[2 + IX.pts], g: now.g - 1 }; if ([...MILESTONES.pts].some(m => before.pts < m && now.pts >= m) || MILESTONES.g.some(m => before.g < m && now.g >= m)) milestoneCheck(L, p, before); }
  const day = g.playoff ? 'playoffs' : 'day ' + (g.day + 1);
  for (const r of g.box) {
    const p = L.players[r[0]]; if (!p) continue;
    const v = k => r[2 + IX[k]];
    if (v('pts') >= 55) achGive(L, p, 'p', 'fifty', v('pts') + ' pts, ' + yr(L.season));
    if (v('tpm') >= 12) achGive(L, p, 'p', 'sniper', v('tpm') + ' threes');
    if (v('fga') >= 12 && v('fgm') === 0) achGive(L, p, 'p', 'brick', '0-for-' + v('fga'));
    if (v('min') >= 2160 && v('pts') === 0 && v('fga') >= 5) achGive(L, p, 'p', 'ghost');
    if (v('blk') >= 10) achGive(L, p, 'p', 'blocks10');
    if (v('ast') >= 20) achGive(L, p, 'p', 'dimes20');
    if (!g.playoff && [v('pts'), v('orb') + v('drb'), v('ast'), v('stl'), v('blk')].filter(x => x >= 10).length >= 3) {
      p.tdc = p.tdc && p.tdc.s === L.season ? p.tdc : { s: L.season, n: 0 }; p.tdc.n++;
      if (p.tdc.n >= 10) achGive(L, p, 'p', 'tdm', yr(L.season));
    }
  }
  const H = L.teams[g.home], A = L.teams[g.away], hw = g.hs > g.as, W = hw ? H : A, Lo = hw ? A : H;
  if (g.lead && (hw ? g.lead[1] : g.lead[0]) >= 30) achGive(L, W, 't', 'comeback', `down ${hw ? g.lead[1] : g.lead[0]} vs ${Lo.abbr}`);
  if (g.ot >= 3) { achGive(L, H, 't', 'triot'); achGive(L, A, 't', 'triot'); }
  if (Math.abs(g.hs - g.as) >= 45) achGive(L, W, 't', 'blowout', `${Math.max(g.hs, g.as)}-${Math.min(g.hs, g.as)} vs ${Lo.abbr}`);
  if (Math.min(g.hs, g.as) < 68) achGive(L, W, 't', 'hundred');
  if (!g.playoff) { if (W.streak >= 18) achGive(L, W, 't', 'streak15'); if (Lo.streak <= -18) achGive(L, Lo, 't', 'cold12'); }
}
// end of the regular season and offseason checks
function seasonAch(L) {
  const S = L.season, G = SEASON_GAMES, prev = L.history.find(h => h.s === S - 1);
  for (const t of L.teams) {
    if (t.hw === G / 2 && t.hl === 0) achGive(L, t, 't', 'home', yr(S));
    if (prev) { const last = prev.standings.slice().sort((a, b) => a.w - b.w)[0]; const best = L.teams.slice().sort((a, b) => b.w - a.w)[0]; if (last.tid === t.id && best.id === t.id) achGive(L, t, 't', 'w2f', yr(S)); }
    const c = t.coach, po = poResult(L, t.id);
    if (c) {
      if (c.interim && !/Missed|play-in/.test(po)) achGive(L, c, 'c', 'interim', t.abbr);
      if (c.w >= 400) achGive(L, c, 'c', 'w300');
      if (S > 1 && po === 'Champion' && !(c.seasons || []).some(x => x.tid === t.id && x.s < S)) achGive(L, c, 'c', 'first', t.abbr + ' ' + yr(S));
      if ((c.seasons || []).filter(x => x.tid === t.id).length >= 10) achGive(L, c, 'c', 'survivor', t.abbr);
      let coy = 0; for (const s in L.awards) if (L.awards[s].coy === c.id || (L.awards[s].coy && L.awards[s].coy.cid === c.id)) coy++; if (coy >= 3) achGive(L, c, 'c', 'coy3');
    }
  }
  for (const p of active(L)) {
    if (p.prospect) continue;
    const rows = p.hist.filter(h => h.rs && h.rs.gp);
    const last5 = p.hist.slice(-6); if (last5.length === 6 && last5.every(h => h.rs && h.rs.gp >= G)) achGive(L, p, 'p', 'iron');
    const teams = new Set(p.hist.flatMap(h => h.teams && h.teams.length ? h.teams : [h.tid]).filter(x => x != null)); if (teams.size >= 8) achGive(L, p, 'p', 'journey');
    const gp = rows.reduce((a, h) => a + h.rs.gp + (h.po ? h.po.gp : 0), 0), pts = rows.reduce((a, h) => a + h.rs.pts, 0);
    if (gp >= 1000) achGive(L, p, 'p', 'thousand'); if (pts >= 15000) achGive(L, p, 'p', 'p10k');
    const as = p.awards.filter(a => a.a === 'All-Star'); if (as.length === 1 && as[0].s === S && p.age >= 31 && rows.length >= 6) achGive(L, p, 'p', 'late', 'age ' + p.age);
  }
}
// GM achievements added in v13 (season end)
function gmAchExtra(L, t) {
  const me = L.me, hist = me.hist;
  const mine = hist.filter(h => h.tid === t.id);
  const run = []; for (const h of hist.slice().reverse()) { if (h.w >= h.l) run.push(h); else break; } if (run.length + (t.w >= t.l ? 1 : 0) >= 10) unlock(L, 'never');
  if (mine.length + 1 >= 10) unlock(L, 'lifer');
  const po = poResult(L, t.id), pays = L.teams.map(x => ({ id: x.id, p: payroll(L, x) })).sort((a, b) => a.p - b.p);
  if (!/Missed|play-in/.test(po) && pays[0].id === t.id) unlock(L, 'penny');
  if (po === 'Champion' && mine.slice(-4).some(h => h.w < 20)) unlock(L, 'phoenix');
  if (!/Missed|play-in/.test(po) && t.expRank === L.teams.length) unlock(L, 'cinder');
  const last = t.finHist.slice(-1)[0]; if (last && last.tax > 0) unlock(L, 'taxman');
  if ((L.trades || []).filter(r => r.a === t.id || r.b === t.id || r.c === t.id).length >= 15) unlock(L, 'dealer');
  for (const p of active(L)) if (p.draft && p.draft.tid === t.id && S0(L) - p.draft.s >= 5 && p.awards.some(a => a.a === 'All-Star' && a.s === L.season) && p.team === t.id) { unlock(L, 'patient', `Patience pays: ${p.name}`); break; }
}
const S0 = L => L.season;
// v25.1: 17 more GM achievements (team building, draft and development, trades and money, turnarounds)
function gmAch251(L, t) {
  const me = L.me, S = L.season, po = poResult(L, t.id), champ = po === 'Champion', A = L.awards[S] || {}, mine = me.hist.filter(h => h.tid === t.id), prev = mine.slice(-1)[0];
  const byMe = p => !!p.draft && me.stints.some(st => st.tid === p.draft.tid && p.draft.s >= st.from - 1 && (st.to == null || p.draft.s <= st.to));
  const ros = rosterOf(L, t);
  if (champ) {
    if (rotationOf(L, t).slice(0, 5).filter(p => byMe(p) && p.draft.tid === t.id).length >= 3) unlock(L, 'homegrown');
    if (!ros.some(p => p.contract && p.contract.amt >= CAP * 0.25 - 0.05)) unlock(L, 'nomax');
    const avgAge = x => { const r = rosterOf(L, x); return r.reduce((a, p) => a + p.age, 0) / Math.max(1, r.length); };
    if (L.teams.every(x => x.id === t.id || avgAge(x) > avgAge(t))) unlock(L, 'youngest');
    if (payroll(L, t) <= CAP) unlock(L, 'undercap');
    const dd = deadlineDay(L); if ((L.trades || []).some(r => r.s === S && r.day != null && r.day >= dd - 7 && r.day <= dd && [r.a, r.b, r.c].includes(t.id))) unlock(L, 'deadline');
    const ts = me.hist.filter(h => h.po === 'Champion' && h.s >= S - 4).length + 1; if (ts >= 3) unlock(L, 'dynrun');
  }
  const act = active(L), asg = act.filter(p => p.awards.some(a => a.a === 'All-Star' && a.s === S));
  for (const p of asg) if (byMe(p) && p.draft.rd === 2) { unlock(L, 'r2star', `Second-round gem: ${p.name}`); break; }
  if (asg.filter(byMe).length >= 3) unlock(L, 'asg3');
  if (A.mvp != null && L.players[A.mvp] && byMe(L.players[A.mvp])) unlock(L, 'mvpdraft', `Called it: ${L.players[A.mvp].name} won MVP`);
  if (A.roy != null && L.players[A.roy] && byMe(L.players[A.roy])) unlock(L, 'roydraft', `Rookie of the Year from your draft: ${L.players[A.roy].name}`);
  for (const id of [...(A.all1 || []), ...(A.all2 || []), ...(A.all3 || [])]) { const p = L.players[id]; if (p && byMe(p) && (p.draft.rd === 2 || p.draft.no > 14)) { unlock(L, 'nonlotto', `Found outside the lottery: ${p.name}`); break; } }
  for (const p of ros) if (byMe(p) && p.draft.tid === t.id && p.ovr >= 85) { unlock(L, 'dev85', `Built from scratch: ${p.name} reached ${p.ovr}`); break; }
  for (const r of L.trades || []) { if (r.s < S - 6) continue; const side = r.a === t.id ? 'a' : r.b === t.id ? 'b' : r.c === t.id ? 'c' : null; if (!side || !r.grades || r.grades[side] !== 'A') continue;
    const got = (r[side + 'In'] || {}).players || []; const star = got.map(id => L.players[id]).find(p => p && p.team === t.id && p.awards.some(a => a.a === 'All-Star' && a.s === S)); if (star) { unlock(L, 'fleece', `Fleeced: ${star.name} became an All-Star`); break; } }
  if (t.w >= 50 && payroll(L, t) <= TAXLINE) unlock(L, 'taxfree50', `Efficient: ${t.w} wins under the tax`);
  const fh = t.finHist.slice(-5); if (fh.length === 5 && fh.every(h => h.profit > 0)) unlock(L, 'profit5');
  const lastS = (L.history || []).find(h => h.s === S - 1);
  if (prev && prev.s === S - 1 && lastS && lastS.standings && !/Missed|play-in/.test(po)) { const worst = lastS.standings.slice().sort((a, b) => a.w / Math.max(1, a.w + a.l) - b.w / Math.max(1, b.w + b.l))[0]; if (worst && worst.tid === t.id) unlock(L, 'worst2po'); }
  if (prev && prev.s === S - 1 && prev.trust != null && prev.trust < 35 && /semis|conference finals|Finals|Champion/.test(po)) unlock(L, 'hotseat');
}
function gmMilestones(L, t) {
  try { gmAchExtra(L, t); } catch (e) { }
  try { gmAch251(L, t); } catch (e) { }
  const po = poResult(L, t.id), me = L.me, prev = me.hist.filter(h => h.tid === t.id).slice(-1)[0];
  if (!/Missed|play-in/.test(po)) unlock(L, 'po');
  if (/conference finals|Finals|Champion/.test(po)) unlock(L, 'cf');
  if (po === 'Champion') {
    addTimeline(L, `Won the ${yr(L.season)} title with the ${t.name}`, 'title'); unlock(L, 'title');
    const titles = me.hist.filter(h => h.po === 'Champion').length + 1;
    if (prev && prev.po === 'Champion') unlock(L, 'b2b');
    if (titles >= 3) unlock(L, 'dynasty');
  } else if (po === 'Lost in Finals') addTimeline(L, `Reached the ${yr(L.season)} Finals`, 'po');
  if (t.w >= 40) unlock(L, 'w40', `${t.w}-win season`);
  if (prev && t.w - prev.w >= 12) unlock(L, 'turn', `Turnaround: ${prev.w} to ${t.w} wins`);
  const A = L.awards[L.season] || {}; if (A.mvp != null && L.players[A.mvp] && L.players[A.mvp].team === t.id) unlock(L, 'mvp', `Your MVP: ${L.players[A.mvp].name}`);
  const fh = t.finHist.slice(-3); if (fh.length === 3 && fh.every(h => h.profit > 0)) unlock(L, 'profit3');
  if (t.owner.trust >= 90) unlock(L, 'fav');
  for (const p of active(L)) if (p.draft && me.stints.some(s => s.tid === p.draft.tid && p.draft.s >= s.from - 1 && (s.to == null || p.draft.s <= s.to)) && (p.draft.rd === 2 || p.draft.no >= 10) && p.ovr >= 70 && !(me.steals || []).includes(p.id)) { (me.steals = me.steals || []).push(p.id); unlock(L, 'steal', `Draft steal: ${p.name}`); if (me.ach.steal !== L.season) addTimeline(L, `Draft steal: ${p.name} (pick ${p.draft.rd}-${p.draft.no}) became a ${p.ovr}`, 'draft'); }
}
function gmRep(L, me) {
  me = me || L.me; if (!me || !me.hist.length) return me && me.rep != null ? me.rep : 50;
  let s = 50; for (const h of me.hist) { s += (h.w / Math.max(1, h.w + h.l) - 0.5) * 30; s += /Champion/.test(h.po) ? 15 : /Finals/.test(h.po) ? 8 : /conference finals/.test(h.po) ? 5 : /semis/.test(h.po) ? 3 : 0; }
  return Math.round(clamp(s - (me.fired || 0) * 8, 0, 100));
}
// End of season: owners judge their GMs. Two straight seasons on the hot seat (trust under 35) and the GM is fired.
function ownerReview(L) {
  const S = L.season, notes = [];
  L.openings = [];
  for (const t of L.teams) {
    if (L.user === t.id && L.me) gmMilestones(L, t);
    const o = t.owner, last = t.finHist[t.finHist.length - 1], g = t.w + t.l, wp = g ? t.w / g : 0.5, po = poResult(L, t.id);
    const met = goalMet(L, t, last);
    let d = met ? 8 : -8;
    const escMiss = !met && o.goal && o.goal.esc;   // v24.5: a promised goal missed costs double, plus a strike
    if (escMiss) d -= 8;
    // Playoff patience. 3 straight seasons out: the owner demands the playoffs, and 2 more misses gets the GM fired.
    // A playoff trip earns some trust but only probation; a miss right after means next season is playoffs-or-fired.
    const made = !/Missed|play-in/.test(po), ps0 = t.pstate || 'ok'; let pfire = false;
    if (ps0 === 'ok') { if (!made && (t.drought || 0) >= 3) { t.pstate = 'demand'; t.strikes = 2; } }
    else if (ps0 === 'demand') { if (made) { t.pstate = 'probation'; t.probOk = 1; d += 6; } else if (--t.strikes <= 0) pfire = true; }
    else if (ps0 === 'probation') { if (made) { t.probOk = (t.probOk || 0) + 1; if (t.probOk >= 2) t.pstate = 'ok'; } else { t.pstate = 'final'; t.strikes = 1; } }
    else if (ps0 === 'final') { if (made) { t.pstate = 'probation'; t.probOk = 1; d += 6; } else pfire = true; }
    d += clamp((wp - (t.expW != null ? t.expW : 0.5)) * 40, -6, 6);
    // big-market owners expect a profit; small-market owners accept modest losses as the cost of being small
    const pf = last.profit;
    if (t.market === 3) d += pf >= 5 ? 2 : pf < -10 ? -6 : pf < 0 ? -4 : 0;
    else if (t.market === 2) d += pf > 0 ? 2 : pf < -15 ? -4 : 0;
    else d += pf > 0 ? 2 : pf < -20 ? -4 : pf < -10 ? -2 : 0;
    const over = last.capPay - o.limit; if (over > 0 && !(o.goal && o.goal.esc)) d -= Math.min(8, over / 2);   // v24.5.1: no over-limit penalty for spending he approved with a promise (the promise carries the risk)
    if (po === 'Champion') d += t.prevPo === 'Champion' ? 6 : 12; else if (po === 'Lost in Finals') d += 5;
    if ((t.drought || 0) >= 4) d -= Math.min(6, (t.drought - 3) * 2);     // fans and owner tire of losing
    // owners' patience drifts back toward neutral, so a great run doesn't buy unlimited credit
    if (d > 0 && o.trust > 80) d *= 0.5;      // harder to climb once trust is already high
    if (t.id === L.user && d < 0) d *= diffK(L).owner;   // Phase B: difficulty (owner patience with you)
    o.trust = Math.round(clamp(o.trust + d + (60 - o.trust) * 0.2, 0, 100));
    const prevHot = o.hot;
    o.hot = o.trust < 35 ? o.hot + 1 : 0;
    if (escMiss) { o.hot += 1; if (t.id === L.user) logNews(L, `You missed the goal you promised your owner (${o.goal.txt.replace(' (promised to the owner)', '').toLowerCase()}): a big trust loss and a strike toward the hot seat.`, t.id, 'league'); }
    if (o.esc && o.esc.s <= S) o.esc = null;
    o.hist.push({ s: S, trust: o.trust, d: Math.round(d), met, goal: (o.goal || {}).txt, profit: last.profit });
    const rec = { s: S, tid: t.id, w: t.w, l: t.l, po, trust: o.trust, profit: last.profit };
    if (t.id === L.user && L.me) L.me.hist.push(rec); else if (t.gm) t.gm.hist.push(rec);
    if (o.hot >= 2 || pfire) {
      // fired
      const why = pfire ? 'after missing the playoffs the owner demanded' : 'after two straight seasons on the hot seat';
      t.pstate = 'ok'; t.drought = 0; t.strikes = 0;      // a new GM gets a fresh clock
      if (t.id === L.user) {
        L.me.fired = (L.me.fired || 0) + 1; L.me.stints[L.me.stints.length - 1].to = S; L.me.stints[L.me.stints.length - 1].fired = true;
        L.firedFrom = t.id; L.user = null; L.jobless = true; addTimeline(L, `Fired by the ${t.name} ${why}`, 'fired'); L.me.ach = L.me.ach || {}; if (L.me.ach.fired == null) L.me.ach.fired = L.season;
        logNews(L, `${t.city} ${t.name} fired you as general manager ${why}`, t.id, 'league');
      } else { gmLeave(L, t, t.gm, 'fired'); logNews(L, `${t.city} ${t.name} fired general manager ${t.gm.name} ${why}`, t.id, 'league'); }
      const ng = gmNewHire(L, t);
      gmTakeOver(L, t, ng, S + 1);   // v27 S2: he brings his own style
      o.trust = 55; o.hot = 0;
      L.openings.push(t.id);
      if (t.id !== L.firedFrom || L.user != null) logNews(L, `${t.abbr} hired ${ng.name} as general manager`, t.id, 'league');
    } else if (t.id === L.user && t.pstate !== ps0 && (t.pstate === 'demand' || t.pstate === 'final')) logNews(L, t.pstate === 'final' ? `Final warning: miss the playoffs next season and you're fired.` : `Three seasons without the playoffs: your owner now demands a playoff team. Two more misses and you're fired.`, t.id, 'league');
    else if (o.hot === 1 && !prevHot && t.id === L.user) logNews(L, `Your owner is losing patience: you're on the hot seat. Another season like this and you'll be fired.`, t.id, 'league');
  }
  // job offers for an unemployed GM: openings this offseason (better teams only call strong reputations)
  if (L.mode === 'team' && L.jobless) {
    const rep = gmRep(L), ranks = L.teams.map(t => t.id).sort((a, b) => teamStrength(L, L.teams[b]) - teamStrength(L, L.teams[a]));
    L.jobOffers = L.openings.filter(tid => tid !== L.firedFrom || false).filter(tid => ranks.indexOf(tid) >= 8 ? rep >= 20 : rep >= 55);
    if (!L.jobOffers.length && L.openings.length && rep >= 20) L.jobOffers = [L.openings.slice().sort((a, b) => ranks.indexOf(b) - ranks.indexOf(a))[0]].filter(tid => tid !== L.firedFrom);
  } else L.jobOffers = [];
}
function takeJob(L, tid) {
  const t = L.teams[tid];
  if (t.gm) gmLeave(L, t, t.gm, 'replaced');   // v27 S2
  t.gm = null; L.user = tid; L.jobless = false; L.jobOffers = []; t.pstate = 'ok'; t.drought = 0; t.strikes = 0;
  t.owner.trust = 60; t.owner.hot = 0;
  L.me.stints.push({ tid, from: coachStartSeason(L) });
  addTimeline(L, `Hired as general manager of the ${t.city} ${t.name}`, 'job');
  t.manual = null;
  logNews(L, `You were hired as general manager of the ${t.city} ${t.name}`, tid, 'league');
}
// ---------- Salary dumps: teams over the tax pay a sweetener to move a contract to a team with room ----------
function dumpCandidate(L, t) {
  const cs = capSeason(L);
  return rosterOf(L, t).filter(p => p.contract && p.contract.amt >= 6 && p.contract.exp >= cs && p.mval < p.contract.amt * 0.85 && !tradeRestricted(L, p) && (tradeStatus(L, p) || {}).k !== 'protect').sort((a, b) => (b.contract.amt - b.mval) - (a.contract.amt - a.mval))[0];
}
function salaryDump(L, toUser) {
  const cs = capSeason(L);
  const over = L.teams.filter(t => t.id !== L.user && (payroll(L, t, cs) > TAXLINE || ((t.mode === 'rebuild' || t.mode === 'tank') && payroll(L, t, cs) > CAP - 8)));
  if (!over.length) return null;
  const A = pick(over), p = dumpCandidate(L, A); if (!p) return null;
  const hit = capHit(L, p, cs);
  const recv = L.teams.filter(t => t.id !== A.id && (toUser ? t.id === L.user : t.id !== L.user) && CAP - payroll(L, t, cs) >= hit && t.roster.length < 15).sort((a, b) => (payNoFloor(L, a, cs) < MINPAY) !== (payNoFloor(L, b, cs) < MINPAY) ? (payNoFloor(L, b, cs) < MINPAY) - (payNoFloor(L, a, cs) < MINPAY) : (b.mode === 'rebuild' || b.mode === 'tank') - (a.mode === 'rebuild' || a.mode === 'tank'));   // v32g: teams under the payroll floor first
  for (const B of recv) {
    // only attach picks when the contract is a real burden; a useful player on a big deal is moved for nothing
    // v32g: a team under the payroll floor pays the gap anyway, so salary that keeps it under the floor costs it nothing: it asks for less
    const v = playerTV(L, B, p, false), free = Math.max(0, Math.min(hit, MINPAY - payNoFloor(L, B, cs))) / Math.max(hit, 1), need = (v >= 1.2 ? 0 : Math.max(0.5, 1.2 - v)) * (1 - 0.6 * free);
    const picks = L.picks.filter(k => k.owner === A.id && k.s > L.season && !pickUsed(L, k)).sort((a, b) => b.rd - a.rd || b.s - a.s);
    const aGive = { players: [p.id], picks: [] }; let got = 0; const gv = [];
    for (const k of picks) { if (got >= need || aGive.picks.length >= 2) break; aGive.picks.push(k.id); gv.push(pickTV(L, B, k)); got = bundleSum(gv); }
    if (got < need) continue;
    const bGive = { players: [], picks: [] };
    if (tradeCheck(L, A.id, B.id, aGive, bGive)) continue;
    const yl = p.contract.exp - cs + 1;
    const reason = payroll(L, A, cs) > TAXLINE ? `${A.abbr} are over the ${money(TAXLINE)} tax line (${money(payroll(L, A, cs))})` : `${A.abbr} are rebuilding and clearing cap space (${money(payroll(L, A, cs))})`;
    return { a: A.id, b: B.id, aGive, bGive, id: 'dump-' + Date.now() + '-' + B.id, dump: true, why: `Salary dump: ${reason}. They'll attach ${aGive.picks.length} pick${aGive.picks.length > 1 ? 's' : ''} for you to take ${p.name}'s ${money(p.contract.amt)}/yr (${yl} season${yl > 1 ? 's' : ''} left).` };
  }
  return null;
}
// A contender over the cap takes on salary (up to the 125% rule) to add a veteran from a rebuilding team
function contenderBuy(L) {
  const cs = capSeason(L);
  const buyers = L.teams.filter(t => t.id !== L.user && (t.mode === 'contend' || t.status === 'push') && payroll(L, t, cs) < Math.min(APRON - 3, t.owner ? t.owner.limit : APRON));
  if (!buyers.length) return null;
  const B = pick(buyers), rot = rotationOf(L, B), bar = (rot[4] || { ovr: 60 }).ovr;
  const cands = [];
  const room = Math.max(0, CAP - payroll(L, B, cs));
  const fillCap = rosterOf(L, B).sort((a, b) => b.ovr - a.ovr).slice(5).reduce((a, x) => a + (x.contract ? capHit(L, x, cs) : 0), 0) * 1.25 + room;
  for (const A of L.teams) { if (A.id === B.id || A.id === L.user || !(A.mode === 'rebuild' || A.mode === 'tank')) continue; for (const p of rosterOf(L, A)) if (p.age >= 26 && p.ovr >= bar && p.contract && p.contract.amt >= 4 && capHit(L, p, cs) <= fillCap && !tradeRestricted(L, p) && !p.protect && p.injury <= 0) cands.push([A, p]); }
  if (!cands.length) return null;
  cands.sort((x, y) => y[1].ovr - x[1].ovr);
  const [A, p] = cands[Math.min(cands.length - 1, rint(0, 2))];
  const s = capHit(L, p, cs), core = new Set(rosterOf(L, B).sort((a, b) => b.ovr - a.ovr).slice(0, 5).map(x => x.id));
  const fill = rosterOf(L, B).filter(x => !core.has(x.id) && x.contract && !tradeRestricted(L, x) && x.ovr < p.ovr).sort((a, b) => capHit(L, b, cs) - capHit(L, a, cs));
  const bGive = { players: [], picks: [] }; let out = 0;
  if (s > room) { for (const x of fill) { if (out >= (s - room) / 1.25) break; const h = capHit(L, x, cs); if (out + h > s) continue; bGive.players.push(x.id); out += h; }
    if (out < (s - room) / 1.25 - 1e-6) return null; }
  // a contender would rather win now than keep a future first
  const picks = L.picks.filter(k => k.owner === B.id && k.s > L.season && !pickUsed(L, k));
  const first = picks.filter(k => k.rd === 1).sort((a, b) => b.s - a.s)[0], second = picks.filter(k => k.rd === 2).sort((a, b) => a.s - b.s)[0];
  if (p.ovr >= 70 && first) bGive.picks.push(first.id); else if (second) bGive.picks.push(second.id); else if (first) bGive.picks.push(first.id);
  if (p.ovr >= 78 && second && first && !bGive.picks.includes(second.id)) bGive.picks.push(second.id);
  const aGive = { players: [p.id], picks: [] };
  if (tradeCheck(L, A.id, B.id, aGive, bGive)) return null;
  return { a: A.id, b: B.id, aGive, bGive, id: 'buy-' + Date.now() + '-' + B.id, why: `${B.abbr} are contending and took on salary to add ${p.name} (${money(s)}/yr) from rebuilding ${A.abbr}${bGive.picks.length ? ', giving up ' + bGive.picks.map(pk => pickLabel(L, L.picks.find(k => k.id === pk))).join(' and ') : ''}` };
}
function runSalaryDumps(L) {
  if (!inTradeWindow(L)) return;
  const nearDeadline = L.phase === 'regular' && L.day >= deadlineDay(L) - wkLen(L), dk = L.phase === 'regular' ? dayK(L) : 1;   // v24.6: per-day chances scaled to the longer season
  if (R() < (nearDeadline ? 0.45 : 0.12) * dk) { const tr = gateType(L, contenderBuy(L)); if (tr) { if (L.mode === 'commish') { tr.when = seasonLabel(L); tr.isNew = true; L.pending.push(tr); } else executeTrade(L, tr); logNews(L, tr.why, tr.b, 'trade'); } }
  try { runExpiringTrades(L); } catch (e) { }   // v32e
  if (R() < 0.12 * dk) { const tr = gateType(L, salaryDump(L, false)); if (tr) { if (L.mode === 'commish') { tr.when = seasonLabel(L); tr.isNew = true; L.pending.push(tr); } else { executeTrade(L, tr); } logNews(L, tr.why.replace('for you to take', 'for ' + L.teams[tr.b].abbr + ' to take'), tr.a, 'trade'); } }
  if (L.user != null && R() < 0.08 * dk && (L.offers || []).length < 3) { const tr = salaryDump(L, true); if (tr && afterTradeOK(L, tr) && !L.offers.some(o => o.dump)) { tr.isNew = true; tr.ttl = L.phase === 'regular' ? 7 : 3; tr.made = L.season * 1000 + L.day; L.offers.push(tr); } }
}

// ---------- v32e: win-first stars (pay cut to join a contender) and expiring-contract trades ----------
// Usually 0-2 an offseason (no quota): an older star / good veteran starter free agent (30+, OVR 66+) takes a pay cut to join a contender. Mostly stars with no ring;
// a few multi-champs who want more; one-ring stars rarely. Never a player you have an offer out to. Runs on free-agency days 1-3.
// To keep a pool, an older ringless star on a non-contender sometimes skips re-signing to test the market (startResign, wfLeave).
const WIN_FIRST = { ovr: 66, age: 30, leave: 0.7, days: 3, p: 0.8, cut: [0.45, 0.75], floor: 0.3 };
// v32 review: the star bar follows the league (the ~5-per-team best players, never under 66). With an absolute 66 the pool grew with the
// league's rating climb: 0-2 win-first moves a summer early on, 4-6 by season 13-15 (target 1-2). Cached per season, not saved.
function wfBar(L) {
  if (L._wfb && L._wfb.k === L.season) return L._wfb.v;
  const fa = new Set(L.fa || []), ov = Object.values(L.players).filter(p => !p.retired && !p.prospect && !p.abroad && (p.team != null || fa.has(p.id))).map(p => p.ovr).sort((a, b) => b - a);
  const v = Math.max(WIN_FIRST.ovr, ov[Math.round(5 * L.teams.length) - 1] || WIN_FIRST.ovr);
  Object.defineProperty(L, '_wfb', { value: { k: L.season, v }, enumerable: false, writable: true, configurable: true });
  return v;
}
function winFirstScore(L, p) {
  const rings = (p.awards || []).filter(a => a.a === 'Champion').length;
  const base = rings === 0 ? 1 : rings >= 2 && p.age >= 32 ? 0.3 : 0.1;
  return base * (1 + 0.15 * (p.age - WIN_FIRST.age)) * (0.6 + 0.8 * twp(p, 'win'));
}
function winFirstCands(L) {
  return L.fa.map(id => L.players[id]).filter(p => p && !p.retired && !p.prospect && !p.abroad && !p.club && p.ovr >= wfBar(L) && p.age >= WIN_FIRST.age && (p.mval || 0) >= 6 && !isRFA(L, p) && !p.sheet && !(L.faOffers || {})[p.id] && p.winFirst !== L.season);
}
function winFirstTeams(L, p) {
  const out = [];
  for (const t of L.teams) {
    if (t.id === L.user || t.id === p.lastTeam || !(t.status === 'allin' || t.status === 'contend' || t.mode === 'contend') || t.roster.length >= 15) continue;
    if (p.pers === 'Mentor' && mentorsOf(L, t).length >= MENTOR_MAX) continue;
    const rot = rotationOf(L, t), f = b2Fit(L, t, p);
    if (!(f.starter || f.need || p.ovr >= (rot[6] ? rot[6].ovr : 0))) continue;   // he'd play real minutes there
    const room = Math.min(MLE_REAL ? faRoom(L, t) : APRON - payroll(L, t), t.owner ? Math.max(0, t.owner.limit + 5 - payroll(L, t)) : 99);   // v32g: over the cap a contender has its mid-level
    let amt = r1(p.mval * rnd(WIN_FIRST.cut[0], WIN_FIRST.cut[1]));
    amt = Math.min(amt, r1(room - 0.2));
    if (amt < 1.5) amt = MINSAL;
    if (amt < p.mval * WIN_FIRST.floor) continue;   // a pay cut, not a giveaway: not a team that can only offer scraps
    if (amt > p.mval * 0.8 || !canFit(L, t, amt, false, 'signing') || !ownerOK(L, t, amt)) continue;
    out.push({ t, amt, sc: teamStrength(L, t) + (f.need ? 2 : 0) + rnd(0, 2) });
  }
  return out.sort((a, b) => b.sc - a.sc);
}
function winFirstFA(L) {
  if (L.phase !== 'off-fa' || L.faDay > WIN_FIRST.days) return [];
  const W = L.winFirst && L.winFirst.s === L.season ? L.winFirst : (L.winFirst = { s: L.season, n: 0, cands: 0, who: [] });
  const done = [], pool = winFirstCands(L); W.cands = Math.max(W.cands || 0, pool.length);
  for (const p of pool) {   // no quota: each candidate decides once (first day he is seen); if he does, he signs as soon as a contender fits (days 1-3)
    if (!p.wfAsk || p.wfAsk.s !== L.season) p.wfAsk = { s: L.season, yes: R() < Math.min(0.85, WIN_FIRST.p * winFirstScore(L, p)) };
    if (!p.wfAsk.yes) continue;
    const opts = winFirstTeams(L, p); if (!opts.length) continue;
    const o = opts[Math.min(opts.length - 1, R() < 0.7 ? 0 : rint(1, 2))], yrs = p.age >= 34 ? 1 : rint(1, 2), rings = (p.awards || []).filter(a => a.a === 'Champion').length;
    p.winFirst = L.season;
    signContract(L, p, o.t.id, o.amt, yrs, 'signing', null, { rl: expRole(L, o.t, p) });
    p.tx.push({ s: L.season, t: `Took a pay cut to chase ${rings ? 'another' : 'a'} ring (value ${money(p.mval)})` });
    logNews(L, flL(L, 'news.paycut', { name: p.name, team: o.t.abbr, amt: money(o.amt), val: money(p.mval) }), o.t.id, 'tx', 'paycut');
    W.n++; W.who.push({ pid: p.id, tid: o.t.id, amt: o.amt, mval: p.mval, rings });
    done.push(p.id);
  }
  return done;
}
// AI teams trade for expiring contracts to clear space for next summer. The team clearing space (A) sends a long contract it doesn't want
// or that doesn't fit; the partner (B) takes it because it wants the player (a contender) or for low picks (late 1sts / 2nds) from A.
const EXP_TR = { max: 8, minAmt: 5, picks: 2 };
function expLowPicks(L, A) {
  const n = L.teams.length, late = k => pickProj(L, k).mean >= 0.6 * n;
  return L.picks.filter(k => k.owner === A.id && k.s > L.season && !pickUsed(L, k) && !k.prot && (k.rd === 2 || (k.orig !== A.id && late(k)) || (k.orig === A.id && !['tank', 'rebuild'].includes(A.mode) && late(k))))
    .sort((a, b) => b.rd - a.rd || pickProj(L, b).mean - pickProj(L, a).mean);
}
function expUnwanted(L, A) {
  const cs = capSeason(L), rot = new Set(rotationOf(L, A).slice(0, 7).map(x => x.id)), rebuilding = ['tank', 'rebuild'].includes(A.mode) || A.status === 'retool';
  return rosterOf(L, A).filter(p => p.contract && p.contract.exp >= cs + 1 && p.contract.amt >= EXP_TR.minAmt && !p.ext && !tradeRestricted(L, p) && (tradeStatus(L, p) || {}).k !== 'protect' && iconTier(L, p, A.id) < 1 && p.injury < 30
    && (p.mval < p.contract.amt * 0.9 || (rebuilding && p.age >= 28) || !rot.has(p.id)))
    .map(p => ({ p, burden: (p.contract.amt - Math.min(p.mval, p.contract.amt)) * (p.contract.exp - cs) + (rebuilding && p.age >= 28 ? 3 : 0) + (!rot.has(p.id) ? 2 : 0) }))
    .sort((a, b) => b.burden - a.burden).map(x => x.p);
}
function expiringTrade(L) {
  const cs = capSeason(L);
  if (L.phase !== 'regular' || (L.expTr && L.expTr.s === L.season && L.expTr.n >= EXP_TR.max)) return null;
  const As = L.teams.filter(t => t.id !== L.user && !['allin', 'contend'].includes(t.status) && payroll(L, t, cs + 1) > CAP - 20);
  if (!As.length) return null;
  const A = pick(As), xs = expUnwanted(L, A).slice(0, 2); if (!xs.length) return null;
  for (const X of xs) {
    const cands = [];
    for (const B of L.teams) {
      if (B.id === A.id || B.id === L.user) continue;
      for (const E of rosterOf(L, B)) {
        if (!E.contract || E.contract.exp !== cs || E.contract.opt || E.ext || E.contract.amt < EXP_TR.minAmt || tradeRestricted(L, E) || (tradeStatus(L, E) || {}).k === 'protect' || iconTier(L, E, B.id) >= 1) continue;
        if (E.contract.amt < X.contract.amt / 1.3 || E.contract.amt > X.contract.amt * 1.3) continue;
        const fitsB = ['contend', 'hopeful'].includes(B.mode) && X.ovr >= E.ovr - 1 && X.age <= 31 && ['allin', 'contend', 'push'].includes(B.status);
        cands.push({ B, E, fitsB, r: R() });
      }
    }
    cands.sort((a, b) => b.fitsB - a.fitsB || a.r - b.r);
    for (const { B, E, fitsB } of cands.slice(0, 6)) {
      // B's view: X (with his years) + picks vs E; A pays the gap with low picks
      const gap = playerTV(L, B, E, true) - playerTV(L, B, X, false) + (fitsB ? 0 : 0.6);
      const aGive = { players: [X.id], picks: [] }, gv = [];
      if (gap > 0) { for (const k of expLowPicks(L, A)) { if (bundleSum(gv) >= gap || aGive.picks.length >= EXP_TR.picks) break; aGive.picks.push(k.id); gv.push(pickTV(L, B, k)); } if (bundleSum(gv) < gap) continue; }
      const bGive = { players: [E.id], picks: [] };
      if (tradeCheck(L, A.id, B.id, aGive, bGive)) continue;
      const saved = r1(X.contract.amt), yl = X.contract.exp - cs;
      const pk = aGive.picks.map(id => pickLabel(L, L.picks.find(k => k.id === id)));
      const why = `${A.abbr} traded for ${E.name}'s expiring ${money(E.contract.amt)} to clear ${money(saved)} a year (${yl} more season${yl > 1 ? 's' : ''}) for next summer's free agency` + (pk.length ? `, adding ${pk.join(' and ')} for ${B.abbr} to take ${X.name}'s deal` : fitsB ? `; ${B.abbr} wanted ${X.name} on a longer deal` : '');
      return { a: A.id, b: B.id, aGive, bGive, id: 'exp-' + L.season + '-' + L.day + '-' + A.id + '-' + B.id, exp: true, wkA: 'expiring', wkB: pk.length ? 'absorb' : 'longfit', why };
    }
  }
  return null;
}
function runExpiringTrades(L) {
  if (L.phase !== 'regular' || !inTradeWindow(L)) return;
  const nearDeadline = L.day >= deadlineDay(L) - 2 * wkLen(L), dk = dayK(L);
  if (R() >= (nearDeadline ? 0.3 : 0.07) * dk) return;
  const tr = gateType(L, expiringTrade(L)); if (!tr) return;
  L.expTr = L.expTr && L.expTr.s === L.season ? L.expTr : { s: L.season, n: 0 }; L.expTr.n++;
  if (L.mode === 'commish') { tr.when = seasonLabel(L); tr.isNew = true; L.pending.push(tr); } else executeTrade(L, tr);
  logNews(L, tr.why, tr.a, 'trade');
}

// ---------- All-Star game: mid-season, North vs South; fans vote the starters, stats pick the reserves ----------
function allStarDay(L) { return Math.floor(L.schedule.length * (L.y0 != null ? 0.71 : 0.55)); }   // v26.6b: NBA calendar leagues hold it in mid-February, right after the deadline
function allStarVotes(L, conf) {
  const out = [];
  for (const t of L.teams.filter(x => x.conf === conf)) {
    const g = t.w + t.l, wp = g ? t.w / g : 0.5;
    for (const p of rosterOf(L, t)) {
      const s = p.stats.rs; if (!s || s.gp < 3) continue;
      const sc = (p.fame || 0) * 0.9 + (s.pts / s.gp) * 1.7 + ((s.reb != null ? s.reb : (s.orb || 0) + (s.drb || 0)) / s.gp) * 0.5 + ((s.ast || 0) / s.gp) * 0.8 + wp * 15 + (t.market - 2) * 3 + hgauss(p.id, L.season * 31 + Math.floor(L.day / 7)) * 3;
      out.push({ pid: p.id, tid: t.id, votes: Math.round(Math.max(0, sc) ** 2 * 260) });
    }
  }
  return out.sort((a, b) => b.votes - a.votes);
}
function allStarStat(p) { const s = p.stats.rs; return s && s.gp ? gmsc(seasonLine(s)) / s.gp * Math.min(1, s.gp / 15) : 0; }
function pickAllStars(L, conf) {
  const votes = allStarVotes(L, conf).filter(v => L.players[v.pid].injury <= 0);
  const g = votes.filter(v => L.players[v.pid].pos <= 1).slice(0, 2), f = votes.filter(v => L.players[v.pid].pos >= 2).slice(0, 3);
  const starters = [...g, ...f].map(v => v.pid), taken = new Set(starters);
  const pool = L.teams.filter(t => t.conf === conf).flatMap(t => rosterOf(L, t)).filter(p => !taken.has(p.id) && p.injury <= 0).sort((a, b) => allStarStat(b) - allStarStat(a));
  return { starters, reserves: pool.slice(0, 7).map(p => p.id) };
}
function runAllStar(L) {
  const S = L.season, confs = ['North', 'South'], R2 = {};
  for (const c of confs) R2[c] = pickAllStars(L, c);
  for (const c of confs) for (const id of [...R2[c].starters, ...R2[c].reserves]) L.players[id].awards.push({ s: S, a: 'All-Star' });
  const AS = L.allStar = { s: S, day: L.day, rosters: R2, votes: { North: allStarVotes(L, 'North').slice(0, 12), South: allStarVotes(L, 'South').slice(0, 12) } };
  try { AS.contests = runContests(L); } catch (err) { AS.contests = null; }   // v38 All-Star Weekend
  try {
    const best = c => L.teams.filter(t => t.conf === c).sort((a, b) => b.w - a.w)[0];
    const mk = (id, c) => { const b = best(c); return { ...b, id, roster: [...R2[c].starters, ...R2[c].reserves], coach: b.coach, manual: null, name: c, abbr: c.slice(0, 3).toUpperCase() }; };
    const TL = { ...L, teams: [...L.teams, mk(L.teams.length, 'North'), mk(L.teams.length + 1, 'South')], user: null, noInj: true };
    const g = playGame(TL, L.teams.length, L.teams.length + 1);
    const row = r => ({ pid: r[0], side: r[1], pts: r[3], reb: r[10] + r[11], ast: r[12] });
    const box = g.box.map(row);
    const winSide = g.hs > g.as ? 0 : 1, mvp = box.filter(b => b.side === winSide).sort((a, b) => (b.pts + b.reb * 0.5 + b.ast * 0.7) - (a.pts + a.reb * 0.5 + a.ast * 0.7))[0];
    AS.game = { north: g.hs, south: g.as, mvp: mvp ? mvp.pid : null, box };
    if (mvp) L.players[mvp.pid].awards.push({ s: S, a: 'All-Star MVP' });
    logNews(L, `All-Star Game: ${confName(g.hs > g.as ? 'North' : 'South', L)} won ${Math.max(g.hs, g.as)}-${Math.min(g.hs, g.as)}${mvp ? `; MVP ${L.players[mvp.pid].name} (${mvp.pts} pts, ${mvp.reb} reb, ${mvp.ast} ast)` : ''}`, null, 'award');
  } catch (err) { AS.game = null; }
  (L.allStarHist = L.allStarHist || {})[S] = { rosters: R2, contests: AS.contests || null, game: AS.game ? { north: AS.game.north, south: AS.game.south, mvp: AS.game.mvp } : null };
  updateFame(L);
}

// ---------- v38 All-Star Weekend contests: Three-Point Contest, Slam Dunk Contest, Skills Challenge ----------
// Own seeded dice (hrand), never R(): the rest of the league sim is unchanged.
const ASW_AW = { three: 'Three-Point Contest champion', dunk: 'Slam Dunk Contest champion', skills: 'Skills Challenge champion' };
// Dunk book: name, difficulty 1-5, needs a prop/teammate. Bigger dunks score more but miss more.
const ASW_DUNKS = [['two-hand power jam', 1], ['tomahawk', 1], ['reverse jam', 2], ['360 slam', 2], ['windmill', 2], ['alley-oop off the backboard', 3], ['cradle dunk', 3], ['between-the-legs jam', 4], ['360 windmill', 4], ['free-throw-line dunk', 4], ['leap over a teammate', 4], ['between-the-legs off the bounce', 5], ['eastbay over a seated teammate', 5], ['540 reverse', 5]];
function aswRng(L, kind) { let i = 0; const k = { three: 3, dunk: 5, skills: 7 }[kind] || 1; return () => hrand(L.season * 7 + k, (L.teams.length * 131 + (L.y0 || 0)) | 0, i++); }
function aswPool(L) { return L.teams.flatMap(t => rosterOf(L, t)).filter(p => p.injury <= 0 && !p.prospect); }
function aswScore(L, kind, p) {
  const s = p.stats && p.stats.rs, n = (hgauss(p.id, L.season * 7 + kind.length) || 0);
  if (kind === 'three') { const pct = s && s.tpa >= 25 ? s.tpm / s.tpa : null; return p.tp + (p.t3 || 50) * 0.2 + (pct != null ? (pct - 0.36) * 60 : 0) + (p.fame || 0) * 0.03 + n * 2.5; }
  if (kind === 'dunk') return 0.35 * p.vrt + 0.25 * p.fin + 0.2 * p.spd + 0.2 * p.agi - Math.max(0, p.age - 27) * 2.5 - (p.ovr >= 85 ? 6 : 0) + n * 4;
  return 0.3 * p.hnd + 0.25 * p.pas + 0.2 * p.spd + 0.15 * p.tp + 0.1 * p.agi + (p.fame || 0) * 0.02 + n * 2.5;
}
function aswPick(L, kind) {
  const pool = aswPool(L).sort((a, b) => aswScore(L, kind, b) - aswScore(L, kind, a));
  if (kind === 'skills') { const g = pool.filter(p => p.pos <= 2).slice(0, 4), big = pool.filter(p => p.pos >= 3).slice(0, 2); return [...g, ...big]; }
  return pool.slice(0, kind === 'three' ? 8 : 4);
}
// Three-Point Contest: 5 racks of 5, last ball of each rack is a money ball (2), plus one all-money rack of the shooter's choice. Max 34.
function aswThreeRound(p, rnd) {
  const base = clamp(0.2 + (p.tp - 50) * 0.0125 + (p.t3 - 50) * 0.001, 0.2, 0.74), moneyRack = Math.floor(rnd() * 5);
  let pts = 0; const racks = [];
  for (let r = 0; r < 5; r++) { let row = ''; let hot = 0; for (let b = 0; b < 5; b++) { const money = b === 4 || r === moneyRack, pr = clamp(base + hot * 0.03 - (money ? 0.02 : 0), 0.1, 0.85); const m = rnd() < pr; hot = m ? Math.min(hot + 1, 3) : 0; if (m) pts += money ? 2 : 1; row += m ? (money ? 'M' : 'x') : (money ? 'm' : 'o'); } racks.push(row); }
  return { pts, racks };
}
function aswThree(L) {
  const ent = aswPick(L, 'three'); if (ent.length < 3) return null; const rnd = aswRng(L, 'three');
  const r1 = ent.map(p => ({ pid: p.id, ...aswThreeRound(p, rnd) })).sort((a, b) => b.pts - a.pts || L.players[b.pid].tp - L.players[a.pid].tp);
  const fin = r1.slice(0, 3).map(x => ({ pid: x.pid, ...aswThreeRound(L.players[x.pid], rnd) })).sort((a, b) => b.pts - a.pts);
  let off = null; if (fin[0].pts === fin[1].pts) { const tied = fin.filter(x => x.pts === fin[0].pts); for (let k = 0; k < 6; k++) { off = tied.map(x => ({ pid: x.pid, ...aswThreeRound(L.players[x.pid], rnd) })).sort((a, b) => b.pts - a.pts); if (off[0].pts > off[1].pts) break; } if (off[0].pts === off[1].pts) off[0].pts++; }
  return { kind: 'three', r1, fin, off, win: (off || fin)[0].pid };
}
// Slam Dunk Contest: 4 dunkers, 2 dunks each in round 1, top 2 meet in the final (2 dunks). Five judges score 6-10 each (30-50). Up to 3 tries per dunk.
function aswDunkOne(p, rnd, need) {
  const sk = 0.35 * p.vrt + 0.25 * p.fin + 0.2 * p.spd + 0.2 * p.agi, maxD = clamp(Math.round(1 + (sk - 55) / 8 + (need ? 1 : 0)), 1, 5);
  const opts = ASW_DUNKS.filter(d => d[1] <= maxD && d[1] >= maxD - 1), d = opts[Math.floor(rnd() * opts.length)];
  let tries = 0, made = false; while (tries < 3 && !made) { tries++; made = rnd() < clamp(0.92 - d[1] * 0.09 + (sk - 65) * 0.012, 0.25, 0.97); }
  if (!made) return { dunk: d[0], tries, made: false, sc: 30 + Math.floor(rnd() * 4) };
  let sc = 0; for (let j = 0; j < 5; j++) sc += clamp(Math.round(5.6 + d[1] * 0.75 + (sk - 65) * 0.03 - (tries - 1) * 0.8 + (rnd() - 0.5) * 2.2), 6, 10);
  return { dunk: d[0], tries, made: true, sc };
}
function aswDunk(L) {
  const ent = aswPick(L, 'dunk'); if (ent.length < 2) return null; const rnd = aswRng(L, 'dunk');
  const r1 = ent.map(p => { const a = aswDunkOne(p, rnd, false), b = aswDunkOne(p, rnd, false); return { pid: p.id, d: [a, b], pts: a.sc + b.sc }; }).sort((a, b) => b.pts - a.pts);
  const fin = r1.slice(0, 2).map(x => { const p = L.players[x.pid], a = aswDunkOne(p, rnd, true), b = aswDunkOne(p, rnd, true); return { pid: p.id, d: [a, b], pts: a.sc + b.sc }; }).sort((a, b) => b.pts - a.pts);
  let off = null; for (let k = 0; k < 5 && (off || fin)[0].pts === (off || fin)[1].pts; k++) off = fin.map(x => { const a = aswDunkOne(L.players[x.pid], rnd, true); return { pid: x.pid, d: [a], pts: a.sc }; }).sort((a, b) => b.pts - a.pts);
  if (off && off[0].pts === off[1].pts) off[0].pts++;
  const w = (off || fin)[0], best = w.d.filter(x => x.made).sort((a, b) => b.sc - a.sc)[0] || w.d[0];
  return { kind: 'dunk', r1, fin, off, win: w.pid, best: best.dunk };
}
// Skills Challenge: 4 guards/wings + 2 bigs run the course (dribble, chest pass, layup, top-of-key three). Fastest 2 meet in the final.
function aswSkillsRun(p, rnd) {
  let t = 10.5 - (p.spd + p.hnd - 120) * 0.045 + (rnd() - 0.5) * 1.6; let misses = { pass: 0, lay: 0, three: 0 };
  for (let k = 0; k < 3; k++) { let pr = clamp(0.5 + (p.pas - 50) * 0.011, 0.35, 0.92); while (rnd() > pr && misses.pass < 8) { misses.pass++; t += 1.5; } t += 1.6; }
  while (rnd() > clamp(0.82 + (p.fin - 50) * 0.004, 0.75, 0.97) && misses.lay < 4) { misses.lay++; t += 2; } t += 2.6;
  while (rnd() > clamp(0.22 + (p.tp - 50) * 0.011, 0.12, 0.7) && misses.three < 10) { misses.three++; t += 2.3; } t += 3.2;
  return { time: Math.round(t * 10) / 10, misses };
}
function aswSkills(L) {
  const ent = aswPick(L, 'skills'); if (ent.length < 2) return null; const rnd = aswRng(L, 'skills');
  const r1 = ent.map(p => ({ pid: p.id, big: p.pos >= 3, ...aswSkillsRun(p, rnd) })).sort((a, b) => a.time - b.time);
  const fin = r1.slice(0, 2).map(x => ({ pid: x.pid, big: x.big, ...aswSkillsRun(L.players[x.pid], rnd) })).sort((a, b) => a.time - b.time);
  if (fin[0].time === fin[1].time) fin[0].time = Math.round((fin[0].time - 0.1) * 10) / 10;
  return { kind: 'skills', r1, fin, win: fin[0].pid };
}
function runContests(L) {
  const S = L.season, out = {};
  for (const [k, f] of [['three', aswThree], ['dunk', aswDunk], ['skills', aswSkills]]) {
    let c = null; try { c = f(L); } catch (e) { c = null; } if (!c) continue; out[k] = c;
    const w = L.players[c.win]; if (!w) continue; w.awards.push({ s: S, a: ASW_AW[k] });
    const team = w.team != null ? L.teams[w.team].name : 'free agent', last = (c.off || c.fin)[0];
    const v = { name: w.name, team, pts: (c.fin[0] || {}).pts, dunk: c.best, time: last.time != null ? last.time.toFixed(1) : '' };
    logNews(L, fl('asw.' + k, v, S * 7 + k.length), w.team, 'award');
    c.call = fl('asw.' + k + 'Call', {}, S * 13 + c.win);
  }
  return out;
}

// ---------- Daily hooks ----------
function beforeDay(L) { processPending(L); processOffers(L); }
function afterDay(L) {
  try { watchScan(L); } catch (e) { }
  const T = totalDays(L);
  if (L.day === Math.floor(T * 0.6)) computeModes(L, 'Pre-deadline');   // v24.1: a third review just before the deadline
  if (L.day === Math.floor(T * 0.4)) computeModes(L, 'Midseason');   // v21: two reviews a season (preseason and midseason, before the deadline)
  if (L.day === deadlineDay(L)) extensionDeadline(L);
  inSeasonCoachCheck(L);
  try { rivalryWeek(L); } catch (e) { }   // v24.4
  if (L.day === deadlineDay(L) + 3) aiBuyouts(L);
  if (L.day === twPoDay(L)) aiTwoWayPlayoff(L);   // v23
  if (L.day % wkLen(L) === 0) { for (const t of L.teams) setTeamRoles(L, t); updateMorale(L); checkPromises(L); }   // v32b: roles refresh weekly   // v26.1: role promises
  try { lr2Day(L); } catch (e) { }   // v28.8: interviews, one-on-ones, your promises
  try { pipeDay(L); } catch (e) { }   // v29 P8: injury call-ups from international clubs
  if (L.day === allStarDay(L) && !(L.allStar && L.allStar.s === L.season)) runAllStar(L);
  for (const t of L.teams) if (t.fin) { t.fin.paySum += cashPayroll(L, t, L.season); t.fin.payDays++; }
  runSalaryDumps(L);
  if (L.day % 7 === 0 || !L.pr || L.pr.s !== L.season) updatePowerRankings(L);
  if (L.day % 7 === 0) { try { updateWeekly(L); } catch (e) { } }   // v25.5
  if (L.day % wkLen(L) === 0) youthPlan(L);
  if (inTradeWindow(L) && L.day === deadlineDay(L) - 1) deadlineFrenzy(L);   // v18 deadline day
  if (inTradeWindow(L)) { dailyTrades(L); const shop = L.user != null && rosterOf(L, L.teams[L.user]).some(p => p.block); for (let i = 0; i < 2; i++) if (R() < (shop ? 0.45 : 0.3) * dayK(L)) aiOfferToUser(L); }
  if (L.day % wkLen(L) === 0) {
    for (const id of L.fa) { const p = L.players[id]; if (p.ask > MINSAL) p.ask = p.ask * 0.9 < 1.5 ? MINSAL : r1(p.ask * 0.9); }
    faRound(L, false, 58);
  }
  if (L.day % wkLen(L) === 3) for (const t of L.teams) aiConvertTwoWay(L, t, false);
  if (L.day === deadlineDay(L) + 1) { const dl = deadlineDay(L), list = (L.trades || []).filter(r => r.s === L.season && r.day != null && r.day >= dl - 14), day = list.filter(r => r.day >= dl - 1);
    const moved = day.flatMap(r => [...r.aIn.players, ...r.bIn.players, ...(r.cIn ? r.cIn.players : [])]).map(id => L.players[id]).filter(Boolean).sort((a, b) => b.ovr - a.ovr);
    const sell = new Set(), buy = new Set(); for (const r of day) for (const [tm, inn, out] of [[r.a, r.aIn, r.bIn], [r.b, r.bIn, r.aIn]]) { const vets = out.players.map(id => L.players[id]).filter(p => p && p.age >= 28 && p.ovr >= 65).length; const youth = inn.picks.length + inn.players.map(id => L.players[id]).filter(p => p && p.age <= 24).length; if (vets && youth) sell.add(tm); else if (inn.players.some(id => L.players[id] && L.players[id].ovr >= 68)) buy.add(tm); }
    L.deadlineRecap = { s: L.season, list, day, big: moved[0] ? moved[0].id : null, sellers: [...sell], buyers: [...buy].filter(x => !sell.has(x)), rumors: (L.ddRumors || []).slice() }; }
  if (L.day % 7 === 0 && L.day >= 7) leaguePulse(L);
  try { mediaDay(L); } catch (e) { }   // v26.5: rumors, beat reports, power-ranking blurbs, features, press expiry
  try { storyUpdate(L); } catch (e) { }
  rosterMaintenance(L);
}
// In-season extensions: allowed for players in the final year of a deal that was originally 3+ years, until the trade deadline (70% mark)
function canExtend(L, p) {
  const yth = p.contract && p.contract.type === 'rookie' && (agentOf(L, p) || {}).kind === 'youth';   // v25.1: youth specialists push for rookie extensions a year earlier
  return L.phase === 'regular' && L.day < deadlineDay(L) && p.contract && (p.contract.exp === L.season || (p.contract.type === 'rookie' && (p.contract.exp === L.season + 1 || (yth && p.contract.exp === L.season + 2 && p.ovr >= 66)))) && (p.contract.len || 0) >= 3 && !p.ext && p.team != null;
}
function extensionDeadline(L) {
  for (const t of L.teams) {
    if (t.id === L.user) continue;
    for (const p of rosterOf(L, t)) {
      if (p.career && L.career) continue;   // My Career: his extension is his own choice
      const rookieEarly = p.contract && p.contract.type === 'rookie' && p.contract.exp === L.season + 1 && (p.ovr >= 66 || p.scout >= 74);
      if (!(p.contract && (p.contract.exp === L.season || rookieEarly) && (p.contract.len || 0) >= 3 && !p.ext)) continue;
      const want = (t.mode === 'tank' && p.age >= 28) ? false : rotationOf(L, t).some(x => x.id === p.id) || (p.age <= 24 && p.scout >= 72);
      if (!want) continue;
      if (p.ask == null) setAsk(L, p);
      const race = awardRace(L, p);
      const ask = race ? maxFor(p) : Math.min(maxForTeam(L, p, t.id), r1(Math.max(p.ask * loyDisc(p), Math.min(p.ask * loyDisc(p) * (t.mode === 'contend' && p.ovr >= 78 ? 1.2 : 1), p.mval * 1.1), p.ovr >= RESIGN_K.valOvr ? (p.mval || 0) * RESIGN_K.val : 0)));   // v36a: 60+ extensions at market value too (S11 save: 60+ extensions $84M a team vs $96M value)
      if (race) p.bet = { s: L.season, race };
      const offer = Math.min(maxForTeam(L, p, t.id), (superOK(L, p) ? Math.max(p.mval, p.mvalRaw || 0) : p.mval) * Math.max(needMult(L, t, p), demPay(p)) * (p.age >= 30 ? Math.max(0.85, 1 - 0.03 * (p.age - 29)) : 1) * modeSpend(t, p) * wetPay(p) * (t.mode === 'contend' && p.ovr >= 70 ? 1.08 : 1));
      const hg = p.draftTid === t.id && ask >= 10;
      const x0 = p.contract.exp + 1, extFits = [x0, x0 + 1].every(y => payNoFloor(L, t, y) + contractHit(ask, hg) <= APRON + 1e-6);   // v33d: the extension's own first two seasons stay under the hard cap (an early rookie extension starts two seasons out)
      if (offer >= ask * 0.97 && extFits && payroll(L, t, L.season + 1) + contractHit(ask, hg) <= Math.min(APRON, Math.max(t.owner ? t.owner.limit + 5 : APRON, payroll(L, t, L.season + 1)))) {
        const yrs = yrsFor(p, ask);
        p.ext = { amt: ask, yrs, hg, opt: autoOption(p, yrs, ask) };
        p.tx.push({ s: L.season, t: `Signed an extension with ${t.abbr}: ${yrs} yr, ${money(ask)}/yr from next season` });
        if (ask >= 8) logNews(L, flL(L, 'news.extend', { team: t.abbr, name: p.name, yrs, amt: money(ask) }), t.id, 'tx', 'extend');
      }
      p.ask = null;
    }
  }
  L.extDeadlinePassed = L.season;
  if (L.user != null) L.extPrompt = true;
  logNews(L, 'The extension deadline has passed. Expiring contracts now go to free agency in the offseason.', null, 'league');
}
function bestFA(L, posNeed) {
  let ps = L.fa.map(id => L.players[id]).filter(p => p.injury <= 0 && !p.retired);
  if (posNeed != null) { const q = ps.filter(p => p.pos === posNeed || p.pos2 === posNeed); if (q.length) ps = q; }
  return ps.sort((a, b) => b.ovr - a.ovr)[0];
}
function topUpFA(L, n) {
  while (L.fa.length < n) { const p = newPlayer(L, pick(POS), gauss(-1.0, 0.6), rint(22, 31)); p.mval = MINSAL; L.fa.push(p.id); setAsk(L, p); }
}
// In-season: hardship signings when injuries pile up, minimum roster, release hardship players later
function rosterMaintenance(L) {
  topUpFA(L, 20);
  for (const t of L.teams) {
    const ps = rosterOf(L, t);
    const healthy = ps.filter(p => p.injury <= 0).length;
    if (healthy < 9) {
      const p = bestFA(L); if (p) { signContract(L, p, t.id, MINSAL, 1, 'hardship'); p.hardship = true; }
    } else if (t.roster.length > 15 && healthy >= 11) {
      const h = ps.find(p => p.hardship); if (h) { h.tx.push({ s: L.season, t: `Hardship stint with ${t.abbr} ended` }); toFA(L, h); h.hardship = false; }
    }
    if (t.id !== L.user) while (t.roster.length < 13 && aiConvertTwoWay(L, t, true)) { /* converted a two-way */ }
    if (t.id !== L.user) while (t.roster.length < 13) { const c = coverage(L, t); const p = bestFA(L, c.findIndex(x => x < 2) >= 0 ? c.findIndex(x => x < 2) : null); if (!p) break; signContract(L, p, t.id, MINSAL, 1, 'signing'); }
  }
}

// ---------- Awards ----------
function perGame(s, k) { return s && s.gp ? s[k] / s.gp : 0; }
function seasonLine(s) { return [s.min, s.pts, s.fgm, s.fga, s.tpm, s.tpa, s.ftm, s.fta, s.orb, s.drb, s.ast, s.stl, s.blk, s.tov, s.pf]; }
// Award races. The same scoring drives the live ladders on the Awards tab and the final vote.
const AWARD_KEYS = ['mvp', 'dpoy', 'roy', 'smoy', 'mip', 'clutch'];
const AWARD_NAMES = { mvp: 'MVP', dpoy: 'Defensive Player of the Year', roy: 'Rookie of the Year', smoy: 'Sixth Man of the Year', mip: 'Most Improved Player', clutch: 'Clutch Player of the Year', coy: 'Coach of the Year' };
function awardMinGp(L) { const maxGp = Math.max(0, ...L.teams.map(t => t.w + t.l)); return Math.max(1, Math.min(40, Math.ceil(maxGp * 0.69))); }
function awardQual(L) { const m = awardMinGp(L); return active(L).filter(p => p.stats.rs && p.stats.rs.gp >= m); }
// v33c (Kenneth, Nov 16): award scoring blends the game's own advanced stats with the old box-score / team-record / defensive scoring.
// Production for MVP and All-League = game score + WS + WS/48 + PER + BPM (z-scores in the qualified pool, put back on the game-score
// scale); DPOY / All-Defense = the defensive composite + DWS + DBPM (within position group); ROY / 6MOY = game score + PER + WS/48 (rates full from 26 mpg);
// MIP adds the change in PER and WS/48. AW_ADV.on = false gives the old scoring (comparison runs). Rates (PER, WS/48) are pulled toward the league average for low minutes (ADV_SHRINK minutes).
const AW_ADV = { on: true, mvp: { gs: 0.3, ws: 0.35, ws48: 0.1, per: 0.05, bpm: 0.2 }, fat1: 0.05, fat2: 0.1, fatOld: 0,   /* v36c: WS 35% (Kenneth), gs .30 / bpm .20, fatigue back down (tools/runs32/v36c-awgrid-*.txt); was v36 gs .25 bpm .25 fat .10 / .15 / .05 */ young: { gs: 0.6, perY: 0.2, ws48Y: 0.2 }, youngMpg: 26, mipPer: 0.25, mipWs48: 15, def: 0.5, dws: 0.35, dbpm: 0.15,
  mvpTeam: 0.5, royMpg: 20, mipNoMvp: 5 };   // v33d (Kenneth): MVP WS 40% / game score 30% (was 20 / 40), team record 0.5 (was 1.1; WS already carries winning). Picked on the same 10 seasons (tools/runs32/v33d-awgrid.txt): MVP = WS leader 8/9 (WS 35% + team 0.8: 5/9); ROY needs 20+ mpg; MIP skips the MVP top 5
// v33c values, for comparison runs (tools/t33c-awards.js OLD=v33c)
const AW_V33C = { mvp: { gs: 0.4, ws: 0.2, ws48: 0.15, per: 0.1, bpm: 0.15 }, mvpTeam: 1.1, royMpg: 0, mipNoMvp: 0 };   // def = share moved off the tracking composite
const ADV_SHRINK = 900, ADV_SHRINK_Y = 1800;   // ROY / 6MOY: rates count less for bench minutes (a 14-mpg sixth man won on PER with 900)
// v34 A2: MVPs in a row ending last season, and an MVP 2-3 seasons back
function mvpStreak(L, pid, S) { let k = 0; for (let s = S - 1; L.awards && L.awards[s] && L.awards[s].mvp === pid; s--) k++; return k; }
function mvpRecent(L, pid, S) { return [S - 2, S - 3].some(s => L.awards && L.awards[s] && L.awards[s].mvp === pid); }
function awardFns(L) {
  const S = L.season;
  try { computeAdv(L, 'rs'); } catch (e) { }
  const gs0 = p => gmsc(seasonLine(p.stats.rs)) / p.stats.rs.gp;
  const mpOf = p => (p.stats.rs.min || 0) / 60;
  const shr = (p, k, avg, K) => { const v = p.stats.rs[k]; if (v == null) return avg; const m = mpOf(p), w = m / (m + (K || ADV_SHRINK)); return w * v + (1 - w) * avg; };
  const zPool = active(L).filter(p => p.stats.rs && p.stats.rs.gp >= awardMinGp(L) && p.stats.rs.per != null);
  const stat = { gs: gs0, ws: p => p.stats.rs.ws || 0, ws48: p => shr(p, 'ws48', 0.1), per: p => shr(p, 'per', 15), bpm: p => p.stats.rs.bpm || 0, perY: p => shr(p, 'per', 15, ADV_SHRINK_Y), ws48Y: p => shr(p, 'ws48', 0.1, ADV_SHRINK_Y) };
  const ms = {}; for (const k in stat) { const xs = zPool.map(stat[k]), m = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length); ms[k] = [m, Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1)) || 1]; }
  const z = (p, k) => (stat[k](p) - ms[k][0]) / ms[k][1];
  // rateK: ROY / 6MOY count PER and WS/48 fully from AW_ADV.youngMpg minutes a game, not at all under 10 fewer (15- and 18-mpg winners in test runs)
  const blend = (W, rateK) => p => { if (!AW_ADV.on || zPool.length < 10 || p.stats.rs.per == null) return gs0(p); const rk = rateK ? clamp((mpOf(p) / p.stats.rs.gp - (rateK - 10)) / 10, 0, 1) : 1; let Z = 0; for (const k in W) Z += W[k] * z(p, k) * (k === 'gs' ? 1 : rk); return ms.gs[0] + ms.gs[1] * Z; };
  const gs = blend(AW_ADV.mvp), gsY = blend(AW_ADV.young, AW_ADV.youngMpg);
  const tw = p => { const t = L.teams[p.team]; return t && t.w + t.l ? t.w / (t.w + t.l) : 0.4; };
  const avgPA = L.teams.reduce((a, t) => a + t.pa / Math.max(1, t.w + t.l), 0) / L.teams.length;
  // conference seed: top 3 are playoff teams, 4-5 play-in, 6+ out
  // league-wide rank by record: the top 6 teams get (nearly) full credit, 7-10 a markdown, the rest a bigger one
  const lr = {}; seedOrder(L).forEach((id, i) => lr[id] = i + 1);
  const lrD = poDirect(L) * 2, lrP = poPlayinTo(L) * 2, seedF = p => { const r = lr[p.team]; return r == null ? 0.78 : r <= lrD ? 1.03 - (r - 1) * 0.06 / lrD : r <= lrP ? 0.9 : 0.78; };
  const defRaw = p => { const s = p.stats.rs, t = L.teams[p.team]; return 1.6 * perGame(s, 'stl') + 1.4 * perGame(s, 'blk') + 0.75 * perGame(s, 'drb') + (p.per + p.pdf) * 0.02 + (t ? (avgPA - t.pa / Math.max(1, t.w + t.l)) * 0.08 : 0) + perGame(s, 'min') / 60 * 0.05; };
  const defOld = p => defRaw(p) * (1 + 0.6 * (tw(p) - 0.5)) * (0.85 + 0.15 * seedF(p));
  // v15 DPOY score: matchup defense (makes prevented vs expected), on-court defensive rating, rim protection (bigs) or contests (perimeter),
  // steals+blocks, team defense. Each part is compared within position group (guards / forwards / centers) so bigs don't win on blocks alone.
  const dgrp = p => p.pos <= 1 ? 'G' : p.pos <= 3 ? 'F' : 'C';
  const dOK = p => p.stats.dz && p.stats.dz[4] >= 150 && p.stats.rs && p.stats.rs.gp && p.stats.rs.min / p.stats.rs.gp >= 24 * 60;
  const dComp = p => { const s = p.stats.rs, d = p.stats.dz, gp = s.gp, t = L.teams[p.team];
    const m36 = Math.max(1, s.min / 2160);   // per 36 minutes, so playing time alone doesn't win it
    const shrink = d[0] / (d[0] + 400);    // one season of matchups is noisy, so small samples count less
    const dr = p.pos >= 3 ? 0.5 * p.pdf + 0.3 * p.blk + 0.2 * p.drb : 0.6 * p.per + 0.2 * p.stl + 0.2 * p.iq;
    return [d[0] ? (d[2] - d[1]) / d[0] * 100 * shrink : 0, -(d[3] / Math.max(1, d[4]) * 100), p.pos >= 3 ? -(d[5] ? d[6] / d[5] : 0.6) : d[0] / m36, (1.6 * s.stl + 1.4 * s.blk) / m36, dr, t ? avgPA - t.pa / Math.max(1, t.w + t.l) : 0, s.dws || 0, s.dbpm || 0]; };
  // matchup, defensive rating, rim/contests, stocks, defensive ratings, team defense (x 0.5), then v33c DWS 0.35 + DBPM 0.15 (DWS 0.2 left the DPOY top-5 in DWS 2 times in 10)
  const DW = AW_ADV.on ? [0.25, 0.20, 0.10, 0.15, 0.20, 0.10].map(x => x * (1 - AW_ADV.def)).concat([AW_ADV.dws, AW_ADV.dbpm]) : [0.25, 0.20, 0.10, 0.15, 0.20, 0.10, 0, 0];
  const dPool = active(L).filter(p => p.team != null && dOK(p)), dNorm = {};
  const msd = xs => { const m = xs.reduce((a, b) => a + b, 0) / Math.max(1, xs.length); return [m, Math.sqrt(xs.reduce((a, b) => a + (b - m) ** 2, 0) / Math.max(1, xs.length - 1)) || 1]; };
  const allC = dPool.map(dComp);
  for (const g of ['G', 'F', 'C']) { const v = dPool.filter(p => dgrp(p) === g).map(dComp); dNorm[g] = DW.map((_, i) => msd((i >= 6 ? allC : v).map(r => r[i]))); }   // v33c: DWS / DBPM compared league-wide (bigs lead them, as in the NBA); the tracking parts within position group
  // defensive specialists get the nod over stars who also defend: a defensive archetype adds a little, a heavy scoring load takes a little away
  const DEF_ARCH = ['Defensive pest', 'Lockdown defender', '3-and-D', '3-and-D wing', 'Wing stopper', 'Small-ball 4', 'Mobile big', 'Rim protector'];
  const dTilt = p => { const a = (p.arch || []).findIndex(x => DEF_ARCH.includes(x.n)); const s = p.stats.rs; const ppg = s.gp ? s.pts / s.gp : 0; return (a === 0 ? 0.3 : a > 0 ? 0.15 : 0) - Math.max(0, ppg - 18) * 0.03; };
  const defS = p => { if (!dPool.length) return defOld(p); if (!dOK(p)) return -9; const c = dComp(p), n = dNorm[dgrp(p)]; return 2 + dTilt(p) + c.reduce((a, x, i) => a + DW[i] * (x - n[i][0]) / n[i][1], 0); };
  defS.parts = p => { if (!dOK(p)) return null; const d = p.stats.dz, s = p.stats.rs; return { dfg: d[0] ? d[1] / d[0] : null, dxp: d[0] ? d[2] / d[0] : null, saved: (d[2] - d[1]) / s.gp, con: d[0] / s.gp, drtg: d[3] / Math.max(1, d[4]) * 100, rim: d[5] ? d[6] / d[5] : null }; };
  // postseason teams (top 5 per conference: the top 3 plus the play-in) at the time of the vote
  const post = new Set(); for (const c of [...new Set(L.teams.map(t => t.conf))]) seedOrder(L, c).slice(0, poPlayinTo(L)).forEach(id => post.add(id));
  const prevH = p => p.hist.find(x => x.s === S - 1);
  const mvpS = p => gs(p) * (1 + (AW_ADV.on ? AW_ADV.mvpTeam : 1.1) * (tw(p) - 0.5)) * seedF(p);
  // v34 A2: voter fatigue on recent MVPs (last season's winner, stronger after 2+ in a row; a win 2-3 seasons back a little)
  const fatF = p => { if (!AW_ADV.on) return 1; const k = mvpStreak(L, p.id, S); return k >= 2 ? 1 - AW_ADV.fat2 : k === 1 ? 1 - AW_ADV.fat1 : mvpRecent(L, p.id, S) ? 1 - AW_ADV.fatOld : 1; };
  const mvpV = p => mvpS(p) * fatF(p);
  const mvpTop = q => { if (!AW_ADV.on || !AW_ADV.mipNoMvp) return new Set(); return new Set(q.map(p => [p.id, mvpS(p)]).sort((a, b) => b[1] - a[1]).slice(0, AW_ADV.mipNoMvp).map(x => x[0])); };
  return {
    gs, gs0, gsY, defS,
    // MVP: production, strongly weighted toward winning; a play-in team's MVP is rare and a non-playoff team's rarer still
    mvp: { pool: q => q, score: mvpV },
    dpoy: { pool: q => { if (!dPool.length) return q; const [d1, d2] = allDefTeams(q, defS); const e1 = d1.filter(p => post.has(p.team)); return e1.length ? e1 : d2.filter(p => post.has(p.team)).length ? d2.filter(p => post.has(p.team)) : q.filter(p => post.has(p.team) && dOK(p)); }, score: defS },
    roy: { pool: q => { const r = q.filter(p => p.rookieSeason === S), m = AW_ADV.on ? AW_ADV.royMpg : 0, ok = r.filter(p => !m || p.stats.rs.min / p.stats.rs.gp / 60 >= m); return ok.length ? ok : r; }, score: gsY },   // v33d: 20+ mpg (if no rookie has that, the usual pool)
    smoy: { pool: q => q.filter(p => p.stats.rs.gs / p.stats.rs.gp < 0.3), score: gsY },
    // MIP: game score change + rating change, plus (v33c) the change in PER and WS/48 when last season has them
    mip: { pool: q => { const top = mvpTop(q); return q.filter(p => { const h = prevH(p); return p.ovr >= 60 && !top.has(p.id) && h && h.rs && h.rs.gp >= gpq(30); }); }, /* v33d: not an MVP-level player (MVP top 5) */ score: p => { const h = prevH(p), hm = (h.rs.min || 0) / 60, hw = hm / (hm + ADV_SHRINK);
      const adv = AW_ADV.on && h.rs.per != null && p.stats.rs.per != null ? AW_ADV.mipPer * (shr(p, 'per', 15) - (hw * h.rs.per + (1 - hw) * 15)) + AW_ADV.mipWs48 * (shr(p, 'ws48', 0.1) - (hw * (h.rs.ws48 || 0) + (1 - hw) * 0.1)) : 0;
      return gs0(p) - gmsc(seasonLine(h.rs)) / h.rs.gp + (p.ovr - h.ovr) * 0.3 + adv; } },
    // v22 Clutch Player of the Year: final 2 minutes of the 4th/OT within 6 points; 10+ clutch games. Clutch scoring, efficiency, plus/minus, go-ahead buckets, team record
    clutch: { pool: q => q.filter(p => p.stats.cl && p.stats.cl[0] >= 10 && p.stats.rs.min / p.stats.rs.gp / 60 >= 20), score: p => { const c = p.stats.cl, g = c[0]; return c[1] / g * 1.2 + (c[2] >= 5 ? (c[3] / c[2] - 0.45) * 12 * Math.min(1, c[2] / 25) : 0) + c[4] / g * 0.6 + c[5] * 0.8 + tw(p) * 3; } }
  };
}
// All-Defense / All-League style teams: 2 guards, 2 forwards, 1 center by score
function allDefTeams(q, f) {
  const grp = p => p.pos <= 1 ? 'G' : p.pos <= 3 ? 'F' : 'C';
  const sorted = q.slice().sort((a, b) => f(b) - f(a)), used = new Set();
  const mk = () => { const need = { G: 2, F: 2, C: 1 }, out = []; for (const p of sorted) { if (used.has(p.id)) continue; const g = grp(p); if (need[g] > 0) { need[g]--; out.push(p); used.add(p.id); } } return out; };
  return [mk(), mk()];
}
// A frozen copy of a player's season line, so finalists can still be shown after stats are archived
function snapPlayer(L, p, score) {
  const s = p.stats.rs, t = p.team != null ? L.teams[p.team] : null, h = p.hist.find(x => x.s === L.season - 1), g = k => s[k] / s.gp;
  return { pid: p.id, name: p.name, tid: p.team, w: t ? t.w : null, l: t ? t.l : null, sc: r1(score), gp: s.gp, gs: s.gs, min: r1(g('min') / 60), pts: r1(g('pts')), reb: r1(g('orb') + g('drb')), ast: r1(g('ast')), stl: r1(g('stl')), blk: r1(g('blk')), tov: r1(g('tov')),
    fg: s.fga ? s.fgm / s.fga : null, tp: s.tpa ? s.tpm / s.tpa : null, ft: s.fta ? s.ftm / s.fta : null, per: s.per, ws: s.ws, ws48: s.ws48, dws: s.dws, bpm: s.bpm, dbpm: s.dbpm, prevPer: h && h.rs ? h.rs.per : undefined, prevWs48: h && h.rs ? h.rs.ws48 : undefined, ovr: p.ovr, prevOvr: h ? h.ovr : null, prevPts: h && h.rs && h.rs.gp ? r1(h.rs.pts / h.rs.gp) : null, cl: p.stats.cl ? p.stats.cl.slice() : undefined };
}
function coyLadder(L, n) {
  return L.teams.filter(t => t.w + t.l > 0).map(t => {
    const g = t.w + t.l, wp = t.w / g, ex = t.expW != null ? t.expW : 0.5;
    return { cid: t.coach.id, name: t.coach.name, tid: t.id, w: t.w, l: t.l, expW: Math.round(ex * g), sc: r1((wp - ex) * 100 + (wp - 0.5) * 30) };
  }).sort((a, b) => b.sc - a.sc).slice(0, n || 10);
}
function awardLadder(L, key, n) {
  if (key === 'coy') return coyLadder(L, n);
  const F = awardFns(L);
  return F[key].pool(awardQual(L)).map(p => [p, F[key].score(p)]).sort((a, b) => b[1] - a[1]).slice(0, n || 10).map(([p, sc]) => snapPlayer(L, p, sc));
}
// Weekly league pulse: power-ranking movers, hot and cold, injuries. One news item.
function leaguePulse(L) {
  const parts = [];
  if (L.pr && L.pr.prev && L.pr.now) { const mv = L.pr.now.map((tid, i) => ({ tid, d: (L.pr.prev.indexOf(tid) + 1) - (i + 1) })); const up = mv.slice().sort((a, b) => b.d - a.d)[0], dn = mv.slice().sort((a, b) => a.d - b.d)[0]; if (up && up.d >= 2) parts.push(`${L.teams[up.tid].abbr} up ${up.d} in the power rankings`); if (dn && dn.d <= -2) parts.push(`${L.teams[dn.tid].abbr} down ${-dn.d}`); }
  const hot = L.teams.filter(t => t.streak >= 4).sort((a, b) => b.streak - a.streak)[0], cold = L.teams.filter(t => t.streak <= -4).sort((a, b) => a.streak - b.streak)[0];
  if (hot) parts.push(`${hot.abbr} have won ${hot.streak} straight`); if (cold) parts.push(`${cold.abbr} have lost ${-cold.streak} straight`);
  const recent = L.games.slice(-L.teams.length * 3); const best = {}; for (const g of recent) for (const r of g.box) best[r[0]] = (best[r[0]] || 0) + r[2 + IX.pts];
  const star = Object.entries(best).sort((a, b) => b[1] - a[1])[0]; if (star && L.players[star[0]]) parts.push(`${L.players[star[0]].name} is the hottest scorer`);
  const inj = active(L).filter(p => p.team != null && p.injLong && p.injury >= 10 && p.ovr >= 70).slice(0, 2); if (inj.length) parts.push(`out long: ${inj.map(p => p.name).join(', ')}`);
  if (parts.length) logNews(L, `League pulse (week ${Math.floor(L.day / 7)}): ${parts.join('; ')}`, null, 'league');
}
// Award voting: 100 voters rank 5 players (10-7-5-3-1 points). Each voter sees the race a little differently.
function mockVotes(lad) {
  if (!lad || !lad.length) return [];
  const top = Math.max(1e-6, Math.abs(lad[0].sc)), spread = top * 0.1, pts = {}, first = {};
  for (let v = 0; v < 100; v++) {
    const ranked = lad.map(x => ({ id: x.pid, s: x.sc + gauss(0, spread) })).sort((a, b) => b.s - a.s).slice(0, 5);
    ranked.forEach((x, i) => { pts[x.id] = (pts[x.id] || 0) + [10, 7, 5, 3, 1][i]; if (i === 0) first[x.id] = (first[x.id] || 0) + 1; });
  }
  const sc = {}; for (const x of lad) sc[x.pid] = x.sc;
  // v21: ties break on first-place votes, then the award score
  return Object.keys(pts).map(id => ({ pid: +id, pts: pts[id], first: first[id] || 0, share: Math.round(pts[id] / 10) })).sort((a, b) => b.pts - a.pts || b.first - a.first || (sc[b.pid] || 0) - (sc[a.pid] || 0)).slice(0, 6);
}
function computeAwards(L) {
  const S = L.season;
  const q = awardQual(L), F = awardFns(L);
  const grp = p => p.pos <= 1 ? 'G' : p.pos <= 3 ? 'F' : 'C';
  const teams = (f) => {
    const sorted = q.slice().sort((a, b) => f(b) - f(a)); const used = new Set(); const mk = () => { const need = { G: 2, F: 2, C: 1 }, out = []; for (const p of sorted) { if (used.has(p.id)) continue; const g = grp(p); if (need[g] > 0) { need[g]--; out.push(p.id); used.add(p.id); } if (out.length === 5) break; } return out; };
    return [mk(), mk(), mk()];
  };
  const best = (arr, f) => arr.slice().sort((a, b) => f(b) - f(a))[0];
  const A = { season: S, ladder: {} };
  for (const k of AWARD_KEYS) { A.ladder[k] = awardLadder(L, k, 10); A[k] = A.ladder[k].length ? A.ladder[k][0].pid : null; }
  A.votes = {}; A.tie = {};
  for (const k of AWARD_KEYS) {
    const v = A.votes[k] = mockVotes(A.ladder[k]);
    if (!v.length) continue;
    // v21: the vote decides the winner; the ladder is reordered to match the vote at the top
    const ord = v.map(x => x.pid), lad = A.ladder[k];
    A.ladder[k] = [...ord.map(id => lad.find(x => x.pid === id)).filter(Boolean), ...lad.filter(x => !ord.includes(x.pid))];
    A[k] = A.ladder[k][0].pid;
    if (v[1] && v[0].pts === v[1].pts) A.tie[k] = { a: v[0].pid, b: v[1].pid, pts: v[0].pts, by: v[0].first !== v[1].first ? 'first' : 'score', fa: v[0].first, fb: v[1].first };
  }
  A.ladder.coy = coyLadder(L, 10);
  A.coy = A.ladder.coy.length ? A.ladder.coy[0].cid : null; A.coyTid = A.ladder.coy.length ? A.ladder.coy[0].tid : null;
  { const t3 = teams(F.mvp.score); A.all1 = t3[0]; A.all2 = t3[1]; if (isBig(L)) A.all3 = t3[2]; } [A.def1, A.def2] = teams(F.defS);   // v22: All-League 3rd team in 30-team leagues
  { const g40 = Math.ceil(Math.max(0, ...L.teams.map(t => t.w + t.l)) * 0.4), rq = active(L).filter(p => p.rookieSeason === S && p.stats.rs && p.stats.rs.gp >= g40), sorted = rq.slice().sort((a, b) => F.gsY(b) - F.gsY(a)), used = new Set(), grp = p => p.pos <= 1 ? 'G' : p.pos <= 3 ? 'F' : 'C'; const mk = () => { const out = []; for (const p of sorted) { if (out.length >= 5) break; if (!used.has(p.id)) { out.push(p.id); used.add(p.id); } } return out; };   /* v22: no position rule */ A.roo1 = mk(); A.roo2 = mk(); }   // v18 All-Rookie teams (fill from any spot if a position is thin)
  A.dparts = {}; for (const id of [...A.def1, ...A.def2]) { const pp = F.defS.parts ? F.defS.parts(L.players[id]) : null; if (pp) A.dparts[id] = pp; }
  A.titles = {};
  for (const [k, f] of [['pts', p => perGame(p.stats.rs, 'pts')], ['reb', p => perGame(p.stats.rs, 'orb') + perGame(p.stats.rs, 'drb')], ['ast', p => perGame(p.stats.rs, 'ast')], ['stl', p => perGame(p.stats.rs, 'stl')], ['blk', p => perGame(p.stats.rs, 'blk')]]) {
    const ord = q.slice().sort((a, b) => f(b) - f(a)), w = ord[0]; if (w) A.titles[k] = { pid: w.id, v: r1(f(w)), ru: ord.slice(1, 3).map(x => ({ pid: x.id, v: r1(f(x)) })) };   // v20: two runners-up
  }
  // team records at the time of the vote, for the All-League and All-Defense lists
  A.recs = {}; for (const t of L.teams) A.recs[t.id] = [t.w, t.l];
  A.snaps = {}; for (const id of [...A.all1, ...A.all2, ...(A.all3 || []), ...A.def1, ...A.def2, ...(A.roo1 || []), ...(A.roo2 || [])]) A.snaps[id] = snapPlayer(L, L.players[id], 0);
  L.awards[S] = A;
  const give = (pid, label) => { const p = L.players[pid]; if (p) { p.awards.push({ s: S, a: label }); } };
  for (const k of AWARD_KEYS) if (A[k] != null) { give(A[k], AWARD_NAMES[k]); logNews(L, flL(L, 'award.vote', { award: AWARD_NAMES[k], name: L.players[A[k]].name }), L.players[A[k]].team, 'award'); try { if (['mvp', 'dpoy', 'roy', 'smoy', 'mip'].includes(k) || /Valuable|Defensive|Rookie|Sixth|Improved/.test(AWARD_NAMES[k])) feedAward(L, A[k], AWARD_NAMES[k]); } catch (e) { } }
  if (A.coy != null) { const c = findCoach(L, A.coy); if (c) { c.coy = (c.coy || 0) + 1; (c.honors = c.honors || []).push({ s: S, a: 'Coach of the Year', tid: A.coyTid }); logNews(L, `Coach of the Year: ${c.name} (${L.teams[A.coyTid].abbr})`, A.coyTid, 'award'); } }
  A.all1.forEach(id => give(id, 'All-League 1st Team')); A.all2.forEach(id => give(id, 'All-League 2nd Team')); (A.all3 || []).forEach(id => give(id, 'All-League 3rd Team'));
  A.def1.forEach(id => give(id, 'All-Defense 1st Team')); A.def2.forEach(id => give(id, 'All-Defense 2nd Team'));
  (A.roo1 || []).forEach(id => give(id, 'All-Rookie 1st Team')); (A.roo2 || []).forEach(id => give(id, 'All-Rookie 2nd Team'));
  try { awardRivals(L, A); } catch (e) { }
  try { execOfYear(L, A); } catch (e) { }
  const tn = { pts: 'Scoring title', reb: 'Rebounding title', ast: 'Assists title', stl: 'Steals title', blk: 'Blocks title' };
  for (const k in A.titles) give(A.titles[k].pid, tn[k]);
}
// v22: Conference Finals MVPs (North and South): the best series by game score on the conference champion
function confFinalsMVP(L, A) {
  const i = poStages(L).indexOf('Conference finals'), rd = L.po && L.po.rounds[i]; if (!rd) return;
  A.cfmvp = {};
  for (const sr of rd) {
    if (sr.winner == null) continue;
    const tally = {}; for (const gid of sr.games) { const g = L.games[gid - 1]; if (!g) continue; for (const row of g.box) { const tid = row[1] === 0 ? g.home : g.away; if (tid !== sr.winner) continue; tally[row[0]] = (tally[row[0]] || 0) + gmsc(row.slice(2, 17)); } }
    const pid = +Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0]; if (!L.players[pid]) continue;
    A.cfmvp[sr.conf] = pid; L.players[pid].awards.push({ s: L.season, a: 'Conference Finals MVP' });
    logNews(L, flL(L, 'award.cfmvp', { conf: confName(sr.conf, L), name: L.players[pid].name }), sr.winner, 'award');
  }
}
// v22 Executive of the Year: team improvement, beating its preseason expectation, and what this season's newcomers produced. Play-in or better.
function execOfYear(L, A) {
  const S = L.season, prev = (L.history.find(h => h.s === S - 1) || {}).standings || [], seeds = {};
  for (const c of CONFS) seedOrder(L, c).forEach((id, i) => seeds[id] = i + 1);
  const rows = [];
  for (const t of L.teams) {
    if (!(seeds[t.id] <= poPlayinTo(L))) continue;
    const g = t.w + t.l, last = prev.find(x => x.tid === t.id), impr = last ? t.w - last.w * g / Math.max(1, last.w + last.l) : null, beat = t.w - (t.expW || 0.5) * g;
    let nv = 0; for (const id of t.roster) { const p = L.players[id], h = p.hist.find(x => x.s === S - 1); if (!p.stats.rs || !p.stats.rs.gp || p.rookieSeason === S || (h && h.tid === t.id)) continue; nv += Math.max(0, gmsc(seasonLine(p.stats.rs)) / p.stats.rs.gp - 8) * p.stats.rs.gp / SEASON_GAMES; }
    const gm = t.id === L.user ? L.me : t.gm; if (!gm) continue;
    rows.push({ tid: t.id, name: gm.name || 'You', score: r1((impr || 0) * 0.5 + beat * 0.8 + nv * 1.5), impr: impr == null ? null : r1(impr), beat: r1(beat), nv: r1(nv) });
  }
  rows.sort((a, b) => b.score - a.score); A.eoyLadder = rows.slice(0, 5);
  if (!rows.length) return;
  A.eoy = rows[0]; const t = L.teams[rows[0].tid], gm = t.id === L.user ? L.me : t.gm;
  if (gm) (gm.awards = gm.awards || []).push({ s: S, a: 'Executive of the Year' });
  logNews(L, `Executive of the Year: ${rows[0].name} (${t.city} ${t.name})`, t.id, 'award');
}
function finalsMVP(L, sr) {
  const S = L.season, champ = sr.winner, tally = {};
  for (const gid of sr.games) { const g = L.games[gid - 1]; for (const row of g.box) { const tid = row[1] === 0 ? g.home : g.away; if (tid !== champ) continue; tally[row[0]] = (tally[row[0]] || 0) + gmsc(row.slice(2, 17)); } }
  const pid = +Object.keys(tally).sort((a, b) => tally[b] - tally[a])[0];
  const A = L.awards[S] = L.awards[S] || { season: S };
  A.fmvp = pid; A.champion = champ; A.runnerUp = sr.winner === sr.hi ? sr.lo : sr.hi;
  // the Finals MVP's line for the series
  const tot = { gp: 0, min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, fgm: 0, fga: 0, tpm: 0, tpa: 0, ftm: 0, fta: 0 };
  for (const gid of sr.games) { const g = L.games[gid - 1]; const r = g && g.box.find(x => x[0] === pid); if (!r) continue; const v = r.slice(2); tot.gp++; tot.min += v[0]; tot.pts += v[1]; tot.fgm += v[2]; tot.fga += v[3]; tot.tpm += v[4]; tot.tpa += v[5]; tot.ftm += v[6]; tot.fta += v[7]; tot.reb += v[8] + v[9]; tot.ast += v[10]; tot.stl += v[11]; tot.blk += v[12]; }
  A.fmvpLine = tot; A.finalsScore = [Math.max(sr.hw, sr.lw), Math.min(sr.hw, sr.lw)];
  if (L.players[pid]) { L.players[pid].awards.push({ s: S, a: 'Finals MVP' }); logNews(L, flL(L, 'award.fmvp', { name: L.players[pid].name }), champ, 'award'); }
  try { confFinalsMVP(L, A); } catch (e) { }
  const co = L.teams[champ].coach; co.titles++;
  updateRivalry(L, sr.hi, sr.lo, 4);
  for (const id of L.teams[champ].roster) L.players[id].awards.push({ s: S, a: 'Champion' });
  for (const id of L.teams[A.runnerUp].roster) L.players[id].finalsLoss = S;
  updateFame(L);
}

// ---------- Offseason ----------
const OFF_PHASES = ['off-review', 'off-lottery', 'off-draft', 'off-resign', 'off-fa', 'off-ready'];
// v24.5.1: playoff series a team won this season, not counting the play-in
function poRoundsWon(L, tid) { if (!L.po) return 0; let n = 0; L.po.rounds.forEach((r, i) => { if (isPlayin(L, i)) return; for (const sr of r) if (sr.winner === tid && (sr.hi === tid || sr.lo === tid)) n++; }); return n; }
function poResult(L, tid) {
  if (!L.po) return '—';
  let best = -1, won = false;
  L.po.rounds.forEach((r, i) => r.forEach(sr => { if (sr.hi === tid || sr.lo === tid) { best = i; won = sr.winner === tid; } }));
  return poLabel(best < 0 ? null : poStages(L)[best], won);
}
function archiveSeason(L) {
  const S = L.season, A = L.awards[S] || {};
  computeBPM(L, 'rs', true); computeBPM(L, 'po', true); computeAdv(L, 'rs', true); computeAdv(L, 'po', true);      // freeze box plus-minus (v33c: + PER / USG% / WS / VORP) into the season's stats
  for (const t of L.teams) { const c = t.coach, cf = t.coachFrom || { w: 0, l: 0 }; c.seasons = c.seasons || []; c.seasons.push({ s: S, tid: t.id, w: t.w - cf.w, l: t.l - cf.l, po: poResult(L, t.id), mode: t.mode, exp: t.expW, mid: cf.w + cf.l > 0 }); }
  const seeds = seedOrder(L);
  const confSeed = {}; for (const c of CONFS) seedOrder(L, c).forEach((id, i) => confSeed[id] = i + 1);
  const lead = (f, min) => active(L).concat(Object.values(L.players).filter(p => p.retired === S)).filter(p => p.stats.rs && p.stats.rs.gp >= min).sort((a, b) => f(b) - f(a)).slice(0, 5).map(p => ({ pid: p.id, name: p.name, tid: p.team, v: r1(f(p)) }));
  const maxGp = Math.max(...L.teams.map(t => t.w + t.l)) * 0.5;
  for (const t of L.teams) if (t.zr) (t.zHist = t.zHist || {})[S] = { z: t.zr.slice(), opp: (t.zrOpp || []).slice() };
  // v22: division champions (best record in the division; ties go to point differential)
  const divs = {}; if (isBig(L)) for (const d of Object.keys(DIVISIONS)) { const ts = L.teams.filter(t => t.div === d).sort((a, b) => (b.w - b.l) - (a.w - a.l) || (b.pf - b.pa) - (a.pf - a.pa)); if (ts[0]) { divs[d] = ts[0].id; (ts[0].divTitles = ts[0].divTitles || []).push(S); logNews(L, `${ts[0].city} ${ts[0].name} win the ${d} Division (${ts[0].w}-${ts[0].l})`, ts[0].id, 'league'); } }
  L.history.push({
    s: S, champion: A.champion, runnerUp: A.runnerUp, divs: isBig(L) ? divs : undefined,
    standings: seeds.map((id, i) => { const t = L.teams[id]; return { tid: id, seed: i + 1, conf: t.conf, confSeed: confSeed[id], w: t.w, l: t.l, cw: t.cw, cl: t.cl, pf: t.pf, pa: t.pa, mode: t.mode, status: t.status, shown: t.stShow || undefined, hw: t.hw, hl: t.hl, aw: t.aw, al: t.al, coach: t.coach.name, cid: t.coach.id, po: poResult(L, id), trs: t.trs || null, tpo: t.tpo || null }; }),
    playoffs: L.po ? L.po.rounds.map((r, i) => ({ stage: poStages(L)[i], series: r.map(sr => ({ hi: sr.hi, lo: sr.lo, hiSeed: sr.hiSeed, loSeed: sr.loSeed, hw: sr.hw, lw: sr.lw, winner: sr.winner, conf: sr.conf, best: sr.best })) })) : [],
    awards: A,
    feats: Object.assign({}, (L.featsBy || {})[S] || {}),
    leaders: {
      pts: lead(p => perGame(p.stats.rs, 'pts'), maxGp), reb: lead(p => perGame(p.stats.rs, 'orb') + perGame(p.stats.rs, 'drb'), maxGp), ast: lead(p => perGame(p.stats.rs, 'ast'), maxGp),
      stl: lead(p => perGame(p.stats.rs, 'stl'), maxGp), blk: lead(p => perGame(p.stats.rs, 'blk'), maxGp)
    },
    trades: L.trades.filter(t => t.s === S).length
  });
  for (const p of Object.values(L.players)) {
    if (!p.stats.rs && !p.stats.po && !(p.dl && p.dl.s === S)) continue;
    const strip = s => { if (!s) return null; const o = { ...s }; delete o.teams; return o; };
    const teams = [...new Set([...(p.stats.rs?.teams || []), ...(p.stats.po?.teams || [])])];
    p.hist.push({ s: S, tid: p.team != null ? p.team : p.tw ? p.tw.tid : null, tw: p.tw ? 1 : undefined, dl: p.dl && p.dl.s === S ? { gp: p.dl.gp, min: p.dl.min, pts: p.dl.pts, reb: p.dl.reb, ast: p.dl.ast, stl: p.dl.stl, blk: p.dl.blk, tpm: p.dl.tpm, tid: p.dl.tid } : undefined, teams, age: p.age, ovr: p.ovr, pos: posLabel(p), arch: archLabel(p), sal: p.contract ? p.contract.amt : null, rs: strip(p.stats.rs), po: strip(p.stats.po), z: p.stats.zr ? p.stats.zr.slice() : undefined, d: p.stats.dz ? p.stats.dz.map(x => Math.round(x * 10) / 10) : undefined, rsT: p.stats.rsT && Object.keys(p.stats.rsT).length > 1 ? p.stats.rsT : null, poT: p.stats.poT && Object.keys(p.stats.poT).length > 1 ? p.stats.poT : null });
    p.stats = {};
  }
}
// v33a: league mean gravity (both modes). Generated draft classes grew into a stronger middle than the starting league: rostered mean
// 58 -> 64 (NBA) and 58 -> 65.6 (PBL16) over 20 seasons, which pushed blocks, rebounds, win-first and "team didn't want him" up with it.
// Each summer, if the rostered mean is above the base (+ band), young players' ceilings are trimmed and 22-30-year-olds in the 52-74 range
// are nudged down a little. Stars (75+) are left to nbaBalance. Base 58 = where both new leagues start.
const LG_GRAV = { base: 58, band: 0.4, maxD: 1.5, trimK: 2, nudgeK: 0.8 };   // v33d: the stronger pull again, now that asks follow the league (v33b)
// v33a:   // tried 1.5 / 2 / 0.8 (tools/runs32/v33a2-*.txt): NBA mean flat at 58-60 but payroll fell 182 -> 113 (asks are tied to absolute OVR); kept the milder pull (v33a-*.txt)
function leagueGravity(L, delta) {
  const ps = []; for (const t of L.teams) for (const id of t.roster) { const p = L.players[id]; if (p && !p.retired) ps.push(p); }
  if (!ps.length) return null;
  const mean = ps.reduce((a, p) => a + p.ovr, 0) / ps.length, G = LG_GRAV, ex = mean - G.base - G.band;
  if (ex <= 0) return { mean, d: 0 };
  const d = Math.min(G.maxD, ex);
  for (const p of active(L)) {
    if (p.prospect || p.retired || p.ovr >= 75) continue;
    if (p.age <= 26) { const x = d * G.trimK * rnd(0.5, 1.5); p.ceil = Math.max(p.ovr + 1, (p.ceil != null ? p.ceil : p.pot) - x); if (p.pot > p.ceil + 4) p.pot = Math.max(p.ovr + 1, p.pot - Math.round(x)); }
    if (p.age >= 22 && p.age <= 30 && p.ovr >= 52) { const o = p.ovr; growTo(p, o - d * G.nudgeK * rnd(0.5, 1.5), Math.max(p.age, 25)); p.ovr = ovr(p); if (delta) delta[p.id] = (delta[p.id] || 0) + p.ovr - o; }
  }
  return { mean, d };
}
// v27 P4: league gravity (NBA mode). After each summer's development, gently pull the counts back toward the real league's shape:
// about 30 players at 75+, 8-10 at 85+, 4-5 at 90+. Random picks among the eligible players, small steps, so the counts move but don't run away.
const NBA_BAL = { t75: 29, t85: [8, 10], t90: [4, 5], k75: 0.2, max75: 1.6, oldAge: 32, youngAge: 26, youngK: 1, primeK: 0.5, t95: 1, cap: 96, capGen: 97 };   // v36a B: one 95+ player, ceiling 96 (97 generational): top PER ran 34-40.4 (5/20 over 39) with 96-97s; v34 A3 was t95 2 / 97 / 98. v34 A3: very few 95+ (t95), none 98+ except a generational talent (cap / capGen); v27 U12: 75+ target 29, firmer pull near the target, smaller steps far from it (was 30 / 0.15 / 3.5: settled at ~34); U13: players 33+ are left to their natural decline
function nbaBalance(L, delta) {
  const all = active(L).filter(p => !p.prospect && !p.retired), cnt = x => all.filter(p => p.ovr >= x).length, B = NBA_BAL;
  const nudge = (p, d) => { const o = p.ovr; growTo(p, o + d, Math.max(p.age, 25)); p.ovr = ovr(p); if (p.ovr > p.pot) p.pot = p.ovr; if (delta) delta[p.id] = (delta[p.id] || 0) + p.ovr - o; };
  // v27 U12: too many good players → trim the ceiling of the young ones (the inflow) so the pull lasts; primes get a light touch, players past oldAge are left to age
  const trim = (p, x) => { p.ceil = Math.max(p.ovr + 1, (p.ceil != null ? p.ceil : p.pot) - x); if (p.pot > p.ceil + 4) p.pot = Math.max(p.ovr + 1, p.pot - Math.round(x)); };
  const ageK = p => p.age <= B.youngAge ? B.youngK : p.age <= B.oldAge ? B.primeK : 0;
  const c75 = cnt(75);
  if (c75 > B.t75 + 1) { const d = -Math.min(B.max75, (c75 - B.t75) * B.k75); for (const p of all) if (p.ovr >= 70 && p.ovr <= 84 && p.age >= 21) { const k = ageK(p); if (!k) continue; nudge(p, d * k * rnd(0.5, 1.5)); if (p.age <= B.youngAge) trim(p, -d * rnd(0.5, 1.5)); } }
  else if (c75 < B.t75 - 4) { const d = Math.min(1.5, (B.t75 - c75) * B.k75); for (const p of all) if (p.ovr >= 69 && p.ovr <= 79 && p.age <= 27) nudge(p, d * rnd(0.5, 1.5)); }
  const shuf = a => a.sort(() => R() - 0.5), youngFirst = a => shuf(a).sort((x, y) => (x.age <= B.youngAge ? 0 : 1) - (y.age <= B.youngAge ? 0 : 1));
  const c85 = cnt(85);
  if (c85 > B.t85[1]) for (const p of youngFirst(all.filter(p => p.ovr >= 85 && p.ovr <= 89 && p.age >= 23 && p.age <= B.oldAge)).slice(0, c85 - B.t85[1])) { nudge(p, -rnd(1, 2) * (p.age <= B.youngAge ? 1 : 0.7)); if (p.age <= B.youngAge) trim(p, rnd(1, 3)); }
  else if (c85 < B.t85[0]) for (const p of shuf(all.filter(p => p.ovr >= 81 && p.ovr <= 84 && p.age <= 30)).slice(0, B.t85[0] - c85)) nudge(p, rnd(1.5, 3.5));
  const c90 = cnt(90);
  if (c90 > B.t90[1]) for (const p of youngFirst(all.filter(p => p.ovr >= 90 && p.age >= 23 && p.age <= B.oldAge)).slice(0, c90 - B.t90[1])) { nudge(p, -rnd(1, 2)); if (p.age <= B.youngAge) trim(p, rnd(1, 2)); }
  else if (c90 < B.t90[0]) for (const p of all.filter(p => p.ovr >= 85 && p.ovr <= 89 && p.age <= 31).sort((a, b) => b.ovr - a.ovr + rnd(-1.5, 1.5)).slice(0, B.t90[0] - c90)) nudge(p, rnd(1.5, 3));
  if (B.cap) nbaTopCap(L, all, nudge);
}
// v34 A3: the very top. A 97-99 OVR star posted PER 40-46 (real best ~32): ceilings stop at 97 (98 for a generational talent),
// anyone above is eased back, and past B.t95 players at 95+ the extras (youngest first) lose 1-2.
function nbaTopCap(L, all, nudge) {
  const B = NBA_BAL;
  for (const p of all) {
    const cap = p.gen ? B.capGen : B.cap;
    for (let i = 0; i < 6 && p.ovr > cap; i++) nudge(p, cap - p.ovr - (p.gen ? 0 : rnd(0, 1)));   // v36a: growTo can stop short (a 99 generational talent stayed 98 over a 97 cap): repeat
    if (p.pot > cap) p.pot = Math.max(p.ovr, cap);
    if (p.ceil != null && p.ceil > cap) p.ceil = Math.max(p.ovr, cap);
  }
  const top = all.filter(p => p.ovr >= 95).sort((a, b) => a.age - b.age || R() - 0.5);
  for (const p of top.slice(0, Math.max(0, top.length - B.t95))) { nudge(p, -rnd(1, 2)); for (let i = 0; i < 6 && p.ovr >= 95; i++) nudge(p, 94 - p.ovr - rnd(0, 1)); if (p.pot > p.ovr + 1) p.pot = Math.min(p.pot - 1, 95); }   // v36a: the extras end under 95 (a 96 lost 1 and stayed 95+)
}
// v35b: the PBL version of nbaTopCap. The league has no real-NBA scale, so the cap follows the league: rostered mean + K x sd
// (mean 59, sd 8.8 -> ceiling ~91, ~96 for a generational talent). Past nTop players above mean + kTop x sd (~87) the extras (youngest first) lose 1-2.
const PBL_TOP = { k: 3.6, kGen: 4.2, kTop: 3.2, nTop: 2 };
function leagueTopCap(L, delta) {
  const ro = []; for (const t of L.teams) for (const id of t.roster) { const p = L.players[id]; if (p && !p.retired) ro.push(p); }
  if (ro.length < 20) return null;
  const m = ro.reduce((a, p) => a + p.ovr, 0) / ro.length, sd = Math.sqrt(ro.reduce((a, p) => a + (p.ovr - m) ** 2, 0) / ro.length), B = PBL_TOP;
  const cap = Math.round(m + B.k * sd), capG = Math.round(m + B.kGen * sd), hi = Math.round(m + B.kTop * sd);
  const all = active(L).filter(p => !p.prospect && !p.retired);
  const nudge = (p, d) => { const o = p.ovr; growTo(p, o + d, Math.max(p.age, 25)); p.ovr = ovr(p); if (p.ovr > p.pot) p.pot = p.ovr; if (delta) delta[p.id] = (delta[p.id] || 0) + p.ovr - o; };
  for (const p of all) {
    const c = p.gen ? capG : cap;
    for (let i = 0; i < 6 && p.ovr > c; i++) nudge(p, c - p.ovr - (p.gen ? 0 : rnd(0, 1)));   // v36a: repeat (growTo can stop short)
    if (p.pot > c) p.pot = Math.max(p.ovr, c);
    if (p.ceil != null && p.ceil > c) p.ceil = Math.max(p.ovr, c);
  }
  const top = all.filter(p => p.ovr >= hi).sort((a, b) => a.age - b.age || R() - 0.5);
  for (const p of top.slice(0, Math.max(0, top.length - B.nTop))) { nudge(p, -rnd(1, 2)); if (p.pot > p.ovr + 1) p.pot--; }
  return { cap, capG, hi };
}
// v27 K1: an AI coach moves each slider 15% of the way toward a target: half his system default, half what his top 8 do well
function slAdapt(L, t) {
  const c = t.coach; slSync(c); const s = c.sl || slSeed(c, 6), d = slDefault(c), r = rosterOf(L, t).sort((a, b) => b.ovr - a.ovr).slice(0, 8); if (!r.length) return;
  const av = k => r.reduce((a, p) => a + (p[k] || 50), 0) / r.length, lean = (k, x) => { const tg = clamp(0.5 * d[k] + 0.5 * (50 + x), 0, 100); s[k] = Math.round(s[k] + 0.15 * (tg - s[k])); };
  lean('three', (av('tp') - 55) * 2); lean('rim', ((av('fin') + av('pst')) / 2 - 52) * 2); lean('glass', (av('orb') - 42) * 2); lean('ball', (av('pas') - av('hnd') + 4) * 2);
  lean('gamble', (av('stl') - 48) * 2); lean('help', (av('blk') - 40) * 1.5);
  c.sl = s; SLD_CACHE.delete(c);
}
function retireChance(L, p) {
  const a = p.age;
  const aa = NBA_ON && p.ovr >= 62 ? a - 2 : a;   // v27: NBA careers run longer for useful players
  let pr = aa <= 29 ? 0.003 : [0.02, 0.04, 0.07, 0.12, 0.2, 0.3, 0.42, 0.55, 0.7][aa - 30] ?? 0.85;
  if (p.ovr < 45) pr *= 2; else if (p.ovr < 55) pr *= 1.4;
  if (NBA_ON && p.ovr >= 85) pr *= 0.2; else if (p.ovr >= 82) pr *= 0.4; else if (p.ovr >= 75) pr *= 0.55;   // v27: NBA stars play on while still elite
  if (NBA_ON && p.leg && p.leg.tid === p.team && p.leg.v >= 250 && p.ovr >= 70) pr *= 0.7;   // v27 U13: franchise icons play a little longer
  if (p.injuries.filter(i => i.s >= L.season - 1).length >= 4) pr *= 1.5;
  if (p.injuries.some(i => i.s === L.season && i.long)) pr *= 1.4;
  if (p.team == null) pr *= 1.5;
  return Math.min(0.97, pr);
}
function compactRetired(p) {
  delete p.moraleParts; delete p.moodMin; delete p.ask; delete p.faDays;
  if (p.injuries && p.injuries.length > 5) p.injuries = p.injuries.slice(-5);
  for (const h of p.hist || []) { if (h.rsT && Object.keys(h.rsT).length <= 1) h.rsT = null; if (h.poT && Object.keys(h.poT).length <= 1) h.poT = null; }
}
// ---------- Two-way contracts ----------
// 2 per team, players 27 or younger with fewer than 3 seasons of service (a season counts at 10+ regular-season games). Not on the cap or the 15-man roster.
// Up to 20 regular-season games with the big club (only games he actually plays count); no playoffs unless converted.
// On other days he plays in the development league. Deals run one season and expire when free agency opens.
const TW_MAX = 2; let TW_GAMES = 20;   // v26.6: set by setSeasonLen
// two-way service: only seasons with 10+ regular-season games count
function twSvc(p) { return new Set(p.hist.filter(h => h.rs && h.rs.gp >= 10).map(h => h.s)).size; }
function twEligible(L, p) { return p && !p.retired && !p.prospect && p.team == null && !p.tw && p.age <= 27 && twSvc(p) < 3 && L.fa.includes(p.id); }
function twOf(L, t) { return (t.twoWay || []).map(id => L.players[id]).filter(Boolean); }
// v25.7: a drafted 2nd-rounder (drafted = true) can take a 2-year two-way deal straight from the draft; it runs through the free agency that follows year 2 (tw.exp)
function signTwoWay(L, p, tid, drafted) {
  const t = L.teams[tid];
  const dr = !!drafted && p && p.draft && p.draft.rd === 2 && p.team == null && !p.tw && !p.retired && ['off-draft', 'off-resign'].includes(L.phase);
  if (!dr && !['regular', 'off-fa', 'off-ready'].includes(L.phase)) return 'Two-way deals can be signed during the regular season or free agency.';
  if (!dr && !twEligible(L, p)) return 'Only free agents 27 or younger with fewer than 3 seasons of service (a season counts at 10+ regular-season games) can sign two-way deals.';
  t.twoWay = t.twoWay || [];
  if (t.twoWay.length >= TW_MAX) return 'Both two-way slots are full.';
  const own2 = p.draft && p.draft.rd === 2 && p.draft.tid === tid && p.draft.s >= L.season - 1 && !(p.hist || []).some(h => h.rs && h.rs.gp);   // his drafting team, before he has played: always yes
  if (!dr && !own2) { const w = twWillSign(L, p); if (!w.ok) { if (tid === L.user) p.tx.push({ s: L.season, t: `Turned down a two-way offer from ${t.abbr}` }); return w.why; } }   // v30a #13
  if (!dr) L.fa = L.fa.filter(id => id !== p.id);
  p.tw = { tid, s: capSeason(L), games: 0, active: false }; p.ask = null; p.lastTeam = tid;
  if (dr) { p.tw.exp = L.season + 2; p.draftRights = null; }
  t.twoWay.push(p.id);
  assignNumber(L, p, t);   // v30 review: checks roster + two-way slots
  p.tx.push({ s: L.season, t: `Two-way deal with ${t.abbr}` });
  if (tid === L.user) logNews(L, `${t.abbr} signed ${p.name} (${p.ovr}) to a two-way deal`, tid, 'tx');
  return null;
}
// v30a #13: a free agent can turn down a two-way deal when he expects a standard contract (market value above the minimum, or he rates
// with the end of most benches). Drafted 2nd-rounders never decline (signTwoWay skips this). One answer per player per week in the season
// (per phase in the offseason), from a fixed hash, so asking again the same day gives the same answer. The market cools as the season goes on.
const TW_REJ = { mval: 0.8, mvalMin: 1.25, over3: 0.7, over0: 0.4, near: 0.12, low: 0.03, late: 0.3, mid: 0.8, wk: 0.07, pre: 0.2 };   // v30 review: mval counts only 25%+ above the minimum; the market cools each week; after free agency (pre) most unsigned players accept
let TW_BL = null;
function twBenchLine(L) {   // median 13th-best overall on standard rosters (cached per day)
  const key = L.season + ':' + L.phase + ':' + L.day;
  if (TW_BL && TW_BL.L === L && TW_BL.key === key) return TW_BL.v;
  const v13 = L.teams.map(t => t.roster.map(id => L.players[id]).filter(Boolean).map(p => p.ovr).sort((a, b) => b - a)[12]).filter(x => x != null).sort((a, b) => a - b);
  const v = v13.length ? v13[Math.floor(v13.length / 2)] : 45;
  TW_BL = { L, key, v }; return v;
}
function twHash(a, b, c) { let h = (a * 73856093) ^ (b * 19349663) ^ (c * 83492791); h = Math.imul(h ^ (h >>> 13), 0x5bd1e995); h ^= h >>> 15; return (h >>> 0) / 4294967296; }
function twWillSign(L, p) {
  const bench = twBenchLine(L), over = p.ovr - bench, hi = (p.mval || MINSAL) > MINSAL * TW_REJ.mvalMin;
  let ch = over >= 3 ? TW_REJ.over3 : over >= 0 ? TW_REJ.over0 : over >= -3 ? TW_REJ.near : TW_REJ.low, why = over >= 0 ? 'ovr' : 'hold';
  if (hi) { const m = Math.min(0.95, TW_REJ.mval + 0.15 * Math.min(1, ((p.mval || MINSAL) - MINSAL) / MINSAL)); if (m >= ch) { ch = m; why = 'mval'; } }
  if (L.phase === 'regular') ch *= L.day > totalDays(L) * 0.5 ? TW_REJ.late : Math.max(TW_REJ.late, TW_REJ.mid - TW_REJ.wk * Math.floor(L.day / 7));
  else if (L.phase === 'off-ready') ch *= TW_REJ.pre;
  const per = L.phase === 'regular' ? Math.floor(L.day / 7) : ['off-fa', 'off-ready'].indexOf(L.phase) + 1000;
  const ok = twHash(p.id, L.season, per) >= ch;
  if (ok) return { ok: true, why: null, ch };
  const txt = why === 'mval' ? `${p.name} turned down the two-way deal: he expects a standard contract (his market value is ${money(p.mval)}, above the minimum).`
    : why === 'ovr' ? `${p.name} turned down the two-way deal: at ${p.ovr} OVR he rates with the end of most benches (${bench}) and expects a standard contract.`
    : `${p.name} turned down the two-way deal: he wants to wait for a standard contract offer. Try again next week.`;
  return { ok: false, why: txt, ch, k: why };
}
function dropTwoWay(L, p, toFa) {
  if (!p.tw) return; const t = L.teams[p.tw.tid];
  t.twoWay = (t.twoWay || []).filter(id => id !== p.id); p.tw = null;
  if (toFa && !p.retired) { if (!L.fa.includes(p.id)) L.fa.push(p.id); setAsk(L, p); }
}
function releaseTwoWay(L, p) { const t = L.teams[p.tw.tid]; p.tx.push({ s: L.season, t: `Released from two-way deal by ${t.abbr}` }); dropTwoWay(L, p, true); }
// Convert to a standard deal: needs a roster spot (15 max), regular season only. Minimum salary, 2 years (team option on year 2).
function convertTwoWay(L, p) {
  if (!p.tw) return 'Not on a two-way deal.';
  const t = L.teams[p.tw.tid];
  if (L.phase !== 'regular') return 'Conversions happen during the regular season (rosters are set for the playoffs).';
  if (t.roster.length >= 15) return `${t.abbr} have 15 players. Release someone first.`;
  const tid = t.id; dropTwoWay(L, p, false);
  signContract(L, p, tid, MINSAL, 2, 'signing', 'TO');
  p.noTrade = null;
  p.tx.push({ s: L.season, t: `Converted to a standard contract by ${t.abbr}` });
  logNews(L, `${t.abbr} converted ${p.name}'s two-way deal to a standard contract`, tid, 'tx');
  return null;
}
function expireTwoWays(L) { for (const t of L.teams) for (const p of twOf(L, t)) { if (p.tw.exp && L.season < p.tw.exp) continue; p.tx.push({ s: L.season, t: `Two-way deal with ${t.abbr} expired` }); dropTwoWay(L, p, true); } }
// AI teams fill their slots with the young free agents their director likes most
function aiFillTwoWay(L) {
  for (const t of L.teams) {
    if (t.id === L.user) continue; t.twoWay = t.twoWay || [];
    if (t.twoWay.length >= TW_MAX) continue;
    // v30a #13: a player who turns the team down is skipped; the next one on the list is asked
    const cs = L.fa.map(id => L.players[id]).filter(p => twEligible(L, p)).map(p => ({ p, v: 0.6 * teamPotEst(L, t.id, p).est + 0.4 * p.ovr })).filter(x => x.v >= 48).sort((a, b) => b.v - a.v);
    for (const c of cs) { if (t.twoWay.length >= TW_MAX) break; if (twEligible(L, c.p)) signTwoWay(L, c.p, t.id); }
  }
}
// AI conversions: a two-way who has used his games and is better than the end of the bench, or who beats the free agents when a roster spot opens
function aiConvertTwoWay(L, t, short) {
  if (t.id === L.user || L.phase !== 'regular' || t.roster.length >= 15) return false;
  const p = twOf(L, t).sort((a, b) => b.ovr - a.ovr)[0]; if (!p) return false;
  const low = rosterOf(L, t).reduce((m, x) => Math.min(m, x.ovr), 99);
  const fa = short ? bestFA(L) : null;
  if ((short && (!fa || p.ovr >= fa.ovr - 2)) || (p.tw.games >= TW_GAMES - 2 && p.ovr >= low + 3)) return !convertTwoWay(L, p);
  return false;
}
// v23: a few days before the regular season ends, playoff and play-in AI teams convert a two-way who is clearly better
// than their end of the bench (two-ways can't play in the playoffs). With a full roster they release a cheap end-of-bench player to make room.
const twPoDay = L => totalDays(L) - 5;
function twCutCands(L, t) {
  const cs = capSeason(L);
  return rosterOf(L, t).filter(x => x.contract && !x.protect && !(x.age <= 23 && (x.scout || 0) >= 70) && capHit(L, x, cs) <= 2 * MINSAL && (x.contract.exp <= L.season || x.contract.amt <= MINSAL)).sort((a, b) => a.ovr - b.ovr);
}
function aiTwoWayPlayoff(L) {
  const cs = capSeason(L); L.twPoLog = L.twPoLog || [];
  for (const t of L.teams) {
    if (t.id === L.user || !twOf(L, t).length) continue;
    const seed = seedOrder(L, t.conf).indexOf(t.id) + 1; if (seed < 1 || seed > poPlayinTo(L)) continue;
    for (const p of twOf(L, t).sort((a, b) => b.ovr - a.ovr)) {
      if (payroll(L, t, cs) + MINSAL > APRON) break;
      const low = rosterOf(L, t).reduce((m, x) => Math.min(m, x.ovr), 99);
      if (t.roster.length < 15) { if (p.ovr >= low + 2 && !convertTwoWay(L, p)) L.twPoLog.push({ s: L.season, tid: t.id, conv: p.id, cut: null }); continue; }
      const cut = twCutCands(L, t)[0];
      if (!cut || p.ovr < cut.ovr + 4) continue;
      release(L, cut);
      if (!convertTwoWay(L, p)) { L.twPoLog.push({ s: L.season, tid: t.id, conv: p.id, cut: cut.id, d: p.ovr - cut.ovr }); logNews(L, `${t.abbr} released ${cut.name} (${cut.ovr}) to make room for ${p.name} (${p.ovr}) in the playoffs`, t.id, 'tx'); }
    }
  }
}
// Development-league game for a two-way player who didn't play for the big club that day
function dlGame(L, p) {
  if (!p.dl || p.dl.s !== L.season) p.dl = { s: L.season, tid: p.tw ? p.tw.tid : p.team, gp: 0, min: 0, pts: 0, reb: 0, ast: 0, stl: 0, blk: 0, tpm: 0, last: [] };
  const lvl = clamp((p.ovr - 36) / 20, 0, 1.6), min = Math.round(clamp(gauss(31, 4), 20, 40)), f = min / 32;
  const use = 0.75 + ((p.tbd || 50) - 50) / 100;
  const pts = Math.max(0, Math.round(gauss((8 + lvl * 10) * use * f, 5)));
  const reb = Math.max(0, Math.round(gauss((2.5 + ((p.drb || 40) + (p.orb || 40)) / 40 + (p.hgt - 76) * 0.35) * f, 2)));
  const ast = Math.max(0, Math.round(gauss((0.5 + (p.pas || 40) / 17) * f * (0.6 + (p.tbd || 50) / 110), 1.5)));
  const stl = Math.max(0, Math.round(gauss(((p.stl || 40) / 50) * f, 0.8))), blk = Math.max(0, Math.round(gauss(((p.blk || 40) / 50 - 0.3) * f, 0.8)));
  const tpm = Math.max(0, Math.round(gauss(((p.tp || 40) - 30) / 15 * f * ((p.t3 || 50) / 60), 1)));
  const d = p.dl; d.gp++; d.min += min; d.pts += pts; d.reb += reb; d.ast += ast; d.stl += stl; d.blk += blk; d.tpm += tpm;
  d.last.unshift([L.day, min, pts, reb, ast]); if (d.last.length > 5) d.last.length = 5;
}
// v21 basic D-league: players in their first 3 seasons, and anyone barely playing, get a D-league game on days they don't play for the team.
function dlEligible(L, p) {
  if (p.tw || p.injury > 0 || p.dlOff) return false;
  const s = p.stats.rs, mpg = s && s.gp ? s.min / s.gp / 60 : 0, tg = p.team != null ? L.teams[p.team].w + L.teams[p.team].l : 0;
  return ((p.svc || 0) <= 2 && p.age <= 24) || (tg >= 5 && mpg < 8);
}
function twoWayDay(L, games) {
  if (L.phase === 'regular' && L.day % 7 === 3 && L.day < totalDays(L) * 0.8) aiFillTwoWay(L);   // v30a #13: AI teams retry open two-way slots weekly (players can say no)
  const played = new Map();
  for (const g of games) { if (g.playoff) continue; for (const tid of [g.home, g.away]) played.set(tid, g); }
  for (const [tid, g] of played) {
    const t = L.teams[tid];
    for (const p of rosterOf(L, t)) { if (!dlEligible(L, p)) continue; const row = g.box.find(r => r[0] === p.id); if (!row || !(row[2] > 0)) dlGame(L, p); }
    for (const p of twOf(L, t)) {
      const row = g.box.find(r => r[0] === p.id);
      if (row && row[2] > 0) { p.tw.games++; if (p.tw.games === TW_GAMES && tid === L.user) logNews(L, `${p.name} has used all ${TW_GAMES} of his two-way games. Convert him to keep him with the team.`, tid, 'tx'); }
      else if (p.injury <= 0) dlGame(L, p);
    }
  }
}
// ---------- Coach development reports ----------
// The head coach's read of a young player's path (better development coaches read it right more often), where he could peak, and what to work on
const DEV_FOCUS = { g: ['hnd', 'pas', 'tp', 'mid', 'fin', 'per', 'stl', 'iq'], w: ['tp', 'mid', 'fin', 'per', 'drb', 'str', 'hnd', 'iq'], b: ['fin', 'pst', 'drb', 'orb', 'blk', 'pdf', 'str', 'iq'] };
function coachDevReport(L, p) {
  const tid = p.team != null ? p.team : p.tw ? p.tw.tid : null;
  if (tid == null || p.retired || p.prospect || p.age > 27) return null;
  const c = L.teams[tid].coach, rd = c ? c.rdev : 55;
  const acc = clamp(0.45 + rd / 200, 0.5, 0.92);
  const paths = ['boom', 'avg', 'bust'];
  let read = p.path || 'avg';
  if (p.bloom && p.age <= 23 && hrand(p.id, tid * 13 + 1, 5) < 0.5) read = 'bust';          // late bloomers often look stalled early
  else if (hrand(p.id, tid * 13 + L.season, 91) > acc) read = paths[(paths.indexOf(read) + (hrand(p.id, tid * 7 + L.season, 3) < 0.5 ? 1 : 2)) % 3];
  const est = teamPotEst(L, tid, p).est, gap = Math.max(0, est - p.ovr);
  const mid = p.ovr + gap * (read === 'boom' ? 1 : read === 'avg' ? 0.8 : 0.45) + hgauss(p.id, tid * 53 + L.season) * (100 - rd) / 25;
  const spread = Math.round(clamp((100 - rd) / 12, 1, 5));
  const peak = [Math.max(p.ovr, Math.round(mid - spread)), Math.max(p.ovr, Math.round(mid + spread))];
  const keys = DEV_FOCUS[p.pos <= 1 ? 'g' : p.pos <= 2 ? 'w' : 'b'];
  const noisy = keys.map((k, i) => ({ k, v: p[k] + hgauss(p.id, tid * 61 + i + L.season) * (100 - rd) / 18 })).sort((a, b) => b.v - a.v);
  const last = p.hist.filter(h => h.ovr != null).slice(-1)[0];
  const trend = last ? p.ovr - last.ovr : null;
  const text = read === 'boom' ? 'Ahead of schedule. Keep giving him real minutes.' : read === 'avg' ? 'Developing about as expected.' : (p.age <= 22 ? 'Progress has been slow so far. Some players come on late.' : 'Progress has stalled. He may not get much better.');
  return { read, text, peak, strengths: noisy.slice(0, 2).map(x => LABELS[x.k]), focus: noisy.slice(-2).reverse().map(x => LABELS[x.k]), trend, work: traitLevel(p, 'wet') < 1 ? null : p.wrk >= 70 ? 'Works hard on his game.' : p.wrk <= 45 ? 'Needs to put in more work.' : null, coach: c ? c.name : null, dl: p.dlBoost === L.season - 1 ? 'His development-league season helped.' : null };
}
function retirePlayer(L, p, why) {
  try { caExQueue(L, p); } catch (e) { }   // v27 S1
  if (p.tw) dropTwoWay(L, p, false);
  const tm = p.team != null ? L.teams[p.team].abbr : null;
  removeFromTeam(L, p); L.fa = L.fa.filter(id => id !== p.id);
  p.retired = L.season; p.contract = null; p.ext = null; p.retireWhy = why;
  compactRetired(p);
  p.tx.push({ s: L.season, t: `Retired${why ? ' (' + why + ')' : ''}` });
  try { retireTribute(L, p, tm); } catch (e) { }   // v26.6 R7
  return tm;
}
// Hall of Fame and retired jerseys
const HOF_MIN = 600;
// v22: 30-team leagues have more teams and more honors to go around, so the bar is higher
const hofMin = L => L && isBig(L) ? 700 : HOF_MIN;   // v22 retune after testing (650 still let in 6 All-Stars with no 1st team)
const AWARD_PTS = { 'All-Star': 6, 'MVP': 150, 'Finals MVP': 70, 'Defensive Player of the Year': 60, 'All-League 1st Team': 45, 'All-League 2nd Team': 20, 'All-League 3rd Team': 10, 'Clutch Player of the Year': 12, 'Conference Finals MVP': 12, 'All-Defense 1st Team': 22, 'All-Defense 2nd Team': 10, 'All-Rookie 1st Team': 4, 'All-Rookie 2nd Team': 2, 'Scoring title': 20, 'Rebounding title': 12, 'Assists title': 12, 'Steals title': 8, 'Blocks title': 8, 'Rookie of the Year': 15, 'Sixth Man of the Year': 10, 'Most Improved Player': 8, 'Champion': 25 };
// Production points per season: a star season (game score ~18/game) is worth about 100, a solid starter about 40
function seasonValue(h) { if (!h.rs || !h.rs.gp) return 0; const g = gmsc(seasonLine(h.rs)) / h.rs.gp; return 4 * Math.max(0, g - 10) * Math.min(1, h.rs.gp / SEASON_GAMES); }
// Playoff production: same scale per game, full credit for a 12-game run, a little more for a deep one
function poValue(h) { if (!h.po || !h.po.gp) return 0; const g = gmsc(seasonLine(h.po)) / h.po.gp; return 4 * Math.max(0, g - 10) * Math.min(1.25, h.po.gp / 12); }
// Hall of Fame needs star credentials too, so long-serving role players don't get in on volume
function hofCredentials(p, L) {
  const n = k => p.awards.filter(a => a.a === k).length;
  if (L && isBig(L)) { const al = n('All-League 1st Team') + n('All-League 2nd Team') + n('All-League 3rd Team'); return n('MVP') >= 1 || n('Defensive Player of the Year') >= 2 || n('Finals MVP') >= 2 || (n('All-Star') >= 6 && (n('All-League 1st Team') >= 1 || al >= 4)); }
  return n('All-Star') >= 3 || n('MVP') + n('Finals MVP') + n('Defensive Player of the Year') + n('All-League 1st Team') >= 1 || n('All-League 2nd Team') >= 2;
}
function legacyScore(p, tid, full) {   // full: count his real seasons with tid even when p.leg holds them (All-time greats by team)
  const rows = p.hist.filter(h => tid == null || h.tid === tid);
  const seasons = new Set(rows.map(h => h.s));
  let v = rows.reduce((a, h) => a + seasonValue(h) + poValue(h), 0);
  const realT = a => a.real && p.legBaseT && p.legBaseT[tid] != null && (full || !p.leg) && (p.legSeasT ? (p.legSeasT[a.s] || []).includes(tid) : true);   // v37b: real award -> the team of that season
  for (const a of p.awards) if (tid == null || seasons.has(a.s) || realT(a)) v += AWARD_PTS[a.a] || 0;
  if (tid == null && p.legBase) v += p.legBase;
  if (tid == null && p.preAw) v += pipeHofPts(p);   // v29 P10: pre-draft honors (small)   // v27 H3: real seasons before this league (stars)
  else if (tid != null && p.legBaseT && p.legBaseT[tid] && (full || !p.leg)) v += p.legBaseT[tid];   // (p.leg already holds his real legacy with that team)
  return r1(v);
}
// v27 N8: real résumé before this league (real NBA Hall of Fame standard): 7+ All-Star, or 3+ titles with 4+ All-Star, or 2+ DPOY, or an MVP
function realHofCase(p) {
  if (!p.real) return false; const c = {}; for (const a of p.awards || []) if (a.real) c[a.a] = (c[a.a] || 0) + 1;
  return (c['All-Star'] || 0) >= 7 || ((c['Champion'] || 0) >= 3 && (c['All-Star'] || 0) >= 4) || (c['Defensive Player of the Year'] || 0) >= 2 || (c['MVP'] || 0) >= 1;
}
function honorRetired(L, p) {
  { const ts = new Set(p.hist.filter(h => h.rs && h.rs.gp).map(h => h.tid)); const n = new Set(p.hist.filter(h => h.rs && h.rs.gp).map(h => h.s)).size; if (ts.size === 1 && n >= 13) achGive(L, p, 'p', 'oneteam', L.teams[[...ts][0]] ? L.teams[[...ts][0]].abbr : ''); }
  const score = legacyScore(p, null);
  p.legacy = score;
  const hxIn = typeof hxHofYear === 'function' ? hxHofYear(L, p.name) : null;   // v37b: already in the Hall (history list): never inducted twice
  if (hxIn) p.hofX = hxIn;
  else if ((score >= hofMin(L) && hofCredentials(p, L)) || realHofCase(p)) {
    L.hof.push({ pid: p.id, name: p.name, s: L.season, score, teams: [...new Set(p.hist.map(h => h.tid).filter(x => x != null))] });
    p.hof = L.season;
    logNews(L, flL(L, 'hof.induct', { name: p.name }), null, 'award');
  }
  const byTeam = {}; for (const h of p.hist) if (h.tid != null && h.rs && h.rs.gp) byTeam[h.tid] = (byTeam[h.tid] || 0) + 1;
  if (p.real && typeof nbaRealRows === 'function') { const ab = {}; for (const t of L.teams) ab[nbaAbOf(t)] = t.id; for (const r of nbaRealRows(p) || []) if (ab[r.team] != null) byTeam[ab[r.team]] = (byTeam[ab[r.team]] || 0) + 1; }   // v27 H3: real seasons count for jerseys
  const best = Object.entries(byTeam).sort((a, b) => b[1] - a[1])[0];
  if (best && best[1] >= 4 && p.num != null) {
    const tid = +best[0], ts = legacyScore(p, tid);
    if (p.hof || p.hofX || ts >= 350) {
      const t = L.teams[tid];
      if (!t.retired.some(r => r.num === p.num)) { t.retired.push({ num: p.num, pid: p.id, name: p.name, s: L.season }); try { jerseyTribute(L, t, p, p.num); } catch (e) { } (L.jerseys = L.jerseys || []).unshift({ s: L.season, tid, pid: p.id, num: p.num, name: p.name }); logNews(L, `${t.city} ${t.name} retire #${p.num} for ${p.name}`, tid, 'award'); }
    }
  }
}
// v28.4 F4: Hall of Fame speech + season recap facts (text lives in nba-text.js NBA_TEXT.story; both modes use it)
const F4_NOAB = ['TOT', '2TM', '3TM', '4TM'];
function hofSpeechFacts(L, p) {
  const tAb = {}; for (const t of L.teams) tAb[typeof nbaAbOf === 'function' ? nbaAbOf(t) : t.abbr] = t.id;
  const rows = (p.hist || []).filter(h => h.tid != null && h.rs && h.rs.gp);
  // coaches: seasons together (sim seasons, from the archived standings)
  const co = {}; for (const h of rows) { const H = L.history.find(x => x.s === h.s), st = H && H.standings.find(x => x.tid === h.tid); if (st && st.cid != null) { const k = st.cid; (co[k] = co[k] || { id: k, name: st.coach, n: 0 }).n++; } }
  const coaches = Object.values(co).sort((a, b) => b.n - a.n).slice(0, 2);
  // teammates: shared seasons x shared minutes (sim + real seasons)
  const mates = {}, add = (key, name, pid, mins) => { const m = mates[key] = mates[key] || { name, pid, n: 0, v: 0 }; m.n++; m.v += mins; if (pid != null) m.pid = pid; };
  const byName = {}; for (const q of Object.values(L.players)) if (q.real) byName[q.name] = q.id;
  const mine = {}; for (const h of rows) mine[h.s + ':' + h.tid] = (h.rs.min || 0) / 60;
  for (const q of Object.values(L.players)) { if (q.id === p.id) continue; for (const h of q.hist || []) { const k = h.s + ':' + h.tid; if (mine[k] != null && h.rs && h.rs.gp) add('p' + q.id, q.name, q.id, Math.min(mine[k], (h.rs.min || 0) / 60)); } }
  if (p.real && typeof NBA_CAR !== 'undefined') {
    const myR = {}; const me = NBA_CAR[p.name];
    if (me) for (const r of me.rs) if (r[0] !== '2025-26' && !F4_NOAB.includes(r[1])) myR[r[0] + ':' + r[1]] = r[4];
    for (const n in NBA_CAR) if (n !== p.name) for (const r of NBA_CAR[n].rs) { const k = r[0] + ':' + r[1]; if (myR[k] != null) add(byName[n] != null ? 'p' + byName[n] : 'n' + n, n, byName[n], Math.min(myR[k], r[4])); }
    const x = typeof nbaRowOf === 'function' ? nbaRowOf(p.name) : null;   // 2025-26 roster (every real player)
    if (x) { const mm = (x[1][11] || [])[0] * (x[1][11] || [])[2] || 0; for (const r of NBA26[x[0]].p) if (r[0] !== p.name && r[11]) add(byName[r[0]] != null ? 'p' + byName[r[0]] : 'n' + r[0], r[0], byName[r[0]], Math.min(mm, (r[11][0] || 0) * (r[11][2] || 0))); }
  }
  const teammates = Object.values(mates).filter(m => m.v >= 300).sort((a, b) => b.v - a.v).slice(0, 3).map(m => ({ name: m.name, pid: m.pid, n: m.n, min: Math.round(m.v) }));
  // family in the league (players and coaches)
  const fam = (typeof relatives === 'function' ? relatives(L, p) : []).map(r => ({ k: r.k, name: r.who.name }));
  const cnt = k => (p.awards || []).filter(a => a.a === k).length;
  // the team he thanks first: most seasons (sim + real)
  const ts = {}; for (const h of rows) ts[h.tid] = (ts[h.tid] || 0) + 1;
  if (p.real && typeof nbaRealRows === 'function') for (const r of nbaRealRows(p) || []) if (r.s < 1 && tAb[r.team] != null && !rows.some(h => h.s === r.s)) ts[tAb[r.team]] = (ts[tAb[r.team]] || 0) + 1;
  const best = Object.entries(ts).sort((a, b) => b[1] - a[1])[0];
  const seasons = new Set(rows.map(h => h.s)).size + (p.real && typeof nbaRealRows === 'function' ? (nbaRealRows(p) || []).filter(r => r.s < 1 && !rows.some(h => h.s === r.s)).length : 0);
  return { name: p.name, pid: p.id, coaches, teammates, fam, titles: cnt('Champion'), mvps: cnt('MVP'), fmvps: cnt('Finals MVP'), allStar: cnt('All-Star'), team: best ? +best[0] : null, teamN: best ? best[1] : 0, seasons };
}
function seasonRecapFacts(L, S) {
  const H = L.history.find(h => h.s === S); if (!H) return null;
  const A = H.awards || {}, P = id => id != null && L.players[id] ? L.players[id] : null;
  const line = (p, po) => { const h = p && p.hist.find(x => x.s === S), s = h && (po ? h.po : h.rs); return s && s.gp ? { ppg: r1(s.pts / s.gp), rpg: r1(((s.orb || 0) + (s.drb || 0)) / s.gp), apg: r1((s.ast || 0) / s.gp) } : null; };
  const fin = H.playoffs && H.playoffs.length ? H.playoffs[H.playoffs.length - 1].series[0] : null;
  const best = H.standings.slice().sort((a, b) => b.w - a.w || (b.pf - b.pa) - (a.pf - a.pa))[0];
  const prev = L.history.find(h => h.s === S - 1); let surprise = null;
  if (prev) for (const st of H.standings) { const o = prev.standings.find(x => x.tid === st.tid); if (!o) continue; const d = Math.round((st.w / Math.max(1, st.w + st.l) - o.w / Math.max(1, o.w + o.l)) * SEASON_GAMES); if (d >= 8 && (!surprise || d > surprise.d)) surprise = { tid: st.tid, d, w: st.w, l: st.l }; }
  const ret = Object.values(L.players).filter(p => p.retired === S && (p.hof === S || (p.legacy || 0) >= 150)).sort((a, b) => (b.legacy || 0) - (a.legacy || 0)).slice(0, 3).map(p => ({ pid: p.id, name: p.name, hof: p.hof === S ? 1 : 0, seasons: p.svc || 0 }));
  const mvp = P(A.mvp), fm = P(A.fmvp), roy = P(A.roy);
  return { s: S, champ: H.champion, runnerUp: H.runnerUp, series: fin ? Math.max(fin.hw, fin.lw) + '-' + Math.min(fin.hw, fin.lw) : null,
    fmvp: fm ? { pid: fm.id, name: fm.name, ...(line(fm, true) || {}) } : null, mvp: mvp ? { pid: mvp.id, name: mvp.name, ...(line(mvp) || {}) } : null,
    best: best ? { tid: best.tid, w: best.w, l: best.l } : null, surprise, rookie: roy ? { pid: roy.id, name: roy.name, ...(line(roy) || {}) } : null, retired: ret };
}
// text: pick a wording by hash so the same speech / recap reads the same every time
function storyT(key, vars, seed) { const S = typeof NBA_TEXT !== 'undefined' && NBA_TEXT.story ? NBA_TEXT.story[key] : null; if (!S || !S.length) return ''; return S[flHash(String(seed) + key) % S.length].replace(/\{(\w+)\}/g, (m, k) => vars && vars[k] != null ? vars[k] : m); }
const F4_FAM = { brother: 'brother', son: 'father', father: 'son' };   // r.k = what HE is to them; the relative is the other side
function hofSpeech(L, p) {
  const f = hofSpeechFacts(L, p), sd = 'hof' + p.id, tn = id => L.teams[id] ? L.teams[id].city + ' ' + L.teams[id].name : '', out = [];
  out.push(storyT('hof.speech.open', { name: f.name, seasons: f.seasons }, sd));
  if (f.team != null) out.push(storyT('hof.speech.team', { team: tn(f.team), n: f.teamN }, sd));
  if (f.coaches.length) out.push(storyT(f.coaches.length > 1 ? 'hof.speech.coach2' : 'hof.speech.coach', { c1: f.coaches[0].name, c2: f.coaches[1] ? f.coaches[1].name : '' }, sd));
  if (f.teammates.length) out.push(storyT('hof.speech.mates', { list: f.teammates.map(m => m.name).join(f.teammates.length > 2 ? ', ' : ' and ').replace(/, ([^,]*)$/, ', and $1'), top: f.teammates[0].name, rest: f.teammates.length > 1 ? f.teammates.slice(1).map(m => m.name).join(' and ') : 'And all of you' }, sd));
  if (f.fam.length) out.push(storyT('hof.speech.fam', { rel: F4_FAM[f.fam[0].k] || 'family', who: f.fam[0].name }, sd));
  if (f.titles || f.mvps) out.push(storyT(f.titles ? 'hof.speech.titles' : 'hof.speech.mvp', { n: f.titles, rings: f.titles === 1 ? 'one title' : f.titles + ' titles', mvps: f.mvps === 1 ? 'an MVP' : f.mvps + ' MVPs' }, sd));
  const body = out.filter(Boolean), open = body.shift();
  return [open, ...body.slice(0, 4), storyT('hof.speech.close', { name: f.name }, sd)].filter(Boolean).join(' ').replace(/\.\./g, '.');
}
function seasonRecap(L, S) {
  const f = seasonRecapFacts(L, S); if (!f) return ''; const tn = id => L.teams[id] ? L.teams[id].city + ' ' + L.teams[id].name : '', sd = 'rc' + S, out = [], sn = seasonName(S);
  if (f.champ != null) out.push(storyT('recap.champ', { season: sn, team: tn(f.champ), opp: f.runnerUp != null ? tn(f.runnerUp) : 'their opponent', series: f.series || '' }, sd));
  if (f.fmvp) out.push(storyT('recap.fmvp', { name: f.fmvp.name, ppg: f.fmvp.ppg != null ? f.fmvp.ppg : '—' }, sd));
  if (f.mvp) out.push(storyT('recap.mvp', { name: f.mvp.name, ppg: f.mvp.ppg != null ? f.mvp.ppg : '—', rpg: f.mvp.rpg != null ? f.mvp.rpg : '—', apg: f.mvp.apg != null ? f.mvp.apg : '—' }, sd));
  if (f.best && f.best.tid !== f.champ) out.push(storyT('recap.best', { team: tn(f.best.tid), w: f.best.w, l: f.best.l }, sd));
  if (f.surprise) out.push(storyT('recap.surprise', { team: tn(f.surprise.tid), d: f.surprise.d, w: f.surprise.w, l: f.surprise.l }, sd));
  if (f.rookie) out.push(storyT('recap.rookie', { name: f.rookie.name, ppg: f.rookie.ppg != null ? f.rookie.ppg : '—' }, sd));
  if (f.retired.length) out.push(storyT('recap.retire', { list: f.retired.map(r => r.name).join(f.retired.length > 2 ? ', ' : ' and ').replace(/, ([^,]*)$/, ', and $1') }, sd));
  return out.filter(Boolean).slice(0, 6).join(' ').replace(/\.\./g, '.');
}
// Step 1: archive, aging, retirement, draft class
// Stuck on the treadmill: three straight seasons finishing 6th-12th overall without the playoffs. Pick a direction.
function treadmillCheck(L) {
  const H = L.history.slice(-3); if (H.length < 3) return;
  for (const t of L.teams) {
    if (t.id === L.user || (t.dirUntil != null && t.dirUntil >= L.season)) continue;
    const rows = H.map(h => ({ i: h.standings.findIndex(s => s.tid === t.id), s: h.standings.find(s => s.tid === t.id) }));
    const n = L.teams.length; if (!rows.every(r => r.s && r.i >= Math.round(n * 0.3) && r.i <= Math.round(n * 0.7) && r.s.confSeed > poDirect(L))) continue;
    const top = rosterOf(L, t).sort((a, b) => b.ovr - a.ovr).slice(0, 8), age = top.reduce((a, p) => a + p.age, 0) / Math.max(1, top.length);
    t.direction = age >= 27.5 ? 'rebuild' : 'contend'; t.dirUntil = L.season + 2;
    logNews(L, t.direction === 'rebuild' ? `${t.city} ${t.name} are done treading water: they're committing to a rebuild` : `${t.city} ${t.name} are done treading water: they're pushing to make the playoffs now`, t.id, 'league');
  }
}
// v24.9: an AI team's training focus for a player: his weak spots for his position, the coach's system, conditioning for veterans
function aiFocus(L, p) {
  { const sf = sysFocus(L, p); if (sf) return sf; }   // v26.6: development plan for young players who don't fit the system on rebuilding teams
  const t = L.teams[p.team], c = t && t.coach; if (!c || p.age > 31 || R() < 0.25) return p.age >= 29 && R() < 0.4 ? 'cond' : 'bal';
  const big = p.pos >= 3, guard = p.pos <= 1, spread = c.off === 'pace' || c.off === 'motion', cand = [];
  if (big) { if (p.tp >= 36 && p.ft >= 60) cand.push(['shoot', spread ? 0.9 : 0.3]); if (p.drb < 58) cand.push(['reb', 2]); if (p.blk < 52) cand.push(['rim', c.def === 'rim' ? 2.5 : 1.5]); if (p.pst >= 55 && c.off === 'inside') cand.push(['post', 2]); }
  else if (guard) { if (p.hnd < 62) cand.push(['handle', 2]); if (p.pas < 60) cand.push(['play', 2]); if (p.tp < 58) cand.push(['shoot', spread ? 2.5 : 1.5]); if (p.per < 55) cand.push(['perD', 1.5]); }
  else { if (p.tp < 58) cand.push(['shoot', spread ? 2.5 : 1.5]); if (p.per < 56) cand.push(['perD', 2]); if (p.fin < 56) cand.push(['finish', 1.5]); if (p.hnd < 50) cand.push(['handle', 1]); }
  if (p.age >= 28) cand.push(['cond', 1.5]);
  return cand.length ? wpick(cand.map(x => x[0]), cand.map(x => x[1])) : 'bal';
}
// v25.3: a chosen training focus sticks until changed or he changes teams. AI teams pick only when he has none (or the reason is gone).
function setFocus(L, p, f) { const nf = f && f !== 'bal' ? f : null; if (nf !== p.focus) p.focusSince = nf ? L.season : null; p.focus = nf; p.focusTid = p.team; }
function aiFocusGone(L, p) {
  const f = p.focus, t = L.teams[p.team];
  return f === 'rim' ? p.blk >= 52 : f === 'finish' ? p.fin >= 56 : f === 'post' ? !!t && t.coach.off !== 'inside' : f === 'shoot' ? p.tp >= 58 : f === 'reb' ? p.drb >= 58 : f === 'handle' ? p.hnd >= 62 : f === 'play' ? p.pas >= 60 : f === 'perD' ? p.per >= 55 : f === 'cond' ? p.age < 28 : false;
}
// returns true when a team change just cleared his focus
function trainSync(L, p) {
  let reset = false;
  if (p.focus && p.focusTid !== p.team) { p.focus = null; p.focusTid = null; reset = true; }
  if (p.team == null) { p.focus = null; p.focusTid = null; return reset; }
  if (p.team !== L.user || L.user == null) { if (p.focus === 'bal') p.focus = null; const sf = sysFocus(L, p); if (sf && p.focus !== sf) setFocus(L, p, sf); else if (!p.focus || aiFocusGone(L, p)) setFocus(L, p, aiFocus(L, p)); }   // v26.6: a system plan overrides
  return reset;
}
function startOffseason(L) {
  try { pipeSeason(L); } catch (e) { console.error('pipeSeason', e); }   // v29: college + international seasons, right after the Finals
  try { lr2SeasonEnd(L); } catch (e) { }   // v28.8
  try { persEvolve(L); } catch (e) { }
  payIncs(L, INC_PO);   // v26.1: conference finals / title incentives
  closeSeasonFinance(L);
  ownerReview(L);
  gmOffseason(L);   // v27 S2
  ownerSales(L);
  updateDuos(L);
  archiveSeason(L);
  try { refreshPoRivals(L); } catch (e) { }
  try { seedFriends(L); } catch (e) { console.error('seedFriends', e); }   // v37
  try { seedRivals(L); } catch (e) { }   // v18 fix: after the season is archived, so this year's playoff series count
  try { seasonAch(L); } catch (e) { }
  // v21: replaced by multi-season status plans (t.plan) in computeModes
  // treadmillCheck(L);
  yearbookStart(L);
  traitYear(L);   // v25.9
  L.games = [];
  const S = L.season, summary = { up: [], down: [], retired: [], posMoves: [], coaches: [], typeMoves: [], dev: {} };
  const delta = {}; L.trainReset = [];
  for (const p of active(L)) {
    if (p.prospect) { growProspect(L, p); continue; }
    if (p.team != null) { p.svc++; p.seen = (p.seen || 0) + 1; markRevealed(p); }   // v24.3: seasons observed in the league (reveals hidden traits); v24.4: a full reveal sticks
    const before = p.ovr, typeBefore = archLabel(p);
    p.mileage = Math.round(p.hist.reduce((a, h) => a + ((h.rs && h.rs.min) || 0) + ((h.po && h.po.min) || 0) * 1.5, 0) / 60);
    let pc = p.team != null ? L.teams[p.team].coach : p.tw ? L.teams[p.tw.tid].coach : null;
    if (pc && p.age <= 24 && p.team != null && mentorsOf(L, L.teams[p.team]).some(m => m.id !== p.id && Math.abs(m.pos - p.pos) <= 1)) pc = { ...pc, dev: (pc.dev || 0) + 0.5 };   // v16: a Mentor at his position helps a little
    // v20: playing time helps young players develop (minutes this season, 23 and under)
    if (p.age <= 23 && p.team != null) { const h = p.hist.find(x => x.s === S && x.rs && x.rs.gp), dl = p.dl && p.dl.s === S ? p.dl : null; let mpg = h ? h.rs.min / h.rs.gp / 60 : 0; if (dl && dl.gp) mpg = Math.max(mpg, ((h ? h.rs.min / 60 : 0) + 0.5 * dl.min) / ((h ? h.rs.gp : 0) + dl.gp));   /* v21: D-league minutes count half */ const minK = mpg >= 28 ? 1.32 : mpg >= 24 ? 1.24 : mpg >= 16 ? 1.1 : mpg >= 8 ? 1 : 0.85;   /* v26.6 review: stronger (was 1.22 / 1.16 / 1.07 / 1 / 0.9) */   /* v26.6 R1: minutes are their own growth multiplier (was +1.5 / +0.75 / 0 / -0.5 coach dev) */
      const tm = L.teams[p.team], wp = tm && tm.w + tm.l >= 20 ? tm.w / (tm.w + tm.l) : 0.5, cult = wp < 0.25 ? 0.98 : 1;   /* v26.6 review: was < .300 x0.96 (it cancelled most of the minutes edge on rebuilding teams) */   /* a losing culture slows growth a little */
      pc = { ...(pc || { dev: 0 }), minK: minK * cult }; }
    if (trainSync(L, p) && p.team === L.user && L.user != null) { if (!(L.trainReset || (L.trainReset = [])).includes(p.id)) L.trainReset.push(p.id); logNews(L, `Training reset to default for ${p.name} (new team)`, L.user, 'team'); }   // v25.3: a focus belongs to his team; AI teams keep a focus until its reason is gone
    const r = progressPlayer(p, pc, S);
    if (r.wetChange) trNote(p, S, 'wrk', WET_WRK[r.wetChange[1]] - WET_WRK[r.wetChange[0]], 'wet');   // v25.9
    if (r.wetChange && p.team != null && p.ovr >= 65 && traitLevel(p, 'wet') >= 2) logNews(L, `${p.name}'s work ethic has changed: now ${WET_NAMES[r.wetChange[1]].toLowerCase()}`, p.team, 'league');
    if (p.dl && p.dl.s === S && p.dl.gp >= gpq(25) && p.age <= 25 && R() < 0.7) { for (const k of ['fin', 'mid', 'tp', 'hnd', 'pas', 'per', 'drb', 'iq'].sort(() => R() - 0.5).slice(0, 3)) p[k] = Math.min(99, p[k] + 1); p.ovr = ovr(p); p.dlBoost = S; }
    p.arch = archetypes(p);
    delta[p.id] = p.ovr - before;
    { const ta = archLabel(p); if (typeBefore && ta !== typeBefore && p.team != null && p.ovr >= 55) { summary.typeMoves.push([p.id, typeBefore + ' → ' + ta]); p.tx.push({ s: S, t: `Type change: ${typeBefore} → ${ta}` }); } }
    { const old = p.tbd; setBallDominance(p); p.tbd = Math.round(0.75 * old + 0.25 * p.tbd); }
    if (p.team != null || p.ovr >= 60) { summary.up.push([p.id, p.ovr - before]); }
    if (r.posChanged && p.team != null) { summary.posMoves.push([p.id, r.posChanged]); p.tx.push({ s: S, t: `Position change: ${r.posChanged}` }); }
  }
  if (NBA_ON) nbaBalance(L, delta); else leagueTopCap(L, delta);   // v35b: PBL top cap relative to the league   // v27 P4: keep the NBA-like spread of stars
  leagueGravity(L, delta);   // v33a: keep the league's average near its starting level
  // development report: breakouts, stalls, late bloomers, slides and declines (visible outcomes of the hidden paths)
  { const all = active(L).filter(p => !p.prospect && delta[p.id] != null && (p.team != null || p.ovr >= 55));
    const by = (f, s) => all.filter(f).sort(s).slice(0, 10).map(p => [p.id, delta[p.id]]);
    summary.dev = {
      breakouts: by(p => p.age <= 26 && delta[p.id] >= 5, (a, b) => delta[b.id] - delta[a.id]),
      stalled: by(p => p.age <= 24 && delta[p.id] <= 0 && p.pot - p.ovr >= 6, (a, b) => (b.pot - b.ovr) - (a.pot - a.ovr)),
      bloomers: by(p => p.age >= 23 && p.age <= 28 && delta[p.id] >= 4 && (p.bloom || !p.draft || p.draft.rd === 2), (a, b) => delta[b.id] - delta[a.id]),
      slides: by(p => p.age <= 26 && delta[p.id] <= -2, (a, b) => delta[a.id] - delta[b.id]),
      declines: by(p => p.age >= 29 && delta[p.id] <= -3, (a, b) => delta[a.id] - delta[b.id]) };
    summary.typeMoves = summary.typeMoves.sort((a, b) => (L.players[b[0]].ovr) - (L.players[a[0]].ovr)).slice(0, 14); }
  summary.up.sort((a, b) => b[1] - a[1]);
  summary.mine = L.user != null ? summary.up.filter(([id]) => L.players[id] && L.players[id].team === L.user) : [];
  summary.down = summary.up.slice(-8).reverse(); summary.up = summary.up.slice(0, 8);
  for (const p of active(L)) {
    if (p.prospect || p.abroad) continue;   // v31: players abroad retire only by abroadOffseason
    let why = null;
    if (p.careerEnd) why = 'career-ending injury';
    else if (p.tour === L.season) why = 'farewell tour';
    else if (R() < retireChance(L, p)) why = p.age <= 30 ? 'retired early' : 'age';
    if (why) {
      const played = p.real || p.hist.some(h => h.rs && h.rs.gp > 0);   // v27 N8: real players keep their real career even with no sim games
      const tm = retirePlayer(L, p, why);
      if (played) { summary.retired.push(p.id); honorRetired(L, p); if (p.svc >= 3 || p.ovr >= 65 || why !== 'age') logNews(L, flL(L, 'news.retire', { name: p.name, tm: tm ? ' (' + tm + ')' : '', age: p.age, inj: why === 'career-ending injury' ? ' after a career-ending injury' : '' }), null, 'tx'); }
      else delete L.players[p.id];
    }
  }
  updateScouting(L);
  rescoutProspects(L);
  summary.coaches = coachOffseason(L);
  scoutOffseason(L);
  for (const k in L.h2h) L.h2h[k].heat = r1(Math.max(L.h2h[k].base, L.h2h[k].heat * 0.85));
  computeMarket(L);
  try { abroadOffseason(L); } catch (e) { console.error('abroadOffseason', e); }   // v31: before free agency, players abroad who are good enough return to L.fa
  const top = mockOrder(L, S)[0];
  if (top) logNews(L, `Mock draft: ${top.name} (${posLabel(top)}, ${NAT_NAME[top.nat]}) projects as the #1 pick`, null, 'draft');
  try { const H = L.history.find(h => h.s === S), rc = seasonRecap(L, S); if (H && rc) { H.recap = rc; logNews(L, 'Season recap: ' + rc, null, 'league'); } } catch (e) { }   // v28.4 F4
  L.offSummary = summary;
  yearbookFinish(L, delta);
  L.phase = 'off-review';
}
// ---------- Yearbook: each team's season story, with how it compared to the preseason prediction ----------
function yearbookStart(L) {
  const S = L.season, H = L.history.find(h => h.s === S); if (!H) return;
  const yb = (L.yearbook = L.yearbook || {})[S] = {};
  const order = H.standings.map(s => s.tid);
  for (const t of L.teams) {
    const st = H.standings.find(s => s.tid === t.id), finish = order.indexOf(t.id) + 1, po = poResult(L, t.id);
    const games = L.games.filter(g => !g.playoff && (g.home === t.id || g.away === t.id));
    const margin = g => (g.home === t.id ? g.hs - g.as : g.as - g.hs);
    const best = games.slice().sort((a, b) => margin(b) - margin(a)).slice(0, 2).map(g => `Beat ${L.teams[g.home === t.id ? g.away : g.home].abbr} by ${margin(g)} (${Math.max(g.hs, g.as)}-${Math.min(g.hs, g.as)})`);
    let top = null; for (const g of games) for (const r of g.box) { const p = L.players[r[0]]; if (p && p.team === t.id && (!top || r[3] > top.pts)) top = { pid: r[0], pts: r[3], opp: L.teams[g.home === t.id ? g.away : g.home].abbr }; }
    if (top && L.players[top.pid]) best.push(`${L.players[top.pid].name} scored ${top.pts} vs ${top.opp}`);
    const moves = L.log.filter(x => x.season === S && x.tid === t.id && (x.cat === 'trade' || x.cat === 'tx') && !/declined|chose not/.test(x.text)).slice(0, 4).map(x => x.text);
    const A = L.awards[S] || {}, aw = [];
    for (const [k, n] of [['mvp', 'MVP'], ['dpoy', 'Defensive POY'], ['roy', 'Rookie of the Year'], ['smoy', 'Sixth Man'], ['mip', 'Most Improved'], ['fmvp', 'Finals MVP']]) { const id = A[k]; if (id != null && L.players[id] && L.players[id].team === t.id) aw.push(`${n}: ${L.players[id].name}`); }
    if (A.coy != null && t.coach.id === A.coy) aw.push(`Coach of the Year: ${t.coach.name}`);
    const as = L.allStarHist && L.allStarHist[S] ? ['North', 'South'].flatMap(c => [...L.allStarHist[S].rosters[c].starters, ...L.allStarHist[S].rosters[c].reserves]).filter(id => L.players[id] && L.players[id].team === t.id) : [];
    const exp = t.expRank || null, diff = exp ? exp - finish : 0;
    const story = po === 'Champion' ? (exp && exp > 4 ? `Picked ${ordinal(exp)}, won it all: one of the great surprises` : 'Champions') : po === 'Lost in Finals' ? 'A run to the Finals' :
      diff >= 5 ? `Picked ${ordinal(exp)}, finished ${ordinal(finish)}: the surprise of the season` : diff <= -5 ? `Picked ${ordinal(exp)}, finished ${ordinal(finish)}: a season to forget` :
      /conference finals/.test(po) ? 'A conference finals run' : /Missed/.test(po) ? (t.mode === 'tank' || t.mode === 'rebuild' ? 'A building year' : 'Missed the playoffs') : 'Made the playoffs, fell short';
    yb[t.id] = { w: st ? st.w : t.w, l: st ? st.l : t.l, finish, exp, po, story, best, moves, awards: aw, allStars: as, coach: t.coach.name };
  }
}
function yearbookFinish(L, delta) {
  const S = L.season, yb = L.yearbook && L.yearbook[S]; if (!yb) return;
  for (const t of L.teams) { const e = yb[t.id]; if (!e) continue; const ps = rosterOf(L, t).filter(p => delta[p.id] != null);
    e.up = ps.filter(p => delta[p.id] >= 3).sort((a, b) => delta[b.id] - delta[a.id]).slice(0, 3).map(p => [p.id, delta[p.id]]);
    e.down = ps.filter(p => delta[p.id] <= -3).sort((a, b) => delta[a.id] - delta[b.id]).slice(0, 3).map(p => [p.id, delta[p.id]]);
    e.traits = trYearbook(L, t, S); }   // v25.9: trait changes this season
  // keep the last 30 seasons
  const ks = Object.keys(L.yearbook).map(Number).sort((a, b) => a - b); while (ks.length > 30) delete L.yearbook[ks.shift()];
}
function ordinal(n) { const s = ['th', 'st', 'nd', 'rd'], v = n % 100; return n + (s[(v - 20) % 10] || s[v] || s[0]); }
// Step 2: lottery
function runLottery(L) {
  processPending(L);
  const S = L.season;
  const hist = L.history.find(h => h.s === S);
  const rows = hist.standings; // best to worst overall
  const worstFirst = rows.slice().reverse();
  const D = poDirect(L), P = poPlayinTo(L);
  const nonPO = worstFirst.filter(r => r.confSeed > P).map(r => r.tid);   // 6 teams (16-team league) or 10 (30 teams)
  const playIn = worstFirst.filter(r => r.confSeed > D && r.confSeed <= P).map(r => r.tid);
  const po = worstFirst.filter(r => r.confSeed <= D).map(r => r.tid);
  const draw = (teams, odds) => { const out = []; let ts = teams.slice(), os = odds.slice(); while (ts.length) { const t = wpick(ts, os); const i = ts.indexOf(t); out.push(t); ts.splice(i, 1); os.splice(i, 1); } return out; };
  // long-suffering teams (4+ seasons without the playoffs) get a small boost in the lottery
  let r1order, lotTeams = null;
  if (isBig(L)) {
    // v22 (30 teams): the 14 teams that missed the playoffs (10 non-playoff teams and the 4 play-in losers) are in the lottery, worst record first,
    // with NBA odds. All 14 lottery picks are drawn. The 16 playoff teams pick 15-30 by record.
    const fr = (hist.playoffs || []).find(r => r.stage === 'First round'), made = new Set(fr ? fr.series.flatMap(x => [x.hi, x.lo]) : []);
    lotTeams = worstFirst.filter(r => !made.has(r.tid)).map(r => r.tid).slice(0, 14);
    const NBA = [14, 14, 14, 12.5, 10.5, 9, 7.5, 6, 4.5, 3, 2, 1.5, 1, 0.5];
    r1order = [...draw(lotTeams, NBA.slice(0, lotTeams.length)), ...worstFirst.map(r => r.tid).filter(id => !lotTeams.includes(id))];
  } else {
    const lotN = 5, odds = [25, 25, 25, 15, 10];
    const lot1 = draw(nonPO.slice(0, lotN), odds.map((o, i) => o + ((L.teams[nonPO[i]] || {}).drought >= 4 ? 5 : 0)));
    r1order = [...lot1, ...nonPO.slice(lotN), ...draw(playIn, playIn.map(() => 25)), ...po];
  }
  const r2order = worstFirst.map(r => r.tid);
  resolveProtections(L, r1order);   // v25.7 S6
  resolveSwaps(L, r1order);   // v26.2
  L.draftOrder = [];
  r1order.forEach((orig, i) => { const k = L.picks.find(x => x.s === S && x.rd === 1 && x.orig === orig); L.draftOrder.push({ rd: 1, no: i + 1, orig, owner: k.owner, pid: null, lottery: lotTeams ? lotTeams.includes(orig) : undefined, preRank: lotTeams ? (lotTeams.includes(orig) ? lotTeams.indexOf(orig) + 1 : null) : nonPO.includes(orig) ? nonPO.indexOf(orig) + 1 : null, group: lotTeams ? (lotTeams.includes(orig) ? 'lottery' : 'playoff') : nonPO.includes(orig) ? 'lottery' : playIn.includes(orig) ? 'play-in' : 'playoff' }); });
  r2order.forEach((orig, i) => { const k = L.picks.find(x => x.s === S && x.rd === 2 && x.orig === orig); L.draftOrder.push({ rd: 2, no: i + 1, orig, owner: k.owner, pid: null }); });
  L.draftIdx = 0;
  const d0 = L.draftOrder[0];
  logNews(L, `Draft lottery: ${L.teams[d0.owner].abbr} win the #1 pick${d0.owner !== d0.orig ? ' (via ' + L.teams[d0.orig].abbr + ')' : ''}${d0.preRank > 1 ? ', jumping from the #' + d0.preRank + ' spot' : ''}`, d0.owner, 'draft');
  L.phase = 'off-lottery';
  try { if (typeof runCombine === 'function') runCombine(L, S); } catch (e) { console.error('combine', e); }   // draft combine (combine.js)
}
// v27: NBA 2026-27 first-round scale (year 1, 120% of scale as signed), interpolated
const NBA_RSCALE = [[1, 14.75], [2, 13.2], [3, 11.85], [4, 10.65], [5, 9.6], [6, 8.7], [7, 8.0], [10, 6.4], [12, 5.8], [16, 4.7], [20, 3.9], [22, 3.6], [26, 3.08], [30, 2.93]];
function rookieScale(rd, no, n) {
  if (NBA_ON) { if (rd !== 1) return MINSAL; const q = NBA_RSCALE; for (let i = 1; i < q.length; i++) if (no <= q[i][0]) return r1(q[i - 1][1] + (q[i][1] - q[i - 1][1]) * (no - q[i - 1][0]) / (q[i][0] - q[i - 1][0])); return 2.93; }
  return rd === 1 ? r1(9 - (no - 1) * (6.5 / ((n || 16) - 1))) : MINSAL; }
function draftPlayer(L, pid) {
  const slot = L.draftOrder[L.draftIdx]; if (!slot) return;
  const p = L.players[pid];
  // mock rank as of the start of the draft (not among the players still left)
  const mock = (L.mockRank && L.mockRank[pid]) || mockOrder(L, L.season).findIndex(x => x.id === pid) + 1;
  { const sc = L.teams[slot.owner].scout; if (sc) (sc.calls = sc.calls || []).push({ pid, s: L.season, tid: slot.owner, est: teamPotEst(L, slot.owner, p).est, ovr: p.ovr, pick: slot.rd + '-' + slot.no, mock }); }
  p.prospect = false; p.unrev = true; setCeil(p); L.classes[L.season] = (L.classes[L.season] || []).filter(id => id !== pid);
  p.draftTid = slot.owner; p.draft = { s: L.season, rd: slot.rd, no: slot.no, tid: slot.owner, mock };
  if (L.mockRanks) p.draft.mo = L.mockRanks.map(r => r[pid] || null); if (L.boardRank && L.boardRank[pid]) p.draft.ub = L.boardRank[pid]; p.rookieSeason = L.season + 1;   // v34: draft.mo / draft.ub for the accuracy report
  if (slot.rd === 1 && slot.no <= 5) hypeBump(L.teams[slot.owner], 6 - slot.no * 0.6);   // v22: a top-5 pick gets the fans excited
  slot.pid = pid;
  p.tx.push({ s: L.season, t: `Drafted ${slot.rd === 1 ? '1st' : '2nd'} round, pick ${slot.no} by ${L.teams[slot.owner].abbr}` });
  const t = L.teams[slot.owner];
  if (t.id === L.user) { L.r2Pending = L.r2Pending || []; L.r2Pending.push(p.id); p.draftRights = t.id; }
  else if (slot.rd === 1) {
    // rare: a full roster passes on a late, low-upside first-rounder
    if (slot.no >= 10 && t.roster.length >= 15 && p.scout < 60 && R() < 0.35) { p.tx.push({ s: L.season, t: `${t.abbr} chose not to sign him` }); L.fa.push(p.id); setAsk(L, p); logNews(L, `${t.abbr} passed on signing first-round pick ${p.name}`, t.id, 'draft'); }
    else if (payroll(L, t) + rookieScale(1, slot.no, L.teams.length) > APRON || !futFits(L, t, rookieScale(1, slot.no, L.teams.length))) { p.tx.push({ s: L.season, t: `${t.abbr} couldn't fit his rookie deal under the hard cap` }); L.fa.push(p.id); setAsk(L, p); logNews(L, `${t.abbr} couldn't fit first-round pick ${p.name} under the ${money(APRON)} hard cap; he's a free agent`, t.id, 'draft'); }
    else signContract(L, p, slot.owner, rookieScale(1, slot.no, L.teams.length), 3, 'rookie', null);
  }
  else {
    {
      const signCount = (L.draftOrder || []).filter(o => o.rd === 2 && o.owner === t.id && o.pid && L.players[o.pid].team === t.id).length;
      const keep = t.roster.length + signCount < 16 && (p.scout >= 62 || p.ovr >= 50 || t.mode === 'tank' || t.mode === 'rebuild');
      if (keep) signSecondRounder(L, p, t.id);
      else if ((p.age <= 22 || p.scout >= 58) && !signTwoWay(L, p, t.id, true)) { logNews(L, `${t.abbr} gave second-round pick ${p.name} a two-way deal`, t.id, 'draft'); }   // v25.7
      else { p.tx.push({ s: L.season, t: `${t.abbr} chose not to sign him` }); L.fa.push(p.id); setAsk(L, p); }
    }
  }
  L.draftIdx++;
  if (slot.rd === 1 && (slot.no <= 3 || mock - slot.no >= 6)) logNews(L, `#${slot.no} pick: ${L.teams[slot.owner].abbr} select ${p.name} (${posLabel(p)}, ${p.age})${mock - slot.no >= 6 ? ' — a reach, he was mocked at #' + mock : ''}`, slot.owner, 'draft');
  L.offers = (L.offers || []).filter(o => !o.draft);
  if (L.draftIdx >= L.draftOrder.length) finishDraft(L);
  else if (L.draftOrder[L.draftIdx].owner === L.user) offersForUserPick(L);
}
function aiDraftPick(L) {
  if (L.draftOrder[L.draftIdx].owner !== L.user) draftTrades(L);
  const slot = L.draftOrder[L.draftIdx];
  const best = draftBoard(L, slot.owner, L.season)[0];
  draftPlayer(L, best.id);
}
// Draft grades the day after: each pick against the consensus mock (positive = value, negative = reach)
function draftGrades(L) {
  const order = (L.draftOrder || []).filter(o => o.pid != null), S = L.season;
  const picks = order.map((o, i) => { const mk = (L.mockRank || {})[o.pid] || order.length + 10; return { tid: o.owner, pid: o.pid, slot: i + 1, rd: o.rd, mock: mk, v: (i + 1) - mk }; });
  const teams = {};
  for (const t of L.teams) {
    const mine = picks.filter(x => x.tid === t.id); if (!mine.length) continue;
    const w = mine.reduce((a, x) => a + clamp(x.v, -15, 15) * (x.rd === 1 ? 1 : 0.4), 0) / Math.max(1, mine.reduce((a, x) => a + (x.rd === 1 ? 1 : 0.4), 0));
    teams[t.id] = { g: w >= 5 ? 'A' : w >= 2.5 ? 'B+' : w >= 0.5 ? 'B' : w >= -1.5 ? 'C+' : w >= -4 ? 'C' : w >= -7 ? 'D' : 'F', v: r1(w), n: mine.length };
  }
  const steals = picks.filter(x => x.mock <= 24 && x.v >= 4).sort((a, b) => b.v - a.v).slice(0, 3);
  const reaches = picks.filter(x => x.rd === 1 && x.v <= -5).sort((a, b) => a.v - b.v).slice(0, 3);
  (L.draftGrades = L.draftGrades || {})[S] = { teams, steals, reaches };
  const best = Object.entries(teams).sort((a, b) => b[1].v - a[1].v)[0];
  if (best) logNews(L, `Draft grades are in: ${L.teams[best[0]].abbr} get the top mark (${best[1].g})${steals[0] ? `; biggest steal: ${L.players[steals[0].pid].name} at #${steals[0].slot} (mocked #${steals[0].mock})` : ''}`, null, 'draft');
}
// ---------- Offseason events ----------
// Summer league: rookies, two-way players and young players (22 and under) play 5 games. A strong showing can add a point.
function summerLeague(L) {
  const S = L.season, lines = [];
  for (const t of L.teams) {
    const ps = [...rosterOf(L, t), ...twOf(L, t)].filter(p => p.age <= 22 || (p.draft && p.draft.s === S) || p.tw).sort((a, b) => b.ovr - a.ovr).slice(0, 8);
    for (const p of ps) {
      let pts = 0, reb = 0, ast = 0;
      for (let g = 0; g < 5; g++) { const lvl = clamp((p.ovr - 38) / 20, 0, 1.8); pts += Math.max(0, Math.round(gauss(7 + lvl * 9, 5))); reb += Math.max(0, Math.round(gauss(2 + ((p.drb || 40) + (p.orb || 40)) / 40 + (p.hgt - 76) * 0.3, 2))); ast += Math.max(0, Math.round(gauss(0.5 + (p.pas || 40) / 17, 1.5))); }
      const gs = (pts + reb * 0.7 + ast * 0.7) / 5;
      lines.push({ pid: p.id, tid: t.id, pts: pts / 5, reb: reb / 5, ast: ast / 5, gs });
    }
  }
  lines.sort((a, b) => b.gs - a.gs);
  for (const x of lines.slice(0, 12)) { const p = L.players[x.pid]; if (R() < 0.35) { for (const k of ['fin', 'mid', 'tp', 'hnd', 'pas', 'per', 'iq'].sort(() => R() - 0.5).slice(0, 2)) p[k] = Math.min(99, p[k] + 1); p.ovr = ovr(p); x.boost = true; } }
  for (const x of lines) { const r = lines.indexOf(x); x.note = r < 10 ? 'Looked ready' : x.gs < 10 ? 'Needs time' : 'Solid'; }
  const mvp = lines[0];
  L.summer = { s: S, lines, mvp: mvp ? mvp.pid : null };
  if (mvp) logNews(L, `Summer league MVP: ${L.players[mvp.pid].name} (${L.teams[mvp.tid].abbr}), ${f1n(mvp.pts)} pts, ${f1n(mvp.reb)} reb, ${f1n(mvp.ast)} ast`, mvp.tid, 'draft');
}
// International tournament every 4 years: the 8 strongest countries, quarterfinals to a final
function intlTournament(L) {
  const S = L.season; if (S % 4 !== 0) return;
  const by = {}; for (const p of active(L).filter(p => !p.prospect && p.team != null)) (by[p.nat] = by[p.nat] || []).push(p);
  const teams = Object.entries(by).map(([nat, ps]) => { const top = ps.sort((a, b) => b.ovr - a.ovr).slice(0, 10); return { nat, top, str: top.slice(0, 8).reduce((a, p) => a + p.ovr, 0) / Math.max(1, Math.min(8, top.length)) - (top.length < 8 ? (8 - top.length) * 2.5 : 0) }; }).filter(x => x.top.length >= 5).sort((a, b) => b.str - a.str).slice(0, 8);
  if (teams.length < 4) return;
  const play = (a, b) => { const d = a.str - b.str + gauss(0, 4); return d >= 0 ? a : b; };
  let round = teams.slice(), res = [];
  if (round.length === 8) { const qf = [[0, 7], [3, 4], [1, 6], [2, 5]].map(([i, j]) => ({ a: round[i], b: round[j], w: play(round[i], round[j]) })); res.push({ r: 'Quarterfinals', g: qf }); round = qf.map(x => x.w); }
  else round = round.slice(0, 4);
  const sf = [[0, 1], [2, 3]].map(([i, j]) => ({ a: round[i], b: round[j], w: play(round[i], round[j]) })); res.push({ r: 'Semifinals', g: sf });
  const fin = { a: sf[0].w, b: sf[1].w }; fin.w = play(fin.a, fin.b); res.push({ r: 'Final', g: [fin] });
  const champ = fin.w, mvp = champ.top[0];
  for (const p of champ.top) { p.fameBase = (p.fameBase || 0) + 5; p.awards.push({ s: S, a: 'International champion' }); }
  const hurt = [];
  for (const t of teams) for (const p of t.top) if (R() < 0.02) { p.injury = Math.max(p.injury, rint(30, 40)); p.injName = 'Ankle sprain (international play)'; hurt.push(p.id); }
  L.intl = { s: S, rounds: res.map(r => ({ r: r.r, g: r.g.map(x => ({ a: x.a.nat, b: x.b.nat, w: x.w.nat })) })), champ: champ.nat, mvp: mvp.id, hurt, rosters: Object.fromEntries(teams.map(t => [t.nat, t.top.map(p => p.id)])) };
  logNews(L, `International tournament: ${NAT_NAME[champ.nat] || champ.nat} win the title; MVP ${mvp.name}${hurt.length ? `. Injured: ${hurt.map(id => L.players[id].name).join(', ')}` : ''}`, null, 'league');
}
function finishDraft(L) {
  try { draftGrades(L); } catch (e) { }
  try { intlTournament(L); } catch (e) { }   // v15: summer league moved into free agency (day 5)
  for (const id of L.classes[L.season] || []) { const p = L.players[id]; p.prospect = false; p.unrev = true; setCeil(p); p.rookieSeason = L.season + 1; p.tx.push({ s: L.season, t: 'Went undrafted' }); L.fa.push(id); }
  try { pipeAfterDraft(L, (L.classes[L.season] || []).slice()); } catch (e) { }   // v29 P9: undrafted keep their last line only
  delete L.classes[L.season];
  genClass(L, L.season + 4);   // v29 P1: 4 drafts ahead (was +3)
  computeMarket(L);
  for (const id of L.fa) { const p = L.players[id]; if (p.ask == null || isNaN(p.ask)) setAsk(L, p); }
  startResign(L);
}
function startDraft(L) { processPending(L); L.phase = 'off-draft'; try { ivTrigger(L, 'draft'); } catch (e) { } L.mockRank = {}; const ms = mockSet(L, L.season); ms.cons.forEach((id, i) => L.mockRank[id] = i + 1); L.mockRanks = ms.ranks.map(r => Object.assign({}, r)); L.boardRank = null; if (L.user != null && L.teams[L.user]) { try { L.boardRank = {}; draftBoard(L, L.user, L.season).forEach((p, i) => L.boardRank[p.id] = i + 1); } catch (e) { L.boardRank = null; } } }
function signSecondRounder(L, p, tid) { p.draftRights = null; if (p.draft && p.draft.rd === 1) signContract(L, p, tid, rookieScale(1, p.draft.no, L.teams.length), 3, 'rookie', null); else signContract(L, p, tid, MINSAL, 2, 'rookie', 'TO'); }
function decideSecondRounder(L, pid, sign) {
  const p = L.players[pid]; if (!p) return 'Player not found.';
  if (sign === 'tw') {   // v25.7: two-way choice for a 2nd-rounder
    if (!(p.draft && p.draft.rd === 2)) return 'Only second-round picks can take a two-way deal.';
    const err = signTwoWay(L, p, L.user, true); if (err) return err.startsWith('Both') ? 'Both two-way slots are full. Release a two-way player first, or choose another option.' : err;
    L.r2Pending = (L.r2Pending || []).filter(id => id !== pid); return null;
  }
  if (sign && L.teams[L.user].roster.length >= 17) return 'Your roster is too full. Release someone first.';
  L.r2Pending = (L.r2Pending || []).filter(id => id !== pid);
  if (sign && p.draft && p.draft.rd === 1 && (payroll(L, L.teams[L.user]) + rookieScale(1, p.draft.no, L.teams.length) > APRON || !futFits(L, L.teams[L.user], rookieScale(1, p.draft.no, L.teams.length)))) { L.r2Pending.push(pid); return `His rookie deal (${money(rookieScale(1, p.draft.no, L.teams.length))}) would put you over the ${money(APRON)} hard cap. Clear room first.`; }
  if (sign) signSecondRounder(L, p, L.user);
  else { p.draftRights = null; p.tx.push({ s: L.season, t: `${L.teams[L.user].abbr} chose not to sign him` }); L.fa.push(p.id); setAsk(L, p); }
  return null;
}
// Step 4: re-sign phase. AI decides now; the user's players wait for the user.
function startResign(L) {
  const S = L.season;
  L.resign = []; L.teamOptions = [];
  L.optSum = { s: S, po: [], shown: false };
  etoDecide(L);   // v26.1: early opt-outs   // v23: your players' option outcomes, shown with your team-option decisions in one popup
  // 1) options on contracts whose final (option) year is next season
  for (const t of L.teams) for (const p of rosterOf(L, t)) {
    const c = p.contract; if (!c || !c.opt || c.exp !== S + 1) continue;
    if (c.opt === 'PO') {
      if (L.user != null && t.id === L.user) L.optSum.po.push({ id: p.id, amt: c.amt, mval: p.mval, out: p.mval > c.amt * 1.1 && p.age <= 31 });
      if (p.mval > c.amt * 1.1 && p.age <= 31) { c.exp = S; c.opt = null; p.tx.push({ s: S, t: `Declined his player option with ${t.abbr}` }); logNews(L, `${p.name} declined his ${money(c.amt)} player option with ${t.abbr}`, t.id, 'tx'); }
      else { c.opt = null; p.tx.push({ s: S, t: `Picked up his player option with ${t.abbr}` }); }
    } else if (c.opt === 'TO') {
      if (t.id === L.user) { L.teamOptions.push(p.id); continue; }
      const want = rotationOf(L, t).some(x => x.id === p.id) || (p.age <= 24 && p.scout >= 72);
      if (want && (p.mval >= c.amt * 0.8 || c.amt <= MINSAL) && (c.amt <= MINSAL || payNoFloor(L, t, S + 1) <= APRON + 1e-6)) { c.opt = null;   // v32h: not if it leaves the team over the hard cap
         p.tx.push({ s: S, t: `${t.abbr} exercised his team option` }); }
      else { c.exp = S; c.opt = null; p.tx.push({ s: S, t: `${t.abbr} declined his team option` }); logNews(L, `${t.abbr} declined ${p.name}'s ${money(c.amt)} team option`, t.id, 'tx'); }
    }
  }
  // 2) in-season extensions kick in
  for (const t of L.teams) for (const p of rosterOf(L, t)) if (p.ext && p.contract && p.contract.exp <= S) { const x = p.ext; p.ext = null; signContract(L, p, t.id, x.amt, x.yrs, 'extension', x.opt, x.x || { inc: 0 }); }
  // 3) expiring contracts: AI decides now; the user's players wait for the user
  for (const t of L.teams) {
    const exp = rosterOf(L, t).filter(p => p.contract && p.contract.exp <= S);
    for (const p of exp) {
      if (p.bet && p.bet.s === S) { const won = superOK(L, p); if (p.ovr >= 70) logNews(L, won ? `${p.name} bet on himself and won: he's eligible for the supermax with ${t.abbr}` : p.mval < maxFor(p) * 0.85 ? `${p.name} bet on himself and lost: no award, and his market value is ${money(p.mval)}` : `${p.name} bet on himself: no award, but he'll still be paid well (value ${money(p.mval)})`, t.id, 'tx'); p.bet = null; }
      setAsk(L, p); p.ask = Math.min(maxForTeam(L, p, t.id), r1(Math.max(MINSAL, p.ask * loyDisc(p)))); if (p.ask < 1.5) p.ask = MINSAL;
      if (p.career && L.career && L.career.testFA === S) { p.tx.push({ s: S, t: `Tested free agency (left ${t.abbr})` }); toFA(L, p); continue; }   // My Career
      if (t.id === L.user) { L.resign.push(p.id); continue; }
      const icon = iconTier(L, p, t.id);   // v27 L2: a franchise icon is kept, whatever the plan
      const rs = resignDecide(L, t, p, icon);   // v32e: team side (wants him, pays) + player side (several reasons to leave), all chances
      const want = rs.want, leaves = !!rs.leave;
      let offer = Math.min(maxForTeam(L, p, t.id), (superOK(L, p) ? Math.max(p.mval, p.mvalRaw || 0) : p.mval) * Math.max(needMult(L, t, p), demPay(p)) * (p.age >= 30 ? Math.max(0.85, 1 - 0.03 * (p.age - 29)) : 1) * modeSpend(t, p) * wetPay(p) * (t.mode === 'contend' && p.ovr >= 70 ? 1.08 : 1));
      const hg = p.draftTid === t.id && p.ask >= 10;
      if (icon) offer = Math.max(offer, p.ask);
      let keep = icon && p.age >= 33 ? Math.max(MINSAL, Math.min(p.ask, r1(p.mval * 1.05))) : t.mode === 'contend' && p.ovr >= 78 ? Math.min(maxForTeam(L, p, t.id), r1(Math.max(p.ask, Math.min(p.ask * 1.2, p.mval * 1.1)))) : p.ovr >= RESIGN_K.valOvr ? Math.min(maxForTeam(L, p, t.id), r1(Math.max(p.ask, p.mval * RESIGN_K.val))) : p.ask;   // v36a: Bird-rights price: a 60+ player re-signs at his market value (asks ran ~15% under: 60-64 $13.3M vs $15.6M)   // v18: premium only for stars, capped near value   // contenders pay a premium to keep their core
      const iconStay = icon >= 1 && p.ovr >= 58 && !(p.morale != null && p.morale < 25) && !(rs.leave && R() < 0.5) && (icon === 2 || R() < 0.75);   // v27 L2: an icon re-signs (Bird rights, owner signs off); v32e: sometimes even an icon leaves
      const fitsAt = k => (canFit(L, t, k, hg, 're-sign') || k <= MINSAL) && (ownerOK(L, t, k) || resignOwnerOK(L, t, p, k)), pays = offer >= p.ask * rs.pay;
      let fits = fitsAt(keep); if (!fits && keep > p.ask + 0.05 && fitsAt(p.ask)) { keep = p.ask; fits = true; }   // v36a: value doesn't fit (cap / owner): his ask still may
      if (!fits && want && !rs.leave && p.ovr >= 60 && !icon) { const room = r1(Math.min(APRON - payroll(L, t), futRoom(L, t))); if (room >= p.ask * RESIGN_K.disc && room > MINSAL && fitsAt(room)) { keep = room; fits = true; p.tx.push({ s: S, t: `Took a discount to stay with ${t.abbr} (hard cap)` }); if (!L.resignLog || L.resignLog.s !== S) L.resignLog = { s: S, n: 0, kept: 0, out: {}, o60: { n: 0, kept: 0 } }; const o6 = L.resignLog.o60 = L.resignLog.o60 || { n: 0, kept: 0 }; o6.discStay = (o6.discStay || 0) + 1; } }   // v36e: counted even for the season's first re-sign   // v36a part 3: a wanted 60+ player takes a discount (RESIGN_K.disc, 25% since v36e) to stay when the hard cap is the problem (60+ lost on cap / owner: 118 in 20 seasons)
      if (!fits && want && !rs.leave && pays && p.ovr >= 60 && !icon && CAP_CLEAR.on) { const k = capClear(L, t, p, [keep, p.ask, r1(p.ask * RESIGN_K.disc)], hg, fitsAt); if (k) { keep = k; fits = true; } }   // v36d: at the hard cap, move a bench contract to make room first
      // v32h: an icon re-signs under the hard cap too (a hometown discount of up to 25% if needed); if even that won't fit, he leaves
      let iconOk = iconStay && fits;
      if (iconStay && !fits) { const room = r1(Math.min(APRON - payroll(L, t), futRoom(L, t))); if (room >= Math.max(MINSAL, keep * 0.75) && ownerOK(L, t, room)) { keep = room; iconOk = true; } }
      const out = iconOk ? null : iconStay ? 't:cap' : rs.leave ? 'p:' + rs.leave : !want ? 't:team' : !pays ? 't:price' : !fits ? 't:cap' : null;
      resignLog(L, p, out);
      if (out === 't:cap' && p.ovr >= 60 && L.resignLog && L.resignLog.o60) { const o = L.resignLog.o60, k = iconStay ? 'capIcon' : !(canFit(L, t, p.ask, hg, 're-sign') || p.ask <= MINSAL) ? 'capHard' : 'capOwner'; o[k] = (o[k] || 0) + 1; }   // v36a: why the cap / owner said no (counted apart from the t:* reasons)
      if (iconOk) signContract(L, p, t.id, keep, Math.min(yrsFor(p, keep), p.age >= 34 ? 1 : p.age >= 31 ? 2 : 4), 're-sign');
      else if (!out) signContract(L, p, t.id, keep, yrsFor(p, keep), 're-sign');
      else if (rs.leave) { p.tx.push({ s: S, t: `Turned down ${t.abbr}: ${RESIGN_WHY[rs.leave]}` }); if (rs.leave === 'win') p.tx.push({ s: S, t: `Wants to join a contender` }); if (p.ovr >= 68) logNews(L, flL(L, 'news.leave', { name: p.name, team: t.abbr, why: RESIGN_WHY[rs.leave] }), t.id, 'tx', 'walk'); }
      else {
        // a good player on his way out: sometimes the team works a sign-and-trade instead of losing him for nothing
        if (p.ovr >= 65 && R() < 0.25 * 16 / L.teams.length) { const ofs = sntOffers(L, p.id)   /* v21: same league-wide volume with more teams */.filter(o => o.a !== L.user); if (ofs.length && !typeFull(L, tradeType(ofs[0].aGive, ofs[0].bGive)) && rosterFits(L, ofs[0].a, p.team, ofs[0].aGive, ofs[0].bGive)) { if (typeof doSignAndTrade(L, ofs[0]) !== 'string') continue; } }
        if ((p.morale != null && p.morale < 40 && p.ovr >= 65) || (!want && p.ovr >= 66 && rotationOf(L, t).slice(0, 5).some(x => x.id === p.id))) addGrudge(L, p, t.id, 'leaving on bad terms');   // v17
        frictionRival(L, p, t.id);
        const wasRookie = p.contract && p.contract.type === 'rookie';
        p.tx.push({ s: S, t: `Contract with ${t.abbr} expired` }); toFA(L, p);
        if (wasRookie && p.ovr >= 60) { p.rfa = { tid: t.id, s: S, want: !!want }; p.tx.push({ s: S, t: `Restricted free agent (${t.abbr} can match offers)` }); }   // v18
      }
    }
  }
  L.phase = 'off-resign';
}
function decideTeamOption(L, pid, exercise) {
  const p = L.players[pid]; if (!p || !p.contract) return;
  L.teamOptions = (L.teamOptions || []).filter(id => id !== pid);
  if (exercise) { p.contract.opt = null; p.tx.push({ s: L.season, t: `${L.teams[p.team].abbr} exercised his team option` }); }
  else { p.contract.exp = L.season; p.contract.opt = null; p.tx.push({ s: L.season, t: `${L.teams[p.team].abbr} declined his team option` }); setAsk(L, p); L.resign.push(pid); }
}
// ---------- v16: mentors, personality changes, supermax ----------
const MENTOR_MAX = 2;
function mentorsOf(L, t) { return rosterOf(L, t).filter(p => p.pers === 'Mentor'); }
function youngTeam(L, t) { return t.mode === 'tank' || t.mode === 'rebuild' || rotationOf(L, t).filter(p => p.age <= 23).length >= 3; }
function wantsMentor(L, t) { return youngTeam(L, t) && mentorsOf(L, t).length < MENTOR_MAX; }
// veterans' priorities shift: some chase a ring, some want to mentor, a few want one last payday
function persEvolve(L) {
  for (const p of active(L)) {
    if (p.prospect || p.age < 30 || p.retired) continue;
    const ring = (p.awards || []).some(a => a.a === 'Champion'), was = p.pers; let to = null, why = '';
    // v25.9: ring-chasing and last-payday shifts now happen in the trait numbers (traitYear); only the mentor role is picked here
    if (p.pers !== 'Mentor' && p.age >= 30 && p.iq >= 50 && R() < 0.12) { to = 'Mentor'; why = 'wants to mentor young players'; }
    if (!to) continue;
    p.pers = to; p.tx.push({ s: L.season, t: `Personality: ${was} → ${to}` });
    if (p.ovr >= 60 || p.team === L.user) logNews(L, `${p.name}${p.team != null ? ` (${L.teams[p.team].abbr})` : ''} ${why} (now ${to === 'Winner' ? 'Wants to win' : to})`, p.team, 'tx');
  }
}
// supermax: an MVP in the last 3 seasons, or DPOY / All-League 1st Team in the last 2, unlocks one bigger contract.
// His current team can offer the next tier up; other teams can go halfway.
// v17 eligibility: MVP counts 3 seasons, DPOY 2, All-League 1st Team and All-Defense 1st Team 1
function superOK(L, p) { if (!p || p.superUsed) return false; const S = L.season; return (p.awards || []).some(a => (a.a === 'MVP' && S - a.s <= 2) || (a.a === 'Defensive Player of the Year' && S - a.s <= 1) || ((a.a === 'All-League 1st Team' || a.a === 'All-Defense 1st Team') && S - a.s <= 0)); }
// v17: award contenders bet on themselves: during the season they only extend at the max they can be paid now
const RACE_CACHE = new WeakMap();
function awardRace(L, p) {
  if (L.phase !== 'regular' || !p.stats || !p.stats.rs || p.stats.rs.gp < 15) return null;
  let c = RACE_CACHE.get(L); if (!c || c.day !== L.day || c.s !== L.season) { c = { day: L.day, s: L.season, m: new Map() }; try { awardLadder(L, 'mvp', 6).forEach((x, i) => c.m.set(x.pid, 'MVP race')); awardLadder(L, 'dpoy', 3).forEach(x => { if (!c.m.has(x.pid)) c.m.set(x.pid, 'DPOY race'); }); } catch (e) { } RACE_CACHE.set(L, c); }
  return c.m.get(p.id) || null;
}
function superTier(p) { const m = maxFor(p) / CAP; return m >= 0.35 - 1e-9 ? 0.38 : m >= 0.30 - 1e-9 ? 0.35 : 0.30; }
function ownTeamOf(p) { return p.team != null ? p.team : p.lastTeam; }
function maxForTeam(L, p, tid) {
  const base = maxFor(p); if (!superOK(L, p)) return base;
  const top = CAP * superTier(p); return r1(tid === ownTeamOf(p) ? top : (base + top) / 2);
}
// ---------- v17: grudges and player rivalries ----------
function gameSeason(L) { return L.phase === 'regular' || L.phase === 'playoffs' || L.phase === 'regular-done' ? L.season : L.season + 1; }
// v18: an unhappy player who lost minutes to a teammate at his spot sees that teammate as a rival when he leaves
function frictionRival(L, p, from) {
  if (!(p.morale != null && p.morale < 45) || p.ovr < 68) return;
  const q = rosterOf(L, L.teams[from]).filter(x => x.id !== p.id && pgrp(x) === pgrp(p) && x.ovr >= 70 && x.ovr >= p.ovr - 2).sort((x, y) => y.ovr - x.ovr)[0];
  if (q) addRival(L, p, q, 'took his minutes');
}
function addGrudge(L, p, tid, why) {
  if (!p || tid == null || p.retired) return;
  if ((p.grudge || []).some(g => g.tid === tid && g.perm)) return;   // v32a: a permanent grudge (Luka vs DAL) is never replaced by a 2-season one
  p.grudge = (p.grudge || []).filter(g => g.tid !== tid && g.until >= L.season);
  p.grudge.push({ tid, until: gameSeason(L) + 1, why, s: L.season });   // lasts at most 2 seasons
}
// v32a: a player on either roster holds a permanent grudge against the other team (Luka vs DAL): the game is tagged a rivalry game
function permGrudgeGame(L, a, b) { const has = (x, y) => rosterOf(L, L.teams[x]).some(p => (p.grudge || []).some(g => g.perm && g.tid === y)); return has(a, b) || has(b, a); }
function grudgeVs(L, p, tid) { return (p.grudge || []).find(g => g.tid === tid && g.until >= gameSeason(L)); }
// v19: draft-class rivals are their own kind, with their own cap; the regular cap is 8
const RIVAL_MAX = 8, DRAFT_RIVAL_MAX = 4;
function activeRivals(L, kind) { return (L.rivals || []).filter(r => r.until >= gameSeason(L) && L.players[r.a] && L.players[r.b] && !L.players[r.a].retired && !L.players[r.b].retired && (kind == null || (kind === 'draft') === (r.kind === 'draft'))); }
function rivalsOf(L, p) { return activeRivals(L).filter(r => r.a === p.id || r.b === p.id).sort((x, y) => (x.kind === 'draft') - (y.kind === 'draft')).map(r => ({ r, other: L.players[r.a === p.id ? r.b : r.a] })); }
function rivalOf(L, p) { return rivalsOf(L, p)[0] || null; }
function addRival(L, a, b, why, kind) {
  const all = activeRivals(L), ex = all.find(r => (r.a === a.id && r.b === b.id) || (r.a === b.id && r.b === a.id));
  if (ex) { ex.until = Math.max(ex.until, gameSeason(L) + 2); return; }
  const act = activeRivals(L, kind === 'draft' ? 'draft' : 'main');
  if (act.length >= (kind === 'draft' ? DRAFT_RIVAL_MAX : RIVAL_MAX) || act.some(r => [r.a, r.b].includes(a.id) || [r.a, r.b].includes(b.id))) return;
  (L.rivals = L.rivals || []).push({ a: a.id, b: b.id, since: gameSeason(L), until: gameSeason(L) + 2, why, w: {}, kind: kind === 'draft' ? 'draft' : undefined });
  logNews(L, `New ${kind === 'draft' ? 'draft-class ' : ''}rivalry: ${a.name} (${L.teams[a.team] ? L.teams[a.team].abbr : 'FA'}) vs ${b.name} (${L.teams[b.team] ? L.teams[b.team].abbr : 'FA'}): ${why}`, a.team === L.user ? a.team : b.team === L.user ? b.team : null, 'league');
}
const pgrp = p => p.pos <= 1 ? 'G' : p.pos <= 3 ? 'F' : 'C';
// rivalries start between prominent players: stars at the same spot who meet in the playoffs, or top players at the same spot in a conference
// v18: draft-class rivals: two top-5 picks of the same class at the same spot, once both are starters
function draftRivals(L) {
  const by = {};
  for (const p of active(L)) if (p.draft && p.draft.rd === 1 && p.draft.no <= 5 && p.team != null && rotationOf(L, L.teams[p.team]).slice(0, 5).some(x => x.id === p.id)) (by[p.draft.s] = by[p.draft.s] || []).push(p);
  for (const s in by) { const g = by[s]; for (const p of g) for (const q of g) if (p.id < q.id && p.team !== q.team && pgrp(p) === pgrp(q) && p.ovr >= 70 && q.ovr >= 70 && R() < 0.35) addRival(L, p, q, `top picks in the ${yrOf(+s)} draft`, 'draft'); }
}
const yrOf = s => 1999 + s;
// award races: winner vs runner-up (same spot)
function awardRivals(L, A) {
  for (const k of ['mvp', 'dpoy', 'roy']) { const lad = (A.ladder || {})[k] || []; const a = lad[0] && L.players[lad[0].pid], b = lad[1] && L.players[lad[1].pid]; if (a && b && a.team !== b.team && pgrp(a) === pgrp(b)) addRival(L, a, b, `${{ mvp: 'MVP', dpoy: 'DPOY', roy: 'Rookie of the Year' }[k]} race`); }
}
function seedRivals(L) {
  try { draftRivals(L); } catch (e) { }
  const h = L.history[L.history.length - 1];
  if (h && h.s === L.season) for (const rd of h.playoffs || []) for (const sr of rd.series || []) {
    const top = tid => rosterOf(L, L.teams[tid]).filter(p => p.ovr >= 72).sort((x, y) => y.ovr - x.ovr);
    const fin = /final/i.test(rd.stage || '') && rd === h.playoffs[h.playoffs.length - 1];
    for (const p of top(sr.hi)) { const q = top(sr.lo).find(x => pgrp(x) === pgrp(p)); if (q && (fin || R() < 0.7)) { addRival(L, p, q, `met in the ${rd.stage || 'playoffs'}`); break; } }
  }
  for (const c of [...new Set(L.teams.map(t => t.conf))]) {
    const stars = active(L).filter(p => p.team != null && L.teams[p.team].conf === c && p.ovr >= 78);
    for (const p of stars) for (const q of stars) if (p.id < q.id && p.team !== q.team && pgrp(p) === pgrp(q) && R() < 0.12) addRival(L, p, q, 'top players at the same spot');
  }
}
// v24.4: AI contract offers price in the revealed part of work ethic (about +/-4%, legendary +6%, lazy -6%); unrevealed counts as average
const WET_PAY = [-0.06, -0.04, 0, 0.04, 0.04, 0.06];
function wetPay(p) { if (p.wet == null) return 1; return 1 + WET_PAY[p.wet] * traitFrac(p, 'wet'); }
// v32e: AI re-signing. Teams keep most players they want (Bird rights let them pay a bit under his ask), but nothing is certain:
// TEAM side: a chance it wants him (rotation player ~90%, fringe ~35-60%, end of bench ~15%; less for vets on a rebuild, over the tax),
//   and how far below his ask it will go (each team-player pair 70-95%).
// PLAYER side: separate chances to leave, first one that hits wins: money (bigger market out there), winning (team losing),
//   role (wants more minutes), mood (unhappy), coach (poor fit), fresh start (anything else), win-first (older ringless star).
//   Loyalty cuts all of them.
// v34 A1: Bird-rights money stays: teams want more of their own 58+ players (was rot .92 / young .85 / top-10 .75 / 26- .6 / 60+ .3, tax x.75),
// players leave less often (x leave) and teams go a bit lower against the ask (pay: was .7-.95)
// v36d (item 5): before an AI team loses a wanted 60+ player to the hard cap, it trades away bench contracts (outside its top 9, not a two-way,
// not signed this season, above the minimum: minimum deals and waived deals free no cap room, a waived deal stays as dead money) to a
// team with cap room, then re-signs him at the first price in `prices` that fits (value, ask, stay discount). Expiring deals first, then
// the lowest OVR; at most CAP_CLEAR.max players. Hard cap / owner checks unchanged (fitsAt runs after the move). Returns the price or 0.
const CAP_CLEAR = { on: true, max: 2, ovrGap: 4, top9: true };   // v36e top9: one 7th-9th man may be moved
function capClear(L, t, p, prices, hg, fitsAt) {
  const cs = capSeason(L), S = L.season, yrs = [cs, cs + 1, cs + 2];
  const core = new Set(rosterOf(L, t).sort((a, b) => b.ovr - a.ovr).slice(0, 9).map(x => x.id));   // top 9 of the whole roster (the rotation)
  const cands = rosterOf(L, t).filter(x => x.id !== p.id && x.contract && x.contract.exp >= cs && !core.has(x.id) && capHit(L, x, cs) > 0 && x.ovr <= p.ovr - CAP_CLEAR.ovrGap
    && !x.tw && !((x.contracts || []).slice(-1)[0] && x.contracts.slice(-1)[0].s >= cs)   /* signed this offseason (contracts are stamped with their first cap season) */ && !tradeRestricted(L, x) && (tradeStatus(L, x) || {}).k !== 'protect' && !(x.contract.type === 'rookie' && x.age <= 21) && !(x.contract.ntc) && !x.ext)
    .sort((a, b) => (a.contract.exp === cs ? 0 : 1) - (b.contract.exp === cs ? 0 : 1) || a.ovr - b.ovr || capHit(L, a, cs) - capHit(L, b, cs));
  const why = k => { if (!L.resignLog || L.resignLog.s !== S) L.resignLog = { s: S, n: 0, kept: 0, out: {} }; const o = L.resignLog.o60 = L.resignLog.o60 || { n: 0, kept: 0 }; if (o) { o.ccWhy = o.ccWhy || {}; o.ccWhy[k] = (o.ccWhy[k] || 0) + 1; } return 0; };   // why no move (report)
  // v36e (Kenneth): if bench deals can't do it, one 7th-9th man may go too (paid less than the player kept, 4+ OVR below him)
  const top = rosterOf(L, t).sort((a, b) => b.ovr - a.ovr), ask0 = prices[prices.length - 1];
  const c9 = CAP_CLEAR.top9 ? top.slice(6, 9).filter(x => x.id !== p.id && x.contract && x.contract.exp >= cs && capHit(L, x, cs) > 0 && capHit(L, x, cs) < ask0 && x.ovr <= p.ovr - CAP_CLEAR.ovrGap
    && !x.tw && !((x.contracts || []).slice(-1)[0] && x.contracts.slice(-1)[0].s >= cs) && !tradeRestricted(L, x) && (tradeStatus(L, x) || {}).k !== 'protect' && !(x.contract.type === 'rookie' && x.age <= 21) && !(x.contract.ntc) && !x.ext)
    .sort((a, b) => (a.contract.exp === cs ? 0 : 1) - (b.contract.exp === cs ? 0 : 1) || a.ovr - b.ovr) : [];
  if (!cands.length && !c9.length) return why('noBench');
  const over = (amt, gone) => { const h = contractHit(amt, hg); return yrs.map((y, i) => (i === 0 ? payroll(L, t, y) : payNoFloor(L, t, y)) + h - gone.reduce((s, x) => s + capHit(L, x, y), 0) - APRON); };
  // the smallest set that clears the first price it can: one player (in candidate order), else two
  let plan = null; const C = cands.slice(0, 8), sets = C.map(x => [x]);
  if (CAP_CLEAR.max >= 2) for (let i = 0; i < C.length; i++) for (let j = i + 1; j < C.length; j++) sets.push([C[i], C[j]]);
  for (const y of c9) { sets.push([y]); if (CAP_CLEAR.max >= 2) for (const x of C) sets.push([y, x]); }   // v36e: bench-only sets first, then one 7th-9th man (alone, then with a bench deal)
  for (const amt of prices.filter((v, i, a) => v > MINSAL && a.indexOf(v) === i)) {
    if (over(amt, []).every(v => v <= 1e-6)) break;   // the hard cap is not what blocks it (owner): leave it
    const g = sets.find(gs => over(amt, gs).every(v => v <= 1e-6)); if (g) { plan = { amt, gone: g }; break; }
  }
  // owner side unchanged: after the move the payroll must stay within this season's owner limit (seasonLimit: owner limit, status floor,
  // and the tax-line rule for owners under OWNER_TAXCASH; teams cutting losses) - a 20-season run without this kept all-in teams at the hard cap
  // paying $40-60M tax a year (DAL cash -$128M)
  if (plan && t.owner && !(t.id === L.user)) { const post = payroll(L, t, cs) - plan.gone.reduce((a, x) => a + capHit(L, x, cs), 0) + contractHit(plan.amt, hg); if (cuttingLosses(L, t) || post > seasonLimit(L, t) + 1e-6) return why('ownerLimit'); }
  if (!plan) { const gap = r1(Math.max(...over(prices[prices.length - 1], []))); return why(over(prices[0], []).every(v => v <= 1e-6) ? 'owner' : gap > cands.slice(0, 2).reduce((a, x) => a + capHit(L, x, cs), 0) ? 'tooBig' : 'years'); }
  // find a taker for each contract (an AI team with cap room and a roster spot); a second-round pick goes along when the deal is a burden
  const deals = [];
  for (const x of plan.gone) {
    const hit = capHit(L, x, cs), taken = new Set(deals.map(d => d.b));
    const recv = L.teams.filter(B => B.id !== t.id && B.id !== L.user && !taken.has(B.id) && CAP - payroll(L, B, cs) >= hit && B.roster.length < 15).sort((a, b) => (payNoFloor(L, a, cs) < MINPAY) !== (payNoFloor(L, b, cs) < MINPAY) ? (payNoFloor(L, b, cs) < MINPAY) - (payNoFloor(L, a, cs) < MINPAY) : payroll(L, a, cs) - payroll(L, b, cs));
    let deal = null;
    for (const B of recv) {
      const aGive = { players: [x.id], picks: [] };
      if (playerTV(L, B, x, false) < 0.6) { const k2 = L.picks.filter(k => k.owner === t.id && k.rd === 2 && k.s > S && !pickUsed(L, k) && !deals.some(d => d.aGive.picks.includes(k.id))).sort((a, b) => b.s - a.s)[0]; if (!k2) continue; aGive.picks.push(k2.id); }
      if (tradeCheck(L, t.id, B.id, aGive, { players: [], picks: [] })) continue;
      deal = { a: t.id, b: B.id, aGive, bGive: { players: [], picks: [] }, clear: true, wkA: 'clear', id: 'clear-' + S + '-' + t.id + '-' + x.id, why: `${t.abbr} moved ${x.name} (${money(x.contract.amt)}/yr) to ${B.abbr} to clear hard-cap room to re-sign ${p.name}` };
      break;
    }
    if (!deal) return why('noTaker');
    deals.push(deal);
  }
  for (const d of deals) { const x = L.players[d.aGive.players[0]]; executeTrade(L, d); x.tx.push({ s: S, t: `${t.abbr} moved him to clear hard-cap room to re-sign ${p.name}` }); logNews(L, d.why, t.id, 'trade'); }
  // re-check the real rules after the move: first price that fits
  const k = prices.find(v => fitsAt(v)) || (fitsAt(plan.amt) ? plan.amt : 0);
  { if (!L.resignLog || L.resignLog.s !== S) L.resignLog = { s: S, n: 0, kept: 0, out: {} }; const o = L.resignLog.o60 = L.resignLog.o60 || { n: 0, kept: 0 }; if (k) o.capCleared = (o.capCleared || 0) + 1; else o.capClearFail = (o.capClearFail || 0) + 1; }
  if (k && deals.some(d => c9.some(y => y.id === d.aGive.players[0])) && L.resignLog && L.resignLog.o60) L.resignLog.o60.capClear9 = (L.resignLog.o60.capClear9 || 0) + 1;   // v36e: a 7th-9th man was moved
  if (k) p.tx.push({ s: S, t: `${t.abbr} cleared hard-cap room to re-sign him (moved ${deals.map(d => L.players[d.aGive.players[0]].name).join(' and ')})` });
  return k;
}
const RESIGN_K = { floor: 0.95, rot: 0.97, young: 0.92, top10: 0.92, y26: 0.85, o60: 0.75, tax: 0.9, leave: 0.55, pay: [0.6, 0.88], own75: 30, own68: 18, own62: 8, mid60: 0.95, mid60old: 0.8, val: 1.0, valOvr: 60, disc: 0.75 };   // v36e (Kenneth): stay discount up to 25% (was 15%, v36a part 3)   // v36a: mid60 / mid60old (middle teams under the tax)   // round 2 (10 seasons from the S10 save: NBA +4M with round 1)
const RESIGN_WHY = { money: 'wants more money', win: 'wants to win', role: 'wants a bigger role', mood: 'unhappy with the team', coach: 'poor fit with the coach', fresh: 'wanted a fresh start' };
// v34 A1: Bird rights: an owner stretches past his limit to keep his own good players (a 98 OVR walked over $7M in the trace); hard cap still holds
function resignOwnerOK(L, t, p, amt) {
  if (!t.owner || t.owner.tight || p.ovr < 62 || (t.cash || 0) < 0) return false;   // v36a part 3: no stretch with the bank account in the red
  const slack = p.ovr >= 75 ? RESIGN_K.own75 : p.ovr >= 68 ? RESIGN_K.own68 : RESIGN_K.own62;
  return ownerPay(L, t) + contractHit(amt, false) <= Math.max(t.owner.limit, ownerPay(L, t)) + 5 + slack;
}
function resignWantP(L, t, p, icon) {
  if (icon && p.ovr >= 58) return 1;
  const rk = rosterOf(L, t).filter(x => x.id !== p.id && x.ovr > p.ovr).length, inRot = rotationOf(L, t).some(x => x.id === p.id);
  const K = RESIGN_K;
  let w = inRot ? K.rot : (p.age <= 24 && p.scout >= 70) ? K.young : rk <= 10 && p.ovr >= 58 ? K.top10 : p.age <= 26 && p.ovr >= 58 ? K.y26 : p.ovr >= 60 ? K.o60 : p.ovr >= 56 ? 0.3 : 0.15;
  if (t.mode === 'tank' && p.age >= 28) w *= 0.3; else if (t.mode === 'rebuild' && p.age >= 30) w *= 0.6;
  if (p.age >= 33 && p.ovr < 68) w *= 0.6;
  // v36a A2: a middle team (not tanking, still under the tax with him) keeps its own 60+ rotation player (top 9); the rebuild / age cuts above don't apply
  if (p.ovr >= 60 && t.mode !== 'tank' && (inRot || rk <= 8) && payroll(L, t, capSeason(L)) + (p.ask || 0) <= TAXLINE) w = Math.max(w, p.age >= 33 && p.ovr < 68 ? K.mid60old : K.mid60);
  if (p.ovr >= 56 && payNoFloor(L, t, capSeason(L)) < MINPAY) w = Math.max(w, RESIGN_K.floor);   // v34: a team under the floor keeps its own players (the free-agent pool past day 1 has almost no 56+ left)
  if (payroll(L, t, capSeason(L)) > TAXLINE && (p.ask || 0) >= 10 && t.status !== 'allin') w *= K.tax;
  return clamp(w, 0, 0.97);
}
function resignLeave(L, t, p, icon) {
  if (p.ovr < 58) return null;   // fringe players take what they can get
  const stay = (1 - 0.5 * Math.min(1, twp(p, 'loy'))) * (icon ? 0.5 : 1), g = t.w + t.l, losing = t.mode === 'tank' || t.mode === 'rebuild' || (g >= 20 && t.w / g < 0.42);
  let mpg = null; try { const st = p.stats && p.stats.rs; if (st && st.gp >= 15) mpg = st.min / st.gp / 60; } catch (e) { }
  const ch = {
    money: p.ovr >= 62 ? 0.09 * (0.6 + 0.8 * twp(p, 'mon')) * ((p.sprem || 1) > 1 || (p.dem || 1) > 1.1 ? 1.5 : 1) : 0,
    win: p.ovr >= 62 && losing ? 0.06 + 0.2 * twp(p, 'win') + (p.age >= 30 ? 0.05 : 0) : 0,
    role: p.ovr >= 62 && p.age <= 30 && mpg != null && mpg < 18 ? 0.15 : 0,
    mood: p.morale != null && p.morale < 30 ? 0.5 : p.morale != null && p.morale < 45 ? 0.2 : 0,
    coach: (() => { try { return t.coach && fit(p, t.coach) < 45 ? 0.06 : 0; } catch (e) { return 0; } })(),
    fresh: 0.035 + (t.market === 1 && p.ovr >= 68 ? 0.02 : 0)
  };
  if (p.age >= WIN_FIRST.age && p.ovr >= wfBar(L) && !['allin', 'contend'].includes(t.status) && t.mode !== 'contend') ch.win = Math.max(ch.win, WIN_FIRST.leave * winFirstScore(L, p));   // older ringless star on a non-contender
  for (const k of Object.keys(ch).sort(() => R() - 0.5)) if (ch[k] > 0 && R() < ch[k] * stay * RESIGN_K.leave) return k;
  return null;
}
function resignDecide(L, t, p, icon) { return { want: R() < resignWantP(L, t, p, icon), pay: rnd(RESIGN_K.pay[0], RESIGN_K.pay[1]), leave: resignLeave(L, t, p, icon) }; }
function resignLog(L, p, out) {   // for the season report: kept, or why he left (p:<reason> player, t:team|price|cap team)
  const R0 = L.resignLog && L.resignLog.s === L.season ? L.resignLog : (L.resignLog = { s: L.season, n: 0, kept: 0, out: {} });
  R0.n++; if (!out) R0.kept++; else R0.out[out] = (R0.out[out] || 0) + 1;
  if (p.ovr >= 60) { const o = R0.o60 = R0.o60 || { n: 0, kept: 0 }; o.n++; if (!out) o.kept++; else o[out] = (o[out] || 0) + 1; }
}
function modeSpend(t, p) { return { contend: 1.15, hopeful: 1.0, rebuild: p.age <= 25 ? 1.0 : 0.85, tank: p.age <= 24 ? 0.95 : 0.6 }[t.mode] || 1; }
// Simple negotiation: returns {ok, msg, counter}
function negAppeal(p, t, type, L) {
  let a = 1;
  const fame = p.fame || 0, mk = clamp(1 - 0.7 * twp(p, 'win'), 0.3, 1);     // winners care about the record more than the market
  a += (t.market - 2) * 0.04 * mk * clamp(1 - twp(p, 'mon'), 0, 1);   // v25.9: money-minded players care about the paycheck, not the market
  if (fame >= 50) {
    a += (t.market - 2) * 0.05 * (fame / 100) * mk;               // famous players like the big stage
    if (t.market === 1) a += 0.03 * fame / 100;                    // ...but they'd be the face of a small market (more endorsements)
  }
  if (L) {
    if (p.ovr >= 76 && !rosterOf(L, t).some(x => x.id !== p.id && x.ovr > p.ovr)) a += 0.05;   // featured role: he'd be the best player
    const g = t.w + t.l; if (g >= 10) a += (t.w / g - 0.5) * 0.2 * Math.min(1.3, twp(p, 'win'));
  }
  a += ({ contend: 0.12, hopeful: 0.03, rebuild: -0.02, tank: -0.07 }[t.mode] || 0) * Math.min(1.3, twp(p, 'win'));
  a += repAppeal(L, p, t);   // v26.6 R4: your media reputation
  if (p.boughtOut != null) a += { contend: 0.15, hopeful: 0.05, rebuild: -0.05, tank: -0.1 }[t.mode] || 0;   // bought-out vets chase a ring
  if (p.pers === 'Balanced') a += t.mode === 'contend' ? 0.04 : 0;
  if (type === 're-sign' || type === 'extension' || p.lastTeam === t.id) a += 0.1 * Math.min(1.3, twp(p, 'loy'));
  if (L && grudgeVs(L, p, t.id)) a -= 0.15;   // v17: still bitter
  if (L && familyOn(L, p, t)) a += 0.08;     // wants to play with his brother or for his father
  if (L) { const fo = friendOn(L, p, t); if (fo) a += fo.f.duo ? FR.appealDuo : FR.appeal; }   // v37: wants to join his friend
  if (L && p.pers === 'Mentor' && (wantsMentor(L, t) || (p.team === t.id && youngTeam(L, t)))) a += 0.13;   // v16: mentors take less to lead a young team
  if (L) a *= agentAppeal(L, p, t);   // v25.1: agent type
  return a;
}
// v32b: the role a player would have on team t (his own role if he is on it). Quick: his rank by coach value among the healthy roster.
function expRole(L, t, p) {
  if (p.team === t.id) { const r = roleOf(L, p); if (r) return r; }
  const cut = roleCuts(L), v = roleValue(L, t, p), others = rosterOf(L, t).filter(x => x.id !== p.id && !(x.injLong && x.injury >= 30));
  const idx = others.filter(x => roleValue(L, t, x) > v).length, nRot = clamp(((t.coach && t.coach.depth) || 9) - 6, 1, 5);
  if (idx < 5) { const top = others.filter(x => x.ovr > p.ovr); if (p.ovr >= cut.fs && !top.some(x => x.ovr >= cut.fs)) return 'fs'; if (p.ovr >= cut.star && top.filter(x => x.ovr >= cut.star).length < 2) return 'star'; return 'starter'; }
  return idx === 5 ? 'sixth' : idx <= 5 + nRot ? 'rot' : idx <= 7 + nRot ? 'bench' : 'dev';
}
// how much a role on offer pulls him (minutes matter less to veterans)
function roleAppeal(p, k) { return 1 + 0.004 * (roleMid(k) - 18) * (p.age <= 30 ? 1 : 0.6); }
// What a player wants beyond money: a real role, a team that can win. Returns premiums and hard refusals.
function signConcerns(L, p, t, type, extra) {
  const out = { prem: 1, notes: [], refuse: null };
  const offR = extra && extra.role && ROLE_BY[extra.role.k] ? extra.role.k : null, expR = offR ? expRole(L, t, p) : null;   // v32b: a promised role answers his minutes worry
  const others = rosterOf(L, t).filter(x => x.id !== p.id && !(x.injLong && x.injury >= 30));
  const rank = others.filter(x => x.ovr > p.ovr).length + 1;        // where he'd slot in by rating
  const loyal = trv(p, 'loy') >= 66 && (type === 're-sign' || type === 'extension');
  if (offR && roleRank(offR) <= roleRank(expR)) { /* promised at least the role he'd get: no minutes premium */ }
  else if (offR && roleRank(offR) - roleRank(expR) >= 2 && p.ovr >= 68 && !loyal) { out.refuse = `${p.name} won't sign: you are offering a ${roleName(offR).toLowerCase()} role and he expects to be a ${roleName(expR).toLowerCase()}.`; out.refuseKind = 'minutes'; }
  else if (p.ovr >= 63 && rank >= 9) {
    if (p.ovr >= 70 && p.age <= 31 && rank >= 10 && !loyal) { out.refuse = `${p.name} won't sign: he'd be about ${rank}th in your rotation and wants real minutes.`; out.refuseKind = 'minutes'; }
    else { out.prem *= 1.12; out.notes.push(fl('neg.minutes', { rank }, p.id * 7 + L.season)); }
  } else if (p.ovr >= 63 && rank >= 7) { out.prem *= 1.05; out.notes.push(fl('neg.role', { rank }, p.id * 7 + L.season)); }
  const losing = t.mode === 'tank' || t.mode === 'rebuild';
  if (trv(p, 'win') >= 66 && losing) {
    if (t.mode === 'tank' && p.ovr >= 68 && !loyal) { if (!out.refuse) { out.refuse = `${p.name} won't sign: he wants to win and ${t.abbr} are tanking.`; out.refuseKind = 'tanking'; } }
    else { out.prem *= t.mode === 'tank' ? 1.18 : 1.1; out.notes.push(fl('neg.winner', { team: t.abbr, mode: MODE_LABEL[t.mode].toLowerCase(), pct: t.mode === 'tank' ? 18 : 10 }, p.id * 7 + L.season)); }
  } else if (p.age >= 31 && p.ovr >= 72 && losing) { out.prem *= 1.08; out.notes.push(fl('neg.vet', {}, p.id * 7 + L.season)); }
  if ((type === 're-sign' || type === 'extension') && p.morale != null) {
    const rk = p.contract && p.contract.type === 'rookie' ? 0.5 : 1;   // v28.7 F2: on a rookie deal the mood swing in asking pay is halved
    if (p.morale >= 75) { out.prem *= 1 - 0.08 * rk; out.mood = 'happy'; out.notes.push(fl('neg.happy', {}, p.id * 7 + L.season).replace('-8%', rk < 1 ? '-4%' : '-8%')); }
    else if (p.morale < 25) { if (!out.refuse) { out.refuse = `${p.name} is unhappy and wants out: he won't re-sign.`; out.refuseKind = 'unhappy'; } }
    else if (p.morale < 40) { out.prem *= 1 + 0.12 * rk; out.mood = 'unhappy'; out.notes.push(fl('neg.unhappy', {}, p.id * 7 + L.season).replace('+12%', rk < 1 ? '+6%' : '+12%')); }
  }
  if (trv(p, 'mon') >= 66) out.notes.push(fl('neg.money', {}, p.id * 7 + L.season));
  if (loyal) out.notes.push(fl('neg.loyal', {}, p.id * 7 + L.season));
  return out;
}
function negotiate(L, pid, amt, yrs, tid, type, opt, extra) {
  const p = L.players[pid], t = L.teams[tid];
  amt = r1(amt); yrs = clamp(Math.round(yrs), 1, 5); opt = yrs >= 2 ? (opt || null) : null;
  if (type === 'signing' && yrs > 4) return { ok: false, msg: 'Free agents can sign for at most 4 years. Only a player\'s own team can offer 5.' };
  if (type === 'extension' && !canExtend(L, p)) return { ok: false, msg: 'Extensions are only allowed before the trade deadline (70% mark), for players in the last year of a deal that was originally 3 years or longer.' };
  const MX = r1(maxForTeam(L, p, tid));   // v28.7 X: the max rounded to $0.1M, so the max is always an amount you can type and he can accept
  if (amt > MX + 1e-6) return { ok: false, msg: `The most ${p.name} can be paid by ${t.abbr} is ${money(MX)} (${p.svc} years of service${MX > MX + 1e-6 ? ', supermax' : ''}).` };
  if (amt < MINSAL) return { ok: false, msg: `The minimum contract is ${money(MINSAL)}.` };
  if (p.ask == null) setAsk(L, p);
  if (p.prefY == null) p.prefY = yrsFor(p, p.ask);     // v15: his preferred length is fixed for the window (it used to re-roll on every offer)
  const pref = type === 'signing' ? Math.min(4, p.prefY) : p.prefY;
  const cc = signConcerns(L, p, t, type, extra);
  if (cc.refuse) return { ok: false, refused: true, msg: cc.refuse };

  // the ask, adjusted for years, options, team appeal and his concerns, but never above the max he can legally get
  const ag = agentOf(L, p), st = ag ? AGENT_STYLE[ag.style] : AGENT_STYLE.fair;
  extra = extra || {};
  if (extra.ntc && !NTC_ELIGIBLE(p)) extra.ntc = false;
  const inc = clamp(+extra.inc || 0, 0, r1(amt * 0.25));
  // v26.1: a list of incentives (total up to 25% of salary), each worth its amount × how likely he thinks it is
  if (extra.incs) { let left = r1(amt * 0.25); extra.incs = extra.incs.filter(x => INC_KINDS.includes(x.k)).map(x => { const a = clamp(r1(+x.amt || 0), 0, left); left = r1(left - a); return { k: x.k, amt: a }; }).filter(x => x.amt > 0); }
  const incVal = extra.incs && extra.incs.length ? extra.incs.reduce((a, x) => a + x.amt * incLikely2(L, p, t, x.k), 0) : inc ? inc * incLikely(L, p, t, extra.incK || 'gp') : 0;
  const termMult = st.need * ((type === 're-sign' || type === 'extension') && st.own ? st.own : 1) * (extra.ntc ? 0.95 : 1) * clauseMult(L, p, t, yrs, extra) * (type === 'extension' && p.contract && p.contract.type === 'rookie' ? 0.92 * (ag && ag.kind === 'youth' ? AGENT_KIND.youth.ext : 1) : 1);
  const needAt = (y, o) => termMult * Math.min(MX, Math.max(trv(p, 'mon') >= 70 ? p.ask : 0, p.ask * (1 + 0.04 * Math.abs(y - pref)) * (o === 'PO' ? 0.95 : o === 'TO' ? 1.05 : 1) * cc.prem * (o === 'TO' ? 1 + 0.1 * Math.min(1, twp(p, 'mon')) : 1) / negAppeal(p, t, type, L)));
  const race = type === 'extension' ? awardRace(L, p) : null;
  if (race && !cc.notes.some(n => /Betting/.test(n))) cc.notes.push(`Betting on himself (${race}): only extends at the max (${money(maxFor(p))})`);
  const lcN = lowAskCap(L, p), lcMax = lcN ? (lcN.hard ? lcN.cap : Math.max(lcN.cap, p.ask || 0) * 1.1) : Infinity;   // v32e: a low-rated player's quote stays near his ramp whatever the premiums
  const needR = (y, o) => Math.min(MX, lcMax, race ? Math.max(needAt(y, o), maxFor(p)) : needAt(y, o));   // v28.7 X: never asks above the legal max (clauses/agent multipliers used to push it over, so even the max was refused)
  if (extra.quote) return { quote: Math.min(MX, Math.ceil(needR(pref, null) * 10 - 1e-6) / 10), pref, notes: cc.notes };
  const need = needR(yrs, opt);
  const hg = (type === 're-sign' || type === 'extension') && p.draftTid === tid && amt >= 10;
  if (type === 'extension') { if (payroll(L, t, L.season + 1) + contractHit(amt, hg) > APRON + 1e-6 || !futFits(L, t, contractHit(amt, hg))) return { ok: false, msg: `That would put next season's payroll over the ${money(APRON)} hard cap.` }; }
  else if (!canFit(L, t, amt, hg, type)) return { ok: false, msg: type === 're-sign' ? `That would put ${t.abbr} over the ${money(APRON)} hard cap (payroll ${money(payroll(L, t))}).` : V244.b2 && !MLE_REAL ? `That would put ${t.abbr} over the ${money(APRON)} hard cap (payroll ${money(payroll(L, t))}).` : `${t.abbr} can't fit that (payroll ${money(payroll(L, t))}${hg ? ', counting 90%' : ''}). Over the ${money(CAP)} cap you can only sign free agents with the mid-level exception (up to ${money(MLE)}, once a season, only while under the ${money(TAXLINE)} tax line${mleOpen(L, t) ? '' : '; already used this season'}) or at the minimum.` };
  if (MLE_REAL && type === 'signing' && tid === L.user && extra && extra.mle === false && !extra.quote && contractHit(amt, hg) > 0 && payroll(L, t) + contractHit(amt, hg) > CAP + 1e-6) return { ok: false, msg: `Over the ${money(CAP)} cap this deal needs your mid-level exception: tick "Use mid-level", or offer the minimum.` };   // v32g
  if (type === 'signing' && t.roster.length >= 15 && !(L.phase === 'regular' && false)) return { ok: false, msg: `${t.abbr} already have 15 players. Release someone first.` };
  if (amt + incVal + 0.01 >= need || (p.ask <= MINSAL + 1e-6 && amt >= MINSAL)) {
    // v24.5.1: the owner is asked only once the player would accept, and a promise counts only when he signs
    let promise = false;
    if (type === 'signing' && tid === L.user && !extra.noOwner) { const oc = ownerCheck(L, amt, 0); if (!oc.ok) { if (oc.ask && extra.ownerPromise) promise = true; else return { ok: false, owner: oc, msg: oc.msg }; } }
    const yy = yrs, oo = opt;   // v32a: he accepts exactly the years offered (before, a deal under 80% of his value was silently cut to 1 year: 4-yr rookie extension, 2-yr minimum). He accepts, counters or refuses; never shortens
    const mleHit = contractHit(amt, false), mleP = payroll(L, t), mleOK = type === 'signing' && mleOpen(L, t) && mleHit > 0 && mleHit <= MLE + 1e-6 && mleP < TAXLINE && mleP + mleHit > CAP + 1e-6;   // v32d
    const ex = { mle: tid === L.user ? (mleOK && extra.mle !== false) : null, inc: inc || 0, incK: extra.incK || 'gp', ntc: !!extra.ntc, incs: extra.incs || null, kick: extra.kick || 0, eto: extra.eto || null, gtd: extra.gtd != null ? extra.gtd : null, role: extra.role || null };
    if (type === 'extension') { p.ext = { amt, yrs: yy, hg, opt: oo, x: ex }; p.ask = null; p.tx.push({ s: L.season, t: `Signed an extension with ${t.abbr}: ${yy} yr, ${money(amt)}/yr from next season` }); logNews(L, `${t.abbr} extended ${p.name}: ${yy} yr, ${money(amt)}/yr`, tid, 'tx'); }
    else { signContract(L, p, tid, amt, yy, type, oo, ex); if (type === 're-sign') L.resign = L.resign.filter(id => id !== pid); if (promise) acceptOwnerGoal(L); }
    return { ok: true, promised: promise, accepted: { pid, tid, amt, yrs: yy, opt: oo, type }, msg: `${p.name} agreed: ${yy} yr, ${money(amt)}/yr${oo ? ' with a ' + (oo === 'PO' ? 'player' : 'team') + ' option' : ''}.` };
  }
  // v15: a lowball offer (under 85% of what he needs) annoys him a little: +3%, at most twice per negotiation window
  if (race) p.bet = { s: L.season, race };
  let insulted = false;
  if (amt + incVal < 0.85 * need && (p.insult || 0) < 2 && p.ask < MX - 1e-6) { p.insult = (p.insult || 0) + 1; p.ask = Math.min(MX, r1(p.ask * 1.03)); capAsk(L, p); insulted = true; }
  // counter: exactly what he'd accept, rounded up so offering it always works
  const up = x => Math.min(MX, Math.ceil(x * 10 - 1e-6) / 10);
  const wantY = up(needR(yrs, opt) - incVal), wantP = up(needR(pref, null));   // v28.7 X: counter includes the award-race rule, so offering it is accepted
  return { ok: false, msg: `${p.name} wants ${money(wantY)}/yr for ${yrs} year${yrs > 1 ? 's' : ''}${opt ? ' with that option' : ''}${yrs !== pref ? `, or ${money(wantP)}/yr for ${pref} year${pref > 1 ? 's' : ''} (his preference)` : ''}.${insulted ? ' That offer was well short, so his price went up a little.' : ''}${wantY >= MX - 1e-6 ? ' That is the most he can be paid.' : ''}${cc.notes.length ? ' ' + cc.notes.join('; ') + '.' : ''}`, counter: { amt: wantP, yrs: pref } };
}
// Step 5: free agency, 10 days
function startFA(L) {
  try { agentOffseason(L); } catch (e) { }   // v25.1
  for (const id of L.teamOptions || []) decideTeamOption(L, id, true);
  // undecided picks: first-rounders are signed (the usual choice), second-rounders become free agents
  for (const id of (L.r2Pending || []).slice()) { const p = L.players[id]; if (decideSecondRounder(L, id, !!(p && p.draft && p.draft.rd === 1))) decideSecondRounder(L, id, false); }
  for (const id of L.resign || []) { const p = L.players[id]; const t0 = L.teams[p.team]; const wasRookie = p.contract && p.contract.type === 'rookie'; if (!wasRookie && ((p.morale != null && p.morale < 40 && p.ovr >= 65) || (p.ovr >= 70 && rotationOf(L, t0).slice(0, 5).some(x => x.id === p.id)))) addGrudge(L, p, t0.id, 'you let him walk'); p.tx.push({ s: L.season, t: `Contract with ${t0.abbr} expired` }); toFA(L, p); if (wasRookie && p.ovr >= 60) p.rfa = { tid: t0.id, s: L.season, want: true }; }
  expireTwoWays(L);
  L.resign = [];
  try { if (xpnRun(L)) topUpFA(L, 40 + 12 * L.teams.length / 16); } catch (e) { console.error('expansion', e); }   // Phase A: new teams join before free agency
  for (const id of L.fa) { const p = L.players[id]; if (p.ask == null) setAsk(L, p); }
  if (V244.b2) for (const id of L.fa) { const p = L.players[id]; if (p && p.ovr >= 76 && (p.suitors || 0) >= 3) logNews(L, `${p.name} is expected to draw several bids (${p.suitors} teams can make a real offer)`, null, 'tx'); }   // v24.4
  topUpFA(L, 40);
  L.faDay = 1; L.phase = 'off-fa'; L.faOffers = {}; L.faEvents = []; L.faBids = {};
  refreshTradeStatus(L);
  if (L.career && typeof careerFaStart === 'function') { try { careerFaStart(L); } catch (e) { console.error(e); } }   // My Career
}
// A cheap player a team would cut to make room (no dead money)
function cuttable(L, t) {
  const rot = new Set(rotationOf(L, t).map(p => p.id));
  return rosterOf(L, t).filter(p => !rot.has(p.id) && capHit(L, p) === 0 && !(p.contract && p.contract.type === 'rookie' && p.age <= 21)).sort((a, b) => a.ovr - b.ovr)[0];
}
// v36a A1: the first FA days, a middle team (not tanking / rebuilding, under the tax, with cap room or the mid-level) bids on 60+ players
// it would play (top 10) at their ask, instead of only when he'd be a top-8 man (NBA payroll 166.5 vs 170-185)
const FA_EARLY = { on: true, days: 3, ovr: 60, ask: 1.05, room: 3 };
function faEarly(L, t, p) { return FA_EARLY.on && L.phase === 'off-fa' && (L.faDay || 1) <= FA_EARLY.days && p.ovr >= FA_EARLY.ovr && t.mode !== 'tank' && t.mode !== 'rebuild' && payroll(L, t) < TAXLINE && faRoom(L, t) >= FA_EARLY.room; }
function faRound(L, lastCall, minOvr) {
  const signedToday = {}, multi = L.phase === 'off-fa';
  const fas = L.fa.map(id => L.players[id]).filter(p => !p.retired && p.ovr >= (minOvr || 0)).sort((a, b) => b.mval - a.mval);
  const needsCache = {};
  const softMax = L.phase === 'regular' ? 15 : 14;
  for (const p of fas) {
    if (multi && p.sheet) { resolveSheet(L, p, lastCall); continue; }   // v18: restricted free agent waiting on a match
    const offers = [];
    for (const t of L.teams) {
      if (t.id === L.user || (signedToday[t.id] || 0) >= 2) continue;
      const rot = rotationOf(L, t);
      const ovrAt = i => rot[i] ? rot[i].ovr : 0;
      const n = t.roster.length;
      let W, cut = null;
      // teams under the payroll floor shop harder in free agency so they reach it with real targets
      const short = L.phase === 'off-fa' ? MINPAY - payroll(L, t) : 0;
      if (p.pers === 'Mentor' && mentorsOf(L, t).length >= MENTOR_MAX) continue;   // v16: at most 2 mentors per team
      const mentorFit = p.pers === 'Mentor' && wantsMentor(L, t) && p.ovr >= ovrAt(11) - 2;
      const pov = teamOvr(L, t.id, p);   // v34: its staff's read (draft read for unrevealed rookies, pro read otherwise)
      const early = faEarly(L, t, p);   // v36a A1: a middle team uses its room / mid-level on a 60+ player in the first days
      const rotationWorthy = pov >= ovrAt(short > 0 || early ? 9 : 7) - 1 || mentorFit;
      if (n < 13) W = rotationWorthy ? null : MINSAL;
      else if (early && rotationWorthy && (n < 15 || (cut = cuttable(L, t)))) W = null;
      else if ((n < softMax || (short > 0 && n < 15)) && rotationWorthy) W = null;
      else if (FLOOR_FILL.on && short > FLOOR_FILL.minGap && n >= 15 && rotationWorthy && (cut = floorCut(L, t, p))) W = null;   // v33d: a floor team opens a spot (a minimum player)
      else if (pov >= ovrAt(5)) { cut = n >= 15 ? cuttable(L, t) : null; if (n >= 15 && !cut) continue; W = null; }
      else continue;
      if (W == null) {
        needsCache[t.id] = needsCache[t.id] || teamNeeds(L, t);
        W = Math.min(maxForTeam(L, p, t.id), (superOK(L, p) ? Math.max(p.mval, p.mvalRaw || 0) : p.mval) * Math.max(needMult(L, t, p, needsCache[t.id]), demPay(p)) * modeSpend(t, p) * wetPay(p) * rnd(0.95, 1.05) * (short > 0 ? 1 + Math.min(0.3, short / 60) : 1) * (recentWinner(L, p) && p.lastTeam !== t.id ? 1.04 : 1));
        if (mentorFit) W *= 1.1;
        W *= proValK(L, t.id, p);   // v34: priced on what its scouts see
        if (p.age >= 30) W *= Math.max(0.85, 1 - 0.03 * (p.age - 29));   // v18: teams price in decline for veterans
        if (V244.b2 && (p.sprem || 1) > 1) W *= 1 + 0.9 * ((p.sprem || 1) - 1);   // v24.4: a real bidding war for a star
        if (V244.b2 && isRFA(L, p) && p.rfa.tid !== t.id && payroll(L, L.teams[p.rfa.tid]) + W > TAXLINE) W *= 1.08;   // v24.4: offer sheets aimed at teams that would have to pay tax to match
        if ((p.accPrem || 0) <= 2 && (p.fame || 0) < 35) W = Math.min(W, p.mval * Math.max(1.3, p.dem || 1));    // no bidding wars over players without accolades; a hot archetype tops out at 1.5x value    // no bidding wars over players without accolades
        if (early) W = Math.max(W, Math.min(maxForTeam(L, p, t.id), (p.ask || 0) * FA_EARLY.ask));   // v36a A1: bid his ask now (room, mid-level, ramp and hard cap still apply below)
      }
      let room;
      if (V244.b2) { needsCache[t.id] = needsCache[t.id] || teamNeeds(L, t); room = b2Room(L, t, p, needsCache[t.id]); if (W > MINSAL) W = b2Bid(L, t, Math.min(W, room), payroll(L, t)); }
      else { room = faRoom(L, t); if (t.owner) room = Math.min(room, Math.max(0, t.owner.limit - payroll(L, t))); }    // owners hold the purse strings
      room = Math.min(room, futRoom(L, t));   // v33b: later cap years too
      if (W > MINSAL && W > room) W = room >= 1.5 ? room : MINSAL;
      if (W > MINSAL) W = rampAmt(L, p, W);   // v32e: no bidding war over a low-rated player (ramp, soft from 60)
      let fl = false;   // v33d: a team under the floor may bid above value (the shortfall is owed anyway); Kenneth's young-player rule and the under-60 cap hold
      if (FLOOR_FILL.on && short > FLOOR_FILL.minGap && W > 0) { const lim = p.ovr >= 60 ? Infinity : p.ovr <= 55 ? MINSAL : p.age <= 25 ? MINSAL * FLOOR_FILL.youngMax : ASK_REL.u60, wf = Math.min(short, room, maxFor(p), lim, Math.max(p.ask || 0, p.mval || MINSAL) * FLOOR_FILL.prem + FLOOR_FILL.plus); if (wf > W + 0.5) { W = wf; fl = true; } }
      W = W < 1.5 ? MINSAL : r1(W);
      if (trv(p, 'win') >= 72 && t.mode === 'tank' && p.ovr >= 68) continue;   // won't sign with a tanking team
      const role = expRole(L, t, p), ap = negAppeal(p, t, 'signing', L) * roleAppeal(p, role);   // v32b: every offer carries a role
      offers.push({ tid: t.id, amt: W, cut, ap, sc: W * ap, role, fl: fl && W > MINSAL });
    }
    const uo = multi ? (L.faOffers || {})[p.id] : null;
    if (!offers.length && !uo) continue;
    // v16: personality decides how much the fit matters next to the money
    const K = persK(p);
    for (const o of offers) o.sc = o.amt * Math.pow(o.ap, K);
    offers.sort((a, b) => b.sc - a.sc);
    const okAI = offers.filter(o => o.sc + 1e-6 >= p.ask || lastCall), best = okAI[0], second = offers.find(o => o !== best);
    if (multi) {
      const star = (p.fame || 0) >= 60 || p.ovr >= 78, maxWait = star ? 5 : 2;
      const uAp = uo ? negAppeal(p, L.teams[L.user], 'signing', L) * roleAppeal(p, uo.extra && uo.extra.role && ROLE_BY[uo.extra.role.k] ? uo.extra.role.k : expRole(L, L.teams[L.user], p)) : 0, uSc = uo ? uo.amt * Math.pow(uAp, K) : -1;
      p.faSeen = (p.faSeen || 0) + 1;
      if (p.faSeen === 1) try { faLeak(L, p, offers); } catch (e) { }   // v26.6 R2
      const realN = offers.filter(o => o.amt > MINSAL + 0.05).length;   // minimum offers from teams filling the roster don't count
      L.faBids = L.faBids || {}; L.faBids[p.id] = { n: realN + (uo ? 1 : 0), best: offers[0] ? offers[0].sc : 0, uSc, day: L.faDay };
      if (p.faTalk && p.faTalk.day < L.faDay && !lastCall) { faEvent(L, p, 'lost', best ? best.tid : null, 'you didn\'t answer his counter'); delete L.faOffers[p.id]; p.faTalk = null; if (!best) continue; }
      else if (p.faTalk) continue;   // waiting for your answer today
      const goodNow = (best && best.sc >= p.ask * 1.15) || (uo && uSc >= p.ask * 1.15);
      const decide = lastCall || p.faSeen >= maxWait || R() < (star ? 0.15 : 0.4) + (goodNow ? 0.25 : 0) - (offers.length >= 3 ? 0.1 : 0);
      if (!decide) { if (uo) faEvent(L, p, 'wait', null, `${star ? 'day ' + p.faSeen + ' of up to 5' : 'day ' + p.faSeen + ' of up to 2'}, ${realN + 1} offer${realN ? 's' : ''}`); continue; }
      if (uo && (!best || uSc >= best.sc) && isRFA(L, p) && p.rfa.tid !== L.user) {
        const q = negotiate(L, p.id, MINSAL, uo.yrs, L.user, 'signing', null, { quote: true });
        if (q && q.quote && uo.amt + 0.01 >= q.quote) { delete L.faOffers[p.id]; p.sheet = { tid: L.user, amt: uo.amt, yrs: uo.yrs, day: L.faDay, promise: !!(uo.extra && uo.extra.ownerPromise) }; faEvent(L, p, 'sheetSent', p.rfa.tid, '', { amt: uo.amt, yrs: uo.yrs }); logNews(L, `${p.name} signed an offer sheet with ${L.teams[L.user].abbr} (${money(uo.amt)} × ${uo.yrs}); ${L.teams[p.rfa.tid].abbr} can match`, L.user, 'tx'); continue; }
      }
      if (uo && (!best || uSc >= best.sc)) {
        const r = negotiate(L, p.id, uo.amt, uo.yrs, L.user, 'signing', uo.opt, uo.extra || {});
        delete L.faOffers[p.id];
        if (r.ok) { faEvent(L, p, 'signed', L.user, '', r.accepted); continue; }
        if (!r.refused && r.counter) { const c = negotiate(L, p.id, MINSAL, uo.yrs, L.user, 'signing', null, { quote: true }); p.faTalk = { amt: c.quote || r.counter.amt, yrs: c.pref || r.counter.yrs, day: L.faDay }; L.faOffers[p.id] = uo; faEvent(L, p, 'talk', L.user, 'your offer is a bit short', p.faTalk); continue; }
        faEvent(L, p, 'lost', best ? best.tid : null, /can't fit|hard cap/.test(r.msg || '') ? 'you no longer had the cap room' : /15 players/.test(r.msg || '') ? 'your roster was full' : (r.msg || '')); if (!best) continue;
      } else if (uo && best) {
        // he'd rather be with you for reasons other than money: one chance to close the gap
        if (uAp >= Math.max(...offers.map(o => o.ap)) - 1e-9 && !p.faTalked) {
          const MX = maxForTeam(L, p, L.user), yq = Math.min(4, p.prefY || uo.yrs), q = negotiate(L, p.id, MINSAL, yq, L.user, 'signing', null, { quote: true });
          const amt = Math.min(MX, Math.max(q && q.quote ? q.quote : 0, Math.ceil(best.sc / Math.pow(uAp, K) * 10) / 10));
          p.faTalked = true; p.faTalk = { amt, yrs: q && q.pref ? q.pref : yq, day: L.faDay }; faEvent(L, p, 'talk', L.user, `he'd rather play for you, but has a better offer`, p.faTalk); continue;
        }
        const why = best.amt >= uo.amt ? 'more money' : p.pers === 'Winner' ? 'wanted a contender' : p.pers === 'Mentor' ? 'wanted to lead a young team' : p.pers === 'Loyal' && best.tid === p.lastTeam ? 'went back to his old team' : 'a better fit';
        delete L.faOffers[p.id]; faEvent(L, p, 'lost', best.tid, why);
      } else if (!best) continue;
    } else if (!best) {
      // v30 review: in season, an unsigned player with real offers below his ask comes down to the best one (or 20% a week), so a capped-out league doesn't leave him unsigned all year
      if (L.phase === 'regular' && offers.length && p.ask > MINSAL) { const a = r1(Math.max(offers[0].sc, p.ask * 0.8)); p.ask = a < 1.5 ? MINSAL : Math.min(p.ask, a); }
      continue;
    }
    // pay what it takes to beat the next bidder (adjusted for how much he likes each team), at least the asking price
    const bk = Math.pow(best.ap, K);
    let price = best.amt <= MINSAL ? MINSAL : Math.min(best.amt, Math.max(lastCall ? 0 : p.ask / bk, second ? second.sc / bk + 0.5 : 0, p.mval * 0.6));
    price = price < 1.5 ? MINSAL : r1(price);
    if (multi && isRFA(L, p) && best.tid !== p.rfa.tid && price > 2) { p.sheet = { tid: best.tid, amt: price, yrs: Math.min(4, yrsFor(p, price)), day: L.faDay }; logNews(L, `${p.name} signed an offer sheet with ${L.teams[best.tid].abbr} (${money(price)} × ${p.sheet.yrs}); ${L.teams[p.rfa.tid].abbr} can match`, p.rfa.tid, 'tx'); if (p.rfa.tid === L.user) faEvent(L, p, 'sheet', best.tid, '', { amt: price, yrs: p.sheet.yrs }); continue; }
    if (best.cut) { best.cut.tx.push({ s: L.season, t: `Released by ${L.teams[best.tid].abbr} to open a roster spot` }); toFA(L, best.cut); }
    if (multi && offers.length >= 2) { const mx = Math.max(...offers.map(o => o.amt)); const c = (L.faChoice = L.faChoice || {})[p.pers] = (L.faChoice || {})[p.pers] || [0, 0, 0]; c[0]++; if (best.amt < mx * 0.97) c[1]++; if (price > p.ask * 1.02) c[2]++; }   // stats: choices with 2+ offers, took less money, paid above ask
    if (best.fl && !lastCall) price = Math.max(price, best.amt);   // v33d: a floor team pays its bid, on a short deal
    signContract(L, p, best.tid, price, best.fl && price > (p.mval || 0) * 1.2 ? (p.age >= 28 ? 1 : Math.min(2, yrsFor(p, price))) : Math.min(4, yrsFor(p, price)), 'signing', null, { rl: best.role });
    if (best.fl && price > (p.mval || 0) * 1.3) p.tx.push({ s: L.season, t: `Paid above his value: ${L.teams[best.tid].abbr} were under the payroll floor` });
    if (multi) try { faDecision(L, p, best, offers); } catch (e) { }   // v26.6 R2: why he picked them
    { const wp = wetPay(p); if (Math.abs(wp - 1) >= 0.02) p.tx.push({ s: L.season, t: `Work ethic priced in (${wp > 1 ? '+' : ''}${Math.round((wp - 1) * 100)}%)` }); }   // v24.4
    if (multi && best.amt > p.ask * 1.02 && p.ovr >= 65 && offers.length >= 2) faEvent(L, p, 'note', best.tid, '');
    signedToday[best.tid] = (signedToday[best.tid] || 0) + 1;
  }
}
// v18: restricted free agency (players coming off rookie deals): offer sheets and a 2-day match
function isRFA(L, p) { return !!(p.rfa && p.rfa.s === L.season && L.teams[p.rfa.tid]); }
function resolveSheet(L, p, lastCall) {
  const sh = p.sheet, hold = p.rfa.tid, H = L.teams[hold], O = L.teams[sh.tid];
  if (hold === L.user) { if (L.faDay - sh.day < 2 && !lastCall) return; return sheetDecide(L, p, false, 'you didn\'t match in time'); }
  if (L.faDay <= sh.day && !lastCall) return;
  // v24.5 Bird-rights style: the holder ignores its status ceiling; only the owner's limit, the hard cap and the tax cost count
  // a full roster can still match by waiving its cheapest non-core player; a sheet is worth matching up to 1.5x his value (stars 1.8x), counting the tax it adds
  const pay = payroll(L, H), cut = H.roster.length >= 15 ? waivable(L, H, [])[0] : null;
  const fits = pay + sh.amt <= APRON + 1e-6 && futFits(L, H, sh.amt) && ownerOK(L, H, sh.amt) && (H.roster.length < 15 || !!cut);
  const eff = V244.b2 && !bidsThroughTax(L, H) ? sh.amt + taxCostOf(L, H, pay, sh.amt) : sh.amt;
  const worth = eff <= Math.max(p.mval * 1.5, MINSAL * 2) || (p.ovr >= 74 && eff <= p.mval * 1.8);
  const match = p.rfa.want && fits && worth && (H.mode !== 'tank' || R() < 0.5);
  if (match && cut) { cut.tx.push({ s: L.season, t: `Released by ${H.abbr} to make room to match an offer sheet` }); release(L, cut); }
  sheetDecide(L, p, match);
}
function sheetStillFits(L, O, amt) {
  if (O.roster.length >= 15 && (O.id === L.user || !cuttable(L, O))) return false;
  return canFit(L, O, amt, false, 'signing') && payNoFloor(L, O) + contractHit(amt, false) <= APRON + 1e-6;
}
function sheetDecide(L, p, match, why) {
  const sh = p.sheet, hold = p.rfa.tid; p.sheet = null;
  if (match) { signContract(L, p, hold, sh.amt, sh.yrs, 're-sign');
    if (V244.b2) { p.noTrade = { s: capSeason(L), day: 1e6 }; p.rfaMatched = L.season; const H = L.teams[hold], O = L.teams[sh.tid]; if (negAppeal(p, O, 'signing', L) > negAppeal(p, H, 're-sign', L) || (p.morale != null && p.morale < 50)) { p.morale = Math.max(0, (p.morale == null ? 60 : p.morale) - 15); p.tx.push({ s: L.season, t: `Unhappy: ${H.abbr} matched when he wanted to join ${O.abbr}` }); } }  /* v24.4: a matched player can't be traded for a season */ logNews(L, `${L.teams[hold].abbr} matched ${L.teams[sh.tid].abbr}'s offer sheet for ${p.name} (${money(sh.amt)} × ${sh.yrs})`, hold, 'tx'); if (sh.tid === L.user) faEvent(L, p, 'matched', hold, ''); }
  else {
    // v33b: the sheet was signed a day or two ago; the offering team may have used its room (or the mid-level) since. Check again
    // now (soft-cap rule + hard cap + roster), or the deal is void and he becomes an unrestricted free agent. (BKN S2 went $27M over this way.)
    const O = L.teams[sh.tid];
    if (!sheetStillFits(L, O, sh.amt)) { p.rfa = null; logNews(L, `${p.name}'s offer sheet with ${O.abbr} is void: ${O.abbr} no longer had the cap room or roster spot. He is an unrestricted free agent`, sh.tid, 'tx'); if (sh.tid === L.user) faEvent(L, p, 'lost', null, 'you no longer had the cap room'); return; }
    if (O.roster.length >= 15 && O.id !== L.user) { const c = cuttable(L, O); if (c) { c.tx.push({ s: L.season, t: `Released by ${O.abbr} to open a roster spot` }); toFA(L, c); } }
    const oc = sh.tid === L.user && sh.promise ? ownerCheck(L, sh.amt, 0) : null; signContract(L, p, sh.tid, sh.amt, sh.yrs, 'signing'); if (oc && !oc.ok && oc.ask) acceptOwnerGoal(L); logNews(L, `${L.teams[hold].abbr} declined to match: ${p.name} joins ${L.teams[sh.tid].abbr} (${money(sh.amt)} × ${sh.yrs})`, sh.tid, 'tx'); if (sh.tid === L.user) faEvent(L, p, 'sheetWon', L.user, '', sh); if (hold === L.user) faEvent(L, p, 'lost', sh.tid, why || 'you declined to match'); }
  p.rfa = null;
}
// v16: how much team fit counts against money in a free agent's choice (money^1 x appeal^K)
const PERS_K = { Money: 0.5, Balanced: 1.2, Winner: 2.0, Loyal: 1.5, Mentor: 1.8 };
// v25.9: how much fit matters next to money, from the trait numbers (money 80 about 0.6, winning 80 about 1.8)
function persK(p) { if (!p.tr) return PERS_K[p.pers] || 1.2; return clamp((p.pers === 'Mentor' ? 1.6 : 1.2) - 0.55 * tw(p, 'mon') + 0.6 * twp(p, 'win') + 0.25 * twp(p, 'loy'), 0.4, 2.2); }
function loyDisc(p) { return p.tr ? clamp(0.95 - 0.05 * twp(p, 'loy'), 0.88, 0.95) : (p.pers === 'Loyal' ? 0.9 : 0.95); }
// your free-agency news: who signed, who wants to talk, who's still deciding
function faEvent(L, p, k, tid, why, terms) {
  if (k === 'note') return;
  const ev = { k, pid: p.id, tid, why, terms: terms || null, day: L.faDay };
  (L.faEvents = L.faEvents || []).push(ev); (L.faInbox = L.faInbox || []).push(ev);
  if (k === 'lost' && tid != null) p.tx.push({ s: L.season, t: `Chose ${L.teams[tid].abbr} over your offer (${why})` });
}
// your offer during free agency waits for his decision; it holds that much of your cap room until he answers
function pendingTotal(L, except) { return Object.entries(L.faOffers || {}).filter(([id]) => +id !== except).reduce((a, [, o]) => a + o.amt, 0); }
function submitFAOffer(L, pid, amt, yrs, opt, extra) {
  const p = L.players[pid], t = L.teams[L.user];
  if (!p || p.team != null || !L.fa.includes(pid)) return { ok: false, msg: 'He is no longer a free agent.' };
  amt = r1(amt); yrs = clamp(Math.round(yrs), 1, 4);
  const MX = maxForTeam(L, p, L.user);
  if (amt > MX + 1e-6) return { ok: false, msg: `The most you can offer ${p.name} is ${money(MX)}.` };
  if (amt < MINSAL) return { ok: false, msg: `The minimum contract is ${money(MINSAL)}.` };
  const cc = signConcerns(L, p, t, 'signing'); if (cc.refuse) return { ok: false, refused: true, msg: cc.refuse };
  if (t.roster.length + Object.keys(L.faOffers || {}).filter(id => +id !== pid).length >= 15) return { ok: false, msg: 'Your roster plus pending offers would go past 15 players.' };
  if (!canFit(L, t, amt + pendingTotal(L, pid), false, 'signing')) return { ok: false, msg: `That doesn't fit with your other pending offers (${money(pendingTotal(L, pid))} already offered).` };
  if (MLE_REAL && extra && extra.mle === false && contractHit(amt, false) > 0 && payroll(L, t) + pendingTotal(L, pid) + contractHit(amt, false) > CAP + 1e-6) return { ok: false, msg: `Over the ${money(CAP)} cap this offer needs your mid-level exception: tick "Use mid-level", or offer the minimum.` };   // v32g
  const wantPromise = !!(extra && extra.ownerPromise); extra = Object.assign({}, extra || {}); delete extra.ownerPromise;
  { const oc = ownerCheck(L, amt, pendingTotal(L, pid)); if (!oc.ok) { if (oc.ask && wantPromise) extra.ownerPromise = true; else return { ok: false, owner: oc, msg: oc.msg }; } }   // v24.5 / v24.5.1: the promise is stored with the offer and made only if he signs
  (L.faOffers = L.faOffers || {})[pid] = { amt, yrs, opt: yrs >= 2 ? opt || null : null, extra, day: L.faDay };
  if (p.faTalk) p.faTalk = null;
  const q = negotiate(L, pid, MINSAL, yrs, L.user, 'signing', null, { quote: true });
  return { ok: true, pending: true, msg: `Offer sent: ${yrs} yr, ${money(amt)}/yr. He'll decide once he has heard from other teams${q && q.quote && amt < q.quote ? ` (he's asking about ${money(q.quote)} from you, so he may want more)` : ''}.` };
}
function withdrawFAOffer(L, pid) { if (L.faOffers) delete L.faOffers[pid]; const p = L.players[pid]; if (p) p.faTalk = null; }
function faDay(L) {
  L.faEvents = [];
  if (L.career && typeof careerFaDay === 'function') { try { careerFaDay(L, false); } catch (e) { console.error(e); } }   // My Career: hold-out / auto-sign
  processPending(L); processOffers(L);
  if (R() < 0.4) aiOfferToUser(L);
  try { winFirstFA(L); } catch (e) { }   // v32e
  faRound(L, L.faDay >= 10);
  // asks come down as free agency goes on, but a good player won't sign far below his value (he'll take a 1-year deal instead)
  for (const id of L.fa) { const p = L.players[id]; p.faDays = (p.faDays || 0) + 1;
    // demand moves with the market: as teams fill the need or use their room, the premium fades
    if (p.ask > MINSAL && p.dem) { const nd = demandOf(L, p, false); if (nd !== p.dem) { p.ask = Math.min(maxFor(p), r1(p.ask * nd / p.dem)); p.dem = nd; capAsk(L, p); } }
    if (V244.b2 && p.sprem > 1 && p.ask > MINSAL) { const prev = p.sprem, sp = suitorPrem(L, p, false); if (sp < prev) { p.ask = Math.min(maxFor(p), r1(p.ask * sp / prev)); p.sprem = sp; } else p.sprem = prev; }   // v24.5: suitors recounted daily; the premium fades as teams spend
    if (L.faDay >= 2) { const floor = p.ovr >= 65 && p.mval ? p.mval * 0.6 : 0; p.ask = p.ask * 0.85 < 1.5 && !floor ? MINSAL : r1(Math.max(floor, p.ask * 0.85)); } }
  { const g = tradeGoal(L), offGoal = Math.max(g.off, g.tot - tradeCount(L, true)), need = offGoal - tradeCount(L, false); if (need > 0) aiTradeRound(L, L.faDay >= 10 ? 600 : L.faDay >= 8 ? 120 : Math.min(40, Math.ceil(need / Math.max(1, 11 - L.faDay) * 8)), offGoal, false);   // v24.2: the offseason makes up any regular-season shortfall
    for (let i = 0; i < 4; i++) { const tr = ycTry(L, false); if (tr) commitAITrade(L, tr); } }
  runSalaryDumps(L); runSalaryDumps(L);
  try { floorFill(L, L.faDay >= 10); } catch (e) { }   // v33d
  L.faDay++; try { watchScan(L); } catch (e) { }
  if (L.faDay > 10) { if ((L.summer || {}).s !== L.season) { try { summerLeague(L); } catch (e) { } } revealRookies(L);   // v16: summer league and the reveal come after free agency
    for (const id of L.fa.slice()) { const q = L.players[id]; if (q && q.sheet && isRFA(L, q)) { if (q.rfa.tid === L.user) sheetDecide(L, q, false, 'you didn\'t match in time'); else resolveSheet(L, q, true); } }
    L.phase = 'off-ready'; L.faOffers = {}; for (const id of L.fa) { const q = L.players[id]; if (q) { q.rfa = null; q.sheet = null; } } for (const id of L.fa) { const q = L.players[id]; if (q) q.faTalk = null; } }
  if (L.career && typeof careerFaDay === 'function') { try { careerFaDay(L, true); } catch (e) { console.error(e); } }
}
// Fill AI rosters to 13-15 with position coverage; report problems for the user's team
function finalizeRosters(L) {
  topUpFA(L, 40);
  for (const t of L.teams) {
    if (t.id === L.user) continue;
    let guard = 0;
    while ((t.roster.length < 13 || coverage(L, t).some(x => x < 2)) && guard++ < 10) {
      if (t.roster.length >= 15) break;
      const c = coverage(L, t); const need = c.findIndex(x => x < 2);
      const p = bestFA(L, need >= 0 ? need : null); if (!p) break;
      signContract(L, p, t.id, MINSAL, 1, 'signing');
    }
    while (t.roster.length > 15) {
      const ps = rosterOf(L, t).sort((a, b) => (a.contract && a.contract.amt > MINSAL) - (b.contract && b.contract.amt > MINSAL) || a.ovr - b.ovr);
      release(L, ps[0]);
    }
    meetPayrollFloor(L, t);
  }
}
// Teams still under the $120M floor when the season starts pay the difference (logged; there are no team finances)
function meetPayrollFloor(L, t) {
  const pay = payroll(L, t);
  if (pay >= MINPAY - 1e-6) return;
  const owed = r1(MINPAY - pay);
  t.floorPaid = t.floorPaid || []; t.floorPaid.push({ s: L.season + 1, amt: owed });
  logNews(L, `${t.city} ${t.name} finished under the ${money(MINPAY)} payroll floor and pay the ${money(owed)} difference, which counts on their payroll for the season`, t.id, 'league');
}
// v33d: payroll floor. After free agency about a third of NBA teams sat far under the floor (v33b: lowest team avg $76M) and paid
// the difference as a charge. Now a team under the floor uses its cap room during free agency, the way real floor teams do:
// 1) from FA day FLOOR_FILL.absorbDay it takes a salary dump (a short, overpaid contract from a team over the cap, often with a pick
//    attached; it fits in cap room, no salary goes back), 2) from FA day FLOOR_FILL.signDay it signs free agents rated 60+ to short
//    deals (1-2 years) up to the gap, paying above value if needed (at most prem x value + plus; the money is owed anyway).
// The floor charge (meetPayrollFloor) stays as the backstop. Your team is never touched. Owner limits don't apply below the floor.
const FLOOR_FILL = { on: true, absorbDay: 2, signDay: 5, minGap: 0.5, maxSign: 7, prem: 2.5, plus: 4, dumpYrs: 2, dumpYrsBig: 3, bigGapK: 0.08, minOvr: 56, youngMax: ASK_YOUNG_X, lowOvr: 48, lowMax: ASK_REL.u60 };   // v35a: youngMax = the ask cap (2.4x); lowOvr / lowMax: 55- floor deals (1 year, under $10M)   // v34 A1: a big gap (8%+ of the floor) takes 3-year dumps
function floorPend(L, t) { const cs = capSeason(L); let s = 0; for (const tr of L.pending || []) if (tr.floor && tr.b === t.id) for (const id of tr.aGive.players) s += capHit(L, L.players[id], cs); return s; }
function floorGap(L, t) { return MINPAY - payNoFloor(L, t) - floorPend(L, t); }
function floorAbsorb(L, B) {
  const cs = capSeason(L), gap = floorGap(L, B), room = CAP - payroll(L, B, cs) - floorPend(L, B);
  if (gap < FLOOR_FILL.minGap || room < 3 || (L.pending || []).some(tr => tr.floor && tr.b === B.id)) return null;
  if (B.roster.length >= 15 && !waivable(L, B, []).length) return null;
  const cands = [], dumpY = gap >= MINPAY * FLOOR_FILL.bigGapK ? FLOOR_FILL.dumpYrsBig : FLOOR_FILL.dumpYrs;
  for (const A of L.teams) {
    if (A.id === B.id || A.id === L.user) continue;
    const payA = payNoFloor(L, A, cs), big = dumpY > FLOOR_FILL.dumpYrs; if (payA <= MINPAY + (big ? 2 : 5)) continue;   // v34: a big gap also takes deals from teams just above the floor   // teams well above the floor; an overpaid deal, or any short deal from a team over the cap / rebuilding
    const top = new Set(rosterOf(L, A).sort((x, y) => y.ovr - x.ovr).slice(0, payA > TAXLINE ? 3 : 5).map(x => x.id));
    for (const p of rosterOf(L, A)) {
      const c = p.contract; if (!c || c.amt <= MINSAL * 2 || top.has(p.id)) continue;
      const hit = capHit(L, p, cs), yl = c.exp - cs + 1;
      if (hit < 3 || hit > Math.min(room, gap + 8) || yl > dumpY || yl < 1) continue;
      if (payA - hit < MINPAY + 0.5) continue;   // v35a: the team dumping stays at the floor (v34 big-gap dumps from teams just above it only moved the shortfall: NBA S16 15 under)
      if (tradeRestricted(L, p) || (tradeStatus(L, p) || {}).k === 'protect' || iconTier(L, p, A.id) === 2 || p.injLong) continue;
      if (!big && !(payA > TAXLINE || (p.mval || 0) < hit * 0.9 || ((A.mode === 'rebuild' || A.mode === 'tank' || payA > CAP) && p.age >= 27))) continue;   // a burden for them (v34: any non-core deal when the gap is big)
      cands.push({ A, p, hit, sc: -Math.abs(gap - hit) + (payA > TAXLINE ? 6 : 0) + (yl === 1 ? 2 : 0) });
    }
  }
  cands.sort((x, y) => y.sc - x.sc);
  for (const { A, p, hit } of cands.slice(0, 8)) {
    // the floor team pays the gap anyway, so salary that keeps it under the floor costs it nothing: it asks for little (as salaryDump)
    const v = playerTV(L, B, p, false), free = Math.max(0, Math.min(hit, gap)) / Math.max(hit, 1), need = (v >= 1.2 ? 0 : Math.max(0.5, 1.2 - v)) * (1 - 0.8 * free);
    const picks = L.picks.filter(k => k.owner === A.id && k.s > L.season && !pickUsed(L, k)).sort((a, b) => b.rd - a.rd || b.s - a.s);
    const aGive = { players: [p.id], picks: [] }; let got = 0; const gv = [];
    for (const k of picks) { if (got >= need || aGive.picks.length >= 2) break; aGive.picks.push(k.id); gv.push(pickTV(L, B, k)); got = bundleSum(gv); }
    if (got < need - 0.15) continue;
    const bGive = { players: [], picks: [] };
    if (tradeCheck(L, A.id, B.id, aGive, bGive)) continue;
    const yl = p.contract.exp - cs + 1;
    return { a: A.id, b: B.id, aGive, bGive, id: 'dump-floor-' + Date.now() + '-' + B.id, dump: true, floor: true, why: `Salary dump: ${B.abbr} are under the ${money(MINPAY)} payroll floor and used their cap room to take ${p.name}'s ${money(p.contract.amt)}/yr (${yl} season${yl > 1 ? 's' : ''} left) from ${A.abbr}${aGive.picks.length ? `, who attached ${aGive.picks.length} pick${aGive.picks.length > 1 ? 's' : ''}` : ''}` };
  }
  return null;
}
// a minimum-contract player outside the top 9 who is worse than the signing (young rookie-scale picks kept)
function floorCut(L, B, p) { const top = new Set(rosterOf(L, B).sort((a, b) => b.ovr - a.ovr).slice(0, 9).map(x => x.id)); return rosterOf(L, B).filter(x => !top.has(x.id) && capHit(L, x) === 0 && x.ovr < p.ovr && !(x.contract && x.contract.type === 'rookie' && x.age <= 21) && !x.hardship).sort((a, b) => a.ovr - b.ovr)[0] || null; }
function floorSign(L, B, lastCall) {
  let gap = floorGap(L, B), room = CAP - payroll(L, B) - floorPend(L, B), n = 0;
  const sorted = rosterOf(L, B).map(x => x.ovr).sort((a, b) => b - a), bar = Math.max(FLOOR_FILL.minOvr, Math.min(60, sorted[11] || 0));
  while (gap >= FLOOR_FILL.minGap && room >= 1.5 && n < FLOOR_FILL.maxSign) {
    // v35a: after the 56+ pool is gone, 55- players (better than the man cut for them) on 1-year floor deals above the minimum
    const lowBar = B.roster.length >= 15 ? Math.max(FLOOR_FILL.lowOvr, ...rosterOf(L, B).filter(x => capHit(L, x) === 0).map(x => x.ovr + 1).sort((a, b) => a - b).slice(0, 1)) : FLOOR_FILL.lowOvr;
    const fas = L.fa.map(id => L.players[id]).filter(p => p && !p.retired && !p.prospect && !p.abroad && (p.ovr >= bar || (p.ovr <= 55 && p.ovr >= lowBar)) && p.ask != null && !p.sheet && !isRFA(L, p) && !(L.faOffers || {})[p.id]).sort((a, b) => b.ovr - a.ovr || b.mval - a.mval);
    let done = false;
    for (const p of fas.slice(0, 6)) {
      if (signConcerns(L, p, B, 'signing').refuse) continue;
      // Kenneth's rule holds: 55 and under not here (minimum), 56-59 at most ~2.2x the minimum when 25 or younger, nobody under 60 at $10M+
      // v35a: 55- (floor deals only): above the minimum, under $10M; 25 and under at most the young cap (2.4x), like 56-59
      const low = p.ovr <= 55, lim = p.ovr >= 60 ? Infinity : p.age <= 25 ? MINSAL * FLOOR_FILL.youngMax : low ? FLOOR_FILL.lowMax : ASK_REL.u60;
      const amt0 = Math.min(Math.max(gap, MINSAL + 0.2), room, maxFor(p), lim,  low ? Infinity : Math.max(p.ask, p.mval || MINSAL) * FLOOR_FILL.prem + FLOOR_FILL.plus);
      const amt = amt0 < MINSAL + 0.15 ? MINSAL : r1(amt0); if (amt + 1e-6 < p.ask || (low && amt <= MINSAL + 1e-6)) continue;
      const big = gap >= MINPAY * FLOOR_FILL.bigGapK, yrs = low ? 1 : big && p.age <= 30 ? 2 : p.age >= 28 || amt > (p.mval || 0) * 1.5 ? 1 : 2, hit = contractHit(amt, false);   // v34: a big gap takes 2-year deals
      if (yrs > 1 && !futFits(L, B, hit, yrs - 1)) continue;
      if (B.roster.length >= 15) { const c = floorCut(L, B, p); if (!c) return n; if (capHit(L, c) > 0) release(L, c); else { c.tx.push({ s: L.season, t: `Released by ${B.abbr} to open a roster spot` }); toFA(L, c); } }   // v35a: a non-minimum deal is released (dead money)
      signContract(L, p, B.id, amt, yrs, 'payroll');
      gap -= hit; room -= hit; n++; done = true;
      if (amt > (p.mval || 0) * 1.3) p.tx.push({ s: L.season, t: `Paid above his value: ${B.abbr} were under the payroll floor` });
      break;
    }
    if (!done) break;
  }
  return n;
}
// v35a (Kenneth: renegotiation): at the end of free agency a team still under the floor uses its cap room to give its own players a raise
// for this season only (real NBA renegotiation; rookie-scale and two-way deals can't be). Best players first. Kenneth's rule holds on the new
// amount: under 60 under $10M, 25-and-under 56-59 at most 2.4x the minimum, 55- at most FLOOR_FILL.lowMax. A minimum deal is raised only in
// its last season (the raise is that season's salary). Later seasons of the deal are unchanged (contract.sched / s0, as real yearly deals).
const FLOOR_RENEGO = { on: true, minRaise: 0.5 };
function floorRenego(L, B) {
  if (!FLOOR_RENEGO.on) return 0;
  const cs = capSeason(L); let gap = floorGap(L, B), room = CAP - payroll(L, B, cs), n = 0, tot = 0;
  if (gap < FLOOR_FILL.minGap) return 0;
  for (const p of rosterOf(L, B).sort((a, b) => b.ovr - a.ovr)) {
    if (gap < FLOOR_FILL.minGap || room < FLOOR_RENEGO.minRaise) break;
    const c = p.contract; if (!c || c.exp < cs || c.type === 'rookie' || p.tw || p.ext) continue;
    const isMin = c.amt <= MINSAL + 1e-9; if (isMin && c.exp !== cs) continue;
    const cur = isMin ? MINSAL : (c.sched && c.s0 != null && c.sched[cs - c.s0] != null ? c.sched[cs - c.s0] : c.amt);
    const lim = p.ovr >= 60 ? maxFor(p) : p.age <= 25 && p.ovr >= 56 ? MINSAL * ASK_YOUNG_X : p.ovr <= 55 ? FLOOR_FILL.lowMax : ASK_REL.u60;
    const to = r1(Math.min(lim, maxFor(p), (isMin ? 0 : cur) + Math.min(Math.max(gap, isMin ? MINSAL + 0.2 : FLOOR_RENEGO.minRaise), room)));   // a minimum deal's cap hit goes from 0 to the new amount
    const before = capHit(L, p, cs);
    if (to < cur + FLOOR_RENEGO.minRaise || to <= MINSAL + 0.15) continue;
    if (isMin) c.amt = to;
    else { if (!(c.sched && c.s0 != null)) { c.s0 = cs; c.sched = []; for (let y = cs; y <= c.exp; y++) c.sched.push(c.amt); } c.sched[cs - c.s0] = to; }
    const add = capHit(L, p, cs) - before; gap -= add; room -= add; tot += add; n++;
    c.reneg = cs; p.tx.push({ s: L.season, t: `Renegotiated: ${B.abbr} raised his ${yr(cs)} salary to ${money(to)} (payroll floor)` });
  }
  if (n) logNews(L, `${B.city} ${B.name} used their cap room to renegotiate ${n} contract${n > 1 ? 's' : ''} (+${money(r1(tot))} this season) to reach the ${money(MINPAY)} payroll floor`, B.id, 'tx');
  return n;
}
function floorFill(L, lastCall) {
  if (!FLOOR_FILL.on || L.phase !== 'off-fa') return;
  for (const B of L.teams.slice().sort((a, b) => payNoFloor(L, a) - payNoFloor(L, b))) {
    if (B.id === L.user || floorGap(L, B) < FLOOR_FILL.minGap) continue;
    if (L.faDay >= FLOOR_FILL.absorbDay && inTradeWindow(L)) { const tr = floorAbsorb(L, B); if (tr) { if (L.mode === 'commish') { tr.when = seasonLabel(L); tr.isNew = true; L.pending.push(tr); } else executeTrade(L, tr); logNews(L, tr.why, tr.b, 'trade'); } }
    if (L.faDay >= FLOOR_FILL.signDay || lastCall) floorSign(L, B, lastCall);
    if (lastCall) floorRenego(L, B);   // v35a
  }
}
function userRosterProblem(L) {
  if (L.user == null) return null;
  const t = L.teams[L.user];
  if (t.roster.length < 13) return `You have ${t.roster.length} players. Sign at least ${13 - t.roster.length} more (minimum contracts don't count against the cap), or use Auto-fill.`;
  if (t.roster.length > 15) return `You have ${t.roster.length} players. Release ${t.roster.length - 15} to get to 15.`;
  return null;
}
function autoFillUser(L) {
  const t = L.teams[L.user];
  let g = 0;
  while (t.roster.length < 13 && g++ < 20) { const c = coverage(L, t); const need = c.findIndex(x => x < 2); const p = bestFA(L, need >= 0 ? need : null); if (!p) { topUpFA(L, 40); continue; } signContract(L, p, t.id, MINSAL, 1, 'signing'); }
}
// v18: retirement tours: some famous veterans (fame 60+, 34+) announce their final season
function farewellTours(L) {
  for (const p of active(L)) if (p.team != null && !p.prospect && (p.fame || 0) >= 60 && p.age >= (NBA_ON ? (p.ovr >= 80 ? 38 : 36) : 34) && !p.tour && R() < (NBA_ON ? 0.3 : 0.4)) { p.tour = L.season; p.tourStops = []; logNews(L, `Farewell tour: ${p.name} (${L.teams[p.team].abbr}) announces this will be his final season`, p.team, 'league'); }
}
function tourNews(L, g) {
  if (g.playoff) return;
  for (const r of g.box) { const p = L.players[r[0]]; if (!p || p.tour !== L.season) continue; const tid = r[1] === 0 ? g.home : g.away, host = g.home;
    if (host !== tid && p.hist.some(h => h.tid === host) && !(p.tourStops || []).includes(host)) { (p.tourStops = p.tourStops || []).push(host); logNews(L, `Farewell tour: ${p.name} gets a standing ovation in his last game at ${L.teams[host].city}, where he used to play (${r[2 + IX.pts]} pts)`, tid, 'game'); } }
}
// ---------- v31: cut players aged 26 or younger go overseas ----------
// At the season-start free-agent cap a young player is not retired: he leaves L.fa, stays in L.players with p.abroad = { s: season he left, n: seasons abroad before this stay }
// and a pipeline club (EABL / APBA, picked in pipeBuild P3). He keeps developing. Each offseason (before free agency) he returns to L.fa if he is worth a look,
// otherwise he stays abroad until 3 seasons abroad in total (p.abroadSeasons carries earlier stays if he is cut again) or age 27, then retires (deleted if he never played).
const ABROAD = { maxAge: 26, seasons: 3, retireAge: 27, minValue: 48, newsOvr: 50 };
const isAbroad = p => !!(p && p.abroad && !p.retired);
function abroadClub(p) { return p && p.club ? pipeTeamName(p.club.lg, p.club.t) : ''; }
function abroadLabel(p) { const c = abroadClub(p); return c ? `Overseas (${c})` : 'Overseas'; }
function sendAbroad(L, p) {
  L.fa = L.fa.filter(id => id !== p.id);
  p.abroad = { s: L.season, n: p.abroadSeasons || 0 }; p.abroadNew = 1;   // n: seasons already abroad on earlier stays (set when he returned); abroadNew: pipeBuild writes the club, transaction and news lines once the club is set
  p.contract = null; p.ext = null; delete p.offer;
}
const abroadValue = (L, p) => 0.6 * teamPotEst(L, null, p).est + 0.4 * p.ovr;   // as aiFillTwoWay (no team: league-wide scouting read)
function abroadOffseason(L) {
  const bl = twBenchLine(L); let back = 0, gone = 0;
  for (const p of Object.values(L.players)) {
    if (!isAbroad(p)) continue;
    const yrs = p.abroad.n + L.season - p.abroad.s + 1;
    const twOK = p.age <= 27 && twSvc(p) < 3 && abroadValue(L, p) >= ABROAD.minValue;
    if (twOK || p.ovr >= bl) {
      p.tx.push({ s: L.season, t: 'Returned from overseas' }); p.abroadSeasons = yrs; delete p.abroad; delete p.club; delete p.abroadNew;
      L.fa.push(p.id); setAsk(L, p); back++;
    } else if (yrs >= ABROAD.seasons || p.age >= ABROAD.retireAge) {
      const played = p.real || p.hist.some(h => h.rs && h.rs.gp > 0);
      delete p.abroad; delete p.club; retirePlayer(L, p, 'overseas'); gone++;
      if (!played) delete L.players[p.id]; else honorRetired(L, p);
    }
  }
  L.abroadLog = (L.abroadLog || []).concat({ s: L.season, back, gone }).slice(-20);
}
// v32h: save pruning at each new season. The per-opponent "this season" line (p.vs[team].cs) is replaced on the first game of a
// season anyway, so a stale one is dropped (it was ~28% of p.vs); retired players drop mood/discipline/daily caches they no longer use.
// Nothing shown in the game is lost.
function pruneSave(L) {
  let n = 0;
  for (const p of Object.values(L.players)) {
    if (p.vs) for (const k in p.vs) { const o = p.vs[k]; if (o && o.cs && o.cs.s !== L.season) { delete o.cs; n++; } }
    if (p.retired) {
      for (const k of ['moraleParts', 'disc', 'dl']) if (p[k] !== undefined) { delete p[k]; n++; }
      if (p.vs) for (const k in p.vs) if (!Array.isArray(p.vs[k])) { p.vs[k] = vsPack(p.vs[k]); n++; }   // career lines vs each team kept, packed (no key names)
    }
  }
  return n;
}
const VS_K = ['gp', 'w', 'min', 'pts', 'fgm', 'fga', 'tpm', 'tpa', 'ftm', 'fta', 'reb', 'ast', 'stl', 'blk', 'tov'], VS_PO = ['gp', 'w', 'min', 'pts', 'reb', 'ast'];
function vsPack(o) { const a = VS_K.map(k => o[k] || 0); if (o.po) a.push(VS_PO.map(k => o.po[k] || 0)); return a; }
function vsUnpack(a) { if (!Array.isArray(a)) return a; const o = {}; VS_K.forEach((k, i) => o[k] = a[i] || 0); if (Array.isArray(a[VS_K.length])) { o.po = {}; VS_PO.forEach((k, i) => o.po[k] = a[VS_K.length][i] || 0); } return o; }
function startNewSeason(L) {
  processPending(L);
  for (const t of L.teams) for (const id of [...t.roster, ...(t.twoWay || [])]) if (L.players[id]) assignNumber(L, L.players[id], t);   // v30 review: clears number clashes in older saves (first listed keeps his)
  autoFillScouts(L);
  if (active(L).some(p => p.unrev)) revealRookies(L);
  if (L.career && typeof careerFaDay === 'function') { try { careerFaDay(L, true); } catch (e) { console.error(e); } }   // My Career: a held free agent signs before rosters are filled
  finalizeRosters(L);
  if (L.user != null) meetPayrollFloor(L, L.teams[L.user]);
  L.season++;
  for (const t of L.teams) if (t.id !== L.user && t.coach) slAdapt(L, t);   // v27 K1: AI coaches lean their sliders toward their roster each summer
  if (L.nba && typeof nbaSchedAmt === 'function') for (const p of active(L)) { nbaSchedAmt(L, p); if (p.uf) { p.uf = 1 + (p.uf - 1) * 0.75; if (Math.abs(p.uf - 1) < 0.03) delete p.uf; } if (p.rmb) { p.rmb *= 0.75; if (Math.abs(p.rmb) < 0.5) delete p.rmb; } }   // R1: real usage fades
  L.day = 0; L.games = []; L.po = null; L.offSummary = null; L.draftOrder = null; L.faDay = null;
  try { pruneSave(L); } catch (e) { }   // v32h
  for (const t of L.teams) { Object.assign(t, { w: 0, l: 0, hw: 0, hl: 0, aw: 0, al: 0, pf: 0, pa: 0, cw: 0, cl: 0, streak: 0, last10: '', trs: null, tpo: null, zr: null, zrOpp: null, pt: null, coachFrom: { w: 0, l: 0 } }); t.dead = (t.dead || []).filter(d => d.exp >= L.season); t.coachOwed = (t.coachOwed || []).filter(d => d.thru >= L.season); }
  L.extPrompt = false; L.offers = []; L.teamOptions = [];
  L.trainReset = L.trainReset || [];   // v25.3: your players whose focus was cleared by a team change (listed at the top of the training check)
  for (const p of active(L)) {
    if (p.focus && p.focusTid !== p.team) { p.focus = null; p.focusTid = null; if (p.team === L.user && L.user != null) { if (!L.trainReset.includes(p.id)) L.trainReset.push(p.id); logNews(L, `Training reset to default for ${p.name} (new team)`, L.user, 'team'); } }
    else if (p.team == null && p.focus) { p.focus = null; p.focusTid = null; }
    if (p.injury > 0) { const se0 = p.injSE; p.injury = Math.max(0, p.injury - (p.injSE ? SE_SUMMER : 28)); if (!p.injury) { p.injLong = false; if (se0) { p.injSE = false; if (p.team != null) logNews(L, `${p.name} is healthy for opening day after his ${(p.injName || 'injury').toLowerCase()}`, p.team, 'inj'); } } else if (p.injSE && p.team != null) logNews(L, `${p.name} starts the season injured: about ${injGames(p)} more games to recover (${(p.injName || 'injury').toLowerCase()})`, p.team, 'inj'); }   // v24.5: season-ending injuries carry over in full
    if (p.injury >= SEASON_GAMES && p.contract && p.contract.amt >= 10) p.capRelief = L.season;
    p.stats = {};
  }
  // trim the free-agent pool: older unsigned players drift into retirement
  for (const id of L.fa.slice()) { const p = L.players[id]; if (p.age >= 33 && !(NBA_ON && p.ovr >= 70) && R() < 0.5) {   // v27 U13: a good NBA player left unsigned waits for a deal instead of retiring
 const played = p.real || p.hist.some(h => h.rs && h.rs.gp > 0); retirePlayer(L, p, 'unsigned'); if (!played) delete L.players[p.id]; else honorRetired(L, p); } }   // v27 N8: unsigned retirees get HOF / jersey review too (Gobert, 4x DPOY, had legacy 0); real players are never deleted
  // v30 review: the cap keeps young two-way prospects (ranked like aiFillTwoWay: 60% potential, 40% overall), so AI teams still have two-way candidates at season start
  if (L.fa.length > 60) { const twV = p => { try { return twEligible(L, p) ? 0.6 * teamPotEst(L, 0, p).est + 0.4 * p.ovr : p.ovr; } catch (e) { return p.ovr; } };
    for (const [p] of L.fa.map(id => L.players[id]).map(p => [p, twV(p)]).sort((a, b) => a[1] - b[1]).slice(0, L.fa.length - 60)) { if (p.age <= ABROAD.maxAge) { sendAbroad(L, p); continue; }   // v31: 26 and under go overseas instead of retiring
      const played = p.real || p.hist.some(h => h.rs && h.rs.gp > 0); retirePlayer(L, p, 'unsigned'); if (!played) delete L.players[p.id]; else honorRetired(L, p); } }
  L.picks = L.picks.filter(k => k.s >= L.season);
  ensurePicks(L);
  for (const t of L.teams) { if (!t.owner) initFinance(L, t); t.fin = newFin(L); t.hype = Math.round((t.hype + (50 - t.hype) * 0.35) * 10) / 10; }
  L.schedule = makeSchedule(L.teams, L.sg || 58, L.season);
  for (const p of active(L)) if (p.fameBase) p.fameBase = Math.round(p.fameBase * 0.75);
  updateFame(L);
  computeModes(L, 'Preseason');
  try { farewellTours(L); } catch (e) { }
  // AI teams release players who can't play at this level (they'd rather use the roster spot)
  for (const t of L.teams) { if (t.id === L.user) continue; for (const p of rosterOf(L, t)) if (p.ovr < 40 && p.age >= 21 && t.roster.length > 13 && !(p.age <= 22 && p.scout >= 60)) release(L, p); }
  for (const t of L.teams) {
    if (!t.sponsor || t.sponsor.exp < L.season) signSponsor(L, t);
    else { // performance clause: the deal moves a little each season with results (within 15% of the signed amount)
      const v = sponsorValue(L, t).amt, b = t.sponsor.orig || t.sponsor.amt; t.sponsor.orig = b;
      t.sponsor.amt = r1(clamp(t.sponsor.amt + (v - t.sponsor.amt) * 0.25, b * 0.85, b * 1.15));
    }
    t.staffBudget = staffBudgetFor(L, t);
  }
  for (const t of L.teams) for (const p of twOf(L, t)) { p.tw.games = 0; p.tw.s = L.season; }
  aiFillTwoWay(L);
  setLgOvr(L);
  try { pipeBuild(L); } catch (e) { console.error('pipeBuild', e); }   // v29 P3: clubs for unsigned free agents, college / club rosters
  L.phase = 'regular';
  try { holdoutCheck(L); } catch (e) { }   // v35a: after the phase turns 'regular', so capSeason is this season (before, it was next season: a holdout raise was checked against the wrong year's hard cap and ran a season too long; v34 S2 TOR $226.4M)
  logNews(L, `The ${yr(L.season)} season begins`, null, 'league');
  try { storyEnd(L); storyStart(L); } catch (e) { }
}

// ---------- Scouting & draft classes ----------
function updateScouting(L) {
  for (const p of active(L)) {
    if (p.prospect) continue;
    const sd = p.age <= 21 ? 5 : p.age <= 24 ? 3 : p.age <= 27 ? 1.5 : 0;
    const est = p.pot + gauss(p.noGrow ? 3 : 0, sd);
    p.scout = Math.round(clamp(p.scout != null ? 0.6 * p.scout + 0.4 * est : est, p.ovr, 99));
    if (p.age >= 28) p.scout = Math.max(p.ovr, Math.round((p.scout + p.pot) / 2));
  }
}
function yearsAhead(L, d) { return d - capSeason(L) + 1; }
function rescoutProspects(L) {
  for (const d in L.classes) for (const id of L.classes[d]) {
    const p = L.players[id]; if (!p) continue;
    const k = yearsAhead(L, +d), sd = [3, 3, 6, 9, 11][Math.min(4, k)], keep = [0.7, 0.7, 0.5, 0.3, 0.2][Math.min(4, k)];
    const est = p.pot + gauss(p.noGrow ? 6 : 0, sd);
    p.scout = Math.round(clamp(keep * p.scout + (1 - keep) * est, p.ovr, 99));
  }
}
// spec: [ovr low, ovr high, pot low, pot high] at draft day
// v25.1: draft-day age by tier. Top prospects are mostly 18-20; the class as a whole is about 25% 18-20, 40% 21-22 and the rest 23-24.
const DRAFT_AGE_W = { gen: [[18, 45], [19, 45], [20, 10]], top: [[18, 12], [19, 30], [20, 28], [21, 18], [22, 9], [23, 3]], first: [[18, 3], [19, 9], [20, 16], [21, 24], [22, 24], [23, 15], [24, 9]], rest: [[19, 4], [20, 8], [21, 19], [22, 21], [23, 26], [24, 22]] };
// ...and a strong age effect on the ceiling: a 23-24 year old is more ready but mostly tops out as a role player
const DRAFT_AGE_POT = { 18: 4, 19: 3, 20: 2, 21: 0.5, 22: -1, 23: -6, 24: -8 }, DRAFT_AGE_OVR = { 18: -2, 19: -1, 20: 0, 21: 0, 22: 1, 23: 2, 24: 3 };
function draftAgeOf(L, p) { return p.dAge != null ? p.dAge : p.prospect ? p.age + Math.max(0, yearsAhead(L, p.draftYear)) : p.age; }
function makeProspect(L, d, tier, T) {
  const k = yearsAhead(L, d);
  const aw = DRAFT_AGE_W[tier] || DRAFT_AGE_W.rest, da = wpick(aw.map(x => x[0]), aw.map(x => x[1]));
  const age = Math.max(16, da - k);
  T = T || { gen: [64, 68, 88, 94], top: [56, 63, 74, 86], first: [44, 54, 62, 78], rest: [32, 48, 46, 70] }[tier];
  let ovrT = rint(T[0], T[1]) + DRAFT_AGE_OVR[da], potT = Math.max(ovrT + 2, rint(T[2], T[3]) + DRAFT_AGE_POT[da]);
  if (da >= 23 && R() > 0.06) potT = Math.min(potT, rint(70, 76));   // a rare older prospect still has a real ceiling
  if (NBA_ON && NBA_PROG.potCut[tier]) potT -= NBA_PROG.potCut[tier];   // v27 P2: NBA-mode classes are thinner in the middle
  potT = Math.max(ovrT + 2, potT);
  const noGrow = false;
  const p = newPlayer(L, pick(POS), (potT - 58) / 9, Math.max(18, da));
  p.age = age; p.dAge = da;
  p.draftOvr = ovrT;
  scaleToOvr(p, ovrT * Math.pow(1 - 0.035, k));
  p.pot = Math.max(potT, p.ovr + 1);
  p.wet = pickWet(p.pot); p.wrk = r99(WET_WRK[p.wet] + gauss(0, 4));   // v24.3: work-ethic tier from his draft-day potential
  { const lim = { early: [22, 25], std: [24, 27], late: [27, 29], long: [25, 27] }[p.traj || 'std']; p.peak = clamp(p.peak, lim[0], lim[1]); }   // v24.3: peak by career trajectory
  p.seen = 0;   // v24.3: a prospect has not been observed in the league yet
  if (tier === 'rest' && R() < 0.035) p.bloom = true;   // hidden late bloomer: a 2nd-rounder or undrafted player who becomes a rotation player or better
  if (noGrow) { p.noGrow = true; p.pot = Math.max(p.ovr + 1, potT); p.peak = da + rint(0, 2); p.regStart = p.peak + rint(1, 3); p.regr = 1.5; p.regrLabel = 'Fast'; }
  setBallDominance(p);
  p.arch = archetypes(p); p.prospect = true; p.draftYear = d; p.tier = tier;
  const sd = [3, 3, 6, 9, 11][Math.min(4, k)];
  p.scout = Math.round(clamp(p.pot + gauss(0, sd), p.ovr, 99));
  return p;
}
// v24.3: a generational talent. Draft-day rating 66-72 (a strong starter at best), potential 94-98, boom path, hard worker. Peaks early (22-25) or has a long, evolving career.
function makeGenerational(L, p) {
  if (!p) return;
  const k = Math.max(0, p.draftYear - L.season), da = p.age + k;
  p.gen = true; p.rocket = R() < 0.5; p.path = 'boom'; p.severe = false; p.bloom = false; p.noGrow = false; delete p.ceil;
  setTraj(p, R() < 0.55 ? 'early' : 'long');
  p.peak = clamp(da <= 20 ? Math.max(p.peak, 23) : Math.max(p.peak, da + 2), 22, 26);   // a 19-year-old takes four years to reach his ceiling: no 85+ before 22
  p.pot = Math.max(p.pot, rint(94, 98));
  p.wet = wpick([3, 4, 5], [25, 45, 30]); p.wrk = r99(WET_WRK[p.wet] + gauss(0, 4));
  p.draftOvr = Math.max(p.draftOvr, rint(66, 72));
  scaleToOvr(p, p.draftOvr * Math.pow(1 - 0.035, k));
  p.pot = Math.max(p.pot, p.ovr + 1); p.arch = archetypes(p); p.scout = Math.round(clamp(p.pot + gauss(0, 3), p.ovr, 99)); p.tier = 'gen';
}
function scaleToOvr(p, target) {
  const lin = o => (o - 55) / 1.6 + 52; // ovr is linear in the weighted attribute average
  for (let i = 0; i < 5; i++) { const f = lin(target) / Math.max(5, lin(ovr(p))); for (const key of PROG_KEYS) p[key] = r99(p[key] * f); assignPositions(p); }
  p.ovr = ovr(p);
}
// A prospect's stock moves a little each year; his ratings track toward his (drifting) draft-day level
function growProspect(L, p) {
  p.age++;
  if (p.career) return;   // My Career: your player grows with XP
  p.draftOvr = clamp(p.draftOvr + gauss(0, 1.6), 25, 74);
  if (!p.noGrow) p.pot = clamp(Math.round(p.pot + gauss(0, 1.5)), Math.round(p.draftOvr) + 1, 97);
  const k = Math.max(0, p.draftYear - L.season);
  scaleToOvr(p, p.draftOvr * Math.pow(1 - 0.035, k));
  if (p.pot <= p.ovr) p.pot = p.ovr + 1;
  p.arch = archetypes(p);
}
// Class types (hidden): loaded, deep but capped, elite few, normal, thin. The same type is less likely two years running.
const CLASS_TYPES = { loaded: 15, deep: 20, elite: 25, normal: 30, thin: 10 };
function pickClassType(L, d) {
  const recent = [d - 1, d - 2].map(x => (L.classType || {})[x]).filter(Boolean);
  const ks = Object.keys(CLASS_TYPES);
  return wpick(ks, ks.map(k => CLASS_TYPES[k] * Math.pow(0.25, recent.filter(r => r === k).length)));
}
function genClass(L, d, force, noGen) {
  const ids = [], type = force || pickClassType(L, d);
  (L.classType = L.classType || {})[d] = type;
  const add = (tier, T, n) => { for (let i = 0; i < n; i++) ids.push(makeProspect(L, d, tier, T).id); };
  if (isBig(L)) {   // v21: 30 teams, 60 picks: bigger and better classes of every type
    if (type === 'loaded') { add('gen', [64, 71, 86, 93], rint(2, 3)); add('top', [62, 67, 80, 87], rint(7, 10)); add('top', [59, 64, 72, 79], rint(9, 12)); add('first', [49, 58, 64, 75], 10); }
    else if (type === 'deep') { add('top', [59, 65, 74, 80], rint(14, 20)); add('first', [49, 58, 64, 75], 12); }
    else if (type === 'elite') { add('gen', [64, 70, 85, 93], rint(3, 7)); add('first', [49, 58, 64, 76], 18); }
    else if (type === 'thin') { add('top', [57, 63, 72, 81], rint(1, 2)); add('first', [47, 56, 62, 73], 18); }
    else { if (!noGen && R() < 0.06) add('gen', [64, 68, 86, 92], 1); add('top', [58, 64, 74, 84], rint(3, 5)); add('first', [48, 57, 64, 76], 20); }
    while (ids.length < 80) add('rest', [38, 52, 50, 72], 1);
  } else if (type === 'loaded') { add('gen', [64, 71, 86, 93], rint(1, 2)); add('top', [60, 65, 78, 85], rint(4, 6)); add('top', [57, 62, 70, 77], rint(5, 7)); add('first', [45, 55, 60, 72], 6); }
  else if (type === 'deep') { add('top', [57, 63, 72, 78], rint(8, 12)); add('first', [45, 55, 60, 72], 6); }
  else if (type === 'elite') { add('gen', [62, 69, 84, 92], rint(2, 5)); add('first', [45, 55, 60, 73], 10); }
  else if (type === 'thin') { add('top', [55, 61, 70, 80], rint(0, 1)); add('first', [43, 52, 58, 70], 10); }
  else { if (R() < 0.04) add('gen', [64, 68, 86, 92], 1); add('top', [56, 62, 72, 83], rint(1, 3)); add('first', [44, 53, 60, 73], 12); }
  while (ids.length < 44) add('rest', null, 1);   // rest: [32, 48, 46, 70]
  L.classes[d] = ids;
  try { pipeAssignClass(L, d, ids); } catch (e) { }   // v29 P1/P2: college years, source mix, team
  // v24.3: about one class in seven has a generational talent (1-2 every 8-10 drafts): a high-talent rookie, not a superstar yet, who peaks early (or has a long, evolving career)
  let genP = null; if (!noGen && R() < 0.14) { genP = ids.map(id => L.players[id]).sort((a, b) => b.pot - a.pot)[0]; makeGenerational(L, genP); }
  try { familyTies(L, ids.map(id => L.players[id])); } catch (e) { }
  const blurb = { loaded: 'loaded at the top and deep behind it', elite: 'top-heavy, with a handful of special talents', deep: 'deep with ready-to-play prospects, if short on stars', thin: 'thin, with few sure things' }[type];
  if (blurb) logNews(L, `Early word on the ${draftLabel(d)} draft class: scouts call it ${blurb}`, null, 'draft');
  if (genP) logNews(L, `Scouts call ${genP.name} (${posLabel(genP)}, age ${genP.age}) a once-in-a-decade talent in the ${draftLabel(d)} draft class`, null, 'draft');
  const top = mockOrder(L, d)[0];
  if (top && !genP && (top.scout >= 86 || top.tier === 'gen')) logNews(L, `Scouts are buzzing about ${top.name} (${posLabel(top)}, age ${top.age}), the top prospect in the ${draftLabel(d)} draft class`, null, 'draft');
}
// a new league always has one strong class in its first two drafts
function initDraftClasses(L) {
  const nba = L.nba && typeof nbaClass2027 === 'function', strong = nba ? L.season + 1 : R() < 0.5 ? L.season : L.season + 1;   // v27 U4: NBA mode starts with the real 2027 class (weak and flat), then a strong 2028
  for (const d of [L.season, L.season + 1, L.season + 2, L.season + 3]) genClass(L, d, nba && d === L.season ? 'normal' : d === strong ? (R() < 0.5 ? 'loaded' : 'elite') : null, nba && d === L.season);   // v29 P1: 4 drafts ahead (was 3)
  if (nba) { nbaClass2027(L); pipeAssignClass(L, L.season, null, true); }   // v29 P2: real 2027 players get their school / club
}
function mockScore(p) { return 0.65 * p.scout + 0.35 * p.ovr; }
// Three draft outlets, each with its own lean and its own misses; the consensus is the average of their ranks.
const OUTLETS = [
  { k: 'hi', name: 'Hoops Insider', short: 'HI', lean: 'Leans on current production and readiness' },
  { k: 'ur', name: 'The Upside Report', short: 'UR', lean: 'Leans on ceiling and youth' },
  { k: 'cd', name: 'Courtside Daily', short: 'CD', lean: 'Mocks team by team, by projected order and needs' }];
const MOCK_CACHE = new WeakMap();
function mockBucket(L) { return L.phase === 'regular' ? Math.floor(L.day / 14) : L.phase === 'playoffs' || L.phase === 'regular-done' || L.phase === 'season-done' ? 40 : 60; }
// projected order of teams for a draft: the real order once set, otherwise worst record (or weakest roster) first
function projTeamOrder(L, d) {
  if (d === L.season && L.draftOrder && L.draftOrder.length) return L.draftOrder.filter(o => !o.pid).map(o => o.owner);
  const key = t => { const g = t.w + t.l; return g >= 10 ? t.w / g : teamStrength(L, t) / 100; };
  const ord = L.teams.slice().sort((a, b) => key(a) - key(b)).map(t => t.id);
  return [...ord, ...ord];
}
function mockSet(L, d) {
  const ids = (L.classes[d] || []).filter(id => L.players[id]);
  const bucket = mockBucket(L), key = `${d}|${L.season}|${L.phase}|${bucket}|${ids.length}|${L.draftIdx || 0}|${L.combine && L.combine[d] ? 1 : 0}`;
  let m = MOCK_CACHE.get(L); if (!m) { m = new Map(); MOCK_CACHE.set(L, m); }
  if (m.has(key)) return m.get(key);
  if (m.size > 40) m.clear();
  const ps = ids.map(id => L.players[id]);
  const k = Math.max(0, d - capSeason(L) + 1), sd = [1.2, 2, 3.2, 4.5, 5][Math.min(4, k)];
  const noise = (p, i) => (0.75 * hgauss(p.id, 7001 * (i + 1) + d * 13) + 0.66 * hgauss(p.id, 7001 * (i + 1) + d * 13 + 97 * (bucket + 1) + L.season * 1009)) * sd;
  const cb = typeof cmbBoost === 'function' ? p => cmbBoost(L, p) : () => 0;   // draft combine
  const mo = p => ovrRead(L, null, p);
  const hi = ps.map(p => [p, 0.5 * p.scout + 0.5 * mo(p) + youthB(L, p, 0.8) + noise(p, 0) + cb(p)]).sort((a, b) => b[1] - a[1]).map(x => x[0].id);
  const ur = ps.map(p => [p, 0.8 * p.scout + 0.2 * mo(p) + youthB(L, p, 1.5) + noise(p, 1) + cb(p)]).sort((a, b) => b[1] - a[1]).map(x => x[0].id);
  // Courtside Daily: walk the projected order, each team taking the best player for its needs
  const base = new Map(ps.map(p => [p.id, 0.65 * p.scout + 0.35 * mo(p) + youthB(L, p, 1.0) + noise(p, 2) + cb(p)]));
  const left = new Set(ps.map(p => p.id)), cd = [], needsOf = {};
  for (const tid of projTeamOrder(L, d)) {
    if (!left.size) break;
    const t = L.teams[tid]; const nd = needsOf[tid] = needsOf[tid] || teamNeeds(L, t);
    let best = null, bv = -1e9;
    for (const id of left) { const p = L.players[id]; let m2 = 0; for (const a of p.arch || []) m2 = Math.max(m2, nd[a.p + '|' + a.n] || 0); const v = base.get(id) + m2 * 3; if (v > bv) { bv = v; best = id; } }
    cd.push(best); left.delete(best);
  }
  cd.push(...[...left].sort((a, b) => base.get(b) - base.get(a)));
  const lists = [hi, ur, cd], ranks = lists.map(l => { const r = {}; l.forEach((id, i) => r[id] = i + 1); return r; });
  const cons = ps.slice().sort((a, b) => (ranks[0][a.id] + ranks[1][a.id] + ranks[2][a.id]) - (ranks[0][b.id] + ranks[1][b.id] + ranks[2][b.id]) || mockScore(b) - mockScore(a)).map(p => p.id);
  const out = { lists, ranks, cons, consRank: Object.fromEntries(cons.map((id, i) => [id, i + 1])) };
  m.set(key, out); return out;
}
// consensus mock (used everywhere a single mock rank is needed)
function mockOrder(L, d) { return mockSet(L, d).cons.map(id => L.players[id]); }
// ranks for a player in each outlet's mock (frozen at the start of the draft for this year's class)
function mockRanksOf(L, p) {
  const d = p.draftYear;
  if (d === L.season && L.phase === 'off-draft' && L.mockRanks) return { o: L.mockRanks.map(r => r[p.id] || null), c: (L.mockRank || {})[p.id] || null };
  const ms = mockSet(L, d); return { o: ms.ranks.map(r => r[p.id] || null), c: ms.consRank[p.id] || null };
}
function hypedClass(L, d) { const top = mockOrder(L, d == null ? L.season : d)[0]; return !!top && (top.scout >= 86 || top.ovr >= 63); }
function compFor(L, p) {
  const key = p.arch && p.arch[0] ? p.arch[0].p + '|' + p.arch[0].n : null;
  const pool = active(L).filter(x => x.team != null && !x.prospect && x.id !== p.id);
  let same = pool.filter(x => x.arch && x.arch.some(a => a.p + '|' + a.n === key));
  if (!same.length) same = pool.filter(x => x.pos === p.pos);
  return same.sort((a, b) => Math.abs(a.ovr - p.scout) - Math.abs(b.ovr - p.scout))[0] || null;
}

// ---------- Coaches ----------
// Coach salaries are paid by the team but sit outside the player salary cap.
// Value: overall rating, honors (titles, Coach of the Year, playoff wins), career winning percentage, and how his systems fit the roster.
function coachValue(L, c, t) {
  let v = 1.2 * Math.exp((c.ovr - 60) / 11);
  const g = c.w + c.l;
  if (g >= SEASON_GAMES) v *= 1 + clamp((c.w / g - 0.5) * 1.0, -0.25, 0.3);
  v *= 1 + Math.min(3, c.titles || 0) * 0.15 + Math.min(3, c.coy || 0) * 0.06 + Math.min(30, c.pw || 0) * 0.006;
  if (t) v *= 1 + clamp((coachFitScore(L, t, c) - 60) / 60, -0.15, 0.2);
  return clamp(r1(v), 0.5, 15);
}
function coachYears(c) { return c.age >= 62 ? rint(1, 2) : c.ovr >= 72 ? rint(3, 5) : rint(2, 4); }
function coachStartSeason(L) { return L.phase.startsWith('off') || L.phase === 'season-done' ? L.season + 1 : L.season; }
// A coach can only be fired in the last year of his contract (or once it has run out)
// Coaches can be fired any time outside the playoffs; the money still owed counts against the staff budget
function canFireCoach(L, c) { return true; }
function coachYrsLeft(L, c) { return c.contract ? Math.max(0, c.contract.exp - coachStartSeason(L) + 1) : 0; }
// Longer deals mean job security, so coaches take a little less per year for them
function coachAmtFor(L, c, t, yrs) { return clamp(r1(coachValue(L, c, t) * (1 - 0.03 * (yrs - 2))), 0.5, 15); }
function giveCoachContract(L, c, t, from, yrsWanted) {
  from = from == null ? coachStartSeason(L) : from;
  const yrs = yrsWanted || coachYears(c);
  c.contract = { amt: coachAmtFor(L, c, t, yrs), yrs, from, exp: from + yrs - 1, tid: t.id };
  (c.contracts = c.contracts || []).push({ s: from, tid: t.id, amt: c.contract.amt, yrs });
}
// Preseason expectations: where each roster ranks decides the win% the front office expects
function setExpectations(L) {
  const ranks = L.teams.map(t => t.id).sort((a, b) => teamStrength(L, L.teams[b]) - teamStrength(L, L.teams[a]));
  for (const t of L.teams) { t.expW = Math.round((0.72 - ranks.indexOf(t.id) * 0.45 / Math.max(1, L.teams.length - 1)) * 1000) / 1000;   /* v22 fix: scaled to league size (30-team leagues went negative) */ t.expMode = t.mode; t.expRank = ranks.indexOf(t.id) + 1; }
}
// Pressure on a coach after a finished season (0 = safe, ~0.85 = almost certainly gone)
function coachHeat(L, t, c) {
  const g = t.w + t.l, wp = g ? t.w / g : 0.5, ex = t.expW != null ? t.expW : 0.5, perf = wp - ex;
  const po = poResult(L, t.id), madePO = !/Missed|play-in/.test(po);
  let h = Math.max(0, -perf - 0.05) * 5;
  if (!madePO && t.expMode === 'contend') h += 0.3; else if (!madePO && t.expMode === 'hopeful') h += 0.1;
  const mine = (c.seasons || []).filter(x => x.tid === t.id && !x.mid);
  let streak = 0; for (let i = mine.length - 1; i >= 0; i--) { const x = mine[i]; if (x.exp != null && x.w / Math.max(1, x.w + x.l) - x.exp < -0.05) streak++; else break; }
  h += Math.max(0, streak - 1) * 0.15;
  const stint = c.stints[c.stints.length - 1];
  if (L.season - stint.from + 1 <= 1) h -= 0.25;                       // first year on the job
  if (mine.some(x => x.s >= L.season - 2 && x.po === 'Champion')) h -= 0.6;
  else if (mine.some(x => x.s >= L.season - 1 && x.po === 'Lost in Finals')) h -= 0.25;
  if (perf > 0.05) h -= 0.2;
  h -= coachYrsLeft(L, c) * 0.08;                                        // money still owed buys patience
  return clamp(h, 0, 0.85);
}
// Take a coach off a team: partial-season record, money still owed, back to the pool
function fireCoach(L, t) {
  const c = t.coach, st = c.stints[c.stints.length - 1];
  st.to = L.season;
  if (L.phase === 'regular' || L.phase === 'regular-done') {
    const cf = t.coachFrom || { w: 0, l: 0 };
    (c.seasons = c.seasons || []).push({ s: L.season, tid: t.id, w: t.w - cf.w, l: t.l - cf.l, po: 'Fired during season', mode: t.mode, exp: t.expW, mid: true });
  }
  const left = coachYrsLeft(L, c);
  if (left > 0 && !c.interim) (t.coachOwed = t.coachOwed || []).push({ cid: c.id, name: c.name, amt: c.contract.amt, thru: c.contract.exp });
  // owners don't like paying two coaches: firing one with 2+ years left costs trust
  if (left >= 2 && !c.interim && t.owner) { t.owner.trust = Math.max(0, t.owner.trust - 4); t.owner.fireCost = (t.owner.fireCost || 0) + 4; }
  t.coachFired = L.season;
  c.contract = null;
  if (c.interim) { c.interim = false; }
  L.coachPool.push(c);
  return left;
}
// An assistant promoted as interim head coach: cheap, short deal, owed nothing when replaced
function makeInterim(L, t) {
  const c = genCoach(usedNames(L), true); c.interim = true; c.age = rint(34, 48);
  L.coachPool.push(c); return c;
}
// Best coach a team can afford; falls back to an interim if dead money leaves no room
function affordableCoach(L, t, excludeId) {
  const yrs = 2, ok = L.coachPool.filter(c => c.id !== excludeId && !c.user && !c.interim && canAffordStaff(L, t, 'coach', coachAmtFor(L, c, t, yrs)));
  return ok.sort((a, b) => (b.ovr + coachFitScore(L, t, b) * 0.3) - (a.ovr + coachFitScore(L, t, a) * 0.3))[0] || null;
}
// AI patience: results below expectations (not just a better coach on the market), a grace season for new coaches,
// one change a season, and a replacement that fits the staff budget and is no worse
function aiWillFire(L, t, c, heat) {
  const g = t.w + t.l, wp = g ? t.w / g : 0.5, perf = wp - (t.expW != null ? t.expW : 0.5);
  const po = poResult(L, t.id), missed = /Missed|play-in/.test(po);
  if (t.coachFired === L.season) return false;
  const firstYear = c.stints[c.stints.length - 1].from >= L.season;
  if (firstYear && perf > -0.15) return false;
  if (!(perf < -0.05 || (missed && t.expMode === 'contend'))) return false;
  const nc = affordableCoach(L, t, c.id);
  if (!nc || nc.ovr < c.ovr - 2) return false;
  return R() < heat;
}
function coachOffseason(L) {
  const notes = [];
  const all = [...L.teams.map(t => t.coach), ...L.coachPool];
  for (const c of all) {
    c.age++;
    for (const k of ['ro', 'rd', 'rdev']) {
      if (c.age <= 45) c[k] = Math.min(c.pot + 3, r99(c[k] + rnd(0, 3)));
      else if (c.age <= 58) c[k] = r99(c[k] + rnd(-1, 1.2));
      else c[k] = r99(c[k] - rnd(0, 2));
    }
    coachDerive(c);
  }
  for (const t of L.teams) if (t.id !== L.user && !t.coach.user) { const m = coachEvolve(L, t.coach, t); if (m) notes.push(m); }   // v27 S1 (your coach's sliders stay yours)
  for (const c of L.coachPool) if (!c.user) coachEvolve(L, c, null);
  L.coachPool = L.coachPool.filter(c => { const gone = !c.user && c.age >= 68 || (c.age >= 63 && R() < 0.25); if (gone && c.stints.length) { c.retired = L.season; (L.coachArchive = L.coachArchive || []).push(c); } return !gone; });
  for (const t of L.teams) {
    const c = t.coach;
    const retiring = !c.user && (c.age >= 68 || (c.age >= 64 && R() < 0.2));
    const expiring = !c.contract || c.contract.exp <= L.season;
    if (t.id === L.user && !retiring) {
      // your coach: an expiring deal is renewed at his current value (you can still fire him any time outside the playoffs)
      if (expiring) { c.interim = false; giveCoachContract(L, c, t, L.season + 1); notes.push(`${t.abbr} renewed ${c.name}'s contract: ${c.contract.yrs} yr, ${money(c.contract.amt)}/yr`); }
      continue;
    }
    const heat = retiring ? 1 : coachHeat(L, t, c);
    let gone = retiring || aiWillFire(L, t, c, heat);
    if (!gone && expiring) {
      if (heat < 0.35 && R() < 0.85) { c.interim = false; giveCoachContract(L, c, t, L.season + 1); notes.push(`${t.abbr} re-signed ${c.name}: ${c.contract.yrs} yr, ${money(c.contract.amt)}/yr`); continue; }
      gone = true;
    }
    if (!gone) continue;
    if (retiring) { c.stints[c.stints.length - 1].to = L.season; c.contract = null; c.retired = L.season; (L.coachArchive = L.coachArchive || []).push(c); notes.push(`${c.name} retired as ${t.abbr} coach`); }
    else { const why = expiring ? `${t.abbr} let ${c.name}'s contract run out` : `${t.abbr} fired ${c.name}`; fireCoach(L, t); notes.push(why); }
    const nc = affordableCoach(L, t, c.id) || makeInterim(L, t);
    if (nc.interim && nc.mentor == null && !retiring) caMentor(L, nc, c);   // v27 S1: his assistant
    hireCoach(L, t.id, nc.id, true, nc.interim ? 1 : null);
    notes.push(nc.interim ? `${t.abbr} promoted assistant ${nc.name} to head coach (staff budget is tight)` : `${t.abbr} hired ${nc.name}: ${nc.contract.yrs} yr, ${money(nc.contract.amt)}/yr`);
  }
  caRefill(L, notes);   // v27 S1: ex-players first, then new coaches (some from a head coach's staff)
  for (const n of notes) logNews(L, n, null, 'coach');
  return notes;
}
// In-season changes are rare: only a team expected to make the playoffs that is far below expectations and out of the
// playoff picture, checked at the 35%, 50% and 65% marks, and never more than two in a season. Many seasons have none.
function inSeasonCoachCheck(L) {
  const T = totalDays(L);
  if (![0.2, 0.4, 0.6].some(f => L.day === Math.floor(T * f))) return;
  L.midFires = L.midFires || {};
  for (const t of L.teams) {
    if (t.id === L.user) continue;
    const c = t.coach, g = t.w + t.l;
    const gap = g ? (t.expW != null ? t.expW : 0.5) - t.w / g : 0;
    // a warning at each check-in where the team is well below expectations and out of the playoff picture
    const behind = g >= 8 && gap >= 0.15 && seedOrder(L, t.conf).indexOf(t.id) >= 5;
    t.coachWarn = behind ? (t.coachWarn || 0) + 1 : 0;
    if ((L.midFires[L.season] || 0) >= 2) continue;
    if (t.coachWarn < 2 || !(t.expMode === 'contend' || t.expMode === 'hopeful')) continue;
    if (t.coachFired === L.season) continue;                             // one change a season
    if (c.stints[c.stints.length - 1].from >= L.season) continue;      // gets at least a full season
    if ((c.seasons || []).some(x => x.tid === t.id && x.s >= L.season - 2 && x.po === 'Champion')) continue;
    const nc0 = affordableCoach(L, t, c.id); if (!nc0 || nc0.ovr < c.ovr - 2) continue;
    if (R() >= Math.min(0.6, (0.1 + (gap - 0.2) * 2) * (1 + (t.hot || 0) / 100))) continue;   // v26.6 R6: the hot seat raises the odds (up to 2x)
    const old = c.name, rec = `${t.w}-${t.l}`;
    fireCoach(L, t);
    const nc = nc0;
    hireCoach(L, t.id, nc.id, true);
    L.midFires[L.season] = (L.midFires[L.season] || 0) + 1;
    logNews(L, flL(L, 'news.coachFiredHot', { team: `${t.city} ${t.name}`, old, rec, new: nc.name }), t.id, 'coach');
  }
}
function coachFitScore(L, t, c) { const ps = rosterOf(L, t).sort((a, b) => b.ovr - a.ovr).slice(0, 8); return ps.reduce((a, p) => a + fit(p, c), 0) / Math.max(1, ps.length); }
function pickCoachFor(L, t, excludeId) { return L.coachPool.filter(c => c.id !== excludeId && !c.user).sort((a, b) => (b.ovr + coachFitScore(L, t, b) * 0.3) - (a.ovr + coachFitScore(L, t, a) * 0.3))[0]; }
function findCoach(L, id) { for (const t of L.teams) if (t.coach.id === id) return t.coach; return L.coachPool.find(c => c.id === id) || (L.coachArchive || []).find(c => c.id === id) || null; }
// silent = the old coach was already removed (AI moves); otherwise this fires the current coach first (your moves)
function hireCoach(L, tid, coachId, silent, yrs) {
  if (L.teams[tid]) L.teams[tid].coachSince = capSeason(L);
  if (tid === L.user && L.me) { L.me.hires = (L.me.hires || []).concat(L.season).filter(s => s >= L.season - 1); if (L.me.hires.length >= 3) unlock(L, 'door'); }
  const t = L.teams[tid], nc = L.coachPool.find(c => c.id === coachId); if (!nc) return 'That coach is no longer available.';
  yrs = nc.interim ? 1 : yrs || coachYears(nc);
  if (!silent && L.phase === 'playoffs') return 'Coaching changes have to wait until the playoffs are over.';
  if (!silent && !nc.interim && !canAffordStaff(L, t, 'coach', coachAmtFor(L, nc, t, yrs || coachYears(nc)))) return `${nc.name} doesn't fit your staff budget (${money(staffRoom(L, t, 'coach'))} of room).`;
  const old = t.coach;
  if (!silent) { const left = fireCoach(L, t); logNews(L, flL(L, 'news.coachFired', { team: t.abbr, old: old.name, how: nc.interim ? 'promoted assistant' : 'hired', new: nc.name, note: left >= 2 && !old.interim ? ' (the owner wasn\'t thrilled about paying two coaches)' : '' }), tid, 'coach'); }
  L.coachPool = L.coachPool.filter(c => c.id !== coachId);
  const from = coachStartSeason(L);
  nc.stints.push({ tid, from });
  giveCoachContract(L, nc, t, from, nc.interim ? 1 : yrs);
  if (nc.interim) { nc.contract.amt = INTERIM_PAY; if (L.phase === 'regular' || L.phase === 'regular-done') nc.contract.exp = L.season; }
  t.coach = nc;
  t.coachFrom = L.phase === 'regular' || L.phase === 'regular-done' ? { w: t.w, l: t.l } : { w: 0, l: 0 };
  return null;
}
// Bring older saves up to date: playoff consistency, split names, coach contracts, expectations
// v22: give a 30-team league its divisions, with a little starting rivalry heat between division teams
function setupDivisions(L) {
  if (!isBig(L) || L.divsDone) return;
  L.divsDone = true;
  for (const t of L.teams) t.div = t.div || divOf(t.abbr);
  for (const a of L.teams) for (const b of L.teams) if (a.id < b.id && a.div && a.div === b.div) { const r = h2h(L, a.id, b.id); r.heat = r1(Math.max(r.heat, 2)); r.div = true; }
}
// v26.6: season length. Old saves keep 58; the two-way game limit scales with it (20 of 58 -> 28 of 82)
// v27: money rules. NBA mode uses the 2026-27 CBA (claude/nba/cba-2026-27.md): cap 165.0, tax 200.4, second apron 221.7 as the hard line,
// floor 148.5, non-taxpayer MLE 15.0; teams spend about 115% of the cap; media money scaled so payrolls stay affordable.
function setEconomy(L) {
  NBA_ON = !!(L && L.nba);
  if (NBA_ON) { CAP = 165.0; MINSAL = 1.3; MINPAY = 148.5; TAXLINE = 200.4; APRON = 221.7; MLE = 15.0; SPEND_K = 1.15; MEDIA = 150; }   // v36a part 3: MEDIA 142 -> 150 (payroll +$9M a team in part 2; 1-5 owners below $0 every season)
  else { CAP = 150; MINSAL = 1; MINPAY = 120; TAXLINE = 160; APRON = 170; MLE = 8; SPEND_K = 0.93; MEDIA = 98; }
  if (typeof nbaApply === 'function') nbaApply(L);
}
function setSeasonLen(L) { if (!SG_OPTS.includes(L.sg)) L.sg = 58; SEASON_GAMES = L.sg; TW_GAMES = gpq(20); YEAR0 = L.y0 != null ? L.y0 : 1999; DRAFT_OFF = L.y0 != null ? 1 : 0; setEconomy(L); }   // v26.6b: base year too; v27: money rules
// v26.6b NBA calendar (leagues with L.y0): regular season Oct 20 -> Apr 11 (2026-27 dates), sim days spread evenly over it. Returns { y, m (0-11), d, label: 'Oct 20, 2026' } or null (old saves)
const MON = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'], NBA_CAL = { open: [9, 20], end: [3, 11] };
function dayDate(L, day) {
  if (L.y0 == null) return null;
  const y = yr(L.season), a = Date.UTC(y, NBA_CAL.open[0], NBA_CAL.open[1]), b = Date.UTC(y + 1, NBA_CAL.end[0], NBA_CAL.end[1]), D = Math.max(2, (L.schedule || []).length);
  const t = new Date(a + (b - a) * clamp(day == null ? L.day : day, 0, D - 1) / (D - 1));
  return { y: t.getUTCFullYear(), m: t.getUTCMonth(), d: t.getUTCDate(), label: `${MON[t.getUTCMonth()]} ${t.getUTCDate()}, ${t.getUTCFullYear()}` };
}
function migrateLeague(L) {
  setSeasonLen(L);
  if (!L.arch35) { NBA_ON = !!L.nba; for (const p of Object.values(L.players)) if (p && p.pos != null && p.t3 != null) { try { p.arch = archetypes(p); } catch (e) { } } L.arch35 = 1; }   // v35: new archetypes, superstar types and playstyles
  if (!L.askRef) { L.askRef = { f: ASK_REF0[L.nba ? 'nba' : 'pbl'].slice(), q0: ASK_REL.q.slice(), s: 0 }; }   // v33b: saves from before the league-relative asks
  if (!L.advFill) { try { advBackfill(L); } catch (e) { console.error('advBackfill', e); } L.advFill = 1; }   // v33c: PER / WS for sim seasons played before v33c
  setupDivisions(L);
  migrateTraits(L);   // v25.9
  if (L.picks) ensurePicks(L);   // v26.2: older saves get the 6-year window
  migrateV265(L);   // v26.5: front-office patience / ambition, feed, media reputation
  try { pipeMigrate(L); } catch (e) { console.error('pipeMigrate', e); }   // v29
  if (!L.v16) { L.v16 = true; for (const p of Object.values(L.players)) if (!p.retired && !p.prospect && p.age >= 30 && p.iq >= 50 && p.pers !== 'Mentor' && hrand(p.id, 1616, 3) < 0.35) p.pers = 'Mentor'; }
  for (const p of Object.values(L.players)) {
    if (p.poc == null) p.poc = genPoc();
    if (p.first == null || p.last == null) { const [f, l] = splitName(p.name); p.first = f; p.last = l; }
  }
  if (L.teams.some(t => t.expW == null)) setExpectations(L);
  for (const t of L.teams) {
    t.coachOwed = t.coachOwed || []; if (!t.coachFrom) t.coachFrom = { w: 0, l: 0 };
    const c = t.coach;
    if (!c.contract && L.season === 1 && L.day === 0 && !L.history.length) giveCoachContract(L, c, t, 1, rint(1, 2));    // new league: short deals
    else if (!c.contract) { giveCoachContract(L, c, t, Math.max(1, L.season - rint(0, 1))); c.contract.exp = Math.max(c.contract.exp, L.season + rint(0, 2)); }
  }
  L.midFires = L.midFires || {};
  L.feats = L.feats || { rs: {}, po: {} }; L.featsBy = L.featsBy || {};
  if (!L.pr) updatePowerRankings(L);
  for (const p of Object.values(L.players)) if (p.morale == null) p.morale = 60;
  L.scoutPool = L.scoutPool || [];
  for (const t of L.teams) if (!t.scout && !(t.id === L.user && scoutWindow(L))) { t.scout = genScout(L); t.scout.tid = t.id; }
  while (L.scoutPool.length < 6) L.scoutPool.push(genScout(L, R() < 0.5));
  L.myBoard = L.myBoard || {};
  for (const t of L.teams) initFinance(L, t);
  syncIds(L);
  if (!L.v13c) { ensureAgents(L); for (const p of Object.values(L.players)) if (!p.retired && p.agent == null) giveAgent(L, p); L.v13c = true; }
  if (!L.v251ag) {   // v25.1: older saves had 12 agents of one kind: the 3 with the most stars become power brokers, the rest mid-size, and new boutique and youth agencies take the overflow
    const n = agentCounts(L), stars = {}; for (const p of Object.values(L.players)) if (!p.retired && !p.prospect && p.ovr >= 78 && p.agent != null) stars[p.agent] = (stars[p.agent] || 0) + 1;
    const ord = L.agents.filter(a => !a.kind).sort((a, b) => (stars[b.id] || 0) - (stars[a.id] || 0));
    ord.forEach((a, i) => { a.kind = i < (isBig(L) ? 3 : 2) ? 'power' : 'mid'; if (a.kind === 'power' && !a.fav) { const ids = L.teams.map(t => t.id).sort(() => R() - 0.5); a.fav = ids.slice(0, 2); a.feud = ids.slice(2, 2 + rint(1, 2)); } });
    const N = Object.values(n).reduce((x, y) => x + y, 0), cap = () => L.agents.reduce((s, a) => s + (agKind(a).lo + agKind(a).hi) / 2, 0);
    let k = 0; while (cap() < N && k++ < 60) newAgent(L, k % 5 < 3 ? 'boutique' : 'youth');
    for (let r = 0; r < 3; r++) agentOffseason(L);
    L.v251ag = true;
  }
  if (!L.v11b) {
    for (const t of L.teams) { t.twoWay = t.twoWay || []; t.scoutAssign = t.scoutAssign || []; t.interviews = t.interviews || {}; if (t.scout && t.scout.bias === undefined) t.scout.bias = pickBias(); }
    for (const s of L.scoutPool || []) if (s.bias === undefined) s.bias = pickBias();
    L.v11b = true;
  }
  for (const s of [...(L.scoutPool || []), ...L.teams.map(t => t.scout).filter(Boolean)]) if (s.pro == null) s.pro = scoutProOf(s);   // v34: directors' pro rating
  if (!L.v11a) { for (const p of Object.values(L.players)) if (!p.retired) { addTendencies(p); if (!p.prospect) p.arch = archetypes(p); } L.v11a = true; }
  if (!L.v10b) {
    // established stars start with a known name; everyone gets a fame score
    for (const p of active(L)) if (!p.prospect && p.fameBase == null) p.fameBase = !L.history.length ? Math.max(0, Math.round((p.ovr - 72) * 4)) : 0;
    updateFame(L);
    L.v10b = true;
  }
  if (!L.v243) {   // v24.3: hidden work-ethic and injury-proneness tiers, career trajectories and seasons observed
    for (const p of Object.values(L.players)) {
      if (p.wet == null) p.wet = p.wrk < 40 ? 0 : p.wrk < 52 ? 1 : p.wrk < 66 ? 2 : p.wrk < 78 ? 3 : p.wrk < 90 ? 4 : 5;
      if (p.ipt == null) p.ipt = p.dur >= 80 ? 0 : p.dur >= 58 ? 1 : p.dur >= 40 ? 2 : 3;
      if (p.rvl == null && p.rvlW == null) p.rvl = 3 + (p.id % 2);
      if (p.seen == null) p.seen = p.prospect ? 0 : (p.svc || 0);
      if (!p.traj) p.traj = p.peak >= 27 ? 'late' : p.peak <= 25 ? 'early' : 'std';
    }
    L.v243 = true;
  }
  if (!L.v2451) {   // v24.5.1: season-ending injuries capped at 80 games; a promise outranked by its season's goal is dropped
    for (const p of Object.values(L.players)) if (p.injSE && p.injury > SE_CAP) p.injury = SE_CAP;
    for (const t of L.teams) { const e = t.owner && t.owner.esc; if (e && e.s === L.season && t.owner.goal && !t.owner.goal.esc && goalRank(e.goal) < goalRank(t.owner.goal)) t.owner.esc = null; }
    L.v2451 = true;
  }
  if (!L.v249) {   // v24.9: AI teams' players start with a training focus (yours start balanced)
    for (const p of Object.values(L.players)) if (!p.retired && !p.prospect && p.team != null && p.team !== L.user && p.focus == null) p.focus = aiFocus(L, p);
    L.v249 = true;
  }
  if (!L.v253) {   // v25.3: a focus remembers the team that set it (no resets on first load)
    for (const p of Object.values(L.players)) if (!p.retired && p.focus && p.focus !== 'bal') p.focusTid = p.team;
    L.v253 = true;
  }
  if (!L.v246) {   // v24.6: the league's first GMs get a back-dated start (0-5 years) so playoff clocks don't line up; droughts already counted stay
    for (const t of L.teams) if (t.id !== L.user && t.gm && (t.gm.since == null || t.gm.since === 1)) t.gm.since = 1 - rint(0, 5);
    L.v246 = true;
  }
  if (!L.v244) {   // v24.4: separate reveal timing (work ethic 4-6 seasons, injury-proneness 5-7); a trait already revealed in v24.3 stays revealed
    for (const p of Object.values(L.players)) {
      if (p.rvlW != null) continue;
      const old = p.rvl || 3, was = (p.seen || 0) >= old;
      p.rvlW = Math.max(4 + (old - 3), rint(4, 6)); p.rvlI = Math.max(5 + (old - 3), rint(5, 7));
      if (was) { p.knW = true; p.knI = true; }
      delete p.rvl;
    }
    L.v244 = true;
  }
  if (!L.v10a) {
    for (const p of Object.values(L.players)) {
      if (!p.path) p.path = devPath();
      if (p.athAge == null) p.athAge = clamp((p.regStart || 30) - rint(1, 2), 28, 32);
      if (!p.prospect && !p.retired && p.ceil == null) setCeil(p);
      if (p.retired) compactRetired(p); else for (const h of p.hist || []) { if (h.rsT && Object.keys(h.rsT).length <= 1) h.rsT = null; if (h.poT && Object.keys(h.poT).length <= 1) h.poT = null; }
    }
    L.v10a = true;
  }
  if (!L.calYears) {
    const fix = s => typeof s === 'string' ? s.replace(/^Year (\d{1,3}) begins$/, (m, n) => `The ${yr(+n)} season begins`).replace(/\bYear (\d{1,3})\b/g, (m, n) => yr(+n)).replace(/\bY(\d{1,3})\b/g, (m, n) => yr(+n)) : s;
    for (const x of L.log || []) x.text = fix(x.text);
    for (const p of Object.values(L.players)) for (const x of p.tx || []) x.t = fix(x.t);
    L.calYears = true;
  }
  if (L.teams.some(t => !t.owner.goal)) setOwnerGoals(L);
  if (L.mode === 'team' && !L.me) L.me = { name: 'You', stints: L.user != null ? [{ tid: L.user, from: 1 }] : [], hist: [], fired: 0 };
  if (L.me && !L.me.timeline) { L.me.timeline = []; L.me.ach = L.me.ach || {}; const s0 = L.me.stints[0]; if (s0) L.me.timeline.push({ s: s0.from, t: `Took over as general manager of the ${L.teams[s0.tid].city} ${L.teams[s0.tid].name}`, k: 'job' }); }
  if (L.teams.some(t => t.expRank == null)) setExpectations(L);
  L.gmPool = L.gmPool || []; L.openings = L.openings || []; L.jobOffers = L.jobOffers || [];
  if (L.teams.some(t => t.id !== L.user && !t.tstat)) refreshTradeStatus(L);
  if (L.nba && (L.legV || 0) < 37 && typeof nbaLegBaseAll === 'function') nbaLegBaseAll(L);   // v37b: real playoffs + role players' real seasons in legacy
  if (!L.fr && L.teams && L.teams.length && Object.keys(L.players).length > 100) { try { setupFriends(L); } catch (e) { L.fr = {}; } }   // v37: friendships for old saves and new leagues
  return L;
}

// ---------- Rivalries ----------
const RIVAL_BASE = [['MNL', 'ANT'], ['MNL', 'BAT'], ['BAG', 'VIG'], ['TAG', 'BAT'], ['ANG', 'MNL'], ['LGZ', 'TAG'], ['CEB', 'BAC'], ['ILO', 'BAC'], ['CEB', 'TAC'], ['DAV', 'GSC'], ['CDO', 'ZAM'], ['DAV', 'CDO'], ['CEB', 'DAV']];
function h2hKey(a, b) { return a < b ? a + '-' + b : b + '-' + a; }
function h2h(L, a, b) {
  const k = h2hKey(a, b);
  if (!L.h2h[k]) {
    const A = L.teams[a].abbr, B = L.teams[b].abbr;
    const base = RIVAL_BASE.some(([x, y]) => (x === A && y === B) || (x === B && y === A)) ? 5 : L.teams[a].conf === L.teams[b].conf ? 1 : 0;
    L.h2h[k] = { lo: Math.min(a, b), hi: Math.max(a, b), wLo: 0, wHi: 0, poLo: 0, poHi: 0, series: 0, close: 0, base, heat: base };
  }
  return L.h2h[k];
}
function recordH2H(L, g) {
  const r = h2h(L, g.home, g.away);
  const win = g.hs > g.as ? g.home : g.away;
  if (g.playoff) { if (win === r.lo) r.poLo++; else r.poHi++; } else { if (win === r.lo) r.wLo++; else r.wHi++; }
  if (Math.abs(g.hs - g.as) <= 4 || g.ot) { r.close++; r.heat = r1(r.heat + 0.25); }
  // v24.4: news when a rivalry's all-time lead changes hands
  const lo = r.wLo + r.poLo, hi = r.wHi + r.poHi, lead = lo > hi ? r.lo : hi > lo ? r.hi : null;
  if (lead != null) { if (r.lead != null && r.lead !== lead && isRivalry(L, r.lo, r.hi)) { const T = L.teams[lead], O = L.teams[lead === r.lo ? r.hi : r.lo]; logNews(L, `${T.abbr} take the all-time lead over ${RIV_LABEL[rivalKind(L, r.lo, r.hi)].toLowerCase()} ${O.abbr}: ${Math.max(lo, hi)}-${Math.min(lo, hi)}`, lead, 'league'); } r.lead = lead; }
}
// v24.4: rivalry news: a playoff series between rivals ends; rivalry week (arch and playoff rivals, a week before they meet)
function rivalSeriesNews(L, w, l, playin) {
  if (playin || !isRivalry(L, w, l)) return;
  const r = h2h(L, w, l), pw = w === r.lo ? r.poLo : r.poHi, pl = w === r.lo ? r.poHi : r.poLo;
  logNews(L, `Rivalry series: ${L.teams[w].abbr} knock out ${RIV_LABEL[rivalKind(L, w, l)].toLowerCase()} ${L.teams[l].abbr} (playoff games all-time ${pw}-${pl})`, w, 'league');
}
function rivalryWeek(L) {
  const d = L.day + 7; if (!L.schedule || !L.schedule[d]) return;
  for (const [h, a] of L.schedule[d]) { const k = rivalKind(L, h, a); if (k !== 'arch' && k !== 'po') continue; const r = h2h(L, h, a), wh = h === r.lo ? r.wLo + r.poLo : r.wHi + r.poHi, wa = a === r.lo ? r.wLo + r.poLo : r.wHi + r.poHi;
    logNews(L, `Rivalry week: ${L.teams[a].abbr} at ${L.teams[h].abbr} (${RIV_LABEL[k].toLowerCase()}s) on day ${d + 1}; all-time ${L.teams[h].abbr} ${wh}-${wa}`, h, 'league'); }
}
function updateRivalry(L, a, b, x) {
  const r = h2h(L, a, b);
  r.series++; r.heat = r1(r.heat + x);
}
// ---------- v24.3: team rivalries. Every team has a conference rival (permanent), an arch rival (permanent) and, when the playoffs have thrown the same two teams together often enough, a playoff rival (it changes). ----------
const ARCH_BASE = [['MNL', 'CEB'], ['TAG', 'DAV'], ['BAT', 'ILO'], ['ANT', 'BAC'], ['LGZ', 'ZAM'], ['BAG', 'JKT'], ['VIG', 'SIN'], ['ANG', 'KUL'], ['TPE', 'CDO'], ['HKG', 'GSC'], ['BKK', 'TAC'], ['HAN', 'BWN'], ['MAC', 'DIL'], ['VTE', 'PNH'], ['NPT', 'POM']];
const PO_RIV = { n5: 2, n10: 4 };   // playoff rival: 2+ series in the last 5 seasons or 4+ in the last 10
const RIV_LABEL = { arch: 'Arch rival', po: 'Playoff rival', conf: 'Conference rival' };
function setupRivals(L) {
  if (L.trv) return L.trv;
  const T = L.trv = { conf: {}, arch: {}, po: {} };
  const ab = {}; for (const t of L.teams) ab[t.abbr] = t.id;
  const setP = (m, a, b) => { if (m[a] == null && m[b] == null) { m[a] = b; m[b] = a; return true; } return false; };
  const groups = {}; for (const t of L.teams) (groups[t.div || t.conf] = groups[t.div || t.conf] || []).push(t.id);
  for (const k in groups) {
    const ids = groups[k];
    for (const [x, y] of RIVAL_BASE) if (ab[x] != null && ab[y] != null && ids.includes(ab[x]) && ids.includes(ab[y])) setP(T.conf, ab[x], ab[y]);
    const left = ids.filter(id => T.conf[id] == null);
    for (let i = 0; i + 1 < left.length; i += 2) setP(T.conf, left[i], left[i + 1]);
    if (left.length % 2) { const id = left[left.length - 1]; const bp = RIVAL_BASE.map(([x, y]) => ab[x] === id ? ab[y] : ab[y] === id ? ab[x] : null).find(o => o != null && ids.includes(o)); T.conf[id] = bp != null ? bp : ids.find(o => o !== id); }
  }
  for (const [x, y] of ARCH_BASE) if (ab[x] != null && ab[y] != null) setP(T.arch, ab[x], ab[y]);
  for (const t of L.teams) if (T.arch[t.id] == null) {   // leagues without the standard teams: pair what is left across conferences first
    const o = L.teams.find(q => q.id !== t.id && T.arch[q.id] == null && q.conf !== t.conf && T.conf[t.id] !== q.id) || L.teams.find(q => q.id !== t.id && T.arch[q.id] == null && T.conf[t.id] !== q.id) || L.teams.find(q => q.id !== t.id && T.arch[q.id] == null);
    if (o) setP(T.arch, t.id, o.id);
  }
  return T;
}
function poRivalOf(L, tid, season) {
  const S = season != null ? season : L.season, log = L.poLog || [], c5 = {}, c10 = {};
  for (const x of log) { if (x.a !== tid && x.b !== tid) continue; const o = x.a === tid ? x.b : x.a, age = S - x.s; if (age < 0 || age >= 10) continue; c10[o] = (c10[o] || 0) + 1; if (age < 5) c5[o] = (c5[o] || 0) + 1; }
  let best = null, bs = 0;
  for (const o in c10) { if ((c5[o] || 0) < PO_RIV.n5 && c10[o] < PO_RIV.n10) continue; const sc = c10[o] * 10 + (c5[o] || 0); if (sc > bs) { bs = sc; best = +o; } }
  return best == null ? null : { o: best, n5: c5[best] || 0, n10: c10[best] };
}
// after the season's playoffs: refresh each team's playoff rival
function refreshPoRivals(L) {
  const T = setupRivals(L), S = L.season;
  L.poLog = (L.poLog || []).filter(x => S - x.s < 10);
  for (const t of L.teams) {
    const r = poRivalOf(L, t.id, S), prev = T.po[t.id];
    if (!r) { delete T.po[t.id]; continue; }
    T.po[t.id] = r.o;
    if (prev !== r.o && !(T.po[r.o] === t.id && t.id > r.o)) logNews(L, `${t.city} ${t.name} and ${L.teams[r.o].city} ${L.teams[r.o].name} are now playoff rivals: ${r.n10} playoff series in the last 10 seasons`, t.id === L.user ? t.id : r.o === L.user ? r.o : null, 'league');
  }
}
// kinds of rivalry between two teams, strongest first (a pair can be more than one at once)
function rivalKinds(L, a, b) {
  const T = setupRivals(L), k = [];
  if (T.arch[a] === b || T.arch[b] === a) k.push('arch');
  if (T.po[a] === b || T.po[b] === a) k.push('po');
  if (T.conf[a] === b || T.conf[b] === a) k.push('conf');
  return k;
}
function rivalKind(L, a, b) { return rivalKinds(L, a, b)[0] || null; }
function isRivalry(L, a, b) { return a !== b && !!rivalKind(L, a, b); }
function rivalOpps(L, tid) { const T = setupRivals(L), m = {}; for (const [k, o] of [['arch', T.arch[tid]], ['po', T.po[tid]], ['conf', T.conf[tid]]]) if (o != null) (m[o] = m[o] || []).push(k); for (const t of L.teams) if (t.id !== tid) for (const k of ['arch', 'po', 'conf']) if (T[k][t.id] === tid && !(m[t.id] || []).includes(k) && T[k][tid] == null) (m[t.id] = m[t.id] || []).push(k); return Object.keys(m).map(o => ({ o: +o, kinds: m[o] })); }
function rivalPairs(L) { const seen = new Set(), out = []; for (const t of L.teams) for (const x of rivalOpps(L, t.id)) { const k = h2hKey(t.id, x.o); if (seen.has(k)) continue; seen.add(k); out.push({ lo: Math.min(t.id, x.o), hi: Math.max(t.id, x.o), kinds: rivalKinds(L, t.id, x.o) }); } return out; }

// ===================== v25.9 Opus part: traits, tiers, comps, playstyle, scouting reports =====================
// Traits (engine.js: genTraits, trv, tw, twp, trc, persLabel, TR_OFF, TR_ON, TR_NAMES, trWord).

// ---------- what a viewer knows about a trait ----------
// lv 2 exact, 1 a rough read (nearest 10), 0 unknown. Work ethic and durability use the old reveal rules.
// The other five: known once he has played a season in the league (or is on your team); prospects only through an interview.
function trRead(L, tid, p, k) {
  if (k === 'wrk' || k === 'dur') {
    const key = k === 'wrk' ? 'wet' : 'ipt', lv = traitLevel(p, key);
    return { lv, v: lv >= 2 ? trv(p, k) : lv === 1 ? clamp(Math.round(trv(p, k) / 10) * 10, 10, 90) : null, txt: k === 'wrk' ? wetText(p, lv) : iptText(p, lv) };
  }
  if (p.prospect) {
    const iv = tid != null && L.teams[tid] && L.teams[tid].interviews ? L.teams[tid].interviews[p.id] : null;
    return iv && iv.tr && iv.tr[k] != null ? { lv: 1, v: iv.tr[k], txt: trWord(iv.tr[k]) } : { lv: 0, v: null, txt: 'Unknown' };
  }
  const lv = (p.seen || 0) >= 1 || (tid != null && p.team === tid) ? 2 : 1;
  const v = lv === 2 ? trv(p, k) : clamp(Math.round(trv(p, k) / 10) * 10, 10, 90);
  return { lv, v, txt: trWord(v) };
}
// everything the Attributes window needs for the two tabs
function traitsView(L, tid, p) {
  const row = k => Object.assign({ k, n: TR_NAMES[k] }, trRead(L, tid, p, k));
  return { off: TR_OFF.map(row), on: TR_ON.map(row), label: p.pers, log: (p.trLog || []).slice(-12).reverse() };
}

// ---------- yearly trait changes ----------
// Runs at the start of the offseason (startOffseason, after yearbookStart). Pushes come from age, the team's season, contract and role events,
// injuries, the coach, plus a small drift and a pull back toward the middle. Work-ethic tier changes are logged from progressPlayer.
// p.trLog: [{ s, k, d, why }] (changes of 2+ points), last 30. why: age | title | winning | losing | paid | re-signed | underpaid | traded |
// benched | role | injury | healthy | coach | clash | unhappy | wet | drift
const TR_WHY = { age: 'Age', title: 'Won a title', winning: 'Team won', losing: 'Team lost', paid: 'Got paid', 're-signed': 'Re-signed', underpaid: 'Underpaid', traded: 'Traded', benched: 'Lost his role', role: 'Bigger role', injury: 'Major injury', healthy: 'Healthy season', coach: 'Coaching', clash: 'Clash with coach', unhappy: 'Unhappy', wet: 'Work ethic shift', drift: 'Drift' };
function trNote(p, s, k, d, why) {
  d = Math.round(d); if (Math.abs(d) < 2) return;
  (p.trLog = p.trLog || []).push({ s, k, d, why }); if (p.trLog.length > 30) p.trLog.splice(0, p.trLog.length - 30);
}
function traitYear(L) {
  const S = L.season;
  for (const p of active(L)) {
    if (p.prospect) continue;
    if (!p.tr) { genTraits(p); continue; }
    const h = (p.hist || []).find(x => x.s === S), t = p.team != null ? L.teams[p.team] : null;
    const played = h && h.rs && h.rs.gp >= 10;
    const d = { loy: 0, mon: 0, win: 0, mot: 0, cch: 0, dur: 0 }, top = {};
    const add = (k, v, w) => { d[k] += v; if (!top[k] || Math.abs(v) > Math.abs(top[k][0])) top[k] = [v, w]; };
    const ring = (p.awards || []).filter(a => a.a === 'Champion');
    // age: money matters less and winning more after 30; motor and durability fade
    if (p.age >= 30) { add('mon', -1.2, 'age'); if (!ring.length) add('win', 1.2, 'age'); add('dur', -Math.min(2.5, (p.age - 29) * 0.4), 'age'); }
    if (p.age >= 31) add('mot', -1, 'age');
    // the team's season (only if he spent most of it there)
    if (t && played && h.tid === t.id) {
      const po = poResult(L, t.id), g = t.w + t.l, wp = g ? t.w / g : 0.5;
      if (po === 'Champion') { add('loy', 3, 'title'); add('mot', 1, 'title'); if (ring.length === 1 && ring[0].s === S && p.age >= 30) add('win', -2, 'title'); }
      else if (!/Missed|play-in/.test(po)) add('loy', 1.5, 'winning');
      if (wp < 0.4 && p.ovr >= 65 && p.age >= 25) { add('win', 2.5, 'losing'); add('loy', -1.5, 'losing'); }
    }
    // contract events in the past year
    const cs = (p.contracts || []).filter(c => c.s === S || (c.s === S + 1 && c.type === 'extension'));
    const last = cs[cs.length - 1];
    if (last && last.type !== 'rookie' && last.type !== 'initial') {
      const prev = (p.contracts || []).filter(c => c !== last).slice(-1)[0];
      if (last.amt >= Math.max(12, 1.3 * (prev ? prev.amt : 0))) add('mon', -3, 'paid');
      if ((last.type === 're-sign' || last.type === 'extension') && prev && prev.tid === last.tid) add('loy', 2, 're-signed');
    }
    if (p.contract && p.mval >= 6 && p.contract.amt < p.mval * 0.6 && p.contract.type !== 'rookie') add('mon', 2, 'underpaid');
    // traded
    if ((p.tx || []).some(x => x.s === S && /^Traded from|^Sign-and-trade/.test(x.t))) { add('loy', -3, 'traded'); add('cch', -1, 'traded'); }
    // role
    const mp = p.moraleParts;
    if (mp && mp.minutes != null && mp.minutes <= -8) { add('cch', -2, 'benched'); add('mot', -1.5, 'benched'); }
    else if (mp && mp.minutes != null && mp.minutes >= 5 && p.age <= 26) add('mot', 1.5, 'role');
    // injuries
    const majors = (p.injuries || []).filter(x => x.s === S && x.games >= 25).length;
    if (majors) { add('dur', -3 * majors, 'injury'); add('mot', -1.5, 'injury'); }
    else if (played && h.rs.gp >= SEASON_GAMES * 0.85 && p.age < 30) add('dur', 0.6, 'healthy');
    // coach
    if (t && t.coach) { if ((p.friction || []).includes(t.coach.id)) add('cch', -2, 'clash'); else if ((t.coach.rdev || 55) >= 70 && played) add('cch', 1, 'coach'); }
    if (p.morale != null && p.morale < 30) add('loy', -2, 'unhappy');
    // drift and pull toward the middle
    for (const k of ['loy', 'mon', 'win', 'mot', 'cch']) { const dr = gauss(0, 1.5) + ((TR_MID[k] || 50) - p.tr[k]) * 0.03; d[k] += dr; if (!top[k] || Math.abs(dr) > Math.abs(top[k][0]) * 1.5) top[k] = [dr, 'drift']; }
    for (const k of ['loy', 'mon', 'win', 'mot', 'cch']) { const nv = clamp(Math.round(p.tr[k] + d[k]), 10, 99); trNote(p, S, k, nv - p.tr[k], top[k] ? top[k][1] : 'drift'); p.tr[k] = nv; }
    if (d.dur) { const nv = clamp(Math.round(p.dur + d.dur), 15, 99); trNote(p, S, 'dur', nv - p.dur, top.dur ? top.dur[1] : 'age'); p.dur = nv; }
    const was = p.pers, now = persLabel(p);
    if (now !== was) { p.pers = now; p.tx.push({ s: S, t: `Personality: ${was} → ${now}` }); if (p.ovr >= 66 || (L.user != null && p.team === L.user)) logNews(L, `${p.name}${t ? ` (${t.abbr})` : ''}: personality now ${now === 'Winner' ? 'Wants to win' : now === 'Money' ? 'Money-first' : now}`, p.team, 'tx'); }
  }
}
// trait changes this season for a team's yearbook page: [{ pid, k, d, why }], biggest first
function trYearbook(L, t, S) {
  const out = [];
  for (const p of rosterOf(L, t)) for (const x of (p.trLog || [])) if (x.s === S && Math.abs(x.d) >= 3) out.push({ pid: p.id, k: x.k, d: x.d, why: x.why });
  return out.sort((a, b) => Math.abs(b.d) - Math.abs(a.d)).slice(0, 8);
}
function migrateTraits(L) {
  if (L.v259) return; L.v259 = true;
  for (const p of Object.values(L.players)) {
    if (p.tr) continue;
    // seeded from the player id so a save always converts the same way
    let n = 0; genTraits(p, (m, s) => m + s * hgauss(p.id, 25900 + n++));
    if (!p.retired) p.pers = persLabel(p);
  }
}

// ---------- tiers ----------
// Bench player · Role player · Low-end starter · Quality starter · All-Star · All-League · MVP, from league ranks (per team: MVP 0.1, All-League 0.5,
// All-Star 0.8, quality starter 2.5, low-end starter 5, role player 8). 30 teams today: 91 / 79 / 75 / ~68 / ~62 / ~55.
const TIERS = ['Bench player', 'Role player', 'Low-end starter', 'Quality starter', 'All-Star', 'All-League', 'MVP'];
const TIER_A = ['a bench player', 'a role player', 'a low-end starter', 'a quality starter', 'an All-Star', 'an All-League player', 'an MVP-level player'];   // with article, for sentences
const TIER_RANK = [8, 5, 2.5, 0.8, 0.5, 0.1];   // per team, from Role player up to MVP
let TIER_CACHE = null;
function tierCuts(L) {
  const key = L.season + ':' + L.phase + ':' + L.day;
  if (TIER_CACHE && TIER_CACHE.L === L && TIER_CACHE.key === key) return TIER_CACHE.cuts;
  const o = active(L).filter(p => p.team != null && !p.prospect).map(p => p.ovr).sort((a, b) => b - a), n = L.teams.length;
  const at = r => o[Math.min(o.length - 1, Math.max(0, Math.ceil(r * n) - 1))] || 50;
  const cuts = TIER_RANK.map(at);   // [role, low, quality, allstar, allleague, mvp]
  for (let i = 1; i < cuts.length; i++) cuts[i] = Math.max(cuts[i], cuts[i - 1] + 1);
  TIER_CACHE = { L, key, cuts }; return cuts;
}
function tierOfOvr(L, v) { const c = tierCuts(L); let t = 0; for (let i = 0; i < c.length; i++) if (v >= c[i]) t = i + 1; return t; }
// what he is now
function tierNow(L, p) { return tierOfOvr(L, p.ovr); }
// what he is or was over his career: second-best season rating (best if 1-2 seasons), capped at All-League without the honors; awards lift it
function careerTier(L, p) {
  const ov = (p.hist || []).filter(h => h.rs && h.rs.gp >= 10 && h.ovr != null).map(h => h.ovr).sort((a, b) => b - a);
  if (!p.retired && p.ovr != null) ov.push(p.ovr), ov.sort((a, b) => b - a);
  const ref = ov.length >= 3 ? ov[1] : ov[0] != null ? ov[0] : p.ovr;
  let t = Math.min(5, tierOfOvr(L, ref || 40));
  const aw = p.awards || [], has = a => aw.some(x => x.a === a);
  if (has('MVP')) t = 6;
  else if (aw.filter(x => /^All-League/.test(x.a)).length >= 2) t = Math.max(t, 5);
  else if (aw.some(x => /^All-League/.test(x.a)) || aw.filter(x => x.a === 'All-Star').length >= 2) t = Math.max(t, 4);
  return t;
}

// ---------- draft comps: floor and ceiling, a league comp and an NBA comp for each ----------
// Floor / ceiling = the team's potential read -/+ about 1.3 SD (at least 4 down and 3 up). League comp: same main type (pos + type),
// career peak closest to that number, current and retired players, never the same player twice. NBA comp: NBA_COMPS by type, nearest tier.
const NBA_COMPS = {
  'PG|Defensive pest': [['Jose Alvarado', 0], ['Davion Mitchell', 1], ['Patrick Beverley', 2], ['Marcus Smart', 3], ['Jrue Holiday', 4], ['Gary Payton', 5]],
  'PG|Jumbo playmaker': [['Frank Ntilikina', 0], ['Shaun Livingston', 1], ['Josh Giddey', 2], ['Lonzo Ball', 3], ['Ben Simmons', 4], ['Penny Hardaway', 5], ['Magic Johnson', 6]],
  'PG|Microwave scorer': [['Shabazz Napier', 0], ['Jordan Clarkson', 1], ['Lou Williams', 2], ['Kemba Walker', 4], ['Isaiah Thomas', 5], ['Allen Iverson', 6]],
  'PG|Pass-first': [['Ish Smith', 0], ['T.J. McConnell', 1], ['Ricky Rubio', 2], ['Tyus Jones', 2], ['Rajon Rondo', 4], ['Chris Paul', 5], ['Steve Nash', 6]],
  'PG|Scoring': [['Austin Rivers', 0], ['Dennis Schroder', 1], ['Collin Sexton', 2], ['Jamal Murray', 3], ["De'Aaron Fox", 4], ['Damian Lillard', 5], ['Russell Westbrook', 6]],
  'PG|All-around': [['Justin Anderson', 0], ['Delon Wright', 1], ['Spencer Dinwiddie', 2], ['Mike Conley', 3], ['Kyle Lowry', 4], ['Jason Kidd', 5], ['Shai Gilgeous-Alexander', 6]],
  'PG|Shooting': [['J.J. Barea', 0], ['Patty Mills', 1], ["D'Angelo Russell", 2], ['Fred VanVleet', 3], ['Darius Garland', 4], ['Trae Young', 5], ['Stephen Curry', 6]],
  'PG|Rebounding guard': [['Cory Joseph', 0], ['Elfrid Payton', 1], ['Josh Giddey', 2], ['Rajon Rondo', 4], ['Jason Kidd', 5], ['Russell Westbrook', 6]],
  'SG|Lockdown defender': [['Gary Payton II', 0], ['Matisse Thybulle', 1], ['Avery Bradley', 2], ['Luguentz Dort', 3], ['Joe Dumars', 4], ['Sidney Moncrief', 5]],
  'SG|Movement shooter': [['Damion Lee', 0], ['Duncan Robinson', 1], ['Buddy Hield', 2], ['J.J. Redick', 3], ['Richard Hamilton', 4], ['Klay Thompson', 5], ['Ray Allen', 5]],
  'SG|Shot creator': [['Jordan Crawford', 0], ['Malik Monk', 1], ['Jordan Poole', 2], ['CJ McCollum', 3], ['Zach LaVine', 4], ['Devin Booker', 5], ['James Harden', 6], ['Kobe Bryant', 6]],
  'SG|Shooter': [['Anthony Morrow', 0], ['Joe Harris', 1], ['Gary Trent Jr.', 2], ['Desmond Bane', 3], ['Allan Houston', 4], ['Ray Allen', 5]],
  'SG|Slasher': [['Gerald Green', 0], ['Shannon Brown', 1], ['Rodney Stuckey', 2], ['Monta Ellis', 3], ['Victor Oladipo', 4], ['Dwyane Wade', 5], ['Michael Jordan', 6]],
  'SG|3-and-D': [['Garrison Mathews', 0], ["Royce O'Neale", 1], ['Danny Green', 2], ['Kentavious Caldwell-Pope', 2], ['Derrick White', 3], ['Mikal Bridges', 3]],
  'SG|Combo guard': [['Shelvin Mack', 0], ['Monte Morris', 1], ['Eric Gordon', 2], ['Malcolm Brogdon', 3], ['Jalen Brunson', 4], ['Donovan Mitchell', 5]],
  'SG|Rebounding guard': [['Hamidou Diallo', 0], ['Lance Stephenson', 1], ['Josh Hart', 2], ['Clyde Drexler', 5]],
  'SF|Two-way wing': [['Justin Holiday', 0], ['Dorian Finney-Smith', 1], ['Herbert Jones', 2], ['OG Anunoby', 3], ['Andrei Kirilenko', 4], ['Kawhi Leonard', 5]],
  'SF|Athletic finisher': [['Kenyon Martin Jr.', 0], ['Derrick Jones Jr.', 1], ['Kelly Oubre Jr.', 2], ['Andrew Wiggins', 3], ['Shawn Marion', 4], ['Vince Carter', 5]],
  'SF|Scoring wing': [['Kevin Knox', 0], ['Rodney Hood', 1], ['Tobias Harris', 2], ['Rudy Gay', 3], ['Brandon Ingram', 4], ['Carmelo Anthony', 5], ['Kevin Durant', 6]],
  'SF|3-and-D wing': [['Juan Toscano-Anderson', 0], ['Torrey Craig', 1], ['Trevor Ariza', 2], ['Mikal Bridges', 3], ['Bruce Bowen', 3]],
  'SF|Slasher': [['Stanley Johnson', 0], ['Corey Brewer', 1], ['Michael Kidd-Gilchrist', 2], ['Caron Butler', 3], ['DeMar DeRozan', 4], ['Jimmy Butler', 5]],
  'SF|Point forward': [['Luc Mbah a Moute', 0], ['Kyle Anderson', 1], ['Boris Diaw', 2], ['Hedo Turkoglu', 3], ['Lamar Odom', 3], ['Grant Hill', 5], ['LeBron James', 6]],
  'SF|All-around': [['Justin Holiday', 0], ['Jae Crowder', 1], ['Nicolas Batum', 2], ['Andre Iguodala', 3], ['Gordon Hayward', 4], ['Scottie Pippen', 5], ['Larry Bird', 6]],
  'SF|Rebounding wing': [['Lance Stephenson', 1], ['Kyle Kuzma', 2], ['Gerald Wallace', 3], ['Shawn Marion', 4], ['Elgin Baylor', 5]],
  'PF|Rim runner': [['Ed Davis', 0], ['Kenneth Faried', 1], ['Jarred Vanderbilt', 2], ['Aaron Gordon', 3], ['Shawn Kemp', 4], ["Amar'e Stoudemire", 5]],
  'PF|Small-ball four': [['Jeff Green', 1], ['P.J. Tucker', 1], ['Robert Covington', 2], ['Jerami Grant', 3], ['Pascal Siakam', 5]],
  'PF|Playmaking four': [['Jonas Jerebko', 0], ['Larry Nance Jr.', 1], ['Boris Diaw', 2], ['Josh Smith', 3], ['Draymond Green', 4], ['Chris Webber', 5], ['Giannis Antetokounmpo', 6]],
  'PF|Stretch four': [['Mike Muscala', 0], ['Channing Frye', 1], ['Ryan Anderson', 2], ['Danilo Gallinari', 3], ['Lauri Markkanen', 4], ['Kevin Love', 5], ['Dirk Nowitzki', 6]],
  'PF|Post scorer': [['Jahlil Okafor', 0], ['Glen Davis', 1], ['Luis Scola', 2], ['David West', 3], ['Zach Randolph', 4], ['Kevin McHale', 5], ['Karl Malone', 6]],
  'PF|Rebounder/defender': [['Reggie Evans', 0], ['Udonis Haslem', 1], ['Taj Gibson', 2], ['Serge Ibaka', 3], ['Paul Millsap', 4], ['Dennis Rodman', 5], ['Kevin Garnett', 6]],
  'PF|All-around': [['Juancho Hernangomez', 0], ['Jeff Green', 1], ['Thaddeus Young', 2], ['Tobias Harris', 3], ['Al Horford', 4], ['Anthony Davis', 5], ['Tim Duncan', 6]],
  'C|Playmaking hub': [['Mason Plumlee', 1], ['Jusuf Nurkic', 2], ['Alperen Sengun', 3], ['Domantas Sabonis', 4], ['Marc Gasol', 4], ['Bill Walton', 5], ['Nikola Jokic', 6]],
  'C|Rim runner': [['Bismack Biyombo', 0], ['JaVale McGee', 1], ['Clint Capela', 2], ['Jarrett Allen', 3], ['Tyson Chandler', 4], ['Dwight Howard', 5]],
  'C|Mobile big': [['Thomas Bryant', 0], ['Richaun Holmes', 1], ['Daniel Gafford', 2], ['Robert Williams III', 3], ['Bam Adebayo', 4], ['Anthony Davis', 5], ['Hakeem Olajuwon', 6]],
  'C|Rim protector': [['Hasheem Thabeet', 0], ['Nerlens Noel', 1], ['Mitchell Robinson', 2], ['Myles Turner', 3], ['Marcus Camby', 4], ['Rudy Gobert', 5], ['David Robinson', 6]],
  'C|Post scorer': [['Jahlil Okafor', 0], ['Enes Kanter', 1], ['Greg Monroe', 2], ['Jonas Valanciunas', 3], ['Al Jefferson', 4], ['Patrick Ewing', 5], ["Shaquille O'Neal", 6]],
  'C|Stretch five': [['Meyers Leonard', 0], ['Kelly Olynyk', 1], ['Spencer Hawes', 2], ['Brook Lopez', 3], ['Mehmet Okur', 4], ['Karl-Anthony Towns', 5]],
  'C|Rebounder': [['Cristiano Felicio', 0], ['Kevon Looney', 1], ['Steven Adams', 2], ['Andre Drummond', 3], ['Joakim Noah', 4], ['Ben Wallace', 5], ['Moses Malone', 6]]
};
// same type at that tier; else another type at the same position at that tier (sameType false); else the nearest tier of his type
function nbaComp(key, tier, not) {
  const ok = x => !not || x[0] !== not;
  const own = (NBA_COMPS[key] || []).filter(ok), pos = key.split('|')[0];
  let best = own.find(x => x[1] === tier), same = true;
  if (!best) { const alt = Object.keys(NBA_COMPS).filter(k => k !== key && k.startsWith(pos + '|')).flatMap(k => NBA_COMPS[k].filter(ok).filter(x => x[1] === tier)); if (alt.length) { best = alt[flHash(key + tier) % alt.length]; same = false; } }
  if (!best && own.length) best = own.slice().sort((a, b) => Math.abs(a[1] - tier) - Math.abs(b[1] - tier) || a[1] - b[1])[0];
  return best ? { name: best[0], tier: best[1], tierN: TIERS[best[1]], sameType: same } : null;
}
function leagueComp(L, key, pos, target, notId, selfId) {
  const all = Object.values(L.players).filter(x => x.id !== selfId && x.id !== notId && !x.prospect && (x.hist || []).some(h => h.rs && h.rs.gp >= 10));
  const typeOf = x => x.arch && x.arch[0] ? x.arch[0].p + '|' + x.arch[0].n : null;
  let pool = all.filter(x => typeOf(x) === key);
  if (pool.length < 3) pool = pool.concat(all.filter(x => typeOf(x) !== key && x.pos === pos));
  const peak = x => Math.max(x.retired ? 0 : x.ovr, ...(x.hist || []).filter(h => h.ovr != null).map(h => h.ovr));
  const best = pool.map(x => ({ x, pk: peak(x) })).sort((a, b) => Math.abs(a.pk - target) - Math.abs(b.pk - target) || (b.x.retired ? 1 : 0) - (a.x.retired ? 1 : 0))[0];
  if (!best) return null;
  const ct = careerTier(L, best.x);
  return { pid: best.x.id, name: best.x.name, peak: best.pk, tier: ct, tierN: TIERS[ct], retired: !!best.x.retired, sameType: typeOf(best.x) === key };
}
// tid = whose read (your scouts); est/sd override for non-prospects (default: potential read for prospects, p.pot ± 3 for young players)
function compsFor(L, tid, p, est, sd) {
  if (est == null) {
    if (p.prospect && tid != null && L.teams[tid]) { const e = teamPotEst(L, tid, p); est = e.est; sd = e.sd; }
    else { est = p.prospect ? p.scout : Math.max(p.ovr, p.pot || p.ovr); sd = p.age <= 24 ? 3 : 1.5; }
  }
  // v25.9 review: the read's error is not the only doubt; a young player's development adds more (about 7 at 19, 0 at 24+), more of it downward (busts)
  const dev = clamp((24 - (p.age || 22)) * 1.5, 0, 7.5), u = Math.sqrt(sd * sd + dev * dev);
  const lo = Math.round(est - Math.max(4, 1.5 * u)), hi = Math.round(Math.min(99, est + Math.max(3, 0.9 * u)));
  const key = p.arch && p.arch[0] ? p.arch[0].p + '|' + p.arch[0].n : POS[p.pos] + '|All-around';
  const ft = tierOfOvr(L, lo), ct = tierOfOvr(L, hi);
  const fl0 = leagueComp(L, key, p.pos, lo, null, p.id), cl0 = leagueComp(L, key, p.pos, hi, fl0 ? fl0.pid : null, p.id);
  const fn = nbaComp(key, ft), cn = nbaComp(key, Math.max(ct, ft), ct > ft && fn ? fn.name : null);
  return { key, floor: { ovr: lo, tier: ft, tierN: TIERS[ft], league: fl0, nba: fn }, ceil: { ovr: hi, tier: ct, tierN: TIERS[ct], league: cl0, nba: cn } };
}

// ---------- playstyle ----------
// Main type gives the noun (FLAVOR ps.noun.<type>), the best skill group the type doesn't already cover gives "who can also ..." (ps.plus.<grp>),
// the weakest gives "but ..." (ps.minus.<grp>). Stats add tags. Skill groups are judged against players at his position (z-scores, cached per season).
const PS_GRP = { shoot: ['tp', 'mid', 'ft'], finish: ['fin', 'drw'], create: ['hnd'], pass: ['pas'], post: ['pst'], reb: ['orb', 'drb'], perD: ['per', 'stl'], rimD: ['blk', 'pdf'], ath: ['spd', 'agi', 'vrt'], iq: ['iq'] };
// groups each type already implies (not repeated as "can also")
const PS_IMPLIED = {
  'Defensive pest': ['perD'], 'Jumbo playmaker': ['pass', 'create'], 'Microwave scorer': ['shoot', 'create'], 'Pass-first': ['pass', 'iq'], 'Scoring': ['shoot', 'finish', 'create'], 'All-around': [], 'Shooting': ['shoot'], 'Rebounding guard': ['reb'],
  'Lockdown defender': ['perD'], 'Movement shooter': ['shoot'], 'Shot creator': ['create', 'shoot'], 'Shooter': ['shoot'], 'Slasher': ['finish', 'ath'], '3-and-D': ['shoot', 'perD'], 'Combo guard': ['create', 'pass'],
  'Two-way wing': ['perD'], 'Athletic finisher': ['finish', 'ath'], 'Scoring wing': ['shoot', 'finish'], '3-and-D wing': ['shoot', 'perD'], 'Point forward': ['pass', 'create'], 'Rebounding wing': ['reb'],
  'Rim runner': ['finish', 'ath'], 'Small-ball four': ['ath', 'shoot'], 'Playmaking four': ['pass'], 'Stretch four': ['shoot'], 'Post scorer': ['post'], 'Rebounder/defender': ['reb', 'rimD'],
  'Playmaking hub': ['pass', 'iq'], 'Mobile big': ['ath', 'rimD'], 'Rim protector': ['rimD'], 'Stretch five': ['shoot'], 'Rebounder': ['reb']
};
let PS_CAL = null;
function psCal(L) {
  if (PS_CAL && PS_CAL.L === L && PS_CAL.s === L.season) return PS_CAL.c;
  const c = {};
  for (let pos = 0; pos < 5; pos++) {
    const ps = active(L).filter(x => x.pos === pos && x.team != null && !x.prospect);
    c[pos] = {};
    for (const g in PS_GRP) { const v = ps.map(x => PS_GRP[g].reduce((a, k) => a + (x[k] || 0), 0) / PS_GRP[g].length); const m = v.reduce((a, b) => a + b, 0) / Math.max(1, v.length); const sd = Math.sqrt(v.reduce((a, b) => a + (b - m) * (b - m), 0) / Math.max(1, v.length)) || 8; c[pos][g] = [m, sd]; }
  }
  PS_CAL = { L, s: L.season, c }; return c;
}
function psZ(L, p) { const c = psCal(L)[p.pos], z = {}; for (const g in PS_GRP) { const v = PS_GRP[g].reduce((a, k) => a + (p[k] || 0), 0) / PS_GRP[g].length; z[g] = (v - c[g][0]) / c[g][1]; } return z; }
function psStats(L, p) {
  const s = p.stats && p.stats.rs && p.stats.rs.gp >= 10 ? p.stats.rs : (() => { const h = (p.hist || []).filter(x => x.rs && x.rs.gp >= 10).slice(-1)[0]; return h ? h.rs : null; })();
  if (!s) return null;
  const g = s.gp; return { gp: g, mpg: s.min / g / 60, ppg: s.pts / g, rpg: (s.orb + s.drb) / g, apg: s.ast / g, spg: s.stl / g, bpg: s.blk / g, tpa: s.tpa / g, tpp: s.tpa ? s.tpm / s.tpa : 0, gs: (s.gs || 0) / g };
}
function playstyleOf(L, p) {
  const a = p.arch && p.arch[0]; if (!a) return null;
  const z = psZ(L, p), imp = PS_IMPLIED[a.n] || [];
  const free = Object.keys(z).filter(g => !imp.includes(g) && g !== 'iq');
  const plus = free.filter(g => z[g] >= 0.8).sort((x, y) => z[y] - z[x])[0] || null;
  const minus = Object.keys(z).filter(g => !imp.includes(g) && z[g] <= -1).sort((x, y) => z[x] - z[y])[0] || null;
  const st = psStats(L, p), tags = [];
  if (st && st.mpg >= 20) {
    if (st.ppg >= 22) tags.push('go-to scorer'); if (st.apg >= 7) tags.push('floor general'); if (st.rpg >= 10) tags.push('glass cleaner');
    if (st.tpa >= 6 && st.tpp >= 0.38) tags.push('volume shooter'); if (st.bpg >= 2) tags.push('shot blocker'); if (st.spg >= 1.7) tags.push('ball hawk');
  }
  let noun = fl('ps.noun.' + a.n, {}, p.id) || a.n.toLowerCase();
  if ((plus || minus) && / who /.test(noun)) noun = (FLAVOR['ps.noun.' + a.n] || [noun])[0];   // v25.9 review: no 'a guard who scores who can also...'
  const vars = { noun: a.e ? noun.replace(/^(an?|the) /, 'an elite ').replace(/^(?!an elite )/, 'elite ') : noun,   // 'a rim protector' → 'an elite rim protector'
    plus: plus ? fl('ps.plus.' + plus, {}, p.id + 1) : '', minus: minus ? fl('ps.minus.' + minus, {}, p.id + 2) : '' };
  const key = plus && minus ? 'ps.line.both' : plus ? 'ps.line.plus' : minus ? 'ps.line.minus' : 'ps.line.base';
  return { type: a.p + '|' + a.n, plus, minus, z, tags, key, vars, text: fl(key, vars, p.id + L.season) };
}

// ---------- scouting report for every player ----------
// Ordered slots; each is { k: FLAVOR key, v: vars } and its text. The UI shows text; Haiku adds variants to the keys (see FLAVOR 'sr.*').
// viewTid = whose eyes (hidden traits follow trRead). Slots: value, role, leader, play, work, cch, mot, off, pay, term.
function assetScore(L, p) { return p.ovr + (p.age <= 24 ? Math.max(0, (p.pot || p.ovr) - p.ovr) * 0.5 * (25 - p.age) / 5 : 0) - Math.max(0, p.age - 30) * 1.2; }
function playerReport(L, p, viewTid) {
  if (!p || p.retired) return null;
  if (p.prospect) return { prospect: true, slots: [] };
  const t = p.team != null ? L.teams[p.team] : null, out = [], seed = p.id * 13 + L.season;
  const push = (k, v) => { const text = fl(k, v || {}, seed + out.length); if (text) out.push({ k, v: v || {}, text }); };
  const nm = { name: p.first || p.name, full: p.name, team: t ? t.name : '', abbr: t ? t.abbr : '' };
  // value
  if (t) {
    const ros = rosterOf(L, t).sort((a, b) => assetScore(L, b) - assetScore(L, a)), rk = ros.findIndex(x => x.id === p.id) + 1;
    const lg = active(L).filter(x => x.team != null && !x.prospect).sort((a, b) => assetScore(L, b) - assetScore(L, a)).findIndex(x => x.id === p.id) + 1;
    const young = p.age <= 23 && (p.pot || 0) - p.ovr >= 8;
    const big = tierNow(L, p) >= 4 || (p.age <= 23 && (p.pot || 0) >= tierCuts(L)[4]);   // v25.9 review: 'franchise' needs an All-Star now or a young All-League ceiling
    if (rk === 1 && big && lg <= Math.max(5, L.teams.length / 3)) push('sr.value.franchise', { ...nm, lgRank: lg });
    else if (rk === 1) push('sr.value.teamTop', { ...nm, lgRank: lg });
    else if (young && rk <= 4) push('sr.value.prospect', { ...nm });
    else if (rk <= 3) push('sr.value.core', { ...nm, rk });
  }
  // role and tier
  const st = psStats(L, p), tier = tierNow(L, p);
  const role = !st ? 'unknown' : st.gs >= 0.6 ? 'starter' : st.mpg >= 22 ? 'sixth' : st.mpg >= 12 ? 'rotation' : 'bench';
  if (role !== 'unknown') push('sr.role.' + role, { ...nm, tier: TIER_A[tier], mpg: st ? st.mpg.toFixed(1) : '' });
  else push('sr.role.new', { ...nm, tier: TIER_A[tier] });
  // team leader in a box-score category (this season, or last if early)
  if (t && st) {
    const ros = rosterOf(L, t).map(x => ({ x, s: psStats(L, x) })).filter(o => o.s && o.s.gp >= 10);
    const lead = [];
    for (const [k, w] of [['ppg', 'scorer'], ['rpg', 'rebounder'], ['apg', 'passer'], ['bpg', 'shot blocker'], ['spg', 'pickpocket']]) { const b = ros.slice().sort((a, b2) => b2.s[k] - a.s[k])[0]; if (b && b.x.id === p.id && b.s[k] > 0) lead.push(w); }
    lead.splice(3);   // at most 3
    if (lead.length) push('sr.leader', { ...nm, what: lead.length === 1 ? lead[0] : lead.slice(0, -1).join(', ') + ' and ' + lead[lead.length - 1] });
  }
  // playstyle
  const ps = playstyleOf(L, p); if (ps) out.push({ k: ps.key, v: ps.vars, text: ps.text.replace(/^./, c => c.toUpperCase()).replace(/[^.!]$/, m => m + '.') });
  // on-court traits (only what the viewer knows, only notable ones)
  const lvl = v => v >= 70 ? 'hi' : v <= 35 ? 'lo' : null;
  for (const k of ['wrk', 'cch', 'mot']) { const r = trRead(L, viewTid, p, k); const l = r.v != null && r.lv >= 1 ? lvl(r.v) : null; if (l) push(`sr.${k}.${l}`, nm); }
  // off-court pull
  const offr = ['loy', 'mon', 'win'].map(k => [k, trRead(L, viewTid, p, k)]).filter(x => x[1].v != null).sort((a, b) => b[1].v - a[1].v);
  if (offr.length && offr[0][1].v >= 66) push('sr.off.' + offr[0][0], nm);
  // contract
  const c = p.contract;
  if (c && t) {
    const yl = Math.max(1, c.exp - capSeason(L) + 1), r = p.mval > 0 ? c.amt / p.mval : 1;
    const pk = c.type === 'rookie' ? 'rookie' : r <= 0.75 ? 'under' : r >= 1.3 ? 'over' : 'fair';
    push('sr.pay.' + pk, { ...nm, amt: money(c.amt), val: money(p.mval) });
    const optTxt = yl === 1 ? '' : c.opt === 'PO' ? fl('sr.opt.PO', {}, seed) : c.opt === 'TO' ? fl('sr.opt.TO', {}, seed) : '';
    push(yl === 1 ? 'sr.term.last' : 'sr.term', { ...nm, exp: yr(c.exp), yl, yrs: yl === 1 ? '1 year' : yl + ' years', opt: optTxt });
  } else if (!t) push('sr.fa', nm);
  return { slots: out, text: out.map(x => x.text).join(' '), tier, tierN: TIERS[tier], playstyle: ps };
}

// ---------- text (variant 1; Haiku adds more) ----------
Object.assign(FLAVOR, {
  'ps.line.base': ['{noun}', '{noun} at heart', '{noun} first and foremost'],
  'ps.line.plus': ['{noun} who can also {plus}', '{noun} who is also able to {plus}', '{noun} who can {plus} as well'],
  'ps.line.minus': ['{noun}, but {minus}', '{noun} who {minus}', '{noun}, with the flaw that he {minus}'],
  'ps.line.both': ['{noun} who can also {plus}, but {minus}', '{noun} who is also able to {plus}, but {minus}', '{noun} who can {plus}, though he {minus}'],
  'ps.plus.shoot': ['make shots', 'knock down shots', 'hit shots from distance', 'score from outside'], 'ps.plus.finish': ['finish at the rim', 'finish plays inside', 'score around the rim', 'convert close shots'], 'ps.plus.create': ['create his own shot', 'make plays off the dribble', 'make his own offense', 'generate his own looks'], 'ps.plus.pass': ['find the open man', 'pass out of trouble', 'make the right pass', 'set up teammates'], 'ps.plus.post': ['score in the post', 'work inside on the block', 'score with his back to the basket', 'use his size on the block'],
  'ps.plus.reb': ['crash the glass', 'grab rebounds', 'rebound the ball', 'clean the glass'], 'ps.plus.perD': ['guard the perimeter', 'defend on the ball', 'guard the best wing', 'stay in front of his man'], 'ps.plus.rimD': ['protect the rim', 'block shots at the rim', 'deter shots inside', 'defend the paint'], 'ps.plus.ath': ['beat you with athleticism', 'use his explosiveness', 'play above the rim', 'get up and down the floor'],
  'ps.minus.shoot': ["can't shoot", 'is not a shooter', 'has a weak jumper', 'misses too many jumpers'], 'ps.minus.finish': ['struggles to finish', 'misses easy shots', 'has trouble finishing', 'struggles to score at the rim'], 'ps.minus.create': ['needs others to create', 'cannot create his own shot', 'depends on teammates for offense', 'struggles to create shots'], 'ps.minus.pass': ['rarely passes', 'does not pass much', 'seldom finds open teammates', 'holds the ball too long'], 'ps.minus.post': ['has no post game', 'struggles to score inside', 'lacks a post game', 'has little game on the block'],
  'ps.minus.reb': ['does not rebound', 'is a poor rebounder', 'gives up the glass', 'struggles on the boards'], 'ps.minus.perD': ['gets beat on the perimeter', 'struggles to guard on the ball', 'is easy to beat off the dribble', 'struggles to stay in front of his man'], 'ps.minus.rimD': ['gives little at the rim', 'is a weak shot blocker', 'does little to protect the paint', 'struggles to defend inside'], 'ps.minus.ath': ['lacks athleticism', 'is not quick', 'lacks quickness', 'has limited explosiveness'], 'ps.minus.iq': ['makes poor decisions', 'misreads plays', 'makes questionable reads', 'gets caught out of position'],
  'ps.noun.Defensive pest': ['a pesky on-ball defender', 'a tough perimeter defender', 'a defensive pest'], 'ps.noun.Jumbo playmaker': ['a big playmaker', 'a tall playmaker', 'a big guard who makes plays'], 'ps.noun.Microwave scorer': ['an instant-offense scorer', 'a microwave scorer', 'a quick-trigger scorer'], 'ps.noun.Pass-first': ['a pass-first playmaker', 'a playmaker who passes first', 'a pass-first guard'],
  'ps.noun.Scoring': ['a scoring guard', 'a guard who scores', 'a guard who scores first'], 'ps.noun.All-around': ['an all-around player', 'a well-rounded player', 'a complete player'], 'ps.noun.Shooting': ['a shooting point guard', 'a point guard who shoots', 'a sharpshooting point guard'], 'ps.noun.Rebounding guard': ['a guard who rebounds', 'a rebounding guard', 'a glass-cleaning guard'],
  'ps.noun.Lockdown defender': ['a lockdown defender', 'a shutdown defender', 'a perimeter stopper'], 'ps.noun.Movement shooter': ['a shooter who runs off screens', 'a movement shooter', 'a shooter who gets open off the ball'], 'ps.noun.Shot creator': ['a shot creator', 'a player who creates his own shot', 'a shot maker'], 'ps.noun.Shooter': ['a shooter', 'a sharpshooter', 'a catch-and-shoot threat'],
  'ps.noun.Slasher': ['a slasher', 'a driving guard', 'a driver who attacks the rim'], 'ps.noun.3-and-D': ['a 3-and-D guard', 'a guard who shoots threes and defends', 'a three-and-defend guard'], 'ps.noun.Combo guard': ['a combo guard', 'a guard who plays both backcourt spots'], 'ps.noun.Two-way wing': ['a two-way wing', 'a wing who plays both ends', 'a wing who helps on both ends'], 'ps.noun.Athletic finisher': ['an athletic finisher', 'an explosive finisher', 'a leaper who finishes above the rim'],
  'ps.noun.Scoring wing': ['a scoring wing', 'a wing who scores', 'a wing scorer'], 'ps.noun.3-and-D wing': ['a 3-and-D wing', 'a wing who shoots threes and defends', 'a three-and-defend wing'], 'ps.noun.Point forward': ['a point forward', 'a forward who runs the offense', 'a forward who passes like a guard'], 'ps.noun.Rebounding wing': ['a wing who rebounds', 'a rebounding wing', 'a glass-cleaning wing'],
  'ps.noun.Rim runner': ['a rim runner', 'a lob threat', 'a big who runs the rim'], 'ps.noun.Small-ball four': ['a small-ball four', 'a four who plays small'], 'ps.noun.Playmaking four': ['a playmaking four', 'a forward who passes', 'a four who makes plays'], 'ps.noun.Stretch four': ['a stretch four', 'a power forward who shoots threes', 'a stretch power forward'],
  'ps.noun.Post scorer': ['a post scorer', 'a big who scores in the post', 'a back-to-the-basket scorer'], 'ps.noun.Rebounder/defender': ['a rebounder and defender', 'a big who rebounds and defends', 'a rebounder who defends'], 'ps.noun.Playmaking hub': ['a playmaking hub', 'a center who passes', 'a big passing hub'], 'ps.noun.Mobile big': ['a mobile big', 'a mobile center', 'an athletic big'],
  'ps.noun.Rim protector': ['a rim protector', 'a shot-blocking big', 'a paint protector'], 'ps.noun.Stretch five': ['a stretch five', 'a center who shoots threes', 'a stretch center'], 'ps.noun.Rebounder': ['a rebounder', 'a board-crashing big', 'a big who rebounds'],
  'sr.value.franchise': ['He is the most valued asset on the {team} and one of the top values in the league.', 'He is the franchise player of the {team}.', 'The {team} are built around him, and few players in the league are worth more.', 'Few players in the league are more valuable to their team than he is to the {team}.'],
  'sr.value.teamTop': ['He is the most valued player on the {team}.', 'He is the top player on the {team}.', 'The {team} rely on him more than anyone.', 'No one on the {team} is more valuable than he is.'],
  'sr.value.core': ['He is one of the core pieces of the {team}.', 'He is a building block for the {team}.', 'The {team} count on him as a core player.', 'He is one of the main pieces the {team} are built around.'],
  'sr.value.prospect': ['He is one of the most promising young players on the {team}.', 'He is a young player with real upside for the {team}.', 'The {team} see him as a player who can grow into a big role.', 'He is one of the best young prospects on the {team}.'],
  'sr.role.starter': ['He is a full-time starter and plays like {tier}.', 'He is a regular starter and plays like {tier}.', 'He holds a starting spot and plays like {tier}.', 'He starts most nights and plays like {tier}.'],
  'sr.role.sixth': ['He comes off the bench in a big role and plays like {tier}.', 'He is a key reserve and plays like {tier}.', 'He comes off the bench for big minutes and plays like {tier}.', 'He plays a major role off the bench and plays like {tier}.'],
  'sr.role.rotation': ['He is a rotation player and plays like {tier}.', 'He is a regular in the rotation and plays like {tier}.', 'He plays a steady role in the rotation and plays like {tier}.', 'He is a reserve who gets regular minutes and plays like {tier}.'],
  'sr.role.bench': ['He sits deep on the bench and plays like {tier}.', 'He mostly watches from the bench and plays like {tier}.', 'He gets little playing time and plays like {tier}.', 'He is a bench player who plays like {tier}.'],
  'sr.role.new': ['He has yet to find his role; on talent he is {tier}.', 'He is still finding his place; on talent he is {tier}.', 'His role is not set yet, but on talent he is {tier}.', 'He is new to the rotation; on talent he is {tier}.'],
  'sr.leader': ['He is the team\'s leading {what}.', 'He is the team\'s top {what}.', 'No one on the team is a better {what} than he is.', 'He is the best {what} on the team.'],
  'sr.wrk.hi': ['He works hard.', 'He is a hard worker.', 'He is known for his work ethic.', 'He puts in the extra hours.', 'He is a tireless worker.'], 'sr.wrk.lo': ['His work ethic is a concern.', 'He does not always put in the work.', 'His work ethic has been questioned.', 'He is not a hard worker.'],
  'sr.cch.hi': ['He is easy to coach.', 'He takes coaching well.', 'He listens to coaches and adjusts.', 'He is open to feedback.'], 'sr.cch.lo': ['He can be hard to coach.', 'He does not take coaching well.', 'He resists coaching.', 'Coaches find him difficult to teach.'],
  'sr.mot.hi': ['He plays hard on every possession.', 'He gives full effort every night.', 'He plays with real energy.', 'He never takes a play off.'], 'sr.mot.lo': ['His effort comes and goes.', 'He does not always play with full effort.', 'He can play with little energy.', 'He sometimes takes plays off.'],
  'sr.off.loy': ['Loyalty matters most to him.', 'He values loyalty above everything else.', 'Staying loyal to his team comes first for him.', 'He cares most about loyalty.'], 'sr.off.mon': ['Money matters most to him.', 'He cares most about getting paid.', 'Earning the most money comes first for him.', 'A big contract is what he wants most.'], 'sr.off.win': ['Winning matters most to him.', 'He cares most about winning.', 'Winning is what drives him.', 'Team success comes first for him.'],
  'sr.pay.under': ['He is underpaid for what he produces ({amt} a year, worth about {val}).', 'He is a bargain: {amt} a year for a player worth about {val}.', 'His contract of {amt} a year is below what he is worth, about {val}.', 'He earns {amt} a year, a deal well below his worth of about {val}.'],
  'sr.pay.fair': ['He is paid about what he is worth ({amt} a year).', 'His salary of {amt} a year matches his value.', 'At {amt} a year, he earns about what he is worth.', 'He is fairly paid at {amt} a year.'],
  'sr.pay.over': ['He is overpaid for what he produces ({amt} a year, worth about {val}).', 'He earns {amt} a year, more than the roughly {val} he is worth.', 'His {amt} salary is well above his worth of about {val}.', 'At {amt} a year he costs more than he is worth, about {val}.'],
  'sr.pay.rookie': ['He is still on his rookie deal ({amt} a year).', 'He is on a rookie contract at {amt} a year.', 'His rookie deal pays {amt} a year.', 'He is paid {amt} a year on his rookie deal.'],
  'sr.term': ['He is under contract through {exp} ({yrs} left){opt}.', 'His contract runs through {exp}, with {yrs} left{opt}.', 'He is signed through {exp}, which leaves {yrs}{opt}.', 'He has {yrs} left on a deal that runs through {exp}{opt}.'],
  'sr.term.last': ['He is in the last year of his deal{opt}.', 'His deal ends after this season{opt}.', 'He is in the final year of his contract{opt}.', 'His contract expires after this year{opt}.'],
  'sr.opt.PO': [', with a player option in the last year', ', with a player option for the final year', ', and he holds a player option in the last year'], 'sr.opt.TO': [', with a team option in the last year', ', with a team option for the final year', ', and the team holds an option in the last year'],
  'sr.fa': ['He is a free agent.', 'He is currently a free agent.', 'He is an unsigned free agent.', 'He is currently without a team.']
});

// ===================== v26.0 Opus part: player tags, coach report, roster needs =====================

// ---------- coach fit, relative to the player ----------
// fit(p, c) is mostly his overall level (good players fit everything). fitRel = fit for this coach minus his average fit over all 12
// system pairs, so it says whether this system suits HIS game. Tags: Fits coach = rel ≥ 11 and fit ≥ 58; Clashes = rel ≤ -9 and fit ≤ 62 (about 15-20% of rotation players each).
const SYS_PAIRS = []; for (const o in OFF_SYS) for (const d in DEF_SYS) SYS_PAIRS.push({ off: o, def: d });
const FIT_REL = { fits: 11, fitsMin: 58, clash: -9, clashMax: 62 };
const FB_C = new WeakMap();
function fitBase(p) { const k = p.ovr + '|' + p.age + '|' + p.pos; const e = FB_C.get(p); if (e && e.k === k) return e.v; const v = SYS_PAIRS.reduce((a, s) => a + fit(p, s), 0) / SYS_PAIRS.length; FB_C.set(p, { k, v }); return v; }
function fitRel(p, c) { return fit(p, c) - fitBase(p); }
function fitTag(p, c) { if (!c) return null; const f = fit(p, c), r = f - fitBase(p); return r >= FIT_REL.fits && f >= FIT_REL.fitsMin ? 'fits' : r <= FIT_REL.clash && f <= FIT_REL.clashMax ? 'clash' : null; }

// ---------- player tags ----------
// corner (Franchise Cornerstone): one of his team's top 2 by assetScore and an All-Star now, or 23 or younger with a public potential read (p.scout) at the All-League cut.
// untouch (Untouchable): trade status 'protect' (your p.protect, or an AI team's cornerstones / young core).
// bargain / overpaid: salary vs market value (≤ 0.7 and 3M+ under / ≥ 1.35 and 6M+). fits / clash: fitTag with his team's coach (rotation players).
const TAGS = { corner: 'Franchise Cornerstone', untouch: 'Untouchable', bargain: 'Bargain', overpaid: 'Overpaid', fits: 'Fits coach', clash: 'Clashes with coach' };
let CORNER_C = new WeakMap();
function cornerSet(L, t) {
  const k = L.season + ':' + L.phase + ':' + L.day + ':' + t.roster.length + ':' + (t.roster[0] || 0) + ':' + (t.roster[t.roster.length - 1] || 0);
  const e = CORNER_C.get(t); if (e && e.k === k && e.L === L) return e.s;
  const cut = tierCuts(L), s = new Set();
  const ros = rosterOf(L, t).filter(p => !p.prospect).sort((a, b) => assetScore(L, b) - assetScore(L, a)).slice(0, 2);
  for (const p of ros) if (p.ovr >= cut[3] || (p.age <= 23 && (p.scout || 0) >= cut[4])) s.add(p.id);   // cut[3] = All-Star, cut[4] = All-League
  CORNER_C.set(t, { k, L, s }); return s;
}
function isCorner(L, p) { return p.team != null && L.teams[p.team] ? cornerSet(L, L.teams[p.team]).has(p.id) : false; }
function payTag(p) {
  const c = p.contract; if (!c || !p.mval) return null;
  if (c.amt <= p.mval * 0.7 && p.mval - c.amt >= 3) return 'bargain';
  if (c.amt >= p.mval * 1.35 && c.amt >= 6) return 'overpaid';
  return null;
}
function playerTags(L, p) {
  if (!p || p.retired || p.prospect || p.team == null) return [];
  const t = L.teams[p.team], out = [];
  if (isCorner(L, p)) out.push({ k: 'corner', why: p.age <= 23 && p.ovr < tierCuts(L)[3] ? 'young, with an All-League ceiling' : 'one of his team\'s two most valuable players and an All-Star level player' });
  const st = tradeStatus(L, p); if (st && st.k === 'protect') out.push({ k: 'untouch', why: st.why });
  const pt = payTag(p); if (pt) out.push({ k: pt, why: `${money(p.contract.amt)}/yr, worth about ${money(p.mval)}` });
  if (rotationOf(L, t).some(x => x.id === p.id)) { const ft = fitTag(p, t.coach); if (ft) out.push({ k: ft, why: `${OFF_SYS[t.coach.off].name} / ${DEF_SYS[t.coach.def].name}: fit ${fit(p, t.coach)} (his usual ${Math.round(fitBase(p))})` }); }
  return out.map(x => ({ ...x, n: TAGS[x.k] }));
}
// AI value from tags (in playerTV): a team gives up its own cornerstone only at a premium; an overpaid player carries a small stigma for a buyer.
// Bargain/overpaid money is already in playerTV (salary vs value × years), so only a small extra.
const TAG_TV = { cornerGive: 1.12, overpaidGet: 0.95, bargainGet: 1.03 };
function tagTV(L, t, p, giving) {
  let m = 1;
  if (giving && p.team === t.id && isCorner(L, p)) m *= TAG_TV.cornerGive;
  if (!giving) { const pt = payTag(p); if (pt === 'overpaid') m *= TAG_TV.overpaidGet; else if (pt === 'bargain') m *= TAG_TV.bargainGet; }
  return m;
}

// ---------- coach report ----------
// coachReport(L, c, t): t = the roster to judge (his team, or yours when hiring). Returns style, star, key players, fit and preferred types.
const SYS_KEYS_TXT = { spd: 'speed', tp: '3-point shooting', agi: 'agility', fin: 'finishing', pst: 'post scoring', str: 'strength', orb: 'offensive rebounding', pas: 'passing', iq: 'IQ', mid: 'mid-range', hnd: 'ball handling', drw: 'drawing fouls', per: 'perimeter D', pdf: 'post D', wingB: 'length', blk: 'shot blocking', drb: 'rebounding', hgtB: 'size', stl: 'steals' };
function sysStrengths(p, c) {
  const W = slWeights(c), w = { ...W.o, ...W.d }, z = physZ(p);   // v27 K5
  return Object.keys(w).map(k => ({ k, v: k === 'wingB' ? 60 + z.w * 12 : k === 'hgtB' ? 60 + z.h * 12 : p[k] })).filter(x => x.v >= 70).sort((a, b) => b.v - a.v).slice(0, 2).map(x => SYS_KEYS_TXT[x.k] || LABELS[x.k] || x.k);
}
function coachReport(L, c, t) {
  if (!c) return null;
  const style = { off: c.off, offN: OFF_SYS[c.off].name, def: c.def, defN: DEF_SYS[c.def].name, youth: c.youth || 0, lean: (c.youth || 0) > 0 ? 'young players' : (c.youth || 0) < 0 ? 'veterans' : null, ro: c.ro, rd: c.rd, rdev: c.rdev, ovr: c.ovr };
  const wants = [...new Set([...SYS_WANTS[c.off], ...SYS_WANTS[c.def]])];
  if (!t) return { style, wants: wants.map(k => ({ k, pos: k.split('|')[0], n: k.split('|')[1] })) };
  const rot = rotationOf(L, t).filter(p => !p.prospect);
  const has = new Set(); for (const p of rot) if (p.ovr >= 60) for (const a of p.arch || []) has.add(a.p + '|' + a.n);
  const star = rosterOf(L, t).filter(p => !p.prospect).sort((a, b) => b.ovr - a.ovr)[0] || null;
  // key players: rotation players the system leans on most (fit above his usual, weighted by how good he is)
  const key = rot.map(p => ({ p, f: fit(p, c), r: fitRel(p, c) })).filter(x => x.f >= 60 && x.r >= 1).sort((a, b) => (b.f + b.r * 2 + b.p.ovr * 0.5) - (a.f + a.r * 2 + a.p.ovr * 0.5)).slice(0, 3)
    .map(x => ({ pid: x.p.id, fit: x.f, rel: Math.round(x.r), why: sysStrengths(x.p, c) }));
  const clash = rot.filter(p => fitTag(p, c) === 'clash').map(p => p.id);
  // roster fit: average fit of the top 8 (coachFitScore) and where this system pair ranks for this roster among all 12 pairs
  const score = coachFitScore(L, t, c), all = SYS_PAIRS.map(s => coachFitScore(L, t, s)).sort((a, b) => b - a);
  const rank = all.findIndex(v => v <= score + 1e-9) + 1, pct = Math.round(clamp((score - all[all.length - 1]) / Math.max(1e-6, all[0] - all[all.length - 1]), 0, 1) * 100);
  const best = SYS_PAIRS.slice().sort((a, b) => coachFitScore(L, t, b) - coachFitScore(L, t, a))[0];
  return { style, star: star ? { pid: star.id, fit: fit(star, c), tag: fitTag(star, c) } : null, key, clash, fit: { score: Math.round(score), rank, of: SYS_PAIRS.length, pct, best: { off: best.off, def: best.def, offN: OFF_SYS[best.off].name, defN: DEF_SYS[best.def].name } },
    wants: wants.map(k => ({ k, pos: k.split('|')[0], n: k.split('|')[1], has: has.has(k) })), line: fl(pct >= 75 ? 'cr.fit.good' : pct >= 40 ? 'cr.fit.ok' : 'cr.fit.bad', { name: c.name, team: t.name, pct }, c.id + L.season) };
}
// hiring: candidates ranked by how well they fit a roster (fit score, then rating). Each: { c, score, pct, delta vs the current coach, report }
function coachFitList(L, t, cands) {
  const cur = t.coach ? coachFitScore(L, t, t.coach) : 0;
  return cands.map(c => { const r = coachReport(L, c, t); return { c, score: r.fit.score, pct: r.fit.pct, delta: Math.round(r.fit.score - cur), report: r }; }).sort((a, b) => b.score - a.score || b.c.ovr - a.c.ovr);
}

// ---------- roster needs ----------
// rosterNeeds(L, t) → [{ k, cat: 'style' | 'youth' | 'other', urg: 'now' | 'summer' | 'minor', key, vars, text, sev }], most urgent first, max 8.
// Style: rotation (top 8, weighted) skill groups compared with the other teams (z); results (points for/against per game) once 10+ games are in.
// Youth: best 24-and-under by your read of his potential (teamPotEst). Other: thin positions, expiring top players, an aging core,
// an unhappy top player, a roster that doesn't fit the coach, tax, roster count.
const RN_GRP = { play: ['pas', 'hnd'], shoot: ['tp', 'mid'], reb: ['orb', 'drb'], rimD: ['blk', 'pdf'], perD: ['per', 'stl'], ath: ['spd', 'agi', 'vrt'], inside: ['fin', 'pst'] };
const RN_W = [1, 1, 1, 1, 1, 0.7, 0.5, 0.4];
const RN_PHYS = ['ath'];   // v30a #22: the physical-tools need (speed, agility, vertical)
let RN_C = null;
function rnTeamVals(L, t) {
  const rot = rotationOf(L, t).filter(p => !p.prospect).slice(0, 8), v = {};
  for (const g in RN_GRP) { let s = 0, w = 0; rot.forEach((p, i) => { const x = RN_GRP[g].reduce((a, k) => a + (p[k] || 0), 0) / RN_GRP[g].length; s += x * RN_W[i]; w += RN_W[i]; }); v[g] = w ? s / w : 50; }
  return v;
}
function rnLeague(L) {
  const key = L.season + ':' + L.phase + ':' + L.day;
  if (RN_C && RN_C.L === L && RN_C.key === key) return RN_C.v;
  const vals = L.teams.map(t => rnTeamVals(L, t)), st = {};
  for (const g in RN_GRP) { const a = vals.map(v => v[g]), m = a.reduce((x, y) => x + y, 0) / a.length, sd = Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / a.length) || 1; st[g] = [m, sd]; }
  const gp = L.teams.map(t => t.w + t.l), ok = Math.min(...gp) >= 10;
  if (ok) for (const [g, f] of [['off', t => t.pf / (t.w + t.l)], ['def', t => -t.pa / (t.w + t.l)]]) { const a = L.teams.map(f), m = a.reduce((x, y) => x + y, 0) / a.length, sd = Math.sqrt(a.reduce((x, y) => x + (y - m) * (y - m), 0) / a.length) || 1; st[g] = [m, sd, f]; }
  RN_C = { L, key, v: st }; return st;
}
function rnUrg(t, sev) {   // sev: 0-1; contenders feel it now, rebuilders in the summer
  const win = t.mode === 'contend' || t.mode === 'hopeful';
  return sev >= 0.75 ? (win ? 'now' : 'summer') : sev >= 0.45 ? 'summer' : 'minor';
}
function rosterNeeds(L, t) {
  const out = [], st = rnLeague(L), v = rnTeamVals(L, t), seed = t.id * 31 + L.season;
  const add = (k, cat, sev, vars, urg) => { out.push({ k, cat, sev, urg: urg || rnUrg(t, sev), key: 'rn.' + k, vars: vars || {} }); };
  // style
  const full = t.roster.length >= 15;   // v30a #22: with 15 players a physical need can't be fixed today (no roster spot): never "Fix now"
  for (const g in RN_GRP) { const z = (v[g] - st[g][0]) / st[g][1]; if (z <= -0.5) { const sev = clamp((-z - 0.5) / 1.2 + 0.2, 0, 1); let u = rnUrg(t, sev); if (full && RN_PHYS.includes(g) && u === 'now') u = 'summer'; add(g, 'style', sev, { z: z.toFixed(1) }, u); } }
  for (const g of ['off', 'def']) if (st[g]) { const z = (st[g][2](t) - st[g][0]) / st[g][1]; if (z <= -0.8) add(g, 'style', clamp((-z - 0.8) / 1.2 + 0.45, 0, 1), { z: z.toFixed(1), rank: L.teams.map(st[g][2]).filter(x => x > st[g][2](t)).length + 1 }); }
  // youth
  const cut = tierCuts(L), young = rosterOf(L, t).filter(p => p.age <= 24 && !p.retired);
  const bestY = young.map(p => ({ p, est: teamPotEst(L, t.id, p).est })).sort((a, b) => b.est - a.est)[0];
  const ty = bestY ? tierOfOvr(L, bestY.est) : -1;
  const lowLean = t.mode === 'rebuild' || t.mode === 'tank';
  if (ty < 3) add(ty < 1 ? 'youth.none' : 'youth.starter', 'youth', ty < 1 ? 0.8 : 0.55, { best: bestY ? bestY.p.name : '', tier: bestY ? TIER_A[Math.max(0, ty)] : '' }, lowLean ? 'now' : t.mode === 'contend' ? 'minor' : 'summer');
  // other
  const pr = positionRead(L, t); for (const x of pr) if (x.status === 'thin') { const n = x.depth.length; add(n ? 'thin' : 'nobody', 'other', n ? 0.35 : 0.85, { pos: POS[x.pos] }, n ? 'minor' : 'now'); }
  const top = rosterOf(L, t).filter(p => !p.prospect).sort((a, b) => b.ovr - a.ovr).slice(0, 3), cs = capSeason(L);
  for (const p of top) if (p.contract && p.contract.exp <= cs && p.ovr >= cut[1]) add('expiring', 'other', 0.6, { name: p.name }, 'summer');
  if (top.length === 3 && top.reduce((a, p) => a + p.age, 0) / 3 >= 31) add('aging', 'other', 0.5, { age: Math.round(top.reduce((a, p) => a + p.age, 0) / 3) }, 'summer');
  for (const p of top) if (p.morale != null && p.morale < 35) add('unhappy', 'other', 0.85, { name: p.name }, 'now');
  if (t.coach) { const r = coachReport(L, t.coach, t); if (r.fit.pct < 35) add('coachfit', 'other', 0.5, { coach: t.coach.name, sys: r.fit.best.offN + ' / ' + r.fit.best.defN }, 'summer'); }
  if (payroll(L, t, cs) > TAXLINE) add('tax', 'other', 0.5, { over: money(payroll(L, t, cs) - TAXLINE) }, 'summer');
  if (t.roster.length < 13) add('roster', 'other', 0.9, { n: t.roster.length }, 'now');
  const U = { now: 0, summer: 1, minor: 2 };
  return out.sort((a, b) => U[a.urg] - U[b.urg] || b.sev - a.sev).slice(0, 8).map((x, i) => ({ ...x, sev: Math.round(x.sev * 100) / 100, text: fl(x.key, x.vars, seed + i) }));
}
const RN_URG = { now: 'Fix now', summer: 'Fix this summer', minor: 'Minor' };

Object.assign(FLAVOR, {
  'rn.play': ['The offense lacks a reliable playmaker.', 'Few players on the roster can make plays for others.', 'The team needs more players who create for others.', 'The team lacks playmaking.'], 'rn.shoot': ['The team does not make enough jump shots.', 'The roster needs more reliable shooters.', 'Opponents can sag off the shooters on the roster.', 'The team lacks shooting.'], 'rn.reb': ['The team does not win the battle on the glass.', 'The roster needs more size and effort on the boards.', 'Rebounding is a problem for the team.', 'The team is weak on the boards.'],
  'rn.rimD': ['The team gives up too many shots at the rim.', 'The paint is unprotected.', 'The roster needs a stronger presence inside.', 'The team lacks rim protection.'], 'rn.perD': ['Opposing guards and wings get too many open looks.', 'The team gives up easy shots on the perimeter.', 'The roster needs more defenders who can stay in front of their man.', 'The team is weak defending the perimeter.'], 'rn.ath': ['The roster lacks quickness and explosiveness.', 'The team is slow on both ends.', 'The roster needs more players who can change a game physically.', 'The team lacks athleticism.'],
  'rn.inside': ['The team struggles to score close to the basket.', 'The roster needs a post scorer.', 'The offense has few easy baskets inside.', 'The team lacks inside scoring.'], 'rn.off': ['Scoring is a problem; the team ranks #{rank} in points.', 'The offense scores less than most teams (#{rank} in points).', 'The team ranks #{rank} in points scored.', 'The offense is one of the worst in the league (#{rank} in points).'], 'rn.def': ['The team gives up more points than most teams (#{rank} in points allowed).', 'Defense is a problem; the team ranks #{rank} in points allowed.', 'The team ranks #{rank} in points allowed.', 'The team is weak defensively (#{rank} in points allowed).'],
  'rn.youth.none': ['The team has no young player who looks like a rotation player.', 'Nobody age 24 or younger looks like a role player on the roster.', 'The future is unclear: no young player projects as a role player.', 'No player 24 or under projects as even a role player.'], 'rn.youth.starter': ['No young player is ready to start; the best is {best}, {tier}.', 'The roster has no starter under 25; the best young player is {best}, {tier}.', 'Young players are not ready to start, and the best is {best}, {tier}.', 'No player 24 or under projects as a starter; the best is {best}, {tier}.'],
  'rn.thin': ['Only one player in the rotation can play {pos}.', 'The rotation has just one {pos}.', 'Depth at {pos} is a concern.', 'Thin at {pos}: only one player in the rotation plays it.'], 'rn.nobody': ['No rotation player can play {pos}.', 'The rotation has no {pos}.', 'The team has no one in the rotation at {pos}.', 'Nobody in the rotation plays {pos}.'], 'rn.expiring': ['{name} can leave after this season.', 'The team must re-sign {name} or find a replacement.', '{name} is in the final year of his contract.', '{name} is in the last year of his deal: re-sign or replace him.'],
  'rn.aging': ['The top three players are older than most, averaging {age}.', 'The core is getting old, with an average age of {age} among the top three.', 'The best players are aging; their average age is {age}.', 'The top three players average {age} years old.'], 'rn.unhappy': ['{name} is not happy with the team.', '{name} has lost his enthusiasm for the team.', '{name} is not happy here.', '{name} is unhappy.'],
  'rn.coachfit': ['The players do not suit {coach}; the roster is built for {sys}.', 'The roster and {coach} are a poor match; the team is built for {sys}.', 'The players are not set up for the systems {coach} runs; they fit {sys} better.', 'The roster does not fit {coach}\'s systems; it is built for {sys}.'], 'rn.tax': ['The team would pay {over} in luxury tax.', 'Payroll is {over} above the tax line.', 'The team is {over} over the luxury tax line.', 'The payroll is {over} over the tax line.'], 'rn.roster': ['The roster needs more players; there are only {n} now.', 'Only {n} players are under contract, which is short.', 'The team has {n} players on the roster and needs more to be safe.', 'Only {n} players on the roster.'],
  'cr.fit.good': ['The {team} suit {name} well ({pct}%).', 'Fit between {name} and the {team} is strong ({pct}%).', 'The {team} are a strong match for {name} ({pct}%).', '{name}\'s systems fit the {team} well ({pct}%).'], 'cr.fit.ok': ['Fit between {name} and the {team} is fair ({pct}%).', 'The {team} are a reasonable match for {name} ({pct}%).', 'The {team} suit {name} about average ({pct}%).', '{name}\'s systems are a fair fit for the {team} ({pct}%).'], 'cr.fit.bad': ['Fit between {name} and the {team} is weak ({pct}%).', 'The {team} are a poor match for {name} ({pct}%).', 'The {team} do not suit {name} ({pct}%).', '{name}\'s systems are a poor fit for the {team} ({pct}%).']
});

// ---------- v26.0 S1: five-season line under the team header ----------
// recentLine(L, t) -> { k, text, trips, n }: from L.history (playoff series + champion per season). Variant-1 text in FLAVOR yr5.*; Haiku adds more.
function recentLine(L, t) {
  const hs = (L.history || []).filter(h => h && h.s != null);
  if (!hs.length) return { k: 'yr5.first', text: fl('yr5.first', {}, t.id), trips: 0, n: 0 };
  const inPO = h => (h.playoffs || []).some(r => (r.series || []).some(sr => sr.hi === t.id || sr.lo === t.id));
  const rec = hs.slice(-5).map(h => ({ s: h.s, po: inPO(h), title: h.champion === t.id }));
  const n = rec.length, trips = rec.filter(r => r.po).length, titles = rec.filter(r => r.title).map(r => r.s);
  let streak = 0; for (let i = rec.length - 1; i >= 0 && rec[i].po; i--) streak++;
  const lastPO = hs.filter(h => inPO(h)).map(h => h.s).slice(-1)[0];
  const yrs = n === 1 ? 'season' : 'years';
  let k, v = { trips, n, yrs, plural: trips === 1 ? '' : 's' };
  if (titles.length) { k = titles.length > 1 ? 'yr5.titles' : 'yr5.title'; v.year = yr(titles[titles.length - 1]); v.k = titles.length; v.years = titles.map(yr).join(' and '); }
  else if (streak >= 2) { k = 'yr5.streak'; v.streak = streak; }
  else if (streak === 1) { k = 'yr5.back'; }
  else if (lastPO != null) { k = 'yr5.since'; v.year = yr(lastPO); }
  else { k = 'yr5.never'; }
  return { k, text: fl(k, v, t.id + L.season), trips, n };
}
Object.assign(FLAVOR, {
  'yr5.first': ['First season: no playoff history yet.', 'No history yet; this is the first season.', 'The team has no history yet.', 'First season: no history yet.'],
  'yr5.title': ['Champions in {year}, with {trips} playoff trip{plural} in the last {n} {yrs}.', 'Took the title in {year}, with {trips} playoff trip{plural} in {n} {yrs}.', 'Title winners in {year}; {trips} playoff trip{plural} over {n} {yrs}.', 'Won the title in {year}; {trips} playoff trip{plural} in {n} {yrs}.'],
  'yr5.titles': ['Champions {k} times ({years}); {trips} playoff trip{plural} in {n} {yrs}.', 'Took {k} titles ({years}), with {trips} playoff trip{plural} in {n} {yrs}.', 'Title winners {k} times ({years}); {trips} playoff trip{plural} over {n} {yrs}.', 'Won {k} titles ({years}); {trips} playoff trip{plural} in {n} {yrs}.'],
  'yr5.streak': ['In the playoffs {streak} years running.', 'Playoff team {streak} seasons in a row.', 'Made the playoffs {streak} straight seasons.', '{streak} straight playoff appearances.'],
  'yr5.back': ['Reached the playoffs last season; {trips} trip{plural} in {n} {yrs}.', 'In the playoffs last season, with {trips} trip{plural} in {n} {yrs}.', 'Last season ended in the playoffs; {trips} trip{plural} in {n} {yrs}.', 'Made the playoffs last season; {trips} trip{plural} in {n} {yrs}.'],
  'yr5.since': ['Last playoff run was in {year}.', 'The last playoff appearance came in {year}.', 'Has not made the playoffs since {year}.', 'No playoffs since {year}.'],
  'yr5.never': ['No playoff appearances in the last {n} {yrs}.', 'Has not reached the playoffs in the last {n} {yrs}.', 'No playoff trips in the last {n} {yrs}, and no title.', 'No playoff trips in the last {n} {yrs}.']
});

// ===================== v26.1 Opus part: preseason odds, incentives, clauses, role promises =====================

// ---------- preseason (and live) odds ----------
// Monte Carlo with a private RNG (game randomness is untouched). Calibrated on simulated seasons: game win chance = logistic(0.2 × strength gap
// + 0.12 home), and a team's real strength drifts from its preseason number by about 1.6 over a season. Records so far count; the rest is simulated.
// Playoffs follow the real format (big: 6 direct + play-in 7-10, every round best of 7 (v30a); small: 3 + 4/5 play-in, best of 5 rounds, best-of-7 Finals).
// Awards are projections from ratings (with season noise and injury risk), not the vote formula: MVP (rating + team record), DPOY (defensive
// ratings + motor), ROY (rookies, rating + a starting spot), 6MOY (6th-8th best on his team in that sim), MIP (24 and under, room to grow), COY
// (team beating its preseason projection, plus coach rating).
const ODDS = { k: 0.2, home: 0.12, drift: 1.6, sims: 1000, pv: 2.2 };
function oddsRng(seed) { let s = seed >>> 0; return () => { s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
function amOdds(p) {   // American odds text: +350, -150
  if (!(p > 0)) return '—';
  p = clamp(p, 0.001, 0.99);
  const r = n => n >= 1000 ? Math.round(n / 100) * 100 : n >= 300 ? Math.round(n / 50) * 50 : Math.round(n / 10) * 10;
  return p >= 0.5 ? '-' + r(100 * p / (1 - p)) : p < 0.01 ? '+10000' : '+' + r(100 * (1 - p) / p);   // longer than 100-1 shows as +10000
}
function seasonOdds(L, force) {
  const S = L.season, key = L.phase + ':' + L.day;
  L.odds = L.odds || {};
  const o = L.odds[S] = L.odds[S] || {};
  if (!force && o.live && o.live.key === key) return o.live;
  if (!['regular', 'regular-done'].includes(L.phase)) return o.live || o.pre || null;
  const rnd = oddsRng(S * 7919 + L.day * 31 + 17), g = () => { let u = 0; for (let i = 0; i < 6; i++) u += rnd(); return (u - 3) * 1.4142; };   // ~N(0,1)
  const T = L.teams, n = T.length, big = isBig(L), str = {}, rem = {};
  for (const t of T) { str[t.id] = teamStrength(L, t); rem[t.id] = Math.max(0, SEASON_GAMES - (t.w + t.l)); }
  const mean = T.reduce((a, t) => a + str[t.id], 0) / n, sig = x => 1 / (1 + Math.exp(-x));
  const pGame = (a, b, home) => sig(ODDS.k * (a - b) + (home ? ODDS.home : 0));
  const series = (hi, lo, need, s) => { const homeG = need === 3 ? [1, 2, 5] : [1, 2, 5, 7]; let w = 0, l = 0, gN = 0; while (w < need && l < need) { gN++; const h = homeG.includes(gN), p = h ? pGame(s[hi], s[lo], true) : 1 - pGame(s[lo], s[hi], true); if (rnd() < p) w++; else l++; } return w === need ? hi : lo; };
  const one = (a, b, s) => rnd() < pGame(s[a], s[b], true) ? a : b;
  const ps = active(L).filter(p => p.team != null && !p.prospect && !(p.injLong && p.injury >= 40));
  const coachOf = {}; for (const t of T) coachOf[t.id] = t.coach;
  const cnt = { title: {}, mvp: {}, dpoy: {}, roy: {}, smoy: {}, mip: {}, coy: {} }, inc = (m, k) => m[k] = (m[k] || 0) + 1;
  const dBase = p => 0.25 * p.blk + 0.2 * p.pdf + 0.2 * p.per + 0.15 * p.stl + 0.2 * p.drb + 0.04 * (trv(p, 'mot') - 55);
  const rookie = p => p.rookieSeason === S;
  const expW = {}; for (const t of T) expW[t.id] = sig(ODDS.k * (str[t.id] - mean));
  const N = ODDS.sims;
  for (let it = 0; it < N; it++) {
    const s = {}, wins = {};
    for (const t of T) { s[t.id] = str[t.id] + g() * ODDS.drift * Math.sqrt(Math.max(0.15, rem[t.id] / SEASON_GAMES)); const p = sig(ODDS.k * (s[t.id] - mean)), r = rem[t.id]; wins[t.id] = t.w + r * p + g() * Math.sqrt(r * p * (1 - p)); }
    // playoffs
    const champs = [];
    for (const c of CONFS) {
      const seeds = T.filter(t => t.conf === c).map(t => t.id).sort((a, b) => wins[b] - wins[a]);
      let bracket;
      if (big) {
        const w78 = one(seeds[6], seeds[7], s), l78 = w78 === seeds[6] ? seeds[7] : seeds[6], w910 = one(seeds[8], seeds[9], s), eight = one(l78, w910, s);
        const r1 = [[seeds[0], eight], [seeds[3], seeds[4]], [seeds[1], w78], [seeds[2], seeds[5]]].map(([a, b]) => series(a, b, 4, s));   // v30a #24: best of 7
        const r2 = [series(r1[0], r1[1], 4, s), series(r1[2], r1[3], 4, s)];
        bracket = series(r2[0], r2[1], 4, s);
      } else {
        const q = pGame(s[seeds[4]], s[seeds[3]], false), four = rnd() < q * q ? seeds[4] : seeds[3];
        bracket = series(series(seeds[0], four, 3, s), series(seeds[1], seeds[2], 3, s), 3, s);
      }
      champs.push(bracket);
    }
    inc(cnt.title, wins[champs[0]] >= wins[champs[1]] ? series(champs[0], champs[1], 4, s) : series(champs[1], champs[0], 4, s));
    // awards
    const val = {}, out = {};
    for (const p of ps) { val[p.id] = p.ovr + g() * ODDS.pv; out[p.id] = rnd() < (100 - trv(p, 'dur')) / 260 + (p.injury > 0 ? Math.min(0.6, p.injury / 60) : 0); }
    let bm = null, bd = null, br = null, bs = null, bi = null;
    const byTeam = {}; for (const p of ps) (byTeam[p.team] = byTeam[p.team] || []).push(p);
    for (const tid in byTeam) {
      const r = byTeam[tid].filter(p => !out[p.id]).sort((a, b) => val[b.id] - val[a.id]), wp = wins[tid] / SEASON_GAMES;
      r.forEach((p, i) => {
        const mv = val[p.id] + 14 * (wp - 0.5); if (i < 2 && (!bm || mv > bm[1])) bm = [p.id, mv];
        if (i < 6) { const dv = dBase(p) + g() * 2.5; if (!bd || dv > bd[1]) bd = [p.id, dv]; }
        if (rookie(p)) { const rv = val[p.id] + (i < 5 ? 3 : 0) + g() * 1.5; if (!br || rv > br[1]) br = [p.id, rv]; }
        if (i >= 5 && i <= 7) { const sv = val[p.id]; if (!bs || sv > bs[1]) bs = [p.id, sv]; }
        if (p.age <= 24 && p.ovr >= 55) { const gap = Math.max(0, (p.ceil != null ? p.ceil : p.pot) - p.ovr) * (p.wet != null ? WET_G[p.wet] : 1); const iv = gap * 0.35 + (i < 6 ? 1.5 : 0) + g() * 2.5; if (!bi || iv > bi[1]) bi = [p.id, iv]; }
      });
    }
    if (bm) inc(cnt.mvp, bm[0]); if (bd) inc(cnt.dpoy, bd[0]); if (br) inc(cnt.roy, br[0]); if (bs) inc(cnt.smoy, bs[0]); if (bi) inc(cnt.mip, bi[0]);
    let bc = null; for (const t of T) { const cv = (wins[t.id] / SEASON_GAMES - expW[t.id]) * 100 + (coachOf[t.id].ovr - 60) * 0.08 + g() * 2; if (!bc || cv > bc[1]) bc = [t.id, cv]; }
    inc(cnt.coy, bc[0]);
  }
  const top = (m, mk) => Object.keys(m).map(k => ({ k: +k, p: m[k] / N })).sort((a, b) => b.p - a.p).slice(0, 5).map(x => ({ ...mk(x.k), p: Math.round(x.p * 1000) / 1000, odds: amOdds(x.p) }));
  const pl = id => ({ pid: id, tid: L.players[id] ? L.players[id].team : null });
  const res = { key, s: S, day: L.day, title: top(cnt.title, id => ({ tid: id })), mvp: top(cnt.mvp, pl), dpoy: top(cnt.dpoy, pl), roy: top(cnt.roy, pl), smoy: top(cnt.smoy, pl), mip: top(cnt.mip, pl), coy: top(cnt.coy, id => ({ tid: id, cid: L.teams[id].coach.id })) };
  o.live = res;
  if (!o.pre && L.day <= 1) o.pre = res;
  const ks = Object.keys(L.odds).map(Number).sort((a, b) => a - b); while (ks.length > 30) delete L.odds[ks.shift()];
  return res;
}
// the preseason favorites next to what happened (for the season review): { title: { fav, won, pWon }, mvp: {...}, ... }
function oddsVsResult(L, S) {
  const o = L.odds && L.odds[S] && L.odds[S].pre; if (!o) return null;
  const A = L.awards[S] || {}, H = (L.history || []).find(h => h.s === S) || {}, out = {};
  const pick = (arr, f, won) => ({ fav: arr[0] || null, won, pWon: won == null ? null : ((arr.find(f) || {}).p || 0) });
  out.title = pick(o.title, x => x.tid === H.champion, H.champion != null ? H.champion : null);
  for (const k of ['mvp', 'dpoy', 'roy', 'smoy', 'mip']) out[k] = pick(o[k], x => x.pid === A[k], A[k] != null ? A[k] : null);
  out.coy = pick(o.coy, x => x.tid === A.coyTid, A.coyTid != null ? A.coyTid : null);
  return out;
}

// ---------- incentives (several per contract) ----------
// c.incs = [{ k, amt, lk (likely at signing), paid }]. Total up to 25% of salary. Likely ones (≥ 50% when signed) count on the cap hit;
// unlikely ones don't (paid in cash if earned). Old single incentives (c.inc / c.incK) become one entry on first read and stay off the cap.
// Paid at the end of the regular season (gp, ppg, allstar, allleague, mvp, dpoy, playoffs) or when the playoffs end (conf, title).
Object.assign(INC_LABEL, { allleague: 'makes an All-League team', mvp: 'wins MVP', dpoy: 'wins Defensive Player of the Year', ppg: 'averages 20+ points', conf: 'team reaches the conference finals', title: 'team wins the title' });
const INC_KINDS = ['gp', 'ppg', 'allstar', 'allleague', 'mvp', 'dpoy', 'playoffs', 'conf', 'title'];
const INC_PO = ['conf', 'title'];
function incLikely2(L, p, t, k) {
  if (['gp', 'allstar', 'playoffs'].includes(k)) return incLikely(L, p, t, k);
  const o = L.odds && L.odds[L.season] ? (L.odds[L.season].live || L.odds[L.season].pre) : null;
  if (k === 'allleague') return p.ovr >= 86 ? 0.85 : p.ovr >= 82 ? 0.55 : p.ovr >= 78 ? 0.2 : p.ovr >= 74 ? 0.05 : 0.01;
  if (k === 'mvp') { const x = o && o.mvp.find(y => y.pid === p.id); return x ? x.p : p.ovr >= 88 ? 0.2 : p.ovr >= 84 ? 0.05 : 0.005; }
  if (k === 'dpoy') { const x = o && o.dpoy.find(y => y.pid === p.id); return x ? x.p : clamp((0.25 * p.blk + 0.2 * p.pdf + 0.2 * p.per + 0.15 * p.stl + 0.2 * p.drb - 60) / 60, 0.005, 0.3); }
  if (k === 'ppg') { const h = (p.hist || []).filter(x => x.rs && x.rs.gp >= gpq(20)).slice(-1)[0], ppg = h ? h.rs.pts / h.rs.gp : p.ovr >= 80 ? 18 : 10; return clamp(0.5 + (ppg - 20) * 0.12, 0.02, 0.92); }
  if (k === 'conf') return { contend: 0.4, hopeful: 0.15, rebuild: 0.03, tank: 0.01 }[t.mode] || 0.1;
  if (k === 'title') return { contend: 0.18, hopeful: 0.05, rebuild: 0.01, tank: 0.002 }[t.mode] || 0.03;
  return 0;
}
function incsOf(c) {
  if (!c) return [];
  if (!c.incs && c.inc > 0) c.incs = [{ k: c.incK || 'gp', amt: c.inc, lk: false, paid: c.incPaid || null, old: true }];
  return c.incs || [];
}
function incCap(c) { return incsOf(c).filter(x => x.lk).reduce((a, x) => a + x.amt, 0); }
function incEarned(L, p, t, k) {
  const s = p.stats.rs || {}, S = L.season, aw = a => (p.awards || []).some(x => x.s === S && x.a === a);
  if (k === 'gp') return (s.gp || 0) >= gpq(45);
  if (k === 'ppg') return (s.gp || 0) >= gpq(30) && s.pts / s.gp >= 20;
  if (k === 'allstar') return aw('All-Star');
  if (k === 'allleague') return (p.awards || []).some(x => x.s === S && /^All-League/.test(x.a));
  if (k === 'mvp') return aw('MVP');
  if (k === 'dpoy') return aw('Defensive Player of the Year');
  if (k === 'playoffs') { const seed = seedOrder(L, t.conf).indexOf(t.id) + 1; return seed > 0 && seed <= poPlayinTo(L); }
  const po = poResult(L, t.id);
  if (k === 'conf') return po === 'Champion' || po === 'Lost in Finals' || /conference finals/i.test(po);
  if (k === 'title') return po === 'Champion';
  return false;
}
function payIncs(L, kinds) {
  for (const t of L.teams) for (const p of rosterOf(L, t)) {
    const c = p.contract; if (!c) continue;
    for (const x of incsOf(c)) {
      if (!kinds.includes(x.k) || x.paid === L.season || !incEarned(L, p, t, x.k)) continue;
      x.paid = L.season; if (x.old) c.incPaid = L.season;
      if (t.fin) t.fin.paySum += x.amt * Math.max(1, t.fin.payDays);
      if (t.id === L.user || x.amt >= 3) logNews(L, `${p.name} earned his ${money(x.amt)} incentive (${INC_LABEL[x.k]})`, t.id, 'tx');
    }
  }
}

// ---------- clauses ----------
// c.kick: trade kicker (0.05-0.15). The first time he is traded his salary rises by that share for the rest of the deal (capped at his max);
//   the team getting him pays it, so playerTV takes it off for a buyer. He values it at about 40% of its size (he might never be traded).
// c.eto: early opt-out after that season (absolute season); decided with player options (opts out if his value is 10%+ above his salary, 31 or under).
// c.gtd: share of the final season that is guaranteed (0.25-0.75). Released before then → dead money for the final season is that share only.
// c.role: role promise { k: 'starter' | 'min', v (minutes), br: [seasons broken] }. Checked weekly once he has 15 games; broken once a season:
//   morale hit, news, friction with the coach; morale keeps a 'promise' part (+2 kept / -8 broken this season).
const KICK_MAX = 0.15, GTD_OPTS = [0.25, 0.5, 0.75], ROLE_MIN = [20, 24, 28, 32];
// v26.1 review: AI deals use clauses where real teams would: stars with power agents get kickers, young stars on long deals an opt-out,
// older players on multi-year deals a partial final year, and a player signed into a top-5 spot a starter promise (cheap to keep).
function aiClauses(L, p, tid, yrs) {
  const t = L.teams[tid], ex = {}, ag = agentOf(L, p);
  if (p.ovr >= 78 && ag && ag.kind === 'power' && R() < 0.45) ex.kick = R() < 0.5 ? 0.1 : 0.15;
  else if (p.ovr >= 80 && R() < 0.15) ex.kick = 0.05;
  if (yrs >= 3 && p.ovr >= 75 && p.age <= 30 && R() < 0.35) ex.eto = yrs - 1;   // v26.3: more AI opt-outs (was 4+ yrs, 78+, ≤29, 30%)
  if (yrs >= 2 && p.age >= 32 && R() < 0.5) ex.gtd = R() < 0.5 ? 0.5 : 0.25;
  const rank = rosterOf(L, t).filter(x => x.id !== p.id && x.ovr > p.ovr).length + 1;
  if (rank <= 4 && p.ovr >= 70 && R() < 0.3) ex.role = { k: 'starter' };
  return Object.keys(ex).length ? ex : null;
}
function applyKicker(L, p) {
  const c = p.contract; if (!c || !(c.kick > 0) || c.kicked) return;
  const was = c.amt; c.amt = r1(Math.min(Math.max(c.amt, maxFor(p)), c.amt * (1 + c.kick))); c.kicked = true;
  if (c.amt > was) { p.tx.push({ s: L.season, t: `Trade kicker: ${money(was)} → ${money(c.amt)}/yr` }); if (p.team === L.user || c.amt - was >= 1) logNews(L, `${p.name}'s trade kicker raised his salary to ${money(c.amt)}/yr`, p.team, 'tx'); }
}
function etoDecide(L) {
  const S = L.season;
  for (const t of L.teams) for (const p of rosterOf(L, t)) {
    const c = p.contract; if (!c || c.eto !== S || c.exp <= S) continue;
    c.eto = null;
    if (p.mval > c.amt * 1.1 && p.age <= 31) { c.exp = S; c.opt = null; p.tx.push({ s: S, t: `Opted out of his deal with ${t.abbr}` }); logNews(L, `${p.name} opted out of the rest of his ${money(c.amt)} deal with ${t.abbr}`, t.id, 'tx'); }
    else p.tx.push({ s: S, t: `Stayed in his deal with ${t.abbr} (opt-out not used)` });
  }
}
// role promise check
function promiseState(L, p) {
  const c = p.contract; if (!c || !c.role || p.team == null) return null;
  const S = L.season, t = L.teams[p.team], s = p.stats.rs || { gp: 0, gs: 0, min: 0 };
  if ((c.role.br || []).includes(S)) return 'broken';
  // judged on the games he was available for (team games minus games out injured), from 15 on; a DNP counts against the promise
  const tg = t.w + t.l, inj = (p.injuries || []).filter(x => x.s === S).reduce((a, x) => a + (x.games || 0), 0), avail = tg - Math.min(inj, tg);
  if (tg < 15 || avail < 12 || p.injLong) return 'early';
  const mpg = (s.min || 0) / avail / 60, gs = (s.gs || 0) / avail;
  if (ROLE_BY[c.role.k]) return c.role.k === 'dev' ? 'kept' : mpg < ROLE_BY[c.role.k].lo - 3 ? 'failing' : 'kept';   // v32b: under his role's range by 3+ minutes
  if (c.role.k === 'starter') return gs < 0.6 ? 'failing' : 'kept';
  return mpg < c.role.v - 3 ? 'failing' : 'kept';
}
function checkPromises(L) {
  if (L.phase !== 'regular') return;
  for (const t of L.teams) for (const p of rosterOf(L, t)) {
    if (promiseState(L, p) !== 'failing') continue;
    const c = p.contract; c.role.br = (c.role.br || []).concat(L.season);
    p.morale = Math.max(0, (p.morale == null ? 60 : p.morale) - Math.round(12 * clamp(1 - 0.25 * trc(p, 'cch'), 0.7, 1.3)));
    if (t.coach && !(p.friction || []).includes(t.coach.id)) p.friction = (p.friction || []).concat(t.coach.id);
    const what = ROLE_BY[c.role.k] ? `a ${roleName(c.role.k).toLowerCase()} role (${roleRange(c.role.k)} min)` : c.role.k === 'starter' ? 'a starting job' : `${c.role.v} minutes a game`;
    p.tx.push({ s: L.season, t: `Promise broken: ${what}` });
    logNews(L, `${p.name} (${t.abbr}) is upset: he was promised ${what}`, t.id, 'tx');
    try { feedPromise(L, p, t, what); } catch (e) { }   // v26.5
  }
}
// what a player gives up for clauses and promises in a negotiation (multiplies what he needs; < 1 = he takes less)
function clauseMult(L, p, t, yrs, ex) {
  let m = 1;
  if (ex.kick > 0) m *= 1 - 0.4 * Math.min(KICK_MAX, ex.kick);
  if (ex.eto && yrs >= 3) m *= 0.96;
  if (ex.gtd != null && ex.gtd < 1 && yrs >= 2) m *= 1 + 0.06 * (1 - ex.gtd);
  if (ex.role && ROLE_BY[ex.role.k]) {   // v32b: a promised role vs the role he'd get anyway: a bigger one he takes less for, a smaller one he wants paid for
    const d = roleMid(ex.role.k) - roleMid(expRole(L, t, p)), w = clamp(1 - 0.5 * twp(p, 'mon') + 0.3 * twp(p, 'win'), 0.4, 1.4) * (p.age <= 30 ? 1 : 0.7);
    m *= clamp(1 - (d > 0 ? 0.005 : 0.008) * d * w, 0.9, 1.15);
  } else if (ex.role) {
    const rank = rosterOf(L, t).filter(x => x.id !== p.id).filter(x => x.ovr > p.ovr).length + 1;   // where he'd slot in
    const need = rank <= 3 ? 0.25 : rank <= 5 ? 0.6 : 1;   // a sure starter barely cares
    const v = ex.role.k === 'starter' ? 0.07 : 0.012 * Math.max(0, (ex.role.v || 24) - 16) / 4;
    m /= 1 + v * need * clamp(1 - 0.5 * twp(p, 'mon') + 0.3 * twp(p, 'win'), 0.4, 1.4);
  }
  return m;
}
// clause effects on trade value (in playerTV): a buyer pays the kicker and takes on a promise he may not keep; a partial guarantee is flexible
function clauseTV(L, t, p, giving, v) {
  const c = p.contract; if (!c || giving || p.team === t.id) return v;
  if (c.kick > 0 && !c.kicked) { const yl = yrsLeft(L, p); v -= c.kick * c.amt * yl * 0.09; }
  if (c.role && ROLE_BY[c.role.k] && c.role.k !== 'starter') {   // v32 review: a promised role (S2 roles) travels with the contract and is a floor on the new team: price it like the old promises (-5% a role step he'd jump, max -15%)
    let er = null; try { er = expRole(L, t, p); } catch (e) { }
    const gap = er ? roleRank(er) - roleRank(c.role.k) : 0; if (gap > 0) v *= 1 - Math.min(0.15, 0.05 * gap);
  } else if (c.role) { const rank = rotationOf(L, t).filter(x => x.ovr > p.ovr).length; if ((c.role.k === 'starter' && rank >= 5) || (c.role.k === 'min' && rank >= 7)) v *= 0.9; }
  if (c.gtd != null && c.gtd < 1 && yrsLeft(L, p) >= 2) v *= 1.02;
  return v;
}

// v26.1: preseason odds when a season starts
{ const f0 = startNewSeason; startNewSeason = function (L) { const r = f0(L); try { seasonOdds(L, true); } catch (e) { } return r; }; }

// ===================== v26.2 Opus part: 6-year pick window, Stepien rule, pick swaps =====================
// Picks exist for this season and the next PICK_YEARS drafts (ensurePicks). Further out = more doubt: PICK_UNC by drafts out,
// projections regress harder to the middle (projFinish), the class read fades (classMult).

// ---------- Stepien rule ----------
// A team may not be left without a 1st-round pick (its own or anyone's) in two drafts in a row, counting the future drafts in the window
// (from the next draft whose order isn't set). A trade is refused only if it makes a team's count of such gaps worse (protections that
// roll can leave a gap the team didn't choose; those don't block other deals).
function stepienFirst(L) { const nd = nextDraftS(L); return L.draftOrder && L.draftOrder.length && nd === L.season ? nd + 1 : nd; }
function stepienGaps(L, tid, moved) {
  const first = stepienFirst(L), last = L.season + PICK_YEARS, has = {};
  for (const k of L.picks) { if (k.rd !== 1 || k.s < first || k.s > last) continue; const ow = moved && moved[k.id] != null ? moved[k.id] : k.owner; if (ow === tid) has[k.s] = true; }
  const gaps = []; for (let s = first; s < last; s++) if (!has[s] && !has[s + 1]) gaps.push(s);
  return gaps;
}
function stepienCheck(L, moved, tids) {
  for (const tid of tids) {
    const b = stepienGaps(L, tid, null), a = stepienGaps(L, tid, moved);
    if (a.length > b.length) { const s = a.find(x => !b.includes(x)); return `Stepien rule: ${L.teams[tid].abbr} would have no 1st-round pick in both ${draftLabel(s)} and ${draftLabel(s + 1)}`; }
  }
  return null;
}

// ---------- pick swaps ----------
// A swap right in draft s: the giver (g) lets the receiver (r) swap 1sts that year. Both teams must own their own 1st for s, unprotected,
// before the order is set. At the lottery, if g's 1st lands earlier than r's, the two picks change hands. While a swap is open, both picks are
// tied to it (they can't be traded or protected). In a trade: give.swaps = [{ s, g, r }] on the giving side. Not in 3-team trades.
// Value (in pick points): E[max(0, pts(g's slot) - pts(r's slot))] from the two slot spreads (independent), × class × years-out doubt.
function ownFirst(L, tid, s) { return L.picks.find(k => k.s === s && k.rd === 1 && k.orig === tid && k.owner === tid); }
function swapCheck(L, sw, pickIdsInDeal) {
  const G = L.teams[sw.g], Rt = L.teams[sw.r];
  if (!G || !Rt || sw.g === sw.r) return 'A pick swap needs two teams';
  if (sw.s < nextDraftS(L) || sw.s > L.season + PICK_YEARS) return `Pick swaps must be for a draft from ${draftLabel(nextDraftS(L))} to ${draftLabel(L.season + PICK_YEARS)}`;
  const a = ownFirst(L, sw.g, sw.s), b = ownFirst(L, sw.r, sw.s);
  if (!a) return `${G.abbr} don't own their ${draftLabel(sw.s)} 1st, so they can't offer a swap`;
  if (!b) return `${Rt.abbr} don't own their ${draftLabel(sw.s)} 1st, so there is nothing to swap`;
  for (const k of [a, b]) { if (k.prot) return `${pickLabel(L, k)} is protected and can't be swapped`; if (k.swap) return `${pickLabel(L, k)} is already tied to a swap`; if (draftSlotOf(L, k)) return 'Swaps can only be agreed before the draft order is set'; if ((pickIdsInDeal || []).includes(k.id)) return `${pickLabel(L, k)} can't be traded and swapped in the same deal`; }
  return null;
}
function swapPts(L, sw) {
  const a = ownFirst(L, sw.g, sw.s) || { id: sw.s + '-1-' + sw.g, s: sw.s, rd: 1, orig: sw.g, owner: sw.g }, b = ownFirst(L, sw.r, sw.s) || { id: sw.s + '-1-' + sw.r, s: sw.s, rd: 1, orig: sw.r, owner: sw.r };
  const pa = pickProj(L, a), pb = pickProj(L, b), n = L.teams.length;
  let ev = 0;
  if (pa.slot && pb.slot) for (let j = 1; j <= n; j++) { if (!pa.slot[j]) continue; for (let i = j + 1; i <= n; i++) if (pb.slot[i]) ev += pa.slot[j] * pb.slot[i] * (pickPts(L, 1, j) - pickPts(L, 1, i)); }
  return ev * classMult(L, a) * PICK_UNC[pickDist(L, a)];
}
function swapTV(L, t, sws) { return (sws || []).reduce((a, sw) => a + swapPts(L, sw) * (PICK_STATUS[t.mode] || 1) * PICK_SCALE, 0); }
function swapLabel(L, sw) { return fl('swap.label', { r: L.teams[sw.r].abbr, g: L.teams[sw.g].abbr, year: draftLabel(sw.s) }, sw.s * 31 + sw.g); }
function makeSwaps(L, sws) {
  for (const sw of sws || []) {
    const a = ownFirst(L, sw.g, sw.s), b = ownFirst(L, sw.r, sw.s); if (!a || !b) continue;
    const id = 'sw' + L.season + '-' + sw.s + '-' + sw.g + '-' + sw.r + '-' + ((L.swaps || []).length + 1);
    (L.swaps = L.swaps || []).push({ id, s: sw.s, g: sw.g, r: sw.r, pg: a.id, pr: b.id, made: L.season });
    a.swap = id; b.swap = id;
  }
  PP_C = null;
}
// at the lottery (after protections): swap the two picks if the giver's lands earlier and both are still where they were
function resolveSwaps(L, r1order) {
  const S = L.season, keep = [];
  for (const sw of L.swaps || []) {
    if (sw.s !== S) { keep.push(sw); continue; }
    const a = L.picks.find(k => k.id === sw.pg), b = L.picks.find(k => k.id === sw.pr);
    if (a) a.swap = null; if (b) b.swap = null;
    if (!a || !b || a.owner !== sw.g || b.owner !== sw.r) continue;
    const sa = r1order.indexOf(sw.g) + 1, sb = r1order.indexOf(sw.r) + 1;
    if (sa > 0 && sb > 0 && sa < sb) { a.owner = sw.r; b.owner = sw.g; logNews(L, fl('swap.used', { r: L.teams[sw.r].abbr, g: L.teams[sw.g].abbr, sa, sb, year: draftLabel(S) }, sw.s * 31 + sw.g), sw.r, 'draft'); }
    else logNews(L, fl('swap.unused', { r: L.teams[sw.r].abbr, g: L.teams[sw.g].abbr, sa, sb, year: draftLabel(S) }, sw.s * 31 + sw.g), sw.r, 'draft');
  }
  L.swaps = keep; PP_C = null;
}
function swapsOf(L, tid) { return (L.swaps || []).filter(sw => sw.g === tid || sw.r === tid); }

// ---------- v26.2 text (variant 1 is the original wording; Haiku adds more) ----------
Object.assign(FLAVOR, {
  'swap.used': ['Pick swap: {r} take {g}\'s 1st (#{sa}) and send back their own (#{sb})', 'Swap done: {r} get {g}\'s 1st (#{sa}) and give up their own (#{sb})', '{r} swapped picks with {g}: they take the #{sa} pick and send back #{sb}.', 'The pick swap went through: {r} now hold #{sa}, and {g} hold #{sb}.'],
  'swap.unused': ['Pick swap not used: {r} keep their {year} 1st (#{sb}; {g} #{sa})', 'No swap: {r} keep their {year} 1st (#{sb}; {g} had #{sa})', '{r} kept their {year} 1st (#{sb}); the swap with {g} (#{sa}) was not needed.', 'The swap with {g} did not happen: {r} keep the {year} 1st at #{sb}, and {g} stay at #{sa}.'],
  'swap.label': ['{r} can swap 1sts with {g} in {year}', '{r} and {g} have a pick swap in {year}', '{r} hold the right to swap 1sts with {g} in {year}', 'A pick swap with {g} is open for {r} in {year}']
});

// ===================== v26.5 (Opus): blended team statuses, social feed, game reactions, press conferences, more news =====================
// No R() anywhere below: every choice uses hrand / flHash, so sim results only change through the status and minutes rules.

// ---------- A2 front-office personality: patience and ambition (0-100), saved on t.fo ----------
const RISING_MAX = 4;   // Rising teams per 30
function foPersona(L, t) {
  const fo = t.fo, h = flHash('fo2|' + t.id + '|' + t.abbr + '|' + (L.startSeason || L.season));
  const u = (h % 1000) / 1000, v = ((h >>> 10) % 1000) / 1000;
  const pb = fo.style === 'picks' ? 15 : fo.style === 'win' ? -12 : 0, ab = fo.style === 'win' ? 15 : fo.style === 'picks' ? -8 : 0;
  fo.pat = Math.round(clamp(20 + u * 60 + pb, 5, 95)); fo.amb = Math.round(clamp(20 + v * 60 + ab, 5, 95));
  return fo;
}
const FO_TRAIT = { impatient: { label: 'Impatient', why: 'Cuts rebuilds short and jumps to buying early' }, patient: { label: 'Patient', why: 'Lets a rebuild run its full course' },
  ambitious: { label: 'Ambitious', why: 'Pushes to win sooner; more likely to buy' }, cautious: { label: 'Cautious', why: 'Slow to buy; happy to wait a season' } };
function foTraits(L, t) { const fo = foOf(L, t), out = []; if (fo.pat <= 35) out.push('impatient'); else if (fo.pat >= 65) out.push('patient'); if (fo.amb >= 65) out.push('ambitious'); else if (fo.amb <= 35) out.push('cautious'); return out; }
// For the team page: { style, styleLabel, pat, amb, traits: [{ k, label, why }] }
function foSummary(L, t) { const fo = foOf(L, t); return { style: fo.style, styleLabel: (FO_STYLE[fo.style] || FO_STYLE.neutral).label, pat: fo.pat, amb: fo.amb, traits: foTraits(L, t).map(k => ({ k, ...FO_TRAIT[k] })) }; }
// Rebuild plan length (seasons after this one): Loves picks / Patient 2, Impatient / Win-now 1, others 1-2
function planYears(L, t) { const fo = foOf(L, t); if (fo.style === 'picks' || fo.pat >= 65) return 2; if (fo.pat <= 35 || fo.style === 'win') return 1; return rint(1, 2); }

// ---------- A3 weighted random transitions on band edges ----------
// Fixed: top 8, bottom 3, a rebuild plan in the bottom half (unless the front office is impatient), and any team keeping its status (sticky).
// Rolls happen only when the status would change anyway, a team has none yet, or a rebuilding / tanking team's young core reaches playoff range.
// Never straight back to a status the team left earlier the same season.
function blendStatus(L, t, c) {
  const { r, b, n, B, young, prev, m, live, ridx, starPush } = c;
  const fat = (t.lowRun || 0) >= 3, plan = fat ? null : c.plan;   // v26.5 review: 3+ low seasons in a row: the plan no longer protects the status
  if (b <= 1) return null;
  if (b === 4 && r > n - B(3) && !fat) return null;
  const fo = foOf(L, t), low = prev === 'rebuild' || prev === 'tank', fromLow = low || prev === 'rising';
  const impatient = fo.pat <= 35 || fo.style === 'win';
  let w, kind;
  if (young >= 3 && r <= B(20) && (fromLow || plan || young >= 4)) {
    const last = plan && plan.until <= L.season;   // the plan's final season: the young core may be ready early
    if (plan && b >= 3 && !impatient && !(last && r <= B(20))) return null;
    w = b === 2 ? { rising: 55, hopeful: 25, rebuild: 20 } : plan ? { rebuild: 55, rising: 35, hopeful: 10 } : { rebuild: 50, rising: 35, hopeful: 15 }; kind = 'R';
    if (starPush && (fo.style === 'win' || fo.amb >= 65)) w.push = 15;
  } else if (b === 3 && !plan) { w = young >= 3 ? { rebuild: 60, rising: r > B(20) ? 12 : 25, hopeful: 15 } : { hopeful: 70, rebuild: 30 }; kind = 'Y'; }
  else if (b === 4 && !plan) { w = { tank: 75, rebuild: young >= 3 ? 40 : 25 }; kind = 'T'; }
  else return null;
  const rollable = !prev || m !== prev || (kind === 'R' && low) || (fat && ridx === 0);
  if (fat && kind === 'T') w.hopeful = 30;   // a win-now mandate after years at the bottom
  if (!rollable) return null;
  const amb = (fo.amb - 50) / 50, pat = (fo.pat - 50) / 50, mul = (k, x) => { if (w[k] != null) w[k] *= Math.max(0.1, x); };
  mul('hopeful', 1 + 0.5 * amb - 0.4 * pat); mul('push', 1 + 0.5 * amb); mul('rising', 1 + 0.3 * amb); mul('rebuild', 1 + 0.5 * pat - 0.3 * amb); mul('tank', 1 + 0.4 * pat - 0.4 * amb);
  if (fo.style === 'picks') { mul('rebuild', 1.25); mul('tank', 1.15); } else if (fo.style === 'win') { mul('hopeful', 1.3); mul('rising', 1.15); mul('tank', 0.7); }
  const tr = t.owner && t.owner.trust != null ? t.owner.trust : 60;
  if (tr < 35) { mul('tank', 0.4); mul('rebuild', 0.8); mul('hopeful', 1.3); } else if (tr >= 70) { mul('rebuild', 1.15); mul('tank', 1.1); }
  if (fat) { delete w.tank; mul('hopeful', 1.6); mul('rising', 1.3); mul('rebuild', 0.7); }   // rebuild fatigue
  if (live && c.gp >= 15) { const wp = t.w / Math.max(1, t.w + t.l); if (wp >= 0.5) { mul('hopeful', 1.3); mul('rising', 1.3); mul('tank', 0.5); } else if (wp < 0.38) { mul('rebuild', 1.3); mul('tank', 1.3); mul('hopeful', 0.6); mul('rising', 0.6); } }
  if (t.stLeft && t.stLeft.s === L.season && t.stLeft.st !== prev) delete w[t.stLeft.st];   // no flip-flops
  const ks = Object.keys(w); if (!ks.length) return null;
  const tot = ks.reduce((a, k) => a + w[k], 0); let x = hrand(t.id * 7 + 1, L.season * 8 + ridx, 2650) * tot, pick = ks[ks.length - 1];
  for (const k of ks) { x -= w[k]; if (x <= 0) { pick = k; break; } }
  const out = { m: pick };
  if (kind === 'R' && b === 2 && pick === 'rebuild' && fromLow && live) out.hold = true;
  if (pick === 'rising' && prev !== 'rising') out.why = 'rising';
  else if (plan && (pick === 'hopeful' || pick === 'push' || pick === 'rising')) { out.endPlan = true; if (impatient) out.why = 'impatient'; }
  else if (pick === 'rebuild' && kind === 'R' && fromLow && (fo.style === 'picks' || fo.pat >= 65)) out.why = 'patient';
  else if ((pick === 'hopeful' || pick === 'push') && fromLow && (fo.style === 'win' || fo.amb >= 65 || fo.pat <= 35)) out.why = 'impatient';
  if (out.why) RISE_CNT[out.why] = (RISE_CNT[out.why] || 0) + 1;
  return out;
}
const RISE_CNT = {};   // test counter: rolls by reason
// v26.5 review: after 4+ low seasons in a row the owner fires the GM. The new front office is impatient and ambitious (pat 15-50, amb 55-90), the plan is cleared.
function gmReset(L, t) {
  const h = flHash('gm|' + t.id + '|' + L.season), u = (h % 1000) / 1000, v = ((h >>> 10) % 1000) / 1000, x = ((h >>> 20) % 1000) / 1000;
  const n = t.lowRun;
  const fo = { style: x < 0.2 ? 'picks' : x < 0.6 ? 'neutral' : 'win', belief: r1(0.5 + v * 0.5), pat: Math.round(15 + u * 35), amb: Math.round(55 + v * 35) };
  if (t.gm) gmLeave(L, t, t.gm, 'fired');   // v27 S2: a person loses his job (news: st.newGM below)
  gmTakeOver(L, t, genGM(L, { fo }), L.season); t.fo = fo;
  t.plan = null; t.newGM = L.season; t.lowRun = 3; RISE_CNT.newGM = (RISE_CNT.newGM || 0) + 1;
  const vv = { team: `${t.city} ${t.name}`, abbr: t.abbr, n };
  logNews(L, flL(L, 'st.newGM', vv), t.id, 'league', 'status');
  addPost(L, 'newGM', 'nat', 'calm', vv, { tid: t.id, size: 1.3 }); addPost(L, 'newGM', 'fan', 'happy', vv, { tid: t.id, size: 0.8 });
}
function statusNews(L, t, old, m, why, label) {
  if (!old) return;
  const v = { team: `${t.city} ${t.name}`, abbr: t.abbr, status: STATUS_LABEL[m].toLowerCase(), was: STATUS_LABEL[old] ? STATUS_LABEL[old].toLowerCase() : '' };
  if (why) logNews(L, flL(L, 'st.' + why, v), t.id, 'league', 'status');
  if (old === m) return;
  const big = why || t.id === L.user || m === 'tank' || m === 'allin';
  if (!big) return;
  addPost(L, 'status', 'beat', mediaTone(L, t.id), v, { tid: t.id, size: 0.8 });
  const up = ['allin', 'contend', 'push', 'hopeful', 'rising'].includes(m) && !['allin', 'contend'].includes(old);
  if (t.id === L.user || why) addPost(L, 'status', 'fan', up ? 'happy' : 'upset', v, { tid: t.id, size: 0.6 });
  if (why === 'rising' || why === 'grewUp') addPost(L, 'status.' + why, 'nat', 'calm', v, { tid: t.id, size: 1.2 });
}

// ---------- A1 Rising: trade rules ----------
const risingKeepsPick = (L, t, k) => t.status === 'rising' && k && k.rd === 1 && k.orig === t.id && k.owner === t.id && k.s <= nextDraftS(L) + 2;
const risingYoung = p => p && p.age <= 24 && ((p.scout || 0) >= 70 || p.ovr >= 65);
// an AI Rising team: gives no own 1st in the next 3 drafts and no young core players; takes on veterans (28+) only on expiring deals
function risingOK(L, t, give, get) {
  if (!t || t.status !== 'rising' || t.id === L.user) return true;
  if ((give.picks || []).some(id => risingKeepsPick(L, t, L.picks.find(x => x.id === id)))) return false;
  if ((give.players || []).some(id => risingYoung(L.players[id]))) return false;
  if ((get.players || []).some(id => { const p = L.players[id]; return p && p.age >= 28 && yrsLeft(L, p) >= 2; })) return false;
  return true;
}

// ---------- A4 status sets minutes (lineup-value bonus in t.yb, about 0.75 per OVR point) ----------
function statusMinBoost(L, t, p) {
  const st = t.status; if (st !== 'rebuild' && st !== 'tank' && st !== 'rising') return 0;
  if (p.age <= 24) return st === 'rising' ? 2.5 : 3.5;
  if (p.age >= 30 && st !== 'rising') return -2.5;
  return 0;
}

// ---------- B1 event -> post engine ----------
const FEED_MAX = 300;
const FEED_AUTH = { fan: 'Fan', beat: 'Beat writer', nat: 'National writer', player: 'Player', team: 'Team account' };
const NAT_WRITERS = [{ name: 'Dana Whitfield', outlet: 'Hoops Insider' }, { name: 'Marco Villareal', outlet: 'Courtside Daily' }, { name: 'Priya Okafor', outlet: 'The Upside Report' }, { name: 'Theo Branson', outlet: 'Pacific Hoops Wire' }];
const BEAT_F = ['Sam', 'Jess', 'Rico', 'Ana', 'Ben', 'Mika', 'Leo', 'Tess', 'Carlo', 'Nina', 'Owen', 'Bea', 'Jun', 'Maya', 'Gus'], BEAT_L = ['Reyes', 'Holt', 'Navarro', 'Pike', 'Santos', 'Brennan', 'Quinto', 'Hale', 'Ocampo', 'Wells', 'Dizon', 'Marsh', 'Lim', 'Ford', 'Abad'];
const FAN_W = ['Faithful', 'Nation', 'Diehard', 'Hoops', 'Courtside', 'Fan', 'Hooper', 'Ultra', 'Believer', 'Lifer'];
function authorOf(L, a, o, n) {
  const t = o.tid != null ? L.teams[o.tid] : null, p = o.pid != null ? L.players[o.pid] : null;
  if (a === 'player' && p) return { name: p.name, handle: '@' + p.name.replace(/[^A-Za-z]/g, '').slice(0, 14), id: p.id };
  if (a === 'team' && t) return { name: `${t.city} ${t.name}`, handle: '@' + t.abbr, id: t.id };
  if (a === 'beat' && t) { const h = flHash('beat|' + t.id + '|' + (L.startSeason || 0)); return { name: `${BEAT_F[h % BEAT_F.length]} ${BEAT_L[(h >>> 8) % BEAT_L.length]}`, handle: `${t.city} beat`, id: t.id }; }
  if (a === 'fan') { const h = flHash('fan|' + n); return { name: `${t ? t.abbr : 'PBL'}${FAN_W[h % FAN_W.length]}${(h >>> 8) % 100}`, handle: t ? `${t.name} fan` : 'Fan', id: null }; }
  const w = NAT_WRITERS[flHash('nat|' + n) % NAT_WRITERS.length]; return { name: w.name, handle: w.outlet, id: null };
}
// key: fd.<event>.<author>.<tone>, then fd.<event>.<author>, then fd.<event>
function feedKey(ev, a, tone) { for (const k of [`fd.${ev}.${a}.${tone}`, `fd.${ev}.${a}`, `fd.${ev}`]) if (FLAVOR[k] && FLAVOR[k].length) return k; return null; }
function feedLikes(L, a, p, t, size, n) {
  const base = { fan: 25, beat: 70, nat: 260, player: 120, team: 150 }[a] || 50, fame = p ? (p.fame || 0) : 0, mk = t ? ([0.8, 1, 1.25, 1.6][t.market || 1] || 1) : 1;
  return Math.max(1, Math.round(base * (size || 1) * mk * (1 + fame / 40) * (0.6 + hrand(n, 26, 5) * 0.8)));
}
// one post. o: { tid, pid, size (how big the event is, 0.3-3), key (explicit text key), ref }
function addPost(L, ev, a, tone, vars, o) {
  o = o || {}; const k = o.key && FLAVOR[o.key] ? o.key : feedKey(ev, a, tone); if (!k) return null;
  const n = L.feedN = (L.feedN || 0) + 1, t = o.tid != null ? L.teams[o.tid] : null, p = o.pid != null ? L.players[o.pid] : null, au = authorOf(L, a, o, n);
  const post = { n, s: L.season, day: L.phase === 'regular' ? L.day : null, ph: L.phase, ev, a, au: au.name, ah: au.handle, aid: au.id, tid: o.tid != null ? o.tid : null, pid: o.pid != null ? o.pid : null, k, v: vars || {}, tone, likes: feedLikes(L, a, p, t, o.size, n) };
  if (o.ref != null) post.ref = o.ref;
  if (L.user != null && (post.tid === L.user || (p && p.team === L.user))) post.mine = 1;
  const F = L.feed = L.feed || []; F.unshift(post); if (F.length > FEED_MAX) F.length = FEED_MAX;
  return post;
}
function postText(L, post) { return fl(post.k, post.v, post.n); }
// filter: 'all' | 'team' (your team) | 'players' | 'media' (beat + national) | 'rumors'
function feedList(L, filter, max) {
  const F = L.feed || [], f = filter || 'all';
  const ok = x => f === 'all' ? true : f === 'team' ? !!x.mine : f === 'players' ? x.a === 'player' : f === 'media' ? (x.a === 'beat' || x.a === 'nat') : f === 'rumors' ? x.ev === 'rumor' || x.ev === 'rumor.true' : true;
  return F.filter(ok).slice(0, max || 100);
}
// tone from a player's traits and mood. good = the event is good for him
function playerTone(L, p, good) {
  const m = p.morale == null ? 60 : p.morale;
  if (!good && (m < 40 || trv(p, 'cch') < 40)) return 'upset';
  const top = ['mon', 'win', 'loy', 'mot'].map(k => [k, trv(p, k)]).sort((a, b) => b[1] - a[1])[0];
  if (top[1] >= 66) return { mon: 'money', win: 'winner', loy: 'loyal', mot: 'motor' }[top[0]];
  return good && m >= 70 ? 'happy' : 'calm';
}
// beat writers' tone toward your team follows your media reputation
function mediaRep(L) { return (L.media && L.media.rep != null) ? L.media.rep : 50; }
function mediaTone(L, tid) { if (tid !== L.user) return 'calm'; const r = mediaRep(L); return r < 35 ? 'snark' : r >= 70 ? 'warm' : 'calm'; }
const lineOf = (pts, reb, ast) => `${pts} pts, ${reb} reb, ${ast} ast`;
const feedWorthy = (L, tid, p) => tid === L.user || (p && (p.ovr >= 76 || (p.fame || 0) >= 55));

// ---------- B2 game reactions (rules; text in FLAVOR rx.*) ----------
// After your games (1-3 quotes from your side) and big league games (1 quote: rivalry, playoff, two top-6 teams, or a 45-point night).
function bigGame(L, g) {
  if (g.playoff || isRivalry(L, g.home, g.away)) return true;
  const pr = L.pr && L.pr.now ? L.pr.now : [], top = id => { const i = pr.indexOf(id); return i >= 0 && i < 6; };
  if (top(g.home) && top(g.away)) return true;
  return g.box.some(r => r[2 + IX.pts] >= 45);
}
function gameReactions(L, g) {
  const mineGame = L.user != null && (g.home === L.user || g.away === L.user);
  if (!mineGame && !bigGame(L, g)) return null;
  const out = [], hw = g.hs > g.as, margin = Math.abs(g.hs - g.as), rival = isRivalry(L, g.home, g.away), seed = g.id * 13;
  for (const [tid, si, won] of [[g.home, 0, hw], [g.away, 1, !hw]]) {
    if (mineGame && tid !== L.user) continue;
    if (!mineGame && !won) continue;   // big league games: the winners talk
    const t = L.teams[tid], opp = L.teams[tid === g.home ? g.away : g.home];
    const rows = g.box.filter(r => r[1] === si && r[2] > 0).map(r => ({ p: L.players[r[0]], min: r[2] / 60, pts: r[2 + IX.pts], reb: r[2 + IX.orb] + r[2 + IX.drb], ast: r[2 + IX.ast], gs: gmsc(r.slice(2, 17)) })).filter(x => x.p).sort((a, b) => b.gs - a.gs);
    const sc = won ? `${Math.max(g.hs, g.as)}-${Math.min(g.hs, g.as)}` : `${Math.min(g.hs, g.as)}-${Math.max(g.hs, g.as)}`;
    const base = { team: t.abbr, opp: opp.abbr, oppName: opp.name, score: sc, coach: t.coach ? t.coach.name : 'The coach' };
    const star = rows[0];
    // coach
    const ck = rival ? (won ? 'rivalW' : 'rivalL') : won ? (margin >= 20 ? 'blowW' : margin <= 4 ? 'closeW' : 'win') : (margin >= 20 ? 'blowL' : margin <= 4 ? 'closeL' : 'loss');
    const coachQ = { w: 'coach', tid, k: 'rx.coach.' + ck, v: { ...base, star: star ? star.p.name : t.abbr } };
    // best player
    let starQ = null;
    if (star && (star.pts >= 25 || star.gs >= 20)) {
      const p = star.p, conf = (trv(p, 'win') >= 66 || trv(p, 'mon') >= 66) && trv(p, 'cch') < 55;
      starQ = won ? { w: p.id, tid, k: 'rx.big.' + (conf ? 'confident' : 'humble'), v: { ...base, name: p.name, line: lineOf(star.pts, star.reb, star.ast) }, pts: star.pts }
        : { w: p.id, tid, k: 'rx.lossStar.' + (playerTone(L, p, false) === 'upset' ? 'upset' : 'calm'), v: { ...base, name: p.name, line: lineOf(star.pts, star.reb, star.ast) } };
    }
    if (!mineGame) { out.push(starQ || coachQ); continue; }
    out.push(coachQ); if (starQ) out.push(starQ);
    // minutes vs role: a regular (22+ a game) who played under 60% of that in a game that wasn't a blowout
    if (margin < 20 && out.length < 3) for (const x of rows.slice().reverse()) {
      const s = x.p.stats.rs; if (!s || s.gp < 5 || g.playoff) continue; const avg = s.min / s.gp / 60;
      if (avg < 22 || x.min >= avg * 0.6 || g.inj.some(i => i.pid === x.p.id)) continue;
      const c = trv(x.p, 'cch'); if (c >= 45 && c < 60) break;
      out.push({ w: x.p.id, tid, k: 'rx.min.' + (c < 45 ? 'upset' : 'calm'), v: { ...base, name: x.p.name, min: Math.round(x.min), avg: Math.round(avg) } });
      if (c < 45) x.p.morale = Math.max(0, (x.p.morale == null ? 60 : x.p.morale) - 2);
      break;
    }
    // a young player on a rebuilding / rising team who got real minutes and produced
    if (out.length < 3 && ['rebuild', 'tank', 'rising'].includes(t.status)) { const y = rows.find(x => x.p.age <= 23 && x.min >= 24 && x.gs >= 12); if (y) out.push({ w: y.p.id, tid, k: 'rx.young', v: { ...base, name: y.p.name, line: lineOf(y.pts, y.reb, y.ast) } }); }
    // rivalry: a winner or high-motor player
    if (out.length < 3 && rival) { const rv = rows.slice(0, 5).find(x => trv(x.p, 'win') >= 66 || trv(x.p, 'mot') >= 66); if (rv && rv !== star) out.push({ w: rv.p.id, tid, k: 'rx.rival.' + (won ? 'W' : 'L'), v: { ...base, name: rv.p.name } }); }
  }
  return out.length ? out : null;
}
function rxText(q, seed) { return fl(q.k, q.v, seed); }
function rxWho(L, q) { return q.w === 'coach' ? (q.v.coach || 'Coach') : (L.players[q.w] || {}).name || ''; }

// ---------- game hook (recordGame) ----------
function mediaGame(L, g) {
  try { storyGame(L, g); } catch (e) { }   // v26.6 R7
  const rx = gameReactions(L, g); if (rx) g.rx = rx;
  const mine = L.user != null && (g.home === L.user || g.away === L.user), hw = g.hs > g.as;
  // comeback feature: first game back from a 25+ game injury
  for (const r of g.box) { if (!(r[2] > 0)) continue; const p = L.players[r[0]]; const last = p && (p.injuries || []).slice(-1)[0]; if (!last || last.games < 25 || last.s < L.season - 1 || p.injury > 0 || p.cbS === L.season * 1000 + (p.injuries.length)) continue; p.cbS = L.season * 1000 + p.injuries.length; const tid = r[1] === 0 ? g.home : g.away; if (!feedWorthy(L, tid, p)) continue;
    const v = { name: p.name, team: L.teams[tid].abbr, injury: (last.name || 'injury').toLowerCase(), games: last.games, line: lineOf(r[2 + IX.pts], r[2 + IX.orb] + r[2 + IX.drb], r[2 + IX.ast]) };
    logNews(L, flL(L, 'feat.comeback', v), tid, 'feature', 'comeback'); addPost(L, 'feature', 'nat', 'calm', v, { tid, pid: p.id, key: 'feat.comeback', size: 1.2 }); }
  if (!mine && !(rx && rx.length)) return;
  if (mine) {
    const t = L.teams[L.user], won = (g.home === L.user) === hw, opp = L.teams[g.home === L.user ? g.away : g.home], margin = Math.abs(g.hs - g.as);
    const sc = won ? `${Math.max(g.hs, g.as)}-${Math.min(g.hs, g.as)}` : `${Math.min(g.hs, g.as)}-${Math.max(g.hs, g.as)}`;
    const si = g.home === L.user ? 0 : 1, best = g.box.filter(r => r[1] === si && r[2] > 0).sort((a, b) => gmsc(b.slice(2, 17)) - gmsc(a.slice(2, 17)))[0], bp = best && L.players[best[0]];
    const v = { team: t.abbr, teamName: t.name, opp: opp.abbr, oppName: opp.name, score: sc, star: bp ? bp.name : t.abbr, line: best ? lineOf(best[2 + IX.pts], best[2 + IX.orb] + best[2 + IX.drb], best[2 + IX.ast]) : '', n: Math.abs(t.streak) };
    const sz = (g.playoff ? 2 : 1) * (margin <= 4 ? 1.2 : 1);
    addPost(L, won ? 'win' : 'loss', 'team', won ? 'hype' : 'calm', v, { tid: t.id, pid: bp ? bp.id : null, size: sz, ref: g.id });
    const fanTone = won ? (t.streak >= 4 || margin >= 20 ? 'hype' : 'happy') : (t.streak <= -3 || margin >= 20 ? 'upset' : 'calm');
    addPost(L, won ? 'win' : 'loss', 'fan', fanTone, v, { tid: t.id, size: sz * 0.6, ref: g.id });
    const q = rx && rx.find(x => x.w !== 'coach');
    if (q) addPost(L, 'quote', 'player', 'calm', { quote: rxText(q, g.id), name: rxWho(L, q) }, { tid: t.id, pid: q.w, size: sz, ref: g.id, key: 'fd.quote' });
    // press conference triggers: 5+ game streaks
    if (!g.playoff && (t.streak === 5 || t.streak === 9 || t.streak === -5 || t.streak === -9)) pressTrigger(L, t.streak > 0 ? 'streakW' : 'streakL', { n: Math.abs(t.streak) });
  } else if (rx && rx[0]) {
    const q = rx[0], p = q.w !== 'coach' ? L.players[q.w] : null, line = q.v.line;
    if (p && line && (q.pts >= 35 || g.playoff)) addPost(L, 'line', 'nat', 'hype', { name: p.name, team: q.v.team, opp: q.v.opp, line, score: q.v.score }, { tid: q.tid, pid: p.id, size: g.playoff ? 2 : 1.3, ref: g.id });
  }
}

// ---------- trade, signing, injury, award, milestone, promise, holdout hooks ----------
function feedTrade(L, rec, aGive, bGive, grades) {
  const sides = [[rec.a, bGive.players, aGive.players, grades && grades.a], [rec.b, aGive.players, bGive.players, grades && grades.b]];
  const big = (rec.top || 0) >= 76, mine = rec.a === L.user || rec.b === L.user;
  if (!big && !mine) return;
  const ab = id => L.teams[id].abbr;
  const v0 = { a: ab(rec.a), b: ab(rec.b), aGets: rec.aGets, bGets: rec.bGets };
  addPost(L, 'trade', big ? 'nat' : 'beat', 'calm', v0, { tid: mine ? L.user : rec.a, size: big ? 2 : 1 });
  for (const [tid, inn, out, gr] of sides) {
    const t = L.teams[tid], bestIn = inn.map(id => L.players[id]).filter(Boolean).sort((x, y) => y.ovr - x.ovr)[0];
    if (tid === L.user || (big && bestIn && bestIn.ovr >= 76)) {
      const tone = !gr ? 'calm' : /^[AB]/.test(gr) ? 'happy' : /^[DF]/.test(gr) ? 'upset' : 'calm';
      addPost(L, 'trade', 'fan', tone, { team: t.abbr, gets: tid === rec.a ? rec.aGets : rec.bGets, grade: gr || '' }, { tid, size: 0.7 });
      if (bestIn) addPost(L, 'traded.in', 'team', 'hype', { team: t.name, name: bestIn.name }, { tid, pid: bestIn.id, size: 0.9 });
    }
    // the best player who left: his own post
    const gone = out.map(id => L.players[id]).filter(Boolean).sort((x, y) => y.ovr - x.ovr)[0];
    if (gone && (gone.ovr >= 70 || tid === L.user)) {
      const yrs = gone.hist.filter(h => h.tid === tid).length, to = L.teams[gone.team];
      const tone = trv(gone, 'loy') >= 66 && yrs >= 3 ? 'loyal' : trv(gone, 'win') >= 66 && to && to.mode === 'contend' ? 'winner' : (gone.morale != null && gone.morale < 40) ? 'relief' : trv(gone, 'mon') >= 66 ? 'money' : 'calm';
      addPost(L, 'traded', 'player', tone, { name: gone.name, from: t.name, fromCity: t.city, to: to ? to.name : '', toCity: to ? to.city : '' }, { tid, pid: gone.id, size: 1 });
    }
  }
  // rumors that came true
  for (const rm of L.rumors || []) if (rm.s === L.season && !rm.hit && [...aGive.players, ...bGive.players].includes(rm.pid)) { rm.hit = 1; const p = L.players[rm.pid]; const v = { name: p.name, to: L.teams[p.team].abbr }; addPost(L, 'rumor.true', 'nat', 'calm', v, { tid: p.team, pid: p.id, size: 1.5 }); }
  if (mine) { const bi = [...(rec.a === L.user ? bGive.players : aGive.players)].map(id => L.players[id]).filter(Boolean).sort((x, y) => y.ovr - x.ovr)[0]; pressTrigger(L, 'trade', { name: bi ? bi.name : '', pid: bi ? bi.id : null }); }
}
function feedSign(L, p, tid, type, amt, yrs) {
  if (type === 'rookie' || tid == null) return;
  const t = L.teams[tid]; if (!t) return;
  const star = p.ovr >= 75 || (p.fame || 0) >= 55;
  if (!(tid === L.user || star || amt >= 25)) return;
  const ev = type === 'signing' ? 'sign' : 'resign';
  const v = { name: p.name, team: t.name, abbr: t.abbr, city: t.city, yrs, amt: money(amt) };
  addPost(L, ev, 'team', 'hype', v, { tid, pid: p.id, size: star ? 1.5 : 0.8 });
  const tone = ev === 'resign' && trv(p, 'loy') >= 66 ? 'loyal' : trv(p, 'mon') >= 66 ? 'money' : ev === 'sign' && trv(p, 'win') >= 66 && t.mode === 'contend' ? 'winner' : 'calm';
  addPost(L, ev, 'player', tone, v, { tid, pid: p.id, size: star ? 1.5 : 0.8 });
  if (tid === L.user || star) { const over = p.mval && amt > p.mval * 1.3; addPost(L, ev, 'fan', over ? 'upset' : 'happy', v, { tid, size: 0.6 }); }
  if (star) addPost(L, ev, 'beat', 'calm', v, { tid, pid: p.id, size: 1 });
  if (tid === L.user && star && type === 'signing' && L.phase !== 'regular') pressTrigger(L, 'star', { name: p.name, pid: p.id });
}
function feedInjury(L, p, tid, games, name) {
  if (games < 10 || !feedWorthy(L, tid, p)) return;
  const v = { name: p.name, team: L.teams[tid].abbr, games, injury: (name || 'injury').toLowerCase() };
  addPost(L, 'inj', 'beat', mediaTone(L, tid) === 'snark' ? 'calm' : 'calm', v, { tid, pid: p.id, size: games >= 30 ? 1.5 : 1 });
  if (tid === L.user || p.ovr >= 80) addPost(L, 'inj', 'fan', 'upset', v, { tid, size: 0.7 });
  addPost(L, 'inj', 'player', trv(p, 'mot') >= 66 ? 'motor' : 'calm', v, { tid, pid: p.id, size: 1 });
}
function feedAward(L, pid, award) {
  const p = L.players[pid]; if (!p) return;
  const tid = p.team, v = { name: p.name, award, team: tid != null ? L.teams[tid].name : '' };
  addPost(L, 'award', 'nat', 'calm', v, { tid, pid, size: 2 });
  if (tid != null) addPost(L, 'award', 'team', 'hype', v, { tid, pid, size: 1.5 });
  addPost(L, 'award', 'player', trv(p, 'cch') >= 60 || trv(p, 'loy') >= 66 ? 'humble' : 'confident', v, { tid, pid, size: 2 });
}
function feedMilestone(L, p, what) { if (p.team == null || !feedWorthy(L, p.team, p) && !(p.fame >= 40)) return; addPost(L, 'ms', 'team', 'hype', { name: p.name, what }, { tid: p.team, pid: p.id, size: 1.2 }); }
function feedPromise(L, p, t, what) { addPost(L, 'promise', 'player', 'upset', { name: p.name, what, team: t.abbr }, { tid: t.id, pid: p.id, size: 1 }); addPost(L, 'promise', 'beat', 'calm', { name: p.name, what, team: t.abbr }, { tid: t.id, pid: p.id, size: 0.8 }); }
function feedHoldout(L, p, t) {
  if (!feedWorthy(L, t.id, p) && p.ovr < 72) return;
  const v = { name: p.name, team: t.abbr };
  addPost(L, 'hold', 'beat', 'calm', v, { tid: t.id, pid: p.id, size: 1 });
  addPost(L, 'hold', 'player', 'money', v, { tid: t.id, pid: p.id, size: 1 });
  if (t.id === L.user) addPost(L, 'hold', 'fan', 'upset', v, { tid: t.id, size: 0.6 });
}
// playoff series end (engine simPlayoffDay)
function mediaSeries(L, sr, pin) {
  const w = L.teams[sr.winner], lo = L.teams[sr.winner === sr.hi ? sr.lo : sr.hi], po = L.po, champ = !pin && po && po.rounds && po.rounds[po.stage] && po.rounds[po.stage].length === 1;   // the Finals is the only one-series round
  const v = { team: w.name, abbr: w.abbr, opp: lo.name, oppAbbr: lo.abbr, res: pin ? '' : `${Math.max(sr.hw, sr.lw)}-${Math.min(sr.hw, sr.lw)}` };
  if (champ) { addPost(L, 'champ', 'team', 'hype', v, { tid: w.id, size: 3 }); addPost(L, 'champ', 'nat', 'calm', v, { tid: w.id, size: 3 }); addPost(L, 'champ', 'fan', 'hype', v, { tid: w.id, size: 2 }); if (w.id === L.user) pressTrigger(L, 'champ', {}); }
  else if (w.id === L.user) addPost(L, 'series.win', 'fan', 'hype', v, { tid: w.id, size: 1.5 });
  if (lo.id === L.user) { addPost(L, 'series.loss', 'fan', 'upset', v, { tid: lo.id, size: 1.2 }); pressTrigger(L, 'exit', { opp: w.name }); }
}

// ---------- B3 press conferences ----------
// L.press = { id, s, day, ph, k, tid, qs: [{ k, v, pid?, ans? }], done }. One open at a time; it closes unanswered after 7 days (or a phase change) with no effect.
const PRESS_CHOICES = ['confident', 'humble', 'deflect', 'callout'];
const PRESS_GOOD = { streakW: true, streakL: false, trade: true, deadline: true, exit: false, champ: true, star: true };
const PRESS_LABEL = { confident: 'Confident', humble: 'Humble', deflect: 'Deflect', callout: 'Call out' };
function pressOpen(L) { const P = L.press; if (!P || P.done) return null; if (P.s !== L.season || P.ph !== L.phase || (L.phase === 'regular' && L.day - (P.day || 0) > 7)) { P.done = true; P.expired = true; return null; } return P; }
function pressTrigger(L, k, o) {
  if (L.user == null || L.mode === 'commish' || pressOpen(L)) return null;
  const t = L.teams[L.user]; if (!t) return null;
  const good = PRESS_GOOD[k], v = { team: t.name, abbr: t.abbr, ...o };
  const qs = [{ k: 'press.q.' + k, v }];
  // second question about one player: the subject (trade / signing), else the best player when winning or the coolest regular when losing
  let pl = o.pid != null ? L.players[o.pid] : null;
  if (!pl) { const rot = rotationOf(L, t).slice(0, 7); pl = good ? rot[0] : rot.slice().sort((a, b) => ((a.stats.rs && a.stats.rs.gp ? a.stats.rs.pts / a.stats.rs.gp : 0) - a.ovr / 5) - ((b.stats.rs && b.stats.rs.gp ? b.stats.rs.pts / b.stats.rs.gp : 0) - b.ovr / 5))[0]; }
  if (pl && pl.team === t.id) qs.push({ k: 'press.q.player.' + (good ? 'good' : 'bad'), v: { name: pl.name, team: t.name }, pid: pl.id });
  L.press = { id: (L.pressN = (L.pressN || 0) + 1), s: L.season, day: L.phase === 'regular' ? L.day : 0, ph: L.phase, k, tid: t.id, good, qs, done: false };
  PRESS_CNT[k] = (PRESS_CNT[k] || 0) + 1;
  return L.press;
}
const PRESS_CNT = {};
function pressText(q) { return fl(q.k, q.v, q.k.length + (q.v.n || 0)); }
// which answers a question allows (call out needs a player; the team question allows it as "call out the group")
function pressChoices(L, qi) { return PRESS_CHOICES.slice(); }
// Effects. good = good-news context. Returns { fx: { hype, trust, rep, morale: { pid: d } }, quote }
function pressEffects(L, P, q, choice) {
  const t = L.teams[P.tid], fx = { hype: 0, trust: 0, rep: 0, morale: {} }, g = P.good, rot = rotationOf(L, t).slice(0, 8), subj = q.pid != null ? L.players[q.pid] : null;
  const all = d => { for (const p of rot) fx.morale[p.id] = (fx.morale[p.id] || 0) + d; };
  if (choice === 'confident') { if (g) { fx.hype = 3; fx.trust = 1; fx.rep = 1; } else { fx.hype = 1; fx.trust = -1; fx.rep = -1; } all(1); }
  else if (choice === 'humble') { fx.hype = g ? 1 : 0; fx.trust = 1; fx.rep = 2; }
  else if (choice === 'deflect') { fx.rep = -2; }
  else if (choice === 'callout') {
    fx.rep = 1; if (!g) { fx.hype = 2; fx.trust = 2; }
    if (subj) { const c = trv(subj, 'cch'), d = c < 45 ? -12 : c < 70 ? -6 : -2; fx.morale[subj.id] = (fx.morale[subj.id] || 0) + d; for (const p of rot) if (p.id !== subj.id) fx.morale[p.id] = (fx.morale[p.id] || 0) - 1; fx.upset = c < 45 ? subj.id : null; }
    else all(-2);
  }
  return fx;
}
function answerPress(L, qi, choice) {
  const P = pressOpen(L); if (!P || !PRESS_CHOICES.includes(choice)) return null;
  const q = P.qs[qi]; if (!q || q.ans) return null;
  const t = L.teams[P.tid], fx = pressEffects(L, P, q, choice);
  if (fx.hype) hypeBump(t, fx.hype);
  if (fx.trust && t.owner) t.owner.trust = Math.round(clamp((t.owner.trust == null ? 60 : t.owner.trust) + fx.trust, 0, 100));
  L.media = L.media || { rep: 50 }; L.media.rep = Math.round(clamp(mediaRep(L) + fx.rep, 0, 100));
  for (const id in fx.morale) { const p = L.players[id]; if (p) p.morale = Math.round(clamp((p.morale == null ? 60 : p.morale) + fx.morale[id], 0, 100)); }
  const subj = q.pid != null ? L.players[q.pid] : null;
  if (fx.upset && subj) { if (t.coach && !(subj.friction || []).includes(t.coach.id)) subj.friction = (subj.friction || []).concat(t.coach.id); addPost(L, 'callout', 'player', 'upset', { name: subj.name, team: t.abbr }, { tid: t.id, pid: subj.id, size: 1.2 }); }
  const qv = { ...q.v, name: subj ? subj.name : (q.v.name || ''), coach: t.coach ? t.coach.name : 'The coach' };
  const quote = fl('press.a.' + choice + '.' + (subj ? 'p' : 't') + '.' + (P.good ? 'good' : 'bad'), qv, P.id * 4 + qi);   // 16 keys: choice x player/team question x good/bad news
  q.ans = choice; q.fx = fx; q.quote = quote;
  addPost(L, 'press', 'beat', mediaTone(L, t.id), { coach: qv.coach, quote, team: t.abbr }, { tid: t.id, size: 1, key: 'fd.press.beat' });
  if (P.qs.every(x => x.ans)) P.done = true;
  return { fx, quote, done: P.done };
}

// ---------- B4 more news: rumors, beat reports, power-ranking blurbs, features ----------
function beatReport(L) {
  if (L.user == null || L.phase !== 'regular' || L.day < 7) return;
  const t = L.teams[L.user], l10 = (t.last10 || ''), w10 = l10.split('').filter(c => c === 'W').length, rot = rotationOf(L, t).slice(0, 8), rem = SEASON_GAMES - (t.w + t.l);
  const out = rosterOf(L, t).filter(p => p.injury > 0 && rot.some(x => x.id === p.id));
  const yng = ['rebuild', 'tank', 'rising'].includes(t.status) ? rosterOf(L, t).filter(p => p.age <= 23 && p.stats.rs && p.stats.rs.gp >= 5 && p.stats.rs.min / p.stats.rs.gp / 60 >= 24).sort((a, b) => b.stats.rs.min / b.stats.rs.gp - a.stats.rs.min / a.stats.rs.gp)[0] : null;
  let k, v = { team: t.name, abbr: t.abbr, rec: `${t.w}-${t.l}`, w: w10, n: l10.length };
  if (l10.length >= 8 && w10 >= 7) k = 'hot'; else if (l10.length >= 8 && w10 <= 3) k = 'cold';
  else if (out.length >= 2) { k = 'injury'; v.n = out.length; v.names = out.slice(0, 2).map(p => p.name).join(' and '); }
  else if (yng) { k = 'youth'; v.name = yng.name; v.mpg = (yng.stats.rs.min / yng.stats.rs.gp / 60).toFixed(1); v.status = STATUS_LABEL[t.status].toLowerCase(); }
  else k = 'steady';
  const tone = mediaTone(L, t.id), key = FLAVOR['beat.' + k + '.' + tone] ? 'beat.' + k + '.' + tone : 'beat.' + k;
  logNews(L, flL(L, key, v), t.id, 'beat', k);
  addPost(L, 'beat', 'beat', tone, v, { tid: t.id, key, size: 0.8 });
}
// power-ranking blurbs: L.prBlurbs = { s, day, by: { tid: { k, v } } }; text with prBlurb(L, tid)
function prBlurbs(L) {
  if (!L.pr || !L.pr.now) return;
  const by = {}, prev = L.pr.prev || [];
  L.pr.now.forEach((tid, i) => {
    const t = L.teams[tid], rank = i + 1, pi = prev.indexOf(tid), d = pi >= 0 ? pi - i : 0;
    const v = { team: t.name, abbr: t.abbr, rank, d: Math.abs(d), rec: `${t.w}-${t.l}`, status: STATUS_LABEL[shownStatus(t)] ? STATUS_LABEL[shownStatus(t)].toLowerCase() : '' };
    const k = rank === 1 ? 'top' : d >= 3 ? 'up' : d <= -3 ? 'down' : t.status === 'rising' ? 'rising' : t.status === 'tank' ? 'tank' : t.status === 'rebuild' ? 'rebuild' : rank <= 8 ? 'contend' : 'steady';
    by[tid] = { k, v };
  });
  L.prBlurbs = { s: L.season, day: L.day, by };
}
function prBlurb(L, tid) { const b = L.prBlurbs && L.prBlurbs.s === L.season && L.prBlurbs.by[tid]; return b ? fl('prb.' + b.k, b.v, tid + (L.prBlurbs.day || 0)) : ''; }
// features: breakouts and winning streaks (comebacks in mediaGame, milestones in milestoneCheck)
function featureWeek(L) {
  if (L.phase !== 'regular') return;
  for (const p of active(L)) {
    if (p.team == null || p.age > 25 || p.featS === L.season) continue;
    const s = p.stats.rs; if (!s || s.gp < 15) continue;
    const ppg = s.pts / s.gp, h = p.hist.slice().reverse().find(x => x.s < L.season && x.rs && x.rs.gp >= 10), prev = h ? h.rs.pts / h.rs.gp : 0;
    if (ppg >= 15 && ppg - prev >= 6) { p.featS = L.season; const v = { name: p.name, team: L.teams[p.team].abbr, ppg: ppg.toFixed(1), prev: prev.toFixed(1), age: p.age };
      logNews(L, flL(L, 'feat.breakout', v), p.team, 'feature', 'breakout'); addPost(L, 'feature', 'nat', 'calm', v, { tid: p.team, pid: p.id, key: 'feat.breakout', size: 1.4 }); }
  }
  for (const t of L.teams) if (t.streak >= 7 && t.featStk !== L.season * 1000 + t.w - t.streak) { t.featStk = L.season * 1000 + t.w - t.streak; const v = { team: t.name, abbr: t.abbr, n: t.streak, rec: `${t.w}-${t.l}` };
    logNews(L, flL(L, 'feat.streak', v), t.id, 'feature', 'streak'); addPost(L, 'feature', 'nat', 'calm', v, { tid: t.id, key: 'feat.streak', size: 1.3 }); }
}
// daily hook (afterDay)
function mediaDay(L) {
  pressOpen(L);
  const wd = L.day % 7;
  if (wd === 3) rumorWeek(L);
  if (wd === 0) { beatReport(L); prBlurbs(L); }
  if (wd === 5) featureWeek(L);
  if (wd === 1) realismWeek(L);   // v26.6: media reputation -> owner trust, coach hot seat, award race, fan mood
  if (L.day === deadlineDay(L) + 1) pressTrigger(L, 'deadline', {});
}
// old saves
function migrateV265(L) {
  for (const t of L.teams) foOf(L, t);
  if (!L.feed) L.feed = [];
  if (!L.media) L.media = { rep: 50 };
}

// ===================== v26.6 (Opus): development roles (P2-P5) and realism (R1-R8) =====================
// No R() below (hrand / flHash), except where noted. Season length (P1) lives in engine.js (SEASON_GAMES, gpq, makeSchedule) and setSeasonLen.

// ---------- P2 / P3 development role: lineup value (t.yb) for 23 and under on Rebuild / Tank / Rising teams ----------
// potential: 0.15 per point of gap to his potential read (scout 70+), up to 3.5; coach adapts the role: half of his fit penalty back (0.125 per fit point under 55; 0.18 for a youth-minded coach)
const DEV_TEAM = t => t && (t.status === 'rebuild' || t.status === 'tank' || t.status === 'rising');
function devRole(L, t, p) {
  if (!DEV_TEAM(t) || p.age > 23 || !t.coach) return null;
  const sp = p.scout != null ? p.scout : p.pot, f = fit(p, t.coach);
  const pot = sp >= 70 ? clamp((sp - p.ovr) * 0.15, 0, 3.5) : 0, adapt = f < 55 ? (55 - f) * ((t.coach.youth || 0) > 0 ? 0.18 : 0.125) : 0;
  return { pot: r1(pot), adapt: r1(adapt), fit: f, sp, focus: sysFocus(L, p) };
}
function devRoleBoost(L, t, p) { const d = devRole(L, t, p); return d ? d.pot + d.adapt : 0; }
// ---------- P5 usage by role: the 2 best young prospects (scout 72+) on those teams get up to +15% shot share ----------
function devUsage(L, t, p) {
  if (!DEV_TEAM(t) || p.age > 23) return 1;
  const sp = p.scout != null ? p.scout : p.pot; if (sp < 72) return 1;
  const top = rosterOf(L, t).filter(x => x.age <= 23 && (x.scout != null ? x.scout : x.pot) >= 72).sort((a, b) => (b.scout || b.pot) - (a.scout || a.pot)).slice(0, 2);
  return top.includes(p) ? Math.round((1 + clamp((sp - 70) / 100, 0.03, 0.15)) * 100) / 100 : 1;
}
// ---------- P4 development plan: the training focus aims at what the coach's systems need ----------
const SKILL_FOCUS = { tp: 'shoot', mid: 'shoot', pst: 'post', str: 'post', pas: 'play', iq: 'play', hnd: 'handle', fin: 'finish', drw: 'finish', blk: 'rim', pdf: 'rim', per: 'perD', stl: 'perD', drb: 'reb', orb: 'reb' };
function sysFocus(L, p) {
  const t = p.team != null ? L.teams[p.team] : null;
  if (!t || t.id === L.user || !DEV_TEAM(t) || p.age > 23 || !t.coach) return null;
  const c = t.coach, f = fit(p, c); if (f >= 55 && fitTag(p, c) !== 'clash') return null;
  const W = slWeights(c), w = { ...W.o }; for (const [k, x] of Object.entries(DEF_SYS[c.def].w)) w[k] = (w[k] || 0) + x;   // v27 K5: slider-tilted offensive needs (defense keeps its system weights)
  const need = Object.entries(w).filter(([k]) => SKILL_FOCUS[k] && p[k] != null && p[k] < 60).sort((a, b) => b[1] - a[1])[0];
  return need ? SKILL_FOCUS[need[0]] : null;
}

// ---------- R2 free-agency media ----------
// first day a star (76+ or fame 55+) is on the market: who he is meeting with (the 2 best real offers; 25% of the time a team that isn't bidding gets named too)
function faLeak(L, p, offers) {
  if (!(p.ovr >= 76 || (p.fame || 0) >= 55) || p.faLeakS === L.season || !offers.length) return;
  p.faLeakS = L.season;
  const real = offers.slice(0, 2).map(o => L.teams[o.tid]);
  const fakeT = hrand(p.id, L.season, 2661) < 0.25 ? L.teams.filter(t => !offers.some(o => o.tid === t.id) && t.id !== L.user)[Math.floor(hrand(p.id, L.season, 2662) * (L.teams.length - offers.length - 1))] : null;
  const names = [...real, ...(fakeT ? [fakeT] : [])].map(t => t.abbr), teams = names.length > 1 ? names.slice(0, -1).join(', ') + ' and ' + names[names.length - 1] : names[0];
  const v = { name: p.name, ovr: p.ovr, pos: POS[p.pos], teams };
  logNews(L, flL(L, 'fa.meet', v), null, 'rumor', 'fa');
  addPost(L, 'rumor', 'nat', 'calm', v, { pid: p.id, tid: real[0] ? real[0].id : null, key: 'fa.meet', size: 1.6 });
  (L.rumors = L.rumors || []).unshift({ n: (L.rumorN = (L.rumorN || 0) + 1), s: L.season, day: null, pid: p.id, from: null, to: real[0] ? real[0].id : null, k: 'fa', real: 1, fa: real.map(t => t.id) }); if (L.rumors.length > 40) L.rumors.length = 40;
}
// why he chose the team: money / winner / loyal / role / market / fit (L.faWhy[pid], news, post)
function faReason(L, p, best, offers) {
  const t = L.teams[best.tid], mx = Math.max(...offers.map(o => o.amt)), second = offers.find(o => o !== best);
  if (second && best.amt >= mx * 0.99 && second.amt < best.amt * 0.95) return 'money';
  if (best.tid === p.lastTeam && trv(p, 'loy') >= 60) return 'loyal';
  if (t.mode === 'contend' && trv(p, 'win') >= 60) return 'winner';
  if (p.ovr >= 76 && !rosterOf(L, t).some(x => x.id !== p.id && x.ovr > p.ovr)) return 'role';
  if (t.market === 3 && (p.fame || 0) >= 50) return 'market';
  return best.amt >= mx * 0.99 ? 'money' : 'fit';
}
function faDecision(L, p, best, offers) {
  if (!(p.ovr >= 74 || (p.fame || 0) >= 50) || offers.length < 2) return;
  const why = faReason(L, p, best, offers), t = L.teams[best.tid];
  (L.faWhy = L.faWhy || {})[p.id] = { s: L.season, tid: t.id, why };
  const v = { name: p.name, team: t.name, abbr: t.abbr, city: t.city, n: offers.length };
  logNews(L, flL(L, 'fa.why.' + why, v), t.id, 'tx', 'faWhy');
  addPost(L, 'faPick', 'nat', why, v, { tid: t.id, pid: p.id, size: 1.8 });
  for (const rm of L.rumors || []) if (rm.k === 'fa' && rm.pid === p.id && rm.s === L.season && !rm.hit) { rm.hit = rm.fa && rm.fa.includes(t.id) ? 1 : -1; if (rm.hit > 0) addPost(L, 'rumor.true', 'nat', 'calm', { name: p.name, to: t.abbr }, { tid: t.id, pid: p.id, size: 1.2 }); }
}

// ---------- R3 rumors from real talks ----------
// deals the AI gate turned down narrowly (gain 85%+ of loss) are remembered for the week's rumors
function noteNearDeal(L, tr, me) {
  if (L.phase !== 'regular') return;
  const ps = [...tr.aGive.players, ...tr.bGive.players].map(id => L.players[id]).filter(Boolean).sort((a, b) => b.ovr - a.ovr), p = ps[0];
  if (!p || p.ovr < 66) return;
  const N = L.nearDeals = (L.nearDeals || []).filter(x => x.s === L.season && x.day >= L.day - 10);
  if (N.some(x => x.pid === p.id)) return;
  N.unshift({ s: L.season, day: L.day, pid: p.id, from: p.team, to: p.team === tr.a ? tr.b : tr.a }); if (N.length > 20) N.length = 20;
}
// accuracy by author: national writers 85% real, beat writers 70%, fans 40%
const RUMOR_REAL = { nat: 0.85, beat: 0.7, fan: 0.4 };
function rumorWeek(L) {
  if (!inTradeWindow(L) || L.phase !== 'regular' || L.day > deadlineDay(L)) return;
  const ai = L.teams.filter(t => t.id !== L.user), buyers = ai.filter(t => t.mode === 'contend' || t.status === 'push' || t.status === 'hopeful');
  const pool = [];
  for (const x of L.nearDeals || []) { const p = L.players[x.pid]; if (p && p.team === x.from && L.teams[x.to]) pool.push({ p, t: L.teams[p.team], o: L.teams[x.to], k: 'near', real: 1 }); }
  for (const t of ai) for (const id in t.tstat || {}) { const p = L.players[id], s = t.tstat[id]; if (p && s.k === 'block' && p.ovr >= 66 && p.team === t.id) pool.push({ p, t, k: 'shop', real: 1 }); }
  if (L.user != null) for (const p of rosterOf(L, L.teams[L.user])) { if (p.block) pool.push({ p, t: L.teams[L.user], k: 'userShop', real: 1 }); else if (p.protect && p.ovr >= 68) pool.push({ p, t: L.teams[L.user], k: 'untouch', real: 1 }); }
  const wk = Math.floor(L.day / 7), n = 1 + (hrand(L.season, wk, 2651) < 0.6 ? 1 : 0), used = new Set((L.rumors || []).filter(r => r.s === L.season && r.day != null && r.day >= L.day - 21).map(r => r.pid));
  for (let i = 0; i < n; i++) {
    const ar = hrand(L.season * 31 + wk, i, 2663), a = ar < 0.45 ? 'nat' : ar < 0.8 ? 'beat' : 'fan';
    const fake = hrand(L.season * 31 + wk, i, 2652) >= RUMOR_REAL[a];
    let c;
    const live = pool.filter(x => !used.has(x.p.id)), nearP = live.filter(x => x.k === 'near');
    if (fake || !live.length) { const rot = ai.flatMap(t => rotationOf(L, t).slice(0, 6).filter(p => p.ovr >= 70 && !used.has(p.id) && !(t.tstat && t.tstat[p.id] && t.tstat[p.id].k === 'protect')).map(p => ({ p, t, k: 'interest', real: 0 }))); if (!rot.length) continue; c = rot[Math.floor(hrand(L.season * 31 + wk, i, 2653) * rot.length)]; }
    else { const src = nearP.length && hrand(wk, i, 2664) < 0.6 ? nearP : live; c = src[Math.floor(hrand(L.season * 31 + wk, i, 2654) * src.length)]; }
    used.add(c.p.id);
    const others = buyers.filter(b => b.id !== c.t.id), o = c.o || (others.length ? others[Math.floor(hrand(c.p.id, wk, 2655) * others.length)] : null);
    if (!o && c.k !== 'untouch') continue;
    const v = { name: c.p.name, ovr: c.p.ovr, pos: POS[c.p.pos], team: c.t.abbr, other: o ? o.abbr : '' };
    const rm = { n: (L.rumorN = (L.rumorN || 0) + 1), s: L.season, day: L.day, pid: c.p.id, from: c.t.id, to: o ? o.id : null, k: c.k, real: c.real, a };
    (L.rumors = L.rumors || []).unshift(rm); if (L.rumors.length > 40) L.rumors.length = 40;
    if (a !== 'fan') logNews(L, flL(L, 'rumor.' + c.k, v), c.t.id, 'rumor', c.real ? 'real' : 'fake');
    addPost(L, 'rumor', a, 'calm', v, { tid: c.t.id, pid: c.p.id, key: a === 'fan' ? 'fd.rumor.fan.calm' : 'rumor.' + c.k, size: c.p.ovr >= 76 ? 1.5 : 1 });
    RUMOR_CNT[a] = (RUMOR_CNT[a] || 0) + 1; if (c.real) RUMOR_CNT[a + 'Real'] = (RUMOR_CNT[a + 'Real'] || 0) + 1;
  }
}
const RUMOR_CNT = {};

// ---------- R4 media reputation matters ----------
// free agents: famous or money-minded players like a GM the press likes (up to +/-4% appeal at rep 0 / 100); owner trust drifts with it (weekly)
function repAppeal(L, p, t) { if (!L || t.id !== L.user || L.user == null) return 0; const k = clamp((p.fame || 0) / 100 + 0.3 * twp(p, 'mon'), 0, 1); return (mediaRep(L) - 50) / 50 * 0.04 * k; }
function repTrustWeek(L) {
  if (L.user == null || !L.media) return; const t = L.teams[L.user]; if (!t || !t.owner) return;
  const r = mediaRep(L), d = r < 30 ? -0.5 : r >= 70 ? 0.3 : 0; if (!d) return;
  L.media.tAcc = (L.media.tAcc || 0) + d; const step = L.media.tAcc >= 1 ? 1 : L.media.tAcc <= -1 ? -1 : 0;
  if (step) { t.owner.trust = Math.round(clamp((t.owner.trust == null ? 60 : t.owner.trust) + step, 0, 100)); L.media.tAcc -= step; }
}

// ---------- R5 unhappy stars go public: vague post -> rumor -> trade request (one stage a week) ----------
const pubStar = p => p.ovr >= 74 || (p.fame || 0) >= 50;
function publicUnhappy(L, p, t) {
  if (L.phase !== 'regular' || p.tradeReq === L.season) return;
  const P = p.pub && p.pub.s === L.season ? p.pub : (p.pub = { s: L.season, st: 0, day: -99 });
  if (L.day - P.day < 6 || P.st >= 2) return;
  P.st++; P.day = L.day; const v = { name: p.name, team: t.abbr, teamName: t.name };
  if (P.st === 1) addPost(L, 'cryptic', 'player', 'upset', v, { tid: t.id, pid: p.id, size: 1.5 });
  else if (P.st === 2) { logNews(L, flL(L, 'rumor.unhappy', v), t.id, 'rumor', 'unhappy'); addPost(L, 'rumor', 'nat', 'calm', v, { tid: t.id, pid: p.id, key: 'rumor.unhappy', size: 1.8 }); }
}
const pubReady = (L, p) => !pubStar(p) || (p.pub && p.pub.s === L.season && p.pub.st >= 2);

// ---------- R6 coach hot seat (0-100) ----------
// below expectations, losing streak, players in friction with him, your call-outs, and (your team) bad press. Raises in-season firing odds by up to 2x; national post at 70+
function hotSeat(L, t) {
  const g = t.w + t.l, c = t.coach; if (!c) return { v: 0, parts: {} };
  const parts = {};
  if (g >= 8) parts.record = clamp(((t.expW != null ? t.expW : 0.5) - t.w / g) * 220, 0, 55);
  if (t.streak <= -3) parts.streak = Math.min(20, -t.streak * 3);
  const fr = rosterOf(L, t).filter(p => (p.friction || []).includes(c.id) && p.ovr >= 65).length; if (fr) parts.friction = Math.min(15, fr * 5);
  if (t.id === L.user) { const co = (L.press && L.press.s === L.season && L.press.qs.some(q => q.ans === 'callout')) ? 5 : 0; if (co) parts.callout = co; if (mediaRep(L) < 35) parts.press = 8; }
  if ((c.seasons || []).some(x => x.tid === t.id && x.s >= L.season - 2 && x.po === 'Champion')) parts.ring = -25;
  const v = Math.round(clamp(Object.values(parts).reduce((a, b) => a + b, 0), 0, 100));
  return { v, parts };
}
function hotSeatWeek(L) {
  if (L.phase !== 'regular') return;
  for (const t of L.teams) {
    const h = hotSeat(L, t); t.hot = h.v;
    if (h.v >= 70 && t.hotS !== L.season && t.coach) { t.hotS = L.season; const v = { coach: t.coach.name, team: t.name, abbr: t.abbr, rec: `${t.w}-${t.l}` };
      logNews(L, flL(L, 'beat.hotseat', v), t.id, 'coach', 'hot'); addPost(L, 'hotseat', 'nat', 'calm', v, { tid: t.id, size: 1.4 }); addPost(L, 'hotseat', 'beat', 'calm', v, { tid: t.id, size: 1 }); }
  }
}

// ---------- R7 storylines ----------
// return game (first game against the team that traded him, within a season), revenge (30+ in a win there), weekly award race, retirement and jersey tributes
function storyGame(L, g) {
  const hw = g.hs > g.as;
  for (const r of g.box) {
    if (!(r[2] > 0)) continue; const p = L.players[r[0]]; const x = p && p.exT; if (!x || x.done || L.season - x.s > 1) continue;
    const tid = r[1] === 0 ? g.home : g.away, opp = r[1] === 0 ? g.away : g.home; if (opp !== x.tid) continue;
    x.done = 1; if (!(p.ovr >= 72 || (p.fame || 0) >= 45 || tid === L.user || opp === L.user)) continue;
    const won = (r[1] === 0) === hw, pts = r[2 + IX.pts], v = { name: p.name, team: L.teams[tid].abbr, old: L.teams[opp].name, oldCity: L.teams[opp].city, line: lineOf(pts, r[2 + IX.orb] + r[2 + IX.drb], r[2 + IX.ast]) };
    logNews(L, flL(L, 'feat.return', v), tid, 'feature', 'return'); addPost(L, 'feature', 'nat', 'calm', v, { tid, pid: p.id, key: 'feat.return', size: 1.3 });
    const yrs = p.hist.filter(h => h.tid === opp).length, tone = trv(p, 'loy') >= 60 && yrs >= 2 ? 'loyal' : (p.morale != null && p.morale < 45) || (p.friction || []).length ? 'upset' : 'calm';
    addPost(L, 'return', 'player', tone, v, { tid, pid: p.id, size: 1.2 });
    if (won && pts >= 30) addPost(L, 'revenge', 'nat', 'hype', v, { tid, pid: p.id, size: 1.6 });
  }
}
function raceWeek(L) {
  if (L.phase !== 'regular' || L.day < 21) return;
  let lad; try { lad = awardLadder(L, 'mvp', 3); } catch (e) { return; }
  const top = lad && lad[0]; if (!top) return;
  const M = L.media = L.media || { rep: 50 }, prev = M.mvp && M.mvp.s === L.season ? M.mvp : null;
  const v = { award: 'MVP', name: top.name, prev: prev ? (L.players[prev.pid] || {}).name || '' : '', pts: top.pts, rec: top.w != null ? `${top.w}-${top.l}` : '' };
  if (!prev || prev.pid !== top.pid) { if (prev) addPost(L, 'race', 'nat', 'calm', v, { tid: top.tid, pid: top.pid, size: 1.5 }); M.mvp = { s: L.season, pid: top.pid, wk: 0 }; }
  else if (++M.mvp.wk % 3 === 0) addPost(L, 'raceHold', 'nat', 'calm', v, { tid: top.tid, pid: top.pid, size: 1.2 });
}
function retireTribute(L, p, tm) {
  if (!((p.fame || 0) >= 45 || (p.awards || []).some(a => a.a === 'MVP' || a.a === 'All-Star'))) return;
  const last = p.hist.length ? p.hist[p.hist.length - 1].tid : null, t = last != null ? L.teams[last] : null;
  const v = { name: p.name, team: t ? t.name : '', yrs: new Set(p.hist.map(h => h.s)).size };
  addPost(L, 'retire', 'nat', 'calm', v, { tid: last, pid: p.id, size: 2 });
  if (t) addPost(L, 'retire', 'team', 'hype', v, { tid: last, pid: p.id, size: 1.5 });
}
function jerseyTribute(L, t, p, num) { addPost(L, 'jersey', 'team', 'hype', { name: p.name, team: t.name, num }, { tid: t.id, pid: p.id, size: 1.8 }); }

// ---------- R8 fan mood meter (-100..100): fan posts about a team in the last 14 days (happy / hype +1, upset -1, calm 0); moves hype a little each week ----------
const FAN_TONE = { happy: 1, hype: 1, calm: 0, upset: -1 };
function fanMood(L, tid) {
  const F = (L.feed || []).filter(x => x.a === 'fan' && x.tid === tid && x.s === L.season && (x.day == null || L.phase !== 'regular' || x.day >= L.day - 14));
  if (!F.length) return { v: 0, n: 0 };
  const v = Math.round(F.reduce((a, x) => a + (FAN_TONE[x.tone] || 0), 0) / F.length * 100);
  return { v, n: F.length };
}
function fanMoodWeek(L) { for (const t of L.teams) { const m = fanMood(L, t.id); t.fanMood = m.n >= 3 ? m.v : 0; if (m.n >= 3 && m.v) hypeBump(t, m.v / 100 * 0.8); } }

// weekly hook (mediaDay, day % 7 === 1)
function realismWeek(L) { repTrustWeek(L); hotSeatWeek(L); raceWeek(L); fanMoodWeek(L); dramaWeek(L); }

// ===== v27 S1: coach career arcs (philosophy drifts with age and results, rare system change, coaching tree, ex-players become coaches) =====
const CA_FX = { oldAge: 56, oldPace: -0.6, youngAge: 45, youngThree: 0.5, shake: 3, sysBase: 0.025, sysLose: 0.06, sysFired: 0.04, sysOld: 0.3, mentorP: 0.65, exMax: 1 };
const CA_CNT = { sys: 0, mentor: 0, ex: 0, exQ: 0 };   // test counters
function caRec(L, c) { const r = (c.seasons || []).filter(x => x.s === L.season && !x.mid); return r.length ? r[r.length - 1] : null; }
const caWp = r => r && r.w + r.l ? r.w / (r.w + r.l) : null;
function coachEvolve(L, c, t) {
  slSync(c); const s = c.sl || slSeed(c, 6); let moved = false;
  if (c.age >= CA_FX.oldAge) { slSet(c, 'pace', s.pace + CA_FX.oldPace + gauss(0, 0.4)); moved = true; }   // old coaches slow down
  if (c.age < CA_FX.youngAge) { s.three = clamp(Math.round(s.three + CA_FX.youngThree + gauss(0, 0.8)), 0, 100); moved = true; }   // young coaches follow the modern game
  const last = caRec(L, c), wp = caWp(last), prev = (c.seasons || []).filter(x => x.s === L.season - 1 && !x.mid).map(caWp)[0];
  if (wp != null && wp < 0.42) { for (const k of SL_KEYS) if (k !== 'pace' && k !== 'depth') s[k] = clamp(Math.round(s[k] + gauss(0, CA_FX.shake)), 0, 100); moved = true; }   // losing: he experiments
  if (moved) { c.sl = s; SLD_CACHE.delete(c); }
  // rare system change: losing years and a recent firing make it likelier, old coaches rarely change
  if (c.sysS != null && L.season - c.sysS < 4) return null;
  let pr = CA_FX.sysBase; if (wp != null && wp < 0.45 && prev != null && prev < 0.45) pr += CA_FX.sysLose;
  if (!t && c.stints.length && c.stints[c.stints.length - 1].to >= L.season - 1) pr += CA_FX.sysFired;
  if (c.age >= 60) pr *= CA_FX.sysOld;
  if (R() >= pr) return null;
  const k = R() < 0.6 ? 'off' : 'def', SYS = k === 'off' ? OFF_SYS : DEF_SYS, opts = Object.keys(SYS).filter(x => x !== c[k]);
  const to = t ? opts.map(x => [x, coachFitScore(L, t, Object.assign({}, c, { [k]: x }))]).sort((a, b) => b[1] - a[1])[0][0] : pick(opts);
  const from = c[k]; c[k] = to; slSync(c); SLD_CACHE.delete(c); c.sysS = L.season;
  (c.sysHist = c.sysHist || []).push({ s: L.season, k, from, to }); CA_CNT.sys++;
  return flL(L, 'co.sys', { name: c.name, team: t ? `${t.city} ${t.name}` : 'free-agent', abbr: t ? t.abbr : 'FA', side: k === 'off' ? 'offense' : 'defense', from: SYS[from].name, to: SYS[to].name });
}
// a new coach may come from a head coach's staff: he keeps most of his mentor's systems and some of his lean
function caMentor(L, c, m) {
  if (!m || m === c) return c;
  c.mentor = m.id; if (R() < 0.7) c.off = m.off; if (R() < 0.5) c.def = m.def;
  const d = slDefault(c), md = slDefault(m), ms = slOf(m); slSeed(c, 7);
  for (const k of SL_KEYS) if (k !== 'pace' && k !== 'depth') c.sl[k] = clamp(Math.round(0.5 * c.sl[k] + 0.5 * (ms[k] - md[k] + d[k])), 0, 100);
  CA_CNT.mentor++; return c;
}
function caPickMentor(L) {
  const cs = [...L.teams.map(t => t.coach), ...L.coachPool].filter(c => c && !c.interim && ((c.seasons || []).length >= 2 || (c.stints || []).length));
  if (!cs.length) return null; const w = cs.map(c => Math.max(1, c.ovr - 40) + (c.titles || 0) * 8 + Math.min(10, (c.seasons || []).length));
  return wpick(cs, w);
}
function coachNew(L, young) { const c = genCoach(usedNames(L), young); return R() < CA_FX.mentorP ? caMentor(L, c, caPickMentor(L)) : c; }
// coaching tree: everyone whose mentor is this coach (and theirs)
function coachTree(L, c, depth) {
  const all = [...L.teams.map(t => t.coach), ...L.coachPool, ...(L.coachArchive || [])].filter((x, i, a) => x && a.indexOf(x) === i);
  const kids = id => all.filter(x => x.mentor === id).map(x => ({ c: x, kids: (depth || 3) > 1 ? coachTree(L, x, (depth || 3) - 1) : [] }));
  return kids(c.id);
}
// ex-players: smart players with long careers may join the coaching ranks 2-6 years after they retire
function caExQueue(L, p) {
  if (!p || p.prospect || (p.svc || 0) < 6 || (p.iq || 0) < 55) return;
  const pr = clamp(0.04 + (p.iq - 55) * 0.006 + (p.pos === 0 ? 0.03 : 0) + ((p.pas || 0) >= 65 ? 0.02 : 0), 0, 0.22);
  if (R() >= pr) return;
  const t = p.team != null ? L.teams[p.team] : null;
  (L.coachQ = L.coachQ || []).push({ pid: p.id, s: L.season + rint(2, 6), mentor: t && t.coach ? t.coach.id : null }); CA_CNT.exQ++;
}
function caExCoach(L, q) {
  const p = L.players[q.pid]; if (!p) return null;
  const c = genCoach(usedNames(L), true), base = 45 + (p.iq - 60) * 0.3;
  c.name = p.name; c.nat = p.nat; c.age = clamp(p.age + (L.season - (p.retired || L.season)), 33, 62);
  c.ro = r99(base + gauss(0, 5) + ((p.pas || 50) - 55) * 0.15); c.rd = r99(base + gauss(0, 5) + (((p.pdf || 50) + (p.per || 50)) / 2 - 55) * 0.15); c.rdev = r99(base + gauss(0, 6));
  c.off = p.pas >= 68 ? 'motion' : p.tp >= 70 ? 'pace' : p.pos >= 3 && p.pst >= 60 ? 'inside' : p.mid >= 70 ? 'iso' : c.off;
  c.def = p.blk >= 65 ? 'rim' : p.stl >= 65 ? 'pressure' : 'switch';
  coachDerive(c); c.pot = r99(Math.max(c.ovr, c.ovr + rnd(6, 18))); c.exP = p.id; p.coachId = c.id;
  slSeed(c); const m = q.mentor != null ? findCoach(L, q.mentor) : null; if (m) c.mentor = m.id;
  CA_CNT.ex++; return c;
}
function caRefill(L, notes) {
  if (!L.caInit) { L.caInit = 1; for (const c of L.coachPool) if (!c.stints.length && c.mentor == null && R() < CA_FX.mentorP) caMentor(L, c, caPickMentor(L)); }   // the first pool: many were assistants
  const ready = (L.coachQ || []).filter(q => q.s <= L.season); let n = 0;
  for (const q of ready) { if (n >= CA_FX.exMax || L.coachPool.length >= 10) break; const c = caExCoach(L, q); if (c) { L.coachPool.push(c); n++; notes.push(flL(L, 'co.ex', { name: c.name })); } }
  L.coachQ = (L.coachQ || []).filter(q => q.s > L.season || (ready.includes(q) && !L.players[q.pid]?.coachId && q.s > L.season - 3));
  while (L.coachPool.length < 8) L.coachPool.push(coachNew(L, R() < 0.6));
}
// ===== v27 S2: GMs as people (name, age, personality, tenure, record; hired, fired, retire). The AI front office follows its GM. =====
const GM_FX = { retAge: 70, retFrom: 64, retP: 0.15, poolMax: 12, drift: 2, styleP: 0.03 };
const GM_CNT = { hired: 0, fired: 0, retired: 0, style: 0 };
function gmPersona() {
  const u = R(), v = R(), w = R(), style = u < 0.3 ? 'picks' : u < 0.75 ? 'neutral' : 'win';
  const pb = style === 'picks' ? 15 : style === 'win' ? -12 : 0, ab = style === 'win' ? 15 : style === 'picks' ? -8 : 0;
  return { style, belief: r1(0.5 + w * 0.5), pat: Math.round(clamp(20 + v * 60 + pb, 5, 95)), amb: Math.round(clamp(20 + R() * 60 + ab, 5, 95)) };
}
function gmFill(L, gm, t) {   // old saves / first GMs: age, stints and the team's existing personality
  if (gm.age == null) gm.age = rint(38, 62);
  if (!gm.fo) gm.fo = t && t.fo && t.fo.pat != null ? Object.assign({}, t.fo) : gmPersona();
  if (!gm.stints) gm.stints = [];
  if (t && (!gm.stints.length || gm.stints[gm.stints.length - 1].tid !== t.id || gm.stints[gm.stints.length - 1].to != null)) gm.stints.push({ tid: t.id, from: gm.since != null ? gm.since : L.season, to: null });
  return gm;
}
// a GM takes over a team: his personality becomes the front office's, the old plan is dropped
function gmTakeOver(L, t, gm, from, why) {
  gmFill(L, gm, null); gm.since = from; gm.to = null; const ls = gm.stints[gm.stints.length - 1]; if (ls && ls.to == null) ls.to = L.season; gm.stints.push({ tid: t.id, from, to: null });
  t.gm = gm; t.fo = gm.fo; t.plan = null; t.newGM = L.season; GM_CNT.hired++;
  if (why) logNews(L, flL(L, 'gm.hired', { abbr: t.abbr, team: `${t.city} ${t.name}`, name: gm.name }), t.id, 'league');
}
function gmLeave(L, t, gm, how) {
  if (!gm) return; gmFill(L, gm, t); gm.to = L.season; const st = gm.stints[gm.stints.length - 1]; if (st && st.to == null) { st.to = L.season; st.how = how; }
  if (how === 'retired') { gm.retired = L.season; (L.gmArchive = L.gmArchive || []).push(gm); GM_CNT.retired++; }
  else { if (how === 'fired') { gm.fired = (gm.fired || 0) + 1; GM_CNT.fired++; } if (!(L.gmPool || []).includes(gm)) (L.gmPool = L.gmPool || []).push(gm); }
}
function gmNewHire(L, t, opts) {
  const pool = (L.gmPool || []).filter(x => x !== t.gm && (x.fired || 0) < 2 && (x.age || 50) < 66).sort((a, b) => gmRep(L, b) - gmRep(L, a));
  const ng = pool[0] && R() < 0.4 ? pool[0] : genGM(L, opts);
  L.gmPool = (L.gmPool || []).filter(x => x !== ng); return ng;
}
function gmCareer(L, gm) {
  const h = gm.hist || [], w = h.reduce((a, x) => a + x.w, 0), l = h.reduce((a, x) => a + x.l, 0);
  return { w, l, seasons: h.length, titles: h.filter(x => x.po === 'Champion').length, finals: h.filter(x => /Champion|Finals/.test(x.po || '')).length, playoffs: h.filter(x => !/Missed|play-in/.test(x.po || '')).length, teams: [...new Set((gm.stints || []).map(x => x.tid))] };
}
// each summer: GMs age, personalities drift with results, old GMs retire (AI teams hire a replacement)
function gmOffseason(L) {
  const S = L.season;
  for (const t of L.teams) {
    if (t.id === L.user || !t.gm) continue; foOf(L, t); const gm = t.gm;
    gm.age++; const fo = gm.fo, r = (gm.hist || []).filter(x => x.tid === t.id).slice(-2), last = r[r.length - 1];
    const wp = last && last.w + last.l ? last.w / (last.w + last.l) : 0.5, lose2 = r.length === 2 && r.every(x => x.w < x.l);
    fo.pat = Math.round(clamp(fo.pat + gauss(0, GM_FX.drift) - (lose2 ? 2 : 0) + (gm.age >= 60 ? 1 : 0), 5, 95));
    fo.amb = Math.round(clamp(fo.amb + gauss(0, GM_FX.drift) + (last && /Champion|Finals/.test(last.po || '') ? 2 : 0) + (wp < 0.35 ? -1 : 0), 5, 95));
    if (R() < GM_FX.styleP) { const ns = pick(['picks', 'neutral', 'win'].filter(x => x !== fo.style)); fo.style = ns; GM_CNT.style++; }
    t.fo = fo;
    if (gm.age >= GM_FX.retAge || (gm.age >= GM_FX.retFrom && R() < GM_FX.retP)) {
      gmLeave(L, t, gm, 'retired'); logNews(L, flL(L, 'gm.retire', { abbr: t.abbr, team: `${t.city} ${t.name}`, name: gm.name, n: S - (gm.since || 1) + 1 }), t.id, 'league');
      gmTakeOver(L, t, gmNewHire(L, t), S + 1, ' to replace him');
    }
  }
  for (const gm of L.gmPool || []) { gmFill(L, gm, null); gm.age++; }
  const out = (L.gmPool || []).filter(g => g.age >= 68 || (g.age >= 62 && R() < 0.1) || (g.fired || 0) >= 3);
  for (const g of out) { g.retired = S; (L.gmArchive = L.gmArchive || []).push(g); }
  L.gmPool = (L.gmPool || []).filter(g => !out.includes(g)).sort((a, b) => gmRep(L, b) - gmRep(L, a)).slice(0, GM_FX.poolMax);
}
function findGM(L, id) { for (const t of L.teams) if (t.gm && t.gm.id === id) return t.gm; return (L.gmPool || []).find(g => g.id === id) || (L.gmArchive || []).find(g => g.id === id) || null; }

// ---------- v28.7 (Opus): multi-season autopilot + fast mode ----------
// autoBegin hands your team to the AI (L.user = null, front office = AI), autoStep advances one small step in any phase,
// autoEnd gives the team back. L.auto survives a save, so a reload mid-run still restores you (autoRestore in migrate / app load).
const AUTO_FX = { maxSeasons: 30 };
const AUTO_CATS = ['tx', 'trade', 'draft', 'coach'];
function autoBegin(L, n, fast) {
  if (L.auto) return L.auto;
  n = Math.max(1, Math.min(AUTO_FX.maxSeasons, Math.round(n) || 1));
  const s0 = L.season, endS = L.phase === 'off-ready' ? s0 + n : s0 + n - 1;   // finish n seasons (an offseason in progress counts the coming one)
  L.auto = { user: L.user, mode: L.mode, s0, endS, n, fast: !!fast, t0: Date.now(), steps: 0, rows: [], moves: [], logN0: L.logN || 0, tr0: (L.trades || []).length, pauseOffers: L.pauseOffers };
  if (L.user != null) { const t = L.teams[L.user]; t.manual = null; L.auto.trust0 = t.owner ? t.owner.trust : null; L.auto.cash0 = t.cash; }
  processPending(L); L.user = null; L.mode = 'team'; L.pending = [];   // AI trades go straight through, even in commissioner mode
  return L.auto;
}
function autoDone(L) { const a = L.auto; return !a || (L.season > a.endS) || (L.season === a.endS && L.phase === 'off-ready'); }
function autoStep(L) {
  const a = L.auto; if (!a) return false;
  if (autoDone(L)) return false;
  a.steps++;
  const ph = L.phase;
  switch (ph) {
    case 'regular': simDay(L); break;
    case 'regular-done': processPending(L); startPlayoffs(L); break;
    case 'playoffs': simPlayoffDay(L); if (L.phase === 'season-done') autoRow(L); break;
    case 'season-done': startOffseason(L); break;
    case 'off-review': runLottery(L); break;
    case 'off-lottery': startDraft(L); break;
    case 'off-draft': aiDraftPick(L); break;
    case 'off-resign': startFA(L); break;
    case 'off-fa': faDay(L); if (L.phase !== 'off-fa') processPending(L); break;
    case 'off-ready': startNewSeason(L); break;
    default: return false;
  }
  if (L.press && !L.press.done) L.press = null;   // no press conferences while the AI runs the team
  lr2Auto(L);   // v28.8
  L.offers = []; L.faInbox = []; L.holdouts = L.holdouts || [];
  if (a.user != null && (L.logN || 0) > (a.lastN || a.logN0)) { const buf = []; for (const x of L.log) { if ((x.n || 0) <= (a.lastN || a.logN0)) break; if (x.tid === a.user && AUTO_CATS.includes(x.cat) && !x.k) buf.push({ s: x.season, ph: x.phase, text: x.text, cat: x.cat }); } a.moves.push(...buf.reverse()); a.lastN = L.logN; if (a.moves.length > 400) a.moves = a.moves.slice(-400); }
  if (a.fast) autoTrim(L);
  return !autoDone(L);
}
// one row per finished season for the summary
function autoRow(L) {
  const a = L.auto; if (!a) return;
  const po = L.po, row = { s: L.season, champ: po ? po.champion : null };
  if (a.user != null) {
    const t = L.teams[a.user];
    let inPo = false, inPlayin = false;
    if (po) po.rounds.forEach((r, i) => { for (const sr of r) if (sr.hi === t.id || sr.lo === t.id) { if (isPlayin(L, i)) inPlayin = true; else inPo = true; } });
    const won = poRoundsWon(L, t.id);
    row.res = po && po.champion === t.id ? 'Champion' : !inPo ? (inPlayin ? 'Lost in play-in' : 'Missed playoffs') : won === 0 ? 'Lost first round' : won === 1 ? 'Lost second round' : won === 2 ? 'Lost conference finals' : 'Lost Finals';
    const best = rosterOf(L, t).slice().sort((x, y) => y.ovr - x.ovr)[0];
    Object.assign(row, { w: t.w, l: t.l, status: t.status, best: best ? { id: best.id, n: best.name, o: best.ovr } : null, payroll: Math.round(payroll(L, t) * 10) / 10, cash: Math.round((t.cash || 0) * 10) / 10, trust: t.owner ? Math.round(t.owner.trust) : null, coach: t.coach ? t.coach.name : '' });
  }
  a.rows.push(row);
}
// fast mode: drop what only the screen needs (play-by-play, feed beyond 60 posts, old box scores)
function autoTrim(L) {
  if (L.feed && L.feed.length > 60) L.feed.length = 60;
  const g = L.games; if (g && g.length) { const last = g[g.length - 1]; if (last && last.pbp) last.pbp = null; }
}
function autoEnd(L) {
  const a = L.auto; if (!a) return null;
  if (L.phase === 'playoffs' || L.phase === 'season-done') { if (!a.rows.some(r => r.s === L.season)) { /* stopped mid-playoffs */ } }
  L.user = a.user; L.mode = a.mode; if (a.pauseOffers !== undefined) L.pauseOffers = a.pauseOffers;
  if (L.user != null) {
    const t = L.teams[L.user];
    if (t.gm && L.mode !== 'coach') { t.gm = null; }   // the AI front office leaves with the autopilot; you are the GM again (coach mode keeps its GM)
    t.manual = null;
    const ids = new Set(), tr = (L.trades || []).filter(x => x.s >= a.s0 && (x.a === L.user || x.b === L.user || x.c === L.user));
    a.trades = tr.length;
  }
  L.offers = []; L.faInbox = []; if (L.press && !L.press.done) L.press = null;
  const sum = { s0: a.s0, endS: a.endS, rows: a.rows, moves: a.moves, ms: Date.now() - a.t0, steps: a.steps, user: a.user, fast: a.fast, trades: a.trades || 0, logN0: a.logN0 };
  L.autoLast = sum; delete L.auto;
  return sum;
}
function autoRestore(L) { if (L && L.auto) autoEnd(L); }

// ---------- v28.7 (Opus): locker room drama ----------
// Each team has a locker room (t.lr.v, harmony 0-100, 55 = normal). Once a week in season a team may have an incident;
// pressure comes from unhappy regulars, losing streaks, egos, veterans losing minutes on young teams and coach friction.
// AI teams settle it at once (by their front office). Your team gets a decision (L.dramaOpen, 7 days, then "ignore").
// Harmony feeds morale (moraleParts.locker), feuds hit both players (moraleParts.feud); morale already moves game form.
const DR_FX = { base: 0.07, perUnhappy: 0.04, streak: 0.07, low: 0.05, max: 0.32, drift: 0.15, keep: 30, openDays: 7 };
const DR_CNT = { ev: 0, mine: 0 };   // test counters
const DR_KINDS = ['feud', 'vetMin', 'callout', 'meeting', 'late', 'coachRift', 'bond'];
const DR_CHOICES = { talk: 'Talk to him privately', player: 'Side with the player', coach: 'Back the coach and the veterans', discipline: 'Fine him / discipline', suspend: 'Suspend him (unpaid)', ignore: 'Let them sort it out' };
const DR_HINT = { talk: 'Works best with coachable players. Small boost to harmony.', player: 'He feels heard, the coach and the rest of the room less so.', coach: 'Backs the structure. The player sulks.', discipline: 'Sets a standard. Big morale hit for him; media likes it.', suspend: 'Strongest message: he sits 1-5 games without pay. Big morale hit; the room respects it unless he is the star.', ignore: 'Nothing changes. Feuds can fester.' };
function lrOf(t) { if (!t.lr) t.lr = { v: 55 }; return t.lr; }
function lrLabel(v) { return v >= 75 ? 'Tight-knit' : v >= 60 ? 'Healthy' : v >= 45 ? 'Steady' : v >= 30 ? 'Uneasy' : v >= 18 ? 'Divided' : 'Toxic'; }
function drPressure(L, t) {
  const rot = rotationOf(L, t).slice(0, 9), lr = lrOf(t);
  const unhappy = rot.filter(p => (p.morale != null ? p.morale : 60) < 40);
  return { rot, unhappy, chance: Math.min(DR_FX.max, DR_FX.base + DR_FX.perUnhappy * unhappy.length + ((t.streak || 0) <= -5 ? DR_FX.streak : 0) + (lr.v < 40 ? DR_FX.low : 0) + ((t.streak || 0) >= 6 && lr.v >= 55 ? 0.05 : 0)) };
}
// pick an incident that fits the team; null if nothing fits
function drPick(L, t, P) {
  const rot = P.rot, opts = [], low = ['rebuild', 'tank', 'rising'].includes(t.status), byC = rot.slice().sort((a, b) => trv(a, 'cch') - trv(b, 'cch'));
  const egos = rot.filter(p => p.tbd >= 60 && (trv(p, 'mon') >= 62 || trv(p, 'cch') <= 42));
  if (egos.length >= 2) opts.push(['feud', 2, [egos[0].id, egos[1].id]]);
  else if (byC.length >= 2 && trv(byC[0], 'cch') < 45 && (byC[0].morale || 60) < 50) opts.push(['feud', 1.5, [byC[0].id, byC[1].id]]);
  if (low) { const vet = rot.find(p => p.age >= 30 && p.moraleParts && (p.moraleParts.minutes || 0) < -5), kid = rot.filter(p => p.age <= 24).sort((a, b) => b.ovr - a.ovr)[0]; if (vet && kid) opts.push(['vetMin', 3, [vet.id, kid.id]]); }
  const star = rot.slice().sort((a, b) => b.ovr - a.ovr)[0];
  if (star && (t.streak || 0) <= -4 && (trv(star, 'win') >= 60 || trv(star, 'mot') >= 65)) opts.push(['callout', 2.5, [star.id]]);
  if ((t.streak || 0) <= -5) { const lead = rot.find(p => p.pers === 'Mentor' || (p.age >= 28 && trv(p, 'win') >= 66)); opts.push(['meeting', 2, lead ? [lead.id] : [], { good: !!lead }]); }
  const late = P.unhappy.filter(p => trv(p, 'cch') < 45)[0] || rot.find(p => trv(p, 'cch') < 40 && trv(p, 'wrk') < 55);
  if (late) opts.push(['late', 2, [late.id]]);
  const rift = rot.find(p => (p.friction || []).includes(t.coach.id) || (p.moraleParts && (p.moraleParts.minutes || 0) < -8 && trv(p, 'cch') < 50));
  if (rift) opts.push(['coachRift', 2.5, [rift.id]]);
  if ((t.streak || 0) >= 6 && lrOf(t).v >= 55) opts.push(['bond', 3, star ? [star.id] : []]);
  { const cd = conductPick(L, t, rot); if (cd) opts.push(['conduct', 1.4, [cd.pid], cd]); }   // v28.8
  if (!opts.length) { const m = rot.filter(p => (p.morale != null ? p.morale : 60) < 52).sort((a, b) => trv(a, 'cch') - trv(b, 'cch'))[0]; if (m) opts.push([trv(m, 'cch') < 50 ? 'late' : 'coachRift', 1, [m.id]]); }
  if (!opts.length) return null;
  let tot = opts.reduce((a, o) => a + o[1], 0), r = R() * tot;
  for (const o of opts) { r -= o[1]; if (r <= 0) return o; }
  return opts[opts.length - 1];
}
// what the incident does on its own, before anyone responds
const DR_BASE = { feud: { h: -8, m: [-5, -5] }, vetMin: { h: -5, m: [-6, 0] }, callout: { h: -6, m: [0], others: -2 }, meeting: { h: -3, hGood: 9, others: 0, othersGood: 3 }, late: { h: -3, m: [-3] }, conduct: { h: -4, m: [-2] }, coachRift: { h: -6, m: [-4] }, bond: { h: 8, others: 2 } };
function drVars(L, t, ev) { const a = L.players[ev.pids[0]], b = L.players[ev.pids[1]]; return { abbr: t.abbr, team: t.name, city: t.city, a: a ? a.name : 'a veteran', b: b ? b.name : 'a teammate', coach: t.coach ? t.coach.name : 'the coach', n: Math.abs(t.streak || 0), what: ev.what || '', g: ev.sg || ev.sev || 1, s: (ev.sg || ev.sev || 1) > 1 ? 's' : '', fine: ev.fine ? fineStr(ev.fine) : '' }; }
function drApply(L, t, fx, ids) {
  const lr = lrOf(t); lr.v = clamp(Math.round(lr.v + (fx.h || 0)), 0, 100);
  if (fx.m) fx.m.forEach((d, i) => { const p = L.players[ids[i]]; if (p && d) p.morale = clamp(Math.round((p.morale != null ? p.morale : 60) + d), 0, 100); });
  if (fx.others) for (const p of rotationOf(L, t).slice(0, 9)) if (!ids.includes(p.id)) p.morale = clamp(Math.round((p.morale != null ? p.morale : 60) + fx.others), 0, 100);
}
function dramaWeek(L) {
  if (L.phase !== 'regular' || L.day < 7) return;
  L.drama = L.drama || [];
  if (L.dramaOpen) { const ev = L.drama.find(e => e.id === L.dramaOpen); if (!ev || L.user == null || ev.tid !== L.user || L.day - ev.day >= DR_FX.openDays || ev.s !== L.season) { if (ev && ev.st === 'open') answerDrama(L, 'ignore', true); L.dramaOpen = null; } }
  for (const t of L.teams) {
    const lr = lrOf(t), g = t.w + t.l, wp = g >= 5 ? t.w / g : 0.5;
    lr.v = Math.round(lr.v + DR_FX.drift * (clamp(55 + (wp - 0.5) * 40, 25, 80) - lr.v));   // drifts back toward normal, a little higher when winning
    const mine = L.user != null && t.id === L.user;
    try { posWeek(L, t); } catch (e) { }   // v28.8: positive moments
    if (mine && L.dramaOpen) continue;
    const P = drPressure(L, t); if (R() >= P.chance) continue;
    const o = drPick(L, t, P); if (!o) continue;
    const [k, , pids, extra] = o, ev = { id: 'dr' + ((L.dramaN = (L.dramaN || 0) + 1)), s: L.season, day: L.day, tid: t.id, k, pids, good: extra && extra.good, st: 'open' };
    if (k === 'conduct') { ev.sev = extra.sev; ev.what = extra.what; ev.why = extra.why; }
    const base = DR_BASE[k], fx = { h: k === 'meeting' && ev.good ? base.hGood : base.h, m: base.m, others: k === 'meeting' ? (ev.good ? base.othersGood : base.others) : base.others };
    drApply(L, t, fx, pids);
    if (k === 'feud') for (const [x, y] of [[pids[0], pids[1]], [pids[1], pids[0]]]) { const p = L.players[x]; if (p) p.feud = { w: y, s: L.season, until: L.day + 21 }; }
    if (k === 'coachRift') { const p = L.players[pids[0]]; if (p && trv(p, 'cch') < 45 && !(p.friction || []).includes(t.coach.id)) p.friction = (p.friction || []).concat(t.coach.id); }
    const key = 'dr.' + k + (k === 'meeting' ? (ev.good ? '.good' : '.bad') : '');
    ev.text = fl(key, drVars(L, t, ev), ev.id);
    logNews(L, ev.text, t.id, 'team', 'drama'); DR_CNT.ev++;
    try { if (k !== 'bond') { addPost(L, 'drama', 'beat', 'calm', drVars(L, t, ev), { tid: t.id, pid: pids[0], size: mine ? 1.2 : 0.8 }); if (mine || R() < 0.4) addPost(L, 'drama', 'fan', 'upset', drVars(L, t, ev), { tid: t.id, size: 0.6 }); } else addPost(L, 'drama', 'fan', 'happy', drVars(L, t, ev), { tid: t.id, size: 0.6 }); } catch (e) { }
    L.drama.unshift(ev); if (L.drama.length > 80) L.drama.length = 80;
    if (mine && k !== 'bond') { L.dramaOpen = ev.id; DR_CNT.mine++; }
    else { ev.st = 'done'; if (k !== 'bond') drResolve(L, t, ev, drAiChoice(L, t, ev), true); }
  }
}
function drAiChoice(L, t, ev) {
  const fo = foOf(L, t), p = L.players[ev.pids[0]];
  if (ev.k === 'meeting') return 'ignore';
  if (ev.k === 'late') return 'discipline';
  if (ev.k === 'conduct') return ev.sev >= 3 || (fo.pat || 50) <= 35 ? 'suspend' : 'discipline';
  if (ev.k === 'vetMin') return t.status === 'rebuild' || t.status === 'tank' ? 'coach' : 'talk';
  if (p && p.ovr >= 80) return 'talk';   // stars get the soft touch
  return (fo.pat || 50) <= 35 ? 'discipline' : 'talk';
}
// effects of a response: harmony, morale for the players involved / the rest, media rep, owner trust (your team only)
function drChoiceFx(L, t, ev, c) {
  const p = L.players[ev.pids[0]], cch = p ? trc(p, 'cch') : 0, fx = { h: 0, m: [], others: 0, rep: 0, trust: 0 };
  if (c === 'talk') { fx.h = 3 + Math.round(3 * cch); fx.m = [Math.round(4 + 4 * cch), ev.k === 'feud' ? 3 : 0]; }
  else if (c === 'player') { fx.h = -2; fx.m = [8, ev.k === 'feud' ? -5 : 0]; fx.others = -1; fx.rep = -1; }
  else if (c === 'coach') { fx.h = 4; fx.m = [-7, ev.k === 'vetMin' || ev.k === 'feud' ? 4 : 0]; fx.others = 1; fx.rep = 1; fx.trust = 1; }
  else if (c === 'discipline') { fx.h = 2; fx.m = [cch < -0.3 ? -12 : -8, 0]; fx.others = 1; fx.rep = 2; fx.trust = 1; }
  else if (c === 'suspend') { const g = drSuspGames(ev), star = p && p.ovr >= 80; fx.h = star && g >= 3 ? -1 : 3; fx.m = [-8 - 2 * g, 0]; fx.others = star ? -1 : 1; fx.rep = 2; fx.trust = 1; }
  else { fx.h = ev.k === 'feud' ? -3 : 0; }
  return fx;
}
function drResolve(L, t, ev, c, ai) {
  if (c === 'suspend' && !drChoicesFor(ev).includes('suspend')) c = 'discipline';
  const fx = drChoiceFx(L, t, ev, c); drApply(L, t, fx, ev.pids);
  { const p = L.players[ev.pids[0]]; if (p && p.team === t.id) { if (c === 'discipline') ev.fine = finePlayer(L, p, ev.k === 'late' ? 'late' : ev.k === 'conduct' ? 'conduct' : 'discipline', 'team', ev.k, ev.k === 'conduct' ? Math.max(1, ev.sev / 2) : 1); else if (c === 'suspend') { ev.sg = drSuspGames(ev); suspend(L, p, ev.sg, 'team', ev.k === 'conduct' ? (ev.why || 'conduct detrimental to the team') : 'conduct detrimental to the team'); } } }   // v28.8: real fines and suspensions
  ev.choice = c; ev.st = 'done'; ev.fx = fx; ev.ai = ai ? 1 : undefined;
  if (c === 'talk' || c === 'coach' || c === 'discipline') for (const id of ev.pids) { const p = L.players[id]; if (p && p.feud && ev.k === 'feud') p.feud.until = Math.min(p.feud.until, L.day + 7); }
  if (c === 'coach' && ev.k === 'coachRift') { const p = L.players[ev.pids[0]]; if (p && p.morale < 30 && trv(p, 'cch') < 40 && p.tradeReq !== L.season && p.ovr >= 60) { p.tradeReq = L.season; p.tx.push({ s: L.season, t: `Requested a trade from ${t.abbr} after a falling-out with ${t.coach.name}` }); logNews(L, `${p.name} (${t.abbr}) has requested a trade after a falling-out with ${t.coach.name}`, t.id, 'tx'); } }
  if (!ai && L.user != null && t.id === L.user) {
    if (fx.rep && L.media) L.media.rep = clamp((L.media.rep != null ? L.media.rep : 50) + fx.rep, 0, 100);
    if (fx.trust && t.owner) t.owner.trust = clamp(t.owner.trust + fx.trust, 0, 100);
  }
  if (c !== 'ignore') { const txt = fl('dr.res.' + c, drVars(L, t, ev), ev.id + c); if (txt) logNews(L, txt, t.id, 'team', 'drama'); }
  return fx;
}
// your answer to the open incident (choice in DR_CHOICES)
function answerDrama(L, c, auto) {
  const ev = (L.drama || []).find(e => e.id === L.dramaOpen); if (!ev || ev.st !== 'open') { L.dramaOpen = null; return null; }
  if (!DR_CHOICES[c]) c = 'ignore';
  const t = L.teams[ev.tid], fx = drResolve(L, t, ev, c, false); if (auto) ev.auto = 1;
  L.dramaOpen = null; return { ev, fx };
}
function dramaOpen(L) { if (!L.dramaOpen || L.user == null) return null; const ev = (L.drama || []).find(e => e.id === L.dramaOpen); return ev && ev.st === 'open' && ev.tid === L.user ? ev : null; }
function dramaList(L, tid, n) { return (L.drama || []).filter(e => tid == null || e.tid === tid).slice(0, n || 20); }
// morale parts (hooked in moraleParts)
function drMorale(L, p, t, parts) {
  const lr = lrOf(t); const v = clamp((lr.v - 55) * 0.1, -4, 3); if (Math.abs(v) >= 0.5) parts.locker = r1(v);
  if (p.feud && p.feud.s === L.season && L.day <= p.feud.until && L.players[p.feud.w] && L.players[p.feud.w].team === p.team) parts.feud = -4;
}

// ---------- v28.7 (Opus): dynasties and eras ----------
// One season list: real NBA seasons (NBA mode) + this league's seasons. A dynasty = 3+ titles in 5 seasons, or 2 straight titles plus a 3rd Finals in 5.
// Eras = blocks of 5 seasons, owned by the team with the most points (title 10, Finals loss 5, conference finals 2, best record 2).
function dynSeasons(L) {
  const out = [];
  if (typeof nbaHistOn === 'function' && nbaHistOn(L)) { const ab = {}; for (const t of L.teams) ab[nbaAbOf(t)] = t.id; for (const h of nbaHist()) out.push({ lbl: nbaSeasonLbl(h.y), y: h.y, real: 1, champ: ab[h.champ] != null ? ab[h.champ] : null, champN: h.champTm || (ab[h.champ] != null ? null : h.champ), ru: ab[h.ru] != null ? ab[h.ru] : null, ruN: h.ruTm || h.ru }); }
  for (const h of L.history || []) { const st = h.standings || []; const best = st.slice().sort((a, b) => b.w - a.w)[0]; out.push({ lbl: seasonName(h.s), y: yr(h.s), s: h.s, champ: h.champion, ru: h.runnerUp, best: best ? best.tid : null, cf: st.filter(r => r.po === 'Lost in conference finals').map(r => r.tid), coach: (st.find(r => r.tid === h.champion) || {}).coach }); }
  return out;
}
function dynTeamName(L, x, real, nm) { return real && nm ? nm : x != null && L.teams[x] ? L.teams[x].city + ' ' + L.teams[x].name : (nm || '—'); }
function dynasties(L) {
  const S = dynSeasons(L), out = [];
  let i = 0;
  while (i < S.length) {
    const c = S[i].champ; if (c == null) { i++; continue; }
    // grow a run while the team keeps winning titles with at most a 2-season gap
    let j = i, titles = [i], last = i;
    for (let k = i + 1; k < S.length && k - last <= 2; k++) if (S[k].champ === c) { titles.push(k); last = k; }
    const span = last - i + 1, n = titles.length, finals = S.slice(i, last + 1).filter(x => x.champ === c || x.ru === c).length;
    const b2b = titles.some((k, q) => q > 0 && titles[q - 1] === k - 1);
    if ((n >= 3 && span <= 6) || (n >= 2 && b2b && finals >= 3) || n >= 4) {
      const real = S.slice(i, last + 1).every(x => x.real);
      out.push({ tid: c, name: dynTeamName(L, c, S[i].real, S[i].champN), from: S[i].lbl, to: S[last].lbl, titles: n, finals, seasons: titles.map(k => S[k].lbl), simS: titles.map(k => S[k].s).filter(x => x != null), real: real ? 1 : 0, tier: n >= 5 ? 'Legendary dynasty' : n >= 3 ? 'Dynasty' : 'Mini-dynasty' });
      i = last + 1;
    } else i++;
  }
  return out.reverse();   // newest first
}
// players who were part of 2+ of a run's sim titles (most titles, then playoff minutes)
function dynCore(L, d, n) {
  if (!d.simS.length) return [];
  const sset = new Set(d.simS), rows = [];
  for (const p of Object.values(L.players)) { let k = 0, min = 0; for (const h of p.hist || []) if (sset.has(h.s) && h.tid === d.tid && h.po) { k++; min += h.po.min || 0; } if (k >= Math.min(2, d.simS.length)) rows.push({ p, k, min }); }
  return rows.sort((a, b) => b.k - a.k || b.min - a.min).slice(0, n || 5).map(r => ({ id: r.p.id, name: r.p.name, titles: r.k }));
}
// rolling score for the last 5 sim seasons: who is building one now
function dynWatch(L, n) {
  const H = (L.history || []).slice(-5), sc = {};
  H.forEach((h, i) => { const w = 0.6 + 0.1 * i; for (const r of h.standings || []) { const po = r.po || ''; let v = { 'Champion': 10, 'Lost in Finals': 5, 'Lost in conference finals': 2, 'Lost in conference semis': 1, 'Lost in first round': 0.5 }[po] || 0; sc[r.tid] = (sc[r.tid] || 0) + v * w; } const best = (h.standings || []).slice().sort((a, b) => b.w - a.w)[0]; if (best) sc[best.tid] = (sc[best.tid] || 0) + 2 * w; });
  return Object.entries(sc).map(([tid, v]) => { const t = L.teams[+tid]; const titles = H.filter(h => h.champion === +tid).length, finals = H.filter(h => h.champion === +tid || h.runnerUp === +tid).length; return { tid: +tid, v: r1(v), titles, finals, label: titles >= 3 ? 'Dynasty' : titles >= 2 ? 'Dynasty in the making' : finals >= 2 ? 'Contender' : v >= 6 ? 'Rising power' : 'In the mix' }; }).sort((a, b) => b.v - a.v).slice(0, n || 6);
}
function dynEras(L) {
  const S = dynSeasons(L), out = [];
  for (let i = 0; i < S.length; i += 5) {
    const blk = S.slice(i, i + 5), sc = {}, titles = {};
    for (const x of blk) { if (x.champ != null) { sc[x.champ] = (sc[x.champ] || 0) + 10; titles[x.champ] = (titles[x.champ] || 0) + 1; } if (x.ru != null) sc[x.ru] = (sc[x.ru] || 0) + 5; for (const c of x.cf || []) sc[c] = (sc[c] || 0) + 2; if (x.best != null) sc[x.best] = (sc[x.best] || 0) + 2; }
    const top = Object.entries(sc).sort((a, b) => b[1] - a[1])[0];
    const champs = blk.map(x => x.champ != null ? L.teams[x.champ].abbr : (x.champN || '—'));
    out.push({ from: blk[0].lbl, to: blk[blk.length - 1].lbl, real: blk.every(x => x.real) ? 1 : 0, tid: top ? +top[0] : null, titles: top ? (titles[top[0]] || 0) : 0, champs, open: !top || (titles[top[0]] || 0) <= 1 });
  }
  return out.reverse();
}
Object.assign(FLAVOR, {
  'dr.feud': ['{a} and {b} had to be separated at {abbr} practice after a heated argument.', 'Tension in {city}: {a} and {b} are not speaking after a shouting match in the locker room.', 'Sources: {a} and {b} got into it during {abbr} film session. The room is picking sides.', '{a} and {b} exchanged words at {abbr} shootaround. Teammates had to step in.', 'Bad blood in {city}: {a} and {b} are no longer speaking off the court.', 'Teammates say {a} and {b} have been at odds for weeks. The {abbr} locker room feels it.'],
  'dr.vetMin': ['{a} is frustrated with his shrinking role as the {team} hand minutes to {b}.', 'Veteran {a} grumbles about minutes while {b} gets the run in {city}.', '{a} on losing minutes to {b}: he did not hide his frustration after the game.', '{a} says he deserves more time than {b} is getting with the {team}.', 'Minutes are the issue in {city}. {a} sees {b} getting the chances he wants.', 'Losing time to {b} has {a} upset. Some {team} teammates agree with him.'],
  'dr.callout': ['{a} called out his {abbr} teammates after the loss: effort has to be better.', 'After {n} straight losses, {a} says some guys in the {team} locker room are not all in.', '{a} did not hold back: the {team} have to look in the mirror.', 'After the loss, {a} asked the {abbr} to hold each other accountable.', '{a} said the {team} lack urgency. He did not soften it.', 'Blunt words from {a} after {n} straight losses: the {abbr} need more fire.'],
  'dr.meeting.good': ['{a} called a players-only meeting after {n} straight losses. The room came out of it together.', 'Players-only meeting in {city}, led by {a}. Players say it cleared the air.', 'The {team} held a players-only meeting. {a} spoke first, and the mood has lifted.', 'A {abbr} players-only meeting in {city} went well. {a} says the room is back on track.', '{a} called the players together after {n} losses. Everyone spoke, and things calmed down.', 'The {team} talked it through without the coaches. {a} says it was honest and useful.'],
  'dr.meeting.bad': ['The {team} held a players-only meeting after {n} straight losses. Nobody came out of it happy.', 'Players-only meeting in {city} turned into finger-pointing, per sources.', 'A {abbr} players-only meeting did not fix much. The losing streak sits at {n}.', 'The {team} players-only meeting ran long and got heated. Little was settled.', 'After {n} straight losses, the {abbr} players met alone. Reports say voices were raised.', 'Players in {city} gathered without the staff. The meeting ended with more questions.'],
  'dr.late': ['{a} was late to {abbr} practice again. The team is handling it internally.', '{a} missed the {team} team flight. A fine is expected.', '{abbr} sent {a} home from shootaround for being late.', '{a} arrived late to a {abbr} workout. Teammates noticed, and so did the staff.', 'Another late arrival for {a}. The {team} are keeping this in-house for now.', 'The {abbr} staff is not happy that {a} showed up late again this week.'],
  'dr.coachRift': ['{a} and {coach} had a heated exchange on the {abbr} bench.', 'Sources: {a} is unhappy with how {coach} is using him.', '{a} walked past {coach} during a timeout. Something is off in {city}.', '{a} has been openly frustrated with {coach} since the last road trip.', 'Words were exchanged between {a} and {coach} after practice in {city}.', 'Tension between {a} and {coach} is spilling into the {abbr} locker room.'],
  'dr.bond': ['The {team} went out for a team dinner during their win streak. This group likes each other.', 'Chemistry is real in {city}: the {team} bench is the loudest in the league.', '{a} on the {team} streak: this is the closest locker room he has been part of.', 'The {team} are spending time together off the court, and it shows in the win column.', 'Good times in {city}: {a} says this {team} group is one of the best he has been in.', 'Teammates in {city} are sticking together through the streak. Chemistry looks strong.'],
  'dr.res.talk': ['{a} and the {abbr} front office talked it out privately.', 'The {team} handled the {a} situation behind closed doors.', 'A private meeting with {a} in {city}. Both sides say they are on the same page.', '{a} sat down with the {abbr} coaches for a long talk. Both sides left calm.', 'The {team} settled the {a} issue in a closed-door session in {city}.', '{a} and the {abbr} staff worked it out. The room is calmer now.'],
  'dr.res.player': ['The {team} front office is backing {a}.', '{abbr} sided with {a}. Not everyone in the room is thrilled.', '{a} got the support of the {team} front office.', 'The {abbr} stand with {a}. The front office says his voice matters here.', '{a} has the {team} front office on his side. The room is watching closely.', 'The {abbr} sided with {a} on this one, and it sends a clear signal.'],
  'dr.res.coach': ['The {team} backed {coach} in the {a} situation.', '{abbr} stands behind {coach}. {a} has been told to fall in line.', 'The {team} made it clear: {coach} runs the room.', '{coach} keeps the final word in the {abbr} locker room, the front office says.', 'The {team} made it clear that {coach} has the last say on {a}.', 'The {abbr} front office sided with {coach} on {a}. The rest of the room got the message.'],
  'dr.res.discipline': ['The {team} fined {a}.', '{abbr} disciplined {a}. The standard is the standard, says the front office.', '{a} was fined by the {team}.', 'The {abbr} hit {a} with a fine. The front office says the rules apply to everyone.', '{a} will pay a fine for the {team}, a penalty the club says is fair.', 'Discipline for {a}: the {abbr} fined him, and the front office called it a standard.'],
  'fd.drama.beat.calm': ['Hearing things are tense in the {abbr} locker room. Keeping an eye on {a}.', 'Not a great week behind the scenes for the {team}. More soon.', 'Talked to people around the {abbr}: this {a} thing is real, but fixable.', 'Sources inside the {abbr} say {a} is the focus right now. The team wants it settled soon.', 'Things are quiet on the surface at {team}, but there is tension with {a}.', 'Insiders say the {abbr} are handling the {a} issue. Updates to follow.'],
  'fd.drama.fan.upset': ['The {team} drama is embarrassing. Just play ball.', 'Whole locker room needs a reset. {abbr} what are we doing', 'Trade somebody. Anybody. This {abbr} drama is too much.', 'The {abbr} locker room is a mess. Fix it before the next game.', '{team} fans are fed up with the drama. Just win.', 'Whatever is going on at {abbr}, it is getting old. Clean it up.'],
  'fd.drama.fan.happy': ['This {abbr} group actually likes each other. Love to see it.', '{team} chemistry is unreal right now.', 'Team dinners and wins. {abbr} vibes are immaculate.', 'The {abbr} guys are having a blast together. Keep it going!', 'Love the {team} energy right now. Good locker room, good season.', 'Watching the {abbr} celebrate together is the best part of the season.']
});
// ---------- v28.8 (Opus): locker room 2 — positive moments, fines, suspensions, media interviews, one-on-ones ----------
// Money is in $M (0.05 = $50K). Fines scale with salary (LR2_FINE share of the yearly salary, at least $2K).
// Team fines go to that team's cash (t.fin.fines, revenue at season close); league fines go to the league (L.lgFines).
// Suspensions (p.susp = { g, k: 'team' | 'league', why, s, gid, lost }) are unpaid: salary x games / season games is saved
// (t.fin.suspSaved, off the payroll cost at season close). A suspended player is left out in buildSide like an injury and
// serves one game per team game (playoffs too; games left carry into next season).
const LR2_FINE = { tech: 0.0002, eject: 0.0005, flag1: 0.0005, flag2: 0.0012, fight: 0.002, late: 0.001, discipline: 0.0015, conduct: 0.002, media: 0.001 };
const LR2_FX = { fineMin: 0.002, techRate: 0.021, ejectAfter1: 0.06, flagRate: 0.0022, flag2Share: 0.18, fightRate: 0.0012, flagPts: 4, techCap82: 16, poTechCap: 7,
  pos: { base: 0.05, good: 0.03, win: 0.03, max: 0.15 }, ivOpenDays: 7, mtgOpenDays: 7, mtgCool: 14, reqChance: 0.25 };
const LR2_CNT = { tech: 0, eject: 0, flag: 0, fight: 0, techSusp: 0, flagSusp: 0, fineT: 0, fineL: 0, suspT: 0, suspL: 0, served: 0, pos: 0, iv: 0, mtg: 0, kept: 0, broken: 0 };   // test counters
const fineStr = x => x >= 1 ? money(x) : '$' + Math.max(1, Math.round(x * 1000)) + 'K';
function salOf(p) { return p && p.contract ? p.contract.amt || 0 : 0; }
function fineAmt(p, off, mult) { return Math.round(Math.max(LR2_FX.fineMin, salOf(p) * (LR2_FINE[off] || 0.001) * (mult || 1)) * 10000) / 10000; }
function discOf(L, p) { if (!p.disc || p.disc.s !== L.season) p.disc = { s: L.season, tech: 0, poTech: 0, flag: 0, ej: 0, fights: 0, fines: 0, suspG: 0 }; return p.disc; }
// temper 1-99: fixed per player (hash of id) around his coachability; 50 = average, 80+ = hothead
function temperOf(p) {
  if (p.tmp == null) { const h1 = flHash(p.id + 'tmp') / 4294967296, h2 = flHash('t' + p.id + 'mp') / 4294967296; p.tmp = Math.round(clamp(50 - trc(p, 'cch') * 16 + (h1 + h2 - 1) * 34, 1, 99)); }
  return p.tmp;
}
const tmpK = p => Math.min(5, Math.exp((temperOf(p) - 50) / 16));
// fines: who pays, to whom. kind 'team' = the club keeps it, 'league' = the league
function finePlayer(L, p, off, kind, why, mult) {
  const amt = fineAmt(p, off, mult), d = discOf(L, p), t = p.team != null ? L.teams[p.team] : null;
  d.fines = Math.round((d.fines + amt) * 10000) / 10000;
  if (kind === 'team' && t) { if (!t.fin) initFinance(L, t); t.fin.fines = Math.round(((t.fin.fines || 0) + amt) * 10000) / 10000; LR2_CNT.fineT++; }
  else { L.lgFines = L.lgFines || {}; L.lgFines[L.season] = Math.round(((L.lgFines[L.season] || 0) + amt) * 10000) / 10000; LR2_CNT.fineL++; }
  L.fines = L.fines || []; L.fines.unshift({ s: L.season, day: L.day, pid: p.id, tid: p.team, amt, off, kind, why: why || '' }); if (L.fines.length > 150) L.fines.length = 150;
  return amt;
}
// suspend: games (team 1-5), unpaid. Adds to games already left.
function suspend(L, p, games, kind, why, gid) {
  games = Math.max(1, Math.round(games)); if (kind === 'team') games = Math.min(5, games);
  const t = p.team != null ? L.teams[p.team] : null, lost = Math.round(salOf(p) * games / Math.max(1, SEASON_GAMES) * 10000) / 10000;
  const s = p.susp && p.susp.g > 0 ? p.susp : null;
  p.susp = { g: (s ? s.g : 0) + games, k: s && s.k === 'league' ? 'league' : kind, why, s: L.season, day: L.day, gid: gid != null ? gid : (s ? s.gid : undefined), lost: Math.round(((s ? s.lost : 0) + lost) * 10000) / 10000 };
  if (t) { if (!t.fin) initFinance(L, t); t.fin.suspSaved = Math.round(((t.fin.suspSaved || 0) + lost) * 10000) / 10000; }
  discOf(L, p).suspG += games; if (kind === 'team') LR2_CNT.suspT++; else LR2_CNT.suspL++;
  L.susps = L.susps || []; L.susps.unshift({ s: L.season, day: L.day, pid: p.id, tid: p.team, g: games, kind, why, lost }); if (L.susps.length > 120) L.susps.length = 120;
  p.tx.push({ s: L.season, t: `Suspended ${games} game${games > 1 ? 's' : ''} by the ${kind === 'team' ? 'team' : 'league'} (${why}), without pay` });
  logNews(L, fl('sus.' + kind, { name: p.name, abbr: t ? t.abbr : 'FA', g: games, s: games > 1 ? 's' : '', why, lost: fineStr(lost) }, p.id + games), t ? t.id : null, 'tx', 'susp');
  return p.susp;
}
const isSusp = p => !!(p && p.susp && p.susp.g > 0);
function suspGames(p) { return isSusp(p) ? p.susp.g : 0; }
// your call: suspend one of your players (conduct), 1-5 games
function suspendPlayer(L, pid, games, why) {
  const p = L.players[pid]; if (!p || L.user == null || p.team !== L.user) return { ok: false, msg: 'Not on your team.' };
  if (!(games >= 1 && games <= 5)) return { ok: false, msg: 'Team suspensions are 1 to 5 games.' };
  if (p.susp && p.susp.g > 0 && p.susp.k === 'team') return { ok: false, msg: `${p.name} is already suspended.` };
  const t = L.teams[L.user], star = p.ovr >= Math.max(...rotationOf(L, t).map(x => x.ovr)) - 1;
  suspend(L, p, games, 'team', why || 'conduct detrimental to the team');
  p.morale = clamp(Math.round((p.morale != null ? p.morale : 60) - 6 - 2 * games), 0, 100);
  const lr = lrOf(t); lr.v = clamp(lr.v + (star && games >= 3 ? -2 : 2), 0, 100);
  L.media = L.media || { rep: 50 }; L.media.rep = clamp(mediaRep(L) + 1, 0, 100);
  if (t.coach && trv(p, 'cch') < 40 && games >= 3 && !(p.friction || []).includes(t.coach.id)) p.friction = (p.friction || []).concat(t.coach.id);
  return { ok: true, susp: p.susp };
}
// after every game: serve suspensions, then roll techs / flagrants / ejections / fights for those who played
function lr2Game(L, g) {
  for (const tid of [g.home, g.away]) for (const id of L.teams[tid].roster) {
    const p = L.players[id]; if (!isSusp(p) || p.susp.gid === g.id) continue;
    p.susp.g--; LR2_CNT.served++;
    if (p.susp.g <= 0) { const k = p.susp.k; delete p.susp; logNews(L, fl('sus.back', { name: p.name, abbr: L.teams[tid].abbr, who: k === 'team' ? 'team' : 'league' }, p.id), tid, 'tx', 'susp'); }
  }
  const close = Math.abs(g.hs - g.as) <= 6 || g.ot, heat = (g.playoff ? 1.25 : 1) * (close ? 1.15 : 1) * (isRivalry && (() => { try { return isRivalry(L, g.home, g.away); } catch (e) { return false; } })() ? 1.3 : 1);
  const played = g.box.filter(r => r[2] > 0).map(r => [L.players[r[0]], r[1], r[2]]).filter(x => x[0]);
  const maxMin = Math.max(1, ...played.map(x => x[2]));
  for (const [p, si, min] of played) {
    const k = tmpK(p) * heat * (0.35 + 0.65 * min / maxMin), d = discOf(L, p), tid = si === 0 ? g.home : g.away, t = L.teams[tid], v = { name: p.name, abbr: t.abbr };
    if (R() < LR2_FX.techRate * k) {
      LR2_CNT.tech++; finePlayer(L, p, 'tech', 'league', 'technical foul');
      if (g.playoff) d.poTech++; else d.tech++;
      if (R() < LR2_FX.ejectAfter1 * Math.sqrt(k)) { LR2_CNT.eject++; d.ej++; if (g.playoff) d.poTech++; else d.tech++; finePlayer(L, p, 'eject', 'league', 'ejected (two technicals)'); logNews(L, fl('dc.eject', v, g.id + p.id), tid, 'team', 'disc'); }
      const cap = g.playoff ? LR2_FX.poTechCap : Math.max(6, Math.round(LR2_FX.techCap82 * SEASON_GAMES / 82)), n = g.playoff ? d.poTech : d.tech;
      if (n >= cap && (n - cap) % 2 === 0 && d.lastTechSusp !== n) { d.lastTechSusp = n; LR2_CNT.techSusp++; suspend(L, p, 1, 'league', `${n} technical fouls`, g.id); }
    }
    if (R() < LR2_FX.flagRate * k) {
      LR2_CNT.flag++; const two = R() < LR2_FX.flag2Share * Math.sqrt(k), pts = two ? 2 : 1, before = d.flag; d.flag += pts;
      finePlayer(L, p, two ? 'flag2' : 'flag1', 'league', two ? 'flagrant 2 foul' : 'flagrant 1 foul');
      logNews(L, fl(two ? 'dc.flag2' : 'dc.flag1', v, g.id + p.id), tid, 'team', 'disc');
      let sg = two && R() < 0.4 ? 1 : 0;   // a flagrant 2 can draw a game on review
      if (before < LR2_FX.flagPts && d.flag >= LR2_FX.flagPts) sg += 1; else if (before >= LR2_FX.flagPts) sg += pts;   // past the points line, every point costs a game
      if (sg) { LR2_CNT.flagSusp++; suspend(L, p, sg, 'league', two ? 'flagrant 2 foul' : 'flagrant foul points', g.id); }
    }
  }
  // fights: one per game at most, between the hottest players on each side
  const hot = [0, 1].map(si => played.filter(x => x[1] === si).sort((a, b) => tmpK(b[0]) - tmpK(a[0]))[0]);
  if (hot[0] && hot[1] && R() < LR2_FX.fightRate * heat * Math.sqrt(tmpK(hot[0][0]) * tmpK(hot[1][0]))) {
    LR2_CNT.fight++; const [a, b] = [hot[0][0], hot[1][0]], inst = R() < 0.5 ? a : b;   // the instigator gets more
    for (const p of [a, b]) {
      const d = discOf(L, p); d.fights++; d.ej++;
      const gms = clamp(p === inst ? rint(2, 3) + (temperOf(p) >= 75 && R() < 0.4 ? 2 : 0) : rint(1, 2), 1, 5);
      finePlayer(L, p, 'fight', 'league', 'fight', gms);
      suspend(L, p, gms, 'league', 'fight', g.id);
    }
    logNews(L, fl('dc.fight', { a: a.name, b: b.name, abbrA: L.teams[g.home].abbr, abbrB: L.teams[g.away].abbr }, g.id), g.home, 'league', 'disc');
    try { addPost(L, 'fight', 'nat', 'calm', { a: a.name, b: b.name }, { tid: g.home, pid: a.id, size: 1.2, key: 'fd.fight.nat' }); } catch (e) { }
  }
}

// ---- positive moments (weekly, auto: no decision) ----
const POS_KINDS = ['mentor', 'sacrifice', 'trip', 'praise', 'rally', 'charity'];
function posPick(L, t, rot) {
  const opts = [], byAge = rot.slice().sort((a, b) => a.age - b.age), kid = byAge.find(p => p.age <= 22 || (p.svc || 0) <= 1);
  const vet = rot.find(p => p.age >= 29 && (p.pers === 'Mentor' || (trv(p, 'cch') >= 60 && trv(p, 'win') >= 55)));
  if (vet && kid && vet !== kid) opts.push(['mentor', 2.5, [vet.id, kid.id]]);
  const sac = rot.find(p => p.age >= 29 && p.moraleParts && (p.moraleParts.minutes || 0) < -3 && trv(p, 'cch') >= 58);
  if (sac) opts.push(['sacrifice', 2, [sac.id]]);
  const lead = rot.slice(0, 6).sort((a, b) => trv(b, 'win') + trv(b, 'cch') - trv(a, 'win') - trv(a, 'cch'))[0];
  if (lead) opts.push(['trip', 1.5, [lead.id]]);
  const brk = rot.filter(p => p.age <= 25 && p.stats.rs && p.stats.rs.gp >= 8).sort((a, b) => b.stats.rs.pts / b.stats.rs.gp - a.stats.rs.pts / a.stats.rs.gp)[0];
  if (brk && brk.stats.rs.pts / brk.stats.rs.gp >= 14) opts.push(['praise', 2, [brk.id]]);
  const wk = L.games.slice(-L.teams.length * 4).filter(g => !g.playoff && g.season === L.season && (g.home === t.id || g.away === t.id) && L.day - g.day <= 7);
  const clutch = wk.find(g => (g.home === t.id ? g.hs > g.as : g.as > g.hs) && (Math.abs(g.hs - g.as) <= 3 || g.ot));
  if (clutch) { const si = clutch.home === t.id ? 0 : 1, top = clutch.box.filter(r => r[1] === si).sort((a, b) => (b[3] || 0) - (a[3] || 0))[0]; opts.push(['rally', 3, top ? [top[0]] : [], { gid: clutch.id }]); }
  const ch = rot.slice().sort((a, b) => (b.fame || 0) + trv(b, 'loy') - (a.fame || 0) - trv(a, 'loy'))[0];
  if (ch) opts.push(['charity', 1.2, [ch.id]]);
  if (!opts.length) return null;
  let r = R() * opts.reduce((a, o) => a + o[1], 0); for (const o of opts) { r -= o[1]; if (r <= 0) return o; } return opts[opts.length - 1];
}
const POS_FX = { mentor: { h: 4, m: [2, 6] }, sacrifice: { h: 6, m: [2], others: 1 }, trip: { h: 5, others: 2 }, praise: { h: 3, m: [6], hype: 1 }, rally: { h: 6, others: 2, hype: 2 }, charity: { h: 2, m: [3], hype: 3, fame: 2, trust: 1 } };
function posWeek(L, t) {
  const lr = lrOf(t), g = t.w + t.l, wp = g >= 5 ? t.w / g : 0.5;
  const ch = Math.min(LR2_FX.pos.max, LR2_FX.pos.base + (lr.v >= 60 ? LR2_FX.pos.good : 0) + (wp >= 0.55 ? LR2_FX.pos.win : 0));
  if (R() >= ch) return null;
  const rot = rotationOf(L, t).slice(0, 9), o = posPick(L, t, rot); if (!o) return null;
  const [k, , pids] = o, fx = POS_FX[k], ev = { id: 'dr' + ((L.dramaN = (L.dramaN || 0) + 1)), s: L.season, day: L.day, tid: t.id, k, pids, pos: 1, st: 'done' };
  drApply(L, t, fx, pids);
  if (fx.hype) hypeBump(t, fx.hype);
  if (fx.fame) { const p = L.players[pids[0]]; if (p) p.fame = Math.min(100, (p.fame || 0) + fx.fame); }
  if (fx.trust && t.id === L.user && t.owner) t.owner.trust = clamp(t.owner.trust + fx.trust, 0, 100);
  if (k === 'mentor') { const kid = L.players[pids[1]]; if (kid) kid.mentorBy = { by: pids[0], s: L.season }; }   // v29 fix: was kid.wing (overwrote his wingspan -> NaN fit, coach pay, contracts)
  ev.fx = fx; ev.text = fl('dr.' + k, drVars(L, t, ev), ev.id);
  logNews(L, ev.text, t.id, 'team', 'drama'); LR2_CNT.pos++;
  try { addPost(L, 'drama', 'fan', 'happy', drVars(L, t, ev), { tid: t.id, size: 0.6 }); } catch (e) { }
  L.drama.unshift(ev); if (L.drama.length > 80) L.drama.length = 80;
  return ev;
}
// conduct incident (team code: missed flight, skipped practice, sideline blowup...). sev 1-5 = games a team suspension would be
function conductPick(L, t, rot) {
  const c = rot.filter(p => trv(p, 'cch') < 45 || temperOf(p) >= 72).sort((a, b) => temperOf(b) - temperOf(a))[0]; if (!c) return null;
  const sev = clamp(1 + Math.floor(R() * 3) + (temperOf(c) >= 80 ? 1 : 0) + (R() < 0.15 ? 1 : 0), 1, 5);
  return { pid: c.id, sev, what: ['missed the team flight', 'skipped practice', 'blew up at the coaches on the bench', 'broke team curfew on a road trip', 'got into it with a team staffer'][sev - 1], why: ['missing the team flight', 'skipping practice', 'blowing up at the coaches on the bench', 'breaking team curfew on a road trip', 'getting into it with a team staffer'][sev - 1] };
}
// which answers an incident allows (UI)
function drChoicesFor(ev) { const ks = Object.keys(DR_CHOICES); return ev && ['feud', 'late', 'coachRift', 'callout', 'conduct'].includes(ev.k) ? ks : ks.filter(k => k !== 'suspend'); }
function drSuspGames(ev) { return ev.k === 'conduct' ? ev.sev || 2 : ev.k === 'coachRift' ? 2 : 1; }

// ---- media interviews (team mode, your GM): 2-3 a season (opening week, before the deadline, first playoff game) ----
const IV_OUTLETS = [{ k: 'pod', name: 'The Full-Court Pod', host: 'Dana Whitlock', kind: 'podcast' }, { k: 'col', name: 'Pacific Hoops Weekly', host: 'Marcus Ilagan', kind: 'writer' }, { k: 'rad', name: 'Baseline Radio', host: 'Tess Romero', kind: 'radio' }, { k: 'web', name: 'The Paint Report', host: 'Owen Castillo', kind: 'writer' }];
const IV_STAGES = ['open', 'deadline', 'playoffs', 'draft'];
// questions: when (stage, context) and 4 answers with effects: hype, trust (owner), rep (media), h (harmony), sm (subject morale), all (rotation morale), claim
const IV_Q = {
  goal: { st: ['open'], w: 3, a: [{ hype: 4, claim: 'title' }, { hype: 2, claim: 'playoffs' }, { hype: 0, trust: 1, rep: 1 }, { rep: -1 }] },
  star: { st: ['open', 'deadline', 'playoffs'], w: 2, a: [{ sm: 6, hype: 1 }, { sm: -5, rep: 1, all: 1 }, { h: 2, sm: -1 }, { rep: -1 }] },
  unhappy: { st: ['open', 'deadline'], w: 5, need: 'unhappy', a: [{ sm: 7, promise: 'stay' }, { sm: -9, rep: 1 }, { sm: 2, h: 1 }, { rep: -1, sm: -2 }] },
  coach: { st: ['open', 'deadline', 'playoffs'], w: 3, need: 'hot', a: [{ trust: -1, all: 1, coach: 1 }, { rep: 1, coach: -1 }, { all: -2, trust: 1, rep: 1 }, { rep: -1 }] },
  market: { st: ['deadline'], w: 4, a: [{ hype: 3, trust: -1 }, { hype: -3, rep: 1 }, { hype: 0, trust: 1 }, { rep: -1 }] },
  young: { st: ['open', 'deadline'], w: 2, need: 'young', a: [{ sm: 5, hype: 2 }, { sm: -2, rep: 1 }, { sm: 2, trust: 1 }, { rep: -1 }] },
  locker: { st: ['open', 'deadline', 'playoffs'], w: 4, need: 'locker', a: [{ rep: -2, h: 1 }, { h: 3, rep: 1 }, { h: -3, all: -2, trust: 1 }, { rep: -1 }] },
  money: { st: ['open', 'deadline'], w: 3, need: 'tax', a: [{ trust: -2, hype: 2 }, { trust: 2, hype: -1 }, { trust: 1 }, { rep: -1 }] },
  series: { st: ['playoffs'], w: 6, a: [{ hype: 4, all: 2, claim: 'series' }, { hype: 1, rep: 1 }, { all: 1, h: 2 }, { rep: -1 }] },
  fans: { st: ['open', 'deadline', 'playoffs'], w: 1, a: [{ hype: 3 }, { hype: 1, rep: 1 }, { hype: 2, trust: -1 }, { rep: -1 }] }
};
function ivCtx(L, t, stage0) {
  const rot = rotationOf(L, t).slice(0, 9), star = rot.slice().sort((a, b) => b.ovr - a.ovr)[0];
  const unhappy = rot.filter(p => (p.morale != null ? p.morale : 60) < 42).sort((a, b) => b.ovr - a.ovr)[0];
  const young = rot.filter(p => p.age <= 23).sort((a, b) => b.pot - a.pot)[0];
  const g = t.w + t.l, hot = (t.streak || 0) <= -4 || (g >= 10 && t.w / g < 0.4) || (() => { try { return hotSeat(L, t).v >= 45; } catch (e) { return false; } })();
  let tax = false; try { tax = payroll(L, t, L.season) > TAXLINE; } catch (e) { }
  let opp = null; if (L.phase === 'playoffs' && L.po && L.po.rounds) { const r = L.po.rounds[L.po.stage] || [], s = r.find(x => (x.hi === t.id || x.lo === t.id) && x.winner == null); if (s) opp = L.teams[s.hi === t.id ? s.lo : s.hi]; }
  let pick = null; if (stage0 === 'draft' && L.draftOrder) { const sl = L.draftOrder.find(x => x.owner === t.id && !x.pid); if (sl) pick = sl.rd === 1 ? '#' + sl.no : 'a second-rounder (#' + (L.teams.length + sl.no) + ' overall)'; }
  return { pick, rot, star, unhappy, young, hot, tax, locker: lrOf(t).v < 45 || (L.drama || []).some(e => e.tid === t.id && !e.pos && L.day - e.day <= 14 && e.s === L.season), opp };
}
function ivOpen(L) { const I = L.iv; if (!I || I.done) return null; if (I.s !== L.season || (I.ph !== L.phase && !(I.ph === 'regular' && L.phase === 'regular-done')) || (L.phase === 'regular' && L.day - I.day > LR2_FX.ivOpenDays)) { ivExpire(L); return null; } return I; }
function ivExpire(L) { const I = L.iv; if (!I || I.done) return; I.done = true; I.expired = true; if (I.qs.some(q => q.ans == null)) { L.media = L.media || { rep: 50 }; L.media.rep = clamp(mediaRep(L) - 2, 0, 100); } }
function ivTrigger(L, stage) {
  if (L.user == null || L.mode === 'commish' || L.auto) return null;
  L.ivDone = L.ivDone || {}; const key = L.season + ':' + stage; if (L.ivDone[key]) return null;
  if (ivOpen(L)) ivExpire(L);
  const t = L.teams[L.user]; if (!t) return null;
  const C = ivCtx(L, t, stage), out = IV_OUTLETS[(L.season * 3 + IV_STAGES.indexOf(stage)) % IV_OUTLETS.length];
  L.ivUsed = L.ivUsed && L.ivUsed.s === L.season ? L.ivUsed : { s: L.season, ks: [] };   // v30c #23: no repeat question in a season
  const cands = Object.keys(IV_Q).filter(k => IV_Q[k].st.includes(stage) && !L.ivUsed.ks.includes(k) && (!IV_Q[k].need || C[IV_Q[k].need]) && !(k === 'series' && !C.opp) && !(k === 'star' && !C.star));
  const qs = [];
  while (qs.length < 3 && cands.length) { let r = R() * cands.reduce((a, k) => a + IV_Q[k].w, 0), pick = cands[0]; for (const k of cands) { r -= IV_Q[k].w; if (r <= 0) { pick = k; break; } } cands.splice(cands.indexOf(pick), 1); qs.push(pick); }
  if (!qs.length) { L.ivDone[key] = -1; return null; }
  L.ivUsed.ks.push(...qs);
  const v = { pick: C.pick || 'your picks', team: t.name, abbr: t.abbr, city: t.city, coach: t.coach ? t.coach.name : 'the coach', w: t.w, l: t.l, outlet: out.name, host: out.host, opp: C.opp ? C.opp.name : 'them' };
  const subj = { star: C.star, unhappy: C.unhappy, young: C.young };
  L.iv = { id: (L.ivN = (L.ivN || 0) + 1), s: L.season, day: L.phase === 'regular' ? L.day : 0, ph: L.phase, stage, tid: t.id, outlet: out.k, qs: qs.map((k, i) => { const p = subj[k]; return { k, n: L.ivN * 3 + i, pid: p ? p.id : undefined, v: Object.assign({}, v, { name: p ? p.name : '' }) }; }), done: false };
  L.ivDone[key] = L.iv.id; LR2_CNT.iv++;
  logNews(L, fl('iv.news.' + stage, v, L.iv.id), t.id, 'team', 'iv');
  return L.iv;
}
function ivText(L, q) { return fl('iv.q.' + q.k, q.v, q.n || 0); }
function ivAnswers(L, q) { return [0, 1, 2, 3].map(i => fl('iv.a.' + q.k + '.' + i, q.v, (q.n || 0) + i)); }   // v30 text: seed by question + slot (was 1, which always picked the 2nd wording)
function ivAnswer(L, qi, ai) {
  const I = ivOpen(L); if (!I) return null; const q = I.qs[qi]; if (!q || q.ans != null || !(ai >= 0 && ai <= 3)) return null;
  const t = L.teams[I.tid], fx = Object.assign({}, IV_Q[q.k].a[ai]), subj = q.pid != null ? L.players[q.pid] : null;
  if (fx.sm && subj && subj.team === t.id) { const d = fx.sm < 0 ? Math.round(fx.sm * clamp(1 - 0.3 * trc(subj, 'cch'), 0.6, 1.4)) : fx.sm; subj.morale = clamp(Math.round((subj.morale != null ? subj.morale : 60) + d), 0, 100); fx.sm = d; }
  if (fx.all) for (const p of rotationOf(L, t).slice(0, 9)) if (!subj || p.id !== subj.id) p.morale = clamp(Math.round((p.morale != null ? p.morale : 60) + fx.all), 0, 100);
  if (fx.h) { const lr = lrOf(t); lr.v = clamp(lr.v + fx.h, 0, 100); }
  if (fx.hype) hypeBump(t, fx.hype);
  if (fx.trust && t.owner) t.owner.trust = clamp(Math.round(t.owner.trust + fx.trust), 0, 100);
  if (fx.rep) { L.media = L.media || { rep: 50 }; L.media.rep = clamp(mediaRep(L) + fx.rep, 0, 100); }
  if (fx.coach && t.coach) t.coach.ivBack = { s: L.season, v: fx.coach };
  if (fx.claim) { L.claims = L.claims || []; L.claims.push({ s: L.season, k: fx.claim, tid: t.id, iv: I.id, opp: q.v.opp, rw0: poRoundsWon(L, t.id) }); }
  if (fx.promise === 'stay' && subj) mkPromise(L, subj, 'stay', null, 'interview');
  q.ans = ai; q.fx = fx;
  if (I.qs.every(x => x.ans != null)) { I.done = true; try { addPost(L, 'iv', 'beat', mediaTone(L, t.id), { outlet: IV_OUTLETS.find(o => o.k === I.outlet).name, team: t.abbr, quote: ivAnswers(L, q)[ai] }, { tid: t.id, size: 1, key: 'fd.iv.beat' }); } catch (e) { } }
  return { q, fx, done: I.done };
}
// what you said, checked when the season ends: called a title / playoffs / a series win and missed = rep and owner trust down; hit = up
function claimsSettle(L) {
  const S = L.season, mine = (L.claims || []).filter(c => c.s === S && !c.done); if (!mine.length) return [];
  const out = [];
  for (const c of mine) {
    const t = L.teams[c.tid], inPo = !!(L.po && L.po.rounds && L.po.rounds.some((r, i) => !isPlayin(L, i) && r.some(sr => sr.hi === c.tid || sr.lo === c.tid)));
    const hit = c.k === 'title' ? !!(L.po && L.po.champion === c.tid) : c.k === 'playoffs' ? inPo : c.k === 'series' ? poRoundsWon(L, c.tid) > (c.rw0 || 0) : false;
    c.done = 1; c.hit = hit ? 1 : 0;
    const d = hit ? (c.k === 'title' ? 3 : 1) : (c.k === 'title' ? -3 : -2);
    L.media = L.media || { rep: 50 }; L.media.rep = clamp(mediaRep(L) + d, 0, 100);
    if (t.owner && !hit) t.owner.trust = clamp(t.owner.trust - (c.k === 'title' ? 2 : 1), 0, 100);
    logNews(L, fl('iv.claim.' + (hit ? 'hit' : 'miss'), { abbr: t.abbr, what: { title: 'a title', playoffs: 'a playoff spot', series: 'a series win' }[c.k] }, S), c.tid, 'team', 'iv');
    out.push(c);
  }
  return out;
}

// ---- one-on-ones with your players; promises are tracked (L.promises) ----
// L.mtg = { id, pid, tid, s, day, ph, why, by: 'you' | 'player', st: 'open' | 'done', choice, fx }. One open at a time.
const MTG_OPTS = {
  start: { lbl: 'Promise him a starting job', promise: 'start' },
  min: { lbl: 'Promise him more minutes', promise: 'min' },
  ext: { lbl: 'Promise extension talks', promise: 'ext' },
  trade: { lbl: 'Promise to trade him by the deadline', promise: 'trade' },
  patience: { lbl: 'Ask for patience' },
  challenge: { lbl: 'Challenge him to earn it' },
  feud: { lbl: 'Tell him you will handle the feud' },
  praise: { lbl: 'Tell him he is part of the future' }
};
function gmTrustOf(p) { return p.gmTrust != null ? p.gmTrust : 50; }
function mtgWhy(L, p) {
  if (p.tradeReq === L.season) return 'tradeReq';
  if (p.feud && p.feud.s === L.season && L.day <= p.feud.until) return 'feud';
  if ((p.morale != null ? p.morale : 60) < 45) return 'unhappy';
  if (p.age <= 24 && p.pot - p.ovr >= 4 && p.stats.rs && p.stats.rs.gp >= 5) return 'rising';
  return 'checkin';
}
function mtgOpen(L) { const M = L.mtg; if (!M || M.st !== 'open') return null; if (M.s !== L.season || L.user == null || M.tid !== L.user || (L.phase === 'regular' && L.day - M.day > LR2_FX.mtgOpenDays) || !L.players[M.pid] || L.players[M.pid].team !== M.tid) { mtgExpire(L); return null; } return M; }
function mtgExpire(L) { const M = L.mtg; if (!M || M.st !== 'open') return; M.st = 'done'; M.expired = true; const p = L.players[M.pid]; if (p && M.by === 'player') { p.morale = clamp((p.morale != null ? p.morale : 60) - 3, 0, 100); p.gmTrust = clamp(gmTrustOf(p) - 5, 0, 100); } }
function mtgStart(L, p, by) {
  const t = L.teams[L.user]; mtgOpen(L);
  L.mtg = { id: (L.mtgN = (L.mtgN || 0) + 1), pid: p.id, tid: t.id, s: L.season, day: L.phase === 'regular' ? L.day : 0, ph: L.phase, why: mtgWhy(L, p), by, st: 'open' };
  p.lastMtg = { s: L.season, day: L.day, ph: L.phase }; LR2_CNT.mtg++;
  if (by === 'player') logNews(L, fl('mtg.req.' + L.mtg.why, { name: p.name, abbr: t.abbr }, L.mtg.id), t.id, 'team', 'mtg');
  return L.mtg;
}
// you ask a player for a sit-down (once every LR2_FX.mtgCool days per player)
function meetPlayer(L, pid) {
  if (L.user == null || L.mode === 'commish') return { ok: false, msg: 'Only in team mode.' };
  const p = L.players[pid]; if (!p || p.team !== L.user) return { ok: false, msg: 'Not on your team.' };
  if (mtgOpen(L)) return { ok: false, msg: 'Finish your current meeting first.' };
  const lm = p.lastMtg; if (lm && lm.s === L.season && lm.ph === L.phase && L.day - lm.day < LR2_FX.mtgCool) return { ok: false, msg: `You met ${p.name} recently. Try again in ${LR2_FX.mtgCool - (L.day - lm.day)} days.` };
  return { ok: true, mtg: mtgStart(L, p, 'you') };
}
// options for the open meeting (depends on why, his role and the calendar)
function mtgOptions(L, M) {
  M = M || mtgOpen(L); if (!M) return []; const p = L.players[M.pid], t = L.teams[M.tid], o = [];
  const mpg = p.stats.rs && p.stats.rs.gp ? Math.round(p.stats.rs.min / p.stats.rs.gp / 60) : 0, starter = p.stats.rs && p.stats.rs.gp >= 3 ? p.stats.rs.gs / p.stats.rs.gp >= 0.6 : rotationOf(L, t).slice(0, 5).includes(p);
  const inSeason = L.phase === 'regular';
  const role = hasPromise(L, p.id, 'start') || hasPromise(L, p.id, 'min');
  if (inSeason && !starter && !role) o.push('start');
  if (inSeason && mpg < 32 && !role) o.push('min');
  if (p.contract && p.contract.exp <= L.season + 1 && !p.tw && !hasPromise(L, p.id, 'ext')) o.push('ext');
  if ((M.why === 'tradeReq' || M.why === 'unhappy') && !hasPromise(L, p.id, 'trade')) o.push('trade');
  o.push('patience', 'challenge');
  if (M.why === 'feud') o.push('feud');
  if (M.why === 'rising' || p.age <= 24) o.push('praise');
  return o.map(k => ({ k, lbl: MTG_OPTS[k].lbl, v: k === 'min' ? Math.min(34, Math.max(mpg + 6, 18)) : undefined }));
}
function hasPromise(L, pid, k) { return (L.promises || []).some(x => x.pid === pid && x.st === 'open' && (!k || x.k === k)); }
// make a promise. k: start | min (v = minutes) | ext | trade | stay (no trade this season)
function mkPromise(L, p, k, v, src) {
  const t = L.teams[p.team], s = p.stats.rs || { gp: 0, gs: 0, min: 0 }, dl = deadlineDay(L);
  let due;
  if (k === 'start' || k === 'min') due = { s: L.season, g: t.w + t.l + Math.max(8, gpq(12)) };
  else if (k === 'trade') due = L.phase === 'regular' && L.day <= dl ? { s: L.season, day: dl } : { s: L.season + 1, day: dl };
  else if (k === 'stay') due = { s: L.season, day: dl };
  else due = { s: (p.contract ? p.contract.exp : L.season) };   // ext: new deal before his current one runs out
  const pr = { id: (L.promN = (L.promN || 0) + 1), pid: p.id, tid: t.id, k, v: v || undefined, s: L.season, day: L.day, ph: L.phase, src: src || 'meeting', due, st: 'open', base: { gp: s.gp || 0, gs: s.gs || 0, min: s.min || 0, tg: t.w + t.l, exp: p.contract ? p.contract.exp : L.season, inj: injGamesSeason(L, p) } };
  L.promises = L.promises || []; L.promises.unshift(pr); if (L.promises.length > 60) L.promises.length = 60;
  p.tx.push({ s: L.season, t: `You promised: ${promiseLabel(pr)}` });
  return pr;
}
function injGamesSeason(L, p) { return (p.injuries || []).filter(x => x.s === L.season).reduce((a, x) => a + (x.games || 0), 0); }
function promiseLabel(pr) { return { start: 'a starting job', min: `${pr.v} minutes a game`, ext: 'extension talks', trade: 'a trade by the deadline', stay: 'he will not be traded this season' }[pr.k]; }
function mtgAnswer(L, k) {
  const M = mtgOpen(L); if (!M) return null; const opt = mtgOptions(L, M).find(o => o.k === k); if (!opt) return null;
  const p = L.players[M.pid], t = L.teams[M.tid], tr = gmTrustOf(p), cch = trc(p, 'cch'), fx = { m: 0, h: 0, trust: 0 };
  if (MTG_OPTS[k].promise) { mkPromise(L, p, MTG_OPTS[k].promise, opt.v, 'meeting'); fx.m = Math.round(6 + 6 * tr / 100); fx.trust = 2; if (k === 'trade') fx.h = -1; }
  else if (k === 'patience') { fx.m = Math.round((tr - 45) / 6 + 2 * cch); fx.trust = fx.m >= 0 ? 1 : -2; }
  else if (k === 'challenge') { const good = cch > -0.1 || trv(p, 'wrk') >= 65; fx.m = good ? 3 : -7; fx.trust = good ? 3 : -4; fx.h = good ? 1 : 0; if (good) p.chal = { s: L.season, day: L.day }; }
  else if (k === 'feud') { fx.m = 3; fx.h = 2; if (p.feud) { p.feud.until = Math.min(p.feud.until, L.day + 3); const o = L.players[p.feud.w]; if (o && o.feud) o.feud.until = Math.min(o.feud.until, L.day + 3); } }
  else if (k === 'praise') { fx.m = 5; fx.trust = 2; }
  p.morale = clamp(Math.round((p.morale != null ? p.morale : 60) + fx.m), 0, 100);
  p.gmTrust = clamp(tr + fx.trust, 0, 100);
  if (fx.h) { const lr = lrOf(t); lr.v = clamp(lr.v + fx.h, 0, 100); }
  p.talk = { s: L.season, day: L.day, d: clamp(Math.round(fx.m / 2), -4, 4) };
  M.st = 'done'; M.choice = k; M.fx = fx;
  return { mtg: M, fx };
}
// a player on your team asks for a meeting (weekly roll): unhappy, feuding, asked for a trade, or a young riser
function mtgRequests(L) {
  if (L.user == null || L.mode === 'commish' || L.auto || mtgOpen(L) || L.phase !== 'regular') return null;
  const t = L.teams[L.user], cands = rotationOf(L, t).slice(0, 10).filter(p => { const w = mtgWhy(L, p), lm = p.lastMtg; return w !== 'checkin' && !(lm && lm.s === L.season && L.day - lm.day < 21); });
  if (!cands.length || R() >= LR2_FX.reqChance) return null;
  const pri = { tradeReq: 4, feud: 3, unhappy: 2, rising: 1 }, p = cands.sort((a, b) => pri[mtgWhy(L, b)] - pri[mtgWhy(L, a)] || b.ovr - a.ovr)[0];
  return mtgStart(L, p, 'player');
}
// weekly + season end: keep or break promises
function checkGmPromises(L, end) {
  const out = [];
  for (const pr of (L.promises || [])) {
    if (pr.st !== 'open') continue;
    const p = L.players[pr.pid], t = L.teams[pr.tid]; let st = null;
    if (!p || p.retired) { pr.st = 'void'; continue; }
    if (pr.k === 'start' || pr.k === 'min') {
      if (p.team !== pr.tid || pr.s !== L.season && !end) { pr.st = 'void'; continue; }
      const tg = t.w + t.l - pr.base.tg, inj = injGamesSeason(L, p) - pr.base.inj, av = tg - Math.min(tg, inj), s = p.stats.rs || {};
      if (av >= Math.max(6, gpq(10)) || (end && av >= 3)) { const gs = ((s.gs || 0) - pr.base.gs) / av, mpg = ((s.min || 0) - pr.base.min) / 60 / av; st = (pr.k === 'start' ? gs >= 0.6 : mpg >= pr.v - 2) ? 'kept' : 'broken'; }
      else if (end || pr.s !== L.season) st = 'void';
    } else if (pr.k === 'trade') {
      if (p.team !== pr.tid) st = 'kept'; else if (L.season > pr.due.s || (L.season === pr.due.s && L.phase === 'regular' && L.day > pr.due.day) || (L.season === pr.due.s && L.phase !== 'regular' && end)) st = 'broken';
    } else if (pr.k === 'stay') {
      if (p.team !== pr.tid) st = 'broken'; else if (L.season > pr.due.s || (L.phase === 'regular' && L.day > pr.due.day) || end) st = 'kept';
    } else if (pr.k === 'ext') {
      if (p.team === pr.tid && p.contract && p.contract.exp > pr.base.exp) st = 'kept';
      else if (p.team !== pr.tid && p.team != null && L.season <= pr.base.exp) st = 'void';   // you traded him: nothing to judge
      else if (L.season > pr.base.exp || p.team == null) st = 'broken';
    }
    if (st) { pr.st = st; pr.end = { s: L.season, day: L.day }; if (st !== 'void') promiseResult(L, pr, p, t); out.push(pr); }
  }
  return out;
}
function promiseResult(L, pr, p, t) {
  const kept = pr.st === 'kept', lbl = promiseLabel(pr);
  if (p.team === pr.tid || pr.k === 'trade') {
    p.morale = clamp(Math.round((p.morale != null ? p.morale : 60) + (kept ? 5 : -12)), 0, 100);
    p.gmTrust = clamp(gmTrustOf(p) + (kept ? 10 : -20), 0, 100);
  }
  if (p.team === pr.tid) { const lr = lrOf(t); lr.v = clamp(lr.v + (kept ? 1 : -3), 0, 100); }
  if (!kept) { L.media = L.media || { rep: 50 }; L.media.rep = clamp(mediaRep(L) - 1, 0, 100); try { feedPromise(L, p, t, lbl); } catch (e) { } }
  if (kept) LR2_CNT.kept++; else LR2_CNT.broken++;
  p.tx.push({ s: L.season, t: `Promise ${kept ? 'kept' : 'broken'}: ${lbl}` });
  logNews(L, fl('prm.' + (kept ? 'kept' : 'broken'), { name: p.name, abbr: t.abbr, what: lbl }, pr.id), pr.tid, 'team', 'mtg');
}
function promiseList(L, tid) { return (L.promises || []).filter(x => tid == null || x.tid === tid); }
// morale parts (hooked in moraleParts): recent talk, broken / open promises from you, a team suspension
function lr2Morale(L, p, t, parts) {
  if (p.talk && p.talk.s === L.season && L.day - p.talk.day <= 21 && p.talk.d) parts.talk = p.talk.d;
  const prs = (L.promises || []).filter(x => x.pid === p.id && x.tid === t.id && (x.st === 'open' || (x.st === 'broken' && x.end && x.end.s === L.season)));
  if (prs.some(x => x.st === 'broken')) parts.gmPromise = -6; else if (prs.length) parts.gmPromise = 2;
  if (isSusp(p) && p.susp.k === 'team') parts.susp = -3;
}
// daily hook (afterDay): interviews, meeting requests, weekly checks
function lr2Day(L) {
  if (L.phase !== 'regular') return;
  if (L.day === 3) ivTrigger(L, 'open');
  if (L.day === Math.max(4, deadlineDay(L) - 4)) ivTrigger(L, 'deadline');
  ivOpen(L); mtgOpen(L);
  if (L.day % 7 === 0) { checkGmPromises(L); mtgRequests(L); }
}
// season end (startOffseason): settle what you said and what you promised
function lr2SeasonEnd(L) { if (ivOpen(L)) ivExpire(L); if (mtgOpen(L)) mtgExpire(L); claimsSettle(L); checkGmPromises(L, true); }
// autopilot: drop open interviews and meetings; promises made for the season are void (the AI runs the team)
function lr2Auto(L) { if (L.iv && !L.iv.done) { L.iv.done = true; L.iv.expired = true; } if (L.mtg && L.mtg.st === 'open') { L.mtg.st = 'done'; L.mtg.expired = true; } for (const pr of (L.promises || [])) if (pr.st === 'open' && pr.k !== 'ext') pr.st = 'void'; }
// season discipline table (league leaders in techs / fines / games suspended)
function discLeaders(L, k, n) { return Object.values(L.players).filter(p => p.disc && p.disc.s === L.season && p.disc[k] > 0).sort((a, b) => b.disc[k] - a.disc[k]).slice(0, n || 10).map(p => ({ pid: p.id, name: p.name, tid: p.team, v: p.disc[k], tech: p.disc.tech, flag: p.disc.flag, fines: p.disc.fines, suspG: p.disc.suspG, ej: p.disc.ej })); }

// v28.8 text (one wording each; Haiku adds variants: archive/notes/HAIKU-TASKS.md)
Object.assign(FLAVOR, {
  'sus.team': ['The {abbr} suspended {name} {g} game{s} without pay ({why}). He gives up {lost} in salary.', '{name} will miss {g} game{s} without pay. The reason: {why}. He loses {lost} in salary.', 'The {abbr} benched {name} for {g} game{s}, unpaid, because of {why}. That costs him {lost}.', 'Team discipline: {name} ({abbr}) sits {g} game{s} unpaid for {why}, costing him {lost}.'],
  'sus.league': ['The league suspended {name} ({abbr}) {g} game{s} without pay for {why}. He loses {lost} in salary.', 'League office suspends {name} ({abbr}) for {g} game{s}. Reason: {why}. Lost pay: {lost}.', '{name} ({abbr}) is out {g} game{s} by league order over {why}. He forfeits {lost}.', 'The league handed {name} ({abbr}) {g} game{s} unpaid for {why}. That is {lost} gone from his check.'],
  'sus.back': ['{name} ({abbr}) has served his {who} suspension and is back with the team.', '{name} ({abbr}) is eligible again after his {who} suspension.', 'The {who} suspension is over. {name} ({abbr}) rejoins the lineup.', '{name} ({abbr}) is back from suspension and ready to play.'],
  'dc.eject': ['{name} ({abbr}) was ejected after picking up two technical fouls.', '{name} ({abbr}) got tossed after his second technical foul.', 'Two technicals and out: {name} ({abbr}) was ejected from the game.', '{name} ({abbr}) lost his cool and was sent to the locker room early.'],
  'dc.flag1': ['{name} ({abbr}) was called for a flagrant 1 foul.', '{name} ({abbr}) drew a flagrant 1 foul for a rough play.', 'Flagrant 1 on {name} ({abbr}). The league is keeping an eye on him.', 'Officials called {name} ({abbr}) for a flagrant 1 foul.'],
  'dc.flag2': ['{name} ({abbr}) was ejected for a flagrant 2 foul.', 'A flagrant 2 call sends {name} ({abbr}) out of the game.', '{name} ({abbr}) was thrown out after a flagrant 2 foul. Expect a review.', 'Flagrant 2 on {name} ({abbr}). He is gone for the night.'],
  'dc.fight': ['{a} ({abbrA}) and {b} ({abbrB}) were ejected after a fight broke out on the court.', 'Fight on the court: {a} ({abbrA}) and {b} ({abbrB}) are both gone.', '{a} ({abbrA}) and {b} ({abbrB}) squared off and got thrown out of the game.', 'Benches cleared after a scuffle. {a} ({abbrA}) and {b} ({abbrB}) were ejected.'],
  'fd.fight.nat': ['Ugly scene: {a} and {b} had to be pulled apart. Suspensions are coming.', '{a} and {b} came to blows on the floor. Expect suspensions from the league.', 'Players had to separate {a} and {b} in a messy fight. Discipline is next.', 'That fight between {a} and {b} got out of hand. The league will sort it out.'],
  'dr.mentor': ['{a} has taken {b} under his wing in {city}. Extra film sessions, early workouts, the whole thing.', '{a} is working one-on-one with {b} in {city}, showing him the ropes every morning.', 'Early workouts, late film nights: {a} is mentoring {b} in {city}.', '{b} says {a} has been his guide since he arrived in {city}. He is grateful.'],
  'dr.sacrifice': ['{a} told the {abbr} coaches he is fine with fewer minutes if it helps the team win. The room noticed.', '{a} says he will take fewer minutes if that helps {abbr} win. Teammates took note.', 'Playing less does not bother {a}. He told the staff the team comes first.', '{a} accepted a smaller role for the {abbr}. His teammates respect that.'],
  'dr.trip': ['{a} took the whole {abbr} roster out on a team trip this week. Players say the group is closer than ever.', '{a} organized a team outing for the {abbr} this week. Everyone showed up.', 'A bonding trip led by {a} has the {abbr} roster laughing together again.', 'The {abbr} spent a day away from basketball, thanks to {a}. Players say it helped.'],
  'dr.praise': ['{abbr} teammates cannot stop talking about {a}: "He is putting it all together," one veteran said.', 'Ask the {abbr} locker room about {a} and the answer is always the same: he is getting better.', 'Veterans say {a} has turned a corner. "He works like a pro now," one said.', '{a} is the talk of the {abbr} practice gym. Teammates say his work shows.'],
  'dr.rally': ['That late win lit up the {abbr} locker room. {a} hit the big shots and the whole team rallied around it.', 'After the close win, {a} led the {abbr} celebration in the locker room.', 'A tight finish brought the {abbr} together. {a} made the key plays.', 'The {abbr} were loud in the locker room after that comeback, with {a} at the center.'],
  'dr.charity': ['{a} hosted a charity event in {city} with most of his {abbr} teammates. Fans loved it.', '{a} brought several {abbr} teammates to a charity night in {city}.', 'A food drive in {city} got a big boost when {a} and the {abbr} showed up.', '{a} and his {abbr} teammates spent the afternoon giving back in {city}.'],
  'dr.conduct': ['{a} ({abbr}) {what}. The team is deciding what to do.', '{a} ({abbr}) {what}. The front office is weighing a response.', 'Trouble for the {abbr}: {a} {what}. A decision on discipline is coming.', '{a} ({abbr}) {what}, and the team is now looking at options.'],
  'dr.res.suspend': ['The {abbr} suspended {a} {g} game{s} without pay.', 'The {abbr} sat {a} for {g} game{s}, without pay, as a message to the room.', '{a} will miss {g} game{s} unpaid. The {abbr} made the call.', 'Unpaid suspension for {a}: {g} game{s}. The front office says the standard is the standard.'],
  'iv.intro.open': ['{host} of {outlet} sits down with you before the season.', '{host} from {outlet} wants a few minutes before the season starts.', 'Before tip-off, {host} of {outlet} has some questions for you.', '{outlet} is up next, and {host} is ready to ask about the year ahead.'],
  'iv.intro.deadline': ['{host} of {outlet} catches you before the trade deadline.', '{host} of {outlet} wants a word before the trade deadline.', 'With the deadline near, {host} from {outlet} is asking you a few questions.', 'On deadline week, {host} of {outlet} stops you for a quick chat.'],
  'iv.intro.playoffs': ['{host} of {outlet} gets a few minutes with you before the playoffs.', '{host} of {outlet} asks for a quick word as the playoffs approach.', 'Playoff time: {host} from {outlet} has a few questions for you.', '{outlet} wants your take before the postseason. {host} is ready with a few questions.'],
  'iv.news.open': ['The {abbr} GM sat down with {outlet} before the season.', 'The {abbr} GM spoke with {outlet} ahead of opening night.', '{outlet} ran a sit-down with the {abbr} GM before the season began.', 'Before the season, the {abbr} GM gave {outlet} an interview.'],
  'iv.news.deadline': ['The {abbr} GM talked to {outlet} ahead of the trade deadline.', 'The {abbr} GM gave {outlet} a deadline interview.', 'With the deadline close, the {abbr} GM spoke to {outlet}.', '{outlet} got the {abbr} GM on the record as the deadline nears.'],
  'iv.news.playoffs': ['The {abbr} GM spoke with {outlet} as the playoffs begin.', 'The {abbr} GM talked with {outlet} on the eve of the postseason.', '{outlet} caught up with the {abbr} GM as the playoffs got underway.', 'The {abbr} GM gave {outlet} his thoughts before the playoff push.'],
  'iv.q.goal': ['What is the goal for the {team} this season?', 'What do you want the {team} to accomplish this year?', 'So what is the target for the {team} this season?', 'Where do you see the {team} ending up this season?'],
  'iv.a.goal.0': ['We are here to win a title. Nothing less.'],
  'iv.a.goal.1': ['Make the playoffs, then see what happens.'],
  'iv.a.goal.2': ['Get better every week and build something that lasts.'],
  'iv.a.goal.3': ['I do not make predictions.'],
  'iv.q.star': ['Is {name} the face of this franchise?', 'Would you call {name} the franchise player?', 'Is {name} the guy this team is built around?', 'Do you see {name} as the centerpiece of this team?'],
  'iv.a.star.0': ['Without a doubt. He is one of the best players in the league.'],
  'iv.a.star.1': ['He has to show more. We expect a lot from him.'],
  'iv.a.star.2': ['This is a team. Nobody is bigger than the group.'],
  'iv.a.star.3': ['I am not getting into individual players.'],
  'iv.q.unhappy': ['People say {name} is not happy. Will you trade him?', 'Fans are asking about {name}. Is he unhappy here, and could he go?', 'Is {name} unhappy? Are you open to moving him?', 'There is talk {name} wants out. What is your response?'],
  'iv.a.unhappy.0': ['He is not going anywhere. He is part of what we are doing.'],
  'iv.a.unhappy.1': ['Everything is on the table. Nobody is untouchable.'],
  'iv.a.unhappy.2': ['We have talked. He knows where he stands.'],
  'iv.a.unhappy.3': ['I do not comment on rumors.'],
  'iv.q.coach': ['Is {coach} safe in his job?', 'Is {coach} going to be here next season?', 'Do you have confidence in {coach}?', 'Some fans want {coach} gone. How do you respond?'],
  'iv.a.coach.0': ['He has my full support. Period.'],
  'iv.a.coach.1': ['We evaluate everyone, me included.'],
  'iv.a.coach.2': ['It is not on the coach. The players have to step up.'],
  'iv.a.coach.3': ['I will not talk about staff in public.'],
  'iv.q.market': ['Are the {team} buyers or sellers at the deadline?', 'Will the {team} be buying or selling before the deadline?', 'So which is it for the {team} at the deadline: buy or sell?', 'Are the {team} looking to add help or move players at the deadline?'],
  'iv.a.market.0': ['Buyers. We want to add help for a run.'],
  'iv.a.market.1': ['Sellers. We are thinking about the future.'],
  'iv.a.market.2': ['We like this group. No big moves.'],
  'iv.a.market.3': ['You will find out when everyone else does.'],
  'iv.q.young': ['How is {name} coming along?', 'How is the development of {name} going?', 'Where is {name} in his growth right now?', 'Give us an update on {name}. Is he progressing?'],
  'iv.a.young.0': ['He is going to be a star. Watch.'],
  'iv.a.young.1': ['He has a long way to go. He needs to put in the work.'],
  'iv.a.young.2': ['Right on schedule. We are patient with him.'],
  'iv.a.young.3': ['Ask me again in a year.'],
  'iv.q.locker': ['What is going on in the {team} locker room?', 'How would you describe the mood in the {team} locker room?', 'Is the {team} locker room in good shape?', 'Fans want to know: how is the {team} group getting along?'],
  'iv.a.locker.0': ['Nothing. Everyone gets along great.'],
  'iv.a.locker.1': ['We have had some bumps. We are working through them together.'],
  'iv.a.locker.2': ['Some guys need to grow up. They know who they are.'],
  'iv.a.locker.3': ['What happens in the locker room stays there.'],
  'iv.q.money': ['Will the owner keep paying the luxury tax?', 'Is the owner willing to keep paying the luxury tax?', 'How far will the owner go with the tax bill?', 'Does the owner have limits on spending this season?'],
  'iv.a.money.0': ['Whatever it takes. Money is not a problem here.'],
  'iv.a.money.1': ['We have to be smart. The tax bill matters.'],
  'iv.a.money.2': ['The owner and I are on the same page.'],
  'iv.a.money.3': ['That is between me and the owner.'],
  'iv.q.series': ['Can the {team} beat the {opp}?', 'Do you think the {team} can get past the {opp}?', 'Are the {team} ready for the {opp} in this series?', 'How do the {team} match up against the {opp}?'],
  'iv.a.series.0': ['We will win this series. I am sure of it.'],
  'iv.a.series.1': ['They are a great team. We have a lot of respect for them.'],
  'iv.a.series.2': ['If we play our game, we can beat anyone.'],
  'iv.a.series.3': ['One game at a time.'],
  'iv.q.fans': ['What do you want to say to {team} fans?', 'What is your message to the {team} fans right now?', 'Any words for the {team} fans who have stuck with you?', 'What would you tell {team} supporters this season?'],
  'iv.a.fans.0': ['Thank you. You are the best fans in the league.'],
  'iv.a.fans.1': ['Stay with us. We are building something real.'],
  'iv.a.fans.2': ['Buy your tickets now. This is going to be fun.'],
  'iv.a.fans.3': ['Nothing to add today.'],
  'iv.claim.hit': ['The {abbr} GM said {what} was the goal, and the team delivered.', 'The {abbr} GM called for {what}, and the team got it done.', 'The {abbr} GM promised {what}. The team came through.', 'Back in the spring, the {abbr} GM aimed for {what}. It happened.'],
  'iv.claim.miss': ['The {abbr} GM talked about {what}. It did not happen, and people noticed.', 'The {abbr} GM aimed for {what}. The season ended without it.', 'Remember when the {abbr} GM talked up {what}? It did not come true.', 'The {abbr} GM said {what} was possible. The team fell short.'],
  'fd.iv.beat': ['{team} GM to {outlet}: "{quote}"', '{outlet} quotes the {team} GM: "{quote}"', 'From the {team} GM to {outlet}: "{quote}"', '{team} GM told {outlet}: "{quote}"'],
  'mtg.req.tradeReq': ['{name} ({abbr}) wants to sit down with you about his trade request.', '{name} ({abbr}) asked for a meeting. He wants to talk about his trade request.', 'Knock on the door: {name} ({abbr}) wants five minutes about getting moved.', '{name} ({abbr}) wants to know where his trade request stands. He asked to meet.'],
  'mtg.req.feud': ['{name} ({abbr}) wants to talk to you about the feud in the locker room.', '{name} ({abbr}) asked to meet about the tension with a teammate.', '{name} ({abbr}) wants your help settling things in the locker room.', 'The feud is wearing on {name} ({abbr}). He asked for a sit-down.'],
  'mtg.req.unhappy': ['{name} ({abbr}) is unhappy and asked for a meeting with you.', '{name} ({abbr}) is not happy and wants to talk.', 'Your door is open, and {name} ({abbr}) is walking through it. He is frustrated.', '{name} ({abbr}) asked for a meeting. Something is bothering him.'],
  'mtg.req.rising': ['{name} ({abbr}) asked for a meeting about his role and his future.', '{name} ({abbr}) is playing well and wants to talk about a bigger role.', '{name} ({abbr}) wants to know what the team sees in his future.', 'Breakout season, big questions: {name} ({abbr}) asked to meet.'],
  'prm.kept': ['You kept your promise to {name} ({abbr}): {what}.', 'Promise kept with {name} ({abbr}): {what}.', '{name} ({abbr}) noticed you kept your word: {what}.', 'Your word held up with {name} ({abbr}): {what}.'],
  'prm.broken': ['{name} ({abbr}) says you broke your promise: {what}.', 'Broken promise to {name} ({abbr}): {what}.', '{name} ({abbr}) feels let down. The promise was: {what}.', '{name} ({abbr}) will remember this one. You promised: {what}.']
});

// ===== v29 Draft pipeline lite: college (NCHF) + two international leagues (EABL upper, APBA lower) =====
// Names, codes, conferences, colors, award names, playoff formats and role targets: archive/notes/PIPELINE-SPEC.md (user's data, exact).
// Seasons are simmed in one step right after the Finals (startOffseason -> pipeSeason). Stats only, no games. Results-only playoffs.
const PIPE_LGS = ['NCHF', 'EABL', 'APBA'];
const PIPE_LG = {
  NCHF: { name: 'National Collegiate Hoops Federation', kind: 'college', G: 30, roster: 12 },
  EABL: { name: 'Euro-Atlantic Basketball League', kind: 'upper', G: 33, roster: 12 },
  APBA: { name: 'Asia-Pacific Basketball Association', kind: 'lower', G: 44, roster: 12 }
};
const PIPE_CONF = ['Eastern Seaboard Conference', 'Great Lakes Conference', 'Sunbelt & Heartland Conference', 'Pacific & Mountain Conference'];
// [city, nickname, code, color 1, color 2] (+ conference index for NCHF)
const PIPE_TEAMS = {
  EABL: [['London', 'Monarchs', 'LDN', 'Royal Purple', 'Gold'], ['Madrid', 'Matadors', 'MAD', 'Crimson', 'White'], ['Paris', 'Lumière', 'PAR', 'Navy Blue', 'Champagne'], ['Berlin', 'Ironworks', 'BER', 'Charcoal', 'Electric Orange'],
    ['Milan', 'Vipers', 'MLN', 'Emerald Green', 'Black'], ['Athens', 'Titans', 'ATH', 'Aegean Blue', 'Marble White'], ['Istanbul', 'Bosphorus', 'IST', 'Turquoise', 'Scarlet'], ['Belgrade', 'Wolves', 'BLG', 'Slate Grey', 'Red'],
    ['Munich', 'Brewers', 'MUN', 'Cobalt Blue', 'Silver'], ['Barcelona', 'Dragons', 'BCN', 'Maroon', 'Amber'], ['Kaunas', 'Foresters', 'KAU', 'Forest Green', 'White'], ['Tel Aviv', 'Maccabees', 'TLV', 'Royal Blue', 'Yellow']],
  APBA: [['Tokyo', 'Shoguns', 'TYO', 'Vermilion', 'Obsidian Black'], ['Manila', 'Islanders', 'MNI', 'Sapphire Blue', 'Sun Yellow'], ['Seoul', 'Tigers', 'SEL', 'Burnt Orange', 'Black'], ['Sydney', 'Harbourmen', 'SYD', 'Teal', 'Navy Blue'],
    ['Taipei', 'Skyhawks', 'TPS', 'Sky Blue', 'White'], ['Melbourne', 'Southern Cross', 'MEL', 'Midnight Blue', 'Silver'], ['Beijing', 'Emperors', 'PEK', 'Imperial Red', 'Gold'], ['Jakarta', 'Garudas', 'JKG', 'Olive Green', 'Bronze'],
    ['Auckland', 'Kiwis', 'AKL', 'Black', 'Fern Green'], ['Singapore', 'Merlions', 'SGP', 'Coral Red', 'White'], ['Bangkok', 'Thunder', 'BKT', 'Saffron', 'Indigo'], ['Osaka', 'Samurai', 'OSA', 'Crimson', 'Charcoal']],
  NCHF: [['Boston', 'Harborhawks', 'BHH', 'Navy Blue', 'Seafoam', 0], ['Philadelphia', 'Liberty', 'PHL', 'Colonial Blue', 'Buff', 0], ['Charlotte', 'Stingers', 'CLT', 'Teal', 'Purple', 0], ['Atlanta', 'Peaches', 'ATP', 'Peach', 'Forest Green', 0],
    ['Chicago', 'Wind', 'CWD', 'Ice Blue', 'Black', 1], ['Detroit', 'Motormen', 'DTM', 'Rust Red', 'Steel Grey', 1], ['Columbus', 'Pilots', 'CMH', 'Scarlet', 'Cream', 1], ['Minneapolis', 'Loons', 'MSP', 'Royal Blue', 'Frost White', 1],
    ['Dallas', 'Wranglers', 'DWR', 'Burnt Sienna', 'Denim Blue', 2], ['Austin', 'Armadillos', 'AUS', 'Terracotta', 'Sage Green', 2], ['Nashville', 'Troubadours', 'BNA', 'Gold', 'Midnight Black', 2], ['St. Louis', 'Archers', 'STL', 'Cardinal Red', 'Silver', 2],
    ['Seattle', 'Cascades', 'SEA', 'Evergreen', 'Slate', 3], ['Denver', 'Summit', 'DSU', 'Mountain Purple', 'Gold', 3], ['Phoenix', 'Scorpions', 'PSC', 'Sunset Orange', 'Sand', 3], ['San Diego', 'Surfers', 'SAN', 'Ocean Blue', 'Yellow', 3]]
};
// Award names (spec). NCHF conference awards are stored with c: conference index.
const PIPE_AW = {
  NCHF: { champ: 'The Founders Cup', poy: 'National Player of the Year (The Sterling-Vance Trophy)', foy: 'National Freshman of the Year (The Redshirt-to-Star Award)', dpoy: 'National Defensive Player of the Year (The Iron Rim Trophy)', sixth: 'Sixth Man of the Year (The Sparkplug Award)',
    all1: 'All-NCHF First Team', all2: 'All-NCHF Second Team', allFr: 'NCHF All-Freshman Team', allDef: 'NCHF All-Defensive Team', cpoy: 'Conference Player of the Year', cfoy: 'Freshman of the Year', call1: 'All-Conference First Team', call2: 'All-Conference Second Team' },
  EABL: { champ: 'The EABL Crown', mvp: 'EABL Season MVP', def: 'EABL Best Defender', rising: 'EABL Rising Star', scorer: 'Top Scorer: The Golden Net Trophy', all1: 'All-EABL First Team', allDef: 'EABL All-Defensive Team' },
  APBA: { champ: 'The Pacific Rim Shield', mvp: 'APBA Most Valuable Player', fmvp: 'Pacific Rim Shield Finals MVP', dpoy: 'APBA Defensive Player of the Year', sixth: 'APBA Best Sixth Man', roy: 'APBA Rookie of the Year', all1: 'All-APBA First Team', allDef: 'APBA All-Defensive Team' }
};
// Achievements (labels: Haiku may reword, HAIKU-TASKS.md). Stored like awards: p.preAw {s, lg, a}.
const PIPE_ACH = { pts: 'Scoring leader', reb: 'Rebounding leader', ast: 'Assists leader', c1k: '1,000-point college career', c2k: '2,000-point college career', td: 'Triple-double season' };
// Hall of Fame weight of pre-draft honors (small; legacyScore, career only)
const PIPE_HOF = { poy: 15, mvp: 10, foy: 4, dpoy: 4, def: 4, fmvp: 4, all1: 5, all2: 3, champ: 3, cpoy: 2, rising: 2, roy: 2, scorer: 2, sixth: 1, allFr: 1, allDef: 1, cfoy: 1, call1: 1, call2: 0.5, c1k: 2, c2k: 4, td: 2, pts: 1, reb: 1, ast: 1 };
const PIPE_FX = { mix: [0.70, 0.25, 0.05], intlYrs: [40, 35, 25], faCut: 60, euroOvr: 48, euroImp: 4, asiaImp: 2, stockMax: 3, stockCap: 6, callMin: 45, buyK: 0.05 };
// real 2027 class (NBA mode): clubs outside the NCAA
const PIPE_INTL_SCHOOL = { 'Baskonia': 'EABL', 'Cedevita Olimpija': 'EABL', 'Nanterre': 'EABL', 'Trento': 'EABL', 'South East Melbourne': 'APBA' };
const PIPE_CNT = { callAI: 0, callYou: 0, buyouts: 0, signs: 0 };
function pipeTeam(lg, i) { const r = (PIPE_TEAMS[lg] || [])[i]; return r ? { lg, i, city: r[0], name: r[1], abbr: r[2], c1: r[3], c2: r[4], conf: r[5] != null ? r[5] : null, full: r[0] + ' ' + r[1] } : null; }
function pipeTeamName(lg, i) { const t = pipeTeam(lg, i); return t ? t.full : ''; }
// school / club label for a player (draft board column, player page)
function pipeLabel(L, p) {
  if (!p) return ''; if (p.school) return p.school;
  if (p.pl && p.pt != null) return pipeTeamName(p.pl, p.pt);
  if (p.club) return pipeTeamName(p.club.lg, p.club.t);
  return p.src === 'o' ? 'No team' : '';
}
// college years by draft age (NBA-like: top-10 talents are mostly one-and-done)
const PIPE_YRS_BY_AGE = { 18: [1, 0, 0, 0], 19: [95, 5, 0, 0], 20: [60, 35, 5, 0], 21: [25, 50, 20, 5], 22: [10, 40, 32, 18], 23: [2, 18, 30, 50], 24: [0, 8, 25, 67] };
function pipeColYrs(p) {
  const da = clamp(p.dAge || 21, 18, 24);
  if (p.tier === 'gen' || (p.tier === 'top' && da <= 21)) return da <= 21 ? 1 : 2;
  return wpick([1, 2, 3, 4], PIPE_YRS_BY_AGE[da]);
}
// a team for a prospect: the one with the fewest committed prospects over his seasons there
function pipeLoads(L) {
  const c = {}; for (const lg of PIPE_LGS) c[lg] = PIPE_TEAMS[lg].map(() => ({}));
  for (const d in L.classes) for (const id of L.classes[d]) { const p = L.players[id]; if (!p || !p.pl || p.pt == null) continue; for (let s = p.pFrom; s <= p.draftYear; s++) c[p.pl][p.pt][s] = (c[p.pl][p.pt][s] || 0) + 1; }
  return c;
}
function pipePlace(L, p, lg, from, loads, fixed) {
  p.pl = lg; p.pFrom = from;
  const cl = loads[lg], load = i => { let m = 0; for (let s = from; s <= p.draftYear; s++) m = Math.max(m, cl[i][s] || 0); return m; };
  p.pt = fixed != null ? fixed : cl.map((_, i) => i).sort((a, b) => load(a) - load(b) || R() - 0.5)[0];
  for (let s = from; s <= p.draftYear; s++) cl[p.pt][s] = (cl[p.pt][s] || 0) + 1;
}
// P1 + P2: sources for a class. Exact quotas: 70% college / 25% international / 5% other (real 2027 players: from their school).
function pipeAssignClass(L, d, ids, force) {
  const ps = (ids || L.classes[d] || []).map(id => L.players[id]).filter(p => p && p.prospect && (force || !p.src));
  if (!ps.length) return;
  const loads = pipeLoads(L), n = (L.classes[d] || ids).length;
  for (const p of ps) { delete p.src; delete p.pl; delete p.pt; delete p.pFrom; delete p.yrsCol; delete p.yrsIntl; }
  const real = ps.filter(p => p.school), gen = ps.filter(p => !p.school);
  for (const p of real) {
    const ilg = PIPE_INTL_SCHOOL[p.school], da = p.dAge || 20;
    if (ilg) { p.src = 'i'; p.yrsIntl = da <= 19 ? 1 : 2; pipePlace(L, p, ilg, d - p.yrsIntl + 1, loads, flHash(p.school) % 12); }
    else { p.src = 'c'; p.yrsCol = clamp(da - 18, 1, 4); pipePlace(L, p, 'NCHF', d - p.yrsCol + 1, loads, flHash(p.school) % 16); }
  }
  const have = { c: 0, i: 0, o: 0 }; for (const id of L.classes[d] || ids) { const p = L.players[id]; if (p && p.src && !gen.includes(p)) have[p.src]++; }
  const want = { c: Math.round(n * PIPE_FX.mix[0]), i: Math.round(n * PIPE_FX.mix[1]) }; want.o = n - want.c - want.i;
  const bag = []; for (const k of ['c', 'i', 'o']) for (let j = have[k]; j < want[k]; j++) bag.push(k);
  while (bag.length < gen.length) bag.push('c');
  for (let j = bag.length - 1; j > 0; j--) { const k = Math.floor(R() * (j + 1)); [bag[j], bag[k]] = [bag[k], bag[j]]; }
  gen.forEach((p, j) => {
    const s = p.src = bag[j];
    if (s === 'c') { p.yrsCol = pipeColYrs(p); pipePlace(L, p, 'NCHF', d - p.yrsCol + 1, loads); }
    else if (s === 'i') { p.yrsIntl = wpick([1, 2, 3], PIPE_FX.intlYrs); const up = p.tier === 'gen' || p.tier === 'top' || p.pot >= 72; pipePlace(L, p, up ? 'EABL' : 'APBA', d - p.yrsIntl + 1, loads); }
  });
}
// class year label for a college player in season s (1 = freshman)
function pipeYear(p, s) { return p.pFrom != null ? s - p.pFrom + 1 : null; }
const PIPE_YR_LABEL = ['', 'Freshman', 'Sophomore', 'Junior', 'Senior'];
// ---- league state ----
function pipeInit(L) {
  if (L.pipe && L.pipe.lg) return L.pipe;
  L.pipe = { s: null, lg: {} }; for (const lg of PIPE_LGS) L.pipe.lg[lg] = { t: PIPE_TEAMS[lg].map(() => ({ f: [] })), res: null };
  L.pipeHist = L.pipeHist || {};
  return L.pipe;
}
let PIPE_NAMES = null;
function pipeFiller(L, lg, fresh) {
  const used = PIPE_NAMES || (PIPE_NAMES = new Set());
  const n = genName(used), p = rint(0, 4);
  if (lg === 'NCHF') { const y = fresh ? 1 : rint(1, 4); return { f: 1, n, p, y, a: 17 + y + rint(0, 1), o: Math.round(clamp(gauss(33, 5) + (y - 1) * 1.5, 20, 48)) }; }
  if (lg === 'EABL') return { f: 1, n, p, y: fresh ? 1 : rint(1, 8), a: rint(21, 33), o: Math.round(clamp(gauss(46, 4), 37, 56)) };
  return { f: 1, n, p, y: fresh ? 1 : rint(1, 6), a: rint(19, 32), o: Math.round(clamp(gauss(38, 4), 29, 48)) };
}
// real players on each team this season: prospects (by p.pl / p.pt and years) and pros on an international club (p.club)
function pipeRosters(L, s) {
  const R0 = {}; for (const lg of PIPE_LGS) R0[lg] = PIPE_TEAMS[lg].map(() => []);
  for (const d in L.classes) for (const id of L.classes[d]) { const p = L.players[id]; if (p && p.prospect && p.pl && p.pt != null && p.pFrom <= s && s <= p.draftYear) R0[p.pl][p.pt].push(p); }
  for (const p of Object.values(L.players)) if (p.club && p.club.s === s && !p.retired && !p.prospect) R0[p.club.lg][p.club.t].push(p);
  return R0;
}
// Start of a season (startNewSeason, new league, old save): age fillers, place unsigned free agents on clubs, fill rosters.
function pipeBuild(L) {
  const P = pipeInit(L), s = L.season; if (P.s === s) return;
  PIPE_NAMES = new Set(usedNames(L));
  const first = P.s == null;
  for (const lg of PIPE_LGS) for (const tm of P.lg[lg].t) {
    if (!first) tm.f = tm.f.filter(f => { f.a++; f.y++; delete f.ln; delete f.r;
      if (lg === 'NCHF') { f.o = Math.round(clamp(f.o + gauss(2, 1.5), 15, 58)); return f.y <= 4; }
      f.o = Math.round(clamp(f.o + (f.a <= 26 ? gauss(1, 1) : f.a >= 31 ? gauss(-1, 1) : gauss(0, 1)), 25, 60)); return f.a < 35 && R() > 0.1; });
    tm.w = tm.l = tm.cw = tm.cl = 0;
  }
  // P3: free agents below the cut get a club (still signable in free agency)
  const fa = L.fa.map(id => L.players[id]).filter(p => p && !p.retired && !p.prospect && !p.tw && p.ovr < PIPE_FX.faCut && !(p.injury > 40)).concat(Object.values(L.players).filter(p => p.abroad && !p.retired)).sort((a, b) => b.ovr - a.ovr);   // v31: players abroad always get a club
  const imp = { EABL: PIPE_TEAMS.EABL.map(() => 0), APBA: PIPE_TEAMS.APBA.map(() => 0) }, cap = { EABL: PIPE_FX.euroImp, APBA: PIPE_FX.asiaImp }, news = [], abNews = [];
  for (const p of fa) {
    const pref = p.age >= 30 || p.ovr >= PIPE_FX.euroOvr ? ['EABL', 'APBA'] : ['APBA', 'EABL'];
    let done = false;
    for (const lg of pref) { const c = imp[lg], i = c.map((v, k) => k).filter(k => c[k] < cap[lg]).sort((a, b) => c[a] - c[b] || R() - 0.5)[0]; if (i == null) continue;
      const old = p.club; p.club = { lg, t: i, s }; c[i]++; done = true; PIPE_CNT.signs++;
      if (!(old && old.lg === lg && old.t === i && old.s === s - 1)) { (p.tx = p.tx || []).push({ s, t: `Signed with ${pipeTeamName(lg, i)} (${lg})` }); if (p.ovr >= 54 || (p.fame || 0) >= 40) news.push(p); }
      break; }
    if (!done && p.abroad) { const lg = pref[0], c = imp[lg], i = c.map((v, k) => k).sort((a, b) => c[a] - c[b] || R() - 0.5)[0]; p.club = { lg, t: i, s }; c[i]++; done = true; (p.tx = p.tx || []).push({ s, t: `Signed with ${pipeTeamName(lg, i)} (${lg})` }); }   // v31: clubs full: least loaded team anyway
    if (!done) delete p.club;
    if (p.abroad && p.abroadNew && p.club) {   // v31: first season overseas: transaction line (the club line above is replaced) and news for notable players
      p.abroadNew = 0; delete p.abroadNew; const tx = p.tx; for (let k = tx.length - 1; k >= 0 && k >= tx.length - 2; k--) if (tx[k].s === s && /^Signed with /.test(tx[k].t)) { tx.splice(k, 1); break; }
      tx.push({ s, t: `Went overseas: signed with ${pipeTeamName(p.club.lg, p.club.t)} (${p.club.lg})` });
      if (p.ovr >= ABROAD.newsOvr || p.draft) abNews.push(p);
    }
  }
  for (const p of abNews.slice(0, 6)) logNews(L, fl('ab.go', { name: p.name, age: p.age, club: pipeTeamName(p.club.lg, p.club.t), lg: p.club.lg, ovr: p.ovr }, p.id), null, 'tx', 'pipe');
  for (const p of news.slice(0, 3)) logNews(L, fl('pp.sign', { name: p.name, club: pipeTeamName(p.club.lg, p.club.t), lg: p.club.lg, ovr: p.ovr }, p.id), null, 'tx', 'pipe');
  for (const p of Object.values(L.players)) if (p.club && p.club.s !== s) delete p.club;
  // fill every roster with non-prospect players (walk-ons, local pros)
  const ros = pipeRosters(L, s);
  for (const lg of PIPE_LGS) P.lg[lg].t.forEach((tm, i) => { const need = PIPE_LG[lg].roster - ros[lg][i].length; while (tm.f.length > Math.max(0, need) && tm.f.length) tm.f.splice(tm.f.reduce((m, f, k, a) => f.o < a[m].o ? k : m, 0), 1); while (tm.f.length < need) tm.f.push(pipeFiller(L, lg, !first)); });
  P.s = s; PIPE_NAMES = null;
}
// win chance between two team strengths
function pipeWin(a, b) { return 1 / (1 + Math.exp(-(a - b) / 3.2)); }
function pipeGame(st, a, b) { return R() < pipeWin(st[a], st[b]) ? a : b; }
function pipeSeries(st, a, b, need) { let x = 0, y = 0; while (x < need && y < need) { if (pipeGame(st, a, b) === a) x++; else y++; } return { a, b, w: x > y ? a : b, sc: [x, y] }; }
// role ladder for one team (sorted best first). Returns role keys.
function pipeRolesFor(lg, list) {
  if (lg === 'NCHF') return list.map((r, k) => k === 0 ? 'all1' : k === 1 ? 'second' : k <= 4 ? 'starter' : k === 5 ? 'sixth' : k <= 8 ? 'bench' : 'walkon');
  if (lg === 'EABL') return list.map((r, k) => k === 0 ? 'all1' : k <= 2 ? 'high' : k <= 4 ? 'avg' : k <= 6 ? 'sixth' : 'deep');
  let loc = 0; return list.map(r => { if (r.imp) return 'imp'; const k = loc++; return k === 0 ? 'domstar' : k <= 3 ? 'domstart' : k <= 6 ? 'bench' : 'end'; });
}
const pipeRef = r => r.p ? { id: r.p.id, n: r.p.name, t: r.t } : { n: r.x.n, t: r.t };
// P3/P4/P6/P10: sim one pipeline season for all three leagues (after the Finals)
function pipeSeason(L) {
  const t0 = Date.now(), S = L.season;
  pipeInit(L); if (L.pipe.s !== S) pipeBuild(L);
  const P = L.pipe, ros = pipeRosters(L, S), H = L.pipeHist[S] = {}, all = [];
  for (const lg of PIPE_LGS) {
    const G = PIPE_LG[lg].G, nT = PIPE_TEAMS[lg].length, tms = P.lg[lg].t;
    // rosters: real players + fillers, value = true rating (+ pecking-order noise)
    const teams = tms.map((tm, i) => {
      const rows = ros[lg][i].map(p => ({ p, x: p, t: i, v: p.ovr, imp: lg === 'APBA' && !p.prospect })).concat(tm.f.map(f => ({ x: f, t: i, v: f.o, f })));
      rows.forEach(r => r.rk = r.v + gauss(0, PIPE_SIM.RANK_SD));
      rows.sort((a, b) => (lg === 'APBA' ? (b.imp - a.imp) * 1000 : 0) + b.rk - a.rk);   // APBA: imports first (they get the import roles)
      const roles = pipeRolesFor(lg, rows); rows.forEach((r, k) => { r.role = roles[k]; r.ord = k; });
      const top = rows.map(r => r.v).sort((a, b) => b - a).slice(0, 8);
      return { i, rows, str: top.reduce((a, b) => a + b, 0) / Math.max(1, top.length), w: 0, l: 0, cw: 0, cl: 0 };
    });
    // league stars: the best team leaders get the top role
    const nTop = lg === 'NCHF' ? 3 : 2, key = lg === 'APBA' ? 'imp' : 'all1';
    teams.flatMap(t => t.rows.filter(r => r.role === key)).sort((a, b) => b.rk - a.rk).slice(0, nTop).forEach(r => r.role = lg === 'NCHF' ? 'poy' : 'mvp');
    // standings: results only
    const st = teams.map(t => t.str), conf = i => lg === 'NCHF' ? PIPE_TEAMS.NCHF[i][5] : 0;
    const play = (a, b) => { const w = pipeGame(st, a, b), l = w === a ? b : a; teams[w].w++; teams[l].l++; if (lg === 'NCHF' && conf(a) === conf(b)) { teams[w].cw++; teams[l].cl++; } };
    if (lg === 'NCHF') {
      for (let a = 0; a < nT; a++) for (let b = a + 1; b < nT; b++) if (conf(a) === conf(b)) for (let k = 0; k < 3; k++) play(a, b);
      for (let r = 0; r < G - 9; r++) { const o = [...Array(nT).keys()].sort(() => R() - 0.5); for (let k = 0; k < nT; k += 2) play(o[k], o[k + 1]); }
    } else { const reps = Math.round(G / (nT - 1)); for (let k = 0; k < reps; k++) for (let a = 0; a < nT; a++) for (let b = a + 1; b < nT; b++) play(a, b); }
    { const cr = typeof careerPipeRec === 'function' ? careerPipeRec(L, lg) : null;   // My Career: his team's record matches his games (wins moved to / from other teams)
      if (cr) { const me = teams[cr.t]; let d = cr.w - me.w; const others = teams.filter(t => t !== me);
        for (let it = 0; d !== 0 && it < 400; it++) { const o = others[rint(0, others.length - 1)]; if (d > 0 && o.w > 0 && me.l > 0) { o.w--; o.l++; me.w++; me.l--; d--; } else if (d < 0 && o.l > 0 && me.w > 0) { o.w++; o.l--; me.w--; me.l++; d++; } } } }
    const gT = teams[0].w + teams[0].l;
    const rank = teams.slice().sort((a, b) => b.w - a.w || b.str - a.str).map(t => t.i);
    // lines
    const rows = teams.flatMap(t => t.rows);
    rows.forEach(r => { const out = r.p && r.p.club && r.p.club.out != null && r.p.club.s === S ? r.p.club.out : 1; const miss = R() < 0.15 ? rint(1, Math.round(gT * 0.4)) : rint(0, 2); r.gp = Math.max(0, Math.round((gT - miss) * out)); });
    const lines = pipeLines(lg, rows);
    if (typeof careerPipeLine === 'function') rows.forEach((r, k) => { const c = r.p && r.p.career ? careerPipeLine(L, r.p, lg) : null; if (c) { lines[k] = c; r.gp = c.gp; } });   // My Career: his real games
    rows.forEach((r, k) => { r.ln = lines[k]; r.val = pipeVal(r.ln); r.wp = teams[r.t].w / Math.max(1, gT); });
    // playoffs (results only)
    let po = [], champ, ru, fmvp = null;
    if (lg === 'EABL') { const [a, b, c, d] = rank; const s1 = pipeSeries(st, a, d, 1), s2 = pipeSeries(st, b, c, 1), f = pipeSeries(st, s1.w, s2.w, 1); po = [{ r: 'Semifinal', ...s1 }, { r: 'Semifinal', ...s2 }, { r: 'Final', ...f }]; champ = f.w; ru = f.w === f.a ? f.b : f.a; }
    else if (lg === 'APBA') { const [a, b, c, d] = rank; const s1 = pipeSeries(st, a, d, 2), s2 = pipeSeries(st, b, c, 2), f = pipeSeries(st, s1.w, s2.w, 3); po = [{ r: 'Semifinal', ...s1 }, { r: 'Semifinal', ...s2 }, { r: 'Finals', ...f }]; champ = f.w; ru = f.w === f.a ? f.b : f.a; }
    else {
      const cc = [0, 1, 2, 3].map(c => teams.filter(t => conf(t.i) === c).sort((a, b) => b.cw - a.cw || b.w - a.w || b.str - a.str)[0].i);
      const field = cc.concat(rank.filter(i => !cc.includes(i)).slice(0, 4)).sort((a, b) => teams[b].w - teams[a].w || teams[b].str - teams[a].str);
      const qf = [[0, 7], [3, 4], [1, 6], [2, 5]].map(([x, y]) => pipeSeries(st, field[x], field[y], 1));
      const sf = [pipeSeries(st, qf[0].w, qf[1].w, 1), pipeSeries(st, qf[2].w, qf[3].w, 1)], f = pipeSeries(st, sf[0].w, sf[1].w, 1);
      po = [...qf.map(x => ({ r: 'Quarterfinal', ...x })), ...sf.map(x => ({ r: 'Semifinal', ...x })), { r: 'Final', ...f }]; champ = f.w; ru = f.w === f.a ? f.b : f.a;
      P.lg[lg].seeds = field; P.lg[lg].confCh = cc;
    }
    // awards
    const q = rows.filter(r => r.gp >= gT * 0.6), noise = () => gauss(0, 0.8);
    const sc = r => r.val * Math.sqrt(r.gp / gT) + 6 * (r.wp - 0.5) + noise();
    const ds = r => 2.2 * r.ln.stl + 2.0 * r.ln.blk + (r.p ? ((r.p.per || 50) + (r.p.pdf || 50) - 100) / 12 : 0) + noise();
    const best = (list, f, n) => list.map(r => [r, f(r)]).sort((a, b) => b[1] - a[1]).slice(0, n).map(x => x[0]);
    const A = {}, give = (r, k, c) => { if (r && r.p) { (r.p.preAw = r.p.preAw || []).push(c != null ? { s: S, lg, a: PIPE_AW[lg][k], c } : { s: S, lg, a: PIPE_AW[lg][k] }); } };
    const one = (k, list, f) => { const r = best(list, f, 1)[0]; if (r) { A[k] = pipeRef(r); give(r, k); } return r; };
    const team = (k, list, f, n, skip) => { const rs = best(list.filter(r => !(skip || []).includes(r)), f, n); A[k] = rs.map(pipeRef); rs.forEach(r => give(r, k)); return rs; };
    const fresh = r => lg === 'NCHF' && (r.p ? pipeYear(r.p, S) === 1 : r.x.y === 1);
    if (lg === 'NCHF') {
      one('poy', q, sc); one('foy', q.filter(fresh), sc); one('dpoy', q, ds); one('sixth', q.filter(r => r.role === 'sixth'), sc);
      const a1 = team('all1', q, sc, 5); team('all2', q, sc, 5, a1); team('allFr', q.filter(fresh), sc, 5); team('allDef', q, ds, 5);
      A.conf = [0, 1, 2, 3].map(c => { const cq = q.filter(r => conf(r.t) === c), o = {};
        const pr = best(cq, sc, 1)[0], fr = best(cq.filter(fresh), sc, 1)[0], c1 = best(cq, sc, 5), c2 = best(cq.filter(r => !c1.includes(r)), sc, 5);
        if (pr) { o.poy = pipeRef(pr); give(pr, 'cpoy', c); } if (fr) { o.foy = pipeRef(fr); give(fr, 'cfoy', c); }
        o.all1 = c1.map(pipeRef); c1.forEach(r => give(r, 'call1', c)); o.all2 = c2.map(pipeRef); c2.forEach(r => give(r, 'call2', c)); return o; });
    } else if (lg === 'EABL') {
      one('mvp', q, sc); one('def', q, ds); one('rising', q.filter(r => (r.p ? r.p.age : r.x.a) < 22), sc); one('scorer', q, r => r.ln.pts);
      team('all1', q, sc, 5); team('allDef', q, ds, 5);
    } else {
      one('mvp', q, sc); one('dpoy', q, ds); one('sixth', q.filter(r => r.role === 'bench' && r.ord <= 6), sc);
      one('roy', q.filter(r => !r.imp && (r.p ? r.p.pFrom === S : r.x.y === 1)), sc);
      team('all1', q, sc, 5); team('allDef', q, ds, 5);
      fmvp = best(rows.filter(r => r.t === champ && r.gp > 0), r => r.val + gauss(0, 1.5), 1)[0]; if (fmvp) { A.fmvp = pipeRef(fmvp); give(fmvp, 'fmvp'); }
    }
    for (const r of rows) if (r.t === champ && r.gp > 0) give(r, 'champ');
    // stat leaders (achievements)
    const lead = {};
    for (const k of ['pts', 'reb', 'ast', 'stl', 'blk']) lead[k] = best(q, r => r.ln[k], 5).map(r => ({ ...pipeRef(r), v: r.ln[k] }));
    for (const k of ['pts', 'reb', 'ast']) { const r = best(q, x => x.ln[k], 1)[0]; if (r && r.p && !(r.p.preAw || []).some(a => a.s === S && a.lg === lg && a.a === PIPE_ACH[k])) (r.p.preAw = r.p.preAw || []).push({ s: S, lg, a: PIPE_ACH[k] }); }
    // P9: one line per season on the player (prospects keep all; pros on clubs keep the current one only)
    for (const r of rows) {
      const ln = Object.assign({ s: S, lg, tid: r.t }, r.ln); if (r.p && !r.p.prospect) ln.x = 1;
      if (r.p) { if (r.gp <= 0) continue; const p = r.p; p.pre = (p.pre || []).filter(h => !(ln.x && h.x)); p.pre.push(ln); p.pRole = r.role;
        if (ln.pts >= 10 && ln.reb >= 10 && ln.ast >= 10) (p.preAw = p.preAw || []).push({ s: S, lg, a: PIPE_ACH.td });
        if (lg === 'NCHF') { const tot = p.pre.filter(h => h.lg === 'NCHF').reduce((a, h) => a + h.pts * h.gp, 0), has = a => (p.preAw || []).some(x => x.a === a);
          if (tot >= 1000 && !has(PIPE_ACH.c1k)) p.preAw = (p.preAw || []).concat({ s: S, lg, a: PIPE_ACH.c1k }); if (tot >= 2000 && !has(PIPE_ACH.c2k)) p.preAw = (p.preAw || []).concat({ s: S, lg, a: PIPE_ACH.c2k }); } }
      else { r.x.ln = ln; r.x.r = r.role; }
    }
    tms.forEach((tm, i) => { tm.w = teams[i].w; tm.l = teams[i].l; tm.cw = teams[i].cw; tm.cl = teams[i].cl; tm.str = r1(teams[i].str); });
    P.lg[lg].res = { s: S, st: rank.map(i => [i, teams[i].w, teams[i].l, teams[i].cw, teams[i].cl]), po: po.map(x => ({ r: x.r, a: x.a, b: x.b, w: x.w, sc: x.sc })), champ, ru, aw: A, lead };
    H[lg] = { ch: champ, ru, aw: A };
    all.push(...rows.map(r => Object.assign(r, { lg })));
    // news
    const ct = pipeTeam(lg, champ), rt = pipeTeam(lg, ru), fin = po[po.length - 1];
    logNews(L, fl('pp.champ.' + lg, { cup: PIPE_AW[lg].champ, team: ct.full, ru: rt.full, sc: fin.sc[0] + '-' + fin.sc[1], mvp: A.fmvp ? A.fmvp.n : '' }, S * 7 + champ), null, 'league', 'pipe');
    const topK = lg === 'NCHF' ? 'poy' : 'mvp', tw = A[topK];
    if (tw) { logNews(L, fl('pp.award', { award: PIPE_AW[lg][topK], name: tw.n, team: pipeTeamName(lg, tw.t) }, S * 3 + tw.t), null, 'award', 'pipe');
      try { addPost(L, 'pipe', 'nat', 'calm', { award: PIPE_AW[lg][topK], name: tw.n, team: pipeTeamName(lg, tw.t), lg }, { key: 'fd.pipe.award', pid: tw.id != null ? tw.id : null, size: lg === 'NCHF' ? 1.2 : 0.8 }); } catch (e) { } }
  }
  pipeStock(L, all);
  P.ms = Date.now() - t0;
  return P.ms;
}
// P5: stats move scouting. Production vs what scouts expected from their read of his current level (residual z) shifts the
// scouts' ceiling read a little (max 3 a season, 6 total); mock drafts and boards follow p.scout.
function pipeStock(L, rows) {
  const S = L.season, out = [];
  for (const lg of PIPE_LGS) {
    const rs = rows.filter(r => r.lg === lg && r.p && r.p.prospect && r.gp > 0); if (rs.length < 6) continue;
    const xs = rs.map(r => ovrRead(L, null, r.p)), ys = rs.map(r => r.val), n = rs.length, mx = xs.reduce((a, b) => a + b, 0) / n, my = ys.reduce((a, b) => a + b, 0) / n;
    let sxy = 0, sxx = 0; for (let i = 0; i < n; i++) { sxy += (xs[i] - mx) * (ys[i] - my); sxx += (xs[i] - mx) ** 2; }
    const b = sxx ? sxy / sxx : 0, a = my - b * mx, res = ys.map((y, i) => y - (a + b * xs[i])), sd = Math.sqrt(res.reduce((s, e) => s + e * e, 0) / n) || 1;
    rs.forEach((r, i) => {
      const p = r.p, z = res[i] / sd; let d = clamp(Math.round(z * 1.4), -PIPE_FX.stockMax, PIPE_FX.stockMax);
      const sum = p.stockSum || 0; d = clamp(d, -PIPE_FX.stockCap - sum, PIPE_FX.stockCap - sum);
      if (d) { p.scout = Math.round(clamp(p.scout + d, p.ovr, 99)); p.stockSum = sum + d; }
      p.stock = { s: S, d, z: r1(z) }; out.push({ p, z, d, r });
    });
  }
  // news: breakouts, stock up / down among the next two drafts, top prospects declaring
  const near = out.filter(o => o.p.draftYear <= S + 1);
  const mk = d => { try { return mockSet(L, d).consRank; } catch (e) { return {}; } }, m0 = mk(S), m1 = mk(S + 1), mr = p => (p.draftYear === S ? m0 : m1)[p.id] || 99;
  const lbl = o => pipeTeamName(o.r.lg, o.r.t);
  near.filter(o => o.z >= 2).sort((a, b) => b.z - a.z).slice(0, 2).forEach(o => logNews(L, fl('pp.breakout', { name: o.p.name, team: lbl(o), lg: o.r.lg, pts: o.r.ln.pts, reb: o.r.ln.reb, ast: o.r.ln.ast }, o.p.id), null, 'draft', 'pipe'));
  near.filter(o => o.d >= 2 && mr(o.p) <= 30 && o.z < 2).sort((a, b) => b.z - a.z).slice(0, 2).forEach(o => logNews(L, fl('pp.stockUp', { name: o.p.name, team: lbl(o), pts: o.r.ln.pts }, o.p.id), null, 'draft', 'pipe'));
  near.filter(o => o.d <= -2 && mr(o.p) <= 30).sort((a, b) => a.z - b.z).slice(0, 2).forEach(o => logNews(L, fl('pp.stockDown', { name: o.p.name, team: lbl(o), pts: o.r.ln.pts }, o.p.id), null, 'draft', 'pipe'));
  out.filter(o => o.p.draftYear === S && o.r.lg === 'NCHF' && mr(o.p) <= 10).sort((a, b) => mr(a.p) - mr(b.p)).slice(0, 5)
    .forEach(o => logNews(L, fl('pp.declare', { name: o.p.name, team: lbl(o), yr: (PIPE_YR_LABEL[pipeYear(o.p, S)] || '').toLowerCase(), draft: draftLabel(S) }, o.p.id), null, 'draft', 'pipe'));
}
// P8: leaving a club in season. EABL clubs get a buyout from the signing team (team cash, t.fin.intlBuy); APBA players leave free.
function pipeBuyout(L, p) { return p && p.club && p.club.lg === 'EABL' ? r1(clamp(0.3 + Math.max(0, p.ovr - 45) * PIPE_FX.buyK, 0.3, 1.5)) : 0; }
function pipeOnClub(L, p) { return !!(p && p.club && p.club.s === L.season && p.club.out == null && L.phase === 'regular'); }
function pipeLeave(L, p, tid) {
  if (!pipeOnClub(L, p)) return 0;
  const cost = pipeBuyout(L, p), t = L.teams[tid]; p.club.out = clamp(L.day / Math.max(1, totalDays(L)), 0, 1);
  if (t && cost) { if (!t.fin) initFinance(L, t); t.fin.intlBuy = r1((t.fin.intlBuy || 0) + cost); PIPE_CNT.buyouts++; }
  if (t) logNews(L, fl('pp.callup', { team: t.city + ' ' + t.name, abbr: t.abbr, name: p.name, club: pipeTeamName(p.club.lg, p.club.t), lg: p.club.lg, cost: cost ? money(cost) : 'no', buy: cost ? money(cost) + ' buyout' : 'no buyout' }, p.id), tid, 'tx', 'pipe');   // v29 check: full team name + {buy} phrase (was abbr / 'no' -> "The DEN", "Buyout: no")
  return cost;
}
// players you (or AI teams) could call up now
function pipeCallable(L) { return L.phase !== 'regular' ? [] : L.fa.map(id => L.players[id]).filter(p => p && pipeOnClub(L, p)).sort((a, b) => b.ovr - a.ovr); }
// sign a club player to a minimum deal for the rest of the season (buyout charged in pipeLeave via signContract)
function callUp(L, pid, tid) {
  tid = tid == null ? L.user : tid; const p = L.players[pid], t = L.teams[tid];
  if (!p || !t) return { ok: false, msg: 'No such player.' };
  if (!pipeOnClub(L, p) || !L.fa.includes(p.id)) return { ok: false, msg: 'He is not available for a call-up.' };
  if (t.roster.length >= 15) return { ok: false, msg: 'Your roster is full (15).' };
  const cost = pipeBuyout(L, p);
  signContract(L, p, tid, MINSAL, 1, 'signing', null, { callUp: 1 });
  if (tid === L.user) PIPE_CNT.callYou++; else PIPE_CNT.callAI++;
  return { ok: true, cost, msg: `${p.name} signed for the rest of the season${cost ? ' (buyout ' + money(cost) + ')' : ''}.` };
}
// daily: AI teams hit by injuries call up the best club player once a week
function pipeDay(L) {
  if (L.phase !== 'regular' || !L.pipe || L.day % 7 !== 3) return;
  let n = 0; const pool = pipeCallable(L);
  for (const t of L.teams) {
    if (t.id === L.user || n >= 2 || !pool.length || t.roster.length >= 15) continue;
    const ros = rosterOf(L, t), hurt = ros.filter(p => p.injury >= 10).length, ok = ros.length - hurt;
    if (hurt < 2 || ok >= 13) continue;
    const worst = ros.filter(p => !(p.injury > 0)).reduce((m, p) => Math.min(m, p.ovr), 99), pk = pool.find(p => p.ovr >= Math.max(PIPE_FX.callMin, worst - 3));
    if (!pk) continue;
    const r = callUp(L, pk.id, t.id); if (r.ok) { n++; pool.splice(pool.indexOf(pk), 1); }
  }
}
// P10: Hall of Fame bonus from pre-draft honors (small)
function pipeHofPts(p) { if (!p || !p.preAw || !p.preAw.length) return 0; let v = 0; const rev = {}; for (const lg in PIPE_AW) for (const k in PIPE_AW[lg]) rev[PIPE_AW[lg][k]] = k; for (const k in PIPE_ACH) rev[PIPE_ACH[k]] = k; for (const a of p.preAw) v += PIPE_HOF[rev[a.a]] || 0; return Math.min(40, v); }
// honors grouped for the trophy case "Before the pros": [{a, lg, n, s: [seasons]}]
function preHonors(p) { const m = new Map(); for (const a of p.preAw || []) { const k = a.lg + '|' + a.a + '|' + (a.c != null ? a.c : ''); if (!m.has(k)) m.set(k, { a: a.a, lg: a.lg, c: a.c, n: 0, s: [] }); const x = m.get(k); x.n++; x.s.push(a.s); } return [...m.values()]; }
// After the draft: undrafted players keep only their last line (P9); honors stay for good (P10).
function pipeAfterDraft(L, ids) { for (const id of ids) { const p = L.players[id]; if (p && p.pre && p.pre.length > 1) p.pre = p.pre.slice(-1); } }
// old saves and new leagues: 4 classes ahead, sources for existing prospects, rosters for this season
function pipeMigrate(L) {
  L.pipeHist = L.pipeHist || {};
  for (const p of Object.values(L.players)) if (p.wing && typeof p.wing === 'object') { p.mentorBy = p.wing; p.wing = Math.round(p.hgt + 3.5); }   // v29 fix: v28.8 mentor moment overwrote wingspan
  for (const t of L.teams) { const c = t.coach; if (c && c.contract && !isFinite(c.contract.amt)) c.contract.amt = coachAmtFor(L, c, t, c.contract.yrs || 2); }   // ...and the NaN coach pay / contracts it caused
  for (const p of Object.values(L.players)) if (p.contract && !isFinite(p.contract.amt)) p.contract.amt = MINSAL;
  const d0 = nextDraftS(L);
  for (let d = d0; d <= d0 + 3; d++) if (!L.classes[d]) genClass(L, d);
  for (const d in L.classes) pipeAssignClass(L, +d);
  pipeInit(L);
  if (['regular', 'playoffs', 'regular-done', 'season-done'].includes(L.phase) && L.pipe.s !== L.season) pipeBuild(L);
}
// v29 save size check: bytes used by the pipeline (rosters, history, player lines and honors)
function pipeBytes(L) { let n = JSON.stringify(L.pipe || {}).length + JSON.stringify(L.pipeHist || {}).length; for (const p of Object.values(L.players)) { if (p.pre) n += JSON.stringify(p.pre).length + 7; if (p.preAw) n += JSON.stringify(p.preAw).length + 9; if (p.club) n += JSON.stringify(p.club).length + 8; } return n; }
// v29 text (one wording each; Haiku adds variants: archive/notes/HAIKU-TASKS.md)
Object.assign(FLAVOR, {
  'pp.sign': ['{name} ({ovr}) signs with the {club} of the {lg}.', '{name} ({ovr}) has signed with the {club} in the {lg}.', 'Free agent {name} ({ovr}) joins the {club} of the {lg}.', '{name} ({ovr}) takes his talents to the {club} ({lg}).'],
  'pp.champ.NCHF': ['The {team} win {cup}, beating the {ru} in the final.', '{cup} goes to the {team}, winners over the {ru} in the final.', 'College champions: the {team} beat the {ru} to win {cup}.', 'The {team} lift {cup} after beating the {ru} in the final.'],
  'pp.champ.EABL': ['The {team} take {cup}, beating the {ru} in the Final Four final.', 'The {team} claim {cup} after beating the {ru} in the Final Four.', 'Final Four done: the {team} take {cup}, past the {ru}.', 'The {team} win {cup}, edging the {ru} in the final.'],
  'pp.champ.APBA': ['The {team} win {cup}, {sc} over the {ru} in the Finals. Finals MVP: {mvp}.', 'The {team} lift {cup}: {sc} over the {ru} in the Finals. Finals MVP: {mvp}.', 'The {team} win {cup} in the Finals, {sc} over the {ru}. Finals MVP: {mvp}.', 'Finals MVP {mvp} leads the {team} to {cup}, {sc} over the {ru}.'],
  'pp.award': ['{award}: {name} of the {team}.', '{award} goes to {name} of the {team}.', 'The {award} award is won by {name} ({team}).', '{name} of the {team} takes the {award}.'],
  'pp.breakout': ['Breakout season: {name} ({team}, {lg}) put up {pts} points, {reb} rebounds and {ast} assists a game.', 'Breakout: {name} ({team}, {lg}) averaged {pts} points, {reb} rebounds and {ast} assists.', 'A breakout year for {name} ({team}, {lg}): {pts} points, {reb} rebounds, {ast} assists per game.', '{name} ({team}, {lg}) is the season\'s breakout, with {pts} points, {reb} boards and {ast} assists a game.'],
  'pp.stockUp': ['Stock up: {name} ({team}) scored {pts} a game and is rising on draft boards.', 'Stock up: {name} ({team}) is scoring {pts} a game and climbing draft boards.', '{name} ({team}) scored {pts} a game and scouts are raising his grade.', 'Draft stock rising: {name} ({team}) at {pts} points a game.'],
  'pp.stockDown': ['Stock down: {name} ({team}) managed {pts} a game. Scouts are cooling on him.', 'Stock down: {name} ({team}) is at {pts} a game and falling on draft boards.', '{name} ({team}) fell to {pts} a game, and scouts are cooling on him.', 'Draft stock slipping: {name} ({team}) averages {pts} points a game.'],
  'pp.declare': ['{name}, a {yr} with the {team}, declares for the {draft} draft.', '{name}, a {yr} at the {team}, declares for the {draft} draft.', 'The {team} lose {name}, a {yr}, who declares for the {draft} draft.', '{name} ({yr}, {team}) puts his name in for the {draft} draft.'],
  'pp.callup': ['The {team} call up {name} from the {club} ({lg}): {buy}.', 'The {team} call up {name} from the {club} ({lg}), {buy}.', '{name} is called up by the {team} from the {club} ({lg}): {buy}.', 'The {team} bring in {name} from the {club} ({lg}): {buy}.'],
  'fd.pipe.award': ['{award} goes to {name} of the {team}. Keep an eye on him.', '{award} goes to {name} of the {team} ({lg}).', 'The {team}\'s {name} wins the {award} in the {lg}.', 'Honor: {name} of the {team} is the {award}. Keep an eye on him.']
});
if (typeof module !== 'undefined') module.exports = { PIPE_LGS, PIPE_LG, PIPE_CONF, PIPE_TEAMS, PIPE_AW, PIPE_ACH, PIPE_FX, PIPE_CNT, PIPE_YR_LABEL, pipeTeam, pipeTeamName, pipeLabel, pipeYear, pipeAssignClass, pipeBuild, pipeSeason, pipeStock, pipeRosters, pipeBuyout, pipeOnClub, pipeLeave, pipeCallable, callUp, pipeDay, pipeHofPts, preHonors, pipeAfterDraft, pipeMigrate, pipeBytes, finePlayer, fineAmt, fineStr, suspend, suspendPlayer, isSusp, suspGames, discOf, temperOf, lr2Game, posWeek, POS_KINDS, POS_FX, conductPick, drChoicesFor, drSuspGames, IV_OUTLETS, IV_Q, IV_STAGES, ivOpen, ivTrigger, ivText, ivAnswers, ivAnswer, ivExpire, claimsSettle, MTG_OPTS, meetPlayer, mtgOpen, mtgOptions, mtgAnswer, mtgRequests, mtgExpire, mkPromise, hasPromise, promiseLabel, promiseList, checkGmPromises, gmTrustOf, lr2Day, lr2SeasonEnd, lr2Auto, lr2Morale, discLeaders, LR2_FX, LR2_FINE, LR2_CNT, dramaWeek, answerDrama, dramaOpen, dramaList, drMorale, lrOf, lrLabel, DR_FX, DR_CNT, DR_CHOICES, DR_HINT, dynSeasons, dynasties, dynCore, dynWatch, dynEras, autoBegin, autoStep, autoEnd, autoDone, autoRestore, autoRow, AUTO_FX, coachEvolve, coachTree, coachNew, caExQueue, CA_FX, CA_CNT, gmOffseason, gmCareer, gmTakeOver, gmLeave, findGM, GM_FX, GM_CNT, dayDate, MON, NBA_CAL, setSeasonLen, devRole, devRoleBoost, devUsage, sysFocus, SKILL_FOCUS, faLeak, faReason, faDecision, noteNearDeal, RUMOR_REAL, RUMOR_CNT, repAppeal, repTrustWeek, publicUnhappy, pubStar, pubReady, hotSeat, hotSeatWeek, storyGame, raceWeek, retireTribute, jerseyTribute, fanMood, fanMoodWeek, realismWeek, gmReset, foPersona, foTraits, foSummary, FO_TRAIT, planYears, blendStatus, RISE_CNT, RISING_MAX, statusNews, risingOK, risingKeepsPick, statusMinBoost, FEED_MAX, FEED_AUTH, addPost, postText, feedList, feedKey, playerTone, mediaRep, mediaTone, gameReactions, bigGame, rxText, rxWho, mediaGame, feedTrade, feedSign, feedInjury, feedAward, feedMilestone, feedPromise, feedHoldout, mediaSeries, PRESS_CHOICES, PRESS_LABEL, PRESS_GOOD, PRESS_CNT, pressOpen, pressTrigger, pressText, pressChoices, pressEffects, answerPress, rumorWeek, beatReport, prBlurbs, prBlurb, featureWeek, mediaDay, migrateV265, isWatched, ptagOf, watchList, toggleWatch, setPtag, watchScan, WATCH_MAX, PTAGS, rivalsOf, activeRivals, friendsOf, friendOn, frGet, addFriend, seedFriends, setupFriends, frChem, FR, isRivalry, rivalKind, rivalKinds, rivalOpps, rivalPairs, setupRivals, refreshPoRivals, RIV_LABEL, tradeTempo, payIncentives, holdoutCheck, resolveHoldout, holdoutTerms, agentOf, AGENT_STYLE, NTC_ELIGIBLE, incLikely, INC_LABEL, storyStart, storyEnd, storyTitle, storyStatus, familyTies, relatives, teamDuos, updateDuos, gameAch, seasonAch, ACH_P, ACH_T, ACH_C, scoutRecs, scoutReport, interview, interviewsLeft, setAssign, assignReady, signTwoWay, decideSecondRounder, convertTwoWay, releaseTwoWay, twPoDay, twCutCands, decideTeamOption, releaseBlock, twEligible, twOf, coachDevReport, SC_BIAS, TW_GAMES, ASSIGN_MAX, INTERVIEW_MAX, tradeGrades, treadmillCheck, ACH, ownerSales, yearbookStart, updateFame, runAllStar, allStarVotes, jerseysFor, recentWinner, dirFlags, contenderBuy, genClass, CLASS_TYPES, mockSet, mockRanksOf, OUTLETS, coachTargets, positionRead, foOf, FO_STYLE, dealView, sideValue, withCtx, tradeSides, afterTradeOK, CASH_MAX, CASH_PTS, cashRoom, cashTV, cashCheck, coreOf, setCore, keptSpots, CORE_MAX, TARGET_TABS, pickProj, pickRange, pickPtsNow, pickTier, bundleSum, PICK_PTS, protOpts, protN, protEv, pickKV, protCheck, resolveProtections, aiProt, manageMoods, dirSd, sponsorValue, staffRoom, canAffordStaff, makeInterim, fireCoach, starPower, closeSeasonFinance, ownerReview, seasonProjection, taxFor, faRoom, salaryDump, takeJob, gmRep, marketPrice, updateMorale, moraleParts, teamPotEst, draftBoard, sntOffers, doSignAndTrade, tradeRestricted, tradeUpOffer, raceInfo, buyoutTerms, buyout, buyoutDeadlineDay, seasonH2H, proposalsFor, tradeStatus, refreshTradeStatus, capProjection, canFireCoach, computeBPM, powerRankings, featList, renameEverywhere, signConcerns, migrateLeague, awardLadder, coachValue, inTradeWindow, deadlineDay, release, hireCoach, newLeague, simDay, startPlayoffs, simPlayoffDay, startOffseason, runLottery, aiDraftPick, draftPlayer, startResign, startFA, faDay, startNewSeason, finalizeRosters, payroll, capHit, archLabel, posLabel, MODE_LABEL, CAP, money, evaluateUserTrade, DEAL_CNT, addWhy, executeTrade, negotiate, userRosterProblem, autoFillUser, seedOrder };

// ---------- v30c #5: per-team write-ups for trades, signings and releases ----------
// L.mv = recent moves, newest first: { n, s, ph, day, kind: 'trade'|'sign'|'resign'|'release', tids, pid?, name?, amt?, yrs?, wu: [ { tid, k, text, fit: [before, after] | null, ovr: [before, after] | null } ] }
// Trades also carry rec.wu on the L.trades record. Reason text: one key per reason (mv.n.*, mv.t.*, mv.r.*); Haiku adds variants.
const MV_MAX = 300;
function mvSnap(L, tid) {
  const t = L.teams[tid]; if (!t) return null; let fit = null, ovr = null;
  try { if (t.coach) fit = Math.round(coachFitScore(L, t, t.coach)); } catch (e) { }
  try { ovr = Math.round(teamStrength(L, t)); } catch (e) { }
  return { fit, ovr };
}
const mvAvg = (p, g) => RN_GRP[g].reduce((a, k) => a + (p[k] || 0), 0) / RN_GRP[g].length;
// the need an incoming player fills for a team (called before he joins)
function mvNeed(L, t, ins) {
  const ps = ins.map(x => typeof x === 'object' ? x : L.players[x]).filter(Boolean).sort((a, b) => b.ovr - a.ovr), b = ps[0];
  if (!b) return { k: 'future', v: {} };
  let rot = []; try { rot = rotationOf(L, t).filter(p => !p.prospect).slice(0, 8); } catch (e) { }
  if (rot.length >= 6 && rot.filter(p => p.pos === b.pos || p.pos2 === b.pos).length < 2) return { k: 'depth', v: { pos: POS[b.pos] } };
  if (b.pos >= 3 && (b.tp || 0) >= 62 && !rot.some(p => p.pos >= 3 && (p.tp || 0) >= 55)) return { k: 'stretch', v: {} };
  try {
    const st = rnLeague(L), v = rnTeamVals(L, t); let top = null, ts = 0;
    for (const g in RN_GRP) { const z = (v[g] - st[g][0]) / st[g][1], d = mvAvg(b, g) - v[g]; if (z <= -0.3 && d >= 3 && -z + d / 10 > ts) { ts = -z + d / 10; top = g; } }
    if (top) return { k: top, v: {} };
  } catch (e) { }
  const fifth = rot[4] ? rot[4].ovr : 50;
  return { k: b.ovr >= fifth + 2 ? 'upgrade' : 'depthpiece', v: {} };
}
function mvWhyRelease(L, t, p) {
  let f = 99; try { f = fit(p, t.coach); } catch (e) { }
  if (p.injury >= 40) return { k: 'injury', v: {} };
  if (f < 48 && p.ovr < 62) return { k: 'fit', v: {} };
  if (p.contract && p.contract.amt >= 5 && payroll(L, t) > TAXLINE) return { k: 'cap', v: {} };
  const rank = t.roster.map(id => L.players[id]).sort((a, b) => b.ovr - a.ovr).findIndex(x => x.id === p.id);
  return { k: rank >= 10 ? 'bench' : 'spot', v: {} };
}
const mvPre = x => (x[0] != null && x[1] != null) ? [x[0], x[1]] : null;
function mvWU(L, tid, kind, why, s0, s1, withOvr) {
  const t = L.teams[tid], pre = kind === 'release' ? 'mv.r.' : why.k in MV_TRADE_K ? 'mv.t.' : 'mv.n.';
  const fit = s0 && s1 && s0.fit != null && s1.fit != null ? [s0.fit, s1.fit] : null, ovr = withOvr && s0 && s1 && s0.ovr != null && s1.ovr != null ? [s0.ovr, s1.ovr] : null;
  const why0 = fl(pre + why.k, why.v || {}, (L.mvN || 0) + tid);
  return { tid, k: why.k, text: mvLine(t.abbr, why0, fit, ovr), fit, ovr };
}
const MV_TRADE_K = { cap: 1, youth: 1, future: 1, expiring: 1, absorb: 1, longfit: 1, dump: 1, clear: 1 };
function mvLine(abbr, why, fit, ovr) { return `${abbr}: ${why}.` + (fit ? ` Coach fit ${fit[0]} > ${fit[1]}.` : '') + (ovr ? ` Team overall ${ovr[0]} > ${ovr[1]}.` : ''); }
function mvRec(L, e) {
  L.mv = L.mv || []; e.n = L.mvN = (L.mvN || 0) + 1; e.s = L.season; e.ph = L.phase; e.day = L.phase === 'regular' ? L.day : null;
  L.mv.unshift(e); if (L.mv.length > MV_MAX) L.mv.length = MV_MAX; return e;
}
// trades: sides = [{ tid, ins: [pids], outs: [pids], inPicks, outPicks }]; call before the players move, then mvTradePost
function mvTradePre(L, sides) {
  return sides.map(s => {
    const t = L.teams[s.tid]; let why;
    if (s.wk) return { tid: s.tid, why: { k: s.wk, v: {} }, s0: mvSnap(L, s.tid) };   // v32e: expiring / salary-dump trades carry their own reason
    try {
      const inSal = s.ins.reduce((a, id) => a + (L.players[id].contract ? L.players[id].contract.amt : 0), 0), outSal = s.outs.reduce((a, id) => a + (L.players[id].contract ? L.players[id].contract.amt : 0), 0);
      const best = s.ins.map(id => L.players[id]).sort((a, b) => b.ovr - a.ovr)[0];
      if (payroll(L, t) > TAXLINE && outSal - inSal >= 4) why = { k: 'cap', v: {} };
      else if (!s.ins.length) why = { k: 'future', v: {} };
      else if (best && best.age <= 23 && ['rebuild', 'tank', 'rising'].includes(t.mode)) why = { k: 'youth', v: {} };
      else why = mvNeed(L, t, s.ins);
    } catch (e) { why = { k: 'depthpiece', v: {} }; }
    return { tid: s.tid, why, s0: mvSnap(L, s.tid) };
  });
}
function mvTradePost(L, pre, rec) {
  const wu = pre.map(x => mvWU(L, x.tid, 'trade', x.why, x.s0, mvSnap(L, x.tid), true));
  if (rec) rec.wu = wu;
  mvRec(L, { kind: 'trade', tids: pre.map(x => x.tid), gets: rec ? [rec.aGets, rec.bGets, rec.cGets].filter(x => x != null) : [], wu });
  return wu;
}
// signings: mvSignPre before the contract is set / he joins, mvSignPost after addToTeam
function mvSignPre(L, p, tid, type, amt) {
  if (type !== 'signing' && type !== 're-sign') return null;
  if (type === 're-sign') return { type, why: { k: 'resign', v: {} } };
  const t = L.teams[tid]; let why;
  try { why = amt <= MINSAL + 1e-9 && p.ovr < 55 ? { k: 'min', v: {} } : mvNeed(L, t, [p]); } catch (e) { why = { k: 'depthpiece', v: {} }; }
  return { type, why, s0: mvSnap(L, tid) };
}
function mvSignPost(L, p, tid, pre, amt, yrs) {
  if (!pre) return;
  const wu = [mvWU(L, tid, 'sign', pre.why, pre.s0, pre.type === 're-sign' ? null : mvSnap(L, tid), false)];
  mvRec(L, { kind: pre.type === 're-sign' ? 'resign' : 'sign', tids: [tid], pid: p.id, name: p.name, amt, yrs, wu });
}
function mvList(L, tid, kind) { return (L.mv || []).filter(e => (tid == null || e.tids.includes(tid)) && (!kind || e.kind === kind)); }
Object.assign(FLAVOR, {
  'mv.n.play': ['needed a playmaker', 'was short on playmaking', 'needed someone to run the offense', 'wanted a true point guard'], 'mv.n.shoot': ['needed shooting', 'was short on shooters', 'needed more players who can make threes', 'wanted better spacing on offense'], 'mv.n.reb': ['needed a rebounder', 'was losing the boards', 'needed someone to win the glass', 'wanted more size on the glass'], 'mv.n.rimD': ['needed a rim protector', 'had no one to guard the rim', 'needed a defender to deter shots at the rim', 'wanted a shot blocker in the paint'], 'mv.n.perD': ['needed a perimeter defender', 'needed someone to guard the wings', 'was weak on the perimeter', 'wanted a defender for the best guards'], 'mv.n.ath': ['needed more athleticism', 'lacked explosive athletes', 'wanted more speed and bounce', 'needed more quickness up and down the floor'], 'mv.n.inside': ['needed an inside scorer', 'needed points in the paint', 'wanted a big who can score inside', 'lacked a post scoring option'],
  'mv.n.stretch': ['needed a stretch big', 'needed a big who can shoot from range', 'wanted a big man who can space the floor', 'needed a stretch four or five'], 'mv.n.depth': ['needed a backup {pos}', 'was thin behind the starter at {pos}', 'needed depth at {pos}', 'wanted a second {pos} on the bench'], 'mv.n.upgrade': ['wanted a better rotation player', 'wanted a clear step up in the rotation', 'looked for a better player for the rotation', 'wanted an upgrade in the rotation'], 'mv.n.depthpiece': ['added a rotation depth piece', 'added a depth piece for the rotation', 'wanted a useful bench player', 'brought in a rotation piece to add depth'], 'mv.n.resign': ['kept a core player', 'kept a key rotation player', 'wanted to keep a core piece', 'brought back a player the team wanted to keep'], 'mv.n.min': ['added depth on a minimum deal', 'added depth on a minimum contract', 'signed depth at the league minimum', 'added bench depth on a minimum salary'],
  'mv.t.cap': ['needed to cut salary', 'was looking to cut salary', 'wanted to clear payroll room', 'needed to shed salary'], 'mv.t.youth': ['wanted young talent', 'was looking to get younger', 'wanted players who can grow with the team', 'wanted prospects to build around'], 'mv.t.future': ['wanted picks for the future', 'wanted draft picks for later', 'was looking to stock up on future picks', 'wanted assets for the long term'],
  'mv.r.fit': ['he did not fit the coach\'s systems', 'his game did not match the coach\'s system', 'the coach\'s systems did not suit him', 'he did not work in the coach\'s schemes'], 'mv.r.cap': ['cleared salary', 'freed up salary', 'cleared room under the payroll', 'cut salary to stay in line'], 'mv.r.injury': ['he was out for a long time', 'he was going to miss a long stretch', 'his injury kept him out for a long time', 'he was sidelined by a long injury'], 'mv.r.bench': ['he had fallen out of the rotation', 'he was no longer in the rotation', 'he had dropped out of the playing rotation', 'he had lost his spot in the rotation'], 'mv.r.spot': ['needed the roster spot', 'the roster spot was needed', 'the spot was needed for another player', 'the team needed the spot for someone better']
});

// ---------- v30c #23: interviews only in set periods (opening week, before the deadline, first playoff game, draft), question pools, no repeats in a season ----------
// Pools: each IV_Q key lists the periods it can be asked in (st). L.ivUsed = { s, ks } keeps the questions already asked this season; a pool that runs dry gives a shorter interview, never a repeat.
function ivPoolLeft(L, stage) { const used = L.ivUsed && L.ivUsed.s === L.season ? L.ivUsed.ks : []; return Object.keys(IV_Q).filter(k => IV_Q[k].st.includes(stage) && !used.includes(k)); }
const IV_PERIOD = { open: 'Opening week', deadline: 'Trade deadline', playoffs: 'First playoff game', draft: 'Draft week' };
Object.assign(IV_Q, {
  bench: { st: ['open', 'deadline'], w: 2, a: [{ all: 1, hype: 1 }, { sm: -2, rep: 1 }, { h: 1, trust: 1 }, { rep: -1 }] },
  future: { st: ['open', 'deadline'], w: 2, a: [{ hype: 2, trust: -1 }, { trust: 1 }, { hype: -1, rep: 1 }, { rep: -1 }] },
  rotation: { st: ['playoffs'], w: 3, a: [{ all: 2, hype: 1 }, { rep: 1, h: 1 }, { all: -1, rep: 1 }, { rep: -1 }] },
  pressure: { st: ['playoffs'], w: 3, a: [{ h: 2, hype: 1 }, { rep: 1, all: 1 }, { hype: 2, all: -1 }, { rep: -1 }] },
  rest: { st: ['playoffs'], w: 2, a: [{ all: 1, rep: 1 }, { h: 1 }, { hype: 1, trust: 1 }, { rep: -1 }] },
  dpick: { st: ['draft'], w: 6, need: 'pick', a: [{ hype: 3, trust: 1 }, { hype: 1, rep: 1 }, { trust: 1, h: 1 }, { rep: -1 }] },
  dtrade: { st: ['draft'], w: 4, a: [{ hype: 2, trust: -1 }, { trust: 1, rep: 1 }, { hype: 1 }, { rep: -1 }] },
  dclass: { st: ['draft'], w: 3, a: [{ hype: 2 }, { rep: 1 }, { hype: -1, trust: 1 }, { rep: -1 }] },
  dneed: { st: ['draft'], w: 3, a: [{ trust: 1, rep: 1 }, { hype: 2 }, { h: 1 }, { rep: -1 }] },
  dwork: { st: ['draft'], w: 2, a: [{ rep: 1, trust: 1 }, { hype: 1 }, { rep: 1 }, { rep: -1 }] }
});
Object.assign(FLAVOR, {
  'iv.intro.draft': ['{host} of {outlet} catches you ahead of the draft.', '{host} from {outlet} wants a word as draft night nears.', 'Draft week: {host} of {outlet} has a few questions for you.', '{host} from {outlet} asks for a few minutes before the draft.'],
  'iv.news.draft': ['The {abbr} GM spoke with {outlet} ahead of the draft.', 'The {abbr} GM sat down with {outlet} in draft week.', 'The {abbr} GM told {outlet} what to expect from draft night.', 'Draft week brings the {abbr} GM to {outlet} for a few questions.'],
  'iv.q.bench': ['Is the {team} bench deep enough to hold up over a full season?', 'How much can you count on the {team} reserves this season?', 'Can the {team} bench hold up if the starters get hurt?', 'Do the {team} have enough depth off the bench?'], 'iv.q.future': ['How much are you thinking about the long-term plan for the {team}?', 'Are the {team} built for this year or for the future?', 'Are the {team} giving up the future for the present?', 'What does the {team} look like in three years?'],
  'iv.q.rotation': ['Will {coach} shorten the rotation in the playoffs?', 'How many players will {coach} trust in this series?', 'Who gets the minutes when the games get tight, {coach}?', 'Will {coach} lean on the starters more in the playoffs?'], 'iv.q.pressure': ['How do the {team} handle the playoff pressure?', 'Is the {team} group ready for the pressure of the postseason?', 'Do the {team} have the nerve for a long playoff run?', 'Do you expect the {team} to handle the big moments?'], 'iv.q.rest': ['Are the {team} rested and healthy for the playoffs?', 'How healthy are the {team} heading into the postseason?', 'Is anyone on the {team} still nursing an injury this time of year?', 'How much rest have the {team} had before the playoffs?'],
  'iv.q.dpick': ['With pick {pick}, what kind of player are you looking for?', 'You pick at {pick}. Who are you hoping is there?', 'Which position would you target at pick {pick}?', 'Are you thinking about trading back from pick {pick}?'], 'iv.q.dtrade': ['Will the {team} move up or down on draft night?', 'Are you taking calls on the {team} picks before the draft?', 'Would the {team} trade their pick for a veteran?', 'Will the {team} be busy on draft night?'], 'iv.q.dclass': ['How deep is this draft class?', 'What do you think of the quality of this draft?', 'Are there enough two-way players in this class?', 'Is this draft deeper than the last one?'], 'iv.q.dneed': ['How much will the {team} draft for need and how much for talent?', 'Do you take the best player or fill a hole for the {team} in the draft?', 'Does the {team} roster need help at one position more than the others?', 'Will the {team} take a need pick in the first round?'], 'iv.q.dwork': ['How much do pre-draft workouts matter to you?', 'What do you learn from the workouts before the draft?', 'Do pre-draft workouts change how you rank a prospect?', 'Do you trust workout numbers or game film more?'],
  'iv.a.bench.0': ['We have real depth. Anyone can step in.', 'Our reserves have earned their minutes.', 'Whoever is in the game gives us a real chance.', 'Depth is a strength for us right now.'], 'iv.a.bench.1': ['The top players carry us; the bench needs to hold on.', 'The stars do most of the work, and the bench helps where it can.', 'We need the bench to show up when the starters rest.', 'The bench is still finding its footing.'], 'iv.a.bench.2': ['We will find out. Everyone is working for minutes.', 'Competition is healthy. We will see who steps up.', 'Nobody has a lock on a spot yet.', 'That is still being decided on the floor.'], 'iv.a.bench.3': ['I will keep my rotation thoughts private.', 'I would rather not get into the minutes.', 'The coaches handle the bench, so I will leave it there.', 'No comment on the reserves.'],
  'iv.a.future.0': ['We are building for the next few years.', 'We think about the next few seasons first.', 'Our plan runs a few years out, and we are on track.', 'Our long-term view is clear, and this group fits it.'], 'iv.a.future.1': ['We want to win now and the future will follow.', 'We are going for it now and we will sort out later.', 'Winning this season matters most to us.', 'Today comes first, and tomorrow can wait.'], 'iv.a.future.2': ['We keep both in mind, one move at a time.', 'We balance now and later with every deal.', 'Each move has to help both the present and the future.', 'We do not chase one timeline over the other.'], 'iv.a.future.3': ['I will not get into the long-term plan.', 'The long-term plan stays with the front office.', 'I am not going to talk about the years ahead.', 'Let us talk about this season, not the next one.'],
  'iv.a.rotation.0': ['Our top players will play heavy minutes.', 'The starters will take on a big load in the playoffs.', 'Expect our best players on the floor for long stretches.', 'We will ride our top guys when it matters.'], 'iv.a.rotation.1': ['We trust everyone on the roster.', 'Every player on this roster has earned our trust.', 'We have faith in the whole group, not just the top five.', 'Anyone we put out there can do the job.'], 'iv.a.rotation.2': ['The coach will do what each game needs.', 'Every game is different, so the minutes will be too.', 'The rotation changes with the matchup.', 'We will adjust to what the series asks for.'], 'iv.a.rotation.3': ['That is for the coach to decide.', 'I will leave the minutes to the coaching staff.', 'Ask the coach about the rotation.', 'Minutes are not my call.'],
  'iv.a.pressure.0': ['This group has been here before and it is ready.', 'We have felt this kind of pressure before, and we handled it.', 'This team knows what the postseason is about.', 'We are not new to big moments.'], 'iv.a.pressure.1': ['Pressure is a privilege. We are excited.', 'We wanted this kind of spotlight, and we are glad to have it.', 'Playoff pressure is what we play for.', 'The bigger the stage, the better we feel.'], 'iv.a.pressure.2': ['We are going to be loud and enjoy it.', 'We plan to have fun with it and play loose.', 'Bring the noise, we are ready to answer it.', 'The crowd makes this the best time of year.'], 'iv.a.pressure.3': ['No comment on pressure.', 'I will let the games talk on that.', 'Pressure is not a topic I want to discuss.', 'Ask me after the series.'],
  'iv.a.rest.0': ['We are in good shape and rested.', 'The group is fresh and feeling good.', 'Everyone is healthy heading into the playoffs.', 'We feel strong and ready to go.'], 'iv.a.rest.1': ['A few bumps, but the group is ready.', 'Some guys are a little sore, but nothing serious.', 'We have a couple of small issues, and we are managing them.', 'Nothing major, just the usual wear this time of year.'], 'iv.a.rest.2': ['We will take it day by day with the medical staff.', 'The medical staff is guiding every decision on minutes.', 'We listen to the training staff and adjust daily.', 'Health is checked every morning, and we act on it.'], 'iv.a.rest.3': ['I will not talk about injuries.', 'Injury news is for the team to share, not me.', 'I would rather not get into anyone\'s health.', 'No updates on injuries from me.'],
  'iv.a.dpick.0': ['The best talent available, whatever the position.', 'We take the best player on the board, period.', 'Talent comes first, and we will sort out the fit later.', 'Whoever is the top prospect when we pick is who we take.'], 'iv.a.dpick.1': ['Someone who fits what we need now.', 'We want a player who can help the roster this season.', 'Need is the key. We are looking for a specific skill set.', 'Whoever helps us the soonest is the answer.'], 'iv.a.dpick.2': ['A player we can develop and trust.', 'We want someone we can grow with over several years.', 'Patience with a young player pays off, so we look for upside.', 'Development matters more than a quick fix.'], 'iv.a.dpick.3': ['I will not tip my hand.', 'I am keeping that to myself until draft night.', 'Our board stays private.', 'You will find out on draft night.'],
  'iv.a.dtrade.0': ['If someone wants to move up, we will listen.', 'We will take any call that makes sense.', 'Every offer gets a hearing, and we will weigh them all.', 'If the price is right, we are open to it.'], 'iv.a.dtrade.1': ['We like where we are. No plans to move.', 'We are happy with our spot and staying put.', 'Our pick is where we want it, so no change.', 'We are not looking to trade our way up or down.'], 'iv.a.dtrade.2': ['We are always open to the right deal.', 'We stay flexible, and the right deal can change our plans.', 'Nothing is off the table on draft night.', 'A good offer can change things quickly.'], 'iv.a.dtrade.3': ['I do not talk about trade calls.', 'Trade talks stay between the front office teams.', 'I will not comment on who is calling.', 'Trade calls are not something I discuss.'],
  'iv.a.dclass.0': ['It is a strong class with real depth.', 'There is good talent from the top down.', 'The depth in this class is what stands out to us.', 'Plenty of players here could help a team right away.'], 'iv.a.dclass.1': ['There are a few special players at the top.', 'The top of this class is as strong as I have seen.', 'A couple of prospects stand well above the rest.', 'The elite players here can change a franchise.'], 'iv.a.dclass.2': ['It is a thin class; patience will matter.', 'Good players are hard to find this year, so patience will matter.', 'The middle of this class is a question mark.', 'We will need some luck after the first handful of picks.'], 'iv.a.dclass.3': ['I will not rank the class publicly.', 'I would rather not rate the class out loud.', 'The rankings are for the draft room, not the press.', 'No public ranking from me.'],
  'iv.a.dneed.0': ['Talent first. We will fit them in.', 'We take the talent and find the roster spot later.', 'Good players find a place, so talent comes first.', 'We will make room for the best player available.'], 'iv.a.dneed.1': ['Need matters. We have specific holes to fill.', 'We are looking for players who fill real gaps.', 'Our roster has clear needs, and the draft will address some.', 'A hole on the roster matters as much as the talent.'], 'iv.a.dneed.2': ['A mix of both, depending on who falls.', 'It depends on who is left when we pick.', 'We balance need and talent, and the board decides.', 'The best value at the right moment wins out.'], 'iv.a.dneed.3': ['That stays in the draft room.', 'I will keep our needs to ourselves.', 'Our draft priorities are private.', 'The board is for us, not for you.'],
  'iv.a.dwork.0': ['They tell us a lot about character and fit.', 'Interviews and workouts show us what a player is like off the court.', 'Workouts help us see how a player fits our culture.', 'Character shows up in a workout, and we pay attention to it.'], 'iv.a.dwork.1': ['Film and games matter more to us.', 'We trust game film over a single workout.', 'Game tape tells us the most about a prospect.', 'Real games matter more than drills in the gym.'], 'iv.a.dwork.2': ['Workouts help, but they are one piece.', 'Workouts are one piece of a bigger picture.', 'A workout helps, but it does not decide anything alone.', 'We take workouts as a small part of the evaluation.'], 'iv.a.dwork.3': ['I keep that private.', 'Our evaluation process stays in-house.', 'I would rather not describe how we evaluate players.', 'We keep our process to ourselves.']
});
// v30 8t/7t: pre-game scouting report ("What to watch") and ticker stat / rumor lines, as keys so they can vary (app.js scoutDlg, tickerItems)
Object.assign(FLAVOR, {
  'sc.even': ['The rosters are rated about even.', 'On paper, there is little to separate these two rosters.', 'Neither team has a clear edge in talent tonight.', 'The ratings call this one a toss-up.', 'Both rosters grade out about the same.', 'Nothing in the ratings separates these two teams.', 'Call it even: the rosters rate out level.'],
  'sc.edge': ['{abbr} has the rating edge ({hi} to {lo}).', '{abbr} brings the stronger roster ({hi} to {lo}).', 'On paper, {abbr} is the better team ({hi} to {lo}).', 'The ratings favor {abbr} ({hi} to {lo}).', '{abbr} rates a little higher on paper ({hi} to {lo}).', 'The edge goes to {abbr}, rated {hi} to {lo}.', 'Talent-wise, {abbr} comes out ahead ({hi} to {lo}).'],
  'sc.matchup': ['{off} offense ({ortg}, {ork}) meets the {def} defense ({drtg}, {drk}).', 'The {off} offense ({ortg}, {ork}) tests the {def} defense ({drtg}, {drk}).', 'Key matchup: {off} offense ({ortg}, {ork}) against the {def} defense ({drtg}, {drk}).', 'Can the {def} defense ({drtg}, {drk}) slow the {off} offense ({ortg}, {ork})?', 'Watch the {off} offense ({ortg}, {ork}) against the {def} defense ({drtg}, {drk}).', 'Between the {off} offense ({ortg}, {ork}) and the {def} defense ({drtg}, {drk}), who wins?', 'The {def} defense ({drtg}, {drk}) must stop the {off} offense ({ortg}, {ork}).'],
  'sc.inj': ['{abbr} injuries: {list}.', '{abbr} will be without {list}.', 'Out for {abbr}: {list}.', '{abbr} injury report: {list}.', 'Sidelined for {abbr}: {list}.', 'Not at full strength: {abbr} are without {list}.', 'Injury news for {abbr}: {list} won\'t play.'],
  'sc.nomeet': ['No meetings yet this season.', 'These teams have not met yet this season.', 'This is their first meeting this season.', 'No games between these two yet this season.', 'The two teams have yet to play each other this season.', 'Their season series has not started yet.', 'No head-to-head games so far this season.'],
  'sc.pro': ['Our scouts see {name} as {role} right now ({lo}-{hi}).', 'Pro scouting read on {name}: {role} ({lo}-{hi}).', 'Our staff grades {name} as {role} at the moment ({lo}-{hi}).', '{name} projects as {role} by our read ({lo}-{hi}).', 'The pro scouts have {name} down as {role} ({lo}-{hi}).', 'Our read: {name} is {role} today ({lo}-{hi}).', 'From the film and the games, {name} looks like {role} ({lo}-{hi}).'],
  'sc.proconf': ['{conf} confidence: {why}.', 'How sure we are: {conf}. {why}.', 'Confidence {conf}: {why}.', 'Our certainty is {conf}: {why}.', '{conf} confidence in this read. {why}.', 'Read confidence: {conf} ({why}).', 'We rate this read {conf}: {why}.'],
  'sc.prostr': ['What stands out: {list}.', 'He wins with {list}.', 'Strengths we see: {list}.', 'His best tools: {list}.', 'Where he helps a team: {list}.', 'The scouts like his {list}.', 'Plus skills: {list}.'],
  'sc.prowk': ['Where he falls short: {list}.', 'Concerns: {list}.', 'Weak spots we see: {list}.', 'The scouts question his {list}.', 'What holds him back: {list}.', 'Areas to cover for: {list}.', 'Minus skills: {list}.'],
  'tk.pts': ['{name} ({abbr}) leads the league in scoring at {v} points a game', 'Scoring leader: {name} ({abbr}) is averaging {v} points', '{name} ({abbr}) tops the scoring chart with {v} points a game', 'Nobody scores more than {name} ({abbr}): {v} points a game', '{name} ({abbr}) paces the league with {v} points a game', 'Top of the scoring column: {name} ({abbr}), {v} points a game', 'The scoring pace belongs to {name} ({abbr}) at {v} a game'],
  'tk.pts.po': ['{name} ({abbr}) leads the league in scoring at {v} points a game in the playoffs', 'Playoff scoring leader: {name} ({abbr}) at {v} points a game', '{name} ({abbr}) tops the playoff scoring chart with {v} a game', 'Nobody has scored more this postseason than {name} ({abbr}): {v} a game', '{name} ({abbr}) is scoring {v} points a game this postseason', 'Postseason scoring: {name} ({abbr}) with {v} a game', 'Playoff points lead: {name} ({abbr}) at {v} a game'],
  'tk.reb': ['{name} ({abbr}) leads in rebounds, {v} a game', 'Rebounding leader: {name} ({abbr}) with {v} a game', '{name} ({abbr}) is cleaning the glass: {v} rebounds a game', 'Nobody pulls down more boards than {name} ({abbr}): {v} a game', '{name} ({abbr}) owns the boards at {v} rebounds a game', 'Glass leader: {name} ({abbr}) with {v} rebounds a game', 'Rebounds lead the way: {name} ({abbr}) at {v} a game'],
  'tk.ast': ['{name} ({abbr}) leads in assists, {v} a game', 'Assists leader: {name} ({abbr}) with {v} a game', '{name} ({abbr}) is setting the table: {v} assists a game', 'Nobody passes like {name} ({abbr}) this season: {v} assists a game', '{name} ({abbr}) is dishing the most: {v} assists a game', 'Playmaking leader: {name} ({abbr}) with {v} assists a game', 'Most assists per game: {name} ({abbr}) at {v}'],
  'tk.stl': ['{name} ({abbr}) leads in steals, {v} a game', 'Steals leader: {name} ({abbr}) with {v} a game', '{name} ({abbr}) has the quickest hands: {v} steals a game', 'Nobody takes the ball away more than {name} ({abbr}): {v} a game', '{name} ({abbr}) is picking pockets at {v} steals a game', 'Steals leader: {name} ({abbr}) at {v} a game', 'Most steals per game: {name} ({abbr}) with {v}'],
  'tk.blk': ['{name} ({abbr}) leads in blocks, {v} a game', 'Blocks leader: {name} ({abbr}) with {v} a game', '{name} ({abbr}) is guarding the rim: {v} blocks a game', 'Nobody swats more shots than {name} ({abbr}): {v} a game', '{name} ({abbr}) is the wall at the rim: {v} blocks a game', 'Blocks leader: {name} ({abbr}) at {v} a game', 'Most blocks per game: {name} ({abbr}) with {v}'],
  'tk.tpm': ['{name} ({abbr}) leads in three-pointers, {v} a game', 'Three-point leader: {name} ({abbr}) with {v} makes a game', '{name} ({abbr}) is raining threes: {v} a game', 'Nobody hits more threes than {name} ({abbr}): {v} a game', '{name} ({abbr}) is the best from deep: {v} threes a game', 'Three-point leader: {name} ({abbr}) at {v} makes a game', 'Most threes per game: {name} ({abbr}) with {v}'],
  'tk.record': ["{team} have the league's best record at {w}-{l}", "Best in the league: the {team} at {w}-{l}", "{team} sit on top of the league at {w}-{l}", "Nobody has won more than the {team}, now {w}-{l}", '{team} lead the league at {w}-{l}', 'Top record in the league: the {team} at {w}-{l}', 'Nobody has a better mark than the {team}: {w}-{l}'],
  'tk.offdef': ["{oabbr} have the league's top offense ({ortg} per 100 possessions); {dabbr} the top defense ({drtg})", "Best offense: {oabbr} ({ortg} per 100). Best defense: {dabbr} ({drtg} allowed)", "{oabbr} score the most per possession ({ortg}); {dabbr} allow the least ({drtg})", "Top attack: {oabbr} at {ortg} per 100 possessions. Top defense: {dabbr} at {drtg}", '{oabbr} make the most per 100 possessions ({ortg}); {dabbr} give up the fewest ({drtg})', 'Scoring machine: {oabbr} at {ortg} per 100. Stingiest defense: {dabbr} at {drtg}', 'Offense leader {oabbr} ({ortg}), defense leader {dabbr} ({drtg} allowed)'],
  'tk.top': ["Last game day's top score: {name} had {pts} points against {opp} ({res})", "Top scorer last game day: {name}, {pts} points against {opp} ({res})", "{name} led all scorers last game day with {pts} against {opp} ({res})", "Big night: {name} poured in {pts} points against {opp} ({res})", '{name} was the best of the last game day: {pts} points against {opp} ({res})', 'Last game day spotlight: {name}, {pts} points versus {opp} ({res})', 'Hot hand last game day: {name} scored {pts} against {opp} ({res})'],
  'tk.treq': ['{name} ({abbr}, {ovr}) is reported to want a trade', 'Sources say {name} ({abbr}, {ovr}) has asked out', '{name} ({abbr}, {ovr}) wants a new team, according to reports', 'Word is {name} ({abbr}, {ovr}) would like to be traded', '{name} ({abbr}, {ovr}) has made a trade request', 'Trade request reported: {name} ({abbr}, {ovr}) wants out', 'Reports say {name} ({abbr}, {ovr}) wants a fresh start elsewhere'],
  'tk.block': ['{team} are said to be listening on offers for {name} ({ovr})', 'Sources say the {team} would move {name} ({ovr}) for the right offer', '{name} ({ovr}) is on the trade block, and the {team} are taking calls', 'The {team} have made {name} ({ovr}) available, league sources say', 'The {team} are open to offers for {name} ({ovr})', 'Trade talks: the {team} would consider moving {name} ({ovr})', '{name} ({ovr}) could be on the move, with the {team} taking calls']
});
// v31: young players cut at the free-agent cap go overseas
Object.assign(FLAVOR, {
  'ab.go': ['{name} ({ovr}, {age}) heads overseas to play for the {club} of the {lg}.', 'Unsigned {name} ({ovr}, {age}) goes abroad and joins the {club} ({lg}).', '{name} ({ovr}, {age}) takes his game overseas with the {club} of the {lg}.', 'With no deal at home, {name} ({ovr}, {age}) signs with the {club} in the {lg}.']
});
// v32e text: news (1 wording each; Haiku adds more) + trade write-up reasons (4 wordings, lint)
Object.assign(FLAVOR, {
  'news.paycut': ['{name} took a pay cut to chase a ring: signed with {team} for {amt}/yr (value {val})', '{name} chose winning over money: {team} get him for {amt}/yr (value {val})', 'Ring chase: {name} signs with {team} at {amt}/yr, well under his {val} value', '{name} left money on the table to join {team}: {amt}/yr (value {val})'],
  'news.leave': ['{name} turned down {team} and will test free agency ({why})', '{name} is leaving {team} for free agency ({why})', 'No deal: {name} walks away from {team} ({why})', '{name} and {team} part ways; he heads to free agency ({why})'],
  'mv.t.expiring': ['cleared cap space for next summer', 'took an expiring deal to open room for free agency', 'swapped a long deal for an expiring one', 'wanted cap room next summer'],
  'mv.t.absorb': ['took on a longer deal for draft picks', 'was paid in picks to take on salary', 'used its cap room to add picks', 'absorbed a contract for picks'],
  'mv.t.longfit': ['wanted the player on a longer deal', 'wanted to keep a useful player for years', 'traded an expiring deal for a player under contract', 'wanted control beyond this season'],
  'mv.t.dump': ['dumped salary', 'needed to shed a big contract', 'paid to move a contract', 'cleared a contract off the books'],
  'mv.t.clear': ['made room under the hard cap to keep a starter', 'cleared hard-cap room for a re-signing', 'moved a contract to keep a key player', 'freed cap room to re-sign one of their own']
});

// ===== Phase A (Nov 18 2026): expansion teams + expansion draft =====
// The league office plans new teams (in pairs, one per conference) any time before free agency; they join at the start of free agency
// (after the draft and re-signing), pick players in an expansion draft (each team protects XPN_PROTECT players), then fill up in free agency.
// city, nickname, abbr, region, c1, c2, motif, market
const XPN_PBL = [
  ['Seoul', 'Tigers', 'SEO', 'Korea', '#c8102e', '#1d2a5c', 'fist', 3], ['Tokyo', 'Thunder', 'TYO', 'Japan', '#1a1a1a', '#e63946', 'fist', 3],
  ['Osaka', 'Castles', 'OSA', 'Japan', '#3b2f8f', '#f2c14e', 'arch', 3], ['Sydney', 'Harbour Kings', 'SYD', 'Australia', '#0b4f8a', '#f2c230', 'compass', 3],
  ['Auckland', 'Kiwis', 'AKL', 'New Zealand', '#1a1a1a', '#cfd8dc', 'wing', 2], ['Kaohsiung', 'Steelers', 'KHH', 'Taiwan', '#4a5568', '#f6ad55', 'shield', 2],
  ['Ho Chi Minh City', 'Dragons', 'SGN', 'Vietnam', '#b91c1c', '#facc15', 'naga', 3], ['Surabaya', 'Sharks', 'SUB', 'Indonesia', '#0e7490', '#f8fafc', 'junk', 2],
  ['Suva', 'Breakers', 'SUV', 'Fiji', '#0284c7', '#f1f5f9', 'ferry', 1], ['Hagatna', 'Navigators', 'GUM', 'Guam', '#1e3a8a', '#f59e0b', 'compass', 1],
  ['Penang', 'Pearls', 'PEN', 'Malaysia', '#7c3aed', '#fde68a', 'lotus', 2], ['Chiang Mai', 'Tuskers', 'CNX', 'Thailand', '#065f46', '#fcd34d', 'elephant', 1]];
const XPN_NBA = [
  ['Seattle', 'Sound', 'SEA', 'West', '#00653a', '#ffc200', 'peaks', 3], ['Las Vegas', 'Aces High', 'LVG', 'West', '#1a1a1a', '#c8a24a', 'star', 2],
  ['Vancouver', 'Grizzly Kings', 'VAN', 'West', '#00285e', '#6fb7e8', 'ridge', 2], ['Mexico City', 'Aztecs', 'MEX', 'West', '#006847', '#ce1126', 'volcano', 3],
  ['Kansas City', 'Monarchs', 'KCM', 'West', '#004687', '#bd9b60', 'shield', 2], ['Louisville', 'Thoroughbreds', 'LOU', 'East', '#c8102e', '#1a1a1a', 'spear', 2],
  ['Nashville', 'Notes', 'NSH', 'East', '#1f2a44', '#f2a900', 'star', 2], ['Montreal', 'Royals', 'MTL', 'East', '#003da5', '#ef3340', 'cross', 3],
  ['Pittsburgh', 'Ironmen', 'PIT', 'East', '#1a1a1a', '#ffb612', 'fist', 2], ['St. Louis', 'Spirits', 'STL', 'East', '#002f6c', '#c41e3a', 'arch', 2],
  ['Baltimore', 'Bullets', 'BAL', 'East', '#e03a3e', '#002b5c', 'compass', 2], ['San Diego', 'Surf', 'SDS', 'West', '#002d62', '#f5b301', 'wing', 2]];
const XPN_PROTECT = 8, XPN_MAX = 36, XPN_PER_DRAFT = 11;
const xpnList = L => L.nba ? XPN_NBA : XPN_PBL;
// cities not in the league and not already planned
function xpnCandidates(L) {
  const used = new Set([...L.teams.map(t => t.abbr), ...((L.xpnPlan && L.xpnPlan.teams) || []).map(d => d.abbr)]);
  const cities = new Set(L.teams.map(t => t.city));
  return xpnList(L).filter(d => !used.has(d[2]) && !cities.has(d[0])).map(d => ({ city: d[0], name: d[1], abbr: d[2], region: d[3], c1: d[4], c2: d[5], logo: d[6], market: d[7] }));
}
// the offseason the plan takes effect: this one until free agency starts, then next season's
function xpnSeason(L) { return ['off-fa', 'off-ready'].includes(L.phase) ? L.season + 1 : L.season; }
function xpnMotifs() { return typeof MOTIF === 'object' ? Object.keys(MOTIF) : ['star', 'fist', 'shield', 'compass', 'wing', 'peaks']; }
// check one team definition (from the team creator); returns an error text or null
function xpnCheckDef(L, d, others) {
  if (!d || !String(d.city || '').trim() || !String(d.name || '').trim()) return 'Give the team a city and a nickname.';
  const ab = String(d.abbr || '').trim().toUpperCase();
  if (!/^[A-Z]{2,4}$/.test(ab)) return 'The short name needs 2-4 letters.';
  const all = [...L.teams, ...(others || [])];
  if (all.some(t => t.abbr === ab)) return `${ab} is already taken.`;
  if (all.some(t => String(t.city).toLowerCase() === String(d.city).trim().toLowerCase() && String(t.name).toLowerCase() === String(d.name).trim().toLowerCase())) return 'That team name is already taken.';
  if (!/^#[0-9a-fA-F]{6}$/.test(d.c1 || '') || !/^#[0-9a-fA-F]{6}$/.test(d.c2 || '')) return 'Pick two team colors.';
  return null;
}
// plan expansion: defs = 2 or 4 team definitions (half go to each conference). Returns an error text or null.
function xpnPlan(L, defs, opts) {
  opts = opts || {};
  if (!Array.isArray(defs) || !defs.length || defs.length % 2) return 'Add teams in pairs (one for each conference).';
  if (defs.length > 4) return 'Up to 4 new teams at a time.';
  if (L.teams.length + defs.length > XPN_MAX) return `The league can have at most ${XPN_MAX} teams.`;
  const clean = [];
  for (const d of defs) { const e = xpnCheckDef(L, d, clean); if (e) return e; clean.push({ city: String(d.city).trim(), name: String(d.name).trim(), abbr: String(d.abbr).trim().toUpperCase(), region: String(d.region || d.city).trim(), c1: d.c1, c2: d.c2, logo: xpnMotifs().includes(d.logo) ? d.logo : 'star', market: [1, 2, 3].includes(+d.market) ? +d.market : 2, conf: CONFS.includes(d.conf) ? d.conf : null }); }
  // conferences: keep them even
  const half = clean.length / 2; let n = 0;
  for (const c of clean) if (c.conf === 'North') n++;
  for (const c of clean) if (!c.conf) { c.conf = n < half ? 'North' : 'South'; if (c.conf === 'North') n++; }
  if (clean.filter(c => c.conf === 'North').length !== half) return 'Put half the new teams in each conference.';
  const prot = opts.protect != null ? clamp(Math.round(opts.protect), 6, 10) : XPN_PROTECT;
  L.xpnPlan = { s: xpnSeason(L), teams: clean, protect: prot, mine: (L.xpnPlan && L.xpnPlan.mine) || null, made: L.season };
  logNews(L, `League expansion: ${clean.map(c => `${c.city} ${c.name}`).join(', ')} will join ${L.xpnPlan.s === L.season ? 'this offseason' : 'next offseason'}, before free agency.`, null, 'league');
  return null;
}
function xpnCancel(L) { if (!L.xpnPlan) return 'No expansion is planned.'; logNews(L, 'League expansion called off.', null, 'league'); L.xpnPlan = null; return null; }
// who a team can lose: under contract past this season, not a rookie from this draft, not a two-way player
function xpnPool(L, t) { return rosterOf(L, t).filter(p => p.contract && p.contract.exp > L.season && !(p.draft && p.draft.s === L.season) && !p.retired); }
// value a team puts on keeping a player (AI protection) or an expansion team on taking him
function xpnValue(L, p, forNew) {
  const young = p.age <= 24 ? Math.max(0, (p.pot || p.ovr) - p.ovr) * 0.5 : 0, old = p.age >= 31 ? (p.age - 30) * (forNew ? 2.2 : 1.2) : 0;
  const amt = (p.contract && p.contract.amt) || 0, mv = p.mval != null ? p.mval : amt, over = Math.max(0, amt - mv) * (forNew ? 0.5 : 0.25);
  return p.ovr + young - old - over;
}
function xpnAutoProtect(L, t, n) { return xpnPool(L, t).sort((a, b) => xpnValue(L, b, false) - xpnValue(L, a, false)).slice(0, n).map(p => p.id); }
// your protected list (franchise mode): set it on the Expansion page; missing or short lists are filled with your best players
function xpnSetMine(L, ids) {
  if (!L.xpnPlan) return 'No expansion is planned.';
  const t = L.teams[L.user]; if (!t) return null;
  const pool = new Set(xpnPool(L, t).map(p => p.id)), list = [...new Set(ids || [])].filter(id => pool.has(id));
  if (list.length > L.xpnPlan.protect) return `You can protect ${L.xpnPlan.protect} players.`;
  L.xpnPlan.mine = list; return null;
}
function xpnProtected(L, t, n) {
  if (t.id === L.user && L.xpnPlan && L.xpnPlan.mine) { const pool = new Set(xpnPool(L, t).map(p => p.id)), mine = L.xpnPlan.mine.filter(id => pool.has(id)).slice(0, n); if (mine.length < n) for (const id of xpnAutoProtect(L, t, n)) if (mine.length < n && !mine.includes(id)) mine.push(id); return mine; }
  return xpnAutoProtect(L, t, n);
}
// build one new team (everything a team has at the start of a league, plus finances, staff, picks)
function xpnMakeTeam(L, d) {
  const id = L.teams.length;
  const t = { id, city: d.city, name: d.name, abbr: d.abbr, region: d.region, conf: d.conf, market: d.market, c1: d.c1, c2: d.c2, logo: d.logo, coach: null, w: 0, l: 0, hw: 0, hl: 0, aw: 0, al: 0, pf: 0, pa: 0, cw: 0, cl: 0, streak: 0, roster: [], dead: [], mode: 'rebuild', titles: 0, retired: [],
    logoStyle: 'ABC'[id % 3], logoShape: ['shield', 'circle', 'diamond', 'square'][id % 4], xpn: L.season, born: L.season + 1, twoWay: [], scoutAssign: [], coachOwed: [], taxYears: [], finHist: [], sponsorHist: [] };
  L.teams.push(t);
  if (typeof MARKET === 'object') MARKET[t.abbr] = t.market;
  if (!L.coachPool.length) L.coachPool.push(genCoach(usedNames(L)));
  const c = pickCoachFor(L, t);
  L.coachPool = L.coachPool.filter(x => x.id !== c.id); L.coachPool.push(c);
  t.coach = c; hireCoach(L, id, c.id, true);
  L.coachPool.push(genCoach(usedNames(L)));   // keep the pool size
  initFinance(L, t);
  t.cash = 15 + t.market * 10; t.hype = 58 + t.market * 3;   // new-team buzz, less money in the bank
  if (t.owner) { t.owner.trust = 70; t.owner.goal = null; }
  if (t.gm) t.gm.since = L.season + 1;
  ensurePicks(L);
  L.picks = L.picks.filter(k => !(k.orig === id && k.s <= L.season));   // this season's draft is over
  return t;
}
// put new teams into divisions (leagues with divisions): smallest division of the conference
function xpnDivisions(L, news) {
  if (!isBig(L)) return;
  if (!L.divsDone) { L.divsDone = true; for (const t of L.teams) if (!t.div) t.div = divOf(t.abbr); }
  const order = (L.nba && typeof NBA_DIV_ORDER === 'object' ? NBA_DIV_ORDER : DIV_ORDER);
  for (const t of L.teams) if (!t.div || news.includes(t)) {
    if (news.includes(t) && t.div) continue;
    const ds = order[t.conf] || []; if (!ds.length) continue;
    t.div = ds.slice().sort((a, b) => L.teams.filter(x => x.div === a).length - L.teams.filter(x => x.div === b).length)[0];
  }
}
// run it: called at the start of free agency (startFA). Returns the log entry or null.
function xpnRun(L) {
  const P = L.xpnPlan; if (!P || P.s !== L.season) return null;
  L.xpnPlan = null;
  const S = L.season, old = L.teams.slice(), news = P.teams.map(d => xpnMakeTeam(L, d));
  xpnDivisions(L, news);
  // protected lists and the pool
  const lose = Math.max(1, Math.ceil(XPN_PER_DRAFT * news.length / old.length)), taken = {}, prot = {}, avail = [];
  for (const t of old) { prot[t.id] = xpnProtected(L, t, P.protect); taken[t.id] = 0; for (const p of xpnPool(L, t)) if (!prot[t.id].includes(p.id)) avail.push(p); }
  const picks = [], cap = CAP * 0.92, posN = t => { const c = [0, 0, 0, 0, 0]; for (const id of t.roster) c[L.players[id].pos]++; return c; };
  // order: snake, a random team first
  const ord = news.slice().sort(() => R() - 0.5);
  for (let r = 0; r < XPN_PER_DRAFT + 3; r++) {
    const row = r % 2 ? ord.slice().reverse() : ord;
    for (const t of row) {
      if (t.roster.length >= XPN_PER_DRAFT + 2) continue;
      const pay = payroll(L, t), pc = posN(t);
      const c = avail.filter(p => p.team != null && taken[p.team] < lose && L.teams[p.team] && !news.some(n => n.id === p.team) && pay + ((p.contract && p.contract.amt) || 0) <= cap && pc[p.pos] < 4)
        .sort((a, b) => xpnValue(L, b, true) - xpnValue(L, a, true))[0];
      if (!c) continue;
      const from = c.team;
      removeFromTeam(L, c); c.team = t.id; t.roster.push(c.id); taken[from]++;
      c.exT = { tid: from, s: S }; c.morale = Math.max(c.morale || 55, 55); c.tradeReq = null;
      c.tx.push({ s: S, t: `Taken by ${t.abbr} from ${L.teams[from].abbr} in the expansion draft` });
      if (c.contracts && c.contract) c.contracts.push({ s: S, tid: t.id, amt: c.contract.amt, yrs: c.contract.exp - S, type: 'expansion', hg: false });
      assignNumber(L, c, t);
      picks.push({ tid: t.id, pid: c.id, from, name: c.name, ovr: c.ovr, age: c.age, pos: c.pos, no: picks.length + 1 });
      avail.splice(avail.indexOf(c), 1);
    }
  }
  // lost players: teams that lost someone may now need a body (free agency handles it)
  try { computeModes(L, 'Expansion'); } catch (e) { }
  try { setExpectations(L); } catch (e) { }
  for (const t of news) { t.mode = 'rebuild'; try { if (typeof setTeamRoles === 'function') setTeamRoles(L, t); } catch (e) { } }
  const entry = { s: S, teams: news.map(t => t.id), protect: P.protect, lose, picks, mineLost: L.user != null ? picks.filter(x => x.from === L.user).map(x => x.pid) : [] };
  (L.xpnLog || (L.xpnLog = [])).push(entry);
  L.xpnShow = S;
  logNews(L, `Expansion draft: ${news.map(t => `the ${t.city} ${t.name} (${picks.filter(x => x.tid === t.id).length} players)`).join(' and ')} join the league.`, news[0].id, 'league');
  for (const x of picks.filter(x => x.ovr >= 68).slice(0, 6)) logNews(L, `${L.teams[x.tid].abbr} took ${x.name} (${x.ovr}) from ${L.teams[x.from].abbr} in the expansion draft`, x.tid, 'tx');
  if (L.user != null && entry.mineLost.length) logNews(L, `${L.teams[L.user].abbr} lost ${entry.mineLost.map(id => L.players[id].name).join(', ')} in the expansion draft`, L.user, 'team');
  for (const k of Object.keys(LOT_M)) delete LOT_M[k];
  if (typeof PROJ_C !== 'undefined') PROJ_C = null;
  if (L._rc) L._rc = null;
  return entry;
}

// ===== Phase B (Nov 18 2026): difficulty. Easy / Normal / Hard (L.diff, Settings > Game). Normal = the game as before.
// trade: how much more value an AI team wants back from you; owner: how hard your owner's trust drops after a bad season.
const DIFF = { easy: { trade: 0.97, owner: 0.6, n: 'Easy' }, normal: { trade: 1.05, owner: 1, n: 'Normal' }, hard: { trade: 1.15, owner: 1.35, n: 'Hard' } };
function diffK(L) { return DIFF[L && L.diff] || DIFF.normal; }
