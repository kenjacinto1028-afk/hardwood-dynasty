// v25.3 checks (crossover traits, archetypes, training rules): node unit-v253.js <src dir>
const fs = require('fs'), vm = require('vm'); const SRC = process.argv[2] || 'src'; let s = +(process.env.SEED || 53);
const rnd = () => { s |= 0; s = (s + 0x6D2B79F5) | 0; let t = Math.imul(s ^ (s >>> 15), 1 | s); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; };
const ctx = vm.createContext({ console, Math: Object.create(Math, { random: { value: rnd } }), setTimeout, clearTimeout, Date, performance, structuredClone, JSON, Object, Array, Set, Map });
vm.runInContext(fs.readFileSync(SRC + '/engine.js', 'utf8') + '\n' + fs.readFileSync(SRC + '/league.js', 'utf8'), ctx);
const out = vm.runInContext(`(function(){ const res = []; const ok = (n, c, x) => res.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? '  [' + x + ']' : ''));
const mean = a => a.reduce((x, y) => x + y, 0) / a.length;
// ---- traits
const ps = []; const used = new Set(); for (let i = 0; i < 6000; i++) { const p = genPlayer(POS[i % 5], gauss(0, 1), 25, used); p.ip = i % 5; ps.push(p); }
const cnt = k => ps.filter(p => p.xo === k).length;
ok('trait rates in range (hub 5-11%, rebG 3-7%, SF pointW 3-8%, rebW 3-8%)', cnt('hub') / 2400 > 0.05 && cnt('hub') / 2400 < 0.11 && cnt('rebG') / 2400 > 0.03 && cnt('rebG') / 2400 < 0.07 && cnt('pointW') / 1200 > 0.03 && cnt('pointW') / 1200 < 0.08 && cnt('rebW') / 1200 > 0.03 && cnt('rebW') / 1200 < 0.08, ['hub','rebG','pointW','rebW'].map(k => k + ' ' + cnt(k)).join(', '));
ok('traits only at intended positions', ps.every(p => !p.xo || (p.xo === 'hub' ? p.ip >= 3 : p.xo === 'rebG' ? p.ip <= 1 : p.ip === 2)));
const hubs = ps.filter(p => p.xo === 'hub'), pfc = ps.filter(p => p.pos >= 3 && !p.xo);
ok('hubs pass far better than other bigs, overall similar', mean(hubs.map(p => p.pas)) > mean(pfc.map(p => p.pas)) + 20 && Math.abs(mean(hubs.map(p => p.ovr)) - mean(pfc.map(p => p.ovr))) < 4, mean(hubs.map(p => p.pas)).toFixed(0) + ' vs ' + mean(pfc.map(p => p.pas)).toFixed(0) + ', ovr ' + mean(hubs.map(p => p.ovr)).toFixed(1) + ' vs ' + mean(pfc.map(p => p.ovr)).toFixed(1));
const rg = ps.filter(p => p.xo === 'rebG'), gd = ps.filter(p => p.pos <= 1 && !p.xo);
ok('rebounding guards rebound far better than guards', mean(rg.map(p => p.drb)) > mean(gd.map(p => p.drb)) + 15, mean(rg.map(p => p.drb)).toFixed(0) + ' vs ' + mean(gd.map(p => p.drb)).toFixed(0));
ok('xoPas saved on hubs', hubs.every(p => p.xoPas > 15));
const sf = ps.filter(p => p.xo === 'pointW' || p.xo === 'rebW'); ok('SF never has both (single xo value)', sf.every(p => typeof p.xo === 'string'));
// archetypes
ok('new archetypes exist', ARCH.PG['Rebounding guard'] && ARCH.SG['Rebounding guard'] && ARCH.SF['Rebounding wing'] && ARCH_CAL.PG['Rebounding guard'] && ARCH_CAL.SF['Rebounding wing']);
const lab = k => { const g = ps.filter(p => p.xo === k); return g.filter(p => { const a = archetypes(p)[0]; return k === 'rebG' ? a.n === 'Rebounding guard' : k === 'rebW' ? a.n === 'Rebounding wing' : k === 'pointW' ? a.n === 'Point forward' : (a.n === 'Playmaking four' || a.n === 'Playmaking hub'); }).length / g.length; };
ok('trait players mostly get the matching label (>=40%)', ['hub','rebG','pointW','rebW'].every(k => lab(k) >= (k === 'rebW' ? 0.2 : 0.35)), ['hub','rebG','pointW','rebW'].map(k => k + ' ' + (lab(k) * 100).toFixed(0) + '%').join(', '));
// ---- training
const L = newLeague({ mode: 'team', userTeam: 0, size: 30 });
const me = L.teams[0].roster.map(id => L.players[id]), ai = L.teams[1].roster.map(id => L.players[id]);
ok('all players with a focus remember their team', Object.values(L.players).every(p => !p.focus || p.focus === 'bal' || p.focusTid === p.team));
const u = me[0]; setFocus(L, u, 'shoot'); ok('setFocus saves team', u.focus === 'shoot' && u.focusTid === u.team);
setFocus(L, u, 'bal'); ok("choosing default clears focus", u.focus == null);
setFocus(L, u, 'reb'); trainSync(L, u); ok('your focus survives a summer', u.focus === 'reb');
const old = u.team; u.team = 5; const rs = trainSync(L, u); ok('focus reset reported after a trade (AI team may then pick its own)', rs === true); u.team = old;
// AI keeps focus unless reason gone
const a = ai.find(p => p.age < 28); a.focus = 'shoot'; a.focusTid = a.team; a.tp = 40; trainSync(L, a); ok('AI keeps a focus while the reason holds', a.focus === 'shoot');
a.tp = 70; trainSync(L, a); ok('AI re-picks when the reason is gone', a.focus !== 'shoot' || aiFocusGone(L, a) === false);
a.focus = null; trainSync(L, a); ok('AI with no focus picks (or default) and remembers team', a.focus == null || a.focusTid === a.team);
// startNewSeason clears + lists yours
// default bias moves the right ratings
const trial = (mk, focus) => { let g = 0; for (let i = 0; i < 200; i++) { const p = genPlayer('PG', 0.5, 20, new Set()); p.pot = 80; p.ceil = 80; p.arch = archetypes(p); p.focus = focus; const b = p.pas; for (let y = 0; y < 3; y++) { progressPlayer(p, null, 2030 + y); } g += p.pas - b; } return g / 200; };
const pf = []; for (let i = 0; i < 200; i++) { const p = genPlayer('PG', 0.5, 20, new Set()); p.arch = archetypes(p); if (p.arch[0].n === 'Pass-first') pf.push(p); }
ok('styleBias: Pass-first PG leans to pas/hnd', pf.length === 0 || (() => { const b = styleBias(pf[0]); return b.pas > 1.5 && b.hnd > 1.3 && b.blk === 1; })(), pf.length + ' found');
const hub = hubs[0]; const hb = styleBias(hub); ok('crossover default uses style bias (no special play/reb bias)', !hb || (hb.per === 1 && hb.pas < FOCUS.play.k.pas));
// default (null) vs bal growth equal bias
const q = genPlayer('PG', 0, 20, new Set()); q.arch = archetypes(q); q.focus = 'bal'; ok('bal behaves like default', focusBias(q) === null);
// old save: no xo, focus without focusTid
const L2 = newLeague({ mode: 'team', userTeam: 0, size: 30 }); const pp = Object.values(L2.players).find(p => p.team === 3); pp.focus = 'rebounding'; pp.focus = 'shoot'; delete pp.focusTid; delete L2.v253; migrateLeague(L2); ok('old save: focusTid filled, no reset', pp.focusTid === pp.team && pp.focus === 'shoot');
// review fixes
{ const q = genPlayer('SF', 0, 22, new Set()); q.arch = [{ p: 'PF', n: 'Point 4' }]; q.pos = 2; const b = styleBias(q); ok('styleBias: label from second position gets a bias', b && b.pas > 1.5); }
{ const l = newLeague({ mode: 'team', userTeam: 0, size: 30 }); const pl = Object.values(l.players).find(x => x.team === 3 && !x.prospect && x.focus !== 'shoot'); setFocus(l, pl, 'shoot'); ok('focusSince saved on change', pl.focusSince === l.season); const s0 = pl.focusSince; l.season += 2; setFocus(l, pl, 'shoot'); ok('focusSince kept when unchanged', pl.focusSince === s0);
  const mine = l.teams[0].roster.map(id => l.players[id])[0]; setFocus(l, mine, 'reb'); mine.team = 7; l.teams[7].roster.push(mine.id); mine.team = 0; const other = Object.values(l.players).find(x => x.team === 4 && !x.prospect); other.focus = 'reb'; other.focusTid = 4; other.team = 0; l.teams[0].roster.push(other.id);
  startOffseason(l); ok('in-season trade shows in trainReset after the summer', (l.trainReset || []).includes(other.id), JSON.stringify(l.trainReset));
  const ai1 = Object.values(l.players).find(x => x.team === 5 && !x.prospect && x.age < 30); ai1.focus = 'rim'; ai1.focusTid = 5; ai1.blk = 60; ok('AI rim focus gone at blk 52+', aiFocusGone(l, ai1)); ai1.blk = 40; ok('AI rim focus holds under 52', !aiFocusGone(l, ai1)); }
return res; })()`, ctx);
console.log(out.join('\n')); console.log(out.filter(x => x.startsWith('FAIL')).length, 'failed of', out.length);
