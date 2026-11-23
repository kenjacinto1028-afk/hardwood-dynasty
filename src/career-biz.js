// My Career: the business side (Nov 23 2026). Logic first (works without the page), UI at the bottom (needs window.PBL).
// Brand value -> endorsements, sneaker deals, social media hype, agent negotiations, rivalry tracker, charity + fan rating.
// State: L.career.biz (every field has a default in carBizInit, so old saves load). Hooks (all guarded with typeof):
//   careerDay (career.js) -> carBizTick; careerDay0 pro loop -> carBizGame; carBigGame -> carBizRivalOn; carScenes -> carBizTopRival.

// ---------- data ----------
const BIZ_SHOE = [
  { k: 'apex', n: 'Apex Footwear', lean: 'money', t: 'The biggest checkbook in the business. Pays the most up front.' },
  { k: 'vanta', n: 'Vanta', lean: 'fans', t: 'Street culture. Your drops go viral and the fans love it.' },
  { k: 'stride', n: 'Strideline', lean: 'perf', t: 'Pays for results: big bonuses for stars and titles.' },
  { k: 'halo', n: 'Halo Athletics', lean: 'legacy', t: 'Builds a brand around one player. Fast track to a signature shoe.' },
  { k: 'north', n: 'Northpeak', lean: 'loyal', t: 'Long deals and fair renewals. They stick with you.' }
];
const BIZ_CAT = {
  drink: { n: 'Sports drink', w: 1.0, fam: 1, br: ['Voltage', 'Glacier Zero', 'Fuelhouse'] },
  tech: { n: 'Headphones', w: 0.9, br: ['Pulse Audio', 'Echo One', 'Sonic Lab'] },
  game: { n: 'Video game', w: 1.1, br: ['Hoop Legends', 'Court Kings', 'Slam Arcade'] },
  auto: { n: 'Cars', w: 1.5, br: ['Ridgeline Motors', 'Aster Auto', 'Northgate Cars'] },
  food: { n: 'Fast food', w: 0.9, fam: 1, br: ['Crispy Bird', 'Burger Barn', 'Taco Tower'] },
  watch: { n: 'Watches', w: 1.2, br: ['Meridian', 'Chronos & Co', 'Tempo Watch'] },
  bank: { n: 'Bank', w: 1.0, fam: 1, br: ['Summit Bank', 'Harbor Trust', 'Keystone Financial'] },
  apparel: { n: 'Apparel', w: 0.8, br: ['Threadline', 'Loomwork', 'Fieldhouse Wear'] },
  phone: { n: 'Phones', w: 1.3, br: ['Orbit Mobile', 'Nova Phones', 'Lumen'] }
};
const BIZ_BONUS = {
  allstar: { n: 'All-Star selection', f: (L, p, B, S) => carAw(p, 'All-Star') > 0 && (p.awards || []).some(a => a.a === 'All-Star' && a.s === S) },
  ppg20: { n: '20+ points a game', f: (L, p, B, S) => { const x = carSeasons(L, p).find(q => q.s === S); return !!x && x.gp >= 20 && x.pts / x.gp >= 20; } },
  title: { n: 'a championship', f: (L, p, B, S) => (p.awards || []).some(a => a.a === 'Champion' && a.s === S) },
  mvp: { n: 'MVP', f: (L, p, B, S) => (p.awards || []).some(a => a.a === 'MVP' && a.s === S) },
  games: { n: '65+ games played', f: (L, p, B, S) => { const x = carSeasons(L, p).find(q => q.s === S); return !!x && x.gp >= 65; } }
};
const BIZ_SOC = {
  highlight: { n: 'Post your highlights', d: 'Best after a big game.', hype: [3, 7], fans: 0.5 },
  bts: { n: 'Behind the scenes', d: 'Locker room, workout, laughs with the guys.', hype: [2, 4], fans: 1, chem: 1 },
  qa: { n: 'Go live: Q&A', d: 'Answer fan questions for an hour.', hype: [2, 5], fans: 1.5 },
  shout: { n: 'Shout out a teammate', d: 'Gives credit away. Teammates notice.', hype: [1, 3], chem: 3 },
  trash: { n: 'Trash talk your rival', d: 'Big hype, big heat. About one in three backfires.', hype: [5, 12], fans: 0, risk: 0.34, heat: 14 }
};
const BIZ_CHARITY = {
  clinic: { n: 'Youth clinic', d: 'Teach kids the game for an afternoon.', cost: 0, love: 0.8, fans: 1.4, hype: 1, once: 0 },
  hospital: { n: 'Hospital visit', d: 'Sign jerseys and visit the children\'s ward.', cost: 0, love: 0.9, fans: 1.2, hype: 0.5, once: 0 },
  food: { n: 'Food drive with teammates', d: 'Bring the team along.', cost: 0.1, love: 1, fans: 1.2, hype: 1, chem: 4, once: 0 },
  court: { n: 'Rebuild a neighborhood court', d: 'New floor, new hoops, your name on the wall.', cost: 0.5, love: 3, fans: 3, hype: 2, once: 1 },
  scholar: { n: 'Scholarship fund', d: 'Pays for college for local kids. Lasting impact.', cost: 1, love: 5, fans: 4, hype: 1, once: 2 },
  game: { n: 'Celebrity charity game', d: 'A star-studded game for a cause. Needs buzz (hype 35+).', cost: 0.3, love: 1.5, fans: 3, hype: 6, need: 35, once: 0 }
};
const bizR = (a, b) => a + R() * (b - a);
const bizK = x => x >= 1 ? money(x) : '$' + Math.round(x * 1000) + 'K';
const bizR05 = x => Math.round(x * 20) / 20;

