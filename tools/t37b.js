// v37b: legacy mapping (one career scale) + Hall of Fame checks. node tools/t37b.js  (~1 min)
const R = []; const ok = (n, c, x) => { R.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); console.log(R[R.length - 1]); };
const SRC = __dirname + '/../src';
{ // day-1 league
  const { run } = require('./load.js')(SRC, 21);
  const o = JSON.parse(run(`(()=>{const L=newLeague({mode:'commish',size:30,games:82,nba:true});migrateLeague(L);
    const E=[];for(const p of Object.values(L.players)){const v=legacyScore(p,null);if(v>0)E.push({n:p.name,v,act:1});}
    for(const {l,x} of hxLegendGreats(L))E.push({n:l.name,v:x.v});E.sort((a,b)=>b.v-a.v);
    const rank=n=>E.findIndex(e=>e.n===n)+1, cp=hxLegLegacy(nbaLegends().find(l=>l.name==='Chris Paul')), wilt=hxLegLegacy(nbaLegends().find(l=>l.name==='Wilt Chamberlain'));
    const lb=Object.values(L.players).find(p=>p.name==='LeBron James'), cle=L.teams.find(t=>nbaAbOf(t)==='CLE').id, mia=L.teams.find(t=>nbaAbOf(t)==='MIA').id;
    const miaMvp=lb.awards.filter(a=>a.real&&a.a==='MVP'&&(lb.legSeasT[a.s]||[]).includes(mia)).length;
    // double induction: a retired player named like a Hall of Famer from the history list
    const p=Object.values(L.players).find(q=>q.real&&q.awards.some(a=>a.a==='MVP'));const nm=p.name;p.name='Carmelo Anthony';const n0=L.hof.length;honorRetired(L,p);const dbl=L.hof.length-n0,hx=p.hofX;p.name=nm;
    const q=Object.values(L.players).find(z=>z.real&&z.name==='Kevin Durant');const n1=L.hof.length;honorRetired(L,q);
    return JSON.stringify({n:E.length,top:E.slice(0,5).map(e=>e.n),r:{j:rank('Michael Jordan'),l:rank('LeBron James'),k:rank('Kareem Abdul-Jabbar'),w:rank('Wilt Chamberlain'),b:rank('Bill Russell')},cpG:cp.g,wiltG:wilt.g,lbBase:lb.legBase,lbCle:legacyScore(lb,cle,true),lbAll:legacyScore(lb,null),miaMvp,legV:L.legV,dbl,hx,kd:L.hof.length-n1});})()`));
  ok('Jordan / LeBron / Kareem are the top 3 on day 1', ['Michael Jordan', 'LeBron James', 'Kareem Abdul-Jabbar'].every(n => o.top.slice(0, 3).includes(n)), o.top.join(', '));
  ok('Wilt and Russell in the top 10', o.r.w <= 10 && o.r.b <= 10, JSON.stringify(o.r));
  ok('legend with missing shot attempts is not inflated (Chris Paul game score < 20)', o.cpG < 20, o.cpG);
  ok('100+ careers ranked on day 1 (Top 100 fills)', o.n >= 100, o.n);
  ok('LeBron real base counts playoffs too (> 1500)', o.lbBase > 1500, o.lbBase);
  ok('LeBron with CLE < career; his MIA MVPs are 2 (award -> season team)', o.lbCle < o.lbAll && o.miaMvp === 2, `${o.lbCle} / ${o.lbAll}, MIA MVPs ${o.miaMvp}`);
  ok('new league stamped legV 37', o.legV === 37);
  ok('a Hall of Famer from the history list is not inducted twice', o.dbl === 0 && o.hx === 2025, `added ${o.dbl}, hofX ${o.hx}`);
  ok('an active star with a real résumé gets in on retiring (Durant)', o.kd === 1);
}
{ // calibration on the saved league: top season values per season, real 2022-25 vs this league S1-10
  const { run } = require('./snap.js')(SRC, 21, __dirname + '/snap/nba-commish-s10.json.gz');
  const o = JSON.parse(run(`(()=>{const L=SL;nbaCarFix();nbaC2Fix();const av=a=>a.reduce((x,y)=>x+y,0)/a.length,top=(v,n)=>v.sort((a,b)=>b-a).slice(0,n);const out={};
    for(const n of [10,25,50]){const R=[],S=[];for(let y=2022;y<=2025;y++){const v=[];for(const D of [Object.fromEntries(Object.entries(NBA_CAR).map(([k,o])=>[k,o.rs])),NBA_CAR2])for(const k in D)for(const x of D[k])if(+x[0].slice(0,4)===y)v.push(nbaRowValue(nbaRow(x)));R.push(av(top(v,n)));}
      for(let s=1;s<=10;s++){const v=[];for(const p of Object.values(L.players))for(const h of p.hist)if(h.s===s)v.push(seasonValue(h));S.push(av(top(v,n)));}out[n]=[av(R),av(S)];}
    return JSON.stringify({out,legV:SL.legV});})()`));
  for (const n of ['10', '25', '50']) { const [r, s] = o.out[n]; ok(`calibration top ${n}: real vs sim season value within 10%`, Math.abs(s / r - 1) < 0.1, `${r.toFixed(1)} vs ${s.toFixed(1)}`); }
  ok('old save migrated (legV 37)', o.legV === 37);
}
console.log(`${R.filter(r => r.startsWith('PASS')).length}/${R.length} passed`);
