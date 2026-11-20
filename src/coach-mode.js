// Play as coach mode (Nov 20 2026). You are the head coach of one team; an AI general manager runs the roster
// (trades, signings, draft, re-signs). You set lineups, playbooks, sliders and coach games live.
// The GM and owner judge you: job security, hot seat, firing, and job offers from other teams.
// State: L.mode = 'coach', L.cm = { tid, cid, jobless, offers[], offS, warn{}, fired[], pop, log[] }; your coach object has c.user = true.
// How the AI runs your roster: every league step (sim a day, draft, free agency, offseason) runs with L.user = null,
// so the league treats your team like any AI team; the engine still uses your lineup and playbook (lgU in engine.js).

// ---------- logic ----------
const CM_FX = { sec0: 62, offMax: 3, yrs: 3 };
const cmOn = L => !!(L && L.mode === 'coach' && L.cm);
const cmTeam = L => cmOn(L) && !L.cm.jobless ? L.teams[L.cm.tid] : null;
function cmCoach(L) { if (!cmOn(L)) return null; const id = L.cm.cid; for (const t of L.teams) if (t.coach && t.coach.id === id) return t.coach; return (L.coachPool || []).find(c => c.id === id) || null; }

// Start: take over the team's bench. The old coach goes to the pool; the team keeps (or gets) an AI GM.
function cmBegin(L, tid, name) {
  const t = L.teams[tid], old = t.coach;
  const c = genCoach(usedNames(L), true);
  c.user = true; c.age = 38; c.name = (name || '').trim().slice(0, 40) || 'You';
  c.ro = 60; c.rd = 60; c.rdev = 60; c.pot = 80; coachDerive(c);
  c.off = old.off; c.def = old.def; c.pace = old.pace; c.depth = old.depth; c.rot = old.rot; c.youth = old.youth || 0;
  c.sl = old.sl ? Object.assign({}, old.sl) : null; c.slFor = old.slFor; if (!c.sl) slSeed(c, 0);
  old.stints[old.stints.length - 1].to = L.season; old.contract = null; L.coachPool.push(old);
  L.coachPool.push(c); hireCoach(L, tid, c.id, true, CM_FX.yrs);
  t.coachOwed = []; t.coachFired = null;
  L.user = tid; L.mode = 'coach'; L.me = null; L.jobless = false; L.jobOffers = [];
  if (!t.gm) { t.gm = genGM(L); t.gm.since = L.season - rint(0, 4); }
  L.cm = { tid, cid: c.id, jobless: false, offers: [], offS: null, warn: {}, fired: [], pop: null, log: [{ s: L.season, t: `Hired as head coach of the ${t.city} ${t.name}` }], s0: L.season };
  logNews(L, `The ${t.city} ${t.name} hired ${c.name} as head coach`, tid, 'coach');
  return c;
}

// Run a league step as if your team were AI-run (the GM makes the roster calls), then check your job.
function cmAI(L, f) {
  if (!cmOn(L) || L.cm.ai) return f();
  const u = L.user; L.cm.ai = 1; L.user = null;
  try { return f(); }
  finally { delete L.cm.ai; L.user = u; try { cmAfter(L); } catch (e) { console.error('cmAfter', e); } }
}
// wrap the league's step functions (they are plain globals)
const CM_WRAP = ['simDay', 'simPlayoffDay', 'startPlayoffs', 'startOffseason', 'runLottery', 'startDraft', 'aiDraftPick', 'startFA', 'faDay', 'startNewSeason'];
for (const k of CM_WRAP) { const f = globalThis[k]; if (typeof f === 'function' && !f.cmW) { const w = function (L, ...a) { return cmAI(L, () => f.call(this, L, ...a)); }; w.cmW = 1; globalThis[k] = w; } }

