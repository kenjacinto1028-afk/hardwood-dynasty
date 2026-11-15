// v32e S5: node tools/t32e.js   (SEED=n default 5)
// A asks: OVR 55 and under ask the minimum (any age); 56-59 ask up to ~2x the minimum; no player under 60 asks $10M+; negotiation quote follows
// B AI bids: faRound never bids over the cap for a sub-60 player
// C re-signing: a wanted rotation player re-signs most of the time; some walk away (surprise news)
// D win-first: an older ringless star free agent takes a pay cut to join a contender (news.paycut, kind 'paycut'); never one you offered
// E expiring trades: space-clearing team gets an expiring deal, sends a longer one (+ low picks only); rec.kind 'exp', write-up keys
// F text keys present (news.paycut, news.walk, mv.t.expiring/absorb/longfit/dump)
const load = require('./load.js'), SRC = process.env.SRC || 'src', SEED = +process.env.SEED || 5;
const out = []; let ok = 0, bad = 0;
const chk = (n, c, x) => { if (c) ok++; else bad++; out.push((c ? 'PASS ' : 'FAIL ') + n + (x != null ? ' :: ' + x : '')); };
const { run } = load(SRC, SEED);
const J = c => JSON.parse(run(`JSON.stringify((function(){${c}})())`));