// ---------- state ----------
function carBizInit(L) {
  const C = L.career; if (!C) return null; if (!C.biz) C.biz = {}; const B = C.biz;
  if (B.hype == null) B.hype = 8; if (B.fans == null) B.fans = 40; if (B.love == null) B.love = 0; if (B.cash == null) B.cash = 0; if (B.earn == null) B.earn = 0; if (B.donated == null) B.donated = 0;
  B.deals = B.deals || []; B.offers = B.offers || []; B.rv = B.rv || {}; B.hist = B.hist || []; B.nid = B.nid || 1; B.wkn = B.wkn || 0; B.posts = B.posts == null ? 2 : B.posts;
  B.ch = B.ch || { n: 0, done: {} }; B.sn = B.sn || { posts: 0, viral: 0, contro: 0 }; B.awN = B.awN || 0; B.lastGid = B.lastGid || 0; B.pgSeen = B.pgSeen || 0; B.fol = B.fol || 0;
  return B;
}
const carBizOn = L => !!(L && L.career && L.career.biz);
function carBizPro(L) { const p = carP(L); return !!p && !p.prospect && (p.team != null || !!p.draft || (p.hist && p.hist.length > 0)); }

// brand value 0-100: what a company sees when it looks at you
function carBizV(L) {
  const p = carP(L), B = carBizInit(L); if (!p) return 0; let lg = 0; try { lg = carLegend(L).v; } catch (e) { }
  const t = p.team != null ? L.teams[p.team] : null;
  const v = 5 + Math.max(0, (p.ovr || 0) - 45) * 0.85 + B.hype * 0.22 + B.fans * 0.14 + lg * 0.25 + Math.min(14, carAw(p, 'All-Star') * 3.5) + carAw(p, 'MVP') * 6 + carAw(p, 'Champion') * 4 + (t ? ((t.market || 2) - 2) * 3 : 0);
  return Math.round(clamp(v, 0, 100));
}
const carBizScale = V => 0.12 + Math.pow(V / 100, 2.2) * 14;
function carBizFollowers(L) { const B = carBizInit(L), V = carBizV(L); return Math.round(4 * Math.exp((B.hype * 0.6 + V * 0.5) / 12) * 10) / 10; }   // thousands
const carBizFolTxt = k => k >= 1000 ? (Math.round(k / 100) / 10) + 'M' : k >= 10 ? Math.round(k) + 'K' : (Math.round(k * 10) / 10) + 'K';
const carBizSlots = L => ({ shoe: 1, brand: carBizV(L) >= 80 ? 4 : 3 });
const carBizAgentFee = L => { const p = carP(L), a = agentOf(L, p); return a ? (a.style === 'tough' ? 0.05 : a.style === 'loyal' ? 0.03 : 0.04) + (a.kind === 'power' ? 0.01 : 0) : 0.04; };
function carBizNote(L, text, cat) {
  const p = carP(L); carLog(L, text);
  try { if (p && p.team != null && typeof logNews === 'function') logNews(L, text, p.team, cat || 'feat', 'car'); } catch (e) { }
}
const carBizKey = L => (L.phase === 'regular' || L.phase === 'playoffs' || L.phase === 'regular-done') ? L.season * 1000 + Math.floor((L.day || 0) / 7) : L.season * 1000 + 500 + Math.max(0, CAR_OFF.indexOf(L.phase));

