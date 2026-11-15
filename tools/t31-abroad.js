// v31 logic: node tools/t31-abroad.js  (SEED=n, SRC=src)
// A cut at the FA cap: age <= 26 goes abroad (not retired), 27+ retires; club, tx line, news (drafted / OVR 50+ only), off L.fa
// B offseason: a good player returns to L.fa before free agency; a weak one stays; 26-year-old retires at 27; 22-year-old retires after 3 seasons abroad
// C never on L.fa / roster / two-way while abroad, no duplicate ids, every abroad player has a club in season
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 5;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const STEP = `function stepL(L){switch(L.phase){case 'regular':simDay(L);break;case 'regular-done':processPending(L);startPlayoffs(L);break;case 'playoffs':simPlayoffDay(L);break;case 'season-done':startOffseason(L);break;case 'off-review':runLottery(L);break;case 'off-lottery':startDraft(L);break;case 'off-draft':aiDraftPick(L);break;case 'off-resign':startFA(L);break;case 'off-fa':faDay(L);if(L.phase!=='off-fa')processPending(L);break;case 'off-ready':startNewSeason(L);break;default:return false;}return true;}`;
const { run } = load(SRC, SEED);
const r = JSON.parse(run(`${STEP}(function(){
  const L=newLeague({mode:'commish',size:16,userTeam:null,games:58,nba:false});
  let n=0;while(!(L.season===2&&L.phase==='off-ready')&&n++<4000){if(!stepL(L))break;}
  const o={start:L.season+':'+L.phase,viol:[],dups:[]};
  const mk=(age,ovrT,extra)=>{const p=newPlayer(L,pick(POS),-2,age);scaleToOvr(p,ovrT);p.pot=p.ovr+1;p.scout=p.pot;p.mval=MINSAL;L.fa.push(p.id);setAsk(L,p);Object.assign(p,extra||{});return p;};
  // 70 extra cuttable free agents, all very low so they are first out
  const T={};
  T.good=mk(22,20);T.weak=mk(22,20);T.old26=mk(26,20);T.drafted=mk(21,20,{draft:{s:1,rd:2,no:55}});T.plain=mk(22,20);
  T.recut=mk(22,20,{abroadSeasons:2});T.vet=mk(28,20);T.vet2=mk(31,20);
  for(let i=0;i<60;i++)mk(rint(21,26),20);
  o.faBefore=L.fa.length;const ids={};for(const k in T)ids[k]=T[k].id;
  L.fa.sort((a,b)=>0);startNewSeason(L);
  const g=k=>L.players[ids[k]];
  const info=k=>{const p=g(k);return p?{ret:p.retired||0,ab:p.abroad?p.abroad.s:null,club:p.club?p.club.lg:null,inFA:L.fa.includes(p.id),tx:(p.tx||[]).map(x=>x.t).join('|'),age:p.age}:null;};
  o.after={};for(const k in ids)o.after[k]=info(k);o.season=L.season;o.faAfter=L.fa.length;
  o.abroadN=Object.values(L.players).filter(p=>p.abroad&&!p.retired).length;
  o.news=L.log.filter(e=>(e.k==='pipe')&&/overseas|abroad/i.test(e.text)).map(e=>e.text);
  o.newsDrafted=o.news.some(t=>t.includes(T.drafted.name));o.newsPlain=o.news.some(t=>t.includes(T.plain.name));o.newsText=o.news.slice(0,2);
  // B: boost 'good' after the cut, then run seasons. 'weak' stays 20. old26 is 26 -> 27 at the next offseason.
  scaleToOvr(g('good'),72);g('good').pot=g('good').ovr+2;g('good').scout=g('good').pot;
  const s0=L.season;o.log=[];let back=null,steps=0,lastPh=null,lastS=L.season;
  const watch=()=>{const A=Object.values(L.players).filter(p=>p.abroad&&!p.retired);
    for(const p of A){ if(L.fa.includes(p.id))o.viol.push('abroad in fa '+p.id+' '+L.season+':'+L.phase); if(p.team!=null)o.viol.push('abroad on team '+p.id); if(L.teams.some(t=>(t.twoWay||[]).includes(p.id)))o.viol.push('abroad two-way '+p.id); if(L.phase==='regular'&&!(p.club&&p.club.s===L.season))o.viol.push('no club '+p.id+' '+L.season); }
    const seen=new Set();for(const id of L.fa){if(seen.has(id))o.dups.push('fa '+id);seen.add(id);}
    const all=new Set();for(const t of L.teams)for(const id of [...t.roster,...(t.twoWay||[])]){if(all.has(id))o.dups.push('team '+id);all.add(id);}};
  while(L.season<s0+4&&steps++<20000){ if(!stepL(L))break;
    if(L.phase!==lastPh||L.season!==lastS){lastPh=L.phase;lastS=L.season;watch();
      if(L.phase==='off-review'||L.phase==='off-lottery'){o.log.push({s:L.season,ph:L.phase,good:info('good'),weak:info('weak'),old26:info('old26')===null?'deleted':info('old26'),recut:info('recut')===null?'deleted':info('recut')});}}
  }
  o.end={season:L.season,phase:L.phase};
  const fin=k=>{const p=g(k);return p?{abroad:!!p.abroad,ret:p.retired||0,inFA:L.fa.includes(p.id),team:p.team}:'deleted';};
  o.final={good:fin('good'),weak:fin('weak'),old26:fin('old26'),recut:fin('recut'),plain:fin('plain'),drafted:fin('drafted')};
  o.s0=s0;
  return JSON.stringify(o);})()`));
