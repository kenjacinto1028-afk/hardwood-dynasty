// v26.5 Opus checks: SRC=src SEED=n node tools/t265.js [seasons]  (team mode, user team 0; statuses, minutes, feed, reactions, press, news)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||5);
run(`var MISS={};const _ap=addPost;addPost=function(L,ev,a,tone,v,o){const r=_ap(L,ev,a,tone,v,o);if(!r)MISS[ev+'.'+a+'.'+tone]=(MISS[ev+'.'+a+'.'+tone]||0)+1;return r;};
function SEASON(L,next){let g=0;while(L.phase==='regular')simDay(L);processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);if(next!==false)startNewSeason(L);}`);
console.log(run(`(function(N){const res=[],info=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));
const L=newLeague({mode:'team',userTeam:0,size:30});
// A2 personality
ok('every front office has patience and ambition',L.teams.every(t=>{const f=foOf(L,t);return f.pat>=5&&f.pat<=95&&f.amb>=5&&f.amb<=95;}),L.teams.slice(0,6).map(t=>t.fo.style[0]+t.fo.pat+'/'+t.fo.amb).join(' '));
{const C=JSON.parse(JSON.stringify(L));for(const t of C.teams){delete t.fo.pat;delete t.fo.amb;}migrateLeague(C);ok('old saves get a personality (same as a new read)',C.teams.every((t,i)=>t.fo.pat===L.teams[i].fo.pat&&t.fo.amb===L.teams[i].fo.amb));}
ok('foSummary works',L.teams.every(t=>{const s=foSummary(L,t);return s.styleLabel&&Array.isArray(s.traits);}));
let UG=[];const mix=[],rise=[],flip=[],tankP=[],rebLen={};let reb=0,rebN=0,ybY=[],ybV=[],ybC=[];const st0={};
const T=totalDays(L);
for(let y=0;y<N;y++){
 const seen={};const snap=lb=>{for(const t of L.teams){(seen[t.id]=seen[t.id]||[]).push(t.status);}};
 snap('pre');let g=0;
 while(L.phase==='regular'){simDay(L);if(L.day===Math.floor(T*0.4)+1||L.day===Math.floor(T*0.6)+1)snap();
  if(L.day===Math.floor(T*0.5)){for(const t of L.teams){if(t.id===L.user)continue;const yb=t.yb||{};for(const p of rosterOf(L,t)){const b=yb[p.id]||0;if(['rebuild','tank','rising'].includes(t.status)&&p.age<=24)ybY.push(b);else if(['rebuild','tank'].includes(t.status)&&p.age>=30)ybV.push(b);else if(['contend','allin'].includes(t.status))ybC.push(b);}}}}
 const c={};for(const t of L.teams)c[t.status]=(c[t.status]||0)+1;mix.push(c);rise.push(c.rising||0);tankP.push((c.tank||0)/L.teams.length);
 // flip-flops: A -> B -> A inside one season
 let ff=0;for(const id in seen){const s=seen[id];for(let i=2;i<s.length;i++)if(s[i]===s[i-2]&&s[i]!==s[i-1])ff++;}flip.push(ff);
 for(const t of L.teams){if(t.status==='rebuild'||t.status==='tank'){rebLen[t.id]=(rebLen[t.id]||0)+1;}else if(rebLen[t.id]){reb+=rebLen[t.id];rebN++;rebLen[t.id]=0;}}
 if(y===N-1){UG=L.games.filter(g=>g.home===L.user||g.away===L.user);}
 const tr=L.trades.filter(x=>x.s===L.season).length;info.push('S'+(y+1)+' trades '+tr+' | '+Object.entries(c).map(([k,v])=>k+' '+v).join(', ')+' | flip '+ff);
 SEASON(L,y<N-1);}
const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
if(N>=4)ok('Rising teams appear (1-4 a season on average)',avg(rise)>=0.5&&Math.max(...rise)<=4,rise.join(','));else info.push('Rising at season end '+rise.join(',')+' (needs 4+ seasons to judge)');
ok('about 20% or fewer tank',Math.max(...tankP)<=0.2,tankP.map(x=>Math.round(x*100)+'%').join(','));
ok('no A->B->A flip-flops inside a season',flip.every(x=>x===0),flip.join(','));
(N>=4?ok:(n,c,x)=>info.push(n+' (needs 4+ seasons) ['+x+']'))('rebuild/tank spells last 2+ seasons on average',rebN===0||reb/rebN>=1.8,(rebN?(reb/rebN).toFixed(2):'-')+' seasons, n='+rebN);
ok('status minutes: young on low/rising teams get a bonus, 30+ on rebuild/tank a cut, contenders none',avg(ybY)>2&&avg(ybV)<0&&ybC.every(x=>x===0),avg(ybY).toFixed(2)+' / '+avg(ybV).toFixed(2)+' / '+ybC.filter(x=>x).length);
info.push('roll reasons '+JSON.stringify(RISE_CNT)+' | rising-blocked AI deals '+(DEAL_CNT.rising||0));
// A1 rising rules
{const R=L.teams.find(t=>t.id!==L.user);const was=R.status;R.status='rising';R.mode='hopeful';
 const own=L.picks.find(k=>k.orig===R.id&&k.owner===R.id&&k.rd===1&&k.s===nextDraftS(L));const far=L.picks.find(k=>k.orig===R.id&&k.owner===R.id&&k.rd===1&&k.s>=nextDraftS(L)+4);
 ok('Rising: keeps its own near 1st, can trade a far one',!risingOK(L,R,{players:[],picks:[own.id]},{players:[]})&&(!far||risingOK(L,R,{players:[],picks:[far.id]},{players:[]})));
 const vet=active(L).find(p=>p.team!=null&&p.team!==R.id&&p.age>=29&&yrsLeft(L,p)>=2),exp=active(L).find(p=>p.team!=null&&p.team!==R.id&&p.age>=29&&yrsLeft(L,p)===1);
 ok('Rising: buys only expiring veterans',vet&&!risingOK(L,R,{players:[],picks:[]},{players:[vet.id]})&&(!exp||risingOK(L,R,{players:[],picks:[]},{players:[exp.id]})));
 ok('Rising: own near 1st valued x1.3',ownPickPrem(L,R,own)===1.3);
 refreshTradeStatus(L);const pr=Object.values(R.tstat||{}).filter(x=>x.k==='protect').length;info.push('rising test team protects '+pr);
 R.status=was;R.mode=STATUS_MODE[was];refreshTradeStatus(L);}
// B1 feed
const F=L.feed||[];const txt=F.map(p=>postText(L,p));
ok('feed capped at '+FEED_MAX,F.length<=FEED_MAX,F.length);
ok('no { or undefined or NaN in posts',txt.every(t=>t&&!/[{}]|undefined|NaN/.test(t)),txt.find(t=>!t||/[{}]|undefined|NaN/.test(t)));
ok('every emitted post found its text (no missing keys)',Object.keys(MISS).length===0,JSON.stringify(MISS));
const by={};for(const p of F)by[p.a]=(by[p.a]||0)+1;info.push('feed authors '+JSON.stringify(by)+' | events '+JSON.stringify(F.reduce((o,p)=>(o[p.ev]=(o[p.ev]||0)+1,o),{})));
ok('your-team filter',feedList(L,'team',300).every(p=>p.mine));
ok('likes positive',F.every(p=>p.likes>0));
// trade posts only for trades that happened
const trP=F.filter(p=>p.ev==='trade'&&(p.a==='nat'||p.a==='beat'));ok('every trade post matches a real trade',trP.every(p=>L.trades.some(r=>r.aGets===p.v.aGets&&r.bGets===p.v.bGets)),trP.length);
// tones follow traits
const tp=F.filter(p=>p.a==='player'&&p.pid!=null&&['loyal','money','winner','motor'].includes(p.tone));
ok('player tones match traits',tp.every(p=>{const q=L.players[p.pid];return q&&trv(q,{loyal:'loy',money:'mon',winner:'win',motor:'mot'}[p.tone])>=60;}),tp.length);
// B2 reactions on your games
const ug=UG;const withRx=ug.filter(g=>g.rx&&g.rx.length);
ok('reactions on your games (1-3 each)',withRx.length>=ug.length*0.95&&withRx.every(g=>g.rx.length>=1&&g.rx.length<=3),withRx.length+'/'+ug.length);
const rxt=withRx.flatMap(g=>g.rx.map(q=>rxText(q,g.id)));ok('reaction text clean',rxt.every(t=>t&&!/[{}]|undefined|NaN/.test(t)),rxt.find(t=>!t||/[{}]|undefined|NaN/.test(t)));
if(withRx.length)info.push('sample reactions: '+withRx.slice(-1)[0].rx.map(q=>rxWho(L,q)+': '+rxText(q,1)).join(' | '));
// B3 press
L.press=null;L.phase='regular';L.day=10;const t=L.teams[L.user];t.streak=-5;const P=pressTrigger(L,'streakL',{n:5});
ok('press conference opens with 1-2 questions',P&&P.qs.length>=1&&P.qs.length<=2,P&&P.qs.map(q=>pressText(q)).join(' / '));
const h0=t.hype==null?50:t.hype,tr0=t.owner?t.owner.trust:null,rep0=mediaRep(L);
const r1=answerPress(L,0,'humble');ok('humble answer: rep and trust up',r1&&mediaRep(L)===rep0+2&&(!t.owner||t.owner.trust===tr0+1),r1&&r1.quote);
if(P.qs[1]){const subj=L.players[P.qs[1].pid],m0=subj.morale==null?60:subj.morale,c=trv(subj,'cch');const r2=answerPress(L,1,'callout');const d=(subj.morale)-m0;
 ok('call-out: subject morale drops by coachability',r2&&(c<45?d<=-12||subj.morale===0:c<70?d===-6||subj.morale===0:d===-2),subj.name+' cch '+c+' d '+d+' | '+(r2&&r2.quote));}
ok('press closes after all answers',P.done);
ok('answered press makes a beat post',(L.feed||[]).some(p=>p.ev==='press'));
// B4 news
const cats={};for(const x of L.log)cats[x.cat]=(cats[x.cat]||0)+1;info.push('news cats '+JSON.stringify(cats));
ok('rumors logged',(L.rumors||[]).length>0||cats.rumor>0,(L.rumors||[]).length);
const nt=L.log.filter(x=>['rumor','beat','feature'].includes(x.cat)||x.k==='status').map(x=>x.text);ok('news text clean',nt.every(t=>!/[{}]|undefined|NaN/.test(t)),nt.find(t=>/[{}]|undefined|NaN/.test(t)));
prBlurbs(L);ok('power-ranking blurbs for every team',L.teams.every(t=>prBlurb(L,t.id)),prBlurb(L,L.pr.now[0]));
ok('save size ok (feed < 150 KB)',JSON.stringify(L.feed).length<150000,Math.round(JSON.stringify(L.feed).length/1024)+' KB');
return res.join('\\n')+'\\n'+info.join('\\n')+'\\n'+res.filter(x=>x.startsWith('PASS')).length+'/'+res.length+' pass';})(${+process.argv[2]||2})`));