// ---------- offers ----------
function carBizMakeOffer(L, kind) {
  const p = carP(L), B = carBizInit(L), V = carBizV(L), sc = carBizScale(V); let o;
  if (kind === 'shoe') {
    const used = new Set(B.offers.filter(x => x.kind === 'shoe').map(x => x.co)); const cos = BIZ_SHOE.filter(c => !used.has(c.k)); if (!cos.length) return null;
    const co = pick(cos), pitches = ['standard', 'incentive'];
    if (V >= 55) pitches.push('royalty'); if (V >= 72 && (p.ovr >= 72 || carBizV(L) >= 78)) pitches.push('signature');
    const pitch = co.lean === 'legacy' && pitches.includes('signature') ? 'signature' : pick(pitches);
    let amt = sc * 1.6 * bizR(0.9, 1.1) * (co.lean === 'money' ? 1.12 : 1); let bonus = null, yrs = rint(2, 4);
    if (pitch === 'incentive') { amt *= 0.7; bonus = { k: 'allstar', amt: bizR05(amt * 0.7) }; if (co.lean === 'perf') bonus.amt = bizR05(bonus.amt * 1.5); }
    if (pitch === 'royalty') { amt *= 0.6; yrs = rint(3, 5); }
    if (pitch === 'signature') { amt *= 1.35; yrs = rint(4, 6); }
    if (co.lean === 'loyal') yrs = Math.min(6, yrs + 1);
    o = { kind: 'shoe', co: co.k, name: co.n, cat: 'shoe', pitch, amt: Math.max(0.05, bizR05(amt)), yrs, bonus };
  } else {
    const have = new Set(B.deals.filter(d => d.kind === 'brand').map(d => d.cat).concat(B.offers.filter(x => x.kind === 'brand').map(x => x.cat)));
    const cats = Object.keys(BIZ_CAT).filter(k => !have.has(k)); if (!cats.length) return null; const cat = pick(cats), c = BIZ_CAT[cat];
    const amt = sc * c.w * bizR(0.85, 1.15), yrs = rint(1, 3), bk = pick(['allstar', 'ppg20', 'games', 'title']);
    o = { kind: 'brand', cat, name: pick(c.br), pitch: 'standard', amt: Math.max(0.05, bizR05(amt)), yrs, bonus: R() < 0.6 || V >= 40 ? { k: bk, amt: bizR05(amt * 0.5) } : null };
    if (V < 25) o.bonus = null;
  }
  o.id = B.nid++; o.until = B.wkn + 3; o.cn = 0; o.v = V; B.offers.push(o); return o;
}
// once a week in season, once per offseason step
function carBizOffers(L, force) {
  const B = carBizInit(L); if (!carBizPro(L)) return;
  const V = carBizV(L), S = carBizSlots(L), nShoe = B.deals.filter(d => d.kind === 'shoe').length + B.offers.filter(o => o.kind === 'shoe').length, nBr = B.deals.filter(d => d.kind === 'brand').length + B.offers.filter(o => o.kind === 'brand').length;
  const base = clamp(0.06 + V / 220, 0.06, 0.5) * (L.phase === 'regular' || L.phase === 'playoffs' ? 1 : 1.6) + (force ? 1 : 0);
  if (!B.sawShoe && V >= 8) { B.sawShoe = 1; if (nShoe < S.shoe) carBizMakeOffer(L, 'shoe'); if (nBr < S.brand) carBizMakeOffer(L, 'brand'); return; }   // welcome offers after the draft
  if (nShoe < S.shoe && R() < base * 0.7) carBizMakeOffer(L, 'shoe');
  if (nBr < S.brand && B.offers.filter(o => o.kind === 'brand').length < 3 && R() < base) carBizMakeOffer(L, 'brand');
}
function carBizAccept(L, id) {
  const B = carBizInit(L), p = carP(L), i = B.offers.findIndex(o => o.id === id); if (i < 0) return { err: 'That offer is gone.' }; const o = B.offers[i], S = carBizSlots(L);
  if (B.deals.filter(d => d.kind === o.kind).length >= S[o.kind]) return { err: o.kind === 'shoe' ? 'You already have a sneaker deal.' : 'All your endorsement slots are full.' };
  B.offers.splice(i, 1); const d = { id: o.id, kind: o.kind, co: o.co, name: o.name, cat: o.cat, pitch: o.pitch, amt: o.amt, yrs: o.yrs, yr0: o.yrs, s: L.season, bonus: o.bonus, sig: o.pitch === 'signature', paid: 0 };
  B.deals.push(d); B.hist.push({ s: L.season, t: `Signed with ${d.name}: ${bizK(d.amt)} a year for ${d.yrs} year${d.yrs === 1 ? '' : 's'}` });
  B.hype = clamp(B.hype + (d.kind === 'shoe' ? 4 : 1.5) + (d.sig ? 6 : 0), 0, 100);
  carBizNote(L, d.kind === 'shoe' ? `${p.name} signs ${d.sig ? 'a signature shoe deal' : 'a sneaker deal'} with ${d.name} (${bizK(d.amt)} a year)` : `${p.name} signs an endorsement with ${d.name} (${bizK(d.amt)} a year)`, 'tx'); return { ok: true, d };
}
function carBizDecline(L, id) { const B = carBizInit(L), i = B.offers.findIndex(o => o.id === id); if (i < 0) return { err: 'That offer is gone.' }; B.offers.splice(i, 1); return { ok: true }; }
// the agent pushes for more (once per offer)
function carBizCounterChance(L, o) {
  const p = carP(L), a = agentOf(L, p), V = carBizV(L), k = a ? (a.style === 'tough' ? 0.1 : a.style === 'loyal' ? -0.04 : 0.02) + (a.kind === 'power' ? 0.07 : a.kind === 'boutique' ? 0.02 : 0) : 0;
  return clamp(0.42 + k + (V - 50) / 220 + (carBizInit(L).hype - 30) / 400 - (o.cn || 0) * 0.2, 0.12, 0.85);
}
function carBizCounter(L, id) {
  const B = carBizInit(L), p = carP(L), a = agentOf(L, p), o = B.offers.find(x => x.id === id); if (!o) return { err: 'That offer is gone.' }; if (o.cn >= 1) return { err: 'Your agent already pushed on this one.' };
  o.cn++; const ch = carBizCounterChance(L, o);
  if (R() < ch) { const up = bizR(1.08, 1.2) + (a && a.style === 'tough' ? 0.04 : 0); o.amt = bizR05(o.amt * up); if (o.bonus) o.bonus.amt = bizR05(o.bonus.amt * 1.1); o.until = Math.max(o.until, B.wkn + 2); o.msg = `Your agent got ${o.name} up to ${bizK(o.amt)} a year.`; return { ok: true, up: true, msg: o.msg }; }
  if (R() < clamp(0.3 - (carBizV(L) - 50) / 250, 0.1, 0.4)) { B.offers.splice(B.offers.indexOf(o), 1); return { ok: false, walked: true, msg: `${o.name} pulled the offer. The agent pushed too hard.` }; }
  o.msg = `${o.name} will not move. The offer stands at ${bizK(o.amt)} a year.`; return { ok: false, msg: o.msg };
}
// once a season: ask the agent to shop you around (new offers, a small fee)
function carBizShop(L) {
  const B = carBizInit(L), p = carP(L); if (!carBizPro(L)) return { err: 'Companies talk to you after the draft.' }; if (B.shopS === L.season) return { err: 'Your agent already made calls this season.' };
  const a = agentOf(L, p), ch = clamp(0.55 + (a && a.kind === 'power' ? 0.15 : 0) + (carBizV(L) - 40) / 200, 0.3, 0.92); B.shopS = L.season; let n = 0;
  if (R() < ch) { const S = carBizSlots(L); if (B.deals.filter(d => d.kind === 'shoe').length + B.offers.filter(o => o.kind === 'shoe').length < S.shoe && carBizMakeOffer(L, 'shoe')) n++; for (let i = 0; i < 2; i++) if (B.deals.filter(d => d.kind === 'brand').length + B.offers.filter(o => o.kind === 'brand').length < S.brand && carBizMakeOffer(L, 'brand')) n++; }
  return n ? { ok: true, msg: `${a ? a.name : 'Your agent'} made calls: ${n} new offer${n > 1 ? 's' : ''} on the table.` } : { ok: false, msg: 'Nobody bit this time. Slots are full or the market is quiet.' };
}
function carBizAgentList(L) {
  const p = carP(L), cur = agentOf(L, p); if (!L.agents) return [];
  return L.agents.filter(a => !cur || a.id !== cur.id).sort(() => R() - 0.5).slice(0, 3).map(a => ({ id: a.id, name: a.name, kind: a.kind, style: a.style, txt: (AGENT_STYLE[a.style] || {}).txt || '' }));
}
function carBizAgentSwitch(L, id) {
  const B = carBizInit(L), p = carP(L); if (B.agS === L.season) return { err: 'You already changed agents this season.' }; const a = (L.agents || []).find(x => x.id === id); if (!a) return { err: 'Unknown agent.' };
  const old = agentOf(L, p); p.agent = a.id; B.agS = L.season; B.hist.push({ s: L.season, t: `Hired agent ${a.name}${old ? ' (left ' + old.name + ')' : ''}` }); carLog(L, `You hired ${a.name} as your new agent.`); return { ok: true };
}