out.push('INFO ' + JSON.stringify({ start: r.start, faBefore: r.faBefore, faAfter: r.faAfter, abroadN: r.abroadN, news: r.newsText, end: r.end, final: r.final }));
const a = r.after;
chk('A young cut players (<=26) are abroad, not retired', ['good', 'weak', 'old26', 'drafted', 'plain', 'recut'].every(k => a[k] && !a[k].ret && a[k].ab === r.season), JSON.stringify(a.weak));
chk('A abroad players left L.fa and have a pipeline club (EABL / APBA)', ['good', 'weak', 'old26', 'drafted', 'plain', 'recut'].every(k => !a[k].inFA && ['EABL', 'APBA'].includes(a[k].club)));
chk('A transaction line "Went overseas"', ['good', 'weak', 'old26', 'drafted', 'plain', 'recut'].every(k => /Went overseas: signed with .* \((EABL|APBA)\)/.test(a[k].tx) && !/(^|\|)Signed with /.test(a[k].tx)), a.weak.tx);
chk('A 27+ cut players keep the retire rule (deleted, never played)', r.after.vet === null && r.after.vet2 === null);
chk('A news for a drafted player, none for a plain low-OVR player', r.newsDrafted && !r.newsPlain, JSON.stringify(r.newsText));
chk('A FA pool trimmed to 60', r.faAfter <= 60, r.faAfter);
chk('B good player (72 OVR) returned to L.fa before free agency', r.final.good !== 'deleted' && !r.final.good.abroad && (r.final.good.inFA || r.final.good.team != null), JSON.stringify(r.final.good));
chk('B good player returned at the first offseason', r.log.length && r.log[0].good && !r.log[0].good.ab && (r.log[0].good.inFA), JSON.stringify(r.log[0] && r.log[0].good));
chk('B weak 22-year-old stayed abroad after offseason 1 and 2', r.log.length >= 2 && r.log[0].weak.ab != null && r.log[1].weak.ab != null, JSON.stringify(r.log.map(x => x.weak && x.weak.ab)));
chk('B weak player retired after 3 seasons abroad (deleted, never played)', r.final.weak === 'deleted', JSON.stringify(r.final.weak));
chk('B 26-year-old retired at 27, at the first offseason (deleted)', r.final.old26 === 'deleted' && r.log[0].old26 === 'deleted', JSON.stringify(r.log[0] && r.log[0].old26));
chk('B earlier seasons abroad carry over: 22-year-old cut again with 2 earlier seasons retires after 1 more (deleted)', a.recut.ab === r.season && r.log[0].recut === 'deleted' && r.final.recut === 'deleted', JSON.stringify(r.log[0] && r.log[0].recut));
chk('C never on L.fa / team / two-way while abroad, club every season', r.viol.length === 0, r.viol.slice(0, 3).join(' | '));
chk('C no duplicate ids on L.fa or rosters', r.dups.length === 0, r.dups.slice(0, 3).join(' | '));
console.log(out.join('\n')); console.log(`\n${ok} pass, ${bad} fail`); process.exit(bad ? 1 : 0);
