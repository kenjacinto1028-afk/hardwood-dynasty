// v29: node tools/t29.js [quick] -> Draft pipeline lite. SEED=n (default 3) for the full-season part. "quick" skips the full season.
// A: class mix 70/25/5, college years, 4 classes ahead, NBA real schools, spec data. B: role averages vs spec, spread, leaders, stat-vs-rating r,
// playoffs, awards. C: old-save migration. D: one full season (autopilot): call-ups, honors kept after the draft, undrafted lines, save size, offseason time.
const load = require('./load.js'), SRC = process.env.SRC || 'src';
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const cor = (a, b) => { const n = a.length, ma = a.reduce((x, y) => x + y, 0) / n, mb = b.reduce((x, y) => x + y, 0) / n; let sab = 0, saa = 0, sbb = 0; for (let i = 0; i < n; i++) { sab += (a[i] - ma) * (b[i] - mb); saa += (a[i] - ma) ** 2; sbb += (b[i] - mb) ** 2; } return sab / Math.sqrt(saa * sbb); };
const SPEC_AW = {   // PIPELINE-SPEC.md, word for word
  NCHF: ['The Founders Cup', 'National Player of the Year (The Sterling-Vance Trophy)', 'National Freshman of the Year (The Redshirt-to-Star Award)', 'National Defensive Player of the Year (The Iron Rim Trophy)', 'Sixth Man of the Year (The Sparkplug Award)', 'All-NCHF First Team', 'All-NCHF Second Team', 'NCHF All-Freshman Team', 'NCHF All-Defensive Team', 'Conference Player of the Year', 'Freshman of the Year', 'All-Conference First Team', 'All-Conference Second Team'],
  EABL: ['The EABL Crown', 'EABL Season MVP', 'EABL Best Defender', 'EABL Rising Star', 'Top Scorer: The Golden Net Trophy', 'All-EABL First Team', 'EABL All-Defensive Team'],
  APBA: ['The Pacific Rim Shield', 'APBA Most Valuable Player', 'Pacific Rim Shield Finals MVP', 'APBA Defensive Player of the Year', 'APBA Best Sixth Man', 'APBA Rookie of the Year', 'All-APBA First Team', 'APBA All-Defensive Team'] };
const SPEC_CODES = { EABL: 'LDN MAD PAR BER MLN ATH IST BLG MUN BCN KAU TLV', APBA: 'TYO MNI SEL SYD TPS MEL PEK JKG AKL SGP BKT OSA', NCHF: 'BHH PHL CLT ATP CWD DTM CMH MSP DWR AUS BNA STL SEA DSU PSC SAN' };

// ---------- A + B: fresh leagues (no pro games needed) ----------
const roleAgg = {}, rPairs = { NCHF: [], EABL: [], APBA: [], all: [] }, yrs = [0, 0, 0, 0, 0]; let mixBad = [], top1 = 0, topN = 0, ahead = true, spec = null, poOK = true, awOK = true, leadMax = { NCHF: 0, EABL: 0, APBA: 0 }, textBad = [], pipeMs = [];
for (const seed of [1, 2, 3, 4]) {
  const { run } = load(SRC, seed);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'team',size:30,userTeam:3,games:58});const S=L.season,o={mix:[],yrs:[0,0,0,0,0],t1:0,tn:0,roles:{},pairs:[],po:[],aw:[],lead:{},text:[]};
o.ahead=[S,S+1,S+2,S+3].every(d=>L.classes[d]&&L.classes[d].length);
for(const d in L.classes){const ps=L.classes[d].map(id=>L.players[id]),n=ps.length,c=ps.filter(p=>p.src==='c').length,i=ps.filter(p=>p.src==='i').length,x=ps.filter(p=>p.src==='o').length;o.mix.push([+d,n,c,i,x]);
 for(const p of ps)if(p.src==='c')o.yrs[p.yrsCol]++;for(const p of mockOrder(L,+d).slice(0,10))if(p.src==='c'){o.tn++;if(p.yrsCol===1)o.t1++;}}