// ---------- social media ----------
function carBizPost(L, act) {
  const B = carBizInit(L), p = carP(L), C = L.career, x = BIZ_SOC[act]; if (!x) return { err: 'Unknown post.' };
  if (B.posts <= 0) return { err: 'You posted twice this week already. Come back next week.' };
  const top = carBizTopRival(L), rv = top ? C.biz.rv[top.pid] : null; if (act === 'trash' && !rv) return { err: 'You need a rival first. Play against stars and the heat builds.' };
  if (act === 'highlight' && !(B.lastG && B.lastG.gr >= 3)) return { err: 'No highlights yet. Have a good game first.' };
  B.posts--; B.sn.posts++; let h = bizR(x.hype[0], x.hype[1]);
  if (act === 'highlight') h *= 0.6 + B.lastG.gr * 0.18; if (act === 'trash') h *= 0.9 + rv.heat / 200;
  const viral = R() < 0.05 + B.hype / 1500; if (viral) { h += 10; B.sn.viral++; }
  if (act === 'trash' && R() < x.risk) {   // backfires
    B.sn.contro++; B.hype = clamp(B.hype + h * 0.5, 0, 100); B.fans = clamp(B.fans - bizR(3, 6), 0, 100); C.trust = clamp(C.trust - 2, 0, 100); C.chem = clamp((C.chem || 50) - 3, 0, 100); rv.heat = clamp(rv.heat + x.heat, 0, 100);
    let drop = ''; const fam = B.deals.filter(d => d.kind === 'brand' && BIZ_CAT[d.cat] && BIZ_CAT[d.cat].fam); if (fam.length && R() < 0.4) { const d = pick(fam); B.deals.splice(B.deals.indexOf(d), 1); drop = ` ${d.name} dropped you over the post.`; B.hist.push({ s: L.season, t: `${d.name} dropped you after a controversy` }); }
    const msg = `The post blew up the wrong way. Fans and your coach are not happy.${drop}`; carBizNote(L, `${p.name} apologizes after a trash talk post aimed at ${rv.name}`, 'feat'); return { ok: false, msg, bad: true };
  }
  B.hype = clamp(B.hype + h, 0, 100); if (x.fans) B.fans = clamp(B.fans + x.fans, 0, 100); if (x.chem) C.chem = clamp((C.chem || 50) + x.chem, 0, 100); if (act === 'trash') rv.heat = clamp(rv.heat + x.heat, 0, 100);
  if (viral) carBizNote(L, `${p.name}'s post goes viral`, 'feat');
  return { ok: true, msg: (viral ? 'It went viral! ' : '') + { highlight: 'The clip is everywhere.', bts: 'Fans love the access.', qa: 'The live chat was fun.', shout: 'Your teammate shared it right away.', trash: 'It lit up the timeline. Your rival noticed.' }[act] + ` Hype +${Math.round(h)}.`, h: Math.round(h) };
}