// Job security 0-100 (100 = untouchable). Same factors the AI uses to judge its coaches, read live during the season.
function cmSecurity(L) {
  const t = cmTeam(L), c = cmCoach(L); if (!t || !c) return null;
  const g = t.w + t.l, wp = g ? t.w / g : 0.5, ex = t.expW != null ? t.expW : 0.5, perf = (wp - ex) * Math.min(1, g / 20);
  let h = Math.max(0, -perf - 0.04) * 5, why = [];
  if (perf < -0.04) why.push(`Below what the GM expected (${Math.round(ex * SEASON_GAMES)} wins pace)`);
  const done = ['season-done'].includes(L.phase) || L.phase.startsWith('off');
  if (done && L.po) { const po = poResult(L, t.id); if (/Missed|play-in/.test(po) && t.expMode === 'contend') { h += 0.3; why.push('Missed the playoffs with a contender'); } }
  const mine = (c.seasons || []).filter(x => x.tid === t.id && !x.mid);
  let streak = 0; for (let i = mine.length - 1; i >= 0; i--) { const x = mine[i]; if (x.exp != null && x.w / Math.max(1, x.w + x.l) - x.exp < -0.05) streak++; else break; }
  if (streak) { h += streak * 0.12; why.push(`${streak} season${streak > 1 ? 's' : ''} in a row below expectations`); }
  const st = c.stints[c.stints.length - 1];
  if (st && st.from >= L.season) { h -= 0.25; why.push('First season on the job (grace period)'); }
  if (mine.some(x => x.s >= L.season - 2 && x.po === 'Champion')) { h -= 0.6; why.push('Recent title'); }
  else if (mine.some(x => x.s >= L.season - 1 && x.po === 'Lost in Finals')) { h -= 0.25; why.push('Recent Finals run'); }
  if (perf > 0.05) { h -= 0.2; why.push('Beating expectations'); }
  const left = coachYrsLeft(L, c); h -= left * 0.06; if (left >= 2) why.push(`${left} years left on your deal`);
  if (t.gm && t.gm.since != null && t.gm.since >= L.season) { h += 0.08; why.push('A new GM wants his own coach'); }
  h = clamp(h, 0, 0.9);
  const v = Math.round(clamp(100 - h / 0.9 * 100, 0, 100));
  return { v, h, why, tier: v >= 70 ? 'Secure' : v >= 45 ? 'Stable' : v >= 25 ? 'Hot seat' : 'On thin ice' };
}

// Your reputation as a coach (0-100): wins, playoff runs, titles; firings hurt. Better teams only call strong reputations.
function cmRep(L) {
  const c = cmCoach(L); if (!c) return 45;
  const ss = (c.seasons || []).filter(x => x.w + x.l > 0);
  if (!ss.length) return 45;
  const w = ss.reduce((a, x) => a + x.w, 0), l = ss.reduce((a, x) => a + x.l, 0), wp = w / Math.max(1, w + l);
  const po = ss.filter(x => !/Missed|play-in|Fired|—/.test(x.po || '')).length, deep = ss.filter(x => /Finals|conference/i.test(x.po || '') || x.po === 'Champion').length;
  const beat = ss.filter(x => x.exp != null && x.w / Math.max(1, x.w + x.l) - x.exp > 0.05).length;
  return Math.round(clamp(40 + (wp - 0.5) * 110 + po * 4 + deep * 4 + (c.titles || 0) * 12 + beat * 3 - L.cm.fired.length * 7, 5, 99));
}