o.spec={teams:Object.fromEntries(PIPE_LGS.map(lg=>[lg,PIPE_TEAMS[lg].map(t=>t[2]).join(' ')])),conf:[0,1,2,3].map(c=>PIPE_TEAMS.NCHF.filter(t=>t[5]===c).length),aw:Object.fromEntries(PIPE_LGS.map(lg=>[lg,Object.values(PIPE_AW[lg])])),G:PIPE_LGS.map(lg=>PIPE_LG[lg].G)};
o.ms=pipeSeason(L);
const R0=pipeRosters(L,S);
for(const lg of PIPE_LGS){const rows=[];R0[lg].flat().forEach(p=>{const l=(p.pre||[]).find(h=>h.s===S&&h.lg===lg);if(l)rows.push({role:p.pRole,l,v:p.ovr,pr:p.prospect});});
 L.pipe.lg[lg].t.forEach(t=>t.f.forEach(f=>{if(f.ln)rows.push({role:f.r,l:f.ln,v:f.o});}));
 for(const x of rows)(o.roles[lg+'.'+x.role]=o.roles[lg+'.'+x.role]||[]).push([x.l.pts,x.l.reb,x.l.ast,x.l.min]);
 for(const x of rows)if(x.pr)o.pairs.push([lg,pipeVal(x.l),x.v]);
 const res=L.pipe.lg[lg].res;o.po.push([lg,res.po.map(x=>x.r+':'+(x.sc||[]).join('-')).join(','),res.champ!=null,lg==='NCHF'?L.pipe.lg.NCHF.confCh.every(c=>L.pipe.lg.NCHF.seeds.includes(c))&&L.pipe.lg.NCHF.seeds.length===8:true,!!res.aw.fmvp]);
 o.lead[lg]=res.lead.pts[0].v;
 for(const k in res.aw){if(k==='conf')continue;const v=res.aw[k];if(!v||(Array.isArray(v)&&v.length!==5))o.aw.push(lg+'.'+k);}}
