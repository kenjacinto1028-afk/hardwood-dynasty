// v30c logic: node tools/t30c.js  (SEED=n)
// A #5 move write-ups on trades, signings, releases (text shape, numbers, every team covered, no broken text)
// B #23 interviews: set periods only (open, deadline, playoffs, draft), draft interviews ask only draft questions, no repeat in a season, pools
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 3;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const STEP = `function stepL(L){switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':processPending(L);startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;case 'off-draft':aiDraftPick(L);break;case 'off-resign':startFA(L);break;case 'off-fa':faDay(L);if(L.phase!=='off-fa')processPending(L);break;default:return false;}return true;}`;
// ---------- A ----------
for (const nba of [false, true]) {
  const { run } = load(SRC, SEED + (nba ? 10 : 0));
  const t0 = Date.now();
  const r = JSON.parse(run(`${STEP}(function(){const L=newLeague({mode:'commish',size:${nba ? 30 : 16},userTeam:null,games:${nba ? 82 : 58},nba:${nba}});
    let n=0;while(!(L.season===2&&L.phase==='off-ready')&&n++<4000){if(!stepL(L))break;}
    const mv=L.mv||[],o={n:mv.length,kinds:{},bad:[],fitN:0,ovrN:0,tradeFit:0,tradeOvr:0,trN:0,missTeam:0,ks:{},sample:{}};
    for(const e of mv){o.kinds[e.kind]=(o.kinds[e.kind]||0)+1;
      if(!e.wu||e.wu.length!==e.tids.length)o.missTeam++;
      for(const w of e.wu||[]){ if(!/^[A-Z0-9]{2,4}: [^{}]+\\.( Coach fit \\d+ > \\d+\\.)?( Team overall \\d+ > \\d+\\.)?$/.test(w.text)||/undefined|NaN/.test(w.text))o.bad.push(w.text);
        if(w.fit)o.fitN++; if(w.ovr)o.ovrN++; o.ks[w.k]=(o.ks[w.k]||0)+1;
        if(e.kind==='trade'){o.trN++; if(w.fit)o.tradeFit++; if(w.ovr)o.tradeOvr++;}
        if(!o.sample[e.kind])o.sample[e.kind]=w.text;
        if(e.kind!=='trade'&&w.ovr)o.bad.push('ovr on '+e.kind);}}
    const trs=L.trades.filter(t=>t.s<=2);o.trRec=trs.length;o.trWu=trs.filter(t=>t.wu&&t.wu.length===(t.multi?3:2)).length;o.sec=L.season;o.ph=L.phase;
    return JSON.stringify(o);})()`));
  const tag = nba ? 'NBA 30' : 'PBL 16';
  out.push(`${tag}: ${(Date.now() - t0) / 1000}s ` + JSON.stringify({ moves: r.n, kinds: r.kinds, reasons: r.ks, trades: r.trRec, sample: r.sample }));
  chk(`${tag} moves recorded (trades, signings, releases)`, r.n > 20 && r.kinds.trade > 0 && r.kinds.sign > 0 && r.kinds.release > 0, JSON.stringify(r.kinds));
  chk(`${tag} every move has one write-up per team`, r.missTeam === 0);
  chk(`${tag} write-up text shape ok, no braces / undefined`, r.bad.length === 0, r.bad.slice(0, 3).join(' | '));
  chk(`${tag} trade write-ups have coach fit and team overall`, r.trN > 0 && r.tradeFit / r.trN >= 0.95 && r.tradeOvr / r.trN >= 0.95, r.tradeFit + '/' + r.tradeOvr + ' of ' + r.trN);
  chk(`${tag} every completed trade record has wu`, r.trRec === r.trWu, r.trWu + '/' + r.trRec);
  chk(`${tag} several different reasons used (>=6)`, Object.keys(r.ks).length >= 6, Object.keys(r.ks).join(','));
}
// ---------- B ----------
for (const nba of [false, true]) {
  const { run } = load(SRC, 30 + (nba ? 5 : 0));
  const r = JSON.parse(run(`${STEP}(function(){const L=newLeague({mode:'team',size:${nba ? 30 : 16},userTeam:0,games:${nba ? 82 : 58},nba:${nba}});
    // best team for the user so the playoffs happen
    const best=L.teams.slice().sort((a,b)=>teamStrength(L,b)-teamStrength(L,a))[0].id;L.user=best;
    const seen=[],asked={};let lastId=-1,n=0;
    const poll=()=>{if(L.iv&&L.iv.id!==lastId){lastId=L.iv.id;const I=L.iv;seen.push({id:I.id,stage:I.stage,ph:I.ph,keys:I.qs.map(q=>q.k),texts:I.qs.map(q=>ivText(L,q)),ans:I.qs.map((q,i)=>ivAnswers(L,q))});}};
    let answered=0;
    while(L.phase!=='off-fa'&&n++<4000){ poll(); const I=ivOpen(L); if(I){for(let qi=0;qi<I.qs.length;qi++){if(I.qs[qi].ans==null){ivAnswer(L,qi,qi%4);answered++;}}} if(!stepL(L))break; poll();}
    const o={seen,answered,used:(L.ivUsed&&L.ivUsed.ks)||[],season:L.season,phase:L.phase,stages:seen.map(s=>s.stage)};
    // new season: used list resets, same question can come back
    const L2=L;L2.season+=1;L2.user=best;L2.phase='regular';L2.day=3;const prev=L2.ivUsed.ks.length;L2.iv=null;const t=ivTrigger(L2,'open');o.reset=!!t&&L2.ivUsed.s===L2.season&&L2.ivUsed.ks.length<=3&&prev>0;
    // pool dry: use up the draft pool, then no interview and no repeat
    const L3=L;L3.season+=1;L3.ivUsed={s:L3.season,ks:Object.keys(IV_Q).filter(k=>IV_Q[k].st.includes('draft'))};L3.phase='off-draft';L3.iv=null;L3.draftOrder=null;o.dry=ivTrigger(L3,'draft')===null&&ivPoolLeft(L3,'draft').length===0;
    o.pools={};for(const s of IV_STAGES)o.pools[s]=Object.keys(IV_Q).filter(k=>IV_Q[k].st.includes(s)).length;
    // draft-only keys are not in other periods
    o.draftOnly=Object.keys(IV_Q).filter(k=>IV_Q[k].st.includes('draft')).every(k=>IV_Q[k].st.length===1);
    return JSON.stringify(o);})()`));
  const tag = nba ? 'NBA 30' : 'PBL 16';
  out.push(`${tag} interviews: ` + JSON.stringify({ stages: r.stages, answered: r.answered, pools: r.pools }));
  chk(`${tag} interview periods only (open, deadline, playoffs, draft), each at most once`, r.stages.every(s => ['open', 'deadline', 'playoffs', 'draft'].includes(s)) && new Set(r.stages).size === r.stages.length, r.stages.join(','));
  chk(`${tag} opening-week, deadline and draft interviews happened`, ['open', 'deadline', 'draft'].every(s => r.stages.includes(s)), r.stages.join(','));
  const keys = [].concat(...r.seen.map(s => s.keys));
  chk(`${tag} no repeated question in the season`, new Set(keys).size === keys.length, keys.join(','));
  const dr = r.seen.filter(s => s.stage === 'draft');
  chk(`${tag} draft interview asks only draft questions`, dr.length > 0 && dr.every(s => s.keys.every(k => k[0] === 'd' && ['dpick', 'dtrade', 'dclass', 'dneed', 'dwork'].includes(k))), dr.map(s => s.keys.join('+')).join(';'));
  chk(`${tag} non-draft interviews never ask draft questions`, r.seen.filter(s => s.stage !== 'draft').every(s => s.keys.every(k => !['dpick', 'dtrade', 'dclass', 'dneed', 'dwork'].includes(k))));
  chk(`${tag} question and answer text complete (no braces, no empty)`, r.seen.every(s => s.texts.every(t => t && !/[{}]/.test(t)) && s.ans.every(a => a.every(x => x && !/[{}]/.test(x)))), r.seen.map(s => s.texts.join(' / ')).filter(t => /[{}]/.test(t)).join('|'));
  chk(`${tag} used list reset next season`, r.reset);
  chk(`${tag} dry pool gives no interview and never repeats`, r.dry);
  chk(`${tag} draft-only questions stay draft-only; every period has a pool of 3+`, r.draftOnly && Object.values(r.pools).every(n => n >= 3), JSON.stringify(r.pools));
}
console.log(out.join('\n')); console.log(`\n${ok} pass, ${bad} fail`); process.exit(bad ? 1 : 0);
