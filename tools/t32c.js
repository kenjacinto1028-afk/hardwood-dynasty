// v32c S3: node tools/t32c.js   (SEED=n default 5)
// A coach patterns differ; tight coaches leave starters in longer than deep ones; plan minutes match the role targets
// B starters start the game and the 2nd half (timeline); minutes rebuilt from the timeline = box score minutes
// C play-by-play sub lines match the timeline events (who, and when)
// D your saved chart runs the game; an invalid chart (injured player, too few players) falls back to the coach
// E timelines kept for your games and the last 30 league games only
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 5;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = load(SRC, SEED);
const J = c => JSON.parse(run(`JSON.stringify((function(){${c}})())`));
run(`var L=newLeague({mode:'team',size:30,userTeam:5,games:82,nba:true});`);

// ---------- A ----------
{
  const r = J(`const pats=L.teams.map(t=>coachPat(t.coach));const keys=new Set(pats.map(x=>x.first.join()+'|'+Math.round(x.e1)+'|'+Math.round(x.e2)));
    const firstStint=st=>{const out=[];for(const t of L.teams){if((t.coach.rot||'Balanced')!==st)continue;const g=buildSide(L,t.id,true,false);for(const p of g.court){let m=0;while(m<48&&g.plan[m][g.slotOf[p.id]]===p)m++;out.push(m);}}return out.length?out.reduce((a,b)=>a+b,0)/out.length:null;};
    let worst=0,cnt=0,w2=[];for(const t of L.teams){const g=buildSide(L,t.id,true,false);const mins={};for(const row of g.plan)for(const p of row)if(p)mins[p.id]=(mins[p.id]||0)+1;
      for(const p of g.court){const d=Math.abs((mins[p.id]||0)-g.target[p.id]/60);if(d>worst)worst=d;cnt++;}
      const full=g.plan.every(row=>row.every(Boolean)&&new Set(row.map(p=>p.id)).size===5);if(!full)w2.push(t.abbr);}
    const half=L.teams.every(t=>{const g=buildSide(L,t.id,true,false);return g.court.every((p,s)=>g.plan[0][s]===p&&g.plan[24][s]===p);});
    return {distinct:keys.size,tight:firstStint('Tight'),deep:firstStint('Deep'),worst,w2,half};`);
  chk('coach patterns differ (distinct first-sub groups / times)', r.distinct >= 8, r.distinct);
  chk('tight coaches leave starters in longer than deep coaches (first stint, minutes)', r.tight == null || r.deep == null || r.tight > r.deep, r.tight + ' vs ' + r.deep);
  chk('every plan minute has 5 different players', r.w2.length === 0, r.w2.join(','));
  chk('starters planned for minute 0 and minute 24 (start of each half)', r.half);
  chk('planned starter minutes match the role targets (within 1.5)', r.worst <= 1.5, r.worst.toFixed(2));
}
// ---------- B + C ----------
run(`for(let d=0;d<20;d++)simDay(L);`);
{
  const r = J(`const G=L.games.filter(g=>g.tl&&g.tl[0]);let n=0,stOk=0,half=0,halfN=0,maxd=0,bad=[];
    for(const g of G)for(let s=0;s<2;s++){const tl=g.tl[s];n++;const gs=g.box.filter(r=>r[1]===s&&r[17]).map(r=>r[0]).sort().join();if([...tl.st].sort().join()===gs)stOk++;
      const rp=tlReplay(tl,2880+300*(g.ot||0));const q3=rp.byMin[24];if(q3){halfN++;if([...q3].sort().join()===[...tl.st].sort().join())half++;}
      for(const row of g.box)if(row[1]===s){const d=Math.abs((rp.sec[row[0]]||0)-row[2]);if(d>maxd){maxd=d;}if(d>2)bad.push(g.id+':'+row[0]+':'+d.toFixed(1));}}
    const U=L.games.filter(g=>g.pbp&&g.tl);let subMis=0,timeMis=0,checked=0;
    for(const g of U)for(let s=0;s<2;s++){const ev=g.tl[s].ev, lines=g.pbp.filter(e=>e[6].includes('u')&&e[2]===s);
      // every timeline event time has a sub line at the same game time
      const times=new Set(lines.map(e=>{const q=e[0];const base=q<=4?(q-1)*720:2880+(q-5)*300, len=q<=4?720:300;return Math.round(base+len-e[1]);}));
      const evT=new Set(ev.map(e=>Math.round(e[0]/10)));checked+=evT.size;
      for(const t of evT)if(![t-1,t,t+1].some(x=>times.has(x)))timeMis++;
      const nIn=lines.reduce((a,e)=>a+(e[3].split(' in')[0].split(': ')[1]||'').split(', ').length,0), evIn=ev.filter(e=>e[2]>=0).length;if(nIn!==evIn)subMis++;}
    return {n,stOk,half,halfN,maxd,bad:bad.slice(0,4),U:U.length,subMis,timeMis,checked};`);
  chk('timeline starters = box score starters (every team-game)', r.stOk === r.n, r.stOk + '/' + r.n);
  chk('starters open the 2nd half in 85%+ of team-games (foul trouble / blowouts aside)', r.half >= r.halfN * 0.85, r.half + '/' + r.halfN);
  chk('minutes rebuilt from the timeline = box score minutes (within 2 s)', r.maxd <= 2, r.maxd.toFixed(2) + ' ' + r.bad.join(' '));
  chk('play-by-play sub lines at the timeline event times', r.U > 0 && r.timeMis === 0, `${r.U} games, ${r.checked} events, ${r.timeMis} off`);
  chk('play-by-play sub lines name as many players as the timeline', r.subMis === 0, r.subMis);
}
// ---------- D chart ----------
{
  const r = J(`const t=L.teams[5];for(const id of t.roster)L.players[id].injury=0;
    const ps=t.roster.map(id=>L.players[id]).sort((a,b)=>b.ovr-a.ovr).slice(0,9), a=ps.slice(0,5).map(p=>p.id), b=[ps[5],ps[6],ps[7],ps[8],ps[0]].map(p=>p.id);
    t.rotChart={q:[0,1,2,3].map(q=>[a,a,b,a])};
    const playNext=()=>{let g0=L.games.length;for(let d=0;d<6;d++){simDay(L);const g=L.games.slice(g0).find(x=>x.home===5||x.away===5);if(g)return g;g0=L.games.length;}return null;};
    const g=playNext();const s=g.home===5?0:1,tl=g.tl[s];const rp=tlReplay(tl,2880+300*(g.ot||0));
    let match=0,tot=0,h1=0;for(let m=0;m<48;m++){const want=(m%12)>=6&&(m%12)<9?b:a;const got=rp.byMin[m];if(!got)continue;tot++;if([...want].sort().join()===[...got].sort().join()){match++;if(m<24)h1++;}}
    const st=[...tl.st].sort().join()===[...a].sort().join();
    // invalid: injure one chart player
    L.players[b[0]].injury=5;const g2=playNext();const s2=g2.home===5?0:1;const tl2=g2.tl[s2];L.players[b[0]].injury=0;
    t.rotChart={q:[[a.slice(0,4),a,a,a],[a,a,a,a],[a,a,a,a],[a,a,a,a]]};const g3=playNext();const tl3=g3.tl[g3.home===5?0:1];
    t.rotChart=null;
    return {src:tl.src,match,tot,h1,st,src2:tl2.src,bad2:tl2.bad||'',src3:tl3.src,bad3:tl3.bad||''};`);
  chk('your chart runs the game (source = chart, starters = chart Q1 block 1)', r.src === 'chart' && r.st, r.src);
  chk('on-court five follows the chart: 1st half 90%+, whole game 60%+ (close finishes / blowouts / fouls take over)', r.h1 >= 22 && r.match >= r.tot * 0.6, r.h1 + '/24, ' + r.match + '/' + r.tot);
  chk('chart with an injured player falls back to the coach (with a reason)', r.src2 === 'coach' && /not available/.test(r.bad2), r.src2 + ' ' + r.bad2);
  chk('chart with a 4-man block falls back to the coach', r.src3 === 'coach' && /5 different/.test(r.bad3), r.src3 + ' ' + r.bad3);
}
// ---------- E ----------
{
  const r = J(`const U=L.user;const other=L.games.filter(g=>g.tl&&g.home!==U&&g.away!==U).length,mine=L.games.filter(g=>g.home===U||g.away===U),mineTl=mine.filter(g=>g.tl).length;
    const kbTl=Math.round(JSON.stringify(L.games.map(g=>g.tl||null)).length/1024);return {other,mine:mine.length,mineTl,kbTl};`);
  chk('timelines: all your games, at most 30 others', r.other <= 30 && r.mineTl === r.mine, `${r.mineTl}/${r.mine} yours, ${r.other} others, ${r.kbTl} KB`);
}
console.log(out.join('\n')); console.log(`\nt32c: ${ok}/${ok + bad}`); process.exit(bad ? 1 : 0);
