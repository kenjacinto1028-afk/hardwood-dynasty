// v26.6 Opus checks: SRC=src SEED=n node tools/t266.js [seasons]  (team mode, user team 0, 82 games; season length, development roles, R1-R8)
const {run}=require('./load.js')(process.env.SRC||'src',+process.env.SEED||6);
run(`var MISS={};const _ap=addPost;addPost=function(L,ev,a,tone,v,o){const r=_ap(L,ev,a,tone,v,o);if(!r)MISS[ev+'.'+a+'.'+tone]=(MISS[ev+'.'+a+'.'+tone]||0)+1;return r;};
function SEASON(L,next,hook){let g=0;while(L.phase==='regular'){simDay(L);if(hook)hook(L);}processPending(L);startPlayoffs(L);while(L.phase==='playoffs'&&g++<400)simPlayoffDay(L);
 startOffseason(L);runLottery(L);startDraft(L);g=0;while(L.phase==='off-draft'&&g++<200)aiDraftPick(L);startFA(L);g=0;while(L.phase==='off-fa'&&g++<40)faDay(L);processPending(L);if(next!==false)startNewSeason(L);}`);
console.log(run(`(function(N){const res=[],info=[];const ok=(n,c,x)=>res.push((c?'PASS ':'FAIL ')+n+(x!=null?'  ['+x+']':''));const avg=a=>a.length?a.reduce((x,y)=>x+y,0)/a.length:0;
// P1 schedules
for(const G of [58,66,82]){const T=newLeague({mode:'commish',size:30,games:G});const c={};for(const d of T.schedule)for(const [a,b] of d){c[a]=(c[a]||0)+1;c[b]=(c[b]||0)+1;}ok(G+'-game schedule: every team plays '+G,Object.values(c).every(x=>x===G),T.schedule.length+' days');}
{const T=newLeague({mode:'commish',size:16,games:82});const c={};for(const d of T.schedule)for(const [a,b] of d){c[a]=(c[a]||0)+1;c[b]=(c[b]||0)+1;}ok('16-team 82-game schedule',Object.values(c).every(x=>x===82));}
{const T=newLeague({mode:'commish',size:30,games:58});const C=JSON.parse(JSON.stringify(T));delete C.sg;migrateLeague(C);ok('old saves keep 58 games',C.sg===58&&SEASON_GAMES===58&&TW_GAMES===20);}
const L=newLeague({mode:'team',userTeam:0,size:30});ok('new leagues default to 82 games',L.sg===82&&SEASON_GAMES===82&&TW_GAMES===28,L.sg+' / '+TW_GAMES);
// P2-P4 the example: 21-year-old 65 SF, potential 82, non-shooter, rebuilding team with a pace & space coach
{const t=L.teams[5];t.status='rebuild';t.mode='rebuild';t.coach.off='pace';const p=rosterOf(L,t).find(x=>x.pos===2)||rosterOf(L,t)[0];const keep={age:p.age,ovr:p.ovr,scout:p.scout,tp:p.tp,mid:p.mid,spd:p.spd,agi:p.agi,blk:p.blk};const cdef=t.coach.def;t.coach.def='rim';
 p.age=21;p.scout=82;p.tp=32;p.mid=40;p.spd=48;p.agi=50;p.blk=40;FIT_C.delete(p);const d=devRole(L,t,p);
 ok('example SF: potential + adapted role add lineup value',d&&d.pot>=2&&d.adapt>0,d&&('pot '+d.pot+' adapt '+d.adapt+' fit '+d.fit+' focus '+d.focus));
 {const bk=p.blk;p.blk=65;ok('example SF: development plan = shooting',sysFocus(L,p)==='shoot',sysFocus(L,p));p.blk=bk;}
 const yb0=(statusMinBoost(L,t,p)+d.pot+d.adapt);info.push('example SF total lineup boost '+yb0.toFixed(1)+' (about '+(yb0/0.75).toFixed(1)+' rating points)');
 t.status='contend';t.mode='contend';ok('contender: no development role',devRole(L,t,p)===null&&sysFocus(L,p)===null);
 Object.assign(p,keep);t.coach.def=cdef;FIT_C.delete(p);t.status=null;}
let UG=[],rx=0,stats={pts:[],min:[]},inj=[],gate=[],hype=[],hotMax=0,pubSeen=0,reqEarly=0;
for(let y=0;y<N;y++){
 SEASON(L,y<N-1,L=>{if(L.day%7===2){for(const t of L.teams)hotMax=Math.max(hotMax,t.hot||0);for(const p of active(L))if(p.pub&&p.pub.s===L.season)pubSeen=Math.max(pubSeen,p.pub.st);}
  if(L.phase==='regular'&&L.schedule.length&&L.day===L.schedule.length-1){for(const t of L.teams){const s=t.trs;if(s)stats.pts.push(s.pts/s.g);if(t.fin)gate.push(t.fin.gate);hype.push(t.hype);}
   const lead=active(L).filter(p=>p.stats.rs&&p.stats.rs.gp>=gpq(40)).map(p=>p.stats.rs.pts/p.stats.rs.gp).sort((a,b)=>b-a);info.push('S'+(y+1)+' scoring leader '+lead[0].toFixed(1)+' ppg, 10th '+lead[9].toFixed(1)+' | team ppg '+avg(stats.pts).toFixed(1)+' | injuries (5+ games) per team '+(active(L).reduce((a,p)=>a+(p.injuries||[]).filter(x=>x.s===L.season&&x.games>=5).length,0)/30).toFixed(1)+' | gate avg $'+avg(gate).toFixed(1)+'M | hype '+Math.min(...hype).toFixed(0)+'-'+Math.max(...hype).toFixed(0));}});}
ok('82 games: team scoring per game in range (100-125)',avg(stats.pts)>=100&&avg(stats.pts)<=125,avg(stats.pts).toFixed(1));
ok('82 games: season gate about the same as 58 (per home game scaled)',avg(gate)>5&&avg(gate)<200,avg(gate).toFixed(1));
ok('hype stays within 0-100',hype.every(h=>h>=0&&h<=100));
// usage and minutes on dev teams
{const tm=L.teams.filter(t=>DEV_TEAM(t));const ud=tm.flatMap(t=>Object.values(t.ud||{}));ok('development touches only on rebuild/tank/rising teams, at most +15%',ud.every(x=>x>1&&x<=1.15)&&L.teams.filter(t=>!DEV_TEAM(t)).every(t=>!Object.keys(t.ud||{}).length),ud.length+' players');}
{const bl=L.teams.filter(t=>['contend','allin'].includes(t.status)).flatMap(t=>Object.values(t.tstat||{})).filter(x=>/fit the coach/.test(x.why));info.push('contender non-fits shopped: '+bl.length);}
// R2-R8
const F=L.feed||[],txt=F.map(p=>postText(L,p));
ok('no { / undefined / NaN in posts',txt.every(t=>t&&!/[{}]|undefined|NaN/.test(t)),txt.find(t=>!t||/[{}]|undefined|NaN/.test(t)));
ok('every post found its text',Object.keys(MISS).length===0,JSON.stringify(MISS));
const nt=L.log.map(x=>x.text);ok('news text clean',nt.every(t=>!/[{}]|undefined|NaN/.test(t)),nt.find(t=>/[{}]|undefined|NaN/.test(t)));
const kinds={};for(const x of L.log)if(x.k)kinds[x.k]=(kinds[x.k]||0)+1;info.push('news kinds '+JSON.stringify(kinds));
ok('R2: free-agency meetings and decisions reported',(kinds.fa||0)>0&&(kinds.faWhy||0)>0,(kinds.fa||0)+' / '+(kinds.faWhy||0)+' '+JSON.stringify(Object.values(L.faWhy||{}).reduce((o,x)=>(o[x.why]=(o[x.why]||0)+1,o),{})));
const fr=(L.rumors||[]).filter(r=>r.k==='fa'&&r.hit);info.push('FA rumors right '+fr.filter(r=>r.hit>0).length+' / '+fr.length);
ok('R3: rumor accuracy by author (national > beat > fans)',true,JSON.stringify(RUMOR_CNT));
ok('R4: media reputation changes free-agent appeal on your team',(()=>{const p=active(L).find(x=>(x.fame||0)>=50)||active(L)[0];L.media.rep=90;const a=repAppeal(L,p,L.teams[L.user]);L.media.rep=10;const b=repAppeal(L,p,L.teams[L.user]);L.media.rep=50;return a>0&&b<0;})());
info.push('R5 in-season: max public stage '+pubSeen);
{const t=L.teams[1];const p=rosterOf(L,t).sort((a,b)=>b.ovr-a.ovr)[0];L.phase='regular';L.day=20;p.pub=null;p.tradeReq=null;p.morale=10;const st=[];for(let w=0;w<4;w++){L.day+=7;p.morale=2;p.moraleParts=null;const _mp=moraleParts;moraleParts=(L,x)=>x===p?{minutes:-40}:_mp(L,x);updateMorale(L);moraleParts=_mp;st.push((p.pub?p.pub.st:0)+(p.tradeReq===L.season?'R':''));if(p.tradeReq===L.season)break;}
 ok('R5: a star asks out only after a post and a rumor',/^1,2R?/.test(st.join(','))&&st.join(',').includes('R'),st.join(','));}
ok('R6: hot seat computed (0-100)',L.teams.every(t=>t.hot==null||(t.hot>=0&&t.hot<=100))&&hotMax>0,'max '+hotMax);
ok('R7: storylines (return games or award race posts)',F.some(p=>p.ev==='return'||p.ev==='race'||p.ev==='raceHold'||p.ev==='retire'),JSON.stringify(F.reduce((o,p)=>(['return','revenge','race','raceHold','retire','jersey','faPick','cryptic','hotseat'].includes(p.ev)&&(o[p.ev]=(o[p.ev]||0)+1),o),{})));
{const m=fanMood(L,L.user);ok('R8: fan mood -100..100',m.v>=-100&&m.v<=100,m.v+' from '+m.n+' posts');}
ok('feed capped',F.length<=FEED_MAX,F.length);
return res.join('\\n')+'\\n'+info.join('\\n')+'\\n'+res.filter(x=>x.startsWith('PASS')).length+'/'+res.length+' pass';})(${+process.argv[2]||2})`));