// After every step: were you fired? a warning from the GM? job offers in the offseason?
function cmAfter(L) {
  const cm = L.cm; if (!cm) return;
  const c = cmCoach(L);
  if (!cm.jobless && c && L.teams[cm.tid].coach !== c) cmFired(L, c);
  if (cm.jobless) { if (L.auto) L.auto.user = null; else L.user = null; }
  const t = cmTeam(L);
  // in-season: GM warnings, and a GM who runs out of patience
  if (t && L.phase === 'regular') {
    const s = cmSecurity(L), k = L.season;
    cm.warn = cm.warn && cm.warn.s === k ? cm.warn : { s: k };
    if (s && t.w + t.l >= 12) {
      if (s.v < 45 && !cm.warn.hot) { cm.warn.hot = 1; cmNews(L, `GM ${gmName(t)}: "We expected more than ${t.w}-${t.l}. Turn this around." You're on the hot seat.`); cm.pop = cm.pop || { k: 'warn', s: k, v: s.v }; }
      if (s.v < 25 && !cm.warn.ice) { cm.warn.ice = 1; cmNews(L, `Reports: the ${t.name} are already calling other coaches. Your job is on thin ice.`); cm.pop = { k: 'warn', s: k, v: s.v, ice: 1 }; }
      const T = totalDays(L);
      if ([0.45, 0.65].some(f => L.day === Math.floor(T * f)) && s.v < 15 && t.coachFired !== L.season && c.stints[c.stints.length - 1].from < L.season && R() < 0.45) {
        const rec = `${t.w}-${t.l}`; fireCoach(L, t); const nc = affordableCoach(L, t, c.id) || makeInterim(L, t); hireCoach(L, t.id, nc.id, true);
        logNews(L, `The ${t.city} ${t.name} fired head coach ${c.name} (${rec}); ${nc.name} takes over`, t.id, 'coach');
        cmFired(L, c);
        if (L.auto) L.auto.user = null; else L.user = null;
      }
    }
  }
  // offseason: job offers (once per offseason, after the coaching carousel)
  if (L.phase.startsWith('off') && cm.offS !== L.season) { cm.offS = L.season; cm.offers = cmMakeOffers(L); if (cm.offers.length) { cm.pop = { k: 'offers', s: L.season, n: cm.offers.length }; cmNews(L, `${cm.offers.length} team${cm.offers.length > 1 ? 's want' : ' wants'} to talk to you about their head coaching job`); } }
  if (!L.phase.startsWith('off') && cm.offers.length) cm.offers = [];
}
const gmName = t => t.gm ? t.gm.name : 'the front office';
function cmNews(L, text) { logNews(L, text, L.cm.jobless ? null : L.cm.tid, 'coach'); }
function cmFired(L, c) {
  const cm = L.cm, t = L.teams[cm.tid];
  cm.jobless = true; cm.fired.push({ s: L.season, tid: t.id, ph: L.phase }); cm.log.push({ s: L.season, t: `Fired by the ${t.city} ${t.name}` });
  if (!L.coachPool.includes(c)) L.coachPool.push(c);
  t.manual = null;
  cm.pop = { k: 'fired', s: L.season, tid: t.id };
  cmNews(L, `You were fired as head coach of the ${t.city} ${t.name}`);
}
// Openings: teams that changed coaches this offseason; a jobless coach always gets at least the worst opening
function cmMakeOffers(L) {
  const cm = L.cm, rep = cmRep(L), n = L.teams.length, cs = capSeason(L);
  const rank = L.teams.map(t => t.id).sort((a, b) => teamStrength(L, L.teams[b]) - teamStrength(L, L.teams[a]));
  const need = tid => 78 - rank.indexOf(tid) / Math.max(1, n - 1) * 62;   // best team needs ~78, worst ~16
  let open = L.teams.filter(t => t.id !== (cm.jobless ? -1 : cm.tid) && t.coach && !t.coach.user && (t.coachSince === cs || t.coach.interim));
  const last = cm.fired.slice(-1)[0]; if (last && last.s >= L.season - 1) open = open.filter(t => t.id !== last.tid);   // not the team that just fired you
  let offers = open.filter(t => rep >= need(t.id)).sort((a, b) => rank.indexOf(a.id) - rank.indexOf(b.id)).slice(0, CM_FX.offMax);
  if (!cm.jobless) offers = offers.filter(t => rank.indexOf(t.id) < rank.indexOf(cm.tid) || rep >= 70).slice(0, 2);   // employed: only better jobs call
  if (cm.jobless && !offers.length) {
    const pool = (open.length ? open : L.teams.filter(t => !t.coach.user && (t.coachFired == null || t.coachFired < L.season))).slice().sort((a, b) => rank.indexOf(b.id) - rank.indexOf(a.id));
    const pickT = pool.find(t => !last || t.id !== last.tid) || pool[0]; if (pickT) offers = [pickT];
  }
  const c = cmCoach(L);
  return offers.map(t => { const yrs = rep >= 70 ? 4 : 3; return { tid: t.id, yrs, amt: c ? coachAmtFor(L, c, t, yrs) : 2, need: Math.round(need(t.id)), rank: rank.indexOf(t.id) + 1 }; });
}
// Take a job: the team's coach steps aside, your old team (if any) hires a replacement
function cmTakeJob(L, tid) {
  const cm = L.cm, o = (cm.offers || []).find(x => x.tid === tid); if (!o) return 'That offer is gone.';
  const c = cmCoach(L), T = L.teams[tid], cs = capSeason(L);
  if (!cm.jobless) {
    const t0 = L.teams[cm.tid]; c.stints[c.stints.length - 1].to = L.season; c.contract = null; L.coachPool.push(c);
    const nc = affordableCoach(L, t0, c.id) || makeInterim(L, t0); hireCoach(L, t0.id, nc.id, true); t0.manual = null;
    logNews(L, `${c.name} left the ${t0.name} for the ${T.city} ${T.name}; ${nc.name} takes over in ${t0.city}`, t0.id, 'coach');
  }
  const old = T.coach;
  if (T.coachSince === cs) { old.stints.pop(); old.contract = null; L.coachPool.push(old); } else fireCoach(L, T);
  if (!L.coachPool.includes(c)) L.coachPool.push(c);
  hireCoach(L, tid, c.id, true, o.yrs);
  T.manual = null; T.coachFired = null;
  cm.tid = tid; cm.jobless = false; cm.offers = []; cm.pop = null; cm.warn = {};
  cm.log.push({ s: L.season, t: `Hired by the ${T.city} ${T.name} (${o.yrs} yr, ${money(c.contract.amt)}/yr)` });
  L.user = tid;
  logNews(L, `The ${T.city} ${T.name} hired ${c.name} as head coach`, tid, 'coach');
  return null;
}
// Stay put (employed) or keep waiting (jobless)
function cmDecline(L, tid) { L.cm.offers = (L.cm.offers || []).filter(x => x.tid !== tid); }
// Career summary for the coach page
function cmCareer(L) {
  const c = cmCoach(L); if (!c) return null;
  const ss = (c.seasons || []).filter(x => x.w + x.l > 0);
  const w = ss.reduce((a, x) => a + x.w, 0), l = ss.reduce((a, x) => a + x.l, 0);
  return { c, ss, w, l, po: ss.filter(x => !/Missed|play-in|Fired|—/.test(x.po || '')).length, titles: c.titles || 0, rep: cmRep(L), fired: L.cm.fired.length };
}