// ---------- charity ----------
function carBizCharityOK(L, k) {
  const B = carBizInit(L), x = BIZ_CHARITY[k]; if (!x) return 'Unknown event.'; if (!carP(L)) return 'No player.';
  if (B.ch.k === carBizKey(L)) return 'You already did an event this week.';
  if (x.once && B.ch.done[k] && L.season - B.ch.done[k] < x.once) return x.once === 1 ? 'You already did this one this season.' : 'You did this one recently. Try again in a couple of seasons.';
  if (x.need && B.hype < x.need) return `Needs hype ${x.need}+ (yours ${Math.round(B.hype)}).`; if (x.cost > B.cash + 1e-9) return `Costs ${bizK(x.cost)}. You have ${bizK(B.cash)} saved.`; return null;
}
function carBizCharity(L, k) {
  const err = carBizCharityOK(L, k); if (err) return { err }; const B = carBizInit(L), p = carP(L), C = L.career, x = BIZ_CHARITY[k];
  B.cash -= x.cost; B.donated += x.cost; B.ch.n++; B.ch.k = carBizKey(L); if (x.once) B.ch.done[k] = L.season;
  const lv = 1 + Math.min(0.4, B.hype / 250); B.love = Math.min(30, B.love + x.love); B.fans = clamp(B.fans + x.fans * lv, 0, 100); B.hype = clamp(B.hype + (x.hype || 0), 0, 100); if (x.chem) C.chem = clamp((C.chem || 50) + x.chem, 0, 100);
  B.hist.push({ s: L.season, t: `${x.n}${x.cost ? ' (' + bizK(x.cost) + ')' : ''}` });
  if (x.love >= 3) carBizNote(L, `${p.name} funds a community project: ${x.n.toLowerCase()}`, 'feat'); else carLog(L, `Community: ${x.n}.`);
  return { ok: true, msg: `${x.n} done. Fans like what they see: fan rating +${Math.round(x.fans * lv * 10) / 10}.` };
}

