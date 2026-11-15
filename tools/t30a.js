// v30a: node tools/t30a.js [quick]  (SEED=n, default 3; GAMES=58|66|82 for the season part, default 58)
// A #13 two-way rejections (rate, reasons, 2nd-rounders always yes, same answer same week, AI slots fill over a season)
// B #22 roster needs: no "Fix now" physical (ath) flag with 15 players (still "now" with 14)
// C #24 series lengths: NBA-size every round best of 7 (play-in unchanged); 16-team league unchanged
// D #25 real first-year players are rookies; ROTY awarded to one of them after season 1
// E #10 jersey numbers: match count, duplicates (LAL #1, MEM #1), blanks random, no duplicate numbers on any team
// "quick" skips the full seasons (C season part + D award part).
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 3, GAMES = +process.env.GAMES || 58, quick = process.argv[2] === 'quick';
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };

// ---------- A: two-way ----------
{
  let el = 0, rej = 0; const ks = {}; let same = true, txtOK = true, hiRej = 0, hiN = 0, loAcc = 0, loN = 0, dr2 = 0, dr2N = 0, own2 = 0, own2N = 0;
  for (const seed of [1, 2, 3, 4]) for (const nba of [true, false]) {
    const { run } = load(SRC, seed);
    const r = JSON.parse(run(`(function(){const L=newLeague({mode:'team',size:30,userTeam:3,games:82,nba:${nba}});const o={el:0,rej:0,ks:{},same:true,txt:true,hi:[0,0],lo:[0,0],dr:[0,0],own:[0,0]};
      const ps=Object.values(L.players).filter(p=>p.team==null&&!p.tw&&!p.retired&&!p.prospect&&p.age<=27&&twSvc(p)<3);
      if(!ps.every(p=>L.fa.includes(p.id)))L.fa.push(...ps.filter(p=>!L.fa.includes(p.id)).map(p=>p.id));
      for(const p of ps){if(!twEligible(L,p))continue;o.el++;const w=twWillSign(L,p),w2=twWillSign(L,p);if(w.ok!==w2.ok)o.same=false;
        if(!w.ok){o.rej++;o.ks[w.k]=(o.ks[w.k]||0)+1;if(!/standard contract/.test(w.why)||/undefined|NaN|[{}]/.test(w.why))o.txt=false;}
        if(p.mval>MINSAL+0.5){o.hi[1]++;if(!w.ok)o.hi[0]++;}else if(p.ovr<twBenchLine(L)-4){o.lo[1]++;if(w.ok)o.lo[0]++;}}
      // drafted 2nd-rounders: always yes, even the good ones
      const t=L.teams[L.user];t.twoWay=[];L.phase='off-draft';
      for(const p of ps.filter(p=>twEligible(L,p)).slice(0,6)){L.fa=L.fa.filter(id=>id!==p.id);p.mval=MINSAL*4;p.draft={s:L.season,rd:2,no:40,tid:t.id};o.dr[1]++;const e=signTwoWay(L,p,t.id,true);if(!e)o.dr[0]++;if(t.twoWay.length>=TW_MAX){for(const id of t.twoWay)dropTwoWay(L,L.players[id],false);}}
      // own 2nd-rounder in free agency before he has played: always yes; another team: can say no
      L.phase='off-fa';const q=ps.filter(p=>twEligible(L,p)).slice(0,4);
      for(const p of q){p.mval=MINSAL*4;p.draft={s:L.season,rd:2,no:45,tid:t.id};o.own[1]++;const e=signTwoWay(L,p,t.id);if(!e)o.own[0]++;for(const id of t.twoWay.slice())dropTwoWay(L,L.players[id],true);}
      return JSON.stringify(o);})()`));
    el += r.el; rej += r.rej; for (const k in r.ks) ks[k] = (ks[k] || 0) + r.ks[k]; same = same && r.same; txtOK = txtOK && r.txt;
    hiRej += r.hi[0]; hiN += r.hi[1]; loAcc += r.lo[0]; loN += r.lo[1]; dr2 += r.dr[0]; dr2N += r.dr[1]; own2 += r.own[0]; own2N += r.own[1];
  }
  const rate = rej / Math.max(1, el);
  out.push('two-way at league start: ' + JSON.stringify({ eligible: el, rejected: rej, rate: rate.toFixed(2), reasons: ks, hiValue: hiRej + '/' + hiN, lowAccept: loAcc + '/' + loN }));
  chk('two-way reject rate 10-70% of eligible FAs', rate >= 0.1 && rate <= 0.7, (rate * 100).toFixed(0) + '%');
  chk('market value above min: mostly rejects (>=60%)', hiN === 0 || hiRej / hiN >= 0.6, hiRej + '/' + hiN);
  chk('fringe players (4+ below bench line): mostly accept (>=85%)', loN === 0 || loAcc / loN >= 0.85, loAcc + '/' + loN);
  chk('reason text says standard contract, no braces', txtOK);
  chk('same answer when asked twice the same week', same);
  chk('drafted 2nd-rounders always accept (draft path)', dr2 === dr2N && dr2N > 0, dr2 + '/' + dr2N);
  chk('own 2nd-rounders always accept (free agency)', own2 === own2N && own2N > 0, own2 + '/' + own2N);
}

