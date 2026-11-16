// v28.7 X: extension deadlock check. Every star in an award race on an extension-eligible deal must accept the max,
// and the counter must name an amount that, when offered, is accepted.
const SRC = process.argv[2] || 'src';
const {run} = require('./load.js')(SRC, +(process.env.SEED || 3));
console.log(run(`(()=>{
  const L = newLeague({mode:'team', userTeam:0, nba:true, games:58}); L.sg = 58;
  let n = 0; while (n++ < 400 && (L.phase !== 'regular' || L.day < 30)) simDay(L);
  const out = []; let fail = 0, tried = 0;
  for (const p of Object.values(L.players)) {
    if (p.team == null || !p.contract || p.ovr < 72) continue;
    const c0 = JSON.stringify(p.contract); p.contract.exp = L.season; p.contract.len = Math.max(3, p.contract.len || 0); p.contract.type = 'initial';
    if (!canExtend(L, p)) { p.contract = JSON.parse(c0); continue; }
    const tid = p.team, save = JSON.stringify({ask: p.ask, prefY: p.prefY, insult: p.insult, ext: p.ext, tx: p.tx.length, bet: p.bet});
    const race = awardRace(L, p);
    const q = negotiate(L, p.id, MINSAL, 3, tid, 'extension', null, {quote: 1});
    if (!q || q.quote == null) continue;
    tried++;
    // 1) offer the counter he names for 3 years
    const r1x = negotiate(L, p.id, MINSAL + 0.1, 3, tid, 'extension', null, {});
    const m = r1x.msg && r1x.msg.match(/wants \\$([0-9.]+)M\\/yr for 3/);
    let ok1 = true, r2 = null;
    if (!r1x.ok && m) { r2 = negotiate(L, p.id, +m[1], 3, tid, 'extension', null, {}); ok1 = !!r2.ok || /hard cap|over the/.test(r2.msg || ''); }
    if (r2 && r2.ok) { p.ext = null; L.news && 0; }
    // 2) the max always works
    const r3 = negotiate(L, p.id, r1(maxForTeam(L, p, tid)), 3, tid, 'extension', null, {});
    const ok2 = !!r3.ok || r3.refused || /hard cap|over the/.test(r3.msg || '');
    if (r3.ok) p.ext = null;
    if (!ok1 || !ok2) { fail++; out.push(p.name + (race ? ' [' + race + ']' : '') + ' quote ' + q.quote + ' max ' + maxForTeam(L, p, tid) + ' | counter ' + (m ? m[1] : '-') + ' -> ' + (r2 ? (r2.ok ? 'OK' : r2.msg.slice(0, 90)) : '-') + ' | max -> ' + (r3.ok ? 'OK' : r3.msg.slice(0, 90))); }
    Object.assign(p, JSON.parse(save)); p.ext = undefined; p.contract = JSON.parse(c0);
  }
  return 'eligible tried ' + tried + ', fails ' + fail + '\\n' + out.slice(0, 12).join('\\n');
})()`));