// ---------- rivals ----------
const BIZ_RV = [[60, 'Arch-rival'], [35, 'Heated rivalry'], [15, 'Rival'], [0, 'Matchup']];
const carBizRvTier = h => (BIZ_RV.find(([m]) => h >= m) || BIZ_RV[3])[1];
function carBizRivals(L) {
  const B = carBizInit(L); return Object.values(B.rv).map(r => { const q = L.players[r.pid]; return Object.assign({}, r, { q, tier: carBizRvTier(r.heat) }); }).filter(r => r.q).sort((a, b) => b.heat - a.heat);
}
function carBizTopRival(L, oppTid) {
  const l = carBizRivals(L).filter(r => r.heat >= 15 && !r.q.retired && (oppTid == null || r.q.team === oppTid)); return l.length ? { pid: l[0].pid, name: l[0].q.name, heat: l[0].heat } : null;
}
function carBizRivalOn(L, oppTid) { const B = carBizOn(L) ? L.career.biz : null; if (!B) return false; return Object.values(B.rv).some(r => r.heat >= 25 && L.players[r.pid] && !L.players[r.pid].retired && L.players[r.pid].team === oppTid); }
function carBizRvTouch(L, q, add, meta) {
  const B = carBizInit(L); let r = B.rv[q.id]; if (!r) r = B.rv[q.id] = { pid: q.id, name: q.name, heat: 0, g: 0, w: 0, dw: 0, dl: 0, mp: 0, tp: 0, s0: L.season, peer: false };
  const before = carBizRvTier(r.heat); r.heat = clamp(r.heat + add, 0, 100); if (meta) Object.assign(r, meta); const after = carBizRvTier(r.heat);
  if (after !== before && r.heat >= 15) { const p = carP(L); carBizNote(L, `${p.name} and ${q.name} are now ${after === 'Rival' ? 'rivals' : after === 'Arch-rival' ? 'arch-rivals' : 'in a heated rivalry'}`, 'feat'); }
  return r;
}
// draft-class peers start as soft rivals
function carBizPeers(L) {
  const p = carP(L), B = carBizInit(L); if (B.peers || !p || !p.draft) return; B.peers = 1; const me = p.draft, idx = x => ((x.rd || 1) - 1) * 100 + (x.no || 1), mi = idx(me);
  const list = Object.values(L.players).filter(q => q.id !== p.id && q.draft && q.draft.s === me.s && !q.retired).sort((a, b) => Math.abs(idx(a.draft) - mi) - Math.abs(idx(b.draft) - mi) || b.ovr - a.ovr).slice(0, 3);
  for (const q of list) carBizRvTouch(L, q, 12, { peer: true });
}
// hook: a pro game he played (called from careerDay0 for every game). side = 0 home / 1 away.
function carBizGame(L, p, g, e, line, side) {
  const B = carBizInit(L); if (e.gid && e.gid > B.lastGid) B.lastGid = e.gid;
  const tbl = [-3, -2, -1, 0, 1, 3, 5, 7], gr = e.gr; let dh = (tbl[gr] || 0) + (e.win ? 0.6 : -0.3) + (line.pts >= 30 ? 2 : 0) + ([line.pts, line.reb, line.ast, line.stl, line.blk].filter(x => x >= 10).length >= 3 ? 3 : 0); if (g.playoff) dh *= 1.5;
  B.hype = clamp(B.hype + dh, 0, 100); B.lastG = { gr, pts: line.pts, win: e.win, s: L.season, d: L.day, opp: e.opp }; B.pgSeen++;
  // rival matchup: same position (else most minutes) on the other side
  const IXm = typeof IX !== 'undefined' ? IX : null; if (!IXm || !g.box) return;
  const rows = g.box.filter(r => r[1] !== side && (r[2 + IXm.min] || 0) >= 14 * 60); if (!rows.length) return;
  const cand = rows.map(r => ({ r, q: L.players[r[0]] })).filter(x => x.q); if (!cand.length) return;
  const same = cand.filter(x => x.q.pos === p.pos), pool = same.length ? same : cand; pool.sort((a, b) => (b.r[2 + IXm.min] || 0) - (a.r[2 + IXm.min] || 0)); const m = pool[0], q = m.q;
  const v = k => m.r[2 + IXm[k]] || 0, his = { pts: v('pts'), reb: v('orb') + v('drb'), ast: v('ast'), stl: v('stl'), blk: v('blk'), tov: v('tov') }, duel = carVal(line) - carVal(his);
  let add = 2.5 + (Math.abs((q.ovr || 0) - (p.ovr || 0)) <= 4 ? 2 : 0) + (g.playoff ? 6 : 0) + (Math.abs(duel) < 6 ? 1.5 : 0) + ((q.ovr || 0) >= 75 ? 1 : 0); if (carBizRvTier((B.rv[q.id] || { heat: 0 }).heat) !== 'Matchup' && B.rv[q.id]) add += 1;
  const r = carBizRvTouch(L, q, add); r.g++; if (e.win) r.w++; r.mp += line.pts; r.tp += his.pts; if (duel > 0) r.dw++; else r.dl++; r.last = { s: L.season, win: e.win, me: line.pts, him: his.pts, d: duel > 0 };
  if (r.heat >= 25 && e.played) { if (duel > 0) { B.hype = clamp(B.hype + 3, 0, 100); L.career.xp += 8; L.career.xpTot += 8; } else B.hype = clamp(B.hype - 1, 0, 100); }
}