// ---------- B: roster needs ----------
{
  const { run } = load(SRC, SEED);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'team',size:30,userTeam:3,games:82});const t=L.teams[L.user];t.mode='contend';t.status='top';
    for(const id of t.roster){const p=L.players[id];p.spd=20;p.agi=20;p.vrt=20;}
    const fill=()=>{while(t.roster.length<15){const p=L.players[L.fa.shift()];p.spd=20;p.agi=20;p.vrt=20;signContract(L,p,t.id,MINSAL,1,'signing');}};
    const cut=n=>{while(t.roster.length>n){const p=L.players[t.roster[t.roster.length-1]];t.roster.pop();p.team=null;p.contract=null;L.fa.push(p.id);}};
    fill();const f=rosterNeeds(L,t).find(x=>x.k==='ath');cut(14);const g=rosterNeeds(L,t).find(x=>x.k==='ath');
    const allNow15=(fill(),rosterNeeds(L,t).filter(x=>x.urg==='now').map(x=>x.k));
    return JSON.stringify({n15:15,f:f&&f.urg,g:g&&g.urg,allNow15});})()`));
  out.push('roster needs ath: ' + JSON.stringify(r));
  chk('15 players: physical need is not "Fix now"', r.f && r.f !== 'now', r.f);
  chk('14 players: physical need is still "Fix now"', r.g === 'now', r.g);
  chk('15 players: no "now" ath anywhere', !r.allNow15.includes('ath'), r.allNow15.join(','));
}

// ---------- C + D + E: NBA league ----------
{
  const { run } = load(SRC, SEED);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'commish',size:30,games:${GAMES},nba:true});const S=L.season,o={};
    const st=NBA_JERSEY_LAST;o.j={rows:st.rows,matched:st.matched,set:st.set,blank:st.blank,dupe:st.dupe,fa:st.fa,missing:st.missing.length,dupes:st.dupes};
    const by=n=>Object.values(L.players).find(p=>p.name===n);
    o.nums={knecht:by('Dalton Knecht').num,thiero:by('Adou Thiero').num,thieroTeam:by('Adou Thiero').team,clayton:by('Walter Clayton Jr.').num,pippen:by('Scotty Pippen Jr.').num,minott:by('Josh Minott').num,brown:by('Mikel Brown Jr.').num,luka:by('Luka Doncic').num,lebron:by('LeBron James').num,wemby:by('Victor Wembanyama').num,gueye:by('Mouhamed Gueye').num};
    o.dupT=L.teams.filter(t=>{const ns=[...t.roster,...t.twoWay].map(id=>String(L.players[id].num));return new Set(ns).size!==ns.length}).map(t=>t.abbr);
    o.noNum=Object.values(L.players).filter(p=>(p.team!=null||p.tw)&&p.num==null).length;
    o.rookies=Object.values(L.players).filter(p=>p.rookieSeason===S).map(p=>p.name);
    o.rkCheck={dybantsa:by('AJ Dybantsa').rookieSeason===S,flagg:by('Cooper Flagg').rookieSeason===S,lebron:by('LeBron James').rookieSeason===S};
    o.quick=${quick};
    if(!${quick}){let g=0;while(L.phase==='regular'&&g++<5000)simDay(L);
      const A=L.awards[S]||{};o.roy=A.roy!=null?{name:L.players[A.roy].name,rs:L.players[A.roy].rookieSeason,real:!!L.players[A.roy].real}:null;o.roo1=(A.roo1||[]).length;
      startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<500)simPlayoffDay(L);
      o.po=L.po.rounds.map((rd,i)=>({st:poStages(L)[i],best:[...new Set(rd.map(s=>s.best))],need:[...new Set(rd.map(s=>s.hiNeed+'/'+s.loNeed))],len:rd.map(s=>s.hw+s.lw),max:Math.max(...rd.map(s=>Math.max(s.hw,s.lw)))}));o.champ=L.po.champion!=null;o.phase=L.phase;}
    return JSON.stringify(o);})()`));
  out.push('jersey: ' + JSON.stringify(r.j));
  out.push('jersey samples: ' + JSON.stringify(r.nums));
  chk('jersey rows read: 500', r.j.rows === 500, r.j.rows);
  chk('jersey matched by team + name >= 470 (rest were cut to FA at start)', r.j.matched >= 470, r.j.matched + ' matched, ' + r.j.missing + ' not on that team at start');
  chk('jersey numbers set >= 410', r.j.set >= 410, r.j.set);
  chk('no duplicate numbers on any team', r.dupT.length === 0, r.dupT.join(','));
  chk('every rostered / two-way player has a number', r.noNum === 0, r.noNum);
  chk('LAL #1: Knecht keeps it; Thiero not #1 if on LAL', r.nums.knecht === 1 && (r.nums.thieroTeam == null || r.nums.thiero !== 1), r.nums.knecht + ' / ' + r.nums.thiero);
  chk('MEM #1: Clayton keeps it, Pippen gets another', r.nums.clayton === 1 && r.nums.pippen !== 1 && r.nums.pippen != null, r.nums.clayton + ' / ' + r.nums.pippen);
  chk('"00" kept apart from 0 (BKN Minott 00, Brown 0)', r.nums.minott === '00' && r.nums.brown === 0);
  chk('real numbers: Luka 77, LeBron 23, Wemby 1', r.nums.luka === 77 && r.nums.lebron === 23 && r.nums.wemby === 1);
  out.push('rookies tagged: ' + r.rookies.length + ' e.g. ' + r.rookies.slice(0, 6).join(', '));
  chk('real first-year players tagged (40-70)', r.rookies.length >= 40 && r.rookies.length <= 70, r.rookies.length);
  chk('Dybantsa rookie; Flagg and LeBron not', r.rkCheck.dybantsa && !r.rkCheck.flagg && !r.rkCheck.lebron, JSON.stringify(r.rkCheck));
  if (!r.quick) {
    out.push('ROTY: ' + JSON.stringify(r.roy) + ' All-Rookie 1st: ' + r.roo1);
    chk('ROTY awarded after season 1 to a real rookie', r.roy && r.roy.rs === 1 && r.roy.real, JSON.stringify(r.roy));
    chk('All-Rookie 1st team has 5', r.roo1 === 5, r.roo1);
    for (const x of r.po) out.push('  ' + x.st + ' best ' + x.best + ' need ' + x.need + ' games ' + x.len.join(','));
    chk('play-in unchanged (single games)', r.po[0].best.join() === '1' && r.po[1].best.join() === '1');
    chk('first round, conf semis, conf finals, Finals all best of 7 (need 4)', r.po.slice(2).every(x => x.best.join() === '7' && x.need.join() === '4/4' && x.max === 4), r.po.slice(2).map(x => x.best + ':' + x.max).join(' '));
    chk('series lengths 4-7 games', r.po.slice(2).every(x => x.len.every(n => n >= 4 && n <= 7)));
    chk('champion crowned', r.champ && r.phase === 'season-done', r.phase);
  }
}