// ---------- UI (needs app.js: window.PBL) ----------
const CMUI = (function () {
  if (typeof window === 'undefined' || !window.PBL) return null;
  const P = window.PBL, esc = P.esc;
  window.P3V = window.P3V || {};
  const Lg = () => P.L;
  const tl = tid => `<a class="lk" href="#teams" data-team="${tid}">${P.logo(tid, 18)} ${esc(P.tname(tid))}</a>`;
  const TIER_CLS = { Secure: 'ok', Stable: 'mid', 'Hot seat': 'hot', 'On thin ice': 'ice' };
  const pending = () => { const L = Lg(); return !!(cmOn(L) && L.cm.pop && !L.auto); };

  function meter(s) {
    return `<div class="cm-meter cm-${TIER_CLS[s.tier]}" role="img" aria-label="Job security ${s.v} of 100, ${s.tier}"><div class="cm-bar"><i style="width:${Math.max(3, s.v)}%"></i></div><div class="cm-mv"><strong>${s.v}</strong><span>${s.tier}</span></div></div>`;
  }
  function offersPanel(L) {
    const of = L.cm.offers || []; if (!of.length) return '';
    return `<section class="panel cm-offers"><h3>Job offers <span class="muted" style="font-weight:400;font-size:13px">${L.cm.jobless ? 'Pick your next team' : 'Better jobs are calling. Stay, or move on.'}</span></h3><div class="tblwrap"><table><thead><tr><th>Team</th><th class="num">Last season</th><th class="num">Roster rank</th><th class="num">Years</th><th class="num">Per year</th><th></th></tr></thead><tbody>${of.map(o => { const t = L.teams[o.tid]; return `<tr><td>${tl(o.tid)}</td><td class="num">${t.w}-${t.l}</td><td class="num">#${o.rank}</td><td class="num">${o.yrs}</td><td class="num">${money(o.amt)}</td><td class="cm-act"><button class="sm primary" data-cmtake="${o.tid}">Take job</button><button class="sm" data-cmno="${o.tid}">No thanks</button></td></tr>`; }).join('')}</tbody></table></div></section>`;
  }
  function careerPanel(L) {
    const k = cmCareer(L); if (!k) return '';
    const rows = k.ss.slice().reverse().map(x => `<tr><td>${seasonName(x.s)}</td><td>${tl(x.tid)}</td><td class="num">${x.w}-${x.l}</td><td class="num">${x.exp != null ? Math.round(x.exp * (x.w + x.l)) : '—'}</td><td>${esc(x.po || '—')}</td></tr>`).join('');
    const tot = k.w + k.l ? (k.w / (k.w + k.l)).toFixed(3).replace(/^0/, '') : '—';
    return `<section class="panel"><h3>Coaching career</h3><div class="cm-stats"><div><span>Record</span><strong>${k.w}-${k.l}</strong><em>${tot}</em></div><div><span>Playoff trips</span><strong>${k.po}</strong></div><div><span>Titles</span><strong>${k.titles}</strong></div><div><span>Reputation</span><strong>${k.rep}</strong><em>of 100</em></div><div><span>Times fired</span><strong>${k.fired}</strong></div></div>
      ${rows ? `<div class="tblwrap"><table class="sortable" data-sid="cmcar"><thead><tr><th>Season</th><th>Team</th><th class="num">W-L</th><th class="num">Expected W</th><th>Playoffs</th></tr></thead><tbody>${rows}</tbody></table></div>` : '<p class="muted">No finished seasons yet. Your first one is under way.</p>'}
      <h4 style="margin:14px 0 6px">Timeline</h4><ul class="cm-log">${L.cm.log.slice().reverse().map(x => `<li><span class="muted">${seasonName(x.s)}</span> ${esc(x.t)}</li>`).join('')}</ul></section>`;
  }
  window.P3V.cmjob = function () {
    const L = Lg(); if (!cmOn(L)) return '<section class="panel"><p class="muted">This page is for Head Coach leagues.</p></section>';
    const c = cmCoach(L), t = cmTeam(L);
    if (!t) {
      const last = L.cm.fired.slice(-1)[0];
      return `<section class="panel cm-hero cm-jobless"><div><h2>Between jobs</h2><p class="muted">${esc(c ? c.name : 'You')}${last ? ` · fired by the ${esc(L.teams[last.tid].name)} in ${seasonName(last.s)}` : ''}</p><p>Keep simming. Teams that change coaches in the offseason will call you. A better reputation brings better teams.</p></div></section>${offersPanel(L)}${careerPanel(L)}`;
    }
    const s = cmSecurity(L), gm = t.gm, left = coachYrsLeft(L, c), g = t.w + t.l, exW = t.expW != null ? Math.round(t.expW * SEASON_GAMES) : null;
    const hero = `<section class="panel cm-hero"><div class="cm-id">${P.logo(t.id, 56)}<div><h2>${esc(c.name)}</h2><p class="muted">Head coach · ${tl(t.id)} · ${t.w}-${t.l}${g ? ` (${(t.w / g).toFixed(3).replace(/^0/, '')})` : ''}</p><p class="muted">${c.contract ? `${left} yr left · ${money(c.contract.amt)}/yr` : 'No contract'} · Coach rating ${c.ovr}</p></div></div>
      <div class="cm-sec"><h3>Job security</h3>${meter(s)}<ul class="cm-why">${s.why.map(w => `<li>${esc(w)}</li>`).join('') || '<li>Nothing unusual. Keep winning.</li>'}</ul></div></section>`;
    const gmP = `<section class="panel"><h3>Your general manager</h3><p><strong>${gm ? `<a class="lk" href="#coaches" data-gm="${gm.id}">${esc(gm.name)}</a>` : 'The front office'}</strong>${gm && gm.since != null ? ` <span class="muted">· GM since ${seasonName(gm.since)}</span>` : ''}</p><p>The GM makes the trades, signings, re-signs and draft picks. You set the lineup, minutes, playbook and coaching style, and you coach games live.</p><div class="cm-kv"><div><span>Team plan</span><strong>${esc((typeof MODE_LABEL !== 'undefined' && MODE_LABEL[t.mode]) || t.mode || '—')}</strong></div><div><span>Expected wins</span><strong>${exW != null ? exW : '—'}</strong></div><div><span>Preseason rank</span><strong>${t.expRank ? '#' + t.expRank : '—'}</strong></div></div>
      <p class="row" style="margin-top:10px"><a class="lk" href="#myteam">Lineup & minutes</a> · <a class="lk" href="#" data-coach="${c.id}">Coaching style & sliders</a> · <a class="lk" href="#trades">GM's trades</a></p></section>`;
    return hero + offersPanel(L) + gmP + careerPanel(L);
  };

  function popDialog() {
    const L = Lg(); if (!cmOn(L) || !L.cm.pop) return; const x = L.cm.pop; L.cm.pop = null; P.save();
    const t = x.tid != null ? L.teams[x.tid] : cmTeam(L);
    let h;
    if (x.k === 'fired') h = `<div class="cm-pop cm-pop-fired"><div class="cm-pop-ic">📋</div><h2>You're fired</h2><p>The ${esc(t.city)} ${esc(t.name)} have let you go. Clean out your office, then keep simming: teams that need a coach will call in the offseason.</p>`;
    else if (x.k === 'offers') h = `<div class="cm-pop"><div class="cm-pop-ic">📞</div><h2>Your phone is ringing</h2><p>${x.n} team${x.n > 1 ? 's want' : ' wants'} to interview you for a head coaching job.</p>`;
    else h = `<div class="cm-pop cm-pop-warn"><div class="cm-pop-ic">🔥</div><h2>${x.ice ? 'On thin ice' : 'Hot seat'}</h2><p>${t ? `GM ${esc(gmName(t))} is not happy with ${t.w}-${t.l}.` : ''} Job security is down to ${x.v}. Win now, or you may be replaced.</p>`;
    P.dialog(h + `<div class="row" style="justify-content:center;margin-top:14px"><a class="lk btn primary" href="#cmjob" data-cmclose="1">Open My job</a><button data-cmclose="1">Close</button></div></div>`);
  }

  // GM-only actions are off: your GM makes roster moves
  const GM_ONLY = '[data-tradefor],[data-tradeforpick],[data-tradepick],[data-offer],[data-sign],[data-nego],[data-release],[data-confirm-release],[data-cut],[data-draft],[data-hire],[data-hirec],[data-hires],[data-interim],[data-firecoach],[data-hirescout],[data-firescout],[data-scouthire],[data-signall],[data-r2],[data-topt],[data-optgo],[data-extgo],[data-snt],[data-sntok],[data-buyterms],[data-confirm-buyout],[data-fatalk],[data-pacc],[data-pload],[data-accept],[data-counter],[data-rfa],[data-callup],[data-twconv],[data-twcut],[data-takejob],[data-block],[data-protect],#propose,#t3-propose,#t3-confirm,#tconfirm,#resign,#autofill,#askprops,#setprice,#mktprice';
  let toastT = null;
  function toast(msg) { let el = document.getElementById('cm-toast'); if (!el) { el = document.createElement('div'); el.id = 'cm-toast'; el.className = 'cm-toast'; el.setAttribute('role', 'status'); document.body.appendChild(el); } el.textContent = msg; el.classList.add('on'); clearTimeout(toastT); toastT = setTimeout(() => el.classList.remove('on'), 2600); }
  document.addEventListener('click', e => {
    const L = Lg(); if (!cmOn(L)) return;
    const b = e.target.closest(GM_ONLY);
    if (b && !e.target.closest('#cm-ok')) { e.preventDefault(); e.stopImmediatePropagation(); toast('You are the coach. Your GM makes trades, signings and draft picks.'); return; }
    const a = e.target.closest('[data-cmtake],[data-cmno],[data-cmclose]'); if (!a) return;
    const d = a.dataset;
    if (d.cmclose) { P.closeDialog(); if (a.getAttribute('href')) return; return; }
    e.preventDefault();
    if (d.cmtake) { const err = cmTakeJob(L, +d.cmtake); if (err) toast(err); else toast(`Welcome to the ${L.teams[+d.cmtake].name}.`); P.save(); location.hash = '#cmjob'; P.render(); return; }
    if (d.cmno) { cmDecline(L, +d.cmno); P.save(); P.render(); }
  }, true);
  return { pending, popDialog };
})();
if (typeof window !== 'undefined') { window.CMUI = CMUI; window.cmBegin = cmBegin; }