// ---------- weekly + season upkeep ----------
function carBizFansTarget(L) {
  const p = carP(L), B = carBizInit(L), t = p.team != null ? L.teams[p.team] : null, gp = t ? t.w + t.l : 0; let lg = 0; try { lg = carLegend(L).v; } catch (e) { }
  return clamp(32 + (gp >= 10 ? (t.w / gp - 0.5) * 36 : 0) + ((p.ovr || 50) - 55) * 0.35 + lg * 0.25 + B.love + (B.hype - 30) * 0.12, 5, 99);
}
function carBizWeek(L) {
  const B = carBizInit(L), p = carP(L); B.wkn++; B.posts = 2; let lg = 0; try { lg = carLegend(L).v; } catch (e) { }
  const floor = Math.round(lg * 0.1 + carBizV(L) * 0.04); B.hype = Math.max(floor, B.hype - 1.5 - B.hype * 0.03);
  B.fans += (carBizFansTarget(L) - B.fans) * 0.08; B.fans = clamp(B.fans, 0, 100);
  for (const k in B.rv) { const r = B.rv[k]; r.heat = Math.max(r.peer ? 8 : 0, r.heat - 1.1); }
  B.offers = B.offers.filter(o => o.until >= B.wkn); B.fol = carBizFollowers(L);
  { const ks = Object.keys(B.rv); if (ks.length > 24) ks.filter(k => !B.rv[k].peer).sort((a, b) => B.rv[a].heat - B.rv[b].heat).slice(0, ks.length - 20).forEach(k => delete B.rv[k]); }
  if (carBizPro(L)) { carBizPeers(L); carBizOffers(L, false); }
  // awards
  const aw = (p.awards || []).filter(a => !a.real && a.s >= L.career.s0).length; if (aw > B.awN) { B.hype = clamp(B.hype + (aw - B.awN) * 8, 0, 100); B.awN = aw; }
}
function carBizSettle(L) {
  const B = carBizInit(L), p = carP(L), S = L.season; if (B.paid === S || !carBizPro(L)) return; B.paid = S;
  const fee = carBizAgentFee(L); let gross = 0, lines = [];
  for (const d of B.deals.slice()) {
    let amt = d.amt, extra = 0; if (d.pitch === 'royalty') extra = amt * B.hype / 100 * 0.9;
    if (d.bonus && BIZ_BONUS[d.bonus.k]) { let ok = false; try { ok = BIZ_BONUS[d.bonus.k].f(L, p, B, S); } catch (e) { } if (ok) { extra += d.bonus.amt; lines.push(`${d.name} bonus for ${BIZ_BONUS[d.bonus.k].n}: ${bizK(d.bonus.amt)}`); } }
    const co = BIZ_SHOE.find(c => c.k === d.co); if (co && co.lean === 'fans') B.fans = clamp(B.fans + 1, 0, 100);
    amt += extra; gross += amt; d.paid = (d.paid || 0) + amt; d.yrs--;
    if (d.yrs <= 0) { B.deals.splice(B.deals.indexOf(d), 1); B.hist.push({ s: S, t: `${d.name} deal ended` });
      const V = carBizV(L); if (R() < 0.7) { const o = Object.assign({}, d, { id: B.nid++, until: B.wkn + 6, cn: 0, v: V, renew: true, yrs: rint(1, 3), amt: bizR05(Math.max(0.05, carBizScale(V) * (d.kind === 'shoe' ? 1.6 : (BIZ_CAT[d.cat] || { w: 1 }).w) * bizR(0.95, 1.12) * (d.pitch === 'royalty' ? 0.6 : d.pitch === 'signature' ? 1.35 : 1))), bonus: d.bonus ? { k: d.bonus.k, amt: bizR05(d.bonus.amt) } : null }); delete o.paid; delete o.yr0; delete o.s; B.offers.push(o); } }
  }
  const net = gross * (1 - fee); B.cash += net; B.earn += net; B.sn.last = { s: S, gross, net, fee: gross - net, lines }; B.hist.push({ s: S, t: `Season income: ${bizK(net)} after the agent's ${Math.round(fee * 100)}% (${bizK(gross)} gross)` }); B.love *= 0.92;
  if (gross > 0) carLog(L, `Off-court income this season: ${bizK(net)}.`);
  B.ch.seasonN = 0;
}
// engine hook (end of every sim day, after careerDay0)
function carBizTick(L) {
  if (!carOn(L)) return; const B = carBizInit(L), key = carBizKey(L); if (B.key !== key) { const first = B.key == null; B.key = key; if (first) B.fol = carBizFollowers(L); else if (L.phase === 'regular' || L.phase === 'playoffs' || L.phase === 'regular-done') carBizWeek(L); else if (carBizPro(L)) { carBizPeers(L); carBizOffers(L, false); B.fol = carBizFollowers(L); } }
  if (L.phase && L.phase.startsWith('off')) { if (!B.sawShoe || B.paid !== L.season) { try { carBizSettle(L); } catch (e) { console.error(e); } } }
}