// ---------- C2: 16-team league unchanged ----------
if (!quick) {
  const { run } = load(SRC, SEED);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'commish',size:16,games:58});let g=0;while(L.phase==='regular'&&g++<5000)simDay(L);startPlayoffs(L);g=0;while(L.phase==='playoffs'&&g++<500)simPlayoffDay(L);
    return JSON.stringify(L.po.rounds.map((rd,i)=>({st:poStages(L)[i],best:[...new Set(rd.map(s=>s.best))]})));})()`));
  out.push('16 teams: ' + r.map(x => x.st + ' ' + x.best).join(' | '));
  chk('16 teams: play-in best 2, semis + conf finals best of 5, Finals best of 7', r.length === 4 && r[0].best.join() === '2' && r[1].best.join() === '5' && r[2].best.join() === '5' && r[3].best.join() === '7');
}

// ---------- A2: AI two-way slots over a season (weekly retries) ----------
if (!quick) {
  const { run } = load(SRC, SEED);
  const r = JSON.parse(run(`(function(){const L=newLeague({mode:'commish',size:30,games:58,nba:true});const n0=L.teams.reduce((a,t)=>a+t.twoWay.length,0);let g=0,mid=0;
    while(L.phase==='regular'&&g++<5000){simDay(L);if(L.day===Math.floor(totalDays(L)/2))mid=L.teams.reduce((a,t)=>a+t.twoWay.length,0);}
    return JSON.stringify({n0,mid,end:L.teams.reduce((a,t)=>a+t.twoWay.length,0),slots:L.teams.length*TW_MAX});})()`));
  out.push('AI two-way slots filled (NBA): ' + JSON.stringify(r));
  chk('two-way slots mostly filled by mid-season (>=75%)', r.mid >= r.slots * 0.75, r.mid + '/' + r.slots);
}

console.log(out.join('\n'));
console.log(`\nt30a: ${ok} pass, ${bad} fail`);
process.exit(bad ? 1 : 0);