run(`var L=newLeague({mode:'team',userTeam:5,size:30,games:82,nba:true}); computeMarket(L);`);
// ---------- A ----------
{
  const r = J(`const ps=active(L).filter(p=>!p.prospect&&!hiddenFor(L,p));const res={by:{},y55:0,y55min:0,mid:0,midOk:0,o55:0,o55min:0,ten:[],quoteBad:[]};
    for(const p of ps){p.ask=null;setAsk(L,p);
      if(p.ovr<=55&&p.age<=25){res.y55++;if(p.ask<=MINSAL+1e-6)res.y55min++;}
      if(p.ovr<=55&&p.age>25){res.o55++;if(p.ask<=MINSAL+1e-6)res.o55min++;}
      if(p.ovr>=56&&p.ovr<=59){res.mid++;if(p.ask<=2.3*MINSAL+0.05)res.midOk++;}(res.by[p.ovr]=res.by[p.ovr]||[]).push(p.ask);
      if(p.ovr<60&&p.ask>=10)res.ten.push(p.name);}
    const t=L.teams.find(x=>x.id!==L.user&&x.mode==='tank')||L.teams[0];
    for(const p of ps.filter(p=>p.ovr<60).slice(0,40)){const q=negotiate(L,p.id,MINSAL,2,t.id,'signing',null,{quote:true});if(q&&q.quote>2.3*MINSAL+0.05)res.quoteBad.push(p.name+' '+p.ovr+' '+q.quote);}
    const y=ps.find(p=>p.age<=25&&p.ovr<=55);const sv={ovr:y.ovr,pot:y.pot,scout:y.scout};y.pot=y.scout=85;computeMarket(L);y.ask=null;setAsk(L,y);res.highPot={ask:y.ask,mval:y.mval};Object.assign(y,sv);computeMarket(L);
    const med=a=>{a=a.slice().sort((x,y)=>x-y);return a[Math.floor(a.length/2)];};res.med={};for(let o=57;o<=67;o++)if(res.by[o]&&res.by[o].length>=3)res.med[o]=med(res.by[o]);res.u59=new Set((res.by[59]||[]).map(x=>x.toFixed(1))).size;delete res.by;
    return res;`);
  chk('young (<=25) OVR <=55 all ask the minimum', r.y55 > 20 && r.y55min === r.y55, r.y55min + '/' + r.y55);
  chk('older OVR <=55 also ask the minimum', r.o55min === r.o55, r.o55min + '/' + r.o55);
  { const ks = Object.keys(r.med).map(Number).sort((a, b) => a - b); let mono = true, jump = 0; for (let i = 1; i < ks.length; i++) { const a = r.med[ks[i - 1]], b = r.med[ks[i]]; if (b + 0.5 < a) mono = false; if (ks[i] - ks[i - 1] === 1) jump = Math.max(jump, b / a); }
    chk('asks ramp up smoothly 57-67 (median rises, no step over 2.2x between two ratings)', mono && jump <= 2.2, JSON.stringify(r.med) + ' max step ' + jump.toFixed(2));
    chk('asks vary by player (not one fixed number per rating)', r.u59 >= 3, r.u59 + ' different asks at 59'); }
  chk('OVR 56-59 ask at most ~2x the minimum', r.mid > 5 && r.midOk === r.mid, r.midOk + '/' + r.mid);
  chk('no player under 60 asks $10M+', r.ten.length === 0, r.ten.slice(0, 3).join(', '));
  chk('negotiation quote for sub-60 players stays <= ~2x min (even with a tanking team premium)', r.quoteBad.length === 0, r.quoteBad.slice(0, 3).join(', '));
  chk('a young 55 with high potential still asks the minimum', r.highPot.ask <= 1.3 + 1e-6 && r.highPot.mval <= 1.3 + 1e-6, JSON.stringify(r.highPot));
}
// ---------- B ----------
{
  const r = J(`const t=L.teams.find(x=>x.id!==L.user);const p=active(L).find(q=>!q.prospect&&q.ovr>=57&&q.ovr<=59&&q.team!=null&&q.age<=25)||active(L).find(q=>!q.prospect&&q.ovr>=56&&q.ovr<=59&&q.team!=null);
    const from=p.team;toFA(L,p);const sv=L.phase;L.phase='regular';const sc=signContract;let got=null;signContract=function(L2,pp,tid,amt){if(pp.id===p.id)got={amt,tid};return sc.apply(this,arguments);};
    for(const x of L.teams)x.roster=x.roster.filter(id=>id!==p.id);
    try{faRound(L,true);}finally{signContract=sc;L.phase=sv;}return {ovr:p.ovr,got,cap:lowAskCap(L,p).cap};`);
  chk('AI bid for a sub-60 free agent never above his cap', !r.got || r.got.amt <= r.cap + 1e-6, JSON.stringify(r));
}
// ---------- C ----------
{
  const r = J(`let kept=0,n=0,walk=0;const why={};for(let k=0;k<6;k++){const L2=newLeague({mode:'commish',size:30,games:82,nba:true});computeMarket(L2);
    const S=L2.season,list=[];for(const t of L2.teams)for(const p of rotationOf(L2,t).slice(0,8)){if(p.ovr>=60&&p.ovr<78&&p.age<=31&&!iconTier(L2,p,t.id)){p.contract.exp=S;p.contract.opt=null;p.ext=null;p.morale=60;list.push([p.id,t.id]);}}
    L2.user=null;L2.phase='off-draft';startResign(L2);for(const [id,tid] of list){n++;if(L2.players[id].team===tid)kept++;}walk+=L2.log.filter(e=>e.k==='walk').length;for(const k in L2.resignLog.out)why[k]=(why[k]||0)+L2.resignLog.out[k];}
    return {kept,n,rate:kept/n,walk,why};`);
  chk('rotation players (60-77, age <=31) re-sign most of the time (60-88%)', r.rate >= 0.6 && r.rate <= 0.88, (r.rate * 100).toFixed(0) + '% of ' + r.n);
  chk('players leave for several reasons (3+ player kinds + team side; v32g: was 4+, seed-dependent: the role reason needs 15+ games of stats, none in a new league)', Object.keys(r.why).filter(k => k.startsWith('p:')).length >= 3 && Object.keys(r.why).some(k => k.startsWith('t:')), JSON.stringify(r.why));
  chk('news when a good player turns his team down', r.walk >= 1, r.walk + ' news lines');
}
// ---------- D ----------
{
  const r = J(`const L2=newLeague({mode:'team',userTeam:5,size:30,games:82,nba:true});computeMarket(L2);L2.phase='off-fa';L2.faDay=2;L2.faOffers={};
    const tops=active(L2).filter(p=>p.team!=null&&p.team!==L2.user&&p.ovr>=74&&p.age>=31&&!(p.awards||[]).some(a=>a.a==='Champion')).slice(0,3);
    const user=active(L2).filter(p=>p.team!=null&&p.team!==L2.user&&p.ovr>=74&&p.age>=31&&!tops.includes(p)).slice(0,1);
    for(const p of [...tops,...user]){p.tx=p.tx||[];toFA(L2,p);}
    for(const p of user){L2.faOffers[p.id]={amt:MINSAL,yrs:1};}
    const res=[];for(let k=0;k<30&&res.length<2;k++){L2.faDay=1+k%3;if(k%3===0)for(const p of tops)if(p.team==null)p.wfAsk=null;   /* each pass = a new summer: he decides again */res.push(...winFirstFA(L2));}
    const w=res.map(id=>{const p=L2.players[id],t=L2.teams[p.team];return {name:p.name,age:p.age,ovr:p.ovr,amt:p.contract.amt,mval:p.mval,st:t.status||t.mode,user:p.team===L2.user};});
    return {n:res.length,w,news:L2.log.filter(e=>e.k==='paycut').map(e=>e.text),userTouched:user.some(p=>p.team!=null),c:tops.length};`);
  chk('win-first: ringless older star free agents sign with a contender at a pay cut', r.n >= 1 && r.w.every(x => x.amt <= x.mval * 0.8 + 1e-6 && ['allin', 'contend'].includes(x.st) && !x.user), JSON.stringify(r.w));
  chk('win-first: news line written (kind paycut)', r.news.length === r.n && r.n > 0, r.news[0]);
  chk('win-first: a player you made an offer to is left alone', !r.userTouched, '');
  chk('win-first has no fixed quota (each candidate has his own chance)', J(`return WIN_FIRST.n===undefined&&WIN_FIRST.p>0;`), '');
}
// ---------- E ----------
{
  const r = J(`const L2=newLeague({mode:'team',userTeam:5,size:30,games:82,nba:true});let g=0;while(L2.phase==='regular'&&L2.day<deadlineDay(L2)-10&&g++<300)simDay(L2);
    const cs=capSeason(L2),n=L2.teams.length,list=[];let errs=[];
    for(let i=0;i<25;i++){const tr=expiringTrade(L2);if(!tr)continue;const A=L2.teams[tr.a],B=L2.teams[tr.b];const X=L2.players[tr.aGive.players[0]],E=L2.players[tr.bGive.players[0]];
      const picksLow=tr.aGive.picks.every(id=>{const k=L2.picks.find(x=>x.id===id);return k.rd===2||pickProj(L2,k).mean>=0.6*n;});
      list.push({exp:E.contract.exp===cs,longer:X.contract.exp>cs,picksLow,np:tr.aGive.picks.length,noUser:tr.a!==L2.user&&tr.b!==L2.user,legal:!tradeCheck(L2,tr.a,tr.b,tr.aGive,tr.bGive),wkA:tr.wkA,wkB:tr.wkB});}
    let tr=null;for(let i=0;i<15&&!tr;i++)tr=expiringTrade(L2);let rec=null;if(tr){executeTrade(L2,tr);rec=L2.trades[0];}
    return {n:list.length,all:list.every(x=>x.exp&&x.longer&&x.picksLow&&x.np<=2&&x.noUser&&x.legal),bad:list.filter(x=>!(x.exp&&x.longer&&x.picksLow&&x.np<=2&&x.noUser&&x.legal)).slice(0,2),
      rec:rec?{kind:rec.kind,wk:rec.wk,wu:(rec.wu||[]).map(w=>w.k+': '+w.text)}:null,withPicks:list.filter(x=>x.np>0).length,fit:list.filter(x=>x.wkB==='longfit').length};`);
  chk('expiring trades are found near the deadline', r.n >= 3, r.n + ' of 25 tries');
  chk('every one: partner gets a longer deal, space team gets an expiring one, only low picks (late 1sts/2nds, max 2), legal, AI only', r.all, JSON.stringify(r.bad));
  chk('both kinds appear (paid with picks / partner wants the longer deal)', r.withPicks >= 1 || r.fit >= 1, 'picks ' + r.withPicks + ', fit ' + r.fit);
  chk('executed trade record: kind exp, reason key, write-ups use mv.t.expiring + absorb/longfit', r.rec && r.rec.kind === 'exp' && r.rec.wk === 'expiring' && r.rec.wu.length === 2 && /^expiring/.test(r.rec.wu[0]) && /^(absorb|longfit)/.test(r.rec.wu[1]), JSON.stringify(r.rec));
}
// ---------- F ----------
{
  const r = J(`return ['news.paycut','news.leave','mv.t.expiring','mv.t.absorb','mv.t.longfit','mv.t.dump'].map(k=>[k,(FLAVOR[k]||[]).length]);`);
  chk('text keys present (news 1 wording, write-ups 4)', r.every(([k, n]) => k.startsWith('news.') ? n >= 1 : n >= 4), JSON.stringify(r));
}
console.log(out.join('\n')); console.log(`t32e: ${ok}/${ok + bad} pass`); process.exit(bad ? 1 : 0);