const al=Object.values(L.players).flatMap(p=>p.preAw||[]);o.awNames=[...new Set(al.map(a=>a.lg+'|'+a.a))];
o.text=L.log.filter(x=>x.k==='pipe').map(x=>x.text).filter(t=>/[{}]|undefined|NaN/.test(t)||t.length>160);o.news=L.log.filter(x=>x.k==='pipe').length;o.sample=L.log.filter(x=>x.k==='pipe').slice(0,4).map(x=>x.text);
return JSON.stringify(o);})()`));
  ahead = ahead && r.ahead; spec = spec || r.spec; pipeMs.push(r.ms);
  for (const [d, n, c, i, x] of r.mix) if (Math.abs(c - n * 0.7) > 1 || Math.abs(i - n * 0.25) > 1 || c + i + x !== n) mixBad.push(`${d}:${c}/${i}/${x} of ${n}`);
  r.yrs.forEach((v, k) => yrs[k] += v); top1 += r.t1; topN += r.tn;
  for (const k in r.roles) (roleAgg[k] = roleAgg[k] || []).push(...r.roles[k]);
  for (const [lg, v, o] of r.pairs) { rPairs[lg].push([v, o]); rPairs.all.push([v, o]); }
  for (const [lg, po, ch, seedsOK, fm] of r.po) { const n = po.split(',').length; if (!ch || !seedsOK || (lg === 'EABL' && n !== 3) || (lg === 'APBA' && (n !== 3 || !fm || !/Finals:3-|Finals:\d-3/.test(po))) || (lg === 'NCHF' && n !== 7)) { poOK = false; out.push('  po ' + lg + ' ' + po); } }
  if (r.aw.length) { awOK = false; out.push('  missing awards ' + r.aw.join(',')); }
  for (const a of r.awNames) { const [lg, name] = a.split('|'); if (!SPEC_AW[lg].includes(name) && !/leader$|career$|Triple-double/.test(name)) { awOK = false; out.push('  unknown award ' + a); } }
  for (const lg in r.lead) leadMax[lg] = Math.max(leadMax[lg], r.lead[lg]);
  textBad.push(...r.text); if (seed === 1) out.push('news sample: ' + JSON.stringify(r.sample));
}
// A
chk('4 draft classes ahead', ahead);
chk('class mix 70/25/5 (each class, ±1 player)', !mixBad.length, mixBad.slice(0, 4).join(' ') || '16 classes ok');
const ny = yrs.slice(1).reduce((a, b) => a + b, 0), pct = yrs.slice(1).map(v => Math.round(v / ny * 100));
chk('college years ~30/25/20/25 (±7 each)', [30, 25, 20, 25].every((t, i) => Math.abs(pct[i] - t) <= 7), pct.join('/') + ' of ' + ny);
chk('top-10 college prospects mostly one year', top1 / topN > 0.5, Math.round(top1 / topN * 100) + '%');
chk('spec team codes', Object.keys(SPEC_CODES).every(lg => spec.teams[lg] === SPEC_CODES[lg]), JSON.stringify(spec.teams).slice(0, 80) + '...');
chk('NCHF 4 conferences of 4', spec.conf.join() === '4,4,4,4');
chk('spec award names', Object.keys(SPEC_AW).every(lg => JSON.stringify(spec.aw[lg]) === JSON.stringify(SPEC_AW[lg])));
// B
const T = JSON.parse(load(SRC, 1).run('JSON.stringify({R:PIPE_ROLES,N:PIPE_ROLE_NAME})'));
let roleBad = [], spreadOK = true;
out.push('role averages (pts/reb/ast/min, 4 seeds) vs spec:');
for (const lg of ['NCHF', 'EABL', 'APBA']) for (const role in T.R[lg]) {
  const a = roleAgg[lg + '.' + role] || []; if (!a.length) { roleBad.push(lg + '.' + role + ' none'); continue; }
  const m = [0, 1, 2, 3].map(i => a.reduce((s, x) => s + x[i], 0) / a.length), t = T.R[lg][role];
  const sd = Math.sqrt(a.reduce((s, x) => s + (x[0] - m[0]) ** 2, 0) / a.length);
  out.push(`  ${lg} ${T.N[lg][role].padEnd(34)} n${String(a.length).padEnd(4)} ${m.map(v => v.toFixed(1)).join(' / ')}   spec ${t.join(' / ')}   sd pts ${sd.toFixed(1)}`);
  for (let i = 0; i < 3; i++) if (Math.abs(m[i] - t[i]) > Math.max(0.15, t[i] * 0.05)) roleBad.push(`${lg}.${role}[${i}] ${m[i].toFixed(2)} vs ${t[i]}`);
  if (Math.abs(m[3] - t[3]) > Math.max(1, t[3] * 0.08)) roleBad.push(`${lg}.${role}[min] ${m[3].toFixed(1)} vs ${t[3]}`);
  if (t[0] >= 8 && sd < t[0] * 0.15) spreadOK = false;
}
chk('average stats by role on spec targets (±5%)', !roleBad.length, roleBad.slice(0, 4).join('; '));
chk('real spread inside each role (sd >= 15% of target pts)', spreadOK);
chk('leaders sane (NCHF <= 34, EABL <= 28, APBA <= 40 ppg)', leadMax.NCHF <= 34 && leadMax.EABL <= 28 && leadMax.APBA <= 40, JSON.stringify(leadMax));
const rr = {}; for (const k in rPairs) if (rPairs[k].length > 20) rr[k] = +cor(rPairs[k].map(x => x[0]), rPairs[k].map(x => x[1])).toFixed(3);
chk('stats track true rating, r 0.6-0.7 (prospects, all leagues)', rr.all >= 0.58 && rr.all <= 0.72, JSON.stringify(rr) + ` n=${rPairs.all.length}`);
chk('stats are not the truth (each league r < 0.8)', ['NCHF', 'EABL', 'APBA'].every(k => rr[k] == null || rr[k] < 0.8));
chk('results-only playoffs (EABL Final Four, APBA bo3 + bo5 Finals + Finals MVP, NCHF 8-team Founders Cup with 4 conference champs)', poOK);
chk('awards filled, names from spec', awOK);
chk('pipeline news text ok', !textBad.length, textBad[0]);
chk('pipeline season fast (< 300 ms)', Math.max(...pipeMs) < 300, pipeMs.join(','));

// NBA mode: the real 2027 class gets its schools / clubs
{ const { run } = load(SRC, 1);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'team',size:30,userTeam:3,nba:true});const ps=L.classes[L.season].map(id=>L.players[id]),real=ps.filter(p=>p.school);
  const intl=real.filter(p=>p.src==='i').map(p=>p.school+'>'+p.pl),col=real.filter(p=>p.src==='c');
  return JSON.stringify({n:real.length,intl,col:col.length,colNCHF:col.every(p=>p.pl==='NCHF'&&p.pt!=null&&p.yrsCol>=1),mix:['c','i','o'].map(k=>ps.filter(p=>p.src===k).length),lbl:pipeLabel(L,col[0]),built:L.pipe.s===L.season});})()`));
  chk('NBA: real 2027 class schools -> NCHF, clubs -> EABL / APBA', r.n >= 50 && r.colNCHF && r.intl.length === 5 && r.intl.every(x => /^((Baskonia|Cedevita Olimpija|Nanterre|Trento)>EABL|South East Melbourne>APBA)$/.test(x)), JSON.stringify(r.intl) + ' college ' + r.col);
  chk('NBA: label keeps the real school', !!r.lbl && r.built, r.lbl);
}
// ---------- C: old save migration ----------
{ const { run } = load(SRC, 7);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'team',size:30,userTeam:3,games:58});const S=L.season;
  delete L.pipe;delete L.pipeHist;for(const p of Object.values(L.players)){delete p.src;delete p.pl;delete p.pt;delete p.pFrom;delete p.yrsCol;delete p.yrsIntl;delete p.club;}
  for(const id of L.classes[S+3])delete L.players[id];delete L.classes[S+3];
  const s0=JSON.stringify(L);const L2=JSON.parse(s0);migrateLeague(L2);
  const ps=Object.keys(L2.classes).flatMap(d=>L2.classes[d].map(id=>L2.players[id]));
  return JSON.stringify({cls:Object.keys(L2.classes).join(','),src:ps.every(p=>p.src),built:L2.pipe&&L2.pipe.s===S,clubs:Object.values(L2.players).filter(p=>p.club).length,ms:pipeSeason(L2)});})()`));
  chk('old save: 4th class added, sources set, rosters built, season sims', r.cls.split(',').length === 4 && r.src && r.built && r.clubs > 0 && r.ms >= 0, JSON.stringify(r));
}

// ---------- D: one full season ----------
if (process.argv[2] !== 'quick') {
  const { run } = load(SRC, +process.env.SEED || 3);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'team',size:30,userTeam:5,games:${process.env.GAMES || 58}});const S=L.season,o={};
  const kb0=JSON.stringify(L).length;
  // offseason timer + honors snapshot right after the pipeline season
  let snap=null;startOffseason=(f=>function(LL){const t=Date.now();const res=f(LL);o.offMs=Date.now()-t;o.pipeMs=LL.pipe.ms;
    const SS=o.S2=LL.season;snap={};for(const id of LL.classes[SS]||[]){const p=LL.players[id];snap[id]={aw:(p.preAw||[]).filter(a=>a.s===SS).length,pre:(p.pre||[]).length};}return res;})(startOffseason);
  // a call-up by hand on day 30 (AI team with room)
  autoBegin(L,+(${process.env.SEASONS||2}),true);let g=0;
  while(autoStep(L)&&g++<200000){
    if(L.phase==='regular'&&L.day===30&&!o.hand){const pool=pipeCallable(L);const t=L.teams.find(t=>t.roster.length<15&&t.id!==L.auto.user);
      const pk=pool.find(p=>p.club.lg==='EABL')||pool[0];if(t&&pk){const cash0=(t.fin.intlBuy||0),lg=pk.club.lg;const res=callUp(L,pk.id,t.id);
      o.hand={ok:res.ok,msg:res.msg,team:pk.team===t.id,out:pk.club.out,lg,buy:r1((t.fin.intlBuy||0)-cash0),cost:res.cost,again:callUp(L,pk.id,t.id).ok};}}
    if(L.phase==='regular'&&L.day===31&&!o.full){const t=L.teams.find(t=>t.roster.length>=15);const pk=pipeCallable(L)[0];if(t&&pk)o.full=callUp(L,pk.id,t.id).msg;}
  }
  const sum=autoEnd(L);o.phase=L.phase;o.cnt=Object.assign({},PIPE_CNT);
  o.hist=[S,o.S2].every(x=>L.pipeHist[x]&&L.pipeHist[x].NCHF&&L.pipeHist[x].EABL&&L.pipeHist[x].APBA);
  // honors kept after the draft
  const S2=o.S2,drafted=Object.values(L.players).filter(p=>p.draft&&p.draft.s===S2);o.drafted=drafted.length;
  o.keptAw=drafted.filter(p=>snap[p.id]&&snap[p.id].aw>0).every(p=>(p.preAw||[]).filter(a=>a.s===S2).length===snap[p.id].aw);
  o.oldAw=Object.values(L.players).filter(p=>p.draft&&p.draft.s===S&&(p.preAw||[]).some(a=>a.s===S)).length;
  o.nAw=drafted.filter(p=>snap[p.id]&&snap[p.id].aw>0).length;
  o.keptPre=drafted.filter(p=>snap[p.id]&&snap[p.id].pre>0).every(p=>p.pre.length===snap[p.id].pre);
  o.multiPre=drafted.filter(p=>p.pre&&p.pre.length>=2).length;
  const und=Object.keys(snap).map(id=>L.players[id]).filter(p=>p&&!p.draft);o.und=und.length;o.undOne=und.every(p=>!p.pre||p.pre.length<=1);
  o.undAw=und.filter(p=>snap[p.id].aw>0).every(p=>(p.preAw||[]).filter(a=>a.s===S2).length===snap[p.id].aw);
  o.top=drafted.filter(p=>p.draft.rd===1&&p.draft.no<=5).map(p=>p.name+' #'+p.draft.no+' '+pipeLabel(L,p)+' '+JSON.stringify((p.pre||[]).slice(-1)[0]&&[p.pre.slice(-1)[0].pts,p.pre.slice(-1)[0].reb,p.pre.slice(-1)[0].ast])+' aw'+(p.preAw||[]).length);
  o.honors=drafted.map(p=>preHonors(p)).filter(h=>h.length).slice(0,2);
  o.hof=pipeHofPts(drafted.find(p=>p.preAw&&p.preAw.length)||{});
  o.classes=Object.keys(L.classes).join(',');
  // stock moved boards
  o.stock=Object.values(L.players).filter(p=>p.stock&&p.stock.s===S2&&p.stock.d).length;o.stockCap=Object.values(L.players).every(p=>!p.stockSum||Math.abs(p.stockSum)<=6);
  // next season: clubs placed, rosters rebuilt
  startNewSeason(L);o.newS=L.pipe.s===L.season;o.clubs=Object.values(L.players).filter(p=>p.club&&p.club.s===L.season).length;
  o.vetOne=Object.values(L.players).filter(p=>!p.prospect&&p.pre).every(p=>p.pre.filter(h=>h.x).length<=1);
  o.fillers=PIPE_LGS.map(lg=>L.pipe.lg[lg].t.reduce((a,t)=>a+t.f.length,0));
  const kb=JSON.stringify(L).length;o.saveKB=Math.round(kb/1024);o.pipeKB=Math.round(pipeBytes(L)/1024);o.pipeShare=+(pipeBytes(L)/kb*100).toFixed(1);
  o.news=L.log.filter(x=>x.k==='pipe').map(x=>x.text).filter(t=>/[{}]|undefined|NaN/.test(t));
  o.fin=L.teams.some(t=>(t.finHist||[]).some(h=>h.s===S&&h.intlBuy>0));
  return JSON.stringify(o);})()`));
  out.push('season D: ' + JSON.stringify({ off: r.offMs, pipe: r.pipeMs, cnt: r.cnt, drafted: r.drafted, und: r.und, save: r.saveKB, pipeKB: r.pipeKB, share: r.pipeShare, clubs: r.clubs, fillers: r.fillers, stock: r.stock }));
  out.push('top picks: ' + JSON.stringify(r.top)); out.push('honors sample: ' + JSON.stringify(r.honors));
  chk('season finished, pipeline history saved', r.phase === 'off-ready' && r.hist);
  chk('call-up by hand: signed, left club, EABL buyout charged', r.hand && r.hand.ok && r.hand.team && r.hand.out > 0 && (r.hand.lg !== 'EABL' || (r.hand.buy > 0 && r.hand.buy === r.hand.cost)) && !r.hand.again, JSON.stringify(r.hand));
  chk('call-up refused with a full roster', !r.full || /full/.test(r.full), r.full);
  chk('AI call-ups happen', r.cnt.callAI + r.cnt.buyouts >= 1, JSON.stringify(r.cnt));
  chk('buyouts in team finances', r.fin);
  chk('pre-draft honors kept after the draft (drafted)', r.keptAw && r.nAw >= 5, r.nAw + ' drafted players with honors');
  chk('pre-draft honors kept (undrafted too)', r.undAw);
  chk('drafted keep every college / club line', r.keptPre && r.multiPre >= 5, r.multiPre + ' drafted with 2+ seasons');
  chk('last year\'s draftees still hold their honors a season later', r.oldAw >= 5, r.oldAw);
  chk('undrafted keep the last line only', r.undOne, r.und);
  chk('classes stay 4 ahead after the draft', r.classes.split(',').length === 4, r.classes);
  chk('stock moved some boards, capped at 6', r.stock >= 10 && r.stockCap, r.stock);
  chk('new season: clubs + rosters rebuilt', r.newS && r.clubs >= 20, r.clubs);
  chk('pros on clubs keep one club line', r.vetOne);
  chk('HOF bonus small (<= 40)', r.hof > 0 && r.hof <= 40, r.hof);
  chk('save size: pipeline under 6% of the save', r.pipeShare < 6, r.pipeKB + ' KB of ' + r.saveKB + ' KB');
  chk('offseason time: pipeline < 150 ms and under 25% of startOffseason', r.pipeMs < 150 && r.pipeMs <= Math.max(30, r.offMs * 0.25), r.pipeMs + ' ms of ' + r.offMs + ' ms');
  chk('news text ok (season)', !r.news.length, r.news[0]);
}
out.push(ok + ' pass, ' + bad + ' fail');
console.log(out.join('\n'));