// ---------- achievements (added to the career list) ----------
if (typeof CAR_ACH !== 'undefined') CAR_ACH.push(
  { k: 'firstdeal', n: 'Brand name', t: 'Sign your first endorsement', xp: 30, f: (L, p, C) => !!(C.biz && C.biz.hist.some(h => /^Signed with/.test(h.t))) },
  { k: 'sigshoe', n: 'Signature shoe', t: 'Get your own sneaker', xp: 90, f: (L, p, C) => !!(C.biz && C.biz.deals.some(d => d.sig)) || !!(C.biz && C.biz.hist.some(h => /signature/i.test(h.t))) },
  { k: 'earn10', n: 'Moneymaker', t: 'Earn $10M off the court', xp: 60, f: (L, p, C) => !!(C.biz && C.biz.earn >= 10) },
  { k: 'viral', n: 'Gone viral', t: 'Have a post go viral', xp: 30, f: (L, p, C) => !!(C.biz && C.biz.sn.viral > 0) },
  { k: 'charity10', n: 'Community hero', t: 'Do 10 community events', xp: 70, f: (L, p, C) => !!(C.biz && C.biz.ch.n >= 10) },
  { k: 'fans90', n: 'Fan favorite', t: 'Reach a fan rating of 90', xp: 80, f: (L, p, C) => !!(C.biz && C.biz.fans >= 90) },
  { k: 'archrival', n: 'Arch-rival', t: 'Build a rivalry to the top tier', xp: 60, f: (L, p, C) => !!(C.biz && Object.values(C.biz.rv).some(r => r.heat >= 60)) }
);
if (typeof module !== 'undefined') module.exports = { BIZ_SHOE, BIZ_CAT, BIZ_SOC, BIZ_CHARITY, carBizInit, carBizV, carBizTick, carBizOffers, carBizAccept, carBizCounter, carBizPost, carBizCharity, carBizRivals, carBizSettle };
