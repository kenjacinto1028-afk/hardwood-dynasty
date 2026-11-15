// v28.8: SEED=n node tools/t288.js -> locker room 2: positive moments, fines, suspensions, media interviews, one-on-ones + promises
// One season in team mode (you answer everything), through the playoffs and into the offseason (claims + promises settle, finances close).
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||3);
console.log(run(`(function(){const out=[];let ok=0,bad=0;const chk=(n,c,x)=>{if(c)ok++;else bad++;out.push((c?'PASS ':'FAIL ')+n+(x!=null?' :: '+x:''));};
const L0=newLeague({mode:'team',size:30,userTeam:5,games:${process.env.GAMES||82}${process.env.NBA?',nba:true':''}});const LL=L0;const u=LL.user,T=LL.teams[u];
const braces=s=>!s||/[{}]/.test(s)||/undefined|NaN/.test(s);
// fines scale with salary
const ps=Object.values(LL.players).filter(p=>p.team!=null&&p.contract).sort((a,b)=>b.contract.amt-a.contract.amt);const rich=ps[0],poor=ps[ps.length-1];
chk('fine scales with salary',fineAmt(rich,'fight')>fineAmt(poor,'fight')*3&&fineAmt(poor,'tech')>=LR2_FX.fineMin,fineStr(fineAmt(rich,'fight'))+' vs '+fineStr(fineAmt(poor,'fight')));
let sawSuspPlay=0,suspDays=0,ivs=[],mtgs=0,promN=0,mySusp=null,mySuspGames=null,answered=0,susChoice=0,reqs=0;
while(LL.phase==='regular'){
  const sus=new Set(Object.values(LL.players).filter(p=>p.team!=null&&isSusp(p)).map(p=>p.id));if(sus.size)suspDays++;
  const g0=LL.games.length;simDay(LL);
  for(const g of LL.games.slice(g0))for(const r of g.box)if(sus.has(r[0])&&r[2]>0&&!(LL.players[r[0]].susp&&LL.players[r[0]].susp.gid===g.id))sawSuspPlay++;
  // your suspension: day 20, your 6th man, 3 games
  if(LL.day===20){const p=rotationOf(LL,T)[5];const bad=suspendPlayer(LL,p.id,6);chk('team suspension max 5',!bad.ok,bad.msg);const r=suspendPlayer(LL,p.id,3,'skipped practice');chk('suspendPlayer ok',r.ok&&p.susp.g===3,JSON.stringify(p.susp));mySusp=p;mySuspGames=T.w+T.l;}
  if(mySusp&&mySuspGames!=null&&T.w+T.l===mySuspGames+3&&mySusp.disc.suspG===3&&mySusp.team===u){chk('served 3 games, back',!isSusp(mySusp),JSON.stringify(mySusp.susp));mySuspGames=null;}
  const ev=dramaOpen(LL);if(ev){const cs=drChoicesFor(ev);const c=cs.includes('suspend')&&susChoice<2?'suspend':['talk','discipline','coach','player'][answered%4];if(c==='suspend')susChoice++;answerDrama(LL,c);answered++;}
  const I=ivOpen(LL);if(I){ivs.push(I);I.qs.forEach((q,i)=>ivAnswer(LL,i,(I.id+i)%4));}
  const M=mtgOpen(LL);if(M){if(M.by==='player')reqs++;const o=mtgOptions(LL,M);const pick=o.find(x=>x.k==='min')||o.find(x=>x.k==='start')||o[0];mtgAnswer(LL,pick.k);mtgs++;}
  if(LL.day===30){const p=rotationOf(LL,T)[7];const r=meetPlayer(LL,p.id);chk('meetPlayer',r.ok,r.msg);const r2=meetPlayer(LL,p.id);chk('one meeting at a time',!r2.ok,r2.msg);const o=mtgOptions(LL);out.push('options '+o.map(x=>x.k+(x.v?'('+x.v+')':'')).join(' '));chk('option labels',o.length>=2&&o.every(x=>x.lbl));const m=o.find(x=>x.k==='min');if(m){mtgAnswer(LL,'min');promN++;}else mtgAnswer(LL,o[0].k);mtgs++;const r3=meetPlayer(LL,p.id);chk('cooldown',!r3.ok,r3.msg);}
}
chk('suspended players never played',sawSuspPlay===0,sawSuspPlay+' rows, '+suspDays+' days with suspensions');
const C=LR2_CNT;out.push('counts '+JSON.stringify(C));
const gp=LL.games.length;chk('techs per game 0.3-1.2',C.tech/gp>=0.3&&C.tech/gp<=1.2,(C.tech/gp).toFixed(2));
const TL=discLeaders(LL,'tech',5);out.push('tech leaders '+JSON.stringify(TL.map(x=>[x.name,x.v,x.ej,fineStr(x.fines)])));
chk('tech leader in range',TL.length&&TL[0].v>=6&&TL[0].v<=25,TL[0]&&TL[0].v);
chk('flagrants',C.flag>=5,C.flag);chk('fights 1-25',C.fight>=1&&C.fight<=25,C.fight);
chk('league suspensions',C.suspL>=2,C.suspL+' (tech '+C.techSusp+', flag '+C.flagSusp+')');chk('team suspensions',C.suspT>=2,C.suspT);
const saved=LL.teams.reduce((a,t)=>a+(t.fin.suspSaved||0),0),fined=LL.teams.reduce((a,t)=>a+(t.fin.fines||0),0);
chk('salary saved',saved>0,fineStr(saved));chk('team fines to team cash',fined>0,fineStr(fined));chk('league fines logged',(LL.lgFines||{})[LL.season]>0,fineStr((LL.lgFines||{})[LL.season]||0));
chk('fine log ok',(LL.fines||[]).every(f=>f.amt>=LR2_FX.fineMin&&f.pid!=null),(LL.fines||[]).length);
const news=LL.log.filter(x=>x.k==='susp'||x.k==='disc'||x.k==='iv'||x.k==='mtg'||x.k==='drama');chk('news text ok',news.every(x=>!braces(x.text)),(news.find(x=>braces(x.text))||{}).text);
out.push('sample '+JSON.stringify(news.filter(x=>x.k!=='drama').slice(0,6).map(x=>x.text)));
const pos=(LL.drama||[]).filter(e=>e.pos);const pk={};pos.forEach(e=>pk[e.k]=(pk[e.k]||0)+1);
chk('positive moments',pos.length>=8&&Object.keys(pk).length>=4,JSON.stringify(pk));chk('positive text',pos.every(e=>!braces(e.text)));
const cond=(LL.drama||[]).filter(e=>e.k==='conduct');chk('conduct incidents',cond.length>=1&&cond.every(e=>e.sev>=1&&e.sev<=5&&!braces(e.text)),cond.length);
chk('suspend answer used',(LL.drama||[]).some(e=>e.choice==='suspend'&&e.sg>=1),susChoice);
const reg=ivs.filter(i=>i.stage!=='playoffs');chk('2 interviews in the regular season',reg.length===2,ivs.map(i=>i.stage).join(','));
chk('3 questions, 4 answers',ivs.every(i=>i.qs.length===3&&i.qs.every(q=>!braces(ivText(LL,q))&&ivAnswers(LL,q).length===4&&ivAnswers(LL,q).every(a=>a&&!braces(a)))));
chk('interviews answered',ivs.every(i=>i.done&&i.qs.every(q=>q.ans!=null)));
out.push('iv '+JSON.stringify(ivs.map(i=>[i.stage,i.outlet,i.qs.map(q=>q.k+':'+q.ans)])));
chk('meetings',mtgs>=1,mtgs+' (requests '+reqs+')');
const prs=promiseList(LL,u);out.push('promises '+JSON.stringify(prs.map(x=>[x.k,x.v,x.st,LL.players[x.pid].name])));chk('promises tracked',prs.length>=1);
const mp=Object.values(LL.players).filter(p=>p.moraleParts&&(p.moraleParts.talk!=null||p.moraleParts.gmPromise!=null||p.moraleParts.susp!=null)).length;out.push('morale parts talk/gmPromise/susp on '+mp+' players');
// playoffs (user's playoff interview if they made it) and season close
processPending(LL);startPlayoffs(LL);let n=0;let poIv=null;while(LL.phase==='playoffs'&&n++<400){simPlayoffDay(LL);const I=ivOpen(LL);if(I&&I.stage==='playoffs'){poIv=I;I.qs.forEach((q,i)=>ivAnswer(LL,i,i%4));}}
const made=LL.po.rounds.some((r,i)=>!isPlayin(LL,i)&&r.some(s=>s.hi===u||s.lo===u));chk('playoff interview iff made playoffs',made?!!poIv:!poIv,made+' '+(poIv&&poIv.qs.map(q=>q.k).join(',')));
if(poIv)chk('playoff interview asks about the series',poIv.qs.some(q=>q.k==='series'),poIv.qs.map(q=>q.k).join(','));
const cl=(LL.claims||[]).length;startOffseason(LL);
chk('claims settled',(LL.claims||[]).every(c=>c.done),cl+' claims '+JSON.stringify((LL.claims||[]).map(c=>[c.k,c.hit])));
const fh=LL.teams.map(t=>t.finHist[t.finHist.length-1]);chk('finance rows have fines + saved pay',fh.some(r=>r.suspSaved>0)&&fh.some(r=>r.fines>0),fh.filter(r=>r.suspSaved>0).length+' teams saved, '+fh.filter(r=>r.fines>0).length+' teams fined');
chk('promises settled',promiseList(LL,u).some(x=>x.st!=='open'),JSON.stringify(promiseList(LL,u).map(x=>x.k+':'+x.st)));
chk('no promises left open for in-season kinds',promiseList(LL,u).every(x=>x.st!=='open'||x.k==='ext'||x.k==='trade'));
out.push(ok+' pass, '+bad+' fail');return out.join('\\n');})()`));
